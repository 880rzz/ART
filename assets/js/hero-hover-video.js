(()=>{
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
      if(year)year.textContent='2017 -';
    }
    for(const link of menu.querySelectorAll('a[href$="exhibitions/avalosag.html"]')){
      const year=link.querySelector('.yr');
      if(year){const yearNode=year.cloneNode(true);link.replaceChildren(yearNode,falseFacesTitle)}
      else link.textContent=falseFacesTitle;
    }
  };
  document.addEventListener('click',event=>{
    if(event.target.closest&&event.target.closest('.burger'))normalizeMenu();
  },true);

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
    let retryBound=false;

    const hide=()=>hero.classList.remove('video-active','video-loading');
    const reveal=()=>{
      if(!wantsPlayback)return;
      hero.classList.remove('video-loading');
      hero.classList.add('video-active');
    };
    const requestPlay=()=>{
      if(!wantsPlayback)return;
      let result;
      try{result=video.play()}catch{return}
      if(result&&typeof result.catch==='function'){
        result.catch(()=>{
          if(!wantsPlayback||retryBound)return;
          retryBound=true;
          const retry=()=>{
            retryBound=false;
            if(wantsPlayback){try{video.play()}catch{}}
          };
          video.addEventListener('loadeddata',retry,{once:true});
          video.addEventListener('canplay',retry,{once:true});
        });
      }
    };
    const ensureLoaded=()=>{
      if(loadRequested)return;
      loadRequested=true;
      video.preload='auto';
      try{video.load()}catch{}
    };
    const start=()=>{
      if(wantsPlayback)return;
      wantsPlayback=true;
      hero.classList.add('video-loading');
      ensureLoaded();
      /* Calling play immediately is intentional: muted HTMLMediaElement.play()
         creates the pending playback request and makes Chromium/Safari continue
         fetching instead of waiting at HAVE_METADATA for a canplay event. */
      requestPlay();
    };
    const stop=()=>{
      wantsPlayback=false;
      retryBound=false;
      hide();
      try{video.pause()}catch{}
      try{if(video.readyState>=1)video.currentTime=0}catch{}
    };

    video.addEventListener('playing',reveal);
    video.addEventListener('error',hide);
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
