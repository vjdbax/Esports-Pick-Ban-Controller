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

// Middleware
app.use(express.json({ limit: '50mb' }));

// Enable CORS for all routes to allow split dev/prod setups
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
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// In-Memory State Store
let appState = {
  teamAName: "Team A",
  teamBName: "Team B",
  maps: [],
  steps: [], // Will be populated by client on init
  selections: {},
  visibleSteps: []
};

// --- API: State Management ---

app.get('/api/state', (req, res) => {
  res.json(appState);
});

app.post('/api/state', (req, res) => {
  // Update state with provided fields
  appState = { ...appState, ...req.body };
  console.log(`[API] State updated. Triggered steps: ${appState.visibleSteps?.length}`);
  res.json({ success: true, state: appState });
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

// Serve static files
app.use(express.static(__dirname));

// Routing for SPA
// Use Regex (/.*/) instead of '*' string to avoid "Missing parameter name" error in newer Express/path-to-regexp versions
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Controller: http://localhost:${PORT}`);
  console.log(`Overlay:    http://localhost:${PORT}/overlay`);
});