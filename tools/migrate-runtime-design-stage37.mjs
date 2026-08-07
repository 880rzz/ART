import fs from 'node:fs';

const jsPath='assets/js/responsive-header-system.js';
const cssPath='assets/css/museum-editorial.css';
let js=fs.readFileSync(jsPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');

const systemStart="  const systemStyle = document.createElement('style');";
const systemEnd='  document.head.append(systemStyle);';
const systemStartPos=js.indexOf(systemStart);
const systemEndPos=js.indexOf(systemEnd,systemStartPos);
if(systemStartPos<0 || systemEndPos<0) throw new Error(`Runtime system style boundaries not found: start=${systemStartPos}, end=${systemEndPos}`);
const systemBlockEnd=systemEndPos+systemEnd.length;
const systemBlock=js.slice(systemStartPos,systemBlockEnd);
const systemMatch=systemBlock.match(/systemStyle\.textContent\s*=\s*`([\s\S]*?)`;\s*[\s\S]*?document\.head\.append\(systemStyle\);/);
if(!systemMatch) throw new Error('Could not extract systemStyle template literal safely');
const runtimeCss=systemMatch[1];
if(runtimeCss.includes('${')) throw new Error('Runtime system CSS contains template interpolation; refusing static migration');
if(runtimeCss.length<12000) throw new Error(`Runtime system CSS unexpectedly small (${runtimeCss.length} chars); refusing migration`);
for(const required of ['html body.apple-archive{','.curatorial-hero{','.curatorial-section{','[data-archive-page="index"] #journey']){
  if(!runtimeCss.includes(required)) throw new Error(`Runtime system CSS missing expected contract before migration: ${required}`);
}

const iconStart="  const iconOverride = document.createElement('style');";
const iconEnd='  document.head.append(iconOverride);';
const iconStartPos=js.indexOf(iconStart,systemBlockEnd);
const iconEndPos=js.indexOf(iconEnd,iconStartPos);
if(iconStartPos<0 || iconEndPos<0) throw new Error(`Runtime icon style boundaries not found: start=${iconStartPos}, end=${iconEndPos}`);
const iconBlockEnd=iconEndPos+iconEnd.length;
const iconBlock=js.slice(iconStartPos,iconBlockEnd);
const iconMatch=iconBlock.match(/iconOverride\.textContent\s*=\s*'([^']+)';\s*[\s\S]*?document\.head\.append\(iconOverride\);/);
if(!iconMatch) throw new Error('Could not extract iconOverride CSS safely');
const iconCss=iconMatch[1];
if(!iconCss.includes('body.apple-archive .burger::before') || !iconCss.includes('body.apple-archive .burger::after')){
  throw new Error('Runtime icon CSS no longer matches the known burger pseudo-element override');
}

const markerStart='/* STAGE37-STATIC-ARCHIVE-INTERFACE:START */';
const markerEnd='/* STAGE37-STATIC-ARCHIVE-INTERFACE:END */';
if(css.includes(markerStart) || css.includes(markerEnd)) throw new Error('Stage 37 static archive interface marker already present; refusing duplicate migration');

css += `\n\n${markerStart}\n/* Migrated from responsive-header-system.js. Museum editorial remains the final design authority. */\n${runtimeCss.trim()}\n${iconCss}\n${markerEnd}\n`;

// Remove later block first so original offsets remain valid.
js=js.slice(0,iconStartPos)+js.slice(iconBlockEnd);
js=js.slice(0,systemStartPos)+js.slice(systemBlockEnd);

if(/createElement\s*\(\s*['"]style['"]\s*\)/.test(js)) throw new Error('Another runtime style injection remains in responsive-header-system.js after migration');
for(const forbidden of ['archiveInterfaceSystem','responsiveHeaderIcon','systemStyle.textContent','iconOverride.textContent']){
  if(js.includes(forbidden)) throw new Error(`Runtime presentation marker remains in JavaScript: ${forbidden}`);
}
if(!css.includes(markerStart)||!css.includes(markerEnd)) throw new Error('Static CSS marker was not written');
if(!css.includes(iconCss)) throw new Error('Static burger icon override was not written');

fs.writeFileSync(cssPath,css);
fs.writeFileSync(jsPath,js);
console.log(`Stage 37 migrated ${runtimeCss.length} chars of archive-interface CSS plus ${iconCss.length} chars of burger override CSS into museum-editorial.css and removed JS presentation injection.`);
