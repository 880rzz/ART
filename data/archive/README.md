# data/archive

Two of the files here are live. The rest are history.

## Live — kept in step by an audit

| file | checked by |
|---|---|
| `home-copy.json` | `tests/audit-home-copy.mjs` |
| `oeuvre-periods.json` | `tools/audit_record_depth.py` |

These are references, not templates. Nothing writes them into the pages. If you
change a homepage or a period title, change the file in the same commit — the
audit fails if the two disagree.

## Historical extracts — read by nothing

`about.hu.html`, `artwork-registry.hu.json`, `books.hu.json`,
`career-chronology.hu.{html,json}`, `contact-footer.hu.json`,
`domain-ecosystem.hu.json`, `family-origins.hu.json`, `home-intro.hu.json`,
`home-meta.hu.json`, `hu-project-page-overrides.json`,
`oeuvre-relations.hu.json`, `press-relations.hu.json`,
`project-summaries.hu.json`, `secondary-pages.hu.json`,
`section-intros.hu.json`, `vocabulary-policy.json`.

These fed the generators that used to rewrite the site. The generators are
gone. The files are kept because they are a structured record of the archive
research, but **editing them changes nothing** — the HTML is the source of
truth. Do not treat them as a way to update the site, and do not trust them
where they disagree with a page: the pages have been corrected since.
