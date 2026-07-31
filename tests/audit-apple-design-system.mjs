import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');const files=[];const failures=[];const langs=new Set();
/* The cache-busting release token is owned by data/design-release.json and
   applied by scripts/bump-editorial-release-cache.mjs. Reading it here keeps
   the audit honest without needing an edit every time a stylesheet changes. */
const {release}=JSON.parse(await readFile(path.join(root,'data/design-release.json'),'utf8'));
async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){if(['.git','node_modules','.github','data'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())await walk(f);else if(e.name.endsWith('.html'))files.push(f);}}
await walk(root);
for(const file of files){const rel=path.relative(root,file).replaceAll(path.sep,'/');const s=await readFile(file,'utf8');
  const isRedirect=/http-equiv=["']refresh["']/i.test(s);
  if(isRedirect)continue;
  const lang=(s.match(/<html\b[^>]*lang=["']([^"']+)/i)||[])[1];if(lang)langs.add(lang.toLowerCase());else failures.push(`${rel}: missing html lang`);
  if(!s.includes(`archive-system.css?v=${release}`))failures.push(`${rel}: archive stylesheet not on the current release cache key (${release})`);
  if(!s.includes(`museum-editorial.css?v=${release}`))failures.push(`${rel}: missing museum editorial layer on the current release cache key (${release})`);
  const museumAt=s.indexOf('museum-editorial.css');
  for(const earlier of ['archive-system.css','design-refinements.css','footer-elegant.css','final-layout-fixes.css','apple-editorial-system.css','responsive-header-system.css']){
    const at=s.indexOf(earlier);
    if(at>-1&&museumAt>-1&&at>museumAt)failures.push(`${rel}: ${earlier} loads after the museum editorial layer`);
  }
  if(!/<body\b[^>]*class=["'][^"']*\bapple-archive\b/i.test(s))failures.push(`${rel}: missing apple-archive body class`);
  if(!/<main\b/i.test(s))failures.push(`${rel}: missing main landmark`);
  const h1=(s.match(/<h1\b/gi)||[]).length;if(h1!==1)failures.push(`${rel}: expected exactly one h1, found ${h1}`);
  if(/class=["'][^"']*(?:collage|masonry|strip|gallery)[^"']*["']/i.test(s)&&!/data-gallery=["']reference["']/i.test(s))failures.push(`${rel}: gallery not normalized`);
  if(/style=["'][^"']*font-family\s*:\s*(?:Times|Georgia|serif)/i.test(s))failures.push(`${rel}: conflicting inline serif typography`);
  if(/overflow-y\s*:\s*(?:auto|scroll)/i.test((s.match(/#menu[^}]*}/gi)||[]).join('')))failures.push(`${rel}: scrollable desktop menu rule remains inline`);
}
for(const expected of ['en','hu','de'])if(![...langs].some(x=>x.startsWith(expected)))failures.push(`language coverage missing: ${expected}`);
const css=await readFile(path.join(root,'assets/css/archive-system.css'),'utf8');
for(const token of ['body.apple-archive','-apple-system','--art-body-leading:1.58','height:100dvh','overflow:hidden!important','body.apple-archive:not(.menu-open) #menu','body.apple-archive.menu-open #menu','grid-template-columns:repeat(3,minmax(0,1fr))','@media (max-width:900px)','@media (max-width:560px)','prefers-reduced-motion'])if(!css.includes(token))failures.push(`archive-system.css missing ${token}`);
if(!/\.mwrap>div:not\(\.m-foot\)\{display:block!important/i.test(css))failures.push('archive-system.css: desktop menu columns are not structurally preserved');
if(!/#menu details\{display:none!important/i.test(css))failures.push('archive-system.css: desktop menu still exposes scroll-producing catalogue accordions');
if(!/#menu \.m-main\{[^}]*color:var\(--art-gold\)!important/i.test(css))failures.push('archive-system.css: desktop menu titles are not gold');
if(!/#menu \.m-desc\{[^}]*color:var\(--art-ink\)!important/i.test(css))failures.push('archive-system.css: desktop menu descriptions are not white');
if(!/main nav\{[^}]*position:static!important/i.test(css))failures.push('archive-system.css: in-content navigation may be fixed over the desktop menu');
if(/\.timeline>\.t-item\{display:block;grid-template-columns:none/i.test(css))failures.push('archive-system.css: homepage timeline has been flattened by a global override');
if(/\.archive-source-hub>a:nth-child\(5\):last-child\{grid-column:1\/-1\}/i.test(css))failures.push('archive-system.css: source hub contains a page-wide orphan-card override');
if(!/#galwrap>\.gal-batch\[hidden\][^{]*\{display:none!important\}/i.test(css))failures.push('archive-system.css: hidden progressive gallery batches can be exposed by the global gallery rule');
if(!/#galwrap>\.gal-batch\{display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/i.test(css))failures.push('archive-system.css: homepage gallery does not preserve the three-column reference grid');
if(/footer \.socials\{display:grid!important/i.test(css))failures.push('archive-system.css: footer is being replaced by a global card grid');
if(!/\.presence-context--intro \.wrap\{text-align:center\}/i.test(css))failures.push('archive-system.css: the approved presence block alignment is missing');
if(/main \.intro,[^}]*\.statement/i.test(css))failures.push('archive-system.css: global text centering can displace page content');
if(!/h1\{[^}]*line-height:1\.025!important/i.test(css))failures.push('archive-system.css: display heading rhythm not enforced');
if(!/main>section\+section\{border-top:/i.test(css))failures.push('archive-system.css: section separation not enforced');
for(const f of failures)console.error('FAIL',f);console.log(`Apple design audit checked ${files.length} HTML files across ${[...langs].sort().join(', ')}.`);if(failures.length)process.exitCode=1;
