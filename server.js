const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Environment configuration
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let server;

// Graceful shutdown function
const gracefulShutdown = (signal) => {
    console.log(`\n${new Date().toISOString()} - Received ${signal}. Starting graceful shutdown...`);

    if (server) {
        server.close((err) => {
            if (err) {
                console.error(`${new Date().toISOString()} - Error during server shutdown:`, err);
                process.exit(1);
            }

            console.log(`${new Date().toISOString()} - Server closed successfully`);
            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            console.error(`${new Date().toISOString()} - Could not close connections in time, forcefully shutting down`);
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
};

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // PM2 reload signal

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`${new Date().toISOString()} - Uncaught Exception:`, err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`${new Date().toISOString()} - Unhandled Rejection at:`, promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the application
app.prepare().then(() => {
    server = createServer(async (req, res) => {
        try {
            // Parse URL
            const parsedUrl = parse(req.url, true);

            // Add request logging
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.headers['user-agent'] || 'Unknown'}`);

            // Handle the request
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error(`${new Date().toISOString()} - Error handling request:`, err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    // Set server timeout for long-running SSE connections
    server.timeout = 0; // Disable timeout for SSE connections
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds

    // Start listening
    server.listen(port, hostname, (err) => {
        if (err) {
            console.error(`${new Date().toISOString()} - Failed to start server:`, err);
            throw err;
        }

        console.log(`${new Date().toISOString()} - Server ready on http://${hostname}:${port}`);
        console.log(`${new Date().toISOString()} - Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`${new Date().toISOString()} - Process ID: ${process.pid}`);
    });

    // Handle server errors
    server.on('error', (err) => {
        console.error(`${new Date().toISOString()} - Server error:`, err);
        if (err.code === 'EADDRINUSE') {
            console.error(`${new Date().toISOString()} - Port ${port} is already in use`);
            process.exit(1);
        }
    });

    // Log when server is closing
    server.on('close', () => {
        console.log(`${new Date().toISOString()} - Server is closing...`);
    });

}).catch((ex) => {
    console.error(`${new Date().toISOString()} - Failed to prepare Next.js app:`, ex);
    process.exit(1);
});

// Health check endpoint can be added here if needed
// This is useful for load balancers and monitoring 