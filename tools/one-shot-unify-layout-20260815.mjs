import fs from 'node:fs';

const cssPath = 'assets/css/site.css';
const overridePath = 'assets/css/layout-unification-20260815.css';
const runtimePath = 'assets/js/responsive-header-system.js';
const workflowPath = '.github/workflows/one-shot-unify-layout-20260815.yml';
const selfPath = 'tools/one-shot-unify-layout-20260815.mjs';
const markerStart = '/* STAGE143B-UNIFIED-EDITORIAL-AXIS:START */';
const markerEnd = '/* STAGE143B-UNIFIED-EDITORIAL-AXIS:END */';

const css = fs.readFileSync(cssPath, 'utf8');
const override = fs.readFileSync(overridePath, 'utf8').trim();
if (css.includes(markerStart) || css.includes(markerEnd)) {
  throw new Error('Unified editorial-axis block already exists in site.css');
}
fs.writeFileSync(cssPath, `${css.trimEnd()}\n\n${markerStart}\n${override}\n${markerEnd}\n`);

let runtime = fs.readFileSync(runtimePath, 'utf8');
runtime = runtime.replace(/\n  \/\* STAGE143-LAYOUT-UNIFICATION[\s\S]*?document\.head\.appendChild\(layoutLink\);\n  \}\n/, '\n');
runtime = runtime.replace('/* CLEAN-AUTHORITY: core presentation is in /assets/css/site.css. */', '/* CLEAN-AUTHORITY: all presentation is in /assets/css/site.css. */');
if (runtime.includes('layout-unification-20260815.css') || runtime.includes('STAGE143-LAYOUT-UNIFICATION')) {
  throw new Error('Runtime stylesheet injection cleanup failed');
}
fs.writeFileSync(runtimePath, runtime);

fs.unlinkSync(overridePath);
if (fs.existsSync(workflowPath)) fs.unlinkSync(workflowPath);
if (fs.existsSync(selfPath)) fs.unlinkSync(selfPath);

console.log('Unified layout contract consolidated into site.css; temporary runtime injection and one-shot files removed.');
