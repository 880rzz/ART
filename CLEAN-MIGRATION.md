# ART clean architecture migration

Generated from the uploaded repository ZIP on 2026-08-14. This package is intended for a new review branch in the existing repository before merge to `main`.

## Architecture result

- HTML routes preserved: **266**
- CSS authorities: **14 → 1** (`assets/css/site.css`)
- JS/MJS files: **99 → 4**
- Repository files: **1930 → 1883**
- Inline `<style>` blocks: **0**
- Inline `style=` attributes: **0**
- Runtime stylesheet injection: **0**
- Build-time Stage CSS composition: **removed**

## Preserved contracts

- Existing public route set
- Canonical URLs
- hreflang relationships
- JSON-LD script coverage
- `robots.txt`, `sitemap.xml`, `llms.txt`, `ai.txt`
- existing public data/knowledge files
- current runtime JavaScript required by the public site
- GitHub Pages deployment with exact-live SHA verification

## New machine entry points

- `/.well-known/agent.json`
- `/api/v1/identity.json`
- `/api/v1/actions.json`
- repository-specific read-only JSON endpoints under `/api/v1/`

These are discovery/read interfaces only. They do **not** expose unauthenticated transactional APIs.

## Deployment rule

Upload this package to a new branch first. Do not replace `main` until the branch is visually reviewed on desktop/mobile and all repository checks are green. Once merged, the workflow writes `deployment-sha.txt` and verifies the exact SHA on the canonical custom domain.
