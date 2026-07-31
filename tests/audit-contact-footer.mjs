import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile(new URL('../data/archive/contact-footer.hu.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('../scripts/integrate-family-origins.mjs', import.meta.url), 'utf8');

const combined = [
  data.contact.label,
  data.contact.title,
  data.contact.lead,
  data.contact.professionalLabel,
  data.contact.professionalText,
  data.footer.identity,
  data.footer.contactLine,
  data.footer.domainLine,
].join(' ');

const checks = [
  ['archive contact focus', /kiállítással|archívumi|publikációval|képfelhasználással/iu.test(data.contact.lead)],
  ['professional work separated', data.contact.professionalText.includes('norbertbanhalmi.com') && data.contact.professionalText.includes('Executive portré')],
  ['two-center domain model', data.footer.domainLine.includes('banhalmi.art') && data.footer.domainLine.includes('norbertbanhalmi.com') && !data.footer.domainLine.includes('Négy működő domain')],
  ['no generic sales language', !/rendelj|akció|kedvezmény|csomagajánlat|foglalj most/iu.test(combined)],
  ['footer identifies archive', data.footer.identity.includes('Fotográfiai archívum')],
  ['integration reads source', integration.includes('CONTACT_FOOTER_PATH') && integration.includes('contactFooter')],
  ['contact replacement bounded', integration.includes('contactIntroPattern') && integration.includes('professionalNotePattern')],
  /* The footer lists banhalmi.art and norbertbanhalmi.com as links already,
     so the prose restatement of the two-centre model was removed from the
     rendered page at Norbert's request. domainLine stays in the source data
     as the canonical wording (asserted above) and must NOT be injected into
     the footer markup — this check now guards the removal rather than the
     insertion, so the paragraph cannot quietly return via regeneration. */
  ['domain line kept in data but not rendered', !integration.includes('contactFooter.footer.domainLine')],
  ['footer replacement included', integration.includes('contactFooter.footer.identity') && integration.includes('contactFooter.footer.contactLine')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? '✓' : '✗'} ${name}`);
if (failed.length) throw new Error(`A kapcsolat/lábléc audit ${failed.length} hibát talált.`);
