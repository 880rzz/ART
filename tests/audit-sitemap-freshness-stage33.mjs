import fs from 'node:fs';

const xml=fs.readFileSync('sitemap.xml','utf8');
const entries=[...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>m[1]);
const seen=new Set();
const dates=new Map();
const errors=[];
const today=new Date().toISOString().slice(0,10);

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

if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`ART Stage 33 sitemap freshness audit passed: ${entries.length} unique URLs with valid, current lastmod signals.`);
