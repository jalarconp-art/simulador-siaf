/* Consultas (Contratos, Asignación de Tesoro Público) y Reportes (Certificación y Compromiso Anual,
   Transferencia Interbancaria) del Módulo de Ejecución Presupuestal, con salida a Excel (CSV) y PDF. */
import { useState, type ReactNode } from 'react';
import { useApp } from '../../store';
import { api } from '../../api';
import { PanelLista, useFiltrado } from '../../components/Shell';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista, RO, Sumas, TablaItems, Vacio } from '../../components/ui';
import { Icon } from '../../components/Icon';
import type { CompromisoAnual, Ejecutora } from '@shared/types';
import { CASOS } from '@shared/casos';
import { CAT, MESES } from '@shared/catalogo';
import { caMonto, certEstado, certMap, expSaldos, pimRows } from '@shared/domain/saldos';
import { clasNom, docNom, fmt, mapTot, pad, rubroNom, sumI } from '@shared/util';

const ESTADOS = ['TODOS', 'REGISTRADO', 'EN VERIFICACION', 'ENVIADO A OPP', 'PENDIENTE DE FIRMA', 'APROBADO', 'RECHAZADO', 'DESCARTADO', 'ANULADO'];

async function exportar(nombre: string, cab: string[], filas: (string | number)[][], titulo: string, pdf: boolean) {
  const st = useApp.getState();
  if (!filas.length) { st.avisar('No hay datos para exportar. Pulse Buscar.', 'err'); return; }
  if (!pdf) {
    const q = (v: string | number) => '"' + String(v).replace(/"/g, '""') + '"';
    const r = await api.escritorio.guardarTexto(nombre + '.csv', '﻿' + [cab, ...filas].map(f => f.map(q).join(';')).join('\r\n'), 'csv');
    if (r.ok) st.avisar('Archivo Excel (CSV) generado.', 'ok', String(r.data));
    return;
  }
  const d = CASOS[st.ejecutoraId];
  const html = `<div class="pt"><b>SIAF - SIMULADOR ACADÉMICO</b><br>${d.entidad.secEjec} - ${d.entidad.ueNom}</div><h3 class="sec">${titulo}</h3>
    <table class="tbl"><thead><tr>${cab.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const r = await api.escritorio.pdf(html, nombre + '.pdf');
  if (r.ok) st.avisar('PDF generado.', 'ok', String(r.data));
}

/** Panel izquierdo de reportes: periodo, criterios, Limpiar/Buscar y Excel/PDF. */
function PanelReporte({ titulo, children, limpiar, buscar, excel, pdf }: { titulo: string; children: ReactNode; limpiar: () => void; buscar: () => void; excel: () => void; pdf: () => void }) {
  return <div className="listp"><div className="lp-head"><b>{titulo}</b></div><div className="lp-busq">{children}
    <div className="lp-btns fila"><Btn v="g" icon="reset" full onClick={limpiar}>Limpiar</Btn><Btn v="p" icon="search" full onClick={buscar}>Buscar</Btn></div>
    <div className="lp-btns fila"><Btn icon="download" full onClick={excel}>Excel</Btn><Btn icon="download" full onClick={pdf}>PDF</Btn></div></div></div>;
}
function Periodo({ mes, setMes }: { mes: string; setMes: (v: string) => void }) {
  const { ejecutoraId } = useApp();
  return <div className="lp-per sola"><span><Icon n="list" /> Periodo</span><select value={mes} onChange={e => setMes(e.target.value)}><option value="TODOS">TODOS</option>{MESES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}</select><select disabled><option>{CASOS[ejecutoraId].anio}</option></select></div>;
}

/* ------------------------- Consultas › Contratos ------------------------- */
const totalesCA = (ej: Ejecutora, ca: CompromisoAnual) => {
  const exps = ej.exps.filter(e => e.caId === ca.id);
  const t = exps.reduce((s, e) => { const x = expSaldos(e).tot; return { C: s.C + x.C, D: s.D + x.D, G: s.G + x.G }; }, { C: 0, D: 0, G: 0 });
  return { monto: caMonto(ca), ...t, exps };
};
export function Contratos() {
  const { ej } = useApp();
  const { porMes, orden, f } = useFiltrado();
  const [sel, setSel] = useState<string | null>(null);
  const e = ej!;
  const lista = e.cas.filter(a => porMes(a) && (!f.q || pad(a.num, 5).includes(f.q) || (a.doc.num + ' ' + a.prov.nom).toUpperCase().includes(f.q.toUpperCase()))).sort(orden);
  const ca = e.cas.find(a => a.id === sel);
  let det = <Vacio titulo="Detalle del contrato" texto="Para poder visualizar el detalle, Usted debe seleccionar un contrato de la lista izquierda" />;
  if (ca) {
    const t = totalesCA(e, ca); const c = e.certs.find(x => x.id === ca.certId);
    det = <Card><Encabezado titulo={'CONTRATO ' + ca.doc.num} sub={<>Compromiso anual Nº {pad(ca.num, 5)} · <Badge e={ca.estado} /></>} />
      <Grid><RO label="Documento" c={6} v={ca.doc.cod + ' - ' + docNom(ca.doc.cod)} /><RO label="Número" c={3} v={ca.doc.num} /><RO label="Fecha" c={3} v={ca.doc.fecha} />
        <RO label="Proveedor" c={8} v={ca.prov.tipo + ' ' + ca.prov.num + ' - ' + ca.prov.nom} /><RO label="Certificado" c={4} v={c ? pad(c.num, 10) : ''} /><RO label="Justificación" c={12} v={ca.justif} /></Grid>
      <Sumas items={[['Monto del contrato (CA)', t.monto], ['Comprometido (mensual)', t.C], ['Devengado', t.D], ['Girado', t.G], ['Saldo por comprometer', t.monto - t.C, true]]} />
      <TablaItems items={ca.items} />
      <h4>Expedientes del contrato</h4>
      <table className="tbl sm"><thead><tr><th>Expediente</th><th>Mes</th><th className="r">Comprometido</th><th className="r">Devengado</th><th className="r">Girado</th></tr></thead><tbody>
        {t.exps.map(x => { const s = expSaldos(x).tot; return <tr key={x.id}><td className="mono">{pad(x.num, 10)}</td><td>{MESES[x.mes - 1]}</td><td className="r">{fmt(s.C)}</td><td className="r">{fmt(s.D)}</td><td className="r">{fmt(s.G)}</td></tr>; })}
        {!t.exps.length && <tr><td colSpan={5} className="c muted">Sin expedientes registrados.</td></tr>}</tbody></table></Card>;
  }
  return <><PanelLista titulo="Contratos" ph="Buscar número de contrato o proveedor" total={lista.length} etiqueta="contratos">
    {lista.map(a => <div key={a.id} className={'li' + (sel === a.id ? ' on' : '')} onClick={() => setSel(a.id)}><span className="ic"><Icon n="doc" /></span><div className="lib"><b>{a.doc.num || 'CA ' + pad(a.num, 5)}</b><small>{a.prov.nom} · S/ {fmt(caMonto(a))}</small></div><Badge e={a.estado} /></div>)}
  </PanelLista><div className="detail">{det}</div></>;
}

/* ------------------------- Consultas › Asignación de Tesoro Público ------------------------- */
export function AsignacionTesoro() {
  const { ej } = useApp();
  const [rubro, setRubro] = useState('TODOS');
  const e = ej!;
  const filas = pimRows(e, rubro === 'TODOS' ? undefined : rubro).map(p => {
    const k = p.clas + '|' + p.meta; let comp = 0, dev = 0, gir = 0;
    e.cas.filter(a => a.estado === 'APROBADO' && e.certs.find(c => c.id === a.certId)?.rubro === p.rubro).forEach(a => a.items.forEach(i => { if (i.clas + '|' + i.meta === k) comp += i.monto; }));
    e.exps.filter(x => x.rubro === p.rubro).forEach(x => x.secs.filter(s => s.estado === 'APROBADO').forEach(s => s.items.forEach(i => { if (i.clas + '|' + i.meta === k) { if (s.fase === 'D' && !s.rend) dev += i.monto; if (s.fase === 'G') gir += i.monto; } })));
    return { ...p, comp, dev, gir };
  });
  const tot = (k: 'pim' | 'cert' | 'comp' | 'dev' | 'gir' | 'saldo') => filas.reduce((s, x) => s + x[k], 0);
  return <div className="detail full"><Card><Encabezado titulo="Asignación de Tesoro Público" sub={CASOS[e.id].entidad.secEjec + ' - ' + CASOS[e.id].entidad.ueNom + ' · Año ' + CASOS[e.id].anio} acciones={<>
    <Btn icon="download" onClick={() => exportar('Asignacion_Tesoro_Publico', ['Meta', 'Rubro', 'Clasificador', 'Descripción', 'PIM', 'Certificado', 'Comprometido', 'Devengado', 'Girado', 'Saldo PIM'], filas.map(x => [x.meta, x.rubro, x.clas, clasNom(x.clas), fmt(x.pim), fmt(x.cert), fmt(x.comp), fmt(x.dev), fmt(x.gir), fmt(x.saldo)]), 'ASIGNACIÓN DE TESORO PÚBLICO', false)}>Excel</Btn>
    <Btn icon="download" onClick={() => exportar('Asignacion_Tesoro_Publico', ['Meta', 'Rubro', 'Clasificador', 'Descripción', 'PIM', 'Certificado', 'Comprometido', 'Devengado', 'Girado', 'Saldo PIM'], filas.map(x => [x.meta, x.rubro, x.clas, clasNom(x.clas), fmt(x.pim), fmt(x.cert), fmt(x.comp), fmt(x.dev), fmt(x.gir), fmt(x.saldo)]), 'ASIGNACIÓN DE TESORO PÚBLICO', true)}>PDF</Btn></>} />
    <Grid><Lista label="Rubro" c={6} value={rubro} onChange={setRubro} opciones={[{ v: 'TODOS', t: 'TODOS' }, ...Array.from(new Set(CASOS[e.id].pim.map(p => p[1]))).map(r => ({ v: r, t: r + ' - ' + rubroNom(r) }))]} /></Grid>
    <div className="ovx"><table className="tbl"><thead><tr><th>Meta</th><th>Rubro</th><th>Clasificador</th><th>Descripción</th><th className="r">PIM</th><th className="r">Certificado</th><th className="r">Comprometido</th><th className="r">Devengado</th><th className="r">Girado</th><th className="r">Saldo PIM</th></tr></thead><tbody>
      {filas.map((x, i) => <tr key={i}><td>{x.meta}</td><td>{x.rubro}</td><td className="mono">{x.clas}</td><td className="sm">{clasNom(x.clas)}</td><td className="r">{fmt(x.pim)}</td><td className="r">{fmt(x.cert)}</td><td className="r">{fmt(x.comp)}</td><td className="r">{fmt(x.dev)}</td><td className="r">{fmt(x.gir)}</td><td className="r"><b>{fmt(x.saldo)}</b></td></tr>)}
      <tr className="tot"><td colSpan={4}>TOTAL</td><td className="r">{fmt(tot('pim'))}</td><td className="r">{fmt(tot('cert'))}</td><td className="r">{fmt(tot('comp'))}</td><td className="r">{fmt(tot('dev'))}</td><td className="r">{fmt(tot('gir'))}</td><td className="r">{fmt(tot('saldo'))}</td></tr></tbody></table></div></Card></div>;
}

/* ------------------------- Reportes › Certificación y Compromiso Anual ------------------------- */
export function ReporteCertificacion() {
  const { ej } = useApp();
  const [c, setC] = useState({ mes: 'TODOS', desde: '', hasta: '', rubro: '', estado: 'TODOS' });
  const [listo, setListo] = useState(false);
  const e = ej!;
  const filas: (string | number)[][] = [];
  if (listo) e.certs.filter(x => (c.mes === 'TODOS' || x.mes === +c.mes) && (!c.desde || x.num >= +c.desde) && (!c.hasta || x.num <= +c.hasta) && (!c.rubro || x.rubro === c.rubro) && (c.estado === 'TODOS' || certEstado(x) === c.estado)).sort((a, b) => a.num - b.num).forEach(x => {
    x.secs.forEach(s => filas.push([pad(x.num, 10) + '-' + pad(s.sec, 4), 'CERTIFICACIÓN ' + s.tipo, s.doc.cod + ' ' + s.doc.num, s.fecha, x.rubro, s.estado, fmt(sumI(s.items))]));
    e.cas.filter(a => a.certId === x.id).forEach(a => filas.push([pad(x.num, 10) + ' CA ' + pad(a.num, 5), 'COMPROMISO ANUAL', a.doc.cod + ' ' + a.doc.num, a.fecha, x.rubro, a.estado, fmt(caMonto(a))]));
  });
  const cab = ['Certificado / Sec.', 'Tipo de registro', 'Documento', 'Fecha', 'Rubro', 'Estado', 'Monto S/'];
  return <><PanelReporte titulo="Certificación y Compromiso Anual" limpiar={() => { setC({ mes: 'TODOS', desde: '', hasta: '', rubro: '', estado: 'TODOS' }); setListo(false); }} buscar={() => setListo(true)}
    excel={() => exportar('Certificacion_y_Compromiso_Anual', cab, filas, 'CERTIFICACIÓN Y COMPROMISO ANUAL', false)} pdf={() => exportar('Certificacion_y_Compromiso_Anual', cab, filas, 'CERTIFICACIÓN Y COMPROMISO ANUAL', true)}>
    <Periodo mes={c.mes} setMes={v => setC({ ...c, mes: v })} />
    <Grid><Campo label="Certificado Desde" c={6} value={c.desde} onChange={v => setC({ ...c, desde: v.replace(/\D/g, '') })} /><Campo label="Certificado Hasta" c={6} value={c.hasta} onChange={v => setC({ ...c, hasta: v.replace(/\D/g, '') })} />
      <Lista label="Rubro" c={12} value={c.rubro} onChange={v => setC({ ...c, rubro: v })} vacio="" opciones={CAT.rubros.map(r => [r[0], r[1]] as [string, string])} />
      <Lista label="Estado Registro" c={12} value={c.estado} onChange={v => setC({ ...c, estado: v })} opciones={ESTADOS} /></Grid>
  </PanelReporte>
    <div className="detail">{!listo ? <Vacio titulo="Generar Reporte" texto="Para generar un reporte, debe seleccionar los critérios deseados en el listado izquierdo." /> :
      <Card><Encabezado titulo="Certificación y Compromiso Anual" sub={filas.length + ' registro(s)'} />
        <div className="ovx"><table className="tbl"><thead><tr>{cab.map(h => <th key={h} className={h.startsWith('Monto') ? 'r' : ''}>{h}</th>)}</tr></thead><tbody>
          {filas.map((f, i) => <tr key={i}>{f.map((v, k) => <td key={k} className={k === 6 ? 'r' : k === 0 ? 'mono' : ''}>{k === 5 ? <Badge e={String(v)} /> : v}</td>)}</tr>)}
          {!filas.length && <tr><td colSpan={7} className="c muted">No se encontraron registros con los criterios seleccionados.</td></tr>}</tbody></table></div></Card>}</div></>;
}

/* ------------------------- Reportes › Transferencia Interbancaria ------------------------- */
export function ReporteTransferencia() {
  const { ej } = useApp();
  const [c, setC] = useState({ mes: 'TODOS', desde: '', hasta: '', medio: 'TODOS' });
  const [listo, setListo] = useState(false);
  const e = ej!;
  const filas: (string | number)[][] = [];
  if (listo) e.exps.filter(x => (!c.desde || x.num >= +c.desde) && (!c.hasta || x.num <= +c.hasta)).sort((a, b) => a.num - b.num).forEach(x => x.secs.filter(s => s.fase === 'G' && s.giro && (c.mes === 'TODOS' || s.mes === +c.mes) && (c.medio === 'TODOS' || s.giro.medio === c.medio)).forEach(s => {
    const bruto = sumI(s.items), ret = sumI(s.giro!.ret);
    filas.push([pad(x.num, 10) + '-' + pad(s.sec, 4), s.fecha, s.giro!.benef.tipo + ' ' + s.giro!.benef.num, s.giro!.benef.nom, s.giro!.medio, s.doc.num, fmt(bruto), fmt(ret), fmt(bruto - ret), s.estado]);
  }));
  const cab = ['Expediente / Sec.', 'Fecha', 'Documento', 'Beneficiario', 'Medio de pago', 'Comprobante', 'Monto bruto', 'Retenciones', 'Monto neto', 'Estado'];
  return <><PanelReporte titulo="Transferencia Interbancaria" limpiar={() => { setC({ mes: 'TODOS', desde: '', hasta: '', medio: 'TODOS' }); setListo(false); }} buscar={() => setListo(true)}
    excel={() => exportar('Transferencia_Interbancaria', cab, filas, 'TRANSFERENCIA INTERBANCARIA', false)} pdf={() => exportar('Transferencia_Interbancaria', cab, filas, 'TRANSFERENCIA INTERBANCARIA', true)}>
    <Periodo mes={c.mes} setMes={v => setC({ ...c, mes: v })} />
    <Grid><Campo label="Expediente Desde" c={6} value={c.desde} onChange={v => setC({ ...c, desde: v.replace(/\D/g, '') })} /><Campo label="Expediente Hasta" c={6} value={c.hasta} onChange={v => setC({ ...c, hasta: v.replace(/\D/g, '') })} />
      <Lista label="Medio de pago" c={12} value={c.medio} onChange={v => setC({ ...c, medio: v })} opciones={['TODOS', ...CAT.mediosGiro]} /></Grid>
  </PanelReporte>
    <div className="detail">{!listo ? <Vacio titulo="Generar Reporte" texto="Para generar un reporte, debe seleccionar los critérios deseados en el listado izquierdo." /> :
      <Card><Encabezado titulo="Transferencia Interbancaria" sub={filas.length + ' giro(s)'} />
        <div className="ovx"><table className="tbl sm"><thead><tr>{cab.map(h => <th key={h} className={h.startsWith('Monto') || h === 'Retenciones' ? 'r' : ''}>{h}</th>)}</tr></thead><tbody>
          {filas.map((f, i) => <tr key={i}>{f.map((v, k) => <td key={k} className={k >= 6 && k <= 8 ? 'r' : k === 0 ? 'mono' : ''}>{k === 9 ? <Badge e={String(v)} /> : v}</td>)}</tr>)}
          {!filas.length && <tr><td colSpan={10} className="c muted">No se encontraron giros con los criterios seleccionados.</td></tr>}</tbody></table></div></Card>}</div></>;
}
export const _sinUso = [certMap, mapTot];
