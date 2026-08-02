from pathlib import Path

# One-time preflight: harden the migrator, verify every patch, then remove this helper.
root = Path(__file__).resolve().parents[1]
path = root / "tools/migrate-life-journey-cleanup.py"
text = path.read_text(encoding="utf-8")

patches = [
    (
        'description = record.get("publicationNote") or record.get("description") or ""',
        'description = (record.get("publicationNote") or "") if kind == "press" else ""',
        'record-card metadata policy',
    ),
    (
        '    registry["recordCount"] = len(registry["records"]) if "recordCount" in registry else registry.get("recordCount")\n',
        '    if "recordCount" in registry:\n        registry["recordCount"] = len(registry["records"])\n',
        'registry count update',
    ),
    (
        '    for route, _ in WORK_ROUTES.values():\n        text = re.sub(r"<url>.*?" + re.escape(route) + r".*?</url>\\s*", "", text, flags=re.S)\n',
        '    for route, _ in WORK_ROUTES.values():\n        text = "\\n".join(line for line in text.splitlines() if route not in line) + "\\n"\n',
        'single-line sitemap cleanup',
    ),
    (
        '        pattern = r\'<section\\s+id=["\\\']journey["\\\'][\\s\\S]*?(?=<section\\s+id=["\\\']exhibitions["\\\'])\'\n',
        '        pattern = r\'<section\\s+id=["\\\']journey["\\\'][\\s\\S]*?(?=<section\\s+id=["\\\']books["\\\'])\'\n',
        'homepage journey boundary',
    ),
    (
        '        conceptual = conceptual_anchors.get(stage["id"])\n',
        '        conceptual = None\n',
        'duplicate conceptual anchors',
    ),
    (
        '    hidden_anchor = "" if dossier else \'<span id="presence-periods" class="archive-anchor" aria-hidden="true"></span>\'\n',
        '    hidden_anchor = ""\n',
        'duplicate presence-periods anchor',
    ),
]

for old, new, label in patches:
    if old in text:
        text = text.replace(old, new)
    elif new not in text:
        raise RuntimeError(f"Preflight patch not found: {label}")

if 'journey["\\\'][\\s\\S]*?(?=<section\\s+id=["\\\']exhibitions' in text:
    raise RuntimeError('Homepage journey still consumes the exhibitions boundary.')
if 'id="presence-periods" class="archive-anchor"' in text:
    raise RuntimeError('Generated duplicate presence-periods anchor remains.')
if 'conceptual = conceptual_anchors.get(stage["id"])' in text:
    raise RuntimeError('Generated duplicate period anchors remain.')

path.write_text(text, encoding="utf-8")
Path(__file__).unlink(missing_ok=True)
print("Life journey migrator hardened and replacement boundaries verified.")
