/* Reglas de saldo de la ejecución del gasto y del ingreso (certificado › CA › CM › devengado › girado) */
import type { CompromisoAnual, Certificado, Ejecutora, Estado, Expediente, ExpSec, Ingreso } from '../types';
import { CASOS } from '../casos';
import { addMap, diffMap, mapTot, r2, type Mapa } from '../util';

export const vivo = (e: Estado): boolean => !['DESCARTADO', 'RECHAZADO', 'ANULADO'].includes(e);
export const certEstado = (c: Certificado): Estado => c.secs[0].estado;
export const esEncargo = (e: Expediente): boolean => ['A', 'AV', 'C', 'E', 'EO'].includes(e.tipoOp);

/** Monto del certificado. reserva=true incluye inicial/ampliación no aprobadas (consumo de PIM). */
export function certMap(c: Certificado, reserva = false): Mapa {
  const m: Mapa = {};
  c.secs.forEach(s => {
    if (s.tipo === 'INICIAL' || s.tipo === 'AMPLIACION') { if (s.estado === 'APROBADO' || (reserva && vivo(s.estado))) addMap(m, s.items, 1); }
    else if (s.estado === 'APROBADO') addMap(m, s.items, -1);
  });
  return m;
}
export function caMap(ca: CompromisoAnual): Mapa {
  const m = addMap({}, ca.items, 1);
  ca.mods.forEach(md => { if (md.estado === 'APROBADO') addMap(m, md.items, md.tipo === 'AMPLIACION' ? 1 : -1); });
  return m;
}
export const caMonto = (ca: CompromisoAnual): number => (vivo(ca.estado) ? mapTot(caMap(ca)) : 0);
export function certComprometido(ej: Ejecutora, c: Certificado): Mapa {
  const m: Mapa = {};
  ej.cas.filter(a => a.certId === c.id && vivo(a.estado)).forEach(a => { const mm = caMap(a); Object.keys(mm).forEach(k => { m[k] = r2((m[k] || 0) + mm[k]); }); });
  return m;
}
export const certSaldo = (ej: Ejecutora, c: Certificado): Mapa => diffMap(certMap(c), certComprometido(ej, c));
export function caUsado(ej: Ejecutora, ca: CompromisoAnual): Mapa {
  const m: Mapa = {};
  ej.exps.filter(e => e.caId === ca.id).forEach(e => e.secs.filter(s => s.fase === 'C' && vivo(s.estado)).forEach(s => addMap(m, s.items, 1)));
  return m;
}
export const caSaldo = (ej: Ejecutora, ca: CompromisoAnual): Mapa => diffMap(caMap(ca), caUsado(ej, ca));
export const secMap = (e: Expediente, pred: (s: ExpSec) => boolean): Mapa => { const m: Mapa = {}; e.secs.filter(pred).forEach(s => addMap(m, s.items, 1)); return m; };

export interface SaldosExp { porDevengar: Mapa; porGirar: Mapa; porRendir: Mapa; porPagar: Mapa; tot: Record<string, number> }
export function expSaldos(e: Expediente): SaldosExp {
  const C = secMap(e, s => s.fase === 'C' && s.estado === 'APROBADO');
  const Dn = secMap(e, s => s.fase === 'D' && !s.rend && vivo(s.estado));
  const DnA = secMap(e, s => s.fase === 'D' && !s.rend && s.estado === 'APROBADO');
  const Rl = secMap(e, s => s.fase === 'D' && s.rend && vivo(s.estado));
  const RA = secMap(e, s => s.fase === 'D' && s.rend && s.estado === 'APROBADO');
  const Gl = secMap(e, s => s.fase === 'G' && vivo(s.estado));
  const GA = secMap(e, s => s.fase === 'G' && s.estado === 'APROBADO');
  const T6 = secMap(e, s => s.fase === 'T6' && vivo(s.estado));
  const Pl = secMap(e, s => s.fase === 'P' && vivo(s.estado));
  const girable: Mapa = { ...DnA };
  if (e.tipoOp === 'C') Object.keys(RA).forEach(k => { girable[k] = r2((girable[k] || 0) + RA[k]); });
  return {
    porDevengar: diffMap(C, Dn), porGirar: diffMap(girable, Gl), porRendir: diffMap(diffMap(GA, Rl), T6), porPagar: diffMap(GA, Pl),
    tot: { C: mapTot(C), D: mapTot(Dn), R: mapTot(Rl), G: mapTot(Gl), T6: mapTot(T6), P: mapTot(Pl) }
  };
}
export interface FilaPim { meta: string; rubro: string; clas: string; pim: number; cert: number; saldo: number }
export function pimRows(ej: Ejecutora, rubro?: string): FilaPim[] {
  const d = CASOS[ej.id];
  return d.pim.filter(p => !rubro || p[1] === rubro).map(p => {
    const k = p[2] + '|' + p[0]; let cert = 0;
    ej.certs.filter(c => c.rubro === p[1]).forEach(c => { cert += certMap(c, true)[k] || 0; });
    return { meta: p[0], rubro: p[1], clas: p[2], pim: p[3], cert: r2(cert), saldo: r2(p[3] - cert) };
  });
}
export function recDisponible(g: Ingreso): Mapa {
  const D: Mapa = {}, R: Mapa = {};
  g.secs.forEach(s => { if (s.fase === 'D' && s.estado === 'APROBADO') addMap(D, s.items, 1); if (s.fase === 'R' && vivo(s.estado)) addMap(R, s.items, 1); });
  return diffMap(D, R);
}
