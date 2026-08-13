import fs from 'node:fs';
const sw=fs.readFileSync('sw.js','utf8');
const failures=[];

for(const token of [
  "const V='banhalmi-art-20260814-live-refresh-v84'",
  "const PRE=[\"/assets/img/favicon.svg\",\"/site.webmanifest\"]",
  "const PRESET=new Set(PRE)",
  "keys.filter(key=>key!==V).map(key=>caches.delete(key))",
  "if(request.mode==='navigate')return;",
  "if(!PRESET.has(url.pathname))return;"
]) if(!sw.includes(token)) failures.push(`sw.js missing pass-through performance contract: ${token}`);

for(const forbidden of [
  "response.text()",
  "repairHtml(",
  "repairedResponse(",
  "cache:'no-store'",
  "cache:'reload'",
  'isDesignAsset',
  'isGalleryImage',
  '/assets/img/best-of/best-of-01.webp',
  '/assets/img/best-of/best-of-15.webp',
  '/assets/img/hero.webp',
  '/assets/img/portrait-circle.png',
  '/index.html',
  '/hu/index.html',
  '/de-at/index.html'
]) if(sw.includes(forbidden)) failures.push(`sw.js contains forbidden first-load interception/cache pattern: ${forbidden}`);

const respondWithCount=(sw.match(/respondWith\(/g)||[]).length;
if(respondWithCount!==1) failures.push(`sw.js should have exactly one respondWith() path for the two tiny PRE assets, found ${respondWithCount}`);

if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('ART design cache audit passed: HTML navigation streams natively, CSS/JS/images use the browser HTTP cache, stale worker generations are purged by the v84 cache rotation, and the service worker only serves the two tiny shell metadata assets.');
