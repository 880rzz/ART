import fs from 'node:fs';
const footer=fs.readFileSync('assets/css/footer-elegant.css','utf8'),authority=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8'),release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;const errors=[];
for(const t of ['STAGE85-FOOTER-LEGAL-GOLD:START','white-space:nowrap!important','color:#D3B85A!important'])if(!footer.includes(t))errors.push('footer missing '+t);
for(const t of ['STAGE85-BRIGHT-GOLD-AUTHORITY:START','--art-home-gold:#D3B85A!important','--c-gold:#D3B85A!important'])if(!authority.includes(t))errors.push('authority missing '+t);
if(release!=='20260810-footer-gold-v85')errors.push('unexpected release '+release);
function ch(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}function lum(h){h=h.replace('#','');const a=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return .2126*ch(a[0])+.7152*ch(a[1])+.0722*ch(a[2])}function cr(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const [name,fg] of [['primary','#F5F5F7'],['secondary','#AFC4D9'],['gold','#D3B85A']])for(const bg of ['#202530','#29303F','#2D3444']){const r=cr(fg,bg);if(r<4.5)errors.push(name+' '+r.toFixed(2)+' on '+bg);else console.log(name+' / '+bg+': '+r.toFixed(2)+':1')}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Stage 85 passed: footer legal links stay on one desktop row and all canonical text/gold combinations remain WCAG AA.');
