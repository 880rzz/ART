import fs from 'node:fs';
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
