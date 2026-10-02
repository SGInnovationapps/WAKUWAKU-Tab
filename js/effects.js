/* わくわくタブレット 全画面エフェクト
 *   success(x, y, opt) … 正解したとき：衝撃波リング＋星と紙吹雪の大爆発＋画面バウンド＋大きな文字
 *   miss(x, y, opt)    … 間違えたとき：画面ぐらぐら＋まわりが暗くなる＋「？」が飛び散る＋大きな文字
 *   clear(screenEl)    … ステージクリア：回転する光線＋連続花火＋紙吹雪の雨＋画面ジャンプ
 * 激しく動かすが、点滅（光の明滅）は使わない。視差効果を減らす設定の端末では控えめにする。
 */
(() => {
  'use strict';

  const W = 1180;
  const H = 820;
  const INK = '#23315C';
  const COLORS = ['#FFCC00', '#FF7A66', '#5BB6EE', '#8EDB9C', '#FF9AC1', '#B58CFF', '#FFFFFF'];
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const amount = (n) => (reduce ? Math.ceil(n / 4) : n);

  let back, front, canvas, ctx;
  let parts = [];
  let rings = [];
  let timers = [];
  let raf = 0;
  let lastT = 0;

  const STAR = (() => {
    if (typeof window.Path2D !== 'function') return null;
    const p = new Path2D();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? 1 : 0.45;
      const a = (-90 + k * 36) * Math.PI / 180;
      if (k === 0) p.moveTo(r * Math.cos(a), r * Math.sin(a)); else p.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    p.closePath();
    return p;
  })();

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

  /* ---------- 準備 ---------- */
  function init(stage) {
    back = document.createElement('div');
    back.id = 'fx-back';
    front = document.createElement('div');
    front.id = 'fx';
    canvas = document.createElement('canvas');
    front.appendChild(canvas);
    stage.append(back, front);
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

  /* ---------- 粒子アニメーション ---------- */
  function run() {
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); }
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    ctx.clearRect(0, 0, W, H);

    rings = rings.filter((r) => (r.age += dt) < r.life);
    for (const r of rings) {
      const k = r.age / r.life;
      const e = 1 - Math.pow(1 - k, 3);
      ctx.globalAlpha = 1 - k;
      ctx.lineWidth = r.width * (1 - k) + 2;
      ctx.strokeStyle = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, Math.PI * 2);
      ctx.stroke();
    }

    parts = parts.filter((p) => (p.age += dt) < p.life);
    for (const p of parts) {
      const d = Math.pow(p.drag, dt);
      p.vx *= d;
      p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      const k = p.age / p.life;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === 'rect') {
        ctx.scale(1, Math.cos(p.flip));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.strokeRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      } else if (p.kind === 'star' && STAR) {
        ctx.scale(p.size, p.size);
        ctx.fillStyle = p.color;
        ctx.fill(STAR);
        ctx.lineWidth = 2.5 / p.size;
        ctx.strokeStyle = INK;
        ctx.stroke(STAR);
      } else if (p.kind === 'dot' || p.kind === 'star') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'q') {
        // まるいバッジに「?」
        const r = p.size / 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.font = '900 ' + Math.round(p.size * 0.72) + 'px "Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, p.size * 0.04);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (parts.length || rings.length) raf = requestAnimationFrame(loop);
    else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }

  function particle(o) {
    parts.push(Object.assign({
      x: 0, y: 0, vx: 0, vy: 0, g: 900, drag: 0.35, life: 1.5, age: 0,
      size: 14, rot: rand(0, 6.28), vr: rand(-8, 8), flip: rand(0, 6.28), vf: rand(4, 12),
      kind: 'rect', color: pick(COLORS), text: ''
    }, o));
  }

  function explode(x, y, opt) {
    const o = Object.assign({ count: 90, min: 300, max: 1500, g: 900, life: [1.1, 1.9], kinds: ['rect', 'rect', 'star', 'dot'] }, opt);
    for (let i = 0; i < amount(o.count); i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(o.min, o.max);
      const kind = pick(o.kinds);
      particle({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - rand(0, 300), g: o.g,
        life: rand(o.life[0], o.life[1]), kind,
        size: kind === 'star' ? rand(14, 30) : kind === 'dot' ? rand(4, 9) : rand(14, 26),
        color: o.colors ? pick(o.colors) : pick(COLORS)
      });
    }
    run();
  }

  function shockwave(x, y, opt) {
    const o = Object.assign({ count: 3, r1: 950, colors: ['#FFCC00', '#FF7A66', '#5BB6EE'], width: 46, life: 0.75 }, opt);
    for (let i = 0; i < Math.min(o.count, reduce ? 1 : o.count); i++) {
      later(() => {
        rings.push({ x, y, r0: 20, r1: o.r1, age: 0, life: o.life, width: o.width, color: o.colors[i % o.colors.length] });
        run();
      }, i * 110);
    }
  }

  function rain(count, duration) {
    const n = amount(count);
    const ticks = Math.max(1, Math.round(duration / 80));
    for (let t = 0; t < ticks; t++) {
      later(() => {
        for (let i = 0; i < Math.ceil(n / ticks); i++) {
          const kind = Math.random() < 0.25 ? 'star' : 'rect';
          particle({
            x: rand(-20, W + 20), y: rand(-60, -10), vx: rand(-80, 80), vy: rand(180, 420),
            g: 160, drag: 0.9, life: rand(2.6, 3.6), kind, size: kind === 'star' ? rand(14, 26) : rand(16, 28)
          });
        }
        run();
      }, t * 80);
    }
  }

  /* ---------- DOM の演出 ---------- */
  function word(text, kind) {
    const el = document.createElement('div');
    el.className = 'fx-word ' + kind;
    el.textContent = text;
    // 長い言葉は画面幅に収まるよう小さく
    const base = kind === 'clear' ? 200 : 150;
    el.style.fontSize = Math.min(base, Math.floor(1060 / Array.from(text).length)) + 'px';
    el.addEventListener('animationend', () => el.remove());
    front.appendChild(el);
  }

  function shakeEl(el, cls) {
    if (!el || reduce) return;
    el.classList.remove('fx-shake', 'fx-bounce', 'fx-jump');
    void el.offsetWidth; // アニメーションを最初から
    el.classList.add(cls);
    el.addEventListener('animationend', function off(e) {
      if (e.target !== el) return;
      el.classList.remove(cls);
      el.removeEventListener('animationend', off);
    });
  }

  function addBack(cls, html) {
    const el = document.createElement('div');
    el.className = cls;
    if (html) el.innerHTML = html;
    el.addEventListener('animationend', (e) => { if (e.target === el) el.remove(); });
    back.appendChild(el);
    return el;
  }

  /* ---------- 公開する演出 ---------- */
  const GOOD = ['すごい！', 'いいね！', 'やったね！', 'じょうず！'];
  const BAD = ['あれれ？', 'おしい！', 'ちがうよ〜'];

  function success(x, y, opt) {
    const o = Object.assign({ word: pick(GOOD), bounce: true, screen: null }, opt);
    shockwave(x, y);
    explode(x, y);
    const glow = addBack('fx-glow');
    glow.style.left = x + 'px';
    glow.style.top = y + 'px';
    if (o.word) word(o.word, 'good');
    if (o.bounce) shakeEl(o.screen, 'fx-bounce');
  }

  function miss(x, y, opt) {
    const o = Object.assign({ word: pick(BAD), screen: null }, opt);
    shakeEl(o.screen, 'fx-shake');
    addBack('fx-vignette');
    shockwave(x, y, { count: 2, r1: 700, colors: ['#8FA3C7', '#5BB6EE'], width: 30, life: 0.6 });
    for (let i = 0; i < amount(16); i++) {
      particle({
        x, y, vx: rand(-520, 520), vy: rand(-900, -300), g: 1100, drag: 0.5, life: rand(1.0, 1.5),
        kind: 'q', size: rand(48, 96), color: pick(['#7CC4F2', '#FFFFFF', '#CDB6FF']), vr: rand(-3, 3)
      });
    }
    run();
    if (o.word) word(o.word, 'bad');
  }

  function clear(screen) {
    addBack('fx-sun', '<div></div>');
    shakeEl(screen, 'fx-jump');
    word('できたー！', 'clear');
    explode(W / 2, H * 0.46, { count: 160, max: 1900, life: [1.4, 2.2], kinds: ['star', 'star', 'rect', 'dot'] });
    shockwave(W / 2, H * 0.46, { count: 4, r1: 1300, life: 1 });
    const spots = [[0.18, 0.28], [0.82, 0.24], [0.3, 0.7], [0.72, 0.68], [0.5, 0.18], [0.12, 0.6], [0.9, 0.56]];
    spots.forEach((s, i) => later(() => {
      const x = W * s[0] + rand(-40, 40);
      const y = H * s[1] + rand(-40, 40);
      const c = pick(COLORS.slice(0, 6));
      shockwave(x, y, { count: 1, r1: 260, colors: [c], width: 18, life: 0.6 });
      explode(x, y, { count: 70, min: 150, max: 650, g: 260, life: [1.0, 1.6], colors: [c, '#FFFFFF', '#FFCC00'], kinds: ['dot', 'dot', 'star'] });
    }, 250 + i * 260));
    rain(240, 2600);
  }

  function cancel() {
    timers.forEach(clearTimeout);
    timers = [];
    parts = [];
    rings = [];
    if (back) back.innerHTML = '';
    if (front) front.querySelectorAll('.fx-word').forEach((w) => w.remove());
  }

  window.WakuFX = { init, setScale, success, miss, clear, cancel };
})();
