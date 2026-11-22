# SIAF-WEB Simulador

Entorno de práctica académica de la Plataforma SIAF-SP (Módulo de Ejecución, SIAF Operaciones en
Línea, AERAF y MADAF) con el **Caso Práctico 1: obra P.S. Aymaña, CUI 2308220**.
Curso Gabinete de Contabilidad y Gestión Pública, UNA Puno.

> Simulador académico. No es el sistema oficial del Ministerio de Economía y Finanzas ni está afiliado a él.

## Dos versiones, un mismo código

| | Escritorio (Windows) | Web (navegador) |
|---|---|---|
| Dónde se guardan los datos | SQLite en el equipo | Supabase (nube) |
| Acceso | Usuario/clave, correo o Google | Correo o Google |
| Publicación | Instalador NSIS (`npm run dist`) | Vercel desde GitHub (`npm run build:web`) |

Las reglas del SIAF (saldos, estados, validaciones, contabilidad en tres capas) están en
`src/shared` y los servicios en `src/main/services`; ambas versiones ejecutan exactamente el mismo código.

## Perfiles SIAF

El **Administrador de usuarios** asigna a cada usuario un perfil (Operador, Logística, Presupuesto
(OPP), Contabilidad, Tesorería, Consulta) y, por cada opción, acceso de **Consulta** u **Operación**.
Cada usuario trabaja en su propio espacio: sus registros no se mezclan con los de otros.

## Comandos

```
npm install          dependencias
npm run dev          escritorio en desarrollo
npm run dev:web      web en desarrollo (http://localhost:5180)
npm test             pruebas unitarias e integración
npm run test:e2e     pruebas de punta a punta del escritorio (requiere npm run build)
npm run test:web     pruebas de punta a punta de la web (Microsoft Edge)
npm run typecheck    verificación de tipos de las tres compilaciones
npm run dist         instalador de Windows
npm run build:web    sitio web estático en dist-web/
```

Publicación web: ver **[DESPLIEGUE-WEB.md](DESPLIEGUE-WEB.md)**. Arquitectura: **[ARQUITECTURA.md](ARQUITECTURA.md)**.
