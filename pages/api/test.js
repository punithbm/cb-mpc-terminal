import fs from 'fs';

export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    try {
        // Test if we can access the log directory
        const logDir = '/var/log/threshold-ecdsa-web';
        const logFiles = [];

        if (fs.existsSync(logDir)) {
            const files = fs.readdirSync(logDir);
            files.forEach(file => {
                if (file.startsWith('threshold-ecdsa-web-') && file.endsWith('.log')) {
                    const filePath = `${logDir}/${file}`;
                    const stats = fs.statSync(filePath);
                    logFiles.push({
                        name: file,
                        path: filePath,
                        size: stats.size,
                        modified: stats.mtime,
                        readable: true
                    });
                }
            });
        }

        res.status(200).json({
            success: true,
            logDir: logDir,
            logDirExists: fs.existsSync(logDir),
            logFiles: logFiles,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
} 