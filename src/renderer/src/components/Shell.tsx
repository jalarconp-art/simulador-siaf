/* Armazón del Módulo de Ejecución: barra superior, menú lateral, migas, barra del caso y panel de lista. */
import type { ReactNode } from 'react';
import { useApp, type AppId, type Pantalla } from '../store';
import { Icon } from './Icon';
import { Btn, Lista } from './ui';
import { CASOS } from '@shared/casos';
import { CAT, MESES } from '@shared/catalogo';
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

type Grupo = 'Registro' | 'Consultas' | 'Reportes';
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
  contratos: ['Contratos', 'Consultas', 'Contratos'], atp: ['Asignación de Tesoro Público', 'Consultas', 'Asignación de Tesoro Público'],
  repcca: ['Certificación y Compromiso Anual', 'Reportes', 'Certificación Y Compromiso Anual'], rep: ['Formatos SIAF', 'Reportes', 'Formatos SIAF'], transf: ['Transferencia Interbancaria', 'Reportes', 'Transferencia Interbancaria']
};
/** Opción del administrador que habilita cada pantalla (las demás son de consulta libre). */
const OPCION_PANTALLA: Partial<Record<Pantalla, Opcion>> = {
  cert: 'cert', ca: 'ca', cm: 'cm', dev: 'dev', gir: 'gir', t6: 'gir', mod: 'mod', modexp: 'mod', det: 'det', rec: 'det', ren: 'dev', reasig: 'cm',
  apcta: 'gir', ope: 'gir', ctas: 'gir', cci: 'gir', area: 'ca', conv: 'ca', via: 'cm', dliq: 'dev', modvia: 'cm', repcca: 'cont', rep: 'cont', transf: 'cont'
};
export const pantallaVisible = (u: Parameters<typeof puede>[0], k: Pantalla) => !OPCION_PANTALLA[k] || puede(u, OPCION_PANTALLA[k]!, 'C');
export function MenuLateral() {
  const { pantalla, irPantalla, sesion, alternarMenu } = useApp();
  const grupo = PANTALLAS[pantalla][1];
  const items = (Object.keys(PANTALLAS) as Pantalla[]).filter(k => PANTALLAS[k][1] === grupo && pantallaVisible(sesion?.usuario, k));
  const primera = (g: string) => (Object.keys(PANTALLAS) as Pantalla[]).find(k => PANTALLAS[k][1] === g && pantallaVisible(sesion?.usuario, k)) || 'cert';
  return <aside className="menu"><div className="mh"><span>Menu</span><button onClick={alternarMenu} title="Ocultar menú">«</button></div>
    <div className="msel"><span className="msel-i"><Icon n="doc" /></span><select value={grupo} onChange={e => irPantalla(primera(e.target.value))}>{['Registro', 'Consultas', 'Reportes'].map(g => <option key={g}>{g}</option>)}</select></div>
    <div className="mitems">{items.map(k => <a key={k} className={pantalla === k ? 'on' : ''} onClick={() => irPantalla(k)}>{PANTALLAS[k][0]}</a>)}</div></aside>;
}
export function Migas() {
  const { pantalla } = useApp();
  const s = PANTALLAS[pantalla];
  return <div className="crumbs"><span>Módulos <i>&gt;</i> Ejecución presupuestal <i>&gt;</i> {s[1]} <i>&gt;</i> <b>{s[2]}</b></span></div>;
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
