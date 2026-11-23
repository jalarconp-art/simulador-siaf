/* MADAF: autorización de certificaciones, compromisos anuales, devengados y giros con clave dinámica */
import { siaf } from '@/puente';
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Btn } from '../components/ui';
import { alerta } from '../components/Dialogos';
import { PantallaRequisitos } from './Dnie';
import type { Ejecutora, Estado, Target } from '@shared/types';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { docNom, fmt, hoy, hora, pad, rubroNom, sumI } from '@shared/util';

const TIPOS: Record<string, string> = { ccp: 'Autorización de Certificaciones Presupuestales', ca: 'Autorización de Compromisos Anuales', dev: 'Autorización de Devengados', gir: 'Autorización de Giros' };
interface Fila { t: Target; cols: string[]; just: string; disp?: string }
function filas(ej: Ejecutora, tipo: string, est: string): Fila[] {
  const x = ej.id, out: Fila[] = [];
  const pick = (o: { estado: Estado; aut?: string }) => est === 'por' ? o.estado === 'PENDIENTE DE FIRMA' : est === 'aut' ? o.estado === 'APROBADO' && !!o.aut : o.estado === 'RECHAZADO';
  const lbl = est === 'por' ? 'Por autorizar' : est === 'aut' ? 'Autorizado' : 'Rechazado';
  if (tipo === 'ccp') ej.certs.forEach(c => c.secs.forEach(s => { if ((s.tipo === 'INICIAL' || s.tipo === 'AMPLIACION') && pick(s)) out.push({ t: { k: 'cs', x, id: c.id, s: s.sec }, cols: [pad(c.num, 10) + '-' + pad(s.sec, 4), s.tipo, s.doc.cod + ' - ' + docNom(s.doc.cod), s.doc.num, s.doc.fecha, c.rubro + ' - ' + rubroNom(c.rubro).slice(0, 24), 'S/', fmt(sumI(s.items)), s.fecha, s.aut, lbl], just: c.justif, disp: c.disp }); }));
  if (tipo === 'ca') { ej.cas.forEach(a => { if (pick(a)) out.push({ t: { k: 'ca', x, id: a.id }, cols: [pad(a.num, 10), 'COMPROMISO ANUAL', a.doc.cod + ' - ' + docNom(a.doc.cod), a.doc.num, a.doc.fecha, a.prov.tipo + ' ' + a.prov.num, 'S/', fmt(sumI(a.items)), a.fecha, a.aut, lbl], just: a.justif }); a.mods.forEach(m => { if (m.tipo === 'AMPLIACION' && pick(m)) out.push({ t: { k: 'cam', x, id: a.id, n: m.n }, cols: [pad(a.num, 10) + '-M' + m.n, 'AMPLIACIÓN CA', m.doc.cod, m.doc.num, m.doc.fecha, a.prov.num, 'S/', fmt(sumI(m.items)), m.fecha, m.aut, lbl], just: a.justif }); }); });
    ej.mods.forEach(m => { if (m.tipo === 'CA' && pick(m)) out.push({ t: { k: 'md', x, id: m.id }, cols: ['MOD-' + m.num, 'MODIF. DOCUMENTO PROVEEDOR', '', '', m.fecha, m.despues.split('|')[1] || '', 'S/', '0.00', m.fecha, m.aut, lbl], just: m.antes + ' › ' + m.despues.split('|').join(' ') }); }); }
  if (tipo === 'dev' || tipo === 'gir') ej.exps.forEach(e => e.secs.forEach(s => { if (s.fase === (tipo === 'dev' ? 'D' : 'G') && pick(s)) out.push({ t: { k: 'es', x, id: e.id, s: s.sec }, cols: [pad(e.num, 10) + '-' + pad(s.sec, 4), tipo === 'dev' ? (s.rend ? 'DEVENGADO - RENDICIÓN' : 'DEVENGADO') : 'GIRO ' + (s.giro?.tipoGiro || ''), s.doc.cod + (s.doc.serie ? ' ' + s.doc.serie : ''), s.doc.num, s.doc.fecha, s.giro ? s.giro.benef.num : s.prov?.num || '', 'S/', fmt(sumI(s.items)), s.fecha, s.aut, lbl], just: s.notas }); }));
  return out;
}

function ClaveDinamica({ mail, cerrar, ok }: { mail: { asunto: string; cuerpo: string; codigo: string }; cerrar: () => void; ok: (c: string) => void }) {
  const [c, setC] = useState(''); const [seg, setSeg] = useState(180);
  useEffect(() => { const t = setInterval(() => setSeg(s => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  return <><div className="mailbox"><div className="mailh">Bandeja de correo (simulada) · {mail.asunto}</div><div className="mailb"><pre>{mail.cuerpo}</pre>La clave dinámica es: <span className="code">{mail.codigo}</span><br /><b>NO COMPARTAS TU CÓDIGO</b></div></div>
    <h3>Clave dinámica</h3><p className="muted">Digítela de forma manual: el sistema no permite copiar y pegar.</p>
    <input className="ctl pin" maxLength={6} autoFocus value={c} onChange={e => setC(e.target.value.replace(/\D/g, ''))} onPaste={e => e.preventDefault()} onDrop={e => e.preventDefault()} />
    <p>Tiempo restante: <b>{Math.floor(seg / 60)}:{String(seg % 60).padStart(2, '0')}</b></p>
    <div className="mact"><Btn v="g" onClick={cerrar}>Cancelar</Btn><Btn v="p" disabled={c.length !== 6 || !seg} onClick={() => { cerrar(); ok(c); }}>Aceptar</Btn></div></>;
}

export function Madaf() {
  const { avisar, abrir, ejecutoraId, ir, sesion } = useApp();
  const [dnie, setDnie] = useState<{ dni: string; nombre: string } | null>(null);
  const [tipo, setTipo] = useState('ccp'); const [x, setX] = useState(ejecutoraId); const [est, setEst] = useState('por');
  const [ej, setEj] = useState<Ejecutora | null>(null); const [selec, setSelec] = useState<Record<number, boolean>>({}); const [actual, setActual] = useState<Fila | null>(null);
  const cargar = () => api.ejecutora.obtenerPublico(x).then(setEj).catch(e => avisar(e.message, 'err'));
  useEffect(() => { api.dnie.sesion('madaf').then(setDnie); }, []);
  useEffect(() => { if (dnie) cargar(); setSelec({}); }, [x, dnie, tipo, est]);
  useEffect(() => siaf().alCambiar(() => { if (dnie) cargar(); }), [x, dnie]);
  if (!dnie) return <PantallaRequisitos app="madaf" alEntrar={() => api.dnie.sesion('madaf').then(setDnie)} />;
  const lista = ej ? filas(ej, tipo, est) : [];
  const autorizar = async (aprobar: boolean) => {
    const targets = lista.filter((_, i) => selec[i]).map(f => f.t);
    if (!targets.length) { avisar('Seleccione uno o más registros.', 'err'); return; }
    let mail;
    try { mail = await api.madaf.clave(tipo, x); } catch (e) { alerta('Usuario no autorizado', (e as Error).message); return; }
    abrir(c => <div className="java-w"><div className="jh">Confirmar</div><div className="jb"><p>¿Está seguro de <b>{aprobar ? 'AUTORIZAR' : 'RECHAZAR'}</b> los registros?</p></div><div className="mact"><Btn v="p" onClick={() => { c(); abrir(c2 => <ClaveDinamica mail={mail!} cerrar={c2} ok={async clave => { try { const n = await api.madaf.autorizar(tipo, x, targets, clave, aprobar); avisar(aprobar ? `Autorización registrada: ${n} registro(s) APROBADO(S).` : `${n} registro(s) rechazado(s).`); cargar(); } catch (e) { alerta('No se pudo autorizar', (e as Error).message); } }} />, 'conf'); }}>Sí</Btn><Btn v="g" onClick={c}>No</Btn></div></div>, 'conf');
  };
  const H: Record<string, string[]> = { ccp: ['Certificado-Sec', 'Tipo registro', 'Documento', 'Número', 'Fecha', 'Rubro'], ca: ['Compromiso', 'Tipo registro', 'Documento', 'Número', 'Fecha', 'Proveedor'], dev: ['Expediente-Sec', 'Tipo registro', 'Documento', 'Número', 'Fecha', 'Proveedor'], gir: ['Expediente-Sec', 'Tipo registro', 'Documento', 'Número', 'Fecha', 'Beneficiario'] };
  return <div className="oldapp madaf"><header className="ohd"><b>SIAF</b> · Módulo de Autorización de la Administración Financiera <span className="tb-sp" /><span className="sm">Usuario: {dnie.dni} {dnie.nombre} · {hoy()} {hora()}</span>
    <button className="btn btn-w sm" onClick={async () => { await api.dnie.salir('madaf'); setDnie(null); }}>Cerrar sesión</button><button className="btn btn-w sm" onClick={() => ir(sesion ? 'bienvenida' : 'portal')}>‹ Volver</button></header>
    <div className="olay"><aside className="otree"><div className="mgrp">▾ Registros</div>{Object.keys(TIPOS).map(k => <a key={k} className={tipo === k ? 'on' : ''} onClick={() => setTipo(k)}>{TIPOS[k]}</a>)}</aside>
      <section className="obody"><h3 className="otit">{TIPOS[tipo]}</h3>
        <fieldset className="crit"><legend>Criterios de búsqueda</legend><label>Año ejecución <select className="ctl sm" disabled><option>{CASOS[x].anio}</option></select></label><label>Entidad <select className="ctl sm" value={x} onChange={e => setX(e.target.value)}>{CTX_ORDER.map(c => <option key={c} value={c}>{CASOS[c].entidad.secEjec} {CASOS[c].entidad.ueNom}</option>)}</select></label><label>Estado <select className="ctl sm" value={est} onChange={e => setEst(e.target.value)}><option value="por">Por autorizar</option><option value="aut">Autorizados</option><option value="rech">Rechazados</option></select></label><Btn sm icon="search" onClick={cargar}>Buscar</Btn></fieldset>
        <div className="ovx"><table className="tbl sm otbl"><thead><tr><th>#</th>{H[tipo].map(h => <th key={h}>{h}</th>)}<th>Moneda</th><th className="r">Monto MN</th><th>Fecha registro</th><th>Responsable</th><th>Estado</th><th>Sel. <input type="checkbox" onChange={e => setSelec(Object.fromEntries(lista.map((_, i) => [i, e.target.checked])))} /></th></tr></thead><tbody>
          {lista.map((f, i) => <tr key={i} onClick={() => setActual(f)} className={actual === f ? 'sel' : ''}><td>{i + 1}</td>{f.cols.map((c, k) => <td key={k} className={k === 7 ? 'r' : ''}>{c}</td>)}<td className="c">{est === 'por' && <input type="checkbox" checked={!!selec[i]} onClick={e => e.stopPropagation()} onChange={e => setSelec({ ...selec, [i]: e.target.checked })} />}</td></tr>)}
          {!lista.length && <tr><td colSpan={13} className="c muted">No hay registros {est === 'por' ? 'por autorizar' : est === 'aut' ? 'autorizados' : 'rechazados'}.</td></tr>}</tbody></table></div>
        <div className="fgrid"><div className="f c12"><label>Justificación</label><div className="ctl ro">{actual?.just || ' '}</div></div>{tipo === 'ccp' && <div className="f c12"><label>Dispositivo legal</label><div className="ctl ro">{actual?.disp || ' '}</div></div>}</div>
        {est === 'por' && <div className="mact"><Btn v="ok" icon="check" onClick={() => autorizar(true)}>Autorizar</Btn><Btn v="danger" icon="x" onClick={() => autorizar(false)}>Rechazar</Btn></div>}</section></div></div>;
}
