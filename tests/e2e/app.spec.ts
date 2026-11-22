/* Pruebas de punta a punta sobre la aplicación compilada (Electron + React + SQLite). */
import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';

let app: ElectronApplication; let page: Page; let db: string;

async function irAlLogin() {
  if (await page.locator('.sp').isVisible()) await page.locator('.sp-card', { hasText: 'Sistema Integrado de Administración Financiera' }).click();
  await expect(page.locator('.sl-form')).toBeVisible();
  if (await page.getByText('Ya tengo cuenta').isVisible()) await page.getByText('Ya tengo cuenta').click();
}
async function login(u: string, c: string) {
  await irAlLogin();
  const i = page.locator('.sl-form input');
  await i.nth(0).fill(u); await i.nth(1).fill(c);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('.wcard h2')).toBeVisible();
}
async function salir() {
  await page.locator('.tb-user').click();
  await page.getByText('Cerrar sesión').click();
  await expect(page.locator('.sp')).toBeVisible();
}
async function registrar(datos: string[]) {
  await irAlLogin();
  await page.getByText('Crear una cuenta').click();
  const i = page.locator('.sl-form input');
  for (let k = 0; k < datos.length; k++) await i.nth(k).fill(datos[k]);
  await page.getByRole('button', { name: 'Crear cuenta e ingresar' }).click();
}const confirmar = async () => { await page.locator('.modal.conf .btn-p').click(); };

test.beforeAll(async () => {
  db = path.join(os.tmpdir(), 'siaf-e2e-' + Date.now() + '.sqlite');
  const env = { ...process.env, SIAF_DB: db } as Record<string, string>;
  delete env.ELECTRON_RUN_AS_NODE;
  app = await electron.launch({ args: [path.join(__dirname, '..', '..')], env });
  page = await app.firstWindow();
  await page.waitForSelector('.sp');
});
test.afterAll(async () => { await app.close(); try { fs.unlinkSync(db); } catch { /* ya eliminado */ } });

test('portada de la plataforma, clic en SIAF y credenciales inválidas', async () => {
  await expect(page.locator('.sp-tit')).toHaveText('Componentes del sistema integrado');
  await page.locator('.sp-buscar input').fill('bancario');
  await expect(page.locator('.sp-card')).toHaveCount(1);
  await page.locator('.sp-buscar input').fill('');
  await irAlLogin();
  await expect(page.locator('.sl-tit')).toHaveText('Inicio de Sesión');
  const inputs = page.locator('.sl-form input');
  await inputs.nth(0).fill('RU20261'); await inputs.nth(1).fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('.sl-form .err')).toContainText('incorrectos');
});

test('el trabajador entra con su usuario y ve el menú del SIAF-WEB, sin caso cargado', async () => {
  await login('RU20261', 'Quispe2026');
  await expect(page.locator('.wcard h2')).toContainText('ROSA ELENA');
  await page.locator('.tile', { hasText: 'Ejecucion Presupuestal' }).click();
  await expect(page.locator('.casebar')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Verificar' })).toHaveCount(0);
  await expect(page.locator('.menu .mitems a')).toHaveCount(22);
  await expect(page.locator('.menu .mitems a').last()).toHaveText('Modificación de Solicitud de Viático y Encargo Interno');
  await page.locator('.msel select').selectOption('Consultas');
  await expect(page.locator('.menu .mitems a')).toHaveText(['Contratos', 'Asignación de Tesoro Público']);
  await page.locator('.msel select').selectOption('Reportes');
  await expect(page.locator('.menu .mitems a')).toHaveText(['Certificación y Compromiso Anual', 'Formatos SIAF', 'Transferencia Interbancaria']);
  await page.locator('.menu a', { hasText: 'Certificación y Compromiso Anual' }).click();
  await expect(page.locator('.detail h3')).toHaveText('Generar Reporte');
  await page.locator('.msel select').selectOption('Registro');
  await page.locator('.menu a', { hasText: 'Cuenta Interbancaria (CCI)' }).click();
  await page.locator('.plus').click();
  const f = page.locator('.card.form');
  await f.locator('input').nth(0).fill('41526371'); await f.locator('input').nth(1).fill('Quispe Mamani Rosa Elena'); await f.locator('input').nth(2).fill('01812300012345678901');
  await page.getByRole('button', { name: 'Grabar' }).click(); await confirmar();
  await expect(page.locator('.toast', { hasText: 'Se ha registrado correctamente' }).first()).toBeVisible();
  await page.locator('.detail .btn', { hasText: 'Enviar' }).click(); await confirmar();
  await expect(page.locator('.dh .badge')).toHaveText('APROBADO');
});
test('certificación en práctica: grabar, enviar, aprobar en la OPP y firmar en el MADAF', async () => {
  await page.locator('.msel select').selectOption('Registro');
  await page.locator('.menu a', { hasText: /^Certificación$/ }).click();
  await page.locator('.plus').click();
  const form = page.locator('.card.form');
  await form.locator('select').first().selectOption('086');
  await form.locator('input').nth(0).fill('100-2021-GR-PUNO/ORA/OASA');
  await form.locator('input').nth(1).fill('18/10/2021');
  await form.locator('textarea').fill('EJECUCION DE LA OBRA DEL PUESTO DE SALUD DE AYMAÑA CUI 2308220');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await page.locator('.modal tr', { hasText: '2.6.2.2.3.2' }).first().click();
  await page.locator('.modal tr', { hasText: '0902' }).last().click();
  await page.locator('.modal').getByRole('button', { name: 'Aceptar' }).click();
  await page.locator('input.num.req').nth(0).fill('5959341.13');
  await page.getByRole('button', { name: 'Grabar' }).click(); await confirmar();
  await expect(page.locator('.toast', { hasText: 'Se ha registrado el certificado' }).first()).toBeVisible();
  await page.locator('.detail .btn', { hasText: 'Enviar' }).first().click(); await confirmar();
  await expect(page.locator('.dh .badge')).toHaveText('ENVIADO A OPP', { timeout: 10000 });

  await page.locator('.mods select').selectOption('opl');
  await page.locator('tbody input[type=checkbox]').first().check();
  await page.getByRole('button', { name: 'Procesar' }).click(); await confirmar();
  await expect(page.locator('.toast', { hasText: '1 aprobado' }).first()).toBeVisible();

  await page.locator('.mods select').selectOption('madaf');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.locator('.java-w input[type=checkbox]').check();
  await page.getByRole('button', { name: 'Ejecutar' }).click();
  await page.locator('input.pin').fill('123456');
  await page.locator('.modal.conf').getByRole('button', { name: 'Aceptar' }).click();
  await page.locator('tbody input[type=checkbox]').first().check();
  await page.getByRole('button', { name: 'Autorizar' }).click();
  await page.getByRole('button', { name: 'Sí' }).click();
  const codigo = (await page.locator('.mailbox .code').textContent())!.trim();
  await page.locator('input.pin').pressSequentially(codigo);
  await page.locator('.modal.conf').getByRole('button', { name: 'Aceptar' }).click();
  await expect(page.locator('.toast', { hasText: 'APROBADO' }).first()).toBeVisible();
  await page.getByRole('button', { name: '‹ Volver' }).click();
});

test('otro trabajador no ve lo registrado por el primero', async () => {
  await salir(); await login('RU20262', 'Condori2026');
  await page.locator('.tile', { hasText: 'Ejecucion Presupuestal' }).click();
  await expect(page.locator('.lp-list')).toContainText('No hay registros');
});

test('registro de una cuenta nueva con correo electrónico', async () => {
  await salir();
  await registrar(['Mamani Huanca', 'Elena', '45678901', 'elena.mamani@correo.pe', 'Elena2026', 'Elena2026']);
  await expect(page.locator('.wcard h2')).toContainText('ELENA');
  await salir(); await login('elena.mamani@correo.pe', 'Elena2026');
  await expect(page.locator('.wcard h2')).toContainText('MAMANI HUANCA');
});

test('el docente ve el avance de cada usuario, crea un aula y revisa la auditoría', async () => {
  await salir(); await login('ADMIN', 'Admin2026');
  await page.locator('.tile', { hasText: 'Panel del administrador' }).click();
  await expect(page.locator('tbody').first()).toContainText('RU20261');
  await expect(page.locator('tbody').first()).toContainText('elena.mamani@correo.pe');
  await page.locator('.dc-head .tabs a', { hasText: 'Aulas y calificaciones' }).click();
  await page.locator('.dc-grid input').first().fill('CON312 Grupo F');
  await page.getByRole('button', { name: 'Crear' }).click();
  await expect(page.locator('.ueit').first()).toContainText('CON312 Grupo F');
  await page.getByText('Auditoría del sistema').click();
  await expect(page.locator('tbody').first()).toContainText('madaf.autorizar');
  await expect(page.locator('tbody').first()).toContainText('usuario.registro');
});
