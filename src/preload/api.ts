/* Tipos del puente IPC (compartidos por preload y renderer). */
import type { Resultado } from '@shared/types';

export interface EventoCambio { ejecutora: string; mensaje?: { texto: string; tipo?: 'ok' | 'info' | 'err' } }
export interface SiafPuente {
  /** escritorio: datos en el equipo · web: datos en Supabase */
  plataforma: 'escritorio' | 'web';
  invoke: (metodo: string, ...args: unknown[]) => Promise<Resultado>;
  /** Inicia sesión con una cuenta de Google y devuelve la sesión (en la web redirige a Google). */
  google: () => Promise<Resultado>;
  guardarTexto: (nombre: string, contenido: string, ext: string) => Promise<Resultado<string>>;
  abrirTexto: (ext: string[]) => Promise<Resultado<{ contenido: string; nombre: string }>>;
  imprimir: (html: string, titulo: string) => Promise<{ ok: boolean }>;
  pdf: (html: string, nombre: string) => Promise<Resultado<string>>;
  respaldoExportar: () => Promise<Resultado<string>>;
  respaldoImportar: () => Promise<Resultado>;
  alCambiar: (fn: (d: EventoCambio) => void) => () => void;
  alMenu: (fn: (cmd: string) => void) => () => void;
  /** Solo escritorio: apoyo para trabajar conectado a la nube (Supabase), igual que la web. */
  nube?: NubeEscritorio;
}
export interface NubeEscritorio {
  /** Motor SQLite (WebAssembly) leído del disco: el renderer no puede descargarlo con fetch desde file://. */
  wasm: () => Promise<Uint8Array>;
  /** Abre un puerto local y devuelve la dirección de retorno para el acceso con Google. */
  oauthPreparar: () => Promise<string>;
  /** Abre el navegador del sistema en la página de Google y espera el código de retorno. */
  oauthAbrir: (url: string) => Promise<string>;
}
