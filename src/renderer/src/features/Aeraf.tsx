/* AERAF: acreditación de delegados y responsables de la administración financiera */
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Badge, Btn, Campo, Card, Encabezado, Grid, Lista } from '../components/ui';
import { confirmar } from '../components/Dialogos';
import { PantallaRequisitos } from './Dnie';
import type { Responsable } from '@shared/types';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { hoy } from '@shared/util';

const TIPOS: Record<string, [string, string, number?]> = { del: ['Delegados', 'Registro'], ccp: ['Certificaciones Presupuestales', 'Responsables', 50], ca: ['Compromisos Anuales', 'Responsables', 50], cta: ['Manejo de Cuentas Bancarias', 'Responsables', 4], dev: ['Devengados', 'Responsables', 7], rep: ['Reporte de responsables', 'Consultas'] };
const RENIEC: Record<string, string> = { '40000001': 'QUISPE RAMOS MARIA', '40000002': 'PEREZ MAMANI JUAN', '40000003': 'CONDORI HUANCA PEDRO', '40000004': 'MENDOZA CARLOS', '40000010': 'RESPONSABLE DE PRUEBA', '40000011': 'DELEGADO DE PRUEBA', '77126557': 'QUISPE FERNANDEZ ADRIAN JUNIOR' };

export function Aeraf() {
  const { ejecutoraId, avisar, ir, sesion } = useApp();
  const [dnie, setDnie] = useState<{ dni: string; nombre: string } | null>(null);
  const [t, setT] = useState('del'); const [x, setX] = useState(ejecutoraId); const [lista, setLista] = useState<Responsable[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({}); const [nuevo, setNuevo] = useState(false);
  const [d, setD] = useState({ dni: '', nombre: '', cargo: 'DIRECTOR GENERAL DE ADMINISTRACION', area: 'OFICINA GENERAL DE ADMINISTRACION', email: '', doc: '', fdoc: hoy(), rol: 'TITULAR' });
  const cargar = () => api.aeraf.listar(x).then(setLista);
  useEffect(() => { api.dnie.sesion('aeraf').then(setDnie); }, []);
  useEffect(() => { if (dnie) cargar(); setSel({}); setNuevo(false); }, [x, t, dnie]);
  if (!dnie) return <PantallaRequisitos app="aeraf" alEntrar={() => api.dnie.sesion('aeraf').then(setDnie)} />;
  const ids = Object.keys(sel).filter(k => sel[k]);
  const accion = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); avisar(msg); cargar(); setSel({}); } catch (e) { avisar((e as Error).message, 'err'); } };
  let grp = '';
  const filas = t === 'rep' ? lista : lista.filter(r => r.tipo === t);
  return <div className="oldapp aeraf"><header className="ohd"><b>SIAF</b> · Acreditación Electrónica de Responsables de la Administración Financiera <span className="tb-sp" /><span className="sm">Usuario: {dnie.dni} {dnie.nombre}</span>
    <button className="btn btn-w sm" onClick={async () => { await api.dnie.salir('aeraf'); setDnie(null); }}>Cerrar sesión</button><button className="btn btn-w sm" onClick={() => ir(sesion ? 'bienvenida' : 'portal')}>‹ Volver</button></header>
    <div className="olay"><aside className="otree">{Object.keys(TIPOS).map(k => { const h = <div key={k}>{TIPOS[k][1] !== grp && <div className="mgrp">{TIPOS[k][1]}</div>}<a className={t === k ? 'on' : ''} onClick={() => setT(k)}>{TIPOS[k][0]}</a></div>; grp = TIPOS[k][1]; return h; })}</aside>
      <section className="obody"><div className="inl"><label>Elija la entidad vinculada</label><select className="ctl" value={x} onChange={e => setX(e.target.value)}>{CTX_ORDER.map(c => <option key={c} value={c}>{CASOS[c].entidad.secEjec} - {CASOS[c].entidad.ueNom}</option>)}</select></div>
        <Card><Encabezado titulo={t === 'rep' ? 'Reporte de responsables' : t === 'del' ? 'Delegados' : 'Responsables de ' + TIPOS[t][0]} sub={t === 'rep' ? '' : t === 'del' ? 'El delegado puede dar de alta o de baja a los responsables; el devengado es facultad exclusiva del DGA.' : 'Máximo ' + (t === 'cta' ? '2 titulares y 2 suplentes' : TIPOS[t][2] + ' responsables') + (t === 'dev' ? ' · los acredita el Director General de Administración' : '')}
          acciones={t !== 'rep' && <><Btn v="p" icon="plus" onClick={() => setNuevo(!nuevo)}>Nuevo</Btn><Btn icon="check" onClick={async () => { if (!ids.length) { avisar('Marque la casilla del responsable para habilitar Autorizar.', 'err'); return; } if (await confirmar('¿Autorizar a los responsables seleccionados?', { icono: 'check', ok: 'Autorizar' })) accion(() => api.aeraf.autorizar(ids), 'Autorización registrada.'); }}>Autorizar</Btn><Btn v="g" onClick={async () => { if (!ids.length) { avisar('Marque al menos un registro.', 'err'); return; } if (await confirmar('¿Dar de baja a los seleccionados?', { icono: 'warn', ok: 'Dar de baja' })) accion(() => api.aeraf.baja(ids), 'Registros dados de baja.'); }}>Dar de baja</Btn></>} />
          {nuevo && <Card form><Encabezado titulo={t === 'del' ? 'NUEVO DELEGADO' : 'NUEVO RESPONSABLE · ' + TIPOS[t][0].toUpperCase()} acciones={<><Btn v="g" icon="x" onClick={() => setNuevo(false)}>Cancelar</Btn><Btn v="p" icon="save" onClick={async () => { if (await confirmar('¿Grabar el registro?')) accion(async () => { await api.aeraf.crear({ ejecutora: x, tipo: t as Responsable['tipo'], ...d }); setNuevo(false); }, t === 'del' ? 'Delegado registrado.' : 'Responsable registrado: marque la casilla y pulse Autorizar.'); }}>Grabar</Btn></>} />
            <Grid><div className="f c3"><label>DNI (verificado en RENIEC)</label><div className="inl"><input className="ctl req" maxLength={8} value={d.dni} onChange={e => setD({ ...d, dni: e.target.value })} /><Btn sm onClick={() => { if (!/^\d{8}$/.test(d.dni)) { avisar('El DNI debe tener 8 dígitos.', 'err'); return; } setD({ ...d, nombre: RENIEC[d.dni] || d.nombre }); avisar(RENIEC[d.dni] ? 'DNI verificado en RENIEC (simulado).' : 'DNI con formato válido: complete apellidos y nombres.', 'info'); }}>Agregar</Btn></div></div>
              <Campo label="Apellidos y nombres" c={5} req value={d.nombre} onChange={v => setD({ ...d, nombre: v })} /><Lista label="Cargo" c={4} value={d.cargo} onChange={v => setD({ ...d, cargo: v })} opciones={['JEFE DE PLANEAMIENTO Y PRESUPUESTO', 'DIRECTOR GENERAL DE ADMINISTRACION', 'JEFE DE TESORERIA', 'JEFE DE CONTABILIDAD', 'JEFE DE ABASTECIMIENTO', 'GERENTE MUNICIPAL', 'OTRO']} />
              <Lista label="Área de la entidad" c={4} value={d.area} onChange={v => setD({ ...d, area: v })} opciones={['OFICINA DE PLANEAMIENTO Y PRESUPUESTO', 'OFICINA GENERAL DE ADMINISTRACION', 'TESORERIA', 'CONTABILIDAD', 'ABASTECIMIENTO', 'GERENCIA MUNICIPAL']} /><Campo label="Email" c={4} req value={d.email} onChange={v => setD({ ...d, email: v })} />{t === 'cta' && <Lista label="Condición" c={4} value={d.rol} onChange={v => setD({ ...d, rol: v })} opciones={['TITULAR', 'SUPLENTE']} />}
              <Campo label="Documento que acredita (número)" c={4} req value={d.doc} onChange={v => setD({ ...d, doc: v })} /><Campo label="Fecha del documento" c={4} req value={d.fdoc} onChange={v => setD({ ...d, fdoc: v })} /></Grid></Card>}
          <table className="tbl"><thead><tr>{t !== 'rep' && <th />}{t === 'rep' && <th>Tipo</th>}<th>DNI</th><th>Apellidos y nombres</th><th>Cargo</th><th>Área</th><th>Email</th>{t === 'cta' && <><th>Condición</th><th>Email confirmado</th></>}<th>Documento</th><th>Estado</th></tr></thead><tbody>
            {filas.map(r => <tr key={r.id}>{t !== 'rep' && <td className="c"><input type="checkbox" checked={!!sel[r.id]} onChange={e => setSel({ ...sel, [r.id]: e.target.checked })} /></td>}{t === 'rep' && <td>{TIPOS[r.tipo][0]}</td>}<td>{r.dni}</td><td>{r.nombre}</td><td className="sm">{r.cargo}</td><td className="sm">{r.area}</td><td className="sm">{r.email}</td>
              {t === 'cta' && <><td>{r.rol}</td><td>{r.emailOk ? 'Sí' : <Btn sm onClick={() => accion(() => api.aeraf.confirmarEmail(r.id), 'Email confirmado: ' + r.email)}>Confirmar email</Btn>}</td></>}<td className="sm">{r.doc} · {r.fdoc}</td><td><Badge e={r.estado} /></td></tr>)}
            {!filas.length && <tr><td colSpan={10} className="c muted">Sin registros</td></tr>}</tbody></table></Card></section></div></div>;
}
