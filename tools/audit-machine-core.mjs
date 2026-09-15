import fs from 'node:fs';

const core = JSON.parse(fs.readFileSync('data/machine-core.json', 'utf8'));
const errors = [];
const fail = (condition, message) => { if (!condition) errors.push(message); };

fail(core.canonicalId === 'https://www.banhalmi.art/data/machine-core.json', 'ART canonical machine core URL drift');
fail(core.archive?.name === 'BANHALMI ART', 'ART archive identity drift');
fail(core.person?.wikidata === 'https://www.wikidata.org/wiki/Q56391118', 'Canonical Person Wikidata drift');
fail(core.person?.primaryProfessionalIdentity?.includes('photography business'), 'Primary professional identity must remain photography-first');
fail((core.archive?.artisticSpecialisms || []).includes('Fine art photography'), 'Fine art photography artistic specialism drift');
fail((core.archive?.artisticSpecialisms || []).includes('Artistic nude photography'), 'Artistic nude photography specialism drift');

const org = core.professionalIdentityMirror?.organization;
const brand = core.professionalIdentityMirror?.brand;
fail(org?.id === 'https://www.norbertbanhalmi.com/#organization', 'Canonical professional Organization @id drift');
fail(org?.name === 'Banhalmi Norbert e.U.', 'Canonical legal Organization name must be Banhalmi Norbert e.U.');
fail(org?.legalName === 'Banhalmi Norbert e.U.', 'Canonical legalName must be Banhalmi Norbert e.U.');
fail(org?.wikidata === 'https://www.wikidata.org/wiki/Q138425941', 'Canonical Organization Wikidata drift');
fail(brand?.id === 'https://www.norbertbanhalmi.com/#brand', 'Canonical BANHALMI Brand @id drift');
fail(brand?.name === 'BANHALMI', 'Primary Brand must remain BANHALMI');
fail(brand?.alternateName === 'BANHALMI Photography', 'Secondary photography-facing brand name drift');
fail(brand?.positioning === 'Photography Team', 'Canonical team descriptor must remain Photography Team');
fail(!JSON.stringify(core).includes('"positioning":"Professional Photography Team"'), 'Retired Professional Photography Team positioning reintroduced into canonical core');

fail(core.professionalMirror?.canonicalMachineCore === 'https://www.norbertbanhalmi.com/data/machine-core.json', 'Professional canonical machine source drift');
fail(core.professionalMirror?.volunteerBoundary?.includes('voluntary social/community work'), 'Volunteer social-work boundary missing from ART mirror');
fail(core.professionalMirror?.volunteerBoundary?.includes('not employment'), 'Volunteer role must explicitly exclude employment');
fail(core.professionalMirror?.independentRoleEvidence === 'https://rolunk.at/tag/banhalmi-norbert/', 'Independent role evidence URL drift');
fail(core.schemaPolicy?.homepageImageGalleryRepresentativeLimit >= 6 && core.schemaPolicy?.homepageImageGalleryRepresentativeLimit <= 12, 'Homepage ImageGallery representative limit must remain between 6 and 12');
fail(core.dataMinimisation?.staffContactRule?.includes('Do not publish collaborator'), 'Staff-contact minimisation rule missing');
fail((core.derivedOutputs || []).includes('/llms.txt'), 'llms.txt must remain a generated ART projection');
fail((core.derivedOutputs || []).includes('/ai.txt'), 'ai.txt must remain a generated ART projection');
fail(core.evidence?.imageKnowledgeGraph === 'https://www.banhalmi.art/data/image-knowledge-graph.jsonld', 'Image knowledge graph authority drift');
for (const pillar of ['experience','expertise','authoritativeness','trust','crossLayerBalance']) {
  fail(typeof core.eeatPolicy?.[pillar] === 'string' && core.eeatPolicy[pillar].length > 40, `E-E-A-T policy missing or too weak: ${pillar}`);
}

const artisticIntent = core.artisticIntentProjection;
fail(artisticIntent?.editorialContext === 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel', 'Artistic nude editorial context drift');
fail(artisticIntent?.legacyTagPath === '/blog/tags/muveszi-akt-fotozas', 'Legacy artistic-nude tag path drift');
const primaryPaths = {
  en: 'exhibitions/ebredes.html',
  'hu-HU': 'hu/exhibitions/ebredes.html',
  'de-AT': 'de-at/exhibitions/ebredes.html'
};
for (const locale of ['en','hu-HU','de-AT']) {
  const page = artisticIntent?.authorityPages?.[locale];
  fail(page?.path === primaryPaths[locale], `Ébredés must remain the central artistic-nude authority for ${locale}`);
  fail(page?.url?.startsWith('https://www.banhalmi.art/'), `Artistic authority must remain on BANHALMI ART for ${locale}`);
  fail(typeof page?.metaDescription === 'string' && page.metaDescription.length >= 100, `Central artistic intent meta description missing/weak for ${locale}`);
  fail(artisticIntent?.currentCommissionRoutes?.[locale]?.startsWith('https://www.norbertbanhalmi.com/'), `Current Fine Art commission route must remain professional for ${locale}`);
}
const touch = artisticIntent?.supportingAuthorityPages?.['touch-tantra'];
const dream = artisticIntent?.supportingAuthorityPages?.['the-mens-dream'];
for (const locale of ['en','hu-HU','de-AT']) {
  fail(touch?.[locale]?.path?.includes('touch-wien.html'), `Touch/Tantra supporting authority missing for ${locale}`);
  fail(typeof touch?.[locale]?.metaDescription === 'string' && /tantra/i.test(touch[locale].metaDescription), `Touch/Tantra metadata must explicitly preserve tantra context for ${locale}`);
  fail(dream?.[locale]?.path?.includes('themensdream.html'), `The Men’s Dream supporting authority missing for ${locale}`);
}
fail(core.evidence?.artisticNudeAuthority === 'https://www.banhalmi.art/exhibitions/ebredes.html', 'Ébredés artistic authority evidence drift');
fail((core.evidence?.artisticNudeRelated || []).includes('https://www.banhalmi.art/exhibitions/touch-wien.html'), 'Touch/Tantra related artistic authority evidence missing');
fail((core.evidence?.artisticNudeRelated || []).includes('https://www.banhalmi.art/exhibitions/themensdream.html'), 'The Men’s Dream related artistic authority evidence missing');
fail(core.archiveRoutes?.artisticNude === 'https://www.banhalmi.art/exhibitions/ebredes.html', 'Ébredés artistic nude archive route drift');
fail(/Ébredés|Awakening/.test(artisticIntent?.authorityModel || ''), 'Artistic authority model must name Ébredés/Awakening as the hub');
fail(/Touch Vienna|Touch/.test(artisticIntent?.authorityModel || '') && /Men’s Dream/.test(artisticIntent?.authorityModel || ''), 'Artistic authority model must name Touch and The Men’s Dream as supporting records');

const sourceLlms = fs.readFileSync('llms.txt', 'utf8');
const hardener = fs.readFileSync('scripts/harden-machine-layer.mjs', 'utf8');
const productionHardener = fs.readFileSync('scripts/harden-production-artifact.mjs', 'utf8');
for (const forbidden of ['viko@banhalmi.at']) {
  fail(!JSON.stringify(core).includes(forbidden), `Unnecessary collaborator contact leaked into canonical ART core: ${forbidden}`);
  fail(!sourceLlms.includes(forbidden), `Unnecessary collaborator contact leaked into source llms.txt: ${forbidden}`);
  fail(!hardener.includes(`Viko Speier e-mail: ${forbidden}`), `Generated ART LLM template reintroduces collaborator contact: ${forbidden}`);
}
fail(hardener.includes('homepageImageGalleryRepresentativeLimit'), 'Machine hardener must consume the canonical representative gallery limit');
fail(hardener.includes('artisticSpecialisms'), 'Machine hardener must consume canonical artistic specialisms');
fail(hardener.includes('volunteerBoundary'), 'Machine hardener must project volunteer role boundaries');
fail(hardener.includes('professionalIdentityMirror'), 'Machine hardener must consume canonical professional identity mirror');
fail(hardener.includes('refuses to mutate the source repository'), 'Machine hardener must refuse source-repository mutation');
fail(productionHardener.includes('projectCanonicalIdentity'), 'Production hardener must project the canonical legal identity across the immutable artifact');
fail(productionHardener.includes('applyArtisticIntentProjection'), 'Production hardener must project artistic search intent from canonical machine core');
fail(productionHardener.includes('artisticIntentProjection'), 'Production hardener must consume the canonical artistic intent projection');
fail(productionHardener.includes('central artistic-nude authority must remain Ébredés'), 'Production hardener must fail closed if Ébredés stops being the artistic-nude hub');
fail(productionHardener.includes('Touch/Tantra supporting authority drift'), 'Production hardener must protect Touch/Tantra supporting authority');
fail(productionHardener.includes('data-artistic-nude-cluster'), 'Production hardener must project visible internal-link cluster navigation');
fail(productionHardener.includes('retired legal identity survived production projection'), 'Production hardener must fail closed if the retired legal identity survives');

const robots = fs.readFileSync('robots.txt', 'utf8');
fail(robots.includes('# AI / LLM machine entry points'), 'robots.txt AI/LLM discovery comment heading missing');
fail(robots.includes('# https://www.banhalmi.art/llms.txt'), 'robots.txt must document the canonical llms.txt entry point as a comment');
fail(robots.includes('# https://www.banhalmi.art/ai.txt'), 'robots.txt must document the canonical ai.txt entry point as a comment');
fail(!/^\s*(?:LLMS|AI)\s*:/im.test(robots), 'robots.txt must not invent non-standard LLMS: or AI: directives');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART canonical machine core audit passed: E-E-A-T policy, legal Organization, BANHALMI Brand, Photography Team descriptor, artistic specialisms, Ébredés artistic-nude hub, Touch/Tantra and The Men’s Dream supporting authority, role boundaries, immutable artifact projections and LLM data minimisation are intact.');
