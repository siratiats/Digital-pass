/* Scene 1 — من نحن: holographic globe of the Gulf with glowing nodes, a gateway ring, orbiting satellites. */
import { THREE, C, clamp, lerp, smooth, easeInOut, V, std, glow, emis, hdr, add, box, cyl, sph, ico, torus, circleLine, lineMat, fresnelMat, labelSprite, glowSprite, sparkles, makePoints, pointsMaterial, platform } from './util.js';

const R = 6;
const ll = (lat, lon, r = R) => { const a = THREE.MathUtils.degToRad(lat), o = THREE.MathUtils.degToRad(lon); return new THREE.Vector3(r * Math.cos(a) * Math.sin(o), r * Math.sin(a), r * Math.cos(a) * Math.cos(o)); };
const CITIES = [
  { k: 'j.c.riyadh', ar: 'الرياض', lat: 24.71, lon: 46.68, big: true, label: true, off: [0, .62] },
  { k: 'j.c.jeddah', ar: 'جدة', lat: 21.54, lon: 39.17, label: true, off: [-.15, -.5] },
  { k: 'j.c.dammam', ar: 'الدمام', lat: 26.43, lon: 50.1 },
  { k: 'j.c.dubai', ar: 'دبي', lat: 25.2, lon: 55.27, label: true, off: [.2, .55] },
  { k: 'j.c.doha', ar: 'الدوحة', lat: 25.29, lon: 51.53, label: true, off: [-.05, -.6] },
  { k: 'j.c.kuwait', ar: 'الكويت', lat: 29.38, lon: 47.99, label: true, off: [-.2, .5] },
  { k: 'j.c.muscat', ar: 'مسقط', lat: 23.59, lon: 58.41, label: true, off: [.15, -.5] },
  { k: 'j.c.manama', ar: 'المنامة', lat: 26.22, lon: 50.58 },
];

export default function build(ctx) {
  const g = new THREE.Group();
  const globe = new THREE.Group(); globe.position.y = 0.0; g.add(globe);
  const q = ctx.q;

  /* globe body + atmosphere */
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * .985, 64, 48), fresnelMat({ rim: C.blue, inner: 0x061a44, pow: 2.2, base: .9, op: 1 })));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.13, 48, 32), fresnelMat({ rim: C.cyan, inner: C.blue, pow: 3.2, base: 0, op: .95, additive: true, side: THREE.BackSide })); g.add(atmo);
  /* lat / lon graticule */
  for (let la = -60; la <= 60; la += 30) { const l = circleLine(globe, R * Math.cos(la * Math.PI / 180) * 1.003, C.blue, .28, 96); l.position.y = R * Math.sin(la * Math.PI / 180); }
  for (let i = 0; i < 12; i++) { const pg = new THREE.Group(); pg.rotation.y = i / 12 * Math.PI; globe.add(pg); circleLine(pg, R * 1.003, C.blue, .2, 96, 'z'); }

  /* dotted land from the land mask; GCC countries brighter and denser */
  { const m = ctx.mask, pos = [], col = [], sz = [], ph = []; const cl = new THREE.Color(0x4f86ff), cg = new THREE.Color(C.cyan), cw = new THREE.Color(0xd8f6ff), c = new THREE.Color();
    const at = (lat, lon, ch) => { const x = ((lon + 180) / 360 * m.w) | 0, y = ((90 - lat) / 180 * m.h) | 0; return m.data[(Math.min(m.h - 1, y) * m.w + Math.min(m.w - 1, x)) * 4 + ch]; };
    const step = 1.55 / Math.sqrt(q);
    for (let lat = -58; lat <= 84; lat += step) { const ls = step / Math.max(.25, Math.cos(lat * Math.PI / 180)); for (let lon = -180; lon < 180; lon += ls) {
      if (at(lat, lon, 0) > 128 && !(at(lat, lon, 1) > 128)) { const p = ll(lat, lon, R * 1.002); pos.push(p.x, p.y, p.z); c.copy(cl).multiplyScalar(.75 + Math.random() * .5); col.push(c.r, c.g, c.b); sz.push(.11); ph.push(Math.random()); } } }
    const fs = .5 / Math.sqrt(q);
    for (let lat = 12; lat <= 33; lat += fs) { const ls = fs / Math.cos(lat * Math.PI / 180); for (let lon = 33; lon <= 62; lon += ls) {
      if (at(lat, lon, 1) > 128) { const p = ll(lat, lon, R * 1.004); pos.push(p.x, p.y, p.z); c.copy(cg).lerp(cw, Math.random() * .35).multiplyScalar(.8); col.push(c.r, c.g, c.b); sz.push(.04 + Math.random() * .015); ph.push(Math.random()); } } }
    globe.add(makePoints(pos, col, sz, ph, pointsMaterial({ back: true, twinkle: .6 }))); }

  /* city nodes, beams, pulse rings, labels */
  const nodes = [], labels = [];
  CITIES.forEach((cty, i) => {
    const p = ll(cty.lat, cty.lon, R * 1.004), n = p.clone().normalize();
    const holder = new THREE.Group(); holder.position.copy(p); holder.quaternion.setFromUnitVectors(V(0, 1, 0), n); globe.add(holder);
    sph(holder, cty.big ? .1 : .06, emis(0xffffff, 1.4), 0, 0, 0, 12, 8);
    const h = cty.big ? .5 : .3; const beam = cyl(holder, .012, .03, h, glow(C.cyan, .45), 0, h / 2, 0, 6);
    const ring = add(holder, new THREE.RingGeometry(.1, .125, 40), glow(C.cyan, .6, THREE.DoubleSide)); ring.rotation.x = -Math.PI / 2; ring.position.y = .02;
    nodes.push({ ring, phase: i * .7, big: cty.big });
    if (cty.label) { const L = labelSprite(ctx.t(cty.k, cty.ar), { size: 48, weight: 600, height: cty.big ? .34 : .26, color: '#e6f7ff', bg: 'rgba(6,15,36,.55)', border: 'rgba(31,200,246,.55)' });
      const e = V(Math.cos(THREE.MathUtils.degToRad(cty.lon)), 0, -Math.sin(THREE.MathUtils.degToRad(cty.lon))), nn = V(0, 1, 0).sub(n.clone().multiplyScalar(n.y)).normalize();
      const [de, dn] = cty.off || [0, .4]; L.sprite.position.copy(n.clone().multiplyScalar(R * 1.004 + h + .12)).addScaledVector(e, de).addScaledVector(nn, dn); globe.add(L.sprite); labels.push({ L, cty }); }
  });
  ctx.onLang(() => labels.forEach(({ L, cty }) => L.set(ctx.t(cty.k, cty.ar))));

  /* arcs from Riyadh with travelling pulses */
  const arcs = []; const riy = CITIES[0];
  CITIES.slice(1).forEach((cty, i) => {
    const a = ll(riy.lat, riy.lon, R).normalize(), b = ll(cty.lat, cty.lon, R).normalize(); const pts = [];
    const ang = a.angleTo(b); for (let u = 0; u <= 24; u++) { const t = u / 24; const v = a.clone().lerp(b, t).normalize().multiplyScalar(R * 1.004 + Math.sin(Math.PI * t) * (.5 + ang * 3.2)); pts.push(v); }
    const curve = new THREE.CatmullRomCurve3(pts); globe.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, .02, 5, false), glow(C.cyan, .3)));
    const dot = add(globe, new THREE.SphereGeometry(.05, 8, 6), emis(0xffffff, 1.8)); arcs.push({ curve, dot, off: i / 7, sp: .12 + (i % 3) * .03 });
  });

  /* projector base + holo beam */
  const baseG = new THREE.Group(); baseG.position.y = -R - 2.6; g.add(baseG);
  cyl(baseG, 4.6, 5.0, .5, std(C.ink, { metal: .5, rough: .4 }), 0, 0, 0, 40);
  for (const r of [3.2, 4.1, 4.7]) { const t = add(baseG, new THREE.TorusGeometry(r, .035, 6, 80), emis(C.cyan, 2.2)); t.rotation.x = Math.PI / 2; t.position.y = .28; }
  const cone = add(baseG, new THREE.CylinderGeometry(R * .75, 3.6, 3.4, 48, 1, true), fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.4, base: .02, op: .28, additive: true, side: THREE.DoubleSide })); cone.position.y = 1.9;

  /* orbit rings + satellites */
  const orb = [];
  [[R * 1.5, .5, .25, C.cyan, 5], [R * 1.78, -.7, -.1, C.b400, 4]].forEach(([r, rx, rz, col, nS], i) => {
    const grp = new THREE.Group(); grp.rotation.set(rx, 0, rz); g.add(grp);
    const t = add(grp, new THREE.TorusGeometry(r, .02, 6, 128), emis(col, 1.6, { op: .7 })); t.rotation.x = Math.PI / 2;
    const sats = []; for (let s = 0; s < nS; s++) { const m = add(grp, new THREE.OctahedronGeometry(.17 + (s % 2) * .06), emis(s % 2 ? C.cyan : 0xffffff, 2.2)); sats.push({ m, a: s / nS * Math.PI * 2 }); }
    orb.push({ grp, r, sats, sp: (i ? -.12 : .18) });
  });

  /* gateway ring (vision) — camera looks through it at the globe */
  const gate = new THREE.Group(); gate.position.set(0, 2.2, 17.5); g.add(gate);
  const gr = 3.9;
  const gt = add(gate, new THREE.TorusGeometry(gr, .11, 10, 90), emis(C.blue, 2.4)); gt.position.z = 0;
  const gt2 = add(gate, new THREE.TorusGeometry(gr * .93, .035, 8, 90), emis(C.cyan, 2.8));
  const gblocks = new THREE.Group(); gate.add(gblocks);
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const b = box(gblocks, .5, .22, .22, std(C.b700, { em: C.blue, ei: .9, metal: .4 }), Math.cos(a) * (gr + .35), Math.sin(a) * (gr + .35), 0); b.rotation.z = a; }
  const gfield = add(gate, new THREE.CircleGeometry(gr * .93, 48), fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.2, base: .02, op: .16, additive: true, side: THREE.DoubleSide }));
  const gl = glowSprite(C.cyan, 16, .35); gate.add(gl);

  const sp = sparkles(Math.round(320 * q), { spread: [60, 36, 60], center: [0, 2, 0], color: C.cyan, color2: C.b400, size: .16, seed: 3 }); g.add(sp);

  const cam = [
    { p: [0, 3.4, 26], t: [0, .6, 0] },
    { p: [0, 4.9, 12.8], t: [0, 2.35, 5.45] },
    { p: [0, 2.6, 26.5], t: [0, 1.6, 0] },
    { p: [-15.5, 8.4, 14], t: [0, 0.6, 0] },
  ];
  return { group: g, cam, update(t, k) {
    const gulfRot = -50 * Math.PI / 180;
    let rot = gulfRot * smooth(-.2, 1, k); if (k > 1) rot += (k - 1) * -.06 + Math.sin(t * .25) * .015; if (k < 0) rot = Math.min(0, k * .4);
    globe.rotation.y = rot + (k <= 0 ? t * .02 : 0);
    nodes.forEach((n) => { const u = (t * .7 + n.phase) % 2; const s = .6 + u * (n.big ? 2.6 : 1.7); n.ring.scale.setScalar(s); n.ring.material.opacity = (1 - u / 2) * .85; });
    arcs.forEach((a) => { const u = (t * a.sp + a.off) % 1; a.dot.position.copy(a.curve.getPoint(u)); });
    orb.forEach((o) => o.sats.forEach((s) => { const a = s.a + t * o.sp; s.m.position.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r); s.m.rotation.set(t, t * .7, 0); }));
    // satellites are in a tilted group; ring torus itself lies in XZ via rotation above
    gate.rotation.z = t * .15; gblocks.rotation.z = -t * .3; gt2.rotation.z = t * .4;
    gate.scale.setScalar(Math.max(.001, smooth(.7, 1.6, k) * (1 - smooth(2.6, 3.1, k))) * (1 + .015 * Math.sin(t * 2))); gl.material.opacity = .25 + .15 * smooth(1.2, 2, k) * (1 - smooth(2.4, 3, k));
    atmo.scale.setScalar(1 + .012 * Math.sin(t * 1.2));
  } };
}
