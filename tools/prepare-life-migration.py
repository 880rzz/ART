from pathlib import Path

# One-time preflight: harden the migrator, verify every patch, then remove this helper.
# Books remain intact, HU keeps its legacy anchor, sitemap fragments are excluded,
# and all three files consumed by live audits remain in data/archive.
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
        '    for route, _ in WORK_ROUTES.values():\n        text = "\\n".join(line for line in text.splitlines() if route not in line) + "\\n"\n    text = "\\n".join(line for line in text.splitlines() if "#peter-magyar-portrait" not in line) + "\\n"\n',
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
        '    hidden_anchor = \'<span id="presence-periods" class="archive-anchor" aria-hidden="true"></span>\' if (not dossier and lang == "hu") else ""\n',
        'language-safe presence-periods anchor',
    ),
    (
        '        "data/archive/domain-ecosystem.hu.json",\n',
        '',
        'preserve live domain ecosystem source',
    ),
    (
        'Only two active reference files remain in this directory.',
        'Three active reference files remain in this directory.',
        'active archive source count',
    ),
    (
        '| `home-copy.json` | `tests/audit-home-copy.mjs` |\\n| `oeuvre-periods.json` | `tools/audit_record_depth.py` |',
        '| `home-copy.json` | `tests/audit-home-copy.mjs` |\\n| `oeuvre-periods.json` | `tools/audit_record_depth.py` |\\n| `domain-ecosystem.hu.json` | `tests/audit-domain-ecosystem.mjs` |',
        'active archive source table',
    ),
]

for old, new, label in patches:
    if old in text:
        text = text.replace(old, new)
    elif new not in text:
        raise RuntimeError(f"Preflight patch not found: {label}")

# Keep the cleanup audit synchronized with the dependency map.
audit_path = root / "tests/audit-life-journey.mjs"
audit = audit_path.read_text(encoding="utf-8")
audit = audit.replace("  'contact-footer.hu.json', 'domain-ecosystem.hu.json', 'family-origins.hu.json',\n", "  'contact-footer.hu.json', 'family-origins.hu.json',\n")
audit = audit.replace(
    "for (const required of ['README.md', 'home-copy.json', 'oeuvre-periods.json']) {",
    "for (const required of ['README.md', 'home-copy.json', 'oeuvre-periods.json', 'domain-ecosystem.hu.json']) {",
)
if "domain-ecosystem.hu.json'])" not in audit:
    raise RuntimeError('Life-journey audit does not preserve the live domain ecosystem source.')
audit_path.write_text(audit, encoding="utf-8")

if 'journey["\\\'][\\s\\S]*?(?=<section\\s+id=["\\\']exhibitions' in text:
    raise RuntimeError('Homepage journey still consumes the exhibitions boundary.')
if 'conceptual = conceptual_anchors.get(stage["id"])' in text:
    raise RuntimeError('Generated duplicate period anchors remain.')
if 'if (not dossier and lang == "hu") else ""' not in text:
    raise RuntimeError('HU-only compatibility anchor policy is missing.')
if '"#peter-magyar-portrait" not in line' not in text:
    raise RuntimeError('Fragment-only sitemap filtering is missing.')
if '"data/archive/domain-ecosystem.hu.json"' in text:
    raise RuntimeError('Live domain ecosystem source is still scheduled for deletion.')

path.write_text(text, encoding="utf-8")
Path(__file__).unlink(missing_ok=True)
print("Life journey migrator hardened; every audit-consumed archive source is preserved.")
