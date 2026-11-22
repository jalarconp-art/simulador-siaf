/* Versión web en el navegador (modo local): sesión persistente, aislamiento, registro y perfiles asignados por el administrador. */
import { expect, test, type Page } from '@playwright/test';

let page: Page;
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

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/');
  await expect(page.locator('.sp')).toBeVisible();
});

test('ingreso con correo y menú del SIAF-WEB', async () => {
  await login('rquispe@regionpuno.gob.pe', 'Quispe2026');
  await expect(page.locator('.wcard h2')).toContainText('ROSA ELENA');
  await page.locator('.tile', { hasText: 'Ejecucion Presupuestal' }).click();
  await expect(page.locator('.menu .mitems a')).toHaveCount(22);
});

test('práctica: certificado, aprobación OPP y firma MADAF; los datos persisten al recargar', async () => {
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
  await page.locator('.btn-env').click(); await confirmar();
  await expect(page.locator('.det-siaf .ds-kv')).toContainText('ENVIADO A OPP', { timeout: 10000 });

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

  await page.reload();
  await expect(page.locator('.wcard h2')).toContainText('ROSA ELENA');
  await page.locator('.tile', { hasText: 'Ejecucion Presupuestal' }).click();
  await page.locator('.lp-list .li').first().click();
  await expect(page.locator('.det-siaf .ds-kv')).toContainText('APROBADO');
});

test('otro trabajador no ve lo registrado por el primero', async () => {
  await salir(); await login('RU20262', 'Condori2026');
  await page.locator('.tile', { hasText: 'Ejecucion Presupuestal' }).click();
  await expect(page.locator('.lp-list')).toContainText('No se encontraron');
});

test('registro de cuenta nueva con correo', async () => {
  await salir();
  await registrar(['Mamani Huanca', 'Elena', '45678901', 'elena.mamani@correo.pe', 'Elena2026', 'Elena2026']);
  await expect(page.locator('.wcard h2')).toContainText('ELENA');
});

test('el administrador quita una opción y el usuario deja de verla', async () => {
  await salir(); await login('admin@siafsimulador.pe', 'Admin2026');
  await page.locator('.tile', { hasText: 'SIAF Operaciones en Línea' }).click();
  await expect(page.locator('.crumbs')).toContainText('Administrador de usuarios');
  await page.locator('tbody tr', { hasText: 'RU20262' }).click();
  await page.locator('.perm-tbl tr', { hasText: 'Certificación' }).locator('input').first().uncheck();
  await page.getByRole('button', { name: 'Grabar perfil' }).click(); await confirmar();
  await expect(page.locator('.toast', { hasText: 'Perfil actualizado' }).first()).toBeVisible();
  await page.locator('.mods select').selectOption('docente');
  await expect(page.locator('tbody').first()).toContainText('elena.mamani@correo.pe');
  await expect(page.locator('tbody').first()).toContainText('RU20261');
  await salir(); await login('RU20262', 'Condori2026');
  await page.locator('.tile', { hasText: 'Ejecucion Presupuestal' }).click();
  await page.locator('.msel select').selectOption('Registro');
  await expect(page.locator('.menu')).toContainText('Compromiso Anual');
  await expect(page.locator('.menu a', { hasText: /^Certificación$/ })).toHaveCount(0);
});
