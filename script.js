(() => {
  const sets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
  };
  const $ = (selector) => document.querySelector(selector);
  const lengthSlider = $('#length-slider');
  const durationSelect = $('#duration-select');
  const customDurationWrap = $('#custom-duration-wrap');
  const passwordDisplay = $('#password-display');
  const emptyState = $('#empty-state');
  const statusBadge = $('#status-badge');
  const countdown = $('#countdown');
  const countdownLabel = $('#countdown-label');
  const progressRing = $('#progress-ring');
  const copyButton = $('#copy-button');
  const emailButton = $('#email-button');
  const visibilityButton = $('#visibility-button');
  const expiredOverlay = $('#expired-overlay');
  const historyList = $('#history-list');
  const historyCount = $('#history-count');
  const circumference = 2 * Math.PI * 66;
  let password = '';
  let expiresAt = 0;
  let durationSeconds = 60;
  let revealed = true;
  let timer = null;
  let history = JSON.parse(localStorage.getItem('temppass-history') || '[]');

  const secureIndex = (max) => {
    const values = new Uint32Array(1);
    const limit = 0xffffffff - (0xffffffff % max);
    do crypto.getRandomValues(values); while (values[0] >= limit);
    return values[0] % max;
  };
  const getDuration = () => durationSelect.value === 'custom' ? Math.max(5, Math.min(3600, Number($('#custom-duration').value) || 120)) : Number(durationSelect.value);
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const formatDuration = (seconds) => seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}min`;
  const selectedPool = () => {
    let pool = '';
    Object.keys(sets).forEach((key) => { if ($(`#${key}`).checked) pool += sets[key]; });
    if ($('#symbols').checked) pool += $('#symbol-set').value;
    return pool;
  };
  const updateMetrics = () => {
    const pool = selectedPool();
    const value = Number(lengthSlider.value);
    $('#length-value').innerHTML = `${value} <small>car.</small>`;
    const entropy = pool.length > 1 ? Math.round(value * Math.log2(pool.length)) : 0;
    $('#entropy').textContent = `${entropy} bits`;
    const strength = entropy >= 180 ? ['Ultra', '#059669', '100%'] : entropy >= 100 ? ['Forte', '#0284c7', '76%'] : entropy >= 60 ? ['MÃ©dia', '#d97706', '50%'] : ['Fraca', '#dc2626', '28%'];
    $('#strength').textContent = strength[0];
    $('#strength-meter').style.width = strength[2];
    $('#strength-meter').style.background = strength[1];
    $('#strength-description').textContent = `${value} caracteres Ã— conjunto selecionado`;
  };
  const renderHistory = () => {
    historyCount.textContent = `${history.length}/5`;
    historyList.innerHTML = history.length ? history.map((item) => `<span class="history-item">â€¢â€¢â€¢â€¢â€¢â€¢ Â· ${item.length} car. Â· ${formatDuration(item.duration)}</span>`).join('') : '<p>Suas Ãºltimas geraÃ§Ãµes aparecerÃ£o aqui â€” sem salvar as senhas.</p>';
  };
  const setPreset = (preset) => {
    const configs = { pin: [6, { uppercase: false, lowercase: false, numbers: true, symbols: false }, '300'], wifi: [16, { uppercase: true, lowercase: true, numbers: true, symbols: true }, '900'], secure: [32, { uppercase: true, lowercase: true, numbers: true, symbols: true }, '300'] };
    const [size, selected, duration] = configs[preset];
    lengthSlider.value = size;
    Object.entries(selected).forEach(([key, value]) => { $(`#${key}`).checked = value; $(`#${key}`).closest('.character-option').classList.toggle('selected', value); });
    durationSelect.value = duration;
    customDurationWrap.classList.add('hidden');
    updateMetrics();
  };
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    countdown.textContent = formatTime(remaining);
    countdownLabel.textContent = remaining ? 'restante' : 'encerrada';
    progressRing.style.strokeDashoffset = String(circumference * (1 - remaining / durationSeconds));
    if (!remaining) expire();
  };
  const expire = () => {
    clearInterval(timer); timer = null;
    statusBadge.textContent = 'expirada'; statusBadge.className = 'status-badge expired';
    progressRing.classList.add('expired'); expiredOverlay.classList.remove('hidden');
    copyButton.disabled = true; emailButton.disabled = true; visibilityButton.disabled = true;
  };
  const generate = () => {
    const pool = selectedPool();
    if (!pool) return alert('Selecione pelo menos um conjunto de caracteres.');
    password = Array.from({ length: Number(lengthSlider.value) }, () => pool[secureIndex(pool.length)]).join('');
    durationSeconds = getDuration(); expiresAt = Date.now() + durationSeconds * 1000; revealed = true;
    clearInterval(timer); timer = setInterval(tick, 250);
    emptyState.classList.add('hidden'); passwordDisplay.classList.remove('hidden'); passwordDisplay.textContent = password;
    passwordDisplay.classList.remove('password-enter'); void passwordDisplay.offsetWidth; passwordDisplay.classList.add('password-enter');
    statusBadge.textContent = 'em uso'; statusBadge.className = 'status-badge active';
    expiredOverlay.classList.add('hidden'); progressRing.classList.remove('expired'); copyButton.disabled = false; emailButton.disabled = false; visibilityButton.disabled = false; visibilityButton.textContent = 'â—‰ Ocultar';
    $('#generated-time').textContent = `gerada ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    history = [{ length: Number(lengthSlider.value), duration: durationSeconds }, ...history].slice(0, 5); localStorage.setItem('temppass-history', JSON.stringify(history)); renderHistory(); tick();
  };
  lengthSlider.addEventListener('input', updateMetrics);
  ['uppercase', 'lowercase', 'numbers', 'symbols'].forEach((key) => $(`#${key}`).addEventListener('change', (event) => { event.target.closest('.character-option').classList.toggle('selected', event.target.checked); updateMetrics(); }));
  $('#symbol-set').addEventListener('input', updateMetrics);
  durationSelect.addEventListener('change', () => customDurationWrap.classList.toggle('hidden', durationSelect.value !== 'custom'));
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  $('#generate-button').addEventListener('click', generate); $('#regenerate-button').addEventListener('click', generate);
  visibilityButton.addEventListener('click', () => { revealed = !revealed; passwordDisplay.textContent = revealed ? password : 'â€¢'.repeat(password.length); visibilityButton.textContent = revealed ? 'â—‰ Ocultar' : 'â—‰ Revelar'; });
  copyButton.addEventListener('click', async () => { await navigator.clipboard.writeText(password); alert('Senha copiada para a Ã¡rea de transferÃªncia!'); });
  emailButton.addEventListener('click', () => { const body = encodeURIComponent(`OlÃ¡!\n\nSua senha temporÃ¡ria Ã©: ${password}\n\nEla expira em ${formatDuration(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))}.`); window.location.href = `mailto:?subject=Sua senha temporÃ¡ria&body=${body}`; });
  updateMetrics(); renderHistory();
})();
