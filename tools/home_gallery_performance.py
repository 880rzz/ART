#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HOME = ('index.html', 'hu/index.html', 'de-at/index.html')
IMG_RE = re.compile(r'<img\b[^>]*\bsrc=["\'][^"\']*/?assets/img/best-of/[^"\']+["\'][^>]*>', re.I)
ATTR_RE = re.compile(r'\s(?:loading|decoding|fetchpriority|sizes)=["\'][^"\']*["\']', re.I)
SIZES = '(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw'


def optimise_tag(tag: str, index: int) -> str:
    tag = ATTR_RE.sub('', tag)
    # Only the first image is high priority. The remaining complete curatorial
    # selection stays in the document but is fetched progressively.
    if index == 0:
        attrs = f' loading="eager" decoding="async" fetchpriority="high" sizes="{SIZES}"'
    else:
        attrs = f' loading="lazy" decoding="async" fetchpriority="low" sizes="{SIZES}"'
    return tag[:-1].rstrip() + attrs + '>'


def process(path: Path) -> tuple[bool, int]:
    source = path.read_text(encoding='utf-8')
    counter = 0

    def replace(match: re.Match) -> str:
        nonlocal counter
        updated = optimise_tag(match.group(0), counter)
        counter += 1
        return updated

    output = IMG_RE.sub(replace, source)
    if output != source:
        path.write_text(output, encoding='utf-8')
        return True, counter
    return False, counter

changed = []
for relative in HOME:
    path = ROOT / relative
    if not path.exists():
        continue
    did_change, count = process(path)
    if did_change:
        changed.append((relative, count))

print(f'Gallery performance pass updated {len(changed)} homepage files.')
for relative, count in changed:
    print(f'{relative}: {count} complete curatorial images optimised')
