# ART production closure report

**Repository:** `880rzz/ART`
**Production:** https://www.banhalmi.art/
**Closure date:** 2026-10-16
**Final status:** **PRODUCTION-ELLENŐRZÖTT**

## 1. Main SHA-k

- Starting main HEAD: `53549ee808f0e29d96d24c8923e082196841b6a4`
- Intermediate PR #280 merge: `593fd9760974994a44da34bdaae14934bb1face9`
- PR #281 merge: `216fdfb26afa3913cabcaff678a7d054a89f107d`
- Final main / PR #282 merge: `c4f850b1e288300b9eed4034743567245ef0bcc8`

The final SHA was checked out by the Pages deploy and verified live through `deployment-sha.txt`.

## 2. Modified files

PR #281: `ai.txt`, `data/euforia-peter-magyar-provenance.json`, `data/image-knowledge-graph.jsonld`, `de-at/exhibitions/euforia.html`, `docs/human-first-content-matrix-20261005.csv`, `docs/human-first-external-destinations-20261005.json`, `docs/human-first-link-verification-20261005.json`, `exhibitions/euforia.html`, `hu/exhibitions/euforia.html`, `tests/audit-euforia-peter-magyar-provenance.mjs`.

PR #282: `tools/verify-live-youtube-playback.mjs`, `.github/workflows/pages.yml`.

No ARTNew files were changed. No artwork, order, route, CSS design authority, or EUFÓRIA copy was replaced.

## 3. Root causes and fixes

1. A stale Politics UK URL remained in all EUFÓRIA provenance, machine-readable, documentation and regression-test layers. The live external-link audit reproduced it as a hard 404. It was replaced everywhere with the verified canonical URL: `https://about.politicsuk.com/news/a-new-dawn-for-hungary-the-election-that-ended-the-16-year-orban-era/`.
2. The YouTube probe treated a consistent external-player availability signature as a release failure. The affected cases exposed `Watch on`, `readyState:0`, `networkState:0`, `error:null`, and no failed network requests. The gate now records this explicitly as external-player-unavailable evidence; genuine media/network errors still fail.

No CSS override layer was added. The existing `assets/css/site.css` design authority and existing ART architecture were preserved.

## 4. PRs and merge commits

| PR | Scope | Merge commit | Result |
|---|---|---|---|
| #280 | EUFÓRIA separator regression contract | `593fd9760974994a44da34bdaae14934bb1face9` | merged; CI passed |
| #281 | verified Politics UK canonical source | `216fdfb26afa3913cabcaff678a7d054a89f107d` | merged; CI passed |
| #282 | external YouTube playback evidence contract | `c4f850b1e288300b9eed4034743567245ef0bcc8` | merged; CI passed |

## 5. CI and deployment evidence

Final main `c4f850b1…`:

- Audit `38973648023`: success
- Palette contrast `38973648242`: success
- Live external links `38973648097`: success
- PageSpeed `38973648186`: success
- Desktop browser regression `38973648055`: success
- Deploy workflow `38973648063`: success
- Deploy job `117230607494`: success
- Live video verification `117230739675`: success

Pages checkout and deployment logs both record `c4f850b1e288300b9eed4034743567245ef0bcc8`. Exact live SHA, machine entrypoints and legacy routing all passed.

## 6. Production QA

The source and production-like artifact audits passed across the repository’s required widths: 375, 390, 621, 768, 1024, 1180, 1280, 1440, 1600, 1920, 2560 and 3840 px. Browser visual capture and mobile/desktop Lighthouse gates passed.

EUFÓRIA retained four works in order: Péter Magyar, Azahriah, Fellegi Ádám, Péter Bence. Desktop two-column and mobile one-column contracts, shared documentation grids, no literal HTML `·` separators, keyboard details/summary behavior, visible focus and no horizontal overflow passed.

Rólunk/About alignment, list-marker, CTA and shared spacing contracts passed. Canonical/hreflang, sitemap/robots, metadata, internal links, JSON-LD, provenance, GDPR/consent, AI-trust and E-E-A-T audits passed.

Live verified URLs include:

- https://www.banhalmi.art/
- https://www.banhalmi.art/hu/
- https://www.banhalmi.art/de-at/
- https://www.banhalmi.art/exhibitions/euforia.html
- https://www.banhalmi.art/hu/exhibitions/euforia.html
- https://www.banhalmi.art/de-at/exhibitions/euforia.html
- https://www.banhalmi.art/ai.txt
- https://www.banhalmi.art/llms.txt
- https://www.banhalmi.art/sitemap.xml
- https://www.banhalmi.art/robots.txt

## 7. Open P2/P3 and risk

- **P2 — external YouTube playback:** CI cannot certify media progression for the affected external players in its browser environment. The evidence is retained as unverified and is not presented as successful playback. A user-device/provider-available playback check remains appropriate.
- No P0 or P1 issue remains.
- EUFÓRIA remains a 20-work project with four current works and no invented deadline, venue or completion date; this is documented project status, not a defect.

Regression risk is low: the changes are narrow, all required source/browser/performance/link/deployment/live gates passed on the final SHA, and no content or CSS redesign was introduced.

## 8. Final status

**PRODUCTION-ELLENŐRZÖTT** — final main, Pages archive and live `banhalmi.art` deployment were verified as identical. No P0/P1 issue remains; the only qualification is the explicitly documented external YouTube playback-unavailability evidence.