/* Canvas-drawn UI mockups used as textures on the 3D screens (original Arabic mock copy, EN via DP_I18N). */
import { FONTS, rr } from './util.js';
const NAVY = '#0A1B3D', BLUE = '#2D63FC', CYAN = '#1FC8F6', INK = '#2C3A58', SLATE = '#64708A', LINE = '#E3E8F1', CLOUD = '#F4F7FC';

function txt(x, s, px, py, o = {}) {
  x.font = `${o.w || 600} ${o.s || 22}px ${FONTS}`; x.fillStyle = o.c || NAVY; x.textAlign = o.a || 'right'; x.direction = o.d || 'rtl'; x.textBaseline = o.b || 'middle';
  x.fillText(s, px, py);
}
function grad(x, x0, y0, x1, y1, a, b) { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function chrome(x, W, H, url) {
  x.fillStyle = '#fff'; rr(x, 0, 0, W, H, 28); x.fill();
  x.fillStyle = '#EEF2F9'; x.fillRect(0, 0, W, 64);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(W - 40 - i * 30, 32, 9, 0, 7); x.fill(); });
  x.fillStyle = '#fff'; rr(x, W / 2 - 200, 14, 400, 36, 18); x.fill();
  txt(x, url, W / 2, 33, { s: 18, c: SLATE, a: 'center', d: 'ltr', w: 500 });
}

export function drawDashboard(x, W, H, T) {
  chrome(x, W, H, 'digital-pass.co / ' + T('mock.urlDash', 'لوحة التحكم'));
  const top = 64;
  // sidebar (right in RTL)
  x.fillStyle = NAVY; x.fillRect(W - 250, top, 250, H - top);
  const items = [['mock.home', 'الرئيسية'], ['mock.orders', 'الطلبات'], ['mock.inventory', 'المخزون'], ['mock.customers', 'العملاء'], ['mock.reports', 'التقارير'], ['mock.settings', 'الإعدادات']];
  items.forEach(([k, ar], i) => { const y = top + 60 + i * 62;
    if (i === 1) { x.fillStyle = 'rgba(45,99,252,.9)'; rr(x, W - 236, y - 24, 222, 48, 14); x.fill(); }
    x.fillStyle = i === 1 ? '#fff' : 'rgba(255,255,255,.35)'; rr(x, W - 62, y - 10, 20, 20, 5); x.fill();
    txt(x, T(k, ar), W - 78, y, { s: 21, c: i === 1 ? '#fff' : 'rgba(255,255,255,.7)', w: 500 }); });
  // main
  x.fillStyle = CLOUD; x.fillRect(0, top, W - 250, H - top);
  const R = W - 250 - 36;
  txt(x, T('mock.overview', 'نظرة عامة'), R, top + 44, { s: 32, w: 700 });
  x.fillStyle = 'rgba(45,99,252,.12)'; rr(x, 36, top + 22, 150, 40, 20); x.fill(); txt(x, T('mock.thisMonth', 'هذا الشهر'), 111, top + 43, { s: 19, c: BLUE, a: 'center' });
  const kp = [[T('mock.orders', 'الطلبات'), '1,284', '+12%', BLUE], [T('mock.completion', 'نسبة الإنجاز'), '94%', '+3%', CYAN], [T('mock.active', 'العملاء النشطون'), '3,420', '+8%', '#12B76A']];
  const cw = 230, gap = 24;
  kp.forEach(([l, v, d, col], i) => { const cx = R - cw - i * (cw + gap);
    x.fillStyle = '#fff'; rr(x, cx, top + 100, cw, 130, 20); x.fill(); x.strokeStyle = LINE; x.lineWidth = 2; x.stroke();
    x.fillStyle = col; rr(x, cx + cw - 20 - 8, top + 118, 8, 30, 4); x.fill();
    txt(x, l, cx + cw - 40, top + 134, { s: 18, c: SLATE, w: 500 }); txt(x, v, cx + cw - 22, top + 186, { s: 44, w: 700, a: 'right', d: 'ltr' });
    txt(x, d, cx + 22, top + 188, { s: 19, c: '#12B76A', a: 'left', d: 'ltr' }); });
  // chart
  const chx = 36, chw = 520, chy = top + 258, chh = 180;
  x.fillStyle = '#fff'; rr(x, chx, chy, chw, chh + 56, 20); x.fill(); x.strokeStyle = LINE; x.stroke();
  txt(x, T('mock.weekly', 'الطلبات الأسبوعية'), chx + chw - 22, chy + 28, { s: 19, w: 700 }); txt(x, T('mock.weeks', '12 أسبوعاً'), chx + 22, chy + 28, { s: 16, c: SLATE, a: 'left' });
  const bars = [.4, .55, .45, .7, .6, .85, .5, .75, .65, .9, .7, 1];
  bars.forEach((b, i) => { const bw = 28, bx = chx + 28 + i * 40, bh = b * (chh - 60); x.fillStyle = grad(x, 0, chy + chh - bh, 0, chy + chh, i === 11 ? CYAN : '#9db8ff', BLUE); rr(x, bx, chy + chh + 12 - bh, bw, bh, 8); x.fill(); });
  // table
  const tx = 36 + chw + 24, tw = R - tx + 0 - 0; const tw2 = (W - 250 - 36) - tx;
  x.fillStyle = '#fff'; rr(x, tx, chy, tw2, chh + 56, 20); x.fill(); x.strokeStyle = LINE; x.stroke();
  const rows = [[T('mock.order', 'الطلب'), T('mock.customer', 'العميل'), T('mock.status', 'الحالة'), 1], ['#2048', T('mock.client1', 'شركة الأفق'), T('mock.done', 'مكتمل'), '#12B76A'], ['#2047', T('mock.client2', 'مؤسسة البناء'), T('mock.running', 'قيد التنفيذ'), BLUE], ['#2046', T('mock.client3', 'متجر الريم'), T('mock.review', 'بانتظار المراجعة'), '#F5A524']];
  rows.forEach((r, i) => { const y = chy + 34 + i * 54;
    if (i === 0) { txt(x, r[0], tx + tw2 - 22, y, { s: 15, c: SLATE }); txt(x, r[1], tx + tw2 - 110, y, { s: 15, c: SLATE }); txt(x, r[2], tx + 100, y, { s: 15, c: SLATE, a: 'center' }); }
    else { txt(x, r[0], tx + tw2 - 22, y + 10, { s: 17, d: 'ltr', w: 700 }); txt(x, r[1], tx + tw2 - 110, y + 10, { s: 17, w: 500 });
      x.fillStyle = r[3] + '22'; rr(x, tx + 20, y - 8, 160, 38, 19); x.fill(); txt(x, r[2], tx + 100, y + 11, { s: 15, c: r[3], a: 'center', w: 700 }); } });
}

export function drawPhone(x, W, H, T) {
  x.fillStyle = '#fff'; rr(x, 0, 0, W, H, 70); x.fill();
  x.fillStyle = grad(x, 0, 0, W, 360, BLUE, CYAN); x.fillRect(0, 0, W, 330);
  txt(x, '9:41', 70, 52, { s: 24, c: '#fff', a: 'left', d: 'ltr', w: 700 });
  x.fillStyle = '#fff'; x.fillRect(W - 120, 40, 44, 22); x.fillRect(W - 66, 36, 8, 30);
  txt(x, T('mock.welcome', 'مرحباً بك'), W - 48, 130, { s: 46, c: '#fff', w: 700 });
  txt(x, T('mock.myOrders', 'طلباتي'), W - 48, 188, { s: 28, c: 'rgba(255,255,255,.85)', w: 500 });
  // active order card
  x.fillStyle = '#fff'; x.shadowColor = 'rgba(10,27,61,.25)'; x.shadowBlur = 30; x.shadowOffsetY = 12; rr(x, 36, 240, W - 72, 250, 36); x.fill(); x.shadowBlur = 0; x.shadowOffsetY = 0;
  txt(x, T('mock.order2048', 'الطلب ‎#2048'), W - 70, 292, { s: 30, w: 700 });
  txt(x, T('mock.onTheWay', 'في الطريق إليك'), W - 70, 340, { s: 26, c: BLUE, w: 700 });
  x.fillStyle = '#E2E9FF'; rr(x, 70, 384, W - 140, 16, 8); x.fill(); x.fillStyle = grad(x, W - 70, 0, W / 2, 0, BLUE, CYAN); rr(x, W / 2 - 10, 384, W / 2 - 60, 16, 8); x.fill();
  x.fillStyle = '#fff'; x.strokeStyle = BLUE; x.lineWidth = 6; x.beginPath(); x.arc(W / 2 - 10, 392, 14, 0, 7); x.fill(); x.stroke();
  txt(x, T('mock.eta', 'الوصول المتوقع: اليوم ٤:٣٠ م'), W - 70, 448, { s: 22, c: SLATE, w: 500 });
  txt(x, T('mock.recent', 'آخر الطلبات'), W - 48, 560, { s: 28, w: 700 });
  const rows = [[T('mock.o2047', 'طلب ‎#2047'), T('mock.delivered', 'تم التسليم'), T('mock.sar240', '240 ر.س'), '#12B76A'], [T('mock.o2046', 'طلب ‎#2046'), T('mock.delivered', 'تم التسليم'), T('mock.sar85', '85 ر.س'), '#12B76A'], [T('mock.o2045', 'طلب ‎#2045'), T('mock.cancelled', 'ملغي'), T('mock.sar120', '120 ر.س'), '#F04438']];
  rows.forEach((r, i) => { const y = 620 + i * 128;
    x.fillStyle = CLOUD; rr(x, 36, y, W - 72, 108, 28); x.fill();
    x.fillStyle = r[3] + '22'; rr(x, W - 36 - 80, y + 18, 72, 72, 22); x.fill(); x.fillStyle = r[3]; x.beginPath(); x.arc(W - 36 - 44, y + 54, 14, 0, 7); x.fill();
    txt(x, r[0], W - 140, y + 38, { s: 26, w: 700 }); txt(x, r[1], W - 140, y + 76, { s: 21, c: r[3], w: 600 });
    txt(x, r[2], 70, y + 54, { s: 24, a: 'left', w: 700 }); });
  x.fillStyle = '#fff'; x.fillRect(0, H - 130, W, 130); x.fillStyle = LINE; x.fillRect(0, H - 130, W, 2);
  [0, 1, 2, 3].forEach((i) => { x.fillStyle = i === 0 ? BLUE : '#C9D3E6'; rr(x, 70 + i * ((W - 140) / 3.4), H - 90, 46, 46, 14); x.fill(); });
  x.fillStyle = NAVY; rr(x, W / 2 - 90, H - 24, 180, 8, 4); x.fill();
}

export function drawStore(x, W, H, T) {
  chrome(x, W, H, T('mock.urlStore', 'المتجر') + '.digital-pass.co');
  const top = 64; x.fillStyle = '#fff'; x.fillRect(0, top, W, H - top);
  // nav
  txt(x, T('mock.yourStore', 'متجرك'), W - 50, top + 44, { s: 30, w: 700, c: BLUE });
  [['mock.home', 'الرئيسية'], ['mock.products', 'المنتجات'], ['mock.offers', 'العروض']].forEach(([k, ar], i) => txt(x, T(k, ar), W - 220 - i * 130, top + 44, { s: 20, c: INK, w: 500 }));
  x.fillStyle = NAVY; rr(x, 40, top + 22, 150, 44, 22); x.fill(); txt(x, T('mock.cart', 'السلة · 2'), 115, top + 45, { s: 19, c: '#fff', a: 'center' });
  // hero
  x.fillStyle = grad(x, 0, top + 100, W, top + 400, NAVY, '#183889'); rr(x, 40, top + 100, W - 80, 290, 30); x.fill();
  x.fillStyle = grad(x, 0, 0, 0, 0, CYAN, BLUE); x.globalAlpha = .55; x.beginPath(); x.arc(220, top + 250, 150, 0, 7); x.fill(); x.globalAlpha = .3; x.beginPath(); x.arc(330, top + 330, 110, 0, 7); x.fill(); x.globalAlpha = 1;
  x.fillStyle = 'rgba(255,255,255,.14)'; rr(x, W - 260, top + 130, 190, 38, 19); x.fill(); txt(x, T('mock.newCollection', 'مجموعة جديدة'), W - 165, top + 150, { s: 19, c: '#9fe6ff', a: 'center' });
  const hl = T('mock.shopEasy', 'تسوّق بسهولة<br>من أي جهاز').replace(/<br\s*\/?>/g, '|').split('|');
  hl.forEach((l, i) => txt(x, l.trim(), W - 70, top + 220 + i * 62, { s: 52, c: '#fff', w: 700 }));
  x.fillStyle = '#fff'; rr(x, W - 270, top + 320, 200, 50, 25); x.fill(); txt(x, T('mock.shopNow', 'تسوّق الآن'), W - 170, top + 346, { s: 21, c: NAVY, a: 'center', w: 700 });
  // products
  const P = [['mock.p1', 'ساعة ذكية', 'mock.p1price', '349 ر.س'], ['mock.p2', 'سماعات لاسلكية', 'mock.p2price', '199 ر.س'], ['mock.p3', 'حقيبة جلدية', 'mock.p3price', '279 ر.س'], ['mock.p4', 'قارورة حرارية', 'mock.p4price', '89 ر.س']];
  const pw = (W - 80 - 3 * 24) / 4;
  P.forEach((p, i) => { const px = W - 40 - pw - i * (pw + 24), py = top + 420;
    x.fillStyle = CLOUD; rr(x, px, py, pw, 220, 22); x.fill();
    x.fillStyle = ['#C0D0FE', '#A5EAFF', '#96B1FE', '#DCE3EF'][i]; rr(x, px + 20, py + 18, pw - 40, 110, 16); x.fill();
    x.fillStyle = [BLUE, CYAN, NAVY, BLUE][i]; x.beginPath(); x.arc(px + pw / 2, py + 73, 30, 0, 7); x.fill();
    txt(x, T(p[0], p[1]), px + pw - 22, py + 160, { s: 19, w: 600 }); txt(x, T(p[2], p[3]), px + pw - 22, py + 194, { s: 20, c: BLUE, w: 700 }); });
}

/* a generic marketing site (used by the "websites" service module) */
export function drawSite(x, W, H) {
  chrome(x, W, H, 'your-company.com');
  const top = 64; x.fillStyle = '#fff'; x.fillRect(0, top, W, H - top);
  x.fillStyle = BLUE; rr(x, W - 150, top + 26, 100, 30, 8); x.fill();
  [0, 1, 2, 3].forEach((i) => { x.fillStyle = '#C9D3E6'; rr(x, 70 + i * 90, top + 34, 60, 14, 7); x.fill(); });
  x.fillStyle = grad(x, 0, top + 90, W, top + 380, '#E2E9FF', '#F2F6FF'); rr(x, 40, top + 90, W - 80, 300, 28); x.fill();
  x.fillStyle = NAVY; rr(x, W - 480, top + 140, 400, 34, 10); x.fill(); rr(x, W - 400, top + 190, 320, 34, 10); x.fill();
  x.fillStyle = '#9fb3d9'; rr(x, W - 460, top + 250, 380, 14, 7); x.fill(); rr(x, W - 420, top + 276, 340, 14, 7); x.fill();
  x.fillStyle = BLUE; rr(x, W - 260, top + 320, 180, 46, 23); x.fill();
  x.fillStyle = grad(x, 100, 0, 500, 0, CYAN, BLUE); x.beginPath(); x.arc(250, top + 240, 110, 0, 7); x.fill();
  const cw = (W - 80 - 48) / 3;
  [0, 1, 2].forEach((i) => { const cx = W - 40 - cw - i * (cw + 24); x.fillStyle = CLOUD; rr(x, cx, top + 420, cw, 150, 20); x.fill(); x.fillStyle = [BLUE, CYAN, NAVY][i]; rr(x, cx + cw - 70, top + 442, 44, 44, 12); x.fill(); x.fillStyle = '#9fb3d9'; rr(x, cx + 30, top + 508, cw - 60, 12, 6); x.fill(); rr(x, cx + 60, top + 532, cw - 90, 12, 6); x.fill(); });
}

/* mini app screen for the "apps" service module */
export function drawApp(x, W, H, T) {
  x.fillStyle = NAVY; rr(x, 0, 0, W, H, 60); x.fill();
  x.fillStyle = grad(x, 0, 0, W, H, '#183889', NAVY); rr(x, 0, 0, W, H, 60); x.fill();
  x.fillStyle = 'rgba(31,200,246,.2)'; x.beginPath(); x.arc(W * .8, 160, 170, 0, 7); x.fill();
  x.fillStyle = '#fff'; rr(x, 50, 120, 120, 120, 34); x.fill(); x.fillStyle = BLUE; x.beginPath(); x.arc(110, 170, 24, 0, 7); x.fill(); x.fillRect(100, 190, 20, 30);
  x.fillStyle = '#fff'; rr(x, 50, 300, W - 100, 30, 15); x.fill(); x.globalAlpha = .5; rr(x, 50, 350, W * .55, 22, 11); x.fill(); x.globalAlpha = 1;
  const cols = [BLUE, CYAN, '#96B1FE', '#fff'];
  for (let i = 0; i < 6; i++) { const cx = 50 + (i % 2) * ((W - 120) / 2 + 20), cy = 430 + Math.floor(i / 2) * 200; x.fillStyle = 'rgba(255,255,255,.09)'; rr(x, cx, cy, (W - 120) / 2, 170, 30); x.fill(); x.fillStyle = cols[i % 4]; rr(x, cx + 24, cy + 24, 56, 56, 16); x.fill(); x.fillStyle = 'rgba(255,255,255,.55)'; rr(x, cx + 24, cy + 108, (W - 120) / 2 - 80, 14, 7); x.fill(); rr(x, cx + 24, cy + 134, (W - 120) / 3, 12, 6); x.fill(); }
  x.fillStyle = BLUE; rr(x, 50, H - 140, W - 100, 80, 40); x.fill();
}

export function drawTheme(x, W, H, pal) {
  x.fillStyle = pal.bg; rr(x, 0, 0, W, H, 40); x.fill();
  x.fillStyle = pal.a; rr(x, 0, 0, W, 90, 40); x.fill(); x.fillRect(0, 50, W, 40);
  [0, 1, 2].forEach((i) => { x.fillStyle = 'rgba(255,255,255,.7)'; rr(x, 50 + i * 90, 32, 64, 14, 7); x.fill(); });
  x.fillStyle = pal.b; x.beginPath(); x.arc(W - 90, 46, 20, 0, 7); x.fill();
  x.fillStyle = pal.b; rr(x, 50, 130, W - 100, 230, 28); x.fill(); x.fillStyle = 'rgba(255,255,255,.85)'; rr(x, W - 360, 190, 280, 26, 10); x.fill(); rr(x, W - 320, 236, 240, 22, 10); x.fill(); x.fillStyle = pal.a; rr(x, W - 230, 290, 150, 44, 22); x.fill();
  const cw = (W - 100 - 40) / 3; [0, 1, 2].forEach((i) => { const cx = W - 50 - cw - i * (cw + 20); x.fillStyle = '#fff'; rr(x, cx, 400, cw, 190, 22); x.fill(); x.fillStyle = [pal.a, pal.b, pal.c][i]; rr(x, cx + 20, 420, cw - 40, 90, 14); x.fill(); x.fillStyle = '#C9D3E6'; rr(x, cx + 20, 530, cw - 60, 12, 6); x.fill(); });
}
