#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Letölti pontosan azokat a képeket, amik a www.banhalmi.art oldalain vannak,
és a helyükre rendezi őket ebben a csomagban.

Használat (interneten lévő gépen, ebben a mappában):

    python3 -m pip install pillow
    python3 download_images.py

A script újrafuttatható: ami már megvan, azt átugorja.
"""
import json, os, io, shutil, sys, time, urllib.request
from collections import Counter

try:
    from PIL import Image
except ImportError:
    sys.exit(
        "\nHiányzik a Pillow képkezelő könyvtár.\n"
        "macOS-en a 'pip' általában nincs a PATH-on, ezért ezt futtasd:\n\n"
        "    python3 -m pip install pillow\n\n"
        "Ha jogosultsági hibát ír, próbáld ezzel:\n\n"
        "    python3 -m pip install --user pillow\n"
    )

HERE = os.path.dirname(os.path.abspath(__file__))
MAN_PATH = os.path.join(HERE, "images_from_banhalmi_art.json")
if not os.path.exists(MAN_PATH):
    sys.exit("Nem találom az images_from_banhalmi_art.json fájlt.")
MAN = json.load(open(MAN_PATH, encoding="utf-8"))

UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.banhalmi.art/",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
}


def fetch(url, tries=3):
    last = None
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            return urllib.request.urlopen(req, timeout=45).read()
        except Exception as ex:
            last = ex
            time.sleep(1.5 * (n + 1))
    raise last


SRC_PATH = os.path.join(HERE, "assets", "img", ".sources.json")


def load_sources():
    try:
        return json.load(open(SRC_PATH, encoding="utf-8"))
    except Exception:
        # Older packages did not keep a source ledger. Their existing files were
        # already downloaded from this same manifest, so seed the ledger once
        # instead of fetching hundreds of verified archive images again.
        return {
            local: url for local, url in MAN.items()
            if os.path.exists(os.path.join(HERE, local))
            and os.path.getsize(os.path.join(HERE, local)) > 1024
        }


def main():
    ok = fail = skip = 0
    failed = []
    items = sorted(MAN.items())
    total = len(items)
    src = load_sources()
    print(f"{total} kép letöltése a www.banhalmi.art-ról…\n")

    # 1) Atkoltoztetjuk a regi, egy kupacban allo kepeket az uj mappaszerkezetbe.
    #    Igy nem kell ujra letolteni oket.
    live_dir = os.path.join(HERE, "assets", "img", "live")
    moved = 0
    if os.path.isdir(live_dir):
        old_by_name = {}
        for f in os.listdir(live_dir):
            if f.endswith(".webp"):
                old_by_name[f] = os.path.join(live_dir, f)
        for local in MAN:
            new_name = os.path.basename(local)
            # a fooldal kepei "home-NN" -> "best-of-NN" nevre valtottak
            candidates = [new_name, new_name.replace("best-of-", "home-")]
            for cand in candidates:
                src_p = old_by_name.get(cand)
                if src_p and os.path.exists(src_p):
                    dst_p = os.path.join(HERE, local)
                    if not os.path.exists(dst_p):
                        os.makedirs(os.path.dirname(dst_p), exist_ok=True)
                        shutil.move(src_p, dst_p)
                        moved += 1
                    break
        # ami maradt, az mar nem kell
        rest = [f for f in os.listdir(live_dir) if f.endswith(".webp")]
        for f in rest:
            os.remove(os.path.join(live_dir, f))
        try:
            os.rmdir(live_dir)
        except OSError:
            pass
        if moved:
            print(f"{moved} meglévő kép átmozgatva az új mappaszerkezetbe.")
        if rest:
            print(f"{len(rest)} fölöslegessé vált kép törölve.\n")

    # 2) A már nem használt fájlok takaritasa az uj mappakban is.
    for sub in ("best-of", "exhibitions", "books"):
        base = os.path.join(HERE, "assets", "img", sub)
        if not os.path.isdir(base):
            continue
        keep = {os.path.join(HERE, k) for k in MAN}
        for root, _dirs, files in os.walk(base):
            for f in files:
                p = os.path.join(root, f)
                if f.endswith(".webp") and p not in keep:
                    os.remove(p)

    for n, (local, url) in enumerate(items, 1):
        dst = os.path.join(HERE, local)
        # Csak akkor ugorjuk at, ha a fajl megvan ES ugyanabbol a forrasbol jott.
        if (os.path.exists(dst) and os.path.getsize(dst) > 1024
                and src.get(local) == url):
            skip += 1
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        try:
            data = fetch(url)
            im = Image.open(io.BytesIO(data))
            im.thumbnail((1600, 1600))
            im.convert("RGB").save(dst, "WEBP", quality=82, method=6)
            ok += 1
            src[local] = url
            os.makedirs(os.path.dirname(SRC_PATH), exist_ok=True)
            json.dump(src, open(SRC_PATH, "w", encoding="utf-8"), indent=1)
            print(f"[{n:3}/{total}] ok    {local}")
        except Exception as ex:
            fail += 1
            failed.append((local, str(ex)[:70]))
            print(f"[{n:3}/{total}] HIBA  {local}  {ex}")

    os.makedirs(os.path.dirname(SRC_PATH), exist_ok=True)
    json.dump(src, open(SRC_PATH, "w", encoding="utf-8"), indent=1)
    print(f"\nKész: {ok} letöltve, {skip} már megvolt, {fail} sikertelen.")

    have, want = Counter(), Counter()
    for local in MAN:
        page = os.path.basename(local).rsplit("-", 1)[0]
        want[page] += 1
        if os.path.exists(os.path.join(HERE, local)):
            have[page] += 1

    print("\nOldalanként:")
    for p in sorted(want):
        mark = "OK  " if have[p] == want[p] else "!!  "
        print(f"  {mark}{p:30} {have[p]:2}/{want[p]:2}")

    if failed:
        print("\nSikertelen fájlok:")
        for f, e in failed:
            print("   ", f, "|", e)
        print("\nFuttasd újra a scriptet — a meglévőket átugorja.")
    else:
        print("\nMinden kép a helyén van. Az oldal mostantól semmit nem tölt kívülről.")


main()
