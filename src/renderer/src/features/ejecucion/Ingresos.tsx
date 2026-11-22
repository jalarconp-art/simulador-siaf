/* Ciclo del ingreso: determinado y recaudado */
import { useState } from 'react';
import { useApp, intentar } from '../../store';
import { api } from '../../api';
import { PanelLista, useFiltrado } from '../../components/Shell';
import { Badge, Btn, BtnIc, Campo, Card, Encabezado, Grid, Lista, Menu3, RO, Seccion, Sumas, TablaItems, Vacio } from '../../components/ui';
import { confirmar } from '../../components/Dialogos';
import { seleccionarClasIngreso } from '../../components/Selectores';
import { Icon } from '../../components/Icon';
import type { Ejecutora, Ingreso } from '@shared/types';
import { CASOS } from '@shared/casos';
import { CAT } from '@shared/catalogo';
import { recDisponible, secMap } from '@shared/domain/saldos';
import { addMap, clasNom, docNom, ffDeRubro, ffNom, fmt, mapToItems, mapTot, num, pad, r2, rubroNom, sumI, type Mapa } from '@shared/util';

type Modo = null | { t: 'det' } | { t: 'rec'; id: string };
export function Ingresos() {
  const { ej, sel, seleccionar } = useApp();
  const { porMes, porNum, orden } = useFiltrado();
  const [modo, setModo] = useState<Modo>(null);
  const e = ej!;
  const lista = e.ings.filter(g => porMes(g) && porNum(g.num)).sort(orden);
  const g = e.ings.find(x => x.id === sel.ing);
  let det;
  if (modo?.t === 'det') det = <FormDet ej={e} cerrar={() => setModo(null)} />;
  else if (modo?.t === 'rec') det = <FormRec ej={e} g={e.ings.find(x => x.id === modo.id)!} cerrar={() => setModo(null)} />;
  else det = g ? <DetalleIng ej={e} g={g} recaudar={() => setModo({ t: 'rec', id: g.id })} /> : <Vacio titulo="Detalle del expediente de ingresos" icono="inbox" texto="Seleccione un expediente o pulse «+» para registrar el determinado (derecho de cobro) y luego el recaudado." />;
  return <><PanelLista titulo="Determinado" onNuevo={() => { seleccionar('ing', null); setModo({ t: 'det' }); }} tituloNuevo="Crear expediente" ph="Buscar número expediente" total={lista.length} etiqueta="expedientes de ingreso">
    {lista.map(x => { const u = x.secs.slice(-1)[0]; return <div key={x.id} className={'li' + (sel.ing === x.id ? ' on' : '')} onClick={() => { setModo(null); seleccionar('ing', x.id); }}><span className="ic"><Icon n="inbox" /></span><div className="lib"><b>{pad(x.num, 5)}</b><small>FF {x.ff} / Rb {x.rubro} · {x.secs.map(s => s.fase).join('-')}</small></div>{u && <Badge e={u.estado} />}</div>; })}
  </PanelLista><div className="detail">{det}</div></>;
}
function DetalleIng({ ej, g, recaudar }: { ej: Ejecutora; g: Ingreso; recaudar: () => void }) {
  const { setReporte } = useApp();
  const [abierto, setAbierto] = useState<Record<number, boolean>>({});
  const sm = (f: 'D' | 'R') => { const m: Mapa = {}; g.secs.filter(s => s.fase === f && s.estado === 'APROBADO').forEach(s => addMap(m, s.items, 1)); return mapTot(m); };
  const D = sm('D'), R = sm('R'), disp = mapTot(recDisponible(g));
  return <Card><Encabezado titulo={'EXPEDIENTE Nº ' + pad(g.num, 5)} sub={`Ciclo de ingresos · FF ${g.ff} - ${ffNom(g.ff)} · Rubro ${g.rubro} - ${rubroNom(g.rubro)}`} acciones={<Btn v="p" disabled={disp <= 0.001} onClick={recaudar}>Insertar Recaudado</Btn>} />
    <Sumas items={[['Determinado', D], ['Recaudado', R], ['Saldo por recaudar', D - R, true]]} />
    <h4>Secuencias</h4><table className="tbl"><thead><tr><th>Sec.</th><th>Fase</th><th>Documento</th><th>Fecha</th><th className="r">Monto</th><th>Estado</th><th /></tr></thead><tbody>
      {g.secs.map(s => [<tr key={s.sec}><td className="mono">{pad(s.sec, 4)}</td><td>{s.fase === 'D' ? 'DETERMINADO' : 'RECAUDADO'}</td><td>{s.doc.cod} {s.doc.serie ? s.doc.serie + '-' : ''}{s.doc.num}</td><td>{s.fecha}</td><td className="r">{fmt(sumI(s.items))}</td><td><Badge e={s.estado} /></td>
        <td className="nowrap">{s.estado === 'REGISTRADO' && <><Btn sm icon="send" onClick={async () => { if (await confirmar('¿Desea enviar el registro?', { icono: 'send', ok: 'Enviar' })) intentar(() => api.flujo.enviar({ k: 'is', x: ej.id, id: g.id, s: s.sec }), 'Transmisión y/o envío realizado correctamente.'); }}>Enviar</Btn><Menu3 opciones={[['Descartar', async () => { if (await confirmar('¿Descartar el registro?', { icono: 'trash' })) intentar(() => api.flujo.descartar({ k: 'is', x: ej.id, id: g.id, s: s.sec }), 'Se descartó con éxito.'); }]]} /></>}
          <button className="lnk" onClick={() => setAbierto({ ...abierto, [s.sec]: !abierto[s.sec] })}>{abierto[s.sec] ? 'Ocultar' : 'Detalle'}</button></td></tr>,
      abierto[s.sec] && <tr key={s.sec + 'x'} className="xrow"><td colSpan={7}><div className="xbox"><Grid><RO label="Documento" c={6} v={s.doc.cod + ' - ' + docNom(s.doc.cod)} /><RO label="Fecha doc." c={3} v={s.doc.fecha} /><RO label="Tipo de pago" c={3} v={s.tipoPago} /><RO label="Justificación" c={12} v={s.notas} /></Grid><TablaItems items={s.items} meta={false} /></div></td></tr>])}
    </tbody></table><p className="muted sm">Con el estado En verificación el sistema revisa que no haya incongruencias; de ser el caso, el expediente se aprueba automáticamente. · <a onClick={() => setReporte('ing', g.id)}>Reporte</a></p></Card>;
}
function FormDet({ ej, cerrar }: { ej: Ejecutora; cerrar: () => void }) {
  const sc = CASOS[ej.id].subcasos.find(s => s.id === ej.sub)!;
  const [d, setD] = useState({ rubro: sc.rubro || '09', doc: 'RI', serie: '', num: '', fecha: ej.fechaSis, notas: '', tipoPago: 'E - EFECTIVO' });
  const [items, setItems] = useState<{ clas: string; txt: string }[]>([]);
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  const grabar = async () => { if (!(await confirmar('¿Grabar el registro del determinado?', { ok: 'Aceptar' }))) return; const r = await intentar(() => api.det.grabar({ ejecutora: ej.id, rubro: d.rubro, doc: { cod: d.doc, serie: d.serie, num: d.num, fecha: d.fecha }, notas: d.notas, tipoPago: d.tipoPago, items: items.map(i => ({ clas: i.clas, meta: '', monto: num(i.txt) })) }), 'Se ha registrado el expediente...'); if (r) { useApp.getState().avisar('Número: ' + pad(r, 5), 'info'); cerrar(); } };
  return <><Card form><Encabezado titulo="NUEVO EXPEDIENTE" sub="REGISTRO SIAF - DETERMINADO" rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <Seccion>DETALLES DEL EXPEDIENTE</Seccion><Grid head><RO label="Entidad" c={6} v={CASOS[ej.id].entidad.secEjec + ' - ' + CASOS[ej.id].entidad.ueNom} /><RO label="Ciclo" c={3} v="I - INGRESO" /><RO label="Fase" c={3} v="D - DETERMINADO" /></Grid>
    <Seccion>DETALLES DEL DETERMINADO</Seccion><Grid><RO label="Moneda" c={3} v="NUEVO SOL" /><Lista label="Rubro" c={6} req value={d.rubro} onChange={set('rubro')} opciones={CAT.rubros.map(r => [r[0], r[1]] as [string, string])} /><RO label="Fuente de financiamiento" c={3} v={ffDeRubro(d.rubro) + ' - ' + ffNom(ffDeRubro(d.rubro))} /></Grid>
    <Seccion>DOCUMENTO A</Seccion><Grid><Lista label="Código" c={5} req value={d.doc} onChange={set('doc')} opciones={CAT.docsIng as [string, string][]} /><Campo label="Serie" c={2} max={4} value={d.serie} onChange={set('serie')} /><Campo label="Número" c={3} req value={d.num} onChange={set('num')} /><Campo label="Fecha" c={2} req value={d.fecha} onChange={set('fecha')} /><Campo label="Justificación" c={12} req area value={d.notas} onChange={set('notas')} /><Lista label="Tipo de pago" c={6} value={d.tipoPago} onChange={set('tipoPago')} opciones={CAT.tiposPago.map(x => ({ v: x, t: x }))} /></Grid></Card>
    <Card inner><div className="ch"><b>CLASIFICADOR DE INGRESOS</b><Btn sm icon="plus" onClick={async () => { const r = await seleccionarClasIngreso(); if (r) setItems([...items, { clas: r.clas, txt: r.monto.toFixed(2) }]); }}>Agregar</Btn></div>
      <table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th className="r">Monto</th><th /></tr></thead><tbody>{items.map((it, i) => <tr key={i}><td className="mono">{it.clas}</td><td>{clasNom(it.clas)}</td><td className="r"><input className="ctl num req w120" value={it.txt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, txt: e.target.value } : x))} /></td><td><BtnIc n="trash" title="Eliminar" onClick={() => setItems(items.filter((_, k) => k !== i))} /></td></tr>)}{!items.length && <tr><td colSpan={4} className="c muted">Con el botón Agregar incorpore el clasificador y coloque el monto.</td></tr>}</tbody></table></Card></>;
}
function FormRec({ ej, g, cerrar }: { ej: Ejecutora; g: Ingreso; cerrar: () => void }) {
  const [d, setD] = useState({ doc: 'VD', serie: '', num: '', fecha: ej.fechaSis, notas: '' });
  const [items, setItems] = useState(mapToItems(recDisponible(g)).filter(i => i.monto > 0).map(i => ({ ...i, saldo: i.monto, txt: '0.00' })));
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  return <><Card form><Encabezado titulo={'EXPEDIENTE Nº ' + pad(g.num, 5)} sub="INSERTAR RECAUDADO" rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={async () => { if (!(await confirmar('¿Grabar el registro del recaudado?', { ok: 'Aceptar' }))) return; const r = await intentar(() => api.rec.grabar({ ejecutora: ej.id, ingId: g.id, doc: d, notas: d.notas, items: items.map(i => ({ clas: i.clas, meta: '', monto: num(i.txt) })) })); if (r) { useApp.getState().avisar(`Se ha registrado el recaudado con secuencia N° ${r}.`, 'ok', 'Envíelo para su aprobación.'); cerrar(); } }}>Grabar</Btn></>} />
    <Grid><RO label="Rubro" c={6} v={g.rubro + ' - ' + rubroNom(g.rubro)} /><RO label="Fuente" c={6} v={g.ff + ' - ' + ffNom(g.ff)} /><Lista label="Código" c={5} req value={d.doc} onChange={set('doc')} opciones={CAT.docsIng as [string, string][]} /><Campo label="Serie" c={2} value={d.serie} onChange={set('serie')} /><Campo label="Número" c={3} req value={d.num} onChange={set('num')} /><Campo label="Fecha" c={2} req value={d.fecha} onChange={set('fecha')} /><Campo label="Justificación" c={12} req area value={d.notas} onChange={set('notas')} /></Grid></Card>
    <Card inner><div className="ch"><b>CLASIFICADOR</b><span><Btn sm icon="copy" onClick={() => setItems(items.map(i => ({ ...i, txt: r2(i.saldo).toFixed(2) })))}>Con origen</Btn> <Btn sm icon="reset" onClick={() => setItems(items.map(i => ({ ...i, txt: '0.00' })))}>Con cero</Btn></span></div>
      <table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th className="r">Saldo por recaudar</th><th className="r">Monto recaudado</th></tr></thead><tbody>{items.map((it, i) => <tr key={i}><td className="mono">{it.clas}</td><td>{clasNom(it.clas)}</td><td className="r">{fmt(it.saldo)}</td><td className="r"><input className="ctl num req w120" value={it.txt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, txt: e.target.value } : x))} /></td></tr>)}</tbody></table></Card></>;
}
export const _secMap = secMap;
