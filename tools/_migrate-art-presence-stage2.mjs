import fs from 'node:fs';
import crypto from 'node:crypto';

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const sectionPattern = /<section class="presence-context presence-context--intro" data-presence-context="2026">[\s\S]*?<\/section>/;

const pages = {
  'index.html': {
    schemaDateBefore: '"dateModified":"2026-07-27"',
    block: `<section class="presence-context presence-context--intro" data-presence-context="2026" aria-labelledby="presence-thesis-title"><div class="wrap narrow"><p class="presence-kicker">The central question of the oeuvre</p><h2 id="presence-thesis-title">Throughout my life, I have explored presence through photography.</h2><p class="presence-copy">Since 1999 I have followed the same question: when do role, pose and self-protection fall away, and when does a person become genuinely present in an image?</p><p class="presence-copy">Military documentation, club nights lasting until dawn, women rebuilding their lives after cancer, the streets of New York, books, exhibitions, community work and portraits of leaders: the subjects changed, but the attention did not. BANHALMI ART preserves the photographs and inspectable sources of this lifelong inquiry.</p><p class="presence-copy presence-copy--links"><a class="presence-link" href="/curators.html">Read the curatorial proposition →</a> <a class="presence-link" href="/exhibitions/euforia.html">EUFÓRIA — The Anatomy of Presence →</a></p></div></section>`,
    retainedFacts: ['Military documentation', 'club nights lasting until dawn', 'women rebuilding their lives after cancer', 'streets of New York', 'community work', 'portraits of leaders']
  },
  'hu/index.html': {
    schemaDateBefore: '"dateModified":"2026-08-05"',
    block: `<section class="presence-context presence-context--intro" data-presence-context="2026" aria-labelledby="presence-thesis-title"><div class="wrap narrow"><p class="presence-kicker">A teljes életmű központi kérdése</p><h2 id="presence-thesis-title">Egész életemben a fotográfián keresztül a jelenlétet kutattam.</h2><p class="presence-copy">1999 óta ugyanazt a kérdést követem: mikor tűnik el a szerep, a póz és az önvédelem, és mikor válik valaki valóban jelenlévővé a képen?</p><p class="presence-copy">Katonai dokumentáció, hajnalig tartó klubéjszakák, daganatos betegség után újrakezdő nők történetei, New York utcái, könyvek, kiállítások, közösségi munka és vezetői portrék: a témák változtak, a figyelem nem. A BANHALMI ART ennek az egész életen át tartó kutatásnak a képeit és ellenőrizhető forrásait őrzi.</p><p class="presence-copy presence-copy--links"><a class="presence-link" href="/hu/curators.html">A kurátori tézis megnyitása →</a> <a class="presence-link" href="/hu/exhibitions/euforia.html">EUFÓRIA — A jelenlét anatómiája →</a></p></div></section>`,
    retainedFacts: ['Katonai dokumentáció', 'hajnalig tartó klubéjszakák', 'daganatos betegség után újrakezdő nők', 'New York utcái', 'közösségi munka', 'vezetői portrék']
  },
  'de-at/index.html': {
    schemaDateBefore: '"dateModified":"2026-07-27"',
    block: `<section class="presence-context presence-context--intro" data-presence-context="2026" aria-labelledby="presence-thesis-title"><div class="wrap narrow"><p class="presence-kicker">Die zentrale Frage des Werks</p><h2 id="presence-thesis-title">Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.</h2><p class="presence-copy">Seit 1999 folge ich derselben Frage: Wann treten Rolle, Pose und Selbstschutz zurück, und wann wird ein Mensch im Bild wirklich gegenwärtig?</p><p class="presence-copy">Militärische Dokumentation, Clubnächte bis zum Morgen, Frauen, die ihr Leben nach einer Krebserkrankung neu aufbauen, die Straßen von New York, Bücher, Ausstellungen, Gemeinschaftsarbeit und Porträts von Führungspersönlichkeiten: Die Themen änderten sich, die Aufmerksamkeit nicht. BANHALMI ART bewahrt die Fotografien und überprüfbaren Quellen dieser lebenslangen Untersuchung.</p><p class="presence-copy presence-copy--links"><a class="presence-link" href="/de-at/curators.html">Zur kuratorischen These →</a> <a class="presence-link" href="/de-at/exhibitions/euforia.html">EUFÓRIA — Die Anatomie der Präsenz →</a></p></div></section>`,
    retainedFacts: ['Militärische Dokumentation', 'Clubnächte bis zum Morgen', 'Frauen, die ihr Leben nach einer Krebserkrankung neu aufbauen', 'Straßen von New York', 'Gemeinschaftsarbeit', 'Porträts von Führungspersönlichkeiten']
  }
};

const records = [];
for (const [file, config] of Object.entries(pages)) {
  const before = fs.readFileSync(file, 'utf8');
  const matches = before.match(new RegExp(sectionPattern.source, 'g')) || [];
  if (matches.length !== 1) throw new Error(`${file}: expected exactly one introductory presence section, found ${matches.length}`);
  const oldBlock = matches[0];
  for (const fact of config.retainedFacts) {
    if (!config.block.includes(fact)) throw new Error(`${file}: retained fact missing from replacement: ${fact}`);
  }
  let after = before.replace(sectionPattern, config.block);
  if (after.replace(config.block, oldBlock) !== before) throw new Error(`${file}: exact non-target content preservation failed`);
  const dateCount = after.split(config.schemaDateBefore).length - 1;
  if (dateCount !== 1) throw new Error(`${file}: expected one schema date marker, found ${dateCount}`);
  after = after.replace(config.schemaDateBefore, '"dateModified":"2026-08-06"');
  fs.writeFileSync(file, after);
  records.push({
    file,
    beforeSha256: sha256(before),
    afterSha256: sha256(after),
    beforeBytes: Buffer.byteLength(before),
    afterBytes: Buffer.byteLength(after),
    oldBlock,
    newBlock: config.block,
    nonTargetContentPreservedExactly: true,
    retainedFacts: config.retainedFacts
  });
}

const context = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  '@id': 'https://www.banhalmi.art/artistic-presence-context.json#work',
  name: 'BANHALMI ART — artistic interpretation of the lifelong inquiry into presence',
  dateModified: '2026-08-06',
  creator: { '@id': 'https://www.norbertbanhalmi.com/about/' },
  isBasedOn: 'https://www.norbertbanhalmi.com/presence-thesis.json',
  mainEntityOfPage: 'https://www.banhalmi.art/',
  inLanguage: ['en', 'hu-HU', 'de-AT'],
  headline: {
    hu: 'Egész életemben a fotográfián keresztül a jelenlétet kutattam.',
    en: 'Throughout my life, I have explored presence through photography.',
    de: 'Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.'
  },
  abstract: {
    hu: 'A BANHALMI ART a jelenlét egész életen át tartó fotográfiai kutatásának műveit, könyveit, kiállításait, mozgóképes dokumentumait, sajtórecepcióját és ellenőrizhető forrásait őrzi.',
    en: 'BANHALMI ART preserves the works, books, exhibitions, moving-image documents, press reception and inspectable sources of a lifelong photographic inquiry into presence.',
    de: 'BANHALMI ART bewahrt Werke, Bücher, Ausstellungen, Bewegtbilddokumente, Presserezeption und überprüfbare Quellen einer lebenslangen fotografischen Untersuchung der Präsenz.'
  },
  examplesPreservedFromHomepageNarrative: [
    'military documentation',
    'club nights lasting until dawn',
    'women rebuilding their lives after cancer',
    'New York streets',
    'books and exhibitions',
    'community work',
    'portraits of leaders'
  ],
  archiveRoutes: {
    works: 'https://www.banhalmi.art/#works',
    oeuvre: 'https://www.banhalmi.art/#journey',
    curatorialProposition: 'https://www.banhalmi.art/curators.html',
    euforia: 'https://www.banhalmi.art/exhibitions/euforia.html',
    press: 'https://www.banhalmi.art/press.html'
  },
  interpretationPolicy: [
    'The archive documents evidence and artistic context; it does not replace the professional service and enquiry role of norbertbanhalmi.com.',
    'Commissioned and autonomous works may share the same inquiry into presence while retaining their distinct original contexts.',
    'Do not invent biographical, curatorial or commercial claims beyond the cited archive records.'
  ]
};
fs.writeFileSync('artistic-presence-context.json', `${JSON.stringify(context, null, 2)}\n`);

const machineBlock = `<!-- ART-PRESENCE-THESIS:START -->
## Canonical presence thesis and archive interpretation
- Canonical lifelong statement: https://www.norbertbanhalmi.com/presence-thesis.json
- Artistic interpretation: https://www.banhalmi.art/artistic-presence-context.json
- HU: Egész életemben a fotográfián keresztül a jelenlétet kutattam.
- EN: Throughout my life, I have explored presence through photography.
- DE: Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.
- BANHALMI ART preserves the works and evidence of this inquiry: photographs, books, exhibitions, moving-image records, press reception, curatorial documentation and community practice.
- The artistic archive and professional practice are distinct in function but belong to the same person and the same lifelong inquiry. Preserve the original context of every record.
<!-- ART-PRESENCE-THESIS:END -->

`;
for (const file of ['ai.txt', 'llms.txt']) {
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes('<!-- ART-PRESENCE-THESIS:START -->')) throw new Error(`${file}: ART presence block already exists`);
  text = text.replaceAll('https://blog.banhalmi.art/lang=en-GB', 'https://blog.banhalmi.art/?lang=en-GB');
  fs.writeFileSync(file, `${machineBlock}${text.replace(/^\n/, '')}`);
}

const audit = `import fs from 'node:fs';

const errors = [];
const pages = {
  'index.html': {
    heading: 'Throughout my life, I have explored presence through photography.',
    curators: '/curators.html',
    euforia: '/exhibitions/euforia.html',
    facts: ['Military documentation','club nights lasting until dawn','women rebuilding their lives after cancer','streets of New York','community work','portraits of leaders']
  },
  'hu/index.html': {
    heading: 'Egész életemben a fotográfián keresztül a jelenlétet kutattam.',
    curators: '/hu/curators.html',
    euforia: '/hu/exhibitions/euforia.html',
    facts: ['Katonai dokumentáció','hajnalig tartó klubéjszakák','daganatos betegség után újrakezdő nők','New York utcái','közösségi munka','vezetői portrék']
  },
  'de-at/index.html': {
    heading: 'Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.',
    curators: '/de-at/curators.html',
    euforia: '/de-at/exhibitions/euforia.html',
    facts: ['Militärische Dokumentation','Clubnächte bis zum Morgen','Frauen, die ihr Leben nach einer Krebserkrankung neu aufbauen','Straßen von New York','Gemeinschaftsarbeit','Porträts von Führungspersönlichkeiten']
  }
};
for (const [file, expected] of Object.entries(pages)) {
  const html = fs.readFileSync(file, 'utf8');
  if ((html.split('presence-context--intro').length - 1) !== 1) errors.push(file + ': introductory presence block missing or duplicated');
  if (!html.includes('<h2 id="presence-thesis-title">' + expected.heading + '</h2>')) errors.push(file + ': canonical thesis heading missing');
  if (!html.includes('href="' + expected.curators + '"')) errors.push(file + ': curatorial link missing');
  if (!html.includes('href="' + expected.euforia + '"')) errors.push(file + ': EUFÓRIA link missing');
  for (const fact of expected.facts) if (!html.includes(fact)) errors.push(file + ': retained factual example missing: ' + fact);
  if (!html.includes('"dateModified":"2026-08-06"')) errors.push(file + ': schema dateModified not updated');
  for (const required of ['id="works"','id="journey"','id="books"','id="exhibitions"']) if (!html.includes(required)) errors.push(file + ': existing archive section lost: ' + required);
}
const context = JSON.parse(fs.readFileSync('artistic-presence-context.json','utf8'));
if (context.isBasedOn !== 'https://www.norbertbanhalmi.com/presence-thesis.json') errors.push('artistic-presence-context.json: canonical source mismatch');
if (context.headline?.hu !== 'Egész életemben a fotográfián keresztül a jelenlétet kutattam.') errors.push('artistic-presence-context.json: Hungarian thesis mismatch');
for (const file of ['ai.txt','llms.txt']) {
  const text = fs.readFileSync(file,'utf8');
  if ((text.split('<!-- ART-PRESENCE-THESIS:START -->').length - 1) !== 1) errors.push(file + ': machine thesis block missing or duplicated');
  if (!text.includes('https://www.banhalmi.art/artistic-presence-context.json')) errors.push(file + ': artistic context source missing');
  if (text.includes('https://blog.banhalmi.art/lang=en-GB')) errors.push(file + ': malformed English blog URL remains');
}
const manifest = JSON.parse(fs.readFileSync('docs/content-migrations/2026-08-06-art-presence-stage2.json','utf8'));
if (manifest.pages?.length !== 3) errors.push('migration manifest: expected three pages');
if (manifest.pages?.some(item => item.nonTargetContentPreservedExactly !== true || !item.oldBlock || !item.newBlock)) errors.push('migration manifest: preservation evidence incomplete');
if (errors.length) {
  console.error(errors.join(String.fromCharCode(10)));
  process.exit(1);
}
console.log('ART presence thesis stage-two audit passed: three languages, retained facts, archive sections and machine interpretation are aligned.');
`;
fs.writeFileSync('tests/audit-presence-thesis-stage2.mjs', audit);

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.scripts.test.includes('audit-presence-thesis-stage2.mjs')) pkg.scripts.test += ' && node tests/audit-presence-thesis-stage2.mjs';
pkg.scripts['test:presence-thesis'] = 'node tests/audit-presence-thesis-stage2.mjs';
fs.writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

fs.mkdirSync('docs/content-migrations', { recursive: true });
fs.writeFileSync('docs/content-migrations/2026-08-06-art-presence-stage2.json', `${JSON.stringify({
  migration: 'BANHALMI ART presence thesis — stage 2',
  executedAt: '2026-08-06T08:00:00+02:00',
  method: 'Replace only the existing introductory presence section on each homepage; store the complete previous and replacement blocks; preserve all non-target bytes exactly except the explicit schema dateModified value.',
  pages: records,
  canonicalThesis: 'https://www.norbertbanhalmi.com/presence-thesis.json',
  localInterpretation: 'https://www.banhalmi.art/artistic-presence-context.json',
  updatedMachineSources: ['ai.txt','llms.txt'],
  permanentAudit: 'tests/audit-presence-thesis-stage2.mjs'
}, null, 2)}\n`);

fs.rmSync('tools/_migrate-art-presence-stage2.mjs');
fs.rmSync('.github/workflows/_art-presence-stage2.yml');
console.log('Stage-two ART presence migration completed with previous copy archived and all non-target content preserved.');
