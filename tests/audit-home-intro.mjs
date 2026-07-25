import { readFile } from 'node:fs/promises';

const intro = JSON.parse(await readFile(new URL('../data/archive/home-intro.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const combined = [
  intro.hero.label,
  intro.hero.subtitle,
  intro.statement.label,
  intro.statement.text,
  intro.works.label,
  intro.works.title,
  intro.works.lead,
].join(' ');

const checks = [
  ['archive positioning', intro.hero.label.includes('művészeti archívum')],
  ['geographic continuity', ['Budapest', 'Bécs', 'New York'].every((place) => intro.hero.subtitle.includes(place))],
  ['trust-centered portrait statement', intro.statement.text.includes('bizalom') && intro.statement.text.includes('kép marad')],
  ['not generic best-of title', intro.works.title === 'Válogatás az archívumból'],
  ['documentary framing', intro.works.lead.includes('kulturális dokumentumok') && intro.works.lead.includes('pontosan')],
  ['no mythology language', !/küldetés|zseni|dinasztia|végzet|ikonikus|legendás/iu.test(combined)],
  ['no sales-first language', !/foglalj|ajánlat|csomag|kedvezmény|vásárlás/iu.test(combined)],
  ['data-driven integration', integration.includes('HOME_INTRO_PATH') && integration.includes('homeIntro.statement.text')],
  ['required replacement safety', integration.includes('replaceRequired')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A főoldali nyitó narratíva audit ${failed.length} hibát talált.`);
}
