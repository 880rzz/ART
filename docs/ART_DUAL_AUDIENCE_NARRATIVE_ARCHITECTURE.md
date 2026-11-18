# BANHALMI ART — one artistic life, two reading depths

**Scope:** whole public artistic site in EN, HU and Austrian German, not only the curator page. The audience includes ordinary visitors, artists, researchers, journalists, collectors and institutional curators. Each must understand *who Norbert Bánhalmi is, how the photographic practice emerged, why its themes changed and which works prove each transition*.

## Canonical narrative hierarchy

1. **Person:** Begin with a human introduction, not a commercial pitch, academic abstraction, source registry or collector request.
2. **Experience and question:** Explain the actual person, scene, encounter and artistic intention behind the work; distinguish interpretation from verified testimony.
3. **Five periods:** Show a coherent chronology in everyday language and use the canonical dates and curatorial period IDs in `data/archive/oeuvre-periods.json`. Do not maintain a contradictory four-stage homepage timeline.
4. **Works:** Offer a representative image, project/exhibition and book for each development. Describe what changed and what remained continuous.
5. **Context:** Provide documentary details, collaborators' correct roles, original titles, citations, licensing and period relationships.
6. **Curatorial depth:** Allow a researcher to explore full dossiers, historical sources, bibliography, archival structure and alternative readings without requiring an ordinary visitor to wade through them.
7. **Optional next step:** Collections, enquiries, publicity, education and professional photography must follow the artistic story and remain distinct by purpose.

## Five periods

- **I — 1999–2013:** Digital and documentary beginnings; discipline, public roles and the people behind them.
- **II — 2014–2016:** Real Women, Milestones ’56, identity, emigration and shared memory.
- **III — 2017–2018:** Awakening, illness, self-image, bodily change and recovery.
- **IV — 2019–2022:** Publications, exhibition practice, institutional and digital presentation; A menopauza szexi began approximately 2022 but was published in 2026. Do not confuse creation and publication years.
- **V — 2023–present:** Community, education, touch, and public presence. EUFÓRIA is still in development; do not present a proposed exhibition as completed.

## Site-wide page contracts

**Home:** Concise five-stage orientation with plain-language descriptions and period deep links. Curatorial page should be an invitation to deeper understanding, not the only location where the life story is intelligible. Keep a light, photography-first design.

**Curators:** Publicly readable human introduction and the five periods visible by default. Separate optional project histories, artistic method, provenance and research links. Place collector enquiries *after* understanding the artistic work.

**20 exhibitions / projects:** Who was photographed? What situation happened? Why that choice? Where does the project fit in the life story? Which original photographs and documents prove it? Identify historical curators, partners, organisers and rights holders precisely; no current endorsement inferred from old relationships.

**Five books:** Why does the book exist? Whose words and images does it contain? Who authored, photographed, edited and published it? Original Hungarian bibliographic Book.name, localized alternateName, ISBN, source and cover. Link back to the relevant period and companion work.

**Selected works and galleries:** Visual first, then a concise human explanation; deep links to the related exhibition, book and period. Do not hide essential authorship or licence context.

**Press and archive:** Distinguish independent reporting from artist testimony, archived sources and unverified records. Time and topic-based browsing should support the life story rather than replace it.

**Community / education:** Explain how artistic concerns grew into shared projects and mentoring. Do not imply commercial services or membership equals artistic endorsement.

## Three-layer reading model

- 30 seconds: Understand the person, primary question and five stages from the home.
- 3 minutes: Follow individual projects, selected works and the development across the periods.
- 30 minutes or research session: Open detailed curator records, bibliographic and institutional sources, historical credits and machine-readable provenance.

## Production and QA contracts

Keep canonical / hreflang / sitemap and original Book/ImageObject/Person/CreativeWork schema, image copyright, source rights, consent-first GDPR, AI Trust, accessibility, keyboard/touch, responsive layout and performance intact. Rebuild stale stacked PRs against an exact current main; no direct main pushes. Audit, Palette, mobile/desktop Lighthouse and exhaustive browser QA, links and confidentiality checks are mandatory. GitHub Pages deployment and exact-live SHA verification precede any production claim. Vercel is redirect-only.

## Delivery states and limitations

This contract sets the standard for the **whole website**. Implementation must proceed in limited, testable PRs, starting with home and curator navigation, followed by representative work and full content coverage. Merely adding a document or changing one introduction is **not** completion of the whole-site redesign. The 111-item source database requires separate verification; a page's existence does not prove the linked source is currently reachable. Preserve #404's curatorial introduction and the independent #405 historical Balogh Dávid credit. Never directly merge stale #390 content over updated main.
