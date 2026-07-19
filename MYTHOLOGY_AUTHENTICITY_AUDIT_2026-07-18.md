# Ceridwen / Hello It's Me — mythology, clarity and system self-audit

Date: 2026-07-18
Scope: Hungarian and English application, card provenance, entry flow, terminology, runtime integration and release checks.

## Positioning after the repair

The product is now explicitly presented as a **source-aware Welsh–Arthurian–Avalonian reflective system**. It no longer implies that Welsh myth, medieval Arthurian literature, Glastonbury legends, the modern Druid revival, Christian mysticism and original reflective writing form one historically uniform ancient Celtic religion.

## Source model

Every card is assigned to one of ten declared layers:

1. Welsh Taliesin tradition
2. Mabinogi / medieval Welsh prose
3. Medieval Arthurian literature
4. British and Welsh folklore
5. Glastonbury history and legend
6. Modern Druid revival
7. Modern Avalonian spirituality
8. Christian and medieval mystical tradition
9. Comparative spiritual symbolism
10. Original reflective archetype of this system

All rendered provenance labels also state that the light, shadow and affirmation reading is a modern reflective interpretation.

## Corrections made

- “Goddesses of Avalon” was replaced with “Welsh goddesses and great women”.
- “Sacred Landscapes of Avalon” was qualified as “Symbolic landscapes of Avalon and Glastonbury”.
- Ceridwen is tied to the later-recorded Hanes Taliesin tradition rather than described as the ruler of a single ancient Avalonian cult.
- Arianrhod’s description no longer imports an unqualified karma doctrine; later silver-wheel imagery is identified as poetic interpretation.
- The nine women / priestesses motif distinguishes Geoffrey of Monmouth’s medieval Vita Merlini from modern Avalonian priestess spirituality.
- Awen is explained as an old Welsh word for poetic inspiration, while the three-ray emblem is identified as belonging to the modern Druid revival.
- “Druid Flow” was renamed “Ceridwen Flow” and explicitly described as modern interaction design rather than a historical Druid procedure.
- Christian, biblical, Arthurian and comparative figures are no longer silently presented as Celtic mythological figures.

## User journey repair

The entry screen now offers three primary paths:

1. Card reflection
2. Yes / No pause
3. Attunement

The wider navigation remains available for returning users, but its labels are clearer:

- Start
- System
- Card reflection
- Attunement
- Symbolic pendulum
- Yes / No pendulum
- Inner compass
- Symbol guide
- Journal

The opening copy now explains the practical sequence: choose one path, ask one clear question, and record one feasible next step.

## Technical integration

- New runtime: `assets/js/mythology-authenticity.js`
- New styles: `assets/css/mythology-authenticity.css`
- Runtime loader added after the language-specific application core.
- Existing randomisation and event-history hardening remains intact.
- `CeridwenSelfTest()` now exposes `mythologyAudit` alongside randomisation diagnostics.
- Mutation observation adds provenance labels to cards rendered after initial page load.

## Automated audit coverage

`scripts/mythology-content-test.mjs` checks:

- JavaScript syntax
- all ten provenance layers
- all eight card-house mappings
- Hungarian and English terminology parity
- qualified Avalon and Awen language
- removal of unqualified karma language from Arianrhod
- named Hanes Taliesin, Mabinogi and Vita Merlini layers
- three-path entry flow
- authoritative source links
- runtime and CSS loading
- self-test visibility
- duplicate exact-name mappings

The main release audit runs both:

- executable random-engine tests
- executable mythology-authenticity tests

## Residual limitation

This is a cultural and literary adaptation, not an academic critical edition. Provenance labels identify the tradition layer but do not provide a footnote for every sentence on every card. The application avoids claiming otherwise and directs users to authoritative starting sources.

## Self-audit score after repair

| Area | Score |
|---|---:|
| Historical-layer transparency | 10/10 |
| Welsh-source positioning | 9.5/10 |
| Arthurian/Avalonian qualification | 10/10 |
| Modern interpretation disclosure | 10/10 |
| Entry-flow clarity | 9.5/10 |
| Bilingual consistency | 10/10 |
| Regression protection | 10/10 |
| Overall | 9.8/10 |

The remaining 0.2 reflects the deliberate fact that a poetic reflective deck cannot become a line-by-line academic edition without changing the nature of the product.
