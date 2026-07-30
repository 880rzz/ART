import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../hu/csaladi-gyokerek.html', import.meta.url), 'utf8');
const english = await readFile(new URL('../family-origins.html', import.meta.url), 'utf8');
const german = await readFile(new URL('../de-at/familienwurzeln.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../assets/css/archive-page.css', import.meta.url), 'utf8');
const data = JSON.parse(await readFile(new URL('../data/archive/family-origins.hu.json', import.meta.url), 'utf8'));

const cseuzBeforeFerenczy = (text) => text.indexOf('Cseuz') !== -1 && text.indexOf('Ferenczy') !== -1 && text.indexOf('Cseuz') < text.indexOf('Ferenczy');

const checks = [
  ['canonical', page.includes('<link rel="canonical" href="https://www.banhalmi.art/hu/csaladi-gyokerek.html">')],
  ['shared stylesheet', page.includes('<link rel="stylesheet" href="/assets/css/archive-page.css">')],
  ['no inline style block', !page.includes('<style>')],
  ['Cseuz origin first', page.includes('erdélyi gyökerű') && cseuzBeforeFerenczy(page)],
  ['documented Cseuz achievements', ['orvosokat', 'egyetemi tanárt', 'honvédorvost', 'malomépítészeti'].every((term) => page.includes(term))],
  ['Ferenczy transition', page.includes('Cseuz Etelkán keresztül') && page.includes('Ferenczy József')],
  ['Győry László relationship', page.includes('Győry László, édesanyám testvére')],
  ['no teaching claim', page.includes('Nem ő tanított meg fényképezni')],
  ['no tomb-led narrative', !page.includes('síremlék') && !english.includes('memorial') && !german.includes('Familiengrab')],
  ['human first-person voice HU', page.includes('Anyai ágon') && page.includes('gondolok rájuk')],
  ['human first-person voice EN', english.includes('On my mother’s side') && english.includes('I do not think of them')],
  ['human first-person voice DE', german.includes('Auf der Seite meiner Mutter') && german.includes('Ich denke bei ihnen nicht')],
  ['structured source record', data.sources?.some((source) => source.type === 'family-tree-document')],
  ['historical context caveat', data.sources?.some((source) => source.type === 'historical-context' && source.publicationNote)],
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
