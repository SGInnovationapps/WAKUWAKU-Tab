/* ④ パズル
 * 右のトレイのピース（縮小表示）を、左のボードの型へドラッグ。
 * 型に近づくとカチッとはまる。ピースの座標はボード内座標（680×640）で定義。
 * すべて「形を組み合わせる」パズル（15ステージ・2〜8ピース）。
 * 同じ形のピース（くるまのタイヤなど）は tw で印を付け、どちらの型にはめてもOK。
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
  const INK = '#23315C';

  // ---- ピース作成の補助（外形の座標から枠 x,y,w,h を自動計算） ----
  const PAD = 5;
  const mk = (z, shape, x0, y0, x1, y1, detail, tw) => ({
    x: x0 - PAD, y: y0 - PAD, w: x1 - x0 + PAD * 2, h: y1 - y0 + PAD * 2,
    z, shape, detail: detail || '', tw
  });
  const circ = (z, cx, cy, r, fill, detail, tw) =>
    mk(z, '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" ' + S + '/>', cx - r, cy - r, cx + r, cy + r, detail, tw);
  const ell = (z, cx, cy, rx, ry, fill, detail, tw) =>
    mk(z, '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" ' + S + '/>', cx - rx, cy - ry, cx + rx, cy + ry, detail, tw);
  const rct = (z, x, y, w, h, rx, fill, detail, tw) =>
    mk(z, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + fill + '" ' + S + '/>', x, y, x + w, y + h, detail, tw);
  const ply = (z, pts, fill, detail, tw) => {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return mk(z, '<path d="M' + pts.map((p) => p.join(' ')).join('L') + 'Z" fill="' + fill + '" ' + S + '/>',
      Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys), detail, tw);
  };
  const pth = (z, d, box, fill, detail, tw) =>
    mk(z, '<path d="' + d + '" fill="' + fill + '" ' + S + '/>', box[0], box[1], box[2], box[3], detail, tw);
  const dot = (cx, cy, r, c) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (c || INK) + '"/>';
  const eyes = (lx, rx, y, r) => dot(lx, y, r || 9) + dot(rx, y, r || 9);

  // shape = 型（シルエット）にもなる外形、detail = ピースだけに描く模様
  const M = {};
  const OLD = [
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
  // くるまのタイヤ・うさぎの耳は同じ形：どちらにもはめられる
  OLD[3].pieces[2].tw = 'wheel'; OLD[3].pieces[3].tw = 'wheel';
  OLD[4].pieces[1].tw = 'ear'; OLD[4].pieces[2].tw = 'ear';
  M.apple = OLD[0]; M.house = OLD[1]; M.snowman = OLD[2]; M.car = OLD[3]; M.rabbit = OLD[4];

  // ---- にんじん（2） ----
  M.carrot = { label: 'にんじん', voice: 'にんじん！', pieces: [
    pth(1, 'M270 232Q340 200 410 232L352 540Q340 562 328 540Z', [270, 210, 410, 562], '#FF8A3D',
      '<path d="M305 300h38M342 378h36M322 450h30" stroke="#E86A1C" stroke-width="6" stroke-linecap="round"/>'),
    pth(2, 'M340 226C285 205 282 145 308 92C338 132 352 182 340 226Z M340 226C350 172 378 122 412 106C426 152 396 208 340 226Z',
      [282, 92, 426, 226], '#4CB963', '<path d="M338 215C328 175 320 140 312 112" stroke="#2F8F47" stroke-width="4" fill="none" stroke-linecap="round"/>')
  ] };

  // ---- さかな（3） ----
  M.fish = { label: 'さかな', voice: 'さかな！', pieces: [
    ell(1, 310, 330, 170, 110, '#5BB6EE',
      '<circle cx="225" cy="300" r="15" fill="#FFFFFF" ' + s4 + '/>' + dot(222, 300, 7) +
      '<path d="M165 350q20 14 40 0" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M300 250q22 30 0 80M345 250q22 30 0 80" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>'),
    ply(2, [[455, 330], [585, 225], [585, 435]], '#FF7A66'),
    ply(2, [[255, 232], [320, 140], [385, 232]], '#FF7A66')
  ] };

  // ---- ブロッコリー（4） ----
  const FL = '#3FA34D';
  M.broccoli = { label: 'ブロッコリー', voice: 'ブロッコリー！', pieces: [
    pth(1, 'M298 360H382L398 560Q340 584 282 560Z', [282, 360, 398, 572], '#A8DE8C',
      '<path d="M330 400v120M350 400v120" stroke="#7FBF63" stroke-width="5" stroke-linecap="round"/>'),
    circ(2, 245, 300, 78, FL, '<circle cx="215" cy="285" r="10" fill="#6CC070"/><circle cx="262" cy="320" r="9" fill="#6CC070"/>'),
    circ(2, 435, 300, 78, FL, '<circle cx="410" cy="320" r="9" fill="#6CC070"/><circle cx="458" cy="280" r="10" fill="#6CC070"/>'),
    circ(3, 340, 230, 88, FL, '<circle cx="305" cy="215" r="11" fill="#6CC070"/><circle cx="365" cy="250" r="10" fill="#6CC070"/><circle cx="345" cy="190" r="9" fill="#6CC070"/>')
  ] };

  // ---- ちょうちょ（5） ----
  const wingSpot = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#FFFFFF" opacity="0.85"/>';
  M.butterfly = { label: 'ちょうちょ', voice: 'ちょうちょ！', pieces: [
    pth(1, 'M322 300C250 190 130 170 120 250C115 320 220 345 322 330Z', [118, 175, 324, 345], '#FF8FB5', wingSpot(205, 255, 28)),
    pth(1, 'M358 300C430 190 550 170 560 250C565 320 460 345 358 330Z', [356, 175, 562, 345], '#FF8FB5', wingSpot(475, 255, 28)),
    pth(1, 'M324 345C230 345 150 400 170 470C190 520 280 500 324 400Z', [150, 345, 326, 510], '#FFD25C', wingSpot(235, 440, 22)),
    pth(1, 'M356 345C450 345 530 400 510 470C490 520 400 500 356 400Z', [354, 345, 530, 510], '#FFD25C', wingSpot(445, 440, 22)),
    mk(3, '<ellipse cx="340" cy="335" rx="24" ry="115" fill="#6B4A2A" ' + S + '/>' +
      '<path d="M332 228Q316 175 290 152M348 228Q364 175 390 152" fill="none" ' + S + '/>' +
      '<circle cx="290" cy="150" r="9" fill="#6B4A2A" ' + s4 + '/><circle cx="390" cy="150" r="9" fill="#6B4A2A" ' + s4 + '/>',
      281, 141, 399, 450, eyes(331, 349, 285, 5).replace(/#23315C/g, '#FFFFFF'))
  ] };

  // ---- ねこ（5） ----
  const CAT = '#FFB04D';
  M.cat = { label: 'ねこ', voice: 'にゃー、ねこ！', pieces: [
    ell(1, 340, 470, 130, 120, CAT, '<ellipse cx="340" cy="500" rx="70" ry="70" fill="#FFE4B8"/>'),
    pth(1, 'M440 540C560 560 620 470 580 380L615 365C670 480 590 610 430 590Z', [430, 365, 670, 610], CAT),
    ply(2, [[232, 235], [232, 92], [338, 168]], CAT, '<path d="M250 205V130L305 168Z" fill="#FFB3C1"/>'),
    ply(2, [[448, 235], [448, 92], [342, 168]], CAT, '<path d="M430 205V130L375 168Z" fill="#FFB3C1"/>'),
    circ(3, 340, 275, 118, CAT,
      eyes(295, 385, 262, 10) + '<ellipse cx="340" cy="300" rx="13" ry="9" fill="#FF7A9A"/>' +
      '<path d="M340 309v12M340 321q-14 12-26 2M340 321q14 12 26 2" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M255 300l-50-8M255 318l-50 8M425 300l50-8M425 318l50 8" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>')
  ] };

  // ---- バス（5） ----
  M.bus = { label: 'バス', voice: 'ぶーぶー、バス！', pieces: [
    rct(1, 80, 170, 520, 260, 40, '#FFCC00', '<rect x="86" y="380" width="508" height="14" fill="#FF7A66"/>'),
    rct(2, 112, 210, 310, 100, 14, '#CDEBFA', '<path d="M215 214v92M318 214v92" stroke="' + INK + '" stroke-width="5"/>'),
    rct(2, 456, 210, 100, 196, 14, '#5BB6EE', '<rect x="474" y="228" width="64" height="70" rx="8" fill="#CDEBFA" ' + s4 + '/>'),
    circ(3, 195, 440, 58, '#3B4A7A', '<circle cx="195" cy="440" r="22" fill="#FFFFFF" ' + s4 + '/>', 'wheel'),
    circ(3, 485, 440, 58, '#3B4A7A', '<circle cx="485" cy="440" r="22" fill="#FFFFFF" ' + s4 + '/>', 'wheel')
  ] };

  // ---- でんしゃ（6） ----
  M.train = { label: 'でんしゃ', voice: 'がたんごとん、でんしゃ！', pieces: [
    rct(1, 120, 190, 150, 220, 16, '#FF7A66', '<rect x="148" y="224" width="92" height="84" rx="10" fill="#CDEBFA" ' + s4 + '/>'),
    rct(1, 230, 262, 330, 148, 20, '#5BB6EE',
      '<circle cx="320" cy="336" r="30" fill="#FFFFFF" ' + s4 + '/><circle cx="410" cy="336" r="30" fill="#FFFFFF" ' + s4 + '/><circle cx="500" cy="336" r="30" fill="#FFFFFF" ' + s4 + '/>'),
    ply(2, [[470, 190], [530, 190], [545, 266], [455, 266]], '#3B4A7A', '<rect x="468" y="200" width="64" height="12" fill="#FFCC00"/>'),
    circ(3, 220, 440, 50, '#FFCC00', '<circle cx="220" cy="440" r="16" fill="#FFFFFF" ' + s4 + '/>', 'wheel'),
    circ(3, 370, 440, 50, '#FFCC00', '<circle cx="370" cy="440" r="16" fill="#FFFFFF" ' + s4 + '/>', 'wheel'),
    circ(3, 520, 440, 50, '#FFCC00', '<circle cx="520" cy="440" r="16" fill="#FFFFFF" ' + s4 + '/>', 'wheel')
  ] };

  // ---- ロケット（6） ----
  M.rocket = { label: 'ロケット', voice: 'ロケット！', pieces: [
    pth(1, 'M285 495L340 610L395 495Z', [285, 495, 395, 610], '#FFCC00', '<path d="M318 500L340 560L362 500Z" fill="#FF7A66"/>'),
    rct(2, 250, 255, 180, 240, 10, '#F7FBFF', '<rect x="252" y="440" width="176" height="16" fill="#FF5E4D"/>'),
    pth(3, 'M250 258C250 170 300 112 340 80C380 112 430 170 430 258Z', [250, 80, 430, 258], '#FF5E4D'),
    pth(2, 'M257 360L167 470Q162 520 202 520H257Z', [162, 360, 257, 520], '#FF5E4D'),
    pth(2, 'M423 360L513 470Q518 520 478 520H423Z', [423, 360, 518, 520], '#FF5E4D'),
    circ(4, 340, 345, 46, '#5BB6EE', '<circle cx="326" cy="332" r="12" fill="#FFFFFF" opacity="0.7"/>')
  ] };

  // ---- くま（7） ----
  const BR = '#B07A4A';
  const TAN = '#E8C39E';
  M.bear = { label: 'くま', voice: 'がおー、くま！', pieces: [
    ell(1, 255, 530, 48, 30, BR, '', 'foot'),
    ell(1, 425, 530, 48, 30, BR, '', 'foot'),
    ell(2, 340, 420, 125, 115, BR, '<ellipse cx="340" cy="430" rx="70" ry="70" fill="' + TAN + '"/>'),
    circ(2, 255, 130, 38, BR, '<circle cx="255" cy="134" r="20" fill="' + TAN + '"/>', 'ear'),
    circ(2, 425, 130, 38, BR, '<circle cx="425" cy="134" r="20" fill="' + TAN + '"/>', 'ear'),
    circ(3, 340, 220, 105, BR, eyes(300, 380, 195, 10)),
    ell(4, 340, 255, 52, 40, TAN,
      '<ellipse cx="340" cy="238" rx="16" ry="11" fill="' + INK + '"/>' +
      '<path d="M340 249v14M340 263q-14 10-24 2M340 263q14 10 24 2" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>')
  ] };

  // ---- ぞう（8） ----
  const GY = '#A9B4C6';
  const GYD = '#8E9BB2';
  const leg = (x) => rct(1, x, 330, 70, 150, 20, GY, '', 'leg');
  M.elephant = { label: 'ぞう', voice: 'ぱおーん、ぞう！', pieces: [
    leg(240), leg(320), leg(440), leg(520),
    rct(1, 100, 240, 54, 262, 27, GY, '<path d="M108 330h38M108 380h38M108 430h38" stroke="' + GYD + '" stroke-width="4" stroke-linecap="round"/>'),
    ell(2, 380, 270, 190, 130, GY, ''),
    circ(3, 195, 250, 100, GY, dot(150, 232, 9)),
    ell(4, 255, 265, 52, 82, GYD, '<ellipse cx="258" cy="268" rx="26" ry="52" fill="#C9D1E0"/>')
  ] };

  const ALL = [M.apple, M.carrot, M.house, M.snowman, M.fish, M.car, M.rabbit, M.broccoli,
    M.butterfly, M.cat, M.bus, M.train, M.rocket, M.bear, M.elephant];

  // ステージ切替ボタン用の小さなお手本
  function thumb(m) {
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

  let slots = [];

  // いま置ける型のうち、いちばん近いもの（同じ形のピースは、どの型にもはめられる）
  function nearest(it) {
    let best = null;
    slots.forEach((sl) => {
      if (sl.taken || !(sl.p === it.p || (it.p.tw && sl.p.tw === it.p.tw))) return;
      const d = Math.hypot(it.left - (BX + sl.p.x), it.top - (BY + sl.p.y));
      if (!best || d < best.d) best = { sl, d };
    });
    return best || { sl: null, d: Infinity };
  }

  function setNear(it, sil) {
    if (it.nearSil && it.nearSil !== sil) it.nearSil.classList.remove('near');
    if (sil) sil.classList.add('near');
    it.nearSil = sil;
  }

  function snap(it, sl) {
    endDrag(it);
    sl.taken = true;
    it.placed = true;
    it.el.classList.add('anim', 'placed');
    it.el.style.zIndex = 10 + sl.p.z;
    place(it, BX + sl.p.x, BY + sl.p.y, 1);
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
    setNear(it, null);
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
    const n = nearest(it);
    setNear(it, n.sl && n.d < NEAR ? n.sl.sil : null);
    if (n.sl && n.d < SNAP_AUTO) snap(it, n.sl);
  }

  function onUp(e, it) {
    if (!drag || drag.it !== it || drag.id !== e.pointerId) return;
    const n = nearest(it);
    if (n.sl && n.d < SNAP_RELEASE) { snap(it, n.sl); return; }
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
      slots = [];
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
        slots.push({ p, sil, taken: false });
      });

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
        const it = { p, el, nearSil: null, placed: false, homeZ: 20 + k,
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
