// Read-only release gate for the two public Commons media assets.
// Do not publish an inferred filename as if it were independently verified.
const files=[
  'Music and Words presents- Ádám Fellegi – Beethoven’s Three Faces.jpg',
  'Péter Bence — MVM Dome, Budapest - 10 October 2026.jpg'
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
  if(!confirmed){
    console.error('UNVERIFIED: '+title+' :: '+last);
    if(name.includes('Bence')){
      for(const term of ['Peter Bence','Péter Bence','MVM Dome','EUFÓRIA']){
        try{
          const u=new URL('https://commons.wikimedia.org/w/api.php');
          u.searchParams.set('action','query');u.searchParams.set('format','json');
          u.searchParams.set('list','search');u.searchParams.set('srnamespace','6');
          u.searchParams.set('srsearch',term);u.searchParams.set('srlimit','100');
          const rr=await fetch(u,{headers:{'User-Agent':'BANHALMI-ART-EUFORIA-Verification/1.0 (hello@norbertbanhalmi.com)'},signal:AbortSignal.timeout(15000)});
          const jj=await rr.json();console.log('CANDIDATES '+term+': '+JSON.stringify(jj.query?.search?.map(x=>x.title)));
        }catch(e){console.log('CANDIDATE SEARCH ERROR '+term+': '+e);}
      }
      const u=new URL('https://commons.wikimedia.org/w/api.php');
      u.searchParams.set('action','query');u.searchParams.set('format','json');
      u.searchParams.set('list','categorymembers');
      u.searchParams.set('cmtitle','Category:Euphoria – Anatomy of Presence');
      u.searchParams.set('cmnamespace','6');u.searchParams.set('cmlimit','100');
      try{
        const rr=await fetch(u,{headers:{'User-Agent':'BANHALMI-ART-EUFORIA-Verification/1.0 (hello@norbertbanhalmi.com)'},signal:AbortSignal.timeout(15000)});
        const jj=await rr.json();console.log('EUFORIA COMMONS CATEGORY: '+JSON.stringify(jj.query?.categorymembers?.map(x=>x.title)));
      }catch(e){console.log('CATEGORY SEARCH ERROR '+e);}
    }
    failures++;
  }
}
if(failures)process.exit(1);
