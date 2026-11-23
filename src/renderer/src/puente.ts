/* Puente activo de la interfaz. En el escritorio puede ser el nativo (datos solo en este equipo)
   o el de la nube (mismo núcleo que la web, datos en Supabase compartidos con el navegador). */
import type { SiafPuente } from '../../preload/api';

let activo: SiafPuente | null = null;
export const siaf = (): SiafPuente => activo || window.siaf;
export function usarPuente(p: SiafPuente): void { activo = p; }

const CLAVE = 'siaf-modo';
export type ModoDatos = 'nube' | 'local' | 'web';
let modo: ModoDatos = 'web';
export const modoDatos = (): ModoDatos => modo;
export function fijarModo(m: ModoDatos): void { modo = m; }
/** Preferencia guardada del escritorio: por omisión, conectado a la nube. */
export function preferencia(): 'nube' | 'local' { try { return localStorage.getItem(CLAVE) === 'local' ? 'local' : 'nube'; } catch { return 'nube'; } }
/** Cambia el modo del escritorio y recarga la ventana. */
export function cambiarModo(m: 'nube' | 'local'): void { try { localStorage.setItem(CLAVE, m); } catch { /* sin almacenamiento */ } location.search = ''; location.reload(); }
