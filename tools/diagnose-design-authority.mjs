import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:1000},deviceScaleFactor:1});
const page=await context.newPage();
await page.goto(new URL('/curators.html',base).href,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(100);
const diagnostic=await page.evaluate(async()=>{
  const h2=document.querySelector('main#main-content h2');
  const cell=document.querySelector('main#main-content .curatorial-period,main#main-content .archive-card,main#main-content .t-item,main#main-content .press-fact,main#main-content .card');
  const links=[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>x.href);
  const sheets=[];
  for(const href of links){
    let text='';
    try{text=await fetch(href,{cache:'no-store'}).then(r=>r.text())}catch(_){}
    sheets.push({href,bytes:text.length,hasVisualMarker:text.includes('ART-VISUAL-PERFECTION-AUTHORITY-MERGED:START'),hasLastResort:text.includes('Last-resort cascade owner')});
  }
  const matching=[];
  function scanRules(rules,href,condition=''){
    for(const rule of rules||[]){
      if(rule.cssRules){scanRules(rule.cssRules,href,rule.conditionText||condition);continue;}
      if(!rule.selectorText||!h2)continue;
      let matches=false;try{matches=h2.matches(rule.selectorText)}catch(_){}
      if(matches&&rule.style.getPropertyValue('font-size')) matching.push({href,condition,selector:rule.selectorText,fontSize:rule.style.getPropertyValue('font-size'),fontPriority:rule.style.getPropertyPriority('font-size')});
    }
  }
  for(const sheet of [...document.styleSheets]){let rules=[];try{rules=[...sheet.cssRules]}catch(_){}scanRules(rules,sheet.href||'inline');}
  const hs=h2?getComputedStyle(h2):null;
  const cs=cell?getComputedStyle(cell):null;
  return {
    bodyClass:document.body.className,
    mainId:document.querySelector('main')?.id||'',
    mainIdCount:document.querySelectorAll('main[id]').length,
    h2Text:h2?.textContent?.trim().slice(0,80)||'',
    h2MatchesBase:h2?h2.matches('html body.apple-archive main#main-content h2'):false,
    h2MatchesLastResort:h2?h2.matches('html body.apple-archive main#main-content#main-content#main-content h2'):false,
    h2Computed:hs?.fontSize||'',
    cellClass:cell?.className||'',
    cellComputed:cs?[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft]:[],
    skipHref:document.querySelector('.skip-link')?.getAttribute('href')||'',
    links,sheets,matching:matching.slice(-30)
  };
});
console.log('ART_DESIGN_AUTHORITY_DIAGNOSTIC '+JSON.stringify(diagnostic));
if(!diagnostic.sheets.some(x=>x.hasVisualMarker)){await browser.close();throw new Error('ART visual authority marker is not present in the stylesheet actually loaded by Chromium.');}
if(diagnostic.mainId!=='main-content'||diagnostic.skipHref!=='#main-content'){await browser.close();throw new Error(`ART production main/skip-link contract mismatch: main=${diagnostic.mainId}, skip=${diagnostic.skipHref}.`);}
if(!diagnostic.h2MatchesBase||!diagnostic.h2MatchesLastResort){await browser.close();throw new Error('ART visual authority selectors do not match the production DOM.');}
if(!diagnostic.h2Computed){await browser.close();throw new Error('ART curator H2 did not produce a computed font size.');}
await browser.close();
