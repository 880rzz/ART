import fs from 'node:fs';

const pages=['press.html','hu/press.html','de-at/press.html'];
const markerStart='/* PRESS-EDITORIAL-REDESIGN-AUTHORITY:START */';
const markerEnd='/* PRESS-EDITORIAL-REDESIGN-AUTHORITY:END */';
const contractEnd='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';

// Recovered verbatim from the last known-good multilingual Press source before the
// clean-architecture consolidation (commit d169642e1d56828eb1b695bf1af2afbc5d455769).
// This makes the migration deterministic even when a previous partial cleanup has
// already removed the three identical inline blocks but failed to persist them.
const recovered=`.press-redesign{--press-ink:#29303F;--press-muted:#626262;--press-paper:#fff;--press-warm:#f2efe8;--press-line:rgba(21,21,21,.18);--press-gold:#DCC56B;color:var(--press-ink);background:var(--press-paper)}
.press-redesign *{box-sizing:border-box}
.press-redesign .press-shell,.press-redesign .wrap{width:min(var(--bn-content-wide,1180px),calc(100% - (2 * var(--art-gutter,28px))));margin-inline:auto}
.press-redesign .press-hero{margin:0;padding:clamp(5rem,10vw,9rem) 0 clamp(3.5rem,7vw,6rem);background:#202530;color:#fff}
.press-redesign .press-hero .press-shell{display:grid;gap:clamp(1.4rem,3vw,2.4rem)}
.press-redesign .press-kicker,.press-redesign .press-overview__eyebrow{margin:0;font-size:.76rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.press-redesign .press-kicker{color:var(--press-gold)}
.press-redesign .press-hero h1{max-width:13ch;margin:0;font-size:clamp(2.85rem,7vw,6.9rem);font-weight:500;line-height:.94;letter-spacing:-.055em;text-wrap:balance;color:#fff}
.press-redesign .press-hero__lead{max-width:780px;margin:0;font-size:clamp(1.08rem,2vw,1.42rem);line-height:1.55;color:rgba(255,255,255,.78)}
.press-redesign .press-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin-top:clamp(1rem,3vw,2.5rem);border-top:1px solid rgba(255,255,255,.22)}
.press-redesign .press-fact{padding:1.35rem 1.25rem 0 0}
.press-redesign .press-fact strong{display:block;margin-bottom:.32rem;font-size:clamp(1.45rem,3vw,2.35rem);font-weight:500;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.press-redesign .press-fact span{display:block;font-size:.82rem;line-height:1.4;color:rgba(255,255,255,.62)}
.press-redesign .press-overview{padding:clamp(3rem,6vw,5.5rem) 0;background:var(--press-warm)}
.press-redesign .press-overview__grid{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:clamp(2rem,7vw,7rem);align-items:start}
.press-redesign .press-overview__eyebrow{color:#77621e}
.press-redesign .press-overview h2{max-width:15ch;margin:.75rem 0 1rem;font-size:clamp(2rem,4vw,3.7rem);font-weight:500;line-height:1.02;letter-spacing:-.035em;text-wrap:balance}
.press-redesign .press-overview p{max-width:650px;margin:0;color:#4f4f4f;font-size:1.03rem;line-height:1.7}
.press-redesign .press-period-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--press-line)}
.press-redesign .press-period-nav a{display:grid;grid-template-columns:2.2rem minmax(0,1fr);gap:.85rem;align-items:start;padding:1.15rem .75rem 1.15rem 0;border-bottom:1px solid var(--press-line);color:var(--press-ink);text-decoration:none}
.press-redesign .press-period-nav a:nth-child(odd){margin-right:1.4rem}
.press-redesign .press-period-nav a:hover .press-period-nav__title,.press-redesign .press-period-nav a:focus-visible .press-period-nav__title{text-decoration:underline;text-underline-offset:.22em}
.press-redesign .press-period-nav__index{font-size:.72rem;line-height:1.6;color:#77621e;font-variant-numeric:tabular-nums}
.press-redesign .press-period-nav__copy{display:grid;gap:.15rem;min-width:0}
.press-redesign .press-period-nav__range{font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--press-muted)}
.press-redesign .press-period-nav__title{font-size:1rem;font-weight:650;line-height:1.35}
.press-redesign .press-records{display:block}
.press-redesign .press-period{margin:0;padding:clamp(4rem,8vw,7.5rem) 0;background:#fff;scroll-margin-top:1.5rem}
.press-redesign .press-period:nth-child(even){background:var(--press-warm)}
.press-redesign .press-period .era-head{display:grid;grid-template-columns:minmax(230px,.75fr) minmax(0,1.25fr);gap:clamp(2rem,7vw,7rem);align-items:start;margin:0 0 clamp(2rem,5vw,4rem);padding:0 0 clamp(1.7rem,3vw,2.5rem);border-bottom:1px solid var(--press-line)}
.press-redesign .press-period .era-head>div{min-width:0}
.press-redesign .press-period .era-no{margin:0 0 .65rem;color:#77621e;font-size:.76rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.press-redesign .press-period .press-period-count{margin:.9rem 0 0;color:var(--press-muted);font-size:.78rem;letter-spacing:.04em}
.press-redesign .press-period h2{max-width:16ch;margin:0;font-size:clamp(2rem,4vw,4rem);font-weight:500;line-height:1;letter-spacing:-.04em;text-wrap:balance}
.press-redesign .press-period .era-copy{max-width:660px;margin:.1rem 0 0;color:#4e4e4e;font-size:clamp(1rem,1.5vw,1.18rem);line-height:1.72}
.press-redesign .press-period .grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0 clamp(2rem,5vw,5rem)!important;margin:0!important}
.press-redesign .press-record{display:grid!important;grid-template-columns:2.65rem minmax(0,1fr)!important;column-gap:1rem!important;align-content:start!important;margin:0!important;padding:1.8rem 0 2rem!important;border:0!important;border-top:1px solid var(--press-line)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;min-width:0}
.press-redesign .press-record__index{grid-column:1;grid-row:1/5;padding-top:.15rem;color:#8a8a8a;font-size:.72rem;line-height:1.4;font-variant-numeric:tabular-nums}
.press-redesign .press-record__title,.press-redesign .press-record .desc,.press-redesign .press-record .note{grid-column:2;min-width:0}
.press-redesign .press-record__title{display:inline-flex;align-items:flex-start;gap:.5rem;width:fit-content;max-width:100%;color:var(--press-ink)!important;font-size:clamp(1.16rem,1.8vw,1.5rem)!important;font-weight:650!important;line-height:1.22!important;letter-spacing:-.018em;text-decoration:none!important}
.press-redesign .press-record__title::after{content:'↗';flex:0 0 auto;padding-top:.04em;color:#77621e;font-size:.78em;font-weight:500}
.press-redesign .press-record__title:hover,.press-redesign .press-record__title:focus-visible{text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:.22em!important}
.press-redesign .press-record .desc{max-width:58ch;margin:.75rem 0 0!important;color:#505050!important;font-size:.96rem!important;line-height:1.62!important}
.press-redesign .press-record .note{margin:.95rem 0 0!important;color:#777!important;font-size:.72rem!important;font-weight:650!important;line-height:1.45!important;letter-spacing:.055em!important;text-transform:uppercase!important}
.press-redesign .press-sources{margin:0;padding:clamp(4rem,8vw,7rem) 0;background:#202530!important;color:#fff}
.press-redesign .press-sources .eyebrow{color:var(--press-gold)!important}
.press-redesign .press-sources h2{max-width:16ch;color:#fff;font-size:clamp(2rem,4vw,4rem);font-weight:500;line-height:1.02;letter-spacing:-.04em}
.press-redesign .press-sources .lead{max-width:720px;color:rgba(255,255,255,.7)!important;line-height:1.7}
.press-redesign .press-sources .source-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:1px!important;margin-top:2.5rem!important;background:rgba(255,255,255,.2)!important}
.press-redesign .press-sources .source-grid a{display:grid!important;gap:.55rem!important;min-height:145px!important;padding:1.4rem!important;border:0!important;border-radius:0!important;background:#171717!important;color:#fff!important;text-decoration:none!important}
.press-redesign .press-sources .source-grid a:hover,.press-redesign .press-sources .source-grid a:focus-visible{background:#202020!important}
.press-redesign .press-sources .source-grid strong{font-size:1.05rem;color:#fff!important}
.press-redesign .press-sources .source-grid small{color:rgba(255,255,255,.62)!important;font-size:.85rem;line-height:1.55}
.press-redesign .press-sources .actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2.5rem}
.press-redesign .press-sources .btn{border:1px solid rgba(255,255,255,.35)!important;background:transparent!important;color:#fff!important}
.press-redesign .press-sources .btn:hover,.press-redesign .press-sources .btn:focus-visible{border-color:var(--press-gold)!important;color:#fff!important}
@media (max-width:900px){.press-redesign .press-shell,.press-redesign .wrap{width:min(100% - 36px,1180px)}.press-redesign .press-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.press-redesign .press-overview__grid,.press-redesign .press-period .era-head{grid-template-columns:1fr;gap:2rem}.press-redesign .press-period .grid{grid-template-columns:1fr!important}.press-redesign .press-sources .source-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media (max-width:620px){.press-redesign .press-shell,.press-redesign .wrap{width:min(100% - 28px,1180px)}.press-redesign .press-hero{padding:4.25rem 0 3.5rem}.press-redesign .press-hero h1{font-size:clamp(2.65rem,14vw,4.5rem);max-width:none}.press-redesign .press-facts{grid-template-columns:1fr 1fr}.press-redesign .press-fact{padding-right:.75rem}.press-redesign .press-period-nav{grid-template-columns:1fr}.press-redesign .press-period-nav a:nth-child(odd){margin-right:0}.press-redesign .press-period{padding:3.8rem 0}.press-redesign .press-record{grid-template-columns:2.15rem minmax(0,1fr)!important;column-gap:.65rem!important;padding:1.45rem 0 1.7rem!important}.press-redesign .press-record__title{font-size:1.16rem!important}.press-redesign .press-sources .source-grid{grid-template-columns:1fr!important}}
@media (prefers-reduced-motion:reduce){.press-redesign *{scroll-behavior:auto!important}}`;

const found=[];
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  const m=html.match(/<style id=["']press-editorial-redesign["']>([\s\S]*?)<\/style>/i);
  found.push({file,html,css:m?.[1]?.trim()||null});
}
const present=found.filter(x=>x.css);
if(present.length!==0&&present.length!==pages.length)throw new Error('Press inline CSS exists in only some languages; refusing mixed-state migration.');
let authorityCss=recovered;
if(present.length===pages.length){
  if(new Set(present.map(x=>x.css)).size!==1)throw new Error('Press inline CSS differs between languages; refusing lossy migration.');
  authorityCss=present[0].css;
  for(const item of found){
    const next=item.html.replace(/\s*<style id=["']press-editorial-redesign["']>[\s\S]*?<\/style>\s*/i,'\n');
    fs.writeFileSync(item.file,next);
  }
}

const cssFile='assets/css/site.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes(contractEnd))throw new Error('Apple responsive contract END marker missing');
if(css.includes(markerStart)&&css.includes(markerEnd)){
  console.log('Press editorial CSS already lives in site.css authority; migration is idempotently complete.');
  process.exit(0);
}
if(css.includes(markerStart)||css.includes(markerEnd))throw new Error('Partial Press authority marker found in site.css');
const authority=`\n${markerStart}\n${authorityCss}\n${markerEnd}\n`;
css=css.replace(contractEnd,authority+contractEnd);
fs.writeFileSync(cssFile,css);
console.log(present.length===pages.length
  ? 'Migrated shared Press editorial CSS from 3 HTML files into site.css authority.'
  : 'Recovered the last known-good shared Press editorial CSS into site.css after an earlier partial cleanup removed the inline copies.');
