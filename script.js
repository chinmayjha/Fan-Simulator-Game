let coins = 0;
let totalRotations = Number(localStorage.getItem("rotations")) || 0;
let fanBroken = false;
let repairing = false;
let allowHoldRepair = false;
let isHolding = false;
let repairTimeout;

const fanElement = document.getElementById("fanContainer");
const popup = document.getElementById("popup");

document.getElementById("rotationCount").innerText = totalRotations;

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

function showPopup(message, withButtons = false) {
  popup.innerHTML = `<p>${message}</p>`;
  if (withButtons) {
    popup.innerHTML += `
      <div class="popup-buttons">
        <button onclick="startManualRepair()">Hold to Repair</button>
        <button onclick="coinRepair()">Pay 10 Coins</button>
      </div>
    `;
  } else if (message === "Now hold the fan to repair...") {
    popup.innerHTML += `
      <div id="holdArea" class="hold-area">Touch and hold here to repair</div>
    `;
  }
  popup.style.display = "block";
}

function hidePopup() {
  popup.style.display = "none";
}

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

function startManualRepair() {
  allowHoldRepair = true;
  showPopup("Now hold the fan to repair...");

  setTimeout(() => {
    const holdArea = document.getElementById("holdArea");
    if (!holdArea) return;

    holdArea.addEventListener("mousedown", handleHoldStart);
    holdArea.addEventListener("mouseup", handleHoldEnd);
    holdArea.addEventListener("mouseleave", handleHoldEnd);

    holdArea.addEventListener("touchstart", handleHoldStart, { passive: false });
    holdArea.addEventListener("touchend", handleHoldEnd);
    holdArea.addEventListener("touchcancel", handleHoldEnd);
  }, 100);
}

function handleHoldStart(e) {
  if (repairing) return;
  e.preventDefault();
  isHolding = true;
  repairing = true;
  document.getElementById("repairSound").play();

  repairTimeout = setTimeout(() => {
    if (isHolding) {
      completeRepair();
    }
  }, 5000);
}

function handleHoldEnd() {
  if (!repairing) return;
  isHolding = false;
  repairing = false;
  clearTimeout(repairTimeout);
  document.getElementById("repairSound").pause();
  document.getElementById("repairSound").currentTime = 0;
}

function completeRepair() {
  isHolding = false;
  repairing = false;
  allowHoldRepair = false;

  document.getElementById("repairSound").pause();
  document.getElementById("repairSound").currentTime = 0;
  document.getElementById("repairSuccess").play();
  fanBroken = false;
  hidePopup();
}
