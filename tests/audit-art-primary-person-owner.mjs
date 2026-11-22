import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// This contract intentionally does not create a second real-world person.
// Q56391118 is the stable external identity; BANHALMI ART owns the
// Person ID and oeuvre; BANHALMI Professional owns the Organization/Brand.
const ART_PERSON = 'https://www.banhalmi.art/#about';
const LEGACY_PERSON = 'https://www.banhalmiphotography.com/about/';
const PROFESSIONAL_ORG = 'https://www.banhalmiphotography.com/#organization';
const WIKIDATA = 'https://www.wikidata.org/wiki/Q56391118';

const personGraph = JSON.parse(fs.readFileSync('person-authority.jsonld','utf8'))['@graph'];
const person = personGraph.find(n => n['@type'] === 'Person');
assert.equal(person?.['@id'], ART_PERSON, 'ART must own canonical artistic Person ID');
assert.equal(person?.url, ART_PERSON, 'ART Person URL should be the actual art biography anchor');
assert.ok(person?.sameAs?.includes(WIKIDATA), 'Person continuity must retain Wikidata Q56391118');
assert.ok(personGraph.find(n => n['@type'] === 'Organization' && n['@id'] === PROFESSIONAL_ORG),
  'Professional business must retain its separate Organization ID');
assert.equal(personGraph.filter(n => n['@type'] === 'Person' && n.name?.includes('Bánhalmi')).length, 1,
  'Do not fork the same human into duplicate Person nodes');

const sitemap = fs.readFileSync('sitemap.xml','utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const ids = new Set();
let canonicalPersonDefinitions = 0;
for(const url of urls) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const rel = pathname === '/' ? 'index.html' : pathname.endsWith('/') ? pathname.slice(1)+'index.html' : pathname.slice(1);
  const html = fs.readFileSync(path.join(process.cwd(),rel),'utf8');
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for(const block of blocks){
    const data = JSON.parse(block[1]);
    const nodes = data['@graph'] || [data];
    for(const node of nodes){
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if(types.includes('Person') && /Bánhalmi|Banhalmi/i.test(String(node.name||''))) {
        assert.equal(node['@id'],ART_PERSON,rel+': no competing primary Person IDs');
        assert.ok((node.sameAs||[]).includes(WIKIDATA),rel+': must retain Wikidata identity');
        assert.notEqual(node.url,LEGACY_PERSON,rel+': professional biography is not ART Person URL');
        canonicalPersonDefinitions++;
        ids.add(node['@id']);
      }
    }
  }
}
assert.deepEqual([...ids],[ART_PERSON], 'Exactly one ART-owned human Person ID across localized published pages');
assert.ok(canonicalPersonDefinitions >= 75, 'Expected historic Person definitions across artistic archive pages');
const contract = JSON.parse(fs.readFileSync('entity-identity-contract.json','utf8'));
assert.equal(contract.canonicalPerson['@id'],ART_PERSON);
assert.equal(contract.canonicalOrganization['@id'],PROFESSIONAL_ORG);
assert.equal(JSON.parse(fs.readFileSync('data/machine-core.json','utf8')).person.id,ART_PERSON);
console.log('ART primary Person authority PASS: '+urls.length+' sitemap URLs, '+canonicalPersonDefinitions+' Person nodes, Wikidata continuity and business-role separation');
