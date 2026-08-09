import fs from 'node:fs';
const sw=fs.readFileSync('sw.js','utf8');
const failures=[];
for(const token of [
  "const V='banhalmi-art-20260809-lean-shell-v73'",
  "const PRE=[\"/assets/img/favicon.svg\",\"/site.webmanifest\"]",
  "ks.filter(k=>k!==V).map(k=>caches.delete(k))",
  "const isGalleryImage=/^\\/assets\\/img\\/best-of\\//i.test(url.pathname);",
  "if(isGalleryImage)return;",
  "const isDesignAsset=/\\.(?:css|js)$/i.test(url.pathname);",
  "new Request(r,{cache:'reload'})"
]) if(!sw.includes(token)) failures.push(`sw.js missing design/performance cache contract: ${token}`);
for(const forbidden of [
  '/assets/img/best-of/best-of-01.webp',
  '/assets/img/best-of/best-of-15.webp',
  '/assets/img/hero.webp',
  '/assets/img/portrait-circle.png',
  '/index.html',
  '/hu/index.html',
  '/de-at/index.html'
]) if(sw.includes(`\"${forbidden}\"`)) failures.push(`sw.js must not precache heavy/redundant first-load asset: ${forbidden}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('ART design cache audit passed: design assets remain freshness-first while SW installation is lean and the gallery stays on the browser HTTP cache instead of a duplicate service-worker image cache.');
