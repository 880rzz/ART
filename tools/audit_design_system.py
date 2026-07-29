#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / 'assets/css/presence-core.css'
errors = []

if not CSS.exists():
    errors.append('Shared design-system stylesheet is missing.')
else:
    css = CSS.read_text(encoding='utf-8')
    required = (
        '--presence-gold:#b79c44',
        '--presence-soft:#b8b4ad',
        '.presence-context--intro',
        '.hero-cta{display:flex',
        '.timeline{display:grid',
        '.timeline .t-item{display:block!important',
        '.bio-grid{gap:',
        'body.apple-archive .presence-period-links{position:static!important',
        'body:not(.menu-open) #menu{display:none!important',
        'body.menu-open #menu{opacity:1!important',
        '#menu{box-sizing:border-box!important',
        '#menu .mwrap>div{display:block!important',
        '@media(max-width:640px)',
        '@media(prefers-reduced-motion:reduce)',
        'font-style:normal',
    )
    for token in required:
        if token not in css:
            errors.append(f'Design-system token missing: {token}')
    banned = ('#c9a962', 'rgba(201,169,98', 'font-style:italic')
    for token in banned:
        if token in css:
            errors.append(f'Legacy or prohibited design token remains: {token}')

for rel in ('index.html', 'hu/index.html', 'de-at/index.html'):
    path = ROOT / rel
    if not path.exists():
        errors.append(f'Homepage missing: {rel}')
        continue
    html = path.read_text(encoding='utf-8')
    if 'assets/css/presence-core.css' not in html:
        errors.append(f'Shared design-system stylesheet not linked: {rel}')
    if 'presence-context--intro' not in html:
        errors.append(f'Presence thesis is not presented below the hero: {rel}')
    if '<div class="hero-cta">' not in html:
        errors.append(f'Hero action group missing: {rel}')
    if '<div class="timeline">' not in html:
        errors.append(f'Exhibition timeline missing: {rel}')
    if '<div class="cards">' not in html:
        errors.append(f'Publication cards missing: {rel}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('Archive design-system audit passed.')
