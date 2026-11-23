/* Proceso principal de Electron: ventana, menú nativo, IPC, archivos e impresión. */
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { Aplicacion } from './app';
import { escribirLog } from './log';
import { esperarCodigoNube, iniciarSesionGoogle, prepararRetornoNube } from './google';
import { documentoImpresion } from '@shared/impresion';

let win: BrowserWindow | null = null;
let siaf: Aplicacion;
const NOMBRE = 'SIAF-WEB Simulador';
const archivoBD = () => process.env.SIAF_DB || path.join(app.getPath('userData'), 'siaf.sqlite');
const wasmDir = () => path.dirname(require.resolve('sql.js/dist/sql-wasm.wasm')).replace('app.asar', 'app.asar.unpacked');
const enviarMenu = (cmd: string) => win?.webContents.send('siaf:menu', cmd);

function menu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Archivo', submenu: [
      { label: 'Inicio', accelerator: 'CmdOrCtrl+H', click: () => enviarMenu('inicio') },
      { type: 'separator' },
      { label: 'Exportar copia de seguridad...', accelerator: 'CmdOrCtrl+S', click: () => enviarMenu('respaldo-exportar') },
      { label: 'Restaurar copia de seguridad...', click: () => enviarMenu('respaldo-importar') },
      { label: 'Generar archivo de entrega del estudiante...', click: () => enviarMenu('entrega') },
      { type: 'separator' },
      { label: 'Cerrar sesión', click: () => enviarMenu('logout') },
      { label: 'Salir', role: 'quit' }
    ] },
    { label: 'Editar', submenu: [{ label: 'Deshacer', role: 'undo' }, { label: 'Rehacer', role: 'redo' }, { type: 'separator' }, { label: 'Cortar', role: 'cut' }, { label: 'Copiar', role: 'copy' }, { label: 'Pegar', role: 'paste' }, { label: 'Seleccionar todo', role: 'selectAll' }] },
    { label: 'Ver', submenu: [{ label: 'Recargar', role: 'reload' }, { type: 'separator' }, { label: 'Tamaño normal', role: 'resetZoom' }, { label: 'Acercar', role: 'zoomIn' }, { label: 'Alejar', role: 'zoomOut' }, { type: 'separator' }, { label: 'Pantalla completa', role: 'togglefullscreen' }, { label: 'Herramientas de desarrollo', role: 'toggleDevTools', visible: !app.isPackaged }] },
    { label: 'Ayuda', submenu: [
      { label: 'Carpeta de datos', click: () => shell.openPath(app.getPath('userData')) },
      { label: 'Acerca de ' + NOMBRE, click: () => dialog.showMessageBox(win!, { type: 'info', title: 'Acerca de', message: `${NOMBRE} ${app.getVersion()}`, detail: `Plataforma SIAF-SP de práctica: Módulo de Ejecución, Operaciones en Línea, AERAF y MADAF.\nArquitectura: Electron · React · TypeScript · SQLite (esquema v${siaf.bd.version}).\nBase de datos: ${archivoBD()}` }) }
    ] }
  ]));
}

function crearVentana(): void {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700, show: false, title: NOMBRE, backgroundColor: '#06455c',
    icon: path.join(__dirname, '../../resources/icon.png'),
    webPreferences: { preload: path.join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, spellcheck: false }
  });
  win.once('ready-to-show', () => { if (!process.env.SIAF_SMOKE) win!.maximize(); win!.show(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => { if (!process.env.ELECTRON_RENDERER_URL) e.preventDefault(); });
  /* las pruebas automáticas (SIAF_DB) usan siempre la base local del equipo */
  const modo = process.env.SIAF_DB ? 'local' : process.env.SIAF_MODO;
  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL + (modo ? '?modo=' + modo : ''));
  else win.loadFile(path.join(__dirname, '../renderer/index.html'), modo ? { query: { modo } } : undefined);
  if (process.env.SIAF_SMOKE) prueba();
}

/* prueba automática: ejecuta un guion en la interfaz, captura la ventana y cierra */
function prueba(): void {
  win!.webContents.once('did-finish-load', () => setTimeout(async () => {
    try {
      if (process.env.SIAF_SMOKE_JS) await win!.webContents.executeJavaScript(process.env.SIAF_SMOKE_JS);
      await new Promise(r => setTimeout(r, 2500));
      fs.writeFileSync(process.env.SIAF_SMOKE!, (await win!.webContents.capturePage()).toPNG());
      fs.writeFileSync(process.env.SIAF_SMOKE + '.txt', await win!.webContents.executeJavaScript('document.body.innerText.slice(0,4000)'));
    } catch (e) { fs.writeFileSync(process.env.SIAF_SMOKE + '.txt', 'ERROR ' + (e as Error).message); }
    app.quit();
  }, 1500));
}

const html = documentoImpresion;

function ventanaOculta(contenido: string): Promise<BrowserWindow> {
  return new Promise(res => { const w = new BrowserWindow({ show: false, webPreferences: { javascript: false } }); w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(contenido)); w.webContents.once('did-finish-load', () => res(w)); });
}

function registrarIPC(): void {
  ipcMain.handle('siaf:invoke', (_e, metodo: string, args: unknown[]) => siaf.invocar(metodo, args || []));
  ipcMain.handle('siaf:google', async () => {
    const g = siaf.googleConfig;
    if (!g.clientId || !g.secreto) return { ok: false, error: 'El acceso con Google aún no está configurado. El Administrador debe registrar el ID y el secreto de cliente en SIAF Operaciones en Línea › Acceso con Google.' };
    try { const id = await iniciarSesionGoogle(g.clientId, g.secreto); win?.focus(); return siaf.invocarFn(() => siaf.loginGoogle(id)); }
    catch (e) { win?.focus(); return { ok: false, error: (e as Error).message }; }
  });
  ipcMain.handle('siaf:wasm', () => new Uint8Array(fs.readFileSync(path.join(wasmDir(), 'sql-wasm.wasm'))));
  ipcMain.handle('siaf:oauthPreparar', () => prepararRetornoNube());
  ipcMain.handle('siaf:oauthAbrir', async (_e, url: string) => { if (!url.startsWith('https://')) throw new Error('Dirección no válida.'); try { return await esperarCodigoNube(url); } finally { win?.focus(); } });
  ipcMain.handle('siaf:guardarTexto', async (_e, nombre: string, contenido: string, ext: string) => {
    const r = await dialog.showSaveDialog(win!, { defaultPath: path.join(app.getPath('documents'), nombre), filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
    if (r.canceled || !r.filePath) return { ok: false };
    fs.writeFileSync(r.filePath, contenido, 'utf8'); return { ok: true, data: r.filePath };
  });
  ipcMain.handle('siaf:abrirTexto', async (_e, ext: string[]) => {
    const r = await dialog.showOpenDialog(win!, { properties: ['openFile'], filters: [{ name: 'Archivo', extensions: ext }] });
    if (r.canceled || !r.filePaths[0]) return { ok: false };
    return { ok: true, data: { contenido: fs.readFileSync(r.filePaths[0], 'utf8'), nombre: path.basename(r.filePaths[0]) } };
  });
  ipcMain.handle('siaf:imprimir', async (_e, inner: string, titulo: string) => {
    const w = await ventanaOculta(html(inner, titulo));
    return new Promise(res => w.webContents.print({ printBackground: true }, ok => { w.close(); res({ ok }); }));
  });
  ipcMain.handle('siaf:pdf', async (_e, inner: string, nombre: string) => {
    const destino = process.env.SIAF_SMOKE_PDF || (await dialog.showSaveDialog(win!, { defaultPath: path.join(app.getPath('documents'), nombre), filters: [{ name: 'PDF', extensions: ['pdf'] }] })).filePath;
    if (!destino) return { ok: false };
    const w = await ventanaOculta(html(inner, nombre));
    fs.writeFileSync(destino, await w.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })); w.close();
    if (!process.env.SIAF_SMOKE_PDF) shell.openPath(destino);
    return { ok: true, data: destino };
  });
  ipcMain.handle('siaf:respaldoExportar', async () => {
    const r = await dialog.showSaveDialog(win!, { defaultPath: path.join(app.getPath('documents'), 'siaf-respaldo-' + new Date().toISOString().slice(0, 10) + '.sqlite'), filters: [{ name: 'Base de datos SIAF', extensions: ['sqlite'] }] });
    if (r.canceled || !r.filePath) return { ok: false };
    fs.writeFileSync(r.filePath, Buffer.from(siaf.bd.exportarBinario())); return { ok: true, data: r.filePath };
  });
  ipcMain.handle('siaf:respaldoImportar', async () => {
    const r = await dialog.showOpenDialog(win!, { properties: ['openFile'], filters: [{ name: 'Base de datos SIAF', extensions: ['sqlite'] }] });
    if (r.canceled || !r.filePaths[0]) return { ok: false };
    const ok = await dialog.showMessageBox(win!, { type: 'warning', buttons: ['Cancelar', 'Restaurar'], defaultId: 1, cancelId: 0, message: '¿Restaurar la copia de seguridad?', detail: 'Se reemplazarán todos los datos actuales y la aplicación se reiniciará.' });
    if (ok.response !== 1) return { ok: false };
    siaf.bd.cerrar(); fs.copyFileSync(r.filePaths[0], archivoBD()); app.relaunch(); app.exit(0); return { ok: true };
  });
}

/* una sola ventana por usuario; las pruebas (SIAF_DB) usan su propia base y pueden convivir con la app abierta */
if (!process.env.SIAF_DB && !app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(async () => {
    try {
      app.setAppUserModelId('pe.siafweb.simulador');
      siaf = await Aplicacion.iniciar(archivoBD(), wasmDir());
      siaf.ctx.eventos.on('cambio', d => win?.webContents.send('siaf:cambio', d));
      registrarIPC(); menu(); crearVentana();
    } catch (e) {
      escribirLog('Fallo al iniciar: ' + (e as Error).stack);
      dialog.showErrorBox(NOMBRE, 'No se pudo iniciar la aplicación: ' + (e as Error).message);
      app.quit();
    }
  });
  app.on('window-all-closed', () => app.quit());
  process.on('uncaughtException', e => escribirLog('uncaughtException: ' + e.stack));
}
