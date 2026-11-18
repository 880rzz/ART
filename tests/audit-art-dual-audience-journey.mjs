import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const periods=JSON.parse(fs.readFileSync(path.join(root,'data/archive/oeuvre-periods.json'),'utf8')).periods;
assert.equal(periods.length,5,'Five canonical oeuvre periods required');

for(const {prefix,lang} of [{prefix:'',lang:'en'},{prefix:'hu/',lang:'hu'},{prefix:'de-at/',lang:'de'}]){
 const home=fs.readFileSync(path.join(root,prefix,'index.html'),'utf8');
 const curator=fs.readFileSync(path.join(root,prefix,'curators.html'),'utf8');
 const journey=home.match(/<!-- LIFE-JOURNEY:START -->([\s\S]*?)<!-- LIFE-JOURNEY:END -->/)?.[1]??'';
 assert.ok(journey.includes('data-audience-path="public-to-curatorial"'),prefix+' public story orientation missing');
 assert.deepEqual([...journey.matchAll(/data-oeuvre-period="([^"]+)"/g)].map(x=>x[1]),periods.map(p=>p.id),prefix+' has an inconsistent oeuvre timeline');
 for(const period of periods){
  const range=typeof period.range==='string'?period.range:period.range[lang];
  assert.ok(journey.includes(period.numeral+' · '+range),prefix+' period chronology is inconsistent: '+period.id);
  assert.ok(journey.includes('href="curators.html#'+period.id+'"'),prefix+' missing deeper period path '+period.id);
  assert.ok(curator.includes('id="'+period.id+'"'),prefix+' period target absent '+period.id);
 }
 assert.ok(curator.includes('id="journey-guide" data-reader-orientation="two-level"'),prefix+' first-depth curator guide missing');
 assert.ok(curator.includes('<details class="curatorial-grid-disclosure" open>'),prefix+' public five-period story hidden by default');
 assert.ok(curator.includes('<details class="curator-research" id="curatorial-research">'),prefix+' detailed sources not available on demand');
 assert.ok(curator.includes('href="#curatorial-research"'),prefix+' explicit researcher path missing');
 assert.ok(curator.indexOf('id="journey-guide"')<curator.indexOf('id="curatorial-periods"'),prefix+' story guide should precede chronology');
 assert.ok(curator.indexOf('id="curatorial-periods"')<curator.indexOf('id="collectors"'),prefix+' collection enquiry must follow artistic story');
 assert.ok(curator.indexOf('id="curatorial-periods"')<curator.indexOf('data-source-hub="2026"'),prefix+' sources must follow the visible period narrative');
 assert.ok(curator.indexOf('data-source-hub="2026"')<curator.indexOf('id="collectors"'),prefix+' collector enquiry must follow the research/source context');
 for(const area of ['books','exhibitions']){
  const dir=path.join(root,prefix,area);
  for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))){
   const html=fs.readFileSync(path.join(dir,file),'utf8');
   if(/<meta[^>]+http-equiv=["']refresh["']/i.test(html))continue;
   if(!html.includes('class="record-depth"'))continue;
   assert.ok(/<h1\b/.test(html),prefix+area+'/'+file+': no work identity');
   assert.ok(html.includes('curators.html'),prefix+area+'/'+file+': no path to curator context');
   assert.ok(html.includes('#journey'),prefix+area+'/'+file+': no return to public life story');
  }
 }
}
console.log('ART dual audience: five sourced periods, plain-language entry, research depth and linked artwork records across EN/HU/DE.');
