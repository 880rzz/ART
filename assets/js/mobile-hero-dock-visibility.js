/* The homepage portrait is an uninterrupted editorial composition on phones.
   Hide the floating Contact trigger for the entire visible hero, not just when
   its CTA grid happens to intersect the viewport. Other pages keep the dock. */
(()=>{
  const hero=document.querySelector('header.hero#top');
  if(!hero||!('IntersectionObserver' in window))return;
  const mobile=window.matchMedia('(max-width:640px)');
  let heroVisible=false;
  const sync=()=>document.body.classList.toggle('art-home-hero-in-view',mobile.matches&&heroVisible);
  const observer=new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;sync();},{threshold:0});
  observer.observe(hero);
  mobile.addEventListener?.('change',sync);
})();
