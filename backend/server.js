const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const readline = require('readline');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── START PYTHON DAEMON ──────────────────────────────────────────────────
// We start Python ONCE. It loads Neuralfoil into memory and stays awake.
// This is 100x faster than spawning Python for every single click.
// Priority: Check for local virtual environment first (fixes Arch/Garuda setup)
const fs = require('fs');
const path = require('path');

const venvPython = process.platform === 'win32' 
  ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
  : path.join(__dirname, 'venv', 'bin', 'python');

const pythonCmd = fs.existsSync(venvPython) ? venvPython : (process.platform === 'win32' ? 'python' : 'python3');

const pythonProcess = spawn(pythonCmd, ['run_nf.py', '--daemon']);

// We queue requests because they are processed sequentially by the Python pipe.
const requestQueue = [];

// We use readline to perfectly parse each JSON output line from Python
const rl = readline.createInterface({
  input: pythonProcess.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const reqDesc = requestQueue.shift();
  if (!reqDesc) return;
  
  try {
    const parsed = JSON.parse(line);
    if (parsed.error) return reqDesc.res.status(400).json(parsed);
    reqDesc.res.json(parsed);
  } catch (e) {
    console.error('Failed to parse Python JSON:', line);
    reqDesc.res.status(500).json({ error: 'Invalid JSON from Python' });
  }
});

pythonProcess.stderr.on('data', (data) => {
  // StdErr is used for Python's print statements so we can see startup logs
  console.log(`[Python]: ${data.toString().trim()}`);
});

pythonProcess.on('close', (code) => {
  console.error(`Python daemon unexpectedly closed with code ${code}`);
});

// ─── API ENDPOINTS ────────────────────────────────────────────────────────

app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is connected and running with fast Neuralfoil Daemon!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/log', (req, res) => {
  console.log('BROWSER LOG:', req.body);
  res.sendStatus(200);
});

app.post('/api/analyze', (req, res) => {
  if (pythonProcess.killed) {
    return res.status(500).json({ error: "Python daemon has died." });
  }

  // Enqueue the response object so the `rl.on('line')` event can resolve it
  requestQueue.push({ res });

  // Send request data to python STDIN as a single line
  const payload = JSON.stringify(req.body);
  pythonProcess.stdin.write(payload + '\n');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Firing up persistent Python Neuralfoil Daemon in the background...`);
});
