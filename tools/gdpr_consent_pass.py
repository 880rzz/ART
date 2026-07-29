#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LABELS = {"en": "Cookie settings", "hu": "Sütibeállítások", "de": "Cookie-Einstellungen"}
changed = []

for path in ROOT.rglob("*.html"):
    if ".git" in path.parts or "data" in path.parts:
        continue
    html = path.read_text(encoding="utf-8")
    if "G-90C452LJKQ" not in html:
        continue
    original = html
    language = "hu" if "hu" in path.parts else "de" if "de-at" in path.parts else "en"
    control = (
        '<button type="button" class="consent-reset" '
        "onclick=\"localStorage.removeItem('bn-consent');location.reload()\">"
        f"{LABELS[language]}</button>"
    )
    if 'class="consent-reset"' not in html:
        fineprint = re.search(r'(<p class="fineprint">.*?)(</p>)', html, re.S)
        if fineprint:
            html = html[:fineprint.start()] + fineprint.group(1) + "<br>" + control + fineprint.group(2) + html[fineprint.end():]
        else:
            html = html.replace("</footer>", control + "</footer>", 1)
    if html != original:
        path.write_text(html, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))

print(f"Added reversible consent controls to {len(changed)} analytics-enabled pages.")
