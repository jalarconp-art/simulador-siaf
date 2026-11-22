/* Genera los íconos de la aplicación a partir del logotipo (ejecutar con: electron tools/icono.js).
   Salidas: resources/icon.png (256), build/icon.png (512), build/icon.ico (16-256, PNG embebido) y src/web/public/favicon.svg */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="52" fill="#0e8ab5"/><circle cx="128" cy="112" r="56" fill="none" stroke="#fff" stroke-width="24"/><circle cx="128" cy="112" r="17" fill="#fff"/><text x="128" y="222" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="800" font-size="46" fill="#fff" letter-spacing="4">SIAF</text></svg>`;

function ico(pngs) {
  const cab = Buffer.alloc(6); cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(pngs.length, 4);
  let off = 6 + 16 * pngs.length; const dirs = [];
  for (const { tam, buf } of pngs) {
    const d = Buffer.alloc(16);
    d.writeUInt8(tam >= 256 ? 0 : tam, 0); d.writeUInt8(tam >= 256 ? 0 : tam, 1); d.writeUInt8(0, 2); d.writeUInt8(0, 3);
    d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(buf.length, 8); d.writeUInt32LE(off, 12);
    off += buf.length; dirs.push(d);
  }
  return Buffer.concat([cab, ...dirs, ...pngs.map(p => p.buf)]);
}

app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 512, height: 512, show: false, frame: false, transparent: true, useContentSize: true, webPreferences: { offscreen: true } });
  await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<html><body style="margin:0;background:transparent">${svg.replace('viewBox', 'width="512" height="512" viewBox')}</body></html>`));
  await new Promise(r => setTimeout(r, 700));
  const img = await w.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const png = tam => img.resize({ width: tam, height: tam, quality: 'best' }).toPNG();
  fs.writeFileSync(path.join(raiz, 'build/icon.png'), png(512));
  fs.writeFileSync(path.join(raiz, 'resources/icon.png'), png(256));
  fs.writeFileSync(path.join(raiz, 'build/icon.ico'), ico([16, 24, 32, 48, 64, 128, 256].map(tam => ({ tam, buf: png(tam) }))));
  fs.writeFileSync(path.join(raiz, 'src/web/public/favicon.svg'), svg);
  app.quit();
});
