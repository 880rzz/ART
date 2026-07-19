/* =====================================================================
   CERIDWEN GUIDE · a varázsvilág vezetője
   Grafikus Ceridwen-alak a jobb alsó sarokban, beszédbuborékkal.
   Minden nézetváltásnál és fontos eseménynél elmondja, mi történik
   és mi a következő lépés. HU/EN a <html lang> alapján.
   ===================================================================== */
(() => {
  'use strict';
  const doc = document;
  const isEn = (doc.documentElement.lang || 'hu').toLowerCase().startsWith('en');
  const LS_KEY = 'ceridwen.guide.v1';

  let state = { muted: false, welcomed: false };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') }; } catch (_) {}
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {} };

  /* ---------------- szövegek ---------------- */
  const T = isEn ? {
    name: 'Ceridwen',
    nextLabel: 'Next step',
    ok: 'I understand',
    mute: 'Quiet, Ceridwen',
    unmute: 'Speak again',
    aria: 'Ceridwen, your guide — click to hear her counsel',
    welcome: {
      text: 'Welcome, wanderer. I am <strong>Ceridwen</strong>, keeper of the cauldron. I will walk beside you and whisper what each place means and where to step next.',
      next: 'Look around the Gate — then open <strong>The Cauldron</strong> to meet the cards, or begin a <strong>Reading</strong>.'
    },
    views: {
      gate: { text: 'This is the <strong>Gate</strong> — the threshold of my world. Here you can feel the mood of the night and choose your path.', next: 'Open <strong>The Cauldron</strong> to browse the 76 cards, or go straight to <strong>Reading</strong>.' },
      cave: { text: 'You stand at <strong>The Cauldron</strong>. Four decks slumber here — 76 cards, each a mirror of the soul.', next: 'Choose a deck and turn its cards. When something stirs in you, begin a <strong>Reading</strong>.' },
      draw: { text: 'The rite of the <strong>Reading</strong> begins. Breathe slowly — the cards answer a calm heart.', next: 'Pick a spread, phrase your question, and follow my attunement steps one by one.' },
      cleanse: { text: 'This is the place of <strong>Cleansing</strong>. Old knots and shadows can be named and gently loosened here.', next: 'Choose what weighs on you, then follow the ordering practice I show you.' },
      pendulum: { text: 'My <strong>Pendulum</strong> swings between question and stillness. It is a symbolic mirror, not a fortune-teller.', next: 'Name yourself, prepare in silence, then let the session unfold step by step.' },
      kids: { text: 'The <strong>Inner Compass</strong> — a playful path for young explorers. Nothing here is heavy; all is invitation.', next: 'Pick a feeling, ask a question, and let the compass point to a mini-quest.' },
      lex: { text: 'The <strong>Lexicon</strong> — my book of shadows and bindings. Knowledge that names a pattern already loosens it.', next: 'Browse the entries; when one speaks to you, try the cleansing practice it suggests.' },
      journal: { text: 'The <strong>Journal</strong> — your own scroll. It lives only in this device; no one reads it but you.', next: 'Write down what today\'s signs stirred in you, then save the entry.' },
      yesno: { text: 'The <strong>Yes/No pendulum</strong> — a short, separate rite in the forest clearing. Three grounding steps, one clear question.', next: 'Walk the three steps, then ask a question that can truly be answered yes or no.' }
    },
    events: {
      yesnoResult: { text: 'The pendulum has <strong>swung</strong>. Take it as a symbolic pointer, not a verdict.', next: 'Sit with the answer a moment — or ask a new question.' },
      cardsDrawn: { text: 'The cards have <strong>surfaced from the cauldron</strong>. Read them slowly — the order and the places carry meaning.', next: 'Read each card, then note the one insight that matters in your <strong>Journal</strong>.' },
      kidsResult: { text: 'The compass has <strong>chosen a direction</strong>! Remember: it is a playful idea, not a command.', next: 'Try the mini-quest — or ask a new question.' },
      journalSaved: { text: 'Your words are <strong>sealed in the scroll</strong>. They stay on this device only.', next: 'Return tomorrow — a returning explorer sees deeper.' },
      cleanseStart: { text: 'The <strong>cleansing</strong> has begun. Three slow breaths, and speak the intention.', next: 'Follow each step to the end — do not hurry the fire.' }
    }
  } : {
    name: 'Ceridwen',
    nextLabel: 'Következő lépés',
    ok: 'Értem',
    mute: 'Csendet kérek',
    unmute: 'Szólj újra',
    aria: 'Ceridwen, a vezetőd — kattints, hogy halljad a tanácsát',
    welcome: {
      text: 'Üdvözöllek, vándor. Én vagyok <strong>Ceridwen</strong>, az üst őrzője. Végigkísérlek az úton: mindig elsúgom, hol jársz és merre lépj tovább.',
      next: 'Nézz körül a Bejáratnál — majd nyisd meg <strong>Az Üstöt</strong>, hogy megismerd a lapokat, vagy kezdj rögtön egy <strong>Vetést</strong>.'
    },
    views: {
      gate: { text: 'Ez itt a <strong>Bejárat</strong> — világom küszöbe. Itt ráhangolódhatsz az éjszakára, és utat választhatsz.', next: 'Nyisd meg <strong>Az Üstöt</strong> a 76 lap megismeréséhez, vagy lépj egyenesen a <strong>Vetéshez</strong>.' },
      cave: { text: '<strong>Az Üstnél</strong> állsz. Négy pakli szunnyad itt — 76 lap, mind a lélek egy-egy tükre.', next: 'Válassz paklit és forgasd a lapokat. Ha valami megmozdul benned, indíts egy <strong>Vetést</strong>.' },
      draw: { text: 'Kezdődik a <strong>Vetés</strong> szertartása. Lélegezz lassan — a lapok a nyugodt szívnek válaszolnak.', next: 'Válassz vetést, fogalmazd meg a kérdésed, és kövesd sorban a ráhangoló lépéseimet.' },
      cleanse: { text: 'Ez a <strong>Tisztítás</strong> helye. A régi csomókat és árnyakat itt néven nevezzük és szelíden kioldjuk.', next: 'Válaszd ki, mi nyom, majd kövesd a rendező gyakorlatot, amit mutatok.' },
      pendulum: { text: 'Az <strong>Ingám</strong> kérdés és csend között leng. Jelképes tükör — nem jós.', next: 'Mutatkozz be, készülj fel csendben, majd hagyd, hogy az ülés lépésről lépésre kibomoljon.' },
      kids: { text: 'A <strong>Belső Iránytű</strong> — játékos ösvény ifjú felfedezőknek. Itt semmi sem teher; minden meghívás.', next: 'Válassz egy érzést, tégy fel egy kérdést, és hagyd, hogy az iránytű mini-küldetést mutasson.' },
      lex: { text: 'A <strong>Lexikon</strong> — árnyék- és kötésmintáim könyve. Ami nevet kap, az már oldódik is.', next: 'Lapozz a bejegyzések közt; ha egy megszólít, próbáld ki a hozzá tartozó tisztító gyakorlatot.' },
      journal: { text: 'A <strong>Napló</strong> — a te saját tekercsed. Csak ezen az eszközön él; rajtad kívül senki sem olvassa.', next: 'Írd le, mit mozdítottak meg benned a mai jelek, majd mentsd el a bejegyzést.' },
      yesno: { text: 'Az <strong>Igen/Nem inga</strong> — rövid, külön szertartás az erdei tisztáson. Három ráhangoló lépés, egy tiszta kérdés.', next: 'Járd végig a három lépést, majd tégy fel egy kérdést, amire tényleg igen vagy nem a válasz.' }
    },
    events: {
      yesnoResult: { text: 'Az inga <strong>kilendült</strong>. Jelképes iránymutatás — nem ítélet.', next: 'Ülj együtt a válasszal egy pillanatig — vagy kérdezz újat.' },
      cardsDrawn: { text: 'A lapok <strong>felszínre emelkedtek az üstből</strong>. Olvasd őket lassan — a sorrend és a helyek is jelentenek.', next: 'Olvasd végig mindet, majd a legfontosabb felismerést jegyezd fel a <strong>Naplóba</strong>.' },
      kidsResult: { text: 'Az iránytű <strong>irányt választott</strong>! Ne feledd: játékos ötlet, nem parancs.', next: 'Próbáld ki a mini-küldetést — vagy kérdezz újat.' },
      journalSaved: { text: 'Szavaid <strong>a tekercsbe pecsételve</strong>. Csak ezen az eszközön maradnak.', next: 'Térj vissza holnap — a visszatérő vándor mélyebbre lát.' },
      cleanseStart: { text: 'A <strong>tisztítás</strong> elkezdődött. Három lassú levegő, és mondd ki a szándékot.', next: 'Kövesd végig a lépéseket — a tüzet nem szabad siettetni.' }
    }
  };

  /* ---------------- Ceridwen alakja (SVG) ---------------- */
  const FIGURE_SVG = `
<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="ckRobe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1b3a2c"/>
      <stop offset="55%" stop-color="#122a1f"/>
      <stop offset="100%" stop-color="#0a1a12"/>
    </linearGradient>
    <radialGradient id="ckGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffe9a8" stop-opacity=".95"/>
      <stop offset="55%" stop-color="#e0b95e" stop-opacity=".45"/>
      <stop offset="100%" stop-color="#e0b95e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ckFace" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#f5e8c8"/>
      <stop offset="100%" stop-color="#dcc394"/>
    </radialGradient>
    <linearGradient id="ckHair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7c4a1e"/>
      <stop offset="100%" stop-color="#4c2c10"/>
    </linearGradient>
    <linearGradient id="ckCaul" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a4a52"/>
      <stop offset="100%" stop-color="#141d22"/>
    </linearGradient>
  </defs>

  <!-- aura -->
  <ellipse cx="100" cy="120" rx="86" ry="110" fill="url(#ckGlow)" opacity=".28"/>

  <!-- holdsarló korona -->
  <path d="M78 30 A30 30 0 0 1 122 30 A24 24 0 0 0 78 30 Z" fill="#e8cf8e" stroke="#d4a94e" stroke-width="1.5"/>
  <circle cx="100" cy="18" r="3.4" fill="#ffe9a8"/>
  <circle cx="79"  cy="31" r="2.1" fill="#ffe9a8" opacity=".85"/>
  <circle cx="121" cy="31" r="2.1" fill="#ffe9a8" opacity=".85"/>

  <!-- haj -->
  <path d="M62 66 Q54 120 62 172 Q70 150 68 112 Q66 84 74 66 Z" fill="url(#ckHair)"/>
  <path d="M138 66 Q146 120 138 172 Q130 150 132 112 Q134 84 126 66 Z" fill="url(#ckHair)"/>

  <!-- arc -->
  <ellipse cx="100" cy="58" rx="24" ry="27" fill="url(#ckFace)"/>
  <path d="M76 52 Q100 30 124 52 Q118 38 100 36 Q82 38 76 52 Z" fill="url(#ckHair)"/>
  <path d="M89 58 q4 -3.5 8 0" fill="none" stroke="#3a2a14" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M103 58 q4 -3.5 8 0" fill="none" stroke="#3a2a14" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M96 72 q4 3 8 0" fill="none" stroke="#8a5a3a" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M99 62 q1.5 4 0 6" fill="none" stroke="#c9a670" stroke-width="1.2" stroke-linecap="round"/>

  <!-- köpeny -->
  <path d="M100 82 Q56 96 44 176 Q40 210 52 232 L148 232 Q160 210 156 176 Q144 96 100 82 Z"
        fill="url(#ckRobe)" stroke="#d4a94e" stroke-opacity=".55" stroke-width="1.6"/>
  <!-- kelta fonat a szegélyen -->
  <path d="M56 224 q11 -8 22 0 t22 0 t22 0 t22 0" fill="none" stroke="#d4a94e" stroke-width="2" stroke-opacity=".8"/>
  <path d="M56 230 q11 8 22 0 t22 0 t22 0 t22 0" fill="none" stroke="#d4a94e" stroke-width="2" stroke-opacity=".5"/>

  <!-- karok az üst felé -->
  <path d="M62 130 Q54 168 76 188" fill="none" stroke="url(#ckRobe)" stroke-width="16" stroke-linecap="round"/>
  <path d="M138 130 Q146 168 124 188" fill="none" stroke="url(#ckRobe)" stroke-width="16" stroke-linecap="round"/>
  <ellipse cx="77" cy="189" rx="6.5" ry="5" fill="#e9d6ac"/>
  <ellipse cx="123" cy="189" rx="6.5" ry="5" fill="#e9d6ac"/>

  <!-- nyaklánc triskell -->
  <circle cx="100" cy="100" r="7.5" fill="none" stroke="#d4a94e" stroke-width="1.4"/>
  <path d="M100 95 a4 4 0 0 1 0 8 M96 102 a4 4 0 0 1 7 -6 M104 102 a4 4 0 0 1 -7 2"
        fill="none" stroke="#d4a94e" stroke-width="1.1"/>

  <!-- üst -->
  <ellipse cx="100" cy="234" rx="46" ry="10" fill="#0a1410"/>
  <path d="M60 206 Q60 240 100 240 Q140 240 140 206 Q140 196 100 196 Q60 196 60 206 Z"
        fill="url(#ckCaul)" stroke="#d4a94e" stroke-opacity=".6" stroke-width="1.6"/>
  <ellipse cx="100" cy="200" rx="40" ry="8" fill="#0e2a20" stroke="#d4a94e" stroke-opacity=".5" stroke-width="1.2"/>
  <ellipse cx="100" cy="199" rx="32" ry="5.5" fill="url(#ckGlow)"/>

  <!-- Awen három sugara az üstből -->
  <g stroke="#ffe9a8" stroke-width="2" stroke-linecap="round" opacity=".9">
    <path d="M86 192 L78 168"/>
    <path d="M100 190 L100 162"/>
    <path d="M114 192 L122 168"/>
  </g>
  <circle cx="78" cy="163" r="2.6" fill="#ffe9a8"/>
  <circle cx="100" cy="157" r="2.6" fill="#ffe9a8"/>
  <circle cx="122" cy="163" r="2.6" fill="#ffe9a8"/>

  <!-- gőz -->
  <path d="M88 150 q-6 -12 2 -22 M112 150 q6 -12 -2 -22" fill="none"
        stroke="#cfe0d5" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
</svg>`;

  /* ---------------- DOM felépítése ---------------- */
  let root, bubble, bubbleText, bubbleNext, hideTimer, current = null;

  function build() {
    root = doc.createElement('div');
    root.className = 'ck-guide' + (state.muted ? ' is-muted' : '');
    root.innerHTML =
      `<div class="ck-bubble" id="ckBubble" hidden role="status" aria-live="polite">
         <div class="ck-bubble__name">${T.name}</div>
         <div class="ck-bubble__text" id="ckBubbleText"></div>
         <div class="ck-bubble__next" id="ckBubbleNext"></div>
         <div class="ck-bubble__row">
           <button type="button" class="ck-bubble__btn--ghost ck-bubble__btn" id="ckMuteBtn">${state.muted ? T.unmute : T.mute}</button>
           <button type="button" class="ck-bubble__btn" id="ckOkBtn">${T.ok}</button>
         </div>
       </div>
       <button type="button" class="ck-figure" id="ckFigure" aria-label="${T.aria}">${FIGURE_SVG}</button>`;
    doc.body.appendChild(root);

    bubble = root.querySelector('#ckBubble');
    bubbleText = root.querySelector('#ckBubbleText');
    bubbleNext = root.querySelector('#ckBubbleNext');

    root.querySelector('#ckOkBtn').addEventListener('click', hide);
    root.querySelector('#ckMuteBtn').addEventListener('click', toggleMute);
    doc.addEventListener('keydown', e => {
      if (e.key === 'Escape' && bubble && !bubble.hidden) hide();
    });
    root.querySelector('#ckFigure').addEventListener('click', () => {
      if (bubble.classList.contains('is-open')) { hide(); return; }
      if (state.muted) { toggleMute(); }
      speakView(activeViewId(), true);
    });
  }

  function toggleMute() {
    state.muted = !state.muted; save();
    root.classList.toggle('is-muted', state.muted);
    root.querySelector('#ckMuteBtn').textContent = state.muted ? T.unmute : T.mute;
    if (state.muted) hide();
  }

  function show(msg, force) {
    if (!msg || (state.muted && !force)) return;
    clearTimeout(hideTimer);
    bubbleText.innerHTML = msg.text;
    bubbleNext.innerHTML = msg.next ? `<strong>${T.nextLabel}:</strong> ${msg.next}` : '';
    bubbleNext.style.display = msg.next ? '' : 'none';
    bubble.hidden = false;
    requestAnimationFrame(() => bubble.classList.add('is-open'));
    hideTimer = setTimeout(hide, 16000);
  }

  function hide() {
    clearTimeout(hideTimer);
    bubble.classList.remove('is-open');
    setTimeout(() => { bubble.hidden = true; }, 300);
  }

  /* ---------------- nézetek figyelése ---------------- */
  function activeViewId() {
    if (doc.body.classList.contains('yesno-page')) return 'yesno';
    const v = doc.querySelector('.view.on');
    return v ? v.id.replace(/^v-/, '') : 'gate';
  }

  /* ---------------- varázserdő rétegek (köd + spórák) ---------------- */
  function buildForest() {
    if (doc.querySelector('.ck-fog')) return;
    const frag = doc.createDocumentFragment();
    ['ck-fog ck-fog--1', 'ck-fog ck-fog--2'].forEach(cls => {
      const el = doc.createElement('div');
      el.className = cls; el.setAttribute('aria-hidden', 'true');
      frag.appendChild(el);
    });
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      const small = window.matchMedia && window.matchMedia('(max-width: 680px)').matches;
      const count = small ? 7 : 12;
      for (let i = 0; i < count; i++) {
        const s = doc.createElement('div');
        s.className = 'ck-spore'; s.setAttribute('aria-hidden', 'true');
        const size = 4 + Math.random() * 5;
        s.style.width = s.style.height = size.toFixed(1) + 'px';
        s.style.left = (Math.random() * 100).toFixed(1) + 'vw';
        s.style.setProperty('--sx', ((Math.random() * 80) - 40).toFixed(0) + 'px');
        s.style.animationDuration = (14 + Math.random() * 14).toFixed(1) + 's';
        s.style.animationDelay = (-Math.random() * 20).toFixed(1) + 's';
        frag.appendChild(s);
      }
    }
    doc.body.insertBefore(frag, doc.body.firstChild);
  }

  function speakView(id, force) {
    if (!force && current === id) return;
    current = id;
    const msg = T.views[id];
    if (msg) show(msg, force);
  }

  function observeViews() {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.target.classList &&
            m.target.classList.contains('view') && m.target.classList.contains('on')) {
          const id = m.target.id.replace(/^v-/, '');
          setTimeout(() => speakView(id), 350);
          return;
        }
      }
    });
    doc.querySelectorAll('.view').forEach(v =>
      mo.observe(v, { attributes: true, attributeFilter: ['class'] }));
  }

  /* ---------------- események figyelése ---------------- */
  function observeEvents() {
    let cardCount = doc.querySelectorAll('.reading-card').length;
    let kidsShown = false;
    let yesnoShown = false;
    let rafPending = false;
    const mo = new MutationObserver(() => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => { rafPending = false; scan(); });
    });
    function scan() {
      const cardsNow = doc.querySelectorAll('.reading-card').length;
      if (cardsNow > cardCount) { show(T.events.cardsDrawn); }
      cardCount = cardsNow;

      const kr = doc.getElementById('kidsResult');
      const visible = kr && !kr.hidden;
      if (visible && !kidsShown) show(T.events.kidsResult);
      kidsShown = !!visible;

      const qr = doc.getElementById('qaResult');
      const qVisible = qr && !qr.hidden;
      if (qVisible && !yesnoShown) show(T.events.yesnoResult);
      yesnoShown = !!qVisible;
    }
    mo.observe(doc.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden'] });

    doc.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.id === 'saveBtn') { setTimeout(() => show(T.events.journalSaved), 250); return; }
      const label = (btn.textContent || '').toLowerCase();
      if (/tisztít|oldás|cleansing|cleanse|release/.test(label) && !btn.closest('.ck-guide')) {
        setTimeout(() => show(T.events.cleanseStart), 400);
      }
    }, true);
  }

  /* ---------------- indítás ---------------- */
  function init() {
    if (doc.querySelector('.ck-guide')) return;
    buildForest();
    build();
    observeViews();
    observeEvents();
    current = activeViewId();
    if (!state.welcomed) {
      state.welcomed = true; save();
      setTimeout(() => show(T.welcome), 900);
    } else {
      setTimeout(() => show(T.views[current]), 900);
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
