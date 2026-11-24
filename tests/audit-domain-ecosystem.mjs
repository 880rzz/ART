import { readFile } from 'node:fs/promises';

const ecosystem = JSON.parse(await readFile(new URL('../data/archive/domain-ecosystem.hu.json', import.meta.url), 'utf8'));
/* The three checks below used to read a generator's source and assert that it
   contained the right variable names. That tested the pipeline, not the site.
   The generators are gone; the same properties are now asserted where they are
   visible — in the pages' schema and footers. */
const homepages = await Promise.all(
  ['../index.html', '../hu/index.html', '../de-at/index.html']
    .map((p) => readFile(new URL(p, import.meta.url), 'utf8'))
);

const primaryDomains = Array.isArray(ecosystem.primaryDomains) ? ecosystem.primaryDomains : [];
const languageEntryDomains = Array.isArray(ecosystem.languageEntryDomains) ? ecosystem.languageEntryDomains : [];
const primary = primaryDomains.map((item) => item.domain);
const languageEntries = languageEntryDomains.map((item) => item.domain);
const allDomains = [...primary, ...languageEntries];
const uniqueDomains = new Set(allDomains);
const summary = String(ecosystem.summary ?? '').replace(/\s+/g, ' ').trim();

const core = JSON.parse(await readFile(new URL('../data/machine-core.json', import.meta.url), 'utf8'));
const guide = core.editorialBridge;
const graph = JSON.parse(await readFile(new URL('../ecosystem-bridge.jsonld', import.meta.url), 'utf8'));
const blog = graph['@graph'].find((node) => node['@id'] === 'https://blog.banhalmi.art/#blog');
const blogDomain = primaryDomains.find((item) => item.domain === 'https://blog.banhalmi.art/');
const localePrefixes = {'en-GB':'', 'hu-HU':'hu/', 'de-AT':'de-at/'};
const articleRoutes = [];
for (const [locale, prefix] of Object.entries(localePrefixes)) {
  for (const [channel, page] of Object.entries({hub:'index.html', history:'writing.html', community:'community.html'})) {
    const publicHtml = await readFile(new URL('../' + prefix + page, import.meta.url), 'utf8');
    const localUrl = guide?.localizedRoutes?.[locale]?.[channel];
    const main = publicHtml.split('<main')[1]?.split('</main>')[0] ?? '';
    articleRoutes.push(Boolean(localUrl && main.includes('data-editorial-bridge="' + channel + '"') &&
      main.includes('href="' + localUrl + '"')));
  }
}
const checks = [
  ['three primary domains', primary.length === 3],
  ['two language entry domains', languageEntries.length === 2],
  ['five unique domains, three primary and two entrances', allDomains.length === 5 && uniqueDomains.size === 5],
  ['professional primary domain', primary.includes('https://www.banhalmiphotography.com/')],
  ['art archive primary domain', primary.includes('https://www.banhalmi.art/')],
  ['Hungarian entry domain', languageEntries.includes('https://www.banhalminorbert.hu/')],
  ['German entry domain', languageEntries.includes('https://www.banhalmi.at/')],
  ['Hungarian language role', languageEntryDomains.some((item) => item.language === 'hu-HU' && /magyar/iu.test(item.role ?? ''))],
  ['German language role', languageEntryDomains.some((item) => item.language === 'de-AT' && /német/iu.test(item.role ?? ''))],
  ['German domain chronology', languageEntryDomains.some((item) => item.domain === 'https://www.banhalmi.at/' && /2025/iu.test(item.role ?? ''))],
  ['three-role summary', /három önálló szerep/iu.test(summary) && /szerkesztőségi és fotográfiai edukációs/iu.test(summary)],
  ['blog editorial domain and localized roots', Boolean(blogDomain) && Object.keys(localePrefixes).every((locale) => blogDomain.localizedRoots?.[locale] === guide?.localizedRoutes?.[locale]?.hub)],
  ['distinct blog creator and individual bylines', Boolean(blog?.creator) && !blog?.author && /credited author or speaker/i.test(guide?.bylineRule ?? '')],
  ['nine contextual editorial destinations by locale and intent', articleRoutes.length === 9 && articleRoutes.every(Boolean)],
  ['ART homepages retain their artistic WebSite entity', homepages.every((html) => html.includes('https://www.banhalmi.art/#website'))],
  ['redirect-only entry domains do not become ART footer sales links', homepages.every((html) => {
    const footer = /<footer[\s\S]*?<\/footer>/i.exec(html)?.[0] ?? '';
    return languageEntries.every((d) => !footer.includes('href="' + d));
  })],
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
