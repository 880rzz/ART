# BANHALMI ART — strict first-principles E-E-A-T audit

Date: 2026-09-11
Scope: `banhalmi.art` artistic authority layer and its machine-readable projection. The editorial layer at `blog.banhalmi.art` is audited separately in Wix before Phase 1 is closed.

## Decision model

This audit treats E-E-A-T as evidence architecture, not a synthetic score. A claim is useful only when its subject, relationship type, provenance and canonical owner are unambiguous.

### Experience

Strong baseline. The archive contains first-party, dated practice evidence rather than only marketing copy: artistic chronology since 1999, books, exhibitions, projects, archive records, life-journey data and image-level provenance. The archive role remains artistic evidence, not booking/pricing authority.

### Expertise

Strong baseline. The canonical Person is Bánhalmi Norbert (`Q56391118`). Fine-art photography and artistic nude photography are explicit specialisms; curatorial and authored context are preserved. Professional qualifications/memberships may support expertise but must not be converted into endorsement.

### Authoritativeness

Strong baseline. Authority is backed by source registries, verified press records, ISBN-bearing works, Wikidata/Wikipedia/Wikimedia evidence and preserved source records. ART owns artistic evidence; it must not absorb current commercial-service or partner-company graphs.

### Trust

P1 drift found and fixed at the canonical layer:

1. ART still mirrored the legal business as `Norbert Banhalmi e.U.` in machine contracts. The current professional canonical legal Organization is `Banhalmi Norbert e.U.`.
2. ART still used the retired exact positioning value `Professional Photography Team` in machine contracts. The protected model is primary Brand `BANHALMI`, secondary photography-facing name `BANHALMI Photography`, canonical team descriptor `Photography Team`.
3. E-E-A-T relationship boundaries were distributed across several files but were not a single release gate. A strict E-E-A-T audit is now part of `npm test`.

The production artifact hardener now consumes the canonical professional identity mirror, normalizes Organization/Brand nodes on the multilingual ART homepages, generates LLM/AI projections from the same source, and fails if the retired positioning returns.

## Relationship guardrails

- photo credit / editorial reuse ≠ client or commission
- membership ≠ endorsement
- event participation ≠ partnership
- historical founder status ≠ current ownership
- volunteer social/community work ≠ employment
- scalable collaborator capacity ≠ permanent employee headcount
- New York oeuvre/reference context ≠ permanent business location
- political/editorial subject matter ≠ political endorsement

## Layer ownership

- `norbertbanhalmi.com`: current professional/commercial authority, legal business facts, services, pricing, locations, enquiries and professional relationship evidence.
- `banhalmi.art`: artistic oeuvre, books, exhibitions, archive/provenance, curatorial and artistic evidence.
- `blog.banhalmi.art`: editorial/knowledge authority, photography history, authored interpretation and source-led articles.

No layer may strengthen itself by duplicating or reclassifying another layer's canonical facts.

## Release gate added

`tools/audit-strict-eeat.mjs` now blocks release on:

- missing first-party Experience evidence
- missing Expertise anchors
- missing authority/source registries
- legal Organization drift
- BANHALMI/BANHALMI Photography/Photography Team drift
- relationship-boundary loss
- layer-ownership drift
- reintroduction of retired machine values
- invalid `ProfilePage.dateCreated` / `ProfilePage.dateModified` values

## Phase 1 closure condition

ART is not declared fully Phase-1 complete until:

1. all ART CI/release gates pass,
2. the exact ART commit is deployed and live-verified,
3. the Wix blog receives the same strict editorial E-E-A-T audit and required fixes,
4. the ART ↔ professional ↔ blog authority boundaries are live-consistent.

Only after those conditions are met should Phase 2 begin for HIPStudio, VIPACH, Bécsi Magyar Iskola, REGE Galéria, Viko Speier, Központi Szövetség and Bécsi Napló.
