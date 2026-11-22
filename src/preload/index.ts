/* Puente seguro entre la interfaz y el proceso principal: solo se exponen estas funciones. */
import { contextBridge, ipcRenderer } from 'electron';
import type { SiafPuente } from './api';

const puente: SiafPuente = {
  plataforma: 'escritorio',
  invoke: (metodo, ...args) => ipcRenderer.invoke('siaf:invoke', metodo, args),
  google: () => ipcRenderer.invoke('siaf:google'),
  guardarTexto: (nombre, contenido, ext) => ipcRenderer.invoke('siaf:guardarTexto', nombre, contenido, ext),
  abrirTexto: ext => ipcRenderer.invoke('siaf:abrirTexto', ext),
  imprimir: (html, titulo) => ipcRenderer.invoke('siaf:imprimir', html, titulo),
  pdf: (html, nombre) => ipcRenderer.invoke('siaf:pdf', html, nombre),
  respaldoExportar: () => ipcRenderer.invoke('siaf:respaldoExportar'),
  respaldoImportar: () => ipcRenderer.invoke('siaf:respaldoImportar'),
  alCambiar: fn => { const h = (_e: unknown, d: Parameters<typeof fn>[0]) => fn(d); ipcRenderer.on('siaf:cambio', h); return () => ipcRenderer.removeListener('siaf:cambio', h); },
  alMenu: fn => { const h = (_e: unknown, c: string) => fn(c); ipcRenderer.on('siaf:menu', h); return () => ipcRenderer.removeListener('siaf:menu', h); }
};
contextBridge.exposeInMainWorld('siaf', puente);
