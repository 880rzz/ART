import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const domain='https://www.banhalmi.art';
const canonical=[...readFileSync('sitemap.xml','utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(m=>new URL(m[1]).pathname)
  .map(p=>p.endsWith('/')?p.slice(1)+'index.html':p.slice(1));
const pages=[...canonical,'404.html','hu/404.html','de-at/404.html'];
assert.equal(new Set(pages).size,pages.length,'Canonical ART route list must be unique');
assert.equal(canonical.length,93,'Review the exact source sitemap when the route count changes');
for(const file of pages){
  const html=readFileSync(file,'utf8');
  const lang=file.startsWith('hu/')?'hu':file.startsWith('de-at/')?'de':'en';
  const spec=lang==='hu'
    ?{href:'https://www.banhalmiphotography.com/hu/kapcsolat/',text:'Kapcsolat'}
    :lang==='de'
      ?{href:'https://www.banhalmiphotography.com/de-at/kontakt/',text:'Kontakt'}
      :{href:'https://www.banhalmiphotography.com/contact/',text:'Contact'};
  const menus=[...html.matchAll(/<div id="menu"[\s\S]*?<div class="m-foot">/g)];
  assert.equal(menus.length,1,file+': menu missing or duplicated');
  const menu=menus[0][0];
  const links=[...menu.matchAll(/<a class="m-main" data-nav-role="professional-contact" href="([^"]+)" rel="noopener noreferrer">([^<]+)<\/a>/g)];
  assert.equal(links.length,1,file+': exactly one professional contact menu item');
  assert.equal(links[0][1],spec.href,file+': wrong professional contact locale or domain');
  assert.equal(links[0][2],spec.text,file+': wrong contact label');
  assert.ok(html.includes('mailto:hello@norbertbanhalmi.com'),file+': historic artist correspondence removed');
  assert.ok(!menu.includes('tel:+36')&&!menu.includes('https://wa.me/'),file+': no professional telephone/WhatsApp on ART');
}
console.log('ART professional contact navigation PASS: 93 canonical + 3 fallback routes in EN/HU/DE.');
