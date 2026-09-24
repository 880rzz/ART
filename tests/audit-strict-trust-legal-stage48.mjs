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
  if (html.includes('G-90C452LJKQ')) errors.push(`${rel}: retired shared ART analytics property remains`);
  if (html.includes('G-PKLH4H5YKD')) {
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
for (const text of [ai,llms]) {
  if (!text.includes('https://www.norbertbanhalmi.com/trust/')) errors.push('AI discovery layer missing authoritative Trust Center route');
  if (!/Article 50/i.test(text)) errors.push('AI discovery layer missing EU AI Act Article 50 transparency policy');
  if (!/human editorial/i.test(text)) errors.push('AI discovery layer missing human editorial-control policy');
}
if (!/2 August 2026/i.test(ai)) errors.push('ai.txt missing Article 50 applicability date');
for (const source of [commissionGuidelines,commissionCode,eurLex]) if (!ai.includes(source)) errors.push(`ai.txt missing authoritative EU source ${source}`);
if (/could reasonably be mistaken for authentic content/i.test(ai)) errors.push('ai.txt retains pre-guidelines Article 50 ambiguity');
for (const required of ['https://www.norbertbanhalmi.com/privacy-policy/','https://www.norbertbanhalmi.com/impressum/']) {
  if (!ai.includes(required)) errors.push(`ai.txt missing authoritative legal route ${required}`);
}

const institutional=JSON.parse(fs.readFileSync('institutional-relations.jsonld','utf8'));
const institutionalGraph=Array.isArray(institutional?.['@graph'])?institutional['@graph']:[];
const vipach=institutionalGraph.find(node=>node?.['@id']==='https://www.vipach.at/#organization');
if (!vipach) errors.push('institutional-relations.jsonld missing VIPACH node');
if (vipach?.parentOrganization?.['@id']==='https://www.magyariskola.at/#school') errors.push('VIPACH BMI heritage must not be serialized as current parentOrganization');
if (vipach?.memberOf?.['@id']==='https://www.kozpontiszovetseg.at/#organization') errors.push('VIPACH public framework context must not be serialized as memberOf without authoritative legal evidence');
if (!/heritage/i.test(vipach?.description||'') || !/framework/i.test(vipach?.description||'')) errors.push('VIPACH node missing heritage/framework relationship semantics');

const kg=JSON.parse(fs.readFileSync('knowledge-graph.jsonld','utf8'));
const kgGraph=Array.isArray(kg?.['@graph'])?kg['@graph']:[];
const kgPerson=kgGraph.find(node=>node?.['@id']==='https://www.norbertbanhalmi.com/about/');
const kgOrg=kgGraph.find(node=>node?.['@id']==='https://www.norbertbanhalmi.com/#organization');
const personalMembershipIds=(kgPerson?.memberOf||[]).map(x=>x?.['@id']).filter(Boolean);
for (const forbidden of ['https://www.banhalmi.art/knowledge-graph.jsonld#wko','https://www.banhalmi.art/knowledge-graph.jsonld#amcham']) {
  if (personalMembershipIds.includes(forbidden)) errors.push(`professional organization membership misattributed to Person: ${forbidden}`);
}
const orgMembershipIds=(kgOrg?.memberOf||[]).map(x=>x?.['@id']).filter(Boolean);
for (const required of ['https://www.banhalmi.art/knowledge-graph.jsonld#wko','https://www.banhalmi.art/knowledge-graph.jsonld#amcham']) {
  if (!orgMembershipIds.includes(required)) errors.push(`canonical Organization missing professional membership: ${required}`);
}

const bridge=JSON.parse(fs.readFileSync('ecosystem-bridge.jsonld','utf8'));
const bridgeGraph=Array.isArray(bridge?.['@graph'])?bridge['@graph']:[];
const bridgePerson=bridgeGraph.find(node=>node?.['@id']==='https://www.norbertbanhalmi.com/about/');
const bridgeOrg=bridgeGraph.find(node=>node?.['@id']==='https://www.norbertbanhalmi.com/#organization');
const requiredLocationIds=['https://www.norbertbanhalmi.com/#vienna-studio','https://www.norbertbanhalmi.com/#budapest-studio','https://www.norbertbanhalmi.com/#vienna-gersthofer-office'];
const bridgePersonLocations=(bridgePerson?.workLocation||[]).map(x=>x?.['@id']).filter(Boolean);
const bridgeOrgLocations=(bridgeOrg?.location||[]).map(x=>x?.['@id']).filter(Boolean);
for (const required of requiredLocationIds) {
  if (!bridgePersonLocations.includes(required)) errors.push(`ecosystem bridge Person missing workLocation ${required}`);
  if (!bridgeOrgLocations.includes(required)) errors.push(`ecosystem bridge Organization missing location ${required}`);
}
const bridgeOffice=bridgeGraph.find(node=>node?.['@id']==='https://www.norbertbanhalmi.com/#vienna-gersthofer-office');
if (!bridgeOffice) errors.push('ecosystem bridge missing Gersthofer office Place node');
if (!String(bridgeOffice?.description||'').toLowerCase().includes('not a photography studio')) errors.push('ecosystem bridge Gersthofer office must remain explicitly non-studio');

const core=JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
if (core.domainRoles?.professional !== 'https://www.norbertbanhalmi.com/') errors.push('knowledge-core.json missing canonical professional domain');
if (!Array.isArray(core.geography?.presentOperationalContext) || !core.geography.presentOperationalContext.includes('Vienna') || !core.geography.presentOperationalContext.includes('Budapest')) errors.push('knowledge-core.json missing the two active operational contexts');
if (!/not a studio, office, headquarters or operational base/i.test(core.geography?.rule || '')) errors.push('knowledge-core.json missing explicit New York non-operational rule');

if (errors.length) {
  console.error('STAGE 48 STRICT ARCHIVE TRUST / GA / SCHEMA / LLM AUDIT FAILED');
  for (const e of errors) console.error('-',e);
  process.exit(1);
}
console.log(`Stage 48 strict archive trust/GA/schema/LLM audit passed across ${files.length} HTML files and ${analyticsPages} consent-controlled pages.`);
