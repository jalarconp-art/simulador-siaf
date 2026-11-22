/* Portal de acceso: inicio de sesión (usuario o correo) y registro de cuenta con correo electrónico */
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { hoy, hora } from '@shared/util';
import type { Sesion } from '@shared/types';

export function Portal() {
  const { ir, setSesion, sesion } = useApp();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [u, setU] = useState('');
  const [c, setC] = useState('');
  const [r, setR] = useState({ apellidos: '', nombres: '', dni: '', email: '', clave: '', clave2: '' });
  const [err, setErr] = useState('');
  const [google, setGoogle] = useState(false);
  const [esperando, setEsperando] = useState(false);
  useEffect(() => { window.siaf.invoke('google.disponible').then(r => setGoogle(!!(r.ok && r.data))); }, []);
  const conGoogle = async () => {
    setErr(''); setEsperando(true);
    try { const r = await window.siaf.google(); if (r.ok && r.data) { setSesion(r.data as Sesion); ir('bienvenida'); } else if (!r.ok) setErr(r.error || 'No se pudo iniciar sesión con Google.'); }
    finally { setEsperando(false); }
  };
  const botonGoogle = <><div className="lg-sep">o</div><button className="btn btn-google" disabled={esperando} onClick={conGoogle}><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>{esperando ? 'Esperando a Google...' : 'Continuar con Google'}</button></>;
  const [reloj, setReloj] = useState(hoy() + ' · ' + hora());
  useEffect(() => { const t = setInterval(() => setReloj(hoy() + ' · ' + hora()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => setErr(''), [modo]);
  const entrar = async () => {
    setErr('');
    if (!u.trim() || !c) { setErr('Ingrese su usuario o correo y su contraseña.'); return; }
    try { const s = await api.login(u, c); setSesion(s); ir('bienvenida'); } catch (e) { setErr((e as Error).message); }
  };
  const registrar = async () => {
    setErr('');
    if (r.clave !== r.clave2) { setErr('Las contraseñas no coinciden.'); return; }
    try { const s = await api.registrar({ apellidos: r.apellidos, nombres: r.nombres, dni: r.dni, email: r.email, clave: r.clave }); setSesion(s); ir('bienvenida'); } catch (e) { setErr((e as Error).message); }
  };
  const conSesion = (fn: () => void) => () => { if (sesion) fn(); else { setModo('login'); setErr('Inicie sesión: cada usuario trabaja en su propio espacio.'); } };
  const acc = (ic: string, t: string, s: string, fn: () => void) => <button className="acc" onClick={fn}><span className="acc-i"><Icon n={ic} /></span><span className="acc-t"><b>{t}</b><small>{s}</small></span><span className="acc-a">›</span></button>;
  const campo = (label: string, k: keyof typeof r, tipo = 'text', extra: Record<string, unknown> = {}) =>
    <div className="f"><label>{label}</label><input className="ctl lg" type={tipo} value={r[k]} onChange={e => setR({ ...r, [k]: e.target.value })} {...extra} /></div>;
  return <div className="portal">
    <section className="pt-brand">
      <div className="pt-top"><span className="pt-logo-w"><Logo tam={34} /></span><span className="pt-sub">Plataforma SIAF-SP</span></div>
      <div className="pt-mid"><h1>Sistema Integrado de Administración Financiera del Sector Público</h1><p>Módulo de Ejecución Presupuestal · Plataforma SIAF-WEB</p>
        <ul className="pt-feat"><li>Caso Práctico 1: obra P.S. Aymaña, CUI 2308220</li><li>Certificación, compromiso anual, compromiso mensual, devengado y girado</li><li>Aprobación OPP y firma de responsables en el MADAF</li><li>Cada trabajador con su propio usuario y su propia información</li></ul></div>
      <div className="pt-foot"><span>{reloj}</span><span>Entorno de práctica académica · datos almacenados en este equipo</span></div>
    </section>
    <section className="pt-main">
      <div className="lg-card">
        {sesion ? <><h2>Sesión activa</h2><div className="lg-ses"><span className="lg-av">{sesion.usuario.nombres[0]}</span><div><b>{sesion.usuario.apellidos} {sesion.usuario.nombres}</b><small>{sesion.usuario.usuario} · {sesion.usuario.email}</small></div></div><button className="btn btn-p big w100p" onClick={() => ir('bienvenida')}>Continuar</button></>
          : <>
            <div className="lg-tabs"><a className={modo === 'login' ? 'on' : ''} onClick={() => setModo('login')}>Iniciar sesión</a><a className={modo === 'registro' ? 'on' : ''} onClick={() => setModo('registro')}>Crear cuenta</a></div>
            {modo === 'login' ? <>
              <p className="muted">Ingrese con su código de usuario o con su correo electrónico.</p>
              <div className="f"><label>Usuario o correo electrónico</label><input className="ctl lg" value={u} onChange={e => setU(e.target.value)} autoFocus placeholder="RU20261 o nombre@correo.com" /></div>
              <div className="f"><label>Contraseña</label><input className="ctl lg" type="password" value={c} onChange={e => setC(e.target.value)} onKeyDown={e => e.key === 'Enter' && entrar()} /></div>
              <small className="err">{err}</small>
              <button className="btn btn-p big w100p" onClick={entrar}>Ingresar</button>
              {google && botonGoogle}
              <p className="lg-help">¿No tiene cuenta? <a onClick={() => setModo('registro')}>Regístrese con su correo electrónico</a>. Su información se guarda en su propio espacio y no se mezcla con la de otros usuarios.</p>
            </> : <>
              <p className="muted">Registre su cuenta de operador. Recibirá un espacio propio con el Caso Práctico 1 cargado.</p>
              <div className="two-f">{campo('Apellidos', 'apellidos')}{campo('Nombres', 'nombres')}</div>
              <div className="two-f">{campo('DNI', 'dni', 'text', { maxLength: 8, inputMode: 'numeric' })}{campo('Correo electrónico', 'email', 'email')}</div>
              <div className="two-f">{campo('Contraseña', 'clave', 'password')}{campo('Repetir contraseña', 'clave2', 'password', { onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && registrar() })}</div>
              <small className="hint">Mínimo 8 caracteres, con letras y números.</small><br />
              <small className="err">{err}</small>
              <button className="btn btn-p big w100p" onClick={registrar}>Crear cuenta e ingresar</button>
              {google && botonGoogle}
            </>}
          </>}
      </div>
      <div className="acc-list"><h4>Otros aplicativos</h4>
        {acc('gear', 'SIAF Operaciones en Línea', 'Aprobación de certificaciones (requiere sesión)', conSesion(() => ir('opl')))}
        {acc('card', 'AERAF', 'Acreditación de responsables de la administración financiera (DNIe)', conSesion(() => ir('aeraf')))}
        {acc('sign', 'MADAF', 'Autorización de certificaciones, compromisos, devengados y giros (DNIe)', conSesion(() => ir('madaf')))}
      </div>
    </section>
  </div>;
}
