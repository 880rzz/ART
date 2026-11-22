import fs from 'node:fs';import assert from 'node:assert/strict';
const xml=fs.readFileSync('sitemap.xml','utf8');
assert.match(xml,/xmlns:image="http:\/\/www\\.google\\.com\/schemas\/sitemap-image\/1\\.1"/);
assert.equal((xml.match(/<url>/g)||[]).length,93,'preserve 93 canonical 3-language URLs');
let count=0;for(const page of ["https://www.banhalmi.art/","https://www.banhalmi.art/hu/","https://www.banhalmi.art/de-at/","https://www.banhalmi.art/exhibitions/ebredes.html","https://www.banhalmi.art/hu/exhibitions/ebredes.html","https://www.banhalmi.art/de-at/exhibitions/ebredes.html"]){
 const esc=page.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const segment=xml.match(new RegExp('<url><loc>'+esc+'<\\/loc>([\\s\\S]*?)<\\/url>'))?.[1];
 assert.ok(segment,'missing image landing route '+page);
 const urls=[...segment.matchAll(/<image:loc>(https:\/\/www\\.banhalmi\\.art\/assets\/img\/[^<]+)<\\/image:loc>/g)].map(x=>x[1]);
 assert.ok(urls.length>=15,'missing image discovery entries for '+page);
 assert.equal(new Set(urls).size,urls.length,'duplicate image URL for '+page);
 count+=urls.length;
}
assert.ok(count>=200,'image sitemap registry incomplete');
console.log('ART image sitemap discovery PASS: '+count+' rights-attributed photo/page associations across 6 localized pages');
