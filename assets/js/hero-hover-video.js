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

  /* Destination-specific Book CTA names are now authored directly in the
     three homepage HTML files, so no accessibility DOM migration is needed. */
  const primaryFine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const anyFine=matchMedia('(any-hover:hover) and (any-pointer:fine)').matches;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if((!primaryFine&&!anyFine)||reduced)return;

  for(const hero of document.querySelectorAll('header.hero[data-hover-video]')){
    const video=hero.querySelector('.hero-hover-video');
    if(!video)continue;

    /* Keep the decorative clip completely out of the startup path. The HTML
       deliberately ships preload="none"; only a real hover/focus interaction
       is allowed to opt into fetching and decoding the video. */
    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');

    let wantsPlayback=false;
    let loadRequested=false;
    const ensureLoaded=()=>{
      if(loadRequested)return;
      loadRequested=true;
      video.preload='auto';
      try{video.load()}catch{}
    };
    const hide=()=>hero.classList.remove('video-active','video-loading');
    const stop=()=>{
      wantsPlayback=false;
      hide();
      try{video.pause()}catch{}
      try{if(video.readyState>=1)video.currentTime=0}catch{}
    };
    const start=()=>{
      wantsPlayback=true;
      hero.classList.add('video-loading');
      ensureLoaded();
      try{if(video.readyState>=1)video.currentTime=0}catch{}
      let playResult;
      try{playResult=video.play()}catch{hide();return}
      if(playResult&&typeof playResult.catch==='function'){
        playResult.catch(()=>{if(wantsPlayback)hide()});
      }
    };
    const reveal=()=>{
      if(!wantsPlayback)return;
      hero.classList.remove('video-loading');
      hero.classList.add('video-active');
    };

    video.addEventListener('playing',reveal);
    video.addEventListener('error',hide);
    hero.addEventListener('pointerenter',start,{passive:true});
    hero.addEventListener('pointerleave',stop,{passive:true});
    hero.addEventListener('focusin',start);
    hero.addEventListener('focusout',event=>{
      if(!event.relatedTarget||!hero.contains(event.relatedTarget))stop();
    });
    if(!('PointerEvent' in window)){
      hero.addEventListener('mouseenter',start,{passive:true});
      hero.addEventListener('mouseleave',stop,{passive:true});
    }
  }
})();
