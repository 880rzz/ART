# BANHALMI ART image review workflow

This workflow turns the repository image inventory into verified, multilingual archive records without inventing visual facts.

## 1. Build the inventory

```bash
npm run inventory:images
```

The command writes `docs/image-inventory.json`. Every image starts as `unclassified` and `humanReviewed: false`.

## 2. Classify each asset

Use one of these values:

- `artwork`
- `portrait`
- `documentary`
- `exhibition-view`
- `book-cover`
- `publication`
- `identity`
- `decorative`

Only genuinely decorative images may use an empty HTML `alt` attribute. Decorative status must be explicit in the inventory and in markup.

## 3. Inspect the actual image

Open the full-resolution asset. Do not infer appearance from filenames, page titles, captions or surrounding prose.

Record only visible facts in ALT text. Put identity, date, event, interpretation and historical context in captions, long descriptions or curatorial notes unless those facts are visually necessary.

## 4. Create or update the registry record

Add a record to `data/image-metadata.json` that validates against `data/image-metadata.schema.json`.

Required editorial order:

1. Hungarian source description
2. English editorial translation
3. German editorial translation
4. factual and rights review
5. human visual verification

Set:

```json
"review": {
  "humanReviewed": true,
  "status": "verified"
}
```

only after the actual image and all three language versions have been checked.

## 5. Align every output surface

The same verified record should supply or be checked against:

- HTML `alt`
- visible `figcaption`
- `og:image:alt`
- `twitter:image:alt`
- `ImageObject`, `Photograph` or `VisualArtwork` JSON-LD
- image sitemap metadata
- archive and LLM indexes where relevant

ALT text is not a keyword field and must not repeat copyright or creator credits unnecessarily.

## 6. Run audits

```bash
npm run audit:images
npm run audit:image-registry
npm run audit:image-coverage
```

Use strict ALT validation only after the current catalogue baseline has been classified and corrected:

```bash
npm run audit:images:strict
```

## Release rule

No image record may be marked `verified` from AI-generated text alone. AI may prepare a draft, but a person must compare every factual visual claim with the displayed source asset.
