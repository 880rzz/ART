import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const cssPath='assets/css/museum-editorial.css';
const configPath='data/design-release.json';
const marker='/* STAGE40-MENU-FOOTER-SURFACE:START */';
let css=fs.readFileSync(cssPath,'utf8');
if(css.includes(marker)) throw new Error('Stage 40 menu/footer surface already exists');
const footerSurface=`radial-gradient(circle at 50% -25%,rgba(183,156,68,.10),transparent 42%),linear-gradient(180deg,#24231f 0%,#171612 100%)`;
const block=`\n\n${marker}\n/* Menu and footer are one visual bookend: identical opaque surface, no blur. */\nhtml body.apple-archive #menu{\n  background:${footerSurface}!important;\n  backdrop-filter:none!important;\n  -webkit-backdrop-filter:none!important;\n}\nhtml body.apple-archive.menu-open #menu{background:${footerSurface}!important}\n/* STAGE40-MENU-FOOTER-SURFACE:END */\n`;
fs.writeFileSync(cssPath,css+block);

const hash=createHash('sha256');
for(const name of fs.readdirSync('assets/css').filter(f=>f.endsWith('.css')).sort()) hash.update(fs.readFileSync(path.join('assets/css',name)));
for(const name of fs.readdirSync('assets/js').filter(f=>f.endsWith('.js')).sort()) hash.update(fs.readFileSync(path.join('assets/js',name)));
const digest=hash.digest('hex').slice(0,16);
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
config.release='20260807-menu-footer-surface-v53';
config.note='Menu/footer surface release: ART menu uses the exact footer surface with no blur while the Stage 39 canonical UI contract remains final for layout components.';
config.assetDigest=digest;
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
console.log(`Stage 40 menu/footer surface appended; digest ${digest}.`);
