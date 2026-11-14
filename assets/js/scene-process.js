/* Scene 4 — طريقة عملنا: a circuit-board with a glowing data line running through 4 stations (understand, design, build, run). */
import { THREE, C, clamp, lerp, smooth, easeOut, easeInOut, V, std, glow, emis, add, box, cyl, sph, ico, torus, circleLine, lineMat, fresnelMat, labelSprite, glowSprite, sparkles, canvasTex, tileTex, platform, rr, polyline } from './util.js';

export default function build(ctx) {
  const g = new THREE.Group(); const q = ctx.q;
  /* board */
  box(g, 96, 1.2, 40, std(C.navy, { metal: .5, rough: .5 }), 0, -.6, 0, .3);
  box(g, 97, .25, 41, emis(C.blue, 1.2, { op: .9 }), 0, -1.25, 0);
  const trace = canvasTex(2048, 1024, (x, W, H) => {
    let s = 11; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, W, H); x.lineCap = 'round'; x.lineJoin = 'round';
    for (let i = 0; i < 90; i++) { let px = rnd() * W, py = rnd() * H; x.beginPath(); x.moveTo(px, py); const n = 3 + (rnd() * 4 | 0); for (let j = 0; j < n; j++) { const d = rnd() < .5 ? 0 : 1; const len = 40 + rnd() * 140; if (d) { px += (rnd() < .5 ? -1 : 1) * len; } else { py += (rnd() < .5 ? -1 : 1) * len; } x.lineTo(px, py); }
      x.strokeStyle = rnd() < .3 ? 'rgba(31,200,246,.75)' : 'rgba(45,99,252,.65)'; x.lineWidth = 3 + rnd() * 3; x.stroke(); x.fillStyle = x.strokeStyle; x.beginPath(); x.arc(px, py, 8, 0, 7); x.fill(); x.fillStyle = '#060F24'; x.beginPath(); x.arc(px, py, 3.5, 0, 7); x.fill(); }
  });
  const tp = add(g, new THREE.PlaneGeometry(94, 38), new THREE.MeshBasicMaterial({ map: trace.tex, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, .03, 0); tp.rotation.x = -Math.PI / 2;
  const gp = add(g, new THREE.PlaneGeometry(94, 38), new THREE.MeshBasicMaterial({ map: tileTex(0, 0, 94 / 4, 38 / 4), transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), 0, .02, 0); gp.rotation.x = -Math.PI / 2;
  for (const z of [-19.7, 19.7]) box(g, 96, .1, .12, emis(C.cyan, 2.2), 0, .03, z);
  for (const x of [-47.7, 47.7]) box(g, .12, .1, 40, emis(C.cyan, 2.2), x, .03, 0);
  // chips
  { let s = 4; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < Math.round(26 * q); i++) { const x = (rnd() - .5) * 84, z = (rnd() - .5) * 34; if (Math.abs(z) < 8 && Math.abs(x) < 36) continue; const w = 1.2 + rnd() * 2.4, d = 1.2 + rnd() * 2.4, h = .3 + rnd() * .9;
      box(g, w, h, d, std(0x0b1f4a, { metal: .6, rough: .35, em: C.blue, ei: .12 }), x, h / 2, z, .06); box(g, w * .6, .04, d * .6, emis(rnd() > .5 ? C.cyan : C.blue, 1.4), x, h + .02, z); } }

  /* data track */
  const ST = [[24, 0], [8, -5], [-9, 4], [-25, -3]];
  const pts = [V(36, .3, 8), V(30, .3, 4), V(24, .3, 0), V(16, .3, -3), V(8, .3, -5), V(0, .3, -1), V(-9, .3, 4), V(-17, .3, 3), V(-25, .3, -3), V(-34, .3, -7)];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .35);
  const segs = 220; const tubeGeo = new THREE.TubeGeometry(curve, segs, .17, 8, false);
  add(g, tubeGeo, std(C.b800, { em: C.blue, ei: .35, metal: .3 }));
  const fillGeo = new THREE.TubeGeometry(curve, segs, .2, 8, false); const fill = add(g, fillGeo, emis(C.cyan, 1.35)); const idxPer = 8 * 6;
  const stU = [2, 4, 6, 8].map((i) => i / (pts.length - 1)); // station params ~ nodes 2,4,6,8
  const packet = new THREE.Group(); g.add(packet); sph(packet, .3, emis(0xffffff, 2.2), 0, 0, 0, 12, 8); packet.add(glowSprite(C.cyan, 2.2, .55));
  const trail = []; for (let i = 0; i < 14; i++) { const t = sph(g, .18 - i * .011, emis(C.cyan, 1.5, { op: .7 - i * .05 }), 0, 0, 0, 8, 6); trail.push(t); }

  /* stations */
  const stations = [];
  function pad(x, z, col) { const m = new THREE.Group(); m.position.set(x, 0, z); g.add(m);
    cyl(m, 3.4, 3.6, .5, std(C.b800, { metal: .55, rough: .35 }), 0, .25, 0, 6);
    const r = add(m, new THREE.TorusGeometry(3.35, .06, 6, 6), emis(col, 2.4)); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI / 6; r.position.y = .52;
    const r2 = add(m, new THREE.TorusGeometry(2.3, .035, 6, 48), emis(col, 1.6, { op: .7 })); r2.rotation.x = Math.PI / 2; r2.position.y = .53;
    return { m, r2 }; }
  const num = (m, n, y) => { const l = labelSprite('0' + n, { size: 60, height: .9, color: '#bfeaff', weight: 700, dir: 'ltr', bg: 'rgba(6,15,36,.65)', border: 'rgba(31,200,246,.6)' }); l.sprite.position.set(0, y, 0); m.add(l.sprite); };

  // 1 — understand: magnifier over scattered data points
  { const { m, r2 } = pad(ST[0][0], ST[0][1], C.cyan); const mag = new THREE.Group(); mag.position.y = 3.2; m.add(mag);
    torus(mag, 1.5, .15, std(C.mist, { metal: .7, rough: .25 }), 0, 0, 0, 40); add(mag, new THREE.CircleGeometry(1.45, 40), fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.4, base: .12, op: .5, additive: true, side: THREE.DoubleSide }));
    const hd = cyl(mag, .17, .2, 1.9, std(C.b800, { metal: .5 }), 1.4, -1.55, 0, 10); hd.rotation.z = Math.PI / 4;
    const dots = []; for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 1 + (i % 6) * .4; const d = new THREE.Group(); d.position.set(Math.cos(a) * r, .9, Math.sin(a) * r * .9); m.add(d); sph(d, .17, emis(i % 3 ? C.b400 : C.cyan, 1.8), 0, 0, 0, 10, 8); cyl(d, .03, .03, 1 + (i % 4) * .2, glow(C.cyan, .35), 0, -.5, 0, 5); dots.push(d); }
    num(m, 1, 6.2);
    stations.push((t, a) => { mag.position.set(Math.sin(t * .8) * 1.3, 3.3 + Math.sin(t * 1.3) * .15, Math.cos(t * .6) * .8); dots.forEach((d, i) => { const dx = d.position.x - mag.position.x, dz = d.position.z - mag.position.z; const near = 1 - clamp(Math.hypot(dx, dz) / 1.7); d.scale.setScalar(1 + near * 1.6); d.position.y = .9 + near * .8; }); r2.rotation.z = t * .3; }); }

  // 2 — design: blueprint cube + layered wireframe frames
  { const { m, r2 } = pad(ST[1][0], ST[1][1], C.b400);
    const bp = new THREE.Group(); bp.position.y = 3.4; m.add(bp);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.8, 2.8, 2.8)), lineMat(C.cyan, .95)); bp.add(wire);
    const solid = box(bp, 2.5, 2.5, 2.5, std(C.blue, { em: C.blue, ei: .6, metal: .3, op: .9 }), 0, 0, 0, .1); 
    const frames = [0, 1, 2].map((i) => { const f = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.4 - i * .5, 2.4 - i * .35)), lineMat(i % 2 ? C.cyan : 0xffffff, .85)); f.position.set(0, 0, 0); bp.add(f); return f; });
    const prot = add(m, new THREE.TorusGeometry(2.7, .035, 6, 64, Math.PI), emis(C.cyan, 2), 0, .7, 0); prot.rotation.x = Math.PI / 2;
    const gh = new THREE.GridHelper(5.6, 14, C.cyan, C.blue); gh.position.y = .6; gh.material.transparent = true; gh.material.opacity = .45; gh.material.blending = THREE.AdditiveBlending; gh.material.depthWrite = false; m.add(gh);
    const pen = new THREE.Group(); m.add(pen); cyl(pen, .1, .1, 1.3, std(C.mist, { metal: .5 }), 0, .65, 0, 8); add(pen, new THREE.ConeGeometry(.1, .3, 8), emis(C.cyan, 2.2), 0, -.15, 0).rotation.x = Math.PI;
    num(m, 2, 6.2);
    stations.push((t, a) => { bp.rotation.y = t * .35; bp.rotation.x = Math.sin(t * .5) * .15; solid.scale.setScalar(.35 + .65 * easeInOut(a)); solid.material.opacity = .25 + .65 * a;
      frames.forEach((f, i) => { f.position.z = (i - 1) * (1.0 + a * .9); f.position.y = 0; f.rotation.y = 0; });
      pen.position.set(Math.cos(t * 1.1) * 1.6, .7 + .12 * Math.sin(t * 3), Math.sin(t * 1.1) * 1.6); pen.rotation.z = .6; prot.rotation.z = t * .4; r2.rotation.z = t * .3; }); }

  // 3 — build: crane stacking cubes
  { const { m, r2 } = pad(ST[2][0], ST[2][1], C.cyan);
    const cubes = []; const lay = [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [1, 0, 1], [-1, 0, -1], [0, 1, 0], [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 2, 0]];
    lay.forEach(([x, y, z], i) => { const c = box(m, .92, .92, .92, std(i % 3 ? C.blue : (i % 2 ? C.cyan : C.b700), { em: i % 3 ? C.blue : C.cyan, ei: .4, metal: .3 }), x * 1.0, .96 + y * 1.0, z * 1.0, .08); c.userData = { fx: x, fy: .96 + y, fz: z, i }; cubes.push(c); });
    const crane = new THREE.Group(); crane.position.set(-3.2, 0, -1.4); m.add(crane); box(crane, .35, 7, .35, std(C.b700, { metal: .5 }), 0, 3.5, 0); const arm = new THREE.Group(); arm.position.y = 7; crane.add(arm); box(arm, 6, .3, .3, std(C.b700, { metal: .5 }), 3, 0, 0); box(arm, 1.2, .5, .5, std(C.b800), -.7, 0, 0);
    const rope = cyl(arm, .03, .03, 1, glow(0xffffff, .8), 4.2, -.5, 0, 4); const hook = box(arm, .4, .3, .4, emis(C.cyan, 2), 4.2, -1, 0);
    const br = ['</>', '{ }', '01'].map((s, i) => { const l = labelSprite(s, { size: 64, height: .85, color: '#1FC8F6', dir: 'ltr', weight: 700, glowColor: '#1FC8F6', bg: 'rgba(6,15,36,.55)', border: 'rgba(31,200,246,.5)' }); m.add(l.sprite); return l.sprite; });
    num(m, 3, 7.3);
    stations.push((t, a) => { cubes.forEach((c) => { const u = easeOut(clamp(a * 1.5 - c.userData.i * .08 + .1)); c.position.set(c.userData.fx, lerp(c.userData.fy + 8, c.userData.fy, u), c.userData.fz); c.rotation.y = (1 - u) * 2; c.scale.setScalar(.3 + .7 * clamp(u * 3)); });
      arm.rotation.y = Math.sin(t * .5) * .4; hook.position.y = -1.4 + Math.sin(t * 1.5) * .4; rope.scale.y = (1 + Math.sin(t * 1.5) * .6); rope.position.y = -.2 - rope.scale.y * .5 + .3;
      br.forEach((s, i) => { s.position.set(Math.cos(t * .6 + i * 2.1) * 3.4, 3.2 + i * .9 + Math.sin(t + i) * .2, Math.sin(t * .6 + i * 2.1) * 2.6); }); r2.rotation.z = t * .3; }); }

  // 4 — run: rocket launch
  { const { m, r2 } = pad(ST[3][0], ST[3][1], C.cyan);
    box(m, .5, 5.5, .5, std(C.b700, { metal: .5 }), -1.6, 3.2, 0); box(m, 1.4, .2, .3, std(C.b700), -.9, 4.6, 0); box(m, 1.4, .2, .3, std(C.b700), -.9, 2.6, 0);
    const rk = new THREE.Group(); rk.position.y = 1.0; m.add(rk);
    const body = add(rk, new THREE.CylinderGeometry(.75, .85, 3.6, 16), std(C.mist, { metal: .6, rough: .25 }), 0, 2.1, 0); add(rk, new THREE.ConeGeometry(.75, 1.4, 16), std(C.blue, { em: C.blue, ei: .4, metal: .4 }), 0, 4.6, 0);
    [0, 1, 2].forEach((i) => { const f = box(rk, .12, 1.3, .9, std(C.blue, { em: C.blue, ei: .3 }), 0, 1, 0); f.geometry.translate(0, 0, .75); const gp = new THREE.Group(); rk.add(gp); gp.rotation.y = i / 3 * Math.PI * 2; gp.add(f); f.position.y = .9; });
    sph(rk, .3, emis(C.cyan, 2.2), 0, 3.3, .72, 12, 8); torus(rk, .8, .07, std(C.cyan, { em: C.cyan, ei: .6 }), 0, 2.1, 0, 20).rotation.x = Math.PI / 2;
    const flame = add(rk, new THREE.ConeGeometry(.6, 2.6, 12, 1, true), glow(C.cyan, .85, THREE.DoubleSide), 0, -.1, 0); flame.rotation.x = Math.PI; const flame2 = add(rk, new THREE.ConeGeometry(.3, 1.8, 10, 1, true), glow(0xffffff, .9, THREE.DoubleSide), 0, .1, 0); flame2.rotation.x = Math.PI;
    const waves = [0, 1, 2].map(() => { const r = add(m, new THREE.RingGeometry(.9, 1, 48), glow(C.cyan, .6, THREE.DoubleSide), 0, 6.5, 0); return r; });
    const mon = canvasTex(256, 160, (x, W, H) => { x.fillStyle = '#0d2354'; rr(x, 0, 0, W, H, 18); x.fill(); x.strokeStyle = '#1FC8F6'; x.lineWidth = 4; x.stroke(); x.strokeStyle = '#12B76A'; x.lineWidth = 12; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(80, 84); x.lineTo(115, 118); x.lineTo(180, 44); x.stroke(); });
    const mn = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: mon.tex, color: 0xdfe8f8, toneMapped: false })); mn.position.set(2.7, 2.2, 1.2); mn.rotation.y = -.5; m.add(mn);
    num(m, 4, 8);
    const exhaust = sparkles(Math.round(120 * q), { spread: [2.5, 6, 2.5], center: [0, 0, 0], color: 0xffffff, color2: C.cyan, size: .2, seed: 12 }); rk.add(exhaust);
    stations.push((t, a, k) => { const lift = smooth(4.05, 4.95, k) * 46; rk.position.y = 1.0 + lift + (lift < .1 ? Math.sin(t * 40) * .01 * a : 0); rk.rotation.z = (lift > 1 ? Math.sin(t * 2) * .03 : 0);
      const fs = .9 + .15 * Math.sin(t * 30) + (lift > 1 ? .6 : 0); flame.scale.set(1, fs, 1); flame2.scale.set(1, fs, 1); flame.material.opacity = .4 + .5 * a; flame2.material.opacity = .4 + .5 * a;
      waves.forEach((w, i) => { const u = (t * .5 + i / 3) % 1; w.scale.setScalar(1 + u * 5); w.material.opacity = (1 - u) * .5 * a; w.rotation.x = -Math.PI / 2; w.position.y = 5.2; }); r2.rotation.z = t * .3; }); }

  const sp = sparkles(Math.round(360 * q), { spread: [100, 26, 50], center: [0, 8, 0], color: C.cyan, color2: C.b400, size: .15, seed: 21 }); g.add(sp);

  const cam = [
    { p: [24, 13, 21], t: [3, 0, -1] },
    { p: [27.5, 8, 12], t: [24, 2.4, 0] },
    { p: [11.5, 8.4, 9], t: [8, 3, -5] },
    { p: [-5, 8.6, 15], t: [-9, 2.6, 4] },
    { p: [-22, 8, 10.5], t: [-25, 3.8, -3] },
  ];
  return { group: g, cam, update(t, k, dt) {
    // data packet follows scroll between stations
    const kk = clamp(k, 0, 5); let u;
    if (kk < 1) u = lerp(0, stU[0], easeInOut(kk)); else if (kk < 4) { const f = kk - 1, i = Math.floor(f); u = lerp(stU[i], stU[Math.min(3, i + 1)], easeInOut(f - i)); } else u = lerp(stU[3], 1, clamp(kk - 4));
    packet.position.copy(curve.getPoint(clamp(u))); packet.position.y += .3; packet.children[1].material.opacity = .6 + .3 * Math.sin(t * 8);
    trail.forEach((tr, i) => { tr.position.copy(curve.getPoint(clamp(u - (i + 1) * .006))); tr.position.y += .3; });
    fillGeo.setDrawRange(0, Math.floor(clamp(u) * segs) * idxPer);
    stations.forEach((s, i) => { const a = 1 - clamp(Math.abs(k - (i + 1)) / .9); s(t, a * a * (3 - 2 * a), k); });
  } };
}
