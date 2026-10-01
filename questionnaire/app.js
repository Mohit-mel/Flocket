/* Flocket brand discovery: questionnaire engine.
 * Reads window.FLOCKET_QUESTIONNAIRE (questions.js) and window.FLOCKET_CONFIG (config.js).
 */
(function () {
  'use strict';

  const DATA = window.FLOCKET_QUESTIONNAIRE;
  const CFG = Object.assign({ sheetEndpoint: '', studioName: 'the design team', version: 'v1' }, window.FLOCKET_CONFIG || {});
  const STORE_KEY = 'flocket-brand-discovery:' + CFG.version;
  const OTHER = 'Other';
  const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (tag, cls, html) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  };

  const CHEVRONS = '<path d="M40.7 2Q48 4.6 55 6.5Q62 4.6 69.6 2Q63 8 55 13.6Q47 8 40.7 2Z"/><path d="M33 17.4Q46 21 58 25Q70 21 83 17.4Q71 27 58 36.7Q45 27 33 17.4Z"/><path d="M4 42.5Q32 55 60 68.5Q88 55 116 42.5Q90 80 60 108Q30 80 4 42.5Z"/>';
  const MARK = '<svg viewBox="0 0 120 110" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" aria-hidden="true">' + CHEVRONS + '</svg>';
  const BIRD = '<svg viewBox="0 0 120 70" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5Q32 17 60 30.5Q88 17 116 4.5Q90 42 60 66Q30 42 4 4.5Z"/></svg>';
  const ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  };

  /* ---------- Steps ---------- */
  const chapters = DATA.chapters;
  const NIGHT = { src: 'bg-bluehour', tint: 'night' };
  const steps = [{ kind: 'welcome', ci: 0 }];
  chapters.forEach((ch, ci) => {
    if (!ch.skipIntro) steps.push({ kind: 'chapter', ci });
    ch.questions.forEach((q, qi) => steps.push({ kind: 'question', ci, q, qi }));
  });
  const REVIEW = steps.push({ kind: 'review', ci: chapters.length - 1, bg: NIGHT }) - 1;
  const THANKS = steps.push({ kind: 'thanks', ci: chapters.length - 1, bg: NIGHT }) - 1;
  const firstStepOf = chapters.map((_, ci) => steps.findIndex((s) => s.ci === ci && (s.kind === 'chapter' || s.kind === 'question')));
  const lastStepOf = chapters.map((_, ci) => {
    let last = -1;
    steps.forEach((s, i) => { if (s.ci === ci && s.kind === 'question') last = i; });
    return last;
  });
  const questionSteps = steps.filter((s) => s.kind === 'question');
  const shortTitle = (ch) => {
    const t = ch.title[0].replace(/\.$/, '').replace(/^The /, '');
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const chapterTag = (ci) => (ci === 0 ? 'Before we begin' : pad(ci) + ' · ' + shortTitle(chapters[ci]));

  /* ---------- State ---------- */
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'r-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const fresh = () => ({ step: 0, maxStep: 0, answers: {}, responseId: uuid(), startedAt: new Date().toISOString(), submittedAt: null, returnTo: null });
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      return s && typeof s === 'object' && s.answers ? Object.assign(fresh(), s) : null;
    } catch (e) {
      return null;
    }
  }
  let state = load() || fresh();
  let A = state.answers;
  let resumeStep = 0;

  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        flashSaved();
      } catch (e) { /* storage unavailable: answers live for this visit only */ }
    }, 250);
  }
  function flashSaved() {
    const pill = $('#saved');
    $('#savedText').textContent = 'Saved';
    pill.classList.remove('is-pulsing');
    void pill.offsetWidth;
    pill.classList.add('is-pulsing');
  }

  /* ---------- Answers ---------- */
  const scaleKey = (q, p) => q.id + '_' + p.key;
  function isAnswered(q) {
    if (q.type === 'scale') return q.pairs.some((p) => A[scaleKey(q, p)] != null);
    const v = A[q.id];
    return Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '';
  }
  const answeredCount = () => questionSteps.filter((s) => isAnswered(s.q)).length;
  const percent = () => Math.round((answeredCount() / questionSteps.length) * 100);
  function describe(p, v) {
    return ['Very ' + p.left, 'Leaning ' + p.left, 'Balanced', 'Leaning ' + p.right, 'Very ' + p.right][v - 1];
  }
  // Human-readable answer, used on the review screen and in the Sheet.
  function display(q) {
    if (q.type === 'scale') {
      return q.pairs.map((p) => (A[scaleKey(q, p)] == null ? null : p.left + ' / ' + p.right + ': ' + describe(p, A[scaleKey(q, p)]))).filter(Boolean).join('\n');
    }
    const v = A[q.id];
    const other = (A[q.id + '__other'] || '').trim();
    const swap = (x) => (x === OTHER ? (other ? 'Other: ' + other : 'Other') : x);
    if (Array.isArray(v)) return v.map((x, i) => (q.ordered ? i + 1 + '. ' : '') + swap(x)).join('; ');
    return typeof v === 'string' ? swap(v).trim() : '';
  }
  function validate(q) {
    const v = typeof A[q.id] === 'string' ? A[q.id].trim() : '';
    if (q.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'That email looks incomplete. Check it has an @ and a domain.';
    if (q.required && !isAnswered(q)) {
      if (q.type === 'email') return 'Add your email so we can send you the brand brief.';
      if (q.id === 'name') return 'Add your name so we know who is answering.';
      return 'This one is needed before you continue.';
    }
    const picked = Array.isArray(A[q.id]) ? A[q.id] : [A[q.id]];
    if (q.other && picked.includes(OTHER) && !(A[q.id + '__other'] || '').trim()) return 'Tell us what “Other” means for you, or untick it.';
    return '';
  }

  /* ---------- Background ---------- */
  const app = $('#app');
  const stage = $('#stage');
  const scene = $('.scene');
  const layers = [$('#bgA'), $('#bgB')];
  let front = 0;
  let bgKey = '';
  const bgFor = (step) => step.bg || chapters[step.ci].bg;
  function setBackground(bg) {
    const key = bg.src + '|' + !!bg.flip + '|' + (bg.tint || '');
    if (key === bgKey) return;
    bgKey = key;
    const next = layers[1 - front];
    next.style.backgroundImage = 'url("assets/' + bg.src + '.webp")';
    next.classList.toggle('is-flipped', !!bg.flip);
    next.dataset.tint = bg.tint || '';
    next.classList.remove('is-on');
    void next.offsetWidth;
    next.classList.add('is-on');
    layers[front].classList.remove('is-on');
    front = 1 - front;
    app.classList.toggle('is-dark-scene', bg.src === 'bg-bluehour');
  }
  if (finePointer && !reduceMotion) {
    let raf = 0;
    window.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (e.clientX / innerWidth - 0.5) * -14;
        const y = (e.clientY / innerHeight - 0.5) * -10;
        scene.style.setProperty('--px', x.toFixed(1) + 'px');
        scene.style.setProperty('--py', y.toFixed(1) + 'px');
      });
    });
  }

  /* ---------- Birds on the canvas ---------- */
  const canvas = $('#flight');
  const ctx = canvas.getContext('2d');
  let flyers = [];
  let flightRaf = 0;
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);
  function launchFlock(count, delay) {
    if (reduceMotion) return;
    setTimeout(() => {
      const startY = innerHeight * (0.14 + Math.random() * 0.16);
      const speed = 2.4 + Math.random() * 0.8;
      const vy = -0.25 - Math.random() * 0.25;
      const light = app.classList.contains('is-dark-scene');
      for (let i = 0; i < count; i++) {
        const rank = Math.ceil(i / 2);
        const side = i % 2 ? 1 : -1;
        flyers.push({
          x: -40 - rank * 26 + Math.random() * 6,
          y: startY + side * rank * 14 + rank * 8 + Math.random() * 6,
          vx: speed, vy,
          s: 5 + Math.random() * 3.5 - rank * 0.25,
          phase: Math.random() * Math.PI * 2,
          color: light ? 'rgba(255,255,255,0.9)' : 'rgba(28,44,58,0.72)',
        });
      }
      if (!flightRaf) flightRaf = requestAnimationFrame(fly);
    }, delay || 0);
  }
  function fly(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    flyers.forEach((b) => {
      b.x += b.vx;
      b.y += b.vy + Math.sin(t / 500 + b.phase) * 0.25;
      const flap = Math.sin(t / 85 + b.phase);
      const s = Math.max(b.s, 2.5);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(1.3, s / 4);
      ctx.beginPath();
      ctx.moveTo(b.x - s, b.y - s * 0.55 * flap);
      ctx.quadraticCurveTo(b.x - s * 0.45, b.y - s * 0.35, b.x, b.y);
      ctx.quadraticCurveTo(b.x + s * 0.45, b.y - s * 0.35, b.x + s, b.y - s * 0.55 * flap);
      ctx.stroke();
    });
    flyers = flyers.filter((b) => b.x < innerWidth + 60 && b.y > -60);
    flightRaf = flyers.length ? requestAnimationFrame(fly) : 0;
    if (!flyers.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /* ---------- Navigation ---------- */
  let current = null;
  let autoTimer = 0;

  function go(index, dir) {
    index = Math.max(0, Math.min(steps.length - 1, index));
    clearTimeout(autoTimer);
    const prev = state.step;
    if (index === prev && current) return;
    state.step = index;
    if (index < THANKS) state.maxStep = Math.max(state.maxStep, index);
    render(dir || (index >= prev ? 'next' : 'prev'), prev);
    save();
  }

  function advance() {
    const step = steps[state.step];
    if (step.kind === 'question') {
      const msg = validate(step.q);
      if (msg) return showError(msg);
      if (state.returnTo != null) {
        const back = state.returnTo;
        state.returnTo = null;
        return go(back, 'next');
      }
    }
    if (step.kind === 'welcome' && resumeStep > 0) {
      const target = resumeStep;
      resumeStep = 0;
      return go(target, 'next');
    }
    go(state.step + 1, 'next');
  }

  function showError(msg) {
    const card = $('.card', current);
    const box = $('.q-error', current);
    if (box) box.textContent = msg;
    if (card) {
      card.classList.remove('is-shaking');
      void card.offsetWidth;
      card.classList.add('is-shaking');
    }
    const field = $('input:not([type=range]), textarea', current);
    if (field) field.focus();
  }

  function render(dir, prev) {
    const step = steps[state.step];
    setBackground(bgFor(step));
    const screen = el('section', 'screen');
    const inner = el('div', 'screen-inner');
    inner.appendChild(build(step));
    screen.appendChild(inner);
    if (current) {
      const old = current;
      if (reduceMotion) old.remove();
      else {
        old.classList.add('leave-' + dir);
        setTimeout(() => old.remove(), 520);
        screen.classList.add('enter-' + dir);
      }
    }
    stage.appendChild(screen);
    current = screen;
    updateChrome(step, prev);
    setTimeout(() => focusFirst(screen), reduceMotion ? 0 : 380);
  }

  function focusFirst(screen) {
    if (screen !== current) return;
    const field = $('input:not([type=range]), textarea', screen);
    if (field && finePointer) {
      field.focus({ preventScroll: true });
      const len = field.value.length;
      try { field.setSelectionRange(len, len); } catch (e) { /* email inputs do not support selection */ }
      return;
    }
    const heading = $('h1, h2', screen);
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  function build(step) {
    if (step.kind === 'welcome') return buildWelcome();
    if (step.kind === 'chapter') return buildChapter(step);
    if (step.kind === 'review') return buildReview();
    if (step.kind === 'thanks') return buildThanks();
    return buildQuestion(step);
  }

  /* ---------- Chrome: nav pill, dock, flock ---------- */
  const flock = $('#flock');
  // The flock forms a V. Chapters fill the lead bird first, then alternate wings.
  const vOrder = [];
  (function () {
    const mid = Math.floor(chapters.length / 2);
    vOrder.push(mid);
    for (let k = 1; vOrder.length < chapters.length; k++) {
      if (mid - k >= 0) vOrder.push(mid - k);
      if (mid + k < chapters.length && vOrder.length < chapters.length) vOrder.push(mid + k);
    }
    const slots = new Array(chapters.length);
    vOrder.forEach((slot, ci) => { slots[slot] = ci; });
    slots.forEach((ci, slot) => {
      const b = el('button', 'bird', BIRD);
      b.type = 'button';
      b.dataset.ci = ci;
      b.style.setProperty('--y', Math.abs(slot - mid) * 2.5 + 'px');
      b.title = ci === 0 ? 'Before we begin' : 'Chapter ' + ci + ': ' + shortTitle(chapters[ci]);
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => go(firstStepOf[ci]));
      flock.appendChild(b);
    });
  })();
  const doneChapters = new Set();

  function updateChrome(step) {
    const hidden = step.kind === 'welcome' || step.kind === 'thanks';
    app.classList.toggle('is-hero', hidden);
    $('#navChapter').textContent =
      step.kind === 'welcome' ? 'Brand discovery' :
      step.kind === 'review' ? 'Review' :
      step.kind === 'thanks' ? 'Sent' : chapterTag(step.ci);
    $('#backBtn').disabled = state.step === 0;
    $('#fwdBtn').disabled = state.step >= Math.min(state.maxStep, REVIEW);
    $('#dockProgress').textContent = percent() + '% complete';

    $$('.bird', flock).forEach((b) => {
      const ci = +b.dataset.ci;
      const done = state.maxStep > lastStepOf[ci];
      const isCurrent = (step.kind === 'question' || step.kind === 'chapter') && step.ci === ci;
      b.classList.toggle('is-done', done);
      b.classList.toggle('is-current', isCurrent && !done);
      b.disabled = firstStepOf[ci] > state.maxStep;
      if (done && !doneChapters.has(ci)) {
        if (booted) {
          b.classList.remove('just-landed');
          void b.offsetWidth;
          b.classList.add('just-landed');
          launchFlock(5);
        }
        doneChapters.add(ci);
      }
    });
  }
  $('#backBtn').addEventListener('click', () => go(state.step - 1, 'prev'));
  $('#fwdBtn').addEventListener('click', () => go(state.step + 1, 'next'));

  /* ---------- Shared pieces ---------- */
  function primaryButton(text) {
    const b = el('button', 'btn btn-primary', '<span class="label"><span>' + esc(text) + '</span><span aria-hidden="true"></span></span>' + ICON.arrow);
    b.type = 'button';
    b.dataset.primary = '';
    return b;
  }
  function setLabel(btn, text) {
    const spans = $$('.label > span', btn);
    const shown = spans.find((s) => !s.hasAttribute('aria-hidden'));
    const hiddenSpan = spans.find((s) => s !== shown);
    if (!shown || shown.textContent === text) return;
    hiddenSpan.textContent = text;
    shown.setAttribute('aria-hidden', 'true');
    hiddenSpan.removeAttribute('aria-hidden');
  }
  function stagger(nodes) {
    nodes.forEach((n, i) => n && n.style.setProperty('--i', i));
  }

  /* ---------- Welcome ---------- */
  function buildWelcome() {
    const name = (A.name || '').trim();
    const resume = resumeStep > 0;
    const wrap = el('div', 'hero welcome stagger');
    wrap.innerHTML =
      '<div class="tags" aria-hidden="true">' +
        '<span class="tag green br" style="left:2%;top:4%;--d:-1s">Voice</span>' +
        '<span class="tag purple bl" style="right:3%;top:0;--d:-3s">Colour</span>' +
        '<span class="tag amber tr" style="left:0;bottom:24%;--d:-2s">Logo</span>' +
        '<span class="tag blue tl" style="right:0;bottom:34%;--d:-4.5s">Audience</span>' +
      '</div>' +
      '<span class="pill">Flocket brand discovery</span>' +
      (resume
        ? '<h1><span class="soft">Welcome back' + (name ? ', ' + esc(name) : '') + '.</span>You are ' + percent() + '% of the way.</h1>' +
          '<p>Everything you answered is still here. Pick up where you left off, or start again from the top.</p>'
        : '<h1><span class="soft">Let’s shape the brand</span>Flocket deserves.</h1>' +
          '<p>Eight short chapters about your business, your customers and your taste. Short answers are fine, and anything you skip we can cover on a call.</p>') +
      '<div class="hero-actions"></div>' +
      '<div class="hero-meta"><span class="meta-chip">About 20 minutes</span><span class="meta-chip">' + questionSteps.length + ' questions</span><span class="meta-chip">Saves as you go</span></div>';
    const actions = $('.hero-actions', wrap);
    const start = primaryButton(resume ? 'Continue where I left off' : 'Start');
    start.addEventListener('click', advance);
    actions.appendChild(start);
    if (resume) actions.appendChild(startOverButton());
    stagger(Array.from(wrap.children).slice(1));
    return wrap;
  }

  function startOverButton(label) {
    label = label || 'Start over';
    const b = el('button', 'btn btn-glass', esc(label));
    b.type = 'button';
    let armed = false;
    let timer = 0;
    b.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        b.textContent = 'Tap again to clear your answers';
        timer = setTimeout(() => { armed = false; b.textContent = label; }, 3500);
        return;
      }
      clearTimeout(timer);
      state = fresh();
      A = state.answers;
      resumeStep = 0;
      doneChapters.clear();
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      current && current.remove();
      current = null;
      go(0);
    });
    return b;
  }

  /* ---------- Chapter intro ---------- */
  function buildChapter(step) {
    const ch = chapters[step.ci];
    const n = ch.questions.length;
    const wrap = el('div', 'hero stagger');
    wrap.innerHTML =
      '<span class="pill">Chapter ' + pad(step.ci) + ' of ' + pad(chapters.length - 1) + '</span>' +
      '<h2><span class="soft">' + esc(ch.title[0]) + '</span>' + esc(ch.title[1]) + '</h2>' +
      '<p>' + esc(ch.blurb) + '</p>' +
      '<div class="hero-actions"></div>' +
      '<div class="hero-meta"><span class="meta-chip">' + n + ' questions</span><span class="meta-chip">About ' + Math.max(1, Math.round(n * 0.6)) + ' min</span></div>';
    const begin = primaryButton('Begin');
    begin.addEventListener('click', advance);
    $('.hero-actions', wrap).appendChild(begin);
    stagger(Array.from(wrap.children));
    return wrap;
  }

  /* ---------- Question card ---------- */
  function buildQuestion(step) {
    const q = step.q;
    const ch = chapters[step.ci];
    const wide = ['moods', 'palettes', 'type', 'ab', 'scale'].includes(q.type);
    const card = el('div', 'card stagger' + (wide ? ' is-wide' : ''));
    const head = el('div', 'card-head', '<span class="pill">' + esc(chapterTag(step.ci)) + '</span><span class="count">' + (step.qi + 1) + ' / ' + ch.questions.length + '</span>');
    const label = el('h2', 'q-label', esc(q.label));
    label.id = 'ql-' + q.id;
    const help = q.help ? el('p', 'q-help', esc(q.help)) : null;
    const body = el('div', 'q-body');
    const error = el('p', 'q-error');
    error.setAttribute('role', 'alert');
    const actions = el('div', 'q-actions');
    const next = primaryButton('Continue');
    next.addEventListener('click', advance);
    const hint = el('span', 'hint');
    actions.append(next, hint);

    const refresh = () => {
      error.textContent = '';
      const last = state.step === lastStepOf[step.ci];
      let text = isAnswered(q) ? (last ? 'Next chapter' : 'Continue') : q.required ? 'Continue' : 'Skip';
      if (isAnswered(q) && state.step === REVIEW - 1) text = 'Review answers';
      if (state.returnTo != null) text = 'Back to review';
      setLabel(next, text);
      $('#dockProgress').textContent = percent() + '% complete';
      save();
    };

    if (q.type === 'text' || q.type === 'email') renderText(q, body, hint, refresh);
    else if (q.type === 'longtext') renderLongText(q, body, hint, refresh);
    else if (q.type === 'choice') renderChoice(q, body, hint, refresh);
    else if (q.type === 'scale') renderScale(q, body, hint, refresh);
    else if (q.type === 'ab') renderAB(q, body, hint, refresh);
    else renderTiles(q, body, hint, refresh);

    card.append(head, label);
    if (help) card.append(help);
    card.append(body, error, actions);
    stagger([head, label, help, body, error, actions].filter(Boolean));
    refresh();
    return card;
  }

  function renderText(q, body, hint, refresh) {
    const field = el('div', 'field');
    const input = document.createElement('input');
    input.type = q.type === 'email' ? 'email' : 'text';
    input.id = 'f-' + q.id;
    input.setAttribute('aria-labelledby', 'ql-' + q.id);
    input.placeholder = q.placeholder || 'Type your answer';
    input.value = A[q.id] || '';
    if (q.autocomplete) input.autocomplete = q.autocomplete;
    if (q.type === 'email') { input.inputMode = 'email'; input.spellcheck = false; }
    if (q.required) input.required = true;
    input.addEventListener('input', () => { A[q.id] = input.value; refresh(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); advance(); }
    });
    field.appendChild(input);
    body.appendChild(field);
    hint.innerHTML = 'or press <kbd>Enter ↵</kbd>';
  }

  function renderLongText(q, body, hint, refresh) {
    const field = el('div', 'field');
    const ta = document.createElement('textarea');
    ta.id = 'f-' + q.id;
    ta.rows = 2;
    ta.setAttribute('aria-labelledby', 'ql-' + q.id);
    ta.placeholder = q.placeholder || 'Type your answer';
    ta.value = A[q.id] || '';
    const meta = el('div', 'field-meta', '<span>Enter adds a new line</span><span class="typed"></span>');
    const typed = $('.typed', meta);
    const grow = () => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
      const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
      typed.textContent = words + (words === 1 ? ' word' : ' words');
      typed.classList.toggle('is-on', words > 0);
    };
    ta.addEventListener('input', () => { A[q.id] = ta.value; grow(); refresh(); });
    field.appendChild(ta);
    body.append(field, meta);
    requestAnimationFrame(grow);
    hint.innerHTML = 'or press <kbd>' + (isMac ? '⌘' : 'Ctrl') + ' Enter</kbd>';
  }

  // Selection logic shared by chips, tiles and A/B cards.
  function bindSelection(q, items, refresh, opts) {
    opts = opts || {};
    const multi = !!q.multi;
    const selected = () => (multi ? (Array.isArray(A[q.id]) ? A[q.id] : []) : A[q.id] ? [A[q.id]] : []);
    const sync = () => {
      const sel = selected();
      items.forEach((item) => {
        const on = sel.includes(item.dataset.value);
        item.classList.toggle('is-on', on);
        item.setAttribute('aria-pressed', on ? 'true' : 'false');
        const key = $('.chip-key', item);
        if (key && item.dataset.key) key.textContent = q.ordered && on ? sel.indexOf(item.dataset.value) + 1 : item.dataset.key;
      });
      if (opts.onSync) opts.onSync(sel);
    };
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const value = item.dataset.value;
        let sel = selected().slice();
        if (multi) {
          if (sel.includes(value)) sel = sel.filter((x) => x !== value);
          else if (q.max && sel.length >= q.max) {
            item.classList.remove('is-blocked');
            void item.offsetWidth;
            item.classList.add('is-blocked');
            if (opts.onLimit) opts.onLimit();
            return;
          } else sel.push(value);
          A[q.id] = sel;
        } else {
          const was = A[q.id] === value;
          A[q.id] = was ? '' : value;
          if (!was && value !== OTHER) {
            const at = state.step;
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => { if (state.step === at) advance(); }, 520);
          }
        }
        sync();
        refresh();
        if (value === OTHER && selected().includes(OTHER) && opts.otherInput) setTimeout(() => opts.otherInput.focus(), 60);
      });
    });
    sync();
  }

  function otherField(q, refresh) {
    const wrap = el('div', 'field chip-other-input');
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'f-' + q.id + '-other';
    input.placeholder = 'Tell us more';
    input.setAttribute('aria-label', 'Other: tell us more');
    input.value = A[q.id + '__other'] || '';
    input.addEventListener('input', () => { A[q.id + '__other'] = input.value; refresh(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); advance(); } });
    wrap.appendChild(input);
    return { wrap, input };
  }

  function renderChoice(q, body, hint, refresh) {
    if (q.showMark) {
      body.appendChild(el('div', 'mark-preview',
        '<div class="glass-tile">' + MARK + '</div><div class="plain">' + MARK + '</div><div class="plain dark">' + MARK + '</div>'));
    }
    const list = el('div', 'chips' + (q.ordered ? ' is-ordered' : ''));
    list.setAttribute('role', 'group');
    list.setAttribute('aria-labelledby', 'ql-' + q.id);
    const options = q.options.concat(q.other ? [OTHER] : []);
    const items = options.map((opt, i) => {
      const b = el('button', 'chip', '<span class="chip-key">' + KEYS[i] + '</span><span class="chip-label">' + esc(opt) + '</span><span class="chip-check">' + ICON.check + '</span>');
      b.type = 'button';
      b.dataset.value = opt;
      b.dataset.key = KEYS[i];
      list.appendChild(b);
      return b;
    });
    body.appendChild(list);
    const other = q.other ? otherField(q, refresh) : null;
    if (other) body.appendChild(other.wrap);
    const note = q.max ? el('p', 'limit-note') : null;
    if (note) body.appendChild(note);
    const baseNote = q.max ? (q.ordered ? 'Pick up to ' + q.max + '. Your first pick ranks highest.' : 'Pick up to ' + q.max + '.') : '';
    bindSelection(q, items, refresh, {
      otherInput: other && other.input,
      onSync: (sel) => {
        if (other) other.wrap.hidden = !sel.includes(OTHER);
        if (note) { note.classList.remove('is-alert'); note.textContent = baseNote + (sel.length ? ' ' + sel.length + ' of ' + q.max + ' picked.' : ''); }
      },
      onLimit: () => {
        if (note) { note.classList.add('is-alert'); note.textContent = 'That’s ' + q.max + ' already. Tap one you picked to swap it out.'; }
      },
    });
    hint.innerHTML = 'Press <kbd>A</kbd>–<kbd>' + KEYS[options.length - 1] + '</kbd> to choose';
  }

  function renderScale(q, body, hint, refresh) {
    const wrap = el('div', 'scales');
    q.pairs.forEach((p) => {
      const key = scaleKey(q, p);
      const v = A[key];
      const row = el('div', 'scale-row' + (v != null ? ' is-set' : ''));
      row.innerHTML =
        '<span class="pole left">' + esc(p.left) + '</span>' +
        '<div class="range"><div class="range-ticks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<input type="range" min="1" max="5" step="1" id="f-' + key + '" value="' + (v || 3) + '" aria-label="' + esc(p.left + ' to ' + p.right) + '"></div>' +
        '<span class="pole right">' + esc(p.right) + '</span>';
      const input = $('input', row);
      const poles = () => {
        const n = A[key];
        $('.pole.left', row).classList.toggle('is-strong', n != null && n < 3);
        $('.pole.right', row).classList.toggle('is-strong', n != null && n > 3);
        input.setAttribute('aria-valuetext', n == null ? 'Not set' : describe(p, n));
      };
      const set = () => { A[key] = +input.value; row.classList.add('is-set'); poles(); refresh(); };
      input.addEventListener('input', set);
      input.addEventListener('change', set);
      poles();
      wrap.appendChild(row);
    });
    body.appendChild(wrap);
    hint.textContent = '';
  }

  function moodArt(value) {
    switch (value) {
      case 'Painted calm': return '<div class="mood mood-painted"><span class="badge">' + MARK + 'Flocket</span></div>';
      case 'Swiss precision': return '<div class="mood mood-swiss"><span class="disc"></span><span class="bar"></span><span class="word">flocket</span><span class="mk">' + MARK + '</span></div>';
      case 'Warm editorial': return '<div class="mood mood-editorial"><span class="kicker">No. 01 · Autumn</span><span class="word">Flocket</span><span class="rule"></span><span class="dek">Marketing, handled by a colleague who never clocks off.</span></div>';
      case 'Electric future': return '<div class="mood mood-future"><span class="orb a"></span><span class="orb b"></span><span class="glass">' + MARK + 'Flocket</span></div>';
      case 'Playful pop': return '<div class="mood mood-pop"><span class="blob a"></span><span class="blob b"></span><span class="mk">' + MARK + '</span><span class="word">Flocket!</span></div>';
      case 'Quiet luxury': return '<div class="mood mood-luxe"><span class="arch"></span><span class="stack">' + MARK + '<span class="word">FLOCKET</span></span></div>';
      default: return '';
    }
  }

  function tilt(tile) {
    if (!finePointer || reduceMotion) return;
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2) + 'deg');
      tile.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -7).toFixed(2) + 'deg');
    });
    tile.addEventListener('pointerleave', () => { tile.style.removeProperty('--rx'); tile.style.removeProperty('--ry'); });
  }

  function renderTiles(q, body, hint, refresh) {
    const grid = el('div', 'tiles');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', 'ql-' + q.id);
    const items = q.options.map((opt, i) => {
      let art = '';
      if (q.type === 'moods') art = moodArt(opt.value);
      if (q.type === 'palettes') art = '<div class="palette">' + opt.colors.map((c) => '<i style="background:' + c + '"></i>').join('') + '</div>';
      if (q.type === 'type') art = "<div class=\"specimen\" style='font-family:" + opt.family + ';font-weight:' + opt.weight + "'><span class=\"big\">Flocket</span><span class=\"small\">Your marketing, handled.</span></div>";
      const b = el('button', 'tile',
        '<span class="tile-badge">' + ICON.check + '</span>' + art +
        '<span class="tile-title"><span class="chip-key">' + KEYS[i] + '</span>' + esc(opt.value) + '</span>' +
        (q.type === 'palettes' ? '<span class="palette-hex">' + opt.colors.join(' ').toUpperCase() + '</span>' : '') +
        '<span class="tile-caption">' + esc(opt.caption) + '</span>');
      b.type = 'button';
      b.dataset.value = opt.value;
      b.dataset.key = KEYS[i];
      tilt(b);
      grid.appendChild(b);
      return b;
    });
    body.appendChild(grid);
    const note = q.max ? el('p', 'limit-note') : null;
    if (note) body.appendChild(note);
    bindSelection(q, items, refresh, {
      onSync: (sel) => { if (note) { note.classList.remove('is-alert'); note.textContent = 'Pick up to ' + q.max + '.' + (sel.length ? ' ' + sel.length + ' of ' + q.max + ' picked.' : ''); } },
      onLimit: () => { if (note) { note.classList.add('is-alert'); note.textContent = 'That’s ' + q.max + ' already. Tap one you picked to swap it out.'; } },
    });
    hint.innerHTML = 'Press <kbd>A</kbd>–<kbd>' + KEYS[q.options.length - 1] + '</kbd> to choose';
  }

  function renderAB(q, body, hint, refresh) {
    const grid = el('div', 'ab');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-labelledby', 'ql-' + q.id);
    const items = q.options.map((line, i) => {
      const b = el('button', 'tile',
        '<span class="tile-badge">' + ICON.check + '</span>' +
        '<span class="ab-quote">“' + esc(line) + '”</span>' +
        '<span class="ab-foot"><span class="chip-key">' + KEYS[i] + '</span><span class="ab-says">Option ' + KEYS[i] + '</span></span>');
      b.type = 'button';
      b.dataset.value = line;
      b.dataset.key = KEYS[i];
      tilt(b);
      grid.appendChild(b);
      return b;
    });
    const neither = el('button', 'btn-text ab-neither', 'Neither sounds like us');
    neither.type = 'button';
    neither.dataset.value = 'Neither';
    body.append(grid, neither);
    bindSelection(q, items.concat(neither), refresh, {
      onSync: (sel) => items.forEach((b, i) => { $('.ab-says', b).textContent = sel.includes(b.dataset.value) ? 'Sounds like Flocket' : 'Option ' + KEYS[i]; }),
    });
    hint.innerHTML = 'Press <kbd>A</kbd> or <kbd>B</kbd>';
  }

  /* ---------- Review ---------- */
  function buildReview() {
    const card = el('div', 'card is-wide stagger');
    const head = el('div', 'card-head', '<span class="pill">Review</span><span class="count">' + answeredCount() + ' of ' + questionSteps.length + ' answered</span>');
    const title = el('h2', 'q-label', 'Here’s everything you told us.');
    const help = el('p', 'q-help', 'Open a chapter to check your answers. Edit takes you to the question and straight back here.');
    const list = el('div', 'review');
    chapters.forEach((ch, ci) => {
      const qs = ch.questions;
      const done = qs.filter(isAnswered).length;
      const details = el('details', 'review-chapter');
      if (ci === 0) details.open = true;
      details.innerHTML =
        '<summary><span class="name">' + esc(ci === 0 ? 'Before we begin' : shortTitle(ch)) + '</span>' +
        '<span class="meter" aria-hidden="true"><i style="width:' + Math.round((done / qs.length) * 100) + '%"></i></span>' +
        '<span class="tally">' + done + ' of ' + qs.length + '</span>' + ICON.chev + '</summary>';
      const dl = el('dl', 'review-list');
      qs.forEach((q) => {
        const answer = display(q);
        const item = el('div', 'review-item',
          '<dt>' + esc(q.label) + '</dt><dd class="' + (answer ? '' : 'is-empty') + '">' + (answer ? esc(answer) : 'Skipped') + '</dd>');
        const edit = el('button', 'btn-text', 'Edit');
        edit.type = 'button';
        edit.setAttribute('aria-label', 'Edit: ' + q.label);
        edit.addEventListener('click', () => {
          state.returnTo = REVIEW;
          go(steps.findIndex((s) => s.q === q), 'prev');
        });
        item.appendChild(edit);
        dl.appendChild(item);
      });
      details.appendChild(dl);
      list.appendChild(details);
    });
    const actions = el('div', 'q-actions');
    const send = primaryButton('Send my answers');
    const errorBox = el('div', 'submit-error');
    errorBox.hidden = true;
    errorBox.setAttribute('role', 'alert');
    send.addEventListener('click', () => submit(send, errorBox));
    actions.appendChild(send);
    const note = el('p', 'submit-note',
      CFG.sheetEndpoint
        ? 'Your answers go straight to ' + esc(CFG.studioName) + '.'
        : 'Preview mode: answers stay on this device until the Google Sheet is connected.');
    card.append(head, title, help, list, actions, errorBox, note);
    stagger([head, title, help, list, actions, note]);
    return card;
  }

  /* ---------- Submission ---------- */
  function buildPayload() {
    const answers = {};
    const order = [];
    const schema = [];
    chapters.forEach((ch, ci) => {
      const chapter = ci === 0 ? 'Before we begin' : shortTitle(ch);
      ch.questions.forEach((q) => {
        if (q.type === 'scale') {
          q.pairs.forEach((p) => {
            const key = scaleKey(q, p);
            answers[key] = A[key] == null ? '' : A[key];
            order.push(key);
            schema.push({ key, chapter, label: p.left + ' (1) to ' + p.right + ' (5)' });
          });
        } else {
          answers[q.id] = display(q);
          order.push(q.id);
          schema.push({ key: q.id, chapter, label: q.label });
        }
      });
    });
    const now = new Date();
    return {
      responseId: state.responseId,
      submittedAt: now.toISOString(),
      startedAt: state.startedAt,
      minutesSpent: Math.max(1, Math.round((now - new Date(state.startedAt)) / 60000)),
      questionnaireVersion: CFG.version,
      answers,
      order,
      schema,
    };
  }

  async function send(payload) {
    const body = JSON.stringify(payload);
    // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight.
    const headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    try {
      const res = await fetch(CFG.sheetEndpoint, { method: 'POST', headers, body, redirect: 'follow' });
      if (!res.ok) throw new Error('The Sheet replied with HTTP ' + res.status + '.');
      const data = await res.json().catch(() => ({ ok: true }));
      if (data && data.ok === false) throw new Error(data.error || 'The Sheet rejected the answers.');
    } catch (err) {
      // A TypeError means the browser could not read the reply (network or CORS).
      // Send once more without reading the reply; the script ignores duplicate responseIds.
      if (!(err instanceof TypeError)) throw err;
      await fetch(CFG.sheetEndpoint, { method: 'POST', mode: 'no-cors', headers, body });
    }
  }

  async function submit(btn, errorBox) {
    const original = btn.innerHTML;
    btn.classList.add('is-loading');
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Sending…</span>';
    errorBox.hidden = true;
    try {
      const payload = buildPayload();
      if (CFG.sheetEndpoint) await send(payload);
      else await wait(900);
      state.submittedAt = payload.submittedAt;
      state.returnTo = null;
      save();
      go(THANKS, 'next');
    } catch (err) {
      btn.classList.remove('is-loading');
      btn.innerHTML = original;
      errorBox.hidden = false;
      errorBox.innerHTML = 'We couldn’t reach the Google Sheet. Check your connection and press Send again. Your answers are still saved on this device. ';
      const copy = el('button', 'btn-text', 'Copy my answers instead');
      copy.type = 'button';
      copy.addEventListener('click', () => copyAnswers(copy));
      errorBox.appendChild(copy);
    }
  }

  function answersAsText() {
    return chapters.map((ch, ci) => {
      const head = (ci === 0 ? 'Before we begin' : shortTitle(ch)).toUpperCase();
      return head + '\n' + ch.questions.map((q) => '- ' + q.label + '\n  ' + (display(q) || 'Skipped').replace(/\n/g, '\n  ')).join('\n');
    }).join('\n\n');
  }
  function copyAnswers(btn) {
    const text = answersAsText();
    const fallback = () => {
      const ta = el('textarea');
      ta.value = text;
      ta.readOnly = true;
      ta.style.cssText = 'width:100%;min-height:160px;margin-top:10px;border-radius:12px;padding:10px;font-size:12px';
      btn.replaceWith(ta);
      ta.select();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => { btn.textContent = 'Copied. Paste it into an email to us.'; }, fallback);
    } else fallback();
  }

  /* ---------- Thanks ---------- */
  function buildThanks() {
    const name = (A.name || '').trim();
    const wrap = el('div', 'hero stagger');
    wrap.innerHTML =
      '<span class="pill">Answers received</span>' +
      '<h2><span class="soft">Thank you' + (name ? ', ' + esc(name) : '') + '.</span>That’s everything we need.</h2>' +
      '<p>Your answers are with ' + esc(CFG.studioName) + '. Next we turn them into a brand brief and come back with directions for you to react to.</p>' +
      '<div class="hero-actions"></div>';
    const review = el('button', 'btn btn-glass', 'See my answers');
    review.type = 'button';
    review.addEventListener('click', () => go(REVIEW, 'prev'));
    $('.hero-actions', wrap).append(review, startOverButton('Start a fresh response'));
    stagger(Array.from(wrap.children));
    const holder = el('div');
    holder.style.display = 'contents';
    holder.append(wrap, el('div', 'ghost-word', 'Flocket'));
    launchFlock(9, 500);
    launchFlock(7, 1700);
    launchFlock(11, 3000);
    return holder;
  }

  /* ---------- Global input ---------- */
  document.addEventListener('keydown', (e) => {
    if (!booted || !current) return;
    const t = e.target;
    const typing = t.matches && t.matches('input:not([type=range]), textarea');
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const primary = $('[data-primary]', current);
      if (primary) primary.click();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Enter' && !(t.matches && t.matches('button, summary, a, input'))) {
      e.preventDefault();
      const primary = $('[data-primary]', current);
      if (primary) primary.click();
      return;
    }
    if (/^[a-z]$/i.test(e.key)) {
      const target = $('[data-key="' + e.key.toUpperCase() + '"]', current);
      if (target) { e.preventDefault(); target.click(); }
    }
  });

  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest && e.target.closest('.btn');
    if (!btn || reduceMotion) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const ripple = el('span', 'ripple');
    ripple.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  /* ---------- Loader and boot ---------- */
  let booted = false;
  $('#brandMark').innerHTML = MARK + '<span>Flocket</span>';

  function preload() {
    const srcs = new Set(['bg-hillside']);
    steps.forEach((s) => srcs.add(bgFor(s).src));
    const urls = Array.from(srcs).map((s) => 'assets/' + s + '.webp');
    const fill = $('#loaderFill');
    const status = $('#loaderStatus');
    const total = urls.length + 1;
    let done = 0;
    const tick = () => {
      done++;
      const p = done / total;
      fill.style.width = Math.round(p * 100) + '%';
      const word = p < 0.4 ? 'Painting the sky' : p < 0.75 ? 'Gathering the flock' : p < 1 ? 'Sharpening pencils' : 'Ready';
      status.textContent = word + ' · ' + Math.round(p * 100) + '%';
    };
    const images = urls.map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => { tick(); resolve(); };
      img.src = src;
    }));
    const fonts = (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(tick, tick);
    return Promise.race([Promise.all(images.concat(fonts)), wait(9000)]);
  }

  async function boot() {
    const loader = $('#loader');
    const started = performance.now();
    setTimeout(() => loader.classList.add('is-looping'), 1600);
    await preload();
    const elapsed = performance.now() - started;
    if (!reduceMotion && elapsed < 1900) await wait(1900 - elapsed);
    loader.classList.add('is-done');

    if (state.submittedAt) state.step = THANKS;
    else if (state.step > 0) { resumeStep = Math.min(state.step, REVIEW); state.step = 0; }
    chapters.forEach((_, ci) => { if (state.maxStep > lastStepOf[ci]) doneChapters.add(ci); });
    render('next');
    booted = true;
    launchFlock(7, 700);
  }
  boot();
})();
