/* Contrato del almacenamiento compartido de la versión web (Supabase o modo local de demostración). */
import type { Auditoria, Ejecutora, Permisos, Responsable, Rol, Usuario } from '@shared/types';

export interface EspacioGuardado { usuarioId: string; caso: string; datos: Ejecutora; responsables: Responsable[]; actualizado: string }
export interface DatosRegistro { dni: string; apellidos: string; nombres: string; email: string; clave: string }

export interface Backend {
  readonly nombre: 'supabase' | 'local';
  /** Perfil del usuario con sesión activa (por ejemplo, al volver de Google), o null. */
  sesionActual(): Promise<Usuario | null>;
  login(email: string, clave: string): Promise<Usuario>;
  /** Devuelve el perfil o null si el proveedor exige confirmar el correo antes de ingresar. */
  registrar(d: DatosRegistro): Promise<Usuario | null>;
  googleDisponible(): Promise<boolean>;
  google(): Promise<void>;
  logout(): Promise<void>;
  cambiarClave(actual: string, nueva: string): Promise<void>;
  cargarEspacio(usuarioId: string, caso: string): Promise<EspacioGuardado | null>;
  guardarEspacio(e: Omit<EspacioGuardado, 'actualizado'>): Promise<void>;
  registrarAuditoria(usuarioId: string, filas: Omit<Auditoria, 'id'>[]): Promise<void>;
  /* administración (RLS: solo el Administrador de usuarios) */
  listarPerfiles(): Promise<Usuario[]>;
  actualizarPerfil(id: string, cambios: { rol?: Rol; permisos?: Permisos; estado?: 'ACTIVO' | 'INACTIVO' }): Promise<void>;
  listarEspacios(): Promise<EspacioGuardado[]>;
  listarAuditoria(filtro: string, limite: number): Promise<Auditoria[]>;
}
