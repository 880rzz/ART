from pathlib import Path

ROOT=Path('.')
CSS='''/* STAGE97-DESKTOP-FULLWIDTH-ANCHOR-REPAIR:START */
:target{scroll-margin-top:96px}
@media(min-width:1025px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive main>section{
    width:100vw!important;max-width:none!important;
    margin-left:calc(50% - 50vw)!important;margin-right:calc(50% - 50vw)!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive main>section>.wrap{
    width:min(100%,1440px)!important;max-width:1440px!important;
    margin-inline:auto!important;padding-inline:clamp(3rem,6vw,7rem)!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive main>section.wrap,
  html body.apple-archive.apple-archive.apple-archive.apple-archive main>section.wrap.narrow{
    width:100vw!important;max-width:none!important;margin-left:calc(50% - 50vw)!important;margin-right:calc(50% - 50vw)!important;
    padding-inline:max(7vw,calc((100vw - 1440px)/2 + 4.5vw))!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive main .wrap.narrow:not(section){max-width:1180px!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive main .wrap.narrow :is(.lead,p.lead){max-width:76ch!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive .book-lead{
    display:grid!important;grid-template-columns:minmax(300px,.78fr) minmax(0,1.22fr)!important;
    gap:clamp(3rem,7vw,7rem)!important;align-items:start!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive .book-lead .book-text{max-width:76ch!important;width:100%!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive .book-lead .book-cover{max-width:420px!important;justify-self:end!important;width:100%!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive #about .bio-grid{
    grid-template-columns:minmax(260px,340px) minmax(0,1fr)!important;gap:clamp(4rem,8vw,8rem)!important;align-items:start!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive #about .bio-grid>div:first-child .meta{
    text-align:left!important;font-size:1rem!important;line-height:1.65!important;letter-spacing:.01em!important;margin-top:1.5rem!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive .timeline .yr,
  html body.apple-archive.apple-archive.apple-archive.apple-archive [data-chronology] .yr{
    font-size:.95rem!important;line-height:1.35!important;letter-spacing:.16em!important;min-width:5.5rem!important;font-weight:600!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive .timeline .t-item{
    padding-left:clamp(2rem,4vw,5rem)!important;padding-right:clamp(2rem,4vw,5rem)!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive footer .socials.lang-switch{
    width:auto!important;max-width:none!important;display:grid!important;
    grid-template-columns:repeat(6,max-content)!important;align-items:center!important;justify-content:center!important;
    gap:.65rem 1.15rem!important;white-space:nowrap!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive footer .fineprint br{display:none!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive footer .consent-reset{
    margin-left:1rem!important;letter-spacing:.08em!important;font-size:.82rem!important;
  }
}
@media(max-width:1024px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive footer .socials.lang-switch{white-space:normal!important}
}
/* STAGE97-DESKTOP-FULLWIDTH-ANCHOR-REPAIR:END */
'''
JS='''/* Stage97: close the fullscreen menu before anchor navigation and make same-page hashes deterministic. */
(function(){
  'use strict';
  function normPath(p){p=(p||'/').replace(/\\/+/g,'/');return p.replace(/\\/index\\.html$/,'/')||'/';}
  function closeMenu(){
    document.body.classList.remove('menu-open');
    var b=document.querySelector('.burger[aria-expanded="true"]');
    if(b)b.setAttribute('aria-expanded','false');
  }
  function targetFromHash(hash){
    if(!hash||hash==='#')return null;
    try{return document.getElementById(decodeURIComponent(hash.slice(1)));}catch(e){return document.getElementById(hash.slice(1));}
  }
  document.addEventListener('click',function(ev){
    var a=ev.target.closest&&ev.target.closest('a[href]');
    if(!a)return;
    var raw=a.getAttribute('href')||'';
    if(a.closest('#menu'))closeMenu();
    if(raw.indexOf('#')===-1)return;
    var u;try{u=new URL(a.href,location.href)}catch(e){return}
    if(u.origin!==location.origin||normPath(u.pathname)!==normPath(location.pathname))return;
    var target=targetFromHash(u.hash);if(!target)return;
    ev.preventDefault();closeMenu();
    requestAnimationFrame(function(){target.scrollIntoView({block:'start',behavior:'smooth'});history.pushState(null,'',u.hash);});
  });
  window.addEventListener('hashchange',function(){closeMenu();var t=targetFromHash(location.hash);if(t)requestAnimationFrame(function(){t.scrollIntoView({block:'start'});});});
  if(location.hash){window.addEventListener('load',function(){var t=targetFromHash(location.hash);if(t)setTimeout(function(){t.scrollIntoView({block:'start'});},0);},{once:true});}
})();
'''
(ROOT/'assets/css/stage97-fullwidth-repair.css').write_text(CSS,encoding='utf-8')
(ROOT/'assets/js/anchor-navigation-repair.js').write_text(JS,encoding='utf-8')

css_link='<link rel="stylesheet" href="/assets/css/stage97-fullwidth-repair.css?v=20260810-layout-repair-v97">'
js_link='<script defer src="/assets/js/anchor-navigation-repair.js?v=20260810-layout-repair-v97"></script>'
for p in ROOT.rglob('*.html'):
    if any(part in {'.git','node_modules'} for part in p.parts): continue
    s=p.read_text(encoding='utf-8')
    if 'class="apple-archive"' not in s: continue
    if 'stage97-fullwidth-repair.css' not in s:
        marker='</head>'
        s=s.replace(marker,css_link+'\n'+js_link+'\n'+marker,1)
    p.write_text(s,encoding='utf-8')

# Permanent fail-closed regression contract.
audit=r'''import fs from 'node:fs';import path from 'node:path';
const css=fs.readFileSync('assets/css/stage97-fullwidth-repair.css','utf8');
const js=fs.readFileSync('assets/js/anchor-navigation-repair.js','utf8');
const errors=[];
for(const need of ['STAGE97-DESKTOP-FULLWIDTH-ANCHOR-REPAIR:START','main>section{','width:100vw!important','main>section.wrap.narrow','book-lead','timeline .yr','footer .socials.lang-switch'])if(!css.includes(need))errors.push('stage97 css missing '+need);
for(const need of ['closeMenu()','scrollIntoView','history.pushState','normPath'])if(!js.includes(need))errors.push('anchor repair missing '+need);
const skip=new Set(['.git','node_modules','redirects']);const files=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))files.push(p)}}walk('.');
let pages=0;for(const f of files){const h=fs.readFileSync(f,'utf8');if(!h.includes('class="apple-archive"'))continue;pages++;if(!h.includes('stage97-fullwidth-repair.css?v=20260810-layout-repair-v97'))errors.push(f+': missing Stage97 CSS');if(!h.includes('anchor-navigation-repair.js?v=20260810-layout-repair-v97'))errors.push(f+': missing Stage97 anchor JS');}
for(const f of ['index.html','curators.html','books/book-ebredes.html','exhibitions/euforia.html','hu/index.html','de-at/index.html'])if(!fs.existsSync(f))errors.push('missing critical page '+f);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`Stage97 desktop full-width + anchor behavior audit passed across ${pages} ART pages.`);
'''
(ROOT/'tests/audit-layout-anchor-stage97.mjs').write_text(audit,encoding='utf-8')

pkg=ROOT/'package.json';import json
obj=json.loads(pkg.read_text(encoding='utf-8'))
cmd=obj.get('scripts',{}).get('audit','')
if 'audit-layout-anchor-stage97.mjs' not in cmd:
    obj['scripts']['audit']=cmd+' && node tests/audit-layout-anchor-stage97.mjs'
obj['scripts']['audit:layout-anchor']='node tests/audit-layout-anchor-stage97.mjs'
pkg.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Stage97 prepared')