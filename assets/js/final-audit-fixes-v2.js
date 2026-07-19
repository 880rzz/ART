(()=>{
  'use strict';

  const pairs=[
    {toggle:document.getElementById('menuToggle'),menu:document.getElementById('mainTabs')},
    {toggle:document.getElementById('yesNoMenuToggle'),menu:document.getElementById('yesNoNav')}
  ].filter(pair=>pair.toggle&&pair.menu);

  const compact=()=>window.matchMedia('(max-width:760px)').matches;
  const focusableSelector='button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
  const labels={
    hu:{open:'Menü megnyitása',close:'Menü bezárása'},
    en:{open:'Open menu',close:'Close menu'}
  };
  const language=document.documentElement.lang.startsWith('en')?'en':'hu';

  function setMenu(pair,open,{restoreFocus=false,focusFirst=false}={}){
    const active=Boolean(open);
    pair.toggle.setAttribute('aria-expanded',String(active));
    pair.toggle.setAttribute('aria-label',active?labels[language].close:labels[language].open);
    pair.menu.classList.toggle('open',active);
    pair.menu.setAttribute('aria-hidden',String(!active));
    document.body.classList.toggle('menu-open',active);
    if(active&&focusFirst)requestAnimationFrame(()=>pair.menu.querySelector(focusableSelector)?.focus());
    if(!active&&restoreFocus)pair.toggle.focus();
  }

  function closeOtherMenus(activePair){
    pairs.forEach(pair=>{if(pair!==activePair)setMenu(pair,false);});
  }

  pairs.forEach(pair=>{
    pair.toggle.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      const opening=pair.toggle.getAttribute('aria-expanded')!=='true';
      closeOtherMenus(pair);
      setMenu(pair,opening,{focusFirst:opening});
    },true);

    pair.menu.addEventListener('click',event=>{
      const target=event.target.closest('button,a');
      if(!target)return;
      if(compact())setMenu(pair,false);
    },true);

    setMenu(pair,false);
  });

  document.addEventListener('pointerdown',event=>{
    pairs.forEach(pair=>{
      if(pair.toggle.getAttribute('aria-expanded')!=='true')return;
      if(pair.menu.contains(event.target)||pair.toggle.contains(event.target))return;
      setMenu(pair,false);
    });
  },true);

  document.addEventListener('keydown',event=>{
    const pair=pairs.find(item=>item.toggle.getAttribute('aria-expanded')==='true');
    if(!pair)return;
    if(event.key==='Escape'){
      event.preventDefault();
      setMenu(pair,false,{restoreFocus:true});
      return;
    }
    if(event.key!=='Tab')return;
    const nodes=[...pair.menu.querySelectorAll(focusableSelector)].filter(el=>!el.hidden&&el.offsetParent!==null);
    if(!nodes.length){event.preventDefault();pair.toggle.focus();return;}
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  },true);

  window.addEventListener('resize',()=>pairs.forEach(pair=>setMenu(pair,false)),{passive:true});

  const mainMenu=document.getElementById('mainTabs');
  if(mainMenu){
    mainMenu.querySelectorAll('button[data-v]').forEach(button=>{
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
        mainMenu.querySelectorAll('button[data-v]').forEach(tab=>{
          const on=tab===button;
          tab.classList.toggle('on',on);
          tab.setAttribute('aria-selected',String(on));
          tab.tabIndex=on?0:-1;
        });
        target.hidden=false;
        target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      },true);
    });
  }

  document.querySelectorAll('.mist-layer,#stars,#forestScene').forEach(layer=>{
    layer.setAttribute('aria-hidden','true');
    layer.style.pointerEvents='none';
  });

  document.querySelectorAll('header.site').forEach(header=>header.setAttribute('data-audit-fixed','true'));
  document.documentElement.classList.add('final-audit-ready');
})();
