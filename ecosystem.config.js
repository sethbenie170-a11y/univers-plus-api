// Déploiement sur un VPS avec PM2 : pm2 start ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name: 'univers-plus-api',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
    },
  ],
};
