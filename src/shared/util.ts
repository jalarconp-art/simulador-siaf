/* Utilidades puras (sin dependencias de entorno) */
import type { Item } from './types';
import { CAT } from './catalogo';
import clasData from './data/clasificador.json';

export const r2 = (n: number): number => Math.round((+n || 0) * 100) / 100;
export const fmt = (n: number): string => r2(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const num = (v: unknown): number => { const x = parseFloat(String(v ?? '').replace(/,/g, '')); return isNaN(x) ? 0 : r2(x); };
export const pad = (n: number | string, l: number): string => String(n).padStart(l, '0');
export const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const dkey = (f: string): string => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f || ''); return m ? m[3] + m[2] + m[1] : ''; };
export const okDate = (f: string): boolean => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f || ''); if (!m) return false;
  const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1;
};
export const mesDe = (f: string): number => { const m = /^\d{2}\/(\d{2})\//.exec(f || ''); return m ? +m[1] : 1; };
export const anioDe = (f: string): number => { const m = /\/(\d{4})$/.exec(f || ''); return m ? +m[1] : 0; };
export const hoy = (): string => { const d = new Date(); return pad(d.getDate(), 2) + '/' + pad(d.getMonth() + 1, 2) + '/' + d.getFullYear(); };
export const hora = (): string => { const d = new Date(); return pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2); };
export const sumI = (items: { monto: number }[] | undefined): number => r2((items || []).reduce((a, i) => a + (+i.monto || 0), 0));
export const JUSTIF_RE = /^[A-Za-z0-9 ÑñÁÉÍÓÚáéíóúÜü/.\\$%º°;,:()\-\n]*$/;

/* clasificador presupuestario 2026 */
type Fila = [string, string, string];
export const CLAS_G = (clasData as { gastos: Fila[]; ingresos: Fila[] }).gastos;
export const CLAS_I = (clasData as { gastos: Fila[]; ingresos: Fila[] }).ingresos;
const CLAS = new Map<string, Fila>();
CLAS_G.forEach(r => CLAS.set(r[0], r));
CLAS_I.forEach(r => CLAS.set(r[0], r));
export const clasNom = (c: string): string => CLAS.get(c)?.[1] ?? '(clasificador no encontrado)';
export const clasExiste = (c: string): boolean => CLAS.has(c);

/* catálogo */
export const rubroNom = (r: string): string => (CAT.rubros.find(x => x[0] === r) || ['', ''])[1];
export const ffDeRubro = (r: string): string => (CAT.rubros.find(x => x[0] === r) || ['', '', ''])[2];
export const ffNom = (f: string): string => (CAT.fuentes.find(x => x[0] === f) || ['', ''])[1];
export const docNom = (c: string): string => ([...CAT.docs, ...CAT.docsCert, ...CAT.docsIng].find(x => x[0] === c) || ['', c])[1];
export const tipoOpNom = (c: string): string => (CAT.tiposOp.find(x => x[0] === c) || ['', c])[1];

/* mapas clasificador|meta → monto */
export type Mapa = Record<string, number>;
export const key = (i: { clas: string; meta?: string }): string => i.clas + '|' + (i.meta || '');
export function addMap(m: Mapa, items: Item[] | undefined, sg = 1): Mapa {
  (items || []).forEach(i => { const k = key(i); m[k] = r2((m[k] || 0) + sg * (+i.monto || 0)); });
  return m;
}
export const mapTot = (m: Mapa): number => r2(Object.values(m).reduce((a, b) => a + b, 0));
export function diffMap(a: Mapa, b: Mapa): Mapa { const m = { ...a }; Object.keys(b).forEach(k => { m[k] = r2((m[k] || 0) - b[k]); }); return m; }
export const mapToItems = (m: Mapa): Item[] => Object.keys(m).filter(k => Math.abs(m[k]) > 0.001).map(k => ({ clas: k.split('|')[0], meta: k.split('|')[1], monto: m[k] }));
