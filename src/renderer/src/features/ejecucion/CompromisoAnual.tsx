/* Compromiso anual: certificados aprobados, secuencias, inserción, modificación, ampliación, rebaja y anulación. */
import { useState } from 'react';
import { useApp, intentar } from '../../store';
import { api } from '../../api';
import { PanelLista, useFiltrado } from '../../components/Shell';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista, Menu3, RO, Sumas, Vacio } from '../../components/ui';
import { confirmar } from '../../components/Dialogos';
import { seleccionarProveedor } from '../../components/Selectores';
import { Icon } from '../../components/Icon';
import type { Certificado, CompromisoAnual as CA, Ejecutora, Item } from '@shared/types';
import { CAT } from '@shared/catalogo';
import { caMap, caMonto, caSaldo, caUsado, certComprometido, certEstado, certMap, certSaldo, vivo } from '@shared/domain/saldos';
import { MSG_JUSTIF } from '@shared/domain/reglas';
import { addMap, clasNom, docNom, fmt, mapToItems, mapTot, num, pad, r2, rubroNom, sumI, tipoOpNom } from '@shared/util';

type Modo = null | { t: 'nuevo'; certId: string } | { t: 'editar'; id: string } | { t: 'AMPLIACION' | 'REBAJA' | 'ANULACION'; id: string };
type Fila = Item & { saldo: number; montoTxt: string };

export function CompromisoAnual() {
  const { ej, sel, seleccionar } = useApp();
  const { porMes, porNum, orden } = useFiltrado();
  const [modo, setModo] = useState<Modo>(null);
  const e = ej!;
  const lista = e.certs.filter(c => certEstado(c) === 'APROBADO' && porMes(c) && porNum(c.num)).sort(orden);
  const cert = e.certs.find(c => c.id === sel.ca);
  let det;
  if (modo?.t === 'nuevo') det = <FormCA ej={e} cert={e.certs.find(c => c.id === modo.certId)!} cerrar={() => setModo(null)} />;
  else if (modo?.t === 'editar') { const a = e.cas.find(x => x.id === modo.id)!; det = <FormCA ej={e} cert={e.certs.find(c => c.id === a.certId)!} ca={a} cerrar={() => setModo(null)} />; }
  else if (modo) det = <FormModCA ej={e} ca={e.cas.find(x => x.id === modo.id)!} tipo={modo.t} cerrar={() => setModo(null)} />;
  else det = cert ? <DetalleCA ej={e} c={cert} setModo={setModo} /> : <Vacio titulo="Compromiso Anual" texto="Aparecen todos los certificados aprobados. Seleccione el certificado para registrar el compromiso anual." />;
  return <>
    <PanelLista titulo="Compromiso Anual" ph="Buscar número certificado" total={lista.length} etiqueta="certificados aprobados">
      {lista.map(c => { const on = sel.ca === c.id; const cas = e.cas.filter(a => a.certId === c.id && vivo(a.estado)); return <div key={c.id}>
        <div className={'li' + (on ? ' on' : '')} onClick={() => { setModo(null); seleccionar('ca', c.id); }}><span className="ic"><Icon n="doc" /></span><div className="lib"><b>{pad(c.num, 5)}</b><small>Saldo S/ {fmt(mapTot(certSaldo(e, c)))} · {cas.length} CA</small></div></div>
        {on && <div className="lix"><div><span className="mono">0001</span> CERTIFICACIÓN <i>APROBADO</i></div>{cas.map((a, i) => <div key={a.id}><span className="mono">{pad(i + 2, 4)}</span> COMPROMISO ANUAL <i>{a.estado}</i></div>)}</div>}</div>; })}
    </PanelLista>
    <div className="detail">{det}</div></>;
}

function DetalleCA({ ej, c, setModo }: { ej: Ejecutora; c: Certificado; setModo: (m: Modo) => void }) {
  const { setReporte, irPantalla } = useApp();
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});
  const tot = mapTot(certMap(c)), comp = mapTot(certComprometido(ej, c)), sal = r2(tot - comp);
  const cas = ej.cas.filter(a => a.certId === c.id);
  const enviar = async (a: CA) => { if (await confirmar('Enviar el registro', { icono: 'send' })) intentar(() => api.flujo.enviar({ k: 'ca', x: ej.id, id: a.id }), 'El compromiso anual fue enviado'); };
  const descartar = async (a: CA) => { if (await confirmar('¿Descartar el compromiso anual?', { icono: 'trash', ok: 'Descartar', detalle: 'Se recupera el marco presupuestal del certificado.' })) intentar(() => api.flujo.descartar({ k: 'ca', x: ej.id, id: a.id }), 'El compromiso anual fue descartado'); };
  return <Card>
    <Encabezado titulo={'CERTIFICADO Nº ' + pad(c.num, 5)} sub="Cabecera del certificado aprobado" acciones={<Btn v="p" disabled={sal <= 0} onClick={() => setModo({ t: 'nuevo', certId: c.id })}>Insertar Compromiso</Btn>} />
    <Grid><RO label="Documento" v={c.doc.cod + ' - ' + docNom(c.doc.cod)} /><RO label="Número" v={c.doc.num} /><RO label="Fecha" v={c.doc.fecha} /><RO label="Rubro" c={6} v={c.rubro + ' - ' + rubroNom(c.rubro)} /><RO label="Referencia (tipo certificación)" c={6} v={c.tipoCert} /></Grid>
    <Sumas items={[['Monto certificado', tot], ['Comprometido', comp], ['Saldo por comprometer', sal, true]]} />
    <h4>Secuencias</h4>
    <table className="tbl"><thead><tr><th>Sec.</th><th>Registro</th><th>Tipo op.</th><th>Proveedor</th><th className="r">Monto</th><th>Estado</th><th>Acciones</th><th /></tr></thead><tbody>
      <tr><td className="mono">0001</td><td>CERTIFICACIÓN{c.secs.length > 1 ? ' (CON MODIFICACIONES)' : ''}</td><td>—</td><td>—</td><td className="r">{fmt(tot)}</td><td><Badge e="APROBADO" /></td><td /><td /></tr>
      {cas.map((a, i) => { const reg = a.estado === 'REGISTRADO', apr = a.estado === 'APROBADO', ex = abierto[a.id]; const mm = caMap(a), um = caUsado(ej, a);
        return [<tr key={a.id} className={ex ? 'xon' : ''}><td className="mono">{pad(i + 2, 4)}</td><td>COMPROMISO ANUAL Nº {pad(a.num, 5)}</td><td>{a.tipoOp}</td><td>{a.prov.num}</td><td className="r">{fmt(caMonto(a) || sumI(a.items))}</td><td><Badge e={a.estado} /></td>
          <td className="nowrap">{reg && <Btn sm icon="send" onClick={() => enviar(a)}>Enviar</Btn>}<Menu3 opciones={[['Modificar', () => setModo({ t: 'editar', id: a.id }), !reg], ['Descartar', () => descartar(a), !reg], ['Anular', () => setModo({ t: 'ANULACION', id: a.id }), !apr], ['Ampliar', () => setModo({ t: 'AMPLIACION', id: a.id }), !apr], ['Rebajar', () => setModo({ t: 'REBAJA', id: a.id }), !apr]]} /></td>
          <td><button className="lnk" onClick={() => setAbierto({ ...abierto, [a.id]: !ex })}>{ex ? 'Ocultar' : 'Detalles'}</button></td></tr>,
        ex && <tr key={a.id + 'x'} className="xrow"><td colSpan={8}><div className="xbox">
          <Grid><RO label="Compromiso anual Nº" c={3} v={pad(a.num, 5)} /><RO label="Tipo de operación" c={9} v={a.tipoOp + ' - ' + tipoOpNom(a.tipoOp)} /><RO label="Documento" c={6} v={a.doc.cod + ' - ' + docNom(a.doc.cod)} /><RO label="Número" c={3} v={a.doc.num} /><RO label="Fecha" c={3} v={a.doc.fecha} />
            <RO label="Proveedor" c={8} v={a.prov.tipo + ' ' + a.prov.num + ' - ' + a.prov.nom} /><RO label="Moneda" v="S/. (NUEVO SOL)" /><RO label="Justificación" c={12} v={a.justif} /><RO label="Fecha de registro" v={a.fecha} /><RO label="Fecha aprobación" v={a.fechaAprob || '—'} /><RO label="Autorizado (MADAF)" v={a.aut || '—'} /></Grid>
          <table className="tbl"><thead><tr><th>Clasificador</th><th>Meta</th><th className="r">Monto CA</th><th className="r">Comprometido mensual</th><th className="r">Saldo</th></tr></thead><tbody>{Object.keys(mm).map(k => <tr key={k}><td className="mono" title={clasNom(k.split('|')[0])}>{k.split('|')[0]}</td><td>{k.split('|')[1]}</td><td className="r">{fmt(mm[k])}</td><td className="r">{fmt(um[k] || 0)}</td><td className="r">{fmt(mm[k] - (um[k] || 0))}</td></tr>)}</tbody></table>
          {a.mods.length > 0 && <><h4>Modificaciones del compromiso anual</h4><table className="tbl"><thead><tr><th>Nº</th><th>Tipo</th><th>Documento</th><th className="r">Monto</th><th>Estado</th><th /></tr></thead><tbody>{a.mods.map(md => <tr key={md.n}><td>{md.n}</td><td>{md.tipo}</td><td>{md.doc.cod} {md.doc.num}</td><td className="r">{fmt(sumI(md.items))}</td><td><Badge e={md.estado} /></td><td>{md.estado === 'REGISTRADO' && <><Btn sm icon="send" onClick={async () => { if (await confirmar('Enviar el registro', { icono: 'send' })) intentar(() => api.flujo.enviar({ k: 'cam', x: ej.id, id: a.id, n: md.n }), { AMPLIACION: 'La ampliación fue enviada.', REBAJA: 'La rebaja fue enviada.', ANULACION: 'La anulación fue enviada.' }[md.tipo]); }}>Enviar</Btn> <Btn sm v="g" onClick={() => intentar(() => api.flujo.descartar({ k: 'cam', x: ej.id, id: a.id, n: md.n }), 'Modificación descartada')}>Descartar</Btn></>}</td></tr>)}</tbody></table></>}
          <div className="fbtn"><Btn sm icon="print" onClick={() => setReporte('ca', a.id)}>Nota de compromiso anual</Btn>{apr && <Btn sm onClick={() => irPantalla('cm')}>Ir a Compromiso Mensual ›</Btn>}</div></div></td></tr>];
      })}
    </tbody></table>
    <p className="muted sm">Los certificados descartados no se muestran. Las secuencias anuladas se visualizan solo como información.</p>
  </Card>;
}

function FormCA({ ej, cert, ca, cerrar }: { ej: Ejecutora; cert: Certificado; ca?: CA; cerrar: () => void }) {
  const sal = certSaldo(ej, cert); if (ca) addMap(sal, ca.items, 1);
  const [d, setD] = useState({ tipoOp: ca?.tipoOp || 'N', doc: ca?.doc.cod || '', num: ca?.doc.num || '', fecha: ca?.doc.fecha || ej.fechaSis, pt: ca?.prov.tipo || 'RUC', pn: ca?.prov.num || '', justif: ca?.justif || '' });
  const [items, setItems] = useState<Fila[]>(mapToItems(sal).filter(i => i.monto > 0).map(i => ({ ...i, saldo: i.monto, montoTxt: ca ? String(ca.items.find(x => x.clas === i.clas && x.meta === i.meta)?.monto || '0.00') : '0.00' })));
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  const pv = ej.provs.find(p => p.num === d.pn.trim());
  const grabar = async () => {
    if (!(await confirmar(ca ? '¿Grabar los cambios del compromiso anual?' : '¿Grabar el registro de nuevo compromiso anual?'))) return;
    const r = await intentar(() => api.ca.grabar({ ejecutora: ej.id, id: ca?.id, certId: cert.id, tipoOp: d.tipoOp, doc: { cod: d.doc, num: d.num, fecha: d.fecha, serie: '' }, provNum: d.pn, justif: d.justif, items: items.map(i => ({ clas: i.clas, meta: i.meta, monto: num(i.montoTxt) })) }), ca ? 'Se ha actualizado el compromiso anual...' : 'Se ha registrado un nuevo compromiso anual..');
    if (r) { useApp.getState().avisar('Número: ' + r.num, 'info'); cerrar(); }
  };
  return <><Card form><Encabezado titulo={'CERTIFICADO Nº ' + pad(cert.num, 5)} sub={ca ? 'MODIFICAR COMPROMISO ANUAL' : 'INSERTAR COMPROMISO ANUAL'} rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <Grid head><RO label="Documento" v={cert.doc.cod + ' - ' + docNom(cert.doc.cod)} /><RO label="Número" v={cert.doc.num} /><RO label="Fecha" v={cert.doc.fecha} /><RO label="Rubro" c={6} v={cert.rubro + ' - ' + rubroNom(cert.rubro)} /><RO label="Referencia" c={6} v={cert.tipoCert} /></Grid>
    <Grid>
      <Lista label="Tipo operación" c={12} req value={d.tipoOp} onChange={set('tipoOp')} opciones={CAT.tiposOp as [string, string][]} />
      <Lista label="Documento" c={6} req value={d.doc} onChange={set('doc')} vacio="(seleccione)" opciones={CAT.docs as [string, string][]} /><Campo label="Número" c={3} req value={d.num} onChange={set('num')} /><Campo label="Fecha" c={3} req value={d.fecha} onChange={set('fecha')} ph="dd/mm/aaaa" />
      <Lista label="Proveedor" c={2} value={d.pt} onChange={set('pt')} opciones={['RUC', 'DNI']} />
      <div className="f c3"><label>&nbsp;</label><div className="inl"><input className="ctl req" value={d.pn} placeholder="BUSCAR PROVEEDOR" onChange={e => set('pn')(e.target.value)} /><Btn v="p" sm icon="search" onClick={async () => { const p = await seleccionarProveedor(); if (p) setD({ ...d, pt: p.tipo, pn: p.num }); }} /></div></div>
      <RO label="Razón social / nombre" c={7} v={pv ? pv.nom : d.pn ? '(proveedor no registrado: use la lupa)' : ''} />
      <RO label="Moneda" v="S/. - (NUEVO SOL)" /><RO label="Tipo cambio" v="1.0000000000" /><RO label="Monto" v={fmt(items.reduce((a, i) => a + num(i.montoTxt), 0))} />
      <Campo label="Justificación" c={12} req area value={d.justif} onChange={set('justif')} hint={'Es obligatorio colocar una justificación. ' + MSG_JUSTIF} />
    </Grid></Card>
    <Card inner><div className="ch"><b>CLASIFICADOR / META</b><span><Btn sm icon="copy" onClick={() => setItems(items.map(i => ({ ...i, montoTxt: i.saldo.toFixed(2) })))}>Con origen</Btn> <Btn sm icon="reset" onClick={() => setItems(items.map(i => ({ ...i, montoTxt: '0.00' })))}>Con cero</Btn></span></div>
      <table className="tbl"><thead><tr><th>Clasificador</th><th>Descripción</th><th>S. Func</th><th className="r">Monto origen (saldo)</th><th className="r">Monto a comprometer</th></tr></thead><tbody>
        {items.map((it, i) => <tr key={i}><td className="mono">{it.clas}</td><td>{clasNom(it.clas)}</td><td className="mono">{it.meta}</td><td className="r">{fmt(it.saldo)}</td><td className="r"><input className="ctl num req w120" value={it.montoTxt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, montoTxt: e.target.value } : x))} /></td></tr>)}</tbody></table></Card></>;
}

function FormModCA({ ej, ca, tipo, cerrar }: { ej: Ejecutora; ca: CA; tipo: 'AMPLIACION' | 'REBAJA' | 'ANULACION'; cerrar: () => void }) {
  const base = tipo === 'AMPLIACION' ? certSaldo(ej, ej.certs.find(c => c.id === ca.certId)!) : caSaldo(ej, ca);
  const [items, setItems] = useState<Fila[]>(mapToItems(base).filter(i => i.monto > 0).map(i => ({ ...i, saldo: i.monto, montoTxt: tipo === 'ANULACION' ? String(i.monto) : '0.00' })));
  const [d, setD] = useState({ doc: ca.doc.cod, num: '', fecha: ej.fechaSis });
  const titulo = { AMPLIACION: 'AMPLIAR COMPROMISO ANUAL', REBAJA: 'REBAJAR COMPROMISO ANUAL', ANULACION: 'ANULAR COMPROMISO ANUAL' }[tipo];
  if (!items.length) return <Card><Vacio titulo="Sin saldo" texto={tipo === 'AMPLIACION' ? 'El certificado no tiene saldo para ampliar el compromiso.' : 'El compromiso anual no tiene saldo.'} icono="warn" /><div className="mact"><Btn onClick={cerrar}>Volver</Btn></div></Card>;
  return <><Card form><Encabezado titulo={titulo} sub={'COMPROMISO ANUAL Nº ' + pad(ca.num, 5) + ' · ' + ca.prov.nom + ' · Monto S/ ' + fmt(caMonto(ca))} acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={async () => { if (!(await confirmar('¿Grabar el registro?'))) return; const r = await intentar(() => api.ca.modificacion({ ejecutora: ej.id, caId: ca.id, tipo, doc: { cod: d.doc, num: d.num, fecha: d.fecha, serie: '' }, items: items.map(i => ({ clas: i.clas, meta: i.meta, monto: num(i.montoTxt) })) }), 'Modificación registrada. Envíela para su aprobación.'); if (r !== null) cerrar(); }}>Grabar</Btn></>} />
    <Grid><Lista label="Documento" c={6} req value={d.doc} onChange={v => setD({ ...d, doc: v })} opciones={CAT.docs as [string, string][]} /><Campo label="Número" c={3} req value={d.num} onChange={v => setD({ ...d, num: v })} /><Campo label="Fecha" c={3} req value={d.fecha} onChange={v => setD({ ...d, fecha: v })} /></Grid></Card>
    <Card inner><table className="tbl"><thead><tr><th>Clasificador</th><th>S. Func</th><th className="r">{tipo === 'AMPLIACION' ? 'Saldo del certificado' : 'Saldo del compromiso'}</th><th className="r">Monto</th></tr></thead><tbody>
      {items.map((it, i) => <tr key={i}><td className="mono">{it.clas}</td><td>{it.meta}</td><td className="r">{fmt(it.saldo)}</td><td className="r">{tipo === 'ANULACION' ? fmt(it.saldo) : <input className="ctl num req w120" value={it.montoTxt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, montoTxt: e.target.value } : x))} />}</td></tr>)}</tbody></table></Card></>;
}
