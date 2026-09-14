import fs from 'node:fs';

const failures=[];
const css=fs.readFileSync('assets/css/site.css','utf8');
const exhaustive=fs.readFileSync('tools/audit-all-pages-design.mjs','utf8');
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));

const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(exhaustive.includes("fs.readFileSync('data/design-authority.json','utf8')"),'exhaustive design audit must read canonical design authority');
must(exhaustive.includes('320,360,375,390,412,430,768,820,1024,1280,1366,1440,1920,2560,3840'),'exhaustive viewport matrix must cover small mobile through 4K');
must(!/width>1280\.5/.test(exhaustive),'exhaustive audit must not reintroduce stale hard-coded 1280px ART cap');
must(Number(authority.pageMaxPx)===1440,'canonical ART pageMaxPx must remain 1440');
must(Number(authority.desktop?.structuredMaxPx)===1320,'canonical ART structuredMaxPx must remain 1320');
must(Number(authority.desktop?.proseMaxPx)===860,'canonical ART prose measure must remain 860px');

// Historical screenshot regression: header controls must remain finger-safe.
must(/body\.apple-archive \.langs a\{[^}]*min-width:44px;[^}]*min-height:44px;/s.test(css),'language controls lost 44px touch target');
must(/body\.apple-archive \.burger\{[^}]*width:44px;[^}]*height:44px;/s.test(css),'burger lost 44px control geometry');

// Historical screenshot regression: no long lower footer rules may return.
const canonicalStart=css.lastIndexOf('CANONICAL-ARCHIVE-DESIGN-SYSTEM-20260827:START');
const canonicalEnd=css.lastIndexOf('CANONICAL-ARCHIVE-DESIGN-SYSTEM-20260827:END');
must(canonicalStart>=0&&canonicalEnd>canonicalStart,'canonical ART design system markers missing');
const canonical=canonicalStart>=0&&canonicalEnd>canonicalStart?css.slice(canonicalStart,canonicalEnd):'';
must(!/footer \.footer-social-disclosure\{[^}]*border-bottom\s*:\s*1px/s.test(canonical),'canonical footer must not restore social-disclosure bottom separator');

if(failures.length){console.error(`ART historical design regression guard failed (${failures.length}):`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('ART historical design regression guard passed: canonical authority, 320–3840 viewport matrix, touch controls and screenshot-era footer separator protections are intact.');
