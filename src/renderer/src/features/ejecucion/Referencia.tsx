/* Consultas de referencia: clasificadores 2026 y catálogo de apoyo */
import { useMemo, useState } from 'react';
import { Card, Encabezado, Nota, Tabs } from '../../components/ui';
import { CAT } from '@shared/catalogo';
import { CLAS_G, CLAS_I, fmt } from '@shared/util';

export function Clasificadores() {
  const [t, setT] = useState('G'); const [q, setQ] = useState(''); const [desc, setDesc] = useState(false);
  const src = t === 'G' ? CLAS_G : CLAS_I;
  const lista = useMemo(() => { const Q = q.toUpperCase(); return src.filter(r => !Q || r[0].startsWith(Q) || r[1].toUpperCase().includes(Q) || (desc && r[2].toUpperCase().includes(Q))); }, [src, q, desc]);
  return <div className="detail full"><Card><Encabezado titulo="Clasificadores presupuestarios · Año Fiscal 2026" sub={`Anexo 1 (ingresos) y Anexo 2 (gastos) del clasificador económico 2026 · ${src.length} partidas`} />
    <Tabs tabs={[['G', 'Gastos (Anexo 2)'], ['I', 'Ingresos (Anexo 1)']]} val={t} set={setT} />
    <div className="inl"><input className="ctl" placeholder="Buscar por código (por ejemplo 2.3.2.1.2) o denominación (por ejemplo VIATICOS)" value={q} onChange={e => setQ(e.target.value)} /><label className="chk"><input type="checkbox" checked={desc} onChange={e => setDesc(e.target.checked)} /> Ver descripción</label></div>
    <p className="muted sm">{lista.length} resultados{lista.length > 400 ? ' (se muestran los primeros 400)' : ''}</p>
    <table className="tbl sm clas"><thead><tr><th>Código</th><th>Denominación</th>{desc && <th>Descripción</th>}</tr></thead><tbody>
      {lista.slice(0, 400).map(r => { const lv = r[0].split('.').length; return <tr key={r[0]} className={'lv' + lv}><td className="mono">{r[0]}</td><td style={{ paddingLeft: (lv - 1) * 12 + 8 }}>{r[1]}</td>{desc && <td className="sm">{r[2]}</td>}</tr>; })}</tbody></table></Card></div>;
}

export function Catalogo() {
  const tb = (t: string, h: string[], rows: readonly (readonly string[])[], src?: string) => <Card inner key={t}><div className="ch"><b>{t}</b></div><table className="tbl sm"><thead><tr>{h.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody></table>{src && <p className="muted sm">Fuente: {src}</p>}</Card>;
  return <div className="detail full"><Card><Encabezado titulo="Catálogo de apoyo" sub="Valores de la hoja «Catálogo» del archivo Simulador_SIAF_Casos_Practicos_2026.xlsx, usados en las listas de la plataforma" />
    <Nota>Las cuentas patrimoniales (clases 1 a 6) no se listan en el catálogo: identifíquelas en el Plan Contable Gubernamental vigente y en la Tabla de Operaciones del SIAF.</Nota>
    <div className="cgrid2">
      {tb('Fuentes de financiamiento', ['Código', 'Denominación'], CAT.fuentes, CAT.fuente.ff)}
      {tb('Rubros', ['Código', 'Denominación', 'Fuente'], CAT.rubros, CAT.fuente.ff)}
      {tb('Códigos de documento', ['Código', 'Denominación'], CAT.docs, CAT.fuente.docs)}
      {tb('Documentos de la certificación', ['Código', 'Denominación'], CAT.docsCert)}
      {tb('Tipos de operación', ['Código', 'Denominación'], CAT.tiposOp, CAT.fuente.tiposOp)}
      {tb('Tipo de certificación', ['Tipo'], CAT.tiposCert.map(x => [x]), CAT.fuente.tiposCert)}
      {tb('Documento B del giro', ['Código', 'Denominación'], CAT.docsGiro, CAT.fuente.docs)}
      {tb('Estados del registro', ['Estado', 'Observación'], CAT.estados, CAT.fuente.estados)}
      {tb('Capas del registro contable', ['Capa', 'Denominación'], CAT.capas)}
      {tb('Clase 8 · Cuentas presupuestarias', ['Código', 'Denominación'], CAT.clase8, CAT.fuente.cuentas)}
      {tb('Clase 9 · Cuentas de orden', ['Código', 'Denominación'], CAT.clase9, CAT.fuente.cuentas)}
      {tb('Datos de referencia 2026', ['Dato', 'Valor'], [['UIT 2026', 'S/ ' + fmt(CAT.uit)], ['Tope caja chica por pago (20 % UIT)', 'S/ ' + fmt(CAT.topeCaja)], ['8 UIT (adjudicación sin proceso)', 'S/ ' + fmt(8 * CAT.uit)]], CAT.fuente.uit)}
      {tb('Documentos de ingreso (referencial)', ['Código', 'Denominación'], CAT.docsIng)}
    </div></Card></div>;
}
