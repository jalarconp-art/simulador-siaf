import { defineConfig } from '@playwright/test';

/* Pruebas de la versión web (modo local de demostración, sin variables de Supabase) en Microsoft Edge. */
export default defineConfig({
  testDir: 'tests/web',
  timeout: 180000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5181', channel: 'msedge', viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure' },
  webServer: { command: 'npx vite preview --config vite.web.config.ts --port 5181 --strictPort', url: 'http://localhost:5181', reuseExistingServer: false, timeout: 60000 }
});
