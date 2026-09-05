import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { hardenMachineLayer } from './harden-machine-layer.mjs';
import { hardenProductionArtifact } from './harden-production-artifact.mjs';

const siteRoot = path.resolve(process.argv[2] || '_site');
const sourceCssPath = path.resolve('assets/css/site.css');
const sourceCss = fs.readFileSync(sourceCssPath, 'utf8');
const design = JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));

/* assets/css/site.css remains the auditable compatibility template. The Pages
   artifact is compiled from the machine-readable design authority after CSS
   bundling and then content-hashed again. The compiler emits one deterministic
   closing authority in the same stylesheet; it never injects runtime CSS or a
   second stylesheet. */

function replaceRequired(css,re,replacement,label){
  if(!re.test(css)) throw new Error(`ART design compiler target missing: ${label}`);
  re.lastIndex=0;
  return css.replace(re,replacement);
}

function compileMuseumAuthority(css){
  if(!css.includes('body.apple-archive')) return {css,changed:false};
  const t=design.typography,r=design.rhythm,d=design.desktop;
  let out=css;
  out=replaceRequired(out,/--apple-page-max:1200px;/,`--apple-page-max:${design.pageMaxPx}px;`,'page max');
  out=replaceRequired(out,/--mus-section:clamp\(5rem,9vw,10rem\);/,`--mus-section:${r.section};`,'museum section rhythm');
  out=replaceRequired(out,/body\.apple-archive h1\{font-size:clamp\(2\.1rem,3\.5vw,3\.55rem\);/,`body.apple-archive h1{font-size:${t.h1};`,'museum H1 scale');
  out=replaceRequired(out,/body\.apple-archive h2\{font-size:clamp\(1\.55rem,2\.4vw,2\.4rem\);/,`body.apple-archive h2{font-size:${t.h2};`,'museum H2 scale');
  out=replaceRequired(out,/body\.apple-archive h3\{font-size:clamp\(1\.02rem,\.9vw,1\.2rem\);/,`body.apple-archive h3{font-size:${t.h3};`,'museum H3 scale');

  const marker='/* ART-MACHINE-DESIGN-AUTHORITY */';
  out=out.replace(/\/\* ART-MACHINE-DESIGN-AUTHORITY \*\/[\s\S]*$/,'').trim();
  const generated=`${marker}\n@media(min-width:901px){\n  body.apple-archive main :is(.intro,.section-head,.section-intro,.curatorial-periods__intro,.life-journey__intro){margin-left:0!important;margin-right:0!important;text-align:${d.introAlignment}!important;}\n  body.apple-archive main :is(.intro,.section-head,.section-intro,.curatorial-periods__intro,.life-journey__intro)>:is(.label,.eyebrow,.kicker,h1,h2,h3,p,.lead){margin-left:0!important;margin-right:0!important;text-align:${d.introAlignment}!important;}\n  body.apple-archive[data-archive-page="press"] main.press-redesign .press-shell,\n  body.apple-archive[data-archive-page="press"] main.press-redesign .wrap{width:min(calc(100% - ${d.gutterPx*2}px),${d.structuredMaxPx}px)!important;max-width:${d.structuredMaxPx}px!important;}\n  body.apple-archive[data-archive-page="press"] main .press-archive-disclosure>.press-records{width:100%!important;max-width:none!important;margin-inline:0!important;}\n}\n`;
  out=`${out}\n${generated}`;
  return {css:out,changed:true};
}

const bundlesDir = path.join(siteRoot, 'assets/css/bundles');
const bundleRenames = new Map();
let bundles = 0, compiledBundles = 0;
if (fs.existsSync(bundlesDir)) for (const name of fs.readdirSync(bundlesDir)) {
  if (!/^art-[a-f0-9]{16}\.css$/.test(name)) continue;
  const oldPath = path.join(bundlesDir,name);
  const optimizedBase = fs.readFileSync(oldPath,'utf8').trim();
  const compiled = compileMuseumAuthority(optimizedBase);
  const finalCss = `${compiled.css.trim()}\n`;
  const hash = createHash('sha256').update(finalCss).digest('hex').slice(0,16);
  const newName = `art-${hash}.css`;
  const newPath = path.join(bundlesDir,newName);
  fs.writeFileSync(newPath,finalCss,'utf8');
  if(newName!==name){
    bundleRenames.set(`/assets/css/bundles/${name}`,`/assets/css/bundles/${newName}`);
    fs.rmSync(oldPath,{force:true});
  }
  bundles += 1;
  if(compiled.changed) compiledBundles += 1;
}

let htmlChecked = 0, fullDocuments = 0, inlineRemoved = 0, deadExhibitionCtasRemoved = 0, bundleRefsUpdated = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlChecked += 1;
      const before = fs.readFileSync(full,'utf8');
      let after = before.replace(/\s*<style\s+data-exhibition-axis-contract=["']v1["']>[\s\S]*?<\/style>\s*/gi,'\n');
      if (full.split(path.sep).includes('exhibitions')) after = after.replace(/\s*<span\s+class=["']btn["'][^>]*>[\s\S]*?<\/span>\s*/gi,()=>{deadExhibitionCtasRemoved+=1;return '\n';});
      for(const [oldHref,newHref] of bundleRenames){
        if(after.includes(oldHref)){after=after.split(oldHref).join(newHref);bundleRefsUpdated+=1;}
      }
      const isFullDocument = /<html\b/i.test(after) && /<head\b/i.test(after) && /<\/head>/i.test(after);
      if (isFullDocument) {
        fullDocuments += 1;
        after = after.replace(/\s*<style\s+data-art-runtime-typography-closure=["'][^"']+["']>[\s\S]*?<\/style>\s*/gi,'');
      }
      if (after !== before) { fs.writeFileSync(full,after,'utf8'); inlineRemoved += 1; }
    }
  }
}
walk(siteRoot);
hardenMachineLayer(siteRoot);
hardenProductionArtifact(siteRoot);

const protectedFiles = {
  'llms.txt': ['Q138482177', 'Bánhalmi Norbert founded HIPStudio', 'does not imply current ownership'],
  'ai.txt': ['Q138482177', 'Bánhalmi Norbert founded HIPStudio', 'does not imply current ownership'],
  'person-authority.jsonld': ['Q138482177', 'founded HIPStudio', 'does not imply current ownership'],
  'ecosystem-bridge.jsonld': ['Q138482177', 'founded HIPStudio', 'does not imply current ownership'],
  'professional-llm-mirror.json': [
    'Q138482177',
    'hipstudioFounderAuthority',
    "Bánhalmi Norbert and Speier Vikó are HIPStudio's main professional photographer partners",
    'Speier Vikó is the photography-services contact',
    '1111 Budapest, Lágymányosi utca 15.',
    'shared address or Google Business Profile presence does not merge the entities'
  ]
};
for (const [rel, tokens] of Object.entries(protectedFiles)) {
  const file = path.join(siteRoot, rel);
  if (!fs.existsSync(file)) throw new Error(`ART protected authority file missing from artifact: ${rel}`);
  const text = fs.readFileSync(file, 'utf8');
  for (const token of tokens) if (!text.includes(token)) throw new Error(`${rel}: protected HIPStudio authority token missing after artifact hardening: ${token}`);
}

const artifactDesignDir = path.join(siteRoot,'assets/design');
if (fs.existsSync(artifactDesignDir)) fs.rmSync(artifactDesignDir,{recursive:true,force:true});
if (!bundles) throw new Error('ART production design restore found no generated CSS bundle.');
if (!compiledBundles) throw new Error('ART production design compiler found no museum bundle to compile.');
if (!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:START') || !sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:END')) throw new Error('ART source CSS lost the approved Apple authority markers.');
for(const newHref of bundleRenames.values()){
  const full=path.join(siteRoot,newHref.replace(/^\//,''));
  if(!fs.existsSync(full)) throw new Error(`ART re-hashed design bundle missing: ${newHref}`);
  const css=fs.readFileSync(full,'utf8');
  if(!css.includes('ART-MACHINE-DESIGN-AUTHORITY')) throw new Error(`ART machine design authority missing from ${newHref}`);
}
console.log(`ART production design compiled from ${design.version}: ${compiledBundles}/${bundles} bundle(s) recompiled and content-hashed; ${htmlChecked} HTML files checked, ${bundleRefsUpdated} bundle reference update(s), ${fullDocuments} full documents, ${inlineRemoved} artifact HTML file(s) normalized, ${deadExhibitionCtasRemoved} dead exhibition CTA remnant(s) removed. HIPStudio founder and stable photographer-partner authority survived artifact regeneration.`);
