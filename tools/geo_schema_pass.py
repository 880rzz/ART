#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PERSON_ID = "https://www.banhalmi.art/norbert-banhalmi#person"
ORG_ID = "https://www.norbertbanhalmi.com/#organization"
STUDIOS = [
    {
        "@type": "Place", "@id": "https://www.banhalmi.art/#studio-budapest",
        "name": "BANHALMI Budapest studio",
        "url": "https://www.google.com/maps/search/?api=1&query=L%C3%A1gym%C3%A1nyosi%20u.%2015%2C%201111%20Budapest%2C%20Hungary",
        "address": {"@type": "PostalAddress", "streetAddress": "Lágymányosi u. 15.", "postalCode": "1111", "addressLocality": "Budapest", "addressCountry": "HU"},
        "geo": {"@type": "GeoCoordinates", "latitude": 47.4766, "longitude": 19.0534},
    },
    {
        "@type": "Place", "@id": "https://www.banhalmi.art/#studio-vienna",
        "name": "BANHALMI Vienna studio",
        "url": "https://www.google.com/maps/search/?api=1&query=Schwedenplatz%202%2C%201010%20Vienna%2C%20Austria",
        "address": {"@type": "PostalAddress", "streetAddress": "Schwedenplatz 2.", "postalCode": "1010", "addressLocality": "Vienna", "addressCountry": "AT"},
        "geo": {"@type": "GeoCoordinates", "latitude": 48.2112, "longitude": 16.3772},
    },
]

changed = []
for relative in ("index.html", "hu/index.html", "de-at/index.html"):
    path = ROOT / relative
    html = path.read_text(encoding="utf-8")
    original = html

    def align(match):
        data = json.loads(match.group(1))
        graph = data.get("@graph") if isinstance(data, dict) else None
        if not isinstance(graph, list):
            return match.group(0)
        person = next((node for node in graph if isinstance(node, dict) and node.get("@id") == PERSON_ID), None)
        organization = next((node for node in graph if isinstance(node, dict) and node.get("@id") == ORG_ID), None)
        website = next((node for node in graph if isinstance(node, dict) and node.get("@id") == "https://www.banhalmi.art/#website"), None)
        if not person or not organization:
            return match.group(0)
        person["workLocation"] = [{"@id": studio["@id"]} for studio in STUDIOS]
        person["homeLocation"] = {"@id": "https://www.banhalmi.art/#studio-vienna"}
        organization["location"] = [{"@id": studio["@id"]} for studio in STUDIOS]
        if website:
            website["spatialCoverage"] = [{"@id": studio["@id"]} for studio in STUDIOS]
        studio_ids = {studio["@id"] for studio in STUDIOS}
        graph[:] = [node for node in graph if not (isinstance(node, dict) and node.get("@id") in studio_ids)]
        graph.extend(STUDIOS)
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>"

    html = re.sub(
        r'<script type="application/ld\+json">(\{"@context":"https://schema\.org","@graph":.*?\})</script>',
        align, html, count=1, flags=re.S,
    )
    if html != original:
        path.write_text(html, encoding="utf-8")
        changed.append(relative)

print(f"Aligned two distinct studio Place entities in {len(changed)} homepages.")
