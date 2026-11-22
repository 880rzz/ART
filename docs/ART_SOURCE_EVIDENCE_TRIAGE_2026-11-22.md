# ART public-source evidence triage — 2026-11-22

## Observed evidence (not a rights or editorial attestation)

Read-only GitHub Actions run: [ART public source ledger evidence #45020845181](https://github.com/880rzz/ART/actions/runs/45020845181). Evidence artifact: [#14753038547](https://github.com/880rzz/ART/actions/runs/45020845181/artifacts/14753038547), captured 2026-11-22 12:10 UTC, before the publisher URL repair in PR #447 and this change.

| Outcome in that captured run | Records |
| --- | ---: |
| HTTP reachable; claim **not verified** | 87 |
| HTTP 429 / anti-bot or rate limiting (mostly YouTube) | 13 |
| HTTP 403 / access denied | 5 |
| HTTP 404 / source or endpoint needs recheck | 5 |
| Fetch or redirect unavailable | 1 |
| **Total** | **111** |

The network evidence is point-in-time, not a permanent status or proof of publication, copyright or claim credibility. The ledger currently has 111 source IDs and 110 distinct URLs; 109 rows remain `pending-live-check`, 1 `verified-live`, and 1 `corroborated-by-public-program`. No row may be upgraded merely because HTTP returned 200, and 403/429 do not by themselves prove content removal.

### Two pinpointed obsolete permalinks

1. **OM SYSTEM Hungarian ambassadors**: old `https://www.milcclub.com/ambassador` was HTTP 404 in the captured run. PR [#447](https://github.com/880rzz/ART/pull/447) already changed `wikipedia-source-028` to the publisher's exact `https://www.milcclub.com/ambassadors`. No further replacement is needed in this change.
2. **The Hungary Report opinion**: `wikipedia-source-014` pointed to `https://thehungaryreport.com/orban-strongman-spell/` (HTTP 404 in the captured run). The same outlet's current article is [Opinion: The End of the Strongman Spell](https://www.thehungaryreport.com/p/opinion-the-end-of-the-strongman), by Péter Dósa, dated 2026-03-30. The published article credits **Norbert Bánhalmi via Wikimedia Commons** for a portrait of Péter Magyar; it is suitable evidence of the publication/credit, not endorsement of the commentary's political claims. Only this source URL is changed; original source ID, role, provenance registry and `pending-live-check` status remain unchanged. Original broken URL remains traceable in Git history.

### Remaining publication checks

- **Jazzy interview `wikipedia-source-020`**: original jazzy.hu endpoint returned 404 to the CI HTTP client. A same-episode third-party copy is indexed at `https://podiverzum.hu/podcast/90-9-jazzy-dr-jazzy/banhalmi-norbert-fotomuvesz-2684b15a` (90.9 Jazzy / Dr. Jazzy, 2024-09-21). Do not silently replace the broadcaster with a third-party host; first confirm episode authenticity and approved citation role.
- **Saatchi Art `wikidata-statement-source-010`**: CI HTTP 404 conflicts with an indexed public Saatchi profile. Treat as inconsistent fetch environment, not proof that the artist profile vanished.
- **YouTube**: thirteen HTTP 429/anti-bot outcomes require browser/API playback checks, not broken-link declarations. Live playback has a separate evidence trail from structural embed presence.
- **Five 403 outcomes and the remaining 404/unreachable records**: verify original publisher, canonical redirect, relevant archive snapshot and exact claim before changing the public source. Never promote a fallback home page as an exact primary reference.

## Acceptance criteria for editorial completion

1. For each source, record exact URL, publisher, document/episode title, date, HTTP evidence and a claim-to-source match with dated verification.
2. Separate reachability, independent authority, first-party testimony, archives and publisher reuse rights.
3. Preserve original source IDs, URLs through Git history, and meaningful existing press/curatorial relationships.
4. Only when independently reviewed, update a row's `verification` status and `lastChecked`, run the read-only source audit, then PR → full required CI → exact-live verification.
5. Keep private correspondence, image subject permissions and copyright out of source-reachability inference.
