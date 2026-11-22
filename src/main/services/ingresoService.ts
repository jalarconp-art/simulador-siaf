/* Ciclo del ingreso (determinado y recaudado) y modificaciones de certificación y compromiso anual. */
import type { Contexto } from './contexto';
import type { Cmd } from '@shared/comandos';
import type { Doc } from '@shared/types';
import { CAT } from '@shared/catalogo';
import { exigir, fechaNoAnterior, limpiarItems, msgSaldo, validarContraSaldo, validarDocumento, validarFecha, validarJustificacion } from '@shared/domain/reglas';
import { certEstado, recDisponible, vivo } from '@shared/domain/saldos';
import { nuevaSecIng, nuevoIngreso } from '@shared/domain/fabrica';
import { clasExiste, docNom, ffDeRubro, mesDe, num, pad } from '@shared/util';

export class IngresoService {
  constructor(private ctx: Contexto) {}
  grabarDeterminado(c: Cmd<'detGrabar'>): number {
    this.ctx.requerirPermiso('det');
    return this.ctx.operar(c.ejecutora, 'determinado.crear', ej => {
      exigir(c.rubro, 'Seleccione el rubro.');
      const doc = validarDocumento(c.doc as Doc, { factura: false });
      validarJustificacion(c.notas);
      const items = limpiarItems(c.items.map(i => ({ clas: i.clas, meta: '', monto: num(i.monto) })));
      exigir(items.length && items.length === c.items.length, 'Agregue el clasificador de ingreso y coloque el monto.');
      items.forEach(i => exigir(i.clas.startsWith('1.') && clasExiste(i.clas), 'El clasificador ' + i.clas + ' no es un clasificador de ingresos 2026.'));
      const g = nuevoIngreso(ej, { sub: ej.sub, fecha: ej.fechaSis, ff: ffDeRubro(c.rubro), rubro: c.rubro });
      nuevaSecIng(ej, g, { fase: 'D', fecha: ej.fechaSis, doc, notas: c.notas.trim(), tipoPago: c.tipoPago, items });
      return g.num;
    }, n => 'Expediente de ingresos ' + pad(n, 5));
  }
  grabarRecaudado(c: Cmd<'recGrabar'>): number {
    this.ctx.requerirPermiso('det');
    return this.ctx.operar(c.ejecutora, 'recaudado.crear', ej => {
      const g = ej.ings.find(x => x.id === c.ingId); exigir(g, 'Expediente no encontrado.');
      const doc = validarDocumento(c.doc as Doc, { factura: false }); validarJustificacion(c.notas);
      const items = limpiarItems(c.items.map(i => ({ clas: i.clas, meta: '', monto: num(i.monto) })));
      validarContraSaldo(items, recDisponible(g!), () => 'Lo recaudado no puede superar lo determinado.');
      return nuevaSecIng(ej, g!, { fase: 'R', fecha: ej.fechaSis, doc, notas: c.notas.trim(), items }).sec;
    });
  }
}

export const CAMPOS_CERT = ['Dispositivo legal', 'Fecha del documento', 'Justificación', 'Número del documento', 'Tipo de certificación'];
export const CAMPOS_CA = ['Código del documento', 'Documento proveedor', 'Fecha del documento', 'Justificación', 'Número del documento', 'Número de transferencia financiera (Rubro 13)'];

export class ModificacionService {
  constructor(private ctx: Contexto) {}
  grabar(c: Cmd<'modGrabar'>): number {
    this.ctx.requerirPermiso('mod');
    return this.ctx.operar(c.ejecutora, 'modificacion.' + (c.id ? 'editar' : 'crear'), ej => {
      const campos = c.tipo === 'CERT' ? CAMPOS_CERT : CAMPOS_CA;
      exigir(campos.includes(c.campo), 'Seleccione el dato a modificar.');
      let val = (c.valor || '').trim();
      let antes = '';
      if (c.tipo === 'CERT') {
        const r = ej.certs.find(x => x.id === c.refId); exigir(r && certEstado(r) === 'APROBADO', 'Seleccione un certificado aprobado.');
        antes = ({ 'Dispositivo legal': r!.disp || '—', 'Fecha del documento': r!.doc.fecha, 'Justificación': r!.justif, 'Número del documento': r!.doc.num, 'Tipo de certificación': r!.tipoCert } as Record<string, string>)[c.campo];
        if (c.campo === 'Tipo de certificación' && val !== 'OTROS') exigir(!ej.cas.some(a => a.certId === r!.id && vivo(a.estado)), 'Para cambiar el tipo a Perú Compras o SEACE no se debe haber reservado (comprometido) la certificación.');
      } else {
        const r = ej.cas.find(x => x.id === c.refId); exigir(r && r.estado === 'APROBADO', 'Seleccione un compromiso anual aprobado.');
        const cert = ej.certs.find(x => x.id === r!.certId)!;
        antes = ({ 'Código del documento': r!.doc.cod + ' - ' + docNom(r!.doc.cod), 'Documento proveedor': r!.prov.tipo + ' ' + r!.prov.num + ' - ' + r!.prov.nom, 'Fecha del documento': r!.doc.fecha, 'Justificación': r!.justif, 'Número del documento': r!.doc.num, 'Número de transferencia financiera (Rubro 13)': r!.transf || '—' } as Record<string, string>)[c.campo];
        if (c.campo === 'Fecha del documento') exigir(fechaNoAnterior(val, cert.doc.fecha), 'La fecha del compromiso anual debe ser igual o mayor que la del certificado (' + cert.doc.fecha + ').');
        if (c.campo === 'Documento proveedor') { const pv = ej.provs.find(p => p.num === val); exigir(pv, 'Seleccione el proveedor.'); val = pv!.tipo + '|' + pv!.num + '|' + pv!.nom; }
        if (c.campo.startsWith('Número de transferencia')) exigir(cert.rubro === '13', 'Solo aplica a compromisos del rubro 13 Donaciones y Transferencias.');
        if (c.campo === 'Código del documento') exigir(CAT.docs.some(d => d[0] === val), 'Seleccione un código de documento válido.');
      }
      if (c.campo !== 'Dispositivo legal') exigir(val, 'Ingrese el nuevo valor (Debe decir).');
      if (c.campo === 'Fecha del documento') validarFecha(val);
      if (c.campo === 'Justificación') validarJustificacion(val);
      if (c.id) {
        const m = ej.mods.find(x => x.id === c.id); exigir(m && m.estado === 'REGISTRADO', 'Solo se puede modificar antes del envío.');
        Object.assign(m!, { campo: c.campo, antes, despues: val }); return m!.num;
      }
      ej.seq.mod = (ej.seq.mod || 0) + 1;
      ej.mods.push({ id: Math.random().toString(36).slice(2, 12), t: ++ej.tick, num: ej.seq.mod, tipo: c.tipo, refId: c.refId, campo: c.campo, antes, despues: val, estado: 'REGISTRADO', fecha: ej.fechaSis, mes: mesDe(ej.fechaSis), fechaAprob: '', aut: '' });
      return ej.seq.mod;
    }, n => 'Modificación Nº ' + n);
  }
}
