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

console.log('BANHALMI ART ecosystem layer policy OK: ART remains first-layer core; connected entities remain secondary.');
