(function(){
  "use strict";

  const mythologyCss=document.createElement("link");
  mythologyCss.rel="stylesheet";
  mythologyCss.href="assets/css/mythology-authenticity.css?v=20260718-auth1";
  document.head.appendChild(mythologyCss);

  const mythologyScript=document.createElement("script");
  mythologyScript.src="assets/js/mythology-authenticity.js?v=20260718-auth1";
  mythologyScript.async=false;
  document.head.appendChild(mythologyScript);

  document.querySelectorAll("nav.tabs .tab-page-link").forEach(link=>{
    link.removeAttribute("role");
    link.removeAttribute("aria-selected");
    if(link.getAttribute("tabindex")==="-1")link.removeAttribute("tabindex");
  });

  const mainMenuToggle=document.getElementById("menuToggle");
  const mainMenu=document.getElementById("mainTabs");
  const isMobileMenu=()=>window.matchMedia("(max-width: 760px)").matches;
  const menuFocusable='button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
  function setMainMenu(open,{restoreFocus=false,focusFirst=false}={}){
    if(!mainMenuToggle||!mainMenu)return;
    const active=Boolean(open)&&isMobileMenu();
    mainMenuToggle.setAttribute("aria-expanded",String(active));
    mainMenuToggle.setAttribute("aria-label",active?(document.documentElement.lang.startsWith("en")?"Close menu":"Menü bezárása"):(document.documentElement.lang.startsWith("en")?"Open menu":"Menü megnyitása"));
    mainMenu.classList.toggle("open",active);
    mainMenu.setAttribute("aria-hidden",String(isMobileMenu()&&!active));
    document.body.classList.toggle("menu-open",active);
    if(active&&focusFirst)requestAnimationFrame(()=>mainMenu.querySelector(menuFocusable)?.focus());
    if(restoreFocus)mainMenuToggle.focus();
  }
  if(mainMenuToggle&&mainMenu){
    setMainMenu(false);
    mainMenuToggle.addEventListener("click",event=>{
      event.stopPropagation();
      setMainMenu(mainMenuToggle.getAttribute("aria-expanded")!=="true",{focusFirst:true});
    });
    mainMenu.addEventListener("click",event=>{
      if(event.target.closest("button,a"))setMainMenu(false);
    });
    document.addEventListener("click",event=>{
      if(mainMenuToggle.getAttribute("aria-expanded")==="true"&&!mainMenu.contains(event.target)&&!mainMenuToggle.contains(event.target))setMainMenu(false);
    });
    document.addEventListener("keydown",event=>{
      if(mainMenuToggle.getAttribute("aria-expanded")!=="true")return;
      if(event.key==="Escape"){setMainMenu(false,{restoreFocus:true});return;}
      if(event.key!=="Tab")return;
      const nodes=[...mainMenu.querySelectorAll(menuFocusable)].filter(el=>el.offsetParent!==null);
      if(!nodes.length){event.preventDefault();mainMenuToggle.focus();return;}
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    window.addEventListener("resize",()=>setMainMenu(false),{passive:true});
  }

  const en=()=>String(window.CERIDWEN_LANG||document.documentElement.lang||"hu").toLowerCase().startsWith("en");
  const msg=(hu,enText)=>en()?enText:hu;
  const note=()=>document.getElementById("journalNote");
  const setNote=text=>{const el=note();if(el)el.textContent=text;};
  const safeFileName=()=>`ceridwen-journal-${new Date().toISOString().slice(0,10)}.json`;

  function downloadJournal(){
    try{
      const payload={
        schemaVersion:typeof CERIDWEN_STORAGE_VERSION!=="undefined"?CERIDWEN_STORAGE_VERSION:3,
        appVersion:typeof CERIDWEN_APP_VERSION!=="undefined"?CERIDWEN_APP_VERSION:"unknown",
        deckVersion:typeof CERIDWEN_DECK_VERSION!=="undefined"?CERIDWEN_DECK_VERSION:"unknown",
        exportedAt:new Date().toISOString(),
        entries:Array.isArray(journal)?journal:[]
      };
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=safeFileName();document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNote(msg("A napló biztonsági mentése elkészült.","The journal backup has been exported."));
    }catch(error){
      console.error("journal-export",error);
      setNote(msg("A napló exportálása nem sikerült.","The journal could not be exported."));
    }
  }

  async function importJournal(file){
    if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      const incoming=Array.isArray(data)?data:Array.isArray(data?.entries)?data.entries:[];
      if(!incoming.length)throw new Error("No entries");
      const existing=Array.isArray(journal)?journal:[];
      const key=e=>e?.drawId||`${e?.timestamp||e?.date||""}|${e?.spread||""}|${(e?.cards||[]).join("|")}`;
      const seen=new Set(existing.map(key));
      const clean=incoming.filter(e=>e&&typeof e==="object"&&!seen.has(key(e)));
      clean.forEach(e=>seen.add(key(e)));
      journal=[...clean,...existing].slice(0,typeof CERIDWEN_JOURNAL_LIMIT!=="undefined"?CERIDWEN_JOURNAL_LIMIT:150);
      journalPersist();renderJournal();
      setNote(msg(`${clean.length} új bejegyzés importálva.`,`${clean.length} new entries imported.`));
    }catch(error){
      console.error("journal-import",error);
      setNote(msg("A fájl nem érvényes Ceridwen-napló.","The file is not a valid Ceridwen journal."));
    }
  }

  document.getElementById("exportJournalBtn")?.addEventListener("click",downloadJournal);
  document.getElementById("importJournalInput")?.addEventListener("change",event=>{
    importJournal(event.target.files?.[0]);event.target.value="";
  });
  document.querySelector('label[for="importJournalInput"]')?.addEventListener("keydown",event=>{
    if(event.key==="Enter"||event.key===" "){event.preventDefault();document.getElementById("importJournalInput")?.click();}
  });

  const syncVisibility=()=>document.body.classList.toggle("motion-paused",document.hidden);
  document.addEventListener("visibilitychange",syncVisibility);syncVisibility();

  const veil=document.getElementById("veil");
  const focusable='button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function setBackgroundInert(active){
    [...document.body.children].forEach(el=>{
      if(el===veil||el.tagName==="SCRIPT")return;
      if(active)el.setAttribute("inert","");else el.removeAttribute("inert");
    });
  }
  function onModalOpen(){setBackgroundInert(true);}
  function onModalClose(){setBackgroundInert(false);}
  veil?.addEventListener("ceridwen:modal-open",onModalOpen);
  veil?.addEventListener("ceridwen:modal-close",onModalClose);
  if(veil){new MutationObserver(()=>setBackgroundInert(veil.classList.contains("on"))).observe(veil,{attributes:true,attributeFilter:["class","aria-hidden"]});}
  document.addEventListener("keydown",event=>{
    if(event.key!=="Tab"||!veil?.classList.contains("on"))return;
    const nodes=[...veil.querySelectorAll(focusable)].filter(el=>el.offsetParent!==null);
    if(!nodes.length){event.preventDefault();veil.focus();return;}
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  },true);

  const EVENT_HISTORY_KEY="ceridwen_card_events_v1";
  const EVENT_HISTORY_LIMIT=96;

  function normalizeCardEvent(event){
    if(!event||typeof event!=="object")return null;
    const eventId=String(event.eventId||"").trim();
    const cardId=String(event.cardId||"").trim();
    const pack=String(event.pack||"global").trim()||"global";
    const sequence=Number(event.sequence);
    if(!eventId||!cardId||!Number.isSafeInteger(sequence)||sequence<1)return null;
    return {eventId,cardId,pack,sequence,timestamp:String(event.timestamp||"")};
  }

  function loadCardEvents(){
    const raw=SafeStorage.jsonGet(SESSION_STORE,EVENT_HISTORY_KEY,[]);
    if(!Array.isArray(raw))return [];
    const seen=new Set();
    return raw.map(normalizeCardEvent).filter(event=>{
      if(!event||seen.has(event.eventId))return false;
      seen.add(event.eventId);
      return true;
    }).sort((a,b)=>a.sequence-b.sequence).slice(-EVENT_HISTORY_LIMIT);
  }

  function saveCardEvents(events){
    return SafeStorage.jsonSet(SESSION_STORE,EVENT_HISTORY_KEY,events.slice(-EVENT_HISTORY_LIMIT));
  }

  function selectCombinedCardEvents(events,pack="global",packLimit=18,globalLimit=14){
    const ordered=events.map(normalizeCardEvent).filter(Boolean).sort((a,b)=>a.sequence-b.sequence);
    const safePackLimit=Math.max(0,Math.floor(Number(packLimit)||0));
    const safeGlobalLimit=Math.max(0,Math.floor(Number(globalLimit)||0));
    if(!pack||pack==="global")return ordered.slice(-Math.max(safePackLimit,safeGlobalLimit));
    const globalRecent=ordered.slice(-safeGlobalLimit);
    const packRecent=ordered.filter(event=>event.pack===pack).slice(-safePackLimit);
    const selectedIds=new Set([...globalRecent,...packRecent].map(event=>event.eventId));
    return ordered.filter(event=>selectedIds.has(event.eventId)).slice(-(safePackLimit+safeGlobalLimit));
  }

  let randomHardeningInstalled=false;
  if(typeof rememberCards==="function"&&typeof combinedRecentHistory==="function"&&typeof makeDrawId==="function"){
    const coreRememberCards=rememberCards;
    rememberCards=function(ids,pack="global"){
      const clean=Array.isArray(ids)?ids.filter(Boolean).map(String):[];
      coreRememberCards(ids,pack);
      if(!clean.length)return;
      const previous=loadCardEvents();
      const nextSequence=(previous.at(-1)?.sequence||0)+1;
      const drawId=makeDrawId("HST");
      const timestamp=new Date().toISOString();
      const additions=clean.map((cardId,index)=>({
        eventId:`${drawId}-${index+1}`,
        cardId,
        pack:String(pack||"global"),
        sequence:nextSequence+index,
        timestamp
      }));
      if(!saveCardEvents(previous.concat(additions)))reportWarning("card-event-history","The exact draw-event history cannot be saved in this browser.");
    };
    combinedRecentHistory=function(pack="global",packLimit=18,globalLimit=14){
      return selectCombinedCardEvents(loadCardEvents(),pack,packLimit,globalLimit).map(event=>event.cardId);
    };
    randomHardeningInstalled=true;
  }else{
    reportWarning("random-hardening","Random history hardening could not attach because the application core was not loaded first.");
  }

  window.CeridwenRandomAudit={
    secureRandom:Boolean(globalThis.crypto?.getRandomValues),
    historySchema:"event-id-v1",
    exactEventDeduplication:true,
    installed:randomHardeningInstalled,
    loadCardEvents,
    selectCombinedCardEvents
  };

  window.CeridwenSelfTest=function(){
    const cards=typeof DECK!=="undefined"&&Array.isArray(DECK)?DECK.length:0;
    const lex=document.querySelectorAll(".lexcard,.lex-card").length;
    const unlabeled=[...document.querySelectorAll("input:not([type=hidden]),textarea,select")].filter(el=>{
      const id=el.id;return !el.getAttribute("aria-label")&&!el.getAttribute("aria-labelledby")&&!(id&&document.querySelector(`label[for="${CSS.escape(id)}"]`))&&!el.closest("label");
    }).map(el=>el.id||el.name||el.tagName);
    const invalidPageLinks=[...document.querySelectorAll("nav.tabs .tab-page-link")].filter(el=>el.getAttribute("role")==="tab"||el.getAttribute("tabindex")==="-1").map(el=>el.textContent.trim());
    return {appVersion:typeof CERIDWEN_APP_VERSION!=="undefined"?CERIDWEN_APP_VERSION:null,deckVersion:typeof CERIDWEN_DECK_VERSION!=="undefined"?CERIDWEN_DECK_VERSION:null,cards,lexiconCards:lex,secureRandom:Boolean(globalThis.crypto?.getRandomValues),randomAudit:{...window.CeridwenRandomAudit,eventCount:loadCardEvents().length},mythologyAudit:window.CeridwenMythologyAudit||{installed:false},mobileMenu:{installed:Boolean(mainMenuToggle&&mainMenu),expanded:mainMenuToggle?.getAttribute("aria-expanded")==="true"},unlabeledControls:unlabeled,invalidPageLinks,diagnostics:window.__CERIDWEN_DIAGNOSTICS__||null};
  };
})();

(()=>{
  'use strict';
  const ID='flowGuideArrow';
  const text=()=>document.documentElement.lang.startsWith('en')?'Go to the next step':'Ugrás a következő lépéshez';
  const visible=el=>el&&el.offsetParent!==null&&!el.hidden;
  const activeView=()=>[...document.querySelectorAll('.view')].find(visible);
  const actionable=v=>[...v.querySelectorAll('.srt-wizard-card,.srt-protocol-card,.pendulum-stage,.reading:not(:empty),.ritual-gate,.ritual-ok,.simple-path,.integration-panel,.kids-card:not([hidden]),.kids-result:not([hidden])')]
    .filter(el=>visible(el)&&!el.closest('.ai-prompt-copy')&&!el.matches('[aria-hidden="true"]'));
  function nextTarget(){
    const v=activeView(); if(!v)return null;
    const bottom=window.innerHeight-72;
    const nodes=actionable(v);
    const current=nodes.find(el=>{const r=el.getBoundingClientRect();return r.top<bottom&&r.bottom>88;});
    if(current){
      const r=current.getBoundingClientRect();
      if(r.bottom>Math.min(bottom,window.innerHeight*.62))return null;
    }
    return nodes.find(el=>el.getBoundingClientRect().top>bottom+16)||null;
  }
  function sync(){
    let btn=document.getElementById(ID); const target=nextTarget();
    if(!target){btn?.remove();return;}
    if(!btn){
      btn=document.createElement('button');btn.id=ID;btn.type='button';btn.className='flow-down-arrow flow-down-arrow--singleton';
      btn.innerHTML='<span aria-hidden="true">↓</span>';document.body.appendChild(btn);
    }
    btn.setAttribute('aria-label',text());btn.dataset.target='1';
    btn.onclick=()=>{const t=nextTarget();if(t)t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
  }
  let raf=0;const queue=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(sync)};
  addEventListener('DOMContentLoaded',()=>{sync();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','aria-hidden']});});
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
})();
