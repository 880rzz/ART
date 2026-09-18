import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('analytics-trust.json','utf8'));
const errors = [];
const required = new Map([
  ['https://www.norbertbanhalmi.com/','G-90C452LJKQ'],
  ['https://www.banhalmi.art/','G-PKLH4H5YKD'],
  ['https://blog.banhalmi.art/','G-EY91Q4QSVF']
]);
const rows = data.ecosystemAnalytics?.properties || [];
for (const [url,id] of required) {
  const row = rows.find(x => x.url === url);
  if (!row) errors.push(`missing ecosystem analytics surface ${url}`);
  else if (row.measurementId !== id) errors.push(`${url}: expected ${id}, found ${row.measurementId}`);
}
if (!/Independent analytics properties/i.test(data.ecosystemAnalytics?.policy || '')) errors.push('independent analytics policy missing');
if (/shared GA4 property/i.test(JSON.stringify(data.ecosystemAnalytics))) errors.push('obsolete shared-GA4 wording present');
const art = data.services?.find(x => x.name === 'Google Analytics 4');
if (art?.measurementId !== 'G-PKLH4H5YKD' || art?.loadsBeforeConsent !== false) errors.push('ART consent-first GA4 contract drift');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART ecosystem analytics contract passed.');
