/* Máquina de estados de los registros SIAF-WEB.
   Certificación:   Registrado › En verificación › Enviado a OPP › Pendiente de firma › Aprobado
   Compromiso anual: Registrado › En verificación › Pendiente de firma (MADAF) › Aprobado
   Compromiso mensual / T-6 / pagado / determinado / recaudado: Registrado › En verificación › Aprobado
   Devengado y girado: Registrado › En verificación › Pendiente de firma (MADAF) › Aprobado */
import type { Estado, Target } from '../types';

export interface ObjetoEstado { estado: Estado; tipo?: string; fase?: string; campo?: string }

export function siguienteTrasVerificacion(t: Target, o: ObjetoEstado): Estado {
  switch (t.k) {
    case 'cs': return o.tipo === 'INICIAL' || o.tipo === 'AMPLIACION' ? 'ENVIADO A OPP' : 'APROBADO';
    case 'ca': return 'PENDIENTE DE FIRMA';
    case 'cam': return o.tipo === 'AMPLIACION' ? 'PENDIENTE DE FIRMA' : 'APROBADO';
    case 'es': return o.fase === 'D' || o.fase === 'G' ? 'PENDIENTE DE FIRMA' : 'APROBADO';
    case 'is': return 'APROBADO';
    case 'md': return o.tipo === 'CERT' ? 'ENVIADO A OPP' : o.campo === 'Documento proveedor' ? 'PENDIENTE DE FIRMA' : 'APROBADO';
  }
}
/** Transiciones válidas (cualquier otra se rechaza en la capa de servicios). */
const TRANS: Record<Estado, Estado[]> = {
  'REGISTRADO': ['EN VERIFICACION', 'DESCARTADO'],
  'EN VERIFICACION': ['ENVIADO A OPP', 'PENDIENTE DE FIRMA', 'APROBADO', 'RECHAZADO'],
  'ENVIADO A OPP': ['PENDIENTE DE FIRMA', 'APROBADO', 'RECHAZADO'],
  'PENDIENTE DE FIRMA': ['APROBADO', 'RECHAZADO'],
  'APROBADO': ['ANULADO'],
  'RECHAZADO': [], 'DESCARTADO': [], 'ANULADO': []
};
export const transicionValida = (de: Estado, a: Estado): boolean => TRANS[de]?.includes(a) ?? false;
export const editable = (e: Estado): boolean => e === 'REGISTRADO';
/** Quién aprueba el paso pendiente */
export const actorPendiente = (e: Estado): string => e === 'ENVIADO A OPP' ? 'OPP (Operaciones en Línea)' : e === 'PENDIENTE DE FIRMA' ? 'Responsable (MADAF)' : '';
