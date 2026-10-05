import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const xml=fs.readFileSync('sitemap.xml','utf8');
const entries=[...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>m[1]);
const seen=new Set();
const dates=new Map();
const errors=[];
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

for(const entry of entries){
  const loc=entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
  const lastmod=entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if(!loc){ errors.push('sitemap entry missing <loc>'); continue; }
  if(seen.has(loc)) errors.push(`duplicate sitemap URL: ${loc}`);
  seen.add(loc);
  if(!lastmod) errors.push(`${loc}: missing <lastmod>`);
  else if(!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) errors.push(`${loc}: invalid lastmod ${lastmod}`);
  else if(lastmod>today) errors.push(`${loc}: future lastmod ${lastmod}`);
  else dates.set(loc,lastmod);
}

const releaseFloor='2026-08-07';
for(const loc of [
  'https://www.banhalmi.art/',
  'https://www.banhalmi.art/hu/',
  'https://www.banhalmi.art/de-at/'
]){
  const date=dates.get(loc);
  if(!date) errors.push(`${loc}: key archive route missing from sitemap`);
  else if(date<releaseFloor) errors.push(`${loc}: stale lastmod ${date}; expected >= ${releaseFloor}`);
}


const verifyGitHistory=process.env.SITEMAP_VERIFY_GIT_HISTORY==='1';
if(verifyGitHistory){
  const origin='https://www.banhalmi.art';
  const historyRef=process.env.SITEMAP_HISTORY_REF || (process.env.GITHUB_EVENT_NAME==='pull_request' ? 'HEAD^2' : 'HEAD');
  function sourcePathFor(urlString){
    const url=new URL(urlString);
    if(url.origin!==origin) return null;
    const pathname=decodeURIComponent(url.pathname);
    if(pathname==='/') return 'index.html';
    const clean=pathname.replace(/^\//,'');
    return clean.endsWith('/') ? `${clean}index.html` : clean;
  }
  for(const [loc,lastmod] of dates){
    const sourcePath=sourcePathFor(loc);
    if(!sourcePath || !fs.existsSync(sourcePath)) continue;
    let gitDate=null;
    try{
      gitDate=execFileSync('git',['log','-1','--format=%cs',historyRef,'--',sourcePath],{encoding:'utf8'}).trim()||null;
    }catch{}
    if(!gitDate) errors.push(`${loc}: cannot resolve source history for ${sourcePath} at ${historyRef}`);
    else if(lastmod!==gitDate) errors.push(`${loc}: stale lastmod ${lastmod}; source ${sourcePath} latest ${gitDate} at ${historyRef}`);
  }
}

if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`ART Stage 33 sitemap freshness audit passed: ${entries.length} unique URLs with valid, current lastmod signals${verifyGitHistory ? ' and source-history parity' : ''}.`);
