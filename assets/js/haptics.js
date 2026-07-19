(function(){
  "use strict";
  const STORAGE_KEY="ceridwen_haptics_enabled_v1";
  const patterns={
    tap:18,
    start:[35,45,35],
    step:[22,35,22],
    reveal:[45,55,70],
    cleanse:[55,45,55,45,90],
    complete:[35,50,35,50,110],
    warning:[90,60,90]
  };
  let enabled=localStorage.getItem(STORAGE_KEY)!=="0";
  let lastAt=0;
  function supported(){return typeof navigator!=="undefined"&&typeof navigator.vibrate==="function";}
  function vibrate(kind="tap"){
    if(!enabled||!supported()||document.hidden)return false;
    const now=Date.now();
    if(now-lastAt<90)return false;
    lastAt=now;
    try{return navigator.vibrate(patterns[kind]||patterns.tap)!==false;}catch(_){return false;}
  }
  function setEnabled(value){enabled=Boolean(value);localStorage.setItem(STORAGE_KEY,enabled?"1":"0");if(!enabled&&supported())navigator.vibrate(0);return enabled;}
  window.CeridwenHaptics={vibrate,setEnabled,isEnabled:()=>enabled,isSupported:supported,patterns};

  const normalize=s=>String(s||"").trim().toLowerCase();
  const actionKind=el=>{
    const id=normalize(el.id), text=normalize(el.textContent), cls=normalize(el.className);
    if(/clean|tiszt|oldás|felold|szándék/.test(id+" "+text+" "+cls))return "cleanse";
    if(/pendulum|inga|drawbtn|dkScan|scan|oraclebtn|ülés megkezdése|session|merítés|vizsgálat/.test(id+" "+text))return "start";
    if(/gsb|tovább|continue|kapcsolódtam|megtörtént|megtisztult/.test(id+" "+text))return "step";
    if(/flip|felford|reveal/.test(id+" "+text))return "reveal";
    if(/restart|renew|új ülés|full ritual/.test(id+" "+text))return "start";
    return null;
  };
  document.addEventListener("click",event=>{
    const el=event.target.closest("button,[role='button']");
    if(!el||el.disabled||el.getAttribute("aria-disabled")==="true")return;
    const kind=actionKind(el);if(kind)vibrate(kind);
  },true);

  // Results created asynchronously receive a distinct physical confirmation.
  const watched=["cardsNextGuide","postdraw","dkResults","dkGrid","pendulumFound","pendulumClear","pendulumBlessTxt","oracleOut","pendulumOracleOut"];
  const snapshots=new WeakMap();
  const observer=new MutationObserver(records=>{
    let changed=false;
    for(const record of records){
      const root=record.target.nodeType===1?record.target:record.target.parentElement;
      const host=root&&root.closest&&root.closest("#"+watched.join(",#"));
      if(!host)continue;
      const text=normalize(host.textContent);
      if(text&&text!==snapshots.get(host)){snapshots.set(host,text);changed=true;}
    }
    if(changed)vibrate("reveal");
  });
  watched.forEach(id=>{const el=document.getElementById(id);if(el){snapshots.set(el,normalize(el.textContent));observer.observe(el,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class","hidden","style"]});}});

  document.addEventListener("ceridwen:process-start",()=>vibrate("start"));
  document.addEventListener("ceridwen:cleanse-start",()=>vibrate("cleanse"));
  document.addEventListener("ceridwen:process-complete",()=>vibrate("complete"));
})();
