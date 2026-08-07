import fs from 'node:fs';

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
function visibleText(markup){
  return markup
    .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&nbsp;/g,' ')
    .replace(/&#39;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/\s+/g,' ')
    .trim();
}
for (const [file, expected] of Object.entries(pages)) {
  const html = fs.readFileSync(file, 'utf8');
  if ((html.split('presence-context--intro').length - 1) !== 1) errors.push(file + ': introductory presence block missing or duplicated');
  const headingMatch = html.match(/<h2\b[^>]*id=["']presence-thesis-title["'][^>]*>([\s\S]*?)<\/h2>/i);
  if (!headingMatch) errors.push(file + ': canonical thesis heading missing');
  else if (visibleText(headingMatch[1]) !== expected.heading) errors.push(file + ': canonical thesis heading text changed');
  if (!html.includes('href="' + expected.curators + '"')) errors.push(file + ': curatorial link missing');
  if (!html.includes('href="' + expected.euforia + '"')) errors.push(file + ': EUFÓRIA link missing');
  for (const fact of expected.facts) if (!html.includes(fact)) errors.push(file + ': retained factual example missing: ' + fact);
  if (!html.includes('"dateModified":"2026-08-06"')) errors.push(file + ': schema dateModified not updated');
  for (const required of ['id="works"','id="journey"','id="books"','id="exhibitions"']) if (!html.includes(required)) errors.push(file + ': existing archive section lost: ' + required);
}
const context = JSON.parse(fs.readFileSync('artistic-presence-context.json','utf8'));
if (context.isBasedOn !== 'https://www.norbertbanhalmi.com/presence-thesis.json') errors.push('artistic-presence-context.json: canonical source mismatch');
if (context.headline?.hu !== 'Egész életemben a fotográfián keresztül a jelenlétet kutattam.') errors.push('artistic-presence-context.json: Hungarian thesis mismatch');

// Detailed thesis synchronization belongs in ai.txt and the canonical JSON context.
const ai = fs.readFileSync('ai.txt','utf8');
if ((ai.split('<!-- ART-PRESENCE-THESIS:START -->').length - 1) !== 1) errors.push('ai.txt: machine thesis block missing or duplicated');
if (!ai.includes('https://www.banhalmi.art/artistic-presence-context.json')) errors.push('ai.txt: artistic context source missing');
if (ai.includes('https://blog.banhalmi.art/lang=en-GB')) errors.push('ai.txt: malformed English blog URL remains');

// llms.txt is intentionally a concise agent-entry index: require routing, not a duplicated thesis block.
const llms = fs.readFileSync('llms.txt','utf8');
if (!llms.includes('[Artistic presence context](https://www.banhalmi.art/artistic-presence-context.json)')) errors.push('llms.txt: artistic presence context route missing');
if (!/central lifelong inquiry is presence through photography/i.test(llms)) errors.push('llms.txt: concise presence thesis missing');
if (llms.includes('https://blog.banhalmi.art/lang=en-GB')) errors.push('llms.txt: malformed English blog URL remains');

const manifest = JSON.parse(fs.readFileSync('docs/content-migrations/2026-08-06-art-presence-stage2.json','utf8'));
if (manifest.pages?.length !== 3) errors.push('migration manifest: expected three pages');
if (manifest.pages?.some(item => item.nonTargetContentPreservedExactly !== true || !item.oldBlock || !item.newBlock)) errors.push('migration manifest: preservation evidence incomplete');
if (errors.length) {
  console.error(errors.join(String.fromCharCode(10)));
  process.exit(1);
}
console.log('ART presence thesis stage-two audit passed: three languages, visible thesis text, canonical JSON/AI evidence and concise llms routing are aligned.');
