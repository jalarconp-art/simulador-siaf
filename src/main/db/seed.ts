/* Datos iniciales: docente y cuatro trabajadores de la unidad ejecutora, cada uno con su propio espacio de trabajo. */
import type { Contexto } from '../services/contexto';
import { hashClave } from '../services/authService';
import { hoy, hora, uid } from '@shared/util';
import type { Rol } from '@shared/types';
import { permisosDeRol } from '@shared/permisos';
import { ejecutoraVacia } from '@shared/domain/fabrica';
import { casoDe } from '../repositories/ejecutoraRepo';

export interface UsuarioInicial { usuario: string; clave: string; dni: string; apellidos: string; nombres: string; rol: Rol; email: string; cargo: string }

export const USUARIOS_INICIALES: UsuarioInicial[] = [
  { usuario: 'ADMIN', clave: 'Admin2026', dni: '40000030', apellidos: 'ADMINISTRADOR', nombres: 'DE USUARIOS SIAF', rol: 'ADMINISTRADOR', email: 'admin@siafsimulador.pe', cargo: 'ADMINISTRADOR DE USUARIOS' },
  { usuario: 'RU20261', clave: 'Quispe2026', dni: '41526371', apellidos: 'QUISPE MAMANI', nombres: 'ROSA ELENA', rol: 'OPERADOR', email: 'rquispe@regionpuno.gob.pe', cargo: 'ESPECIALISTA EN PRESUPUESTO' },
  { usuario: 'RU20262', clave: 'Condori2026', dni: '42637482', apellidos: 'CONDORI APAZA', nombres: 'CARLOS ALBERTO', rol: 'OPERADOR', email: 'ccondori@regionpuno.gob.pe', cargo: 'ESPECIALISTA EN ABASTECIMIENTO' },
  { usuario: 'RU20263', clave: 'Flores2026', dni: '43748593', apellidos: 'FLORES CHOQUE', nombres: 'LUCIA MARIBEL', rol: 'OPERADOR', email: 'lflores@regionpuno.gob.pe', cargo: 'ESPECIALISTA EN CONTABILIDAD' },
  { usuario: 'RU20264', clave: 'Ramos2026', dni: '44859604', apellidos: 'RAMOS TICONA', nombres: 'JORGE LUIS', rol: 'OPERADOR', email: 'jramos@regionpuno.gob.pe', cargo: 'ESPECIALISTA EN TESORERIA' }
];

/** Versión de la siembra: v2 separa los espacios por usuario y deja solo el Caso Práctico 1. */
const VERSION_SIEMBRA = '4';

export function sembrar(ctx: Contexto): void {
  if (ctx.meta.get('siembra') === VERSION_SIEMBRA) return;
  ctx.bd.transaccion(() => {
    const ahora = hoy() + ' ' + hora();
    /* v4: como en el SIAF real, cada espacio empieza sin registros (se quita el caso precargado) */
    const previa = Number(ctx.meta.get('siembra') || '0');
    if (previa && previa < 4) ctx.clavesFisicas().forEach(k => ctx.ejecutoras.guardar(ejecutoraVacia(casoDe(k), 'practica'), k));
    /* datos compartidos de versiones anteriores: se eliminan (cada usuario tendrá su propia copia) */
    ctx.ejecutoras.eliminarCompartidas();
    ctx.responsables.eliminarCompartidos();
    USUARIOS_INICIALES.forEach(u => {
      const { hash, salt } = hashClave(u.clave);
      const previo = ctx.usuarios.porUsuario(u.usuario);
      if (previo) { ctx.usuarios.actualizarDatos(previo.id, u); ctx.usuarios.cambiarClave(previo.id, hash, salt); }
      else ctx.usuarios.insertar({ id: uid(), usuario: u.usuario, dni: u.dni, apellidos: u.apellidos, nombres: u.nombres, email: u.email, rol: u.rol, permisos: permisosDeRol(u.rol), estado: 'ACTIVO', creado: ahora }, hash, salt);
    });
    if (!ctx.meta.get('aprobacion_automatica')) ctx.meta.set('aprobacion_automatica', '0');
    ctx.meta.set('sembrado', '1');
    ctx.meta.set('siembra', VERSION_SIEMBRA);
    ctx.auditar('sistema.inicializar', '', 'sistema', 'Usuarios iniciales y espacios por usuario (ejecutora sin registros)');
  });
  /* el espacio de cada usuario inicial se crea de inmediato para que todos arranquen con el caso cargado */
  ctx.usuarios.listar().forEach(u => ctx.asegurarEspacio(u.id));
}
