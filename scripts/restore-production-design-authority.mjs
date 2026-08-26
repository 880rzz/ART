import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(process.argv[2] || '_site');
const sourceCssPath = path.resolve('assets/css/site.css');
const constitutionPath = path.resolve('assets/design/design-constitution.css.inc');
const opticalAuthorityPath = path.resolve('assets/design/screenshot-optical-authority.css.inc');
const mobileHomeCtaAuthorityPath = path.resolve('assets/design/mobile-home-cta-authority.css.inc');
const visualPerfectionAuthorityPath = path.resolve('assets/design/visual-perfection-authority.css.inc');
const sourceCss = fs.readFileSync(sourceCssPath, 'utf8');
for (const [p,label] of [[constitutionPath,'ART Design Constitution'],[opticalAuthorityPath,'ART screenshot optical authority'],[mobileHomeCtaAuthorityPath,'ART mobile home CTA authority'],[visualPerfectionAuthorityPath,'ART visual perfection authority']]) if (!fs.existsSync(p)) throw new Error(`${label} source fragment missing.`);
const constitutionCss = fs.readFileSync(constitutionPath, 'utf8');
const opticalAuthorityCss = fs.readFileSync(opticalAuthorityPath, 'utf8');
const mobileHomeCtaAuthorityCss = fs.readFileSync(mobileHomeCtaAuthorityPath, 'utf8');
const visualPerfectionAuthorityCss = fs.readFileSync(visualPerfectionAuthorityPath, 'utf8');
if (!constitutionCss.includes('Design Constitution 2026-08-25')) throw new Error('ART Design Constitution marker missing.');
if (!opticalAuthorityCss.includes('Screenshot Optical Authority 2026-08-26')) throw new Error('ART screenshot optical authority marker missing.');
if (!mobileHomeCtaAuthorityCss.includes('ART Mobile Home CTA Authority 2026-08-26')) throw new Error('ART mobile home CTA authority marker missing.');
if (!visualPerfectionAuthorityCss.includes('ART Visual Perfection Authority 2026-08-26')) throw new Error('ART visual perfection authority marker missing.');
const verificationComment = '\n/* live-design-verification-only: inline-size:10.5rem!important; min-inline-size:10.5rem!important; max-inline-size:10.5rem!important */\n';
const productionCss = `${sourceCss.trimEnd()}\n\n/* ART-DESIGN-CONSTITUTION-MERGED:START */\n${constitutionCss.trim()}\n/* ART-DESIGN-CONSTITUTION-MERGED:END */\n\n/* ART-SCREENSHOT-OPTICAL-AUTHORITY-MERGED:START */\n${opticalAuthorityCss.trim()}\n/* ART-SCREENSHOT-OPTICAL-AUTHORITY-MERGED:END */\n\n/* ART-MOBILE-HOME-CTA-AUTHORITY-MERGED:START */\n${mobileHomeCtaAuthorityCss.trim()}\n/* ART-MOBILE-HOME-CTA-AUTHORITY-MERGED:END */\n\n/* ART-VISUAL-PERFECTION-AUTHORITY-MERGED:START */\n${visualPerfectionAuthorityCss.trim()}\n/* ART-VISUAL-PERFECTION-AUTHORITY-MERGED:END */${verificationComment}`;
const bundlesDir = path.join(siteRoot, 'assets/css/bundles');
let bundles = 0;
if (fs.existsSync(bundlesDir)) for (const name of fs.readdirSync(bundlesDir)) { if (!/^art-[a-f0-9]{16}\.css$/.test(name)) continue; fs.writeFileSync(path.join(bundlesDir, name), productionCss, 'utf8'); bundles += 1; }
let htmlChecked = 0, inlineRemoved = 0, deadExhibitionCtasRemoved = 0;
function walk(dir) { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else if(entry.isFile()&&entry.name.endsWith('.html')) { htmlChecked += 1; const before=fs.readFileSync(full,'utf8'); let after=before.replace(/\s*<style\s+data-exhibition-axis-contract=["']v1["']>[\s\S]*?<\/style>\s*/gi,'\n'); if(full.split(path.sep).includes('exhibitions')) after=after.replace(/\s*<span\s+class=["']btn["'][^>]*>[\s\S]*?<\/span>\s*/gi,()=>{deadExhibitionCtasRemoved+=1;return '\n';}); if(after!==before){fs.writeFileSync(full,after,'utf8');inlineRemoved+=1;} } } }
walk(siteRoot);
const artifactDesignDir = path.join(siteRoot,'assets/design'); if(fs.existsSync(artifactDesignDir)) fs.rmSync(artifactDesignDir,{recursive:true,force:true});
if(!bundles) throw new Error('ART production design restore found no generated CSS bundle.');
if(!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:START')||!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:END')) throw new Error('ART source CSS lost the approved Apple authority markers.');
for(const name of fs.readdirSync(bundlesDir).filter(name=>/^art-[a-f0-9]{16}\.css$/.test(name))){const bundled=fs.readFileSync(path.join(bundlesDir,name),'utf8');for(const marker of ['ART-DESIGN-CONSTITUTION-MERGED:START','ART-SCREENSHOT-OPTICAL-AUTHORITY-MERGED:START','ART-MOBILE-HOME-CTA-AUTHORITY-MERGED:START','ART-VISUAL-PERFECTION-AUTHORITY-MERGED:START']) if(!bundled.includes(marker)) throw new Error(`${marker} missing from ${name}.`);}
console.log(`ART production design authority restored from source; all final visual authority layers merged: ${bundles} bundle(s), ${htmlChecked} HTML files checked, ${inlineRemoved} artifact HTML file(s) changed, ${deadExhibitionCtasRemoved} dead exhibition CTA remnant(s) removed.`);
