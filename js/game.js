/**
 * KOZMINSKI ESCAPE: POLOWANIE NA ECTS
 * Główny silnik gry (js/game.js)
 * Akademia Leona Koźmińskiego (ALK) w Warszawie
 */

(function () {
  'use strict';

  // --- Elementy DOM ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // HUD
  const ectsCounterEl = document.getElementById('ects-counter');
  const ectsProgressBarEl = document.getElementById('ects-progress-bar');
  const staminaBarEl = document.getElementById('stamina-bar');
  const staminaStatusEl = document.getElementById('stamina-status-text');
  const campusStatusEl = document.getElementById('campus-status');
  const audioToggleBtn = document.getElementById('btn-audio-toggle');
  const audioIconEl = document.getElementById('audio-icon');
  const pauseToggleBtn = document.getElementById('btn-pause-toggle');
  const pauseIconEl = document.getElementById('pause-icon');

  // Dymek profesora
  const speechBubbleEl = document.getElementById('speech-bubble');
  const professorQuoteEl = document.getElementById('professor-quote');

  // Buff indicator
  const buffIndicatorEl = document.getElementById('active-buff-indicator');
  const buffIconEl = document.getElementById('buff-icon');
  const buffNameEl = document.getElementById('buff-name');
  const buffTimerEl = document.getElementById('buff-timer');

  // Modale
  const startModal = document.getElementById('start-modal');
  const gameOverModal = document.getElementById('game-over-modal');
  const victoryModal = document.getElementById('victory-modal');

  // Przyciski modali
  const btnStartGame = document.getElementById('btn-start-game');
  const btnRestartGame = document.getElementById('btn-restart-game');
  const btnVictoryRestart = document.getElementById('btn-victory-restart');

  // Statystyki końcowe
  const failEctsEl = document.getElementById('fail-ects-score');
  const failTimeEl = document.getElementById('fail-time-score');
  const failCoffeesEl = document.getElementById('fail-coffees-score');
  const victoryEctsEl = document.getElementById('victory-ects-score');
  const victoryTimeEl = document.getElementById('victory-time-score');

  // Przyciski dotykowe
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnSprint = document.getElementById('btn-sprint');

  // --- Stan Gry ---
  const TARGET_ECTS = 30;
  let gameState = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER', 'VICTORY'
  let ectsCollected = 0;
  let coffeesDrunk = 0;
  let startTime = 0;
  let elapsedTime = 0;
  let lastFrameTime = performance.now();

  // Sterowanie
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false
  };

  // Cytaty Profesora z ALK
  const quotes = [
    "„Panie Kowalski! Termin oddania eseju minął wczoraj o północy!”",
    "„Czy pan myśli, że zaliczy pan Finanse Behawioralne bieganiem po Patio?!”",
    "„W Dziekanacie już drukują dla pana protokół wrześniowy!”",
    "„Proszę się natychmiast zatrzymać, Egzamin z Mikroekonomii nie poczeka!”",
    "„Gdzie jest pańska analiza SWOT i bibliografia w formacie APA?!”",
    "„Widzę pana za automatem z kawą w Budynku D!”",
    "„Brak obecności na wykładzie oznacza zerówkę!”",
    "„Kolego, punkty ECTS same się nie obronią!”"
  ];
  let quoteTimer = 0;
  let quoteDisplayTime = 0;

  // Strefy Kampusu ALK
  const zones = [
    { name: "Budynek D · Katedra Finansów", x: 0, y: 0, w: 260, h: 260, color: "#111c33" },
    { name: "Budynek A · Aula Główna", x: 540, y: 0, w: 260, h: 260, color: "#141e30" },
    { name: "Zielone Patio ALK", x: 260, y: 140, w: 280, h: 260, color: "#062b1f" },
    { name: "Budynek C · Biblioteka i Dziekanat", x: 0, y: 280, w: 260, h: 260, color: "#13213a" },
    { name: "Kawiarnia & Bistro Koźmiński", x: 540, y: 280, w: 260, h: 260, color: "#2d1f11" }
  ];

  // Ściany i Przeszkody w Kampusie (kolizje)
  const obstacles = [
    // Kolumny i biurka Budynku D
    { x: 50, y: 50, w: 60, h: 40, label: "Biurko Katedry" },
    { x: 150, y: 120, w: 40, h: 70, label: "Ściana sali D-101" },
    // Kolumny Budynku A
    { x: 600, y: 60, w: 80, h: 40, label: "Rektorat" },
    { x: 680, y: 140, w: 50, h: 60, label: "Gabloty z Pucharami ALK" },
    // Patio: Donice z fikusami i ławki
    { x: 310, y: 190, w: 50, h: 40, label: "Rośliny Patio" },
    { x: 440, y: 190, w: 50, h: 40, label: "Rośliny Patio" },
    { x: 375, y: 310, w: 50, h: 40, label: "Ławka z parasolem" },
    // Budynek C (Biblioteka)
    { x: 60, y: 340, w: 70, h: 50, label: "Regały Biblioteczne" },
    { x: 160, y: 410, w: 50, h: 60, label: "Stanowisko Dziekanatu" },
    // Bistro ALK
    { x: 590, y: 350, w: 60, h: 50, label: "Lada Bistro" },
    { x: 690, y: 400, w: 50, h: 50, label: "Stoliki Kawiarni" }
  ];

  // Gracz (Student)
  const player = {
    x: 400,
    y: 270,
    radius: 14,
    baseSpeed: 3.2,
    sprintSpeed: 5.6,
    stamina: 100,
    maxStamina: 100,
    staminaDrain: 28, // na sekundę sprintu
    staminaRegen: 18, // na sekundę odpoczynku
    isExhausted: false,
    speedBuffDuration: 0,
    shieldBuffDuration: 0,
    direction: { x: 0, y: 1 }
  };

  // Egzaminator (Profesor)
  const professor = {
    x: 100,
    y: 100,
    radius: 16,
    speed: 2.2,
    baseSpeed: 2.2,
    alertSpeed: 3.8,
    isChasing: false,
    direction: { x: 0, y: 0 },
    patrolTarget: { x: 700, y: 100 },
    alertCooldown: 0
  };

  // Przedmioty do zebrania
  let items = [];

  function spawnItems() {
    items = [];
    // Spawnowanie punktów ECTS (na starcie 14, odradzają się)
    for (let i = 0; i < 14; i++) {
      spawnItem('ECTS');
    }
    // 3 kawy
    for (let i = 0; i < 3; i++) {
      spawnItem('COFFEE');
    }
    // 2 legitymacje
    for (let i = 0; i < 2; i++) {
      spawnItem('SHIELD');
    }
  }

  function spawnItem(type) {
    let valid = false;
    let x = 0, y = 0;
    let tries = 0;

    while (!valid && tries < 100) {
      tries++;
      x = 30 + Math.random() * (canvas.width - 60);
      y = 30 + Math.random() * (canvas.height - 60);

      // Sprawdź kolizję ze ścianami
      const collidesObstacle = obstacles.some(obs =>
        x > obs.x - 15 && x < obs.x + obs.w + 15 &&
        y > obs.y - 15 && y < obs.y + obs.h + 15
      );

      // Sprawdź dystans od innych itemów
      const tooClose = items.some(item => {
        const dx = item.x - x;
        const dy = item.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 35;
      });

      if (!collidesObstacle && !tooClose) {
        valid = true;
      }
    }

    if (valid) {
      items.push({
        x: x,
        y: y,
        radius: type === 'ECTS' ? 10 : 12,
        type: type,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  // --- Zarządzanie stanem i modalami ---
  function showModal(modal) {
    [startModal, gameOverModal, victoryModal].forEach(m => m.classList.add('hidden'));
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function triggerProfessorQuote(text) {
    const quote = text || quotes[Math.floor(Math.random() * quotes.length)];
    professorQuoteEl.textContent = quote;
    speechBubbleEl.classList.remove('hidden-dialogue');
    quoteDisplayTime = 4.0; // Pokaż na 4 sekundy
  }

  function startGame() {
    gameState = 'PLAYING';
    ectsCollected = 0;
    coffeesDrunk = 0;
    startTime = performance.now();
    elapsedTime = 0;

    // Reset gracza
    player.x = 400;
    player.y = 270;
    player.stamina = player.maxStamina;
    player.isExhausted = false;
    player.speedBuffDuration = 0;
    player.shieldBuffDuration = 0;

    // Reset profesora
    professor.x = 100;
    professor.y = 100;
    professor.speed = professor.baseSpeed;
    professor.isChasing = false;

    // Spawn przedmiotów
    spawnItems();

    // Ukryj modale
    showModal(null);
    triggerProfessorQuote("„Rozpoczynamy kolokwium z Zasad Ekonomii! Nikomu nie pozwolę uciec!”");

    if (window.gameAudio) {
      window.gameAudio.initAudioContext();
    }
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    failEctsEl.textContent = ectsCollected;
    failTimeEl.textContent = formatTime(elapsedTime);
    failCoffeesEl.textContent = coffeesDrunk;
    showModal(gameOverModal);

    if (window.gameAudio) {
      window.gameAudio.playGameOver();
    }
  }

  function victory() {
    gameState = 'VICTORY';
    victoryEctsEl.textContent = TARGET_ECTS;
    victoryTimeEl.textContent = formatTime(elapsedTime);
    showModal(victoryModal);

    if (window.gameAudio) {
      window.gameAudio.playVictory();
    }
  }

  // --- Obsługa Sterowania Klawiaturą ---
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') keys.sprint = true;

    // Klawisz M: Mute
    if (e.code === 'KeyM') {
      toggleAudio();
    }

    // Klawisz P lub ESC: Pauza
    if (e.code === 'KeyP' || e.code === 'Escape') {
      togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') keys.sprint = false;
  });

  // --- Obsługa Wirtualnych Przycisków Dotykowych ---
  function bindTouchBtn(element, keyName) {
    if (!element) return;
    const startHandler = (e) => {
      e.preventDefault();
      keys[keyName] = true;
      element.classList.add('active');
    };
    const endHandler = (e) => {
      e.preventDefault();
      keys[keyName] = false;
      element.classList.remove('active');
    };

    element.addEventListener('pointerdown', startHandler);
    element.addEventListener('pointerup', endHandler);
    element.addEventListener('pointercancel', endHandler);
    element.addEventListener('pointerleave', endHandler);
  }

  bindTouchBtn(btnUp, 'up');
  bindTouchBtn(btnDown, 'down');
  bindTouchBtn(btnLeft, 'left');
  bindTouchBtn(btnRight, 'right');
  bindTouchBtn(btnSprint, 'sprint');

  // Przycisk Dźwięku
  function toggleAudio() {
    if (window.gameAudio) {
      const isMuted = window.gameAudio.toggleMute();
      audioIconEl.textContent = isMuted ? '🔇' : '🔊';
      audioToggleBtn.title = isMuted ? "Włącz dźwięk (M)" : "Wycisz dźwięk (M)";
    }
  }
  audioToggleBtn.addEventListener('click', toggleAudio);

  // Przycisk Pauzy
  function togglePause() {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      pauseIconEl.textContent = '▶';
    } else if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
      pauseIconEl.textContent = '⏸';
      lastFrameTime = performance.now();
    }
  }
  pauseToggleBtn.addEventListener('click', togglePause);

  // Przyciski Modali
  btnStartGame.addEventListener('click', startGame);
  btnRestartGame.addEventListener('click', startGame);
  btnVictoryRestart.addEventListener('click', startGame);

  // --- Kolizje prostokąt - okrąg ---
  function checkCircleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const testX = Math.max(rx, Math.min(cx, rx + rw));
    const testY = Math.max(ry, Math.min(cy, ry + rh));
    const distX = cx - testX;
    const distY = cy - testY;
    const distance = Math.sqrt(distX * distX + distY * distY);
    return distance <= cr;
  }

  // --- Aktualizacja Fizyki & Logiki Gry ---
  function update(dt) {
    if (gameState !== 'PLAYING') return;

    elapsedTime = (performance.now() - startTime) / 1000;

    // 1. Dymek wypowiedzi profesora (odliczanie)
    if (quoteDisplayTime > 0) {
      quoteDisplayTime -= dt;
      if (quoteDisplayTime <= 0) {
        speechBubbleEl.classList.add('hidden-dialogue');
      }
    }
    quoteTimer += dt;
    if (quoteTimer > 9.0) {
      quoteTimer = 0;
      triggerProfessorQuote();
    }

    // 2. Obsługa staminy i sprintu gracza
    const isSprintKey = keys.sprint;
    const isMoving = keys.up || keys.down || keys.left || keys.right;

    let isSprinting = false;
    if (isSprintKey && isMoving && player.stamina > 0 && !player.isExhausted) {
      isSprinting = true;
      player.stamina -= player.staminaDrain * dt;
      if (player.stamina <= 0) {
        player.stamina = 0;
        player.isExhausted = true;
      }
    } else {
      player.stamina += player.staminaRegen * dt;
      if (player.stamina >= player.maxStamina) {
        player.stamina = player.maxStamina;
        player.isExhausted = false;
      } else if (player.stamina > 25) {
        player.isExhausted = false;
      }
    }

    // Aktualizacja HUD Staminy
    const staminaPercent = (player.stamina / player.maxStamina) * 100;
    staminaBarEl.style.width = `${staminaPercent}%`;
    if (player.isExhausted) {
      staminaBarEl.classList.add('exhausted');
      staminaStatusEl.textContent = 'WYCZERPANY!';
      staminaStatusEl.style.color = '#ef4444';
    } else {
      staminaBarEl.classList.remove('exhausted');
      staminaStatusEl.textContent = isSprinting ? 'SPRINTUJESZ!' : 'GOTOWY (SHIFT)';
      staminaStatusEl.style.color = isSprinting ? '#fbbf24' : '#10b981';
    }

    // 3. Obsługa buffów (Kawa / Legitymacja)
    let speedMultiplier = 1.0;
    if (player.speedBuffDuration > 0) {
      player.speedBuffDuration -= dt;
      speedMultiplier = 1.5;
    }
    if (player.shieldBuffDuration > 0) {
      player.shieldBuffDuration -= dt;
    }

    // Aktualizacja wskaźnika aktywnego buffa w HUD
    if (player.speedBuffDuration > 0) {
      buffIndicatorEl.classList.remove('hidden');
      buffIconEl.textContent = '☕';
      buffNameEl.textContent = 'Espresso ALK (+50% prędkości)';
      buffTimerEl.textContent = `${Math.ceil(player.speedBuffDuration)}s`;
    } else if (player.shieldBuffDuration > 0) {
      buffIndicatorEl.classList.remove('hidden');
      buffIconEl.textContent = '🪪';
      buffNameEl.textContent = 'Legitymacja ALK (Nietykalność)';
      buffTimerEl.textContent = `${Math.ceil(player.shieldBuffDuration)}s`;
    } else {
      buffIndicatorEl.classList.add('hidden');
    }

    // 4. Ruch gracza
    let moveX = 0;
    let moveY = 0;
    if (keys.up) moveY -= 1;
    if (keys.down) moveY += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      // Normalizacja wektora przekątnej
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    const currentSpeed = (isSprinting ? player.sprintSpeed : player.baseSpeed) * speedMultiplier;
    const targetX = player.x + moveX * currentSpeed;
    const targetY = player.y + moveY * currentSpeed;

    if (moveX !== 0 || moveY !== 0) {
      player.direction.x = moveX;
      player.direction.y = moveY;
    }

    // Sprawdzenie kolizji z krawędziami planszy
    let clampedX = Math.max(player.radius, Math.min(canvas.width - player.radius, targetX));
    let clampedY = Math.max(player.radius, Math.min(canvas.height - player.radius, targetY));

    // Sprawdzenie kolizji ze ścianami i meblami kampusu
    let canMoveX = true;
    let canMoveY = true;
    for (const obs of obstacles) {
      if (checkCircleRectCollision(clampedX, player.y, player.radius, obs.x, obs.y, obs.w, obs.h)) {
        canMoveX = false;
      }
      if (checkCircleRectCollision(player.x, clampedY, player.radius, obs.x, obs.y, obs.w, obs.h)) {
        canMoveY = false;
      }
    }

    if (canMoveX) player.x = clampedX;
    if (canMoveY) player.y = clampedY;

    // 5. Aktualizacja strefy kampusu w HUD
    for (const z of zones) {
      if (player.x >= z.x && player.x <= z.x + z.w && player.y >= z.y && player.y <= z.y + z.h) {
        campusStatusEl.textContent = z.name;
        break;
      }
    }

    // 6. Logika Profesora / Egzaminatora (Sztuczna inteligencja)
    const distToPlayer = Math.hypot(player.x - professor.x, player.y - professor.y);

    // Wykrywanie gracza (jeśli ma tarczę, profesor go gubi)
    if (player.shieldBuffDuration > 0) {
      professor.isChasing = false;
      professor.speed = professor.baseSpeed * 0.7; // zdezorientowany
    } else if (distToPlayer < 240) {
      professor.isChasing = true;
      professor.speed = professor.alertSpeed;

      // Sygnał dźwiękowy ostrzeżenia
      professor.alertCooldown -= dt;
      if (professor.alertCooldown <= 0) {
        professor.alertCooldown = 3.5;
        if (window.gameAudio) window.gameAudio.playProfessorAlert();
      }
    } else {
      professor.isChasing = false;
      professor.speed = professor.baseSpeed;
    }

    // Cel ruchu profesora
    let profTargetX = player.x;
    let profTargetY = player.y;

    if (!professor.isChasing) {
      // Losowy patrol po kampusie
      const distToPatrol = Math.hypot(professor.patrolTarget.x - professor.x, professor.patrolTarget.y - professor.y);
      if (distToPatrol < 30) {
        professor.patrolTarget = {
          x: 60 + Math.random() * (canvas.width - 120),
          y: 60 + Math.random() * (canvas.height - 120)
        };
      }
      profTargetX = professor.patrolTarget.x;
      profTargetY = professor.patrolTarget.y;
    }

    const pAngle = Math.atan2(profTargetY - professor.y, profTargetX - professor.x);
    let profNextX = professor.x + Math.cos(pAngle) * professor.speed;
    let profNextY = professor.y + Math.sin(pAngle) * professor.speed;

    // Omijanie przeszkód przez profesora (ślizganie)
    let profCanMoveX = true;
    let profCanMoveY = true;
    for (const obs of obstacles) {
      if (checkCircleRectCollision(profNextX, professor.y, professor.radius, obs.x, obs.y, obs.w, obs.h)) {
        profCanMoveX = false;
      }
      if (checkCircleRectCollision(professor.x, profNextY, professor.radius, obs.x, obs.y, obs.w, obs.h)) {
        profCanMoveY = false;
      }
    }

    if (profCanMoveX) professor.x = profNextX;
    if (profCanMoveY) professor.y = profNextY;

    // 7. Sprawdzenie złapania studenta przez Profesora
    if (distToPlayer < player.radius + professor.radius) {
      if (player.shieldBuffDuration <= 0) {
        gameOver();
        return;
      }
    }

    // 8. Zbieranie przedmiotów
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const dist = Math.hypot(player.x - item.x, player.y - item.y);

      if (dist < player.radius + item.radius) {
        if (item.type === 'ECTS') {
          ectsCollected++;
          ectsCounterEl.textContent = ectsCollected;
          const pct = Math.min(100, (ectsCollected / TARGET_ECTS) * 100);
          ectsProgressBarEl.style.width = `${pct}%`;

          if (window.gameAudio) window.gameAudio.playCollectECTS();

          if (ectsCollected >= TARGET_ECTS) {
            victory();
            return;
          }
          // Spawnowanie kolejnego ECTS aby zawsze było co zbierać
          spawnItem('ECTS');
        } else if (item.type === 'COFFEE') {
          coffeesDrunk++;
          player.speedBuffDuration = 6.0; // 6 sekund boostu
          player.stamina = player.maxStamina; // pełna stamina
          if (window.gameAudio) window.gameAudio.playCoffeeBoost();
          triggerProfessorQuote("„Kawa nie pomoże panu napisać kolokwium szybciej!”");
          setTimeout(() => spawnItem('COFFEE'), 12000);
        } else if (item.type === 'SHIELD') {
          player.shieldBuffDuration = 5.0; // 5 sekund nietykalności
          if (window.gameAudio) window.gameAudio.playIDCardShield();
          triggerProfessorQuote("„Legitymacja ważna, ale niech pan uważa na frekwencję!”");
          setTimeout(() => spawnItem('SHIELD'), 16000);
        }

        items.splice(i, 1);
      }
    }
  }

  // --- Renderowanie Świata Gry (Canvas 2D) ---
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Tło Kampusu - Strefy
    for (const z of zones) {
      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, z.y, z.w, z.h);

      // Subtelny grid korytarza
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      ctx.strokeRect(z.x, z.y, z.w, z.h);

      // Oznaczenie strefy
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(z.name.toUpperCase(), z.x + 12, z.y + 24);
    }

    // 2. Zielone Patio - Specjalny wzór trawnika & alejek
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.fillRect(260, 140, 280, 260);

    // Fontanna / Herb w centrum Patio
    ctx.beginPath();
    ctx.arc(400, 270, 26, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 43, 73, 0.6)";
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ALK", 400, 270);

    // 3. Rysowanie Przeszkód (Meble, Gabloty, Regały)
    for (const obs of obstacles) {
      // Cień
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.w, obs.h);

      // Główny blok
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Złota lub zielona krawędź
      ctx.strokeStyle = obs.label.includes("Patio") ? "#059669" : "rgba(212, 175, 55, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      // Etykieta przeszkody
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "9px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2);
    }

    // 4. Rysowanie Przedmiotów (Items)
    const timeNow = performance.now() * 0.003;
    for (const item of items) {
      const pulse = Math.sin(timeNow + item.pulseOffset) * 2;
      const r = item.radius + pulse;

      // Poświata
      ctx.beginPath();
      ctx.arc(item.x, item.y, r + 4, 0, Math.PI * 2);
      if (item.type === 'ECTS') {
        ctx.fillStyle = "rgba(212, 175, 55, 0.25)";
      } else if (item.type === 'COFFEE') {
        ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
      } else {
        ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
      }
      ctx.fill();

      // Ikona przedmiotu
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.floor(r * 1.5)}px sans-serif`;
      let icon = "📜";
      if (item.type === 'COFFEE') icon = "☕";
      if (item.type === 'SHIELD') icon = "🪪";
      ctx.fillText(icon, item.x, item.y);
    }

    // 5. Rysowanie Egzaminatora (Profesora)
    // Cień profesora
    ctx.beginPath();
    ctx.ellipse(professor.x, professor.y + 12, professor.radius, professor.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fill();

    // Promień czujności profesora (gdy ściga studenta)
    if (professor.isChasing) {
      ctx.beginPath();
      ctx.arc(professor.x, professor.y, 220, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Sylwetka Profesora
    ctx.beginPath();
    ctx.arc(professor.x, professor.y, professor.radius, 0, Math.PI * 2);
    ctx.fillStyle = professor.isChasing ? "#dc2626" : "#475569";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Portret / Ikona profesora
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👨‍🏫", professor.x, professor.y - 1);

    // Czerwona teczka z poprawkami w ręku
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(professor.x + 8, professor.y + 2, 8, 6);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(professor.x + 8, professor.y + 2, 8, 6);

    // Wykrzyknik nad głową gdy ściga
    if (professor.isChasing) {
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("!", professor.x, professor.y - 24);
    }

    // 6. Rysowanie Gracza (Studenta)
    // Cień studenta
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 10, player.radius, player.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // Tarcza legitymacji (jeśli aktywna)
    if (player.shieldBuffDuration > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.fill();
    }

    // Ciało studenta
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.speedBuffDuration > 0 ? "#f59e0b" : "#0284c7";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ikona studenta
    ctx.font = "15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧑‍🎓", player.x, player.y - 1);

    // Wskaźnik pauzy na ekranie
    if (gameState === 'PAUSED') {
      ctx.fillStyle = "rgba(3, 7, 18, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUZA", canvas.width / 2, canvas.height / 2 - 10);

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Wciśnij P lub ESC aby kontynuować", canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  // --- Główna Pętla Gry (Game Loop) ---
  function gameLoop(currentTimestamp) {
    const dt = Math.min((currentTimestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = currentTimestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // Uruchomienie pętli klatek
  requestAnimationFrame(gameLoop);
})();
