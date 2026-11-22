/* Componentes de interfaz reutilizables */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { clasNom, fmt, sumI } from '@shared/util';
import type { Item } from '@shared/types';

const CL: Record<string, string> = { 'REGISTRADO': 'b-reg', 'EN VERIFICACION': 'b-ver', 'ENVIADO A OPP': 'b-opp', 'PENDIENTE DE FIRMA': 'b-pf', 'APROBADO': 'b-ok', 'RECHAZADO': 'b-rej', 'DESCARTADO': 'b-des', 'ANULADO': 'b-des', 'AUTORIZADO': 'b-ok', 'POR AUTORIZAR': 'b-pf', 'BAJA': 'b-des', 'ACTIVO': 'b-ok', 'INACTIVO': 'b-des', 'ANTECEDENTE': 'b-des', 'PENDIENTE': 'b-pf', 'PAGADO': 'b-ok' };
export const Badge = ({ e }: { e: string }) => <span className={'badge ' + (CL[e] || 'b-reg')}>{e}</span>;

type Variante = 'p' | 'o' | 'g' | 'ok' | 'danger' | 'w';
export function Btn({ v = 'o', sm, big, icon, children, onClick, disabled, title, full }: { v?: Variante; sm?: boolean; big?: boolean; icon?: string; children?: ReactNode; onClick?: () => void; disabled?: boolean; title?: string; full?: boolean }) {
  return <button className={`btn btn-${v}${sm ? ' sm' : ''}${big ? ' big' : ''}${full ? ' w100p' : ''}`} onClick={onClick} disabled={disabled} title={title}>{icon && <Icon n={icon} />}{children}</button>;
}
export const BtnIc = ({ n, onClick, title }: { n: string; onClick: () => void; title: string }) => <button className="btn-ic" title={title} onClick={onClick}><Icon n={n} /></button>;

export type Opcion = string | [string, string] | { v: string; t: string };
const opV = (o: Opcion) => typeof o === 'string' ? o : Array.isArray(o) ? o[0] : o.v;
const opT = (o: Opcion) => typeof o === 'string' ? o : Array.isArray(o) ? (o[0] ? o[0] + ' - ' + o[1] : o[1]) : o.t;

interface Base { label: string; c?: number; req?: boolean; hint?: ReactNode }
export function Campo({ label, c = 4, req, hint, value, onChange, ph, max, area, rows, pw, num, onEnter }: Base & { value: string | number; onChange: (v: string) => void; ph?: string; max?: number; area?: boolean; rows?: number; pw?: boolean; num?: boolean; onEnter?: () => void }) {
  const cls = 'ctl' + (req ? ' req' : '') + (num ? ' num' : '');
  return <div className={'f c' + c}><label>{label}</label>
    {area ? <textarea className={cls} rows={rows || 2} value={value} placeholder={ph} onChange={e => onChange(e.target.value)} />
      : <input className={cls} type={pw ? 'password' : 'text'} value={value} placeholder={ph} maxLength={max} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }} />}
    {hint && <small className="hint">{hint}</small>}</div>;
}
export function Lista({ label, c = 4, req, hint, value, onChange, opciones, vacio }: Base & { value: string; onChange: (v: string) => void; opciones: readonly Opcion[]; vacio?: string }) {
  return <div className={'f c' + c}><label>{label}</label>
    <select className={'ctl' + (req ? ' req' : '')} value={value} onChange={e => onChange(e.target.value)}>
      {vacio !== undefined && <option value="">{vacio}</option>}
      {opciones.map(o => <option key={opV(o)} value={opV(o)}>{opT(o)}</option>)}
    </select>{hint && <small className="hint">{hint}</small>}</div>;
}
export const RO = ({ label, v, c = 4 }: { label: string; v: ReactNode; c?: number }) => <div className={'f c' + c}><label>{label}</label><div className="ctl ro">{v === '' || v == null ? ' ' : v}</div></div>;
export const Grid = ({ children, head }: { children: ReactNode; head?: boolean }) => <div className={'fgrid' + (head ? ' head' : '')}>{children}</div>;

export function Vacio({ titulo, texto, icono = 'doc' }: { titulo: string; texto: string; icono?: string }) {
  return <div className="empty"><div className="eic"><Icon n={icono} size={26} /></div><h3>{titulo}</h3><p>{texto}</p></div>;
}
export function Sumas({ items }: { items: [string, number, boolean?][] }) {
  return <div className="sums">{items.map(([l, v, hi]) => <div key={l} className={hi ? 'hi' : ''}><small>{l}</small><b>{fmt(v)}</b></div>)}</div>;
}
export function Tabs({ tabs, val, set }: { tabs: [string, string][]; val: string; set: (v: string) => void }) {
  return <div className="tabs">{tabs.map(([k, t]) => <a key={k} className={val === k ? 'on' : ''} onClick={() => set(k)}>{t}</a>)}</div>;
}
export function Menu3({ opciones }: { opciones: [string, () => void, boolean?][] }) {
  const [abierto, setAbierto] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false); }; document.addEventListener('click', f); return () => document.removeEventListener('click', f); }, []);
  return <div className="dots" ref={ref}><button className="btn-ic" onClick={() => setAbierto(!abierto)}><Icon n="dots" /></button>
    <div className={'dmenu' + (abierto ? ' open' : '')}>{opciones.map(([t, fn, dis]) => <a key={t} className={dis ? 'dis' : ''} onClick={() => { if (!dis) { setAbierto(false); fn(); } }}>{t}</a>)}</div></div>;
}
export const Card = ({ children, form, inner, className }: { children: ReactNode; form?: boolean; inner?: boolean; className?: string }) => <div className={'card' + (form ? ' form' : '') + (inner ? ' in' : '') + (className ? ' ' + className : '')}>{children}</div>;
export function Encabezado({ titulo, sub, rojo, acciones }: { titulo: ReactNode; sub?: ReactNode; rojo?: boolean; acciones?: ReactNode }) {
  return <div className="dh"><div><h2>{titulo}</h2>{sub && <span className={'sub' + (rojo ? ' red' : '')}>{sub}</span>}</div>{acciones && <div className="acts">{acciones}</div>}</div>;
}
export function TablaItems({ items, meta = true }: { items: Item[]; meta?: boolean }) {
  return <table className="tbl"><thead><tr><th>Clasificador</th><th>Descripción</th>{meta && <th>Meta</th>}<th className="r">Monto S/</th></tr></thead>
    <tbody>{items.map((i, k) => <tr key={k}><td className="mono">{i.clas}</td><td>{clasNom(i.clas)}</td>{meta && <td>{i.meta}</td>}<td className="r">{fmt(i.monto)}</td></tr>)}
      <tr className="tot"><td colSpan={meta ? 3 : 2}>TOTAL</td><td className="r">{fmt(sumI(items))}</td></tr></tbody></table>;
}
export const Seccion = ({ children }: { children: ReactNode }) => <h4>{children}</h4>;
export const Nota = ({ children, ok }: { children: ReactNode; ok?: boolean }) => <div className={'note' + (ok ? ' ok' : '')}>{children}</div>;
export const Res = ({ v }: { v: string }) => <span className={'res ' + (v === 'OK' || v === 'Cuadra' ? 'r-ok' : v === 'Pendiente' || v === 'Sin asiento' ? 'r-n' : 'r-bad')}>{v}</span>;
