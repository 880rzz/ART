#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    'index.html': (
        'This is the complete homepage curatorial selection.',
        'I have made three books.',
        'I do not think of the exhibitions as a list of events.',
        'Each began with people, not with a format.',
    ),
    'hu/index.html': (
        'Ez a teljes főoldali kurátori válogatás.',
        'Három könyvet készítettem.',
        'A kiállításokra nem események listájaként tekintek.',
        'Mindegyik emberekből indult ki, nem egy formátumból.',
    ),
    'de-at/index.html': (
        'Dies ist die vollständige kuratorische Auswahl der Startseite.',
        'Ich habe drei Bücher geschaffen.',
        'Ich verstehe die Ausstellungen nicht als Liste von Ereignissen.',
        'Jedes begann mit Menschen, nicht mit einem Format.',
    ),
}

errors = []
for relative, markers in EXPECTED.items():
    path = ROOT / relative
    if not path.exists():
        errors.append(f'Missing homepage: {relative}')
        continue
    source = path.read_text(encoding='utf-8')
    for marker in markers:
        if marker not in source:
            errors.append(f'Editorial voice marker missing ({marker}): {relative}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('Editorial voice audit passed for all three homepages.')
