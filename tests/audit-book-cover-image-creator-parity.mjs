import fs from 'node:fs';
import assert from 'node:assert/strict';

const slugs=['anovilaga','ebredes','menopauza-szexi','meses-konyv','szosszenetek'];
const languages=['','hu/','de-at/'];
const canonicalPerson='https://www.banhalmi.art/#about';
let audited=0;

for(const locale of languages){
 for(const slug of slugs){
  const path=locale+'books/book-'+slug+'.html';
  const s=fs.readFileSync(path,'utf8');
  const m=s.match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
  assert.ok(m,path+': missing JSON-LD');
  const graph=JSON.parse(m[1])['@graph'];
  const book=graph.find(v=>v['@type']==='Book');
  assert.ok(book,path+': missing Book');
  const image=graph.find(v=>v['@type']==='ImageObject' && v['@id']===book.image?.['@id']);
  assert.ok(image,path+': cover ImageObject must link from Book.image');
  assert.ok(image.contentUrl?.startsWith('https://www.banhalmi.art/assets/img/books/'),
    path+': cover contentUrl must point to actual book image');
  assert.ok(image.creator?.name || image.creator?.['@id'],
    path+': Google image metadata creator missing');
  assert.ok(image.creditText&&image.copyrightNotice,
    path+': cover needs explicit published attribution and rights notice');

  if(slug==='menopauza-szexi'){
   assert.equal(image.creator.name,'PearlyArt – Jung Gyöngyi',
     path+': independent cover designer must never be replaced with BANHALMI');
   assert.ok(!image.license,path+': do not invent publisher cover open license');
  }else if(slug==='meses-konyv'){
   assert.equal(image.creator['@id'],canonicalPerson);
   assert.match(image.creator.description,/individual composite cover designer is not independently documented/);
   assert.match(image.copyrightNotice,/respective cover rights holders/);
   assert.ok(!image.license,path+': no documented open licensing for composite cover');
   assert.equal(book.publisher.name,'newkids');
   assert.deepEqual(book.author.map(a=>a.name),['Hayden Moore','Carol Souya','Becca Prior']);
   assert.deepEqual(book.contributor,[{'@id':canonicalPerson}],
     path+': book photography is a contributor role, not literary authorship');
  }else{
   assert.equal(image.creator['@id'],canonicalPerson,
     path+': original BANHALMI photographic book art creator drift');
  }
  audited++;
 }
}
assert.equal(audited,15);
console.log('All 15 original book cover ImageObjects retain Google creator and scoped third-party license/author boundaries.');
