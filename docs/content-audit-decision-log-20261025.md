# Content audit decision log — 2026-10-25

Source brief: `docs/BANHALMI_VOICE_AND_CONTENT_AUDIT_2026-10-25.md`  
Diff inventory: `docs/content-audit-before-after.csv`

## Decisions (ART)

| Change | Decision | Why |
|---|---|---|
| `presence-context--intro` | **Shorten** | Keep artistic question; drop catalogue sentence before works |
| HU `#about` body | **Trim to EN parity (~10 paras)** | Homepage orients; long biography belongs on artist pages |
| Section hairlines around presence | **One edge** | Stop double border-top from presence + `section+section` rule |
| Brand voice | **Keep observational** | No Professional quote funnel; Anatomy of Presence / EUFÓRIA links retained |
| Private photography H1 EN/HU/DE | **Rewrite** slogan → factual category | “A photograph that is yours” → “Personal portraits and boudoir” (+ HU/DE); title/meta kept |

## Deferred

- Renaming artworks/exhibitions for SEO: forbidden by brief.
- Full project-page voice pass: separate PR after homepage lean ship.
- IPTC binary image tagging: out of scope.

## Completion matrix (honest status)

| Surface | Status | Notes |
|---|---|---|
| ART homepage lean + separators | **Done** | Thesis kept, catalogue trimmed |
| ART private photography H1 | **Done** | Slogan → factual category |
| ART exhibition factual “luxury/exclusive” strings | **Keep** | Alt text / source URLs, not marketing claims |
| ART homepage titles/meta | **Locked keep** | SEO owner strings retained |
| Full project-page voice pass | **Not done** | Separate follow-up |
| Professional entry cleanup (sibling repo) | **Done** | Homepage fluff, contact, CTAs |
| Full Professional service H1 rewrite | **Not done** | Needs SEO-owner approve |
| IPTC binary tagging | **Out of scope** | |

**Verdict:** entry surfaces and structural fluff cleanup are complete on both repos for this voice/first-principles pass. A separate, approved SEO-owner rewrite would be required for every remaining service H1 candidate in the brief.
