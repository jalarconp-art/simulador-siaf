/* Opciones complementarias del Módulo de Ejecución (cuentas bancarias, CCI, beneficiarios OPE, áreas, convenios,
   viáticos, reasignaciones y modificaciones de expediente o de solicitud): registro, envío y descarte. */
import type { Contexto } from './contexto';
import type { RegAux } from '@shared/types';
import { AUX_POR_K } from '@shared/auxiliares';
import { exigir } from '@shared/domain/reglas';
import { mesDe, num, okDate, uid } from '@shared/util';

export class AuxService {
  constructor(private ctx: Contexto) {}

  grabar(c: { ejecutora: string; tipo: string; id?: string; datos: Record<string, string> }): { id: string; num: number } {
    const def = AUX_POR_K[c.tipo]; exigir(def, 'Opción no válida.');
    this.ctx.requerirPermiso(def.opcion);
    const datos: Record<string, string> = {};
    def.campos.forEach(f => {
      let v = String(c.datos[f.k] ?? '').trim();
      if (f.tipo !== 'area' && f.k !== 'email') v = v.toUpperCase();
      if (f.req) exigir(v, `Ingrese «${f.t}».`);
      if (v && f.tipo === 'fecha') exigir(okDate(v), `«${f.t}»: use el formato dd/mm/aaaa.`);
      if (v && f.tipo === 'monto') { const n = num(v); exigir(n > 0, `«${f.t}» debe ser mayor a cero.`); v = n.toFixed(2); }
      if (v && f.tipo === 'numero') exigir(/^\d+$/.test(v), `«${f.t}» debe ser numérico.`);
      if (v && f.tipo === 'lista' && f.opciones) exigir(f.opciones.includes(v), `Seleccione «${f.t}».`);
      if (v && f.patron) exigir(new RegExp(f.patron[0]).test(v), f.patron[1]);
      if (v && f.k === 'email') exigir(/^\S+@\S+\.\S+$/.test(v), 'Ingrese un correo electrónico válido.');
      if (f.max) exigir(v.length <= f.max, `«${f.t}» admite como máximo ${f.max} caracteres.`);
      datos[f.k] = v;
    });
    if (datos.salida && datos.retorno) exigir(this.orden(datos.salida) <= this.orden(datos.retorno), 'La fecha de retorno no puede ser anterior a la de salida.');
    if (datos.desde && datos.hasta) exigir(this.orden(datos.desde) <= this.orden(datos.hasta), 'La vigencia «hasta» no puede ser anterior a «desde».');
    if (datos.otorgado && datos.rendido) exigir(num(datos.rendido) + num(datos.devolucion || '0') <= num(datos.otorgado) + 0.001, 'Lo rendido más la devolución no puede superar el monto otorgado.');
    return this.ctx.operar(c.ejecutora, 'aux.' + c.tipo, ej => {
      ej.aux = ej.aux || [];
      if (c.id) {
        const r = ej.aux.find(x => x.id === c.id && x.tipo === c.tipo); exigir(r, 'Registro no encontrado.');
        exigir(r!.estado === 'REGISTRADO', 'Solo se modifica un registro en estado REGISTRADO.');
        r!.datos = datos; return { id: r!.id, num: r!.num };
      }
      const k = 'aux-' + c.tipo; ej.seq[k] = (ej.seq[k] || 0) + 1;
      const r: RegAux = { id: uid(), tipo: c.tipo, num: ej.seq[k], mes: mesDe(ej.fechaSis), fecha: ej.fechaSis, estado: 'REGISTRADO', datos, t: ++ej.tick };
      ej.aux.push(r); return { id: r.id, num: r.num };
    }, r => def.titulo + ' Nº ' + r.num);
  }
  /** Envía el registro: la base de datos lo verifica y lo aprueba. */
  enviar(x: string, tipo: string, id: string): void { this.cambiar(x, tipo, id, 'APROBADO', 'enviar'); }
  descartar(x: string, tipo: string, id: string): void { this.cambiar(x, tipo, id, 'DESCARTADO', 'descartar'); }
  private cambiar(x: string, tipo: string, id: string, estado: 'APROBADO' | 'DESCARTADO', accion: string): void {
    const def = AUX_POR_K[tipo]; exigir(def, 'Opción no válida.');
    this.ctx.requerirPermiso(def.opcion);
    this.ctx.operar(x, 'aux.' + accion, ej => {
      const r = (ej.aux || []).find(z => z.id === id && z.tipo === tipo); exigir(r, 'Registro no encontrado.');
      exigir(r!.estado === 'REGISTRADO', 'Solo se envía o descarta un registro en estado REGISTRADO.');
      r!.estado = estado;
    }, () => def.titulo + ' ' + id + ' → ' + estado);
    this.ctx.notificar(x);
  }
  private orden(f: string): string { const [d, m, a] = f.split('/'); return a + m + d; }
}
