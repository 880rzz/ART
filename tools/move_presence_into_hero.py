#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HOME = ('index.html', 'hu/index.html', 'de-at/index.html')
BLOCK_RE = re.compile(
    r'<section class="presence-context" data-presence-context="2026">.*?</section>',
    re.S,
)

changed = []
for relative in HOME:
    path = ROOT / relative
    if not path.exists():
        continue
    source = path.read_text(encoding='utf-8')
    match = BLOCK_RE.search(source)
    if not match:
        continue
    block = match.group(0)
    updated = source[:match.start()] + source[match.end():]

    # Place the existing thesis directly below the hero buttons, inside hero-inner.
    hero_cta = re.search(r'(<div class="hero-cta">.*?</div>)', updated, re.S)
    if not hero_cta:
        continue

    hero_block = block.replace(
        '<section class="presence-context"',
        '<section class="presence-context presence-context--hero"',
        1,
    )
    updated = updated[:hero_cta.end()] + hero_block + updated[hero_cta.end():]

    if updated != source:
        path.write_text(updated, encoding='utf-8')
        changed.append(relative)

print(f'Moved presence thesis into the hero on {len(changed)} homepage files.')
for relative in changed:
    print(relative)
