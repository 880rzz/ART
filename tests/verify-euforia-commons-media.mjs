// Read-only release gate for the two public Commons media assets.
// Do not publish an inferred filename as if it were independently verified.
const files=[
  'Music and Words presents- Ádám Fellegi – Beethoven’s Three Faces.jpg',
  'Peter-Bence-MVM-Dome-2026-10-10-EUFORIA-04.jpg'
];
let failures=0;
for (const name of files){
  const title='File:'+name;
  const api=new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action','query');api.searchParams.set('format','json');
  api.searchParams.set('prop','imageinfo');api.searchParams.set('iiprop','url|mime|size');
  api.searchParams.set('titles',title);
  let confirmed=false,last='';
  for(let attempt=0;attempt<3&&!confirmed;attempt++){
    try{
      const response=await fetch(api,{headers:{'User-Agent':'BANHALMI-ART-EUFORIA-Verification/1.0 (hello@norbertbanhalmi.com)','Accept':'application/json'},signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      const page=Object.values(data.query?.pages||{})[0];
      if(!page || 'missing' in page)throw new Error('Commons file not found: '+title);
      const info=page.imageinfo?.[0];
      if(!info||!info.mime?.startsWith('image/')||!info.url)throw new Error('Image info unavailable: '+title);
      console.log('VERIFIED: '+page.title+' ('+info.mime+', '+info.size+' bytes) '+info.url);
      confirmed=true;
    }catch(e){last=String(e);if(attempt<2)await new Promise(r=>setTimeout(r,1000));}
  }
  if(!confirmed){console.error('UNVERIFIED: '+title+' :: '+last);failures++;}
}
if(failures)process.exit(1);
