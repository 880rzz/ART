import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const skip=new Set(['.git','node_modules','.github']);
const allowedExt=new Set(['.css','.html','.webmanifest']);

function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(e.name))continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()){walk(full);continue;}
    if(!allowedExt.has(path.extname(e.name)) && e.name!=='site.webmanifest')continue;
    let s=fs.readFileSync(full,'utf8');
    const before=s;
    s=s.replace(/#252525/gi,'#29303F').replace(/#1d1912/gi,'#2D3444');
    if(s!==before)fs.writeFileSync(full,s);
  }
}
walk(root);

// The curatorial audit must protect the canonical blue gradient, never the retired black/brown one.
const curPath=path.join(root,'tests/audit-curatorial-template-system.mjs');
let cur=fs.readFileSync(curPath,'utf8');
cur=cur.replace('linear-gradient(135deg,#111 0%,#252525 62%,#1d1912 100%)','linear-gradient(135deg,#202530 0%,#29303F 62%,#2D3444 100%)');
fs.writeFileSync(curPath,cur);

// Strengthen the new Stage 42 guard to forbid the two values found by the first migration audit.
const stagePath=path.join(root,'tests/audit-apple-surface-video-stage42.mjs');
let stage=fs.readFileSync(stagePath,'utf8');
if(!stage.includes("'#252525'"))stage=stage.replace("'#242424','#3c3c3c'","'#242424','#252525','#1d1912','#3c3c3c'");
fs.writeFileSync(stagePath,stage);

// Recompute the guarded release digest after this final surface correction.
const cfgPath=path.join(root,'data/design-release.json');
const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8'));
const hash=crypto.createHash('sha256');
for(const name of fs.readdirSync(path.join(root,'assets/css')).filter(x=>x.endsWith('.css')).sort())hash.update(fs.readFileSync(path.join(root,'assets/css',name)));
for(const name of fs.readdirSync(path.join(root,'assets/js')).filter(x=>x.endsWith('.js')).sort())hash.update(fs.readFileSync(path.join(root,'assets/js',name)));
for(const name of fs.readdirSync(path.join(root,'assets/video')).filter(x=>x.endsWith('.mp4')).sort())hash.update(fs.readFileSync(path.join(root,'assets/video',name)));
cfg.assetDigest=hash.digest('hex').slice(0,16);
fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2)+'\n');
execFileSync('npm',['run','bump:release'],{cwd:root,stdio:'inherit'});

// One-time follow-up is not production code.
fs.rmSync(import.meta.filename);
console.log('Stage 42 follow-up complete: remaining legacy curatorial surfaces removed.');
