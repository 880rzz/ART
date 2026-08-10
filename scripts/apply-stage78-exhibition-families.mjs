import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const cssPath = path.join(root, 'assets/css/record-editorial-system.css');
const releasePath = path.join(root, 'data/design-release.json');
const runtimePath = path.join(root, 'assets/js/responsive-header-system.js');
const auditPath = path.join(root, 'tests/audit-record-editorial-stage75.mjs');
const bumpPath = path.join(root, 'scripts/bump-editorial-release-cache.mjs');
const newRelease = '20260810-exhibition-families-v78';
let css = await readFile(cssPath, 'utf8');
if (!css.includes('Stage 78 — remaining exhibition families')) css += `

/* Stage 78 — remaining exhibition families. Pacing only; archive facts, schema, routes and strict two-blue alternation remain unchanged. */
/* Early portrait cycle — contact-sheet discipline. */
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas1"],[data-record-slug="fotokiallitas2"],[data-record-slug="fotokiallitas4"]){--record-measure:64ch}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas1"],[data-record-slug="fotokiallitas2"],[data-record-slug="fotokiallitas4"]) header.sub h1{max-width:13ch!important}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas1"],[data-record-slug="fotokiallitas2"],[data-record-slug="fotokiallitas4"]) .collage{columns:3!important;column-gap:clamp(14px,1.8vw,24px)!important}
/* New York / movement — cinematic field. */
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas3"],[data-record-slug="balerina-project-new-york"]){--record-measure:68ch}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas3"],[data-record-slug="balerina-project-new-york"]) header.sub .wrap{max-width:1240px!important}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas3"],[data-record-slug="balerina-project-new-york"]) .collage{columns:2!important;column-gap:clamp(28px,4vw,60px)!important}
/* Intimate human stories. */
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas5"],[data-record-slug="ebredes"]){--record-measure:60ch;--record-line:rgba(175,196,217,.18)}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas5"],[data-record-slug="ebredes"]) header.sub .wrap{max-width:1020px!important}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas5"],[data-record-slug="ebredes"]) .collage{columns:2!important;column-gap:clamp(18px,2.5vw,34px)!important}
/* Contemporary identity. */
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="enano"],[data-record-slug="femmefatale"]){--record-measure:66ch}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="enano"],[data-record-slug="femmefatale"]) header.sub h1{font-size:clamp(3rem,7vw,6rem)!important;max-width:12ch!important}
body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="enano"],[data-record-slug="femmefatale"]) .collage{columns:2!important;column-gap:clamp(24px,3.5vw,52px)!important}
/* AI / mediated reality — precise frame language. */
body.apple-archive[data-record-type="exhibition"][data-record-slug="avalosag"]{--record-measure:62ch;--record-line:rgba(175,196,217,.24)}
body.apple-archive[data-record-type="exhibition"][data-record-slug="avalosag"] header.sub::after{border-radius:0;aspect-ratio:1.55;right:-9vw;top:10%;background:transparent;border:1px solid rgba(183,156,68,.28);transform:rotate(1.5deg)}
body.apple-archive[data-record-type="exhibition"][data-record-slug="avalosag"] .collage{columns:2!important;column-gap:clamp(18px,2.5vw,36px)!important}
body.apple-archive[data-record-type="exhibition"][data-record-slug="avalosag"] .collage figure{padding:clamp(6px,.8vw,10px)!important;border:1px solid var(--record-line)!important}
/* Group show — compact archival dossier. */
body.apple-archive[data-record-type="exhibition"][data-record-slug="fotokiallitas8"]{--record-measure:58ch}
body.apple-archive[data-record-type="exhibition"][data-record-slug="fotokiallitas8"] header.sub .wrap{max-width:960px!important}
body.apple-archive[data-record-type="exhibition"][data-record-slug="fotokiallitas8"] .collage{columns:2!important;max-width:880px!important}
@media(max-width:640px){body.apple-archive[data-record-type="exhibition"]:is([data-record-slug="fotokiallitas1"],[data-record-slug="fotokiallitas2"],[data-record-slug="fotokiallitas3"],[data-record-slug="fotokiallitas4"],[data-record-slug="fotokiallitas5"],[data-record-slug="fotokiallitas8"],[data-record-slug="ebredes"],[data-record-slug="balerina-project-new-york"],[data-record-slug="enano"],[data-record-slug="femmefatale"],[data-record-slug="avalosag"]) .collage{columns:1!important}}
`;
await writeFile(cssPath, css);
const release = JSON.parse(await readFile(releasePath, 'utf8'));
release.release = newRelease;
release.note = 'Stage 78 exhibition families: all remaining exhibition records gain deliberate portrait-cycle, New York, intimate-story, contemporary-identity, AI-frame or group-dossier pacing across EN/HU/DE-AT while preserving two-blue/gold authority, schema and routes.';
release.assetDigest = crypto.createHash('sha256').update(css).digest('hex').slice(0, 16);
await writeFile(releasePath, JSON.stringify(release, null, 2) + '\n');
for (const file of [runtimePath, bumpPath]) { let text = await readFile(file, 'utf8'); text = text.replace(/20260810-book-signatures-v77/g, newRelease); await writeFile(file, text); }
let audit = await readFile(auditPath, 'utf8');
audit = audit.replace('Stage 75/76/77 permanent regression gate', 'Stage 75/76/77/78 permanent regression gate');
const bookLine = "must(['book-ebredes','book-szosszenetek','book-anovilaga'].every((slug) => css.includes(`[data-record-slug=\\\"${slug}\\\"]`)), 'Stage 77 book signature selectors are missing');";
const stage78Line = "\nconst stage78Exhibitions = ['avalosag','balerina-project-new-york','ebredes','enano','femmefatale','fotokiallitas1','fotokiallitas2','fotokiallitas3','fotokiallitas4','fotokiallitas5','fotokiallitas8'];\nmust(stage78Exhibitions.every((slug) => css.includes('[data-record-slug=\\\"' + slug + '\\\"]')), 'Stage 78 remaining exhibition family selectors are missing');";
if (!audit.includes('stage78Exhibitions')) audit = audit.replace(bookLine, bookLine + stage78Line);
audit = audit.replace('Stage 75/76/77 record editorial audit passed for exhibition and book records in EN/HU/DE-AT, including four exhibition and three book signatures.', 'Stage 75/76/77/78 record editorial audit passed for exhibition and book records in EN/HU/DE-AT, including landmark signatures, all remaining exhibition families and three book signatures.');
await writeFile(auditPath, audit);
console.log(`Stage 78 exhibition-family signatures applied; release ${newRelease}.`);
