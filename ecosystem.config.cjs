/**
 * PM2 process file — run from repo root:
 *   npm run build --prefix client && pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'resuai',
      cwd: `${__dirname}/server`,
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
