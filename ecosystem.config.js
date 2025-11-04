module.exports = {
  apps: [
    {
      name: 'politiker-api',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
    },
    {
      name: 'auto-scraper',
      script: './src/scripts/auto-scraper.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 */6 * * *', // Alle 6 Stunden
      autorestart: false, // Nur durch Cron starten
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/auto-scraper-error.log',
      out_file: './logs/auto-scraper-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

