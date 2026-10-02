/* ③ 数字ならべ
 * 下のトレイのブロックを、上のたなの正しい枠へドラッグ。
 * 正しい枠に近づくと吸い込まれる。違う枠やたなの上で離すと「×」が出てトレイへ戻る。
 * 1〜2 から 1〜10 まで。数が増えるほど枠とブロックを自動で小さくして 1 列に並べる。
 */
(() => {
  'use strict';
  const { api, register } = window.Wakuwaku;

  const SHELF_Y = 140;
  const SLOT_Y = 180;
  const TRAY_Y = 580;
  const TRAY_H = 200;
  const MAX_W = 1140;

  const COLORS = {
    1: '#5BB6EE', 2: '#FFCC00', 3: '#FF7A66', 4: '#8EDB9C', 5: '#C9A8FF',
    6: '#FF9AC1', 7: '#FFB067', 8: '#6FD3C8', 9: '#C6E86A', 10: '#A9CBEB'
  };
  const WORDS = { 1: 'いち', 2: 'に', 3: 'さん', 4: 'よん', 5: 'ご', 6: 'ろく', 7: 'なな', 8: 'はち', 9: 'きゅう', 10: 'じゅう' };

  const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
  const txt = (s) => '<span aria-hidden="true">' + s + '</span>';
  const mini = (dashed, inner) => '<svg width="56" height="40" viewBox="0 0 56 40" aria-hidden="true"><rect x="3" y="3" width="50" height="34" rx="9" fill="' + (dashed ? '#FFFFFF' : '#FF7A66') + '" stroke="#23315C" stroke-width="3"' + (dashed ? ' stroke-dasharray="5 4"' : '') + '/>' + inner + '</svg>';
  const DOTS3 = '<circle cx="28" cy="13" r="4.5" fill="#23315C"/><circle cx="20" cy="27" r="4.5" fill="#23315C"/><circle cx="36" cy="27" r="4.5" fill="#23315C"/>';

  const VARIANTS = [
    { label: '1と2', nums: range(2), slot: 'num', block: 'num', hint: true, icon: txt('1-2') },
    { label: '1から3', nums: range(3), slot: 'num', block: 'num', hint: true, icon: txt('1-3') },
    { label: 'てんてんを すうじの わくへ', nums: range(3), slot: 'num', block: 'dots', hint: false, icon: mini(false, DOTS3) },
    { label: 'すうじを てんてんの わくへ', nums: range(3), slot: 'dots', block: 'num', hint: false, icon: mini(true, DOTS3) }
  ].concat([4, 5, 6, 7, 8, 9, 10].map((n) => (
    { label: '1から' + n, nums: range(n), slot: 'num', block: 'num', hint: true, icon: txt('1-' + n) }
  )));

  // 数に応じた大きさ（S: 枠の幅）
  function layout(n) {
    const gap = n <= 3 ? 70 : n <= 5 ? 30 : 14;
    const pad = n <= 5 ? 120 : 60;
    const S = Math.min(180, Math.floor((MAX_W - pad - (n - 1) * gap) / n));
    const SH = Math.min(200, Math.round(S * 1.11));
    const shelfW = n * S + (n - 1) * gap + pad;
    // 枠が小さいときは、たなの高さも詰める（下の余白を作りすぎない）
    const dot = n <= 5 ? 22 : Math.max(10, Math.floor(S / 7));
    const shelfH = n <= 5 ? 320 : Math.min(320, (SLOT_Y - SHELF_Y) + SH + 16 + dot * 2 + 4 + 36);
    return {
      n, gap, pad, S, SH, shelfW, shelfH, dot,
      shelfX: (1180 - shelfW) / 2,
      BW: S - 20,
      BH: SH - 20,
      snapAuto: S * 0.39,
      snapRelease: S * 0.64,
      ringShow: S,
      ring: Math.round(S * 1.6)
    };
  }

  function dotgrid(n) {
    let s = '<span class="dotgrid n' + n + '" aria-hidden="true">';
    for (let k = 0; k < n; k++) s += '<span></span>';
    return s + '</span>';
  }

  let root;
  let L = null;
  let slots = [];
  let blocks = [];
  let drag = null;
  let placedCount = 0;
  let timers = [];

  function setPos(b, x, y) {
    b.x = x;
    b.y = y;
    b.el.style.left = x + 'px';
    b.el.style.top = y + 'px';
  }

  const slotOf = (n) => slots.find((s) => s.n === n);

  function distTo(b, s) {
    return Math.hypot(b.x + L.BW / 2 - (s.x + L.S / 2), b.y + L.BH / 2 - (s.y + L.SH / 2));
  }

  function snap(b) {
    const s = slotOf(b.n);
    endDrag(b);
    b.placed = true;
    b.el.classList.add('anim', 'placed');
    b.el.style.zIndex = 5;
    setPos(b, s.x + (L.S - L.BW) / 2, s.y + (L.SH - L.BH) / 2);
    s.ring.classList.remove('on');
    api.sound.snap();
    api.say(WORDS[b.n]);
    placedCount++;
    if (placedCount === blocks.length) timers.push(setTimeout(() => api.done(), 500));
  }

  function goHome(b) {
    endDrag(b);
    b.el.classList.add('anim');
    b.el.style.zIndex = 10;
    setPos(b, b.homeX, b.homeY);
  }

  function endDrag(b) {
    b.el.classList.remove('dragging');
    slots.forEach((s) => s.ring.classList.remove('on'));
    drag = null;
  }

  function onDown(e, b) {
    if (b.placed || drag) return;
    e.preventDefault();
    const p = api.toStage(e);
    drag = { b, id: e.pointerId, ox: p.x - b.x, oy: p.y - b.y };
    try { b.el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    b.el.classList.remove('anim');
    b.el.classList.add('dragging');
    b.el.style.zIndex = 40;
    api.sound.tap();
  }

  function onMove(e, b) {
    if (!drag || drag.b !== b || drag.id !== e.pointerId) return;
    const p = api.toStage(e);
    setPos(b, Math.max(0, Math.min(1180 - L.BW, p.x - drag.ox)), Math.max(0, Math.min(820 - L.BH, p.y - drag.oy)));
    const s = slotOf(b.n);
    const d = distTo(b, s);
    s.ring.classList.toggle('on', d < L.ringShow);
    if (d < L.snapAuto) snap(b);
  }

  function onUp(e, b) {
    if (!drag || drag.b !== b || drag.id !== e.pointerId) return;
    if (distTo(b, slotOf(b.n)) < L.snapRelease) { snap(b); return; }
    const wrong = slots.some((s) => s.n !== b.n && distTo(b, s) < L.snapRelease);
    const cx = b.x + L.BW / 2;
    const cy = b.y + L.BH / 2;
    const onShelf = cx > L.shelfX && cx < L.shelfX + L.shelfW && cy > SHELF_Y && cy < SHELF_Y + L.shelfH;
    if (wrong || onShelf) api.miss(cx, cy);
    goHome(b);
  }

  register('numbers', {
    variants: VARIANTS,

    mount(play) {
      root = play;
    },

    start(i) {
      const v = VARIANTS[i];
      const n = v.nums.length;
      L = layout(n);
      root.innerHTML = '';
      slots = [];
      blocks = [];
      drag = null;
      placedCount = 0;

      const shelf = api.el('div', 'shelf');
      Object.assign(shelf.style, { left: L.shelfX + 'px', top: SHELF_Y + 'px', width: L.shelfW + 'px', height: L.shelfH + 'px' });
      const tray = api.el('div', 'tray');
      Object.assign(tray.style, { left: L.shelfX + 'px', top: TRAY_Y + 'px', width: L.shelfW + 'px', height: TRAY_H + 'px' });
      root.append(shelf, tray);

      const ghostFont = (num) => Math.round(L.S * (num >= 10 ? 0.5 : 0.78));
      const blockFont = (num) => Math.round(L.BW * (num >= 10 ? 0.56 : 0.8));
      const dot = L.dot;

      v.nums.forEach((num, k) => {
        const x = L.shelfX + L.pad / 2 + k * (L.S + L.gap);
        const ring = api.el('div', 'snapring');
        Object.assign(ring.style, {
          width: L.ring + 'px', height: L.ring + 'px',
          left: (x + L.S / 2 - L.ring / 2) + 'px', top: (SLOT_Y + L.SH / 2 - L.ring / 2) + 'px'
        });
        const slot = api.el('div', 'slot', v.slot === 'num' ? '<span class="ghost">' + num + '</span>' : dotgrid(num));
        Object.assign(slot.style, {
          left: x + 'px', top: SLOT_Y + 'px', width: L.S + 'px', height: L.SH + 'px',
          borderRadius: Math.round(L.S * 0.18) + 'px'
        });
        const ghost = slot.querySelector('.ghost');
        if (ghost) ghost.style.fontSize = ghostFont(num) + 'px';
        slot.setAttribute('aria-label', num + ' の わく');
        root.append(ring, slot);
        if (v.hint) {
          const hd = api.el('div', 'hint-dots', '<span></span>'.repeat(num));
          Object.assign(hd.style, {
            left: x + 'px', top: (SLOT_Y + L.SH + 16) + 'px', width: L.S + 'px',
            flexWrap: 'wrap', gap: (n <= 5 ? 10 : 4) + 'px', padding: '0 ' + Math.max(0, (L.S - (5 * dot + 4 * 4)) / 2) + 'px'
          });
          hd.querySelectorAll('span').forEach((d) => { d.style.width = d.style.height = dot + 'px'; });
          if (n <= 5) hd.style.padding = '0';
          root.appendChild(hd);
        }
        slots.push({ n: num, x, y: SLOT_Y, ring });
      });

      // トレイの並びは毎回シャッフル（正解順のままにはしない）
      let order = api.shuffle(v.nums);
      for (let t = 0; t < 10 && order.every((x, k) => x === v.nums[k]); t++) order = api.shuffle(v.nums);
      const spacing = L.shelfW / n;
      order.forEach((num, k) => {
        const el = api.el('div', 'block', v.block === 'num' ? String(num) : dotgrid(num));
        Object.assign(el.style, {
          background: COLORS[num], width: L.BW + 'px', height: L.BH + 'px',
          fontSize: blockFont(num) + 'px', borderRadius: Math.round(L.BW * 0.18) + 'px', zIndex: 10
        });
        if (n > 5) el.style.borderWidth = '4px';
        el.setAttribute('aria-label', num + ' の ブロック');
        const b = {
          n: num, el, placed: false, x: 0, y: 0,
          homeX: L.shelfX + spacing * (k + 0.5) - L.BW / 2,
          homeY: TRAY_Y + (TRAY_H - L.BH) / 2
        };
        setPos(b, b.homeX, b.homeY);
        el.addEventListener('pointerdown', (e) => onDown(e, b));
        el.addEventListener('pointermove', (e) => onMove(e, b));
        el.addEventListener('pointerup', (e) => onUp(e, b));
        el.addEventListener('pointercancel', () => { if (drag && drag.b === b) goHome(b); });
        root.appendChild(el);
        blocks.push(b);
      });
      api.say(n === 2 ? 'いち、に' : 'じゅんばんに ならべよう');
    },

    stop() {
      timers.forEach(clearTimeout);
      timers = [];
      drag = null;
    }
  });
})();
