import fs from 'node:fs';
const css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');
const failures=[];
for(const token of ['STAGE95-APPLE-POLISH:START','--art-gutter:clamp(1.5rem,4.8vw,4.75rem)','--art-card-pad:clamp(1.35rem,2.8vw,2.4rem)','width:min(920px,100%)!important','padding:1.3rem 1.1rem!important']) if(!css.includes(token)) failures.push('missing design contract '+token);
const copies={'hu/curators.html':['A technológia mint alkotói eszköz','A munkák nem önmagukért léteznek','Technológiai kísérletezés'],'curators.html':['Technology as an artistic tool','The work is not art for art’s sake','Technological experimentation'],'de-at/curators.html':['Technologie als künstlerisches Werkzeug','Die Arbeiten sind kein Selbstzweck','Technologisches Experimentieren']};
for(const [file,tokens] of Object.entries(copies)){const html=fs.readFileSync(file,'utf8');for(const t of tokens)if(!html.includes(t))failures.push(file+' missing reviewed copy: '+t)}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Stage95 passed: Apple-like spacing/type/edge protection/footer polish and manually reviewed curatorial copy are present in HU/EN/DE.');
