import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['.git','node_modules','_site','test-results','playwright-report'].includes(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
walk(root);

let analyticsPages = 0;
for (const file of files) {
  const rel = path.relative(root,file);
  const html = fs.readFileSync(file,'utf8');
  if (html.includes('G-90C452LJKQ')) {
    analyticsPages++;
    for (const token of [
      "analytics_storage':'denied'",
      "ad_storage':'denied'",
      "ad_user_data':'denied'",
      "ad_personalization':'denied'",
      "personalization_storage':'denied'",
      "allow_google_signals':false",
      "allow_ad_personalization_signals':false",
      '180*24*60*60*1000'
    ]) if (!html.includes(token)) errors.push(`${rel}: consent-first GA hardening missing ${token}`);
    const loader = html.indexOf('googletagmanager.com/gtag/js');
    const gate = html.indexOf("if(c==='granted')");
    if (loader >= 0 && (gate < 0 || loader < gate)) errors.push(`${rel}: Google Analytics loader is reachable before explicit consent`);
    if (!/norbertbanhalmi\.com\/(?:hu\/|de-at\/)?(?:privacy-policy|privacy|adatvedelem|datenschutz)/i.test(html)) errors.push(`${rel}: authoritative privacy route missing`);
  }

  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  for (const raw of blocks) {
    let json;
    try { json=JSON.parse(raw); } catch(e) { errors.push(`${rel}: invalid JSON-LD: ${e.message}`); continue; }
    const graph = Array.isArray(json?.['@graph']) ? json['@graph'] : [json];
    for (const node of graph) {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      if (!types.includes('Person')) continue;
      const memberNames=(node.memberOf||[]).map(x=>typeof x==='string'?x:(x?.name||'')).join(' | ');
      if (/OM SYSTEM|Olympus/i.test(memberNames)) errors.push(`${rel}: OM SYSTEM ambassador relationship must not be represented as memberOf`);
      const aff=(node.affiliation||[]).map(x=>typeof x==='string'?x:(x?.name||x?.['@id']||'')).join(' | ');
      if (!/OM SYSTEM/i.test(aff)) errors.push(`${rel}: canonical Person missing OM SYSTEM affiliation`);
    }
  }
  if (/New York[^<]{0,80}(headquarters|studio|operational base)/i.test(html)) errors.push(`${rel}: New York falsely framed as an operational base`);
}
if (analyticsPages < 80) errors.push(`analytics coverage unexpectedly low: ${analyticsPages}`);

const ai=fs.readFileSync('ai.txt','utf8');
const llms=fs.readFileSync('llms.txt','utf8');
for (const text of [ai,llms]) {
  if (!text.includes('https://www.norbertbanhalmi.com/trust/')) errors.push('AI discovery layer missing authoritative Trust Center route');
  if (!/Article 50/i.test(text)) errors.push('AI discovery layer missing EU AI Act Article 50 transparency policy');
  if (!/human editorial/i.test(text)) errors.push('AI discovery layer missing human editorial-control policy');
}
for (const required of ['https://www.norbertbanhalmi.com/privacy-policy/','https://www.norbertbanhalmi.com/impressum/']) {
  if (!ai.includes(required)) errors.push(`ai.txt missing authoritative legal route ${required}`);
}

const entity=fs.readFileSync('entity.jsonld','utf8');
if (!entity.includes('https://www.norbertbanhalmi.com/#organization')) errors.push('entity.jsonld missing canonical business publisher');
if (/New York[^\n]{0,100}(headquarters|operational base|studio)/i.test(entity)) errors.push('entity.jsonld falsely frames New York as operational base');

if (errors.length) {
  console.error('STAGE 48 STRICT ARCHIVE TRUST / GA / SCHEMA / LLM AUDIT FAILED');
  for (const e of errors) console.error('-',e);
  process.exit(1);
}
console.log(`Stage 48 strict archive trust/GA/schema/LLM audit passed across ${files.length} HTML files and ${analyticsPages} consent-controlled pages.`);
