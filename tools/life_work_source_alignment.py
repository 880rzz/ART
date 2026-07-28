#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

SOURCE_DOSSIER = {
    "name": "BANHALMI canonical life-work source dossier",
    "thesis": "The investigation of presence",
    "person": "https://www.banhalmi.art/norbert-banhalmi#person",
    "sourceHierarchy": [
        {
            "id": "wikipedia-biography",
            "type": "independent-biographical-source",
            "url": "https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert",
            "role": "Independent chronology, exhibitions, books, education, memberships, curatorial and community activity."
        },
        {
            "id": "wikidata-person",
            "type": "linked-open-data-source",
            "url": "https://www.wikidata.org/wiki/Q56391118",
            "role": "Machine-readable identifiers and entity relationships."
        },
        {
            "id": "official-archive",
            "type": "primary-archive-source",
            "url": "https://www.banhalmi.art/hu/",
            "role": "First-person history, project context, chronology, visual archive and canonical records."
        },
        {
            "id": "historic-site-map",
            "type": "migration-provenance-source",
            "url": "https://www.banhalmi.art/archive-source-map.json",
            "role": "Historic Wix and legacy URL provenance mapped to current canonical records."
        }
    ],
    "canonicalInternalEntities": {},
    "coverage": {
        "books": [],
        "exhibitions": [],
        "curatorialProjects": [],
        "communityAndEducation": [],
        "memberships": [],
        "mediaAndPublications": []
    }
}


def add_entity(key, name, kind, source, wikidata=None, canonical=None, year=None, place=None):
    item = {
        "id": canonical or f"https://www.banhalmi.art/#entity-{key}",
        "name": name,
        "type": kind,
        "source": source,
        "identityStatus": "wikidata-linked" if wikidata else "canonical-internal"
    }
    if wikidata:
        item["sameAs"] = wikidata
    if year is not None:
        item["year"] = year
    if place:
        item["place"] = place
    SOURCE_DOSSIER["canonicalInternalEntities"][key] = item
    return item

books = [
    ("book-ebredes", "Ébredés – az Új kezdet!", 2017, "https://www.wikidata.org/wiki/Q138426842"),
    ("book-szosszenetek", "Szösszenetek", 2017, "https://www.wikidata.org/wiki/Q138667529"),
    ("book-anovilaga", "A Nő világa", 2018, "https://www.wikidata.org/wiki/Q138426876"),
]
for key, name, year, qid in books:
    item = add_entity(key, name, "Book", "wikipedia-biography", qid, f"https://www.banhalmi.art/hu/books/{key}.html#record", year)
    SOURCE_DOSSIER["coverage"]["books"].append(item["id"])

exhibitions = [
    ("az-igazi-nok", "Az igazi Nők", 2014, "Budapest", None),
    ("azok-a-regi-kacer-idok", "Azok a régi kacér idők", 2014, "Budapest", None),
    ("magyar-nok-new-yorkban", "Magyar Nők New Yorkban", 2014, "New York", "https://www.wikidata.org/wiki/Q138454296"),
    ("a-no-50-arnyalata", "A Nő 50 árnyalata", 2015, "Budapest", None),
    ("apa-lettem", "Apa lettem", 2016, "Budapest", "https://www.wikidata.org/wiki/Q138454436"),
    ("merfoldkovek-56", "Mérföldkövek ’56", 2016, "New York", "https://www.wikidata.org/wiki/Q138454278"),
    ("ebredes", "Ébredés – az Új kezdet!", 2017, "Budapest", "https://www.wikidata.org/wiki/Q138454309"),
    ("pest-megye-kortars-muveszei", "Pest megye kortárs művészei", 2018, "Budapest", None),
    ("a-no-vilaga", "A Nő világa", 2018, "Budapest", None),
    ("balerina-project-new-york", "Balerina Project | Strut Your Stuff", 2018, "New York", "https://www.wikidata.org/wiki/Q138454318"),
    ("the-frame", "The Frame", 2021, "Tihany", "https://www.wikidata.org/wiki/Q138454346"),
    ("te-is-lehetsz", "Te is Lehetsz", 2021, "Tihany", None),
    ("the-mens-dream", "The Men's Dream / The Genesis of Beauty", 2022, "New York", "https://www.wikidata.org/wiki/Q138454332"),
    ("a-valosag-hamis-arcai", "A Valóság Hamis Arcai", 2023, "Tihany", None),
    ("touch", "Touch", 2024, "Bécs / München", "https://www.wikidata.org/wiki/Q138454365"),
    ("en-a-no", "Én a Nő", 2024, "Bécs", None),
    ("femme-fatale", "Femme Fatale", 2025, "Bécs", None),
    ("mas-kepp-mas", "Más-képp-más", 2025, "Veszprém", "https://www.wikidata.org/wiki/Q138454422"),
    ("euforia", "EUFÓRIA – a Jelenlét anatómiája", 2026, "Budapest / Bécs", "https://www.wikidata.org/wiki/Q138717398"),
]
for key, name, year, place, qid in exhibitions:
    item = add_entity(key, name, "ExhibitionEvent", "wikipedia-biography", qid, f"https://www.banhalmi.art/hu/exhibitions/{key}.html#record", year, place)
    SOURCE_DOSSIER["coverage"]["exhibitions"].append(item["id"])

for key, name, kind in [
    ("rege-gallery", "Rege Galéria", "Organization"),
    ("vipach", "VIPACH | Vienna Photo Art & Creative Hub", "Organization"),
    ("bmi-fotoklub-wien", "BMI Fotóklub Wien", "Organization"),
    ("becsi-magyar-iskola-photo-program", "Bécsi Magyar Iskola fotós képzés", "EducationalOccupationalProgram"),
    ("be-smart-kids-club", "Be Smart Kids Club", "EducationalOccupationalProgram"),
    ("muveszet-elvitelre", "Művészet Elvitelre", "Project"),
    ("flogos-futam", "Flúgos Futam", "Project"),
]:
    item = add_entity(key, name, kind, "wikipedia-biography")
    target = "communityAndEducation" if "Program" in kind or "fotoklub" in key or key in {"vipach", "becsi-magyar-iskola-photo-program", "be-smart-kids-club"} else "curatorialProjects"
    SOURCE_DOSSIER["coverage"][target].append(item["id"])

memberships = [
    "OM SYSTEM ambassador",
    "Pannon Fényképészkör Egyesület honorary member",
    "WKO Wien",
    "Landesinnung der Berufsfotografen",
    "AmCham Austria",
    "Magyar Fotóművészek Világszövetsége"
]
for index, name in enumerate(memberships, 1):
    item = add_entity(f"membership-{index}", name, "OrganizationRole", "wikipedia-biography")
    SOURCE_DOSSIER["coverage"]["memberships"].append(item["id"])

for index, name in enumerate([
    "Tripont Problog articles",
    "MILC Club publication",
    "ORF Volksgruppen reports",
    "Rólunk.at interviews",
    "SHE interviews",
    "Mandiner feature",
    "M1, M5 and Petőfi TV interviews",
    "Jazzy Rádió interview"
], 1):
    item = add_entity(f"media-{index}", name, "MediaObject", "wikipedia-biography")
    SOURCE_DOSSIER["coverage"]["mediaAndPublications"].append(item["id"])

SOURCE_DOSSIER["entityCount"] = len(SOURCE_DOSSIER["canonicalInternalEntities"])
(ROOT / "life-work-source-dossier.json").write_text(
    json.dumps(SOURCE_DOSSIER, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)

archive_path = ROOT / "archive-record-registry.json"
if archive_path.exists():
    archive = json.loads(archive_path.read_text(encoding="utf-8"))
    archive["lifeWorkSourceDossier"] = "https://www.banhalmi.art/life-work-source-dossier.json"
    archive["sourceHierarchy"] = [source["url"] for source in SOURCE_DOSSIER["sourceHierarchy"]]
    archive["identityPolicy"] = "Use Wikidata when a verified item exists; otherwise preserve the entity with a stable canonical internal @id and explicit source provenance."
    archive_path.write_text(json.dumps(archive, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print(f"Life-work source dossier generated with {SOURCE_DOSSIER['entityCount']} canonical entities.")
