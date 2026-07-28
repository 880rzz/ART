#!/usr/bin/env python3
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    ROOT / "press.html": {
        "skip": "Skip to content",
        "canonical": "https://www.banhalmi.art/press.html",
        "lang": "en",
        "locale": "en_US",
        "image_alt": "BANHALMI ART press archive",
    },
    ROOT / "hu" / "press.html": {
        "skip": "Ugrás a tartalomhoz",
        "canonical": "https://www.banhalmi.art/hu/press.html",
        "lang": "hu-HU",
        "locale": "hu_HU",
        "image_alt": "BANHALMI ART sajtóarchívum",
    },
    ROOT / "de-at" / "press.html": {
        "skip": "Zum Inhalt springen",
        "canonical": "https://www.banhalmi.art/de-at/press.html",
        "lang": "de-AT",
        "locale": "de_AT",
        "image_alt": "BANHALMI ART Pressearchiv",
    },
}

STYLE = (
    '<style id="press-accessibility">'
    '.skip-link{position:fixed;left:1rem;top:1rem;z-index:10000;transform:translateY(-220%);'
    'padding:.75rem 1rem;background:#fff;color:#111;border:2px solid #B79C44;font-weight:700}'
    '.skip-link:focus{transform:translateY(0)}'
    'a:focus-visible,button:focus-visible{outline:3px solid #B79C44;outline-offset:3px}'
    '</style>'
)

IMAGE_URL = "https://www.banhalmi.art/assets/img/hero-signature-1920.webp"


def upsert_meta(text: str, attribute: str, key: str, value: str) -> str:
    escaped = html.escape(value, quote=True)
    pattern = re.compile(
        rf'<meta\b(?=[^>]*\b{attribute}=["\']{re.escape(key)}["\'])[^>]*>',
        re.I | re.S,
    )
    replacement = f'<meta {attribute}="{key}" content="{escaped}">'
    if pattern.search(text):
        return pattern.sub(replacement, text, count=1)
    return text.replace('</head>', replacement + '</head>', 1)


def extract_description(text: str) -> str:
    match = re.search(
        r'<meta\s+name=(["\'])description\1\s+content=(["\'])(.*?)\2\s*/?>',
        text,
        re.I | re.S,
    )
    return html.unescape(match.group(3).strip()) if match else ''


changed = []
for path, meta in PAGES.items():
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    original = text

    if 'hreflang="x-default"' not in text:
        marker = '<link rel="stylesheet"'
        insert = '<link rel="alternate" hreflang="x-default" href="https://www.banhalmi.art/press.html">'
        pos = text.find(marker)
        if pos >= 0:
            text = text[:pos] + insert + text[pos:]

    title_match = re.search(r'<title>(.*?)</title>', text, re.I | re.S)
    title = html.unescape(title_match.group(1).strip()) if title_match else ''
    description = extract_description(text)

    if title:
        text = upsert_meta(text, 'property', 'og:title', title)
        text = upsert_meta(text, 'name', 'twitter:title', title)
    if description:
        text = upsert_meta(text, 'name', 'description', description)
        text = upsert_meta(text, 'property', 'og:description', description)
        text = upsert_meta(text, 'name', 'twitter:description', description)

    text = upsert_meta(text, 'property', 'og:url', meta['canonical'])
    text = upsert_meta(text, 'property', 'og:type', 'website')
    text = upsert_meta(text, 'property', 'og:locale', meta['locale'])
    text = upsert_meta(text, 'property', 'og:image', IMAGE_URL)
    text = upsert_meta(text, 'property', 'og:image:type', 'image/webp')
    text = upsert_meta(text, 'property', 'og:image:width', '1920')
    text = upsert_meta(text, 'property', 'og:image:height', '894')
    text = upsert_meta(text, 'property', 'og:image:alt', meta['image_alt'])
    text = upsert_meta(text, 'name', 'twitter:card', 'summary_large_image')
    text = upsert_meta(text, 'name', 'twitter:image', IMAGE_URL)
    text = upsert_meta(text, 'name', 'twitter:image:alt', meta['image_alt'])

    text = text.replace('https://www.norbertbanhalmi.com/hu/portrait/', 'https://www.norbertbanhalmi.com/hu/portre/')

    if 'id="press-accessibility"' not in text:
        text = text.replace('</head>', STYLE + '</head>', 1)

    if '<main id="main-content"' not in text:
        text = re.sub(r'<main(?:\s[^>]*)?>', '<main id="main-content">', text, count=1, flags=re.I)

    if 'class="skip-link"' not in text:
        skip = f'<a class="skip-link" href="#main-content">{meta["skip"]}</a>'
        text = re.sub(r'<body(?:\s[^>]*)?>', lambda match: match.group(0) + skip, text, count=1, flags=re.I)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(path.relative_to(ROOT).as_posix())

print(f"Press accessibility pass updated {len(changed)} pages.")
for item in changed:
    print(item)
