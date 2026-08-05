from __future__ import annotations

from html import escape, unescape
from pathlib import Path
import json
import re

ROOT = Path('.')
TODAY = '2026-08-05'

PAGES = {
    'press.html': {
        'lang': 'en',
        'canonical': 'https://www.banhalmi.art/press.html',
        'title': 'Press, interviews and public record | BANHALMI ART',
        'h1': 'Press, interviews and public record',
        'description': 'A clear chronological archive of 35 verified interviews, reports, reviews and moving-image records about Norbert Bánhalmi, published between 2014 and 2026.',
        'kicker': 'BANHALMI ART · PRESS ARCHIVE',
        'lead': 'A chronological selection of independent articles, interviews, reports and television appearances about Norbert Bánhalmi’s work. Every entry opens the original or archived source.',
        'facts_label': 'Archive summary',
        'facts': [('35', 'verified records'), ('2014–2026', 'documented period'), ('21', 'written sources'), ('14', 'moving-image records')],
        'overview_eyebrow': 'Navigate the archive',
        'overview_title': 'Start with a period or browse the complete record',
        'overview_text': 'The first four chapters collect written and online coverage. The fifth contains television reports, interviews and exhibition films. Publisher, format and year are shown on every entry.',
        'nav_label': 'Press archive periods',
        'nav': [('i', '2014–2016', 'The moment'), ('ii', '2017–2018', 'Body and memory'), ('iii', '2019–2022', 'Institutions'), ('iv', '2023–2026', 'Community'), ('v', 'Moving image', 'Video archive')],
        'record_word': 'records',
        'video_note': 'YouTube · verified archive source',
        'list_name': 'Press and moving-image records',
    },
    'hu/press.html': {
        'lang': 'hu-HU',
        'canonical': 'https://www.banhalmi.art/hu/press.html',
        'title': 'Sajtó, interjúk és nyilvános megjelenések | BANHALMI ART',
        'h1': 'Sajtó, interjúk és nyilvános megjelenések',
        'description': 'Bánhalmi Norbert 35 ellenőrzött interjújának, riportjának, kritikájának és videómegjelenésének áttekinthető, időrendi archívuma 2014 és 2026 között.',
        'kicker': 'BANHALMI ART · SAJTÓARCHÍVUM',
        'lead': 'Bánhalmi Norbert munkájáról szóló független cikkek, interjúk, riportok és televíziós megjelenések időrendben. Minden tétel az eredeti vagy archivált forrást nyitja meg.',
        'facts_label': 'Az archívum összefoglalása',
        'facts': [('35', 'ellenőrzött rekord'), ('2014–2026', 'dokumentált időszak'), ('21', 'írott forrás'), ('14', 'mozgóképes rekord')],
        'overview_eyebrow': 'Navigáció az archívumban',
        'overview_title': 'Válasszon időszakot, vagy haladjon végig a teljes archívumon',
        'overview_text': 'Az első négy fejezet az írott és online sajtót rendezi pályaszakaszok szerint. Az ötödikben televíziós riportok, interjúk és kiállítási filmek találhatók. Minden tételnél rögtön látszik a kiadó, a műfaj és az év.',
        'nav_label': 'A sajtóarchívum időszakai',
        'nav': [('i', '2014–2016', 'A pillanat'), ('ii', '2017–2018', 'Test és emlékezet'), ('iii', '2019–2022', 'Intézmények'), ('iv', '2023–2026', 'Közösség'), ('v', 'Mozgókép', 'Videóarchívum')],
        'record_word': 'rekord',
        'video_note': 'YouTube · ellenőrzött archívumi forrás',
        'list_name': 'Sajtó- és mozgóképes rekordok',
    },
    'de-at/press.html': {
        'lang': 'de-AT',
        'canonical': 'https://www.banhalmi.art/de-at/press.html',
        'title': 'Presse, Interviews und öffentliche Resonanz | BANHALMI ART',
        'h1': 'Presse, Interviews und öffentliche Resonanz',
        'description': 'Ein übersichtliches chronologisches Archiv mit 35 geprüften Interviews, Berichten, Kritiken und Bewegtbildquellen über Norbert Bánhalmi aus den Jahren 2014 bis 2026.',
        'kicker': 'BANHALMI ART · PRESSEARCHIV',
        'lead': 'Unabhängige Artikel, Interviews, Berichte und Fernsehbeiträge über Norbert Bánhalmis Arbeit in chronologischer Reihenfolge. Jeder Eintrag führt zur Original- oder Archivquelle.',
        'facts_label': 'Zusammenfassung des Archivs',
        'facts': [('35', 'geprüfte Einträge'), ('2014–2026', 'dokumentierter Zeitraum'), ('21', 'schriftliche Quellen'), ('14', 'Bewegtbildquellen')],
        'overview_eyebrow': 'Navigation im Archiv',
        'overview_title': 'Einen Zeitraum wählen oder das gesamte Archiv durchgehen',
        'overview_text': 'Die ersten vier Kapitel ordnen Presse- und Onlinebeiträge nach Werkphasen. Das fünfte enthält Fernsehberichte, Interviews und Ausstellungsfilme. Medium, Format und Jahr sind bei jedem Eintrag sofort sichtbar.',
        'nav_label': 'Zeiträume des Pressearchivs',
        'nav': [('i', '2014–2016', 'Der Augenblick'), ('ii', '2017–2018', 'Körper und Erinnerung'), ('iii', '2019–2022', 'Institutionen'), ('iv', '2023–2026', 'Gemeinschaft'), ('v', 'Bewegtbild', 'Videoarchiv')],
        'record_word': 'Einträge',
        'video_note': 'YouTube · geprüfte Archivquelle',
        'list_name': 'Presse- und Bewegtbildquellen',
    },
}

STYLE = r'''<style id="press-editorial-redesign">
.press-redesign{--press-ink:#151515;--press-muted:#626262;--press-paper:#fff;--press-warm:#f2efe8;--press-line:rgba(21,21,21,.18);--press-gold:#B79C44;color:var(--press-ink);background:var(--press-paper)}
.press-redesign *{box-sizing:border-box}
.press-redesign .press-shell,.press-redesign .wrap{width:min(1180px,calc(100% - 56px));margin-inline:auto}
.press-redesign .press-hero{margin:0;padding:clamp(5rem,10vw,9rem) 0 clamp(3.5rem,7vw,6rem);background:#111;color:#fff}
.press-redesign .press-hero .press-shell{display:grid;gap:clamp(1.4rem,3vw,2.4rem)}
.press-redesign .press-kicker,.press-redesign .press-overview__eyebrow{margin:0;font-size:.76rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.press-redesign .press-kicker{color:var(--press-gold)}
.press-redesign .press-hero h1{max-width:13ch;margin:0;font-size:clamp(2.85rem,7vw,6.9rem);font-weight:500;line-height:.94;letter-spacing:-.055em;text-wrap:balance;color:#fff}
.press-redesign .press-hero__lead{max-width:780px;margin:0;font-size:clamp(1.08rem,2vw,1.42rem);line-height:1.55;color:rgba(255,255,255,.78)}
.press-redesign .press-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin-top:clamp(1rem,3vw,2.5rem);border-top:1px solid rgba(255,255,255,.22)}
.press-redesign .press-fact{padding:1.35rem 1.25rem 0 0}
.press-redesign .press-fact strong{display:block;margin-bottom:.32rem;font-size:clamp(1.45rem,3vw,2.35rem);font-weight:500;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.press-redesign .press-fact span{display:block;font-size:.82rem;line-height:1.4;color:rgba(255,255,255,.62)}
.press-redesign .press-overview{padding:clamp(3rem,6vw,5.5rem) 0;background:var(--press-warm)}
.press-redesign .press-overview__grid{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:clamp(2rem,7vw,7rem);align-items:start}
.press-redesign .press-overview__eyebrow{color:#77621e}
.press-redesign .press-overview h2{max-width:15ch;margin:.75rem 0 1rem;font-size:clamp(2rem,4vw,3.7rem);font-weight:500;line-height:1.02;letter-spacing:-.035em;text-wrap:balance}
.press-redesign .press-overview p{max-width:650px;margin:0;color:#4f4f4f;font-size:1.03rem;line-height:1.7}
.press-redesign .press-period-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--press-line)}
.press-redesign .press-period-nav a{display:grid;grid-template-columns:2.2rem minmax(0,1fr);gap:.85rem;align-items:start;padding:1.15rem .75rem 1.15rem 0;border-bottom:1px solid var(--press-line);color:var(--press-ink);text-decoration:none}
.press-redesign .press-period-nav a:nth-child(odd){margin-right:1.4rem}
.press-redesign .press-period-nav a:hover .press-period-nav__title,.press-redesign .press-period-nav a:focus-visible .press-period-nav__title{text-decoration:underline;text-underline-offset:.22em}
.press-redesign .press-period-nav__index{font-size:.72rem;line-height:1.6;color:#77621e;font-variant-numeric:tabular-nums}
.press-redesign .press-period-nav__copy{display:grid;gap:.15rem;min-width:0}
.press-redesign .press-period-nav__range{font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--press-muted)}
.press-redesign .press-period-nav__title{font-size:1rem;font-weight:650;line-height:1.35}
.press-redesign .press-records{display:block}
.press-redesign .press-period{margin:0;padding:clamp(4rem,8vw,7.5rem) 0;background:#fff;scroll-margin-top:1.5rem}
.press-redesign .press-period:nth-child(even){background:var(--press-warm)}
.press-redesign .press-period .era-head{display:grid;grid-template-columns:minmax(230px,.75fr) minmax(0,1.25fr);gap:clamp(2rem,7vw,7rem);align-items:start;margin:0 0 clamp(2rem,5vw,4rem);padding:0 0 clamp(1.7rem,3vw,2.5rem);border-bottom:1px solid var(--press-line)}
.press-redesign .press-period .era-head>div{min-width:0}
.press-redesign .press-period .era-no{margin:0 0 .65rem;color:#77621e;font-size:.76rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.press-redesign .press-period .press-period-count{margin:.9rem 0 0;color:var(--press-muted);font-size:.78rem;letter-spacing:.04em}
.press-redesign .press-period h2{max-width:16ch;margin:0;font-size:clamp(2rem,4vw,4rem);font-weight:500;line-height:1;letter-spacing:-.04em;text-wrap:balance}
.press-redesign .press-period .era-copy{max-width:660px;margin:.1rem 0 0;color:#4e4e4e;font-size:clamp(1rem,1.5vw,1.18rem);line-height:1.72}
.press-redesign .press-period .grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0 clamp(2rem,5vw,5rem)!important;margin:0!important}
.press-redesign .press-record{display:grid!important;grid-template-columns:2.65rem minmax(0,1fr)!important;column-gap:1rem!important;align-content:start!important;margin:0!important;padding:1.8rem 0 2rem!important;border:0!important;border-top:1px solid var(--press-line)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;min-width:0}
.press-redesign .press-record__index{grid-column:1;grid-row:1/5;padding-top:.15rem;color:#8a8a8a;font-size:.72rem;line-height:1.4;font-variant-numeric:tabular-nums}
.press-redesign .press-record__title,.press-redesign .press-record .desc,.press-redesign .press-record .note{grid-column:2;min-width:0}
.press-redesign .press-record__title{display:inline-flex;align-items:flex-start;gap:.5rem;width:fit-content;max-width:100%;color:var(--press-ink)!important;font-size:clamp(1.16rem,1.8vw,1.5rem)!important;font-weight:650!important;line-height:1.22!important;letter-spacing:-.018em;text-decoration:none!important}
.press-redesign .press-record__title::after{content:'↗';flex:0 0 auto;padding-top:.04em;color:#77621e;font-size:.78em;font-weight:500}
.press-redesign .press-record__title:hover,.press-redesign .press-record__title:focus-visible{text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:.22em!important}
.press-redesign .press-record .desc{max-width:58ch;margin:.75rem 0 0!important;color:#505050!important;font-size:.96rem!important;line-height:1.62!important}
.press-redesign .press-record .note{margin:.95rem 0 0!important;color:#777!important;font-size:.72rem!important;font-weight:650!important;line-height:1.45!important;letter-spacing:.055em!important;text-transform:uppercase!important}
.press-redesign .press-sources{margin:0;padding:clamp(4rem,8vw,7rem) 0;background:#111!important;color:#fff}
.press-redesign .press-sources .eyebrow{color:var(--press-gold)!important}
.press-redesign .press-sources h2{max-width:16ch;color:#fff;font-size:clamp(2rem,4vw,4rem);font-weight:500;line-height:1.02;letter-spacing:-.04em}
.press-redesign .press-sources .lead{max-width:720px;color:rgba(255,255,255,.7)!important;line-height:1.7}
.press-redesign .press-sources .source-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:1px!important;margin-top:2.5rem!important;background:rgba(255,255,255,.2)!important}
.press-redesign .press-sources .source-grid a{display:grid!important;gap:.55rem!important;min-height:145px!important;padding:1.4rem!important;border:0!important;border-radius:0!important;background:#171717!important;color:#fff!important;text-decoration:none!important}
.press-redesign .press-sources .source-grid a:hover,.press-redesign .press-sources .source-grid a:focus-visible{background:#202020!important}
.press-redesign .press-sources .source-grid strong{font-size:1.05rem;color:#fff!important}
.press-redesign .press-sources .source-grid small{color:rgba(255,255,255,.62)!important;font-size:.85rem;line-height:1.55}
.press-redesign .press-sources .actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2.5rem}
.press-redesign .press-sources .btn{border:1px solid rgba(255,255,255,.35)!important;background:transparent!important;color:#fff!important}
.press-redesign .press-sources .btn:hover,.press-redesign .press-sources .btn:focus-visible{border-color:var(--press-gold)!important;color:#fff!important}
@media (max-width:900px){.press-redesign .press-shell,.press-redesign .wrap{width:min(100% - 36px,1180px)}.press-redesign .press-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.press-redesign .press-overview__grid,.press-redesign .press-period .era-head{grid-template-columns:1fr;gap:2rem}.press-redesign .press-period .grid{grid-template-columns:1fr!important}.press-redesign .press-sources .source-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media (max-width:620px){.press-redesign .press-shell,.press-redesign .wrap{width:min(100% - 28px,1180px)}.press-redesign .press-hero{padding:4.25rem 0 3.5rem}.press-redesign .press-hero h1{font-size:clamp(2.65rem,14vw,4.5rem);max-width:none}.press-redesign .press-facts{grid-template-columns:1fr 1fr}.press-redesign .press-fact{padding-right:.75rem}.press-redesign .press-period-nav{grid-template-columns:1fr}.press-redesign .press-period-nav a:nth-child(odd){margin-right:0}.press-redesign .press-period{padding:3.8rem 0}.press-redesign .press-record{grid-template-columns:2.15rem minmax(0,1fr)!important;column-gap:.65rem!important;padding:1.45rem 0 1.7rem!important}.press-redesign .press-record__title{font-size:1.16rem!important}.press-redesign .press-sources .source-grid{grid-template-columns:1fr!important}}
@media (prefers-reduced-motion:reduce){.press-redesign *{scroll-behavior:auto!important}}
</style>'''


def text_only(fragment: str) -> str:
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', fragment))).strip()


def extract_articles(sections: list[str]) -> list[dict[str, str]]:
    articles: list[dict[str, str]] = []
    pattern = re.compile(r'<article class="item" id="press-(\d+)">(.*?)</article>', re.I | re.S)
    for section in sections:
        for match in pattern.finditer(section):
            inner = match.group(2)
            link = re.search(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', inner, re.I | re.S)
            if not link:
                raise RuntimeError(f'press-{match.group(1)} has no source link')
            articles.append({
                'number': match.group(1),
                'url': unescape(link.group(1)),
                'title': text_only(link.group(2)),
            })
    articles.sort(key=lambda item: int(item['number']))
    expected = [f'{value:02d}' for value in range(1, 36)]
    actual = [item['number'] for item in articles]
    if actual != expected:
        raise RuntimeError(f'Expected press-01..press-35, found {actual}')
    return articles


def enhance_section(section: str, section_id: str, cfg: dict[str, object]) -> str:
    count = len(re.findall(r'<article class="item"', section, re.I))
    section = re.sub(
        rf'<section class="era" id="{re.escape(section_id)}">',
        f'<section class="era press-period" id="{section_id}" aria-labelledby="{section_id}-title">',
        section,
        count=1,
        flags=re.I,
    )
    section = re.sub(r'<h2>(.*?)</h2>', rf'<h2 id="{section_id}-title">\1</h2>', section, count=1, flags=re.I | re.S)
    section = re.sub(
        r'(<p class="era-no">.*?</p>)',
        rf'\1<p class="press-period-count">{count} {escape(str(cfg["record_word"]))}</p>',
        section,
        count=1,
        flags=re.I | re.S,
    )

    article_pattern = re.compile(r'<article class="item" id="press-(\d+)">(.*?)</article>', re.I | re.S)

    def article_replacement(match: re.Match[str]) -> str:
        number = match.group(1)
        inner = match.group(2)
        inner = re.sub(r'<a\b', '<a class="press-record__title"', inner, count=1, flags=re.I)
        if 27 <= int(number) <= 34:
            inner = re.sub(
                r'<p class="note">.*?</p>',
                f'<p class="note">{escape(str(cfg["video_note"]))}</p>',
                inner,
                count=1,
                flags=re.I | re.S,
            )
        kind = ' data-format="video"' if int(number) >= 22 else ' data-format="press"'
        return (
            f'<article class="item press-record" id="press-{number}"{kind}>'
            f'<span class="press-record__index" aria-hidden="true">{number}</span>'
            f'{inner}</article>'
        )

    return article_pattern.sub(article_replacement, section)


def update_jsonld(html_text: str, cfg: dict[str, object], articles: list[dict[str, str]]) -> str:
    canonical = str(cfg['canonical'])
    list_items = [
        {'@type': 'ListItem', 'position': index, 'name': item['title'], 'url': item['url']}
        for index, item in enumerate(articles, start=1)
    ]

    pattern = re.compile(r'(<script\s+type="application/ld\+json">)(.*?)(</script>)', re.I | re.S)

    def replacement(match: re.Match[str]) -> str:
        try:
            data = json.loads(match.group(2))
        except json.JSONDecodeError:
            return match.group(0)

        if isinstance(data, dict) and data.get('@type') == 'CollectionPage':
            data['name'] = cfg['h1']
            data['description'] = cfg['description']
            data['dateModified'] = TODAY
            data['mainEntity'] = {'@id': canonical + '#press-list'}

        graph = data.get('@graph') if isinstance(data, dict) else None
        if isinstance(graph, list):
            for node in graph:
                if not isinstance(node, dict):
                    continue
                node_id = str(node.get('@id', ''))
                node_type = node.get('@type')
                types = node_type if isinstance(node_type, list) else [node_type]
                if node_id.endswith('#webpage'):
                    node['name'] = cfg['h1']
                    node['description'] = cfg['description']
                    node['dateModified'] = TODAY
                    node['mainEntity'] = {'@id': canonical + '#press-list'}
                if 'ItemList' in types or node_id.endswith('#press-list'):
                    node['@type'] = 'ItemList'
                    node['@id'] = canonical + '#press-list'
                    node['name'] = cfg['list_name']
                    node['numberOfItems'] = 35
                    node['itemListElement'] = list_items

        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)

    return pattern.sub(replacement, html_text)


def set_meta(html_text: str, attribute: str, key: str, value: str) -> str:
    escaped = escape(value, quote=True)
    pattern = re.compile(rf'<meta\s+{attribute}="{re.escape(key)}"\s+content="[^"]*">', re.I)
    replacement = f'<meta {attribute}="{key}" content="{escaped}">'
    updated, count = pattern.subn(replacement, html_text, count=1)
    if count != 1:
        raise RuntimeError(f'Meta {attribute}={key} not found')
    return updated


def build_main(cfg: dict[str, object], sections: list[str], sources: str) -> str:
    facts = ''.join(
        f'<div class="press-fact"><strong>{escape(value)}</strong><span>{escape(label)}</span></div>'
        for value, label in cfg['facts']  # type: ignore[index]
    )
    nav = ''.join(
        '<a href="#{anchor}"><span class="press-period-nav__index">{index:02d}</span>'
        '<span class="press-period-nav__copy"><span class="press-period-nav__range">{range}</span>'
        '<span class="press-period-nav__title">{title}</span></span></a>'.format(
            anchor=escape(anchor, quote=True), index=index, range=escape(period), title=escape(title)
        )
        for index, (anchor, period, title) in enumerate(cfg['nav'], start=1)  # type: ignore[index]
    )
    enhanced = ''.join(enhance_section(section, section_id, cfg) for section_id, section in sections)
    sources = sources.replace('<section class="sources">', '<section class="sources press-sources" aria-labelledby="press-sources-title">', 1)
    sources = re.sub(r'<h2>(.*?)</h2>', r'<h2 id="press-sources-title">\1</h2>', sources, count=1, flags=re.I | re.S)

    return f'''<main id="main-content" class="press-redesign">
<header class="press-hero">
  <div class="press-shell">
    <p class="press-kicker">{escape(str(cfg['kicker']))}</p>
    <h1>{escape(str(cfg['h1']))}</h1>
    <p class="press-hero__lead">{escape(str(cfg['lead']))}</p>
    <div class="press-facts" role="list" aria-label="{escape(str(cfg['facts_label']), quote=True)}">{facts}</div>
  </div>
</header>
<section class="press-overview" aria-labelledby="press-overview-title">
  <div class="press-shell press-overview__grid">
    <div>
      <p class="press-overview__eyebrow">{escape(str(cfg['overview_eyebrow']))}</p>
      <h2 id="press-overview-title">{escape(str(cfg['overview_title']))}</h2>
      <p>{escape(str(cfg['overview_text']))}</p>
    </div>
    <nav class="press-period-nav" aria-label="{escape(str(cfg['nav_label']), quote=True)}">{nav}</nav>
  </div>
</section>
<div id="press-list" class="press-records">
{enhanced}
</div>
{sources}
</main>'''


for relative, cfg in PAGES.items():
    path = ROOT / relative
    html_text = path.read_text(encoding='utf-8')
    main_match = re.search(r'<main\b[^>]*id="main-content"[^>]*>(.*?)</main>', html_text, re.I | re.S)
    if not main_match:
        raise RuntimeError(f'{relative}: main-content not found')
    old_main = main_match.group(0)
    body = main_match.group(1)

    section_matches = list(re.finditer(r'<section class="era" id="([^"]+)">.*?</section>', body, re.I | re.S))
    sections = [(match.group(1), match.group(0)) for match in section_matches]
    if [item[0] for item in sections] != ['i', 'ii', 'iii', 'iv', 'v']:
        raise RuntimeError(f'{relative}: unexpected period structure {[item[0] for item in sections]}')

    source_match = re.search(r'<section class="sources">.*?</section>', body, re.I | re.S)
    if not source_match:
        raise RuntimeError(f'{relative}: sources section missing')

    articles = extract_articles([section for _, section in sections])
    new_main = build_main(cfg, sections, source_match.group(0))
    html_text = html_text.replace(old_main, new_main, 1)

    html_text = re.sub(r'<title>.*?</title>', f'<title>{escape(str(cfg["title"]))}</title>', html_text, count=1, flags=re.I | re.S)
    html_text = set_meta(html_text, 'name', 'description', str(cfg['description']))
    html_text = set_meta(html_text, 'property', 'og:title', str(cfg['title']))
    html_text = set_meta(html_text, 'property', 'og:description', str(cfg['description']))
    html_text = set_meta(html_text, 'name', 'twitter:title', str(cfg['title']))
    html_text = set_meta(html_text, 'name', 'twitter:description', str(cfg['description']))
    html_text = update_jsonld(html_text, cfg, articles)

    html_text = re.sub(r'<style id="press-editorial-redesign">.*?</style>', '', html_text, flags=re.I | re.S)
    html_text = html_text.replace('</head>', STYLE + '\n</head>', 1)
    html_text = re.sub(
        r'<body class="([^"]*)">',
        lambda match: f'<body class="{match.group(1)} press-page"' + '>',
        html_text,
        count=1,
        flags=re.I,
    )

    path.write_text(html_text, encoding='utf-8')
    print(f'{relative}: redesigned with {len(articles)} preserved records')

AUDIT = r'''import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  ['press.html', 'Press, interviews and public record'],
  ['hu/press.html', 'Sajtó, interjúk és nyilvános megjelenések'],
  ['de-at/press.html', 'Presse, Interviews und öffentliche Resonanz']
];
const errors = [];
const hrefSets = [];
const styleBlocks = [];

for (const [relative, heading] of pages) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  if (!html.includes('<main id="main-content" class="press-redesign">')) errors.push(`${relative}: redesigned main missing`);
  if (!html.includes(`<h1>${heading}</h1>`)) errors.push(`${relative}: direct H1 missing`);
  if (!html.includes('id="press-list" class="press-records"')) errors.push(`${relative}: visible press-list missing`);
  if (!html.includes('id="press-editorial-redesign"')) errors.push(`${relative}: editorial style missing`);
  if (!html.includes('@media (max-width:620px)')) errors.push(`${relative}: mobile layout rules missing`);
  if (html.includes('class="press-types"') || html.includes('class="thesis"')) errors.push(`${relative}: old abstract preamble remains`);
  if (html.includes('verified from the current Wikipedia source list') || html.includes('a jelenlegi Wikipédia-forrásjegyzék alapján ellenőrizve') || html.includes('anhand der aktuellen Wikipedia-Quellenliste geprüft')) errors.push(`${relative}: repetitive video notes remain`);
  const ids = [...html.matchAll(/<article class="item press-record" id="press-(\d{2})"/g)].map(m => m[1]);
  const expected = Array.from({length: 35}, (_, i) => String(i + 1).padStart(2, '0'));
  if (JSON.stringify(ids) !== JSON.stringify(expected)) errors.push(`${relative}: expected press-01..press-35, found ${ids.length}`);
  if (!html.includes('"numberOfItems":35')) errors.push(`${relative}: schema count is not 35`);
  const listItems = (html.match(/"@type":"ListItem"/g) || []).length;
  if (listItems !== 35) errors.push(`${relative}: expected 35 schema ListItems, found ${listItems}`);
  const hrefs = [...html.matchAll(/<article class="item press-record"[^>]*>.*?<a class="press-record__title" href="([^"]+)"/gs)].map(m => m[1]);
  hrefSets.push([relative, hrefs]);
  const style = html.match(/<style id="press-editorial-redesign">([\s\S]*?)<\/style>/)?.[1] || '';
  styleBlocks.push([relative, style]);
  for (const token of ['press-facts', 'press-period-nav', 'press-period-count', 'press-sources']) {
    if (!html.includes(token)) errors.push(`${relative}: ${token} missing`);
  }
}

const referenceHrefs = JSON.stringify(hrefSets[0][1]);
for (const [relative, hrefs] of hrefSets.slice(1)) {
  if (JSON.stringify(hrefs) !== referenceHrefs) errors.push(`${relative}: press source links differ from English`);
}
const referenceStyle = styleBlocks[0][1];
for (const [relative, style] of styleBlocks.slice(1)) {
  if (style !== referenceStyle) errors.push(`${relative}: multilingual press CSS drift`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Press editorial redesign audit passed: 35 records, 35 schema items, three languages, shared responsive hierarchy.');
'''
(ROOT / 'tests/audit-press-editorial-redesign.mjs').write_text(AUDIT, encoding='utf-8')

package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
command = package['scripts']['test']
addition = 'node tests/audit-press-editorial-redesign.mjs'
if addition not in command:
    package['scripts']['test'] = command + ' && ' + addition
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Persistent press redesign audit added.')
