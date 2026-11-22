/* Panel del docente: aulas, estudiantes, entregas calificadas automáticamente y auditoría */
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Topbar } from '../components/Shell';
import { Btn, BtnIc, Campo, Card, Encabezado, Grid, Nota, Tabs, Vacio } from '../components/ui';
import { confirmar } from '../components/Dialogos';
import type { Aula, Auditoria, Entrega, Estudiante } from '@shared/types';
import { fmt } from '@shared/util';
import { esAdmin } from '@shared/permisos';

export function Docente() {
  const { sesion } = useApp();
  const [tab, setTab] = useState('trab');
  if (!esAdmin(sesion?.usuario)) return <><Topbar app="docente" /><div className="welcome"><Vacio titulo="Acceso restringido" texto="El panel requiere el perfil de Administrador de usuarios." icono="lock" /></div></>;
  return <><Topbar app="docente" /><div className="docente"><div className="dc-head"><h2>Panel del administrador</h2><Tabs tabs={[['trab', 'Avance de los usuarios'], ...(window.siaf.plataforma === 'escritorio' ? [['aulas', 'Aulas y calificaciones'] as [string, string]] : []), ['aud', 'Auditoría del sistema']]} val={tab} set={setTab} /></div>{tab === 'trab' ? <Avance /> : tab === 'aulas' ? <Aulas /> : <Bitacora />}</div></>;
}

type Avance = Awaited<ReturnType<typeof api.progreso>>[number];
function Avance() {
  const { avisar } = useApp();
  const [l, setL] = useState<Avance[]>([]);
  const cargar = () => api.progreso().then(setL).catch(e => avisar(e.message, 'err'));
  useEffect(() => { cargar(); }, []);
  const MODO: Record<string, string> = { solucion: 'Caso resuelto cargado', practica: 'En práctica', vacio: 'Sin datos', 'sin iniciar': 'Sin iniciar' };
  return <Card><Encabezado titulo="Avance de cada usuario en el Caso Práctico 1" sub="Cada usuario trabaja en su propio espacio; la nota compara sus registros con la solución del caso (solo lectura)" acciones={<Btn icon="reset" onClick={cargar}>Actualizar</Btn>} />
    <table className="tbl"><thead><tr><th>Usuario</th><th>Apellidos y nombres</th><th>Correo</th><th>Estado del espacio</th><th className="r">Registros</th><th className="r">Avance</th><th className="r">Nota</th></tr></thead><tbody>
      {l.map(u => <tr key={u.usuario}><td className="mono">{u.usuario}</td><td>{u.nombre}</td><td className="sm">{u.email}</td><td>{MODO[u.modo] || u.modo}</td><td className="r">{u.registros}</td><td className="r">{fmt(u.puntaje)} %</td><td className="r"><b className={u.nota20 >= 10.5 ? 'nota-ok' : 'nota-mal'}>{fmt(u.nota20)}</b></td></tr>)}
      {!l.length && <tr><td colSpan={7} className="c muted">Aún no hay usuarios operadores.</td></tr>}</tbody></table>
    <Nota>La nota compara lo que cada usuario registró en su espacio con el expediente de referencia de la obra P.S. Aymaña (certificación, compromiso anual, compromiso mensual, devengado y girado).</Nota></Card>;
}

function Aulas() {
  const { avisar } = useApp();
  const [aulas, setAulas] = useState<Aula[]>([]); const [sel, setSel] = useState(''); const [n, setN] = useState(''); const [p, setP] = useState('2026-II');
  const cargar = () => api.aula.listar().then(a => { setAulas(a); if (!sel && a[0]) setSel(a[0].id); });
  useEffect(() => { cargar(); }, []);
  const crear = async () => { try { const a = await api.aula.crear(n, p); setN(''); setSel(a.id); cargar(); avisar('Aula creada.'); } catch (e) { avisar((e as Error).message, 'err'); } };
  return <div className="dc-grid">
    <Card><h3>Aulas</h3><Grid><Campo label="Nombre del aula" c={12} value={n} onChange={setN} ph="Gabinete CON312 - Grupo F" /><Campo label="Periodo" c={8} value={p} onChange={setP} /><div className="f c4"><label>&nbsp;</label><Btn v="p" icon="plus" full onClick={crear}>Crear</Btn></div></Grid>
      <div className="uelist">{aulas.map(a => <div key={a.id} className={'ueit' + (sel === a.id ? ' on' : '')} onClick={() => setSel(a.id)}><b>{a.nombre}</b><small>{a.periodo} · {a.estudiantes} estudiantes · creada {a.creado}</small></div>)}{!aulas.length && <p className="muted">Cree su primera aula para registrar estudiantes y calificar sus entregas.</p>}</div></Card>
    {sel ? <DetalleAula aula={aulas.find(a => a.id === sel)} onCambio={cargar} onEliminar={() => { setSel(''); cargar(); }} /> : <Card><Vacio titulo="Seleccione un aula" texto="Las entregas de los estudiantes se califican automáticamente con el verificador de los casos." icono="users" /></Card>}
  </div>;
}

function DetalleAula({ aula, onCambio, onEliminar }: { aula?: Aula; onCambio: () => void; onEliminar: () => void }) {
  const { avisar } = useApp();
  const [est, setEst] = useState<Estudiante[]>([]); const [ent, setEnt] = useState<Entrega[]>([]);
  const [d, setD] = useState({ codigo: '', nombres: '', dni: '' }); const [ver, setVer] = useState<Entrega | null>(null);
  const cargar = () => { if (!aula) return; api.aula.estudiantes(aula.id).then(setEst); api.aula.entregas(aula.id).then(setEnt); };
  useEffect(() => { cargar(); setVer(null); }, [aula?.id]);
  if (!aula) return null;
  const err = (e: unknown) => avisar((e as Error).message, 'err');
  const ultima = (id: string) => ent.filter(e => e.estudianteId === id)[0];
  const exportar = async () => {
    const filas = [['Codigo', 'Estudiante', 'DNI', 'Fecha de entrega', 'Puntaje (%)', 'Nota (0-20)']].concat(est.map(s => { const e = ultima(s.id); return [s.codigo, s.nombres, s.dni, e?.fecha || '', e ? String(e.puntaje) : '', e ? String(e.nota20) : '']; }));
    const r = await api.escritorio.guardarTexto(`Notas_${aula.nombre.replace(/\W+/g, '_')}.csv`, '﻿' + filas.map(f => f.map(c => '"' + c + '"').join(';')).join('\r\n'), 'csv');
    if (r.ok) avisar('Notas exportadas.', 'ok', String(r.data));
  };
  return <Card><Encabezado titulo={aula.nombre} sub={aula.periodo + ' · ' + est.length + ' estudiantes · ' + ent.length + ' entregas'} acciones={<>
    <Btn icon="upload" onClick={async () => { const r = await api.escritorio.abrirTexto(['siafentrega', 'json']); if (!r.ok || !r.data) return; try { const e = await api.aula.importarEntrega(aula.id, r.data.contenido, r.data.nombre); avisar('Entrega calificada: ' + fmt(e.nota20) + ' / 20'); cargar(); onCambio(); } catch (x) { err(x); } }}>Importar entrega</Btn>
    <Btn icon="list" onClick={async () => { const r = await api.escritorio.abrirTexto(['csv', 'txt']); if (!r.ok || !r.data) return; try { const n = await api.aula.importarCSV(aula.id, r.data.contenido); avisar(n + ' estudiante(s) importado(s).'); cargar(); onCambio(); } catch (x) { err(x); } }}>Importar lista CSV</Btn>
    <Btn icon="download" onClick={exportar}>Exportar notas</Btn>
    <Btn v="danger" icon="trash" onClick={async () => { if (await confirmar('¿Eliminar el aula con sus estudiantes y entregas?', { icono: 'warn', ok: 'Eliminar' })) { await api.aula.eliminar(aula.id).catch(err); onEliminar(); } }}>Eliminar aula</Btn></>} />
    <Nota>El estudiante genera su archivo desde el menú Archivo › Generar archivo de entrega. Al importarlo, el verificador compara sus registros con la solución de los tres casos y asigna una nota sobre 20.</Nota>
    <Grid><Campo label="Código" c={3} value={d.codigo} onChange={v => setD({ ...d, codigo: v })} /><Campo label="Apellidos y nombres" c={5} value={d.nombres} onChange={v => setD({ ...d, nombres: v })} /><Campo label="DNI" c={2} max={8} value={d.dni} onChange={v => setD({ ...d, dni: v })} /><div className="f c2"><label>&nbsp;</label><Btn icon="plus" onClick={async () => { try { await api.aula.agregar(aula.id, d.codigo, d.nombres, d.dni); setD({ codigo: '', nombres: '', dni: '' }); cargar(); onCambio(); } catch (x) { err(x); } }}>Agregar</Btn></div></Grid>
    <table className="tbl"><thead><tr><th>Código</th><th>Estudiante</th><th>DNI</th><th>Última entrega</th><th className="r">Puntaje</th><th className="r">Nota</th><th /></tr></thead><tbody>
      {est.map(s => { const e = ultima(s.id); return <tr key={s.id}><td className="mono">{s.codigo}</td><td>{s.nombres}</td><td>{s.dni}</td><td className="sm">{e?.fecha || '—'}</td><td className="r">{e ? fmt(e.puntaje) + ' %' : '—'}</td><td className="r"><b className={e ? (e.nota20 >= 10.5 ? 'nota-ok' : 'nota-mal') : ''}>{e ? fmt(e.nota20) : '—'}</b></td>
        <td className="nowrap">{e && <Btn sm onClick={() => setVer(e)}>Detalle</Btn>} <BtnIc n="trash" title="Eliminar" onClick={async () => { if (await confirmar('¿Eliminar al estudiante ' + s.nombres + '?', { icono: 'trash', ok: 'Eliminar' })) { await api.aula.eliminarEstudiante(s.id).catch(err); cargar(); onCambio(); } }} /></td></tr>; })}
      {!est.length && <tr><td colSpan={7} className="c muted">Sin estudiantes. Agréguelos, importe una lista CSV (código;nombres;dni) o importe directamente sus entregas.</td></tr>}</tbody></table>
    {ver && <><h4>Detalle de la calificación · {est.find(s => s.id === ver.estudianteId)?.nombres} · {ver.archivo}</h4><table className="tbl sm"><thead><tr><th>Ejecutora</th><th>Caso</th><th className="r">Correctos</th><th className="r">Total</th><th className="r">%</th></tr></thead><tbody>
      {ver.detalle.map((x, i) => <tr key={i}><td>{x.ejecutora}</td><td>{x.titulo}</td><td className="r">{x.ok}</td><td className="r">{x.total}</td><td className="r">{x.total ? Math.round(x.ok * 100 / x.total) : 0}%</td></tr>)}
      <tr className="tot"><td colSpan={4}>NOTA FINAL</td><td className="r">{fmt(ver.nota20)} / 20</td></tr></tbody></table></>}
  </Card>;
}

function Bitacora() {
  const [f, setF] = useState(''); const [l, setL] = useState<Auditoria[]>([]);
  const cargar = () => api.auditoria(f, 500).then(setL);
  useEffect(() => { cargar(); }, [f]);
  return <Card><Encabezado titulo="Auditoría del sistema" sub="Cada operación queda registrada con usuario, fecha, ejecutora y detalle (últimos 500 eventos)" acciones={<Btn icon="reset" onClick={cargar}>Actualizar</Btn>} />
    <div className="inl"><input className="ctl" placeholder="Filtrar por usuario, acción, ejecutora o detalle" value={f} onChange={e => setF(e.target.value)} /></div>
    <div className="ovx"><table className="tbl sm"><thead><tr><th>#</th><th>Fecha y hora</th><th>Usuario</th><th>Ejecutora</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>
      {l.map(a => <tr key={a.id}><td>{a.id}</td><td className="nowrap">{a.fecha}</td><td>{a.usuario}</td><td>{a.ejecutora}</td><td className="mono">{a.accion}</td><td className="sm">{a.detalle}</td></tr>)}</tbody></table></div></Card>;
}
