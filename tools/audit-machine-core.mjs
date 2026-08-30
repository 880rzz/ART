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
fail(core.professionalMirror?.canonicalMachineCore === 'https://www.norbertbanhalmi.com/data/machine-core.json', 'Professional canonical machine source drift');
fail(core.professionalMirror?.volunteerBoundary?.includes('voluntary social/community work'), 'Volunteer social-work boundary missing from ART mirror');
fail(core.professionalMirror?.volunteerBoundary?.includes('not employment'), 'Volunteer role must explicitly exclude employment');
fail(core.professionalMirror?.independentRoleEvidence === 'https://rolunk.at/tag/banhalmi-norbert/', 'Independent role evidence URL drift');
fail(core.schemaPolicy?.homepageImageGalleryRepresentativeLimit >= 6 && core.schemaPolicy?.homepageImageGalleryRepresentativeLimit <= 12, 'Homepage ImageGallery representative limit must remain between 6 and 12');
fail(core.dataMinimisation?.staffContactRule?.includes('Do not publish collaborator'), 'Staff-contact minimisation rule missing');
fail((core.derivedOutputs || []).includes('/llms.txt'), 'llms.txt must remain a generated ART projection');
fail((core.derivedOutputs || []).includes('/ai.txt'), 'ai.txt must remain a generated ART projection');
fail(core.evidence?.imageKnowledgeGraph === 'https://www.banhalmi.art/data/image-knowledge-graph.jsonld', 'Image knowledge graph authority drift');

const sourceLlms = fs.readFileSync('llms.txt', 'utf8');
const hardener = fs.readFileSync('scripts/harden-machine-layer.mjs', 'utf8');
for (const forbidden of ['viko@banhalmi.at']) {
  fail(!JSON.stringify(core).includes(forbidden), `Unnecessary collaborator contact leaked into canonical ART core: ${forbidden}`);
  fail(!sourceLlms.includes(forbidden), `Unnecessary collaborator contact leaked into source llms.txt: ${forbidden}`);
  fail(!hardener.includes(`Viko Speier e-mail: ${forbidden}`), `Generated ART LLM template reintroduces collaborator contact: ${forbidden}`);
}
fail(hardener.includes('homepageImageGalleryRepresentativeLimit'), 'Machine hardener must consume the canonical representative gallery limit');
fail(hardener.includes('artisticSpecialisms'), 'Machine hardener must consume canonical artistic specialisms');
fail(hardener.includes('volunteerBoundary'), 'Machine hardener must project volunteer role boundaries');
fail(hardener.includes('refuses to mutate the source repository'), 'Machine hardener must refuse source-repository mutation');

const robots = fs.readFileSync('robots.txt', 'utf8');
fail(robots.includes('# AI / LLM machine entry points'), 'robots.txt AI/LLM discovery comment heading missing');
fail(robots.includes('# https://www.banhalmi.art/llms.txt'), 'robots.txt must document the canonical llms.txt entry point as a comment');
fail(robots.includes('# https://www.banhalmi.art/ai.txt'), 'robots.txt must document the canonical ai.txt entry point as a comment');
fail(!/^\s*(?:LLMS|AI)\s*:/im.test(robots), 'robots.txt must not invent non-standard LLMS: or AI: directives');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART canonical machine core audit passed: photography-first identity, fine-art and artistic-nude specialisms, volunteer role boundaries, archive/professional separation, source-mutation guard and LLM data minimisation are intact.');
