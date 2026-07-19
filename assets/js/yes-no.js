(()=>{
'use strict';
const $=(s)=>document.querySelector(s);
const lang=document.documentElement.lang==='en'?'en':'hu';
const T={
 hu:{steps:[['1 · Tértisztítás','Nézz körül, engedd el a zavaró dolgokat, és vegyél egy lassú levegőt.'],['2 · Test–lélek–szellem','Figyeld meg a testedet, az érzéseidet és a gondolataidat. Nem kell megváltoztatnod semmit.'],['3 · Felsőbb Én / belső bölcsesség','Fogalmazd meg magadban: „Tiszta, józan és együttérző rálátást kérek.”']],ready:'A három alaplépés kész. Most felteheted a kérdést.',need:'Előbb írd be a kérdést.',thinking:'Az inga mérlegeli a kérdést…',yes:'IGEN',no:'NEM',deep:'Mit kell még meglátnom ezzel kapcsolatban?',start:'Következő',finish:'Kérdéshez lépek',error:'A folyamat most nem indult el. Kérlek, próbáld újra.',cryptoError:'Ebben a böngészőben nem érhető el biztonságos véletlengenerálás. A hiteles eredmény érdekében a sorsolás nem indult el.'},
 en:{steps:[['1 · Clear the space','Look around, release distractions, and take one slow breath.'],['2 · Body–mind–spirit','Notice your body, feelings and thoughts. Nothing needs to be changed right now.'],['3 · Higher Self / inner wisdom','Silently say: “I ask for clear, grounded and compassionate insight.”']],ready:'The three basic steps are complete. You can now ask your question.',need:'Enter the question first.',thinking:'The pendulum weighs the question…',yes:'YES',no:'NO',deep:'What else do I need to see here?',start:'Continue',finish:'Go to the question',error:'The flow could not start. Please try again.',cryptoError:'Secure random generation is unavailable in this browser. To preserve the integrity of the result, the draw was not started.'}
}[lang];

const SECURE_CRYPTO=(()=>{
 try{
  const c=globalThis.crypto||globalThis.msCrypto;
  return c&&typeof c.getRandomValues==='function'?c:null;
 }catch{return null;}
})();

function randInt(max){
 if(!Number.isInteger(max)||max<=0)throw new RangeError('max');
 if(!SECURE_CRYPTO)throw new Error('secure-random-unavailable');
 const lim=Math.floor(0x100000000/max)*max;
 const a=new Uint32Array(1);
 do{SECURE_CRYPTO.getRandomValues(a);}while(a[0]>=lim);
 return a[0]%max;
}

let step=0,busy=false,timer=null;
const menuToggle=$('#yesNoMenuToggle'),menu=$('#yesNoNav');
function setMenu(open){
 if(!menuToggle||!menu)return;
 menuToggle.setAttribute('aria-expanded',String(open));
 menu.classList.toggle('open',open);
}
if(menuToggle&&menu){
 menuToggle.addEventListener('click',()=>setMenu(menuToggle.getAttribute('aria-expanded')!=='true'));
 menu.addEventListener('click',(e)=>{if(e.target.closest('a'))setMenu(false);});
 document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){setMenu(false);menuToggle.focus();}});
 document.addEventListener('click',(e)=>{if(menuToggle.getAttribute('aria-expanded')==='true'&&!menu.contains(e.target)&&!menuToggle.contains(e.target))setMenu(false);});
}

const card=$('#basicStep'),next=$('#basicNext'),form=$('#qaForm'),status=$('#qaStatus'),needle=$('#qaNeedle'),result=$('#qaResult'),input=$('#qaQ'),again=$('#qaAgain');
if(!card||!next||!form||!status||!needle||!result||!input||!again){
 console.error('yes-no:init','Required interface elements are missing.');
 return;
}

function renderStep(){
 const [title,text]=T.steps[step];
 card.querySelector('h2').textContent=title;
 card.querySelector('p').textContent=text;
 $('#basicProgress').textContent=`${step+1}/3`;
 const fill=$('#yesnoProgressFill');
 if(fill)fill.style.width=`${((step+1)/3)*100}%`;
 next.textContent=step===2?T.finish:T.start;
}
function resetQuestion(){
 if(timer){clearTimeout(timer);timer=null;}
 busy=false;
 input.value='';
 result.hidden=true;
 result.textContent='';
 status.textContent=T.ready;
 needle.style.transform='rotate(0deg)';
 input.focus();
}

next.addEventListener('click',()=>{
 if(step<2){step++;renderStep();window.Haptics?.play?.('step');return;}
 card.hidden=true;
 form.hidden=false;
 status.textContent=T.ready;
 input.focus();
});
form.addEventListener('submit',(e)=>{
 e.preventDefault();
 if(busy)return;
 const q=input.value.trim();
 if(!q){status.textContent=T.need;input.focus();return;}
 busy=true;
 result.hidden=true;
 status.textContent=T.thinking;
 try{
  const idx=randInt(2);
  needle.style.transform=`rotate(${idx?34:-34}deg)`;
  timer=setTimeout(()=>{
   const ans=idx?T.yes:T.no;
   status.textContent=`${ans} · ${T.deep}`;
   result.replaceChildren();
   const strong=document.createElement('strong');strong.textContent=ans;
   const span=document.createElement('span');span.textContent=T.deep;
   result.append(strong,span);
   result.hidden=false;
   busy=false;
   timer=null;
   window.Haptics?.play?.('result');
  },850);
 }catch(error){
  console.error('yes-no:answer',error);
  busy=false;
  status.textContent=error?.message==='secure-random-unavailable'?T.cryptoError:T.error;
  needle.style.transform='rotate(0deg)';
 }
});
again.addEventListener('click',resetQuestion);
addEventListener('pagehide',()=>{if(timer)clearTimeout(timer);});
renderStep();
})();
