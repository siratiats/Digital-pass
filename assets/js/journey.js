/* Digital Pass — sections 2-6: a tour of the Digital Pass HQ.
   The page reads fine without this file: by default the five sections are a static layout of cards. When 3D is on
   (html.j3d, set by the inline script in <head>), every text card gets a stop on the scroll and the WebGL stage
   (./hq/stage.js, loaded once the page has settled) walks the camera through the building in step with the cards:
   the forecourt and lobby, a lift ride to each floor, the roof. Any failure falls back to the static layout. */
const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

const journey = $('#journey'), hud = $('#jhud'), canvas = $('#jcanvas'), liteBtn = $('[data-lite-toggle]');
const secs = $$('.jsec', journey), cardsBySec = secs.map((s) => $$('[data-card]', s)), allCards = cardsBySec.flat();
const railLinks = $$('.jrail a'), liftNum = $('.jl-num'), liftLabel = $('.jl-label');
const params = new URLSearchParams(location.search), LITE_KEY = 'dp-lite';
const lang = () => (root.lang === 'en' ? 'en' : 'ar');
const EN = () => (window.DP_I18N && window.DP_I18N.en) || {};
const is3d = () => root.classList.contains('j3d');
const mobileQ = () => matchMedia('(pointer: coarse)').matches || innerWidth < 900;
const isPortrait = () => (innerWidth < 900 ? innerWidth / innerHeight < 1.2 : innerWidth / innerHeight < 0.9);
const headerH = () => parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 80;

const state = { ready: false, p: 0, pT: 0, idx: 0, s: 0, live: false, frames: 0 };
window.__dp = state;
let N = 0, starts = [], counts = [], lastCards = [], cardIdx = [], stopH = 500, vw = innerWidth, vh = innerHeight;
let stage = null, loading = false, dirty = true, raf = 0, last = 0, dpr = 1, curLang = lang(), floorShown = '';
const view = { ox: 0, oy: 0, portrait: false, rtl: true };
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

/* ------------------------------------------------------------------ helpers */
function instantScroll(top) {                       // the site sets scroll-behavior: smooth on <html>
  const prev = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
  window.scrollTo(0, Math.max(0, Math.round(top))); root.style.scrollBehavior = prev;
}
const journeyTop = () => journey.getBoundingClientRect().top + scrollY;
state.scrollForIdx = (i) => Math.round(journeyTop() + i * stopH);
state.jump = () => { update(); state.p = state.pT; dirty = true; kick(); };   // settle on the current stop at once (focus moves, tests)
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
/* text drawn on the signs and screens: Arabic from the caller, English from the site's dictionary */
const t = (key, ar) => (curLang === 'en' ? String(EN()[key] || ar).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '') : ar);

/* ------------------------------------------------------------------ layout: one stop per card, one per lift ride */
function layout() {
  vw = innerWidth; vh = innerHeight;
  const touch = mobileQ();
  // ignore the mobile URL bar showing/hiding: keep the stop height unless the screen really changed
  if (!layout.h || Math.abs(layout.h - vh) > 120 || layout.w !== vw || layout.t !== touch) {
    layout.h = vh; layout.w = vw; layout.t = touch;
    stopH = Math.max(touch ? 340 : 420, Math.round(vh * (touch ? 0.5 : 0.56)));
  }
  root.style.setProperty('--stopH', stopH + 'px');
  root.style.setProperty('--jendH', Math.max(0, vh - stopH) + 'px');   // the contact section arrives only after the last stop
  counts = cardsBySec.map((c) => c.length + 1);
  starts = []; let a = 0; counts.forEach((c) => { starts.push(a); a += c; }); N = a;
  lastCards = cardsBySec.map((c, i) => starts[i] + c.length - 1);
  secs.forEach((s, i) => s.style.setProperty('--n', counts[i]));
  cardIdx = []; cardsBySec.forEach((cs, i) => cs.forEach((c, j) => cardIdx.push(starts[i] + j)));
  state.N = N; state.starts = starts;
}
/* the subject of each view sits in the free area beside the card (or above the bottom sheet on tall screens) */
function applyView() {
  view.rtl = root.dir !== 'ltr'; view.portrait = isPortrait(); view.ox = 0; view.oy = 0;
  if (!view.portrait) {
    let sh = vw * 0.19; const el = allCards[1];
    if (el) { const r = el.getBoundingClientRect(); if (r.width > 40) { const m = view.rtl ? vw - r.right : r.left; sh = Math.min(vw * 0.3, (r.width + Math.max(0, m)) / 2 + 6); } }
    view.ox = (view.rtl ? 1 : -1) * sh;
  } else view.oy = vh * 0.2;
}

/* card counters (sections whose cards are not numbered) */
secs.forEach((s, i) => {
  const numbered = !!$('.jc-num', s), cs = cardsBySec[i];
  cs.forEach((c, j) => { const el = $('[data-count]', c); if (!el) return; if (numbered) el.remove(); else { el.textContent = (j + 1) + ' / ' + cs.length; el.setAttribute('dir', 'ltr'); } });
});

/* ------------------------------------------------------------------ scroll → stop */
function update() {
  const r = journey.getBoundingClientRect();
  const live = r.top < vh * 0.98 && r.bottom > vh * 0.3;           // below 0.45vh the last view has already faded out
  if (live !== state.live) { state.live = live; hud.classList.toggle('is-live', live); }
  const pinned = live && r.top < vh * 0.3 && r.bottom > vh * 0.6;
  if (pinned !== state.pinned) { state.pinned = pinned; hud.classList.toggle('is-pinned', pinned); }
  if (!is3d()) return;
  state.s = -r.top;
  state.pT = clamp(state.s / stopH, 0, Math.max(0, N - 1));
  if (live) kick();
}
function updateCards() {
  const idx = state.p, r = journey.getBoundingClientRect();
  const allowed = state.live && r.top <= stopH * 0.12 && r.bottom > vh * 0.55;
  allCards.forEach((c, ci) => {
    const gi = cardIdx[ci], d = idx - gi;
    const on = allowed && Math.abs(d) < 0.44 && !(state.pT < gi - 0.5);
    if (on !== c._on) { c._on = on; c.classList.toggle('on', on); }
    const after = d > 0; if (after !== c._after) { c._after = after; c.classList.toggle('after', after); }
  });
  hud.style.setProperty('--jp', clamp(idx / Math.max(1, N - 1)).toFixed(4));
  let act = 0; starts.forEach((st, i) => { if (idx >= st - 0.6) act = i; });
  railLinks.forEach((a, i) => {
    const pr = clamp((idx - starts[i] + 0.35) / Math.max(1, counts[i] - 1 + 0.35)).toFixed(3);
    if (a._p !== pr) { a._p = pr; a.firstElementChild.style.setProperty('--p', pr); }
    const on = i === act; if (on !== a._on) { a._on = on; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); }
  });
  hud.classList.toggle('at-start', idx < 0.35 && state.s > -vh * 0.2);
  hud.classList.toggle('is-end', r.bottom < vh + stopH * 0.5);
  // the last view fades into the page background while the contact section slides up over it
  const f = 1 - smooth(0.45, 1, r.bottom / vh); if (f.toFixed(3) !== state.f) { state.f = f.toFixed(3); hud.style.setProperty('--f', state.f); hud.classList.toggle('has-f', f > 0); }
  // the lift display shows while riding between two sections
  let ride = -1; for (let i = 0; i < lastCards.length - 1; i++) if (idx > lastCards[i] + 0.5 && idx < lastCards[i] + 1.55) ride = i;
  hud.classList.toggle('is-riding', ride >= 0 && !!stage);
  if (ride >= 0) { const l = railLinks[ride + 1] && $('.jr-label', railLinks[ride + 1]); if (l && liftLabel.textContent !== l.textContent) liftLabel.textContent = l.textContent; }
}

/* ------------------------------------------------------------------ frame loop: renders only while something moves */
function kick() { if (!raf) raf = requestAnimationFrame(frame); }
let slow = 0, timed = 0;
function frame(now) {
  raf = 0;
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
  if (!is3d()) { last = 0; return; }
  const k = 1 - Math.exp(-dt * 6.5);
  state.p += (state.pT - state.p) * k; if (Math.abs(state.pT - state.p) < 1e-4) state.p = state.pT;
  pointer.sx += (pointer.x - pointer.sx) * 0.07; pointer.sy += (pointer.y - pointer.sy) * 0.07;
  const moving = state.p !== state.pT || Math.abs(pointer.x - pointer.sx) + Math.abs(pointer.y - pointer.sy) > 0.002;
  updateCards();
  if (stage && state.live && !document.hidden && (moving || dirty)) {
    dirty = false; render();
    // adaptive resolution: lower the pixel ratio a step if frames keep running slow (details always stay)
    if (dt && !navigator.webdriver && !params.has('dpr')) {
      timed++; if (dt > 0.034) slow++;
      if (timed >= 50) { if (slow > 30 && dpr > 1) { dpr = Math.max(1, Math.round((dpr - 0.25) * 4) / 4); stage.resize(vw, vh, dpr); dirty = true; } timed = 0; slow = 0; }
    }
  }
  state.frames++;
  if (state.live && (moving || dirty)) kick(); else last = 0;
}
function render() {
  const idx = state.p; state.idx = idx;
  // during a lift ride there is no card: centre the view
  let w = 0; for (let i = 0; i < lastCards.length - 1; i++) { const a = lastCards[i]; w = Math.max(w, smooth(a + 0.3, a + 0.62, idx) * (1 - smooth(a + 1.4, a + 1.75, idx))); }
  const y = stage.frame(idx, { w: vw, h: vh, ox: view.ox * (1 - w), oy: view.oy * (1 - w), px: pointer.sx, py: pointer.sy, portrait: view.portrait });
  const fl = Math.round((y - 1.62) / 4), code = fl < 1 ? 'G' : fl >= 23 ? 'R' : String(fl).padStart(2, '0');
  if (code !== floorShown) { floorShown = code; liftNum.textContent = code; }
}

/* ------------------------------------------------------------------ the WebGL stage (lazy) */
async function boot3d() {
  if (stage || loading || !is3d()) return;
  loading = true; hud.classList.add('is-loading'); guard(true);
  try {
    const mobile = mobileQ();
    dpr = +params.get('dpr') || Math.min(window.devicePixelRatio || 1, 1.5);
    const { createStage } = await import('./hq/stage.js?v=hq1');
    stage = await createStage({ canvas, cards: cardsBySec.map((c) => c.length), t, lang: curLang, mobile, width: vw, height: vh, dpr, onChange: () => { dirty = true; kick(); } });
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(new Error('WebGL context lost')); });
    state.ready = true; loading = false;
    hud.classList.remove('is-loading'); hud.classList.add('is-ready');
    state.p = state.pT; dirty = true; update(); kick();
  } catch (err) {
    loading = false; console.error('[journey] 3D stage failed, showing the static layout', err); fail(err);
  }
}
function fail() {
  guard(false); hud.classList.add('no-3d'); hud.classList.remove('is-loading', 'is-ready', 'is-riding');
  if (is3d()) setMode(false, false);
  stage = null;
}
function scheduleBoot() {
  if (!is3d() || params.has('nostage')) return;   // ?nostage: the 3D layout without WebGL (diagnostics)
  const go = () => { if ('requestIdleCallback' in window) requestIdleCallback(() => boot3d(), { timeout: 1500 }); else setTimeout(boot3d, 200); };
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  // or right away when the reader is already close to the tour
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); boot3d(); } }, { rootMargin: '120% 0px' });
    io.observe(journey);
  }
}

/* ------------------------------------------------------------------ 3D ⇄ static (keeps the reader's place) */
function currentCard() {
  if (is3d()) { const r = journey.getBoundingClientRect(); if (r.top > 0 || r.bottom < 0) return null; let best = 0; cardIdx.forEach((g, i) => { if (Math.abs(g - state.pT) < Math.abs(cardIdx[best] - state.pT)) best = i; }); return allCards[best]; }
  const hh = headerH(); return allCards.find((c) => c.getBoundingClientRect().bottom > hh + 40) || null;
}
function setMode(want3d, persist) {
  const card = state.live ? currentCard() : null;
  root.classList.toggle('j3d', want3d); guard(want3d && (loading || !!stage));
  if (persist) { try { localStorage.setItem(LITE_KEY, want3d ? '0' : '1'); } catch (e) { /* storage blocked */ } }
  updateLiteBtn(); layout(); applyView();
  if (card) {
    const i = allCards.indexOf(card);
    if (want3d) { instantScroll(journeyTop() + cardIdx[i] * stopH); } else instantScroll(card.getBoundingClientRect().top + scrollY - headerH() - 16);
  }
  allCards.forEach((c) => { c._on = false; c.classList.remove('on', 'after'); c._after = undefined; });
  update(); state.p = state.pT; dirty = true;
  if (want3d) { if (stage) kick(); else boot3d(); }
}
function updateLiteBtn() {
  if (!liteBtn) return;
  const on3d = is3d(), s = $('span', liteBtn);
  liteBtn.setAttribute('aria-pressed', String(!on3d));
  s.dataset.i18n = on3d ? 'j.lite' : 'j.full'; s.dataset.ar = on3d ? 'وضع خفيف' : 'تفعيل 3D';
  s.textContent = lang() === 'en' ? (EN()[s.dataset.i18n] || s.dataset.ar) : s.dataset.ar;
}

/* ------------------------------------------------------------------ events */
liteBtn && liteBtn.addEventListener('click', () => setMode(!is3d(), true));
railLinks.forEach((a) => a.addEventListener('click', (e) => {
  if (!is3d()) return;
  e.preventDefault(); const i = +a.dataset.rail;
  window.scrollTo({ top: state.scrollForIdx(starts[i]) + 2, behavior: 'smooth' });
}));
// keyboard and screen-reader users: focusing something inside a card brings that card's stop into view
journey.addEventListener('focusin', (e) => {
  if (!is3d()) return;
  const card = e.target.closest('[data-card]'), i = allCards.indexOf(card); if (i < 0) return;
  const top = journeyTop() + cardIdx[i] * stopH;
  if (Math.abs(scrollY - top) > 4) { instantScroll(top); state.jump(); }
});
addEventListener('scroll', update, { passive: true });
addEventListener('resize', () => { layout(); applyView(); if (stage) stage.resize(vw, vh, dpr); update(); dirty = true; kick(); });
addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; pointer.x = e.clientX / vw * 2 - 1; pointer.y = e.clientY / vh * 2 - 1; if (state.live && stage) kick(); }, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { dirty = true; kick(); } });
new MutationObserver(() => {
  if (lang() === curLang) return;
  curLang = lang(); updateLiteBtn(); applyView();
  if (stage) stage.setLang(curLang);
  dirty = true; kick();
}).observe(root, { attributes: true, attributeFilter: ['lang', 'dir'] });
document.fonts && document.fonts.ready.then(() => { layout(); applyView(); update(); dirty = true; kick(); });

/* ------------------------------------------------------------------ boot */
/* crash guard: a flag lives in sessionStorage while the 3D tour runs in a visible tab. If the browser tab crashes
   (Safari reloads it), the inline script in <head> finds the flag, switches this device to the static layout for good
   and the "Enable 3D" button is hidden. Leaving, reloading or hiding the tab clears the flag. */
const GUARD = 'dp-3d-run', CRASH = 'dp-3d-crash';
const guard = (on) => {
  try {
    if (on && is3d() && !document.hidden) { const v = String(Date.now()); sessionStorage.setItem(GUARD, v); localStorage.setItem(GUARD, v); }
    else { sessionStorage.removeItem(GUARD); localStorage.removeItem(GUARD); }
  } catch (e) { /* storage blocked */ }
};
setInterval(() => { if (!document.hidden && (loading || stage) && is3d()) guard(true); }, 3000);   // heartbeat: the head script only trusts a fresh flag
let crashed = false; try { crashed = localStorage.getItem(CRASH) === '1'; } catch (e) { /* storage blocked */ }
addEventListener('pagehide', () => guard(false));
document.addEventListener('visibilitychange', () => guard(!document.hidden && (loading || !!stage)));
const canGL = webglOK() && (!crashed || params.get('lite') === '0');
if (!canGL) { hud.classList.add('no-3d'); if (is3d()) root.classList.remove('j3d'); }
updateLiteBtn(); layout(); applyView(); update();
state.p = state.pT;
scheduleBoot();
