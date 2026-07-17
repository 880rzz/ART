# BANHALMI ART — reduced static archive build

Generated from the supplied static export using its sitemap.xml as the source of truth.

## Scope
- Sitemap URL groups retained: 34
- Sitemap URL groups removed as blog/post content: 107
- Localized HTML pages retained: 102
- Internal blog/post links removed from retained pages: 225
- Original file count: 9253
- Reduced file count: 529
- Original unpacked size: 292.8 MB
- Reduced unpacked size: 18.0 MB
- Reduction: 93.8%

## Removed
- /blog and localized blog indexes
- all blog tag and hashtag pages
- /post and all individual post pages
- Pagefind index containing blog content
- unreferenced original and optimized image files
- embedded .git history

## Retained
- multilingual home pages
- exhibitions and exhibition detail pages
- books, 20-year chronology, media appearances
- curatorial section and Norbert Banhalmi profile
- contact, search, legal and accessibility pages
- only assets directly referenced by retained pages

## Search
The former Pagefind index was replaced by a lightweight archive-only search index generated exclusively from retained pages.

## Validation notes
Missing sitemap pages: 0
Missing referenced assets after pruning: 0
