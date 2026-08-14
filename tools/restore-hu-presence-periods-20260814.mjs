import fs from 'node:fs';

const home='hu/index.html';
const curator='hu/curators.html';
const data=JSON.parse(fs.readFileSync('data/archive/oeuvre-periods.json','utf8'));
let html=fs.readFileSync(home,'utf8');
if(/id=["']presence-periods["']/.test(html)){
  console.log('HU presence-periods already exists; no change.');
  process.exit(0);
}
const cur=fs.readFileSync(curator,'utf8');
const periodBodies=new Map();
for(const p of data.periods){
  const re=new RegExp(`<article\\b[^>]*id=["']${p.id}["'][^>]*>[\\s\\S]*?<h3[^>]*>([\\s\\S]*?)<\\/h3>[\\s\\S]*?<p>([\\s\\S]*?)<\\/p>[\\s\\S]*?<\\/article>`,'i');
  const m=cur.match(re);
  if(!m) throw new Error(`Missing canonical HU curator period ${p.id}`);
  const strip=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
  periodBodies.set(p.id,{heading:strip(m[1]),body:strip(m[2])});
}
const labels=['I · Kezdet','II · Emberi történetek','III · Test és felépülés','IV · Intézmények és közösségek','V · Nyilvános jelenlét'];
const cards=data.periods.map((p,i)=>{
  const b=periodBodies.get(p.id);
  return `<article class="presence-period"><p class="label">${labels[i]}</p><h3>${b.heading}</h3><p>${b.body}</p></article>`;
}).join('');
const section=`<section id="presence-periods" class="tone-a presence-periods"><div class="wrap">
  <div class="section-head"><p class="label">Az életmű szerkezete</p><h2>A jelenlét kutatásának korszakai</h2><p class="lead">Öt korszak segít áttekinteni, hogyan változott a munka a korai megbízásoktól a személyes történeteken és a testen át a közösségi, oktatási és nyilvános jelenlétig.</p></div>
  <div class="presence-period-grid">${cards}</div>
  <nav class="presence-period-links" aria-label="Az életmű dokumentációja">
    <a href="#books">Könyvek és kiadványok →</a>
    <a href="#exhibitions">Kiállítások és nyilvános bemutatások →</a>
    <a href="press.html">Sajtó- és mozgóképes források →</a>
    <a href="curators.html">Teljes kurátori dosszié →</a>
  </nav>
</div></section>`;
const anchor='<section id="journey"';
if(!html.includes(anchor)) throw new Error('HU homepage journey anchor missing; refusing insertion.');
html=html.replace(anchor,section+'\n'+anchor);
fs.writeFileSync(home,html);
console.log('Restored canonical HU presence-periods homepage section from oeuvre + curator sources.');
