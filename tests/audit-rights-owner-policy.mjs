import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const policy = read('data/image-rights-owner-policy.json');
const CC = 'https://creativecommons.org/licenses/by-sa/4.0/';

assert.equal(policy.declarationBasis, 'first-party-owner-statement');
assert.equal(policy.copyrightHolder.name, 'Bánhalmi Norbert');
assert.ok(policy.copyrightHolder.alternateNames.includes('Norbert Banhalmi'));
assert.ok(policy.copyrightHolder.alternateNames.includes('BANHALMI'));
assert.equal(policy.perAssetHumanReviewCompleted, false,
  'A broad owner declaration cannot become a false per-image human provenance review');
assert.equal(policy.knownCommonsSourceLicenses.length, 5);
assert.equal(new Set(policy.knownCommonsSourceLicenses.map(x => x.filePage)).size, 5);
for (const source of policy.knownCommonsSourceLicenses) {
  assert.match(source.filePage, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.equal(source.license, CC, 'Do not revoke or relabel previously released CC sources');
}
assert.ok(policy.rightsPrinciples.some(s => /not the same as the rights/i.test(s)));
assert.ok(policy.rightsPrinciples.some(s => /third-party/i.test(s)));

for (const path of ['index.html', 'hu/index.html', 'de-at/index.html']) {
  const html = fs.readFileSync(path, 'utf8');
  const match = html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/);
  assert.ok(match, path + ': missing JSON-LD');
  const graph = JSON.parse(match[1])['@graph'];
  const mono = graph.find(n => n['@id'] === 'https://www.banhalmi.art/#official-monogram');
  assert.equal(mono?.license, CC, path + ': Commons monogram licence regression');
}
const metadata = read('data/image-metadata.json');
for (const record of metadata.records) {
  assert.equal(record.rights.acquireLicensePage, 'https://www.banhalmi.art/#contact',
    'ART image-rights enquiries cannot be routed through a commercial quote checkout');
}
console.log('Owner declaration, 5 Commons license exceptions and ART-only licence contact passed.');
