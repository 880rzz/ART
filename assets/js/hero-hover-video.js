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

  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!fine||reduced)return;
  for(const hero of document.querySelectorAll('header.hero[data-hover-video]')){
    const video=hero.querySelector('.hero-hover-video'); if(!video)continue;
    const start=async()=>{try{video.currentTime=0;await video.play();hero.classList.add('video-active')}catch{hero.classList.remove('video-active')}};
    const stop=()=>{hero.classList.remove('video-active');video.pause();try{video.currentTime=0}catch{}};
    hero.addEventListener('pointerenter',start,{passive:true});
    hero.addEventListener('pointerleave',stop,{passive:true});
  }
})();
