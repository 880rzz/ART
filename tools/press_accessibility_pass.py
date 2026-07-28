#!/usr/bin/env python3
from pathlib import Path
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

OG = (
    '<meta property="og:image" content="https://www.banhalmi.art/assets/img/hero-signature-1920.webp">'
    '<meta property="og:image:type" content="image/webp">'
    '<meta property="og:image:width" content="1920">'
    '<meta property="og:image:height" content="894">'
)

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

    if 'property="og:image:width"' not in text:
        marker = '</head>'
        text = text.replace(marker, OG + marker, 1)

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
