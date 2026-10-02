/* わくわくタブレット 全体コントローラー
 * - 1180×820 の「舞台」を画面サイズに合わせて拡大縮小
 * - メニュー ⇔ 各コンテンツの表示切替（ページ遷移なし）
 * - ホームボタン 2 秒長押し → 確認 → メニューへ
 * - 効果音（Web Audio で合成）・読み上げ（speechSynthesis）
 * - ステージ（バリエーション）切替と「やったね！」演出
 */
(() => {
  'use strict';

  const W = 1180;
  const H = 820;
  const HOLD_MS = 2000;

  /* ---------- 保存 ---------- */
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('wakuwaku:' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('wakuwaku:' + key, JSON.stringify(value)); } catch (e) { /* 保存できなくても動作は続ける */ }
    }
  };

  const settings = {
    sound: store.get('sound', true),
    voice: store.get('voice', true)
  };

  /* ---------- 効果音（音源ファイルなしでオフライン動作） ---------- */
  let actx = null;
  function audioCtx() {
    try {
      if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        actx = new AC();
      }
      if (actx.state === 'suspended' && actx.resume) actx.resume();
    } catch (e) { return null; }
    return actx;
  }
  function tone(freq, start, dur, opt) {
    try { toneUnsafe(freq, start, dur, opt); } catch (e) { /* 音が出なくても操作は続ける */ }
  }
  function toneUnsafe(freq, start, dur, opt) {
    const o = Object.assign({ type: 'sine', gain: 0.18, to: null }, opt);
    const a = audioCtx();
    if (!a) return;
    const t0 = a.currentTime + start;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }
  const play = (fn) => { if (settings.sound) fn(); };
  const sound = {
    tap: () => play(() => tone(660, 0, 0.08, { type: 'triangle', gain: 0.12 })),
    flip: () => play(() => tone(520, 0, 0.14, { type: 'triangle', gain: 0.14, to: 900 })),
    snap: () => play(() => { tone(880, 0, 0.12, { gain: 0.25, to: 1320 }); tone(1760, 0.05, 0.1, { gain: 0.08 }); }),
    ok: () => play(() => { [784, 988, 1175].forEach((f, i) => tone(f, i * 0.09, 0.2, { type: 'triangle', gain: 0.16 })); }),
    miss: () => play(() => {
      tone(440, 0, 0.18, { gain: 0.2, to: 220 });
      tone(330, 0.17, 0.3, { gain: 0.2, to: 150 });
      tone(160, 0, 0.45, { type: 'triangle', gain: 0.12, to: 90 });
    }),
    cheer: () => play(() => {
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.05, 0.22, { type: 'triangle', gain: 0.1 }));
      tone(196, 0, 0.25, { gain: 0.18, to: 392 });
    }),
    sparkle: () => play(() => tone(1600 + Math.random() * 800, 0, 0.07, { type: 'triangle', gain: 0.05 })),
    fanfare: () => play(() => {
      [523, 659, 784].forEach((f, i) => tone(f, i * 0.12, 0.28, { type: 'triangle', gain: 0.17 }));
      tone(1047, 0.36, 0.7, { type: 'triangle', gain: 0.2 });
    })
  };

  /* ---------- 読み上げ ---------- */
  let jaVoice = null;
  const hasSpeech = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  function pickVoice() {
    try {
      const voices = speechSynthesis.getVoices() || [];
      jaVoice = voices.find((v) => /^ja/i.test(v.lang)) || null;
    } catch (e) { jaVoice = null; }
  }
  if (hasSpeech) {
    pickVoice();
    try {
      if (typeof speechSynthesis.addEventListener === 'function') speechSynthesis.addEventListener('voiceschanged', pickVoice);
      else speechSynthesis.onvoiceschanged = pickVoice;
    } catch (e) { /* 声の一覧が取れなくても既定の声で読む */ }
  }
  function hush() {
    try { if (hasSpeech) speechSynthesis.cancel(); } catch (e) { /* noop */ }
  }
  function say(text) {
    if (!settings.voice || !hasSpeech) return;
    try {
      if (!jaVoice) pickVoice();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP';
      u.rate = 0.9;
      u.pitch = 1.25;
      if (jaVoice) u.voice = jaVoice;
      speechSynthesis.speak(u);
    } catch (e) { /* 読み上げできなくても操作は続ける */ }
  }

  /* ---------- 舞台のフィット ---------- */
  let stage, fitEl, scale = 1;
  function fit() {
    const r = fitEl.getBoundingClientRect();
    scale = Math.min(r.width / W, r.height / H) || 1;
    stage.style.setProperty('--scale', scale);
    if (window.WakuFX) WakuFX.setScale(scale);
  }
  function toStage(e) {
    const r = stage.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }

  /* ---------- 小物 ---------- */
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const STAR = '<svg width="30" height="30" viewBox="-22 -22 44 44" aria-hidden="true"><path d="M0-18L5-5L18 0L5 5L0 18L-5 5L-18 0L-5-5Z" fill="#FFCC00" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/></svg>';
  function sparkle(layer, x, y, size) {
    const s = el('div', 'sparkle', STAR);
    const k = size || 1;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.width = s.style.height = 30 * k + 'px';
    s.style.margin = (-15 * k) + 'px 0 0 ' + (-15 * k) + 'px';
    s.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
    s.style.setProperty('--dy', (Math.random() * -30 - 10) + 'px');
    s.addEventListener('animationend', () => s.remove());
    layer.appendChild(s);
  }

  const ICON_HOUSE = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#23315C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/></svg>';
  const ICON_REDO = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#23315C" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/></svg>';

  /* ---------- コンテンツ登録 ---------- */
  const contents = {};
  const built = {};
  const current = store.get('current', {});
  const cleared = store.get('cleared', {});
  let activeId = null;
  let finishing = false;

  function done() {
    if (finishing || !activeId) return;
    finishing = true;
    const i = current[activeId] || 0;
    cleared[activeId] = cleared[activeId] || [];
    if (!cleared[activeId].includes(i)) cleared[activeId].push(i);
    store.set('cleared', cleared);
    refreshStages(activeId);
    const screen = document.getElementById(activeId);
    setTimeout(() => {
      if (!activeId) return;
      sound.fanfare();
      say('できたー！');
      if (window.WakuFX) WakuFX.clear(screen);
    }, 250);
    setTimeout(() => { if (activeId) showCelebrate(); }, 1700);
  }

  // 正解・間違いの全画面演出（x, y は舞台座標）
  function success(x, y, opt) {
    sound.cheer();
    if (window.WakuFX) WakuFX.success(x, y, Object.assign({ screen: activeId && document.getElementById(activeId) }, opt));
  }
  function miss(x, y, opt) {
    sound.miss();
    if (window.WakuFX) WakuFX.miss(x, y, Object.assign({ screen: activeId && document.getElementById(activeId) }, opt));
  }

  const api = {
    sound, say, toStage, el, shuffle, sparkle, done, success, miss,
    icons: { redo: ICON_REDO },
    get scale() { return scale; }
  };
  window.Wakuwaku = {
    api,
    register(id, mod) { contents[id] = mod; }
  };

  /* ---------- ホームボタン（2 秒長押し） ---------- */
  function homeButton() {
    const b = el('button', 'home', '<span>' + ICON_HOUSE + '</span>');
    b.type = 'button';
    b.setAttribute('aria-label', 'ホーム（2秒間長押しでメニューへ）');
    let raf = 0;
    let t0 = 0;
    const reset = () => { cancelAnimationFrame(raf); raf = 0; b.style.setProperty('--hold', 0); };
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / HOLD_MS);
      b.style.setProperty('--hold', p);
      if (p >= 1) { reset(); openConfirm(); } else { raf = requestAnimationFrame(step); }
    };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (raf) return;
      t0 = performance.now();
      raf = requestAnimationFrame(step);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => b.addEventListener(t, () => { if (raf) reset(); }));
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    return b;
  }

  /* ---------- 画面の組み立て ---------- */
  function build(id) {
    const mod = contents[id];
    const screen = document.getElementById(id);
    screen.innerHTML = '';
    const playArea = el('div', 'play');
    screen.appendChild(playArea);
    screen.appendChild(homeButton());
    const nav = el('nav', 'stages');
    nav.setAttribute('aria-label', 'ステージ');
    mod.variants.forEach((v, i) => {
      const b = el('button', '', v.icon);
      b.type = 'button';
      b.setAttribute('aria-label', (i + 1) + '：' + v.label);
      b.addEventListener('click', () => {
        if (i === (current[id] || 0)) return;
        sound.tap();
        startVariant(id, i);
      });
      nav.appendChild(b);
    });
    screen.appendChild(nav);
    mod.mount(playArea, screen);
    built[id] = { nav };
  }

  function refreshStages(id) {
    if (!built[id]) return;
    const cur = current[id] || 0;
    const done = cleared[id] || [];
    Array.from(built[id].nav.children).forEach((b, i) => {
      b.classList.toggle('current', i === cur);
      b.classList.toggle('cleared', done.includes(i) && i !== cur);
      if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }

  function startVariant(id, i) {
    const mod = contents[id];
    if (mod.stop) mod.stop();
    if (window.WakuFX) WakuFX.cancel();
    hideCelebrate();
    finishing = false;
    current[id] = i;
    store.set('current', current);
    refreshStages(id);
    mod.start(i);
  }

  function open(id) {
    if (!contents[id]) { report('コンテンツが読み込まれていません: ' + id); return; }
    document.getElementById('menu').classList.remove('active');
    const screen = document.getElementById(id);
    screen.classList.add('active');
    activeId = id;
    try {
      if (!built[id]) build(id);
      startVariant(id, Math.min(current[id] || 0, contents[id].variants.length - 1));
    } catch (e) {
      report(e);
    }
  }

  function close() {
    if (activeId && contents[activeId].stop) contents[activeId].stop();
    hush();
    if (window.WakuFX) WakuFX.cancel();
    if (activeId) document.getElementById(activeId).classList.remove('active');
    activeId = null;
    finishing = false;
    hideCelebrate();
    document.getElementById('confirm').hidden = true;
    document.getElementById('menu').classList.add('active');
  }

  /* ---------- オーバーレイ ---------- */
  function showCelebrate() {
    document.getElementById('celebrate').hidden = false;
  }
  function hideCelebrate() { document.getElementById('celebrate').hidden = true; }
  function openConfirm() { sound.tap(); document.getElementById('confirm').hidden = false; }

  function syncSettings() {
    document.querySelectorAll('[data-setting]').forEach((b) => {
      b.setAttribute('aria-pressed', settings[b.dataset.setting] ? 'true' : 'false');
    });
  }

  /* ---------- エラー表示（index.html の起動チェックが画面に出す） ---------- */
  function report(err) {
    if (window.console) console.error(err);
    if (typeof window.__wkReport === 'function') window.__wkReport(err && err.message ? err.message : String(err));
  }

  /* ---------- 起動 ---------- */
  function init() {
    stage = document.getElementById('stage');
    fitEl = document.getElementById('fit');
    if (window.WakuFX) WakuFX.init(stage);
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', () => setTimeout(fit, 200));

    // iPad のピンチ・長押しメニュー・スクロールを抑止
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault());
    // 最初のタッチで音声を有効化（iOS の自動再生制限対策）
    document.addEventListener('pointerdown', () => audioCtx(), { once: true });

    document.querySelectorAll('[data-open]').forEach((b) => {
      b.addEventListener('click', () => { open(b.dataset.open); sound.tap(); });
    });

    stage.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const act = t.dataset.action;
      if (act === 'retry') { sound.tap(); startVariant(activeId, current[activeId] || 0); }
      if (act === 'next') {
        sound.tap();
        const n = contents[activeId].variants.length;
        startVariant(activeId, ((current[activeId] || 0) + 1) % n);
      }
      if (act === 'stay') { sound.tap(); document.getElementById('confirm').hidden = true; }
      if (act === 'leave') { sound.tap(); close(); }
      if (act === 'settings') { sound.tap(); syncSettings(); document.getElementById('settings').hidden = false; }
      if (act === 'close-settings') { sound.tap(); document.getElementById('settings').hidden = true; }
      if (act === 'reset-progress') {
        Object.keys(cleared).forEach((k) => delete cleared[k]);
        Object.keys(current).forEach((k) => delete current[k]);
        store.set('cleared', cleared);
        store.set('current', current);
        Object.keys(built).forEach(refreshStages);
        sound.ok();
      }
    });

    document.querySelectorAll('[data-setting]').forEach((b) => {
      b.addEventListener('click', () => {
        const k = b.dataset.setting;
        settings[k] = !settings[k];
        store.set(k, settings[k]);
        syncSettings();
        if (k === 'sound') sound.tap();
        if (k === 'voice') say('よみあげ、オン');
      });
    });
    syncSettings();

    try {
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
    } catch (e) { /* オフライン化できない環境でも遊べる */ }
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    try {
      init();
      window.Wakuwaku.ready = true;
    } catch (e) {
      report(e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else setTimeout(start, 0); // 後から読み込まれた場合も、残りのスクリプトの登録を待ってから起動
})();
