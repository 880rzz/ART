# BANHALMI ART: video and schema remediation, 2026-10-08

Baseline main: `2574a658745a7802b2cc89900aa14150e4424aef` (PR #264).
Production hosting: GitHub Pages, custom domain `www.banhalmi.art`.
Deployment workflow run: https://github.com/880rzz/ART/actions/runs/37770200046

The initial source/live mismatch was a pending Pages deployment. After its completion, all 84 canonical HTML pages, the shared JavaScript and the production CSS bundle matched a locally rebuilt artifact byte for byte. The live SHA stamp matched main. No cache workaround or rollback was needed. The production optimizer uses content-derived CSS bundle names and a source-derived JavaScript version; comparisons must use the compiled artifact, not raw source HTML.

## Scope and targeted corrections

- 267 complete HTML documents: 84 indexable content pages (28 EN, 28 HU, 28 DE-AT), plus migration/noindex documents. Three partial templates are not standalone pages.
- 51 pages link individual YouTube videos. Their 120 distinct page/video associations previously had only three VideoObject records. Add the missing 117 and verify all 120 against official oEmbed and public watch-page metadata for 31 videos. Playlist links remain playlists and are not represented as individual videos.
- The eight requested videos retain their contextual exhibition/book routes in all languages. New page-linked IDs preserve one film identity per canonical page; no film authorship, licence or audio language is inferred from channel ownership or page language.
- Correct A Nő világa ISBN to 9786150018294. The previous schema ISBN 9786150000534 belongs to Szösszenetek. The visible bibliographic data and https://www.lensculture.com/books/20592-the-world-of-woman corroborate the correction. No edition ambiguity is resolved by invention.
- Remove the nonexistent EventCompleted enumeration. Completed exhibitions remain documented through their existing dates, status prose and archive evidence.
- ImageObject creditText, creator and copyrightHolder retain image attribution; remove the music-only creditedTo property. Gallery counts use the additional ItemList type. Remove redundant Event.headline, and replace Product/Service-only isRelatedTo with supported mentions/about relations while retaining ecosystem references.
- Remove out-of-domain additionalProperty projections from Person and the developing EUFÓRIA CreativeWork. Existing affiliation and documentary evidence remain; the project target of 20 is retained in prose, not represented as twenty completed works. Do not invent an occupation for an ambassador role.
- Add the missing stable IDs for 60 galleries, 15 exhibition events, three books and three profile pages. Add 18 missing canonical WebPage records and connect pages, primary entities and galleries, preserving publication language separately from page language.
- Type the nine books’ contributor records. Correct EUFÓRIA’s generic completed-exhibition footer in all languages and preserve its two documented works, planned candidates, unknown venue/date and open completion schedule.
- Correct a reversed German description and a few grammatical/date-drift phrases. Preserve established titles, canonical routes, artwork meanings and copyright boundaries.
- Move keyboard focus to the player after the load button is removed, and restrict YouTube parsing to exact hostnames.

## Verification contract

`npm test` includes the new evidence-backed static video/bibliographic audit. Existing multilingual, canonical, image-licensing, role, provenance, GDPR and identity checks remain mandatory. Tests for ecosystem relations now assert the supported mentions property; venue/date checks recognize explicit visible prose instead of depending on a removed metadata field.

Desktop and production release gates check all content pages at 375, 390, 621, 768, 1024, 1180, 1280, 1440, 1600, 1920, 2560 and 3840 pixels. An additional 612-check video probe covers all 51 video pages at those widths: no pre-action YouTube/analytics requests, no pre-action player, 16:9 geometry, duplicate prevention, accessible labels and keyboard focus. External-player responses are controlled in that probe; it is not a playback certification.

After production deployment, repeat the video/privacy/keyboard probe on the real domain and separately test real media playback for the eight requested videos on all three language routes. Record failures as unverified, with network evidence. Metadata availability or a loaded player alone cannot establish successful playback.

Schema.org vocabulary/domain compatibility is distinct from Google rich-result eligibility. Supplementary evidence videos do not turn exhibition or book pages into video-first watch pages. Search indexing, rich results and ranking outcomes require subsequent GSC/Bing measurements and cannot be promised from passing static checks.

## Closure limits

This document records implementation scope and the baseline deployment proof; it does not certify final production closure. Final main, CI, deployment, live byte comparison and playback results must be reported after merge. Historical/source availability gaps and any external playback restrictions remain explicit blockers where applicable.
