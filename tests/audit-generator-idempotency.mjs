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

  const after = await collect(work, work);

  for (const [rel, original] of before) {
    const updated = after.get(rel);
    if (updated === undefined) { failures.push(`${rel}: deleted by the generator chain`); continue; }
    if (updated === original) continue;

    /* Report the first differing line so the offending script is obvious. */
    const a = original.split('\n');
    const b = updated.split('\n');
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    failures.push(
      `${rel}: rewritten by the generator chain (first change at line ${i + 1})\n` +
      `    committed: ${(a[i] ?? '(end of file)').trim().slice(0, 150)}\n` +
      `    generated: ${(b[i] ?? '(end of file)').trim().slice(0, 150)}`
    );
  }
  for (const rel of after.keys()) {
    if (!before.has(rel)) failures.push(`${rel}: created by the generator chain`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

if (failures.length) {
  console.error(
    `The generator chain rewrites ${failures.length} committed page(s). ` +
    'A generator must format, not decide content:\n\n' + failures.slice(0, 12).join('\n\n') +
    (failures.length > 12 ? `\n\n… and ${failures.length - 12} more.` : '')
  );
  process.exit(1);
}
console.log('Generator idempotency audit passed: `integrate:unified-design` leaves every committed page byte-identical.');
