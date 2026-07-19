# Full repair changelog — 2026-07-08

## Critical fixes
- Lexicon modal remains fixed and keyboard accessible.
- Secure random generation now requires Web Crypto; no pseudo-random fallback remains.
- Journal storage is versioned, bounded to 150 records and migrates legacy records.
- English runtime controls, journal messages, placeholders and accessibility names were corrected.

## Architecture
- 25 duplicate CSS blocks from each HTML file were consolidated into one shared stylesheet.
- Application JavaScript was extracted into language-specific assets.
- Shared interaction, ambient scene and runtime enhancement scripts were separated.

## Auditability
Each new journal record stores:
- secure draw ID;
- ISO timestamp;
- engine version;
- deck version;
- selected randomisation mode;
- record type.

## Journal resilience
- JSON export and import;
- duplicate-resistant merge;
- 150-entry upper limit;
- legacy records remain readable.

## Accessibility and performance
- Hidden but real labels for form controls;
- dialog accessible name;
- full keyboard focus containment;
- inert background while the card dialog is open;
- animation pause in hidden tabs;
- reduced-motion safeguards;
- content visibility for off-screen views;
- mutation observation restricted to the application shell.

## Removed
- right-click blocking;
- F12 / developer-tools shortcut blocking;
- insecure xorshift random fallback.

## 2026-07-09 — SVT-inspired pendulum system expansion
- Added a structured 14-stage pendulum workflow inspired by publicly described SVT methodology.
- Added preparation-to-work, permission/readiness, primary-program/all-clear, theme, source, time-layer, life-area, intensity, correction, replacement, repeat-check, mop-up, integration and final verification charts.
- Preserved the exclusive “All is well” result: when selected, no additional chart, card or clearing follows.
- Added re-check loop when final verification indicates a remaining layer.
- Added explicit wording that this is a symbolic self-inquiry implementation, not an official licensed SVT course, diagnosis or treatment.
