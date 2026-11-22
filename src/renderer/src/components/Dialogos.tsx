/* Diálogos modales (confirmación, alerta) y avisos emergentes */
import type { ReactNode } from 'react';
import { useApp } from '../store';
import { Icon } from './Icon';

export function HostDialogos() {
  const { dialogos, cerrarDialogo } = useApp();
  return <>{dialogos.map(d => <div key={d.id} className="mbg" onMouseDown={e => { if (e.target === e.currentTarget && d.ancho !== 'conf') cerrarDialogo(d.id); }}>
    <div className={'modal' + (d.ancho === 'ancho' ? ' wide' : d.ancho === 'conf' ? ' conf' : '')}>{d.nodo(() => cerrarDialogo(d.id))}</div></div>)}</>;
}
export function Avisos() {
  const { avisos, quitarAviso } = useApp();
  return <div id="toasts">{avisos.map(a => <div key={a.id} className={'toast t-' + a.tipo}><span className="ti"><Icon n={a.tipo === 'ok' ? 'check' : a.tipo === 'err' ? 'warn' : 'info'} size={13} /></span><div>{a.texto}{a.sub && <><br /><small>{a.sub}</small></>}</div><button onClick={() => quitarAviso(a.id)}>×</button></div>)}</div>;
}
/** Confirmación con promesa: await confirmar('¿Grabar...?') */
export function confirmar(pregunta: string, o: { ok?: string; icono?: string; detalle?: string } = {}): Promise<boolean> {
  return new Promise(res => useApp.getState().abrir(cerrar => <>
    <div className="cicon"><Icon n={o.icono || 'save'} size={24} /></div><h3>{pregunta}</h3>{o.detalle && <p>{o.detalle}</p>}
    <div className="mact"><button className="btn btn-g" onClick={() => { cerrar(); res(false); }}><Icon n="x" />Cancelar</button><button className="btn btn-p" autoFocus onClick={() => { cerrar(); res(true); }}><Icon n="check" />{o.ok || 'Confirmar'}</button></div>
  </>, 'conf'));
}
export function alerta(titulo: string, cuerpo: ReactNode): Promise<void> {
  return new Promise(res => useApp.getState().abrir(cerrar => <>
    <div className="cicon err"><Icon n="warn" size={24} /></div><h3>{titulo}</h3><div>{cuerpo}</div>
    <div className="mact"><button className="btn btn-p" onClick={() => { cerrar(); res(); }}>Aceptar</button></div></>, 'conf'));
}
