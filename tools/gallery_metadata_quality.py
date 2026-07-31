#!/usr/bin/env python3
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
HOME = {
    'index.html': {
        'alt': 'Curatorial archive selection, image {index} of {total} — photograph by Norbert Bánhalmi.',
        'title': 'Curatorial archive selection {index}/{total} — Norbert Bánhalmi',
        'name': 'Curatorial archive selection — image {index} of {total}',
        'description': 'Image {index} of the complete {total}-image homepage curatorial selection from the BANHALMI photographic archive.',
        'duplicate_suffix': ' — archive image {index} of {total}',
    },
    'hu/index.html': {
        'alt': 'Kurátori archívumválogatás, {index}. kép a(z) {total} képből — Bánhalmi Norbert fotográfiája.',
        'title': 'Kurátori archívumválogatás {index}/{total} — Bánhalmi Norbert',
        'name': 'Kurátori archívumválogatás — {index}. kép a(z) {total} képből',
        'description': 'A BANHALMI fotográfiai archívum teljes, {total} képes főoldali kurátori válogatásának {index}. képe.',
        'duplicate_suffix': ' — {index}. archívumkép a(z) {total} képből',
    },
    'de-at/index.html': {
        'alt': 'Kuratorische Archivauswahl, Bild {index} von {total} — Fotografie von Norbert Bánhalmi.',
        'title': 'Kuratorische Archivauswahl {index}/{total} — Norbert Bánhalmi',
        'name': 'Kuratorische Archivauswahl — Bild {index} von {total}',
        'description': 'Bild {index} der vollständigen kuratorischen Startseitenauswahl mit {total} Bildern aus dem fotografischen BANHALMI Archiv.',
        'duplicate_suffix': ' — Archivbild {index} von {total}',
    },
}
SCRIPT_RE = re.compile(r'(<script\s+type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)
IMG_RE = re.compile(r'<img\b[^>]*\bsrc=["\'][^"\']*assets/img/best-of/best-of-(\d+)\.webp["\'][^>]*>', re.I)
GENERIC_MARKERS = ('Best of — the reference gallery', 'Works from the exhibition')


def set_attr(tag: str, name: str, value: str) -> str:
    escaped = html.escape(value, quote=True)
    pattern = re.compile(rf'(\s{name}=["\'])[^"\']*(["\'])', re.I)
    if pattern.search(tag):
        return pattern.sub(lambda m: m.group(1) + escaped + m.group(2), tag, count=1)
    return tag[:-1].rstrip() + f' {name}="{escaped}">'


def needs_replacement(value: str) -> bool:
    return not value or any(marker.lower() in value.lower() for marker in GENERIC_MARKERS)


def update_html_images(source: str, copy: dict, total: int) -> str:
    seen = set()

    def replace(match: re.Match) -> str:
        tag = match.group(0)
        index = int(match.group(1))
        alt_match = re.search(r'\salt=["\']([^"\']*)["\']', tag, re.I)
        title_match = re.search(r'\stitle=["\']([^"\']*)["\']', tag, re.I)
        alt = html.unescape(alt_match.group(1)).strip() if alt_match else ''
        title = html.unescape(title_match.group(1)).strip() if title_match else ''
        if needs_replacement(alt):
            alt = copy['alt'].format(index=index, total=total)
        elif alt in seen:
            alt = alt + copy['duplicate_suffix'].format(index=index, total=total)
        seen.add(alt)
        tag = set_attr(tag, 'alt', alt)
        if needs_replacement(title):
            tag = set_attr(tag, 'title', copy['title'].format(index=index, total=total))
        return tag
    return IMG_RE.sub(replace, source)


def walk_nodes(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_nodes(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_nodes(child)


def update_jsonld(source: str, copy: dict) -> str:
    def replace_script(match: re.Match) -> str:
        raw = html.unescape(match.group(2).strip())
        try:
            data = json.loads(raw)
        except Exception:
            return match.group(0)
        for node in walk_nodes(data):
            node_type = node.get('@type')
            types = node_type if isinstance(node_type, list) else [node_type]
            if 'ImageGallery' not in types:
                continue
            media = node.get('associatedMedia')
            if not isinstance(media, list):
                continue
            total = len(media)
            seen_names = set()
            seen_captions = set()
            for position, image in enumerate(media, start=1):
                if not isinstance(image, dict):
                    continue
                name = str(image.get('name', '')).strip()
                caption = str(image.get('caption', '')).strip()
                if needs_replacement(name):
                    name = copy['name'].format(index=position, total=total)
                elif name in seen_names:
                    name = name + copy['duplicate_suffix'].format(index=position, total=total)
                seen_names.add(name)
                image['name'] = name
                if needs_replacement(caption):
                    caption = copy['alt'].format(index=position, total=total)
                elif caption in seen_captions:
                    caption = caption + copy['duplicate_suffix'].format(index=position, total=total)
                seen_captions.add(caption)
                image['caption'] = caption
                if needs_replacement(str(image.get('description', ''))):
                    image['description'] = copy['description'].format(index=position, total=total)
        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)
    return SCRIPT_RE.sub(replace_script, source)


changed = []
for relative, copy in HOME.items():
    path = ROOT / relative
    if not path.exists():
        continue
    source = path.read_text(encoding='utf-8')
    total = len(IMG_RE.findall(source))
    updated = update_html_images(source, copy, total)
    updated = update_jsonld(updated, copy)
    if updated != source:
        path.write_text(updated, encoding='utf-8')
        changed.append((relative, total))

print(f'Gallery metadata quality pass updated {len(changed)} homepage files.')
for relative, total in changed:
    print(f'{relative}: truthful unique metadata protected for {total} images')
