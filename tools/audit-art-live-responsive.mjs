#!/usr/bin/env node
// This test runs ONLY after the GitHub Pages deploy step, against the
// canonical HTTPS domain, with the exact deployed SHA as a hard precondition.
// Browser captures are evidence, not a substitute for the source-level audits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const sha = process.env.ART_EXPECTED_SHA || process.env.GITHUB_SHA;
assert.match(sha || '', /^[a-f0-9]{40}$/i, 'Expected immutable deployment SHA is missing');
const origin = 'https://www.banhalmi.art';
const evidenceDir = path.resolve('artifacts/art-exact-live');
fs.mkdirSync(evidenceDir, {recursive:true});
const paths = [
  {prefix:'',lang:'en'},
  {prefix:'hu/',lang:'hu'},
  {prefix:'de-at/',lang:'de-AT'}
];
const views = [
  {name:'mobile',width:390,height:844},
  {name:'desktop',width:1440,height:900}
];
const allowedLegal = /^https:\/\/www\.banhalmiphotography\.com\/(?:impressum\/|privacy-policy\/|trust\/|hu\/(?:impresszum\/|adatvedelem\/|bizalom\/)|de-at\/(?:impressum\/|datenschutz\/|vertrauen\/))$/i;
const fetchOptions = {
  headers: { 'Cache-Control':'no-cache', 'User-Agent':'BANHALMI-ART-Exact-Live/1.0' },
  signal: AbortSignal.timeout(25000)
};
const stamp = await fetch(origin + '/deployment-sha.txt', fetchOptions);
assert.equal(stamp.status,200,'Live deployment marker unavailable');
assert.equal((await stamp.text()).trim(),sha,'Live Pages SHA differs from intended commit');

const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const findings = [];
try {
  for (const {prefix,lang} of paths) {
    for (const pageName of ['','curators.html']) {
      const route = '/' + prefix + pageName;
      for (const view of views) {
        const context = await browser.newContext({
          viewport:{width:view.width,height:view.height},
          deviceScaleFactor:1,
          userAgent:'Mozilla/5.0 (compatible; BANHALMI-ART-ExactLive/1.0)'
        });
        const page = await context.newPage();
        try {
          const address=origin+route+'?deploy='+sha;
          const response=await page.goto(address,{waitUntil:'domcontentloaded',timeout:50000});
          assert.ok(response?.ok(),address+': live HTML request failed');
          await page.locator('main').first().waitFor({timeout:16000});
          const status=await page.evaluate(()=>{
            const anchors=[...document.querySelectorAll('a[href]')];
            const css=document.querySelector('link[rel="stylesheet"][href*="/assets/css/bundles/art-"]');
            const card=document.querySelector('.curatorial-period');
            const cardStyle=card?getComputedStyle(card):null;
            return {
              language:document.documentElement.lang,
              title:document.title,
              main:!!document.querySelector('main'),
              h1:!!document.querySelector('h1'),
              footerMail:!!document.querySelector('footer a[href^="mailto:"]'),
              legal:anchors.filter(a=>/impress|privacy|datenschutz|adatvedelem/i.test(a.href)).length,
              dock:!!document.querySelector('.banhalmi-contact-dock'),
              salesMenu:!!document.querySelector('a.m-main.professional-bridge'),
              salesLinks:anchors.map(a=>a.href).filter(x=>x.startsWith('https://www.banhalmiphotography.com/')),
              quoteLinks:anchors.map(a=>a.href).filter(x=>/requestaquote|quote-calculator|\/ajanlatkeres\/|\/anfrage\//i.test(x)),
              artNude:!!document.querySelector('a[href*="exhibitions/ebredes.html"]'),
              css:css?.getAttribute('href')||null,
              scrollWidth:Math.ceil(document.documentElement.scrollWidth),
              viewportWidth:window.innerWidth,
              curatorCardPadding:cardStyle?{left:parseFloat(cardStyle.paddingLeft),right:parseFloat(cardStyle.paddingRight)}:null
            };
          });
          assert.ok(status.main && status.h1,address+': public article semantics missing');
          assert.equal(status.language.toLowerCase(),lang.toLowerCase(),address+': language tag mismatch');
          assert.ok(status.footerMail,address+': subtle artistic footer email missing');
          assert.ok(status.legal>=2,address+': legal/privacy navigation incomplete');
          assert.equal(status.dock,false,address+': floating contact dock returned');
          assert.equal(status.salesMenu,false,address+': professional sales menu returned');
          assert.equal(status.quoteLinks.length,0,address+': commercial quote link returned');
          assert.ok(status.salesLinks.every(link=>allowedLegal.test(link)),address+': non-legal Professional business handoff '+status.salesLinks.join(', '));
          assert.ok(status.artNude,address+': Ébredés archive route missing');
          assert.match(status.css||'',/^\/assets\/css\/bundles\/art-[a-f0-9]{16}\.css$/i,address+': immutable production CSS missing');
          assert.ok(status.scrollWidth<=status.viewportWidth+2,address+': horizontal overflow at '+view.name);
          if(pageName==='curators.html'&&view.name==='desktop'){
            assert.ok(status.curatorCardPadding,address+': curatorial period card missing');
            assert.ok(status.curatorCardPadding.left>=23.9 && status.curatorCardPadding.right>=23.9,address+': 24px curator card side padding lost');
          }
          const cssResponse=await page.request.get(origin+status.css+'?deploy='+sha,{timeout:25000});
          assert.ok(cssResponse.ok(),address+': live production CSS unavailable');
          assert.ok((await cssResponse.body()).length>25000,address+': truncated CSS bundle');
          const filename=prefix.replaceAll('/','-')||'en-';
          const screenshot=path.join(evidenceDir,filename+(pageName?'curators':'home')+'-'+view.name+'.png');
          await page.screenshot({path:screenshot,fullPage:false,animations:'disabled'});
          findings.push({locale:lang,page:pageName||'home',viewport:view.name,url:address,css:status.css,title:status.title,scrollWidth:status.scrollWidth,cardPadding:status.curatorCardPadding,screenshot:path.relative(process.cwd(),screenshot)});
        } finally { await context.close(); }
      }
    }
  }
  // The artistic nude route must not become a lead-generation destination.
  for(const {prefix,lang} of paths){
    const page=await browser.newPage();
    try{
      const url=origin+'/'+prefix+'exhibitions/ebredes.html?deploy='+sha;
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:50000});
      assert.ok(response?.ok(),url+': Ébredés unavailable');
      const hrefs=await page.locator('a[href]').evaluateAll(els=>els.map(e=>e.href));
      assert.ok(hrefs.every(x=>!(/requestaquote|quote-calculator|\/ajanlatkeres\/|\/anfrage\/|#service|professional-portfolio/i.test(x))),url+': Ébredés commercial link returned');
      assert.ok(hrefs.every(x=>!x.startsWith('https://www.banhalmiphotography.com/')||allowedLegal.test(x)),url+': Ébredés Professional handoff returned');
      findings.push({locale:lang,page:'ebredes',url,source:'live HTML'});
    }finally{await page.close()}
  }
  fs.writeFileSync(path.join(evidenceDir,'report.json'),JSON.stringify({expectedSha:sha,verifiedAt:new Date().toISOString(),results:findings},null,2)+'\n');
  console.log('EXACT-LIVE verified: '+sha+'; 3L home and curators at two viewports, 3L Ébredés non-commercial routing, live hashed CSS and captured screenshots.');
} finally {
  await browser.close();
}
