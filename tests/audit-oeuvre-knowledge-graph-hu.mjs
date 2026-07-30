import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const graph = JSON.parse(await readFile(path.join(root, 'oeuvre-knowledge-graph.hu.jsonld'), 'utf8'));
const relations = JSON.parse(await readFile(path.join(root, 'data/archive/oeuvre-relations.hu.json'), 'utf8'));
const sync = await readFile(path.join(root, 'scripts/sync-oeuvre-registry-hu.mjs'), 'utf8');

const failures = [];
const nodes = graph['@graph'] || [];
const byId = new Map(nodes.map((node) => [node['@id'], node]));

if (!graph['@context']) failures.push('Hiányzik a JSON-LD @context.');
if (!nodes.length) failures.push('Üres az életmű tudásgráf.');
if (byId.size !== nodes.length) failures.push('Ismétlődő @id található a tudásgráfban.');

const personId = 'https://www.banhalmi.art/norbert-banhalmi#person';
const websiteId = 'https://www.banhalmi.art/#website';
const pressId = 'https://www.banhalmi.art/hu/press.html#collection';
if (!byId.has(personId)) failures.push('Hiányzik a Person entitás.');
if (!byId.has(websiteId)) failures.push('Hiányzik a WebSite entitás.');
if (!byId.has(pressId)) failures.push('Hiányzik a sajtógyűjtemény entitása.');

const requiredPeople = [
  'viko-speier',
  'miklos-vamos',
  'eva-lenart',
  'magdolna-dank',
  'erika-elek',
  'imre-csernus',
  'peter-magyar',
  'robert-capa',
];
for (const slug of requiredPeople) {
  const id = `https://www.banhalmi.art/people/${slug}#person`;
  if (!byId.has(id)) failures.push(`Hiányzó személyentitás: ${slug}`);
}

const requiredPlaces = ['budapest', 'vienna', 'new-york-city', 'heroes-square-budapest'];
for (const slug of requiredPlaces) {
  const id = `https://www.banhalmi.art/places/${slug}#place`;
  if (!byId.has(id)) failures.push(`Hiányzó helyszínentitás: ${slug}`);
}

for (const relation of relations.records) {
  const projectId = `https://www.banhalmi.art/hu/projects/${relation.id}#project`;
  const project = byId.get(projectId);
  if (!project) {
    failures.push(`Hiányzó projektentitás: ${relation.id}`);
    continue;
  }
  if (project.archiveStatus !== relation.status) failures.push(`${relation.id}: eltérő státusz a tudásgráfban.`);
  if (project.creator?.['@id'] !== personId) failures.push(`${relation.id}: hibás alkotói kapcsolat.`);
  if (project.isPartOf?.['@id'] !== websiteId) failures.push(`${relation.id}: hibás archívumkapcsolat.`);
  if (project.subjectOf?.['@id'] !== pressId) failures.push(`${relation.id}: hiányzó sajtókapcsolat.`);

  const parts = new Set((project.hasPart || []).map((item) => item['@id']));
  for (const page of relation.pages) {
    const pageId = `https://www.banhalmi.art/${page.path}#record`;
    if (!parts.has(pageId)) failures.push(`${relation.id}: hiányzó hasPart kapcsolat: ${page.path}`);
    if (!byId.has(pageId)) failures.push(`${relation.id}: hiányzó rekordentitás: ${page.path}`);
  }
}

const ebredes = byId.get('https://www.banhalmi.art/hu/projects/ebredes#project');
const ebredesContributors = new Set((ebredes?.contributor || []).map((item) => item['@id']));
for (const id of [
  'https://www.banhalmi.art/people/magdolna-dank#person',
  'https://www.banhalmi.art/people/erika-elek#person',
  'https://www.banhalmi.art/people/imre-csernus#person',
]) {
  if (!ebredesContributors.has(id)) failures.push(`Ébredés: hiányzó közreműködő: ${id}`);
}

const woman = byId.get('https://www.banhalmi.art/hu/projects/a-no-vilaga#project');
const womanContributors = new Set((woman?.contributor || []).map((item) => item['@id']));
for (const id of [
  'https://www.banhalmi.art/people/miklos-vamos#person',
  'https://www.banhalmi.art/people/eva-lenart#person',
]) {
  if (!womanContributors.has(id)) failures.push(`A Nő világa: hiányzó közreműködő: ${id}`);
}

const euforiaProject = byId.get('https://www.banhalmi.art/hu/projects/euforia#project');
const euforiaEvent = byId.get('https://www.banhalmi.art/hu/exhibitions/euforia.html#record');
if (euforiaProject?.archiveStatus !== 'in-development') failures.push('Az EUFÓRIA projekt nem fejlesztés alatt állóként szerepel.');
if (euforiaEvent?.archiveStatus !== 'planned') failures.push('Az EUFÓRIA kiállítás nem tervezettként szerepel.');
if (euforiaEvent?.eventStatus !== 'https://schema.org/EventScheduled') failures.push('Az EUFÓRIA eseménystátusza hibás.');
if (euforiaEvent?.location) failures.push('Az EUFÓRIA tudásgráfban nem kaphat nem igazolt helyszínt.');
if (euforiaProject?.citation?.['@id'] !== 'https://www.banhalmi.art/people/robert-capa#person') failures.push('Az EUFÓRIA Robert Capa-kapcsolata hiányzik vagy pontatlan.');

const portrait = byId.get('https://www.banhalmi.art/hu/works/magyar-peter-portre-2026.html#record');
const portraitTypes = new Set(Array.isArray(portrait?.['@type']) ? portrait['@type'] : [portrait?.['@type']]);
if (!portraitTypes.has('Photograph') || !portraitTypes.has('CreativeWork')) failures.push('A Magyar Péter-portré nem önálló műentitás.');
if (portrait?.about?.['@id'] !== 'https://www.banhalmi.art/people/peter-magyar#person') failures.push('A portré alanykapcsolata hiányzik.');
if (portrait?.contentLocation?.['@id'] !== 'https://www.banhalmi.art/places/heroes-square-budapest#place') failures.push('A portré helyszínkapcsolata hiányzik.');
if (portrait?.subjectOf?.['@id'] !== pressId) failures.push('A portré sajtókapcsolata hiányzik.');

const capa = byId.get('https://www.banhalmi.art/people/robert-capa#person');
if (!capa?.relationNote?.includes('nem együttműködő')) failures.push('Robert Capa kapcsolata nincs egyértelműen inspirációként korlátozva.');

for (const required of ['oeuvreProjectId', 'archiveStatus', 'archiveRecordType', 'relatedOeuvreRecords', 'oeuvreRelationModel']) {
  if (!sync.includes(required)) failures.push(`A rekordjegyzék-szinkronból hiányzik: ${required}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  throw new Error(`Az életmű tudásgráf audit ${failures.length} hibát talált.`);
}

console.log(`✓ ${nodes.length} JSON-LD entitás`);
console.log(`✓ ${relations.records.length} központi életműegység`);
console.log(`✓ ${requiredPeople.length} kapcsolódó személy és ${requiredPlaces.length} helyszín`);
console.log('✓ Könyv–kiállítás–mű–sajtó kapcsolatok ellenőrizve');
console.log('✓ EUFÓRIA projekt- és eseménystátusz szétválasztva');