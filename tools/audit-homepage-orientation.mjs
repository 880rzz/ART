import fs from 'node:fs';

const pages=['index.html','hu/index.html','de-at/index.html'];
const failures=[];
function visible(html){return html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim()}
function section(html,id){const start=new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>`,'i').exec(html);if(!start)return'';let depth=1;const re=/<\/?section\b[^>]*>/gi;re.lastIndex=start.index+start[0].length;let m;while((m=re.exec(html))){depth+=/^<section\b/i.test(m[0])?1:-1;if(depth===0)return html.slice(start.index,re.lastIndex)}return''}
function words(s){return (visible(s).match(/\b[\wÀ-ž'-]+\b/g)||[]).length}
for(const file of pages){const html=fs.readFileSync(file,'utf8');
  for(const id of ['journey','exhibitions'])if(!section(html,id))failures.push(`${file}: #${id} missing`);
  if((html.match(/data-home-orientation="v1"/g)||[]).length!==2)failures.push(`${file}: homepage orientation markers missing or duplicated`);
  const j=section(html,'journey'),e=section(html,'exhibitions');
  if(words(j)>520)failures.push(`${file}: journey is ${words(j)} words; homepage must orient, not duplicate the curatorial narrative`);
  if(words(e)>360)failures.push(`${file}: exhibitions is ${words(e)} words; detailed exhibition essays belong on exhibition pages`);
  const exhibitionLinks=(e.match(/class="exhibition-map__row"/g)||[]).length;
  if(exhibitionLinks!==20)failures.push(`${file}: expected all 20 exhibition routes, found ${exhibitionLinks}`);
  if((j.match(/class="archive-card orientation-card"/g)||[]).length!==4)failures.push(`${file}: expected four orientation periods`);
  if(!/href="curators\.html"/.test(j)||!/href="community\.html"/.test(j))failures.push(`${file}: journey must hand off to Curators and Community canonical pages`);
  const total=words(html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||html);
  if(total>2100)failures.push(`${file}: homepage remains too dense at ${total} words`);
}
const css=fs.readFileSync('assets/css/site.css','utf8');for(const token of ['HOME-ORIENTATION-REMEDIATION-20260814:START','.archive-orientation-grid','.exhibition-map__row'])if(!css.includes(token))failures.push(`site.css: missing ${token}`);
if(failures.length){console.error('ART homepage orientation audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('ART homepage orientation audit passed: four-period journey, all 20 exhibition routes, no duplicated long-form archive essays.');
