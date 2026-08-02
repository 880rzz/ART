from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "tools/migrate-life-journey-cleanup.py"
text = path.read_text(encoding="utf-8")
text = text.replace(
    'description = record.get("publicationNote") or record.get("description") or ""',
    'description = (record.get("publicationNote") or "") if kind == "press" else ""',
)
text = text.replace(
    '    registry["recordCount"] = len(registry["records"]) if "recordCount" in registry else registry.get("recordCount")\n',
    '    if "recordCount" in registry:\n        registry["recordCount"] = len(registry["records"])\n',
)
text = text.replace(
    '    for route, _ in WORK_ROUTES.values():\n        text = re.sub(r"<url>.*?" + re.escape(route) + r".*?</url>\\s*", "", text, flags=re.S)\n',
    '    for route, _ in WORK_ROUTES.values():\n        text = "\\n".join(line for line in text.splitlines() if route not in line) + "\\n"\n',
)
path.write_text(text, encoding="utf-8")
Path(__file__).unlink(missing_ok=True)
print("Life journey migrator hardened.")
