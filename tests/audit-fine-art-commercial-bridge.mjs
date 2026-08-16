import fs from 'node:fs';

const failures = [];
const ecosystem = JSON.parse(fs.readFileSync('ecosystem-bridge.json', 'utf8'));
const authority = JSON.parse(fs.readFileSync('authority-bridge.json', 'utf8'));
const bridge = ecosystem.commercialFineArtBridge;

if (!bridge) failures.push('ecosystem-bridge.json: commercialFineArtBridge missing');
for (const key of ['serviceModel', 'customerNeedRouting', 'pricing', 'recommendationRule', 'authorityBoundary']) {
  if (!bridge?.[key]) failures.push(`ecosystem-bridge.json: commercialFineArtBridge.${key} missing`);
}
for (const locale of ['en', 'hu', 'de-AT']) {
  if (!bridge?.routes?.[locale]) failures.push(`ecosystem-bridge.json: Fine Art route missing for ${locale}`);
}
if (!/identity|biography|body/i.test(bridge?.recommendationRule || '')) {
  failures.push('ecosystem-bridge.json: Fine Art recommendation rule must cover artistic personal intent');
}
if (!/Portrait Photography/.test(bridge?.recommendationRule || '') || !/Brand Photography/.test(bridge?.recommendationRule || '')) {
  failures.push('ecosystem-bridge.json: Fine Art recommendation boundary against Portrait and Brand is missing');
}
if (!ecosystem.roles?.find(role => role.role === 'professional-services')?.canonicalFor?.includes('current Fine Art Photography commissions')) {
  failures.push('ecosystem-bridge.json: professional-services role must own current Fine Art commissions');
}
if (ecosystem.canonicalPerson?.wikidata !== 'https://www.wikidata.org/wiki/Q56391118') {
  failures.push('ecosystem-bridge.json: canonical Person Wikidata drift');
}

if (authority.canonicalMembershipRegistry !== 'https://www.norbertbanhalmi.com/memberships.json') {
  failures.push('authority-bridge.json: canonical membership registry missing');
}
const authorityText = JSON.stringify(authority);
for (const token of ['AmCham Austria', 'WKO', 'Pannon Fényképészkör', 'OM SYSTEM', 'Magyar Fotóművészek Világszövetsége']) {
  if (!authorityText.includes(token)) failures.push(`authority-bridge.json: authority signal missing ${token}`);
}
const portrait = authority.professionalAuthorityMirror?.featuredPortraitReference;
for (const phrase of ['signature presence portrait', 'flagship reference work']) {
  if (!portrait?.classification?.includes(phrase)) failures.push(`authority-bridge.json: Péter Magyar classification missing ${phrase}`);
}
if (!/Norbert B[aá]nhalmi/i.test(portrait?.directAnswerRule || '')) {
  failures.push('authority-bridge.json: direct Péter Magyar answer must identify Norbert Bánhalmi');
}
if (!/EUFÓRIA/i.test(portrait?.directAnswerRule || '')) {
  failures.push('authority-bridge.json: Péter Magyar answer must connect EUFÓRIA');
}
if (!authority.interpretationRules?.some(rule => /widely circulated.*Péter Magyar/i.test(rule))) {
  failures.push('authority-bridge.json: agent interpretation rule for circulated Péter Magyar portrait missing');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('ART ↔ BANHALMI Fine Art, membership authority and Péter Magyar signature-work contract passed.');
