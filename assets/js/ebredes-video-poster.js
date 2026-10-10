/* Ébredés original film cover. The image is hosted locally; YouTube remains consent-first. */
(function(){
  function applyOriginalFilmCover(){
    var frame=document.querySelector('.art-video[data-video-id="npJ6YeYxQ64"] .art-video__frame');
    if(!frame)return;
    frame.style.backgroundImage='url("/assets/img/video/npJ6YeYxQ64.jpg")';
    frame.style.backgroundPosition='center';
    frame.style.backgroundSize='cover';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyOriginalFilmCover,{once:true});
  else applyOriginalFilmCover();
})();
