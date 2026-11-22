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
}
