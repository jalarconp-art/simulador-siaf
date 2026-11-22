/* Registro › Certificación de fase pagado (Tipos de pago otros): giros aprobados cuyo medio no es abono en cuenta,
   transferencia CCI ni OPE (cheque, carta orden, retenciones, SUNAT, AFP...). El usuario certifica la fecha y el
   documento del pago; el sistema registra la secuencia de fase Pagado (P). */
import { useState } from 'react';
import { useApp, intentar } from '../../store';
import { api } from '../../api';
import { PanelLista } from '../../components/Shell';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista, Nota, RO, Sumas, TablaItems, Vacio } from '../../components/ui';
import { confirmar } from '../../components/Dialogos';
import { Icon } from '../../components/Icon';
import type { Expediente, ExpSec } from '@shared/types';
import { fmt, pad, sumI } from '@shared/util';

/** Medios confirmados por el banco: no pasan por esta opción. */
const AUTOMATICOS = ['ABONO EN CUENTA', 'TRANSFERENCIA INTERBANCARIA (CCI)', 'OPE - ORDEN DE PAGO ELECTRONICA'];
export const esPagoOtros = (s: ExpSec) => s.fase === 'G' && !!s.giro && !AUTOMATICOS.includes(s.giro.medio);

export function PagadoOtros() {
  const { ej, filtros } = useApp();
  const [sel, setSel] = useState<string | null>(null);
  const [situacion, setSituacion] = useState('PENDIENTES');
  const e = ej!;
  const giros: { exp: Expediente; s: ExpSec; pago?: ExpSec }[] = [];
  e.exps.forEach(exp => exp.secs.filter(s => esPagoOtros(s) && s.estado === 'APROBADO').forEach(s => giros.push({ exp, s, pago: exp.secs.find(p => p.fase === 'P' && p.ref === s.sec) })));
  const lista = giros
    .filter(g => situacion === 'TODOS' || (situacion === 'PENDIENTES' ? !g.s.pagado : g.s.pagado))
    .filter(g => filtros.mes === 'TODOS' || g.s.mes === +filtros.mes)
    .filter(g => !filtros.q || pad(g.exp.num, 10).includes(filtros.q) || String(g.exp.num).includes(filtros.q))
    .sort((a, b) => (filtros.asc ? 1 : -1) * (a.exp.num - b.exp.num || a.s.sec - b.s.sec));
  const g = giros.find(x => x.exp.id + ':' + x.s.sec === sel);
  return <><PanelLista titulo="Certificación de fase pagado" ph="Buscar número de expediente" total={lista.length} etiqueta="giros">
    <div className="lp-filtro"><label>Situación<select className="ctl sm" value={situacion} onChange={ev => setSituacion(ev.target.value)}><option value="PENDIENTES">PENDIENTES DE PAGADO</option><option value="PAGADOS">PAGADO CERTIFICADO</option><option value="TODOS">TODOS</option></select></label></div>
    {lista.map(x => { const k = x.exp.id + ':' + x.s.sec; return <div key={k} className={'li' + (sel === k ? ' on' : '')} onClick={() => setSel(k)}><span className="ic"><Icon n="bank" /></span>
      <div className="lib"><b>{pad(x.exp.num, 10)}-{pad(x.s.sec, 4)}</b><small>{x.s.giro!.medio} · S/ {fmt(sumI(x.s.items) - sumI(x.s.giro!.ret))}</small></div><Badge e={x.s.pagado ? 'PAGADO' : 'PENDIENTE'} /></div>; })}
  </PanelLista>
    <div className="detail">{g ? <Detalle exp={g.exp} s={g.s} pago={g.pago} key={sel} /> : <Vacio titulo="Detalle del giro" texto="Para poder certificar la fase pagado, Usted debe seleccionar un giro de la lista izquierda. Se listan los giros aprobados con tipo de pago distinto al abono en cuenta." icono="bank" />}</div></>;
}

function Detalle({ exp, s, pago }: { exp: Expediente; s: ExpSec; pago?: ExpSec }) {
  const { ej } = useApp();
  const [d, setD] = useState({ fechaPago: s.doc.fecha || s.fecha, tipoDoc: s.giro!.medio === 'CHEQUE' ? 'CHEQUE' : s.giro!.medio === 'CARTA ORDEN' ? 'CARTA ORDEN' : 'CONSTANCIA DE PAGO', docPago: '', observacion: '' });
  const bruto = sumI(s.items), ret = sumI(s.giro!.ret);
  const certificar = async () => {
    if (!(await confirmar('¿Certificar la fase pagado del giro?', { icono: 'bank', ok: 'Certificar', detalle: 'Expediente ' + pad(exp.num, 10) + ' secuencia ' + pad(s.sec, 4) + ' · ' + s.giro!.medio })) ) return;
    intentar(() => api.gir.pagado({ ejecutora: ej!.id, expId: exp.id, sec: s.sec, fechaPago: d.fechaPago, docPago: d.tipoDoc + ' ' + d.docPago, observacion: d.observacion }), 'Se certificó la fase pagado del giro.');
  };
  return <Card><Encabezado titulo={'EXPEDIENTE Nº ' + pad(exp.num, 10)} sub={<>Girado secuencia {pad(s.sec, 4)} · <Badge e={s.pagado ? 'PAGADO' : 'PENDIENTE'} /></>} acciones={!s.pagado && <Btn v="p" icon="check" onClick={certificar}>Certificar pagado</Btn>} />
    <Grid><RO label="Medio de pago (tipo de pago otros)" c={6} v={s.giro!.medio} /><RO label="Documento del giro" c={3} v={s.doc.num} /><RO label="Fecha del giro" c={3} v={s.doc.fecha || s.fecha} />
      <RO label="Beneficiario" c={12} v={s.giro!.benef.tipo + ' ' + s.giro!.benef.num + ' - ' + s.giro!.benef.nom} /></Grid>
    <Sumas items={[['Monto girado', bruto], ['Retenciones', ret], ['Neto a pagar', bruto - ret, true]]} />
    {s.pagado ? <><h4>Fase pagado certificada</h4><Grid><RO label="Secuencia" c={3} v={pago ? pad(pago.sec, 4) : ''} /><RO label="Fecha de pago" c={3} v={pago?.doc.fecha || ''} /><RO label="Documento" c={6} v={pago?.doc.num || ''} /><RO label="Notas" c={12} v={pago?.notas || ''} /></Grid></>
      : <><h4>Datos del pago</h4><Grid>
        <Campo label="Fecha de pago / cobro" c={3} req ph="dd/mm/aaaa" value={d.fechaPago} onChange={v => setD({ ...d, fechaPago: v })} />
        <Lista label="Documento" c={4} value={d.tipoDoc} onChange={v => setD({ ...d, tipoDoc: v })} opciones={['CHEQUE', 'CARTA ORDEN', 'CONSTANCIA DE PAGO', 'CONSTANCIA DE RETENCION', 'PDT PLAME / FORMULARIO SUNAT', 'PLANILLA AFPNET']} />
        <Campo label="Número" c={5} req value={d.docPago} onChange={v => setD({ ...d, docPago: v })} />
        <Campo label="Observación" c={12} area value={d.observacion} onChange={v => setD({ ...d, observacion: v })} /></Grid>
        <Nota>Para los giros con abono en cuenta, transferencia interbancaria u OPE el pagado lo confirma el banco. Para los demás tipos de pago (cheque, carta orden, retenciones, pagos a SUNAT o AFP) el usuario certifica la fase pagado indicando la fecha y el documento del pago.</Nota></>}
    <TablaItems items={s.items} /></Card>;
}
