# ART editorial remediation — pre-release checkpoint, 2026-10-06

This is an immutable checkpoint before final PR checks and deployment, not a statement that the full editorial project or production release is complete.

## Scope implemented

- Six registered publications restored as actual links on the EN/HU/DE writing pages: 18 link occurrences. Original Hungarian titles remain, with local-language guidance and source-language/archive labels.
- The publication component retains bounded prose while the surrounding structured list remains full width. The original long-row browser failure was reproduced and repaired without removing text or relaxing the existing browser gate.
- Thirty-six incorrect period assignments across twelve exhibition groups are reconciled with the existing record-depth period and the shared `data/archive/oeuvre-periods.json` contract.
- Nine period-title variants are aligned with that same contract.
- Twenty-one mechanically truncated record summaries are completed using the same page's existing full introduction, archival header and bibliographic/historical details. No new dates, venues, contributors or personal quotations were invented.
- Sixty-nine machine-readable related-record links to the missing `#presence-periods` anchor now point to the actual `#journey` section already used by the visible archive navigation.
- Three writing pages and fifty-five book/exhibition pages contain scoped changes. This does **not** mean fifty-eight pages have received a complete editorial rewrite.

## Source and test evidence

Original production baseline: `5703c535881d893eb566edefd34e91b3bede0182`.

Rendered publication proof: source `3469d941c03128b8195d05aa91d96711d26fdd65`, Actions run `37439053303`, artifact `11400691173`. The three writing pages passed at twelve widths (36 states / 216 publication checks); the largest publication row measured 652.953125px, and no horizontal overflow was found. See `publication-layout-verification-20261006.json`.

Record correction source: `1210562b656f3918d80e3b42d9b42430b1a338c7`. The full source audit and source-history sitemap gate passed in the isolated branch-only repair before its push. See `record-period-consistency-20261006.json` for the exact per-page changes.

The extended record-depth gate rejects the original snapshot with 171 cross-layer violations (these are repeated checks, not 171 distinct editorial incidents). It checks all 69 book/exhibition records in 23 translation groups for period/year/registry agreement, period deep links, complete summaries, language coverage and machine-link fragments. The repaired snapshot passes. The original record-depth checks are retained.

A local audit initially encountered an existing environment-sensitive path exclusion: a repository under `/mnt/data` is excluded by the older GDPR gate's absolute `data` path test. Re-running the unchanged complete source suite from `/tmp/art-record-verification` passed. No privacy gate was weakened. Local Chromium navigation is restricted, so final rendered record regression is required on the normal GitHub runner and production domain.

## Preserved boundaries

All visible href values and image tags on the 55 record pages are preserved. Canonical/hreflang links, identity IDs, consent behavior, the full main narrative outside the identified record blocks and EUFORIA's undated exhibition boundary are unchanged. Professional and Blog repositories were not modified. Temporary branch-only repair scripts/workflows are absent from the final tree.

## Remaining work — not certified by this checkpoint

- Complete page-by-page human editorial reading and rewriting across all 84 canonical routes / 28 translation groups.
- Integrate the full verified source corpus into the visible press, community, project and book pages, without an arbitrary 35-record cap.
- Reorganize written, audio and video coverage by artistic period and project while distinguishing independent reporting, authored publications, credits and collection pages.
- Reconcile the inconsistent Mindennap Konyv availability/link representation.
- Finish semantic verification of recovered Wayback sources. Four historical ART captures and three exact Tripont captures were readable; recovered labels still need checking against their target articles. The old ORF 3228649 label was found to describe a different subject than the actual article.
- Finish the curator/main-page narrative hierarchy and multilingual explanations.
- Address the separate PR-protection and unique check-name governance recommendations without weakening release gates.
- Measure actual search and reader outcomes separately; no ranking, CTR or AI-recommendation improvement is asserted.

## Release gates still required at this checkpoint

Exact-head required CI; full artifact browser/expanded-state regression; merge; Pages deployment; exact custom-domain SHA; HU/EN/DE source-link and record readback; rendered production checks; reverse audit. Do not infer production success from this document or a source commit.
