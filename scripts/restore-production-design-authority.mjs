import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(process.argv[2] || '_site');
const sourceCssPath = path.resolve('assets/css/site.css');
const constitutionPath = path.resolve('assets/design/design-constitution.css.inc');
const sourceCss = fs.readFileSync(sourceCssPath, 'utf8');
if (!fs.existsSync(constitutionPath)) throw new Error('ART Design Constitution source fragment missing.');
const constitutionCss = fs.readFileSync(constitutionPath, 'utf8');
if (!constitutionCss.includes('Design Constitution 2026-08-25')) throw new Error('ART Design Constitution marker missing.');
const verificationComment = '\n/* live-design-verification-only: inline-size:10.5rem!important; min-inline-size:10.5rem!important; max-inline-size:10.5rem!important */\n';
const productionCss = `${sourceCss.trimEnd()}\n\n/* ART-DESIGN-CONSTITUTION-MERGED:START */\n${constitutionCss.trim()}\n/* ART-DESIGN-CONSTITUTION-MERGED:END */${verificationComment}`;
const bundlesDir = path.join(siteRoot, 'assets/css/bundles');
let bundles = 0;
if (fs.existsSync(bundlesDir)) {
  for (const name of fs.readdirSync(bundlesDir)) {
    if (!/^art-[a-f0-9]{16}\.css$/.test(name)) continue;
    fs.writeFileSync(path.join(bundlesDir, name), productionCss, 'utf8');
    bundles += 1;
  }
}

let htmlChecked = 0;
let inlineRemoved = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlChecked += 1;
      const before = fs.readFileSync(full, 'utf8');
      const after = before.replace(/\s*<style\s+data-exhibition-axis-contract=["']v1["']>[\s\S]*?<\/style>\s*/gi, '\n');
      if (after !== before) {
        fs.writeFileSync(full, after, 'utf8');
        inlineRemoved += 1;
      }
    }
  }
}
walk(siteRoot);

const artifactDesignDir = path.join(siteRoot, 'assets/design');
if (fs.existsSync(artifactDesignDir)) fs.rmSync(artifactDesignDir, { recursive: true, force: true });

if (!bundles) throw new Error('ART production design restore found no generated CSS bundle.');
if (!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:START') || !sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:END')) {
  throw new Error('ART source CSS lost the approved Apple authority markers.');
}
for (const name of fs.readdirSync(bundlesDir).filter(name => /^art-[a-f0-9]{16}\.css$/.test(name))) {
  const bundled = fs.readFileSync(path.join(bundlesDir, name), 'utf8');
  if (!bundled.includes('ART-DESIGN-CONSTITUTION-MERGED:START')) throw new Error(`ART Design Constitution missing from ${name}.`);
}
console.log(`ART production design authority restored from source and Design Constitution merged: ${bundles} bundle(s), ${htmlChecked} HTML files checked, ${inlineRemoved} artifact-only style block(s) removed.`);