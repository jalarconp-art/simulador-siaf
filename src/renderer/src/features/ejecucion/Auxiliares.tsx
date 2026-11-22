/* Opciones complementarias del menú Registro (definidas en @shared/auxiliares): lista o búsqueda a la izquierda,
   detalle y formulario a la derecha, con Grabar, Enviar, Modificar y Descartar como en el SIAF-WEB. */
import { useMemo, useState } from 'react';
import { useApp, intentar } from '../../store';
import { api } from '../../api';
import { PanelLista } from '../../components/Shell';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista, Menu3, Nota, RO, Vacio } from '../../components/ui';
import { confirmar } from '../../components/Dialogos';
import { Icon } from '../../components/Icon';
import type { RegAux } from '@shared/types';
import { type CampoAux, type DefAux } from '@shared/auxiliares';
import { fmt, pad } from '@shared/util';

const valorVisible = (f: CampoAux | undefined, v: string) => (f?.tipo === 'monto' && v ? 'S/ ' + fmt(+v) : v);
const vacioDe = (def: DefAux) => Object.fromEntries(def.campos.map(f => [f.k, f.def ?? (f.tipo === 'lista' && f.req && f.opciones ? f.opciones[0] : '')]));

export function Auxiliar({ def }: { def: DefAux }) {
  const { ej, filtros } = useApp();
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState<null | { id?: string; datos: Record<string, string> }>(null);
  const [busq, setBusq] = useState<Record<string, string>>(() => def.modo === 'busqueda' ? vacioDe(def) : {});
  const [buscado, setBuscado] = useState(false);
  const regs = (ej?.aux || []).filter(r => r.tipo === def.k && r.estado !== 'DESCARTADO');
  const campo = (k: string) => def.campos.find(f => f.k === k);
  const lista = useMemo(() => regs
    .filter(r => filtros.mes === 'TODOS' || r.mes === +filtros.mes)
    .filter(r => !filtros.q || (pad(r.num, 5) + ' ' + Object.values(r.datos).join(' ')).toUpperCase().includes(filtros.q.toUpperCase()))
    .filter(r => !(def.filtros && def.modo !== 'busqueda') || def.filtros.every(k => !busq[k] || busq[k] === 'TODOS' || r.datos[k] === busq[k]))
    .sort((a, b) => (filtros.asc ? a.num - b.num : b.num - a.num)), [regs, filtros, busq]);
  /* búsqueda: las listas coinciden exactamente; los textos, por contenido */
  const resultados = regs.filter(r => (def.filtros || []).every(k => { const v = (busq[k] || '').trim().toUpperCase(); if (!v) return true; return campo(k)?.tipo === 'lista' ? r.datos[k] === v : (r.datos[k] || '').toUpperCase().includes(v); }));
  const sel = regs.find(r => r.id === selId) || null;
  const nuevo = () => { setSelId(null); setForm({ datos: vacioDe(def) }); };

  let detalle;
  if (form) detalle = <Formulario def={def} inicial={form} cerrar={(id?: string) => { setForm(null); if (id) setSelId(id); }} />;
  else if (sel) detalle = <Detalle def={def} r={sel} editar={() => setForm({ id: sel.id, datos: { ...sel.datos } })} />;
  else if (def.modo === 'busqueda' && buscado) detalle = <Card><Encabezado titulo="Lista de solicitudes" sub={resultados.length + ' resultado(s)'} acciones={<Btn v="p" icon="plus" onClick={nuevo}>Nueva solicitud</Btn>} />
    <table className="tbl hov"><thead><tr><th>Nº</th><th>Condición</th><th>Documento</th><th>Nombres</th><th>Banco</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>
      {resultados.map(r => <tr key={r.id} onClick={() => setSelId(r.id)}><td className="mono">{pad(r.num, 5)}</td><td>{r.datos.condicion}</td><td>{r.datos.tipoDoc?.slice(5)} {r.datos.numDoc}</td><td>{r.datos.nombres}</td><td>{r.datos.banco}</td><td>{r.fecha}</td><td><Badge e={r.estado} /></td></tr>)}
      {!resultados.length && <tr><td colSpan={7} className="c muted">No se encontraron solicitudes con los criterios ingresados.</td></tr>}</tbody></table></Card>;
  else detalle = <Vacio titulo={def.vacio[0]} texto={def.vacio[1]} icono="doc" />;

  if (def.modo === 'busqueda') return <>
    <div className="listp"><div className="lp-head"><b>{def.titulo}</b><button className="plus" title="Nueva solicitud" onClick={nuevo}><Icon n="plus" /></button></div>
      <div className="lp-busq"><Grid>{(def.filtros || []).map(k => { const f = campo(k)!; return f.tipo === 'lista' ? <Lista key={k} label={f.t} c={12} value={busq[k] || ''} onChange={v => setBusq({ ...busq, [k]: v })} opciones={f.opciones || []} /> : <Campo key={k} label={f.t} c={12} value={busq[k] || ''} onChange={v => setBusq({ ...busq, [k]: v })} />; })}</Grid>
        <div className="lp-btns"><Btn v="g" icon="reset" full onClick={() => { setBusq(vacioDe(def)); setBuscado(false); setSelId(null); }}>Limpiar</Btn><Btn v="p" icon="search" full onClick={() => { setBuscado(true); setSelId(null); setForm(null); }}>Buscar</Btn></div></div></div>
    <div className="detail">{detalle}</div></>;

  return <><PanelLista titulo={def.titulo} onNuevo={nuevo} tituloNuevo={'Nuevo registro de ' + def.titulo.toLowerCase()} ph={def.buscar} total={lista.length} etiqueta={def.plural}>
    {def.filtros && <div className="lp-filtro">{def.filtros.map(k => { const f = campo(k)!; return <label key={k}>{f.t}<select className="ctl sm" value={busq[k] || 'TODOS'} onChange={e => setBusq({ ...busq, [k]: e.target.value })}><option>TODOS</option>{(f.opciones || []).map(o => <option key={o}>{o}</option>)}</select></label>; })}</div>}
    {lista.map(r => <div key={r.id} className={'li' + (selId === r.id ? ' on' : '')} onClick={() => { setForm(null); setSelId(r.id); }}><span className="ic"><Icon n="doc" /></span>
      <div className="lib"><b>Nº {pad(r.num, 5)}</b><small>{valorVisible(campo(def.lista[0]), r.datos[def.lista[0]])} · {valorVisible(campo(def.lista[1]), r.datos[def.lista[1]])}</small></div><Badge e={r.estado} /></div>)}
  </PanelLista><div className="detail">{detalle}</div></>;
}

function Formulario({ def, inicial, cerrar }: { def: DefAux; inicial: { id?: string; datos: Record<string, string> }; cerrar: (id?: string) => void }) {
  const { ej } = useApp();
  const [d, setD] = useState<Record<string, string>>(inicial.datos);
  const grabar = async () => {
    if (!(await confirmar(inicial.id ? '¿Grabar las modificaciones del registro?' : '¿Grabar el nuevo registro?', { icono: 'save', ok: 'Grabar' }))) return;
    const r = await intentar(() => api.aux.grabar({ ejecutora: ej!.id, tipo: def.k, id: inicial.id, datos: d }), inicial.id ? 'Se ha modificado el registro.' : 'Se ha registrado correctamente.');
    if (r) { useApp.getState().avisar('Número: ' + pad(r.num, 5), 'info'); cerrar(r.id); }
  };
  return <Card form><Encabezado titulo={inicial.id ? def.titulo.toUpperCase() : 'NUEVO REGISTRO'} sub={inicial.id ? 'MODIFICAR REGISTRO' : def.titulo.toUpperCase()} rojo acciones={<><Btn v="g" icon="x" onClick={() => cerrar()}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <Grid>{def.campos.map(f => f.tipo === 'lista'
      ? <Lista key={f.k} label={f.t} c={f.c || 6} req={f.req} value={d[f.k] || ''} onChange={v => setD({ ...d, [f.k]: v })} vacio={f.req ? undefined : '(seleccione)'} opciones={f.opciones || []} />
      : <Campo key={f.k} label={f.t} c={f.c || 6} req={f.req} area={f.tipo === 'area'} rows={3} num={f.tipo === 'monto'} max={f.max} ph={f.tipo === 'fecha' ? 'dd/mm/aaaa' : f.tipo === 'monto' ? '0.00' : undefined} value={d[f.k] || ''} onChange={v => setD({ ...d, [f.k]: v })} />)}</Grid>
    {def.nota && <Nota>{def.nota}</Nota>}
  </Card>;
}

function Detalle({ def, r, editar }: { def: DefAux; r: RegAux; editar: () => void }) {
  const { ej } = useApp();
  const reg = r.estado === 'REGISTRADO';
  return <Card><Encabezado titulo={def.titulo.toUpperCase() + ' Nº ' + pad(r.num, 5)} sub={<>Registrado el {r.fecha} · <Badge e={r.estado} /></>} acciones={<>
    {reg && <Btn icon="send" onClick={async () => { if (await confirmar('¿Enviar el registro?', { icono: 'send', ok: 'Enviar' })) intentar(() => api.aux.enviar(ej!.id, def.k, r.id), 'El registro fue enviado y aprobado.'); }}>Enviar</Btn>}
    <Menu3 opciones={[['Modificar', editar, !reg], ['Descartar', async () => { if (await confirmar('¿Descartar el registro?', { icono: 'trash', ok: 'Descartar' })) intentar(() => api.aux.descartar(ej!.id, def.k, r.id), 'El registro fue descartado.'); }, !reg]]} /></>} />
    <Grid>{def.campos.map(f => <RO key={f.k} label={f.t} c={f.c || 6} v={valorVisible(f, r.datos[f.k] || '')} />)}</Grid>
    {def.nota && <Nota>{def.nota}</Nota>}
  </Card>;
}
