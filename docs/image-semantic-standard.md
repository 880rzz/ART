# BANHALMI ART image semantics standard

## Purpose

Every meaningful image in the archive must be understandable to a person using a screen reader, to a curator or researcher, and to a machine reading the archive. ALT text is only one layer. The complete record separates visual description, context, rights and entity relationships.

## Required layers

### ALT text

Describe what is visually present. Keep it concise, specific and natural. Do not repeat `image`, `photo of`, the filename, the page title or the photographer's name unless authorship is itself visually relevant.

### Caption

Identify the work, subject, place, date or series when that information belongs beside the image.

### Long description

Explain spatial relationships, gesture, environment, visual tension and other details that cannot fit comfortably in ALT text.

### Curatorial note

Explain why the image matters within the oeuvre, project, exhibition, book or historical context. This is interpretation, not a substitute for the objective ALT text.

### AI summary

A compact, factual machine-readable summary. It may combine visible content and verified archive context, but must not introduce unsupported claims.

## Language rules

Every meaningful record has edited Hungarian, English and German versions. They should communicate equivalent facts, but do not need to be literal translations.

Language keys:

- `hu`
- `en`
- `de`

## Decorative images

An image may use empty ALT text only when it carries no information not already available in nearby text. Decorative status must be explicit in markup or metadata. Logos, artwork reproductions, portraits, book covers and exhibition views are not decorative by default.

## Human review

Machine-generated descriptions are drafts only. A record cannot have `review.status: "verified"` unless `review.humanReviewed` is `true`. Named people, dates, locations, artistic interpretation and rights must be checked against archive sources.

## Central registry

The source of truth is:

- `data/image-metadata.json`
- schema: `data/image-metadata.schema.json`

Each record may contain:

- stable archive ID and asset path
- multilingual title, ALT, caption and long description
- curatorial note and AI summary
- creator and rights metadata
- people, location and creation date
- exhibitions, series, books and related pages
- external authority links
- visual keywords, composition and mood
- technical information
- human-review status

## Example record lifecycle

1. Add the image asset and a metadata record with `needs-visual-review`.
2. Inspect the actual image at full resolution.
3. Write the Hungarian source description.
4. Edit the English and German versions.
5. Confirm people, place, date, rights and related records.
6. Align visible caption and JSON-LD.
7. Mark the record as human reviewed and verified.
8. Run the image audits.

## Commands

```bash
npm run audit:images
npm run audit:images:strict
npm run audit:image-registry
```

The first command reports HTML image-semantic problems. Strict mode fails on unresolved HTML problems. The registry audit verifies asset existence, required languages, canonical creator identity, rights metadata and review-state consistency.

## Writing guidance by image type

### Portrait

Describe framing, posture, gaze, expression, clothing, light and relevant environment. Do not infer character, health, ethnicity, politics or emotion beyond visible evidence and verified context.

### Fine-art photograph

Describe figures, objects, spatial arrangement, colour or monochrome treatment, light, movement and dominant visual relationships. Interpretation belongs in the curatorial note.

### Documentary photograph

Describe the visible event and environment, then identify verified place, date and people in the caption or long description.

### Book cover

Include the exact visible title, principal artwork or design motif, dominant colours and edition context. Do not duplicate adjacent bibliographic text unnecessarily.

### Exhibition view

Describe the room, arrangement of works, visitors if relevant, wall treatment, display method and viewing direction.

### Logo or emblem

Describe the recognisable mark and visible wording. Use empty ALT only when the same brand name is immediately present as text and the image adds no other information.

## Relationship to structured data

The registry is designed to generate or validate `ImageObject`, `Photograph` and `VisualArtwork` nodes. The same factual values must not conflict between HTML, captions, the registry, page JSON-LD, image sitemaps or external authority records.

## Rights and AI-training preferences

Copyright, licence and credit are factual rights metadata. `aiTrainingPreference` is an archive declaration and must not be presented as a technical guarantee that automated crawlers will comply. Where an image has an open licence, the licence terms remain authoritative.
