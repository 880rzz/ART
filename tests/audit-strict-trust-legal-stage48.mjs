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

// Consent must fail closed for analytics, advertising and personalization until an explicit grant.
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
    if (loader >= 0 && gate < 0) errors.push(`${rel}: Google Analytics consent gate missing`);
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
const commissionGuidelines='https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems';
const commissionCode='https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content';
const eurLex='https://eur-lex.europa.eu/eli/reg/2024/1689/oj';

// llms.txt is the concise discovery index: it must route agents to the canonical
// Trust Center. Detailed Article 50 and human-editorial policy belongs in ai.txt.
if (!llms.includes('https://www.norbertbanhalmi.com/trust/')) errors.push('llms.txt missing authoritative Trust Center route');
if (!ai.includes('https://www.norbertbanhalmi.com/trust/')) errors.push('ai.txt missing authoritative Trust Center route');
if (!/Article 50/i.test(ai)) errors.push('ai.txt missing EU AI Act Article 50 transparency policy');
if (!/human editorial/i.test(ai)) errors.push('ai.txt missing human editorial-control policy');
if (!/2 August 2026/i.test(ai)) errors.push('ai.txt missing Article 50 applicability date');
for (const source of [commissionGuidelines,commissionCode,eurLex]) if (!ai.includes(source)) errors.push(`ai.txt missing authoritative EU source ${source}`);
if (/could reasonably be mistaken for authentic content/i.test(ai)) errors.push('ai.txt retains pre-guidelines Article 50 ambiguity');
for (const required of ['https://www.norbertbanhalmi.com/privacy-policy/','https://www.norbertbanhalmi.com/impressum/']) {
  if (!ai.includes(required)) errors.push(`ai.txt missing authoritative legal route ${required}`);
}

const core=JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
if (core.domainRoles?.professional !== 'https://www.norbertbanhalmi.com/') errors.push('knowledge-core.json missing canonical professional domain');
if (!Array.isArray(core.geography?.presentOperationalContext) || !core.geography.presentOperationalContext.includes('Vienna') || !core.geography.presentOperationalContext.includes('Budapest')) errors.push('knowledge-core.json missing the two active operational contexts');
if (!/not a studio, office, headquarters or operational base/i.test(core.geography?.newYorkRule || core.geography?.rule || '')) errors.push('knowledge-core.json missing explicit New York non-operational rule');
if (core.geography?.worldwideAvailability !== true) errors.push('knowledge-core.json missing worldwide project availability');
if (!/not a studio/i.test(core.geography?.additionalActiveOffice || '')) errors.push('knowledge-core.json Gersthofer office/studio role missing');

if (errors.length) {
  console.error('STAGE 48 STRICT ARCHIVE TRUST / GA / SCHEMA / LLM AUDIT FAILED');
  for (const e of errors) console.error('-',e);
  process.exit(1);
}
console.log(`Stage 48 strict archive trust/GA/schema/LLM audit passed across ${files.length} HTML files and ${analyticsPages} consent-controlled pages; concise llms routing and detailed ai.txt policy remain separated.`);
