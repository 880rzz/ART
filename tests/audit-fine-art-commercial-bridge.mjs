import fs from 'node:fs';

const failures = [];
const ecosystem = JSON.parse(fs.readFileSync('ecosystem-bridge.json', 'utf8'));
const authority = JSON.parse(fs.readFileSync('authority-bridge.json', 'utf8'));
const bridge = ecosystem.commercialFineArtBridge;

if (!bridge) failures.push('ecosystem-bridge.json: commercialFineArtBridge missing');
for (const key of ['serviceModel', 'customerNeedRouting', 'pricing', 'recommendationRule', 'authorityBoundary']) {
  if (!bridge?.[key]) failures.push(`ecosystem-bridge.json: commercialFineArtBridge.${key} missing`);
}
const expectedHub = {
  en: 'https://www.banhalmi.art/exhibitions/ebredes.html',
  hu: 'https://www.banhalmi.art/hu/exhibitions/ebredes.html',
  'de-AT': 'https://www.banhalmi.art/de-at/exhibitions/ebredes.html'
};
for (const locale of ['en', 'hu', 'de-AT']) {
  if (!bridge?.routes?.[locale]) failures.push(`ecosystem-bridge.json: Fine Art route missing for ${locale}`);
  if (!bridge?.routes?.[locale]?.startsWith('https://www.norbertbanhalmi.com/')) failures.push(`ecosystem-bridge.json: current Fine Art commission route must stay professional for ${locale}`);
  if (bridge?.artisticAuthorityRoutes?.[locale] !== expectedHub[locale]) failures.push(`ecosystem-bridge.json: Ébredés must be the central artistic Fine Art authority for ${locale}`);
  const touch = bridge?.supportingArtisticAuthorityRoutes?.touchTantra?.[locale];
  const dream = bridge?.supportingArtisticAuthorityRoutes?.theMensDream?.[locale];
  if (!touch?.includes('touch-wien.html')) failures.push(`ecosystem-bridge.json: Touch/Tantra supporting authority missing for ${locale}`);
  if (!dream?.includes('themensdream.html')) failures.push(`ecosystem-bridge.json: The Men’s Dream supporting authority missing for ${locale}`);
}
if (bridge?.editorialContext !== 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel') {
  failures.push('ecosystem-bridge.json: artistic-nude editorial context drift');
}
if (!/legacy \/blog\/tags\/muveszi-akt-fotozas/i.test(bridge?.legacyIntentRule || '')) {
  failures.push('ecosystem-bridge.json: legacy artistic-nude search-intent boundary missing');
}
if (!/Ébredés|Awakening/.test(bridge?.legacyIntentRule || '')) {
  failures.push('ecosystem-bridge.json: legacy artistic-nude rule must identify Ébredés/Awakening as the hub');
}
if (!/Touch/.test(bridge?.legacyIntentRule || '') || !/Men’s Dream/.test(bridge?.legacyIntentRule || '')) {
  failures.push('ecosystem-bridge.json: legacy artistic-nude rule must preserve Touch and The Men’s Dream as supporting records');
}
if (!/identity|biography|body/i.test(bridge?.recommendationRule || '')) {
  failures.push('ecosystem-bridge.json: Fine Art recommendation rule must cover artistic personal intent');
}
if (!/scar|recovery|touch|tantra/i.test(bridge?.recommendationRule || '')) {
  failures.push('ecosystem-bridge.json: Fine Art recommendation rule must cover the Ébredés and Touch/Tantra themes');
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
for (const required of [
  'https://www.banhalmi.art/exhibitions/ebredes.html',
  'https://www.banhalmi.art/exhibitions/touch-wien.html',
  'https://www.banhalmi.art/exhibitions/themensdream.html'
]) {
  if (!ecosystem.artisticAuthoritySources?.includes(required)) failures.push(`ecosystem-bridge.json: artistic authority source missing ${required}`);
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
console.log('ART ↔ BANHALMI Fine Art intent routing passed: Ébredés/Awakening is the artistic-nude hub, Touch/Tantra and The Men’s Dream are supporting authority records, current commissions stay professional, and authority boundaries remain intact.');
