/* Sinhala input tools: Singlish transliteration + on-screen keyboard.
   Self-contained, offline. window.SinhalaIME = { translit, buildKeyboard } */
(function () {
  'use strict';

  // ---- Singlish → Sinhala transliteration -------------------------------
  // Independent vowels (word-initial / after vowel)
  const VOWELS = {
    'aee': 'ඈ', 'aa': 'ආ', 'ae': 'ඇ', 'a': 'අ',
    'ii': 'ඊ', 'i': 'ඉ',
    'uu': 'ඌ', 'u': 'උ',
    'ee': 'ඒ', 'e': 'එ',
    'ai': 'ඓ', 'oo': 'ඕ', 'au': 'ඖ', 'o': 'ඔ',
  };
  // Vowel signs (after a consonant)
  const SIGNS = {
    'aee': 'ෑ', 'aa': 'ා', 'ae': 'ැ', 'a': '',
    'ii': 'ී', 'i': 'ි',
    'uu': 'ූ', 'u': 'ු',
    'ee': 'ේ', 'e': 'ෙ',
    'ai': 'ෛ', 'oo': 'ෝ', 'au': 'ෞ', 'o': 'ො',
  };
  // Consonants. Case-sensitive keys; longest match first.
  const CONS = {
    'shh': 'ෂ', 'Sh': 'ෂ', 'sh': 'ශ',
    'chh': 'ඡ', 'Ch': 'ඡ', 'ch': 'ච',
    'thh': 'ථ', 'Th': 'ථ', 'th': 'ත',
    'dhh': 'ධ', 'Dh': 'ධ', 'dh': 'ද',
    'kh': 'ඛ', 'gh': 'ඝ', 'ph': 'ඵ', 'bh': 'භ', 'jh': 'ඣ',
    'gn': 'ඥ', 'kn': 'ඤ',
    'k': 'ක', 'g': 'ග', 'j': 'ජ',
    'T': 'ඨ', 't': 'ට', 'D': 'ඪ', 'd': 'ඩ',
    'N': 'ණ', 'n': 'න',
    'p': 'ප', 'b': 'බ', 'm': 'ම',
    'y': 'ය', 'r': 'ර', 'L': 'ළ', 'l': 'ල',
    'w': 'ව', 'v': 'ව',
    'S': 'ෂ', 's': 'ස', 'h': 'හ', 'f': 'ෆ',
  };
  const CONS_KEYS = Object.keys(CONS).sort((a, b) => b.length - a.length);
  const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);
  const HAL = '්';
  const isLatin = (c) => /[A-Za-z]/.test(c);

  function matchAt(str, i, keys, caseSensitive) {
    for (const k of keys) {
      const part = str.substr(i, k.length);
      if (caseSensitive ? part === k : part.toLowerCase() === k.toLowerCase()) return k;
    }
    return null;
  }

  function translit(text) {
    let out = '', i = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === 'x' || c === 'X') { out += 'ං'; i++; continue; }   // anusvaraya
      if (!isLatin(c)) { out += c; i++; continue; }
      // consonant? (exact case first, then lenient)
      let k = matchAt(text, i, CONS_KEYS, true);
      if (!k) {
        const ki = matchAt(text, i, CONS_KEYS, false);
        if (ki) k = ki;
      }
      if (k) {
        out += CONS[k] ?? CONS[k.toLowerCase()];
        i += k.length;
        // vowel sign after consonant?
        const v = matchAt(text, i, VOWEL_KEYS, false);
        if (v) { out += SIGNS[v.toLowerCase()] ?? ''; i += v.length; }
        else { out += HAL; }                                        // no vowel → hal kirima
        continue;
      }
      // independent vowel?
      const v = matchAt(text, i, VOWEL_KEYS, false);
      if (v) { out += VOWELS[v.toLowerCase()]; i += v.length; continue; }
      out += c; i++;                                                // unknown latin (q, z…)
    }
    return out;
  }

  // ---- On-screen keyboard ------------------------------------------------
  const KEY_ROWS = [
    ['අ', 'ආ', 'ඇ', 'ඈ', 'ඉ', 'ඊ', 'උ', 'ඌ', 'එ', 'ඒ', 'ඓ', 'ඔ', 'ඕ', 'ඖ'],
    ['ා', 'ැ', 'ෑ', 'ි', 'ී', 'ු', 'ූ', 'ෙ', 'ේ', 'ෛ', 'ො', 'ෝ', 'ෞ', 'ෘ', 'ෲ'],
    ['ක', 'ඛ', 'ග', 'ඝ', 'ඞ', 'ඟ', 'ච', 'ඡ', 'ජ', 'ඣ', 'ඤ', 'ඥ', 'ඦ'],
    ['ට', 'ඨ', 'ඩ', 'ඪ', 'ණ', 'ඬ', 'ත', 'ථ', 'ද', 'ධ', 'න', 'ඳ'],
    ['ප', 'ඵ', 'බ', 'භ', 'ම', 'ඹ', 'ය', 'ර', 'ල', 'ව', 'ශ', 'ෂ'],
    ['ස', 'හ', 'ළ', 'ෆ', '්', 'ං', 'ඃ',
      { label: '්‍ර', ins: '්‍ර', title: 'rakaransaya' },
      { label: '්‍ය', ins: '්‍ය', title: 'yansaya' },
      { label: '⌫', ins: 'BKSP', title: 'backspace' },
      { label: '␣', ins: ' ', title: 'space' }],
  ];

  function buildKeyboard(container, input, onChange) {
    container.innerHTML = '';
    container.classList.add('si-kbd');
    for (const row of KEY_ROWS) {
      const div = document.createElement('div');
      div.className = 'si-kbd-row';
      for (const key of row) {
        const label = typeof key === 'string' ? key : key.label;
        const ins = typeof key === 'string' ? key : key.ins;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'si-key';
        btn.textContent = label;
        if (typeof key === 'object' && key.title) btn.title = key.title;
        btn.addEventListener('click', () => {
          input.focus();
          const s = input.selectionStart ?? input.value.length;
          const e = input.selectionEnd ?? input.value.length;
          if (ins === 'BKSP') {
            if (s === e && s > 0) {
              input.value = input.value.slice(0, s - 1) + input.value.slice(e);
              input.setSelectionRange(s - 1, s - 1);
            } else {
              input.value = input.value.slice(0, s) + input.value.slice(e);
              input.setSelectionRange(s, s);
            }
          } else {
            input.value = input.value.slice(0, s) + ins + input.value.slice(e);
            input.setSelectionRange(s + ins.length, s + ins.length);
          }
          if (onChange) onChange();
        });
        div.appendChild(btn);
      }
      container.appendChild(div);
    }
  }

  window.SinhalaIME = { translit, buildKeyboard };
})();
