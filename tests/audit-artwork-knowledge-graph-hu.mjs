import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(await readFile(path.join(root, 'data/archive/artwork-registry.hu.json'), 'utf8'));
const graph = JSON.parse(await readFile(path.join(root, 'artwork-knowledge-graph.hu.jsonld'), 'utf8'));
const builderEntry = await readFile(path.join(root, 'scripts/build-artwork-knowledge-graph-hu.mjs'), 'utf8');
const builderModule = await readFile(path.join(root, 'scripts/lib/archive-graph-builders.mjs'), 'utf8');
const builder = `${builderEntry}\n${builderModule}`;
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');

const failures = [];
const nodes = graph['@graph'] || [];
const byId = new Map();

for (const node of nodes) {
  if (!node['@id']) failures.push('Az egyik műtárgy-entitásból hiányzik az @id.');
  else if (byId.has(node['@id'])) failures.push(`Ismétlődő műtárgyazonosító: ${node['@id']}`);
  else byId.set(node['@id'], node);
}

for (const record of registry.records) {
  const node = byId.get(record.archiveId);
  if (!node) {
    failures.push(`Hiányzó műtárgy-entitás: ${record.id}`);
    continue;
  }

  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  for (const requiredType of record.type) {
    if (!types.includes(requiredType)) failures.push(`${record.id}: hiányzó típus: ${requiredType}`);
  }

  if (node.creator?.['@id'] !== record.creator) failures.push(`${record.id}: hibás alkotói kapcsolat.`);
  if (record.subject && node.about?.['@id'] !== record.subject) failures.push(`${record.id}: hibás alanykapcsolat.`);
  if (record.project && node.isPartOf?.['@id'] !== record.project) failures.push(`${record.id}: hibás projektkapcsolat.`);
  if (record.contentLocation && node.contentLocation?.['@id'] !== record.contentLocation) failures.push(`${record.id}: hibás helyszínkapcsolat.`);
  if (record.dateCreated && node.dateCreated !== record.dateCreated) failures.push(`${record.id}: hibás készítési dátum.`);
  if (record.sourceQuality !== node.sourceQuality) failures.push(`${record.id}: hibás forrásminőség.`);
  if (!record.sameAs?.every((url) => (node.sameAs || []).includes(url))) failures.push(`${record.id}: hiányzó nyilvános forráskapcsolat.`);

  const pathname = new URL(record.url).pathname.replace(/^\//, '');
  const localPath = path.join(root, pathname);
  try {
    await access(localPath);
  } catch {
    failures.push(`${record.id}: a deklarált műtárgyoldal nem létezik: ${pathname}`);
    continue;
  }

  const html = await readFile(localPath, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html) || /window\.location\.(?:replace|assign)/i.test(html)) {
    failures.push(`${record.id}: a műtárgyoldal csak átirányítás, nem önálló archívumi rekord.`);
  }
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    failures.push(`${record.id}: a műtárgyoldal noindex beállítású.`);
  }
  if (!html.includes(`<link rel="canonical" href="${record.url}">`) && !html.includes(`<link rel='canonical' href='${record.url}'>`)) {
    failures.push(`${record.id}: hiányzik vagy hibás a saját canonical URL.`);
  }
  if (!html.includes(record.archiveId)) failures.push(`${record.id}: a HTML JSON-LD blokkjából hiányzik a műtárgy @id.`);
  if (!html.includes(record.creator)) failures.push(`${record.id}: a HTML-ből hiányzik az alkotói entitáskapcsolat.`);
  if (record.project && !html.includes(record.project)) failures.push(`${record.id}: a HTML-ből hiányzik a projektkapcsolat.`);
  if (!sitemap.includes(`<loc>${record.url}</loc>`)) failures.push(`${record.id}: a műtárgyoldal hiányzik a sitemapből.`);
}

const allowedSourceQuality = new Set(['public-primary-record', 'exact-source', 'archived-exact-source']);
for (const record of registry.records) {
  if (!allowedSourceQuality.has(record.sourceQuality)) failures.push(`${record.id}: nem engedélyezett sourceQuality érték.`);
  if (record.dateCreated && !record.sameAs?.length) failures.push(`${record.id}: forrásolt dátumhoz hiányzik a nyilvános bizonyíték.`);
  if (record.subject && !record.sameAs?.length) failures.push(`${record.id}: dokumentált alanykapcsolathoz hiányzik a nyilvános bizonyíték.`);
}

for (const forbidden of registry.sourcePolicy.forbidden || []) {
  if (!forbidden) failures.push('Üres tiltott forrásszabály.');
}

for (const required of ['archiveStatus', 'sourceQuality', 'contentLocation', 'sameAs']) {
  if (!builder.includes(required)) failures.push(`A műtárgygráf-építőből hiányzik: ${required}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  throw new Error(`A műtárgy-tudásgráf audit ${failures.length} hibát talált.`);
}

console.log(`✓ ${registry.records.length} forrásolt műtárgyrekord`);
console.log(`✓ ${nodes.length} műtárgy-entitás`);
console.log('✓ A deklarált műtárgyoldalak ténylegesen léteznek és nem átirányítások');
console.log('✓ Canonical, indexelhetőség, HTML JSON-LD és sitemap-integráció ellenőrizve');
console.log('✓ Alkotó-, alany-, projekt-, helyszín- és forráskapcsolatok ellenőrizve');
console.log('✓ A nem igazolt műtárgyadatok felvételét forráspolitika korlátozza');
