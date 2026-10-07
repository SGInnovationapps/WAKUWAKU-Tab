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
    { label: 'まる', d: 'M550 105A220 220 0 1 1 440 134.5', icon: pill('<circle cx="20" cy="14" r="10"/>') },
    { label: 'なみなみ', d: 'M110 330Q195 170 280 330T450 330T620 330T790 330T960 330', icon: pill('<path d="M3 14Q8 4 13 14T23 14T33 14T38 14"/>') },
    { label: 'さんかく', d: 'M550 105L820 535L280 535L520 150', icon: pill('<path d="M20 4L32 24H8L18 7"/>') },
    { label: 'しかく', d: 'M310 120L790 120L790 530L310 530L310 250', icon: pill('<path d="M8 4H32V24H8V8"/>') },
    { label: 'うずまき', d: 'M550 60 L570 62 L590 65 L610 69 L629 74 L648 80 L666 87 L683 94 L700 103 L716 112 L731 123 L746 134 L759 145 L772 157 L783 170 L793 183 L803 197 L811 211 L818 225 L824 240 L828 255 L832 270 L834 285 L836 300 L836 315 L835 330 L833 345 L829 359 L825 374 L820 388 L813 401 L806 414 L798 427 L789 439 L778 450 L768 461 L756 472 L744 481 L731 490 L717 498 L703 505 L689 512 L674 518 L659 523 L644 527 L628 530 L613 532 L597 534 L581 535 L565 535 L550 534 L535 532 L520 529 L505 526 L491 522 L477 517 L463 512 L450 506 L438 499 L426 492 L415 484 L405 476 L395 467 L386 458 L378 448 L371 438 L364 428 L359 417 L354 407 L350 396 L347 385 L345 374 L343 363 L343 352 L343 341 L344 330 L346 319 L349 309 L353 299 L357 289 L362 279 L368 270 L374 261 L381 253 L388 245 L397 237 L405 230 L414 224 L423 218 L433 213 L443 208 L453 204 L464 200 L475 197 L485 195 L496 193 L507 191 L518 191 L529 191 L539 191 L550 192 L560 194 L570 196 L580 199 L590 202 L599 205 L608 209 L616 214 L624 218 L631 224 L638 229 L645 235 L651 241 L656 247 L661 254 L665 261 L669 267 L672 274 L674 281 L676 288 L678 296 L678 303 L679 310 L678 317 L678 323 L676 330 L674 337 L672 343 L669 349 L666 355 L663 360 L659 366 L654 371 L650 375 L645 380 L639 384 L634 388 L628 391 L622 394 L616 397 L610 399 L604 401 L598 402 L592 403 L585 404 L579 405 L573 405 L567 405 L561 404 L556 403 L550 402 L545 401 L540 399 L535 397 L530 395 L526 392 L522 390 L518 387 L514 384 L511 381 L508 378', icon: pill('<path d="M20 3C30 3 34 10 33 15C32 22 25 25 19 24C13 23 10 18 12 13C14 9 19 8 22 11"/>') }
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
