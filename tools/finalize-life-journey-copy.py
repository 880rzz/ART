from pathlib import Path
import re

# Final self-removing editorial pass for the six canonical life-journey views.
ROOT = Path(__file__).resolve().parents[1]
SELF = Path(__file__).resolve()
PAGES = [
    "index.html",
    "hu/index.html",
    "de-at/index.html",
    "curators.html",
    "hu/curators.html",
    "de-at/curators.html",
]

card_pattern = re.compile(
    r'(<li><a\b[^>]*><strong>)([^<]+)(</strong><span>)([^<]+)(</span></a></li>)'
)

changed = []
for relative in PAGES:
    path = ROOT / relative
    html = path.read_text(encoding="utf-8")
    original = html

    # A title that is already entity-encoded must not be encoded a second time.
    html = html.replace("&amp;amp;", "&amp;")
    html = html.replace("&amp;quot;", "&quot;")
    html = html.replace("&amp;#", "&#")

    # Compact journey cards show the title once. Keep only publisher / format / year
    # in the secondary line when the source registry repeated the title verbatim.
    def clean_card(match: re.Match[str]) -> str:
        before, title, between, meta, after = match.groups()
        prefix = title + " · "
        if meta.startswith(prefix):
            meta = meta[len(prefix):]
        return before + title + between + meta + after

    html = card_pattern.sub(clean_card, html)
    if html != original:
        path.write_text(html, encoding="utf-8")
        changed.append(relative)

SELF.unlink(missing_ok=True)
print(f"Polished life-journey copy on {len(changed)} pages.")
