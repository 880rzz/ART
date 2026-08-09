import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const museumCss = await readFile(path.join(root, 'assets/css/museum-editorial.css'), 'utf8');
const authorityCss = await readFile(path.join(root, 'assets/css/homepage-two-tone-authority.css'), 'utf8');
const appleCss = await readFile(path.join(root, 'assets/css/apple-editorial-system.css'), 'utf8');
const baseCss = await readFile(path.join(root, 'assets/css/page-base.css'), 'utf8');
const responsiveCss = await readFile(path.join(root, 'assets/css/responsive-header-system.css'), 'utf8');
const errors = [];

/* The museum file remains as a structural compatibility layer for archive
   components that have no other owner yet. It must never be the final linked
   stylesheet: the homepage authority has to follow it on every real page. */
for (const token of ['.record-period', 'STAGE39-UI-DESIGN-CONTRACT:START']) {
  if (!museumCss.includes(token)) errors.push('museum structural compatibility missing ' + token);
}
/* Story-dialog scrolling already has a dedicated functional owner and audit.
   Keep this cross-check on responsive-header-system rather than incorrectly
   making the retired museum visual layer responsible for mobile behaviour. */
for (const token of ['#story-dialog.story-panel', 'overflow-y:auto!important', 'touch-action:pan-y!important']) {
  if (!responsiveCss.replace(/\s+/g,'').includes(token.replace(/\s+/g,''))) errors.push('responsive story-dialog contract missing ' + token);
}

const requiredAuthority = [
  '--art-home-dark:#202530',
  '--art-home-raised:#29303F',
  '--art-home-light:#2D3444',
  '--art-home-gold:#B79C44',
  '--art-home-atmosphere:',
  '--art-home-footer:',
  'header.hero',
  'header.sub',
  '.curatorial-hero',
  'main>section:nth-of-type(even)',
  'main>section::before',
  'width:100vw',
  'main>.statement::before',
  'footer{',
  'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",Arial,sans-serif!important',
  'font-size:clamp(16px,.18vw + 15px,18px)!important',
  'font-weight:600!important',
  'font-size:clamp(2.55rem,5vw,5.1rem)!important',
  'font-size:clamp(2rem,3.4vw,3.45rem)!important'
];
for (const token of requiredAuthority) if (!authorityCss.includes(token)) errors.push('homepage-two-tone-authority.css: missing ' + token);
for (const legacy of ['#0f0f0f', '#171717', '#211f1b']) if (authorityCss.toLowerCase().includes(legacy)) errors.push('homepage authority contains retired neutral surface ' + legacy);

/* The final type values must remain identical to the homepage source layer.
   Repetition in the last authority is intentional: museum has old !important
   type rules, so load order alone cannot restore the homepage hierarchy. */
for (const token of [
  'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",Arial,sans-serif!important',
  'font-weight:600!important',
  'body.apple-archive h1{font-size:clamp(2.55rem,5vw,5.1rem)!important',
  'body.apple-archive h2{font-size:clamp(2rem,3.4vw,3.45rem)!important'
]) if (!appleCss.includes(token)) errors.push('apple-editorial-system.css: homepage typography contract missing ' + token);

for (const token of ['--c-ground:#202530', '--c-raised:#29303F', '--c-panel:#2D3444']) {
  if (!baseCss.includes(token)) errors.push('page-base.css: missing ' + token);
}

const skip = new Set(['.git','node_modules','.github','data','reports']);
const files = [];
async function walk(dir){
  for (const entry of await readdir(dir,{withFileTypes:true})){
    if (skip.has(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);
let pages = 0;
let sections = 0;
for (const file of files){
  const html = await readFile(file,'utf8');
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html) || !/<main\b/i.test(html)) continue;
  if (/http-equiv=["']refresh["']|location\.replace\(/i.test(html)) continue;
  pages += 1;
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
  sections += (main.match(/<section\b/gi) || []).length;
  const links = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
  const apple = links.findIndex(h=>h.includes('/assets/css/apple-editorial-system.css'));
  const museum = links.findIndex(h=>h.includes('/assets/css/museum-editorial.css'));
  const authority = links.findIndex(h=>h.includes('/assets/css/homepage-two-tone-authority.css'));
  const rel = path.relative(root,file);
  if (apple < 0) errors.push(rel+': apple-editorial-system.css missing');
  if (museum < 0) errors.push(rel+': museum structural stylesheet missing');
  if (authority < 0) errors.push(rel+': homepage final authority missing');
  if (apple >= 0 && museum >= 0 && apple > museum) errors.push(rel+': museum must follow the homepage source layer');
  if (museum >= 0 && authority >= 0 && museum > authority) errors.push(rel+': museum overrides homepage authority');
  if (authority >= 0 && authority !== links.length-1) errors.push(rel+': homepage authority is not the final stylesheet');
}
if (pages < 80) errors.push('surface audit covered unexpectedly few live pages: '+pages);
if (sections < 300) errors.push('surface audit covered unexpectedly few sections: '+sections);
if (errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Section surface audit passed: '+sections+' sections across '+pages+' live pages keep museum component structure underneath the final homepage Apple typography and blue/gold authority.');
