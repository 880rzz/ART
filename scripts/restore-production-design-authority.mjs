import fs from 'node:fs';
import path from 'node:path';
import { hardenMachineLayer } from './harden-machine-layer.mjs';
import { hardenProductionArtifact } from './harden-production-artifact.mjs';

const siteRoot = path.resolve(process.argv[2] || '_site');
const sourceCssPath = path.resolve('assets/css/site.css');
const sourceCss = fs.readFileSync(sourceCssPath, 'utf8');

/* Presentation is owned by the committed source stylesheet. Production may
   minify it, but must never append fragments or inject runtime CSS. */

const bundlesDir = path.join(siteRoot, 'assets/css/bundles');
let bundles = 0;
if (fs.existsSync(bundlesDir)) for (const name of fs.readdirSync(bundlesDir)) {
  if (!/^art-[a-f0-9]{16}\.css$/.test(name)) continue;
  const bundlePath = path.join(bundlesDir, name);
  const optimizedBase = fs.readFileSync(bundlePath, 'utf8').trim();
  fs.writeFileSync(bundlePath, `${optimizedBase}\n`, 'utf8');
  bundles += 1;
}

let htmlChecked = 0, fullDocuments = 0, inlineRemoved = 0, deadExhibitionCtasRemoved = 0, runtimeClosuresInjected = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlChecked += 1;
      const before = fs.readFileSync(full,'utf8');
      let after = before.replace(/\s*<style\s+data-exhibition-axis-contract=["']v1["']>[\s\S]*?<\/style>\s*/gi,'\n');
      if (full.split(path.sep).includes('exhibitions')) after = after.replace(/\s*<span\s+class=["']btn["'][^>]*>[\s\S]*?<\/span>\s*/gi,()=>{deadExhibitionCtasRemoved+=1;return '\n';});
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

/* Anti-rollback authority gate. The machine hardener intentionally regenerates
   llms.txt and ai.txt inside the immutable artifact. These assertions ensure
   that regeneration cannot silently drop the current HIPStudio founder model
   or the stable photographer-partner relationship mirror. */
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
if (!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:START') || !sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:END')) throw new Error('ART source CSS lost the approved Apple authority markers.');
console.log(`ART canonical production design preserved without appended or runtime CSS: ${bundles} bundle(s), ${htmlChecked} HTML files checked, ${fullDocuments} full documents, ${inlineRemoved} artifact HTML file(s) normalized, ${deadExhibitionCtasRemoved} dead exhibition CTA remnant(s) removed. HIPStudio founder and stable photographer-partner authority survived artifact regeneration.`);
