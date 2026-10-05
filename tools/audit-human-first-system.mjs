import fs from 'node:fs';
import path from 'node:path';
const css=fs.readFileSync('assets/css/site.css','utf8');
const design=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const errors=[];
const maxRem=value=>Number(value.match(/,([\d.]+)rem\)$/)?.[1])*16;
if(!(maxRem(design.typography.h1)<=60))errors.push('Shared H1 exceeds 60px');
if(!(maxRem(design.typography.h2)<=40))errors.push('Shared H2 exceeds 40px');
if(!css.includes('--art-reading-max:min(68ch,860px)'))errors.push('Prose cap missing');
if(!css.includes('a[data-external="true"]::after{content:" ↗"'))errors.push('External indicator component missing');
const compiler=fs.readFileSync('scripts/restore-production-design-authority.mjs','utf8');
if(/const generated=|out=`|replaceRequired\(/.test(compiler))errors.push('Deployment regenerates visual rules');
if(!compiler.includes('return {css,validated:true}'))errors.push('Deployment must preserve committed CSS');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const groups=new Map();
for(const [,url]of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)){
 const route=new URL(url).pathname,relative=route==='/'?'index.html':route.slice(1)+(route.endsWith('/')?'index.html':'');
 const html=fs.readFileSync(relative,'utf8');
 const external=[];
 for(const [,attrs,body]of html.matchAll(/<a(\s[^>]+)>([\s\S]*?)<\/a>/g)){
  const href=attrs.match(/href=["']([^"']+)["']/)?.[1];if(!href?.startsWith('http'))continue;
  const host=new URL(href.replaceAll('&amp;','&')).hostname;if(['banhalmi.art','www.banhalmi.art'].includes(host)){
   if(attrs.includes('data-external'))errors.push(relative+': internal link marked external');continue;
  }
  external.push(href);
  if(!/data-external="(?:true|inline)"/.test(attrs))errors.push(relative+': unmarked external link '+href);
  if(/data-external="inline"/.test(attrs)&&!body.includes('↗')&&!attrs.includes('press-record__title'))errors.push(relative+': missing inline indicator '+href);
  if(/target="_blank"/.test(attrs)){const rel=attrs.match(/rel="([^"]+)"/)?.[1]||'';if(!rel.includes('noopener')||!rel.includes('noreferrer'))errors.push(relative+': unsafe new window '+href);}
 }
 const key=relative.replace(/^(?:hu|de-at)\//,'');if(!groups.has(key))groups.set(key,[]);groups.get(key).push({relative,external:[...new Set(external)].sort()});
}
for(const entries of groups.values())for(const e of entries.slice(1)){
 // Existing localized ecosystem destinations intentionally differ. Compare evidence URLs.
 const evidence=values=>values.filter(u=>!/[?&]lang=|norbertbanhalmi\.com|banhalmi\.(at|hu)|banhalminorbert\.hu|blog\.banhalmi\.art/.test(u));
 if(JSON.stringify(evidence(e.external))!==JSON.stringify(evidence(entries[0].external)))errors.push(e.relative+': external evidence parity differs');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Human-first system passed: ${groups.size} translation groups; bounded headings, prose, external arrows, safe links and no artifact CSS regeneration.`);
