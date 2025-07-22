// API endpoint to stream logs from journalctl
import { spawn } from 'child_process';

export default function handler(req, res) {
  const { index } = req.query;

  // Validate index parameter to prevent command injection
  if (!index || typeof index !== 'string' || !/^\d+$/.test(index)) {
    return res.status(400).json({ error: 'Invalid index parameter' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Send initial connection message
  res.write(`data: Connected to threshold-ecdsa-web@${index} log stream\n\n`);

  // Spawn journalctl process
  const journalctl = spawn('journalctl', [
    '-u', `threshold-ecdsa-web@${index}.service`,
    '-f', // Follow mode (like tail -f)
    '-o', 'cat', // Output format without timestamps
    '--no-pager' // Disable pager
  ]);

  // Handle stdout data
  journalctl.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        res.write(`data: ${line}\n\n`);
      }
    }
  });

  // Handle stderr data
  journalctl.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    res.write(`data: [ERROR] ${data}\n\n`);
  });

  // Handle process exit
  journalctl.on('close', (code) => {
    console.log(`journalctl process exited with code ${code}`);
    res.write(`data: [INFO] Log stream ended with code ${code}\n\n`);
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client disconnected from threshold-ecdsa-web@${index} log stream`);
    journalctl.kill();
  });
}
