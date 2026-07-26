import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/home-meta.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const title = normalize(data.title);
const description = normalize(data.description);
const ogDescription = normalize(data.ogDescription);
const imageAlt = normalize(data.imageAlt);
const today = new Date().toISOString().slice(0, 10);
const modifiedDate = normalize(data.dateModified || data.updatedAt);

const checks = [
  ['archive title', title.includes('fotóművészeti archívuma') && title.includes('BANHALMI ART')],
  ['description has scope', ['1999', 'portrék', 'könyvek', 'kiállítások'].every((term) => description.includes(term))],
  ['not service-led', !/szolgáltatás|árajánlat|foglalás|megrendelés/iu.test(`${title} ${description}`)],
  ['og text present and concise', ogDescription.length > 40 && ogDescription.length <= 180],
  ['image alt meaningful', imageAlt.includes('Bánhalmi Norbert') && imageAlt.includes('archívuma')],
  ['schema page aligned', normalize(data.schemaPageName).includes('archívuma') && normalize(data.schemaPageHeadline).includes('életműve')],
  ['schema page description aligned', ['1999', 'portrék', 'könyvek', 'kiállítások'].every((term) => normalize(data.schemaPageDescription).includes(term))],
  ['schema gallery aligned', normalize(data.schemaGalleryName).includes('archívumból') && normalize(data.schemaGalleryDescription).includes('1999-től')],
  ['date modified valid', /^\d{4}-\d{2}-\d{2}$/.test(modifiedDate) && modifiedDate <= today],
  ['integration reads meta source', /HOME_META_PATH/.test(integration) && /homeMeta/.test(integration)],
  ['html meta replacement', /og:image:alt/.test(integration) && /meta name=["']description["']/.test(integration)],
  ['schema replacement', /schemaPageHeadline/.test(integration) && /schemaGalleryDescription/.test(integration)],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  const names = failed.map(([name]) => name).join(', ');
  throw new Error(`A főoldali metaadat-audit ${failed.length} hibát talált: ${names}`);
}
