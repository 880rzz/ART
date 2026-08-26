import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[390,768,1024,1440];
const failures=[];
let checks=0;

function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
const pages=[...new Set(walk(siteDir).filter(file=>{const h=fs.readFileSync(file,'utf8');return /<main\b/i.test(h)&&!/http-equiv=["']refresh["']/i.test(h)&&/assets\/css\//i.test(h)&&/<details\b/i.test(h)}).map(toUrl))].sort();

const browser=await chromium.launch({headless:true});
for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await context.newPage();
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000})}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    await page.evaluate(()=>{
      const candidates=[...document.querySelectorAll('main details, footer details')];
      for(const d of candidates){d.open=true;d.setAttribute('data-expanded-audit','true')}
    });
    await page.waitForTimeout(120);
    const issues=await page.evaluate(()=>{
      const out=[];const w=innerWidth;
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const px=v=>parseFloat(v)||0;
      const details=[...document.querySelectorAll('main details[data-expanded-audit], footer details[data-expanded-audit]')].filter(visible);
      if(document.documentElement.scrollWidth-document.documentElement.clientWidth>1)out.push(`horizontal overflow ${document.documentElement.scrollWidth-document.documentElement.clientWidth}px`);
      for(const d of details){
        const dr=d.getBoundingClientRect();const summary=d.querySelector(':scope>summary');
        if(summary&&visible(summary)){const sr=summary.getBoundingClientRect();if(sr.height<44)out.push(`summary target ${sr.height.toFixed(1)}px < 44px`);if(sr.left<-1||sr.right>w+1)out.push('summary outside viewport')}
        for(const el of d.querySelectorAll(':scope>*')){if(!visible(el))continue;const r=el.getBoundingClientRect();if(r.left<-1||r.right>w+1)out.push(`${el.tagName.toLowerCase()} outside viewport`)}
        const s=getComputedStyle(d);if(px(s.maxWidth)>0&&dr.width>px(s.maxWidth)+2)out.push('details exceeds max-width');
      }
      const footer=document.querySelector('footer');
      if(footer){
        for(const d of footer.querySelectorAll('details[data-expanded-audit]')){
          if(!visible(d))continue;const content=[...d.children].filter(el=>el.tagName!=='SUMMARY'&&visible(el));
          for(const el of content){const r=el.getBoundingClientRect();if(r.width>w-20)out.push(`footer expanded content too wide ${r.width.toFixed(1)}px`)}
          const centered=d.matches('.footer-details,.banhalmi-ecosystem details,[class*="center"]')||getComputedStyle(d).textAlign==='center';
          if(centered){const dr=d.getBoundingClientRect();for(const el of content){const r=el.getBoundingClientRect();if(Math.abs((r.left+r.right)/2-(dr.left+dr.right)/2)>8)out.push('footer expanded content not centered')}}
        }
      }
      for(const el of document.querySelectorAll('main details[data-expanded-audit] p,main details[data-expanded-audit] li,footer details[data-expanded-audit] p,footer details[data-expanded-audit] li')){
        if(!visible(el)||(el.textContent||'').trim().length<80)continue;const r=el.getBoundingClientRect();if(w>=1024&&r.width>900)out.push(`expanded text measure ${r.width.toFixed(0)}px`)
      }
      return [...new Set(out)].slice(0,80);
    });
    if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);
    checks++;
    await page.close();
  }
  await context.close();
}
await browser.close();
if(failures.length){console.error(`Expanded-state responsive audit failed (${failures.length} page/viewport combinations; ${checks} checks).`);console.error(failures.join('\n'));process.exit(1)}
console.log(`Expanded-state responsive audit passed: ${pages.length} disclosure pages × ${widths.length} widths = ${checks} checks.`);
