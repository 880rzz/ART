import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const pages=['index.html','hu/index.html','de-at/index.html'];
const textExt=new Set(['.css','.html','.webmanifest']);
const skip=new Set(['.git','node_modules','.github']);

const maps=[
  [/#0e0d0b/gi,'#202530'],[/#0b0a09/gi,'#202530'],[/#0a0a0a/gi,'#202530'],[/#0c0b0a/gi,'#202530'],[/#0c0c0c/gi,'#202530'],[/#111111/gi,'#202530'],[/#111\b/gi,'#202530'],[/#121212/gi,'#202530'],[/#131313/gi,'#202530'],
  [/#14120f/gi,'#29303F'],[/#141414/gi,'#29303F'],[/#151411/gi,'#29303F'],[/#151515/gi,'#29303F'],[/#18130c/gi,'#29303F'],[/#181818/gi,'#29303F'],[/#1b1b1b/gi,'#29303F'],[/#242424/gi,'#29303F'],
  [/#1a1713/gi,'#2D3444'],[/#211a11/gi,'#2D3444'],[/#2a2a2a/gi,'#2D3444'],[/#303030/gi,'#2D3444'],[/#3c3c3c/gi,'#2D3444'],
  [/rgba\(14\s*,\s*13\s*,\s*11\s*,/gi,'rgba(32,37,48,'],[/rgba\(12\s*,\s*11\s*,\s*10\s*,/gi,'rgba(32,37,48,'],[/rgba\(11\s*,\s*10\s*,\s*9\s*,/gi,'rgba(32,37,48,']
];

async function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()){await walk(full);continue;}
    if(!textExt.has(path.extname(e.name)) && e.name!=='site.webmanifest') continue;
    let s=fs.readFileSync(full,'utf8'); const before=s;
    for(const [re,to] of maps)s=s.replace(re,to);
    if(s!==before)fs.writeFileSync(full,s);
  }
}
await walk(root);

const basePath=path.join(root,'assets/css/page-base.css');
let css=fs.readFileSync(basePath,'utf8');
css=css.replace(/body>nav\{[^}]*background:[^;]+;backdrop-filter:[^;}]+/s,(m)=>m.replace(/background:[^;]+;/,'background:var(--c-ground);').replace(/backdrop-filter:[^;}]+/,'backdrop-filter:none'));
css=css.replace(/#menu\{([^}]*)background:[^;]+;backdrop-filter:[^;}]+/s,(m)=>m.replace(/background:[^;]+;/,'background:var(--c-ground);').replace(/backdrop-filter:[^;}]+/,'backdrop-filter:none'));
const heroCss=`\n/* Stage 42 — canonical Apple-like hero motion surface. The still image remains the LCP/fallback; video is decorative and appears only for fine-pointer hover. */\nheader.hero .hero-hover-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:-2;opacity:0;pointer-events:none;transition:opacity .32s ease-out}\nheader.hero.video-active .hero-hover-video{opacity:1}\nheader.hero:has(.hero-hover-video) .bg{z-index:-3!important}\n@media (hover:none),(pointer:coarse){header.hero .hero-hover-video{display:none!important}}\n@media (prefers-reduced-motion:reduce){header.hero .hero-hover-video{display:none!important}}\n`;
if(!css.includes('Stage 42 — canonical Apple-like hero motion surface')) css+=heroCss;
fs.writeFileSync(basePath,css);

const jsPath=path.join(root,'assets/js/hero-hover-video.js');
fs.writeFileSync(jsPath,`(()=>{\n  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;\n  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;\n  if(!fine||reduced)return;\n  for(const hero of document.querySelectorAll('header.hero[data-hover-video]')){\n    const video=hero.querySelector('.hero-hover-video'); if(!video)continue;\n    const start=async()=>{try{video.currentTime=0;await video.play();hero.classList.add('video-active')}catch{hero.classList.remove('video-active')}};\n    const stop=()=>{hero.classList.remove('video-active');video.pause();try{video.currentTime=0}catch{}};\n    hero.addEventListener('pointerenter',start,{passive:true});\n    hero.addEventListener('pointerleave',stop,{passive:true});\n  }\n})();\n`);

for(const rel of pages){
  const p=path.join(root,rel); let html=fs.readFileSync(p,'utf8');
  if(!/<header class="hero"/.test(html))throw new Error(rel+': homepage hero missing');
  if(!html.includes('class="hero-hover-video"')) html=html.replace(/<header class="hero"([^>]*)>/,`<header class="hero"$1 data-hover-video>\n<video class="hero-hover-video" muted playsinline loop preload="none" aria-hidden="true"><source src="/assets/video/art-hero.mp4" type="video/mp4"></video>`);
  if(!html.includes('/assets/js/hero-hover-video.js')) html=html.replace(/<\/body>/,`<script src="/assets/js/hero-hover-video.js" defer></script>\n</body>`);
  fs.writeFileSync(p,html);
}

// Extend release cache discipline to the new video asset.
const bumpPath=path.join(root,'scripts/bump-editorial-release-cache.mjs');
let bump=fs.readFileSync(bumpPath,'utf8');
if(!bump.includes('assets\\/(?:css|js|video)')){
  bump=bump.replaceAll('assets\\/(?:css|js)\\/','assets\\/(?:css|js|video)\\/').replaceAll('\\.(?:css|js)','\\.(?:css|js|mp4)');
  fs.writeFileSync(bumpPath,bump);
}
const freshnessPath=path.join(root,'tests/audit-release-freshness.mjs');
let fresh=fs.readFileSync(freshnessPath,'utf8');
if(!fresh.includes("path.join(root, 'assets/video')")){
  fresh=fresh.replace("for (const file of (await readdir(path.join(root, 'assets/js'))).filter((f) => f.endsWith('.js')).sort()) {\n  hash.update(await readFile(path.join(root, 'assets/js', file)));\n}","for (const file of (await readdir(path.join(root, 'assets/js'))).filter((f) => f.endsWith('.js')).sort()) {\n  hash.update(await readFile(path.join(root, 'assets/js', file)));\n}\nfor (const file of (await readdir(path.join(root, 'assets/video'))).filter((f) => f.endsWith('.mp4')).sort()) {\n  hash.update(await readFile(path.join(root, 'assets/video', file)));\n}");
  fresh=fresh.replaceAll('/assets\\/(?:css|js)\\/','/assets\\/(?:css|js|video)\\/').replaceAll('\\.(?:css|js)','\\.(?:css|js|mp4)');
  fs.writeFileSync(freshnessPath,fresh);
}

const testPath=path.join(root,'tests/audit-apple-surface-video-stage42.mjs');
fs.writeFileSync(testPath,`import fs from 'node:fs';import path from 'node:path';\nconst root=path.resolve(import.meta.dirname,'..');const errors=[];\nconst base=fs.readFileSync(path.join(root,'assets/css/page-base.css'),'utf8');\nfor(const t of ['--c-ground:#202530','--c-raised:#29303F','--c-panel:#2D3444','background:var(--c-ground)','hero-hover-video'])if(!base.includes(t))errors.push('page-base missing '+t);\nconst forbidden=['#0e0d0b','#0b0a09','#0a0a0a','#0c0b0a','#0c0c0c','#121212','#131313','#14120f','#151411','#18130c','#181818','#1a1713','#1b1b1b','#211a11','#242424','#3c3c3c','rgba(14,13,11,','rgba(12,11,10,','rgba(11,10,9,'];\nfunction walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(/\\.(?:css|html)$/.test(e.name)){const s=fs.readFileSync(f,'utf8').toLowerCase();for(const bad of forbidden)if(s.includes(bad))errors.push(path.relative(root,f)+': legacy dark surface remains '+bad)}}}walk(root);\nfor(const rel of ['index.html','hu/index.html','de-at/index.html']){const s=fs.readFileSync(path.join(root,rel),'utf8');if((s.match(/class="hero-hover-video"/g)||[]).length!==1)errors.push(rel+': hero video count != 1');if(!s.includes('data-hover-video'))errors.push(rel+': hover contract missing');if(!s.includes('/assets/js/hero-hover-video.js'))errors.push(rel+': hover script missing')}\nconst js=fs.readFileSync(path.join(root,'assets/js/hero-hover-video.js'),'utf8');for(const t of ['(hover:hover) and (pointer:fine)','prefers-reduced-motion','pointerenter','pointerleave'])if(!js.includes(t))errors.push('hero JS missing '+t);\nconst video=path.join(root,'assets/video/art-hero.mp4');if(!fs.existsSync(video))errors.push('hero video file missing');else if(fs.statSync(video).size>300000)errors.push('hero video exceeds 300 KB performance budget');\nif(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Stage 42 Apple surface + hover-video audit passed.');\n`);

const pkgPath=path.join(root,'package.json');const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
if(!pkg.scripts.test.includes('audit-apple-surface-video-stage42.mjs'))pkg.scripts.test+=' && node tests/audit-apple-surface-video-stage42.mjs';
fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');

// New release/digest after CSS+JS+video are all present.
const cfgPath=path.join(root,'data/design-release.json');const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8'));
cfg.release='20260807-apple-surface-hover-video-v56';
cfg.note='Stage 42: one canonical blue surface system across ART plus lazy decorative hero video on fine-pointer hover only.';
const hash=crypto.createHash('sha256');
for(const name of fs.readdirSync(path.join(root,'assets/css')).filter(x=>x.endsWith('.css')).sort())hash.update(fs.readFileSync(path.join(root,'assets/css',name)));
for(const name of fs.readdirSync(path.join(root,'assets/js')).filter(x=>x.endsWith('.js')).sort())hash.update(fs.readFileSync(path.join(root,'assets/js',name)));
for(const name of fs.readdirSync(path.join(root,'assets/video')).filter(x=>x.endsWith('.mp4')).sort())hash.update(fs.readFileSync(path.join(root,'assets/video',name)));
cfg.assetDigest=hash.digest('hex').slice(0,16);fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2)+'\n');
execFileSync('npm',['run','bump:release'],{cwd:root,stdio:'inherit'});

// One-time tooling must not survive production.
for(const rel of ['.github/workflows/stage42-one-time.yml','tools/stage42-apple-surface-video.mjs']){const p=path.join(root,rel);if(fs.existsSync(p))fs.rmSync(p)}
console.log('Stage 42 migration complete.');
