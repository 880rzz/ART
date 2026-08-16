from pathlib import Path


def require_replace(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"Missing remediation marker: {label}")
    return text.replace(old, new, 1)


generator = Path("scripts/generate-responsive-gallery.py")
s = generator.read_text()
if "hero_generated = 0" not in s:
    marker = 'print(\n    "Responsive homepage imagery generated: "'
    block = r'''
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

'''
    s = require_replace(s, marker, block + marker, "gallery generator print")
    s = s.replace(
        'f"{portrait_generated} portrait variants; source first-batch bytes={source_bytes}; "',
        'f"{portrait_generated} portrait variants; {hero_generated} hero variants; source first-batch bytes={source_bytes}; "',
        1,
    )
    generator.write_text(s)

optimizer = Path("scripts/optimize-pages-artifact.mjs")
s = optimizer.read_text()
if "async function addResponsiveHomepageHero" not in s:
    marker = "async function deferHomepageGalleryBatches(html, rel) {"
    helper = r'''async function addResponsiveHomepageHero(html) {
  const sourcePath = '/assets/img/hero.webp';
  const imgRe = /<img\b(?=[^>]*\bsrc=["']\/assets\/img\/hero\.webp["'])[^>]*>/i;
  const match = html.match(imgRe);
  if (!match) return { html, valid: false };
  const candidates = [];
  for (const width of [640, 960, 1280, 1600]) {
    const variant = `/assets/img/responsive/hero-${width}.webp`;
    if (await exists(variant)) candidates.push(`${variant} ${width}w`);
  }
  if (candidates.length < 2) return { html, valid: false };
  let tag = match[0];
  tag = setAttribute(tag, 'srcset', candidates.join(', '));
  tag = setAttribute(tag, 'sizes', '100vw');
  tag = setAttribute(tag, 'fetchpriority', 'high');
  tag = setAttribute(tag, 'loading', 'eager');
  tag = setAttribute(tag, 'decoding', 'async');
  html = html.replace(match[0], tag);
  const preload = `<link rel="preload" as="image" href="/assets/img/responsive/hero-640.webp" imagesrcset="${candidates.join(', ')}" imagesizes="100vw" fetchpriority="high">`;
  html = html.replace(/<link rel=["']preload["'] as=["']image["'] href=["']\/assets\/img\/hero\.webp["'][^>]*>/i, preload);
  return { html, valid: true };
}

'''
    s = require_replace(s, marker, helper + marker, "optimizer helper")
    old = '''    if (!html.includes('href="/assets/img/hero.webp"')) html = html.replace('</head>', '<link rel="preload" as="image" href="/assets/img/hero.webp" fetchpriority="high">\\n</head>');'''
    new = old + '''
    const responsiveHero = await addResponsiveHomepageHero(html); html = responsiveHero.html;
    if (!responsiveHero.valid) throw new Error(`${rel}: responsive homepage hero contract failed.`);'''
    s = require_replace(s, old, new, "optimizer homepage hero call")
    optimizer.write_text(s)

pages = Path(".github/workflows/pages.yml")
s = pages.read_text()
s = s.replace(
    "grep -Fq '<link rel=\"preload\" as=\"image\" href=\"/assets/img/hero.webp\" fetchpriority=\"high\">' \"_site/$page\"",
    "grep -Fq 'imagesrcset=\"/assets/img/responsive/hero-640.webp 640w' \"_site/$page\"",
)
s = s.replace(
    "grep -Fq '<link rel=\"preload\" as=\"image\" href=\"/assets/img/hero.webp\" fetchpriority=\"high\">' /tmp/art-live-en.html",
    "grep -Fq 'imagesrcset=\"/assets/img/responsive/hero-640.webp 640w' /tmp/art-live-en.html",
)
pages.write_text(s)

print("Homepage LCP source remediation prepared: responsive hero artifact generation, responsive discovery, and production verification updated.")
