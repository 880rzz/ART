#!/usr/bin/env python3
"""Generate deployment-only responsive WebP variants for the first homepage gallery batch."""

from pathlib import Path
import sys

from PIL import Image, ImageOps, features

root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
source_dir = root / "assets" / "img" / "best-of"
out_dir = source_dir / "responsive"
out_dir.mkdir(parents=True, exist_ok=True)

if not features.check("webp"):
    raise SystemExit("Pillow WebP support is required for the ART production image build.")

widths = (640, 960)
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
            resized.save(
                output,
                format="WEBP",
                quality=82,
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

print(
    "Responsive homepage gallery generated: "
    f"{generated} useful variants; {skipped_not_smaller} non-beneficial variants discarded; "
    f"source first-batch bytes={source_bytes}; generated variant bytes={variant_bytes}."
)
