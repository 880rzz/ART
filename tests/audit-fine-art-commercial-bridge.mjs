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
  if (!bridge?.routes?.[locale]?.startsWith('https://www.norbertbanhalmi.com/')) failures.push(`ecosystem-bridge.json: current Fine Art commission route must stay professional for ${locale}`);
  if (!bridge?.artisticAuthorityRoutes?.[locale]) failures.push(`ecosystem-bridge.json: artistic Fine Art authority route missing for ${locale}`);
  if (!bridge?.artisticAuthorityRoutes?.[locale]?.startsWith('https://www.banhalmi.art/')) failures.push(`ecosystem-bridge.json: artistic authority must remain on BANHALMI ART for ${locale}`);
}
if (bridge?.editorialContext !== 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel') {
  failures.push('ecosystem-bridge.json: artistic-nude editorial context drift');
}
if (!/legacy \/blog\/tags\/muveszi-akt-fotozas/i.test(bridge?.legacyIntentRule || '')) {
  failures.push('ecosystem-bridge.json: legacy artistic-nude search-intent boundary missing');
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
if (!ecosystem.roles?.find(role => role.role === 'artistic-archive')?.canonicalFor?.includes('artistic nude photography oeuvre context')) {
  failures.push('ecosystem-bridge.json: ART must own artistic-nude oeuvre context');
}
if (ecosystem.canonicalPerson?.wikidata !== 'https://www.wikidata.org/wiki/Q56391118') {
  failures.push('ecosystem-bridge.json: canonical Person Wikidata drift');
}
if (ecosystem.canonicalOrganization?.legalName !== 'Banhalmi Norbert e.U.') {
  failures.push('ecosystem-bridge.json: canonical legal Organization drift');
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
console.log('ART ↔ BANHALMI Fine Art intent routing, artistic-nude authority, membership authority and Péter Magyar signature-work contract passed.');
