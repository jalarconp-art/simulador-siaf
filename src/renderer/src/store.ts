/* Estado global de la interfaz (Zustand): sesión, navegación, ejecutora activa, avisos y diálogos. */
import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { Ejecutora, Sesion } from '@shared/types';
import { api } from './api';
import { CTX_ORDER } from '@shared/casos';

export type AppId = 'portal' | 'bienvenida' | 'ejecucion' | 'opl' | 'aeraf' | 'madaf' | 'casos' | 'docente';
export type Pantalla = 'cert' | 'ca' | 'cm' | 'dev' | 'gir' | 'pagotros' | 'pim' | 'mod' | 'modexp' | 'det' | 'rec' | 'ren' | 'reasig' | 'apcta' | 'ope' | 't6' | 'area' | 'ctas' | 'cci' | 'conv' | 'via' | 'dliq' | 'modvia'
  | 'contratos' | 'atp' | 'repcca' | 'rep' | 'transf';
export interface Aviso { id: number; texto: string; sub?: string; tipo: 'ok' | 'err' | 'info' }
export interface Dialogo { id: number; nodo: (cerrar: () => void) => ReactNode; ancho?: 'normal' | 'ancho' | 'conf' }
export interface Filtros { mes: string; q: string; asc: boolean; tipoCert: string; estado: string; rubro: string; adv: boolean }

interface Estado {
  sesion: Sesion | null; app: AppId; pantalla: Pantalla; ejecutoraId: string; ej: Ejecutora | null; cargando: boolean;
  sel: Record<string, string | null>; filtros: Filtros; menuAbierto: boolean; guia: boolean; reporte: { t: string; id: string };
  avisos: Aviso[]; dialogos: Dialogo[];
  ir: (app: AppId) => void; irPantalla: (p: Pantalla) => void; setSesion: (s: Sesion | null) => void;
  setEjecutora: (id: string) => Promise<void>; recargar: () => Promise<void>; seleccionar: (k: string, id: string | null) => void;
  setFiltro: <K extends keyof Filtros>(k: K, v: Filtros[K]) => void; alternarMenu: () => void; alternarGuia: () => void; setReporte: (t: string, id: string) => void;
  avisar: (texto: string, tipo?: Aviso['tipo'], sub?: string) => void; quitarAviso: (id: number) => void;
  abrir: (nodo: Dialogo['nodo'], ancho?: Dialogo['ancho']) => void; cerrarDialogo: (id?: number) => void;
}
let seq = 1;
function ejecutoraInicial(): string {
  let id = '';
  try { id = localStorage.getItem('siaf.ejecutora') || ''; } catch { /* sin almacenamiento */ }
  return (CTX_ORDER as readonly string[]).includes(id) ? id : CTX_ORDER[0];
}
export const FILTROS0: Filtros = { mes: 'TODOS', q: '', asc: false, tipoCert: 'TODOS', estado: 'TODOS', rubro: 'TODOS', adv: false };

export const useApp = create<Estado>((set, get) => ({
  sesion: null, app: 'portal', pantalla: 'cert', ejecutoraId: ejecutoraInicial(), ej: null, cargando: false,
  sel: {}, filtros: { ...FILTROS0 }, menuAbierto: true, guia: false, reporte: { t: 'cert', id: '' }, avisos: [], dialogos: [],
  ir: app => set({ app }),
  irPantalla: pantalla => set({ pantalla, filtros: { ...get().filtros, q: '' } }),
  /* al cambiar de usuario se descarta todo lo cargado del usuario anterior */
  setSesion: sesion => set({ sesion, ej: null, sel: {}, filtros: { ...FILTROS0 }, pantalla: 'cert' }),
  setEjecutora: async id => { try { localStorage.setItem('siaf.ejecutora', id); } catch { /* sin almacenamiento */ } set({ ejecutoraId: id, sel: {} }); await get().recargar(); },
  recargar: async () => {
    if (!get().sesion) return;
    set({ cargando: true });
    try { set({ ej: await api.ejecutora.obtener(get().ejecutoraId) }); } catch (e) { get().avisar((e as Error).message, 'err'); } finally { set({ cargando: false }); }
  },
  seleccionar: (k, id) => set({ sel: { ...get().sel, [k]: id } }),
  setFiltro: (k, v) => set({ filtros: { ...get().filtros, [k]: v } }),
  alternarMenu: () => set({ menuAbierto: !get().menuAbierto }),
  alternarGuia: () => set({ guia: !get().guia }),
  setReporte: (t, id) => set({ reporte: { t, id }, pantalla: 'rep', app: 'ejecucion' }),
  avisar: (texto, tipo = 'ok', sub) => { const id = seq++; set({ avisos: [...get().avisos, { id, texto, tipo, sub }] }); setTimeout(() => get().quitarAviso(id), 6000); },
  quitarAviso: id => set({ avisos: get().avisos.filter(a => a.id !== id) }),
  abrir: (nodo, ancho = 'normal') => set({ dialogos: [...get().dialogos, { id: seq++, nodo, ancho }] }),
  cerrarDialogo: id => set({ dialogos: id ? get().dialogos.filter(d => d.id !== id) : get().dialogos.slice(0, -1) })
}));

/** Ejecuta una operación mostrando el error al usuario; devuelve null si falló. */
export async function intentar<T>(fn: () => Promise<T>, okMsg?: string, sub?: string): Promise<T | null> {
  const s = useApp.getState();
  try { const r = await fn(); if (okMsg) s.avisar(okMsg, 'ok', sub); await s.recargar(); return r; }
  catch (e) { s.avisar((e as Error).message, 'err'); return null; }
}
