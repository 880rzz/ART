import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/home-meta.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');
const qualityPass = await readFile(new URL('../tools/archive_quality_pass.py', import.meta.url), 'utf8');

const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const title = normalize(data.title);
const description = normalize(data.description);
const ogDescription = normalize(data.ogDescription);
const imageAlt = normalize(data.imageAlt);
const today = new Date().toISOString().slice(0, 10);
const modifiedDate = normalize(data.dateModified || data.updatedAt);

const checks = [
  ['presence-led archive title', title.includes('A jelenlét anatómiája') && title.includes('Hivatalos művészeti archívum')],
  ['description has presence-led scope', ['1999', 'jelenlét', 'könyveken', 'kiállításokon'].every((term) => description.includes(term))],
  ['not service-led', !/szolgáltatás|árajánlat|foglalás|megrendelés/iu.test(`${title} ${description}`)],
  ['og text present and concise', ogDescription.length > 40 && ogDescription.length <= 180],
  ['image alt meaningful', imageAlt.includes('Bánhalmi Norbert') && imageAlt.includes('jelenlét anatómiája') && imageAlt.includes('archívum')],
  ['schema page aligned', normalize(data.schemaPageName).includes('archívuma') && normalize(data.schemaPageHeadline).includes('életműve')],
  ['schema page description aligned', ['1999', 'portrék', 'könyvek', 'kiállítások'].every((term) => normalize(data.schemaPageDescription).includes(term))],
  ['schema gallery aligned', normalize(data.schemaGalleryName).includes('archívumból') && normalize(data.schemaGalleryDescription).includes('1999-től')],
  ['date modified valid', /^\d{4}-\d{2}-\d{2}$/.test(modifiedDate) && modifiedDate <= today],
  ['integration reads meta source', /HOME_META_PATH/.test(integration) && /homeMeta/.test(integration)],
  ['html meta replacement', /og:image:alt/.test(integration) && /meta name=["']description["']/.test(integration)],
  ['schema replacement', /normalize_graph/.test(qualityPass) && /WebPage/.test(qualityPass) && /ImageGallery/.test(qualityPass) && /gallery_description/.test(qualityPass)],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  const names = failed.map(([name]) => name).join(', ');
  throw new Error(`A főoldali metaadat-audit ${failed.length} hibát talált: ${names}`);
}
