const { app, BrowserWindow } = require('electron');
const fs = require('fs'); const path = require('path');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="52" fill="#0e8ab5"/><circle cx="128" cy="112" r="56" fill="none" stroke="#fff" stroke-width="24"/><circle cx="128" cy="112" r="17" fill="#fff"/><text x="128" y="222" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="800" font-size="46" fill="#fff" letter-spacing="4">SIAF</text></svg>`;
app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 256, height: 256, show: false, frame: false, transparent: true, useContentSize: true, webPreferences: { offscreen: true } });
  await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`));
  await new Promise(r => setTimeout(r, 600));
  const img = await w.webContents.capturePage({ x: 0, y: 0, width: 256, height: 256 });
  fs.writeFileSync(path.join(process.argv[2], 'icon.png'), img.resize({ width: 256, height: 256 }).toPNG());
  fs.writeFileSync(path.join(process.argv[3], 'favicon.svg'), svg);
  app.quit();
});
