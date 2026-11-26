/* Reportes con formato del SIAF: Nota de Certificación, Nota de Compromiso Anual y reportes de expediente */
import { useApp } from '../../store';
import { api } from '../../api';
import { Btn, Card, Encabezado } from '../../components/ui';
import type { Certificado, CompromisoAnual, Ejecutora, Expediente, Ingreso, Item } from '@shared/types';
import { CASOS } from '@shared/casos';
import { MESES } from '@shared/catalogo';
import { caMap, certEstado, certMap, vivo } from '@shared/domain/saldos';
import { clasNom, docNom, fmt, hora, hoy, mapToItems, mapTot, pad, rubroNom, sumI, tipoOpNom } from '@shared/util';

const tt = (c: string) => { const g = c.split('.').slice(0, 2).join('.'); if (['2.6', '2.7'].includes(g)) return '6 GASTOS DE CAPITAL'; if (g === '2.8') return '7 SERVICIO DE LA DEUDA'; if (c.startsWith('1')) return 'INGRESOS PRESUPUESTARIOS'; return '5 GASTOS CORRIENTES'; };
function Jerarquia({ items }: { items: Item[] }) {
  const acc: { k: string; n: string; v: number; lv: number }[] = [];
  const add = (k: string, n: string, v: number, lv: number) => { const x = acc.find(a => a.k === k); if (x) x.v += v; else acc.push({ k, n, v, lv }); };
  items.forEach(i => { const p = i.clas.split('.'); add('tt' + tt(i.clas), tt(i.clas), i.monto, 0); for (let l = 2; l <= p.length; l++) { const c = p.slice(0, l).join('.'); add(c, c + '   ' + clasNom(c), i.monto, l - 1); } });
  return <>{acc.map(a => <tr key={a.k}><td className={'i' + a.lv}>{a.n}</td><td className="r">S/ {fmt(a.v)}</td></tr>)}</>;
}
const Cabecera = () => <table className="ph"><tbody><tr><td>SIAF - Módulo de Proceso Presupuestario<br />Versión 26.01.00</td><td className="r">Fecha : {hoy()}<br />Hora : {hora()}<br />Pág. : 1 de 1</td></tr></tbody></table>;

function NotaCert({ ej, c }: { ej: Ejecutora; c: Certificado }) {
  const e = CASOS[ej.id].entidad, s0 = c.secs[0];
  const metaDe = (m: string) => CASOS[ej.id].metas.find(x => x.sec === m);
  const tot = mapTot(certMap(c, certEstado(c) !== 'APROBADO'));
  return <><Cabecera /><h2 className="pt">CERTIFICACIÓN DE CRÉDITO PRESUPUESTARIO</h2><h3 className="pt">NOTA N° {pad(c.num, 10)}</h3><p className="pt">(EN SOLES)</p>
    <table className="pinfo"><tbody>
      <tr><td><b>DEPARTAMENTO</b></td><td>: {e.depto}</td><td><b>FECHA APROBACIÓN</b></td><td>: {s0.fechaAprob || '-'}</td></tr>
      <tr><td><b>PROVINCIA</b></td><td>: {e.prov}</td><td><b>ESTADO CERTIFICACIÓN</b></td><td>: {s0.estado}</td></tr>
      <tr><td><b>PLIEGO</b></td><td>: {e.pliego} {e.pliegoNom}</td><td><b>UNIDAD EJECUTORA</b></td><td>: {e.ue} {e.ueNom} ({e.secEjec})</td></tr>
      <tr><td><b>MES</b></td><td>: {MESES[c.mes - 1]}</td><td><b>TIPO CERTIFICACIÓN</b></td><td>: {c.tipoCert}</td></tr>
      <tr><td><b>FECHA DE DOCUMENTO</b></td><td>: {c.doc.fecha}</td><td><b>TIPO DOCUMENTO</b></td><td>: {docNom(c.doc.cod)}</td></tr>
      <tr><td><b>N° DE DOCUMENTO</b></td><td>: {c.doc.num}</td><td><b>DISPOSITIVO LEGAL</b></td><td>: {c.disp || '0-OTROS'}</td></tr></tbody></table>
    <p><b>JUSTIFICACIÓN :</b> {c.justif}</p><h4 className="pt">DETALLE DEL GASTO</h4>
    <table className="pdet"><thead><tr><th>SECUENCIA / PRG PROD/PRY ACT/AI/OBR FN DIVF GRPF / META FF RB CGTT G SG SGD ESP SPPD</th><th className="r">MONTO</th></tr></thead><tbody>
      {c.secs.filter(s => vivo(s.estado)).map(s => { const sg = s.tipo === 'REBAJA' || s.tipo === 'ANULACION' ? -1 : 1; const metas = [...new Set(s.items.map(i => i.meta))];
        return [<tr key={s.sec} className="sq"><td>{pad(s.sec, 4)}   {s.tipo}</td><td className="r">S/ {fmt(sg * sumI(s.items))}</td></tr>,
          ...metas.map(m => { const mt = metaDe(m); const its = s.items.filter(i => i.meta === m).map(i => ({ ...i, monto: sg * i.monto })); return [
            <tr key={s.sec + m + 'a'}><td>{mt?.cat}  {mt?.prod}  {mt?.act}  {mt?.fn}  {mt?.div}  {mt?.grp}</td><td className="r">S/ {fmt(sumI(its))}</td></tr>,
            <tr key={s.sec + m + 'b'}><td>{m}  {mt?.nombre}</td><td className="r">S/ {fmt(sumI(its))}</td></tr>,
            <tr key={s.sec + m + 'c'}><td>{c.ff}   {c.rubro}   {rubroNom(c.rubro)}</td><td className="r">S/ {fmt(sumI(its))}</td></tr>, <Jerarquia key={s.sec + m + 'd'} items={its} />]; })]; })}
      <tr className="tt"><td>TOTAL CERTIFICACIÓN</td><td className="r">S/ {fmt(tot)}</td></tr><tr className="tt"><td>TOTAL NOTA</td><td className="r">S/ {fmt(tot)}</td></tr></tbody></table>
    <table className="pfirm"><tbody><tr><td>______________________________<br />Jefe de la Oficina de Planeamiento y Presupuesto</td><td>______________________________<br />Responsable de certificación (SIAF)</td></tr></tbody></table></>;
}
function NotaCA({ ej, a }: { ej: Ejecutora; a: CompromisoAnual }) {
  const e = CASOS[ej.id].entidad, c = ej.certs.find(z => z.id === a.certId)!; const its = mapToItems(caMap(a));
  return <><Cabecera /><h2 className="pt">COMPROMISO ANUAL</h2><h3 className="pt">NOTA N° {pad(a.num, 10)} · CERTIFICADO N° {pad(c.num, 10)}</h3><p className="pt">(EN SOLES)</p>
    <table className="pinfo"><tbody><tr><td><b>PLIEGO / UE</b></td><td>: {e.pliego} {e.pliegoNom} / {e.ue} {e.ueNom}</td><td><b>ESTADO</b></td><td>: {a.estado}</td></tr>
      <tr><td><b>TIPO DE OPERACIÓN</b></td><td>: {a.tipoOp} - {tipoOpNom(a.tipoOp)}</td><td><b>FECHA APROBACIÓN</b></td><td>: {a.fechaAprob || '-'}</td></tr>
      <tr><td><b>DOCUMENTO</b></td><td>: {a.doc.cod} - {docNom(a.doc.cod)} N° {a.doc.num}</td><td><b>FECHA DOCUMENTO</b></td><td>: {a.doc.fecha}</td></tr>
      <tr><td><b>PROVEEDOR</b></td><td>: {a.prov.tipo} {a.prov.num} - {a.prov.nom}</td><td><b>FUENTE / RUBRO</b></td><td>: {c.ff} / {c.rubro} {rubroNom(c.rubro)}</td></tr></tbody></table>
    <p><b>JUSTIFICACIÓN :</b> {a.justif}</p><table className="pdet"><thead><tr><th>META / CLASIFICADOR</th><th className="r">MONTO</th></tr></thead><tbody>
      {[...new Set(its.map(i => i.meta))].map(m => { const x = its.filter(i => i.meta === m); return [<tr key={m} className="sq"><td>{m} {CASOS[ej.id].metas.find(z => z.sec === m)?.nombre}</td><td className="r">S/ {fmt(sumI(x))}</td></tr>, <Jerarquia key={m + 'j'} items={x} />]; })}
      <tr className="tt"><td>TOTAL COMPROMISO ANUAL</td><td className="r">S/ {fmt(sumI(its))}</td></tr></tbody></table></>;
}
function RepExp({ ej, e }: { ej: Ejecutora; e: Expediente }) {
  const ca = ej.cas.find(z => z.id === e.caId)!; const en = CASOS[ej.id].entidad;
  const fase = (f: string, r: boolean) => f === 'C' ? 'COMPROMISO MENSUAL' : f === 'D' ? (r ? 'DEVENGADO - RENDICIÓN' : 'DEVENGADO') : f === 'G' ? 'GIRADO' : f === 'P' ? 'PAGADO' : 'DEVOLUCIÓN T-6';
  return <><Cabecera /><h2 className="pt">EXPEDIENTE SIAF N° {pad(e.num, 10)}</h2>
    <table className="pinfo"><tbody><tr><td><b>UNIDAD EJECUTORA</b></td><td>: {en.secEjec} {en.ueNom}</td><td><b>TIPO DE OPERACIÓN</b></td><td>: {e.tipoOp} - {tipoOpNom(e.tipoOp)}</td></tr><tr><td><b>COMPROMISO ANUAL</b></td><td>: {pad(ca.num, 10)}</td><td><b>FUENTE / RUBRO</b></td><td>: {e.ff} / {e.rubro} {rubroNom(e.rubro)}</td></tr><tr><td><b>PROVEEDOR</b></td><td>: {ca.prov.tipo} {ca.prov.num} - {ca.prov.nom}</td><td><b>MODALIDAD</b></td><td>: {e.modalidad}</td></tr></tbody></table>
    <table className="pdet"><thead><tr><th>SEC</th><th>FASE</th><th>DOCUMENTO</th><th>FECHA</th><th>ESTADO</th><th className="r">MONTO</th></tr></thead><tbody>
      {e.secs.map(s => [<tr key={s.sec} className="sq"><td>{pad(s.sec, 4)}</td><td>{fase(s.fase, s.rend)}</td><td>{s.doc.cod} {s.doc.serie ? s.doc.serie + '-' : ''}{s.doc.num}</td><td>{s.fecha}</td><td>{s.estado}</td><td className="r">S/ {fmt(sumI(s.items))}</td></tr>,
        ...s.items.map((i, k) => <tr key={s.sec + '-' + k}><td /><td colSpan={4} className="i3">{i.meta} · {i.clas} {clasNom(i.clas)}</td><td className="r">{fmt(i.monto)}</td></tr>),
        ...(s.giro?.ret || []).map((r, k) => <tr key={s.sec + 'r' + k}><td /><td colSpan={4} className="i3">(-) {r.concepto}</td><td className="r">{fmt(r.monto)}</td></tr>)])}</tbody></table></>;
}
function RepIng({ ej, g }: { ej: Ejecutora; g: Ingreso }) {
  const en = CASOS[ej.id].entidad;
  return <><Cabecera /><h2 className="pt">EXPEDIENTE DE INGRESOS N° {pad(g.num, 10)}</h2><table className="pinfo"><tbody><tr><td><b>UNIDAD EJECUTORA</b></td><td>: {en.secEjec} {en.ueNom}</td><td><b>FUENTE / RUBRO</b></td><td>: {g.ff} / {g.rubro} {rubroNom(g.rubro)}</td></tr></tbody></table>
    <table className="pdet"><thead><tr><th>SEC</th><th>FASE</th><th>DOCUMENTO</th><th>FECHA</th><th>ESTADO</th><th className="r">MONTO</th></tr></thead><tbody>
      {g.secs.map(s => [<tr key={s.sec} className="sq"><td>{pad(s.sec, 4)}</td><td>{s.fase === 'D' ? 'DETERMINADO' : 'RECAUDADO'}</td><td>{s.doc.cod} {s.doc.num}</td><td>{s.fecha}</td><td>{s.estado}</td><td className="r">S/ {fmt(sumI(s.items))}</td></tr>, <Jerarquia key={s.sec + 'j'} items={s.items} />])}</tbody></table></>;
}

export function Reportes() {
  const { ej, reporte, setReporte, avisar } = useApp();
  const e = ej!;
  const opciones: Record<string, [string, string][]> = { cert: e.certs.map(c => [c.id, 'Certificado ' + pad(c.num, 5) + ' · ' + certEstado(c)]), ca: e.cas.map(a => [a.id, 'Compromiso anual ' + pad(a.num, 5) + ' · ' + a.estado]), exp: e.exps.map(x => [x.id, 'Expediente ' + pad(x.num, 5)]), ing: e.ings.map(g => [g.id, 'Expediente de ingresos ' + pad(g.num, 5)]) };
  const ops = opciones[reporte.t] || [];
  const id = ops.find(o => o[0] === reporte.id) ? reporte.id : ops[0]?.[0] || '';
  let doc = <p className="muted">No hay registros para este reporte.</p>;
  if (id) { if (reporte.t === 'cert') doc = <NotaCert ej={e} c={e.certs.find(c => c.id === id)!} />; if (reporte.t === 'ca') doc = <NotaCA ej={e} a={e.cas.find(a => a.id === id)!} />; if (reporte.t === 'exp') doc = <RepExp ej={e} e={e.exps.find(x => x.id === id)!} />; if (reporte.t === 'ing') doc = <RepIng ej={e} g={e.ings.find(g => g.id === id)!} />; }
  const salida = async (pdf: boolean) => { const h = document.getElementById('paper')!.innerHTML; if (pdf) { const r = await api.escritorio.pdf(h, 'Reporte_SIAF_' + e.id + '.pdf'); if (r.ok) avisar('PDF guardado.', 'ok', String(r.data)); } else api.escritorio.imprimir(h, 'Reporte SIAF'); };
  return <div className="detail full"><Card><Encabezado titulo="Notas y reportes" sub="Formato del SIAF - Módulo de Proceso Presupuestario" acciones={<><Btn icon="pdf" onClick={() => salida(true)}>Guardar PDF</Btn><Btn v="p" icon="print" onClick={() => salida(false)}>Imprimir</Btn></>} />
    <div className="inl"><select className="ctl" value={reporte.t} onChange={x => setReporte(x.target.value, '')}><option value="cert">Nota de Certificación de Crédito Presupuestario</option><option value="ca">Nota de Compromiso Anual</option><option value="exp">Reporte de expediente (compromiso mensual, devengado, girado)</option><option value="ing">Reporte de expediente de ingresos</option></select>
      <select className="ctl" value={id} onChange={x => setReporte(reporte.t, x.target.value)}>{ops.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></div>
    <div className="paper" id="paper">{doc}</div></Card></div>;
}
