import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const file = path.join(root, '_redirects');
let redirects = await readFile(file, 'utf8');
redirects = redirects
  .replace(/^\/norbert-banhalmi\s+\/about\.html\s+301$/m, '/norbert-banhalmi  /#about  301')
  .replace(/^\/20ev\s+\/about\.html\s+301$/m, '/20ev  /hu/#journey  301');

if (/\/about\.html/.test(redirects)) throw new Error('A dead about.html redirect target remains');
await writeFile(file, redirects, 'utf8');
console.log('All legacy about.html redirects now resolve to existing About or Oeuvre anchors.');
