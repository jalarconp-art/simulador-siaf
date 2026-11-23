/* SIAF Operaciones en Línea › Administrador de usuarios: perfiles SIAF, opciones con Consulta/Operación,
   estado de la cuenta y configuración del acceso con Google. */
import { siaf } from '@/puente';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista, Nota, Vacio } from '../components/ui';
import { confirmar } from '../components/Dialogos';
import { Icon } from '../components/Icon';
import type { Nivel, Opcion, Permisos, Rol, Usuario } from '@shared/types';
import { OPCIONES, permisosDeRol, ROL_TXT, ROLES } from '@shared/permisos';

const WEB = () => siaf().plataforma === 'web';

export function Usuarios() {
  const { sesion, avisar, abrir } = useApp();
  const [lista, setLista] = useState<Usuario[]>([]); const [err, setErr] = useState('');
  const [selId, setSelId] = useState(''); const [q, setQ] = useState('');
  const [nuevo, setNuevo] = useState(false);
  const [d, setD] = useState({ dni: '', apellidos: '', nombres: '', email: '', rol: 'OPERADOR' });
  const cargar = () => api.usuarios.listar().then(l => { setLista(l); setErr(''); }).catch(e => setErr(e.message));
  useEffect(() => { cargar(); }, []);
  const sel = lista.find(u => u.id === selId) || null;
  const filtrada = useMemo(() => lista.filter(u => !q || (u.usuario + ' ' + u.apellidos + ' ' + u.nombres + ' ' + u.email + ' ' + u.rol).toUpperCase().includes(q.toUpperCase())), [lista, q]);
  const crear = async () => {
    try {
      const r = await api.usuarios.crear({ ...d, rol: d.rol as Rol });
      setNuevo(false); setD({ dni: '', apellidos: '', nombres: '', email: '', rol: 'OPERADOR' }); await cargar(); setSelId(r.usuario.id);
      abrir(c => <><div className="cicon"><Icon n="mail" size={24} /></div><h3>Usuario creado</h3><p>Se generaron las credenciales de acceso. Entréguelas al usuario: deberá cambiar la clave al ingresar.</p><table className="tbl kv"><tbody><tr><td>Usuario</td><td className="mono">{r.usuario.usuario}</td></tr><tr><td>Correo</td><td>{r.usuario.email}</td></tr><tr><td>Perfil</td><td>{ROL_TXT[r.usuario.rol]}</td></tr><tr><td>Clave temporal</td><td className="mono">{r.clave}</td></tr></tbody></table><div className="mact"><Btn v="p" onClick={c}>Aceptar</Btn></div></>, 'conf');
    } catch (e) { avisar((e as Error).message, 'err'); }
  };
  if (err) return <Card><Vacio titulo="Acceso restringido" texto={err} icono="lock" /></Card>;
  return <div className="usr-grid">
    <Card><Encabezado titulo="Administrador de usuarios" sub={`${lista.length} usuarios · asigne a cada uno su perfil SIAF y las opciones que puede consultar u operar`} acciones={!WEB() && <Btn v="p" icon="plus" onClick={() => setNuevo(!nuevo)}>Nuevo usuario</Btn>} />
      {WEB() && <Nota>En la versión web cada persona crea su cuenta con su correo o con Google. Aquí usted le asigna el perfil y las opciones.</Nota>}
      {nuevo && <Card form><Encabezado titulo="NUEVO USUARIO" acciones={<><Btn v="g" icon="x" onClick={() => setNuevo(false)}>Cancelar</Btn><Btn v="p" icon="save" onClick={crear}>Grabar</Btn></>} />
        <Grid><Campo label="DNI" c={3} req max={8} value={d.dni} onChange={v => setD({ ...d, dni: v })} /><Campo label="Apellidos" c={5} req value={d.apellidos} onChange={v => setD({ ...d, apellidos: v })} /><Campo label="Nombres" c={4} req value={d.nombres} onChange={v => setD({ ...d, nombres: v })} />
          <Campo label="Correo electrónico" c={6} req value={d.email} onChange={v => setD({ ...d, email: v })} /><Lista label="Perfil" c={6} value={d.rol} onChange={v => setD({ ...d, rol: v })} opciones={ROLES.map(r => ({ v: r.k, t: r.t }))} /></Grid></Card>}
      <div className="inl"><input className="ctl" placeholder="Buscar por usuario, nombre, correo o perfil" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="ovx"><table className="tbl hov"><thead><tr><th>Usuario</th><th>Apellidos y nombres</th><th>Correo</th><th>Perfil</th><th>Estado</th></tr></thead><tbody>
        {filtrada.map(u => <tr key={u.id} className={u.id === selId ? 'sel' : ''} onClick={() => setSelId(u.id)}><td className="mono">{u.usuario}</td><td>{u.apellidos} {u.nombres}</td><td className="sm">{u.email}{u.proveedor === 'google' && <><br /><span className="muted">Cuenta de Google</span></>}</td><td><span className={'rol-chip ' + u.rol}>{ROL_TXT[u.rol] || u.rol}</span></td><td><Badge e={u.estado} /></td></tr>)}
        {!filtrada.length && <tr><td colSpan={5} className="c muted">No hay usuarios que coincidan.</td></tr>}</tbody></table></div>
    </Card>
    {sel ? <EditorPerfil key={sel.id + sel.rol + JSON.stringify(sel.permisos) + sel.estado} u={sel} propio={sel.id === sesion?.usuario.id} onCambio={cargar} /> : <Card><Vacio titulo="Seleccione un usuario" texto="Elija un usuario de la lista para asignarle su perfil SIAF y las opciones de Consulta u Operación." icono="users" /></Card>}
  </div>;
}

function EditorPerfil({ u, propio, onCambio }: { u: Usuario; propio: boolean; onCambio: () => void }) {
  const { avisar, abrir } = useApp();
  const [rol, setRol] = useState<Rol>(u.rol);
  const [perm, setPerm] = useState<Permisos>({ ...u.permisos });
  const cambiarRol = (r: Rol) => { setRol(r); setPerm(permisosDeRol(r)); };
  const marcar = (k: Opcion, n: Nivel, v: boolean) => {
    const p = { ...perm };
    if (n === 'O') { if (v) p[k] = 'O'; else if (p[k] === 'O') p[k] = 'C'; }
    else { if (v) p[k] = p[k] || 'C'; else delete p[k]; }
    setPerm(p);
  };
  const grabar = async () => {
    if (!(await confirmar(`¿Asignar el perfil «${ROL_TXT[rol]}» a ${u.usuario}?`, { icono: 'users', ok: 'Grabar', detalle: 'Las opciones marcadas se aplican desde la siguiente acción del usuario.' }))) return;
    try { await api.usuarios.perfil(u.id, rol, perm); avisar('Perfil actualizado: ' + u.usuario + ' · ' + ROL_TXT[rol]); onCambio(); } catch (e) { avisar((e as Error).message, 'err'); }
  };
  const desc = ROLES.find(r => r.k === rol)?.desc;
  let grupo = '';
  return <Card><Encabezado titulo={u.usuario + ' · ' + u.apellidos + ' ' + u.nombres} sub={u.email + ' · creado ' + u.creado} acciones={<Btn v="p" icon="save" onClick={grabar}>Grabar perfil</Btn>} />
    <Grid><Lista label="Perfil SIAF" c={12} value={rol} onChange={v => cambiarRol(v as Rol)} opciones={ROLES.map(r => ({ v: r.k, t: r.t }))} /></Grid>
    <p className="muted sm">{desc}. Al cambiar el perfil se cargan sus opciones por defecto; puede ajustarlas una por una.</p>
    <table className="tbl perm-tbl"><thead><tr><th>Opción</th><th className="c">Consulta</th><th className="c">Operación</th></tr></thead><tbody>
      {OPCIONES.map(o => { const fila = [];
        if (o.grupo !== grupo) { grupo = o.grupo; fila.push(<tr key={'g' + o.grupo} className="g"><td colSpan={3}>{o.grupo}</td></tr>); }
        fila.push(<tr key={o.k}><td>{o.t}</td><td className="c"><input type="checkbox" disabled={rol === 'ADMINISTRADOR'} checked={rol === 'ADMINISTRADOR' || !!perm[o.k]} onChange={e => marcar(o.k, 'C', e.target.checked)} /></td><td className="c"><input type="checkbox" disabled={rol === 'ADMINISTRADOR'} checked={rol === 'ADMINISTRADOR' || perm[o.k] === 'O'} onChange={e => marcar(o.k, 'O', e.target.checked)} /></td></tr>);
        return fila; })}
    </tbody></table>
    <p className="hint">Operación incluye registrar, modificar, enviar, descartar y aprobar. Consulta solo permite ver. El Administrador de usuarios tiene todas las opciones.</p>
    <div className="fbtn">
      {!propio && <Btn v="g" onClick={async () => { try { await api.usuarios.estado(u.id); avisar('Estado actualizado.'); onCambio(); } catch (e) { avisar((e as Error).message, 'err'); } }}>{u.estado === 'ACTIVO' ? 'Desactivar usuario' : 'Activar usuario'}</Btn>}
      {!WEB() && u.proveedor !== 'google' && <Btn v="g" onClick={async () => { try { const c = await api.usuarios.clave(u.id); abrir(x => <><h3>Clave restablecida</h3><p>Nueva clave temporal de {u.usuario}: <b className="mono">{c}</b></p><div className="mact"><Btn v="p" onClick={x}>Aceptar</Btn></div></>, 'conf'); } catch (e) { avisar((e as Error).message, 'err'); } }}>Restablecer clave</Btn>}
    </div>
  </Card>;
}

/** Credenciales OAuth de Google para el escritorio (en la web se configuran en Supabase). */
export function AccesoGoogle() {
  const { avisar } = useApp();
  const [id, setId] = useState(''); const [sec, setSec] = useState(''); const [tiene, setTiene] = useState(false);
  useEffect(() => { if (!WEB()) api.google.config().then(c => { setId(c.clientId); setTiene(c.tieneSecreto); }).catch(() => undefined); }, []);
  if (WEB()) return <Card><Encabezado titulo="Acceso con Google" sub="Versión web" /><Nota>En la versión web el acceso con Google se activa en el panel de Supabase: Authentication › Providers › Google. Consulte la guía DESPLIEGUE-WEB.md.</Nota></Card>;
  return <Card><Encabezado titulo="Acceso con Google" sub="Permite que los usuarios ingresen o se registren con su cuenta de Google" acciones={<Btn v="p" icon="save" onClick={async () => { try { await api.google.guardar(id, sec); setSec(''); setTiene(tiene || !!sec); avisar(id ? 'Acceso con Google configurado.' : 'Acceso con Google desactivado.'); } catch (e) { avisar((e as Error).message, 'err'); } }}>Guardar</Btn>} />
    <Grid><Campo label="ID de cliente (OAuth, tipo «Aplicación de escritorio»)" c={12} value={id} onChange={setId} ph="xxxxxxxx.apps.googleusercontent.com" /><Campo label={'Secreto de cliente' + (tiene ? ' (ya registrado: escriba solo para cambiarlo)' : '')} c={12} value={sec} onChange={setSec} /></Grid>
    <Nota>Cree las credenciales en console.cloud.google.com › APIs y servicios › Credenciales › Crear ID de cliente de OAuth › Aplicación de escritorio. El usuario inicia sesión en su navegador y vuelve a la aplicación; los datos siguen guardándose en este equipo.</Nota></Card>;
}
