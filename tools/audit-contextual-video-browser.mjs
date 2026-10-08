import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const root=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[375,390,621,768,1024,1180,1280,1440,1600,1920,2560,3840];
const routes=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules','_site'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.html')){const h=fs.readFileSync(f,'utf8');if(h.includes('"@type":"VideoObject"')&&/<main\b/i.test(h))routes.push('/'+path.relative(root,f).replaceAll(path.sep,'/'))}}}
walk(root);assert.equal(routes.length,51);
const browser=await chromium.launch({headless:true}),failures=[],results=[];
for(const width of widths){
 const ctx=await browser.newContext({viewport:{width,height:1000}});let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<routes.length){const route=routes[cursor++];const p=await ctx.newPage();const requests=[];p.on('request',r=>requests.push(r.url()));
 try{
  // Keep the external player deterministic. Record attempted requests, then
  // return an inert test document; real player availability is verified separately.
  await p.route(/https:\/\/(?:www\.)?youtube-nocookie\.com\/embed\//,r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Player request probe</title><button>Playback probe</button>'}));
  const response=await p.goto(base+route,{waitUntil:'load',timeout:45000});assert.ok(response?.ok(),`${route}: HTTP response`);
  await p.locator('.art-video').first().waitFor({state:'attached',timeout:10000}).catch(()=>{});
  const geometry=await p.evaluate(()=>{const nodes=[...document.querySelectorAll('.art-video')],visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;return {ids:nodes.map(e=>e.dataset.videoId),frames:document.querySelectorAll('iframe[src*="youtube"]').length,overflow:document.documentElement.scrollWidth-innerWidth,boxes:nodes.filter(visible).map(e=>{const f=e.querySelector('.art-video__frame'),b=f.getBoundingClientRect(),button=f.querySelector('button'),br=button?.getBoundingClientRect();return {id:e.dataset.videoId,ratio:b.width/b.height,left:b.left,right:b.right,target:br?.height,label:button?.getAttribute('aria-label'),text:button?.textContent}})}});
  assert.equal(new Set(geometry.ids).size,geometry.ids.length,'duplicate video player');assert.equal(geometry.frames,0,'pre-click iframe');assert.ok(geometry.overflow<=1,'horizontal overflow');assert.ok(geometry.ids.length>0,'video player missing');
  for(const b of geometry.boxes){assert.ok(Math.abs(b.ratio-16/9)<0.025,`16:9 ${b.id}`);assert.ok(b.left>=-1&&b.right<=width+1,'video escapes viewport');assert.ok(b.target>=44,'video target height');assert.ok(b.label.includes(b.text.trim()),'accessible label mismatch')}
  assert.equal(requests.filter(u=>/youtube|youtu\.be|ytimg|googlevideo|googletagmanager|google-analytics|clarity\.ms/i.test(u)).length,0,'YouTube/analytics request before action');
  // Open source disclosures to cover embeds kept in progressive disclosure.
  await p.evaluate(()=>{for(const d of document.querySelectorAll('main details'))d.open=true});
  const button=p.locator('.art-video button').first();await button.focus();const playerRequest=p.waitForRequest(r=>r.url().startsWith('https://www.youtube-nocookie.com/embed/'),{timeout:10000}).catch(()=>null);await button.press('Enter');const iframe=p.locator('.art-video iframe').first();await iframe.waitFor({state:'attached'});
  assert.match(await iframe.getAttribute('src'),/^https:\/\/www\.youtube-nocookie\.com\/embed\/(?:[\w-]{11}|videoseries\?list=PL)/);assert.ok(await iframe.getAttribute('title'),'player title');assert.equal(await p.evaluate(()=>document.activeElement?.tagName),'IFRAME','keyboard focus moves to player');
  assert.ok(await playerRequest,'click did not request player within 10 seconds');assert.ok(requests.some(u=>u.startsWith('https://www.youtube-nocookie.com/embed/')),'click did not request player');
  results.push({route,width,players:geometry.ids.length,preClickThirdPartyRequests:0,keyboard:'passed',playerRequest:'passed',geometry:'passed'});
 }catch(e){failures.push({route,width,error:e.message})}finally{await p.close()}}}));await ctx.close();
}
await browser.close();fs.mkdirSync('artifacts/video',{recursive:true});fs.writeFileSync('artifacts/video/browser-report.json',JSON.stringify({base,routes:routes.length,widths,checks:results.length,failures,results},null,2));
assert.equal(failures.length,0,JSON.stringify(failures.slice(0,20)));assert.equal(results.length,612);
console.log(`Video privacy, keyboard and responsive audit passed: ${routes.length} pages × ${widths.length} widths; 612 checks. External player requests were observed with controlled responses; this is not a real playback certification.`);
