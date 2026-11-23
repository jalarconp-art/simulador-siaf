/* Menú del usuario: perfil, contraseña, configuración, respaldos y archivo de entrega */
import { useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Icon } from '../components/Icon';
import { Btn, Campo, Grid } from '../components/ui';
import { confirmar } from '../components/Dialogos';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { esAdmin, ROL_TXT } from '@shared/permisos';

export function menuUsuario(): void {
  const st = useApp.getState();
  const item = (ic: string, t: string, fn: () => void, cerrar: () => void) => <a onClick={() => { cerrar(); fn(); }}><Icon n={ic} />{t}</a>;
  st.abrir(cerrar => <div className="umenu">
    {item('user', 'Mi perfil', perfil, cerrar)}
    {item('key', 'Cambiar contraseña', cambiarClave, cerrar)}
    {item('card', 'Tickets de soporte', () => { import('./Inicio').then(m => m.abrirTickets()); }, cerrar)}
    {item('swap', 'Cambiar de ejecutora', cambiarEjecutora, cerrar)}
    {item('upload', 'Generar archivo de entrega', exportarEntrega, cerrar)}
    {item('download', 'Exportar copia de seguridad', exportarRespaldo, cerrar)}
    {item('upload', 'Restaurar copia de seguridad', restaurarRespaldo, cerrar)}
    {esAdmin(st.sesion?.usuario) && item('gear', 'Configuración', configuracion, cerrar)}
    {item('power', 'Cerrar sesión', async () => { await api.logout(); st.setSesion(null); st.ir('portal'); }, cerrar)}
  </div>);
}
function perfil(): void {
  const s = useApp.getState().sesion!;
  useApp.getState().abrir(cerrar => <><h3>Mi perfil</h3><table className="tbl kv"><tbody>
    {[['Usuario', s.usuario.usuario], ['Perfil', ROL_TXT[s.usuario.rol] || s.usuario.rol], ['Acceso', s.usuario.proveedor === 'google' ? 'Cuenta de Google' : 'Usuario y contraseña'], ['DNI', s.usuario.dni], ['Nombre', s.usuario.apellidos + ' ' + s.usuario.nombres], ['Correo', s.usuario.email], ['Inicio de sesión', s.inicio]].map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td></tr>)}
  </tbody></table><div className="mact"><Btn v="p" onClick={cerrar}>Cerrar</Btn></div></>);
}
function CambiarClave({ cerrar }: { cerrar: () => void }) {
  const [a, setA] = useState(''); const [n, setN] = useState(''); const [n2, setN2] = useState(''); const [e, setE] = useState('');
  const ok = async () => { if (n !== n2) { setE('Las contraseñas no coinciden.'); return; } try { await api.cambiarClave(a, n); useApp.getState().avisar('Contraseña actualizada.'); cerrar(); } catch (x) { setE((x as Error).message); } };
  return <><h3>Cambiar contraseña</h3><Grid><Campo label="Contraseña actual" c={12} pw value={a} onChange={setA} /><Campo label="Nueva contraseña" c={6} pw value={n} onChange={setN} /><Campo label="Repita la nueva contraseña" c={6} pw value={n2} onChange={setN2} onEnter={ok} /></Grid><small className="err">{e}</small>
    <div className="mact"><Btn v="g" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={ok}>Guardar</Btn></div></>;
}
const cambiarClave = () => useApp.getState().abrir(c => <CambiarClave cerrar={c} />);
function cambiarEjecutora(): void {
  const st = useApp.getState();
  st.abrir(cerrar => <><h3>Cambiar de ejecutora</h3><p className="muted">Cada ejecutora contiene un caso práctico.</p><div className="uelist">{CTX_ORDER.map(x => <div key={x} className={'ueit' + (st.ejecutoraId === x ? ' on' : '')} onClick={() => { st.setEjecutora(x); cerrar(); }}><b>{CASOS[x].entidad.secEjec} - {CASOS[x].entidad.ueNom}</b><small>{CASOS[x].grupo} · {CASOS[x].entidad.pliegoNom} · AF {CASOS[x].anio}</small></div>)}</div><div className="mact"><Btn v="g" onClick={cerrar}>Cerrar</Btn></div></>);
}
function Configuracion({ cerrar }: { cerrar: () => void }) {
  const [auto, setAuto] = useState(false); const [listo, setListo] = useState(false);
  if (!listo) { api.flujo.automatico().then(v => { setAuto(v); setListo(true); }); }
  return <><h3>Configuración</h3><label className="chk"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} /> Aprobación automática (salta la aprobación OPP y la firma en el MADAF)</label>
    <p className="muted sm">Desactivado, la OPP aprueba en Operaciones en Línea y el responsable firma en el MADAF con PIN y clave dinámica.</p>
    <div className="mact"><Btn v="g" onClick={cerrar}>Cancelar</Btn><Btn v="p" onClick={async () => { try { await api.flujo.setAutomatico(auto); useApp.getState().avisar('Configuración guardada'); cerrar(); } catch (e) { useApp.getState().avisar((e as Error).message, 'err'); } }}>Guardar</Btn></div></>;
}
const configuracion = () => useApp.getState().abrir(c => <Configuracion cerrar={c} />);

export async function exportarRespaldo(): Promise<void> { const r = await api.escritorio.respaldoExportar(); if (r.ok) useApp.getState().avisar('Copia de seguridad exportada.', 'ok', String(r.data)); }
export async function restaurarRespaldo(): Promise<void> { await api.escritorio.respaldoImportar(); }
function Entrega({ cerrar }: { cerrar: () => void }) {
  const s = useApp.getState().sesion; const [c, setC] = useState(''); const [n, setN] = useState(s ? s.usuario.apellidos + ' ' + s.usuario.nombres : '');
  const ok = async () => {
    try {
      const data = await api.entrega.generar(c, n);
      const r = await api.escritorio.guardarTexto('entrega-' + c.trim() + '.siafentrega', JSON.stringify(data), 'siafentrega');
      if (r.ok) { useApp.getState().avisar('Archivo de entrega generado. Entréguelo a su docente.', 'ok', String(r.data)); cerrar(); }
    } catch (e) { useApp.getState().avisar((e as Error).message, 'err'); }
  };
  return <><h3>Generar archivo de entrega</h3><p className="muted">Se empaquetan sus registros de las cinco ejecutoras. El docente lo importa en su panel y obtiene la calificación automática.</p>
    <Grid><Campo label="Código de estudiante" c={4} req value={c} onChange={setC} /><Campo label="Apellidos y nombres" c={8} req value={n} onChange={setN} /></Grid>
    <div className="mact"><Btn v="g" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="upload" onClick={ok}>Generar archivo</Btn></div></>;
}
export async function exportarEntrega(): Promise<void> {
  if (!useApp.getState().sesion) { useApp.getState().avisar('Inicie sesión para generar la entrega.', 'err'); return; }
  useApp.getState().abrir(c => <Entrega cerrar={c} />);
}
export { confirmar };
