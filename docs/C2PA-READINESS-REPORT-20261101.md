# C2PA / Content Credentials readiness — BANHALMI ART

**Status: NOT READY**

Date: 2026-11-01 (Europe/Budapest)

## Current state

- Published ART pages expose machine-readable **schema.org** image licensing (`license`, `acquireLicensePage`, `creator`, `copyrightHolder`, `creditText`, `copyrightNotice`) for gallery, book, exhibition and shared identity ImageObjects.
- Repository / optimized web assets do **not** currently carry verifiable C2PA manifests or Content Credentials.
- No signing key, credential store, or verification UI is wired into the ART publish pipeline.
- No camera → RAW → export → signed derivative chain is documented or automated in this repository.

## What is intentionally not claimed

Do **not** assert on ART pages or in structured data:

- human-made / human-generated
- not AI-generated
- Content Credentials verified
- cryptographic provenance of capture

Those claims would be decorative without a real signature chain.

## Missing technical links

1. **Capture / RAW workflow** — OM SYSTEM (and other) originals must retain edit history suitable for C2PA assertion mapping.
2. **Export signing** — Lightroom / Capture One / custom CLI must embed a signed C2PA manifest at export time.
3. **Key management** — long-lived creator/organization certificates; rotation; revocation.
4. **Hosting** — manifests must survive WebP/AVIF recompression and CDN transforms (or sidecar + HTTP Link).
5. **Verification UX** — optional UI that only appears when a real manifest validates.
6. **AI-modified path** — if generative fill / replacement is ever used, that must be a separate labeled assertion, never mixed into first-party photograph records.

## Interim trust model (implemented)

Documented creator + rights + first-party publication context via:

- ImageObject / Photograph JSON-LD
- `#copyright` license target on ART
- Professional `acquireLicensePage` for commercial licensing
- Commons CC BY-SA records where the file is already published on Wikimedia Commons

## Decision

**C2PA: NOT READY** — do not ship mock badges. Revisit only after a signed export pipeline exists and survives the Pages optimization path.
