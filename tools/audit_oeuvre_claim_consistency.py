#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]; errors=[]
for path in ROOT.rglob("*"):
 if not path.is_file() or path.suffix.lower() not in {".html",".json",".txt",".md"} or ".git" in path.parts or "tools" in path.parts:continue
 text=path.read_text(encoding="utf-8",errors="ignore").lower()
 for phrase in ("five documented research periods","five evidence-backed research periods","öt dokumentált kutatási korszak","öt bizonyított korszak","fünf dokumentierte forschungsperioden"):
  if phrase in text:errors.append(f"{path.relative_to(ROOT)}: obsolete claim {phrase!r}")
period_path=ROOT/"period-evidence-backbone.json"
if not period_path.exists():errors.append("period-evidence-backbone.json is missing")
else:
 data=json.loads(period_path.read_text(encoding="utf-8")); periods=data.get("periods") or []
 if len(periods)!=5:errors.append("the oeuvre line must contain one origin plus four documented periods")
 mol=next((p for p in periods if p.get("number")=="I"),None)
 if not mol:errors.append("MOL origin is missing")
 else:
  if mol.get("status")!="self-initiated-origin":errors.append("MOL must be marked self-initiated-origin")
  if mol.get("evidence"):errors.append("MOL must have an intentionally empty evidence list")
  note=json.dumps(mol.get("curatorialNote") or {},ensure_ascii=False).lower()
  if not any(t in note for t in ("self-initiated","saját","selbstinitiiert")):errors.append("MOL curatorial note must explain its self-initiated character")
 for number in ("II","III","IV","V"):
  period=next((p for p in periods if p.get("number")==number),None)
  if not period:errors.append(f"period {number} is missing")
  elif not (period.get("evidence") or []):errors.append(f"period {number} has no evidence")
if errors:
 print("OEUVRE CLAIM CONSISTENCY AUDIT FAILED")
 [print("-",e) for e in errors]; sys.exit(1)
print("OEUVRE CLAIM CONSISTENCY AUDIT PASSED")
