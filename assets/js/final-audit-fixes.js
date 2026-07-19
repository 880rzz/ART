(()=>{
  'use strict';

  const header=document.querySelector('header.site');
  const toggle=document.getElementById('menuToggle');
  const menu=document.getElementById('mainTabs');
  if(!toggle||!menu)return;

  const compact=()=>window.matchMedia('(max-width:760px)').matches;
  const focusableSelector='button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';

  function setMenu(open,{restoreFocus=false,focusFirst=false}={}){
    const active=Boolean(open);
    toggle.setAttribute('aria-expanded',String(active));
    toggle.setAttribute('aria-label',active
      ?(document.documentElement.lang.startsWith('en')?'Close menu':'Menü bezárása')
      :(document.documentElement.lang.startsWith('en')?'Open menu':'Menü megnyitása'));
    menu.classList.toggle('open',active);
    menu.setAttribute('aria-hidden',String(!active));
    document.body.classList.toggle('menu-open',active);
    if(active&&focusFirst){
      requestAnimationFrame(()=>menu.querySelector(focusableSelector)?.focus());
    }
    if(!active&&restoreFocus)toggle.focus();
  }

  /* Capture phase makes the control independent of older click handlers. */
  toggle.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    setMenu(toggle.getAttribute('aria-expanded')!=='true',{focusFirst:true});
  },true);

  menu.addEventListener('click',event=>{
    const target=event.target.closest('button,a');
    if(!target)return;
    if(compact())setMenu(false);
  },true);

  document.addEventListener('pointerdown',event=>{
    if(toggle.getAttribute('aria-expanded')!=='true')return;
    if(menu.contains(event.target)||toggle.contains(event.target))return;
    setMenu(false);
  },true);

  document.addEventListener('keydown',event=>{
    if(toggle.getAttribute('aria-expanded')!=='true')return;
    if(event.key==='Escape'){
      event.preventDefault();
      setMenu(false,{restoreFocus:true});
      return;
    }
    if(event.key!=='Tab')return;
    const nodes=[...menu.querySelectorAll(focusableSelector)].filter(el=>!el.hidden&&el.offsetParent!==null);
    if(!nodes.length){event.preventDefault();toggle.focus();return;}
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  },true);

  window.addEventListener('resize',()=>{
    if(toggle.getAttribute('aria-expanded')==='true')setMenu(false);
  },{passive:true});

  /* Navigation tab repair: buttons always activate their referenced view. */
  menu.querySelectorAll('button[data-v]').forEach(button=>{
    button.addEventListener('click',()=>{
      const key=button.dataset.v;
      const target=document.getElementById(`v-${key}`);
      if(!target)return;
      document.querySelectorAll('.view').forEach(view=>{
        const on=view===target;
        view.classList.toggle('on',on);
        view.hidden=!on;
        view.setAttribute('aria-hidden',String(!on));
      });
      menu.querySelectorAll('button[data-v]').forEach(tab=>{
        const on=tab===button;
        tab.classList.toggle('on',on);
        tab.setAttribute('aria-selected',String(on));
        tab.tabIndex=on?0:-1;
      });
      target.hidden=false;
      target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    },true);
  });

  /* Decorative scene must never become an interaction or stacking layer. */
  document.querySelectorAll('.mist-layer,#stars,#forestScene').forEach(layer=>{
    layer.setAttribute('aria-hidden','true');
    layer.style.pointerEvents='none';
  });

  setMenu(false);
  if(header)header.setAttribute('data-audit-fixed','true');
  document.documentElement.classList.add('final-audit-ready');
})();
