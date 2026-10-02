/* ③ かずならべ
 * 下のトレイのブロックを、上のたなの正しい枠へドラッグ。
 * 正しい枠に近づくと「スポッ」と吸い込まれる。違う枠や途中で離すとトレイへ戻る。
 */
(() => {
  'use strict';
  const { api, register } = window.Wakuwaku;

  const SLOT_W = 180;
  const SLOT_H = 200;
  const BLOCK_W = 160;
  const BLOCK_H = 180;
  const SHELF_Y = 140;
  const SLOT_Y = 180;
  const TRAY_Y = 580;
  const HOME_Y = 590;
  const SNAP_AUTO = 70;     // ドラッグ中、この距離まで近づいたら自動で吸着
  const SNAP_RELEASE = 115; // 離したとき、この距離以内なら吸着
  const RING_SHOW = 180;

  const COLORS = { 1: '#5BB6EE', 2: '#FFCC00', 3: '#FF7A66', 4: '#8EDB9C' };
  const WORDS = { 1: 'いち', 2: 'に', 3: 'さん', 4: 'よん' };

  const txt = (s) => '<span aria-hidden="true">' + s + '</span>';
  const mini = (dashed, inner) => '<svg width="56" height="40" viewBox="0 0 56 40" aria-hidden="true"><rect x="3" y="3" width="50" height="34" rx="9" fill="' + (dashed ? '#FFFFFF' : '#FF7A66') + '" stroke="#23315C" stroke-width="3"' + (dashed ? ' stroke-dasharray="5 4"' : '') + '/>' + inner + '</svg>';
  const DOTS3 = '<circle cx="28" cy="13" r="4.5" fill="#23315C"/><circle cx="20" cy="27" r="4.5" fill="#23315C"/><circle cx="36" cy="27" r="4.5" fill="#23315C"/>';

  const VARIANTS = [
    { label: '1と2', nums: [1, 2], slot: 'num', block: 'num', hint: true, icon: txt('12') },
    { label: '1から3', nums: [1, 2, 3], slot: 'num', block: 'num', hint: true, icon: txt('123') },
    { label: 'てんてんを すうじの わくへ', nums: [1, 2, 3], slot: 'num', block: 'dots', hint: false, icon: mini(false, DOTS3) },
    { label: 'すうじを てんてんの わくへ', nums: [1, 2, 3], slot: 'dots', block: 'num', hint: false, icon: mini(true, DOTS3) },
    { label: '1から4', nums: [1, 2, 3, 4], slot: 'num', block: 'num', hint: true, icon: txt('1234') }
  ];

  function dotgrid(n) {
    let s = '<span class="dotgrid n' + n + '" aria-hidden="true">';
    for (let k = 0; k < n; k++) s += '<span></span>';
    return s + '</span>';
  }

  let root;
  let slots = [];
  let blocks = [];
  let drag = null;
  let placedCount = 0;
  let timers = [];
  let shelfRect = null;

  function setPos(b, x, y) {
    b.x = x;
    b.y = y;
    b.el.style.left = x + 'px';
    b.el.style.top = y + 'px';
  }

  function slotOf(n) { return slots.find((s) => s.n === n); }

  function distTo(b, s) {
    return Math.hypot(b.x + BLOCK_W / 2 - (s.x + SLOT_W / 2), b.y + BLOCK_H / 2 - (s.y + SLOT_H / 2));
  }

  function snap(b) {
    const s = slotOf(b.n);
    endDrag(b);
    b.placed = true;
    b.el.classList.add('anim', 'placed');
    b.el.style.zIndex = 5;
    setPos(b, s.x + (SLOT_W - BLOCK_W) / 2, s.y + (SLOT_H - BLOCK_H) / 2);
    s.ring.classList.remove('on');
    api.sound.snap();
    api.say(WORDS[b.n]);
    placedCount++;
    const last = placedCount === blocks.length;
    const words = ['ぴったり！', 'すごい！', 'せいかい！'];
    api.success(s.x + SLOT_W / 2, s.y + SLOT_H / 2, { word: last ? null : words[Math.floor(Math.random() * words.length)] });
    if (last) timers.push(setTimeout(() => api.done(), 500));
  }

  function goHome(b) {
    endDrag(b);
    b.el.classList.add('anim');
    b.el.style.zIndex = 10;
    setPos(b, b.homeX, HOME_Y);
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
    setPos(b, Math.max(0, Math.min(1180 - BLOCK_W, p.x - drag.ox)), Math.max(0, Math.min(820 - BLOCK_H, p.y - drag.oy)));
    const s = slotOf(b.n);
    const d = distTo(b, s);
    s.ring.classList.toggle('on', d < RING_SHOW);
    if (d < SNAP_AUTO) snap(b);
  }

  function onUp(e, b) {
    if (!drag || drag.b !== b || drag.id !== e.pointerId) return;
    if (distTo(b, slotOf(b.n)) < SNAP_RELEASE) { snap(b); return; }
    const wrong = slots.some((s) => s.n !== b.n && distTo(b, s) < SNAP_RELEASE);
    const cx = b.x + BLOCK_W / 2;
    const cy = b.y + BLOCK_H / 2;
    const onShelf = cx > shelfRect.x && cx < shelfRect.x + shelfRect.w && cy > shelfRect.y && cy < shelfRect.y + shelfRect.h;
    if (wrong || onShelf) api.miss(cx, cy, { word: wrong ? 'ちがう わくだよ' : 'あれれ？' });
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
      const gap = n >= 4 ? 40 : 70;
      const rowW = n * SLOT_W + (n - 1) * gap;
      const shelfW = rowW + 120;
      const shelfX = (1180 - shelfW) / 2;
      root.innerHTML = '';
      slots = [];
      blocks = [];
      drag = null;
      placedCount = 0;

      shelfRect = { x: shelfX, y: SHELF_Y, w: shelfW, h: 320 };
      const shelf = api.el('div', 'shelf');
      Object.assign(shelf.style, { left: shelfX + 'px', top: SHELF_Y + 'px', width: shelfW + 'px', height: '320px' });
      const tray = api.el('div', 'tray');
      Object.assign(tray.style, { left: shelfX + 'px', top: TRAY_Y + 'px', width: shelfW + 'px', height: '200px' });
      root.append(shelf, tray);

      v.nums.forEach((num, k) => {
        const x = shelfX + 60 + k * (SLOT_W + gap);
        const ring = api.el('div', 'snapring');
        ring.style.left = (x + SLOT_W / 2 - 145) + 'px';
        ring.style.top = (SLOT_Y + SLOT_H / 2 - 145) + 'px';
        const slot = api.el('div', 'slot', v.slot === 'num' ? '<span class="ghost">' + num + '</span>' : dotgrid(num));
        slot.style.left = x + 'px';
        slot.style.top = SLOT_Y + 'px';
        slot.setAttribute('aria-label', num + ' の わく');
        root.append(ring, slot);
        if (v.hint) {
          const hd = api.el('div', 'hint-dots', '<span></span>'.repeat(num));
          hd.style.left = x + 'px';
          hd.style.top = (SLOT_Y + SLOT_H + 20) + 'px';
          root.appendChild(hd);
        }
        slots.push({ n: num, x, y: SLOT_Y, ring });
      });

      // トレイの並びは毎回シャッフル（正解順のままにはしない）
      let order = api.shuffle(v.nums);
      for (let t = 0; t < 10 && order.every((x, k) => x === v.nums[k]); t++) order = api.shuffle(v.nums);
      const spacing = shelfW / n;
      order.forEach((num, k) => {
        const el = api.el('div', 'block', v.block === 'num' ? String(num) : dotgrid(num));
        el.style.background = COLORS[num];
        el.style.zIndex = 10;
        el.setAttribute('aria-label', num + ' の ブロック');
        const b = { n: num, el, homeX: shelfX + spacing * (k + 0.5) - BLOCK_W / 2, placed: false, x: 0, y: 0 };
        setPos(b, b.homeX, HOME_Y);
        el.addEventListener('pointerdown', (e) => onDown(e, b));
        el.addEventListener('pointermove', (e) => onMove(e, b));
        el.addEventListener('pointerup', (e) => onUp(e, b));
        el.addEventListener('pointercancel', (e) => { if (drag && drag.b === b) goHome(b); });
        root.appendChild(el);
        blocks.push(b);
      });
      api.say(v.nums.length === 2 ? 'いち、に' : 'じゅんばんに ならべよう');
    },

    stop() {
      timers.forEach(clearTimeout);
      timers = [];
      drag = null;
    }
  });
})();
