import fs from 'node:fs';

const errors = [];
const SLOGAN = {
  en: 'Searching for presence my whole life.',
  hu: 'Egész életemben a jelenlétet kerestem.',
  de: 'Ein Leben lang auf der Suche nach Präsenz.'
};
const pages = {
  'index.html': {
    label: `${SLOGAN.en} · Since 1999`,
    curators: '/curators.html',
    euforia: '/exhibitions/euforia.html'
  },
  'hu/index.html': {
    label: `${SLOGAN.hu} · 1999 óta`,
    curators: '/hu/curators.html',
    euforia: '/hu/exhibitions/euforia.html'
  },
  'de-at/index.html': {
    label: `${SLOGAN.de} · Seit 1999`,
    curators: '/de-at/curators.html',
    euforia: '/de-at/exhibitions/euforia.html'
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
  const labelMatch = html.match(/<header class="hero"[\s\S]*?<p class="label">([\s\S]*?)<\/p>/i);
  if (!labelMatch) errors.push(file + ': hero slogan label missing');
  else if (visibleText(labelMatch[1]) !== expected.label) errors.push(file + ': hero slogan label text changed');
  if (!html.includes('href="' + expected.curators + '"')) errors.push(file + ': curatorial link missing');
  if (!html.includes('href="' + expected.euforia + '"')) errors.push(file + ': EUFÓRIA link missing');
  if (!html.includes('"dateModified":"2026-10-31"')) errors.push(file + ': schema dateModified not updated');
  for (const required of ['id="works"','id="journey"','id="books"','id="exhibitions"']) if (!html.includes(required)) errors.push(file + ': existing archive section lost: ' + required);
}
const context = JSON.parse(fs.readFileSync('artistic-presence-context.json','utf8'));
if (context.isBasedOn !== 'https://www.banhalmiphotography.com/presence-thesis.json') errors.push('artistic-presence-context.json: canonical source mismatch');
if (context.headline?.en !== SLOGAN.en) errors.push('artistic-presence-context.json: English thesis mismatch');
if (context.headline?.hu !== SLOGAN.hu) errors.push('artistic-presence-context.json: Hungarian thesis mismatch');
if (context.headline?.de !== SLOGAN.de) errors.push('artistic-presence-context.json: German thesis mismatch');
if (!Array.isArray(context.examplesPreservedFromHomepageNarrative) || context.examplesPreservedFromHomepageNarrative.length < 5) errors.push('artistic-presence-context.json: retained factual examples missing');
const ai = fs.readFileSync('ai.txt','utf8');
if ((ai.split('<!-- ART-PRESENCE-THESIS:START -->').length - 1) !== 1) errors.push('ai.txt: machine thesis block missing or duplicated');
if (!ai.includes('https://www.banhalmi.art/artistic-presence-context.json')) errors.push('ai.txt: artistic context source missing');
if (!ai.includes(`- EN: ${SLOGAN.en}`)) errors.push('ai.txt: English thesis line missing');
if (ai.includes('https://blog.banhalmi.art/en')) errors.push('ai.txt: malformed English blog URL remains');

// llms.txt is intentionally a concise agent-entry index: require routing, not a duplicated thesis block.
const llms = fs.readFileSync('llms.txt','utf8');
if (!llms.includes('[Artistic presence context](https://www.banhalmi.art/artistic-presence-context.json)')) errors.push('llms.txt: artistic presence context route missing');
if (!/central lifelong inquiry is the search for presence/i.test(llms)) errors.push('llms.txt: concise presence thesis missing');
if (llms.includes('https://blog.banhalmi.art/en')) errors.push('llms.txt: malformed English blog URL remains');

const manifest = JSON.parse(fs.readFileSync('docs/content-migrations/2026-08-06-art-presence-stage2.json','utf8'));
if (manifest.pages?.length !== 3) errors.push('migration manifest: expected three pages');
if (manifest.pages?.some(item => item.nonTargetContentPreservedExactly !== true || !item.oldBlock || !item.newBlock)) errors.push('migration manifest: preservation evidence incomplete');
if (errors.length) {
  console.error(errors.join(String.fromCharCode(10)));
  process.exit(1);
}
console.log('ART presence thesis stage-two audit passed: three languages, visible hero slogan, canonical JSON/AI evidence and concise llms routing are aligned.');
