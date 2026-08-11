import fs from 'node:fs';

const css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');
const release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;
const errors=[];
for(const token of [
  'STAGE104-SINGLE-EDITORIAL-AXIS:START',
  'width:min(100%,72ch)!important',
  '.curatorial-periods__intro,.life-journey__intro',
  'margin-inline:auto!important',
  'text-align:left!important',
  'Full-width disclosure controls remain a separate functional row'
]) if(!css.includes(token)) errors.push('single editorial axis CSS missing '+token);

for(const file of ['curators.html','hu/curators.html','de-at/curators.html']){
  const html=fs.readFileSync(file,'utf8');
  const intros=(html.match(/class="curatorial-periods__intro"/g)||[]).length;
  if(intros<3) errors.push(`${file}: expected at least three curatorial introductions, found ${intros}`);
  if(!html.includes('class="intro life-journey__intro"')) errors.push(`${file}: life-journey introduction missing`);
  if(!html.includes('homepage-two-tone-authority.css?v='+release)) errors.push(`${file}: stale authority release`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Stage 104 single editorial axis audit passed on ${release}: curator section labels, titles and introductions share one centred left-aligned reading column in EN/HU/DE.`);
