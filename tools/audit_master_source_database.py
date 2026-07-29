#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json,sys
ROOT=Path(__file__).resolve().parents[1]; PATH=ROOT/"master-source-database.json"; errors=[]
if not PATH.exists():errors.append("master-source-database.json is missing")
else:
 data=json.loads(PATH.read_text(encoding="utf-8")); sources=data.get("sources") or []
 if data.get("sourceCount")!=len(sources):errors.append("sourceCount does not match sources length")
 if len(sources)<10:errors.append(f"master source database is unexpectedly small: {len(sources)}")
 ids=set(); urls=set()
 for item in sources:
  source_id=item.get("sourceId"); url=str(item.get("url",""))
  if not source_id:errors.append("source without sourceId")
  elif source_id in ids:errors.append(f"duplicate sourceId: {source_id}")
  ids.add(source_id); normalised=url.rstrip("/")
  if normalised in urls:errors.append(f"duplicate URL after normalisation: {url}")
  urls.add(normalised); parsed=urlparse(url)
  if parsed.scheme not in ("http","https") or not parsed.netloc:errors.append(f"invalid public URL: {url!r}")
  if not item.get("sourceType"):errors.append(f"{source_id}: missing sourceType")
  if not item.get("supports"):errors.append(f"{source_id}: source is not linked to any archive entity")
  if not item.get("authority"):errors.append(f"{source_id}: missing authority classification")
 expected={"https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert","https://www.wikidata.org/wiki/Q56391118","https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg","https://www.banhalmi.art/post/euforia","https://www.magyarforradalom1956.hu/v/merfoldkovek--56-os-portrekepekbol-rendeztek-kiallitast-new-yorkban/","https://youtu.be/XI5WavAwFOY"}
 for url in sorted(expected):
  if url.rstrip("/") not in urls:errors.append(f"required source missing: {url}")
press_path=ROOT/"press-source-registry.json"
if press_path.exists() and PATH.exists():
 press_data=json.loads(press_path.read_text(encoding="utf-8"))
 expected_press_urls={str(item.get("sourceUrl","")).rstrip("/") for lang in (press_data.get("languages") or {}).values() for item in (lang.get("records") or []) if item.get("sourceUrl")}
 missing_press=sorted(expected_press_urls-urls)
 if missing_press:errors.append(f"master source database omits {len(missing_press)} press source URLs")
period_path=ROOT/"period-evidence-backbone.json"
if period_path.exists():
 periods=json.loads(period_path.read_text(encoding="utf-8")).get("periods") or []
 for period in periods:
  number=period.get("number"); evidence=period.get("evidence") or []
  if number=="I":
   if evidence:errors.append("MOL origin must not contain external evidence")
   if period.get("status")!="self-initiated-origin":errors.append("MOL origin must use self-initiated-origin status")
  elif number in {"II","III","IV","V"} and not evidence:errors.append(f"period {number} requires evidence")
if errors:
 print("MASTER SOURCE DATABASE AUDIT FAILED")
 [print("-",e) for e in errors]; sys.exit(1)
print("MASTER SOURCE DATABASE AUDIT PASSED")
