import fs from 'node:fs';

const css = fs.readFileSync('assets/css/homepage-two-tone-authority.css', 'utf8');
const release = JSON.parse(fs.readFileSync('data/design-release.json', 'utf8')).release;
const errors = [];

for (const token of [
  'STAGE142-UNIVERSAL-APPLE-DESIGN-CONTRACT:START',
  '--art-page-title:clamp(2.75rem,5.15vw,5.15rem)',
  '--art-section-title:clamp(2rem,3.05vw,3.2rem)',
  '--art-chapter-title:clamp(1.4rem,1.85vw,2rem)',
  '--art-lead:clamp(1.08rem,.42vw + 1rem,1.24rem)',
  '--art-reading:68ch',
  '--art-reading-wide:82ch',
  ':is(h1,h2,h3,h4)',
  'h1{font-size:var(--art-page-title)!important',
  'h2{font-size:var(--art-section-title)!important',
  'h3{font-size:var(--art-chapter-title)!important',
  'main :is(.lead,p.lead,.hero-sub){font-size:var(--art-lead)!important',
  '.intro,.section-head,.section-intro,.curatorial-periods__intro,.life-journey__intro',
  '@media(max-width:700px)'
]) {
  if (!css.includes(token)) errors.push('universal type contract missing ' + token);
}

for (const forbidden of [
  'STAGE106-GLOBAL-APPLE-TYPE-RHYTHM:START',
  '--art-intro-measure:50rem'
]) {
  if (css.includes(forbidden)) errors.push('retired type/layout contract returned: ' + forbidden);
}

const files = [
  'index.html','hu/index.html','de-at/index.html',
  'writing.html','hu/writing.html','de-at/writing.html',
  'community.html','hu/community.html','de-at/community.html',
  'press.html','hu/press.html','de-at/press.html',
  'curators.html','hu/curators.html','de-at/curators.html'
];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('homepage-two-tone-authority.css?v=' + release)) errors.push(file + ': stale authority token');
  if (!/<h1[\s>]/.test(html) || !/<h2[\s>]/.test(html)) errors.push(file + ': page/section hierarchy missing');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Stage 106/142 typography passed on ${release}: one page/section/chapter/lead hierarchy and shared reading measures are guarded across 15 EN/HU/DE templates.`);
