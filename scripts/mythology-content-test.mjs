import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const mythologyPath=path.join(root,'assets/js/mythology-authenticity.js');
const runtimePath=path.join(root,'assets/js/runtime-enhancements.js');
const cssPath=path.join(root,'assets/css/mythology-authenticity.css');
const mythology=fs.readFileSync(mythologyPath,'utf8');
const runtime=fs.readFileSync(runtimePath,'utf8');
const css=fs.readFileSync(cssPath,'utf8');

for(const file of [mythologyPath,runtimePath]){
  const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(check.status,0,`${path.basename(file)} syntax error: ${check.stderr||check.stdout}`);
}

const requiredLayers=['taliesin','mabinogi','arthurian','folklore','glastonbury','revival','avalon','christian','comparative','original'];
for(const layer of requiredLayers)assert.ok(mythology.includes(`${layer}:`),`missing provenance layer: ${layer}`);

for(const house of ['ust','istennok','tajak','osvenyek','orzok','kristaly','hold','angyal']){
  assert.ok(new RegExp(`\\b${house}:\"`).test(mythology),`house has no provenance mapping: ${house}`);
}

assert.ok(mythology.includes('Walesi istennők és nagyasszonyok'),'Welsh source category is not visible in Hungarian');
assert.ok(mythology.includes('Welsh goddesses and great women'),'Welsh source category is not visible in English');
assert.ok(mythology.includes('Avalon és Glastonbury jelképes tájai'),'Avalon/Glastonbury category is not qualified');
assert.ok(mythology.includes('Symbolic landscapes of Avalon and Glastonbury'),'English Avalon/Glastonbury category is not qualified');
assert.ok(mythology.includes('nem egyetlen ősi kelta vallás rekonstrukciója'),'scope disclaimer is missing in Hungarian');
assert.ok(mythology.includes('not a reconstruction of one ancient Celtic religion'),'scope disclaimer is missing in English');
assert.ok(mythology.includes('modern druida embléma'),'Awen emblem chronology is not explained in Hungarian');
assert.ok(mythology.includes('modern Druid emblem'),'Awen emblem chronology is not explained in English');
assert.ok(mythology.includes('nem történeti druida eljárás'),'random mode is still framed as historical Druid practice');
assert.ok(mythology.includes('not a historical Druid practice'),'English random-mode qualification is missing');
assert.ok(mythology.includes('Hanes Taliesin'),'Taliesin source tradition is not named');
assert.ok(mythology.includes('Mabinogi'),'Mabinogi source tradition is not named');
assert.ok(mythology.includes('Vita Merlini'),'nine-women Avalon motif is not qualified');
assert.ok(!/Arianrhod[\s\S]{0,600}karma/i.test(mythology),'Arianrhod remains described through an unqualified karma concept');
assert.ok(mythology.includes('Mai önismereti értelmezés'),'modern interpretation badge is missing in Hungarian');
assert.ok(mythology.includes('Modern reflective interpretation'),'modern interpretation badge is missing in English');
assert.ok(mythology.includes('data-open-tab="draw"')&&mythology.includes('data-open-tab="cleanse"'),'three-path guided entry is incomplete');
assert.ok(mythology.includes('yes-no.html')&&mythology.includes('yes-no-en.html'),'yes/no path is incomplete in one language');
assert.ok(mythology.includes('library.wales')&&mythology.includes('glastonburyabbey.com'),'authoritative source links are missing');
assert.ok(runtime.includes('mythology-authenticity.css'),'authenticity stylesheet is not loaded');
assert.ok(runtime.includes('mythology-authenticity.js'),'authenticity runtime is not loaded');
assert.ok(runtime.includes('mythologyAudit:window.CeridwenMythologyAudit'),'self-test does not expose mythology status');
assert.ok(css.includes('.mythology-guide')&&css.includes('.mythology-provenance'),'authenticity UI styles are incomplete');

const sourceNameMatches=[...mythology.matchAll(/^\s*"([^"]+)":"(?:taliesin|mabinogi|arthurian|folklore|glastonbury|revival|avalon|christian|comparative|original)"/gm)].map(match=>match[1]);
assert.equal(new Set(sourceNameMatches).size,sourceNameMatches.length,'duplicate exact-name provenance mapping');

console.log(JSON.stringify({
  passed:true,
  version:'2026.07.18-authenticity-1',
  provenanceLayers:requiredLayers.length,
  houseMappings:8,
  exactMappings:sourceNameMatches.length,
  bilingual:true,
  guidedPaths:3,
  historicalAndInterpretiveLayersSeparated:true
}));
