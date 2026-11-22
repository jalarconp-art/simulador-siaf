/* Expedientes SIAF: compromiso mensual, devengado (y rendición), girado, pagado y Papeleta T-6. */
import { useState, type ReactNode } from 'react';
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

/** Secuencias que muestra cada opción del menú, como en el SIAF-WEB (árbol Compromiso › Devengado › Girado › Pagado). */
const VISIBLES: Record<PExp, ExpSec['fase'][]> = { cm: ['C'], dev: ['C', 'D'], gir: ['C', 'D', 'G', 'P'], t6: ['C', 'D', 'G', 'P', 'T6'] };
const NIVEL: Record<string, number> = { C: 0, D: 1, G: 2, P: 2, T6: 2 };
const ETQ = (s: ExpSec) => s.fase === 'C' ? (sumI(s.items) < 0 ? 'Rebaja' : 'Compromiso') : s.fase === 'D' ? (s.rend ? 'Rendición' : 'Devengado') : s.fase === 'G' ? 'Girado' : s.fase === 'P' ? 'Pagado' : 'Papeleta T-6';
const CORTO: Record<string, string> = { C: 'Comp. Mensual', D: 'Devengado', G: 'Girado', P: 'Pagado', T6: 'Papeleta T-6' };
const LETRA: Record<string, [string, string]> = { APROBADO: ['A', 'ok'], REGISTRADO: ['R', 'reg'], 'EN VERIFICACION': ['V', 'ver'], 'PENDIENTE DE FIRMA': ['P', 'pf'], 'ENVIADO A OPP': ['O', 'pf'], RECHAZADO: ['X', 'rej'], DESCARTADO: ['D', 'des'], ANULADO: ['N', 'des'] };
export const Letra = ({ e }: { e: string }) => { const l = LETRA[e] || ['?', 'des']; return <span className={'letra l-' + l[1]} title={e}>{l[0]}</span>; };

export function Expedientes({ pantalla }: { pantalla: Pantalla }) {
  const p = pantalla as PExp;
  const { ej, sel, seleccionar, filtros, setFiltro } = useApp();
  const { porMes, porNum, orden } = useFiltrado();
  const [modo, setModo] = useState<Modo>(null);
  const e = ej!;
  let lista = e.exps.filter(x => porMes(x) && porNum(x.num));
  if (p === 'dev') lista = lista.filter(x => x.secs.some(s => s.fase === 'C' && s.estado === 'APROBADO'));
  if (p === 'gir') lista = lista.filter(x => x.secs.some(s => s.fase === 'D' && s.estado === 'APROBADO'));
  if (p === 't6') lista = lista.filter(x => x.secs.some(s => s.fase === 'G' && s.estado === 'APROBADO'));
  lista.sort(orden);
  const exp = e.exps.find(x => x.id === sel.exp);
  const visibles = (x: Expediente) => x.secs.filter(s => VISIBLES[p].includes(s.fase) && s.estado !== 'DESCARTADO');
  const secSel = exp ? (visibles(exp).find(s => String(s.sec) === sel.sec) || visibles(exp).slice(-1)[0]) : undefined;
  let det;
  if (modo?.t === 'cm1') det = <FormCM1 ej={e} cerrar={() => setModo(null)} siguiente={(caId, items, base) => setModo({ t: 'cm', caId, items, base })} />;
  else if (modo?.t === 'cm') det = <FormCM ej={e} m={modo} cerrar={id => { setModo(null); if (id) { seleccionar('exp', id); seleccionar('sec', null); } }} setItems={items => setModo({ ...modo, items })} />;
  else if (modo?.t === 'cmReb') det = <FormRebaja ej={e} exp={e.exps.find(x => x.id === modo.expId)!} anular={modo.anular} cerrar={() => setModo(null)} />;
  else if (modo?.t === 'dev') det = <FormDev ej={e} exp={e.exps.find(x => x.id === modo.expId)!} sec={modo.sec} cerrar={() => { setModo(null); seleccionar('sec', null); }} />;
  else if (modo?.t === 'gir') det = <FormGir ej={e} exp={e.exps.find(x => x.id === modo.expId)!} sec={modo.sec} cerrar={() => { setModo(null); seleccionar('sec', null); }} />;
  else if (modo?.t === 't6') det = <FormT6 ej={e} exp={e.exps.find(x => x.id === modo.expId)!} sec={modo.sec} cerrar={() => { setModo(null); seleccionar('sec', null); }} />;
  else det = exp && secSel ? <DetalleExp ej={e} exp={exp} p={p} s={secSel} secs={visibles(exp)} elegir={n => seleccionar('sec', String(n))} setModo={setModo} /> : <Vacio titulo="Detalle del expediente" icono="doc" texto="Para poder visualizar el detalle, Usted debe seleccionar un expediente de la lista izquierda" />;
  return <>
    <PanelLista titulo={p === 'cm' ? 'Registro SIAF - Compromiso Mensual' : p === 'dev' ? 'Registro SIAF - Devengado' : p === 'gir' ? 'Registro SIAF - Girado' : TIT[p][0]} onNuevo={p === 'cm' ? () => { seleccionar('exp', null); setModo({ t: 'cm1' }); } : undefined} tituloNuevo="Crear expediente" ph={p === 'gir' ? 'Buscar expediente' : 'Buscar número expediente'} total={lista.length} etiqueta="Expedientes"
      limpiar={filtros.q || filtros.mes !== 'TODOS' ? () => { setFiltro('q', ''); setFiltro('mes', 'TODOS'); } : undefined}>
      {lista.map(x => { const abierto = sel.exp === x.id;
        return <div key={x.id} className={'arbol' + (abierto ? ' abierto' : '')}>
          <div className="li" onClick={() => { setModo(null); seleccionar('sec', null); seleccionar('exp', abierto ? null : x.id); }}><span className="ic"><Icon n="doc" /></span><div className="lib"><b>{pad(x.num, 5)}</b></div><span className={'chev' + (abierto ? ' up' : '')}><Icon n="chevron" /></span></div>
          {abierto && visibles(x).map(s => <div key={s.sec} className={'rama n' + NIVEL[s.fase] + (secSel?.sec === s.sec ? ' on' : '')} onClick={() => { setModo(null); seleccionar('sec', String(s.sec)); }}>
            <span className="r-t">{ETQ(s)}</span><span className="r-s">{pad(s.ref && s.fase === 'P' ? s.ref : s.sec, 4)}</span><Letra e={s.estado} /></div>)}
        </div>; })}
    </PanelLista>
    <div className="detail">{det}</div></>;
}

function DetalleExp({ ej, exp, p, s, secs, elegir, setModo }: { ej: Ejecutora; exp: Expediente; p: PExp; s: ExpSec; secs: ExpSec[]; elegir: (n: number) => void; setModo: (m: Modo) => void }) {
  const { setReporte } = useApp();
  const [tab, setTab] = useState<'det' | 'mod' | 'act'>('det');
  const ca = ej.cas.find(a => a.id === exp.caId)!, cert = ej.certs.find(c => c.id === ca.certId)!, S = expSaldos(exp);
  const ent = CASOS[ej.id].entidad;
  const habilitado = { cm: mapTot(caSaldo(ej, ca)) > 0.001 && ca.estado === 'APROBADO', dev: mapTot(S.porDevengar) > 0.001 || (esEncargo(exp) && mapTot(S.porRendir) > 0.001), gir: Object.values(S.porGirar).some(v => v > 0.001), t6: Object.values(S.porRendir).some(v => v > 0.001) }[p];
  const insertar = () => { if (p === 'cm') nuevoCMenExp(ej, exp, setModo); else setModo({ t: p, expId: exp.id }); };
  const enviar = async () => { if (await confirmar('¿Desea enviar el registro seleccionado?', { icono: 'send', ok: 'Enviar' })) intentar(() => api.flujo.enviar({ k: 'es', x: ej.id, id: exp.id, s: s.sec }), s.fase === 'D' ? `Transmisión y/o envío realizado correctamente para el devengado con secuencia N° ${s.sec}.` : s.fase === 'G' ? `Transmisión y/o envío realizado correctamente para el girado con secuencia N° ${s.sec}.` : 'Se transmitió con éxito.'); };
  const descartar = async () => { if (await confirmar('¿Desea descartar el registro?', { icono: 'trash', detalle: 'La información descartada queda grabada como antecedente.' })) intentar(() => api.flujo.descartar({ k: 'es', x: ej.id, id: exp.id, s: s.sec }), s.fase === 'D' ? `Descarte del devengado realizado correctamente con secuencia N° ${s.sec}.` : 'Se descartó con éxito.'); };
  const editar = () => {
    if (s.fase === 'C') setModo({ t: 'cm', caId: ca.id, expId: exp.id, sec: s.sec, items: s.items, base: { modalidad: exp.modalidad, tipoProc: exp.tipoProc } });
    else setModo({ t: s.fase === 'D' ? 'dev' : s.fase === 'G' ? 'gir' : 't6', expId: exp.id, sec: s.sec } as Modo);
  };
  const pagado = async () => {
    if (!(await confirmar('¿Registrar la confirmación del pago (Banco / Tesoro Público)?', { icono: 'bank', ok: 'Registrar' }))) return;
    const sec = await intentar(() => api.gir.pagado({ ejecutora: ej.id, expId: exp.id, sec: s.sec }));
    if (sec) intentar(() => api.flujo.enviar({ k: 'es', x: ej.id, id: exp.id, s: sec }), 'Pagado registrado. Se transmitió con éxito.');
  };
  const reg = s.estado === 'REGISTRADO', apr = s.estado === 'APROBADO';
  const opciones: [string, () => void, boolean?][] = s.fase === 'C'
    ? [['Modificar', editar, !reg], ['Descartar', descartar, !reg], ['Anular', () => setModo({ t: 'cmReb', expId: exp.id, anular: true }), !apr || sumI(s.items) < 0], ['Ampliar', () => nuevoCMenExp(ej, exp, setModo), !apr], ['Rebajar', () => setModo({ t: 'cmReb', expId: exp.id, anular: false }), !apr || sumI(s.items) < 0], ['Reporte del expediente', () => setReporte('exp', exp.id)]]
    : [['Modificar', editar, !reg], ['Descartar', descartar, !reg], ...(s.fase === 'G' ? [['Registrar pagado (abono)', pagado, !apr || s.pagado] as [string, () => void, boolean]] : []), ['Reporte del expediente', () => setReporte('exp', exp.id)]];
  const tot = (pred: (x: ExpSec) => boolean) => mapTot(secMap(exp, pred));
  const monto = sumI(s.items);
  const mods = s.fase === 'C' ? tot(x => x.fase === 'C' && x.sec !== s.sec && sumI(x.items) < 0 && x.estado === 'APROBADO') : 0;
  const [l3, v3, v4] = s.fase === 'C' ? ['Devengado', tot(x => x.fase === 'D' && !x.rend && x.estado === 'APROBADO'), mapTot(S.porDevengar)]
    : s.fase === 'D' ? ['Girado', tot(x => x.fase === 'G' && x.estado === 'APROBADO'), s.rend ? mapTot(S.porRendir) : mapTot(S.porGirar)]
      : s.fase === 'G' ? ['Pagado', s.pagado ? monto : 0, s.pagado ? 0 : monto - sumI(s.giro?.ret || [])] : ['Ejecutado', monto, 0];
  const kv = (k: string, v: ReactNode, full?: boolean) => <div className={'kv-f' + (full ? ' full' : '')}><span>{k}:</span><b>{v === '' || v == null ? '-' : v}</b></div>;
  const caSec = pad(cert.num, 10) + ' - ' + pad(ej.cas.filter(a => a.certId === cert.id).findIndex(a => a.id === ca.id) + 2, 4);
  return <div className="det-siaf">
    <div className="ds-cab"><h2>EXPEDIENTE Nº {pad(exp.num, 5)}</h2>{p !== 't6' || true ? <button className="btn-ins" disabled={!habilitado} onClick={insertar}>{TIT[p][1]}</button> : null}</div>
    <div className="ds-ent">
      {kv('Entidad', ent.secEjec + ' - ' + ent.ueNom)}{kv('Exp. Fin. Temporal', '0')}
      {kv('Destino/Origen', '5000 - MEF - TESORO PÚBLICO')}{kv('Tipo Proc. Sel.', exp.tipoProc)}
      {kv('Area', '0000 - ' + ent.ueNom)}<span />
      {kv('Tipo de operación', exp.tipoOp + ' - ' + tipoOpNom(exp.tipoOp))}<span />
      {kv('Modalidad compra', exp.modalidad)}<span />
      {kv('Fase contractual', exp.faseContr || '-')}<span />
    </div>
    <div className="ds-barra">
      <select className="ds-sec" value={s.sec} onChange={ev => elegir(+ev.target.value)}>{secs.map(x => <option key={x.sec} value={x.sec}>{CORTO[x.fase]} {pad(x.sec, 4)}</option>)}</select>
      <div className="ds-tabs"><a className={tab === 'det' ? 'on' : ''} onClick={() => setTab('det')}><Icon n="doc" /> Detalles</a><a className={tab === 'mod' ? 'on' : ''} onClick={() => setTab('mod')}><Icon n="doc" /> Modificaciones</a><a className={tab === 'act' ? 'on' : ''} onClick={() => setTab('act')}><Icon n="doc" /> Actividad</a></div>
      <Menu3 opciones={opciones} />
      <button className="btn-env" disabled={!reg} onClick={enviar}><Icon n="send" /> Enviar</button>
    </div>
    {tab === 'det' && <>
      <div className="ds-card ds-kv">
        <div>{kv('Secuencia', pad(s.sec, 4))}{s.fase !== 'C' && kv('FF/Rb', exp.ff + ' - ' + exp.rubro + ' ' + rubroNom(exp.rubro))}{s.fase === 'C' && <>{kv('Documento', s.doc.cod + ' ' + docNom(s.doc.cod))}{kv('Número', (s.doc.serie ? s.doc.serie + '-' : '') + s.doc.num)}{kv('Fecha', s.doc.fecha)}{kv('Rubro', exp.rubro + ' - ' + rubroNom(exp.rubro))}</>}
          {kv('Proveedor', s.giro ? s.giro.benef.tipo + ' - ' + s.giro.benef.num + ' - ' + s.giro.benef.nom : s.prov ? s.prov.tipo + ' - ' + s.prov.num + ' - ' + s.prov.nom : '9 - 0 - SIN NOMBRE')}{kv('Entidad recíproca', s.ent || '')}{s.giro && kv('Tipo giro', s.giro.tipoGiro)}</div>
        <div>{kv('Estado', <span className={'st-pt ' + (apr ? 'ok' : '')}>• {s.estado.charAt(0) + s.estado.slice(1).toLowerCase()}</span>)}{kv('Moneda', 'Nuevo Sol')}{kv('Monto origen', fmt(monto))}{kv('Tipo cambio', '1.000000000000000')}{kv('Certificado anual', caSec)}{kv('Convenio Proyecto', '000 - Sin proyecto')}</div>
        {s.fase !== 'C' && <div><h5>DOCUMENTO A</h5>{kv('Código documento', s.doc.cod + ' - ' + docNom(s.doc.cod))}{kv('Serie', s.doc.serie)}{kv('Número', s.doc.num)}{kv('Fecha', s.doc.fecha)}</div>}
        <div><h5>{s.giro ? 'MEDIO DE PAGO' : 'MODALIDAD DE PAGO'}</h5>{s.giro ? <>{kv('Medio de pago', s.giro.medio)}{kv('Retenciones', fmt(sumI(s.giro.ret)))}{kv('Neto pagado', fmt(monto - sumI(s.giro.ret)))}</> : <>{kv('Tipo pago', s.tipoPago || exp.secs[0]?.tipoPago)}{kv('Tipo recurso', s.tipoRecurso || exp.secs[0]?.tipoRecurso)}{kv('Tipo compromiso', s.tipoComp || '11 - MES VIGENTE')}</>}</div>
        {kv('Notas', s.notas, true)}
      </div>
      <div className="ds-sumas"><div><small>Monto inicial</small><b>S/ {fmt(monto)}</b></div><div><small>Modificaciones</small><b>S/ {fmt(mods)}</b></div><div><small>{l3}</small><b>S/ {fmt(v3)}</b></div><div><small>Saldo</small><b className="red">S/ {fmt(v4)}</b></div></div>
      {s.giro && s.giro.ret.length > 0 && <div className="ds-card"><h5>RETENCIONES / DEDUCCIONES</h5><table className="tbl sm"><thead><tr><th>Concepto</th><th className="r">Monto</th></tr></thead><tbody>{s.giro.ret.map((r, i) => <tr key={i}><td>{r.concepto}</td><td className="r">{fmt(r.monto)}</td></tr>)}</tbody></table></div>}
      {s.comp.length > 0 && <div className="ds-card"><h5>COMPROBANTES DE LA RENDICIÓN</h5><table className="tbl sm"><thead><tr><th>Tipo</th><th>Serie - número</th><th>Fecha</th><th>Concepto</th><th>Clasificador</th><th className="r">Monto</th></tr></thead><tbody>{s.comp.map((c, i) => <tr key={i}><td>{c.tipo}</td><td>{c.num}</td><td>{c.fecha}</td><td>{c.desc}</td><td className="mono">{c.clas}</td><td className="r">{fmt(c.monto)}</td></tr>)}</tbody></table></div>}
      <div className="ds-cm">
        <div className="ds-card"><h5>CLASIFICADOR</h5><table className="tbl sm"><thead><tr><th>Clasificador</th><th>Descripción</th><th className="r">Monto origen</th></tr></thead><tbody>{s.items.map((i, k) => <tr key={k} className={k === 0 ? 'sel' : ''}><td className="mono">{i.clas}</td><td>{clasNom(i.clas)}</td><td className="r">S/.{fmt(i.monto)}</td></tr>)}</tbody></table></div>
        <div className="ds-card"><h5>META</h5><table className="tbl sm"><thead><tr><th>Sec. Func.</th><th>Descripción</th><th className="r">Monto</th></tr></thead><tbody>{s.items.map((i, k) => <tr key={k}><td className="mono">{i.meta}</td><td>{metaNom(ej, i.meta)}</td><td className="r">S/.{fmt(i.monto)}</td></tr>)}</tbody></table></div>
      </div></>}
    {tab === 'mod' && <div className="ds-card">{exp.secs.filter(x => x.fase === s.fase && x.sec !== s.sec && sumI(x.items) < 0).length ? <table className="tbl sm"><thead><tr><th>Secuencia</th><th>Tipo</th><th>Fecha</th><th className="r">Monto</th><th>Estado</th></tr></thead><tbody>{exp.secs.filter(x => x.fase === s.fase && x.sec !== s.sec && sumI(x.items) < 0).map(x => <tr key={x.sec}><td className="mono">{pad(x.sec, 4)}</td><td>REBAJA</td><td>{x.fecha}</td><td className="r">{fmt(sumI(x.items))}</td><td><Badge e={x.estado} /></td></tr>)}</tbody></table> : <Vacio titulo="Sin modificaciones" texto="No se encontraron modificaciones para esta secuencia." icono="folder" />}</div>}
    {tab === 'act' && <div className="ds-card"><table className="tbl sm"><thead><tr><th>Actividad</th><th>Fecha</th><th>Responsable</th></tr></thead><tbody>
      <tr><td>Registro</td><td>{s.fecha}</td><td>-</td></tr>
      {s.estado !== 'REGISTRADO' && <tr><td>Envío / verificación</td><td>{s.fecha}</td><td>SISTEMA</td></tr>}
      {s.fechaAprob && <tr><td>Aprobación</td><td>{s.fechaAprob}</td><td>{s.aut || 'SISTEMA (sin incongruencias)'}</td></tr>}
      <tr><td>Estado actual</td><td colSpan={2}><Badge e={s.estado} /></td></tr></tbody></table></div>}
  </div>;
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
