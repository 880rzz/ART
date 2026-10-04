import fs from 'node:fs';

const failures=[];
const css=fs.readFileSync('assets/css/site.css','utf8');
const pages=[
  'exhibitions/euforia.html',
  'hu/exhibitions/euforia.html',
  'de-at/exhibitions/euforia.html'
];

function must(ok,msg){if(!ok)failures.push(msg);}

must(css.includes('body.apple-archive .euforia-project-hero__image{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;object-position:right center;}'),'EUFORIA hero must match the homepage right-anchored crop');
must(!css.includes('object-position:58% center'),'retired right-shifted EUFORIA mobile focal position returned');
must(!css.includes('.euforia-artwork__copy{padding:0;}'),'EUFORIA mobile artwork copy lost its inline inset');
must(css.includes('padding:16px clamp(16px,2vw,24px)'),'EUFORIA project map cells must keep an inline inset');
must(css.includes('padding:1.1rem clamp(1rem,2vw,1.5rem)'),'record-supporting summaries must keep an inline inset');
must(!css.includes('.life-journey-disclosure[open] .life-stage{display:block!important'),'curator life stages must not be flattened into block layout on desktop');
must(!css.includes('.curatorial-grid-disclosure[open] .curatorial-periods__grid{grid-template-columns:1fr!important'),'curator period grid must not be forced to one column on desktop');
must(css.includes(':not(summary):not(.life-journey__stages):not(.curatorial-periods__grid)'),'structured curator records must be excluded from generic disclosure reading-width constraints');

for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  const selectors=[
    ['Péter artwork','euforia-artwork euforia-artwork--peter'],
    ['Péter public history','euforia-public-history'],
    ['Péter provenance','id="peter-magyar-provenance"'],
    ['Péter usage record','usage-section'],
    ['Péter project evidence','<!-- PROJECT-EVIDENCE:START -->'],
    ['Péter interpretation','euforia-interpretation'],
    ['Azahriah artwork','euforia-artwork euforia-artwork--reverse'],
    ['project map','euforia-project-map']
  ];
  const positions=selectors.map(([label,token])=>[label,html.indexOf(token)]);
  for(const [label,pos] of positions) must(pos>=0,`${file}: missing ${label}`);
  for(let i=1;i<positions.length;i++){
    if(positions[i-1][1]>=0&&positions[i][1]>=0) must(positions[i-1][1]<positions[i][1],`${file}: ${positions[i-1][0]} must precede ${positions[i][0]}`);
  }
}

if(failures.length){
  console.error('User-visible ART P0 layout contract failed:');
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('User-visible ART P0 layout contract passed: EUFORIA narrative order/focal point/insets and curator structured grids are protected.');
