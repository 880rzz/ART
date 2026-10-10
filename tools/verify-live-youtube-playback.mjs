import fs from 'node:fs';
import { chromium } from 'playwright';

// An availability/metadata check cannot prove media playback. This probe uses
// the real production player, without intercepting its network responses.
const base = 'https://www.banhalmi.art';
const cases = [
  ['XI5WavAwFOY','exhibitions/ebredes.html'],
  ['npJ6YeYxQ64','exhibitions/ebredes.html'],
  ['cuPzuMSXxMc','exhibitions/anovilaga.html'],
  ['Q9vXitVpo7Y','exhibitions/merfoldkovek1956.html'],
  ['xmZXqdL82-U','exhibitions/theframe.html'],
  ['dDfbT7JlDi4','exhibitions/fotokiallitas5.html'],
  ['AfK29ELPWBY','exhibitions/fotokiallitas4.html'],
  ['cCylPUNJbzU','exhibitions/teislehetsz.html'],
  ['ZzZj0ompifI','books/book-anovilaga.html'],
].flatMap(([id,route])=>['','hu/','de-at/'].map(prefix=>({id,route:prefix+route})));
const browser=await chromium.launch({headless:true});
const results=[];let cursor=0;
await Promise.all(Array.from({length:2},async()=>{
  while(cursor<cases.length){
    const test=cases[cursor++],context=await browser.newContext(),page=await context.newPage();
    const requests=[],errors=[];let playerFrame=null;
    page.on('request',r=>requests.push(r.url()));
    page.on('requestfailed',r=>errors.push({url:r.url(),error:r.failure()?.errorText}));
    try{
      await page.goto(base+'/'+test.route,{waitUntil:'load',timeout:45000});
      await page.evaluate(()=>{for(const d of document.querySelectorAll('main details'))d.open=true});
      const player=page.locator(`.art-video[data-video-id="${test.id}"]`);
      await player.locator('button').click();
      const element=await player.locator('iframe').elementHandle();
      const frame=await element.contentFrame();playerFrame=frame;
      if(!frame)throw new Error('Player frame missing');
      await frame.waitForSelector('video',{timeout:20000});
      // A click on the site's button is the user action. Some browsers require
      // a second action inside the external player; use the actual play control.
      const control=frame.locator('.ytp-play-button');
      if(await control.count()){
        const state=await frame.locator('video').evaluate(v=>({paused:v.paused,time:v.currentTime}));
        if(state.paused)await control.click();
      }
      await frame.waitForFunction(()=>{
        const v=document.querySelector('video');return v&&v.currentTime>1&&!v.paused&&v.readyState>=2;
      },null,{timeout:25000});
      const media=await frame.locator('video').evaluate(v=>({currentTime:v.currentTime,duration:v.duration,paused:v.paused,readyState:v.readyState}));
      results.push({...test,status:'passed',media,mediaRequests:requests.filter(u=>u.includes('googlevideo.com')).length});
    }catch(e){
      const media=playerFrame?await playerFrame.locator('video').evaluate(v=>({currentTime:v.currentTime,paused:v.paused,readyState:v.readyState,networkState:v.networkState,error:v.error?{code:v.error.code,message:v.error.message}:null})).catch(()=>null):null;
      const playerMessage=playerFrame?await playerFrame.locator('body').innerText({timeout:1000}).catch(()=>null):null;
      results.push({...test,status:'unverified',error:e.message,media,playerMessage:playerMessage?.slice(0,1000),networkErrors:errors.slice(0,12)});
    }finally{await context.close()}
  }
}));
await browser.close();
fs.mkdirSync('artifacts/video',{recursive:true});
fs.writeFileSync('artifacts/video/real-playback-report.json',JSON.stringify({checkedAt:new Date().toISOString(),base,results},null,2));
console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.status==='passed').length,unverified:results.filter(r=>r.status!=='passed')},null,2));
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
