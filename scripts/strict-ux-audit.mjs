import fs from 'node:fs';

const pages=['index.html','index-en.html','yes-no.html','yes-no-en.html'];
const css=fs.readFileSync('assets/css/ux-hardening.css','utf8');
const runtime=fs.readFileSync('assets/js/runtime-enhancements.js','utf8');
const errors=[];

const cssContracts=[
  '--uxh-touch:44px','body.menu-open{overflow:hidden','position:fixed!important;top:var(--uxh-header)!important',
  'overscroll-behavior:contain!important','min-height:48px!important','font-size:16px!important',
  'text-wrap:balance','text-wrap:pretty','max-width:var(--uxh-reading)','@media(prefers-reduced-motion:reduce)',
  'env(safe-area-inset-left)','outline:3px solid #f4c95f!important'
];
for(const token of cssContracts)if(!css.includes(token))errors.push(`UX CSS contract missing: ${token}`);

const runtimeContracts=[
  'document.body.classList.toggle("menu-open",active)',
  'focusFirst=false','requestAnimationFrame(()=>mainMenu.querySelector(menuFocusable)?.focus())',
  'if(event.key!=="Tab")return','document.activeElement===first','document.activeElement===last',
  'setMainMenu(false,{restoreFocus:true})'
];
for(const token of runtimeContracts)if(!runtime.includes(token))errors.push(`menu accessibility contract missing: ${token}`);

for(const page of pages){
  const html=fs.readFileSync(page,'utf8');
  const contrast=html.indexOf('contrast-hardening.css');
  const ux=html.indexOf('ux-hardening.css?v=20260719-ux1');
  if(!(contrast>=0&&ux>contrast))errors.push(`${page}: ux-hardening.css must load after contrast-hardening.css`);
  if(!/<meta\b[^>]*name="viewport"/i.test(html))errors.push(`${page}: viewport metadata missing`);
}
for(const page of ['index.html','index-en.html']){
  const html=fs.readFileSync(page,'utf8');
  if(!html.includes('runtime-enhancements.js?v=20260719-ux1'))errors.push(`${page}: UX runtime cache version stale`);
}

if(/font-size:\s*(?:1[0-3]|[0-9])px!important/.test(css))errors.push('UX layer introduces text below 14px');
if(!css.includes('min-width:320px'))errors.push('320px viewport floor missing');

if(errors.length){
  console.error(`Strict UX audit failed with ${errors.length} issue(s):`);
  errors.forEach(e=>console.error(`- ${e}`));
  process.exit(1);
}
console.log(`Strict UX audit passed: ${pages.length} entry pages, ${cssContracts.length} visual contracts and ${runtimeContracts.length} interaction contracts verified.`);
