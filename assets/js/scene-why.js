/* Scene 5 — لا نسلّم ونختفي: a shield core (Digital Pass keyhole) ringed by four crystal monuments — trust, clarity, mastery, partnership. */
import { THREE, C, clamp, lerp, smooth, easeInOut, V, std, glow, emis, hdr, add, box, cyl, sph, ico, torus, circleLine, lineMat, fresnelMat, labelSprite, glowSprite, sparkles, platform, shieldShape } from './util.js';

const RAD = 12;
const ANG = [45, -45, -135, 135].map((d) => d * Math.PI / 180);
const at = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];

export default function build(ctx) {
  const g = new THREE.Group(); const q = ctx.q;
  platform(g, 26, { y: -.1, h: .9, seg: 72, color: C.ink });
  for (const r of [RAD, 19, 6]) { const t = add(g, new THREE.TorusGeometry(r, .05, 6, 128), emis(C.blue, 1.7, { op: .85 })); t.rotation.x = Math.PI / 2; t.position.y = .06; }
  /* spokes from core to monuments */
  ANG.forEach((a) => { const [x, z] = at(a, RAD); const L = new THREE.Mesh(new THREE.BoxGeometry(.12, .05, RAD - 3.2), emis(C.cyan, 1.8, { op: .7 })); L.position.set(x / 2, .08, z / 2); L.rotation.y = a; g.add(L); });

  /* shield core */
  const core = new THREE.Group(); core.position.y = 5.2; g.add(core);
  const sg = new THREE.ExtrudeGeometry(shieldShape(1, 1.2), { depth: .5, bevelEnabled: true, bevelSize: .09, bevelThickness: .09, bevelSegments: 2, curveSegments: 14 }); sg.translate(0, 0, -.25);
  const shield = add(core, sg, std(C.blue, { metal: .55, rough: .25, em: C.blue, ei: .55 })); shield.scale.setScalar(2.5);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(sg, 25), lineMat(C.cyan, 1)); edges.scale.setScalar(2.52); core.add(edges);
  // keyhole (brand motif)
  const kh = new THREE.Shape(); kh.absarc(0, .38, .34, 0, Math.PI * 2, false); const slot = new THREE.Path(); 
  const key = new THREE.Shape(); key.moveTo(-.16, .12); key.lineTo(.16, .12); key.lineTo(.3, -.62); key.lineTo(-.3, -.62); key.closePath();
  const kmat = std(C.deep, { rough: .8, metal: 0 });
  [kh, key].forEach((sh) => { const m = add(core, new THREE.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: false }), kmat, 0, .1, .36 * 2.5 * .38 + .08); m.scale.setScalar(2.1); m.position.set(0, .25, .62); });
  const kring = add(core, new THREE.TorusGeometry(.78, .03, 6, 40), emis(C.cyan, 2.4), 0, .88, .68);
  const halo = glowSprite(C.cyan, 16, .3); core.add(halo); const halo2 = glowSprite(C.blue, 26, .2); core.add(halo2);
  const rings = [[4.4, .04, C.cyan, .6, .2], [5.6, .03, C.b400, .3, -.4], [7, .03, C.cyan, 1.1, .3]].map(([r, tb, col, rx, rz], i) => { const gr = new THREE.Group(); gr.rotation.set(rx, 0, rz); core.add(gr); const t = add(gr, new THREE.TorusGeometry(r, tb, 6, 128), emis(col, 1.8, { op: .85 })); t.rotation.x = Math.PI / 2; const s = add(gr, new THREE.OctahedronGeometry(.2), emis(0xffffff, 2.4)); return { gr, s, r, sp: (i % 2 ? -1 : 1) * (.25 + i * .08) }; });
  const beam = cyl(g, 1.2, 1.2, 30, fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.5, base: 0, op: .13, additive: true, side: THREE.DoubleSide }), 0, 15, 0, 24);
  const rise = sparkles(Math.round(260 * q), { spread: [9, 30, 9], center: [0, 12, 0], color: 0xffffff, color2: C.cyan, size: .18, seed: 33 }); g.add(rise);

  /* monuments */
  const mons = [];
  function pedestal(a, col) { const [x, z] = at(a, RAD); const m = new THREE.Group(); m.position.set(x, 0, z); g.add(m);
    cyl(m, 2.6, 2.9, .7, std(C.b800, { metal: .55, rough: .3 }), 0, .35, 0, 6); const r = add(m, new THREE.TorusGeometry(2.55, .06, 6, 6), emis(col, 2.4)); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI / 6; r.position.y = .72;
    const r2 = add(m, new THREE.TorusGeometry(1.7, .035, 6, 48), emis(col, 1.6, { op: .7 })); r2.rotation.x = Math.PI / 2; r2.position.y = .74; m.rotation.y = a; return { m, r2 }; }
  // 1 trust: padlock inside a crystal prism
  { const { m, r2 } = pedestal(ANG[0], C.cyan); const it = new THREE.Group(); it.position.y = 4.1; m.add(it);
    const prism = add(it, new THREE.CylinderGeometry(1.5, 1.5, 4.2, 6), fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.5, base: .12, op: .85, additive: true }));
    it.add(new THREE.LineSegments(new THREE.EdgesGeometry(prism.geometry), lineMat(0xffffff, .55))); add(it, new THREE.ConeGeometry(1.5, 1.2, 6), fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.5, base: .12, op: .85, additive: true }), 0, 2.7, 0); add(it, new THREE.ConeGeometry(1.5, 1.2, 6), fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.5, base: .12, op: .85, additive: true }), 0, -2.7, 0).rotation.x = Math.PI;
    const lk = new THREE.Group(); it.add(lk); box(lk, 1.5, 1.2, .8, std(C.mist, { metal: .8, rough: .25, em: C.cyan, ei: .3 }), 0, -.3, 0, .14); add(lk, new THREE.TorusGeometry(.5, .11, 8, 24, Math.PI), std(C.mist, { metal: .8, rough: .25 }), 0, .3, 0); sph(lk, .14, emis(C.cyan, 2.4), 0, -.3, .42, 10, 8); box(lk, .08, .3, .05, emis(C.cyan, 2.4), 0, -.5, .42);
    mons.push((t, a) => { it.rotation.y = t * .5; it.position.y = 4.1 + Math.sin(t * 1.2) * .2; lk.rotation.y = -t * .5 + Math.sin(t) * .3; r2.rotation.z = t * .3; }); }
  // 2 clarity: clear glass icosahedron with an eye/lens and orbiting droplets
  { const { m, r2 } = pedestal(ANG[1], C.b300); const it = new THREE.Group(); it.position.y = 4.2; m.add(it);
    const gm = add(it, new THREE.IcosahedronGeometry(2.1, 1), fresnelMat({ rim: 0xbfefff, inner: C.cyan, pow: 1.8, base: .08, op: .8, additive: true })); it.add(new THREE.LineSegments(new THREE.EdgesGeometry(gm.geometry), lineMat(0xffffff, .65)));
    const iris = new THREE.Group(); it.add(iris); torus(iris, .7, .07, emis(0xffffff, 2.2), 0, 0, 0, 32); sph(iris, .32, emis(C.cyan, 3), 0, 0, 0, 12, 8); torus(iris, 1.1, .03, emis(C.cyan, 1.8), 0, 0, 0, 32);
    const drops = []; for (let i = 0; i < 5; i++) drops.push(sph(it, .13, emis(0xffffff, 2), 0, 0, 0, 8, 6));
    mons.push((t, a) => { it.rotation.y = -t * .4; it.rotation.x = Math.sin(t * .5) * .15; it.position.y = 4.2 + Math.sin(t * 1.1) * .2; iris.rotation.z = t * .8; iris.scale.setScalar(1 + .12 * Math.sin(t * 2)); drops.forEach((d, i) => { const an = t * .9 + i * 1.26; d.position.set(Math.cos(an) * 3, Math.sin(an * 1.4) * 1.2, Math.sin(an) * 3); }); r2.rotation.z = t * .3; }); }
  // 3 mastery: faceted diamond + gyroscope rings
  { const { m, r2 } = pedestal(ANG[2], C.cyan); const it = new THREE.Group(); it.position.y = 4.1; m.add(it);
    const dg = new THREE.OctahedronGeometry(1.7, 0); dg.scale(1, 1.55, 1); const dm = add(it, dg, std(C.cyan, { em: C.cyan, ei: .8, metal: .7, rough: .15 })); it.add(new THREE.LineSegments(new THREE.EdgesGeometry(dg), lineMat(0xffffff, .9)));
    const gy = [0, 1, 2].map((i) => { const r = add(it, new THREE.TorusGeometry(2.6 + i * .3, .035, 6, 80), emis(i === 1 ? C.b300 : C.cyan, 1.8, { op: .85 })); return r; });
    const sps = sparkles(Math.round(60 * q), { spread: [5, 7, 5], center: [0, 0, 0], color: 0xffffff, color2: C.cyan, size: .12, seed: 40 }); it.add(sps);
    mons.push((t, a) => { it.rotation.y = t * .6; it.position.y = 4.1 + Math.sin(t * 1.3) * .22; dm.scale.setScalar(1 + .04 * Math.sin(t * 3)); gy[0].rotation.set(t * .7, 0, 0); gy[1].rotation.set(0, t * .6, t * .3); gy[2].rotation.set(t * .4, t * .5, 1.1); r2.rotation.z = t * .3; }); }
  // 4 partnership: two interlocked rings + orbiting spheres
  { const { m, r2 } = pedestal(ANG[3], C.cyan); const it = new THREE.Group(); it.position.y = 4.0; m.add(it);
    const ra = torus(it, 1.5, .34, std(C.blue, { em: C.blue, ei: .7, metal: .6, rough: .25 }), -.95, 0, 0, 48); const rb = torus(it, 1.5, .34, std(C.cyan, { em: C.cyan, ei: .7, metal: .6, rough: .25 }), .95, 0, 0, 48); 
    const hs = [0, 1].map((i) => sph(it, .3, emis(i ? C.cyan : C.blue, 2.4), 0, 0, 0, 12, 8));
    mons.push((t, a) => { it.rotation.y = t * .5; it.rotation.z = Math.sin(t * .6) * .15; it.position.y = 4.0 + Math.sin(t * 1.2) * .2; ra.rotation.y = t * .8; rb.rotation.x = Math.PI / 2 + t * .8; ra.rotation.x = 0; rb.rotation.y = 0;
      hs.forEach((h, i) => { const an = t * 1.2 + i * Math.PI; h.position.set(Math.cos(an) * 2.8, Math.sin(an) * .5, Math.sin(an) * 2.8); }); r2.rotation.z = t * .3; }); }

  const sp = sparkles(Math.round(380 * q), { spread: [70, 26, 70], center: [0, 8, 0], color: C.cyan, color2: C.b400, size: .15, seed: 51 }); g.add(sp);

  const cam = [{ p: [0, 15, 36], t: [0, 3.6, 0] }];
  ANG.forEach((a, i) => { const aa = a + .22; const [cx, cz] = at(aa, RAD + 11.5); const [tx, tz] = at(a, RAD - 0.5); cam.push({ p: [cx, 6.6, cz], t: [tx, 4.3, tz] }); });
  return { group: g, cam, exit: { p: [0, 7.5, 12], t: [0, 5.2, 0] }, update(t, k) {
    core.rotation.y = Math.sin(t * .3) * .35; core.position.y = 5.2 + Math.sin(t * 1.1) * .2; halo.material.opacity = .26 + .08 * Math.sin(t * 2); kring.rotation.z = t * .5;
    rings.forEach((r) => { r.gr.rotation.y = t * r.sp; r.s.position.set(Math.cos(t * r.sp * 3) * r.r, 0, Math.sin(t * r.sp * 3) * r.r); });
    mons.forEach((f, i) => { const a = 1 - clamp(Math.abs(k - (i + 1)) / .9); f(t, a * a * (3 - 2 * a)); });
  } };
}
