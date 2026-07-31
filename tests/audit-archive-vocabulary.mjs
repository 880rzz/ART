import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));

const policy = await readJson('data/archive/vocabulary-policy.json');
const index = await readJson('vocabulary/index.jsonld');

assert.equal(index['@type'], 'DefinedTermSet', 'A vocabulary index típusa legyen DefinedTermSet.');
assert.equal(index['@id'], policy.baseUrl, 'A vocabulary index @id-je egyezzen a policy baseUrl értékével.');
assert.equal(index.version, policy.version, 'A vocabulary index és a policy verziója eltér.');

const indexedTerms = new Set((index.hasDefinedTerm || []).map((entry) => entry['@id']));
const definitionByProperty = new Map();

for (const [property, rule] of Object.entries(policy.properties)) {
  assert.ok(indexedTerms.has(rule.definitionUrl), `${property}: nincs felsorolva a központi vocabulary indexben.`);
  const definition = await readJson(`vocabulary/${property}`);
  assert.equal(definition['@type'], 'DefinedTerm', `${property}: a definíció típusa nem DefinedTerm.`);
  assert.equal(definition['@id'], rule.definitionUrl, `${property}: hibás definíciós @id.`);
  assert.equal(definition.name, property, `${property}: a definíció neve eltér a tulajdonság nevétől.`);
  assert.equal(definition.inDefinedTermSet, policy.baseUrl, `${property}: hibás DefinedTermSet kapcsolat.`);
  assert.ok(definition.description?.trim(), `${property}: hiányzó fogalomleírás.`);
  definitionByProperty.set(property, definition);
}

const documents = [
  ['oeuvre-knowledge-graph.hu.jsonld', await readJson('oeuvre-knowledge-graph.hu.jsonld')],
  ['press-knowledge-graph.hu.jsonld', await readJson('press-knowledge-graph.hu.jsonld')],
  ['artwork-knowledge-graph.hu.jsonld', await readJson('artwork-knowledge-graph.hu.jsonld')],
  ['data/archive/artwork-registry.hu.json', await readJson('data/archive/artwork-registry.hu.json')],
];

const collectValues = (value, property, values = []) => {
  if (Array.isArray(value)) {
    for (const item of value) collectValues(item, property, values);
    return values;
  }
  if (!value || typeof value !== 'object') return values;
  for (const [key, child] of Object.entries(value)) {
    if (key === property) values.push(child);
    collectValues(child, property, values);
  }
  return values;
};

for (const [fileName, document] of documents) {
  const context = document['@context'];
  if (context && typeof context === 'object' && !Array.isArray(context)) {
    for (const [property, rule] of Object.entries(policy.properties)) {
      if (Object.hasOwn(context, property)) {
        assert.equal(context[property], rule.definitionUrl, `${fileName}: ${property} context URL eltér a policytől.`);
      }
    }
  }

  // Only actual graph entities or registry records contain controlled data values.
  // JSON-LD context mappings and registry policy metadata are definitions, not record values.
  const dataRoot = Array.isArray(document['@graph'])
    ? document['@graph']
    : Array.isArray(document.records)
      ? document.records
      : [];

  for (const [property, rule] of Object.entries(policy.properties)) {
    const values = collectValues(dataRoot, property);
    for (const value of values) {
      if (rule.allowedValues) {
        assert.equal(typeof value, 'string', `${fileName}: ${property} értéke csak szöveg lehet.`);
        assert.ok(rule.allowedValues.includes(value), `${fileName}: nem engedélyezett ${property} érték: ${value}`);
      }
      if (rule.valueType === 'Text') {
        assert.equal(typeof value, 'string', `${fileName}: ${property} értéke csak szöveg lehet.`);
        assert.ok(value.trim(), `${fileName}: ${property} nem lehet üres.`);
      }
    }
  }
}

console.log(`✓ ${definitionByProperty.size} saját archívumi tulajdonság dokumentálva`);
console.log('✓ A használt kontrollált vocabulary értékek érvényesek');
