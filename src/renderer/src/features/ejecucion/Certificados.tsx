/* Certificación de crédito presupuestario: listado, detalle, registro, modificación, ampliación, rebaja y anulación. */
import { useState } from 'react';
import { useApp, intentar } from '../../store';
import { api } from '../../api';
import { PanelLista, useFiltrado } from '../../components/Shell';
import { Badge, Btn, BtnIc, Campo, Card, Encabezado, Grid, Lista, Menu3, RO, Sumas, Tabs, Vacio } from '../../components/ui';
import { confirmar } from '../../components/Dialogos';
import { seleccionarMeta } from '../../components/Selectores';
import { Icon } from '../../components/Icon';
import { Letra } from './Expedientes';
import type { Certificado, Ejecutora, Item } from '@shared/types';
import { CASOS } from '@shared/casos';
import { metaNombre } from '@shared/domain/saldos';
import { CAT, MESES } from '@shared/catalogo';
import { certComprometido, certEstado, certMap, certSaldo, pimRows } from '@shared/domain/saldos';
import { MSG_JUSTIF } from '@shared/domain/reglas';
import { clasNom, docNom, ffDeRubro, ffNom, fmt, mapToItems, mapTot, num, pad, rubroNom, sumI } from '@shared/util';

type Modo = null | { t: 'nuevo' } | { t: 'editar'; id: string } | { t: 'AMPLIACION' | 'REBAJA' | 'ANULACION'; id: string };

export function Certificados() {
  const { ej, sel, seleccionar } = useApp();
  const { porMes, porNum, orden, f } = useFiltrado();
  const [modo, setModo] = useState<Modo>(null);
  const e = ej!;
  const lista = e.certs.filter(c => porMes(c) && porNum(c.num) && (f.tipoCert === 'TODOS' || c.tipoCert === f.tipoCert) && (f.estado === 'TODOS' || certEstado(c) === f.estado) && (f.rubro === 'TODOS' || c.rubro === f.rubro)).sort(orden);
  const cert = e.certs.find(c => c.id === sel.cert);
  let detalle;
  if (modo?.t === 'nuevo' || modo?.t === 'editar') detalle = <FormCertificado ej={e} cert={modo.t === 'editar' ? e.certs.find(c => c.id === modo.id) : undefined} cerrar={id => { setModo(null); if (id) seleccionar('cert', id); }} />;
  else if (modo) detalle = <FormModCert ej={e} cert={e.certs.find(c => c.id === modo.id)!} tipo={modo.t} cerrar={() => setModo(null)} />;
  else detalle = cert ? <DetalleCert ej={e} c={cert} setModo={setModo} /> : <Vacio titulo="Detalle del certificado" texto="Para poder visualizar el detalle, usted debe seleccionar un certificado de la lista izquierda." />;
  const ETQC: Record<string, string> = { INICIAL: 'Certificación', AMPLIACION: 'Ampliación', REBAJA: 'Rebaja', ANULACION: 'Anulación' };
  return <>
    <PanelLista titulo="Certificación" onNuevo={() => { seleccionar('cert', null); setModo({ t: 'nuevo' }); }} tituloNuevo="Crear certificado" ph="Buscar número certificado" avanzada total={lista.length} etiqueta="certificados">
      {lista.map(c => { const on = sel.cert === c.id; return <div key={c.id} className={'arbol' + (on ? ' abierto' : '')}>
        <div className="li" onClick={() => { setModo(null); seleccionar('csec', null); seleccionar('cert', on ? null : c.id); }}><span className="ic"><Icon n="doc" /></span><div className="lib"><b>{pad(c.num, 5)}</b></div><span className={'chev' + (on ? ' up' : '')}><Icon n="chevron" /></span></div>
        {on && c.secs.filter(s => s.estado !== 'DESCARTADO').map(s => <div key={s.sec} className={'rama' + (s.sec > 1 ? ' n1' : '') + ((sel.csec || '1') === String(s.sec) ? ' on' : '')} onClick={() => { setModo(null); seleccionar('csec', String(s.sec)); }}><span className="r-t">{ETQC[s.tipo]}</span><span className="r-s">{pad(s.sec, 4)}</span><Letra e={s.estado} /></div>)}
      </div>; })}
    </PanelLista>
    <div className="detail">{detalle}</div></>;
}

function DetalleCert({ ej, c, setModo }: { ej: Ejecutora; c: Certificado; setModo: (m: Modo) => void }) {
  const { setReporte, irPantalla, seleccionar, sel } = useApp();
  const [tab, setTab] = useState('det');
  const s = c.secs.find(x => String(x.sec) === sel.csec) || c.secs[0];
  const s0 = c.secs[0], est = s0.estado, apr = est === 'APROBADO', regS = s.estado === 'REGISTRADO';
  const tot = mapTot(certMap(c)), comp = mapTot(certComprometido(ej, c));
  const modsMonto = sumI(c.secs.filter(x => x.sec > 1 && x.estado === 'APROBADO').flatMap(x => x.tipo === 'AMPLIACION' ? x.items : x.items.map(i => ({ ...i, monto: -Math.abs(i.monto) }))));
  const m = certMap(c, true), pim = pimRows(ej, c.rubro);
  const enviar = async (sec: number, tipo: string) => { if (await confirmar('¿Desea continuar con enviar el documento seleccionado?', { icono: 'send', ok: 'Enviar' })) intentar(() => api.flujo.enviar({ k: 'cs', x: ej.id, id: c.id, s: sec }), tipo === 'INICIAL' ? 'El certificado fue enviado' : tipo === 'AMPLIACION' ? 'Ampliación de certificación enviada' : tipo === 'ANULACION' ? 'Anulación de certificación enviada' : 'El certificado fue enviado.'); };
  const descartar = async (sec: number) => { if (await confirmar(sec === 1 ? '¿Descartar el certificado?' : '¿Descartar la modificación?', { icono: 'trash', ok: 'Descartar', detalle: 'El registro descartado ya no consume marco presupuestal.' })) intentar(() => api.flujo.descartar({ k: 'cs', x: ej.id, id: c.id, s: sec }), sec === 1 ? 'El certificado fue descartado' : 'La modificación fue descartada.'); };
  const mods = c.secs.filter(x => x.sec > 1);
  const kv = (k: string, v: string, full?: boolean) => <div className={'kv-f' + (full ? ' full' : '')}><span>{k}:</span><b>{v || '-'}</b></div>;
  const etq = s.tipo === 'INICIAL' ? 'Certificación' : s.tipo.charAt(0) + s.tipo.slice(1).toLowerCase();
  return <div className="det-siaf">
    <div className="ds-cab"><h2>CERTIFICADO Nº {pad(c.num, 5)}</h2><button className="btn-ins" disabled={!apr} onClick={() => { seleccionar('ca', c.id); irPantalla('ca'); }}>Insertar Compromiso</button></div>
    <div className="ds-barra">
      <select className="ds-sec" value={s.sec} onChange={ev => seleccionar('csec', ev.target.value)}>{c.secs.filter(x => x.estado !== 'DESCARTADO').map(x => <option key={x.sec} value={x.sec}>{x.tipo === 'INICIAL' ? 'Certificación' : x.tipo.charAt(0) + x.tipo.slice(1).toLowerCase()} {pad(x.sec, 4)}</option>)}</select>
      <div className="ds-tabs"><a className={tab === 'det' ? 'on' : ''} onClick={() => setTab('det')}><Icon n="doc" /> Detalles</a><a className={tab === 'mods' ? 'on' : ''} onClick={() => setTab('mods')}><Icon n="doc" /> Modificaciones</a></div>
      <Menu3 opciones={[['Modificar', () => setModo({ t: 'editar', id: c.id }), !(regS && s.sec === 1)], ['Descartar', () => descartar(s.sec), !regS], ['Anular', () => setModo({ t: 'ANULACION', id: c.id }), !apr], ['Ampliar', () => setModo({ t: 'AMPLIACION', id: c.id }), !apr], ['Rebajar', () => setModo({ t: 'REBAJA', id: c.id }), !apr], ['Ver Nota de Certificación', () => setReporte('cert', c.id)]]} />
      <button className="btn-env" disabled={!regS} onClick={() => enviar(s.sec, s.tipo)}><Icon n="send" /> Enviar</button>
    </div>
    {tab === 'det' ? <>
      <div className="ds-card ds-kv">
        <div>{kv('Secuencia', pad(s.sec, 4) + (s.sec > 1 ? ' · ' + etq.toUpperCase() : ''))}{kv('Documento', s.doc.cod + ' - ' + docNom(s.doc.cod))}{kv('Número', s.doc.num)}{kv('Fecha', s.doc.fecha)}{kv('Rubro', c.rubro + ' - ' + rubroNom(c.rubro))}</div>
        <div>{kv('Estado', s.estado)}{kv('Moneda', 'NUEVO SOL')}{kv('Tipo certificación', c.tipoCert)}{kv('Referencia', 'OTROS')}{kv('Dispositivo legal', c.disp || 'OTROS')}</div>
        {kv('Justificación', c.justif, true)}
      </div>
      <div className="ds-sumas"><div><small>Monto Certificado (+)</small><b>{fmt(sumI(s0.items))}</b></div><div><small>Modificaciones del certificado (+ -)</small><b>{fmt(modsMonto)}</b></div><div><small>Suma de CA registrados (-)</small><b>{fmt(comp)}</b></div><div><small>Saldo por comprometer</small><b className="red">{fmt(tot - comp)}</b></div></div>
      <div className="ds-cm">
        <div className="ds-card"><h5>CLASIFICADOR</h5><table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th className="r">Saldo PCA</th><th className="r">Monto origen</th></tr></thead><tbody>
          {[...new Set(Object.keys(m).map(k => k.split('|')[0]))].map((cl, i) => <tr key={cl} className={i === 0 ? 'sel' : ''}><td className="mono">{cl}</td><td>{clasNom(cl)}</td><td className="r">{fmt(pim.filter(p => p.clas === cl).reduce((a, p) => a + p.saldo, 0))}</td><td className="r">S/.{fmt(Object.keys(m).filter(k => k.startsWith(cl + '|')).reduce((a, k) => a + m[k], 0))}</td></tr>)}</tbody></table></div>
        <div className="ds-card"><h5>META</h5><table className="tbl sm"><thead><tr><th>S. Func.</th><th>Descripción</th><th className="r">Monto</th></tr></thead><tbody>
          {Object.keys(m).map(k => { const me = k.split('|')[1]; return <tr key={k}><td className="mono">{me}</td><td>{metaNombre(ej, me)}</td><td className="r">S/.{fmt(m[k])}</td></tr>; })}</tbody></table></div>
      </div>
      <p className="muted sm">Fecha de registro {c.fecha} · Aprobación {s0.fechaAprob || '—'} · Autorizado por {s0.aut || '—'}</p>
    </> : <div className="ds-card">{mods.length ? <table className="tbl"><thead><tr><th>Sec.</th><th>Tipo</th><th>Documento</th><th>Fecha</th><th className="r">Monto</th><th>Estado</th><th /></tr></thead><tbody>
      {mods.map(x => <tr key={x.sec}><td className="mono">{pad(x.sec, 4)}</td><td>{x.tipo}</td><td>{x.doc.cod} {x.doc.num}</td><td>{x.fecha}</td><td className="r">{fmt(sumI(x.items))}</td><td><Badge e={x.estado} /></td><td className="nowrap">{x.estado === 'REGISTRADO' && <><Btn sm icon="send" onClick={() => enviar(x.sec, x.tipo)}>Enviar</Btn> <Btn sm v="g" onClick={() => descartar(x.sec)}>Descartar</Btn></>}</td></tr>)}</tbody></table>
      : <Vacio titulo="Sin modificaciones" texto="No se encontraron modificaciones (ampliaciones, rebajas o anulación)." icono="folder" />}</div>}
  </div>;
}
const rubrosCtx = (ej: Ejecutora): [string, string][] => [...new Set(CASOS[ej.id].pim.map(p => p[1]))].map(r => [r, rubroNom(r)]);
type Fila = Item & { montoTxt: string };

function FormCertificado({ ej, cert, cerrar }: { ej: Ejecutora; cert?: Certificado; cerrar: (id?: string) => void }) {
  const sc = CASOS[ej.id].subcasos.find(s => s.id === ej.sub)!;
  const [d, setD] = useState({ doc: cert?.doc.cod || '086', num: cert?.doc.num || '', fecha: cert?.doc.fecha || ej.fechaSis, rubro: cert?.rubro || (sc.ingreso ? rubrosCtx(ej)[0][0] : sc.rubro), tipoCert: cert?.tipoCert || 'OTROS', disp: cert?.disp || '', justif: cert?.justif || '' });
  const [items, setItems] = useState<Fila[]>((cert?.secs[0].items || []).map(i => ({ ...i, montoTxt: String(i.monto) })));
  const [pca, setPca] = useState(false);
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  const pim = pimRows(ej, d.rubro);
  const total = items.reduce((a, i) => a + num(i.montoTxt), 0);
  const agregar = async () => { const r = await seleccionarMeta(ej, d.rubro); if (!r) return; if (items.some(i => i.clas === r.clas && i.meta === r.meta)) { useApp.getState().avisar('El clasificador y la meta ya están registrados.', 'err'); return; } setItems([...items, { ...r, monto: 0, montoTxt: '0.00' }]); };
  const grabar = async () => {
    if (!(await confirmar(cert ? '¿Grabar los cambios del certificado?' : '¿Grabar el registro de nuevo certificado?'))) return;
    const r = await intentar(() => api.cert.grabar({ ejecutora: ej.id, id: cert?.id, doc: { cod: d.doc, num: d.num, fecha: d.fecha, serie: '' }, rubro: d.rubro, tipoCert: d.tipoCert, disp: d.disp, justif: d.justif, items: items.map(i => ({ clas: i.clas, meta: i.meta, monto: num(i.montoTxt) })) }), cert ? 'Se ha actualizado el certificado...' : 'Se ha registrado el certificado...');
    if (r) { useApp.getState().avisar('Número: ' + pad(r.num, 5), 'info'); cerrar(r.id); }
  };
  const genericas = [...new Set(CASOS[ej.id].pim.map(p => p[2].split('.').slice(0, 2).join('.')))];
  return <>
    <Card form><Encabezado titulo={cert ? 'MODIFICAR CERTIFICADO Nº ' + pad(cert.num, 5) : 'NUEVO CERTIFICADO'} acciones={<><Btn v="g" icon="x" onClick={() => cerrar()}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
      <Grid>
        <Lista label="Documento" c={6} req value={d.doc} onChange={set('doc')} opciones={CAT.docsCert as [string, string][]} /><Campo label="Número" c={3} req={d.doc !== '000'} value={d.num} onChange={set('num')} /><Campo label="Fecha" c={3} req value={d.fecha} onChange={set('fecha')} ph="dd/mm/aaaa" />
        <Lista label="Rubro" c={6} req value={d.rubro} onChange={v => { setD({ ...d, rubro: v }); setItems([]); }} opciones={rubrosCtx(ej)} /><Lista label="Tipo certificación" c={6} req value={d.tipoCert} onChange={set('tipoCert')} opciones={CAT.tiposCert} />
        <RO label="Fuente de financiamiento" c={6} v={ffDeRubro(d.rubro) + ' - ' + ffNom(ffDeRubro(d.rubro))} /><Lista label="Dispositivo legal" c={6} value={d.disp} onChange={set('disp')} vacio="(ninguno)" opciones={['1-LEY Nº 31953 - INDECI', '2-LEY Nº 31953 - FEN']} />
        <RO label="Moneda" v="S/. - (NUEVO SOL)" /><RO label="Tipo cambio" v="1.0000000000" /><RO label="Monto" v={fmt(total)} />
        <Campo label="Justificación" c={12} req area rows={3} value={d.justif} onChange={set('justif')} hint={MSG_JUSTIF} />
      </Grid>
      <div className="pca"><a onClick={() => setPca(!pca)}>{pca ? '▾' : '▸'} Consulta de PCA (seguimiento por genérica)</a>
        {pca && <table className="tbl sm"><thead><tr><th>Genérica</th><th className="r">PCA asignada</th><th className="r">Pedido de certificación</th><th className="r">Saldo PCA</th><th className="r">PCA priorizada</th></tr></thead><tbody>
          {genericas.map(g => { const rows = pimRows(ej).filter(x => x.clas.startsWith(g + '.')); const a = rows.reduce((s, x) => s + x.pim, 0), c = rows.reduce((s, x) => s + x.cert, 0); return <tr key={g}><td>{g} {clasNom(g)}</td><td className="r">{fmt(a)}</td><td className="r">{fmt(c)}</td><td className="r">{fmt(a - c)}</td><td className="r">{fmt(a)}</td></tr>; })}</tbody></table>}</div>
    </Card>
    <div className="two">
      <Card inner><div className="ch"><b>CLASIFICADOR</b></div><table className="tbl"><thead><tr><th>Clasificador</th><th className="r">Saldo PCA</th><th className="r">Monto origen</th></tr></thead><tbody>
        {[...new Set(items.map(i => i.clas))].map(cl => <tr key={cl}><td className="mono" title={clasNom(cl)}>{cl}</td><td className="r">{fmt(pim.filter(p => p.clas === cl).reduce((a, p) => a + p.saldo, 0))}</td><td className="r">{fmt(items.filter(i => i.clas === cl).reduce((a, i) => a + num(i.montoTxt), 0))}</td></tr>)}
        {!items.length && <tr><td colSpan={3} className="c muted">Debe registrar clasificador.</td></tr>}</tbody></table></Card>
      <Card inner><div className="ch"><b>META</b><Btn sm icon="plus" onClick={agregar}>Agregar</Btn></div><table className="tbl"><thead><tr><th>S. Func</th><th>Clasificador</th><th className="r">Saldo PIM</th><th className="r">Monto origen</th><th /></tr></thead><tbody>
        {items.map((it, i) => { const p = pim.find(x => x.clas === it.clas && x.meta === it.meta); return <tr key={it.clas + it.meta}><td className="mono">{it.meta}</td><td className="mono">{it.clas}</td><td className="r">{fmt(p ? p.saldo : 0)}</td><td className="r"><input className="ctl num req w120" value={it.montoTxt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, montoTxt: e.target.value } : x))} /></td><td><BtnIc n="trash" title="Eliminar" onClick={() => setItems(items.filter((_, k) => k !== i))} /></td></tr>; })}
        {!items.length && <tr><td colSpan={5} className="c muted">No registra meta.</td></tr>}</tbody></table></Card>
    </div></>;
}

function FormModCert({ ej, cert, tipo, cerrar }: { ej: Ejecutora; cert: Certificado; tipo: 'AMPLIACION' | 'REBAJA' | 'ANULACION'; cerrar: () => void }) {
  const sal = certSaldo(ej, cert);
  const inicial: Fila[] = tipo === 'AMPLIACION' ? cert.secs[0].items.map(i => ({ ...i, monto: 0, montoTxt: '0.00' })) : mapToItems(sal).filter(i => i.monto > 0).map(i => ({ ...i, montoTxt: tipo === 'ANULACION' ? String(i.monto) : '0.00' }));
  const [items, setItems] = useState<Fila[]>(inicial);
  const [d, setD] = useState({ doc: '086', num: '', fecha: ej.fechaSis });
  const pim = pimRows(ej, cert.rubro);
  const titulo = { AMPLIACION: 'AMPLIAR CERTIFICACIÓN', REBAJA: 'REBAJAR CERTIFICACIÓN', ANULACION: 'ANULAR CERTIFICACIÓN' }[tipo];
  const grabar = async () => {
    if (!(await confirmar(tipo === 'AMPLIACION' ? '¿Grabar el registro de ampliar certificación?' : tipo === 'REBAJA' ? '¿Grabar el registro de rebajar certificación?' : '¿Desea guardar la anulación de certificación?'))) return;
    const r = await intentar(() => api.cert.modificacion({ ejecutora: ej.id, certId: cert.id, tipo, doc: { cod: d.doc, num: d.num, fecha: d.fecha, serie: '' }, items: items.map(i => ({ clas: i.clas, meta: i.meta, monto: num(i.montoTxt) })) }), tipo === 'AMPLIACION' ? 'Se ha ampliado el certificado...' : tipo === 'REBAJA' ? 'Se ha rebajado el certificado...' : 'Se ha anulado el certificado...', 'Número: ' + pad(cert.num, 5) + ' · envíe la modificación desde la pestaña Modificaciones');
    if (r !== null) cerrar();
  };
  if (tipo !== 'AMPLIACION' && !inicial.length) return <Card><Vacio titulo="Sin saldo libre" texto="El certificado no tiene saldo libre: todo está comprometido." icono="warn" /><div className="mact"><Btn onClick={cerrar}>Volver</Btn></div></Card>;
  return <><Card form><Encabezado titulo={titulo} sub={'CERTIFICADO Nº ' + pad(cert.num, 5) + ' · Monto vigente S/ ' + fmt(mapTot(certMap(cert)))} acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <Grid><RO label="Rubro" c={6} v={cert.rubro + ' - ' + rubroNom(cert.rubro)} /><RO label="Tipo certificación" c={6} v={cert.tipoCert} /><RO label="Justificación" c={12} v={cert.justif} />
      <Lista label="Documento" c={6} req value={d.doc} onChange={v => setD({ ...d, doc: v })} opciones={CAT.docsCert as [string, string][]} /><Campo label="Número" c={3} req value={d.num} onChange={v => setD({ ...d, num: v })} /><Campo label="Fecha" c={3} req value={d.fecha} onChange={v => setD({ ...d, fecha: v })} /></Grid></Card>
    <Card inner><div className="ch"><b>META / CLASIFICADOR</b>{tipo === 'AMPLIACION' && <Btn sm icon="plus" onClick={async () => { const r = await seleccionarMeta(ej, cert.rubro); if (r && !items.some(i => i.clas === r.clas && i.meta === r.meta)) setItems([...items, { ...r, monto: 0, montoTxt: '0.00' }]); }}>Agregar</Btn>}</div>
      <table className="tbl"><thead><tr><th>S. Func</th><th>Clasificador</th><th>Descripción</th><th className="r">{tipo === 'AMPLIACION' ? 'Saldo PIM' : 'Saldo certificado'}</th><th className="r">{tipo === 'AMPLIACION' ? 'Monto a ampliar' : tipo === 'REBAJA' ? 'Monto a rebajar' : 'Monto a anular'}</th></tr></thead><tbody>
        {items.map((it, i) => { const p = pim.find(x => x.clas === it.clas && x.meta === it.meta); return <tr key={i}><td className="mono">{it.meta}</td><td className="mono">{it.clas}</td><td>{clasNom(it.clas)}</td><td className="r">{fmt(tipo === 'AMPLIACION' ? (p ? p.saldo : 0) : it.monto)}</td><td className="r">{tipo === 'ANULACION' ? fmt(num(it.montoTxt)) : <input className="ctl num req w120" value={it.montoTxt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, montoTxt: e.target.value } : x))} />}</td></tr>; })}
        <tr className="tot"><td colSpan={4}>TOTAL</td><td className="r">{fmt(items.reduce((a, i) => a + num(i.montoTxt), 0))}</td></tr></tbody></table></Card></>;
}
