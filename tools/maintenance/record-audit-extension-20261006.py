# Cross-layer checks: existence of a valid period was not enough. A fallback
# period could disagree with the page and the machine registry while passing.
from html import unescape
from urllib.parse import urlsplit, unquote

registry = json.loads((ROOT / 'archive-record-registry.json').read_text(encoding='utf-8'))
period_by_numeral = {p['numeral']: p for p in PERIODS['periods']}
translation_periods = {}
registry_urls = set()

def visible_text(value):
    return unescape(re.sub(r'<[^>]+>', '', value)).strip()

for record in registry['records']:
    url = record['canonicalUrl']
    if url in registry_urls:
        errors.append(f'Duplicate archive registry URL: {url}')
    registry_urls.add(url)
    rel = unquote(urlsplit(url).path.lstrip('/'))
    page_path = ROOT / rel
    if not page_path.is_file():
        errors.append(f'Missing registry page: {rel}')
        continue
    source = page_path.read_text(encoding='utf-8')
    language = 'hu' if rel.startswith('hu/') else 'de' if rel.startswith('de-at/') else 'en'
    prefix = 'hu/' if language == 'hu' else 'de-at/' if language == 'de' else ''
    group = rel[len(prefix):]
    depth_match = re.search(r'<!-- RECORD-DEPTH:START -->(.*?)<!-- RECORD-DEPTH:END -->', source, re.S)
    relation_match = re.search(r'<!-- RECORD-RELATIONSHIPS:START -->(.*?)<!-- RECORD-RELATIONSHIPS:END -->', source, re.S)
    if not depth_match or not relation_match:
        errors.append(f'{rel}: cross-layer record block missing')
        continue
    depth = depth_match.group(1)
    numeral_match = re.search(r'record-period__no">([^<]*)<', depth)
    if not numeral_match:
        continue  # Already reported by the original record-depth checks.
    numeral = numeral_match.group(1).strip()
    period = period_by_numeral.get(numeral)
    if not period:
        continue
    translation_periods.setdefault(group, {})[language] = numeral
    if record.get('presenceResearchPeriod') != numeral:
        errors.append(f'{rel}: registry period {record.get("presenceResearchPeriod")} differs from visible period {numeral}')
    relation_label = re.search(r'<div class="record-context-head">\s*<p class="label">([^<]*)</p>', relation_match.group(1))
    if not relation_label or visible_text(relation_label.group(1)).split()[-1] != numeral:
        errors.append(f'{rel}: related-record heading disagrees with the canonical period {numeral}')
    for class_name, expected in (
        ('record-period__title', period['title'][language]),
        ('record-period__range', period['range'][language] if isinstance(period['range'], dict) else period['range']),
    ):
        element = re.search(re.escape(class_name) + r'">([^<]*)<', depth)
        if not element or visible_text(element.group(1)) != expected:
            errors.append(f'{rel}: {class_name} differs from the shared period contract')
    target = re.search(r'record-period__cta"><a[^>]*href="([^"]+)"', depth)
    if not target or target.group(1) != CURATOR_ROOT[language] + '#' + period['id']:
        errors.append(f'{rel}: period numeral and deep link disagree')
    summary = re.search(r'<div class="record-depth-head">.*?<p>(.*?)</p>', depth, re.S)
    if summary and re.search(r'(\u2026|\.{3}|\bwhat\.|\band\.|\bthe\.)$', visible_text(summary.group(1)), re.I):
        errors.append(f'{rel}: mechanically truncated record summary')
    # Use an explicit archival header year only. The undated EUFORIA project
    # cannot acquire an exhibition year from this check.
    main_header = re.search(r'<main\b[^>]*>.*?<header\b[^>]*>(.*?)</header>', source, re.S)
    label = re.search(r'<p class="label">([^<]*)</p>', main_header.group(1)) if main_header else None
    year_match = re.search(r'\b(19\d{2}|20\d{2})\b', visible_text(label.group(1))) if label else None
    if year_match:
        year = int(year_match.group(1))
        if year < period['from'] or (period['to'] is not None and year > period['to']):
            errors.append(f'{rel}: archival header year {year} is outside period {numeral}')
    for related in record.get('relatedRecords', []):
        if not related.startswith('/'):
            continue
        parts = urlsplit(related)
        destination = ROOT / (unquote(parts.path.lstrip('/')) + ('index.html' if parts.path.endswith('/') else ''))
        if not destination.is_file():
            errors.append(f'{rel}: related-record path is missing: {related}')
        elif parts.fragment:
            target_source = destination.read_text(encoding='utf-8')
            if not re.search(r'\bid=["\']' + re.escape(unquote(parts.fragment)) + r'["\']', target_source):
                errors.append(f'{rel}: related-record fragment is missing: {related}')

for group, languages in translation_periods.items():
    if set(languages) != {'hu', 'en', 'de'} or len(set(languages.values())) != 1:
        errors.append(f'{group}: translation period mismatch or missing language: {languages}')
if len(registry_urls) != checked:
    errors.append(f'Registry/page coverage mismatch: {len(registry_urls)} registry records, {checked} pages')
print(f'Cross-layer record checks: {len(registry_urls)} records, {len(translation_periods)} translation groups; '
      'period/year/registry agreement, complete summaries and internal machine-link fragments checked.')
