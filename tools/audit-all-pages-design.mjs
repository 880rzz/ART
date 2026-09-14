import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=process.env.AUDIT_SITE_DIR||'_site';
const design=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const widths=(process.env.ART_DESIGN_WIDTHS||'320,360,375,390,412,430,768,820,1024,1280,1366,1440,1920,2560,3840').split(',').map(Number).filter(Boolean);
const viewportHeights=new Map([[320,568],[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],[820,1180],[1024,1366],[1280,800],[1366,768],[1440,900],[1920,1080],[2560,1440],[3840,2160]]);
const pageMaxPx=Number(design.pageMaxPx);
const axisTolerancePx=Number(design.desktop?.axisTolerancePx||6);
const mobileGutterPx=11;
if(!Number.isFinite(pageMaxPx))throw new Error('ART canonical pageMaxPx missing.');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html'))files.push(full)}}
walk(siteDir);
const contentFiles=files.filter(file=>{const rel=path.relative(siteDir,file).replaceAll('\\','/');const html=fs.readFileSync(file,'utf8');if(rel.startsWith('redirects/'))return false;if(/http-equiv=["']refresh["']/i.test(html)&&html.length<6000)return false;return /<main\b/i.test(html)&&!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)});
function urlFor(file){let rel=path.relative(siteDir,file).replaceAll('\\','/');rel=rel.replace(/index\.html$/,'');return `${baseUrl}/${rel}`.replace(/([^:]\/)\/+/g,'$1')}
const browser=await chromium.launch({headless:true});const failures=[];let checks=0;
for(const width of widths){
  const height=viewportHeights.get(width)||1100;
  const page=await browser.newPage({viewport:{width,height}});
  for(const file of contentFiles){
    const rel=path.relative(siteDir,file).replaceAll('\\','/');
    await page.goto(urlFor(file),{waitUntil:'networkidle'});
    const r=await page.evaluate(({pageMaxPx,axisTolerancePx,mobileGutterPx})=>{
      const de=document.documentElement,body=document.body,main=document.querySelector('main'),nav=document.querySelector('body>nav'),footer=document.querySelector('footer');
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),b=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&b.width>0&&b.height>0};
      const overflow=de.scrollWidth-de.clientWidth,outside=[];
      if(overflow>1){for(const el of document.querySelectorAll('h1,h2,h3,p,li,blockquote,a,button,summary,img,video,svg')){if(!visible(el))continue;const b=el.getBoundingClientRect();if(b.right>innerWidth+2||b.left<-2)outside.push(`${el.tagName.toLowerCase()}.${el.className||''} [${b.left.toFixed(1)},${b.right.toFixed(1)}]`);if(outside.length>=8)break;}}
      const pressFacts=document.querySelector('.press-facts');let press=null;if(visible(pressFacts)){const facts=[...pressFacts.querySelectorAll('.press-fact')].filter(visible);press={count:facts.length,issues:[]};for(const fact of facts){const s=getComputedStyle(fact),b=fact.getBoundingClientRect(),strong=fact.querySelector('strong'),span=fact.querySelector('span');if(!strong||!span)press.issues.push('missing value/label');if(s.display!=='flex'&&s.display!=='grid')press.issues.push(`fact display=${s.display}`);if(b.width<100)press.issues.push(`fact width=${b.width.toFixed(1)}`);if(strong&&span&&strong.getBoundingClientRect().bottom>span.getBoundingClientRect().top+2)press.issues.push('value/label overlap');}}
      const first=main?[...main.querySelectorAll('h1,h2')].find(visible):null,navBottom=visible(nav)?nav.getBoundingClientRect().bottom:0,firstTop=first?first.getBoundingClientRect().top:null,footerBox=visible(footer)?footer.getBoundingClientRect():null;
      const wrapperIssues=[];for(const el of document.querySelectorAll('main .wrap,main .container,main .content-wrap')){if(!visible(el))continue;const b=el.getBoundingClientRect();if(innerWidth>=1024&&b.width>Math.min(innerWidth,pageMaxPx)+2)wrapperIssues.push(`${el.className||el.tagName} width=${b.width.toFixed(1)} > canonical page max ${pageMaxPx}`);if(innerWidth>=1024&&b.width<innerWidth-80&&Math.abs(b.left-(innerWidth-b.right))>axisTolerancePx)wrapperIssues.push(`${el.className||el.tagName} not centered ${b.left.toFixed(1)}/${(innerWidth-b.right).toFixed(1)}`);if(innerWidth<=1024&&!el.closest('.full-bleed,[data-full-bleed="true"],.gallery,.collage')&&(b.left<mobileGutterPx||b.right>innerWidth-mobileGutterPx))wrapperIssues.push(`${el.className||el.tagName} tablet/mobile gutter ${b.left.toFixed(1)}/${(innerWidth-b.right).toFixed(1)}`);if(wrapperIssues.length>=8)break;}
      const mediaIssues=[];for(const el of document.querySelectorAll('main img,main video,main iframe,main svg')){if(!visible(el))continue;const b=el.getBoundingClientRect();if(b.width>innerWidth+2||b.right>innerWidth+2||b.left<-2)mediaIssues.push(`${el.tagName.toLowerCase()} bounds ${b.left.toFixed(1)}..${b.right.toFixed(1)}`);if(mediaIssues.length>=8)break;}
      const touchIssues=[];if(innerWidth<=1024){for(const el of document.querySelectorAll('button,summary,.btn,.menu-btn,nav a')){if(!visible(el))continue;const b=el.getBoundingClientRect();if(b.height<43.5)touchIssues.push(`${el.tagName.toLowerCase()}.${el.className||''} height=${b.height.toFixed(1)}`);if((el.matches('button,.menu-btn')||el.getAttribute('role')==='button')&&b.width<43.5)touchIssues.push(`${el.tagName.toLowerCase()}.${el.className||''} width=${b.width.toFixed(1)}`);if(touchIssues.length>=8)break;}}
      const footerSeparators=[];if(visible(footer)){for(const el of footer.querySelectorAll('.footer-social-disclosure,.fineprint')){if(!visible(el))continue;const s=getComputedStyle(el);if(parseFloat(s.borderTopWidth)>0||parseFloat(s.borderBottomWidth)>0)footerSeparators.push(`${el.className} separator returned`);}}
      return {overflow,outside,press,navHeight:visible(nav)?nav.getBoundingClientRect().height:0,firstGap:firstTop==null?null:firstTop-navBottom,footerHeight:footerBox?.height||0,wrapperIssues,mediaIssues,touchIssues,footerSeparators};
    },{pageMaxPx,axisTolerancePx,mobileGutterPx});
    if(r.overflow>1){failures.push(`${rel} @${width}x${height}: horizontal overflow ${r.overflow}px`);for(const x of r.outside)failures.push(`${rel} @${width}x${height}: overflow source ${x}`);}
    if(r.press){if(r.press.count!==4)failures.push(`${rel} @${width}x${height}: press facts count ${r.press.count}`);for(const x of r.press.issues)failures.push(`${rel} @${width}x${height}: press facts ${x}`);}
    if(r.navHeight&&(r.navHeight<48||r.navHeight>96))failures.push(`${rel} @${width}x${height}: nav height ${r.navHeight.toFixed(1)}px`);
    if(r.firstGap!=null&&r.firstGap>480)failures.push(`${rel} @${width}x${height}: excessive nav-to-first-heading gap ${r.firstGap.toFixed(1)}px`);
    if(r.footerHeight>1100)failures.push(`${rel} @${width}x${height}: footer height ${r.footerHeight.toFixed(1)}px`);
    for(const x of r.wrapperIssues)failures.push(`${rel} @${width}x${height}: ${x}`);for(const x of r.mediaIssues)failures.push(`${rel} @${width}x${height}: media ${x}`);for(const x of r.touchIssues)failures.push(`${rel} @${width}x${height}: touch target ${x}`);for(const x of r.footerSeparators)failures.push(`${rel} @${width}x${height}: ${x}`);
    checks++;
  }
  await page.close();
}
await browser.close();
if(failures.length){console.error(`ART exhaustive design audit failed (${failures.length} issue(s), ${checks} route/viewport checks):`);for(const f of failures.slice(0,350))console.error(`- ${f}`);if(failures.length>350)console.error(`... ${failures.length-350} more`);process.exit(1)}
console.log(`ART exhaustive design audit passed: ${contentFiles.length} content pages × ${widths.length} device-class viewports = ${checks} render checks from 320×568 through 3840×2160; canonical ${pageMaxPx}px page authority, overflow, media, navigation, touch, footer separator and geometry regressions verified.`);
