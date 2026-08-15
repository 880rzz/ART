import fs from 'node:fs';

const file='hu/index.html';
let html=fs.readFileSync(file,'utf8');
const hero=/<img\b(?=[^>]*\bclass=["'][^"']*\bhero-bg-img\b[^"']*["'])[^>]*>/i.exec(html);
if(!hero)throw new Error('HU homepage hero image missing');
if(!/\bfetchpriority=["']high["']/i.test(hero[0])||!/\bloading=["']eager["']/i.test(hero[0]))throw new Error('HU homepage hero must remain the sole eager/high LCP candidate');
const gallery=/<img\b(?=[^>]*\bsrc=["']\/assets\/img\/best-of\/best-of-01\.webp["'])[^>]*>/i.exec(html);
if(!gallery)throw new Error('HU homepage first archive-gallery image missing');
let tag=gallery[0]
  .replace(/\bloading=(["'])eager\1/i,'loading="lazy"')
  .replace(/\bfetchpriority=(["'])high\1/i,'fetchpriority="low"');
if(!/\bloading=["']lazy["']/i.test(tag)||!/\bfetchpriority=["']low["']/i.test(tag))throw new Error('Could not demote HU gallery image priority deterministically');
if(tag!==gallery[0]){
  html=html.slice(0,gallery.index)+tag+html.slice(gallery.index+gallery[0].length);
  fs.writeFileSync(file,html);
  console.log('hu/index.html: kept hero as sole high-priority LCP image and demoted first archive-gallery image to lazy/low.');
}else console.log('hu/index.html: image-priority remediation already applied.');
const highs=[...html.matchAll(/<img\b[^>]*\bfetchpriority=["']high["'][^>]*>/gi)];
if(highs.length!==1||!/\bhero-bg-img\b/i.test(highs[0][0]))throw new Error(`HU homepage must have exactly one high-priority hero image; found ${highs.length}`);
