(() => {
  'use strict';

  /* ---------- Conjuntos de caracteres ---------- */
  const SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*'
  };
  const KEYS = Object.keys(SETS);

  /* ---------- Elementos ---------- */
  const $ = (id) => document.getElementById(id);

  const els = {
    password: $('password'),
    generate: $('generate'),
    regen: $('regen'),
    copy: $('copy'),
    copyLabel: $('copyLabel'),
    length: $('length'),
    lengthValue: $('lengthValue'),
    strength: $('strength'),
    strengthLabel: $('strengthLabel'),
    strengthBits: $('strengthBits'),
    strengthTip: $('strengthTip'),
    notice: $('notice'),
    live: $('live')
  };

  const checks = {
    upper: $('optUpper'),
    lower: $('optLower'),
    numbers: $('optNumbers'),
    symbols: $('optSymbols')
  };

  const LEVELS = {
    weak: { label: 'Fraca', tip: 'aumente o tamanho ou marque mais tipos de caracteres.' },
    medium: { label: 'Média', tip: 'boa para uso rápido, mas dá pra reforçar.' },
    strong: { label: 'Forte', tip: 'ótima para uma senha temporária.' }
  };

  let current = '';

  /* ---------- Aleatoriedade segura (sem viés) ---------- */
  function randomInt(max) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max; // descarta valores que causariam viés
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % max;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- Lógica da senha ---------- */
  function activeKeys() {
    return KEYS.filter((k) => checks[k].checked);
  }

  function poolOf(keys) {
    return keys.map((k) => SETS[k]).join('');
  }

  function generatePassword(length, keys) {
    const pool = poolOf(keys);
    // garante ao menos um caractere de cada tipo marcado
    const chars = keys.map((k) => SETS[k][randomInt(SETS[k].length)]);
    while (chars.length < length) {
      chars.push(pool[randomInt(pool.length)]);
    }
    return shuffle(chars).join('');
  }

  // força = entropia (bits) = tamanho × log2(tamanho do alfabeto)
  function calcStrength(length, poolSize) {
    const bits = length * Math.log2(poolSize);
    const level = bits < 40 ? 'weak' : bits < 70 ? 'medium' : 'strong';
    return { bits, level };
  }

  /* ---------- Renderização ---------- */
  function renderPassword(str) {
    const frag = document.createDocumentFragment();
    for (const ch of str) {
      const span = document.createElement('span');
      if (/[0-9]/.test(ch)) span.className = 'num';
      else if (/[^A-Za-z0-9]/.test(ch)) span.className = 'sym';
      span.textContent = ch;
      frag.appendChild(span);
    }
    els.password.replaceChildren(frag);
    els.password.dataset.size = str.length <= 16 ? 's' : str.length <= 24 ? 'm' : 'l';
  }

  function renderStrength(length, keys) {
    const { bits, level } = calcStrength(length, poolOf(keys).length);
    els.strength.dataset.level = level;
    els.strengthLabel.textContent = LEVELS[level].label;
    els.strengthBits.textContent = Math.round(bits);
    els.strengthTip.textContent = LEVELS[level].tip;
  }

  function renderLength() {
    const min = Number(els.length.min);
    const max = Number(els.length.max);
    const value = Number(els.length.value);
    els.lengthValue.textContent = value;
    els.length.style.setProperty('--fill', ((value - min) / (max - min)) * 100 + '%');
  }

  function showNotice(msg) {
    els.notice.textContent = msg;
    els.notice.hidden = false;
    clearTimeout(showNotice.timer);
    showNotice.timer = setTimeout(() => {
      els.notice.hidden = true;
    }, 3500);
  }

  function resetCopyButton() {
    clearTimeout(copyTimer);
    els.copy.classList.remove('copied');
    els.copyLabel.textContent = 'Copiar';
  }

  /* ---------- Gerar ---------- */
  function refresh() {
    const keys = activeKeys();
    const length = Number(els.length.value);
    current = generatePassword(length, keys);
    renderPassword(current);
    renderStrength(length, keys);
    resetCopyButton();
  }

  /* ---------- Copiar ---------- */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* tenta o plano B */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  let copyTimer = 0;

  async function handleCopy() {
    if (!current) return;
    const ok = await copyToClipboard(current);
    clearTimeout(copyTimer);

    if (ok) {
      els.copy.classList.add('copied');
      els.copyLabel.textContent = 'Copiado!';
      els.live.textContent = 'Senha copiada para a área de transferência.';
      copyTimer = setTimeout(resetCopyButton, 2000);
    } else {
      const sel = window.getSelection();
      if (sel) sel.selectAllChildren(els.password);
      showNotice('Não foi possível copiar automaticamente. A senha foi selecionada: use Ctrl+C.');
    }
  }

  /* ---------- Eventos ---------- */
  els.generate.addEventListener('click', refresh);
  els.regen.addEventListener('click', refresh);
  els.copy.addEventListener('click', handleCopy);

  els.length.addEventListener('input', () => {
    renderLength();
    refresh();
  });

  KEYS.forEach((k) => {
    checks[k].addEventListener('change', () => {
      if (activeKeys().length === 0) {
        checks[k].checked = true; // nunca deixa tudo desmarcado
        const label = checks[k].closest('.check');
        label.classList.remove('shake');
        void label.offsetWidth;
        label.classList.add('shake');
        showNotice('Mantenha pelo menos um tipo de caractere selecionado.');
        return;
      }
      els.notice.hidden = true;
      refresh();
    });
  });

  /* ---------- Início ---------- */
  if (!window.crypto || !crypto.getRandomValues) {
    els.password.textContent = 'Navegador sem suporte';
    showNotice('Seu navegador não tem gerador de números aleatórios seguro. Atualize-o para continuar.');
    els.generate.disabled = true;
    els.regen.disabled = true;
    els.copy.disabled = true;
    return;
  }

  renderLength();
  refresh();
})();
