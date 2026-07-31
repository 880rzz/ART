#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
WD = 'https://www.wikidata.org/wiki/'

# Directly recovered from the current Bánhalmi Norbert Wikidata item (Q56391118)
# and its linked statements. Generic ontology values are intentionally excluded;
# this registry keeps entities that identify the artist, institutions, places,
# affiliations, books, exhibitions and projects represented in the archive.
ENTITIES = {
    'norbert-banhalmi': {'name': 'Bánhalmi Norbert', 'type': 'Person', 'wikidata': WD+'Q56391118', 'canonical': 'https://www.banhalmi.art/norbert-banhalmi#person'},
    'banhalmi-organization': {'name': 'BANHALMI / Bánhalmi Norbert e.U.', 'type': 'Organization', 'wikidata': WD+'Q138425941', 'canonical': 'https://www.norbertbanhalmi.com/#organization'},
    'amcham-austria': {'name': 'American Chamber of Commerce in Austria', 'type': 'Organization', 'wikidata': WD+'Q138413481', 'officialWebsite': 'https://amcham.at/'},
    'vipach': {'name': 'VIPACH | Vienna Photo Art & Creative HUB', 'type': 'Organization', 'wikidata': WD+'Q138416887', 'officialWebsite': 'https://www.vipach.at'},
    'rege-gallery': {'name': 'Rege Gallery', 'type': 'ArtGallery', 'wikidata': WD+'Q138414682', 'officialWebsite': 'https://www.regaleria.hu'},
    'focus-education': {'name': 'FOCUS Oktatási Kft.', 'type': 'EducationalOrganization', 'wikidata': WD+'Q138413788'},
    'dennis-gabor-university': {'name': 'Dennis Gabor University', 'type': 'CollegeOrUniversity', 'wikidata': WD+'Q941534'},
    'new-york-institute-of-photography': {'name': 'New York Institute of Photography', 'type': 'EducationalOrganization', 'wikidata': WD+'Q1109408'},
    'budapest': {'name': 'Budapest', 'type': 'City', 'wikidata': WD+'Q1781'},
    'vienna': {'name': 'Vienna', 'type': 'City', 'wikidata': WD+'Q1741'},
    'hungary': {'name': 'Hungary', 'type': 'Country', 'wikidata': WD+'Q28'},
    'the-great-rescue': {'name': 'The Great Rescue – Art to Take Away', 'type': 'Event', 'wikidata': WD+'Q138458277'},
    'awakening-book': {'name': 'Awakening: A New Beginning', 'type': 'Book', 'wikidata': WD+'Q138426842'},
    'womans-world-book': {'name': "The Woman's World", 'type': 'Book', 'wikidata': WD+'Q138426876'},
    'milestone-56': {'name': 'Milestone ’56', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454278'},
    'hungarian-women-new-york': {'name': 'Hungarian Women in New York', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454296'},
    'awakening-exhibition': {'name': 'Awakening – The New Beginning!', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454309'},
    'balerina-project-new-york': {'name': 'Balerina Project – New York', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454318'},
    'the-mens-dream': {'name': "The Men's Dream", 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454332'},
    'the-frame': {'name': 'The Frame', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454346'},
    'touch': {'name': 'Touch', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454365'},
    'different-in-a-different-way': {'name': 'Different in a Different Way', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454422'},
    'i-became-a-father': {'name': 'I became a father!', 'type': 'ExhibitionEvent', 'wikidata': WD+'Q138454436'},
    'meses-konyv': {'name': 'Mesés könyv', 'type': 'Book', 'wikidata': WD+'Q138667343'},
    'szosszenetek-book': {'name': 'Szösszenetek', 'type': 'Book', 'wikidata': WD+'Q138667529'},
    'euforia-project': {'name': 'Euphoria – The Anatomy of Presence', 'type': 'CreativeWorkSeries', 'wikidata': WD+'Q138717398', 'canonical': 'https://www.banhalmi.art/hu/exhibitions/euforia.html#record'},
    'peter-magyar': {'name': 'Péter Magyar', 'type': 'Person', 'wikidata': WD+'Q124488292'},
    'photographer': {'name': 'Photographer', 'type': 'Occupation', 'wikidata': WD+'Q33231'},
    'visual-artist': {'name': 'Visual artist', 'type': 'Occupation', 'wikidata': WD+'Q3391743'},
    'curator': {'name': 'Curator', 'type': 'Occupation', 'wikidata': WD+'Q674426'},
    'educator': {'name': 'Educator', 'type': 'Occupation', 'wikidata': WD+'Q974144'},
    'portrait-photographer': {'name': 'Portrait photographer', 'type': 'Occupation', 'wikidata': WD+'Q2544530'},
    'male': {'name': 'Male', 'type': 'DefinedTerm', 'wikidata': WD+'Q6581097'},
    'copyrighted-works': {'name': 'Copyrighted works', 'type': 'DefinedTerm', 'wikidata': WD+'Q73555012'},
    'norbert-given-name': {'name': 'Norbert', 'type': 'DefinedTerm', 'wikidata': WD+'Q917408'},
    'banhalmi-family-name': {'name': 'Bánhalmi', 'type': 'DefinedTerm', 'wikidata': WD+'Q136535825'},
    'portrait-photography': {'name': 'Portrait photography', 'type': 'DefinedTerm', 'wikidata': WD+'Q182956'},
    'fine-art-photography': {'name': 'Fine-art photography', 'type': 'DefinedTerm', 'wikidata': WD+'Q1066582'},
    'documentary-photography': {'name': 'Documentary photography', 'type': 'DefinedTerm', 'wikidata': WD+'Q615498'},
    'conceptual-photography': {'name': 'Conceptual photography', 'type': 'DefinedTerm', 'wikidata': WD+'Q5158441'},
    'mfvsz': {'name': 'World Association of Hungarian Photographic Artists', 'type': 'Organization', 'wikidata': WD+'Q138413557'},
    'wko-professional-photography': {'name': 'Austrian Federal Economic Chamber – Professional Photography', 'type': 'Organization', 'wikidata': WD+'Q138424838'},
    'english-language': {'name': 'English', 'type': 'Language', 'wikidata': WD+'Q1860'},
    'hungarian-language': {'name': 'Hungarian', 'type': 'Language', 'wikidata': WD+'Q9067'},
    'brand-ambassador': {'name': 'Brand ambassador', 'type': 'Occupation', 'wikidata': WD+'Q4956562'},
    'hipstudio': {'name': 'HIPStudio', 'type': 'Organization', 'wikidata': WD+'Q138482177'},
    'orf-portrait-article': {'name': 'Összegyűlt: portréfotók egy jó cél érdekében', 'type': 'Article', 'wikidata': WD+'Q138538649'},
    'turul-award': {'name': 'Turul Award', 'type': 'Award', 'wikidata': WD+'Q138578053'},
    'top-100-hungary': {'name': 'Top 100 of Hungary', 'type': 'Award', 'wikidata': WD+'Q138578385'},
    'contemporary-art': {'name': 'Contemporary art', 'type': 'DefinedTerm', 'wikidata': WD+'Q186030'},
}

RECORD_ENTITY_MAP = {
    'book-ebredes': 'awakening-book',
    'book-anovilaga': 'womans-world-book',
    'book-szosszenetek': 'szosszenetek-book',
    'merfoldkovek1956': 'milestone-56',
    'fotokiallitas3': 'hungarian-women-new-york',
    'ebredes': 'awakening-exhibition',
    'balerina-project-new-york': 'balerina-project-new-york',
    'themensdream': 'the-mens-dream',
    'theframe': 'the-frame',
    'touch-wien': 'touch',
    'mas-kepp-mas': 'different-in-a-different-way',
    'fotokiallitas5': 'i-became-a-father',
    'euforia': 'euforia-project',
}

registry = {
    'name': 'BANHALMI Wikidata entity registry derived from Q56391118',
    'sourceEntity': WD+'Q56391118',
    'policy': 'Only direct statements and linked entities recovered from the current Bánhalmi Norbert Wikidata graph; no inferred QIDs.',
    'entities': ENTITIES,
    'recordEntityMap': RECORD_ENTITY_MAP,
}
(ROOT / 'wikidata-entity-registry.json').write_text(json.dumps(registry, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

source_inventory = json.loads((ROOT / 'data' / 'wikidata-source-inventory.json').read_text(encoding='utf-8'))
source_registry = {
    'name': source_inventory['name'],
    'sourceEntity': source_inventory['sourceEntity'],
    'checkedAt': source_inventory['checkedAt'],
    'sourceCount': len(source_inventory['sources']),
    'sources': [
        {
            'id': f'wikidata-statement-source-{index:03d}',
            'url': url,
            'type': 'wikidata-statement-source',
            'supports': ['person', 'related-entities', 'documented-claims'],
            'provenance': 'current-wikidata-statement',
        }
        for index, url in enumerate(source_inventory['sources'], 1)
    ],
    'excludedSources': source_inventory['excludedSources'],
}
(ROOT / 'wikidata-source-registry.json').write_text(json.dumps(source_registry, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

archive_path = ROOT / 'archive-record-registry.json'
if archive_path.exists():
    archive = json.loads(archive_path.read_text(encoding='utf-8'))
    archive['wikidataEntityRegistry'] = 'https://www.banhalmi.art/wikidata-entity-registry.json'
    archive['creatorWikidata'] = ENTITIES['norbert-banhalmi']['wikidata']
    archive['publisherWikidata'] = ENTITIES['banhalmi-organization']['wikidata']
    archive['affiliationsWikidata'] = [ENTITIES[k]['wikidata'] for k in ('amcham-austria','vipach','rege-gallery')]
    archive['educationWikidata'] = [ENTITIES[k]['wikidata'] for k in ('dennis-gabor-university','new-york-institute-of-photography','focus-education')]
    archive['workLocationsWikidata'] = [ENTITIES['vienna']['wikidata'], ENTITIES['budapest']['wikidata']]
    archive['originEntity'] = {'name': 'MOL Project', 'wikidata': None, 'verificationStatus': 'No direct Wikidata item is linked from Q56391118; deliberately left unset.'}
    for record in archive.get('records', []):
        record['creatorWikidata'] = ENTITIES['norbert-banhalmi']['wikidata']
        record['publisherWikidata'] = ENTITIES['banhalmi-organization']['wikidata']
        slug = str(record.get('slug', '')).lower()
        entity_key = next((key for fragment, key in RECORD_ENTITY_MAP.items() if fragment == slug), None)
        if entity_key:
            record['sameAs'] = [ENTITIES[entity_key]['wikidata']]
            record['wikidataEntityKey'] = entity_key
        else:
            record.setdefault('sameAs', [])
        # A project is not identical with every person depicted in one photograph.
        # Person-level semantics belong to the specific artwork/press record.
        record.setdefault('about', [])
    archive_path.write_text(json.dumps(archive, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

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
    press_path.write_text(json.dumps(press, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

print(f'Wikidata alignment completed with {len(ENTITIES)} entities linked from Q56391118.')
