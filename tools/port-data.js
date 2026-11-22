// Convierte los datos validados (data.js de la versión 1) a módulos TypeScript tipados.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(process.argv[2], 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + '\nthis.CAT=CAT;this.CASOS=CASOS;this.MESES=MESES;this.CTX_ORDER=CTX_ORDER;', ctx);
const out = path.join(__dirname, '..', 'src', 'shared');
const j = o => JSON.stringify(o, null, 1);
fs.writeFileSync(path.join(out, 'catalogo.ts'),
  `/* Catálogo de apoyo (hoja «Catálogo» de Simulador_SIAF_Casos_Practicos_2026.xlsx). Generado por tools/port-data.js */\n` +
  `export const CAT = ${j(ctx.CAT)};\n\nexport const MESES: string[] = ${JSON.stringify(ctx.MESES)};\n`);
fs.writeFileSync(path.join(out, 'casos.ts'),
  `/* Casos Prácticos 1, 2 y 3: definición declarativa de fases, asientos y controles. Generado por tools/port-data.js */\n` +
  `import type { CasoDef } from './types';\n\nexport const CTX_ORDER = ${JSON.stringify(ctx.CTX_ORDER)} as const;\nexport type CtxId = typeof CTX_ORDER[number];\n\n` +
  `export const CASOS: Record<string, CasoDef> = ${j(ctx.CASOS)} as unknown as Record<string, CasoDef>;\n`);
console.log('ok');
