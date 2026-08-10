from pathlib import Path
import re, json, hashlib
RELEASE='20260810-human-editorial-v96'
footer=Path('assets/css/footer-elegant.css')
s=footer.read_text()
s=re.sub(r"(@import\s+url\(['\"]\.\/palette-blue-final\.css\?v=)[^'\"]+(['\"]\);)",rf"\g<1>{RELEASE}\2",s)
footer.write_text(s)

cfgp=Path('data/design-release.json')
cfg=json.loads(cfgp.read_text())
h=hashlib.sha256()
for p in sorted(Path('assets/css').glob('*.css')): h.update(p.read_bytes())
for p in sorted(Path('assets/js').glob('*.js')): h.update(p.read_bytes())
for p in sorted(Path('assets/video').glob('*.mp4')): h.update(p.read_bytes())
cfg['release']=RELEASE
cfg['assetDigest']=h.hexdigest()[:16]
cfgp.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n')
print('Stage96 nested palette release + asset digest aligned:', RELEASE, cfg['assetDigest'])
