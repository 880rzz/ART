from pathlib import Path
import re
RELEASE='20260810-human-editorial-v96'
footer=Path('assets/css/footer-elegant.css')
s=footer.read_text()
s=re.sub(r"(@import\s+url\(['\"]\.\/palette-blue-final\.css\?v=)[^'\"]+(['\"]\);)",rf"\g<1>{RELEASE}\2",s)
footer.write_text(s)
print('Stage96 nested palette release aligned:', RELEASE)
