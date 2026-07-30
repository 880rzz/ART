#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

CURATOR_FILES = [
    ROOT / 'hu/curators.html',
    ROOT / 'curators.html',
    ROOT / 'de-at/curators.html',
]

PRESS_BLOCKS = {
    ROOT / 'hu/press.html': '''<section class="press-types" aria-labelledby="press-guide-title"><div class="wrap narrow">
  <p class="label">Sajtóarchívum használata</p>
  <h2 id="press-guide-title">Interjúk, kritikák és forrásrekordok</h2>
  <p class="lead">A rekordok nem egyetlen listát alkotnak. A kategóriák segítenek különválasztani a művészeti értelmezést, az életrajzi interjúkat, a projektbeszámolókat és az elsődleges forrásokat.</p>
  <div class="press-type-grid">
    <div><strong>Interjúk és portrék</strong><span>Beszélgetések az alkotói pályáról és a munkamódszerről.</span></div>
    <div><strong>Projekt- és kiállítási sajtó</strong><span>Könyvekhez, kiállításokhoz és műtárgyrekordokhoz kapcsolódó közlések.</span></div>
    <div><strong>Kritikák és értelmezések</strong><span>Független szövegek, amelyek kontextust adnak az életműhöz.</span></div>
    <div><strong>Elsődleges források</strong><span>Hivatalos dokumentációk, videók és közvetlen archívumi hivatkozások.</span></div>
  </div>
</div></section>''',
    ROOT / 'press.html': '''<section class="press-types" aria-labelledby="press-guide-title"><div class="wrap narrow">
  <p class="label">Using the press archive</p>
  <h2 id="press-guide-title">Interviews, criticism and source records</h2>
  <p class="lead">The records are not one undifferentiated list. These categories separate artistic interpretation, biographical interviews, project coverage and primary source material.</p>
  <div class="press-type-grid">
    <div><strong>Interviews and profiles</strong><span>Conversations about the artistic practice and working method.</span></div>
    <div><strong>Project and exhibition coverage</strong><span>Articles connected to books, exhibitions and artwork records.</span></div>
    <div><strong>Criticism and interpretation</strong><span>Independent texts that place the oeuvre in context.</span></div>
    <div><strong>Primary sources</strong><span>Official documentation, moving-image records and direct archive references.</span></div>
  </div>
</div></section>''',
    ROOT / 'de-at/press.html': '''<section class="press-types" aria-labelledby="press-guide-title"><div class="wrap narrow">
  <p class="label">Nutzung des Pressearchivs</p>
  <h2 id="press-guide-title">Interviews, Kritik und Quellenbestände</h2>
  <p class="lead">Die Einträge bilden keine unstrukturierte Liste. Die Kategorien trennen künstlerische Einordnung, biografische Interviews, Projektberichterstattung und Primärquellen.</p>
  <div class="press-type-grid">
    <div><strong>Interviews und Porträts</strong><span>Gespräche über die künstlerische Arbeit und die Arbeitsweise.</span></div>
    <div><strong>Projekt- und Ausstellungsberichte</strong><span>Beiträge zu Büchern, Ausstellungen und Werkdatensätzen.</span></div>
    <div><strong>Kritik und Einordnung</strong><span>Unabhängige Texte, die das Werk kontextualisieren.</span></div>
    <div><strong>Primärquellen</strong><span>Offizielle Dokumentation, Bewegtbild und direkte Archivverweise.</span></div>
  </div>
</div></section>''',
}


def write_if_changed(path: Path, text: str) -> bool:
    original = path.read_text(encoding='utf-8')
    if text == original:
        return False
    path.write_text(text, encoding='utf-8')
    return True


def normalize_curator(path: Path) -> bool:
    html = path.read_text(encoding='utf-8')
    updated = re.sub(
        r'<h2>[^<]*(?:szívesen építenék veled|work with you|mit Ihnen arbeiten)[^<]*</h2>\s*<ul class="linklist">[\s\S]*?</ul>',
        '', html, flags=re.I,
    )
    updated = re.sub(
        r'\s*<a class="btn"[^>]*>[^<]*(?:Kurátori összefoglaló|Kiállítási vagy kölcsönzési megkeresés|Kiállítások időrendben|chronological|loan enquiry|Leihgabe)[^<]*</a>',
        '', updated, flags=re.I,
    )
    return write_if_changed(path, updated)


def normalize_press(path: Path, block: str) -> bool:
    html = path.read_text(encoding='utf-8')
    if 'class="press-types"' in html and 'press-type-grid' in html:
        return False
    main_match = re.search(r'<main\b[^>]*>', html, flags=re.I)
    if not main_match:
        raise RuntimeError(f'Missing <main> in {path.relative_to(ROOT)}')
    updated = html[:main_match.end()] + '\n' + block + '\n' + html[main_match.end():]
    return write_if_changed(path, updated)


def normalize_hu_home() -> bool:
    path = ROOT / 'hu/index.html'
    html = path.read_text(encoding='utf-8')
    paragraph = r'<p\b[^>]*>(?:(?!</p>)[\s\S])*?(?:négy működő domain|banhalmi\.at domain|két fő domainre épül)(?:(?!</p>)[\s\S])*?</p>'
    updated = re.sub(paragraph, '', html, flags=re.I)
    return write_if_changed(path, updated)


changed = []
for file in CURATOR_FILES:
    if normalize_curator(file):
        changed.append(str(file.relative_to(ROOT)))
for file, block in PRESS_BLOCKS.items():
    if normalize_press(file, block):
        changed.append(str(file.relative_to(ROOT)))
if normalize_hu_home():
    changed.append('hu/index.html')

print(f'Curatorial content pass updated {len(changed)} files.')
for item in changed:
    print(item)
