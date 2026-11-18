import fs from 'node:fs';
import assert from 'node:assert/strict';

const pages = [
  ['curators.html', 'Rege Gallery in Tihany', 'VIPACH'],
  ['hu/curators.html', 'Rege Galériát', 'VIPACH'],
  ['de-at/curators.html', 'Rege Galerie in Tihany', 'VIPACH'],
];
for (const [file, rege, vipach] of pages) {
  const html=fs.readFileSync(file,'utf8');
  const iv=html.match(/<article class="curatorial-period" id="period-iv">([\s\S]*?)<\/article>/)?.[1];
  const v=html.match(/<article class="curatorial-period" id="period-v">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(iv && v, file+': five-period curator structure missing');
  assert.ok(iv.includes('data-art-cultural-bridge="rege"') && iv.includes(rege), file+': period IV REGE link missing');
  assert.ok(v.includes('data-art-cultural-bridge="vipach"') && v.includes(vipach), file+': period V VIPACH link missing');
  assert.ok(iv.includes('href="community.html"') && v.includes('href="community.html"'),file+': cultural records must be navigable inside same locale');
  assert.ok(iv.includes('2020') && iv.includes('2021'),file+': REGE gallery chronology must remain distinct');
  assert.ok(v.includes('2026'),file+': VIPACH specific exhibition year absent');
  for (const paragraph of [iv.match(/<p data-art-cultural-bridge="rege">([\s\S]*?)<\/p>/)?.[1],v.match(/<p data-art-cultural-bridge="vipach">([\s\S]*?)<\/p>/)?.[1]]) {
    assert.ok(paragraph, file+': cultural prose missing');
    const plain=paragraph.replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ');
    assert.ok(plain.length<500,file+': narrow phone needs concise prose segments');
    assert.ok(!/700\s*(members|tag|fő|Mitglieder)/.test(plain),file+': unverified membership claim');
  }
}
console.log('Curatorial cultural periods IV/V: REGE/VIPACH contextual evidence is present in EN, HU and de-AT without oversized paragraphs.');
