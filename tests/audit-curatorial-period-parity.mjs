import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const canonical = JSON.parse(fs.readFileSync(path.join(root, 'data/archive/oeuvre-periods.json'), 'utf8'));
const backbone = JSON.parse(fs.readFileSync(path.join(root, 'period-evidence-backbone.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'archive-record-registry.json'), 'utf8'));
assert.equal(backbone.canonicalPeriodTaxonomy, 'data/archive/oeuvre-periods.json');
assert.equal(canonical.periods.length, 5);
assert.equal(backbone.periods.length, 5);
assert.equal(registry.researchPeriods.length, 5);
for (const period of canonical.periods) {
  const anchor = backbone.periods.find((entry) => entry.number === period.numeral);
  const record = registry.researchPeriods.find((entry) => entry.number === period.numeral);
  assert.ok(anchor && record, 'Missing historical period ' + period.numeral);
  assert.equal(anchor.id.toLowerCase(), period.id);
  assert.equal(record.id.toLowerCase(), period.id);
  assert.deepEqual(anchor.canonicalPeriodTitle, period.title,
    period.id + ' title must match the public curator taxonomy');
  assert.deepEqual(anchor.canonicalPeriodRange, period.range,
    period.id + ' date range must match the public curator taxonomy');
  assert.ok(anchor.name && anchor.anchorProject,
    period.id + ' must preserve its distinct evidence anchor');
}
console.log('ART canonical curatorial periods: five official timelines and five machine evidence anchors are synchronized.');
