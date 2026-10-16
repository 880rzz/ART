# ART repository editing rules

## EUFÓRIA gallery records

Before adding, editing, translating or regenerating an EUFÓRIA gallery work, read and follow [EUFORIA-GALLERY-CONTRACT.md](EUFORIA-GALLERY-CONTRACT.md) together with [APPLE-DESIGN-CONTRACT.md](APPLE-DESIGN-CONTRACT.md).

- Keep every work's complete documentation in its own initially closed native disclosure, under its image.
- Preserve five ordered topics and EN/HU/DE parity. Unknown information must use the localized collection-in-progress status; do not fabricate history, evidence, dates, endorsements or image uses.
- Preserve existing source URLs, anchor IDs, authorship, licences and machine-record relationships.
- Edit the canonical EUFORIA CSS block; do not introduce recovery styles or competing authorities.
- Run `npm test`, including `tests/audit-euforia-record-contract.mjs`, and verify open/closed responsive states before release.
- A PR or successful CI is not proof of deployment. Verify the intended production SHA, page content and rendered result after publishing.
