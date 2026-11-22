/* Modo local de demostración: se usa cuando no hay variables de Supabase configuradas.
   Guarda usuarios, espacios y auditoría en el almacenamiento del navegador (solo este navegador).
   Las contraseñas se derivan con PBKDF2 (WebCrypto). Trae los mismos usuarios iniciales que el escritorio. */
import type { Auditoria, Permisos, Rol, Usuario } from '@shared/types';
import { permisosDeRol } from '@shared/permisos';
import { hoy, hora } from '@shared/util';
import type { Backend, DatosRegistro, EspacioGuardado } from './tipos';

type UsuarioLocal = Usuario & { hash: string; salt: string };
const K = { usuarios: 'siafweb.usuarios', sesion: 'siafweb.sesion', espacios: 'siafweb.espacios', auditoria: 'siafweb.auditoria' };
const leer = <T>(k: string, def: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : def; } catch { return def; } };
const escribir = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { throw new Error('El navegador no permite guardar datos (almacenamiento lleno o bloqueado).'); } };
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function derivar(clave: string, salt: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 120000 }, k, 256));
}
const nuevaSal = () => hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
const sinSecreto = ({ hash, salt, ...u }: UsuarioLocal): Usuario => u;

const INICIALES: [string, string, string, string, string, Rol, string][] = [
  ['ADMIN', 'Admin2026', 'ADMINISTRADOR', 'DE USUARIOS SIAF', 'admin@siafsimulador.pe', 'ADMINISTRADOR', '40000030'],
  ['RU20261', 'Quispe2026', 'QUISPE MAMANI', 'ROSA ELENA', 'rquispe@regionpuno.gob.pe', 'OPERADOR', '41526371'],
  ['RU20262', 'Condori2026', 'CONDORI APAZA', 'CARLOS ALBERTO', 'ccondori@regionpuno.gob.pe', 'OPERADOR', '42637482'],
  ['RU20263', 'Flores2026', 'FLORES CHOQUE', 'LUCIA MARIBEL', 'lflores@regionpuno.gob.pe', 'OPERADOR', '43748593'],
  ['RU20264', 'Ramos2026', 'RAMOS TICONA', 'JORGE LUIS', 'jramos@regionpuno.gob.pe', 'OPERADOR', '44859604']
];

export class BackendLocal implements Backend {
  readonly nombre = 'local' as const;
  private listo: Promise<void>;
  constructor() { this.listo = this.sembrar(); }
  private async sembrar(): Promise<void> {
    if (leer<UsuarioLocal[]>(K.usuarios, []).length) return;
    const lista: UsuarioLocal[] = [];
    for (const [usuario, clave, apellidos, nombres, email, rol, dni] of INICIALES) {
      const salt = nuevaSal();
      lista.push({ id: crypto.randomUUID(), usuario, apellidos, nombres, email, rol, dni, permisos: permisosDeRol(rol), estado: 'ACTIVO', creado: hoy() + ' ' + hora(), proveedor: 'local', salt, hash: await derivar(clave, salt) });
    }
    escribir(K.usuarios, lista);
  }
  private usuarios(): UsuarioLocal[] { return leer<UsuarioLocal[]>(K.usuarios, []); }
  async sesionActual(): Promise<Usuario | null> {
    await this.listo;
    const id = leer<string>(K.sesion, '');
    const u = this.usuarios().find(x => x.id === id);
    return u && u.estado === 'ACTIVO' ? sinSecreto(u) : null;
  }
  async login(id: string, clave: string): Promise<Usuario> {
    await this.listo;
    const t = id.trim().toLowerCase();
    const u = this.usuarios().find(x => x.email.toLowerCase() === t || x.usuario.toLowerCase() === t);
    if (!u || (await derivar(clave, u.salt)) !== u.hash) throw new Error('Usuario o contraseña incorrectos.');
    if (u.estado !== 'ACTIVO') throw new Error('El usuario está inactivo. Comuníquese con el Administrador de usuarios.');
    escribir(K.sesion, u.id);
    return sinSecreto(u);
  }
  async registrar(d: DatosRegistro): Promise<Usuario> {
    await this.listo;
    const lista = this.usuarios(); const email = d.email.trim().toLowerCase();
    if (lista.some(x => x.email.toLowerCase() === email)) throw new Error('Ya existe una cuenta registrada con ese correo. Inicie sesión.');
    if (lista.some(x => x.dni === d.dni.trim())) throw new Error('Ya existe una cuenta registrada con ese DNI.');
    let n = 20261; while (lista.some(x => x.usuario === 'RU' + n)) n++;
    const salt = nuevaSal();
    const u: UsuarioLocal = { id: crypto.randomUUID(), usuario: 'RU' + n, email, dni: d.dni.trim(), apellidos: d.apellidos.trim().toUpperCase(), nombres: d.nombres.trim().toUpperCase(), rol: 'OPERADOR', permisos: permisosDeRol('OPERADOR'), estado: 'ACTIVO', creado: hoy() + ' ' + hora(), proveedor: 'local', salt, hash: await derivar(d.clave, salt) };
    escribir(K.usuarios, [...lista, u]); escribir(K.sesion, u.id);
    return sinSecreto(u);
  }
  async googleDisponible(): Promise<boolean> { return false; }
  async google(): Promise<void> { throw new Error('El acceso con Google requiere conectar Supabase (vea DESPLIEGUE-WEB.md).'); }
  async logout(): Promise<void> { localStorage.removeItem(K.sesion); }
  async cambiarClave(actual: string, nueva: string): Promise<void> {
    const id = leer<string>(K.sesion, ''); const lista = this.usuarios(); const u = lista.find(x => x.id === id);
    if (!u) throw new Error('Debe iniciar sesión.');
    if ((await derivar(actual, u.salt)) !== u.hash) throw new Error('La contraseña actual no es correcta.');
    u.salt = nuevaSal(); u.hash = await derivar(nueva, u.salt); escribir(K.usuarios, lista);
  }
  async cargarEspacio(usuarioId: string, caso: string): Promise<EspacioGuardado | null> { return leer<Record<string, EspacioGuardado>>(K.espacios, {})[usuarioId + '::' + caso] || null; }
  async guardarEspacio(e: Omit<EspacioGuardado, 'actualizado'>): Promise<void> {
    const m = leer<Record<string, EspacioGuardado>>(K.espacios, {}); m[e.usuarioId + '::' + e.caso] = { ...e, actualizado: new Date().toISOString() }; escribir(K.espacios, m);
  }
  async registrarAuditoria(_u: string, filas: Omit<Auditoria, 'id'>[]): Promise<void> {
    const l = leer<Auditoria[]>(K.auditoria, []); let id = l.length ? l[l.length - 1].id : 0;
    escribir(K.auditoria, [...l, ...filas.map(f => ({ ...f, id: ++id }))].slice(-2000));
  }
  async listarPerfiles(): Promise<Usuario[]> { return this.usuarios().map(sinSecreto); }
  async actualizarPerfil(id: string, cambios: { rol?: Rol; permisos?: Permisos; estado?: 'ACTIVO' | 'INACTIVO' }): Promise<void> {
    const l = this.usuarios(); const u = l.find(x => x.id === id); if (!u) throw new Error('Usuario no encontrado.');
    Object.assign(u, cambios); escribir(K.usuarios, l);
  }
  async listarEspacios(): Promise<EspacioGuardado[]> { return Object.values(leer<Record<string, EspacioGuardado>>(K.espacios, {})); }
  async listarAuditoria(filtro: string, limite: number): Promise<Auditoria[]> {
    const f = filtro.trim().toUpperCase();
    return leer<Auditoria[]>(K.auditoria, []).filter(a => !f || (a.usuario + a.accion + a.detalle + a.ejecutora).toUpperCase().includes(f)).reverse().slice(0, limite);
  }
}
