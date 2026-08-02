import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github', 'data', 'reports']);
const changed = [];

const copy = {
  en: {
    gallery: 'Gallery',
    galleryDesc: 'A curated selection of photographs from the archive.',
    about: 'About Norbert',
    aboutDesc: 'Biography, working method and the person behind the archive.',
    oeuvre: 'Oeuvre — career arc',
    oeuvreDesc: 'From documentation in 1999 to books, exhibitions and visual strategy.',
    heroGallery: 'Gallery',
  },
  hu: {
    gallery: 'Galéria',
    galleryDesc: 'Válogatás az archívum meghatározó portréiból és képtörténeteiből.',
    about: 'Bemutatkozás',
    aboutDesc: 'Életrajz, alkotói módszer és az archívum mögötti személy.',
    oeuvre: 'Életmű — pályaív',
    oeuvreDesc: 'Az 1999-es dokumentációtól a könyveken és kiállításokon át a vizuális stratégiáig.',
    heroGallery: 'Galéria',
  },
  de: {
    gallery: 'Galerie',
    galleryDesc: 'Eine kuratierte Auswahl prägender Porträts und Bildgeschichten aus dem Archiv.',
    about: 'Über Norbert',
    aboutDesc: 'Biografie, Arbeitsweise und die Person hinter dem Archiv.',
    oeuvre: 'Werk — Laufbahn',
    oeuvreDesc: 'Von der Dokumentation seit 1999 über Bücher und Ausstellungen bis zur visuellen Strategie.',
    heroGallery: 'Galerie',
  },
};

function languageOf(rel) {
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  return 'en';
}

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function replaceMenu(html, rel) {
  if (!/<div[^>]+id=["']menu["']/i.test(html) || !/class=["'][^"']*apple-archive/i.test(html)) return html;
  const t = copy[languageOf(rel)];

  const exhibition = /<a class="m-main" href="([^"]*index\.html#exhibitions)">[\s\S]*?<\/a><p class="m-desc">[\s\S]*?<\/p>/;
  if (!html.includes('data-nav-role="gallery"')) {
    html = html.replace(exhibition, (block, href) => {
      const galleryHref = href.replace(/#exhibitions$/, '#works');
      const gallery = `<a class="m-main" data-nav-role="gallery" href="${galleryHref}">${t.gallery}</a><p class="m-desc">${t.galleryDesc}</p>`;
      return `${gallery}${block.replace('<a class="m-main"', '<a class="m-main" data-nav-role="exhibitions"')}`;
    });
  }

  const formerOeuvre = /<a class="m-main" href="([^"]*index\.html#about)">[\s\S]*?<\/a><p class="m-desc">[\s\S]*?<\/p>/;
  html = html.replace(formerOeuvre, (_block, aboutHref) => {
    const journeyHref = aboutHref.replace(/#about$/, '#journey');
    return `<a class="m-main" data-nav-role="about" href="${aboutHref}">${t.about}</a><p class="m-desc">${t.aboutDesc}</p>` +
      `<a class="m-main" data-nav-role="oeuvre" href="${journeyHref}">${t.oeuvre}</a><p class="m-desc">${t.oeuvreDesc}</p>`;
  });

  return html;
}

const homepages = new Set(['index.html', 'hu/index.html', 'de-at/index.html']);
for (const file of await walk(root)) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const original = await readFile(file, 'utf8');
  let html = replaceMenu(original, rel);
  if (homepages.has(rel)) {
    const label = copy[languageOf(rel)].heroGallery;
    html = html.replace(/<a class="btn" href="#works">[\s\S]*?<\/a>/, `<a class="btn" href="#works">${label}</a>`);
  }
  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}

const redirectsPath = path.join(root, '_redirects');
let redirects = await readFile(redirectsPath, 'utf8');
redirects = redirects.replace(/^\/norbert-banhalmi\s+\S+\s+301$/m, '/norbert-banhalmi  /#about  301');
for (const line of [
  '/hu/norbert-banhalmi  /hu/#about  301',
  '/de-at/norbert-banhalmi  /de-at/#about  301',
]) {
  if (!redirects.includes(line)) redirects = redirects.replace('/kapcsolat ', `${line}\n/kapcsolat `);
}
await writeFile(redirectsPath, redirects, 'utf8');
changed.push('_redirects');

const redirectsJsonPath = path.join(root, 'redirects.json');
const redirectsJson = JSON.parse(await readFile(redirectsJsonPath, 'utf8'));
redirectsJson.redirects['/norbert-banhalmi'] = '/#about';
redirectsJson.redirects['/hu/norbert-banhalmi'] = '/hu/#about';
redirectsJson.redirects['/de-at/norbert-banhalmi'] = '/de-at/#about';
redirectsJson.redirects = Object.fromEntries(Object.entries(redirectsJson.redirects).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(redirectsJsonPath, `${JSON.stringify(redirectsJson, null, 2)}\n`, 'utf8');
changed.push('redirects.json');

const cssPath = path.join(root, 'assets/css/museum-editorial.css');
let css = await readFile(cssPath, 'utf8');
const chronologyCss = `

/* --------------------------------------------------------------------------
   15. Canonical chronology component
   Every dated list now uses one catalogue treatment. Earlier layers styled
   the homepage journey, exhibition list and inner-page timelines differently;
   data-chronology is the component contract and order is editorial, not visual.
   ----------------------------------------------------------------------- */
html body.apple-archive .timeline[data-chronology]{
  display:block!important;
  position:relative!important;
  margin-top:clamp(2.75rem,5vw,4.75rem)!important;
  padding:0!important;
  border:0!important;
  border-top:1px solid var(--mus-hair-strong)!important;
  background:transparent!important;
}
html body.apple-archive .timeline[data-chronology]::before{content:none!important;display:none!important}
html body.apple-archive .timeline[data-chronology]>.t-item{
  display:grid!important;
  grid-template-columns:minmax(8.5rem,11.5rem) minmax(0,1fr)!important;
  column-gap:clamp(2rem,4vw,4.75rem)!important;
  row-gap:.45rem!important;
  position:relative!important;
  margin:0!important;
  padding:clamp(1.8rem,3vw,2.75rem) 0!important;
  border:0!important;
  border-bottom:1px solid var(--mus-hair)!important;
  background:transparent!important;
}
html body.apple-archive .timeline[data-chronology]>.t-item::before{content:none!important;display:none!important}
html body.apple-archive .timeline[data-chronology]>.t-item>.yr{
  grid-column:1!important;
  grid-row:1 / span 20!important;
  align-self:start!important;
  margin:0!important;
  padding-top:.16rem!important;
  color:var(--mus-gold-quiet)!important;
  font-size:.67rem!important;
  font-weight:500!important;
  line-height:1.45!important;
  letter-spacing:.18em!important;
  text-transform:uppercase!important;
  font-variant-numeric:tabular-nums!important;
}
html body.apple-archive .timeline[data-chronology]>.t-item>h3,
html body.apple-archive .timeline[data-chronology]>.t-item>p,
html body.apple-archive .timeline[data-chronology]>.t-item>.loc{
  grid-column:2!important;
  margin-left:0!important;
  margin-right:0!important;
}
html body.apple-archive .timeline[data-chronology]>.t-item>h3{
  margin-top:0!important;
  margin-bottom:.15rem!important;
  max-width:34ch!important;
}
html body.apple-archive .timeline[data-chronology]>.t-item>p{
  max-width:62ch!important;
  color:var(--mus-soft)!important;
}
html body.apple-archive .timeline[data-chronology]>.t-item>.loc{
  color:var(--mus-gold-quiet)!important;
  font-size:.72rem!important;
  line-height:1.55!important;
  letter-spacing:.035em!important;
}
@media(max-width:700px){
  html body.apple-archive .timeline[data-chronology]>.t-item{
    grid-template-columns:1fr!important;
    row-gap:.55rem!important;
    padding:1.65rem 0!important;
  }
  html body.apple-archive .timeline[data-chronology]>.t-item>.yr,
  html body.apple-archive .timeline[data-chronology]>.t-item>h3,
  html body.apple-archive .timeline[data-chronology]>.t-item>p,
  html body.apple-archive .timeline[data-chronology]>.t-item>.loc{
    grid-column:1!important;
    grid-row:auto!important;
  }
  html body.apple-archive .timeline[data-chronology]>.t-item>.yr{padding-top:0!important;margin-bottom:.1rem!important}
}
`;
if (!css.includes('15. Canonical chronology component')) {
  css += chronologyCss;
  await writeFile(cssPath, css, 'utf8');
  changed.push('assets/css/museum-editorial.css');
}

const releasePath = path.join(root, 'data/design-release.json');
const release = JSON.parse(await readFile(releasePath, 'utf8'));
release.release = '20260802-ecosystem-v20';
release.note = 'Final two-repository IA and design hardening: Gallery, About and Oeuvre are separate destinations; the canonical Person path resolves to the introduction; every data-chronology timeline uses one catalogue component; regression audits prevent navigation, redirect and write-workflow rollback.';
await writeFile(releasePath, `${JSON.stringify(release, null, 2)}\n`, 'utf8');
changed.push('data/design-release.json');

const llmsPath = path.join(root, 'llms.txt');
let llms = await readFile(llmsPath, 'utf8');
if (!llms.includes('Human-readable profile:')) {
  llms = llms.replace('Person entity: https://www.banhalmi.art/norbert-banhalmi#person\n',
    'Person entity: https://www.banhalmi.art/norbert-banhalmi#person\nHuman-readable profile: https://www.banhalmi.art/#about\nOeuvre career arc: https://www.banhalmi.art/#journey\nGallery: https://www.banhalmi.art/#works\n');
  await writeFile(llmsPath, llms, 'utf8');
  changed.push('llms.txt');
}

const aiPath = path.join(root, 'ai.txt');
let ai = await readFile(aiPath, 'utf8');
if (!ai.includes('Human-readable profile:')) {
  ai = ai.replace('\n\nPrimary machine-readable indexes:',
    '\n\nHuman-readable profile: https://www.banhalmi.art/#about\nOeuvre career arc: https://www.banhalmi.art/#journey\nGallery: https://www.banhalmi.art/#works\n\nPrimary machine-readable indexes:');
  await writeFile(aiPath, ai, 'utf8');
  changed.push('ai.txt');
}

const iaTest = `import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git','node_modules','.github','data','reports']);
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else if(e.name.endsWith('.html'))files.push(f)}}
await walk(root);
const errors=[];
for(const file of files){const rel=path.relative(root,file).replaceAll('\\\\','/');const html=await readFile(file,'utf8');if(!/class=["'][^"']*apple-archive/i.test(html)||!/id=["']menu["']/i.test(html)||/http-equiv=["']refresh["']/i.test(html))continue;for(const [role,fragment] of [['gallery','#works'],['about','#about'],['oeuvre','#journey']]){const re=new RegExp('data-nav-role=["\\\']'+role+'["\\\'][^>]*href=["\\\'][^"\\\']*'+fragment+'["\\\']','i');if(!re.test(html))errors.push(rel+': missing '+role+' menu destination '+fragment)}}
for(const [rel,anchors] of Object.entries({'index.html':['works','about','journey'],'hu/index.html':['works','about','journey'],'de-at/index.html':['works','about','journey']})){const html=await readFile(path.join(root,rel),'utf8');for(const id of anchors)if(!new RegExp('id=["\\\']'+id+'["\\\']').test(html))errors.push(rel+': missing anchor #'+id)}
const redirects=await readFile(path.join(root,'_redirects'),'utf8');if(!/^\\/norbert-banhalmi\\s+\\/#about\\s+301$/m.test(redirects))errors.push('_redirects: canonical Person route must resolve to /#about');if(/\\/about\\.html/.test(redirects))errors.push('_redirects: dead about.html target remains');
const css=await readFile(path.join(root,'assets/css/museum-editorial.css'),'utf8');if(!css.includes('15. Canonical chronology component'))errors.push('museum-editorial.css: canonical chronology component missing');
if(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Information architecture audit passed: Gallery, About, Oeuvre and Person routing are explicit in all languages.');
`;
await writeFile(path.join(root, 'tests/audit-information-architecture.mjs'), iaTest, 'utf8');
changed.push('tests/audit-information-architecture.mjs');

const workflowTest = `import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve(import.meta.dirname,'../.github/workflows');
const errors=[];
for(const name of await readdir(dir)){if(!/\\.ya?ml$/.test(name)||name.startsWith('_'))continue;const text=await readFile(path.join(dir,name),'utf8');if(/contents:\\s*write/i.test(text))errors.push(name+': contents write permission is forbidden');if(/git\\s+push/i.test(text))errors.push(name+': audit workflow must not push');if(/git\\s+commit/i.test(text))errors.push(name+': audit workflow must not commit')}
if(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Workflow safety audit passed: permanent workflows are read-only.');
`;
await writeFile(path.join(root, 'tests/audit-workflow-safety.mjs'), workflowTest, 'utf8');
changed.push('tests/audit-workflow-safety.mjs');

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
for (const cmd of ['node tests/audit-information-architecture.mjs', 'node tests/audit-workflow-safety.mjs']) {
  if (!pkg.scripts.test.includes(cmd)) pkg.scripts.test += ` && ${cmd}`;
}
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
changed.push('package.json');

const readmePath = path.join(root, 'README.md');
let readme = await readFile(readmePath, 'utf8');
if (!readme.includes('## Information architecture contract')) {
  readme += `\n## Information architecture contract\n\n- Gallery: the photographic selection at \`#works\`.\n- About: the human-readable Person profile at \`#about\`.\n- Oeuvre: the career chronology at \`#journey\`.\n- Canonical Person identifier: \`/norbert-banhalmi#person\`; the dereferenceable route redirects to \`/#about\`.\n- Every dated list with \`data-chronology\` uses the same final-layer catalogue component.\n- Permanent GitHub Actions workflows are read-only; audits may never commit or push.\n`;
  await writeFile(readmePath, readme, 'utf8');
  changed.push('README.md');
}

console.log(JSON.stringify({ changed: [...new Set(changed)].sort(), total: new Set(changed).size }, null, 2));
