import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const VMIX_HOST = '127.0.0.1';
const VMIX_PORT = 8088;

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
  banColorStart: "#880000",
  banColorEnd: "#111111",
  pickColorStart: "#006400",
  pickColorEnd: "#111111",
  deciderColorStart: "#ca8a04",
  deciderColorEnd: "#111111",
  scale: 1,
  verticalGap: 12,
  horizontalOffset: 60, // distance from center
  verticalOffset: 180, // top position
  fontSize: 24,
  fontFamily: "Arial",
  customFonts: []
};

// In-Memory State Store
let appState = {
  teamAName: "Team A",
  teamBName: "Team B",
  // Maps are stored here but NOT sent in generic /api/state GET requests
  maps: [], 
  steps: [],
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
  appState = { ...appState, ...otherRest };

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

  const options = {
    hostname: VMIX_HOST,
    port: VMIX_PORT,
    path: '/api' + queryString,
    method: 'GET'
  };

  const request = http.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => data += chunk);
    response.on('end', () => res.status(response.statusCode || 200).send(data));
  });

  request.on('error', (e) => {
    res.status(502).json({ error: 'Failed to connect to vMix' });
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