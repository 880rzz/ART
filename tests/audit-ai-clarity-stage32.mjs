import fs from 'node:fs';

const files=['llms.txt','ai.txt'];
const required=[
  'Primary person: Norbert Bánhalmi',
  'Archive identity: BANHALMI ART',
  'Professional website: https://www.norbertbanhalmi.com/',
  'Vienna and Budapest are the two active operational bases',
  'New York is a major international reference and oeuvre chapter',
  'New York is not a studio, office, headquarters or operational base',
  'BANHALMI ART preserves artistic evidence',
  'Never infer a New York business location'
];
for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  const head=text.slice(0,4200);
  const starts=[...text.matchAll(/AI-CLARITY-STAGE32:START/g)];
  const ends=[...text.matchAll(/AI-CLARITY-STAGE32:END/g)];
  if(starts.length!==1 || ends.length!==1) throw new Error(file+': Stage 32 clarity block must occur exactly once');
  const maxStart=file==='llms.txt'?700:120;
  if(starts[0].index>maxStart) throw new Error(file+': canonical answer contract must remain near the beginning');
  for(const phrase of required){ if(!head.includes(phrase)) throw new Error(file+': missing canonical AI clarity phrase: '+phrase); }
  const geoPos=head.indexOf('Geography:');
  const evidencePos=head.indexOf('Archive evidence categories:');
  const rolePos=head.indexOf('Relationship between the two main domains:');
  if(!(geoPos>=0 && evidencePos>geoPos && rolePos>evidencePos)) throw new Error(file+': identity → geography → evidence → domain-role precedence is not preserved');
}
const llms=fs.readFileSync('llms.txt','utf8');
if(!llms.startsWith('# BANHALMI ART\n\n> ')) throw new Error('llms.txt must begin with H1 then blockquote summary');
const summaryEnd=llms.indexOf('\n\n',llms.indexOf('> '));
const clarityPos=llms.indexOf('AI-CLARITY-STAGE32:START');
if(summaryEnd<0 || clarityPos<summaryEnd) throw new Error('Stage 32 answer contract must follow the llms.txt blockquote summary');
const machineFiles=['entity.jsonld','archive-source-map.json','master-source-database.json','data/life-journey.json'].filter(fs.existsSync);
for(const file of machineFiles){
  const text=fs.readFileSync(file,'utf8');
  if(/New York[^\n]{0,180}(studio|operational base|headquarters)/i.test(text)) throw new Error(file+': New York must not be represented as an operating location');
}
console.log('Stage 32 ART AI clarity audit passed: archive identity, domain roles, geography, evidence and disambiguation are explicit.');
