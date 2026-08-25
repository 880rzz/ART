import{readFile}from'node:fs/promises';
const css=await readFile('assets/css/site.css','utf8'),pages=['curators.html','hu/curators.html','de-at/curators.html'],errors=[];
for(const broken of['ART-CURATORS-LAYOUT-REPAIR-20260825:START','grid-template-columns:minmax(14rem,.55fr) minmax(0,1.45fr)'])if(css.includes(broken))errors.push('broken curator layout override present: '+broken);
for(const need of['--apple-page-max:1200px','--apple-reading-max:760px','text-align:left'])if(!css.includes(need))errors.push('shared readable layout contract missing '+need);
for(const p of pages){const h=await readFile(p,'utf8');if(!h.includes('data-archive-page="curators"'))errors.push(p+': curatorial marker missing');if(!h.includes('site.css?v=20260825-art-design-v3'))errors.push(p+': stale CSS cache key');if(!/<h2[\s>]/i.test(h)||!/<p class="lead"/i.test(h))errors.push(p+': dossier reading structure missing')}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Curatorial layout audit passed: EN/HU/DE dossiers stay on the shared readable vertical axis and cannot regress to the broken two-column grid.');
