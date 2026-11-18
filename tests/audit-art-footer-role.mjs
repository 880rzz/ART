import assert from 'node:assert/strict';
import fs from 'node:fs';
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const paths=[...sitemap.matchAll(/<loc>https:\/\/www\.banhalmi\.art\/([^<]*)<\/loc>/g)].map(m=>!m[1]?'index.html':m[1].endsWith('/')?m[1]+'index.html':m[1]);
paths.push('404.html','hu/404.html','de-at/404.html');
assert.equal(paths.length,96,'93 public ART routes and three localized 404 pages');
for(const path of paths){
 const html=fs.readFileSync(path,'utf8');
 const footer=html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)?.[1]||'';
 assert.ok(footer,path+': missing footer');
 assert.ok(!/Studio enquiries|Megkeresés stúdiómunkára|Anfragen zu Atelier|print sales|printek vásárlására/i.test(footer),path+': commercial footer text');
 assert.ok(!/<a\b[^>]*href=["']tel:/i.test(footer),path+': ART footer must be discreet artistic email');
 const eco=footer.match(/<nav\s+class=["']banhalmi-ecosystem["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1]||'';
 const links=[...eco.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m=>m[1]);
 assert.deepEqual(links,['https://blog.banhalmi.art/'],path+': editorial archive only, no Professional sales links');
 assert.ok(/mailto:hello@norbertbanhalmi\.com/i.test(footer),path+': direct artistic correspondence email');
}
console.log('ART footer role passed on 96 public pages: no commercial phone or checkout navigation.');
