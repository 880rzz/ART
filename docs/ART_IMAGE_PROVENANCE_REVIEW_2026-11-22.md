# ART image inventory coverage and provenance triage — 2026-11-22

## Source-of-truth reconciliation

Baseline: ART main `5645e76a54e211a666fc6f3be22bf654dd8a6426`, deployed successfully to `www.banhalmi.art`. A complete Git tree scan (not only the `docs/` file) found **1,423 tracked image files** under `assets/img/`, `images/` and `img/` (accepted extensions JPG, JPEG, PNG, WebP, AVIF, GIF, SVG). The existing generated inventory had **1,408**; 15 files were absent and zero existing entries pointed to missing tracked files.

This change regenerates the complete 1,423-file path inventory, preserving every pre-existing classification, `recordId`, `humanReviewed`, and `notes` field. All 15 newly discovered files are `unclassified` / `humanReviewed:false` / `recordId:null`. **No ownership, visual inspection, license grant, model release or human verification has been inferred.**

### The 15 previously omitted files

- `assets/img/books/book-menopauza-szexi/cover.webp`
- `assets/img/books/book-meses-konyv/cover.webp`
- `assets/img/private-photography-{480,720,1080}.{avif,webp}` (six files)
- `assets/img/banhalmi-open-studio-2026-09-25.jpg`
- `assets/img/video/npJ6YeYxQ64.jpg`
- `assets/img/apple-touch-icon.png`
- `assets/img/favicon-{32x32,192x192,512x512}.png`
- `assets/img/favicon-banhalmi-20260815.svg`

### Review batches (file counts, not distinct originals)

| File collection | Tracked files | Review intake |
| --- | ---: | --- |
| Exhibition galleries (19 directories) | 544 | Check original work/photographer evidence and derivatives, by exhibition |
| Blog/media illustrations | 462 | Separate published photography, third-party illustrations and repurposed images |
| Image pool (8 filename prefixes) | 234 | Map exact files to originals, not merely prefixes |
| Best-of collection | 131 | Cross-match binaries to originals if possible; no filename-based ownership |
| Five book image folders | 5 | Confirm rights of composite covers separately from photographers' credits |
| Other root/identity/hero/video files | 47 | Prioritise hero, portrait-circle, logos, video stills and responsive transformations |
| **Total** | **1,423** | **All entries remain unreviewed until source evidence is recorded** |

Review-batch grouping is operational only. It does **not** establish that different filenames are the same photograph or that a whole folder has one rights holder. Deduplicate only after binary checks (hash/pixel or documented source lineage), and preserve previously published Commons CC BY-SA grants.

## Technical control

`tests/audit-image-inventory-coverage.mjs` now compares the inventory against the actual asset tree in read-only mode on every `npm test`. Newly committed images without an inventory entry, stale/deleted inventory paths, duplicate keys or unverifiable review flags fail the gate. Generate an updated inventory with `node tools/build-image-inventory.mjs` when a new asset is committed; it retains existing human review metadata.

This is a **technical inventory completeness fix**. It is not the end of the asset-by-asset legal review. Neither structured-data eligibility nor a Google Images `Licensable` badge is guaranteed by this ledger.

## Follow-up gates before declaring rights complete

1. **Visual and provenance:** collect source original, creator, date/context, documented permission/consent where needed, and a link to the exact reviewed asset. Do not use an owner-wide declaration as individual original-file proof.
2. **Published derivatives:** correlate each source master to every generated responsive/hero/cropped file, using reproducible lineage and binary XMP/IPTC inspection where applicable; these build-only artifacts may not appear in the source Git tree.
3. **License semantics:** keep genuine Commons CC BY-SA exceptions; distinguish book cover design/typography rights from photographic authorship; do not fill missing `license` with a guess.
4. **Human editorial review:** only set `humanReviewed:true` with a referenceable review record and recorded notes, as specified by `docs/image-review-workflow.md`.
5. **Public validation:** after any real rights-data change, pass the normal PR/CI/Pages exact-live gate, then check Google re-crawl and displayed rich-result status separately.

Related source verification remains a distinct backlog: `master-source-database.json` has 111 records referencing 110 distinct URLs, with 109 `pending-live-check`; the HTTP reachability test in `tools/audit-source-ledger-live.mjs` does not corroborate editorial claims or automatically change statuses.
