// --- CONSTANTES DE CARACTERES ---
const CHAR_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHAR_NUMBERS = "0123456789";
const CHAR_SYMBOLS = "!@#$%?";

// --- ESTADO DA APLICAÇÃO ---
let durationInSeconds = 300; // 5 Minutos padrão
let currentTimer = durationInSeconds;
let timerInterval = null;
let currentPassword = "";

// --- ELEMENTOS DOM ---
const displayTimer = document.getElementById('displayTimer');
const timerCard = document.getElementById('timerCard');
const timerStatus = document.getElementById('timerStatus');
const btnEditTime = document.getElementById('btnEditTime');
const editTimePanel = document.getElementById('editTimePanel');
const inputMinutes = document.getElementById('inputMinutes');
const inputSeconds = document.getElementById('inputSeconds');
const btnSaveTime = document.getElementById('btnSaveTime');

const passwordOutput = document.getElementById('passwordOutput');
const btnCopy = document.getElementById('btnCopy');
const btnGenerate = document.getElementById('btnGenerate');
const strengthBadge = document.getElementById('strengthBadge');

const lengthRange = document.getElementById('lengthRange');
const lengthVal = document.getElementById('lengthVal');
const chkUppercase = document.getElementById('chkUppercase');
const chkLowercase = document.getElementById('chkLowercase');
const chkNumbers = document.getElementById('chkNumbers');
const chkSymbols = document.getElementById('chkSymbols');

const emailForm = document.getElementById('emailForm');
const recipientEmail = document.getElementById('recipientEmail');
const btnSendEmail = document.getElementById('btnSendEmail');
const emailFeedback = document.getElementById('emailFeedback');

// --- LÓGICA DO CRONÔMETRO ---
function startTimer() {
clearInterval(timerInterval);
currentTimer = durationInSeconds;
updateTimerDisplay();

timerCard.classList.remove('timer-warning');
timerCard.classList.add('pulse-timer');
timerStatus.innerText = "A senha gerada expirará após este tempo decorrer.";
timerStatus.className = "text-xs text-slate-400";

timerInterval = setInterval(() => {
    currentTimer--;
    updateTimerDisplay();

    // Alerta visual nos últimos 30 segundos
    if (currentTimer <= 30 && currentTimer > 0) {
        timerCard.classList.remove('pulse-timer');
        timerCard.classList.add('timer-warning');
        timerStatus.innerText = "Atenção: A senha está prestes a expirar!";
        timerStatus.className = "text-xs text-red-400 font-semibold";
    }

    // Quando o tempo esgota
    if (currentTimer <= 0) {
        clearInterval(timerInterval);
        onTimerExpire();
    }
}, 1000);


}

function updateTimerDisplay() {
const mins = Math.floor(currentTimer / 60);
const secs = currentTimer % 60;
displayTimer.innerText = ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')};
}

function onTimerExpire() {
passwordOutput.value = "EXPIRED";
passwordOutput.className = "w-full bg-slate-900 border-2 border-red-500 text-xl md:text-2xl font-mono text-center text-red-500 py-3.5 px-12 rounded-xl focus:outline-none tracking-wider";
timerStatus.innerText = "Sua senha temporária expirou. Gere uma nova senha.";
strengthBadge.innerText = "Expirada";
strengthBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-red-900/50 text-red-400 border border-red-700/50";
currentPassword = "";
}

// Edit painel do Timer
btnEditTime.addEventListener('click', () => {
editTimePanel.classList.toggle('hidden');
});

btnSaveTime.addEventListener('click', () => {
const mins = parseInt(inputMinutes.value) || 0;
const secs = parseInt(inputSeconds.value) || 0;

const total = (mins * 60) + secs;
if (total < 5) {
    showToast("O tempo mínimo deve ser de pelo menos 5 segundos.", "error");
    return;
}

durationInSeconds = total;
editTimePanel.classList.add('hidden');
generatePassword(); // Regenera senha com novo timer
showToast("Tempo limite atualizado com sucesso!", "success");


});

// --- GERADOR DE SENHAS ---
function generatePassword() {
let allowedChars = "";
if (chkUppercase.checked) allowedChars += CHAR_UPPER;
if (chkLowercase.checked) allowedChars += CHAR_LOWER;
if (chkNumbers.checked) allowedChars += CHAR_NUMBERS;
if (chkSymbols.checked) allowedChars += CHAR_SYMBOLS;

if (allowedChars === "") {
    showToast("Selecione pelo menos uma opção de caractere!", "error");
    return;
}

const length = parseInt(lengthRange.value);
let password = "";

// Garantir aleatoriedade usando Crypto API se disponível
const array = new Uint32Array(length);
window.crypto.getRandomValues(array);

for (let i = 0; i < length; i++) {
    password += allowedChars[array[i] % allowedChars.length];
}

currentPassword = password;
passwordOutput.value = password;
passwordOutput.className = "w-full bg-slate-900 border-2 border-slate-700 text-xl md:text-2xl font-mono text-center text-emerald-400 py-3.5 px-12 rounded-xl focus:outline-none tracking-wider select-all";

evaluateStrength(password);
startTimer();


}

function evaluateStrength(pwd) {
let score = 0;
if (pwd.length >= 12) score++;
if (/[A-Z]/.test(pwd)) score++;
if (/[a-z]/.test(pwd)) score++;
if (/[0-9]/.test(pwd)) score++;
if (/[!@#$%?]/.test(pwd)) score++;

if (score <= 2) {
    strengthBadge.innerText = "Fraca";
    strengthBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-900/40 text-amber-400 border border-amber-700/50";
} else if (score <= 4) {
    strengthBadge.innerText = "Média";
    strengthBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-900/40 text-blue-400 border border-blue-700/50";
} else {
    strengthBadge.innerText = "Forte";
    strengthBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-700/50";
}


}

// Sincronizar slider de comprimento
lengthRange.addEventListener('input', (e) => {
lengthVal.innerText = e.target.value;
});

btnGenerate.addEventListener('click', generatePassword);

// Copiar senha
btnCopy.addEventListener('click', () => {
if (!currentPassword || passwordOutput.value === "EXPIRED") {
showToast("Nenhuma senha válida para copiar!", "error");
return;
}

const dummy = document.createElement("textarea");
document.body.appendChild(dummy);
dummy.value = currentPassword;
dummy.select();
document.execCommand("copy");
document.body.removeChild(dummy);

showToast("Senha copiada para a área de transferência!", "success");


});

// --- SIMULAÇÃO DE ENVIO DE E-MAIL ---
emailForm.addEventListener('submit', (e) => {
e.preventDefault();

const email = recipientEmail.value.trim();
if (!email) return;

if (!currentPassword || currentPassword === "EXPIRED") {
    showToast("Crie uma nova senha ativa antes de enviar por e-mail.", "error");
    return;
}

// Efeito visual de carregamento
btnSendEmail.disabled = true;
btnSendEmail.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Enviando...`;

setTimeout(() => {
    btnSendEmail.disabled = false;
    btnSendEmail.innerHTML = `<i class="fa-solid fa-share font-normal"></i> <span>Enviar</span>`;

    const mins = Math.floor(currentTimer / 60);
    const secs = currentTimer % 60;
    const remainingFormatted = `${mins}m ${secs}s`;

    emailFeedback.className = "rounded-xl p-4 text-xs space-y-1.5 bg-emerald-950/60 border border-emerald-700/50 text-emerald-200 block";
    emailFeedback.innerHTML = `
        <div class="flex items-center gap-2 font-bold text-emerald-400">
            <i class="fa-solid fa-circle-check text-sm"></i>
            E-mail enviado com sucesso!
        </div>
        <p><strong>Destinatário:</strong> ${email}</p>
        <p><strong>Senha enviada:</strong> <span class="font-mono text-emerald-300 font-bold">${currentPassword}</span></p>
        <p><strong>Tempo restante de validade:</strong> ${remainingFormatted}</p>
    `;

    recipientEmail.value = "";
}, 1000);


});

// Utility: Exibir mensagem estilo Toast
function showToast(message, type = "success") {
const toast = document.createElement("div");
toast.className = fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-xl text-xs font-medium text-white flex items-center gap-2 z-50 transition-all duration-300 ${ type === "success" ? "bg-emerald-600" : "bg-red-600" };
toast.innerHTML = <i class="${type === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-triangle-exclamation'}"></i> ${message};

document.body.appendChild(toast);

setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
}, 3000);


}

// Inicialização automática
window.onload = () => {
generatePassword();
};
