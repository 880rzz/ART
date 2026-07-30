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
  ['official archive positioning', intro.hero.label.includes('Hivatalos') && intro.hero.label.includes('életmű-archívum')],
  ['transformation narrative', ['dokumentációból portré', 'könyv', 'kiállítás'].every((term) => intro.hero.subtitle.includes(term))],
  ['central oeuvre thesis', intro.statement.text.includes('dokumentáció fotográfiává') && intro.statement.text.includes('összefüggő életművé')],
  ['context before gallery', intro.editorialPrinciples.some((rule) => rule.includes('előbb értelmezési keretet'))],
  ['not generic best-of title', intro.works.title === 'Válogatás az archívumból'],
  ['record-network framing', ['projektekhez', 'könyvekhez', 'kiállításokhoz', 'rekordokként'].every((term) => combined.includes(term))],
  ['no mythology language', !/küldetés|zseni|dinasztia|végzet|ikonikus|legendás/iu.test(combined)],
  ['no sales-first language', !/foglalj|ajánlat|csomag|kedvezmény|vásárlás/iu.test(combined)],
  ['data-driven integration', integration.includes('HOME_INTRO_PATH') && integration.includes('homeIntro.statement.text')],
  ['idempotent integration without stale early return', !integration.includes("html.includes('data-presence-context=\"2026\"')")],
  ['journey menu is not domain-led', integration.includes('könyveken, kiállításokon és közösségi munkán át') && !integration.includes('négy domainből felépülő mai rendszerig')],
  ['required replacement safety', integration.includes('replaceRequired')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A főoldali nyitó narratíva audit ${failed.length} hibát talált: ${failed.map(([name]) => name).join(', ')}`);
}
