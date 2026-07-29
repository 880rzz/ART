#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

# Sources explicitly shared by the archive owner in the working conversations or
# already preserved in the repository source map. A source may support one or
# more archive records without requiring its own Wikidata item.
SOURCES = [
    {
        "id": "source-wikipedia-person",
        "url": "https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert",
        "type": "independent-biographical-source",
        "supports": ["person", "chronology", "books", "exhibitions", "memberships", "education"],
        "provenance": "owner-shared-and-repository-preserved"
    },
    {
        "id": "source-wikidata-person",
        "url": "https://www.wikidata.org/wiki/Q56391118",
        "type": "linked-open-data-source",
        "supports": ["person", "related-entities", "identifiers"],
        "provenance": "owner-shared-and-repository-preserved"
    },
    {
        "id": "source-commons-category",
        "url": "https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=Norbert%20Banhalmi",
        "type": "visual-documentation-collection",
        "supports": ["person", "works", "visual-evidence"],
        "provenance": "repository-preserved"
    },
    {
        "id": "source-commons-peter-magyar-portrait",
        "url": "https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg",
        "type": "canonical-image-record",
        "supports": ["euforia", "peter-magyar-portrait", "public-presence"],
        "provenance": "owner-shared"
    },
    {
        "id": "source-euforia-essay",
        "url": "https://www.banhalmi.art/post/euforia",
        "type": "primary-project-essay",
        "supports": ["euforia", "peter-magyar-portrait", "presence-research"],
        "language": "hu",
        "provenance": "owner-shared"
    },
    {
        "id": "source-youtube-playlists",
        "url": "https://www.youtube.com/@norbert.banhalmi/playlists",
        "type": "moving-image-archive",
        "supports": ["interviews", "reports", "project-evidence"],
        "provenance": "repository-preserved"
    },
    {
        "id": "source-current-business-site",
        "url": "https://www.norbertbanhalmi.com/",
        "type": "official-current-professional-site",
        "supports": ["person", "current-practice", "studios", "visual-strategy"],
        "provenance": "owner-shared"
    },
    {
        "id": "source-current-archive",
        "url": "https://www.banhalmi.art/",
        "type": "official-canonical-archive",
        "supports": ["life-work", "records", "chronology", "projects"],
        "provenance": "owner-shared"
    },
    {
        "id": "source-legacy-wix-sitemap",
        "url": "https://norbertbanhalmi.wixsite.com/banhalminorbert/sitemap.xml",
        "type": "legacy-site-index",
        "supports": ["migration-provenance", "historic-pages", "redirect-map"],
        "provenance": "repository-preserved"
    },
    {
        "id": "source-amcham-members",
        "url": "https://amcham.at/members-list/",
        "type": "institutional-membership-source",
        "supports": ["banhalmi-organization", "amcham-austria", "membership"],
        "provenance": "owner-shared"
    },
    {
        "id": "source-mfvsz-membership",
        "url": "https://www.mfvsz.com/hu/tagsag/",
        "type": "institutional-membership-source",
        "supports": ["person", "membership", "photographic-art"],
        "provenance": "owner-shared"
    },
    {
        "id": "source-publicartists",
        "url": "https://publicartists.online",
        "type": "venue-and-exhibition-source",
        "supports": ["CITYgalleryVIENNA", "exhibitions", "Vienna"],
        "provenance": "owner-shared"
    }
]

registry = {
    "name": "BANHALMI owner-shared and canonical source registry",
    "person": "https://www.banhalmi.art/norbert-banhalmi#person",
    "policy": "A source does not need a Wikidata item. Stable URLs with explicit provenance may establish and support internal archive entities.",
    "sources": SOURCES,
    "sourceCount": len(SOURCES)
}

(ROOT / "conversation-source-registry.json").write_text(
    json.dumps(registry, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8"
)

for filename in ("life-work-source-dossier.json", "archive-record-registry.json", "press-source-registry.json"):
    path = ROOT / filename
    if not path.exists():
        continue
    data = json.loads(path.read_text(encoding="utf-8"))
    data["ownerSharedSourceRegistry"] = "https://www.banhalmi.art/conversation-source-registry.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print(f"Conversation source registry generated with {len(SOURCES)} sources.")
