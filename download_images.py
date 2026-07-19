#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Run ONCE on a machine with internet:  pip install pillow  &&  python3 download_images.py
Downloads every gallery image into its own per-page folder and compresses it to max
1600px WebP (quality 80). After this the site is fully self-hosted — no external image
requests at all, which is what makes it properly GDPR-clean."""
import json, os, io, urllib.request
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
man = json.load(open(os.path.join(HERE, "images_manifest.json")))
ok = fail = skip = 0
for local, url in man.items():
    for langdir in ("", "de-at/", "hu/"):
        dst = os.path.join(HERE, langdir, local)
        if os.path.exists(dst):
            skip += 1; continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        try:
            data = urllib.request.urlopen(url, timeout=30).read()
            im = Image.open(io.BytesIO(data)); im.thumbnail((1600, 1600))
            im.convert("RGB").save(dst, "WEBP", quality=80, method=6)
            ok += 1; print("ok  ", langdir + local)
        except Exception as ex:
            fail += 1; print("FAIL", langdir + local, ex)
print(f"\nDone. {ok} downloaded, {skip} already present, {fail} failed.")
