# Guiones de interfaz para las pruebas de humo (se ejecutan dentro de la ventana de Electron)
$base = @'
const sleep = ms => new Promise(r => setTimeout(r, ms));
const setv = (el, v) => { const p = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
const clic = t => { const b = [...document.querySelectorAll('button, a, .tile, .li, .acc')].find(x => x.textContent.trim().includes(t)); if (!b) throw new Error('No se encontró: ' + t); b.click(); };
const login = async (u, c) => { const i = document.querySelectorAll('.lg-card input'); setv(i[0], u); setv(i[1], c); clic('Ingresar'); await sleep(900); };
'@
function Guion([string]$cuerpo) { return "(async () => { $base`n $cuerpo })()" }
$G = @{
  'cert'    = Guion "await login('RU20261','siaf2026'); clic('Módulo Ejecución'); await sleep(1500); document.querySelector('.li').click(); await sleep(700);"
  'certform'= Guion "await login('RU20261','siaf2026'); clic('Módulo Ejecución'); await sleep(1500); document.querySelector('.plus').click(); await sleep(700);"
  'dev'     = Guion "await login('RU20261','siaf2026'); clic('Módulo Ejecución'); await sleep(1500); clic('Registro SIAF - Devengado'); await sleep(600); document.querySelector('.li').click(); await sleep(600); clic('Detalle'); await sleep(500);"
  'cont'    = Guion "await login('RU20261','siaf2026'); clic('Módulo Ejecución'); await sleep(1500); const s = document.querySelector('.msel select'); setv(s, 'Consulta'); await sleep(900);"
  'docente' = Guion "await login('DOCENTE','docente2026'); clic('Panel del docente'); await sleep(900); setv(document.querySelectorAll('.dc-grid input')[0], 'Gabinete CON312 - Grupo F'); clic('Crear'); await sleep(900);"
  'opp'     = Guion "await login('OPP20261','opp2026'); clic('SIAF Operaciones en Línea'); await sleep(1200);"
  'genops'  = Guion "await login('RU20261','siaf2026'); clic('Módulo Ejecución'); await sleep(1500); const sel = document.querySelectorAll('.casebar select')[0]; setv(sel, 'cp3'); await sleep(1200); clic('Registro SIAF - Compromiso Mensual'); await sleep(600); document.querySelector('.plus').click(); await sleep(500);"
}
