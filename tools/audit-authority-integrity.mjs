import fs from 'node:fs';

function fail(message) {
  console.error(`AUTHORITY INTEGRITY ERROR: ${message}`);
  process.exit(1);
}

function readJson(path) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

const PERSON_ID = 'https://www.norbertbanhalmi.com/about/';
const CENTRAL_ID = 'https://www.kozpontiszovetseg.at/#organization';
const BMI_ID = 'https://www.magyariskola.at/#school';
const VIPACH_ID = 'https://www.vipach.at/#organization';
const HIPSTUDIO_ID = 'https://www.hipstudio.hu/#organization';
const Q_PERSON = 'https://www.wikidata.org/wiki/Q56391118';
const WIKIPEDIA = 'https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert';
const ROLUNK = 'https://rolunk.at/tag/banhalmi-norbert/';

function validatePersonGraph(data, label, requireHipstudio = false) {
  const graph = asArray(data['@graph']);
  const person = graph.find((node) => node?.['@type'] === 'Person' && node?.['@id'] === PERSON_ID);
  if (!person) fail(`${label}: canonical Person node missing`);

  const sameAs = asArray(person.sameAs);
  if (!sameAs.includes(Q_PERSON)) fail(`${label}: Q56391118 missing`);
  if (!sameAs.includes(WIKIPEDIA)) fail(`${label}: Hungarian Wikipedia missing`);
  if (sameAs.includes(ROLUNK)) fail(`${label}: Rólunk.at must never be sameAs`);

  const subjectUrls = asArray(person.subjectOf).map((entry) => entry?.url || entry?.['@id']).filter(Boolean);
  if (!subjectUrls.includes(ROLUNK)) fail(`${label}: Rólunk.at must remain subjectOf/press evidence`);

  const affiliations = asArray(person.affiliation);
  const central = affiliations.find((entry) => entry?.['@id'] === CENTRAL_ID);
  const bmi = affiliations.find((entry) => entry?.['@id'] === BMI_ID);
  const vipach = affiliations.find((entry) => entry?.['@id'] === VIPACH_ID);
  if (!central || central.sameAs !== 'https://www.wikidata.org/wiki/Q141274866') fail(`${label}: Központi/Q141274866 relationship missing`);
  if (!bmi || bmi.sameAs !== 'https://www.wikidata.org/wiki/Q141274560') fail(`${label}: BMI/Q141274560 relationship missing`);
  if (!vipach || vipach.sameAs !== 'https://www.wikidata.org/wiki/Q138416887') fail(`${label}: VIPACH/Q138416887 relationship missing`);

  if (requireHipstudio) {
    const hip = affiliations.find((entry) => entry?.['@id'] === HIPSTUDIO_ID);
    if (!hip || hip.sameAs !== 'https://www.wikidata.org/wiki/Q138482177') fail(`${label}: HIPStudio/Q138482177 founder relationship missing`);
    if (!String(hip.description || '').includes('founded HIPStudio')) fail(`${label}: HIPStudio founder semantics missing`);
    if (!String(hip.description || '').includes('does not imply current ownership')) fail(`${label}: HIPStudio founder/current-ownership boundary missing`);
    const hipNode = graph.find((node) => node?.['@id'] === HIPSTUDIO_ID);
    if (!hipNode || hipNode.founder?.['@id'] !== PERSON_ID || hipNode.foundingDate !== '2006-03-15') fail(`${label}: HIPStudio node/founder/founding-date drift`);
  }

  const desc = String(central.description || '').toLowerCase();
  const voluntary = desc.includes('volunteer') || desc.includes('önkéntes');
  const noEmployment = desc.includes('do not infer employment') || desc.includes('nem munkaviszony');
  if (!voluntary || !noEmployment) fail(`${label}: Központi relationship must remain explicitly voluntary/non-employment`);

  if (person.worksFor?.['@id'] && person.worksFor['@id'] !== 'https://www.norbertbanhalmi.com/#organization') {
    fail(`${label}: worksFor may only point to the canonical BANHALMI company`);
  }
}

validatePersonGraph(readJson('person-authority.jsonld'), 'person-authority.jsonld', true);
validatePersonGraph(readJson('ecosystem-bridge.jsonld'), 'ecosystem-bridge.jsonld', false);

const bridge = readJson('ecosystem-bridge.jsonld');
const graph = asArray(bridge['@graph']);
for (const websiteId of [
  'https://www.norbertbanhalmi.com/#website',
  'https://www.banhalmi.art/#website',
  'https://blog.banhalmi.art/#website'
]) {
  if (!graph.some((node) => node?.['@id'] === websiteId)) fail(`ecosystem bridge missing ${websiteId}`);
}

const mirror = readJson('professional-llm-mirror.json');
const mirrorText = JSON.stringify(mirror);
for (const token of ['Q138482177','approximately 50 professional photographer partners/collaborators','independent professional partner/collaborator','protectedOverlay']) {
  if (!mirrorText.includes(token)) fail(`professional-llm-mirror missing ${token}`);
}

const readme = fs.readFileSync('README.md', 'utf8');
for (const token of ['person-authority.jsonld', 'Q56391118', 'Q138425941']) {
  if (!readme.includes(token)) fail(`README authority contract missing ${token}`);
}
if (!readme.toLowerCase().includes('voluntary') || !readme.toLowerCase().includes('must not be represented or inferred as employment')) {
  fail('README must preserve the voluntary/non-employment interpretation rule');
}

console.log('Authority integrity audit passed: canonical Person, HIPStudio founder history, professional mirror and cross-ecosystem relationships are stable.');
