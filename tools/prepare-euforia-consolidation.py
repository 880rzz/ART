from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "tools/migrate-life-journey-cleanup.py"
text = path.read_text(encoding="utf-8")
old = '        html = euforia_path.read_text(encoding="utf-8")\n        html = re.sub(\n'
new = '''        html = euforia_path.read_text(encoding="utf-8")
        for legacy_href in (
            "../works/magyar-peter-portre-2026.html",
            "../works/peter-magyar-portrait-2026.html",
            "/hu/works/magyar-peter-portre-2026.html",
            "/works/peter-magyar-portrait-2026.html",
            "/de-at/works/peter-magyar-portraet-2026.html",
        ):
            html = html.replace(f'href="{legacy_href}"', 'href="#peter-magyar-portrait"')
            html = html.replace(f"href='{legacy_href}'", "href='#peter-magyar-portrait'")
        html = re.sub(
'''
if old in text:
    text = text.replace(old, new)
elif new not in text:
    raise RuntimeError("EUFÓRIA legacy-link patch point was not found.")
path.write_text(text, encoding="utf-8")
Path(__file__).unlink(missing_ok=True)
print("Every legacy Péter Magyar artwork link will resolve inside EUFÓRIA.")
