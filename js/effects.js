/* わくわくタブレット エフェクト（幼児向けに刺激をおさえた版）
 *   maru()      … ステージクリア：大きな「〇」を描く＋紙吹雪がゆっくり降る
 *   ok(x, y)    … 神経衰弱でペアがそろったとき：そのカードの上に小さめの「〇」
 *   batsu(x, y) … できなかったとき：その場所に小さめの「×」を出すだけ（画面はゆらさない）
 * 操作中（正解したその場）の演出はなし。点滅・画面のゆれ・強い光は使わない。
 */
(() => {
  'use strict';

  const W = 1180;
  const H = 820;
  const INK = '#23315C';
  const COLORS = ['#FFCC00', '#FF7A66', '#5BB6EE', '#8EDB9C', '#FF9AC1', '#C9A8FF'];
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let layer, canvas, ctx;
  let parts = [];
  let timers = [];
  let raf = 0;
  let lastT = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  function init(stage) {
    layer = document.createElement('div');
    layer.id = 'fx';
    canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    stage.appendChild(layer);
    setScale(1);
  }

  function setScale(scale) {
    if (!canvas) return;
    const ratio = Math.min(2.5, Math.max(1, (window.devicePixelRatio || 1) * scale));
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /* ---------- 紙吹雪（上からゆっくり、ゆらゆら落ちる） ---------- */
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => (p.age += dt) < p.life);
    for (const p of parts) {
      p.y += p.vy * dt;
      p.x += p.vx * dt + Math.sin(p.age * p.sw + p.ph) * 30 * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      const k = p.age / p.life;
      ctx.globalAlpha = k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flip));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = INK;
      ctx.strokeRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }

  function confetti(count, duration) {
    const n = reduce ? Math.ceil(count / 3) : count;
    const ticks = Math.max(1, Math.round(duration / 100));
    for (let t = 0; t < ticks; t++) {
      later(() => {
        for (let i = 0; i < Math.ceil(n / ticks); i++) {
          parts.push({
            x: rand(0, W), y: rand(-40, -10), vx: rand(-25, 25), vy: rand(110, 190),
            sw: rand(1.5, 3), ph: rand(0, 6.28), rot: rand(0, 6.28), vr: rand(-2.5, 2.5),
            flip: rand(0, 6.28), vf: rand(3, 6), size: rand(14, 22), color: pick(COLORS),
            age: 0, life: rand(4, 5.5)
          });
        }
        if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); }
      }, t * 100);
    }
  }

  /* ---------- 〇 と × ---------- */
  // 〇×の表示。CSS のアニメーション終了に頼らず、決まった時間で必ず消す
  // （CSS が古いまま・読み込めていない端末でも出しっぱなしにならないように）
  const C = 'translate(-50%, -50%)';
  const FRAMES = {
    maru: { size: 300, duration: 1600, frames: [
      { transform: C, opacity: 1 },
      { transform: C, opacity: 1, offset: 0.75 },
      { transform: C, opacity: 0 }
    ] },
    ok: { size: 130, duration: 1000, frames: [
      { transform: C + ' scale(0.7)', opacity: 0 },
      { transform: C + ' scale(1)', opacity: 1, offset: 0.2 },
      { transform: C + ' scale(1)', opacity: 1, offset: 0.7 },
      { transform: C + ' scale(1)', opacity: 0 }
    ] },
    batsu: { size: 140, duration: 1000, frames: [
      { transform: C + ' scale(0.6)', opacity: 0 },
      { transform: C + ' scale(1)', opacity: 1, offset: 0.15 },
      { transform: C + ' rotate(-4deg)', opacity: 1, offset: 0.3 },
      { transform: C + ' rotate(4deg)', opacity: 1, offset: 0.45 },
      { transform: C + ' rotate(0deg)', opacity: 1, offset: 0.6 },
      { transform: C + ' rotate(0deg)', opacity: 0 }
    ] }
  };

  function mark(svg, cls, x, y) {
    const f = FRAMES[cls];
    const el = document.createElement('div');
    el.className = 'fx-mark ' + cls;
    el.innerHTML = svg;
    Object.assign(el.style, {
      position: 'absolute', left: x + 'px', top: y + 'px',
      width: f.size + 'px', height: f.size + 'px', transform: C, animation: 'none'
    });
    layer.appendChild(el);
    let gone = false;
    const remove = () => { if (!gone) { gone = true; el.remove(); } };
    if (typeof el.animate === 'function' && !reduce) {
      const a = el.animate(f.frames, { duration: f.duration, easing: 'ease', fill: 'forwards' });
      a.onfinish = remove;
    } else {
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => { el.style.opacity = '0'; }, f.duration - 300);
    }
    setTimeout(remove, f.duration + 150); // 念のための保険
  }

  const MARU = '<svg width="100%" height="100%" viewBox="0 0 200 200" aria-hidden="true">' +
    '<circle class="ring" cx="100" cy="100" r="72" pathLength="1" fill="none" stroke="' + INK + '" stroke-width="36" stroke-linecap="round" transform="rotate(-90 100 100)"/>' +
    '<circle class="ring" cx="100" cy="100" r="72" pathLength="1" fill="none" stroke="#FF5E4D" stroke-width="24" stroke-linecap="round" transform="rotate(-90 100 100)"/></svg>';
  const BATSU = '<svg width="100%" height="100%" viewBox="0 0 200 200" aria-hidden="true">' +
    '<path d="M52 52L148 148M148 52L52 148" fill="none" stroke="' + INK + '" stroke-width="40" stroke-linecap="round"/>' +
    '<path d="M52 52L148 148M148 52L52 148" fill="none" stroke="#5B8FD8" stroke-width="26" stroke-linecap="round"/></svg>';

  function maru() {
    mark(MARU, 'maru', W / 2, H * 0.45);
    confetti(140, 2200);
  }

  function ok(x, y) {
    mark(MARU, 'ok', Math.max(70, Math.min(W - 70, x)), Math.max(70, Math.min(H - 70, y)));
  }

  function batsu(x, y) {
    const cx = Math.max(90, Math.min(W - 90, x));
    const cy = Math.max(90, Math.min(H - 90, y));
    layer.querySelectorAll('.fx-mark.batsu').forEach((m) => m.remove());
    mark(BATSU, 'batsu', cx, cy);
  }

  function cancel() {
    timers.forEach(clearTimeout);
    timers = [];
    parts = [];
    if (layer) layer.querySelectorAll('.fx-mark').forEach((m) => m.remove());
  }

  window.WakuFX = { init, setScale, maru, ok, batsu, cancel };
})();
