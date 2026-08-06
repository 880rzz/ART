import { readFileSync } from 'node:fs';

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const workflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const requiredWorkflowFragments = [
  'name: Deploy production archive to GitHub Pages',
  'branches: [main]',
  'workflow_dispatch:',
  'contents: read',
  'pages: write',
  'id-token: write',
  'cancel-in-progress: false',
  'run: npm test',
  'git ls-files -z',
  'rsync -a --from0 --files-from=- ./ _site/',
  '_site/.github',
  '_site/tests',
  '_site/tools',
  '_site/scripts',
  '_site/docs',
  '_site/node_modules',
  'index.html',
  'hu/index.html',
  'de-at/index.html',
  'CNAME',
  'sitemap.xml',
  'robots.txt',
  '_redirects',
  'ai.txt',
  'llms.txt',
  'archive-record-registry.json',
  'artistic-presence-context.json',
  'assets/css/museum-editorial.css',
  "grep -Fxq 'www.banhalmi.art' _site/CNAME",
  'actions/configure-pages@v5',
  'actions/upload-pages-artifact@v4',
  'actions/deploy-pages@v5',
  'timeout: 1800000'
];

for (const fragment of requiredWorkflowFragments) {
  assert(workflow.includes(fragment), `Pages workflow contract missing: ${fragment}`);
}

assert(!/contents:\s*write/i.test(workflow), 'Pages workflow must not receive contents: write permission');
assert(!/git\s+push/i.test(workflow), 'Pages workflow must not push to the repository');
assert(!/git\s+commit/i.test(workflow), 'Pages workflow must not commit to the repository');
assert(!/cancel-in-progress:\s*true/i.test(workflow), 'An active production deployment must not be cancelled by a newer run');

const testCommand = pkg.scripts?.test || '';
assert(
  testCommand.includes('node tests/audit-pages-workflow-stage3.mjs'),
  'The permanent npm test chain must include the Pages workflow audit'
);
assert(
  pkg.scripts?.['test:pages-workflow'] === 'node tests/audit-pages-workflow-stage3.mjs',
  'The focused Pages workflow audit command is missing or incorrect'
);

if (failures.length) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Stage 3 Pages workflow audit passed: publishing is read-only, bounded and resilient.');
