/* Pantalla de bienvenida y administración de casos */
import { useEffect, useState } from 'react';
import { useApp, intentar } from '../store';
import { api } from '../api';
import { Topbar } from '../components/Shell';
import { Icon } from '../components/Icon';
import { Btn } from '../components/ui';
import { confirmar } from '../components/Dialogos';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { esAdmin, OPCIONES, puede } from '@shared/permisos';

export function Bienvenida() {
  const { sesion, ejecutoraId, setEjecutora, ir, ej } = useApp();
  if (!sesion) return null;
  const d = CASOS[ejecutoraId];
  const tile = (ic: string, t: string, s: string, fn: () => void) => <div className="tile big" onClick={fn}><div className="tic"><Icon n={ic} /></div><b>{t}</b><small>{s}</small></div>;
  return <>
    <Topbar app="bienvenida" />
    <div className="welcome"><div className="wcard">
      <span className="w-k">Bienvenido(a)</span><h2>{sesion.usuario.nombres} {sesion.usuario.apellidos}</h2>
      <div className="w-meta">
        <div><small>Fecha y hora de acceso</small><b>{sesion.inicio}</b></div>
        <div><small>Unidad ejecutora</small><select className="ctl" value={ejecutoraId} onChange={e => setEjecutora(e.target.value)}>{CTX_ORDER.map(x => <option key={x} value={x}>{CASOS[x].entidad.secEjec} - {CASOS[x].entidad.ueNom}</option>)}</select></div>
        <div><small>Año fiscal</small><b>{d.anio}</b></div>
      </div>
      <div className="wtiles">
        {OPCIONES.some(o => o.k !== 'opp' && puede(sesion.usuario, o.k, 'C')) && tile('grid', 'Ejecucion Presupuestal', 'Certificación · Compromiso Anual · Registro SIAF · Consultas · Reportes', () => ir('ejecucion'))}
        {tile('gear', 'SIAF Operaciones en Línea', esAdmin(sesion.usuario) ? 'Administrador de usuarios y aprobaciones de presupuesto' : 'Aprobación de certificaciones y modificaciones', () => ir('opl'))}
        {tile('sign', 'MADAF', 'Autorizaciones con DNIe', () => ir('madaf'))}
        {tile('card', 'AERAF', 'Acreditación de responsables', () => ir('aeraf'))}
        {esAdmin(sesion.usuario) && tile('users', 'Panel del administrador', 'Avance de usuarios, calificaciones y auditoría', () => ir('docente'))}
      </div></div></div>
  </>;
}

export function Casos() {
  const { sesion, ejecutoraId, setEjecutora, ir } = useApp();
  const [res, setRes] = useState<{ id: string; modo: string; registros: number }[]>([]);
  const cargar = () => api.ejecutora.resumen().then(setRes).catch(() => undefined);
  useEffect(() => { cargar(); }, []);
  return <><Topbar app="casos" />
    <section className="lhero sm"><h1>Administración del caso práctico</h1><p>Estos datos pertenecen solo a su usuario ({sesion?.usuario.usuario}); los demás trabajadores tienen su propia copia. <b>Cargar caso resuelto</b> registra todas las fases del expediente, aprobadas y con sus asientos contables. <b>Practicar desde cero</b> deja la ejecutora vacía para registrar cada fase; luego <i>Verificar mi registro</i> compara su trabajo con la solución.</p></section>
    <section className="cgrid">{CTX_ORDER.map(id => {
      const d = CASOS[id]; const r = res.find(x => x.id === id);
      return <div key={id} className={'ccard' + (ejecutoraId === id ? ' on' : '')}>
        <div className="cg">{d.grupo}</div><h3>{d.titulo}</h3><p className="muted">{d.entidad.secEjec} - {d.entidad.pliegoNom} · AF {d.anio}</p>
        <ul>{d.subcasos.map(s => <li key={s.id}>{s.titulo}</li>)}</ul>
        <div className="cst"><span className={'mode m-' + (r?.modo || 'vacio')}>{{ solucion: 'Solución cargada', practica: 'En práctica', vacio: 'Sin datos' }[r?.modo || 'vacio']}</span><small>{r?.registros ?? 0} registros</small></div>
        <div className="cbtn">
          <Btn v="p" onClick={async () => { if (await confirmar('¿Cargar el caso resuelto de ' + d.corto + '?', { icono: 'warn', ok: 'Cargar', detalle: 'Se reemplazan los registros de su usuario. Los demás usuarios no se ven afectados.' })) { await intentar(() => api.ejecutora.solucion(id), 'Caso resuelto cargado: ' + d.corto); cargar(); } }}>Cargar caso resuelto</Btn>
          <Btn onClick={async () => { if (await confirmar('¿Practicar desde cero en ' + d.corto + '?', { icono: 'edit', ok: 'Iniciar', detalle: 'Se borran los registros actuales de esta ejecutora.' })) { await intentar(() => api.ejecutora.practicar(id), 'Ejecutora lista para practicar'); cargar(); } }}>Practicar desde cero</Btn>
          <Btn v="g" onClick={async () => { await setEjecutora(id); ir('ejecucion'); }}>Ir al módulo ›</Btn>
        </div></div>;
    })}</section></>;
}
