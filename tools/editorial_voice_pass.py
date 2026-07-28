#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

COPY = {
    'index.html': {
        'menu_books': 'Three books in which photographs, personal testimony and other disciplines meet. Each began with people, not with a format.',
        'menu_exhibitions': 'The exhibitions are stations in the same enquiry: how a person, a memory or a community becomes present without being reduced to a single story.',
        'books_lead': 'I have made three books. Each grew from a longer collaboration in which photographs, personal testimony and another discipline had to find a common language.',
        'exhibitions_lead': 'I do not think of the exhibitions as a list of events. They are stations in one continuing enquiry, developed in Budapest, New York, Vienna, Munich and elsewhere since 2014.',
        'works_lead': 'This is the complete homepage curatorial selection. Together, these photographs show how the same attention has moved between portraiture, commissioned work, personal stories, streets, bodies and communities since 1999.',
    },
    'hu/index.html': {
        'menu_books': 'Három könyv, amelyben a fényképek, a személyes vallomások és más alkotói területek találkoznak. Mindegyik emberekből indult ki, nem egy formátumból.',
        'menu_exhibitions': 'A kiállítások ugyanannak a kérdésnek az állomásai: hogyan válik jelenvalóvá egy ember, egy emlék vagy egy közösség anélkül, hogy egyetlen történetre egyszerűsítenénk.',
        'books_lead': 'Három könyvet készítettem. Mindegyik egy hosszabb együttműködésből nőtt ki, amelyben a fényképeknek, a személyes vallomásoknak és egy másik alkotói területnek kellett közös nyelvet találniuk.',
        'exhibitions_lead': 'A kiállításokra nem események listájaként tekintek. Egy folyamatos kutatás állomásai, amely 2014 óta Budapesten, New Yorkban, Bécsben, Münchenben és más helyszíneken épül.',
        'works_lead': 'Ez a teljes főoldali kurátori válogatás. A képek együtt mutatják meg, hogyan haladt ugyanaz a figyelem 1999 óta a portrék, a megbízásos munkák, a személyes történetek, az utcák, a test és a közösségek között.',
    },
    'de-at/index.html': {
        'menu_books': 'Drei Bücher, in denen Fotografien, persönliche Zeugnisse und andere Disziplinen zusammentreffen. Jedes begann mit Menschen, nicht mit einem Format.',
        'menu_exhibitions': 'Die Ausstellungen sind Stationen derselben Frage: Wie wird ein Mensch, eine Erinnerung oder eine Gemeinschaft gegenwärtig, ohne auf eine einzige Geschichte reduziert zu werden?',
        'books_lead': 'Ich habe drei Bücher geschaffen. Jedes entstand aus einer längeren Zusammenarbeit, in der Fotografien, persönliche Zeugnisse und eine weitere Disziplin eine gemeinsame Sprache finden mussten.',
        'exhibitions_lead': 'Ich verstehe die Ausstellungen nicht als Liste von Ereignissen. Sie sind Stationen einer fortlaufenden Untersuchung, die seit 2014 in Budapest, New York, Wien, München und an weiteren Orten entstanden ist.',
        'works_lead': 'Dies ist die vollständige kuratorische Auswahl der Startseite. Gemeinsam zeigen die Fotografien, wie sich dieselbe Aufmerksamkeit seit 1999 zwischen Porträt, Auftragsarbeit, persönlichen Geschichten, Straßen, Körpern und Gemeinschaften bewegt.',
    },
}


def replace_section_lead(source, section_id, text):
    pattern = rf'(<section id="{re.escape(section_id)}".*?<p class="lead">).*?(</p>)'
    return re.sub(pattern, lambda m: m.group(1) + text + m.group(2), source, count=1, flags=re.S)


def replace_menu_desc(source, anchor, text):
    pattern = rf'(<a class="m-main" href="{re.escape(anchor)}">.*?</a>\s*<p class="m-desc">).*?(</p>)'
    return re.sub(pattern, lambda m: m.group(1) + text + m.group(2), source, count=1, flags=re.S)


changed = []
for relative, copy in COPY.items():
    path = ROOT / relative
    if not path.exists():
        continue
    source = path.read_text(encoding='utf-8')
    updated = source
    updated = replace_menu_desc(updated, 'index.html#books', copy['menu_books'])
    updated = replace_menu_desc(updated, 'index.html#exhibitions', copy['menu_exhibitions'])
    updated = replace_section_lead(updated, 'works', copy['works_lead'])
    updated = replace_section_lead(updated, 'books', copy['books_lead'])
    updated = replace_section_lead(updated, 'exhibitions', copy['exhibitions_lead'])
    if updated != source:
        path.write_text(updated, encoding='utf-8')
        changed.append(relative)

print(f'Editorial voice pass updated {len(changed)} homepage files.')
for item in changed:
    print(item)
