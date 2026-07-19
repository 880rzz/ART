(()=>{
'use strict';
const lang=(document.documentElement.lang||'hu').toLowerCase().startsWith('en')?'en':'hu';
const T=lang==='hu'?{
  progress:'Haladás',soundOn:'Hang be',soundOff:'Hang ki',achievements:'Mérföldkövek',summary:'Mai összegzés',
  summaryLead:'A folyamat végén itt gyűlnek össze a legfontosabb felismerések és a következő apró lépés.',
  noSummary:'Még nincs összegzés. Indíts egy vetést, tisztítást, ingaülést vagy Belső Iránytű-kalandot.',
  cards:'Megjelent eredmények',next:'Következő apró lépés',breathe:'Állj meg egy pillanatra, vegyél három lassú levegőt, majd válassz egyetlen megvalósítható lépést.',
  first:'Első lépés',clean:'Tisztító út',oracle:'Belső iránytű',streak:'Visszatérő felfedező',close:'Bezárás',
  spiritual:'Az eredmények önreflexiós, spirituális szimbólumok; nem bizonyított tények, diagnózisok vagy kezelési javaslatok.'
}:{
  progress:'Progress',soundOn:'Sound on',soundOff:'Sound off',achievements:'Milestones',summary:'Today’s summary',
  summaryLead:'At the end of a process, the most useful insights and one small next step collect here.',
  noSummary:'No summary yet. Begin a reading, cleansing, pendulum session or Kids Compass adventure.',
  cards:'Results shown',next:'One small next step',breathe:'Pause, take three slow breaths, then choose one realistic action.',
  first:'First step',clean:'Cleansing path',oracle:'Inner compass',streak:'Returning explorer',close:'Close',
  spiritual:'Results are symbolic tools for spiritual self-reflection, not established facts, diagnoses or treatment advice.'
};
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const key='ceridwen.experience.v2';
let state={sound:false,actions:0,cleanings:0,sessions:0,lastDay:'',streak:0};
try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch(_){ }
const save=()=>{try{localStorage.setItem(key,JSON.stringify(state))}catch(_){}};
function audio(kind='step'){
  if(!state.sound||document.hidden)return;
  try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=audio.ctx||(audio.ctx=new C());if(c.state==='suspended')c.resume();const o=c.createOscillator(),g=c.createGain(),now=c.currentTime,f=kind==='done'?660:kind==='clean'?432:520;o.frequency.setValueAtTime(f,now);o.type='sine';g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.035,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+.18);o.connect(g).connect(c.destination);o.start(now);o.stop(now+.2)}catch(_){ }
}
function addToolbar(){
  const host=$('nav.tabs')||document.body.firstElementChild;if(!host||$('#experienceToolbar'))return;
  const bar=document.createElement('div');bar.id='experienceToolbar';bar.className='experience-toolbar';
  bar.innerHTML=`<div class="experience-progress" role="progressbar" aria-label="${T.progress}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span>${T.progress}</span><div class="experience-progress__track"><i></i></div><strong>0%</strong></div><div class="experience-actions"><button type="button" class="experience-chip" id="experienceSound" aria-pressed="${state.sound}">${state.sound?'🔊 '+T.soundOff:'🔈 '+T.soundOn}</button><button type="button" class="experience-chip" id="experienceAchievements">✦ ${T.achievements}</button></div><p class="experience-safety">${T.spiritual}</p>`;
  host.insertAdjacentElement('afterend',bar);
  $('#experienceSound').addEventListener('click',()=>{state.sound=!state.sound;save();const b=$('#experienceSound');b.setAttribute('aria-pressed',String(state.sound));b.textContent=state.sound?'🔊 '+T.soundOff:'🔈 '+T.soundOn;if(state.sound)audio('done')});
  $('#experienceAchievements').addEventListener('click',openAchievements);
}
function activeView(){return $('.view.on')||$('.view:not([hidden])')}
function progressValue(){const v=activeView();if(!v)return 0;if(v.id==='v-gate')return 10;if(v.id==='v-cave')return 20;if(v.id==='v-draw')return $$('.reading-card',v).length?85:35;if(v.id==='v-cleanse')return $$('.reading-card,.dk-energy',v).length?80:40;if(v.id==='v-pendulum'){const txt=(($('#pendulumStatus')?.textContent)||'').toLowerCase();return txt.includes('lezár')||txt.includes('closed')?100:txt.includes('kutatás')||txt.includes('research')?65:txt.includes('belép')||txt.includes('entry')?35:20}if(v.id==='v-kids')return $('#kidsResult')&&!$('#kidsResult').hidden?100:45;if(v.id==='v-lex')return 55;if(v.id==='v-journal')return 100;return 0}
function updateProgress(){const p=progressValue(),i=$('.experience-progress__track i'),s=$('.experience-progress strong'),r=$('.experience-progress');if(i)i.style.width=p+'%';if(s)s.textContent=p+'%';if(r)r.setAttribute('aria-valuenow',String(p))}
function today(){return new Date().toISOString().slice(0,10)}
function bump(type){state.actions++;if(type==='clean')state.cleanings++;if(type==='session')state.sessions++;const d=today();if(state.lastDay!==d){const prev=new Date(Date.now()-86400000).toISOString().slice(0,10);state.streak=state.lastDay===prev?state.streak+1:1;state.lastDay=d}save()}
function badges(){return [{on:state.actions>=1,icon:'🌱',name:T.first,desc:lang==='hu'?'Elindítottad az első folyamatot.':'You began your first process.'},{on:state.cleanings>=3,icon:'🌿',name:T.clean,desc:lang==='hu'?'Legalább három tisztító lépést végigvittél.':'You completed at least three cleansing steps.'},{on:state.sessions>=1,icon:'🧭',name:T.oracle,desc:lang==='hu'?'Végigmentél egy vezetett ülésen.':'You completed a guided session.'},{on:state.streak>=3,icon:'✨',name:T.streak,desc:lang==='hu'?'Három egymást követő napon visszatértél.':'You returned on three consecutive days.'}]}
let modalReturnFocus=null;
function closeAchievements(){const m=$('#experienceModal');if(!m)return;m.classList.remove('is-open');document.body.classList.remove('modal-open');modalReturnFocus?.focus?.();modalReturnFocus=null}
function openAchievements(){
  modalReturnFocus=document.activeElement;
  let m=$('#experienceModal');if(!m){m=document.createElement('div');m.id='experienceModal';m.className='experience-modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-labelledby','experienceModalTitle');document.body.appendChild(m)}
  m.innerHTML=`<div class="experience-modal__card" tabindex="-1"><button type="button" class="experience-modal__close" aria-label="${T.close}">×</button><h2 id="experienceModalTitle">${T.achievements}</h2><div class="experience-badges">${badges().map(b=>`<article class="experience-badge ${b.on?'is-earned':''}"><span>${b.icon}</span><div><h3>${b.name}</h3><p>${b.desc}</p></div></article>`).join('')}</div></div>`;
  m.classList.add('is-open');document.body.classList.add('modal-open');m.querySelector('.experience-modal__close').addEventListener('click',closeAchievements);m.addEventListener('click',e=>{if(e.target===m)closeAchievements()},{once:true});m.querySelector('.experience-modal__card').focus();
}
function addSummary(){const journal=$('#v-journal');if(!journal||$('#experienceSummary'))return;const sec=document.createElement('section');sec.id='experienceSummary';sec.className='experience-summary';sec.innerHTML=`<p class="experience-summary__eyebrow">${T.summary}</p><h2>${T.summary}</h2><p>${T.summaryLead}</p><div id="experienceSummaryBody"><p>${T.noSummary}</p></div>`;journal.prepend(sec)}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function refreshSummary(){const out=$('#experienceSummaryBody');if(!out)return;const visible=$$('.reading-card,.kids-result:not([hidden]),.dk-energy').filter(el=>el.offsetParent!==null).slice(-5);if(!visible.length)return;const items=visible.map(el=>{const h=el.querySelector('h3,h4,.nm,.result-title');return(h?.textContent||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100)}).filter(Boolean);out.innerHTML=`<h3>${T.cards}</h3><ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><div class="experience-next"><strong>${T.next}</strong><p>${T.breathe}</p></div>`}
function guidedCleanse(){$$('.cleanse-intention,.dk-energy,.srt-clean-box').forEach(el=>{if(el.dataset.guided==='1')return;el.dataset.guided='1';const p=document.createElement('div');p.className='guided-breath';p.innerHTML=lang==='hu'?'<strong>🌿 Egy pillanat magadnak</strong><span>Hunyd be a szemed, vegyél három lassú levegőt, mondd ki a szándékot magadban vagy hangosan, majd indítsd el a tisztítást.</span>':'<strong>🌿 A moment for yourself</strong><span>Close your eyes, take three slow breaths, say the intention silently or aloud, then begin the cleansing.</span>';el.prepend(p)})}
let scheduled=false;function scheduleRefresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;updateProgress();guidedCleanse();refreshSummary()})}
function observe(){const mo=new MutationObserver(scheduleRefresh);mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const txt=(b.textContent||'').toLowerCase();if(/tiszt|clean|oldás|intention/.test(txt)){bump('clean');audio('clean')}else if(/ülés|session|vetés|draw|iránytű|compass|üst/.test(txt)){bump('session');audio('step')}else audio('step');setTimeout(scheduleRefresh,120)},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#experienceModal')?.classList.contains('is-open'))closeAchievements();if(e.key==='Tab'){const m=$('#experienceModal.is-open');if(!m)return;const f=$$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',m).filter(x=>!x.disabled&&x.offsetParent!==null);if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}})}
function init(){addToolbar();addSummary();guidedCleanse();updateProgress();observe();refreshSummary()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
