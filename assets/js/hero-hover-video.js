(()=>{
  const lang=(document.documentElement.lang||'en').toLowerCase();
  const falseFacesTitle=lang.startsWith('hu')
    ? 'A valóság hamis arcai'
    : lang.startsWith('de')
      ? 'Die falschen Gesichter der Wirklichkeit'
      : 'The False Faces of Reality';

  for(const link of document.querySelectorAll('a[href$="exhibitions/ebredes.html"]')){
    const year=link.querySelector('.yr');
    if(year) year.textContent='2017 -';
  }
  for(const link of document.querySelectorAll('a[href$="exhibitions/avalosag.html"]')){
    const year=link.querySelector('.yr');
    if(year){
      const yearNode=year.cloneNode(true);
      link.replaceChildren(yearNode,falseFacesTitle);
    }else{
      link.textContent=falseFacesTitle;
    }
  }

  const primaryFine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const anyFine=matchMedia('(any-hover:hover) and (any-pointer:fine)').matches;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if((!primaryFine&&!anyFine)||reduced)return;

  for(const hero of document.querySelectorAll('header.hero[data-hover-video]')){
    const video=hero.querySelector('.hero-hover-video');
    if(!video)continue;

    /* Safari is more reliable when the muted/inline state exists both as
       attributes and DOM properties before load() is requested. Preloading is
       cheap here (the decorative hero clip is deliberately tiny), but playback
       still starts only from hover/focus. */
    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    video.preload='auto';
    try{video.load()}catch{}

    let wantsPlayback=false;
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
