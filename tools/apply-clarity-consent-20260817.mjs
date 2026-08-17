import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const clarityId = 'pll7h5wbpt';
const newAnalyticsBlock = `<!-- No external fonts. Analytics: GA4 + Microsoft Clarity, both consent-first. -->
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','personalization_storage':'denied','wait_for_update':500});
(function(){var c=null,ttl=180*24*60*60*1000;try{var raw=localStorage.getItem('bn-consent');if(raw==='granted'||raw==='denied'){c=raw;}else if(raw){var saved=JSON.parse(raw);if(saved&&Date.now()-saved.at<ttl)c=saved.value;else localStorage.removeItem('bn-consent');}}catch(e){}
function clarityQueue(){window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};}
function loadClarity(){if(window.__clarity)return;window.__clarity=1;clarityQueue();window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});var s=document.createElement('script');s.id='bn-clarity';s.async=true;s.src='https://www.clarity.ms/tag/${clarityId}?ref=bwt';document.head.appendChild(s);}
function denyClarity(){if(window.clarity){window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});window.clarity('consent',false);}['_clck','_clsk'].forEach(function(n){document.cookie=n+'=; Max-Age=0; path=/; SameSite=Lax';document.cookie=n+'=; Max-Age=0; path=/; domain=.banhalmi.art; SameSite=Lax';});}
if(c==='granted'){gtag('consent','update',{'analytics_storage':'granted'});loadGA();loadClarity();}
else if(c!=='denied'){document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('consent');if(b)b.hidden=false;});}
function loadGA(){if(window.__ga)return;window.__ga=1;var s=document.createElement('script');
s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-90C452LJKQ';document.head.appendChild(s);
gtag('js',new Date());gtag('config','G-90C452LJKQ',{'anonymize_ip':true,'allow_google_signals':false,'allow_ad_personalization_signals':false,'linker':{'domains':['banhalmi.art','norbertbanhalmi.com']}});}
window.bnConsent=function(ok){try{localStorage.setItem('bn-consent',JSON.stringify({value:ok?'granted':'denied',at:Date.now()}));}catch(e){}
if(ok){gtag('consent','update',{'analytics_storage':'granted'});loadGA();loadClarity();}else{gtag('consent','update',{'analytics_storage':'denied'});denyClarity();}
var b=document.getElementById('consent');if(b)b.hidden=true;};})();
</script>`;

const copy = {
  en: 'I use Google Analytics and Microsoft Clarity to understand how people use this site and improve navigation and the archive experience. Both load only after your consent; advertising storage remains disabled.',
  hu: 'A Google Analytics és a Microsoft Clarity segítségével mérem, hogyan használják az oldalt, hogy javíthassam a navigációt és az archívum élményét. Mindkettő csak hozzájárulás után töltődik be; a reklámcélú tárolás tiltva marad.',
  de: 'Google Analytics und Microsoft Clarity helfen mir zu verstehen, wie die Website genutzt wird, um Navigation und Archiverlebnis zu verbessern. Beide werden erst nach Ihrer Einwilligung geladen; Werbespeicherung bleibt deaktiviert.'
};

function langOf(html){const m=html.match(/<html[^>]*lang=["']([^"']+)/i);const v=(m?.[1]||'en').toLowerCase();return v.startsWith('hu')?'hu':v.startsWith('de')?'de':'en';}
function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','_site','test-results','playwright-report'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f,out);else if(e.name.endsWith('.html'))out.push(f);}return out;}

const files=walk(root);let changed=0,analyticsPages=0;
for(const file of files){let html=fs.readFileSync(file,'utf8');if(!html.includes('G-90C452LJKQ'))continue;analyticsPages++;let next=html.replace(/<!-- No external fonts\. Analytics:[\s\S]*?<script>\s*window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)\{dataLayer\.push\(arguments\);\}[\s\S]*?window\.bnConsent=function\(ok\)[\s\S]*?<\/script>/,newAnalyticsBlock);
const lang=langOf(next);next=next.replace(/(<div\b[^>]*id=["']consent["'][^>]*>[\s\S]*?<p>)[\s\S]*?(<\/p>)/i,`$1${copy[lang]}$2`);
if(next!==html){fs.writeFileSync(file,next);changed++;}}
if(analyticsPages<80) throw new Error(`Unexpectedly low analytics page coverage: ${analyticsPages}`);
if(changed!==analyticsPages) throw new Error(`Not every analytics page changed: ${changed}/${analyticsPages}`);
console.log(`Clarity consent migration updated ${changed} analytics HTML pages.`);
