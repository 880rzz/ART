import json
from pathlib import Path

REPLACEMENTS = {
    'index.html': [
        ('<a href="books/book-ebredes.html">Book page →</a>', '<a href="books/book-ebredes.html" aria-label="Book page — Awakening: The New Beginning! — Book">Book page →</a>'),
        ('<a href="books/book-szosszenetek.html">Book page →</a>', '<a href="books/book-szosszenetek.html" aria-label="Book page — Snippets">Book page →</a>'),
        ('<a href="books/book-anovilaga.html">Book page →</a>', '<a href="books/book-anovilaga.html" aria-label="Book page — The World of Woman">Book page →</a>'),
    ],
    'hu/index.html': [
        ('<a href="books/book-ebredes.html">Könyvoldal →</a>', '<a href="books/book-ebredes.html" aria-label="Könyvoldal — Ébredés — az Új kezdet!">Könyvoldal →</a>'),
        ('<a href="books/book-szosszenetek.html">Könyvoldal →</a>', '<a href="books/book-szosszenetek.html" aria-label="Könyvoldal — Szösszenetek">Könyvoldal →</a>'),
        ('<a href="books/book-anovilaga.html">Könyvoldal →</a>', '<a href="books/book-anovilaga.html" aria-label="Könyvoldal — A Nő világa">Könyvoldal →</a>'),
    ],
    'de-at/index.html': [
        ('<a href="books/book-ebredes.html">Buchseite →</a>', '<a href="books/book-ebredes.html" aria-label="Buchseite — Erwachen: Der neue Anfang! — Buch">Buchseite →</a>'),
        ('<a href="books/book-szosszenetek.html">Buchseite →</a>', '<a href="books/book-szosszenetek.html" aria-label="Buchseite — Schnipsel">Buchseite →</a>'),
        ('<a href="books/book-anovilaga.html">Buchseite →</a>', '<a href="books/book-anovilaga.html" aria-label="Buchseite — Die Welt der Frau">Buchseite →</a>'),
    ],
}

for filename, pairs in REPLACEMENTS.items():
    path = Path(filename)
    text = path.read_text(encoding='utf-8')
    for old, new in pairs:
        if old not in text and new not in text:
            raise SystemExit(f'{filename}: expected Book CTA missing: {old}')
        text = text.replace(old, new)
    path.write_text(text, encoding='utf-8')

release_path = Path('data/design-release.json')
release = json.loads(release_path.read_text(encoding='utf-8'))
release['release'] = '20260808-pagespeed-v64'
release['assetDigest'] = '937b198bea42a8bf'
release['note'] = ('Stage 64 PageSpeed release marker. Exhibition-menu normalization is deferred until the first actual menu-open interaction, '
                   'and all nine homepage Book CTAs carry destination-specific accessible names directly in source HTML, eliminating the remaining startup accessibility DOM migration.')
release_path.write_text(json.dumps(release, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Applied PageSpeed v64 source migration: 9 static Book accessible names and release metadata.')
