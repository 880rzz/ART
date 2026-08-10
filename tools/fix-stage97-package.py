from pathlib import Path
import json
p=Path('package.json')
obj=json.loads(p.read_text(encoding='utf-8'))
s=obj.setdefault('scripts',{})
# Remove the accidental empty audit chain and attach Stage97 to the repository's real test chain.
if s.get('audit','').lstrip().startswith('&& node tests/audit-layout-anchor-stage97.mjs'):
    s.pop('audit',None)
cmd=s.get('test','')
if 'audit-layout-anchor-stage97.mjs' not in cmd:
    s['test']=cmd+' && node tests/audit-layout-anchor-stage97.mjs'
s['test:layout-anchor']='node tests/audit-layout-anchor-stage97.mjs'
s.pop('audit:layout-anchor',None)
p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
