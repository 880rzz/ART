import fs from 'node:fs';

const jsPath='assets/js/responsive-header-system.js';
const cssPath='assets/css/museum-editorial.css';
let js=fs.readFileSync(jsPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

const start="  const systemStyle = document.createElement('style');";
const end='  document.head.append(systemStyle);';
const startPos=js.indexOf(start);
const endPos=js.indexOf(end,startPos);
if(startPos<0 || endPos<0) throw new Error(`Runtime style block boundaries not found: start=${startPos}, end=${endPos}`);
const blockEnd=endPos+end.length;
const block=js.slice(startPos,blockEnd);

const match=block.match(/systemStyle\.textContent\s*=\s*`([\s\S]*?)`;\s*[\s\S]*?document\.head\.append\(systemStyle\);/);
if(!match) throw new Error('Could not extract systemStyle template literal safely');
const runtimeCss=match[1];
if(runtimeCss.includes('${')) throw new Error('Runtime CSS contains template interpolation; refusing static migration');
if(runtimeCss.length<12000) throw new Error(`Runtime CSS unexpectedly small (${runtimeCss.length} chars); refusing migration`);
for(const required of ['html body.apple-archive{','.curatorial-hero{','.curatorial-section{','[data-archive-page="index"] #journey']){
  if(!runtimeCss.includes(required)) throw new Error(`Runtime CSS missing expected contract before migration: ${required}`);
}

const markerStart='/* STAGE37-STATIC-ARCHIVE-INTERFACE:START */';
const markerEnd='/* STAGE37-STATIC-ARCHIVE-INTERFACE:END */';
if(css.includes(markerStart) || css.includes(markerEnd)) throw new Error('Stage 37 static archive interface marker already present; refusing duplicate migration');

css += `\n\n${markerStart}\n/* Migrated byte-for-byte from responsive-header-system.js. Museum editorial remains the final design authority. */\n${runtimeCss.trim()}\n${markerEnd}\n`;
js=js.slice(0,startPos)+js.slice(blockEnd);

if(/createElement\s*\(\s*['"]style['"]\s*\)/.test(js)) throw new Error('Another runtime style injection remains in responsive-header-system.js after migration');
if(js.includes('archiveInterfaceSystem')) throw new Error('Runtime archiveInterfaceSystem marker remains in JavaScript');
if(!css.includes(markerStart)||!css.includes(markerEnd)) throw new Error('Static CSS marker was not written');

fs.writeFileSync(cssPath,css);
fs.writeFileSync(jsPath,js);
console.log(`Stage 37 migrated ${runtimeCss.length} chars of runtime design CSS into museum-editorial.css and removed JS presentation injection.`);
