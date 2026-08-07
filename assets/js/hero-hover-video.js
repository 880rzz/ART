(()=>{
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
