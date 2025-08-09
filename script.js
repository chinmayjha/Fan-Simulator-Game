// GAME SETTINGS
    const REPAIR_DURATION = 3000; // ms (3s) - quick but noticeable; change to 2500 or 5000 if you prefer

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

    // prevent popup clicks causing fan spin (we place popup outside clickable area but also guard)
    popup.addEventListener('click', (e) => e.stopPropagation());

    // utility: haptic
    function vibrate(pattern) {
      try {
        if (navigator.vibrate) navigator.vibrate(pattern);
      } catch (e) { /* ignore */ }
    }

    // Spin handler
    fanContainer.addEventListener('click', (ev) => {
      // if clicking popup/button inside (should be stopped earlier) we still guard
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

      // Breaks at every 5th rotation: 5,10,15...
      if (totalRotations % 5 === 0) {
        fanBroken = true;
        vibrate(160);
        showPopup('⚠️ Fan is broken!', true);
      } else if ((totalRotations - 3) % 5 === 0) { // warnings at 3,8,13...
        vibrate(80);
        showPopup('⚠️ Warning! Fan is getting weaker.', false);
        // hide warning after a short while
        setTimeout(() => {
          // only hide if not replaced by broken popup
          if (!fanBroken) hidePopup();
        }, 1800);
      }
    });

    // show/hide popup
    function showPopup(message, withButtons = false) {
      // create content
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

    // Coin repair (fixed)
    function coinRepair(e) {
      if (e && e.stopPropagation) e.stopPropagation(); // prevent bubbling to fanContainer
      if (repairing) return; // already repairing
      if (coins >= 10) {
        coins -= 10;
        coinCountEl.innerText = coins;
        vibrate([60, 30, 60]); // small pattern
        // start automatic repair for a short duration (no need to hold)
        startAutoRepair(REPAIR_DURATION);
      } else {
        // not enough coins
        showPopup('❌ Not enough coins!');
        setTimeout(() => {
          if (fanBroken) showPopup('⚠️ Fan is broken!', true);
          else hidePopup();
        }, 1400);
      }
    }

    // Start automatic repair (e.g. coin repair)
    function startAutoRepair(duration) {
      if (!fanBroken) return; // nothing to repair
      repairing = true;
      // visual + sound
      fanContainer.classList.add('repairing');
      repairSound.currentTime = 0; repairSound.play();
      // ensure popup shows repairing state
      popup.innerHTML = `<p>Repairing...</p>`;
      popup.style.display = 'block';
      // prevent spins while repairing
      // finish after duration
      setTimeout(() => {
        finishRepair();
      }, duration);
    }

    // Hold-to-repair mode: click "Hold to Repair" first (activates mode)
    function startHoldRepairMode(e) {
      if (e && e.stopPropagation) e.stopPropagation();
      if (!fanBroken) return;
      if (holdModeActive) return; // already activated
      holdModeActive = true;
      // show instruction
      popup.innerHTML = `<p>Hold the fan to repair</p>`;
      popup.style.display = 'block';
      // disable page scroll while in hold mode (optional UX)
      document.body.style.overflow = 'hidden';

      // add hold listeners (can be re-used for multiple attempts; ensure duplicates not added)
      fanContainer.addEventListener('mousedown', holdStart, { passive:false });
      fanContainer.addEventListener('touchstart', holdStart, { passive:false });
      fanContainer.addEventListener('mouseup', holdEnd);
      fanContainer.addEventListener('mouseleave', holdEnd);
      fanContainer.addEventListener('touchend', holdEnd);
    }

    function holdStart(e) {
      // prevent touch from also causing a click
      if (e) e.preventDefault();
      if (!fanBroken || repairing) return;
      // start the hold-based repair; requires continuous hold
      repairing = true;
      fanContainer.classList.add('repairing');
      repairSound.currentTime = 0; repairSound.play();
      vibrate([40,20,40]);

      // start timer that completes repair after REPAIR_DURATION
      holdTimeout = setTimeout(() => {
        // done
        finishRepair();
      }, REPAIR_DURATION);
    }

    function holdEnd(e) {
      // user released before completion
      if (holdTimeout) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
        // stop partial repair
        repairSound.pause();
        fanContainer.classList.remove('repairing');
        repairing = false;
        vibrate(40);
        // keep hold mode active so user can try again without clicking Hold-to-Repair again
      }
    }

    // finish repair - centralized
    function finishRepair() {
      // stop repair sound and show success
      repairSound.pause();
      repairSuccess.currentTime = 0;
      repairSuccess.play().catch(()=>{ /* ignore playback error */ });

      vibrate([120, 40, 80]);

      fanBroken = false;
      repairing = false;
      fanContainer.classList.remove('repairing');
      hidePopup();

      // If hold mode was active, remove listeners and restore scroll
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

    // Expose functions to global scope (so inline onclick handlers work)
    window.coinRepair = coinRepair;
    window.startHoldRepairMode = startHoldRepairMode;

    // optional: hide popup when clicking outside (tap anywhere outside).
    // But only allow close when not broken (so user can't dismiss broken popup accidentally)
    document.addEventListener('click', (e) => {
      // if popup visible and not broken, hide it on outside clicks
      if (popup.style.display === 'block' && !fanBroken && !repairing) {
        // clicked outside popup? ensure not clicking the popup itself
        if (!popup.contains(e.target)) hidePopup();
      }
    });

    // (Optional) persist coins between reloads if you want:
    // Uncomment lines below to store coins in localStorage.
    // coinCountEl.innerText = coins = Number(localStorage.getItem('coins')||0);
    // Whenever you change coins, call localStorage.setItem('coins', coins);
    //
    // Currently coins do not persist across reloads (per earlier code).