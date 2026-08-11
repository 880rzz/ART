import { readFile } from 'node:fs/promises';

const css = await readFile('assets/css/homepage-two-tone-authority.css', 'utf8');
const errors = [];

for (const token of [
  'STAGE99-EDITORIAL-BREATHING-ROOM:START',
  'main .timeline[data-chronology]>.t-item{',
  'padding-inline:clamp(1.25rem,2.5vw,2rem)!important',
  'main :is(.label,.eyebrow,.presence-kicker,.era-no,.period-no){',
  'line-height:1.5!important',
  'STAGE100-CURATOR-WIDE-EDITORIAL-GRID:START',
  'main>section.wrap.narrow:first-of-type{',
  'grid-template-columns:minmax(15rem,.62fr) minmax(0,1.38fr)!important',
  'main>section.wrap.narrow:first-of-type>:is(h2,h3){',
  'main>section.wrap.narrow:first-of-type>:is(p,ul){'
]) {
  if (!css.includes(token)) errors.push(`Editorial breathing-room contract missing: ${token}`);
}

if (errors.length) {
  console.error('Stage99 editorial breathing-room audit failed:');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}

console.log('Stage99 passed: chronology cells keep responsive side padding and small editorial labels keep premium 1.5 leading.');
