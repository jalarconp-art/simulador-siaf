/* Pantalla de bienvenida (como el SIAF-WEB, sin emojis), tickets de soporte y administración de casos */
import { useEffect, useState } from 'react';
import { useApp, intentar } from '../store';
import { api } from '../api';
import { Topbar } from '../components/Shell';
import { Icon } from '../components/Icon';
import { Btn } from '../components/ui';
import { confirmar } from '../components/Dialogos';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { esAdmin, OPCIONES, puede, ROL_TXT } from '@shared/permisos';
import { hoy, hora } from '@shared/util';

export function Bienvenida() {
  const { sesion, ejecutoraId, ir } = useApp();
  const [reloj, setReloj] = useState(hoy() + ' ' + hora());
  useEffect(() => { const x = setInterval(() => setReloj(hoy() + ' ' + hora()), 1000); return () => clearInterval(x); }, []);
  if (!sesion) return null;
  const d = CASOS[ejecutoraId];
  const u = sesion.usuario;
  const tarjeta = (ic: string, t: string, s: string, fn: () => void) => <button className="tile wb-card" onClick={fn}><span className="wb-ic"><Icon n={ic} /></span><b>{t}</b><small>{s}</small></button>;
  const ejecucion = OPCIONES.some(o => o.k !== 'opp' && puede(u, o.k, 'C'));
  return <>
    <Topbar app="bienvenida" />
    <div className="welcome wb"><div className="wb-in">
      <div className="wcard wb-head">
        <span className="wb-av"><Icon n="user" size={46} /></span>
        <div className="wb-who"><span className="wb-k">BIENVENIDO AL SIAF</span><span className="wb-hora">{reloj}</span><h2>{u.nombres} {u.apellidos}</h2><small className="muted">{u.usuario} · {ROL_TXT[u.rol] || u.rol} · {d.entidad.secEjec} - {d.entidad.ueNom}</small></div>
        <p className="wb-txt">El SIAF constituye el medio oficial para el registro, procesamiento y generación de la información relacionada con la Administración Financiera del Sector Público. Este simulador reproduce sus pantallas para practicar.</p>
      </div>
      <div className="wb-2">
        <div><h4 className="wb-t">Ejecución Presupuestal</h4>{ejecucion ? tarjeta('print', 'EJECUCIÓN PRESUPUESTAL', 'Módulo de Ejecución', () => ir('ejecucion')) : <div className="tile wb-card dis"><b>EJECUCIÓN PRESUPUESTAL</b><small>Sin opciones habilitadas por el administrador</small></div>}</div>
        <div><h4 className="wb-t">Ticket de Soporte</h4>{tarjeta('card', 'TICKET DE SOPORTE', 'Registro y consulta de tickets', abrirTickets)}</div>
      </div>
      <h4 className="wb-t">Otros aplicativos del SIAF (simulados)</h4>
      <div className="wb-3">
        {tarjeta('gear', 'SIAF - OPERACIONES EN LÍNEA', esAdmin(u) ? 'Administrador de usuarios y Módulo Presupuestal' : 'Módulo Presupuestal: aprobación de certificaciones', () => ir('opl'))}
        {tarjeta('shield', 'AERAF', 'Acreditación de responsables de la administración financiera', () => ir('aeraf'))}
        {tarjeta('sign', 'MADAF', 'Autorización de certificados, compromisos, devengados y giros', () => ir('madaf'))}
        {esAdmin(u) && tarjeta('users', 'PANEL DEL ADMINISTRADOR', 'Avance de usuarios, calificaciones y auditoría', () => ir('docente'))}
      </div>
      <p className="wb-pie">En el sistema real el AERAF y el MADAF son aplicativos aparte que piden lector de DNIe y PIN del RENIEC. Aquí se simula el DNIe con el número de DNI y un PIN de 6 dígitos (123456).</p>
    </div></div>
  </>;
}

/* ---------- Tickets de soporte (como el panel lateral del SIAF-WEB) ---------- */
export function abrirTickets(): void { useApp.getState().abrir(c => <Tickets cerrar={c} />, 'ancho'); }
function Tickets({ cerrar }: { cerrar: () => void }) {
  const { sesion, ej, ejecutoraId, avisar, recargar } = useApp();
  const u = sesion!.usuario; const ent = CASOS[ejecutoraId].entidad;
  const [d, setD] = useState({ cargo: '', dni: u.dni !== '00000000' ? u.dni : '', telefono: '', anexo: '', celular: '', correo: u.email, asunto: '', detalle: '' });
  const [vista, setVista] = useState<'nuevo' | 'lista'>('nuevo');
  const tickets = (ej?.aux || []).filter(a => a.tipo === 'ticket').sort((a, b) => b.num - a.num);
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  const registrar = async () => {
    try {
      const r = await api.aux.grabar({ ejecutora: ejecutoraId, tipo: 'ticket', datos: d });
      await api.aux.enviar(ejecutoraId, 'ticket', r.id); await recargar();
      avisar('Ticket Nº ' + String(r.num).padStart(6, '0') + ' registrado.', 'ok', 'La mesa de ayuda (simulada) lo atenderá.');
      setD({ ...d, asunto: '', detalle: '' }); setVista('lista');
    } catch (e) { avisar((e as Error).message, 'err'); }
  };
  const campo = (l: string, k: keyof typeof d, c = 6, area = false) => <div className={'f c' + c}><label>{l}</label>{area ? <textarea className="ctl" rows={3} value={d[k]} onChange={e => set(k)(e.target.value)} /> : <input className="ctl" value={d[k]} onChange={e => set(k)(e.target.value)} />}</div>;
  return <div className="tk">
    <div className="gh"><b>Tickets de soporte</b><button className="btn-ic" onClick={cerrar}><Icon n="x" /></button></div>
    <div className="tabs"><a className={vista === 'nuevo' ? 'on' : ''} onClick={() => setVista('nuevo')}>Registrar ticket</a><a className={vista === 'lista' ? 'on' : ''} onClick={() => setVista('lista')}>Consultar tickets ({tickets.length})</a></div>
    {vista === 'nuevo' ? <>
      <h4>INFORMACIÓN DEL USUARIO</h4>
      <div className="fgrid">
        <div className="f c12"><label>Unidad Ejecutora</label><div className="ctl ro">{ent.secEjec} - {ent.ueNom}</div></div>
        <div className="f c6"><label>Apellidos</label><div className="ctl ro">{u.apellidos}</div></div><div className="f c6"><label>Nombres</label><div className="ctl ro">{u.nombres}</div></div>
        {campo('Cargo', 'cargo', 8)}{campo('Número DNI', 'dni', 4)}{campo('Teléfono fijo', 'telefono', 4)}{campo('Anexo (opcional)', 'anexo', 2)}{campo('Celular (opcional)', 'celular', 6)}{campo('Correo', 'correo', 12)}
      </div>
      <h4>INFORMACIÓN DEL TICKET</h4>
      <div className="fgrid">{campo('Asunto', 'asunto', 12)}{campo('Detalle', 'detalle', 12, true)}</div>
      <div className="mact"><button className="btn btn-g" onClick={cerrar}>Cancelar</button><button className="btn btn-p" onClick={registrar}><Icon n="send" /> Registrar ticket</button></div>
    </> : <table className="tbl"><thead><tr><th>Nº Ticket</th><th>Fecha</th><th>Asunto</th><th>Estado</th></tr></thead><tbody>
      {tickets.map(x => <tr key={x.id}><td className="mono">{String(x.num).padStart(6, '0')}</td><td>{x.fecha}</td><td>{x.datos.asunto}</td><td>{x.estado === 'APROBADO' ? 'REGISTRADO' : x.estado}</td></tr>)}
      {!tickets.length && <tr><td colSpan={4} className="c muted">No ha registrado tickets.</td></tr>}</tbody></table>}
  </div>;
}

export function Casos() {
  const { sesion, ejecutoraId, setEjecutora, ir } = useApp();
  const [res, setRes] = useState<{ id: string; modo: string; registros: number }[]>([]);
  const cargar = () => api.ejecutora.resumen().then(setRes).catch(() => undefined);
  useEffect(() => { cargar(); }, []);
  return <><Topbar app="casos" />
    <section className="lhero sm"><h1>Administración del caso práctico</h1><p>Estos datos pertenecen solo a su usuario ({sesion?.usuario.usuario}).</p></section>
    <section className="cgrid">{CTX_ORDER.map(id => {
      const d = CASOS[id]; const r = res.find(x => x.id === id);
      return <div key={id} className={'ccard' + (ejecutoraId === id ? ' on' : '')}>
        <div className="cg">{d.grupo}</div><h3>{d.titulo}</h3><p className="muted">{d.entidad.secEjec} - {d.entidad.pliegoNom} · AF {d.anio}</p>
        <div className="cst"><small>{r?.registros ?? 0} registros</small></div>
        <div className="cbtn">
          <Btn v="p" onClick={async () => { if (await confirmar('¿Cargar el caso resuelto de ' + d.corto + '?', { icono: 'warn', ok: 'Cargar' })) { await intentar(() => api.ejecutora.solucion(id), 'Caso cargado: ' + d.corto); cargar(); } }}>Cargar caso</Btn>
          <Btn v="g" onClick={async () => { await setEjecutora(id); ir('ejecucion'); }}>Ir al módulo ›</Btn>
        </div></div>;
    })}</section></>;
}
