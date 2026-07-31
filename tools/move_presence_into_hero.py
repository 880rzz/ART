#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HOME = {'index.html', 'hu/index.html', 'de-at/index.html'}
BLOCK_RE = re.compile(
    r'<section class="presence-context(?: presence-context--(?:hero|intro))?" data-presence-context="2026">.*?</section>',
    re.S,
)

changed = []
removed_from_subpages = []
moved_below_heroes = []

for path in ROOT.rglob('*.html'):
    relative = path.relative_to(ROOT).as_posix()
    if any(part in {'.git', 'node_modules', 'dist'} for part in path.relative_to(ROOT).parts):
        continue

    source = path.read_text(encoding='utf-8')
    matches = list(BLOCK_RE.finditer(source))
    if not matches:
        continue

    # The visible thesis belongs only to the three homepages.
    if relative not in HOME:
        updated = BLOCK_RE.sub('', source)
        if updated != source:
            path.write_text(updated, encoding='utf-8')
            changed.append(relative)
            removed_from_subpages.append(relative)
        continue

    # Keep a single homepage thesis block as a distinct section immediately after the hero.
    block = matches[0].group(0)
    block = re.sub(
        r'<section class="presence-context(?: presence-context--(?:hero|intro))?"',
        '<section class="presence-context presence-context--intro"',
        block,
        count=1,
    )
    updated = BLOCK_RE.sub('', source)
    hero = re.search(r'<header class="hero".*?</header>', updated, re.S)
    if not hero:
        continue
    updated = updated[:hero.end()] + '\n\n' + block + updated[hero.end():]

    if updated != source:
        path.write_text(updated, encoding='utf-8')
        changed.append(relative)
        moved_below_heroes.append(relative)

print(f'Normalized presence thesis placement in {len(changed)} HTML files.')
print(f'Removed from {len(removed_from_subpages)} subpages; placed below the hero on {len(moved_below_heroes)} homepages.')
for relative in changed:
    print(relative)
