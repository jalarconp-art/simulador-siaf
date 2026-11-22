/* Fábrica de agregados: crea registros con numeración correlativa y la solución completa de cada caso. */
import type { CertSec, Certificado, CompromisoAnual, Doc, Ejecutora, Estado, Expediente, ExpSec, Ingreso, IngSec, Item, ModoEjecutora, TipoSecCert } from '../types';
import { CASOS } from '../casos';
import { CAT } from '../catalogo';
import { anioDe, ffDeRubro, mesDe, r2, uid } from '../util';

const T = (ej: Ejecutora): number => ++ej.tick;
export const items = (arr: [string, string, number][]): Item[] => arr.map(a => ({ clas: a[0], meta: a[1], monto: r2(a[2]) }));
export const docDe = (d: string[]): Doc => d.length === 4 ? { cod: d[0], serie: d[1], num: d[2], fecha: d[3] } : { cod: d[0], serie: '', num: d[1], fecha: d[2] };

export function ejecutoraVacia(id: string, modo: ModoEjecutora = 'vacio'): Ejecutora {
  const d = CASOS[id];
  return { id, modo, sub: d.subcasos[0].id, fechaSis: d.subcasos[0].ops[0].fecha, seq: { ...d.seq }, tick: 0, certs: [], cas: [], exps: [], ings: [], mods: [], provs: d.proveedores.map(p => ({ tipo: p[0], num: p[1], nom: p[2] })), aux: [] };
}
function correlativo(ej: Ejecutora, k: string, forzado?: number): number {
  if (forzado) { if (forzado > (ej.seq[k] || 0)) ej.seq[k] = forzado; return forzado; }
  ej.seq[k] = (ej.seq[k] || 0) + 1; return ej.seq[k];
}
export function nuevoCertificado(ej: Ejecutora, o: { num?: number; sub: string; fecha: string; doc: Doc; rubro: string; tipoCert: string; disp?: string; justif: string; items: Item[] }, estado: Estado = 'REGISTRADO'): Certificado {
  const c: Certificado = { id: uid(), t: T(ej), num: correlativo(ej, 'cert', o.num), sub: o.sub, mes: mesDe(o.fecha), anio: anioDe(o.fecha) || CASOS[ej.id].anio, doc: o.doc, rubro: o.rubro, ff: ffDeRubro(o.rubro), tipoCert: o.tipoCert, disp: o.disp || '', justif: o.justif, fecha: o.fecha, secs: [] };
  c.secs.push({ id: uid(), sec: 1, t: T(ej), tipo: 'INICIAL', estado, fecha: o.fecha, doc: o.doc, items: o.items, fechaAprob: estado === 'APROBADO' ? o.fecha : '', aut: estado === 'APROBADO' ? 'RESPONSABLE DE PRUEBA' : '' });
  ej.certs.push(c); return c;
}
export function nuevaSecCert(ej: Ejecutora, c: Certificado, tipo: TipoSecCert, o: { fecha: string; doc: Doc; items: Item[] }, estado: Estado = 'REGISTRADO'): CertSec {
  const s: CertSec = { id: uid(), sec: c.secs.length + 1, t: T(ej), tipo, estado, fecha: o.fecha, doc: o.doc, items: o.items, fechaAprob: estado === 'APROBADO' ? o.fecha : '', aut: '' };
  c.secs.push(s); return s;
}
export function nuevoCA(ej: Ejecutora, cert: Certificado, o: Omit<CompromisoAnual, 'id' | 't' | 'num' | 'certId' | 'sub' | 'mes' | 'estado' | 'fechaAprob' | 'aut' | 'mods'> & { num?: number }, estado: Estado = 'REGISTRADO'): CompromisoAnual {
  const ca: CompromisoAnual = { id: uid(), t: T(ej), num: correlativo(ej, 'ca', o.num), certId: cert.id, sub: cert.sub, mes: mesDe(o.fecha), fecha: o.fecha, tipoOp: o.tipoOp, doc: o.doc, prov: o.prov, justif: o.justif, items: o.items, estado, fechaAprob: estado === 'APROBADO' ? o.fecha : '', aut: estado === 'APROBADO' ? 'RESPONSABLE DE PRUEBA' : '', mods: [], transf: '' };
  ej.cas.push(ca); return ca;
}
export function nuevoExpediente(ej: Ejecutora, ca: CompromisoAnual, o: { num?: number; fecha: string; modalidad: string; tipoProc: string; faseContr?: string; expEnc?: string }): Expediente {
  const cert = ej.certs.find(c => c.id === ca.certId)!;
  const e: Expediente = { id: uid(), t: T(ej), num: correlativo(ej, 'exp', o.num), sub: ca.sub, caId: ca.id, tipoOp: ca.tipoOp, mes: mesDe(o.fecha), modalidad: o.modalidad, tipoProc: o.tipoProc, faseContr: o.faseContr || '', expEnc: o.expEnc || '', ff: cert.ff, rubro: cert.rubro, secs: [] };
  ej.exps.push(e); return e;
}
export function nuevaSecExp(ej: Ejecutora, e: Expediente, o: Partial<ExpSec> & { fase: ExpSec['fase']; fecha: string; items: Item[] }, estado: Estado = 'REGISTRADO'): ExpSec {
  const s: ExpSec = {
    id: uid(), sec: e.secs.length + 1, t: T(ej), fase: o.fase, rend: !!o.rend, rol: o.rol || '', hist: !!o.hist, estado, mes: mesDe(o.fecha), fecha: o.fecha,
    doc: o.doc || { cod: '', serie: '', num: '', fecha: o.fecha }, prov: o.prov || null, notas: o.notas || '', tipoPago: o.tipoPago || '', tipoRecurso: o.tipoRecurso || '',
    tipoComp: o.tipoComp || '', ent: o.ent || '', items: o.items, comp: o.comp || [], giro: o.giro || null, pagado: false, ref: o.ref || 0,
    fechaAprob: estado === 'APROBADO' ? o.fecha : '', aut: estado === 'APROBADO' && (o.fase === 'D' || o.fase === 'G') ? 'RESPONSABLE DE PRUEBA' : ''
  };
  e.secs.push(s); return s;
}
export function nuevoIngreso(ej: Ejecutora, o: { num?: number; sub: string; fecha: string; ff: string; rubro: string }): Ingreso {
  const g: Ingreso = { id: uid(), t: T(ej), num: correlativo(ej, 'ing', o.num), sub: o.sub, mes: mesDe(o.fecha), ff: o.ff, rubro: o.rubro, secs: [] };
  ej.ings.push(g); return g;
}
export function nuevaSecIng(ej: Ejecutora, g: Ingreso, o: { fase: 'D' | 'R'; fecha: string; doc: Doc; notas: string; tipoPago?: string; items: Item[] }, estado: Estado = 'REGISTRADO'): IngSec {
  const s: IngSec = { id: uid(), sec: g.secs.length + 1, t: T(ej), fase: o.fase, estado, fecha: o.fecha, mes: mesDe(o.fecha), doc: o.doc, notas: o.notas, tipoPago: o.tipoPago || '', items: o.items, fechaAprob: estado === 'APROBADO' ? o.fecha : '', aut: '' };
  g.secs.push(s); return s;
}

/** Construye la ejecutora con todas las fases de la solución del caso, aprobadas. */
export function construirSolucion(id: string): Ejecutora {
  const d = CASOS[id], ej = ejecutoraVacia(id, 'solucion');
  const recurso = (rb: string) => (CAT.tiposRecurso as Record<string, string>)[rb] || '';
  const pv = (n: string) => ej.provs.find(p => p.num === n);
  d.subcasos.forEach(sc => {
    const K: Record<string, { cert?: Certificado; ca?: CompromisoAnual; exp?: Expediente; ing?: Ingreso }> = {};
    sc.ops.forEach(o => {
      const its = items(o.items || []), A: Estado = 'APROBADO';
      if (o.op === 'cert') K[o.key!] = { cert: nuevoCertificado(ej, { num: o.num, sub: sc.id, fecha: o.fecha, doc: docDe(o.doc!), rubro: sc.rubro, tipoCert: o.tipoCert || 'OTROS', justif: o.justif || '', items: its }, A) };
      else if (o.op === 'certAmp') nuevaSecCert(ej, K[o.ref!].cert!, 'AMPLIACION', { fecha: o.fecha, doc: docDe(o.doc!), items: its }, A);
      else if (o.op === 'ca') { const p = pv(o.prov![1]); K[o.key!] = { ca: nuevoCA(ej, K[o.ref!].cert!, { num: o.num, fecha: o.fecha, tipoOp: o.tipoOp!, doc: docDe(o.doc!), prov: { tipo: o.prov![0], num: o.prov![1], nom: p ? p.nom : '' }, justif: o.justif || '', items: its }, A) }; }
      else if (o.op === 'cm') {
        const ca = K[o.ref!].ca!;
        const e = nuevoExpediente(ej, ca, { num: o.exp, fecha: o.fecha, modalidad: o.modalidad || 'CA - LEY DE CONTRATACIONES DEL ESTADO', tipoProc: o.tipoProc || 'NO APLICA' });
        nuevaSecExp(ej, e, { fase: 'C', fecha: o.fecha, doc: docDe(o.doc!), prov: { ...ca.prov }, notas: o.notas, tipoPago: o.tipoPago || 'A - ABONO EN CUENTA', tipoRecurso: recurso(e.rubro), tipoComp: '11 - MES VIGENTE', items: its, hist: !!o.hist, rol: o.rol }, A);
        K[o.key || ('h' + o.exp)] = { exp: e, ca };
      } else if (o.op === 'dev' || o.op === 'rend') {
        const R = K[o.ref!]; const e = R.exp!; const c0 = e.secs[0];
        nuevaSecExp(ej, e, { fase: 'D', rend: o.op === 'rend', fecha: o.fecha, doc: docDe(o.doc!), prov: { ...R.ca!.prov }, notas: o.notas, tipoPago: c0.tipoPago, tipoRecurso: c0.tipoRecurso, tipoComp: '11 - MES VIGENTE', items: its, rol: o.rol, comp: (o.comp || []).map(c => ({ tipo: c[0], num: c[1], fecha: c[2], desc: c[3], clas: c[4], monto: c[5] })) }, A);
        K[o.key!] = R;
      } else if (o.op === 'gir') {
        const R = K[o.ref!]; const p = pv(o.benef![1]);
        nuevaSecExp(ej, R.exp!, { fase: 'G', fecha: o.fecha, doc: { cod: 'C/P', serie: '', num: o.docGiro || '', fecha: o.fecha }, items: its, rol: o.rol, notas: 'GIRO ' + (o.tipoGiro || ''), giro: { medio: o.medio || '', tipoGiro: o.tipoGiro || 'PRINCIPAL', benef: { tipo: o.benef![0], num: o.benef![1], nom: p ? p.nom : '' }, ret: (o.ret || []).map(x => ({ concepto: x[0], monto: x[1] })) } }, A);
        K[o.key!] = R;
      } else if (o.op === 'pag') {
        const R = K[o.ref!]; const g = R.exp!.secs.filter(s => s.fase === 'G').slice(-1)[0]; if (g) g.pagado = true;
        nuevaSecExp(ej, R.exp!, { fase: 'P', fecha: o.fecha, doc: { cod: 'BN', serie: '', num: 'CONFIRMACION DEL ABONO', fecha: o.fecha }, items: its, notas: o.notas }, A); K[o.key!] = R;
      } else if (o.op === 't6') {
        const R = K[o.ref!]; nuevaSecExp(ej, R.exp!, { fase: 'T6', fecha: o.fecha, doc: docDe(o.doc!), items: its, notas: o.notas }, A); K[o.key!] = R;
      } else if (o.op === 'det') {
        const g = nuevoIngreso(ej, { num: o.num, sub: sc.id, fecha: o.fecha, ff: o.ff!, rubro: o.rubro! });
        nuevaSecIng(ej, g, { fase: 'D', fecha: o.fecha, doc: docDe(o.doc!), notas: o.notas || '', tipoPago: o.tipoPago, items: its }, A);
        K[o.key!] = { ing: g };
      } else if (o.op === 'rec') {
        nuevaSecIng(ej, K[o.ref!].ing!, { fase: 'R', fecha: o.fecha, doc: docDe(o.doc!), notas: o.notas || '', items: its }, A);
      }
    });
  });
  return ej;
}
