from __future__ import annotations

from html import escape
from pathlib import Path
from urllib.parse import urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SELF = Path(__file__).resolve()
PERSON = "https://www.norbertbanhalmi.com/about/"
COMMONS = "https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg"
WORK_ROUTES = {
    "en": ("works/peter-magyar-portrait-2026.html", "/exhibitions/euforia.html#peter-magyar-portrait"),
    "hu": ("hu/works/magyar-peter-portre-2026.html", "/hu/exhibitions/euforia.html#peter-magyar-portrait"),
    "de": ("de-at/works/peter-magyar-portraet-2026.html", "/de-at/exhibitions/euforia.html#peter-magyar-portrait"),
}
OLD_WORK_URLS = {
    "https://www.banhalmi.art/works/peter-magyar-portrait-2026.html#record": "https://www.banhalmi.art/exhibitions/euforia.html#peter-magyar-portrait",
    "https://www.banhalmi.art/works/peter-magyar-portrait-2026.html": "https://www.banhalmi.art/exhibitions/euforia.html#peter-magyar-portrait",
    "https://www.banhalmi.art/hu/works/magyar-peter-portre-2026.html#record": "https://www.banhalmi.art/hu/exhibitions/euforia.html#peter-magyar-portrait",
    "https://www.banhalmi.art/hu/works/magyar-peter-portre-2026.html": "https://www.banhalmi.art/hu/exhibitions/euforia.html#peter-magyar-portrait",
    "https://www.banhalmi.art/de-at/works/peter-magyar-portraet-2026.html#record": "https://www.banhalmi.art/de-at/exhibitions/euforia.html#peter-magyar-portrait",
    "https://www.banhalmi.art/de-at/works/peter-magyar-portraet-2026.html": "https://www.banhalmi.art/de-at/exhibitions/euforia.html#peter-magyar-portrait",
}

LANG = {
    "en": {
        "registry": "en",
        "home": "index.html",
        "curators": "curators.html",
        "prefix": "",
        "html_lang": "en",
        "moved_title": "Moved: Portrait of Péter Magyar — EUFÓRIA",
        "moved_copy": "This archive record is documented only within",
        "euforia": "EUFÓRIA — The Anatomy of Presence",
        "source_note": "Author recollection",
    },
    "hu": {
        "registry": "hu",
        "home": "hu/index.html",
        "curators": "hu/curators.html",
        "prefix": "/hu",
        "html_lang": "hu-HU",
        "moved_title": "Áthelyezve: Magyar Péter portréja — EUFÓRIA",
        "moved_copy": "Ez az archívumi rekord kizárólag az alábbi projekt részeként szerepel:",
        "euforia": "EUFÓRIA — a Jelenlét anatómiája",
        "source_note": "Szerzői visszaemlékezés",
    },
    "de": {
        "registry": "de-AT",
        "home": "de-at/index.html",
        "curators": "de-at/curators.html",
        "prefix": "/de-at",
        "html_lang": "de-AT",
        "moved_title": "Verschoben: Porträt von Péter Magyar — EUFÓRIA",
        "moved_copy": "Dieser Archivdatensatz wird ausschließlich im folgenden Projekt dokumentiert:",
        "euforia": "EUFÓRIA — Die Anatomie der Präsenz",
        "source_note": "Eigene Erinnerung des Künstlers",
    },
}

RELATED_LABELS = {
    "en": {"press": "Press archive", "curators": "Curatorial dossier", "community": "Community and teaching", "writing": "Writing and publications"},
    "hu": {"press": "Sajtóarchívum", "curators": "Kurátori dosszié", "community": "Közösség és oktatás", "writing": "Írások és publikációk"},
    "de": {"press": "Pressearchiv", "curators": "Kuratorisches Dossier", "community": "Gemeinschaft und Bildung", "writing": "Texte und Publikationen"},
}


def read_json(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def write_json(path: str, data: object) -> None:
    (ROOT / path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def local_path(url: str) -> str:
    parsed = urlparse(url)
    if parsed.netloc.endswith("banhalmi.art"):
        return parsed.path + (("#" + parsed.fragment) if parsed.fragment else "")
    return url


def period_text(stage: dict, lang: str) -> str:
    value = stage["period"]
    return value.get(lang, value.get("en", "")) if isinstance(value, dict) else value


def lookup_records(registry: dict, lang_key: str) -> tuple[dict, dict]:
    exhibitions = {}
    books = {}
    for record in registry.get("records", []):
        if record.get("language") != lang_key:
            continue
        slug = record.get("slug")
        if not slug:
            continue
        if record.get("type") == "ExhibitionEvent":
            exhibitions[slug] = record
        elif record.get("type") == "Book":
            books[slug] = record
    return exhibitions, books


def render_record_group(label: str, records: list[dict], kind: str, open_group: bool = False) -> str:
    if not records:
        return ""
    items = []
    for record in records:
        title = escape(str(record.get("title", "")))
        href = escape(local_path(str(record.get("canonicalUrl", record.get("archiveUrl", "#")))), quote=True)
        description = record.get("publicationNote") or record.get("description") or ""
        meta = f"<span>{escape(str(description))}</span>" if description else ""
        items.append(f'<li><a href="{href}"><strong>{title}</strong>{meta}</a></li>')
    opened = " open" if open_group else ""
    return (
        f'<details class="life-record-group life-record-group--{kind}"{opened}>'
        f'<summary><span>{escape(label)}</span><small>{len(records):02d}</small></summary>'
        f'<ul class="life-record-list">{"".join(items)}</ul></details>'
    )


def render_related(lang: str, stage: dict, labels: dict) -> str:
    pages = stage.get("relatedPages", [])
    if not pages:
        return ""
    cfg = LANG[lang]
    items = []
    for page in pages:
        path = f'{cfg["prefix"]}/{page}.html' if cfg["prefix"] else f'/{page}.html'
        label = RELATED_LABELS[lang][page]
        items.append(f'<li><a href="{path}"><strong>{escape(label)}</strong></a></li>')
    return (
        f'<details class="life-record-group life-record-group--related">'
        f'<summary><span>{escape(labels["related"])}</span><small>{len(items):02d}</small></summary>'
        f'<ul class="life-record-list">{"".join(items)}</ul></details>'
    )


def render_journey(data: dict, registry: dict, press_registry: dict, lang: str, dossier: bool) -> str:
    cfg = LANG[lang]
    labels = data["labels"][lang]
    exhibitions, books = lookup_records(registry, cfg["registry"])
    press_records = {
        record["anchor"]: record
        for record in press_registry["languages"][cfg["registry"]]["records"]
    }
    stages = []
    conceptual_anchors = {
        "digital-origin": "period-i",
        "authorial-opening": "period-ii",
        "body-memory-books": "period-iii",
        "institution-community": "period-iv",
        "euforia": "period-v",
    }
    for index, stage in enumerate(data["stages"], start=1):
        stage_exhibitions = [exhibitions[slug] for slug in stage.get("exhibitions", []) if slug in exhibitions]
        stage_books = [books[slug] for slug in stage.get("books", []) if slug in books]
        stage_press = [press_records[anchor] for anchor in stage.get("press", []) if anchor in press_records]
        groups = "".join([
            render_record_group(labels["exhibitions"], stage_exhibitions, "exhibitions", bool(stage_books)),
            render_record_group(labels["books"], stage_books, "books", True),
            render_record_group(labels["press"], stage_press, "press", False),
            render_related(lang, stage, labels),
        ])
        note = ""
        if not groups:
            note = f'<p class="life-stage__empty">{escape(labels["noRecords"])}</p>'
        if stage.get("sourceStatus") == "artist-recollection-no-external-client-evidence-claimed":
            note += f'<p class="life-stage__source"><span>{escape(cfg["source_note"])}</span></p>'
        conceptual = conceptual_anchors.get(stage["id"])
        anchor = f'<span class="archive-anchor" id="{conceptual}" aria-hidden="true"></span>' if conceptual else ""
        title = escape(stage["title"][lang])
        narrative = escape(stage["narrative"][lang])
        stages.append(
            f'<article class="life-stage" id="journey-{escape(stage["id"], quote=True)}">{anchor}'
            f'<header class="life-stage__head"><p class="life-stage__index">{index:02d} · {escape(period_text(stage, lang))}</p>'
            f'<h3>{title}</h3><p>{narrative}</p>{note}</header>'
            f'<div class="life-stage__records">{groups}</div></article>'
        )
    section_id = "oeuvre-structure" if dossier else "journey"
    classes = "life-journey life-journey--dossier" if dossier else "tone-a life-journey"
    hidden_anchor = "" if dossier else '<span id="presence-periods" class="archive-anchor" aria-hidden="true"></span>'
    return (
        '<!-- LIFE-JOURNEY:START -->\n'
        f'<section id="{section_id}" class="{classes}" aria-labelledby="{section_id}-title"><div class="wrap">'
        f'{hidden_anchor}<div class="intro life-journey__intro"><p class="label">{escape(labels["section"])}</p>'
        f'<h2 id="{section_id}-title">{escape(labels["heading"])}</h2><p class="lead">{escape(labels["lead"])}</p></div>'
        f'<div class="life-journey__stages">{"".join(stages)}</div>'
        '</div></section>\n<!-- LIFE-JOURNEY:END -->\n'
    )


def replace_home_journey(path: Path, block: str) -> None:
    html = path.read_text(encoding="utf-8")
    if "<!-- LIFE-JOURNEY:START -->" in html:
        pattern = r"<!-- LIFE-JOURNEY:START -->.*?<!-- LIFE-JOURNEY:END -->\s*"
    else:
        pattern = r'<section\s+id=["\']journey["\'][\s\S]*?(?=<section\s+id=["\']exhibitions["\'])'
    updated, count = re.subn(pattern, block, html, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Could not replace life journey in {path}")
    path.write_text(updated, encoding="utf-8")


def replace_curator_journey(path: Path, block: str) -> None:
    html = path.read_text(encoding="utf-8")
    if "<!-- LIFE-JOURNEY:START -->" in html:
        pattern = r"<!-- LIFE-JOURNEY:START -->.*?<!-- LIFE-JOURNEY:END -->\s*"
    else:
        pattern = r"<!-- OEUVRE-INTEGRITY:START -->.*?<!-- OEUVRE-INTEGRITY:END -->\s*"
    updated, count = re.subn(pattern, block, html, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Could not replace curator journey in {path}")
    path.write_text(updated, encoding="utf-8")


def redirect_stub(lang: str, target: str, release: str) -> str:
    cfg = LANG[lang]
    target_abs = "https://www.banhalmi.art" + target
    sheets = [
        "presence-core.css", "archive-system.css", "design-refinements.css", "footer-elegant.css",
        "final-layout-fixes.css", "apple-editorial-system.css", "responsive-header-system.css", "museum-editorial.css"
    ]
    links = "\n".join(f'<link rel="stylesheet" href="/assets/css/{sheet}?v={release}">' for sheet in sheets)
    return f'''<!doctype html>
<html lang="{cfg["html_lang"]}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{escape(cfg["moved_title"])}</title>
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0; url={target_abs}">
  <link rel="canonical" href="{target_abs}">
  <script>window.location.replace({json.dumps(target_abs)});</script>
  {links}
</head>
<body class="apple-archive">
  <main class="wrap narrow" style="padding-block:8rem">
    <p>{escape(cfg["moved_copy"])} <a href="{target}">{escape(cfg["euforia"])}</a>.</p>
  </main>
</body>
</html>
'''


def consolidate_peter_magyar(release: str) -> None:
    # Remove the standalone record from the canonical registry before replacing legacy URLs.
    registry_path = ROOT / "archive-record-registry.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    registry["records"] = [record for record in registry.get("records", []) if "/works/" not in str(record.get("canonicalUrl", ""))]
    registry["recordCount"] = len(registry["records"]) if "recordCount" in registry else registry.get("recordCount")
    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Replace old standalone IDs in all text-based source and machine-readable files.
    extensions = {".html", ".json", ".jsonld", ".txt", ".md", ".xml", ".mjs", ".js"}
    redirect_files = {str((ROOT / route).resolve()) for route, _ in WORK_ROUTES.values()}
    for file in ROOT.rglob("*"):
        if not file.is_file() or file.resolve() == SELF or str(file.resolve()) in redirect_files:
            continue
        if any(part in {".git", "node_modules"} for part in file.parts) or file.suffix.lower() not in extensions:
            continue
        try:
            text = file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        original = text
        for old, new in OLD_WORK_URLS.items():
            text = text.replace(old, new)
        if text != original:
            file.write_text(text, encoding="utf-8")

    # Euforia owns the visible and machine-readable portrait context.
    for lang, cfg in LANG.items():
        euforia_path = ROOT / (f'{cfg["prefix"].lstrip("/") + "/" if cfg["prefix"] else ""}exhibitions/euforia.html')
        html = euforia_path.read_text(encoding="utf-8")
        html = re.sub(
            r'<li><a href=["\'][^"\']*works/[^"\']+["\']>(.*?)</a><span class=["\']archive-relation-type["\']>(.*?)</span></li>',
            r'<li><a href="#peter-magyar-portrait">\1</a><span class="archive-relation-type">\2</span></li>',
            html,
            flags=re.S,
        )
        if 'id="peter-magyar-portrait"' not in html:
            html = html.replace(
                '<article class="evidence-item"><a class="evidence-link" href="' + COMMONS + '"',
                '<article class="evidence-item" id="peter-magyar-portrait"><a class="evidence-link" href="' + COMMONS + '"',
                1,
            )
        euforia_path.write_text(html, encoding="utf-8")

    # Keep three tiny, noindex legacy route bridges; no standalone artwork content remains.
    for lang, (route, target) in WORK_ROUTES.items():
        path = ROOT / route
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(redirect_stub(lang, target, release), encoding="utf-8")

    # Both redirect maps expose the same localized destinations.
    redirects_path = ROOT / "redirects.json"
    redirects = json.loads(redirects_path.read_text(encoding="utf-8"))
    redirects["redirects"]["/norbert-banhalmi"] = PERSON
    redirects["redirects"]["/hu/norbert-banhalmi"] = PERSON
    redirects["redirects"]["/de-at/norbert-banhalmi"] = PERSON
    for _, (route, target) in WORK_ROUTES.items():
        redirects["redirects"]["/" + route] = target
        redirects["redirects"]["/" + route.removesuffix(".html")] = target
    redirects["updatedAt"] = "2026-08-02"
    redirects_path.write_text(json.dumps(redirects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    netlify = ROOT / "_redirects"
    lines = netlify.read_text(encoding="utf-8").splitlines()
    additions = []
    for _, (route, target) in WORK_ROUTES.items():
        additions.extend([f"/{route}  {target}  301", f"/{route.removesuffix('.html')}  {target}  301"])
    existing_sources = {line.split()[0] for line in lines if line.strip() and not line.lstrip().startswith("#") and len(line.split()) >= 3}
    for line in additions:
        if line.split()[0] not in existing_sources:
            lines.insert(-1 if lines and lines[-1].startswith("/*") else len(lines), line)
    netlify.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # The dedicated artwork sitemap and graph represented the removed standalone page.
    for obsolete in [ROOT / "sitemap-artworks.xml", ROOT / "artwork-knowledge-graph.hu.jsonld"]:
        obsolete.unlink(missing_ok=True)
    robots = ROOT / "robots.txt"
    robots.write_text("\n".join(line for line in robots.read_text(encoding="utf-8").splitlines() if "sitemap-artworks.xml" not in line) + "\n", encoding="utf-8")
    sitemap = ROOT / "sitemap.xml"
    text = sitemap.read_text(encoding="utf-8")
    for route, _ in WORK_ROUTES.values():
        text = re.sub(r"<url>.*?" + re.escape(route) + r".*?</url>\s*", "", text, flags=re.S)
    text = re.sub(r"<lastmod>[^<]+</lastmod>", "<lastmod>2026-08-02</lastmod>", text)
    sitemap.write_text(text, encoding="utf-8")

    relationships = {
        "version": "2.0",
        "updated": "2026-08-02",
        "relationships": [
            {"from": "banhalmi:project:euforia", "relationship": "includesWork", "to": COMMONS},
            {"from": "banhalmi:project:euforia", "relationship": "hasBusinessCaseStudy", "to": "https://www.norbertbanhalmi.com/hu/esettanulmanyok/magyar-peter-portre-2026/"},
            {"from": "banhalmi:exhibition:milestones-1956-new-york-2016", "relationship": "documents", "to": "1956 Hungarian diaspora memory in New York"},
            {"from": "banhalmi:exhibition:awakening-2017-2018", "relationship": "documents", "to": "survival, dignity and recovery after gynecological cancer"},
        ],
    }
    write_json("data/relationships.json", relationships)


def update_origin_claims() -> None:
    backbone = read_json("period-evidence-backbone.json")
    backbone["thesis"] = "One oeuvre: a personally documented digital origin followed by publicly documented research periods."
    period = backbone["periods"][0]
    period["name"] = {
        "hu": "MOL Y2K, digitális képalkotás és dokumentáció — a kiindulópont",
        "en": "MOL Y2K, digital image-making and documentation — the point of departure",
        "de": "MOL Y2K, digitale Bildgestaltung und Dokumentation — der Ausgangspunkt",
    }
    period["anchorProject"] = {
        "id": "https://www.banhalmi.art/#journey-digital-origin",
        "name": "MOL Y2K project — self-initiated photographic documentation",
        "recordUrl": "https://www.banhalmi.art/#journey-digital-origin",
        "wikidata": None,
    }
    period["curatorialNote"] = {
        "hu": "A MOL Y2K projektben informatikusként vettem részt. Saját elhatározásból, egy egyszerű 1,3 megapixeles digitális fényképezőgéppel kezdtem dokumentálni a projektet. Ez szerzői visszaemlékezés és az életmű digitális kiindulópontja; külső megbízói bizonyítékot nem állítunk hozzá.",
        "en": "I took part in the MOL Y2K project as an IT specialist and began documenting it on my own initiative with a basic 1.3-megapixel digital camera. This is the artist’s recollection and the digital point of departure of the oeuvre; no external client evidence is claimed for it.",
        "de": "Ich nahm als IT-Spezialist am MOL-Y2K-Projekt teil und begann, es aus eigenem Entschluss mit einer einfachen Digitalkamera mit 1,3 Megapixeln zu dokumentieren. Dies ist die eigene Erinnerung des Künstlers und der digitale Ausgangspunkt des Œuvres; ein externer Auftraggebernachweis wird dafür nicht behauptet.",
    }
    write_json("period-evidence-backbone.json", backbone)

    registry = read_json("archive-record-registry.json")
    registry["origin"] = "MOL Y2K project: self-initiated photographic documentation while participating as an IT specialist; artist recollection, no external client evidence claimed."
    write_json("archive-record-registry.json", registry)


def cleanup_historical_files() -> None:
    historical = [
        "data/archive/about.hu.html",
        "data/archive/artwork-registry.hu.json",
        "data/archive/books.hu.json",
        "data/archive/career-chronology.hu.html",
        "data/archive/career-chronology.hu.json",
        "data/archive/contact-footer.hu.json",
        "data/archive/domain-ecosystem.hu.json",
        "data/archive/family-origins.hu.json",
        "data/archive/home-intro.hu.json",
        "data/archive/home-meta.hu.json",
        "data/archive/hu-project-page-overrides.json",
        "data/archive/oeuvre-relations.hu.json",
        "data/archive/press-relations.hu.json",
        "data/archive/project-summaries.hu.json",
        "data/archive/secondary-pages.hu.json",
        "data/archive/section-intros.hu.json",
        "data/archive/vocabulary-policy.json",
        "reports/page-inventory.md",
        "reports/page-inventory.json",
        "archive-audit-diagnostics.txt",
    ]
    for relative in historical:
        (ROOT / relative).unlink(missing_ok=True)
    (ROOT / "data/archive/README.md").write_text(
        """# data/archive\n\nOnly two active reference files remain in this directory.\n\n| file | checked by |\n|---|---|\n| `home-copy.json` | `tests/audit-home-copy.mjs` |\n| `oeuvre-periods.json` | `tools/audit_record_depth.py` |\n\nThe former generator extracts were removed on 2026-08-02 because no runtime,\nbuild step or audit read them. The canonical chronological source is now\n`../life-journey.json`; visible HTML remains the deployable source of truth.\n""",
        encoding="utf-8",
    )
    ignore = ROOT / ".gitignore"
    entries = ignore.read_text(encoding="utf-8").splitlines()
    for item in ["archive-audit-diagnostics.txt", "reports/page-inventory.*"]:
        if item not in entries:
            entries.append(item)
    ignore.write_text("\n".join(entries) + "\n", encoding="utf-8")


def append_css() -> None:
    path = ROOT / "assets/css/museum-editorial.css"
    css = path.read_text(encoding="utf-8")
    marker = "/* 18. Canonical life journey */"
    if marker in css:
        css = css[: css.index(marker)].rstrip() + "\n\n"
    css += r'''/* 18. Canonical life journey */
.life-journey__intro{max-width:72ch!important;margin:0 0 clamp(3.5rem,6vw,6rem)!important;text-align:left!important}
.life-journey__intro :is(h2,.lead,.label){margin-left:0!important;margin-right:auto!important;text-align:left!important}
.life-journey__stages{border-top:1px solid var(--mus-hair-strong)}
.life-stage{position:relative;display:grid;grid-template-columns:minmax(15rem,.7fr) minmax(0,1.3fr);gap:clamp(2.5rem,7vw,7rem);padding:clamp(3rem,6vw,5.75rem) 0;border-bottom:1px solid var(--mus-hair)}
.life-stage::before{content:"";position:absolute;inset:0 50% 0 50%;z-index:-1;width:100vw;transform:translateX(-50%);background:rgba(255,255,255,.012);opacity:0;transition:opacity .2s ease}
.life-stage:nth-child(even)::before{opacity:1}
.life-stage__head{align-self:start;min-width:0}
.life-stage__index{margin:0 0 1rem!important;color:var(--mus-gold)!important;font-size:.76rem!important;font-weight:650!important;letter-spacing:.11em!important;text-transform:uppercase}
.life-stage__head h3{max-width:20ch;margin:0 0 1.35rem!important;font-size:clamp(1.7rem,2.5vw,2.65rem)!important;line-height:1.09!important;letter-spacing:-.025em!important}
.life-stage__head>p:not(.life-stage__index,.life-stage__source,.life-stage__empty){max-width:58ch!important;margin:0!important;color:var(--mus-soft)!important}
.life-stage__source{display:inline-flex;margin:1.4rem 0 0!important;padding:.42rem .7rem;border:1px solid var(--mus-hair);border-radius:999px;color:var(--mus-gold)!important;font-size:.72rem!important;letter-spacing:.05em}
.life-stage__empty{max-width:50ch!important;margin:1.5rem 0 0!important;padding-top:1.25rem;border-top:1px solid var(--mus-hair);color:var(--mus-faint)!important;font-size:.86rem!important}
.life-stage__records{min-width:0;border-top:1px solid var(--mus-hair)}
.life-record-group{border-bottom:1px solid var(--mus-hair)}
.life-record-group summary{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;min-height:56px;padding:1rem 0;color:var(--mus-ink);font-size:.88rem;font-weight:600;letter-spacing:.015em;cursor:pointer;list-style:none}
.life-record-group summary::-webkit-details-marker{display:none}
.life-record-group summary small{display:inline-grid;place-items:center;min-width:2.15rem;height:2.15rem;border:1px solid var(--mus-hair);border-radius:999px;color:var(--mus-gold);font-size:.7rem;font-variant-numeric:tabular-nums}
.life-record-group summary::after{content:"+";order:3;color:var(--mus-gold);font-size:1.15rem;font-weight:400}
.life-record-group[open] summary::after{content:"−"}
.life-record-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;margin:0 0 1.25rem!important;padding:1px!important;list-style:none!important;background:var(--mus-hair)}
.life-record-list li{min-width:0;margin:0!important;background:var(--mus-base)}
.life-record-list a{display:flex;flex-direction:column;gap:.45rem;height:100%;padding:clamp(1.25rem,2vw,1.8rem)!important;color:var(--mus-ink)!important;text-decoration:none!important}
.life-record-list a:hover{background:rgba(255,255,255,.035)}
.life-record-list strong{font-size:.95rem;font-weight:600;line-height:1.35}
.life-record-list span{color:var(--mus-faint);font-size:.78rem;line-height:1.5}
.life-journey--dossier{--banhalmi-section-surface:linear-gradient(135deg,#171717 0%,#242424 100%)!important}
@media(max-width:900px){.life-stage{grid-template-columns:1fr;gap:2rem}.life-stage__head h3{max-width:26ch}.life-record-list{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.life-stage::before,.life-record-list a{transition:none!important}}
'''
    path.write_text(css, encoding="utf-8")


def update_machine_entrypoints() -> None:
    llms = ROOT / "llms.txt"
    text = llms.read_text(encoding="utf-8")
    line = "Canonical life journey: https://www.banhalmi.art/data/life-journey.json\n"
    if line.strip() not in text:
        text = text.replace("Oeuvre career arc: https://www.banhalmi.art/#journey\n", "Oeuvre career arc: https://www.banhalmi.art/#journey\n" + line)
    llms.write_text(text, encoding="utf-8")
    ai = ROOT / "ai.txt"
    text = ai.read_text(encoding="utf-8")
    if "data/life-journey.json" not in text:
        text = text.replace("Primary machine-readable indexes:\n", "Primary machine-readable indexes:\n- https://www.banhalmi.art/data/life-journey.json\n")
    ai.write_text(text, encoding="utf-8")


def update_release() -> str:
    path = ROOT / "data/design-release.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["release"] = "20260802-life-journey-v25"
    data["note"] = "Canonical life-journey release: every period links its exhibitions, books and public reception; MOL Y2K origin corrected; Péter Magyar portrait consolidated under EUFÓRIA; inactive generator extracts removed."
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return data["release"]


def main() -> None:
    data = read_json("data/life-journey.json")
    registry = read_json("archive-record-registry.json")
    press_registry = read_json("press-source-registry.json")
    for lang, cfg in LANG.items():
        replace_home_journey(ROOT / cfg["home"], render_journey(data, registry, press_registry, lang, False))
        replace_curator_journey(ROOT / cfg["curators"], render_journey(data, registry, press_registry, lang, True))
    release = update_release()
    consolidate_peter_magyar(release)
    update_origin_claims()
    cleanup_historical_files()
    append_css()
    update_machine_entrypoints()
    SELF.unlink(missing_ok=True)
    print("Life journey, EUFÓRIA consolidation and repository cleanup completed.")


if __name__ == "__main__":
    main()
