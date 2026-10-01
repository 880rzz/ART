import fs from 'node:fs';
const core=JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const active=[
  'https://www.linkedin.com/in/norbertbanhalmi/',
  'https://www.instagram.com/norbert.banhalmi/',
  'https://www.facebook.com/banhalmi.norbert',
  'https://www.youtube.com/@norbert.banhalmi'
];
const retired=[
  'https://www.saatchiart.com/norbertbanhalmi',
  'https://www.tiktok.com/@banhalmi.norbert',
  'https://x.com/norbertbanhalmi'
];
const errors=[];
for(const u of active) if(!core.person?.activeSocialProfiles?.includes(u)) errors.push('machine-core active Person social missing '+u);
for(const u of retired) if(!core.person?.retiredProfiles?.includes(u)) errors.push('machine-core retired profile classification missing '+u);
if(core.person?.contactAuthority?.telephone!=='+4367761655592') errors.push('ART telephone must be Norbert');
if(core.person?.contactAuthority?.whatsapp!=='+4367761655592') errors.push('ART WhatsApp must be Norbert');
for(const page of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(page,'utf8');
  for(const u of active) if(!html.includes(u)) errors.push(page+': active Person sameAs/social missing '+u);
  for(const u of retired) if(html.includes(u)) errors.push(page+': retired active identity present '+u);
  if(!html.includes('+4367761655592') && !html.includes('+43 677 616 55592')) errors.push(page+': Norbert contact missing');
  if(html.includes('+4367764733262') || html.includes('+43 677 647 332 62')) errors.push(page+': Viko phone forbidden on ART');
}
if(errors.length){console.error('ART social/phone authority failed:\n- '+errors.join('\n- '));process.exit(1);}
console.log('ART social/phone authority OK: Person social ownership and Norbert-only contact contract are locked.');
