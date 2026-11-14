/* Digital Pass — 3D scroll journey (sections 2-6).
   One fixed WebGL canvas, five distinct scenes spaced along -Z, one camera flying through a single
   Catmull-Rom path (one control point per text card + one transit point between scenes). */
import { THREE, C, clamp, lerp, smooth, V, pointUniforms, makePoints, pointsMaterial } from './util.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const journey = $('#journey'), hud = $('#jhud'), canvas = $('#jcanvas'), header = $('#site-header');
const secs = $$('.jsec', journey);
const cardsBySec = secs.map((s) => $$('[data-card]', s));
const allCards = cardsBySec.flat();
let cardIdx = [];
const params = new URLSearchParams(location.search);
const LITE_KEY = 'dp-lite';
const lang = () => (root.lang === 'en' ? 'en' : 'ar');
const isPortrait = () => (innerWidth < 900 ? innerWidth / innerHeight < 1.2 : innerWidth / innerHeight < .9);
const mobileQ = () => window.matchMedia('(pointer: coarse)').matches || innerWidth < 900;

/* ------------------------------------------------------------------ lite mode */
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
let liteReason = null;
function setLite(on, persist) {
  root.classList.toggle('jlite', on);
  const b = $('[data-lite-toggle]'); if (b) {
    b.setAttribute('aria-pressed', String(on));
    const s = $('span', b); s.dataset.i18n = on ? 'j.full' : 'j.lite'; s.dataset.ar = on ? 'تفعيل 3D' : 'وضع خفيف';
    const en = (window.DP_I18N && window.DP_I18N.en) || {}; s.textContent = lang() === 'en' ? en[s.dataset.i18n] : s.dataset.ar;
  }
  if (persist) { try { localStorage.setItem(LITE_KEY, on ? '1' : '0'); } catch (e) { /* storage blocked */ } }
  if (!on && !state.started) start();
  layout(); update(true);
}
$('[data-lite-toggle]').addEventListener('click', () => setLite(!root.classList.contains('jlite'), true));

/* ------------------------------------------------------------------ state */
const state = { started: false, ready: false, frames: 0, p: 0, pT: 0, idx: 0, live: false, dt: 0.016 };
window.__dp = state;
let N = 0, starts = [], counts = [], stopH = 600, vw = innerWidth, vh = innerHeight, journeyH = 0;

function layout() {
  vw = innerWidth; vh = innerHeight;
  const touch = mobileQ();
  const nh = touch ? Math.round(vh * .78) : Math.round(vh * .9);
  if (!layout.h || Math.abs(layout.h - vh) > 120 || layout.w !== vw || layout.t !== touch) { layout.h = vh; layout.w = vw; layout.t = touch; stopH = nh; }
  root.style.setProperty('--stopH', stopH + 'px');
  counts = cardsBySec.map((c) => c.length + 1);
  starts = []; let a = 0; counts.forEach((c) => { starts.push(a); a += c; }); N = a;
  secs.forEach((s, i) => s.style.setProperty('--n', counts[i]));
  journeyH = N * stopH;
  cardIdx = []; cardsBySec.forEach((cs, i) => cs.forEach((c, j) => cardIdx.push(starts[i] + j)));
}
state.maxScroll = () => journey.getBoundingClientRect().top + scrollY + journeyH - innerHeight;
state.journeyTop = () => journey.getBoundingClientRect().top + scrollY;
state.scrollForIdx = (i) => Math.round(state.journeyTop() + i * stopH);

/* counters on cards (only where cards are not numbered) */
secs.forEach((s, i) => {
  const numbered = !!$('.jc-num', s); const cs = cardsBySec[i];
  cs.forEach((c, j) => { const el = $('[data-count]', c); if (!el) return; if (numbered) el.remove(); else { el.textContent = (j + 1) + ' / ' + cs.length; el.setAttribute('dir', 'ltr'); } });
});

/* ------------------------------------------------------------------ rail links */
$$('.jrail a').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault(); const i = +a.dataset.rail;
  window.scrollTo({ top: state.scrollForIdx(starts[i]) + 2, behavior: root.classList.contains('jlite') ? 'auto' : 'smooth' });
}));

/* ------------------------------------------------------------------ DOM-side update (cards, rail, header) */
const railLinks = $$('.jrail a');
function update(force) {
  const rect = journey.getBoundingClientRect();
  const s = -rect.top;
  const live = rect.top < vh * 0.98 && rect.bottom > vh * 0.02;
  if (live !== state.live || force) { state.live = live; hud.classList.toggle('is-live', live); }
  const lite = root.classList.contains('jlite');
  header.classList.toggle('over-3d', live && rect.top <= header.offsetHeight && rect.bottom > header.offsetHeight && !lite);
  if (lite) return;
  state.s = s;
  state.pT = clamp(s / stopH, 0, Math.max(0, N - 1));
}
function updateCards() {
  const idx = state.p, rect = journey.getBoundingClientRect();
  const allowed = state.live && rect.top <= stopH * 0.12 && rect.bottom > vh * 0.55;
  allCards.forEach((c, ci) => {
    const gi = cardIdx[ci];
    const d = idx - gi;
    const on = allowed && Math.abs(d) < 0.44 && !(state.pT < gi - 0.5);
    if (on !== c._on) { c._on = on; c.classList.toggle('on', on); }
    const after = d > 0; if (after !== c._after) { c._after = after; c.classList.toggle('after', after); }
  });
  hud.style.setProperty('--jp', clamp(idx / Math.max(1, N - 1)).toFixed(4));
  let act = 0; starts.forEach((st, i) => { if (idx >= st - 0.001) act = i; });
  railLinks.forEach((a, i) => {
    const pr = clamp((idx - starts[i] + 0.35) / Math.max(1, counts[i] - 1 + 0.35));
    a.style.setProperty('--p', pr.toFixed(3)); a.firstElementChild.style.setProperty('--p', pr.toFixed(3));
    a.classList.toggle('is-active', i === act);
  });
  hud.classList.toggle('at-start', idx < 0.35 && state.s > -vh * .2);
  hud.classList.toggle('is-end', rect.bottom < stopH * 1.06);
}
addEventListener('scroll', () => update(), { passive: true });
addEventListener('resize', () => { layout(); resizeGL(); update(true); });
document.fonts && document.fonts.ready.then(() => { layout(); update(true); });
layout(); update(true);

/* ------------------------------------------------------------------ WebGL */
let renderer, scene, camera, composer, bloom, scenes = [], camP, camT, streaks, stars, lightsA, lightsB, dpr = 1, useBloom = false;
let pointer = { x: 0, y: 0, sx: 0, sy: 0 };
const BG = [0x071733, 0x050f27, 0x0a1842, 0x061528, 0x0a1b48].map((h) => new THREE.Color(h));
const SP = 240;
const origin = (i) => new THREE.Vector3(0, 0, -i * SP);
const textCtx = { lang, mobile: mobileQ(), q: 1, mask: null, handlers: [],
  onLang(fn) { this.handlers.push(fn); },
  t(key, ar) { if (lang() === 'ar') return ar; const en = (window.DP_I18N && window.DP_I18N.en) || {}; return (en[key] || ar).replace(/<br\s*\/?>/g, ' '); } };

async function loadMask() {
  const img = new Image(); img.src = 'assets/img/earth-mask.png';
  await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
  return { w: img.width, h: img.height, data: x.getImageData(0, 0, img.width, img.height).data };
}

async function start() {
  if (state.started) return; state.started = true;
  if (!webglOK()) { setLite(true, false); state.started = false; state.noWebGL = true; return; }
  try {
    textCtx.mask = await loadMask();
    const mods = await Promise.all(['./scene-about.js', './scene-services.js', './scene-work.js', './scene-process.js', './scene-why.js'].map((m) => import(m)));
    initGL(mods);
  } catch (err) { console.error('journey init failed', err); setLite(true, false); }
}

function initGL(mods) {
  const mobile = mobileQ(); textCtx.mobile = mobile; textCtx.q = mobile ? .55 : 1;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance', alpha: false });
  renderer.toneMapping = THREE.NoToneMapping;
  dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  scene = new THREE.Scene(); scene.background = BG[0].clone(); scene.fog = new THREE.Fog(BG[0].getHex(), 60, 240);
  camera = new THREE.PerspectiveCamera(58, vw / vh, .1, 900); scene.add(camera);

  scene.add(new THREE.HemisphereLight(0x9db8ff, 0x0a1b3d, 1.05));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0); dl.position.set(6, 14, 10); scene.add(dl);
  lightsA = new THREE.PointLight(C.cyan, 380, 70, 2); lightsB = new THREE.PointLight(C.blue, 380, 70, 2); scene.add(lightsA, lightsB);

  /* scenes + camera path: one control point per card, plus a transit point between scenes and an exit point */
  const builders = mods.map((m) => m.default);
  const P = [], T = [], firsts = [];
  builders.forEach((b, i) => {
    const o = origin(i), sc = b(textCtx); sc.origin = o; sc.group.position.copy(o); scene.add(sc.group); scenes.push(sc);
    if (sc.cam.length !== cardsBySec[i].length) console.error('scene ' + i + ' cam count ' + sc.cam.length + ' != cards ' + cardsBySec[i].length);
    sc.start = starts[i]; sc.n = counts[i];
    sc.cam.forEach((c) => { P.push(V(...c.p).add(o)); T.push(V(...c.t).add(o)); });
    if (i < builders.length - 1) {
      // transit point: midway to the next scene, looking forward along the travel direction
      const a = P[P.length - 1];
      sc._transitIndex = P.length; P.push(a.clone()); T.push(a.clone());
    } else {
      const e = sc.exit ? { p: V(...sc.exit.p).add(o), t: V(...sc.exit.t).add(o) } : { p: P[P.length - 1].clone().lerp(T[T.length - 1], .72), t: T[T.length - 1].clone() };
      P.push(e.p); T.push(e.t);
    }
  });
  // fill the transit points now that every scene's first stop is known
  scenes.forEach((sc, i) => {
    if (sc._transitIndex === undefined) return;
    const a = P[sc._transitIndex - 1], b = P[starts[i + 1]]; // starts[] counts the transit points, so the next scene's first point is at starts[i+1]
    const mid = a.clone().lerp(b, .5); mid.y += 5; mid.x *= .5;
    P[sc._transitIndex].copy(mid); T[sc._transitIndex].copy(mid).add(b.clone().sub(a).normalize().multiplyScalar(40));
  });
  state.P = P;
  camP = new THREE.CatmullRomCurve3(P, false, 'centripetal'); camT = new THREE.CatmullRomCurve3(T, false, 'centripetal');

  /* starfield following the camera */
  { const n = Math.round(1600 * textCtx.q), pos = [], col = [], sz = [], ph = []; const c = new THREE.Color();
    for (let i = 0; i < n; i++) { const r = 300 + Math.random() * 200, th = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = Math.sqrt(1 - u * u);
      pos.push(r * s * Math.cos(th), r * u, r * s * Math.sin(th)); c.set(Math.random() < .5 ? C.cyan : C.b300).multiplyScalar(.5 + Math.random() * .9); col.push(c.r, c.g, c.b); sz.push(.9 + Math.random() * 1.6); ph.push(Math.random()); }
    stars = makePoints(pos, col, sz, ph, pointsMaterial({ twinkle: 1 })); scene.add(stars); }
  /* warp streaks (camera-attached) */
  { const n = Math.round(260 * textCtx.q), arr = new Float32Array(n * 6); streaks = { n, arr, geo: new THREE.BufferGeometry(), seeds: [] };
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 2.5 + Math.pow(Math.random(), .7) * 18; streaks.seeds.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: -Math.random() * 90, v: .6 + Math.random() }); }
    streaks.geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    streaks.line = new THREE.LineSegments(streaks.geo, new THREE.LineBasicMaterial({ color: 0x8fe6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    streaks.line.frustumCulled = false; camera.add(streaks.line); }

  /* post */
  useBloom = !mobile;
  if (useBloom) {
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(vw * dpr, vh * dpr, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(vw, vh), .5, .6, .88); composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  resizeGL();
  addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; pointer.x = e.clientX / vw * 2 - 1; pointer.y = e.clientY / vh * 2 - 1; }, { passive: true });
  new MutationObserver(() => textCtx.handlers.forEach((f) => f())).observe(root, { attributes: true, attributeFilter: ['lang'] });
  document.addEventListener('visibilitychange', () => { state.hidden = document.hidden; });
  state.ready = true; state.N = N; state.starts = starts;
  update(true); state.p = state.pT;
  requestAnimationFrame(frame);
}

function resizeGL() {
  if (!renderer) return;
  renderer.setSize(vw, vh, false); camera.aspect = vw / vh;
  pointUniforms.uScale.value = vh * dpr * .5 / Math.tan(THREE.MathUtils.degToRad(29));
  if (composer) { composer.setPixelRatio(dpr); composer.setSize(vw, vh); }
  if (bloom) bloom.resolution.set(vw, vh);
  applyView();
}
function applyView() {
  const rtl = root.dir !== 'ltr'; const portrait = isPortrait();
  let ox = 0, oy = 0;
  if (!portrait) {
    // shift the subject into the free area beside the text card (measured from the real card box)
    let sh = vw * .19; const el = document.querySelectorAll('.jc')[1];
    if (el) { const r = el.getBoundingClientRect(); if (r.width > 40) { const m = rtl ? vw - r.right : r.left; sh = Math.min(vw * .3, (r.width + Math.max(0, m)) / 2 + 6); } }
    ox = (rtl ? 1 : -1) * sh;
    // narrower landscape screens leave less free room beside the card: pull the camera back so the subject fits it
    camera.userData.dist = Math.min(1.9, Math.max(1, .9 / Math.max(.3, (vw - 2 * sh + vw * .0) / vh)));
  } else { oy = vh * .2; camera.userData.dist = 0; }
  camera.setViewOffset(vw, vh, ox, oy, vw, vh);
  camera.userData.portrait = portrait; camera.userData.rtl = rtl;
}

const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), tmpD = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
const bgc = new THREE.Color();
let last = performance.now(), slow = 0, acc = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - last) / 1000); last = now; state.dt = dt;
  update();
  if (root.classList.contains('jlite') || !state.live || document.hidden) return;
  if (camera.userData.portrait !== isPortrait() || camera.userData.rtl !== (root.dir !== 'ltr')) applyView();
  const time = now / 1000; pointUniforms.uTime.value = time;
  // smoothed scroll position
  const kk = 1 - Math.exp(-dt * 6.5); state.p += (state.pT - state.p) * kk; if (Math.abs(state.pT - state.p) < 1e-4) state.p = state.pT;
  const idx = state.p; state.idx = idx;
  const t = clamp(idx / Math.max(1, N - 1));
  camP.getPoint(t, tmpP); camT.getPoint(t, tmpT);
  // distance scale on narrow screens so subjects fit
  const aspect = vw / vh; const fovBase = 58 + Math.min(16, Math.max(0, (1 - aspect) * 30));
  if (camera.userData.dist > 1) { tmpD.copy(tmpP).sub(tmpT).multiplyScalar(camera.userData.dist); tmpP.copy(tmpT).add(tmpD); }
  else if (aspect < 1.15) { const s = Math.min(1.55, 1 + (1.15 - aspect) * .8); tmpD.copy(tmpP).sub(tmpT).multiplyScalar(s); tmpP.copy(tmpT).add(tmpD); }
  // pointer parallax + idle sway
  pointer.sx += (pointer.x - pointer.sx) * .05; pointer.sy += (pointer.y - pointer.sy) * .05;
  tmpD.copy(tmpT).sub(tmpP).normalize(); right.crossVectors(tmpD, up).normalize();
  tmpP.addScaledVector(right, pointer.sx * .7 + Math.sin(time * .35) * .12).addScaledVector(up, -pointer.sy * .4 + Math.cos(time * .28) * .1);
  camera.position.copy(tmpP); camera.lookAt(tmpT);
  // transit weight (nearest boundary)
  let w = 0; for (let i = 0; i < scenes.length - 1; i++) { const tb = starts[i] + counts[i] - 1; w = Math.max(w, 1 - clamp(Math.abs(idx - tb) / 0.9)); }
  w = w * w * (3 - 2 * w);
  camera.fov = fovBase + 24 * w; camera.updateProjectionMatrix();
  hud.style.setProperty('--w', (w * .6).toFixed(3));
  const endFade = clamp(journey.getBoundingClientRect().bottom / (stopH * .9));
  hud.style.setProperty('--f', (smooth(N - 1.55, N - 1.02, idx) * endFade * endFade).toFixed(3));
  // streaks
  const lm = streaks.line.material; lm.opacity = Math.min(.75, w * 1.1);
  streaks.line.visible = w > .02;
  if (streaks.line.visible) {
    const a = streaks.arr, sp = (20 + 140 * w) * dt, len = 2 + 22 * w;
    streaks.seeds.forEach((s, i) => { s.z += sp * s.v; if (s.z > 2) s.z = -90 - Math.random() * 10; a[i * 6] = s.x; a[i * 6 + 1] = s.y; a[i * 6 + 2] = s.z; a[i * 6 + 3] = s.x; a[i * 6 + 4] = s.y; a[i * 6 + 5] = s.z - len * s.v; });
    streaks.geo.attributes.position.needsUpdate = true;
  }
  stars.position.copy(camera.position);
  // background + fog + lights follow the current scene
  let si = 0; for (let i = 0; i < scenes.length; i++) if (idx >= starts[i] - .001) si = i;
  const tb = starts[si] + counts[si] - 1; const nb = Math.min(scenes.length - 1, si + 1);
  const bf = si < scenes.length - 1 ? smooth(tb - 0.4, tb + 0.5, idx) : 0;
  bgc.copy(BG[si]).lerp(BG[nb], bf); scene.background.copy(bgc); scene.fog.color.copy(bgc);
  const lo = origin(si).lerp(origin(nb), bf);
  lightsA.position.set(lo.x + 9, lo.y + 11, lo.z + 9); lightsB.position.set(lo.x - 10, lo.y + 6, lo.z - 5);
  // scenes
  scenes.forEach((sc, i) => {
    const vis = idx > sc.start - 1.25 && idx < sc.start + sc.n + 0.25; sc.group.visible = vis;
    if (vis) sc.update(time, idx - sc.start, dt, camera);
  });
  updateCards();
  if (composer) composer.render(dt); else renderer.render(scene, camera);
  state.frames++;
  // adaptive quality (skip under automation)
  if (!navigator.webdriver && !params.has('hq')) {
    acc += dt; slow += dt > .036 ? 1 : 0;
    if (state.frames % 90 === 0) { if (slow > 45 && dpr > 1) { dpr = Math.max(1, dpr - .25); renderer.setPixelRatio(dpr); resizeGL(); } else if (slow > 60 && useBloom) { useBloom = false; composer = null; renderer.setPixelRatio(1); } slow = 0; }
  }
}

/* ------------------------------------------------------------------ boot */
function boot() {
  const prefersLite = root.classList.contains('jlite');
  if (prefersLite) { const b = $('[data-lite-toggle]'); setLite(true, false); return; }
  start();
}
boot();
