import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };
export const C = { deep: 0x060F24, navy: 0x0A1B3D, ink: 0x122B67, b800: 0x183889, b700: 0x1F46B0, b600: 0x2655D6, blue: 0x2D63FC, b400: 0x628AFD, b300: 0x96B1FE, cyan: 0x1FC8F6, white: 0xffffff, mist: 0xDCE3EF, green: 0x12B76A };
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- materials ---------- */
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({
  color, flatShading: o.flat !== false, roughness: o.rough ?? .5, metalness: o.metal ?? .2,
  emissive: o.em ?? 0x000000, emissiveIntensity: o.ei ?? 1,
  transparent: o.op !== undefined && o.op < 1, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.dw ?? true,
});
export const glow = (color, op = .6, side = THREE.FrontSide) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side, fog: false });
export const hdr = (hex, k = 1.8) => new THREE.Color(hex).multiplyScalar(k); // >1 colour so bloom picks it up
export const emis = (hex, k = 2.2, o = {}) => new THREE.MeshBasicMaterial({ color: hdr(hex, k), transparent: !!o.op, opacity: o.op ?? 1, fog: false, ...o.extra });
export const lineMat = (color, op = .5) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });

export function fresnelMat({ rim = C.cyan, inner = C.navy, pow = 2.4, base = 0.05, op = 1, additive = false, side = THREE.FrontSide } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uRim: { value: new THREE.Color(rim) }, uIn: { value: new THREE.Color(inner) }, uPow: { value: pow }, uBase: { value: base }, uOp: { value: op } },
    transparent: true, depthWrite: false, side, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 uRim; uniform vec3 uIn; uniform float uPow; uniform float uBase; uniform float uOp; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.-abs(dot(normalize(vN),normalize(vV))), uPow); gl_FragColor = vec4(mix(uIn,uRim,f), uOp*mix(uBase,1.,f)); \n#include <colorspace_fragment>\n }',
  });
}

/* ---------- meshes ---------- */
export function add(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; }
export const box = (p, w, h, d, mat, x = 0, y = 0, z = 0, r = 0) => add(p, r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d), mat, x, y, z);
export const cyl = (p, rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 18) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
export const sph = (p, r, mat, x = 0, y = 0, z = 0, w = 16, h = 12) => add(p, new THREE.SphereGeometry(r, w, h), mat, x, y, z);
export const ico = (p, r, mat, x = 0, y = 0, z = 0, d = 0) => add(p, new THREE.IcosahedronGeometry(r, d), mat, x, y, z);
export const torus = (p, R, r, mat, x = 0, y = 0, z = 0, seg = 48) => add(p, new THREE.TorusGeometry(R, r, 8, seg), mat, x, y, z);
export function circleLine(parent, radius, color, op = .5, seg = 96, axis = 'y') {
  const pts = []; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, op));
  if (axis === 'x') l.rotation.z = Math.PI / 2; if (axis === 'z') l.rotation.x = Math.PI / 2; parent.add(l); return l;
}
export function tubeAlong(points, radius, mat, seg = 80, closed = false) {
  const c = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', .3);
  return { curve: c, mesh: new THREE.Mesh(new THREE.TubeGeometry(c, seg, radius, 6, closed), mat) };
}
export function polyline(parent, pts, color, op = .8) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, op)); parent.add(l); return l; }

/* ---------- canvas textures ---------- */
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const o = { cv, ctx, tex, redraw() { ctx.clearRect(0, 0, w, h); draw(ctx, w, h); tex.needsUpdate = true; } };
  o.redraw(); return o;
}
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
const FONT = '"IBM Plex Sans Arabic","Inter",system-ui,sans-serif';
export const FONTS = FONT;

export function labelSprite(text, { size = 56, color = '#ffffff', weight = 700, bg = null, border = null, padX = 28, padY = 14, height = 1, dir = 'rtl', glowColor = null } = {}) {
  const o = { sprite: null, set(t) { text = t; draw(); } };
  const cv = document.createElement('canvas'); const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
  const sp = new THREE.Sprite(mat); o.sprite = sp;
  function draw() {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const m = ctx.measureText(text); const w = Math.ceil(m.width + padX * 2), h = Math.ceil(size * 1.35 + padY * 2);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; tex.dispose(); } else ctx.clearRect(0, 0, w, h); ctx.font = `${weight} ${size}px ${FONT}`; ctx.direction = dir; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (bg) { rr(ctx, 2, 2, w - 4, h - 4, h / 2); ctx.fillStyle = bg; ctx.fill(); if (border) { ctx.strokeStyle = border; ctx.lineWidth = 3; ctx.stroke(); } }
    if (glowColor) { ctx.shadowColor = glowColor; ctx.shadowBlur = 16; }
    ctx.fillStyle = color; ctx.fillText(text, w / 2, h / 2 + size * .05);
    tex.needsUpdate = true; sp.scale.set(height * w / h, height, 1);
  }
  draw(); return o;
}

let _glowTex;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.45)'); g.addColorStop(.6, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); _glowTex = new THREE.CanvasTexture(cv); return _glowTex;
}
export function glowSprite(color, size, op = .8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.setScalar(size); return s;
}

/* ---------- soft round points ---------- */
export const pointUniforms = { uTime: { value: 0 }, uScale: { value: 400 } };
export function pointsMaterial({ blending = THREE.AdditiveBlending, back = false, twinkle = .5 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: pointUniforms.uTime, uScale: pointUniforms.uScale, uBack: { value: back ? 1 : 0 }, uTw: { value: twinkle } },
    transparent: true, depthWrite: false, blending,
    vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aPhase; varying vec3 vC; varying float vA; uniform float uTime; uniform float uScale; uniform float uBack; uniform float uTw;
      void main(){ vec4 wp = modelMatrix*vec4(position,1.); vec4 mv = viewMatrix*wp; gl_Position = projectionMatrix*mv;
        float tw = 1.-uTw*.5+uTw*.5*sin(uTime*1.6+aPhase*6.2831);
        float a = tw;
        if(uBack>.5){ vec3 n = normalize(mat3(modelMatrix)*position); vec3 cd = normalize(cameraPosition-wp.xyz); a *= mix(.12,1.,smoothstep(-.15,.25,dot(n,cd))); }
        vA = a; vC = aColor; gl_PointSize = clamp(aSize*uScale/max(.1,-mv.z), 1., 64.); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.08,d)*vA; if(a<.01) discard; gl_FragColor = vec4(vC, a); \n#include <colorspace_fragment>\n }`,
  });
}
export function makePoints(positions, colors, sizes, phases, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  const p = new THREE.Points(g, mat); p.frustumCulled = false; return p;
}
export function sparkles(n, { spread = [30, 14, 30], center = [0, 4, 0], color = C.cyan, color2 = C.blue, size = .12, twinkle = .8, seed = 1 } = {}) {
  let s = seed * 9301; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const pos = [], col = [], sz = [], ph = []; const c1 = new THREE.Color(color), c2 = new THREE.Color(color2), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    pos.push(center[0] + (rnd() - .5) * spread[0], center[1] + (rnd() - .5) * spread[1], center[2] + (rnd() - .5) * spread[2]);
    c.copy(c1).lerp(c2, rnd()).multiplyScalar(1.4); col.push(c.r, c.g, c.b); sz.push(size * (.5 + rnd())); ph.push(rnd());
  }
  return makePoints(pos, col, sz, ph, pointsMaterial({ twinkle }));
}

/* ---------- platforms / floors ---------- */
export function platform(parent, r, { y = 0, h = .5, seg = 6, color = C.ink, rim = C.cyan, grid = true } = {}) {
  const g = new THREE.Group(); g.position.y = y; parent.add(g);
  cyl(g, r, r * .96, h, std(color, { rough: .6, metal: .35 }), 0, -h / 2, 0, seg);
  const ring = add(g, new THREE.TorusGeometry(r * .985, .045, 6, seg), emis(rim, 2.2)); ring.rotation.x = Math.PI / 2; ring.rotation.z = 0; ring.position.y = .01;
  if (grid) { const gh = new THREE.GridHelper(r * 1.9, Math.round(r * 1.2), C.blue, C.blue); gh.position.y = .02; gh.material.transparent = true; gh.material.opacity = .22; gh.material.blending = THREE.AdditiveBlending; gh.material.depthWrite = false; g.add(gh); }
  return g;
}

export function gearGeometry(r = 1, teeth = 10, depth = .4, toothH = .22) {
  const s = new THREE.Shape(); const n = teeth * 4;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rad = (i % 4 === 1 || i % 4 === 2) ? r + toothH : r; const x = Math.cos(a) * rad, y = Math.sin(a) * rad; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const hole = new THREE.Path(); hole.absarc(0, 0, r * .38, 0, Math.PI * 2, true); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 1 }); g.translate(0, 0, -depth / 2); return g;
}

export function shieldShape(w = 1, h = 1.2) {
  const s = new THREE.Shape(); const x = w, y = h;
  s.moveTo(0, y); s.bezierCurveTo(x * .35, y * .92, x * .72, y * .86, x, y * .8); s.lineTo(x, y * .1); s.bezierCurveTo(x, -y * .45, x * .4, -y * .8, 0, -y); s.bezierCurveTo(-x * .4, -y * .8, -x, -y * .45, -x, y * .1); s.lineTo(-x, y * .8); s.bezierCurveTo(-x * .72, y * .86, -x * .35, y * .92, 0, y);
  return s;
}

/* a lit-looking screen: bezel + textured plane + neon edge */
export function screenMesh(parent, w, h, tex, { bezel = .12, depth = .14, r = .1, edge = C.cyan, edgeOp = .55 } = {}) {
  const g = new THREE.Group(); parent.add(g);
  box(g, w + bezel * 2, h + bezel * 2, depth, std(C.navy, { metal: .5, rough: .35, em: C.blue, ei: .12 }), 0, 0, 0, r);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: 0xe8eefa, toneMapped: false })); plane.position.z = depth / 2 + .004; g.add(plane);
  const eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(w + bezel * 2 + .04, h + bezel * 2 + .04, depth + .04));
  g.add(new THREE.LineSegments(eg, lineMat(edge, edgeOp)));
  g.userData.plane = plane; return g;
}
export function tileTex(w, h, rx, ry) { const t = canvasTex(256, 256, (x, W, H) => { x.strokeStyle = 'rgba(80,140,255,.9)'; x.lineWidth = 3; x.strokeRect(0, 0, W, H); x.strokeStyle = 'rgba(80,140,255,.28)'; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke(); });
  t.tex.wrapS = t.tex.wrapT = THREE.RepeatWrapping; t.tex.repeat.set(rx, ry); return t.tex; }
