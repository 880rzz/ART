import fs from 'node:fs';
const pages = [
  ['exhibitions/euforia.html', '10 documented publications and image credits'],
  ['hu/exhibitions/euforia.html', '10 dokumentált megjelenés és szerzői hivatkozás'],
  ['de-at/exhibitions/euforia.html', '10 dokumentierte Veröffentlichungen und Bildnachweise']
];
const errors = [];
for (const [file, summary] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const block = html.match(/<details class="usage-disclosure">([\s\S]*?)<\/details>/)?.[1] || '';
  if (!block.includes(`<summary>${summary}</summary>`)) errors.push(`${file}: descriptive publication summary missing`);
  if ((block.match(/<li\b/g) || []).length !== 10) errors.push(`${file}: expected ten publication records`);
  const artwork = html.indexOf('euforia-artwork--peter');
  const map = html.indexOf('<section class="wrap narrow euforia-project-map"');
  const history = html.indexOf('id="euforia-public-history"');
  const provenance = html.indexOf('id="peter-magyar-provenance"');
  if (!(artwork < map && map < history && history < provenance)) errors.push(`${file}: story/map/history/provenance order broken`);
  if (provenance > html.indexOf('</main>')) errors.push(`${file}: provenance outside main landmark`);
  if (/moral shield|celebrity endorsement|rewrote a country.s political discourse/.test(html)) errors.push(`${file}: unsupported political interpretation`);
}
const css = fs.readFileSync('assets/css/site.css', 'utf8');
for (const token of ['summary:focus-visible', 'min-height:52px', '--art-gold:#DCC56B']) {
  if (!css.includes(token)) errors.push(`Canonical disclosure CSS missing: ${token}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('EUFÓRIA: three languages, ten publication records each, story-first order and canonical disclosure styles.');