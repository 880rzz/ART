import fs from 'node:fs';
import assert from 'node:assert/strict';
const CC = 'https://creativecommons.org/licenses/by-sa/4.0/';
const names = ['peter','azahriah','fellegi','bence'];
const check = (obj, source, expected) => {
 const hits = [];
 const walk = value => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach(walk);
  if (names.some(name => value['@id']?.endsWith('#work-' + name)) && String(value.contentUrl||'').startsWith('https://upload.wikimedia.org/wikipedia/commons/')) {
    assert.equal(value.license,CC,source + ': verified Commons license not preserved');
    assert.ok(value.creator && value.copyrightHolder && value.creditText,source + ': attribution missing');
    hits.push(value['@id'].split('#').pop());
  }
  Object.values(value).forEach(walk);
 };
 walk(obj);
 assert.deepEqual([...new Set(hits)].sort(),expected.map(n=>'work-'+n).sort(),source + ': tracked Commons works missing');
};
for (const p of ['exhibitions/euforia.html','hu/exhibitions/euforia.html','de-at/exhibitions/euforia.html']) {
 const s = fs.readFileSync(p,'utf8');
 const x = s.match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
 assert.ok(x,p+': JSON-LD missing');
 check(JSON.parse(x[1]),p,names);
}
check(JSON.parse(fs.readFileSync('data/image-knowledge-graph.jsonld','utf8')),'knowledge graph',['peter','fellegi','bence']);
const p = JSON.parse(fs.readFileSync('data/euforia-peter-magyar-provenance.json','utf8'));
assert.equal(p.work.license,CC);
console.log('Four EUFÓRIA Commons image licenses preserved in EN/HU/DE; provenance parity passed');
