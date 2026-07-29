#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

PAGES = {
    'index.html': {
        'label': 'A life in photographs',
        'heading': 'The question behind the work',
        'lead': 'I have been photographing since 1999. The subjects have changed, but the question behind the work has not: when does someone stop performing and become genuinely present?',
        'body': [
            'I was born in Budapest in 1979. Today I live and work between Vienna and Budapest. I did not arrive at photography by a straight road. I studied engineering, worked in communication and events, and founded the photo studio of the Hungarian Defence Forces. Each of those places taught me something about discipline, responsibility and the difference between appearance and truth.',
            'For a long time I treated photography as one role among many. Then an accident in Greece brought everything into focus. I did not know whether I would keep the sight in one eye, and in that uncertainty I understood that I no longer wanted to collect positions. I wanted to make the work I would still recognise as my own years later. Since then photography has not been an occupation beside my life. It has been the way I pay attention.',
            'The people in these photographs are not illustrations of an idea. They are the reason the idea exists. Women rebuilding themselves after illness, fathers learning a different kind of strength, dancers between discipline and freedom, communities carrying memory across borders: I am interested in the moment when the role falls away and the person remains.',
            'That same attention continues in my books, exhibitions, teaching and community work. I do not see these as separate careers. They are different forms of the same practice: creating enough space for someone, a memory or a community to become visible without being simplified.'
        ],
        'recognition': 'Recognition','education': 'Education','verified': 'Verified biography — Wikipedia','community': 'Community & teaching','writing': 'Writing & ambassadorship','press': 'Press','curators': 'For curators: the full dossier','hero_label': 'The investigation of presence · Since 1999','hero_sub': 'Fine art photography between Vienna and Budapest','menu_about': 'The investigation of presence','menu_about_desc': 'Where the work comes from, and why the investigation of presence has remained at its centre since 1999.','footer_role': 'Fine Art Photographer',
    },
    'hu/index.html': {
        'label': 'Egy élet képekben',
        'heading': 'A kérdés, amely végigkíséri a munkát',
        'lead': '1999 óta fényképezek. A témák változtak, de a kérdés nem: mikor szűnik meg valaki szerepet játszani, és mikor válik valóban jelenvalóvá?',
        'body': [
            '1979-ben születtem Budapesten. Ma Bécs és Budapest között élek és dolgozom. Nem egyenes úton jutottam el a fotográfiához. Mérnöknek tanultam, kommunikációval és rendezvényekkel foglalkoztam, majd létrehoztam a Magyar Honvédség fotóstúdióját. Mindegyik közeg megtanított valamire a fegyelemről, a felelősségről, és arról, milyen nagy különbség van a megjelenés és az igazság között.',
            'Sokáig a fotográfiára is úgy tekintettem, mint egy szerepre a sok közül. Egy görögországi baleset után ez megváltozott. Nem tudtam, megmarad-e az egyik szemem látása, és ebben a bizonytalanságban értettem meg, hogy nem akarok tovább pozíciókat gyűjteni. Olyan munkát akarok létrehozni, amelyet évekkel később is a sajátomnak érzek. Azóta a fotográfia nem egy foglalkozás az életem mellett. Ez az a mód, ahogyan figyelek.',
            'A képeimen szereplő emberek nem egy gondolat illusztrációi. Ők azok, akik miatt a gondolat egyáltalán megszületik. Betegség után újraépülő nők, másfajta erőt tanuló apák, fegyelem és szabadság között élő táncosok, határokon át emlékezetet őrző közösségek. Az a pillanat érdekel, amikor a szerep leomlik, és az ember ott marad.',
            'Ugyanez a figyelem folytatódik a könyveimben, a kiállításaimban, az oktatásban és a közösségi munkában. Nem különálló pályáknak látom ezeket. Ugyanannak a gyakorlatnak a különböző formái: elég teret adni ahhoz, hogy egy ember, egy emlék vagy egy közösség leegyszerűsítés nélkül váljon láthatóvá.'
        ],
        'recognition': 'Elismerések','education': 'Tanulmányok','verified': 'Ellenőrzött életrajz — Wikipédia','community': 'Közösség és oktatás','writing': 'Írások és márkanagyköveti munka','press': 'Sajtó','curators': 'Kurátoroknak: teljes dosszié','hero_label': 'A jelenlét kutatása · 1999 óta','hero_sub': 'Fotóművészet Bécs és Budapest között','menu_about': 'A jelenlét kutatása','menu_about_desc': 'Honnan ered a munka, és miért maradt 1999 óta a jelenlét kutatása a középpontjában.','footer_role': 'Fotóművész',
    },
    'de-at/index.html': {
        'label': 'Ein Leben in Bildern',
        'heading': 'Die Frage hinter der Arbeit',
        'lead': 'Ich fotografiere seit 1999. Die Themen haben sich verändert, die Frage dahinter nicht: Wann hört ein Mensch auf, eine Rolle zu spielen, und wird wirklich gegenwärtig?',
        'body': [
            'Ich wurde 1979 in Budapest geboren und lebe und arbeite heute zwischen Wien und Budapest. Mein Weg zur Fotografie war nicht geradlinig. Ich studierte Ingenieurwesen, arbeitete in Kommunikation und Veranstaltungen und gründete später das Fotostudio der Ungarischen Streitkräfte. Jeder dieser Orte lehrte mich etwas über Disziplin, Verantwortung und den Unterschied zwischen Erscheinung und Wahrheit.',
            'Lange behandelte ich auch die Fotografie wie eine Rolle unter vielen. Nach einem Unfall in Griechenland änderte sich das. Ich wusste nicht, ob die Sehkraft eines Auges erhalten bleiben würde, und in dieser Unsicherheit verstand ich, dass ich keine Positionen mehr sammeln wollte. Ich wollte Arbeiten schaffen, die ich auch Jahre später noch als meine eigenen erkenne. Seitdem ist Fotografie kein Beruf neben meinem Leben. Sie ist die Art, wie ich aufmerksam bin.',
            'Die Menschen in meinen Bildern sind keine Illustrationen einer Idee. Sie sind der Grund, warum die Idee überhaupt entsteht. Frauen, die sich nach einer Krankheit neu aufbauen, Väter, die eine andere Form von Stärke lernen, Tänzer zwischen Disziplin und Freiheit, Gemeinschaften, die Erinnerung über Grenzen hinweg tragen. Mich interessiert der Augenblick, in dem die Rolle fällt und der Mensch bleibt.',
            'Diese Aufmerksamkeit setzt sich in meinen Büchern, Ausstellungen, in der Vermittlung und in der Gemeinschaftsarbeit fort. Ich sehe darin keine getrennten Laufbahnen. Es sind verschiedene Formen derselben Praxis: genügend Raum zu schaffen, damit ein Mensch, eine Erinnerung oder eine Gemeinschaft sichtbar werden kann, ohne vereinfacht zu werden.'
        ],
        'recognition': 'Anerkennungen','education': 'Ausbildung','verified': 'Verifizierte Biografie — Wikipedia','community': 'Gemeinschaft & Vermittlung','writing': 'Texte & Markenbotschafterarbeit','press': 'Presse','curators': 'Für Kurator:innen: vollständiges Dossier','hero_label': 'Die Erforschung der Präsenz · Seit 1999','hero_sub': 'Künstlerische Fotografie zwischen Wien und Budapest','menu_about': 'Die Erforschung der Präsenz','menu_about_desc': 'Woher die Arbeit kommt und warum die Erforschung der Präsenz seit 1999 in ihrem Zentrum steht.','footer_role': 'Fotokünstler',
    },
}

def links_for(rel):
    return ('community.html','writing.html','press.html','curators.html')

def about_section(rel, c):
    community, writing, press, curators = links_for(rel)
    paragraphs = ''.join(f'<p>{p}</p>' for p in c['body'])
    return f'''<section id="about" class="tone-b"><div class="wrap bio-grid"><div><div class="portrait-circle"><img src="/assets/img/portrait-circle.png" width="900" height="900" alt="Norbert Bánhalmi" loading="lazy" decoding="async"></div><p class="meta" style="text-align:center">Norbert Bánhalmi<br>* 14.05.1979, Budapest<br>Wien / Budapest</p></div><div><p class="label">{c['label']}</p><h2>{c['heading']}</h2><p class="lead" style="font-size:1.0625rem">{c['lead']}</p>{paragraphs}<div class="facts"><div><h4>{c['recognition']}</h4><ul><li>Turul Award — 2021, 2022, 2023, 2024, 2025</li><li>TOP100 of Hungary — 2022</li><li>OM SYSTEM Ambassador since 2018</li></ul></div><div><h4>{c['education']}</h4><ul><li>New York Institute of Photography — 2015</li><li>Applied photographer qualification — 2018</li><li>BEng Information Engineering — 2005</li></ul></div></div><p class="meta" style="margin-top:1.8rem"><a href="https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert" target="_blank" rel="noopener">{c['verified']}</a><br><a href="{community}">{c['community']} →</a> · <a href="{writing}">{c['writing']} →</a> · <a href="{press}">{c['press']} →</a> · <a href="{curators}">{c['curators']} →</a></p></div></div></section>'''

def replace_section(s, section_id, replacement):
    start = s.find(f'<section id="{section_id}"')
    if start < 0: return s
    end = s.find('</section>', start)
    if end < 0: return s
    return s[:start] + replacement + s[end + len('</section>'):]

changed=[]
for rel,c in PAGES.items():
    p=ROOT/rel
    if not p.exists(): continue
    s=p.read_text(encoding='utf-8'); original=s
    s=replace_section(s,'about',about_section(rel,c))
    s=re.sub(r'(<header class="hero".*?<p class="label">).*?(</p>)',r'\1'+c['hero_label']+r'\2',s,count=1,flags=re.S)
    s=re.sub(r'(<p class="hero-sub">).*?(</p>)',r'\1'+c['hero_sub']+r'\2',s,count=1,flags=re.S)
    s=re.sub(r'(<a class="m-main" href="index\.html#about">).*?(</a>\s*<p class="m-desc">).*?(</p>)',r'\1'+c['menu_about']+r'\2'+c['menu_about_desc']+r'\3',s,count=1,flags=re.S)
    s=re.sub(r'(hello@norbertbanhalmi\.com</a> · )[^·<]+( · Vienna · Budapest)',r'\1'+c['footer_role']+r'\2',s,count=1)
    if s!=original:
        p.write_text(s,encoding='utf-8'); changed.append(rel)
print(f'Human voice alignment updated {len(changed)} home pages.')
for rel in changed: print(rel)
