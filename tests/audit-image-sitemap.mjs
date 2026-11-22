import fs from 'node:fs';import assert from 'node:assert/strict';
const xml=fs.readFileSync('image-sitemap.xml','utf8');
assert.ok(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
assert.equal(xml.split('<url>').length-1,6,'exactly six eligible landing pages');
const pages=["https://www.banhalmi.art/exhibitions/ebredes.html","https://www.banhalmi.art/hu/exhibitions/ebredes.html","https://www.banhalmi.art/de-at/exhibitions/ebredes.html","https://www.banhalmi.art/","https://www.banhalmi.art/hu/","https://www.banhalmi.art/de-at/"];
let count=0;
for(const page of pages){
 const x=xml.split('<url><loc>'+page+'</loc>')[1]?.split('</url>')[0];
 assert.ok(x,'missing image landing page '+page);
 const urls=x.split('<image:loc>').slice(1).map(x=>x.split('</image:loc>')[0]);
 assert.ok(urls.length>=15,'missing rights-attributed original images '+page);
 assert.ok(urls.every(u=>u.startsWith('https://www.banhalmi.art/assets/img/')),page+': off-site photo URL');
 assert.equal(new Set(urls).size,urls.length,page+': duplicate image URL');
 count+=urls.length;
}
assert.equal(count,224,'expected 224 first-party photo/page associations');
const robots=fs.readFileSync('robots.txt','utf8');
assert.ok(robots.includes('Sitemap: https://www.banhalmi.art/image-sitemap.xml'),'image sitemap not discoverable');
assert.equal((fs.readFileSync('sitemap.xml','utf8').match(/<url>/g)||[]).length,93,'main canonical sitemap changed');
console.log('ART Google image sitemap PASS: '+count+' image/page associations, six EN/HU/DE landing pages');
