import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const errors = [];

async function exists(rel) {
  try { await access(path.join(root, rel)); return true; }
  catch { return false; }
}

function localPathFromUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.hostname !== 'www.banhalmi.art' && url.hostname !== 'banhalmi.art') return null;
  let pathname = decodeURIComponent(url.pathname || '/');
  if (pathname === '/') return 'index.html';
  pathname = pathname.replace(/^\//, '');
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  return pathname;
}

const machineFiles = ['llms.txt', 'ai.txt', '.well-known/agent.json'];
for (const file of machineFiles) {
  if (!(await exists(file))) {
    errors.push(`${file}: missing required machine entry point`);
    continue;
  }
  const source = await readFile(path.join(root, file), 'utf8');
  const urls = new Set(source.match(/https:\/\/[^\s\])}"']+/g) || []);
  for (const raw of urls) {
    const clean = raw.replace(/[.,;:!?]+$/, '');
    const local = localPathFromUrl(clean);
    if (!local) continue;
    if (!(await exists(local))) errors.push(`${file}: local URL points to missing source path: ${clean} -> ${local}`);
    const hash = (() => { try { return new URL(clean).hash.slice(1); } catch { return ''; } })();
    if (hash && local.endsWith('.html') && await exists(local)) {
      const html = await readFile(path.join(root, local), 'utf8');
      const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(?:id|name)=["']${escaped}["']`, 'i').test(html)) {
        errors.push(`${file}: fragment target not found: ${clean}`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART machine-entrypoint integrity passed: same-domain machine links resolve to real source paths and declared fragments.');
