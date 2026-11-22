/* Acceso con cuenta de Google para la aplicación de escritorio (OAuth 2.0 para apps instaladas:
   navegador del sistema + redirección a 127.0.0.1 + PKCE). Requiere un ID de cliente de Google
   de tipo «Aplicación de escritorio», configurado por el administrador. */
import crypto from 'crypto';
import http from 'http';
import { shell } from 'electron';

export interface IdentidadGoogle { sub: string; email: string; nombres: string; apellidos: string }
const b64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const PAGINA = (msg: string) => `<!doctype html><html lang="es"><meta charset="utf-8"><title>SIAF-WEB Simulador</title><body style="font-family:Segoe UI,Arial;background:#0e8ab5;color:#fff;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center"><h2>SIAF-WEB Simulador</h2><p>${msg}</p><p>Ya puede cerrar esta pestaña y volver a la aplicación.</p></div></body></html>`;

export function iniciarSesionGoogle(clientId: string, secreto: string, espera = 180000): Promise<IdentidadGoogle> {
  return new Promise((resolver, rechazar) => {
    const verificador = b64url(crypto.randomBytes(32));
    const desafio = b64url(crypto.createHash('sha256').update(verificador).digest());
    const estado = b64url(crypto.randomBytes(16));
    let terminado = false;
    const servidor = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      if (url.pathname !== '/') { res.writeHead(404).end(); return; }
      const fin = (ok: boolean, msg: string) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(PAGINA(msg)); terminado = true; servidor.close(); if (!ok) rechazar(new Error(msg)); };
      if (url.searchParams.get('state') !== estado) return fin(false, 'La respuesta de Google no corresponde a esta solicitud.');
      if (url.searchParams.get('error')) return fin(false, 'Se canceló el acceso con Google.');
      try {
        const puerto = (servidor.address() as { port: number }).port;
        const r = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ code: url.searchParams.get('code') || '', client_id: clientId, client_secret: secreto, code_verifier: verificador, grant_type: 'authorization_code', redirect_uri: `http://127.0.0.1:${puerto}` })
        });
        const tok = await r.json() as { id_token?: string; error_description?: string };
        if (!tok.id_token) return fin(false, 'Google rechazó el acceso: ' + (tok.error_description || 'revise el ID y el secreto de cliente.'));
        /* el id_token llega directamente de Google por HTTPS: se decodifica su contenido */
        const datos = JSON.parse(Buffer.from(tok.id_token.split('.')[1], 'base64url').toString('utf8'));
        if (datos.aud !== clientId || !datos.email_verified) return fin(false, 'La cuenta de Google no tiene un correo verificado.');
        fin(true, 'Acceso concedido.');
        resolver({ sub: String(datos.sub), email: String(datos.email), nombres: String(datos.given_name || datos.name || ''), apellidos: String(datos.family_name || '') });
      } catch (e) { fin(false, 'No se pudo completar el acceso con Google: ' + (e as Error).message); }
    });
    servidor.listen(0, '127.0.0.1', () => {
      const puerto = (servidor.address() as { port: number }).port;
      const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      Object.entries({ client_id: clientId, redirect_uri: `http://127.0.0.1:${puerto}`, response_type: 'code', scope: 'openid email profile', code_challenge: desafio, code_challenge_method: 'S256', state: estado, prompt: 'select_account' })
        .forEach(([k, v]) => auth.searchParams.set(k, v));
      shell.openExternal(auth.toString());
    });
    setTimeout(() => { if (!terminado) { servidor.close(); rechazar(new Error('Se agotó el tiempo para iniciar sesión con Google.')); } }, espera);
  });
}
