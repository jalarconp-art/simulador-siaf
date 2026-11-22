/* Autenticación y gestión de usuarios operadores (contraseñas con scrypt + sal). */
import crypto from 'crypto';
import type { Contexto } from './contexto';
import type { Permisos, Rol, Sesion, Usuario } from '@shared/types';
import { OPCIONES, permisosDeRol, ROLES } from '@shared/permisos';
import { exigir } from '@shared/domain/reglas';
import { hoy, hora, uid } from '@shared/util';

export function hashClave(clave: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  return { hash: crypto.scryptSync(clave, salt, 64).toString('hex'), salt };
}
export function verificarClave(clave: string, hash: string, salt: string): boolean {
  const h = crypto.scryptSync(clave, salt, 64);
  const b = Buffer.from(hash, 'hex');
  return b.length === h.length && crypto.timingSafeEqual(b, h);
}
const claveTemporal = (): string => crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, 'x').slice(0, 8);

export class AuthService {
  private intentos = new Map<string, number>();
  constructor(private ctx: Contexto) {}

  /** Inicio de sesión con el código de usuario (RU20261) o con el correo electrónico registrado. */
  login(usuario: string, clave: string): Sesion {
    const id = usuario.trim();
    const u = id.includes('@') ? this.ctx.usuarios.porEmail(id) : (this.ctx.usuarios.porUsuario(id.toUpperCase()) || this.ctx.usuarios.porUsuario(id.toLowerCase()));
    const k = id.toUpperCase();
    exigir((this.intentos.get(k) || 0) < 5, 'Usuario bloqueado temporalmente por intentos fallidos. Reinicie la aplicación.');
    if (!u || !verificarClave(clave, u.hash, u.salt)) {
      this.intentos.set(k, (this.intentos.get(k) || 0) + 1);
      this.ctx.bd.transaccion(() => this.ctx.auditar('auth.login-fallido', '', 'usuario', k));
      exigir(false, 'Usuario o contraseña incorrectos.');
    }
    exigir(u!.estado === 'ACTIVO', 'El usuario está inactivo.');
    this.intentos.delete(k);
    const { hash, salt, ...pub } = u!;
    return this.abrirSesion(pub);
  }
  private abrirSesion(pub: Usuario): Sesion {
    this.ctx.asegurarEspacio(pub.id);
    this.ctx.sesion = { usuario: pub, inicio: hoy() + ' ' + hora() };
    this.ctx.bd.transaccion(() => this.ctx.auditar('auth.login', '', 'usuario', pub.usuario + ' (' + pub.rol + ')'));
    return this.ctx.sesion;
  }

  /** Registro público con correo electrónico: crea un usuario operador con su propio espacio de trabajo e inicia sesión. */
  registrar(d: { dni: string; apellidos: string; nombres: string; email: string; clave: string }): Sesion {
    const email = d.email.trim().toLowerCase();
    exigir(d.apellidos.trim() && d.nombres.trim(), 'Ingrese sus apellidos y nombres.');
    exigir(/^\d{8}$/.test(d.dni.trim()), 'Ingrese un DNI de 8 dígitos.');
    exigir(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), 'Ingrese un correo electrónico válido.');
    exigir(!this.ctx.usuarios.existeEmail(email), 'Ya existe una cuenta registrada con ese correo. Inicie sesión.');
    exigir(!this.ctx.usuarios.existeDni(d.dni.trim()), 'Ya existe una cuenta registrada con ese DNI.');
    exigir(d.clave.length >= 8 && /\d/.test(d.clave) && /[a-zA-Z]/.test(d.clave), 'La contraseña debe tener al menos 8 caracteres y combinar letras y números.');
    let n = 20261; while (this.ctx.usuarios.porUsuario('RU' + n)) n++;
    const { hash, salt } = hashClave(d.clave);
    const usuario: Usuario = { id: uid(), usuario: 'RU' + n, dni: d.dni.trim(), apellidos: d.apellidos.trim().toUpperCase(), nombres: d.nombres.trim().toUpperCase(), email, rol: 'OPERADOR', permisos: permisosDeRol('OPERADOR'), estado: 'ACTIVO', creado: hoy() + ' ' + hora() };
    this.ctx.bd.transaccion(() => { this.ctx.usuarios.insertar(usuario, hash, salt); this.ctx.auditar('usuario.registro', '', 'usuario', usuario.usuario + ' ' + email); });
    return this.abrirSesion(usuario);
  }

  /** Acceso con cuenta de Google (identidad ya verificada por Google): vincula o crea el usuario por su correo. */
  loginGoogle(g: { sub: string; email: string; nombres: string; apellidos: string }): Sesion {
    const email = g.email.trim().toLowerCase();
    exigir(g.sub && email, 'Google no devolvió la identidad de la cuenta.');
    let u = this.ctx.usuarios.porGoogle(g.sub) || this.ctx.usuarios.porEmail(email);
    if (u) {
      exigir(u.estado === 'ACTIVO', 'El usuario está inactivo. Comuníquese con el Administrador de usuarios.');
      this.ctx.bd.transaccion(() => this.ctx.usuarios.vincularGoogle(u!.id, g.sub));
    } else {
      let n = 20261; while (this.ctx.usuarios.porUsuario('RU' + n)) n++;
      const nuevo: Usuario = { id: uid(), usuario: 'RU' + n, dni: '00000000', apellidos: (g.apellidos || '').toUpperCase() || 'CUENTA GOOGLE', nombres: (g.nombres || email.split('@')[0]).toUpperCase(), email, rol: 'OPERADOR', permisos: permisosDeRol('OPERADOR'), estado: 'ACTIVO', creado: hoy() + ' ' + hora() };
      const { hash, salt } = hashClave(crypto.randomBytes(24).toString('hex'));
      this.ctx.bd.transaccion(() => { this.ctx.usuarios.insertar(nuevo, hash, salt, g.sub); this.ctx.auditar('usuario.registro-google', '', 'usuario', nuevo.usuario + ' ' + email); });
      u = this.ctx.usuarios.porGoogle(g.sub)!;
    }
    const { hash, salt, ...pub } = u!;
    return this.abrirSesion({ ...pub, proveedor: 'google' });
  }
  /** El administrador asigna el perfil SIAF y las opciones (Consulta / Operación) de un usuario. */
  asignarPerfil(id: string, rol: Rol, permisos: Permisos): Usuario {
    this.ctx.requerirAdmin();
    const u = this.ctx.usuarios.porId(id); exigir(u, 'Usuario no encontrado.');
    exigir(ROLES.some(r => r.k === rol), 'Perfil no válido.');
    if (u!.id === this.ctx.sesion!.usuario.id) exigir(rol === 'ADMINISTRADOR', 'No puede quitarse a sí mismo el perfil de Administrador.');
    const limpio: Permisos = {};
    OPCIONES.forEach(o => { const v = permisos[o.k]; if (v === 'C' || v === 'O') limpio[o.k] = v; });
    this.ctx.bd.transaccion(() => { this.ctx.usuarios.actualizarPerfil(id, rol, limpio); this.ctx.auditar('usuario.perfil', '', 'usuario', u!.usuario + ' → ' + rol + ' ' + JSON.stringify(limpio)); });
    return { ...u!, rol, permisos: limpio };
  }
  logout(): void {
    if (this.ctx.sesion) this.ctx.bd.transaccion(() => this.ctx.auditar('auth.logout', '', 'usuario', this.ctx.usuarioActual));
    this.ctx.sesion = null;
  }
  /** Solo el docente ve la lista completa de usuarios. */
  listar(): Usuario[] { this.ctx.requerirAdmin(); return this.ctx.usuarios.listar(); }

  crear(d: { dni: string; apellidos: string; nombres: string; email: string; rol: Rol }): { usuario: Usuario; clave: string } {
    this.ctx.requerirAdmin();
    exigir(/^\d{8}$/.test(d.dni), 'Ingrese un DNI de 8 dígitos.');
    exigir(!this.ctx.usuarios.existeDni(d.dni), 'Ya existe un usuario con ese DNI.');
    exigir(d.apellidos.trim() && d.nombres.trim(), 'Ingrese apellidos y nombres.');
    exigir(/^\S+@\S+\.\S+$/.test(d.email), 'Ingrese un correo electrónico válido.');
    exigir(!this.ctx.usuarios.existeEmail(d.email), 'Ya existe un usuario con ese correo.');
    const pref = d.rol === 'ADMINISTRADOR' ? 'ADM' : 'RU';
    let n = 20261; while (this.ctx.usuarios.porUsuario(pref + n)) n++;
    const clave = claveTemporal(); const { hash, salt } = hashClave(clave);
    const usuario: Usuario = { id: uid(), usuario: pref + n, dni: d.dni, apellidos: d.apellidos.trim().toUpperCase(), nombres: d.nombres.trim().toUpperCase(), email: d.email.trim().toLowerCase(), rol: d.rol, permisos: permisosDeRol(d.rol), estado: 'ACTIVO', creado: hoy() + ' ' + hora() };
    this.ctx.bd.transaccion(() => { this.ctx.usuarios.insertar(usuario, hash, salt); this.ctx.auditar('usuario.crear', '', 'usuario', usuario.usuario + ' ' + usuario.rol); });
    this.ctx.asegurarEspacio(usuario.id);
    return { usuario, clave };
  }
  cambiarEstado(id: string): Usuario {
    this.ctx.requerirAdmin();
    const u = this.ctx.usuarios.porId(id); exigir(u, 'Usuario no encontrado.');
    exigir(u!.id !== this.ctx.sesion!.usuario.id, 'No puede desactivar el usuario en sesión.');
    const est = u!.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.ctx.bd.transaccion(() => { this.ctx.usuarios.cambiarEstado(id, est); this.ctx.auditar('usuario.estado', '', 'usuario', u!.usuario + ' → ' + est); });
    return { ...u!, estado: est };
  }
  restablecerClave(id: string): string {
    this.ctx.requerirAdmin();
    const u = this.ctx.usuarios.porId(id); exigir(u, 'Usuario no encontrado.');
    const clave = claveTemporal(); const { hash, salt } = hashClave(clave);
    this.ctx.bd.transaccion(() => { this.ctx.usuarios.cambiarClave(id, hash, salt); this.ctx.auditar('usuario.clave', '', 'usuario', u!.usuario); });
    return clave;
  }
  cambiarMiClave(actual: string, nueva: string): void {
    this.ctx.requerirSesion();
    const u = this.ctx.usuarios.porUsuario(this.ctx.sesion!.usuario.usuario)!;
    exigir(this.ctx.sesion!.usuario.proveedor !== 'google' || verificarClave(actual, u.hash, u.salt), 'Su cuenta ingresa con Google: la contraseña se administra en su cuenta de Google.');
    exigir(verificarClave(actual, u.hash, u.salt), 'La contraseña actual no es correcta.');
    exigir(nueva.length >= 8 && /\d/.test(nueva) && /[a-zA-Z]/.test(nueva), 'La nueva contraseña debe tener al menos 8 caracteres y combinar letras y números.');
    const { hash, salt } = hashClave(nueva);
    this.ctx.bd.transaccion(() => { this.ctx.usuarios.cambiarClave(u.id, hash, salt); this.ctx.auditar('usuario.mi-clave', '', 'usuario', u.usuario); });
  }
}
