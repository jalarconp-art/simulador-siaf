/* Panel lateral con el expediente del caso (enunciado, datos y documentos fuente) */
import { useApp } from '../../store';
import { BtnIc, Nota } from '../../components/ui';
import { CASOS } from '@shared/casos';

export function Guia() {
  const { ej, alternarGuia } = useApp();
  if (!ej) return null;
  const d = CASOS[ej.id], sc = d.subcasos.find(s => s.id === ej.sub)!;
  return <aside className="guia"><div className="gh2"><b>Expediente del caso</b><BtnIc n="x" title="Cerrar" onClick={alternarGuia} /></div>
    <div className="gb"><div className="cg">{d.grupo} · {d.entidad.ueNom} · AF {d.anio}</div><h3>{sc.titulo}</h3>
      {sc.enunciado.map((p, i) => <p key={i}>{p}</p>)}
      {sc.nota && <Nota>{sc.nota}</Nota>}
      <h4>Datos del caso</h4><table className="tbl kv sm"><tbody>{sc.datos.map(x => <tr key={x[0]}><td>{x[0]}</td><td>{x[1]}</td></tr>)}</tbody></table>
      <p className="muted sm">Fecha del sistema sugerida para iniciar: <b>{sc.ops[0].fecha}</b>. Cámbiela en la barra del caso cuando el registro corresponda a otro mes.</p>
      <h4>Documentos fuente</h4><ul className="dl">{sc.docsFuente.map(x => <li key={x[0]}><b>{x[0]}</b> · {x[1]}<br /><small>{x[2]}</small></li>)}</ul>
      <h4>Pregunta de análisis</h4><p>{sc.pregunta}</p><p className="muted sm">La respuesta sugerida está en Consulta › Módulo Contable (sección 8).</p></div></aside>;
}
