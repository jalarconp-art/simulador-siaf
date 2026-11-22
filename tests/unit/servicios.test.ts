import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Aplicacion } from '../../src/main/app';
import { USUARIOS_INICIALES } from '../../src/main/db/seed';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { construirSolucion } from '@shared/domain/fabrica';
import { verificar } from '@shared/domain/contabilidad';
import type { Ejecutora, Target } from '@shared/types';

let app: Aplicacion;
const ok = (metodo: string, ...args: unknown[]) => { const r = app.invocar(metodo, args); if (!r.ok) throw new Error(metodo + ': ' + r.error); return r.data as any; };
const falla = (metodo: string, ...args: unknown[]) => { const r = app.invocar(metodo, args); expect(r.ok).toBe(false); return r.error as string; };
const ej = (x = 'cp1') => ok('ejecutora.obtener', x) as Ejecutora;
const cred = (u: string) => { const x = USUARIOS_INICIALES.find(z => z.usuario === u)!; return [x.usuario, x.clave] as const; };
const entrar = (u: string) => { ok('sesion.logout'); ok('sesion.login', ...cred(u)); };

async function madaf(tipo: string, targets: Target[]) {
  ok('dnie.ingresar', 'madaf', '40000010', '123456');
  const mail = ok('madaf.clave', tipo, 'cp1');
  ok('madaf.autorizar', tipo, 'cp1', targets, mail.codigo, true);
}

beforeEach(async () => {
  app = await Aplicacion.iniciar(null);
  app.ctx.retardoVerificacion = 0;
});

describe('Base de datos y repositorio', () => {
  it('solo el Caso Práctico 1 (Aymaña) está habilitado', () => {
    expect([...CTX_ORDER]).toEqual(['cp1']);
    expect(CASOS.cp1.metas[0].prod).toBe('2308220');
  });
  it('guarda y recupera el agregado sin pérdida', () => {
    const a = construirSolucion('cp1');
    app.ctx.ejecutoras.guardar(a, 'usuario-x::cp1');
    const b = app.ctx.ejecutoras.cargar('usuario-x::cp1')!;
    expect(JSON.parse(JSON.stringify(b))).toEqual(JSON.parse(JSON.stringify(a)));
  });
  it('persiste en disco y vuelve a abrir', async () => {
    const f = path.join(os.tmpdir(), 'siaf-test-' + Date.now() + '.sqlite');
    const a1 = await Aplicacion.iniciar(f);
    expect(fs.existsSync(f)).toBe(true);
    a1.bd.cerrar();
    const a2 = await Aplicacion.iniciar(f);
    expect(a2.ctx.usuarios.contar()).toBe(5);
    expect(a2.ctx.clavesFisicas().length).toBe(5);
    expect(a2.bd.version).toBe(2);
    a2.bd.cerrar(); fs.unlinkSync(f);
  });
  it('revierte la transacción si la operación falla', () => {
    entrar('RU20261');
    const antes = ej().certs.length;
    falla('cert.grabar', { ejecutora: 'cp1', doc: { cod: '086', num: '1', fecha: '19/01/2022' }, rubro: '18', tipoCert: 'OTROS', justif: 'PRUEBA', items: [{ clas: '2.6.2.2.3.2', meta: '0902', monto: 999999999 }] });
    expect(ej().certs.length).toBe(antes);
  });
});

describe('Usuarios y seguridad', () => {
  it('crea el docente y cuatro trabajadores, cada uno con su espacio y el caso cargado', () => {
    const ops = USUARIOS_INICIALES.filter(u => u.rol === 'OPERADOR');
    expect(ops.length).toBe(4);
    for (const u of ops) { entrar(u.usuario); const e = ej(); expect(e.modo).toBe('solucion'); expect(e.certs[0].num).toBe(233); }
  });
  it('rechaza credenciales incorrectas y exige sesión', () => {
    expect(falla('sesion.login', 'RU20261', 'mala')).toContain('incorrectos');
    expect(falla('ejecutora.obtener', 'cp1')).toContain('iniciar sesión');
  });
  it('inicia sesión con el correo electrónico', () => {
    const s = ok('sesion.login', 'RQUISPE@regionpuno.gob.pe', cred('RU20261')[1]);
    expect(s.usuario.usuario).toBe('RU20261');
  });
  it('registro con correo: crea la cuenta, su espacio propio y permite ingresar con el correo', () => {
    const s = ok('sesion.registrar', { apellidos: 'Mamani Huanca', nombres: 'Elena', dni: '45678901', email: 'Elena.Mamani@correo.pe', clave: 'Elena2026' });
    expect(s.usuario.rol).toBe('OPERADOR');
    expect(s.usuario.email).toBe('elena.mamani@correo.pe');
    expect(ej().modo).toBe('solucion');
    ok('sesion.logout');
    expect(falla('sesion.registrar', { apellidos: 'Otro', nombres: 'Otro', dni: '45678902', email: 'elena.mamani@correo.pe', clave: 'Otra12345' })).toContain('correo');
    expect(falla('sesion.registrar', { apellidos: 'Otro', nombres: 'Otro', dni: '45678903', email: 'otro@correo.pe', clave: 'corta' })).toContain('8 caracteres');
    expect(ok('sesion.login', 'elena.mamani@correo.pe', 'Elena2026').usuario.usuario).toBe(s.usuario.usuario);
  });
  it('el operador no puede crear ni listar usuarios; el docente sí', () => {
    entrar('RU20261');
    expect(falla('usuarios.crear', { dni: '41234567', apellidos: 'X', nombres: 'Y', email: 'a@b.pe', rol: 'OPERADOR' })).toContain('perfil');
    expect(falla('usuarios.listar')).toContain('perfil');
    entrar('ADMIN');
    const r = ok('usuarios.crear', { dni: '41234567', apellidos: 'Quispe', nombres: 'Ana', email: 'a@b.pe', rol: 'OPERADOR' });
    expect(r.usuario.usuario).toMatch(/^RU\d+/);
    ok('sesion.logout');
    ok('sesion.login', r.usuario.usuario, r.clave);
  });
  it('registra auditoría', () => {
    entrar('ADMIN');
    expect(ok('auditoria.listar', '', 50).some((a: any) => a.accion === 'auth.login')).toBe(true);
  });
});

describe('Perfiles SIAF y permisos asignados por el administrador', () => {
  const idDe = (u: string) => (ok('usuarios.listar') as any[]).find(x => x.usuario === u).id;
  it('el administrador asigna el perfil Consulta y el usuario ya no puede registrar', () => {
    entrar('ADMIN');
    const u = ok('usuarios.perfil', idDe('RU20262'), 'CONSULTA', { cert: 'C', ca: 'C', cm: 'C', dev: 'C', gir: 'C', mod: 'C', det: 'C', cont: 'C', opp: 'C' });
    expect(u.rol).toBe('CONSULTA');
    entrar('RU20262');
    expect(ej().certs.length).toBeGreaterThan(0);
    expect(falla('cert.grabar', { ejecutora: 'cp1', doc: { cod: '086', num: '1', fecha: '18/10/2021' }, rubro: '18', tipoCert: 'OTROS', justif: 'PRUEBA', items: [{ clas: '2.6.2.2.3.2', meta: '0902', monto: 10 }] })).toContain('Certificación');
  });
  it('Logística registra certificados pero no devengados ni aprobaciones OPP', () => {
    entrar('ADMIN');
    ok('usuarios.perfil', idDe('RU20263'), 'LOGISTICA', { cert: 'O', ca: 'O', cm: 'O', mod: 'O', dev: 'C', gir: 'C', det: 'C', cont: 'C', opp: 'C' });
    entrar('RU20263');
    ok('ejecutora.practicar', 'cp1');
    const c = ok('cert.grabar', { ejecutora: 'cp1', doc: { cod: '086', num: 'MEMO 9', fecha: '18/10/2021' }, rubro: '18', tipoCert: 'ADQUISICION / SEACE', justif: 'PRUEBA LOGISTICA', items: [{ clas: '2.6.2.2.3.2', meta: '0902', monto: 100 }] });
    const t: Target = { k: 'cs', x: 'cp1', id: c.id, s: 1 };
    ok('flujo.enviar', t);
    expect(falla('opp.procesar', 'cp1', [t], [])).toContain('Módulo Presupuestal');
  });
  it('solo el administrador asigna perfiles y no puede quitarse su propio perfil', () => {
    entrar('RU20261');
    expect(falla('usuarios.perfil', 'x', 'ADMINISTRADOR', {})).toContain('Administrador');
    entrar('ADMIN');
    expect(falla('usuarios.perfil', idDe('ADMIN'), 'OPERADOR', {})).toContain('sí mismo');
  });
  it('acceso con Google: crea el usuario operador con su espacio, y vincula una cuenta existente por correo', () => {
    const s = app.loginGoogle({ sub: 'g-123', email: 'Nuevo.Usuario@gmail.com', nombres: 'Nuevo', apellidos: 'Usuario' });
    expect(s.usuario.proveedor).toBe('google');
    expect(s.usuario.rol).toBe('OPERADOR');
    expect(ej().modo).toBe('solucion');
    ok('sesion.logout');
    const v = app.loginGoogle({ sub: 'g-999', email: 'rquispe@regionpuno.gob.pe', nombres: 'Rosa', apellidos: 'Quispe' });
    expect(v.usuario.usuario).toBe('RU20261');
    ok('sesion.logout');
    expect(app.loginGoogle({ sub: 'g-123', email: 'nuevo.usuario@gmail.com', nombres: '', apellidos: '' }).usuario.usuario).toBe(s.usuario.usuario);
  });
  it('configuración de Google solo por el administrador', () => {
    expect(ok('google.disponible')).toBe(false);
    entrar('RU20261');
    expect(falla('google.guardar', 'x.apps.googleusercontent.com', 's')).toContain('Administrador');
    entrar('ADMIN');
    expect(falla('google.guardar', 'malo', 's')).toContain('googleusercontent');
    ok('google.guardar', '123-abc.apps.googleusercontent.com', 'secreto');
    expect(ok('google.disponible')).toBe(true);
  });
  it('migra una base de la versión anterior: DOCENTE pasa a Administrador y OPP a Presupuesto', async () => {
    const { BaseDatos } = await import('../../src/main/db/database');
    const { MIGRACIONES } = await import('../../src/main/db/schema');
    const bd = await BaseDatos.abrir();
    expect(bd.version).toBe(MIGRACIONES.length);
    const f = path.join(os.tmpdir(), 'siaf-v1-' + Date.now() + '.sqlite');
    const initSqlJs = (await import('sql.js')).default; const SQL = await initSqlJs();
    const v1 = new SQL.Database(); v1.run('CREATE TABLE schema_version (version INTEGER NOT NULL, aplicada TEXT NOT NULL);'); v1.exec(MIGRACIONES[0]); v1.run("INSERT INTO schema_version VALUES (1,'x')");
    v1.run("INSERT INTO usuarios VALUES ('d1','DOCENTE','1','A','B','d@x.pe','DOCENTE','h','s','ACTIVO','x'),('o1','OPP20261','2','A','B','o@x.pe','OPP','h','s','ACTIVO','x')");
    fs.writeFileSync(f, Buffer.from(v1.export()));
    const a = await Aplicacion.iniciar(f);
    const us = a.ctx.usuarios.listar();
    expect(us.find(u => u.usuario === 'DOCENTE')!.rol).toBe('ADMINISTRADOR');
    expect(us.find(u => u.usuario === 'OPP20261')!.rol).toBe('PRESUPUESTO');
    expect(us.find(u => u.usuario === 'OPP20261')!.permisos.opp).toBe('O');
    a.bd.cerrar(); fs.unlinkSync(f);
  });
});

describe('Aislamiento entre usuarios', () => {
  it('lo que registra un trabajador no aparece en el espacio de otro', () => {
    entrar('RU20261');
    ok('ejecutora.practicar', 'cp1');
    ok('cert.grabar', { ejecutora: 'cp1', doc: { cod: '086', num: 'MEMO 1', fecha: '18/10/2021' }, rubro: '18', tipoCert: 'ADQUISICION / SEACE', justif: 'CERTIFICADO DE ROSA', items: [{ clas: '2.6.2.2.3.2', meta: '0902', monto: 1000 }] });
    expect(ej().certs.map(c => c.justif)).toEqual(['CERTIFICADO DE ROSA']);
    entrar('RU20262');
    const otro = ej();
    expect(otro.modo).toBe('solucion');
    expect(otro.certs.some(c => c.justif === 'CERTIFICADO DE ROSA')).toBe(false);
    entrar('RU20261');
    expect(ej().certs.length).toBe(1);
  });
  it('los responsables del AERAF también son propios de cada usuario', () => {
    entrar('RU20261');
    ok('dnie.ingresar', 'aeraf', '40000099', '123456');
    ok('aeraf.crear', { ejecutora: 'cp1', tipo: 'ccp', dni: '47777777', nombre: 'Responsable de Rosa', cargo: 'JEFE', area: 'OPP', email: 'r@x.pe', doc: 'RES 1', fdoc: '02/01/2022' });
    expect(ok('aeraf.listar', 'cp1').some((r: any) => r.dni === '47777777')).toBe(true);
    const ajeno = ok('aeraf.listar', 'cp1').find((r: any) => r.dni === '47777777').id;
    entrar('RU20262');
    expect(ok('aeraf.listar', 'cp1').some((r: any) => r.dni === '47777777')).toBe(false);
    ok('dnie.ingresar', 'aeraf', '40000099', '123456');
    expect(falla('aeraf.baja', [ajeno])).toContain('no encontrado');
  });
  it('al cambiar de usuario se cierra la sesión DNIe del MADAF', () => {
    entrar('RU20261');
    ok('dnie.ingresar', 'madaf', '40000010', '123456');
    entrar('RU20262');
    expect(ok('dnie.sesion', 'madaf')).toBeNull();
  });
});

describe('Flujo completo del Caso Práctico 1 en modo práctica', () => {
  it('certificación, ampliación, OPP, MADAF, compromiso anual, compromisos mensuales, devengado y girado verifican al 100 %', async () => {
    entrar('RU20263');
    ok('ejecutora.practicar', 'cp1');
    const cert = ok('cert.grabar', { ejecutora: 'cp1', doc: { cod: '086', num: '100-2021-GR-PUNO/ORA/OASA', fecha: '18/10/2021' }, rubro: '18', tipoCert: 'ADQUISICION / SEACE', justif: 'EJECUCION DE LA OBRA MEJORAMIENTO DE LA CAPACIDAD RESOLUTIVA DEL PUESTO DE SALUD DE AYMAÑA, CUI 2308220', items: [{ clas: '2.6.2.2.3.2', meta: '0902', monto: 5959341.13 }] });
    const tc: Target = { k: 'cs', x: 'cp1', id: cert.id, s: 1 };
    ok('flujo.enviar', tc);
    expect(ej().certs[0].secs[0].estado).toBe('ENVIADO A OPP');
    ok('opp.procesar', 'cp1', [tc], []);
    expect(ej().certs[0].secs[0].estado).toBe('PENDIENTE DE FIRMA');
    await madaf('ccp', [tc]);
    expect(ej().certs[0].secs[0].estado).toBe('APROBADO');

    ok('cert.modificacion', { ejecutora: 'cp1', certId: cert.id, tipo: 'AMPLIACION', doc: { cod: '086', num: '012-2022-GR-PUNO/ORA/OASA', fecha: '20/01/2022' }, items: [{ clas: '2.6.3.2.4.2', meta: '0902', monto: 1693537.96 }] });
    const ta: Target = { k: 'cs', x: 'cp1', id: cert.id, s: 2 };
    ok('flujo.enviar', ta);
    ok('opp.procesar', 'cp1', [ta], []);
    await madaf('ccp', [ta]);
    expect(ej().certs[0].secs[1].estado).toBe('APROBADO');

    const itemsCA = [{ clas: '2.6.2.2.3.2', meta: '0902', monto: 5959341.13 }, { clas: '2.6.3.2.4.2', meta: '0902', monto: 1693537.96 }];
    const ca = ok('ca.grabar', { ejecutora: 'cp1', certId: cert.id, tipoOp: 'N', doc: { cod: '070', num: '08-2022-AS-GR PUNO', fecha: '18/01/2022' }, provNum: '20999999991', justif: 'CONTRATO Nº 08 2022 AS GR PUNO CON EL CONSORCIO AMERICANO', items: itemsCA });
    ok('flujo.enviar', { k: 'ca', x: 'cp1', id: ca.id });
    await madaf('ca', [{ k: 'ca', x: 'cp1', id: ca.id }]);
    expect(ej().cas[0].estado).toBe('APROBADO');

    const cm = (fecha: string, notas: string, monto: number) => {
      ok('cm.grabar', { ejecutora: 'cp1', caId: ca.id, modalidad: 'CA - LEY DE CONTRATACIONES DEL ESTADO', tipoProc: 'ADJUDICACION SIMPLIFICADA', doc: { cod: '070', num: '08-2022-AS-GR PUNO', fecha }, notas, tipoPago: 'A - ABONO EN CUENTA', tipoRecurso: 'R - CANON Y SOBRECANON', items: [{ clas: '2.6.2.2.3.2', meta: '0902', monto }] });
      const e = ej().exps.slice(-1)[0];
      ok('flujo.enviar', { k: 'es', x: 'cp1', id: e.id, s: 1 });
      expect(ej().exps.slice(-1)[0].secs[0].estado).toBe('APROBADO');
      return e;
    };
    /* las valorizaciones 01 a 03 son antecedentes del caso: el estudiante registra la valorización 04 */
    const exp = cm('05/10/2022', 'VALORIZACION Nº 04 JUNIO 2022', 105115.67);

    const item4 = [{ clas: '2.6.2.2.3.2', meta: '0902', monto: 105115.67 }];
    ok('dev.grabar', { ejecutora: 'cp1', expId: exp.id, rend: false, doc: { cod: '001', serie: '0001', num: '00001050', fecha: '05/10/2022' }, notas: 'DEVENGADO DE LA VALORIZACION Nº 04', items: item4 });
    ok('flujo.enviar', { k: 'es', x: 'cp1', id: exp.id, s: 2 });
    await madaf('dev', [{ k: 'es', x: 'cp1', id: exp.id, s: 2 }]);

    ok('gir.grabar', { ejecutora: 'cp1', expId: exp.id, tipoGiro: 'PRINCIPAL', medio: 'RETENCION - GARANTIA DE FIEL CUMPLIMIENTO', docGiro: 'COMPROBANTE DE PAGO Nº 2022-04512', fecha: '28/10/2022', benefNum: '20999999991', items: item4, ret: [{ concepto: 'RETENCION GARANTIA DE FIEL CUMPLIMIENTO', monto: 105115.67 }] });
    ok('flujo.enviar', { k: 'es', x: 'cp1', id: exp.id, s: 3 });
    await madaf('gir', [{ k: 'es', x: 'cp1', id: exp.id, s: 3 }]);

    const checks = verificar(ej(), CASOS.cp1.subcasos[0]).flatMap(v => v.checks);
    expect(checks.filter(c => !c.ok)).toEqual([]);
  });
  it('MADAF rechaza clave errónea y PIN incorrecto', () => {
    entrar('RU20261');
    ok('dnie.ingresar', 'madaf', '40000010', '123456');
    ok('madaf.clave', 'ccp', 'cp1');
    expect(falla('madaf.autorizar', 'ccp', 'cp1', [{ k: 'cs', x: 'cp1', id: 'x', s: 1 }], '000000', true)).toContain('clave');
    expect(falla('dnie.ingresar', 'madaf', '40000010', '999999')).toContain('PIN incorrecto');
  });
  it('modificación de justificación aprobada por la OPP se aplica al certificado', () => {
    entrar('RU20264');
    const c = ej().certs[0];
    ok('mod.grabar', { ejecutora: 'cp1', tipo: 'CERT', refId: c.id, campo: 'Justificación', valor: 'NUEVA JUSTIFICACION' });
    const m = ej().mods[0];
    ok('flujo.enviar', { k: 'md', x: 'cp1', id: m.id });
    ok('opp.procesar', 'cp1', [{ k: 'md', x: 'cp1', id: m.id }], []);
    expect(ej().certs[0].justif).toBe('NUEVA JUSTIFICACION');
  });
});

describe('Docente', () => {
  it('califica una entrega: la solución obtiene 20', () => {
    entrar('ADMIN');
    const aula = ok('aula.crear', 'Gabinete CON312 - Grupo F', '2026-II');
    expect(ok('aula.importarCSV', aula.id, 'codigo;nombres;dni\n201234;Alarcon Poma Jheny;40000099\n201235;Kevin Mamani;')).toBe(2);
    const entrega = ok('entrega.generar', '201234', 'Alarcon Poma Jheny');
    const e = ok('aula.importarEntrega', aula.id, JSON.stringify(entrega), 'entrega.json');
    expect(e.nota20).toBe(20);
    expect(ok('aula.entregas', aula.id).length).toBe(1);
  });
  it('ve el avance de cada trabajador en su propio espacio', () => {
    entrar('RU20262'); ok('ejecutora.practicar', 'cp1');
    entrar('ADMIN');
    const p = ok('docente.progreso');
    expect(p.length).toBe(4);
    expect(p.find((x: any) => x.usuario === 'RU20262').nota20).toBe(0);
    expect(p.find((x: any) => x.usuario === 'RU20261').nota20).toBe(20);
  });
});
