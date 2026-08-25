import fs from 'node:fs';
const file='assets/css/site.css';
let css=fs.readFileSync(file,'utf8');
const start='/* STRICT-APPLE-WEB-CONTRACT-20260825:START */';
const end='/* STRICT-APPLE-WEB-CONTRACT-20260825:END */';
const block=`${start}
/* Final strict Apple visual authority. This block is intentionally high-specificity so it wins over legacy archive selectors without creating a second design system. */
html body.apple-archive main h1,
html body.apple-archive header.sub h1{
  letter-spacing:-.015em!important;
}
html body.apple-archive main h2{
  letter-spacing:-.01em!important;
}
html body.apple-archive main h3{
  letter-spacing:-.005em!important;
}
html body.apple-archive main p.lead,
html body.apple-archive main .press-hero p,
html body.apple-archive main p.press-hero__lead{
  font-size:max(1rem,1em)!important;
  line-height:1.48!important;
}
html body.apple-archive main blockquote{
  font-size:max(1.375rem,1em)!important;
  line-height:1.40!important;
}
html body.apple-archive main h3 + p,
html body.apple-archive main h3 + .lead{
  margin-top:.75rem!important;
}
html body.apple-archive main .wrap,
html body.apple-archive main .container,
html body.apple-archive main .content-wrap{
  box-sizing:border-box!important;
  width:min(1280px,calc(100% - 2.5rem))!important;
  max-width:1280px!important;
  margin-inline:auto!important;
}
html body.apple-archive main .wrap.narrow{
  width:min(900px,calc(100% - 2.5rem))!important;
  max-width:900px!important;
}
html body.apple-archive main > section.wrap,
html body.apple-archive main > section.wrap.narrow{
  position:relative!important;
  isolation:isolate!important;
}
html body.apple-archive main > section.wrap::before,
html body.apple-archive main > section.wrap.narrow::before{
  content:""!important;
  display:block!important;
  position:absolute!important;
  z-index:-1!important;
  inset-block:0!important;
  left:50%!important;
  width:100vw!important;
  max-width:none!important;
  transform:translateX(-50%)!important;
  background-color:inherit!important;
  background-image:inherit!important;
  pointer-events:none!important;
}
@media(max-width:768px){
  html body.apple-archive main .wrap,
  html body.apple-archive main .container,
  html body.apple-archive main .content-wrap,
  html body.apple-archive main .wrap.narrow{
    width:calc(100% - 2rem)!important;
  }
}
${end}`;
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const re=new RegExp(esc(start)+'[\\s\\S]*?'+esc(end));
if(!re.test(css)) throw new Error('Strict Apple contract block not found');
css=css.replace(re,block);
fs.writeFileSync(file,css);
console.log('ART final strict Apple contract authority updated.');
