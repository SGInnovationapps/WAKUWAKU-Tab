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

  // ---- 追加の絵柄 ----
  const crayon = (c) =>
    '<g transform="rotate(-30 60 56)"><rect x="18" y="44" width="70" height="26" rx="5" fill="' + c + '" ' + K + '/>' +
    '<rect x="36" y="46" width="30" height="22" fill="#FFFFFF" opacity="0.45"/>' +
    '<path d="M88 44L108 57L88 70Z" fill="' + c + '" ' + K + '/>' +
    '<rect x="10" y="46" width="10" height="22" rx="3" fill="' + c + '" stroke="#23315C" stroke-width="3"/></g>' +
    '<path d="M18 100q10-14 20 0t20 0t20 0t20 0" fill="none" stroke="' + c + '" stroke-width="9" stroke-linecap="round"/>';
  const starD = (cx, cy, R, r) => {
    let d = '';
    for (let k = 0; k < 10; k++) {
      const rad = k % 2 ? r : R;
      const a = (-90 + k * 36) * Math.PI / 180;
      d += (k ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  };
  const mirror = (inner) => inner + '<g transform="translate(120 0) scale(-1 1)">' + inner + '</g>';

  Object.assign(ITEMS, {
    // どうぶつ
    rabbit: { name: 'うさぎ', voice: 'ぴょんぴょん、うさぎ', art:
      mirror('<ellipse cx="44" cy="34" rx="12" ry="28" fill="#FFFFFF" ' + K + '/><ellipse cx="44" cy="36" rx="5" ry="18" fill="#FFB3C1"/>') +
      '<circle cx="60" cy="74" r="34" fill="#FFFFFF" ' + K + '/><circle cx="48" cy="70" r="4.5" fill="#23315C"/><circle cx="72" cy="70" r="4.5" fill="#23315C"/><ellipse cx="60" cy="82" rx="5" ry="4" fill="#FF7A9A"/><path d="M60 86v5M60 91q-6 5-11 1M60 91q6 5 11 1" stroke="#23315C" stroke-width="2.5" fill="none" stroke-linecap="round"/>' },
    pig: { name: 'ぶた', voice: 'ぶうぶう、ぶた', art:
      mirror('<path d="M30 42L34 16L54 34Z" fill="#FFB3C1" ' + K + '/>') +
      '<circle cx="60" cy="64" r="38" fill="#FFC4D0" ' + K + '/><ellipse cx="60" cy="76" rx="17" ry="12" fill="#FF9AB0" stroke="#23315C" stroke-width="3"/><ellipse cx="54" cy="76" rx="2.5" ry="4" fill="#23315C"/><ellipse cx="66" cy="76" rx="2.5" ry="4" fill="#23315C"/><circle cx="45" cy="56" r="4.5" fill="#23315C"/><circle cx="75" cy="56" r="4.5" fill="#23315C"/>' },
    bear: { name: 'くま', voice: 'くま', art:
      mirror('<circle cx="32" cy="34" r="14" fill="#B07A4A" ' + K + '/><circle cx="32" cy="34" r="6" fill="#E8C39E"/>') +
      '<circle cx="60" cy="66" r="38" fill="#B07A4A" ' + K + '/><ellipse cx="60" cy="80" rx="18" ry="13" fill="#E8C39E" stroke="#23315C" stroke-width="3"/><ellipse cx="60" cy="74" rx="6" ry="4.5" fill="#23315C"/><circle cx="46" cy="60" r="4.5" fill="#23315C"/><circle cx="74" cy="60" r="4.5" fill="#23315C"/><path d="M60 79v5M54 86q6 4 12 0" stroke="#23315C" stroke-width="2.5" fill="none" stroke-linecap="round"/>' },
    // くだもの
    berry: { name: 'いちご', voice: 'いちご', art:
      '<path d="M60 108C36 96 18 70 22 50C26 34 44 30 60 36C76 30 94 34 98 50C102 70 84 96 60 108Z" fill="#FF4D5E" ' + K + '/>' +
      [[42, 54], [60, 50], [78, 54], [48, 72], [70, 72], [60, 90]].map((d) => '<ellipse cx="' + d[0] + '" cy="' + d[1] + '" rx="2.5" ry="4" fill="#FFE27A"/>').join('') +
      '<path d="M60 40L44 26L55 32L60 18L65 32L76 26Z" fill="#4CB963" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/>' },
    orange: { name: 'みかん', voice: 'みかん', art:
      '<circle cx="60" cy="66" r="40" fill="#FF9A2E" ' + K + '/><path d="M60 26C66 14 82 13 87 19C81 29 69 31 60 26Z" fill="#4CB963" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/>' +
      [[44, 56], [72, 52], [56, 80], [80, 76]].map((d) => '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="2" fill="#E07A10"/>').join('') },
    // かたち
    star: { name: 'ほし', voice: 'ほし', art: '<path d="' + starD(60, 64, 48, 21) + '" fill="#FFCC00" stroke="#23315C" stroke-width="5" stroke-linejoin="round"/>' },
    heart: { name: 'ハート', voice: 'ハート', art: '<path d="M60 102C24 78 12 56 22 38C32 22 52 24 60 42C68 24 88 22 98 38C108 56 96 78 60 102Z" fill="#FF6B8A" stroke="#23315C" stroke-width="5" stroke-linejoin="round"/>' },
    // のりもの
    ship: { name: 'ふね', voice: 'ふね', art:
      '<rect x="62" y="28" width="12" height="20" fill="#FFCC00" ' + K + '/><rect x="38" y="46" width="44" height="24" rx="4" fill="#FFFFFF" ' + K + '/><circle cx="50" cy="58" r="4" fill="#5BB6EE"/><circle cx="70" cy="58" r="4" fill="#5BB6EE"/><path d="M14 70H106L92 96H28Z" fill="#FF7A66" ' + K + '/><path d="M8 106q10-8 20 0t20 0t20 0t20 0t20 0" fill="none" stroke="#5BB6EE" stroke-width="5" stroke-linecap="round"/>' },
    bus: { name: 'バス', voice: 'ぶーぶー、バス', art:
      '<rect x="10" y="34" width="100" height="52" rx="12" fill="#FFCC00" ' + K + '/>' +
      [18, 42, 66].map((x) => '<rect x="' + x + '" y="42" width="18" height="18" rx="4" fill="#FFFFFF" stroke="#23315C" stroke-width="3"/>').join('') +
      '<rect x="90" y="42" width="12" height="36" rx="3" fill="#FFFFFF" stroke="#23315C" stroke-width="3"/><circle cx="32" cy="88" r="10" fill="#3B4A7A" ' + K + '/><circle cx="86" cy="88" r="10" fill="#3B4A7A" ' + K + '/>' },
    // うみ
    whale: { name: 'くじら', voice: 'くじら', art:
      '<path d="M40 32q-6-10 0-18M40 32q6-10 12-14" stroke="#5BB6EE" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M96 62L112 44L110 68L116 86L98 74Z" fill="#5B8FD8" ' + K + '/><path d="M12 66C12 42 44 36 72 40C90 44 98 56 98 66C98 84 76 92 52 92C28 92 12 84 12 66Z" fill="#5B8FD8" ' + K + '/><path d="M20 74C34 84 66 86 90 76" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/><circle cx="32" cy="60" r="4.5" fill="#23315C"/>' },
    crab: { name: 'かに', voice: 'ちょきちょき、かに', art:
      '<path d="M30 74L16 86M32 82L20 96M90 74L104 86M88 82L100 96" stroke="#23315C" stroke-width="4" stroke-linecap="round"/>' +
      mirror('<path d="M22 46C10 36 16 20 30 22L26 34L37 30C41 41 33 50 22 46Z" fill="#FF5E4D" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/><path d="M30 46L40 58" stroke="#23315C" stroke-width="4" stroke-linecap="round"/>') +
      '<ellipse cx="60" cy="72" rx="32" ry="22" fill="#FF5E4D" ' + K + '/><path d="M50 52V42M70 52V42" stroke="#23315C" stroke-width="3"/><circle cx="50" cy="40" r="5" fill="#FFFFFF" stroke="#23315C" stroke-width="3"/><circle cx="70" cy="40" r="5" fill="#FFFFFF" stroke="#23315C" stroke-width="3"/><path d="M52 80q8 5 16 0" stroke="#23315C" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    // やさい
    carrot: { name: 'にんじん', voice: 'にんじん', art:
      '<path d="M60 34C56 22 48 14 42 10M60 34C60 20 62 12 64 6M60 34C66 22 74 16 82 12" stroke="#4CB963" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 112C52 96 40 60 40 46C40 38 50 34 60 34C70 34 80 38 80 46C80 60 68 96 60 112Z" fill="#FF9A2E" ' + K + '/><path d="M46 58h10M62 70h12M50 84h8" stroke="#D9741A" stroke-width="3" stroke-linecap="round"/>' },
    tomato: { name: 'トマト', voice: 'トマト', art:
      '<circle cx="60" cy="68" r="40" fill="#FF4D4D" ' + K + '/><path d="M40 34Q60 44 80 34Q70 48 60 38Q50 48 40 34Z" fill="#4CB963" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/><path d="M60 36V22" stroke="#4CB963" stroke-width="5" stroke-linecap="round"/><ellipse cx="44" cy="62" rx="6" ry="10" fill="#FFFFFF" opacity="0.5" transform="rotate(25 44 62)"/>' },
    eggplant: { name: 'なす', voice: 'なす', art:
      '<path d="M56 40C40 44 24 70 32 92C38 108 62 110 76 98C92 84 90 60 78 46C72 40 64 38 56 40Z" fill="#7E4FBF" ' + K + '/><path d="M52 44C56 30 72 28 82 36C74 38 72 46 62 48Z" fill="#4CB963" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/><path d="M76 34L86 20" stroke="#4CB963" stroke-width="5" stroke-linecap="round"/><path d="M44 70C42 80 46 90 52 94" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.5"/>' },
    corn: { name: 'とうもろこし', voice: 'とうもろこし', art:
      '<ellipse cx="60" cy="60" rx="22" ry="44" fill="#FFD43B" ' + K + '/>' +
      [-10, 0, 10].map((dx) => [30, 44, 58, 72, 86].map((y) => '<circle cx="' + (60 + dx) + '" cy="' + y + '" r="3.5" fill="#F2B705"/>').join('')).join('') +
      mirror('<path d="M42 104C30 84 30 60 36 44C42 66 50 88 60 108Z" fill="#4CB963" stroke="#23315C" stroke-width="3" stroke-linejoin="round"/>') },
    broccoli: { name: 'ブロッコリー', voice: 'ブロッコリー', art:
      '<path d="M50 66L44 108H76L70 66Z" fill="#8EDB9C" ' + K + '/>' +
      [[38, 54, 18], [60, 40, 21], [82, 54, 18], [60, 64, 16]].map((c) => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="#3CA55C" stroke="#23315C" stroke-width="4"/>').join('') }
  });

  // いろ（クレヨン）
  [['red', 'あか', '#FF4D4D'], ['blue', 'あお', '#3D7BFF'], ['yellow', 'きいろ', '#FFD400'], ['green', 'みどり', '#3CC35A'],
   ['pink', 'ピンク', '#FF8FC4'], ['purple', 'むらさき', '#9A62E0'], ['orangec', 'オレンジ', '#FF9A2E'], ['brown', 'ちゃいろ', '#9C6B3F']]
    .forEach((c) => { ITEMS['c_' + c[0]] = { name: c[1], voice: c[1], art: crayon(c[2]) }; });

  // パズル（puzzle.js）でも同じ絵柄を使う
  window.Wakuwaku.art = ITEMS;

  const POOL = {
    animal: ['dog', 'cat', 'ele', 'rabbit', 'pig', 'bear'],
    fruit: ['apple', 'banana', 'grape', 'berry', 'orange'],
    color: ['c_red', 'c_blue', 'c_yellow', 'c_green', 'c_pink', 'c_purple', 'c_orangec', 'c_brown'],
    shape: ['circle', 'tri', 'square', 'star', 'heart'],
    vehicle: ['car', 'train', 'plane', 'ship', 'bus'],
    sea: ['fish', 'octo', 'turtle', 'whale', 'crab'],
    veg: ['carrot', 'tomato', 'eggplant', 'corn', 'broccoli']
  };
  POOL.mix = Object.keys(POOL).filter((k) => k !== 'color').reduce((a, k) => a.concat(POOL[k]), []).concat(['c_red', 'c_blue']);

  const icon = (id) => svg(ITEMS[id].art, 40);
  const VARIANTS = [
    { label: 'どうぶつ（4まい）', pool: POOL.animal, pairs: 2, icon: icon('dog') },
    { label: 'くだもの（4まい）', pool: POOL.fruit, pairs: 2, icon: icon('apple') },
    { label: 'いろ（4まい）', pool: POOL.color, pairs: 2, icon: icon('c_red') },
    { label: 'かたち（6まい）', pool: POOL.shape, pairs: 3, icon: icon('tri') },
    { label: 'のりもの（6まい）', pool: POOL.vehicle, pairs: 3, icon: icon('car') },
    { label: 'いろ（6まい）', pool: POOL.color, pairs: 3, icon: icon('c_blue') },
    { label: 'やさい（8まい）', pool: POOL.veg, pairs: 4, icon: icon('carrot') },
    { label: 'どうぶつ（8まい）', pool: POOL.animal, pairs: 4, icon: icon('bear') },
    { label: 'うみの いきもの（8まい）', pool: POOL.sea, pairs: 4, icon: icon('fish') },
    { label: 'いろ（10まい）', pool: POOL.color, pairs: 5, icon: icon('c_green') },
    { label: 'くだもの（10まい）', pool: POOL.fruit, pairs: 5, icon: icon('berry') },
    { label: 'ぜんぶ まぜこぜ（10まい）', pool: POOL.mix, pairs: 5, icon: icon('star') }
  ];

  // 枚数ごとのカードの大きさ（4・6 枚は大きく、8・10 枚は少し小さく）
  const LAYOUT = {
    2: { cols: 2, w: 200, h: 260, art: 136, name: 30, gap: '40px 48px' },
    3: { cols: 3, w: 200, h: 260, art: 136, name: 30, gap: '40px 48px' },
    4: { cols: 4, w: 190, h: 250, art: 128, name: 28, gap: '34px 36px' },
    5: { cols: 5, w: 176, h: 236, art: 116, name: 25, gap: '32px 28px' }
  };

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
        [a, b].forEach((k) => { const c = centerOf(buttons[k]); api.good(c.x, c.y - 20); });
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
      const L = LAYOUT[pairs];
      grid.style.gridTemplateColumns = 'repeat(' + L.cols + ', ' + L.w + 'px)';
      grid.style.gap = L.gap;
      grid.innerHTML = '';
      buttons = deck.map((id, k) => {
        const it = ITEMS[id];
        const b = api.el('button', 'card',
          '<span class="card-inner">' +
            '<span class="face back"><span class="q">？</span></span>' +
            '<span class="face front">' + svg(it.art, L.art) + '<span class="name" style="font-size:' + (Array.from(it.name).length >= 5 ? L.name - 6 : L.name) + 'px">' + it.name + '</span><span class="stamp">' + STAMP + '</span></span>' +
          '</span>');
        b.type = 'button';
        b.style.width = L.w + 'px';
        b.style.height = L.h + 'px';
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
