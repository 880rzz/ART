window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','personalization_storage':'denied','wait_for_update':500});
(function(){var c=null,ttl=180*24*60*60*1000;try{var raw=localStorage.getItem('bn-consent');if(raw){var saved=JSON.parse(raw),now=Date.now();if(saved&&typeof saved.at==='number'&&Number.isFinite(saved.at)&&saved.at<=now&&now-saved.at<ttl&&(saved.value==='granted'||saved.value==='denied'))c=saved.value;else localStorage.removeItem('bn-consent');}}catch(e){}
function clarityQueue(){window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};}
function loadClarity(){if(window.__clarity)return;window.__clarity=1;clarityQueue();window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});var s=document.createElement('script');s.id='bn-clarity';s.async=true;s.src='https://www.clarity.ms/tag/pll7h5wbpt?ref=bwt';document.head.appendChild(s);}
function denyClarity(){if(window.clarity){window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});window.clarity('consent',false);}['_clck','_clsk'].forEach(function(n){document.cookie=n+'=; Max-Age=0; path=/; SameSite=Lax';document.cookie=n+'=; Max-Age=0; path=/; domain=.banhalmi.art; SameSite=Lax';});}
if(c==='granted'){gtag('consent','update',{'analytics_storage':'granted'});loadGA();loadClarity();}
else if(c!=='denied'){document.addEventListener('DOMContentLoaded',function(){var b=document.getElementById('consent');if(b)b.hidden=false;});}
function loadGA(){if(window.__ga)return;window.__ga=1;var s=document.createElement('script');
s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-PKLH4H5YKD';document.head.appendChild(s);
gtag('js',new Date());gtag('config','G-PKLH4H5YKD',{'anonymize_ip':true,'allow_google_signals':false,'allow_ad_personalization_signals':false,'linker':{'domains':['banhalmi.art','norbertbanhalmi.com']}});}
window.bnConsent=function(ok){try{localStorage.setItem('bn-consent',JSON.stringify({value:ok?'granted':'denied',at:Date.now()}));}catch(e){}
if(ok){gtag('consent','update',{'analytics_storage':'granted'});loadGA();loadClarity();}else{gtag('consent','update',{'analytics_storage':'denied'});denyClarity();}
var b=document.getElementById('consent');if(b)b.hidden=true;};})();
