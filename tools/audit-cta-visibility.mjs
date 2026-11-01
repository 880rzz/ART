import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const css = fs.readFileSync('assets/css/site.css','utf8');
const skip = new Set(['.git','node_modules','_site','artifacts','dist','build','coverage']);
const allHTML = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (entry.isDirectory() && skip.has(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) allHTML.push(full);
  }
}
walk('.');
const source = {allHTML:allHTML.length,activeHTML:0,redirectHTML:0,ctaPages:0,ctaElements:0,heroGroups:0,actionsGroups:0,buttonsGroups:0};
const actionTag=/<(?:a|button|label)\b[^>]*class\s*=\s*["'][^"']*(?:btn|button|cta|professional-side__cta)[^"']*["'][^>]*>/gi;
for (const file of allHTML) {
  const html = fs.readFileSync(file,'utf8');
  const active=/<main\b/i.test(html) && !/<meta[^>]+http-equiv=["']refresh["']/i.test(html);
  if (!active) {source.redirectHTML++;continue;}
  source.activeHTML++;
  const count=[...html.matchAll(actionTag)].length;
  const groupCount=(html.match(/class=["'][^"']*hero-cta\b/gi)||[]).length+
                   (html.match(/class=["'][^"']*\bactions\b/gi)||[]).length+
                   (html.match(/class=["'][^"']*\bbuttons\b/gi)||[]).length;
  if(count||groupCount)source.ctaPages++;
  source.ctaElements+=count;
  source.heroGroups+=(html.match(/class=["'][^"']*hero-cta\b/gi)||[]).length;
  source.actionsGroups+=(html.match(/class=["'][^"']*\bactions\b/gi)||[]).length;
  source.buttonsGroups+=(html.match(/class=["'][^"']*\bbuttons\b/gi)||[]).length;
}
const broadSectionClip=/body\.apple-archive\s+main\s*>\s*section:not\([^}]*?\)\s*\{\s*overflow\s*:\s*(hidden|clip)/i;
const cssOverflowCount=(css.match(/overflow(?:-x|-y)?\s*:\s*(?:hidden|clip)\b/g)||[]).length;
const cssImportantCount=(css.match(/!important\b/g)||[]).length;
const failures=[];
if(broadSectionClip.test(css))failures.push('Global mobile main>section clipping returned; do not hide controls behind overflow:hidden/clip');
if(/body\\.apple-archive\\s+main\\s*\\{[^}]*overflow\\s*:\\s*(?:hidden|clip)\\b/i.test(css))failures.push('Main cannot clip CTA borders across the whole archive');
if(/body\.apple-archive\s+a\[data-external="true"\]\s*\{[^}]*border-bottom\s*:\s*0\b/i.test(css) ||
   /body\.apple-archive\s+a\[data-external="true"\]:is\([^)]*\)\s*\{[^}]*border-bottom\s*:\s*0\b/i.test(css))
  failures.push('External-link underline reset deletes framed CTA bottom border');
if(!css.includes('body.apple-archive header.hero#top'))failures.push('Home hero contract missing');
if(!css.includes('.banhalmi-contact-dock'))failures.push('Shared Contact dock CSS missing');
if(!css.includes('BANHALMI-CONTACT-DOCK-FOOTER-CLEARANCE-V4-20261101'))failures.push('Contact dock footer clearance authority missing');
if(!/\.banhalmi-contact-trigger\{[^}]*background:var\(--c-ground,#202530\)/.test(css))failures.push('Contact trigger must use footer ground blue, not pure black');
const dockJS=fs.readFileSync('assets/js/responsive-header-system.js','utf8');
if(!dockJS.includes('syncDockCollisions'))failures.push('Shared contact dock lacks viewport collision guard');
if(source.activeHTML<80)failures.push('Too few content HTML pages audited: '+source.activeHTML);
if(source.heroGroups<3)failures.push('One or more localized hero CTA groups missing');
console.log('ART CTA CSS source inventory: '+JSON.stringify({...source,cssOverflowCount,cssImportantCount}));
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
if(!process.argv.includes('--browser'))process.exit(0);

const {chromium}=await import('playwright');
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const widths=(process.env.CTA_AUDIT_WIDTHS||'375,390,430,621,768').split(',').map(Number).filter(Number.isFinite);
const sampleLimit=Math.max(1,Number(process.env.CTA_AUDIT_ACTION_SAMPLES||6));
function listPages(dir) {
  const files=[];
  function descend(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const f=path.join(d,e.name);
    if(e.isDirectory())descend(f);
    else if(e.isFile() && e.name.endsWith('.html'))files.push(f);
  }}
  descend(dir);
  return files.filter(f=>{
    const h=fs.readFileSync(f,'utf8');
    return /<main\b/i.test(h) && !/http-equiv=["']refresh["']/i.test(h) && /assets\/css\//i.test(h);
  }).map(f=>{
    const rel=path.relative(dir,f).split(path.sep).join('/');
    return rel==='index.html'?'/':rel.endsWith('/index.html')?'/'+rel.slice(0,-10):'/'+rel;
  });
}
const paths=[...new Set(listPages(siteDir))].sort();
const browser=await chromium.launch({headless:true});
let rendered=0,controlsChecked=0,sectionClipObservations=0,dockCollisionsChecked=0;
const problems=[];
const details=[];
for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width<=430?844:1000},deviceScaleFactor:2,isMobile:width<=430,hasTouch:width<=430});
  for(const route of paths){
    rendered++;
    const page=await ctx.newPage();
    try{
      const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:25000});
      if(!response||!response.ok()){problems.push(width+'px '+route+' HTTP '+response?.status());continue}
      await page.waitForTimeout(160);
      // The Contact dock must not cover the mobile homepage portrait.
      if(width<=430 && ['/', '/hu/', '/de-at/'].includes(route)){
        const heroState=await page.evaluate(()=>{
          const hero=document.querySelector('header.hero#top');
          const dock=document.querySelector('.banhalmi-contact-dock');
          if(!hero||!dock)return {error:'Homepage hero or Contact dock missing'};
          const rect=hero.getBoundingClientRect();
          return {inView:rect.top<innerHeight&&rect.bottom>0,hidden:getComputedStyle(dock).visibility==='hidden'};
        });
        if(heroState.error)problems.push(width+'px '+route+': '+heroState.error);
        else if(heroState.inView&&!heroState.hidden)
          problems.push(width+'px '+route+': Contact dock visible over homepage portrait');
      }
      const result=await page.evaluate(()=>{
        const name=el=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+
          (el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).join('.').slice(0,76):'');
        const visible=el=>{
          const s=getComputedStyle(el),r=el.getBoundingClientRect();
          return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0;
        };
        const selectors='main a.btn,main a.button,main a.cta,main .actions a,main .buttons a,main .cta-row a,main .hero-cta a,main .gal-actions label,main .svc-cta,main .professional-side__cta';
        const controls=[...new Set(document.querySelectorAll(selectors))].filter(visible);
        const issues=[],clippedSections=[];
        const px=v=>Number.parseFloat(v)||0;
        for(const control of controls){
          const s=getComputedStyle(control),r=control.getBoundingClientRect();
          const top=px(s.borderTopWidth),left=px(s.borderLeftWidth),bottom=px(s.borderBottomWidth);
          if(top>.7 && left>.7 && bottom<.5)
            issues.push(name(control)+' has top/left border but missing bottom border');
          for(let p=control.parentElement;p&&p!==document.body;p=p.parentElement){
            const ps=getComputedStyle(p);
            if(!/(hidden|clip)/.test(ps.overflowX+' '+ps.overflowY))continue;
            const b=p.getBoundingClientRect();
            if(r.left<b.left-1||r.right>b.right+1||r.top<b.top-1||r.bottom>b.bottom+1){
              issues.push(name(control)+' clipped by '+name(p)+' ('+ps.overflowX+'/'+ps.overflowY+')');
              break;
            }
          }
          if(r.height<43.5)issues.push(name(control)+' touch target '+r.height.toFixed(1)+'px');
        }
        for(const sec of document.querySelectorAll('main>section')){
          const css=getComputedStyle(sec);
          if((css.overflowX==='hidden'||css.overflowY==='hidden'||css.overflowX==='clip'||css.overflowY==='clip')&&sec.querySelector(selectors))
            clippedSections.push(name(sec)+' '+css.overflowX+'/'+css.overflowY);
        }
        const trigger=document.querySelector('.banhalmi-contact-trigger');
        const dock=trigger&&visible(trigger)?trigger.getBoundingClientRect():null;
        const cta=[...controls].filter(el=>{
          const r=el.getBoundingClientRect();
          return r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0;
        });
        const overlay=dock?cta.filter(el=>{
          const r=el.getBoundingClientRect();
          return Math.min(r.right,dock.right)-Math.max(r.left,dock.left)>5 &&
                 Math.min(r.bottom,dock.bottom)-Math.max(r.top,dock.top)>5;
        }).map(name):[];
        return {issues:issues.slice(0,40),clippedSections:clippedSections.slice(0,20),overlap:overlay,controls:controls.length,
                samples:controls.slice(0,8).map(el=>({name:name(el),text:(el.textContent||'').trim().slice(0,70)}))};
      });
      controlsChecked+=result.controls;
      sectionClipObservations+=result.clippedSections.length;
      dockCollisionsChecked++;
      for(const msg of result.issues)problems.push(width+'px '+route+': '+msg);
      for(const msg of result.clippedSections)problems.push(width+'px '+route+': section with CTA is clipped: '+msg);
      for(const msg of result.overlap)problems.push(width+'px '+route+': Contact overlays visible '+msg);
      if(result.issues.length||result.clippedSections.length||result.overlap.length)details.push({route,width,...result});
      // Scroll a representative subset of every page's actions into the lower viewport.
      // This exercises the real fixed-dock behaviour beyond the homepage.
      const count=await page.locator('main a.btn,main .actions a,main .buttons a,main .hero-cta a,main .cta-row a').count();
      for(let index=0;index<Math.min(sampleLimit,count);index++){
        try{
          await page.locator('main a.btn,main .actions a,main .buttons a,main .hero-cta a,main .cta-row a').nth(index).evaluate(el=>el.scrollIntoView({block:'end',behavior:'instant'}));
          await page.waitForTimeout(48);
          const collision=await page.evaluate(()=>{
            const trigger=document.querySelector('.banhalmi-contact-trigger');
            if(!trigger)return null;
            const ds=getComputedStyle(trigger);
            if(ds.display==='none'||ds.visibility==='hidden'||Number(ds.opacity)===0)return null;
            const d=trigger.getBoundingClientRect();
            const targets=[...document.querySelectorAll('main a.btn,main .actions a,main .buttons a,main .hero-cta a,main .cta-row a')];
            for(const el of targets){
              const s=getComputedStyle(el);
              if(s.display==='none'||s.visibility==='hidden')continue;
              const r=el.getBoundingClientRect();
              if(Math.min(r.right,d.right)-Math.max(r.left,d.left)>5 &&
                 Math.min(r.bottom,d.bottom)-Math.max(r.top,d.top)>5)
                return (el.textContent||'').trim().slice(0,45);
            }
            return null;
          });
          if(collision)problems.push(width+'px '+route+': floating Contact overlays CTA "'+collision+'" after scroll');
        }catch(e){problems.push(width+'px '+route+': CTA scroll audit '+String(e.message).slice(0,140))}
      }
    }finally{await page.close()}
  }
  await ctx.close();
}
await browser.close();
fs.mkdirSync('artifacts/cta-safety',{recursive:true});
const report={source,widths,pages:paths.length,rendered,controlsChecked,sectionClipObservations,dockCollisionsChecked,
  failures:problems.length,problems:problems.slice(0,500),examples:details.slice(0,120)};
fs.writeFileSync('artifacts/cta-safety/report.json',JSON.stringify(report,null,2));
console.log('ART CTA visibility browser audit: '+JSON.stringify({pages:paths.length,widths,rendered,controlsChecked,failures:problems.length}));
if(problems.length){
  for(const error of problems.slice(0,80))console.error(error);
  if(problems.length>80)console.error('Additional problems: '+(problems.length-80)+'; see artifacts/cta-safety/report.json');
  process.exit(1);
}
