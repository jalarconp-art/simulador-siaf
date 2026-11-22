/* Base de datos del escritorio: archivo SQLite en el equipo con escritura atómica (tmp + rename). */
import fs from 'fs';
import path from 'path';
import { BaseDatos } from './database';

export function abrirArchivo(archivo: string | null, wasmDir?: string): Promise<BaseDatos> {
  return BaseDatos.abrir({
    datos: archivo && fs.existsSync(archivo) ? fs.readFileSync(archivo) : null,
    locateFile: wasmDir ? (f: string) => path.join(wasmDir, f) : undefined,
    alPersistir: archivo ? bin => {
      const tmp = archivo + '.tmp';
      fs.mkdirSync(path.dirname(archivo), { recursive: true });
      fs.writeFileSync(tmp, Buffer.from(bin));
      fs.renameSync(tmp, archivo);
    } : undefined
  });
}
