/* ==========================================================
   Tipos del dominio SIAF-SP (compartidos por main, preload y renderer)
   ========================================================== */
export type Estado =
  | 'REGISTRADO' | 'EN VERIFICACION' | 'ENVIADO A OPP' | 'PENDIENTE DE FIRMA'
  | 'APROBADO' | 'RECHAZADO' | 'DESCARTADO' | 'ANULADO';

export interface Item { clas: string; meta: string; monto: number }
export interface Doc { cod: string; serie: string; num: string; fecha: string }
export interface Persona { tipo: string; num: string; nom: string }

export type TipoSecCert = 'INICIAL' | 'AMPLIACION' | 'REBAJA' | 'ANULACION';
export interface CertSec {
  id: string; sec: number; t: number; tipo: TipoSecCert; estado: Estado;
  fecha: string; doc: Doc; items: Item[]; fechaAprob: string; aut: string;
}
export interface Certificado {
  id: string; num: number; sub: string; mes: number; anio: number; doc: Doc;
  rubro: string; ff: string; tipoCert: string; disp: string; justif: string;
  fecha: string; t: number; secs: CertSec[];
}
export interface CAMod {
  id: string; n: number; tipo: 'AMPLIACION' | 'REBAJA' | 'ANULACION'; estado: Estado;
  fecha: string; doc: Doc; items: Item[]; fechaAprob: string; aut: string;
}
export interface CompromisoAnual {
  id: string; num: number; certId: string; sub: string; mes: number; fecha: string;
  tipoOp: string; doc: Doc; prov: Persona; justif: string; items: Item[];
  estado: Estado; fechaAprob: string; aut: string; t: number; mods: CAMod[]; transf?: string;
}
export interface Retencion { concepto: string; monto: number }
export interface Giro { medio: string; tipoGiro: string; benef: Persona; ret: Retencion[] }
export interface Comprobante { tipo: string; num: string; fecha: string; desc: string; clas: string; monto: number }
export type FaseExp = 'C' | 'D' | 'G' | 'P' | 'T6';
export interface ExpSec {
  id: string; sec: number; t: number; fase: FaseExp; rend: boolean; rol: string; hist: boolean;
  estado: Estado; mes: number; fecha: string; doc: Doc; prov: Persona | null; notas: string;
  tipoPago: string; tipoRecurso: string; tipoComp: string; ent: string; items: Item[];
  comp: Comprobante[]; giro: Giro | null; pagado: boolean; ref: number; fechaAprob: string; aut: string;
}
export interface Expediente {
  id: string; num: number; sub: string; caId: string; tipoOp: string; mes: number;
  modalidad: string; tipoProc: string; faseContr: string; expEnc: string; ff: string; rubro: string;
  t: number; secs: ExpSec[];
}
export interface IngSec {
  id: string; sec: number; t: number; fase: 'D' | 'R'; estado: Estado; fecha: string; mes: number;
  doc: Doc; notas: string; tipoPago: string; items: Item[]; fechaAprob: string; aut: string;
}
export interface Ingreso { id: string; num: number; sub: string; mes: number; ff: string; rubro: string; t: number; secs: IngSec[] }
export interface Modificacion {
  id: string; num: number; tipo: 'CERT' | 'CA'; refId: string; campo: string; antes: string; despues: string;
  estado: Estado; fecha: string; mes: number; fechaAprob: string; aut: string; t: number;
}
export type ModoEjecutora = 'solucion' | 'practica' | 'vacio';
/** Registro de las opciones complementarias del Módulo de Ejecución (cuentas, CCI, viáticos, convenios...). */
export interface RegAux { id: string; tipo: string; num: number; mes: number; fecha: string; estado: Estado; datos: Record<string, string>; t: number }
export interface Ejecutora {
  id: string; modo: ModoEjecutora; sub: string; fechaSis: string; seq: Record<string, number>; tick: number;
  certs: Certificado[]; cas: CompromisoAnual[]; exps: Expediente[]; ings: Ingreso[]; mods: Modificacion[];
  provs: Persona[]; aux?: RegAux[];
}

/* ---------- definición declarativa de los casos ---------- */
export type LineaAsiento = [number, string, string, string, number, number, string, string?];
export interface OpDef {
  op: 'cert' | 'certAmp' | 'ca' | 'cm' | 'dev' | 'rend' | 'gir' | 'pag' | 't6' | 'det' | 'rec';
  fase: string; key?: string; ref?: string; num?: number; exp?: number; mes: number; fecha: string;
  doc?: string[]; tipoCert?: string; justif?: string; tipoOp?: string; prov?: [string, string];
  items: [string, string, number][]; notas?: string; modalidad?: string; tipoProc?: string; tipoPago?: string;
  rol?: string; hist?: boolean; medio?: string; tipoGiro?: string; benef?: [string, string]; docGiro?: string;
  ret?: [string, number][]; comp?: [string, string, string, string, string, number][]; ff?: string; rubro?: string;
  sin?: string; as?: LineaAsiento[];
}
export type ControlDef = [string, string, any, any?];
export interface SubcasoDef {
  id: string; titulo: string; ff: string; rubro: string; meta?: string; ingreso?: boolean;
  enunciado: string[]; datos: [string, string][]; nota?: string; ops: OpDef[]; controles: ControlDef[];
  docsFuente: [string, string, string][]; pregunta: string; respuesta: string; pasos?: [string, string][];
}
export interface MetaDef { sec: string; cadena: string; nombre: string; cat: string; prod: string; act: string; fn: string; div: string; grp: string }
export interface EntidadDef { pliego: string; pliegoNom: string; ue: string; ueNom: string; secEjec: string; ruc: string; depto: string; prov: string; dir: string }
export interface CasoDef {
  grupo: string; titulo: string; corto: string; anio: number; nivel: string; entidad: EntidadDef;
  metas: MetaDef[]; pim: [string, string, string, number][]; pia?: [string, string, number][];
  proveedores: [string, string, string][]; seq: Record<string, number>; subcasos: SubcasoDef[];
}

/* ---------- seguridad, aula y auditoría ---------- */
/** Perfiles de usuario de la Plataforma SIAF-SP (Administrador de usuarios de SIAF Operaciones en Línea). */
export type Rol = 'ADMINISTRADOR' | 'OPERADOR' | 'LOGISTICA' | 'PRESUPUESTO' | 'CONTABILIDAD' | 'TESORERIA' | 'CONSULTA';
/** Opciones del Módulo de Ejecución y de Operaciones en Línea que el administrador habilita a cada usuario. */
export type Opcion = 'cert' | 'ca' | 'cm' | 'dev' | 'gir' | 'mod' | 'det' | 'opp' | 'cont';
/** C = consulta, O = operación (registrar, modificar, enviar, descartar, aprobar). */
export type Nivel = 'C' | 'O';
export type Permisos = Partial<Record<Opcion, Nivel>>;
export interface Usuario {
  id: string; usuario: string; dni: string; apellidos: string; nombres: string; email: string;
  rol: Rol; permisos: Permisos; estado: 'ACTIVO' | 'INACTIVO'; creado: string; proveedor?: 'local' | 'google';
}
export interface Sesion { usuario: Usuario; inicio: string }
export interface Responsable {
  id: string; ejecutora: string; tipo: 'del' | 'ccp' | 'ca' | 'cta' | 'dev'; dni: string; nombre: string;
  cargo: string; area: string; email: string; doc: string; fdoc: string; rol: string; emailOk: boolean;
  estado: 'AUTORIZADO' | 'POR AUTORIZAR' | 'BAJA';
}
export interface Aula { id: string; nombre: string; periodo: string; creado: string; estudiantes: number }
export interface Estudiante { id: string; aulaId: string; codigo: string; nombres: string; dni: string }
export interface Entrega {
  id: string; estudianteId: string; fecha: string; archivo: string; puntaje: number; nota20: number;
  detalle: { ejecutora: string; sub: string; titulo: string; ok: number; total: number }[];
}
export interface Auditoria { id: number; fecha: string; usuario: string; ejecutora: string; accion: string; entidad: string; detalle: string }

/* ---------- objetivo de una transición de estado ---------- */
export type Target =
  | { k: 'cs'; x: string; id: string; s: number }
  | { k: 'ca'; x: string; id: string }
  | { k: 'cam'; x: string; id: string; n: number }
  | { k: 'es'; x: string; id: string; s: number }
  | { k: 'is'; x: string; id: string; s: number }
  | { k: 'md'; x: string; id: string };

export interface Resultado<T = unknown> { ok: boolean; data?: T; error?: string; msg?: string }
