/**
 * PM2 — recedu.co
 * Ajusta `cwd` a la ruta real en la VPS (ej. /var/www/recedu/...).
 * Tras instalar dependencias y build, desde la raíz del monorepo R.E.C-plus:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup   # seguir instrucciones (systemd + nvm)
 */

const path = require('path');

// VPS Contabo (david): ~/PAGINAS-WEB/R.E.C-plus — sobrescribe con RECEDU_BASE si cambia la ruta
const BASE = process.env.RECEDU_BASE || '/home/david/PAGINAS-WEB/R.E.C-plus';

module.exports = {
  apps: [
    {
      name: 'recedu-frontend',
      cwd: path.join(BASE, 'r.e.c-frontend'),
      script: 'npm',
      args: 'run start -- -p 3000',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
    {
      name: 'recedu-backend',
      cwd: path.join(BASE, 'r.e.c-backend'),
      script: 'dist/src/main.js',
      node_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
      },
    },
  ],
};
