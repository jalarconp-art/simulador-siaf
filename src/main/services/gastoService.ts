/* Ciclo del gasto: certificación, compromiso anual, compromiso mensual, devengado, girado, pagado y T-6. */
import type { Contexto } from './contexto';
import type { Cmd } from '@shared/comandos';
import type { Certificado, CompromisoAnual, Doc, Ejecutora, Expediente, Item } from '@shared/types';
import { CAT } from '@shared/catalogo';
import { exigir, fechaNoAnterior, limpiarItems, msgSaldo, validarContraSaldo, validarDocumento, validarFecha, validarJustificacion } from '@shared/domain/reglas';
import { caSaldo, certComprometido, certEstado, certMap, certSaldo, esEncargo, expSaldos, pimRows, vivo } from '@shared/domain/saldos';
import { nuevaSecCert, nuevaSecExp, nuevoCA, nuevoCertificado, nuevoExpediente } from '@shared/domain/fabrica';
import { addMap, ffDeRubro, key, mapTot, mesDe, num, pad, r2, sumI, type Mapa } from '@shared/util';

const buscar = <T extends { id: string }>(arr: T[], id: string, que: string): T => { const x = arr.find(z => z.id === id); exigir(x, que + ' no encontrado.'); return x!; };
const its = (arr: { clas: string; meta?: string; monto: number }[]): Item[] => limpiarItems(arr.map(i => ({ clas: i.clas, meta: i.meta || '', monto: num(i.monto) })));

export class GastoService {
  constructor(private ctx: Contexto) {}

  /* ---------------- Certificación ---------------- */
  grabarCertificado(c: Cmd<'certGrabar'>): Certificado {
    this.ctx.requerirPermiso('cert');
    return this.ctx.operar(c.ejecutora, c.id ? 'certificado.modificar' : 'certificado.crear', ej => {
      const doc = validarDocumento({ cod: c.doc.cod || '', serie: '', num: c.doc.num || '', fecha: c.doc.fecha || '' }, { factura: false });
      exigir(c.rubro, 'Seleccione el rubro.');
      validarJustificacion(c.justif);
      const items = its(c.items);
      exigir(items.length && items.length === c.items.length, 'Debe registrar clasificador y meta con monto mayor a cero (botón Agregar).');
      const edit = c.id ? buscar(ej.certs, c.id, 'Certificado') : null;
      if (edit) exigir(certEstado(edit) === 'REGISTRADO', 'Solo se puede modificar antes del envío.');
      const pim = pimRows(ej, c.rubro);
      items.forEach(it => {
        const p = pim.find(x => x.clas === it.clas && x.meta === it.meta);
        const saldo = (p ? p.saldo : 0) + (edit ? certMap(edit, true)[key(it)] || 0 : 0);
        exigir(p, `El clasificador ${it.clas} (meta ${it.meta}) no tiene PIM/PCA en el rubro ${c.rubro}.`);
        exigir(it.monto <= saldo + 0.001, `El monto del clasificador ${it.clas} excede el saldo PIM / PCA (S/ ${saldo.toFixed(2)}).`);
      });
      if (edit) {
        Object.assign(edit, { doc, rubro: c.rubro, ff: ffDeRubro(c.rubro), tipoCert: c.tipoCert, disp: c.disp || '', justif: c.justif.trim() });
        edit.secs[0].items = items; edit.secs[0].doc = doc; return edit;
      }
      return nuevoCertificado(ej, { sub: ej.sub, fecha: ej.fechaSis, doc, rubro: c.rubro, tipoCert: c.tipoCert, disp: c.disp, justif: c.justif.trim(), items });
    }, r => 'Certificado ' + pad(r.num, 5));
  }
  modificarCertificado(c: Cmd<'certModificacion'>): number {
    this.ctx.requerirPermiso('cert');
    return this.ctx.operar(c.ejecutora, 'certificado.' + c.tipo.toLowerCase(), ej => {
      const cert = buscar(ej.certs, c.certId, 'Certificado');
      exigir(certEstado(cert) === 'APROBADO', 'El certificado debe estar APROBADO.');
      const doc = validarDocumento({ ...c.doc, serie: '' } as Doc, { factura: false });
      let items = its(c.items);
      if (c.tipo === 'AMPLIACION') {
        const pim = pimRows(ej, cert.rubro);
        validarContraSaldo(items, Object.fromEntries(pim.map(p => [p.clas + '|' + p.meta, p.saldo])), msgSaldo('PIM / PCA'));
      } else {
        const sal = certSaldo(ej, cert);
        if (c.tipo === 'ANULACION') items = Object.keys(sal).filter(k => sal[k] > 0).map(k => ({ clas: k.split('|')[0], meta: k.split('|')[1], monto: sal[k] }));
        exigir(items.length, 'El certificado no tiene saldo libre (todo está comprometido).');
        validarContraSaldo(items, sal, () => 'Monto ingresado excede en el saldo de la certificación');
      }
      nuevaSecCert(ej, cert, c.tipo, { fecha: ej.fechaSis, doc, items });
      return cert.num;
    }, n => c.tipo + ' certificado ' + pad(n, 5));
  }

  /* ---------------- Compromiso anual ---------------- */
  grabarCompromisoAnual(c: Cmd<'caGrabar'>): CompromisoAnual {
    this.ctx.requerirPermiso('ca');
    return this.ctx.operar(c.ejecutora, c.id ? 'compromiso-anual.modificar' : 'compromiso-anual.crear', ej => {
      const cert = buscar(ej.certs, c.certId, 'Certificado');
      exigir(certEstado(cert) === 'APROBADO', 'Solo los certificados aprobados admiten compromiso anual.');
      exigir(c.tipoOp, 'Seleccione el tipo de operación.');
      const doc = validarDocumento({ ...c.doc, serie: '' } as Doc, { factura: false });
      exigir(fechaNoAnterior(doc.fecha, cert.doc.fecha), 'La fecha del compromiso anual debe ser igual o mayor que la del certificado (' + cert.doc.fecha + ').');
      const pv = ej.provs.find(p => p.num === c.provNum.trim()); exigir(pv, 'Seleccione el proveedor (no está registrado).');
      if (cert.tipoCert === 'ADQUISICION / SEACE' && ['070', '060', '059'].includes(doc.cod)) exigir(pv!.tipo === 'RUC', 'Error 0892 (interfase SEACE-SIAF): el RUC no coincide con el del contrato registrado en el SEACE.');
      validarJustificacion(c.justif, 'la justificación (es obligatoria)');
      const items = its(c.items);
      const edit = c.id ? buscar(ej.cas, c.id, 'Compromiso anual') : null;
      if (edit) exigir(edit.estado === 'REGISTRADO', 'Solo se puede modificar antes del envío.');
      const sal: Mapa = certSaldo(ej, cert); if (edit) addMap(sal, edit.items, 1);
      validarContraSaldo(items, sal, msgSaldo('del certificado'));
      const prov = { tipo: pv!.tipo, num: pv!.num, nom: pv!.nom };
      if (edit) { Object.assign(edit, { tipoOp: c.tipoOp, doc, prov, justif: c.justif.trim(), items }); return edit; }
      return nuevoCA(ej, cert, { fecha: ej.fechaSis, tipoOp: c.tipoOp, doc, prov, justif: c.justif.trim(), items });
    }, r => 'Compromiso anual ' + r.num);
  }
  modificarCompromisoAnual(c: Cmd<'caModificacion'>): number {
    this.ctx.requerirPermiso('ca');
    return this.ctx.operar(c.ejecutora, 'compromiso-anual.' + c.tipo.toLowerCase(), ej => {
      const ca = buscar(ej.cas, c.caId, 'Compromiso anual'); exigir(ca.estado === 'APROBADO', 'El compromiso anual debe estar APROBADO.');
      const doc = validarDocumento({ ...c.doc, serie: '' } as Doc, { factura: false });
      let items = its(c.items);
      if (c.tipo === 'AMPLIACION') validarContraSaldo(items, certSaldo(ej, ej.certs.find(x => x.id === ca.certId)!), msgSaldo('del certificado (los parámetros son los del CCP)'));
      else {
        const sal = caSaldo(ej, ca);
        if (c.tipo === 'ANULACION') items = Object.keys(sal).filter(k => sal[k] > 0).map(k => ({ clas: k.split('|')[0], meta: k.split('|')[1], monto: sal[k] }));
        exigir(items.length, 'El compromiso anual no tiene saldo.');
        validarContraSaldo(items, sal, msgSaldo('del compromiso anual'));
      }
      ca.mods.push({ id: Math.random().toString(36).slice(2), n: ca.mods.length + 1, tipo: c.tipo, estado: 'REGISTRADO', fecha: ej.fechaSis, doc, items, fechaAprob: '', aut: '' });
      return ca.num;
    }, n => c.tipo + ' CA ' + n);
  }

  /* ---------------- Compromiso mensual ---------------- */
  grabarCompromisoMensual(c: Cmd<'cmGrabar'>): { exp: number; sec: number } {
    this.ctx.requerirPermiso('cm');
    return this.ctx.operar(c.ejecutora, c.sec ? 'compromiso-mensual.modificar' : 'compromiso-mensual.crear', ej => {
      const ca = buscar(ej.cas, c.caId, 'Compromiso anual'); exigir(ca.estado === 'APROBADO', 'El compromiso anual debe estar APROBADO.');
      const doc = validarDocumento(c.doc as Doc, { factura: false });
      validarJustificacion(c.notas, 'la justificación (notas)');
      exigir(c.tipoPago, 'Seleccione el tipo de pago.'); exigir(c.tipoRecurso, 'Seleccione el tipo de recurso.');
      const items = its(c.items);
      const sal = caSaldo(ej, ca);
      let e: Expediente;
      if (c.expId) {
        e = buscar(ej.exps, c.expId, 'Expediente');
        if (c.sec) { const s = e.secs.find(x => x.sec === c.sec)!; exigir(s && s.estado === 'REGISTRADO', 'Solo se puede modificar antes del envío.'); addMap(sal, s.items, 1); validarContraSaldo(items, sal, msgSaldo('del compromiso anual')); Object.assign(s, { doc, notas: c.notas.trim(), tipoPago: c.tipoPago, tipoRecurso: c.tipoRecurso, ent: c.ent, items }); return { exp: e.num, sec: s.sec }; }
      } else e = nuevoExpediente(ej, ca, { fecha: ej.fechaSis, modalidad: c.modalidad, tipoProc: c.tipoProc, faseContr: c.faseContr, expEnc: c.expEnc });
      validarContraSaldo(items, sal, msgSaldo('del compromiso anual'));
      const s = nuevaSecExp(ej, e, { fase: 'C', fecha: ej.fechaSis, doc, prov: { ...ca.prov }, notas: c.notas.trim(), tipoPago: c.tipoPago, tipoRecurso: c.tipoRecurso, tipoComp: '11 - MES VIGENTE', ent: c.ent, items });
      return { exp: e.num, sec: s.sec };
    }, r => 'Expediente ' + pad(r.exp, 5) + ' sec ' + r.sec);
  }
  rebajarCompromisoMensual(c: Cmd<'cmRebaja'>): number {
    this.ctx.requerirPermiso('cm');
    return this.ctx.operar(c.ejecutora, 'compromiso-mensual.rebaja', ej => {
      const e = buscar(ej.exps, c.expId, 'Expediente'); validarJustificacion(c.notas, 'las notas');
      const items = its(c.items); validarContraSaldo(items, expSaldos(e).porDevengar, msgSaldo('por devengar'));
      const c0 = e.secs.find(s => s.fase === 'C')!;
      return nuevaSecExp(ej, e, { fase: 'C', fecha: ej.fechaSis, doc: { ...c0.doc }, prov: c0.prov, notas: c.notas.trim(), tipoPago: c0.tipoPago, tipoRecurso: c0.tipoRecurso, tipoComp: c0.tipoComp, items: items.map(i => ({ ...i, monto: -i.monto })) }).sec;
    });
  }

  /* ---------------- Devengado / rendición ---------------- */
  grabarDevengado(c: Cmd<'devGrabar'>): number {
    this.ctx.requerirPermiso('dev');
    return this.ctx.operar(c.ejecutora, c.rend ? 'devengado.rendicion' : 'devengado.registrar', ej => {
      const e = buscar(ej.exps, c.expId, 'Expediente'); const c0 = e.secs.find(s => s.fase === 'C' && s.estado === 'APROBADO');
      exigir(c0, 'El compromiso mensual debe estar aprobado.');
      const doc = validarDocumento(c.doc as Doc);
      validarJustificacion(c.notas, 'la justificación (notas)');
      const S = expSaldos(e); const edit = c.sec ? e.secs.find(x => x.sec === c.sec) : null;
      if (edit) exigir(edit.estado === 'REGISTRADO', 'Solo se puede modificar antes del envío.');
      let items: Item[]; let comp = c.comp.map(x => ({ tipo: x.tipo, num: x.num.trim(), fecha: x.fecha, desc: x.desc.trim().toUpperCase(), clas: x.clas, monto: num(x.monto) }));
      if (c.rend) {
        exigir(esEncargo(e), 'La rendición solo aplica a encargos, viáticos y caja chica.');
        exigir(comp.length, 'Agregue al menos un comprobante.');
        comp.forEach(x => exigir(x.num && x.clas && x.monto > 0, 'Complete número, clasificador y monto de cada comprobante.'));
        const m: Record<string, number> = {}; comp.forEach(x => { m[x.clas] = r2((m[x.clas] || 0) + x.monto); });
        items = Object.keys(m).map(cl => ({ clas: cl, meta: c0!.items[0].meta, monto: m[cl] }));
        const disp = mapTot(S.porRendir) + (edit ? sumI(edit.items) : 0);
        exigir(sumI(items) <= disp + 0.001, `Lo rendido (S/ ${sumI(items).toFixed(2)}) supera lo entregado pendiente de rendir (S/ ${disp.toFixed(2)}).`);
      } else {
        comp = []; items = its(c.items);
        const sal = { ...S.porDevengar }; if (edit) addMap(sal, edit.items, 1);
        validarContraSaldo(items, sal, msgSaldo('por devengar del compromiso mensual'));
      }
      const datos = { fase: 'D' as const, rend: c.rend, doc, prov: { ...c0!.prov! }, notas: c.notas.trim(), ent: c.ent, tipoPago: c0!.tipoPago, tipoRecurso: c0!.tipoRecurso, tipoComp: '11 - MES VIGENTE', items, comp, fecha: ej.fechaSis, mes: mesDe(ej.fechaSis) };
      if (edit) { Object.assign(edit, datos); return edit.sec; }
      return nuevaSecExp(ej, e, datos).sec;
    }, s => 'Devengado sec ' + s);
  }

  /* ---------------- Girado y pagado ---------------- */
  grabarGirado(c: Cmd<'girGrabar'>): number {
    this.ctx.requerirPermiso('gir');
    return this.ctx.operar(c.ejecutora, 'girado.registrar', ej => {
      const e = buscar(ej.exps, c.expId, 'Expediente');
      exigir(c.medio, 'Seleccione el medio de pago.'); exigir(c.docGiro.trim(), 'Ingrese el documento del giro.'); validarFecha(c.fecha);
      const pv = ej.provs.find(p => p.num === c.benefNum.trim()); exigir(pv, 'Seleccione el beneficiario.');
      const edit = c.sec ? e.secs.find(x => x.sec === c.sec) : null; if (edit) exigir(edit.estado === 'REGISTRADO', 'Solo se puede modificar antes del envío.');
      const items = its(c.items); const sal = { ...expSaldos(e).porGirar }; if (edit) addMap(sal, edit.items, 1);
      validarContraSaldo(items, sal, msgSaldo('por girar'));
      const ret = c.ret.map(r => ({ concepto: r.concepto.trim().toUpperCase(), monto: num(r.monto) })).filter(r => r.monto > 0);
      exigir(ret.every(r => r.concepto), 'Indique el concepto de cada retención.');
      exigir(sumI(ret) <= sumI(items) + 0.001, 'Las retenciones no pueden superar el monto girado.');
      const datos = { fase: 'G' as const, doc: { cod: 'C/P', serie: '', num: c.docGiro.trim(), fecha: c.fecha }, items, rol: c.tipoGiro === 'REPOSICION' ? 'reposicion' : '', giro: { medio: c.medio, tipoGiro: c.tipoGiro, benef: { tipo: pv!.tipo, num: pv!.num, nom: pv!.nom }, ret }, notas: 'GIRO ' + c.tipoGiro + ' - ' + c.medio, fecha: ej.fechaSis, mes: mesDe(ej.fechaSis) };
      if (edit) { Object.assign(edit, datos); return edit.sec; }
      return nuevaSecExp(ej, e, datos).sec;
    }, s => 'Girado sec ' + s);
  }
  registrarPagado(c: Cmd<'pagado'>): number {
    this.ctx.requerirPermiso('gir');
    return this.ctx.operar(c.ejecutora, 'pagado.registrar', ej => {
      const e = buscar(ej.exps, c.expId, 'Expediente'); const g = e.secs.find(s => s.sec === c.sec);
      exigir(g && g.fase === 'G' && g.estado === 'APROBADO', 'El giro debe estar aprobado.'); exigir(!g!.pagado, 'El giro ya tiene pagado registrado.');
      g!.pagado = true;
      return nuevaSecExp(ej, e, { fase: 'P', doc: { cod: 'BN', serie: '', num: 'CONFIRMACION DEL ABONO', fecha: ej.fechaSis }, items: g!.items.map(i => ({ ...i })), ref: c.sec, notas: 'PAGADO: CONFIRMACION DEL ABONO DEL GIRO SEC. ' + pad(c.sec, 4), fecha: ej.fechaSis }).sec;
    });
  }

  /* ---------------- Papeleta T-6 ---------------- */
  grabarT6(c: Cmd<'t6Grabar'>): number {
    this.ctx.requerirPermiso('gir');
    return this.ctx.operar(c.ejecutora, 't6.registrar', ej => {
      const e = buscar(ej.exps, c.expId, 'Expediente');
      exigir(c.num.trim(), 'Ingrese el número de la papeleta T-6.'); validarFecha(c.fecha, 'la fecha del depósito'); validarJustificacion(c.notas, 'las notas');
      const edit = c.sec ? e.secs.find(x => x.sec === c.sec) : null;
      const items = its(c.items); const sal = { ...expSaldos(e).porRendir }; if (edit) addMap(sal, edit.items, 1);
      validarContraSaldo(items, sal, msgSaldo('por rendir'));
      const datos = { fase: 'T6' as const, doc: { cod: 'T6', serie: '', num: c.num.trim(), fecha: c.fecha }, notas: c.notas.trim(), items, fecha: ej.fechaSis, mes: mesDe(ej.fechaSis) };
      if (edit) { Object.assign(edit, datos); return edit.sec; }
      return nuevaSecExp(ej, e, datos).sec;
    });
  }

  /* ---------------- consultas auxiliares ---------------- */
  static resumen(ej: Ejecutora) {
    return {
      certificado: mapTot(ej.certs.reduce((m, c) => addMap(m, Object.entries(certMap(c)).map(([k, v]) => ({ clas: k.split('|')[0], meta: k.split('|')[1], monto: v })), 1), {} as Mapa)),
      comprometido: ej.certs.reduce((a, c) => a + mapTot(certComprometido(ej, c)), 0),
      registros: ej.certs.length + ej.cas.length + ej.exps.reduce((a, e) => a + e.secs.length, 0) + ej.ings.reduce((a, g) => a + g.secs.length, 0),
      pendientes: [...ej.certs.flatMap(c => c.secs), ...ej.cas, ...ej.exps.flatMap(e => e.secs)].filter(x => vivo(x.estado) && x.estado !== 'APROBADO').length
    };
  }
}
export const _interno = { CAT };
