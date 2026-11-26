/* Modificación de certificación y compromiso anual */
import { useState } from 'react';
import { useApp, intentar } from '../../store';
import { api } from '../../api';
import { PanelLista, useFiltrado } from '../../components/Shell';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista, Menu3, RO, Vacio } from '../../components/ui';
import { confirmar } from '../../components/Dialogos';
import { seleccionarProveedor } from '../../components/Selectores';
import { Icon } from '../../components/Icon';
import type { Certificado, CompromisoAnual, Ejecutora, Modificacion } from '@shared/types';
import { CAT } from '@shared/catalogo';
import { caMonto, certEstado, certMap } from '@shared/domain/saldos';
import { MSG_JUSTIF } from '@shared/domain/reglas';
import { docNom, fmt, mapTot, pad } from '@shared/util';

const CAMPOS_CERT = ['Dispositivo legal', 'Fecha del documento', 'Justificación', 'Número del documento', 'Tipo de certificación'];
const CAMPOS_CA = ['Código del documento', 'Documento proveedor', 'Fecha del documento', 'Justificación', 'Número del documento', 'Número de transferencia financiera (Rubro 13)'];
type Modo = null | { t: 'paso1' } | { t: 'paso2'; tipo: 'CERT' | 'CA'; refId: string; mod?: Modificacion };

export function Modificaciones() {
  const { ej, sel, seleccionar } = useApp();
  const { porMes, porNum, orden } = useFiltrado();
  const [modo, setModo] = useState<Modo>(null);
  const e = ej!;
  const lista = e.mods.filter(m => porMes(m) && porNum(m.num)).sort(orden);
  const m = e.mods.find(x => x.id === sel.mod);
  let det;
  if (modo?.t === 'paso1') det = <Paso1 ej={e} cerrar={() => setModo(null)} siguiente={(tipo, refId) => setModo({ t: 'paso2', tipo, refId })} />;
  else if (modo?.t === 'paso2') det = <Paso2 ej={e} tipo={modo.tipo} refId={modo.refId} mod={modo.mod} cerrar={() => setModo(null)} />;
  else det = m ? <DetalleMod ej={e} m={m} editar={() => setModo({ t: 'paso2', tipo: m.tipo, refId: m.refId, mod: m })} /> : <Vacio titulo="Modificación de certificación y compromiso anual" icono="edit" texto="Muestra las modificaciones registradas en el periodo. Generan un correlativo diferente al número de certificado. Pulse «+» para crear una." />;
  return <><PanelLista titulo="Modificación" onNuevo={() => { seleccionar('mod', null); setModo({ t: 'paso1' }); }} tituloNuevo="Crear modificación" ph="Buscar número de modificación" total={lista.length} etiqueta="modificaciones">
    {lista.map(x => { const ref = x.tipo === 'CERT' ? e.certs.find(c => c.id === x.refId) : e.cas.find(a => a.id === x.refId); return <div key={x.id} className={'li' + (sel.mod === x.id ? ' on' : '')} onClick={() => { setModo(null); seleccionar('mod', x.id); }}><span className="ic"><Icon n="edit" /></span><div className="lib"><b>Nº {x.num}</b><small>{x.tipo === 'CERT' ? 'CERTIFICADO' : 'COMP. ANUAL'} {ref ? pad(ref.num, 5) : ''} · {x.campo}</small></div><Badge e={x.estado} /></div>; })}
  </PanelLista><div className="detail">{det}</div></>;
}
function Paso1({ ej, cerrar, siguiente }: { ej: Ejecutora; cerrar: () => void; siguiente: (t: 'CERT' | 'CA', id: string) => void }) {
  const [tipo, setTipo] = useState<'CERT' | 'CA'>('CERT'); const [q, setQ] = useState(''); const [ref, setRef] = useState('');
  const lista: (Certificado | CompromisoAnual)[] = (tipo === 'CERT' ? ej.certs.filter(c => certEstado(c) === 'APROBADO') : ej.cas.filter(a => a.estado === 'APROBADO')).filter(r => !q || pad(r.num, 5).includes(q));
  return <Card form><Encabezado titulo="NUEVA MODIFICACIÓN" acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" disabled={!ref} onClick={() => siguiente(tipo, ref)}>Siguiente ›</Btn></>} />
    <Grid><Lista label="Modificación de" value={tipo} onChange={v => { setTipo(v as 'CERT' | 'CA'); setRef(''); }} opciones={[{ v: 'CERT', t: 'Certificado' }, { v: 'CA', t: 'Compromiso anual' }]} /><Campo label="Buscar número" value={q} onChange={setQ} /></Grid>
    <table className="tbl hov"><thead><tr><th /><th>Número</th><th>Documento</th><th>Fecha</th><th>{tipo === 'CERT' ? 'Tipo certificación' : 'Proveedor'}</th><th className="r">Monto</th></tr></thead><tbody>
      {lista.map(r => <tr key={r.id} className={ref === r.id ? 'sel' : ''} onClick={() => setRef(r.id)}><td><input type="radio" readOnly checked={ref === r.id} /></td><td className="mono">{pad(r.num, 5)}</td><td>{r.doc.cod} {r.doc.num}</td><td>{r.doc.fecha}</td><td>{'tipoCert' in r ? r.tipoCert : r.prov.nom}</td><td className="r">{fmt('tipoCert' in r ? mapTot(certMap(r)) : caMonto(r))}</td></tr>)}
      {!lista.length && <tr><td colSpan={6} className="c muted">No hay registros aprobados.</td></tr>}</tbody></table></Card>;
}
function dice(ej: Ejecutora, tipo: 'CERT' | 'CA', id: string): [string, string][] {
  if (tipo === 'CERT') { const r = ej.certs.find(c => c.id === id)!; return [['Dispositivo legal', r.disp || '0-OTROS'], ['Fecha del documento', r.doc.fecha], ['Justificación', r.justif], ['Número del documento', r.doc.num], ['Tipo de certificación', r.tipoCert]]; }
  const r = ej.cas.find(a => a.id === id)!; return [['Código del documento', r.doc.cod + ' - ' + docNom(r.doc.cod)], ['Documento proveedor', r.prov.tipo + ' ' + r.prov.num + ' - ' + r.prov.nom], ['Fecha del documento', r.doc.fecha], ['Justificación', r.justif], ['Número del documento', r.doc.num], ['Número de transferencia financiera (Rubro 13)', r.transf || '—']];
}
function Paso2({ ej, tipo, refId, mod, cerrar }: { ej: Ejecutora; tipo: 'CERT' | 'CA'; refId: string; mod?: Modificacion; cerrar: () => void }) {
  const [campo, setCampo] = useState(mod?.campo || ''); const [val, setVal] = useState(mod && mod.campo !== 'Documento proveedor' ? mod.despues : mod ? mod.despues.split('|')[1] : '');
  const r = tipo === 'CERT' ? ej.certs.find(c => c.id === refId)! : ej.cas.find(a => a.id === refId)!;
  let campoUI = <p className="muted">Seleccione el dato a modificar para habilitar el campo. El sistema no permite modificar dos datos al mismo tiempo.</p>;
  if (campo === 'Dispositivo legal') campoUI = <Lista label="Debe decir" c={12} value={val || '0-OTROS'} onChange={setVal} opciones={['0-OTROS', '1-LEY Nº 31953 - INDECI', '2-LEY Nº 31953 - FEN']} />;
  else if (campo === 'Fecha del documento') campoUI = <Campo label="Debe decir" c={6} req value={val} onChange={setVal} ph="dd/mm/aaaa" />;
  else if (campo === 'Justificación') campoUI = <Campo label="Debe decir" c={12} req area rows={3} value={val} onChange={setVal} hint={MSG_JUSTIF} />;
  else if (campo === 'Tipo de certificación') campoUI = <Lista label="Debe decir" c={8} value={val} onChange={setVal} vacio="(seleccione)" opciones={CAT.tiposCert} />;
  else if (campo === 'Código del documento') campoUI = <Lista label="Debe decir" c={12} value={val} onChange={setVal} vacio="(seleccione)" opciones={CAT.docs as [string, string][]} />;
  else if (campo === 'Documento proveedor') campoUI = <><div className="f c5"><label>Proveedor (RUC/DNI)</label><div className="inl"><input className="ctl req" value={val} onChange={e => setVal(e.target.value)} /><Btn v="p" sm icon="search" onClick={async () => { const p = await seleccionarProveedor(); if (p) setVal(p.num); }} /></div></div><RO label="Nombre" c={7} v={ej.provs.find(p => p.num === val)?.nom || ''} /></>;
  else if (campo) campoUI = <Campo label="Debe decir" c={8} req value={val} onChange={setVal} />;
  const grabar = async () => { if (!(await confirmar('¿Grabar el registro de la modificación?'))) return; const n = await intentar(() => api.mod.grabar({ ejecutora: ej.id, id: mod?.id, tipo, refId, campo, valor: campo === 'Dispositivo legal' ? (val || '0-OTROS') : val }), mod ? 'Se ha modificado la modificación...' : 'Se ha registrado una nueva modificación...'); if (n) { useApp.getState().avisar('Número: ' + n, 'info'); cerrar(); } };
  return <Card form><Encabezado titulo={(tipo === 'CERT' ? 'CERTIFICADO' : 'COMPROMISO ANUAL') + ' Nº ' + pad(r.num, 5)} sub={mod ? 'MODIFICAR LA MODIFICACIÓN' : 'NUEVA MODIFICACIÓN'} rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <div className="two"><Card inner><div className="ch"><b>DICE (información original)</b></div><table className="tbl kv"><tbody>{dice(ej, tipo, refId).map(x => <tr key={x[0]} className={x[0] === campo ? 'sel' : ''}><td>{x[0]}</td><td>{x[1]}</td></tr>)}</tbody></table></Card>
      <Card inner><div className="ch"><b>DEBE DECIR</b></div><Grid><Lista label="Seleccione el dato a modificar" c={12} value={campo} onChange={v => { setCampo(v); setVal(''); }} vacio="(seleccione)" opciones={(tipo === 'CERT' ? CAMPOS_CERT : CAMPOS_CA).map(x => ({ v: x, t: x }))} />{campoUI}</Grid></Card></div></Card>;
}
function DetalleMod({ ej, m, editar }: { ej: Ejecutora; m: Modificacion; editar: () => void }) {
  const r = m.tipo === 'CERT' ? ej.certs.find(c => c.id === m.refId) : ej.cas.find(a => a.id === m.refId);
  const reg = m.estado === 'REGISTRADO';
  return <Card><Encabezado titulo={'MODIFICACIÓN Nº ' + m.num} sub={<>{m.tipo === 'CERT' ? 'Certificado' : 'Compromiso anual'} Nº {r ? pad(r.num, 5) : ''} · <Badge e={m.estado} /></>} acciones={<>{reg && <Btn icon="send" onClick={async () => { if (await confirmar('¿Enviar la modificación para su aprobación?', { icono: 'send', ok: 'Enviar' })) intentar(() => api.flujo.enviar({ k: 'md', x: ej.id, id: m.id }), 'La modificación fue enviada.'); }}>Enviar</Btn>}<Menu3 opciones={[['Modificar', editar, !reg], ['Descartar', async () => { if (await confirmar('¿Descartar la modificación?', { icono: 'trash', ok: 'Descartar' })) intentar(() => api.flujo.descartar({ k: 'md', x: ej.id, id: m.id }), 'La modificación fue descartada.'); }, !reg]]} /></>} />
    <Grid><RO label="Dato a modificar" c={6} v={m.campo} /><RO label="Fecha de registro" c={3} v={m.fecha} /><RO label="Fecha aprobación" c={3} v={m.fechaAprob || '—'} /><RO label="Dice" c={6} v={m.antes} /><RO label="Debe decir" c={6} v={m.campo === 'Documento proveedor' ? m.despues.split('|').join(' ') : m.despues} /></Grid>
    <p className="muted sm">{m.tipo === 'CERT' ? 'Con el estado Enviado a OPP, el usuario de presupuesto debe procesar y aprobar la modificación en SIAF Operaciones en Línea.' : m.campo === 'Documento proveedor' ? 'Con el estado Pendiente de firma, el DGA debe autorizar la modificación en el MADAF.' : 'Para los compromisos anuales no se necesita la aprobación de Presupuesto: la base de datos verifica y aprueba la modificación.'}</p></Card>;
}
