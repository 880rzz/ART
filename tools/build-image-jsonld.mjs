import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const registryPath = path.join(ROOT, 'data', 'image-metadata.json');
const outputPath = path.join(ROOT, 'data', 'image-knowledge-graph.jsonld');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const reviewed = registry.records.filter((record) => record.review?.humanReviewed === true && record.review?.status === 'verified');

const graph = reviewed.map((record) => {
  const absoluteAsset = new URL(record.asset, 'https://www.banhalmi.art').href;
  const node = {
    '@type': Array.from(new Set(['ImageObject', record.kind || 'Photograph'])),
    '@id': `https://www.banhalmi.art/#image-${record.id}`,
    contentUrl: absoluteAsset,
    url: absoluteAsset,
    encodingFormat: record.technical?.encodingFormat,
    name: record.title?.en || record.title?.hu,
    alternateName: [record.title?.hu, record.title?.de].filter(Boolean),
    description: record.longDescription?.en || record.aiSummary?.en,
    caption: record.caption?.en,
    creator: { '@id': record.creator?.id },
    copyrightHolder: { '@id': record.creator?.id },
    copyrightNotice: record.rights?.copyrightNotice,
    creditText: record.rights?.creditText,
    license: record.rights?.license,
    acquireLicensePage: record.rights?.acquireLicensePage,
    dateCreated: record.dateCreated,
    keywords: record.visualKeywords,
    associatedMedia: record.sameAs?.map((url) => ({ '@type': 'CreativeWork', url })),
    inLanguage: ['hu', 'en', 'de'],
    subjectOf: record.relatedPages?.map((page) => ({ '@type': 'WebPage', '@id': new URL(page, 'https://www.banhalmi.art').href }))
  };

  if (record.contentLocation) {
    node.contentLocation = {
      '@type': 'Place',
      name: record.contentLocation.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: record.contentLocation.city,
        addressCountry: record.contentLocation.country
      },
      sameAs: record.contentLocation.wikidata
    };
  }

  if (record.people?.length) {
    node.about = record.people.map((person) => ({
      '@type': 'Person',
      name: person.name,
      sameAs: person.sameAs
    }));
  }

  return Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined && value !== null && (!(Array.isArray(value)) || value.length)));
});

const output = {
  '@context': 'https://schema.org',
  '@graph': graph
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${graph.length} reviewed image nodes to ${path.relative(ROOT, outputPath)}`);
