const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is connected and running!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/log', (req, res) => {
  console.log('BROWSER LOG:', req.body);
  res.sendStatus(200);
});

app.post('/api/analyze', (req, res) => {
  const payload = JSON.stringify(req.body);
  
  const pythonProcess = spawn('./venv/bin/python', ['run_nf.py']);
  let resultData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    resultData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('Python Error:', errorData);
      return res.status(500).json({ error: errorData });
    }
    try {
      const parsed = JSON.parse(resultData);
      if (parsed.error) return res.status(400).json(parsed);
      res.json(parsed);
    } catch (e) {
      console.error('Failed to parse Python JSON:', resultData);
      res.status(500).json({ error: 'Invalid JSON from Python' });
    }
  });

  pythonProcess.stdin.write(payload);
  pythonProcess.stdin.end();
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
