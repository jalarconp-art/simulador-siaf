/* Repositorio del agregado Ejecutora (patrón Unit of Work: se carga completo y se guarda en una transacción). */
import type { SqlValue } from 'sql.js';
import type { BaseDatos, Fila } from '../db/database';
import type { CAMod, CertSec, Certificado, CompromisoAnual, Doc, Ejecutora, Estado, Expediente, ExpSec, Ingreso, IngSec, Item, Modificacion, Persona } from '@shared/types';

const s = (v: SqlValue): string => (v == null ? '' : String(v));
const n = (v: SqlValue): number => Number(v || 0);
const doc = (f: Fila): Doc => ({ cod: s(f.doc_cod), serie: s(f.doc_serie), num: s(f.doc_num), fecha: s(f.doc_fecha) });
const persona = (t: SqlValue, nu: SqlValue, no: SqlValue): Persona | null => (nu ? { tipo: s(t), num: s(nu), nom: s(no) } : null);

/* Cada usuario tiene su propio espacio de trabajo: la clave física es «idUsuario::idCaso».
   El agregado en memoria conserva el id lógico del caso (cp1), que es el que usa el dominio. */
export const SEP = '::';
export const claveDe = (usuarioId: string, caso: string): string => usuarioId + SEP + caso;
export const casoDe = (clave: string): string => (clave.includes(SEP) ? clave.slice(clave.lastIndexOf(SEP) + SEP.length) : clave);
export const duenoDe = (clave: string): string => (clave.includes(SEP) ? clave.slice(0, clave.lastIndexOf(SEP)) : '');

export class EjecutoraRepo {
  constructor(private bd: BaseDatos) {}

  existe(clave: string): boolean { return !!this.bd.uno('SELECT id FROM ejecutoras WHERE id=?', [clave]); }

  cargar(clave: string): Ejecutora | null {
    const id = clave;
    const e = this.bd.uno('SELECT * FROM ejecutoras WHERE id=?', [id]);
    if (!e) return null;
    const itemsPor = new Map<string, Item[]>();
    this.bd.todos('SELECT owner_tipo, owner_id, clas, meta, monto FROM items WHERE ejecutora=? ORDER BY orden', [id]).forEach(f => {
      const k = s(f.owner_tipo) + ':' + s(f.owner_id);
      if (!itemsPor.has(k)) itemsPor.set(k, []);
      itemsPor.get(k)!.push({ clas: s(f.clas), meta: s(f.meta), monto: n(f.monto) });
    });
    const its = (t: string, oid: SqlValue) => itemsPor.get(t + ':' + s(oid)) || [];
    const certs: Certificado[] = this.bd.todos('SELECT * FROM certificados WHERE ejecutora=? ORDER BY t', [id]).map(c => ({
      id: s(c.id), num: n(c.num), sub: s(c.sub), mes: n(c.mes), anio: n(c.anio), doc: { cod: s(c.doc_cod), serie: '', num: s(c.doc_num), fecha: s(c.doc_fecha) },
      rubro: s(c.rubro), ff: s(c.ff), tipoCert: s(c.tipo_cert), disp: s(c.disp), justif: s(c.justif), fecha: s(c.fecha), t: n(c.t),
      secs: this.bd.todos('SELECT * FROM cert_secuencias WHERE cert_id=? ORDER BY sec', [c.id]).map((x): CertSec => ({
        id: s(x.id), sec: n(x.sec), t: n(x.t), tipo: s(x.tipo) as CertSec['tipo'], estado: s(x.estado) as Estado, fecha: s(x.fecha), doc: doc(x),
        items: its('cert_sec', x.id), fechaAprob: s(x.fecha_aprob), aut: s(x.aut)
      }))
    }));
    const cas: CompromisoAnual[] = this.bd.todos('SELECT * FROM compromisos_anuales WHERE ejecutora=? ORDER BY t', [id]).map(a => ({
      id: s(a.id), num: n(a.num), certId: s(a.cert_id), sub: s(a.sub), mes: n(a.mes), fecha: s(a.fecha), tipoOp: s(a.tipo_op),
      doc: { cod: s(a.doc_cod), serie: '', num: s(a.doc_num), fecha: s(a.doc_fecha) }, prov: persona(a.prov_tipo, a.prov_num, a.prov_nom) || { tipo: '', num: '', nom: '' },
      justif: s(a.justif), items: its('ca', a.id), estado: s(a.estado) as Estado, fechaAprob: s(a.fecha_aprob), aut: s(a.aut), transf: s(a.transf), t: n(a.t),
      mods: this.bd.todos('SELECT * FROM ca_modificaciones WHERE ca_id=? ORDER BY n', [a.id]).map((m): CAMod => ({
        id: s(m.id), n: n(m.n), tipo: s(m.tipo) as CAMod['tipo'], estado: s(m.estado) as Estado, fecha: s(m.fecha),
        doc: { cod: s(m.doc_cod), serie: '', num: s(m.doc_num), fecha: s(m.doc_fecha) }, items: its('ca_mod', m.id), fechaAprob: s(m.fecha_aprob), aut: s(m.aut)
      }))
    }));
    const exps: Expediente[] = this.bd.todos('SELECT * FROM expedientes WHERE ejecutora=? ORDER BY t', [id]).map(x => ({
      id: s(x.id), num: n(x.num), sub: s(x.sub), caId: s(x.ca_id), tipoOp: s(x.tipo_op), mes: n(x.mes), modalidad: s(x.modalidad), tipoProc: s(x.tipo_proc),
      faseContr: s(x.fase_contr), expEnc: s(x.exp_enc), ff: s(x.ff), rubro: s(x.rubro), t: n(x.t),
      secs: this.bd.todos('SELECT * FROM exp_secuencias WHERE exp_id=? ORDER BY sec', [x.id]).map((q): ExpSec => ({
        id: s(q.id), sec: n(q.sec), t: n(q.t), fase: s(q.fase) as ExpSec['fase'], rend: !!n(q.rend), rol: s(q.rol), hist: !!n(q.hist), estado: s(q.estado) as Estado,
        mes: n(q.mes), fecha: s(q.fecha), doc: doc(q), prov: persona(q.prov_tipo, q.prov_num, q.prov_nom), notas: s(q.notas), tipoPago: s(q.tipo_pago),
        tipoRecurso: s(q.tipo_recurso), tipoComp: s(q.tipo_comp), ent: s(q.ent), items: its('exp_sec', q.id),
        comp: this.bd.todos('SELECT * FROM comprobantes WHERE sec_id=? ORDER BY orden', [q.id]).map(c => ({ tipo: s(c.tipo), num: s(c.num), fecha: s(c.fecha), desc: s(c.descripcion), clas: s(c.clas), monto: n(c.monto) })),
        giro: q.giro_medio ? { medio: s(q.giro_medio), tipoGiro: s(q.giro_tipo), benef: persona(q.benef_tipo, q.benef_num, q.benef_nom) || { tipo: '', num: '', nom: '' }, ret: this.bd.todos('SELECT concepto, monto FROM retenciones WHERE sec_id=? ORDER BY orden', [q.id]).map(r => ({ concepto: s(r.concepto), monto: n(r.monto) })) } : null,
        pagado: !!n(q.pagado), ref: n(q.ref), fechaAprob: s(q.fecha_aprob), aut: s(q.aut)
      }))
    }));
    const ings: Ingreso[] = this.bd.todos('SELECT * FROM ingresos WHERE ejecutora=? ORDER BY t', [id]).map(g => ({
      id: s(g.id), num: n(g.num), sub: s(g.sub), mes: n(g.mes), ff: s(g.ff), rubro: s(g.rubro), t: n(g.t),
      secs: this.bd.todos('SELECT * FROM ing_secuencias WHERE ing_id=? ORDER BY sec', [g.id]).map((q): IngSec => ({
        id: s(q.id), sec: n(q.sec), t: n(q.t), fase: s(q.fase) as 'D' | 'R', estado: s(q.estado) as Estado, fecha: s(q.fecha), mes: n(q.mes), doc: doc(q),
        notas: s(q.notas), tipoPago: s(q.tipo_pago), items: its('ing_sec', q.id), fechaAprob: s(q.fecha_aprob), aut: s(q.aut)
      }))
    }));
    const mods: Modificacion[] = this.bd.todos('SELECT * FROM modificaciones WHERE ejecutora=? ORDER BY t', [id]).map(m => ({
      id: s(m.id), num: n(m.num), tipo: s(m.tipo) as 'CERT' | 'CA', refId: s(m.ref_id), campo: s(m.campo), antes: s(m.antes), despues: s(m.despues),
      estado: s(m.estado) as Estado, fecha: s(m.fecha), mes: n(m.mes), fechaAprob: s(m.fecha_aprob), aut: s(m.aut), t: n(m.t)
    }));
    const provs = this.bd.todos('SELECT * FROM proveedores WHERE ejecutora=? ORDER BY rowid', [id]).map(p => ({ tipo: s(p.tipo), num: s(p.num), nom: s(p.nombre) }));
    return { id: casoDe(id), modo: s(e.modo) as Ejecutora['modo'], sub: s(e.sub), fechaSis: s(e.fecha_sis), seq: JSON.parse(s(e.seq) || '{}'), tick: n(e.tick), certs, cas, exps, ings, mods, provs };
  }

  /** Reemplaza todas las filas de la ejecutora dentro de una transacción. */
  guardar(ejLogica: Ejecutora, clave: string = ejLogica.id): void {
    const bd = this.bd;
    const ej = { ...ejLogica, id: clave };
    bd.transaccion(() => {
      bd.run('DELETE FROM ejecutoras WHERE id=?', [ej.id]);
      bd.run('INSERT INTO ejecutoras (id, modo, sub, fecha_sis, seq, tick) VALUES (?,?,?,?,?,?)', [ej.id, ej.modo, ej.sub, ej.fechaSis, JSON.stringify(ej.seq), ej.tick]);
      ej.provs.forEach(p => bd.run('INSERT OR REPLACE INTO proveedores (ejecutora, tipo, num, nombre) VALUES (?,?,?,?)', [ej.id, p.tipo, p.num, p.nom]));
      const items = (tipo: string, oid: string, arr: Item[]) => arr.forEach((i, k) => bd.run('INSERT INTO items (ejecutora, owner_tipo, owner_id, orden, clas, meta, monto) VALUES (?,?,?,?,?,?,?)', [ej.id, tipo, oid, k, i.clas, i.meta || '', i.monto]));
      ej.certs.forEach(c => {
        bd.run('INSERT INTO certificados (id, ejecutora, num, sub, mes, anio, doc_cod, doc_num, doc_fecha, rubro, ff, tipo_cert, disp, justif, fecha, t) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [c.id, ej.id, c.num, c.sub, c.mes, c.anio, c.doc.cod, c.doc.num, c.doc.fecha, c.rubro, c.ff, c.tipoCert, c.disp, c.justif, c.fecha, c.t]);
        c.secs.forEach(x => { bd.run('INSERT INTO cert_secuencias (id, cert_id, sec, tipo, estado, fecha, doc_cod, doc_serie, doc_num, doc_fecha, fecha_aprob, aut, t) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [x.id, c.id, x.sec, x.tipo, x.estado, x.fecha, x.doc.cod, x.doc.serie, x.doc.num, x.doc.fecha, x.fechaAprob, x.aut, x.t]); items('cert_sec', x.id, x.items); });
      });
      ej.cas.forEach(a => {
        bd.run('INSERT INTO compromisos_anuales (id, ejecutora, num, cert_id, sub, mes, fecha, tipo_op, doc_cod, doc_num, doc_fecha, prov_tipo, prov_num, prov_nom, justif, estado, fecha_aprob, aut, transf, t) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [a.id, ej.id, a.num, a.certId, a.sub, a.mes, a.fecha, a.tipoOp, a.doc.cod, a.doc.num, a.doc.fecha, a.prov.tipo, a.prov.num, a.prov.nom, a.justif, a.estado, a.fechaAprob, a.aut, a.transf || '', a.t]);
        items('ca', a.id, a.items);
        a.mods.forEach(m => { bd.run('INSERT INTO ca_modificaciones (id, ca_id, n, tipo, estado, fecha, doc_cod, doc_num, doc_fecha, fecha_aprob, aut) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [m.id, a.id, m.n, m.tipo, m.estado, m.fecha, m.doc.cod, m.doc.num, m.doc.fecha, m.fechaAprob, m.aut]); items('ca_mod', m.id, m.items); });
      });
      ej.exps.forEach(e => {
        bd.run('INSERT INTO expedientes (id, ejecutora, num, sub, ca_id, tipo_op, mes, modalidad, tipo_proc, fase_contr, exp_enc, ff, rubro, t) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [e.id, ej.id, e.num, e.sub, e.caId, e.tipoOp, e.mes, e.modalidad, e.tipoProc, e.faseContr, e.expEnc, e.ff, e.rubro, e.t]);
        e.secs.forEach(q => {
          bd.run(`INSERT INTO exp_secuencias (id, exp_id, sec, fase, rend, rol, hist, estado, mes, fecha, doc_cod, doc_serie, doc_num, doc_fecha, prov_tipo, prov_num, prov_nom, notas, tipo_pago, tipo_recurso, tipo_comp, ent,
            giro_medio, giro_tipo, benef_tipo, benef_num, benef_nom, pagado, ref, fecha_aprob, aut, t) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [q.id, e.id, q.sec, q.fase, q.rend ? 1 : 0, q.rol, q.hist ? 1 : 0, q.estado, q.mes, q.fecha, q.doc.cod, q.doc.serie, q.doc.num, q.doc.fecha, q.prov?.tipo ?? null, q.prov?.num ?? null, q.prov?.nom ?? null,
              q.notas, q.tipoPago, q.tipoRecurso, q.tipoComp, q.ent, q.giro?.medio ?? null, q.giro?.tipoGiro ?? null, q.giro?.benef.tipo ?? null, q.giro?.benef.num ?? null, q.giro?.benef.nom ?? null,
              q.pagado ? 1 : 0, q.ref, q.fechaAprob, q.aut, q.t]);
          items('exp_sec', q.id, q.items);
          (q.giro?.ret || []).forEach((r, k) => bd.run('INSERT INTO retenciones (sec_id, orden, concepto, monto) VALUES (?,?,?,?)', [q.id, k, r.concepto, r.monto]));
          q.comp.forEach((c, k) => bd.run('INSERT INTO comprobantes (sec_id, orden, tipo, num, fecha, descripcion, clas, monto) VALUES (?,?,?,?,?,?,?,?)', [q.id, k, c.tipo, c.num, c.fecha, c.desc, c.clas, c.monto]));
        });
      });
      ej.ings.forEach(g => {
        bd.run('INSERT INTO ingresos (id, ejecutora, num, sub, mes, ff, rubro, t) VALUES (?,?,?,?,?,?,?,?)', [g.id, ej.id, g.num, g.sub, g.mes, g.ff, g.rubro, g.t]);
        g.secs.forEach(q => { bd.run('INSERT INTO ing_secuencias (id, ing_id, sec, fase, estado, fecha, mes, doc_cod, doc_serie, doc_num, doc_fecha, notas, tipo_pago, fecha_aprob, aut, t) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [q.id, g.id, q.sec, q.fase, q.estado, q.fecha, q.mes, q.doc.cod, q.doc.serie, q.doc.num, q.doc.fecha, q.notas, q.tipoPago, q.fechaAprob, q.aut, q.t]); items('ing_sec', q.id, q.items); });
      });
      ej.mods.forEach(m => bd.run('INSERT INTO modificaciones (id, ejecutora, num, tipo, ref_id, campo, antes, despues, estado, fecha, mes, fecha_aprob, aut, t) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [m.id, ej.id, m.num, m.tipo, m.refId, m.campo, m.antes, m.despues, m.estado, m.fecha, m.mes, m.fechaAprob, m.aut, m.t]));
    });
  }
  ids(): string[] { return this.bd.todos('SELECT id FROM ejecutoras').map(f => String(f.id)); }
  /** Borra los espacios antiguos compartidos (anteriores a la separación por usuario). */
  eliminarCompartidas(): void { this.bd.run(`DELETE FROM ejecutoras WHERE id NOT LIKE '%${SEP}%'`); }
}
