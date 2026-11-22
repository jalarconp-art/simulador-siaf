/* Contratos de entrada de cada operación (validación de forma con Zod; la validación de negocio va en los servicios). */
import { z } from 'zod';

const zItem = z.object({ clas: z.string().min(1), meta: z.string().default(''), monto: z.coerce.number() });
const zDoc = z.object({ cod: z.string().default(''), serie: z.string().default(''), num: z.string().default(''), fecha: z.string().default('') });
const zEj = z.string().min(2).max(10);

export const S = {
  certGrabar: z.object({ ejecutora: zEj, id: z.string().optional(), doc: zDoc, rubro: z.string(), tipoCert: z.string(), disp: z.string().default(''), justif: z.string(), items: z.array(zItem) }),
  certModificacion: z.object({ ejecutora: zEj, certId: z.string(), tipo: z.enum(['AMPLIACION', 'REBAJA', 'ANULACION']), doc: zDoc, items: z.array(zItem) }),
  caGrabar: z.object({ ejecutora: zEj, id: z.string().optional(), certId: z.string(), tipoOp: z.string(), doc: zDoc, provNum: z.string(), justif: z.string(), items: z.array(zItem) }),
  caModificacion: z.object({ ejecutora: zEj, caId: z.string(), tipo: z.enum(['AMPLIACION', 'REBAJA', 'ANULACION']), doc: zDoc, items: z.array(zItem) }),
  cmGrabar: z.object({ ejecutora: zEj, expId: z.string().optional(), sec: z.number().optional(), caId: z.string(), modalidad: z.string().default(''), tipoProc: z.string().default('NO APLICA'), faseContr: z.string().default(''), expEnc: z.string().default(''), doc: zDoc, notas: z.string(), tipoPago: z.string(), tipoRecurso: z.string(), ent: z.string().default(''), items: z.array(zItem) }),
  cmRebaja: z.object({ ejecutora: zEj, expId: z.string(), notas: z.string(), items: z.array(zItem) }),
  devGrabar: z.object({ ejecutora: zEj, expId: z.string(), sec: z.number().optional(), rend: z.boolean(), doc: zDoc, notas: z.string(), ent: z.string().default(''), items: z.array(zItem), comp: z.array(z.object({ tipo: z.string(), num: z.string(), fecha: z.string().default(''), desc: z.string().default(''), clas: z.string(), monto: z.coerce.number() })).default([]) }),
  girGrabar: z.object({ ejecutora: zEj, expId: z.string(), sec: z.number().optional(), tipoGiro: z.string(), medio: z.string(), docGiro: z.string(), fecha: z.string(), benefNum: z.string(), items: z.array(zItem), ret: z.array(z.object({ concepto: z.string(), monto: z.coerce.number() })).default([]) }),
  t6Grabar: z.object({ ejecutora: zEj, expId: z.string(), sec: z.number().optional(), num: z.string(), fecha: z.string(), notas: z.string(), items: z.array(zItem) }),
  pagado: z.object({ ejecutora: zEj, expId: z.string(), sec: z.number() }),
  detGrabar: z.object({ ejecutora: zEj, rubro: z.string(), doc: zDoc, notas: z.string(), tipoPago: z.string().default(''), items: z.array(zItem) }),
  recGrabar: z.object({ ejecutora: zEj, ingId: z.string(), doc: zDoc, notas: z.string(), items: z.array(zItem) }),
  modGrabar: z.object({ ejecutora: zEj, id: z.string().optional(), tipo: z.enum(['CERT', 'CA']), refId: z.string(), campo: z.string(), valor: z.string() }),
  target: z.object({ k: z.enum(['cs', 'ca', 'cam', 'es', 'is', 'md']), x: zEj, id: z.string(), s: z.number().optional(), n: z.number().optional() }),
  proveedor: z.object({ ejecutora: zEj, tipo: z.enum(['RUC', 'DNI']), num: z.string(), nom: z.string() }),
  registro: z.object({ dni: z.string(), apellidos: z.string(), nombres: z.string(), email: z.string(), clave: z.string() }),
  rol: z.enum(['ADMINISTRADOR', 'OPERADOR', 'LOGISTICA', 'PRESUPUESTO', 'CONTABILIDAD', 'TESORERIA', 'CONSULTA']),
  permisos: z.record(z.enum(['cert', 'ca', 'cm', 'dev', 'gir', 'mod', 'det', 'opp', 'cont']), z.enum(['C', 'O'])),
  usuario: z.object({ dni: z.string(), apellidos: z.string(), nombres: z.string(), email: z.string(), rol: z.enum(['ADMINISTRADOR', 'OPERADOR', 'LOGISTICA', 'PRESUPUESTO', 'CONTABILIDAD', 'TESORERIA', 'CONSULTA']) }),
  responsable: z.object({ ejecutora: zEj, tipo: z.enum(['del', 'ccp', 'ca', 'cta', 'dev']), dni: z.string(), nombre: z.string(), cargo: z.string(), area: z.string(), email: z.string(), doc: z.string(), fdoc: z.string(), rol: z.string().default('') })
};
export type Cmd<K extends keyof typeof S> = z.infer<typeof S[K]>;
export type CmdIn<K extends keyof typeof S> = z.input<typeof S[K]>;
export type CmdTarget = z.infer<typeof S.target>;
