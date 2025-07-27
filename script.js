let coins = 0;
let totalRotations = Number(localStorage.getItem("rotations")) || 0;
let fanBroken = false;
let repairing = false;
let allowHoldRepair = false;
let isHolding = false;

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
}

// Handle hold for both mouse and touch devices
fanElement.addEventListener("mousedown", startHoldRepair);
fanElement.addEventListener("touchstart", startHoldRepair);

fanElement.addEventListener("mouseup", stopHoldRepair);
fanElement.addEventListener("mouseleave", stopHoldRepair);
fanElement.addEventListener("touchend", stopHoldRepair);
fanElement.addEventListener("touchcancel", stopHoldRepair);

function startHoldRepair(event) {
  if (!fanBroken || !allowHoldRepair || repairing) return;

  isHolding = true;
  repairing = true;
  document.getElementById("repairSound").play();
  const repairStartTime = Date.now();

  const interval = setInterval(() => {
    if (!isHolding) {
      clearInterval(interval);
      document.getElementById("repairSound").pause();
      document.getElementById("repairSound").currentTime = 0;
      repairing = false;
    }

    const heldDuration = Date.now() - repairStartTime;
    if (heldDuration >= 5000) {
      clearInterval(interval);
      document.getElementById("repairSound").pause();
      document.getElementById("repairSound").currentTime = 0;
      document.getElementById("repairSuccess").play();
      fanBroken = false;
      allowHoldRepair = false;
      repairing = false;
      hidePopup();
    }
  }, 100);

  // Prevent scroll while touching
  event.preventDefault();
}

function stopHoldRepair() {
  isHolding = false;
}
