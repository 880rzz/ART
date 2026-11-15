#!/usr/bin/env python3
"""Read-only correspondence leak gate. Never print matched text or private values."""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT_EXT = {".html",".htm",".md",".txt",".json",".jsonld",".xml",".csv",".yml",".yaml",".js",".mjs",".cjs",".ts",".tsx",".jsx",".css",".svg",".py",".sh",".toml"}
BLOCKED_EXT = {".eml",".msg",".mbox",".pst",".ost",".vcf",".ics"}
BLOCKED_NAMES = {"mail-export.json","gmail-export.json","customer-emails.csv","email-threads.json"}
SKIP = {"scripts/check-correspondence-confidentiality.py"}
# High-confidence *structural* evidence only. No real addresses or client strings are embedded.
RULES = {
    "mail_header": re.compile(r"(?im)^(?:From|To|Cc|Bcc|Reply-To|Felad[oó]|C[ií]mzett):\s*[^\n]{0,180}@[a-z0-9.-]+\.[a-z]{2,}"),
    "forwarded_mail": re.compile(r"(?im)^\s*(?:-{2,}\s*)?(?:Original Message|Forwarded message|Eredeti üzenet|Továbbított üzenet)\b"),
    "gmail_thread_export": re.compile(r'(?i)"(?:thread_id|message_id)"\s*:\s*"[a-f0-9]{12,}"'),
    "private_key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
}
def main():
    try:
        names = subprocess.check_output(["git","ls-files","-z"],cwd=ROOT).decode("utf-8").split("\0")
    except (OSError,subprocess.CalledProcessError):
        print("BLOCK: tracked-file inventory unavailable")
        return 1
    findings = {}
    checked = 0
    for rel in filter(None,names):
        p = Path(rel)
        if rel in SKIP:
            continue
        if p.suffix.lower() in BLOCKED_EXT or p.name.lower() in BLOCKED_NAMES:
            findings["restricted_mail_file"] = findings.get("restricted_mail_file",0)+1
            continue
        if p.suffix.lower() not in TEXT_EXT:
            continue
        try:
            content=(ROOT/p).read_text(encoding="utf-8")
        except (OSError,UnicodeError):
            findings["unreadable_text"] = findings.get("unreadable_text",0)+1
            continue
        checked += 1
        for label,pattern in RULES.items():
            if pattern.search(content):
                findings[label]=findings.get(label,0)+1
    print(f"Correspondence publication gate: {checked} tracked text files screened")
    if findings:
        for label,count in sorted(findings.items()):
            print(f"BLOCK: {label} in {count} file(s); content and paths withheld")
        return 1
    print("PASS: no high-confidence mail exports/headers found; manual privacy, metadata and history review mandatory")
    return 0
if __name__=="__main__":
    sys.exit(main())
