const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3005;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Log streaming server started on port ${PORT}`);

// Store active connections and their tail processes
const connections = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'subscribe' && data.index) {
                const index = data.index;
                const logFilePath = `/var/log/threshold-ecdsa-web/threshold-ecdsa-web-${index}.log`;

                console.log(`Client subscribing to logs for index ${index}: ${logFilePath}`);

                // Check if log file exists
                if (!fs.existsSync(logFilePath)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Log file not found: ${logFilePath}`
                    }));
                    return;
                }

                // Kill existing tail process for this connection
                if (connections.has(ws)) {
                    const existingProcess = connections.get(ws);
                    if (existingProcess && !existingProcess.killed) {
                        existingProcess.kill();
                    }
                }

                // Send initial history
                try {
                    const content = fs.readFileSync(logFilePath, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());
                    const history = lines.slice(-20); // Last 20 lines

                    ws.send(JSON.stringify({
                        type: 'history',
                        lines: history
                    }));

                    ws.send(JSON.stringify({
                        type: 'info',
                        message: 'Live log stream started'
                    }));
                } catch (error) {
                    console.error('Error reading log history:', error);
                }

                // Start tail process
                const tailProcess = spawn('tail', ['-f', logFilePath], {
                    stdio: ['ignore', 'pipe', 'pipe']
                });

                connections.set(ws, tailProcess);

                tailProcess.stdout.on('data', (data) => {
                    const lines = data.toString().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            ws.send(JSON.stringify({
                                type: 'log',
                                line: line
                            }));
                        }
                    });
                });

                tailProcess.stderr.on('data', (data) => {
                    console.error(`Tail stderr for index ${index}:`, data.toString());
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Tail error: ${data.toString()}`
                    }));
                });

                tailProcess.on('close', (code) => {
                    console.log(`Tail process for index ${index} closed with code ${code}`);
                    connections.delete(ws);
                });

                ws.send(JSON.stringify({
                    type: 'subscribed',
                    index: index
                }));
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Clean up tail process
        if (connections.has(ws)) {
            const tailProcess = connections.get(ws);
            if (tailProcess && !tailProcess.killed) {
                tailProcess.kill();
            }
            connections.delete(ws);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down log server...');
    wss.close(() => {
        console.log('Log server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Shutting down log server...');
    wss.close(() => {
        console.log('Log server closed');
        process.exit(0);
    });
}); 