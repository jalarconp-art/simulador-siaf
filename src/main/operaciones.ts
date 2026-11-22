/* Operaciones comunes a escritorio y web (sin dependencias de Node).
   Cada entrada valida la forma de sus argumentos con Zod antes de llegar al servicio. */
import { BaseDatos } from './db/database';
import { Contexto } from './services/contexto';
import { GastoService } from './services/gastoService';
import { IngresoService, ModificacionService } from './services/ingresoService';
import { FlujoService } from './services/flujoService';
import { AerafService, DocenteService, EjecutoraService } from './services/adminServices';
import { AuxService } from './services/auxService';
import { S } from '@shared/comandos';
import type { Resultado, Target } from '@shared/types';
import { ErrorNegocio } from '@shared/domain/reglas';
import { ZodError, z } from 'zod';

export type TablaOperaciones = Record<string, (...a: any[]) => unknown>;

/** Núcleo de servicios sobre una base SQLite (en disco o en memoria). */
export class Nucleo {
  readonly ctx: Contexto;
  readonly gasto: GastoService; readonly ingreso: IngresoService; readonly modificacion: ModificacionService;
  readonly flujo: FlujoService; readonly ejecutoras: EjecutoraService; readonly aeraf: AerafService; readonly docente: DocenteService; readonly auxiliar: AuxService;
  constructor(readonly bd: BaseDatos) {
    this.ctx = new Contexto(bd);
    this.gasto = new GastoService(this.ctx);
    this.ingreso = new IngresoService(this.ctx);
    this.modificacion = new ModificacionService(this.ctx);
    this.flujo = new FlujoService(this.ctx);
    this.ejecutoras = new EjecutoraService(this.ctx);
    this.aeraf = new AerafService(this.ctx, () => this.flujo.aeraf);
    this.docente = new DocenteService(this.ctx);
    this.auxiliar = new AuxService(this.ctx);
  }

  operacionesComunes(): TablaOperaciones {
    const tg = (t: unknown) => S.target.parse(t) as Target;
    const tgs = (l: unknown) => z.array(S.target).parse(l) as Target[];
    const str = (v: unknown) => z.string().parse(v);
    return {
      'sesion.actual': () => this.ctx.sesion,
      'ejecutora.obtener': id => this.ejecutoras.obtener(str(id)),
      'ejecutora.obtenerPublico': id => this.ejecutoras.obtenerPublico(str(id)),
      'ejecutora.resumen': () => this.ejecutoras.resumen(),
      'ejecutora.solucion': id => this.ejecutoras.cargarSolucion(str(id)),
      'ejecutora.practicar': id => this.ejecutoras.practicar(str(id)),
      'ejecutora.subcaso': (id, s) => this.ejecutoras.setSubcaso(str(id), str(s)),
      'ejecutora.fecha': (id, f) => this.ejecutoras.setFechaSistema(str(id), str(f)),
      'ejecutora.proveedor': d => this.ejecutoras.agregarProveedor(S.proveedor.parse(d)),
      'cert.grabar': d => this.gasto.grabarCertificado(S.certGrabar.parse(d)),
      'cert.modificacion': d => this.gasto.modificarCertificado(S.certModificacion.parse(d)),
      'ca.grabar': d => this.gasto.grabarCompromisoAnual(S.caGrabar.parse(d)),
      'ca.modificacion': d => this.gasto.modificarCompromisoAnual(S.caModificacion.parse(d)),
      'cm.grabar': d => this.gasto.grabarCompromisoMensual(S.cmGrabar.parse(d)),
      'cm.rebaja': d => this.gasto.rebajarCompromisoMensual(S.cmRebaja.parse(d)),
      'dev.grabar': d => this.gasto.grabarDevengado(S.devGrabar.parse(d)),
      'gir.grabar': d => this.gasto.grabarGirado(S.girGrabar.parse(d)),
      'gir.pagado': d => this.gasto.registrarPagado(S.pagado.parse(d)),
      't6.grabar': d => this.gasto.grabarT6(S.t6Grabar.parse(d)),
      'det.grabar': d => this.ingreso.grabarDeterminado(S.detGrabar.parse(d)),
      'rec.grabar': d => this.ingreso.grabarRecaudado(S.recGrabar.parse(d)),
      'mod.grabar': d => this.modificacion.grabar(S.modGrabar.parse(d)),
      'flujo.enviar': t => this.flujo.enviar(tg(t)),
      'flujo.descartar': t => this.flujo.descartar(tg(t)),
      'flujo.automatico': () => this.flujo.automatico,
      'flujo.setAutomatico': v => this.flujo.setAutomatico(!!v),
      'opp.procesar': (x, a, r) => this.flujo.procesarOPP(str(x), tgs(a), tgs(r)),
      'dnie.disponibles': app => this.flujo.dnisDisponibles(app === 'aeraf' ? 'aeraf' : 'madaf'),
      'dnie.ingresar': (app, dni, pin) => this.flujo.ingresarDNIe(app === 'aeraf' ? 'aeraf' : 'madaf', str(dni), str(pin)),
      'dnie.salir': app => this.flujo.salirDNIe(app === 'aeraf' ? 'aeraf' : 'madaf'),
      'dnie.reiniciarPin': () => this.flujo.reiniciarPin(),
      'dnie.sesion': app => (app === 'aeraf' ? this.flujo.aeraf : this.flujo.madaf),
      'madaf.clave': (tipo, x) => this.flujo.solicitarClave(str(tipo), str(x)),
      'madaf.autorizar': (tipo, x, ts, clave, ap) => this.flujo.autorizar(str(tipo), str(x), tgs(ts), str(clave), !!ap),
      'aeraf.listar': x => this.aeraf.listar(str(x)),
      'aeraf.crear': d => this.aeraf.crear(S.responsable.parse(d)),
      'aeraf.autorizar': ids => this.aeraf.autorizar(z.array(z.string()).parse(ids)),
      'aeraf.baja': ids => this.aeraf.baja(z.array(z.string()).parse(ids)),
      'aeraf.confirmarEmail': id => this.aeraf.confirmarEmail(str(id)),
      'aux.grabar': d => this.auxiliar.grabar(z.object({ ejecutora: z.string(), tipo: z.string(), id: z.string().optional(), datos: z.record(z.string(), z.string()) }).parse(d)),
      'aux.enviar': (x, t, id) => this.auxiliar.enviar(str(x), str(t), str(id)),
      'aux.descartar': (x, t, id) => this.auxiliar.descartar(str(x), str(t), str(id)),
      'entrega.generar': (c, n) => this.docente.generarEntrega(str(c), str(n)),
      'sistema.info': () => ({ version: this.bd.version })
    };
  }
}

/** Ejecuta una operación síncrona y traduce los errores a mensajes para el usuario. */
export function ejecutar(fn: (() => unknown) | undefined, metodo: string): Resultado {
  if (!fn) return { ok: false, error: 'Operación no reconocida: ' + metodo };
  try { return { ok: true, data: fn() }; } catch (e) { return traducirError(e); }
}
export function traducirError(e: unknown): Resultado {
  if (e instanceof ErrorNegocio) return { ok: false, error: e.message };
  if (e instanceof ZodError) return { ok: false, error: 'Datos incompletos o con formato inválido: ' + e.issues.map(i => i.path.join('.') + ' ' + i.message).join('; ') };
  return { ok: false, error: (e as Error)?.message || 'Error interno.' };
}
