/* ② しんけいすいじゃく
 * 4 枚（2 ペア）→ 6 枚（3 ペア）と少しずつ増える 5 セット。
 * めくると名前（どうぶつは鳴き声つき）を読み上げ、そろうとスタンプ。
 */
(() => {
  'use strict';
  const { api, register } = window.Wakuwaku;

  const K = 'stroke="#23315C" stroke-width="4" stroke-linejoin="round"';
  const svg = (inner, size) => '<svg width="' + (size || 136) + '" height="' + (size || 136) + '" viewBox="0 0 120 120" aria-hidden="true">' + inner + '</svg>';

  const ITEMS = {
    dog: { name: 'いぬ', voice: 'わんわん、いぬ', art:
      '<ellipse cx="28" cy="54" rx="14" ry="26" transform="rotate(20 28 54)" fill="#9C6B3F" ' + K + '/><ellipse cx="92" cy="54" rx="14" ry="26" transform="rotate(-20 92 54)" fill="#9C6B3F" ' + K + '/><circle cx="60" cy="64" r="38" fill="#F2C48D" ' + K + '/><ellipse cx="60" cy="82" rx="18" ry="13" fill="#FFF3E0" stroke="#23315C" stroke-width="3"/><circle cx="46" cy="58" r="5" fill="#23315C"/><circle cx="74" cy="58" r="5" fill="#23315C"/><ellipse cx="60" cy="76" rx="7" ry="5" fill="#23315C"/><path d="M60 81v5M52 88q8 6 16 0" stroke="#23315C" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    cat: { name: 'ねこ', voice: 'にゃーん、ねこ', art:
      '<path d="M26 50L30 14L54 34Z" fill="#BFC7D6" ' + K + '/><path d="M94 50L90 14L66 34Z" fill="#BFC7D6" ' + K + '/><circle cx="60" cy="64" r="38" fill="#BFC7D6" ' + K + '/><ellipse cx="46" cy="60" rx="4.5" ry="6.5" fill="#23315C"/><ellipse cx="74" cy="60" rx="4.5" ry="6.5" fill="#23315C"/><path d="M55 72h10l-5 6Z" fill="#FF7A66" stroke="#23315C" stroke-width="2" stroke-linejoin="round"/><path d="M60 78q-6 6-12 2M60 78q6 6 12 2M14 68h20M16 80l18-5M106 68H86M104 80l-18-5" stroke="#23315C" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    ele: { name: 'ぞう', voice: 'ぱおーん、ぞう', art:
      '<circle cx="24" cy="56" r="24" fill="#8FB7E0" ' + K + '/><circle cx="96" cy="56" r="24" fill="#8FB7E0" ' + K + '/><circle cx="60" cy="54" r="34" fill="#A9CBEB" ' + K + '/><path d="M50 70C50 92 54 110 68 108C75 107 75 98 68 98C62 98 62 90 66 70Z" fill="#A9CBEB" ' + K + '/><circle cx="47" cy="50" r="5" fill="#23315C"/><circle cx="73" cy="50" r="5" fill="#23315C"/>' },
    apple: { name: 'りんご', voice: 'りんご', art:
      '<path d="M60 38C44 26 18 32 18 62C18 92 40 108 60 100C80 108 102 92 102 62C102 32 76 26 60 38Z" fill="#FF5E4D" ' + K + '/><path d="M60 38C59 28 62 20 68 14" stroke="#7A4E2A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M64 26C72 12 88 12 94 18C86 30 74 32 64 26Z" fill="#4CB963" stroke="#23315C" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="38" cy="56" rx="6" ry="11" fill="#FFFFFF" opacity="0.7" transform="rotate(20 38 56)"/>' },
    banana: { name: 'バナナ', voice: 'バナナ', art:
      '<path d="M22 34C18 78 58 108 104 86C108 84 106 76 100 77C66 84 40 64 34 34Z" fill="#FFD43B" ' + K + '/><path d="M22 34L20 22L32 20L34 34Z" fill="#9C6B3F" stroke="#23315C" stroke-width="3.5" stroke-linejoin="round"/><path d="M36 48C42 68 60 80 86 83" stroke="#E0A800" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    grape: { name: 'ぶどう', voice: 'ぶどう', art:
      '<path d="M60 38V18" stroke="#7A4E2A" stroke-width="5" stroke-linecap="round"/><path d="M60 24C70 12 86 12 92 18C84 28 70 30 60 24Z" fill="#4CB963" stroke="#23315C" stroke-width="3.5" stroke-linejoin="round"/>' +
      [[40, 46], [60, 46], [80, 46], [50, 64], [70, 64], [60, 82]].map((c) => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="11" fill="#8E6BD8" stroke="#23315C" stroke-width="3.5"/>').join('') },
    circle: { name: 'まる', voice: 'まる', art: '<circle cx="60" cy="60" r="42" fill="#5BB6EE" stroke="#23315C" stroke-width="5"/>' },
    tri: { name: 'さんかく', voice: 'さんかく', art: '<path d="M60 16L106 98H14Z" fill="#FF7A66" stroke="#23315C" stroke-width="5" stroke-linejoin="round"/>' },
    square: { name: 'しかく', voice: 'しかく', art: '<rect x="20" y="20" width="80" height="80" rx="10" fill="#FFCC00" stroke="#23315C" stroke-width="5"/>' },
    car: { name: 'くるま', voice: 'ぶーぶー、くるま', art:
      '<rect x="36" y="30" width="48" height="32" rx="12" fill="#5BB6EE" ' + K + '/><rect x="44" y="37" width="32" height="15" rx="6" fill="#FFFFFF" stroke="#23315C" stroke-width="3"/><rect x="14" y="54" width="92" height="34" rx="12" fill="#FF7A66" ' + K + '/><circle cx="36" cy="90" r="13" fill="#3B4A7A" ' + K + '/><circle cx="84" cy="90" r="13" fill="#3B4A7A" ' + K + '/><circle cx="36" cy="90" r="5" fill="#FFFFFF"/><circle cx="84" cy="90" r="5" fill="#FFFFFF"/>' },
    train: { name: 'でんしゃ', voice: 'がたんごとん、でんしゃ', art:
      '<path d="M50 34L60 20L70 34M54 20H66" stroke="#23315C" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="12" y="34" width="96" height="54" rx="14" fill="#4CB963" ' + K + '/>' +
      [22, 50, 78].map((x) => '<rect x="' + x + '" y="44" width="20" height="18" rx="5" fill="#FFFFFF" stroke="#23315C" stroke-width="3"/>').join('') +
      '<rect x="14" y="70" width="92" height="7" fill="#FFCC00"/>' +
      [32, 60, 88].map((x) => '<circle cx="' + x + '" cy="92" r="9" fill="#3B4A7A" stroke="#23315C" stroke-width="3.5"/>').join('') },
    plane: { name: 'ひこうき', voice: 'ぶーん、ひこうき', art:
      '<path d="M20 58L12 30H28L44 58Z" fill="#FF7A66" ' + K + '/><path d="M14 60C14 52 24 50 36 50H94C106 50 112 58 112 62C112 68 106 72 96 72H36C24 72 14 68 14 60Z" fill="#FFFFFF" ' + K + '/><path d="M52 64L70 98H86L78 64Z" fill="#5BB6EE" ' + K + '/>' +
      [46, 60, 74, 88].map((x) => '<circle cx="' + x + '" cy="58" r="4" fill="#5BB6EE"/>').join('') },
    fish: { name: 'さかな', voice: 'すいすい、さかな', art:
      '<path d="M84 60L110 38V82Z" fill="#5BB6EE" ' + K + '/><ellipse cx="54" cy="60" rx="40" ry="28" fill="#5BB6EE" ' + K + '/><path d="M62 46q9 14 0 28M76 49q8 11 0 22" stroke="#23315C" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="34" cy="54" r="9" fill="#FFFFFF" stroke="#23315C" stroke-width="3"/><circle cx="32" cy="54" r="4" fill="#23315C"/>' },
    octo: { name: 'たこ', voice: 'たこ', art:
      [[34, 92, 20], [52, 98, 0], [70, 98, 0], [86, 92, -20]].map((l) => '<ellipse cx="' + l[0] + '" cy="' + l[1] + '" rx="9" ry="18" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')" fill="#FF7A66" stroke="#23315C" stroke-width="3.5"/>').join('') +
      '<ellipse cx="60" cy="52" rx="38" ry="34" fill="#FF7A66" ' + K + '/><circle cx="46" cy="52" r="6" fill="#23315C"/><circle cx="74" cy="52" r="6" fill="#23315C"/><circle cx="60" cy="70" r="6" fill="#FF5E4D" stroke="#23315C" stroke-width="3"/>' },
    turtle: { name: 'かめ', voice: 'かめ', art:
      '<ellipse cx="36" cy="86" rx="10" ry="8" fill="#8EDB9C" stroke="#23315C" stroke-width="3.5"/><ellipse cx="80" cy="86" rx="10" ry="8" fill="#8EDB9C" stroke="#23315C" stroke-width="3.5"/><path d="M16 76L6 80L16 84Z" fill="#8EDB9C" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/><circle cx="102" cy="66" r="12" fill="#8EDB9C" ' + K + '/><circle cx="106" cy="63" r="3" fill="#23315C"/><path d="M16 80C16 38 94 38 94 80Z" fill="#4CB963" ' + K + '/><path d="M40 54L55 48L70 54L72 68L55 74L38 68Z" fill="#8EDB9C" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/><rect x="12" y="76" width="86" height="10" rx="5" fill="#8EDB9C" stroke="#23315C" stroke-width="3.5"/>' }
  };

  const icon = (id) => svg(ITEMS[id].art, 44);
  const VARIANTS = [
    { label: 'どうぶつ（4まい）', pool: ['dog', 'cat', 'ele'], pairs: 2, icon: icon('dog') },
    { label: 'くだもの（4まい）', pool: ['apple', 'banana', 'grape'], pairs: 2, icon: icon('apple') },
    { label: 'かたち（6まい）', pool: ['circle', 'tri', 'square'], pairs: 3, icon: icon('tri') },
    { label: 'のりもの（6まい）', pool: ['car', 'train', 'plane'], pairs: 3, icon: icon('car') },
    { label: 'うみの いきもの（6まい）', pool: ['fish', 'octo', 'turtle'], pairs: 3, icon: icon('fish') }
  ];

  const STAMP = '<svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z" fill="#FFFFFF" stroke="#23315C" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  let grid, pairsEl;
  let deck = [];
  let buttons = [];
  let open = [];
  let matched = [];
  let lock = false;
  let pairs = 2;
  let timers = [];

  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  function centerOf(a, b) {
    const ra = a.getBoundingClientRect();
    const rb = (b || a).getBoundingClientRect();
    return api.toStage({ clientX: (ra.left + ra.right + rb.left + rb.right) / 4, clientY: (ra.top + ra.bottom + rb.top + rb.bottom) / 4 });
  }

  function renderProgress() {
    pairsEl.innerHTML = '';
    for (let k = 0; k < pairs; k++) pairsEl.appendChild(api.el('span', k < matched.length ? 'on' : ''));
  }

  function pick(i) {
    const id = deck[i];
    if (lock || open.includes(i) || matched.includes(id)) return;
    api.sound.flip();
    buttons[i].classList.add('up');
    buttons[i].setAttribute('aria-label', ITEMS[id].name);
    api.say(ITEMS[id].voice);
    open.push(i);
    if (open.length < 2) return;

    const [a, b] = open;
    if (deck[a] === deck[b]) {
      matched.push(id);
      open = [];
      later(() => {
        api.sound.ok();
        buttons[a].classList.add('matched');
        buttons[b].classList.add('matched');
        renderProgress();
        if (matched.length === pairs) later(() => api.done(), 700);
      }, 450);
    } else {
      lock = true;
      later(() => {
        const c = centerOf(buttons[b]);
        api.miss(c.x, c.y);
      }, 500);
      later(() => {
        [a, b].forEach((k) => {
          buttons[k].classList.remove('up');
          buttons[k].setAttribute('aria-label', 'うらむきの カード');
        });
        open = [];
        lock = false;
      }, 1400);
    }
  }

  register('memory', {
    variants: VARIANTS,

    mount(play) {
      grid = api.el('div', 'cards');
      pairsEl = api.el('div', 'pairs');
      pairsEl.setAttribute('aria-label', 'みつけた ペア');
      play.append(grid, pairsEl);
    },

    start(i) {
      const v = VARIANTS[i];
      pairs = v.pairs;
      const chosen = api.shuffle(v.pool).slice(0, pairs);
      deck = api.shuffle(chosen.concat(chosen));
      open = [];
      matched = [];
      lock = false;
      grid.style.gridTemplateColumns = 'repeat(' + (pairs === 2 ? 2 : 3) + ', 200px)';
      grid.innerHTML = '';
      buttons = deck.map((id, k) => {
        const it = ITEMS[id];
        const b = api.el('button', 'card',
          '<span class="card-inner">' +
            '<span class="face back"><span class="q">？</span></span>' +
            '<span class="face front">' + svg(it.art) + '<span class="name">' + it.name + '</span><span class="stamp">' + STAMP + '</span></span>' +
          '</span>');
        b.type = 'button';
        b.setAttribute('aria-label', 'うらむきの カード');
        b.addEventListener('click', () => pick(k));
        grid.appendChild(b);
        return b;
      });
      renderProgress();
    },

    stop() {
      timers.forEach(clearTimeout);
      timers = [];
      lock = false;
    }
  });
})();
