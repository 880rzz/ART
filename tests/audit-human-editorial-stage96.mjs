import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const root=process.cwd();
const config=JSON.parse(fs.readFileSync('data/design-release.json','utf8'));
const css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');

for(const token of [
  'STAGE96-HUMAN-EDITORIAL-APPLE-RESILIENCE:START',
  'min-width:0!important',
  'overflow-wrap:break-word',
  '--art-gutter:clamp(1.15rem,5.4vw,1.45rem)',
  'font-size:clamp(2.3rem,10.5vw,3rem)!important',
  '.u-last-row{border-bottom:none!important;padding-bottom:0!important}'
]) if(!css.includes(token)) failures.push('Stage96 Apple design contract missing: '+token);

function visible(h){return h.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<!--.*?-->/gs,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')}
const pages=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','.github','node_modules','reports'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const h=fs.readFileSync(p,'utf8');if(/<body\b[^>]*class=["'][^"']*apple-archive/i.test(h)&&/<main\b/i.test(h)&&/<footer\b/i.test(h))pages.push([p,h]);}}}
walk(root);
if(pages.length!==87) failures.push(`Stage96 expected 87 ART content pages, found ${pages.length}`);

const banned=[
  'sits somewhere between radical purism and dignified documentarism',
  'sacred chaos of tantric intimacy',
  'active therapy',
  'emotional resonators',
  'visual revolt against the young-thin-perfect triangle',
  'participatory territory',
  'from auteur to facilitator',
  'sacred space fused with profane technology',
  'social embeddedness',
  'The question became how an artwork can remain human',
  'valahol a radikális puritanizmus és a méltóságteljes dokumentarizmus között',
  'tantrikus intimitás szakrális káoszáig',
  'aktív terápiaként',
  'szakrális tér és profán technológia fúziója',
  'Társadalmi beágyazottság',
  'A kérdés az lett, hogyan maradhat emberi és hiteles egy mű',
  'liegt irgendwo zwischen radikalem Purismus und würdevollem Dokumentarismus',
  'sakralen Chaos tantrischer Intimität',
  'aktive Therapie',
  'emotionale Resonatoren',
  'visuelle Revolte gegen das Dreieck jung-dünn-perfekt',
  'sakraler Raum, verschmolzen mit profaner Technologie',
  'Gesellschaftliche Verankerung',
  'Die Frage wurde, wie ein Kunstwerk menschlich und glaubwürdig bleiben kann',
  'gewissermaßen dessen intimere Hälfte'
];

for(const [file,html] of pages){
  const rel=path.relative(root,file).replaceAll('\\','/');
  const auth=[...html.matchAll(/<link[^>]+href=["']([^"']*homepage-two-tone-authority\.css[^"']*)["'][^>]*>/gi)];
  if(auth.length!==1) failures.push(`${rel}: final visual authority must appear exactly once`);
  else if(!auth[0][1].includes(`?v=${config.release}`)) failures.push(`${rel}: final visual authority cache token is stale`);
  for(const m of html.matchAll(/<([a-z0-9:-]+)\b[^>]*\sstyle=["']([^"']+)["'][^>]*>/gi)){
    const style=m[2].toLowerCase();
    if(/(?:^|;)\s*(?:font-size|line-height|letter-spacing|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|max-width|width|white-space|border-bottom)\s*:/.test(style))
      failures.push(`${rel}: page-specific typography/layout style remains on <${m[1]}>: ${m[2]}`);
  }
  const text=visible(html);
  for(const phrase of banned) if(text.toLowerCase().includes(phrase.toLowerCase())) failures.push(`${rel}: mechanical/translation-like phrase remains: ${phrase}`);
}

const required={
  'curators.html':['Discipline, human presence and intimacy run through the same photographic practice.','Human and social context','A coherent visual language'],
  'hu/curators.html':['A munkáimban a fegyelem, az emberi jelenlét és az intimitás ugyanannak az alkotói útnak a részei.','Emberi és társadalmi kapcsolódás','Következetes képi nyelv'],
  'de-at/curators.html':['Disziplin, menschliche Präsenz und Intimität gehören für mich zu derselben fotografischen Arbeit.','Menschlicher und gesellschaftlicher Kontext','Eine klare Bildsprache'],
  'de-at/books/book-ebredes.html':['erzählt seine intimere, persönliche Seite']
};
for(const [file,tokens] of Object.entries(required)){const h=fs.readFileSync(file,'utf8');for(const token of tokens)if(!h.includes(token))failures.push(`${file}: reviewed Stage96 human copy missing: ${token}`)}

if(typeof config.release!=='string'||!config.release.trim()) failures.push('No active design release token');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Stage96 passed under active release ${config.release}: ${pages.length} ART content pages retain the human editorial and Apple-resilience contract without page-specific typography/layout drift.`);