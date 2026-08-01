#!/usr/bin/env python3
"""Render the curatorial record block on every book and exhibition page.

This block used to carry four explanatory paragraphs — origin and scope,
research question, archival status, how to read the record. Hashing the
rendered output showed the problem plainly: across the twenty exhibition pages
there was exactly one variant per language, word for word. Sixty-nine pages
were repeating the same four paragraphs, and only the opening sentence said
anything about the work in question.

The block now carries what is actually specific to the page and one route
onward: the factual line (venue, year, number of digitised works), the period
of the oeuvre the chapter belongs to, and a link to that period on the
curators page. The period is derived from the page's year against the ranges
in data/archive/oeuvre-periods.json, which is also what gives the curators
page its anchors — so the two cannot drift apart.
"""
from pathlib import Path
import html
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PERIODS = json.loads((ROOT / 'data/archive/oeuvre-periods.json').read_text(encoding='utf-8'))

LANG = {
    'en': {'label': 'Curatorial record', 'heading': 'How this chapter belongs to the oeuvre'},
    'hu': {'label': 'Kurátori rekord', 'heading': 'Hogyan illeszkedik ez a fejezet az életműbe'},
    'de': {'label': 'Kuratorischer Datensatz', 'heading': 'Wie dieses Kapitel zum Gesamtwerk gehört'},
}

LANG_ROOT = {'en': '/', 'hu': '/hu/', 'de': '/de-at/'}


def lang_for(path):
    rel = path.relative_to(ROOT).as_posix()
    return 'hu' if rel.startswith('hu/') else ('de' if rel.startswith('de-at/') else 'en')


def clean(value):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', value or '')).strip()


def localised(value, lang):
    """Fields in the period file are either a plain string or per-language."""
    return value[lang] if isinstance(value, dict) else value


def page_year(text):
    """Take the year from the page's own sub-header, which reads
    'Exhibition · 2018 …' or 'Book · 2017 …'. Scanning the whole document
    instead would pick up ISBNs and copyright lines."""
    header = re.search(r'<header[^>]*class="sub"[^>]*>(.*?)</header>', text, re.S | re.I)
    scope = clean(header.group(1)) if header else ''
    if not scope:
        title = re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S | re.I)
        scope = clean(title.group(1)) if title else ''
    years = re.findall(r'\b(?:19|20)\d{2}\b', scope)
    return int(years[0]) if years else None


def period_for(year):
    if year is None:
        return None
    for period in PERIODS['periods']:
        if year < period['from']:
            continue
        if period['to'] is None or year <= period['to']:
            return period
    return None


def summary_line(text):
    """The one genuinely page-specific sentence: venue, year, holdings."""
    description = re.search(r'<meta name="description" content="([^"]*)"', text, re.I)
    if description:
        return html.unescape(description.group(1)).strip()
    title = re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S | re.I)
    return clean(title.group(1)) if title else ''


def remove_old(text):
    return re.sub(r'\s*<!-- RECORD-DEPTH:START -->.*?<!-- RECORD-DEPTH:END -->\s*', '\n', text, flags=re.S)


def render(path, text):
    lang = lang_for(path)
    strings = LANG[lang]
    period = period_for(page_year(text))
    summary = summary_line(text)

    if period is None:
        # No period can be derived, so say nothing rather than invent one.
        period_block = ''
    else:
        period_range = localised(period['range'], lang)
        period_title = period['title'][lang]
        eyebrow = PERIODS['labels']['periodEyebrow'][lang]
        cta = PERIODS['labels']['readPeriod'][lang]
        href = f"{LANG_ROOT[lang]}curators.html#{period['id']}"
        period_block = (
            '<div class="record-period">'
            f'<p class="label">{html.escape(eyebrow)}</p>'
            '<p class="record-period__name">'
            f'<span class="record-period__no">{html.escape(period["numeral"])}</span>'
            f'<span class="record-period__range">{html.escape(period_range)}</span>'
            f'<span class="record-period__title">{html.escape(period_title)}</span>'
            '</p>'
            f'<p class="record-period__cta"><a class="btn" href="{href}">{html.escape(cta)}</a></p>'
            '</div>'
        )

    return (
        '\n<!-- RECORD-DEPTH:START -->\n'
        '<section class="record-depth" aria-labelledby="record-depth-title"><div class="wrap">\n'
        f'  <div class="record-depth-head"><p class="label">{strings["label"]}</p>'
        f'<h2 id="record-depth-title">{strings["heading"]}</h2>'
        f'<p>{html.escape(summary)}</p></div>\n'
        f'  {period_block}\n'
        '</div></section>\n'
        '<!-- RECORD-DEPTH:END -->\n'
    )


def main():
    changed = []
    skipped = []
    for folder in ('books', 'exhibitions'):
        for base in (ROOT / folder, ROOT / 'hu' / folder, ROOT / 'de-at' / folder):
            if not base.exists():
                continue
            for path in sorted(base.glob('*.html')):
                original = path.read_text(encoding='utf-8')
                text = remove_old(original)
                pos = text.find('<!-- RECORD-RELATIONSHIPS:START -->')
                if pos < 0:
                    pos = text.find('<footer')
                if pos < 0:
                    continue
                if period_for(page_year(text)) is None:
                    skipped.append(path.relative_to(ROOT).as_posix())
                text = text[:pos] + render(path, text) + text[pos:]
                if text != original:
                    path.write_text(text, encoding='utf-8')
                    changed.append(path.relative_to(ROOT).as_posix())
    print(f'Record depth pass updated {len(changed)} pages.')
    if skipped:
        print(f'No period could be derived for {len(skipped)} page(s); they carry the record without one:')
        for item in skipped:
            print(' -', item)
    return 0


if __name__ == '__main__':
    sys.exit(main())
