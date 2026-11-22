/* Almacenamiento compartido en Supabase: autenticación (correo y Google), perfiles, espacios y auditoría. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Auditoria, Permisos, Rol, Usuario } from '@shared/types';
import { permisosDeRol, rolVigente } from '@shared/permisos';
import type { Backend, DatosRegistro, EspacioGuardado } from './tipos';

type FilaPerfil = { id: string; usuario: string; email: string; dni: string; apellidos: string; nombres: string; rol: string; permisos: Permisos | null; estado: string; proveedor: string; creado: string };
const fecha = (iso: string) => { const d = new Date(iso); return isNaN(+d) ? iso : d.toLocaleDateString('es-PE') + ' ' + d.toLocaleTimeString('es-PE'); };
const aUsuario = (f: FilaPerfil): Usuario => {
  const rol = rolVigente(f.rol);
  return { id: f.id, usuario: f.usuario, email: f.email, dni: f.dni, apellidos: f.apellidos, nombres: f.nombres, rol, permisos: f.permisos && Object.keys(f.permisos).length ? f.permisos : permisosDeRol(rol), estado: f.estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO', creado: fecha(f.creado), proveedor: f.proveedor === 'google' ? 'google' : 'local' };
};
const traducir = (m: string): string => {
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme su correo: le enviamos un enlace de verificación.';
  if (/already registered|already been registered/i.test(m)) return 'Ya existe una cuenta registrada con ese correo. Inicie sesión.';
  if (/Password should be/i.test(m)) return 'La contraseña es demasiado corta o débil.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Espere un momento e inténtelo otra vez.';
  return m;
};

export class BackendSupabase implements Backend {
  readonly nombre = 'supabase' as const;
  private sb: SupabaseClient;
  constructor(url: string, clave: string) { this.sb = createClient(url, clave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); }

  private async perfil(id: string): Promise<Usuario> {
    /* el disparador crea el perfil al registrarse; se reintenta brevemente por si aún no está */
    for (let i = 0; i < 5; i++) {
      const { data, error } = await this.sb.from('perfiles').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return aUsuario(data as FilaPerfil);
      await new Promise(r => setTimeout(r, 400));
    }
    throw new Error('No se encontró el perfil del usuario. Verifique que ejecutó supabase/schema.sql.');
  }
  async sesionActual(): Promise<Usuario | null> {
    const { data } = await this.sb.auth.getSession();
    return data.session ? this.perfil(data.session.user.id) : null;
  }
  async login(email: string, clave: string): Promise<Usuario> {
    if (!email.includes('@')) throw new Error('En la versión web ingrese con su correo electrónico.');
    const { data, error } = await this.sb.auth.signInWithPassword({ email: email.trim(), password: clave });
    if (error) throw new Error(traducir(error.message));
    return this.perfil(data.user.id);
  }
  async registrar(d: DatosRegistro): Promise<Usuario | null> {
    const { data, error } = await this.sb.auth.signUp({ email: d.email.trim().toLowerCase(), password: d.clave, options: { data: { dni: d.dni.trim(), apellidos: d.apellidos.trim(), nombres: d.nombres.trim() }, emailRedirectTo: location.origin } });
    if (error) throw new Error(traducir(error.message));
    if (!data.session || !data.user) return null;
    return this.perfil(data.user.id);
  }
  googleDisponible(): boolean { return true; }
  async google(): Promise<void> {
    const { error } = await this.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin, queryParams: { prompt: 'select_account' } } });
    if (error) throw new Error(traducir(error.message));
  }
  async logout(): Promise<void> { await this.sb.auth.signOut(); }
  async cambiarClave(actual: string, nueva: string): Promise<void> {
    const { data } = await this.sb.auth.getUser();
    if (!data.user?.email) throw new Error('Debe iniciar sesión.');
    if (data.user.app_metadata?.provider !== 'google') {
      const r = await this.sb.auth.signInWithPassword({ email: data.user.email, password: actual });
      if (r.error) throw new Error('La contraseña actual no es correcta.');
    }
    const { error } = await this.sb.auth.updateUser({ password: nueva });
    if (error) throw new Error(traducir(error.message));
  }
  async cargarEspacio(usuarioId: string, caso: string): Promise<EspacioGuardado | null> {
    const { data, error } = await this.sb.from('espacios').select('*').eq('usuario_id', usuarioId).eq('caso', caso).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? { usuarioId: data.usuario_id, caso: data.caso, datos: data.datos, responsables: data.responsables || [], actualizado: data.actualizado } : null;
  }
  async guardarEspacio(e: Omit<EspacioGuardado, 'actualizado'>): Promise<void> {
    const { error } = await this.sb.from('espacios').upsert({ usuario_id: e.usuarioId, caso: e.caso, datos: e.datos, responsables: e.responsables, actualizado: new Date().toISOString() });
    if (error) throw new Error('No se pudo guardar en la nube: ' + error.message);
  }
  async registrarAuditoria(usuarioId: string, filas: Omit<Auditoria, 'id'>[]): Promise<void> {
    if (!filas.length) return;
    await this.sb.from('auditoria').insert(filas.map(f => ({ usuario_id: usuarioId, fecha: f.fecha, usuario: f.usuario, ejecutora: f.ejecutora, accion: f.accion, entidad: f.entidad, detalle: f.detalle })));
  }
  async listarPerfiles(): Promise<Usuario[]> {
    const { data, error } = await this.sb.from('perfiles').select('*').order('creado');
    if (error) throw new Error(error.message);
    return (data as FilaPerfil[]).map(aUsuario);
  }
  async actualizarPerfil(id: string, cambios: { rol?: Rol; permisos?: Permisos; estado?: 'ACTIVO' | 'INACTIVO' }): Promise<void> {
    const { error } = await this.sb.from('perfiles').update(cambios).eq('id', id);
    if (error) throw new Error(error.message);
  }
  async listarEspacios(): Promise<EspacioGuardado[]> {
    const { data, error } = await this.sb.from('espacios').select('*');
    if (error) throw new Error(error.message);
    return (data || []).map(d => ({ usuarioId: d.usuario_id, caso: d.caso, datos: d.datos, responsables: d.responsables || [], actualizado: d.actualizado }));
  }
  async listarAuditoria(filtro: string, limite: number): Promise<Auditoria[]> {
    let q = this.sb.from('auditoria').select('*').order('id', { ascending: false }).limit(limite);
    const f = filtro.trim().replace(/[,%()]/g, ' ');
    if (f) q = q.or(`usuario.ilike.%${f}%,accion.ilike.%${f}%,detalle.ilike.%${f}%,ejecutora.ilike.%${f}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(a => ({ id: a.id, fecha: a.fecha, usuario: a.usuario, ejecutora: a.ejecutora || '', accion: a.accion, entidad: a.entidad || '', detalle: a.detalle || '' }));
  }
}
