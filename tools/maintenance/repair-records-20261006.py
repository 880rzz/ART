"""One-off bounded repair; data facts come from existing full page text and periods."""
from pathlib import Path
import json,re,html,datetime,hashlib,collections,urllib.parse
from zoneinfo import ZoneInfo
ROOT=Path.cwd()
UPDATES=json.loads(Path('tools/maintenance/record-summary-edits-20261006.json').read_text())
PERIODS=json.loads((ROOT/'data/archive/oeuvre-periods.json').read_text())
P={p['numeral']:p for p in PERIODS['periods']}
regpath=ROOT/'archive-record-registry.json'; registry=json.loads(regpath.read_text())
today=datetime.datetime.now(ZoneInfo('Europe/Vienna')).date().isoformat()
changes=[]; period_fixes=[]; period_title_fixes=[]; synopsis_fixes=[]; repaired_targets=0

def text(s):return html.unescape(re.sub('<[^>]*>','',s)).strip()
def block(h,name):
 m=re.search('<!-- '+name+':START -->(.*?)<!-- '+name+':END -->',h,re.S);assert m,name;return m

def head_metadata(h,url):
 def fix(m):
  data=json.loads(m[1]); touched=False
  def walk(x):
   nonlocal touched
   if isinstance(x,list):
    for a in x:walk(a)
   elif isinstance(x,dict):
    types=x.get('@type',[]);types=types if isinstance(types,list) else [types]
    if x.get('url')==url and 'dateModified' in x and set(types)&{'WebPage','CollectionPage','AboutPage'}:
     x['dateModified']=today;touched=True
    for a in x.values():walk(a)
  walk(data)
  return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'</script>' if touched else m[0]
 return re.sub('<script type="application/ld\\+json">([\\s\\S]*?)</script>',fix,h)

for r in registry['records']:
 url=r['canonicalUrl']; rel=urllib.parse.unquote(urllib.parse.urlsplit(url).path.lstrip('/'));p=ROOT/rel
 before=p.read_text();after=before; depth=block(after,'RECORD-DEPTH'); body=depth[1]
 lang='hu' if rel.startswith('hu/') else 'de' if rel.startswith('de-at/') else 'en'
 numeral=re.search('record-period__no">([^<]*)<',body)[1].strip();period=P[numeral]
 title_match=re.search(r'(record-period__title">)([^<]*)(<)',body);assert title_match,rel
 expected_title=period['title'][lang]
 if text(title_match[2])!=expected_title:
  old_title_value=text(title_match[2])
  body=body[:title_match.start(2)]+html.escape(expected_title,quote=False)+body[title_match.end(2):]
  after=after[:depth.start(1)]+body+after[depth.end(1):]
  period_title_fixes.append({'file':rel,'before':old_title_value,'after':expected_title})
 if r['presenceResearchPeriod']!=numeral:
  old=r['presenceResearchPeriod'];r['presenceResearchPeriod']=numeral
  m=block(after,'RECORD-RELATIONSHIPS');section=m[1]
  head=re.search('<div class="record-context-head">(.*?)</div>',section,re.S);assert head,rel
  h=head[1];prev_label=re.search('<p class="label">(.*?)</p>',h,re.S);prev_title=re.search('<h2[^>]*>(.*?)</h2>',h,re.S);assert prev_label and prev_title,rel
  assert text(prev_label[1]).endswith(' '+old),(rel,prev_label[1],old)
  old_title=prev_title[1];new_title=html.escape(period['title'][lang],quote=False)
  h=h.replace(prev_label[0],'<p class="label">'+html.escape(PERIODS['labels']['periodEyebrow'][lang],quote=False)+' \u00b7 '+numeral+'</p>',1)
  h=h.replace(prev_title[0],prev_title[0].replace(old_title,new_title),1)
  section=section.replace(head[0],'<div class="record-context-head">'+h+'</div>',1)
  section=section.replace('<span>'+old_title+'</span>','<span>'+new_title+'</span>')
  after=after[:m.start(1)]+section+after[m.end(1):]
  period_fixes.append({'file':rel,'before':old,'after':numeral,'authority':'data/archive/oeuvre-periods.json and the existing RECORD-DEPTH year/range/anchor'})
 if rel in UPDATES:
  m=block(after,'RECORD-DEPTH');section=m[1]
  head=re.search('<div class="record-depth-head">(.*?)</div>',section,re.S);assert head,rel
  paras=list(re.finditer('<p>(.*?)</p>',head[1],re.S));assert len(paras)==1,rel
  old=paras[0][1];assert re.search(r'(\u2026|\.{3}|\bwhat\.|\band\.|\bthe\.)$',text(old)),(rel,old)
  fixed=head[1].replace(paras[0][0],'<p>'+html.escape(UPDATES[rel],quote=False)+'</p>',1)
  section=section.replace(head[0],'<div class="record-depth-head">'+fixed+'</div>',1)
  after=after[:m.start(1)]+section+after[m.end(1):]
  r['description']=UPDATES[rel]
  synopsis_fixes.append({'file':rel,'before':text(old),'after':UPDATES[rel],'basis':'Existing full introduction, header and bibliographic or historical record on this same page. No new dates, places or credits.'})
 refs=[]
 for ref in r.get('relatedRecords',[]):
  if ref.endswith('/#presence-periods'):
   ref=ref.replace('#presence-periods','#journey');repaired_targets+=1
  refs.append(ref)
 r['relatedRecords']=refs
 if after!=before:
  after=head_metadata(after,url)
  assert collections.Counter(re.findall('href="([^"]+)"',before))==collections.Counter(re.findall('href="([^"]+)"',after)),rel+' lost/changed visible links'
  assert re.findall('<img[^>]*>',before)==re.findall('<img[^>]*>',after),rel+' changed images'
  for tag in ['canonical','alternate']:
   assert re.findall('<link[^>]*rel="'+tag+'"[^>]*>',before)==re.findall('<link[^>]*rel="'+tag+'"[^>]*>',after),rel+' changed canonical/alternate'
  p.write_text(after)
  changes.append({'file':rel,'url':url,'beforeSha256':hashlib.sha256(before.encode()).hexdigest(),'afterSha256':hashlib.sha256(after.encode()).hexdigest(),'scope':'period relationship and/or completion of an identified truncated record summary; not complete editorial approval'})
assert len(period_fixes)==36,len(period_fixes)
assert len(synopsis_fixes)==21,len(synopsis_fixes)
assert repaired_targets==69,repaired_targets
regpath.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
sitemap=ROOT/'sitemap.xml';s=sitemap.read_text();changed={r['url'] for r in changes};count=0

def datefix(m):
 global count
 loc=re.search('<loc>([^<]+)</loc>',m[1])[1]
 if loc not in changed:return m[0]
 count+=1;return '<url>'+re.sub('<lastmod>[^<]+</lastmod>','<lastmod>'+today+'</lastmod>',m[1])+'</url>'
s=re.sub('<url>([\\s\\S]*?)</url>',datefix,s);assert count==len(changes),(count,len(changes));sitemap.write_text(s)
report={'sourceBaseline':'3469d941c03128b8195d05aa91d96711d26fdd65','auditBaseline':'5703c535881d893eb566edefd34e91b3bede0182','status':'source repaired; not production verified','recordCount':len(registry['records']),'changedContentPages':len(changes),'periodFixes':period_fixes,'periodTitleFixes':period_title_fixes,'completedSummaries':synopsis_fixes,'repairedMachineFragmentTargets':repaired_targets,'pages':changes,'preserved':['all visible href values and counts','canonical and hreflang','all images','full main narrative outside the identified record blocks','consent behavior','entity IDs and historical event boundaries'],'limitations':['This is a bounded record-consistency repair, not the full 84-page human-first rewrite.','Existing source availability and wider historical claims still require source-critical review.','Press restructuring, comprehensive recovered-source integration and original-site Wayback comparison remain separate work.']}
(ROOT/'docs/record-period-consistency-20261006.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
audit=ROOT/'tools/audit_record_depth.py';s=audit.read_text();anchor='if errors:\n';assert s.count(anchor)==1
extension=(ROOT/'tools/maintenance/record-audit-extension-20261006.py').read_text()
audit.write_text(s.replace(anchor,extension+'\n'+anchor))
print(json.dumps({k:report[k] for k in ('recordCount','changedContentPages','repairedMachineFragmentTargets')}));print('Period assignments:',len(period_fixes),'Completed summaries:',len(synopsis_fixes))
