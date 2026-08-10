import fs from 'node:fs';
const css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');
const failures=[];
for(const token of ['STAGE95-APPLE-POLISH:START','--art-gutter:clamp(1.5rem,4.8vw,4.75rem)','--art-card-pad:clamp(1.35rem,2.8vw,2.4rem)','width:min(920px,100%)!important','padding:1.3rem 1.1rem!important']) if(!css.includes(token)) failures.push('missing design contract '+token);
// Stage95 still protects the original Apple polish and the technology-section
// humanisation. Stage96 intentionally supersedes the former "art for art’s
// sake / Selbstzweck" sentences with plainer editorial copy, which is guarded
// by audit-human-editorial-stage96.mjs instead of freezing obsolete wording.
const copies={
  'hu/curators.html':['A technológia mint alkotói eszköz','Technológiai kísérletezés'],
  'curators.html':['Technology as an artistic tool','Technological experimentation'],
  'de-at/curators.html':['Technologie als künstlerisches Werkzeug','Technologisches Experimentieren']
};
for(const [file,tokens] of Object.entries(copies)){const html=fs.readFileSync(file,'utf8');for(const t of tokens)if(!html.includes(t))failures.push(file+' missing reviewed copy: '+t)}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Stage95 passed: Apple-like spacing/type/edge protection/footer polish and its surviving curatorial humanisation remain intact; Stage96 owns the newer editorial wording.');
