/* Diálogos de selección: Generación de operaciones, Seleccionador de meta, proveedores y clasificador de ingresos. */
import { useMemo, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Btn, Campo, Grid, Lista, RO } from './ui';
import { Icon } from './Icon';
import type { Ejecutora, Item, Persona } from '@shared/types';
import { CASOS } from '@shared/casos';
import { metaNombre } from '@shared/domain/saldos';
import { pimRows } from '@shared/domain/saldos';
import { CLAS_I, clasNom, fmt, num, r2 } from '@shared/util';

/* ---------- Generación de operaciones ---------- */
export interface FilaOrigen { clas: string; meta: string; origen: number; monto?: number }
interface OpGen { titulo: string; encabezado: [string, string][]; seccion?: string; etiqueta: string; filas: FilaOrigen[] }
function GenOps({ o, cerrar, res }: { o: OpGen; cerrar: () => void; res: (i: Item[] | null) => void }) {
  const [filas, setFilas] = useState(o.filas.map(f => ({ ...f, monto: f.monto !== undefined ? String(f.monto) : '0.00' })));
  const clases = [...new Set(filas.map(f => f.clas))];
  const [clas, setClas] = useState(clases[0] || '');
  const [err, setErr] = useState('');
  const aceptar = () => {
    const items = filas.map(f => ({ clas: f.clas, meta: f.meta, monto: num(f.monto), origen: f.origen })).filter(f => f.monto > 0);
    const malo = items.find(i => i.monto > i.origen + 0.001);
    if (malo) { setErr(`El monto debe ser menor o igual al monto de origen (${malo.clas}: S/ ${fmt(malo.origen)}).`); return; }
    if (!items.length) { setErr('Registre el monto (Con origen o manualmente).'); return; }
    cerrar(); res(items.map(i => ({ clas: i.clas, meta: i.meta, monto: i.monto })));
  };
  return <>
    <div className="gh"><b>Generación de operaciones</b><button className="btn-ic" onClick={() => { cerrar(); res(null); }}><Icon n="x" /></button></div>
    <div className="gsec"><b>{o.titulo}</b><table className="tbl sm"><thead><tr>{o.encabezado.map(h => <th key={h[0]}>{h[0]}</th>)}</tr></thead><tbody><tr>{o.encabezado.map(h => <td key={h[0]}>{h[1]}</td>)}</tr></tbody></table></div>
    <div className="gsec"><b>{o.seccion || 'EXPEDIENTE'}</b><Grid><RO label="Moneda" v="NUEVO SOL" /><RO label="Tipo cambio" v="1.0000000000" /><RO label="Monto / saldo MN" v={fmt(filas.reduce((a, f) => a + f.origen, 0))} /></Grid></div>
    <div className="two g13">
      <div className="card in"><div className="ch"><b>CLASIFICADOR</b></div><table className="tbl hov sm"><thead><tr><th>Clasificador</th><th className="r">Monto origen</th></tr></thead><tbody>
        {clases.map(c => <tr key={c} className={c === clas ? 'sel' : ''} onClick={() => setClas(c)}><td className="mono" title={clasNom(c)}>{c}</td><td className="r">{fmt(filas.filter(f => f.clas === c).reduce((a, f) => a + f.origen, 0))}</td></tr>)}</tbody></table></div>
      <div className="card in"><div className="ch"><b>META</b><span><Btn sm icon="copy" onClick={() => setFilas(filas.map(f => ({ ...f, monto: r2(f.origen).toFixed(2) })))}>Con origen</Btn> <Btn sm icon="reset" onClick={() => setFilas(filas.map(f => ({ ...f, monto: '0.00' })))}>Con cero</Btn></span></div>
        <table className="tbl sm"><thead><tr><th>Clasif.</th><th>Sec. func</th><th className="r">Monto origen (nacional)</th><th className="r">Monto origen (destino)</th><th className="r">{o.etiqueta}</th></tr></thead><tbody>
          {filas.map((f, i) => <tr key={i} className={f.clas === clas ? 'sel' : ''}><td className="mono">{f.clas}</td><td className="mono">{f.meta || '—'}</td><td className="r">{fmt(f.origen)}</td><td className="r">{fmt(f.origen)}</td><td className="r"><input className="ctl num w120" value={f.monto} onChange={e => setFilas(filas.map((x, k) => k === i ? { ...x, monto: e.target.value } : x))} /></td></tr>)}
          <tr className="tot"><td colSpan={4}>Total por clasificador ({clas})</td><td className="r">{fmt(filas.filter(f => f.clas === clas).reduce((a, f) => a + num(f.monto), 0))}</td></tr>
          <tr className="tot"><td colSpan={4}>Total general</td><td className="r">{fmt(filas.reduce((a, f) => a + num(f.monto), 0))}</td></tr></tbody></table></div>
    </div>
    <small className="err">{err}</small>
    <div className="mact"><Btn v="g" icon="x" onClick={() => { cerrar(); res(null); }}>Cancelar</Btn><Btn v="p" icon="check" onClick={aceptar}>Aceptar</Btn></div>
  </>;
}
export const generacionOperaciones = (o: OpGen): Promise<Item[] | null> => new Promise(res => useApp.getState().abrir(c => <GenOps o={o} cerrar={c} res={res} />, 'ancho'));

/* ---------- Seleccionador de meta ---------- */
function SelMeta({ ej, rubro, cerrar, res }: { ej: Ejecutora; rubro: string; cerrar: () => void; res: (r: { clas: string; meta: string } | null) => void }) {
  const filas = pimRows(ej, rubro);
  const clases = [...new Set(filas.map(f => f.clas))];
  const [clas, setClas] = useState(clases[0] || ''); const [meta, setMeta] = useState('');
  const lv = clas.split('.');
  const nivel = (n: number) => lv.slice(0, n).join('.');
  const metaNom = (m: string) => metaNombre(ej, m);
  return <><h3>Seleccionador de Meta</h3><p className="muted sm">Solo se muestran las metas con PCA priorizada (rubro {rubro}).</p>
    <div className="two"><table className="tbl hov"><thead><tr><th>Clasificador</th><th className="r">Saldo PCA priorizado</th></tr></thead><tbody>{clases.map(c => <tr key={c} className={c === clas ? 'sel' : ''} onClick={() => { setClas(c); setMeta(''); }}><td className="mono">{c}</td><td className="r">{fmt(filas.filter(f => f.clas === c).reduce((a, f) => a + f.saldo, 0))}</td></tr>)}</tbody></table>
      <table className="tbl hov"><thead><tr><th /><th>S. Func.</th><th>Meta</th><th className="r">Saldo PIM</th></tr></thead><tbody>{filas.filter(f => f.clas === clas).map(f => <tr key={f.meta} className={f.meta === meta ? 'sel' : ''} onClick={() => setMeta(f.meta)}><td><input type="checkbox" readOnly checked={f.meta === meta} /></td><td className="mono">{f.meta}</td><td>{metaNom(f.meta)}</td><td className="r">{fmt(f.saldo)}</td></tr>)}</tbody></table></div>
    {clas && <table className="tbl kv sm"><tbody>{[['Genérica', 2], ['Sub-genérica', 3], ['Sub-genérica det.', 4], ['Específica', 5]].map(([l, n]) => <tr key={l}><td>{l}</td><td>{nivel(n as number)} {clasNom(nivel(n as number))}</td></tr>)}<tr><td>Específica det.</td><td><b>{clas} {clasNom(clas)}</b></td></tr></tbody></table>}
    <div className="mact"><Btn v="g" icon="x" onClick={() => { cerrar(); res(null); }}>Cancelar</Btn><Btn v="p" icon="check" disabled={!meta} onClick={() => { cerrar(); res({ clas, meta }); }}>Aceptar</Btn></div></>;
}
export const seleccionarMeta = (ej: Ejecutora, rubro: string): Promise<{ clas: string; meta: string } | null> => new Promise(res => useApp.getState().abrir(c => <SelMeta ej={ej} rubro={rubro} cerrar={c} res={res} />, 'ancho'));

/* ---------- Proveedores ---------- */
function Proveedores({ cerrar, res }: { cerrar: () => void; res: (p: Persona | null) => void }) {
  const ej = useApp(s => s.ej)!;
  const [q, setQ] = useState(''); const [t, setT] = useState('RUC'); const [n, setN] = useState(''); const [nom, setNom] = useState(''); const [err, setErr] = useState('');
  const lista = ej.provs.filter(p => !q || p.num.includes(q) || p.nom.toUpperCase().includes(q.toUpperCase()));
  const agregar = async () => { try { await api.ejecutora.proveedor({ ejecutora: ej.id, tipo: t as 'RUC' | 'DNI', num: n, nom }); await useApp.getState().recargar(); cerrar(); res({ tipo: t, num: n.trim(), nom: nom.trim().toUpperCase() }); } catch (e) { setErr((e as Error).message); } };
  return <><h3>Seleccionar el proveedor</h3><input className="ctl" placeholder="Buscar por RUC/DNI o nombre" value={q} onChange={e => setQ(e.target.value)} autoFocus />
    <div className="scrollt"><table className="tbl hov"><thead><tr><th>Tipo</th><th>RUC / DNI</th><th>Razón social</th></tr></thead><tbody>{lista.map(p => <tr key={p.num} onClick={() => { cerrar(); res(p); }}><td>{p.tipo}</td><td className="mono">{p.num}</td><td>{p.nom}</td></tr>)}{!lista.length && <tr><td colSpan={3} className="c muted">Sin resultados</td></tr>}</tbody></table></div>
    <h4>Registrar proveedor (nacional o extranjero)</h4><Grid><Lista label="Tipo" c={2} value={t} onChange={setT} opciones={['RUC', 'DNI']} /><Campo label="Número" c={3} value={n} onChange={setN} /><Campo label="Razón social / nombre" c={5} value={nom} onChange={setNom} /><div className="f c2"><label>&nbsp;</label><Btn onClick={agregar}>Agregar</Btn></div></Grid><small className="err">{err}</small>
    <div className="mact"><Btn v="g" icon="x" onClick={() => { cerrar(); res(null); }}>Cancelar</Btn></div></>;
}
export const seleccionarProveedor = (): Promise<Persona | null> => new Promise(res => useApp.getState().abrir(c => <Proveedores cerrar={c} res={res} />, 'ancho'));

/* ---------- Clasificador de ingresos ---------- */
function ClasIngreso({ cerrar, res }: { cerrar: () => void; res: (r: { clas: string; monto: number } | null) => void }) {
  const [q, setQ] = useState(''); const [sel, setSel] = useState(''); const [m, setM] = useState('0.00');
  const lista = useMemo(() => CLAS_I.filter(r => r[0].split('.').length >= 6 && (!q || r[0].startsWith(q) || r[1].toUpperCase().includes(q.toUpperCase()))).slice(0, 150), [q]);
  return <><h3>Clasificador económico de ingresos 2026</h3><input className="ctl" placeholder="Buscar por código o denominación (por ejemplo PREDIAL, 1.3.2, MATRICULA)" value={q} onChange={e => setQ(e.target.value)} autoFocus />
    <div className="scrollt"><table className="tbl hov sm"><thead><tr><th>Clasificador</th><th>Denominación</th></tr></thead><tbody>{lista.map(r => <tr key={r[0]} className={sel === r[0] ? 'sel' : ''} onClick={() => setSel(r[0])}><td className="mono">{r[0]}</td><td>{r[1]}</td></tr>)}</tbody></table></div>
    <Grid><RO label="Seleccionado" c={8} v={sel ? sel + ' ' + clasNom(sel) : '(ninguno)'} /><Campo label="Monto" c={4} req num value={m} onChange={setM} /></Grid>
    <div className="mact"><Btn v="g" icon="x" onClick={() => { cerrar(); res(null); }}>Cancelar</Btn><Btn v="p" icon="check" disabled={!sel || num(m) <= 0} onClick={() => { cerrar(); res({ clas: sel, monto: num(m) }); }}>Aceptar</Btn></div></>;
}
export const seleccionarClasIngreso = (): Promise<{ clas: string; monto: number } | null> => new Promise(res => useApp.getState().abrir(c => <ClasIngreso cerrar={c} res={res} />, 'ancho'));
