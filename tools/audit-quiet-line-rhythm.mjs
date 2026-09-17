import fs from 'node:fs';
const failures=[];
const css=fs.readFileSync('assets/css/site.css','utf8');
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const must=(ok,msg)=>{if(!ok)failures.push(msg)};
must(css.includes('QUIET-LINE-RHYTHM-20260918:START'),'quiet-line CSS marker missing');
must(css.includes('body.apple-archive footer{border-top:0!important;}'),'footer outer rule must be removed');
must(css.includes('body.apple-archive main details{border-top:0!important;border-bottom:0!important;}'),'disclosure rules must be removed');
must(css.includes('main>section+section{border-top:0!important;}'),'section boundaries must use spacing instead of rules');
must(css.includes('main>section>h2{border-bottom:0!important;padding-bottom:0!important;}'),'curatorial heading rule must be removed');
must(css.includes('.press-record{border-top:0!important;}'),'press records must not repeat decorative top rules');
must(authority.lineRhythm?.decorativeSeparators==='exceptional','design authority must mark decorative separators exceptional');
must(authority.lineRhythm?.footerRules===false,'design authority must prohibit footer rules');
must(authority.principles?.spaceAndTypeCarryHierarchy===true,'design authority must require spacing/type hierarchy');
if(failures.length){console.error('ART quiet-line audit failed ('+failures.length+'):\n- '+failures.join('\n- '));process.exit(1);}
console.log('ART quiet-line audit passed: footer and decorative structural rules are removed; dense factual rows remain eligible for hairlines.');
