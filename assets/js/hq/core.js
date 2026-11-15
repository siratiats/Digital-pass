/* Digital Pass HQ — shared 3D helpers: three import, canvas textures, brand geometry, sky, batching.
   Everything in assets/js/hq/ is loaded on demand by journey.js (no import map needed: three is imported by path). */
import * as THREE from '../../vendor/three/three.module.js';

export { THREE };
export const BRAND = { navy: '#0A1B3D', blue: '#2D63FC', cyan: '#1FC8F6', deep: '#060F24' };
export const AR = '"IBM Plex Sans Arabic", sans-serif';
export const EN = 'Inter, "IBM Plex Sans Arabic", sans-serif';
export const WM = '"IBM Plex Sans", Inter, sans-serif'; // the DIGITAL PASS wordmark only

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/* ---------- canvas textures ---------- */
let ANISO = 4, TEX_SCALE = 1;
export const setAniso = (a) => { ANISO = a; };
/* phones: canvases are drawn at a smaller pixel size (same drawing, scaled), which roughly halves texture memory */
export const setTexScale = (s) => { TEX_SCALE = s; };

export function canvasTex(w, h, draw, { srgb = true, aniso, repeat = true, scale } = {}) {
  const s = scale ?? TEX_SCALE, c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
  const g = c.getContext('2d');
  if (c.width !== w || c.height !== h) g.scale(c.width / w, c.height / h);
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso ?? ANISO;
  return t;
}

/* Textures with words on them: redrawn when the page language changes (or when web fonts arrive late). */
let LANG = 'ar';
const langTextures = [];
export const getLang = () => LANG;
export function langTex(w, h, draw, opts) {
  const t = canvasTex(w, h, (g) => draw(g, w, h, LANG), { repeat: false, ...opts });
  langTextures.push({ t, draw, w, h });
  return t;
}
/* after upload, canvases whose text never changes are shrunk to 1px so their memory is given back */
export function releaseCanvas(t) {
  if (!langTextures.some((e) => e.t === t) && t.image && t.image.getContext) { t.image.width = 1; t.image.height = 1; }
}
export function redrawText() {
  for (const e of langTextures) {
    const c = e.t.image, g = c.getContext('2d');
    g.setTransform(c.width / e.w, 0, 0, c.height / e.h, 0, 0); g.clearRect(0, 0, e.w, e.h);
    g.direction = 'ltr'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.globalAlpha = 1; g.shadowBlur = 0;
    e.draw(g, e.w, e.h, LANG);
    e.t.needsUpdate = true;
  }
}
export function setLang(lang) { if (lang !== LANG) { LANG = lang; redrawText(); } }
export const isRtl = (lang) => lang !== 'en';
export const font = (lang, weight, px) => `${weight} ${px}px ${lang === 'en' ? EN : AR}`;
export function roundRect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }

/* One line, or wrapped to maxW. Anchored at x on the reading side unless align is given. Returns the last baseline. */
export function text(g, str, x, y, { lang = LANG, size = 40, weight = 700, color = '#fff', align, maxW = 0, lh = 1.3 } = {}) {
  g.font = font(lang, weight, size); g.fillStyle = color;
  const r = isRtl(lang);
  g.direction = r ? 'rtl' : 'ltr';
  g.textAlign = align || (r ? 'right' : 'left');
  if (!maxW) { g.fillText(str, x, y); return y; }
  const words = String(str).split(' '); let row = '', yy = y;
  for (const wd of words) {
    const t = row ? row + ' ' + wd : wd;
    if (g.measureText(t).width > maxW && row) { g.fillText(row, x, yy); yy += size * lh; row = wd; } else row = t;
  }
  if (row) g.fillText(row, x, yy);
  return yy;
}

/* ---------- brand symbol + wordmark ---------- */
export const SYMBOL_PATH = 'M2 0H21A16.25 16.25 0 0 1 21 32.5H10V51A2 2 0 0 1 8 53H2A2 2 0 0 1 0 51V2A2 2 0 0 1 2 0ZM18.6 18.08A4.5 4.5 0 1 1 22.4 18.08L23.3 25.4Q23.45 26.6 22.25 26.6H18.75Q17.55 26.6 17.7 25.4Z';
const DOTS = [[12.5, 39.4], [12.5, 46.4], [19.5, 46.4]];

export function drawSymbol(g, x, y, h, fill) {
  const k = h / 53;
  g.save(); g.translate(x, y); g.scale(k, k);
  if (fill) g.fillStyle = fill;
  else { const grd = g.createLinearGradient(6, 0, 34, 53); grd.addColorStop(0, BRAND.cyan); grd.addColorStop(1, BRAND.blue); g.fillStyle = grd; }
  g.fill(new Path2D(SYMBOL_PATH), 'evenodd');
  for (const [rx, ry] of DOTS) { roundRect(g, rx, ry, 5, 5, 1); g.fill(); }
  g.restore();
}
export function drawWordmark(g, x, y, size, { light = true } = {}) {
  g.direction = 'ltr'; g.textAlign = 'left';
  g.font = `700 ${size}px ${WM}`;
  try { g.letterSpacing = (size * 0.03).toFixed(1) + 'px'; } catch (e) { /* older canvas */ }
  g.fillStyle = light ? '#ffffff' : BRAND.navy; g.fillText('DIGITAL', x, y);
  const w = g.measureText('DIGITAL ').width;
  g.fillStyle = light ? BRAND.cyan : BRAND.blue; g.fillText('PASS', x + w, y);
  const total = w + g.measureText('PASS').width;
  try { g.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  return total;
}

/* Outlines of the symbol and the wordmark are precomputed (assets/data/brand.json): y up, origin bottom-left. */
let _brand = null;
export async function loadBrand() {
  if (!_brand) _brand = await (await fetch(new URL('../../data/brand.json', import.meta.url))).json();
  return _brand;
}
const pts = (a) => { const o = []; for (let i = 0; i < a.length; i += 2) o.push(new THREE.Vector2(a[i], a[i + 1])); return o; };
const toShapes = (list) => list.map(({ o, h }) => { const s = new THREE.Shape(pts(o)); for (const hh of h) s.holes.push(new THREE.Path(pts(hh))); return s; });

function paint(geo, color) {
  const c = new THREE.Color(color), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
function applyGradient(geo, c1, c2, dx = 0.5, dy = -0.866) {
  const pos = geo.attributes.position, a = new THREE.Color(c1), b = new THREE.Color(c2), c = new THREE.Color();
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < pos.count; i++) { const v = pos.getX(i) * dx + pos.getY(i) * dy; mn = Math.min(mn, v); mx = Math.max(mx, v); }
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { c.copy(a).lerp(b, (pos.getX(i) * dx + pos.getY(i) * dy - mn) / (mx - mn)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
/* drop the triangles that face a given direction (e.g. the hidden back of a sign) */
function dropFacing(geo, nx, ny, nz) {
  const p = geo.attributes.position.array, n = geo.attributes.normal.array, keepP = [], keepN = [];
  for (let i = 0; i < p.length; i += 9) {
    if (n[i] * nx + n[i + 1] * ny + n[i + 2] * nz > 0.9) continue;
    for (let k = 0; k < 9; k++) { keepP.push(p[i + k]); keepN.push(n[i + k]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(keepP, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(keepN, 3));
  return g;
}
function extrude(shapes, s, depth, bevel) {
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: depth / s, bevelEnabled: bevel > 0, bevelThickness: bevel / s, bevelSize: bevel / s, bevelSegments: 1, curveSegments: 4 });
  geo.scale(s, s, s);
  return dropFacing(geo.index ? geo.toNonIndexed() : geo, 0, 0, -1);
}
/* The key symbol, extruded. Origin bottom-left, faces +z. */
export function symbolGeometry(brand, { height = 5, depth = 0.4, bevel = 0 } = {}) {
  const geo = extrude(toShapes(brand.symbol.shapes), height / brand.symbol.h, depth, bevel);
  geo.userData = { width: height * 37.25 / 53, height };
  return geo;
}
export function mergeGeos(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const g of list) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}
/* Horizontal lockup (gradient key + DIGITAL PASS) as one vertex-coloured geometry. Origin bottom-left, faces +z. */
export function logoGeometry(brand, { cap = 2, depth = 0.3, light = false, symbolScale = 2.25, gap = 0.8, bevel = 0 } = {}) {
  const symH = cap * symbolScale;
  const sym = applyGradient(symbolGeometry(brand, { height: symH, depth, bevel }), BRAND.cyan, BRAND.blue);
  const s = cap / brand.wordmark.cap, x0 = symH * 37.25 / 53 + cap * gap, y0 = (symH - cap) / 2;
  const parts = [sym];
  for (const [w, color] of [['DIGITAL', light ? '#ffffff' : BRAND.navy], ['PASS', light ? BRAND.cyan : BRAND.blue]]) {
    const g = extrude(toShapes(brand.wordmark.words[w]), s, depth, 0);
    g.translate(x0, y0, 0);
    parts.push(paint(g, color));
  }
  const geo = mergeGeos(parts);
  geo.userData = { width: x0 + brand.wordmark.width * s, height: symH };
  return geo;
}

/* ---------- canvas icons (24-unit grid) ---------- */
export function drawIcon(g, kind, cx, cy, s, color = '#fff', lw = 6) {
  g.save(); g.translate(cx, cy); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  const u = s / 24;
  const P = (p) => { g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo((x - 12) * u, (y - 12) * u) : g.moveTo((x - 12) * u, (y - 12) * u))); g.stroke(); };
  const Rr = (x, y, w, h, r = 2) => { roundRect(g, (x - 12) * u, (y - 12) * u, w * u, h * u, r * u); g.stroke(); };
  const O = (x, y, r) => { g.beginPath(); g.arc((x - 12) * u, (y - 12) * u, r * u, 0, Math.PI * 2); g.stroke(); };
  if (kind === 'grid') { Rr(3, 3, 8, 8); Rr(13, 3, 8, 8); Rr(3, 13, 8, 8); Rr(13, 13, 8, 8); }
  else if (kind === 'phone') { Rr(6, 2, 12, 20, 3); P([[11, 18], [13, 18]]); }
  else if (kind === 'gear') { O(12, 12, 3.5); O(12, 12, 7.5); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P([[12 + Math.cos(a) * 7.5, 12 + Math.sin(a) * 7.5], [12 + Math.cos(a) * 10.5, 12 + Math.sin(a) * 10.5]]); } }
  else if (kind === 'spark') { P([[12, 2], [12, 22]]); P([[2, 12], [22, 12]]); P([[5, 5], [19, 19]]); P([[19, 5], [5, 19]]); }
  else if (kind === 'browser') { Rr(2, 4, 20, 16, 2); P([[2, 9], [22, 9]]); }
  else if (kind === 'bag') { P([[5, 8], [19, 8], [18, 21], [6, 21], [5, 8]]); g.beginPath(); g.arc(0, -4 * u, 3.4 * u, Math.PI, 0); g.stroke(); }
  else if (kind === 'brush') { P([[4, 20], [10, 14]]); P([[10, 14], [20, 4]]); Rr(3, 15, 6, 6, 3); }
  else if (kind === 'shield') { P([[12, 2], [20, 5], [20, 12], [12, 22], [4, 12], [4, 5], [12, 2]]); P([[8, 12], [11, 15], [16, 9]]); }
  else if (kind === 'eye') { g.beginPath(); g.ellipse(0, 0, 10 * u, 6 * u, 0, 0, Math.PI * 2); g.stroke(); O(12, 12, 3); }
  else if (kind === 'star') { P([[12, 2], [15, 9], [22, 9.5], [16.5, 14], [18.5, 21], [12, 17], [5.5, 21], [7.5, 14], [2, 9.5], [9, 9], [12, 2]]); }
  else if (kind === 'hand') { P([[3, 13], [8, 9], [13, 10], [18, 8], [21, 11], [14, 17], [7, 17], [3, 14]]); }
  g.restore();
}

/* ---------- sky (soft clouds, drawn once) used as background and for image based lighting ---------- */
async function cloudSkyCanvas(sun, { stops, seed, W, H, cover, glow }) {
  const R = rng(seed);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const yOf = (e) => (90 - e) / 180 * H;
  const grd = g.createLinearGradient(0, 0, 0, H);
  for (const [e, col] of stops) grd.addColorStop(clamp((90 - e) / 180), col);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const sx = (Math.atan2(sun.z, sun.x) / (Math.PI * 2) + 0.5) * W, sy = yOf(THREE.MathUtils.radToDeg(Math.asin(sun.y)));
  for (const dx of [-W, 0, W]) {
    const rg = g.createRadialGradient(sx + dx, sy, 0, sx + dx, sy, H * glow);
    rg.addColorStop(0, 'rgba(255,248,232,0.95)'); rg.addColorStop(0.08, 'rgba(255,246,228,0.55)'); rg.addColorStop(0.4, 'rgba(255,244,225,0.12)'); rg.addColorStop(1, 'rgba(255,244,225,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  }
  const puff = (x, y, r, a, col) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(0.55, `rgba(${col},${a * 0.6})`); rg.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  const n = Math.floor(110 * cover), k0 = W / 4096;
  for (let i = 0; i < n; i++) {
    if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0));   // painted in small batches: no long stall
    const e = 1.5 + Math.pow(R(), 2.2) * 30, x = R() * W, y = yOf(e);
    const scale = (0.35 + (e / 30) * 0.9) * k0;
    const cw = (24 + R() * 80) * scale, ch = cw * (0.24 + R() * 0.14);
    g.save(); g.translate(x, y); g.scale(1, 0.55);
    const puffs = 8 + Math.floor(R() * 12);
    for (let k = 0; k < puffs; k++) { const px = (R() - 0.5) * cw, py = (R() - 0.65) * ch * 1.6, pr = (0.25 + R() * 0.35) * ch * 2.2; puff(px, py + pr * 0.35, pr * 1.05, 0.28, '176,192,212'); }
    for (let k = 0; k < puffs; k++) { const px = (R() - 0.5) * cw, py = (R() - 0.75) * ch * 1.6, pr = (0.22 + R() * 0.32) * ch * 2.2; puff(px, py, pr, 0.55 + R() * 0.3, '255,255,255'); }
    g.restore();
  }
  return c;
}
export async function makeSky(scene, renderer, { elevation = 45, azimuth = -55, stops, W = 2048, cover = 0.3, glow = 0.18, seed = 7, env = true } = {}) {
  const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevation), THREE.MathUtils.degToRad(azimuth));
  const tex = new THREE.CanvasTexture(await cloudSkyCanvas(sun, { stops, seed, W, H: W / 2, cover, glow }));
  await new Promise((r) => setTimeout(r, 0));
  tex.colorSpace = THREE.SRGBColorSpace; tex.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = tex;
  if (!env) return sun;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  return sun;
}

/* ---------- shared geometry + materials ---------- */
const GEO = new Map();
export function geo(key, make) { let g = GEO.get(key); if (!g) { g = make(); GEO.set(key, g); } return g; }
export const G = {
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  plane: () => geo('plane', () => new THREE.PlaneGeometry(1, 1)),                 // faces +z
  cyl: () => geo('cyl', () => new THREE.CylinderGeometry(1, 1, 1, 20)),           // r 1, h 1, centred
  cyl8: () => geo('cyl8', () => new THREE.CylinderGeometry(1, 1, 1, 8)),
  disc: () => geo('disc', () => new THREE.CircleGeometry(1, 28)),                 // faces +z
  ball: () => geo('ball', () => new THREE.SphereGeometry(1, 14, 10)),
  leaf: () => geo('leaf', () => new THREE.IcosahedronGeometry(1, 1)),
  cone: () => geo('cone', () => new THREE.ConeGeometry(1, 1, 8))
};
const std = (o) => new THREE.MeshStandardMaterial(o);
/* A handful of materials shared by every batch; colour comes per instance. */
export const M = {
  matte: std({ roughness: 0.55, metalness: 0.05 }),
  matte2: std({ roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }),
  soft: std({ roughness: 0.9, metalness: 0 }),
  metal: std({ roughness: 0.34, metalness: 0.55 }),
  gloss: std({ roughness: 0.12, metalness: 0.6 }),
  paint: std({ roughness: 0.3, metalness: 0.45 }),
  leaf: std({ roughness: 0.85, flatShading: true }),
  glow: new THREE.MeshBasicMaterial({ toneMapped: false }),
  lit: new THREE.MeshBasicMaterial(),                                              // unlit but tone mapped (self-lit panels)
  logo: std({ vertexColors: true, roughness: 0.35, metalness: 0.15 }),
  logoLit: new THREE.MeshBasicMaterial({ vertexColors: true }),
  glass: std({ color: 0xcfe0ee, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.2, envMapIntensity: 1.5, depthWrite: false }),
  glassIn: std({ color: 0xe6f1fb, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.09, envMapIntensity: 0.6, depthWrite: false }),
  ghost: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })     // casts a shadow, draws nothing
};

/* ---------- batching: thousands of parts in a handful of draw calls (one InstancedMesh per geometry + material) ---------- */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
export function makeKit({ cast = true, receive = true } = {}) {
  const batches = new Map();
  const stack = [new THREE.Matrix4()];
  const kit = {
    push(x = 0, y = 0, z = 0, ry = 0, s = 1, rx = 0) {   // yaw, then tilt
      const m = new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, 0, 'YXZ')), _s.set(s, s, s));
      stack.push(stack[stack.length - 1].clone().multiply(m));
    },
    pop() { stack.pop(); },
    at(x, y, z, ry, fn, s = 1) { kit.push(x, y, z, ry, s); fn(); kit.pop(); },
    add(g, mat, x = 0, y = 0, z = 0, o = {}) {
      const c = o.cast ?? cast, r = o.receive ?? receive;
      const key = g.uuid + mat.uuid + (c ? 1 : 0) + (r ? 1 : 0);
      let b = batches.get(key);
      if (!b) { b = { g, mat, mats: [], cols: [], c, r, tint: false }; batches.set(key, b); }
      _m4.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'XYZ')), _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1));
      b.mats.push(stack[stack.length - 1].clone().multiply(_m4));
      b.cols.push(o.color ?? 0xffffff); if (o.color !== undefined) b.tint = true;
    },
    box(w, h, d, mat, x, y, z, o = {}) { kit.add(G.box(), mat, x, y, z, { ...o, sx: w, sy: h, sz: d }); },
    cyl(r, h, mat, x, y, z, o = {}) { kit.add(o.low ? G.cyl8() : G.cyl(), mat, x, y, z, { ...o, sx: r, sy: h, sz: o.r2 ?? r }); },
    plane(w, h, mat, x, y, z, o = {}) { kit.add(G.plane(), mat, x, y, z, { ...o, sx: w, sy: h }); },   // faces +z; rx -PI/2 = facing up
    build(parent) {
      const out = [];
      for (const b of batches.values()) {
        const im = new THREE.InstancedMesh(b.g, b.mat, b.mats.length);
        b.mats.forEach((m, i) => im.setMatrixAt(i, m));
        if (b.tint) b.cols.forEach((col, i) => im.setColorAt(i, col.isColor ? col : _c.set(col)));
        im.castShadow = b.c; im.receiveShadow = b.r;
        im.computeBoundingSphere();
        if (b.mat.transparent) im.renderOrder = 5;
        parent.add(im); out.push(im);
      }
      batches.clear();
      return out;
    }
  };
  return kit;
}

/* ---------- textured quads merged into one geometry (window faces, roads) ---------- */
export function quadBatch() {
  const pos = [], nor = [], uv = [], idx = [];
  const quad = (a, b, c, d, n, u0, v0, u1, v1, swap) => {
    const i = pos.length / 3;
    pos.push(...a, ...b, ...c, ...d); nor.push(...n, ...n, ...n, ...n);
    if (swap) uv.push(u0, v0, u0, v1, u1, v1, u1, v0); else uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  return {
    /* vertical wall from (x0,z0) to (x1,z1), seen from its right-hand side: u runs along the wall, v up */
    wall(x0, z0, x1, z1, y0, y1, u0, v0, u1, v1) {
      const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
      quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [-dz / l, 0, dx / l], u0, v0, u1, v1);
    },
    /* horizontal rectangle facing up; alongZ: the texture's u axis runs along z */
    flat(x0, z0, x1, z1, y, u0, v0, u1, v1, alongZ = false) {
      quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], u0, v0, u1, v1, alongZ);
    },
    /* horizontal rectangle facing down (ceilings) */
    ceil(x0, z0, x1, z1, y, u0, v0, u1, v1) {
      quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, -1, 0], u0, v0, u1, v1);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      return g;
    }
  };
}

/* ---------- scale figures ---------- */
const TOPS = [0x1f2a3a, 0xf4f4f2, 0x2d63fc, 0x59606b, 0x1fc8f6, 0x0a1b3d, 0x8a4f3a, 0x3e7d6a, 0xd9d4c7, 0xb8483e];
const PANTS = [0x1d2430, 0x2b3442, 0x3b3f46, 0x0a1b3d, 0x6b6458, 0x1a1a1c];
const SKIN = [0xc99a74, 0x8d5a3b, 0xe6c3a0, 0xa8754f];
const PG = {
  leg: () => geo('p-leg', () => new THREE.CylinderGeometry(0.08, 0.062, 0.86, 7).translate(0, -0.43, 0)),
  torso: () => geo('p-torso', () => new THREE.CylinderGeometry(0.2, 0.15, 0.6, 10).translate(0, 0.3, 0)),
  sh: () => geo('p-sh', () => new THREE.SphereGeometry(0.2, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.45, 0.8)),
  arm: () => geo('p-arm', () => new THREE.CylinderGeometry(0.052, 0.045, 0.62, 6).translate(0, -0.31, 0)),
  head: () => geo('p-head', () => new THREE.SphereGeometry(0.115, 10, 8))
};
export function addPerson(K, x, y, z, seed, { ry, walk } = {}) {
  const R = rng(seed * 7919 + 13);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const top = pick(TOPS), pants = pick(PANTS), skin = pick(SKIN);
  const stride = (walk ?? R() < 0.6) ? 0.18 + R() * 0.16 : 0;
  K.push(x, y, z, ry ?? R() * Math.PI * 2, 0.94 + R() * 0.12);
  for (const sx of [-1, 1]) {
    K.add(PG.leg(), M.matte, sx * 0.085, 0.88, 0, { rx: sx * stride, color: pants });
    K.add(PG.arm(), M.matte, sx * 0.235, 1.43, 0, { rx: -sx * stride * 0.9, rz: sx * 0.07, color: top });
  }
  K.add(PG.torso(), M.matte, 0, 0.86, 0, { color: top });
  K.add(PG.sh(), M.matte, 0, 1.45, 0, { color: top });
  K.add(PG.head(), M.matte, 0, 1.68, 0, { color: skin });
  K.pop();
}

/* soft round shadow for furniture on interior floors */
export function blobTexture() {
  return geo('blob-tex', () => canvasTex(128, 128, (g, w, h) => {
    const rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    rg.addColorStop(0, 'rgba(10,20,40,0.5)'); rg.addColorStop(0.6, 'rgba(10,20,40,0.22)'); rg.addColorStop(1, 'rgba(10,20,40,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }, { repeat: false }));
}
