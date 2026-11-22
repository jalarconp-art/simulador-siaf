/* Bitácora técnica de errores en la carpeta de datos de la aplicación. */
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export function escribirLog(msg: string): void {
  try {
    const f = path.join(app.getPath('userData'), 'logs', 'siaf.log');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.appendFileSync(f, `[${new Date().toISOString()}] ${msg}\n`);
  } catch { /* sin acceso al disco */ }
}
