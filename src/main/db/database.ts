/* Acceso a SQLite mediante sql.js (WebAssembly, sin compilación nativa).
   La base vive en memoria; tras cada transacción se entrega el binario al persistidor
   (en escritorio, escritura atómica en disco; en la web no se usa: los datos van a Supabase). */
import initSqlJs, { type Database, type SqlValue } from 'sql.js';
import { MIGRACIONES } from './schema';

export type Fila = Record<string, SqlValue>;
export interface OpcionesBD { datos?: Uint8Array | null; locateFile?: (archivo: string) => string; alPersistir?: (binario: Uint8Array) => void }

export class BaseDatos {
  private constructor(private db: Database, private alPersistir?: (binario: Uint8Array) => void) {}

  static async abrir(o: OpcionesBD = {}): Promise<BaseDatos> {
    const SQL = await initSqlJs(o.locateFile ? { locateFile: o.locateFile } : undefined);
    const bd = new BaseDatos(o.datos ? new SQL.Database(o.datos) : new SQL.Database(), o.alPersistir);
    bd.db.run('PRAGMA foreign_keys = ON;');
    bd.migrar();
    return bd;
  }
  private migrar(): void {
    this.db.run('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL, aplicada TEXT NOT NULL);');
    const actual = Number(this.valor('SELECT COALESCE(MAX(version),0) AS v FROM schema_version') || 0);
    for (let v = actual; v < MIGRACIONES.length; v++) {
      this.transaccion(() => {
        this.db.exec(MIGRACIONES[v]);
        this.run('INSERT INTO schema_version (version, aplicada) VALUES (?, ?)', [v + 1, new Date().toISOString()]);
      });
    }
  }
  get version(): number { return Number(this.valor('SELECT MAX(version) AS v FROM schema_version') || 0); }

  run(sql: string, params: SqlValue[] = []): void { this.db.run(sql, params); }
  todos(sql: string, params: SqlValue[] = []): Fila[] {
    const st = this.db.prepare(sql); st.bind(params);
    const out: Fila[] = []; while (st.step()) out.push(st.getAsObject() as Fila);
    st.free(); return out;
  }
  uno(sql: string, params: SqlValue[] = []): Fila | null { return this.todos(sql, params)[0] ?? null; }
  valor(sql: string, params: SqlValue[] = []): SqlValue { const f = this.uno(sql, params); return f ? Object.values(f)[0] : null; }

  private profundidad = 0;
  /** Ejecuta fn de forma atómica; si falla se revierte todo. Al terminar la transacción externa se persiste en disco. */
  transaccion<T>(fn: () => T): T {
    const externa = this.profundidad === 0;
    if (externa) this.db.run('BEGIN'); else this.db.run(`SAVEPOINT sp${this.profundidad}`);
    this.profundidad++;
    try {
      const r = fn();
      this.profundidad--;
      if (externa) { this.db.run('COMMIT'); this.persistir(); } else this.db.run(`RELEASE sp${this.profundidad}`);
      return r;
    } catch (e) {
      this.profundidad--;
      if (externa) this.db.run('ROLLBACK'); else this.db.run(`ROLLBACK TO sp${this.profundidad}`);
      throw e;
    }
  }
  persistir(): void { if (this.alPersistir) this.alPersistir(this.exportarBinario()); }
  /** export() reabre la base internamente: se restablecen los PRAGMA. */
  exportarBinario(): Uint8Array { const b = this.db.export(); this.db.run('PRAGMA foreign_keys = ON;'); return b; }
  cerrar(): void { this.db.close(); }
}
