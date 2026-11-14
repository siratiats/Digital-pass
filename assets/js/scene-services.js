/* Scene 2 — الخدمات: a tech runway; the camera slides past 7 floating service modules (2 groups, 2 gates). */
import { THREE, C, clamp, lerp, smooth, easeInOut, V, std, glow, emis, add, box, cyl, sph, ico, torus, circleLine, lineMat, fresnelMat, labelSprite, glowSprite, sparkles, canvasTex, screenMesh, tileTex, gearGeometry, shieldShape, polyline, rr, FONTS } from './util.js';
import { drawDashboard, drawPhone, drawApp, drawSite, drawTheme } from './mocks.js';

const MX = [0, -15, -30, -45, -67, -82, -97];
const GATE2 = -56, GATE1 = 9;

export default function build(ctx) {
  const g = new THREE.Group(); const q = ctx.q;
  const T = (k, ar) => ctx.t(k, ar);
  const redraws = []; const reg = (o) => { redraws.push(o); return o; };
  ctx.onLang(() => redraws.forEach((o) => o.redraw())); 
  const afterFonts = () => document.fonts && document.fonts.ready.then(() => redraws.forEach((o) => o.redraw()));
  afterFonts();

  /* ---------- runway ---------- */
  const rw = new THREE.Group(); g.add(rw);
  const L = 128, cx = -49;
  box(rw, L, .6, 13.5, std(C.ink, { metal: .45, rough: .45 }), cx, -.3, 0);
  box(rw, L, .3, 15, std(C.navy, { metal: .3 }), cx, -.75, 0);
  const grid = add(rw, new THREE.PlaneGeometry(L, 13.5), new THREE.MeshBasicMaterial({ map: tileTex(0, 0, L / 3.2, 13.5 / 3.2), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), cx, .02, 0); grid.rotation.x = -Math.PI / 2;
  for (const z of [-6.8, 6.8]) box(rw, L, .12, .12, emis(C.cyan, 2.2), cx, .04, z);
  for (let i = 0; i < 40; i++) box(rw, 1.6, .05, .22, emis(C.blue, 1.8, { op: .8 }), 12 - i * 3.2, .03, 5.4);
  // side pillars of light
  for (let i = 0; i < 14; i++) { const x = 12 - i * 9.5; for (const z of [-8.5]) { cyl(rw, .06, .06, 9, glow(C.cyan, .35), x, 4.5, z, 6); sph(rw, .22, emis(C.cyan, 2.2), x, 9, z, 10, 8); } }
  // cyber skyline behind
  { let s = 7; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const n = Math.round(80 * q);
    const fill = new THREE.MeshBasicMaterial({ color: 0x0b2150, transparent: true, opacity: .7, fog: true }), em = lineMat(C.blue, .55);
    for (let i = 0; i < n; i++) { const w = .9 + rnd() * 1.8, h = 3 + rnd() * 13, d = .9 + rnd() * 1.6; const x = 20 - rnd() * 140, z = -13 - rnd() * 26;
      const m = add(g, new THREE.BoxGeometry(w, h, d), fill, x, h / 2 - .4, z); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), em));
      if (rnd() > .55) { const win = add(g, new THREE.BoxGeometry(w * .5, .12, .06), emis(rnd() > .5 ? C.cyan : C.b400, 1.8), x, h * (.2 + rnd() * .6), z + d / 2 + .02); } } }

  /* ---------- gates ---------- */
  const gates = [];
  function gate(x, key, ar, col) {
    const gg = new THREE.Group(); gg.position.x = x; g.add(gg);
    for (const z of [-6.2, 6.2]) { box(gg, .5, 7.4, .5, std(C.b800, { metal: .5, em: C.blue, ei: .25 }), 0, 3.7, z, .05); box(gg, .12, 7.4, .12, emis(col, 2), 0, 3.7, z + (z > 0 ? .3 : -.3)); }
    box(gg, .6, .6, 13.6, std(C.b800, { metal: .5, em: C.blue, ei: .25 }), 0, 7.6, 0, .08); box(gg, .16, .16, 13.6, emis(col, 2.4), 0, 7.35, 0);
    const lab = labelSprite(T(key, ar), { size: 54, height: 1.1, bg: 'rgba(6,15,36,.7)', border: 'rgba(31,200,246,.7)', color: '#e9f9ff', weight: 700 }); lab.sprite.position.set(0, 9, 0); gg.add(lab.sprite);
    ctx.onLang(() => lab.set(T(key, ar))); document.fonts && document.fonts.ready.then(() => lab.set(T(key, ar)));
    const gl = glowSprite(col, 9, .25); gl.position.set(0, 7.5, 0); gg.add(gl); return gg;
  }
  gates.push(gate(GATE1, 'services.g1', 'الأنظمة والتطبيقات', C.cyan), gate(GATE2, 'services.g2', 'المواقع والمتاجر الإلكترونية', C.b400));
  gates.forEach((gt) => gt.rotation.y = Math.PI / 2);

  /* ---------- module helpers ---------- */
  const mods = [];
  function pedestal(x, col) {
    const m = new THREE.Group(); m.position.set(x, 0, -1); g.add(m);
    cyl(m, 3.1, 3.3, .5, std(C.b800, { metal: .5, rough: .35 }), 0, .25, 0, 6);
    const r1 = add(m, new THREE.TorusGeometry(3.05, .05, 6, 6), emis(col, 2.4)); r1.rotation.x = Math.PI / 2; r1.rotation.z = Math.PI / 6; r1.position.y = .52;
    const r2 = add(m, new THREE.TorusGeometry(2.1, .03, 6, 48), emis(col, 1.6, { op: .7 })); r2.rotation.x = Math.PI / 2; r2.position.y = .53;
    const beam = cyl(m, 2.6, 2.6, 7, fresnelMat({ rim: col, inner: C.blue, pow: 1.6, base: 0, op: .16, additive: true, side: THREE.DoubleSide }), 0, 4, 0, 6);
    return { m, ring: r2, beam };
  }
  function glyph(draw, col) { const o = canvasTex(128, 128, (x, W, H) => { x.fillStyle = col; rr(x, 0, 0, W, H, 30); x.fill(); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round'; draw(x); }); return o.tex; }
  const tileGlyphs = [
    (x) => { x.beginPath(); x.arc(64, 58, 28, 0, 7); x.stroke(); x.beginPath(); x.moveTo(50, 86); x.lineTo(44, 104); x.lineTo(70, 88); x.stroke(); },            // chat
    (x) => { x.beginPath(); x.moveTo(28, 36); x.lineTo(44, 36); x.lineTo(56, 84); x.lineTo(98, 84); x.lineTo(104, 50); x.lineTo(50, 50); x.stroke(); x.beginPath(); x.arc(60, 100, 5, 0, 7); x.arc(92, 100, 5, 0, 7); x.fill(); }, // cart
    (x) => { x.beginPath(); x.moveTo(28, 90); x.lineTo(28, 70); x.moveTo(52, 90); x.lineTo(52, 50); x.moveTo(76, 90); x.lineTo(76, 62); x.moveTo(100, 90); x.lineTo(100, 34); x.stroke(); },  // bars
    (x) => { x.beginPath(); x.arc(64, 54, 22, Math.PI, 0); x.lineTo(64, 100); x.closePath(); x.stroke(); x.beginPath(); x.arc(64, 54, 8, 0, 7); x.fill(); }, // pin
    (x) => { x.beginPath(); x.moveTo(64, 98); x.bezierCurveTo(20, 66, 34, 28, 64, 52); x.bezierCurveTo(94, 28, 108, 66, 64, 98); x.stroke(); }, // heart
    (x) => { x.beginPath(); x.moveTo(46, 36); x.lineTo(100, 64); x.lineTo(46, 92); x.closePath(); x.fill(); },     // play
  ];

  /* 01 — custom systems: server stack + gears + mini dashboard */
  mods.push((x0) => {
    const p = pedestal(x0, C.cyan), m = new THREE.Group(); m.position.set(x0, .5, -1); g.add(m);
    const slabs = [], leds = [];
    for (let i = 0; i < 4; i++) { const s = new THREE.Group(); m.add(s); box(s, 3.4, .78, 2.3, std(i % 2 ? C.b800 : C.ink, { metal: .55, rough: .35 }), 0, 0, 0, .08);
      box(s, 3.3, .1, 2.35, emis(C.cyan, 1.5, { op: .85 }), 0, .34, 0); for (let j = 0; j < 7; j++) { const l = box(s, .16, .16, .06, new THREE.MeshBasicMaterial({ color: j % 3 ? hdrc(C.cyan) : hdrc(C.green) }), -1.3 + j * .24, 0, 1.18); leds.push(l); }
      box(s, 1.3, .22, .05, std(C.navy), .8, 0, 1.18); slabs.push(s); }
    const gear = add(m, gearGeometry(1.0, 10, .45, .24), std(C.blue, { metal: .6, rough: .3, em: C.blue, ei: .35 }), -.4, 5.8, 0); const gear2 = add(m, gearGeometry(.62, 8, .45, .18), std(C.cyan, { metal: .6, rough: .3, em: C.cyan, ei: .4 }), 1.35, 5.2, 0);
    const dash = reg(canvasTex(512, 320, (x, W, H) => { x.fillStyle = '#0d2354'; rr(x, 0, 0, W, H, 24); x.fill(); x.strokeStyle = CYANS; x.lineWidth = 4; x.stroke(); for (let i = 0; i < 9; i++) { const h = 40 + ((i * 53) % 130); x.fillStyle = i % 3 ? '#2D63FC' : '#1FC8F6'; rr(x, 40 + i * 50, H - 40 - h, 32, h, 8); x.fill(); } x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.moveTo(40, 120); x.lineTo(130, 90); x.lineTo(220, 130); x.lineTo(320, 70); x.lineTo(470, 100); x.stroke(); }));
    const sc = screenMesh(m, 2.6, 1.6, dash.tex, { bezel: .08, depth: .1 }); sc.position.set(3.6, 3.1, 1.2); sc.rotation.y = -.45;
    const parts = sph(m, .001, std(C.white));
    return (t, a) => { slabs.forEach((s, i) => { s.position.y = .7 + i * (.9 + .5 * a) + .06 * Math.sin(t * 1.4 + i); });
      gear.rotation.z = t * .5; gear2.rotation.z = -t * .5 * 1.6 + .3; gear.position.y = .7 + 3 * (.9 + .5 * a) + 1.25; gear2.position.y = gear.position.y - .55;
      leds.forEach((l, i) => { l.visible = ((t * 3 + i * .37) % 2) > .45; }); sc.position.y = 3.1 + Math.sin(t * 1.1) * .12; p.ring.rotation.z = t * .3; };
  });
  const CYANS = '#1FC8F6';
  function hdrc(hex) { return new THREE.Color(hex).multiplyScalar(2.2); }

  /* 02 — app development: phone + orbiting app tiles */
  mods.push((x0) => {
    const p = pedestal(x0, C.cyan), m = new THREE.Group(); m.position.set(x0, 3.2, -1); g.add(m);
    const ph = new THREE.Group(); m.add(ph);
    const tex = reg(canvasTex(560, 1160, (x, W, H) => drawApp(x, W, H, T))).tex;
    box(ph, 1.9, 3.8, .22, std(C.navy, { metal: .6, rough: .3 }), 0, 0, 0, .2);
    const scr = add(ph, new THREE.PlaneGeometry(1.7, 3.52), new THREE.MeshBasicMaterial({ map: tex, color: 0xe8eefa, toneMapped: false }), 0, 0, .12);
    ph.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.94, 3.84, .26)), lineMat(C.cyan, .6)));
    const tiles = []; const cols = ['#2D63FC', '#1FC8F6', '#2655D6', '#628AFD', '#1F46B0', '#1FC8F6'];
    tileGlyphs.forEach((d, i) => { const t = new THREE.Group(); m.add(t); box(t, .8, .8, .16, std(C.b800, { metal: .3 }), 0, 0, 0, .18); const pl = add(t, new THREE.PlaneGeometry(.7, .7), new THREE.MeshBasicMaterial({ map: glyph(d, cols[i]), toneMapped: false, color: 0xe0e8f8 }), 0, 0, .09); tiles.push(t); });
    return (t, a) => { ph.rotation.y = Math.sin(t * .6) * .45 - .15; ph.rotation.x = Math.sin(t * .5) * .05; ph.position.y = Math.sin(t * 1.2) * .12;
      tiles.forEach((tl, i) => { const ang = t * .55 + i / 6 * Math.PI * 2, rad = 2.7 + .5 * a; tl.position.set(Math.cos(ang) * rad, Math.sin(ang * 2 + i) * .9 + (i % 2 ? 1.1 : -1), Math.sin(ang) * rad * .8); tl.rotation.y = -ang * .3; tl.rotation.z = Math.sin(t + i) * .1; }); p.ring.rotation.z = t * .3; };
  });

  /* 03 — app management: cloud + packets, gauge, shield */
  mods.push((x0) => {
    const p = pedestal(x0, C.cyan), m = new THREE.Group(); m.position.set(x0, .5, -1); g.add(m);
    const cloud = new THREE.Group(); cloud.position.y = 6; m.add(cloud);
    [[0, 0, 0, 1.1], [1.1, -.2, .2, .8], [-1.1, -.15, -.1, .85], [.5, .55, 0, .75], [-.5, .5, .15, .7]].forEach(([x, y, z, r]) => ico(cloud, r, std(C.mist, { em: C.b400, ei: .45, rough: .3, flat: true }), x, y, z, 1));
    const baseSrv = [-1.4, 0, 1.4].map((x, i) => { const s = box(m, 1.1, 1.4 + i * .0, 1.1, std(C.b800, { metal: .5 }), x, .7, .6, .06); box(m, .9, .08, .06, emis(i === 1 ? C.green : C.cyan, 2.2), x, 1.0, 1.16); return s; });
    const beam = cyl(m, .5, 1.3, 4.1, fresnelMat({ rim: C.cyan, inner: C.blue, pow: 1.2, base: .05, op: .35, additive: true, side: THREE.DoubleSide }), 0, 3.5, .6, 24);
    const packets = []; for (let i = 0; i < 8; i++) packets.push(box(m, .18, .18, .18, emis(i % 2 ? 0xffffff : C.cyan, 2.4), 0, 0, .6));
    const gauge = new THREE.Group(); gauge.position.set(-3.6, 3, 1); gauge.rotation.y = .5; m.add(gauge);
    add(gauge, new THREE.TorusGeometry(1.2, .1, 8, 48, Math.PI * 1.5), std(C.b800, { metal: .4 })).rotation.z = -Math.PI * .25 - Math.PI * 1.5 / 1 * 0 + Math.PI * .5 * 0 - Math.PI * 1.25 + Math.PI * 1.25;
    const arc = add(gauge, new THREE.TorusGeometry(1.2, .12, 8, 48, Math.PI * 1.1), emis(C.cyan, 2.2)); arc.rotation.z = Math.PI * .9;
    const needle = box(gauge, .06, 1.0, .06, emis(0xffffff, 2.4), 0, .5, .05); needle.geometry.translate(0, .5, 0); needle.position.y = 0;
    sph(gauge, .12, emis(0xffffff, 2));
    const sh = new THREE.Mesh(new THREE.ExtrudeGeometry(shieldShape(.9, 1.1), { depth: .3, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 1, curveSegments: 10 }), std(C.blue, { metal: .5, rough: .3, em: C.blue, ei: .5 })); sh.position.set(3.7, 3.2, .8); m.add(sh);
    const check = polyline(sh, [V(-.4, 0, .45), V(-.1, -.3, .45), V(.45, .35, .45)], 0xffffff, 1); check.material.linewidth = 3;
    const hb = []; for (let i = 0; i <= 40; i++) hb.push(V(-2.6 + i * .13, 0, 0)); const hl = polyline(m, hb, C.cyan, .9); hl.position.set(0, 8.2, .6);
    return (t, a) => { cloud.position.y = 6 + Math.sin(t) * .2; cloud.rotation.y = t * .1; packets.forEach((pk, i) => { const u = (t * .5 + i / 8) % 1; const up = i % 2; const v = up ? u : 1 - u; pk.position.y = 1.5 + v * 3.6; pk.position.x = Math.sin(v * 9 + i) * (.2 + v * .35); pk.scale.setScalar(.8 + .3 * Math.sin(t * 6 + i)); });
      needle.rotation.z = -Math.PI * .35 + Math.sin(t * 1.3) * .5 + a * .3; sh.rotation.y = Math.sin(t * .8) * .6; sh.position.y = 3.2 + Math.sin(t * 1.3) * .12; arc.rotation.z = Math.PI * .9 - a * .15;
      const pos = hl.geometry.attributes.position; for (let i = 0; i <= 40; i++) { const x = -2.6 + i * .13; const ph = (x + t * 1.4) % 4; const y = Math.abs(ph - 2.0) < .2 ? Math.sin((ph - 1.8) * 16) * .9 : Math.sin(x * 3 + t) * .06; pos.setY(i, y); } pos.needsUpdate = true; p.ring.rotation.z = t * .3; };
  });

  /* 04 — digital solutions: automation / API graph */
  mods.push((x0) => {
    const p = pedestal(x0, C.cyan), m = new THREE.Group(); m.position.set(x0, 3.7, -1); g.add(m);
    const gearC = add(m, gearGeometry(1.15, 12, .5, .26), std(C.blue, { metal: .6, rough: .3, em: C.blue, ei: .55 }));
    const nodes = []; const geos = [() => new THREE.BoxGeometry(.9, .9, .9), () => new THREE.CylinderGeometry(.5, .5, .9, 8), () => new THREE.OctahedronGeometry(.65), () => new THREE.TorusGeometry(.45, .17, 8, 20), () => new THREE.IcosahedronGeometry(.6, 0)];
    geos.forEach((gf, i) => { const mm = add(m, gf(), std(i % 2 ? C.cyan : C.b700, { metal: .4, rough: .35, em: i % 2 ? C.cyan : C.blue, ei: .4 })); nodes.push({ mm, ang: i / 5 * Math.PI * 2 }); });
    const links = []; const lines = nodes.map(() => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(), V()]), lineMat(C.cyan, .7)); m.add(l); return l; });
    const pulses = nodes.map((n, i) => { const s = sph(m, .09, emis(0xffffff, 2.6), 0, 0, 0, 8, 6); return s; });
    return (t, a) => { gearC.rotation.z = t * .6; const rad = 2.5 + .7 * a;
      nodes.forEach((n, i) => { const ang = n.ang + t * .25; n.mm.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad * .75, Math.sin(t + i) * .4); n.mm.rotation.set(t * .6 + i, t * .4, 0);
        const pos = lines[i].geometry.attributes.position; pos.setXYZ(0, 0, 0, 0); pos.setXYZ(1, n.mm.position.x, n.mm.position.y, n.mm.position.z); pos.needsUpdate = true;
        const u = (t * .45 + i * .21) % 1; const f = i % 2 ? u : 1 - u; pulses[i].position.set(n.mm.position.x * f, n.mm.position.y * f, n.mm.position.z * f); });
      m.rotation.y = Math.sin(t * .4) * .25; p.ring.rotation.z = t * .3; };
  });

  /* 05 — websites: browser + parallax layers + cursor */
  mods.push((x0) => {
    const p = pedestal(x0, C.b400), m = new THREE.Group(); m.position.set(x0, 3.6, -1); g.add(m);
    const tex = reg(canvasTex(1280, 800, (x, W, H) => drawSite(x, W, H))).tex;
    const win = screenMesh(m, 4.6, 2.875, tex, { bezel: .1, depth: .14, edge: C.b400 }); win.scale.setScalar(1.2); 
    const layers = [[1.2, .7, .45, C.blue, -1.4, .9], [.9, .9, .9, C.cyan, 1.5, -.7], [1.5, .45, 1.35, 0xffffff, .2, -1.45]].map(([w, h, z, col, x, y]) => { const b = box(m, w, h, .1, std(col, { em: col, ei: col === 0xffffff ? .15 : .55, metal: .2 }), x, y, z, .08); b.userData = { x, y, z }; return b; });
    const phone = reg(canvasTex(560, 1160, (x, W, H) => drawApp(x, W, H, T))).tex; const mini = new THREE.Group(); mini.position.set(-2.9, -.9, .9); m.add(mini); box(mini, .9, 1.8, .1, std(C.navy), 0, 0, 0, .1); add(mini, new THREE.PlaneGeometry(.82, 1.7), new THREE.MeshBasicMaterial({ map: phone, color: 0xe8eefa, toneMapped: false }), 0, 0, .06);
    const cur = new THREE.Group(); m.add(cur); const cone = add(cur, new THREE.ConeGeometry(.2, .5, 3), emis(0xffffff, 2)); cone.rotation.z = Math.PI * .85 + .35; cone.position.set(.12, -.2, 0);
    return (t, a) => { win.rotation.y = Math.sin(t * .5) * .22 + .1; win.rotation.x = Math.sin(t * .4) * .03; layers.forEach((l, i) => { l.position.set(l.userData.x, l.userData.y + Math.sin(t * 1.1 + i) * .1, l.userData.z * (.7 + .6 * a) + .15); l.rotation.y = win.rotation.y; });
      mini.rotation.y = win.rotation.y + .25; mini.position.y = -.9 + Math.sin(t * 1.3) * .08; const u = (t * .35) % 1; cur.position.set(lerp(-.6, 1.5, easeInOut(u)), lerp(.1, -.9, easeInOut(u)) + .2, .8 + .3 * Math.sin(u * 3.14)); cur.scale.setScalar(1 - .2 * (u > .9 ? 1 : 0)); p.ring.rotation.z = t * .3; };
  });

  /* 06 — Salla store: bag + plugins docking + coins */
  mods.push((x0) => {
    const p = pedestal(x0, C.b400), m = new THREE.Group(); m.position.set(x0, .5, -1); g.add(m);
    const bag = new THREE.Group(); bag.position.y = 2.1; bag.scale.setScalar(1.3); m.add(bag);
    const body = add(bag, new THREE.CylinderGeometry(1.35, 1.6, 2.5, 4, 1), std(C.blue, { metal: .25, rough: .4, em: C.blue, ei: .25 })); body.rotation.y = Math.PI / 4; body.scale.z = .62;
    add(bag, new THREE.CylinderGeometry(1.36, 1.36, .12, 4, 1), std(C.b800, { metal: .3 }), 0, 1.0, 0).rotation.y = Math.PI / 4;
    const h1 = add(bag, new THREE.TorusGeometry(.62, .08, 8, 28, Math.PI), std(C.mist, { metal: .5 }), 0, 1.3, .0); const h2 = h1.clone(); bag.add(h2); h2.rotation.y = Math.PI * .5; h2.scale.x = 0.01;
    const emb = add(bag, new THREE.TorusGeometry(.5, .08, 8, 32), emis(C.cyan, 2.2), 0, -.15, 1.0); sph(bag, .18, emis(0xffffff, 2.2), 0, -.15, 1.04, 10, 8);
    const plugs = []; for (let i = 0; i < 4; i++) { const pg = new THREE.Group(); m.add(pg); box(pg, .8, .8, .8, std(i % 2 ? C.cyan : C.b400, { em: i % 2 ? C.cyan : C.blue, ei: .5, metal: .2 }), 0, 0, 0, .1); sph(pg, .2, std(i % 2 ? C.cyan : C.b400, { em: C.blue, ei: .4 }), .5, 0, 0, 10, 8); plugs.push(pg); }
    const coins = []; for (let i = 0; i < 6; i++) { const c = cyl(m, .35, .35, .08, std(i % 2 ? C.cyan : C.mist, { metal: .8, rough: .25, em: C.cyan, ei: .35 }), 0, 0, 0, 16); c.rotation.x = Math.PI / 2; coins.push(c); }
    const price = reg(canvasTex(256, 96, (x, W, H) => { x.fillStyle = 'rgba(6,15,36,.8)'; rr(x, 2, 2, W - 4, H - 4, 48); x.fill(); x.strokeStyle = CYANS; x.lineWidth = 4; x.stroke(); txt2(x, T('mock.p1price', '349 ر.س'), W / 2, H / 2 + 2); }));
    function txt2(x, s, px, py) { x.font = `700 40px ${FONTS}`; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'rtl'; x.fillText(s, px, py); }
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: price.tex, transparent: true, depthWrite: false })); tag.scale.set(2.2, .82, 1); tag.position.set(2.6, 5.2, 1); m.add(tag);
    return (t, a) => { bag.rotation.y = Math.sin(t * .5) * .5; bag.position.y = 2.1 + Math.sin(t * 1.1) * .12;
      plugs.forEach((pg, i) => { const u = (t * .22 + i / 4) % 1; const dock = smooth(.55, .8, u) * (1 - smooth(.85, 1, u)); const ang = i / 4 * Math.PI * 2 + t * .4; const orbit = V(Math.cos(ang) * 3.3, 3.2 + Math.sin(ang * 2) * .8, Math.sin(ang) * 2.4), target = V(Math.cos(bag.rotation.y + i * 1.57) * 1.1, 2.4, Math.sin(bag.rotation.y + i * 1.57) * .9 + .4);
        pg.position.copy(orbit).lerp(target, dock * .85); pg.rotation.set(t + i, t * .7, 0); pg.scale.setScalar(1 - .35 * dock); });
      coins.forEach((c, i) => { const ang = -t * .6 + i / 6 * Math.PI * 2; c.position.set(Math.cos(ang) * 4.1, 1.6 + (i % 3) * .9 + Math.sin(t * 2 + i) * .15, Math.sin(ang) * 3.2); c.rotation.z = t * 2 + i; });
      tag.position.y = 5.2 + Math.sin(t * 1.5) * .15; p.ring.rotation.z = t * .3; };
  });

  /* 07 — custom themes: fanned theme panels + colour wheel + brush */
  mods.push((x0) => {
    const p = pedestal(x0, C.b400), m = new THREE.Group(); m.position.set(x0, 3.4, -1); g.add(m);
    const pals = [{ bg: '#F4F7FC', a: '#2D63FC', b: '#E2E9FF', c: '#1FC8F6' }, { bg: '#0A1B3D', a: '#1FC8F6', b: '#183889', c: '#2D63FC' }, { bg: '#EAF9FF', a: '#1F46B0', b: '#C5F0FF', c: '#628AFD' }, { bg: '#122B67', a: '#96B1FE', b: '#2655D6', c: '#1FC8F6' }, { bg: '#FFFFFF', a: '#0A1B3D', b: '#DCE3EF', c: '#2D63FC' }];
    const panels = pals.map((pl, i) => { const tex = canvasTex(640, 640, (x, W, H) => drawTheme(x, W, H, pl)).tex; const grp = new THREE.Group(); m.add(grp); box(grp, 2.5, 2.5, .08, std(C.navy), 0, 0, 0, .12); add(grp, new THREE.PlaneGeometry(2.38, 2.38), new THREE.MeshBasicMaterial({ map: tex, color: 0xe0e8f8, toneMapped: false }), 0, 0, .05); grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.54, 2.54, .12)), lineMat(C.cyan, .5))); return grp; });
    const wheel = new THREE.Group(); wheel.position.set(-3.6, -1, 1.2); wheel.rotation.x = -.5; m.add(wheel); const wc = [C.cyan, 0x6ee0ff, C.b300, C.b400, C.blue, C.b600, C.b700, C.b800, 0x2b5fd0, 0x4aa8ff, 0x7fdcff, 0xa5eaff];
    wc.forEach((c, i) => { const s = add(wheel, new THREE.CylinderGeometry(1.2, 1.2, .16, 3, 1, false, i / 12 * Math.PI * 2, Math.PI * 2 / 12), std(c, { em: c, ei: .35, metal: .2 })); s.geometry.rotateX(Math.PI / 2); });
    wheel.children.forEach((c) => c.geometry.dispose && 0);
    const pen = new THREE.Group(); m.add(pen); cyl(pen, .13, .13, 1.7, std(C.mist, { metal: .5 }), 0, .85, 0, 8); add(pen, new THREE.ConeGeometry(.13, .4, 8), emis(C.cyan, 2.2), 0, -.2, 0).rotation.x = Math.PI; 
    const trail = []; for (let i = 0; i <= 30; i++) trail.push(V()); const tl = polyline(m, trail, C.cyan, .9);
    return (t, a) => { panels.forEach((pn, i) => { const f = i - 2; const ang = f * (.32 + .2 * a) + Math.sin(t * .6) * .06; pn.position.set(Math.sin(ang) * 3.7 * (1 + .2 * a), Math.sin(t * 1.2 + i) * .1, -Math.abs(f) * .35 + Math.cos(ang) * .2); pn.rotation.y = -ang * 1.2; pn.rotation.z = f * -.03; });
      wheel.rotation.z = t * .3; wheel.position.y = -1.2 + Math.sin(t * 1.4) * .1; const u = t * 1.2; const px = Math.sin(u) * 2.2 + 3.2, py = Math.cos(u * 1.3) * 1.1 - 2.2; pen.position.set(px, py + .4, 1.6); pen.rotation.z = .5 + Math.sin(u) * .12;
      const pos = tl.geometry.attributes.position; for (let i = 0; i <= 30; i++) { const uu = u - i * .06; pos.setXYZ(i, Math.sin(uu) * 2.2 + 3.2, Math.cos(uu * 1.3) * 1.1 - 2.2, 1.6); } pos.needsUpdate = true; p.ring.rotation.z = t * .3; };
  });

  const updaters = MX.map((x, i) => mods[i](x));
  const sp = sparkles(Math.round(420 * q), { spread: [150, 30, 50], center: [-45, 6, 0], color: C.cyan, color2: C.b400, size: .14, seed: 5 }); g.add(sp);

  const cam = [{ p: [21, 8.5, 25], t: [-28, 2.2, -2] }];
  MX.forEach((x, i) => cam.push({ p: [x + 3.0, 4.0, 11.0], t: [x - .5, 3.3, -1] }));
  return { group: g, cam, update(t, k) {
    updaters.forEach((u, i) => { const a = 1 - clamp(Math.abs(k - (i + 1)) / .9); u(t, a * a * (3 - 2 * a)); });
    gates.forEach((gt, i) => { gt.children[gt.children.length - 1].material.opacity = .2 + .08 * Math.sin(t * 2 + i); });
  } };
}
