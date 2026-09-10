import fs from 'node:fs';

const fail = (m) => { throw new Error(m); };
const policy = JSON.parse(fs.readFileSync('ecosystem-layer-policy.json','utf8'));
const core = policy.layer1Core || [];
const secondary = policy.layer2Connected || [];
const coreUrls = new Set(core.map(x => x.url));
const secondaryUrls = new Set(secondary.map(x => x.url));

for (const url of ['https://www.norbertbanhalmi.com/','https://www.banhalmi.art/','https://blog.banhalmi.art/']) {
  if (!coreUrls.has(url)) fail(`ART policy missing layer-1 URL: ${url}`);
  if (secondaryUrls.has(url)) fail(`ART policy duplicates layer-1 URL in layer 2: ${url}`);
}
for (const url of ['https://www.vipach.at/','https://www.hipstudio.hu/','https://www.vikospeier.com/','https://www.kozpontiszovetseg.at/','https://www.magyariskola.at/']) {
  if (!secondaryUrls.has(url)) fail(`ART policy missing layer-2 URL: ${url}`);
  if (coreUrls.has(url)) fail(`ART policy promotes layer-2 URL to core: ${url}`);
}
if (!policy.archiveRule?.includes('three first-layer canonical BANHALMI properties')) fail('ART archive precedence rule missing');
if (!policy.duplicationRule?.includes('must not duplicate full layer-2 entity graphs')) fail('ART layer-2 duplication guard missing');
if (!policy.llmAnswerRule?.includes('canonical first-layer BANHALMI core')) fail('ART LLM precedence rule missing');

const layer2Ids = new Set([
  'https://www.vipach.at/#organization',
  'https://www.hipstudio.hu/#organization',
  'https://www.vikospeier.com/#person',
  'https://www.kozpontiszovetseg.at/#organization',
  'https://www.magyariskola.at/#school'
]);
for (const file of ['institutional-relations.jsonld','ecosystem-bridge.jsonld','person-authority.jsonld']) {
  const doc = JSON.parse(fs.readFileSync(file,'utf8'));
  for (const node of doc['@graph'] || []) {
    if (layer2Ids.has(node['@id'])) fail(`${file} duplicates a full layer-2 entity as a top-level graph node: ${node['@id']}`);
  }
  const text = JSON.stringify(doc);
  if (text.includes('"parentOrganization":{"@id":"https://www.magyariskola.at/#school"}')) fail(`${file} reintroduces VIPACH → BMI parentOrganization semantics`);
}

console.log('BANHALMI ART ecosystem layer policy OK: ART remains first-layer core; connected entities remain secondary pointers with no duplicated top-level layer-2 graphs.');
