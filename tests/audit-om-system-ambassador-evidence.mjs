import fs from 'node:fs';
import assert from 'node:assert/strict';
const pages=["index.html","hu/index.html","de-at/index.html"];
const event='https://omsystemshop.hu/om-system-day';
const facebook='https://www.facebook.com/photo/?fbid=1702434115222332&amp;set=a.529355062530249';
for (const path of pages) {
  const html=fs.readFileSync(path,'utf8');
  assert.equal((html.match(/class="om-system-evidence"/g)||[]).length,1,path+' evidence block count');
  assert.ok(html.includes(event),path+' official event link');
  assert.ok(html.includes(facebook),path+' official Facebook evidence');
  assert.ok(html.includes('OM SYSTEM'),path+' ambassador label');
  assert.ok(html.includes('rel="canonical"'),path+' canonical retained');
  assert.ok(html.includes('hreflang='),path+' hreflang retained');
  assert.ok(html.includes('property="og:site_name" content="BANHALMI ART"'),path+' artistic archive site name');
}
console.log('OM SYSTEM ambassador evidence and brand identity checks passed');
