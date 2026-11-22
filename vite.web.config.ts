/* Compilación de la versión web (navegador) para publicar en Vercel. Salida: dist-web/ */
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: resolve(__dirname, 'src/web'),
  publicDir: resolve(__dirname, 'src/web/public'),
  envDir: __dirname,
  resolve: { alias: { '@shared': resolve(__dirname, 'src/shared'), '@': resolve(__dirname, 'src/renderer/src') } },
  plugins: [react()],
  build: { outDir: resolve(__dirname, 'dist-web'), emptyOutDir: true, chunkSizeWarningLimit: 3000, target: 'es2022' },
  server: { port: 5180 },
  preview: { port: 5180 }
});
