import fs from 'node:fs';

const failures=[];
const refinement=fs.readFileSync('assets/css/design-refinements.css','utf8');
const apple=fs.readFileSync('assets/css/apple-editorial-system.css','utf8');
const museum=fs.readFileSync('assets/css/museum-editorial.css','utf8');

if(refinement.includes('Homepage exhibitions: one clean two-column editorial grid')) failures.push('design-refinements.css still owns homepage exhibitions desktop layout');
if(/#exhibitions[^\n]{0,180}grid-template-columns:repeat\(2/i.test(refinement)) failures.push('design-refinements.css still contains competing two-column #exhibitions ownership');
if(!refinement.includes('Homepage #journey/#exhibitions desktop chronology is owned by apple-editorial-system.css')) failures.push('design-refinements.css missing explicit ownership handoff');
if(!apple.includes('#journey :where(.timeline,.chronology,.archive-list,.record-list)') || !apple.includes('#exhibitions :where(.timeline,.chronology,.archive-list,.record-list)')) failures.push('apple-editorial-system.css must own both homepage chronology axes');
if(!museum.includes('homepage centre-axis chronology (apple-editorial-system.css)')) failures.push('museum-editorial.css must document chronology ownership');

const pages=['index.html','hu/index.html','de-at/index.html','press.html','hu/press.html','de-at/press.html','community.html','hu/community.html','de-at/community.html','writing.html','hu/writing.html','de-at/writing.html','curators.html','hu/curators.html','de-at/curators.html'];
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  if(!/class=["'][^"']*apple-archive/.test(html)) failures.push(`${file}: missing apple-archive design scope`);
  const hrefs=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
  const design=hrefs.findIndex(h=>h.includes('/assets/css/design-refinements.css'));
  const applePos=hrefs.findIndex(h=>h.includes('/assets/css/apple-editorial-system.css'));
  const museumPos=hrefs.findIndex(h=>h.includes('/assets/css/museum-editorial.css'));
  if(design<0 || applePos<0 || museumPos<0) failures.push(`${file}: missing canonical design stylesheet stack`);
  else if(!(design < applePos && applePos < museumPos)) failures.push(`${file}: design stylesheet order must be refinements -> apple editorial -> museum editorial`);
  if(museumPos>=0 && hrefs.slice(museumPos+1).some(h=>/museum|editorial|design-refinements|apple-editorial|archive-system|presence-core|final-layout/i.test(h))) failures.push(`${file}: another major design layer loads after museum-editorial.css`);
}

if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Stage 36 design authority audit passed: one chronology owner, canonical stylesheet order, museum layer remains final design authority.');
