#!/usr/bin/env python3
"""Generate deployment-only responsive WebP variants for homepage imagery."""

from pathlib import Path
import sys

from PIL import Image, ImageOps, features

root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
source_dir = root / "assets" / "img" / "best-of"
out_dir = source_dir / "responsive"
out_dir.mkdir(parents=True, exist_ok=True)

if not features.check("webp"):
    raise SystemExit("Pillow WebP support is required for the ART production image build.")

# Include low-DPR mobile steps for smaller screens while retaining higher steps
# for retina/tablet layouts. Candidate selection remains driven by sizes + DPR.
widths = (384, 480, 640, 720, 960)
generated = 0
skipped_not_smaller = 0
source_bytes = 0
variant_bytes = 0

for index in range(1, 16):
    stem = f"best-of-{index:02d}"
    source = source_dir / f"{stem}.webp"
    if not source.is_file():
        raise SystemExit(f"Missing homepage gallery source: {source.relative_to(root)}")

    source_size = source.stat().st_size
    source_bytes += source_size
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.load()
        original_width, original_height = image.size

        for target_width in widths:
            if original_width <= target_width:
                continue

            target_height = max(1, round(original_height * target_width / original_width))
            resized = image.resize(
                (target_width, target_height),
                Image.Resampling.LANCZOS,
                reducing_gap=3.0,
            )
            if resized.mode not in ("RGB", "RGBA"):
                resized = resized.convert("RGBA" if "A" in resized.getbands() else "RGB")

            output = out_dir / f"{stem}-{target_width}.webp"
            # These are deployment-only display derivatives, not archival masters.
            # Quality 78 materially reduces transfer size while retaining visually
            # high-quality photographic detail at the rendered card dimensions.
            resized.save(
                output,
                format="WEBP",
                quality=78,
                method=6,
                exact=True,
            )

            output_size = output.stat().st_size
            if output_size >= source_size:
                output.unlink()
                skipped_not_smaller += 1
                continue

            generated += 1
            variant_bytes += output_size

# The source archive keeps the original 900px PNG untouched. Production gets
# right-sized modern derivatives so the below-fold portrait does not transfer
# ~190 KiB to render at a much smaller size.
portrait_source = root / "assets" / "img" / "portrait-circle.png"
portrait_out_dir = root / "assets" / "img" / "responsive"
portrait_out_dir.mkdir(parents=True, exist_ok=True)
portrait_generated = 0
if not portrait_source.is_file():
    raise SystemExit(f"Missing homepage portrait source: {portrait_source.relative_to(root)}")

with Image.open(portrait_source) as opened:
    portrait = ImageOps.exif_transpose(opened)
    portrait.load()
    if portrait.mode not in ("RGB", "RGBA"):
        portrait = portrait.convert("RGBA" if "A" in portrait.getbands() else "RGB")
    original_width, original_height = portrait.size
    for target_width in (480, 720):
        if original_width <= target_width:
            continue
        target_height = max(1, round(original_height * target_width / original_width))
        resized = portrait.resize(
            (target_width, target_height),
            Image.Resampling.LANCZOS,
            reducing_gap=3.0,
        )
        output = portrait_out_dir / f"portrait-circle-{target_width}.webp"
        resized.save(output, format="WEBP", quality=82, method=6, exact=True)
        portrait_generated += 1

# The hero is the mobile LCP. Keep the archival source untouched; these
# right-sized candidates exist only in the generated deployment artifact.
hero_source = root / "assets" / "img" / "hero.webp"
hero_out_dir = root / "assets" / "img" / "responsive"
hero_out_dir.mkdir(parents=True, exist_ok=True)
hero_generated = 0
if not hero_source.is_file():
    raise SystemExit(f"Missing homepage hero source: {hero_source.relative_to(root)}")
with Image.open(hero_source) as opened:
    hero = ImageOps.exif_transpose(opened)
    hero.load()
    if hero.mode not in ("RGB", "RGBA"):
        hero = hero.convert("RGBA" if "A" in hero.getbands() else "RGB")
    original_width, original_height = hero.size
    for target_width in (640, 960, 1280, 1600):
        if original_width <= target_width:
            continue
        target_height = max(1, round(original_height * target_width / original_width))
        resized = hero.resize((target_width, target_height), Image.Resampling.LANCZOS, reducing_gap=3.0)
        output = hero_out_dir / f"hero-{target_width}.webp"
        resized.save(output, format="WEBP", quality=76, method=6, exact=True)
        hero_generated += 1

print(
    "Responsive homepage imagery generated: "
    f"{generated} useful gallery variants; {skipped_not_smaller} non-beneficial gallery variants discarded; "
    f"{portrait_generated} portrait variants; {hero_generated} hero variants; source first-batch bytes={source_bytes}; "
    f"generated gallery variant bytes={variant_bytes}."
)
