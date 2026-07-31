#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "data" / "wikipedia-source-inventory.json"
REGISTRY = ROOT / "wikipedia-source-registry.json"
errors = []

if not INVENTORY.exists():
    errors.append("Wikipedia source inventory is missing")
if not REGISTRY.exists():
    errors.append("Generated Wikipedia source registry is missing")

if not errors:
    source = json.loads(INVENTORY.read_text(encoding="utf-8"))
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    expected = set(source.get("sources") or [])
    actual_records = registry.get("sources") or []
    actual = {item.get("url") for item in actual_records}
    if len(expected) < 70:
        errors.append(f"Wikipedia source inventory is unexpectedly small: {len(expected)}")
    if registry.get("sourceCount") != len(actual_records):
        errors.append("Wikipedia registry sourceCount mismatch")
    missing = sorted(expected - actual)
    if missing:
        errors.append(f"Wikipedia registry omits {len(missing)} valid sources")
    if len(actual) != len(actual_records):
        errors.append("Wikipedia registry contains duplicate URLs")
    exclusions = source.get("excludedSources") or []
    if len(exclusions) != 6 or any(not item.get("reason") for item in exclusions):
        errors.append("Malformed and superseded Wikipedia URLs are not fully documented")

    for relative in ("press.html", "hu/press.html", "de-at/press.html"):
        html = (ROOT / relative).read_text(encoding="utf-8")
        for old in ("https://mandiner.hu/", "https://mindennapkonyv.hu/"):
            if f'href="{old}"' in html:
                errors.append(f"{relative}: publisher homepage remains instead of exact article URL")
        for video_id in ("AfK29ELPWBY", "rkSlrX6kEyg", "Q9vXitVpo7Y", "zCHkRlv-ZB0", "nyKyRWrtn7Q", "ch66zZp4--w", "npJ6YeYxQ64", "ZzZj0ompifI"):
            if f"watch?v={video_id}" not in html:
                errors.append(f"{relative}: missing Wikipedia-listed video {video_id}")
        if "/wikipedia-source-registry.json" not in html:
            errors.append(f"{relative}: complete source inventory is not discoverable")

if errors:
    print("WIKIPEDIA SOURCE COVERAGE AUDIT FAILED")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("WIKIPEDIA SOURCE COVERAGE AUDIT PASSED")
