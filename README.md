# banhalmi.art — static site

Hand-built, framework-free, trilingual site for the artistic oeuvre of Norbert Bánhalmi.

## Structure

```
/                     English (x-default)
/de-at/               Austrian German
/hu/                  Hungarian
   index.html         home
   press.html         selected press 2014–2026
   curators.html      curatorial dossier
   404.html
   exhibitions/       20 exhibition pages + euforia.html
   books/             3 book pages
/assets/img/          shared images (hero, best-of, studies, portrait, logo, favicon)
sitemap.xml robots.txt llms.txt ai.txt humans.txt .htaccess
images_manifest.json  download_images.py
```

81 HTML pages (27 per language).

## Before going live — one step

The repository bundles the 449 self-hosted archive images currently available
from the source manifest: 131 Best Of works, 315 images across 11 exhibition
series, and 3 book covers. To rebuild those files from the recorded sources:

```
pip install pillow
python3 download_images.py
```

This downloads all 449 images into `assets/img/` and compresses them to a
maximum of 1600px WebP. The site never falls back to remote gallery images.
Eight earlier exhibition records currently have no source-image set in the
archive manifest, so those pages intentionally remain documentary records
without a gallery until verified images are supplied.

## Deploy

Upload the contents of this folder to the web root of banhalmi.art.
Absolute paths (`/assets/…`) assume the site sits at the domain root.
`.htaccess` sets security headers and the 404 page (Apache). On Netlify,
Vercel or Cloudflare Pages just drop the folder in; set 404.html as the
not-found page.

## SEO / GEO / Schema / GDPR

- Unique title + meta description on all 81 pages; canonical on each.
- Full hreflang set (en / de-AT / hu / x-default) on every page and in the sitemap.
- JSON-LD: Person (with awards, memberships, sameAs), WebSite, ImageGallery,
  ExhibitionEvent per exhibition, Book per book (with ISBN), BreadcrumbList,
  AboutPage, CollectionPage. Photographs carry creator, date, location and licence.
- GEO: geo.region / geo.placename / ICBM / geo.position (Vienna) + llms.txt and
  ai.txt for AI crawlers.
- GDPR: no cookies, no analytics, no trackers, no external fonts or scripts.
  Typography uses the system font stack. Only outbound links leave the site.

## Typography

System font stack (SF Pro on Apple devices) following Apple's principles:
semibold display headlines with tight optical tracking (-0.015em), 17px body
at 1.47 line-height, and the title/description pairing — large headline
followed by a lighter, larger intro paragraph.

© 1999–2026 Norbert Bánhalmi / BANHALMI
