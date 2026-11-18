import assert from 'node:assert/strict';
import fs from 'node:fs';
const ecosystem=JSON.parse(fs.readFileSync('ecosystem-bridge.json','utf8'));
const authority=JSON.parse(fs.readFileSync('authority-bridge.json','utf8'));
const bridge=ecosystem.artisticJourneyBridge;
assert.ok(bridge,'art-only journey source missing');
assert.ok(!('commercialFineArtBridge' in ecosystem),'legacy sales bridge remains public');
for(const key of ['serviceModel','customerNeedRouting','pricing','legacyProfessionalRoutes','professionalHandoff']){
 assert.ok(!(key in bridge),key+': professional funnel in ART');
}
assert.ok(!bridge.visitorThemes?.professionalHandoff,'Professional Fine Art handoff returned');
const expected={
 en:'https://www.banhalmi.art/exhibitions/ebredes.html',
 hu:'https://www.banhalmi.art/hu/exhibitions/ebredes.html',
 'de-AT':'https://www.banhalmi.art/de-at/exhibitions/ebredes.html'
};
for(const locale of Object.keys(expected)){
 assert.equal(bridge.artisticAuthorityRoutes[locale],expected[locale],locale+': Ébredés hub missing');
 assert.ok(bridge.routes[locale].startsWith('https://www.banhalmi.art/'),locale+': outside art archive');
 assert.ok(bridge.supportingArtisticAuthorityRoutes.touchTantra[locale]?.includes('touch-wien.html'),locale+': Touch source lost');
 assert.ok(bridge.supportingArtisticAuthorityRoutes.theMensDream[locale]?.includes('themensdream.html'),locale+': The Men’s Dream source lost');
}
assert.ok(ecosystem.roles.find(x=>x.role==='artistic-archive')?.canonicalFor?.includes('artwork provenance and source documentation'),'work provenance lost');
assert.equal(ecosystem.canonicalPerson.wikidata,'https://www.wikidata.org/wiki/Q56391118');
assert.equal(ecosystem.canonicalOrganization.legalName,'Banhalmi Norbert e.U.');
assert.ok(authority.artisticAuthority.institutionalValidation.some(x=>/OM SYSTEM/i.test(x.name)),'photographic art source missing');
assert.ok(JSON.stringify(authority).includes('AmCham Austria'),'documented AmCham achievement/history must be preserved, not sold');
assert.ok(JSON.stringify(authority).includes('Pannon Fényképészkör'),'artistic affiliation lost');
assert.ok(bridge.editorialContext.startsWith('https://blog.banhalmi.art/'),'editorial research route missing');
assert.doesNotMatch(JSON.stringify(bridge),/banhalmiphotography\.com\/[^"\s]*#(?:service|professional-portfolio|request-quote)/i,'professional sales edge in artistic bridge');
console.log('ART artistic journey passed: Ébredés central, 3L source routes, AmCham/source credit preserved, no professional quote or collector sales bridge.');
