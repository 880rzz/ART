import fs from 'node:fs';

const failures = [];
const ecosystem = JSON.parse(fs.readFileSync('ecosystem-bridge.json', 'utf8'));
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

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('ART → BANHALMI Fine Art commercial bridge contract passed.');
