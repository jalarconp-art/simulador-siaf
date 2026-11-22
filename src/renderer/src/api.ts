/* Cliente de la API: envuelve el puente IPC y convierte los errores de negocio en excepciones. */
import type { Aula, Auditoria, Ejecutora, Entrega, Estudiante, Permisos, Responsable, Rol, Sesion, Target, Usuario } from '@shared/types';
import type { CmdIn } from '@shared/comandos';

export class ErrorApi extends Error {}
async function llamar<T>(metodo: string, ...args: unknown[]): Promise<T> {
  const r = await window.siaf.invoke(metodo, ...args);
  if (!r.ok) throw new ErrorApi(r.error || 'Error desconocido');
  return r.data as T;
}

export const api = {
  login: (u: string, c: string) => llamar<Sesion>('sesion.login', u, c),
  registrar: (d: CmdIn<'registro'>) => llamar<Sesion>('sesion.registrar', d),
  progreso: () => llamar<{ usuario: string; nombre: string; email: string; estado: string; modo: string; registros: number; puntaje: number; nota20: number }[]>('docente.progreso'),
  logout: () => llamar<void>('sesion.logout'),
  sesion: () => llamar<Sesion | null>('sesion.actual'),
  cambiarClave: (a: string, n: string) => llamar<void>('sesion.cambiarClave', a, n),
  usuarios: {
    listar: () => llamar<Usuario[]>('usuarios.listar'), crear: (d: CmdIn<'usuario'>) => llamar<{ usuario: Usuario; clave: string }>('usuarios.crear', d),
    estado: (id: string) => llamar<Usuario>('usuarios.estado', id), clave: (id: string) => llamar<string>('usuarios.clave', id),
    perfil: (id: string, rol: Rol, permisos: Permisos) => llamar<Usuario>('usuarios.perfil', id, rol, permisos)
  },
  google: {
    disponible: () => llamar<boolean>('google.disponible'),
    config: () => llamar<{ clientId: string; tieneSecreto: boolean }>('google.config'),
    guardar: (clientId: string, secreto: string) => llamar<void>('google.guardar', clientId, secreto)
  },
  ejecutora: {
    obtener: (id: string) => llamar<Ejecutora>('ejecutora.obtener', id),
    obtenerPublico: (id: string) => llamar<Ejecutora>('ejecutora.obtenerPublico', id),
    resumen: () => llamar<{ id: string; modo: string; registros: number }[]>('ejecutora.resumen'),
    solucion: (id: string) => llamar<void>('ejecutora.solucion', id),
    practicar: (id: string) => llamar<void>('ejecutora.practicar', id),
    subcaso: (id: string, s: string) => llamar<void>('ejecutora.subcaso', id, s),
    fecha: (id: string, f: string) => llamar<void>('ejecutora.fecha', id, f),
    proveedor: (d: CmdIn<'proveedor'>) => llamar<void>('ejecutora.proveedor', d)
  },
  cert: { grabar: (d: CmdIn<'certGrabar'>) => llamar<{ id: string; num: number }>('cert.grabar', d), modificacion: (d: CmdIn<'certModificacion'>) => llamar<number>('cert.modificacion', d) },
  ca: { grabar: (d: CmdIn<'caGrabar'>) => llamar<{ id: string; num: number }>('ca.grabar', d), modificacion: (d: CmdIn<'caModificacion'>) => llamar<number>('ca.modificacion', d) },
  cm: { grabar: (d: CmdIn<'cmGrabar'>) => llamar<{ exp: number; sec: number }>('cm.grabar', d), rebaja: (d: CmdIn<'cmRebaja'>) => llamar<number>('cm.rebaja', d) },
  dev: { grabar: (d: CmdIn<'devGrabar'>) => llamar<number>('dev.grabar', d) },
  gir: { grabar: (d: CmdIn<'girGrabar'>) => llamar<number>('gir.grabar', d), pagado: (d: CmdIn<'pagado'>) => llamar<number>('gir.pagado', d) },
  t6: { grabar: (d: CmdIn<'t6Grabar'>) => llamar<number>('t6.grabar', d) },
  det: { grabar: (d: CmdIn<'detGrabar'>) => llamar<number>('det.grabar', d) },
  rec: { grabar: (d: CmdIn<'recGrabar'>) => llamar<number>('rec.grabar', d) },
  mod: { grabar: (d: CmdIn<'modGrabar'>) => llamar<number>('mod.grabar', d) },
  flujo: { enviar: (t: Target) => llamar<void>('flujo.enviar', t), descartar: (t: Target) => llamar<void>('flujo.descartar', t), automatico: () => llamar<boolean>('flujo.automatico'), setAutomatico: (v: boolean) => llamar<void>('flujo.setAutomatico', v) },
  opp: { procesar: (x: string, a: Target[], r: Target[]) => llamar<{ aprobados: number; rechazados: number }>('opp.procesar', x, a, r) },
  dnie: {
    disponibles: (app: 'madaf' | 'aeraf') => llamar<{ dni: string; nombre: string }[]>('dnie.disponibles', app),
    ingresar: (app: 'madaf' | 'aeraf', dni: string, pin: string) => llamar<{ dni: string; nombre: string }>('dnie.ingresar', app, dni, pin),
    salir: (app: 'madaf' | 'aeraf') => llamar<void>('dnie.salir', app),
    sesion: (app: 'madaf' | 'aeraf') => llamar<{ dni: string; nombre: string } | null>('dnie.sesion', app),
    reiniciarPin: () => llamar<void>('dnie.reiniciarPin')
  },
  madaf: { clave: (tipo: string, x: string) => llamar<{ asunto: string; cuerpo: string; codigo: string }>('madaf.clave', tipo, x), autorizar: (tipo: string, x: string, ts: Target[], clave: string, ap: boolean) => llamar<number>('madaf.autorizar', tipo, x, ts, clave, ap) },
  aeraf: { listar: (x: string) => llamar<Responsable[]>('aeraf.listar', x), crear: (d: CmdIn<'responsable'>) => llamar<Responsable>('aeraf.crear', d), autorizar: (ids: string[]) => llamar<number>('aeraf.autorizar', ids), baja: (ids: string[]) => llamar<void>('aeraf.baja', ids), confirmarEmail: (id: string) => llamar<void>('aeraf.confirmarEmail', id) },
  aula: {
    listar: () => llamar<Aula[]>('aula.listar'), crear: (n: string, p: string) => llamar<Aula>('aula.crear', n, p), eliminar: (id: string) => llamar<void>('aula.eliminar', id),
    estudiantes: (id: string) => llamar<Estudiante[]>('aula.estudiantes', id), agregar: (a: string, c: string, n: string, d: string) => llamar<Estudiante>('aula.agregarEstudiante', a, c, n, d),
    importarCSV: (a: string, csv: string) => llamar<number>('aula.importarCSV', a, csv), eliminarEstudiante: (id: string) => llamar<void>('aula.eliminarEstudiante', id),
    importarEntrega: (a: string, c: string, n: string) => llamar<Entrega>('aula.importarEntrega', a, c, n), entregas: (id: string) => llamar<Entrega[]>('aula.entregas', id)
  },
  entrega: { generar: (c: string, n: string) => llamar<unknown>('entrega.generar', c, n) },
  auditoria: (f: string, l = 500) => llamar<Auditoria[]>('auditoria.listar', f, l),
  info: () => llamar<{ version: number }>('sistema.info'),
  escritorio: {
    guardarTexto: (n: string, c: string, ext: string) => window.siaf.guardarTexto(n, c, ext),
    abrirTexto: (ext: string[]) => window.siaf.abrirTexto(ext),
    imprimir: (h: string, t: string) => window.siaf.imprimir(h, t),
    pdf: (h: string, n: string) => window.siaf.pdf(h, n),
    respaldoExportar: () => window.siaf.respaldoExportar(),
    respaldoImportar: () => window.siaf.respaldoImportar()
  }
};
