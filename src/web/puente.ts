/* Puente de la versión web: implementa la misma interfaz que el escritorio (window.siaf).
   Las reglas del SIAF se ejecutan en el navegador con los mismos servicios y SQLite en memoria (sql.js);
   tras cada operación el espacio del usuario se sincroniza con Supabase (o con el modo local de demostración). */
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { BaseDatos } from '../main/db/database';
import { claveDe } from '../main/repositories/ejecutoraRepo';
import { ejecutar, Nucleo, traducirError, type TablaOperaciones } from '../main/operaciones';
import type { EventoCambio, SiafPuente } from '../preload/api';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { S } from '@shared/comandos';
import { puntaje } from '@shared/domain/contabilidad';
import { ErrorNegocio, exigir } from '@shared/domain/reglas';
import { documentoImpresion } from '@shared/impresion';
import { esAdmin, OPCIONES, ROLES } from '@shared/permisos';
import type { Ejecutora, Permisos, Responsable, Resultado, Rol, Sesion, Usuario } from '@shared/types';
import { hoy, hora, r2 } from '@shared/util';
import type { Backend } from './backend/tipos';

/** Operaciones que solo leen: no requieren sincronizar con la nube. */
const LECTURA = new Set(['sesion.actual', 'ejecutora.obtener', 'ejecutora.obtenerPublico', 'ejecutora.resumen', 'flujo.automatico', 'dnie.disponibles', 'dnie.sesion', 'aeraf.listar', 'entrega.generar', 'sistema.info', 'madaf.clave', 'dnie.ingresar', 'dnie.salir', 'dnie.reiniciarPin']);
const SOLO_ESCRITORIO = 'Esta opción está disponible en la aplicación de escritorio.';

/** Opciones del puente cuando corre dentro del escritorio conectado a la nube. */
export interface OpcionesPuente {
  /** Bytes del motor SQLite (en el escritorio se leen del disco). */
  wasm?: () => Promise<Uint8Array>;
  /** Puente nativo del escritorio para archivos, impresión y menú. */
  delegado?: SiafPuente;
  /** Cada cuántos milisegundos se traen de la nube los cambios hechos en otro equipo o navegador. */
  refresco?: number;
}

export class PuenteWeb implements SiafPuente {
  readonly plataforma = 'web' as const;
  private nucleo!: Nucleo;
  private tabla!: TablaOperaciones;
  private listo: Promise<void>;
  private oyentes = new Set<(d: EventoCambio) => void>();
  private cola: Promise<void> = Promise.resolve();
  private ultimaAuditoria = 0;
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  constructor(private backend: Backend, private op: OpcionesPuente = {}) {
    this.listo = this.iniciar();
    const cada = op.refresco ?? 5000;
    if (cada > 0 && typeof window !== 'undefined') {
      setInterval(() => { if (document.visibilityState === 'visible') this.refrescar(); }, cada);
      window.addEventListener('focus', () => this.refrescar());
    }
  }

  private async iniciar(): Promise<void> {
    const bd = await BaseDatos.abrir(this.op.wasm ? { wasmBinary: (await this.op.wasm()).slice().buffer } : { locateFile: () => wasmUrl });
    this.nucleo = new Nucleo(bd);
    this.tabla = this.nucleo.operacionesComunes();
    this.nucleo.ctx.eventos.on('cambio', (d: EventoCambio) => {
      this.oyentes.forEach(fn => fn(d));
      /* cambios diferidos (verificación automática) también se guardan en la nube */
      if (this.temporizador) clearTimeout(this.temporizador);
      this.temporizador = setTimeout(() => { this.sincronizar().catch(e => this.avisarError(e)); }, 250);
    });
  }
  private get ctx() { return this.nucleo.ctx; }
  private avisarError(e: unknown) { this.oyentes.forEach(fn => fn({ ejecutora: '', mensaje: { texto: (e as Error).message, tipo: 'err' } })); }

  /* ------------------------- sesión y espacio ------------------------- */
  private async abrirSesion(u: Usuario): Promise<Sesion> {
    if (u.estado !== 'ACTIVO') { await this.backend.logout(); throw new ErrorNegocio('El usuario está inactivo. Comuníquese con el Administrador de usuarios.'); }
    this.limpiarLocal();
    this.nucleo.flujo.reiniciar();
    this.ctx.sesion = { usuario: u, inicio: hoy() + ' ' + hora() };
    let faltan = false;
    for (const caso of CTX_ORDER) {
      const g = await this.backend.cargarEspacio(u.id, caso);
      const clave = claveDe(u.id, caso);
      if (g) this.cargarEnMemoria(clave, g.datos, g.responsables); else faltan = true;
    }
    if (faltan) this.ctx.asegurarEspacio(u.id);
    this.ultimaAuditoria = Number(this.ctx.bd.valor('SELECT COALESCE(MAX(id),0) FROM auditoria') || 0);
    this.ctx.bd.transaccion(() => this.ctx.auditar('auth.login', '', 'usuario', u.usuario + ' (' + u.rol + ')'));
    await this.sincronizar(faltan);
    return this.ctx.sesion;
  }
  private cargarEnMemoria(clave: string, ej: Ejecutora, resp: Responsable[]): void {
    this.ctx.bd.transaccion(() => {
      this.ctx.ejecutoras.guardar(ej, clave);
      this.ctx.bd.run('DELETE FROM responsables WHERE ejecutora=?', [clave]);
      resp.forEach(r => this.ctx.responsables.insertar(r, clave));
    });
  }
  private limpiarLocal(): void {
    this.ctx.bd.transaccion(() => { this.ctx.bd.run('DELETE FROM ejecutoras'); this.ctx.bd.run('DELETE FROM responsables'); });
    this.ctx.sesion = null;
  }
  /** Envía a la nube el espacio del usuario y las nuevas filas de auditoría (en orden, sin carreras). */
  private sincronizar(forzar = true): Promise<void> {
    const s = this.ctx.sesion; if (!s || !forzar) return this.cola;
    const tarea = async () => {
      if (this.ctx.sesion?.usuario.id !== s.usuario.id) return;
      for (const caso of CTX_ORDER) {
        const clave = claveDe(s.usuario.id, caso);
        const ej = this.ctx.ejecutoras.cargar(clave); if (!ej) continue;
        await this.backend.guardarEspacio({ usuarioId: s.usuario.id, caso, datos: ej, responsables: this.ctx.responsables.listar(clave) });
      }
      const filas = this.ctx.bd.todos('SELECT * FROM auditoria WHERE id > ? ORDER BY id', [this.ultimaAuditoria]);
      if (filas.length) {
        this.ultimaAuditoria = Number(filas[filas.length - 1].id);
        await this.backend.registrarAuditoria(s.usuario.id, filas.map(f => ({ fecha: String(f.fecha), usuario: String(f.usuario), ejecutora: String(f.ejecutora || ''), accion: String(f.accion), entidad: String(f.entidad || ''), detalle: String(f.detalle || '') })));
      }
    };
    this.cola = this.cola.then(tarea, tarea);
    return this.cola;
  }
  /** Trae de la nube los cambios hechos con la misma cuenta en otro lugar (escritorio o navegador). */
  private refrescando = false;
  async refrescar(): Promise<void> {
    await this.listo;
    const s = this.ctx.sesion; if (!s || this.refrescando) return;
    this.refrescando = true;
    try {
      await this.cola;
      const cambiadas: string[] = [];
      for (const caso of CTX_ORDER) {
        const g = await this.backend.cargarEspacio(s.usuario.id, caso);
        if (!g || this.ctx.sesion?.usuario.id !== s.usuario.id) continue;
        const clave = claveDe(s.usuario.id, caso);
        const local = this.ctx.ejecutoras.cargar(clave);
        const nuevo = !local || (g.datos.tick || 0) > (local.tick || 0) ||
          ((g.datos.tick || 0) === (local.tick || 0) && JSON.stringify(g.responsables || []) !== JSON.stringify(this.ctx.responsables.listar(clave)));
        if (nuevo) { this.cargarEnMemoria(clave, g.datos, g.responsables); cambiadas.push(caso); }
      }
      cambiadas.forEach(c => this.oyentes.forEach(fn => fn({ ejecutora: c })));
    } catch { /* sin conexión: se reintenta en el siguiente ciclo */ } finally { this.refrescando = false; }
  }
  private requerirAdmin(): Usuario { const u = this.ctx.sesion?.usuario; exigir(u, 'Debe iniciar sesión.'); exigir(esAdmin(u), 'Su perfil no tiene acceso a esta operación: corresponde al Administrador de usuarios.'); return u!; }

  /* ------------------------- operaciones propias de la web ------------------------- */
  private async propia(metodo: string, a: unknown[]): Promise<{ manejada: boolean; data?: unknown }> {
    const str = (v: unknown) => S.registro.shape.email.parse(v);
    switch (metodo) {
      case 'sesion.actual': {
        if (this.ctx.sesion) return { manejada: true, data: this.ctx.sesion };
        const u = await this.backend.sesionActual();
        return { manejada: true, data: u ? await this.abrirSesion(u) : null };
      }
      case 'sesion.login': return { manejada: true, data: await this.abrirSesion(await this.backend.login(str(a[0]), str(a[1]))) };
      case 'sesion.registrar': {
        const d = S.registro.parse(a[0]);
        exigir(d.apellidos.trim() && d.nombres.trim(), 'Ingrese sus apellidos y nombres.');
        exigir(/^\d{8}$/.test(d.dni.trim()), 'Ingrese un DNI de 8 dígitos.');
        exigir(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim()), 'Ingrese un correo electrónico válido.');
        exigir(d.clave.length >= 8 && /\d/.test(d.clave) && /[a-zA-Z]/.test(d.clave), 'La contraseña debe tener al menos 8 caracteres y combinar letras y números.');
        const u = await this.backend.registrar(d);
        exigir(u, 'Cuenta creada. Le enviamos un correo para confirmarla: ábralo y luego inicie sesión.');
        return { manejada: true, data: await this.abrirSesion(u!) };
      }
      case 'sesion.logout':
        if (this.ctx.sesion) { this.ctx.bd.transaccion(() => this.ctx.auditar('auth.logout', '', 'usuario', this.ctx.usuarioActual)); await this.sincronizar(); }
        this.nucleo.flujo.reiniciar(); this.limpiarLocal(); await this.backend.logout();
        return { manejada: true };
      case 'sesion.cambiarClave': {
        const n = str(a[1]);
        exigir(n.length >= 8 && /\d/.test(n) && /[a-zA-Z]/.test(n), 'La nueva contraseña debe tener al menos 8 caracteres y combinar letras y números.');
        await this.backend.cambiarClave(str(a[0]), n); return { manejada: true };
      }
      case 'google.disponible': return { manejada: true, data: await this.backend.googleDisponible() };
      case 'google.config': case 'google.guardar': throw new ErrorNegocio('En la versión web el acceso con Google se configura en Supabase › Authentication › Providers › Google.');
      case 'usuarios.listar': this.requerirAdmin(); return { manejada: true, data: await this.backend.listarPerfiles() };
      case 'usuarios.perfil': {
        const yo = this.requerirAdmin(); const id = str(a[0]); const rol = S.rol.parse(a[1]) as Rol; const perm = S.permisos.parse(a[2]) as Permisos;
        exigir(ROLES.some(r => r.k === rol), 'Perfil no válido.');
        if (id === yo.id) exigir(rol === 'ADMINISTRADOR', 'No puede quitarse a sí mismo el perfil de Administrador.');
        const limpio: Permisos = {}; OPCIONES.forEach(o => { const v = perm[o.k]; if (v === 'C' || v === 'O') limpio[o.k] = v; });
        await this.backend.actualizarPerfil(id, { rol, permisos: limpio });
        this.ctx.bd.transaccion(() => this.ctx.auditar('usuario.perfil', '', 'usuario', id + ' → ' + rol)); await this.sincronizar();
        return { manejada: true, data: (await this.backend.listarPerfiles()).find(u => u.id === id) };
      }
      case 'usuarios.estado': {
        const yo = this.requerirAdmin(); const id = str(a[0]);
        exigir(id !== yo.id, 'No puede desactivar el usuario en sesión.');
        const u = (await this.backend.listarPerfiles()).find(x => x.id === id); exigir(u, 'Usuario no encontrado.');
        const estado = u!.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        await this.backend.actualizarPerfil(id, { estado });
        this.ctx.bd.transaccion(() => this.ctx.auditar('usuario.estado', '', 'usuario', u!.usuario + ' → ' + estado)); await this.sincronizar();
        return { manejada: true, data: { ...u, estado } };
      }
      case 'usuarios.crear': case 'usuarios.clave': throw new ErrorNegocio('En la versión web cada persona crea su propia cuenta (correo o Google); el administrador le asigna el perfil.');
      case 'docente.progreso': {
        this.requerirAdmin();
        const [perfiles, espacios] = await Promise.all([this.backend.listarPerfiles(), this.backend.listarEspacios()]);
        return { manejada: true, data: perfiles.filter(u => u.rol !== 'ADMINISTRADOR').map(u => {
          let modo = 'sin iniciar', registros = 0, ok = 0, total = 0;
          espacios.filter(e => e.usuarioId === u.id && CASOS[e.caso]).forEach(e => {
            const ej = e.datos; modo = ej.modo;
            registros += ej.certs.reduce((s, c) => s + c.secs.length, 0) + ej.cas.length + ej.exps.reduce((s, x) => s + x.secs.length, 0) + ej.ings.reduce((s, g) => s + g.secs.length, 0);
            CASOS[e.caso].subcasos.forEach(sc => { const p = puntaje(ej, sc); ok += p.ok; total += p.total; });
          });
          return { usuario: u.usuario, nombre: u.apellidos + ' ' + u.nombres, email: u.email, estado: u.estado, modo, registros, puntaje: total ? r2(ok * 100 / total) : 0, nota20: total ? r2(ok * 20 / total) : 0 };
        }) };
      }
      case 'auditoria.listar': this.requerirAdmin(); return { manejada: true, data: await this.backend.listarAuditoria(String(a[0] || ''), Number(a[1]) || 500) };
    }
    if (metodo.startsWith('aula.')) throw new ErrorNegocio(SOLO_ESCRITORIO);
    return { manejada: false };
  }

  /* ------------------------- interfaz SiafPuente ------------------------- */
  async invoke(metodo: string, ...args: unknown[]): Promise<Resultado> {
    await this.listo;
    try {
      const p = await this.propia(metodo, args);
      if (p.manejada) return { ok: true, data: p.data };
    } catch (e) { return traducirError(e); }
    const fn = this.tabla[metodo];
    const r = ejecutar(fn && (() => fn(...args)), metodo);
    if (r.ok && !LECTURA.has(metodo)) {
      try { await this.sincronizar(); } catch (e) { return { ok: false, error: (e as Error).message }; }
    }
    return r;
  }
  async google(): Promise<Resultado> {
    try {
      await this.listo;
      await this.backend.google();
      /* en la web la página se va a Google; en el escritorio vuelve aquí con la sesión ya abierta */
      const u = await this.backend.sesionActual();
      return { ok: true, data: u ? await this.abrirSesion(u) : null };
    } catch (e) { return traducirError(e); }
  }
  async guardarTexto(nombre: string, contenido: string, _ext: string): Promise<Resultado<string>> {
    if (this.op.delegado) return this.op.delegado.guardarTexto(nombre, contenido, _ext);
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    return { ok: true, data: nombre + ' (carpeta de descargas)' };
  }
  abrirTexto(ext: string[]): Promise<Resultado<{ contenido: string; nombre: string }>> {
    if (this.op.delegado) return this.op.delegado.abrirTexto(ext);
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = ext.map(e => '.' + e).join(',');
      i.onchange = async () => { const f = i.files?.[0]; res(f ? { ok: true, data: { contenido: await f.text(), nombre: f.name } } : { ok: false }); };
      i.click();
    });
  }
  imprimir(html: string, titulo: string): Promise<{ ok: boolean }> {
    if (this.op.delegado) return this.op.delegado.imprimir(html, titulo);
    return new Promise(res => {
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
      document.body.appendChild(f);
      f.onload = () => { setTimeout(() => { f.contentWindow?.focus(); f.contentWindow?.print(); setTimeout(() => f.remove(), 1500); res({ ok: true }); }, 200); };
      f.srcdoc = documentoImpresion(html, titulo);
    });
  }
  async pdf(html: string, nombre: string): Promise<Resultado<string>> {
    if (this.op.delegado) return this.op.delegado.pdf(html, nombre);
    await this.imprimir(html, nombre);
    return { ok: true, data: 'Elija «Guardar como PDF» en el cuadro de impresión.' };
  }
  async respaldoExportar(): Promise<Resultado<string>> {
    await this.listo; const s = this.ctx.sesion; if (!s) return { ok: false, error: 'Inicie sesión.' };
    const ejecutoras: Record<string, Ejecutora> = {}; const responsables: Record<string, Responsable[]> = {};
    CTX_ORDER.forEach(c => { const k = claveDe(s.usuario.id, c); const ej = this.ctx.ejecutoras.cargar(k); if (ej) { ejecutoras[c] = ej; responsables[c] = this.ctx.responsables.listar(k); } });
    return this.guardarTexto(`siaf-respaldo-${s.usuario.usuario}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ formato: 'siaf-respaldo-web', version: 1, usuario: s.usuario.usuario, fecha: hoy() + ' ' + hora(), ejecutoras, responsables }), 'json');
  }
  async respaldoImportar(): Promise<Resultado> {
    await this.listo; const s = this.ctx.sesion; if (!s) return { ok: false, error: 'Inicie sesión.' };
    const r = await this.abrirTexto(['json']); if (!r.ok || !r.data) return { ok: false };
    try {
      const d = JSON.parse(r.data.contenido);
      exigir(d?.formato === 'siaf-respaldo-web' && d.ejecutoras, 'El archivo no es una copia de seguridad de la versión web del simulador.');
      if (!confirm('¿Restaurar la copia de seguridad? Se reemplazarán los registros de su usuario.')) return { ok: false };
      CTX_ORDER.forEach(c => { if (d.ejecutoras[c]) this.cargarEnMemoria(claveDe(s.usuario.id, c), d.ejecutoras[c], d.responsables?.[c] || []); });
      this.ctx.bd.transaccion(() => this.ctx.auditar('respaldo.restaurar', '', 'respaldo', r.data!.nombre));
      await this.sincronizar();
      this.oyentes.forEach(fn => fn({ ejecutora: '', mensaje: { texto: 'Copia de seguridad restaurada.', tipo: 'ok' } }));
      return { ok: true };
    } catch (e) { const t = traducirError(e); this.avisarError(new Error(t.error)); return t; }
  }
  alCambiar(fn: (d: EventoCambio) => void): () => void { this.oyentes.add(fn); return () => { this.oyentes.delete(fn); }; }
  alMenu(fn: (cmd: string) => void): () => void { return this.op.delegado ? this.op.delegado.alMenu(fn) : () => undefined; }
}
