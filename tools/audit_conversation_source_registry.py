#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "conversation-source-registry.json"
errors = []
required = {
    "https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert",
    "https://www.wikidata.org/wiki/Q56391118",
    "https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=Norbert%20Banhalmi",
    "https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg",
    "https://www.banhalmi.art/post/euforia",
    "https://www.youtube.com/@norbert.banhalmi/playlists",
    "https://www.norbertbanhalmi.com/",
    "https://www.banhalmi.art/",
    "https://norbertbanhalmi.wixsite.com/banhalminorbert/sitemap.xml",
    "https://amcham.at/members-list/",
    "https://www.mfvsz.com/hu/tagsag/",
}

if not REGISTRY.exists():
    errors.append("conversation-source-registry.json is missing")
else:
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    sources = data.get("sources", [])
    urls = [item.get("url") for item in sources]
    if len(urls) != len(set(urls)):
        errors.append("duplicate source URLs")
    missing = required - set(urls)
    if missing:
        errors.append(f"missing owner-shared sources: {sorted(missing)}")
    for item in sources:
        if not item.get("id") or not item.get("url") or not item.get("type"):
            errors.append(f"incomplete source record: {item}")
        if not item.get("supports"):
            errors.append(f"{item.get('id')}: no supported archive entities declared")
        if item.get("provenance") not in {
            "owner-shared", "repository-preserved", "owner-shared-and-repository-preserved"
        }:
            errors.append(f"{item.get('id')}: invalid provenance")

for filename in ("life-work-source-dossier.json", "archive-record-registry.json", "press-source-registry.json"):
    path = ROOT / filename
    if not path.exists():
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("ownerSharedSourceRegistry") != "https://www.banhalmi.art/conversation-source-registry.json":
        errors.append(f"{filename}: missing owner-shared source registry link")

if errors:
    print("CONVERSATION SOURCE REGISTRY AUDIT FAILED")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("CONVERSATION SOURCE REGISTRY AUDIT PASSED")
