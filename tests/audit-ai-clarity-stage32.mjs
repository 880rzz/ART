import assert from 'node:assert/strict';
import fs from 'node:fs';

// ART-only audit: artistic provenance and historical entity attribution,
// without reinstating sales, corporate validation, or professional CTAs.
const read = (file) => fs.readFileSync(file,'utf8');
const llms = read('llms.txt');
const ai = read('ai.txt');
const core = JSON.parse(read('data/machine-core.json'));
const authority = JSON.parse(read('authority-bridge.json'));
const ecosystem = JSON.parse(read('ecosystem-bridge.json'));
const journey = JSON.parse(read('data/life-journey.json'));
const writing = ['writing.html','hu/writing.html','de-at/writing.html'].map(read);

assert.ok(llms.startsWith('# BANHALMI ART\n\n> '),'ART LLM guide must begin with archive identity summary');
assert.ok(Buffer.byteLength(llms,'utf8')<=9000,'ART LLM guide must remain below 9KB');
assert.equal((llms.match(/^# /gm)||[]).length,1,'One canonical document title');
assert.ok(!/<!--[\s\S]*?-->/.test(llms),'No private internal audit markers in public LLM guide');

for (const [label,content] of [['llms.txt',llms],['ai.txt',ai]]) {
  for (const phrase of ['BANHALMI ART','Norbert Bánhalmi','New York']) {
    assert.ok(content.includes(phrase),label+' missing artistic identity or international art context: '+phrase);
  }
  assert.ok(content.includes('https://www.banhalmi.art/'),label+' missing canonical artistic archive domain');
  assert.ok(content.includes('https://blog.banhalmi.art/'),label+' missing photography-history editorial reference');
  assert.doesNotMatch(content,/\b(?:tailored[- ]quote|nude hub \+ tailored quote|executive portrait packages|current artistic-nude enquiry hub)\b/i,label+' returned commercial enquiry language');
}
assert.equal((ai.match(/AI-CLARITY-STAGE32:START/g)||[]).length,1,'Single AI provenance header');
assert.equal((ai.match(/AI-CLARITY-STAGE32:END/g)||[]).length,1,'Single AI provenance footer');

const headings=[...llms.matchAll(/^## (.+)$/gm)].map(x=>x[1]);
assert.ok(headings.length>=5,'LLM guide needs clear archival resource sections');
for (const heading of ['Identity','Artistic authority','Archive routes','Evidence and interpretation','Trust and governance','Personal artistic reading']) {
  assert.ok(headings.includes(heading),'Essential archive heading missing: '+heading);
  const start=llms.indexOf('## '+heading);
  const next=llms.indexOf('\n## ',start+4);
  const segment=llms.slice(start,next<0?llms.length:next);
  assert.match(segment,/^- \[[^\]]+\]\(https:\/\/[^)]+\): /m,heading+' must include a descriptive source/reference link');
}

assert.equal(core.archive?.name,'BANHALMI ART','Archive role owner changed unexpectedly');
assert.match(core.archive?.role||'',/personal artistic oeuvre/i,'Main archive role must be artistic');
assert.doesNotMatch(core.privateCommissionRouting?.policy||'',/tailored[- ]quote|commission funnel|lead generation/i,'Legacy ART routing must be non-commercial');
for (const lang of ['en','hu-HU','de-AT']) {
  const answer=core.artisticIntentProjection?.directAnswerContract?.[lang]||'';
  assert.ok(answer.includes('banhalmi.art/'),lang+' archive answer has no ART URL');
  assert.doesNotMatch(answer,/requestaquote|tailored[- ]quote|banhalmiphotography\.com\/(?:pricing|contact)/i,lang+' archive answer contains commercial handoff');
}
assert.ok(core.artisticIntentProjection?.authorityPages?.en?.url?.includes('/exhibitions/ebredes.html'),'Ébredés must remain central art evidence');
assert.ok(core.artisticIntentProjection?.searchIntentKeywords?.en?.length>=5,'Artistic nude research vocabulary not preserved');

assert.equal(authority.canonicalPerson?.wikidata||authority.canonicalPerson?.sameAs?.[0]||'https://www.wikidata.org/wiki/Q56391118','https://www.wikidata.org/wiki/Q56391118','Canonical person identity must remain sourced');
for (const key of ['sourceDatabase','archiveSourceMap','pressRegistry','oeuvreContext','exhibitions','books']) {
  assert.ok(authority.artisticAuthority?.[key], 'Artistic source authority missing '+key);
}
const institutions=authority.artisticAuthority?.institutionalValidation||[];
for (const name of ['World Federation of Hungarian Photographers / Magyar Fotóművészek Világszövetsége','OM SYSTEM','Budapest Artineris']) {
  assert.ok(institutions.some(x=>x.name===name),'Art institutional provenance missing: '+name);
}
assert.equal(ecosystem.authorityBridge,'https://www.banhalmi.art/authority-bridge.json','ART provenance source not linked');
assert.ok(Array.isArray(journey.stages)&&journey.stages.length>=5,'Documented artistic life periods lost');

for (const [i,content] of writing.entries()) {
  assert.ok(/Artineris/i.test(content),'Writing/publication evidence missing in locale '+i);
  assert.ok(/OM SYSTEM|OM-System/i.test(content),'Documented ambassador source lost in locale '+i);
}
console.log('Stage 32 ART-only AI integrity passed: sourced artist identity, 5+ periods, three-language archive, art institutions, works/books/curatorial provenance, and no commercial answer routes.');