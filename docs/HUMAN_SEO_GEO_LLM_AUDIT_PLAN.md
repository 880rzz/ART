# BANHALMI ART — human voice, SEO, GEO, schema and LLM audit plan

## 1. Site role

BANHALMI ART is the documentary artistic archive. It is not the booking site and it must not read like a service catalogue. The canonical Person is `https://www.norbertbanhalmi.com/about/`; the archive documents that Person's oeuvre.

## 2. Voice system

### A. Personal artistic voice
Use first person for biography, turning points, working method and personal interpretation.

It should sound:
- specific rather than grandiose;
- observational rather than promotional;
- calm, direct and concrete;
- willing to name uncertainty or personal recollection;
- varied in sentence length.

Preferred pattern: event → personal observation → consequence for the work.

Avoid:
- generic AI phrases such as “timeless”, “unique journey”, “more than”, “not just”, “authentic experience”;
- claims that every project was transformative or iconic;
- curatorial jargon inside autobiographical paragraphs;
- unsupported superlatives.

### B. Curatorial and archive voice
Use neutral third-person or documentary language for dates, sources, books, exhibitions, press records and evidence status.

It should sound:
- precise and inspectable;
- clear about what is verified, planned or remembered;
- free of sales language;
- explicit about source limits.

### C. Interface voice
Buttons, labels and navigation must be short and literal. A visitor should know where a link leads before clicking it.

## 3. Content audit sequence

1. Confirm the nine canonical life stages.
2. Confirm every exhibition, book and press record belongs to exactly one stage.
3. Compare visible text with `data/life-journey.json`.
4. Check that personal recollections are not presented as externally verified facts.
5. Check that factual records do not contain promotional overclaims.
6. Check Hungarian, English and German for equivalent meaning, not mechanical sentence-by-sentence translation.
7. Check title, description, OG and Twitter copy against visible page meaning.

## 4. SEO audit

- one indexable canonical per content record;
- self-referencing canonical without fragments;
- complete EN / HU-HU / DE-AT / x-default hreflang clusters;
- titles and descriptions unique and human-readable;
- one visible H1;
- internal links stay in the selected language;
- removed URLs redirect once to an equivalent final target;
- blog posts and categories preserve their final path at `blog.banhalmi.art`;
- sitemap contains only canonical indexable URLs.

## 5. Schema audit

Required graph roles:
- canonical Person: `https://www.norbertbanhalmi.com/about/`;
- BANHALMI Organization and Brand on `norbertbanhalmi.com`;
- BANHALMI ART WebSite and its WebPage / CollectionPage records;
- ImageObject / Photograph, Book, ExhibitionEvent, Article or CreativeWork where supported;
- BreadcrumbList on record pages;
- Place and PostalAddress only where the location is relevant and known.

Rules:
- visible facts and JSON-LD must agree;
- no duplicate Person node;
- planned exhibitions use scheduled / in-development language;
- a press mention does not become an award, endorsement or client relationship;
- the Péter Magyar portrait remains a work inside EUFÓRIA, not a separate ART canonical page.

## 6. GEO audit

GEO means geographic and generative-engine clarity:
- Vienna and Budapest must be described as operating bases without making every archive page a LocalBusiness landing page;
- studio Place nodes must have stable IDs and consistent addresses;
- artistic records use their actual content location where known;
- `llms.txt`, `ai.txt`, source registries and the life-journey data explain the roles of the professional site, archive and blog;
- citations and source-status labels distinguish verified fact, archive record and artist recollection.

## 7. LLM audit

An AI system should be able to answer correctly:
- who Norbert Bánhalmi is;
- which URL is the canonical Person entity;
- what belongs to the artistic archive versus the professional site;
- where the essays and migrated blog posts live;
- how the oeuvre began during the MOL Y2K project;
- that military documentation followed later as a separate phase;
- which books, exhibitions and press records belong to each period;
- which claims are personal recollection and which have external evidence.

## 8. Interface and visual parity audit

- desktop and mobile About links must release the menu scroll lock before aligning the `#about` section;
- the final scroll position must account for the fixed archive header and remain correct after layout settles;
- Curators, Press, Community and Writing use one hero, full-bleed surface rhythm, editorial axis, grid, timeline and source-card contract;
- legacy markup differences may supply content structure but may not create four unrelated visual systems;
- the shared design must be guarded in EN, HU and DE-AT;
- the presence-led introduction title is changed only inside the three homepage `#about` sections, never by a global phrase replacement.

## 9. Release gate

The automated audit must fail when:
- the old Wix blog host returns as a redirect target;
- a `/post/*` or `/blog/categories/*` route loses its path;
- `llms.txt` or `ai.txt` calls the MOL Y2K beginning a commissioned photography assignment;
- the canonical Person changes;
- unsupported “official portrait” wording returns;
- a key personal page reintroduces high-risk generic marketing language;
- About navigation is delegated to the browser while the full-screen menu still locks body scrolling;
- Press, Community or Writing loses the shared Curators visual contract.

The first release governed by this complete contract is `20260802-human-curatorial-v26`.
