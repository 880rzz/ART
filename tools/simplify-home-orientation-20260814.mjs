import fs from 'node:fs';

const pages=[
  {
    file:'index.html',
    curators:'/curators.html',community:'/community.html',press:'/press.html',
    bridge:`<section class="tone-a life-journey archive-orientation" id="journey"><div class="wrap"><div class="section-head"><p class="label">Navigate the oeuvre</p><h2>Follow the work through context, chronology and sources</h2><p class="lead">The homepage is an orientation layer. The complete interpretation of periods, turning points and artistic context belongs to the curatorial dossier; public activity and source records remain in their dedicated archive sections.</p></div><div class="archive-grid"><article class="archive-card"><h3>Curatorial dossier</h3><p>Read the full chronology, recurring questions and the development of the work.</p><a href="/curators.html">Open the curatorial dossier</a></article><article class="archive-card"><h3>Community and public activity</h3><p>Follow public programmes, professional participation and community-facing work.</p><a href="/community.html">Browse community records</a></article><article class="archive-card"><h3>Press and preserved sources</h3><p>Verify interviews, articles, television appearances and preserved source records.</p><a href="/press.html">Browse press records</a></article></div></div></section>`
  },
  {
    file:'hu/index.html',
    bridge:`<section class="tone-a life-journey archive-orientation" id="journey"><div class="wrap"><div class="section-head"><p class="label">Az életmű bejárása</p><h2>Kontextus, kronológia és ellenőrizhető források</h2><p class="lead">A főoldal tájékozódási réteg. A korszakok, fordulópontok és a művészeti összefüggések teljes értelmezése a kurátori dossziéban található; a nyilvános szereplések és források saját archívumoldalon maradnak.</p></div><div class="archive-grid"><article class="archive-card"><h3>Kurátori dosszié</h3><p>A teljes kronológia, a visszatérő kérdések és az életmű fejlődésének értelmezése.</p><a href="/hu/curators.html">Kurátori dosszié megnyitása</a></article><article class="archive-card"><h3>Közösségi és nyilvános jelenlét</h3><p>Programok, szakmai részvétel és közösségi munka dokumentációja.</p><a href="/hu/community.html">Közösségi archívum megnyitása</a></article><article class="archive-card"><h3>Sajtó és megőrzött források</h3><p>Interjúk, cikkek, televíziós megjelenések és megőrzött forrásrekordok.</p><a href="/hu/press.html">Sajtóarchívum megnyitása</a></article></div></div></section>`
  },
  {
    file:'de-at/index.html',
    bridge:`<section class="tone-a life-journey archive-orientation" id="journey"><div class="wrap"><div class="section-head"><p class="label">Das Werk erschließen</p><h2>Kontext, Chronologie und überprüfbare Quellen</h2><p class="lead">Die Startseite dient der Orientierung. Die vollständige Einordnung von Perioden, Wendepunkten und künstlerischen Zusammenhängen gehört in das kuratorische Dossier; öffentliche Aktivitäten und Quellen bleiben in ihren eigenen Archivbereichen.</p></div><div class="archive-grid"><article class="archive-card"><h3>Kuratorisches Dossier</h3><p>Die vollständige Chronologie, wiederkehrende Fragen und die Entwicklung des Werks.</p><a href="/de-at/curators.html">Kuratorisches Dossier öffnen</a></article><article class="archive-card"><h3>Community und öffentliche Arbeit</h3><p>Programme, professionelle Beteiligung und gemeinschaftsbezogene Aktivitäten.</p><a href="/de-at/community.html">Community-Archiv öffnen</a></article><article class="archive-card"><h3>Presse und bewahrte Quellen</h3><p>Interviews, Artikel, Fernsehauftritte und erhaltene Quellenbelege.</p><a href="/de-at/press.html">Presse-Archiv öffnen</a></article></div></div></section>`
  }
];

function sectionRange(html,id){
  const re=new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>`,'i');
  const m=re.exec(html); if(!m) return null;
  let depth=1; const tags=/<\/?section\b[^>]*>/gi; tags.lastIndex=m.index+m[0].length; let t;
  while((t=tags.exec(html))){depth+=/^<section\b/i.test(t[0])?1:-1;if(depth===0)return{start:m.index,end:tags.lastIndex};}
  throw new Error(`${id}: unclosed section`);
}
for(const p of pages){
  let html=fs.readFileSync(p.file,'utf8');
  if(html.includes('class="tone-a life-journey archive-orientation"')) throw new Error(`${p.file}: homepage already simplified`);
  const periods=sectionRange(html,'presence-periods');
  if(periods) html=html.slice(0,periods.start)+html.slice(periods.end);
  const journey=sectionRange(html,'journey'); if(!journey) throw new Error(`${p.file}: #journey missing`);
  html=html.slice(0,journey.start)+p.bridge+html.slice(journey.end);
  if(sectionRange(html,'presence-periods')) throw new Error(`${p.file}: redundant #presence-periods remains`);
  if((html.match(/id=["']journey["']/gi)||[]).length!==1) throw new Error(`${p.file}: expected exactly one #journey after simplification`);
  if((html.match(/<h1\b/gi)||[]).length!==1) throw new Error(`${p.file}: H1 invariant failed`);
  fs.writeFileSync(p.file,html);
  console.log(`${p.file}: simplified homepage orientation and removed redundant period block.`);
}
