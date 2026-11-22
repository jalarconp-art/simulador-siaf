/* Consultas: Módulo Contable (tres capas) y verificación contra la solución */
import { useState } from 'react';
import { useApp } from '../../store';
import { api } from '../../api';
import { Btn, Card, Encabezado, Nota, Res } from '../../components/ui';
import { CASOS } from '@shared/casos';
import { asientosDe, CAPA_O, CAPA_P, CAPA_PR, controlesDe, mapearFases, verificar } from '@shared/domain/contabilidad';
import { docNom, ffNom, fmt, r2, rubroNom, tipoOpNom } from '@shared/util';

export function Contable() {
  const ej = useApp(s => s.ej)!;
  const [resp, setResp] = useState(false);
  const d = CASOS[ej.id], sc = d.subcasos.find(s => s.id === ej.sub)!;
  const filas = mapearFases(ej, sc);
  const caR = filas.find(x => x.o?.op === 'ca' && x.r);
  const meta = sc.meta ? sc.meta + ' ' + (d.metas.find(m => m.sec === sc.meta)?.nombre || '') : 'No aplica (ciclo de ingresos)';
  const s1: [string, string][] = [['Año fiscal', String(d.anio)], ['Unidad ejecutora', `${d.entidad.ue} ${d.entidad.ueNom} (${d.entidad.secEjec})`],
    ['Fuente de financiamiento', sc.ingreso ? [...new Set(sc.ops.filter(o => o.ff).map(o => o.ff + ' ' + ffNom(o.ff!)))].join(' / ') : sc.ff + ' ' + ffNom(sc.ff)],
    ['Rubro', sc.ingreso ? [...new Set(sc.ops.filter(o => o.rubro).map(o => o.rubro + ' ' + rubroNom(o.rubro!)))].join(' / ') : sc.rubro + ' ' + rubroNom(sc.rubro)],
    ['Tipo de operación', caR ? caR.r!.tipoOp + ' - ' + tipoOpNom(caR.r!.tipoOp || '') : sc.ingreso ? 'Ciclo del ingreso (determinado y recaudado)' : 'Pendiente'], ['Meta / finalidad', meta],
    ['Documento que autoriza', caR && caR.r!.doc ? docNom(caR.r!.doc.cod) + ' ' + caR.r!.doc.num + ' · ' + caR.r!.doc.fecha : sc.ingreso ? 'Recibos de ingreso / reportes de recaudación' : 'Pendiente']];
  let tD = 0, tH = 0; const porFase: [string, number | null, number | null][] = []; const capa: Record<string, [number, number]> = { [CAPA_P]: [0, 0], [CAPA_PR]: [0, 0], [CAPA_O]: [0, 0] };
  const filasAs = filas.flatMap((f, i) => {
    const a = asientosDe(f), lbl = f.o ? f.o.fase : '(registro adicional)';
    if (!a.lines.length) { porFase.push([lbl, null, null]); return [<tr key={i} className="sinas"><td>{lbl}</td><td /><td /><td /><td>{a.sin ? 'Sin asiento contable' : '—'}</td><td /><td /><td className="sm">{a.sin || a.pend}</td></tr>]; }
    let dd = 0, hh = 0;
    const out = a.lines.map((l, k) => { dd += l.d; hh += l.h; capa[l.capa][0] += l.d; capa[l.capa][1] += l.h; return <tr key={i + '-' + k}><td>{lbl}</td><td className="c">{l.n}</td><td><span className={'capa c-' + (l.capa === CAPA_P ? 'p' : l.capa === CAPA_PR ? 'pr' : 'o')}>{l.capa}</span></td><td className="mono">{l.cta}</td><td>{l.den}</td><td className="r">{l.d ? fmt(l.d) : ''}</td><td className="r">{l.h ? fmt(l.h) : ''}</td><td className="sm">{l.com}</td></tr>; });
    tD += dd; tH += hh; porFase.push([lbl, r2(dd), r2(hh)]); return out;
  });
  const ctl = controlesDe(sc, filas);
  const csv = async () => {
    const q = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const out: unknown[][] = [['REGISTRO ADMINISTRATIVO'], ['Fase', 'Fecha', 'Cod. documento', 'Serie', 'Numero', 'RUC/DNI', 'Clasificador', 'Monto', 'Estado', 'Justificacion']];
    filas.forEach(({ o, r }) => out.push([o ? o.fase : '(adicional)', r?.fecha, r?.doc?.cod, r?.doc?.serie, r?.doc?.num, r?.prov?.num, r ? r.items.map(i => i.clas).join(' / ') : '', r ? r.total.toFixed(2) : '', r ? r.estado : 'PENDIENTE', r?.justif]));
    out.push([], ['ASIENTOS CONTABLES'], ['Fase', 'N asiento', 'Capa', 'Cuenta', 'Denominacion', 'Debe', 'Haber', 'Comentario']);
    filas.forEach(f => { const a = asientosDe(f); if (!a.lines.length) out.push([f.o?.fase, '', '', '', 'Sin asiento contable', '', '', a.sin || a.pend]); a.lines.forEach(l => out.push([f.o?.fase, l.n, l.capa, l.cta, l.den, l.d ? l.d.toFixed(2) : '', l.h ? l.h.toFixed(2) : '', l.com])); });
    const r = await api.escritorio.guardarTexto(`Modulo_Contable_${ej.id}_${sc.id}.csv`, '﻿' + out.map(x => x.map(q).join(';')).join('\r\n'), 'csv');
    if (r.ok) useApp.getState().avisar('Archivo CSV guardado.', 'ok', String(r.data));
  };
  const salida = async (pdf: boolean) => { const h = document.getElementById('contprint')!.innerHTML; if (pdf) { const r = await api.escritorio.pdf(h, `Modulo_Contable_${ej.id}_${sc.id}.pdf`); if (r.ok) useApp.getState().avisar('PDF guardado.', 'ok', String(r.data)); } else api.escritorio.imprimir(h, 'Módulo Contable'); };
  return <div className="detail full"><Card>
    <Encabezado titulo={'Módulo Contable · ' + sc.titulo} sub={`${d.entidad.pliegoNom} - UE ${d.entidad.ue} ${d.entidad.ueNom} · ${ej.modo === 'solucion' ? 'Solución cargada' : 'Registros del estudiante'}`} acciones={<><Btn icon="download" onClick={csv}>Exportar CSV</Btn><Btn icon="pdf" onClick={() => salida(true)}>Guardar PDF</Btn><Btn icon="print" onClick={() => salida(false)}>Imprimir</Btn></>} />
    <div id="contprint">
      <h3 className="sec">1. DATOS GENERALES DEL REGISTRO</h3><table className="tbl kv"><tbody>{s1.map(x => <tr key={x[0]}><td>{x[0]}</td><td>{x[1]}</td></tr>)}</tbody></table>
      <h3 className="sec">2. DATOS DEL CASO</h3><table className="tbl kv"><tbody>{sc.datos.map(x => <tr key={x[0]}><td>{x[0]}</td><td>{x[1]}</td></tr>)}</tbody></table>
      <h3 className="sec">3. REGISTRO ADMINISTRATIVO · Módulo de Ejecución SIAF-WEB</h3><div className="ovx"><table className="tbl sm"><thead><tr><th>Fase</th><th>Fecha</th><th>Cód. doc.</th><th>Serie</th><th>Número</th><th>RUC / DNI</th><th>Clasificador</th><th className="r">Monto S/</th><th>Estado</th><th>Justificación (nota SIAF)</th></tr></thead><tbody>
        {filas.map(({ o, r }, i) => <tr key={i} className={r ? '' : 'pend'}><td>{o ? o.fase : <i>(registro adicional)</i>}</td><td>{r?.fecha}</td><td>{r?.doc?.cod}</td><td>{r?.doc?.serie}</td><td>{r?.doc?.num}</td><td>{r?.prov?.num}</td><td className="mono sm">{r ? [...new Set(r.items.map(x => x.clas))].join(' · ') : ''}</td><td className="r">{r ? fmt(r.total) : ''}</td><td>{r ? <span className="badge b-reg">{r.estado}</span> : <span className="badge b-des">PENDIENTE</span>}</td><td className="sm">{r?.justif.slice(0, 90)}</td></tr>)}</tbody></table></div>
      <h3 className="sec">4. ASIENTOS CONTABLES · Módulo Contable (tres capas por fase)</h3><div className="ovx"><table className="tbl sm"><thead><tr><th>Fase</th><th>N.° asiento</th><th>Capa</th><th>Cuenta</th><th>Denominación</th><th className="r">Debe S/</th><th className="r">Haber S/</th><th>Comentario</th></tr></thead><tbody>{filasAs}
        <tr className="tot"><td colSpan={5}>TOTALES</td><td className="r">{fmt(tD)}</td><td className="r">{fmt(tH)}</td><td>{Math.abs(tD - tH) < 0.01 ? (tD ? 'Cuadra' : 'Sin asientos') : 'No cuadra'}</td></tr></tbody></table></div>
      <p className="muted sm">Cuentas patrimoniales referenciales del Plan Contable Gubernamental y de la Tabla de Operaciones del SIAF; las subcuentas de clase 8 y 9 siguen el catálogo de apoyo. Verifíquelas con la versión vigente y cite la fuente.</p>
      <div className="two"><div><h3 className="sec">5. VERIFICACIÓN DE PARTIDA DOBLE</h3><table className="tbl sm"><thead><tr><th>Fase / capa</th><th className="r">Debe S/</th><th className="r">Haber S/</th><th>Resultado</th></tr></thead><tbody>
        {porFase.map(([l, a, b], i) => <tr key={i}><td>{l}</td><td className="r">{fmt(a || 0)}</td><td className="r">{fmt(b || 0)}</td><td><Res v={a === null ? 'Sin asiento' : Math.abs(a - (b || 0)) < 0.01 ? 'Cuadra' : 'No cuadra'} /></td></tr>)}
        {[CAPA_P, CAPA_PR, CAPA_O].map(c => <tr key={c} className="capr"><td><b>{c}</b></td><td className="r">{fmt(capa[c][0])}</td><td className="r">{fmt(capa[c][1])}</td><td><Res v={!capa[c][0] && !capa[c][1] ? 'Sin asiento' : Math.abs(capa[c][0] - capa[c][1]) < 0.01 ? 'Cuadra' : 'No cuadra'} /></td></tr>)}</tbody></table></div>
        <div><h3 className="sec">6. CONTROLES DEL CICLO</h3><table className="tbl sm"><thead><tr><th>Control</th><th className="r">Monto fase S/</th><th className="r">Límite S/</th><th>Resultado</th></tr></thead><tbody>{ctl.map(c => <tr key={c[0]}><td>{c[0]}</td><td className="r">{fmt(c[1])}</td><td className="r">{fmt(c[2])}</td><td><Res v={c[3]} /></td></tr>)}</tbody></table></div></div>
      <h3 className="sec">7. DOCUMENTOS FUENTE</h3><table className="tbl sm"><thead><tr><th>Documento</th><th>Emitido por</th><th>Qué acredita y en qué fase se usa</th></tr></thead><tbody>{sc.docsFuente.map(x => <tr key={x[0]}><td>{x[0]}</td><td>{x[1]}</td><td>{x[2]}</td></tr>)}</tbody></table>
      <h3 className="sec">8. PREGUNTA DE ANÁLISIS</h3><p><b>{sc.pregunta}</b></p>{resp && <Nota ok>{sc.respuesta}</Nota>}
    </div><Btn onClick={() => setResp(!resp)}>{resp ? 'Ocultar' : 'Ver'} respuesta sugerida</Btn></Card></div>;
}

export function Verificar() {
  const ej = useApp(s => s.ej)!;
  const [mostrar, setMostrar] = useState(false);
  const d = CASOS[ej.id], sc = d.subcasos.find(s => s.id === ej.sub)!;
  const res = verificar(ej, sc); const all = res.flatMap(x => x.checks); const ok = all.filter(c => c.ok).length; const pct = all.length ? Math.round(ok * 100 / all.length) : 0;
  return <div className="detail full"><Card>
    <Encabezado titulo="Verificar mi registro" sub={'Compara los registros de la ejecutora con la solución del caso (' + (ej.modo === 'solucion' ? 'la solución está cargada: todo debe salir correcto' : 'modo práctica') + ')'} />
    <div className="vgrid">{d.subcasos.map(s => { const r = verificar(ej, s).flatMap(x => x.checks); const k = r.filter(c => c.ok).length; const p = r.length ? Math.round(k * 100 / r.length) : 0; return <div key={s.id} className={'vsum' + (s.id === sc.id ? ' on' : '')} onClick={() => api.ejecutora.subcaso(ej.id, s.id).then(() => useApp.getState().recargar())}><b>{p}%</b><small>{s.titulo}</small><div className="bar"><i style={{ width: p + '%' }} /></div></div>; })}</div>
    <h3 className="sec">{sc.titulo} · {ok} de {all.length} verificaciones correctas ({pct}%)</h3>
    {res.map((x, i) => { const bien = x.checks.every(c => c.ok); return <div key={i} className={'vph ' + (bien ? 'g' : 'b')}><div className="vpt">{bien ? '✔' : '✖'} <b>{x.o.fase}</b> {x.r && <small>{x.r.numero}</small>}</div>
      <table className="tbl sm"><thead><tr><th>Control</th><th>Esperado (solución)</th><th>Registrado</th><th /></tr></thead><tbody>{x.checks.map((c, k) => <tr key={k}><td>{c.lbl}</td><td>{mostrar || c.ok ? c.esp : <i className="muted">oculto</i>}</td><td>{c.reg}</td><td><Res v={c.ok ? 'OK' : 'Revisar'} /></td></tr>)}</tbody></table></div>; })}
    <Btn onClick={() => setMostrar(!mostrar)}>{mostrar ? 'Ocultar' : 'Mostrar'} los valores esperados</Btn></Card></div>;
}
