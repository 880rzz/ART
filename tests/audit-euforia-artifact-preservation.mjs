import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {hardenMachineLayer} from '../scripts/harden-machine-layer.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'art-euforia-artifact-'));
const section=text=>text.split(/(?=^## )/m).filter(part=>part.startsWith('## EUFÓRIA')).join('\n').trim();
try {
  for(const file of ['data/machine-core.json','ai.txt','llms.txt','index.html','hu/index.html','de-at/index.html']) {
    fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
    fs.copyFileSync(file,path.join(root,file));
  }
  const expected=new Map(['ai.txt','llms.txt'].map(file=>[file,section(fs.readFileSync(file,'utf8'))]));
  for(let pass=0;pass<2;pass++) {
    hardenMachineLayer(root);
    for(const [file,original] of expected) {
      const output=fs.readFileSync(path.join(root,file),'utf8');
      assert.equal(section(output),original,`${file}: preserve complete project evidence through repeated generation`);
      for(const token of ['Q138717398','Q124488292','Q568185','Q20747349']) assert.ok(output.includes(token),`${file}: missing project/work identity ${token}`);
      if(file==='llms.txt') assert.ok(output.includes('72177720332618686'),'Preserve canonical Flickr project album');
      assert.equal((output.match(/^## EUFÓRIA/gm)||[]).length,1,`${file}: do not duplicate project sections`);
    }
  }
  console.log('EUFÓRIA machine evidence survives repeated production artifact generation byte-for-byte.');
} finally {fs.rmSync(root,{recursive:true,force:true});}
