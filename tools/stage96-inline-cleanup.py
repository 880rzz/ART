from pathlib import Path
import re, hashlib

ROOT=Path('.')
CSS=ROOT/'assets/css/homepage-two-tone-authority.css'

# One last exact human-language cleanup that appears in a second Hungarian
# curatorial passage beyond the sentence already rewritten by the main pass.
hu=ROOT/'hu/curators.html'
s=hu.read_text()
s=s.replace('A kérdés az lett, hogyan maradhat emberi és hiteles egy mű',
            'Ebben az időszakban azt kerestem, hogyan őrizheti meg a mű az emberi hitelességét')
hu.write_text(s)

layout_props=re.compile(r'^(font-size|line-height|letter-spacing|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|max-width|width|white-space|border-bottom)$',re.I)
utilities={}

def add_class(tag, cls):
    m=re.search(r'class=("[^"]*"|\'[^\']*\')',tag,re.I)
    if m:
        q=m.group(1)[0]
        classes=m.group(1)[1:-1].split()
        if cls not in classes: classes.append(cls)
        return tag[:m.start()]+f'class={q}{" ".join(classes)}{q}'+tag[m.end():]
    return tag[:-1]+f' class="{cls}">'

def transform_tag(m):
    tag=m.group(0)
    sm=re.search(r'\sstyle=("[^"]*"|\'[^\']*\')',tag,re.I)
    if not sm: return tag
    raw=sm.group(1)[1:-1]
    moved=[]; kept=[]
    for decl in [d.strip() for d in raw.split(';') if d.strip()]:
        if ':' not in decl:
            kept.append(decl); continue
        prop,val=decl.split(':',1)
        prop=prop.strip().lower(); val=val.strip()
        if layout_props.match(prop): moved.append((prop,val))
        else: kept.append(decl)
    if not moved: return tag
    signature=';'.join(f'{p}:{v}' for p,v in moved)
    cls='u96-'+hashlib.sha1(signature.encode()).hexdigest()[:8]
    utilities[cls]=moved
    replacement=(' style="'+';'.join(kept)+'"') if kept else ''
    tag=tag[:sm.start()]+replacement+tag[sm.end():]
    return add_class(tag,cls)

count=0
for p in ROOT.rglob('*.html'):
    if any(x in p.parts for x in ('.git','node_modules','reports')): continue
    text=p.read_text(errors='ignore')
    if not re.search(r'<body\b[^>]*class=["\'][^"\']*apple-archive',text,re.I): continue
    if not re.search(r'<main\b',text,re.I) or not re.search(r'<footer\b',text,re.I): continue
    updated=re.sub(r'<[a-zA-Z][^<>]*>',transform_tag,text)
    if updated!=text:
        p.write_text(updated)
        count+=1

css=CSS.read_text()
start='/* STAGE96-CENTRALIZED-INLINE-RHYTHM:START */'
end='/* STAGE96-CENTRALIZED-INLINE-RHYTHM:END */'
block=[start,
'/* Legacy page-level spacing/type values are retained only where they carry\n   genuine editorial meaning, but are now centralized in the final authority.\n   No page can bypass the shared Apple-like cascade with inline typography. */']
for cls,moved in sorted(utilities.items()):
    decl=';'.join(f'{p}:{v}!important' if '!important' not in v else f'{p}:{v}' for p,v in moved)
    block.append(f'html body.apple-archive.apple-archive.apple-archive.apple-archive .{cls}{{{decl}}}')
block.append(end)
chunk='\n'.join(block)
if start in css:
    css=re.sub(re.escape(start)+r'[\s\S]*?'+re.escape(end),chunk,css)
else:
    css += '\n\n'+chunk+'\n'
CSS.write_text(css)
print(f'Stage96 centralized inline rhythm on {count} pages into {len(utilities)} reusable authority classes.')
