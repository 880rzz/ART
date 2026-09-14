import fs from 'node:fs';

const failures=[];
const css=fs.readFileSync('assets/css/site.css','utf8');
const exhaustive=fs.readFileSync('tools/audit-all-pages-design.mjs','utf8');
const compiler=fs.readFileSync('scripts/restore-production-design-authority.mjs','utf8');
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(exhaustive.includes("fs.readFileSync('data/design-authority.json','utf8')"),'exhaustive design audit must read canonical design authority');
must(exhaustive.includes('320,360,375,390,412,430,768,820,1024,1280,1366,1440,1920,2560,3840'),'exhaustive viewport matrix must cover small mobile through 4K');
must(!/width>1280\.5/.test(exhaustive),'exhaustive audit must not reintroduce stale hard-coded 1280px ART cap');
must(Number(authority.pageMaxPx)===1440,'canonical ART pageMaxPx must remain 1440');
must(Number(authority.desktop?.structuredMaxPx)===1320,'canonical ART structuredMaxPx must remain 1320');
must(Number(authority.desktop?.proseMaxPx)===860,'canonical ART prose measure must remain 860px');
must(Number(authority.responsive?.touchTargetPx)===44,'canonical ART touch target must remain 44px');
must(authority.footer?.socialTopSeparator===false,'ART social footer top separator must remain disabled');
must(authority.footer?.socialBottomSeparator===false,'ART social footer bottom separator must remain disabled');
must(authority.footer?.legalTopSeparator===false,'ART legal footer separator must remain disabled');

// Source compatibility layer keeps language and menu controls safe; the canonical
// production compiler additionally closes historical brand-link/footer regressions.
must(/body\.apple-archive \.langs a\{[^}]*min-width:44px;[^}]*min-height:44px;/s.test(css),'language controls lost 44px touch target');
must(/body\.apple-archive \.burger\{[^}]*width:44px;[^}]*height:44px;/s.test(css),'burger lost 44px control geometry');
must(compiler.includes('body.apple-archive>nav .brand{min-height:${touch}px!important'),'production compiler lost brand touch-target closure');
must(compiler.includes("footer.socialTopSeparator===false?'body.apple-archive footer .footer-social-disclosure{border-top:0!important;}'"),'production compiler lost social footer top-separator closure');
must(compiler.includes("footer.socialBottomSeparator===false?'body.apple-archive footer .footer-social-disclosure{border-bottom:0!important;}'"),'production compiler lost social footer bottom-separator closure');
must(compiler.includes("footer.legalTopSeparator===false?'body.apple-archive footer .fineprint{border-top:0!important;}'"),'production compiler lost legal footer separator closure');

if(failures.length){console.error(`ART historical design regression guard failed (${failures.length}):`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('ART historical design regression guard passed: canonical authority, 320–3840 viewport matrix, 44px header controls and separator-free footer protections are locked to the production compiler.');
