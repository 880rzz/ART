#!/usr/bin/env python3
"""Audit the curatorial record block on book and exhibition pages.

The block used to be checked for "four curatorial fields". That check passed
happily while all sixty-nine pages carried the same four paragraphs word for
word — it was asserting the presence of boilerplate, not that the page said
anything. What matters now is that each record states the one thing specific
to it, names the period it belongs to, and links to a period anchor that
actually exists on the curators page of its own language.
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PERIODS = json.loads((ROOT / 'data/archive/oeuvre-periods.json').read_text(encoding='utf-8'))
PERIOD_IDS = {period['id'] for period in PERIODS['periods']}
NUMERALS = {period['numeral'] for period in PERIODS['periods']}

CURATORS = {'en': ROOT / 'curators.html', 'hu': ROOT / 'hu/curators.html', 'de': ROOT / 'de-at/curators.html'}
CURATOR_ROOT = {'en': '/curators.html', 'hu': '/hu/curators.html', 'de': '/de-at/curators.html'}

errors = []
checked = 0

# Every anchor a record can point at has to exist on the curators page.
available_anchors = {}
for lang, path in CURATORS.items():
    if not path.exists():
        errors.append(f'curators page missing for {lang}')
        continue
    text = path.read_text(encoding='utf-8')
    available_anchors[lang] = set(re.findall(r'<article class="curatorial-period" id="([^"]+)"', text))
    missing = PERIOD_IDS - available_anchors[lang]
    if missing:
        errors.append(f'{path.relative_to(ROOT)}: period anchors missing: {", ".join(sorted(missing))}')

summaries = {}

for folder in ('books', 'exhibitions'):
    for base in (ROOT / folder, ROOT / 'hu' / folder, ROOT / 'de-at' / folder):
        if not base.exists():
            continue
        for path in sorted(base.glob('*.html')):
            checked += 1
            text = path.read_text(encoding='utf-8')
            rel = path.relative_to(ROOT).as_posix()
            lang = 'hu' if rel.startswith('hu/') else ('de' if rel.startswith('de-at/') else 'en')

            if text.count('<!-- RECORD-DEPTH:START -->') != 1 or text.count('<!-- RECORD-DEPTH:END -->') != 1:
                errors.append(f'{rel}: missing or duplicated record-depth block')
                continue
            block = re.search(r'<!-- RECORD-DEPTH:START -->(.*?)<!-- RECORD-DEPTH:END -->', text, re.S)
            if not block:
                errors.append(f'{rel}: unreadable record-depth block')
                continue
            body = block.group(1)

            if '<!-- RECORD-RELATIONSHIPS:START -->' in text and \
                    text.find('<!-- RECORD-DEPTH:START -->') > text.find('<!-- RECORD-RELATIONSHIPS:START -->'):
                errors.append(f'{rel}: record depth must precede relationship navigation')

            forbidden = ('A saját szavaimmal', 'In my own words', 'In meinen eigenen Worten')
            if any(term in body for term in forbidden):
                errors.append(f'{rel}: self-promotional heading leaked into curatorial depth')

            # The factual line is the reason the block exists at all.
            summary = re.search(r'<div class="record-depth-head">.*?<p>(.*?)</p>', body, re.S)
            summary_text = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', summary.group(1))).strip() if summary else ''
            if len(summary_text) < 40:
                errors.append(f'{rel}: record has no substantive factual line')
            else:
                summaries.setdefault(summary_text, []).append(rel)

            # The period, and a link that lands somewhere real.
            numeral = re.search(r'record-period__no">([^<]*)<', body)
            href = re.search(r'record-period__cta"><a[^>]*href="([^"]+)"', body)
            if not numeral or not href:
                errors.append(f'{rel}: record does not name a period of the oeuvre')
                continue
            if numeral.group(1).strip() not in NUMERALS:
                errors.append(f'{rel}: unknown period numeral {numeral.group(1)!r}')
            target = href.group(1)
            anchor = target.split('#')[-1]
            if anchor not in PERIOD_IDS:
                errors.append(f'{rel}: period link points at unknown anchor #{anchor}')
            elif anchor not in available_anchors.get(lang, set()):
                errors.append(f'{rel}: period link #{anchor} does not exist on the {lang} curators page')
            if not target.startswith(CURATOR_ROOT[lang]):
                errors.append(f'{rel}: period link leaves its own language ({target})')

# The whole point of the rewrite: the block must not read the same on every page.
for text_value, pages in summaries.items():
    if len(pages) > 3:
        errors.append(
            f'{len(pages)} records share the same factual line — the block is boilerplate again: '
            f'{text_value[:70]}… (e.g. {", ".join(pages[:3])})'
        )

css = (ROOT / 'assets/css/museum-editorial.css').read_text(encoding='utf-8')
for token in ('.record-period', '.record-period__name', '.record-period__cta'):
    if token not in css:
        errors.append(f'museum-editorial.css: missing {token}')

if checked == 0:
    errors.append('No book or exhibition records checked')

if errors:
    print('RECORD DEPTH AUDIT FAILED')
    for error in errors:
        print('-', error)
    sys.exit(1)
print(f'RECORD DEPTH AUDIT PASSED: {checked} records checked, {len(summaries)} distinct factual lines, '
      f'every period link resolves to an anchor on its own curators page')
