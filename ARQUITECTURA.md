# SIAF-WEB Simulador 2.2 · Arquitectura

## Novedades de la versión 2.2

- **Dos plataformas con el mismo código.** `src/main/operaciones.ts` define el `Nucleo` (servicios y tabla de
  operaciones sin dependencias de Node). El escritorio (`src/main/app.ts`) le añade SQLite en disco, la
  autenticación local, Google, el aula y la auditoría. La web (`src/web/puente.ts`) ejecuta el mismo núcleo en el
  navegador sobre SQLite en memoria y sincroniza el espacio del usuario con Supabase después de cada operación.
- **Perfiles SIAF y permisos** (`src/shared/permisos.ts`): Administrador de usuarios, Operador, Logística,
  Presupuesto (OPP), Contabilidad, Tesorería y Consulta. Cada usuario tiene, por opción, Consulta (C) u Operación (O).
  Los servicios exigen `requerirPermiso(opción)`; el envío y el descarte deducen la opción de la fase del registro.
  La migración v2 de SQLite agrega `permisos`, `proveedor` y `google_sub`, y convierte DOCENTE → ADMINISTRADOR y
  OPP → PRESUPUESTO.
- **Acceso con Google.** Escritorio: OAuth 2.0 para apps instaladas (navegador del sistema, redirección a
  127.0.0.1 y PKCE, `src/main/google.ts`), con el ID y el secreto que registra el administrador. Web: proveedor
  Google de Supabase Auth.
- **Supabase** (`supabase/schema.sql`): tablas `perfiles`, `espacios` (JSON del agregado Ejecutora y sus
  responsables) y `auditoria`, con seguridad por fila. El primer usuario registrado es el administrador, y un
  disparador impide que un usuario cambie su propio perfil.
- **Modo local de demostración** (`src/web/backend/local.ts`): sin variables de Supabase, la web guarda en el
  navegador. Contraseñas con PBKDF2 y los mismos usuarios iniciales que el escritorio.
- **Catálogo** completado con códigos del manual de Fondos de Garantía del MEF (2024): 002, 004, 008, 024, 026, 034,
  065, 066, 068, 072, 099, 246, 247, 578, 579, 629 y 639, más «Documento B del giro» y la fuente de los tipos de certificación.
- **Logotipo** propio (anillo y palabra SIAF, marca «WEB · SIMULADOR»); no reproduce el emblema oficial del MEF.

Compilaciones: `tsconfig.node.json` (escritorio), `tsconfig.web.json` (interfaz) y `tsconfig.webapp.json` (web
completa). Pruebas: 36 unitarias, 6 de punta a punta en Electron y 5 en Microsoft Edge (versión web).

---

Aplicación de escritorio para practicar la ejecución presupuestal en la Plataforma SIAF-SP
(Módulo de Ejecución, SIAF Operaciones en Línea, AERAF y MADAF) con el Caso Práctico 1
(obra P.S. Aymaña, CUI 2308220). Los datos de los casos 2 y 3 siguen en `casos.ts`, pero
`CTX_ORDER` solo habilita `cp1`.

## Usuarios y aislamiento de datos (v2.1)

- Cada usuario tiene su propio espacio de trabajo. La clave física de la ejecutora en SQLite es
  `idUsuario::idCaso` (por ejemplo `a1b2c3::cp1`); el agregado en memoria conserva el id lógico
  `cp1`, que es el que usa el dominio. Lo mismo ocurre con los responsables del AERAF.
- `Contexto.clave(x)` resuelve la clave a partir de la sesión: ningún servicio puede leer ni
  escribir el espacio de otro usuario. Los procesos internos sin sesión (verificación pendiente al
  arrancar) trabajan con claves físicas ya resueltas.
- `Contexto.asegurarEspacio(id)` crea el espacio (caso resuelto y responsables de prueba) la primera
  vez que el usuario entra o se registra.
- Inicio de sesión con código de usuario o correo. Registro público (`sesion.registrar`): crea un
  usuario OPERADOR con contraseña cifrada (scrypt + sal), correo único y DNI único.
- Cada operador simula a toda la entidad dentro de su espacio: registra, aprueba como OPP y firma
  en el MADAF. Las sesiones DNIe y las claves dinámicas se reinician al cambiar de usuario.
- El docente ve el avance de cada usuario (`docente.progreso`, solo lectura) y la auditoría.
- Siembra v2: docente y cuatro trabajadores (RU20261 a RU20264). Al actualizar una base anterior se
  eliminan los espacios compartidos de la versión 2.0 y se actualizan los usuarios iniciales.
- El registro es local, sin servicio en la nube. Si más adelante se quiere verificar el correo o
  sincronizar entre equipos, puede añadirse Firebase Authentication detrás de `AuthService`.

## Identidad visual

Paleta institucional del SIAF: turquesa `#0e8ab5` (barra superior y menú), acciones principales en
rojo `#e8402f`, opción activa del menú en beige `#e4d9b4`, selección de listas en rosado `#fde4e4`, y
azul para MADAF y AERAF. La sustitución de la paleta anterior está en `tools/paleta-siaf.js` y los
ajustes en `styles/extra.css`.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Contenedor de escritorio | Electron 31 (proceso principal + preload aislado + renderer en sandbox de contexto) |
| Interfaz | React 18 + TypeScript + Zustand (estado) · Vite / electron-vite (compilación) |
| Dominio | TypeScript puro, sin dependencias de interfaz ni de base de datos |
| Persistencia | SQLite (sql.js, WebAssembly) con migraciones versionadas y escritura atómica en disco |
| Validación | Zod (forma de los datos en la frontera IPC) + reglas de negocio en el dominio |
| Seguridad | Contraseñas con scrypt + sal, perfiles (DOCENTE, OPERADOR, OPP), bitácora de auditoría |
| Pruebas | Vitest (unitarias e integración) · Playwright sobre Electron (punta a punta) |
| Instalador | electron-builder (NSIS, Windows x64) |

## Estructura

```
src/
├── shared/                 Código común (main y renderer)
│   ├── types.ts            Modelo del dominio (Certificado, CompromisoAnual, Expediente, Ingreso...)
│   ├── casos.ts            Casos prácticos declarativos (fases, montos, asientos, controles)
│   ├── catalogo.ts         Catálogo de apoyo (hoja «Catálogo» del Excel)
│   ├── comandos.ts         Contratos de entrada de cada operación (Zod)
│   ├── util.ts             Utilidades, clasificador 2026, mapas de saldos
│   ├── data/clasificador.json   1 906 partidas de ingresos y gastos 2026
│   └── domain/
│       ├── saldos.ts       Reglas de saldo: PIM › certificado › CA › CM › devengado › girado
│       ├── estados.ts      Máquina de estados y transiciones válidas
│       ├── reglas.ts       Validaciones de negocio (documentos, justificación, saldos)
│       ├── fabrica.ts      Creación de registros y construcción de la solución de cada caso
│       └── contabilidad.ts Asientos en tres capas, partida doble, controles y verificación
├── main/                   Proceso principal (backend local)
│   ├── index.ts            Ventana, menú nativo, IPC, impresión/PDF, respaldos
│   ├── app.ts              Raíz de composición y tabla de operaciones de la API
│   ├── db/                 database.ts (SQLite), schema.ts (migraciones), seed.ts (datos iniciales)
│   ├── repositories/       EjecutoraRepo (agregado completo) y repositorios de usuarios, AERAF, aulas, auditoría
│   └── services/           Auth, Gasto, Ingreso, Modificación, Flujo (OPP/MADAF), Ejecutora, AERAF, Docente
├── preload/                Puente seguro: expone solo window.siaf (invoke, archivos, impresión, eventos)
└── renderer/src/           Interfaz React
    ├── api.ts              Cliente tipado de la API
    ├── store.ts            Estado global (sesión, navegación, ejecutora, avisos, diálogos)
    ├── components/         UI reutilizable: Shell, formularios, diálogos, selectores (Generación de operaciones, metas...)
    └── features/           Portal, Inicio, Ejecución (Certificados, CA, Expedientes, Ingresos, Modificaciones,
                            Contable, Verificar, Clasificadores, Catálogo, Reportes), Opl, Aeraf, Madaf, Docente
tests/
├── unit/                   30 pruebas: dominio, base de datos, usuarios, registro, aislamiento, flujo CP1, docente
└── e2e/                    6 pruebas Playwright sobre la aplicación compilada
```

## Flujo de una operación

```
React (formulario) ─► api.ts ─► preload (ipcRenderer.invoke) ─► main/app.ts invocar()
   ─► Zod valida la forma ─► Servicio (reglas de negocio, roles)
   ─► Contexto.operar(): carga el agregado ─► aplica cambios ─► EjecutoraRepo.guardar()
   ─► auditoría ─► COMMIT + escritura atómica del archivo SQLite
   ─► evento «cambio» ─► el renderer recarga la ejecutora y muestra el aviso
```

Si cualquier regla falla se lanza `ErrorNegocio`, la transacción se revierte y el usuario ve el mensaje.

## Flujo de estados

| Registro | Estados |
|---|---|
| Certificación (y ampliación) | Registrado › En verificación › Enviado a OPP › Pendiente de firma (MADAF) › Aprobado |
| Compromiso anual | Registrado › En verificación › Pendiente de firma (MADAF) › Aprobado |
| Compromiso mensual, T-6, pagado, determinado, recaudado | Registrado › En verificación › Aprobado |
| Devengado y girado | Registrado › En verificación › Pendiente de firma (MADAF) › Aprobado |

La verificación automática se ejecuta en el proceso principal tras 1,3 s; la aprobación OPP la realiza
un usuario con perfil OPP y la firma MADAF exige DNIe (PIN) y clave dinámica de 3 minutos.

## Base de datos

Tablas: `usuarios`, `ejecutoras`, `proveedores`, `certificados`, `cert_secuencias`, `compromisos_anuales`,
`ca_modificaciones`, `expedientes`, `exp_secuencias`, `retenciones`, `comprobantes`, `ingresos`,
`ing_secuencias`, `modificaciones`, `items`, `responsables`, `aulas`, `estudiantes`, `entregas`,
`auditoria`, `meta`, `schema_version`. Archivo: `%APPDATA%\SIAF-WEB Simulador\siaf.sqlite`.

## Comandos

```
npm install          dependencias
npm run dev          desarrollo con recarga en caliente
npm test             pruebas unitarias e integración (Vitest)
npm run build        compilación
npm run test:e2e     pruebas de punta a punta (Playwright, requiere build)
npm run typecheck    verificación de tipos
npm run dist         instalador de Windows en dist/
```
