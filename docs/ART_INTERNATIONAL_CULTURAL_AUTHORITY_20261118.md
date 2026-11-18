# ART — international cultural and institutional authority (18 Nov 2026)

## Purpose

Extend the **five-period, two-depth artistic archive**, never replace it with a corporate resume. The hierarchy is: photographs and artistic decisions → five periods → exhibitions, books and the cultural structures the artist helped create → dated independent sources and curator documentation. Preserve the #407 design: Apple-minimal editorial, one left axis, no text near cell borders, 24–32 px card insets, same EN/HU/de-AT reading order.

## Verified evidence and exact role scope

| Period | Reference | Evidence | Safe claim / boundary |
| --- | --- | --- | --- |
| II (2014–16) | Mérföldkövek ’56, New York | https://magyarforradalom1956.hu/aktualitasok/hirek/v/merfoldkovek--56-os-portrekepekbol-rendeztek-kiallitast-new-yorkban/ (17 Nov 2016) | 1956 émigré memories, portraits and historical objects; photographer Bánhalmi Norbert; exhibition curator Balogh Dávid. Historical organizers, sponsors and media partners are not today's endorsers. #408 handles localized provenance. |
| III (2017–18) | Olympus / now OM SYSTEM | https://www.milcclub.com/ambassadors and the publisher interview already linked at /writing.html | Official Hungarian photography ambassadorship and educational/professional writing context; NOT an institutional endorsement of every artistic project. |
| IV (2019–22) | Rege Galéria, Tihany | 2020 venue account https://apatsagicukraszda.hu/rolunk ; gallery https://www.regegaleria.hu/ ; dated 2021 The Frame press archive https://www.regegaleria.hu/m%C3%A9dia | Digital presentation of photography, painting and graphic arts: 2020 concept, 2021 documented shows. Gallery participation in Veszprém–Balaton 2023 (2022–23) must not become an unproved blanket “official partner” endorsement. |
| V (2023–present) | VIPACH — Vienna Photo Art & Creative Hub | https://www.vipach.at/kapcsolat/impresszum ; https://www.vipach.at/event-details/spontan-vipach-fotokiallitas-2026 | Vienna-based arts education, workshops and exhibited art. Not a separate legal person: a project within the Vienna Hungarian School and umbrella federation. At SPONTÁN (2026) 20 works, curator Balogh Dávid, chief patron Bánhalmi Norbert. |
| V (current) | MFVSZ affiliation | Existing ART membership record; independent artist biography https://fenykepeszkor.hu/egyesuleti-tag/banhalmi-norbert/ | Personal membership; **do not assert an Austrian federation representative office** without formal evidence. |

### Claims withheld for lack of verified evidence

1. VIPACH “700+ members”: distinguish community-channel followers, school participants, active club attendees and the umbrella federation's legally registered members. Do not publish an exact figure until a dated register establishes its definition.
2. MFVSZ Austrian representation or office: membership != office or leadership.
3. Veszprém–Balaton ECoC: programme participation != official institutional endorsement of the artist.
4. AmCham/IBM/embassy/client logs and corporate partnerships belong to BANHALMI Professional and must not become an ART logo wall. The Marco Porak IBM offer is NOT an arts institutional reference.
5. EUFÓRIA in development != completed institutional exhibition.

### Implementation

- Human-facing changes are **only in existing 3-language community timeline paragraphs**; no new homepage/curator block, no CSS, no image or gallery edit. The existing Person-authority and ecosystem-bridge JSON-LD files also receive a narrowly scoped description of VIPACH's creative affiliation and non-independent legal status, without changing canonical IDs, schema types or sameAs values.
- The existing `tools/audit-authority-integrity.mjs` test now protects 2020/2021/2022 REGE chronology, official source links, VIPACH legal boundaries (both visible and in JSON-LD), SPONTÁN curatorial roles, and rejection of an unsourced 700-member number.
- Publication/writing already has OM SYSTEM primary listing, the Bridges article and differentiated artistic versus corporate memberships. Extend only on further source evidence; no unsourced Austrian MFVSZ official role.
- Press must distinguish independent contemporary reporting, project press releases, author statements and primary archival records.
- The English institutional art portfolio is a later, image-rights-reviewed curatorial artifact with photographs, five periods, five books, exhibitions, source credits and usage terms. It must not mix in corporate commercial proposals.

### Release gate and status

#407 needs its exhaustive design CI, merge and exact-live SHA. Reconcile stacked #408 and separate #406 first; this small editorial branch may be reviewed independently but must be rebased/checked against final main before release. Pass Audit, Palette, responsive browser QA, PageSpeed, links, confidentiality, deploy, exact-live verification. Only after verified production submit changed URLs to GSC. **Prepared ≠ live.**
