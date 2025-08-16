// GAME SETTINGS
const REPAIR_DURATION = 3000; // ms
const WARN_CHANCE = 0.2; // 20% warning chance

// Progressive break system
let breakChance = 0.05; // start 5%
const BREAK_INCREMENT = 0.05; // +5% per safe spin
const MAX_BREAK_CHANCE = 0.35; // cap 35%

// state
let coins = 0;
let totalRotations = Number(localStorage.getItem('rotations')) || 0;
let fanBroken = false;
let repairing = false;
let holdModeActive = false;
let holdTimeout = null;

// DOM
const fanContainer = document.getElementById('fanContainer');
const popup = document.getElementById('popup');
const coinCountEl = document.getElementById('coinCount');
const rotationCountEl = document.getElementById('rotationCount');
const fanSound = document.getElementById('fanSound');
const repairSound = document.getElementById('repairSound');
const repairSuccess = document.getElementById('repairSuccess');

// initial UI
coinCountEl.innerText = coins;
rotationCountEl.innerText = totalRotations;

// prevent popup clicks causing fan spin
popup.addEventListener('click', (e) => e.stopPropagation());

// haptic
function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { }
}

// Spin handler
fanContainer.addEventListener('click', () => {
  if (fanBroken || repairing) return;

  totalRotations++;
  localStorage.setItem('rotations', totalRotations);
  rotationCountEl.innerText = totalRotations;

  coins++;
  coinCountEl.innerText = coins;

  // spin animation + sound
  fanContainer.classList.add('spin');
  fanSound.currentTime = 0; fanSound.play();

  setTimeout(() => {
    fanContainer.classList.remove('spin');
    fanSound.pause();
  }, 900);

  // --- Progressive Break Logic ---
  if (totalRotations > 3) {
    if (Math.random() < breakChance) {
      fanBroken = true;
      vibrate(160);
      showPopup('⚠️ Fan is broken!', true);
      breakChance = 0.05; // reset chance after break
    } else {
      // Safe spin → increase break chance
      breakChance = Math.min(MAX_BREAK_CHANCE, breakChance + BREAK_INCREMENT);

      // Random warning
      if (Math.random() < WARN_CHANCE) {
        vibrate(80);
        showPopup('⚠️ Warning! Fan is getting weaker.', false);
        setTimeout(() => { if (!fanBroken) hidePopup(); }, 1800);
      }
    }
  }
});

// Popup helpers
function showPopup(message, withButtons = false) {
  if (withButtons) {
    popup.innerHTML = `
      <p>${message}</p>
      <div class="popup-buttons">
        <button class="btn-repair" onclick="coinRepair(event)">Pay 10 Coins</button>
        <button class="btn-hold" onclick="startHoldRepairMode(event)">Hold to Repair</button>
      </div>
    `;
  } else {
    popup.innerHTML = `<p>${message}</p>`;
  }
  popup.style.display = 'block';
}
function hidePopup() {
  popup.style.display = 'none';
  popup.innerHTML = '';
}

// Coin repair
function coinRepair(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (repairing) return;
  if (coins >= 10) {
    coins -= 10;
    coinCountEl.innerText = coins;
    vibrate([60, 30, 60]);
    startAutoRepair(REPAIR_DURATION);
  } else {
    showPopup('❌ Not enough coins!');
    setTimeout(() => {
      if (fanBroken) showPopup('⚠️ Fan is broken!', true);
      else hidePopup();
    }, 1400);
  }
}

// Auto repair
function startAutoRepair(duration) {
  if (!fanBroken) return;
  repairing = true;
  fanContainer.classList.add('repairing');
  repairSound.currentTime = 0; repairSound.play();
  popup.innerHTML = `<p>Repairing...</p>`;
  popup.style.display = 'block';

  setTimeout(() => { finishRepair(); }, duration);
}

// Hold repair
function startHoldRepairMode(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (!fanBroken || holdModeActive) return;
  holdModeActive = true;
  popup.innerHTML = `<p>Hold the fan to repair</p>`;
  popup.style.display = 'block';
  document.body.style.overflow = 'hidden';

  fanContainer.addEventListener('mousedown', holdStart, { passive:false });
  fanContainer.addEventListener('touchstart', holdStart, { passive:false });
  fanContainer.addEventListener('mouseup', holdEnd);
  fanContainer.addEventListener('mouseleave', holdEnd);
  fanContainer.addEventListener('touchend', holdEnd);
}
function holdStart(e) {
  if (e) e.preventDefault();
  if (!fanBroken || repairing) return;
  repairing = true;
  fanContainer.classList.add('repairing');
  repairSound.currentTime = 0; repairSound.play();
  vibrate([40,20,40]);

  holdTimeout = setTimeout(() => { finishRepair(); }, REPAIR_DURATION);
}
function holdEnd() {
  if (holdTimeout) {
    clearTimeout(holdTimeout);
    holdTimeout = null;
    repairSound.pause();
    fanContainer.classList.remove('repairing');
    repairing = false;
    vibrate(40);
  }
}

// Finish repair
function finishRepair() {
  repairSound.pause();
  repairSuccess.currentTime = 0;
  repairSuccess.play().catch(()=>{});

  vibrate([120, 40, 80]);

  fanBroken = false;
  repairing = false;
  fanContainer.classList.remove('repairing');
  hidePopup();

  if (holdModeActive) {
    removeHoldListeners();
    holdModeActive = false;
    document.body.style.overflow = '';
  }
}
function removeHoldListeners() {
  fanContainer.removeEventListener('mousedown', holdStart);
  fanContainer.removeEventListener('touchstart', holdStart);
  fanContainer.removeEventListener('mouseup', holdEnd);
  fanContainer.removeEventListener('mouseleave', holdEnd);
  fanContainer.removeEventListener('touchend', holdEnd);
}

// Expose
window.coinRepair = coinRepair;
window.startHoldRepairMode = startHoldRepairMode;

// Hide popup when clicking outside
document.addEventListener('click', (e) => {
  if (popup.style.display === 'block' && !fanBroken && !repairing) {
    if (!popup.contains(e.target)) hidePopup();
  }
});
