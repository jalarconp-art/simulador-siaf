# Publicar la versión web (Supabase + GitHub + Vercel)

Proyecto Supabase: `bjjspxrypxhezhforuta`.
Repositorio: <https://github.com/jalarconp-art/simulador-siaf>.

La URL y la clave publicable de Supabase ya están en `.env.production`: Vercel no necesita variables de entorno.

## 1. Crear las tablas en Supabase (2 minutos, una sola vez)

1. Abra <https://supabase.com/dashboard/project/bjjspxrypxhezhforuta/sql/new>.
2. Pegue todo el contenido de `supabase/schema.sql` y pulse **Run**. Debe aparecer *Success. No rows returned*.

## 2. Permitir el registro sin confirmar el correo (recomendado)

El servidor de correo gratuito de Supabase envía muy pocos correos por hora. Sin este cambio, sus
compañeros no podrán terminar de registrarse.

1. Abra <https://supabase.com/dashboard/project/bjjspxrypxhezhforuta/auth/providers>.
2. Entre a **Email**, desactive **Confirm email** y guarde.

## 3. Publicar en Vercel (3 minutos)

1. Entre a <https://vercel.com/new> con su cuenta de GitHub (*Continue with GitHub*).
2. Pulse **Import** junto a `simulador-siaf`. Si no aparece, use *Adjust GitHub App Permissions* y dé acceso al repositorio.
3. Deje todo como está: Vercel lee `vercel.json`. Pulse **Deploy**.
4. Copie la dirección que le da Vercel (por ejemplo `https://simulador-siaf.vercel.app`).
5. En <https://supabase.com/dashboard/project/bjjspxrypxhezhforuta/auth/url-configuration>:
   - **Site URL**: pegue esa dirección.
   - **Redirect URLs**: agregue la misma dirección.

> **Regístrese usted primero.** El primer usuario que crea su cuenta queda como **Administrador de usuarios**.

## 4. Acceso con Google (opcional)

1. <https://console.cloud.google.com> › **APIs y servicios** › **Pantalla de consentimiento de OAuth**: tipo *Externo*, nombre y correo. Guarde.
2. **Credenciales** › **Crear credenciales** › **ID de cliente de OAuth** › tipo **Aplicación web**.
   - En *URI de redireccionamiento autorizados* ponga: `https://bjjspxrypxhezhforuta.supabase.co/auth/v1/callback`
3. Copie el ID y el secreto en <https://supabase.com/dashboard/project/bjjspxrypxhezhforuta/auth/providers> › **Google** › *Enable*. Guarde.

El botón «Continuar con Google» aparece en la página automáticamente en cuanto Google queda activado.

## Uso

- **Ingreso:** en la portada, clic en **SIAF** › Inicio de Sesión (con el email) o **Crear una cuenta**.
- **Espacio de trabajo:** cada usuario recibe su propio espacio con el Caso Práctico 1. Sus registros se guardan en Supabase y no se mezclan con los de los demás.
- **Administrador:** en **SIAF Operaciones en Línea › Administrador de usuarios** asigna perfiles (Operador, Logística, Presupuesto, Contabilidad, Tesorería, Consulta) y opciones. En el **Panel del administrador** ve el avance, la nota y la auditoría de cada usuario.
- **Otro administrador:** en el SQL Editor ejecute
  `update public.perfiles set rol = 'ADMINISTRADOR' where email = 'correo@ejemplo.com';`
- **Actualizar la página:** cada `git push` a GitHub vuelve a publicarla sola en Vercel.

## Probar en la computadora

`npm run dev:web` abre <http://localhost:5180> conectada al mismo Supabase. `npm run test:web` usa el modo local de demostración y no toca la nube.

> Simulador académico para familiarizarse con la Plataforma SIAF-SP. No es el sistema oficial del Ministerio de Economía y Finanzas ni usa su escudo o logotipo.
