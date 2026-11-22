/* Sustituye la paleta morada por la paleta institucional del SIAF (turquesa #0e8ab5, rojo #e8402f, azul MADAF/AERAF). */
const fs = require('fs');
const path = require('path');
const MAPA = {
  '#2a0d45': '#06455c', '#3b1260': '#0a5f7e', '#4c1d7a': '#0b7aa1', '#5f2a96': '#0e8ab5', '#7438b3': '#2a9fc7', '#9157cc': '#4fb4d6',
  '#b48ae0': '#86cde6', '#d9c4f2': '#bfe5f2', '#efe6fb': '#e3f3f9', '#f8f4fd': '#f2f9fc',
  '#2b2236': '#24313a', '#776c86': '#687883', '#e2d9ee': '#dbe5ea', '#f3eff8': '#f0f4f6', '#4b405a': '#43525c',
  'rgba(76,29,122': 'rgba(11,122,161', 'rgba(116,56,179': 'rgba(14,138,181', 'rgba(95,42,150': 'rgba(14,138,181', 'rgba(60,20,90': 'rgba(20,60,80',
  'rgba(30,10,50': 'rgba(10,30,40', 'rgba(60,20,100': 'rgba(10,60,90',
  '#f0eaf6': '#edf2f5', '#efeaf5': '#eaf1f4', '#e8e2ef': '#e4ecf0', '#d3c8e2': '#cfd9df', '#efebf4': '#eef2f4', '#4e4560': '#4a5862',
  '#f1edf6': '#f0f4f6', '#5b5068': '#53626c', '#e2dcea': '#dde5ea', '#e9e4f1': '#e3f1fb', '#5b4b73': '#2a6fd6', '#fbf9fe': '#f8fbfc',
  '#faf7fd': '#f6fafb', '#eee8f4': '#e7eff3', '#f4f1f8': '#f4f6f8', '#e3dcec': '#dde4e9', '#cfc4dd': '#c9d3da', '#ece6f4': '#e6f2f7',
  '#3a245a': '#1d3f73', '#6a4596': '#2f6596', '#eef0f6': '#eef2f6', '#d5d0de': '#cfd6de', '#4b3a6a': '#24476e', '#e8e0f4': '#dfe7f2',
  '#cfc6dd': '#c5d1e2', '#dcd3ea': '#dfe7f2', '#2f1f4a': '#1d3f73', '#7a3fc0': '#2bb0de', '#5b2a86': '#0e8ab5'
};
const raiz = path.join(__dirname, '..');
['src/renderer/src/styles/app.css', 'src/renderer/src/styles/extra.css', 'src/main/index.ts'].forEach(rel => {
  const f = path.join(raiz, rel);
  let t = fs.readFileSync(f, 'utf8'), n = 0;
  for (const [de, a] of Object.entries(MAPA)) { const partes = t.split(de); n += partes.length - 1; t = partes.join(a); }
  fs.writeFileSync(f, t, 'utf8');
  console.log(rel, n, 'reemplazos');
});
