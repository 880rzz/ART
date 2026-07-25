import { readFile } from 'node:fs/promises';

const ecosystem = JSON.parse(await readFile(new URL('../data/archive/domain-ecosystem.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const primary = ecosystem.primaryDomains.map((item) => item.domain);
const languageEntries = ecosystem.languageEntryDomains.map((item) => item.domain);
const allDomains = [...primary, ...languageEntries];

const checks = [
  ['two primary domains', primary.length === 2],
  ['four active domains', allDomains.length === 4],
  ['professional primary domain', primary.includes('https://www.norbertbanhalmi.com/')],
  ['art archive primary domain', primary.includes('https://www.banhalmi.art/')],
  ['Hungarian entry domain', languageEntries.includes('https://www.banhalminorbert.hu/')],
  ['German entry domain', languageEntries.includes('https://www.banhalmi.at/')],
  ['Hungarian language role', ecosystem.languageEntryDomains.some((item) => item.language === 'hu-HU')],
  ['German language role', ecosystem.languageEntryDomains.some((item) => item.language === 'de-AT')],
  ['two-centre summary', ecosystem.summary.includes('két központi rendszerben') && ecosystem.summary.includes('mind a négy domain működik')],
  ['schema integration', integration.includes('sameAsAnchor') && integration.includes('allDomains')],
  ['footer integration', integration.includes('banhalminorbert.hu') && integration.includes('banhalmi.at')],
  ['idempotent integration', integration.includes("allDomains.every((domain) => next.includes")),
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  throw new Error(`A domain-ökoszisztéma audit ${failed.length} hibát talált.`);
}
