/* Portal de la Plataforma SIAF-SP (simulador): portada con los componentes del sistema integrado y,
   al elegir SIAF, la pantalla de inicio de sesión. Reproduce el recorrido real para familiarizarse con él;
   no usa el escudo ni el logotipo del Ministerio y siempre se identifica como simulador académico. */
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import type { Sesion } from '@shared/types';

interface Componente { sigla: string; nombre: string; abre?: 'siaf' | 'ticket'; tenue?: boolean }
const GRUPOS: { titulo: string; items: Componente[] }[] = [
  { titulo: 'PLANILLA ÚNICA DE PAGO DEL SECTOR PÚBLICO', items: [
    { sigla: 'SRTM', nombre: 'Sistema de Recaudación Tributaria Municipal - SRTM', tenue: true },
    { sigla: 'DGGFRH', nombre: 'Aplicativo de la Dirección General de Gestión Fiscal de Recursos Humanos' }] },
  { titulo: 'SIAF / SIAF RP', items: [
    { sigla: 'SIAF', nombre: 'Sistema Integrado de Administración Financiera', abre: 'siaf' },
    { sigla: 'PMBSO', nombre: 'Programación Multianual de Bienes, Servicios y Obras.' },
    { sigla: 'SIAFMIB', nombre: 'Sistema Bancario de las Entidades del Sector Público' },
    { sigla: 'SIAFCUT', nombre: 'Sistema de Endeudamiento y Tesoro Público' },
    { sigla: 'MIF', nombre: 'Módulo de Instrumentos Financieros' }] },
  { titulo: 'OTROS', items: [
    { sigla: 'ADS', nombre: 'Aplicativo para la Depuración y Sinceramiento Contable' },
    { sigla: 'HOGI', nombre: 'Herramienta Orientada a la Gestión de la Información' }] },
  { titulo: 'Ticket de Soporte', items: [{ sigla: 'TICKET', nombre: 'Registro y seguimiento de tickets de soporte', abre: 'ticket' }] }
];
const DIAPOSITIVAS = [
  ['Bienvenido a la Plataforma SIAF-SP', 'Entorno de práctica para el registro de la ejecución presupuestal.'],
  ['Caso Práctico 1: obra P.S. Aymaña', 'Certificación, compromiso anual, compromiso mensual, devengado y girado (CUI 2308220).'],
  ['Cada usuario con su propio espacio', 'Registre, envíe, apruebe en la OPP y firme en el MADAF sin afectar a sus compañeros.']
];

export function Portal() {
  const { sesion, ir } = useApp();
  const [vista, setVista] = useState<'portada' | 'login'>('portada');
  const abrirSiaf = () => { if (sesion) ir('bienvenida'); else setVista('login'); };
  return vista === 'login' ? <Acceso volver={() => setVista('portada')} /> : <Portada abrirSiaf={abrirSiaf} />;
}

function Portada({ abrirSiaf }: { abrirSiaf: () => void }) {
  const { avisar, abrir } = useApp();
  const [q, setQ] = useState(''); const [d, setD] = useState(0);
  useEffect(() => { const t = setInterval(() => setD(x => (x + 1) % DIAPOSITIVAS.length), 7000); return () => clearInterval(t); }, []);
  const grupos = useMemo(() => GRUPOS.map(g => ({ ...g, items: g.items.filter(i => !q || (i.sigla + ' ' + i.nombre).toUpperCase().includes(q.toUpperCase())) })).filter(g => g.items.length), [q]);
  const info = (t: string, texto: string) => abrir(c => <><h3>{t}</h3><p>{texto}</p><div className="mact"><button className="btn btn-p" onClick={c}>Aceptar</button></div></>, 'conf');
  const elegir = (i: Componente) => {
    if (i.abre === 'siaf') abrirSiaf();
    else if (i.abre === 'ticket') info('Ticket de Soporte', 'En la plataforma real aquí se registran los tickets para la mesa de ayuda. En el simulador, consulte a su docente o al administrador de usuarios.');
    else avisar(`${i.sigla}: este aplicativo no forma parte del simulador. Ingrese a SIAF para practicar.`, 'info');
  };
  return <div className="sp">
    <header className="sp-hero">
      <div className="sp-wrap">
        <div className="sp-bar">
          <span className="sp-marca"><Logo tam={34} color="#0090c2" simulador={false} plataforma /></span>
          <span className="sp-sim">SIMULADOR ACADÉMICO<small>Plataforma SIAF-SP · uso educativo</small></span>
        </div>
        <nav className="sp-nav">
          <a onClick={() => setD(0)}>Inicio</a>
          <a onClick={() => info('Nosotros', 'Simulador académico de la Plataforma SIAF-SP elaborado para que estudiantes y trabajadores se familiaricen con el registro de la ejecución presupuestal antes de usar el sistema real. No está afiliado al Ministerio de Economía y Finanzas.')}>Nosotros</a>
          <a onClick={() => info('Servicios', 'SIAF (Módulo de Ejecución, Operaciones en Línea, AERAF y MADAF) con el Caso Práctico 1, verificación automática de registros, reportes y auditoría.')}>Servicios</a>
          <a onClick={() => info('Comunicados', 'Recuerde: cada usuario trabaja en su propio espacio. Use «Practicar desde cero» para registrar todas las fases del Caso Práctico 1 y luego «Verificar mi registro».')}>Comunicados</a>
        </nav>
        <div className="sp-slide"><h1>{DIAPOSITIVAS[d][0]}</h1><p>{DIAPOSITIVAS[d][1]}</p></div>
        <div className="sp-flechas"><button aria-label="Anterior" onClick={() => setD((d + DIAPOSITIVAS.length - 1) % DIAPOSITIVAS.length)}><Icon n="back" /></button><button aria-label="Siguiente" onClick={() => setD((d + 1) % DIAPOSITIVAS.length)}><Icon n="right" /></button></div>
      </div>
    </header>
    <section className="sp-comp">
      <h2 className="sp-tit">Componentes del sistema integrado</h2>
      <label className="sp-buscar"><Icon n="search" /><input placeholder="¿ Que Aplicativo está buscando ?" value={q} onChange={e => setQ(e.target.value)} /></label>
    </section>
    <section className="sp-grupos"><div className="sp-wrap">
      {grupos.map(g => <div key={g.titulo} className="sp-grupo"><h3>{g.titulo}</h3><div className="sp-cards">
        {g.items.map(i => <button key={i.sigla} className={'sp-card' + (i.tenue ? ' tenue' : '') + (i.abre ? ' activa' : '')} onClick={() => elegir(i)} title={i.abre === 'siaf' ? 'Ingresar al SIAF' : i.nombre}>
          <span className="sp-card-h"><b>{i.sigla === 'TICKET' ? 'TICKET' : i.sigla}</b><span className="sp-ext"><Icon n="ext" /></span></span><small>{i.nombre}</small></button>)}
      </div></div>)}
      {!grupos.length && <p className="muted c">No se encontró el aplicativo «{q}».</p>}
    </div></section>
    <footer className="sp-pie">Simulador académico de la Plataforma SIAF-SP · No es el sitio oficial del Ministerio de Economía y Finanzas</footer>
  </div>;
}

function Acceso({ volver }: { volver: () => void }) {
  const { ir, setSesion, abrir } = useApp();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [u, setU] = useState(''); const [c, setC] = useState('');
  const [r, setR] = useState({ apellidos: '', nombres: '', dni: '', email: '', clave: '', clave2: '' });
  const [err, setErr] = useState(''); const [ocupado, setOcupado] = useState(false);
  const [google, setGoogle] = useState(false);
  useEffect(() => { window.siaf.invoke('google.disponible').then(x => setGoogle(!!(x.ok && x.data))); }, []);
  useEffect(() => setErr(''), [modo]);
  const ok = (s: Sesion) => { setSesion(s); ir('bienvenida'); };
  const entrar = async () => {
    setErr('');
    if (!u.trim() || !c) { setErr('Ingrese su usuario o email y su contraseña.'); return; }
    setOcupado(true); try { ok(await api.login(u, c)); } catch (e) { setErr((e as Error).message); } finally { setOcupado(false); }
  };
  const registrar = async () => {
    setErr('');
    if (r.clave !== r.clave2) { setErr('Las contraseñas no coinciden.'); return; }
    setOcupado(true); try { ok(await api.registrar({ apellidos: r.apellidos, nombres: r.nombres, dni: r.dni, email: r.email, clave: r.clave })); } catch (e) { setErr((e as Error).message); } finally { setOcupado(false); }
  };
  const conGoogle = async () => {
    setErr(''); setOcupado(true);
    try { const x = await window.siaf.google(); if (x.ok && x.data) ok(x.data as Sesion); else if (!x.ok) setErr(x.error || 'No se pudo iniciar sesión con Google.'); } finally { setOcupado(false); }
  };
  const campo = (label: string, k: keyof typeof r, tipo = 'text', extra: Record<string, unknown> = {}) =>
    <div className="f"><label>{label}</label><input className="ctl lg" type={tipo} value={r[k]} onChange={e => setR({ ...r, [k]: e.target.value })} {...extra} /></div>;
  const mesa = () => abrir(x => <><h3>Mesa de ayuda</h3><p>Este es un simulador académico. Si olvidó su contraseña o necesita otro perfil, comuníquese con el Administrador de usuarios de su grupo (usuario ADMIN).</p><div className="mact"><button className="btn btn-p" onClick={x}>Aceptar</button></div></>, 'conf');
  return <div className="sl">
    <aside className="sl-izq">
      <span className="sl-sim">SIMULADOR ACADÉMICO</span>
      <div className="sl-centro">
        <h2>Bienvenidos al aplicativo</h2>
        <Logo tam={64} plataforma simulador={false} />
        <p>Para acceder al Sistema Usted deberá ingresar su usuario o email, la contraseña y presionar el botón de iniciar sesión.</p>
      </div>
      <a className="sl-mesa" onClick={mesa}><Icon n="phone" /> Mesa de ayuda</a>
    </aside>
    <main className="sl-der">
      <div className="lg-card sl-form">
        {modo === 'login' ? <>
          <h2 className="sl-tit">Inicio de Sesión</h2>
          <div className="f"><label>Usuario o email</label><input className="ctl lg" value={u} onChange={e => setU(e.target.value)} autoFocus /></div>
          <div className="f"><label>Contraseña</label><input className="ctl lg" type="password" value={c} onChange={e => setC(e.target.value)} onKeyDown={e => e.key === 'Enter' && entrar()} /></div>
          <small className="err">{err}</small>
          <button className="btn sl-btn" disabled={ocupado} onClick={entrar}>{ocupado ? 'Ingresando...' : 'Iniciar sesión'}</button>
          {google && <><div className="lg-sep">o</div><button className="btn btn-google" disabled={ocupado} onClick={conGoogle}><GoogleG />Continuar con Google</button></>}
          <p className="sl-alt"><a onClick={() => setModo('registro')}>Crear una cuenta</a> · <a onClick={volver}>Volver a la Plataforma SIAF-SP</a></p>
        </> : <>
          <h2 className="sl-tit">Crear cuenta</h2>
          <p className="muted">Recibirá un espacio propio con el Caso Práctico 1 cargado. El administrador le asignará su perfil.</p>
          <div className="two-f">{campo('Apellidos', 'apellidos')}{campo('Nombres', 'nombres')}</div>
          <div className="two-f">{campo('DNI', 'dni', 'text', { maxLength: 8, inputMode: 'numeric' })}{campo('Email', 'email', 'email')}</div>
          <div className="two-f">{campo('Contraseña', 'clave', 'password')}{campo('Repetir contraseña', 'clave2', 'password', { onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && registrar() })}</div>
          <small className="hint">Mínimo 8 caracteres, con letras y números.</small><br />
          <small className="err">{err}</small>
          <button className="btn sl-btn" disabled={ocupado} onClick={registrar}>Crear cuenta e ingresar</button>
          {google && <><div className="lg-sep">o</div><button className="btn btn-google" disabled={ocupado} onClick={conGoogle}><GoogleG />Registrarse con Google</button></>}
          <p className="sl-alt"><a onClick={() => setModo('login')}>Ya tengo cuenta</a> · <a onClick={volver}>Volver a la Plataforma SIAF-SP</a></p>
        </>}
      </div>
      <footer className="sl-pie">Simulador académico SIAF-SP · Gabinete de Contabilidad y Gestión Pública · No es el sistema oficial del MEF</footer>
    </main>
  </div>;
}

const GoogleG = () => <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" /><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z" /></svg>;
