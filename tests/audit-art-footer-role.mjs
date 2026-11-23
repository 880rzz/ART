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
 assert.ok(!/<a\b[^>]*href=["']tel:/i.test(footer),path+': ART footer must not offer a phone conversion');
 assert.ok(!/<nav\b[^>]*class=["']banhalmi-ecosystem["']/i.test(footer),path+': old standalone editorial promotional footer tier');
 const fineprint=footer.match(/<p\b[^>]*class=["'][^"']*\bfineprint\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i)?.[0]||'';
 assert.ok(fineprint,path+': legal and GDPR footer missing');
 const pair=fineprint.match(/<span class="footer-imprint-editorial">([\s\S]*?<\/a>)<\/span>/i)?.[1]||'';
 assert.ok(pair,path+': Imprint and photography history must share one legal row');
 const lang=path.startsWith('hu/')?'hu':path.startsWith('de-at/')?'de':'en';
 const imprint=lang==='hu'?'/hu/impresszum/':lang==='de'?'/de-at/impressum/':'/impressum/';
 const imprintAt=pair.indexOf('https://www.banhalmiphotography.com'+imprint);
 const historyHref=lang==='hu'?'https://blog.banhalmi.art/':lang==='de'?'https://blog.banhalmi.art/de/':'https://blog.banhalmi.art/en/';
 const historyAt=pair.indexOf(`href="${historyHref}"`);
 assert.ok(imprintAt>=0&&historyAt>imprintAt&&!/<br\b/i.test(pair.slice(imprintAt,historyAt)),path+': legal/editorial link order or row broken');
 assert.equal([...footer.matchAll(/href=["']https:\/\/blog\.banhalmi\.art\/(?:en\/|de\/)?["']/g)].length,1,path+': exactly one language-matched editorial archive link required');
 assert.ok(/\/privacy-policy\/|\/adatvedelem\/|\/datenschutz\//i.test(fineprint),path+': privacy link missing');
 assert.ok(/mailto:hello@norbertbanhalmi\.com/i.test(footer),path+': direct artistic correspondence email');
}
console.log('ART footer role passed on 96 pages: art-only email, adjacent Imprint + photography history, legal/privacy intact.');
