import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const workflowFile = '.github/workflows/pages.yml';
const clientFile = 'tools/deploy-pages-api.mjs';
const workflow = readFileSync(workflowFile, 'utf8');
const client = readFileSync(clientFile, 'utf8');
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
  'outputs:\n      artifact_id:',
  'id: upload',
  'steps.upload.outputs.artifact_id',
  'actions/configure-pages@v5',
  'actions/upload-pages-artifact@v4',
  'timeout-minutes: 50',
  'PAGES_ARTIFACT_ID: ${{ needs.build.outputs.artifact_id }}',
  "PAGES_POLL_INTERVAL_MS: '10000'",
  "PAGES_POLL_TIMEOUT_MS: '2700000'",
  'run: node tools/deploy-pages-api.mjs'
];

for (const fragment of requiredWorkflowFragments) {
  assert(workflow.includes(fragment), `Pages workflow contract missing: ${fragment}`);
}

for (const fragment of [
  'ACTIONS_ID_TOKEN_REQUEST_URL',
  'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
  '/pages/deployments',
  'artifact_id: artifactId',
  'const buildVersion = sha;',
  'pages_build_version: buildVersion',
  'oidc_token: oidcToken',
  "currentStatus === 'succeed'",
  'PAGES_POLL_TIMEOUT_MS',
  'The deployment was intentionally left active and was not cancelled.'
]) {
  assert(client.includes(fragment), `Pages API client contract missing: ${fragment}`);
}

const syntaxCheck = spawnSync(process.execPath, ['--check', clientFile], { encoding: 'utf8' });
assert(
  syntaxCheck.status === 0,
  `Pages API client syntax check failed: ${syntaxCheck.stderr || syntaxCheck.stdout}`
);

assert(!client.includes('`${sha}-${runId}-${runAttempt}`'), 'Pages build version must be the real commit SHA');
assert(!/contents:\s*write/i.test(workflow), 'Pages workflow must not receive contents: write permission');
assert(!/git\s+push/i.test(workflow), 'Pages workflow must not push to the repository');
assert(!/git\s+commit/i.test(workflow), 'Pages workflow must not commit to the repository');
assert(!/cancel-in-progress:\s*true/i.test(workflow), 'An active production deployment must not be cancelled by a newer run');
assert(!workflow.includes('actions/deploy-pages@'), 'The hard-capped deploy-pages action must not be used');
assert(!client.includes('/cancel'), 'The Pages cancellation endpoint is forbidden');

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

console.log('Stage 3 Pages API workflow audit passed: publishing is SHA-bound, read-only and non-cancelling.');
