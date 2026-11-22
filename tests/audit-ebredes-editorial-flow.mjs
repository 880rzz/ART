import assert from 'node:assert/strict';
import fs from 'node:fs';
const pages=['exhibitions/ebredes.html','hu/exhibitions/ebredes.html','de-at/exhibitions/ebredes.html'];
for(const path of pages){
 const html=fs.readFileSync(path,'utf8');
 const main=html.split('<main')[1]?.split('</main>')[0]||'';
 const order=['data-archive-facts="true"','id="ebredes-book-context-title"','id="galwrap"','id="ebredes-film-title"','id="nude-authority-title"','id="record-depth-title"','id="project-evidence-title"','id="next-chapter-title"','id="ebredes-editorial-context-title"'];
 let position=-1;
 for(const marker of order){const at=main.indexOf(marker);assert.ok(at>position,path+': wrong visual reading order or missing '+marker);position=at;assert.equal(main.split(marker).length-1,1,path+': duplicate '+marker)}
 const imgs=[...main.matchAll(/<img\b[^>]*src="\/assets\/img\/exhibitions\/ebredes\/ebredes-\d+\.webp"[^>]*>/g)];
 assert.equal(imgs.length,18,path+': exhibition gallery must keep 18 original photographs');
 assert.ok(imgs.every(m=>/\balt="[^"]+"/.test(m[0])),path+': descriptive image alternative text missing');
 assert.equal((main.match(/<section\b/g)||[]).length,(main.match(/<\/section>/g)||[]).length,path+': invalid section hierarchy');
 assert.equal((main.match(/<div\b/g)||[]).length,(main.match(/<\/div>/g)||[]).length,path+': invalid layout hierarchy');
 assert.ok(html.includes('978-963-12-8663-2'),path+': historical book provenance missing');
 assert.ok(!html.includes('data-artistic-nude-enquiry')&&!html.includes('data-artistic-nude-service'),path+': commercial offer inserted into ART');
}
console.log('Ébredés 3-language archival reading order, 18 original images, authority boundary PASS');
