/* Digital Pass HQ — inside the building: three fitted-out floors (services, work, process), the roof terrace
   (values) and the lift car that links them. Each floor sits at its real height inside the tower, so the campus
   outside the glass is the same world the visitor arrived through. */
import { THREE, BRAND, rng, canvasTex, langTex, text, roundRect, drawSymbol, drawWordmark, drawIcon, isRtl, M, G, geo, makeKit, quadBatch, addPerson, blobTexture } from './core.js';
import { C, HQ, mb, tb, lb, shrub, ceilingTex, stoneTex, deckTex } from './site.js';
import { drawDashboard, drawPhone, drawStore, drawSite } from './mocks.js';

/* stops on an arc: centre, radius, first angle and step in degrees (0 deg = +x, 90 deg = towards the back) */
export const SVC = { cx: 3, cz: 1, r: 11, a0: 60, step: 25 };
export const ROOF = { cx: 6.5, cz: 0.5, r: 10.5, a0: 50, step: 28 };
export const ROOMS = [-11.55, -3.85, 3.85, 11.55];
export const arc = (d, k, inset = 0) => { const a = (d.a0 + k * d.step) * Math.PI / 180; return [d.cx + (d.r - inset) * Math.cos(a), d.cz - (d.r - inset) * Math.sin(a), a]; };
const facing = (a) => Math.atan2(-Math.cos(a), Math.sin(a));   // yaw that turns +z towards the arc centre

const std = (o) => new THREE.MeshStandardMaterial(o), lit = (map, o) => new THREE.MeshBasicMaterial({ map, ...o });
const DARK = 0x1a1f27, FAB = 0xd8d2c8, FABN = 0x1f3358, WOOD = 0xb08a62, POT = 0xe3ded6;
const blobMat = () => geo('blob-mat', () => lit(blobTexture(), { transparent: true, depthWrite: false }));
const blob = (K, x, y, z, w, d) => K.plane(w, d, blobMat(), x, y + 0.03, z, { rx: -Math.PI / 2 });
const ringGeo = () => geo('ring', () => new THREE.RingGeometry(0.955, 1, 56));
const glassTint = () => geo('glass-tint', () => std({ color: 0xdbe9f7, roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 0.8 }));

/* ---------- furniture ---------- */
function chair(K, x, y, z, ry, col = FABN) {
  K.push(x, y, z, ry);
  mb(K, 0.5, 0.08, 0.5, col, 0, 0.46, 0); mb(K, 0.5, 0.42, 0.06, col, 0, 0.72, -0.22); tb(K, 0.05, 0.44, 0.05, C.metal, 0, 0.22, 0); K.cyl(0.25, 0.03, M.metal, 0, 0.015, 0, { color: C.metal });
  K.pop();
}
function sofa(K, x, y, z, ry, w = 2.4, col = FAB) {
  K.push(x, y, z, ry);
  mb(K, w, 0.42, 0.95, col, 0, 0.21, 0); mb(K, w, 0.5, 0.22, col, 0, 0.62, -0.38); for (const s of [-1, 1]) mb(K, 0.2, 0.58, 0.95, col, s * (w / 2 - 0.1), 0.29, 0);
  blob(K, 0, 0, 0, w + 1, 2.1);
  K.pop();
}
function table(K, x, y, z, ry, w, d, h, col = C.white) {
  K.push(x, y, z, ry);
  mb(K, w, 0.05, d, col, 0, h, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb(K, 0.05, h, 0.05, C.metal, sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1));
  blob(K, 0, 0, 0, w + 0.9, d + 0.9);
  K.pop();
}
function planter(K, x, y, z, r = 0.55, tall = 0) {
  K.cyl(r, r * 1.4, M.matte, x, y + r * 0.7, z, { color: POT });
  if (tall) { K.box(0.12, tall, 0.12, M.soft, x, y + r * 1.4 + tall / 2, z, { color: C.trunk }); shrub(K, x, y + r * 1.4 + tall + 0.5, z, 1, C.leaf, 1.2); }
  else shrub(K, x, y + r * 1.4 + 0.45, z, r * 1.25, 0x3f9a74, 1.1);
  blob(K, x, y, z, r * 3.6, r * 3.6);
}
/* a screen on a dark bezel; origin = screen centre, faces +z */
function screen(K, tex, w, h, x, y, z, o = {}) {
  mb(K, w + 0.12, h + 0.12, 0.08, DARK, x, y, z - 0.05, o);
  K.add(G.plane(), geo('scr' + tex.uuid, () => lit(tex)), x, y, z, { ...o, sx: w, sy: h });
}

/* ---------- textures with words (redrawn on language change) ---------- */
const card = (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w * 0.4, h); bg.addColorStop(0, '#12295a'); bg.addColorStop(1, '#07142f'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const gl = g.createRadialGradient(w * 0.8, h * 0.2, 0, w * 0.8, h * 0.2, w * 0.7); gl.addColorStop(0, 'rgba(45,99,252,0.5)'); gl.addColorStop(1, 'rgba(45,99,252,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, h);
  const bar = g.createLinearGradient(0, 0, w, 0); bar.addColorStop(0, BRAND.blue); bar.addColorStop(1, BRAND.cyan); g.fillStyle = bar; g.fillRect(0, 0, w, 11);
};
const podTex = (t, key, ar, icon, tag) => langTex(512, 640, (g, w, h, lang) => {
  card(g, w, h);
  const r = isRtl(lang), ix = r ? w - 193 : 53, ax = r ? w - 53 : 53;
  const ig = g.createLinearGradient(ix, 66, ix + 140, 206); ig.addColorStop(0, BRAND.cyan); ig.addColorStop(1, BRAND.blue);
  g.fillStyle = ig; roundRect(g, ix, 66, 140, 140, 35); g.fill();
  drawIcon(g, icon, ix + 70, 136, 76, '#fff', 7);
  const y = text(g, t(key, ar), ax, 318, { lang, size: 58, maxW: w - 100, lh: 1.25 });
  text(g, tag, ax, y + 60, { lang: 'en', size: 27, weight: 500, color: '#a9bde6', align: r ? 'right' : 'left' });
  g.fillStyle = 'rgba(150,177,254,0.3)'; g.fillRect(53, h - 113, w - 106, 2);
  drawSymbol(g, 53, h - 88, 52); drawWordmark(g, 102, h - 50, 26);
});
const valueTex = (t, key, ar, icon) => langTex(384, 768, (g, w, h, lang) => {
  const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#0f2552'); grd.addColorStop(1, '#081633'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(31,200,246,0.55)'; g.lineWidth = 5; roundRect(g, 14, 14, w - 28, h - 28, 22); g.stroke();
  g.fillStyle = 'rgba(31,200,246,0.12)'; g.beginPath(); g.arc(w / 2, 235, 92, 0, Math.PI * 2); g.fill();
  drawIcon(g, icon, w / 2, 235, 92, BRAND.cyan, 7);
  text(g, t(key, ar), w / 2, 440, { lang, size: lang === 'en' ? 56 : 74, align: 'center' });
  g.fillStyle = 'rgba(150,177,254,0.3)'; g.fillRect(w / 2 - 60, 500, 120, 3);
  drawSymbol(g, w / 2 - 22, h - 150, 64);
});
const stepTex = (t, i, key, ar) => langTex(768, 128, (g, w, h, lang) => {
  g.fillStyle = '#0a1b3d'; g.fillRect(0, 0, w, h);
  const r = isRtl(lang);
  g.fillStyle = BRAND.cyan; g.fillRect(r ? w - 12 : 0, 0, 12, h);
  text(g, '0' + (i + 1), r ? w - 44 : 44, 90, { lang: 'en', size: 76, color: BRAND.cyan, align: r ? 'right' : 'left' });
  text(g, t(key, ar), r ? w - 170 : 170, 86, { lang, size: 62 });
});
const markerTex = (i) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = BRAND.navy; g.beginPath(); g.arc(w / 2, h / 2, 118, 0, Math.PI * 2); g.fill();
  g.strokeStyle = BRAND.cyan; g.lineWidth = 9; g.beginPath(); g.arc(w / 2, h / 2, 108, 0, Math.PI * 2); g.stroke();
  text(g, '0' + (i + 1), w / 2, h / 2 + 36, { lang: 'en', size: 104, weight: 700, align: 'center', color: '#ffffff' });
}, { repeat: false });
const boardTex = (t) => langTex(640, 352, (g, w, h, lang) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  text(g, t('step1.title', 'نفهم'), isRtl(lang) ? w - 36 : 36, 76, { lang, size: 52, color: BRAND.navy });
  const cols = ['#C0D0FE', '#A5EAFF', '#FFE2A8', '#C0D0FE', '#A5EAFF', '#E2E9FF'];
  cols.forEach((c, k) => { g.fillStyle = c; roundRect(g, 40 + (k % 3) * 195, 120 + Math.floor(k / 3) * 110, 165, 88, 12); g.fill(); g.fillStyle = 'rgba(10,27,61,0.35)'; g.fillRect(58 + (k % 3) * 195, 146 + Math.floor(k / 3) * 110, 110, 8); g.fillRect(58 + (k % 3) * 195, 166 + Math.floor(k / 3) * 110, 76, 8); });
});
export const liftSignTex = (t, code, key, ar) => langTex(512, 160, (g, w, h, lang) => {
  g.fillStyle = '#0a1b3d'; g.fillRect(0, 0, w, h);
  const r = isRtl(lang);
  g.fillStyle = BRAND.cyan; roundRect(g, r ? w - 138 : 18, 22, 120, 116, 24); g.fill();
  text(g, code, r ? w - 78 : 78, 108, { lang: 'en', size: 76, color: BRAND.navy, align: 'center' });
  text(g, t(key, ar), r ? w - 166 : 166, 100, { lang, size: 48 });
});

/* ---------- one fitted-out floor: finish, ceiling, glazing bars, lift doorway ---------- */
function shell(K, group, y, floorMat) {
  const x0 = -16.4, x1 = 16.4, z0 = -13.4, z1 = 13.4, S = HQ.spine, H = 3.6, g = 3.2;
  const fq = quadBatch(); fq.flat(x0, z0, x1, z1, y + 0.01, x0 / 4, -z1 / 4, x1 / 4, -z0 / 4);
  group.add(new THREE.Mesh(fq.build(), floorMat));
  const ce = ceilingTex(), cq = quadBatch(); cq.ceil(x0, z0, x1, z1, y + H, x0 / 8, z0 / 8, x1 / 8, z1 / 8);
  group.add(new THREE.Mesh(cq.build(), geo('ceil-mat', () => std({ map: ce.map, emissiveMap: ce.emi, emissive: 0xffffff, emissiveIntensity: 1.25, roughness: 0.85 }))));
  const bar = (w, h, d, x, yy, z) => tb(K, w, h, d, C.frame, x, yy, z);
  const fseg = [[x0, S.x0], [S.x1, x1]];
  for (let k = 0; k <= 13; k++) { const x = x0 + k * (x1 - x0) / 13; bar(0.08, g, 0.14, x, y + g / 2, z0 + 0.05); if (x < S.x0 - 0.1 || x > S.x1 + 0.1) bar(0.08, g, 0.14, x, y + g / 2, z1 - 0.05); }
  for (let k = 1; k < 10; k++) for (const x of [x0 + 0.05, x1 - 0.05]) bar(0.14, g, 0.08, x, y + g / 2, z0 + k * (z1 - z0) / 10);
  for (const yy of [y + 0.05, y + g]) {
    bar(x1 - x0, 0.1, 0.16, 0, yy, z0 + 0.05); for (const [a, b] of fseg) bar(b - a, 0.1, 0.16, (a + b) / 2, yy, z1 - 0.05);
    for (const x of [x0 + 0.05, x1 - 0.05]) bar(0.16, 0.1, z1 - z0, x, yy, 0);
  }
  K.plane(x1 - x0, g, M.glassIn, 0, y + g / 2, z0 + 0.03, {}); for (const [a, b] of fseg) K.plane(b - a, g, M.glassIn, (a + b) / 2, y + g / 2, z1 - 0.03, { ry: Math.PI });
  K.plane(z1 - z0, g, M.glassIn, x0 + 0.03, y + g / 2, 0, { ry: Math.PI / 2 }); K.plane(z1 - z0, g, M.glassIn, x1 - 0.03, y + g / 2, 0, { ry: -Math.PI / 2 });
}
const doorMat = () => geo('lift-door', () => std({ color: 0xcfd5dc, roughness: 0.3, metalness: 0.7 }));
function liftDoorway(K, group, y, sign) {
  const L = HQ.lift, z = HQ.spine.z0;
  for (const s of [-1, 1]) tb(K, 0.16, L.h + 0.1, 0.3, C.frame, L.x + s * (L.w / 2 + 0.08), y + (L.h + 0.1) / 2, z - 0.06);
  tb(K, L.w + 0.48, 0.18, 0.3, C.frame, L.x, y + L.h + 0.14, z - 0.06);
  lb(K, L.w + 0.48, 0.04, 0.04, C.led, L.x, y + L.h + 0.25, z - 0.22);
  K.add(G.plane(), lit(sign), L.x, y + L.h + 0.6, z - 0.03, { ry: Math.PI, sx: 1.7, sy: 0.53 });
  return [-1, 1].map((s) => { const m = new THREE.Mesh(G.box(), doorMat()); m.scale.set(L.w / 2, L.h, 0.05); m.position.set(L.x + s * L.w / 4, y + L.h / 2, z + 0.05); m.userData = { x: L.x, s }; group.add(m); return m; });
}

/* ---------- floor 6: services (one pod per service on an arc) ---------- */
function services(K, y, t) {
  const defs = [['s1.title', 'الأنظمة المخصّصة', 'grid', 'ERP · CRM'], ['s2.title', 'تطوير التطبيقات', 'phone', 'iOS · Android'], ['s3.title', 'إدارة التطبيقات', 'gear', '24 / 7'],
    ['s4.title', 'الحلول الرقمية', 'spark', 'API · Automation'], ['s5.title', 'تطوير المواقع', 'browser', 'Web'], ['s6.title', 'حلول متاجر سلة', 'bag', 'Salla'], ['s7.title', 'ثيمات مخصّصة', 'brush', 'UI / UX']];
  defs.forEach(([key, ar, icon, tag], k) => {
    const [px, pz, a] = arc(SVC, k);
    K.push(px, y, pz, facing(a));
    mb(K, 2.4, 1, 1, C.white, 0, 0.5, 0.3); mb(K, 2.5, 0.05, 1.1, C.navy, 0, 1.03, 0.3); lb(K, 2.1, 0.035, 0.035, C.led, 0, 0.07, 0.82);
    mb(K, 0.14, 1.2, 0.1, DARK, 0, 0.6, -0.34); mb(K, 0.9, 0.05, 0.5, DARK, 0, 0.03, -0.34);
    screen(K, podTex(t, key, ar, icon, tag), 1.3, 1.625, 0, 2.02, -0.26);
    K.add(ringGeo(), M.glow, 0, 0.035, 0.4, { rx: -Math.PI / 2, sx: 1.9, sy: 1.9, color: C.cyan });
    blob(K, 0, 0, 0.1, 3.6, 2.6);
    chair(K, 0.6, 0, 1.45, Math.PI, 0x2d63fc);
    K.pop();
  });
  K.add(ringGeo(), M.glow, SVC.cx, y + 0.035, SVC.cz, { rx: -Math.PI / 2, sx: 4.4, sy: 4.4, color: C.led });
  sofa(K, -11.5, y, 9.6, Math.PI * 0.75, 2.6); sofa(K, -8.2, y, 11.2, Math.PI, 2.4, FABN); table(K, -9.6, y, 9.2, 0.3, 1.2, 1.2, 0.4, WOOD);
  for (const [x, z, tall] of [[-14.6, -11.8, 1.6], [14.6, -11.8, 1.6], [-14.6, 5.2, 0], [5.5, 11.6, 0], [14.6, 3.5, 1.6]]) planter(K, x, y, z, 0.6, tall);
  [[1, 1.2, 0.5], [4, -0.6, 2.4]].forEach(([k, off, ry], i) => { const [x, z] = arc(SVC, k, 1.9); addPerson(K, x + off, y + 0.01, z + off * 0.4, 210 + i, { ry, walk: false }); });
  addPerson(K, -10.4, y + 0.01, 7.6, 215, { walk: false });
}

/* ---------- floor 11: what we build (dashboard wall, apps, stores) ---------- */
export const WORK = [[-10.5, -4.5, 0.91], [-0.5, -10, 0], [9.5, -5, -0.89]];   // exhibit x, z, yaw
function work(K, y, t) {
  const dash = langTex(1280, 800, (g, w, h) => drawDashboard(g, w, h, t)), phone = langTex(560, 1160, (g, w, h) => drawPhone(g, w, h, t)), store = langTex(1280, 800, (g, w, h) => drawStore(g, w, h, t));
  const [A, B, S] = WORK;
  K.push(A[0], y, A[1], A[2]);
  mb(K, 5.4, 0.35, 1.3, C.white, 0, 0.175, 0); lb(K, 5, 0.04, 0.04, C.led, 0, 0.06, 0.67); screen(K, dash, 4.6, 2.875, 0, 1.95, -0.1); blob(K, 0, 0, 0, 6.8, 2.8);
  for (const s of [-1, 1]) { mb(K, 0.9, 1, 0.6, C.white, s * 3.6, 0.5, 0.9); mb(K, 0.95, 0.04, 0.65, C.navy, s * 3.6, 1.02, 0.9); }
  K.pop();
  K.push(B[0], y, B[1], B[2]);
  K.cyl(1.3, 0.3, M.matte, 0, 0.15, 0, { color: C.white }); K.add(ringGeo(), M.glow, 0, 0.035, 0, { rx: -Math.PI / 2, sx: 1.75, sy: 1.75, color: C.cyan });
  mb(K, 1.27, 2.5, 0.14, DARK, 0, 1.75, 0); K.add(G.plane(), lit(phone), 0, 1.75, 0.075, { sx: 1.15, sy: 2.38 }); blob(K, 0, 0, 0, 3.6, 3.6);
  for (const s of [-1, 1]) { mb(K, 0.5, 1.05, 0.5, C.white, s * 2.5, 0.525, 0.7); mb(K, 0.4, 0.78, 0.05, DARK, s * 2.5, 1.5, 0.7, { rx: -0.2 }); K.add(G.plane(), lit(phone), s * 2.5, 1.5, 0.74, { rx: -0.2, sx: 0.34, sy: 0.7 }); }
  K.pop();
  K.push(S[0], y, S[1], S[2]);
  mb(K, 5.4, 0.35, 1.3, C.white, 0, 0.175, 0); lb(K, 5, 0.04, 0.04, C.led, 0, 0.06, 0.67); screen(K, store, 4.6, 2.875, 0, 1.95, -0.1); blob(K, 0, 0, 0, 6.8, 2.8);
  mb(K, 3, 0.55, 0.8, C.white, 0, 0.275, 1.5); [0x2d63fc, 0x1fc8f6, 0x0a1b3d, 0x96b1fe, 0xffffff].forEach((c, i) => mb(K, 0.34, 0.34 + (i % 2) * 0.12, 0.34, c, -1.1 + i * 0.55, 0.72 + (i % 2) * 0.06, 1.5));
  K.pop();
  K.box(5, 0.45, 0.9, M.matte, -6.5, y + 0.23, 8.6, { ry: 0.15, color: FABN }); blob(K, -6.5, y, 8.6, 6, 2);
  for (const [x, z, tall] of [[-14.6, 11.6, 1.6], [14.6, -11.8, 1.6], [-14.6, -11.8, 0], [4.5, 11.6, 0]]) planter(K, x, y, z, 0.6, tall);
  [[-7.8, 0.8, 4.1], [1.4, -6.8, 3.2], [6.8, 0.6, 2.2], [-4.6, 7.4, 0.4]].forEach(([x, z, ry], i) => addPerson(K, x, y + 0.01, z, 230 + i, { ry, walk: false }));
}

/* ---------- floor 16: how we work (four glass rooms, one per stage) ---------- */
function process(K, y, t) {
  const zb = -13.1, zf = -6.9, H = 3.2, zc = (zb + zf) / 2;
  const mini = canvasTex(640, 400, (g) => { g.scale(0.5, 0.5); drawDashboard(g, 1280, 800, (k, ar) => ar); }, { repeat: false });
  const site = canvasTex(640, 400, (g) => { g.scale(0.5, 0.5); drawSite(g, 1280, 800); }, { repeat: false });
  const defs = [['step1.title', 'نفهم'], ['step2.title', 'نصمّم'], ['step3.title', 'نبني'], ['step4.title', 'نشغّل']];
  lb(K, 26.6, 0.02, 0.14, C.led, 0, y + 0.03, -3.6);
  ROOMS.forEach((x, i) => {
    for (const s of [-1, 1]) { K.plane(zf - zb, H, glassTint(), x + s * 3.3, y + H / 2, zc, { ry: Math.PI / 2 }); tb(K, 0.08, H, 0.08, DARK, x + s * 3.3, y + H / 2, zf); tb(K, 0.06, 0.06, zf - zb, DARK, x + s * 3.3, y + H, zc); }
    mb(K, 6.68, 0.42, 0.12, C.navy, x, y + H + 0.19, zf); K.add(G.plane(), lit(stepTex(t, i, ...defs[i])), x, y + H + 0.19, zf + 0.065, { sx: 2.4, sy: 0.4 });
    K.add(G.plane(), lit(markerTex(i), { transparent: true, depthWrite: false }), x, y + 0.055, -3.6, { rx: -Math.PI / 2, sx: 2.2, sy: 2.2 });
    K.push(x, y, 0, 0);
    if (i === 0) {
      table(K, 0, 0, -9.6, 0, 2.6, 1.2, 0.75); for (const [cx, cz, r] of [[-0.7, -8.7, Math.PI], [0.7, -8.7, Math.PI], [-0.7, -10.5, 0], [0.7, -10.5, 0]]) chair(K, cx, 0, cz, r);
      screen(K, boardTex(t), 2.4, 1.32, 0, 1.75, -12.6); addPerson(K, 1.9, 0.01, -11.4, 240, { ry: 3.6, walk: false }); addPerson(K, -1.9, 0.01, -9.5, 241, { ry: 1.2, walk: false });
    } else if (i === 1) {
      table(K, 0, 0, -11.2, 0, 2.4, 1, 0.75); screen(K, site, 1.5, 0.94, 0, 1.3, -11.5); chair(K, 0, 0, -10.3, Math.PI);
      mb(K, 2.2, 1.3, 0.06, C.white, -1.9, 1.9, -12.75, {}); [0x2d63fc, 0x1fc8f6, 0x0a1b3d, 0x96b1fe, 0xc0d0fe, 0xf4f7fc].forEach((c, k) => mb(K, 0.52, 0.42, 0.03, c, -2.6 + (k % 3) * 0.7, 2.2 - Math.floor(k / 3) * 0.55, -12.7));
      addPerson(K, 1.6, 0.01, -9.8, 242, { ry: 4.2, walk: false });
    } else if (i === 2) {
      for (const dx of [-1.5, 1.5]) { table(K, dx, 0, -11.2, 0, 2, 0.9, 0.75); for (const sx of [-0.45, 0.45]) screen(K, mini, 0.8, 0.5, dx + sx, 1.16, -11.45); chair(K, dx, 0, -10.4, Math.PI); }
      mb(K, 0.9, 2.2, 0.9, DARK, 2.7, 1.1, -12.5); for (let k = 0; k < 6; k++) lb(K, 0.6, 0.03, 0.02, C.led, 2.7, 0.4 + k * 0.3, -12.04);
      addPerson(K, -0.2, 0.01, -9.3, 243, { ry: 3.3, walk: false });
    } else {
      screen(K, mini, 3.6, 2.25, 0, 1.75, -12.6); table(K, 0, 0, -10.4, 0, 2.2, 0.8, 1.05); addPerson(K, 0.9, 0.01, -9.6, 244, { ry: 3.4, walk: false });
    }
    K.pop();
  });
  sofa(K, -9, y, 9.8, Math.PI, 2.6); sofa(K, -5.4, y, 9.8, Math.PI, 2.4, FABN); table(K, -7.2, y, 8, 0, 1.4, 0.9, 0.4, WOOD);
  for (const [x, z, tall] of [[-14.6, 11.6, 1.6], [3.5, 11.6, 0], [14.6, 4, 1.6], [-14.6, 2, 0]]) planter(K, x, y, z, 0.6, tall);
  addPerson(K, 7.4, y + 0.01, -4.8, 246, { walk: false }); addPerson(K, -6.4, y + 0.01, -5.3, 247, { walk: false });
}

/* ---------- roof terrace: our values, with the whole campus below ---------- */
function roof(K, t) {
  const y = HQ.deckY, x0 = -3.6, x1 = 17.25, z1 = 14.25, S = HQ.spine;
  const dk = deckTex().clone(); dk.needsUpdate = true; dk.repeat.set(5, 7);
  K.plane(x1 - x0, 2 * z1, std({ map: dk, roughness: 0.78 }), (x0 + x1) / 2, y + 0.03, 0, { rx: -Math.PI / 2, cast: false });
  // glass balustrade
  const rail = std({ color: 0xcfe0ee, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 });
  const run = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 2.1)), ry = Math.atan2(-(bz - az), bx - ax);
    for (let k = 0; k <= n; k++) tb(K, 0.07, 1.15, 0.07, C.metal, ax + (bx - ax) * k / n, y + 0.575, az + (bz - az) * k / n);
    K.plane(len, 1, rail, (ax + bx) / 2, y + 0.58, (az + bz) / 2, { ry, cast: false, receive: false });
    K.box(len, 0.06, 0.09, M.metal, (ax + bx) / 2, y + 1.16, (az + bz) / 2, { ry, color: C.metal });
  };
  run(x0, -z1, x1, -z1); run(x1, -z1, x1, z1); run(x1, z1, S.x1 + 0.2, z1); run(S.x0 - 0.2, z1, x0, z1);
  // value monoliths on an arc, facing the middle of the terrace
  [['v1.title', 'الثقة', 'shield'], ['v2.title', 'الوضوح', 'eye'], ['v3.title', 'الإتقان', 'star'], ['v4.title', 'الشراكة', 'hand']].forEach(([key, ar, icon], k) => {
    const [px, pz, a] = arc(ROOF, k);
    K.push(px, y, pz, facing(a));
    mb(K, 1.7, 3.4, 0.4, C.navy, 0, 1.75, 0); mb(K, 2, 0.2, 0.8, C.white, 0, 0.13, 0); lb(K, 1.7, 0.04, 0.04, C.led, 0, 0.26, 0.24);
    K.add(G.plane(), lit(valueTex(t, key, ar, icon)), 0, 1.75, 0.205, { sx: 1.56, sy: 3.12, cast: false, receive: false });
    K.pop();
  });
  // lounge, planters, people
  K.push(1.2, y + 0.03, 8.4, 0);
  mb(K, 2.8, 0.42, 0.95, FAB, 0, 0.21, 2); mb(K, 2.8, 0.5, 0.22, FAB, 0, 0.62, 2.38); mb(K, 0.95, 0.42, 2.6, FAB, 2.3, 0.21, 0.2); mb(K, 0.22, 0.5, 2.6, FAB, 2.68, 0.62, 0.2);
  K.cyl(0.75, 0.06, M.matte, 0.3, 0.42, 0.3, { color: WOOD }); tb(K, 0.08, 0.4, 0.08, C.metal, 0.3, 0.2, 0.3);
  tb(K, 0.08, 2.7, 0.08, C.metal, 1.6, 1.35, 1.4); K.add(G.cone(), M.leaf, 1.6, 2.95, 1.4, { sx: 2.5, sy: 0.7, sz: 2.5, color: 0xffffff });
  K.pop();
  for (const [x, z, s] of [[-2.2, -12.6, 1], [3.4, -13, 0.8], [15.6, -12.8, 1], [16, -1, 0.8], [16, 9, 1], [-2.2, 12.6, 1], [3, 13, 0.8], [-2.4, 0, 0.8]]) { mb(K, 1.5 * s, 0.75, 1.5 * s, C.pot, x, y + 0.4, z); shrub(K, x, y + 1.35 * s + 0.2, z, 1.05 * s, C.leaf, 1.1); }
  [[14.4, 4.6, 2.2], [15.2, 5.6, 5.2], [0.4, 7.4, 0.8], [5.6, 3, 4]].forEach(([x, z, ry], i) => addPerson(K, x, y + 0.04, z, 260 + i, { ry, walk: false }));
}

/* ---------- the lift car (rides inside the blue spine; follows the camera, see stage.js) ---------- */
function liftCar(T) {
  const g = new THREE.Group(), K = makeKit({ cast: false, receive: false }), W = 3.4, D = 5.2, H = 2.7;
  mb(K, W, 0.06, D, 0x2a3340, 0, 0.03, 0); K.box(W, 0.06, D, M.lit, 0, H + 0.03, 0, { color: 0xfff6e8 });
  for (const s of [-1, 1]) {
    mb(K, 0.06, H, D, C.navy, s * (W / 2 - 0.03), H / 2, 0);
    for (const z of [-1.5, 0, 1.5]) lb(K, 0.03, H - 0.4, 0.04, C.led, s * (W / 2 - 0.075), H / 2, z);
    tb(K, 0.05, 0.05, D - 0.5, C.metal, s * (W / 2 - 0.17), 1, 0);
    tb(K, 0.08, H, 0.08, C.frame, s * (W / 2 - 0.04), H / 2, D / 2 - 0.04);
  }
  K.plane(W - 0.1, H, M.glassIn, 0, H / 2, D / 2 - 0.03, { ry: Math.PI });
  tb(K, W, 0.08, 0.08, C.frame, 0, 0.1, D / 2 - 0.04); tb(K, W, 0.08, 0.08, C.frame, 0, H - 0.04, D / 2 - 0.04); tb(K, W - 0.3, 0.05, 0.05, C.metal, 0, 1.05, D / 2 - 0.26);
  const s = 0.2; K.add(T.logoLight, M.logoLit, -W / 2 + 0.07, 1.62, T.logoLight.userData.width * s / 2, { ry: Math.PI / 2, sx: s, sy: s, sz: s });
  K.build(g);
  g.position.set(HQ.lift.x, HQ.levels[0], HQ.lift.z);
  return g;
}

/* ---------- assemble ---------- */
export async function buildFloors({ brandGeo, t, group }) {
  const [lobbyY, y6, y11, y16, roofY] = HQ.levels, step = () => new Promise((r) => setTimeout(r, 0));
  const signs = [['G', 'about.label', 'من نحن'], ['6', 'services.label', 'خدماتنا'], ['11', 'work.label', 'ماذا نبني'], ['16', 'process.label', 'طريقة عملنا'], ['R', 'why.label', 'لماذا Digital Pass']].map(([c, k, ar]) => liftSignTex(t, c, k, ar));
  const doors = [];
  // lobby + roof are part of the building as seen from outside: always there
  const KO = makeKit(), KI = makeKit({ cast: false, receive: false });
  doors[0] = liftDoorway(KI, group, lobbyY, signs[0]);
  roof(KO, t); doors[4] = liftDoorway(KO, group, roofY, signs[4]);
  KO.build(group); KI.build(group); await step();
  // fitted-out floors: only drawn while the visitor is on them
  const st = stoneTex(), oak = deckTex();
  const mats = [std({ map: st, roughness: 0.32, metalness: 0, envMapIntensity: 0.5 }), std({ color: 0x51658a, roughness: 0.3, metalness: 0.1, envMapIntensity: 0.6 }), std({ map: oak, color: 0xf6ead8, roughness: 0.5, envMapIntensity: 0.4 })];
  const sets = [];
  for (const [i, fill] of [services, work, process].entries()) {
    const g = new THREE.Group(), K = makeKit({ cast: false, receive: false }), y = [y6, y11, y16][i];
    shell(K, g, y, mats[i]); doors[i + 1] = liftDoorway(K, g, y, signs[i + 1]); fill(K, y, t);
    K.build(g); g.visible = false; group.add(g); sets.push(g);
    await step();
  }
  const car = liftCar(brandGeo); group.add(car);
  return { sets, doors, car };
}
