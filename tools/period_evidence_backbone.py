#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

# One oeuvre, one self-initiated point of departure and four later research
# periods anchored by publicly inspectable project evidence.
PERIODS = [
    {
        'id': 'period-I',
        'number': 'I',
        'status': 'self-initiated-origin',
        'name': {'hu': 'Vállalati kezdet – a jelenlét kutatásának kiindulópontja', 'en': 'Corporate beginnings – the point of departure for the investigation of presence', 'de': 'Unternehmerischer Anfang – der Ausgangspunkt der Untersuchung von Präsenz'},
        'anchorProject': {
            'id': 'https://www.banhalmi.art/#project-corporate-origin',
            'name': 'Early corporate assignment',
            'recordUrl': None,
            'wikidata': None,
        },
        'evidenceRequirement': 'not-applicable-self-initiated-material',
        'curatorialNote': {
            'hu': 'A korai vállalati megbízás saját kezdeményezésű, önállóan létrehozott anyag volt. A megbízó pontos megnevezése publikálás előtti tényellenőrzésre vár; addig nem állítunk hozzá külső bizonyítékot vagy céget. Az életmű gondolati kiindulópontjaként őrizzük.',
            'en': 'The early corporate assignment was self-initiated and independently produced. The exact client is pending fact-check before publication; no external evidence or named company is claimed for it in the meantime. It is preserved as the conceptual point of departure of the oeuvre.',
            'de': 'Der frühe Unternehmensauftrag war selbst initiiert und eigenständig realisiert. Die genaue Bezeichnung des Auftraggebers wartet vor der Veröffentlichung auf eine Tatsachenprüfung; bis dahin wird kein externer Nachweis oder Firmenname behauptet. Er bleibt als konzeptueller Ausgangspunkt des Œuvres erhalten.'
        },
        'evidence': []
    },
    {
        'id': 'period-II',
        'number': 'II',
        'status': 'evidence-backed-period',
        'name': {'hu': 'Emberi történetek és történelmi emlékezet', 'en': 'Human stories and historical memory', 'de': 'Menschliche Geschichten und historisches Gedächtnis'},
        'anchorProject': {
            'id': 'https://www.banhalmi.art/hu/exhibitions/merfoldkovek1956.html#record',
            'name': 'Mérföldkövek ’56',
            'recordUrl': 'https://www.banhalmi.art/hu/exhibitions/merfoldkovek1956.html',
            'wikidata': 'https://www.wikidata.org/wiki/Q138454278',
        },
        'evidence': [
            {
                'type': 'press',
                'url': 'https://www.magyarforradalom1956.hu/v/merfoldkovek--56-os-portrekepekbol-rendeztek-kiallitast-new-yorkban/',
                'role': 'Direct public documentation of the New York exhibition.',
                'quality': 'exact-independent-source'
            }
        ]
    },
    {
        'id': 'period-III',
        'number': 'III',
        'status': 'evidence-backed-period',
        'name': {'hu': 'A test mint emlékezet', 'en': 'The body as memory', 'de': 'Der Körper als Erinnerung'},
        'anchorProject': {
            'id': 'https://www.banhalmi.art/hu/exhibitions/ebredes.html#record',
            'name': 'Ébredés – az Új kezdet!',
            'recordUrl': 'https://www.banhalmi.art/hu/exhibitions/ebredes.html',
            'wikidata': 'https://www.wikidata.org/wiki/Q138454309',
        },
        'evidence': [
            {
                'type': 'press',
                'url': 'https://she.life.hu/nofilter/2017/03/banhalmi-norbert-profi-fotos-interju-modell-belso-szepseg-szepnek-latni-magad',
                'role': 'Interview documenting the project’s human and psychological context.',
                'quality': 'exact-independent-source'
            },
            {
                'type': 'institutional-press',
                'url': 'https://www.veol.hu/vezeto-hirek/2018/03/csolnoky-ferenc-korhaz-onkologiai-centrum-rak-kiallitas',
                'role': 'Documentation of the permanent oncology-centre exhibition.',
                'quality': 'exact-independent-source'
            },
            {
                'type': 'youtube-video',
                'url': 'https://youtu.be/XI5WavAwFOY',
                'role': 'Moving-image documentation of the exhibition and its public presentation.',
                'quality': 'direct-video-record'
            }
        ]
    },
    {
        'id': 'period-IV',
        'number': 'IV',
        'status': 'evidence-backed-period',
        'name': {'hu': 'Intézmények és közösségek', 'en': 'Institutions and communities', 'de': 'Institutionen und Gemeinschaften'},
        'anchorProject': {
            'id': 'https://www.banhalmi.art/hu/exhibitions/teislehetsz.html#record',
            'name': 'Te is Lehetsz',
            'recordUrl': 'https://www.banhalmi.art/hu/exhibitions/teislehetsz.html',
            'wikidata': None,
        },
        'evidence': [
            {
                'type': 'canonical-project-page',
                'url': 'https://www.banhalmi.art/hu/exhibitions/teislehetsz.html',
                'role': 'Canonical archive record for the community-centred project.',
                'quality': 'primary-archive-record'
            },
            {
                'type': 'legacy-project-index',
                'url': 'https://norbertbanhalmi.wixsite.com/banhalminorbert/sitemap.xml',
                'role': 'Historical source trail connecting the current record with the legacy archive.',
                'quality': 'primary-archive-index'
            }
        ]
    },
    {
        'id': 'period-V',
        'number': 'V',
        'status': 'evidence-backed-period',
        'name': {'hu': 'Nyilvános és executive jelenlét', 'en': 'Public and executive presence', 'de': 'Öffentliche und Executive-Präsenz'},
        'anchorProject': {
            'id': 'https://www.banhalmi.art/hu/exhibitions/euforia.html#record',
            'name': 'EUFÓRIA – The Anatomy of Presence',
            'recordUrl': 'https://www.banhalmi.art/hu/exhibitions/euforia.html',
            'wikidata': 'https://www.wikidata.org/wiki/Q138717398',
        },
        'evidence': [
            {
                'type': 'wikimedia-commons-record',
                'url': 'https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg',
                'role': 'Public visual record of a historically significant portrait within the project.',
                'quality': 'independent-public-record'
            },
            {
                'type': 'legacy-project-essay',
                'url': 'https://www.banhalmi.art/post/euforia',
                'role': 'Primary project narrative and contextual documentation.',
                'quality': 'primary-project-source'
            }
        ]
    }
]

backbone = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWorkSeries',
    '@id': 'https://www.banhalmi.art/#presence-research-oeuvre',
    'name': 'The investigation of presence — documented oeuvre line',
    'creator': {'@id': 'https://www.banhalmi.art/norbert-banhalmi#person'},
    'thesis': 'One oeuvre: a self-initiated point of departure followed by four publicly documented research periods.',
    'rule': 'The corporate beginnings period is preserved as a self-initiated origin without claimed external evidence. Every subsequent period is anchored by a named project and at least one inspectable press, video, gallery, institutional or project source.',
    'periods': PERIODS,
    'periodCount': len(PERIODS),
    'evidenceBackedPeriodCount': sum(1 for item in PERIODS if item.get('status') == 'evidence-backed-period'),
}

(ROOT / 'period-evidence-backbone.json').write_text(
    json.dumps(backbone, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
)

archive_path = ROOT / 'archive-record-registry.json'
if archive_path.exists():
    archive = json.loads(archive_path.read_text(encoding='utf-8'))
    archive['oeuvreEvidenceBackbone'] = 'https://www.banhalmi.art/period-evidence-backbone.json'
    archive['oeuvreThesis'] = backbone['thesis']
    archive['researchPeriods'] = [
        {
            'id': item['id'],
            'number': item['number'],
            'status': item['status'],
            'anchorProject': item['anchorProject']['id'],
            'evidenceCount': len(item['evidence'])
        }
        for item in PERIODS
    ]
    archive_path.write_text(json.dumps(archive, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Generated oeuvre line with one self-initiated origin and four evidence-backed periods.')