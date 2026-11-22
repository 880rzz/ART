"""Generate rights-only XMP for ART responsive photos from documented JSON-LD.

Never copy private EXIF, GPS, location or other metadata from originals.
"""
import json
import re
from pathlib import Path
from urllib.parse import urlparse
from xml.sax.saxutils import escape, quoteattr

IMAGE_SCRIPT = re.compile(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.I | re.S)


def homepage_gallery_rights(site_root: Path) -> dict[str, bytes]:
    html = (site_root / "index.html").read_text(encoding="utf-8")
    rights: dict[str, bytes] = {}

    def visit(node):
        if isinstance(node, list):
            for item in node:
                visit(item)
            return
        if not isinstance(node, dict):
            return
        types = node.get("@type") or []
        if isinstance(types, str):
            types = [types]
        image_url = node.get("contentUrl")
        if "ImageObject" in types and isinstance(image_url, str):
            relative = urlparse(image_url).path.removeprefix("/")
            if re.fullmatch(r"assets/img/best-of/best-of-(?:0[1-9]|1[0-5])\.webp", relative):
                licence = node.get("license")
                credit = node.get("creditText")
                notice = node.get("copyrightNotice")
                if not all(isinstance(v, str) and v.strip() for v in (licence, credit, notice)):
                    raise ValueError(f"Missing documented image rights for {relative}")
                if urlparse(licence).scheme != "https":
                    raise ValueError(f"Image licence target is not HTTPS: {relative}")
                if relative in rights:
                    raise ValueError(f"Duplicate image rights record: {relative}")
                xmp = (
                    '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
                    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
                    '<rdf:Description rdf:about="" '
                    'xmlns:dc="http://purl.org/dc/elements/1.1/" '
                    'xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" '
                    'xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" '
                    'xmpRights:WebStatement=' + quoteattr(licence) + ' '
                    'photoshop:Credit=' + quoteattr(credit) + '>'
                    '<dc:creator><rdf:Seq><rdf:li>' + escape(credit) + '</rdf:li></rdf:Seq></dc:creator>'
                    '<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">' + escape(notice) + '</rdf:li></rdf:Alt></dc:rights>'
                    '</rdf:Description></rdf:RDF></x:xmpmeta>'
                )
                rights[relative] = xmp.encode("utf-8")
        for key, child in node.items():
            if key != "@context":
                visit(child)

    for script in IMAGE_SCRIPT.finditer(html):
        try:
            visit(json.loads(script.group(1)))
        except json.JSONDecodeError:
            continue
    if len(rights) != 15:
        raise ValueError(f"Expected 15 documented featured gallery originals, found {len(rights)}")
    return rights
