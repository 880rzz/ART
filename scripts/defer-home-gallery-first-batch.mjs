import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '_site');
const homepages = ['index.html', 'hu/index.html', 'de-at/index.html'];
const placeholder = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const sizes = '(max-width: 640px) calc(100vw - 70px), (max-width: 1000px) calc(50vw - 48px), 33vw';

async function exists(webPath) {
  try {
    await access(path.join(root, webPath.replace(/^\//, '')));
    return true;
  } catch {
    return false;
  }
}

function setAttr(tag, name, value) {
  const re = new RegExp(`\\s+${name}=["'][^"']*["']`, 'i');
  if (re.test(tag)) return tag.replace(re, ` ${name}="${value}"`);
  return tag.replace(/>$/, ` ${name}="${value}">`);
}

let updatedPages = 0;
let deferredImages = 0;

for (const rel of homepages) {
  const file = path.join(root, rel);
  let html = await readFile(file, 'utf8');
  let pageDeferred = 0;

  for (let index = 1; index <= 15; index += 1) {
    const stem = `best-of-${String(index).padStart(2, '0')}`;
    const sourcePath = `/assets/img/best-of/${stem}.webp`;
    const escaped = sourcePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${escaped}["'])[^>]*>`, 'i');
    const match = html.match(re);
    if (!match) continue;

    let tag = match[0];
    const originalWidth = Number(tag.match(/\bwidth=["'](\d+)["']/i)?.[1] || 0);
    if (!originalWidth) throw new Error(`${rel}: ${stem} is missing an intrinsic width.`);

    const candidates = [];
    for (const width of [384, 480, 640, 720, 960]) {
      const variant = `/assets/img/best-of/responsive/${stem}-${width}.webp`;
      if (await exists(variant)) candidates.push(`${variant} ${width}w`);
    }
    candidates.push(`${sourcePath} ${originalWidth}w`);

    tag = setAttr(tag, 'data-art-deferred-gallery-image', 'true');
    tag = setAttr(tag, 'data-src', sourcePath);
    tag = setAttr(tag, 'data-srcset', candidates.join(', '));
    tag = setAttr(tag, 'data-sizes', sizes);
    tag = setAttr(tag, 'src', placeholder);
    tag = tag.replace(/\s+srcset=["'][^"']*["']/i, '');
    tag = tag.replace(/\s+sizes=["'][^"']*["']/i, '');
    tag = setAttr(tag, 'loading', 'lazy');
    tag = setAttr(tag, 'decoding', 'async');
    tag = setAttr(tag, 'fetchpriority', 'low');

    html = html.replace(match[0], tag);
    pageDeferred += 1;
  }

  if (pageDeferred < 10) throw new Error(`${rel}: only ${pageDeferred} first-batch gallery images were deferred.`);

  const runtime = `<script data-art-home-gallery-hydrator>(()=>{const w=document.getElementById('galwrap');if(!w)return;let done=false;const hydrate=()=>{if(done)return;done=true;w.querySelectorAll('img[data-art-deferred-gallery-image="true"]').forEach(i=>{const s=i.dataset.src,ss=i.dataset.srcset,z=i.dataset.sizes;if(ss)i.srcset=ss;if(z)i.sizes=z;if(s)i.src=s;i.removeAttribute('data-src');i.removeAttribute('data-srcset');i.removeAttribute('data-sizes');i.removeAttribute('data-art-deferred-gallery-image');});};if('IntersectionObserver'in window){const o=new IntersectionObserver(e=>{if(e.some(x=>x.isIntersecting)){o.disconnect();hydrate();}},{rootMargin:'0px 0px -20% 0px',threshold:.01});o.observe(w);}else window.addEventListener('scroll',hydrate,{once:true,passive:true});w.addEventListener('focusin',hydrate,{once:true});w.addEventListener('pointerdown',hydrate,{once:true});})();</script>`;
  if (html.includes('data-art-home-gallery-hydrator')) throw new Error(`${rel}: duplicate homepage gallery hydrator.`);
  html = html.replace('</body>', `${runtime}\n</body>`);

  await writeFile(file, html, 'utf8');
  updatedPages += 1;
  deferredImages += pageDeferred;
}

if (updatedPages !== 3 || deferredImages < 30) {
  throw new Error(`Homepage gallery deferral contract updated ${updatedPages} pages / ${deferredImages} images.`);
}

console.log(`Homepage first-batch gallery network deferred: ${deferredImages} images across ${updatedPages} localized homepages.`);
