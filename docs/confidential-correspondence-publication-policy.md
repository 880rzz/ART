# Confidential correspondence and business data — publication boundary

**DEFAULT DENY.** Adapted from the Raw Materials Trade confidential-data-publication-policy and supplier-confidentiality-publication-boundary. This policy governs all changes to this public repository, including AI-assisted editorial work.

## Absolutely prohibited from email or other restricted business sources
- Any email message, thread, quotation, excerpt, subject, sender/recipient identity, contact, signature, attachment, export, screenshot or identifiable paraphrase.
- Customer/prospect identities, private portraits or unpublished customer references learned from correspondence.
- Private rates, quotes, discounts, margins, negotiations, commercial terms, project schedules, booking information, contracts, payment information and internal performance.
- Private links, credentials, access tokens, proprietary documents and confidential third-party information.
- Indirectly identifying combinations of dates, project descriptions, locations, quantities or other details.

**The prohibition applies even if an email is old, an identifier is anonymized, or the text is used in SEO, GEO, LLM, schema.org, AI Trust, alt text, image EXIF/IPTC/XMP, llms.txt, documentation, issue/PR descriptions, CI logs or commit messages.**

## Permitted editorial use
Correspondence may inform *abstract* writing style and general understanding of buyer questions only. Never paste the source, reproduce recognizable phrases from a client case, encode private data in a test fixture or publish email-derived commercial facts. Use independently verified, already public evidence for specific names, clients, events, affiliations, portfolio images and awards; confirm rights and consent where required.

## Publication gate
1. Classify all source material before work; unknown business information is restricted.
2. Keep email-derived evidence outside this repository, its history, artifacts and CI.
3. Review the proposed diff and generated site, JSON-LD, metadata, media, downloads, issue/PR descriptions and build logs for direct **and inferential** disclosures.
4. Run the automated correspondence-disclosure gate on every pull request; a green scan is not a privacy certification.
5. Obtain authorized editorial/legal review for identifiable references; do not bypass findings through broad allowlists.
6. Block merge and deployment while any confidentiality concern remains unresolved.

## Incident response
If restricted material is committed or deployed, stop release, remove public access, assess git history and caches, rotate any exposed credentials, document the incident privately and assess contractual/GDPR notification duties. Deleting a later file version does not erase git history.

## Relationship to public information
Existing published artworks, approved credits, publicly identified subjects, legal company contacts and verified portfolio references may remain when publication rights are established. They are **not** authorization to reveal private correspondence or new business details.
