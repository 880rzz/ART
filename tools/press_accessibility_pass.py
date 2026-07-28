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
    },
    ROOT / "hu" / "press.html": {
        "skip": "Ugrás a tartalomhoz",
        "canonical": "https://www.banhalmi.art/hu/press.html",
        "lang": "hu-HU",
    },
    ROOT / "de-at" / "press.html": {
        "skip": "Zum Inhalt springen",
        "canonical": "https://www.banhalmi.art/de-at/press.html",
        "lang": "de-AT",
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

OG_IMAGE = (
    '<meta property="og:image" content="https://www.banhalmi.art/assets/img/hero-signature-1920.webp">'
    '<meta property="og:image:type" content="image/webp">'
    '<meta property="og:image:width" content="1920">'
    '<meta property="og:image:height" content="894">'
)

BROKEN_PORTRAIT_URL = 'https://www.norbertbanhalmi.com/hu/portrait/'
LIVE_PORTRAIT_URL = 'https://www.norbertbanhalmi.com/hu/portre/'

changed = []
for path, meta in PAGES.items():
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    original = text

    # Keep the professional-site bridge on the verified live Hungarian route.
    text = text.replace(BROKEN_PORTRAIT_URL, LIVE_PORTRAIT_URL)

    if 'hreflang="x-default"' not in text:
        marker = '<link rel="stylesheet"'
        insert = '<link rel="alternate" hreflang="x-default" href="https://www.banhalmi.art/press.html">'
        pos = text.find(marker)
        if pos >= 0:
            text = text[:pos] + insert + text[pos:]

    title_match = re.search(r'<title>(.*?)</title>', text, re.I | re.S)
    description_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>', text, re.I | re.S)
    title = html.unescape(title_match.group(1).strip()) if title_match else ''
    description = html.unescape(description_match.group(1).strip()) if description_match else ''

    if 'property="og:title"' not in text and title:
        text = text.replace('</head>', f'<meta property="og:title" content="{html.escape(title, quote=True)}"></head>', 1)
    if 'property="og:description"' not in text and description:
        text = text.replace('</head>', f'<meta property="og:description" content="{html.escape(description, quote=True)}"></head>', 1)
    if 'property="og:url"' not in text:
        text = text.replace('</head>', f'<meta property="og:url" content="{meta["canonical"]}"></head>', 1)
    if 'property="og:type"' not in text:
        text = text.replace('</head>', '<meta property="og:type" content="website"></head>', 1)

    if 'property="og:image:width"' not in text:
        text = text.replace('</head>', OG_IMAGE + '</head>', 1)

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
