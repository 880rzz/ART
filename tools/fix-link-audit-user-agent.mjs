import fs from 'node:fs';
const file='tests/audit-seo-network.mjs';
let s=fs.readFileSync(file,'utf8');
const old="headers:{'user-agent':'BANHALMI-ART-LinkAudit/1.0'}";
const oldGet="headers:{'user-agent':'BANHALMI-ART-LinkAudit/1.0','accept':'text/html,application/xhtml+xml'}";
const browserUA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 BANHALMI-ART-LinkAudit/1.0";
if(!s.includes(old) || !s.includes(oldGet)) throw new Error('Expected link-audit request headers not found');
s=s.replace(old,`headers:{'user-agent':'${browserUA}','accept':'text/html,application/xhtml+xml'}`)
 .replace(oldGet,`headers:{'user-agent':'${browserUA}','accept':'text/html,application/xhtml+xml'}`);
fs.writeFileSync(file,s);
