import fs from 'node:fs';

const files = ['exhibitions/merfoldkovek1956.html', 'hu/exhibitions/merfoldkovek1956.html', 'de-at/exhibitions/merfoldkovek1956.html'];
const provenancePath = '/data/milestones-1956-provenance.jsonld';
const data = JSON.parse(fs.readFileSync(`.${provenancePath}`, 'utf8'));
const graph = data['@graph'] || [];
const event = graph.find((node) => node['@type'] === 'ExhibitionEvent');
const records = graph.find((node) => node['@type'] === 'CreativeWorkSeries');

if (!event || event.startDate !== '2016-10-22' || event.endDate !== '2017-01-10') throw new Error('Milestones exact historical dates missing');
if (!records || records.numberOfItems !== 15 || records.hasPart?.length !== 15) throw new Error('Milestones 15-record provenance set incomplete');
for (const token of ['New York-i Magyar Ház', 'Hungary Initiatives Foundation', 'Amerikai Magyar Emlékmű Bizottság', 'New York-i Magyar Főkonzulátus', 'Mandiner']) {
  if (!JSON.stringify(data).includes(token)) throw new Error(`Milestones provenance missing ${token}`);
}
if (!JSON.stringify(data).includes('no present-day partnership or endorsement is implied')) throw new Error('Milestones historical-scope boundary missing');
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes(`href="${provenancePath}"`)) throw new Error(`${file}: provenance representation link missing`);
  if (!html.includes('data-historical-provenance="milestones-1956"')) throw new Error(`${file}: visible historical provenance block missing`);
}
console.log('Milestones 1956 provenance audit passed: 15 records, exact dates, localized disclosure and historical role boundaries are intact.');
