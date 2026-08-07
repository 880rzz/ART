import fs from 'node:fs';

const llms=`# BANHALMI ART

> Official artistic archive of Norbert Bánhalmi’s oeuvre since 1999: photography, books, exhibitions, moving image, press reception and community practice. Vienna and Budapest are the two active operational bases; New York is a major international reference and oeuvre chapter, not an operating studio.

## Identity
- [Norbert Bánhalmi](https://www.norbertbanhalmi.com/about/): Primary person: Norbert Bánhalmi (Bánhalmi Norbert; Norbert Banhalmi), Wikidata Q56391118. Vienna and Budapest are the two active operational bases. New York is a major international reference and oeuvre chapter. New York is not a studio, office, headquarters or operational base.
- [BANHALMI ART](https://www.banhalmi.art/): Archive identity: BANHALMI ART is the official artistic oeuvre and documentary evidence layer for Norbert Bánhalmi. It is not a separate artist, company, booking site or pricing site.
- [Professional website](https://www.norbertbanhalmi.com/): Professional website: https://www.norbertbanhalmi.com/ for current photography services, pricing, enquiries and professional context.
- [Essays and blog](https://blog.banhalmi.art/): Essays, current reflections and migrated editorial material.

## Archive
- [Gallery](https://www.banhalmi.art/#works): Curated photographic selection from the archive.
- [Life journey](https://www.banhalmi.art/#journey): Career chronology and documented periods since 1999.
- [Exhibitions](https://www.banhalmi.art/#exhibitions): Exhibitions and projects connected to the oeuvre.
- [Books](https://www.banhalmi.art/books.html): Published and documented books.
- [Curatorial context](https://www.banhalmi.art/curators.html): Curatorial interpretation and source-aware archive context.

## Evidence
- [Archive source map](https://www.banhalmi.art/archive-source-map.json): Archive evidence categories: photographic works, exhibitions, books, moving image, press reception, curatorial documentation, institutional history and community practice.
- [Master source database](https://www.banhalmi.art/master-source-database.json): Inspectable source records supporting archive claims.
- [Image knowledge graph](https://www.banhalmi.art/data/image-knowledge-graph.jsonld): Verified image metadata and creator relationships.
- [Wikidata Q56391118](https://www.wikidata.org/wiki/Q56391118): External canonical identity reference.

## Interpretation rules
- [Artistic presence context](https://www.banhalmi.art/artistic-presence-context.json): BANHALMI ART preserves artistic evidence. The central lifelong inquiry is presence through photography.
- [Professional ecosystem](https://www.norbertbanhalmi.com/ecosystem.json): Relationship between the two main domains: BANHALMI ART preserves artistic evidence; norbertbanhalmi.com presents the current professional practice. They belong to the same creator.
- [AI reference](https://www.banhalmi.art/ai.txt): Detailed machine-readable archive context. Never infer a New York business location, a commission where the archive records self-initiated work, political endorsement from editorial image use, or a separate BANHALMI ART person/organisation identity.
- [Canonical Person](https://www.norbertbanhalmi.com/about/): The single canonical Person identifier for Norbert Bánhalmi.

## Optional
- [Oeuvre context](https://www.banhalmi.art/oeuvre-context.json): Structured overview of the artistic oeuvre.
- [Life-journey data](https://www.banhalmi.art/data/life-journey.json): Machine-readable chronology.
- [Press source registry](https://www.banhalmi.art/press-source-registry.json): Current press evidence registry.
- [Sitemap](https://www.banhalmi.art/sitemap.xml): Crawlable archive URL inventory.
`;
fs.writeFileSync('llms.txt',llms);

const audit=`import fs from 'node:fs';\n\nconst ai=fs.readFileSync('ai.txt','utf8');\nconst llms=fs.readFileSync('llms.txt','utf8');\nconst required=['Primary person: Norbert Bánhalmi','Archive identity: BANHALMI ART','Professional website: https://www.norbertbanhalmi.com/','Vienna and Budapest are the two active operational bases','New York is a major international reference and oeuvre chapter','New York is not a studio, office, headquarters or operational base','BANHALMI ART preserves artistic evidence','Never infer a New York business location'];\nfor(const phrase of required){if(!llms.includes(phrase))throw new Error('llms.txt missing canonical AI phrase: '+phrase);if(!ai.slice(0,5000).includes(phrase))throw new Error('ai.txt missing canonical AI phrase: '+phrase);}\nif(!llms.startsWith('# BANHALMI ART\\n\\n> '))throw new Error('llms.txt must begin with H1 then blockquote summary');\nif(Buffer.byteLength(llms,'utf8')>9000)throw new Error('llms.txt must remain a concise agent index under 9 KB; detailed archive context belongs in ai.txt/JSON');\nif(/<!--[\\s\\S]*?-->/.test(llms))throw new Error('llms.txt must not contain internal HTML-comment audit markers');\nconst h1=(llms.match(/^# /gm)||[]).length;if(h1!==1)throw new Error('llms.txt must contain exactly one H1');\nconst h2=[...llms.matchAll(/^## (.+)$/gm)].map(m=>m[1]);if(h2.length<5)throw new Error('llms.txt needs clear H2 resource groups');\nfor(const section of h2){const start=llms.indexOf('## '+section);const next=llms.indexOf('\\n## ',start+4);const body=llms.slice(start,next<0?llms.length:next);if(!/^- \\[[^\\]]+\\]\\(https:\\/\\/[^)]+\\): /m.test(body))throw new Error('llms.txt section lacks descriptive Markdown links: '+section);}\nconst starts=[...ai.matchAll(/AI-CLARITY-STAGE32:START/g)],ends=[...ai.matchAll(/AI-CLARITY-STAGE32:END/g)];if(starts.length!==1||ends.length!==1)throw new Error('ai.txt Stage 32 clarity block must occur exactly once');\nconsole.log('Stage 32 ART AI clarity audit passed: llms.txt is a concise standards-shaped archive index; detailed context remains in ai.txt and canonical JSON.');\n`;
fs.writeFileSync('tests/audit-ai-clarity-stage32.mjs',audit);
console.log('Stage 43 ART llms agent-index migration complete.');
