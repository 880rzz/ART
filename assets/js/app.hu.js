

/* ==================== ALKALMAZÁSMAG / DIAGNOSZTIKA ==================== */
const CERIDWEN_APP_VERSION = "2026.07.08-full-1";
const CERIDWEN_DECK_VERSION = "Avalon-76-v3";
const CERIDWEN_JOURNAL_LIMIT = 150;
const CERIDWEN_STORAGE_VERSION = 3;
const CERIDWEN_DIAGNOSTICS = {
  version:CERIDWEN_APP_VERSION,
  errors:[],
  warnings:[],
  booted:false,
  bootTime:null
};
window.__CERIDWEN_DIAGNOSTICS__=CERIDWEN_DIAGNOSTICS;
function reportError(scope,error,userMessage){
  const item={scope:String(scope||"app"),message:String(error?.message||error||"Unknown error"),time:new Date().toISOString()};
  CERIDWEN_DIAGNOSTICS.errors.push(item);
  console.error(`[Ceridwen:${item.scope}]`,error);
  if(userMessage){
    const note=document.getElementById("journalNote")||document.getElementById("cauldronNote");
    if(note) note.textContent=userMessage;
  }
  return item;
}
function reportWarning(scope,message){
  const item={scope:String(scope||"app"),message:String(message||""),time:new Date().toISOString()};
  CERIDWEN_DIAGNOSTICS.warnings.push(item);
  console.warn(`[Ceridwen:${item.scope}] ${item.message}`);
  return item;
}
const SESSION_STORE=(()=>{try{return window.sessionStorage}catch(e){reportWarning("storage.session","A munkamenet-tároló nem érhető el ebben a környezetben.");return null}})();
const LOCAL_STORE=(()=>{try{return window.localStorage}catch(e){reportWarning("storage.local","A helyi tároló nem érhető el ebben a környezetben.");return null}})();
const SafeStorage={
  get(storage,key,fallback=null){try{if(!storage)return fallback;const raw=storage.getItem(key);return raw==null?fallback:raw;}catch(e){reportError("storage.get",e);return fallback;}},
  set(storage,key,value){try{storage?.setItem(key,value);return true;}catch(e){reportError("storage.set",e);return false;}},
  remove(storage,key){try{storage?.removeItem(key);return true;}catch(e){reportError("storage.remove",e);return false;}},
  jsonGet(storage,key,fallback=null){const raw=this.get(storage,key,null);if(raw===null)return fallback;try{return JSON.parse(raw);}catch(e){reportError("storage.parse",e);return fallback;}},
  jsonSet(storage,key,value){return this.set(storage,key,JSON.stringify(value));}
};
window.addEventListener("error",e=>reportError("runtime",e.error||e.message));
window.addEventListener("unhandledrejection",e=>reportError("promise",e.reason));

/* Source inspection and standard browser shortcuts remain available. */

/* ============================================================
   ÉRZÉKENY RANDOM MAG — minden húzás, inga és keverés innen kap jelet
   - elsődleges forrás: window.crypto.getRandomValues()
   - randInt(): rejection sampling, modulo-torzítás nélkül
   - secureShuffle(): Fisher–Yates, ugyanebből a kriptográfiai forrásból
   - Web Crypto nélkül a húzás biztonsági okból nem indul el.
   - minden döntés CSPRNG-alapú.
   ============================================================ */
const CERIDWEN_CRYPTO = (()=>{
  try{
    const c=(globalThis.crypto||globalThis.msCrypto);
    return c&&typeof c.getRandomValues==="function"?c:null;
  }catch(e){return null;}
})();
function randU32(){
  if(!CERIDWEN_CRYPTO){
    const message=cerEn()?"Secure random generation is unavailable in this browser.":"Ebben a böngészőben nem érhető el biztonságos véletlengenerálás.";
    reportError("random.crypto",new Error(message),message);
    throw new Error(message);
  }
  const u=new Uint32Array(1);
  CERIDWEN_CRYPTO.getRandomValues(u);
  return u[0]>>>0;
}
function rand53(){
  /* 53 bites, egyenletes lebegőpontos véletlen két független 32 bites szóból. */
  const hi=randU32()>>>5;   // 27 bit
  const lo=randU32()>>>6;   // 26 bit
  return (hi*67108864+lo)/9007199254740992;
}
function rnd(){ return rand53(); }
function randInt(max){
  max = Math.floor(Number(max)||0);
  if(max<=0) return 0;
  if(max<=0x100000000){
    const limit = Math.floor(0x100000000 / max) * max;
    let x=0;
    do{x=randU32();}while(x>=limit);
    return x % max;
  }
  /* Nagy tartományokra 53 bites rejection sampling. */
  const span=9007199254740992;
  const limit=Math.floor(span/max)*max;
  let x=0;
  do{x=Math.floor(rand53()*span);}while(x>=limit);
  return x%max;
}
function randBool(p=0.5){
  p=Math.max(0,Math.min(1,Number(p)));
  if(p<=0)return false;if(p>=1)return true;
  return rand53()<p;
}
function randRange(min,max){
  min=Math.floor(min);max=Math.floor(max);
  if(max<min)[min,max]=[max,min];
  return min+randInt(max-min+1);
}
function weightedIndex(weights){
  const clean=weights.map(w=>Math.max(0,Number(w)||0));
  const total=clean.reduce((a,b)=>a+b,0);
  if(total<=0)return randInt(weights.length||1);
  let r=rnd()*total;
  for(let i=0;i<clean.length;i++){r-=clean[i];if(r<0)return i;}
  return clean.length-1;
}
function secureShuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){const j=randInt(i+1);[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
const FLOW_MODE_KEY="ceridwen_flow_mode_v2";
let randomMode=SafeStorage.get(SESSION_STORE,FLOW_MODE_KEY,"ritual")||"ritual";
function makeDrawId(prefix="CWD"){
  const bytes=new Uint8Array(5);
  if(!CERIDWEN_CRYPTO) return `${prefix}-UNAVAILABLE`;
  CERIDWEN_CRYPTO.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("").toUpperCase()}`;
}
function createJournalMeta(kind="reading"){
  return {
    drawId:makeDrawId(kind==="pendulum"?"PND":"CWD"),
    timestamp:new Date().toISOString(),
    engineVersion:CERIDWEN_APP_VERSION,
    deckVersion:CERIDWEN_DECK_VERSION,
    randomMode,
    kind
  };
}
function journalDisplayDate(entry){
  if(entry?.timestamp){
    const d=new Date(entry.timestamp);
    if(!Number.isNaN(d.getTime())) return d.toLocaleString(cerEn()?"en-GB":"hu-HU",{dateStyle:"long",timeStyle:"short"});
  }
  return entry?.date||"";
}

const CARD_HISTORY_KEY="ceridwen_recent_cards_v2";
function loadCardHistory(){
  try{
    const raw=SafeStorage.jsonGet(SESSION_STORE,CARD_HISTORY_KEY,{});
    return raw&&typeof raw==="object"?raw:{};
  }catch(e){return {};}
}
function saveCardHistory(obj){
  if(!SafeStorage.jsonSet(SESSION_STORE,CARD_HISTORY_KEY,obj)) reportWarning("card-history","A húzási előzmény nem menthető ebben a böngészőben.");
}
function historyFor(pack){
  const h=loadCardHistory();
  return Array.isArray(h[pack])?h[pack].filter(Boolean):[];
}
function rememberCards(ids, pack="global"){
  const clean=ids.filter(Boolean);
  const h=loadCardHistory();
  const packs=[...new Set(["global", pack||"global"])];
  packs.forEach(k=>{
    const prev=Array.isArray(h[k])?h[k].filter(Boolean):[];
    h[k]=prev.concat(clean).slice(-24);
  });
  saveCardHistory(h);
}
function countBy(list){
  return list.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
}
function recencyPenalty(id, history){
  /* Többlépcsős lecsengés: a legutóbbi lap erősen, a régebbiek gyorsan gyengülve számítanak. */
  let penalty=0;
  for(let i=history.length-1,age=0;i>=0;i--,age++){
    if(history[i]===id){
      const fast=Math.exp(-age/2.6);
      const slow=.32*Math.exp(-age/8.5);
      penalty += fast+slow;
    }
  }
  return penalty;
}
function houseRecencyPenalty(house, history){
  let penalty=0;
  for(let i=history.length-1,age=0;i>=0;i--,age++){
    const c=DECK.find(x=>x.id===history[i]);
    if(c&&c.h===house) penalty += Math.exp(-age/5.5);
  }
  return penalty;
}
function immediateRepeatFactor(id, history){
  const last=history[history.length-1];
  const second=history[history.length-2];
  if(id===last) return .14;
  if(id===second) return .38;
  return 1;
}
function combinedRecentHistory(pack="global",packLimit=18,globalLimit=14){
  const globalRecent=historyFor("global");
  if(!pack||pack==="global") return globalRecent.slice(-Math.max(packLimit,globalLimit));
  return historyFor(pack).slice(-packLimit).concat(globalRecent.slice(-globalLimit));
}
function antiRepeatPool(pool, need, pack="global"){
  /* Nincs kemény kizárás: a közeli ismétléseket a súly csökkenti, de minden lap húzható marad. */
  return pool.slice();
}
function cardFlowWeight(card, pack="global"){
  const combined=combinedRecentHistory(pack,18,14);
  const cardPenalty=recencyPenalty(card.id,combined);
  const housePenalty=houseRecencyPenalty(card.h,combined);
  const immediate=immediateRepeatFactor(card.id,combined);

  /* Lágy, folytonos súlyozás: nincs tiltólista és nincs nullára csökkentett esély. */
  const novelty=1/(1+cardPenalty*1.35);
  const houseBalance=1/(1+housePenalty*.22);
  const base=.52;
  const weight=(base + novelty*.34 + houseBalance*.14)*immediate;
  return Math.max(.035,Math.min(1.20,weight));
}
function weightedSampleWithoutReplacement(pool, need, pack="global"){
  if(need<=0||!pool.length) return [];
  if(randomMode!=="ritual") return secureShuffle(pool).slice(0,need);
  const source=antiRepeatPool(pool,need,pack);
  /* Efraimidis–Spirakis: torzításmentes, súlyozott mintavétel visszatevés nélkül. */
  return source.map(c=>{
    const w=cardFlowWeight(c,pack);
    const u=Math.max(Number.MIN_VALUE,rnd());
    /* Gumbel-top-k / exponenciális verseny: stabil súlyozott mintavétel visszatevés nélkül. */
    return {c,key:-Math.log(u)/w};
  }).sort((a,b)=>a.key-b.key).slice(0,need).map(x=>x.c);
}
function druidicOrder(pool, pack="global"){
  return weightedSampleWithoutReplacement(pool,pool.length,pack);
}
function pickUniqueCards(pool, need, pack="global"){
  return weightedSampleWithoutReplacement(pool,need,pack);
}
function pickOneCard(pool, pack="global"){
  if(!pool.length) return null;
  if(randomMode!=="ritual") return pool[randInt(pool.length)]||null;
  const source=antiRepeatPool(pool,1,pack);
  const weights=source.map(c=>cardFlowWeight(c,pack));
  return source[weightedIndex(weights)] || pool[randInt(pool.length)] || null;
}
function randomModeDesc(){
  return randomMode==="ritual"
    ? "Druida áramlás: kriptográfiai véletlenből húz, folytonos súlyozással csökkenti a túl közeli ismétlést és finoman egyensúlyozza a házakat. Nincs tiltólista: minden elérhető lapnak mindig marad valódi esélye."
    : "Tiszta sorsolás: közvetlen, emlékezet nélküli kriptográfiai húzás, minden elérhető lap azonos alap-eséllyel.";
}
function renderRandomModes(){
  const row=gq("#randomModeRow"), desc=gq("#randomModeDesc");
  if(!row||!desc) return;
  row.querySelectorAll(".chip").forEach(b=>{
    b.classList.toggle("on", b.dataset.rm===randomMode);
    b.addEventListener("click",()=>{
      randomMode=b.dataset.rm||"ritual";
      SafeStorage.set(SESSION_STORE,FLOW_MODE_KEY,randomMode);
      renderRandomModes();
      resetTable();
    },{once:true});
  });
  desc.textContent=randomModeDesc();
}



/* ==================== RESZPONZÍV HÁTTÉRPONTOK ==================== */
(function initAmbientDots(){
  const svg=document.getElementById("stars");
  if(!svg) return;
  const reduceMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const mobileQuery=window.matchMedia?.("(max-width: 680px)");
  let lastMobile=null;
  let resizeTimer=0;

  function build(){
    const mobile=!!mobileQuery?.matches;
    if(lastMobile===mobile && svg.childElementCount) return;
    lastMobile=mobile;
    const count=reduceMotion?.matches ? (mobile?16:28) : (mobile?28:52);
    const NS="http://www.w3.org/2000/svg";
    const fragment=document.createDocumentFragment();
    svg.setAttribute("viewBox","0 0 100 100");
    svg.setAttribute("preserveAspectRatio","none");
    svg.replaceChildren();
    for(let i=0;i<count;i++){
      const dot=document.createElementNS(NS,"circle");
      dot.setAttribute("class","ambient-dot");
      dot.setAttribute("cx",(rnd()*100).toFixed(2));
      dot.setAttribute("cy",(rnd()*100).toFixed(2));
      dot.setAttribute("r",(mobile?(.12+rnd()*.20):(.10+rnd()*.18)).toFixed(2));
      dot.style.setProperty("--dx",`${randRange(-18,18)}px`);
      dot.style.setProperty("--dy",`${randRange(-24,24)}px`);
      dot.style.setProperty("--duration",`${randRange(14,28)}s`);
      dot.style.setProperty("--pulse",`${randRange(4,8)}s`);
      dot.style.setProperty("--delay",`${(-rnd()*12).toFixed(2)}s`);
      dot.style.setProperty("--opacity",(0.12+rnd()*.24).toFixed(2));
      fragment.appendChild(dot);
    }
    svg.appendChild(fragment);
  }

  build();
  mobileQuery?.addEventListener?.("change",build);
  reduceMotion?.addEventListener?.("change",()=>{lastMobile=null;build();});
  window.addEventListener("resize",()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(build,180);
  },{passive:true});
})();

/* ==================== EMBLEMS (házak) ==================== */
const EMBLEMS = {
  ust: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M25 42 Q25 80 50 80 Q75 80 75 42 Z" stroke="${c}" stroke-width="2" fill="none"/>
    <ellipse cx="50" cy="42" rx="27" ry="7" stroke="${c}" stroke-width="2" fill="none"/>
    <path d="M36 82 l-6 10 M64 82 l6 10 M50 81 v11" stroke="${c}" stroke-width="2"/>
    <path d="M44 34 q0 -8 6 -12 q-2 8 2 12 M54 32 q4 -6 2 -12 q6 6 4 13" stroke="${c}" stroke-width="1.6" fill="none"/>
    <circle cx="50" cy="16" r="2" fill="${c}"/><circle cx="41" cy="19" r="1.5" fill="${c}"/><circle cx="59" cy="19" r="1.5" fill="${c}"/>
  </svg>`,
  istennok: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M38 30 a 20 20 0 1 0 0 40 a 16 16 0 1 1 0 -40" stroke="${c}" stroke-width="2" fill="none"/>
    <path d="M62 30 a 20 20 0 1 1 0 40 a 16 16 0 1 0 0 -40" stroke="${c}" stroke-width="2" fill="none"/>
    <circle cx="50" cy="50" r="13" stroke="${c}" stroke-width="2" fill="none"/>
    <circle cx="50" cy="50" r="3" fill="${c}"/>
  </svg>`,
  tajak: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M50 24 C38 12 18 20 20 40 C22 62 40 74 50 80 C60 74 78 62 80 40 C82 20 62 12 50 24 Z" stroke="${c}" stroke-width="2" fill="none"/>
    <path d="M50 22 q4 -10 12 -12 q-2 9 -8 13" stroke="${c}" stroke-width="1.6" fill="none"/>
    <path d="M50 36 L54 46 L64 46 L56 53 L59 63 L50 57 L41 63 L44 53 L36 46 L46 46 Z" stroke="${c}" stroke-width="1.6" fill="none"/>
  </svg>`,
  osvenyek: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <line x1="28" y1="30" x2="40" y2="82" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="26" x2="50" y2="82" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <line x1="72" y1="30" x2="60" y2="82" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="28" cy="20" r="3" fill="${c}"/><circle cx="50" cy="16" r="3" fill="${c}"/><circle cx="72" cy="20" r="3" fill="${c}"/>
    <path d="M22 90 q28 -10 56 0" stroke="${c}" stroke-width="1.4" fill="none" opacity=".6"/>
  </svg>`,
  orzok: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M50 12 v56 M42 24 h16 M46 68 l4 10 4 -10" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="46" r="26" stroke="${c}" stroke-width="1.4" opacity=".5"/>
    <path d="M28 40 q-8 4 -10 12 M72 40 q8 4 10 12" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`,
  kristaly: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M50 10 L63 42 L50 88 L37 42 Z" stroke="${c}" stroke-width="2" fill="none" stroke-linejoin="round"/>
    <path d="M28 34 L38 52 L30 80 L20 52 Z" stroke="${c}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
    <path d="M72 34 L80 52 L70 80 L62 52 Z" stroke="${c}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
    <path d="M50 10 L50 88 M37 42 L63 42" stroke="${c}" stroke-width="1" opacity=".5"/>
  </svg>`,
  hold: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <path d="M60 16 a36 36 0 1 0 0 68 a28 28 0 1 1 0 -68Z" stroke="${c}" stroke-width="2" fill="none"/>
    <path d="M68 30 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5Z" stroke="${c}" stroke-width="1.4" fill="none"/>
    <circle cx="80" cy="58" r="2" fill="${c}"/><circle cx="70" cy="72" r="1.5" fill="${c}"/>
  </svg>`,
  angyal: c => `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <ellipse cx="50" cy="22" rx="13" ry="5" stroke="${c}" stroke-width="2" fill="none"/>
    <path d="M44 40 Q20 42 12 66 Q34 62 44 50 M56 40 Q80 42 88 66 Q66 62 56 50" stroke="${c}" stroke-width="2" fill="none" stroke-linejoin="round"/>
    <path d="M50 38 Q46 60 50 82 Q54 60 50 38Z" stroke="${c}" stroke-width="1.6" fill="none"/>
  </svg>`
};

/* ---- egyedi glifák az Őrzők házához ---- */
const GLYPHS = {
  merlin: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M30 82 L66 26" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M66 26 l6 -10" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="76" cy="12" r="3" fill="${c}"/><path d="M40 30 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3Z" stroke="${c}" stroke-width="1.4"/><path d="M70 60 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5Z" stroke="${c}" stroke-width="1.4"/></svg>`,
  artur: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M24 58 L34 34 L44 50 L50 28 L56 50 L66 34 L76 58 Z" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><circle cx="34" cy="30" r="2.5" fill="${c}"/><circle cx="50" cy="24" r="2.5" fill="${c}"/><circle cx="66" cy="30" r="2.5" fill="${c}"/><path d="M28 66 h44 M28 74 h44" stroke="${c}" stroke-width="1.6"/></svg>`,
  viviane: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M50 14 v46 M43 24 h14 M47 60 l3 6 3 -6" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M20 72 q15 -8 30 0 q15 8 30 0" stroke="${c}" stroke-width="1.8" fill="none"/><path d="M24 82 q13 -7 26 0 q13 7 26 0" stroke="${c}" stroke-width="1.4" fill="none" opacity=".6"/><path d="M34 60 q8 6 16 6 q8 0 16 -6" stroke="${c}" stroke-width="1.2" fill="none" opacity=".5"/></svg>`,
  morgana: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M62 26 a26 26 0 1 0 8 44 a 20 20 0 1 1 -8 -44" stroke="${c}" stroke-width="2" fill="none"/><path d="M58 44 q8 4 8 12 q0 8 -8 12" stroke="${c}" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="72" cy="30" r="2.4" fill="${c}"/></svg>`,
  taliesin: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M32 22 Q30 74 46 80 L64 80 Q60 40 70 22 Z" stroke="${c}" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M40 30 L58 74 M46 28 L62 68 M52 26 L66 60" stroke="${c}" stroke-width="1.2" opacity=".7"/><circle cx="50" cy="12" r="3" fill="${c}"/></svg>`,
  drred: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M22 70 Q30 40 52 38 Q74 36 78 20 Q80 40 62 50 Q80 52 84 66 Q68 62 56 66 Q40 72 22 70Z" stroke="${c}" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M52 38 q-4 -10 4 -16" stroke="${c}" stroke-width="1.6" fill="none"/><circle cx="66" cy="30" r="2" fill="${c}"/><path d="M28 78 q14 4 28 0" stroke="${c}" stroke-width="1.4" opacity=".6"/></svg>`,
  drwhite: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M78 70 Q70 40 48 38 Q26 36 22 20 Q20 40 38 50 Q20 52 16 66 Q32 62 44 66 Q60 72 78 70Z" stroke="${c}" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M48 38 q4 -10 -4 -16" stroke="${c}" stroke-width="1.6" fill="none"/><circle cx="34" cy="30" r="2" fill="${c}"/><path d="M44 78 q14 4 28 0" stroke="${c}" stroke-width="1.4" opacity=".6"/></svg>`,
  nimrod: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M30 20 Q64 50 30 80" stroke="${c}" stroke-width="2" fill="none"/><path d="M30 20 L30 80" stroke="${c}" stroke-width="1.2" opacity=".7"/><path d="M30 50 L78 50 M70 44 L78 50 L70 56" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  szarvas: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M42 88 L42 58 Q42 46 50 42 Q58 46 58 58 L58 88" stroke="${c}" stroke-width="2" fill="none"/><path d="M44 42 Q34 34 34 20 M34 30 q-8 -2 -10 -10 M34 22 q-7 0 -12 -6" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M56 42 Q66 34 66 20 M66 30 q8 -2 10 -10 M66 22 q7 0 12 -6" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="2" fill="${c}"/></svg>`,
  magdolna: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M30 26 h40 Q68 52 50 58 Q32 52 30 26Z" stroke="${c}" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M50 58 v18 M38 82 h24" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="14" r="3" stroke="${c}" stroke-width="1.6"/><path d="M46 40 q4 4 8 0" stroke="${c}" stroke-width="1.4" opacity=".7"/></svg>`,
  mihaly: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M50 12 v54 M42 24 h16 M46 66 l4 12 4 -12" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M38 34 Q22 40 18 56 Q34 50 42 40 M62 34 Q78 40 82 56 Q66 50 58 40" stroke="${c}" stroke-width="1.8" fill="none" stroke-linejoin="round"/><circle cx="50" cy="8" r="2.4" fill="${c}"/></svg>`,
  gral: c => `<svg viewBox="0 0 100 100" fill="none"><path d="M28 22 h44 Q70 54 50 60 Q30 54 28 22Z" stroke="${c}" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M50 60 v16 M36 82 h28" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M50 6 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z" stroke="${c}" stroke-width="1.4"/><path d="M40 34 q10 8 20 0" stroke="${c}" stroke-width="1.2" opacity=".6"/></svg>`
};

const HOUSES = {
  ust:      {name:"Az Üst Misztériumai",  color:"#c9a86a", desc:"Ceridwen és Gwion története kilenc lapban: az átalakulás teljes íve az első fortyogástól az újjászületésig."},
  istennok: {name:"Avalon Istennői",      color:"#d3a4b5", desc:"Öt walesi istennő, öt női őserő: a bölcsesség, a méltóság, a hitelesség, a sors és a csendes erő arcai."},
  tajak:    {name:"Avalon Szent Tájai",   color:"#8fd0c4", desc:"Kilenc helyszín a ködön túli szigeten — mindegyik egy belső táj, ahová a lélek időnként elzarándokol."},
  osvenyek: {name:"Az Awen Ösvényei",     color:"#9db8e8", desc:"Tíz gyakorlati útmutatás: az ihlet, a csend, az elengedés és a hazatérés ösvényei a mindennapokhoz."},
  orzok:    {name:"Varázslók és Őrzők",   color:"#de8f6f", desc:"Tizenkét nagy alak Camelotból, Avalonból és a magyar mítoszból: Merlin, Artúr, a sárkányok, Nimród, Mária Magdolna és Mihály arkangyal."},
  kristaly: {name:"Kristályerő",          color:"#b48ce0", desc:"Tizenkét kő, tizenkét minőség — a föld mélyének tanítói a hegyikristálytól a szelenitig."},
  hold:     {name:"Hold és Csillagok",    color:"#9fb9e8", desc:"Az égi ritmusok tíz fénye: holdfázisok, vezércsillagok és a nagy fordulatok kapui."},
  angyal:   {name:"Angyali Kórus",        color:"#e3b96a", desc:"Kilenc fényküldött: az őrangyaltól az arkangyalokon át a szeráfok izzó köréig."}
};

/* ==================== DECK (45) ==================== */
const DECK = [
/* I. AZ ÜST MISZTÉRIUMAI */
{h:"ust",no:"I",nm:"Az Üst",st:"Ami benned érlelődik",
 k:["kezdet","mélység","érlelődés"],
 u:"Minden nagy átalakulás egy üstben kezdődik: valami régóta fortyog benned, aminek ideje van. Ceridwen egy teljes évig kavargatta a főzetet — a mély dolgok nem sürgethetők.",
 f:"Kezdd el a belső munkát, és bízd rá magad a folyamat lassúságára. Ami most készül benned, tartós lesz.",
 a:"Türelmetlenség emészt: fel akarod gyorsítani, ami csak a maga idejében érhet be. A fedő emelgetése kihűti a főzetet.",
 m:"Bízom abban, ami bennem érlelődik."},
{h:"ust",no:"II",nm:"A Három Csepp",st:"A kegyelem váratlan ajándéka",
 k:["ihlet","kegyelem","fordulat"],
 u:"A bölcsesség három cseppje nem annak jutott, aki birtokolni akarta, hanem annak, aki alázattal kavargatta az üstöt. Az Awen oda hull, ahol szolgálat van.",
 f:"Váratlan felismerés, ihlet vagy lehetőség érkezik. Fogadd el — akkor is, ha úgy érzed, nem neked szánták.",
 a:"Alábecsülöd, amit kaptál, vagy bűntudatot érzel miatta. Az el nem fogadott ajándék elpárolog.",
 m:"Nyitott vagyok a kegyelem váratlan cseppjeire."},
{h:"ust",no:"III",nm:"A Nyúl",st:"Az ösztön első mozdulata",
 k:["ösztön","gyorsaság","önvédelem"],
 u:"Gwion első alakja a nyúl volt: amikor a föld megremeg, a test előbb tud, mint az ész. A futás néha a bölcsesség első formája.",
 f:"Hallgass a zsigeri megérzéseidre. A távolságtartás, amit most érzel, jogos és védelmez.",
 a:"A menekülés életformává vált: mindig épp elfutsz valami elől, amivel egyszer szembe kell nézni.",
 m:"Ösztöneim védenek és vezetnek."},
{h:"ust",no:"IV",nm:"Az Agár",st:"Ami a nyomodban jár",
 k:["következmény","szembenézés","tanító"],
 u:"Ceridwen agárrá változott, és üldözőbe vette Gwiont. Amit elveszünk vagy elkerülünk, az követni fog — nem büntetésből, hanem hogy tanítson.",
 f:"Nézz hátra bátran: az, ami üldöz, valójában a tanítód. A szembenézés megtöri a hajsza erejét.",
 a:"Most te lettél az üldöző — harag, kontroll vagy sértettség hajt valaki vagy valami után. Állj meg.",
 m:"Ami üldöz, azt tanítómmá fogadom."},
{h:"ust",no:"V",nm:"A Lazac",st:"Árral szemben, a forrás felé",
 k:["kitartás","mélység","hűség"],
 u:"Gwion lazaccá vált, és a folyó mélyébe vetette magát. A lazac az árral szemben úszik haza — a lélek is így tér vissza a saját forrásához.",
 f:"Ne félj a sodrással szemben haladni: amit mindenki elenged, azért neked lehet érdemes küzdeni.",
 a:"Kimerít az örökös küzdelem. Vizsgáld meg: valóban a forrásod felé úszol, vagy csak megszokásból feszülsz az árnak?",
 m:"A mélységem hazafelé vezet."},
{h:"ust",no:"VI",nm:"A Vidra",st:"A mélység is ismer téged",
 k:["érzelmek","hajlékonyság","játék"],
 u:"Ceridwen vidraként követte a mélybe. Az érzelmek vizében sem bújhatsz el önmagad elől — de a vidra azt is tudja, hogy a víz nemcsak veszély: játéktér is.",
 f:"Fordulj könnyedséggel a nehéz érzések felé. A hajlékonyság most többet ér, mint az erő.",
 a:"Kicsúszol minden komoly beszélgetés alól. A játékosság maszkká vált, amely mögé az érintettséged rejted.",
 m:"Könnyedén úszom a mély vizekben is."},
{h:"ust",no:"VII",nm:"Az Ökörszem",st:"A kicsinység szabadsága",
 k:["távlat","könnyűség","szellem"],
 u:"Gwion apró madárrá lett, és az ég felé menekült. Az ökörszem a legkisebb madár — mégis a madarak királya, mert a sas szárnyán rejtőzve mindenkinél magasabbra jutott.",
 f:"Emelkedj a helyzet fölé: kicsinek lenni most szabadságot jelent. A távlat mindent átrendez.",
 a:"A „fölülemelkedés” valójában elszakadás lett — annyira az égben jársz, hogy elveszted a föld ízét.",
 m:"Kicsi vagyok, és ezért szabad."},
{h:"ust",no:"VIII",nm:"A Sólyom",st:"Az éles látás órája",
 k:["fókusz","igazság","sors"],
 u:"Ceridwen sólyomként ereszkedett le az égből. A sólyomszem elől nincs rejtekhely: eljön az óra, amikor a dolgok pontosan annyinak látszanak, amennyik.",
 f:"Nézz rá élesen a helyzetedre, kertelés nélkül. A tiszta látás most kegyelem, nem fenyegetés.",
 a:"A pontosság kíméletlenséggé vált — magaddal vagy másokkal szemben. Az igazsághoz gyengédség is kell.",
 m:"Merek élesen látni, és szelíden ítélni."},
{h:"ust",no:"IX",nm:"A Búzaszem",st:"Halál, amely fogantatás",
 k:["megadás","újjászületés","Taliesin"],
 u:"Gwion búzaszemmé lett a szérűn, és Ceridwen fekete tyúkként lenyelte. Kilenc hónap múlva megszületett Taliesin, a Tündöklő Homlokú. A legkisebbé válva fogansz újjá.",
 f:"Engedd el a régi énedet egészen. Ami most végnek látszik, az valójában fogantatás.",
 a:"Görcsösen kapaszkodsz egy lezárult szakaszba. A be nem engedett vég elzárja az új születést.",
 m:"Merek maggá válni, hogy újjászülethessek."},

/* II. AVALON ISTENNŐI */
{h:"istennok",no:"X",nm:"Ceridwen",st:"Az Üst Úrnője",
 k:["átalakulás","bölcsesség","sötét anya"],
 u:"A tó szigetén lakó nagyasszony, akinek üstjéből az Awen, az isteni ihlet árad. Sötét anya: elnyel, hogy újjászülhessen. A bárdok magukat az ő gyermekeinek nevezték.",
 f:"Egy nagy átalakulás őrzője lettél — a magadé vagy valaki másé. Kavargasd hűséggel, ami rád bízatott.",
 a:"A kontroll átvette az irányítást: úgy őrzöd az üstöt, hogy másnak nem hagysz teret a saját útjához.",
 m:"Az átalakulás erejét szolgálom, nem birtoklom."},
{h:"istennok",no:"XI",nm:"Rhiannon",st:"A Lovak Királynője",
 k:["méltóság","szuverenitás","saját tempó"],
 u:"A Nagy Királynő fehér lován senki sem érte utol — pedig sohasem vágtatott. Igaztalan vádat is méltósággal viselt, míg az igazság ki nem derült. A szuverenitás istennője.",
 f:"Haladj a saját ritmusodban, és ne magyarázkodj. A méltóság a leggyorsabb hátas.",
 a:"Mások ítéletének súlya alatt cipekedsz, olyan terhet hordva, amely sosem volt a tiéd. Tedd le.",
 m:"A magam ütemében érek oda, ahová tartok."},
{h:"istennok",no:"XII",nm:"Blodeuwedd",st:"A Virágarcú",
 k:["hitelesség","választás","felszabadulás"],
 u:"Virágokból teremtették, hogy más elvárásainak feleljen meg — de ő a saját útját választotta, és bagollyá változva az éjszaka szabad látója lett.",
 f:"Vállald fel, ki vagy valójában, akkor is, ha nem erre „teremtettek”. A hiteles élet ára a régi szerep.",
 a:"Egy készen kapott szerepben élsz, és lassan elfelejted, mit akartál te magad. A bagoly szeme éjjel is lát — nézz körül.",
 m:"Azzá válok, akinek magamat választom."},
{h:"istennok",no:"XIII",nm:"Arianrhod",st:"Az Ezüst Kerék",
 k:["sors","idő","próbatételek"],
 u:"A csillagvár úrnője, akinek ezüst kereke az idő és a karma forgása. Próbákat állít, mert tudja: csak a kiállt próba tesz jogosulttá a névre, a fegyverre, a társra.",
 f:"Az élet most próbát állít eléd — nem ellened, hanem érted. Ami jár neked, azt ki kell érdemelni, és képes vagy rá.",
 a:"Körbe-körbe forogsz ugyanabban a mintában. A kerék addig ismétel, míg a leckét meg nem tanulod.",
 m:"A próbáim engem faragnak, nem koptatnak."},
{h:"istennok",no:"XIV",nm:"Branwen",st:"A Fehér Holló",
 k:["csendes erő","üzenet","együttérzés"],
 u:"A szépséges királyné, aki idegen földön szenvedett, mégis seregélyt tanított beszélni, hogy üzenetét hazaküldje. A csendes kitartás és a szenvedésből született együttérzés istennője.",
 f:"Ha most nem tudsz kilépni a helyzetből, találd meg a magad seregélyét: a kis csatornát, amelyen át hű maradhatsz önmagadhoz.",
 a:"Némán tűrsz, pedig már van kiút. A türelem erény — az önfeladás nem az.",
 m:"A leghalkabb hangom is képes hazatalálni."},

/* III. AVALON SZENT TÁJAI */
{h:"tajak",no:"XV",nm:"A Ködfüggöny",st:"A küszöb, amely hitet kér",
 k:["küszöb","hit","átjárás"],
 u:"Avalont köd választja el a világtól, és csak az jut át rajta, aki hisz abban, hogy a sziget létezik. A köd nem akadály: szűrő.",
 f:"Nem látod még, mi vár túl — de nem is kell. Egyetlen lépést tégy meg hittel, a köd lépésenként nyílik.",
 a:"A bizonytalanság megbénított: addig nem indulsz, míg mindent nem látsz előre. Így a köd sosem nyílik meg.",
 m:"Egy lépésnyi látás elég az induláshoz."},
{h:"tajak",no:"XVI",nm:"Az Almáskert",st:"A sziget édessége",
 k:["bőség","jutalom","gyógyulás"],
 u:"Avalon neve annyit tesz: az Almák Szigete. A kert, ahol a fák egyszerre virágoznak és teremnek — a beérett munka és a megérdemelt édesség helye.",
 f:"Ideje learatni és megízlelni, amit termeltél. A bőség elfogadása is gyakorlat.",
 a:"A gyümölcs beérett, de te tovább robotolsz, mintha még mindig tél volna. A meg nem evett alma lehullik.",
 m:"Megengedem magamnak az élet édességét."},
{h:"tajak",no:"XVII",nm:"A Szent Tó",st:"A tükör, amely nem hazudik",
 k:["tükör","tudatalatti","csend"],
 u:"A tó, amelyből kard emelkedik, és amelynek mélye kincseket őriz. Sima tükrén önmagadat látod — de csak akkor, ha nem kavarod fel.",
 f:"Csendesedj el, és nézz bele abba, ami felszínre kér. A válasz nem kint van, hanem a tükörben.",
 a:"Folyton kavarod a vizet — tevékenységgel, zajjal, görgetéssel —, hogy ne kelljen belenézned. A tó kivár.",
 m:"Elég csendes vagyok ahhoz, hogy lássam magam."},
{h:"tajak",no:"XVIII",nm:"A Tor",st:"A szent domb spirálútja",
 k:["rálátás","zarándoklat","emelkedés"],
 u:"A Tor — az avaloni képzeletben Glastonbury szent dombja — spirálösvényen mászható meg: nem toronyiránt, hanem körökben, ahogy a lélek is érik. Fentről a táj összefüggései látszanak, nem a részletek.",
 f:"Indulj el fölfelé, még ha kerülőnek tűnik is az út. A rálátásért meg kell mászni a dombot.",
 a:"Csak a csúcs érdekel, az út nem — vagy fent ragadtál, és már nem érzed a völgy életét. A spirál le is vezet.",
 m:"Minden körrel magasabbról látok."},
{h:"tajak",no:"XIX",nm:"A Vörös Forrás",st:"Az élet vasas vize",
 k:["életerő","szenvedély","női erő"],
 u:"A Kehely-kút vörös vize vasat hord: a föld vére. Az élet nem steril — meleg, sűrű, lüktető. A vörös forrás a testet, a vágyat és a teremtő erőt táplálja.",
 f:"Térj vissza a testedbe: mozgás, érintés, alkotás, szenvedély. Az életerőd forrása újra megnyílt.",
 a:"Kiszáradtál — vagy épp túlforrsz: a szenvedély emészteni kezdett táplálás helyett. Igyál mértékkel, de igyál.",
 m:"Az élet vörös vize bennem árad."},
{h:"tajak",no:"XX",nm:"A Fehér Forrás",st:"Az ősök kristályvize",
 k:["tisztaság","ősök","alap"],
 u:"A fehér forrás mészben gazdag vize kővé építi, amit érint: csontot, alapot, emlékezetet. A vörös az élet — a fehér az, ami az életet megtartja.",
 f:"Tisztíts és egyszerűsíts. Térj vissza az alapokhoz: mi az a néhány dolog, ami valóban tart téged?",
 a:"A rend merevséggé csontosodott. Ami egykor tartott, most szorít — ideje lazítani az öltésen.",
 m:"Tiszta alapokra építem a napjaimat."},
{h:"tajak",no:"XXI",nm:"A Papnők Tüze",st:"A kilencek köre",
 k:["közösség","szolgálat","beavatás"],
 u:"Avalon szigetén kilenc papnő őrizte a tüzet — egyikük sem egyedül. A láng attól örök, hogy mindig van, aki táplálja, míg a másik pihen.",
 f:"Ne egyedül csináld. Keresd meg a körödet: azokat, akikkel felváltva őrizhetitek egymás tüzét.",
 a:"Mindent magad viszel, segítséget kérni gyengeségnek érzed. A magányos tűz hamarabb alszik ki.",
 m:"Merek kérni, és merek adni is."},
{h:"tajak",no:"XXII",nm:"A Fekete Bárka",st:"A méltó átkelés",
 k:["lezárás","gyász","kísérés"],
 u:"A sebesült Arthurt fekete bárka vitte Avalonba, három királyné kíséretében. Vannak végek, amelyeket nem megoldani kell, hanem méltósággal átkísérni.",
 f:"Engedd meg magadnak a búcsút és a gyászt — vagy légy te a csendes kísérő valaki más átkelésénél.",
 a:"Egy lezáratlan búcsú visszahúz. A bárka a parton vár: amíg nem engeded útjára, te sem indulhatsz tovább.",
 m:"Méltósággal engedem el, aminek ideje lejárt."},
{h:"tajak",no:"XXIII",nm:"Az Alma Csillaga",st:"A hétköznapokba rejtett mágia",
 k:["rejtett rend","csoda","figyelem"],
 u:"Vágd ketté az almát keresztben: ötágú csillag rejlik benne. A mágia nem távoli szigeteken lakik — a konyhaasztalodon is ott van, ha jól vágod fel a világot.",
 f:"Nézd meg újra, ami megszokott: egy kapcsolat, egy munka, egy hétköznap. Máshogy felvágva csillag van benne.",
 a:"A csodát mindig máshol keresed — új helyen, új emberben, új kezdetben. Közben a kezedben lévő alma érintetlen.",
 m:"A csillagot ott találom meg, ahol vagyok."},

/* IV. AZ AWEN ÖSVÉNYEI */
{h:"osvenyek",no:"XXIV",nm:"A Hallgatás Ösvénye",st:"A csend, amely beszél",
 k:["csend","befelé figyelés","szünet"],
 u:"Mielőtt Taliesin énekelni kezdett volna, kilenc hónapot töltött a sötét csendben. Minden igaz szó hallgatásból születik.",
 f:"Vonulj el egy időre a zajból — a válaszod a csendben már készül. Ne szólj, míg a szó magától nem kér hangot.",
 a:"A hallgatásod fallá vált: nem érlel, hanem elzár. Van, amit már ki kellene mondani.",
 m:"A csendem termékeny föld."},
{h:"osvenyek",no:"XXV",nm:"Az Ihlet Ösvénye",st:"Az Awen árama",
 k:["alkotás","ihlet","áramlás"],
 u:"Az Awen — a három fénysugár — az isteni ihlet, amely a bárdokat dalra fakasztotta. Nem kell kiérdemelni: csak csatornát kell nyitni neki.",
 f:"Alkoss ma valamit, bármit — a tökéletesség igénye nélkül. Az ihlet a mozdulatot követi, nem megelőzi.",
 a:"A múzsára vársz, ő meg rád. Az elzárt csatornán a legszebb áram sem folyik át: kezdd el, akárhogy.",
 m:"Csatorna vagyok, nem forrás — és ez felszabadít."},
{h:"osvenyek",no:"XXVI",nm:"Az Átváltozás Ösvénye",st:"Alakot váltani szabad",
 k:["rugalmasság","alakváltás","növekedés"],
 u:"Gwion négyszer váltott alakot, mire Taliesinné érett. Aki ugyanaz marad minden helyzetben, nem hiteles — csak merev.",
 f:"Válts alakot bátran: új szerep, új módszer, új ritmus. A lényeged nem az alakban lakik.",
 a:"Annyi alakot váltottál már, hogy nem tudod, melyik vagy te. Ülj le, és kérdezd meg: ki az, aki változik?",
 m:"Változhatok anélkül, hogy elveszíteném magam."},
{h:"osvenyek",no:"XXVII",nm:"Az Elengedés Ösvénye",st:"Az üres kéz bátorsága",
 k:["elengedés","bizalom","tér"],
 u:"Ceridwen elvesztette a főzetet, amelyért egy évig dolgozott — és éppen ebből a veszteségből született a legnagyobb bárd. Az üres kéz tud újat fogni.",
 f:"Engedd el a tervet, a kimenetelt, a kontrollt. Ami a helyére jön, nagyobb lehet annál, amit szorongattál.",
 a:"Úgy teszel, mintha elengedted volna, de a hátad mögött még markolod. A félig nyitott kéz semmit sem kap.",
 m:"Üres kézzel többet tudok tartani."},
{h:"osvenyek",no:"XXVIII",nm:"A Gyógyulás Ösvénye",st:"A két forrás egyensúlya",
 k:["önápolás","regenerálódás","türelem"],
 u:"Avalonba gyógyulni vitték a sebesülteket. A gyógyulás nem esemény, hanem ösvény: vörös víz az erőhöz, fehér víz a nyugalomhoz, és idő, idő, idő.",
 f:"Adj magadnak gyógyulási időt bűntudat nélkül. A pihenés nem a munka hiánya — a munka része.",
 a:"Sebbel dolgozol tovább, mintha a fájdalom teljesítménnyel gyógyulna. Nem gyógyul: mélyül.",
 m:"A gyógyulásom is munka — a legfontosabb fajta."},
{h:"osvenyek",no:"XXIX",nm:"Az Emlékezés Ösvénye",st:"Az ősök a hátad mögött",
 k:["gyökerek","ősök","régi tudás"],
 u:"A bárdok nemzedékek emlékezetét hordozták dalaikban. Aki tudja, honnan jött, azt nem lehet könnyen kimozdítani abból, ahová tart.",
 f:"Fordulj a gyökereidhez: családi történetek, régi tudás, elfeledett készségeid. Ott erő van elraktározva.",
 a:"A múlt kötéllé vált, amely visszahúz. Emlékezni áldás — a múltban lakni börtön.",
 m:"A gyökereim táplálnak, nem visszatartanak."},
{h:"osvenyek",no:"XXX",nm:"A Bátorság Ösvénye",st:"A kimondott szó ereje",
 k:["kiállás","őszinteség","tett"],
 u:"A druidák hittek a kimondott szó teremtő erejében. Amit kimondasz, annak alakja lesz a világban — ezért nehéz, és ezért hatalmas.",
 f:"Mondd ki, amit régóta kerülgetsz: a kérést, a nemet, az igent, a bocsánatot. A szó ma tetté válik.",
 a:"A bátorság vakmerőséggé élesedett, vagy a szavaid megelőzik a szíved. Előbb tudd, mit teremtenél.",
 m:"A szavaim hidak, és merek rajtuk átkelni."},
{h:"osvenyek",no:"XXXI",nm:"A Szövetség Ösvénye",st:"A kerekasztal tanítása",
 k:["kapcsolat","egyenrangúság","hűség"],
 u:"A kerekasztalnak nincs főhelye: mindenki egyenlőként ül mellette. Az igaz szövetség nem hierarchia, hanem kör — mindenki látja a másik arcát.",
 f:"Erősítsd meg a szövetségeidet: mondj köszönetet, tisztázz félreértést, ülj le valakivel egy asztalhoz.",
 a:"Egy kapcsolatodban felborult az egyensúly: valaki az asztalfőre ült. Talán te. Rendezzétek át a kört.",
 m:"Egyenrangú körben ülök, és tartom a helyem."},
{h:"osvenyek",no:"XXXII",nm:"A Küszöb Ösvénye",st:"Se kint, se bent",
 k:["átmenet","döntés","liminális idő"],
 u:"A kelták szent helynek tartották a küszöböket: a partot, a szürkületet, a kaput. Ahol két világ találkozik, ott a legvékonyabb a fátyol — és a legnagyobb a lehetőség.",
 f:"Átmeneti időben jársz: valami lezárult, az új még nem kezdődött el. Ne siettesd — a küszöbön látni lehet mindkét irányba.",
 a:"A küszöbön rendezkedtél be: a döntés halogatása maga lett a döntés. A kapu nem marad örökké nyitva.",
 m:"A küszöbön állva mindkét irányba látok — és lépni fogok."},
{h:"osvenyek",no:"XXXIII",nm:"A Hazatérés Ösvénye",st:"Avalon benned van",
 k:["megérkezés","önelfogadás","teljesség"],
 u:"A titok, amit minden zarándok utoljára ért meg: Avalon nem a ködön túl van, hanem a köd mögötted oszlik fel, amikor hazaérsz — önmagadhoz.",
 f:"Megérkeztél valahová, ahová hosszan tartott az út. Állj meg, ismerd fel, ünnepeld meg. Itthon vagy.",
 a:"Folyton útban vagy valahová, és a megérkezést mindig elhalasztod. A hazatérés nem esemény — döntés.",
 m:"Ott vagyok otthon, ahol önmagam vagyok."},

/* V. VARÁZSLÓK ÉS ŐRZŐK */
{h:"orzok",no:"XXXIV",nm:"Merlin",st:"A Látó",g:"merlin",
 k:["látás","tanács","időn túli tudás"],
 u:"Merlin a legenda szerint visszafelé él az időben: emlékszik arra, ami még nem történt meg. A látó nem mond jövőt — mintázatot lát ott, ahol más csak eseményeket.",
 f:"Lépj hátra, és keresd a mintázatot a helyzetedben. Ha kell, kérj tanácsot attól, aki messzebbre lát — vagy hallgass a saját belső látódra.",
 a:"A tudás toronnyá vált: mindent átlátsz, de semmiben sem veszel részt. Vigyázz — a legbölcsebb varázslót is kristálybarlangba lehet zárni.",
 m:"Látom a mintázatot, és merek belépni a képbe."},
{h:"orzok",no:"XXXV",nm:"Artúr Király",st:"Az Igaz Király",g:"artur",
 k:["hivatás","felelősség","egység"],
 u:"A kardot nem a legerősebb húzta ki a kőből, hanem az, akit a szolgálat hívott. Artúr nagysága nem a hódítás volt, hanem a kerekasztal: megosztott erők egyesítése.",
 f:"Fogadd el a vezetést vagy felelősséget, amely most téged hív. Egyesíts, ne uralkodj — ez tesz igaz királlyá.",
 a:"A korona teherré vált: mindent egyedül cipelsz. Vagy olyan kardra formálsz jogot, amely nem téged hívott.",
 m:"Azt a kardot húzom ki, amelyik engem hív."},
{h:"orzok",no:"XXXVI",nm:"A Tó Asszonya",st:"A mély ajándéka",g:"viviane",
 k:["beavatás","ajándék","sáfárság"],
 u:"A tó mélyéről egy kéz nyújtja Excaliburt — de a kard kölcsön van: amikor lejár az ideje, vissza kell dobni a vízbe. Minden nagy ajándék így működik.",
 f:"Képesség, eszköz vagy lehetőség kerül hozzád a mélyből. Használd tisztán, szolgálatra — nem birtoklásra kaptad.",
 a:"Nem adod vissza, ami lejárt: egy szerepet, egy címet, egy erőt, amelynek ideje elmúlt. A meg nem tért kard megrozsdásodik.",
 m:"Amit a mélytől kaptam, tisztán forgatom — s ha kéri, visszaadom."},
{h:"orzok",no:"XXXVII",nm:"Morgana",st:"Az Árnyék Úrnője",g:"morgana",
 k:["árnyékmunka","gyógyítás","félreértett erő"],
 u:"Morgant sötét boszorkánynak festették — pedig Avalon gyógyítója volt, és ő állt a fekete bárkán is, amikor a sebesült királyt hazakísérte. Az árnyékban gyógyerő lakik.",
 f:"Fordulj az árnyékod felé: az elutasított, szégyellt részedben van elzárva az erőd másik fele.",
 a:"A sebzettség bosszúvá élesedett — vagy hagyod, hogy mások fessék meg rólad a képet, és lassan elhiszed nekik.",
 m:"Az árnyékom nem ellenségem — a másik kezem."},
{h:"orzok",no:"XXXVIII",nm:"Taliesin",st:"A Tündöklő Homlokú",g:"taliesin",
 k:["tehetség","a szó ereje","kibontakozás"],
 u:"Kilenc hónap sötét csend után Taliesin első dolga az ének volt — és a dala királyokat némított el. A tehetség kimondva válik valóvá.",
 f:"Mutasd meg a hangod, a művedet, a tudásodat. Amit rejtegetsz, az nem szerénység — az adósság.",
 a:"Rejted a fénylő homlokod, vagy épp ellenkezőleg: a csillogás fontosabb lett, mint a dal. A bárd a dalt szolgálja, nem a tapsot.",
 m:"A hangom ajándék — kimondom."},
{h:"orzok",no:"XXXIX",nm:"A Vörös Sárkány",st:"A belső tűz",g:"drred",
 k:["életerő","gyökér-erő","kitartás"],
 u:"Dinas Emrys tornya alatt két sárkány küzdött a mélyben — a vörös a föld népének ki nem oltható ereje. A te tornyod alatt is él egy vörös sárkány.",
 f:"Az erőd mélyebb, mint hinnéd: táplált tűz, nem szalmaláng. Merj rá támaszkodni.",
 a:"A tűz elfojtva befelé éget — dühként, feszültségként. Vagy kihűlt a parázs: ideje óvatosan újraéleszteni.",
 m:"A tüzem mély, és engem szolgál."},
{h:"orzok",no:"XL",nm:"A Fehér Sárkány",st:"Az ellenerő",g:"drwhite",
 k:["kihívás","próba","régi rend"],
 u:"A fehér sárkány nem gonosz — ő az erő, amely nekifeszül a vörösnek. Amíg a küzdelmet fel nem tárod, a torony újra és újra leomlik. Merlin tudta: nézz a felszín alá.",
 f:"Nevezd meg pontosan, mi feszül ellened — egy szokás, egy félelem, egy régi rend. A megnevezett ellenerő tanítóvá szelídül.",
 a:"Árnyékbokszolsz: az igazi ellenfél nem kint van. Vagy észrevétlenül te váltál valaki más fehér sárkányává.",
 m:"Ami nekem feszül, azon erősödöm."},
{h:"orzok",no:"XLI",nm:"Nimród, az Ősvadász",st:"Az ősapa íja",g:"nimrod",
 k:["örökség","célratartás","nemzedékek íve"],
 u:"Nimród, a mesés ősapa fiai, Hunor és Magor a Csodaszarvas nyomába eredtek — és egy nép talált új hazát. Az ő íja a nemzedékeken átívelő, kitartó szándék.",
 f:"Tarts célra hosszú távon: amit építesz, nagyobb nálad. Mögötted ősök sora áll — meríts az ívükből.",
 a:"Olyan célt űzöl makacsul, amely már nem a tiéd: örökölt elvárás, nem saját vágy. Az íjat te feszíted — a nyilat te választod.",
 m:"Őseim íján az én nyilam repül."},
{h:"orzok",no:"XLII",nm:"A Csodaszarvas",st:"A hívás",g:"szarvas",
 k:["hívás","vezettetés","új haza"],
 u:"A Csodaszarvas nem hagyta magát elejteni — mert nem zsákmány volt, hanem vezető. Új hazába csalta a vadászokat, aztán eltűnt: a hívás dolga a vezetés, nem a birtokba adás.",
 f:"Valami hív — egy irány, egy vágy, egy visszatérő gondolat. Kövesd, akkor is, ha még nem látod, hová vezet.",
 a:"Vagy minden csillogásra felugrasz, szarvasnak nézve a délibábot — vagy hallod a hívást, de nem mersz elindulni utána.",
 m:"A hívást követem, nem a zsákmányt."},
{h:"orzok",no:"XLIII",nm:"Mária Magdolna",st:"A Kehely Őrzője",g:"magdolna",
 k:["hűséges szeretet","jelenlét","tanúság"],
 u:"Ő maradt ott a legsötétebb órában, és ő ért elsőnek a hajnali kertbe — ezért ő lett az újjászületés első tanúja. A szeretet, amely végig jelen marad, maga a kehely.",
 f:"Maradj jelen: a hűséges jelenlét most többet gyógyít minden szónál. Lehet, hogy te leszel valami újjászületésének első tanúja.",
 a:"Az odaadás önfeladásig ért — vagy a múltba kapaszkodsz. „Ne tarts vissza”: a szeretet néha az elengedésben hűséges.",
 m:"Szeretetem jelen van — és nem birtokol."},
{h:"orzok",no:"XLIV",nm:"Mihály Arkangyal",st:"A Fénykard",g:"mihaly",
 k:["védelem","igazság","határvonás"],
 u:"A fénykard nem támad — elválaszt: igazat a hamistól, tiédet a másétól, világosat a sötéttől. Mihály ereje a szeretetből húzott éles határ.",
 f:"Húzd meg a határt, amit régóta halogatsz. Kérj védelmet, vagy állj te magad az igazság mellé — szelíd, de hajlíthatatlan erővel.",
 a:"A kard ítélkezéssé vált a kezedben — vagy épp nem mered kirántani, és a határaid átjáróházzá lettek.",
 m:"Fénnyel vágok határt — szeretetből."},
{h:"orzok",no:"XLV",nm:"A Szent Grál",st:"A teljesség kelyhe",g:"gral",
 k:["teljesség","a keresés értelme","szolgálat"],
 u:"A Grált nem a legerősebb lovag találta meg, hanem az, aki fel merte tenni a kérdést: „Kit szolgál a kehely?” A keresés célja sosem a birtoklás — hanem a jó kérdés.",
 f:"Közel jársz ahhoz, amit régóta keresel. Most tedd fel a kérdést: kit fog szolgálni, ha megtalálod?",
 a:"A keresés önmagáért folyik, és már nem emlékszel, miért indultál. A kehely talán a kezedben van — csak sosem kérdezted meg, kit szolgál.",
 m:"Kérdezem: kit szolgál, amit keresek?"},
/* VI. KRISTÁLYERŐ ORÁKULUM */
{h:"kristaly",no:"XLVI",nm:"Hegyikristály",st:"A tisztaság mestere",k:["tisztaság","fókusz","erősítés"],u:"A hegyikristály a kövek ősapja: nem ad hozzá és nem vesz el — felerősíti és kitisztítja, ami már benned van.",f:"Tisztíts le mindent a lényegig: a szándékod most kristálytisztán tud hatni.",a:"Felerősödött benned valami zavaros is — előbb tisztítsd a forrást, aztán erősíts.",m:"Tiszta szándék, tiszta erő.",sz:"Jégtiszta, hatszögű kristálycsúcs a hófödte orom fényében; belsejében szivárvány-zárvány.",me:"A kristály nem válogat: azt nagyítja, amit elé tartasz. Ezért az első munka mindig a szándék tisztítása — a többit elvégzi a fény.",tsz:"Tisztázd, mit akarsz valójában a kapcsolattól — a tiszta kérés fél siker.",tmu:"Egyetlen fókusz többet hoz, mint öt szétszórt cél.",tle:"A meditációd most különösen erős — irányítsd jóra."},
{h:"kristaly",no:"XLVII",nm:"Ametiszt",st:"A lélek nyugtatója",k:["béke","átlényegítés","védelem"],u:"Az ametiszt a viharos elmét csendesíti: az ibolyaláng köve, amely a feszültséget bölcsességgé alakítja.",f:"Engedd, hogy lecsillapodjon benned a zaj — a válasz a nyugalomból jön.",a:"A nyugalom zsibbadtsággá vált: ideje visszatérni az élet sűrűjébe.",m:"Bennem a vihar tanítóvá csendesül.",sz:"Mélylila kristálygeóda barlangöble gyertyafénnyel; olyan, mint egy kicsiny katedrális.",me:"Az átlényegítés művészete: nem elfojtani a nehéz érzést, hanem áttetszővé tenni. Minden indulat nyersanyag — ibolyalángban bölcsességgé ég.",tsz:"Vita előtt aludj rá: az ametiszt-éjszaka fél megbékélés.",tmu:"Stresszes időszak — a lecsendesedésen múlik a döntéseid minősége.",tle:"Az esti elcsendesedés a lélek ametisztje."},
{h:"kristaly",no:"XLVIII",nm:"Rózsakvarc",st:"A szív gyógyítója",k:["önszeretet","gyengédség","megbocsátás"],u:"A rózsakvarc a feltétel nélküli szeretet köve — s a legelső, akit szeretni tanít: te magad vagy.",f:"Bánj magaddal úgy, ahogy a legkedvesebb barátoddal bánnál — most ez a gyógyulás útja.",a:"Mindenkit ápolsz, csak magadat nem: üres kancsóból nem lehet tölteni.",m:"Gyengéd vagyok magamhoz — innen indul minden szeretet.",sz:"Tejrózsaszín, opálosan derengő kő egy nyitott tenyérben; körülötte rózsaszirmok.",me:"A szív gyógyulása apró gyengédségekben történik: ahogy magadhoz szólsz, ahogy megpihenni engedsz. A rózsakvarc a belső hang hangszíne.",tsz:"A kapcsolat gyengédség-hiányban szenved? Kezdd a magadéval.",tmu:"Bocsásd meg magadnak a régi hibát — a bűntudat rossz üzemanyag.",tle:"Az önszeretet nem önzés: a lélek alapköve."},
{h:"kristaly",no:"XLIX",nm:"Citrin",st:"A napfény köve",k:["bőség","öröm","önbizalom"],u:"A citrin a kristályba zárt napsugár: a derű, a bőség és az egészséges önbizalom köve.",f:"Merj ragyogni és kérni: a bőség a derűs magabiztosságot szereti.",a:"A ragyogás hajszolássá vált, vagy épp kialudt — a nap nem erőlködik: süt.",m:"Megérdemlem a fényt, amit hozok.",sz:"Mézarany kristály a délelőtti napfényben; körülötte búzakalász és pénzérme.",me:"A bőség nem szerencse kérdése, hanem áteresztőképességé: a citrin kitágítja a csatornát azzal, hogy örömre hangol. Ami örömből készül, vonzza a többletet.",tsz:"Vidd vissza a játékot és a nevetést a kapcsolatba.",tmu:"Pénzügyi és üzleti ügyekben kedvező szelek — lépj bátran.",tle:"A hála és az öröm a lélek napozása."},
{h:"kristaly",no:"L",nm:"Holdkő",st:"A belső árapály",k:["intuíció","ciklusok","női bölcsesség"],u:"A holdkő a belső árapály köve: megtanít együtt mozogni a saját ciklusaiddal ahelyett, hogy harcolnál velük.",f:"Hallgass a megérzéseidre és a tested ritmusára — most ők a pontosabb óra.",a:"Hangulataid hullámvasúttá váltak: figyeld meg a mintát, és tervezz vele.",m:"Ciklusaim bölcsessége vezet.",sz:"Kékesen irizáló, tejfényű kő a fogyó hold alatt; felszínén mintha víz hullámzana.",me:"Az élet ciklusokban jár: apály és dagály, befelé és kifelé. A holdkő szerint az erő nem az állandó teljesítés — hanem a jó ütemérzék.",tsz:"A kapcsolatnak is vannak évszakai — a tél nem hiba, hanem szakasz.",tmu:"Időzítsd a nagy bemutatót az energiacsúcsodra — ismerd ki magad.",tle:"Vezess holdnaplót: a lelked ritmusa kirajzolódik."},
{h:"kristaly",no:"LI",nm:"Fekete Turmalin",st:"Az őrző kő",k:["védelem","földelés","határok"],u:"A fekete turmalin a leghűségesebb testőr: elnyeli, ami nem a tiéd, és a földbe vezeti, ami túl sok.",f:"Erősítsd meg a védelmed: kevesebb zaj, több földelés, tiszta határok.",a:"A pajzs fallá vastagodott — a védelem nem elszigetelődés.",m:"Védett vagyok, és nyitott maradok.",sz:"Szurokfekete, rovátkolt kristályoszlop a küszöbkövön; mögötte melegen világít az ablak.",me:"Az energetikai higiénia életvitel: mit engedsz be, mit veszel magadra, mit adsz tovább. A turmalin a tudatos szűrés köve.",tsz:"Ne vedd magadra a másik minden viharát — együttérezni terhelés nélkül is lehet.",tmu:"Zajos közegben dolgozol? Szűrj: hír-, panasz- és pletykadiéta.",tle:"A földelés a lélek villámhárítója: mezítláb, fű, légzés."},
{h:"kristaly",no:"LII",nm:"Labradorit",st:"A belső fény köve",k:["rejtett képességek","mágia","önvédelem"],u:"A labradorit szürke kő — míg meg nem billen a fény: akkor felizzik benne a kék-arany tűz. Így hordod te is a rejtett ragyogásod.",f:"Egy eddig rejtett képességed kér színpadot — billentsd fénybe.",a:"Szürkének látod magad, mert rossz szögből nézed — vagy másokra bíztad a megvilágítást.",m:"A fényem bennem van — én döntöm el, mikor villan.",sz:"Szürke kő, amely mozdulatra pávakék és aranyzöld lángot vet; északi fény a kőben.",me:"A labradorit tanítása a rejtettség méltósága: nem kell mindig ragyogni — de tudni kell, hogy tudsz. A jókor felvillantott fény többet ér az állandó reflektornál.",tsz:"A társad még nem látta minden színed — mutasd meg a rejtett oldalt.",tmu:"Váratlan helyzetben villanthatod meg a titkos tudásod — készülj rá.",tle:"A lélek mélyén tartalék fény ég — bízhatsz benne."},
{h:"kristaly",no:"LIII",nm:"Borostyán",st:"Az ősfény cseppje",k:["életerő","melegség","ősi gyógyerő"],u:"A borostyán nem kő, hanem megdermedt napfény: sokmillió éves gyanta, amely az élet melegét őrzi.",f:"Térj vissza az egyszerű, meleg dolgokhoz: napfény, méz, nevetés, ölelés.",a:"Múltba dermedtél, mint bogár a gyantába — a melegség éltet, a nosztalgia konzervál.",m:"Az ősi napfény bennem árad.",sz:"Mézszínű, áttetsző csepp, benne egy ősi levél lenyomata; mögötte fenyves és tenger.",me:"A borostyán a folytonosság köve: ami egyszer élt és meleg volt, nem vész el — átörökül. A gyógyulás gyakran visszatalálás egy ősi meleghez.",tsz:"A régi közös emlékek most gyógyítanak — elevenítsétek fel a legjobbakat.",tmu:"A jól bevált, régi módszer most jobb, mint a divatos új.",tle:"Az öröm ősforrása egyszerű: fény, test, jelen."},
{h:"kristaly",no:"LIV",nm:"Tigrisszem",st:"A bátor tekintet",k:["bátorság","gyakorlatiasság","éberség"],u:"A tigrisszem a földre hozott napfény: bátorságot ad, de a lábad a talajon tartja.",f:"Cselekedj bátran, de nyitott szemmel: az éber bátorság győz.",a:"A vakmerőség és a tétovázás közt ingázol — a tigris nem kapkod: figyel, aztán ugrik.",m:"Bátor vagyok és éber — egyszerre.",sz:"Aranybarnán sávozott, selyemfényű kő; mintázata mint a lesben álló nagymacska szeme.",me:"A bátorság nem az érzés hiánya, hanem a figyelem minősége: aki jól lát, mer. A felmért kockázat már nem vakmerőség — döntés.",tsz:"Merj kezdeményezni — de figyeld a másik jelzéseit is.",tmu:"Ideje az ugrásnak: az előkészítés kész, a pillanat itt van.",tle:"A lélek bátorsága a jelenlét: szemtől szemben azzal, ami van."},
{h:"kristaly",no:"LV",nm:"Akvamarin",st:"A tiszta beszéd köve",k:["kommunikáció","tisztaság","áramlás"],u:"Az akvamarin a tengerészek köve volt: tiszta vizet és tiszta beszédet hoz — a torokban lakó igazság őre.",f:"Mondd ki tisztán, egyszerűen, hullámzás nélkül — a tiszta szó megnyugtat.",a:"A ki nem mondott szavak torlódnak a torkodban — a tenger is attól tiszta, hogy áramlik.",m:"Szavaim tiszták, mint a tengervíz.",sz:"Halványkék, áttetsző kristály a hullámok fölött; a fényben mintha víz folyna benne.",me:"A kommunikáció vize akkor tiszta, ha se el nem apad, se nem árad zavarosan. Az akvamarin a mederben tartott őszinteség.",tsz:"Egy elmaradt tisztázó beszélgetés vár — kezdd te, szelíden.",tmu:"Írás, előadás, tárgyalás: a szavaid most különösen jól folynak.",tle:"Az imádság is beszéd — tisztán szólj magadhoz és az éghez."},
{h:"kristaly",no:"LVI",nm:"Gránát",st:"A vér tüze",k:["szenvedély","kitartás","életerő"],u:"A gránát a hosszútávfutók köve: nem szalmaláng, hanem parázs — a szenvedély, amely évekig tud égni.",f:"Táplálj újra egy régi szenvedélyt: a parázs alatt még él a tűz.",a:"A szenvedély kötelességgé fásult — a gránát nem robbanást kér, csak egy fújást a parázsra.",m:"A tüzem hosszú távra szól.",sz:"Borvörös, sokszögű kristály a téli hóban; körülötte olvadt folt — a kő melege.",me:"A nagy dolgok nem a fellángolásban dőlnek el, hanem a háromszázadik szürke napon, amikor mégis odaállsz. A gránát a kitartó vágy köve.",tsz:"A hosszú kapcsolat tüze karbantartást kér — tervezz parázs-estéket.",tmu:"A maratoni projekt hajrájához kaptál erőt — tarts ki.",tle:"A lélek szenvedélye az elköteleződésben mélyül, nem az újdonságban."},
{h:"kristaly",no:"LVII",nm:"Szelenit",st:"A fény pálcája",k:["tisztítás","fénykapcsolat","béke"],u:"A szelenit a holdfény kristálya: önmagát tisztítja, s minden más követ is — a fény pálcája a kezedben.",f:"Tisztítsd a teret és az elméd: a szelenit-fehér egyszerűség most gyógyít.",a:"Annyira az éteri fényben élsz, hogy a földi dolgok porosodnak — a fényt le is kell hozni.",m:"Fénnyel tisztítok — magamban is.",sz:"Selyemfehér, rostos kristályrúd a holdsugárban; mintha maga a fény kristályosodott volna.",me:"A tisztaság nem steril üresség, hanem átjárhatóság: a fény akadálytalan útja. Ami tiszta, azon átragyog a magasabb rend.",tsz:"Tisztázzátok a felgyűlt apró sérelmeket — utána újra átjárható a szeretet.",tmu:"Rendszerezd a káoszt: tiszta asztal, tiszta fej, tiszta terv.",tle:"A rendszeres belső tisztítás a lélek fürdője."},
/* VII. HOLD ÉS CSILLAGOK */
{h:"hold",no:"LVIII",nm:"Újhold",st:"A sötét kezdet",k:["kezdet","mag","szándék"],u:"Az újhold a láthatatlan kezdet: a sötét ég nem üres — vemhes. Most vetik el a legmesszebbre érő szándékokat.",f:"Fogalmazz meg új szándékot, és tartsd még titokban: a mag sötétben csírázik.",a:"Új kezdésbe menekülsz a befejezés elől — előbb arasd le a régit.",m:"A sötétben vetem el a fényt.",sz:"Csillagporos fekete ég, a Hold helyén sejtelmes körvonal; lent egy kéz magot ejt a földbe.",me:"Az újhold a ciklus nulladik pontja: nem történik semmi — és minden itt dől el. A szándék tisztasága most többet ér minden cselekvésnél.",tsz:"Új szakasz kezdődhet a kapcsolatban — ültessétek el együtt, csendben.",tmu:"Tervezés és szándéknyilatkozat ideje — indítás még ne.",tle:"Írd le az újholdas szándékod egyetlen mondatban — ez a ciklusod magja."},
{h:"hold",no:"LIX",nm:"Növő Hold",st:"Az építés íve",k:["növekedés","lendület","táplálás"],u:"A növő hold a kertész ideje: amit elvetettél, most öntözni, gyomlálni, támogatni kell — a fény napról napra veled nő.",f:"Cselekedj következetesen: kis lépések, napi ritmus — a hold húz.",a:"Türelmetlenség: a rügyet nem lehet széthúzni virággá.",m:"Napról napra növelem a fényt.",sz:"Ezüst sarló vastagszik az esti égen; alatta zsenge hajtás nyújtózik a fénye felé.",me:"A növekedés nem esemény, hanem folyamat: a növő hold a következetesség misztériuma. Minden nap egy kevéssel több fény — ez a világ legerősebb varázslata.",tsz:"Heti egy közös rítus többet tesz, mint havi egy nagy gesztus.",tmu:"Skálázás, bővítés, tanulás ideje — a lendület veled van.",tle:"A lélek is edzhető: napi gyakorlat, növekvő fény."},
{h:"hold",no:"LX",nm:"Telihold",st:"A beteljesedés fénye",k:["csúcspont","láthatóság","betakarítás"],u:"A telihold mindent megvilágít: ami érett, learatható — ami rejtett volt, láthatóvá válik. A ciklus csúcsa ünnepet és őszinteséget hoz.",f:"Ünnepeld meg, ami beérett, és nézz szembe azzal, amit a fény felfed.",a:"A telihold felfokoz: érzelmi dagály idején ne hozz visszavonhatatlan döntést.",m:"A fényben állok — egészen.",sz:"Hatalmas ezüstkorong a tó fölött, ezüsthíd a vízen; minden árnyék éles és tiszta.",me:"A telihold kettős ajándék: betakarítás és leleplezés. Ami félhomályban volt — érzés, igazság, eredmény —, most megmutatkozik. A fény nem ítél: láttat.",tsz:"Érzelmi csúcspont: nagy közelség vagy nagy vihar — mindkettő tisztít.",tmu:"Zárj le és mutasd be: prezentáció, leadás, ünneplés.",tle:"Telihold-rítus: hála a beértekért, elengedés-lista a fölöslegnek."},
{h:"hold",no:"LXI",nm:"Fogyó Hold",st:"Az elengedés íve",k:["elengedés","tisztítás","visszavonulás"],u:"A fogyó hold a nagytakarítás ideje: ami elvégeztetett, azt lezárni — ami fölösleges, azt elengedni, mielőtt az új ciklus indul.",f:"Zárj le, mondj le, adj le: minden elengedett teher fénnyé válik az újholdra.",a:"Kapaszkodsz a fogyó fénybe — de a hold nem hal meg: pihenni tér.",m:"Elengedek, hogy megérkezhessen.",sz:"Vékonyodó sarló a hajnali égen; lent egy alak szelíden kiönt egy tál vizet a földre.",me:"A fogyó hold az apály bölcsessége: a visszahúzódás nem veszteség, hanem a következő dagály előkészítése. Aki nem tud fogyni, nőni sem tud.",tsz:"Engedjétek el a hetek hordalékát: egy őszinte „bocsáss meg” és „köszönöm”.",tmu:"Adminisztráció, lezárás, archiválás — a rend a jövő gyorsítósávja.",tle:"Esti rítus: három dolog, amit ma elengedsz."},
{h:"hold",no:"LXII",nm:"Fekete Hold",st:"A mélység kapuja",k:["árnyék","titok","őserő"],u:"A fekete hold a ciklus legmélyebb sötétje: a tabuk, az elfojtott vágyak és az őserő kapuja — ijesztő és felszabadító.",f:"Nézz szembe azzal, amit magadban száműztél: ott az erőd hiányzó fele.",a:"Az árnyék irányít a hátad mögül — hozd a tűz elé, mielőtt ő hoz téged.",m:"A sötétem is az enyém — és engem szolgál.",sz:"Holdtalan éj legmélye; egy üst szája, amelyből meleg sötét árad — nem fenyeget: hív.",me:"A fekete hold nem gonosz — kimondatlan. Amit „nem illik” és „nem szabad” címkével eltemettél, itt vár. Az integrált árnyék a legnagyobb erőforrás.",tsz:"A kapcsolat kimondatlan vágyai kérnek szót — merjetek beszélni róluk.",tmu:"A „tiltott” ötleted lehet a legértékesebb — vizsgáld meg komolyan.",tle:"Az árnyékmunka a lélek alkímiája: ólomból arany."},
{h:"hold",no:"LXIII",nm:"Esthajnalcsillag",st:"Vénusz fénye",k:["szerelem","szépség","vonzás"],u:"Az Esthajnalcsillag elsőként gyúl ki és utolsóként alszik el: a szerelem, a szépség és a vonzás vezérfénye.",f:"Engedd be a szépséget: ápold magad, a teret, a kapcsolatot — a vonzás a ragyogásból indul.",a:"A tetszeni akarás elfedte a valódi fényed — Vénusz nem szerepel: ragyog.",m:"Szép vagyok, mert valódi vagyok.",sz:"Az alkony bársonyán egyetlen ragyogó csillag; alatta két összekulcsolódó kéz sziluettje.",me:"A szépség nem felszín, hanem rend — a dolgok jó aránya. Ahol szépség van, ott gondoskodás van; ahol gondoskodás, ott szeretet.",tsz:"A románc visszahívható: gyertya, séta, figyelem — a régi recept működik.",tmu:"Az esztétika üzleti erő: csomagold szebbre, amit csinálsz.",tle:"A szépség a lélek istentisztelete — vedd észre naponta."},
{h:"hold",no:"LXIV",nm:"A Sarkcsillag",st:"Az állandó pont",k:["irány","hűség","vezérelv"],u:"Minden csillag vándorol — a Sarkcsillag áll. Ő a belső vezérelv: az érték, amelyhez képest minden út bemérhető.",f:"Térj vissza az alapértékeidhez: ha tudod, mi az északod, nem tévedhetsz el.",a:"Valaki más csillagát követed — mérd be újra a saját északodat.",m:"Az északom bennem van.",sz:"Csillagörvénylés hosszú expozícióban: minden fénycsík köröz — egyetlen mozdulatlan pont körül.",me:"A Sarkcsillag nem cél — viszonyítás: sosem érsz oda, de általa mindig tudod, merre vagy. Az elv nem béklyó: iránytű.",tsz:"Milyen közös értékre esküdtetek? Nevezzétek meg újra — az a ti északotok.",tmu:"A projektnek vezérlőelv kell: egyetlen mondat, amely dönt helyetted.",tle:"A lélek északa csendben látszik — borult időben az emlékezet vezet."},
{h:"hold",no:"LXV",nm:"A Hulló Csillag",st:"A kegyelem pillanata",k:["kívánság","pillanat","váratlan ajándék"],u:"A hulló csillag egyetlen szívdobbanásnyi fény: aki éppen felnéz, kívánhat. A kegyelem nem tervezhető — csak elkapható.",f:"Ragadd meg a kínálkozó pillanatot ma — nem tér vissza ugyanígy.",a:"A csillaglesésben elfelejtettél élni — a kívánság munka nélkül csak fénycsík.",m:"Készen állok a pillanatra, amikor jön.",sz:"Fényes csík hasítja az éjszakát a hegygerinc fölött; lent egy arc épp felfelé fordul — időben.",me:"A hulló csillag a minőségi idő tanítója: az élet nagy ajándékai ablakokban érkeznek, nem folyosókon. Az éberség a kegyelem valutája.",tsz:"Egy spontán pillanat többet hozhat, mint egy tervezett hétvége — élj vele.",tmu:"Rövid ablak nyílik: gyors, bátor igen kell.",tle:"A kívánság ima sűrítve — fogalmazd pontosan."},
{h:"hold",no:"LXVI",nm:"A Tejút",st:"A lelkek folyója",k:["összetartozás","végtelen","perspektíva"],u:"A Tejút — a régiek Hadak Útja — az égi folyó: milliárd fény egyetlen szalagban. Része vagy valaminek, ami nagyobb és régebbi minden gondnál.",f:"Emeld fel a tekinteted: a mai gond a nagy folyóban egyetlen csepp.",a:"A végtelen szemlélése elodázássá vált — a csillagok alatt is ki kell vinni a szemetet.",m:"Része vagyok a nagy folyónak — és számítok benne.",sz:"Fénylő csillagfolyam ível át a nyári éjszakán; alatta parányi tábortűz — és mégis rokonok.",me:"A perspektíva gyógyszer: a Tejút alatt a legtöbb dráma zsugorodni kezd, a legfontosabb dolgok — szeretet, jelenlét — pedig nőni. A kicsinység itt megnyugtató.",tsz:"Nézzetek együtt csillagokat — a közös ámulat összeköt.",tmu:"Lépj ki a mikromenedzsmentből: madártávlat, aztán vissza.",tle:"Az áhítat a lélek tágulása — keresd hetente."},
{h:"hold",no:"LXVII",nm:"A Holdfogyatkozás",st:"A nagy átállás",k:["fordulat","sorskapu","gyorsítás"],u:"A holdfogyatkozás sűrített ciklus: ami hónapokig érne be, most hetek alatt fordul. Sorskapu — kissé szédítő, nagyon termékeny.",f:"Fogadd el a gyors fordulatot: ami most záródik és nyílik, régóta készült.",a:"Az árnyék csak átvonul — ne hozz végleges ítéletet a fogyatkozás sötétjében.",m:"A fordulat nem ellenem — értem történik.",sz:"Rézvörösbe boruló telihold, ahogy a Föld árnyéka átúszik rajta; a táj visszafojtja a lélegzetét.",me:"A fogyatkozás a kozmosz gyorsítósávja: régi minták hirtelen zárulnak, új utak hirtelen nyílnak. A dolgunk nem irányítani — jól kormányozni a sodrásban.",tsz:"Kapcsolati fordulópont: ami most kimondatik, sorsformáló — mérlegelj, aztán mondd.",tmu:"Hirtelen változás a terepen: aki rugalmas, nyer.",tle:"A sorskapukat a lélek előre érzi — bízz az előkészítettségedben."},
/* VIII. ANGYALI KÓRUS */
{h:"angyal",no:"LXVIII",nm:"Az Őrangyal",st:"A csendes kísérő",k:["védelem","jelenlét","bizalom"],u:"Az őrangyal nem látványos: ő az a „véletlen”, ami jókor jött, a gondolat, ami megállított a küszöbön. Sosem voltál egyedül.",f:"Bízd rá magad a vezetettségre: kérj jelet, s figyeld a hétköznapok apró válaszait.",a:"Mindent egyedül akarsz vinni — a segítség nem gyengeség: kapcsolat.",m:"Kísérve járok — kérni szabad.",sz:"Meleg fénysáv egy vándor válla fölött az esti úton; lábnyoma mellett egy másik, fényből.",me:"Az őrangyal-tanítás lényege a kérés méltósága: a segítség a szabad akarat világában nem jár automatikusan — kérni kell. A kérés nem koldulás: ajtónyitás.",tsz:"Kérj segítséget a kapcsolatért — a kimondott kérés már gyógyít.",tmu:"Merj mentort, tanácsot, támogatást kérni — nyitott ajtók várnak.",tle:"Esti fohász: „Köszönöm, hogy ma is kísértél.”"},
{h:"angyal",no:"LXIX",nm:"Gábriel",st:"A hírnök",k:["üzenet","tisztánlátás","új élet"],u:"Gábriel a nagy bejelentések angyala: ő hozza a hírt, amely új fejezetet nyit. Valami születőben van — és neked szól.",f:"Figyelj az érkező üzenetekre — levél, hívás, álom: az egyik fordulatot hoz.",a:"Egy fontos üzenetet halogatsz átadni vagy meghallani — a hír nem évül, csak nehezül.",m:"Nyitott vagyok a hírre, amit az élet hoz.",sz:"Fehér liliomos alak kürttel a hajnali égen; a kürt hangja fényhullámként terjed.",me:"Gábriel a kommunikáció szentsége: minden igaz üzenet teremtő aktus. A hírnök felelőssége a tisztaság: se hozzá ne tégy, se el ne végy.",tsz:"Mondj el egy fontos hírt vagy érzést, amit régóta őrzöl.",tmu:"Kommunikációs feladatok kiemelt szerencsével: pályázat, bejelentés, kampány.",tle:"Az álmaid most üzenethordozók — jegyezd le őket reggel."},
{h:"angyal",no:"LXX",nm:"Rafael",st:"A gyógyító",k:["gyógyulás","útitárs","egészség"],u:"Rafael neve annyit tesz: „Isten gyógyít”. Ő az utazók és a gyógyulók kísérője — a helyreállítás szelíd mestere.",f:"A gyógyulás elindult — támogasd: pihenés, jó szó, friss levegő, kérés.",a:"Gyógyítod a világot, míg a saját sebed nyitva — a gyógyító is gyógyulhat.",m:"Engedem, hogy a gyógyulás átjárjon.",sz:"Smaragdzöld fényű alak vándorbottal és hallal; nyomában kizöldül az ösvény.",me:"Rafael útitárs-elve: a felépülés nem magányos küzdelem, hanem kísért folyamat. Aki engedi, hogy kísérjék — ember, ég, közösség —, gyorsabban ér haza önmagához.",tsz:"A kapcsolat sebei kísérettel gyógyulnak: beszélgetés, közös séták, türelem.",tmu:"Az egészség most befektetés: alvás, mozgás — a teljesítmény alapja.",tle:"Kérd a gyógyító erőt egy konkrét sebedhez — néven nevezve."},
{h:"angyal",no:"LXXI",nm:"Uriel",st:"A bölcsesség lángja",k:["belátás","megoldás","igazság"],u:"Uriel az „Isten fénye”: a hirtelen belátás angyala — a villanás, amelytől a bonyolult egyszerűvé válik.",f:"A megoldás egyszerűbb, mint hitted: engedd, hogy a felismerés átvágja a csomót.",a:"Túlgondolod: az elme köröz, mint éjjeli lepke — tedd le, s a fény magától jön.",m:"A belátás fénye bennem gyullad.",sz:"Lángnyelvet tartó tenyér a könyvtár homályában; a láng fényénél egyetlen sor válik olvashatóvá — a lényeg.",me:"Uriel a mentális alkímia: az információból tudást, a tudásból bölcsességet párol. A bölcsesség ismérve az egyszerűség — ami bonyolult, az még csak okosság.",tsz:"Egy régi félreértés egyetlen őszinte mondattal feloldható — keresd meg azt a mondatot.",tmu:"A gordiuszi csomóhoz nem több elemzés kell, hanem egy tiszta vágás.",tle:"Kérdezd este: „Mi a legegyszerűbb igazság a mai napomban?”"},
{h:"angyal",no:"LXXII",nm:"Chamuel",st:"A szerető szem",k:["szeretet","megtalálás","békéltetés"],u:"Chamuel a szerető látás angyala: ő segít megtalálni — elveszett tárgyat, elveszett embert, elveszett önbecsülést.",f:"Amit keresel, közelebb van, mint hinnéd — nézz körül a szeretet szemével.",a:"Kifelé keresed, ami belül veszett el — kezdd a szíved fiókjaiban.",m:"A szeretet szemével nézek — és megtalálom.",sz:"Rózsaszín fényalak lámpással egy padláson; a fénykörben egy rég keresett, poros kincs.",me:"A látás minősége dönti el, mit találunk: a kritikus szem hibát, a szerető szem lehetőséget — ugyanabban a tárgyban, emberben, napban.",tsz:"Nézd ma a társad úgy, mint az első héten — a szerető szem visszahozza, amit a megszokás eltakart.",tmu:"Az elveszettnek hitt lehetőség visszatérhet — érdemes újra megkeresni.",tle:"Az önbecsülés is megtalálható: emlékezz, mikor voltál büszke magadra."},
{h:"angyal",no:"LXXIII",nm:"Jofiel",st:"A szépség angyala",k:["szépség","gondolattisztítás","derű"],u:"Jofiel az „Isten szépsége”: a gondolatok kertésze — kigyomlálja a csúnyát, és szépet ültet a helyére.",f:"Szépítsd a gondolataid és a környezeted: a külső rend belső derű.",a:"A gondolatkerted elgazosodott: panasz, összehasonlítás, önostorozás — ideje gyomlálni.",m:"Szép gondolatokkal ültetem be a napom.",sz:"Aranysárga fényalak virágkosárral egy íróasztal fölött; ahol elhalad, a kusza papírokból rend lesz.",me:"A gondolat is táj: lehet szemétlerakó és lehet kert. A szépség nem díszítés — mentálhigiéné: amilyen képek közt élsz belül, olyan lesz a kinti életed.",tsz:"Mondj naponta egy őszinte szépet a társadnak — a kapcsolat kertje ettől virágzik.",tmu:"A munkakörnyezet rendezése fél hatékonyság — kezdd az asztallal.",tle:"Esti gyakorlat: három szép kép a napodból, elalvás előtt."},
{h:"angyal",no:"LXXIV",nm:"Zadkiel",st:"A megbocsátás lángja",k:["megbocsátás","szabadulás","ibolyaláng"],u:"Zadkiel az irgalom angyala, az ibolyaláng őre: a megbocsátás nála nem felejtés — teherletétel.",f:"Bocsáss meg — nem azért, mert jogos, hanem mert szabad akarsz lenni.",a:"A harag bérelt szoba a fejedben annak, aki megbántott — ideje felmondani.",m:"Megbocsátok — és visszaveszem az erőm.",sz:"Ibolyaszín lángoszlop, amelybe egy alak láncokat ejt; a láncok fénnyé olvadnak.",me:"A sérelem energiája nem tüntethető el — de átminősíthető. A megbocsátás az a művelet, amelyben a méreg tanulsággá, a lánc tapasztalattá olvad.",tsz:"Egy régi sérelem tartja túszul a jelent — írd le, égesd el, engedd.",tmu:"Bocsáss meg a régi munkahelynek vagy magadnak — a cipelt harag lassítja az újat.",tle:"A megbocsátás a lélek böjtje: elengedni, ami mérgez."},
{h:"angyal",no:"LXXV",nm:"Metatron",st:"Az írnok",k:["rend","szent geometria","életfeladat"],u:"Metatron az égi írnok: ő vezeti a nagy könyvet, s ő ismeri a mintázatot, amely az életedet értelmes renddé szervezi.",f:"Rendezd az életed a feladatod köré: ami nem szolgálja, most lekerülhet a listáról.",a:"A rend öncéllá vált, vagy teljesen felbomlott — a geometria középpontja te vagy, nem a rendszer.",m:"Életem mintázata értelmes rendbe áll.",sz:"Fényből rajzolt geometrikus kocka forog egy nyitott könyv fölött; a lapokon a te történeted.",me:"Az élet nem teendőlista, hanem mintázat — és a mintázatnak középpontja van: az életfeladat. Ami ehhez igazodik, a helyére kerül; ami nem, magától lehull.",tsz:"A kapcsolat is rendszer: tisztázzátok a közös középpontot — miért vagytok együtt?",tmu:"Portfólió-tisztítás: mi szolgálja a fő művet, mi csak zaj?",tle:"Kérdezd meg: „Mi az az egy dolog, amiért itt vagyok?” — s rendezd köré a hónapot."},
{h:"angyal",no:"LXXVI",nm:"A Szeráfok Kórusa",st:"Az izzó szeretet",k:["lelkesedés","odaadás","jelenlét"],u:"A szeráfok a trón körüli izzó kórus: a tiszta lelkesedés legmagasabb hangja. Amit ma teszel, tedd izzó szívvel.",f:"Add bele egészen magad: a fél szív fáraszt, az egész szív éltet.",a:"Az izzás kihűlt vagy fanatizmussá forrt — a szeráf-tűz világít, nem éget.",m:"Egész szívvel vagyok jelen.",sz:"Hatszárnyú fénylények köre a magasban; énekük látható hullámokban árad — a fény hangja.",me:"A szeráfok titka az osztatlan jelenlét: nem azért izzanak, mert különlegeset tesznek, hanem mert egészen ott vannak. A lelkesedés nem érzelem — döntés a teljes jelenlétről.",tsz:"A minőségi idő osztatlan idő: telefon el, szív oda.",tmu:"Amit fél szívvel csinálsz, az egész embert fáraszt — dönts: egészen vagy sehogy.",tle:"A lélek anyanyelve az odaadás — naponta egy dolog, egészen."}
];

/* Részletes leírások — minden laphoz (rétegzett, önálló laponkénti jelentések) */
const EXT={
"I":{sz:"Kilenc holdhónapon át fortyogó vasüst a tóparti tűzön; pereme fölött három gőzcsepp emelkedik, a Hold sarlója figyel.",me:"A régiek tudták: ami gyorsan fő, gyorsan ki is hűl. Az üst arra tanít, hogy a nagy művek ideje nem sürgethető — a várakozás nem tétlenség, hanem a munka legmélyebb rétege.",tsz:"Egy kapcsolat most a mélyben érik — ne kapkodd el a nagy beszélgetést.",tmu:"Hosszú távú projekt van a kezedben: az alapozás értékesebb, mint a látványos haladás.",tle:"A lelked csendes érlelődésben van — a napi kis rítusok tartják a tüzet."},
"II":{sz:"Az üstből kifröccsenő három izzó csepp Gwion hüvelykujjára hull; körülötte az Awen három fénysugara ragyog fel.",me:"A kegyelem nem teljesítménybér. A három csepp azt tanítja, hogy az élet legnagyobb ajándékai kéretlenül érkeznek — a mi dolgunk annyi, hogy le ne töröljük őket.",tsz:"Váratlan találkozás vagy gesztus hozhat fordulatot — fogadd nyitott szívvel.",tmu:"Egy nem tervezett lehetőség többet érhet az egész éves tervnél.",tle:"Az ihlet pillanatai szentek: jegyezd le őket, mielőtt elillannak."},
"III":{sz:"Holdfényes mezőn iramló nyúl, füle hátrasimul; mögötte még remeg a fű, ahol az árnyék járt.",me:"A test bölcsessége régebbi, mint a gondolaté. A nyúl nem gyáva — életben maradó: megtanít különbséget tenni a pánik és az ösztön tiszta jelzése között.",tsz:"Ha valakinél rossz a zsigeri érzésed, vedd komolyan — a test ritkán téved.",tmu:"Gyors helyzetfelismerés kell most, nem hosszú elemzés.",tle:"Figyeld, mikor húzódik össze a gyomrod: a lélek ott üzen."},
"IV":{sz:"Karcsú fehér agár nyúlik teljes vágtában a nyúl nyomán; szeme nem dühös — figyelmes.",me:"Amit elkerülünk, az nem tűnik el: formát vált és követ. Az agár a következmények méltósága — nem büntetni jön, hanem visszaadni, ami a miénk.",tsz:"Egy megbeszéletlen ügy fut utánad a kapcsolatban — fordulj szembe vele szelíden.",tmu:"Elmaradt döntés vagy határidő ér utol: rendezni könnyebb, mint futni előle.",tle:"Az árnyékmunka nem luxus — a lelked agara addig fut, míg meg nem állsz."},
"V":{sz:"Ezüst lazac szökken a zuhatagon fölfelé, pikkelyein a bölcsesség kilenc mogyorójának fénye.",me:"A kelta hagyományban a lazac a legősibb tudás hordozója. Árral szemben úszni nem dac — hűség ahhoz a forráshoz, amelyből származunk.",tsz:"Egy kapcsolatért most úszni kell — de csak akkor, ha valóban a te folyód.",tmu:"A közvélekedéssel szemben is tarthatod az irányod, ha a forrásod tiszta.",tle:"A lélek emlékszik az útra hazafelé — bízd rá magad."},
"VI":{sz:"Fényes bundájú vidra siklik a mélyben, buborékfüzért húzva; félig játszik, félig kutat.",me:"A vidra kettős tanítás: az érzelmek elől nincs menekvés — de nem is kell menekülni. A mély víz játéktérré válik annak, aki megtanul benne lélegezni.",tsz:"A nehéz beszélgetést könnyedség viheti sikerre — humor, nem cinizmus.",tmu:"Rugalmasan kerüld meg az akadályt, ne fejjel menj neki.",tle:"Az érzéseid nem ellenfelek: úszótársak."},
"VII":{sz:"Parányi barna madár a sas szárnytolla közül röppen ki a magasba — a legkisebb, aki a legmagasabbra jutott.",me:"A kicsinység nem hiány, hanem szabadság: akin nincs súly, azt nem húzza le semmi. A távlat nem menekülés a földtől — a föld megértése fentről.",tsz:"Egy lépés hátra most tisztább képet ad a kapcsolatról, mint ezer közeli vita.",tmu:"Emelkedj a részletek fölé: a rendszer hibája fentről látszik.",tle:"Az alázat szárny, nem teher."},
"VIII":{sz:"Kiterjesztett szárnyú sólyom függ mozdulatlanul az ég közepén; szeme alatt az egész táj nyitott könyv.",me:"A sólyomszem nem kegyetlen — pontos. Az igazság órájában a dolgok annyinak látszanak, amennyik; és ez felszabadító, ha a szeretet tartja a tekintetet.",tsz:"Nézz rá tisztán a kapcsolatra: mi tény, és mi a remény szőtte kép?",tmu:"Éles helyzetértékelés ideje — számok, tények, kertelés nélkül.",tle:"A tiszta látás a lélek higiéniája."},
"IX":{sz:"Egyetlen aranyló búzaszem a szérű kövén; fölötte a fekete tyúk árnya — s a szemben már ott alszik a jövő kalásza.",me:"A mag paradoxona: csak az él tovább, ami el meri veszíteni a formáját. Minden igazi újjászületés előfeltétele egy kis halál — egy szerep, egy kép, egy én elengedése.",tsz:"Egy kapcsolati minta lezárul, hogy valami igazabb szülessen.",tmu:"Egy projekt vagy szerep véget ér — a tapasztalat maggá válik a következőhöz.",tle:"Ne félj a belső telektől: a lélek vetésforgója szent."},
"X":{sz:"Magas, sötét köpenyű úrnő a tóparti üst fölött; homlokán vékony holdsarló, kezében a kavaró bot — a világ tengelye.",me:"Ceridwen a sötét anya: nem kényelmes, de termékeny. Az átalakulás őrzőjének lenni szolgálat — kavarni kell, várni, és a kellő percben elengedni a kontrollt.",tsz:"Te vagy most a kapcsolat érlelője — tartsd a teret, ne irányíts.",tmu:"Vezetőként a folyamatot szolgáld, ne a saját képed.",tle:"A benned élő bölcs őr most szólni akar — hallgasd."},
"XI":{sz:"Fehér lovon ülő királynő poroszkál a dombgerincen; senki sem éri utol, pedig sohasem siet.",me:"Rhiannon a szuverén méltóság: nem versenyez, mert tudja, hová tart. Az igaztalan vádat is túléli, aki nem hajlandó mások tempójában elveszíteni önmagát.",tsz:"Ne magyarázkodj a kapcsolatban — a méltó jelenlét többet mond.",tmu:"A saját ütemed a legjobb stratégia: aki kerget, kifullad.",tle:"A lélek nem késik — mindig pontosan érkezik."},
"XII":{sz:"Virágszirmokból font női arc, amely az éj közeledtével bagolyarccá mélyül — szirmok helyett tollak, mosoly helyett látás.",me:"Blodeuwedd nem bukott teremtmény, hanem felszabadult: a készen kapott szerepből a saját természetébe repült át. A hitelesség ára a mások csalódása — a jutalma az éjjellátás.",tsz:"Kérdezd meg: azt szereted-e, aki ő — vagy akit belőle formáltál?",tmu:"Egy rád osztott szerep szűk lett: ideje újratárgyalni.",tle:"A lelked nem dísznek készült — látni akar."},
"XIII":{sz:"Ezüst kerék forog a csillagos ég közepén, küllői közt születések és próbák képei villannak.",me:"Arianrhod kereke az idő igazságossága: semmit sem ad ingyen, de semmit sem tart vissza örökre. A próba nem akadály a sors útján — a próba maga az út.",tsz:"Ismétlődő kapcsolati kör: most megtörheted, ha a leckét kimondod.",tmu:"A kihívás mércének jött — ha kiállod, jár a következő szint.",tle:"A karma nem ítélet: tanterv."},
"XIV":{sz:"Fehér holló ül a torony ablakában, csőrében levélke; lent a tenger, amely két országot választ el és köt össze.",me:"Branwen ereje a csendben rejlik: idegen földön, kiszolgáltatottan is talált utat az üzenetének. Amíg egyetlen madárnyi remény van, a lélek nincs bezárva.",tsz:"Ha most nem változtathatsz, tartsd életben a kapcsolat kis csatornáit.",tmu:"Nehezített pályán a kicsi, következetes jelzések visznek célba.",tle:"A leghalkabb ima is átér a tengeren."},
"XV":{sz:"Tejfehér ködfal a tó fölött; benne épp csak sejlik egy bárka orra — s egy ösvény első köve a lábad előtt.",me:"A köd Avalon kapuőre: nem azt kérdezi, látsz-e, hanem hogy hiszel-e. A bizonyosság a térkép vége — a hit az út kezdete.",tsz:"Nem láthatod előre a kapcsolat jövőjét — de a következő őszinte mondatot igen.",tmu:"Indíts el egy lépést teljes terv nélkül: a második lépés útközben látszik meg.",tle:"A hit nem a tudás hiánya — bizalom-gyakorlat."},
"XVI":{sz:"Egyszerre virágzó és roskadásig termő almafák sora; a fűben érett gyümölcs, a levegőben méz illata.",me:"Avalon kertje az idő csodája: virág és termés egyszerre. A bőség elfogadása nem lustaság — a munka betetőzése, amely nélkül a kör nem zárul.",tsz:"Élvezd, ami megérett a kapcsolatban — ne keress rögtön új feladatot benne.",tmu:"Aratás ideje: kérd el, ami jár, és ünnepeld a csapatot.",tle:"A hála a lélek emésztése — általa válik tápláló erővé a jó."},
"XVII":{sz:"Tükörsima, éjkék víztükör; mélyén elsüllyedt kincsek fénylenek, felszínén a saját arcod.",me:"A tó nem mond semmit — megmutat. Minden válasz, amit kívül keresel, előbb benned merül fel; de csak akkor látod, ha nem kavarod fel a vizet sietséggel.",tsz:"A másikban gyakran a saját tükröd háborog — nézz előbb bele.",tmu:"Döntés előtt egy nap csend többet ér három tanácsadónál.",tle:"A meditáció nem menekvés a világtól: hazatérés a tóhoz."},
"XVIII":{sz:"Zöld szent domb spirálösvénnyel, tetején magányos torony; a köd óceánja fölé emelkedik.",me:"A Tor spirálja azt tanítja: a lélek nem toronyiránt fejlődik, hanem körökben — minden kör ugyanoda tér vissza, egy szinttel magasabban. A kerülő itt maga az út.",tsz:"Ugyanaz a kérdés tér vissza a kapcsolatban? Most magasabbról láthatjátok.",tmu:"A karrier spirál, nem létra: a visszatérő feladat most más szinten szólít.",tle:"A zarándoklat belül is bejárható — lépésenként, körönként."},
"XIX":{sz:"Vasvörös vizű forrás kőmedencéje, borostyán ölelésében; a víz meleg, sűrű, élettel teli.",me:"A vörös forrás a megtestesült élet: vér, vágy, teremtő tűz. Aki csak a szellemit tiszteli, kiszárad — a szent a testben is lakik.",tsz:"A szenvedély nem szégyen: tápláld tudatosan a kapcsolat tüzét.",tmu:"Az alkotó energia most magas — teremts kézzelfoghatót.",tle:"A tested nem a lélek börtöne, hanem temploma — járj benne szertartással."},
"XX":{sz:"Kristálytiszta, meszes vizű forrás sötét üstmélyben; amit érint, idővel fehér kővé épül.",me:"A fehér forrás az alapok vize: ősök, csontok, szerkezet. Nem látványos — megtartó. Az élet a rend medrében tud csak szabadon folyni.",tsz:"A kapcsolat alapszabályait érdemes most tisztázni — a keret szabadságot ad.",tmu:"Egyszerűsíts: kevesebb, de szilárd vállalás.",tle:"A napi gyakorlat a lélek csontváza — láthatatlan, de minden rajta áll."},
"XXI":{sz:"Kilenc csuklyás alak köre az örökmécses körül; egyikük épp fát tesz a tűzre, másikuk alszik — a láng mégis egyenletes.",me:"A kilencek titka a váltott őrség: senki sem ég ki, mert senki sem ég egyedül. A közösség nem a gyengék menedéke — az erősek stratégiája.",tsz:"A kapcsolat is kör: hol te tartod a lángot, hol ő — a lényeg a váltás bizalma.",tmu:"Delegálj és kérj segítséget: a projekt tüze közös.",tle:"Keresd meg a lelked körét — együtt a leghosszabb út is otthonosabb."},
"XXII":{sz:"Fekete vitorlás bárka siklik a ködben; fedélzetén három királyné virraszt egy sebesült fölött.",me:"A bárka nem a vég — az átkelés méltósága. Vannak történetek, amelyeket nem megjavítani kell, hanem tisztességgel átkísérni a túlsó partra.",tsz:"Egy búcsú a kapcsolatban méltó lezárást kér — ne osonj el, kísérd át.",tmu:"Egy lezáruló korszakot dokumentálj, köszönj el, adj át — ez is munka.",tle:"A gyász nem gyengeség: a szeretet utolsó szolgálata."},
"XXIII":{sz:"Keresztben félbevágott alma a konyhaasztalon; magháza ötágú csillagot rajzol — a hétköznap rejtett pecsétje.",me:"A csillag nem a világ végén van, hanem az almában — a nézőpontban. A mágia gyakorlata: ugyanazt másképp felvágni. A csoda hűséges: ott vár, ahol vagy.",tsz:"A megszokott társban is csillag rejlik — vágd fel másképp a közös napokat.",tmu:"A rutinfeladatban innováció lapul: fordítsd el kilencven fokkal.",tle:"A jelenlét a legolcsóbb és legritkább varázslat."},
"XXIV":{sz:"Hóval fedett erdei ösvény hajnal előtt; egyetlen lábnyom sincs még, csak a csend tapintható sűrűje.",me:"Taliesin kilenc hónap sötét csendből hozta a világ legszebb hangját. A hallgatás nem üresség — vemhesség: benne fogan meg minden igaz szó.",tsz:"Most ne mondd ki azonnal — hordd ki előbb, amit érzel.",tmu:"Tárgyalás előtt a csend a legerősebb pozíció.",tle:"Napi tíz perc csend: a lélek anyanyelve."},
"XXV":{sz:"Három fénysugár tör át a felhőn egyetlen pontból, s ahol földet ér, ott hárfa húrjai rezdülnek maguktól.",me:"Az Awen nem a kiválasztottaké — a nyitottaké. Az ihlet nem előzi meg a munkát: követi. Kezdd el rosszul, és útközben megérkezik.",tsz:"A romantika is gyakorlat: az első mozdulat rád vár.",tmu:"Ne várd a tökéletes ötletet — a vázlat hívja elő.",tle:"Alkotni imádság — tett formájában."},
"XXVI":{sz:"Egyetlen lény négy árnyéka a falon: nyúl, hal, madár, mag — középen az árnyékok gazdája mosolyog.",me:"Gwion négy alakot váltott, de egyetlen lélek maradt. A rugalmasság nem jellemtelenség — a lényeg hűsége a forma szabadságában.",tsz:"Új helyzet új arcodat kéri a kapcsolatban — engedd meg magadnak.",tmu:"Szerep- vagy módszerváltás jön: a kompetenciád veled költözik.",tle:"A lélek nem az alakban lakik — az alakok laknak benne."},
"XXVII":{sz:"Nyitott tenyér a szélben; az imént még magot szorongatott — most a szél viszi, s a tenyérbe fény ül.",me:"Ceridwen elvesztette élete főzetét — és megnyerte Taliesint. Az elengedés nem veszteségkezelés: teremtéstechnika. Az üres kéz a világ legbefogadóbb edénye.",tsz:"Engedd el a forgatókönyvet a másikról — hadd lepjen meg.",tmu:"A terv elengedése nem kudarc: helyet csinál a jobb megoldásnak.",tle:"Amit szorítasz, azt fogva tartod — amit elengedsz, az hazatalálhat."},
"XXVIII":{sz:"Két forrás — vörös és fehér — vize fonódik össze egy patakban; partján bekötözött kezű zarándok pihen.",me:"Avalonba nem harcolni vitték a sebesültet, hanem gyógyulni. A regenerálódás nem a munka szünete — a munka másik fele, amely nélkül minden erőfeszítés kamatostul behajtja az árát.",tsz:"A kapcsolatnak is kell lábadozás a viharok után — ne siettesd a „minden rendben”-t.",tmu:"Iktass be valódi pihenőt: a kreativitás a szünetben töltődik.",tle:"A gyógyulás spirál: ugyanaz a seb egyre magasabb szinten záródik."},
"XXIX":{sz:"Öreg tölgy gyökerei között ülő bárd, ölében hárfa; a gyökerek arcokká rajzolódnak — az ősök hallgatják.",me:"A bárdok könyvtára az emlékezet volt. Aki tudja, honnan jött, azt nehéz kimozdítani abból, ahová tart — a gyökér nem hátrafelé húz: megtart.",tsz:"A családi minták ismerete a párkapcsolat térképe — tanulmányozd.",tmu:"Régi tudásod, elfeledett készséged most újra piacképes.",tle:"Gyújts néha gyertyát az ősöknek — az emlékezés kétirányú híd."},
"XXX":{sz:"Kimondott szó látható alakot ölt: a bárd ajkáról fénymadár száll fel, és híddá feszül két szikla között.",me:"A druidák szerint a szó teremt. Amit kimondasz, annak alakja lesz — ezért a bátorság nem hangerő kérdése, hanem felelősségé: tudd, mit építesz a szavaddal.",tsz:"A ki nem mondott kérés nem kérés — mondd ki ma.",tmu:"A nehéz beszélgetés halogatása drágább, mint a beszélgetés.",tle:"Az igazmondás a lélek gerince."},
"XXXI":{sz:"Kerek kőasztal a tisztáson; nincs főhelye, s a köré ült alakok arcát egyenlően éri a tűz fénye.",me:"A kerekasztal forradalma az egyenrangúság: mindenki látja a másik arcát. Az igaz szövetségben nem az számít, ki ül feljebb — hanem hogy senki sem ül kívül.",tsz:"Ültesd vissza a kapcsolatot a kerekasztalhoz: két egyenrangú fél beszélgetése.",tmu:"A csapat körben erős — bontsd le a láthatatlan főhelyet.",tle:"A lélek társakat kér az úthoz — a kör a legősibb templom."},
"XXXII":{sz:"Ősi kőkapu a szürkületben: mögötte még az éj, előtte már a hajnal — s a küszöbön egy megállt vándor.",me:"A kelták a köztes helyeket tartották szentnek: partot, alkonyt, kaput. A küszöbön a fátyol vékony — itt látni a legtisztábban mindkét irányba. De a kapu nem lakóhely: átjáró.",tsz:"Se kint, se bent állapot a kapcsolatban — adj neki határidőt szelíden.",tmu:"Két lehetőség közt állsz: a küszöbön gyűjts információt, aztán lépj.",tle:"Az átmenet szent idő — de a szentség a lépésben teljesedik be."},
"XXXIII":{sz:"A köd szétnyílik a vándor háta mögött: a sziget, amit keresett, a saját ablakából látszik — otthon van, és mindig is ott volt.",me:"Minden zarándoklat végső titka, hogy a cél nem földrajzi. Avalon nem a ködön túl van: a köd benned oszlik fel, amikor kibékülsz azzal, aki vagy.",tsz:"A kapcsolat akkor otthon, ha benne önmagad lehetsz — ezt becsüld és mondd ki.",tmu:"A megérkezést is teljesítsd: ünnepelj, dokumentálj, hálálkodj.",tle:"Az önelfogadás nem a fejlődés vége — a kezdete."},
"XXXIV":{sz:"Csillagköpenyes látó a kristálybarlang szájában; szemében visszafelé pereg az idő, botja körül mintázatok örvénylenek.",me:"Merlin nem mond jövőt — mintázatot lát. A bölcsesség veszélye a torony: aki mindent átlát, könnyen kívül reked az életen. A látás akkor ér valamit, ha vissza is lépsz a képbe.",tsz:"Látod a kapcsolat mintázatát — de a szereteted a részvételben él, nem az elemzésben.",tmu:"Stratégiai rálátásod most kincs: oszd meg, ne csak birtokold.",tle:"A belső látó akkor hiteles, ha a lába a földön áll."},
"XXXV":{sz:"Ifjú keze a kőből kiálló kard markolatán; körülötte hitetlenkedő tömeg — a kard pedig enged, mert felismerte a szolgálót.",me:"A kardot nem az erő húzza ki, hanem a hivatás. Artúr nagysága a kerekasztal: az egyesítés művészete. Az igaz király első alattvalója önmaga.",tsz:"Vállald a kezdeményező felelősségét a kapcsolatban — egyesíts, ne győzz.",tmu:"Vezetői szerep hív: fogadd el, de oszd meg az asztalt.",tle:"A hivatás az a kard, amelyik a te kezedbe simul."},
"XXXVI":{sz:"Selymes vízfelszín alól kinyúló kar, kezében fénylő kard; a víz nem csobban — a mély ajándékoz.",me:"Excalibur kölcsön volt: a tótól jött, s oda tért vissza. Minden nagy képesség sáfárság — használatra kapod, nem birtoklásra. A visszaadás művészete tesz méltóvá az újabb ajándékra.",tsz:"A bizalom, amit kaptál, szolgálatra való — becsüld meg a törékenységét.",tmu:"Pozíció, eszköz, megbízás: kölcsön van. Forgasd tisztán, add tovább időben.",tle:"A talentum nem tulajdon — folyó, amelyen áteresztő gát vagy."},
"XXXVII":{sz:"Holdfogyatkozás alatt gyógyfüveket szárító asszony; fél arca árnyékban — de a keze gyógyír fölött dolgozik.",me:"Morgant démonizálta a krónika — pedig Avalon gyógyítója volt, s ott állt a fekete bárkán is. Az árnyék nem az ellenség: az erőnk elzárt fele, amely nevet és helyet kér.",tsz:"A kapcsolat árnyéktémái — féltékenység, harag — kimondva gyógyítanak.",tmu:"A kritikus hang a csapatban nem ellenség: rosszul csomagolt minőségbiztosítás.",tle:"Az árnyékmunka a lélek nagytakarítása: ijesztő szekrény, felszabadító eredmény."},
"XXXVIII":{sz:"Ragyogó homlokú ifjú bárd a királyi csarnokban; hárfája szavára a hivalkodó dalnokok elnémulnak.",me:"Kilenc hónap sötét után Taliesin első tette az ének volt. A tehetség adósság is: amit rejtegetsz, azzal a világnak tartozol. De a bárd a dalt szolgálja — nem a tapsot.",tsz:"Mondd ki szépen, amit érzel — a megfogalmazott érzés ajándék.",tmu:"Ideje láthatóvá tenni a munkád: publikálj, mutasd meg, állj ki vele.",tle:"A hangod a lelked ujjlenyomata — ne hagyd némán."},
"XXXIX":{sz:"Vörös sárkány gomolyog elő a hegy gyökeréből; pikkelyein parázs fénye, szárnya alatt a föld melege.",me:"Dinas Emrys tornya azért omlott, mert nem tudtak a mélyben küzdő sárkányokról. A vörös sárkány a ki nem oltható életerő — nem szelídíteni kell, hanem szövetséget kötni vele.",tsz:"A kapcsolat tüze él — tápláld figyelemmel, ne hagyd hamu alatt.",tmu:"Mély erőtartalékod van: merj nagyobbat vállalni.",tle:"A lelked tüze nem veszély — hajtóerő, ha meder van neki."},
"XL":{sz:"Hófehér sárkány feszül a vörösnek a föld alatti tóban; küzdelmük remegteti a tornyot — de a mélyben rend születik.",me:"A fehér sárkány nem gonosz: ellenerő, amely megmutatja, mit bírsz. A meg nem nevezett ellenállás tornyokat dönt — a megnevezett tanítóvá szelídül.",tsz:"Nevezd meg pontosan, mi feszül köztetek — a névtelen feszültség rombol, a megnevezett dolgozik.",tmu:"A piaci vagy belső ellenállás visszajelzés: olvasd, ne csak küzdd.",tle:"Ami neked feszül, azon mérheted meg, mekkorát nőttél."},
"XLI":{sz:"Ősz szakállú óriás vadász a pusztai ég alatt, kezében hatalmas íj; mögötte két ifjú — Hunor és Magor — lesi a szarvas nyomát.",me:"Nimród íja a nemzedékeken átívelő szándék: a nyíl, amit ő feszít, az unokák földjén ér célba. A nagy célok nem egy élet alatt teljesülnek — de minden élet feszíthet rajtuk egyet.",tsz:"A család, amit építesz, hosszabb történet nálad — tervezz szeretettel előre.",tmu:"Építs olyat, ami túlnő rajtad: intézményt, tudást, örökséget.",tle:"Ősapáid íján a te nyilad repül — s utánad is repülni fog."},
"XLII":{sz:"Fehér szarvasünő szökken a nádason át, agancsa közt mintha nap ragyogna; nyomában vadászok — és egy nép jövője.",me:"A Csodaszarvas nem zsákmány, hanem vezető: új hazába csal, aztán eltűnik. A hívás dolga az irány — a megérkezés már a tiéd. Aki el akarja ejteni a hívást, elveszíti; aki követi, hazát talál.",tsz:"Valami új felé hív a szíved a kapcsolatban is — kövesd a jelet, ne birtokold.",tmu:"Egy irány ismételten felbukkan: ez nem véletlen, hanem nyom.",tle:"A lélek hívása halk, de makacs — a Csodaszarvas sosem üldöz: vár."},
"XLIII":{sz:"Hajnali kert, még nyirkos fűben térdelő asszony alabástrom kehellyel; a sír üres — s ő az első, aki az újat meglátja.",me:"Magdolna hűsége a jelenlét: ott maradt a legsötétebb óráig, ezért lett az első tanú a hajnalban. A szeretet legmagasabb foka nem a birtoklás — a végigkísérés, és a jókor való elengedés.",tsz:"Maradj jelen a nehézben — és engedd szabadon a jóban: ez a hűség két keze.",tmu:"Kísérj végig egy folyamatot az utolsó lépésig — a tanúság is szerep.",tle:"A kehely te vagy: ami beléd öntetett, gyógyításra kaptad."},
"XLIV":{sz:"Fénypáncélos alak lángoló karddal; nem sújt — a kard hegye vonalat húz a földre: eddig, és ne tovább.",me:"Mihály kardja nem fegyver, hanem határ: elválasztja az igazat a hamistól, a tiédet a másétól. A szeretetből húzott határ nem fal — meder, amelyben a kapcsolat folyhat.",tsz:"A határaid kimondása nem eltávolít — biztonságot ad mindkettőtöknek.",tmu:"Mondj nemet a nem-dolgodra: a fókusz fénykard.",tle:"A védelem kérhető — s a lelked joga a tiszta tér."},
"XLV":{sz:"Egyszerű kehely a fénysugárban; nem az arany teszi ragyogóvá, hanem a kérdés, amit végre feltettek mellette.",me:"A Grált nem a legerősebb találta meg, hanem aki jól kérdezett: „Kit szolgál?” A keresés célja sosem a birtoklás — a kérdés átalakító ereje. Lehet, hogy a kehely rég a kezedben van.",tsz:"Kérdezd meg: kit szolgál a kapcsolatotok? A válasz újraszenteli.",tmu:"A projekt értelme a szolgálatában van — találd meg újra, kinek jó.",tle:"A teljesség nem trófea: kérdés, amellyel élni lehet."}
};
DECK.forEach(c=>{if(EXT[c.no])Object.assign(c,EXT[c.no]);});

/* ==================== MÉLYÍTETT KÁRTYA-RÉTEGEK ====================
   Forrás- és motívumrétegek feldolgozva: Hanes Taliesin / Mabinogion
   Ceridwen-üst és alakváltás-motívumok; avaloni és artúri hagyomány;
   kelta évkör és holdciklus-szimbolika. A szöveg önismereti, jelképes
   értelmezés, nem tényállítás, jövőmondás vagy szakmai tanács.
   ============================================================ */
const DEEP = {
  "I": {
    "my": "Az üst a kelta képzeletben egyszerre méh, műhely és sír: benne a régi forma szétesik, hogy új rendbe állhasson össze. Itt kezdődik minden valódi beavatás: nem látványos döntéssel, hanem hosszú érleléssel.",
    "deep": "Archetípusa: ami benned érlelődik — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kezdet, mélység, érlelődés; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Írd fel egy lapra: „Az üstömben most ez fő: …” Ne oldd meg azonnal — csak nevezd meg.",
    "question": "Mi fő bennem már régóta, és miért sürgetem?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "II": {
    "my": "A három csepp nem mennyiségi tudás, hanem minőségi ébredés: egy pillanat alatt látod meg azt, amit addig csak körbejártál. Az ajándék akkor marad tiszta, ha nem birtoklod, hanem szolgálod.",
    "deep": "Archetípusa: a kegyelem váratlan ajándéka — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: ihlet, kegyelem, fordulat; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Jegyezd le a mai nap három apró felismerését. A harmadiknál állj meg, mert ott szokott kezdődni az Awen.",
    "question": "Milyen ajándékot kaptam, amit még nem mertem a sajátomnak tekinteni?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "III": {
    "my": "A nyúl a test ősi hírvivője: mielőtt az elme megmagyarázná, a tested már tudja, hol van veszély, vágy vagy menekülési út. A lap az ösztön és a gyávaság közti finom különbséget vizsgálja.",
    "deep": "Archetípusa: az ösztön első mozdulata — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: ösztön, gyorsaság, önvédelem; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Ma legalább egyszer hallgass az első testi jelre, mielőtt megmagyaráznád.",
    "question": "Mit tud a testem, amit az elmém még vitat?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "IV": {
    "my": "Az agár nem puszta üldöző, hanem következmény: mindaz, amit a tudatosság elől hátrahagytál. A lap azt kérdezi, mi fut utánad azért, mert még nem ismerted el.",
    "deep": "Archetípusa: ami a nyomodban jár — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: következmény, szembenézés, tanító; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Írd le, mi „üldöz” most. Mellé írd: „Mit akar ez megtanítani?”",
    "question": "Milyen következményből lehetne tanító, ha nem menekülnék előle?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "V": {
    "my": "A vízbe ugró hal a forráshoz való visszatérést jelképezi. A lazac-motívum a kelta hagyományban a bölcsesség és az emlékezet mély vizéhez kapcsolódik.",
    "deep": "Archetípusa: árral szemben, a forrás felé — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kitartás, mélység, hűség; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Térj vissza egy régi, elhagyott forráshoz: helyhez, könyvhöz, imához, zenéhez vagy tudáshoz.",
    "question": "Mi az a forrás, amelyhez érdemes árral szemben is visszatérnem?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "VI": {
    "my": "A vidra a víz alatti ügyesség és játékos túlélés képe. A lap azt mutatja, hogy nem minden mélységet kell komoran kezelni: néha a hajlékonyság oldja meg, amit az erő nem.",
    "deep": "Archetípusa: a mélység is ismer téged — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: érzelmek, hajlékonyság, játék; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Oldj meg egy nehéz dolgot könnyedebb eszközzel: humorral, mozgással vagy játékos próbával.",
    "question": "Hol segítene a játékosság többet, mint az erőlködés?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "VII": {
    "my": "A madárrá válás a távlat és a könnyűség beavatása. Az ökörszem kicsiny, mégis éber: azt tanítja, hogy a lélek néha akkor szabadul, ha nem akar nagynak látszani.",
    "deep": "Archetípusa: a kicsinység szabadsága — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: távlat, könnyűség, szellem; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Válassz ma egy könnyítő mozdulatot: rövid válasz, kevesebb magyarázat, több levegő.",
    "question": "Miben ad szabadságot, ha nem akarok nagyobbnak látszani?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "VIII": {
    "my": "A sólyom a pontosság, a nagy magasságból látott igazság és a hirtelen lecsapó felismerés madara. A lap nem gyors ítéletet kér, hanem tiszta fókuszt.",
    "deep": "Archetípusa: az éles látás órája — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: fókusz, igazság, sors; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Vágj ki egy zavaró tényezőt a napból, és adj egy órát a tiszta fókusznak.",
    "question": "Mi az az igazság, amelyet már látok, csak nem merek kimondani?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "IX": {
    "my": "A búzaszem a legmélyebb paradoxon: amit lenyelnek, az nem megsemmisül, hanem új testet kap. Ez a lap a veszteség mögötti fogantatást mutatja.",
    "deep": "Archetípusa: halál, amely fogantatás — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: megadás, újjászületés, Taliesin; ezek mutatják, hol kell finomítani a figyelmet. A Hanes Taliesin történetében a cauldron, az Awen három cseppje és az alakváltó üldözés azt tanítja, hogy a tudás nem dísz, hanem átalakító erő. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Testben ez gyakran gyomortáji, mellkasi vagy torok körüli jelként jelentkezik: valami készül, de még nem talált formát.",
    "practice": "Tedd borítékba annak a nevét, amit elengedsz, majd írd a másik oldalára: „ebből új élet nőhet”.",
    "question": "Mit kell magként eltemetnem, hogy új formában születhessen vissza?",
    "ritual": "Gyújts egy gyertyát, vagy képzeld el az üst tüzét. Mondd: „Ami érni akar, kapjon időt; ami kész, kapjon formát.”",
    "tszPlus": "Kapcsolatban ez azt jelenti: ne követelj azonnali választ arra, ami még csak érlelődik. A bizalom most a lassúság tisztelete.",
    "tmuPlus": "Munkában ez inkubációs idő: ne dobd piacra túl korán, de ne is hagyd örökre a műhelyben.",
    "tlePlus": "Lélekúton engedd, hogy a mély folyamat végigfőjön. A túl gyors „megértettem” néha csak menekülés a beérés elől."
  },
  "X": {
    "my": "Ceridwen az üst teljes úrnője: anya, varázsló, haragvó tanító és újjászülő erő egyszerre. A lap a mély változás tiszteletét kéri.",
    "deep": "Archetípusa: az üst úrnője — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: átalakulás, bölcsesség, sötét anya; ezek mutatják, hol kell finomítani a figyelmet. Az avaloni istennői réteg itt a női szuverenitás, a méltóság, a próbatétel és a gyógyító emlékezet nyelvén szól. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Figyeld a tartásodat, a hangod erejét és azt, mikor húzod össze magad: a test jelzi, hol vesztesz méltóságot.",
    "practice": "Tedd fel a kérdést: hol adtam ki a saját erőmet más kezébe? Ma egy ponton vedd vissza szelíden. A Ceridwen lapjánál külön figyeld ezt: az üst úrnője.",
    "question": "Hol kell ma méltóságban, nem pedig védekezésben állnom? Mit mutat erről most a(z) Ceridwen?",
    "ritual": "Állj egyenesen, kezed a szíveden. Mondd: „Saját erőmben állok, és nem kérek engedélyt az igazságomhoz.”",
    "tszPlus": "Kapcsolatban a lap a méltóságot kéri: ne kisebbítsd magad a béke kedvéért, de ne is használd az erődet büntetésre.",
    "tmuPlus": "Munkában a saját értéked tiszta képviselete a feladat: ár, határidő, szerep és felelősség legyen kimondva.",
    "tlePlus": "Lélekúton a belső női-férfi erő, a méltóság és a szuverenitás rendeződik. A kérdés: hol kell visszaállnod önmagad mellé?"
  },
  "XI": {
    "my": "Rhiannon lovas királynői minősége a saját tempó, a tiszta méltóság és a hamis vádak alatti kitartás. Nem rohan: érkezik.",
    "deep": "Archetípusa: a lovak királynője — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: méltóság, szuverenitás, saját tempó; ezek mutatják, hol kell finomítani a figyelmet. Az avaloni istennői réteg itt a női szuverenitás, a méltóság, a próbatétel és a gyógyító emlékezet nyelvén szól. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Figyeld a tartásodat, a hangod erejét és azt, mikor húzod össze magad: a test jelzi, hol vesztesz méltóságot.",
    "practice": "Tedd fel a kérdést: hol adtam ki a saját erőmet más kezébe? Ma egy ponton vedd vissza szelíden. A Rhiannon lapjánál külön figyeld ezt: a lovak királynője.",
    "question": "Hol kell ma méltóságban, nem pedig védekezésben állnom? Mit mutat erről most a(z) Rhiannon?",
    "ritual": "Állj egyenesen, kezed a szíveden. Mondd: „Saját erőmben állok, és nem kérek engedélyt az igazságomhoz.”",
    "tszPlus": "Kapcsolatban a lap a méltóságot kéri: ne kisebbítsd magad a béke kedvéért, de ne is használd az erődet büntetésre.",
    "tmuPlus": "Munkában a saját értéked tiszta képviselete a feladat: ár, határidő, szerep és felelősség legyen kimondva.",
    "tlePlus": "Lélekúton a belső női-férfi erő, a méltóság és a szuverenitás rendeződik. A kérdés: hol kell visszaállnod önmagad mellé?"
  },
  "XII": {
    "my": "Blodeuwedd virágból alkotott alakja a szépség, a szabadság és a ráírt szerepek kérdését hordozza. A lap azt vizsgálja, hol élsz mások forgatókönyvében.",
    "deep": "Archetípusa: a virágarcú — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: hitelesség, választás, felszabadulás; ezek mutatják, hol kell finomítani a figyelmet. Az avaloni istennői réteg itt a női szuverenitás, a méltóság, a próbatétel és a gyógyító emlékezet nyelvén szól. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Figyeld a tartásodat, a hangod erejét és azt, mikor húzod össze magad: a test jelzi, hol vesztesz méltóságot.",
    "practice": "Tedd fel a kérdést: hol adtam ki a saját erőmet más kezébe? Ma egy ponton vedd vissza szelíden. A Blodeuwedd lapjánál külön figyeld ezt: a virágarcú.",
    "question": "Hol kell ma méltóságban, nem pedig védekezésben állnom? Mit mutat erről most a(z) Blodeuwedd?",
    "ritual": "Állj egyenesen, kezed a szíveden. Mondd: „Saját erőmben állok, és nem kérek engedélyt az igazságomhoz.”",
    "tszPlus": "Kapcsolatban a lap a méltóságot kéri: ne kisebbítsd magad a béke kedvéért, de ne is használd az erődet büntetésre.",
    "tmuPlus": "Munkában a saját értéked tiszta képviselete a feladat: ár, határidő, szerep és felelősség legyen kimondva.",
    "tlePlus": "Lélekúton a belső női-férfi erő, a méltóság és a szuverenitás rendeződik. A kérdés: hol kell visszaállnod önmagad mellé?"
  },
  "XIII": {
    "my": "Arianrhod ezüst kereke az idő, a sors és a névadás hatalmát forgatja. Próbatételei azt kérik, vállald a saját ciklusod ritmusát.",
    "deep": "Archetípusa: az ezüst kerék — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: sors, idő, próbatételek; ezek mutatják, hol kell finomítani a figyelmet. Az avaloni istennői réteg itt a női szuverenitás, a méltóság, a próbatétel és a gyógyító emlékezet nyelvén szól. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Figyeld a tartásodat, a hangod erejét és azt, mikor húzod össze magad: a test jelzi, hol vesztesz méltóságot.",
    "practice": "Tedd fel a kérdést: hol adtam ki a saját erőmet más kezébe? Ma egy ponton vedd vissza szelíden. A Arianrhod lapjánál külön figyeld ezt: az ezüst kerék.",
    "question": "Hol kell ma méltóságban, nem pedig védekezésben állnom? Mit mutat erről most a(z) Arianrhod?",
    "ritual": "Állj egyenesen, kezed a szíveden. Mondd: „Saját erőmben állok, és nem kérek engedélyt az igazságomhoz.”",
    "tszPlus": "Kapcsolatban a lap a méltóságot kéri: ne kisebbítsd magad a béke kedvéért, de ne is használd az erődet büntetésre.",
    "tmuPlus": "Munkában a saját értéked tiszta képviselete a feladat: ár, határidő, szerep és felelősség legyen kimondva.",
    "tlePlus": "Lélekúton a belső női-férfi erő, a méltóság és a szuverenitás rendeződik. A kérdés: hol kell visszaállnod önmagad mellé?"
  },
  "XIV": {
    "my": "Branwen története a csendes szenvedés, a hírhozás és a béke törékenységének lapja. A fehér holló azt jelzi: ami halk, attól még sorsfordító lehet.",
    "deep": "Archetípusa: a fehér holló — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: csendes erő, üzenet, együttérzés; ezek mutatják, hol kell finomítani a figyelmet. Az avaloni istennői réteg itt a női szuverenitás, a méltóság, a próbatétel és a gyógyító emlékezet nyelvén szól. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Figyeld a tartásodat, a hangod erejét és azt, mikor húzod össze magad: a test jelzi, hol vesztesz méltóságot.",
    "practice": "Tedd fel a kérdést: hol adtam ki a saját erőmet más kezébe? Ma egy ponton vedd vissza szelíden. A Branwen lapjánál külön figyeld ezt: a fehér holló.",
    "question": "Hol kell ma méltóságban, nem pedig védekezésben állnom? Mit mutat erről most a(z) Branwen?",
    "ritual": "Állj egyenesen, kezed a szíveden. Mondd: „Saját erőmben állok, és nem kérek engedélyt az igazságomhoz.”",
    "tszPlus": "Kapcsolatban a lap a méltóságot kéri: ne kisebbítsd magad a béke kedvéért, de ne is használd az erődet büntetésre.",
    "tmuPlus": "Munkában a saját értéked tiszta képviselete a feladat: ár, határidő, szerep és felelősség legyen kimondva.",
    "tlePlus": "Lélekúton a belső női-férfi erő, a méltóság és a szuverenitás rendeződik. A kérdés: hol kell visszaállnod önmagad mellé?"
  },
  "XV": {
    "my": "A ködfüggöny a két világ határa. Nem fal, hanem próba: elég tiszta-e a szándékod ahhoz, hogy átmehess?",
    "deep": "Archetípusa: a küszöb, amely hitet kér — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: küszöb, hit, átjárás; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A A Ködfüggöny lapjánál külön figyeld ezt: a küszöb, amely hitet kér.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) A Ködfüggöny?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XVI": {
    "my": "Az almáskert Avalon bősége: nem túlfogyasztás, hanem gyógyító édesség. A lap arra tanít, hogy a jutalom is lehet szent, ha hálával fogadod.",
    "deep": "Archetípusa: a sziget édessége — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: bőség, jutalom, gyógyulás; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A Az Almáskert lapjánál külön figyeld ezt: a sziget édessége.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) Az Almáskert?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XVII": {
    "my": "A szent tó nem hízeleg. A víztükör pontos, de nem kegyetlen: azt mutatja, ami gyógyulni akar, nem azt, amit büntetni kellene.",
    "deep": "Archetípusa: a tükör, amely nem hazudik — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: tükör, tudatalatti, csend; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A A Szent Tó lapjánál külön figyeld ezt: a tükör, amely nem hazudik.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) A Szent Tó?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XVIII": {
    "my": "A Tor spirális útja azt jelzi, hogy az emelkedés ritkán egyenes. A domb tetejére nem rövidítés, hanem ismétlődő körök visznek fel.",
    "deep": "Archetípusa: a szent domb spirálútja — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: rálátás, zarándoklat, emelkedés; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A A Tor lapjánál külön figyeld ezt: a szent domb spirálútja.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) A Tor?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XIX": {
    "my": "A vörös forrás a test, vér, szenvedély és élni akarás szent vize. Nem szégyen az erő: csak meder kell neki.",
    "deep": "Archetípusa: az élet vasas vize — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: életerő, szenvedély, női erő; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A A Vörös Forrás lapjánál külön figyeld ezt: az élet vasas vize.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) A Vörös Forrás?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XX": {
    "my": "A fehér forrás az ősök és a tisztaság vize. A lap a családi, történeti és lelki eredethez való békésebb visszatérést hívja.",
    "deep": "Archetípusa: az ősök kristályvize — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: tisztaság, ősök, alap; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A A Fehér Forrás lapjánál külön figyeld ezt: az ősök kristályvize.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) A Fehér Forrás?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XXI": {
    "my": "A papnők tüze a körben őrzött tudás képe. A beavatás nem öncélú rang, hanem szolgálat a közösség tüzénél.",
    "deep": "Archetípusa: a kilencek köre — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: közösség, szolgálat, beavatás; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A A Papnők Tüze lapjánál külön figyeld ezt: a kilencek köre.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) A Papnők Tüze?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XXII": {
    "my": "A fekete bárka a méltó lezárás eszköze. Nem minden átkelés tragédia: van, ami csak úgy tud békébe érni, ha elengedik.",
    "deep": "Archetípusa: a méltó átkelés — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: lezárás, gyász, kísérés; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A A Fekete Bárka lapjánál külön figyeld ezt: a méltó átkelés.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) A Fekete Bárka?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XXIII": {
    "my": "Az almában rejtett csillag a hétköznapi csoda lapja. A rend nem mindig látványos; gyakran a legkisebb részletben mutatja meg magát.",
    "deep": "Archetípusa: a hétköznapokba rejtett mágia — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: rejtett rend, csoda, figyelem; ezek mutatják, hol kell finomítani a figyelmet. Avalon szent tájai belső földrajzként működnek: tó, domb, forrás, bárka és kert mind a lélek egy-egy kapuja. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A belső táj a légzésben és a szem fókuszában jelenik meg: ha szétesel, keress vizuális és fizikai kapaszkodót.",
    "practice": "Válassz egy belső tájat — víz, domb, kert vagy kapu — és három percig képzeld el részletesen, mintha valóban ott lennél. A Az Alma Csillaga lapjánál külön figyeld ezt: a hétköznapokba rejtett mágia.",
    "question": "Melyik belső tájam kér figyelmet: a víz, a domb, a kert, a forrás vagy a bárka? Mit mutat erről most a(z) Az Alma Csillaga?",
    "ritual": "Egy pohár vizet tegyél magad elé. Nézz bele pár másodpercig, majd kérd: „Mutasd meg a tiszta képet.”",
    "tszPlus": "Kapcsolatban közös belső térre van szükség: nem csak megoldani, hanem együtt lenni kell a helyzettel.",
    "tmuPlus": "Munkában előbb térképezd fel a terepet. A jó döntéshez most kontextus, nem kapkodó végrehajtás kell.",
    "tlePlus": "Lélekúton ez belső zarándoklat. Nem biztos, hogy külső választ kapsz; lehet, hogy térképet a saját mélységedhez."
  },
  "XXIV": {
    "my": "A hallgatás ösvénye a túl sok zajból vezeti ki a lelket. Nem passzivitás, hanem olyan figyelem, amelyben a mélyebb válasz fel tud jönni.",
    "deep": "Archetípusa: a csend, amely beszél — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: csend, befelé figyelés, szünet; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A A Hallgatás Ösvénye lapjánál külön figyeld ezt: a csend, amely beszél.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) A Hallgatás Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXV": {
    "my": "Az ihlet ösvénye az Awen áramát nyitja. Nem „kitalálni” kell, hanem átengedni, ami már kopogtat.",
    "deep": "Archetípusa: az awen árama — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: alkotás, ihlet, áramlás; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A Az Ihlet Ösvénye lapjánál külön figyeld ezt: az awen árama.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) Az Ihlet Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXVI": {
    "my": "Az átváltozás ösvénye azt mutatja, hogy az identitás nem börtön. Az alakváltás akkor szent, ha közelebb visz az igazsághoz, nem távolabb.",
    "deep": "Archetípusa: alakot váltani szabad — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: rugalmasság, alakváltás, növekedés; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A Az Átváltozás Ösvénye lapjánál külön figyeld ezt: alakot váltani szabad.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) Az Átváltozás Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXVII": {
    "my": "Az elengedés ösvénye az üres kéz méltósága. Amihez görcsösen ragaszkodsz, gyakran épp attól nem tud élni.",
    "deep": "Archetípusa: az üres kéz bátorsága — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: elengedés, bizalom, tér; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A Az Elengedés Ösvénye lapjánál külön figyeld ezt: az üres kéz bátorsága.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) Az Elengedés Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXVIII": {
    "my": "A gyógyulás ösvénye a két forrás egyensúlya: erő és lágyság, cselekvés és pihenés, seb és türelem.",
    "deep": "Archetípusa: a két forrás egyensúlya — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: önápolás, regenerálódás, türelem; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A A Gyógyulás Ösvénye lapjánál külön figyeld ezt: a két forrás egyensúlya.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) A Gyógyulás Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXIX": {
    "my": "Az emlékezés ösvénye az ősök, régi történetek és elfeledett készségek útja. A múlt nem lánc, hanem térkép, ha tudatosan olvasod.",
    "deep": "Archetípusa: az ősök a hátad mögött — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: gyökerek, ősök, régi tudás; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A Az Emlékezés Ösvénye lapjánál külön figyeld ezt: az ősök a hátad mögött.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) Az Emlékezés Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXX": {
    "my": "A bátorság ösvénye a kimondott szó mágiája. A szó nemcsak leírja a valóságot: keretet is ad neki.",
    "deep": "Archetípusa: a kimondott szó ereje — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kiállás, őszinteség, tett; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A A Bátorság Ösvénye lapjánál külön figyeld ezt: a kimondott szó ereje.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) A Bátorság Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXXI": {
    "my": "A szövetség ösvénye a kerekasztal képe: nincs titkos trón, ha valódi közösséget akarsz. A körben minden arc látható.",
    "deep": "Archetípusa: a kerekasztal tanítása — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kapcsolat, egyenrangúság, hűség; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A A Szövetség Ösvénye lapjánál külön figyeld ezt: a kerekasztal tanítása.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) A Szövetség Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXXII": {
    "my": "A küszöb ösvénye a liminális idő: már nem a régi, még nem az új. A köztes tér szent, de nem végállomás.",
    "deep": "Archetípusa: se kint, se bent — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: átmenet, döntés, liminális idő; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A A Küszöb Ösvénye lapjánál külön figyeld ezt: se kint, se bent.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) A Küszöb Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXXIII": {
    "my": "A hazatérés ösvénye azt mondja: Avalon nem csak távoli sziget, hanem belső állapot. A köd akkor ritkul, amikor nem harcolsz önmagaddal.",
    "deep": "Archetípusa: avalon benned van — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: megérkezés, önelfogadás, teljesség; ezek mutatják, hol kell finomítani a figyelmet. Az Awen ösvényei nem elvont tanítások, hanem gyakorlati beavatási utak: csend, szó, emlékezet, szövetség és hazatérés. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A tested megmutatja, melyik ösvény igaz: amelyiknél mélyebb lesz a lélegzet, arra menj tovább.",
    "practice": "Válassz egy konkrét lépést, amely ma is megtehető; az ösvény nem gondolat, hanem lábnyom. A A Hazatérés Ösvénye lapjánál külön figyeld ezt: avalon benned van.",
    "question": "Mi az az egyetlen lépés, amelytől az ösvény valóságossá válik? Mit mutat erről most a(z) A Hazatérés Ösvénye?",
    "ritual": "Tegyél három lassú lépést tudatosan. Az első a múlt, a második a jelen, a harmadik a választott irány.",
    "tszPlus": "Kapcsolatban az ösvény egy közös gyakorlatot kér: egy beszélgetést, egy határt, egy bocsánatkérést vagy egy új ritmust.",
    "tmuPlus": "Munkában egyetlen végrehajtható lépés többet ér, mint a nagy stratégiai köd. Ma legyen látható lábnyom.",
    "tlePlus": "Lélekúton a gyakorlat visz tovább. Amit ma ténylegesen megteszel, az erősebb, mint amit csak megfogadsz."
  },
  "XXXIV": {
    "my": "Merlin a mintázatlátás őrzője. A jövő nem fix jövőmondásként érkezik hozzá, hanem ismétlődő jelekből olvasható folyamatként.",
    "deep": "Archetípusa: a látó — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: látás, tanács, időn túli tudás; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A Merlin lapjánál külön figyeld ezt: a látó.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) Merlin?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XXXV": {
    "my": "Artúr király lapja a hivatás próbája. A kardot nem az húzza ki, aki erősebb, hanem aki hajlandó szolgálni a közös rendet.",
    "deep": "Archetípusa: az igaz király — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: hivatás, felelősség, egység; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A Artúr Király lapjánál külön figyeld ezt: az igaz király.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) Artúr Király?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XXXVI": {
    "my": "A Tó Asszonya a mélyből érkező ajándékot őrzi. Excalibur-tanítása: amit kapsz, azt használatra kapod, nem birtoklásra.",
    "deep": "Archetípusa: a mély ajándéka — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: beavatás, ajándék, sáfárság; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A A Tó Asszonya lapjánál külön figyeld ezt: a mély ajándéka.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) A Tó Asszonya?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XXXVII": {
    "my": "Morgana az árnyék és a gyógyítás kettős alakja. Ami félreértett benned, lehet, hogy nem romboló erő, csak név és hely nélkül maradt.",
    "deep": "Archetípusa: az árnyék úrnője — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: árnyékmunka, gyógyítás, félreértett erő; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A Morgana lapjánál külön figyeld ezt: az árnyék úrnője.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) Morgana?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XXXVIII": {
    "my": "Taliesin a megszületett hang: a tudásnak végül dallá, mondattá, művé vagy tanúsággá kell válnia.",
    "deep": "Archetípusa: a tündöklő homlokú — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: tehetség, a szó ereje, kibontakozás; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A Taliesin lapjánál külön figyeld ezt: a tündöklő homlokú.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) Taliesin?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XXXIX": {
    "my": "A vörös sárkány a föld mélyéből felszálló életerő. Ha elnyomod, rombol; ha mederbe állítod, megtart.",
    "deep": "Archetípusa: a belső tűz — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: életerő, gyökér-erő, kitartás; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A A Vörös Sárkány lapjánál külön figyeld ezt: a belső tűz.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) A Vörös Sárkány?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XL": {
    "my": "A fehér sárkány az ellenerő, amely próbára teszi az építményt. Nem minden ellenállás ellenség: némelyik statikai vizsga.",
    "deep": "Archetípusa: az ellenerő — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kihívás, próba, régi rend; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A A Fehér Sárkány lapjánál külön figyeld ezt: az ellenerő.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) A Fehér Sárkány?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XLI": {
    "my": "Nimród íja az ősi célratartás és nemzedékeken átívelő szándék. A nyíl néha csak akkor ér célba, amikor te már másnak adtad tovább az íjat.",
    "deep": "Archetípusa: az ősapa íja — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: örökség, célratartás, nemzedékek íve; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A Nimród, az Ősvadász lapjánál külön figyeld ezt: az ősapa íja.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) Nimród, az Ősvadász?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XLII": {
    "my": "A Csodaszarvas nem zsákmány, hanem hívás. Addig vezet, amíg mozgásban tart; ha birtokolni akarod, eltűnik.",
    "deep": "Archetípusa: a hívás — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: hívás, vezettetés, új haza; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A A Csodaszarvas lapjánál külön figyeld ezt: a hívás.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) A Csodaszarvas?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XLIII": {
    "my": "Mária Magdolna kehelyminősége a hűséges jelenlét: ott maradni, amikor sötét van, és felismerni a hajnalt, amikor más még a veszteséget nézi.",
    "deep": "Archetípusa: a kehely őrzője — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: hűséges szeretet, jelenlét, tanúság; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A Mária Magdolna lapjánál külön figyeld ezt: a kehely őrzője.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) Mária Magdolna?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XLIV": {
    "my": "Mihály fénykardja határt húz. Nem támad, hanem különválaszt: igazat a hamistól, sajátot az idegentől, fényt a ködtől.",
    "deep": "Archetípusa: a fénykard — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: védelem, igazság, határvonás; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A Mihály Arkangyal lapjánál külön figyeld ezt: a fénykard.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) Mihály Arkangyal?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XLV": {
    "my": "A Szent Grál a jól feltett kérdés kelyhe. A teljesség nem tárgy, amit megszerzel, hanem szolgálat, amelyben megtisztulsz.",
    "deep": "Archetípusa: a teljesség kelyhe — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: teljesség, a keresés értelme, szolgálat; ezek mutatják, hol kell finomítani a figyelmet. Az őrzők háza a mítoszi döntés pillanatát hozza: kard, kehely, sárkány, csodaszarvas vagy fénykard formájában mindig felelősséget kér. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A váll, hát és állkapocs feszülése jelzi, ha felelősség, harc vagy határ vár kimondásra.",
    "practice": "Nevezz meg egy felelősséget, amelyet már nem lehet halogatni, és adj neki egy első, kicsi cselekvést. A A Szent Grál lapjánál külön figyeld ezt: a teljesség kelyhe.",
    "question": "Milyen erőt kaptam, és kinek vagy minek a szolgálatába kell állítanom? Mit mutat erről most a(z) A Szent Grál?",
    "ritual": "Képzelj fénykört magad köré. Nevezd meg, mit őrzöl, és mit nem engedsz tovább a körön belülre.",
    "tszPlus": "Kapcsolatban a lap felelősséget és tisztább szerepeket kér: ki mit őriz, ki mit vállal, és hol kell újra egyenrangúvá válni.",
    "tmuPlus": "Munkában vezetői minőség hív: határ, döntés, védett fókusz vagy közös asztal létrehozása.",
    "tlePlus": "Lélekúton egy őrzői próba áll előtted: erőt kapsz, de csak akkor marad tiszta, ha szolgálatba állítod."
  },
  "XLVI": {
    "my": "A hegyikristály a fókusz és erősítés archetípusa. Amit felnagyítasz vele, annak előbb tisztának kell lennie.",
    "deep": "Archetípusa: a tisztaság mestere — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: tisztaság, fókusz, erősítés; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Hegyikristály lapjánál külön figyeld ezt: a tisztaság mestere.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Hegyikristály?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "XLVII": {
    "my": "Az ametiszt a nyugtalan gondolatok átlényegítő tere. Nem elaltat, hanem magasabb rezgésbe fordítja a nyugtalanságot.",
    "deep": "Archetípusa: a lélek nyugtatója — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: béke, átlényegítés, védelem; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Ametiszt lapjánál külön figyeld ezt: a lélek nyugtatója.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Ametiszt?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "XLVIII": {
    "my": "A rózsakvarc a szív körüli páncél puhításának köve. Nem naivitást kér, hanem gyengéd bátorságot.",
    "deep": "Archetípusa: a szív gyógyítója — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: önszeretet, gyengédség, megbocsátás; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Rózsakvarc lapjánál külön figyeld ezt: a szív gyógyítója.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Rózsakvarc?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "XLIX": {
    "my": "A citrin a napfény és teremtő önbizalom jelképe. Bősége nem kapzsiság, hanem engedély arra, hogy örömben is alkoss.",
    "deep": "Archetípusa: a napfény köve — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: bőség, öröm, önbizalom; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Citrin lapjánál külön figyeld ezt: a napfény köve.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Citrin?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "L": {
    "my": "A holdkő a belső árapályt tanítja: nem minden nap alkalmas ugyanarra. A ciklus tisztelete hatékonyság, nem gyengeség.",
    "deep": "Archetípusa: a belső árapály — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: intuíció, ciklusok, női bölcsesség; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Holdkő lapjánál külön figyeld ezt: a belső árapály.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Holdkő?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LI": {
    "my": "A fekete turmalin a határ és földelés lapja. A védelem nem félelem: annak felismerése, hol kezdődsz te.",
    "deep": "Archetípusa: az őrző kő — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: védelem, földelés, határok; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Fekete Turmalin lapjánál külön figyeld ezt: az őrző kő.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Fekete Turmalin?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LII": {
    "my": "A labradorit a rejtett fény köve. A felszín alatt színek várnak, de csak akkor villannak fel, ha más szögből nézel rájuk.",
    "deep": "Archetípusa: a belső fény köve — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: rejtett képességek, mágia, önvédelem; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Labradorit lapjánál külön figyeld ezt: a belső fény köve.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Labradorit?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LIII": {
    "my": "A borostyán az ősfény megdermedt emléke. Melege azt üzeni: a régi öröm is lehet mai erőforrás.",
    "deep": "Archetípusa: az ősfény cseppje — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: életerő, melegség, ősi gyógyerő; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Borostyán lapjánál külön figyeld ezt: az ősfény cseppje.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Borostyán?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LIV": {
    "my": "A tigrisszem a bátor, mégis gyakorlati tekintet. Nem vakmerőség, hanem józan éberség, amely mozdulni mer.",
    "deep": "Archetípusa: a bátor tekintet — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: bátorság, gyakorlatiasság, éberség; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Tigrisszem lapjánál külön figyeld ezt: a bátor tekintet.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Tigrisszem?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LV": {
    "my": "Az akvamarin a tiszta beszéd és érzelmi áramlás köve. A kimondás akkor gyógyít, ha nem vág, hanem átvezet.",
    "deep": "Archetípusa: a tiszta beszéd köve — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kommunikáció, tisztaság, áramlás; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Akvamarin lapjánál külön figyeld ezt: a tiszta beszéd köve.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Akvamarin?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LVI": {
    "my": "A gránát a vér tüze: szenvedély, kitartás, élni akarás. Akkor segít, ha nem kiégésre, hanem elköteleződésre használod.",
    "deep": "Archetípusa: a vér tüze — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: szenvedély, kitartás, életerő; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Gránát lapjánál külön figyeld ezt: a vér tüze.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Gránát?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LVII": {
    "my": "A szelenit a fény pálcája: tisztítás, magasabb kapcsolat, finom rend. Nem erőlködik; átereszt.",
    "deep": "Archetípusa: a fény pálcája — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: tisztítás, fénykapcsolat, béke; ezek mutatják, hol kell finomítani a figyelmet. A kristálylapok a föld mélyének nyelvén beszélnek. Nem tárgyként kell birtokolni őket, hanem minőségként megtestesíteni. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A földelés jelei fontosak: talp, tenyér, légzés. A lap azt kéri, ne csak értsd, hanem testesítsd is.",
    "practice": "Tarts a kezedben egy követ vagy bármilyen természetes tárgyat, és mondd ki, milyen minőséget szeretnél megtestesíteni. A Szelenit lapjánál külön figyeld ezt: a fény pálcája.",
    "question": "Melyik minőséget kell ma nemcsak kérnem, hanem megtestesítenem? Mit mutat erről most a(z) Szelenit?",
    "ritual": "Mosd meg a kezed hideg vízben, majd érintsd meg a homlokod, szíved és köldököd: gondolat, érzés, tett egy irányba áll.",
    "tszPlus": "Kapcsolatban a minőség számít: gyengédség, tisztaság, határ vagy bátorság. Válaszd ki, melyiket kell ma megtestesítened.",
    "tmuPlus": "Munkában kristályosítsd a célt: egy mondat, egy mérőszám, egy tiszta következő lépés.",
    "tlePlus": "Lélekúton a minőséget kell lehorgonyozni: tisztaságot, békét, védelmet vagy bátorságot a test és napirend szintjén is."
  },
  "LVIII": {
    "my": "Az újhold a láthatatlan kezdet. A kelta évkörben ez Samhain sötét kapujára is emlékeztet: az új élet gyakran a sötétben fogan.",
    "deep": "Archetípusa: a sötét kezdet — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kezdet, mag, szándék; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A Újhold lapjánál külön figyeld ezt: a sötét kezdet.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) Újhold?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LIX": {
    "my": "A növő hold az Imbolc-féle növekvő fény rokona: apró, de biztos erősödés. Nem látványosság, hanem gondozás.",
    "deep": "Archetípusa: az építés íve — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: növekedés, lendület, táplálás; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A Növő Hold lapjánál külön figyeld ezt: az építés íve.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) Növő Hold?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LX": {
    "my": "A telihold a beteljesedett fény és a betakarítás pillanata. A Mabon-jellegű hála itt személyes belátássá válik.",
    "deep": "Archetípusa: a beteljesedés fénye — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: csúcspont, láthatóság, betakarítás; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A Telihold lapjánál külön figyeld ezt: a beteljesedés fénye.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) Telihold?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXI": {
    "my": "A fogyó hold Samhain előtti rendrakásként működik: ami fölösleges, menjen békével. Az apály a következő dagály helyét készíti.",
    "deep": "Archetípusa: az elengedés íve — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: elengedés, tisztítás, visszavonulás; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A Fogyó Hold lapjánál külön figyeld ezt: az elengedés íve.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) Fogyó Hold?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXII": {
    "my": "A fekete hold a fátyol legmélyebb pontja: a kimondatlan, száműzött vagy tabusított erő találkozóhelye.",
    "deep": "Archetípusa: a mélység kapuja — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: árnyék, titok, őserő; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A Fekete Hold lapjánál külön figyeld ezt: a mélység kapuja.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) Fekete Hold?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXIII": {
    "my": "Az Esthajnalcsillag a szerelem, szépség és orientáció fénye. A sötétedésben is megmutatja, merre van az élő vonzás.",
    "deep": "Archetípusa: vénusz fénye — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: szerelem, szépség, vonzás; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A Esthajnalcsillag lapjánál külön figyeld ezt: vénusz fénye.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) Esthajnalcsillag?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXIV": {
    "my": "A Sarkcsillag az állandó viszonyítási pont. A kelta vándorút és zarándoklat belső megfelelője: tudni, hol az északod.",
    "deep": "Archetípusa: az állandó pont — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: irány, hűség, vezérelv; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A A Sarkcsillag lapjánál külön figyeld ezt: az állandó pont.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) A Sarkcsillag?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXV": {
    "my": "A hulló csillag a rövid ideig nyitva álló kegyelmi ablak. Nem birtokolható, csak észrevehető és megválaszolható.",
    "deep": "Archetípusa: a kegyelem pillanata — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: kívánság, pillanat, váratlan ajándék; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A A Hulló Csillag lapjánál külön figyeld ezt: a kegyelem pillanata.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) A Hulló Csillag?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXVI": {
    "my": "A Tejút, a magyar hagyományban Hadak Útja, a személyes gondot nagyobb léptékbe helyezi. A lap az ősök és a közösség égbolti emlékezete.",
    "deep": "Archetípusa: a lelkek folyója — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: összetartozás, végtelen, perspektíva; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A A Tejút lapjánál külön figyeld ezt: a lelkek folyója.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) A Tejút?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXVII": {
    "my": "A holdfogyatkozás sorskapu: a fény ideiglenes takarása azért jön, hogy lásd, mi marad, amikor a megszokott ragyogás eltűnik.",
    "deep": "Archetípusa: a nagy átállás — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: fordulat, sorskapu, gyorsítás; ezek mutatják, hol kell finomítani a figyelmet. A hold- és csillaglapok a ciklusok tanítói: növekedés, telés, fogyás, sötétedés, majd újrakezdés. A kelta évkör is ilyen ritmusban lélegzik. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "Hangulat, alvás, folyadék és ritmus most különösen beszédes: a ciklus a testeden át is üzen.",
    "practice": "Igazítsd a mai döntést a ciklushoz: ha nő a fény, építs; ha fogy, engedj el; ha telik, mutasd meg; ha sötét, hallgass. A A Holdfogyatkozás lapjánál külön figyeld ezt: a nagy átállás.",
    "question": "A ciklus melyik pontján vagyok: vetésben, növekedésben, telésben vagy elengedésben? Mit mutat erről most a(z) A Holdfogyatkozás?",
    "ritual": "Nézz az égre vagy képzeld el a Holdat. Egy mondatban nevezd meg: mit növelsz, mit teljesítesz, mit engedsz el.",
    "tszPlus": "Kapcsolatban figyelj a ciklusra: van idő beszélni, van idő hallgatni, van idő ünnepelni, és van idő elengedni.",
    "tmuPlus": "Munkában igazodj a ritmushoz: indítás, építés, bemutatás vagy lezárás — ne keverd össze a fázisokat.",
    "tlePlus": "Lélekúton minden fázis szent: a sötét nem hiba, a teljesség nem végállomás, az elengedés nem veszteség."
  },
  "LXVIII": {
    "my": "Az őrangyal a hétköznapi védelem és csendes vezetés képe. Nem feltétlenül látványos jelként, hanem jókor érkező fékként vagy bátorításként mutatkozik.",
    "deep": "Archetípusa: a csendes kísérő — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: védelem, jelenlét, bizalom; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Az Őrangyal lapjánál külön figyeld ezt: a csendes kísérő.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Az Őrangyal?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXIX": {
    "my": "Gábriel a hírnök: a kimondott, leírt vagy megálmodott üzenet teremtő ereje. A lap a tiszta kommunikáció felelősségét kéri.",
    "deep": "Archetípusa: a hírnök — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: üzenet, tisztánlátás, új élet; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Gábriel lapjánál külön figyeld ezt: a hírnök.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Gábriel?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXX": {
    "my": "Rafael a gyógyulás és útitársi védelem alakja. A helyreállítás nem mindig gyors, de mindig konkrét gondoskodással kezdődik.",
    "deep": "Archetípusa: a gyógyító — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: gyógyulás, útitárs, egészség; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Rafael lapjánál külön figyeld ezt: a gyógyító.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Rafael?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXXI": {
    "my": "Uriel a bölcsesség lángja: nem hangos inspiráció, hanem megvilágított megoldás. A káosz közepén egyszer csak láthatóvá válik a szerkezet.",
    "deep": "Archetípusa: a bölcsesség lángja — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: belátás, megoldás, igazság; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Uriel lapjánál külön figyeld ezt: a bölcsesség lángja.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Uriel?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXXII": {
    "my": "Chamuel a szerető szem: azt keresi meg, ami elveszettnek tűnt — békét, társat, önszeretetet vagy egyszerű jóindulatot.",
    "deep": "Archetípusa: a szerető szem — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: szeretet, megtalálás, békéltetés; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Chamuel lapjánál külön figyeld ezt: a szerető szem.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Chamuel?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXXIII": {
    "my": "Jofiel a szépségen keresztüli gondolattisztítás. Amit szebbé, rendezettebbé teszel, az visszarendezi a belső teret is.",
    "deep": "Archetípusa: a szépség angyala — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: szépség, gondolattisztítás, derű; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Jofiel lapjánál külön figyeld ezt: a szépség angyala.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Jofiel?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXXIV": {
    "my": "Zadkiel az ibolyaláng és megbocsátás jelképe. A megbocsátás itt nem felmentés, hanem a saját energiád visszavétele.",
    "deep": "Archetípusa: a megbocsátás lángja — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: megbocsátás, szabadulás, ibolyaláng; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Zadkiel lapjánál külön figyeld ezt: a megbocsátás lángja.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Zadkiel?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXXV": {
    "my": "Metatron az írnok és a szent rend archetípusa. A káoszból rendszer lesz, ha nevet, számot, formát és helyet adsz neki.",
    "deep": "Archetípusa: az írnok — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: rend, szent geometria, életfeladat; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A Metatron lapjánál külön figyeld ezt: az írnok.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) Metatron?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  },
  "LXXVI": {
    "my": "A szeráfok kórusa az izzó, osztatlan jelenlét lapja. A tűz nem azért nagy, mert zajos, hanem mert teljesen ott van.",
    "deep": "Archetípusa: az izzó szeretet — nem egyszeri esemény, hanem ismétlődő belső mintázat. A kulcsok: lelkesedés, odaadás, jelenlét; ezek mutatják, hol kell finomítani a figyelmet. Az angyali kórus lapjai a fény rendezőelvei: védelem, üzenet, gyógyítás, megbocsátás, rend és odaadó jelenlét. A lap akkor dolgozik jól, ha nem végleges ítéletként olvasod, hanem iránytűként: mit kell tisztábban látnod, vállalnod vagy elengedned.",
    "body": "A fénylapok testi jele gyakran könnyebb légzés, vállból kioldódó súly vagy hirtelen belső nyugalom.",
    "practice": "Kérj tiszta jelet, majd a nap végén írd le, hol érkezett segítség emberi, belső vagy véletlen formában. A A Szeráfok Kórusa lapjánál külön figyeld ezt: az izzó szeretet.",
    "question": "Milyen segítséget nem kértem még, pedig már készen állna megérkezni? Mit mutat erről most a(z) A Szeráfok Kórusa?",
    "ritual": "Csendben kérj védelmet és tisztaságot. A végén köszönd meg előre azt a segítséget is, amelyet még nem látsz.",
    "tszPlus": "Kapcsolatban kérj segítséget a tiszta látáshoz: ne csak a másikat nézd, hanem a kettőtök között lévő teret is.",
    "tmuPlus": "Munkában a támogatás kérhető: mentor, szakértő, visszajelzés vagy rendteremtő dokumentáció formájában.",
    "tlePlus": "Lélekúton engedd, hogy a fény ne csak vigasztaljon, hanem rendszerezzen is: a segítség gyakran konkrét rendben érkezik."
  }
};
DECK.forEach(c=>{
  const d=DEEP[c.no];
  if(!d)return;
  if(d.tszPlus)c.tsz=(c.tsz?c.tsz+" ":"")+d.tszPlus;
  if(d.tmuPlus)c.tmu=(c.tmu?c.tmu+" ":"")+d.tmuPlus;
  if(d.tlePlus)c.tle=(c.tle?c.tle+" ":"")+d.tlePlus;
  Object.assign(c,d);
});



/* ==================== SPREADS ==================== */
const SPREADS = [
 {id:"napi",n:1,nm:"Napi Lap",sn:"1 lap",
  desc:"A nap üzenete. Reggel húzd, este térj vissza hozzá: mit mutatott meg a nap folyamán?",
  sit:"Gyors, napi iránytű · reggeli fókusz · egyetlen tiszta üzenet",
  pos:["A nap üzenete"]},
 {id:"awen",n:3,nm:"Az Awen Három Sugara",sn:"3 lap",
  desc:"Múlt, jelen, jövő — a három fénysugár, amely egy pontból ered és egy irányba mutat.",
  sit:"Folyamat átlátása · „honnan jövök, hol tartok, merre visz?”",
  pos:["A múlt gyökere","A jelen árama","A jövő csírája"]},
 {id:"sarkany",n:3,nm:"A Két Sárkány Vetése",sn:"3 lap",
  desc:"Merlin látomása: a torony azért omlik, mert alatta két sárkány küzd. Ez a vetés a felszín alá néz.",
  sit:"Döntés előtt · belső vagy külső konfliktus · ismétlődő elakadás",
  pos:["A Vörös Sárkány — az erő, amely benned épít","A Fehér Sárkány — az erő, amely ellened feszül","A torony alapja — a mélyebb igazság a küzdelem alatt"]},
 {id:"ust",n:5,nm:"Az Üst Vetése",sn:"5 lap",
  desc:"Ceridwen főzete: mi forr, mi táplálja a tüzet, mi akar átalakulni, mi a három csepp tanítása, és mi születhet újjá.",
  sit:"Nagy változás · átalakulás · új életszakasz küszöbén",
  pos:["Mi forr az üstben? — a helyzet nyers anyaga","Mi táplálja a tüzet? — erőforrás és szándék","Mi akar átalakulni? — a régi forma, amely már szűk","A három csepp — a tanítás, amely véletlenül is rád talál","Mi születhet újjá? — az új alak első jele"]},
 {id:"magdolna",n:7,nm:"Mária Magdolna Vetése",sn:"7 lap",
  desc:"A hűséges szív útja a kereszttől a hajnali kertig: seb, gyógyír, hűség, elengedés és újjászületés.",
  sit:"Szív-ügyek · kapcsolat, gyász, megbocsátás · a szeretet kérdései",
  pos:["A szíved most — ahol állsz","A régi seb — ami még fáj","A kenet — ami gyógyít","A hűség — ami megtart","Az elengedés — amit a szeretetben el kell engedned","A hajnali kert — ami újjászületik","Az örömhír — az üzenet, amit tovább kell vinned"]},
 {id:"arnyvetes",n:4,nm:"A Fekete Tükör Vetése",sn:"3+1 lap",dark:true,
  desc:"Árnytükör: három jelképes lap a nyomasztó mintákat, kötődésérzeteket és határvesztéseket tárja fel — eredetérzettel együtt —, a negyedik, a Fény Lapja, a rendezés útját mutatja.",
  sit:"Tisztulás · megfoghatatlan nyomás · „valami fogva tart” érzés",
  pos:["A felszíni árny — ami most látszik","A gyökér-árny — ami mélyről táplálja","A kötés — ami fogva tart","A Fény Lapja — az út a tisztuláshoz"]},
 {id:"papnok",n:9,nm:"A Kilenc Papnő Köre",sn:"9 lap",
  desc:"Teljes életkör kilenc állomással — nagyobb elmélkedéshez, fordulóponthoz, születésnapra, évkezdéshez.",
  sit:"Teljes életkép · születésnap, évkezdés, nagy fordulópont",
  pos:["Önmagad — ahol most állsz","Gyökerek — otthon és biztonság","A szív — kapcsolataid","Az alkotás — munka és hivatás","A test — egészség és erő","Az árnyék — a lecke, amit kerülsz","A segítők — akikre támaszkodhatsz","A közeljövő — ami már úton van","Avalon üzenete — a kör szintézise"]}
];

/* élethelyzetek → ajánlott vetés */
const SITUATIONS = [
 {t:"Gyors napi útmutatást keresek",d:"Egy tiszta üzenet a mai napra.",s:"napi"},
 {t:"Egy folyamatot szeretnék átlátni",d:"Honnan jövök, hol tartok, merre visz az út?",s:"awen"},
 {t:"Döntés előtt állok, belső harc dúl",d:"Két erő feszül egymásnak — bennem vagy körülöttem.",s:"sarkany"},
 {t:"Nagy változás közepén vagyok",d:"Átalakulás, új életszakasz, vagy épp elakadtam benne.",s:"ust"},
 {t:"A szívem ügye foglalkoztat",d:"Kapcsolat, gyász, megbocsátás, szeretet.",s:"magdolna"},
 {t:"Teljes életképet szeretnék",d:"Születésnap, évkezdés, nagy fordulópont.",s:"papnok"},
 {t:"Valami nyomaszt vagy fogva tart",d:"Árnyak és kötések feltárása — tisztulással.",s:"arnyvetes"},
 {t:"Nyomasztó mintát vagy nehéz energiát érzek",d:"Az Árnyék Tükre jelképesen rendező és tisztító gyakorlatot ad.",tool:"cleanse"},
 {t:"Mély programokat, kötéseket oldanék",d:"Ceridwen ingája: kutatás és feloldás.",tool:"pendulum"}
];

/* ==================== VALÓDI HU/EN FELÜLETI ADATRÉTEG ==================== */
const HOUSES_EN={
  ust:{name:"Mysteries of the Cauldron",desc:"Nine cards of Ceridwen and Gwion: the full arc of transformation, from the first stirring to rebirth."},
  istennok:{name:"Goddesses of Avalon",desc:"Five Welsh goddesses, five ancient feminine powers: wisdom, sovereignty, truth, fate and quiet strength."},
  tajak:{name:"Sacred Lands of Avalon",desc:"Nine places beyond the mist — each one an inner landscape where the soul sometimes pilgrimages."},
  osvenyek:{name:"Paths of Awen",desc:"Ten practical paths: inspiration, silence, release and homecoming woven into everyday life."},
  orzok:{name:"Mages and Guardians",desc:"Twelve great figures from Camelot, Avalon and mythic memory: Merlin, Arthur, dragons, Nimrod, Mary Magdalene and Michael."},
  kristaly:{name:"Crystal Force",desc:"Twelve stones, twelve qualities — teachers from the deep earth, from clear quartz to selenite."},
  hold:{name:"Moon and Stars",desc:"Ten lights of the sky: moon phases, guiding stars and the gates of great turning."},
  angyal:{name:"Angelic Choir",desc:"Nine messengers of light: from the guardian angel through the archangels to the burning circle of the seraphim."}
};
const SPREAD_EN={
  napi:{nm:"Daily Card",sn:"1 card",desc:"The day’s message. Draw in the morning and return at night: what did the day reveal?",sit:"Quick daily compass · morning focus · one clear message",pos:["The message of the day"]},
  awen:{nm:"The Three Rays of Awen",sn:"3 cards",desc:"Past, present and future — three rays of light rising from one point and pointing toward one direction.",sit:"Seeing a process clearly · where I come from, where I stand, where the path leads",pos:["Root of the past","Current of the present","Seed of the future"]},
  sarkany:{nm:"The Two Dragons Spread",sn:"3 cards",desc:"Merlin’s vision: the tower falls because two dragons struggle beneath it. This spread looks below the surface.",sit:"Before a decision · inner or outer conflict · recurring blockage",pos:["The Red Dragon — the force building within you","The White Dragon — the force pressing against you","The foundation of the tower — the deeper truth beneath the struggle"]},
  ust:{nm:"The Cauldron Spread",sn:"5 cards",desc:"Ceridwen’s brew: what is boiling, what feeds the fire, what seeks transformation, what the three drops teach, and what may be reborn.",sit:"Great change · transformation · at the threshold of a new life stage",pos:["What boils in the cauldron?","What feeds the fire?","What seeks transformation?","The three drops — the teaching that finds you","What may be reborn?"]},
  magdolna:{nm:"Mary Magdalene Spread",sn:"7 cards",desc:"The way of the faithful heart from the cross to the morning garden: wound, balm, devotion, release and rebirth.",sit:"Matters of the heart · relationship, grief, forgiveness · questions of love",pos:["Your heart now","The old wound","The balm","The devotion that holds","The release love asks for","The morning garden","The good news you must carry"]},
  arnyvetes:{nm:"The Black Mirror Spread",sn:"3+1 cards",desc:"A symbolic shadow mirror: three cards reveal oppressive patterns, felt bindings and loss of boundary; the fourth, the Card of Light, shows the way of ordering.",sit:"Cleansing · ungraspable pressure · the feeling that something holds you",pos:["Surface shadow","Root shadow","The binding","The Card of Light — the way toward cleansing"]},
  papnok:{nm:"The Circle of Nine Priestesses",sn:"9 cards",desc:"A full life-circle in nine stations — for deeper reflection, birthdays, year openings and great turning points.",sit:"Whole-life view · birthday, year opening, major turning point",pos:["Yourself — where you stand","Roots — home and safety","The heart — relationships","Creation — work and calling","The body — health and strength","The shadow — the lesson avoided","The helpers — those you can lean on","Near future — what is already on its way","Avalon’s message — synthesis of the circle"]}
};
const SITUATION_EN=[
 {t:"I seek quick guidance for the day",d:"One clear message for today."},
 {t:"I wish to see a process clearly",d:"Where do I come from, where do I stand, where does the path lead?"},
 {t:"I stand before a decision; an inner battle is moving",d:"Two forces press against each other — within me or around me."},
 {t:"I am in the midst of great change",d:"Transformation, a new life stage, or a place where I feel stuck."},
 {t:"My heart is calling for attention",d:"Relationship, grief, forgiveness, love."},
 {t:"I seek a whole-life view",d:"Birthday, new year, major turning point."},
 {t:"Something weighs on me or seems to hold me",d:"Shadows and bindings revealed — with cleansing."},
 {t:"I feel a heavy pattern or difficult energy",d:"The Shadow Mirror offers symbolic ordering and cleansing practice."},
 {t:"I wish to release deep programs or bindings",d:"Ceridwen’s pendulum: inquiry and release."}
];
const EN_CARD={
"I":{n:"The Cauldron",s:"What ripens within you",k:["beginning","depth","ripening"]},"II":{n:"The Three Drops",s:"The unexpected gift of grace",k:["inspiration","grace","turning"]},"III":{n:"The Hare",s:"The first movement of instinct",k:["instinct","speed","self-protection"]},"IV":{n:"The Hound",s:"What follows your track",k:["consequence","facing","teacher"]},"V":{n:"The Salmon",s:"Against the current, toward the source",k:["perseverance","depth","fidelity"]},"VI":{n:"The Otter",s:"The depths also know you",k:["emotion","flexibility","play"]},"VII":{n:"The Wren",s:"The freedom of smallness",k:["perspective","lightness","spirit"]},"VIII":{n:"The Falcon",s:"The hour of sharp sight",k:["focus","truth","fate"]},"IX":{n:"The Grain of Wheat",s:"Death that becomes conception",k:["surrender","rebirth","Taliesin"]},
"X":{n:"Ceridwen",s:"Keeper of the Cauldron",k:["transformation","wisdom","dark mother"]},"XI":{n:"Rhiannon",s:"Queen of Horses",k:["dignity","sovereignty","your own pace"]},"XII":{n:"Blodeuwedd",s:"Flower-Faced One",k:["authenticity","choice","liberation"]},"XIII":{n:"Arianrhod",s:"The Silver Wheel",k:["fate","time","ordeals"]},"XIV":{n:"Branwen",s:"The White Raven",k:["quiet strength","message","compassion"]},
"XV":{n:"The Veil of Mist",s:"The threshold that asks for faith",k:["threshold","faith","passage"]},"XVI":{n:"The Apple Orchard",s:"The sweetness of the island",k:["abundance","reward","healing"]},"XVII":{n:"The Sacred Lake",s:"The mirror that does not lie",k:["mirror","subconscious","silence"]},"XVIII":{n:"The Tor",s:"The spiral path of the sacred hill",k:["overview","pilgrimage","ascent"]},"XIX":{n:"The Red Spring",s:"The iron water of life",k:["life-force","passion","feminine power"]},"XX":{n:"The White Spring",s:"Crystal water of the ancestors",k:["purity","ancestors","foundation"]},"XXI":{n:"The Fire of the Priestesses",s:"The circle of the nine",k:["community","service","initiation"]},"XXII":{n:"The Black Barge",s:"The worthy crossing",k:["closure","grief","escort"]},"XXIII":{n:"The Star of the Apple",s:"Magic hidden in the everyday",k:["hidden order","wonder","attention"]},
"XXIV":{n:"Path of Silence",s:"The silence that speaks",k:["silence","inward attention","pause"]},"XXV":{n:"Path of Inspiration",s:"The current of Awen",k:["creation","inspiration","flow"]},"XXVI":{n:"Path of Transformation",s:"You are allowed to change shape",k:["flexibility","shapeshifting","growth"]},"XXVII":{n:"Path of Release",s:"The courage of the empty hand",k:["release","trust","space"]},"XXVIII":{n:"Path of Healing",s:"The balance of the two springs",k:["self-care","regeneration","patience"]},"XXIX":{n:"Path of Remembering",s:"The ancestors behind your back",k:["roots","ancestors","old knowledge"]},"XXX":{n:"Path of Courage",s:"The power of the spoken word",k:["standing up","honesty","action"]},"XXXI":{n:"Path of Alliance",s:"The teaching of the round table",k:["relationship","equality","loyalty"]},"XXXII":{n:"Path of the Threshold",s:"Neither outside nor within",k:["transition","decision","liminal time"]},"XXXIII":{n:"Path of Homecoming",s:"Avalon is within you",k:["arrival","self-acceptance","wholeness"]},
"XXXIV":{n:"Merlin",s:"The Seer",k:["sight","counsel","timeless knowing"]},"XXXV":{n:"King Arthur",s:"The True King",k:["calling","responsibility","unity"]},"XXXVI":{n:"The Lady of the Lake",s:"The gift of the deep",k:["initiation","gift","stewardship"]},"XXXVII":{n:"Morgana",s:"Lady of Shadow",k:["shadow work","healing","misunderstood power"]},"XXXVIII":{n:"Taliesin",s:"The Radiant Brow",k:["talent","power of word","unfolding"]},"XXXIX":{n:"The Red Dragon",s:"The inner fire",k:["life-force","root power","endurance"]},"XL":{n:"The White Dragon",s:"The opposing force",k:["challenge","trial","old order"]},"XLI":{n:"Nimrod, the Ancient Hunter",s:"The bow of the forefather",k:["inheritance","aim","generational arc"]},"XLII":{n:"The Miraculous Stag",s:"The call",k:["calling","guidance","new homeland"]},"XLIII":{n:"Mary Magdalene",s:"Keeper of the Chalice",k:["faithful love","presence","witness"]},"XLIV":{n:"Archangel Michael",s:"The Sword of Light",k:["protection","truth","boundary"]},"XLV":{n:"The Holy Grail",s:"The chalice of wholeness",k:["wholeness","meaning of the quest","service"]},
"XLVI":{n:"Clear Quartz",s:"Master of clarity",k:["clarity","focus","amplification"]},"XLVII":{n:"Amethyst",s:"The calmer of the soul",k:["peace","transmutation","protection"]},"XLVIII":{n:"Rose Quartz",s:"Healer of the heart",k:["self-love","gentleness","forgiveness"]},"XLIX":{n:"Citrine",s:"Stone of sunlight",k:["abundance","joy","confidence"]},"L":{n:"Moonstone",s:"The inner tide",k:["intuition","cycles","feminine wisdom"]},"LI":{n:"Black Tourmaline",s:"The guardian stone",k:["protection","grounding","boundaries"]},"LII":{n:"Labradorite",s:"Stone of inner light",k:["hidden gifts","magic","self-protection"]},"LIII":{n:"Amber",s:"Drop of ancient light",k:["life-force","warmth","ancient healing"]},"LIV":{n:"Tiger's Eye",s:"The courageous gaze",k:["courage","practicality","alertness"]},"LV":{n:"Aquamarine",s:"Stone of clear speech",k:["communication","clarity","flow"]},"LVI":{n:"Garnet",s:"Fire of the blood",k:["passion","endurance","life-force"]},"LVII":{n:"Selenite",s:"Wand of light",k:["cleansing","light connection","peace"]},
"LVIII":{n:"New Moon",s:"The dark beginning",k:["beginning","seed","intention"]},"LIX":{n:"Waxing Moon",s:"The arc of building",k:["growth","momentum","nourishment"]},"LX":{n:"Full Moon",s:"The light of fulfillment",k:["culmination","visibility","harvest"]},"LXI":{n:"Waning Moon",s:"The arc of release",k:["release","cleansing","withdrawal"]},"LXII":{n:"Black Moon",s:"Gate of the deep",k:["shadow","secret","primal power"]},"LXIII":{n:"Evening Star",s:"The light of Venus",k:["love","beauty","attraction"]},"LXIV":{n:"The North Star",s:"The constant point",k:["direction","fidelity","guiding principle"]},"LXV":{n:"The Falling Star",s:"A moment of grace",k:["wish","moment","unexpected gift"]},"LXVI":{n:"The Milky Way",s:"The river of souls",k:["belonging","infinity","perspective"]},"LXVII":{n:"The Lunar Eclipse",s:"The great crossing",k:["turning","fate-gate","acceleration"]},
"LXVIII":{n:"The Guardian Angel",s:"The quiet companion",k:["protection","presence","trust"]},"LXIX":{n:"Gabriel",s:"The messenger",k:["message","clear sight","new life"]},"LXX":{n:"Raphael",s:"The healer",k:["healing","traveling companion","health"]},"LXXI":{n:"Uriel",s:"Flame of wisdom",k:["insight","solution","truth"]},"LXXII":{n:"Chamuel",s:"The loving eye",k:["love","finding","reconciliation"]},"LXXIII":{n:"Jophiel",s:"Angel of beauty",k:["beauty","cleansing thought","brightness"]},"LXXIV":{n:"Zadkiel",s:"Flame of forgiveness",k:["forgiveness","release","violet flame"]},"LXXV":{n:"Metatron",s:"The scribe",k:["order","sacred geometry","life task"]},"LXXVI":{n:"Choir of Seraphim",s:"The burning love",k:["ardor","devotion","presence"]}
};
function cerLang(){return window.CERIDWEN_LANG||SafeStorage.get(LOCAL_STORE,'ceridwenLang','hu')||'hu'}
function cerEn(){return cerLang()==='en'}
function houseName(id){return cerEn()&&HOUSES_EN[id]?HOUSES_EN[id].name:HOUSES[id].name}
function houseDesc(id){return cerEn()&&HOUSES_EN[id]?HOUSES_EN[id].desc:HOUSES[id].desc}
function spreadData(s){return cerEn()&&SPREAD_EN[s.id]?Object.assign({},s,SPREAD_EN[s.id]):s}
function spreadPos(i){const sd=spreadData(currentSpread);return sd.pos[i]||currentSpread.pos[i]||`${i+1}. ${cerEn()?'place':'hely'}`}
function sitTitle(s,i){return cerEn()&&SITUATION_EN[i]?SITUATION_EN[i].t:s.t}
function sitDesc(s,i){return cerEn()&&SITUATION_EN[i]?SITUATION_EN[i].d:s.d}
function cardName(c){return cerEn()&&EN_CARD[c.no]?EN_CARD[c.no].n:c.nm}
function cardSubtitle(c){return cerEn()&&EN_CARD[c.no]?EN_CARD[c.no].s:c.st}
function cardKeys(c){return cerEn()&&EN_CARD[c.no]?EN_CARD[c.no].k:c.k}
function englishCardVoice(c){
  const e=EN_CARD[c.no]||{};
  const name=e.n||c.nm;
  const keys=((e.k||c.k)||[]).filter(Boolean);
  const k1=keys[0]||"clarity", k2=keys[1]||"discernment", k3=keys[2]||"responsibility";
  const house={
    ust:{core:`${name} rises from Ceridwen’s cauldron as a sign of ripening change. Its centre is ${k1}: what is unfinished is asking to be transformed rather than hurried.`,light:`In its clear expression, ${name} helps you remain with the heat long enough for ${k1} to become wisdom, while ${k2} gives the process form.`,shadow:`In shadow, the process may become forced, delayed or over-controlled. Notice where fear of change has turned ${k1} into tension or avoidance.`,deep:`This card belongs to the cauldron tradition: knowledge is not decoration but a force that changes the one who receives it. ${k1}, ${k2} and ${k3} become meaningful only when they alter the way you live.`,practice:`Name one thing that is still “cooking” within you. Give it one protected period of silence, then take one grounded action within twenty-four hours.`,question:`What is ready to change in me, and what must be allowed to ripen before I act?`,affirm:`I allow transformation to ripen in its true time.`},
    istennok:{core:`${name} reveals a feminine power of ${k1}, held with ${k2} and expressed through ${k3}. Read the card as a mirror of dignity, boundary and inner authority.`,light:`In the light, ${name} restores self-possession. You can receive, choose and refuse without abandoning tenderness.`,shadow:`In shadow, care may become self-erasure, sovereignty may harden into control, or intuition may be confused with fear.`,deep:`The teaching is not about imitating a goddess, but about recognising the quality she carries and restoring it within your own life.`,practice:`Choose one boundary or promise that protects what matters. Express it clearly and without aggression.`,question:`Where am I being asked to stand in my own dignity without closing my heart?`,affirm:`I honour my inner authority with clarity and grace.`},
    tajak:{core:`${name} is an inner landscape. It points to the place in you where ${k1} meets ${k2}, and where ${k3} may become visible.`,light:`In the light, this landscape gives orientation. You do not need every answer; you need the next true direction.`,shadow:`In shadow, the landscape may become escape, nostalgia or idealisation. Return from the image to the life it is asking you to inhabit.`,deep:`Avalonian places are best read as symbolic terrains rather than historical claims: water, mist, island, garden and threshold describe states of attention.`,practice:`Close your eyes for three breaths and imagine this place. Notice one object, colour or direction, then translate it into one practical action.`,question:`What inner place is calling me, and what does it ask me to do in ordinary life?`,affirm:`I recognise the landscape within and walk its next honest path.`},
    osvenyek:{core:`${name} is a path of Awen: ${k1} becomes real through ${k2}, and ${k3} gives it direction.`,light:`In the light, inspiration becomes practice. The path grows clearer because you walk it, not because you understand everything in advance.`,shadow:`In shadow, inspiration may remain fantasy, performance or endless preparation. The remedy is one small completed act.`,deep:`Awen is not merely an idea of inspiration; it is the movement from inner stirring to word, craft, memory and relationship.`,practice:`Complete one small action today that gives visible form to the insight of this card.`,question:`What wants to move from inspiration into practice now?`,affirm:`I let inspiration become a living path.`},
    orzok:{core:`${name} speaks through the language of guardianship, vow and discernment. Its task is to bring ${k1} into alignment with ${k2} and ${k3}.`,light:`In the light, the guardian protects what is essential without creating unnecessary conflict.`,shadow:`In shadow, protection may become rigidity, suspicion or withdrawal. Ask whether the boundary still serves life.`,deep:`The guardian archetype is not about domination. It is the discipline of protecting truth, relationship and responsibility.`,practice:`Choose one promise you can keep within the next day, and keep it completely.`,question:`What deserves my protection, and what defensive habit can now be released?`,affirm:`I protect what matters without hardening my heart.`},
    kristaly:{core:`${name} grounds ${k1} through the body, the senses and the material world. ${k2} and ${k3} become trustworthy when they can be lived.`,light:`In the light, the card supports steadiness, simplicity and embodied presence.`,shadow:`In shadow, grounding may become heaviness, possession or resistance to change.`,deep:`The crystal layer is symbolic rather than medical: it asks how attention, rhythm, touch and order can help the nervous system settle.`,practice:`Drink water, place both feet on the ground, and organise one physical object or space.`,question:`What would become clearer if I returned fully to my body and immediate surroundings?`,affirm:`I return to the body, the earth and the present moment.`},
    hold:{core:`${name} places ${k1} within a cycle. ${k2} shows what is changing, while ${k3} asks you to respect timing.`,light:`In the light, you cooperate with the phase instead of demanding the same kind of action every day.`,shadow:`In shadow, you may rush what is still forming or cling to what is already complete.`,deep:`The lunar layer is an observational and symbolic rhythm, not a causal claim. It helps distinguish beginnings, growth, fullness, release and rest.`,practice:`Identify whether this moment asks you to begin, build, reveal, release or rest. Act accordingly.`,question:`What phase am I truly in, and what action belongs to this phase?`,affirm:`I honour the rhythm of becoming and release.`},
    angyal:{core:`${name} gathers ${k1}, ${k2} and ${k3} into a concise message of protection and ethical direction.`,light:`In the light, the message is simple, compassionate and actionable.`,shadow:`In shadow, reassurance may become avoidance or dependence on signs. Return the choice to your own responsibility.`,deep:`The angelic layer functions here as symbolic language for conscience, protection and benevolent orientation, not as proof of supernatural intervention.`,practice:`Write one sentence of guidance, one sentence of protection and one action you will take.`,question:`What is the kindest truthful action available to me now?`,affirm:`I choose the clear and compassionate path.`}
  };
  return house[c.h]||{core:`${name} offers a mirror for ${k1}, ${k2} and ${k3}.`,light:`In the light, these qualities can move with clarity and proportion.`,shadow:`In shadow, they may become narrowed, exaggerated or turned against themselves.`,deep:`Read the card as an invitation to conscious choice rather than a fixed prediction.`,practice:`Choose one grounded action that expresses the clearest aspect of this card.`,question:`What is this card asking me to see and practise now?`,affirm:`I meet this teaching with clarity and responsibility.`};
}
function cardCore(c){if(!cerEn())return c.u;return englishCardVoice(c).core}
function cardLight(c){if(!cerEn())return c.f;return englishCardVoice(c).light}
function cardShadow(c){if(!cerEn())return c.a;return englishCardVoice(c).shadow}
function cardDeep(c){if(!cerEn())return c.deep||c.my||c.me||'';return englishCardVoice(c).deep}
function cardPractice(c){if(!cerEn())return c.practice||'';return englishCardVoice(c).practice}
function cardQuestion(c){if(!cerEn())return c.question||'';return englishCardVoice(c).question}
function cardAffirm(c){if(!cerEn())return c.m;return englishCardVoice(c).affirm}


/* ==================== STATE ==================== */
let currentSpread = SPREADS[1];
let drawn = [];
let journal = [];
/* --- napló tartós tárolása (localStorage, biztonságos visszaeséssel) --- */
const JKEY="ceridwen_druida_üst_naplo_v2";
const JKEY_LEGACY="ceridwen_druida_üst_naplo_v1";
let journalPersistOK=false;
function normaliseJournalPayload(payload){
  if(Array.isArray(payload)) return {schemaVersion:1,entries:payload};
  if(payload&&Array.isArray(payload.entries)) return {schemaVersion:Number(payload.schemaVersion)||1,entries:payload.entries};
  return {schemaVersion:CERIDWEN_STORAGE_VERSION,entries:[]};
}
(function initJournalStorage(){
  const probe="__cjb_probe__";
  journalPersistOK=SafeStorage.set(LOCAL_STORE,probe,"1")&&SafeStorage.remove(LOCAL_STORE,probe);
  if(!journalPersistOK){reportWarning("journal","A helyi napló ezen a böngészőn nem érhető el.");return;}
  const current=SafeStorage.jsonGet(LOCAL_STORE,JKEY,null);
  const legacy=current===null?SafeStorage.jsonGet(LOCAL_STORE,JKEY_LEGACY,null):null;
  const data=normaliseJournalPayload(current??legacy);
  journal=data.entries.filter(x=>x&&typeof x==="object").slice(0,CERIDWEN_JOURNAL_LIMIT);
  if(legacy!==null||data.schemaVersion!==CERIDWEN_STORAGE_VERSION) journalPersist();
})();
function journalPersist(){
  if(!journalPersistOK)return false;
  journal=journal.slice(0,CERIDWEN_JOURNAL_LIMIT);
  return SafeStorage.jsonSet(LOCAL_STORE,JKEY,{schemaVersion:CERIDWEN_STORAGE_VERSION,appVersion:CERIDWEN_APP_VERSION,deckVersion:CERIDWEN_DECK_VERSION,entries:journal});
}
let lexHouse = "all";
let chosenSit = null;

/* ==================== HELPERS ==================== */
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const lit = t => String(t||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cleanQuestion(raw){
  const q=(raw||"").trim();
  if(!q)return {original:q,suggestion:"Mit érdemes most tisztábban látnom önmagamban és a következő lépésemben?",changed:true,reason:"Üres kérdés helyett az üst egy nyitott, felelősségteljes fókuszt ajánl."};
  let suggestion=q;
  let reason="A kérdés alapvetően használható: nyitott, önmagadra is visszavezeti a figyelmet.";
  const lower=q.toLowerCase();
  if(/^(visszajön|szeret|akar|fog|lesz|sikerül|megcsal|elhagy|felvesz|nyerek|kapok|összejön|megkeres|ír|hív)\b|\?$/.test(lower) && !/mit|hogyan|mire|miben|miért|merre/.test(lower)){
    suggestion="Mit érdemes megértenem ebből a helyzetből, és mi az a tiszta lépés, amit felelősen megtehetek?";
    reason="Az eldöntendő kérdést Ceridwen önismereti kérdéssé alakította.";
  }
  if(/mikor|hány nap|dátum|időpont|év|hónap/.test(lower)){
    suggestion="Milyen belső és külső feltételeknek kell összeérniük ahhoz, hogy ez a folyamat meg tudjon érkezni?";
    reason="A dátumkérdés helyett a folyamat feltételeire kérdezünk rá.";
  }
  if(/mit gondol|mit érez|miért nem|ő akar|ő szeret|rólam|velem kapcsolatban/.test(lower)){
    suggestion="Mit mutat nekem ez a kapcsolat önmagamról, a határaimról és a következő méltó lépésről?";
    reason="Más ember belső világának fürkészése helyett a saját felelősségi körödre térünk vissza.";
  }
  if(/rontás|átok|sötét|kötés|negatív energia|valaki árt/.test(lower)){
    suggestion="Milyen nyomásként vagy ismétlődő mintaként érzékelem ezt a helyzetet, és hogyan tudok tisztábban határt húzni?";
    reason="A félelemkeltő megfogalmazásból jelképes, határhúzó önvizsgálat lett.";
  }
  return {original:q,suggestion,changed:suggestion!==q,reason};
}
function applyQuestionRefiner(box){
  const target=document.getElementById(box.dataset.target||"");
  const out=box.querySelector(".question-refiner__out");
  if(!target||!out)return;
  const r=cleanQuestion(target.value);
  target.value=r.suggestion;
  out.classList.add("on");
  out.innerHTML=`<strong>${cerEn()?"Refined question:":"Finomított kérdés:"}</strong> ${lit(r.suggestion)}<br><span style="color:var(--mist)">${lit(r.reason)}</span>`;
}
function bindQuestionRefiners(){
  document.querySelectorAll(".question-refiner").forEach(box=>{
    if(box.dataset.bound)return;box.dataset.bound="1";
    box.querySelector(".qref-btn")?.addEventListener("click",()=>applyQuestionRefiner(box));
  });
}
function getCleanQuestion(sel){
  const el=document.querySelector(sel);if(!el)return "";
  const r=cleanQuestion(el.value);el.value=r.suggestion;return r.suggestion.trim();
}
function deckTone(card){
  const map={
    ust:{title:"Üst-hang",text:"Beavató, lassú és érlelő: ne gyors választ keress, hanem azt, milyen nyers anyagból készül benned az új forma."},
    istennok:{title:"Istennői réteg",text:"Befogadó erő, méltóság és határ: figyeld, mit kell gyengéden megtartanod, és mit kell tisztán visszaadnod."},
    tajak:{title:"Avaloni táj",text:"Belső helyszínként olvasd: hová hív a lelked — vízhez, kertbe, forráshoz, bárkához vagy küszöbre?"},
    osvenyek:{title:"Awen-ösvény",text:"A lap nem elméletet kér, hanem egy kicsi járható lépést: az ihlet akkor igaz, ha mozdulattá válik."},
    orzok:{title:"Őrzői / Camelot-réteg",text:"Döntési fegyelem és fogadalom: mi az az egy lovagi lépés, amelyet 24 órán belül megteszel?"},
    kristaly:{title:"Kristályréteg",text:"Földelj és egyszerűsíts: kéz a mellkason, talpak a földön, egy pohár víz, egy rendezett tárgy. A test stabilitása hozza a választ."},
    hold:{title:"Holdréteg",text:"Ciklikusan olvasd: nem minden most születik. Van, ami nő, van, ami telik, van, ami fogy, és van, ami csendben készül."},
    angyal:{title:"Angyali réteg",text:"Röviden, tisztán: egy mondat üzenet, egy mondat védelem, egy mondat cselekvés. A túl sok szó elveheti a fényt."}
  };
  return map[card.h]||{title:"Paklihang",text:"Olvasd a lapot a saját házának ritmusában."};
}
function currentMoonLens(card){
  const st=window.CERIDWEN_MOON||null;
  const phase=st?st.phase:"mai hold";
  const map=cerEn()?{
    "Újhold":"Ceridwen's cauldron reads this card as a seed: keep one intention silent and let it ripen.",
    "Növő sarló":"Brighid's first flame reads this card as a first step: choose one small act and protect it.",
    "Első negyed":"Merlin reads this card as a decision point: cut away the branch that scatters your strength.",
    "Növő domború hold":"Lugh's craft reads this card as refinement: correct, shape and ask for honest feedback.",
    "Telihold":"The Lady of the Lake reads this card in full reflection: name what has ripened, but do not overreact.",
    "Fogyó domború hold":"Awen reads this card as teaching: turn what you learned into ordered speech or a generous act.",
    "Utolsó negyed":"Morgana reads this card as release: notice what once protected you but now binds you.",
    "Fogyó sarló":"Avalon's mist reads this card as retreat: rest, cleanse and prepare space for the next seed."
  }:{
    "Újhold":"Ceridwen üstje magként olvassa ezt a lapot: egyetlen szándékot őrizz csendben, és hagyd érni.",
    "Növő sarló":"Brighid első lángja első lépésként olvassa ezt a lapot: válassz egy apró tettet, és védd meg.",
    "Első negyed":"Merlin döntési pontként olvassa ezt a lapot: vágd le azt az ágat, amely szétszórja az erődet.",
    "Növő domború hold":"Lugh mestersége finomításként olvassa ezt a lapot: javíts, formálj, kérj őszinte visszajelzést.",
    "Telihold":"A Tó Hölgye teljes tükörben olvassa ezt a lapot: nevezd meg, ami beérett, de ne reagáld túl.",
    "Fogyó domború hold":"Az Awen tanításként olvassa ezt a lapot: alakítsd a felismerést rendezett szóvá vagy nagylelkű tetté.",
    "Utolsó negyed":"Morgana elengedésként olvassa ezt a lapot: figyeld meg, mi védett régen, de köt ma.",
    "Fogyó sarló":"Avalon köde visszavonulásként olvassa ezt a lapot: pihenj, tisztíts, készíts helyet a következő magnak."
  };
  return {phase:cerEn()?({"Újhold":"New Moon","Növő sarló":"Waxing Crescent","Első negyed":"First Quarter","Növő domború hold":"Waxing Gibbous","Telihold":"Full Moon","Fogyó domború hold":"Waning Gibbous","Utolsó negyed":"Last Quarter","Fogyó sarló":"Waning Crescent"}[phase]||phase):phase,text:map[phase]||(cerEn()?"read the card in the rhythm of today's Moon.":"a lapot a mai hold ritmusához igazítva olvasd.")};
}
function integrationText(){
  const a=(document.getElementById("intUnderstand")?.value||"").trim();
  const b=(document.getElementById("intRelease")?.value||"").trim();
  const c=(document.getElementById("intAction")?.value||"").trim();
  return [a&&`Megértés: ${a}`,b&&`Elengedés: ${b}`,c&&`24 órás lépés: ${c}`].filter(Boolean).join("\n");
}
bindQuestionRefiners();
function cardSVG(card){
  const col = HOUSES[card.h].color;
  return (card.g && GLYPHS[card.g]) ? GLYPHS[card.g](col) : EMBLEMS[card.h](col);
}
function backSVG(){
  return `<svg viewBox="0 0 120 160" aria-hidden="true" role="presentation">
    <defs>
      <radialGradient id="cardBackGlow" cx="50%" cy="45%" r="58%">
        <stop offset="0%" stop-color="rgba(201,168,106,.30)"/>
        <stop offset="52%" stop-color="rgba(201,168,106,.10)"/>
        <stop offset="100%" stop-color="rgba(201,168,106,0)"/>
      </radialGradient>
      <linearGradient id="cardBackGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d9bf82"/>
        <stop offset="100%" stop-color="#b99245"/>
      </linearGradient>
      <linearGradient id="cardBackBase" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#294758"/>
        <stop offset="100%" stop-color="#142834"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="80" r="50" fill="url(#cardBackGlow)"/>
    <circle cx="60" cy="80" r="54" stroke="rgba(201,168,106,.28)" stroke-width="1.2" fill="none"/>
    <circle cx="60" cy="80" r="45" stroke="rgba(201,168,106,.18)" stroke-width="1" fill="none"/>
    <g transform="translate(60 83)">
      <ellipse cx="0" cy="18" rx="20" ry="6" fill="rgba(5,10,14,.28)"/>
      <path d="M-28 14 Q-26 1 -16 -4 L16 -4 Q26 1 28 14 L26 19 Q18 27 0 27 Q-18 27 -26 19 Z" fill="url(#cardBackBase)" stroke="url(#cardBackGold)" stroke-width="2.1"/>
      <ellipse cx="0" cy="0" rx="18" ry="5.7" fill="#233f50" stroke="url(#cardBackGold)" stroke-width="2"/>
      <ellipse cx="0" cy="-1" rx="13" ry="3.7" fill="rgba(232,240,242,.18)"/>
      <path d="M-16 8 Q-12 5 -9 6" stroke="rgba(201,168,106,.55)" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      <path d="M9 6 Q12 5 16 8" stroke="rgba(201,168,106,.55)" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      <g fill="#d9bf82" opacity=".95">
        <circle cx="-10" cy="-11" r="2.3"/>
        <circle cx="-3" cy="-15" r="1.8"/>
        <circle cx="6" cy="-13" r="2"/>
        <circle cx="12" cy="-8" r="1.7"/>
      </g>
      <g stroke="#d9bf82" stroke-linecap="round" fill="none" opacity=".86">
        <path d="M-11 -23 C-16 -30 -16 -39 -10 -44" stroke-width="1.8"/>
        <path d="M0 -27 C-3 -35 -2 -44 2 -49" stroke-width="1.8"/>
        <path d="M12 -23 C17 -31 17 -39 11 -45" stroke-width="1.8"/>
      </g>
      <g fill="#d9bf82" opacity=".78">
        <circle cx="-13" cy="-32" r="1.4"/>
        <circle cx="1" cy="-39" r="1.2"/>
        <circle cx="14" cy="-31" r="1.3"/>
      </g>
    </g>
  </svg>`;
}

/* A háttérpontokat az initAmbientDots() reszponzívan kezeli. */

/* ==================== PAKLIGYŰJTEMÉNY ==================== */
const PAKLIK={
 avalon:{n:"Avalon Orákulum",en:"Avalon Oracle",d:"A rendszer klasszikus, 45 lapos magja öt házban vezet az Üsttől a Grálig.",de:"The classic 45-card system in five houses — from the Cauldron to the Grail.",hs:["ust","istennok","tajak","osvenyek","orzok"]},
 kristaly:{n:"Kristályerő",en:"Crystal Power",d:"Tizenkét kő, tizenkét minőség — a föld mélyének tanítói.",de:"Twelve stones and twelve qualities — teachers from the depth of the Earth.",hs:["kristaly"]},
 hold:{n:"Hold és Csillagok",en:"Moon and Stars",d:"Az égi ritmusok tíz fénye: holdfázisok és vezércsillagok.",de:"Ten lights of celestial rhythm: lunar phases and guiding stars.",hs:["hold"]},
 angyal:{n:"Angyali Kórus",en:"Angelic Choir",d:"Kilenc fényküldött üzenete és napi gyakorlata.",de:"Messages and daily practices from nine messengers of light.",hs:["angyal"]},
 mind:{n:"Teljes Gyűjtemény",en:"Complete Collection",d:"Mind a 76 lap egyetlen nagy pakliban — a négy világ együtt.",de:"All 76 cards in one complete deck — the four worlds together.",hs:null}
};
let currentPakli="avalon";
function deckPool(){const p=PAKLIK[currentPakli];return DECK.filter(c=>!p.hs||p.hs.includes(c.h));}
function renderPakli(){
  const row=document.querySelector("#pakliRow");
  const desc=document.querySelector("#pakliDesc");
  if(!row||!desc){reportWarning("renderPakli","A pakliválasztó célpontja hiányzik.");return;}
  row.innerHTML=Object.entries(PAKLIK).map(([id,p])=>
    `<button type="button" class="chip ${id===currentPakli?'on':''}" data-pk="${id}" ${!window.ritualDone?'disabled aria-disabled="true"':'aria-disabled="false"'}>${cerEn()?p.en:p.n} · ${(!p.hs?76:DECK.filter(c=>p.hs.includes(c.h)).length)} ${cerEn()?"cards":"lap"}</button>`).join("");
  desc.textContent=cerEn()?PAKLIK[currentPakli].de:PAKLIK[currentPakli].d;
  document.querySelectorAll("#pakliRow .chip").forEach(b=>b.addEventListener("click",()=>{
    if(!window.ritualDone){
      const note=$("#cauldronNote");
      if(note) note.textContent="Előbb hangolódás szükséges — a paklik csak tisztítás után nyílnak meg.";
      return;
    }
    currentPakli=b.dataset.pk;renderPakli();resetTable();
    showInlineGuide("pakliNextGuide","A pakli kiválasztva. Most válassz vetést lejjebb.");
    guideNext("#spreadPicker","Következő lépés lent: válassz vetést ↓");
  }));
  selectionLockSync();
}

/* ==================== NAV ==================== */
function hideFlowNudge(){
  const n=document.getElementById("flowNudge");
  if(n)n.classList.remove("on");
}
function guideNext(targetSelector,text){
  const n=document.getElementById("flowNudge");
  if(!n)return;
  const label=n.querySelector(".flow-nudge__text");
  if(label)label.textContent=text||"A következő lépés lent vár.";
  n.dataset.target=targetSelector||"";
  n.classList.add("on");
}
document.getElementById("flowNudge")?.querySelector("button")?.addEventListener("click",()=>{
  const n=document.getElementById("flowNudge");
  const target=n?.dataset.target?document.querySelector(n.dataset.target):null;
  if(target)target.scrollIntoView({behavior:"smooth",block:"center"});
  hideFlowNudge();
});
function showInlineGuide(id,text){
  const el=document.getElementById(id);if(!el)return;
  const s=el.querySelector("span:last-child");if(s&&text)s.textContent=text;
  el.classList.add("on");
}
function hideInlineGuide(id){const el=document.getElementById(id);if(el)el.classList.remove("on");}

function goView(v){
  document.body.classList.remove("menu-open");
  const mt=document.getElementById("menuToggle"); if(mt)mt.setAttribute("aria-expanded","false");
  document.querySelectorAll("nav.tabs button").forEach(x=>{
    const on=x.dataset.v===v;
    x.classList.toggle("on",on);
    x.setAttribute("aria-selected",on?"true":"false");
    x.setAttribute("tabindex",on?"0":"-1");
  });
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("on"));
  const target=$("#v-"+v);
  if(target) target.classList.add("on");
  hideFlowNudge();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("nav.tabs button").forEach(b=>{
  b.addEventListener("click",()=>goView(b.dataset.v));
  b.addEventListener("keydown",e=>{
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
    e.preventDefault();
    const tabs=[...document.querySelectorAll("nav.tabs button")];
    let i=tabs.indexOf(b);
    if(e.key==="ArrowRight")i=(i+1)%tabs.length;
    if(e.key==="ArrowLeft")i=(i-1+tabs.length)%tabs.length;
    if(e.key==="Home")i=0;
    if(e.key==="End")i=tabs.length-1;
    tabs[i].focus();
    goView(tabs[i].dataset.v);
  });
});
(function(){
  const toggle=document.getElementById("menuToggle");
  const nav=document.getElementById("mainTabs");
  if(!toggle||!nav)return;
  toggle.addEventListener("click",()=>{
    const open=!document.body.classList.contains("menu-open");
    document.body.classList.toggle("menu-open",open);
    toggle.setAttribute("aria-expanded",open?"true":"false");
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded","false");
    }
  });
  document.addEventListener("click",e=>{
    if(!document.body.classList.contains("menu-open"))return;
    if(e.target.closest("#menuToggle")||e.target.closest("#mainTabs"))return;
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded","false");
  });
})();

/* ==================== GATE FLOW + RITUÁLÉ ==================== */
const RITUAL_SESSION_KEY="ceridwenRitualDone";
window.ritualDone=SafeStorage.get(SESSION_STORE,RITUAL_SESSION_KEY,"0")==="1";
window.dkTargetChosen=false;
const RIT=[
 {b:"1 · Tértisztítás",tx:"Képzelj a tér közepére egy vakító fényoszlopot, amely kitágul, míg az egész helyiséget be nem tölti. Mondd ki: „Kérem, hogy ez a tér tisztuljon meg minden nem fényből való energiától — ide csak az léphet be, ami a legmagasabb jót szolgálja.” Ha teheted, nyiss ablakot egy pillanatra."},
 {b:"2 · Test–lélek–szellem",tx:"Három lassú lélegzet. Az elsővel arany fény mossa át a TESTED a fejtetőtől a talpadig. A másodikkal a LELKED vize csendesül el — a hullámok kisimulnak. A harmadikkal a SZELLEMED ege tisztul ki — a gondolatfelhők szétoszlanak. Zárd le: „Testem, lelkem és szellemem tiszta, védett és készen áll.”"},
 {b:"3 · Felsőbb Én",tx:"Talpad a földön — engedj gyökeret a föld szívéig. A figyelmed a szívközpontodba gyűlik. A fejtetődből fényfonál emelkedik a magasba: ez köt össze a Felsőbb Éneddel. Mondd ki: „Kérem a Felsőbb Énemet: kapcsolódj hozzám teljesen — és kapcsolódj a Forráshoz, ahhoz, aki a válaszokat adja. Minden válasz a legmagasabb jóból, tisztán és torzítás nélkül érkezzen.” Mondd hozzá Ceridwen fogadalmát: „Nem kíváncsiságból kérdezek, hanem azért, hogy tisztábban lássak és felelősebben cselekedjek.” Amikor melegség vagy mély nyugalom jelenik meg a mellkasodban — a kapcsolat él."}
];
let ritStep=window.ritualDone?3:0;
function setRitualDone(done){
  window.ritualDone=!!done;
  if(done) SafeStorage.set(SESSION_STORE,RITUAL_SESSION_KEY,"1");
  else SafeStorage.remove(SESSION_STORE,RITUAL_SESSION_KEY);
}
function markRitualButtonsDone(){
  document.querySelectorAll(".rg-btn").forEach(b=>{
    b.classList.add("done");
    b.disabled=false;
    b.textContent=RIT[+b.dataset.rs-1].b+" ✓";
  });
}
function quickTune(){
  setRitualDone(true);
  ritStep=3;
  markRitualButtonsDone();
  document.querySelectorAll(".rg-text").forEach(t=>{
    t.textContent="Egy lassú belégzés: visszahívom a figyelmem. Egy lassú kilégzés: elengedem a zajt. A kapcsolat él — a válasz csak azt szolgálhatja, ami a legmagasabb jóval összhangban van.";
  });
  ritualSync();
}
function Ingaidle(){try{return typeof Inga!=="undefined"&&Inga.phase==="idle"&&!Inga.busy;}catch(e){return true;}}
function selectionLockSync(){
  const locked=!window.ritualDone;
  document.querySelectorAll("#pakliRow .chip,#spreadPicker .spread-btn").forEach(b=>{
    b.disabled=locked;
    b.setAttribute("aria-disabled",locked?"true":"false");
  });
  const note=$("#ritualLockNote");
  if(note) note.style.display=locked?"block":"none";
}
function ritualSync(){
  const done=window.ritualDone;
  document.querySelectorAll(".ritual-gate").forEach(p=>{p.style.display="";p.classList.toggle("is-complete",done);});
  document.querySelectorAll(".ritual-ok").forEach(p=>p.style.display=done?"":"none");
  selectionLockSync();
  const db=$("#drawBtn");
  if(db){
    db.disabled=!done;
    db.textContent=done?"Merítés az üstből":"Előbb hangolódás szükséges";
  }
  const sb=$("#pendulumBtn");if(sb&&Ingaidle())sb.disabled=false;
  const dk=$("#dkScan");if(dk)dk.disabled=!(done&&window.dkTargetChosen);
  const qa=$("#qaAsk"),qc=$("#qaClean");
  if(qa&&(!window.QA||!window.QA.busy)){qa.disabled=!done;}
  if(qc&&(!window.QA||!window.QA.busy)){qc.disabled=!done;}
}
function ritReset(){
  ritStep=0;setRitualDone(false);
  document.querySelectorAll(".rg-btn").forEach(b=>{b.classList.remove("done");b.disabled=+b.dataset.rs!==1;b.textContent=RIT[+b.dataset.rs-1].b;});
  document.querySelectorAll(".rg-text").forEach(t=>t.textContent="");
  ritualSync();
}
document.querySelectorAll(".rg-btn").forEach(b=>b.addEventListener("click",()=>{
  const n=+b.dataset.rs;if(n!==ritStep+1)return;
  document.querySelectorAll(".rg-text").forEach(t=>t.textContent=RIT[n-1].tx);
  document.querySelectorAll('.rg-btn[data-rs="'+n+'"]').forEach(x=>{x.classList.add("done");x.textContent=RIT[n-1].b+" ✓";});
  ritStep=n;
  if(n<3)document.querySelectorAll('.rg-btn[data-rs="'+(n+1)+'"]').forEach(x=>x.disabled=false);
  else{setRitualDone(true);ritualSync();}
}));
document.querySelectorAll(".rg-renew").forEach(b=>b.addEventListener("click",ritReset));
document.querySelectorAll(".rg-quick").forEach(b=>b.addEventListener("click",quickTune));

function gateStep(n){
  document.querySelectorAll(".gate-step").forEach(x=>x.classList.remove("on"));
  $("#gs"+n).classList.add("on");
  document.querySelectorAll("#stepDots span").forEach((d,i)=>d.classList.toggle("on",i<n));
  hideFlowNudge();
  ["gateNextGuide"].forEach(hideInlineGuide);
  window.scrollTo({top:0,behavior:"smooth"});
}
$("#enterBtn")?.addEventListener("click",()=>{$("#gateHero").style.display="none";$("#gateFlow").style.display="block";gateStep(1);});
$("#skipAllBtn")?.addEventListener("click",()=>{
  goView("draw");
  if(!window.ritualDone){
    const note=$("#cauldronNote");
    if(note) note.textContent="Az első vetés előtt Ceridwen rövid hangolódást kér — a három gomb sorban vezet végig rajta.";
  }
});
document.querySelectorAll(".gs-back").forEach(b=>b.addEventListener("click",()=>gateStep(+b.dataset.back)));
$("#gsb1")?.addEventListener("click",()=>gateStep(2));
$("#gsb2")?.addEventListener("click",()=>gateStep(3));
$("#gsb3")?.addEventListener("click",()=>{
  ritStep=3;setRitualDone(true);
  markRitualButtonsDone();
  ritualSync();gateStep(4);
});
$("#sitGrid").innerHTML = SITUATIONS.map((s,i)=>
  `<button type="button" class="sit-btn" data-i="${i}"><h4>${esc(sitTitle(s,i))}</h4><p>${esc(sitDesc(s,i))}</p></button>`).join("");
document.querySelectorAll("#sitGrid .sit-btn").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#sitGrid .sit-btn").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");
  chosenSit = SITUATIONS[+b.dataset.i];
  let nm,sn,ds;
  if(chosenSit.tool==="pendulum"){nm="Ingaülés";sn="inga · táblák";ds="Kutatás a belső válaszrendszeren keresztül, majd tisztító feloldás — a mélyebb mintázatokhoz.";}
  else if(chosenSit.tool==="cleanse"){nm="Az Árnyék Tükre";sn="tisztítás";ds="A Fekete Tükör feltárja a rátapadt árnyakat, és minden árnyhoz tisztító varázslatot ad.";}
  else{const sp=spreadData(SPREADS.find(x=>x.id===chosenSit.s));nm=sp.nm;sn=sp.sn;ds=sp.desc;}
  $("#reco").innerHTML = `<div class="rl">${cerEn()?"The cauldron recommends":"Az üst ajánlása"}</div><h4>${esc(nm)} · ${sn}</h4><p>${esc(ds)}</p>`;
  $("#reco").classList.add("on");
  $("#toStep5").disabled=false;
  showInlineGuide("gateNextGuide",cerEn()?"Scroll down, then press: Continue to the question.":"Görgess lejjebb, majd nyomd meg: Tovább a kérdéshez.");
  guideNext("#toStep5",cerEn()?"Next step below: Continue to the question ↓":"Következő lépés lent: Tovább a kérdéshez ↓");
}));
$("#toStep5")?.addEventListener("click",()=>{hideFlowNudge();hideInlineGuide("gateNextGuide");gateStep(5);});
$("#gsGo")?.addEventListener("click",()=>{
  const q=getCleanQuestion("#gateQuestion");
  if(chosenSit&&chosenSit.tool==="pendulum"){if(q)$("#pendulumName").value=q;goView("pendulum");return;}
  if(chosenSit&&chosenSit.tool==="cleanse"){if(q)$("#dkName").value=q;goView("cleanse");return;}
  if(chosenSit){ currentSpread = SPREADS.find(x=>x.id===chosenSit.s); renderSpreadPicker(); }
  if(q) $("#question").value=q;
  goView("draw");
  resetTable();
  setTimeout(()=>{if(!$("#drawBtn").disabled)$("#drawBtn").click();},450);
});

/* ==================== CAVE: houses + spread guide ==================== */

/* ==================== SPREAD PICKER ==================== */
function renderSpreadPicker(){
  $("#spreadPicker").innerHTML = SPREADS.map(sp=>{const s=spreadData(sp);return
    `<button type="button" class="spread-btn ${sp.id===currentSpread.id?'on':''}" data-id="${sp.id}" ${!window.ritualDone?'disabled aria-disabled="true"':'aria-disabled="false"'}>
      <div class="sn">${s.sn}</div><h3>${s.nm}</h3>
      <p class="sit"><b>${cerEn()?"When to use this spread":"Mikor jó"}:</b> ${esc(s.sit)}</p>
      <p>${esc(s.desc)}</p></button>`}).join("");
  document.querySelectorAll("#spreadPicker .spread-btn").forEach(b=>b.addEventListener("click",()=>{
    if(!window.ritualDone){
      const note=$("#cauldronNote");
      if(note) note.textContent="Előbb hangolódás szükséges — a paklit és a vetésmódot csak tisztítás után lehet kiválasztani.";
      return;
    }
    currentSpread = SPREADS.find(s=>s.id===b.dataset.id);
    renderSpreadPicker(); resetTable();
    showInlineGuide("spreadNextGuide",cerEn()?"The spread is selected. Scroll down and press: Draw from the cauldron.":"A vetés kiválasztva. Görgess lejjebb, és nyomd meg: Merítés az üstből.");
    guideNext("#drawBtn","Következő lépés lent: Merítés az üstből ↓");
  }));
  const dr=$("#darkTargetRow");if(dr)dr.style.display=currentSpread.dark?"block":"none";
  selectionLockSync();
}
renderSpreadPicker();

const ALL_CLEAR_CARD={
  id:"all-clear",h:"hold",no:"Ø",nm:"Minden rendben",st:"A tiszta tér lapja",
  k:["rend","nyugalom","bizalom"],
  u:"Most nem mutatkozik olyan minta, amely további feltárást vagy tisztítást kérne. A tér rendezett, a jelzés megnyugtató.",
  f:"Ne keress problémát ott, ahol jelenleg nincs. Tartsd meg a nyugalmat, és folytasd a napodat könnyed figyelemmel.",
  a:"A túlzott ellenőrzés önmagában kelthet zavart. Most a bizalom a helyes gyakorlat.",
  m:"Elfogadom, hogy most minden rendben van.",
  deep:"Ez a lap lezáró jelzés. Ha megjelenik, a húzás itt véget ér: nem érkezik mellé másik lap, árnyék vagy tisztítási feladat.",
  practice:"Vegyél három nyugodt lélegzetet, mondj köszönetet a tiszta állapotért, majd engedd el a további keresést.",
  question:"Meg tudom-e engedni magamnak, hogy most ne keressek újabb problémát?",
  body:"könnyebb légzés, ellazuló vállak, csendesebb figyelem",
  ritual:"érintsd meg a szívedet, és mondd: most minden rendben van",
  allClear:true
};

/* ==================== DRAW ==================== */
function resetTable(){
  drawn=[]; $("#table").innerHTML=""; $("#reading").innerHTML="";
  hideInlineGuide("cardsNextGuide"); hideFlowNudge();
  $("#priestess").style.display="none"; $("#oracleOut").textContent="";
  const opw=$("#oraclePromptWrap"); if(opw) opw.classList.remove("on");
  const opt=$("#oraclePromptText"); if(opt) opt.value="";
  $("#postdraw").style.display="none";
  const ip=$("#integrationPanel");if(ip)ip.classList.remove("on");
  ["#intUnderstand","#intRelease","#intAction"].forEach(s=>{const e=$(s);if(e)e.value="";});
  $("#flipAllBtn").disabled=true;
  $("#cauldronNote").textContent="Az üst csendesen várakozik.";
  $("#cauldron").classList.remove("brewing");
}
$("#drawBtn")?.addEventListener("click",()=>{
  const drawButton=$("#drawBtn");
  try{
    if(!window.ritualDone){
      const note=$("#cauldronNote");
      if(note) note.textContent=cerEn()?"Before the first spread, Ceridwen asks for the short three-step attunement.":"Az első vetés előtt Ceridwen rövid hangolódást kér — a három gomb sorban vezet végig rajta.";
      return;
    }
    if(drawButton){drawButton.disabled=true;drawButton.setAttribute("aria-busy","true");}
    resetTable();
    const useRev = !!$("#revToggle")?.checked;
    const available=deckPool();
    if(!Array.isArray(available)||available.length<currentSpread.n){
      throw new Error(cerEn()?"The selected deck does not contain enough cards.":"A kiválasztott pakliban nincs elegendő lap ehhez a vetéshez.");
    }
    const allClearDraw=randBool(0.12);
    if(allClearDraw){
      drawn=[{card:ALL_CLEAR_CARD,rev:false,flipped:false,allClear:true}];
    }else if(currentSpread.dark){
      const tt=window.dtSel||"en";
      const pool=secureShuffle(DARK.filter(e=>!e.id.startsWith("ismeretlen")&&(tt==="en"||e.t.includes(tt))));
      const picks=pool.slice(0,3);
      if(randBool(0.22)){const unk=DARK.filter(e=>e.id.startsWith("ismeretlen"));if(unk.length)picks[2]=unk[randInt(unk.length)];}
      const light=pickOneCard(available,currentPakli);
      drawn=[...picks.map(e=>({darkE:e,origin:pickOrigin(),lvl:randRange(25,90),flipped:false})),{card:light,rev:false,flipped:false}];
      rememberCards(light?[light.id]:[], currentPakli);
    }else{
      const picks=pickUniqueCards(available,currentSpread.n,currentPakli);
      if(!picks||picks.length!==currentSpread.n)throw new Error(cerEn()?"The cards could not be drawn. Please try once more.":"A lapokat nem sikerült megfelelően kihúzni. Kérlek, próbáld újra.");
      drawn=picks.map(c=>({card:c,rev:useRev&&randBool(0.3),flipped:false}));
      rememberCards(picks.map(c=>c.id),currentPakli);
    }
    $("#cauldron")?.classList.add("brewing");
    if($("#cauldronNote"))$("#cauldronNote").textContent=cerEn()?"The cauldron is stirring… the cards are rising to the surface.":"A főzet kavarog… a lapok felszínre emelkednek.";
    $("#cauldron")?.scrollIntoView({behavior:"smooth",block:"center"});
    setTimeout(()=>{
      try{
        if($("#cauldronNote"))$("#cauldronNote").textContent=cerEn()?"Reveal the cards when you are ready.":"Fordítsd fel a lapokat, amikor készen állsz.";
        renderTable();
        $("#flipAllBtn").disabled=false;
        showInlineGuide("cardsNextGuide",cerEn()?"The cards have arrived. Reveal them, and the reading will appear below.":"A lapok megérkeztek. Fordítsd fel őket, majd az értelmezés lejjebb jelenik meg.");
        guideNext("#table",cerEn()?"Next step: reveal the cards ↓":"Következő lépés: fordítsd fel a lapokat ↓");
        $("#table")?.scrollIntoView({behavior:"smooth",block:"start"});
      }finally{
        if(drawButton){drawButton.disabled=false;drawButton.removeAttribute("aria-busy");}
      }
    },700);
  }catch(err){
    console.error("Draw error",err);
    if($("#cauldronNote"))$("#cauldronNote").textContent=err?.message|| (cerEn()?"The draw could not be completed.":"A merítést nem sikerült befejezni.");
    if(drawButton){drawButton.disabled=false;drawButton.removeAttribute("aria-busy");}
  }
});
function darkSVG(e){
  const c="#d3a4b5";
  if(e.cat==="kotes")return `<svg viewBox="0 0 100 100" fill="none"><circle cx="40" cy="50" r="19" stroke="${c}" stroke-width="2"/><circle cx="60" cy="50" r="19" stroke="${c}" stroke-width="2"/><path d="M24 78 L76 22" stroke="${c}" stroke-width="1.6" opacity=".6"/></svg>`;
  return `<svg viewBox="0 0 100 100" fill="none"><path d="M10 50 Q50 16 90 50 Q50 84 10 50Z" stroke="${c}" stroke-width="2"/><circle cx="50" cy="50" r="13" stroke="${c}" stroke-width="2"/><circle cx="50" cy="50" r="4" fill="${c}"/><path d="M50 10 v9 M50 81 v9 M17 28 l7 7 M83 28 l-7 7" stroke="${c}" stroke-width="1.4" opacity=".6"/></svg>`;
}
function renderTable(){
  $("#table").innerHTML = drawn.map((d,i)=>{
    const nm=d.darkE?d.darkE.n:cardName(d.card);
    const front=d.darkE
      ?`<div class="art">${darkSVG(d.darkE)}</div>
         <div class="cardname">
           <div class="no" style="color:#d9a7b8">${d.darkE.cat==="kotes"?"KÖTÉS":"ÁRNY"} · ${d.lvl}%</div>
           <div class="nm">${esc(d.darkE.n)}</div>
           <div class="rv">${esc(d.origin.n)}</div>
         </div>`
      :`<div class="art">${cardSVG(d.card)}</div>
         <div class="cardname">
           <div class="no">${d.card.no}</div>
           <div class="nm">${esc(cardName(d.card))}</div>
           ${d.rev?`<div class="rv">${cerEn()?'reversed':'fordított'}</div>`:''}
         </div>`;
    return `
    <div class="slot" style="animation-delay:${i*0.12}s">
      <div class="pos">${i+1}. ${esc(currentSpread.pos[i])}</div>
      <div class="cardbox ${d.flipped?'flipped':''}" data-i="${i}" tabindex="0" role="button"
           aria-label="${d.flipped?esc(nm):(cerEn()?'Face-down card — click to reveal':'Lefordított lap — kattints a felfordításhoz')}">
        <div class="flipper">
          <div class="face back">${backSVG()}</div>
          <div class="face front ${d.rev?'rev':''}">${front}</div>
        </div>
      </div>
      <div class="hint">${d.flipped?(cerEn()?'Click for details':'Kattints a részletekért'):''}</div>
    </div>`;}).join("");
  document.querySelectorAll(".cardbox").forEach(box=>{
    const act=()=>{ const i=+box.dataset.i;
      if(!drawn[i].flipped){ drawn[i].flipped=true; box.classList.add("flipped");
        box.parentElement.querySelector(".hint").textContent=cerEn()?"Click for details":"Kattints a részletekért";
        if(drawn.every(d=>d.flipped)) revealReading();
      } else if(drawn[i].darkE) dkModal(drawn[i].darkE,drawn[i].origin,drawn[i].lvl);
      else openModal(drawn[i].card, drawn[i].rev, currentSpread.pos[i]);
    };
    box.addEventListener("click",act);
    box.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}});
  });
}
$("#flipAllBtn")?.addEventListener("click",()=>{
  drawn.forEach(d=>d.flipped=true); renderTable(); revealReading();
});
function cardPendulumPanel(id,label,pos,kind){
  const sid=String(id).replace(/[^a-zA-Z0-9_-]/g,"-");
  return `<div class="card-pendulum" data-card-pendulum="${sid}" data-label="${esc(label)}" data-pos="${esc(pos||"")}" data-kind="${esc(kind||"lap")}">
    <div class="cp-title">${cerEn()?"Pendulum for this card":"Inga a laphoz"}</div>
    <div class="cp-lead">${cerEn()?"Ask a yes–no question about this card, or request a short cleansing for the pattern it revealed.":"Kérdezz igen–nem formában erről a lapról, vagy kérj rövid tisztítást a lap által megmutatott mintára."}</div>
    <div class="cp-body">
      <svg viewBox="0 0 160 120" aria-hidden="true">
        <path class="cp-arc" d="M 22 96 A 58 58 0 0 1 138 96 L 80 24 Z" opacity=".55"/>
        <text class="cp-label" x="40" y="94" text-anchor="middle">NEM</text>
        <text class="cp-label" x="120" y="94" text-anchor="middle">IGEN</text>
        <g class="cpNeedle" transform="rotate(0 80 24)">
          <line x1="80" y1="24" x2="80" y2="82" stroke="#a37c2c" stroke-width="2" stroke-linecap="round"/>
          <circle cx="80" cy="86" r="8" fill="#a37c2c"/>
          <circle cx="80" cy="86" r="12" fill="none" stroke="rgba(163,124,44,.35)" stroke-width="1"/>
        </g>
        <circle cx="80" cy="24" r="4" fill="#a37c2c"/>
      </svg>
      <div class="cp-form">
        <input type="text" class="cp-q" maxlength="160" placeholder="Pl.: Ezt a lapot most cselekvésként értsem?">
        <div class="cp-actions">
          <button class="btn cp-ask" type="button">Inga: igen / nem</button>
          <button class="btn ghost cp-clean" type="button">Lap tisztítása</button>
        </div>
        <div class="cp-status">Az inga ehhez a laphoz van hangolva: <strong>${esc(label)}</strong>.</div>
      </div>
    </div>
    <div class="cp-note">Játékos, önismereti visszajelzés: a döntést nem veszi át helyetted, csak segít megfigyelni, mit vált ki benned a lap.</div>
  </div>`;
}
function cpState(panel){
  if(!panel.__cp) panel.__cp={rot:0,busy:false};
  return panel.__cp;
}
function cpSetRot(panel,r){
  const st=cpState(panel);st.rot=r;
  const n=panel.querySelector(".cpNeedle");
  if(n)n.setAttribute("transform",`rotate(${r.toFixed(2)} 80 24)`);
}
function cpLock(panel,v){
  cpState(panel).busy=v;
  panel.querySelectorAll("button,input").forEach(el=>{el.disabled=v;});
}
function cpStatus(panel,html){
  const el=panel.querySelector(".cp-status");
  if(el)el.innerHTML=html;
}
function cardPendulumAsk(panel){
  const st=cpState(panel);if(st.busy)return;
  const q=(panel.querySelector(".cp-q")?.value||"").trim();
  const label=panel.dataset.label||"a lap";
  if(!q){cpStatus(panel,"Előbb fogalmazz meg egy rövid igen–nem kérdést a lap kapcsán.");return;}
  cpLock(panel,true);cpStatus(panel,"Az inga a lap üzenetéhez hangolódik…");
  const yes=randBool(), target=yes?32:-32, start=st.rot, t0=performance.now();
  (function frame(now){
    const t=now-t0, p=Math.min(1,t/2400), ease=1-Math.pow(1-p,3);
    cpSetRot(panel,start+(target-start)*ease+38*Math.exp(-t/650)*Math.sin(t/90));
    if(t<2400)requestAnimationFrame(frame);
    else{
      cpSetRot(panel,target);cpLock(panel,false);
      cpStatus(panel,`<strong>${yes?"IGEN":"NEM"}</strong> — „${esc(q)}”<br>${yes?`A ${esc(label)} most támogatja ezt az irányt, de kér hozzá tudatos jelenlétet.`:`A ${esc(label)} most inkább megállásra, pontosításra vagy más megközelítésre int.`}`);
    }
  })(performance.now());
}
function cardPendulumClean(panel){
  const st=cpState(panel);if(st.busy)return;
  const label=panel.dataset.label||"a lap";
  cpLock(panel,true);
  const dur=2400+rnd()*4200;
  const rps=.55+rnd()*1.45;
  const total=360*rps*(dur/1000);
  const start=st.rot,t0=performance.now();
  cpStatus(panel,cerEn()?`Cleansing begins for the pattern shown by <strong>${esc(label)}</strong>… keep your attention on clarity and grounded breath.`:`Tisztítás indul a(z) <strong>${esc(label)}</strong> lap által jelzett mintára… tartsd a figyelmed a fényen.`);
  (function frame(now){
    const t=Math.min(dur,now-t0), p=t/dur, ease=1-Math.pow(1-p,2.15);
    cpSetRot(panel,start+total*ease);
    if(t<dur)requestAnimationFrame(frame);
    else{
      cpSetRot(panel,0);cpLock(panel,false);
      cpStatus(panel,cerEn()?`The card-linked cleansing is complete. “I keep the teaching and release the disturbing imprint.”`:`A laphoz kapcsolt tisztítás lezárult. „A tanítást megtartom, a zavaró lenyomatot elengedem.”`);
    }
  })(performance.now());
}
function bindCardPendulums(){
  document.querySelectorAll("[data-card-pendulum]").forEach(panel=>{
    if(panel.dataset.bound)return;
    panel.dataset.bound="1";
    panel.querySelector(".cp-ask")?.addEventListener("click",()=>cardPendulumAsk(panel));
    panel.querySelector(".cp-clean")?.addEventListener("click",()=>cardPendulumClean(panel));
    panel.querySelector(".cp-q")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();cardPendulumAsk(panel);}});
  });
}


function aiPromptContextLines(){
  const q=(gq("#question")?.value||gq("#cauldronQuestion")?.value||gq("#pendulumName")?.value||"").trim();
  const spread=currentSpread ? (cerEn()?(currentSpread.nmEn||currentSpread.nm||"Cauldron spread"):(currentSpread.nm||"Üst-vetés")) : (cerEn()?"Symbolic self-inquiry":"Jelképes önismereti folyamat");
  const history=(Array.isArray(drawn)?drawn:[]).map((d,i)=>{
    const pos=currentSpread?.pos?.[i]||`${i+1}.`;
    if(d?.allClear||d?.card?.allClear) return `${i+1}. ${pos}: ${cerEn()?"All is well":"Minden rendben"}`;
    if(d?.darkE) return `${i+1}. ${pos}: ${darkName(d.darkE)} (${d.lvl||"?"}%), ${cerEn()?"origin":"eredet"}: ${originName(d.origin)}`;
    if(d?.card) return `${i+1}. ${pos}: ${cardName(d.card)}${d.rev?(cerEn()?" (reversed)":" (fordított)"):""}`;
    return "";
  }).filter(Boolean);
  return {q,spread,history};
}
function buildResultAiPrompt(data){
  const ctx=aiPromptContextLines();
  const title=data.title||"";
  const subtype=data.subtype||"";
  const meaning=data.meaning||"";
  const practice=data.practice||"";
  const extra=data.extra||"";
  if(cerEn()) return `Please interpret the following result from a Celtic-inspired symbolic self-inquiry application. This is not a factual diagnosis, supernatural proof or prediction. Treat the cards, pendulum and cleansing process as metaphors that may support reflection. Do not replace medical, psychological, legal, financial or therapeutic professional advice.

WHAT THIS SYSTEM IS
Hello It’s Me · Ceridwen’s Cauldron is a symbolic reflection tool. The cauldron represents transformation, the cards represent archetypal themes, cleansing represents consciously releasing an unhelpful pattern, and the pendulum represents a structured yes/no or table-based reflection process. The output is generated by the application and should be interpreted as a prompt for self-observation, not as an objective statement about reality.

CURRENT PROCESS
Tool / process: ${data.process||"Ceridwen’s Cauldron"}
Spread or session: ${ctx.spread}
User’s original focus or question: ${ctx.q||"No separate question was entered."}
Current result type: ${subtype||"symbolic card"}
Current result: ${title}
Meaning shown by the application: ${meaning||"No separate meaning text was recorded."}
Suggested practice or release: ${practice||"No separate practice was recorded."}
Additional details: ${extra||"None."}

PREVIOUS RESULTS IN THIS SAME PROCESS
${ctx.history.length?ctx.history.join("\n"):"This is the first recorded result in the current process."}

PLEASE EXPLAIN
1. Explain in clear, everyday language what this result may symbolically mean in the context of the original question and previous results.
2. Show how it connects to the earlier steps without treating the sequence as fate or certainty.
3. Separate possible helpful insight from speculation.
4. Name 2–3 gentle self-reflection questions.
5. Suggest 2–3 practical, grounded next steps for the next 24–72 hours.
6. Mention when professional support would be more appropriate than symbolic interpretation.
7. End with a short, balanced summary sentence.`;
  return `Kérlek, értelmezd az alábbi eredményt egy kelta ihletésű, jelképes önismereti alkalmazás részeként. Ez nem tényszerű diagnózis, természetfeletti bizonyíték vagy jóslat. A lapokat, az ingát és a tisztítási folyamatot metaforaként kezeld, amelyek önreflexiót támogathatnak. Ne helyettesíts orvosi, pszichológiai, jogi, pénzügyi vagy terápiás szaktanácsadást.

MI EZ A RENDSZER?
A Hello It’s Me · Ceridwen Üstje jelképes önreflexiós eszköz. Az üst az átalakulást, a lapok archetípusos témákat, a tisztítás egy zavaró minta tudatos elengedését, az inga pedig strukturált igen–nem vagy táblás önvizsgálatot jelképez. Az eredményt az alkalmazás generálja; önmegfigyelési kiindulópontként értelmezd, ne a valóságról szóló objektív állításként.

AKTUÁLIS FOLYAMAT
Eszköz / folyamat: ${data.process||"Ceridwen Üstje"}
Vetés vagy ülés: ${ctx.spread}
A felhasználó eredeti fókusza vagy kérdése: ${ctx.q||"Nem adott meg külön kérdést."}
Az aktuális eredmény típusa: ${subtype||"jelképes lap"}
Az aktuális eredmény: ${title}
Az alkalmazásban megjelenő jelentés: ${meaning||"Nem került rögzítésre külön jelentésszöveg."}
Javasolt gyakorlat vagy oldás: ${practice||"Nem került rögzítésre külön gyakorlat."}
További részletek: ${extra||"Nincs."}

AZ UGYANEBBEN A FOLYAMATBAN KORÁBBAN MEGJELENT EREDMÉNYEK
${ctx.history.length?ctx.history.join("\n"):"Ez a jelenlegi folyamat első rögzített eredménye."}

KÉRLEK, ÍGY MAGYARÁZD EL
1. Közérthetően írd le, mit jelenthet jelképesen ez az eredmény az eredeti kérdés és az előzmények összefüggésében.
2. Mutasd meg, hogyan kapcsolódik a korábbi lépésekhez, de ne kezeld a sorrendet sorsként vagy bizonyosságként.
3. Válaszd külön a hasznos önismereti felismerést a feltételezéstől.
4. Adj 2–3 kíméletes önreflexiós kérdést.
5. Javasolj 2–3 földelt, gyakorlati lépést a következő 24–72 órára.
6. Jelezd, mikor lenne helyesebb szakember támogatását kérni jelképes értelmezés helyett.
7. Zárd egy rövid, kiegyensúlyozott összegző mondattal.`;
}
function resultAiPromptPanel(id,data){
  const prompt=buildResultAiPrompt(data);
  return `<details class="result-ai-prompt" data-result-ai="${esc(id)}"><summary>${cerEn()?"AI explanation prompt":"AI-magyarázó prompt"}</summary><p>${cerEn()?"Copy this complete context into an AI assistant to receive a grounded explanation of this result.":"Másold be ezt a teljes kontextust egy AI-asszisztensbe, hogy közérthető, földelt magyarázatot kapj az eredményről."}</p><textarea class="result-ai-text" readonly>${esc(prompt)}</textarea><button type="button" class="btn ghost result-ai-copy">${cerEn()?"Copy prompt":"Prompt másolása"}</button><span class="result-ai-status" aria-live="polite"></span></details>`;
}
function bindResultAiPrompts(root=document){
  root.querySelectorAll(".result-ai-prompt").forEach(w=>{
    if(w.dataset.bound)return;w.dataset.bound="1";
    w.querySelector(".result-ai-copy")?.addEventListener("click",async()=>{
      const btn=w.querySelector(".result-ai-copy"),status=w.querySelector(".result-ai-status"),txt=w.querySelector(".result-ai-text")?.value||"";
      const ok=await copyTextToClipboard(txt);
      const done=cerEn()?"Copied ✓":"Kimásolva ✓";
      const fail=cerEn()?"Copy failed — select the text and copy it manually.":"A másolás nem sikerült — jelöld ki a szöveget, és másold kézzel.";
      if(status)status.textContent=ok?done:fail;
      if(btn){const old=btn.textContent;btn.textContent=ok?done:(cerEn()?"Copy failed":"Másolási hiba");setTimeout(()=>{btn.textContent=old;if(status)status.textContent="";},ok?1800:2600);}
    });
  });
}

function revealReading(){
  if(drawn.some(d=>d.allClear||d.card?.allClear)){
    const c=ALL_CLEAR_CARD;
    $("#reading").innerHTML=`<div class="reading-card all-clear-result"><div class="meta">${cerEn()?"Closing sign":"Lezáró jelzés"}</div><h4>${esc(cardName(c))} <span>— ${esc(cardSubtitle(c))}</span></h4><div>${cardKeys(c).map(k=>`<span class="kw">${esc(k)}</span>`).join("")}</div><p>${esc(cardCore(c))}</p><p><strong style="color:var(--gold);font-weight:600">${cerEn()?"Meaning":"Jelentés"}:</strong> ${esc(cardLight(c))}</p><p><strong style="color:var(--gold);font-weight:600">${cerEn()?"Practice":"Gyakorlat"}:</strong> ${esc(cardPractice(c))}</p><p class="aff">„${esc(cardAffirm(c))}”</p>${resultAiPromptPanel("all-clear",{process:cerEn()?"Cauldron / closing result":"Üst / lezáró eredmény",subtype:cerEn()?"All-clear card":"Minden rendben lap",title:cardName(c),meaning:cardCore(c)+" "+cardLight(c),practice:cardPractice(c),extra:cardAffirm(c)})}</div>`;
    $("#postdraw").style.display="flex";
    const ip=$("#integrationPanel");if(ip)ip.classList.remove("on");
    $("#priestess").style.display="block";
    $("#cauldronNote").textContent=cerEn()?"All is well. The draw closes here; no further card or cleansing is needed.":"Minden rendben van. A húzás itt lezárul; nincs szükség további lapra vagy tisztításra.";
    bindResultAiPrompts($("#reading"));
    return;
  }
  $("#reading").innerHTML = `<div class="divider" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#c9a86a" stroke-width="1.4"><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="9" opacity=".4"/></svg></div>` +
   drawn.map((d,i)=>{
    if(d.darkE){
      const e=d.darkE,o=d.origin;
      return `<div class="dk-energy">
      <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:8px;font-weight:500">${i+1}. ${esc(currentSpread.pos[i])} · ${cerEn()?(e.cat==="kotes"?"Binding":"Shadow"):(e.cat==="kotes"?"Kötés":"Árny")} · ${d.lvl}%</div>
      <h4>${esc(darkName(e))}</h4>
      <div class="dk-bar"><i style="width:${d.lvl}%"></i></div>
      <p>${esc(darkDesc(e))}</p>
      <h5>${cerEn()?"Signs":"Jelek"}</h5><p>${esc(darkSigns(e))}</p>
      <h5>${cerEn()?"Origin layer":"Eredet — honnan került rá"}</h5><p><strong style="color:var(--blossom);font-weight:600">${esc(originName(o))}.</strong> ${esc(originDesc(o))} ${esc(originFix(o))}</p>
      <h5>${cerEn()?"Release and cleansing practice":"Megszüntetés — tisztító gyakorlat"}</h5><p>${esc(darkRelease(e))}</p>
      <h5>${cerEn()?"The Priestess’ guidance":"A Papnő tippje"}</h5><p>${esc(darkTip(e))}</p>
      ${cardPendulumPanel(`dark-${i}`, darkName(e), spreadPos(i), cerEn()?"shadow/binding":"árny/kötés")}
      ${darkIncantationPanel(e,`spread-${i}-${e.id}`)}
      ${resultAiPromptPanel(`dark-ai-${i}`,{process:cerEn()?"Cauldron cleansing / shadow card":"Üst-tisztítás / árnylap",subtype:cerEn()?(e.cat==="kotes"?"Binding":"Shadow"):(e.cat==="kotes"?"Kötés":"Árny"),title:darkName(e),meaning:darkDesc(e),practice:darkRelease(e),extra:`${cerEn()?"Origin":"Eredet"}: ${originName(o)}. ${originDesc(o)} ${originFix(o)}. ${cerEn()?"Intensity":"Erősség"}: ${d.lvl}%`})}
    </div>`;
    }
    const c=d.card, h=HOUSES[c.h]; const hn=houseName(c.h); const pos=spreadPos(i);
    return `<div class="reading-card">
      <div class="meta">${i+1}. ${esc(pos)} · ${hn}${d.rev?` · ${cerEn()?"reversed":"fordított"}`:""}</div>
      <h4>${c.no} · ${esc(cardName(c))} <span>— ${esc(cardSubtitle(c))}</span></h4>
      <div>${cardKeys(c).map(k=>`<span class="kw">${esc(k)}</span>`).join("")}</div>
      <p>${esc(cardCore(c))}</p>
      ${cardDeep(c)?`<p><strong style="color:var(--gold);font-weight:600">${cerEn()?"Deeper teaching":"Mélyréteg"}:</strong> ${esc(cardDeep(c))}</p>`:""}
      <p><strong style="color:var(--gold);font-weight:600">${d.rev?(cerEn()?"In shadow":"Árnyékban"):(cerEn()?"In the light":"Fényben")}:</strong> ${esc(d.rev?cardShadow(c):cardLight(c))}</p>
      ${cardPractice(c)?`<p><strong style="color:var(--gold);font-weight:600">${cerEn()?"Practical step":"Gyakorlati lépés"}:</strong> ${esc(cardPractice(c))}</p>`:""}
      ${cardQuestion(c)?`<p><strong style="color:var(--gold);font-weight:600">${cerEn()?"Question to carry within":"Kérdés magadhoz"}:</strong> ${esc(cardQuestion(c))}</p>`:""}
      ${(()=>{const t=deckTone(c);return `<div class="deck-tone"><div class="deck-tone__title">${esc(t.title)}</div><p>${esc(t.text)}</p></div>`;})()}
      ${(()=>{const m=currentMoonLens(c);return `<div class="moon-lens"><div class="moon-lens__title">${cerEn()?"Today’s lunar perspective":"Mai hold szerinti olvasat"} · ${esc(m.phase)}</div><p>${esc(m.text)}</p></div>`;})()}
      <p class="aff">„${esc(cardAffirm(c))}”</p>
      ${cardPendulumPanel(`card-${i}`, cardName(c), pos, cerEn()?"card":"lap")}
      ${resultAiPromptPanel(`card-ai-${i}`,{process:cerEn()?"Ceridwen’s Cauldron card draw":"Ceridwen üstje – kártyahúzás",subtype:cerEn()?"Archetypal card":"Archetípusos lap",title:`${cardName(c)} — ${cardSubtitle(c)}`,meaning:cardCore(c)+" "+(d.rev?cardShadow(c):cardLight(c)),practice:cardPractice(c),extra:`${cerEn()?"Position":"Pozíció"}: ${pos}. ${cerEn()?"Keywords":"Kulcsszavak"}: ${cardKeys(c).join(", ")}`})}
    </div>`;
  }).join("");
  $("#postdraw").style.display="flex";
  const ip=$("#integrationPanel");if(ip)ip.classList.add("on");
  $("#priestess").style.display="block";
  $("#cauldronNote").textContent=currentSpread.dark?(cerEn()?"The Mirror has spoken — the Card of Light shows the way.":"A Tükör szólt — a Fény Lapja mutatja az utat."):(cerEn()?"The cards have spoken. You may now ask the Priestess to deepen the reading.":"A lapok megszólaltak — és kérésedre a Papnő is értelmez.");
  bindCardPendulums();
  bindResultAiPrompts($("#reading"));
  hideInlineGuide("cardsNextGuide");
  const readingEl=$("#reading");
  if(readingEl) setTimeout(()=>readingEl.scrollIntoView({behavior:"smooth",block:"start"}),120);
  setTimeout(()=>guideNext("#priestess","Lejjebb találod a Papnő összegzését is ↓"),850);
}

/* ==================== ORACLE ==================== */
function localQuestionMode(q,c){
  const t=(q||"").toLowerCase();
  if(/szerelem|kapcsolat|pár|társ|család|gyerek|lány|fiú|léna|barát|anya|apa|házasság|válás/.test(t)&&c.tsz) return {label:"Kapcsolati tükör",text:c.tsz};
  if(/munka|pénz|vállalkozás|projekt|karrier|üzlet|bőség|döntés|állás|ügyfél/.test(t)&&c.tmu) return {label:"Munka és bőség",text:c.tmu};
  if(/lélek|energia|tisztítás|félelem|szorongás|álom|út|spirit|belső|önismeret/.test(t)&&c.tle) return {label:"Lélekút",text:c.tle};
  return {label:"Fő üzenet",text:c.f};
}
function localUniq(xs){return [...new Set(xs.filter(Boolean))];}
function localNormalOracleEN(q,cards){
  if(!cards.length) return "The Priestess does not yet see revealed cards. First draw from the cauldron, then turn the cards.";
  const sd=spreadData(currentSpread);
  const key=localUniq(cards.flatMap(d=>cardKeys(d.card))).slice(0,7).join(", ");
  const spine=cards.map((d,i)=>{
    const c=d.card;
    return `${spreadPos(i)}: ${c.no} · ${cardName(c)}. ${cardCore(c)} ${d.rev?`Reversed, it speaks from the shadow: ${cardShadow(c)}`:`In the light, it speaks: ${cardLight(c)}`} Deeper teaching: ${cardDeep(c)} Practical step: ${cardPractice(c)} Question: ${cardQuestion(c)}`;
  }).join("\n\n");
  const first=cards[0].card,last=cards[cards.length-1].card;
  const qline=q?`Around your question — “${q}” — the cauldron does not close the future; it opens the truer way of seeing.`:"Without a written question, this reading becomes a general threshold: it shows the force asking for attention now.";
  return `${qline}\n\n${sd.nm} gathers these motifs: ${key}. Read them as a living pattern, not a verdict. Ceridwen’s old voice says: do not ask the card to decide for you. Ask what must be ripened, what must be released, and what one clean act now belongs to you.\n\n${spine}\n\nThe arc begins with ${cardName(first)} and closes with ${cardName(last)}. This means the gate opens through ${cardKeys(first).join(", ")} and asks to be carried into ${cardKeys(last).join(", ")}. Keep the teaching simple: name what you understood, release one unnecessary weight, and make one clear step within twenty-four hours.\n\nBlessing: “${cardAffirm(last)}”\n\nThis is a self-knowledge reflection, not fortune-telling, and it does not replace medical, legal, psychological or financial advice.`;
}
function localNormalOracle(q){
  const cards=drawn.filter(d=>d.card);
  if(cerEn()) return localNormalOracleEN(q,cards);
  if(!cards.length) return "A Papnő még nem lát felfordított lapokat. Előbb meríts az üstből, majd fordítsd fel a lapokat.";
  const first=cards[0], last=cards[cards.length-1];
  const key=localUniq(cards.flatMap(d=>d.card.k)).slice(0,7).join(", ");
  const spine=cards.map((d,i)=>{
    const c=d.card, pos=currentSpread.pos[i]||`${i+1}. lap`, h=HOUSES[c.h]||{name:"Orákulum"};
    const mode=localQuestionMode(q,c);
    const tone=d.rev?`itt a lap árnyéka is látszik: ${c.a}`:`itt a lap fénye vezet: ${mode.text}`;
    const deeper=c.deep?` Mélyréteg: ${c.deep}`:"";
    const practice=c.practice?` Gyakorlat: ${c.practice}`:"";
    const question=c.question?` Kérdés magadhoz: ${c.question}`:"";
    const dt=deckTone(c), ml=currentMoonLens(c);
    return `${pos} helyén a ${c.no} · ${c.nm} (${h.name}) áll. ${c.u} ${tone}${deeper}${practice}${question} ${dt.title}: ${dt.text} Mai hold szerinti olvasat (${ml.phase}): ${ml.text}`;
  }).join("\n\n");
  const qline=q?`A kérdésed körül — „${q}” — nem lezárt válasz, hanem irány rajzolódik ki.`:"A kérdés nélküli vetés most általános iránytűként szól.";
  const closing=last.rev?last.card.a:last.card.f;
  return `${qline}\n\nA ${currentSpread.nm} vetésben az üst három rétegben mutat: először azt, ami most a felszínen mozog, aztán ami mélyebben dolgozik, végül azt, amerre a figyelmedet érdemes fordítani. A kulcsmotívumok: ${key}.\n\n${spine}\n\nA történet íve így szelíd: ${first.card.nm} nyitja a kaput, és ${last.card.nm} zárja a kört. Ceridwen üzenete szerint most nem a biztos jövőt kell keresned, hanem azt a belső mozdulatot, amellyel tisztábban tudsz jelen lenni. A következő napokban figyeld meg, hol ismétlődik ugyanaz az érzés, mondat vagy testi jelzés — ott van a lapok gyakorlati kapuja. Testi-érzelmi jel: ${last.card.body||"figyeld, hol lesz könnyebb vagy szorosabb a légzésed"}. Mini rituálé: ${last.card.ritual||"egy mondatban zárd le a vetést"}.\n\nIntegráció: írd le, mit értettél meg, mit engedsz el, és mi az az egy tiszta lépés, amit 24 órán belül megteszel. Gyakorlat: írj le egyetlen mondatot arról, mit engedsz el, és egyetlen mondatot arról, mit választasz helyette. A végső fény: ${closing}\n\nÁldás: „${last.card.m}”\n\nEz önismereti elmélkedés, nem jövőmondás, és nem helyettesít orvosi, jogi vagy pénzügyi tanácsot.`;
}
function localDarkOracleEN(q){
  const target=($("#dtName")&&$("#dtName").value.trim())||"the unnamed focus";
  const darks=drawn.filter(d=>d.darkE);
  const light=drawn.find(d=>d.card);
  if(!darks.length&&!light) return "The Mirror has not yet shown an image. Begin the spread first.";
  const strongest=[...darks].sort((a,b)=>b.lvl-a.lvl)[0];
  const darkText=darks.map((d,i)=>`${i+1}. ${d.darkE.cat==="kotes"?"Binding":"Shadow"}: ${d.darkE.n} (${d.lvl}%). Sign: ${d.darkE.j} Origin-pattern: ${d.origin.n}. Release: ${d.darkE.c}`).join("\n\n");
  const ltxt=light?`The cleansed place may be filled by ${light.card.no} · ${cardName(light.card)}: ${cardLight(light.card)} Deeper message: ${cardDeep(light.card)} Practical step: ${cardPractice(light.card)} Blessing: “${cardAffirm(light.card)}”.`:"The Card of Light remains silent; after cleansing, draw again.";
  return `The Black Mirror looked symbolically toward: “${target}”. ${q?`Your question: “${q}”.`:"Without a separate question, it searched for the pressure or recurring pattern that asks for order."}\n\nThe strongest sign now: ${strongest?strongest.darkE.n+" — "+strongest.lvl+"%":"no single sign rises above the others"}. This is not a diagnosis and not a claim about another person. In the mythic language of the cauldron, it shows where attention, boundary and cleansing may be needed.\n\n${darkText}\n\nThe way of release is simple: name what you release; give it form through paper, salt, water, candle or breath; then close with your own words: “What does not serve may depart; what has taught me may become blessing.” The Mirror does not frighten. It orders.\n\n${ltxt}\n\nThis is symbolic self-inquiry, not fortune-telling, and it does not replace professional help.`;
}
function localDarkOracle(q){
  if(cerEn()) return localDarkOracleEN(q);
  const target=($("#dtName")&&$("#dtName").value.trim())||"a megnevezetlen cél";
  const darks=drawn.filter(d=>d.darkE);
  const light=drawn.find(d=>d.card);
  if(!darks.length&&!light) return "A Tükör még nem mutatott képet. Előbb indítsd el a vetést.";
  const strongest=[...darks].sort((a,b)=>b.lvl-a.lvl)[0];
  const darkText=darks.map((d,i)=>`${i+1}. ${d.darkE.cat==="kotes"?"Kötés":"Árny"}: ${d.darkE.n} (${d.lvl}%). Jele: ${d.darkE.j} Eredete: ${d.origin.n} — ${d.origin.d} Oldása: ${d.darkE.c}`).join("\n\n");
  const ltxt=light?`A megtisztult helyet a ${light.card.no} · ${light.card.nm} fénye töltheti be: ${light.card.f} Mélyebb üzenete: ${light.card.deep||light.card.me||"a fény most fokozatosan rendez"} Gyakorlati lépés: ${light.card.practice||"válassz egy kicsi, tiszta mozdulatot"}. Megerősítése: „${light.card.m}”.`:"A Fény Lapja most csendben maradt; a tisztítás után új lapot érdemes húzni.";
  return `A Fekete Tükör jelképesen a következő célra nézett: „${target}”. ${q?`A kérdésed: „${q}”.`:"Külön kérdés nélkül is azt kereste, milyen nyomásként vagy ismétlődő mintaként érzékelhető most a helyzet."}\n\nA legerősebb jel most: ${strongest?strongest.darkE.n+" — "+strongest.lvl+"%":"nincs külön kiugró jel"}. Ez nem diagnózis és nem tényállítás más emberről; a játék mitikus nyelvén azt mutatja, mire érdemes figyelmet, határt és tisztítást adnod.\n\n${darkText}\n\nA rendező út egyszerű: először nevezd meg, milyen érzést vagy mintát engedsz el; másodszor adj neki formát — papír, só, víz, gyertya vagy hang; harmadszor zárd le egy saját mondattal: „Ami nem szolgál, távozzék; ami tanított, áldássá váljon.” Nem kell félelemmel dolgozni. A Tükör nem ijesztget, hanem rendszerez.\n\n${ltxt}\n\nÁldás: a fény ne harcoljon az árnnyal — csak legyen jelen olyan tisztán, hogy az árnyék elveszítse alakját.\n\nEz önismereti, jelképes munka, nem jövőmondás, és nem helyettesít szakmai segítséget.`;
}
function readingPromptCards(){
  return drawn.map((d,i)=>{
    const pos=currentSpread.pos[i]||`${i+1}. hely`;
    if(d.darkE){
      return `${i+1}. ${pos}: ${d.darkE.cat==="kotes"?"Kötés":"Árny"} — ${d.darkE.n} (${d.lvl}%). Eredet: ${d.origin.n}. Jelentés: ${d.darkE.d}`;
    }
    const c=d.card,h=HOUSES[c.h]||{name:"Pakli"};
    return `${i+1}. ${pos}: ${c.no} · ${c.nm} (${h.name}${d.rev?", fordított":""}). Fő üzenet: ${c.u}. Fény/árny: ${d.rev?c.a:c.f}. Megerősítés: ${c.m}`;
  }).join("\n");
}
function buildOracleAiPrompt(q,oracleText){
  const integration=integrationText();
  const moon=window.CERIDWEN_MOON?currentMoonLens(drawn.find(d=>d.card)?.card||{}):null;
  return `Kérlek, elemezd mélyebben az alábbi önismereti kártyaolvasatot. Ne kezeld jövőmondásként és ne adj orvosi, jogi, pénzügyi vagy terápiás tanácsot. Segíts abban, hogy milyen belső mintákat, kérdéseket, döntési pontokat és gyakorlati lépéseket érdemes észrevennem.

KONTEXTUS
Rendszer: Hello It’s Me · Ceridwen Üstje
Vetés: ${currentSpread.nm}
Kérdés / élethelyzet: ${q||"nem adtam meg külön kérdést"}
${moon?`Mai hold szerinti árnyalat: ${moon.phase} — ${moon.text}
`:""}
LAPOK
${readingPromptCards()}

A PAPNŐ OLVASATA
${oracleText}
${integration?`
SAJÁT INTEGRÁCIÓ
${integration}
`:""}
KÉRLEK ÍGY ELEMZD
1. Foglald össze 5-7 mondatban a fő mintát.
2. Mutasd meg, mi lehet a legfontosabb belső kérdés.
3. Nevezz meg 3 lehetséges vakfoltot vagy önáltatást, óvatos, támogató nyelven.
4. Adj 3 konkrét, hétköznapi lépést a következő 24-72 órára.
5. Írj egy rövid, tiszta zárómondatot, amit magammal vihetek.`;
}
function setOraclePrompt(q,oracleText){
  const wrap=$("#oraclePromptWrap"), txt=$("#oraclePromptText");
  if(!wrap||!txt)return;
  txt.value=buildOracleAiPrompt(q,oracleText);
  wrap.classList.add("on");
}
async function copyTextToClipboard(text){
  const value=String(text||"");
  if(!value.trim()) return false;
  if(navigator.clipboard&&window.isSecureContext){
    try{await navigator.clipboard.writeText(value);return true;}catch(e){}
  }
  const ta=document.createElement("textarea");
  ta.value=value;ta.setAttribute("readonly","");
  ta.style.position="fixed";ta.style.top="0";ta.style.left="-9999px";ta.style.opacity="0";
  document.body.appendChild(ta);
  ta.focus({preventScroll:true});ta.select();ta.setSelectionRange(0,ta.value.length);
  let ok=false;try{ok=document.execCommand("copy");}catch(e){ok=false;}
  ta.remove();return !!ok;
}
$("#copyOraclePromptBtn")?.addEventListener("click",async()=>{
  const btn=$("#copyOraclePromptBtn"), txt=$("#oraclePromptText")?.value||"";
  if(!txt)return;
  const ok=await copyTextToClipboard(txt);
  if(btn){btn.textContent=ok?"Elemző prompt másolva ✓":"Másolási hiba";setTimeout(()=>btn.textContent="Elemző prompt másolása",ok?1800:2600);}
});
$("#oracleBtn")?.addEventListener("click",()=>{
  const out=$("#oracleOut");
  out.className="oracle-out thinking";
  out.textContent="A Papnő a tűz fölé hajol, és a lapokat fürkészi…";
  $("#oracleBtn").disabled=true;
  const q=getCleanQuestion("#question");
  const opw=$("#oraclePromptWrap"); if(opw) opw.classList.remove("on");
  setTimeout(()=>{
    out.className="oracle-out";
    out.textContent=currentSpread.dark?localDarkOracle(q):localNormalOracle(q);
    setOraclePrompt(q,out.textContent);
    $("#oracleBtn").disabled=false;
    setTimeout(()=>out.scrollIntoView({behavior:"smooth",block:"start"}),80);
  },220);
});

/* ==================== JOURNAL ==================== */
$("#saveBtn")?.addEventListener("click",()=>{
  const oracleText = $("#oracleOut").className==="oracle-out" ? $("#oracleOut").textContent : "";
  journal.unshift({
    ...createJournalMeta("reading"),
    date:new Date().toLocaleString(cerEn()?"en-GB":"hu-HU",{dateStyle:"long",timeStyle:"short"}),
    spread:currentSpread.nm,
    q:$("#question").value.trim(),
    integration:integrationText(),
    cards:drawn.map((d,i)=>d.darkE?`${currentSpread.pos[i]}: ${d.darkE.n} (${d.origin.n}, ${d.lvl}%)`:`${currentSpread.pos[i]}: ${d.card.nm}${d.rev?" (fordított)":""}`),
    text:oracleText
  });
  renderJournal();journalPersist();
  $("#saveBtn").textContent="Elmentve ✓";
  setTimeout(()=>$("#saveBtn").textContent="Mentés a naplóba",2000);
});
function renderJournal(){
  const list=$("#journalList");
  if(!journal.length){list.innerHTML=`<div class="journal-empty">${cerEn()?"The journal is still empty — in Avalon’s mist, every story begins with a blank page.":"A napló még üres — Avalon ködében minden történet első lapja fehér."}</div>`;return;}
  list.innerHTML=journal.map((j,idx)=>`
    <div class="jentry">
      <div class="jdate">${esc(journalDisplayDate(j))}</div>
      <h4>${esc(j.spread||"")}</h4>
      ${j.q?`<div class="jq">„${esc(j.q)}”</div>`:""}
      <div class="jcards">${(j.cards||[]).map(esc).join(" · ")}</div>
      ${j.integration?`<details><summary>${cerEn()?"Integration":"Integráció"}</summary><div class="jtext">${esc(j.integration)}</div></details>`:""}
      ${j.text?`<details><summary>${cerEn()?"The Priestess’s reading":"A Papnő olvasata"}</summary><div class="jtext">${esc(j.text)}</div></details>`:""}
      <div class="jmeta">${esc(cerEn()?"Draw ID":"Húzásazonosító")}: ${esc(j.drawId||"legacy")} · ${esc(cerEn()?"Engine":"Motor")}: ${esc(j.engineVersion||"legacy")} · ${esc(cerEn()?"Mode":"Mód")}: ${esc(j.randomMode||"legacy")}</div><div style="margin-top:12px"><button type="button" class="btn ghost jdel" data-j="${idx}" style="padding:7px 16px;font-size:12px">${cerEn()?"Delete entry":"Bejegyzés törlése"}</button></div>
    </div>`).join("");
  list.querySelectorAll(".jdel").forEach(b=>b.addEventListener("click",()=>{
    journal.splice(+b.dataset.j,1);renderJournal();journalPersist();
  }));
}
renderJournal();
$("#copyJournalBtn")?.addEventListener("click",()=>{
  if(!journal.length) return;
  const txt=journal.map(j=>`=== ${j.spread} — ${journalDisplayDate(j)} ===\n${cerEn()?"Draw ID":"Húzásazonosító"}: ${j.drawId||"legacy"} | ${cerEn()?"Engine":"Motor"}: ${j.engineVersion||"legacy"} | ${cerEn()?"Mode":"Mód"}: ${j.randomMode||"legacy"}\n${j.q?(cerEn()?"Question: ":"Kérdés: ")+j.q+"\n":""}${cerEn()?"Cards: ":"Lapok: "}${(j.cards||[]).join(" · ")}\n${j.text?"\n"+j.text+"\n":""}`).join("\n");
  const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();
  try{document.execCommand("copy");}catch(e){}
  document.body.removeChild(ta);
  $("#copyJournalBtn").textContent="Vágólapra másolva ✓";
  setTimeout(()=>$("#copyJournalBtn").textContent="Napló másolása vágólapra",2000);
});
let clearArm=false;
$("#clearJournalBtn")?.addEventListener("click",()=>{
  if(!journal.length)return;
  if(!clearArm){clearArm=true;$("#clearJournalBtn").textContent="Biztos? Kattints még egyszer";
    setTimeout(()=>{clearArm=false;$("#clearJournalBtn").textContent="Napló törlése";},3000);return;}
  clearArm=false;journal=[];renderJournal();journalPersist();
  $("#clearJournalBtn").textContent="Napló törölve ✓";
  setTimeout(()=>$("#clearJournalBtn").textContent="Napló törlése",2000);
});
(function(){
  const n=document.getElementById("journalNote");
  if(n)n.textContent=journalPersistOK
    ?"A napló ebben a böngészőben tárolódik — ha bezárod az oldalt és visszatérsz, itt találod. Más eszközön vagy a böngészőadatok törlése után nem érhető el; biztonsági mentéshez használd a vágólap-másolást."
    :"Ebben a környezetben a böngésző nem engedi a tartós tárolást, ezért a Napló menüpont nem jelenik meg.";
  if(!journalPersistOK){
    const jt=document.getElementById("tab-journal"), jv=document.getElementById("v-journal");
    if(jt)jt.style.display="none";
    if(jv)jv.style.display="none";
  }
})();

/* ==================== LEXICON ==================== */
function renderLexFilters(){
  const root=$("#lexFilters");
  if(!root)return;
  const filters=[["all",cerEn()?"All 76":"Mind a 76"],...Object.keys(HOUSES).map(id=>[id,houseName(id)])];
  root.innerHTML=filters.map(([id,nm])=>`<button type="button" class="chip ${id===lexHouse?'on':''}" data-h="${id}" aria-pressed="${id===lexHouse}">${nm}</button>`).join("");
  root.querySelectorAll(".chip").forEach(ch=>ch.addEventListener("click",()=>{
    lexHouse=ch.dataset.h||"all";
    renderLexFilters();
    renderLex();
  }));
}
$("#lexSearch")?.addEventListener("input",renderLex);
function activateLexCard(el){
  const c=DECK.find(card=>card.no===el?.dataset?.no);
  if(c) openModal(c,false,null);
}
const lexGridElement=$("#lexGrid");
lexGridElement?.addEventListener("click",e=>{
  const el=e.target.closest(".lexcard");
  if(el&&lexGridElement.contains(el)) activateLexCard(el);
});
lexGridElement?.addEventListener("keydown",e=>{
  if(e.key!=="Enter"&&e.key!==" ") return;
  const el=e.target.closest(".lexcard");
  if(!el||!lexGridElement.contains(el)) return;
  e.preventDefault();
  activateLexCard(el);
});
function renderLex(){
  const grid=$("#lexGrid");
  if(!grid)return;
  const q=($("#lexSearch")?.value||"").trim().toLocaleLowerCase(cerEn()?"en":"hu");
  const cards=DECK.filter(c=>(lexHouse==="all"||c.h===lexHouse)&&
    (!q || [cardName(c),cardSubtitle(c),...(cardKeys(c)||[])].some(v=>String(v).toLocaleLowerCase(cerEn()?"en":"hu").includes(q))));
  grid.innerHTML=cards.map(c=>`
    <article class="lexcard" data-no="${c.no}" tabindex="0" role="button" aria-label="${esc(cardName(c))}">
      <div class="art">${cardSVG(c)}</div>
      <div class="cardname"><div class="no">${c.no}</div><div class="nm">${esc(cardName(c))}</div><div class="rv">${esc(cardSubtitle(c))}</div></div>
    </article>`).join("") || `<div class="journal-empty" style="grid-column:1/-1">${cerEn()?"The mist hides the cards for now — try another search term.":"A köd most eltakarja a lapokat — próbálj más keresőszót."}</div>`;
  /* A kattintást stabil eseménydelegálás kezeli, így a szerveroldali/statikus tartalék lapok is működnek. */
}
renderLexFilters();
renderLex();

/* ==================== MODAL ==================== */
let modalReturnFocus=null;
function openModal(c,rev,pos){
  modalReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const hn=houseName(c.h);
  const en=cerEn();
  const imageText=en?`The image of ${cardName(c)} offers a symbolic visual doorway. Notice the first detail your attention chooses and read it as a mirror, not as a prediction.`:(c.sz||"");
  const teachingText=en?cardDeep(c):(c.me||"");
  const mythText=en?`${cardName(c)} is presented here through a Celtic-inspired mythic lens. Its symbols are used for self-inquiry rather than as a claim of historical reconstruction.`:(c.my||"");
  const loveText=en?`In relationships, ${cardName(c)} asks for clear boundaries, honest presence and one action that protects dignity on both sides.`:(c.tsz||"");
  const workText=en?`In work and abundance, this card asks you to refine priorities, remove one source of noise and make the next useful step visible.`:(c.tmu||"");
  const soulText=en?`On the inner path, let this card show what is ripening, what is ready to be released and what needs patient practice.`:(c.tle||"");
  const bodyText=en?`Notice where the body tightens, warms, softens or asks for rest. Treat the sensation as information, not as a diagnosis.`:(c.body||"");
  const ritualText=en?`Place both feet on the ground, take three slow breaths, name one thing you release and one thing you choose to protect.`:(c.ritual||"");
  $("#scroll").innerHTML=`
    <button type="button" class="close" aria-label="${en?'Close':'Bezárás'}">×</button>
    <div class="emblem">${cardSVG(c)}</div>
    <div class="mh">
      <div class="no">${c.no} · ${hn}${pos?` · ${esc(pos)}`:""}</div>
      <h3>${esc(cardName(c))}</h3>
      <div class="st">${esc(cardSubtitle(c))}</div>
    </div>
    <div class="kwrow">${cardKeys(c).map(k=>`<span class="kw">${esc(k)}</span>`).join("")}</div>
    <section><h5>${en?"Message":"Üzenet"}</h5><p>${esc(cardCore(c))}</p></section>
    <section><h5>${en?"The image of the card":"A lap képe"}</h5><p>${esc(imageText)}</p></section>
    <section><h5>${en?"Deeper teaching":"Mélyebb tanítás"}</h5><p>${esc(teachingText||cardDeep(c))}</p></section>
    <section><h5>${en?"Mythic and archetypal layer":"Mitológiai / archetípusos réteg"}</h5><p>${esc(mythText)}</p></section>
    <section><h5>${en?"Ceridwen’s deeper message":"Ceridwen mélyebb üzenete"}</h5><p>${esc(cardDeep(c))}</p></section>
    <section><h5>${en?"In the light":"Fényben"}</h5><p>${esc(cardLight(c))}</p></section>
    <section><h5>${en?"In shadow — reversed":"Árnyékban — fordítva"}</h5><p>${esc(cardShadow(c))}</p></section>
    <section><h5>${en?"Love and relationships":"Szerelem és kapcsolatok"}</h5><p>${esc(loveText)}</p></section>
    <section><h5>${en?"Work and abundance":"Munka és bőség"}</h5><p>${esc(workText)}</p></section>
    <section><h5>${en?"Soul path":"Lélekút"}</h5><p>${esc(soulText)}</p></section>
    <section><h5>${en?"Body and emotional signal":"Testi-érzelmi jel"}</h5><p>${esc(bodyText)}</p></section>
    <section><h5>${en?"Embodied practice":"Konkrét gyakorlat"}</h5><p>${esc(cardPractice(c))}</p></section>
    <section><h5>${en?"Question to carry within":"Kérdés magadhoz"}</h5><p>${esc(cardQuestion(c))}</p></section>
    <section><h5>${en?"Mini ritual":"Mini rituálé"}</h5><p>${esc(ritualText)}</p></section>
    <div class="aff">„${esc(cardAffirm(c))}”</div>`;
  const veil=$("#veil");
  veil.classList.add("on");
  veil.setAttribute("aria-hidden","false");
  veil.dispatchEvent(new CustomEvent("ceridwen:modal-open"));
  document.body.classList.add("modal-open");
  $("#scroll .close")?.addEventListener("click",closeModal);
  requestAnimationFrame(()=>$("#scroll .close")?.focus({preventScroll:true}));
}
function closeModal(){
  const veil=$("#veil");
  if(!veil?.classList.contains("on")) return;
  veil.classList.remove("on");
  veil.setAttribute("aria-hidden","true");
  veil.dispatchEvent(new CustomEvent("ceridwen:modal-close"));
  document.body.classList.remove("modal-open");
  modalReturnFocus?.focus?.({preventScroll:true});
  modalReturnFocus=null;
}
$("#veil")?.addEventListener("click",e=>{if(e.target.id==="veil")closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});

/* ============================================================
   KÖZÖS SEGÉDEK + CERIDWEN-BESZÉLGETÉS
   ============================================================ */
const gq=s=>document.querySelector(s);
const CHAT3={hist:[]};
function gChatSeed(){
  const log=gq("#gchatLog");
  if(!log||log.children.length)return;
  gChatPush("cer",cerEn()?"Sit by my fire, traveller. You are welcome at Ceridwen’s threshold. Bring the question your heart is carrying. What would you like Ceridwen’s mirror to help you see more clearly?":"Ülj a tüzemhez, vándor. Az üst terének vendége vagy — hozd azt a kérdést, amelyet a szíved hordoz. Mit szeretnél Ceridwen tükrében tisztábban meglátni?");
}
function gChatPush(role,text){
  const log=gq("#gchatLog");
  if(!log)return;
  const div=document.createElement("div");
  div.className="gmsg "+(role==="user"?"user":"cer");
  div.innerHTML=(role==="cer"?'<span class="who">Ceridwen</span>':'')+esc(text);
  log.appendChild(div);log.scrollTop=log.scrollHeight;
}
function gPickCard(){
  const c=pickOneCard(DECK,"ceridwen-chat");
  if(c) rememberCards([c.id],"ceridwen-chat");
  return c;
}
function gContextMeaning(c,msg){
  const q=(msg||"").toLowerCase();
  if(/szerelem|kapcsolat|pár|társ|család|gyerek|lány|fiú|léna|barát|anya|apa|házasság|válás/.test(q) && c.tsz)
    return {label:"A kérdés fényében", text:c.tsz};
  if(/munka|pénz|vállalkozás|projekt|karrier|üzlet|bőség|döntés|állás|ügyfél/.test(q) && c.tmu)
    return {label:"A kérdés fényében", text:c.tmu};
  if(/lélek|energia|tisztítás|félelem|szorongás|álom|út|spirit|belső|önismeret/.test(q) && c.tle)
    return {label:"A kérdés fényében", text:c.tle};
  return {label:"Fényben", text:c.f};
}
function gCardReply(msg){
  const c=gPickCard();
  const h=HOUSES[c.h]||{name:"Orákulum"};
  const cm=gContextMeaning(c,msg);
  const aboutOther=/\b(milyen energiák|rajta|benne|neki|nála|róla)\b/i.test(msg||"");
  const boundary=aboutOther
    ? "\n\nCeridwen megjegyzése: más ember belső állapotát ez nem diagnosztizálja és nem állítja tényként. A lap azt mutatja, mire érdemes neked figyelned a helyzetben."
    : "";
  return `Az üstből ez a lap emelkedett ki:

${c.no} · ${c.nm} — ${c.st}
Ház: ${h.name}
Kulcsszavak: ${c.k.join(", ")}

Jelentése:
${c.u}

${cm.label}:
${cm.text}

Mélyebb üzenete:
${c.deep||c.me||c.u}

Gyakorlati lépés:
${c.practice||c.f}

Kérdés magadhoz:
${c.question||"Mit mutat nekem ez a lap ma?"}

Árnyékoldala:
${c.a}

Mini rituálé:
${c.ritual||"Zárd le a választ egy tiszta mondattal."}

Megerősítés:
„${c.m}”${boundary}`;
}
function gChatSend(){
  const inp=gq("#gchatInput");
  const msg=inp.value.trim();
  if(!msg)return;
  inp.value="";
  gChatPush("user",msg);
  CHAT3.hist.push({role:"user",content:msg});
  gq("#gchatSend").disabled=true;
  setTimeout(()=>{
    const text=gCardReply(msg);
    gChatPush("cer",text);
    CHAT3.hist.push({role:"assistant",content:text});
    gq("#gchatSend").disabled=false;
  },220);
}
gq("#gchatSend")?.addEventListener("click",gChatSend);
gq("#gchatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")gChatSend();});
gq("#gtoDraw")?.addEventListener("click",()=>goView("draw"));
gChatSeed();

/* ============================================================
   AZ ÁRNYÉK TÜKRE — sötét energiák katalógusa és tisztítás
   ============================================================ */
const DKT={sz:"Személy",ta:"Tárgy / eszköz",la:"Otthon / lakás",va:"Vállalkozás / munkahely"};
const DARK=[
{id:"szemmel",n:"Szemmelverés",t:["sz","ta"],
 d:"Irigy vagy ártó tekintet lenyomata — a népi hagyomány legismertebb, többnyire nem is tudatos rontása.",
 j:"Hirtelen fejfájás, nyomottság, „minden kiesik a kezedből” napok.",
 c:"A hagyományos szenes-sós víz rítusa: vess három csipet sót egy pohár vízbe, körözz vele lassan a fejed fölött az óramutatóval ellentétesen, majd öntsd ki a küszöbön kívülre. Végül mosd meg az arcod hideg vízzel.",
 p:"Megelőzésnek a régiek apró piros szalagot vagy karkötőt viseltek."},
{id:"atok",n:"Átok",t:["sz","la","va"],
 d:"Tudatos, kimondott ártó szándék, amely a szavak erejével tapad meg.",
 j:"Ismétlődő balszerencse-sorozat, megmagyarázhatatlan elakadások ugyanazon a ponton.",
 c:"Írd fel az átok vélt tartalmát egy papírra, égesd el fehér gyertya lángjánál tűzálló tálban, s a hamut szórd folyóvízbe vagy szélbe e szavakkal: „Ami nem szeretetből jött, oda tér vissza, ahonnan indult — átváltoztatva.”",
 p:"Zárd megbocsátással: a harag visszaköti, amit a tűz már eloldott."},
{id:"rontas",n:"Rontás",t:["sz","ta","la"],
 d:"Tárgyon vagy helyen keresztül célzottan küldött ártás a régi hiedelemvilág szerint.",
 j:"Idegen tárgy felbukkanása a ház körül, ok nélküli rosszullét egyetlen helyiségben.",
 c:"A gyanús tárgyat ne puszta kézzel fogd: szórd körbe sóval, csomagold papírba, és vidd ki a házból. A helyiséget söpörd ki az ajtó irányába, majd mosd fel sós-ecetes vízzel.",
 p:"A küszöbre húzott vékony sóvonal a hagyomány szerint megfogja az ismétlést."},
{id:"irigyseg",n:"Az Irigység Köde",t:["sz","va"],
 d:"Nem tudatos ártás: a feléd irányuló sóvárgó figyelem szürke lerakódása.",
 j:"Siker utáni hirtelen fáradtság; kedvetlenség épp a jó hírek után.",
 c:"Gyújts zsálya- vagy citromfűfüstöt, és járd körbe magad vagy a teret, közben mondd: „Ami az enyém, azt hálával őrzöm; ami másé, azt áldással engedem.”",
 p:"A sikert oszd meg okosan — a hálád legyen hangosabb, mint a dicsekvés."},
{id:"harag",n:"A Harag Lenyomata",t:["sz","ta","la"],
 d:"Veszekedések, kiabálások visszamaradt forró, tüskés energiája a falakban és tárgyakban.",
 j:"Feszültség már belépéskor; ok nélküli ingerlékenység egy bizonyos szobában.",
 c:"Nyiss ki minden ablakot negyedórára, kereszthuzattal, majd csengess végig a téren csengővel — vagy énekelj: a hang széttöri a megkeményedett haragot. Zárásként gyújts mézszínű gyertyát.",
 p:"A vitákat lehetőleg soha ne a hálószobában rendezzétek."},
{id:"banat",n:"A Bánat Fátyla",t:["sz","ta","la"],
 d:"Hosszú szomorúság vagy gyász csendes, nehéz, szürke fátyla a téren és a lelken.",
 j:"Nyomott hangulat, „sűrű levegő”; sok alvás után is fáradtság.",
 c:"Ne űzd — kísérd: gyújts fehér gyertyát annak, amit gyászolsz, mondj köszönetet, s engedd útjára. Utána hozz friss virágot a térbe, és engedd be a déli napfényt.",
 p:"A könny maga is tisztító víz — hagyd megtörténni."},
{id:"felelem",n:"A Félelem Árnyéka",t:["sz","la"],
 d:"A szorongás hideg, sarokba húzódó árnya, amely önmagát táplálja.",
 j:"Alvászavar, újkeletű tartás a sötéttől, gyomorszorítás este.",
 c:"Este járd körbe a teret gyertyával vagy lámpafénnyel, minden sarokba bevilágítva: „Fény lakik itt.” Éjszakára tégy egy tál durva sót az ágy alá, reggel öntsd ki a ház elé.",
 p:"Ha a félelem tartósan vezérli az életed, a legerősebb varázslat a kimondott szó: beszélj róla emberrel — akár segítő szakemberrel."},
{id:"vampir",n:"Energiavámpír-Kapocs",t:["sz","va"],
 d:"Kimerítő kapcsolat energiaszála, amelyen át észrevétlenül csorog el az erőd.",
 j:"Egy adott személy után rendszeres kimerültség; bűntudattal kevert kötelességérzet.",
 c:"Kapocsvágó rítus: csukott szemmel képzeld el a szálat, és Mihály fénykardjával vágd el — szeretettel: „Ami az enyém, visszatér; ami a tiéd, elengedem.” Utána zuhany, hideg vízzel zárva.",
 p:"A legjobb utóvéd a határ: tanulj meg szelíden nemet mondani."},
{id:"arny",n:"Kósza Árny",t:["ta","la"],
 d:"Helyhez vagy régi tárgyhoz tapadt lenyomat — „vendég”, aki ottfelejtette magát.",
 j:"Hűvös pontok, tárgyak „vándorlása”, nyugtalan éjszakák.",
 c:"Délben nyiss ablakot-ajtót, gyújts fehér füstölőt, és hangosan, kedvesen mondd: „Köszönöm, hogy itt voltál. Az idő lejárt — menj a fénybe, béke veled.” Zárd a rítust harangszóval vagy három tapssal.",
 p:"A megszólítás udvarias, de határozott legyen — mint a vendégnél, aki túl sokáig maradt."},
{id:"foldsugar",n:"Földsugárzás",t:["la"],
 d:"A régiek szerint vízerek és földhálók keresztezései fölött az alvás nem pihentet.",
 j:"Mindig ugyanott fáj; reggel fáradtabban kelsz; a macska imádja, a kutya kerüli a helyet.",
 c:"Told el az ágyat egy-két méterrel, és figyeld egy héten át a különbséget. A hagyomány szerint parafa lap vagy hegyikristály az ágy alatt tompítja a sugárzást.",
 p:"A legjobb műszer a saját tested — vezess alvásnaplót."},
{id:"elektro",n:"Elektroszmog-Árny",t:["ta","la"],
 d:"A folyton zümmögő eszközök láthatatlan zaja, amely szétforgácsolja a figyelmet és az éjszakát.",
 j:"Esti pörgés, reggeli fejnyomás; a telefon „odanőtt” a kézhez.",
 c:"Digitális böjt-rítus: naplemente után tedd az eszközöket egy dobozba — „aludni tértek” —, a hálószobából pedig száműzd a töltőket. Havonta tarts egy teljes képernyőmentes napot.",
 p:"A turmalin és a borostyán a hagyomány kedvelt „csendesítő” kövei az íróasztalra."},
{id:"pango",n:"Pangó Energia",t:["la","va"],
 d:"Mozdulatlanná sűrűsödött, poros áramlás — ahol semmi sem mozdul, ott semmi új sem érkezik.",
 j:"Zsúfolt sarkok, elakadt ügyek, „nem tudom, hol kezdjem” érzés.",
 c:"A nagy áramoltatás: három zsák szabálya — egy adomány, egy szemét, egy „eldöntendő”. Utána kereszthuzat, és csendíts végig a sarkokon csengővel.",
 p:"A bejárat és az ablakpárkány mindig maradjon szabad — ott lélegzik a tér."},
{id:"kuszob",n:"Küszöb-Árny",t:["la","va"],
 d:"A bejáratnál megtapadó kinti nehézség — mindaz, ami a világból ránk ragad.",
 j:"Hazaérve azonnal romló hangulat; a vendégek „furcsán” lépnek be.",
 c:"Söpörd ki a küszöböt kifelé, mosd fel sós vízzel, majd tégy a lábtörlő alá egy csipet sót és egy babérlevelet. Havonta cseréld.",
 p:"Cipőlevétel a küszöbnél — a legrégibb energiahigiénia."},
{id:"osok",n:"Ősök Árnya",t:["sz","la","va"],
 d:"Örökölt családi minta vagy teher, amely nem a tiéd, mégis te cipeled.",
 j:"Ismétlődő családi forgatókönyvek; „pont mint apád/anyád” helyzetek.",
 c:"Gyújts gyertyát az ősöknek: „Köszönöm az életet, amit adtatok. A terhet, amely nem az enyém, szeretettel visszaadom — váljék áldássá.” Tégy ki egy estére egy régi családi képet, majd tedd el békével.",
 p:"Ami a mintából a tiéd, azt te írhatod át — ez a jussod."},
{id:"szomagia",n:"Kimondott Szavak Sebe",t:["sz","va"],
 d:"Bántó szavak, ránk ragasztott címkék lenyomata, amely önbeteljesítő súllyá válik.",
 j:"Egy régi mondat visszhangzik („úgysem sikerül”); horpadás az önbizalmon.",
 c:"Írd le a bántó mondatot, húzd át, és írd fölé a saját igazságod. A régit égesd el, az újat tedd a tükröd sarkába egy hétre, és naponta mondd ki hangosan.",
 p:"A szó mágia — magadra is csak olyat mondj, amit el akarsz hinni."},
{id:"penzblokk",n:"A Bőség Elakadása",t:["va","la"],
 d:"A pénz áramlásának megrekedése — gyakran a rendezetlen terek és rendezetlen viszonyok tükre.",
 j:"Kintlévőségek, „kifolyik a pénz”; fiókok tele döglött ügyekkel.",
 c:"Bőség-rítus: rendezd a pénzügyi sarkod — számlák, tárca, fiók —, dobj ki minden lejárt papírt, majd tégy egy tál friss vizet és három érmét a bejárat közelébe egy napra: az áramlás jelét.",
 p:"A tárcád legyen rendben: a bőség szereti a tiszta helyet."},
{id:"viszaly",n:"A Viszály Magja",t:["va","la"],
 d:"Csapatban vagy családban elhintett széthúzás, amely magától terjed, akár a gyom.",
 j:"Klikkesedés, hátak mögötti beszéd, „rossz a levegő” a közös terekben.",
 c:"Kerekasztal-rítus: ültesd körbe az érintetteket, középre gyertyát, s mindenki kimondhat egy sérelmet és egy köszönetet — vita nélkül. A gyertyát együtt fújjátok el.",
 p:"A pletyka tápláléka a homály — a nyílt szó elől elpárolog."},
{id:"kimerultseg",n:"A Kimerültség Szürkéje",t:["sz","va"],
 d:"A hosszan túlfeszített erő fakó, mindent belepő hamuja.",
 j:"Reggeli üresség, örömtelen hajtás, „csak túlélni a hetet” üzemmód.",
 c:"Hamu-rítus: írj listát mindarról, amit cipelsz, és jelöld meg, mi tartozik valóban rád. A többit égesd el, a hamut szórd a földbe — hadd komposztálódjon. Utána egy teljes pihenőnap, bűntudat nélkül.",
 p:"A pihenés nem jutalom, hanem alapkő — és ha a kiégés mély, kérj emberi, akár szakmai segítséget is."},
{id:"targyemlek",n:"Tárgy-Emlék",t:["ta"],
 d:"Használt vagy örökölt tárgyra tapadt előző történet lenyomata.",
 j:"A tárgy „nem áll kézre”; furcsa érzés, valahányszor megfogod.",
 c:"Fektesd a tárgyat egy éjszakára durva sóágyra (ami sóérzékeny, azt csak mellé), majd tartsd telihold fényébe vagy déli napra egy órára: „Új történet kezdődik veled.”",
 p:"Vásárolt régiséget mindig tisztíts meg, mielőtt a hálószobába kerül."},
{id:"ismeretlen",n:"Ismeretlen Erő",t:["sz","ta","la","va"],
 d:"Árny, amelynek se neve, se arca — a Tükör csak annyit mutat: valami figyelmet kér.",
 j:"Megfoghatatlan nyomás; „valami nem stimmel” érzés, amelyre nincs magyarázat.",
 c:"A Nagy Tisztítás mind a négy elemmel: só a sarkokba (föld), teljes átszellőztetés (levegő), fehér gyertya körbevitele (tűz), sós vizes felmosás vagy zuhany (víz). Végül hang — csengő, taps vagy ének — és a kimondott szándék: „Ami nem a fényből való, távozzék; ami a fényből való, maradjon.”",
 p:"Ha az érzés tartósan nyomaszt, ne csak a térrel foglalkozz: oszd meg megbízható emberrel — vagy segítő szakemberrel. Az ismeretlen erő legjobb ellenszere a megosztott szó."},
{id:"lelekszerzodes",cat:"kotes",n:"Lélekszerződés-Kötés",t:["sz"],
 d:"Régi, lélekszinten kötött megállapodás, amely egykor szolgált — mára béklyóvá vált.",
 j:"Visszatérő „nem szabad” érzés ott, ahol szabadon dönthetnél; megmagyarázhatatlan kötelességtudat.",
 c:"Szerződésbontó rítus: írd le, mit érzel kötelezőnek, majd gyertyafénynél mondd ki: „Minden szerződést, amely már nem a legfőbb javamat szolgálja, szeretettel felbontok. A tanulságot megtartom, a béklyót elengedem.” A papírt égesd el.",
 p:"A bontás nem hálátlanság — a lélek fejlődésének joga."},
{id:"fogadalom",cat:"kotes",n:"Régi Fogadalom Kötése",t:["sz","va"],
 d:"Egykor tett fogadalom — szegénységi, hallgatási, magányossági — lenyomata, amely máig szabályoz.",
 j:"Láthatatlan fal a bőség vagy a kimondás előtt; makacs „nem érdemlem” érzés.",
 c:"Fogadalom-oldás: nevezd meg hangosan („feloldom a szegénységi fogadalmat…”), köszönd meg egykori védelmét, és cseréld új fogadalomra, amely a mai életedet szolgálja.",
 p:"Az új fogadalom legyen pozitív és jelen idejű — a lélek szó szerint veszi."},
{id:"szerelmi",cat:"kotes",n:"Szerelmi Kötés",t:["sz"],
 d:"Akarattal vagy sóvár vággyal font érzelmi háló, amely a szabad vonzalom helyére kényszert ültet.",
 j:"Se veled, se nélküled örvény; visszahúzás egy rég lezárt kapcsolatba, józan ész ellenére.",
 c:"Rózsaszín gyertyás oldás: két gyertya — te és ő — egymástól lassan távolítva három estén át, közben: „Szabadon szeretlek, szabadon engedlek.” A maradék viaszt ásd a föld alá.",
 p:"Az igaz kötelék nem kötés — ami csak kötve marad meg, sosem volt a tiéd."},
{id:"karmikus",cat:"kotes",n:"Karmikus Kötelék",t:["sz"],
 d:"Több életen átívelő lecke-kapcsolat, amely addig tér vissza, míg a tanulság meg nem születik.",
 j:"Első látásra ismerős, mégis viharos kapcsolatok; ugyanaz a dráma új szereposztásban.",
 c:"Kör-lezáró rítus: írd le, mit tanított a kapcsolat, mondj köszönetet érte, és jelentsd ki: „A leckét megtanultam, a kört lezárom.” Rajzolj egy kört, és húzd át — a mozdulat pecsét.",
 p:"A karma nem büntetés, hanem tananyag — és a vizsga letehető."},
{id:"koldok",cat:"kotes",n:"Családi Köldökzsinór-Kötés",t:["sz"],
 d:"Szülő és gyermek közti energetikai köldökzsinór, amely felnőttkorban már nem táplál, hanem függést tart fenn.",
 j:"Felnőttként is engedélykérés; a szülő hangja dönt a fejedben, a sajátod helyett.",
 c:"Ezüst-zsinór rítus: képzeld el a zsinórt, köszönd meg, ami rajta érkezett, majd szeretettel válaszd le, és mindkét végét kösd fény-csomóra: „Kapcsolat marad — függés nem.”",
 p:"A leválás nem szeretetlenség: az éretlen kötés érett szeretetté váltása."},
{id:"eskulanc",cat:"kotes",n:"Eskü- és Átoklánc",t:["sz","la","va"],
 d:"Nemzedékeken át öröklődő eskü- vagy átoklánc, amelyet már senki sem tudja, ki kezdett.",
 j:"Családi sorsismétlés: ugyanaz a betegség-, válás- vagy csődminta nemzedékről nemzedékre.",
 c:"Lánctörő rítus: gyújts annyi mécsest, ahány nemzedékre visszalátsz, és oltsd el őket sorban, mindegyiknél kimondva: „A láncot itt megszakítom — helyette áldást küldök vissza és előre.”",
 p:"Egyetlen tudatos tag az egész láncot megszakíthatja — legyél te az."},
{id:"fuggosegi",cat:"kotes",n:"Függőségi Kötés",t:["sz","ta"],
 d:"Szokáshoz, szerhez, képernyőhöz vagy személyhez tapadó, az akaratot megkerülő energiaszál.",
 j:"A „csak még egyszer” hangja; üresség, amelyet a tárgy csak pillanatokra tölt be.",
 c:"Helyettesítő rítus: a sóvárgás percében tégy tudatosan egy apró jó mozdulatot — víz, friss levegő, három mély lélegzet —, és mondd: „A szálat fénnyé alakítom.” A tárgyat tartsd külön „pihenőhelyen”, ne kéznél.",
 p:"A mély függőség nem szégyen, hanem seb — gyógyításához kérj emberi és szakmai segítséget is; a rítus kísérő, nem helyettesítő."},
{id:"helykotes",cat:"kotes",n:"Hely-Kötés",t:["sz","la"],
 d:"A lelket vagy a figyelmet egy helyhez láncoló kötés — régi házhoz, városhoz, egyetlen szobához.",
 j:"Képtelenség továbblépni egy helyről; álmok, amelyek makacsul mindig ugyanoda visznek.",
 c:"Búcsú-rítus: látogasd meg — akár csak képzeletben — a helyet, járd be, köszönj el minden sarkától, és hozz el egyetlen jelképes emléket. A többit hagyd ott, áldással.",
 p:"A hely a szívedben elfér — a lábadat nem kell fognia."},
{id:"targyhorgony",cat:"kotes",n:"Tárgy-Horgony",t:["ta","sz"],
 d:"Tárgyba sűrített érzelmi horgony, amely a múlt egyetlen pontjához rögzít.",
 j:"Nem tudsz megválni tőle, pedig fáj ránézni; a lakás lassan múzeummá válik.",
 c:"Horgony-emelés: fényképezd le a tárgyat — az emlék így megmarad —, köszönd meg a szolgálatát, és add tovább vagy engedd el. Ha maradnia kell, szenteld újra: új hely, új feladat.",
 p:"Az emlék a tiéd — a horgony a tengeré."},
{id:"arnycsap",cat:"kotes",n:"Árny-Csáp",t:["sz","la"],
 d:"Idegen, tapadó energiacsáp, amely a hiedelem szerint gyenge, kimerült pillanatban akaszkodik meg.",
 j:"Hirtelen, nem a sajátodnak érződő gondolatok; hangulat-beesés zsúfolt helyek után.",
 c:"Fénypajzs-rítus: zuhany után képzelj magad köré arany tojáshéj-burkot: „Ami nem az enyém, kívül marad; ami az enyém, belül ragyog.” Ismételd három napon át, reggel és este.",
 p:"Tömeg után egy perc tudatos „leporolás” — mint kabátról a havat."},
{id:"implantatum",cat:"kotes",n:"Implantátum-Lenyomat",t:["sz"],
 d:"Az ezoterikus hagyomány szerint más dimenzióból származó, beültetett energialenyomat, amely idegen mintákat sugall.",
 j:"Nem a te hangodon szóló, visszatérő gondolathurok; idegennek érződő késztetések.",
 c:"Fény-kioldás: meditációban keresd meg a lenyomat helyét a testérzeteidben, csomagold arany fénybe, és kérd a legmagasabb jóra: „Ami nem a lelkem terve, oldódjon fénnyé.” Zárd földeléssel: talpad a földön, három mély lélegzet.",
 p:"Ne félelemmel, hanem szuverenitással: a te tered — te döntöd el, mi marad benne."},
{id:"fatyol",cat:"kotes",n:"Fátyol-Kötés",t:["sz"],
 d:"A belső látást elhomályosító fátyol, amely a tisztánlátást és a döntést tompítja.",
 j:"Örökös tanácstalanság-köd; mások mindig „jobban tudják”, mit akarsz.",
 c:"Fátyol-lebbentő rítus: egy héten át minden reggel tedd fel írásban ugyanazt a kérdést — „Mit akarok ma valójában?” —, és válaszolj három mondatban, cenzúra nélkül. A hetedik napon olvasd össze: a fátyol mögött ott a mintázat.",
 p:"A tisztánlátás izom — naponta edzhető."},
{id:"ismeretlenkotes",cat:"kotes",n:"Ismeretlen Kötés",t:["sz","ta","la","va"],
 d:"Kötés, amelynek forrása a Tükör előtt is rejtve marad — csak a húzása érződik.",
 j:"Megnevezhetetlen visszatartó erő; „mintha gumiszalag rántana vissza” érzés minden nekifutásnál.",
 c:"Univerzális kötésoldó: fürdő durva sóval, majd Mihály fénykardjának rítusa — képzeletben vágd el magad körül, teljes körben, az összes nem fényből való szálat: „Minden kötést, amely nem a legfőbb javamat szolgálja, most elvágok — ismert és ismeretlen forrásút egyaránt.” Zárd hálával és földeléssel.",
 p:"Ha a húzás tartós és nyomasztó, oszd meg emberrel — akár segítő szakemberrel; a kimondás maga is kötésoldás."}
];


function darkIncantation(e){
  const en=cerEn();
  const frames=[
    {hu:`A hét elem tanúságában: föld tartson, víz mosson, levegő vigyen, tűz alakítson át. ${e.n}, elveszem tőled a döntés jogát; a tanítást megtartom, a terhet elengedem.`,en:`Before the seven elements: earth hold me, water wash me, air carry away, fire transform. ${darkName(e)}, I take back the right to choose; I keep the lesson and release the burden.`},
    {hu:`Kört vonok magam köré, ahogy a gael caim oltalmazó köre őriz. ${e.n}, ami nem szolgálja az életet, oldódj fel; ami igaz, maradjon tisztán.`,en:`I make a sheltering circle, in the manner of the Gaelic caim. ${darkName(e)}, what does not serve life may loosen; what is true may remain clear.`},
    {hu:`Brigid tiszta tüze előtt kimondom: ${e.n}, nem harcolok veled és nem táplállak tovább. Fénnyé alakul a kötés, bölcsessé a tapasztalat, szabaddá a következő lépés.`,en:`Before Brigid's clear flame I say: ${darkName(e)}, I neither fight you nor feed you further. Let binding become light, experience become wisdom, and the next step become free.`},
    {hu:`A forrás vizével és a küszöb tiszta szavával: ${e.n}, ami az enyém, térjen vissza megtisztulva; ami nem az enyém, távozzék békében. Én itt és most a tiszta irányt választom.`,en:`By the water of the well and the clear word at the threshold: ${darkName(e)}, let what is mine return cleansed, and what is not mine depart in peace. Here and now I choose the clear direction.`}
  ];
  let h=0; for(const ch of e.id) h=(h*31+ch.charCodeAt(0))>>>0;
  return frames[h%frames.length][en?'en':'hu'];
}
function darkIncantationPanel(e,uid){
  const en=cerEn(), text=darkIncantation(e);
  return `<div class="shadow-incantation" data-shadow-ritual="${esc(uid)}">
    <h5>${en?'Cleansing words and intention':'Tisztító szó és szándék'}</h5>
    <p class="shadow-incantation__text">„${esc(text)}”</p>
    <p class="small-note">${en?'Say it silently or aloud, then press the button. This is a symbolic intention practice. The wording is a modern adaptation built from documented Gaelic motifs such as the protective caim, sacred fire, well-water and elemental purification; it is not presented as a verbatim ancient spell.':'Mondd ki magadban vagy hangosan, majd nyomd meg a gombot. Ez jelképes szándékgyakorlat. A szöveg dokumentált gael motívumokra — oltalmazó caim-körre, szent tűzre, forrásvízre és elemi tisztításra — épülő mai alkalmazás, nem szó szerinti ókori varázsige.'}</p>
    <button type="button" class="btn ghost shadow-intent-btn">${en?'Begin the cleansing intention':'A tisztító szándék elindítása'}</button>
    <div class="shadow-intent-status" aria-live="polite"></div>
  </div>`;
}
document.addEventListener('click',e=>{
  const btn=e.target.closest('.shadow-intent-btn'); if(!btn)return;
  const box=btn.closest('.shadow-incantation'); const out=box?.querySelector('.shadow-intent-status');
  btn.disabled=true; btn.classList.add('is-active');
  if(out) out.textContent=cerEn()?'The intention has begun. Breathe three slow breaths and let the words settle.':'A szándék elindult. Vegyél három lassú lélegzetet, és hagyd leülepedni a szavakat.';
  setTimeout(()=>{btn.disabled=false;btn.classList.remove('is-active')},1800);
});

let dkTarget=null;
gq("#dkTargets").innerHTML=Object.entries(DKT).map(([id,l])=>
  `<button type="button" class="sit-btn" data-t="${id}"><h4>${l}</h4><p>${{sz:"Rád vagy valakire, akiért aggódsz.",ta:"Telefon, autó, ékszer, örökölt holmi…",la:"Szoba, lakás, ház, kert.",va:"Üzlet, iroda, csapat, projekt."}[id]}</p></button>`).join("");
document.querySelectorAll("#dkTargets .sit-btn").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#dkTargets .sit-btn").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");dkTarget=b.dataset.t;window.dkTargetChosen=true;gq("#dkScan").disabled=!window.ritualDone;
}));

gq("#dkScan")?.addEventListener("click",()=>{
  if(!dkTarget)return;
  const name=gq("#dkName").value.trim();
  const mir=gq("#dkMirror");
  gq("#dkResults").innerHTML="";gq("#dkResults").classList.remove("sweep");
  gq("#dkBless").classList.remove("on");
  mir.classList.add("scan");
  gq("#dkScan").disabled=true;
  setTimeout(()=>{
    mir.classList.remove("scan");
    gq("#dkScan").disabled=false;
    /* árnyak sorsolása */
    let pool=DARK.filter(e=>e.t.includes(dkTarget)&&!e.id.startsWith("ismeretlen"));
    pool=secureShuffle(pool);
    const n=2+(randBool()?1:0);
    const picks=pool.slice(0,n);
    if(randBool(0.18)){const unk=DARK.filter(e=>e.id.startsWith("ismeretlen"));picks[picks.length-1]=unk[randInt(unk.length)];}
    const withLvl=picks.map(e=>({e,lvl:randRange(25,90),o:pickOrigin()}));
    const title=name?`„${esc(name)}”`:DKT[dkTarget].toLowerCase();
    gq("#dkResults").innerHTML=
      `<p class="lede" style="margin-bottom:22px">A Tükör felszíne elsimul… ${title} körül ${withLvl.length} árny mutatkozik.</p>`+
      withLvl.map(({e,lvl,o})=>`
      <div class="dk-energy">
        <h4>${esc(e.n)} <span style="font-size:.7em;color:var(--mist)">· ${e.cat==="kotes"?"kötés":"árny"}</span></h4>
        <div class="lvl">Árnyékszint: ${lvl}%</div>
        <div class="dk-bar"><i style="width:${lvl}%"></i></div>
        <p>${esc(e.d)}</p>
        <h5>Jelek</h5><p>${esc(e.j)}</p>
        <h5>Eredet</h5><p><strong style="color:var(--blossom);font-weight:600">${esc(o.n)}.</strong> ${esc(o.d)} ${esc(o.fix)}</p>
        <h5>Tisztító gyakorlat</h5><p>${esc(e.c)}</p>
        <h5>A Papnő tippje</h5><p>${esc(e.p)}</p>
        ${darkIncantationPanel(e,`scan-${e.id}`)}
      </div>`).join("")+
      `<div class="controls" style="margin-top:6px"><button type="button" class="btn" id="dkClean">A tisztítás elvégzése</button></div>`;    gq("#dkClean")?.addEventListener("click",()=>{
      gq("#dkResults").classList.add("sweep");
      document.querySelectorAll("#dkResults .dk-bar i").forEach(i=>i.style.width="0%");
      gq("#dkClean").disabled=true;
      setTimeout(()=>{
        const bl=gq("#dkBless");
        bl.innerHTML=`<h4>A tér kitisztult</h4>
          <p>Az árnyak elengedve, a fény visszahívva. ${name?("„"+esc(name)+"” fölött "):""}mostantól a te figyelmed a legerősebb őrző: a rítust ismételd, valahányszor a jelek visszatérnek — a tisztaság nem állapot, hanem gyakorlat.</p>
          <p style="margin-top:10px;font-family:var(--f-serif);font-style:italic;color:var(--blossom)">„Ami a fényből való, maradjon.”</p>`;
        bl.classList.add("on");
        bl.scrollIntoView({behavior:"smooth",block:"center"});
      },1500);
    });
  },1600);
});

/* Árnyak Lexikona */
let dkFilter="all";
function darkTopicName(id){
  if(!cerEn())return DKT[id]||id;
  const map={kapcsolat:"Relationship",munka:"Work",csalad:"Family",otthon:"Home",test:"Body",lelek:"Inner path",hatar:"Boundaries",energia:"Energy",mult:"Past",felelem:"Fear",onkep:"Self-image",kommunikacio:"Communication"};
  return map[id]||DKT[id]||id;
}
function dkRenderFilters(){
  const root=gq("#dkFilters");if(!root)return;
  const base=[["all",cerEn()?"All 33":"Mind a 33"],["cat:arny",cerEn()?"Shadows":"Árnyak"],["cat:kotes",cerEn()?"Bindings":"Kötések"]];
  root.innerHTML=[...base,...Object.keys(DKT).map(id=>[id,darkTopicName(id)])].map(([id,l])=>
    `<button type="button" class="chip ${id===dkFilter?'on':''}" data-f="${id}" aria-pressed="${id===dkFilter}">${l}</button>`).join("");
  root.querySelectorAll(".chip").forEach(ch=>ch.addEventListener("click",()=>{
    dkFilter=ch.dataset.f||"all";
    dkRenderFilters();
    dkRenderGrid();
  }));
}
function dkRenderGrid(){
  const grid=gq("#dkGrid");if(!grid)return;
  const list=DARK.filter(e=>dkFilter==="all"||(dkFilter==="cat:arny"&&e.cat!=="kotes")||(dkFilter==="cat:kotes"&&e.cat==="kotes")||e.t.includes(dkFilter));
  grid.innerHTML=list.map(e=>`
    <article class="house-card dk-grid-card" data-dk="${e.id}" tabindex="0" role="button" aria-label="${esc(darkName(e))}">
      <h3>${esc(darkName(e))}</h3>
      <p>${esc(darkDesc(e))}</p>
      <div class="tgs">${cerEn()?(e.cat==="kotes"?"Binding":"Shadow"):(e.cat==="kotes"?"Kötés":"Árny")} · ${e.t.map(t=>darkTopicName(t)).join(" · ")}</div>
    </article>`).join("") || `<div class="journal-empty" style="grid-column:1/-1">${cerEn()?"No shadow cards match this theme.":"Ehhez a témához most nem tartozik árnylap."}</div>`;
  grid.querySelectorAll(".dk-grid-card").forEach(el=>{
    const act=()=>{const e=DARK.find(e=>e.id===el.dataset.dk);if(e)dkModal(e,pickOrigin(),randRange(25,90))};
    el.addEventListener("click",act);
    el.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();act();}});
  });
}
dkRenderFilters();
dkRenderGrid();

function originName(o){return cerEn()?(o.en?.n||"Symbolic origin"):o.n}
function originDesc(o){return cerEn()?(o.en?.d||"A symbolic layer whose present effect matters more than certainty about its source."):o.d}
function originFix(o){return cerEn()?(o.en?.fix||"Return to the body, the boundary and one grounded next step."):o.fix}
function darkName(e){return cerEn()?(e.en?.n||((e.cat==="kotes"?"Binding":"Shadow")+" pattern")):e.n}
function darkDesc(e){return cerEn()?(e.en?.d||"A recurring inner pattern that may narrow attention, choice or connection. Read it as a mirror for self-inquiry, not as a diagnosis."):e.d}
function darkSigns(e){return cerEn()?(e.en?.j||"Repeated tension, circular thinking, weakened boundaries, avoidance or the sense of being pulled away from your own centre."):e.j}
function darkRelease(e){return cerEn()?(e.en?.c||"Name the pattern, ground the body, choose one boundary, and repeat one different action for seven days."):e.c}
function darkTip(e){return cerEn()?(e.en?.p||"Do not fight the shadow. Give it enough clear attention that it no longer needs to choose in your place."):e.p}
function dkModal(e,origin,lvl){
  const en=cerEn();
  const cat=en?(e.cat==="kotes"?"Binding":"Shadow"):(e.cat==="kotes"?"Kötés":"Árny");
  $("#scroll").innerHTML=`
    <button type="button" class="close" aria-label="${en?'Close':'Bezárás'}">×</button>
    <div class="emblem">${darkSVG(e)}</div>
    <div class="mh"><div class="no">${cat} · ${lvl}%</div><h3>${esc(darkName(e))}</h3></div>
    <section><h5>${en?'What is this?':'Mi ez?'}</h5><p>${esc(darkDesc(e))}</p></section>
    <section><h5>${en?'Signs':'Jelek'}</h5><p>${esc(darkSigns(e))}</p></section>
    <section><h5>${en?'Origin layer':'Eredet'}</h5><p><strong>${esc(originName(origin))}.</strong> ${esc(originDesc(origin))} ${esc(originFix(origin))}</p></section>
    <section><h5>${en?'Release and cleansing practice':'Megszüntetés — tisztító gyakorlat'}</h5><p>${esc(darkRelease(e))}</p></section>
    <section><h5>${en?'The Priestess’ guidance':'A Papnő tippje'}</h5><p>${esc(darkTip(e))}</p></section>`;
  const veil=$("#veil");
  veil.classList.add("on");
  veil.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  veil.dispatchEvent(new CustomEvent("ceridwen:modal-open"));
  $("#scroll .close")?.addEventListener("click",closeModal);
  requestAnimationFrame(()=>$("#scroll .close")?.focus({preventScroll:true}));
}
const ORIGINS_RAW=[
 {w:.34,n:"Jelen élet",d:"Ebben az életedben, konkrét helyzethez vagy személyhez köthetően tapadt meg.",fix:"A leírt tisztító rítus önmagában elegendő — jó eséllyel a kiváltó helyzet is felismerhető és rendezhető."},
 {w:.20,n:"Előző élet",d:"Régi életből hozott lenyomat, amely a lélek emlékezetében utazott veled.",fix:"A rítust egészítsd ki lélek-visszahívással: „Minden erőm és részem térjen haza a jelenbe” — és fogalmazd meg a tanulságot, amelyet a régi történet hordozott."},
 {w:.13,n:"Párhuzamos élet",d:"A hagyomány szerint egy párhuzamosan futó életszálról átszűrődő minta.",fix:"A kulcs az integráció: a minta nem hibád, hanem átszüremlés — mondd ki tudatosan, mi tartozik ehhez az életedhez, és mi nem."},
 {w:.12,n:"Más galaxis",d:"A csillag-hagyomány szerint távoli csillagrendszerből eredő lenyomat — csillag-emlék.",fix:"A rítust végezd csillagos ég alatt (vagy annak belső képével), és zárd csillag-fohásszal: „Ami a csillagokból jött, térjen vissza a fénybe.”"},
 {w:.09,n:"Más univerzum",d:"A fátylakon túlról, egy másik teremtésből átcsúszott lenyomat — a legritkább eset.",fix:"Itt a Forrás-fohász segít: emeld az egészet a legmagasabb fényhez, és kérd, hogy térjen oda, ahová tartozik — a te dolgod az elengedés, nem a megértés."},
 {w:.12,n:"Ismeretlen eredet",d:"A Tükör nem mutatja meg, honnan érkezett — és ez így is rendben van.",fix:"Használd az univerzális kötésoldót és a négy elem Nagy Tisztítását: az eredet ismerete nélkül is teljes az oldás, ha a szándék tiszta."}
];
const ORIGINS=ORIGINS_RAW.map((o,i)=>Object.assign(o,{en:[
{n:"Present life",d:"A pattern learned through current relationships, environments or repeated choices.",fix:"Release it through a clear boundary and one new repeated action."},
{n:"Ancestral line",d:"A family or inherited pattern that may have been carried without being consciously chosen.",fix:"Honour the lesson, then choose what does not need to continue through you."},
{n:"Symbolic past-life layer",d:"A mythic way of naming an old-feeling pattern; treat it as metaphor rather than historical fact.",fix:"Work with the emotion and behaviour that are present now."},
{n:"Parallel possibility",d:"A symbolic image of roads not taken and identities that still influence your imagination.",fix:"Return attention to the choice available in this life, today."},
{n:"Beyond the familiar world",d:"A poetic label for an experience that feels foreign, vast or difficult to place.",fix:"Ground through the body, ordinary routines and trusted human contact."},
{n:"Unknown origin",d:"The exact source is unclear, and certainty is not required for useful self-inquiry.",fix:"Work with the present sign, boundary and next step instead of forcing an explanation."}
][i]||{n:"Symbolic origin",d:"A symbolic layer whose precise source is less important than its present effect.",fix:"Return to the body, the boundary and the next honest action."}}));
function pickOrigin(){
  const idx=weightedIndex(ORIGINS.map(o=>o.w));
  return ORIGINS[idx]||ORIGINS[0];
}
window.dtSel="en";
const DTT={en:"Energia / helyzet",sz:"Személy",ta:"Tárgy / eszköz",la:"Hely / otthon",va:"Vállalkozás"};
if(gq("#dtType")){
  gq("#dtType").innerHTML=Object.entries(DTT).map(([id,l])=>`<button type="button" class="chip ${id==='en'?'on':''}" data-dt="${id}">${l}</button>`).join("");
  document.querySelectorAll("#dtType .chip").forEach(c=>c.addEventListener("click",()=>{
    document.querySelectorAll("#dtType .chip").forEach(x=>x.classList.remove("on"));
    c.classList.add("on");window.dtSel=c.dataset.dt;
  }));
}
/* ============================================================
   Inga — Ceridwen ingája (inga + táblák)
   ============================================================ */
const Inga={phase:"idle",pool:"en",name:"",programs:[],cur:{},rot:0,busy:false,step:null,confirmed:0,allClear:false,prep:{},mopup:[]};
const Inga_TT={en:"Helyzet / energia",on:"Önmagam",sz:"Másik személy",kap:"Kapcsolat",ta:"Tárgy",la:"Otthon / hely",va:"Vállalkozás"};
const Inga_POOL={en:"en",on:"sz",sz:"sz",kap:"sz",ta:"ta",la:"la",va:"va"};
const SVT_TABLES={
 prep:["Kapcsolódás rendben","Földelés szükséges","Kérdés pontosítása","Most ne dolgozz"],
 permission:["IGEN — folytatható","NEM — zárd le"],
 category:["Minden rendben","Érzelmi program","Hiedelem / fogadalom","Kapcsolati kötés","Ősi / családi minta","Önszabotázs","Ismeretlen réteg"],
 theme:["félelem","szégyen","bűntudat","harag","veszteség","kontroll","elhagyás","értéktelenség","bizalmatlanság","megfelelési kényszer","halogatás","túlterhelés"],
 source:["Jelen élet","Gyermekkor","Családi / ősi vonal","Jelképes régi-élet réteg","Kapcsolati lenyomat","Kollektív minta","Ismeretlen eredet"],
 age:["0–7 év","8–14 év","15–21 év","22–35 év","36–50 év","51+ év","Nem időhöz kötött"],
 area:["Test és vitalitás","Érzelmek","Önértékelés","Kapcsolatok","Munka / hivatás","Pénz / biztonság","Otthon / tér","Belső út"],
 correction:["Elengedés","Megbocsátás","Határ kijelölése","Fogadalom visszavonása","Visszaadás a forrásnak","Belső rész integrálása","Új választás megerősítése"],
 replacement:["Biztonság","Önbecsülés","Bizalom","Szabadság","Nyugalom","Tiszta határ","Bátorság","Kapcsolódás","Rend","Öröm"],
 verify:["TISZTA","MARADT"],
 mopup:["Nincs több teendő","Rejtett kapcsolódás","Másodlagos nyereség","Ellenállás","Újabb réteg","Integráció szükséges"],
 healing:["Földelés","Pihenés","Víz / légzés","Naplózás","Határmondat","Hála","Gyakorlati lépés 24 órán belül"]
};
const SOURCE_CHARTS={"1":{"title":"A használható táblázat / kapcsolat vagy segítség","items":["Témák és kihívások","Lélekminőségek","Isten tudatossági szint","A teremtés előtti előprogramozott problémák","Programok, Mikor, Szereplők","Mesterprogramok, Diszharmonikus energia","Negatív motivációk, akadályok és zavaró hatások","Pozitív kifejezés akadályai","Különféle akadályok","Étel vagy táplálkozás, egészség és életmód","A teremtés előtti előprogramozott egyéb archetípusok","Belépő archetípusok","Programok / Mikor / Szereplők","Spirituális birodalmak programjai","Új Egy Univerzum","Magasabb szintű akadályok","A tudatosság finomítása","Végső adatok ebben az EGY Univerzumban","Végső megoldás","Végső fény","Memória tisztítás","Gyógyító kör","Finomhangolás","A tudatosság zuhanása","Végső bizonyosság","A szabadság szabad","A tanulás mulatság","Témák és kihívások / lélekminőségek","Előző lista","Végső megoldás","Végső fény","Előző lista"]},"2":{"title":"Témák és kihívások, lélekminőségek","items":["Negatív - szeretet","Számítás - bölcsesség","Szociális kapcsolatok - minőség","Egészség","Konfliktus","Passzivitás / agresszió","Hit / öröm","Tisztaság / megbocsátás","Családi élet / gyermekek","Bátorság, cél, irány","Gyengédség, szeretet","Ártatlanság, türelem","Lelki nyugalom, jóindulat","Egység, könyörület","Pénz, jövedelem","Őszinteség, engedelmesség","Az élet értelme, cél","Biztonság, erőforrások","Egyéb","Kikapcsolódás, játék"]},"3":{"title":"A Lélektudatosság szintjei","items":["Fényesség","Szellem","Forrás","Isten","Én vagyok","Legfelsőbb tudatossági szint","Végső tudatossági szint","Szentlélek tudatosság","Vezető tudatosság","Univerzális","Krisztusi tudatosság","Szabad","Egy","Fény állapot","Szentlélek állapot","Szellem állapot","Inkarnációs - földi szint"]},"4":{"title":"Programok, mikor, szereposztás","items":["Örökség","Tanácsadás","Büntetés","Baleset","Születés","Konfliktus","Önbüntetés","Jelen élet, ami ezután jön","Testtel kapcsolatos kijelentés vagy összehasonlítás","Előző életek","Halál","Átmenet","Eljövendő életek","Előző életek más dimenziókban","Érintések, elhívások","Félelem","Szereplők","Programok","Mikor"]},"5":{"title":"Negatív motivációk, akadályok és zavaró hatások","items":["Testellenzés az aurában","Negatív cselekedetek","Kísértetek fizikai alakban","Elkövetők","Az életet többé nem folytatom","Asztrális beavatkozás","Befecskendezés - más","Diszharmonikus gondolatformák","Vágy / ambíció","Menekülés","Tudatos kontroll","Félelem","Sátániak / démonok","Kapzsiság","Sötét energiák","Védekezés","Sötét erők","Hatalom, manipuláció","Sátáni erők","Felsőbbség","Démoni erők","Önhibáztatás","Egószálak","Bűzös ügy"]},"6":{"title":"Mesterprogramok, diszharmonikus energia","items":["Bölcsesség","Érdemesség","Biztonság","Tisztesség","Szeretet","Kedvesség","Őszinteség","Remény","Öröm","Vidámság","Jólét","Egyensúly","Kitartás","Kreativitás","Cél","Bátorság","Türelem","Béke","Optimizmus","Felelősség","Pénz","Könyörületesség","Tolerancia","Tisztaság","Kényelem","Szeretet","Őszinteség","Megbocsátás","Öröm","Szomorúság","Harag","Félelem","Alacsony önértékelés"]},"7":{"title":"Közvetlen gyógyító folyamatok / színek","items":["Arany","Vírus","Baktérium","Megfázás","Tüdő","Máj","Sárga","Lila","Barna","Fehér","Szürke","Fekete","Ezüst","Egyéb","Homeopátiás esszenciák","Tudatosság változtatás","Integrált test terápia","A lélek isteni fény-gyógyításának fizikája","Fizikai és aurikus rezgések növelése","Vírusesszenciák és gyógyítás rezgésekkel","Az ásványok és kristályok ismerete","Drágakövek elixírek","Jóga és meditáció","Aromavilág","Spirituális gyógyítás","Vizualizációs gondolkodás","A kristálygyógyítás"]},"8":{"title":"A teremtés előtti előprogramozott egyéb archetípusok","items":["Bölcsesség - Simon","Együttérzés - Fülöp","Bőség - János","Életszeretet - János","Igazságtalanság","Alkoholizmus","Őszinteség - Tamás","Depresszió","Együttérzés - Máté","Önbüntetés","Szabadság - Taddeus","Önértékelés","Megbocsátás - Bertalan","Önuralás","Önbecsülés - Jakab","Pozitív lehetőségek","Negatív lehetőségek","Spirituális gyermek","Bölcs archetípusok"]},"9":{"title":"Étel vagy táplálkozás, egészség és életmód","items":["Friss gyümölcsök","Tisztított ivóvíz","Szellemi életmód","Fizikai energia","Az élet öröme és élvezete","Napfény","Mindennapos testmozgás","Pihenés","Friss levegő","Testedzés","Diéta","Víz","Gyümölcsök","Hüvelyesek: borsó, bab","Állati termékek: tej, sajt, tojás","Fehérje: zöldségek, hús, hal","Saláták: paprika, káposzta, nyers ételek","Imádság, áldás étel és gyümölcs fölött"]},"10":{"title":"Különféle akadályok","items":["Faji identitások","Tudatosság ítélet","Világ megváltoztatása","Generációk","Küldetés és életfeladat","Testvéri fogadalmak","Családi élet feladatok","Anti-élet energiák","Átkok","Teleprogramok","Szerződések","Polaritás hiedelmek","Genetikai hiedelmek","Asztrológiai hiedelmek","Karmikus hiedelmek","A tudatalatti teljesség elvesztése","Blokkolt csakrák","Az életerő energiák elkorlátozása","Egyensúlyozd ki a pozitív és negatív energiát","Mágikus áramlatok","Mennyelés / ágy","Hiedelmekben való hit","Harmadik Univerzum","Hegesedés"]},"11":{"title":"Lélek energia programozás","items":["Programok, amelyek a lélek nem tud","Előprogramozás","Az elme hibás működése","A lélek tudatosság hibás működése","A lélek mutáció hibás működése","A gondolkodás hibás működése","Genetikai Lélek kódolás","A tapasztalási ösvény előprogramozása","A lélektudatosság hibás működése","A megnyilvánulás hibás működése","A lélek közszennyeződése","A lélek megszállása a rossztól"]},"12":{"title":"Szellem energia programozás","items":["A szellem előprogramozása az ISTEN univerzumban","A szellem mutáció hibás működése","A szellem kódolás hibás működése","A szellem hibás működése gondolkodás","A szellem az apokalipszis után érkezett kód","A teremtő energiák hibás működése","A szellem által okozott téves tudatosság","Az ISTEN tudatosság hibás működése","ISTEN megtalálásának elvesztése","A szellem beszennyeződése"]},"13":{"title":"Teremtés előtti programok","items":["Eszme","Gondolat","Végtelen","Szintek 4 és 5","Szintek 1-től 6-ig","Szintek 7 és 8","Tudatalatti dolog","Tudatalatti dirib-darabok","Tűzbolygó energia","Állati energia","Agysejtűség betegség","Teremtő programozás"]},"14":{"title":"Az illúzió megteremtése a tudatosság zuhanása előtt","items":["Kényelmetlen energetikai elemek","Finom energia","Lélekszint kódolás más lélek","Magasabb szintű energetikai akadályok","Állati tudatosság programok","Visszaélés az energiával a teremtés során","Visszaélés az élet értelmével","Fényenergia disszonancia","Tudat és elme programok I. típus","Tudat és elme programok II. típus"]},"15":{"title":"ÉN VAGYOK tudatossági szintű programok","items":["Félprogramok","Az ÉN VAGYOK szint tudatosságának hibás működése","A teremtő energia hibás működése","A fel-le energia hibás működése","Fény birodalom diszharmonikus energia","Elkülönülés a szeretettől","Háború a mennyben","ÉN VAGYOK szint tudatosság","Láz az ÉN VAGYOK szint tudatosságnak felelőssége"]},"16":{"title":"A tudatosság zuhanása","items":["A megértés elvesztése önmagadban","A szellem megnyilvánulás hibás működése","A szellem hibás beavatkozása","Zuhanás a sötétségbe","Elmozdulás az irrealitásba","Kegyvesztettség","Elkülönülés az EGYtől","Kiűzetés a mennyből","Lázadás az EGY ellen"]},"17":{"title":"Finomhangolás","items":["Lemondás fizikai felelősségről","Lemondás az érzelmi felelősségről","Lemondás a mentális felelősségről","Lemondás a spirituális felelősségről","Szövetség","Messiás komplexus","Főlegénység az alacsonyabb csakrákra","Megmentői komplexus","Diszharmonikus energia felvétele","Hiedelem a programok visszaállítására","Vágy a mediátor szükségességében","A tudatos programok mögötti okok","Hajlandóság hiánya a tanulásra","Hajlandóság hiánya a Felső Énnel való együttműködésre","Hajlandóság hiánya a régi hiedelmek elengedésére","Hajlandóság hiánya a változások előmozdítására"]},"18":{"title":"Magasabb szintű akadályok","items":["ISTEN tudatossági szintű akadályok","Programok az EGY tudatosság elméjében","A legfelsőbb Tanács 9. szintje akadályokkal","Az ÉN VAGYOK, AMI VAGYOK tudatosság elméjében található programok","Akadályok ISTENNEL a Napon keresztül","Programok az EGY tudatalatti elméjében","A 2000 szinten álló Tanács akadályozása"]},"19":{"title":"Hogyan változtasd meg az életed","items":["Egyéb","Tudatosság","Vágy","Hit","Elfogadás","Tudás","A feletted élő megértése","Megbocsátás","Szeretet","Beteljesülés és pihenés","A tettek mezejére lépni","Tisztító állítások","Úgy tenni, mintha","Tarts szünetet","Vizuális programozás","Töltődj fel energiával","Alkotás","Türelem és kitartás","Örömöd a rendezett gondolkodás","Elismerés","Helyes módon az életet átgondolni","Megtérni","Érkezés","Imádkozz"]},"20":{"title":"A tudatosság finomítása","items":["A finomhangolást nem megfelelően programoztad","A tudatos finomhangolás nem működött","ISTEN szintjén lévő programok","Diszharmónia az EGY szinten","Finomhangolás az EGY szinten","Elvégzendő teendők a továbblépés előtt","Az EGYtől induló magasabb szintű ügyek","Kiegyensúlyozatlan és szeretet az EGY szinten","További I. és II. típusú programok az EGY szinten"]},"21":{"title":"Végső adatok ebben az EGY Univerzumban","items":["Táblázatban nem szereplő programok","Előző lista","Félprogramok","Energia átalakítás","Az elme és az asztrális test szintjének bizonyossága 9999","Az összes kategória","13 test és 56 elme","Dirib-darabok","Hét pecsét és feneketlen mélység","Kutatás / tisztítás és harmonizálás Alfréd Omegaig","Valami más","Nyílj meg a legjobb befogadására","Személyiségjegy","Előző életek, melyeket a lélek más kára megvizsgálni"]},"22":{"title":"Új Egy Univerzum","items":["Előző életek az ÉN VAGYOK szinten","Előző életek az EGY Univerzumokban","Megszokott akadályok","A 2000 szintű akadályok","A 13 asztrális test programjainak tisztítása","A 9 asztrális testen minden szintű akadály","Emlékeztetés arra, hogy a Lélek célja a spirituális megvilágosodás","Látóhatárunk végtelen","Tudomás a kilenc ISTENSÉG Tanácsról","Tudomás a teljes spirituális folyamatról","A 13 asztrális test vizsgálatáról","Az ISTENSÉG minden minden az ISTENSÉG"]},"23":{"title":"Spirituális birodalmak programjai","items":["Dirib-darabok a végtelenbe","Genetikai DNS és alapterő hiedelmek","Spirituális akadályok I.-től 6-ig","Szellemidézés csomag","Gyökér okok","Tisztítsd a lelkeket","ISTENSÉG felemelkedések","Használd a 7. táblázatot","Minden ügy","Alternatív életutak és gyökér okok","Feljövő programok","Tizenegy ISTENSÉG program","A Lélek hazudik","A diszharmonikus energia napi felgyülemlése","Az Univerzum embriója","A szeretet és hála","A táblázatban nem szereplő programok","A Lélek és egészség viszonya az Újra"]},"24":{"title":"A tudatos elme újjászületése","items":["Fogadalom","Ego","A mentális test / gondolkodás","Sárkányok","A végtelen tudatosság energiaszintjeinek megközelítése","A Mester elv","Rögeszmés gondolatok","Elkötelezettségek","Érzelmi megerősítés","Megszálló következmények","Eltemetett hiedelmek","Megszakadt minták","Tudatosan tett fogadalmak","Tudatosan tett fogadalmak - több fogadalom"]},"25":{"title":"Végső bizonyosság","items":["Feltétel, elme és lélek","Kiegyensúlyozatlanság","Végső ügyek","Akadályok","Megbocsátás","Lélektisztítás","Tisztítsd a táblázatokat 10A-32-ig","Alkalmazd a 2. táblázatot","Garancia, hogy minden kitisztult"]},"26":{"title":"A szabadság szabad","items":["Minden pont nézőpont kérdése","Az emberiség a Mindenki része vagyunk","Nincs félelem","Nincs elkülönülés","A fátyol elszakadt","Osztózunk az EGY szeretetében","A teremtés harca csak illúzió","Minden paraméter illúzió","Együtt veszünk részt ebben az egészben","A létezés csak egy illúzió","A mindenség gyönyörű vagyunk"]},"27":{"title":"A tanulás mulatság","items":["Felelj kérdésekre és fejlődj","Tapasztalat a folyamat","Csak fejlődhetünk a FŐNÁK","Részese vagyunk a földi energiának","Történhet velünk magunkra","A tanulás egy szakadatlan folyamat","Lélekhiedelmek","A tanulás két szintje: spirituális és fizikai","A felemelkedés a cél","A cél az Egység és ISTEN/SZELLEM elérése"]},"28":{"title":"Végső megbocsátás","items":["Én és a Mesterem","Szeretet és béke","Alázat, szeretet és tisztelet","Több tudatosság és szeretet","A tudatosság útjának összes programja","Foszlasd az emlékhibákat","Többszörös ösvények","Érzelmi lenyomatok","Engedd el a haragot minden szinten","Mert vége az ellenőrző listám","Tisztítsd az ürességet"]},"29":{"title":"Végső áldás","items":["Egyéb","Előző élet","Előző életter","Élet","Előző életes test","Előző asztrális test","Érzelmi test","Mentális test","Elképzelés","Spirituális test","Az élet értelme","A tudatosság megnyilvánul","Fizikai DNS kódolás","Csodák"]},"30":{"title":"Végső fény","items":["Lélek újraprogramozás","Személyes lélekkódolás","Kutatás és tisztítás a táblából","Feltétel nélküli fény","Fényáramlat","Végtelenség áramlat","Kilenc Tanács ebben az EGY Univerzumban","Befejezés és összegzés"]},"31":{"title":"Memória tisztítás","items":["Felejtsd el az eseményeket","Újraélt ok és hatások","Táblázatban nem szereplő elemek","Mit érzel 83 mintára","2600 ösvény","A Tizenhármak Tanácsa","A teremtés határa","A teremtés alapelvei","Az ISTENEK Tizennyolcadik Csoportja","Őslenyomatok","Jákob lajtorjája","Királyok Királya","A SZELLEM elméje","TEREMTŐ tudatosság","99 felemelkedés","Egyesít a 13 test","A szellemek és fényesség elméje","Programok a régi életben találhatók","Archetípusok"]},"32":{"title":"Ellenőrző lista","items":["Egyes csoport","Kettes csoport","Hármas csoport","Négyes csoport","Ötös csoport","Hatos csoport","Hét csoport","Lelki sérülések","Az EGY Univerzum embriója","Homotoxikológia","Koponyai keresztcsonti igazítás","Egyensúlyozd ki az EGY Univerzum gondolatait","Agysejt újjáépítés","Egyensúlyozd ki az embriót","Agyi koponyai újraépítés","Egyensúlyozd ki a szeretet energiát","Alsó Omegaig","Spirituális programok","Gyógyítás a lelkesedéssel","DNS, kromoszómák, ízlelőmirigyek","Csomópont","Mesék"]}};
const svtL=(hu,en)=>cerEn()?en:hu;
if(gq("#pendulumType")){
 gq("#pendulumType").innerHTML=Object.entries(Inga_TT).map(([id,l])=>`<button type="button" class="chip ${id==='en'?'on':''}" data-pendulum="${id}">${cerEn()?({en:'Situation / energy',on:'Myself',sz:'Another person',kap:'Relationship',ta:'Object',la:'Home / place',va:'Business'}[id]):l}</button>`).join("");
 document.querySelectorAll("#pendulumType .chip").forEach(c=>c.addEventListener("click",()=>{if(Inga.busy)return;document.querySelectorAll("#pendulumType .chip").forEach(x=>x.classList.remove("on"));c.classList.add("on");Inga.pool=Inga_POOL[c.dataset.pendulum];}));
}
const Inga_CX=210,Inga_CY=225,Inga_R=195;
function pendulumPolar(a,r){const rad=a*Math.PI/180;return [Inga_CX+r*Math.cos(rad),Inga_CY-r*Math.sin(rad)];}
function pendulumChartDraw(title,wedges){
  gq("#pendulumChartTitle").textContent=title;
  const n=wedges.length,g=gq("#pendulumWedges"),key=gq("#pendulumChartKey");
  const mobile=window.matchMedia("(max-width: 700px)").matches;
  let out="";
  wedges.forEach((w,i)=>{
    const a0=180-i*(180/n),a1=180-(i+1)*(180/n);
    const[x0,y0]=pendulumPolar(a0,Inga_R),[x1,y1]=pendulumPolar(a1,Inga_R);
    out+=`<path class="wedge" data-w="${i}" d="M ${Inga_CX} ${Inga_CY} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${Inga_R} ${Inga_R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z"/>`;
  });
  wedges.forEach((w,i)=>{
    const ac=180-(i+.5)*(180/n);
    const dense=n>12;
    const labelRadius=dense?126:n>8?120:114;
    const[lx,ly]=pendulumPolar(ac,labelRadius);
    const rot=(ac<=90?-ac:180-ac).toFixed(1);
    const fs=mobile?(dense?8.8:n>8?9.4:10.2):(dense?8:n>8?8.8:9.6);
    const full=String(w.l);
    let label=full;
    if(mobile && (dense || full.length>18)) label=String(i+1);
    else if(label.length>28) label=label.slice(0,27)+"…";
    out+=`<text class="wlabel" data-w="${i}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="${fs}" transform="rotate(${rot} ${lx.toFixed(1)} ${ly.toFixed(1)})">${esc(label)}</text>`;
  });
  g.innerHTML=out;
  if(key){
    const needsKey=mobile || wedges.some(w=>String(w.l).length>22) || n>10;
    key.hidden=!needsKey;
    key.innerHTML=needsKey?`<div class="pendulum-key-title">${svtL('A tábla mezői','Chart fields')}</div><div class="pendulum-key-list">${wedges.map((w,i)=>`<button type="button" class="pendulum-key-item" data-w="${i}" title="${esc(String(w.l))}"><span>${i+1}</span><b>${esc(String(w.l))}</b></button>`).join("")}</div>`:"";
  }
  Inga.wedges=wedges;
}
function pendulumHighlight(i){document.querySelectorAll("#pendulumChart .wedge,#pendulumChart .wlabel,.pendulum-key-item").forEach(w=>w.classList.toggle("sel",+w.dataset.w===i));const key=gq("#pendulumChartKey");if(key&&i>=0){const item=key.querySelector(`.pendulum-key-item[data-w="${i}"]`);item?.scrollIntoView({block:"nearest",inline:"nearest",behavior:"smooth"});}}
function pendulumSetRot(r){Inga.rot=r;gq("#pendulumNeedle").setAttribute("transform",`rotate(${r.toFixed(2)} ${Inga_CX} ${Inga_CY})`);}
function pendulumSwing(targetIdx,done){const n=Inga.wedges.length,ac=180-(targetIdx+.5)*(180/n),T=90-ac,start=Inga.rot,t0=performance.now();Inga.busy=true;(function frame(now){const t=now-t0,e=Math.min(1,t/500),r=start+(T-start)*e+55*Math.exp(-t/700)*Math.sin(t/110);pendulumSetRot(r);if(t<2200)requestAnimationFrame(frame);else{pendulumSetRot(T);pendulumHighlight(targetIdx);Inga.busy=false;done&&done();}})(performance.now());}
function pendulumClearSpin(done){const start=Inga.rot,t0=performance.now();Inga.busy=true;(function frame(now){const t=now-t0,p=Math.min(1,t/1800),e=1-Math.pow(1-p,3);pendulumSetRot(start+1080*e);if(p<1)requestAnimationFrame(frame);else{pendulumSetRot(0);Inga.busy=false;done&&done();}})(performance.now());}
function svtTable(key,title,next,weights){const arr=SVT_TABLES[key].map((l,i)=>({id:i,l}));pendulumChartDraw(title,arr);const idx=weights?weightedIndex(weights):randInt(arr.length);pendulumSwing(idx,()=>next(arr[idx],idx));}
function pendulumReset(){Object.assign(Inga,{phase:"idle",programs:[],cur:{},confirmed:0,allClear:false,step:null,prep:{},mopup:[],recentCharts:[],entrySubjects:[],entryIndex:0,exitIndex:0,protocolAwaitingClean:false,forcePass:false,skipGateway:false});gq("#pendulumFound").innerHTML="";gq("#pendulumClear").innerHTML="";gq("#pendulumBless").style.display="none";gq("#pendulumOracle").style.display="none";gq("#pendulumWedges").innerHTML="";pendulumSetRot(0);gq("#pendulumChartTitle").textContent=svtL("Az inga nyugalomban van","The pendulum is at rest");gq("#pendulumStatus").textContent=svtL("A folyamat a név megadásával és a belépési protokollal indul.","The process begins with a name and the entry protocol.");gq("#pendulumBtn").style.display="";gq("#pendulumBtn").disabled=false;gq("#pendulumBtn").textContent=svtL("Ingaülés megkezdése","Begin pendulum session");gq("#pendulumRestart").style.display="none";}
function svtResultCard(p,cleared){return `<div class="dk-energy ${cleared?'pendulum-cleared':''}" data-pid="${esc(p.id)}"><div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:8px">${esc(p.category)} · ${p.level}%</div><h4>${esc(p.theme)}</h4><p><strong>${svtL('Eredet','Source')}:</strong> ${esc(p.source)} · <strong>${svtL('Időréteg','Time layer')}:</strong> ${esc(p.age)}</p><p><strong>${svtL('Életterület','Life area')}:</strong> ${esc(p.area)}</p><p><strong>${svtL('Korrekció','Correction')}:</strong> ${esc(p.correction)} · <strong>${svtL('Új minőség','Replacement')}:</strong> ${esc(p.replacement)}</p></div>`;}
function pendulumRenderFound(){gq("#pendulumFound").innerHTML="";}
function pendulumAllClearFinish(){Inga.allClear=true;srtStartExit();}
function pendulumStep(){
 const st=Inga.step;
 if(st==="prep"){
   const entries=Object.entries(SOURCE_CHARTS).map(([id,c])=>({id:+id,l:`${id}. ${c.title}`}));
   pendulumChartDraw(svtL("1. táblázat — Használandó tábla kiválasztása","Chart 1 — Select the chart to use"),entries);
   const recent=Inga.recentCharts||[];
   let candidates=entries.filter(x=>x.id!==1&&!recent.includes(x.id));
   if(!candidates.length)candidates=entries.filter(x=>x.id!==1);
   const chosen=candidates[randInt(candidates.length)];
   const idx=entries.findIndex(x=>x.id===chosen.id);
   return pendulumSwing(idx,()=>{Inga.cur={chartId:chosen.id,chartTitle:SOURCE_CHARTS[String(chosen.id)].title};Inga.recentCharts=[...(recent||[]),chosen.id].slice(-4);Inga.step="sourceChart";gq("#pendulumStatus").textContent=svtL(`Kiválasztott tábla: ${chosen.id}. ${Inga.cur.chartTitle}`,`Selected chart: ${chosen.id}. ${Inga.cur.chartTitle}`);gq("#pendulumBtn").textContent=svtL("A tábla megnyitása","Open selected chart");gq("#pendulumBtn").disabled=false;});
 }
 if(st==="sourceChart"){
   const c=SOURCE_CHARTS[String(Inga.cur.chartId)], arr=c.items.map((l,i)=>({id:i,l}));
   pendulumChartDraw(`${Inga.cur.chartId}. táblázat — ${c.title}`,arr);
   const idx=randInt(arr.length);
   return pendulumSwing(idx,()=>{Inga.cur.theme=arr[idx].l;Inga.cur.category=`${Inga.cur.chartId}. táblázat`;Inga.cur.source=c.title;Inga.cur.age=svtL("Jelen ülés","Current session");Inga.cur.area=svtL("A feltett kérdés területe","Area of the stated question");Inga.cur.level=randRange(10,100);Inga.cur.correction=svtL("Tudatos felismerés, elengedési szándék és visszaellenőrzés","Conscious recognition, release intention and verification");Inga.cur.replacement=svtL("Tiszta, támogató választás","Clear supportive choice");Inga.cur.id=makeDrawId("INGA");Inga.programs.push({...Inga.cur});pendulumRenderFound();Inga.step="more";gq("#pendulumStatus").textContent=arr[idx].l;gq("#pendulumBtn").textContent=svtL("Van még vizsgálandó?","Is there more to examine?");gq("#pendulumBtn").disabled=false;});
 }
 if(st==="more"){
   const w=[{l:svtL("NINCS — a kutatás teljes","NO — research complete")},{l:svtL("VAN — következő tábla","YES — next chart")}];
   pendulumChartDraw(svtL("Visszaellenőrzés","Verification"),w);
   const yes=Inga.programs.length<3&&randBool(Inga.programs.length===1?.45:.22);
   return pendulumSwing(yes?1:0,()=>{if(yes){Inga.cur={};Inga.step="prep";gq("#pendulumBtn").textContent=svtL("Következő tábla kiválasztása","Select next chart");gq("#pendulumBtn").disabled=false;}else{Inga.phase="clearing";pendulumRenderClearing();}});
 }
}
function pendulumRenderClearing(){gq("#pendulumClear").innerHTML=`<h3>${svtL('Tisztítás és újraprogramozás','Clearing and reprogramming')}</h3>`+Inga.programs.map((p,i)=>`<div class="dk-energy" id="pendulumc-${i}"><h4>${esc(p.theme)}</h4><p>${esc(p.correction)} → ${esc(p.replacement)}</p><button type="button" class="btn pendulum-one-clear" data-ci="${i}">${svtL('Tisztítás végrehajtása','Perform clearing')}</button>${resultAiPromptPanel(`pendulum-program-${i}`,{process:svtL("Táblás ingaülés és tisztítás","Chart-based pendulum session and clearing"),subtype:svtL("Feltárt program / tisztítási eredmény","Revealed pattern / clearing result"),title:p.theme||p.e?.n||svtL("Feltárt minta","Revealed pattern"),meaning:[p.category,p.origin,p.time,p.area,p.level?`${p.level}%`:""].filter(Boolean).join(" · "),practice:`${p.correction||""} → ${p.replacement||""}`,extra:[p.e?.d,p.o?.n,p.o?.d].filter(Boolean).join(" ")})}</div>`).join("");gq("#pendulumBtn").style.display="none";gq("#pendulumRestart").style.display="";bindResultAiPrompts(gq("#pendulumClear"));document.querySelectorAll(".pendulum-one-clear").forEach(b=>b.addEventListener("click",(event)=>{event.preventDefault();event.stopPropagation();if(Inga.busy||b.dataset.cleared==="1")return;b.dataset.cleared="1";b.disabled=true;const keepY=window.scrollY;const parentDetails=b.closest("details");if(parentDetails)parentDetails.open=true;pendulumClearSpin(()=>{if(parentDetails)parentDetails.open=true;window.scrollTo({top:keepY,behavior:"auto"});gq("#pendulumc-"+b.dataset.ci).classList.add("pendulum-cleared");b.textContent=svtL("Feloldva ✓","Released ✓");Inga.confirmed++;if(Inga.confirmed>=Inga.programs.length){const host=gq("#pendulumClear");if(host&&!host.querySelector(".pendulum-clearing-complete")){host.insertAdjacentHTML("beforeend",`<div class="pendulum-clearing-complete"><strong>${svtL("Mindhárom tisztítás láthatóan lezárult.","All three clearings remain visibly completed.")}</strong><p>${svtL("A lapok nyitva maradnak. Amikor készen állsz, külön indítsd el a záró átfésülést.","The result cards remain open. Start the final mop-up separately when you are ready.")}</p><button type="button" class="btn pendulum-continue-close">${svtL("Záró átfésülés indítása","Start final mop-up")}</button></div>`);host.querySelector(".pendulum-continue-close")?.addEventListener("click",e=>{e.currentTarget.disabled=true;pendulumMopUp();});}}});}));}
function pendulumMopUp(){svtTable("mopup",svtL("11. tábla — Átfésülés (mop-up)","Table 11 — Mop-up"),(r,i)=>{Inga.mopup.push(r.l);if(i===0)return pendulumHealing();gq("#pendulumStatus").textContent=svtL("Átfésülés: ","Mop-up: ")+r.l+svtL(" — kiegészítő oldás történt."," — supplementary release completed.");setTimeout(pendulumHealing,900);},[48,12,10,10,10,10]);}
function pendulumHealing(){svtTable("healing",svtL("12. tábla — Integráció / gyógyítás","Table 12 — Integration / healing"),(r)=>{Inga.healing=r.l;setTimeout(pendulumFinish,700);});}
function pendulumFinish(){srtStartExit();}
gq("#pendulumBtn")?.addEventListener("click",()=>{
 if(Inga.busy)return;
 gq("#pendulumBtn").disabled=true;
 if(Inga.phase==="idle")return srtBeginIdentity();
 if(Inga.phase==="identity")return srtAcceptIdentity();
 if(Inga.phase==="prepEntry")return srtRenderPreparation();
 if(Inga.phase==="entry")return srtEntryAction();
 if(Inga.phase==="research")return pendulumStep();
 if(Inga.phase==="exit")return srtExitAction();
});
gq("#pendulumRestart")?.addEventListener("click",()=>{if(!Inga.busy)pendulumReset();});

/* ---- mentés + Papnő-összegzés ---- */
gq("#pendulumSave")?.addEventListener("click",()=>{
  const oracleText=gq("#pendulumOracleOut").className==="oracle-out"?gq("#pendulumOracleOut").textContent:"";
  journal.unshift({
    ...createJournalMeta("pendulum"),
    date:new Date().toLocaleString(cerEn()?"en-GB":"hu-HU",{dateStyle:"long",timeStyle:"short"}),
    spread:cerEn()?"Pendulum session — Ceridwen’s pendulum":"Ingaülés — Ceridwen ingája",
    q:gq("#pendulumName").value.trim(),
    cards:Inga.programs.map(p=>`${p.theme} (${p.category}, ${p.level||0}%) — feloldva`),
    text:oracleText
  });
  renderJournal();journalPersist();
  gq("#pendulumSave").textContent="Elmentve ✓";
  setTimeout(()=>gq("#pendulumSave").textContent="Mentés a naplóba",2000);
});
function localIngaOracle(){
  const nm=gq("#pendulumName")?.value.trim()||"";
  if(Inga.allClear) return svtL("Minden rendben van. Az ellenőrzések nem jeleztek további feltárandó mintát.","All is well. The checks found no further pattern requiring attention.");
  if(!Inga.programs.length) return svtL("Az inga még nem tárt fel eredményt.","The pendulum has not revealed a result yet.");
  const strongest=[...Inga.programs].sort((a,b)=>(b.level||0)-(a.level||0))[0];
  const details=Inga.programs.map((p,i)=>`${i+1}. ${p.category}: ${p.theme} (${p.level||0}%). ${svtL('Eredet','Source')}: ${p.source}. ${svtL('Korrekció','Correction')}: ${p.correction}. ${svtL('Új minőség','Replacement')}: ${p.replacement}.`).join("\n\n");
  return `${nm?svtL(`Az ülés fókusza: „${nm}”.`,`Session focus: “${nm}”.`):svtL('Az ülés külön megnevezett fókusz nélkül futott.','The session ran without a separately named focus.')}

${svtL(`A legerősebb jel: ${strongest.theme} (${strongest.level||0}%).`,`Strongest result: ${strongest.theme} (${strongest.level||0}%).`)}

${details}

${svtL('Az eredmény jelképes önreflexiós segítség, nem diagnózis vagy bizonyított természetfeletti közlés.','This result is a symbolic self-reflection aid, not a diagnosis or verified supernatural communication.')}`;
}
function buildPendulumAiPrompt(oracleText){
  const nm=gq("#pendulumName")?.value.trim()||"";
  const subjects=(Inga.entrySubjects||[]).join(", ");
  const details=Inga.programs.map((p,i)=>`${i+1}. ${p.category}: ${p.theme}; ${svtL('forrás','source')}: ${p.source}; ${svtL('erősség','strength')}: ${p.level||0}%; ${svtL('korrekció','correction')}: ${p.correction}; ${svtL('új minőség','replacement')}: ${p.replacement}.`).join("\n");
  return `${svtL('Kérlek, értelmezd az alábbi, táblás ingával készült szimbolikus önreflexiós eredményt. A rendszer szoftveres, kriptográfiai véletlennel szimulált választásokat használ; ne kezeld diagnózisként, jóslatként vagy természetfeletti bizonyítékként.','Please interpret the following symbolic chart-based pendulum self-reflection result. The software uses cryptographically random simulated selections; do not treat it as diagnosis, prediction or supernatural proof.')}

${svtL('Beléptetett résztvevők','Entered participants')}: ${subjects||svtL('nincs megadva','not specified')}
${svtL('Fókusz','Focus')}: ${nm||svtL('nincs külön megadva','not separately specified')}

${details}

${svtL('Korábbi összegzés','Previous summary')}:
${oracleText||svtL('nincs','none')}

${svtL('Magyarázd el közérthetően az összefüggéseket, különítsd el a tényeket a szimbolikus feltételezésektől, adj 3 önreflexiós kérdést és 3 földelt következő lépést.','Explain the connections clearly, separate facts from symbolic assumptions, and give 3 reflection questions plus 3 grounded next steps.')}`;
}
function setPendulumPrompt(oracleText){
  const wrap=gq("#pendulumPromptWrap"), txt=gq("#pendulumPromptText");
  if(!wrap||!txt)return;
  txt.value=buildPendulumAiPrompt(oracleText);
  wrap.classList.add("on");
}
gq("#pendulumOracleBtn")?.addEventListener("click",()=>{
  const out=gq("#pendulumOracleOut");
  out.className="oracle-out thinking";
  out.textContent=cerEn()?"The Priestess recalls the pendulum’s path…":"A Papnő az inga útját idézi fel…";
  gq("#pendulumOracleBtn").disabled=true;
  gq("#pendulumPromptWrap")?.classList.remove("on");
  setTimeout(()=>{
    out.className="oracle-out";
    out.textContent=localIngaOracle();
    setPendulumPrompt(out.textContent);
    gq("#pendulumOracleBtn").disabled=false;
  },220);
});
gq("#copyPendulumPromptBtn")?.addEventListener("click",async()=>{
  const btn=gq("#copyPendulumPromptBtn"), txt=gq("#pendulumPromptText")?.value||"";
  if(!txt)return;
  const ok=await copyTextToClipboard(txt);
  if(btn){btn.textContent=ok?(cerEn()?"Analysis prompt copied ✓":"Elemző prompt másolva ✓"):(cerEn()?"Copy failed":"Másolási hiba");setTimeout(()=>btn.textContent=cerEn()?"Copy analysis prompt":"Elemző prompt másolása",ok?1800:2600);}
});


/* ============================================================
   Structured entry / exit protocol for the chart-based pendulum
   User-supplied workflow, implemented as a symbolic simulation.
   ============================================================ */
const SRT_CLEAR_SCOPE=()=>svtL(
  'A tisztítás szándéka kiterjed a jelenlegi életre, az összes párhuzamos és előző életre, minden kapcsolódó életre, galaxisra és univerzumra, egészen az idők kezdetéig. A program minden tisztítás után igen–nem visszaellenőrzést végez.',
  'The clearing intention covers the present life, all parallel and previous lives, every related life, galaxy and universe, back to the beginning of time. Every clearing is followed by a yes/no verification.'
);
const SRT_4B=[
  'Gyermek','Nő','Férfi','Anyám','Apám','Férjem','Feleségem','Angyal','Család','Egyéb csoport','Szellemi energia','Testetlen','Elkülönült','Szeráf','Kerub','Nagynéni','Nagybácsi','Gondolat','Dicsőült','Vezető','Kételkedő','Felső Én'
];
const SRT_SOURCE=['A legtisztább szeretet forrása','Fényesség','Szellem','Forrás','ISTEN','ÉN VAGYOK','Vezető tudatosság','Szentlélek tudatosság','Univerzális tudatosság','Más / bizonytalan forrás'];
const SRT_SHADOW=()=>['Nincs — minden rendben',...DARK.map(e=>darkName(e))];
const SRT_ENTRY=[
 {id:'communicator',chart:'4B',type:'custom',title:'Kivel kommunikálok?',options:()=>SRT_4B,pass:v=>v==='Felső Én',passLabel:'Felső Én'},
 {id:'source',chart:'3',type:'custom',title:'Honnan kapom a választ?',options:()=>SRT_SOURCE,pass:v=>v==='A legtisztább szeretet forrása',passLabel:'A legtisztább szeretet forrása'},
 {id:'committee',chart:'4B',type:'number',title:'Hány tagú a Felső Én bizottságom?',min:1,max:10,pass:v=>v>=3&&v<=5,passLabel:'3–5'},
 {id:'lock',type:'cleanOnly',title:'Az inga lezárása a tudatos befolyás előtt',cleanText:'Kérem, hogy az inga és a válaszfolyamat legyen lezárva a tudatos gondolati befolyás elől; csak a tiszta, ellenőrzött válasz maradjon.'},
 {id:'commitment',type:'yesno',title:'Elkötelezett-e a Felső Én bizottság, hogy a legtisztább szeretet forrásából adja a választ?',want:true},
 {id:'permission',type:'yesno',title:'Van-e engedélyem, hogy a Felső Énhez kapcsolódjak?',want:true},
 {id:'ego',chart:'4B',type:'number',title:'Mekkora az egóm?',min:0,max:10,pass:v=>v===1,passLabel:'1'},
 {id:'grounding',chart:'4B',type:'number',title:'Mekkora a földelésem?',min:0,max:10,pass:v=>v===10,passLabel:'10'},
 {id:'selfPrograms',type:'yesno',title:'Futtatok-e programokat?',want:false},
 {id:'helperPrograms',type:'yesno',title:'A segítőim futtatnak-e programokat?',want:false},
 {id:'harmony',type:'yesno',title:'Harmóniában van-e a test, a lélek és a szellem?',want:true},
 {id:'souls',chart:'4B',type:'number',title:'Hány lélek van bennem?',min:0,max:10,pass:v=>v===1,passLabel:'1'},
 {id:'shadowSelf',type:'shadow',title:'Van-e rajtam átok, rontás vagy gonosz erő?',target:'rajtam'},
 {id:'gatewaySelf',type:'gateway',title:'Van-e átjáró a most vizsgált területen?'},
 {id:'shadowAround',type:'shadow',title:'Van-e körülöttem átok, rontás vagy gonosz erő?',target:'körülöttem'},
 {id:'gatewayAround',type:'gateway',title:'Van-e átjáró a most vizsgált területen?'},
 {id:'shadowWork',type:'shadow',title:'Van-e a munkahelyemen vagy vállalkozásomon átok, rontás vagy gonosz erő?',target:'munkahely / vállalkozás'},
 {id:'gatewayWork',type:'gateway',title:'Van-e átjáró a most vizsgált területen?'},
 {id:'shadowObjects',type:'shadow',title:'Van-e vagyontárgyban, családi vagyontárgyban, tárgyban vagy eszközben átok, rontás vagy gonosz erő?',target:'tárgyak / eszközök'},
 {id:'gatewayObjects',type:'gateway',title:'Van-e átjáró a most vizsgált területen?'},
 {id:'shadowFamily',type:'shadow',title:'Van-e a családomon vagy családtagjaimon átok, rontás vagy gonosz erő?',target:'család / családtagok'},
 {id:'gatewayFamily',type:'gateway',title:'Van-e átjáró a most vizsgált területen?'},
 {id:'trueHigherSelf',type:'yesno',title:'Kapcsolatban vagyok a valódi Felső Énemmel / Spirituális Bizottságommal?',want:true},
 {id:'channelClear',type:'yesno',title:'Tiszta a csatorna a kommunikációra?',want:true},
 {id:'workPermission',type:'yesno',title:'Van engedélyem és felhatalmazásom arra, hogy most ebben az ügyben dolgozzak?',want:true},
 {id:'highestGood',type:'yesno',title:'Ez a munka a legfőbb jót szolgálja minden érintett számára?',want:true},
 {id:'safe',type:'yesno',title:'Szabad, lehetséges és biztonságos elvégezni ezt a kutatást és tisztítást?',want:true},
 {id:'protection',type:'cleanOnly',title:'Teljes körű védelem kérése',cleanText:'Kérek teljes körű, tiszta védelmet magam, minden beléptetett személy és a teljes munkatér köré.'},
 {id:'startTogether',type:'yesno',title:'Kezdhetjük a közös munkát?',want:true},
 {id:'correctAnswers',type:'yesno',title:'Helyes válaszokat fogok kapni?',want:true},
 {id:'incorrectAnswers',type:'yesno',title:'Helytelen választ fogok kapni?',want:false}
];
const SRT_EXIT=[
 {id:'more',type:'yesno',title:'Van-e még bármi egyéb tisztítandó program, ami ehhez a témához kapcsolódik?',want:false},
 {id:'finished',type:'yesno',title:'Befejeződött-e a mai munka?',want:true},
 {id:'complete100',type:'yesno',title:'A tisztítás 100%-ban megtörtént a lélek minden szintjén és idejében?',want:true},
 {id:'closePermission',type:'yesno',title:'Kérhetem a csatorna lezárását?',want:true}
];
function srtOptions(step){
 if(step.type==='yesno'||step.type==='gateway')return [svtL('NEM','NO'),svtL('IGEN','YES')];
 if(step.type==='number')return Array.from({length:step.max-step.min+1},(_,i)=>String(step.min+i));
 if(step.type==='shadow')return SRT_SHADOW();
 if(step.type==='custom')return step.options();
 return [svtL('Tisztítás','Clearing')];
}
function srtPass(step,value){
 if(step.type==='yesno')return value===(step.want?svtL('IGEN','YES'):svtL('NEM','NO'));
 if(step.type==='gateway')return value===svtL('NEM','NO');
 if(step.type==='shadow')return value.startsWith(svtL('Nincs','None'));
 if(step.type==='number')return step.pass(Number(value));
 if(step.type==='custom')return step.pass(value);
 return true;
}
function srtPassIndex(step,opts){
 if(step.type==='yesno')return step.want?1:0;
 if(step.type==='gateway')return 0;
 if(step.type==='shadow')return 0;
 if(step.type==='number'){
   const vals=opts.map(Number); const good=vals.map((v,i)=>step.pass(v)?i:-1).filter(i=>i>=0); return good[randInt(good.length)];
 }
 if(step.type==='custom')return opts.findIndex(v=>step.pass(v));
 return 0;
}
function srtRandomIndex(step,opts){
 const good=srtPassIndex(step,opts);
 // A completed clearing is verified with the required passing value.
 if(Inga.forcePass){Inga.forcePass=false;return good;}
 // First checks are neutral: every field on the active table has equal probability.
 return randInt(opts.length);
}
function srtProtocolCard(title,value,ok,extra=''){
 return `<div class="dk-energy srt-protocol-card ${ok?'srt-ok':'srt-needs-clear'}"><div class="srt-kicker">${ok?svtL('ELLENŐRZÉS RENDBEN','CHECK PASSED'):svtL('TISZTÍTÁS SZÜKSÉGES','CLEARING REQUIRED')}</div><h4>${esc(title)}</h4><p><strong>${svtL('Válasz','Answer')}:</strong> ${esc(String(value))}</p>${extra?`<p>${esc(extra)}</p>`:''}</div>`;
}
function srtBeginIdentity(){
 Inga.phase='identity';Inga.entrySubjects=[];Inga.entryIndex=0;Inga.exitIndex=0;Inga.protocolAwaitingClean=false;Inga.forcePass=false;Inga.skipGateway=false;
 gq('#pendulumFound').innerHTML=`<div class="dk-energy srt-identity srt-wizard-card"><div class="srt-step-label">${svtL('Belépés · 1. lépés','Entry · Step 1')}</div><h4>${svtL('Ki lép be a folyamatba?','Who is entering the process?')}</h4><p>${svtL('Add meg a saját nevedet. Ezután a ráhangolódás és a három belépési lépés automatikusan a protokoll részeként következik.','Enter your name. The guided preparation and three entry steps will then continue as part of the protocol.')}</p><label for="srtSubjectName">${svtL('Név','Name')}</label><input id="srtSubjectName" maxlength="80" autocomplete="name" placeholder="${svtL('Saját név','Your name')}"><button type="button" class="btn srt-inline-start">${svtL('Belépési folyamat indítása','Start entry process')}</button></div>`;
 gq('#pendulumBtn').style.display='none';gq('#pendulumRestart').style.display='';
 const host=gq('#pendulumFound'),input=host.querySelector('#srtSubjectName'),start=host.querySelector('.srt-inline-start');
 const update=()=>{start.disabled=!input.value.trim();};update();input.addEventListener('input',update);input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!start.disabled){e.preventDefault();srtAcceptIdentity();}});start.addEventListener('click',srtAcceptIdentity);
 setTimeout(()=>input.focus({preventScroll:true}),80);srtPointTo('#pendulumFound');
}
function srtAcceptIdentity(){
 const input=gq('#srtSubjectName');const name=(input?.value||'').trim();
 if(!name){input?.focus();gq('#pendulumStatus').textContent=svtL('A belépéshez add meg a nevet.','Enter the name before entry.');return;}
 Inga.entrySubjects.push(name);Inga.currentSubject=name;Inga.entryIndex=0;srtStartPreparation();
}
const SRT_PREP_STEPS=[
 {icon:'◌',hu:'Három lassú légzés',en:'Three slow breaths',huText:'Hunyd be a szemed, ha kényelmes. Lélegezz be lassan, majd fújd ki még lassabban. Ismételd meg háromszor.',enText:'Close your eyes if comfortable. Breathe in slowly, then breathe out even more slowly. Repeat three times.'},
 {icon:'✦',hu:'Szándék megfogalmazása',en:'Name your intention',huText:'Mondd ki magadban vagy hangosan, hogy mire kérsz tiszta, józan és együttérző rálátást.',enText:'Silently or aloud, name what you are asking to see with clarity, care and sound judgement.'},
 {icon:'○',hu:'Kapcsolódás és védelem',en:'Connection and protection',huText:'Kérj teljes körű védelmet, tiszta kommunikációt és azt, hogy a folyamat minden érintett legfőbb javát szolgálja.',enText:'Ask for complete protection, clear communication and that the process serve the highest good of everyone involved.'}
];
function srtStartPreparation(){Inga.phase='prepEntry';Inga.prepIndex=0;srtRenderPreparation();}
function srtRenderPreparation(){
 const i=Inga.prepIndex||0,st=SRT_PREP_STEPS[i];if(!st){Inga.phase='entry';Inga.entryIndex=0;gq('#pendulumFound').innerHTML='';gq('#pendulumBtn').style.display='';return srtRenderCurrentEntry();}
 const pct=Math.round(((i+1)/SRT_PREP_STEPS.length)*100);
 gq('#pendulumFound').innerHTML=`<div class="dk-energy srt-wizard-card srt-prep-card"><div class="srt-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${SRT_PREP_STEPS.length}" aria-valuenow="${i+1}"><span>${svtL('Ráhangolódás','Preparation')} ${i+1}/${SRT_PREP_STEPS.length}</span><i><b style="width:${pct}%"></b></i></div><div class="srt-prep-icon">${st.icon}</div><h4>${svtL(st.hu,st.en)}</h4><p>${svtL(st.huText,st.enText)}</p><button type="button" class="btn srt-prep-next">${i===SRT_PREP_STEPS.length-1?svtL('Belépési ellenőrzések kezdése','Begin entry checks'):svtL('Következő','Continue')}</button></div>`;
 gq('#pendulumBtn').style.display='none';gq('#pendulumStatus').textContent=svtL(`Résztvevő: ${Inga.currentSubject}. A ráhangolódás a belépési protokoll része.`,`Participant: ${Inga.currentSubject}. Preparation is part of the entry protocol.`);
 gq('#pendulumFound .srt-prep-next')?.addEventListener('click',()=>{Inga.prepIndex=i+1;window.Haptics?.play?.('step');srtRenderPreparation();});srtPointTo('#pendulumFound');
}
function srtRenderCurrentEntry(){
 const step=SRT_ENTRY[Inga.entryIndex];
 if(!step)return srtOfferAdditionalSubject();
 if(step.type==='gateway'&&Inga.skipGateway){Inga.skipGateway=false;Inga.entryIndex++;return srtRenderCurrentEntry();}
 gq('#pendulumChartTitle').textContent=`${svtL('Belépés','Entry')} ${Inga.entryIndex+1}/${SRT_ENTRY.length} · ${step.chart?step.chart+' · ':''}${step.title}`;
 gq('#pendulumStatus').textContent=svtL(`Résztvevő: ${Inga.currentSubject}. Az ellenőrzés csak megfelelő válasszal enged tovább.`,`Participant: ${Inga.currentSubject}. The protocol continues only after the required answer.`);
 gq('#pendulumBtn').style.display='';gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=step.type==='cleanOnly'?svtL('Védelmi tisztítás végrehajtása','Perform protective clearing'):svtL('Ellenőrzés az ingával','Check with pendulum');
}
function srtDoClear(step){
 gq('#pendulumBtn').disabled=true;
 const title=step?.title||svtL('Tisztítás','Clearing');
 gq('#pendulumFound').innerHTML=`<div class="dk-energy srt-clearing"><h4>${esc(title)}</h4><p>${esc(step?.cleanText||SRT_CLEAR_SCOPE())}</p><p><strong>${svtL('Szándék','Intention')}:</strong> ${esc(SRT_CLEAR_SCOPE())}</p></div>`;
 pendulumClearSpin(()=>{
   const opts=[svtL('NEM — ismételd meg','NO — repeat'),svtL('IGEN — megtörtént','YES — completed')];
   pendulumChartDraw(svtL('A tisztítás visszaellenőrzése','Verification of clearing'),opts.map((l,i)=>({id:i,l})));
   pendulumSwing(1,()=>{Inga.protocolAwaitingClean=false;gq('#pendulumStatus').textContent=svtL('A tisztítás visszaellenőrzése: IGEN.','Clearing verification: YES.');if(step?.type==='cleanOnly'){Inga.forcePass=false;Inga.entryIndex++;gq('#pendulumFound').innerHTML=srtProtocolCard(step.title,svtL('IGEN — megtörtént','YES — completed'),true);gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('Következő belépési ellenőrzés','Next entry check');}else{Inga.forcePass=true;gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('Az ellenőrzés megismétlése','Repeat the check');}srtPointTo('#pendulumFound');});
 });
}
function srtEntryAction(){
 const step=SRT_ENTRY[Inga.entryIndex];if(!step)return;
 if(Inga.protocolAwaitingClean)return srtDoClear(step);
 if(step.type==='cleanOnly'){
   gq('#pendulumFound').innerHTML=srtProtocolCard(step.title,svtL('Tisztítási szándék','Clearing intention'),false,step.cleanText);
   Inga.protocolAwaitingClean=true;gq('#pendulumBtn').textContent=svtL('Tisztítás és visszaellenőrzés','Clear and verify');gq('#pendulumBtn').disabled=false;return srtPointTo('#pendulumFound');
 }
 const opts=srtOptions(step),arr=opts.map((l,i)=>({id:i,l}));
 pendulumChartDraw(`${step.chart?step.chart+' · ':''}${step.title}`,arr);
 const idx=srtRandomIndex(step,opts);
 pendulumSwing(idx,()=>{
   const value=opts[idx],ok=srtPass(step,value);
   gq('#pendulumFound').innerHTML=srtProtocolCard(step.title,value,ok,ok?'':SRT_CLEAR_SCOPE());
   if(ok){
     if(step.type==='shadow')Inga.skipGateway=true;
     Inga.entryIndex++;gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('Következő belépési ellenőrzés','Next entry check');
   }else{
     if(step.type==='shadow')Inga.skipGateway=false;
     Inga.protocolAwaitingClean=true;gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('Tisztítás és újraellenőrzés','Clear and recheck');
   }
   srtPointTo('#pendulumFound');
 });
}
function srtOfferAdditionalSubject(){
 Inga.phase='addSubject';gq('#pendulumBtn').style.display='none';
 gq('#pendulumFound').innerHTML=`<div class="dk-energy srt-add-subject"><h4>${svtL('Beléptetsz más személyt, tárgyat vagy energiát is?','Add another person, object or energy?')}</h4><p>${svtL('Minden további résztvevőn ugyanaz a teljes belépési protokoll fut le.','The complete entry protocol runs for each additional participant.')}</p><div class="srt-choice-row"><button type="button" class="btn srt-add-yes">${svtL('Igen','Yes')}</button><button type="button" class="btn ghost srt-add-no">${svtL('Nem, kezdjük a munkát','No, begin the work')}</button></div><div class="srt-extra-name" hidden><label for="srtExtraName">${svtL('Név vagy megnevezés','Name or description')}</label><input id="srtExtraName" maxlength="80"><button type="button" class="btn srt-extra-start">${svtL('Beléptetés indítása','Start entry')}</button></div></div>`;
 const host=gq('#pendulumFound');
 host.querySelector('.srt-add-yes')?.addEventListener('click',()=>host.querySelector('.srt-extra-name').hidden=false);
 host.querySelector('.srt-extra-start')?.addEventListener('click',()=>{const n=(host.querySelector('#srtExtraName')?.value||'').trim();if(!n)return host.querySelector('#srtExtraName')?.focus();Inga.entrySubjects.push(n);Inga.currentSubject=n;Inga.phase='entry';Inga.entryIndex=0;host.innerHTML='';gq('#pendulumBtn').style.display='';srtRenderCurrentEntry();});
 host.querySelector('.srt-add-no')?.addEventListener('click',srtStartResearch);
 srtPointTo('#pendulumFound');
}
function srtStartResearch(){
 Inga.phase='research';Inga.name=gq('#pendulumName').value.trim();Inga.step='prep';Inga.protocolAwaitingClean=false;gq('#pendulumFound').innerHTML='';gq('#pendulumBtn').style.display='';gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('A kutatás megkezdése','Begin research');gq('#pendulumStatus').textContent=svtL('A belépési protokoll teljes. A táblás kutatás indulhat.','Entry protocol complete. Chart research may begin.');
 srtPointTo('.pendulum-stage');
}
function srtStartExit(){
 Inga.phase='exit';Inga.exitIndex=0;Inga.protocolAwaitingClean=false;Inga.forcePass=false;gq('#pendulumBtn').style.display='';gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('Kilépési ellenőrzés','Exit check');gq('#pendulumFound').innerHTML='';srtRenderExit();
}
function srtRenderExit(){
 const step=SRT_EXIT[Inga.exitIndex];
 if(!step)return srtCompleteExit();
 gq('#pendulumChartTitle').textContent=`${svtL('Kilépés','Exit')} ${Inga.exitIndex+1}/${SRT_EXIT.length} · ${step.title}`;
 gq('#pendulumStatus').textContent=svtL('A csatorna csak minden záró ellenőrzés után záródik le.','The channel closes only after every exit check passes.');
 gq('#pendulumBtn').style.display='';gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('Ellenőrzés az ingával','Check with pendulum');
}
function srtExitAction(){
 const step=SRT_EXIT[Inga.exitIndex];if(!step)return;
 if(Inga.protocolAwaitingClean)return srtDoExitClear(step);
 const opts=srtOptions(step),arr=opts.map((l,i)=>({id:i,l}));pendulumChartDraw(step.title,arr);const idx=srtRandomIndex(step,opts);
 pendulumSwing(idx,()=>{const value=opts[idx],ok=srtPass(step,value);gq('#pendulumFound').innerHTML=srtProtocolCard(step.title,value,ok,ok?'':SRT_CLEAR_SCOPE());if(ok){Inga.exitIndex++;gq('#pendulumBtn').textContent=svtL('Következő záró ellenőrzés','Next exit check');}else{Inga.protocolAwaitingClean=true;gq('#pendulumBtn').textContent=svtL('Tisztítás és újraellenőrzés','Clear and recheck');}gq('#pendulumBtn').disabled=false;srtPointTo('#pendulumFound');});
}
function srtDoExitClear(step){
 gq('#pendulumBtn').disabled=true;gq('#pendulumFound').innerHTML=`<div class="dk-energy srt-clearing"><h4>${esc(step.title)}</h4><p>${esc(SRT_CLEAR_SCOPE())}</p></div>`;
 pendulumClearSpin(()=>{Inga.forcePass=true;Inga.protocolAwaitingClean=false;gq('#pendulumBtn').disabled=false;gq('#pendulumBtn').textContent=svtL('Újraellenőrzés','Recheck');});
}
function srtCompleteExit(){
 Inga.phase='complete';Inga.step='done';gq('#pendulumChartTitle').textContent=svtL('Az inga nyugalomba tért','The pendulum returned to rest');gq('#pendulumStatus').textContent=svtL('A csatorna lezárva. A résztvevők és energiák szétválasztva.','Channel closed. Participants and energies separated.');
 gq('#pendulumFound').innerHTML=`<div class="dk-energy srt-closing-formula"><h4>${svtL('Záró formula','Closing formula')}</h4><p>„${svtL('Köszönöm a Felső Énnek és a Spirituális Bizottságnak a munkát és a tisztítást. A csatornát most lezárom, az energiákat szétválasztom. Mindenki visszatér a saját tiszta fény-terébe. Úgy legyen.','I thank the Higher Self and Spiritual Committee for the work and clearing. I now close the channel and separate the energies. Everyone returns to their own clear field of light. So be it.')}”</p></div>`;
 gq('#pendulumBtn').style.display='none';gq('#pendulumRestart').style.display='';gq('#pendulumBlessTxt').textContent=svtL('A munka lezárult, a csatorna bezárult, minden résztvevő visszatért a saját terébe.','The work is complete, the channel is closed, and every participant has returned to their own space.');gq('#pendulumBless').style.display='block';gq('#pendulumOracle').style.display='block';srtPointTo('#pendulumFound');
}
function srtPointTo(selector){
 const el=typeof selector==='string'?gq(selector):selector;if(!el)return;
 requestAnimationFrame(()=>{el.classList.add('flow-target');setTimeout(()=>el.classList.remove('flow-target'),1800);el.scrollIntoView({behavior:'smooth',block:'center'});});
}

pendulumReset();
if(window.ritualDone) markRitualButtonsDone();
ritualSync();

/* ==================== KÉRDEZD AZ INGÁT — igen–nem + tisztítás ==================== */
window.QA={rot:0,busy:false};
(function(){
  const g=gq("#qaWedges");if(!g)return;
  const _en=(window.CERIDWEN_LANG==="en");const wedges=[{l:_en?"NO":"NEM"},{l:_en?"YES":"IGEN"}];let out="";
  wedges.forEach((w,i)=>{
    const a0=180-i*90,a1=180-(i+1)*90;
    const[x0,y0]=pendulumPolar(a0,Inga_R),[x1,y1]=pendulumPolar(a1,Inga_R);
    out+=`<path class="wedge" data-w="${i}" d="M 210 225 L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${Inga_R} ${Inga_R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z"/>`;
  });
  wedges.forEach((w,i)=>{
    const ac=180-(i+0.5)*90;const[lx,ly]=pendulumPolar(ac,Inga_R-52);
    out+=`<text class="wlabel" data-w="${i}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="16" font-weight="600">${w.l}</text>`;
  });
  g.innerHTML=out;
})();
function qaSetRot(r){QA.rot=r;gq("#qaNeedle").setAttribute("transform",`rotate(${r.toFixed(2)} 210 225)`);}
function qaHighlight(i){gq("#qaChart").querySelectorAll(".wedge,.wlabel").forEach(el=>el.classList.toggle("sel",i>=0&&+el.dataset.w===i));}
function qaLock(v){gq("#qaAsk").disabled=v||!window.ritualDone;gq("#qaClean").disabled=v||!window.ritualDone;}
gq("#qaAsk")?.addEventListener("click",()=>{
  if(QA.busy||!window.ritualDone)return;
  const q=gq("#qaQ").value.trim();
  if(!q){gq("#qaStatus").textContent=cerEn()?"Enter the question first — the pendulum responds to a clearly named question.":"Előbb írd be a kérdést — az inga a kimondott kérdésre felel.";return;}
  const rq=cleanQuestion(q);
  gq("#qaStatus").textContent=cerEn()?"The pendulum weighs the question… Afterwards, ask what still needs to be seen.":"Az inga mérlegeli a kérdést… Utána kérdezd meg ezt is: „"+rq.suggestion+"”";
  QA.busy=true;qaLock(true);qaHighlight(-1);
  const idx=randBool()?1:0;
  const ac=180-(idx+0.5)*90,T=90-ac,start=QA.rot,t0=performance.now();
  (function f(now){
    const t=now-t0,e=Math.min(1,t/500);
    qaSetRot(start+(T-start)*e+55*Math.exp(-t/700)*Math.sin(t/110));
    if(t<2400)requestAnimationFrame(f);
    else{qaSetRot(T);qaHighlight(idx);QA.busy=false;qaLock(false);
      gq("#qaStatus").textContent=cerEn()?`“${q}” — the pendulum answers: ${idx===1?"YES.":"NO."} Deepening question: “What do I still need to see here?” The pendulum does not decide for you; it only shows where attention leans now.`:`„${q}” — az inga válasza: ${idx===1?"IGEN.":"NEM."} Mélyítő kérdés: „${rq.suggestion}” Az inga nem dönt helyetted; csak azt mutatja, merre billen most a figyelmed.`;}
  })(performance.now());
});
gq("#qaClean")?.addEventListener("click",()=>{
  if(QA.busy||!window.ritualDone)return;
  QA.busy=true;qaLock(true);qaHighlight(-1);
  const dur=2500+rnd()*4500;
  const rps=0.5+rnd()*1.3;
  const total=360*rps*(dur/1000);
  const start=QA.rot,t0=performance.now();
  gq("#qaStatus").textContent="Az inga tisztít… tartsd a figyelmed a fényen.";
  (function f(now){
    const t=Math.min(dur,now-t0),p=t/dur,e=1-Math.pow(1-p,2.2);
    qaSetRot(start+total*e);
    if(t<dur)requestAnimationFrame(f);
    else{qaSetRot(0);QA.busy=false;qaLock(false);
      gq("#qaStatus").textContent="A tisztítás lezárult. „Ami a fényből való, maradjon.”";}
  })(performance.now());
});
/* ==================== MAI HOLDÁLLAPOT + KELTA TANÁCS ==================== */
(function(){
  const el=document.getElementById("moonCard");if(!el)return;
  const now=new Date();
  const SYNODIC=29.530588861;
  const RAD=Math.PI/180;
  const degNorm=d=>((d%360)+360)%360;
  const sin=d=>Math.sin(d*RAD), cos=d=>Math.cos(d*RAD);
  const pad=n=>String(n).padStart(2,"0");

  function julianDate(date){
    return date.getTime()/86400000+2440587.5;
  }
  function dateFromJulian(jd){
    return new Date((jd-2440587.5)*86400000);
  }
  function dayOfYear(date){
    const y=date.getUTCFullYear();
    return (Date.UTC(y,date.getUTCMonth(),date.getUTCDate())-Date.UTC(y,0,1))/86400000+1;
  }
  function decimalYear(date){
    const y=date.getUTCFullYear();
    const days=((Date.UTC(y+1,0,1)-Date.UTC(y,0,1))/86400000);
    return y+(dayOfYear(date)-1+(date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600)/24)/days;
  }
  function deltaTSeconds(year){
    
    const t=year-2000;
    if(year>=2005&&year<=2050)return 62.92+0.32217*t+0.005589*t*t;
    if(year>2050&&year<=2150){const u=(year-1820)/100;return -20+32*u*u-0.5628*(2150-year);}
    const u=(year-2000)/100;return 102+102*u+25.3*u*u;
  }
  function jdeToDate(jde){
    const dt=deltaTSeconds(new Date().getUTCFullYear())/86400;
    return dateFromJulian(jde-dt);
  }
  function phaseJDE(k,quarter){
    const kk=k+quarter;
    const T=kk/1236.85,T2=T*T,T3=T2*T,T4=T3*T;
    const E=1-0.002516*T-0.0000074*T2, E2=E*E;
    const M=degNorm(2.5534+29.10535670*kk-0.0000014*T2-0.00000011*T3);
    const Mp=degNorm(201.5643+385.81693528*kk+0.0107582*T2+0.00001238*T3-0.000000058*T4);
    const F=degNorm(160.7108+390.67050284*kk-0.0016118*T2-0.00000227*T3+0.000000011*T4);
    const Om=degNorm(124.7746-1.56375588*kk+0.0020672*T2+0.00000215*T3);
    let jde=2451550.09765+SYNODIC*kk+0.00015437*T2-0.000000150*T3+0.00000000073*T4;

    const A=[
      299.77+0.107408*kk-0.009173*T2,251.88+0.016321*kk,251.83+26.651886*kk,349.42+36.412478*kk,
      84.66+18.206239*kk,141.74+53.303771*kk,207.14+2.453732*kk,154.84+7.306860*kk,
      34.52+27.261239*kk,207.19+0.121824*kk,291.34+1.844379*kk,161.72+24.198154*kk,
      239.56+25.513099*kk,331.55+3.592518*kk
    ];
    const planetary=0.000325*sin(A[0])+0.000165*sin(A[1])+0.000164*sin(A[2])+0.000126*sin(A[3])+0.000110*sin(A[4])+0.000062*sin(A[5])+0.000060*sin(A[6])+0.000056*sin(A[7])+0.000047*sin(A[8])+0.000042*sin(A[9])+0.000040*sin(A[10])+0.000037*sin(A[11])+0.000035*sin(A[12])+0.000023*sin(A[13]);

    if(quarter===0||quarter===0.5){
      jde += (quarter===0?
        -0.40720*sin(Mp)+0.17241*E*sin(M)+0.01608*sin(2*Mp)+0.01039*sin(2*F)+0.00739*E*sin(Mp-M)-0.00514*E*sin(Mp+M)+0.00208*E2*sin(2*M)-0.00111*sin(Mp-2*F)-0.00057*sin(Mp+2*F)+0.00056*E*sin(2*Mp+M)-0.00042*sin(3*Mp)+0.00042*E*sin(M+2*F)+0.00038*E*sin(M-2*F)-0.00024*E*sin(2*Mp-M)-0.00017*sin(Om)-0.00007*sin(Mp+2*M)+0.00004*sin(2*Mp-2*F)+0.00004*sin(3*M)+0.00003*sin(Mp+M-2*F)+0.00003*sin(2*Mp+2*F)-0.00003*sin(Mp+M+2*F)+0.00003*sin(Mp-M+2*F)-0.00002*sin(Mp-M-2*F)-0.00002*sin(3*Mp+M)+0.00002*sin(4*Mp)
        :
        -0.40614*sin(Mp)+0.17302*E*sin(M)+0.01614*sin(2*Mp)+0.01043*sin(2*F)+0.00734*E*sin(Mp-M)-0.00515*E*sin(Mp+M)+0.00209*E2*sin(2*M)-0.00111*sin(Mp-2*F)-0.00057*sin(Mp+2*F)+0.00056*E*sin(2*Mp+M)-0.00042*sin(3*Mp)+0.00042*E*sin(M+2*F)+0.00038*E*sin(M-2*F)-0.00024*E*sin(2*Mp-M)-0.00017*sin(Om)-0.00007*sin(Mp+2*M)+0.00004*sin(2*Mp-2*F)+0.00004*sin(3*M)+0.00003*sin(Mp+M-2*F)+0.00003*sin(2*Mp+2*F)-0.00003*sin(Mp+M+2*F)+0.00003*sin(Mp-M+2*F)-0.00002*sin(Mp-M-2*F)-0.00002*sin(3*Mp+M)+0.00002*sin(4*Mp)
      );
    }else{
      jde += -0.62801*sin(Mp)+0.17172*E*sin(M)-0.01183*E*sin(Mp+M)+0.00862*sin(2*Mp)+0.00804*sin(2*F)+0.00454*E*sin(Mp-M)+0.00204*E2*sin(2*M)-0.00180*sin(Mp-2*F)-0.00070*sin(Mp+2*F)-0.00040*sin(3*Mp)-0.00034*E*sin(2*Mp-M)+0.00032*E*sin(M+2*F)+0.00032*E*sin(M-2*F)-0.00028*E2*sin(Mp+2*M)+0.00027*E*sin(2*Mp+M)-0.00017*sin(Om)-0.00005*sin(Mp-M-2*F)+0.00004*sin(2*Mp+2*F)-0.00004*sin(Mp+M+2*F)+0.00004*sin(Mp-2*M)+0.00003*sin(Mp+M-2*F)+0.00003*sin(3*M)+0.00002*sin(2*Mp-2*F)+0.00002*sin(Mp-M+2*F)-0.00002*sin(3*Mp+M);
      const W=0.00306-0.00038*E*cos(M)+0.00026*cos(Mp)-0.00002*cos(Mp-M)+0.00002*cos(Mp+M)+0.00002*cos(2*F);
      jde += quarter===0.25?W:-W;
    }
    return jde+planetary;
  }
  function phaseEventsAround(date){
    const y=decimalYear(date);
    const base=Math.floor((y-2000)*12.3685)-2;
    const names={0:"Újhold",0.25:"Első negyed",0.5:"Telihold",0.75:"Utolsó negyed"};
    const events=[];
    for(let k=base;k<base+6;k++){
      [0,0.25,0.5,0.75].forEach(q=>events.push({name:names[q],quarter:q,jd:phaseJDE(k,q)}));
    }
    events.sort((a,b)=>a.jd-b.jd);
    const jd=julianDate(date);
    let prev=events[0],next=events[events.length-1];
    for(const ev of events){if(ev.jd<=jd)prev=ev;if(ev.jd>jd){next=ev;break;}}
    return {prev,next,events};
  }
  function moonState(date){
    const jd=julianDate(date);
    const T=(jd-2451545.0)/36525;
    const T2=T*T,T3=T2*T,T4=T3*T;
    const D=degNorm(297.8501921+445267.1114034*T-0.0018819*T2+T3/545868-T4/113065000);
    const M=degNorm(357.5291092+35999.0502909*T-0.0001536*T2+T3/24490000);
    const Mp=degNorm(134.9633964+477198.8675055*T+0.0087414*T2+T3/69699-T4/14712000);
    const i=180-D-6.289*sin(Mp)+2.100*sin(M)-1.274*sin(2*D-Mp)-0.658*sin(2*D)-0.214*sin(2*Mp)-0.110*sin(D);
    const illum=Math.max(0,Math.min(100,(1+cos(i))/2*100));
    const elong=degNorm(D);
    const age=elong/360*SYNODIC;
    const idx=Math.floor(((elong+22.5)%360)/45);
    const phaseNames=["Újhold","Növő sarló","Első negyed","Növő domború hold","Telihold","Fogyó domború hold","Utolsó negyed","Fogyó sarló"];
    return {illum,elong,age,phase:phaseNames[idx],waxing:elong<180};
  }
  function celticSeason(date){
    const y=date.getFullYear();
    const mk=(m,d)=>new Date(y,m-1,d,12,0,0);
    const points=[
      {d:mk(1,1),name:"Yule utáni mély tél",symbol:"a visszatérő fény csendje",advice:"őrizd a belső tüzet; ne sürgesd a választ, előbb pihentesd és érleld."},
      {d:mk(2,1),name:"Imbolc · Brighid küszöbe",symbol:"tisztulás, növekvő fény, megújulás",advice:"tisztíts teret, eszközt és szándékot; a kis láng ma többet ér, mint a nagy fogadalom."},
      {d:mk(3,21),name:"Ostara · a föld ébredése",symbol:"egyensúly, csírázás, indulás",advice:"amit táplálsz, növekedni kezd; válassz egy magot, ne szórd szét az erőd."},
      {d:mk(5,1),name:"Beltane · Bel tüze",symbol:"életerő, vágy, termékeny kapcsolódás",advice:"engedd visszatérni az életkedvet; a döntésedben legyen szív, test és tűz is."},
      {d:mk(6,21),name:"Litha · nyári napforduló",symbol:"csúcspont, bőség, kapunyitás",advice:"nézd meg, mi ért a legerősebbre; amit ma kívánsz, azt felelősen kívánd."},
      {d:mk(8,1),name:"Lughnasadh · Lugh aratása",symbol:"első aratás, mesterség, kenyér",advice:"arasd le az első eredményt, de ne feledd: a valódi mester a tanulságot is betakarítja."},
      {d:mk(9,21),name:"Mabon · őszi egyensúly",symbol:"hála, mérleg, befejezés",advice:"köszönd meg, ami beérett, és tedd rendbe, amit már nem viszel tovább a télbe."},
      {d:mk(11,1),name:"Samhain · az ősök kapuja",symbol:"évforduló, elengedés, fátyol",advice:"hallgasd meg az emlékezetet, de ne ragadj benne; engedd távozni, ami már a múlté."},
      {d:mk(12,22),name:"Yule · a fény újjászületése",symbol:"belső mag, új fény, csendes tervezés",advice:"a leghosszabb éjben születik a fény; tervezz halkan, a növekedés később jön."}
    ];
    let current=points[0];
    for(const p of points){if(date>=p.d)current=p;}
    return current;
  }
  function phaseAdvice(phase){
    return ({
      "Újhold":"Ceridwen üstje most sötét és termékeny: írj le egyetlen tiszta szándékot, de még ne bizonygasd senkinek.",
      "Növő sarló":"A fény vékony pengéje megjelent: ma egy apró, konkrét lépés elég, de azt tedd meg.",
      "Első negyed":"A növekedés próbát kér: válassz irányt, vágd le a kétely fölös ágait.",
      "Növő domború hold":"A forma már látszik: finomíts, javíts, kérj visszajelzést — most a mesterség számít.",
      "Telihold":"A tó tükre tele van fénnyel: arass, ünnepelj, de ne hozz túlfűtött érzelmi ítéletet.",
      "Fogyó domború hold":"A bőségből tudás lesz: oszd meg, amit tanultál, és mondj hálát az eredményért.",
      "Utolsó negyed":"Morrigan csendes rendrakást kér: zárj le, selejtezz, mondd ki a nemet ott, ahol fogyaszt az igen.",
      "Fogyó sarló":"Az üst visszahív: pihenj, tisztíts, álmodj — az új mag még a sötétben készül."
    })[phase]||"Figyeld a Hold ritmusát, és igazítsd hozzá a lépésed.";
  }

  function phaseLore(phase){
    const HU={
      "Újhold":{myth:"<strong>Ceridwen üstje</strong> a sötétben dolgozik. A kelta ihletésű olvasatban ez nem üresség, hanem termékeny csend: a még kimondatlan szándék helye.",focus:"<strong>Rituális fókusz:</strong> egyetlen tiszta magmondat. Ne magyarázd túl, ne bizonygasd; írd le, és hagyd érni.",discipline:"<strong>Merlini fegyelem:</strong> ma ne döntsd el az egész jövőt. Csak azt nevezd meg, mi szeretne benned megszületni."},
      "Növő sarló":{myth:"A vékony fény <strong>Brighid első lángjára</strong> emlékeztet: törékeny, de már irányt mutat. A kezdet itt még védelemre szorul.",focus:"<strong>Rituális fókusz:</strong> egy apró, látható cselekedet. A sarlóhold nem nagy fogadalmat, hanem következetes első lépést kér.",discipline:"<strong>A Tó Hölgye tanítása:</strong> amit most kapsz, ne szórd szét. A friss ajándék felelősséget kér."},
      "Első negyed":{myth:"Az első negyed a <strong>választás próbája</strong>. A fény és az árnyék egyenlő erővel feszül: itt lép be <strong>Merlin döntési fegyelme</strong> és <strong>a Tor spirális emelkedése</strong>. Nem rövidítés visz feljebb, hanem a vállalt kör.",focus:"<strong>Rituális fókusz:</strong> vágd le az egyik fölös ágat. Egy irányt válassz, mert a túl sok kapu szétszórja az erőt.",discipline:"<strong>Merlin üzenete:</strong> a látomás nem elég. Mondd ki, melyik döntést tudod a következő 24 órában vállalni; a Tor arra emlékeztet, hogy az emelkedés lépésenként történik."},
      "Növő domború hold":{myth:"A növő domború hold a <strong>mesterség ideje</strong>. Lugh arany kezét idézi: nem csak ihlet kell, hanem forma, gyakorlat és pontosítás.",focus:"<strong>Rituális fókusz:</strong> javíts, finomíts, kérj visszajelzést. Ami növekszik, most alakot kér.",discipline:"<strong>Ceridwen tanítása:</strong> az üstben a főzetet nem elég egyszer megkeverni. A bölcsesség ismétlésből, figyelemből és türelemből születik."},
      "Telihold":{myth:"Teliholdkor a <strong>Tó Hölgye</strong> tükre tele van fénnyel. Avalon vize megmutatja, mi ért be, és mi torzult túl nagyra.",focus:"<strong>Rituális fókusz:</strong> aratás, hála, megnevezés. Amit meglátsz, azt ne azonnal ítéld meg; előbb ismerd el.",discipline:"<strong>Morgana figyelmeztetése:</strong> a teljes fény felnagyít. Ne hozz túlfűtött érzelmi döntést, amíg a víz nem csendesedik."},
      "Fogyó domború hold":{myth:"A fogyó domború hold a <strong>tanítás és továbbadás</strong> ideje. A három csepp bölcsesség nem birtok, hanem felelősen hordozott tapasztalat.",focus:"<strong>Rituális fókusz:</strong> köszönd meg, ami beérett, és fogalmazd meg, mit tanultál belőle.",discipline:"<strong>Awen tanítása:</strong> a felismerés akkor tiszta, ha nem csak megtartod, hanem rendezett szóvá, gesztussá vagy tetté alakítod."},
      "Utolsó negyed":{myth:"Az utolsó negyed a <strong>rendrakás és leválasztás</strong> kapuja. Morgana árnyékgyógyító arca azt kérdezi: mi védett régen, de tart fogva ma?",focus:"<strong>Rituális fókusz:</strong> lezárás, selejtezés, kimondott nem. Engedd el azt, ami már nem szolgálja a tiszta irányt.",discipline:"<strong>Merlini fegyelem:</strong> ne drámát csinálj a lezárásból. Egy tárgy, egy szokás, egy mondat — ennyi is elég kezdésnek."},
      "Fogyó sarló":{myth:"A fogyó sarló Avalon köde: <strong>visszahúzódás, álom és tisztulás</strong>. A következő mag még nem látható, de már készül.",focus:"<strong>Rituális fókusz:</strong> pihenés, víz, csend, álomnapló. Most nem erőből kell haladni, hanem helyet készíteni.",discipline:"<strong>Ceridwen emlékeztet:</strong> a sötét nem büntetés. Az üstben az új válasz még néma, de már formálódik."}
    };
    const EN={
      "Újhold":{myth:"<strong>Ceridwen’s cauldron</strong> works in the dark. In this Celtic-inspired reading, darkness is not absence; it is fertile silence, the place of the unnamed intention.",focus:"<strong>Ritual focus:</strong> one clean seed-sentence. Do not explain it too much and do not rush to prove it; write it down and let it ripen.",discipline:"<strong>Merlin’s discipline:</strong> do not decide the whole future today. Name only what wants to be born within you."},
      "Növő sarló":{myth:"The thin blade of light recalls <strong>Brighid’s first flame</strong>: fragile, but already directional. The beginning still needs protection.",focus:"<strong>Ritual focus:</strong> one small visible act. The crescent does not ask for a grand vow, but for a consistent first step.",discipline:"<strong>The Lady of the Lake teaches:</strong> do not scatter what has just been given. A fresh gift asks for responsibility."},
      "Első negyed":{myth:"The First Quarter is the <strong>trial of choice</strong>. Light and shadow pull with equal force; here <strong>Merlin’s discipline</strong> and <strong>the Tor’s spiral ascent</strong> enter. No shortcut carries you higher; the chosen circle does.",focus:"<strong>Ritual focus:</strong> cut away one unnecessary branch. Choose one direction, because too many gates scatter the power.",discipline:"<strong>Merlin’s message:</strong> vision is not enough. Name the decision you can carry within the next twenty-four hours; the Tor reminds you that ascent happens step by step."},
      "Növő domború hold":{myth:"The Waxing Gibbous is the time of <strong>craft</strong>. It calls to Lugh’s golden hand: inspiration is not enough; form, practice and correction are needed.",focus:"<strong>Ritual focus:</strong> refine, correct and ask for feedback. What is growing now asks to be shaped.",discipline:"<strong>Ceridwen teaches:</strong> the brew is not stirred only once. Wisdom is born from repetition, attention and patience."},
      "Telihold":{myth:"At the Full Moon, the <strong>Lady of the Lake</strong> holds a mirror full of light. Avalon’s waters reveal what has ripened — and what has grown too large.",focus:"<strong>Ritual focus:</strong> harvest, gratitude and naming. Do not judge immediately what you see; acknowledge it first.",discipline:"<strong>Morgana warns:</strong> full light magnifies. Do not make an overheated emotional decision before the water grows still."},
      "Fogyó domború hold":{myth:"The Waning Gibbous is the time of <strong>teaching and transmission</strong>. The three drops of wisdom are not possession, but experience carried responsibly.",focus:"<strong>Ritual focus:</strong> thank what has ripened and name what it taught you.",discipline:"<strong>Awen teaches:</strong> insight becomes clean when you turn it into ordered speech, gesture or action."},
      "Utolsó negyed":{myth:"The Last Quarter is the gate of <strong>ordering and release</strong>. Morgana’s shadow-healing face asks: what once protected you, but now holds you captive?",focus:"<strong>Ritual focus:</strong> closure, clearing, a spoken no. Release what no longer serves the clean direction.",discipline:"<strong>Merlin’s discipline:</strong> do not turn closure into drama. One object, one habit, one sentence — that is enough to begin."},
      "Fogyó sarló":{myth:"The Waning Crescent is the mist of Avalon: <strong>withdrawal, dream and cleansing</strong>. The next seed is not visible yet, but it is already forming.",focus:"<strong>Ritual focus:</strong> rest, water, silence and dream-journal. Now the path is not forced; space is prepared.",discipline:"<strong>Ceridwen reminds you:</strong> darkness is not punishment. Within the cauldron, the new answer is still silent, but already taking shape."}
    };
    return (cerEn()?EN:HU)[phase] || (cerEn()?EN["Újhold"]:HU["Újhold"]);
  }
  function fmtDateTime(date){
    return date.toLocaleString("hu-HU",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
  }
  function moonGlyphMarkup(st,cx,cy,r,auraR,strokeWidth){
    const phi=st.elong*RAD;
    const rx=Math.max(0.01,Math.abs(Math.cos(phi))*r),waxing=st.waxing,f=(1-Math.cos(phi))/2;
    const so=waxing?1:0, si=f>0.5?so:1-so;
    const lit=f<0.02?"":`<path d="M ${cx} ${cy-r} A ${r} ${r} 0 0 ${so} ${cx} ${cy+r} A ${rx.toFixed(2)} ${r} 0 0 ${si} ${cx} ${cy-r} Z" fill="#e6d9a8"/>`;
    return `
      <circle cx="${cx}" cy="${cy}" r="${auraR}" fill="rgba(163,124,44,.10)"/>
      <defs><clipPath id="moonClip${cx}_${cy}_${r}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
      <g clip-path="url(#moonClip${cx}_${cy}_${r})">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#233240"/>
        ${lit}
      </g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(163,124,44,.58)" stroke-width="${strokeWidth}"/>`;
  }

  const st=moonState(now);
  window.CERIDWEN_MOON=st;
  const phases=phaseEventsAround(now);
  const season=celticSeason(now);
  const phaseEN={"Újhold":"New Moon","Növő sarló":"Waxing Crescent","Első negyed":"First Quarter","Növő domború hold":"Waxing Gibbous","Telihold":"Full Moon","Fogyó domború hold":"Waning Gibbous","Utolsó negyed":"Last Quarter","Fogyó sarló":"Waning Crescent"};
  const phaseAdviceEN={
    "Újhold":"The cauldron is dark and fertile: plant one clean intention and do not hurry to prove it.",
    "Növő sarló":"The first blade of light has appeared: one small concrete step is enough, if you truly take it.",
    "Első negyed":"Growth asks for a choice: cut away the branch that drains the living tree.",
    "Növő domború hold":"The form is visible now: refine, correct and let craft matter more than haste.",
    "Telihold":"The lake is full of light: harvest, give thanks, and do not judge from overheated emotion.",
    "Fogyó domború hold":"Abundance becomes wisdom: share what you learned and bless what has ripened.",
    "Utolsó negyed":"Ceridwen asks for quiet ordering: close what is complete, clear what has accumulated, and say no where an old yes has become a burden.",
    "Fogyó sarló":"The cauldron calls you back: rest, cleanse, dream; the next seed is still forming in the dark."
  };
  const seasonEN={
    "Yule utáni mély tél":["Deep winter after Yule","the silence of returning light","guard the inner fire; let the answer rest before it ripens."],
    "Imbolc · Brighid küszöbe":["Imbolc · Brighid's threshold","cleansing, growing light, renewal","cleanse space, tool and intention; a small flame is stronger than a grand vow."],
    "Ostara · a föld ébredése":["Ostara · the earth awakens","balance, sprouting, beginning","choose one seed; what you feed now begins to grow."],
    "Beltane · Bel tüze":["Beltane · Bel's fire","life-force, desire, fertile connection","let life return to the body; choose with heart, flesh and fire."],
    "Litha · nyári napforduló":["Litha · summer solstice","high point, abundance, opening gate","see what has grown strongest; desire responsibly."],
    "Lughnasadh · Lugh aratása":["Lughnasadh · Lugh's harvest","first harvest, craft, bread","gather the first result, and harvest the lesson as well."],
    "Mabon · őszi egyensúly":["Mabon · autumn balance","gratitude, measure, completion","thank what has ripened and put in order what you will not carry onward."],
    "Samhain · az ősök kapuja":["Samhain · gate of the ancestors","turning of the year, release, veil","listen to memory without being trapped by it; let the past depart."],
    "Yule · a fény újjászületése":["Yule · rebirth of light","inner seed, new light, quiet planning","in the longest night the light is born; plan softly." ]
  };
  const sen=seasonEN[season.name]||[season.name,season.symbol,season.advice];
  const lore=phaseLore(st.phase);
  const advice=cerEn()
    ?`<strong>${phaseAdviceEN[st.phase]||"Follow the rhythm of the Moon and let it pace your step."}</strong> In the Celtic wheel, <strong>${sen[0]}</strong> whispers: ${sen[2]}`
    :`<strong>${phaseAdvice(st.phase)}</strong> <strong>${season.name}</strong> idején a kelta évkerék üzenete: ${season.advice}`;
  const moonGlyph=moonGlyphMarkup(st,30,30,24,27,1.4);
  const heroMoon=document.getElementById("heroMoonGlyph");
  if(heroMoon){ heroMoon.innerHTML = moonGlyphMarkup(st,470,52,18,22,1.2); }

  el.innerHTML=`
    <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" class="moon-glyph">
      ${moonGlyph}
    </svg>
    <div>
      <div class="mt">${cerEn()?"The Moon's rhythm":"A Hold ritmusa"} · ${now.toLocaleDateString(cerEn()?"en-GB":"hu-HU",{year:"numeric",month:"long",day:"numeric"})}</div>
      <h4>${cerEn()?(phaseEN[st.phase]||st.phase):st.phase} <span style="font-size:.65em;color:var(--mist);font-weight:400">· ${Math.round(st.illum)}% ${cerEn()?"light":"fény"} · ${cerEn()?"moon age":"holdkor"} ${st.age.toFixed(1)} ${cerEn()?"days":"nap"}</span></h4>
      <p>${advice}</p>
      <div class="moon-lore">
        <p>${lore.myth}</p>
        <p>${lore.focus}</p>
        <p>${lore.discipline}</p>
      </div>
      <p class="caption" style="margin-top:10px">${cerEn()?"Previous main phase":"Előző fő fázis"}: ${cerEn()?(phaseEN[phases.prev.name]||phases.prev.name):phases.prev.name} · ${fmtDateTime(jdeToDate(phases.prev.jd))}. ${cerEn()?"Next":"Következő"}: ${cerEn()?(phaseEN[phases.next.name]||phases.next.name):phases.next.name} · ${fmtDateTime(jdeToDate(phases.next.jd))}. ${cerEn()?"Celtic rhythm":"Kelta ritmus"}: ${cerEn()?sen[1]:season.symbol}.</p>
      <p class="caption">${cerEn()?"Note":"Megjegyzés"}: ${cerEn()?"this is a Celtic-inspired mythic lens, not a claim of historical reconstruction.":"ez kelta ihletésű mitológiai olvasat, nem történeti rekonstrukcióként állítja magát."}</p>
    </div>`;
})();

/* ==================== MAI LÁTOGATÓI LAP ==================== */
function visitorDayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function visitorRandomIndex(max){
  return randInt(max);
}
function renderDailyVisitorCard(){
  const el=document.getElementById("dailyVisitorCard");
  if(!el||!Array.isArray(DECK)||!DECK.length)return;
  const key="ceridwenDailyVisitorCard";
  const today=visitorDayKey();
  let idx=null;
  try{
    const saved=SafeStorage.jsonGet(LOCAL_STORE,key,null);
    if(saved&&saved.day===today&&Number.isInteger(saved.idx)&&saved.idx>=0&&saved.idx<DECK.length)idx=saved.idx;
  }catch(e){}
  if(idx===null){
    idx=visitorRandomIndex(DECK.length);
    SafeStorage.jsonSet(LOCAL_STORE,key,{day:today,idx});
  }
  const c=DECK[idx], house=HOUSES[c.h]||{name:"Orákulum"};
  const moon=window.CERIDWEN_MOON?currentMoonLens(c):null;
  el.innerHTML=`
    <div class="art" aria-hidden="true">${cardSVG(c)}</div>
    <div>
      <div class="mt">${cerEn()?"Today's visitor card":"Mai látogatói lap"} · ${esc(houseName(c.h))}</div>
      <h4>${esc(c.no)} · ${esc(cardName(c))}</h4>
      <p>${esc(cerEn()?cardLight(c):(c.f||c.u||"Figyeld meg, milyen belső mozdulatot hív ma ez a lap."))}</p>
      ${moon?`<p class="caption">${cerEn()?"Today’s lunar perspective":"Mai hold szerinti árnyalat"}: ${esc(moon.phase)} · ${esc(moon.text)}</p>`:""}
      <p class="caption">${cerEn()?"Question to carry within":"Kérdés magadhoz"}: ${esc(cerEn()?cardQuestion(c):(c.question||"Mi az az egy tiszta lépés, amit ma meg tudok tenni?"))}</p>
    </div>`;
}
renderDailyVisitorCard();



/* ---------- Apple-szerű görgetési belépések ---------- */
(function(){
  const motionOK=!window.matchMedia||!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets='h1,h2,h3,h4,.gate-title,.gate-lede,.awen-meaning,.soft-detail,.moon-card,.daily-visitor-card,.rit-card,.house-card,.spread-btn,.reading-card,.card,.priestess,.gchat,.random-panel,.oracle-out,.journal,.reco,.jentry,.card-pendulum,.dk-energy,.question-refiner,.ceridwen-vow,.integration-panel,.moon-lens,.deck-tone,.sit-btn,.btn,.guide-arrow,.guide-next';
  function mark(root=document){
    root.querySelectorAll(targets).forEach((el,i)=>{
      if(el.classList.contains('reveal-on-scroll')||el.closest('nav.tabs'))return;
      el.classList.add('reveal-on-scroll');
      if(el.matches('.moon-card,.daily-visitor-card,.rit-card,.house-card,.spread-btn,.reading-card,.card,.priestess,.gchat,.random-panel,.oracle-out,.journal,.reco,.jentry,.card-pendulum,.dk-energy,.sit-btn')) el.classList.add('reveal-card');
      if(i%3===1)el.classList.add('reveal-soft-delay');
      if(observer)observer.observe(el);
    });
  }
  let observer=null;
  if(motionOK&&'IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },{root:null,threshold:.08,rootMargin:'0px 0px -8% 0px'});
  }
  function init(){
    mark(document);
    if(!motionOK||!observer){
      document.querySelectorAll('.reveal-on-scroll').forEach(el=>el.classList.add('is-visible'));
    }
    const mo=new MutationObserver(muts=>{
      muts.forEach(m=>m.addedNodes.forEach(n=>{
        if(n.nodeType===1){
          mark(n);
          if(!motionOK||!observer)n.querySelectorAll?.('.reveal-on-scroll').forEach(el=>el.classList.add('is-visible'));
        }
      }));
    });
    const observedRoot=document.querySelector(".shell")||document.body;
    mo.observe(observedRoot,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

CERIDWEN_DIAGNOSTICS.booted=true;
CERIDWEN_DIAGNOSTICS.bootTime=new Date().toISOString();


/* ===== BELSŐ IRÁNYTŰ KALAND — gyerekbarát önreflexiós mód ===== */
(()=>{
 const $k=s=>document.querySelector(s); if(!$k('#v-kids'))return;
 const rnd=n=>{if(!Number.isInteger(n)||n<1)throw new Error('Invalid random range');const max=0x100000000,lim=max-(max%n),a=new Uint32Array(1);let x;do{crypto.getRandomValues(a);x=a[0]}while(x>=lim);return x%n};
 const dirs=[
  {name:'Bátorság',icon:'🦁',angle:0,msg:'Lehet, hogy most egy pici bátor lépés segít. Nem kell sárkányt legyőzni — elég egy mini lépés.',action:'Mondd ki hangosan az első apró dolgot, amit meg tudsz próbálni.'},
  {name:'Nyugalom',icon:'🌿',angle:60,msg:'A fejed talán turbófokozaton pörög. Előbb lassíts, aztán dönts.',action:'Lélegezz be 4 számolásig, ki 5-ig — háromszor.'},
  {name:'Segítség',icon:'🤝',angle:120,msg:'A szuperhősöknek is van csapatuk. Segítséget kérni nem csalás, hanem okos stratégia.',action:'Válassz egy megbízható felnőttet vagy barátot, és mondd el neki egy mondatban, mi bánt.'},
  {name:'Kíváncsiság',icon:'🔎',angle:180,msg:'Lehet, hogy nem az a kérdés, hogy „Mi a baj velem?”, hanem az, hogy „Mit próbál jelezni ez az érzés?”',action:'Írj le három dolgot: mit tudsz biztosan, mit csak sejtesz, és mit szeretnél megkérdezni.'},
  {name:'Kedvesség',icon:'💛',angle:240,msg:'Beszélj magaddal úgy, mint a legjobb barátoddal. A belső morcos manó nem mindig mond igazat.',action:'Mondj magadnak egy kedves, igaz mondatot.'},
  {name:'Szünet',icon:'⏸️',angle:300,msg:'Néha a legokosabb lépés egy rövid szünet. Az agyad nem mikró — nem kell mindent 30 másodperc alatt megoldani.',action:'Igyál vizet, mozogj két percet, majd nézz rá újra a kérdésre.'}
 ];
 let feeling='',busy=false;
 const show=(el)=>{el.hidden=false;requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'start'}));};
 $k('#kidsBegin')?.addEventListener('click',()=>show($k('#kidsFeelingCard')));
 $k('#kidsFeelings')?.addEventListener('click',e=>{const b=e.target.closest('button[data-feeling]');if(!b)return;feeling=b.dataset.feeling;document.querySelectorAll('#kidsFeelings button').forEach(x=>x.classList.toggle('on',x===b));show($k('#kidsCompassCard'));});
 $k('#kidsAsk')?.addEventListener('click',()=>{if(busy)return;busy=true;const b=$k('#kidsAsk'),status=$k('#kidsStatus'),needle=$k('#kidsNeedle');b.disabled=true;status.textContent='Az iránytű nyújtózik… egy pillanat!';const i=rnd(dirs.length),d=dirs[i],turns=720+d.angle;needle.style.transform=`translate(-50%,-100%) rotate(${turns}deg)`;window.Haptics?.play?.('start');setTimeout(()=>{status.textContent=`Az irány: ${d.name}`;const q=$k('#kidsQuestion').value.trim();const result=$k('#kidsResult');result.innerHTML=`<div class="kids-result__icon">${d.icon}</div><div class="kids-result__tag">${d.name}</div><h3>${d.name} mód bekapcsolva!</h3><p>${d.msg}</p>${q?`<p><strong>A kérdésed:</strong> ${esc(q)}</p>`:''}<div class="kids-result__action">🎯 <strong>Mini küldetés:</strong> ${d.action}</div><p class="small-note">Ez játékos ötlet, nem kötelező válasz. Te döntöd el, illik-e rád. Ha a kérdés ijesztő, fájdalmas vagy a biztonságodról szól, beszélj egy megbízható felnőttel.</p><div class="kids-result__buttons"><button type="button" class="btn kids-again">Új irány</button><button type="button" class="btn ghost kids-reset">Új kérdés</button></div>`;result.hidden=false;result.querySelector('.kids-again').addEventListener('click',()=>{result.hidden=true;b.click()});result.querySelector('.kids-reset').addEventListener('click',()=>{feeling='';$k('#kidsQuestion').value='';result.hidden=true;$k('#kidsFeelingCard').hidden=true;$k('#kidsCompassCard').hidden=true;document.querySelectorAll('#kidsFeelings button').forEach(x=>x.classList.remove('on'));needle.style.transform='translate(-50%,-100%) rotate(0deg)';$k('#kidsStartCard').scrollIntoView({behavior:'smooth',block:'start'})});b.disabled=false;busy=false;window.Haptics?.play?.('result');result.scrollIntoView({behavior:'smooth',block:'start'});},1250);});
})();
