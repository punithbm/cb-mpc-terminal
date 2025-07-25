// API endpoint to stream logs from log files
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

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

  // Define log file paths - adjust these based on your setup
  const logFilePaths = [
    `/var/log/threshold-ecdsa-web/threshold-ecdsa-web-${index}.log`
  ];

  // Find the first existing log file
  let logFilePath = null;
  for (const path of logFilePaths) {
    try {
      if (fs.existsSync(path)) {
        logFilePath = path;
        break;
      }
    } catch (error) {
      console.log(`Cannot access ${path}: ${error.message}`);
    }
  }

  if (!logFilePath) {
    // If no log file exists, try to create one and start a log collection process
    logFilePath = `/tmp/threshold-ecdsa-web-${index}.log`;

    // Send initial message
    res.write(`data: [INFO] No existing log file found. Creating new log file at ${logFilePath}\n\n`);
    res.write(`data: [INFO] Starting log collection for threshold-ecdsa-web@${index}...\n\n`);

    // Start a process to collect logs and write to file
    const logCollector = spawn('sh', ['-c', `
      # Create log directory if it doesn't exist
      mkdir -p $(dirname ${logFilePath})
      
      # Try to collect logs using various methods and write to file
      while true; do
        # Try journalctl first
        if command -v journalctl >/dev/null 2>&1; then
          journalctl -u threshold-ecdsa-web@${index}.service -f --output=cat 2>/dev/null || \
          sudo journalctl -u threshold-ecdsa-web@${index}.service -f --output=cat 2>/dev/null || \
          echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] No journalctl access, trying alternative methods..."
        fi
        
        # Try to read from system log files
        tail -f /var/log/syslog | grep "threshold-ecdsa-web" 2>/dev/null || \
        tail -f /var/log/messages | grep "threshold-ecdsa-web" 2>/dev/null || \
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] Waiting for logs..."
        
        sleep 5
      done
    `], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Stream the collected logs
    logCollector.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          res.write(`data: ${line}\n\n`);
        }
      }
    });

    logCollector.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      console.error(`Log collector stderr: ${errorMsg}`);
      res.write(`data: [ERROR] ${errorMsg}\n\n`);
    });

    logCollector.on('close', (code) => {
      console.log(`Log collector process exited with code ${code}`);
      res.write(`data: [INFO] Log collection ended with code ${code}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client disconnected from threshold-ecdsa-web@${index} log stream`);
      if (logCollector && !logCollector.killed) {
        logCollector.kill();
      }
    });

    return;
  }

  // Send initial connection message
  res.write(`data: [INFO] Connected to log file: ${logFilePath}\n\n`);

  // Function to read last N lines from file
  const getLastLines = async (filepath, n = 10) => {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      return lines.slice(-n);
    } catch (error) {
      console.error(`Error reading log file: ${error.message}`);
      return [];
    }
  };

  // Send initial history
  getLastLines(logFilePath, 20).then(history => {
    res.write(`data: [INFO] Loading recent log history...\n\n`);
    history.forEach(line => {
      if (line.trim()) {
        res.write(`data: ${line}\n\n`);
      }
    });
    res.write(`data: [INFO] Live log stream started\n\n`);
  });

  // Use tail -f to follow the log file
  const tailProcess = spawn('tail', ['-f', logFilePath], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Handle stdout data (new log lines)
  tailProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        res.write(`data: ${line}\n\n`);
      }
    }
  });

  // Handle stderr data
  tailProcess.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    console.error(`tail stderr: ${errorMsg}`);

    // If tail fails, try alternative approach
    if (errorMsg.includes('No such file') || errorMsg.includes('Permission denied')) {
      console.log('Tail failed, trying alternative file watching...');
      tailProcess.kill();

      // Fallback: use fs.watch
      try {
        const watcher = fs.watch(logFilePath, (eventType, filename) => {
          if (eventType === 'change') {
            // Read the file and send new content
            fs.readFile(logFilePath, 'utf8', (err, data) => {
              if (!err) {
                const lines = data.split('\n');
                const lastLine = lines[lines.length - 1];
                if (lastLine.trim()) {
                  res.write(`data: ${lastLine}\n\n`);
                }
              }
            });
          }
        });

        req.on('close', () => {
          watcher.close();
        });
      } catch (watchError) {
        console.error('File watching failed:', watchError);
        res.write(`data: [ERROR] Cannot access log file: ${watchError.message}\n\n`);
        res.end();
      }
    } else {
      res.write(`data: [ERROR] ${errorMsg}\n\n`);
    }
  });

  // Handle process exit
  tailProcess.on('close', (code) => {
    console.log(`tail process exited with code ${code}`);
    if (code !== 0) {
      res.write(`data: [INFO] Log stream ended with code ${code}\n\n`);
      res.end();
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log(`Client disconnected from threshold-ecdsa-web@${index} log stream`);
    if (tailProcess && !tailProcess.killed) {
      tailProcess.kill();
    }
  });
}
