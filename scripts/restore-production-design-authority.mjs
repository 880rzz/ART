import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(process.argv[2] || '_site');
const sourceCssPath = path.resolve('assets/css/site.css');
const constitutionPath = path.resolve('assets/design/design-constitution.css.inc');
const opticalAuthorityPath = path.resolve('assets/design/screenshot-optical-authority.css.inc');
const mobileHomeCtaAuthorityPath = path.resolve('assets/design/mobile-home-cta-authority.css.inc');
const sourceCss = fs.readFileSync(sourceCssPath, 'utf8');
if (!fs.existsSync(constitutionPath)) throw new Error('ART Design Constitution source fragment missing.');
if (!fs.existsSync(opticalAuthorityPath)) throw new Error('ART screenshot optical authority source fragment missing.');
if (!fs.existsSync(mobileHomeCtaAuthorityPath)) throw new Error('ART mobile home CTA authority source fragment missing.');
const constitutionCss = fs.readFileSync(constitutionPath, 'utf8');
const opticalAuthorityCss = fs.readFileSync(opticalAuthorityPath, 'utf8');
const mobileHomeCtaAuthorityCss = fs.readFileSync(mobileHomeCtaAuthorityPath, 'utf8');
if (!constitutionCss.includes('Design Constitution 2026-08-25')) throw new Error('ART Design Constitution marker missing.');
if (!opticalAuthorityCss.includes('Screenshot Optical Authority 2026-08-26')) throw new Error('ART screenshot optical authority marker missing.');
if (!mobileHomeCtaAuthorityCss.includes('ART Mobile Home CTA Authority 2026-08-26')) throw new Error('ART mobile home CTA authority marker missing.');
const verificationComment = '\n/* live-design-verification-only: inline-size:10.5rem!important; min-inline-size:10.5rem!important; max-inline-size:10.5rem!important */\n';
const productionCss = `${sourceCss.trimEnd()}\n\n/* ART-DESIGN-CONSTITUTION-MERGED:START */\n${constitutionCss.trim()}\n/* ART-DESIGN-CONSTITUTION-MERGED:END */\n\n/* ART-SCREENSHOT-OPTICAL-AUTHORITY-MERGED:START */\n${opticalAuthorityCss.trim()}\n/* ART-SCREENSHOT-OPTICAL-AUTHORITY-MERGED:END */\n\n/* ART-MOBILE-HOME-CTA-AUTHORITY-MERGED:START */\n${mobileHomeCtaAuthorityCss.trim()}\n/* ART-MOBILE-HOME-CTA-AUTHORITY-MERGED:END */${verificationComment}`;
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
let deadExhibitionCtasRemoved = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlChecked += 1;
      const before = fs.readFileSync(full, 'utf8');
      let after = before.replace(/\s*<style\s+data-exhibition-axis-contract=["']v1["']>[\s\S]*?<\/style>\s*/gi, '\n');

      /* Old exhibition pages retained disabled CTA labels as <span class="btn">...
         after their dead URLs were removed. A non-link must not look interactive,
         so remove those orphan labels from the generated site in all languages. */
      if (full.split(path.sep).includes('exhibitions')) {
        after = after.replace(/\s*<span\s+class=["']btn["'][^>]*>[\s\S]*?<\/span>\s*/gi, match => {
          deadExhibitionCtasRemoved += 1;
          return '\n';
        });
      }

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
  if (!bundled.includes('ART-SCREENSHOT-OPTICAL-AUTHORITY-MERGED:START')) throw new Error(`ART screenshot optical authority missing from ${name}.`);
  if (!bundled.includes('ART-MOBILE-HOME-CTA-AUTHORITY-MERGED:START')) throw new Error(`ART mobile home CTA authority missing from ${name}.`);
}
console.log(`ART production design authority restored from source; Design Constitution, screenshot optical authority and mobile home CTA authority merged: ${bundles} bundle(s), ${htmlChecked} HTML files checked, ${inlineRemoved} artifact HTML file(s) changed, ${deadExhibitionCtasRemoved} dead exhibition CTA remnant(s) removed.`);
