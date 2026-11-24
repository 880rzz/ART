import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (file) => fs.readFileSync(file, 'utf8');
const narrative = JSON.parse(read('artistic-presence-context.json')).artistNarrative;
const core = JSON.parse(read('data/machine-core.json'));
assert.equal(core.evidence.artisticPresenceContext, 'https://www.banhalmi.art/artistic-presence-context.json');
assert.deepEqual(Object.keys(narrative.languageSummaries).sort(), ['de-AT','en','hu']);
for (const [locale, prefix, disclaimer] of [
  ['en', '', 'not a political statement'],
  ['hu', 'hu/', 'nem politikai állásfoglalás'],
  ['de-AT', 'de-at/', 'keine politische Stellungnahme']
]) {
  const archive = (id, html) => {
    const groups = [...html.matchAll(new RegExp('<p\\b[^>]*data-artist-presence="' + id + '"[^>]*>([\\s\\S]*?)</p>', 'g'))];
    assert.equal(groups.length, 1, locale + ': unique ' + id);
    return groups[0][1];
  };
  const home = read(prefix + 'index.html');
  const curator = read(prefix + 'curators.html');
  const awakening = read(prefix + 'exhibitions/ebredes.html');
  const euforia = read(prefix + 'exhibitions/euforia.html');
  for (const slug of ['merfoldkovek1956', 'ebredes', 'euforia']) {
    assert.ok(archive('overview', home).includes('/' + prefix + 'exhibitions/' + slug + '.html'), locale + ': localized overview link to ' + slug);
  }
  const context = archive('career', curator);
  assert.ok(archive('identity', curator).includes('/' + prefix + 'exhibitions/merfoldkovek1956.html'));
  for (const suffix of ['#books', 'books/book-meses-konyv.html', 'exhibitions/touch-wien.html', 'exhibitions/femmefatale.html', 'exhibitions/euforia.html#euforia-work-peter']) {
    assert.ok(context.includes('href="/' + prefix + suffix + '"'), locale + ': contextual link to ' + suffix);
  }
  assert.ok(archive('awakening', awakening).includes('href="femmefatale.html"'));
  const reading = archive('charisma', euforia);
  assert.ok(reading.includes('href="#euforia-work-peter"') && reading.includes(disclaimer));
  assert.ok(euforia.indexOf('data-artist-presence="charisma"') < euforia.indexOf('id="euforia-work-peter"'), locale + ': artistic reading in project intro only');
  assert.equal(narrative.sourcePages[locale], 'https://www.banhalmi.art/' + prefix + 'curators.html');
  assert.ok(Object.values(narrative.languageSummaries[locale]).every((text) => text.length > 70));
}
console.log('ART author-attributed narrative, 3L links, artistic-reading boundary and machine index pass.');
