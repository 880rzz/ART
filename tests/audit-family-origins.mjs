import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../hu/csaladi-gyokerek.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/archive-page.css', import.meta.url), 'utf8');
const data = JSON.parse(await readFile(new URL('../data/archive/family-origins.hu.json', import.meta.url), 'utf8'));

const checks = [
  ['canonical', page.includes('<link rel="canonical" href="https://www.banhalmi.art/hu/csaladi-gyokerek.html">')],
  ['shared stylesheet', page.includes('<link rel="stylesheet" href="/assets/css/archive-page.css">')],
  ['no inline style block', !page.includes('<style>')],
  ['Cseuz–Ferenczy connection', page.includes('Cseuz és a Ferenczy ág kapcsolatát')],
  ['Győry László relationship', page.includes('Győry László, édesanyám testvére')],
  ['no teaching claim', page.includes('Nem ő tanított meg fényképezni')],
  ['source note', page.includes('családi síremlék') && page.includes('családfák')],
  ['structured source record', data.sources?.some((source) => source.type === 'family-tree-document')],
  ['publication scope', data.publicationRule?.includes('röviden')],
  ['accessible focus state', css.includes(':focus-visible')],
  ['responsive layout', css.includes('@media(max-width:760px)')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A családi gyökerek audit ${failed.length} hibát talált.`);
}
