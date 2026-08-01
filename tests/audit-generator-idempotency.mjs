/* Generator idempotency.
 *
 * The repo carries a chain of scripts (`npm run integrate:unified-design`) that
 * rewrite the HTML in place. Two of them had drifted into acting as a source of
 * truth rather than a formatter:
 *
 *   - apply-unified-design.mjs held a hard-coded table of homepage copy that had
 *     gone stale, so every run silently reverted approved wording;
 *   - four scripts stripped their own <link> and re-appended it before </head>,
 *     which reordered the CSS cascade differently depending on run order.
 *
 * Neither failed loudly. The damage only showed up later as "my fixes keep
 * disappearing" and "old and new CSS seem mixed".
 *
 * This audit runs the whole chain against a throwaway copy of the repo and
 * fails if any page differs afterwards. A generator that changes committed
 * output is, by definition, disagreeing with the repo about what the site says.
 * If this test fails, the fix is to move whatever the script is asserting into
 * a data file — not to accept the rewrite.
 *
 * Set SKIP_GENERATOR_IDEMPOTENCY=1 to skip (it costs a full chain run).
 */
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');

if (process.env.SKIP_GENERATOR_IDEMPOTENCY === '1') {
  console.log('Generator idempotency audit skipped (SKIP_GENERATOR_IDEMPOTENCY=1).');
  process.exit(0);
}

const skip = new Set(['.git', 'node_modules', '.github']);

async function collect(dir, base, out = new Map()) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, base, out);
    else if (entry.name.endsWith('.html')) {
      out.set(path.relative(base, full).replaceAll(path.sep, '/'), await readFile(full, 'utf8'));
    }
  }
  return out;
}

const work = await mkdtemp(path.join(tmpdir(), 'banhalmi-generator-'));
let failures = [];

try {
  await cp(root, work, {
    recursive: true,
    filter: (src) => !src.split(path.sep).some((part) => skip.has(part)),
  });

  const before = await collect(work, work);

  try {
    await run('npm', ['run', 'integrate:unified-design'], { cwd: work, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    console.error('The generator chain exited with an error:\n' + (error.stdout || '') + (error.stderr || ''));
    process.exit(1);
  }

  /* Every script that writes HTML, not only the twelve in the chain.
     Checking the chain alone left nine scripts unexamined, and those turned
     out to be the dangerous ones: one replaces 37 live pages with redirect
     stubs, one deletes 374 lines from the Hungarian curators page, one
     double-escapes HTML entities in visible text. Each is a single
     `node scripts/…` away from undoing committed work, and none of them
     failed loudly. They are guarded now; this loop is what keeps them so. */
  const scripts = (await readdir(path.join(work, 'scripts')))
    .filter((f) => f.endsWith('.mjs'))
    .sort();
  for (const script of scripts) {
    try {
      await run('node', [path.join('scripts', script)], { cwd: work, maxBuffer: 64 * 1024 * 1024, timeout: 90_000 });
    } catch {
      /* A script that errors out has not rewritten anything, which is the
         property under test; its own audit is the place to catch breakage. */
    }
  }

  /* And the Python side. The production workflow runs about thirty tools from
     tools/ on every push to main and then commits the result back, so a tool
     that rewrites pages does not merely annoy someone locally — it publishes.
     Nine of them rewrote committed HTML when this check was added, two of them
     across 82 and 69 pages, 89 in total. Audits (audit_*.py) only read.

     This phase is behind INCLUDE_PYTHON_TOOLS=1 because it currently fails:
     the Python tools and the committed repo genuinely disagree, and resolving
     that means deciding, tool by tool, whether the tool or the repo is right —
     which is a content decision, not something to settle inside a test run.
     `npm run test:generator-tools` runs it. The danger it guards against is
     defused separately: the production workflow no longer commits generator
     output back to main. */
  const tools = process.env.INCLUDE_PYTHON_TOOLS === '1'
    ? (await readdir(path.join(work, 'tools'))).filter((f) => f.endsWith('.py') && !f.startsWith('audit_')).sort()
    : [];
  for (const tool of tools) {
    try {
      await run('python3', [path.join('tools', tool)], { cwd: work, maxBuffer: 64 * 1024 * 1024, timeout: 90_000 });
    } catch {
      /* As above: a tool that fails has not written anything. */
    }
  }

  const after = await collect(work, work);

  for (const [rel, original] of before) {
    const updated = after.get(rel);
    if (updated === undefined) { failures.push(`${rel}: deleted by a generator script`); continue; }
    if (updated === original) continue;

    /* Report the first differing line so the offending script is obvious. */
    const a = original.split('\n');
    const b = updated.split('\n');
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    failures.push(
      `${rel}: rewritten by a generator script (first change at line ${i + 1})\n` +
      `    committed: ${(a[i] ?? '(end of file)').trim().slice(0, 150)}\n` +
      `    generated: ${(b[i] ?? '(end of file)').trim().slice(0, 150)}`
    );
  }
  for (const rel of after.keys()) {
    if (!before.has(rel)) failures.push(`${rel}: created by a generator script`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

if (failures.length) {
  console.error(
    `Generator scripts rewrite ${failures.length} committed page(s). ` +
    'A generator must format, not decide content:\n\n' + failures.slice(0, 12).join('\n\n') +
    (failures.length > 12 ? `\n\n… and ${failures.length - 12} more.` : '')
  );
  process.exit(1);
}
console.log('Generator idempotency audit passed: `integrate:unified-design` and every script in scripts/ leave all committed pages byte-identical.');
