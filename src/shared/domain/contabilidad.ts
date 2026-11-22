/* Motor contable: correspondencia registro ↔ fase del caso, asientos en tres capas,
   partida doble, controles del ciclo y verificación contra la solución. */
import type { Comprobante, Doc, Ejecutora, Estado, Giro, Item, OpDef, Persona, SubcasoDef } from '../types';
import { caMap, vivo } from './saldos';
import { fmt, mapToItems, pad, r2, sumI } from '../util';

export const CAPA_P = 'Patrimonial', CAPA_PR = 'Presupuestaria', CAPA_O = 'De orden';
export type OpCod = OpDef['op'];

export interface Registro {
  op: OpCod; t: number; estado: Estado; fecha: string; doc: Doc | null; items: Item[]; total: number;
  prov?: Persona | null; justif: string; rubro?: string; ff?: string; tipoOp?: string; rol?: string; hist?: boolean;
  comp?: Comprobante[]; giro?: Giro | null; numero: string;
}
export function registrosDe(ej: Ejecutora, sub: string): Registro[] {
  const out: Registro[] = [];
  const R = (r: Omit<Registro, 'total'>) => out.push({ ...r, total: sumI(r.items) });
  ej.certs.filter(c => c.sub === sub).forEach(c => c.secs.forEach(s => {
    if (s.tipo === 'INICIAL') R({ op: 'cert', t: s.t, estado: s.estado, fecha: c.fecha, doc: c.doc, items: s.items, justif: c.justif, rubro: c.rubro, numero: pad(c.num, 10) });
    else if (s.tipo === 'AMPLIACION') R({ op: 'certAmp', t: s.t, estado: s.estado, fecha: s.fecha, doc: s.doc, items: s.items, justif: c.justif, rubro: c.rubro, numero: pad(c.num, 10) + '-' + pad(s.sec, 4) });
  }));
  ej.cas.filter(a => a.sub === sub).forEach(a => R({ op: 'ca', t: a.t, estado: a.estado, fecha: a.fecha, doc: a.doc, items: mapToItems(caMap(a)), prov: a.prov, justif: a.justif, tipoOp: a.tipoOp, numero: pad(a.num, 10) }));
  ej.exps.filter(e => e.sub === sub).forEach(e => e.secs.forEach(s => {
    const op: OpCod = s.fase === 'C' ? 'cm' : s.fase === 'D' ? (s.rend ? 'rend' : 'dev') : s.fase === 'G' ? 'gir' : s.fase === 'P' ? 'pag' : 't6';
    R({ op, t: s.t, estado: s.estado, fecha: s.fecha, doc: s.doc, items: s.items, prov: s.giro ? s.giro.benef : s.prov, justif: s.notas, rol: s.rol || (s.giro && s.giro.tipoGiro === 'REPOSICION' ? 'reposicion' : ''), hist: s.hist, comp: s.comp, giro: s.giro, tipoOp: e.tipoOp, numero: pad(e.num, 10) + '-' + pad(s.sec, 4) });
  }));
  ej.ings.filter(g => g.sub === sub).forEach(g => g.secs.forEach(s => R({ op: s.fase === 'D' ? 'det' : 'rec', t: s.t, estado: s.estado, fecha: s.fecha, doc: s.doc, items: s.items, justif: s.notas, rubro: g.rubro, ff: g.ff, numero: pad(g.num, 10) + '-' + pad(s.sec, 4) })));
  return out.sort((a, b) => a.t - b.t);
}

export interface FilaFase { o: OpDef | null; r: Registro | null }
export function mapearFases(ej: Ejecutora, sc: SubcasoDef): FilaFase[] {
  const regs = registrosDe(ej, sc.id).filter(r => !r.hist && vivo(r.estado));
  const usados = new Set<Registro>();
  const filas: FilaFase[] = sc.ops.filter(o => !o.hist).map(o => {
    const r = regs.find(x => !usados.has(x) && x.op === o.op && !(o.rol && x.rol && x.rol !== o.rol)) || null;
    if (r) usados.add(r);
    return { o, r };
  });
  regs.filter(r => !usados.has(r)).forEach(r => filas.push({ o: null, r }));
  return filas;
}

export interface LineaAs { n: number; capa: string; cta: string; den: string; d: number; h: number; com: string }
export interface Asientos { lines: LineaAs[]; sin?: string; pend?: string }
export const opTotal = (o: OpDef): number => r2((o.items || []).reduce((a, i) => a + i[2], 0));

export function asientosDe({ o, r }: FilaFase): Asientos {
  if (!o) return { pend: 'Registro adicional (no forma parte de la solución del caso)', lines: [] };
  if (!r) return { pend: 'Fase aún no registrada', lines: [] };
  if (r.estado !== 'APROBADO') return { pend: 'El asiento se genera cuando el registro está APROBADO (estado actual: ' + r.estado + ')', lines: [] };
  if (o.sin || !o.as) return { sin: o.sin || 'Sin asiento contable', lines: [] };
  const f = opTotal(o) ? r.total / opTotal(o) : 1;
  const porClas: Record<string, number> = {};
  r.items.forEach(i => { porClas[i.clas] = r2((porClas[i.clas] || 0) + i.monto); });
  const lines: LineaAs[] = o.as.map(l => {
    let d = l[4], h = l[5];
    if (l[7]) { const v = porClas[l[7]] || 0; if (d) d = v; if (h) h = v; } else { d = r2(d * f); h = r2(h * f); }
    return { n: l[0], capa: l[1], cta: l[2], den: l[3], d, h, com: l[6] || '' };
  });
  if (o.as.some(l => l[7])) { // cuadra la contrapartida patrimonial si cambian montos por clasificador
    const pat = lines.filter(x => x.capa === CAPA_P);
    const td = r2(pat.reduce((a, x) => a + x.d, 0)), th = r2(pat.reduce((a, x) => a + x.h, 0));
    const fix = lines.find((x, i) => x.capa === CAPA_P && !o.as![i][7]);
    if (fix && td !== th) { if (fix.h) fix.h = r2(fix.h + td - th); else fix.d = r2(fix.d + th - td); }
  }
  return { lines };
}
export const cuadra = (lines: LineaAs[]): boolean => Math.abs(lines.reduce((a, l) => a + l.d, 0) - lines.reduce((a, l) => a + l.h, 0)) < 0.01;

export type ResultadoControl = 'OK' | 'Revisar' | 'Pendiente';
export function controlesDe(sc: SubcasoDef, filas: FilaFase[]): [string, number, number, ResultadoControl][] {
  const tot = (spec: string) => {
    const [op, rol] = spec.split(':'); const m = /^(\w+)#(\d+)$/.exec(op);
    const sel = filas.filter(x => x.r && x.r.estado === 'APROBADO' && x.o && x.o.op === (m ? m[1] : op) && (!rol || x.o.rol === rol));
    const pick = m ? (sel[+m[2]] ? [sel[+m[2]]] : []) : sel;
    return { n: pick.length, v: r2(pick.reduce((a, x) => a + x.r!.total, 0)) };
  };
  const comps = () => filas.filter(x => x.r && x.r.comp).flatMap(x => x.r!.comp || []);
  return (sc.controles || []).map(([label, a, b, b2]) => {
    if (a === 'eq') {
      const A = (b as string[]).map(tot), B = (b2 as string[]).map(tot);
      const va = r2(A.reduce((s, x) => s + x.v, 0)), vb = r2(B.reduce((s, x) => s + x.v, 0));
      if (!A.some(x => x.n) || !B.some(x => x.n)) return [label, va, vb, 'Pendiente'];
      return [label, va, vb, Math.abs(va - vb) < 0.01 ? 'OK' : 'Revisar'];
    }
    if (a === 'maxcomp') {
      const c = comps().filter(z => !/PLANILLA/i.test(z.tipo));
      if (!c.length) return [label, 0, b, 'Pendiente'];
      const mx = Math.max(...c.map(z => +z.monto)); return [label, mx, b, mx <= b + 0.001 ? 'OK' : 'Revisar'];
    }
    if (a === 'dj') {
      const c = comps(); const dev = filas.find(x => x.o && x.o.op === 'dev' && x.r);
      if (!c.length || !dev) return [label, 0, 0, 'Pendiente'];
      const via = r2(dev.r!.items.filter(i => i.clas === '2.3.2.1.2.2').reduce((s, i) => s + i.monto, 0));
      const dj = r2(c.filter(z => /DECLARACION/i.test(z.tipo)).reduce((s, z) => s + (+z.monto), 0));
      const lim = r2(via * b); return [label, dj, lim, dj <= lim + 0.001 ? 'OK' : 'Revisar'];
    }
    const A = tot(a); const B = (b as string[]).map(tot); const vb = r2(B.reduce((s, x) => s + x.v, 0));
    if (!A.n || !B.some(x => x.n)) return [label, A.v, vb, 'Pendiente'];
    return [label, A.v, vb, A.v <= vb + 0.001 ? 'OK' : 'Revisar'];
  });
}

export interface Chequeo { lbl: string; esp: string; reg: string; ok: boolean }
export interface VerifFase { o: OpDef; r: Registro | null; checks: Chequeo[] }
export function verificar(ej: Ejecutora, sc: SubcasoDef): VerifFase[] {
  return mapearFases(ej, sc).filter(x => x.o).map(({ o, r }) => {
    const op = o as OpDef; const checks: Chequeo[] = [];
    const add = (lbl: string, esp: string, reg: string, ok: boolean) => checks.push({ lbl, esp, reg, ok });
    if (!r) return { o: op, r, checks: [{ lbl: 'Registro', esp: 'Debe registrarse', reg: '—', ok: false }] };
    add('Estado', 'APROBADO', r.estado, r.estado === 'APROBADO');
    const st = opTotal(op); add('Monto total', 'S/ ' + fmt(st), 'S/ ' + fmt(r.total), Math.abs(st - r.total) < 0.01);
    const agrupa = (arr: [string, number][]) => { const m: Record<string, number> = {}; arr.forEach(([c, v]) => { m[c] = r2((m[c] || 0) + v); }); return Object.keys(m).map(k => k + ' ' + fmt(m[k])).sort().join(' · '); };
    const ecs = agrupa(op.items.map(i => [i[0], i[2]])), rc = agrupa(r.items.map(i => [i.clas, i.monto]));
    add('Clasificador(es)', ecs, rc, ecs === rc);
    if (op.items[0] && op.items[0][1]) { const em = [...new Set(op.items.map(i => i[1]))].join(','), rm = [...new Set(r.items.map(i => i.meta))].join(','); add('Meta', em, rm, em === rm); }
    if (op.doc && r.doc) add('Código de documento', op.doc[0], r.doc.cod, op.doc[0] === r.doc.cod);
    if (op.op === 'det') add('Fuente / rubro', op.ff + ' / ' + op.rubro, (r.ff || '') + ' / ' + (r.rubro || ''), op.rubro === r.rubro);
    if (op.op === 'ca' && op.prov) { add('Tipo de operación', op.tipoOp || '', r.tipoOp || '', op.tipoOp === r.tipoOp); add('Proveedor', op.prov.join(' '), r.prov ? r.prov.tipo + ' ' + r.prov.num : '—', !!r.prov && r.prov.num === op.prov[1]); }
    if (op.op === 'rend') add('Comprobantes', (op.comp || []).length + ' comprobantes', (r.comp || []).length + ' comprobantes', (op.comp || []).length === (r.comp || []).length);
    if (op.op === 'gir' && op.ret && op.ret.length) { const esp = op.ret.reduce((a, x) => a + x[1], 0); const rr = r.giro ? sumI(r.giro.ret) : 0; add('Retenciones', 'S/ ' + fmt(esp), 'S/ ' + fmt(rr), Math.abs(rr - esp) < 0.01); }
    return { o: op, r, checks };
  });
}
export function puntaje(ej: Ejecutora, sc: SubcasoDef): { ok: number; total: number } {
  const all = verificar(ej, sc).flatMap(v => v.checks);
  return { ok: all.filter(c => c.ok).length, total: all.length };
}
