/* Repositorios de seguridad, AERAF, aula y auditoría */
import type { SqlValue } from 'sql.js';
import type { BaseDatos } from '../db/database';
import type { Aula, Auditoria, Entrega, Estudiante, Permisos, Responsable, Rol, Usuario } from '@shared/types';
import { permisosDeRol, rolVigente } from '@shared/permisos';
import { casoDe, duenoDe, SEP } from './ejecutoraRepo';

const s = (v: SqlValue): string => (v == null ? '' : String(v));

export class UsuarioRepo {
  constructor(private bd: BaseDatos) {}
  private map(f: Record<string, SqlValue>): Usuario {
    const rol = rolVigente(s(f.rol));
    let permisos: Permisos = {};
    try { permisos = s(f.permisos) ? JSON.parse(s(f.permisos)) : permisosDeRol(rol); } catch { permisos = permisosDeRol(rol); }
    return { id: s(f.id), usuario: s(f.usuario), dni: s(f.dni), apellidos: s(f.apellidos), nombres: s(f.nombres), email: s(f.email), rol, permisos, estado: s(f.estado) as Usuario['estado'], creado: s(f.creado), proveedor: s(f.proveedor) === 'google' ? 'google' : 'local' };
  }
  porGoogle(sub: string): (Usuario & { hash: string; salt: string }) | null {
    const f = this.bd.uno('SELECT * FROM usuarios WHERE google_sub=?', [sub]);
    return f ? { ...this.map(f), hash: s(f.hash), salt: s(f.salt) } : null;
  }
  vincularGoogle(id: string, sub: string): void { this.bd.run("UPDATE usuarios SET google_sub=?, proveedor='google' WHERE id=?", [sub, id]); }
  actualizarPerfil(id: string, rol: Rol, permisos: Permisos): void { this.bd.run('UPDATE usuarios SET rol=?, permisos=? WHERE id=?', [rol, JSON.stringify(permisos), id]); }
  listar(): Usuario[] { return this.bd.todos('SELECT * FROM usuarios ORDER BY creado, usuario').map(f => this.map(f)); }
  porUsuario(u: string): (Usuario & { hash: string; salt: string }) | null {
    const f = this.bd.uno('SELECT * FROM usuarios WHERE usuario=?', [u]);
    return f ? { ...this.map(f), hash: s(f.hash), salt: s(f.salt) } : null;
  }
  porEmail(email: string): (Usuario & { hash: string; salt: string }) | null {
    const f = this.bd.uno('SELECT * FROM usuarios WHERE lower(email)=lower(?)', [email.trim()]);
    return f ? { ...this.map(f), hash: s(f.hash), salt: s(f.salt) } : null;
  }
  porId(id: string): Usuario | null { const f = this.bd.uno('SELECT * FROM usuarios WHERE id=?', [id]); return f ? this.map(f) : null; }
  existeDni(dni: string): boolean { return !!this.bd.uno('SELECT id FROM usuarios WHERE dni=?', [dni]); }
  existeEmail(email: string): boolean { return !!this.bd.uno('SELECT id FROM usuarios WHERE lower(email)=lower(?)', [email.trim()]); }
  actualizarDatos(id: string, d: { dni: string; apellidos: string; nombres: string; email: string; rol: Rol }): void {
    this.bd.run('UPDATE usuarios SET dni=?, apellidos=?, nombres=?, email=?, rol=?, permisos=?, estado=\'ACTIVO\' WHERE id=?', [d.dni, d.apellidos, d.nombres, d.email, d.rol, JSON.stringify(permisosDeRol(d.rol)), id]);
  }
  contar(): number { return Number(this.bd.valor('SELECT COUNT(*) FROM usuarios') || 0); }
  insertar(u: Usuario, hash: string, salt: string, googleSub: string | null = null): void {
    this.bd.run('INSERT INTO usuarios (id, usuario, dni, apellidos, nombres, email, rol, permisos, hash, salt, estado, creado, proveedor, google_sub) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [u.id, u.usuario, u.dni, u.apellidos, u.nombres, u.email, u.rol, JSON.stringify(u.permisos || permisosDeRol(u.rol)), hash, salt, u.estado, u.creado, googleSub ? 'google' : 'local', googleSub]);
  }
  cambiarEstado(id: string, estado: string): void { this.bd.run('UPDATE usuarios SET estado=? WHERE id=?', [estado, id]); }
  cambiarClave(id: string, hash: string, salt: string): void { this.bd.run('UPDATE usuarios SET hash=?, salt=? WHERE id=?', [hash, salt, id]); }
}

export class ResponsableRepo {
  constructor(private bd: BaseDatos) {}
  private map(f: Record<string, SqlValue>): Responsable {
    return { id: s(f.id), ejecutora: casoDe(s(f.ejecutora)), tipo: s(f.tipo) as Responsable['tipo'], dni: s(f.dni), nombre: s(f.nombre), cargo: s(f.cargo), area: s(f.area), email: s(f.email), doc: s(f.doc), fdoc: s(f.fdoc), rol: s(f.rol), emailOk: !!Number(f.email_ok), estado: s(f.estado) as Responsable['estado'] };
  }
  /** Responsables de una ejecutora (clave física «usuario::caso»). */
  listar(clave: string): Responsable[] { return this.bd.todos('SELECT * FROM responsables WHERE ejecutora=? ORDER BY rowid', [clave]).map(f => this.map(f)); }
  /** Responsables de todas las ejecutoras de un usuario. */
  listarDeUsuario(usuarioId: string): Responsable[] { return this.bd.todos('SELECT * FROM responsables WHERE ejecutora LIKE ? ORDER BY rowid', [usuarioId + SEP + '%']).map(f => this.map(f)); }
  porId(id: string): Responsable | null { const f = this.bd.uno('SELECT * FROM responsables WHERE id=?', [id]); return f ? this.map(f) : null; }
  duenoDe(id: string): string { return duenoDe(s(this.bd.valor('SELECT ejecutora FROM responsables WHERE id=?', [id]))); }
  existenPara(clave: string): boolean { return !!this.bd.uno('SELECT id FROM responsables WHERE ejecutora=?', [clave]); }
  eliminarCompartidos(): void { this.bd.run(`DELETE FROM responsables WHERE ejecutora NOT LIKE '%${SEP}%'`); }
  /** Inserta el responsable en la ejecutora física indicada (clave «usuario::caso»). */
  insertar(r: Responsable, clave: string = r.ejecutora): void {
    this.bd.run('INSERT INTO responsables (id, ejecutora, tipo, dni, nombre, cargo, area, email, doc, fdoc, rol, email_ok, estado) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [r.id, clave, r.tipo, r.dni, r.nombre, r.cargo, r.area, r.email, r.doc, r.fdoc, r.rol, r.emailOk ? 1 : 0, r.estado]);
  }
  actualizar(id: string, campos: { estado?: string; emailOk?: boolean }): void {
    if (campos.estado) this.bd.run('UPDATE responsables SET estado=? WHERE id=?', [campos.estado, id]);
    if (campos.emailOk !== undefined) this.bd.run('UPDATE responsables SET email_ok=? WHERE id=?', [campos.emailOk ? 1 : 0, id]);
  }
  acreditado(ejecutora: string, tipo: string, dni: string): boolean { return !!this.bd.uno("SELECT id FROM responsables WHERE ejecutora=? AND tipo=? AND dni=? AND estado='AUTORIZADO'", [ejecutora, tipo, dni]); }
}

export class AulaRepo {
  constructor(private bd: BaseDatos) {}
  listar(): Aula[] { return this.bd.todos('SELECT a.*, (SELECT COUNT(*) FROM estudiantes e WHERE e.aula_id=a.id) AS n FROM aulas a ORDER BY creado DESC').map(f => ({ id: s(f.id), nombre: s(f.nombre), periodo: s(f.periodo), creado: s(f.creado), estudiantes: Number(f.n) })); }
  crear(a: { id: string; nombre: string; periodo: string; creado: string }): void { this.bd.run('INSERT INTO aulas (id, nombre, periodo, creado) VALUES (?,?,?,?)', [a.id, a.nombre, a.periodo, a.creado]); }
  eliminar(id: string): void { this.bd.run('DELETE FROM aulas WHERE id=?', [id]); }
  estudiantes(aulaId: string): Estudiante[] { return this.bd.todos('SELECT * FROM estudiantes WHERE aula_id=? ORDER BY nombres', [aulaId]).map(f => ({ id: s(f.id), aulaId: s(f.aula_id), codigo: s(f.codigo), nombres: s(f.nombres), dni: s(f.dni) })); }
  estudiantePorCodigo(aulaId: string, codigo: string): Estudiante | null { return this.estudiantes(aulaId).find(e => e.codigo === codigo) || null; }
  crearEstudiante(e: Estudiante): void { this.bd.run('INSERT INTO estudiantes (id, aula_id, codigo, nombres, dni) VALUES (?,?,?,?,?)', [e.id, e.aulaId, e.codigo, e.nombres, e.dni]); }
  eliminarEstudiante(id: string): void { this.bd.run('DELETE FROM estudiantes WHERE id=?', [id]); }
  entregas(aulaId: string): Entrega[] {
    return this.bd.todos('SELECT en.* FROM entregas en JOIN estudiantes es ON es.id=en.estudiante_id WHERE es.aula_id=? ORDER BY en.fecha DESC', [aulaId])
      .map(f => ({ id: s(f.id), estudianteId: s(f.estudiante_id), fecha: s(f.fecha), archivo: s(f.archivo), puntaje: Number(f.puntaje), nota20: Number(f.nota20), detalle: JSON.parse(s(f.detalle) || '[]') }));
  }
  registrarEntrega(e: Entrega): void { this.bd.run('INSERT INTO entregas (id, estudiante_id, fecha, archivo, puntaje, nota20, detalle) VALUES (?,?,?,?,?,?,?)', [e.id, e.estudianteId, e.fecha, e.archivo, e.puntaje, e.nota20, JSON.stringify(e.detalle)]); }
}

export class AuditoriaRepo {
  constructor(private bd: BaseDatos) {}
  registrar(a: Omit<Auditoria, 'id'>): void { this.bd.run('INSERT INTO auditoria (fecha, usuario, ejecutora, accion, entidad, detalle) VALUES (?,?,?,?,?,?)', [a.fecha, a.usuario, a.ejecutora, a.accion, a.entidad, a.detalle]); }
  listar(limite = 500, filtro = ''): Auditoria[] {
    const q = '%' + filtro + '%';
    return this.bd.todos('SELECT * FROM auditoria WHERE (? = \'%%\' OR usuario LIKE ? OR accion LIKE ? OR detalle LIKE ? OR ejecutora LIKE ?) ORDER BY id DESC LIMIT ?', [q, q, q, q, q, limite])
      .map(f => ({ id: Number(f.id), fecha: s(f.fecha), usuario: s(f.usuario), ejecutora: s(f.ejecutora), accion: s(f.accion), entidad: s(f.entidad), detalle: s(f.detalle) }));
  }
}

export class MetaRepo {
  constructor(private bd: BaseDatos) {}
  get(k: string, def = ''): string { const v = this.bd.valor('SELECT valor FROM meta WHERE clave=?', [k]); return v == null ? def : String(v); }
  set(k: string, v: string): void { this.bd.run('INSERT OR REPLACE INTO meta (clave, valor) VALUES (?,?)', [k, v]); }
}
