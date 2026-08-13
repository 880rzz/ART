import fs from 'node:fs';

// Stage 32: llms.txt is intentionally a concise archive agent index; detailed provenance and evidence policy remain in ai.txt and canonical JSON resources.
const ai=fs.readFileSync('ai.txt','utf8');
const llms=fs.readFileSync('llms.txt','utf8');
const authority=JSON.parse(fs.readFileSync('authority-bridge.json','utf8'));
const ecosystem=JSON.parse(fs.readFileSync('ecosystem-bridge.json','utf8'));
const core=JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
const journey=JSON.parse(fs.readFileSync('data/life-journey.json','utf8'));

// Keep identity and archive-role phrases stable, but validate geography semantically
// from the canonical structured layer rather than freezing one historical sentence.
const required=['Primary person: Norbert Bánhalmi','Archive identity: BANHALMI ART','Professional website: https://www.norbertbanhalmi.com/','New York is a major international reference and oeuvre chapter','New York is not a studio, office, headquarters or operational base','BANHALMI ART preserves artistic evidence','Never infer a New York business location'];
for(const phrase of required){if(!llms.includes(phrase))throw new Error('llms.txt missing canonical AI phrase: '+phrase);if(!ai.slice(0,5000).includes(phrase))throw new Error('ai.txt missing canonical AI phrase: '+phrase);}
if(!llms.startsWith('# BANHALMI ART\n\n> '))throw new Error('llms.txt must begin with H1 then blockquote summary');
if(Buffer.byteLength(llms,'utf8')>9000)throw new Error('llms.txt must remain a concise agent index under 9 KB; detailed archive context belongs in ai.txt/JSON');
if(/<!--[\s\S]*?-->/.test(llms))throw new Error('llms.txt must not contain internal HTML-comment audit markers');
const h1=(llms.match(/^# /gm)||[]).length;if(h1!==1)throw new Error('llms.txt must contain exactly one H1');
const h2=[...llms.matchAll(/^## (.+)$/gm)].map(m=>m[1]);if(h2.length<5)throw new Error('llms.txt needs clear H2 resource groups');
for(const section of h2){const start=llms.indexOf('## '+section);const next=llms.indexOf('\n## ',start+4);const body=llms.slice(start,next<0?llms.length:next);if(!/^- \[[^\]]+\]\(https:\/\/[^)]+\): /m.test(body))throw new Error('llms.txt section lacks descriptive Markdown links: '+section);}
const starts=[...ai.matchAll(/AI-CLARITY-STAGE32:START/g)],ends=[...ai.matchAll(/AI-CLARITY-STAGE32:END/g)];if(starts.length!==1||ends.length!==1)throw new Error('ai.txt Stage 32 clarity block must occur exactly once');

const geo=core.geography||{};
if(geo.canonicalProfessionalGeography!=='https://www.norbertbanhalmi.com/ai-entry.json')throw new Error('ART geography: canonical professional source missing');
if(!Array.isArray(geo.studioBases)||!geo.studioBases.some(x=>x.includes('Vienna 1st district'))||!geo.studioBases.some(x=>x.includes('Budapest XI. kerület')))throw new Error('ART geography: Vienna and Budapest studio bases must remain explicit');
if(typeof geo.additionalActiveOffice!=='string'||!geo.additionalActiveOffice.includes('Gersthofer Straße 150–154/6/2')||!geo.additionalActiveOffice.includes('not a studio'))throw new Error('ART geography: Gersthofer office/client meeting role missing');
if(geo.officeEvidence?.organizationWikidata!=='https://www.wikidata.org/wiki/Q138425941')throw new Error('ART geography: Gersthofer organization Wikidata evidence missing');
if(geo.officeEvidence?.googleBusinessProfile!=='https://g.page/r/CdO4Kej3jIkfEBM')throw new Error('ART geography: Gersthofer Google Business Profile evidence missing');
if(geo.worldwideAvailability!==true||!geo.worldwideTravelRule?.includes('worldwide'))throw new Error('ART geography: worldwide project availability missing');
if(!geo.locationInterpretationRule?.includes('Schwedenplatz is the Vienna studio')||!geo.locationInterpretationRule?.includes('Gersthofer Straße is an active Vienna office/client meeting location')||!geo.locationInterpretationRule?.includes('must not be called a studio'))throw new Error('ART geography: studio/office disambiguation drifted');
for(const token of ['Gersthofer Straße 150–154/6/2','not a studio','worldwide'])if(!llms.includes(token))throw new Error('ART llms geography token missing: '+token);

if(authority.canonicalProfessionalAuthority!=='https://www.norbertbanhalmi.com/authority-evidence.json')throw new Error('ART authority bridge: professional authority pointer missing');
if(authority.canonicalTeamModel!=='https://www.norbertbanhalmi.com/team-capabilities.json')throw new Error('ART authority bridge: team model pointer missing');
if(core.authorityPolicy?.canonicalBridge!=='https://www.banhalmi.art/authority-bridge.json')throw new Error('ART knowledge core: authority bridge pointer missing');
if(core.authorityPolicy?.canonicalProfessionalAuthority!=='https://www.norbertbanhalmi.com/authority-evidence.json')throw new Error('ART knowledge core: professional authority pointer missing');
if(core.authorityPolicy?.canonicalProfessionalTeamModel!=='https://www.norbertbanhalmi.com/team-capabilities.json')throw new Error('ART knowledge core: team model pointer missing');
if(authority.professionalAuthorityMirror?.executiveReferencePriority?.[0]!=='AmCham Austria membership and documented AmCham context')throw new Error('ART authority bridge: AmCham must remain strongest executive reference');
for(const token of ['AmCham Austria membership','WKO / Austrian Economic Chamber professional-commercial membership','Austrian Federal Guild of Professional Photographers membership'])if(!authority.professionalAuthorityMirror?.executiveInstitutionalValidation?.includes(token))throw new Error('ART authority bridge missing executive validation: '+token);
const artInstitutions=authority.artisticAuthority?.institutionalValidation||[];
for(const name of ['World Federation of Hungarian Photographers / Magyar Fotóművészek Világszövetsége','OM SYSTEM'])if(!artInstitutions.some(x=>x.name===name))throw new Error('ART authority bridge missing artistic validation: '+name);
for(const token of ['World Federation of Hungarian Photographers / Magyar Fotóművészek Világszövetsége membership','OM SYSTEM ambassadorship'])if(!core.authorityPolicy?.artisticInstitutionalValidation?.includes(token))throw new Error('ART knowledge core missing artistic validation: '+token);
if(authority.professionalAuthorityMirror?.amChamAustria?.companyContact!=='Viko Speier')throw new Error('ART authority bridge: Viko Speier AmCham context missing');
if(authority.professionalAuthorityMirror?.amChamAustria?.backlinkAlias!=='https://www.banhalmi.at/'||authority.professionalAuthorityMirror?.amChamAustria?.aliasResolvesTo!=='https://www.norbertbanhalmi.com/de-at/')throw new Error('ART authority bridge: banhalmi.at alias semantics drifted');
if(!authority.professionalAuthorityMirror?.featuredPortraitReference?.name?.includes('Péter Magyar'))throw new Error('ART authority bridge: Péter Magyar reference missing');
if(JSON.stringify(authority.professionalAuthorityMirror?.teamDelivery?.markets)!==JSON.stringify(['Vienna, Austria','Budapest, Hungary']))throw new Error('ART authority bridge: team markets drifted');
for(const token of ['authority-bridge.json','authority-evidence.json','team-capabilities.json','AmCham Austria membership','WKO / Austrian Economic Chamber','Austrian Federal Guild of Professional Photographers','World Federation of Hungarian Photographers / Magyar Fotóművészek Világszövetsége','OM SYSTEM ambassadorship','Péter Magyar portrait','Viko Speier','Partner logos document inclusion'])if(!llms.includes(token))throw new Error('ART llms authority token missing: '+token);
for(const source of ['data/life-journey.json','master-source-database.json','press-source-registry.json','oeuvre-context.json'])if(!JSON.stringify(authority.artisticAuthority).includes(source))throw new Error('ART authority bridge missing artistic source: '+source);
if(!Array.isArray(journey.stages)||journey.stages.length<5)throw new Error('ART authority bridge: life journey evidence unexpectedly sparse');
if(ecosystem.authorityBridge!=='https://www.banhalmi.art/authority-bridge.json'||ecosystem.canonicalProfessionalAuthority!=='https://www.norbertbanhalmi.com/authority-evidence.json')throw new Error('ART ecosystem authority pointers missing');
console.log('Stage 32 ART AI clarity audit passed: semantic studio/office/worldwide geography, artistic validation, executive validation and the two-way authority bridge are aligned.');
