let coins = 0;
let totalRotations = Number(localStorage.getItem("rotations")) || 0;
let fanBroken = false;
let repairing = false;

const fanElement = document.getElementById("fanContainer");
const popup = document.getElementById("popup");
const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

document.getElementById("rotationCount").innerText = totalRotations;

// --- Click to spin fan ---
fanElement.addEventListener("click", () => {
  if (fanBroken || repairing) return;

  totalRotations++;
  localStorage.setItem("rotations", totalRotations);
  document.getElementById("rotationCount").innerText = totalRotations;

  coins++;
  document.getElementById("coinCount").innerText = coins;

  fanElement.classList.add("spin");
  document.getElementById("fanSound").play();

  setTimeout(() => {
    fanElement.classList.remove("spin");
    document.getElementById("fanSound").pause();
    document.getElementById("fanSound").currentTime = 0;
  }, 1000);

  if (totalRotations % 5 === 0) {
    fanBroken = true;
    showPopup("Fan is broken!", true);
  } else if (totalRotations % 2 === 0) {
    showPopup("Warning! Fan is getting weaker.");
  }
});

// --- Popup handler ---
function showPopup(message, withButtons = false) {
  popup.innerHTML = `<p>${message}</p>`;
  if (withButtons) {
    const instructionText = isMobile
      ? "🌀 Spin the fan once to repair it"
      : "🖱️ Hold to repair the fan";
    popup.innerHTML += `
      <div class="popup-buttons">
        <div class="text-center text-dark fw-semibold">${instructionText}</div>
        <button onclick="coinRepair()">Pay 10 Coins</button>
      </div>
    `;
    if (isMobile) {
      enableDragRepair();
    } else {
      enableHoldRepair();
    }
  }
  popup.style.display = "block";
}

function hidePopup() {
  popup.style.display = "none";
}

// --- Coin Repair ---
function coinRepair() {
  if (coins >= 10) {
    coins -= 10;
    document.getElementById("coinCount").innerText = coins;
    showPopup("Please wait, the fan is being repaired...");
    document.getElementById("repairSound").play();
    setTimeout(() => {
      document.getElementById("repairSound").pause();
      document.getElementById("repairSound").currentTime = 0;
      document.getElementById("repairSuccess").play();
      fanBroken = false;
      hidePopup();
    }, 5000);
  } else {
    showPopup("Not enough coins! Returning to menu...");
    setTimeout(() => showPopup("Fan is broken!", true), 2000);
  }
}

// --- Hold to Repair (Desktop) ---
let holdTimeout;
function enableHoldRepair() {
  fanElement.addEventListener("mousedown", startHoldRepair);
  fanElement.addEventListener("mouseup", cancelHoldRepair);
  fanElement.addEventListener("mouseleave", cancelHoldRepair);
}

function startHoldRepair() {
  if (!fanBroken || repairing) return;
  repairing = true;
  document.getElementById("repairSound").play();
  holdTimeout = setTimeout(() => {
    document.getElementById("repairSound").pause();
    document.getElementById("repairSound").currentTime = 0;
    document.getElementById("repairSuccess").play();
    fanBroken = false;
    repairing = false;
    hidePopup();
  }, 5000);
}

function cancelHoldRepair() {
  clearTimeout(holdTimeout);
  document.getElementById("repairSound").pause();
  document.getElementById("repairSound").currentTime = 0;
  repairing = false;
}

// --- Drag to Spin Repair (Mobile) ---
let isDragging = false;
let lastAngle = null;
let totalDragRotation = 0;

function enableDragRepair() {
  fanElement.addEventListener("touchstart", dragStart);
  fanElement.addEventListener("touchmove", dragMove);
  fanElement.addEventListener("touchend", dragEnd);
}

function dragStart(e) {
  if (!fanBroken || repairing) return;
  isDragging = true;
  lastAngle = getTouchAngle(e);
  totalDragRotation = 0;
}

function dragMove(e) {
  if (!isDragging || !fanBroken) return;
  const currentAngle = getTouchAngle(e);
  if (lastAngle === null) {
    lastAngle = currentAngle;
    return;
  }

  let delta = currentAngle - lastAngle;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  if (Math.abs(delta) > 2) {
    document.getElementById("repairSound").play();
  } else {
    document.getElementById("repairSound").pause();
  }

  totalDragRotation += Math.abs(delta);
  lastAngle = currentAngle;

  if (totalDragRotation >= 360) {
    completeDragRepair();
  }
}

function dragEnd() {
  isDragging = false;
  lastAngle = null;
  document.getElementById("repairSound").pause();
  document.getElementById("repairSound").currentTime = 0;
}

function getTouchAngle(e) {
  const rect = fanElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const touch = e.touches[0];
  const dx = touch.clientX - centerX;
  const dy = touch.clientY - centerY;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function completeDragRepair() {
  document.getElementById("repairSound").pause();
  document.getElementById("repairSound").currentTime = 0;
  document.getElementById("repairSuccess").play();
  fanBroken = false;
  repairing = false;
  hidePopup();
}
