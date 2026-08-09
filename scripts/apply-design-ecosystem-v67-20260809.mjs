import { readdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const OLD='20260809-seo-entity-pagespeed-v66';
const NEW='20260809-design-ecosystem-v67';
async function walk(dir){const out=[];for(const name of await readdir(dir)){if(['.git','node_modules','_site','playwright-report','test-results'].includes(name))continue;const p=path.join(dir,name);const s=await stat(p);if(s.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const files=await walk(root);

// 1) Make the final high-specificity palette layer paint a real two-tone full-bleed rhythm.
const palettePath=path.join(root,'assets/css/palette-blue-final.css');
let palette=await readFile(palettePath,'utf8');
const marker='/* Stage 46 — one visible section rhythm.';
const at=palette.indexOf(marker);
if(at<0)throw new Error('Stage 46 palette marker missing');
const media=palette.indexOf('@media(max-width:860px)',at);
if(media<0)throw new Error('Stage 46 mobile marker missing');
const replacement=`/* Stage 46 / v67 — archive-wide two-tone section rhythm.\n   Dark and light blue alternate structurally on every direct content section.\n   The pseudo-element paints the viewport width even when the section itself\n   is a constrained .wrap/.narrow element, preventing narrow coloured boxes. */\n:root{\n  --art-surface-dark:#202530!important;\n  --art-surface-light:#2D3444!important;\n  --art-feature-gradient:linear-gradient(135deg,#202530 0%,#2D3444 100%)!important;\n}\nhtml body.apple-archive.apple-archive main>section,\nhtml body.apple-archive.apple-archive main>.statement,\nhtml body.apple-archive.apple-archive main>header:not(.hero){\n  position:relative!important;\n  isolation:isolate!important;\n  background:transparent!important;\n  border:0!important;\n  overflow:visible!important;\n}\nhtml body.apple-archive.apple-archive main>section{--banhalmi-section-surface:var(--art-surface-dark)!important}\nhtml body.apple-archive.apple-archive main>section:nth-of-type(even){--banhalmi-section-surface:var(--art-surface-light)!important}\nhtml body.apple-archive.apple-archive main>section:nth-of-type(odd){--banhalmi-section-surface:var(--art-surface-dark)!important}\nhtml body.apple-archive.apple-archive main>section.tone-c,\nhtml body.apple-archive.apple-archive main>section.thesis,\nhtml body.apple-archive.apple-archive main>section.sources{--banhalmi-section-surface:var(--art-surface-dark)!important}\nhtml body.apple-archive.apple-archive main>section::before,\nhtml body.apple-archive.apple-archive main>.statement::before,\nhtml body.apple-archive.apple-archive main>header:not(.hero)::before{\n  content:\"\"!important;position:absolute!important;z-index:-1!important;top:0!important;bottom:0!important;left:50%!important;width:100vw!important;transform:translateX(-50%)!important;pointer-events:none!important;\n}\nhtml body.apple-archive.apple-archive main>section::before{background:var(--banhalmi-section-surface)!important;box-shadow:inset 0 1px rgba(175,196,217,.12),inset 0 -1px rgba(32,37,48,.35)!important}\nhtml body.apple-archive.apple-archive main>header:not(.hero)::before{background:linear-gradient(135deg,#29303F 0%,#202530 100%)!important}\nhtml body.apple-archive.apple-archive main>.statement{--banhalmi-section-surface:var(--art-feature-gradient)!important}\nhtml body.apple-archive.apple-archive main>.statement::before{background:var(--banhalmi-section-surface)!important}\n/* Archive-record context blocks often follow </main>; keep the same rhythm. */\nhtml body.apple-archive.apple-archive :is(.record-depth,.record-relationships,.project-evidence){position:relative!important;isolation:isolate!important;background:transparent!important;overflow:visible!important}\nhtml body.apple-archive.apple-archive :is(.record-depth,.record-relationships,.project-evidence)::before{content:\"\";position:absolute;z-index:-1;inset-block:0;left:50%;width:100vw;transform:translateX(-50%);background:var(--art-surface-dark);box-shadow:inset 0 1px rgba(175,196,217,.12)}\nhtml body.apple-archive.apple-archive .record-relationships::before{background:var(--art-surface-light)}\n/* Curatorial runtime uses three legacy surface numbers; visually they now map\n   to a strict dark/light/dark sequence rather than three near-identical tones. */\nhtml body.apple-archive.apple-archive .curatorial-section{--curatorial-surface:var(--art-surface-dark)!important}\nhtml body.apple-archive.apple-archive .curatorial-section[data-curatorial-surface=\"2\"]{--curatorial-surface:var(--art-surface-light)!important}\nhtml body.apple-archive.apple-archive .curatorial-section[data-curatorial-surface=\"3\"]{--curatorial-surface:var(--art-surface-dark)!important}\n/* Hero emphasis follows BANHALMI: text stays semantically identical; only a\n   short key phrase receives the verified gold accent. */\nhtml body.apple-archive.apple-archive h1 .art-hero-accent{color:#B79C44!important}\n`;
palette=palette.slice(0,at)+replacement+'\n'+palette.slice(media);
await writeFile(palettePath,palette);

// 2) Add restrained hero keyword highlighting to the shared runtime.
const runtimePath=path.join(root,'assets/js/responsive-header-system.js');
let runtime=await readFile(runtimePath,'utf8');
const insertBefore="  const buttons = [...document.querySelectorAll('.burger')];";
if(!runtime.includes(insertBefore))throw new Error('runtime insertion anchor missing');
const heroLogic=`  /* v67: visually emphasise one meaningful word/phrase in archive heroes.\n     Text content is not rewritten, so headings keep their original human/SEO meaning. */\n  const heroHeading = main?.querySelector(':scope > header h1, :scope > .hero h1, h1');\n  if (heroHeading && !heroHeading.querySelector('.art-hero-accent') && heroHeading.children.length === 0) {\n    const patterns = language.startsWith('hu')\n      ? [/jelenlét/i,/eufória/i,/ébredés/i,/nő világa/i,/portré/i,/aktfotózás/i,/fotográfia/i,/archívum/i,/sajtó/i,/kurátor/i,/közösség/i,/könyv/i,/kiállítás/i,/projekt/i]\n      : language.startsWith('de')\n        ? [/präsenz/i,/euforia/i,/erwachen/i,/welt der frau/i,/porträt/i,/aktfotografie/i,/fotografie/i,/archiv/i,/presse/i,/kurat/i,/gemeinschaft/i,/buch|bücher/i,/ausstellung/i,/projekt/i]\n        : [/presence/i,/euphoria|euforia/i,/awakening/i,/world of woman/i,/portrait/i,/nude/i,/photography/i,/archive/i,/press/i,/curator/i,/community/i,/book/i,/exhibition/i,/project/i];\n    const source = heroHeading.textContent || '';\n    const match = patterns.map(pattern => source.match(pattern)).find(Boolean);\n    if (match && Number.isInteger(match.index)) {\n      const before = source.slice(0, match.index);\n      const hit = source.slice(match.index, match.index + match[0].length);\n      const after = source.slice(match.index + match[0].length);\n      const accent = document.createElement('span');\n      accent.className = 'art-hero-accent';\n      accent.textContent = hit;\n      heroHeading.replaceChildren(document.createTextNode(before), accent, document.createTextNode(after));\n    }\n  }\n\n`;
runtime=runtime.replace(insertBefore,heroLogic+insertBefore);
await writeFile(runtimePath,runtime);

// 3) Explicit reciprocal machine map of the three-domain ecosystem.
const bridge={
  documentType:'BANHALMI ART ecosystem bridge',schemaVersion:'2026-08-09-v1',dateModified:'2026-08-09T09:47:00+02:00',
  canonicalPerson:{'@id':'https://www.norbertbanhalmi.com/about/',name:'Norbert Bánhalmi',wikidata:'https://www.wikidata.org/wiki/Q56391118'},
  roles:[
    {role:'professional-services',url:'https://www.norbertbanhalmi.com/',canonicalFor:['current services','pricing','enquiries','Trust Center','FAQ','professional policy']},
    {role:'artistic-archive',url:'https://www.banhalmi.art/',canonicalFor:['oeuvre','books','exhibitions','projects','press evidence','curatorial documentation']},
    {role:'editorial-knowledge-layer',url:'https://blog.banhalmi.art/',canonicalFor:['professional articles','service-related guides','contextual stories','A nő világa companion stories']}
  ],
  canonicalProfessionalEcosystem:'https://www.norbertbanhalmi.com/ecosystem.json',
  professionalEditorialCollections:'https://www.norbertbanhalmi.com/blog-collections.json',
  blogEntityGraph:'https://www.norbertbanhalmi.com/blog-entity.jsonld',
  interpretation:'One creator and one canonical Person entity; three web properties with distinct non-competing roles. The professional site converts demand, ART preserves evidence, and the blog supplies editorial depth.'
};
await writeFile(path.join(root,'ecosystem-bridge.json'),JSON.stringify(bridge,null,2)+'\n');
const bridgeLd={
 '@context':'https://schema.org','@graph':[
  {'@type':'Person','@id':'https://www.norbertbanhalmi.com/about/','name':'Norbert Bánhalmi','sameAs':['https://www.wikidata.org/wiki/Q56391118']},
  {'@type':'WebSite','@id':'https://www.norbertbanhalmi.com/#website','url':'https://www.norbertbanhalmi.com/','name':'BANHALMI','about':{'@id':'https://www.norbertbanhalmi.com/about/'}},
  {'@type':'WebSite','@id':'https://www.banhalmi.art/#website','url':'https://www.banhalmi.art/','name':'BANHALMI ART','about':{'@id':'https://www.norbertbanhalmi.com/about/'}},
  {'@type':'Blog','@id':'https://blog.banhalmi.art/#blog','url':'https://blog.banhalmi.art/','name':'BANHALMI Blog','author':{'@id':'https://www.norbertbanhalmi.com/about/'}},
  {'@type':'ItemList','@id':'https://www.banhalmi.art/#digital-ecosystem','name':'BANHALMI digital ecosystem','itemListElement':[{'@type':'ListItem','position':1,'item':{'@id':'https://www.norbertbanhalmi.com/#website'}},{'@type':'ListItem','position':2,'item':{'@id':'https://www.banhalmi.art/#website'}},{'@type':'ListItem','position':3,'item':{'@id':'https://blog.banhalmi.art/#blog'}}]}
 ]};
await writeFile(path.join(root,'ecosystem-bridge.jsonld'),JSON.stringify(bridgeLd,null,2)+'\n');

// 4) Make the bridge discoverable from human and agent entry points.
for(const file of ['ai.txt','llms.txt']){
 const p=path.join(root,file);let t=await readFile(p,'utf8');
 if(!t.includes('ecosystem-bridge.json')) t += `\n\n## Three-property ecosystem bridge\n- Machine map: https://www.banhalmi.art/ecosystem-bridge.json\n- Schema graph: https://www.banhalmi.art/ecosystem-bridge.jsonld\n- Professional canonical ecosystem: https://www.norbertbanhalmi.com/ecosystem.json\n- Role rule: norbertbanhalmi.com = current professional services; banhalmi.art = artistic archive/evidence; blog.banhalmi.art = editorial knowledge and contextual stories. All three resolve to the same canonical Person, Wikidata Q56391118.\n`;
 await writeFile(p,t);
}

// 5) Every real ART page gets the machine bridge and v67 cache token. Redirect stubs stay lightweight.
for(const file of files.filter(f=>f.endsWith('.html'))){
 let html=await readFile(file,'utf8');
 if(!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html))continue;
 const isRedirect=/http-equiv=["']refresh["']|location\.replace\(/i.test(html);
 html=html.split(OLD).join(NEW);
 if(!isRedirect && !html.includes('/ecosystem-bridge.json')){
   html=html.replace('</head>','<link rel="alternate" type="application/json" href="/ecosystem-bridge.json" title="BANHALMI ecosystem map">\n<link rel="alternate" type="application/ld+json" href="/ecosystem-bridge.jsonld" title="BANHALMI ecosystem schema">\n</head>');
 }
 await writeFile(file,html);
}

// 6) Fail-closed archive-wide visual + ecosystem audit.
const audit=`import { readdir, readFile, stat } from 'node:fs/promises';\nimport path from 'node:path';\nconst root=process.cwd(),errors=[];\nasync function walk(d){const a=[];for(const n of await readdir(d)){if(['.git','node_modules','_site'].includes(n))continue;const p=path.join(d,n),s=await stat(p);if(s.isDirectory())a.push(...await walk(p));else a.push(p)}return a}\nconst files=await walk(root);const htmls=files.filter(x=>x.endsWith('.html'));let pages=0,sections=0,redirects=0;\nfor(const f of htmls){const h=await readFile(f,'utf8');if(!/<body\\b[^>]*class=[\"'][^\"']*apple-archive/i.test(h))continue;const rel=path.relative(root,f);const red=/http-equiv=[\"']refresh[\"']|location\\.replace\\(/i.test(h);if(red){redirects++;continue}pages++;const m=h.match(/<main\\b[\\s\\S]*?<\\/main>/i)?.[0]||'';sections+=(m.match(/<section\\b/gi)||[]).length;if(!h.includes('/ecosystem-bridge.json'))errors.push(rel+': ecosystem JSON bridge missing');if(!h.includes('/ecosystem-bridge.jsonld'))errors.push(rel+': ecosystem JSON-LD bridge missing');if(h.includes('${OLD}'))errors.push(rel+': stale design cache token');}\nconst css=await readFile('assets/css/palette-blue-final.css','utf8');for(const token of ['--art-surface-dark:#202530','--art-surface-light:#2D3444','main>section:nth-of-type(even)','main>section::before','width:100vw','art-hero-accent','record-relationships::before'])if(!css.includes(token))errors.push('palette-blue-final.css: missing '+token);\nconst js=await readFile('assets/js/responsive-header-system.js','utf8');if(!js.includes('art-hero-accent'))errors.push('shared runtime: hero accent system missing');\nconst bridge=JSON.parse(await readFile('ecosystem-bridge.json','utf8'));const roles=new Map(bridge.roles.map(x=>[x.role,x.url]));for(const [r,u] of [['professional-services','https://www.norbertbanhalmi.com/'],['artistic-archive','https://www.banhalmi.art/'],['editorial-knowledge-layer','https://blog.banhalmi.art/']])if(roles.get(r)!==u)errors.push('ecosystem bridge role mismatch: '+r);if(bridge.canonicalPerson?.wikidata!=='https://www.wikidata.org/wiki/Q56391118')errors.push('ecosystem bridge Wikidata mismatch');\nconst ld=JSON.parse(await readFile('ecosystem-bridge.jsonld','utf8'));const raw=JSON.stringify(ld);for(const u of ['https://www.norbertbanhalmi.com/#website','https://www.banhalmi.art/#website','https://blog.banhalmi.art/#blog','https://www.wikidata.org/wiki/Q56391118'])if(!raw.includes(u))errors.push('ecosystem JSON-LD missing '+u);\nif(pages<80)errors.push('unexpectedly few ART pages audited: '+pages);if(sections<300)errors.push('unexpectedly few sections audited: '+sections);if(errors.length){console.error('Stage51 failed with '+errors.length+' issue(s):');errors.forEach(e=>console.error(' - '+e));process.exit(1)}console.log('Stage51 passed: '+pages+' live ART pages, '+sections+' main sections and '+redirects+' redirect stubs inventoried; two-tone full-bleed rhythm, hero emphasis and three-property entity ecosystem locked.');\n`;
await writeFile(path.join(root,'tests/audit-design-ecosystem-stage51.mjs'),audit);
const pkgPath=path.join(root,'package.json');const pkg=JSON.parse(await readFile(pkgPath,'utf8'));if(!pkg.scripts.test.includes('audit-design-ecosystem-stage51.mjs'))pkg.scripts.test+=' && node tests/audit-design-ecosystem-stage51.mjs';pkg.scripts['test:design-ecosystem']='node tests/audit-design-ecosystem-stage51.mjs';await writeFile(pkgPath,JSON.stringify(pkg,null,2)+'\n');

await rm(path.join(root,'scripts/apply-design-ecosystem-v67-20260809.mjs'),{force:true});
await rm(path.join(root,'.github/workflows/apply-design-ecosystem-v67-20260809.yml'),{force:true});
console.log('ART v67 migration complete');
