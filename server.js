import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware - Increased limit to 500mb for large image payloads
app.use(express.json({ limit: '500mb' }));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request Logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && !req.path.startsWith('/api/state')) {
      console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Default Design State
const defaultDesign = {
  // Appending 'ff' to ensure 100% opacity by default if older clients connect, 
  // though the frontend handles hex normalization.
  banColorStart: "#880000ff", 
  banColorEnd: "#111111ff",
  pickColorStart: "#006400ff",
  pickColorEnd: "#111111ff",
  deciderColorStart: "#ca8a04ff",
  deciderColorEnd: "#111111ff",
  scale: 1,
  itemScale: 1,
  verticalGap: 12,
  horizontalOffset: 60, // distance from center
  verticalOffset: 180, // top position
  imageBorderWidth: 2, // default border width
  deciderOffsetX: 0,
  deciderOffsetY: 0,
  fontSize: 24,
  fontFamily: "Arial",
  customFonts: [],
  language: 'EN',
  vmixDelay: 4000, // 4 seconds default
  // vMix Connection Defaults
  vmixHost: '127.0.0.1',
  vmixPort: 8088
};

// Default Match Sequence (Hardcoded here to ensure server has valid state on startup)
// Added default customIds corresponding to their sequence
const DEFAULT_MATCH_SEQUENCE = [
  { id: 1, customId: "1", team: 'Team A', type: 'BAN' },
  { id: 2, customId: "2", team: 'Team B', type: 'BAN' },
  { id: 3, customId: "3", team: 'Team B', type: 'BAN' },
  { id: 4, customId: "4", team: 'Team A', type: 'BAN' },
  { id: 5, customId: "5", team: 'Team A', type: 'PICK' },
  { id: 6, customId: "6", team: 'Team B', type: 'PICK' },
  { id: 7, customId: "7", team: 'Team B', type: 'BAN' },
  { id: 8, customId: "8", team: 'Team A', type: 'BAN' },
  { id: 9, customId: "9", team: 'Team A', type: 'PICK' },
  { id: 10, customId: "10", team: 'Team B', type: 'PICK' },
  { id: 11, customId: "11", team: 'Team A', type: 'BAN' },
  { id: 12, customId: "12", team: 'Team B', type: 'BAN' },
  { id: 13, customId: "13", team: 'Team A', type: 'PICK' },
  { id: 14, customId: "14", team: 'Team B', type: 'PICK' },
  { id: 15, customId: "15", team: 'Team B', type: 'BAN' },
  { id: 16, customId: "16", team: 'Team A', type: 'BAN' },
  { id: 17, customId: "17", team: 'Team A', type: 'PICK' },
  { id: 18, customId: "18", team: 'Team B', type: 'PICK' },
  { id: 19, customId: "19", team: 'Team A', type: 'BAN' },
  { id: 20, customId: "20", team: 'Team B', type: 'BAN' },
  { id: 21, customId: "21", team: 'Team A', type: 'PICK' },
  { id: 22, customId: "22", team: 'Team B', type: 'PICK' },
  { id: 23, customId: "23", team: 'Decider', type: 'DECIDER' },
];

// In-Memory State Store
let appState = {
  teamAName: "Team A",
  teamBName: "Team B",
  // Maps are stored here but NOT sent in generic /api/state GET requests
  maps: [], 
  steps: DEFAULT_MATCH_SEQUENCE,
  selections: {},
  visibleSteps: [],
  design: defaultDesign,
  // Versioning for maps to let clients know when to re-fetch heavy data
  mapUpdateTs: Date.now() 
};

// --- API: State Management ---

// LIGHTWEIGHT POLLING ENDPOINT
app.get('/api/state', (req, res) => {
  // Destructure maps out, return everything else
  const { maps, ...lightState } = appState;
  res.json(lightState);
});

// HEAVY DATA ENDPOINT
app.get('/api/maps', (req, res) => {
  res.json(appState.maps);
});

// README ENDPOINT
app.get('/api/readme', (req, res) => {
    try {
        const readmePath = path.join(__dirname, 'README.md');
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf-8');
            res.json({ content });
        } else {
            res.json({ content: "# Readme not found\nPlease create a README.md file in the root directory." });
        }
    } catch (e) {
        console.error("Failed to read readme", e);
        res.status(500).json({ error: "Failed to read readme" });
    }
});

// UPDATE ENDPOINT
app.post('/api/state', (req, res) => {
  const { maps, ...rest } = req.body;

  // 1. Update lightweight fields
  // Deep merge for design object to prevent overwriting if partial data sent (though frontend sends full)
  if (rest.design) {
    appState.design = { ...appState.design, ...rest.design };
  }
  
  // Merge other top level keys
  const { design, ...otherRest } = rest;
  
  // Protect steps from being wiped with empty array if sent by accident
  if (otherRest.steps && Array.isArray(otherRest.steps) && otherRest.steps.length > 0) {
      appState.steps = otherRest.steps;
  }
  
  // Update other simple fields
  if (otherRest.teamAName !== undefined) appState.teamAName = otherRest.teamAName;
  if (otherRest.teamBName !== undefined) appState.teamBName = otherRest.teamBName;
  if (otherRest.selections !== undefined) appState.selections = otherRest.selections;
  if (otherRest.visibleSteps !== undefined) appState.visibleSteps = otherRest.visibleSteps;

  // 2. If maps are provided, update them and tick the version timestamp
  if (maps && Array.isArray(maps)) {
    appState.maps = maps;
    appState.mapUpdateTs = Date.now();
    console.log(`[API] Maps updated. Count: ${maps.length}`);
  }

  res.json({ success: true, mapUpdateTs: appState.mapUpdateTs });
});

// --- API: vMix Proxy (Legacy Support) ---

app.get('/api/vmix', (req, res) => {
  const queryIndex = req.url.indexOf('?');
  const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
  
  // Use dynamic configuration from state, fallback to localhost if missing
  const vmixHost = appState.design.vmixHost || '127.0.0.1';
  const vmixPort = appState.design.vmixPort || 8088;

  const options = {
    hostname: vmixHost,
    port: vmixPort,
    path: '/api' + queryString,
    method: 'GET'
  };

  const request = http.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => data += chunk);
    response.on('end', () => res.status(response.statusCode || 200).send(data));
  });

  request.on('error', (e) => {
    console.error(`[vMix Proxy Error] Could not connect to ${vmixHost}:${vmixPort}`, e.message);
    res.status(502).json({ error: `Failed to connect to vMix at ${vmixHost}:${vmixPort}` });
  });

  request.end();
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: "API Route not found" });
});

app.use(express.static(__dirname));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});