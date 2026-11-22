import fs from 'node:fs';
import assert from 'node:assert/strict';
const xml=fs.readFileSync('sitemap.xml','utf8');
assert.ok(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), 'missing Google image sitemap namespace');
assert.equal(xml.split('<url>').length-1,93,'preserve 93 canonical 3-language URLs');
const landingPages=["https://www.banhalmi.art/","https://www.banhalmi.art/hu/","https://www.banhalmi.art/de-at/","https://www.banhalmi.art/exhibitions/ebredes.html","https://www.banhalmi.art/hu/exhibitions/ebredes.html","https://www.banhalmi.art/de-at/exhibitions/ebredes.html"];
let count=0;
for(const page of landingPages){
 const segment=xml.split('<url><loc>'+page+'</loc>')[1]?.split('</url>')[0];
 assert.ok(segment,'missing image landing route '+page);
 const urls=segment.split('<image:loc>').slice(1).map(x=>x.split('</image:loc>')[0]);
 assert.ok(urls.length>=15,'missing image discovery entries for '+page);
 assert.ok(urls.every(x=>x.startsWith('https://www.banhalmi.art/assets/img/')),page+': unreviewed or offsite image in sitemap');
 assert.equal(new Set(urls).size,urls.length,'duplicate image URL for '+page);
 count+=urls.length;
}
assert.equal(count,224,'image sitemap photo/page coverage changed');
console.log('ART image sitemap discovery PASS: '+count+' licensed photo/page associations across six localized pages');
