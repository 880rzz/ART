import fs from 'node:fs';
const pages=[['exhibitions/euforia.html','Where the picture travelled','10 documented publications'],['hu/exhibitions/euforia.html','Merre járt a kép','10 dokumentált megjelenés'],['de-at/exhibitions/euforia.html','Wohin das Bild reiste','10 dokumentierte Veröffentlichungen']];
const errors=[];
function locate(html,re,from=0){const m=re.exec(html.slice(from));return m?from+m.index:-1}
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
for(const [file,heading,summary] of pages){
  const html=fs.readFileSync(file,'utf8');
  // Layout utilities may add classes to the same semantic elements. Guard the
  // content/order contract rather than freezing an attribute-free tag shape.
  const h=locate(html,new RegExp(`<h2\\b[^>]*>\\s*${esc(heading)}\\s*</h2>`,'i'));
  const p=h<0?-1:locate(html,/<p\b[^>]*class=["'][^"']*\blead\b[^"']*["'][^>]*>/i,h);
  const d=p<0?-1:locate(html,/<details\b[^>]*class=["'][^"']*\busage-disclosure\b[^"']*["'][^>]*>/i,p);
  const s=d<0?-1:locate(html,new RegExp(`<summary\\b[^>]*>\\s*<span\\b[^>]*>\\s*${esc(summary)}\\s*</span>\\s*</summary>`,'i'),d);
  if(h<0||p<h||d<p||s<d)errors.push(file+': simplified usage disclosure order missing');
  const close=d<0?-1:html.indexOf('</details>',d);
  const block=d>=0&&close>d?html.slice(d,close):'';
  const count=(block.match(/<li\b[^>]*>/gi)||[]).length;
  if(count!==10)errors.push(file+': expected 10 preserved publication entries, found '+count);
}
const release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;
const css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');
for(const token of ['STAGE83-EUFORIA-SOURCE-DISCLOSURE:START','details.usage-disclosure','border-radius:0!important','summary::after'])if(!css.includes(token))errors.push('CSS missing '+token);
const footer=fs.readFileSync('assets/css/footer-elegant.css','utf8');if(!footer.includes('palette-blue-final.css?v='+release))errors.push('footer palette import is stale');
const runtime=fs.readFileSync('assets/js/responsive-header-system.js','utf8');if(!runtime.includes('record-editorial-system.css?v='+release))errors.push('record runtime token is stale');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage 83 passed on '+release+': EUFÓRIA preserves all ten documented publication links per language inside a quiet collapsed disclosure.');
