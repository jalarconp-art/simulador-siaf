/* Contexto de aplicación: base de datos, repositorios, sesión, notificaciones y auditoría.
   Aislamiento por usuario: cada usuario trabaja en su propia copia de la ejecutora (clave «idUsuario::idCaso»);
   ninguna operación puede leer ni modificar el espacio de otro usuario. */
import { Emisor } from '@shared/eventos';
import type { BaseDatos } from '../db/database';
import { esAdmin, NOMBRE_OPCION, puede } from '@shared/permisos';
import { casoDe, claveDe, duenoDe, EjecutoraRepo, SEP } from '../repositories/ejecutoraRepo';
import { AulaRepo, AuditoriaRepo, MetaRepo, ResponsableRepo, UsuarioRepo } from '../repositories/repos';
import { CASOS, CTX_ORDER } from '@shared/casos';
import type { Ejecutora, Nivel, Opcion, Sesion } from '@shared/types';
import { ErrorNegocio, exigir } from '@shared/domain/reglas';
import { ejecutoraVacia } from '@shared/domain/fabrica';
import { hoy, hora, uid } from '@shared/util';

/** Responsables acreditados de prueba con los que cada espacio nuevo arranca (PIN del DNIe: 123456). */
export function responsablesIniciales(caso: string) {
  const base = { ejecutora: caso, cargo: 'DIRECTOR GENERAL DE ADMINISTRACION', area: 'OFICINA GENERAL DE ADMINISTRACION', doc: 'RESOLUCION Nº 002-2026', fdoc: '02/01/2026', emailOk: true, estado: 'AUTORIZADO' as const };
  return [
    { ...base, id: uid(), tipo: 'del' as const, dni: '40000011', nombre: 'DELEGADO DE PRUEBA', email: 'dga@entidad.gob.pe', doc: 'RESOLUCION Nº 001-2026', rol: '' },
    ...(['ccp', 'ca', 'cta', 'dev'] as const).map(t => ({ ...base, id: uid(), tipo: t, dni: '40000010', nombre: 'RESPONSABLE DE PRUEBA', email: 'responsable@entidad.gob.pe', rol: t === 'cta' ? 'TITULAR' : '',
      cargo: t === 'ccp' ? 'JEFE DE PLANEAMIENTO Y PRESUPUESTO' : base.cargo, area: t === 'ccp' ? 'OFICINA DE PLANEAMIENTO Y PRESUPUESTO' : base.area }))
  ];
}

export class Contexto {
  readonly ejecutoras: EjecutoraRepo;
  readonly usuarios: UsuarioRepo;
  readonly responsables: ResponsableRepo;
  readonly aulas: AulaRepo;
  readonly auditoria: AuditoriaRepo;
  readonly meta: MetaRepo;
  readonly eventos = new Emisor();
  sesion: Sesion | null = null;
  /** retardo de la verificación automática (ms); en pruebas se usa 0 */
  retardoVerificacion = 1300;

  constructor(readonly bd: BaseDatos) {
    this.ejecutoras = new EjecutoraRepo(bd);
    this.usuarios = new UsuarioRepo(bd);
    this.responsables = new ResponsableRepo(bd);
    this.aulas = new AulaRepo(bd);
    this.auditoria = new AuditoriaRepo(bd);
    this.meta = new MetaRepo(bd);
  }

  get usuarioActual(): string { return this.sesion ? this.sesion.usuario.usuario : 'SISTEMA'; }
  requerirSesion(): void { exigir(this.sesion, 'Debe iniciar sesión.'); }
  /** Solo el Administrador de usuarios. */
  requerirAdmin(): void {
    this.requerirSesion();
    exigir(esAdmin(this.sesion!.usuario), 'Su perfil no tiene acceso a esta operación: corresponde al Administrador de usuarios.');
  }
  /** Exige que el administrador haya habilitado la opción al usuario (Consulta u Operación). */
  requerirPermiso(op: Opcion, nivel: Nivel = 'O'): void {
    this.requerirSesion();
    exigir(puede(this.sesion!.usuario, op, nivel), `Su perfil no tiene ${nivel === 'O' ? 'permiso de operación' : 'acceso de consulta'} en «${NOMBRE_OPCION[op]}». Solicítelo al Administrador de usuarios.`);
  }
  /** Clave física del espacio del usuario en sesión. Acepta también una clave física ya resuelta (procesos internos). */
  clave(x: string): string {
    if (x.includes(SEP)) return x;
    exigir(this.sesion, 'Debe iniciar sesión.');
    return claveDe(this.sesion!.usuario.id, x);
  }
  auditar(accion: string, ejecutora: string, entidad: string, detalle: string): void {
    this.auditoria.registrar({ fecha: hoy() + ' ' + hora(), usuario: this.usuarioActual, ejecutora: casoDe(ejecutora), accion, entidad, detalle });
  }
  /** Avisa al renderer solo si el cambio pertenece al usuario en sesión. */
  notificar(ejecutora: string, mensaje?: { texto: string; tipo?: 'ok' | 'info' | 'err' }): void {
    const dueno = duenoDe(ejecutora);
    if (dueno && dueno !== this.sesion?.usuario.id) return;
    this.eventos.emit('cambio', { ejecutora: casoDe(ejecutora), mensaje });
  }

  cargar(id: string): Ejecutora {
    const clave = this.clave(id), caso = casoDe(clave);
    if (!CASOS[caso] || !(CTX_ORDER as readonly string[]).includes(caso)) throw new ErrorNegocio('Ejecutora no válida: ' + caso);
    return this.ejecutoras.cargar(clave) || ejecutoraVacia(caso);
  }
  /** Reemplaza la ejecutora del usuario en sesión (solución o práctica). */
  reemplazar(id: string, ej: Ejecutora): void { this.ejecutoras.guardar(ej, this.clave(id)); }
  /** Unidad de trabajo: carga el agregado, aplica la operación, guarda y audita en una sola transacción. */
  operar<T>(id: string, accion: string, fn: (ej: Ejecutora) => T, detalle?: (r: T) => string): T {
    const clave = this.clave(id);
    return this.bd.transaccion(() => {
      const ej = this.cargar(clave);
      const r = fn(ej);
      if (ej.modo === 'vacio') ej.modo = 'practica';
      this.ejecutoras.guardar(ej, clave);
      this.auditar(accion, clave, accion.split('.')[0], detalle ? detalle(r) : '');
      return r;
    });
  }
  /** Crea el espacio de trabajo del usuario (ejecutora vacía, como el SIAF real, con responsables acreditados) si aún no existe. */
  asegurarEspacio(usuarioId: string): void {
    this.bd.transaccion(() => CTX_ORDER.forEach(caso => {
      const clave = claveDe(usuarioId, caso);
      if (!this.ejecutoras.existe(clave)) this.ejecutoras.guardar(ejecutoraVacia(caso, 'practica'), clave);
      if (!this.responsables.existenPara(clave)) responsablesIniciales(caso).forEach(r => this.responsables.insertar(r, clave));
    }));
  }
  idsEjecutoras(): string[] { return [...CTX_ORDER]; }
  /** Todas las claves físicas guardadas (para procesos internos sin sesión). */
  clavesFisicas(): string[] { return this.ejecutoras.ids().filter(k => k.includes(SEP) && (CTX_ORDER as readonly string[]).includes(casoDe(k))); }
}
