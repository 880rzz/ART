#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
  console.log(`UPDATED ${file}`);
};
const writeJson = (file, value) => write(file, JSON.stringify(value, null, 2));

const creatorId = 'https://www.norbertbanhalmi.com/about/';
const commons = 'https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg';

const registry = {
  $schema: './image-metadata.schema.json',
  version: '1.1.0',
  updatedAt: '2026-08-06T14:20:00Z',
  records: [
    {
      id: 'peter-magyar-portrait-2026',
      asset: '/assets/img/euforia-hero.webp',
      kind: 'Photograph',
      decorative: false,
      title: {
        hu: 'Magyar Péter portréja, Budapest, 2026',
        en: 'Portrait of Péter Magyar, Budapest, 2026',
        de: 'Porträt von Péter Magyar, Budapest, 2026'
      },
      alt: {
        hu: 'Magyar Péter közeli, alulnézeti portréja sötét Bocskai-ruhában és nemzeti kokárdával, világos ég előtt a budapesti Hősök terén.',
        en: 'Low-angle close-up portrait of Péter Magyar in a dark Bocskai-style jacket with a Hungarian cockade, against a pale sky at Heroes’ Square in Budapest.',
        de: 'Nahporträt von Péter Magyar aus niedriger Perspektive in dunkler Bocskai-Kleidung mit ungarischer Kokarde vor hellem Himmel auf dem Heldenplatz in Budapest.'
      },
      caption: {
        hu: 'Magyar Péter a budapesti Hősök terén, 2026. március 15.',
        en: 'Péter Magyar at Heroes’ Square, Budapest, 15 March 2026.',
        de: 'Péter Magyar auf dem Heldenplatz in Budapest, 15. März 2026.'
      },
      longDescription: {
        hu: 'A szoros, alulnézeti portré Magyar Pétert sötét Bocskai-ruhában és nemzeti kokárdával mutatja. Az alakot a világos ég választja el a háttértől, ami közvetlen, monumentális jelenlétet ad a képnek.',
        en: 'The tight, low-angle portrait shows Péter Magyar in a dark Bocskai-style jacket with a Hungarian cockade. The pale sky isolates the figure and gives the photograph an immediate, monumental presence.',
        de: 'Das enge Porträt aus niedriger Perspektive zeigt Péter Magyar in dunkler Bocskai-Kleidung mit ungarischer Kokarde. Der helle Himmel löst die Figur vom Hintergrund und verleiht dem Bild eine unmittelbare, monumentale Präsenz.'
      },
      curatorialNote: {
        hu: 'Az EUFÓRIA projekt kiemelt képe, amely a közéleti dokumentációt a pszichológiailag közvetlen portré nyelvével kapcsolja össze.',
        en: 'A key image in the EUFÓRIA project, connecting public-event documentation with the psychological directness of portraiture.',
        de: 'Ein Schlüsselbild des Projekts EUFÓRIA, das die Dokumentation eines öffentlichen Ereignisses mit der psychologischen Direktheit des Porträts verbindet.'
      },
      aiSummary: {
        hu: 'Alulnézeti, szoros közéleti portré Magyar Péterről Bocskai-ruhában és magyar kokárdával, világos ég előtt.',
        en: 'Low-angle close-up public portrait of Péter Magyar in a Bocskai-style jacket and Hungarian cockade against a pale sky.',
        de: 'Nahes öffentliches Porträt von Péter Magyar aus niedriger Perspektive in Bocskai-Kleidung mit ungarischer Kokarde vor hellem Himmel.'
      },
      creator: { name: 'Bánhalmi Norbert', id: creatorId },
      dateCreated: '2026-03-15',
      contentLocation: {
        name: 'Hősök tere',
        city: 'Budapest',
        country: 'Hungary',
        wikidata: 'https://www.wikidata.org/wiki/Q146913'
      },
      people: [{ name: 'Péter Magyar', sameAs: [commons] }],
      series: ['EUFÓRIA — A jelenlét anatómiája'],
      exhibitions: ['EUFÓRIA — The Anatomy of Presence'],
      books: [],
      relatedPages: [
        '/exhibitions/euforia.html',
        '/hu/exhibitions/euforia.html',
        '/de-at/exhibitions/euforia.html'
      ],
      sameAs: [commons],
      visualKeywords: ['close-up portrait', 'low angle', 'Bocskai jacket', 'Hungarian cockade', 'pale sky', 'public figure'],
      composition: ['tight portrait', 'low viewpoint', 'isolated figure', 'open sky background'],
      mood: ['focused', 'resolute', 'monumental'],
      rights: {
        copyrightNotice: '© Bánhalmi Norbert',
        creditText: 'Bánhalmi Norbert / BANHALMI',
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        acquireLicensePage: commons,
        aiTrainingPreference: 'permitted-by-license'
      },
      technical: { encodingFormat: 'image/webp', width: 1569, height: 883 },
      review: {
        humanReviewed: false,
        visualReviewed: true,
        status: 'verified',
        reviewedAt: '2026-08-06T14:20:00Z',
        reviewer: 'OpenAI visual and source verification',
        evidence: [
          { type: 'published-asset', url: 'https://www.banhalmi.art/assets/img/euforia-hero.webp' },
          { type: 'source-page', url: commons }
        ],
        note: 'The factual visual description is verified against the published asset and source page. Human editorial approval remains explicitly pending.'
      }
    }
  ]
};
writeJson('data/image-metadata.json', registry);

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://www.banhalmi.art/data/image-metadata.schema.json',
  title: 'BANHALMI ART image metadata registry',
  type: 'object',
  required: ['$schema', 'version', 'updatedAt', 'records'],
  additionalProperties: false,
  properties: {
    $schema: { type: 'string' },
    version: { type: 'string' },
    updatedAt: { type: 'string', format: 'date-time' },
    records: { type: 'array', items: { $ref: '#/$defs/record' } }
  },
  $defs: {
    i18nRequired: {
      type: 'object', required: ['hu', 'en', 'de'], additionalProperties: false,
      properties: { hu: { type: 'string', minLength: 1 }, en: { type: 'string', minLength: 1 }, de: { type: 'string', minLength: 1 } }
    },
    i18nOptional: {
      type: 'object', additionalProperties: false,
      properties: { hu: { type: 'string' }, en: { type: 'string' }, de: { type: 'string' } }
    },
    record: {
      type: 'object',
      required: ['id', 'asset', 'kind', 'decorative', 'title', 'alt', 'creator', 'rights', 'review'],
      additionalProperties: false,
      properties: {
        id: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]+$' },
        asset: { type: 'string', pattern: '^/assets/' },
        kind: { enum: ['Photograph', 'VisualArtwork', 'BookCover', 'ExhibitionView', 'Portrait', 'Document', 'Decorative'] },
        decorative: { type: 'boolean' },
        title: { $ref: '#/$defs/i18nRequired' }, alt: { $ref: '#/$defs/i18nRequired' },
        caption: { $ref: '#/$defs/i18nOptional' }, longDescription: { $ref: '#/$defs/i18nOptional' },
        curatorialNote: { $ref: '#/$defs/i18nOptional' }, aiSummary: { $ref: '#/$defs/i18nOptional' },
        creator: { type: 'object', required: ['name', 'id'], additionalProperties: false, properties: { name: { const: 'Bánhalmi Norbert' }, id: { const: creatorId } } },
        dateCreated: { type: 'string', format: 'date' },
        contentLocation: { type: 'object' }, people: { type: 'array' }, series: { type: 'array' }, exhibitions: { type: 'array' }, books: { type: 'array' },
        relatedPages: { type: 'array', items: { type: 'string' } }, sameAs: { type: 'array', items: { type: 'string', format: 'uri' } },
        visualKeywords: { type: 'array' }, composition: { type: 'array' }, mood: { type: 'array' },
        rights: { type: 'object', required: ['copyrightNotice', 'creditText'], additionalProperties: true },
        technical: { type: 'object', additionalProperties: true },
        review: {
          type: 'object',
          required: ['humanReviewed', 'visualReviewed', 'status', 'reviewer', 'evidence'],
          additionalProperties: false,
          properties: {
            humanReviewed: { type: 'boolean' }, visualReviewed: { type: 'boolean' },
            status: { enum: ['draft', 'verified', 'needs-visual-review'] },
            reviewedAt: { type: 'string', format: 'date-time' }, reviewer: { type: 'string', minLength: 1 },
            evidence: { type: 'array', minItems: 1, items: { type: 'object', required: ['type', 'url'], properties: { type: { type: 'string' }, url: { type: 'string', format: 'uri' } } } },
            note: { type: 'string' }
          }
        }
      }
    }
  }
};
writeJson('data/image-metadata.schema.json', schema);

write('tools/build-image-jsonld.mjs', String.raw`import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-metadata.json'), 'utf8'));
const outputPath = path.join(root, 'data', 'image-knowledge-graph.jsonld');
const publicRecords = registry.records.filter((record) => record.review?.status === 'verified' && record.review?.visualReviewed === true);
const langValues = (value = {}) => ['hu', 'en', 'de'].filter((lang) => value[lang]).map((lang) => ({ '@value': value[lang], '@language': lang }));
const compact = (value) => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && (!Array.isArray(item) || item.length)));

const graph = publicRecords.map((record) => {
  const assetUrl = new URL(record.asset, 'https://www.banhalmi.art').href;
  return compact({
    '@type': Array.from(new Set(['ImageObject', record.kind || 'Photograph'])),
    '@id': 'https://www.banhalmi.art/#image-' + record.id,
    contentUrl: assetUrl,
    url: assetUrl,
    encodingFormat: record.technical?.encodingFormat,
    width: record.technical?.width,
    height: record.technical?.height,
    name: langValues(record.title),
    description: langValues(record.longDescription || record.aiSummary),
    caption: langValues(record.caption),
    creator: { '@id': record.creator.id },
    copyrightHolder: { '@id': record.creator.id },
    copyrightNotice: record.rights?.copyrightNotice,
    creditText: record.rights?.creditText,
    license: record.rights?.license,
    acquireLicensePage: record.rights?.acquireLicensePage,
    dateCreated: record.dateCreated,
    keywords: record.visualKeywords,
    sameAs: record.sameAs,
    inLanguage: ['hu', 'en', 'de'],
    subjectOf: record.relatedPages?.map((page) => ({ '@type': 'WebPage', '@id': new URL(page, 'https://www.banhalmi.art').href })),
    about: record.people?.map((person) => ({ '@type': 'Person', name: person.name, sameAs: person.sameAs })),
    contentLocation: record.contentLocation ? {
      '@type': 'Place', name: record.contentLocation.name,
      address: { '@type': 'PostalAddress', addressLocality: record.contentLocation.city, addressCountry: record.contentLocation.country },
      sameAs: record.contentLocation.wikidata
    } : undefined,
    additionalProperty: [
      { '@type': 'PropertyValue', propertyID: 'archiveReviewStatus', value: record.review.status },
      { '@type': 'PropertyValue', propertyID: 'visualReviewed', value: String(record.review.visualReviewed) },
      { '@type': 'PropertyValue', propertyID: 'humanReviewed', value: String(record.review.humanReviewed) }
    ]
  });
});

fs.writeFileSync(outputPath, JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2) + '\n');
console.log('Wrote ' + graph.length + ' verified image node(s) to ' + path.relative(root, outputPath));
`);

let sync = read('tools/sync-image-metadata-to-html.mjs');
sync = sync.replace(
  'for (const record of registry.records ?? []) {\n  if (record.decorative) continue;',
  "for (const record of registry.records ?? []) {\n  if (record.review?.status !== 'verified' || record.review?.visualReviewed !== true) continue;\n  if (record.decorative) continue;"
);
write('tools/sync-image-metadata-to-html.mjs', sync);

let inventory = read('tools/build-image-inventory.mjs');
inventory = inventory.replace('generatedAt: new Date().toISOString(),', "generatedAt: null,\n  schemaVersion: '1.0.0',");
write('tools/build-image-inventory.mjs', inventory);

write('tests/audit-image-metadata-registry.mjs', String.raw`import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-metadata.json'), 'utf8'));
const errors = [];
const warnings = [];
const ids = new Set();
const assets = new Set();
const langs = ['hu', 'en', 'de'];
const text = (value, label) => { if (typeof value !== 'string' || !value.trim()) errors.push(label + ' must be a non-empty string'); };

if (!Array.isArray(registry.records)) errors.push('records must be an array');
for (const record of registry.records || []) {
  text(record.id, 'record.id'); text(record.asset, record.id + '.asset');
  if (ids.has(record.id)) errors.push('duplicate record id: ' + record.id);
  if (assets.has(record.asset)) errors.push('duplicate asset record: ' + record.asset);
  ids.add(record.id); assets.add(record.asset);
  if (!fs.existsSync(path.join(root, record.asset.replace(/^\//, '')))) errors.push(record.id + ': missing asset ' + record.asset);
  for (const field of ['title', 'alt']) for (const lang of langs) text(record[field]?.[lang], record.id + '.' + field + '.' + lang);
  for (const lang of langs) {
    const alt = record.alt?.[lang]?.trim() || '';
    if (alt.length < 30) warnings.push(record.id + '.alt.' + lang + ' may be too short');
    if (alt.length > 220) warnings.push(record.id + '.alt.' + lang + ' may be too long');
  }
  if (record.creator?.id !== 'https://www.norbertbanhalmi.com/about/') errors.push(record.id + ': canonical creator id is incorrect');
  if (!record.rights?.copyrightNotice || !record.rights?.creditText) errors.push(record.id + ': rights metadata is incomplete');
  if (typeof record.review?.humanReviewed !== 'boolean') errors.push(record.id + ': humanReviewed must be explicit');
  if (typeof record.review?.visualReviewed !== 'boolean') errors.push(record.id + ': visualReviewed must be explicit');
  if (record.review?.status === 'verified') {
    if (record.review.visualReviewed !== true) errors.push(record.id + ': verified records require visual review');
    if (!record.review.reviewer) errors.push(record.id + ': verified records require a reviewer');
    if (!Array.isArray(record.review.evidence) || !record.review.evidence.length) errors.push(record.id + ': verified records require evidence');
  }
}
for (const warning of warnings) console.warn('WARN ' + warning);
if (errors.length) { for (const error of errors) console.error('ERROR ' + error); process.exit(1); }
console.log('Image metadata registry audit passed (' + (registry.records?.length || 0) + ' record(s)).');
`);

write('tests/audit-image-knowledge-graph.mjs', String.raw`import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-metadata.json'), 'utf8'));
const doc = JSON.parse(fs.readFileSync(path.join(root, 'data', 'image-knowledge-graph.jsonld'), 'utf8'));
const graph = Array.isArray(doc['@graph']) ? doc['@graph'] : [];
const expected = registry.records.filter((record) => record.review?.status === 'verified' && record.review?.visualReviewed === true);
const errors = [];
if (doc['@context'] !== 'https://schema.org') errors.push('JSON-LD context must be Schema.org');
if (graph.length !== expected.length) errors.push('Expected ' + expected.length + ' public nodes, found ' + graph.length);
for (const node of graph) {
  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  if (!node['@id'] || !types.includes('ImageObject')) errors.push('Image node identity/type is incomplete');
  for (const key of ['contentUrl', 'name', 'description', 'creator', 'copyrightNotice']) if (!node[key]) errors.push((node['@id'] || 'unknown') + ' missing ' + key);
  if (node.creator?.['@id'] !== 'https://www.norbertbanhalmi.com/about/') errors.push((node['@id'] || 'unknown') + ' has non-canonical creator');
  const languages = new Set((Array.isArray(node.description) ? node.description : []).map((item) => item['@language']));
  for (const lang of ['hu', 'en', 'de']) if (!languages.has(lang)) errors.push((node['@id'] || 'unknown') + ' missing ' + lang + ' description');
}
if (errors.length) { for (const error of errors) console.error('ERROR ' + error); process.exit(1); }
console.log('Image knowledge graph audit passed (' + graph.length + ' verified node(s)).');
`);

const packageJson = JSON.parse(read('package.json'));
const imageTests = [
  'node tests/audit-image-metadata-registry.mjs',
  'node tests/audit-image-html-sync.mjs',
  'node tests/audit-image-knowledge-graph.mjs',
  'node tests/audit-image-system-runtime-isolation.mjs'
];
for (const command of imageTests) if (!packageJson.scripts.test.includes(command)) packageJson.scripts.test += ' && ' + command;
Object.assign(packageJson.scripts, {
  'inventory:images': 'node tools/build-image-inventory.mjs',
  'sync:image-metadata': 'node tools/sync-image-metadata-to-html.mjs',
  'sync:image-metadata:write': 'node tools/sync-image-metadata-to-html.mjs --write',
  'build:image-knowledge-graph': 'node tools/build-image-jsonld.mjs',
  'audit:image-registry': 'node tests/audit-image-metadata-registry.mjs',
  'audit:image-html-sync': 'node tests/audit-image-html-sync.mjs',
  'audit:image-knowledge-graph': 'node tests/audit-image-knowledge-graph.mjs',
  'audit:image-runtime-isolation': 'node tests/audit-image-system-runtime-isolation.mjs',
  'audit:images:report': 'node tools/audit-image-semantics.mjs',
  'audit:images:strict': 'node tools/audit-image-semantics.mjs --strict'
});
writeJson('package.json', packageJson);

const machineFiles = {
  'ai.txt': '\nImage semantics and verified ImageObject graph:\n- https://www.banhalmi.art/data/image-knowledge-graph.jsonld\n- The graph publishes only visually verified records. Human editorial approval is tracked separately and never inferred.\n',
  'llms.txt': '\nVerified image knowledge graph: https://www.banhalmi.art/data/image-knowledge-graph.jsonld\nImage metadata policy: only records with verified visual evidence are published; human review status remains explicit.\n'
};
for (const [file, addition] of Object.entries(machineFiles)) {
  const current = read(file);
  if (!current.includes('data/image-knowledge-graph.jsonld')) write(file, current.trimEnd() + addition);
}

const docs = ['docs/image-semantics-standard.md', 'docs/image-review-workflow.md'];
for (const file of docs) {
  const current = read(file);
  const addition = `\n## Review provenance\n\nVisual/source verification and human editorial approval are separate states. A record may be published only when \`status\` is \`verified\` and \`visualReviewed\` is true. \`humanReviewed\` must remain explicit and must never be inferred. Evidence URLs and the named reviewer are mandatory for verified records.\n`;
  if (!current.includes('## Review provenance')) write(file, current.trimEnd() + addition);
}

console.log('Stage 27 image semantics rebase completed.');
