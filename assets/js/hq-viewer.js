/* Digital Pass — the 3D model section: a picture of the HQ model until WebGL is ready, then the live model, which the
   visitor turns by dragging (or with the arrow keys). It turns slowly by itself while on screen and idle, renders only
   while something moves, loads only when the section comes near, and falls back to the picture on any failure.
   ?debug shows a step log; ?hq forces the live model even after a crash on this device. */
const box = document.querySelector('[data-hq]');
if (box) init();

function init() {
  const root = document.documentElement, canvas = box.querySelector('canvas');
  const params = new URLSearchParams(location.search);
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => (root.lang === 'en' ? 'en' : 'ar');

  /* debug log (on screen + localStorage) */
  const DBG = params.has('debug'), DKEY = 'dp-hq-dbg';
  let dlog = [], dbox = null, ended = false;
  const dbg = (m) => {
    if (!DBG) return;
    dlog.push((performance.now() / 1000).toFixed(1) + 's ' + m); if (dlog.length > 30) dlog.shift();
    try { localStorage.setItem(DKEY, JSON.stringify({ end: ended, log: dlog })); } catch (e) { /* ignore */ }
    if (dbox) dbox.lastChild.textContent = dlog.slice(-8).join('\n');
  };
  if (DBG) {
    let prev = null; try { prev = JSON.parse(localStorage.getItem(DKEY)); } catch (e) { /* ignore */ }
    dbox = document.createElement('div');
    dbox.setAttribute('style', 'position:fixed;z-index:9999;left:6px;right:6px;bottom:6px;max-height:40vh;overflow:auto;padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.82);color:#cfe;font:11px/1.35 ui-monospace,Menlo,monospace;direction:ltr;text-align:left;white-space:pre-wrap;pointer-events:none');
    dbox.append(document.createTextNode((prev ? 'PREVIOUS: ' + (prev.end ? 'ended normally' : 'CUT OFF (crash?)') + '\n' + (prev.log || []).slice(-10).join('\n') + '\n\n' : '') + 'NOW:\n'), document.createTextNode(''));
    document.body.append(dbox);
    addEventListener('pagehide', () => { ended = true; dbg('left'); });
    addEventListener('error', (e) => dbg('ERROR ' + e.message));
    dbg('load ' + innerWidth + 'x' + innerHeight + ' @' + devicePixelRatio);
  }

  /* crash guard: a fresh "running" flag found on load means the tab died while the model ran → picture only */
  const RUN = 'dp-hq-run', CRASH = 'dp-hq-crash';
  try {
    const t = +localStorage.getItem(RUN) || 0;
    if (sessionStorage.getItem(RUN) || (t && Date.now() - t < 20000)) localStorage.setItem(CRASH, '1');
    sessionStorage.removeItem(RUN); localStorage.removeItem(RUN);
  } catch (e) { /* storage blocked */ }
  let crashed = false; try { crashed = localStorage.getItem(CRASH) === '1'; } catch (e) { /* ignore */ }
  const guard = (on) => { try { if (on) { const v = String(Date.now()); sessionStorage.setItem(RUN, v); localStorage.setItem(RUN, v); } else { sessionStorage.removeItem(RUN); localStorage.removeItem(RUN); } } catch (e) { /* ignore */ } };
  addEventListener('pagehide', () => guard(false));

  const glOK = (() => { try { const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'); const l = g && g.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); return !!g; } catch (e) { return false; } })();
  if (!glOK || (crashed && !params.has('hq'))) { box.classList.add('is-static'); dbg('static: ' + (glOK ? 'crash flag' : 'no WebGL')); return; }

  /* ---------------------------------------------------------------- orbit state */
  const POL0 = 1.08, POL_MIN = 0.78, POL_MAX = 1.36, AUTO = reduced ? 0 : 0.11;   // rad, rad/s
  const s = { az: -0.62, pol: POL0, vAz: 0, vPol: 0, drag: null, lastInput: -1e9, visible: false, raf: 0, last: 0, frame: 0, keyTo: null };
  let model = null, loading = false, dirty = true, dpr = 1, w = 0, h = 0, heartbeat = 0;

  function size() { const r = box.getBoundingClientRect(); w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height)); }
  function kick() { if (!s.raf && model) s.raf = requestAnimationFrame(loop); }
  function loop(now) {
    s.raf = 0;
    const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0; s.last = now;
    if (!model || document.hidden || !s.visible) { s.last = 0; return; }
    const idle = !s.drag && now - s.lastInput > 2500;
    let moving = false;
    if (s.keyTo !== null) { const d = s.keyTo - s.az; s.az += d * Math.min(1, dt * 8); if (Math.abs(d) < 0.002) { s.az = s.keyTo; s.keyTo = null; } moving = true; }
    else if (!s.drag && (Math.abs(s.vAz) > 0.002 || Math.abs(s.vPol) > 0.002)) {     // inertia after a flick
      s.az += s.vAz * dt; s.pol = Math.min(POL_MAX, Math.max(POL_MIN, s.pol + s.vPol * dt));
      const k = Math.exp(-dt * 3.2); s.vAz *= k; s.vPol *= k; moving = true;
    } else if (idle && AUTO) { s.az += AUTO * dt; moving = true; }
    if (moving || dirty || s.drag) {
      // phones: the slow idle turn runs at half rate, which keeps scrolling smooth
      if (!(mobile && idle && !dirty && (s.frame++ & 1))) { model.render(s.az, s.pol); dirty = false; }
    }
    if (moving || dirty || s.drag) kick(); else s.last = 0;
  }

  /* ---------------------------------------------------------------- input */
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
    s.vAz = s.vPol = 0; s.keyTo = null; s.lastInput = performance.now();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    box.classList.add('was-dragged'); kick();
  });
  canvas.addEventListener('pointermove', (e) => {
    const d = s.drag; if (!d || e.pointerId !== d.id) return;
    const now = performance.now(), dx = e.clientX - d.x, dy = e.clientY - d.y, dt = Math.max(0.008, (now - d.t) / 1000);
    const k = 5.2 / Math.max(320, w);                                              // a full-width drag ≈ 300°
    s.az -= dx * k; d.vx = -dx * k / dt;
    if (e.pointerType === 'mouse') { s.pol = Math.min(POL_MAX, Math.max(POL_MIN, s.pol - dy * k * 0.6)); d.vy = -dy * k * 0.6 / dt; }
    d.x = e.clientX; d.y = e.clientY; d.t = now; s.lastInput = now; dirty = true; kick();
  });
  const end = (e) => {
    const d = s.drag; if (!d || (e && e.pointerId !== d.id)) return;
    if (performance.now() - d.t < 90) { s.vAz = Math.max(-4, Math.min(4, d.vx)); s.vPol = Math.max(-2, Math.min(2, d.vy)); }
    s.drag = null; s.lastInput = performance.now(); kick();
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);
  canvas.addEventListener('keydown', (e) => {
    const step = Math.PI / 8;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); s.keyTo = (s.keyTo ?? s.az) + (e.key === 'ArrowLeft' ? step : -step) * (root.dir === 'rtl' ? -1 : 1); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); s.pol = Math.min(POL_MAX, Math.max(POL_MIN, s.pol + (e.key === 'ArrowUp' ? -0.08 : 0.08))); dirty = true; }
    else return;
    s.lastInput = performance.now(); box.classList.add('was-dragged'); kick();
  });

  /* ---------------------------------------------------------------- boot */
  async function boot() {
    if (loading || model) return;
    loading = true; box.classList.add('is-loading'); guard(true); dbg('boot');
    heartbeat = setInterval(() => { if (!document.hidden) guard(true); }, 3000);
    try {
      size();
      dpr = +params.get('dpr') || Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
      const { createModel } = await import('./hq/model.js?v=m1');
      model = await createModel({ canvas, mobile, width: w, height: h, dpr, lang: lang(), onStep: (x) => dbg('model ' + x) });
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); dbg('CONTEXT LOST'); fail(); });
      model.render(s.az, s.pol);
      box.classList.remove('is-loading'); box.classList.add('is-ready');
      dirty = true; kick();
    } catch (err) { dbg('FAIL ' + (err && err.message)); console.error('[hq] 3D model failed, keeping the picture', err); fail(); }
    loading = false;
  }
  function fail() {
    clearInterval(heartbeat); guard(false);
    box.classList.remove('is-loading', 'is-ready'); box.classList.add('is-static');
    if (model) { try { model.renderer.dispose(); } catch (e) { /* ignore */ } }
    model = null;
  }

  // load when the section comes near; render only while it is on screen
  new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) boot(); }, { rootMargin: '80% 0px' }).observe(box);
  new IntersectionObserver((es) => { s.visible = es.some((e) => e.isIntersecting); dbg('visible ' + s.visible); if (s.visible) { dirty = true; kick(); } }).observe(box);
  if ('ResizeObserver' in window) new ResizeObserver(() => { const pw = w, ph = h; size(); if (model && (w !== pw || h !== ph)) { model.resize(w, h, dpr); dirty = true; kick(); } }).observe(box);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { guard(false); } else { if (model || loading) guard(true); dirty = true; kick(); }
  });
  new MutationObserver(() => { if (model) { model.setLang(lang()); dirty = true; kick(); } }).observe(root, { attributes: true, attributeFilter: ['lang'] });
  window.__hq = { state: s, get ready() { return !!model; }, info: () => model && { ...model.renderer.info.render, textures: model.renderer.info.memory.textures, geometries: model.renderer.info.memory.geometries } };
}
