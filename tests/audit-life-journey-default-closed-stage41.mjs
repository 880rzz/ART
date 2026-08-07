import fs from 'node:fs';

const failures=[];
for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(file,'utf8');
  const journey=html.match(/<!-- LIFE-JOURNEY:START -->([\s\S]*?)<!-- LIFE-JOURNEY:END -->/);
  if(!journey){failures.push(`${file}: life journey block missing`);continue;}
  if(/<details[^>]*class="[^"]*life-record-group[^"]*"[^>]*\sopen(?:\s|>)/i.test(journey[1])) failures.push(`${file}: a life-record-group is open by default`);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Stage 41 life journey audit passed: all homepage archive groups are closed by default in EN, HU and DE.');
