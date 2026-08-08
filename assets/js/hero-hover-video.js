(()=>{
  /* Exhibition menu copy is normalized only when the visitor actually opens
     the menu. This keeps the large archive DOM out of the startup path while
     preserving the approved multilingual labels before the overlay appears. */
  let menuNormalized=false;
  const normalizeMenu=()=>{
    if(menuNormalized)return;
    const menu=document.getElementById('menu');
    if(!menu)return;
    menuNormalized=true;
    const lang=(document.documentElement.lang||'en').toLowerCase();
    const falseFacesTitle=lang.startsWith('hu')
      ? 'A valóság hamis arcai'
      : lang.startsWith('de')
        ? 'Die falschen Gesichter der Wirklichkeit'
        : 'The False Faces of Reality';

    for(const link of menu.querySelectorAll('a[href$="exhibitions/ebredes.html"]')){
      const year=link.querySelector('.yr');
      if(year) year.textContent='2017 -';
    }
    for(const link of menu.querySelectorAll('a[href$="exhibitions/avalosag.html"]')){
      const year=link.querySelector('.yr');
      if(year){
        const yearNode=year.cloneNode(true);
        link.replaceChildren(yearNode,falseFacesTitle);
      }else{
        link.textContent=falseFacesTitle;
      }
    }
  };
  document.addEventListener('click',event=>{
    if(event.target.closest&&event.target.closest('.burger'))normalizeMenu();
  },true);

  /* Lighthouse and screen readers must be able to distinguish the two studio
     map destinations even when their visible CTA copy is intentionally
     identical. Keep the visible editorial text, provide a destination-specific
     accessible name in all three languages. */
  const lang=(document.documentElement.lang||'en').toLowerCase();
  for(const link of document.querySelectorAll('#contact a[href*="google.com/maps/search"]')){
    const href=decodeURIComponent(link.getAttribute('href')||'');
    const isVienna=/Schwedenplatz|Vienna|Wien/i.test(href);
    const label=lang.startsWith('hu')
      ? (isVienna?'Bécsi stúdió megnyitása a Google Térképen':'Budapesti stúdió megnyitása a Google Térképen')
      : lang.startsWith('de')
        ? (isVienna?'Wiener Studio in Google Maps öffnen':'Budapester Studio in Google Maps öffnen')
        : (isVienna?'Open Vienna studio in Google Maps':'Open Budapest studio in Google Maps');
    link.setAttribute('aria-label',label);
  }

  /* Hero motion is a desktop enhancement. Do not use fine-pointer media
     queries as the sole gate: convertible laptops and some Safari/trackpad
     combinations can report a coarse primary pointer even while a real mouse
     hover is available. Viewport width + actual mouse/pointer entry is the
     reliable contract; CSS still removes the video on coarse/mobile devices. */
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||window.innerWidth<=900)return;

  for(const hero of document.querySelectorAll('header.hero[data-hover-video]')){
    const video=hero.querySelector('.hero-hover-video');
    if(!video)continue;

    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');

    let wantsPlayback=false;
    let loadRequested=false;
    let playPending=false;

    const hide=()=>hero.classList.remove('video-active','video-loading');
    const requestPlay=()=>{
      if(!wantsPlayback||playPending)return;
      playPending=true;
      try{if(video.readyState>=1)video.currentTime=0}catch{}
      let result;
      try{result=video.play()}catch{playPending=false;hide();return}
      if(result&&typeof result.then==='function'){
        result.then(()=>{playPending=false}).catch(()=>{playPending=false;if(wantsPlayback)hide()});
      }else{
        playPending=false;
      }
    };
    const ensureLoaded=()=>{
      if(loadRequested)return;
      loadRequested=true;
      video.preload='auto';
      video.addEventListener('canplay',requestPlay,{once:true});
      try{video.load()}catch{}
    };
    const stop=()=>{
      wantsPlayback=false;
      playPending=false;
      hide();
      try{video.pause()}catch{}
      try{if(video.readyState>=1)video.currentTime=0}catch{}
    };
    const start=()=>{
      wantsPlayback=true;
      hero.classList.add('video-loading');
      ensureLoaded();
      if(video.readyState>=2)requestPlay();
    };
    const reveal=()=>{
      if(!wantsPlayback)return;
      hero.classList.remove('video-loading');
      hero.classList.add('video-active');
    };

    video.addEventListener('playing',reveal);
    video.addEventListener('error',hide);
    /* Bind both families deliberately. mouseenter repairs Safari/trackpad
       cases; pointerenter covers pen/mouse PointerEvent implementations. */
    hero.addEventListener('mouseenter',start,{passive:true});
    hero.addEventListener('mouseleave',stop,{passive:true});
    hero.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')start()},{passive:true});
    hero.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen')stop()},{passive:true});
    hero.addEventListener('focusin',start);
    hero.addEventListener('focusout',event=>{
      if(!event.relatedTarget||!hero.contains(event.relatedTarget))stop();
    });
  }
})();
