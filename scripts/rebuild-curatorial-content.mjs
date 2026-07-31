import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function removeGeneratedExhibitionBlocks(html) {
  let next = html;
  next = next.replace(/<!-- OEUVRE-INTEGRITY:START -->[\s\S]*?<!-- OEUVRE-INTEGRITY:END -->/gi, '');
  next = next.replace(/<section[^>]+id=["']curatorial-periods["'][\s\S]*?<\/section>/gi, '');
  next = next.replace(/<section class=["'][^"']*presence-context[^"']*["'][^>]*>[\s\S]*?(?:Hivatkozási réteg|Reference layer|Referenzebene)[\s\S]*?<\/section>/gi, '');
  return next;
}

function rebuildHungarianBiography(html) {
  const domainNarrative = /<p>Egy súlyos baleset után döntöttem úgy, hogy a saját nevem alatt is felépítem a személyes márkámat\.[\s\S]*?Vagyis mind a négy domain él, de a tartalom ma már két központi felületen fut össze\.<\/p>/i;
  const replacement = `<p>A pályám egyik meghatározó fordulópontja egy súlyos görögországi baleset volt. A kórházban, bizonytalan látással és összetört karral vált világossá számomra, hogy a fotográfiát nem mellékes szakmai irányként akarom továbbvinni. Ettől kezdve tudatosan a saját alkotói hangom, a személyes történetek és az emberi jelenlét felé fordultam.</p>
  <p>A New Yorkhoz kapcsolódó évek és projektek megmutatták, hogy a portré egyszerre lehet személyes találkozás, társadalmi dokumentum és történelmi forrás. A Magyar nők New Yorkban, majd a Mérföldkövek ’56 után egyre fontosabbá vált számomra az emlékezet, az identitás és az, hogy a fényképezett ember saját története ne vesszen el a kép esztétikája mögött.</p>
  <p>Az Ébredés, a Szösszenetek és A Nő világa már a test, a gyógyulás, az intimitás és az életfordulók felől folytatta ezt a munkát. A könyvek, a kiállítások, az irodalmi és orvosi együttműködések azért kerültek egymás mellé, mert egyetlen fénykép sokszor nem tudja elmondani mindazt, amit egy ember átélt.</p>
  <p>Később a kurátori, oktatási és közösségi munka is az életmű részévé vált. A Rege Galéria, a bécsi fotóklub, a gyermekeknek tartott foglalkozások és a jótékonysági projektek ugyanarra az alapelvre épülnek: a fotográfia nemcsak képet készít, hanem kapcsolatot, emlékezetet és közös teret is létrehozhat.</p>`;
  return html.replace(domainNarrative, replacement);
}

function ensurePresenceCss(html) {
  if (!/<html\b/i.test(html) || !html.includes('</head>')) return html;
  const hasPresenceCssLink = /<link\b[^>]*href=["']\/assets\/css\/presence-core\.css(?:\?[^"']*)?["'][^>]*>/i.test(html);
  if (hasPresenceCssLink) return html;
  return html.replace('</head>', '<link rel="stylesheet" href="/assets/css/presence-core.css">\n</head>');
}

async function walk(dir, out = []) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.github'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) await walk(full, out);
    else if (item.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const changed = [];
for (const file of await walk(root)) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const original = await readFile(file, 'utf8');
  let next = original;

  if (/(^|\/)exhibitions\//.test(rel)) next = removeGeneratedExhibitionBlocks(next);
  if (rel === 'hu/index.html') next = rebuildHungarianBiography(next);
  next = ensurePresenceCss(next);

  next = next.replace(
    /A kiindulópont a MOL Project\./g,
    'A kiindulópont a MOL Project, egy korai, saját kezdeményezésű fotográfiai tanulmány, amely nem a MOL vállalat megrendelésére készült.'
  );

  if (next !== original) {
    await writeFile(file, next, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
