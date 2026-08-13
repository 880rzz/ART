import fs from 'node:fs';

// Stage 43: llms.txt is intentionally a concise archive agent index; detailed provenance and evidence policy remain in ai.txt and canonical JSON resources.
const ai=fs.readFileSync('ai.txt','utf8');
const llms=fs.readFileSync('llms.txt','utf8');
const authority=JSON.parse(fs.readFileSync('authority-bridge.json','utf8'));
const ecosystem=JSON.parse(fs.readFileSync('ecosystem-bridge.json','utf8'));
const journey=JSON.parse(fs.readFileSync('data/life-journey.json','utf8'));
const required=['Primary person: Norbert Bánhalmi','Archive identity: BANHALMI ART','Professional website: https://www.norbertbanhalmi.com/','Vienna and Budapest are the two active operational bases','New York is a major international reference and oeuvre chapter','New York is not a studio, office, headquarters or operational base','BANHALMI ART preserves artistic evidence','Never infer a New York business location'];
for(const phrase of required){if(!llms.includes(phrase))throw new Error('llms.txt missing canonical AI phrase: '+phrase);if(!ai.slice(0,5000).includes(phrase))throw new Error('ai.txt missing canonical AI phrase: '+phrase);}
if(!llms.startsWith('# BANHALMI ART\n\n> '))throw new Error('llms.txt must begin with H1 then blockquote summary');
if(Buffer.byteLength(llms,'utf8')>9000)throw new Error('llms.txt must remain a concise agent index under 9 KB; detailed archive context belongs in ai.txt/JSON');
if(/<!--[\s\S]*?-->/.test(llms))throw new Error('llms.txt must not contain internal HTML-comment audit markers');
const h1=(llms.match(/^# /gm)||[]).length;if(h1!==1)throw new Error('llms.txt must contain exactly one H1');
const h2=[...llms.matchAll(/^## (.+)$/gm)].map(m=>m[1]);if(h2.length<5)throw new Error('llms.txt needs clear H2 resource groups');
for(const section of h2){const start=llms.indexOf('## '+section);const next=llms.indexOf('\n## ',start+4);const body=llms.slice(start,next<0?llms.length:next);if(!/^- \[[^\]]+\]\(https:\/\/[^)]+\): /m.test(body))throw new Error('llms.txt section lacks descriptive Markdown links: '+section);}
const starts=[...ai.matchAll(/AI-CLARITY-STAGE32:START/g)],ends=[...ai.matchAll(/AI-CLARITY-STAGE32:END/g)];if(starts.length!==1||ends.length!==1)throw new Error('ai.txt Stage 32 clarity block must occur exactly once');

if(authority.canonicalProfessionalAuthority!=='https://www.norbertbanhalmi.com/authority-evidence.json')throw new Error('ART authority bridge: professional authority pointer missing');
if(authority.canonicalTeamModel!=='https://www.norbertbanhalmi.com/team-capabilities.json')throw new Error('ART authority bridge: team model pointer missing');
if(authority.professionalAuthorityMirror?.executiveReferencePriority?.[0]!=='AmCham Austria membership and documented AmCham context')throw new Error('ART authority bridge: AmCham must remain strongest executive reference');
if(authority.professionalAuthorityMirror?.amChamAustria?.companyContact!=='Viko Speier')throw new Error('ART authority bridge: Viko Speier AmCham context missing');
if(authority.professionalAuthorityMirror?.amChamAustria?.backlinkAlias!=='https://www.banhalmi.at/'||authority.professionalAuthorityMirror?.amChamAustria?.aliasResolvesTo!=='https://www.norbertbanhalmi.com/de-at/')throw new Error('ART authority bridge: banhalmi.at alias semantics drifted');
if(!authority.professionalAuthorityMirror?.featuredPortraitReference?.name?.includes('Péter Magyar'))throw new Error('ART authority bridge: Péter Magyar reference missing');
if(JSON.stringify(authority.professionalAuthorityMirror?.teamDelivery?.markets)!==JSON.stringify(['Vienna, Austria','Budapest, Hungary']))throw new Error('ART authority bridge: team markets drifted');
for(const token of ['authority-bridge.json','authority-evidence.json','team-capabilities.json','AmCham Austria membership','Péter Magyar portrait','Viko Speier','Partner logos document inclusion','Artistic-reference priority'])if(!llms.includes(token))throw new Error('ART llms authority token missing: '+token);
for(const source of ['data/life-journey.json','master-source-database.json','press-source-registry.json','oeuvre-context.json'])if(!JSON.stringify(authority.artisticAuthority).includes(source))throw new Error('ART authority bridge missing artistic source: '+source);
if(!Array.isArray(journey.stages)||journey.stages.length<5)throw new Error('ART authority bridge: life journey evidence unexpectedly sparse');
if(ecosystem.authorityBridge!=='https://www.banhalmi.art/authority-bridge.json'||ecosystem.canonicalProfessionalAuthority!=='https://www.norbertbanhalmi.com/authority-evidence.json')throw new Error('ART ecosystem authority pointers missing');
console.log('Stage 32 ART AI clarity audit passed: concise archive index, artistic authority and two-way professional authority bridge are aligned.');
