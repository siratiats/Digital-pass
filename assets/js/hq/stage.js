/* Digital Pass HQ — the WebGL stage: renderer, lights, the camera's route through the building and the frame update.
   journey.js owns scrolling and the text cards; it calls frame(stop, view) whenever something moved. */
import { THREE, clamp, lerp, smooth, setAniso, setTexScale, releaseCanvas, setLang, redrawText, loadBrand, logoGeometry, symbolGeometry, makeSky } from './core.js';
import { buildSite, HQ } from './site.js';
import { buildFloors, SVC, ROOF, ROOMS, WORK, arc } from './floors.js';

const SKY = [[-90, '#d6dadd'], [-2, '#e4e7ea'], [0, '#f2f5f8'], [5, '#e9f0f7'], [15, '#d6e5f3'], [35, '#bcd5ef'], [65, '#a3c4ea'], [90, '#97bce7']];
const EYE = 1.62, UP = new THREE.Vector3(0, 1, 0);
const tick = () => new Promise((r) => setTimeout(r, 0));

/* ---------- the route: one pose per text card, a lift ride between sections ----------
   Keys are [x, y, z, yaw, pitch, fov] at a stop index t (yaw 0 looks along +z). Between keys the values follow
   monotone cubic curves, so the camera eases into every stop and never overshoots a floor level. */
function route(cards) {
  const [G0, F6, F11, F16, RF] = HQ.levels, L = HQ.lift, keys = [];
  const look = (t, p, at, o = {}) => {
    const dx = at[0] - p[0], dy = at[1] - p[1], dz = at[2] - p[2], d = Math.hypot(dx, dz);
    keys.push({ t, v: [p[0], p[1], p[2], Math.atan2(dx, dz), Math.atan2(dy, d), o.fov || 58], par: o.par ?? 0.12, pm: o.pm || 1, d: Math.hypot(d, dy) });
  };
  const dir = (t, p, yaw, pitch, fov, turn) => keys.push({ t, v: [p[0], p[1], p[2], yaw, pitch, fov], par: 0.05, pm: 1, d: 0, turn });
  const starts = []; let n = 0; for (const c of cards) { starts.push(n); n += c + 1; }
  const ride = (a, y0, y1) => {                 // walk to the doors, step in facing the glass, ride, turn to the doors
    look(a + 0.35, [11.4, y0 + EYE, 8.3], [L.x, y0 + 1.55, 14], { fov: 60 });
    dir(a + 0.6, [L.x, y0 + EYE, L.z], 0, -0.05, 64); dir(a + 1, [L.x, (y0 + y1) / 2 + EYE, L.z], 0, -0.24, 64);
    dir(a + 1.35, [L.x, y1 + EYE, L.z], 0, -0.1, 64); dir(a + 1.62, [L.x, y1 + EYE, L.z - 0.3], 0, 0, 62, -Math.PI);
  };
  const about = [[[-118, 70, 190], [-8, 46, 0], { fov: 46, par: 3, pm: 1.3 }], [[-92, 44, 118], [-10, 34, 6], { fov: 50, par: 2.5, pm: 1.5 }],
    [[-10.5, 1.9, 44], [-2.5, 13, 12], { fov: 62, par: 0.6 }], [[-2, G0 + EYE, 5], [5.5, 2.5, -13.4], { fov: 60 }]];
  const pose = [
    (j) => about[Math.min(j, 3)],
    (j) => { if (!j) return [[11.2, F6 + EYE, 8.6], [-1, F6 + 1.3, -4], { fov: 62 }]; const k = Math.min(j - 1, 6), [cx, cz] = arc(SVC, k, 4.6), [px, pz] = arc(SVC, k); return [[cx, F6 + EYE, cz], [px, F6 + 1.85, pz], { fov: 56 }]; },
    (j) => { if (!j) return [[11, F11 + EYE, 8.2], [-2, F11 + 1.4, -5.5], { fov: 62 }]; const k = Math.min(j - 1, 2), c = [[-3.2, 1.2], [-0.4, -3.2], [2.6, 0.6]][k]; return [[c[0], F11 + EYE, c[1]], [WORK[k][0], F11 + 1.85, WORK[k][1]], { fov: 56 }]; },
    (j) => { if (!j) return [[10.8, F16 + EYE, 8], [-9, F16 + 1.3, -7], { fov: 62 }]; const k = Math.min(j - 1, 3); return [[ROOMS[k] + [1.4, 0.7, -0.2, -1.1][k], F16 + EYE, 1.6], [ROOMS[k], F16 + 1.45, -9.8], { fov: 58 }]; },
    (j) => { if (!j) return [[10.6, RF + EYE, 7.6], [4.5, RF + 1.8, -9], { fov: 62, par: 0.2 }]; const k = Math.min(j - 1, 3), [cx, cz] = arc(ROOF, k, 4.4), [px, pz] = arc(ROOF, k); return [[cx, RF + EYE, cz], [px, RF + 1.85, pz], { fov: 56, par: 0.2 }]; }
  ];
  cards.forEach((c, i) => {
    for (let j = 0; j < c; j++) look(starts[i] + j, ...pose[Math.min(i, 4)](j));
    if (i === 0 && c > 3) look(2.55, [-3, 1.75, 17.5], [-2.4, 2.4, 0], { fov: 60 });       // through the entrance doors
    const a = starts[i] + c - 1;
    if (i < cards.length - 1) ride(a, HQ.levels[Math.min(i, 4)], HQ.levels[Math.min(i + 1, 4)]);
    else look(a + 1, [-125, 120, 215], [-6, 52, 0], { fov: 46, par: 2 });                 // out of the building: the whole HQ again
  });
  keys.sort((p, q) => p.t - q.t);
  for (let i = 1; i < keys.length; i++) {       // keep yaw continuous; lift turns always go the same way round
    const p = keys[i - 1].v[3]; let y = keys[i].v[3];
    if (keys[i].turn) y = p + keys[i].turn; else { while (y - p > Math.PI) y -= 2 * Math.PI; while (y - p < -Math.PI) y += 2 * Math.PI; }
    keys[i].v[3] = y;
  }
  keys.forEach((b, i) => {                       // monotone tangents
    const a = keys[i - 1], d = keys[i + 1]; b.m = [0, 0, 0, 0, 0, 0];
    for (let c = 0; c < 6; c++) {
      const s0 = a ? (b.v[c] - a.v[c]) / (b.t - a.t) : null, s1 = d ? (d.v[c] - b.v[c]) / (d.t - b.t) : null;
      let g = s0 === null ? s1 : s1 === null ? s0 : (s0 * s1 <= 0 ? 0 : (s0 + s1) / 2);
      if (s0 !== null && s1 !== null && g) g = Math.sign(g) * Math.min(Math.abs(g), 3 * Math.min(Math.abs(s0), Math.abs(s1)));
      b.m[c] = g;
    }
  });
  return { keys, starts, N: n, lastCard: cards.map((c, i) => starts[i] + c - 1) };
}
function sample(R, t, out) {
  const keys = R.keys; let i = out.i;
  while (i < keys.length - 2 && keys[i + 1].t <= t) i++;
  while (i > 0 && keys[i].t > t) i--;
  out.i = i;
  const a = keys[i], b = keys[i + 1], h = b.t - a.t, u = clamp((t - a.t) / h), u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  for (let c = 0; c < 6; c++) out.v[c] = h00 * a.v[c] + h10 * h * a.m[c] + h01 * b.v[c] + h11 * h * b.m[c];
  out.par = lerp(a.par, b.par, u); out.pm = lerp(a.pm, b.pm, u); out.d = lerp(a.d, b.d, u);
}

/* ---------- stage ---------- */
/* opts (diagnostics): aa, shadows, env (sky lighting), texScale, upfront (compile + upload everything before the first frame) */
export async function createStage({ canvas, cards, t, lang, mobile, width, height, dpr, onChange, onStep = () => {}, opts = {} }) {
  const o = { aa: true, shadows: true, env: true, texScale: mobile ? 0.75 : 1, upfront: true, ...opts };
  onStep('renderer');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: o.aa, powerPreference: 'high-performance', alpha: false, stencil: false });
  renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.6;
  renderer.shadowMap.enabled = o.shadows; renderer.shadowMap.type = mobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  setAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  setTexScale(o.texScale);   // phones: same scene and geometry, lighter textures (Safari on iOS has a tight memory budget)
  setLang(lang);

  // text on signs and screens is drawn on canvases: wait briefly for the page's web fonts, redraw if they come later
  let fontsReady = !document.fonts;
  const fontsLoad = document.fonts ? Promise.all(['700 40px "IBM Plex Sans Arabic"', '500 40px "IBM Plex Sans Arabic"', '700 40px "IBM Plex Sans"', '500 40px Inter', '600 40px Inter', '700 40px Inter']
    .map((f) => document.fonts.load(f, 'أهلاً Aa 0123'))).then(() => { fontsReady = true; }, () => { fontsReady = true; }) : Promise.resolve();
  await Promise.race([fontsLoad, new Promise((r) => setTimeout(r, 1500))]);

  const scene = new THREE.Scene();
  onStep('sky');
  const sun = await makeSky(scene, renderer, { stops: SKY, W: mobile ? 1536 : 3072, env: o.env });
  scene.fog = new THREE.Fog(0xdbe5ef, 650, 4600);
  const light = new THREE.DirectionalLight(0xfff1de, 4.6), size = mobile ? 150 : 190, aim = new THREE.Vector3(-18, 0, 12);
  light.position.copy(sun).multiplyScalar(600).add(aim); light.target.position.copy(aim);
  light.castShadow = o.shadows;
  Object.assign(light.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 1, far: 1500 });
  light.shadow.camera.updateProjectionMatrix();
  const ms = Math.min(mobile ? 1536 : 4096, renderer.capabilities.maxTextureSize);
  light.shadow.mapSize.set(ms, ms); light.shadow.bias = -0.0003; light.shadow.normalBias = mobile ? 0.7 : 0.4;
  scene.add(light, light.target, new THREE.HemisphereLight(0xeef4ff, 0xd8d4cc, 0.38));
  await tick();

  onStep('brand');
  const brand = await loadBrand();
  const brandGeo = { logoDark: logoGeometry(brand, { cap: 1, depth: 0.16 }) }; await tick();
  brandGeo.logoLight = logoGeometry(brand, { cap: 1, depth: 0.12, light: true }); brandGeo.symbol = symbolGeometry(brand, { height: 1, depth: 0.045 });
  await tick();
  onStep('site');
  const site = await buildSite({ brandGeo, windowSize: mobile ? 1024 : 2048 });
  await tick();
  onStep('floors');
  const floors = await buildFloors({ brandGeo, t, group: site.group });
  scene.add(site.group);
  await tick();

  const camera = new THREE.PerspectiveCamera(58, width / height, 1, 7000);
  const R = route(cards), S = { i: 0, v: [0, 0, 0, 0, 0, 58], par: 0, pm: 1, d: 0 };
  // compile every program and upload the textures up front, a few at a time, so no floor stutters on first sight
  if (o.upfront) {
    floors.sets.forEach((g) => { g.visible = true; });
    onStep('compile');
    if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera);
    onStep('textures');
    const textures = new Set();
    scene.traverse((m) => { for (const mat of [].concat(m.material || [])) for (const k of ['map', 'emissiveMap']) if (mat[k]) textures.add(mat[k]); });
    let n = 0; for (const tex of textures) { renderer.initTexture(tex); if (tex !== scene.background) releaseCanvas(tex); if (++n % 3 === 0) await tick(); }
    floors.sets.forEach((g) => { g.visible = false; });
  }
  onStep('ready');
  renderer.shadowMap.needsUpdate = true;
  if (!fontsReady) fontsLoad.then(() => { redrawText(); if (onChange) onChange(); });

  const pos = new THREE.Vector3(), fwd = new THREE.Vector3(), rgt = new THREE.Vector3(), at = new THREE.Vector3(), L = HQ.lift, doorZ = HQ.spine.z0;
  const slide = (pair, open, half) => { for (const m of pair) m.position.x = m.userData.x + m.userData.s * half * (1 + open * 1.96); };

  /* view: { w, h, ox, oy (px shift that keeps the subject clear of the text card), px, py (pointer -1..1), portrait } */
  function frame(idx, view) {
    sample(R, clamp(idx, 0, R.N - 1), S);
    const [x, y, z, yaw, pitch, fov] = S.v, cp = Math.cos(pitch);
    fwd.set(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp); rgt.crossVectors(fwd, UP).normalize();
    pos.set(x, y, z);
    if (view.portrait && S.pm > 1) pos.addScaledVector(fwd, -S.d * (S.pm - 1));          // tall screens: step back from the building
    pos.addScaledVector(rgt, view.px * S.par); pos.y -= view.py * S.par * 0.4;

    // the lift car carries the camera while it is inside, otherwise it waits on the current floor
    const inCar = Math.abs(x - L.x) < 1.7 && z > doorZ + 0.3;
    let lvl = 0; for (let i = 0; i < R.lastCard.length - 1; i++) if (idx > R.lastCard[i] + 1.2) lvl = i + 1;
    const carY = inCar ? y - EYE : HQ.levels[Math.min(lvl, 4)];
    floors.car.position.y = carY; floors.car.visible = idx > 2.3;
    floors.sets.forEach((g, i) => { g.visible = idx > R.starts[i + 1] - 0.8 && idx < R.lastCard[i + 1] + 0.85; });
    slide(site.leaves, pos.y < 8 ? smooth(10, 5, Math.hypot(pos.x - HQ.entry.x, pos.z - HQ.entry.z)) : 0, 0.8);
    floors.doors.forEach((pair, i) => {
      const here = Math.abs(carY - HQ.levels[i]) < 0.08 && Math.abs(pos.y - EYE - HQ.levels[i]) < 1;
      slide(pair, here ? smooth(8.5, 4.5, Math.hypot(pos.x - L.x, pos.z - doorZ)) : 0, L.w / 4);
    });

    camera.position.copy(pos); camera.lookAt(at.copy(pos).add(fwd));
    camera.aspect = view.w / view.h;
    camera.fov = fov + Math.min(16, Math.max(0, (1 - camera.aspect) * 30));
    camera.near = clamp(Math.hypot(x, z) / 70, 0.25, 3);
    camera.setViewOffset(view.w, view.h, view.ox, view.oy, view.w, view.h);              // also updates the projection
    renderer.render(scene, camera);
    return y;                                                                            // eye height: the HUD shows the floor
  }

  return {
    N: R.N, starts: R.starts, frame, renderer, scene,
    resize(w, h, d) { renderer.setPixelRatio(d); renderer.setSize(w, h, false); },
    setLang(l) { setLang(l); }
  };
}
