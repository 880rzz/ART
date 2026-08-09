import fs from 'node:fs';
import path from 'node:path';

const palette=fs.readFileSync('assets/css/palette-blue-final.css','utf8');
for(const token of [
  'html body.apple-archive.apple-archive #consent a',
  'text-decoration-line:underline!important',
  'text-decoration-thickness:.08em!important',
  'text-underline-offset:.18em!important'
]){
  if(!palette.includes(token)) throw new Error(`Consent link non-colour affordance missing: ${token}`);
}

const privacyUrl='https://www.norbertbanhalmi.com/privacy-policy/';
let pages=0;
let consentPages=0;
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(entry.name.endsWith('.html')){
      const html=fs.readFileSync(full,'utf8');
      if(!/<html\b/i.test(html)) continue;
      pages++;
      if(html.includes(privacyUrl)){
        consentPages++;
        if(!/id=["']consent["']/i.test(html)) throw new Error(`${full}: canonical privacy link exists outside the guarded #consent component`);
      }
    }
  }
}
walk('.');
if(consentPages<80) throw new Error(`Expected archive-wide consent coverage; only ${consentPages}/${pages} content pages contain the canonical privacy link`);
console.log(`ART consent-link accessibility guard passed: persistent non-colour affordance protects ${consentPages}/${pages} HTML documents with privacy links.`);
