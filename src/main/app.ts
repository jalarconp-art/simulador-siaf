/* Raíz de composición del escritorio: base SQLite en el equipo, autenticación local y con Google,
   administración de usuarios, aula y auditoría, sobre el núcleo común de operaciones. */
import { abrirArchivo } from './db/archivo';
import type { BaseDatos } from './db/database';
import { sembrar } from './db/seed';
import { AuthService } from './services/authService';
import { ejecutar, Nucleo, type TablaOperaciones } from './operaciones';
import { S } from '@shared/comandos';
import type { Permisos, Resultado, Rol, Sesion } from '@shared/types';
import { exigir } from '@shared/domain/reglas';
import { z } from 'zod';

export class Aplicacion extends Nucleo {
  readonly auth: AuthService;

  private constructor(bd: BaseDatos) {
    super(bd);
    this.auth = new AuthService(this.ctx);
  }
  static async iniciar(archivo: string | null, wasmDir?: string): Promise<Aplicacion> {
    const app = new Aplicacion(await abrirArchivo(archivo, wasmDir));
    sembrar(app.ctx);
    app.flujo.procesarPendientes();
    return app;
  }

  /** Configuración del acceso con Google (credenciales OAuth de tipo «Aplicación de escritorio»). */
  get googleConfig(): { clientId: string; secreto: string } { return { clientId: this.ctx.meta.get('google_client_id'), secreto: this.ctx.meta.get('google_client_secret') }; }
  loginGoogle(identidad: { sub: string; email: string; nombres: string; apellidos: string }): Sesion { this.flujo.reiniciar(); return this.auth.loginGoogle(identidad); }

  private operaciones(): TablaOperaciones {
    const str = (v: unknown) => z.string().parse(v);
    return {
      ...this.operacionesComunes(),
      'sesion.login': (u, c) => { this.flujo.reiniciar(); return this.auth.login(str(u), str(c)); },
      'sesion.registrar': d => { this.flujo.reiniciar(); return this.auth.registrar(S.registro.parse(d)); },
      'sesion.logout': () => { this.flujo.reiniciar(); this.auth.logout(); },
      'sesion.cambiarClave': (a, n) => this.auth.cambiarMiClave(str(a), str(n)),
      'usuarios.listar': () => this.auth.listar(),
      'usuarios.crear': d => this.auth.crear(S.usuario.parse(d)),
      'usuarios.estado': id => this.auth.cambiarEstado(str(id)),
      'usuarios.clave': id => this.auth.restablecerClave(str(id)),
      'usuarios.perfil': (id, rol, permisos) => this.auth.asignarPerfil(str(id), S.rol.parse(rol) as Rol, S.permisos.parse(permisos) as Permisos),
      'google.disponible': () => !!this.googleConfig.clientId,
      'google.config': () => { this.ctx.requerirAdmin(); const g = this.googleConfig; return { clientId: g.clientId, tieneSecreto: !!g.secreto }; },
      'google.guardar': (id, secreto) => {
        this.ctx.requerirAdmin();
        const clientId = str(id).trim(); exigir(!clientId || /\.apps\.googleusercontent\.com$/.test(clientId), 'El ID de cliente de Google termina en «.apps.googleusercontent.com».');
        this.bd.transaccion(() => { this.ctx.meta.set('google_client_id', clientId); if (str(secreto ?? '').trim()) this.ctx.meta.set('google_client_secret', str(secreto).trim()); this.ctx.auditar('config.google', '', 'config', clientId ? 'configurado' : 'desactivado'); });
      },
      'aula.listar': () => this.docente.aulas(),
      'aula.crear': (n, p) => this.docente.crearAula(str(n), str(p)),
      'aula.eliminar': id => this.docente.eliminarAula(str(id)),
      'aula.estudiantes': id => this.docente.estudiantes(str(id)),
      'aula.agregarEstudiante': (a, c, n, d) => this.docente.agregarEstudiante(str(a), str(c), str(n), str(d ?? '')),
      'aula.importarCSV': (a, csv) => this.docente.importarEstudiantesCSV(str(a), str(csv)),
      'aula.eliminarEstudiante': id => this.docente.eliminarEstudiante(str(id)),
      'aula.importarEntrega': (a, c, n) => this.docente.importarEntrega(str(a), str(c), str(n)),
      'aula.entregas': id => this.docente.entregas(str(id)),
      'docente.progreso': () => this.docente.progreso(),
      'auditoria.listar': (f, l) => { this.ctx.requerirAdmin(); return this.ctx.auditoria.listar(Number(l) || 500, String(f || '')); }
    };
  }
  private tabla = this.operaciones();
  /** Punto único de entrada: ejecuta la operación y traduce errores a mensajes para el usuario. */
  invocar(metodo: string, args: unknown[]): Resultado { const fn = this.tabla[metodo]; return ejecutar(fn && (() => fn(...args)), metodo); }
  invocarFn(fn: () => unknown): Resultado { return ejecutar(fn, 'interno'); }
  get metodos(): string[] { return Object.keys(this.tabla); }
}
