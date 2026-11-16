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
  // az: around the tower, pol: from straight above, zoom: distance factor, px/pz: where the camera circles (pan)
  const HOME = { az: -0.62, pol: 1.08, zoom: 1, px: 0, pz: 0 };
  const LIM = { polMin: 0.3, polMax: 1.5, zMin: 0.32, zMax: 1.6, pan: 170 }, AUTO = reduced ? 0 : 0.1;   // rad, rad/s
  const s = { ...HOME, vAz: 0, vPol: 0, goal: null, lastInput: -1e9, visible: false, raf: 0, last: 0, frame: 0, d: 300 };
  const ptrs = new Map();   // active pointers on the canvas
  let model = null, loading = false, dirty = true, dpr = 1, w = 0, h = 0, heartbeat = 0, engaged = false, gesture = null;
  const clampView = () => {
    s.pol = Math.min(LIM.polMax, Math.max(LIM.polMin, s.pol)); s.zoom = Math.min(LIM.zMax, Math.max(LIM.zMin, s.zoom));
    const r = Math.hypot(s.px, s.pz); if (r > LIM.pan) { s.px *= LIM.pan / r; s.pz *= LIM.pan / r; }
  };
  const touched = () => { s.lastInput = performance.now(); s.goal = null; box.classList.add('was-dragged'); dirty = true; kick(); };

  function size() { const r = box.getBoundingClientRect(); w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height)); }
  function kick() { if (!s.raf && model) s.raf = requestAnimationFrame(loop); }
  function loop(now) {
    s.raf = 0;
    const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 0; s.last = now;
    if (!model || document.hidden || !s.visible) { s.last = 0; return; }
    const idle = !ptrs.size && now - s.lastInput > 4000;
    let moving = false;
    if (s.goal) {                                                                      // buttons and keys glide to their target
      const g = s.goal, k = Math.min(1, dt * 7); let done = true;
      for (const key of Object.keys(g)) { const dv = g[key] - s[key]; s[key] += dv * k; if (Math.abs(dv) > 0.0015) done = false; else s[key] = g[key]; }
      if (done) s.goal = null; moving = true;
    } else if (!ptrs.size && (Math.abs(s.vAz) > 0.002 || Math.abs(s.vPol) > 0.002)) { // inertia after a flick
      s.az += s.vAz * dt; s.pol += s.vPol * dt; clampView();
      const k = Math.exp(-dt * 3.2); s.vAz *= k; s.vPol *= k; moving = true;
    } else if (idle && AUTO) { s.az += AUTO * dt; moving = true; }
    if (moving || dirty || ptrs.size) {
      // phones: the slow idle turn runs at half rate, which keeps scrolling smooth
      if (!(mobile && idle && !dirty && (s.frame++ & 1))) { s.d = model.render(s.az, s.pol, s.zoom, { x: s.px, z: s.pz }) || s.d; dirty = false; }
    }
    if (moving || dirty || ptrs.size) kick(); else s.last = 0;
  }

  /* ---------------------------------------------------------------- input
     one finger / left mouse: turn in every direction · two fingers: pinch to zoom, drag to move ·
     right mouse or Shift + drag: move · Ctrl + wheel or trackpad pinch: zoom (plain wheel zooms once the model is in use) */
  const rotate = (dx, dy) => {
    const k = 5.2 / Math.max(320, w);                                                  // a full-width drag ≈ 300°
    s.az -= dx * k; s.pol -= dy * k * 0.8; clampView();
    return [-dx * k, -dy * k * 0.8];
  };
  const pan = (dx, dy) => {                                                            // move the ground under the finger
    const k = s.d * 1.1 / Math.max(320, h), ca = Math.cos(s.az), sa = Math.sin(s.az);
    const c = Math.max(0.35, Math.cos(s.pol));
    s.px += (-dx * ca - dy * sa / c) * k;
    s.pz += (dx * sa - dy * ca / c) * k;
    clampView();
  };
  const zoomBy = (f) => { s.zoom *= f; clampView(); };
  const two = () => { const [a, b] = [...ptrs.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    engaged = true; s.vAz = s.vPol = 0;
    gesture = ptrs.size >= 2 ? { mode: 'pinch', ...two() } : { mode: e.button === 2 || e.shiftKey ? 'pan' : 'rotate', vx: 0, vy: 0, t: performance.now() };
    touched();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p || !gesture) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y, now = performance.now();
    p.x = e.clientX; p.y = e.clientY;
    if (gesture.mode === 'pinch' && ptrs.size >= 2) {
      const g = two(); if (g.d > 10 && gesture.d > 10) zoomBy(gesture.d / g.d);
      pan(g.x - gesture.x, g.y - gesture.y); Object.assign(gesture, g);
    } else if (gesture.mode === 'pan') pan(dx, dy);
    else if (gesture.mode === 'rotate') {
      const dt = Math.max(0.008, (now - gesture.t) / 1000), [va, vp] = rotate(dx, dy);
      gesture.vx = va / dt; gesture.vy = vp / dt; gesture.t = now;
    }
    touched();
  });
  const end = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (gesture && gesture.mode === 'rotate' && !ptrs.size && performance.now() - gesture.t < 90) { s.vAz = Math.max(-4, Math.min(4, gesture.vx)); s.vPol = Math.max(-2, Math.min(2, gesture.vy)); }
    gesture = ptrs.size === 1 ? { mode: 'rotate', vx: 0, vy: 0, t: performance.now() } : ptrs.size >= 2 ? { mode: 'pinch', ...two() } : null;
    touched();
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);
  box.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') engaged = false; });
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !engaged) return;                                                // let the page scroll until the model is in use
    e.preventDefault(); zoomBy(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))); touched();
  }, { passive: false });
  canvas.addEventListener('keydown', (e) => {
    const st = Math.PI / 8, rtl = root.dir === 'rtl' ? -1 : 1, g = { az: s.az, pol: s.pol, zoom: s.zoom, ...(s.goal || {}) };
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') g.az += (e.key === 'ArrowLeft' ? st : -st) * rtl;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') g.pol = Math.min(LIM.polMax, Math.max(LIM.polMin, g.pol + (e.key === 'ArrowUp' ? -0.12 : 0.12)));
    else if (e.key === '+' || e.key === '=') g.zoom = Math.max(LIM.zMin, g.zoom / 1.35);
    else if (e.key === '-' || e.key === '_') g.zoom = Math.min(LIM.zMax, g.zoom * 1.35);
    else if (e.key === '0' || e.key === 'Home') Object.assign(g, HOME, { az: s.az - ((s.az - HOME.az) % (2 * Math.PI)) });
    else return;
    e.preventDefault(); touched(); s.goal = g; kick();
  });
  box.querySelectorAll('[data-hq-zoom]').forEach((b) => b.addEventListener('click', () => {
    const z = s.goal && s.goal.zoom !== undefined ? s.goal.zoom : s.zoom;
    touched(); s.goal = { zoom: Math.min(LIM.zMax, Math.max(LIM.zMin, b.dataset.hqZoom === 'in' ? z / 1.4 : z * 1.4)) }; kick();
  }));
  const reset = box.querySelector('[data-hq-reset]');
  if (reset) reset.addEventListener('click', () => { touched(); s.goal = { ...HOME, az: s.az - ((s.az - HOME.az) % (2 * Math.PI)) }; kick(); });

  /* ---------------------------------------------------------------- boot */
  async function boot() {
    if (loading || model) return;
    loading = true; box.classList.add('is-loading'); guard(true); dbg('boot');
    heartbeat = setInterval(() => { if (!document.hidden) guard(true); }, 3000);
    try {
      size();
      dpr = +params.get('dpr') || Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
      const { createModel } = await import('./hq/model.js?v=m5');
      model = await createModel({ canvas, mobile, width: w, height: h, dpr, lang: lang(), onStep: (x) => dbg('model ' + x) });
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); dbg('CONTEXT LOST'); fail(); });
      s.d = model.render(s.az, s.pol, s.zoom, { x: s.px, z: s.pz }) || s.d;
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
  window.__hq = { state: s, get ready() { return !!model; }, get engaged() { return engaged; }, info: () => model && { ...model.renderer.info.render, textures: model.renderer.info.memory.textures, geometries: model.renderer.info.memory.geometries } };
}
