import assert from 'node:assert/strict';
import fs from 'node:fs';

const cases={
  'norbert-banhalmi/index.html':'https://www.banhalmi.art/',
  'about/norbert-banhalmi/index.html':'https://www.banhalmi.art/',
  'hu/norbert-banhalmi/index.html':'https://www.banhalmi.art/hu/',
  'hu/rolam/banhalmi-norbert/index.html':'https://www.banhalmi.art/hu/',
  'de-at/norbert-banhalmi/index.html':'https://www.banhalmi.art/de-at/',
  'de/ueber-mich/norbert-banhalmi/index.html':'https://www.banhalmi.art/de-at/'
};
for(const [path,target] of Object.entries(cases)){
  const html=fs.readFileSync(path,'utf8');
  assert.match(html,/<meta\s+http-equiv=["']refresh["']/i,path+': legacy redirect missing');
  assert.ok(html.includes('rel="canonical" href="'+target+'"'),path+': ART Person alias must retain ART canonical');
  assert.ok(html.includes(target),path+': ART destination missing');
  assert.ok(!html.includes('https://www.banhalmiphotography.com/'),path+': personal art alias must not send users to Professional');
}
console.log('ART six Person aliases resolve to ART person/oeuvre content in EN/HU/DE; no commercial destination.');
