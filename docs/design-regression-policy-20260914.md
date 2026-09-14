# ART design regression policy — 2026-09-14

Historical screenshot defects are release-blocking. `data/design-authority.json` is the only geometry source of truth; audit code must read it and may not invent competing canvas widths.

Every published EN/HU/DE content page is evaluated from 320×568 through 3840×2160 for overflow, media containment, canonical wrapper geometry, editorial axes, navigation and touch targets, Press geometry, footer composition and historical separator regressions.

The museum/editorial identity remains independent from the professional BANHALMI site. Build, restore and hardening tooling may not restore the old footer separator, narrow Press records, conflicting wrapper widths, or runtime design authority. Any change to the canonical design authority must move together with rendered browser evidence and regression tests.
