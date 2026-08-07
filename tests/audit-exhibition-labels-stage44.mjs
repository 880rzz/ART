import fs from 'node:fs';

const runtime=fs.readFileSync('assets/js/hero-hover-video.js','utf8');
const required=[
  `querySelectorAll('a[href$="exhibitions/ebredes.html"]')`,
  `year.textContent='2017 -'`,
  `'A valóság hamis arcai'`,
  `'Die falschen Gesichter der Wirklichkeit'`,
  `'The False Faces of Reality'`,
  `querySelectorAll('a[href$="exhibitions/avalosag.html"]')`
];
for(const marker of required){
  if(!runtime.includes(marker)) throw new Error(`Missing multilingual exhibition label guard: ${marker}`);
}

for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('/assets/js/hero-hover-video.js')) throw new Error(`${file}: shared runtime label guard is not loaded`);
  if(!html.includes('exhibitions/ebredes.html')) throw new Error(`${file}: Awakening exhibition link missing`);
  if(!html.includes('exhibitions/avalosag.html')) throw new Error(`${file}: False Faces exhibition link missing`);
}

console.log('ART multilingual exhibition label runtime guard passed.');
