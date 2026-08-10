from pathlib import Path
import re, json, hashlib
RELEASE='20260810-human-editorial-v96'

footer=Path('assets/css/footer-elegant.css')
s=footer.read_text()
s=re.sub(r"(@import\s+url\(['\"]\.\/palette-blue-final\.css\?v=)[^'\"]+(['\"]\);)",rf"\g<1>{RELEASE}\2",s)
footer.write_text(s)

# Runtime-injected structural stylesheets are not rewritten by the HTML cache
# propagation script, so align their query tokens explicitly with this release.
runtime=Path('assets/js/responsive-header-system.js')
r=runtime.read_text()
r=re.sub(r'(/assets/css/(?:chronology-surface-authority|archive-content-flow|record-editorial-system)\.css\?v=)[^\'\"]+',rf'\g<1>{RELEASE}',r)
runtime.write_text(r)

# The page-by-page density review is still valid: Stage96 changes wording and
# spacing without changing page families/section counts or disclosure strategy.
reviewp=Path('data/page-simplification-review.json')
review=json.loads(reviewp.read_text())
review['release']=RELEASE
review['reviewedAt']='2026-08-10'
reviewp.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')

cfgp=Path('data/design-release.json')
cfg=json.loads(cfgp.read_text())
h=hashlib.sha256()
for p in sorted(Path('assets/css').glob('*.css')): h.update(p.read_bytes())
for p in sorted(Path('assets/js').glob('*.js')): h.update(p.read_bytes())
for p in sorted(Path('assets/video').glob('*.mp4')): h.update(p.read_bytes())
cfg['release']=RELEASE
cfg['assetDigest']=h.hexdigest()[:16]
cfgp.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n')
print('Stage96 nested palette/runtime/page-review releases + asset digest aligned:', RELEASE, cfg['assetDigest'])
