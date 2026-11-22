/* Acceso con DNI electrónico (AERAF y MADAF): advertencia de Java, PIN y pantalla de requisitos */
import { useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Btn } from '../components/ui';
import { Icon } from '../components/Icon';

function DialogoJava({ app, cerrar, ok }: { app: string; cerrar: () => void; ok: () => void }) {
  const [acepto, setAcepto] = useState(false);
  return <div className="java-w"><div className="jh">Advertencia de seguridad</div><div className="jb"><p><b>¿Desea ejecutar esta aplicación?</b></p>
    <table className="tbl kv sm"><tbody><tr><td>Nombre</td><td>SIAF - {app.toUpperCase()}</td></tr><tr><td>Publicador</td><td>Ministerio de Economía y Finanzas (simulado)</td></tr><tr><td>Ubicación</td><td>Aplicación de escritorio</td></tr></tbody></table>
    <label className="chk"><input type="checkbox" checked={acepto} onChange={e => setAcepto(e.target.checked)} /> Acepto los riesgos y deseo ejecutar esta aplicación.</label>
    <p className="muted sm">Es posible que Java solicite una actualización: para que el módulo funcione correctamente no debe actualizarlo.</p></div>
    <div className="mact"><Btn v="p" disabled={!acepto} onClick={() => { cerrar(); ok(); }}>Ejecutar</Btn><Btn v="g" onClick={cerrar}>Cancelar</Btn></div></div>;
}
function DialogoPIN({ app, dnis, cerrar, ok }: { app: 'madaf' | 'aeraf'; dnis: { dni: string; nombre: string }[]; cerrar: () => void; ok: () => void }) {
  const [dni, setDni] = useState(dnis[0]?.dni || ''); const [pin, setPin] = useState(''); const [err, setErr] = useState(''); const [bloq, setBloq] = useState(false);
  const entrar = async () => { try { await api.dnie.ingresar(app, dni, pin); cerrar(); ok(); } catch (e) { const m = (e as Error).message; setErr(m); setPin(''); if (/bloqueado/i.test(m)) setBloq(true); } };
  return <><div className="cicon"><Icon n="card" size={24} /></div><h3>Lector de DNI electrónico</h3><p className="muted">Tarjeta detectada. Digite el código PIN (contraseña personal de seis dígitos) registrado al tramitar el DNI electrónico.</p>
    <div className="f"><label>DNIe</label><select className="ctl" value={dni} onChange={e => setDni(e.target.value)}>{dnis.map(d => <option key={d.dni} value={d.dni}>{d.dni} - {d.nombre}</option>)}</select></div>
    <div className="f"><label>PIN</label><input className="ctl pin" type="password" maxLength={6} autoFocus value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && entrar()} /></div>
    <small className="err">{err}</small><p className="muted sm">PIN de prueba: 123456 · máximo tres intentos.</p>
    <div className="mact">{bloq && <Btn onClick={async () => { await api.dnie.reiniciarPin(); setBloq(false); setErr('PIN restablecido (simulación del RENIEC).'); }}>Simular cambio de PIN en RENIEC</Btn>}<Btn v="g" onClick={cerrar}>Cancelar</Btn><Btn v="p" onClick={entrar}>Aceptar</Btn></div></>;
}
export async function ingresarDNIe(app: 'madaf' | 'aeraf', alEntrar: () => void): Promise<void> {
  const st = useApp.getState();
  const dnis = await api.dnie.disponibles(app);
  if (!dnis.length) { st.avisar('No hay responsables acreditados en el AERAF.', 'err'); return; }
  st.abrir(c => <DialogoJava app={app} cerrar={c} ok={() => st.abrir(c2 => <DialogoPIN app={app} dnis={dnis} cerrar={c2} ok={alEntrar} />, 'conf')} />, 'conf');
}
export function PantallaRequisitos({ app, alEntrar }: { app: 'madaf' | 'aeraf'; alEntrar: () => void }) {
  const { ir, sesion } = useApp();
  const t = app === 'aeraf'
    ? ['SIAF - Acreditación Electrónica de Responsables de la Administración Financiera (AERAF)', 'Permite a los Titulares de Pliego, sus Delegados y el DGA acreditar a los responsables que autorizan la certificación, el compromiso anual, los devengados y los girados.', ['El Documento Nacional de Identidad Electrónico (DNIe) y la clave PIN del RENIEC.', 'El lector de DNI electrónico (Smart Card).', 'El certificado digital vigente en RENIEC.', 'Java 8 instalado y configurado.', 'Titulares de GR y GL acreditados en el JNE (GN: registrados en el AIRHSP).', 'Un correo electrónico.']]
    : ['SIAF - Módulo de Autorización de la Administración Financiera (MADAF)', 'Permite a los responsables acreditados en el AERAF realizar la firma electrónica de certificados, compromisos anuales, devengados y giros.', ['Contar con el DNIe y la clave PIN del RENIEC.', 'Java 8 instalado y configurado en el equipo.', 'El lector de DNI electrónico (Smart Card).']];
  return <div className={'gate ' + app}><header className="ghd"><b>SIAF</b> <span>{app.toUpperCase()}</span><span className="tb-sp" /><button className="btn btn-w sm" onClick={() => ir(sesion ? 'bienvenida' : 'portal')}>‹ Volver</button></header>
    <div className="gbody"><div className="gcard"><h2>{t[0] as string}</h2><p>{t[1] as string}</p><h4>Requisitos</h4><ul>{(t[2] as string[]).map(x => <li key={x}>{x}</li>)}</ul>
      <div className="mact"><button className="btn btn-p big" onClick={() => ingresarDNIe(app, alEntrar)}>Ingresar</button></div></div></div></div>;
}
