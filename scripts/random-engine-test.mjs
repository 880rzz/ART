import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {webcrypto} from 'node:crypto';

const root=process.cwd();
const UINT32_SPAN=0x100000000;

function randIntWithSource(max,source){
  if(!Number.isInteger(max)||max<=0||max>UINT32_SPAN)throw new RangeError('max');
  const limit=Math.floor(UINT32_SPAN/max)*max;
  let value=0;
  do{value=source()>>>0;}while(value>=limit);
  return value%max;
}

function secureSource(){
  const word=new Uint32Array(1);
  webcrypto.getRandomValues(word);
  return word[0];
}

function secureShuffle(input,source=secureSource){
  const result=input.slice();
  for(let i=result.length-1;i>0;i--){
    const j=randIntWithSource(i+1,source);
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

function selectCombinedCardEvents(events,pack='global',packLimit=18,globalLimit=14){
  const ordered=events.slice().sort((a,b)=>a.sequence-b.sequence);
  const safePackLimit=Math.max(0,Math.floor(Number(packLimit)||0));
  const safeGlobalLimit=Math.max(0,Math.floor(Number(globalLimit)||0));
  if(!pack||pack==='global')return ordered.slice(-Math.max(safePackLimit,safeGlobalLimit));
  const globalRecent=ordered.slice(-safeGlobalLimit);
  const packRecent=ordered.filter(event=>event.pack===pack).slice(-safePackLimit);
  const selectedIds=new Set([...globalRecent,...packRecent].map(event=>event.eventId));
  return ordered.filter(event=>selectedIds.has(event.eventId)).slice(-(safePackLimit+safeGlobalLimit));
}

function deterministicRejectionTest(){
  const values=[0xffffffff,4];
  let calls=0;
  const result=randIntWithSource(3,()=>{calls++;return values.shift();});
  assert.equal(result,1,'rejection sampling returned the wrong value');
  assert.equal(calls,2,'out-of-range value was not rejected');
}

function binaryDistributionTest(samples=200000){
  const counts=[0,0];
  for(let i=0;i<samples;i++)counts[randIntWithSource(2,secureSource)]++;
  const expected=samples/2;
  const z=Math.abs(counts[0]-expected)/Math.sqrt(samples*0.25);
  assert.ok(z<6,`binary distribution exceeded six sigma: ${JSON.stringify({counts,z})}`);
  return {counts,z};
}

function sevenWayDistributionTest(samples=280000){
  const counts=Array(7).fill(0);
  for(let i=0;i<samples;i++)counts[randIntWithSource(7,secureSource)]++;
  const expected=samples/7;
  const chiSquare=counts.reduce((sum,count)=>sum+((count-expected)**2/expected),0);
  assert.ok(chiSquare<36,`seven-way distribution failed chi-square guard: ${JSON.stringify({counts,chiSquare})}`);
  return {counts,chiSquare};
}

function shuffleTest(){
  const original=Array.from({length:76},(_,index)=>index+1);
  for(let run=0;run<100;run++){
    const shuffled=secureShuffle(original);
    assert.equal(shuffled.length,original.length);
    assert.deepEqual([...shuffled].sort((a,b)=>a-b),original,'shuffle lost or duplicated an item');
  }
}

function eventIdentityTest(){
  const events=[
    {eventId:'evt-1',cardId:'A',pack:'oak',sequence:1},
    {eventId:'evt-2',cardId:'B',pack:'ash',sequence:2},
    {eventId:'evt-3',cardId:'A',pack:'oak',sequence:3},
    {eventId:'evt-4',cardId:'C',pack:'oak',sequence:4},
    {eventId:'evt-5',cardId:'D',pack:'ash',sequence:5}
  ];
  const selected=selectCombinedCardEvents(events,'oak',3,2);
  assert.deepEqual(selected.map(event=>event.eventId),['evt-1','evt-3','evt-4','evt-5']);
  assert.equal(new Set(selected.map(event=>event.eventId)).size,selected.length,'one draw event was counted twice');
  assert.equal(selected.filter(event=>event.cardId==='A').length,2,'two separate draws of the same card were incorrectly collapsed');
}

function sourceContractTest(){
  const yesNo=fs.readFileSync(path.join(root,'assets/js/yes-no.js'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'assets/js/runtime-enhancements.js'),'utf8');
  for(const appFile of ['assets/js/app.hu.js','assets/js/app.en.js']){
    const app=fs.readFileSync(path.join(root,appFile),'utf8');
    assert.ok(!/Math\.random\s*\(/.test(app),`${appFile} contains Math.random`);
    assert.ok(app.includes('getRandomValues'),`${appFile} is missing Web Crypto`);
    assert.ok(app.includes('secureShuffle'),`${appFile} is missing secure shuffle`);
  }
  assert.ok(!/Math\.random\s*\(/.test(yesNo),'yes-no.js contains Math.random');
  assert.ok(yesNo.includes('while(a[0]>=lim)'),'yes-no.js is missing rejection sampling');
  assert.ok(runtime.includes('historySchema:"event-id-v1"'),'event history schema marker is missing');
  assert.ok(runtime.includes('eventId:`${drawId}-${index+1}`'),'draw event IDs are not persisted');
  assert.ok(runtime.includes('selectedIds.has(event.eventId)'),'history is not deduplicated by event ID');
  assert.ok(runtime.includes('installed:randomHardeningInstalled'),'runtime installation state is not observable');
}

deterministicRejectionTest();
const binary=binaryDistributionTest();
const sevenWay=sevenWayDistributionTest();
shuffleTest();
eventIdentityTest();
sourceContractTest();

console.log(JSON.stringify({
  passed:true,
  webCrypto:true,
  rejectionSampling:true,
  binary,
  sevenWay,
  shuffleRuns:100,
  eventIdentity:true
}));