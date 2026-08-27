import fs from 'node:fs';

const core = JSON.parse(fs.readFileSync('data/machine-core.json', 'utf8'));
const errors = [];
const fail = (condition, message) => { if (!condition) errors.push(message); };

fail(core.canonicalId === 'https://www.banhalmi.art/data/machine-core.json', 'ART canonical machine core URL drift');
fail(core.archive?.name === 'BANHALMI ART', 'ART archive identity drift');
fail(core.person?.wikidata === 'https://www.wikidata.org/wiki/Q56391118', 'Canonical Person Wikidata drift');
fail(core.professionalMirror?.canonicalMachineCore === 'https://www.norbertbanhalmi.com/data/machine-core.json', 'Professional canonical machine source drift');
fail(core.schemaPolicy?.homepageImageGalleryRepresentativeLimit >= 6 && core.schemaPolicy?.homepageImageGalleryRepresentativeLimit <= 12, 'Homepage ImageGallery representative limit must remain between 6 and 12');
fail(core.dataMinimisation?.staffContactRule?.includes('Do not publish collaborator'), 'Staff-contact minimisation rule missing');
fail((core.derivedOutputs || []).includes('/llms.txt'), 'llms.txt must remain a generated ART projection');
fail((core.derivedOutputs || []).includes('/ai.txt'), 'ai.txt must remain a generated ART projection');
fail(core.evidence?.imageKnowledgeGraph === 'https://www.banhalmi.art/data/image-knowledge-graph.jsonld', 'Image knowledge graph authority drift');

const text = JSON.stringify(core);
for (const forbidden of ['viko@banhalmi.at']) fail(!text.includes(forbidden), `Unnecessary collaborator contact leaked into canonical ART core: ${forbidden}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART canonical machine core audit passed: archive/professional role separation, representative schema cap, evidence anchors and data-minimisation invariants are intact.');
