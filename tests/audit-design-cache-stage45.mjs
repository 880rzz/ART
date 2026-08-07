import fs from 'node:fs';

const sw=fs.readFileSync('sw.js','utf8');
const failures=[];
for(const token of [
  "const V='banhalmi-art-20260808-blue-rhythm-video-v58'",
  "ks.filter(k=>k!==V).map(k=>caches.delete(k))",
  "const isDesignAsset=/\\.(?:css|js)$/i.test(url.pathname);",
  "new Request(r,{cache:'reload'})"
]) if(!sw.includes(token)) failures.push(`sw.js missing design cache contract: ${token}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('ART design cache invalidation audit passed.');
