/* Digital Pass HQ — the outside world: campus (terrain, roads, trees, low buildings) and the headquarters
   building with its lobby. Front faces +z, origin at the tower footprint centre, ground y = 0. */
import { THREE, rng, clamp, canvasTex, roundRect, SYMBOL_PATH, M, G, geo, makeKit, quadBatch, addPerson, setClip, getClip } from './core.js';

export const C = { white: 0xf3f4f6, off: 0xe4e7eb, roof: 0xd9dde2, grey: 0xb9c0c8, fin: 0xc9d0d8, frame: 0x3d4652, dark: 0x2a3340, blue: 0x2d63fc, blueDeep: 0x1f46b0,
  metal: 0xd2d7de, navy: 0x0a1b3d, cyan: 0x1fc8f6, led: 0x8fecff, pot: 0xeceff2, trunk: 0x8f8a80, lawn: 0xcfe0c2, leaf: 0x34a58b };
export const HQ = {
  TW: 34, TD: 28, topY: 88, fascia: 6.8, deckY: 95.1,
  spine: { x0: 8.3, x1: 15.8, z0: 12.4, z1: 18.4, top: 103.5 },
  lift: { x: 12, z: 15.3, w: 3.2, h: 2.7 },
  levels: [0.07, 24, 44, 64, 95.1],          // lobby, three fitted-out floors, roof terrace
  entry: { x: -3, z: 11 },
  wing: { x: -31.5, z: 6, w: 30, d: 40, top: 20 }
};
const TEAL = [0x2f9c87, 0x3aa891, 0x258a78, 0x4cb39a, 0x2b8f6e];
const CAR = [0xf2f2f2, 0x1d1f24, 0xb9bec6, 0x2a3c5a, 0xe9e6df, 0x7d1f24, 0x5d6168, 0xffffff];
const std = (o) => new THREE.MeshStandardMaterial(o);
export const mb = (K, w, h, d, col, x, y, z, o) => K.box(w, h, d, M.matte, x, y, z, { color: col, ...o });   // matte box
export const tb = (K, w, h, d, col, x, y, z, o) => K.box(w, h, d, M.metal, x, y, z, { color: col, ...o });   // metal box
export const lb = (K, w, h, d, col, x, y, z) => K.box(w, h, d, M.glow, x, y, z, { color: col, cast: false, receive: false }); // light strip
const ground = (level, o) => geo('ground' + level + (o.map ? o.map.uuid : ''), () => std({ roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -level, polygonOffsetUnits: -level * 2, ...o }));

/* ---------- window grid: 12 bays x 8 floors with readable rooms, plus a matching emissive map ---------- */
/* glass: natural reflective glass panes (cool blue-grey, sky reflections, no lit interiors) instead of offices */
function glassMaterial(W) {
  const R = rng(17), cols = 12, rows = 8, cw = 2048 / cols, ch = 1536 / rows, top = 0.2, F = 8, k = W / 2048;
  const map = canvasTex(W, W * 0.75, (g) => {
    g.scale(k, k); g.fillStyle = '#4a5562'; g.fillRect(0, 0, 2048, 1536);        // frame and spandrels
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw, y = r * ch, gy = y + ch * top, gh = ch * (1 - top), px = x + F, pw = cw - 2 * F, py = gy + 3, ph = gh - F - 2;
      const t = R() * 0.12 - 0.06, gr = g.createLinearGradient(0, py, 0, py + ph);   // sky above, ground below, a touch of tone per pane
      const mix = (a, b) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * (0.5 + t))).join(',')})`;
      gr.addColorStop(0, mix([150, 182, 210], [176, 202, 226])); gr.addColorStop(0.45, mix([102, 132, 160], [122, 152, 178])); gr.addColorStop(1, mix([62, 84, 104], [78, 100, 120]));
      g.fillStyle = gr; g.fillRect(px, py, pw, ph);
      if (R() < 0.5) {                                                                 // a diagonal sheen on some panes
        g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip(); g.fillStyle = 'rgba(255,255,255,0.13)';
        const sx = px - ph * 0.6 + R() * 1.6 * (pw + ph * 0.6);
        g.beginPath(); g.moveTo(sx, py + ph); g.lineTo(sx + 34, py + ph); g.lineTo(sx + 34 + ph * 0.6, py); g.lineTo(sx + ph * 0.6, py); g.fill(); g.restore();
      }
      g.fillStyle = 'rgba(20,30,40,0.18)'; g.fillRect(px, py + ph * 0.84, pw, ph * 0.16);   // sill shadow
      g.fillStyle = '#3c4652'; g.fillRect(x + cw / 2 - 2.5, gy, 5, gh); g.fillRect(px, py + ph * 0.84, pw, 4);   // mullion, transom
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(px, py, pw, 2);
    }
  }, { aniso: 8, scale: 1 });
  return std({ map, color: 0xffffff, roughness: 0.1, metalness: 0.55, envMapIntensity: 1.25 });
}
function windowMaterial(W) {
  const R = rng(11), cols = 12, rows = 8, cw = 2048 / cols, ch = 1536 / rows, top = 0.2, F = 8, k = W / 2048;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c, lit: R() < 0.62, blinds: R() < 0.2 ? 0.2 + R() * 0.4 : 0, desk: R() < 0.78, ppl: R() < 0.5, plant: R() < 0.28, mon: 1 + Math.floor(R() * 3), s: Math.floor(R() * 1e6), streak: R() });
  const cell = (g, c, E) => {
    const x = c.c * cw, y = c.r * ch, gy = y + ch * top, gh = ch * (1 - top);
    const px = x + F, pw = cw - 2 * F, py = gy + 3, ph = gh - F - 2, RR = rng(c.s + 11);
    if (!c.lit) {
      if (!E) {
        const gr = g.createLinearGradient(0, py, 0, py + ph);
        gr.addColorStop(0, '#7f9ab6'); gr.addColorStop(0.32, '#3a4e63'); gr.addColorStop(1, '#1b2531');
        g.fillStyle = gr; g.fillRect(px, py, pw, ph);
        g.fillStyle = 'rgba(8,14,22,0.35)'; g.fillRect(px, py + ph * 0.62, pw, ph * 0.38);
        g.fillStyle = 'rgba(8,14,22,0.5)'; g.fillRect(px + 10, py + ph * 0.58, pw - 20, 4);
      }
    } else {
      const ceil = ph * 0.15;
      g.fillStyle = E ? '#4a3c2c' : '#f1e8d8'; g.fillRect(px, py, pw, ceil);
      g.fillStyle = E ? '#fff4e0' : '#fffdf6';
      g.fillRect(px + pw * 0.1, py + ceil * 0.35, pw * 0.32, ceil * 0.34); g.fillRect(px + pw * 0.58, py + ceil * 0.35, pw * 0.32, ceil * 0.34);
      const wall = g.createLinearGradient(0, py + ceil, 0, py + ph);
      if (E) { wall.addColorStop(0, '#ffc77c'); wall.addColorStop(1, '#c47630'); } else { wall.addColorStop(0, '#ffe1ad'); wall.addColorStop(1, '#eda55a'); }
      g.fillStyle = wall; g.fillRect(px, py + ceil, pw, ph - ceil);
      g.fillStyle = E ? 'rgba(0,0,0,0.25)' : 'rgba(150,95,45,0.25)'; g.fillRect(px, py + ph * 0.55, pw, 3);
      g.fillStyle = E ? 'rgba(40,20,6,0.7)' : 'rgba(150,92,46,0.6)'; g.fillRect(px, py + ph * 0.86, pw, ph * 0.14);
      const dy = py + ph * 0.62;
      if (c.desk) {
        g.fillStyle = E ? 'rgba(30,15,4,0.85)' : '#86664a'; g.fillRect(px + 6, dy, pw - 12, 6);
        g.fillRect(px + 14, dy, 5, ph * 0.24); g.fillRect(px + pw - 19, dy, 5, ph * 0.24);
        for (let i = 0; i < c.mon; i++) {
          const mx = px + 16 + (i + 0.5) * (pw - 32) / c.mon - 13;
          g.fillStyle = E ? '#000' : '#1b2330'; g.fillRect(mx, dy - 24, 26, 18); g.fillRect(mx + 11, dy - 7, 4, 7);
          g.fillStyle = E ? '#46d4ff' : '#62d8ff'; g.fillRect(mx + 2, dy - 22, 22, 13);
        }
      }
      if (c.ppl) {
        const n = 1 + Math.floor(RR() * 2);
        for (let i = 0; i < n; i++) {
          const hx = px + 22 + RR() * (pw - 44), standing = RR() < 0.4, hy = standing ? py + ph * 0.34 : py + ph * 0.49;
          g.fillStyle = E ? 'rgba(0,0,0,0.8)' : 'rgba(58,40,28,0.88)';
          g.beginPath(); g.arc(hx, hy, 7, 0, Math.PI * 2); g.fill();
          roundRect(g, hx - 11, hy + 9, 22, standing ? ph * 0.46 : ph * 0.28, 8); g.fill();
        }
      }
      if (c.plant) {
        const plx = px + (RR() < 0.5 ? 18 : pw - 32);
        g.fillStyle = E ? '#000' : '#f2f2f0'; g.fillRect(plx - 7, py + ph * 0.77, 18, ph * 0.12);
        g.fillStyle = E ? 'rgba(0,0,0,0.92)' : '#3e8a5c';
        g.beginPath(); g.ellipse(plx + 2, py + ph * 0.64, 15, 24, 0, 0, Math.PI * 2); g.fill();
      }
      if (c.blinds) {
        const bh = ph * c.blinds;
        g.fillStyle = E ? '#2c2318' : '#ebe8e1'; g.fillRect(px, py, pw, bh);
        g.fillStyle = E ? '#000' : 'rgba(150,145,135,0.65)';
        for (let yy = py + 5; yy < py + bh; yy += 7) g.fillRect(px, yy, pw, 1.5);
      }
      if (!E) {
        const rg = g.createLinearGradient(0, py, 0, py + ph * 0.42);
        rg.addColorStop(0, 'rgba(175,200,225,0.55)'); rg.addColorStop(1, 'rgba(175,200,225,0)');
        g.fillStyle = rg; g.fillRect(px, py, pw, ph * 0.42);
      }
    }
    if (!E && c.streak < 0.45) {
      g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.12)';
      const sx = px - ph * 0.6 + c.streak * 2.2 * (pw + ph * 0.6);
      g.beginPath(); g.moveTo(sx, py + ph); g.lineTo(sx + 30, py + ph); g.lineTo(sx + 30 + ph * 0.6, py); g.lineTo(sx + ph * 0.6, py); g.fill();
      g.restore();
    }
    g.fillStyle = E ? '#000' : '#46505c';
    g.fillRect(x + cw / 2 - 2.5, gy, 5, gh); g.fillRect(px, py + ph * 0.84, pw, 4);
    if (!E) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(px, py, pw, 2); }
  };
  const draw = (E) => (g) => { g.scale(k, k); g.fillStyle = E ? '#000' : '#3b4450'; g.fillRect(0, 0, 2048, 1536); for (const c of cells) cell(g, c, E); };
  const map = canvasTex(W, W * 0.75, draw(false), { aniso: 8, scale: 1 }), emi = canvasTex(W, W * 0.75, draw(true), { aniso: 8, scale: 1 });
  return std({ map, color: 0xa3aab3, emissiveMap: emi, emissive: 0xffffff, emissiveIntensity: 1.45, roughness: 0.18, metalness: 0.4, envMapIntensity: 0.9 });
}

/* ---------- small textures ---------- */
const roadTex = () => canvasTex(1024, 256, (g, w, h) => {
  const R = rng(4);
  g.fillStyle = '#bcc2c9'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 6000; k++) { const v = 178 + Math.floor((R() - 0.5) * 30); g.fillStyle = `rgba(${v},${v + 3},${v + 7},0.5)`; g.fillRect(R() * w, R() * h, 2, 2); }
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(0, 12, w, 5); g.fillRect(0, h - 17, w, 5);
  for (let x = 0; x < w; x += 80) g.fillRect(x, h / 2 - 3, 44, 6);
});
const parkingTex = () => canvasTex(1024, 512, (g, w, h) => {
  g.fillStyle = '#d3d7dc'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.95)';
  for (let x = 0; x <= w; x += 64) { g.fillRect(x, 20, 4, h * 0.38); g.fillRect(x, h * 0.6, 4, h * 0.38); }
  g.fillRect(0, 20, w, 4); g.fillRect(0, h - 24, w, 4);
}, { repeat: false });
function litPair(draw) { return { map: canvasTex(512, 512, draw(false)), emi: canvasTex(512, 512, draw(true)) }; }
const soffitTex = () => litPair((E) => (g, w, h) => {
  g.fillStyle = E ? '#000' : '#e9ecef'; g.fillRect(0, 0, w, h);
  if (!E) { g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i <= 4; i++) { g.fillRect(i * w / 4 - 1, 0, 2, h); g.fillRect(0, i * h / 4 - 1, w, 2); } }
  g.fillStyle = E ? '#fff1d6' : '#ffffff';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc((i + 0.5) * w / 4, (j + 0.5) * h / 4, 14, 0, Math.PI * 2); g.fill(); }
});
export const ceilingTex = () => geo('ceil-tex', () => litPair((E) => (g, w, h) => {
  g.fillStyle = E ? '#3a342b' : '#f3f1ec'; g.fillRect(0, 0, w, h);
  if (!E) { g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i <= 4; i++) g.fillRect(i * w / 4 - 1, 0, 2, h); }
  g.fillStyle = E ? '#fff6e6' : '#fffefa';
  for (let i = 0; i < 4; i++) g.fillRect(0, i * h / 4 + h / 8 - 7, w, 14);
}));
const woodTex = () => canvasTex(512, 512, (g, w, h) => {
  const R = rng(31);
  for (let x = 0; x < w; x += 16) { const v = R(); g.fillStyle = `rgb(${176 + v * 24},${126 + v * 18},${82 + v * 14})`; g.fillRect(x, 0, 12, h); g.fillStyle = 'rgba(60,35,15,0.55)'; g.fillRect(x + 12, 0, 4, h); }
});
export const stoneTex = () => geo('stone-tex', () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#ebe7df'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(120,110,95,0.25)';
  for (let i = 0; i <= 4; i++) { g.fillRect(i * w / 4 - 1, 0, 2, h); g.fillRect(0, i * h / 4 - 1, w, 2); }
}));
export const deckTex = () => geo('deck-tex', () => canvasTex(512, 512, (g, w, h) => {
  const R = rng(8);
  for (let y = 0; y < h; y += 16) { const v = R(); g.fillStyle = `rgb(${196 + v * 20},${156 + v * 16},${112 + v * 12})`; g.fillRect(0, y, w, 13); g.fillStyle = 'rgba(90,55,25,0.5)'; g.fillRect(0, y + 13, w, 3); }
}));
const pvTex = () => canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#1b3566'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(190,210,240,0.55)';
  for (let x = 0; x <= w; x += 32) g.fillRect(x, 0, 2, h); for (let y = 0; y <= h; y += 32) g.fillRect(0, y, w, 2);
});
const flagTex = () => canvasTex(512, 320, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1fc8f6'); gr.addColorStop(1, '#2d63fc');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const s = (h * 0.62) / 53; g.translate(w / 2 - 37.5 * s / 2, h * 0.19); g.scale(s, s);
  g.fillStyle = '#ffffff'; g.fill(new Path2D(SYMBOL_PATH), 'evenodd');
  for (const [x, y] of [[12.5, 39.4], [12.5, 46.4], [19.5, 46.4]]) { roundRect(g, x, y, 5, 5, 1); g.fill(); }
}, { repeat: false });

/* ---------- terrain: flat campus, hills behind, misty mountains ---------- */
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
const BX = 0.622, BZ = -0.783; // the direction "behind" the HQ
const sstep = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  if (r < 330) return 0;
  const side = clamp(0.3 + 0.7 * ((x * BX + z * BZ) / r * 0.5 + 0.5), 0.25, 1);
  const hills = sstep(r, 420, 1000) * (30 + 150 * fbm(x * 0.0022 + 7, z * 0.0022 - 3)) * side;
  const mtn = r > 1300 ? sstep(r, 1300, 3000) * (260 + 900 * Math.pow(fbm(x * 0.0007 + 21, z * 0.0007 + 9, 6), 1.6)) * (0.55 + 0.45 * side) : 0;
  return hills + mtn;
}
function terrain(group, reach = 0) {
  const size = reach ? reach * 2 + 600 : 9000, g = new THREE.PlaneGeometry(size, size, reach ? Math.round(size / 41) : 220, reach ? Math.round(size / 41) : 220);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const cFlat = new THREE.Color('#e7eaed'), cHill = new THREE.Color('#c9d2bf'), cGreen = new THREE.Color('#b4c6a0'), cRock = new THREE.Color('#c9cdd2'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = terrainHeight(x, z);
    pos.setY(i, y);
    c.copy(cFlat).lerp(cHill, clamp(y / 60));
    if (y > 4 && y < 160) c.lerp(cGreen, clamp((fbm(x * 0.006, z * 0.006, 3) - 0.45) * 2.2, 0, 0.7));
    if (y > 200) c.lerp(cRock, clamp((y - 200) / 300, 0, 0.8));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, std({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  group.add(m);
}

/* ---------- props ---------- */
function tree(K, R, x, z, s = 1) {
  const h = (5 + R() * 3) * s, r = (2 + R()) * s;
  K.box(0.36, h * 0.5, 0.36, M.soft, x, h * 0.25, z, { color: C.trunk });
  K.add(G.leaf(), M.leaf, x, h * 0.45 + r * 1.05, z, { sx: r, sy: r * 1.3, sz: r, color: TEAL[Math.floor(R() * TEAL.length)] });
}
export function shrub(K, x, y, z, r = 1, col = C.leaf, sy = 1) { K.add(G.leaf(), M.leaf, x, y, z, { sx: r, sy: r * sy, sz: r, color: col }); }
function car(K, R, x, z, ry) {
  const L = 4.5 + R() * 0.6, W = 1.85, suv = R() < 0.4, by = suv ? 0.75 : 0.62;
  K.push(x, 0, z, ry);
  K.box(W, suv ? 0.9 : 0.7, L, M.paint, 0, by, 0, { color: CAR[Math.floor(R() * CAR.length)] });
  K.box(W * 0.9, suv ? 0.75 : 0.55, L * (suv ? 0.62 : 0.5), M.gloss, 0, by + (suv ? 0.8 : 0.6), -L * 0.04, { color: 0x1b2430 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.cyl(0.36, 0.26, M.soft, sx * W / 2, 0.36, sz * L * 0.32, { rz: Math.PI / 2, low: true, color: 0x16171a, cast: false });
  K.pop();
}
function acUnit(K, R, x, y, z) {
  const w = 2.2 + R() * 1.6, d = 1.6 + R(), h = 1.3 + R() * 0.6, fr = Math.min(w / 2, d) * 0.36;
  mb(K, w, h, d, C.off, x, y + h / 2, z); tb(K, w + 0.1, 0.12, d + 0.1, C.grey, x, y + h, z);
  for (const s of [-1, 1]) K.cyl(fr, 0.1, M.metal, x + s * w * 0.24, y + h + 0.07, z, { color: C.dark, cast: false });
  for (let k = 0; k < 4; k++) tb(K, w * 0.86, 0.06, 0.05, C.grey, x, y + h * (0.25 + k * 0.15), z + d / 2 + 0.03, { cast: false });
}
const bowlGeo = () => geo('bowl', () => new THREE.SphereGeometry(1, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.38));
function dish(K, x, y, z, r, tilt, yaw) {
  const ph = r * 1.1 + 0.6;
  tb(K, 1.4, 0.3, 1.4, C.grey, x, y + 0.15, z); tb(K, 0.3, ph, 0.3, C.grey, x, y + ph / 2, z);
  K.push(x, y + ph, z, yaw, 1, -tilt);
  K.add(bowlGeo(), M.matte2, 0, 0, 0, { rx: Math.PI, sx: r, sy: r, sz: r, color: C.white });
  tb(K, 0.12, r * 0.9, 0.12, C.grey, 0, -r * 0.45, 0, { cast: false }); tb(K, 0.35, 0.35, 0.35, C.dark, 0, -r * 0.92, 0, { cast: false });
  K.pop();
}
function mast(K, x, y, z, h) {
  tb(K, 0.5, h, 0.5, C.metal, x, y + h / 2, z); tb(K, 2.2, 0.5, 2.2, C.grey, x, y + 0.25, z);
  for (let i = 1; i <= 3; i++) { const yy = y + h * (0.45 + i * 0.15), l = 2.6 - i * 0.5; tb(K, l, 0.12, 0.12, C.metal, x, yy, z); tb(K, 0.12, 0.12, l, C.metal, x, yy, z); }
  for (const a of [0, 2.1, 4.2]) K.box(0.35, 1.6, 0.18, M.matte, x + Math.cos(a) * 0.45, y + h * 0.82, z + Math.sin(a) * 0.45, { ry: -a, color: C.white });
  K.add(G.ball(), M.glow, x, y + h + 0.3, z, { sx: 0.35, sy: 0.35, sz: 0.35, color: C.led, cast: false });
}
/* parked building-maintenance unit: base on rails, mast and boom */
function bmu(K, x, y, z, ry) {
  K.push(x, y, z, ry);
  mb(K, 3.4, 1.4, 2.6, C.off, 0, 0.9, 0); tb(K, 3.6, 0.2, 2.8, C.grey, 0, 0.1, 0); mb(K, 0.8, 4.2, 0.8, C.off, 0, 3.6, 0);
  mb(K, 0.7, 0.7, 13, C.off, 0, 5.9, 3.5); tb(K, 2, 1.3, 1.6, C.grey, 0, 5.6, -3.6); tb(K, 0.5, 1.2, 0.5, C.grey, 0, 5, 9.6);
  K.pop();
}

/* ---------- a block of floors: recessed glass, bold slab edges, metal fins, sill rails ---------- */
function floorsBlock(K, F, R, { x = 0, z = 0, w, d, floors, fh = 4, y0 = 0, cut = null }) {
  const inset = 0.6, out = 0.45, H = floors * fh, cw = w - 2 * inset, cd = d - 2 * inset;
  const nx = Math.max(2, Math.round(cw / 2.6)), nz = Math.max(2, Math.round(cd / 2.6)), bx = cw / nx, bz = cd / nz;
  const SW = w + 2 * out, SD = d + 2 * out, sh = fh * 0.2, ring = inset + out + 0.02, yT = y0 + H, vr = floors / 8;
  const uo = () => Math.floor(R() * 12) / 12, vo = () => Math.floor(R() * 8) / 8;
  let u = uo(), v = vo();
  if (cut) {                                          // front face split around the lift spine
    F.wall(x - cw / 2, z + cd / 2, x + cut[0], z + cd / 2, y0, yT, u, v, u + (cut[0] + cw / 2) / bx / 12, v + vr);
    if (cut[1] < cw / 2) F.wall(x + cut[1], z + cd / 2, x + cw / 2, z + cd / 2, y0, yT, u + (cut[1] + cw / 2) / bx / 12, v, u + nx / 12, v + vr);
  } else F.wall(x - cw / 2, z + cd / 2, x + cw / 2, z + cd / 2, y0, yT, u, v, u + nx / 12, v + vr);
  u = uo(); v = vo(); F.wall(x + cw / 2, z + cd / 2, x + cw / 2, z - cd / 2, y0, yT, u, v, u + nz / 12, v + vr);
  u = uo(); v = vo(); F.wall(x + cw / 2, z - cd / 2, x - cw / 2, z - cd / 2, y0, yT, u, v, u + nx / 12, v + vr);
  u = uo(); v = vo(); F.wall(x - cw / 2, z - cd / 2, x - cw / 2, z + cd / 2, y0, yT, u, v, u + nz / 12, v + vr);
  K.box(cw - 0.5, H - 0.2, cd - 0.5, M.ghost, x, y0 + H / 2, z, { receive: false });   // the block's shadow; the floors inside stay open

  const front = cut ? [[-SW / 2, cut[0]], [cut[1], SW / 2]] : [[-SW / 2, SW / 2]];
  const frontIn = cut ? [[-cw / 2, cut[0]], [cut[1], cw / 2]] : [[-cw / 2, cw / 2]];
  for (let f = 1; f <= floors; f++) {                 // slab edges as rings + a thin shadow gap under each
    const y = y0 + f * fh - sh / 2, yg = y0 + f * fh - sh - 0.035;
    for (const [a, b] of front) {
      mb(K, b - a, sh, ring, C.white, x + (a + b) / 2, y, z + SD / 2 - ring / 2);
      tb(K, b - a - 0.3, 0.07, 0.3, C.frame, x + (a + b) / 2, yg, z + SD / 2 - 0.3, { cast: false });
    }
    mb(K, SW, sh, ring, C.white, x, y, z - SD / 2 + ring / 2);
    tb(K, SW - 0.3, 0.07, 0.3, C.frame, x, yg, z - SD / 2 + 0.3, { cast: false });
    for (const s of [-1, 1]) {
      mb(K, ring, sh, SD - 2 * ring, C.white, x + s * (SW / 2 - ring / 2), y, z);
      tb(K, 0.3, 0.07, SD - 0.9, C.frame, x + s * (SW / 2 - 0.3), yg, z, { cast: false });
    }
  }
  mb(K, SW, 0.5, SD, C.white, x, y0 + 0.25, z);
  const finD = 0.42, fy = y0 + H / 2;                  // vertical fins at every bay line
  for (let k = 1; k < nx; k++) {
    const fx = -cw / 2 + k * bx;
    if (!(cut && fx > cut[0] - 0.1 && fx < cut[1] + 0.1)) tb(K, 0.16, H, finD, C.fin, x + fx, fy, z + cd / 2 + finD / 2);
    tb(K, 0.16, H, finD, C.fin, x + fx, fy, z - cd / 2 - finD / 2);
  }
  for (let k = 1; k < nz; k++) for (const s of [-1, 1]) tb(K, finD, H, 0.16, C.fin, x + s * (cw / 2 + finD / 2), fy, z - cd / 2 + k * bz);
  for (let f = 0; f < floors; f++) {                  // slim sill rail per floor in front of the glass
    const yy = y0 + f * fh + 1.05;
    for (const [a, b] of frontIn) tb(K, b - a, 0.1, 0.12, C.fin, x + (a + b) / 2, yy, z + cd / 2 + 0.07, { cast: false });
    tb(K, cw, 0.1, 0.12, C.fin, x, yy, z - cd / 2 - 0.07, { cast: false });
    for (const s of [-1, 1]) tb(K, 0.12, 0.1, cd, C.fin, x + s * (cw / 2 + 0.07), yy, z, { cast: false });
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mb(K, 1.92, H, 1.92, C.white, x + sx * (cw / 2 + 0.66), fy, z + sz * (cd / 2 + 0.66));
}

/* ---------- campus ---------- */
function campus(K, F, D, group, R, keepClear) {
  // forest dots on the hills
  const leaf0 = geo('leaf0', () => new THREE.IcosahedronGeometry(1, 0));
  for (let n = 0, tries = 0; n < 4200 && tries < 30000; tries++) {
    const a = R() * Math.PI * 2, r = 480 + Math.pow(R(), 0.8) * 1600, x = Math.cos(a) * r, z = Math.sin(a) * r, y = terrainHeight(x, z);
    if (y < 5 || fbm(x * 0.004 + 50, z * 0.004, 3) < 0.47) continue;
    const s = (0.45 + R() * 0.55) * 3.6;
    K.add(leaf0, M.leaf, x, y + s * 0.9, z, { sx: s, sy: s * (1.1 + R() * 0.5), sz: s, color: TEAL[Math.floor(R() * TEAL.length)], cast: false, receive: false });
    n++;
  }
  // roads
  D.flat(-350, 63, 350, 77, 0.03, 0, 0, 700 / 64, 1); D.flat(-350, -126, 350, -114, 0.03, 0, 0, 700 / 64, 1);
  D.flat(89, -280, 101, 280, 0.045, 0, 0, 560 / 64, 1, true); D.flat(-156, -280, -144, 280, 0.045, 0, 0, 560 / 64, 1, true);
  // plaza, curbs, forecourt paving
  K.plane(232, 120, ground(1, { color: 0xf8f9fa }), -28, 0.02, -15, { rx: -Math.PI / 2, cast: false });
  for (const [w, d, x, z] of [[232, 0.6, -28, 45.3], [232, 0.6, -28, -75.3], [0.6, 120, 88.3, -15], [0.6, 120, -144.3, -15]]) mb(K, w, 0.25, d, 0xe1e4e8, x, 0.12, z);
  for (let i = 0; i < 6; i++) K.plane(26, 1.2, ground(3, { color: 0xdfe3e8 }), -3, 0.035, 24 + i * 4.2, { rx: -Math.PI / 2, cast: false });
  for (const [x, z] of [[-17, 26], [11, 26], [-17, 40], [11, 40]]) { mb(K, 4.2, 0.9, 4.2, C.pot, x, 0.45, z); K.box(0.3, 2.4, 0.3, M.soft, x, 2, z, { color: C.trunk }); shrub(K, x, 4.3, z, 2.2, C.leaf, 1.25); }
  for (const x of [-11, 5]) mb(K, 3.6, 0.5, 0.9, C.white, x, 0.45, 33);
  // parking with cars, cars on the avenue
  const clip = getClip(), lotIn = !clip || (52 > clip.x0 && 52 < clip.x1 && 22 > clip.z0 && 22 < clip.z1);   // a model plinth may leave the car park out
  if (lotIn) {
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(64, 32), ground(4, { map: parkingTex() }));
    lot.rotation.x = -Math.PI / 2; lot.position.set(52, 0.04, 22); lot.receiveShadow = true; group.add(lot);
  }
  for (let i = 0; i < 16; i++) for (const row of [0, 1]) { if (R() < 0.3 || !lotIn) continue; car(K, R, 24 + i * 4, 22 + (row ? 9 : -9), row ? Math.PI : 0); }
  for (let i = 0; i < 14; i++) { const far = R() < 0.5; car(K, R, -300 + R() * 600, 70 + (far ? -3.4 : 3.4), far ? Math.PI / 2 : -Math.PI / 2); }
  // lawns
  const lawns = [[-110, 22, 50, 40], [-110, -50, 50, 40], [55, -45, 50, 50], [-30, 58, 230, 10]];
  for (const [x, z, w, d] of lawns) K.box(w, 0.25, d, M.soft, x, 0.12, z, { color: C.lawn });
  // low buildings
  const builds = [[-215, -30, 46, 30, 9], [-210, 40, 34, 24, 12], [150, -70, 40, 46, 10], [160, 30, 30, 30, 14], [-60, -175, 60, 26, 8], [40, -180, 44, 30, 16], [-230, -150, 50, 36, 7], [210, -170, 36, 28, 11]];
  const blocked = [[-150, 92, -80, 50], ...builds.map(([x, z, w, d]) => [x - w / 2 - 5, x + w / 2 + 5, z - d / 2 - 5, z + d / 2 + 5]), ...keepClear];
  builds.forEach(([x, z, w, d, h], i) => {
    if (i % 2 === 0) {
      mb(K, w, h, d, C.white, x, h / 2, z);
      for (let k = 0; k < 4; k++) mb(K, w + 0.3, 0.25, 0.4, C.off, x, h * (0.25 + k * 0.2), z + d / 2, { cast: false });
      mb(K, w * 0.18, h * 0.55, 0.3, C.blue, x - w * 0.3, h * 0.275, z + d / 2 + 0.1, { cast: false });
    } else {
      const floors = Math.max(2, Math.round(h / 4));
      floorsBlock(K, F, R, { x, z, w, d, floors, fh: h / floors });
      mb(K, w + 1, 0.45, d + 1, C.blue, x, h + 0.5, z);
    }
    K.box(w + 0.6, 0.5, d + 0.6, M.soft, x, h + 0.25, z, { color: 0xdfe3e7 });
    for (let k = 0; k < 3; k++) acUnit(K, R, x - w * 0.3 + k * w * 0.25, h + 0.5, z - d * 0.2);
  });
  // trees: along the roads, on the lawns, loose groves beyond the streets
  const T = (x, z, s) => { if (!blocked.some((e) => x > e[0] && x < e[1] && z > e[2] && z < e[3])) tree(K, R, x, z, s); };
  for (let x = -330; x <= 330; x += 11) { T(x, 79.5); T(x + 5, 60.5); T(x + 3, -129); T(x, -111); }
  for (let z = -260; z <= 260; z += 11) { T(104, z); T(86, z + 5); T(-159, z); T(-141, z + 4); }
  for (const [x, z, w, d] of lawns.slice(0, 3)) for (let i = 0; i < 14; i++) T(x + (R() - 0.5) * w * 0.85, z + (R() - 0.5) * d * 0.85, 0.9 + R() * 0.4);
  for (let i = 0; i < 420; i++) {
    const a = R() * Math.PI * 2, r = 170 + R() * 160, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (fbm(x * 0.012, z * 0.012, 3) >= 0.48) T(x, z, 1 + R() * 0.5);
  }
  // street lamps along the avenue
  for (let x = -320; x <= 320; x += 32) for (const z of [62, 78]) { const s = z < 70 ? 1 : -1; tb(K, 0.22, 8, 0.22, C.grey, x, 4, z); tb(K, 0.2, 0.2, 2.2, C.grey, x, 7.9, z + s, { cast: false }); tb(K, 0.5, 0.18, 1, C.grey, x, 7.8, z + s * 2, { cast: false }); }
}

/* ---------- the headquarters ---------- */
function tower(K, KL, F, group, T, R, solid = false) {
  const { TW, TD, topY, fascia: fb } = HQ, S = HQ.spine, L = HQ.lift;
  floorsBlock(K, F, R, { w: TW, d: TD, floors: 20, y0: 8, cut: [S.x0, S.x1] });

  // ---- recessed glass lobby behind a colonnade ----
  mb(K, TW + 0.9, 8 - fb, TD + 0.9, C.white, 0, (8 + fb) / 2, 0);
  tb(K, TW + 0.95, 0.12, TD + 0.95, C.frame, 0, fb + 0.06, 0, { cast: false });
  const sof = soffitTex(); sof.map.repeat.set(TW / 6, TD / 6); sof.emi.repeat.set(TW / 6, TD / 6);
  const soffit = new THREE.Mesh(new THREE.PlaneGeometry(TW + 0.8, TD + 0.8), std({ map: sof.map, emissiveMap: sof.emi, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.8 }));
  soffit.rotation.x = Math.PI / 2; soffit.position.y = fb - 0.02; group.add(soffit);

  const lx0 = -16.4, lx1 = 14, lz0 = -13.4, lz1 = HQ.entry.z, ax0 = 9.9, az = S.z0;   // the lift alcove reaches out to the spine
  const LW = lx1 - lx0, LD = lz1 - lz0, lcx = (lx0 + lx1) / 2, lcz = (lz0 + lz1) / 2;
  const tile = (q, m, x0, z0, x1, z1, y, s) => q[m](x0, z0, x1, z1, y, x0 / s, -z1 / s, x1 / s, -z0 / s);
  const st = stoneTex(), fl = quadBatch();
  tile(fl, 'flat', lx0, lz0, lx1, lz1, 0.07, 6); tile(fl, 'flat', ax0, lz1, lx1, az, 0.07, 6);
  group.add(new THREE.Mesh(fl.build(), std({ map: st, roughness: 0.18, metalness: 0.05, emissive: 0x6a6358, emissiveMap: st, emissiveIntensity: 0.35 })));
  const ce = ceilingTex(), cl = quadBatch();
  tile(cl, 'ceil', lx0, lz0, lx1, lz1, fb - 0.25, 8); tile(cl, 'ceil', ax0, lz1, lx1, az, fb - 0.25, 8);
  group.add(new THREE.Mesh(cl.build(), std({ map: ce.map, emissiveMap: ce.emi, emissive: 0xffffff, emissiveIntensity: 1.3, roughness: 0.8 })));
  const wood = woodTex(), wq = quadBatch(); wq.wall(lx0 + 0.02, lz1, lx0 + 0.02, lz0, 0, fb, 0, 0, LD / 6, 1);
  group.add(new THREE.Mesh(wq.build(), std({ map: wood, emissive: 0x8a5a30, emissiveMap: wood, emissiveIntensity: 0.55, roughness: 0.6 })));
  // brand wall with the logo, reception desk
  const wlx = 5.2, ws = 0.95;
  KL.plane(LW, fb, M.lit, lcx, fb / 2, lz0 + 0.02, { color: 0x2d63fc });
  KL.add(T.logoLight, M.logoLit, wlx - T.logoLight.userData.width * ws / 2, 2.6, lz0 + 0.06, { sx: ws, sy: ws, sz: ws });
  mb(KL, 9, 1.1, 1.5, C.white, wlx, 0.62, lz0 + 5.5); mb(KL, 9.2, 0.07, 1.7, C.navy, wlx, 1.2, lz0 + 5.5); lb(KL, 8.6, 0.08, 0.05, C.led, wlx, 0.3, lz0 + 6.27);
  for (const [x, z] of [[lcx - 13, lz0 + 2.5], [13, lz0 + 2.5], [-15, lz1 - 2], [6.2, lz1 - 1.4]]) { mb(KL, 1.4, 0.9, 1.4, C.off, x, 0.52, z); shrub(KL, x, 2.3, z, 1, 0x3f9a74, 1.5); }
  for (let i = 0; i < 3; i++) K.box(0.9, 0.45, 2.6, M.matte, -14, 0.3, -7 + i * 4.6, { color: C.cyan, cast: false, receive: false });
  [[wlx - 1.5, lz0 + 4.3, 0], [wlx + 2, lz0 + 4.3, 0], [wlx - 2.4, lz0 + 7.6, Math.PI], [wlx + 0.6, lz0 + 7.9, Math.PI * 0.9], [-12.6, -5.2, Math.PI / 2], [9.5, -1, -2.2], [10.6, 0.2, 1.1]]
    .forEach(([x, z, ry], i) => addPerson(KL, x, 0.07, z, 50 + i, { ry, walk: false }));

  // glass skin with mullions; the entrance doors slide (see stage.js)
  const E = HQ.entry, d0 = E.x - 1.6, d1 = E.x + 1.6;
  const pane = (w, h, x, y, z, ry) => KL.plane(w, h, M.glass, x, y, z, { ry });
  pane(d0 - lx0, fb, (lx0 + d0) / 2, fb / 2, lz1, 0); pane(ax0 - d1, fb, (d1 + ax0) / 2, fb / 2, lz1, 0); pane(3.2, fb - 3.05, E.x, (fb + 3.05) / 2, lz1, 0);
  pane(az - lz1, fb, ax0, fb / 2, (lz1 + az) / 2, -Math.PI / 2); pane(az - lz0, fb, lx1, fb / 2, (lz0 + az) / 2, Math.PI / 2);
  const fr = (w, h, d, x, y, z) => tb(KL, w, h, d, C.frame, x, y, z);
  for (let k = 0; k <= 10; k++) { const x = lx0 + k * (ax0 - lx0) / 10; if (x > d0 - 0.3 && x < d1 + 0.3) continue; fr(0.14, fb, 0.22, x, fb / 2, lz1 + 0.06); }
  for (const x of [d0, d1]) fr(0.16, fb, 0.24, x, fb / 2, lz1 + 0.06);
  for (let k = 0; k <= 10; k++) fr(0.22, fb, 0.14, lx1 + 0.06, fb / 2, lz0 + k * (az - lz0) / 10);
  for (const y of [0.15, 3.4, fb - 0.1]) {
    fr(d0 - lx0, 0.14, 0.22, (lx0 + d0) / 2, y, lz1 + 0.06); fr(ax0 - d1, 0.14, 0.22, (d1 + ax0) / 2, y, lz1 + 0.06);
    fr(0.22, 0.14, az - lz0, lx1 + 0.06, y, (lz0 + az) / 2); fr(0.22, 0.14, az - lz1, ax0 - 0.06, y, (lz1 + az) / 2);
  }
  fr(3.2, 0.16, 0.24, E.x, 3.05, lz1 + 0.06); fr(3.2, 0.14, 0.22, E.x, fb - 0.1, lz1 + 0.06);
  const doorGlass = std({ color: 0xcfe0ee, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.22, envMapIntensity: 1.5, depthWrite: false, side: THREE.DoubleSide });
  const doorFrame = std({ color: C.frame, roughness: 0.34, metalness: 0.55 });
  const leaves = [-1, 1].map((s) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.56, 2.96), doorGlass));
    for (const [w, h, x, y] of [[1.6, 0.07, 0, 1.48], [1.6, 0.1, 0, -1.45], [0.07, 3, -0.78, 0], [0.07, 3, 0.78, 0]]) { const b = new THREE.Mesh(G.box(), doorFrame); b.scale.set(w, h, 0.06); b.position.set(x, y, 0); g.add(b); }
    g.position.set(E.x + s * 0.8, 1.57, lz1); g.userData = { x: E.x, s };
    group.add(g); return g;
  });
  for (const [x, z] of [[-16.4, 13.4], [-9.9, 13.4], [3.9, 13.4], [16.4, 13.4], [16.4, 6.7], [16.4, 0], [16.4, -6.7], [16.4, -13.4]]) K.cyl(0.55, fb, M.matte, x, fb / 2, z, { color: C.white });

  // ---- crown: logo band, light line, roof deck ----
  mb(K, TW + 1.4, 6.5, TD + 1.4, C.white, 0, topY + 3.25, 0); mb(K, TW + 1.5, 0.5, TD + 1.5, C.blue, 0, topY + 0.25, 0);
  K.box(TW + 1.56, 0.1, TD + 1.56, M.glow, 0, topY + 0.56, 0, { color: C.led, cast: false });
  const cs = 1.75, lw = T.logoDark.userData.width * cs, ly = topY + 0.7 + 2.9 - T.logoDark.userData.height * cs / 2;
  K.add(T.logoDark, M.logo, -TW / 2 + 1.4, ly, TD / 2 + 0.72, { sx: cs, sy: cs, sz: cs });
  K.add(T.logoDark, M.logo, -TW / 2 - 0.72, ly, -lw / 2 + 1.5, { ry: -Math.PI / 2, sx: cs, sy: cs, sz: cs });
  mb(K, TW + 1.9, 0.6, TD + 1.9, C.off, 0, topY + 6.8, 0);

  // ---- brand spine = lift shaft: outward faces only, so the lift car inside has a clear view out ----
  const sw = S.x1 - S.x0, sd = S.z1 - S.z0, scx = (S.x0 + S.x1) / 2, scz = (S.z0 + S.z1) / 2, sh = S.top;
  const wall = (w, h, x, y, z, ry) => K.plane(w, h, M.matte, x, y, z, { ry, color: C.blue });
  wall(sw, sh, scx, sh / 2, S.z1, 0); wall(sd, sh, S.x0, sh / 2, scz, -Math.PI / 2); wall(sd, sh, S.x1, sh / 2, scz, Math.PI / 2);
  const dl = L.x - L.w / 2, dr = L.x + L.w / 2;
  wall(dl - S.x0, sh, (S.x0 + dl) / 2, sh / 2, S.z0, Math.PI); wall(S.x1 - dr, sh, (dr + S.x1) / 2, sh / 2, S.z0, Math.PI);
  let from = HQ.levels[0] + L.h;
  for (const lv of [...HQ.levels.slice(1), sh]) { wall(L.w, lv - from, L.x, (from + lv) / 2, S.z0, Math.PI); from = lv + L.h; }
  mb(K, sw + 0.4, 0.6, sd + 0.4, C.blueDeep, scx, sh + 0.3, scz);
  for (let y = 12; y < sh - 12; y += 8) { mb(K, sw + 0.1, 0.22, 0.06, C.blueDeep, scx, y, S.z1 + 0.03, { cast: false }); for (const [x, s] of [[S.x0, -1], [S.x1, 1]]) mb(K, 0.06, 0.22, sd, C.blueDeep, x + s * 0.03, y, scz, { cast: false }); }
  const slotH = sh - 22;
  K.plane(1.5, slotH, M.gloss, S.x0 + 1.6, 9 + slotH / 2, S.z1 + 0.04, { color: 0x0c2462, cast: false });
  K.box(0.16, slotH, 0.05, M.glow, S.x0 + 2.6, 9 + slotH / 2, S.z1 + 0.07, { color: C.led, cast: false });
  K.add(T.symbol, M.matte, scx - 1.75, sh - 9, S.z1 + 0.02, { sx: 6.4, sy: 6.4, sz: 6.4, color: 0xffffff });
  K.add(T.symbol, M.matte, S.x1 + 0.02, sh - 9, scz + 2.25, { ry: Math.PI / 2, sx: 6.4, sy: 6.4, sz: 6.4, color: 0xffffff });

  // ---- roof plant behind a louvre screen (left part; the right part is the terrace, see floors.js) ----
  const dy = HQ.deckY, ex = -17.1, ez = 14.1, px = -4;
  for (let s = 0; s < 5; s++) { const y = dy + 0.35 + s * 0.45; for (const z of [ez, -ez]) tb(K, px - ex, 0.14, 0.32, C.frame, (ex + px) / 2, y, z); for (const x of [ex, px]) tb(K, 0.32, 0.14, 2 * ez, C.frame, x, y, 0); }
  for (let x = ex; x <= px + 0.01; x += (px - ex) / 5) for (const z of [ez, -ez]) tb(K, 0.2, 2.4, 0.36, C.grey, x, dy + 1.2, z);
  for (let z = -ez; z <= ez + 0.01; z += ez / 4) for (const x of [ex, px]) tb(K, 0.36, 2.4, 0.2, C.grey, x, dy + 1.2, z);
  for (const z of [ez, -ez]) mb(K, px - ex + 0.4, 0.18, 0.5, C.white, (ex + px) / 2, dy + 2.4, z); for (const x of [ex, px]) mb(K, 0.5, 0.18, 2 * ez + 0.4, C.white, x, dy + 2.4, 0);
  mb(K, 10, 5, 11, C.off, -10.5, dy + 2.5, -6); mb(K, 10.4, 0.4, 11.4, C.white, -10.5, dy + 5.2, -6);
  tb(K, 2.2, 3.2, 0.15, C.dark, -12.5, dy + 1.6, -0.45, { cast: false }); for (let k = 0; k < 7; k++) tb(K, 4.2, 0.08, 0.1, C.grey, -8.6, dy + 1.7 + k * 0.3, -0.42, { cast: false });
  dish(K, -13, dy + 5.4, -8.5, 2.1, 0.8, 2.4); dish(K, -8.5, dy + 5.4, -9.5, 1.6, 0.6, 5.2); mast(K, -10, dy + 5.4, -4, 18);
  for (let i = 0; i < 6; i++) acUnit(K, R, -14.6 + (i % 3) * 3.6, dy, 3.4 + Math.floor(i / 3) * 3.4);
  for (const z of [10.4, 12.6]) tb(K, 11, 0.16, 0.22, C.grey, -10.5, dy + 0.08, z, { cast: false });
  bmu(K, -13.5, dy, 11.5, Math.PI / 2);

  // ---- entrance: platform, blue portal with the name, canopy ----
  const ex0 = E.x;
  mb(K, 22, 0.12, 9, C.off, ex0, 0.06, TD / 2 + 4.5); tb(K, 22.4, 0.08, 0.3, C.grey, ex0, 0.04, TD / 2 + 9.1);
  for (const s of [-1, 1]) mb(K, 1.4, 7.5, 1.6, C.blue, ex0 + s * 5.6, 3.75, TD / 2 + 1.2);
  mb(K, 12.6, 1.5, 1.6, C.blue, ex0, 8.25, TD / 2 + 1.2);
  const ps = 0.42; K.add(T.logoLight, M.logo, ex0 - T.logoLight.userData.width * ps / 2, 8.25 - T.logoLight.userData.height * ps / 2, TD / 2 + 2.01, { sx: ps, sy: ps, sz: ps });
  mb(K, 16, 0.45, 6, C.white, ex0, 6.2, TD / 2 + 3.6); lb(K, 14, 0.06, 0.25, C.led, ex0, 5.95, TD / 2 + 6.2);
  for (let k = 0; k < 4; k++) K.add(G.disc(), M.glow, ex0 - 5.4 + k * 3.6, 5.96, TD / 2 + 3.6, { rx: Math.PI / 2, sx: 0.22, sy: 0.22, color: 0xfff4dc, cast: false, receive: false });

  // ---- solid (the model seen from outside, from every side): fill what the tour left hollow for its interiors ----
  if (solid) {
    const box = (x0, x1, y0, y1, z0, z1, mat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.receiveShadow = true; group.add(m);
    };
    // the body behind the glass, closed at the roof
    box(-TW / 2 + 1, TW / 2 - 1, fb, HQ.deckY - 0.03, -TD / 2 + 1, TD / 2 - 1, std({ color: 0x9aa7b4, roughness: 0.6 }));   // behind the glass (0.6 in)
    // the ground floor reads as a tinted glass base on all four sides, framed like the front
    const lg = std({ color: 0x86a2bd, roughness: 0.08, metalness: 0.6, envMapIntensity: 1.3 });
    box(lx0 + 0.02, lx1 - 0.1, 0.07, fb, lz0 + 0.02, lz1 - 0.1, lg); box(ax0 + 0.1, lx1 - 0.1, 0.07, fb, lz1 - 0.12, az - 0.02, lg);
    for (let k = 0; k <= 10; k++) fr(0.14, fb, 0.22, lx0 + k * (lx1 - lx0) / 10, fb / 2, lz0 - 0.06);
    for (let k = 0; k <= 8; k++) fr(0.22, fb, 0.14, lx0 - 0.06, fb / 2, lz0 + k * (lz1 - lz0) / 8);
    for (const y of [3.05, fb - 0.1]) { fr(lx1 - lx0, 0.14, 0.22, lcx, y, lz0 - 0.06); fr(0.22, 0.14, lz1 - lz0, lx0 - 0.06, y, lcz); }
    // the lift spine is a closed blue volume (seen from behind above the roof, too)
    box(S.x0 + 0.04, S.x1 - 0.04, 0, sh - 0.04, S.z0 + 0.04, S.z1 - 0.04, std({ color: C.blue, roughness: 0.85 }));
  }
  return leaves;
}

function wing(K, KL, F, group, R) {
  const { x: wx, z: wz, w: WW, d: WD, top } = HQ.wing;
  floorsBlock(K, F, R, { x: wx, z: wz, w: WW, d: WD, floors: 5 });
  for (const s of [-1, 1]) { mb(K, WW + 1, 1.4, 0.7, C.white, wx, top + 0.7, wz + s * (WD / 2 + 0.15)); mb(K, WW + 1.1, 0.4, 0.8, C.blue, wx, top + 1.55, wz + s * (WD / 2 + 0.15)); }
  mb(K, 0.7, 1.4, WD + 1, C.white, wx - WW / 2 - 0.15, top + 0.7, wz); mb(K, 0.8, 0.4, WD + 1.1, C.blue, wx - WW / 2 - 0.15, top + 1.55, wz);
  mb(K, 2.2, top + 1.9, 2.2, C.blue, wx - WW / 2 + 0.6, (top + 1.9) / 2, wz + WD / 2 + 0.2);
  mb(K, WW - 1, 0.1, WD - 1, C.roof, wx, top - 0.05, wz);                                                  // roof slab (the block below is hollow)
  // roof terrace (front half)
  const dk = deckTex().clone(); dk.needsUpdate = true; dk.repeat.set(4, 3);
  K.plane(26, 15, geo('wing-deck', () => std({ map: dk, roughness: 0.75 })), wx - 0.5, top + 0.05, wz + 11, { rx: -Math.PI / 2, cast: false });
  for (const [x, z] of [[-12, 18.2], [-6, 18.2], [0, 18.2], [6, 18.2], [11, 18.2], [-12.5, 6], [-12.5, 12]]) { mb(K, 3.4, 0.8, 1.3, C.pot, wx + x, top + 0.4, wz + z); K.add(G.leaf(), M.leaf, wx + x, top + 1.6, wz + z, { sx: 1.3, sy: 1.05, sz: 0.85, color: C.leaf }); }
  [[-7, 13], [0, 10.5], [7, 13.5]].forEach(([x, z], i) => {
    tb(K, 0.1, 2.7, 0.1, C.metal, wx + x, top + 1.35, wz + z);
    K.add(G.cone(), M.leaf, wx + x, top + 2.9, wz + z, { sx: 2.1, sy: 0.75, sz: 2.1, color: i === 1 ? 0xffffff : C.cyan });
    K.cyl(0.6, 0.08, M.matte, wx + x, top + 0.8, wz + z, { color: C.white }); K.cyl(0.07, 0.75, M.metal, wx + x, top + 0.4, wz + z, { color: C.grey, low: true });
    for (const a of [0, 2.1, 4.2]) mb(K, 0.55, 0.45, 0.55, C.off, wx + x + Math.cos(a) * 1.25, top + 0.27, wz + z + Math.sin(a) * 1.25);
  });
  mb(K, 6, 0.5, 1.6, C.white, wx + 2, top + 0.3, wz + 16.2); mb(K, 1.6, 0.5, 4, C.white, wx + 5.8, top + 0.3, wz + 14.6);
  [[-8.3, 12.1], [-5.6, 13.8], [1.3, 9.6], [-1.2, 11.3], [8.2, 12.4], [3, 15], [-10, 8.2]].forEach(([x, z], i) => addPerson(K, wx + x, top + 0.05, wz + z, 70 + i, { walk: i > 4 }));
  K.box(6, 3.2, 4.4, M.gloss, wx + 10, top + 1.6, wz + 4.5, { color: 0x7f97ad }); mb(K, 6.6, 0.3, 5, C.white, wx + 10, top + 3.35, wz + 4.5);
  for (const x of [-3, -1, 1, 3]) tb(K, 0.1, 3.2, 0.1, C.frame, wx + 10 + x, top + 1.6, wz + 6.72, { cast: false });
  // solar array + plant on the back half
  const pv = geo('pv-mat', () => std({ map: pvTex(), roughness: 0.25, metalness: 0.5 }));
  for (let r = 0; r < 5; r++) { K.box(21, 0.1, 2.3, pv, wx - 3, top + 1, wz - 16 + r * 3.3, { rx: -0.42 }); tb(K, 21, 0.08, 0.08, C.grey, wx - 3, top + 0.45, wz - 15.1 + r * 3.3, { cast: false }); }
  for (let i = 0; i < 4; i++) acUnit(K, R, wx + 11.5, top, wz - 15 + i * 4.6);
  dish(K, wx + 11.5, top, wz + 0.5, 1.5, 0.7, 1.2);
}

function forecourt(K, group, T, R) {
  // monument sign by the avenue
  K.push(-24, 0, 53, 0.22);
  mb(K, 11.5, 0.6, 2.6, C.off, 0, 0.3, 0); mb(K, 10.2, 3.4, 1, C.blue, 0, 2.3, 0); lb(K, 10.2, 0.06, 0.06, C.led, 0, 0.62, 0.53);
  const s = 0.72; K.add(T.logoLight, M.logo, -T.logoLight.userData.width * s / 2, 2.3 - T.logoLight.userData.height * s / 2, 0.5, { sx: s, sy: s, sz: s });
  K.pop();
  // flags with the key symbol
  const fg = geo('flag', () => { const g = new THREE.PlaneGeometry(3.4, 2.1, 10, 1), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const u = (p.getX(k) + 1.7) / 3.4; p.setZ(k, Math.sin(u * 5.2) * 0.2 * u); } g.computeVertexNormals(); return g; });
  const fm = std({ map: flagTex(), side: THREE.DoubleSide, roughness: 0.7 });
  for (const x of [-9, -3, 3]) { tb(K, 0.18, 12, 0.18, C.metal, x, 6, 47); K.add(fg, fm, x + 1.78, 10.8, 47); }
  for (let k = 0; k < 9; k++) tb(K, 0.28, 0.9, 0.28, C.grey, -15 + k * 3, 0.45, 51);
  // people, kept off the camera's walk-in line
  const path = [[-10.5, 44], [-3, 18], [-3, 11]], spots = [];
  const nearPath = (x, z) => path.some(([ax, az], i) => { if (!i) return false; const [bx, bz] = path[i - 1], t = clamp(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)); return Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)) < 2.6; });
  for (let i = 0; i < 46 && spots.length < 30; i++) {
    const x = -34 + R() * 60, z = 16 + R() * 34;
    const inPlanter = (Math.abs(x + 17) < 3 || Math.abs(x - 11) < 3) && (Math.abs(z - 26) < 3 || Math.abs(z - 40) < 3);
    const inBench = Math.abs(z - 33) < 1.2 && (Math.abs(x + 11) < 2.4 || Math.abs(x - 5) < 2.4);
    const inBuilding = (x > 7.5 && x < 16.6 && z < 19.4) || (x < -15.4 && z < 27.6);
    if (nearPath(x, z) || inPlanter || inBench || inBuilding || spots.some(([a, b]) => Math.hypot(a - x, b - z) < 1.6)) continue;
    spots.push([x, z]); addPerson(K, x, 0.03, z, 100 + i);
  }
}

/* built in a few steps, yielding to the page in between so scrolling never stalls while the HQ is put together */
/* plot: { x0, x1, z0, z1 } turns the campus into an architectural model on a plinth: no terrain, everything trimmed
   to the rectangle, a white base with a navy band and the logo on its front edge. */
export async function buildSite({ brandGeo, windowSize = 2048, keepClear = [], plot = null, reach = 0, glass = false, solid = false }) {
  const group = new THREE.Group(), R = rng(9), step = () => new Promise((r) => setTimeout(r, 0));
  const K = makeKit(), KL = makeKit({ cast: false, receive: false }), F = quadBatch(), D = quadBatch();
  if (plot) { setClip(plot); plinth(group, brandGeo, plot); }
  else { if (reach) setClip({ r: reach }); terrain(group, reach); }   // reach: nothing beyond it is built (it would be lost in the mist)
  await step();
  campus(K, F, D, group, R, keepClear); await step();
  const leaves = tower(K, KL, F, group, brandGeo, rng(5), solid); await step();
  wing(K, KL, F, group, rng(100));
  forecourt(K, group, brandGeo, rng(3)); await step();
  K.build(group); KL.build(group); await step();
  const win = new THREE.Mesh(F.build(), glass ? glassMaterial(windowSize) : windowMaterial(windowSize)); win.receiveShadow = true; group.add(win);
  const rt = roadTex();
  const roads = new THREE.Mesh(D.build(), ground(2, { map: rt })); roads.receiveShadow = true; group.add(roads);
  setClip(null);
  return { group, leaves };
}

function plinth(group, brandGeo, { x0, x1, z0, z1 }) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, H = 7, lip = 1.2;
  const mat = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + lip * 2, 0.6, d + lip * 2), mat(0xf4f6f8));
  top.position.set(cx, -0.31, cz); top.receiveShadow = true; group.add(top);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w + lip * 2 - 0.4, H, d + lip * 2 - 0.4), mat(0xffffff, 0.7));
  body.position.set(cx, -0.6 - H / 2, cz); body.receiveShadow = true; group.add(body);
  const band = new THREE.Mesh(new THREE.BoxGeometry(w + lip * 2 - 0.2, 1.1, d + lip * 2 - 0.2), mat(C.navy, 0.5));
  band.position.set(cx, -0.6 - H + 0.55, cz); group.add(band);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(w + lip * 2 - 0.1, 0.18, d + lip * 2 - 0.1), new THREE.MeshBasicMaterial({ color: C.cyan, toneMapped: false }));
  glow.position.set(cx, -0.6 - H + 1.2, cz); group.add(glow);
  // logo on the front face of the plinth (the side facing the entrance, +z)
  if (brandGeo && brandGeo.logoDark) {
    const g = brandGeo.logoDark, s = 1.9, lw = g.userData.width * s, lh = g.userData.height * s;
    const logo = new THREE.Mesh(g, M.logo);
    logo.scale.setScalar(s); logo.position.set(cx - lw / 2, -0.6 - (H - 1.1) / 2 - lh / 2, z1 + lip - 0.18); group.add(logo);
  }
}
