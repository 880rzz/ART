import fs from 'node:fs';

const css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');
const release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;
const errors=[];
for(const token of [
  'STAGE106-GLOBAL-APPLE-TYPE-RHYTHM:START',
  '--art-type-page:clamp(2.75rem,5.15vw,5.1rem)',
  '--art-type-section:clamp(2rem,3.05vw,3.2rem)',
  '--art-type-chapter:clamp(1.5rem,2vw,2.1rem)',
  '--art-type-lead:clamp(1.08rem,.42vw + 1rem,1.24rem)',
  '--art-type-label:.78rem',
  '--art-intro-measure:50rem',
  '.intro,.section-head,.section-intro,.curatorial-periods__intro,.life-journey__intro',
  'section.wrap,section.container,section.inner',
  '.press-overview__grid>div>h2',
  '@media(max-width:719px)'
]) if(!css.includes(token)) errors.push('global Apple type CSS missing '+token);

const files=['index.html','hu/index.html','de-at/index.html','writing.html','hu/writing.html','de-at/writing.html','community.html','hu/community.html','de-at/community.html','press.html','hu/press.html','de-at/press.html','curators.html','hu/curators.html','de-at/curators.html'];
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('homepage-two-tone-authority.css?v='+release)) errors.push(file+': stale authority token');
  if(!/<h1[\s>]/.test(html)||!/<h2[\s>]/.test(html)) errors.push(file+': page/section hierarchy missing');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Stage 106 global Apple type rhythm passed on ${release}: page titles, section titles, chapter titles, leads and labels are guarded across 15 EN/HU/DE home, writing, community, press and curator templates.`);
