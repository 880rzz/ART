/* Hide the floating contact trigger only while homepage hero CTAs are visible. */
(()=>{
  const cta=document.querySelector('header.hero#top .hero-cta');
  if(!cta||!('IntersectionObserver' in window))return;
  const mobile=window.matchMedia('(max-width:640px)');
  let intersecting=false;
  const sync=()=>document.body.classList.toggle('art-hero-cta-in-view',mobile.matches&&intersecting);
  const observer=new IntersectionObserver(entries=>{intersecting=entries[0].isIntersecting;sync();},{threshold:0});
  observer.observe(cta);
  mobile.addEventListener?.('change',sync);
})();
