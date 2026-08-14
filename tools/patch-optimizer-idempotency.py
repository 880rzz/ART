from pathlib import Path

p = Path('scripts/optimize-pages-artifact.mjs')
s = p.read_text(encoding='utf-8')

# Portrait: count valid final state, not only freshly changed state.
start = s.index('async function addResponsiveHomepagePortrait(html) {')
end = s.index('\nasync function deferHomepageGalleryBatches', start)
portrait = r'''async function addResponsiveHomepagePortrait(html) {
  const originalPath = '/assets/img/portrait-circle.png';
  const optimizedPath = '/assets/img/responsive/portrait-circle-480.webp';
  const optimized720 = '/assets/img/responsive/portrait-circle-720.webp';
  const originalEscaped = originalPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const optimizedEscaped = optimizedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const originalRe = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${originalEscaped}["'])[^>]*>`, 'i');
  const optimizedRe = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${optimizedEscaped}["'])[^>]*>`, 'i');
  const originalMatch = html.match(originalRe);
  const optimizedMatch = html.match(optimizedRe);
  const candidates = [];
  for (const targetWidth of [480, 720]) {
    const variant = `/assets/img/responsive/portrait-circle-${targetWidth}.webp`;
    if (await exists(variant)) candidates.push(`${variant} ${targetWidth}w`);
  }
  if (candidates.length !== 2) return { html, valid: false, changed: false };
  if (originalMatch) {
    let tag = originalMatch[0];
    tag = tag.replace(new RegExp(`\\bsrc=["']${originalEscaped}["']`, 'i'), `src="${optimizedPath}"`);
    tag = setAttribute(tag, 'srcset', candidates.join(', '));
    tag = setAttribute(tag, 'sizes', '(max-width: 640px) 274px, 480px');
    tag = setAttribute(tag, 'width', '480');
    tag = setAttribute(tag, 'height', '480');
    html = html.replace(originalMatch[0], tag);
    return { html, valid: true, changed: true };
  }
  if (optimizedMatch) {
    const tag = optimizedMatch[0];
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1] || '';
    const sizes = tag.match(/\bsizes=["']([^"']+)["']/i)?.[1] || '';
    const width = tag.match(/\bwidth=["'](\d+)["']/i)?.[1];
    const height = tag.match(/\bheight=["'](\d+)["']/i)?.[1];
    const valid = srcset.includes(`${optimizedPath} 480w`) &&
      srcset.includes(`${optimized720} 720w`) &&
      sizes === '(max-width: 640px) 274px, 480px' &&
      width === '480' && height === '480';
    return { html, valid, changed: false };
  }
  return { html, valid: false, changed: false };
}
'''
s = s[:start] + portrait + s[end:]

# Schema: count a gallery as valid whenever it ends with 1..maxAssociatedMedia records.
s = s.replace(
    'let galleries = 0, removedMedia = 0;',
    'let galleries = 0, removedMedia = 0, validGalleries = 0;',
    1,
)
old = """if (types.includes('ImageGallery') && Array.isArray(node.associatedMedia) && node.associatedMedia.length > maxAssociatedMedia) {
        removedMedia += node.associatedMedia.length - maxAssociatedMedia;
        node.associatedMedia = node.associatedMedia.slice(0, maxAssociatedMedia);
        galleries += 1; changed = true;
      }"""
new = """if (types.includes('ImageGallery') && Array.isArray(node.associatedMedia) && node.associatedMedia.length > 0) {
        if (node.associatedMedia.length > maxAssociatedMedia) {
          removedMedia += node.associatedMedia.length - maxAssociatedMedia;
          node.associatedMedia = node.associatedMedia.slice(0, maxAssociatedMedia);
          galleries += 1; changed = true;
        }
        if (node.associatedMedia.length <= maxAssociatedMedia) validGalleries += 1;
      }"""
if old not in s:
    raise SystemExit('schema visit marker missing')
s = s.replace(old, new, 1)
s = s.replace(
    'return { html, galleries, removedMedia };',
    'return { html, galleries, removedMedia, validGalleries };',
    1,
)

# Deferred gallery: recognize and validate an already extracted fragment.
marker = """  const fragmentPath = `/assets/fragments/home-gallery-${lang}.html`;
  const galleryRe ="""
insert = """  const fragmentPath = `/assets/fragments/home-gallery-${lang}.html`;
  if (html.includes(`data-deferred-src=\"${fragmentPath}\"`) && await exists(fragmentPath)) {
    const fragment = await readFile(path.join(root, fragmentPath.replace(/^\\//, '')), 'utf8');
    const deferredImages = (fragment.match(/<img\\b/gi) || []).length;
    if (deferredImages < 80) throw new Error(`${rel}: existing deferred gallery fragment contains only ${deferredImages} images.`);
    return { html, deferredImages, valid: true };
  }
  const galleryRe ="""
if marker not in s:
    raise SystemExit('deferred fragment marker missing')
s = s.replace(marker, insert, 1)

defer_start = s.index('async function deferHomepageGalleryBatches')
defer_end = s.index('\nconst responsiveHeaderRuntimeVersion', defer_start)
block = s[defer_start:defer_end]
block = block.replace(
    'return { html, deferredImages: 0 };',
    'return { html, deferredImages: 0, valid: false };',
)
block = block.replace(
    'return { html, deferredImages };',
    'return { html, deferredImages, valid: true };',
)
s = s[:defer_start] + block + s[defer_end:]

old_loop = 'const portrait = await addResponsiveHomepagePortrait(html); html = portrait.html; if (portrait.changed) responsiveHomepagePortraits += 1;'
new_loop = 'const portrait = await addResponsiveHomepagePortrait(html); html = portrait.html; if (portrait.valid) responsiveHomepagePortraits += 1;'
if old_loop not in s:
    raise SystemExit('portrait loop marker missing')
s = s.replace(old_loop, new_loop, 1)

old_schema = 'const schema = trimHomepageImageGallerySchema(html); html = schema.html; trimmedHomepageSchemaGalleries += schema.galleries; trimmedHomepageSchemaMedia += schema.removedMedia;'
new_schema = 'const schema = trimHomepageImageGallerySchema(html); html = schema.html; trimmedHomepageSchemaGalleries += schema.validGalleries; trimmedHomepageSchemaMedia += schema.removedMedia;'
if old_schema not in s:
    raise SystemExit('schema loop marker missing')
s = s.replace(old_schema, new_schema, 1)

old_deferred = 'if (deferredGallery.deferredImages) { deferredHomepageGalleryImages += deferredGallery.deferredImages; deferredHomepageGalleryPages += 1; }'
new_deferred = 'if (deferredGallery.valid) { deferredHomepageGalleryImages += deferredGallery.deferredImages; deferredHomepageGalleryPages += 1; }'
if old_deferred not in s:
    raise SystemExit('deferred loop marker missing')
s = s.replace(old_deferred, new_deferred, 1)

s = s.replace(
    'Responsive homepage portrait was applied to ${responsiveHomepagePortraits} homepages; expected 3.',
    'Responsive homepage portrait contract is valid on ${responsiveHomepagePortraits} homepages; expected 3.',
    1,
)
s = s.replace(
    'Homepage ImageGallery schema was trimmed on ${trimmedHomepageSchemaGalleries} pages; expected exactly 3.',
    'Homepage ImageGallery schema contract is valid on ${trimmedHomepageSchemaGalleries} pages; expected exactly 3.',
    1,
)

p.write_text(s, encoding='utf-8')
print('optimizer idempotency patch applied')
