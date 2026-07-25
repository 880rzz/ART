import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/home-meta.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const checks = [
  ['archive title', data.title.includes('fotóművészeti archívuma') && data.title.includes('BANHALMI ART')],
  ['description has scope', ['1999', 'portrék', 'könyvek', 'kiállítások'].every((term) => data.description.includes(term))],
  ['not service-led', !/szolgáltatás|árajánlat|foglalás|megrendelés/iu.test(`${data.title} ${data.description}`)],
  ['og text concise', data.ogDescription.length <= 180],
  ['image alt meaningful', data.imageAlt.includes('fotóművészeti archívuma')],
  ['schema page aligned', data.schemaPageName.includes('archívuma') && data.schemaPageHeadline.includes('életműve')],
  ['schema gallery aligned', data.schemaGalleryName.includes('archívumból') && data.schemaGalleryDescription.includes('1999-től')],
  ['date modified current', data.dateModified === '2026-07-25'],
  ['integration reads meta source', integration.includes('HOME_META_PATH') && integration.includes('homeMeta')),
  ['html meta replacement', integration.includes('og:image:alt') && integration.includes('meta name="description"')],
  ['schema replacement', integration.includes('schemaPageHeadline') && integration.includes('schemaGalleryDescription')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? '✓' : '✗'} ${name}`);
if (failed.length) throw new Error(`A főoldali metaadat-audit ${failed.length} hibát talált.`);
