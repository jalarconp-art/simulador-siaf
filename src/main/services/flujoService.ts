/* Flujo de aprobación: envío, verificación automática, aprobación OPP y firma en el MADAF. */
import type { Contexto } from './contexto';
import { opcionDeTarget } from '@shared/permisos';
import type { Ejecutora, Estado, Target } from '@shared/types';
import { CASOS } from '@shared/casos';
import { siguienteTrasVerificacion, transicionValida, type ObjetoEstado } from '@shared/domain/estados';
import { exigir } from '@shared/domain/reglas';
import { caMap } from '@shared/domain/saldos';
import { mapTot, pad } from '@shared/util';
import { casoDe } from '../repositories/ejecutoraRepo';

type Obj = ObjetoEstado & { fechaAprob?: string; aut?: string };
export const TIPO_RESPONSABLE: Record<string, 'ccp' | 'ca' | 'dev' | 'cta'> = { ccp: 'ccp', ca: 'ca', dev: 'dev', gir: 'cta' };
const TITULO_MADAF: Record<string, string> = { ccp: 'Autorización de Certificaciones Presupuestales', ca: 'Autorización de Compromisos Anuales', dev: 'Autorización de Devengados', gir: 'Autorización de Giros' };

export function localizar(ej: Ejecutora, t: Target): Obj | null {
  if (t.k === 'cs') return ej.certs.find(c => c.id === t.id)?.secs.find(s => s.sec === t.s) || null;
  if (t.k === 'ca') return ej.cas.find(a => a.id === t.id) || null;
  if (t.k === 'cam') return ej.cas.find(a => a.id === t.id)?.mods.find(m => m.n === t.n) || null;
  if (t.k === 'es') return ej.exps.find(e => e.id === t.id)?.secs.find(s => s.sec === t.s) || null;
  if (t.k === 'is') return ej.ings.find(g => g.id === t.id)?.secs.find(s => s.sec === t.s) || null;
  if (t.k === 'md') { const m = ej.mods.find(z => z.id === t.id); return m ? { ...m, tipo: m.tipo, campo: m.campo, estado: m.estado, _ref: m } as Obj : null; }
  return null;
}

export class FlujoService {
  private claves = new Map<string, { codigo: string; vence: number }>();
  madaf: { dni: string; nombre: string } | null = null;
  aeraf: { dni: string; nombre: string } | null = null;
  private intentosPin = 0;
  constructor(private ctx: Contexto) {}

  get automatico(): boolean { return this.ctx.meta.get('aprobacion_automatica') === '1'; }
  setAutomatico(v: boolean): void { this.ctx.requerirAdmin(); this.ctx.bd.transaccion(() => { this.ctx.meta.set('aprobacion_automatica', v ? '1' : '0'); this.ctx.auditar('config.aprobacion-automatica', '', 'config', String(v)); }); }

  /** Cambia el estado aplicando efectos (modificaciones, anulación de CA). Debe llamarse dentro de una operación. */
  private aplicar(ej: Ejecutora, t: Target, nuevo: Estado, quien = ''): void {
    if (t.k === 'md') {
      const m = ej.mods.find(z => z.id === t.id)!;
      exigir(transicionValida(m.estado, nuevo), `Transición no permitida: ${m.estado} › ${nuevo}`);
      m.estado = nuevo; if (nuevo === 'APROBADO') { m.fechaAprob = ej.fechaSis; m.aut = quien; this.aplicarModificacion(ej, m.id); }
      return;
    }
    const o = localizar(ej, t); exigir(o, 'Registro no encontrado.');
    exigir(transicionValida(o!.estado, nuevo), `Transición no permitida: ${o!.estado} › ${nuevo}`);
    o!.estado = nuevo;
    if (nuevo === 'APROBADO') { o!.fechaAprob = ej.fechaSis; if (quien) o!.aut = quien; }
    if (t.k === 'cam' && nuevo === 'APROBADO' && o!.tipo === 'ANULACION') { const a = ej.cas.find(z => z.id === t.id)!; if (mapTot(caMap(a)) <= 0.001) a.estado = 'ANULADO'; }
  }
  private aplicarModificacion(ej: Ejecutora, id: string): void {
    const m = ej.mods.find(z => z.id === id)!;
    if (m.tipo === 'CERT') {
      const c = ej.certs.find(z => z.id === m.refId); if (!c) return;
      if (m.campo === 'Dispositivo legal') c.disp = m.despues;
      if (m.campo === 'Fecha del documento') c.doc.fecha = m.despues;
      if (m.campo === 'Justificación') c.justif = m.despues;
      if (m.campo === 'Número del documento') c.doc.num = m.despues;
      if (m.campo === 'Tipo de certificación') c.tipoCert = m.despues;
    } else {
      const a = ej.cas.find(z => z.id === m.refId); if (!a) return;
      if (m.campo === 'Código del documento') a.doc.cod = m.despues;
      if (m.campo === 'Documento proveedor') { const p = m.despues.split('|'); a.prov = { tipo: p[0], num: p[1], nom: p[2] || '' }; }
      if (m.campo === 'Fecha del documento') a.doc.fecha = m.despues;
      if (m.campo === 'Justificación') a.justif = m.despues;
      if (m.campo === 'Número del documento') a.doc.num = m.despues;
      if (m.campo.startsWith('Número de transferencia')) a.transf = m.despues;
    }
  }

  /** Exige operación en la opción que corresponde al registro (certificado, CA, CM, devengado, girado...). */
  private exigirOpcion(t: Target): void {
    this.ctx.requerirSesion();
    const fase = t.k === 'es' ? this.ctx.cargar(t.x).exps.find(e => e.id === t.id)?.secs.find(s => s.sec === t.s)?.fase : undefined;
    this.ctx.requerirPermiso(opcionDeTarget(t, fase));
  }
  enviar(t0: Target): void {
    this.exigirOpcion(t0);
    /* la verificación diferida se ancla al espacio del usuario que envió, aunque luego cierre sesión */
    const t: Target = { ...t0, x: this.ctx.clave(t0.x) };
    this.ctx.operar(t.x, 'flujo.enviar', ej => { const o = localizar(ej, t); exigir(o && o.estado === 'REGISTRADO', 'Solo se envían registros en estado REGISTRADO.'); this.aplicar(ej, t, 'EN VERIFICACION'); }, () => JSON.stringify(t0));
    const verificar = () => { try { this.verificar(t); } catch (e) { this.ctx.notificar(t.x, { texto: (e as Error).message, tipo: 'err' }); } };
    if (this.ctx.retardoVerificacion > 0) setTimeout(verificar, this.ctx.retardoVerificacion); else verificar();
  }
  /** Verificación automática del sistema (sin incongruencias) y siguiente estado. */
  verificar(t: Target): Estado | null {
    let nuevo: Estado | null = null;
    this.ctx.operar(t.x, 'flujo.verificar', ej => {
      const o = localizar(ej, t); if (!o || o.estado !== 'EN VERIFICACION') return;
      nuevo = siguienteTrasVerificacion(t, o); this.aplicar(ej, t, nuevo, nuevo === 'APROBADO' ? 'SISTEMA (sin incongruencias)' : '');
    }, () => JSON.stringify(t) + ' → ' + nuevo);
    if (nuevo) {
      const msg = nuevo === 'APROBADO' ? 'El registro fue aprobado automáticamente (sin incongruencias).' : nuevo === 'ENVIADO A OPP' ? 'Registro enviado a la OPP: apruébelo en SIAF Operaciones en Línea.' : 'Pendiente de firma: el responsable debe autorizar en el MADAF.';
      this.ctx.notificar(t.x, { texto: msg, tipo: nuevo === 'APROBADO' ? 'ok' : 'info' });
      if (this.automatico && nuevo !== 'APROBADO') this.cadenaAutomatica(t);
    }
    return nuevo;
  }
  private cadenaAutomatica(t: Target): void {
    this.ctx.operar(t.x, 'flujo.automatico', ej => {
      let o = localizar(ej, t);
      if (o && o.estado === 'ENVIADO A OPP') { this.aplicar(ej, t, t.k === 'md' ? 'APROBADO' : 'PENDIENTE DE FIRMA', 'OPP (automático)'); o = localizar(ej, t); }
      if (o && o.estado === 'PENDIENTE DE FIRMA') this.aplicar(ej, t, 'APROBADO', 'RESPONSABLE DE PRUEBA (automático)');
    });
    this.ctx.notificar(t.x, { texto: 'Aprobado (modo de aprobación automática).', tipo: 'ok' });
  }
  /** Resuelve registros que quedaron en verificación (por ejemplo, si se cerró la aplicación). */
  procesarPendientes(): void {
    this.ctx.clavesFisicas().forEach(x => {
      const ej = this.ctx.ejecutoras.cargar(x); if (!ej) return;
      const ts: Target[] = [];
      ej.certs.forEach(c => c.secs.forEach(s => s.estado === 'EN VERIFICACION' && ts.push({ k: 'cs', x, id: c.id, s: s.sec })));
      ej.cas.forEach(a => { if (a.estado === 'EN VERIFICACION') ts.push({ k: 'ca', x, id: a.id }); a.mods.forEach(m => m.estado === 'EN VERIFICACION' && ts.push({ k: 'cam', x, id: a.id, n: m.n })); });
      ej.exps.forEach(e => e.secs.forEach(s => s.estado === 'EN VERIFICACION' && ts.push({ k: 'es', x, id: e.id, s: s.sec })));
      ej.ings.forEach(g => g.secs.forEach(s => s.estado === 'EN VERIFICACION' && ts.push({ k: 'is', x, id: g.id, s: s.sec })));
      ej.mods.forEach(m => m.estado === 'EN VERIFICACION' && ts.push({ k: 'md', x, id: m.id }));
      ts.forEach(t => this.verificar(t));
    });
  }
  descartar(t: Target): void {
    this.exigirOpcion(t);
    this.ctx.operar(t.x, 'flujo.descartar', ej => { const o = localizar(ej, t); exigir(o && o.estado === 'REGISTRADO', 'Solo se descarta antes del envío.'); this.aplicar(ej, t, 'DESCARTADO'); }, () => JSON.stringify(t));
  }

  /* ---------------- OPP (SIAF Operaciones en Línea) ---------------- */
  /** Cada trabajador simula a toda la entidad en su propio espacio, por eso el operador también aprueba como OPP. */
  procesarOPP(x: string, aprobar: Target[], rechazar: Target[]): { aprobados: number; rechazados: number } {
    this.ctx.requerirPermiso('opp');
    exigir(aprobar.length || rechazar.length, 'Marque Aprobar o Rechazar en al menos un registro.');
    this.ctx.operar(x, 'opp.procesar', ej => {
      aprobar.forEach(t => { const o = localizar(ej, t); exigir(o && o.estado === 'ENVIADO A OPP', 'El registro ya no está pendiente de la OPP.'); this.aplicar(ej, t, t.k === 'md' ? 'APROBADO' : 'PENDIENTE DE FIRMA', 'OPP: ' + this.ctx.usuarioActual); });
      rechazar.forEach(t => this.aplicar(ej, t, 'RECHAZADO'));
    }, () => `aprobados ${aprobar.length}, rechazados ${rechazar.length}`);
    this.ctx.notificar(x);
    if (this.automatico) aprobar.filter(t => t.k !== 'md').forEach(t => this.cadenaAutomatica(t));
    return { aprobados: aprobar.length, rechazados: rechazar.length };
  }

  /* ---------------- DNIe (MADAF y AERAF) ---------------- */
  /** Responsables acreditados en el espacio del usuario en sesión. */
  private misResponsables() { this.ctx.requerirSesion(); return this.ctx.responsables.listarDeUsuario(this.ctx.sesion!.usuario.id); }
  ingresarDNIe(app: 'madaf' | 'aeraf', dni: string, pin: string): { dni: string; nombre: string } {
    this.ctx.requerirSesion();
    exigir(this.intentosPin < 3, 'PIN bloqueado tras tres intentos. El titular debe acercarse al RENIEC para cambiar el PIN.');
    if (pin !== '123456') { this.intentosPin++; exigir(false, 'PIN incorrecto. Intentos restantes: ' + (3 - this.intentosPin)); }
    this.intentosPin = 0;
    let nombre = '';
    if (app === 'aeraf') { nombre = dni === '40000099' ? 'TITULAR DEL PLIEGO (PRUEBA)' : (this.misResponsables().find(r => r.dni === dni && r.tipo === 'del' && r.estado === 'AUTORIZADO')?.nombre || ''); }
    else nombre = this.misResponsables().find(r => r.dni === dni && r.tipo !== 'del' && r.estado === 'AUTORIZADO')?.nombre || '';
    exigir(nombre, 'Usuario no autorizado: el DNI no está acreditado.');
    const s = { dni, nombre }; if (app === 'madaf') this.madaf = s; else this.aeraf = s;
    this.ctx.bd.transaccion(() => this.ctx.auditar(app + '.ingreso', '', app, dni + ' ' + nombre));
    return s;
  }
  reiniciarPin(): void { this.intentosPin = 0; }
  salirDNIe(app: 'madaf' | 'aeraf'): void { if (app === 'madaf') this.madaf = null; else this.aeraf = null; }
  /** Al cambiar de usuario se cierran las sesiones DNIe y se descartan las claves dinámicas pendientes. */
  reiniciar(): void { this.madaf = null; this.aeraf = null; this.claves.clear(); this.intentosPin = 0; }
  dnisDisponibles(app: 'madaf' | 'aeraf'): { dni: string; nombre: string }[] {
    const m = new Map<string, string>();
    if (!this.ctx.sesion) return [];
    if (app === 'aeraf') m.set('40000099', 'TITULAR DEL PLIEGO (PRUEBA)');
    this.misResponsables().filter(r => r.estado === 'AUTORIZADO' && (app === 'aeraf' ? r.tipo === 'del' : r.tipo !== 'del')).forEach(r => m.set(r.dni, r.nombre));
    return [...m.entries()].map(([dni, nombre]) => ({ dni, nombre }));
  }
  /** Genera la clave dinámica (vigencia de 3 minutos) y devuelve el correo simulado. */
  solicitarClave(tipo: string, x0: string): { asunto: string; cuerpo: string; codigo: string } {
    exigir(this.madaf, 'Ingrese al MADAF con su DNIe.');
    const x = this.ctx.clave(x0);
    exigir(this.ctx.responsables.acreditado(x, TIPO_RESPONSABLE[tipo], this.madaf!.dni), `El DNI ${this.madaf!.dni} no está acreditado en el AERAF como responsable de ${TITULO_MADAF[tipo].replace('Autorización de ', '')} para la entidad seleccionada.`);
    const codigo = String(100000 + (globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
    this.claves.set(tipo + x, { codigo, vence: Date.now() + 180000 });
    const d = CASOS[casoDe(x)].entidad;
    return { codigo, asunto: '(SIAF) ' + TITULO_MADAF[tipo], cuerpo: `DNI: ${this.madaf!.dni} : ${this.madaf!.nombre}\nSe ha generado una clave dinámica para la ${TITULO_MADAF[tipo]} en la Unidad Ejecutora (${d.secEjec}) ${d.ueNom} con una duración de 3 minutos a partir del envío del correo.` };
  }
  autorizar(tipo: string, x0: string, targets: Target[], clave: string, aprobar: boolean): number {
    exigir(this.madaf, 'Ingrese al MADAF con su DNIe.');
    const x = this.ctx.clave(x0);
    exigir(targets.length, 'Seleccione uno o más registros.');
    const c = this.claves.get(tipo + x);
    exigir(c, 'Solicite la clave dinámica.');
    exigir(Date.now() <= c!.vence, 'La clave dinámica venció (3 minutos). Vuelva a autorizar.');
    exigir(clave === c!.codigo, 'La clave dinámica no es correcta.');
    this.claves.delete(tipo + x);
    this.ctx.operar(x, aprobar ? 'madaf.autorizar' : 'madaf.rechazar', ej => {
      targets.forEach(t => { const o = localizar(ej, t); exigir(o && o.estado === 'PENDIENTE DE FIRMA', 'El registro ya no está pendiente de firma.'); this.aplicar(ej, t, aprobar ? 'APROBADO' : 'RECHAZADO', this.madaf!.nombre); });
    }, () => `${TITULO_MADAF[tipo]}: ${targets.length} registro(s) por ${this.madaf!.dni}`);
    this.ctx.notificar(x);
    return targets.length;
  }
}
export const _fmt = pad;
