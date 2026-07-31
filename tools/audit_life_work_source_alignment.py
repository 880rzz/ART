#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
DOSSIER = ROOT / "life-work-source-dossier.json"
errors = []

required_sources = {
    "https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert",
    "https://www.wikidata.org/wiki/Q56391118",
    "https://www.banhalmi.art/hu/",
    "https://www.banhalmi.art/archive-source-map.json",
}
required_books = {"Ébredés – az Új kezdet!", "Szösszenetek", "A Nő világa"}
required_exhibitions = {
    "Az igazi Nők", "Azok a régi kacér idők", "Magyar Nők New Yorkban",
    "A Nő 50 árnyalata", "Apa lettem", "Mérföldkövek ’56",
    "Ébredés – az Új kezdet!", "Pest megye kortárs művészei",
    "A Nő világa", "Balerina Project | Strut Your Stuff", "The Frame",
    "Te is Lehetsz", "The Men's Dream / The Genesis of Beauty",
    "A Valóság Hamis Arcai", "Touch", "Én a Nő", "Femme Fatale",
    "Más-képp-más", "EUFÓRIA – a Jelenlét anatómiája"
}

if not DOSSIER.exists():
    errors.append("life-work-source-dossier.json is missing")
else:
    data = json.loads(DOSSIER.read_text(encoding="utf-8"))
    sources = {item.get("url") for item in data.get("sourceHierarchy", [])}
    missing_sources = required_sources - sources
    if missing_sources:
        errors.append(f"missing canonical sources: {sorted(missing_sources)}")

    entities = data.get("canonicalInternalEntities", {})
    if len(entities) < 40:
        errors.append(f"entity coverage unexpectedly small: {len(entities)}")

    ids = []
    for key, item in entities.items():
        entity_id = item.get("id")
        if not entity_id:
            errors.append(f"{key}: missing stable canonical id")
        else:
            ids.append(entity_id)
        if item.get("identityStatus") not in {"wikidata-linked", "canonical-internal"}:
            errors.append(f"{key}: invalid identityStatus")
        if item.get("identityStatus") == "wikidata-linked" and not str(item.get("sameAs", "")).startswith("https://www.wikidata.org/wiki/Q"):
            errors.append(f"{key}: wikidata-linked entity lacks valid sameAs")
    if len(ids) != len(set(ids)):
        errors.append("duplicate canonical entity ids")

    book_names = {item.get("name") for item in entities.values() if item.get("type") == "Book"}
    missing_books = required_books - book_names
    if missing_books:
        errors.append(f"missing books from life-work coverage: {sorted(missing_books)}")

    exhibition_names = {item.get("name") for item in entities.values() if item.get("type") == "ExhibitionEvent"}
    missing_exhibitions = required_exhibitions - exhibition_names
    if missing_exhibitions:
        errors.append(f"missing exhibitions from life-work coverage: {sorted(missing_exhibitions)}")

archive_path = ROOT / "archive-record-registry.json"
if not archive_path.exists():
    errors.append("archive-record-registry.json is missing")
else:
    archive = json.loads(archive_path.read_text(encoding="utf-8"))
    if archive.get("lifeWorkSourceDossier") != "https://www.banhalmi.art/life-work-source-dossier.json":
        errors.append("archive registry is not linked to the life-work source dossier")
    policy = str(archive.get("identityPolicy", ""))
    if "stable canonical internal @id" not in policy:
        errors.append("archive registry lacks the no-Wikidata canonical identity policy")

if errors:
    print("LIFE-WORK SOURCE ALIGNMENT AUDIT FAILED")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("LIFE-WORK SOURCE ALIGNMENT AUDIT PASSED")
