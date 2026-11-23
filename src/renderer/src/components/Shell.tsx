/* Armazón del Módulo de Ejecución: barra superior, menú lateral, migas, barra del caso y panel de lista. */
import { useEffect, useState, type ReactNode } from 'react';
import { useApp, type AppId, type Pantalla } from '../store';
import { Icon } from './Icon';
import { Btn, Lista } from './ui';
import { CASOS } from '@shared/casos';
import { CAT, MESES } from '@shared/catalogo';
import { menuUsuario } from '../features/Usuario';
import { api } from '../api';
import { intentar } from '../store';
import { confirmar } from './Dialogos';
import { seleccionarProveedor } from './Selectores';
import { hoy, okDate } from '@shared/util';
import { esAdmin, puede, ROL_TXT } from '@shared/permisos';
import type { Opcion } from '@shared/types';
import { Logo } from './Logo';



export function Topbar({ app }: { app: AppId }) {
  const { sesion, ejecutoraId, ir, alternarMenu } = useApp();
  const d = CASOS[ejecutoraId];
  const u = sesion?.usuario;
  return <header className="topbar">
    <button className="hamb" onClick={alternarMenu}><Icon n="menu" /></button>
    <div className="logo" onClick={() => ir('bienvenida')}><Logo simulador={false} plataforma /></div>
    <div className="mods"><small>MÓDULOS</small>
      <select value={app} onChange={e => ir(e.target.value as AppId)}>
        <option value="ejecucion">Ejecucion Presupuestal</option><option value="opl">SIAF Operaciones en Línea</option>
        <option value="aeraf">AERAF</option><option value="madaf">MADAF</option>
        {esAdmin(u) && <option value="docente">Panel del administrador</option>}
        <option value="bienvenida">Inicio</option>
      </select></div>
    <div className="tb-sp" />
    <div className="tb-user" onClick={menuUsuario} title={ROL_TXT[u?.rol || '']}><div><b>{u?.dni && u.dni !== '00000000' ? u.dni : u?.usuario} - {u?.nombres} {u?.apellidos}</b><small>{d.entidad.secEjec} - {d.entidad.ueNom}</small></div><Icon n="chevron" /></div>
  </header>;
}

type Grupo = 'Registro' | 'Consultas' | 'Reportes' | 'Herramientas';
/** Menú del Módulo de Ejecución Presupuestal tal como aparece en el SIAF-WEB: [opción del menú, grupo, migas]. */
export const PANTALLAS: Record<Pantalla, [string, Grupo, string]> = {
  cert: ['Certificación', 'Registro', 'Certificación'], ca: ['Compromiso Anual', 'Registro', 'Compromiso Anual'],
  cm: ['Registro SIAF - Compromiso Mensual', 'Registro', 'Registro SIAF - Compromiso Mensual'], dev: ['Registro SIAF - Devengado', 'Registro', 'Registro SIAF - Devengado'],
  gir: ['Registro SIAF - Girado', 'Registro', 'Registro SIAF - Girado'], mod: ['Modificación de Certificación y Compromiso Anual', 'Registro', 'Modificación de Certificación y Compromiso Anual'],
  modexp: ['Modificación Expediente', 'Registro', 'Modificación Expediente'], det: ['Registro SIAF - Determinado', 'Registro', 'Registro SIAF - Determinado'],
  rec: ['Registro SIAF - Recaudado', 'Registro', 'Registro SIAF - Recaudado'], ren: ['Rendición', 'Registro', 'Rendición'], reasig: ['Reasignacion', 'Registro', 'Reasignación'],
  apcta: ['Solicitud de Apertura de Cuenta Bancaria', 'Registro', 'Solicitud de Apertura de Cuenta Bancaria'], ope: ['Beneficiario OPE', 'Registro', 'Beneficiario OPE'],
  t6: ['Hoja de Trabajo T6', 'Registro', 'Hoja de Trabajo T6'], area: ['Area', 'Registro', 'Área'], ctas: ['Cuentas Bancarias', 'Registro', 'Cuentas Bancarias'],
  cci: ['Cuenta Interbancaria (CCI)', 'Registro', 'Cuenta Interbancaria (CCI)'], conv: ['Convenios', 'Registro', 'Convenios'], via: ['Viáticos y Encargos Internos', 'Registro', 'Viáticos y Encargos Internos'],
  dliq: ['Distribución de la Liquidación del Viático - Encargo Interno', 'Registro', 'Distribución de la Liquidación del Viático - Encargo Interno'],
  modvia: ['Modificación de Solicitud de Viático y Encargo Interno', 'Registro', 'Modificación de solicitud de viático y encargo interno'],
  pagotros: ['Certificación de Fase Pagado (Tipos de Pago Otros)', 'Registro', 'Certificación de fase pagado (Tipos de pago otros)'],
  pim: ['Marco presupuestal (PIM)', 'Herramientas', 'Marco presupuestal (PIM)'],
  contratos: ['Contratos', 'Consultas', 'Contratos'], atp: ['Asignación de Tesoro Público', 'Consultas', 'Asignación de Tesoro Público'],
  repcca: ['Certificación y Compromiso Anual', 'Reportes', 'Certificación Y Compromiso Anual'], rep: ['Formatos SIAF', 'Reportes', 'Formatos SIAF'], transf: ['Transferencia Interbancaria', 'Reportes', 'Transferencia Interbancaria']
};
/** Opción del administrador que habilita cada pantalla (las demás son de consulta libre). */
const OPCION_PANTALLA: Partial<Record<Pantalla, Opcion>> = {
  cert: 'cert', ca: 'ca', cm: 'cm', dev: 'dev', gir: 'gir', pagotros: 'gir', t6: 'gir', mod: 'mod', modexp: 'mod', det: 'det', rec: 'det', ren: 'dev', reasig: 'cm',
  apcta: 'gir', ope: 'gir', ctas: 'gir', cci: 'gir', area: 'ca', conv: 'ca', via: 'cm', dliq: 'dev', modvia: 'cm', pim: 'cert', repcca: 'cont', rep: 'cont', transf: 'cont'
};
export const pantallaVisible = (u: Parameters<typeof puede>[0], k: Pantalla) => !OPCION_PANTALLA[k] || puede(u, OPCION_PANTALLA[k]!, 'C');
export function MenuLateral() {
  const { pantalla, irPantalla, sesion, alternarMenu, ejecutoraId, ej } = useApp();
  const g0 = PANTALLAS[pantalla][1];
  const [grupoSel, setGrupoSel] = useState<Grupo>(g0 === 'Herramientas' ? 'Registro' : g0);
  useEffect(() => { if (g0 !== 'Herramientas') setGrupoSel(g0); }, [g0]);
  const items = (Object.keys(PANTALLAS) as Pantalla[]).filter(k => PANTALLAS[k][1] === grupoSel && pantallaVisible(sesion?.usuario, k));
  const primera = (g: string) => (Object.keys(PANTALLAS) as Pantalla[]).find(k => PANTALLAS[k][1] === g && pantallaVisible(sesion?.usuario, k)) || 'cert';
  const cargarCaso = async () => {
    if (await confirmar('¿Cargar el Caso Práctico 1 (obra P.S. Aymaña, CUI 2308220)?', { icono: 'folder', ok: 'Cargar', detalle: 'Se reemplazan los certificados, compromisos y expedientes de su ejecutora por los del caso de apoyo. Su marco presupuestal (PIM) propio y los registros complementarios también se reemplazan.' }))
      intentar(() => api.ejecutora.solucion(ejecutoraId), 'Caso Práctico 1 cargado.', 'Úselo como apoyo: puede seguir registrando sus propias operaciones.');
  };
  const vaciar = async () => {
    if (await confirmar('¿Borrar todos los registros de su ejecutora?', { icono: 'trash', ok: 'Borrar todo', detalle: 'La ejecutora queda vacía, como al inicio. Los demás usuarios no se ven afectados.' }))
      intentar(() => api.ejecutora.practicar(ejecutoraId), 'La ejecutora quedó vacía.');
  };
  const fecha = () => useApp.getState().abrir(c => <FechaSistema actual={ej?.fechaSis || ''} cerrar={c} />, 'conf');
  return <aside className="menu"><div className="mh"><span>Menu</span><button onClick={alternarMenu} title="Ocultar menú">«</button></div>
    <div className="msel"><span className="msel-i"><Icon n="doc" /></span><select value={grupoSel} onChange={e => { setGrupoSel(e.target.value as Grupo); irPantalla(primera(e.target.value)); }}>{['Registro', 'Consultas', 'Reportes'].map(g => <option key={g}>{g}</option>)}</select></div>
    <div className="mitems">{items.map(k => <a key={k} className={pantalla === k ? 'on' : ''} onClick={() => irPantalla(k)}>{PANTALLAS[k][0]}</a>)}
      <div className="mherr"><div className="mgrp">HERRAMIENTAS DEL SIMULADOR</div>
        <a className={pantalla === 'pim' ? 'on' : ''} onClick={() => irPantalla('pim')}>Marco presupuestal (PIM)</a>
        <a onClick={() => seleccionarProveedor()}>Proveedores</a>
        <a onClick={fecha}>Fecha del sistema{ej ? ': ' + ej.fechaSis : ''}</a>
        <a className="m-caso" onClick={cargarCaso}>Cargar Caso Práctico 1 (Aymaña)</a>
        <a onClick={vaciar}>Borrar todos mis registros</a>
        <p className="mnota">Simulador académico de la Plataforma SIAF-SP. El Caso Práctico 1 es solo material de apoyo: registre sus propias operaciones.</p>
      </div></div></aside>;
}
function FechaSistema({ actual, cerrar }: { actual: string; cerrar: () => void }) {
  const [f, setF] = useState(actual || hoy()); const [e, setE] = useState('');
  const { ejecutoraId } = useApp();
  const ok = async () => { if (!okDate(f)) { setE('Use el formato dd/mm/aaaa.'); return; } cerrar(); intentar(() => api.ejecutora.fecha(ejecutoraId, f), 'Fecha del sistema: ' + f); };
  return <><h3>Fecha del sistema</h3><p className="muted">Fecha con la que se registran sus operaciones (certificados, compromisos, expedientes).</p>
    <div className="f"><label>Fecha (dd/mm/aaaa)</label><input className="ctl" value={f} onChange={x => setF(x.target.value)} /></div><small className="err">{e}</small>
    <div className="mact"><Btn v="g" onClick={() => setF(hoy())}>Hoy</Btn><Btn v="g" onClick={cerrar}>Cancelar</Btn><Btn v="p" onClick={ok}>Aceptar</Btn></div></>;
}
export function Migas() {
  const { pantalla } = useApp();
  const s = PANTALLAS[pantalla];
  return <div className="crumbs"><span>Módulos <i>&gt;</i> Ejecución presupuestal <i>&gt;</i> {s[1]} <i>&gt;</i> <b>{s[2]}</b></span></div>;
}
export interface PanelProps { titulo: string; onNuevo?: () => void; tituloNuevo?: string; ph: string; avanzada?: boolean; total: number; etiqueta: string; children: ReactNode; limpiar?: () => void }
export function PanelLista({ titulo, onNuevo, tituloNuevo, ph, avanzada, total, etiqueta, children, limpiar }: PanelProps) {
  const { filtros: f, setFiltro, ejecutoraId } = useApp();
  return <div className="listp">
    <div className="lp-head"><b>{titulo}</b>{onNuevo && <button className="plus" title={tituloNuevo} onClick={onNuevo}><Icon n="plus" /></button>}</div>
    <div className="lp-per"><span>Periodo</span><select value={f.mes} onChange={e => setFiltro('mes', e.target.value)}><option value="TODOS">TODOS</option>{MESES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}</select><select disabled><option>{(useApp.getState().ej?.fechaSis || '').slice(6) || CASOS[ejecutoraId].anio}</option></select></div>
    <div className="lp-search"><span className="sico"><Icon n="search" /></span><input placeholder={ph} value={f.q} onChange={e => setFiltro('q', e.target.value)} />{avanzada && <button onClick={() => setFiltro('adv', !f.adv)} title="Búsqueda avanzada"><Icon n="chevron" /></button>}</div>
    {limpiar && <button className="lp-limpiar" onClick={limpiar}><Icon n="reset" /> Limpiar Filtros</button>}
    {avanzada && f.adv && <div className="advs"><b>BÚSQUEDA AVANZADA</b><div className="fgrid">
      <Lista label="Tipo certificación" c={6} value={f.tipoCert} onChange={v => setFiltro('tipoCert', v)} opciones={['TODOS', ...CAT.tiposCert]} />
      <Lista label="Estado" c={6} value={f.estado} onChange={v => setFiltro('estado', v)} opciones={['TODOS', 'REGISTRADO', 'EN VERIFICACION', 'ENVIADO A OPP', 'PENDIENTE DE FIRMA', 'APROBADO', 'RECHAZADO', 'DESCARTADO']} />
      <Lista label="Rubro" c={12} value={f.rubro} onChange={v => setFiltro('rubro', v)} opciones={[{ v: 'TODOS', t: 'TODOS' }, ...CAT.rubros.map(r => [r[0], r[1]] as [string, string])]} />
    </div><div className="mact"><Btn sm v="g" icon="reset" onClick={() => { setFiltro('tipoCert', 'TODOS'); setFiltro('estado', 'TODOS'); setFiltro('rubro', 'TODOS'); }}>Limpiar</Btn><Btn sm v="p" icon="search" onClick={() => setFiltro('adv', false)}>Buscar</Btn></div></div>}
    <div className="lp-count"><span>{total} {etiqueta}</span><button title={f.asc ? 'Orden ascendente' : 'Orden descendente'} onClick={() => setFiltro('asc', !f.asc)}>{f.asc ? '↑' : '↓'}</button></div>
    <div className="lp-list">{total ? children : <div className="empty-sm"><span className="eic-sm"><Icon n="folder" /></span>No se encontraron {etiqueta.toLowerCase()}.</div>}</div>
    <div className="lp-foot">Filas <select disabled><option>25</option></select><span>Del {total ? 1 : 0} al {Math.min(total, 25)} de {total}</span></div>
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
