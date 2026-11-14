/* Scene 3 — ماذا نبني: a holo showroom — floating dashboard, phone and store screens with 3D data props. */
import { THREE, C, clamp, lerp, smooth, easeInOut, V, std, glow, emis, add, box, cyl, sph, ico, torus, circleLine, lineMat, fresnelMat, labelSprite, glowSprite, sparkles, canvasTex, screenMesh, platform, rr, FONTS } from './util.js';
import { drawDashboard, drawPhone, drawStore } from './mocks.js';

export default function build(ctx) {
  const g = new THREE.Group(); const q = ctx.q; const T = (k, ar) => ctx.t(k, ar);
  const redraws = []; const reg = (o) => { redraws.push(o); return o; };
  ctx.onLang(() => { redraws.forEach((o) => o.redraw()); texts.forEach((f) => f()); });
  document.fonts && document.fonts.ready.then(() => { redraws.forEach((o) => o.redraw()); texts.forEach((f) => f()); });
  const texts = [];

  const pf = platform(g, 22, { y: -.1, h: .8, seg: 64, color: C.ink }); 
  for (const r of [14, 8]) { const t = add(g, new THREE.TorusGeometry(r, .04, 6, 96), emis(C.blue, 1.6, { op: .8 })); t.rotation.x = Math.PI / 2; t.position.y = .05; }

  /* ---- dashboard (right) ---- */
  const dash = new THREE.Group(); dash.position.set(10, 0, -2); dash.rotation.y = -.45; g.add(dash);
  const dtex = reg(canvasTex(1280, 800, (x, W, H) => drawDashboard(x, W, H, T)));
  const dscreen = screenMesh(dash, 8.8, 5.5, dtex.tex, { bezel: .16, depth: .2, r: .14 }); dscreen.position.y = 5.2;
  cyl(dash, .22, .5, 1.8, std(C.b800, { metal: .6 }), 0, 1.1, -.2, 12); cyl(dash, 1.8, 2.2, .3, std(C.b800, { metal: .6 }), 0, .15, -.2, 6);
  const bars = []; const barG = new THREE.Group(); barG.position.set(0, .3, 5.2); dash.add(barG);
  for (let i = 0; i < 12; i++) { const b = box(barG, .46, 1, .46, std(i === 11 ? C.cyan : C.blue, { em: i === 11 ? C.cyan : C.blue, ei: .6, metal: .3 }), -3.1 + i * .56, .5, 0, .05); bars.push(b); }
  box(barG, 7.2, .08, 1.0, emis(C.cyan, 1.4, { op: .6 }), 0, 0, 0);
  const donut = new THREE.Group(); donut.position.set(5.2, 6.5, 2.4); dash.add(donut);
  [[.0, .62, C.cyan], [.62, .27, C.blue], [.89, .11, C.b300]].forEach(([s, l, c]) => { const m = add(donut, new THREE.TorusGeometry(1.1, .24, 8, 40, l * Math.PI * 2), std(c, { em: c, ei: .7, metal: .2 })); m.rotation.z = s * Math.PI * 2; });
  const kp = (txt, x, y, z, key) => { const L = labelSprite(txt, { size: 54, height: .8, bg: 'rgba(6,15,36,.72)', border: 'rgba(31,200,246,.7)', color: '#e9f9ff', dir: 'ltr' }); L.sprite.position.set(x, y, z); dash.add(L.sprite); return L; };
  const k1 = kp('+12%', -5.4, 8.6, 1.4), k2 = kp('94%', 5.8, 3.4, 2.2), k3 = kp('1,284', -5.6, 3.0, 2);

  /* ---- phone (centre) ---- */
  const ph = new THREE.Group(); ph.position.set(0, 0, -4.5); g.add(ph);
  cyl(ph, 2.6, 2.9, .35, std(C.b800, { metal: .6 }), 0, .17, 0, 6);
  const ring1 = add(ph, new THREE.TorusGeometry(2.5, .04, 6, 6), emis(C.cyan, 2.2)); ring1.rotation.x = Math.PI / 2; ring1.position.y = .38; ring1.rotation.z = Math.PI / 6;
  const phone = new THREE.Group(); phone.position.y = 4.6; ph.add(phone);
  const ptex = reg(canvasTex(560, 1160, (x, W, H) => drawPhone(x, W, H, T)));
  box(phone, 2.46, 4.9, .26, std(C.navy, { metal: .6, rough: .28 }), 0, 0, 0, .24);
  add(phone, new THREE.PlaneGeometry(2.24, 4.64), new THREE.MeshBasicMaterial({ map: ptex.tex, color: 0xe8eefa, toneMapped: false }), 0, 0, .14);
  phone.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.5, 4.94, .3)), lineMat(C.cyan, .65)));
  box(phone, .6, .1, .04, std(0x000000), 0, 2.28, .15, .04);
  const notes = [];
  [['mock.onTheWay', 'في الطريق إليك', '#1FC8F6'], ['mock.delivered', 'تم التسليم', '#12B76A'], ['mock.welcome', 'مرحباً بك', '#628AFD']].forEach(([k, ar, col], i) => {
    const o = reg(canvasTex(512, 160, (x, W, H) => { x.fillStyle = 'rgba(8,20,48,.86)'; rr(x, 3, 3, W - 6, H - 6, 40); x.fill(); x.strokeStyle = col; x.lineWidth = 4; x.stroke(); x.fillStyle = col; x.beginPath(); x.arc(W - 70, H / 2, 28, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(W - 70, H / 2, 10, 0, 7); x.fill(); x.font = `700 38px ${FONTS}`; x.fillStyle = '#fff'; x.textAlign = 'right'; x.direction = 'rtl'; x.textBaseline = 'middle'; x.fillText(T(k, ar), W - 120, H / 2 + 2); }));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: o.tex, transparent: true, depthWrite: false })); s.scale.set(3.2, 1, 1); ph.add(s); notes.push({ s, i }); });
  const pin = new THREE.Group(); pin.position.set(3.6, 1.3, 1.5); ph.add(pin); add(pin, new THREE.ConeGeometry(.35, .9, 12), emis(C.cyan, 2), 0, .45, 0).rotation.x = Math.PI; sph(pin, .35, emis(C.cyan, 2), 0, 1.0, 0, 14, 10); sph(pin, .14, std(C.white, { em: 0xffffff, ei: 1 }), 0, 1.0, .3, 8, 6);
  const pinRing = add(pin, new THREE.RingGeometry(.4, .5, 32), glow(C.cyan, .7, THREE.DoubleSide)); pinRing.rotation.x = -Math.PI / 2; pinRing.position.y = .02;

  /* ---- store (left) ---- */
  const st = new THREE.Group(); st.position.set(-10, 0, -2); st.rotation.y = .45; g.add(st);
  const stex = reg(canvasTex(1280, 800, (x, W, H) => drawStore(x, W, H, T)));
  const sscreen = screenMesh(st, 8.8, 5.5, stex.tex, { bezel: .16, depth: .2, r: .14, edge: C.b400 }); sscreen.position.y = 5.2;
  cyl(st, .22, .5, 1.8, std(C.b800, { metal: .6 }), 0, 1.1, -.2, 12); cyl(st, 1.8, 2.2, .3, std(C.b800, { metal: .6 }), 0, .15, -.2, 6);
  const prods = []; const mkProd = (kind, x, key, ar) => {
    const gr = new THREE.Group(); gr.position.set(x, 0, 5.3); st.add(gr);
    cyl(gr, .85, 1, .4, std(C.b800, { metal: .5 }), 0, .2, 0, 20); const ring = add(gr, new THREE.TorusGeometry(.9, .03, 6, 24), emis(C.cyan, 2.2)); ring.rotation.x = Math.PI / 2; ring.position.y = .42;
    const it = new THREE.Group(); it.position.y = 1.6; gr.add(it); const bm = std(C.blue, { em: C.blue, ei: .35, metal: .3 }), cm = std(C.cyan, { em: C.cyan, ei: .45, metal: .3 }), wm = std(C.mist, { metal: .4 });
    if (kind === 0) { torus(it, .5, .11, bm, 0, 0, 0, 24); box(it, .62, .62, .12, cm, 0, 0, 0, .1); box(it, .06, .22, .05, wm, 0, .08, .08); cyl(it, .17, .17, .5, bm, 0, .8, 0, 8); cyl(it, .17, .17, .5, bm, 0, -.8, 0, 8); }
    if (kind === 1) { sph(it, .32, wm, -.4, 0, 0, 12, 9); sph(it, .32, wm, .4, 0, 0, 12, 9); box(it, .08, .5, .08, cm, -.4, -.5, 0); box(it, .08, .5, .08, cm, .4, -.5, 0); torus(it, .62, .05, bm, 0, .05, 0, 24); }
    if (kind === 2) { box(it, 1.1, 1.2, .55, bm, 0, -.1, 0, .08); const hd = add(it, new THREE.TorusGeometry(.32, .06, 6, 16, Math.PI), cm, 0, .55, 0); box(it, .35, .12, .06, cm, 0, -.1, .3); }
    if (kind === 3) { cyl(it, .32, .3, 1.2, bm, 0, 0, 0, 14); cyl(it, .33, .33, .22, cm, 0, .72, 0, 14); cyl(it, .31, .31, .06, wm, 0, -.2, 0, 14); }
    const tg = labelSprite(T(key, ar), { size: 44, height: .5, bg: 'rgba(6,15,36,.7)', border: 'rgba(31,200,246,.6)', color: '#e9f9ff' }); tg.sprite.position.set(0, 3.2, 0); gr.add(tg.sprite); texts.push(() => tg.set(T(key, ar)));
    prods.push({ it, gr }); };
  mkProd(0, -2.9, 'mock.p1price', '349 ر.س'); mkProd(1, -1, 'mock.p2price', '199 ر.س'); mkProd(2, 1, 'mock.p3price', '279 ر.س'); mkProd(3, 2.9, 'mock.p4price', '89 ر.س');

  const sp = sparkles(Math.round(380 * q), { spread: [60, 22, 40], center: [0, 7, -2], color: C.cyan, color2: C.b400, size: .15, seed: 8 }); g.add(sp);

  const cam = [
    { p: [0, 8, 22], t: [0, 4, -3] },
    { p: [14.2, 5.6, 11], t: [9.0, 4.6, -1] },
    { p: [1.2, 5.4, 3.6], t: [-.4, 4.7, -4.5] },
    { p: [-14.2, 5.6, 11], t: [-9.0, 4.6, -1] },
  ];
  return { group: g, cam, update(t, k) {
    const a1 = smooth(0, 1, k) * (1 - smooth(1.2, 2, k)) + smooth(-.5, 0, k) * .0;
    bars.forEach((b, i) => { const base = .6 + (Math.sin(i * 1.7) * .5 + .5) * 2.4; const h = Math.max(.05, base * (.35 + .65 * smooth(.2, 1.2, k)) * (1 + .12 * Math.sin(t * 1.6 + i))); b.scale.y = h; b.position.y = h / 2; });
    donut.rotation.y = t * .5; donut.rotation.x = Math.sin(t * .4) * .3; donut.position.y = 6.5 + Math.sin(t) * .15;
    [k1, k2, k3].forEach((l, i) => { l.sprite.position.y += Math.sin(t * 1.4 + i) * .004; });
    dscreen.rotation.y = Math.sin(t * .5) * .05;
    phone.rotation.y = Math.sin(t * .6) * .35; phone.position.y = 4.6 + Math.sin(t * 1.2) * .15;
    notes.forEach(({ s, i }) => { const ang = t * .5 + i * 2.1, rad = 4.3; s.position.set(Math.cos(ang) * rad, 4.6 + Math.sin(t * 1.1 + i) * .35 + (i - 1) * 1.15, Math.sin(ang) * 1.4 - .5); s.material.opacity = .55 + .45 * smooth(1.2, 2, k) * (1 - smooth(2.5, 3, k)) + .0; });
    const u = (t * .8) % 2; pinRing.scale.setScalar(.7 + u * 2); pinRing.material.opacity = (1 - u / 2) * .8; pin.position.y = 1.3 + Math.sin(t * 2) * .1;
    ring1.rotation.z = t * .3;
    prods.forEach((p, i) => { p.it.rotation.y = t * .8 + i; p.it.position.y = 1.6 + Math.sin(t * 1.4 + i) * .12; });
    sscreen.rotation.y = Math.sin(t * .5 + 1) * .05;
  } };
}
