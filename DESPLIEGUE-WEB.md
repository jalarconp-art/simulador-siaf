# Publicar la versión web (Supabase + GitHub + Vercel)

La versión web es la misma aplicación del escritorio funcionando en el navegador. Los datos de
cada usuario se guardan en **Supabase** (base de datos en la nube) y la página se publica en
**Vercel** desde **GitHub**. Todo el proceso es gratuito con los planes básicos.

Tiempo aproximado: 30 minutos.

---

## 1. Crear el proyecto en Supabase

1. Entre a <https://supabase.com>, inicie sesión y pulse **New project**.
2. Escriba un nombre (por ejemplo `siaf-simulador`), una contraseña para la base de datos y elija la
   región **South America (São Paulo)**. Pulse **Create new project** y espere 2 minutos.
3. Abra **SQL Editor › New query**, pegue todo el contenido del archivo `supabase/schema.sql` y
   pulse **Run**. Debe aparecer *Success*.
4. Abra **Project Settings › API** y copie:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **anon public** (en *Project API keys*) → será `VITE_SUPABASE_ANON_KEY`

   La clave *anon* es pública por diseño: la seguridad la dan las reglas por fila del paso 3.
   No copie nunca la clave *service_role*.

> **El primer usuario que se registre en la página será el Administrador de usuarios.**
> Regístrese usted primero, apenas publique la página.

## 2. Activar el acceso con Google

1. Entre a <https://console.cloud.google.com>, cree un proyecto y abra
   **APIs y servicios › Pantalla de consentimiento de OAuth**: tipo *Externo*, nombre de la app,
   su correo. Guarde.
2. **APIs y servicios › Credenciales › Crear credenciales › ID de cliente de OAuth**:
   - Tipo: **Aplicación web**
   - *URI de redireccionamiento autorizados*: `https://SU-PROYECTO.supabase.co/auth/v1/callback`
     (la URL exacta aparece en Supabase › Authentication › Providers › Google).
3. Copie el **ID de cliente** y el **Secreto**.
4. En Supabase: **Authentication › Providers › Google** › active *Enable* y pegue ambos valores. Guarde.
5. En Supabase: **Authentication › URL Configuration**:
   - *Site URL*: la dirección de Vercel del paso 4 (por ejemplo `https://siaf-simulador.vercel.app`).
   - *Redirect URLs*: agregue la misma dirección y `http://localhost:5180` (para pruebas).

Opcional: en **Authentication › Providers › Email** puede desactivar *Confirm email* si no quiere
que los usuarios confirmen su correo antes de ingresar.

## 3. Subir el código a GitHub

El código ya está preparado como repositorio Git en `C:\Users\jheni\Proyectos\siaf-pro`
(Git y GitHub CLI quedaron instalados). Abra **PowerShell** en esa carpeta y ejecute:

```powershell
gh auth login            # elija GitHub.com › HTTPS › Login with a web browser
gh repo create siaf-simulador --private --source . --push
```

Con eso el repositorio queda creado en su cuenta y el código subido. Si prefiere hacerlo a mano:
cree un repositorio vacío en <https://github.com/new> y ejecute
`git remote add origin https://github.com/SU-USUARIO/siaf-simulador.git` y luego `git push -u origin main`.

El archivo `.env.local` y la base de datos local **no** se suben (están en `.gitignore`).

## 4. Publicar en Vercel

1. Entre a <https://vercel.com> con su cuenta de GitHub y pulse **Add New › Project**.
2. Importe el repositorio `siaf-simulador`.
3. Vercel lee `vercel.json` automáticamente (comando `npm run build:web`, carpeta `dist-web`).
   No cambie *Framework Preset* (déjelo en *Other*).
4. Despliegue **Environment Variables** y agregue:

   | Nombre | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | clave anon public de Supabase |

5. Pulse **Deploy**. En 2 minutos tendrá su dirección `https://....vercel.app`.
6. Vuelva al paso 2.5 y coloque esa dirección en *Site URL* y *Redirect URLs* de Supabase.

Cada vez que suba cambios a GitHub (`git push`), Vercel vuelve a publicar solo.

## 5. Primer ingreso

1. Abra su dirección de Vercel y pulse **Crear cuenta** (o **Continuar con Google**).
   Al ser el primero, usted queda como **Administrador de usuarios** (usuario `ADMIN`).
2. Comparta la dirección con los trabajadores o estudiantes: cada uno crea su cuenta con su correo
   o con Google y recibe su propio espacio con el Caso Práctico 1.
3. En **SIAF Operaciones en Línea › Administrador de usuarios** asigne a cada persona su perfil SIAF
   (Operador, Logística, Presupuesto, Contabilidad, Tesorería, Consulta) y ajuste las opciones de
   Consulta u Operación.
4. En **Panel del administrador** verá el avance y la nota de cada usuario, y la auditoría.

## Probar en su computadora antes de publicar

```powershell
copy .env.example .env.local   # y pegue sus valores de Supabase
npm run dev:web                # abre http://localhost:5180
```

Sin `.env.local` la página funciona en **modo local de demostración**: los datos quedan solo en ese
navegador y trae los mismos usuarios iniciales del escritorio (ADMIN / Admin2026, RU20261 / Quispe2026…).

## Preguntas frecuentes

- **«No se encontró el perfil del usuario»**: no se ejecutó `supabase/schema.sql` (paso 1.3).
- **Google vuelve a la página pero no inicia sesión**: revise *Site URL* y *Redirect URLs* (paso 2.5).
- **¿Otro administrador?** En Supabase › SQL Editor:
  `update public.perfiles set rol = 'ADMINISTRADOR' where email = 'correo@ejemplo.com';`
- **Aviso legal**: la página es un simulador académico; muestra la marca «SIMULADOR» y no está
  afiliada al MEF. No la publique con el nombre o logotipo oficiales del Ministerio.
