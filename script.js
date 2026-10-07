(() => {
  'use strict';

  // ---------- Configurações ----------
  const CHARSETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$?'
  };

  const MIN_SECONDS = 5;
  const MAX_SECONDS = 7 * 24 * 3600; // 7 dias

  // ---------- Elementos ----------
  const $ = (id) => document.getElementById(id);

  const form = $('form');
  const optUpper = $('opt-upper');
  const optLower = $('opt-lower');
  const optNumbers = $('opt-numbers');
  const optSymbols = $('opt-symbols');
  const lengthInput = $('length');
  const lengthOut = $('length-out');
  const durationInput = $('duration');
  const unitSelect = $('unit');
  const message = $('message');

  const result = $('result');
  const passwordInput = $('password');
  const toggleBtn = $('toggle-btn');
  const copyBtn = $('copy-btn');
  const strengthEl = $('strength');
  const countdownEl = $('countdown');
  const barFill = $('bar-fill');
  const emailInput = $('email');
  const shareBtn = $('share-btn');

  // ---------- Estado ----------
  let currentPassword = '';
  let expiresAt = 0;
  let totalMs = 0;
  let timerId = null;
  let messageTimeout = null;

  // ---------- Geração da senha ----------

  // Inteiro aleatório em [0, max) sem viés, usando o gerador seguro do navegador.
  function randomInt(max) {
    const limit = Math.floor(0x100000000 / max) * max;
    const buffer = new Uint32Array(1);
    do {
      crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % max;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getActiveSets() {
    const sets = [];
    if (optUpper.checked) sets.push(CHARSETS.upper);
    if (optLower.checked) sets.push(CHARSETS.lower);
    if (optNumbers.checked) sets.push(CHARSETS.numbers);
    if (optSymbols.checked) sets.push(CHARSETS.symbols);
    return sets;
  }

  function generatePassword(length, sets) {
    const pool = sets.join('');
    const chars = [];

    // Garante ao menos um caractere de cada tipo escolhido.
    sets.forEach((set) => chars.push(set[randomInt(set.length)]));

    // Completa o restante com caracteres de qualquer tipo escolhido.
    while (chars.length < length) {
      chars.push(pool[randomInt(pool.length)]);
    }

    return shuffle(chars).join('');
  }

  function describeStrength(length, poolSize) {
    const bits = length * Math.log2(poolSize);
    if (bits < 50) return { label: 'Força: fraca', css: 'weak' };
    if (bits < 80) return { label: 'Força: média', css: 'medium' };
    return { label: 'Força: forte', css: 'strong' };
  }

  // ---------- Duração ----------

  function readDurationSeconds() {
    const value = Number(durationInput.value);
    const unit = Number(unitSelect.value);
    if (!Number.isFinite(value) || value <= 0) return NaN;
    return Math.round(value * unit);
  }

  function formatRemaining(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  function tick() {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      expire();
      return;
    }

    countdownEl.textContent = formatRemaining(remaining);

    const ratio = remaining / totalMs;
    barFill.style.width = `${ratio * 100}%`;
    barFill.classList.toggle('low', ratio <= 0.3 && ratio > 0.1);
    barFill.classList.toggle('critical', ratio <= 0.1);
  }

  function expire() {
    clearInterval(timerId);
    timerId = null;
    currentPassword = '';

    passwordInput.type = 'text';
    passwordInput.value = '';
    passwordInput.placeholder = 'Senha expirada';
    countdownEl.textContent = 'expirada';
    barFill.style.width = '0%';
    strengthEl.textContent = '';
    strengthEl.className = 'strength';

    result.classList.add('expired');
    copyBtn.disabled = true;
    toggleBtn.disabled = true;
    shareBtn.disabled = true;

    showMessage('A senha expirou. Gere uma nova quando precisar.', 'error', 0);
  }

  // ---------- Mensagens ----------

  function showMessage(text, type = 'ok', duration = 3500) {
    clearTimeout(messageTimeout);
    message.textContent = text;
    message.className = `message ${type}`;
    if (duration > 0) {
      messageTimeout = setTimeout(() => {
        message.textContent = '';
        message.className = 'message';
      }, duration);
    }
  }

  // ---------- Ações ----------

  function handleGenerate(event) {
    event.preventDefault();

    const sets = getActiveSets();
    if (sets.length === 0) {
      showMessage('Escolha pelo menos um tipo de caractere.', 'error');
      return;
    }

    const seconds = readDurationSeconds();
    if (Number.isNaN(seconds) || seconds < MIN_SECONDS || seconds > MAX_SECONDS) {
      showMessage('A duração deve ficar entre 5 segundos e 7 dias.', 'error');
      durationInput.focus();
      return;
    }

    const length = Number(lengthInput.value);
    currentPassword = generatePassword(length, sets);

    // Prepara a exibição
    clearInterval(timerId);
    totalMs = seconds * 1000;
    expiresAt = Date.now() + totalMs;

    passwordInput.type = 'text';
    passwordInput.placeholder = '';
    passwordInput.value = currentPassword;
    toggleBtn.textContent = 'Ocultar';
    toggleBtn.setAttribute('aria-label', 'Ocultar senha');

    const strength = describeStrength(length, sets.join('').length);
    strengthEl.textContent = strength.label;
    strengthEl.className = `strength ${strength.css}`;

    result.classList.remove('expired');
    copyBtn.disabled = false;
    toggleBtn.disabled = false;
    shareBtn.disabled = false;
    result.hidden = false;

    barFill.className = 'bar-fill';
    tick();
    timerId = setInterval(tick, 250);

    showMessage('Senha gerada!', 'ok');
  }

  function toggleVisibility() {
    const hidden = passwordInput.type === 'password';
    passwordInput.type = hidden ? 'text' : 'password';
    toggleBtn.textContent = hidden ? 'Ocultar' : 'Mostrar';
    toggleBtn.setAttribute('aria-label', hidden ? 'Ocultar senha' : 'Mostrar senha');
  }

  async function copyPassword() {
    if (!currentPassword) return;

    try {
      await navigator.clipboard.writeText(currentPassword);
    } catch (error) {
      // Alternativa para navegadores sem acesso à área de transferência.
      const previousType = passwordInput.type;
      passwordInput.type = 'text';
      passwordInput.select();
      document.execCommand('copy');
      passwordInput.type = previousType;
      passwordInput.setSelectionRange(0, 0);
    }

    showMessage('Senha copiada!', 'ok');
  }

  function shareByEmail() {
    if (!currentPassword) return;

    const email = emailInput.value.trim();
    if (!email || !emailInput.checkValidity()) {
      showMessage('Digite um e-mail válido para compartilhar.', 'error');
      emailInput.focus();
      return;
    }

    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      expire();
      return;
    }

    const validUntil = new Date(expiresAt).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    const subject = 'Sua senha temporária';
    const body =
      'Olá!\n\n' +
      `Sua senha temporária é: ${currentPassword}\n\n` +
      `Ela é válida por ${formatRemaining(remaining)} (até ${validUntil}).\n` +
      'Por segurança, não compartilhe esta mensagem com mais ninguém.\n';

    const address = encodeURIComponent(email).replace(/%40/g, '@');
    window.location.href =
      `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    showMessage('Abrindo seu aplicativo de e-mail…', 'ok');
  }

  function applyPreset(event) {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    durationInput.value = chip.dataset.value;
    unitSelect.value = chip.dataset.unit;
  }

  // ---------- Eventos ----------
  form.addEventListener('submit', handleGenerate);
  lengthInput.addEventListener('input', () => {
    lengthOut.textContent = lengthInput.value;
  });
  document.querySelector('.presets').addEventListener('click', applyPreset);
  toggleBtn.addEventListener('click', toggleVisibility);
  copyBtn.addEventListener('click', copyPassword);
  shareBtn.addEventListener('click', shareByEmail);
})();
