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
const redirects=JSON.parse(fs.readFileSync('redirects.json','utf8')).redirects;
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8')).redirects || [];
const nginx=fs.readFileSync('_redirects','utf8');
for(const [route,target] of Object.entries({'/norbert-banhalmi':'https://www.banhalmi.art/','/hu/norbert-banhalmi':'https://www.banhalmi.art/hu/','/de-at/norbert-banhalmi':'https://www.banhalmi.art/de-at/'})){
  assert.equal(redirects[route],target,route+': redirects registry must resolve within ART');
  assert.equal(vercel.find(r=>r.source===route)?.destination,target,route+': redirect-only Vercel rule must resolve within ART');
  assert.ok(nginx.includes(route+'  '+target+'  301'),route+': exact HTTP legacy redirect must resolve within ART');
}
console.log('ART Person aliases, redirects registry, Vercel rules and HTTP 301 mapping resolve to ART.');

