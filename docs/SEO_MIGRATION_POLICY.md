# BANHALMI ART SEO migration policy

This repository preserves legacy `banhalmi.art` URLs according to Google Search Central guidance.

## Rules

1. Use a permanent server-side `301` or `308` redirect whenever the hosting platform supports it.
2. On GitHub Pages, where response status redirects are not configurable per path, use an instant (`0` second) HTML meta refresh as Google's supported permanent-redirect fallback.
3. Every moved URL must point directly to the closest content-equivalent canonical URL. Do not create redirect chains.
4. Do not redirect unrelated or removed content to the homepage. URLs without a relevant replacement must return the site's real `404` response.
5. Redirect documents must not contain `noindex`; the redirect and canonical target are the consolidation signals.
6. Redirect targets must be indexable, self-canonical, present in the sitemap, and accessible to Googlebot.
7. Keep legacy redirects indefinitely while old links, bookmarks, citations, or search records may exist.

## Domain roles

- `www.banhalmi.art`: artistic oeuvre and source archive.
- `www.norbertbanhalmi.com`: canonical multilingual professional website.
- `www.banhalmi.at`: permanent redirect to the German-Austrian professional section.
- `www.banhalminorbert.hu`: permanent redirect to the Hungarian professional section.

The central external identity reference is Wikidata `Q56391118`.
