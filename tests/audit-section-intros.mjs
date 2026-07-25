import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/section-intros.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const combined = `${data.books.label} ${data.books.title} ${data.books.lead} ${data.exhibitions.label} ${data.exhibitions.title} ${data.exhibitions.lead}`;

const checks = [
  ['books framed as collaboration', data.books.lead.includes('együttműködésként') && data.books.lead.includes('saját szavai')],
  ['books are not secondary products', data.books.lead.includes('nem a kiállítások melléktermékei')],
  ['exhibitions framed as chronology', data.exhibitions.lead.includes('hogyan változott a figyelmem')],
  ['exhibitions preserve context', data.exhibitions.lead.includes('mikor és miért születtek')],
  ['human themes named', ['betegség', 'apaság', 'emlékezet', 'tánc', 'érintés', 'mesterséges intelligencia'].every((term) => data.exhibitions.lead.includes(term))],
  ['no sales language', !/vásárol|rendeld meg|kihagyhatatlan|exkluzív|prémium élmény/iu.test(combined)],
  ['no self-ranking', !/legjobb|egyedülálló|világszínvonalú|páratlan/iu.test(combined)],
  ['bounded section integration', integration.includes('replaceSectionIntro') && integration.includes('booksStart') && integration.includes('exhibitionsStart')],
  ['editorial rules present', Array.isArray(data.editorialRules) && data.editorialRules.length >= 4],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A szakaszbevezető-audit ${failed.length} hibát talált.`);
}
