# ART — Evidence graph integration note (2026-10-31)

Companion to Professional `docs/entity-authority-20261031/EVIDENCE-GRAPH-INTEGRATION-20261031.md`.

## Reused ART surfaces

- `authority-bridge.json`, `ecosystem-bridge.json`, `knowledge-core.json`, `data/machine-core.json`
- `press-source-registry.json` (35×EN/HU/DE), `master-source-database.json` (111), `archive-record-registry.json` (69)
- `deep-search-evidence.json`, `service-evidence-map.json`, `data/image-knowledge-graph.jsonld`, `data/video-evidence.json`

## Targeted fixes on this branch

1. **`authority-bridge.json` books URL** — `https://www.banhalmi.art/books.html` (missing) → `https://www.banhalmi.art/#books` (live homepage books section).
2. **`press-09`** — source host unresolved → `archived-exact-source` in EN/HU/DE; ART `#press-09` retained.
3. **`press-08`** — automated 403 noted; exact-source URL retained with archive/Wayback availability note.
4. **`deep-search` Jazzy interview** — primary URL moved to live Podiverzum corroborating mirror after jazzy.hu 404; classification/guardrail unchanged.
5. **Magyarvélemény aggregator** — 403 to bots noted; review-aggregation guardrail retained.

## Not invented

No new parallel evidence registry. No new VisualArtwork JSON-LD mass injection. No sameAs expansion for press credits.

## Validation

- `python3 tools/audit_press_source_registry.py` — passed after quality updates
- `node tests/audit-service-evidence-map.mjs` — passed
- `node tools/audit-authority-integrity.mjs` — passed
