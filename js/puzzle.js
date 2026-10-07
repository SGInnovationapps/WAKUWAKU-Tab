/* ④ パズル
 * 右のトレイのピース（縮小表示）を、左のボードの型へドラッグ。
 * 型に近づくとカチッとはまる。ピースの座標はボード内座標（680×640）で定義。
 * 前半：形を組み合わせるパズル（2〜4ピース）
 * 後半：絵を切り分けたジグソー（4・6・8ピース）。ボードにうすく絵が出ているので、どこに入るか分かる。
 */
(() => {
  'use strict';
  const { api, register } = window.Wakuwaku;
  const NS = 'http://www.w3.org/2000/svg';

  const BX = 40;           // ボード左上（舞台座標）
  const BY = 140;
  const TRAY = { x: 760, y: 140, w: 380, h: 640 };
  const SNAP_AUTO = 45;
  const SNAP_RELEASE = 90;
  const NEAR = 150;

  const S = 'stroke="#23315C" stroke-width="6" stroke-linejoin="round"';
  const s4 = 'stroke="#23315C" stroke-width="4" stroke-linejoin="round"';

  // shape = 型（シルエット）にもなる外形、detail = ピースだけに描く模様
  const MOTIFS = [
    { label: 'りんご', voice: 'りんご！', pieces: [
      { x: 160, y: 180, w: 190, h: 335, z: 1,
        shape: '<path d="M340 210C270 160 170 190 170 320C170 450 250 530 340 500Z" fill="#FF5E4D" ' + S + '/>',
        detail: '<ellipse cx="225" cy="290" rx="18" ry="36" fill="#FFFFFF" opacity="0.7" transform="rotate(20 225 290)"/>' },
      { x: 330, y: 120, w: 190, h: 395, z: 2,
        shape: '<path d="M340 210C410 160 510 190 510 320C510 450 430 530 340 500Z" fill="#FF5E4D" ' + S + '/>',
        detail: '<path d="M340 212C338 182 345 160 360 145" stroke="#7A4E2A" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M354 172C382 132 430 130 442 146C422 176 382 182 354 172Z" fill="#4CB963" ' + s4 + '/>' }
    ] },
    { label: 'おうち', voice: 'おうち！', pieces: [
      { x: 172, y: 272, w: 336, h: 256, z: 1,
        shape: '<rect x="180" y="280" width="320" height="240" rx="10" fill="#FFE9A8" ' + S + '/>',
        detail: '<rect x="215" y="320" width="70" height="70" rx="10" fill="#5BB6EE" ' + s4 + '/><path d="M250 320v70M215 355h70" stroke="#23315C" stroke-width="4"/>' },
      { x: 140, y: 125, w: 400, h: 170, z: 2,
        shape: '<path d="M150 285L340 135L530 285Z" fill="#FF7A66" ' + S + '/>',
        detail: '' },
      { x: 292, y: 392, w: 96, h: 136, z: 3,
        shape: '<rect x="300" y="400" width="80" height="120" rx="12" fill="#9C6B3F" ' + S + '/>',
        detail: '<circle cx="362" cy="462" r="7" fill="#FFCC00" stroke="#23315C" stroke-width="3"/>' }
    ] },
    { label: 'ゆきだるま', voice: 'ゆきだるま！', pieces: [
      { x: 214, y: 304, w: 252, h: 252, z: 1,
        shape: '<circle cx="340" cy="430" r="120" fill="#F7FBFF" ' + S + '/>',
        detail: '<circle cx="340" cy="385" r="10" fill="#FF7A66" stroke="#23315C" stroke-width="3"/><circle cx="340" cy="430" r="10" fill="#FF7A66" stroke="#23315C" stroke-width="3"/><circle cx="340" cy="475" r="10" fill="#FF7A66" stroke="#23315C" stroke-width="3"/>' },
      { x: 252, y: 157, w: 176, h: 176, z: 2,
        shape: '<circle cx="340" cy="245" r="82" fill="#F7FBFF" ' + S + '/>',
        detail: '<circle cx="312" cy="235" r="8" fill="#23315C"/><circle cx="368" cy="235" r="8" fill="#23315C"/><path d="M340 252L384 262L340 272Z" fill="#FF8A3D" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/><path d="M318 290q22 14 44 0" stroke="#23315C" stroke-width="4" fill="none" stroke-linecap="round"/>' },
      { x: 249, y: 86, w: 182, h: 112, z: 3,
        shape: '<path d="M285 92H395V172H285Z M255 172H425V192H255Z" fill="#3B4A7A" ' + S + '/>',
        detail: '<rect x="288" y="148" width="104" height="14" fill="#FF7A66"/>' }
    ] },
    { label: 'くるま', voice: 'くるま！', pieces: [
      { x: 222, y: 197, w: 256, h: 161, z: 1,
        shape: '<path d="M230 350V262Q230 205 287 205H413Q470 205 470 262V350Z" fill="#5BB6EE" ' + S + '/>',
        detail: '<rect x="265" y="230" width="170" height="64" rx="20" fill="#FFFFFF" ' + s4 + '/>' },
      { x: 102, y: 322, w: 476, h: 156, z: 2,
        shape: '<rect x="110" y="330" width="460" height="140" rx="40" fill="#FF7A66" ' + S + '/>',
        detail: '<circle cx="532" cy="365" r="17" fill="#FFCC00" ' + s4 + '/>' },
      { x: 152, y: 407, w: 136, h: 136, z: 3,
        shape: '<circle cx="220" cy="475" r="62" fill="#3B4A7A" ' + S + '/>',
        detail: '<circle cx="220" cy="475" r="22" fill="#FFFFFF" ' + s4 + '/>' },
      { x: 392, y: 407, w: 136, h: 136, z: 3,
        shape: '<circle cx="460" cy="475" r="62" fill="#3B4A7A" ' + S + '/>',
        detail: '<circle cx="460" cy="475" r="22" fill="#FFFFFF" ' + s4 + '/>' }
    ] },
    { label: 'うさぎ', voice: 'うさぎ！', pieces: [
      { x: 209, y: 429, w: 262, h: 190, z: 1,
        shape: '<path d="M215 520A125 85 0 1 1 465 520A125 85 0 1 1 215 520Z" fill="#FFFFFF" ' + S + '/>',
        detail: '<ellipse cx="290" cy="596" rx="28" ry="15" fill="#FFFFFF" ' + s4 + '/><ellipse cx="390" cy="596" rx="28" ry="15" fill="#FFFFFF" ' + s4 + '/>' },
      { x: 250, y: 79, w: 80, h: 172, z: 2,
        shape: '<ellipse cx="290" cy="165" rx="34" ry="80" fill="#FFFFFF" ' + S + '/>',
        detail: '<ellipse cx="290" cy="172" rx="16" ry="54" fill="#FFB3C1"/>' },
      { x: 350, y: 79, w: 80, h: 172, z: 2,
        shape: '<ellipse cx="390" cy="165" rx="34" ry="80" fill="#FFFFFF" ' + S + '/>',
        detail: '<ellipse cx="390" cy="172" rx="16" ry="54" fill="#FFB3C1"/>' },
      { x: 224, y: 214, w: 232, h: 232, z: 3,
        shape: '<circle cx="340" cy="330" r="110" fill="#FFFFFF" ' + S + '/>',
        detail: '<ellipse cx="285" cy="365" rx="16" ry="10" fill="#FFB3C1"/><ellipse cx="395" cy="365" rx="16" ry="10" fill="#FFB3C1"/><circle cx="300" cy="315" r="10" fill="#23315C"/><circle cx="380" cy="315" r="10" fill="#23315C"/><ellipse cx="340" cy="350" rx="12" ry="9" fill="#FF7A9A"/><path d="M340 359v10M340 369q-14 12-26 2M340 369q14 12 26 2" stroke="#23315C" stroke-width="4" fill="none" stroke-linecap="round"/>' }
    ] }
  ];

  /* ---------- ジグソー（絵を切り分けるパズル） ---------- */
  const art = (id, cx, cy, size) => {
    const a = (window.Wakuwaku.art || {})[id];
    if (!a) return '';
    return '<svg x="' + (cx - size / 2) + '" y="' + (cy - size / 2) + '" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" overflow="visible">' + a.art + '</svg>';
  };
  const SUN = (x, y, r) => '<g stroke="#23315C" stroke-width="4" stroke-linecap="round">' +
    [0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
      const t = d * Math.PI / 180;
      return '<path d="M' + (x + Math.cos(t) * r * 1.35).toFixed(1) + ' ' + (y + Math.sin(t) * r * 1.35).toFixed(1) + 'L' + (x + Math.cos(t) * r * 1.7).toFixed(1) + ' ' + (y + Math.sin(t) * r * 1.7).toFixed(1) + '"/>';
    }).join('') + '</g><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#FFCC00" stroke="#23315C" stroke-width="4"/>';
  const CLOUD = (x, y, k) => '<path transform="translate(' + x + ' ' + y + ') scale(' + k + ')" d="M-40 10a20 20 0 0 1 8-30a26 26 0 0 1 46-6a20 20 0 0 1 28 16a14 14 0 0 1-4 20Z" fill="#FFFFFF" stroke="#23315C" stroke-width="' + (4 / k) + '" stroke-linejoin="round"/>';
  const FLOWER = (x, y, c) => '<g>' + [0, 72, 144, 216, 288].map((d) => {
    const t = d * Math.PI / 180;
    return '<circle cx="' + (x + Math.cos(t) * 9).toFixed(1) + '" cy="' + (y + Math.sin(t) * 9).toFixed(1) + '" r="7" fill="' + c + '" stroke="#23315C" stroke-width="2.5"/>';
  }).join('') + '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#FFCC00" stroke="#23315C" stroke-width="2.5"/></g>';

  // 背景：sky=空, ground=地面/テーブル/海 の色、horizon=境目の高さ（0〜1）
  function backdrop(w, h, opt) {
    const hy = Math.round(h * opt.horizon);
    let s = '<rect width="' + w + '" height="' + h + '" fill="' + opt.sky + '"/>' +
      '<rect y="' + hy + '" width="' + w + '" height="' + (h - hy) + '" fill="' + opt.ground + '"/>';
    if (opt.sun) s += SUN(opt.sun[0] * w, opt.sun[1] * h, Math.round(h * 0.07));
    (opt.clouds || []).forEach((c) => { s += CLOUD(c[0] * w, c[1] * h, c[2] || 1); });
    (opt.flowers || []).forEach((f) => { s += FLOWER(f[0] * w, f[1] * h, f[2]); });
    if (opt.stripes) for (let x = 20; x < w; x += 70) s += '<rect x="' + x + '" y="' + (hy + (h - hy) * 0.55) + '" width="36" height="8" rx="4" fill="#FFFFFF" opacity="0.8"/>';
    if (opt.waves) for (let x = 0; x < w; x += 60) s += '<path d="M' + x + ' ' + (hy + 26) + 'q15-12 30 0t30 0" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.8"/>';
    return s;
  }

  // ジグソーの1辺：a→b の直線に、out（+1:外へ出っぱる / -1:内へへこむ / 0:まっすぐ）のこぶを付ける
  function edge(a, b, out, c) {
    if (!out) return 'L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const nx = dy / len;   // 時計回りにたどったときの外向き
    const ny = -dx / len;
    const P = (u, w) => {
      const x = a[0] + dx * u + nx * w * out * c;
      const y = a[1] + dy * u + ny * w * out * c;
      return x.toFixed(1) + ' ' + y.toFixed(1);
    };
    return 'L' + P(0.37, 0) + 'C' + P(0.42, 0) + ' ' + P(0.30, 0.22) + ' ' + P(0.5, 0.22) +
      'C' + P(0.70, 0.22) + ' ' + P(0.58, 0) + ' ' + P(0.63, 0) + 'L' + P(1, 0);
  }

  // cols×rows に切り分けたピース定義を作る（形のパズルと同じ x,y,w,h,shape,detail 形式）
  let jigSeq = 0;
  function jigsaw(m) {
    const c = Math.floor(Math.min(640 / m.cols, 580 / m.rows));
    const W = c * m.cols;
    const H = c * m.rows;
    const ox = Math.round((680 - W) / 2);
    const oy = Math.round((640 - H) / 2);
    const picture = '<g transform="translate(' + ox + ' ' + oy + ')">' + backdrop(W, H, m.bg) +
      m.items.map((it) => art(it[0], it[1] * W, it[2] * H, it[3] * H)).join('') +
      '<rect width="' + W + '" height="' + H + '" fill="none" stroke="#23315C" stroke-width="6" rx="4"/></g>';
    // つなぎ目のこぶの向き（毎回同じ形になるよう固定パターン）
    const hTab = (r, col) => ((r * 7 + col * 3) % 2 ? 1 : -1);   // 横のつなぎ目：+1 は下へ出っぱる
    const vTab = (r, col) => ((r * 5 + col * 3 + 1) % 2 ? 1 : -1); // 縦のつなぎ目：+1 は右へ出っぱる
    const T = Math.ceil(c * 0.24);
    const id = 'pz' + (jigSeq++);
    const pieces = [];
    for (let r = 0; r < m.rows; r++) {
      for (let col = 0; col < m.cols; col++) {
        const x0 = ox + col * c;
        const y0 = oy + r * c;
        const top = r === 0 ? 0 : -hTab(r, col);
        const bottom = r === m.rows - 1 ? 0 : hTab(r + 1, col);
        const left = col === 0 ? 0 : -vTab(r, col);
        const right = col === m.cols - 1 ? 0 : vTab(r, col + 1);
        const d = 'M' + x0 + ' ' + y0 +
          edge([x0, y0], [x0 + c, y0], top, c) +
          edge([x0 + c, y0], [x0 + c, y0 + c], right, c) +
          edge([x0 + c, y0 + c], [x0, y0 + c], bottom, c) +
          edge([x0, y0 + c], [x0, y0], left, c) + 'Z';
        const pad = 4;
        const x = x0 - (left > 0 ? T : 0) - pad;
        const y = y0 - (top > 0 ? T : 0) - pad;
        const w = c + (left > 0 ? T : 0) + (right > 0 ? T : 0) + pad * 2;
        const h = c + (top > 0 ? T : 0) + (bottom > 0 ? T : 0) + pad * 2;
        const cid = id + '-' + r + '-' + col;
        pieces.push({
          x, y, w, h, z: 1,
          shape: '<path d="' + d + '" fill="#FFFFFF" ' + S + '/>',
          detail: '<defs><clipPath id="' + cid + '"><path d="' + d + '"/></clipPath></defs>' +
            '<g clip-path="url(#' + cid + ')">' + picture + '</g>' +
            '<path d="' + d + '" fill="none" stroke="#23315C" stroke-width="5" stroke-linejoin="round"/>'
        });
      }
    }
    return { label: m.label, voice: m.voice, pieces, guide: picture, jig: true, box: [ox, oy, W, H] };
  }

  const SKY = '#CDEBFA';
  const GRASS = '#A8DE8C';
  const JIGSAWS = [
    { label: 'いちご', voice: 'いちご！', cols: 2, rows: 2, items: [['berry', 0.5, 0.56, 0.8]],
      bg: { sky: '#FFE9EF', ground: '#FFD0DC', horizon: 0.78, flowers: [[0.1, 0.12, '#FF9AC1'], [0.9, 0.9, '#FFFFFF']] } },
    { label: 'ぶた', voice: 'ぶうぶう、ぶた！', cols: 2, rows: 2, items: [['pig', 0.5, 0.52, 0.78]],
      bg: { sky: SKY, ground: GRASS, horizon: 0.72, sun: [0.85, 0.14], flowers: [[0.12, 0.88, '#FF9AC1'], [0.86, 0.9, '#FFFFFF']] } },
    { label: 'バス', voice: 'ぶーぶー、バス！', cols: 2, rows: 2, items: [['bus', 0.5, 0.55, 0.85]],
      bg: { sky: SKY, ground: '#B9C2D3', horizon: 0.74, sun: [0.15, 0.14], clouds: [[0.78, 0.16, 0.9]], stripes: true } },
    { label: 'くだもの', voice: 'りんごと みかん！', cols: 3, rows: 2, items: [['apple', 0.3, 0.5, 0.74], ['orange', 0.72, 0.52, 0.7]],
      bg: { sky: '#FFF4D6', ground: '#F4C9A0', horizon: 0.8, flowers: [[0.5, 0.12, '#FF9AC1']] } },
    { label: 'やさい', voice: 'にんじんと トマト！', cols: 3, rows: 2, items: [['carrot', 0.28, 0.5, 0.82], ['tomato', 0.72, 0.56, 0.68]],
      bg: { sky: SKY, ground: '#C99A6B', horizon: 0.78, sun: [0.88, 0.15] } },
    { label: 'のりもの', voice: 'くるまと ふね！', cols: 3, rows: 2, items: [['car', 0.28, 0.58, 0.66], ['ship', 0.74, 0.6, 0.66]],
      bg: { sky: SKY, ground: '#7CC4F2', horizon: 0.7, sun: [0.5, 0.15], clouds: [[0.14, 0.16, 0.8]], waves: true } },
    { label: 'どうぶつ', voice: 'いぬと ねこと うさぎ！', cols: 4, rows: 2, items: [['dog', 0.18, 0.55, 0.72], ['cat', 0.5, 0.55, 0.72], ['rabbit', 0.82, 0.52, 0.76]],
      bg: { sky: SKY, ground: GRASS, horizon: 0.74, clouds: [[0.34, 0.12, 0.6], [0.66, 0.12, 0.6]], flowers: [[0.04, 0.9, '#FF9AC1'], [0.96, 0.9, '#FFFFFF']] } },
    { label: 'くだもの', voice: 'ぶどうと バナナと いちご！', cols: 4, rows: 2, items: [['grape', 0.18, 0.52, 0.74], ['banana', 0.5, 0.55, 0.72], ['berry', 0.82, 0.55, 0.72]],
      bg: { sky: '#FFF4D6', ground: '#F4C9A0', horizon: 0.82, flowers: [[0.34, 0.12, '#FF9AC1'], [0.66, 0.12, '#C9A8FF']] } },
    { label: 'やさい', voice: 'なすと とうもろこしと ブロッコリー！', cols: 4, rows: 2, items: [['eggplant', 0.18, 0.55, 0.74], ['corn', 0.5, 0.5, 0.8], ['broccoli', 0.82, 0.55, 0.74]],
      bg: { sky: SKY, ground: '#C99A6B', horizon: 0.8, sun: [0.34, 0.14], clouds: [[0.68, 0.14, 0.6]] } },
    { label: 'のりもの', voice: 'でんしゃと バスと くるま！', cols: 4, rows: 2, items: [['train', 0.18, 0.58, 0.7], ['bus', 0.5, 0.58, 0.7], ['car', 0.82, 0.6, 0.66]],
      bg: { sky: SKY, ground: '#B9C2D3', horizon: 0.78, sun: [0.06, 0.16], clouds: [[0.5, 0.13, 0.6], [0.88, 0.14, 0.55]], stripes: true } }
  ].map(jigsaw);

  const ALL = MOTIFS.concat(JIGSAWS);

  // ステージ切替ボタン用の小さなお手本
  function thumb(m) {
    if (m.jig) {
      const b = m.box;
      return '<svg width="46" height="46" viewBox="' + b.join(' ') + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + m.guide.replace(/<rect width="\d+" height="\d+" fill="none"[^>]*\/>/, '') + '</svg>';
    }
    const xs = m.pieces.map((p) => p.x);
    const ys = m.pieces.map((p) => p.y);
    const x0 = Math.min.apply(null, xs);
    const y0 = Math.min.apply(null, ys);
    const x1 = Math.max.apply(null, m.pieces.map((p) => p.x + p.w));
    const y1 = Math.max.apply(null, m.pieces.map((p) => p.y + p.h));
    const body = m.pieces.slice().sort((a, b) => a.z - b.z).map((p) => p.shape + p.detail).join('');
    return '<svg width="46" height="46" viewBox="' + x0 + ' ' + y0 + ' ' + (x1 - x0) + ' ' + (y1 - y0) + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + body + '</svg>';
  }

  const VARIANTS = ALL.map((m) => ({ label: m.label + '（' + m.pieces.length + 'ピース）', icon: thumb(m) }));

  function pieceSvg(p, cls, withDetail) {
    const box = p.x + ' ' + p.y + ' ' + p.w + ' ' + p.h;
    return '<svg class="' + cls + '" viewBox="' + box + '" aria-hidden="true"><g class="shape">' + p.shape + '</g>' + (withDetail ? p.detail : '') + '</svg>';
  }

  let root, board;
  let items = [];
  let drag = null;
  let placedCount = 0;
  let motif = null;
  let timers = [];

  function place(it, left, top, scale) {
    it.left = left;
    it.top = top;
    it.scale = scale;
    it.el.style.left = left + 'px';
    it.el.style.top = top + 'px';
    it.el.style.transform = 'scale(' + scale + ')';
  }

  const targetLeft = (it) => BX + it.p.x;
  const targetTop = (it) => BY + it.p.y;
  const dist = (it) => Math.hypot(it.left - targetLeft(it), it.top - targetTop(it));

  function snap(it) {
    endDrag(it);
    it.placed = true;
    it.el.classList.add('anim', 'placed');
    it.el.style.zIndex = 10 + it.p.z;
    place(it, targetLeft(it), targetTop(it), 1);
    it.sil.classList.remove('near');
    api.sound.snap();
    placedCount++;
    if (placedCount === items.length) {
      timers.push(setTimeout(() => api.say(motif.voice), 250));
      timers.push(setTimeout(() => api.done(), 700));
    }
  }

  function goHome(it) {
    endDrag(it);
    it.el.classList.add('anim');
    it.el.style.zIndex = it.homeZ;
    place(it, it.home.left, it.home.top, it.home.scale);
  }

  function endDrag(it) {
    it.el.classList.remove('dragging');
    it.sil.classList.remove('near');
    drag = null;
  }

  function onDown(e, it) {
    if (it.placed || drag) return;
    e.preventDefault();
    const p = api.toStage(e);
    // つかんだ位置が指の下に残るように、縮小→等倍へ広げる
    const cx = it.left + it.p.w / 2;
    const cy = it.top + it.p.h / 2;
    const fx = (p.x - cx) / it.scale;
    const fy = (p.y - cy) / it.scale;
    drag = { it, id: e.pointerId, ox: it.p.w / 2 + fx, oy: it.p.h / 2 + fy };
    try { it.el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    it.el.classList.remove('anim');
    it.el.classList.add('dragging');
    it.el.style.zIndex = 100;
    place(it, p.x - drag.ox, p.y - drag.oy, 1);
    api.sound.tap();
  }

  function onMove(e, it) {
    if (!drag || drag.it !== it || drag.id !== e.pointerId) return;
    const p = api.toStage(e);
    place(it, p.x - drag.ox, p.y - drag.oy, 1);
    const d = dist(it);
    it.sil.classList.toggle('near', d < NEAR);
    if (d < SNAP_AUTO) snap(it);
  }

  function onUp(e, it) {
    if (!drag || drag.it !== it || drag.id !== e.pointerId) return;
    if (dist(it) < SNAP_RELEASE) { snap(it); return; }
    const cx = it.left + it.p.w / 2;
    const cy = it.top + it.p.h / 2;
    if (cx > BX && cx < BX + 680 && cy > BY && cy < BY + 640) api.miss(cx, cy);
    goHome(it);
  }

  register('puzzle', {
    variants: VARIANTS,

    mount(play) {
      root = play;
    },

    start(i) {
      motif = ALL[i];
      root.innerHTML = '';
      items = [];
      drag = null;
      placedCount = 0;

      board = api.el('div', 'board');
      const tray = api.el('div', 'ptray');
      root.append(board, tray);

      // 型（ボード内座標 → ボードの内側 4px の枠線分を補正）
      motif.pieces.slice().sort((a, b) => a.z - b.z).forEach((p) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = pieceSvg(p, 'sil', false);
        const sil = wrap.firstChild;
        sil.style.left = (p.x - 4) + 'px';
        sil.style.top = (p.y - 4) + 'px';
        sil.style.width = p.w + 'px';
        sil.style.height = p.h + 'px';
        board.appendChild(sil);
        p._sil = sil;
      });
      // ジグソーは、ボードにうすく完成の絵を出す（どこに入るかのヒント）
      if (motif.jig) {
        const g = document.createElement('div');
        g.innerHTML = '<svg class="jig-guide" viewBox="0 0 680 640" aria-hidden="true">' + motif.guide + '</svg>';
        board.appendChild(g.firstChild);
      }

      // ピース（トレイに並べ、枠に収まる大きさに縮小。4 ピース以上は 2 列）
      const order = api.shuffle(motif.pieces);
      const cols = order.length >= 4 ? 2 : 1;
      const rows = Math.ceil(order.length / cols);
      const cellW = TRAY.w / cols;
      const slotH = TRAY.h / rows;
      order.forEach((p, k) => {
        const el = api.el('div', 'piece', pieceSvg(p, '', true));
        el.style.width = p.w + 'px';
        el.style.height = p.h + 'px';
        el.setAttribute('aria-label', motif.label + ' の ピース');
        const scale = Math.min(0.9, (cellW - 24) / p.w, (slotH - 24) / p.h);
        const cx = TRAY.x + cellW * ((k % cols) + 0.5);
        const cy = TRAY.y + slotH * (Math.floor(k / cols) + 0.5);
        const it = { p, el, sil: p._sil, placed: false, homeZ: 20 + k,
          home: { left: cx - p.w / 2, top: cy - p.h / 2, scale } };
        el.style.zIndex = it.homeZ;
        place(it, it.home.left, it.home.top, scale);
        el.addEventListener('pointerdown', (e) => onDown(e, it));
        el.addEventListener('pointermove', (e) => onMove(e, it));
        el.addEventListener('pointerup', (e) => onUp(e, it));
        el.addEventListener('pointercancel', () => { if (drag && drag.it === it) goHome(it); });
        root.appendChild(el);
        items.push(it);
      });
      api.say(motif.label);
    },

    stop() {
      timers.forEach(clearTimeout);
      timers = [];
      drag = null;
    }
  });
})();
