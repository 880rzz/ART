#!/usr/bin/env python3
"""
CERIDWEN ÜSTJE · TELJES OLDAL KONTRASZT-SÖPRÉS
Minden szöveges elemre kiszámolja a CSS-kaszkád tényleges győztesét
(color + effektív háttér az ős-láncon), és jelzi, ha a kontraszt < 4.5:1.
Futtatás:  python3 audit/contrast-sweep.py [projekt-gyökér]
Függőségek: tinycss2, lxml, cssselect
"""
import re, sys, pathlib
import tinycss2
from lxml import html as lhtml
from cssselect import GenericTranslator

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
PAGES = ['index.html', 'index-en.html', 'yes-no.html', 'yes-no-en.html']
VIEWPORTS = [int(x) for x in (sys.argv[2].split(',') if len(sys.argv)>2 else ['320','375','390','414','768','1024','1440','1920'])]
THRESHOLD = 4.5

def hex_of(v):
    v = v.strip().lower()
    m = re.match(r'#([0-9a-f]{6})\b', v)
    if m: return m.group(1), 1.0
    m = re.match(r'#([0-9a-f]{3})\b', v)
    if m: return ''.join(c*2 for c in m.group(1)), 1.0
    m = re.match(r'rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[,/ ]+([\d.]+))?\)', v)
    if m:
        r,g,b=(int(m.group(i)) for i in (1,2,3)); a=float(m.group(4)) if m.group(4) else 1.0
        return f'{r:02x}{g:02x}{b:02x}', a
    if v.startswith('white'): return 'ffffff',1.0
    if v.startswith('black'): return '000000',1.0
    return None, 0.0

def lum(h):
    r,g,b=(int(h[i:i+2],16)/255 for i in (0,2,4))
    f=lambda c: c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
    return .2126*f(r)+.7152*f(g)+.0722*f(b)

def contrast(a,b):
    l1,l2=sorted((lum(a),lum(b)),reverse=True); return (l1+.05)/(l2+.05)

def blend(fg,a,bg):
    f=[int(fg[i:i+2],16) for i in (0,2,4)]; g=[int(bg[i:i+2],16) for i in (0,2,4)]
    return ''.join(f'{round(f[i]*a+g[i]*(1-a)):02x}' for i in range(3))

def bg_color_of(value, under):
    colors=re.findall(r'#[0-9a-f]{3,6}\b|rgba?\([^)]*\)', value.lower())
    solids=[]
    for c in colors:
        h,a=hex_of(c)
        if h is None: continue
        solids.append(blend(h,a,under))
    if not solids: return None
    solids.sort(key=lum)
    return solids[len(solids)//2]

class Cascade:
    def __init__(self, root, viewport):
        self.vp=viewport; self.rules=[]
        for origin,f in enumerate(['assets/css/app.css','assets/css/theme-celtic.css']):
            self._parse((root/f).read_text(), origin)
        self.vars={}
        for sel,decls,_o in self.rules:
            if ':root' in sel:
                for p,(v,_) in decls.items():
                    if p.startswith('--'): self.vars[p]=v
        self.tr=GenericTranslator()
    def _media_ok(self,prelude):
        s=prelude.lower()
        if any(k in s for k in ('print','prefers-','hover:')): return False
        mw=re.search(r'max-width:\s*(\d+)',s)
        if mw and self.vp>int(mw.group(1)): return False
        mn=re.search(r'min-width:\s*(\d+)',s)
        if mn and self.vp<int(mn.group(1)): return False
        return True
    def _parse(self,text,origin):
        for rule in tinycss2.parse_stylesheet(text,skip_whitespace=True,skip_comments=True):
            if rule.type=='qualified-rule':
                sel=tinycss2.serialize(rule.prelude).strip()
                body=tinycss2.serialize(rule.content); decls={}
                for m in re.finditer(r'(?:^|;)\s*([\w-]+)\s*:\s*([^;]+)',body):
                    decls[m.group(1).strip()]=(m.group(2).replace('!important','').strip(),'!important' in m.group(2))
                self.rules.append((sel,decls,origin))
            elif rule.type=='at-rule' and rule.lower_at_keyword=='media' and rule.content is not None:
                if self._media_ok(tinycss2.serialize(rule.prelude)):
                    self._parse(tinycss2.serialize(rule.content),origin)
    @staticmethod
    def _spec(sel):
        s=re.sub(r'::?[a-z-]+(\([^)]*\))?','',sel)
        return (len(re.findall(r'#[\w-]+',s)),len(re.findall(r'\.[\w-]+|\[[^\]]*\]',s)),
                len(re.findall(r'(?:^|[\s>+~])([a-z][\w-]*)',s)))
    def attach(self,doc):
        self.doc=doc; self.match_cache={}
    def _matches(self,el,base):
        if base not in self.match_cache:
            try: self.match_cache[base]=set(self.doc.xpath(self.tr.css_to_xpath(base)))
            except Exception: self.match_cache[base]=set()
        return el in self.match_cache[base]
    def winner(self,el,prop):
        best=None
        for order,(sel,decls,origin) in enumerate(self.rules):
            if prop not in decls: continue
            for part in sel.split(','):
                part=part.strip()
                if re.search(r'::?(before|after|hover|focus|placeholder|selection|disabled)',part): continue
                base=re.sub(r'::?[a-z-]+(\([^)]*\))?','',part).strip()
                if not base: continue
                if not self._matches(el,base): continue
                val,imp=decls[prop]
                key=(imp,origin,self._spec(base),order)
                if best is None or key>=best[0]: best=(key,val,part)
        return best
    def resolve(self,v):
        for _ in range(5):
            v2=re.sub(r'var\((--[\w-]+)(?:,[^)]*)?\)',lambda m:self.vars.get(m.group(1),''),v)
            if v2==v: break
            v=v2
        return v

def effective_bg(c,el,page_bg):
    cur=el; stack=[]
    while cur is not None and isinstance(getattr(cur,'tag',None),str):
        for prop in ('background','background-color'):
            w=c.winner(cur,prop)
            if w:
                val=c.resolve(w[1])
                if val and val not in ('transparent','none','inherit'):
                    stack.append(val); break
        cur=cur.getparent()
    under=page_bg
    for val in reversed(stack):
        got=bg_color_of(val,under)
        if got: under=got
    return under

def main():
    total=0
    for page in PAGES:
        if not (ROOT/page).exists(): continue
        for vp in VIEWPORTS:
            c=Cascade(ROOT,vp)
            doc=lhtml.parse(str(ROOT/page)).getroot()
            c.attach(doc)
            body=doc.xpath('//body')[0]
            w=c.winner(body,'background')
            page_bg=bg_color_of(c.resolve(w[1]),'07110d') if w else '07110d'
            bad=0
            for el in doc.iter():
                if not isinstance(el.tag,str): continue
                if el.tag in ('script','style','head','meta','link','title','svg','path','circle',
                              'g','defs','noscript','br','html','text'): continue
                text=(el.text or '').strip()
                if not text or len(text)<2: continue
                cw=c.winner(el,'color'); cur=el
                while cw is None and cur is not None:
                    cur=cur.getparent()
                    if cur is not None and isinstance(cur.tag,str): cw=c.winner(cur,'color')
                if not cw: continue
                h,_a=hex_of(c.resolve(cw[1]))
                if not h: continue
                bg=effective_bg(c,el,page_bg)
                ratio=contrast(h,bg)
                if ratio<THRESHOLD:
                    bad+=1; total+=1
                    ident=(el.get('class') or el.get('id') or '')[:36]
                    print(f"  ROSSZ {page}@{vp} [{cw[2][:56]}] #{h}/#{bg} {ratio:.2f}")
            if bad==0: print(f'  TISZTA {page}@{vp}px')
    print(f'ÖSSZES KONTRASZTHIBA: {total}')
    sys.exit(1 if total else 0)

main()
