import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const slugs = [
  'fotokiallitas1', 'fotokiallitas2', 'fotokiallitas3', 'fotokiallitas4',
  'fotokiallitas5', 'merfoldkovek1956', 'szosszenetek', 'ebredes', 'anovilaga',
  'balerina-project-new-york', 'fotokiallitas8', 'theframe', 'teislehetsz',
  'themensdream', 'avalosag', 'touch-wien', 'enano', 'femmefatale', 'mas-kepp-mas',
];

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'fotokiallitasok') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/\s*<a class="btn" href="https:\/\/www\.banhalmi\.art\/fotokiallitasok\/[^"]+" target="_blank" rel="noopener">[^<]+<\/a>/g, '');
  html = html.replace(/\s*<a class="btn" href="https:\/\/www\.banhalmi\.art\/(?:konyveim|post\/euforia)[^"]*" target="_blank" rel="noopener">[^<]+<\/a>/g, '');
  html = html.replace(/, "sameAs": "https:\/\/www\.banhalmi\.art\/fotokiallitasok\/[^"]+"(?=})/g, '');
  html = html.replace(/, "sameAs": "https:\/\/www\.banhalmi\.art\/(?:konyveim|post\/euforia)[^"]*"(?=})/g, '');
  html = html.replace(/<a href="https:\/\/www\.banhalmi\.art\/mediamegjelenesek" target="_blank" rel="noopener">([^<]+)<\/a>/g, '$1');
  if (file.includes(`${path.sep}hu${path.sep}`)) {
    html = html.replaceAll('https://www.norbertbanhalmi.com/privacy/', 'https://www.norbertbanhalmi.com/hu/adatvedelem/');
    html = html.replaceAll('https://www.norbertbanhalmi.com/impressum/', 'https://www.norbertbanhalmi.com/hu/impresszum/');
  } else if (file.includes(`${path.sep}de-at${path.sep}`)) {
    html = html.replaceAll('https://www.norbertbanhalmi.com/privacy/', 'https://www.norbertbanhalmi.com/de-at/datenschutz/');
    html = html.replaceAll('https://www.norbertbanhalmi.com/impressum/', 'https://www.norbertbanhalmi.com/de-at/impressum/');
    const deLabels = {
      'beszámoló cikk': 'Pressebericht', 'riport cikk': 'Reportage',
      'riport video': 'Videobericht', 'megnyitó': 'Ausstellungseröffnung',
      'kezdetek': 'Die Anfänge', 'versek': 'Gedichte', 'werkfilm': 'Making-of',
      'interjú': 'Interview', 'tanulmány 81. oldal': 'Studie, S. 81',
      'projekt bemutató': 'Projektvorstellung', 'kritika': 'Kritik',
      'werkfilm Bécs': 'Making-of Wien', 'werkfilm München': 'Making-of München',
      'beharangozó': 'Ankündigung',
    };
    for (const [from, to] of Object.entries(deLabels)) html = html.replaceAll(`>${from}<`, `>${to}<`);
    html = html.replace(/>beszámoló cikk (\d+)</g, '>Pressebericht $1<');
    html = html.replace(/>riport cikk (\d+)</g, '>Reportage $1<');
    html = html.replace(/>riport video (\d+)</g, '>Videobericht $1<');
  } else {
    html = html.replaceAll('https://www.norbertbanhalmi.com/privacy/', 'https://www.norbertbanhalmi.com/privacy-policy/');
    const enLabels = {
      'beszámoló cikk': 'Press coverage', 'riport cikk': 'Feature article',
      'riport video': 'Video report', 'megnyitó': 'Exhibition opening',
      'kezdetek': 'The beginnings', 'versek': 'Poems', 'werkfilm': 'Behind the scenes',
      'interjú': 'Interview', 'tanulmány 81. oldal': 'Academic study, p. 81',
      'projekt bemutató': 'Project overview', 'kritika': 'Critical response',
      'werkfilm Bécs': 'Behind the scenes — Vienna', 'werkfilm München': 'Behind the scenes — Munich',
      'beharangozó': 'Event preview',
    };
    for (const [from, to] of Object.entries(enLabels)) html = html.replaceAll(`>${from}<`, `>${to}<`);
    html = html.replace(/>beszámoló cikk (\d+)</g, '>Press coverage $1<');
    html = html.replace(/>riport cikk (\d+)</g, '>Feature article $1<');
    html = html.replace(/>riport video (\d+)</g, '>Video report $1<');
  }
  html = html.replace(/<script>\nif\('serviceWorker' in navigator[\s\S]*?<\/script>/, `<script>
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
</script>`);
  html = html.replace(
    /\(function\(\)\{var c=null;try\{c=localStorage\.getItem\('bn-consent'\);\}catch\(e\)\{\}\nif\(c==='granted'\)/,
    `(function(){var c=null,ttl=180*24*60*60*1000;try{var raw=localStorage.getItem('bn-consent');if(raw==='granted'||raw==='denied'){c=raw;}else if(raw){var saved=JSON.parse(raw);if(saved&&Date.now()-saved.at<ttl)c=saved.value;else localStorage.removeItem('bn-consent');}}catch(e){}\nif(c==='granted')`
  );
  html = html.replace(
    /window\.bnConsent=function\(ok\)\{try\{localStorage\.setItem\('bn-consent',ok\?'granted':'denied'\);\}catch\(e\)\{\}/,
    `window.bnConsent=function(ok){try{localStorage.setItem('bn-consent',JSON.stringify({value:ok?'granted':'denied',at:Date.now()}));}catch(e){}`
  );
  if (file.endsWith('404.html')) {
    html = html.replace('<meta name="robots" content="index, follow, max-image-preview:large">\n', '');
  }
  fs.writeFileSync(file, html);
}

function writeRedirect(source, target) {
  const dir = path.join(root, source);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="https://www.banhalmi.art${target}">
<meta http-equiv="refresh" content="0;url=${target}">
<title>Redirecting — BANHALMI</title>
<script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script>
</head>
<body><p>This exhibition has moved. <a href="${target}">Open the exhibition</a>.</p></body>
</html>
`);
}

for (const slug of slugs) writeRedirect(path.join('fotokiallitasok', slug), `/exhibitions/${slug}.html`);
writeRedirect('konyveim', '/index.html#books');
writeRedirect('mediamegjelenesek', '/press.html');
writeRedirect(path.join('post', 'euforia'), '/exhibitions/euforia.html');
writeRedirect('norbert-banhalmi', '/index.html#about');
