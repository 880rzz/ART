import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { hardenMachineLayer } from './harden-machine-layer.mjs';
import { hardenProductionArtifact } from './harden-production-artifact.mjs';

const siteRoot = path.resolve(process.argv[2] || '_site');
const sourceCssPath = path.resolve('assets/css/site.css');
const sourceCss = fs.readFileSync(sourceCssPath, 'utf8');
const design = JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));

/* assets/css/site.css is the single committed visual authority. Bundling and
   hashing may change its filename, never its rules. All geometry is reviewed
   in source and is identical before and after artifact preparation. */

// Production validates the committed authority; it cannot invent design rules.
function validateMuseumAuthority(css){
  if(!css.includes('body.apple-archive')) return {css,validated:false};
  for(const [token,key] of [['--art-page-title','h1'],['--art-section-title','h2'],['--art-chapter-title','h3'],['--art-lead','lead'],['--art-body','body']]){
    if(!css.includes(token+':'+design.typography[key])) throw new Error('ART canonical typography token mismatch: '+token);
  }
  if(!css.includes('.linklist>li{width:100%!important;max-width:var(--art-writing-record-max,none)!important;}')) throw new Error('Committed structured-canvas contract missing');
  return {css,validated:true};
}

const bundlesDir = path.join(siteRoot, 'assets/css/bundles');
const bundleRenames = new Map();
let bundles = 0, validatedBundles = 0;
if (fs.existsSync(bundlesDir)) for (const name of fs.readdirSync(bundlesDir)) {
  if (!/^art-[a-f0-9]{16}\.css$/.test(name)) continue;
  const oldPath = path.join(bundlesDir,name);
  const optimizedBase = fs.readFileSync(oldPath,'utf8').trim();
  const compiled = validateMuseumAuthority(optimizedBase);
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
  if(compiled.validated) validatedBundles += 1;
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
if (!validatedBundles) throw new Error('ART production design compiler found no museum bundle to compile.');
if (!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:START') || !sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:END')) throw new Error('ART source CSS lost the approved Apple authority markers.');
for(const newHref of bundleRenames.values()){
  const full=path.join(siteRoot,newHref.replace(/^\//,''));
  if(!fs.existsSync(full)) throw new Error(`ART re-hashed design bundle missing: ${newHref}`);
  const css=fs.readFileSync(full,'utf8');
  for(const required of [
    '.writing-page>section.wrap.narrow',
    `max-width:${design.desktop.writingStructuredMaxPx}px!important`,
    `max-width:${design.desktop.sourceHubStructuredMaxPx}px!important`,
    `max-width:${design.desktop.curatorsStructuredMaxPx}px!important`,
    `max-width:${design.desktop.proseMeasure}!important`,
    '.linklist>li{width:100%!important;max-width:var(--art-writing-record-max,none)!important;}',
    '.archive-source-hub{width:100%!important;max-width:none!important;'
  ]) if(!css.includes(required)) throw new Error(`ART machine design contract missing from ${newHref}: ${required}`);
}
console.log(`ART production design validated against ${design.version}: ${validatedBundles}/${bundles} bundle(s) validated and content-hashed; ${htmlChecked} HTML files checked, ${bundleRefsUpdated} bundle reference update(s), ${fullDocuments} full documents, ${inlineRemoved} artifact HTML file(s) normalized, ${deadExhibitionCtasRemoved} dead exhibition CTA remnant(s) removed. Structured Writing/source-hub/Curators geometry is enforced on the rendered component, not only its outer wrapper.`);