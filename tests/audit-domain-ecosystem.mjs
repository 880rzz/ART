import { readFile } from 'node:fs/promises';

const ecosystem = JSON.parse(await readFile(new URL('../data/archive/domain-ecosystem.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const primaryDomains = Array.isArray(ecosystem.primaryDomains) ? ecosystem.primaryDomains : [];
const languageEntryDomains = Array.isArray(ecosystem.languageEntryDomains) ? ecosystem.languageEntryDomains : [];
const primary = primaryDomains.map((item) => item.domain);
const languageEntries = languageEntryDomains.map((item) => item.domain);
const allDomains = [...primary, ...languageEntries];
const uniqueDomains = new Set(allDomains);
const summary = String(ecosystem.summary ?? '').replace(/\s+/g, ' ').trim();

const checks = [
  ['two primary domains', primary.length === 2],
  ['two language entry domains', languageEntries.length === 2],
  ['four unique active domains', allDomains.length === 4 && uniqueDomains.size === 4],
  ['professional primary domain', primary.includes('https://www.norbertbanhalmi.com/')],
  ['art archive primary domain', primary.includes('https://www.banhalmi.art/')],
  ['Hungarian entry domain', languageEntries.includes('https://www.banhalminorbert.hu/')],
  ['German entry domain', languageEntries.includes('https://www.banhalmi.at/')],
  ['Hungarian language role', languageEntryDomains.some((item) => item.language === 'hu-HU' && /magyar/iu.test(item.role ?? ''))],
  ['German language role', languageEntryDomains.some((item) => item.language === 'de-AT' && /német/iu.test(item.role ?? ''))],
  ['German domain chronology', languageEntryDomains.some((item) => item.domain === 'https://www.banhalmi.at/' && /2025/iu.test(item.role ?? ''))],
  ['two-centre summary', /mind a négy domain működik/iu.test(summary) && /két központi rendszerben/iu.test(summary)],
  ['schema integration', /sameAsAnchor/.test(integration) && /allDomains/.test(integration)],
  ['footer integration', /banhalminorbert\.hu/.test(integration) && /banhalmi\.at/.test(integration)],
  ['idempotent integration', /allDomains\.every\s*\(\s*\(domain\)\s*=>\s*next\.includes/.test(integration)],
  ['no inactive-domain framing', !/legacy|inactive|megszűnt|nem működik|átirányított/iu.test(summary)],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failed.length) {
  const names = failed.map(([name]) => name).join(', ');
  throw new Error(`A domain-ökoszisztéma audit ${failed.length} hibát talált: ${names}`);
}
