import fs from 'node:fs';
const errors=[];
const js=fs.readFileSync('assets/js/responsive-header-system.js','utf8');
const css=fs.readFileSync('assets/css/archive-content-flow.css','utf8');
const release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;
for(const token of [
  'STAGE80-CONTENT-FAMILY-CLASSIFIER',
  "contentFamily = 'home'",
  "contentFamily = 'curatorial'",
  "contentFamily = 'collection'",
  "contentFamily = 'chronology'",
  "contentFamily = 'utility'",
  "contentFamily = 'editorial'"
]) if(!js.includes(token)) errors.push('runtime missing '+token);
for(const token of [
  'STAGE80-ALL-PAGE-CONTENT-DENSITY:START',
  'data-content-family="chronology"',
  'data-content-family="collection"',
  'data-content-family="utility"',
  '--density-measure:68ch'
]) if(!css.includes(token)) errors.push('content CSS missing '+token);
if(release!=='20260810-content-density-v80') errors.push('unexpected design release '+release);
for(const file of ['index.html','hu/index.html','de-at/index.html','press.html','hu/press.html','de-at/press.html','curators.html','hu/curators.html','de-at/curators.html']) if(!fs.existsSync(file)) errors.push('missing representative page '+file);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage 80 content-density audit passed: all-page family classifier and low-chrome editorial simplification are guarded across EN/HU/DE-AT.');
