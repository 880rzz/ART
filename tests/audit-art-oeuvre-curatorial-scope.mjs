import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const locales = [
  {prefix: '', community: 'community.html', curator: 'curators.html', photo: 'Hungarian School Vienna', rege: 'Rege Gallery', vipach: 'VIPACH'},
  {prefix: 'hu/', community: 'hu/community.html', curator: 'hu/curators.html', photo: 'Bécsi Magyar Iskola', rege: 'Rege Galéria', vipach: 'VIPACH'},
  {prefix: 'de-at/', community: 'de-at/community.html', curator: 'de-at/curators.html', photo: 'Ungarische Schule Wien', rege: 'Rege Galerie', vipach: 'VIPACH'}
];
for (const locale of locales) {
  const html = read(locale.community);
  assert.ok(!/Be Smart Kids Club/i.test(html), locale.community + ': digital programme must not be promoted in ART HTML, metadata or JSON-LD');
  const start = html.indexOf('<div class="timeline u-mt-xl" data-chronology="catalogue">');
  assert.ok(start >= 0, locale.community + ': community timeline lost');
  const end = html.indexOf('</section>', start);
  const timeline = html.slice(start, end);
  assert.equal((timeline.match(/<div class="t-item">/g) || []).length, 5, locale.community + ': preserve five photography/art chronology records');
  for (const value of [locale.rege, locale.vipach, locale.photo]) {
    assert.ok(timeline.includes(value), locale.community + ': documented artistic/photography history lost: ' + value);
  }

  const curator = read(locale.curator);
  const iv = curator.split('id="period-iv"')[1]?.split('id="period-v"')[0] || '';
  const v = curator.split('id="period-v"')[1]?.split('</article>')[0] || '';
  assert.ok(iv && v, locale.curator + ': IV/V chronology lost');
  assert.ok(/2019.?2022/.test(iv) && /2023/.test(v), locale.curator + ': dated artistic period roles lost');
  assert.ok(!/brand partnerships|márka-együttműködések|Markenkooperationen/i.test(iv), locale.curator + ': commercial brand positioning returned');
  assert.ok(!/portraits of leaders|vezetői portrék|Porträts von Führungskräften/i.test(v), locale.curator + ': commissioned executive portrayal returned');
  assert.ok(iv.includes('Mesés könyv') && iv.includes('menopauza'), locale.curator + ': book context lost');
}
const graph = JSON.parse(read('knowledge-graph.jsonld'));
assert.ok(!JSON.stringify(graph).includes('be-smart-kids-club'), 'Non-art digital education entity leaked into the public ART machine graph');
assert.ok(JSON.stringify(graph).includes('VIPACH') && JSON.stringify(graph).includes('Rege'), 'Photographic cultural entities were lost');
const dossier = JSON.parse(read('life-work-source-dossier.json'));
assert.ok(!JSON.stringify(dossier).includes('be-smart-kids-club'), 'Non-art digital education entity leaked into the ART life-work dossier');
assert.equal(dossier.entityCount, Object.keys(dossier.canonicalInternalEntities).length, 'Life-work dossier entity-count mismatch');
assert.ok(JSON.stringify(dossier).includes('vipach') && JSON.stringify(dossier).includes('rege'), 'Art community documentary links lost');
console.log('ART art-only curatorial scope verified: EN/HU/de-AT cultural history, IV/V periods and machine evidence.');
