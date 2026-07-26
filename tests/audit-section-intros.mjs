import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/section-intros.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const normalize = (value) => String(value).replace(/\s+/g, ' ').trim();
const booksLead = normalize(data.books?.lead);
const exhibitionsLead = normalize(data.exhibitions?.lead);
const combined = normalize([
  data.books?.label,
  data.books?.title,
  booksLead,
  data.exhibitions?.label,
  data.exhibitions?.title,
  exhibitionsLead,
].join(' '));

const requiredChecks = [
  ['complete books intro', Boolean(data.books?.label && data.books?.title && booksLead)],
  ['complete exhibitions intro', Boolean(data.exhibitions?.label && data.exhibitions?.title && exhibitionsLead)],
  ['books framed as collaboration', /együttműködés/iu.test(booksLead) && /saját szavai/iu.test(booksLead)],
  ['books are not secondary products', /nem a kiállítások melléktermékei/iu.test(booksLead)],
  ['exhibitions framed as chronology', /hogyan változott a figyelmem/iu.test(exhibitionsLead)],
  ['exhibitions preserve context', /mikor és miért születtek/iu.test(exhibitionsLead)],
  ['human themes named', ['betegség', 'apaság', 'emlékezet', 'tánc', 'érintés', 'mesterséges intelligencia'].every((term) => exhibitionsLead.includes(term))],
  ['no sales language', !/vásárol|rendeld meg|kihagyhatatlan|exkluzív|prémium élmény/iu.test(combined)],
  ['no self-ranking', !/\blegjobb\b|egyedülálló|világszínvonalú|páratlan/iu.test(combined)],
  ['bounded section integration', /function replaceSectionIntro\(/.test(integration) && integration.includes('booksStart') && integration.includes('exhibitionsStart')],
  ['editorial rules present', Array.isArray(data.editorialRules) && data.editorialRules.length >= 4],
];

for (const [name, passed] of requiredChecks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

const failed = requiredChecks.filter(([, passed]) => !passed);
if (failed.length) {
  const names = failed.map(([name]) => name).join(', ');
  throw new Error(`A szakaszbevezető-audit ${failed.length} hibát talált: ${names}`);
}
