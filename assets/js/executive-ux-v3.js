(()=>{
  'use strict';
  const compact=()=>matchMedia('(max-width:760px)').matches;
  const language=document.documentElement.lang.toLowerCase().startsWith('en')?'en':'hu';
  const copy=language==='en'?{open:'Open menu',close:'Close menu'}:{open:'Menü megnyitása',close:'Menü bezárása'};
  const pairs=[
    {toggle:document.getElementById('menuToggle'),menu:document.getElementById('mainTabs')},
    {toggle:document.getElementById('yesNoMenuToggle'),menu:document.getElementById('yesNoNav')}
  ].filter(x=>x.toggle&&x.menu);
  const focusable='button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';

  function setMenu(pair,open,{focus=false,restore=false}={}){
    const active=compact()&&Boolean(open);
    pair.toggle.setAttribute('aria-expanded',String(active));
    pair.toggle.setAttribute('aria-label',active?copy.close:copy.open);
    pair.menu.classList.toggle('open',active);
    pair.menu.setAttribute('aria-hidden',String(compact()&&!active));
    document.body.classList.toggle('menu-open',active);
    if(active&&focus)requestAnimationFrame(()=>pair.menu.querySelector(focusable)?.focus());
    if(!active&&restore)pair.toggle.focus();
  }
  function closeAll(except=null){pairs.forEach(pair=>{if(pair!==except)setMenu(pair,false)});}
  pairs.forEach(pair=>{
    pair.toggle.addEventListener('click',event=>{
      event.preventDefault();event.stopImmediatePropagation();
      const opening=pair.toggle.getAttribute('aria-expanded')!=='true';
      closeAll(pair);setMenu(pair,opening,{focus:opening});
    },true);
    pair.menu.addEventListener('click',event=>{if(compact()&&event.target.closest('button,a'))setMenu(pair,false)},true);
    setMenu(pair,false);
  });
  document.addEventListener('pointerdown',event=>pairs.forEach(pair=>{
    if(pair.toggle.getAttribute('aria-expanded')==='true'&&!pair.toggle.contains(event.target)&&!pair.menu.contains(event.target))setMenu(pair,false);
  }),true);
  document.addEventListener('keydown',event=>{
    const pair=pairs.find(x=>x.toggle.getAttribute('aria-expanded')==='true');if(!pair)return;
    if(event.key==='Escape'){event.preventDefault();setMenu(pair,false,{restore:true});return;}
    if(event.key!=='Tab')return;
    const nodes=[...pair.menu.querySelectorAll(focusable)].filter(el=>el.offsetParent!==null);
    if(!nodes.length){event.preventDefault();pair.toggle.focus();return;}
    const first=nodes[0],last=nodes.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  },true);
  addEventListener('resize',()=>pairs.forEach(pair=>setMenu(pair,false)),{passive:true});

  const main=document.getElementById('mainTabs');
  const views=[...document.querySelectorAll('.view')];
  const tabs=main?[...main.querySelectorAll('button[data-v]')]:[];
  function activate(key,{scroll=true,hash=true}={}){
    const target=document.getElementById(`v-${key}`);const tab=main?.querySelector(`button[data-v="${key}"]`);
    if(!target||!tab)return false;
    views.forEach(view=>{const on=view===target;view.classList.toggle('on',on);view.hidden=!on;view.setAttribute('aria-hidden',String(!on));});
    tabs.forEach(item=>{const on=item===tab;item.classList.toggle('on',on);item.setAttribute('aria-selected',String(on));item.tabIndex=on?0:-1;});
    if(hash)history.replaceState(null,'',key==='gate'?location.pathname:`#${key}`);
    if(scroll)scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    return true;
  }
  tabs.forEach(tab=>tab.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();activate(tab.dataset.v);},true));
  const deep=(location.hash||'').slice(1);if(deep)activate(deep,{scroll:false,hash:false});else activate('gate',{scroll:false,hash:false});
  addEventListener('hashchange',()=>{const key=location.hash.slice(1)||'gate';activate(key,{scroll:false,hash:false});});

  // Legacy reveal classes could stay permanently blurred when observers attached late.
  document.querySelectorAll('.reveal-on-scroll').forEach(el=>el.classList.add('is-visible'));
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType!==1)return;
    if(node.matches?.('.ck-guide,.ck-fog,.ck-spore,#flowNudge,.flow-nudge')){node.remove();return;}
    node.querySelectorAll?.('.ck-guide,.ck-fog,.ck-spore,#flowNudge,.flow-nudge').forEach(el=>el.remove());
    if(node.matches?.('.reveal-on-scroll'))node.classList.add('is-visible');
    node.querySelectorAll?.('.reveal-on-scroll').forEach(el=>el.classList.add('is-visible'));
  }))).observe(document.body,{childList:true,subtree:true});

  // Remove duplicated, blocking coach UI; all critical guidance remains inline in each flow.
  document.querySelectorAll('.ck-guide,.ck-fog,.ck-spore').forEach(el=>el.remove());
  document.querySelectorAll('.mist-layer,#stars,#forestScene').forEach(el=>{el.hidden=true;el.setAttribute('aria-hidden','true')});
  document.documentElement.classList.add('executive-ux-ready');
})();
