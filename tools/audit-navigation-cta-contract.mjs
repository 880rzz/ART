import fs from 'node:fs';
import path from 'node:path';
const origin='https://www.banhalmi.art';
const failures=[];
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','.well-known']);
const generic=/^(?:click here|learn more|more|read more|here|kattints ide|tovább|több|bővebben|hier klicken|mehr|weiter)$/i;
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)=(["'])(.*?)\2/g))o[m[1].toLowerCase()]=m[3];return o}
function routeFor(rel){if(rel==='index.html')return'/';if(rel.endsWith('/index.html'))return'/'+rel.slice(0,-10);return'/'+rel}
function existsRoute(p){p=decodeURIComponent(p).replace(/\/+/g,'/');const rel=p.replace(/^\//,'');const candidates=[];if(!rel)candidates.push('index.html');else if(p.endsWith('/'))candidates.push(rel+'index.html');else {candidates.push(rel);candidates.push(rel+'.html');candidates.push(rel+'/index.html')}return candidates.some(f=>fs.existsSync(f)&&fs.statSync(f).isFile())}
function text(s){return s.replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp);/g,m=>m==='&amp;'?'&':' ').replace(/\s+/g,' ').trim()}
function isRedirect(h){return /<meta[^>]+http-equiv=["']refresh["']/i.test(h)||(/location\.(?:replace|href)\s*=/i.test(h)&&!/<main\b/i.test(h))}
function inspect(rel,abs){const h=fs.readFileSync(abs,'utf8');if(isRedirect(h)||!/<main\b/i.test(h))return;const base=origin+routeFor(rel);for(const m of h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)){const a=attrs(m[0]);const href=(a.href||'').trim();if(!href)continue;const isCta=/(?:^|\s)(?:btn|btn-link|cta|button)(?:\s|$)/i.test(a.class||'');if(isCta&&generic.test(text(m[0])))failures.push(`${rel}: generic CTA label “${text(m[0])}”`);if(/^javascript:/i.test(href)||href==='#')failures.push(`${rel}: unsafe/empty navigation target ${href}`);if(/^(?:mailto:|tel:|https?:\/\/|#)/i.test(href)&&!href.startsWith(origin))continue;let u;try{u=new URL(href,base)}catch{failures.push(`${rel}: invalid href ${href}`);continue}if(u.origin!==origin)continue;if(!existsRoute(u.pathname))failures.push(`${rel}: unresolved internal navigation ${href} → ${u.pathname}`)}}
function walk(d,b=''){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const rel=path.posix.join(b,e.name),abs=path.join(d,e.name);if(e.isDirectory())walk(abs,rel);else if(e.isFile()&&e.name.endsWith('.html'))inspect(rel,abs)}}
walk('.');
if(failures.length){console.error('ART navigation/CTA contract FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('ART navigation/CTA contract passed: all real archive pages use resolvable internal routes and descriptive CTAs.');
