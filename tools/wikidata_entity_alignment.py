#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

# Only identifiers recovered from previously shared schema/audit material and
# already used in the BANHALMI ecosystem are admitted here. Do not add guessed QIDs.
ENTITIES = {
    'norbert-banhalmi': {
        'name': 'Bánhalmi Norbert',
        'type': 'Person',
        'wikidata': 'https://www.wikidata.org/wiki/Q56391118',
        'canonical': 'https://www.banhalmi.art/norbert-banhalmi#person',
    },
    'banhalmi-organization': {
        'name': 'BANHALMI / Bánhalmi Norbert e.U.',
        'type': 'Organization',
        'wikidata': 'https://www.wikidata.org/wiki/Q138425941',
        'canonical': 'https://www.norbertbanhalmi.com/#organization',
    },
    'amcham-austria': {
        'name': 'AmCham Austria',
        'type': 'Organization',
        'wikidata': 'https://www.wikidata.org/wiki/Q138413481',
        'officialWebsite': 'https://amcham.at/',
    },
    'euforia-project': {
        'name': 'EUFÓRIA – The Anatomy of Presence',
        'type': 'CreativeWorkSeries',
        'wikidata': 'https://www.wikidata.org/wiki/Q138717398',
        'canonical': 'https://www.banhalmi.art/hu/exhibitions/euforia.html#record',
    },
    'peter-magyar': {
        'name': 'Péter Magyar',
        'type': 'Person',
        'wikidata': 'https://www.wikidata.org/wiki/Q124488292',
    },
    'budapest': {
        'name': 'Budapest',
        'type': 'City',
        'wikidata': 'https://www.wikidata.org/wiki/Q1781',
    },
    'hungary': {
        'name': 'Hungary',
        'type': 'Country',
        'wikidata': 'https://www.wikidata.org/wiki/Q28',
    },
}

registry = {
    'name': 'BANHALMI verified Wikidata entity registry',
    'policy': 'Only previously documented or independently verified identifiers; no inferred or invented QIDs.',
    'entities': ENTITIES,
}
(ROOT / 'wikidata-entity-registry.json').write_text(
    json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
)

archive_path = ROOT / 'archive-record-registry.json'
if archive_path.exists():
    archive = json.loads(archive_path.read_text(encoding='utf-8'))
    archive['wikidataEntityRegistry'] = 'https://www.banhalmi.art/wikidata-entity-registry.json'
    archive['creatorWikidata'] = ENTITIES['norbert-banhalmi']['wikidata']
    archive['publisherWikidata'] = ENTITIES['banhalmi-organization']['wikidata']
    archive['originEntity'] = {
        'name': 'MOL Project',
        'wikidata': None,
        'verificationStatus': 'No verified Wikidata identifier recovered; deliberately left unset.'
    }
    for record in archive.get('records', []):
        record['creatorWikidata'] = ENTITIES['norbert-banhalmi']['wikidata']
        record['publisherWikidata'] = ENTITIES['banhalmi-organization']['wikidata']
        slug = str(record.get('slug', '')).lower()
        if 'euforia' in slug:
            record['sameAs'] = [ENTITIES['euforia-project']['wikidata']]
            record['about'] = [ENTITIES['peter-magyar']['wikidata']]
        else:
            record.setdefault('sameAs', [])
            record.setdefault('about', [])
    archive_path.write_text(json.dumps(archive, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

press_path = ROOT / 'press-source-registry.json'
if press_path.exists():
    press = json.loads(press_path.read_text(encoding='utf-8'))
    press['creatorWikidata'] = ENTITIES['norbert-banhalmi']['wikidata']
    press['entityRegistry'] = 'https://www.banhalmi.art/wikidata-entity-registry.json'
    for lang in press.get('languages', {}).values():
        for record in lang.get('records', []):
            title = str(record.get('title', '')).lower()
            source = str(record.get('sourceUrl', '')).lower()
            if 'magyar péter' in title or 'péter magyar' in title or 'peter-magyar-portrait' in source:
                record['aboutWikidata'] = [ENTITIES['peter-magyar']['wikidata']]
                record['projectWikidata'] = ENTITIES['euforia-project']['wikidata']
    press_path.write_text(json.dumps(press, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(f'Wikidata alignment completed with {len(ENTITIES)} verified entities.')
