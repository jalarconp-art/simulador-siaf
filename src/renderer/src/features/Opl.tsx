/* SIAF Operaciones en Línea: usuarios de operadores y aprobación de presupuesto (OPP) */
import { siaf } from '@/puente';
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Topbar } from '../components/Shell';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista, Vacio } from '../components/ui';
import { confirmar } from '../components/Dialogos';
import { Icon } from '../components/Icon';
import type { Ejecutora, Target, Usuario } from '@shared/types';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { fmt, pad, sumI } from '@shared/util';
import { esAdmin, puede, ROL_TXT } from '@shared/permisos';
import { AccesoGoogle, Usuarios } from './Admin';

type Vista = 'usr' | 'goo' | 'apc' | 'apm';
export function Opl() {
  const { sesion, menuAbierto } = useApp();
  const admin = esAdmin(sesion?.usuario);
  const [v, setV] = useState<Vista>(admin ? 'usr' : 'apc');
  const items: [Vista, string, string][] = [...(admin ? [['usr', 'Administrador de usuarios', 'SEGURIDAD'], ['goo', 'Acceso con Google', 'SEGURIDAD']] as [Vista, string, string][] : []), ['apc', 'Aprobación de solicitudes de certificación', 'MÓDULO PRESUPUESTAL UE'], ['apm', 'Aprobación de modificaciones de certificación', 'MÓDULO PRESUPUESTAL UE']];
  let grp = '';
  return <><Topbar app="opl" /><div className={'layout' + (menuAbierto ? '' : ' nomenu')}>
    <aside className="menu"><div className="mh"><span>SIAF Operaciones en Línea</span></div>
      {items.map(([k, t, g]) => { const h = <div key={k}>{g !== grp && <div className="mgrp">{g}</div>}<a className={v === k ? 'on' : ''} onClick={() => setV(k)}>{t}</a></div>; grp = g; return h; })}
      <div className="mfoot">Perfil: {ROL_TXT[sesion?.usuario.rol || ''] || sesion?.usuario.rol}</div></aside>
    <main><div className="crumbs"><span>SIAF Operaciones en Línea › <b>{items.find(i => i[0] === v)![1]}</b></span></div>
      <div className="work"><div className="detail full">{v === 'usr' ? <Usuarios /> : v === 'goo' ? <AccesoGoogle /> : <Aprobaciones mods={v === 'apm'} key={v} />}</div></div></main></div></>;
}
function Aprobaciones({ mods }: { mods: boolean }) {
  const { ejecutoraId, avisar, sesion } = useApp();
  const [x, setX] = useState(ejecutoraId); const [ej, setEj] = useState<Ejecutora | null>(null);
  const [marca, setMarca] = useState<Record<string, 'a' | 'r' | undefined>>({});
  const cargar = () => api.ejecutora.obtener(x).then(setEj).catch(e => avisar(e.message, 'err'));
  useEffect(() => { cargar(); setMarca({}); }, [x]);
  useEffect(() => siaf().alCambiar(() => cargar()), [x]);
  if (!puede(sesion?.usuario, 'opp', 'C')) return <Card><Vacio titulo="Acceso restringido" texto="El Administrador de usuarios no le ha habilitado la opción «Módulo Presupuestal UE (aprobación OPP)»." icono="lock" /></Card>;
  const filas: { t: Target; cols: string[]; just: string }[] = [];
  const pend: string[][] = [];
  if (ej) {
    if (!mods) ej.certs.forEach(c => c.secs.forEach(s => { if (s.estado === 'ENVIADO A OPP') filas.push({ t: { k: 'cs', x, id: c.id, s: s.sec }, cols: [pad(c.num, 10), pad(s.sec, 4), s.tipo, s.doc.cod + ' ' + s.doc.num, s.fecha, c.rubro, fmt(sumI(s.items))], just: c.justif }); if (s.estado === 'PENDIENTE DE FIRMA') pend.push([pad(c.num, 10) + '-' + pad(s.sec, 4), s.tipo, fmt(sumI(s.items))]); }));
    else ej.mods.filter(m => m.tipo === 'CERT' && m.estado === 'ENVIADO A OPP').forEach(m => { const c = ej.certs.find(z => z.id === m.refId); filas.push({ t: { k: 'md', x, id: m.id }, cols: ['Nº ' + m.num, c ? pad(c.num, 10) : '', m.campo, m.antes, m.despues], just: '' }); });
  }
  const procesar = async () => {
    const ap = filas.filter(f => marca[JSON.stringify(f.t)] === 'a').map(f => f.t), re = filas.filter(f => marca[JSON.stringify(f.t)] === 'r').map(f => f.t);
    if (!ap.length && !re.length) { avisar('Marque Aprobar o Rechazar en al menos un registro.', 'err'); return; }
    if (!(await confirmar('¿Está seguro de enviar los datos?', { icono: 'gear', ok: 'Aceptar' }))) return;
    try { const r = await api.opp.procesar(x, ap, re); avisar(`Procesado: ${r.aprobados} aprobado(s), ${r.rechazados} rechazado(s).`, 'ok', mods ? 'Las modificaciones aprobadas se aplicaron al certificado.' : 'Los aprobados pasan a PENDIENTE DE FIRMA: autorícelos en el MADAF.'); setMarca({}); cargar(); } catch (e) { avisar((e as Error).message, 'err'); }
  };
  const cab = mods ? ['Modificación', 'Certificado', 'Dato', 'Dice', 'Debe decir'] : ['Certificado', 'Sec.', 'Tipo', 'Documento', 'Fecha', 'Rubro', 'Monto'];
  return <Card><Encabezado titulo={mods ? 'Aprobación de modificaciones de certificación' : 'Aprobación de solicitudes de certificación'} sub={(mods ? 'Presupuesto procesa y aprueba las modificaciones de certificados' : 'La OPP aprueba o rechaza los certificados enviados desde el Módulo de Ejecución') + ' · se muestran solo los registros de su usuario'} acciones={<Btn v="p" icon="gear" onClick={procesar}>Procesar</Btn>} />
    <div className="inl"><label>Entidad</label><select className="ctl" value={x} onChange={e => setX(e.target.value)}>{CTX_ORDER.map(c => <option key={c} value={c}>{CASOS[c].entidad.secEjec} - {CASOS[c].entidad.ueNom} (AF {CASOS[c].anio})</option>)}</select></div>
    <table className="tbl"><thead><tr><th>Aprobar</th><th>Rechazar</th>{cab.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>
      {filas.map(f => { const k = JSON.stringify(f.t); return <tr key={k}><td className="c"><input type="checkbox" checked={marca[k] === 'a'} onChange={e => setMarca({ ...marca, [k]: e.target.checked ? 'a' : undefined })} /></td><td className="c"><input type="checkbox" checked={marca[k] === 'r'} onChange={e => setMarca({ ...marca, [k]: e.target.checked ? 'r' : undefined })} /></td>{f.cols.map((c, i) => <td key={i} className={i === 6 ? 'r' : i === 0 ? 'mono' : ''}>{c}</td>)}</tr>; })}
      {!filas.length && <tr><td colSpan={cab.length + 2} className="c muted">No hay registros pendientes de aprobación (estado ENVIADO A OPP).</td></tr>}</tbody></table>
    {pend.length > 0 && <><h4>Aprobados por la OPP · pendientes de firma en el MADAF</h4><table className="tbl sm"><tbody>{pend.map(p => <tr key={p[0]}><td className="mono">{p[0]}</td><td>{p[1]}</td><td className="r">{p[2]}</td><td><Badge e="PENDIENTE DE FIRMA" /></td></tr>)}</tbody></table></>}</Card>;
}
