import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const cssPath=path.join(root,'assets/css/apple-ux-redesign.css');
const navPath=path.join(root,'assets/css/navigation-upgrade.css');
const runtimePath=path.join(root,'assets/js/runtime-enhancements.js');
const errors=[];

if(!fs.existsSync(cssPath))errors.push('missing Apple UX stylesheet');
if(!fs.existsSync(navPath))errors.push('missing navigation stylesheet');
if(!fs.existsSync(runtimePath))errors.push('missing runtime enhancements');

const css=fs.existsSync(cssPath)?fs.readFileSync(cssPath,'utf8'):'';
const nav=fs.existsSync(navPath)?fs.readFileSync(navPath,'utf8'):'';
const runtime=fs.existsSync(runtimePath)?fs.readFileSync(runtimePath,'utf8'):'';

const requiredTokens=[
  '--ux-bg:#f5f5f7','--ux-surface:#ffffff','--ux-ink:#1d1d1f','--ux-muted:#6e6e73',
  '--ux-page:min(1180px,calc(100vw - 48px))','--ux-section:clamp(64px,8vw,112px)',
  'min-height:44px','env(safe-area-inset-left)','env(safe-area-inset-right)',
  '@media(max-width:760px)','grid-template-columns:1fr!important','overflow-x:auto!important',
  '@media(prefers-reduced-motion:reduce)','@media(prefers-contrast:more)'
];
for(const token of requiredTokens)if(!css.includes(token))errors.push(`missing UX source contract: ${token}`);
if(nav.includes('@import url("apple-ux-redesign.css'))errors.push('legacy Apple UX stylesheet must not be runtime-imported after the active Celtic theme');
if(!nav.includes('apple-ux-redesign.css is intentionally NOT imported here'))errors.push('missing explicit CSS-order regression guard');

const menuContracts=[
  '.menu-toggle{',
  'display:none!important',
  '.menu-toggle{display:inline-flex!important}',
  'nav.tabs.open,nav.tabs[aria-hidden="false"]{display:flex!important}',
  'width:calc(100% - 24px)!important',
  'min-height:46px!important',
  'background:rgba(5,24,17,.98)!important'
];
for(const token of menuContracts)if(!nav.includes(token))errors.push(`mobile menu contract missing: ${token}`);

const headerContracts=[
  '--ck-cream:#f5eedc','--ck-ink:#172019','--ck-gold:#d7a943',
  'min-height:64px!important','width:38px!important;height:38px!important',
  'width:42px!important;height:42px!important','justify-content:flex-end!important',
  'backdrop-filter:blur(18px) saturate(120%)'
];
for(const token of headerContracts)if(!nav.includes(token))errors.push(`compact header contract missing: ${token}`);

const contrastContracts=[
  'color:var(--ck-ink)!important;text-shadow:none!important',
  'color:var(--ck-cream)!important',
  '.gate-hero .brand-sub__main,.gate-hero .hero-kicker{color:var(--ck-gold-dark)!important}',
  'input,textarea,select{color:var(--ck-ink)!important;background:#fffdf7!important',
  'input::placeholder,textarea::placeholder{color:#667068!important;opacity:1}'
];
for(const token of contrastContracts)if(!nav.includes(token))errors.push(`contrast repair contract missing: ${token}`);

const runtimeContracts=[
  'const mainMenuToggle=document.getElementById("menuToggle")',
  'const mainMenu=document.getElementById("mainTabs")',
  'mainMenu.classList.toggle("open",active)',
  'mainMenu.setAttribute("aria-hidden"',
  'event.key==="Escape"',
  'mobileMenu:{installed:Boolean(mainMenuToggle&&mainMenu)'
];
for(const token of runtimeContracts)if(!runtime.includes(token))errors.push(`main menu runtime missing: ${token}`);

function rgb(hex){const v=hex.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255)}
function lum(hex){return rgb(hex).map(c=>c<=.03928?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0)}
function ratio(a,b){const [hi,lo]=[lum(a),lum(b)].sort((x,y)=>y-x);return (hi+.05)/(lo+.05)}
const checks=[
  ['cream on dark green','#f5eedc','#051811',7],
  ['dark ink on pale surface','#172019','#f5f1e7',7],
  ['gold accent on white','#765817','#ffffff',4.5],
  ['placeholder on white','#667068','#fffdf7',4.5],
  ['dark text on active gold','#171207','#d7a943',7]
];
for(const [name,fg,bg,min] of checks){const r=ratio(fg,bg);if(r<min)errors.push(`${name} contrast ${r.toFixed(2)} below ${min}`)}

if(errors.length){
  console.error(`UX design audit failed with ${errors.length} issue(s):`);
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}
console.log(`UX design audit passed: compact header, reliable mobile menu, CSS-order guard, ${contrastContracts.length} contrast contracts, ${runtimeContracts.length} runtime contracts and ${checks.length} measured contrast pairs verified.`);
