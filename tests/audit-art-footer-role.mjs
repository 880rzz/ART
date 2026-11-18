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
 const copyright=footer.match(/<p\\b[^>]*class=["']fineprint["'][^>]*>([\\s\\S]*?)<\\/p>/i)?.[1]||'';
 const grouped=copyright.includes('<span class="footer-imprint-editorial">');
 assert.ok(grouped,path+': photography-history archive must share the Imprint legal row');
 const lang=path.startsWith('hu/')?'hu':path.startsWith('de-at/')?'de':'en';
 const imprintUrl=lang==='hu'?'https://www.banhalmiphotography.com/hu/impresszum/':lang==='de'?'https://www.banhalmiphotography.com/de-at/impressum/':'https://www.banhalmiphotography.com/impressum/';
 const a=copyright.indexOf('href="'+imprintUrl+'"');
 const b=copyright.indexOf('href="https://blog.banhalmi.art/"');
 assert.ok(a>=0&&b>a&&copyright.slice(a,b).indexOf('<br')===-1,path+': Imprint and photohistory must be adjacent on the same legal line');
 assert.equal([...footer.matchAll(/href=["']https:\\/\\/blog\\.banhalmi\\.art\\/["']/g)].length,1,path+': exactly one crawlable editorial blog link');
 assert.ok(!/<nav\\b[^>]*class=["']banhalmi-ecosystem["']/i.test(footer),path+': old standalone footer blog tier still exists');
 assert.ok(/https:\\/\\/www\\.banhalmiphotography\\.com\\//.test(copyright),path+': original legal links lost');
 assert.ok(/mailto:hello@norbertbanhalmi\.com/i.test(footer),path+': direct artistic correspondence email');
}
console.log('ART footer role passed on 96 public pages: no commercial phone or checkout navigation.');
