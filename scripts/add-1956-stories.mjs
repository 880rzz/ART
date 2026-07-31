import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const targets = [
  {path:'exhibitions/merfoldkovek1956.html', lang:'en'},
  {path:'de-at/exhibitions/merfoldkovek1956.html', lang:'de'},
  {path:'hu/exhibitions/merfoldkovek1956.html', lang:'hu'}
];

const labels = {
  hu:{button:'Élettörténet',eyebrow:'1956-os portré és életút',close:'Bezárás',source:'A kiállítás eredeti magyar nyelvű leírása'},
  en:{button:'Life story (HU)',eyebrow:'Portrait and life story from 1956',close:'Close',source:'Original Hungarian-language exhibition text'},
  de:{button:'Lebensgeschichte (HU)',eyebrow:'Porträt und Lebensweg von 1956',close:'Schließen',source:'Ungarischer Originaltext der Ausstellung'}
};

const css=`
/* 1956 PORTRAIT STORIES */
.collage figure{isolation:isolate}
.story-open{position:absolute;left:1rem;bottom:1rem;z-index:3;border:1px solid rgba(240,198,116,.78);background:rgba(14,13,11,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#f0c674;border-radius:999px;padding:.62rem .95rem;font:inherit;font-size:.78rem;line-height:1;letter-spacing:.015em;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.34);transition:background .22s,transform .22s}
.story-open:hover{background:rgba(24,21,17,.96);transform:translateY(-2px)}
.story-open:focus-visible{outline:3px solid #f0c674;outline-offset:3px}
#story-dialog{position:fixed;inset:0;z-index:180;display:none;align-items:center;justify-content:center;padding:clamp(.7rem,3vw,2.2rem)}
#story-dialog.open{display:flex}
.story-backdrop{position:absolute;inset:0;background:rgba(5,5,6,.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.story-panel{position:relative;z-index:1;width:min(860px,100%);max-height:min(88vh,900px);overflow:auto;background:linear-gradient(145deg,#1b1814,#100f0d 62%);border:1px solid rgba(240,198,116,.25);border-radius:24px;box-shadow:0 30px 100px rgba(0,0,0,.7);padding:clamp(1.45rem,4vw,3.4rem)}
.story-close{position:sticky;float:right;top:0;z-index:2;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#f5f5f7;font:inherit;font-size:1.15rem;cursor:pointer}
.story-kicker{color:#f0c674;text-transform:uppercase;letter-spacing:.14em;font-size:.7rem;margin:0 3.5rem .75rem 0}
.story-panel h2{font-size:clamp(1.8rem,4vw,3rem);line-height:1.04;margin:0 3.5rem .35rem 0}
.story-role{color:#b9b1a5;font-size:1rem;margin:0 0 2rem}
.story-copy{border-top:1px solid rgba(255,255,255,.1);padding-top:1.7rem}
.story-copy p{font-size:clamp(.98rem,1.7vw,1.08rem);line-height:1.72;color:#d2cdc4;max-width:72ch;margin:0 0 1.15rem}
.story-source{font-size:.76rem;color:#817a70;border-top:1px solid rgba(255,255,255,.08);padding-top:1.2rem;margin-top:2rem}
body.story-modal-open{overflow:hidden}
@media(max-width:640px){.story-open{left:.75rem;bottom:.75rem}.story-panel{border-radius:18px;max-height:92vh}.story-panel h2{font-size:1.8rem}}
`;

const dialog=(l)=>`
<div id="story-dialog" role="dialog" aria-modal="true" aria-labelledby="story-title" aria-hidden="true">
  <div class="story-backdrop" data-story-close></div>
  <article class="story-panel" tabindex="-1">
    <button class="story-close" type="button" data-story-close aria-label="${l.close}">×</button>
    <p class="story-kicker">${l.eyebrow}</p>
    <h2 id="story-title"></h2>
    <p class="story-role" id="story-role"></p>
    <div class="story-copy" id="story-copy"></div>
    <p class="story-source">${l.source}</p>
  </article>
</div>`;

const js=(l)=>`
<script>
(function(){
  var dialog=document.getElementById('story-dialog');
  if(!dialog)return;
  var panel=dialog.querySelector('.story-panel'),title=document.getElementById('story-title'),role=document.getElementById('story-role'),copy=document.getElementById('story-copy'),lastFocus=null,stories=[];
  fetch('/assets/data/merfoldkovek1956-stories-hu.json').then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(data){stories=data.stories||[];}).catch(function(){stories=[];});
  function esc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}
  function openStory(index,button){var story=stories[index];if(!story)return;lastFocus=button;title.textContent=story.name;role.textContent=story.role||'';copy.innerHTML=(story.paragraphs||[]).map(function(p){return '<p>'+esc(p)+'</p>';}).join('');dialog.classList.add('open');dialog.setAttribute('aria-hidden','false');document.body.classList.add('story-modal-open');panel.scrollTop=0;panel.focus();}
  function closeStory(){dialog.classList.remove('open');dialog.setAttribute('aria-hidden','true');document.body.classList.remove('story-modal-open');if(lastFocus)lastFocus.focus();}
  document.querySelectorAll('#galwrap figure').forEach(function(fig,index){var b=document.createElement('button');b.type='button';b.className='story-open';b.textContent=${JSON.stringify(l.button)};b.setAttribute('aria-label',${JSON.stringify(l.button)}+' — '+(index+1));b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openStory(index,b);});fig.appendChild(b);});
  dialog.querySelectorAll('[data-story-close]').forEach(function(el){el.addEventListener('click',closeStory);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dialog.classList.contains('open'))closeStory();});
})();
</script>`;

for (const target of targets) {
  const file=path.join(root,target.path);
  let html=fs.readFileSync(file,'utf8');
  if(html.includes('id="story-dialog"')) continue;
  const l=labels[target.lang];
  html=html.replace('</style>',css+'\n</style>');
  html=html.replace('</main>',dialog(l)+'\n</main>');
  html=html.replace('</body>',js(l)+'\n</body>');
  fs.writeFileSync(file,html);
}
