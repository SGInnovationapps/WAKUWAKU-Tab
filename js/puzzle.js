/* ④ パズル
 * 右のトレイのピース（縮小表示）を、左のボードの型へドラッグ。
 * 型に近づくとカチッとはまる。ピースの座標はボード内座標（680×640）で定義。
 */
(() => {
  'use strict';
  const { api, register } = window.Wakuwaku;
  const NS = 'http://www.w3.org/2000/svg';

  const BX = 110;          // ボード左上（舞台座標）
  const BY = 140;
  const TRAY = { x: 840, y: 140, w: 240, h: 640 };
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

  const VARIANTS = MOTIFS.map((m) => ({ label: m.label + '（' + m.pieces.length + 'ピース）', icon: thumb(m) }));

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
    const last = placedCount === items.length;
    const words = ['カチッ！', 'ぴったり！', 'すごい！'];
    api.success(targetLeft(it) + it.p.w / 2, targetTop(it) + it.p.h / 2, { word: last ? null : words[Math.floor(Math.random() * words.length)] });
    if (last) {
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
    if (cx > BX && cx < BX + 680 && cy > BY && cy < BY + 640) api.miss(cx, cy, { word: 'そこじゃないよ' });
    goHome(it);
  }

  register('puzzle', {
    variants: VARIANTS,

    mount(play) {
      root = play;
    },

    start(i) {
      motif = MOTIFS[i];
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

      // ピース（トレイに縦に並べ、枠に収まる大きさに縮小）
      const order = api.shuffle(motif.pieces);
      const slotH = TRAY.h / order.length;
      order.forEach((p, k) => {
        const el = api.el('div', 'piece', pieceSvg(p, '', true));
        el.style.width = p.w + 'px';
        el.style.height = p.h + 'px';
        el.setAttribute('aria-label', motif.label + ' の ピース');
        const scale = Math.min(0.9, 190 / p.w, (slotH - 28) / p.h);
        const cx = TRAY.x + TRAY.w / 2;
        const cy = TRAY.y + slotH * (k + 0.5);
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
