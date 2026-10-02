/* ① なぞりがき
 * Canvas + Pointer Events で描画。ガイドの道に沿って進むほど進捗が伸び、
 * 9 割強まで到達したらクリア。判定はゆるめ（道の外側まで許容）。
 */
(() => {
  'use strict';
  const { api, register } = window.Wakuwaku;
  const NS = 'http://www.w3.org/2000/svg';

  const PAPER_X = 40;
  const PAPER_Y = 136;
  const PAPER_W = 1100;
  const PAPER_H = 650;
  const TOLERANCE = 68;   // 道の中心からの許容距離（道幅の半分 42 + 余裕）
  const LOOKAHEAD = 10;   // 先読みするサンプル数（1 サンプル ≒ 8px）。道をたどらない「飛び」では進まない
  const STEP = 8;
  const CLEAR_RATE = 0.94;

  const pill = (inner) => '<svg width="40" height="28" viewBox="0 0 40 28" fill="none" stroke="#23315C" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';

  const VARIANTS = [
    { label: 'よこの せん', d: 'M170 325L930 325', icon: pill('<path d="M6 14h28"/>') },
    { label: 'たての せん', d: 'M550 110L550 540', icon: pill('<path d="M20 4v20"/>') },
    { label: 'くねくね', d: 'M130 450C270 190 430 190 540 340S830 510 990 240', icon: pill('<path d="M4 18C12 4 20 4 20 14S28 24 36 10"/>') },
    { label: 'やま', d: 'M130 470L330 190L540 470L750 190L960 470', icon: pill('<path d="M4 22L12 6L20 22L28 6L36 22"/>') },
    { label: 'まる', d: 'M550 105A220 220 0 1 1 440 134.5', icon: pill('<circle cx="20" cy="14" r="10"/>') }
  ];

  function starPath(cx, cy, R, r) {
    let d = '';
    for (let k = 0; k < 10; k++) {
      const rad = k % 2 === 0 ? R : r;
      const a = (-90 + k * 36) * Math.PI / 180;
      d += (k === 0 ? 'M' : 'L') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }

  let guide, road, dots, canvas, ctx, marks, fx;
  let samples = [];
  let progress = 0;
  let finished = false;
  let active = null;
  let last = null;
  let mid = null;
  let lastSpark = null;
  let milestone = 0;
  let offRun = 0;      // 道から外れたまま進んだ距離
  let missed = false;  // 1 回のなぞりで「あれれ？」は 1 度だけ

  function sizeCanvas() {
    const ratio = Math.min(3, Math.max(2, Math.ceil((window.devicePixelRatio || 1) * api.scale)));
    canvas.width = PAPER_W * ratio;
    canvas.height = PAPER_H * ratio;
    ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#FF6B57';
    ctx.fillStyle = '#FF6B57';
  }

  function local(e) {
    const p = api.toStage(e);
    return { x: p.x - PAPER_X, y: p.y - PAPER_Y };
  }

  function clearDrawing() {
    sizeCanvas();
    progress = 0;
    finished = false;
    milestone = 0;
    active = null;
    lastSpark = null;
    offRun = 0;
    missed = false;
  }

  // dir: 線を引いている向き（単位ベクトル）。道の進む向きと大きくずれていたら進捗を伸ばさない
  function track(p, dir) {
    if (finished || !samples.length) return true;
    const end = Math.min(samples.length - 1, progress + LOOKAHEAD);
    let best = -1;
    let onPath = false;
    for (let i = Math.max(0, progress - 4); i <= end; i++) {
      const s = samples[i];
      if (Math.hypot(s.x - p.x, s.y - p.y) < TOLERANCE) {
        onPath = true;
        if (i > best) best = i;
      }
    }
    if (onPath && (!lastSpark || Math.hypot(lastSpark.x - p.x, lastSpark.y - p.y) > 30)) {
      lastSpark = p;
      api.sparkle(fx, p.x, p.y, 0.6 + Math.random() * 0.6);
    }
    if (best > progress && dir) {
      const a = samples[progress];
      const b = samples[Math.min(samples.length - 1, progress + 3)];
      const tl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      if ((dir.x * (b.x - a.x) + dir.y * (b.y - a.y)) / tl < 0.6) best = -1;
    }
    if (best > progress) {
      progress = Math.min(best, progress + 1);
      const rate = progress / (samples.length - 1);
      const step = Math.floor(rate * 4);
      if (step > milestone && rate < CLEAR_RATE) {
        milestone = step;
        api.sound.sparkle();
      }
      if (rate >= CLEAR_RATE) {
        finished = true;
        api.done();
      }
    }
    return onPath;
  }

  // 前回の点から今回の点までを 8px ごとに判定（速い線でも取りこぼさない）
  function trackSegment(a, b) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 0.5) return;
    const dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
    const n = Math.max(1, Math.ceil(len / STEP));
    for (let k = 1; k <= n; k++) {
      const pt = { x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n };
      if (track(pt, dir)) { offRun = 0; continue; }
      offRun += len / n;
      if (offRun > 170 && !missed && !finished) {
        missed = true;
        api.miss(pt.x + PAPER_X, pt.y + PAPER_Y);
      }
    }
  }

  function onDown(e) {
    if (active !== null) return;
    active = e.pointerId;
    offRun = 0;
    missed = false;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 古いブラウザ向け */ }
    const p = local(e);
    last = p;
    mid = p;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    track(p);
  }

  function onMove(e) {
    if (e.pointerId !== active) return;
    const list = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    for (const ev of list) {
      const p = local(ev);
      const m = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
      ctx.quadraticCurveTo(last.x, last.y, m.x, m.y);
      ctx.stroke();
      trackSegment(last, p);
      last = p;
      mid = m;
    }
  }

  function onUp(e) {
    if (e.pointerId !== active) return;
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    active = null;
  }

  register('tracing', {
    variants: VARIANTS,

    mount(play, screen) {
      const paper = api.el('div', 'paper');
      guide = document.createElementNS(NS, 'svg');
      guide.setAttribute('class', 'layer');
      guide.setAttribute('viewBox', '0 0 ' + PAPER_W + ' ' + PAPER_H);
      guide.setAttribute('aria-hidden', 'true');
      road = document.createElementNS(NS, 'path');
      road.setAttribute('fill', 'none');
      road.setAttribute('stroke', '#E3EEF7');
      road.setAttribute('stroke-width', '84');
      road.setAttribute('stroke-linecap', 'round');
      road.setAttribute('stroke-linejoin', 'round');
      dots = road.cloneNode();
      dots.setAttribute('stroke', '#8FA3C7');
      dots.setAttribute('stroke-width', '9');
      dots.setAttribute('stroke-dasharray', '0.1 26');
      guide.append(road, dots);

      canvas = document.createElement('canvas');
      canvas.className = 'layer';
      canvas.setAttribute('aria-label', 'みちに そって なぞろう');
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);

      marks = document.createElementNS(NS, 'svg');
      marks.setAttribute('class', 'layer marks');
      marks.setAttribute('viewBox', '0 0 ' + PAPER_W + ' ' + PAPER_H);
      marks.setAttribute('aria-hidden', 'true');

      fx = api.el('div', 'layer fx');
      paper.append(guide, canvas, marks, fx);
      play.appendChild(paper);

      const redo = api.el('button', 'tool', api.icons.redo);
      redo.type = 'button';
      redo.setAttribute('aria-label', 'かきなおす');
      redo.addEventListener('click', () => { api.sound.tap(); clearDrawing(); });
      screen.appendChild(redo);
    },

    start(i) {
      const v = VARIANTS[i];
      road.setAttribute('d', v.d);
      dots.setAttribute('d', v.d);
      const len = road.getTotalLength();
      samples = [];
      for (let s = 0; s <= len; s += STEP) {
        const pt = road.getPointAtLength(s);
        samples.push({ x: pt.x, y: pt.y });
      }
      const endPt = road.getPointAtLength(len);
      samples.push({ x: endPt.x, y: endPt.y });
      const a = samples[0];
      const b = samples[samples.length - 1];
      // すすむ向きの矢印（スタートの少し先）
      const p1 = road.getPointAtLength(Math.min(len * 0.35, 96));
      const p2 = road.getPointAtLength(Math.min(len * 0.35, 96) + 2);
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      const arrow = '<path d="M-12 -16L8 0L-12 16" transform="translate(' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')" fill="none" stroke="#4CB963" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
      marks.innerHTML = arrow +
        '<g class="start-dot"><circle cx="' + a.x + '" cy="' + a.y + '" r="40" fill="#4CB963" stroke="#23315C" stroke-width="5"/>' +
        '<circle cx="' + a.x + '" cy="' + a.y + '" r="13" fill="#FFFFFF"/></g>' +
        '<path d="' + starPath(b.x, b.y, 52, 23) + '" fill="#FFCC00" stroke="#23315C" stroke-width="5" stroke-linejoin="round"/>';
      fx.innerHTML = '';
      clearDrawing();
      api.say(v.label);
    },

    stop() { active = null; }
  });
})();
