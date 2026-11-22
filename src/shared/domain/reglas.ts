/* Reglas de validación de negocio (puras, reutilizables en servicios y pruebas). */
import type { Doc, Item } from '../types';
import { CAT } from '../catalogo';
import { dkey, fmt, JUSTIF_RE, key, okDate, r2, type Mapa } from '../util';

export class ErrorNegocio extends Error { constructor(msg: string) { super(msg); this.name = 'ErrorNegocio'; } }
export const exigir = (cond: unknown, msg: string): void => { if (!cond) throw new ErrorNegocio(msg); };

export const MSG_JUSTIF = 'Caracteres permitidos en la justificación: letras, números, espacios y ( / ) ( . ) ( \\ ) ( Ñ ) ( $ ) ( % ) ( Nº ) ( ; ) ( , ) ( : ) ( á é í ó ú ) ( ) y guion.';
export function validarJustificacion(t: string, etiqueta = 'la justificación'): void {
  exigir(t && t.trim(), 'Ingrese ' + etiqueta + '.');
  exigir(JUSTIF_RE.test(t), 'La justificación tiene caracteres no permitidos. ' + MSG_JUSTIF);
}
export function validarFecha(f: string, etiqueta = 'la fecha del documento'): void { exigir(okDate(f), 'Ingrese ' + etiqueta + ' (dd/mm/aaaa).'); }
export function validarDocumento(d: Doc, opts: { numero?: boolean; factura?: boolean } = {}): Doc {
  exigir(d.cod, 'Seleccione el código del documento.');
  const out = { ...d, serie: (d.serie || '').trim().toUpperCase(), num: (d.num || '').trim() };
  if (opts.factura !== false && d.cod === '001') {
    exigir(/^[A-Z0-9]{4}$/.test(out.serie), 'Ingrese la serie del documento seleccionado (4 dígitos).');
    exigir(/^\d{1,8}$/.test(out.num), 'Ingrese el número del documento según la serie (8 dígitos).');
    out.num = out.num.padStart(8, '0');
  }
  if (opts.numero !== false && d.cod !== '000') exigir(out.num, 'Ingrese el número del documento.');
  validarFecha(d.fecha);
  return out;
}
export const limpiarItems = (items: Item[]): Item[] => items.map(i => ({ clas: i.clas, meta: i.meta || '', monto: r2(+i.monto) })).filter(i => i.monto > 0);
/** Cada ítem debe ser ≤ al saldo disponible de su clasificador/meta. */
export function validarContraSaldo(items: Item[], saldo: Mapa, msg: (clas: string, disp: number) => string): void {
  exigir(items.length, 'Ingrese el monto (Con origen o manualmente).');
  for (const it of items) { const disp = saldo[key(it)] || 0; exigir(it.monto <= disp + 0.001, msg(it.clas, disp)); }
}
export const fechaNoAnterior = (f: string, ref: string): boolean => dkey(f) >= dkey(ref);
export const TOPE_CAJA = CAT.topeCaja;
export const msgSaldo = (que: string) => (clas: string, disp: number) => `El monto del clasificador ${clas} supera el saldo ${que} (S/ ${fmt(disp)}).`;
