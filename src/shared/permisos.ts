/* Perfiles y permisos al estilo del Administrador de usuarios de SIAF Operaciones en Línea:
   cada usuario tiene un perfil y, por cada opción, acceso de Consulta (C) u Operación (O). */
import type { Nivel, Opcion, Permisos, Rol, Target, Usuario } from './types';

export const OPCIONES: { k: Opcion; t: string; grupo: string }[] = [
  { k: 'cert', t: 'Certificación', grupo: 'Módulo de Ejecución' },
  { k: 'ca', t: 'Compromiso Anual', grupo: 'Módulo de Ejecución' },
  { k: 'cm', t: 'Registro SIAF - Compromiso Mensual', grupo: 'Módulo de Ejecución' },
  { k: 'dev', t: 'Registro SIAF - Devengado', grupo: 'Módulo de Ejecución' },
  { k: 'gir', t: 'Registro SIAF - Girado, Pagado y Papeleta T-6', grupo: 'Módulo de Ejecución' },
  { k: 'mod', t: 'Modificación de Certificación y Compromiso Anual', grupo: 'Módulo de Ejecución' },
  { k: 'det', t: 'Registro SIAF - Determinado y Recaudado', grupo: 'Módulo de Ejecución' },
  { k: 'cont', t: 'Módulo Contable y Reportes', grupo: 'Módulo de Ejecución' },
  { k: 'opp', t: 'Módulo Presupuestal UE (aprobación OPP)', grupo: 'SIAF Operaciones en Línea' }
];

const todo = (n: Nivel): Permisos => Object.fromEntries(OPCIONES.map(o => [o.k, n])) as Permisos;

export const ROLES: { k: Rol; t: string; desc: string; permisos: Permisos }[] = [
  { k: 'ADMINISTRADOR', t: 'Administrador de usuarios', desc: 'Crea usuarios, asigna perfiles y opciones; acceso total y panel de administración', permisos: todo('O') },
  { k: 'OPERADOR', t: 'Operador del Módulo de Ejecución', desc: 'Registra todas las fases del gasto e ingreso y aprueba en su propio espacio', permisos: todo('O') },
  { k: 'LOGISTICA', t: 'Logística / Abastecimiento', desc: 'Certificación, compromiso anual y compromiso mensual', permisos: { ...todo('C'), cert: 'O', ca: 'O', cm: 'O', mod: 'O' } },
  { k: 'PRESUPUESTO', t: 'Oficina de Presupuesto (OPP)', desc: 'Aprueba certificaciones y modificaciones en Operaciones en Línea', permisos: { ...todo('C'), cert: 'O', mod: 'O', opp: 'O' } },
  { k: 'CONTABILIDAD', t: 'Contabilidad', desc: 'Devengado y módulo contable', permisos: { ...todo('C'), dev: 'O', cont: 'O' } },
  { k: 'TESORERIA', t: 'Tesorería', desc: 'Girado, pagado, papeleta T-6, determinado y recaudado', permisos: { ...todo('C'), gir: 'O', det: 'O' } },
  { k: 'CONSULTA', t: 'Consulta', desc: 'Solo visualiza los registros y reportes', permisos: todo('C') }
];

export const ROL_TXT: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.k, r.t]));
export const permisosDeRol = (r: Rol): Permisos => ({ ...(ROLES.find(x => x.k === r)?.permisos || {}) });
/** Convierte perfiles de versiones anteriores. */
export const rolVigente = (r: string): Rol => (r === 'DOCENTE' ? 'ADMINISTRADOR' : r === 'OPP' ? 'PRESUPUESTO' : (ROLES.some(x => x.k === r) ? r as Rol : 'OPERADOR'));

export const esAdmin = (u?: Pick<Usuario, 'rol'> | null): boolean => u?.rol === 'ADMINISTRADOR';
/** ¿El usuario tiene la opción con el nivel pedido? Operación incluye consulta. */
export function puede(u: Pick<Usuario, 'rol' | 'permisos'> | null | undefined, op: Opcion, nivel: Nivel = 'O'): boolean {
  if (!u) return false;
  if (esAdmin(u)) return true;
  const p = u.permisos?.[op];
  return nivel === 'C' ? !!p : p === 'O';
}
/** Opción que corresponde a una transición de estado (envío o descarte). */
export function opcionDeTarget(t: Target, fase?: string): Opcion {
  if (t.k === 'cs') return 'cert';
  if (t.k === 'ca' || t.k === 'cam') return 'ca';
  if (t.k === 'md') return 'mod';
  if (t.k === 'is') return 'det';
  return fase === 'C' ? 'cm' : fase === 'D' ? 'dev' : 'gir';
}
export const NOMBRE_OPCION: Record<Opcion, string> = Object.fromEntries(OPCIONES.map(o => [o.k, o.t])) as Record<Opcion, string>;
