/* Armazón del Módulo de Ejecución: barra superior, menú lateral, migas, barra del caso y panel de lista. */
import type { ReactNode } from 'react';
import { useApp, type AppId, type Pantalla } from '../store';
import { Icon } from './Icon';
import { Btn, Lista } from './ui';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { CAT, MESES } from '@shared/catalogo';
import { okDate } from '@shared/util';
import { api } from '../api';
import { intentar } from '../store';
import { confirmar } from './Dialogos';
import { menuUsuario } from '../features/Usuario';
import { esAdmin, puede, ROL_TXT } from '@shared/permisos';
import type { Opcion } from '@shared/types';
import { Logo } from './Logo';



export function Topbar({ app }: { app: AppId }) {
  const { sesion, ejecutoraId, ir, alternarMenu } = useApp();
  const d = CASOS[ejecutoraId];
  const u = sesion?.usuario;
  return <header className="topbar">
    <button className="hamb" onClick={alternarMenu}><Icon n="menu" /></button>
    <div className="logo" onClick={() => ir('bienvenida')}><Logo /></div>
    <div className="mods"><small>MÓDULOS</small>
      <select value={app} onChange={e => ir(e.target.value as AppId)}>
        <option value="ejecucion">Módulo de Ejecución</option><option value="opl">SIAF Operaciones en Línea</option>
        <option value="aeraf">AERAF</option><option value="madaf">MADAF</option>
        {esAdmin(u) && <option value="docente">Panel del administrador</option>}
        <option value="casos">Administración de casos</option><option value="bienvenida">Inicio</option>
      </select></div>
    <div className="tb-sp" />
    <div className="tb-user" onClick={menuUsuario}><div><b>{u?.usuario} - {u?.apellidos} {u?.nombres}</b><small>{ROL_TXT[u?.rol || '']} · {d.entidad.secEjec} - {d.entidad.ueNom} · AF {d.anio}</small></div><Icon n="chevron" /></div>
  </header>;
}

export const PANTALLAS: Record<Pantalla, [string, string, string]> = {
  cert: ['Certificados', 'Registro', 'Certificación'], ca: ['Compromiso Anual', 'Registro', 'Compromiso Anual'], cm: ['Registro SIAF - Compromiso Mensual', 'Registro', 'Compromiso Mensual'],
  dev: ['Registro SIAF - Devengado', 'Registro', 'Devengado'], gir: ['Registro SIAF - Girado', 'Registro', 'Girado'], mod: ['Modificación de Certificación y Compromiso Anual', 'Registro', 'Modificación'],
  det: ['Registro SIAF - Determinado', 'Registro', 'Determinado / Recaudado'], t6: ['Registro SIAF - Papeleta T-6 (devolución)', 'Registro', 'Papeleta T-6'],
  cont: ['Módulo Contable', 'Consulta', 'Módulo Contable'], ver: ['Verificar mi registro', 'Consulta', 'Verificación'], clas: ['Clasificadores presupuestarios 2026', 'Consulta', 'Clasificadores'],
  cat: ['Catálogo de apoyo', 'Consulta', 'Catálogo'], rep: ['Notas y reportes', 'Reportes', 'Reportes']
};
/** Opción del administrador que habilita cada pantalla (las demás son de consulta libre). */
const OPCION_PANTALLA: Partial<Record<Pantalla, Opcion>> = { cert: 'cert', ca: 'ca', cm: 'cm', dev: 'dev', gir: 'gir', t6: 'gir', mod: 'mod', det: 'det', cont: 'cont', rep: 'cont' };
export function MenuLateral() {
  const { pantalla, irPantalla, ejecutoraId, sesion } = useApp();
  const grupo = PANTALLAS[pantalla][1];
  const visible = (k: Pantalla) => !OPCION_PANTALLA[k] || puede(sesion?.usuario, OPCION_PANTALLA[k]!, 'C');
  const items = (Object.keys(PANTALLAS) as Pantalla[]).filter(k => PANTALLAS[k][1] === grupo && visible(k));
  return <aside className="menu"><div className="mh"><span>Menú</span></div>
    <div className="msel"><select value={grupo} onChange={e => irPantalla((Object.keys(PANTALLAS) as Pantalla[]).find(k => PANTALLAS[k][1] === e.target.value)!)}>{['Registro', 'Consulta', 'Reportes'].map(g => <option key={g}>{g}</option>)}</select></div>
    {items.map(k => <a key={k} className={pantalla === k ? 'on' : ''} onClick={() => irPantalla(k)}>{PANTALLAS[k][0]}</a>)}
    <div className="mfoot">{CASOS[ejecutoraId].corto}</div></aside>;
}
export function Migas() {
  const { pantalla, alternarGuia, irPantalla, alternarMenu } = useApp();
  const s = PANTALLAS[pantalla];
  return <div className="crumbs"><span>Módulos › Ejecución presupuestal › {s[1]} › <b>{s[2]}</b></span>
    <span className="crr"><Btn sm icon="book" onClick={alternarGuia}>Expediente del caso</Btn><Btn sm icon="check" onClick={() => irPantalla('ver')}>Verificar</Btn><button className="lnk" onClick={alternarMenu}>Ampliar</button></span></div>;
}
export function BarraCaso() {
  const { ej, ejecutoraId, setEjecutora, sesion } = useApp();
  const d = CASOS[ejecutoraId];
  if (!ej) return null;
  const modo = { solucion: 'SOLUCIÓN CARGADA', practica: 'MODO PRÁCTICA', vacio: 'SIN DATOS' }[ej.modo];
  return <div className="casebar">
    <select value={ejecutoraId} onChange={e => setEjecutora(e.target.value)} title="Unidad ejecutora">{CTX_ORDER.map(x => <option key={x} value={x}>{CASOS[x].corto}</option>)}</select>
    <select value={ej.sub} onChange={e => intentar(() => api.ejecutora.subcaso(ejecutoraId, e.target.value))}>{d.subcasos.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}</select>
    <span className={'mode m-' + ej.modo}>{modo}</span>
    <label className="fsis">Fecha del sistema <input className="ctl sm" defaultValue={ej.fechaSis} key={ej.fechaSis} onBlur={e => { const v = e.target.value; if (v !== ej.fechaSis) { if (!okDate(v)) { useApp.getState().avisar('Fecha inválida (dd/mm/aaaa)', 'err'); e.target.value = ej.fechaSis; return; } intentar(() => api.ejecutora.fecha(ejecutoraId, v), 'Fecha del sistema: ' + v); } }} /></label>
    <span className="cbsp" />
    <Btn sm onClick={async () => { if (await confirmar('¿Cargar el caso resuelto en su espacio?', { icono: 'warn', ok: 'Cargar', detalle: 'Se reemplazan los registros de su usuario. Los demás usuarios no se ven afectados.' })) intentar(() => api.ejecutora.solucion(ejecutoraId), 'Caso resuelto cargado'); }}>Cargar caso resuelto</Btn>
    <Btn sm v="g" onClick={async () => { if (await confirmar('¿Practicar desde cero en ' + d.corto + '?', { icono: 'edit', ok: 'Iniciar', detalle: 'Se borran los registros actuales de esta ejecutora.' })) intentar(() => api.ejecutora.practicar(ejecutoraId), 'Ejecutora lista para practicar'); }}>Practicar desde cero</Btn>
  </div>;
}

export interface PanelProps { titulo: string; onNuevo?: () => void; tituloNuevo?: string; ph: string; avanzada?: boolean; total: number; etiqueta: string; children: ReactNode }
export function PanelLista({ titulo, onNuevo, tituloNuevo, ph, avanzada, total, etiqueta, children }: PanelProps) {
  const { filtros: f, setFiltro, ejecutoraId } = useApp();
  return <div className="listp">
    <div className="lp-head"><b>{titulo}</b>{onNuevo && <button className="plus" title={tituloNuevo} onClick={onNuevo}><Icon n="plus" /></button>}</div>
    <div className="lp-per"><span>Periodo</span><select value={f.mes} onChange={e => setFiltro('mes', e.target.value)}><option value="TODOS">TODOS</option>{MESES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}</select><select disabled><option>{CASOS[ejecutoraId].anio}</option></select></div>
    <div className="lp-search"><span className="sico"><Icon n="search" /></span><input placeholder={ph} value={f.q} onChange={e => setFiltro('q', e.target.value)} />{avanzada && <button onClick={() => setFiltro('adv', !f.adv)} title="Búsqueda avanzada"><Icon n="chevron" /></button>}</div>
    {avanzada && f.adv && <div className="advs"><b>BÚSQUEDA AVANZADA</b><div className="fgrid">
      <Lista label="Tipo certificación" c={6} value={f.tipoCert} onChange={v => setFiltro('tipoCert', v)} opciones={['TODOS', ...CAT.tiposCert]} />
      <Lista label="Estado" c={6} value={f.estado} onChange={v => setFiltro('estado', v)} opciones={['TODOS', 'REGISTRADO', 'EN VERIFICACION', 'ENVIADO A OPP', 'PENDIENTE DE FIRMA', 'APROBADO', 'RECHAZADO', 'DESCARTADO']} />
      <Lista label="Rubro" c={12} value={f.rubro} onChange={v => setFiltro('rubro', v)} opciones={[{ v: 'TODOS', t: 'TODOS' }, ...CAT.rubros.map(r => [r[0], r[1]] as [string, string])]} />
    </div><div className="mact"><Btn sm v="g" icon="reset" onClick={() => { setFiltro('tipoCert', 'TODOS'); setFiltro('estado', 'TODOS'); setFiltro('rubro', 'TODOS'); }}>Limpiar</Btn><Btn sm v="p" icon="search" onClick={() => setFiltro('adv', false)}>Buscar</Btn></div></div>}
    <div className="lp-count"><span>{total} {etiqueta}</span><button title={f.asc ? 'Orden ascendente' : 'Orden descendente'} onClick={() => setFiltro('asc', !f.asc)}>{f.asc ? '↑' : '↓'}</button></div>
    <div className="lp-list">{total ? children : <div className="empty-sm">No hay registros en el periodo seleccionado.</div>}</div>
    <div className="lp-foot">Filas <select disabled><option>25</option></select><span>{total ? 1 : 0} - {Math.min(total, 25)} de {total}</span></div>
  </div>;
}
/** utilidades de filtrado de listas */
export function useFiltrado() {
  const f = useApp(s => s.filtros);
  return {
    porMes: (r: { mes: number }) => f.mes === 'TODOS' || r.mes === +f.mes,
    porNum: (n: number) => !f.q || String(n).padStart(5, '0').includes(f.q) || String(n).includes(f.q),
    orden: (a: { num: number }, b: { num: number }) => (f.asc ? a.num - b.num : b.num - a.num), f
  };
}
