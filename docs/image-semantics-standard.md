# BANHALMI ART image semantics standard

This document defines the accessibility, curatorial and machine-readable description system for images published on banhalmi.art.

## Core rule

Every meaningful image must have a human-written, language-specific `alt` value that describes what is visibly present. Decorative images must use `alt=""` and must also be explicitly classified with one of the following:

- `role="presentation"`
- `role="none"`
- `aria-hidden="true"`
- `data-decorative`

An empty `alt` value without decorative classification is not accepted.

## The three text layers

### 1. ALT text

Purpose: accessibility and immediate visual understanding.

The ALT text should:

- describe visible content, composition, action, atmosphere and important spatial relationships;
- use the language of the page;
- normally remain between 40 and 180 characters;
- avoid keyword lists;
- avoid repeating “image of”, “photo of” or the photographer’s name unless authorship is visually relevant;
- avoid interpreting a person’s emotions, identity, health, ethnicity or other sensitive traits unless the information is explicitly established by the surrounding archival record.

### 2. Caption

Purpose: curatorial and historical context.

A caption may include:

- title of the work;
- series or exhibition;
- date and location;
- identified person, when the identity is established and publication is appropriate;
- technique or production context;
- archive or licensing reference.

The caption must not be used as a substitute for ALT text.

### 3. Long description / structured record

Purpose: art-historical depth, research use and machine readability.

Important works should also receive a detailed description through a visible record, `ImageObject`/`Photograph` schema or the central image registry. It may include:

- visual analysis;
- documentary context;
- date created;
- content location;
- creator and copyright holder;
- licence and acquire-license page;
- related exhibition, book, project or case study;
- verified external identifiers.

## Language policy

English, Hungarian and Austrian German descriptions are editorial versions, not blind machine translations.

- English pages: natural international English.
- Hungarian pages: natural Hungarian terminology.
- German pages: natural Austrian German where appropriate.

The visible scene must remain consistent across languages, while syntax and cultural context may be adapted.

## Repeated images

The same asset may appear on several pages. Its ALT text may change when the surrounding purpose changes, but it must never contradict the visible content. Reusing an identical ALT is acceptable only where the image has exactly the same communicative function. The audit flags repetitions for human review rather than assuming every repetition is automatically wrong.

## Logos and book covers

- A linked logo needs an ALT that names the destination or organisation when the surrounding link has no accessible name.
- A purely redundant logo may use a classified empty ALT.
- Book-cover ALT should describe the cover’s visible design, not merely say “book cover”. The bibliographic title belongs in the caption and structured metadata.

## Portraits and documentary photographs

ALT text should describe pose, framing, clothing, environment, light and action. Names belong in ALT only when identification is verified and useful to understanding the image.

Do not infer personality, political position, emotional state or private circumstances from appearance.

## Artworks

Describe observable form before interpretation:

1. medium or visual style when apparent;
2. dominant subject and arrangement;
3. light, colour or contrast;
4. movement, gesture and space;
5. symbolic or curatorial interpretation only when supported by the artwork record.

## Quality examples

Weak:

```html
<img src="/assets/img/work.webp" alt="Artwork">
```

Better:

```html
<img src="/assets/img/work.webp" alt="Black-and-white figure standing behind translucent fabric, with one hand pressing against the illuminated surface.">
```

Decorative:

```html
<img src="/assets/img/divider.svg" alt="" role="presentation">
```

## Automated audit

Run:

```bash
node tools/audit-image-semantics.mjs
```

This writes `docs/image-alt-audit.json` and reports:

- missing ALT attributes;
- unclassified empty ALT values;
- generic ALT values;
- filename-like ALT values;
- descriptions that are probably too short or too long;
- duplicate ALT values within the same language.

Strict CI mode:

```bash
node tools/audit-image-semantics.mjs --strict
```

Strict mode must only be enabled in the main test pipeline after the existing image catalogue has been reviewed and corrected.

## Editorial workflow

1. Open and visually inspect the actual image.
2. Identify its role on the specific page.
3. Write the source-language ALT description.
4. Create editorial Hungarian, English and German versions.
5. Add or verify caption and structured metadata.
6. Run the image semantics audit.
7. Review duplicates and all decorative classifications manually.

No ALT text may be generated from the filename alone.
