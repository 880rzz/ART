#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
budapest_map = "L%C3%A1gym%C3%A1nyosi%20u.%2015"
vienna_map = "Schwedenplatz%202"

for relative in ("index.html", "hu/index.html", "de-at/index.html"):
    html = (ROOT / relative).read_text(encoding="utf-8")
    if budapest_map not in html or vienna_map not in html:
        errors.append(f"{relative}: the two separate studio map links are not both visible")
    blocks = [json.loads(raw) for raw in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)]
    graph = [node for block in blocks for node in (block.get("@graph") or []) if isinstance(node, dict)]
    studios = {node.get("@id"): node for node in graph if str(node.get("@id", "")).startswith("https://www.banhalmi.art/#studio-")}
    if set(studios) != {"https://www.banhalmi.art/#studio-budapest", "https://www.banhalmi.art/#studio-vienna"}:
        errors.append(f"{relative}: studio Place entities are incomplete")
    for studio in studios.values():
        if studio.get("@type") != "Place" or not studio.get("address") or not studio.get("geo") or not studio.get("url"):
            errors.append(f"{relative}: incomplete GEO record for {studio.get('@id')}")

analytics_pages = []
for path in ROOT.rglob("*.html"):
    if ".git" in path.parts or "data" in path.parts:
        continue
    html = path.read_text(encoding="utf-8")
    if "G-YLEMCP6YQ8" in html:
        errors.append(f"{path.relative_to(ROOT)}: obsolete analytics property remains")
    if "G-90C452LJKQ" not in html:
        continue
    analytics_pages.append(path)
    relative = path.relative_to(ROOT)
    for token in (
        "analytics_storage':'denied", "180*24*60*60*1000",
        "JSON.stringify({value:ok?'granted':'denied',at:Date.now()})",
        "allow_google_signals':false", "allow_ad_personalization_signals':false",
        'class="consent-reset"', "localStorage.removeItem('bn-consent');location.reload()",
    ):
        if token not in html:
            errors.append(f"{relative}: GDPR/Consent Mode control missing {token}")
    if html.find("googletagmanager.com/gtag/js") < html.find("if(c==='granted')"):
        errors.append(f"{relative}: analytics loader is not gated behind consent")
    if not re.search(r'href="https://www\.norbertbanhalmi\.com/(?:hu/|de-at/)?(?:privacy-policy|privacy|adatvedelem|datenschutz)/?"', html):
        errors.append(f"{relative}: privacy policy link is missing")
if len(analytics_pages) < 80:
    errors.append(f"analytics/consent coverage is unexpectedly low: {len(analytics_pages)} pages")

llms = (ROOT / "llms.txt").read_text(encoding="utf-8")
ai = (ROOT / "ai.txt").read_text(encoding="utf-8")
for name in (
    "master-source-database.json", "wikipedia-source-registry.json",
    "wikidata-entity-registry.json", "wikidata-source-registry.json",
    "archive-record-registry.json", "period-evidence-backbone.json",
    "press-source-registry.json",
):
    if not (ROOT / name).exists():
        errors.append(f"machine-readable index is missing: {name}")
    if name not in llms and name not in ai:
        errors.append(f"LLM discovery files omit {name}")

for name, text in (("llms.txt", llms), ("ai.txt", ai)):
    for token in ("MOL Y2K", "IT specialist", "1.3-megapixel", "https://blog.banhalmi.art/"):
        if token not in text:
            errors.append(f"{name}: corrected origin/ecosystem interpretation omits {token}")
    if re.search(r"corporate-beginnings|early corporate assignment|commissioned photography assignment", text, re.I):
        errors.append(f"{name}: obsolete corporate-assignment framing remains")
if "Wikidata is an identity layer" not in ai:
    errors.append("ai.txt: Wikidata identity-layer interpretation is incomplete")
if "personal beginnings are labelled as artist recollection" not in llms:
    errors.append("llms.txt: artist-recollection evidence policy is incomplete")

if errors:
    print("GEO / GDPR / LLM AUDIT FAILED")
    for error in errors:
        print("-", error)
    sys.exit(1)
print(f"GEO / GDPR / LLM AUDIT PASSED across {len(analytics_pages)} consent-controlled pages.")
