/* Administración de ejecutoras, AERAF, aula docente (calificación automática) y respaldos. */
import type { Contexto } from './contexto';
import type { Cmd } from '@shared/comandos';
import type { Aula, Ejecutora, Entrega, Estudiante, Responsable } from '@shared/types';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { construirSolucion, ejecutoraVacia } from '@shared/domain/fabrica';
import { puntaje } from '@shared/domain/contabilidad';
import { exigir, validarFecha } from '@shared/domain/reglas';
import { hoy, hora, okDate, r2, uid } from '@shared/util';
import { claveDe } from '../repositories/ejecutoraRepo';

export interface ProgresoUsuario { usuario: string; nombre: string; email: string; estado: string; modo: string; registros: number; puntaje: number; nota20: number }

export class EjecutoraService {
  constructor(private ctx: Contexto) {}
  obtener(id: string): Ejecutora { this.ctx.requerirSesion(); return this.ctx.cargar(id); }
  /** Lectura sin sesión (MADAF/AERAF trabajan con DNIe). */
  obtenerPublico(id: string): Ejecutora { return this.ctx.cargar(id); }
  resumen(): { id: string; modo: string; registros: number }[] {
    return CTX_ORDER.map(id => { const ej = this.ctx.cargar(id); return { id, modo: ej.modo, registros: ej.certs.length + ej.cas.length + ej.exps.reduce((a, e) => a + e.secs.length, 0) + ej.ings.reduce((a, g) => a + g.secs.length, 0) }; });
  }
  /** Restaura el caso resuelto en el espacio del usuario en sesión (no afecta a los demás usuarios). */
  cargarSolucion(id: string): void {
    this.ctx.requerirSesion();
    exigir(CASOS[id] && (CTX_ORDER as readonly string[]).includes(id), 'Ejecutora no válida.');
    this.ctx.bd.transaccion(() => { this.ctx.reemplazar(id, construirSolucion(id)); this.ctx.auditar('ejecutora.cargar-solucion', id, 'ejecutora', CASOS[id].corto); });
    this.ctx.notificar(id);
  }
  /** Deja vacía la ejecutora del usuario en sesión para registrar el caso desde cero. */
  practicar(id: string): void {
    this.ctx.requerirSesion();
    exigir(CASOS[id] && (CTX_ORDER as readonly string[]).includes(id), 'Ejecutora no válida.');
    this.ctx.bd.transaccion(() => { this.ctx.reemplazar(id, ejecutoraVacia(id, 'practica')); this.ctx.auditar('ejecutora.practicar', id, 'ejecutora', 'Reinicio para práctica'); });
    this.ctx.notificar(id);
  }
  setSubcaso(id: string, sub: string): void {
    this.ctx.requerirSesion();
    exigir(CASOS[id].subcasos.some(s => s.id === sub), 'Caso no válido.');
    this.ctx.operar(id, 'ejecutora.subcaso', ej => { ej.sub = sub; });
  }
  setFechaSistema(id: string, f: string): void {
    this.ctx.requerirSesion(); validarFecha(f, 'la fecha del sistema');
    this.ctx.operar(id, 'ejecutora.fecha', ej => { ej.fechaSis = f; }, () => f);
  }
  agregarProveedor(c: Cmd<'proveedor'>): void {
    this.ctx.requerirSesion();
    const n = c.num.trim(), nom = c.nom.trim().toUpperCase();
    exigir(c.tipo === 'RUC' ? /^\d{11}$/.test(n) : /^\d{8}$/.test(n), c.tipo === 'RUC' ? 'El RUC debe tener 11 dígitos.' : 'El DNI debe tener 8 dígitos.');
    exigir(nom, 'Ingrese la razón social o nombre.');
    this.ctx.operar(c.ejecutora, 'proveedor.agregar', ej => { if (!ej.provs.some(p => p.num === n)) ej.provs.push({ tipo: c.tipo, num: n, nom }); }, () => n + ' ' + nom);
  }
}

export const LIMITES: Record<string, number> = { ccp: 50, ca: 50, cta: 4, dev: 7 };
export class AerafService {
  constructor(private ctx: Contexto, private dnie: () => { dni: string } | null) {}
  private sesion(): void { this.ctx.requerirSesion(); exigir(this.dnie(), 'Ingrese al AERAF con su DNIe.'); }
  /** Responsables del espacio del usuario en sesión; los de otros usuarios no se pueden tocar. */
  private propios(): Responsable[] { return this.ctx.responsables.listarDeUsuario(this.ctx.sesion!.usuario.id); }
  private exigirPropio(id: string): void { exigir(this.ctx.responsables.duenoDe(id) === this.ctx.sesion!.usuario.id, 'Responsable no encontrado.'); }
  listar(ejecutora: string): Responsable[] { this.ctx.requerirSesion(); return this.ctx.responsables.listar(this.ctx.clave(ejecutora)); }
  crear(c: Cmd<'responsable'>): Responsable {
    this.sesion();
    const clave = this.ctx.clave(c.ejecutora);
    exigir(/^\d{8}$/.test(c.dni), 'Ingrese el DNI (8 dígitos).'); exigir(c.nombre.trim(), 'Ingrese apellidos y nombres.');
    exigir(/^\S+@\S+\.\S+$/.test(c.email), 'Registre un email válido.'); exigir(c.doc.trim() && okDate(c.fdoc), 'Ingrese el número y la fecha del documento que acredita.');
    const act = this.ctx.responsables.listar(clave).filter(r => r.tipo === c.tipo && r.estado !== 'BAJA');
    exigir(!act.some(r => r.dni === c.dni), 'El DNI ya está registrado para este tipo de responsable.');
    if (c.tipo === 'cta') exigir(act.filter(r => r.rol === c.rol).length < 2, 'Solo se permiten 2 titulares y 2 suplentes para el manejo de cuentas bancarias.');
    else if (LIMITES[c.tipo]) exigir(act.length < LIMITES[c.tipo], 'Se alcanzó el máximo de ' + LIMITES[c.tipo] + ' responsables.');
    const r: Responsable = { id: uid(), ejecutora: c.ejecutora, tipo: c.tipo, dni: c.dni, nombre: c.nombre.trim().toUpperCase(), cargo: c.cargo, area: c.area, email: c.email.trim(), doc: c.doc.trim(), fdoc: c.fdoc, rol: c.tipo === 'cta' ? c.rol : '', emailOk: false, estado: c.tipo === 'del' ? 'AUTORIZADO' : 'POR AUTORIZAR' };
    this.ctx.bd.transaccion(() => { this.ctx.responsables.insertar(r, clave); this.ctx.auditar('aeraf.registrar', c.ejecutora, 'responsable', c.tipo + ' ' + r.dni); });
    return r;
  }
  autorizar(ids: string[]): number {
    this.sesion(); exigir(ids.length, 'Marque la casilla del responsable para habilitar Autorizar.');
    const todos = this.propios(); let n = 0;
    this.ctx.bd.transaccion(() => ids.forEach(id => { const r = todos.find(z => z.id === id); if (!r) return; exigir(r.tipo !== 'cta' || r.emailOk, 'Confirme primero el email de ' + r.nombre + '.'); this.ctx.responsables.actualizar(id, { estado: 'AUTORIZADO' }); this.ctx.auditar('aeraf.autorizar', r.ejecutora, 'responsable', r.tipo + ' ' + r.dni); n++; }));
    return n;
  }
  baja(ids: string[]): void { this.sesion(); exigir(ids.length, 'Marque al menos un registro.'); ids.forEach(id => this.exigirPropio(id)); this.ctx.bd.transaccion(() => ids.forEach(id => { this.ctx.responsables.actualizar(id, { estado: 'BAJA' }); this.ctx.auditar('aeraf.baja', '', 'responsable', id); })); }
  confirmarEmail(id: string): void { this.sesion(); this.exigirPropio(id); this.ctx.bd.transaccion(() => this.ctx.responsables.actualizar(id, { emailOk: true })); }
}

/* ---------- Aula: entregas de estudiantes y calificación automática ---------- */
export interface ArchivoEntrega { formato: 'siaf-entrega'; version: number; estudiante: { codigo: string; nombres: string }; fecha: string; ejecutoras: Record<string, Ejecutora> }
export class DocenteService {
  constructor(private ctx: Contexto) {}
  aulas(): Aula[] { this.ctx.requerirAdmin(); return this.ctx.aulas.listar(); }
  crearAula(nombre: string, periodo: string): Aula {
    this.ctx.requerirAdmin(); exigir(nombre.trim(), 'Ingrese el nombre del aula.'); exigir(periodo.trim(), 'Ingrese el periodo académico.');
    const a = { id: uid(), nombre: nombre.trim(), periodo: periodo.trim(), creado: hoy() + ' ' + hora() };
    this.ctx.bd.transaccion(() => { this.ctx.aulas.crear(a); this.ctx.auditar('aula.crear', '', 'aula', a.nombre); });
    return { ...a, estudiantes: 0 };
  }
  eliminarAula(id: string): void { this.ctx.requerirAdmin(); this.ctx.bd.transaccion(() => { this.ctx.aulas.eliminar(id); this.ctx.auditar('aula.eliminar', '', 'aula', id); }); }
  estudiantes(aulaId: string): Estudiante[] { this.ctx.requerirAdmin(); return this.ctx.aulas.estudiantes(aulaId); }
  agregarEstudiante(aulaId: string, codigo: string, nombres: string, dni: string): Estudiante {
    this.ctx.requerirAdmin();
    exigir(codigo.trim(), 'Ingrese el código del estudiante.'); exigir(nombres.trim(), 'Ingrese los nombres.');
    exigir(!dni || /^\d{8}$/.test(dni), 'El DNI debe tener 8 dígitos.');
    exigir(!this.ctx.aulas.estudiantePorCodigo(aulaId, codigo.trim()), 'Ya existe un estudiante con ese código en el aula.');
    const e: Estudiante = { id: uid(), aulaId, codigo: codigo.trim(), nombres: nombres.trim().toUpperCase(), dni: dni || '' };
    this.ctx.bd.transaccion(() => { this.ctx.aulas.crearEstudiante(e); this.ctx.auditar('aula.estudiante', '', 'estudiante', e.codigo + ' ' + e.nombres); });
    return e;
  }
  importarEstudiantesCSV(aulaId: string, csv: string): number {
    this.ctx.requerirAdmin(); let n = 0;
    csv.split(/\r?\n/).map(l => l.split(/[;,\t]/).map(x => x.trim().replace(/^"|"$/g, ''))).filter(c => c[0] && c[1] && !/c[oó]digo/i.test(c[0])).forEach(c => { if (!this.ctx.aulas.estudiantePorCodigo(aulaId, c[0])) { this.agregarEstudiante(aulaId, c[0], c[1], /^\d{8}$/.test(c[2] || '') ? c[2] : ''); n++; } });
    return n;
  }
  eliminarEstudiante(id: string): void { this.ctx.requerirAdmin(); this.ctx.bd.transaccion(() => this.ctx.aulas.eliminarEstudiante(id)); }
  /** Califica el archivo de entrega del estudiante con el verificador (por caso, sobre 20). */
  calificar(arch: ArchivoEntrega): { puntaje: number; nota20: number; detalle: Entrega['detalle'] } {
    const detalle: Entrega['detalle'] = [];
    CTX_ORDER.forEach(x => { const ej = arch.ejecutoras[x]; if (!ej) return; CASOS[x].subcasos.forEach(sc => { const p = puntaje(ej, sc); detalle.push({ ejecutora: x, sub: sc.id, titulo: sc.titulo, ok: p.ok, total: p.total }); }); });
    const ok = detalle.reduce((a, d) => a + d.ok, 0), tot = detalle.reduce((a, d) => a + d.total, 0);
    const pct = tot ? ok / tot : 0;
    return { puntaje: r2(pct * 100), nota20: r2(pct * 20), detalle };
  }
  importarEntrega(aulaId: string, contenido: string, archivo: string): Entrega {
    this.ctx.requerirAdmin();
    let a: ArchivoEntrega; try { a = JSON.parse(contenido); } catch { exigir(false, 'El archivo no es una entrega válida.'); throw 0; }
    exigir(a && a.formato === 'siaf-entrega' && a.estudiante && a.ejecutoras, 'El archivo no corresponde a una entrega del SIAF-WEB Simulador.');
    let est = this.ctx.aulas.estudiantePorCodigo(aulaId, a.estudiante.codigo);
    if (!est) est = this.agregarEstudiante(aulaId, a.estudiante.codigo, a.estudiante.nombres, '');
    const cal = this.calificar(a);
    const e: Entrega = { id: uid(), estudianteId: est.id, fecha: hoy() + ' ' + hora(), archivo, ...cal };
    this.ctx.bd.transaccion(() => { this.ctx.aulas.registrarEntrega(e); this.ctx.auditar('aula.entrega', '', 'entrega', est!.codigo + ' nota ' + e.nota20); });
    return e;
  }
  entregas(aulaId: string): Entrega[] { this.ctx.requerirAdmin(); return this.ctx.aulas.entregas(aulaId); }
  /** Avance de cada usuario en su propio espacio (solo lectura, para el docente). */
  progreso(): ProgresoUsuario[] {
    this.ctx.requerirAdmin();
    return this.ctx.usuarios.listar().filter(u => u.rol !== 'ADMINISTRADOR').map(u => {
      let modo = 'sin iniciar', registros = 0, ok = 0, total = 0;
      CTX_ORDER.forEach(x => {
        const ej = this.ctx.ejecutoras.cargar(claveDe(u.id, x)); if (!ej) return;
        modo = ej.modo;
        registros += ej.certs.reduce((a, c) => a + c.secs.length, 0) + ej.cas.length + ej.exps.reduce((a, e) => a + e.secs.length, 0) + ej.ings.reduce((a, g) => a + g.secs.length, 0);
        CASOS[x].subcasos.forEach(sc => { const p = puntaje(ej, sc); ok += p.ok; total += p.total; });
      });
      return { usuario: u.usuario, nombre: u.apellidos + ' ' + u.nombres, email: u.email, estado: u.estado, modo, registros, puntaje: total ? r2(ok * 100 / total) : 0, nota20: total ? r2(ok * 20 / total) : 0 };
    });
  }
  /** El estudiante genera su archivo de entrega con las ejecutoras que trabajó. */
  generarEntrega(codigo: string, nombres: string): ArchivoEntrega {
    this.ctx.requerirSesion();
    exigir(codigo.trim() && nombres.trim(), 'Ingrese su código y nombres.');
    const ejecutoras: Record<string, Ejecutora> = {};
    CTX_ORDER.forEach(x => { ejecutoras[x] = this.ctx.cargar(x); });
    this.ctx.bd.transaccion(() => this.ctx.auditar('entrega.generar', '', 'entrega', codigo));
    return { formato: 'siaf-entrega', version: 2, estudiante: { codigo: codigo.trim(), nombres: nombres.trim().toUpperCase() }, fecha: hoy() + ' ' + hora(), ejecutoras };
  }
}
