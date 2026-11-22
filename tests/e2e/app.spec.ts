/* Pruebas de punta a punta sobre la aplicación compilada (Electron + React + SQLite). */
import { _electron as electron, expect, test, type ElectronApplication, type Page } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';

let app: ElectronApplication; let page: Page; let db: string;

async function login(u: string, c: string) {
  await page.locator('.lg-tabs a', { hasText: 'Iniciar sesión' }).click();
  const inputs = page.locator('.lg-card input');
  await inputs.nth(0).fill(u); await inputs.nth(1).fill(c);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.locator('.wcard h2')).toBeVisible();
}
async function salir() {
  await page.locator('.tb-user').click();
  await page.getByText('Cerrar sesión').click();
  await expect(page.locator('.lg-card')).toBeVisible();
}
const confirmar = async () => { await page.locator('.modal.conf .btn-p').click(); };

test.beforeAll(async () => {
  db = path.join(os.tmpdir(), 'siaf-e2e-' + Date.now() + '.sqlite');
  const env = { ...process.env, SIAF_DB: db } as Record<string, string>;
  delete env.ELECTRON_RUN_AS_NODE;
  app = await electron.launch({ args: [path.join(__dirname, '..', '..')], env });
  page = await app.firstWindow();
  await page.waitForSelector('.lg-card');
});
test.afterAll(async () => { await app.close(); try { fs.unlinkSync(db); } catch { /* ya eliminado */ } });

test('portal y credenciales inválidas', async () => {
  const inputs = page.locator('.lg-card input');
  await inputs.nth(0).fill('RU20261'); await inputs.nth(1).fill('incorrecta');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.locator('.lg-card .err')).toContainText('incorrectos');
});

test('el trabajador entra con su usuario y el Caso Práctico 1 viene cargado y verifica al 100 %', async () => {
  await login('RU20261', 'Quispe2026');
  await expect(page.locator('.wcard h2')).toContainText('ROSA ELENA');
  await page.locator('.tile', { hasText: 'Módulo Ejecución' }).click();
  await expect(page.locator('.casebar select').first().locator('option')).toHaveCount(1);
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.locator('h3.sec').first()).toContainText('(100%)');
});

test('certificación en práctica: grabar, enviar, aprobar en la OPP y firmar en el MADAF', async () => {
  await page.getByRole('button', { name: 'Practicar desde cero' }).click(); await confirmar();
  await expect(page.locator('.mode')).toContainText('MODO PRÁCTICA');
  await page.locator('.msel select').selectOption('Registro');
  await page.locator('.menu a', { hasText: 'Certificados' }).click();
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
  await expect(page.locator('.wcard')).toContainText('Solución cargada');
  await page.locator('.tile', { hasText: 'Módulo Ejecución' }).click();
  await expect(page.locator('.mode')).toContainText('SOLUCIÓN CARGADA');
});

test('registro de una cuenta nueva con correo electrónico', async () => {
  await salir();
  await page.locator('.lg-tabs a', { hasText: 'Crear cuenta' }).click();
  const i = page.locator('.lg-card input');
  await i.nth(0).fill('Mamani Huanca'); await i.nth(1).fill('Elena'); await i.nth(2).fill('45678901');
  await i.nth(3).fill('elena.mamani@correo.pe'); await i.nth(4).fill('Elena2026'); await i.nth(5).fill('Elena2026');
  await page.getByRole('button', { name: 'Crear cuenta e ingresar' }).click();
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
