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

  // Try different approaches to access logs
  const tryJournalctl = () => {
    // First try with sudo (if available)
    const journalctl = spawn('sudo', [
      'journalctl',
      '-u', `threshold-ecdsa-web@${index}.service`,
      '-f', // Follow mode (like tail -f)
      '-o', 'cat', // Output format without timestamps
      '--no-pager' // Disable pager
    ]);

    journalctl.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          res.write(`data: ${line}\n\n`);
        }
      }
    });

    journalctl.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      console.error(`journalctl stderr: ${errorMsg}`);

      // If sudo fails, try without sudo
      if (errorMsg.includes('permission') || errorMsg.includes('not allowed')) {
        console.log('Trying without sudo...');
        journalctl.kill();
        tryWithoutSudo();
      } else {
        res.write(`data: [ERROR] ${errorMsg}\n\n`);
      }
    });

    journalctl.on('close', (code) => {
      console.log(`journalctl process exited with code ${code}`);
      if (code !== 0) {
        res.write(`data: [INFO] Log stream ended with code ${code}\n\n`);
        res.end();
      }
    });

    return journalctl;
  };

  const tryWithoutSudo = () => {
    // Try without sudo (might work if user has journal access)
    const journalctl = spawn('journalctl', [
      '-u', `threshold-ecdsa-web@${index}.service`,
      '-f', // Follow mode (like tail -f)
      '-o', 'cat', // Output format without timestamps
      '--no-pager' // Disable pager
    ]);

    journalctl.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          res.write(`data: ${line}\n\n`);
        }
      }
    });

    journalctl.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      console.error(`journalctl stderr (no sudo): ${errorMsg}`);

      // If still fails, try reading from log files directly
      if (errorMsg.includes('permission') || errorMsg.includes('not allowed')) {
        console.log('Trying to read log files directly...');
        journalctl.kill();
        tryLogFiles();
      } else {
        res.write(`data: [ERROR] ${errorMsg}\n\n`);
      }
    });

    journalctl.on('close', (code) => {
      console.log(`journalctl process (no sudo) exited with code ${code}`);
      if (code !== 0) {
        res.write(`data: [INFO] Log stream ended with code ${code}\n\n`);
        res.end();
      }
    });

    return journalctl;
  };

  const tryLogFiles = () => {
    // Try reading from systemd log files directly
    const logPaths = [
      `/var/log/journal/*/system.journal`,
      `/var/log/syslog`,
      `/var/log/messages`
    ];

    res.write(`data: [INFO] Attempting to read log files directly...\n\n`);

    // For now, just show a message about the permission issue
    res.write(`data: [ERROR] Permission denied accessing system logs.\n\n`);
    res.write(`data: [INFO] To fix this, run the following commands on the server:\n\n`);
    res.write(`data: [INFO] 1. Add your user to the systemd-journal group:\n\n`);
    res.write(`data: [INFO]    sudo usermod -a -G systemd-journal $USER\n\n`);
    res.write(`data: [INFO] 2. Or configure sudo access for journalctl:\n\n`);
    res.write(`data: [INFO]    echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/journalctl" | sudo tee /etc/sudoers.d/journalctl\n\n`);
    res.write(`data: [INFO] 3. Restart the application after making changes.\n\n`);

    res.end();
  };

  let journalctl = null;

  // Start with sudo approach
  try {
    journalctl = tryJournalctl();
  } catch (error) {
    console.error('Failed to start journalctl:', error);
    res.write(`data: [ERROR] Failed to start log stream: ${error.message}\n\n`);
    res.end();
  }

  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client disconnected from threshold-ecdsa-web@${index} log stream`);
    if (journalctl && !journalctl.killed) {
      journalctl.kill();
    }
  });
}
