#!/usr/bin/env python3
from __future__ import annotations
from datetime import date
from pathlib import Path
from urllib.parse import urlparse
import json
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "master-source-database.json"
REGISTRIES = (("conversation-source-registry.json","owner-shared-registry"),("press-source-registry.json","press-registry"))
PERIOD_FILE = ROOT / "period-evidence-backbone.json"
def load_json(path):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
def normalise_url(value):
    value=value.strip()
    return "https://www.banhalmi.art"+value if value.startswith("/") else value
def language_from_url(url):
    lowered=url.lower()
    if "/hu/" in lowered or "hu.wikipedia" in lowered or ".hu/" in lowered:return "hu"
    if "/de-at/" in lowered or ".at/" in lowered:return "de"
    if "/en/" in lowered:return "en"
    return None
def authority_for(source_type, provenance):
    text=f"{source_type} {provenance}".lower()
    if any(t in text for t in ("independent","institutional","press","wikimedia","wikipedia")):return "independent-or-institutional"
    if any(t in text for t in ("official","primary","canonical","owner-shared")):return "primary"
    return "contextual"
def add_source(store, source_id, url, source_type, supports, provenance, evidence_role=None, quality=None, language=None, registry=""):
    url=normalise_url(url); parsed=urlparse(url)
    if parsed.scheme not in ("http","https") or not parsed.netloc:return
    key=url.rstrip("/")
    current=store.get(key)
    if current is None:
        current={"sourceId":source_id,"url":url,"sourceType":source_type,"language":language or language_from_url(url),"supports":[],"evidenceRoles":[],"authority":authority_for(source_type,provenance),"quality":quality,"provenance":[],"registries":[],"verification":{"status":"pending-live-check","lastChecked":None,"finalUrl":None,"httpStatus":None}}
        store[key]=current
    current["supports"]=sorted(set(current["supports"])|set(supports))
    if evidence_role:current["evidenceRoles"]=sorted(set(current["evidenceRoles"])|{evidence_role})
    current["provenance"]=sorted(set(current["provenance"])|{provenance})
    current["registries"]=sorted(set(current["registries"])|{registry})
    if quality and not current.get("quality"):current["quality"]=quality
    if language and not current.get("language"):current["language"]=language
sources={}
for filename,registry_name in REGISTRIES:
    data=load_json(ROOT/filename)
    for index,item in enumerate(data.get("sources",[]),1):
        if not item.get("url"):continue
        add_source(sources,item.get("id") or f"{registry_name}-{index:03d}",item["url"],item.get("type","unspecified-source"),list(item.get("supports") or []),item.get("provenance",registry_name),item.get("role"),item.get("quality"),item.get("language"),registry_name)
press_registry=load_json(ROOT/"press-source-registry.json")
for language,language_data in (press_registry.get("languages") or {}).items():
    for index,item in enumerate(language_data.get("records") or [],1):
        url=item.get("sourceUrl")
        if not url:continue
        archive_url=item.get("archiveUrl")
        supports=[archive_url] if archive_url else [f"press-{language}-{index:02d}"]
        add_source(sources,f"press-{language}-{index:02d}",url,"press-source",supports,"press-source-registry","public-reception",item.get("sourceQuality"),language,"press-registry")
period_data=load_json(PERIOD_FILE)
for period in period_data.get("periods",[]):
    number=str(period.get("number","")).strip(); project=period.get("anchorProject") or {}; project_name=project.get("name",f"period-{number}")
    for index,item in enumerate(period.get("evidence") or [],1):
        if not item.get("url"):continue
        add_source(sources,f"period-{number.lower()}-evidence-{index:02d}",item["url"],item.get("type","period-evidence"),[f"period-{number}",project_name],"period-evidence-backbone",item.get("role"),item.get("quality"),None,"period-evidence-backbone")
ordered=sorted(sources.values(),key=lambda i:(i["sourceType"],i["url"]))
for index,item in enumerate(ordered,1):item["catalogueNumber"]=f"BAS-{index:04d}"
database={"@context":"https://schema.org","@type":"Dataset","@id":"https://www.banhalmi.art/master-source-database.json#dataset","name":"BANHALMI ART master source database","creator":{"@id":"https://www.banhalmi.art/norbert-banhalmi#person"},"dateModified":date.today().isoformat(),"policy":{"wikidataOptional":True,"molProject":"Self-initiated point of departure. It deliberately has no external evidence requirement.","documentedPeriods":"Periods II–V require at least one inspectable public source tied to the anchor project.","verification":"Network availability is recorded separately from editorial relevance and authority."},"sourceCount":len(ordered),"sources":ordered}
OUTPUT.write_text(json.dumps(database,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
for filename in ("archive-record-registry.json","life-work-source-dossier.json","period-evidence-backbone.json"):
    path=ROOT/filename
    if not path.exists():continue
    data=load_json(path); data["masterSourceDatabase"]="https://www.banhalmi.art/master-source-database.json"
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Generated master source database with {len(ordered)} unique public sources.")
