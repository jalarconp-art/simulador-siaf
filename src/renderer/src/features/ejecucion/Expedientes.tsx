/* Expedientes SIAF: compromiso mensual, devengado (y rendición), girado, pagado y Papeleta T-6. */
import { useState } from 'react';
import { useApp, intentar, type Pantalla } from '../../store';
import { api } from '../../api';
import { PanelLista, useFiltrado } from '../../components/Shell';
import { Badge, Btn, BtnIc, Campo, Card, Encabezado, Grid, Lista, Menu3, RO, Seccion, Sumas, TablaItems, Vacio } from '../../components/ui';
import { confirmar } from '../../components/Dialogos';
import { generacionOperaciones, seleccionarProveedor } from '../../components/Selectores';
import { Icon } from '../../components/Icon';
import type { CompromisoAnual, Comprobante, Ejecutora, Expediente, ExpSec, Item } from '@shared/types';
import { CASOS } from '@shared/casos';
import { CAT } from '@shared/catalogo';
import { caMonto, caSaldo, esEncargo, expSaldos, secMap } from '@shared/domain/saldos';
import { addMap, clasNom, docNom, ffNom, fmt, mapToItems, mapTot, num, pad, r2, rubroNom, sumI, tipoOpNom, type Mapa } from '@shared/util';

type PExp = 'cm' | 'dev' | 'gir' | 't6';
type Modo = null | { t: 'cm1' } | { t: 'cm'; caId: string; expId?: string; sec?: number; items: Item[]; base?: Partial<CabCM> } | { t: 'cmReb'; expId: string; anular: boolean } | { t: 'dev'; expId: string; sec?: number } | { t: 'gir'; expId: string; sec?: number } | { t: 't6'; expId: string; sec?: number };
interface CabCM { modalidad: string; tipoProc: string; faseContr: string; expEnc: string }
const FASE = (s: ExpSec) => s.fase === 'C' ? (sumI(s.items) < 0 ? 'REBAJA DE COMPROMISO' : 'COMPROMISO MENSUAL') : s.fase === 'D' ? (s.rend ? 'DEVENGADO - RENDICIÓN' : 'DEVENGADO') : s.fase === 'G' ? 'GIRADO' : s.fase === 'P' ? 'PAGADO' : 'DEVOLUCIÓN T-6';
const CUENTAS: Record<string, string> = { '00': 'CUT - CUENTA PRINCIPAL DEL TESORO PÚBLICO (RECURSOS ORDINARIOS)', '09': 'CTA. CTE. RDR - BANCO DE LA NACIÓN', '18': 'CUT - RECURSOS DETERMINADOS: CANON Y SOBRECANON', '07': 'CTA. CTE. FONCOMUN - BANCO DE LA NACIÓN', '08': 'CTA. CTE. IMPUESTOS MUNICIPALES - BANCO DE LA NACIÓN', '04': 'CTA. CTE. CONTRIBUCIONES A FONDOS', '13': 'CTA. CTE. DONACIONES Y TRANSFERENCIAS', '19': 'CTA. CTE. ROOC' };
const TIT: Record<PExp, [string, string]> = { cm: ['Compromiso Mensual', 'Insertar Compromiso'], dev: ['Devengado', 'Insertar Devengado'], gir: ['Girado', 'Insertar Girado'], t6: ['Papeleta T-6', 'Registrar Papeleta T-6'] };
const metaNom = (ej: Ejecutora, m: string) => CASOS[ej.id].metas.find(x => x.sec === m)?.nombre || '';
const filasDe = (m: Mapa, actuales: Item[] = []) => mapToItems(m).filter(i => i.monto > 0).map(i => ({ clas: i.clas, meta: i.meta, origen: i.monto, monto: actuales.find(x => x.clas === i.clas && x.meta === i.meta)?.monto }));

export function Expedientes({ pantalla }: { pantalla: Pantalla }) {
  const p = pantalla as PExp;
  const { ej, sel, seleccionar } = useApp();
  const { porMes, porNum, orden } = useFiltrado();
  const [modo, setModo] = useState<Modo>(null);
  const e = ej!;
  let lista = e.exps.filter(x => porMes(x) && porNum(x.num));
  if (p === 'dev') lista = lista.filter(x => x.secs.some(s => s.fase === 'C' && s.estado === 'APROBADO'));
  if (p === 'gir') lista = lista.filter(x => x.secs.some(s => s.fase === 'D' && s.estado === 'APROBADO'));
  if (p === 't6') lista = lista.filter(x => x.secs.some(s => s.fase === 'G' && s.estado === 'APROBADO'));
  lista.sort(orden);
  const exp = e.exps.find(x => x.id === sel.exp);
  let det;
  if (modo?.t === 'cm1') det = <FormCM1 ej={e} cerrar={() => setModo(null)} siguiente={(caId, items, base) => setModo({ t: 'cm', caId, items, base })} />;
  else if (modo?.t === 'cm') det = <FormCM ej={e} m={modo} cerrar={id => { setModo(null); if (id) seleccionar('exp', id); }} setItems={items => setModo({ ...modo, items })} />;
  else if (modo?.t === 'cmReb') det = <FormRebaja ej={e} exp={e.exps.find(x => x.id === modo.expId)!} anular={modo.anular} cerrar={() => setModo(null)} />;
  else if (modo?.t === 'dev') det = <FormDev ej={e} exp={e.exps.find(x => x.id === modo.expId)!} sec={modo.sec} cerrar={() => setModo(null)} />;
  else if (modo?.t === 'gir') det = <FormGir ej={e} exp={e.exps.find(x => x.id === modo.expId)!} sec={modo.sec} cerrar={() => setModo(null)} />;
  else if (modo?.t === 't6') det = <FormT6 ej={e} exp={e.exps.find(x => x.id === modo.expId)!} sec={modo.sec} cerrar={() => setModo(null)} />;
  else det = exp ? <DetalleExp ej={e} exp={exp} p={p} setModo={setModo} /> : <Vacio titulo="Detalle del expediente" icono="folder" texto={p === 'cm' ? 'Seleccione un expediente o pulse «+» para crear uno. Los compromisos anuales aprobados son el insumo del compromiso mensual.' : 'Seleccione un expediente de la lista. Solo se listan los expedientes con la fase anterior aprobada.'} />;
  return <>
    <PanelLista titulo={TIT[p][0]} onNuevo={p === 'cm' ? () => { seleccionar('exp', null); setModo({ t: 'cm1' }); } : undefined} tituloNuevo="Crear expediente" ph="Buscar número expediente" total={lista.length} etiqueta="expedientes">
      {lista.map(x => { const ca = e.cas.find(a => a.id === x.caId); const ult = x.secs.filter(s => p === 'cm' ? s.fase === 'C' : p === 'dev' ? s.fase === 'D' : p === 'gir' ? s.fase === 'G' || s.fase === 'P' : s.fase === 'T6').slice(-1)[0];
        return <div key={x.id} className={'li' + (sel.exp === x.id ? ' on' : '')} onClick={() => { setModo(null); seleccionar('exp', x.id); }}><span className="ic"><Icon n="folder" /></span><div className="lib"><b>{pad(x.num, 5)}</b><small>CA {pad(ca?.num || 0, 5)} · {x.tipoOp} · {(ca?.prov.nom || '').slice(0, 26)}</small></div>{x.secs.every(s => s.hist) ? <Badge e="ANTECEDENTE" /> : ult ? <Badge e={ult.estado} /> : <Badge e="PENDIENTE" />}</div>; })}
    </PanelLista>
    <div className="detail">{det}</div></>;
}

function DetalleExp({ ej, exp, p, setModo }: { ej: Ejecutora; exp: Expediente; p: PExp; setModo: (m: Modo) => void }) {
  const { setReporte } = useApp();
  const [abierto, setAbierto] = useState<Record<number, boolean>>({});
  const ca = ej.cas.find(a => a.id === exp.caId)!, cert = ej.certs.find(c => c.id === ca.certId)!, S = expSaldos(exp);
  const habilitado = { cm: mapTot(caSaldo(ej, ca)) > 0.001 && ca.estado === 'APROBADO', dev: mapTot(S.porDevengar) > 0.001 || (esEncargo(exp) && mapTot(S.porRendir) > 0.001), gir: Object.values(S.porGirar).some(v => v > 0.001), t6: Object.values(S.porRendir).some(v => v > 0.001) }[p];
  const insertar = () => {
    if (p === 'cm') nuevoCMenExp(ej, exp, setModo);
    else setModo({ t: p, expId: exp.id });
  };
  const enviar = async (s: ExpSec) => { if (await confirmar('¿Desea enviar el registro seleccionado?', { icono: 'send', ok: 'Enviar' })) intentar(() => api.flujo.enviar({ k: 'es', x: ej.id, id: exp.id, s: s.sec }), s.fase === 'D' ? `Transmisión y/o envío realizado correctamente para el devengado con secuencia N° ${s.sec}.` : s.fase === 'G' ? `Transmisión y/o envío realizado correctamente para el girado con secuencia N° ${s.sec}.` : 'Se transmitió con éxito.'); };
  const descartar = async (s: ExpSec) => { if (await confirmar('¿Desea descartar el registro?', { icono: 'trash', detalle: 'La información descartada queda grabada como antecedente.' })) intentar(() => api.flujo.descartar({ k: 'es', x: ej.id, id: exp.id, s: s.sec }), s.fase === 'D' ? `Descarte del devengado realizado correctamente con secuencia N° ${s.sec}.` : 'Se descartó con éxito.'); };
  const editar = (s: ExpSec) => {
    if (s.fase === 'C') { const sal = caSaldo(ej, ca); addMap(sal, s.items, 1); setModo({ t: 'cm', caId: ca.id, expId: exp.id, sec: s.sec, items: s.items, base: { modalidad: exp.modalidad, tipoProc: exp.tipoProc } }); }
    else setModo({ t: s.fase === 'D' ? 'dev' : s.fase === 'G' ? 'gir' : 't6', expId: exp.id, sec: s.sec } as Modo);
  };
  const pagado = async (s: ExpSec) => {
    if (!(await confirmar('¿Registrar la confirmación del pago (Banco / Tesoro Público)?', { icono: 'bank', ok: 'Registrar' }))) return;
    const sec = await intentar(() => api.gir.pagado({ ejecutora: ej.id, expId: exp.id, sec: s.sec }));
    if (sec) intentar(() => api.flujo.enviar({ k: 'es', x: ej.id, id: exp.id, s: sec }), 'Pagado registrado. Se transmitió con éxito.');
  };
  const tot = (pred: (s: ExpSec) => boolean) => mapTot(secMap(exp, pred));
  return <Card>
    <Encabezado titulo={'EXPEDIENTE Nº ' + pad(exp.num, 5)} sub={`Compromiso anual Nº ${pad(ca.num, 5)} · Certificado Nº ${pad(cert.num, 5)} · ${exp.tipoOp} - ${tipoOpNom(exp.tipoOp)}`} acciones={<Btn v="p" disabled={!habilitado} onClick={insertar}>{TIT[p][1]}</Btn>} />
    <Grid><RO label="Entidad" c={6} v={CASOS[ej.id].entidad.secEjec + ' - ' + CASOS[ej.id].entidad.ueNom} /><RO label="Destino / Origen" c={3} v="5000 - TESORO PÚBLICO" /><RO label="FF / Rubro" c={3} v={exp.ff + ' / ' + exp.rubro + ' - ' + rubroNom(exp.rubro)} /><RO label="Proveedor" c={6} v={ca.prov.tipo + ' ' + ca.prov.num + ' - ' + ca.prov.nom} /><RO label="Modalidad de compra" c={3} v={exp.modalidad} /><RO label="Tipo proc. sel." c={3} v={exp.tipoProc} /></Grid>
    <Sumas items={[['Comprometido', tot(s => s.fase === 'C' && s.estado === 'APROBADO')], ['Devengado', tot(s => s.fase === 'D' && !s.rend && s.estado === 'APROBADO')], ...(esEncargo(exp) ? [['Rendido', tot(s => s.fase === 'D' && s.rend && s.estado === 'APROBADO')] as [string, number]] : []), ['Girado', tot(s => s.fase === 'G' && s.estado === 'APROBADO')], esEncargo(exp) ? ['Devuelto T-6', tot(s => s.fase === 'T6' && s.estado === 'APROBADO')] : ['Pagado', tot(s => s.fase === 'P' && s.estado === 'APROBADO')], [p === 'cm' ? 'Saldo del CA' : p === 'dev' ? 'Por devengar' : p === 'gir' ? 'Por girar' : 'Por rendir', p === 'cm' ? mapTot(caSaldo(ej, ca)) : p === 'dev' ? mapTot(S.porDevengar) : p === 'gir' ? mapTot(S.porGirar) : mapTot(S.porRendir), true]]} />
    <h4>Secuencias del expediente</h4>
    <table className="tbl"><thead><tr><th>Sec.</th><th>Fase</th><th>Documento</th><th>Fecha</th><th className="r">Monto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {exp.secs.map(s => { const reg = s.estado === 'REGISTRADO', apr = s.estado === 'APROBADO', ex = abierto[s.sec];
        return [<tr key={s.sec} className={ex ? 'xon' : ''}><td className="mono">{pad(s.sec, 4)}</td><td>{FASE(s)}</td><td>{s.doc.cod} {s.doc.serie ? s.doc.serie + '-' : ''}{s.doc.num}</td><td>{s.fecha}</td><td className="r">{fmt(sumI(s.items))}</td><td><Badge e={s.estado} /></td>
          <td className="nowrap">{reg && <Btn sm icon="send" onClick={() => enviar(s)}>Enviar</Btn>}
            {s.fase === 'C' ? <Menu3 opciones={[['Modificar', () => editar(s), !reg], ['Descartar', () => descartar(s), !reg], ['Anular', () => setModo({ t: 'cmReb', expId: exp.id, anular: true }), !apr || sumI(s.items) < 0], ['Ampliar', () => nuevoCMenExp(ej, exp, setModo), !apr], ['Rebajar', () => setModo({ t: 'cmReb', expId: exp.id, anular: false }), !apr || sumI(s.items) < 0]]} />
              : reg && <Menu3 opciones={[['Modificar', () => editar(s)], ['Descartar', () => descartar(s)]]} />}
            {p === 'gir' && s.fase === 'G' && apr && !s.pagado && <Btn sm icon="bank" onClick={() => pagado(s)}>Registrar pagado</Btn>}
            <button className="lnk" onClick={() => setAbierto({ ...abierto, [s.sec]: !ex })}>{ex ? 'Ocultar' : 'Detalle'}</button></td></tr>,
        ex && <tr key={s.sec + 'x'} className="xrow"><td colSpan={7}><div className="xbox">
          <Grid><RO label="Documento A" c={5} v={s.doc.cod + ' - ' + docNom(s.doc.cod)} /><RO label="Serie" c={2} v={s.doc.serie} /><RO label="Número" c={3} v={s.doc.num} /><RO label="Fecha doc." c={2} v={s.doc.fecha} />
            {s.prov && <RO label="Proveedor" c={8} v={s.prov.tipo + ' ' + s.prov.num + ' - ' + s.prov.nom} />}{s.tipoPago && <RO label="Tipo de pago" v={s.tipoPago} />}{s.tipoRecurso && <RO label="Tipo de recurso" c={6} v={s.tipoRecurso} />}{s.tipoComp && <RO label="Tipo compromiso" c={6} v={s.tipoComp} />}
            <RO label="Notas / justificación" c={12} v={s.notas} /><RO label="Fecha de registro" v={s.fecha} /><RO label="Fecha aprobación" v={s.fechaAprob || '—'} /><RO label="Autorizado" v={s.aut || '—'} /></Grid>
          <TablaItems items={s.items} />
          {s.giro && <><Grid><RO label="Tipo de giro" c={3} v={s.giro.tipoGiro} /><RO label="Medio de pago" c={5} v={s.giro.medio} /><RO label="Beneficiario" v={s.giro.benef.tipo + ' ' + s.giro.benef.num + ' - ' + s.giro.benef.nom} /><RO label="Total girado" v={fmt(sumI(s.items))} /><RO label="Retenciones" v={fmt(sumI(s.giro.ret))} /><RO label="Neto pagado" v={fmt(sumI(s.items) - sumI(s.giro.ret))} /></Grid>
            {s.giro.ret.length > 0 && <table className="tbl sm"><thead><tr><th>Retención / deducción</th><th className="r">Monto</th></tr></thead><tbody>{s.giro.ret.map((r, i) => <tr key={i}><td>{r.concepto}</td><td className="r">{fmt(r.monto)}</td></tr>)}</tbody></table>}</>}
          {s.comp.length > 0 && <><h4>Comprobantes de la rendición</h4><table className="tbl sm"><thead><tr><th>Tipo</th><th>Serie - número</th><th>Fecha</th><th>Concepto</th><th>Clasificador</th><th className="r">Monto</th></tr></thead><tbody>{s.comp.map((c, i) => <tr key={i}><td>{c.tipo}</td><td>{c.num}</td><td>{c.fecha}</td><td>{c.desc}</td><td className="mono">{c.clas}</td><td className="r">{fmt(c.monto)}</td></tr>)}</tbody></table></>}
        </div></td></tr>]; })}
    </tbody></table>
    <p className="muted sm">{p === 'dev' ? 'A diferencia del compromiso mensual, el devengado requiere la autorización del Director General de Administración (DGA) en el MADAF.' : p === 'cm' ? 'Con el estado En verificación el sistema revisa que no haya incongruencias; de ser el caso, el expediente se aprueba automáticamente.' : p === 'gir' ? 'Los giros se autorizan en el MADAF por los responsables del manejo de cuentas bancarias acreditados en el AERAF.' : 'La Papeleta T-6 registra la devolución del saldo no utilizado; rebaja la ejecución y no es un extorno.'} · <a onClick={() => setReporte('exp', exp.id)}>Reporte del expediente</a></p>
  </Card>;
}

async function nuevoCMenExp(ej: Ejecutora, exp: Expediente, setModo: (m: Modo) => void) {
  const ca = ej.cas.find(a => a.id === exp.caId)!; const cert = ej.certs.find(c => c.id === ca.certId)!;
  const sal = caSaldo(ej, ca);
  const items = await generacionOperaciones({ titulo: 'COMPROMISO ANUAL SELECCIONADO', encabezado: [['Certificado CA', pad(cert.num, 10)], ['Código', ca.doc.cod], ['Número', ca.doc.num], ['Fecha', ca.doc.fecha], ['Moneda', 'S/.'], ['Saldo (S/)', fmt(mapTot(sal))]], etiqueta: 'Monto a comprometer', filas: filasDe(sal) });
  if (items) setModo({ t: 'cm', caId: ca.id, expId: exp.id, items, base: { modalidad: exp.modalidad, tipoProc: exp.tipoProc } });
}

function FormCM1({ ej, cerrar, siguiente }: { ej: Ejecutora; cerrar: () => void; siguiente: (caId: string, items: Item[], base: CabCM) => void }) {
  const [d, setD] = useState<CabCM>({ modalidad: CAT.modalidades[0], tipoProc: 'NO APLICA', faseContr: '', expEnc: '' });
  const [caId, setCaId] = useState('');
  const cas = ej.cas.filter(a => a.estado === 'APROBADO' && mapTot(caSaldo(ej, a)) > 0.001);
  const ca = cas.find(a => a.id === caId);
  const sig = async () => {
    const cert = ej.certs.find(c => c.id === ca!.certId)!; const sal = caSaldo(ej, ca!);
    const items = await generacionOperaciones({ titulo: 'COMPROMISO ANUAL SELECCIONADO', encabezado: [['Certificado CA', pad(cert.num, 10)], ['Código', ca!.doc.cod], ['Número', ca!.doc.num], ['Fecha', ca!.doc.fecha], ['Moneda', 'S/.'], ['Tipo cambio', '1.0000000000'], ['Saldo (S/)', fmt(mapTot(sal))]], etiqueta: 'Monto a comprometer', filas: filasDe(sal) });
    if (items) siguiente(ca!.id, items, d);
  };
  return <><Card form><Encabezado titulo="NUEVO EXPEDIENTE" acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" disabled={!ca} onClick={sig}>Siguiente ›</Btn></>} />
    <Seccion>DETALLES DEL EXPEDIENTE</Seccion>
    <Grid><RO label="Entidad" c={6} v={CASOS[ej.id].entidad.secEjec + ' - ' + CASOS[ej.id].entidad.ueNom} /><RO label="Destino / Origen" c={6} v="5000 - TESORO PÚBLICO" /><RO label="Tipo de operación" c={6} v={ca ? ca.tipoOp + ' - ' + tipoOpNom(ca.tipoOp) : '(se carga al elegir el compromiso anual)'} />
      <Campo label="Exp. Encargo" c={3} value={d.expEnc} onChange={v => setD({ ...d, expEnc: v })} /><RO label="Exp. Fin. Temporal" c={3} v="" />
      <Lista label="Modalidad de compra" c={6} value={d.modalidad} onChange={v => setD({ ...d, modalidad: v })} opciones={CAT.modalidades} /><Lista label="Tipo proc. sel." c={6} value={d.tipoProc} onChange={v => setD({ ...d, tipoProc: v })} opciones={CAT.tiposProc} hint={'Si el monto es menor a 8 UIT (S/ ' + fmt(8 * CAT.uit) + ') no amerita proceso de selección: elija 18 - Adjudicación sin proceso.'} />
      <Campo label="Fase contractual" c={6} value={d.faseContr} onChange={v => setD({ ...d, faseContr: v })} /><RO label="Área" c={6} v={'0000 - ' + CASOS[ej.id].entidad.ueNom} /></Grid></Card>
    <Card inner><div className="ch"><b>COMPROMISO ANUAL</b><small className="muted">Compromisos anuales aprobados por comprometer</small></div>
      <table className="tbl hov"><thead><tr><th /><th>CA Nº</th><th>Certificado</th><th>Tipo op.</th><th>Proveedor</th><th className="r">Monto CA</th><th className="r">Saldo por comprometer</th></tr></thead><tbody>
        {cas.map(a => { const c = ej.certs.find(z => z.id === a.certId)!; return <tr key={a.id} className={caId === a.id ? 'sel' : ''} onClick={() => setCaId(a.id)}><td><input type="radio" readOnly checked={caId === a.id} /></td><td className="mono">{pad(a.num, 5)}</td><td className="mono">{pad(c.num, 5)}</td><td>{a.tipoOp}</td><td>{a.prov.nom}</td><td className="r">{fmt(caMonto(a))}</td><td className="r">{fmt(mapTot(caSaldo(ej, a)))}</td></tr>; })}
        {!cas.length && <tr><td colSpan={7} className="c muted">No hay compromisos anuales aprobados con saldo. Registre y apruebe primero el compromiso anual.</td></tr>}</tbody></table></Card></>;
}

function FormCM({ ej, m, cerrar, setItems }: { ej: Ejecutora; m: Extract<Modo, { t: 'cm' }>; cerrar: (id?: string) => void; setItems: (i: Item[]) => void }) {
  const ca = ej.cas.find(a => a.id === m.caId)!, cert = ej.certs.find(c => c.id === ca.certId)!;
  const exp = m.expId ? ej.exps.find(x => x.id === m.expId) : undefined;
  const s0 = m.sec ? exp!.secs.find(s => s.sec === m.sec) : exp?.secs.find(s => s.fase === 'C');
  const [d, setD] = useState({ doc: (m.sec ? s0?.doc.cod : s0?.doc.cod) || ca.doc.cod, serie: m.sec ? s0!.doc.serie : '', num: s0?.doc.num || ca.doc.num, fecha: m.sec ? s0!.doc.fecha : ej.fechaSis, notas: m.sec ? s0!.notas : '', tipoPago: s0?.tipoPago || '', tipoRecurso: s0?.tipoRecurso || (CAT.tiposRecurso as Record<string, string>)[cert.rubro] || '', ent: m.sec ? s0!.ent : '' });
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  const sal = caSaldo(ej, ca); if (m.sec && s0) addMap(sal, s0.items, 1);
  const agregar = async () => { const it = await generacionOperaciones({ titulo: 'COMPROMISO ANUAL SELECCIONADO', encabezado: [['CA Nº', pad(ca.num, 5)], ['Documento', ca.doc.cod + ' ' + ca.doc.num], ['Saldo', fmt(mapTot(sal))]], etiqueta: 'Monto a comprometer', filas: filasDe(sal, m.items) }); if (it) setItems(it); };
  const grabar = async () => {
    if (!(await confirmar(m.sec ? '¿Desea guardar los cambios del expediente?' : '¿Desea guardar datos del Registro de Nuevo Expediente?'))) return;
    const r = await intentar(() => api.cm.grabar({ ejecutora: ej.id, expId: m.expId, sec: m.sec, caId: ca.id, modalidad: m.base?.modalidad || '', tipoProc: m.base?.tipoProc || 'NO APLICA', faseContr: m.base?.faseContr || '', expEnc: m.base?.expEnc || '', doc: d, notas: d.notas, tipoPago: d.tipoPago, tipoRecurso: d.tipoRecurso, ent: d.ent, items: m.items }), m.sec ? 'Se ha modificado el expediente...' : m.expId ? 'Se ha registrado una nueva secuencia...' : 'Se ha registrado el expediente...');
    if (r) { useApp.getState().avisar('Número: ' + pad(r.exp, 5) + ' · secuencia ' + pad(r.sec, 4), 'info'); cerrar(useApp.getState().ej?.exps.find(x => x.num === r.exp)?.id); }
  };
  return <><Card form><Encabezado titulo={exp ? 'EXPEDIENTE Nº ' + pad(exp.num, 5) : 'NUEVO EXPEDIENTE'} sub={m.sec ? 'MODIFICAR COMPROMISO MENSUAL' : exp ? 'INSERTAR COMPROMISO' : 'REGISTRO SIAF - COMPROMISO MENSUAL'} rojo acciones={<><Btn v="g" icon="x" onClick={() => cerrar()}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <Seccion>DETALLES DEL EXPEDIENTE</Seccion>
    <Grid head><RO label="Entidad" v={CASOS[ej.id].entidad.secEjec + ' - ' + CASOS[ej.id].entidad.ueNom} /><RO label="Destino / Origen" v="5000 - TESORO PÚBLICO" /><RO label="Tipo de operación" v={ca.tipoOp + ' - ' + tipoOpNom(ca.tipoOp)} /><RO label="Modalidad de compra" v={m.base?.modalidad || exp?.modalidad} /><RO label="Tipo proc. sel." v={m.base?.tipoProc || exp?.tipoProc} /><RO label="Fase contractual" v={m.base?.faseContr || exp?.faseContr} /></Grid>
    <Seccion>DETALLES DEL COMPROMISO <span className="chip">CA Nº {pad(ca.num, 5)}</span></Seccion>
    <Grid><RO label="Moneda" c={2} v="NUEVO SOL" /><RO label="Tipo cambio" c={2} v="1.0000000000" /><RO label="Saldo MN" c={2} v={fmt(mapTot(sal))} /><RO label="Monto actual" c={2} v={fmt(sumI(m.items))} /><RO label="FF" c={2} v={cert.ff + ' - ' + ffNom(cert.ff)} /><RO label="Rubro" c={2} v={cert.rubro + ' - ' + rubroNom(cert.rubro)} /></Grid>
    <Seccion>DOCUMENTO A</Seccion>
    <Grid><Lista label="Código" c={5} req value={d.doc} onChange={set('doc')} vacio="(seleccione)" opciones={CAT.docs as [string, string][]} /><Campo label="Serie" c={2} max={4} value={d.serie} onChange={set('serie')} /><Campo label="Número" c={3} req value={d.num} onChange={set('num')} /><Campo label="Fecha" c={2} req value={d.fecha} onChange={set('fecha')} />
      <RO label="Proveedor" c={9} v={ca.prov.tipo + ' ' + ca.prov.num + ' - ' + ca.prov.nom} /><Campo label="Ent. recíproca" c={3} value={d.ent} onChange={set('ent')} /><Campo label="Notas" c={12} req area value={d.notas} onChange={set('notas')} ph="Justificación del compromiso mensual" /></Grid>
    <Seccion>MEDIO DE PAGO / CUENTA CORRIENTE</Seccion>
    <Grid><Lista label="Tipo pago" c={4} req value={d.tipoPago} onChange={set('tipoPago')} vacio="(seleccione)" opciones={CAT.tiposPago.map(x => ({ v: x, t: x }))} /><Lista label="Tipo recurso" c={5} req value={d.tipoRecurso} onChange={set('tipoRecurso')} vacio="(seleccione)" opciones={Object.values(CAT.tiposRecurso).map(x => ({ v: x, t: x }))} /><RO label="Tipo compromiso" c={3} v="11 - MES VIGENTE" /></Grid></Card>
    <div className="two"><Card inner><div className="ch"><b>CLASIFICADOR</b></div><table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th className="r">Monto</th></tr></thead><tbody>{m.items.map((i, k) => <tr key={k}><td className="mono">{i.clas}</td><td>{clasNom(i.clas)}</td><td className="r">S/ {fmt(i.monto)}</td></tr>)}</tbody></table></Card>
      <Card inner><div className="ch"><b>META</b><Btn sm icon="plus" onClick={agregar}>Agregar</Btn></div><table className="tbl sm"><thead><tr><th>Sec. func</th><th>Descripción</th><th className="r">Monto</th></tr></thead><tbody>{m.items.map((i, k) => <tr key={k}><td className="mono">{i.meta}</td><td>{metaNom(ej, i.meta)}</td><td className="r">S/ {fmt(i.monto)}</td></tr>)}</tbody></table></Card></div></>;
}

function FormRebaja({ ej, exp, anular, cerrar }: { ej: Ejecutora; exp: Expediente; anular: boolean; cerrar: () => void }) {
  const base = mapToItems(expSaldos(exp).porDevengar).filter(i => i.monto > 0);
  const [items, setItems] = useState(base.map(i => ({ ...i, txt: anular ? String(i.monto) : '0.00' })));
  const [notas, setNotas] = useState('');
  if (!base.length) return <Card><Vacio titulo="Sin saldo por devengar" texto="El compromiso mensual no tiene saldo por devengar." icono="warn" /><div className="mact"><Btn onClick={cerrar}>Volver</Btn></div></Card>;
  return <Card form><Encabezado titulo={'EXPEDIENTE Nº ' + pad(exp.num, 5)} sub={(anular ? 'ANULAR' : 'REBAJAR') + ' COMPROMISO MENSUAL'} rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={async () => { if (!(await confirmar('¿Grabar el registro?'))) return; const r = await intentar(() => api.cm.rebaja({ ejecutora: ej.id, expId: exp.id, notas, items: items.map(i => ({ clas: i.clas, meta: i.meta, monto: num(i.txt) })) }), 'Se ha registrado una nueva secuencia (monto negativo). Envíela.'); if (r !== null) cerrar(); }}>Grabar</Btn></>} />
    <Grid><Campo label="Notas" c={12} req area value={notas} onChange={setNotas} /></Grid>
    <table className="tbl"><thead><tr><th>Clasificador</th><th>Meta</th><th className="r">Saldo por devengar</th><th className="r">Monto</th></tr></thead><tbody>{items.map((it, i) => <tr key={i}><td className="mono">{it.clas}</td><td>{it.meta}</td><td className="r">{fmt(it.monto)}</td><td className="r">{anular ? fmt(it.monto) : <input className="ctl num req w120" value={it.txt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, txt: e.target.value } : x))} />}</td></tr>)}</tbody></table></Card>;
}

const TIPOS_COMP = ['FACTURA', 'FACTURA ELECTRONICA', 'FACTURAS ELECTRONICAS', 'BOLETA DE VENTA', 'BOLETAS Y RECIBOS', 'BOLETOS DE VIAJE', 'RECIBO POR HONORARIOS', 'PLANILLA DE MOVILIDAD (036)', 'DECLARACION JURADA', 'TICKET', 'OTRO'];
function FormDev({ ej, exp, sec, cerrar }: { ej: Ejecutora; exp: Expediente; sec?: number; cerrar: () => void }) {
  const c0 = exp.secs.find(s => s.fase === 'C')!; const S = expSaldos(exp);
  const ed = sec ? exp.secs.find(s => s.sec === sec) : undefined;
  const [d, setD] = useState({ rend: ed ? ed.rend : !(mapTot(S.porDevengar) > 0.001), doc: ed?.doc.cod || '', serie: ed?.doc.serie || '', num: ed?.doc.num || '', fecha: ed?.doc.fecha || ej.fechaSis, notas: ed?.notas || '', ent: ed?.ent || '' });
  const [items, setItems] = useState<Item[]>(ed && !ed.rend ? ed.items : []);
  const [comp, setComp] = useState<(Omit<Comprobante, 'monto'> & { monto: string })[]>((ed?.comp || []).map(c => ({ ...c, monto: String(c.monto) })));
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  const meta0 = c0.items[0]?.meta || '';
  const clasOpts = [...new Set(CASOS[ej.id].pim.filter(p => p[0] === meta0).map(p => p[2]).concat(exp.secs.flatMap(s => s.items.map(i => i.clas))))];
  const sal = { ...S.porDevengar }; if (ed && !ed.rend) addMap(sal, ed.items, 1);
  const agregar = async () => { const it = await generacionOperaciones({ titulo: 'COMPROMISO MENSUAL SELECCIONADO', encabezado: [['Fase', 'C'], ['Secuencia', pad(c0.sec, 4)], ['Cód.', c0.doc.cod], ['Serie', c0.doc.serie || '-'], ['Número', c0.doc.num], ['Fecha', c0.doc.fecha], ['Moneda', 'S/.'], ['Saldo', fmt(mapTot(sal))]], seccion: 'DEVENGADO', etiqueta: 'Monto a devengar', filas: filasDe(sal, items) }); if (it) setItems(it); };
  const grabar = async () => {
    if (!(await confirmar(ed ? '¿Desea grabar los cambios del devengado?' : '¿Desea grabar el registro del devengado?', { ok: 'Aceptar' }))) return;
    const r = await intentar(() => api.dev.grabar({ ejecutora: ej.id, expId: exp.id, sec, rend: d.rend, doc: { cod: d.doc, serie: d.serie, num: d.num, fecha: d.fecha }, notas: d.notas, ent: d.ent, items, comp: comp.map(c => ({ ...c, monto: num(c.monto) })) }));
    if (r) { useApp.getState().avisar(ed ? `Modificación realizada correctamente del devengado con secuencia N° ${r}.` : `Registro del devengado guardado correctamente con secuencia N° ${r}.`); cerrar(); }
  };
  return <><Card form><Encabezado titulo={'EXPEDIENTE Nº ' + pad(exp.num, 5)} sub={ed ? 'MODIFICAR DEVENGADO' : 'INSERTAR DEVENGADO'} rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <Grid head><RO label="Área" v={'0000 - ' + CASOS[ej.id].entidad.ueNom} /><RO label="Tipo de operación" c={8} v={exp.tipoOp + ' - ' + tipoOpNom(exp.tipoOp)} /><RO label="Modalidad compra" v={exp.modalidad} /><RO label="Fase contractual" v={exp.faseContr || '-'} /><RO label="Tipo proc. sel." v={exp.tipoProc} /></Grid>
    <Seccion>DETALLE DEL DEVENGADO</Seccion>
    <Grid><RO label="Ciclo" c={2} v="G - GASTO" /><RO label="Fase" c={2} v="D - DEVENGADO" /><RO label="Moneda" c={2} v="NUEVO SOL" /><RO label="Tipo cambio" c={2} v="1.0000000000" /><RO label="FF" c={2} v={exp.ff + ' - ' + ffNom(exp.ff)} /><RO label="Rubro" c={2} v={exp.rubro} />
      {esEncargo(exp) ? <Lista label="Tipo de registro" c={6} value={d.rend ? 'R' : 'N'} onChange={v => setD({ ...d, rend: v === 'R' })} opciones={[['N', 'NORMAL (entrega / obligación)'], ['R', 'RENDICIÓN DE CUENTAS (encargo, viáticos, caja chica)']].map(([v, t]) => ({ v, t }))} /> : <RO label="Tipo de registro" c={6} v="NORMAL" />}
      <RO label="Saldo por devengar / por rendir" c={6} v={fmt(d.rend ? mapTot(S.porRendir) : mapTot(S.porDevengar))} /></Grid>
    <Seccion>DOCUMENTO A</Seccion>
    <Grid><Lista label="Código" c={5} req value={d.doc} onChange={set('doc')} vacio="(seleccione)" opciones={CAT.docs as [string, string][]} /><Campo label="Serie" c={2} max={4} value={d.serie} onChange={set('serie')} hint="4 dígitos" /><Campo label="Número" c={3} req value={d.num} onChange={set('num')} hint="Factura: 8 dígitos" /><Campo label="Fecha" c={2} req value={d.fecha} onChange={set('fecha')} />
      <RO label="Proveedor" c={9} v={c0.prov ? c0.prov.tipo + ' ' + c0.prov.num + ' - ' + c0.prov.nom : ''} /><Campo label="Entidad recíproca" c={3} value={d.ent} onChange={set('ent')} /><Campo label="Notas" c={12} req area value={d.notas} onChange={set('notas')} ph="Justificación del devengado" /></Grid>
    <Seccion>MEDIO DE PAGO / CUENTA CORRIENTE</Seccion>
    <Grid><RO label="Tipo pago" v={c0.tipoPago} /><RO label="Tipo recurso" c={5} v={c0.tipoRecurso} /><RO label="Tipo compromiso" c={3} v="11 - MES VIGENTE" /></Grid></Card>
    {d.rend ? <Card inner><div className="ch"><b>COMPROBANTES DE LA RENDICIÓN</b><span className="muted sm">Saldo por rendir: S/ {fmt(mapTot(S.porRendir) + (ed?.rend ? sumI(ed.items) : 0))}</span></div>
      <table className="tbl sm"><thead><tr><th>Tipo</th><th>Serie - número</th><th>Fecha</th><th>Concepto</th><th>Clasificador</th><th className="r">Monto</th><th /></tr></thead><tbody>
        {comp.map((c, i) => { const up = (k: string, v: string) => setComp(comp.map((x, j) => j === i ? { ...x, [k]: v } : x)); return <tr key={i}>
          <td><select className="ctl" value={c.tipo} onChange={e => up('tipo', e.target.value)}>{TIPOS_COMP.map(t => <option key={t}>{t}</option>)}</select></td><td><input className="ctl" value={c.num} onChange={e => up('num', e.target.value)} /></td><td><input className="ctl w90" value={c.fecha} placeholder="dd/mm/aaaa" onChange={e => up('fecha', e.target.value)} /></td><td><input className="ctl" value={c.desc} onChange={e => up('desc', e.target.value)} /></td>
          <td><select className="ctl" value={c.clas} onChange={e => up('clas', e.target.value)}><option value="">(seleccione)</option>{clasOpts.map(cl => <option key={cl} value={cl}>{cl} {clasNom(cl).slice(0, 30)}</option>)}</select></td><td><input className="ctl num w100" value={c.monto} onChange={e => up('monto', e.target.value)} /></td><td><BtnIc n="trash" title="Eliminar" onClick={() => setComp(comp.filter((_, j) => j !== i))} /></td></tr>; })}
        {!comp.length && <tr><td colSpan={7} className="c muted">Agregue los comprobantes que sustentan la rendición.</td></tr>}
        <tr className="tot"><td colSpan={5}>TOTAL RENDIDO</td><td className="r">{fmt(comp.reduce((a, c) => a + num(c.monto), 0))}</td><td /></tr></tbody></table>
      <Btn sm icon="plus" onClick={() => setComp([...comp, { tipo: 'FACTURA', num: '', fecha: '', desc: '', clas: '', monto: '0.00' }])}>Agregar comprobante</Btn></Card>
      : <div className="two"><Card inner><div className="ch"><b>CLASIFICADOR</b></div><table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th className="r">Monto origen</th></tr></thead><tbody>{items.map((i, k) => <tr key={k}><td className="mono">{i.clas}</td><td>{clasNom(i.clas)}</td><td className="r">{fmt(i.monto)}</td></tr>)}{!items.length && <tr><td colSpan={3} className="c muted">Pulse Agregar y seleccione rellenar Con origen.</td></tr>}</tbody></table></Card>
        <Card inner><div className="ch"><b>META</b><Btn sm icon="edit" onClick={agregar}>Agregar</Btn></div><table className="tbl sm"><thead><tr><th>Sec. func</th><th>Descripción</th><th className="r">Monto a devengar</th></tr></thead><tbody>{items.map((i, k) => <tr key={k}><td className="mono">{i.meta}</td><td>{metaNom(ej, i.meta)}</td><td className="r">{fmt(i.monto)}</td></tr>)}</tbody></table></Card></div>}</>;
}

function FormGir({ ej, exp, sec, cerrar }: { ej: Ejecutora; exp: Expediente; sec?: number; cerrar: () => void }) {
  const c0 = exp.secs.find(s => s.fase === 'C')!; const ed = sec ? exp.secs.find(s => s.sec === sec) : undefined;
  const sal = { ...expSaldos(exp).porGirar }; if (ed) addMap(sal, ed.items, 1);
  const [d, setD] = useState({ tipoGiro: ed?.giro?.tipoGiro || 'PRINCIPAL', medio: ed?.giro?.medio || 'ABONO EN CUENTA', docGiro: ed?.doc.num || '', fecha: ed?.doc.fecha || ej.fechaSis, bt: ed?.giro?.benef.tipo || c0.prov?.tipo || 'RUC', bn: ed?.giro?.benef.num || c0.prov?.num || '' });
  const [items, setItems] = useState(mapToItems(sal).filter(i => i.monto > 0).map(i => ({ ...i, saldo: i.monto, txt: ed ? String(ed.items.find(x => x.clas === i.clas && x.meta === i.meta)?.monto || '0.00') : '0.00' })));
  const [ret, setRet] = useState((ed?.giro?.ret || []).map(r => ({ concepto: r.concepto, monto: String(r.monto) })));
  const set = (k: keyof typeof d) => (v: string) => setD({ ...d, [k]: v });
  const tot = items.reduce((a, i) => a + num(i.txt), 0), tr = ret.reduce((a, r) => a + num(r.monto), 0);
  const pv = ej.provs.find(p => p.num === d.bn.trim());
  const grabar = async () => {
    if (!(await confirmar(ed ? '¿Grabar los cambios del girado?' : '¿Desea grabar el registro del girado?', { ok: 'Aceptar' }))) return;
    const r = await intentar(() => api.gir.grabar({ ejecutora: ej.id, expId: exp.id, sec, tipoGiro: d.tipoGiro, medio: d.medio, docGiro: d.docGiro, fecha: d.fecha, benefNum: d.bn, items: items.map(i => ({ clas: i.clas, meta: i.meta, monto: num(i.txt) })), ret: ret.map(x => ({ concepto: x.concepto, monto: num(x.monto) })) }));
    if (r) { useApp.getState().avisar(`Registro del girado guardado correctamente con secuencia N° ${r}.`); cerrar(); }
  };
  return <><Card form><Encabezado titulo={'EXPEDIENTE Nº ' + pad(exp.num, 5)} sub={ed ? 'MODIFICAR GIRADO' : 'INSERTAR GIRADO'} rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={grabar}>Grabar</Btn></>} />
    <Grid head><RO label="Tipo de operación" c={6} v={exp.tipoOp + ' - ' + tipoOpNom(exp.tipoOp)} /><RO label="FF / Rubro" c={6} v={exp.ff + ' / ' + exp.rubro + ' - ' + rubroNom(exp.rubro)} /><RO label="Cuenta bancaria (pagadora)" c={12} v={CUENTAS[exp.rubro] || 'CTA. CTE. DE LA FUENTE'} /></Grid>
    <Seccion>DATOS DEL GIRO</Seccion>
    <Grid><Lista label="Tipo de giro" c={3} value={d.tipoGiro} onChange={set('tipoGiro')} opciones={['PRINCIPAL', 'SECUNDARIO', 'REPOSICION']} /><Lista label="Medio de pago" c={5} req value={d.medio} onChange={set('medio')} opciones={CAT.mediosGiro} /><Campo label="Documento (C/P - OPE - PDT)" c={2} req value={d.docGiro} onChange={set('docGiro')} /><Campo label="Fecha" c={2} req value={d.fecha} onChange={set('fecha')} />
      <Lista label="Beneficiario" c={2} value={d.bt} onChange={set('bt')} opciones={['RUC', 'DNI']} /><div className="f c3"><label>&nbsp;</label><div className="inl"><input className="ctl req" value={d.bn} onChange={e => set('bn')(e.target.value)} /><Btn v="p" sm icon="search" onClick={async () => { const p = await seleccionarProveedor(); if (p) setD({ ...d, bt: p.tipo, bn: p.num }); }} /></div></div><RO label="Nombre / razón social" c={7} v={pv ? pv.nom : '(no registrado)'} /></Grid></Card>
    <Card inner><div className="ch"><b>CLASIFICADOR / META</b><span><Btn sm icon="copy" onClick={() => setItems(items.map(i => ({ ...i, txt: r2(i.saldo).toFixed(2) })))}>Con origen</Btn> <Btn sm icon="reset" onClick={() => setItems(items.map(i => ({ ...i, txt: '0.00' })))}>Con cero</Btn></span></div>
      <table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th>Meta</th><th className="r">Saldo por girar</th><th className="r">Monto a girar</th></tr></thead><tbody>{items.map((it, i) => <tr key={i}><td className="mono">{it.clas}</td><td>{clasNom(it.clas)}</td><td>{it.meta}</td><td className="r">{fmt(it.saldo)}</td><td className="r"><input className="ctl num req w120" value={it.txt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, txt: e.target.value } : x))} /></td></tr>)}</tbody></table></Card>
    <Card inner><div className="ch"><b>RETENCIONES / DEDUCCIONES</b><Btn sm icon="plus" onClick={() => setRet([...ret, { concepto: '', monto: '0.00' }])}>Agregar retención</Btn></div>
      <table className="tbl sm"><thead><tr><th>Concepto (garantía de fiel cumplimiento, detracción, penalidad...)</th><th className="r">Monto</th><th /></tr></thead><tbody>{ret.map((r, i) => <tr key={i}><td><input className="ctl" value={r.concepto} onChange={e => setRet(ret.map((x, k) => k === i ? { ...x, concepto: e.target.value } : x))} /></td><td className="r"><input className="ctl num w120" value={r.monto} onChange={e => setRet(ret.map((x, k) => k === i ? { ...x, monto: e.target.value } : x))} /></td><td><BtnIc n="trash" title="Eliminar" onClick={() => setRet(ret.filter((_, k) => k !== i))} /></td></tr>)}{!ret.length && <tr><td colSpan={3} className="c muted">Sin retenciones</td></tr>}</tbody></table>
      <Sumas items={[['Total girado', tot], ['Retenciones', tr], ['Neto a pagar al beneficiario', tot - tr, true]]} /></Card></>;
}

function FormT6({ ej, exp, sec, cerrar }: { ej: Ejecutora; exp: Expediente; sec?: number; cerrar: () => void }) {
  const ed = sec ? exp.secs.find(s => s.sec === sec) : undefined;
  const sal = { ...expSaldos(exp).porRendir }; if (ed) addMap(sal, ed.items, 1);
  const [d, setD] = useState({ num: ed?.doc.num || '', fecha: ed?.doc.fecha || ej.fechaSis, notas: ed?.notas || '' });
  const [items, setItems] = useState(mapToItems(sal).filter(i => i.monto > 0).map(i => ({ ...i, saldo: i.monto, txt: '0.00' })));
  return <><Card form><Encabezado titulo={'EXPEDIENTE Nº ' + pad(exp.num, 5)} sub="PAPELETA DE DEPÓSITO T-6 · DEVOLUCIÓN DEL SALDO NO UTILIZADO" rojo acciones={<><Btn v="g" icon="x" onClick={cerrar}>Cancelar</Btn><Btn v="p" icon="save" onClick={async () => { if (!(await confirmar('¿Grabar la papeleta de depósito T-6?'))) return; const r = await intentar(() => api.t6.grabar({ ejecutora: ej.id, expId: exp.id, sec, num: d.num, fecha: d.fecha, notas: d.notas, items: items.map(i => ({ clas: i.clas, meta: i.meta, monto: num(i.txt) })) }), 'Papeleta T-6 registrada.', 'Envíela para su aprobación.'); if (r) cerrar(); }}>Grabar</Btn></>} />
    <p className="muted">La devolución es un registro nuevo que rebaja la ejecución por el saldo no utilizado. No es un extorno (el extorno anula un registro equivocado).</p>
    <Grid><Campo label="Número de papeleta T-6" req value={d.num} onChange={v => setD({ ...d, num: v })} /><Campo label="Fecha del depósito" c={3} req value={d.fecha} onChange={v => setD({ ...d, fecha: v })} /><Campo label="Notas" c={12} req area value={d.notas} onChange={v => setD({ ...d, notas: v })} /></Grid></Card>
    <Card inner><table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th>Meta</th><th className="r">Saldo por rendir</th><th className="r">Monto devuelto</th></tr></thead><tbody>
      {items.map((it, i) => <tr key={i}><td className="mono">{it.clas}</td><td>{clasNom(it.clas)}</td><td>{it.meta}</td><td className="r">{fmt(it.saldo)}</td><td className="r"><input className="ctl num req w120" value={it.txt} onChange={e => setItems(items.map((x, k) => k === i ? { ...x, txt: e.target.value } : x))} /></td></tr>)}
      {!items.length && <tr><td colSpan={5} className="c muted">Sin saldo por rendir (registre primero la rendición).</td></tr>}</tbody></table></Card></>;
}
export type { CompromisoAnual };
