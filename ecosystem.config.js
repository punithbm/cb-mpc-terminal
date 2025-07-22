module.exports = {
    apps: [
        {
            name: 'cb-mpc-terminal',
            script: './server.js',
            instances: 1,
            exec_mode: 'fork',

            // Environment variables
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOSTNAME: '127.0.0.1', // Change to localhost for nginx proxy
            },

            // Development environment
            env_development: {
                NODE_ENV: 'development',
                PORT: 3000,
                HOSTNAME: '127.0.0.1',
            },

            // Staging environment  
            env_staging: {
                NODE_ENV: 'production',
                PORT: 3001,
                HOSTNAME: '127.0.0.1',
            },

            // PM2 Configuration
            watch: false,
            ignore_watch: [
                'node_modules',
                '.next',
                '.git',
                'logs'
            ],

            // Logging
            log_file: './logs/combined.log',
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Auto-restart configuration
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '500M',

            // Graceful shutdown
            kill_timeout: 10000,
            wait_ready: false,
            listen_timeout: 8000,

            // Advanced PM2 features
            node_args: '--max-old-space-size=1024',
        }
    ]
}; 