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

  // Wskaźnik bonusu
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

  // Przyciski dotykowe (#mobile-controls)
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnSprint = document.getElementById('btn-sprint');

  // --- Stan Rozgrywki ---
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
    { name: "Budynek D · Katedra Finansów", x: 0, y: 0, w: 260, h: 260, color: "#0d1b33" },
    { name: "Budynek A · Aula Główna", x: 540, y: 0, w: 260, h: 260, color: "#10213d" },
    { name: "Zielone Patio ALK", x: 260, y: 140, w: 280, h: 260, color: "#063022" },
    { name: "Budynek C · Biblioteka i Dziekanat", x: 0, y: 280, w: 260, h: 260, color: "#0f1d38" },
    { name: "Kawiarnia & Bistro Koźmiński", x: 540, y: 280, w: 260, h: 260, color: "#25180d" }
  ];

  // Ściany i Przeszkody w Kampusie (kolizje)
  const obstacles = [
    // Budynek D: meble katedry
    { x: 50, y: 50, w: 50, h: 35, label: "Katedra ALK" },
    { x: 150, y: 120, w: 40, h: 60, label: "Sala D-101" },
    // Budynek A: aula
    { x: 610, y: 60, w: 70, h: 35, label: "Rektorat" },
    { x: 690, y: 140, w: 45, h: 50, label: "Gabloty ALK" },
    // Zielone Patio: donice z roślinnością
    { x: 310, y: 190, w: 45, h: 35, label: "Patio ALK" },
    { x: 445, y: 190, w: 45, h: 35, label: "Patio ALK" },
    { x: 375, y: 310, w: 50, h: 35, label: "Ławka Patio" },
    // Budynek C: regały
    { x: 60, y: 350, w: 60, h: 45, label: "Biblioteka" },
    { x: 160, y: 420, w: 45, h: 50, label: "Dziekanat" },
    // Bistro ALK: kawiarnia
    { x: 600, y: 360, w: 50, h: 45, label: "Lada Bistro" },
    { x: 700, y: 410, w: 45, h: 45, label: "Stoliki Bistro" }
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
    staminaDrain: 28,
    staminaRegen: 20,
    isExhausted: false,
    speedBuffDuration: 0,
    shieldBuffDuration: 0,
    direction: { x: 0, y: 1 }
  };

  // Egzaminator (Profesor)
  // Bezpieczna pozycja startowa z dala od wszelkich przeszkód
  const professor = {
    x: 670,
    y: 90,
    radius: 15,
    speed: 2.3,
    baseSpeed: 2.3,
    alertSpeed: 3.6,
    isChasing: false,
    direction: { x: -1, y: 0 },
    patrolTarget: { x: 120, y: 220 },
    patrolTimer: 0,
    freezeDuration: 0, // Cyber-freeze
    stepCycle: 0
  };

  // Przedmioty do zebrania
  let items = [];

  function spawnItems() {
    items = [];
    for (let i = 0; i < 14; i++) {
      spawnItem('ECTS');
    }
    for (let i = 0; i < 3; i++) {
      spawnItem('COFFEE');
    }
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
      x = 35 + Math.random() * (canvas.width - 70);
      y = 35 + Math.random() * (canvas.height - 70);

      const collidesObstacle = obstacles.some(obs =>
        x > obs.x - 18 && x < obs.x + obs.w + 18 &&
        y > obs.y - 18 && y < obs.y + obs.h + 18
      );

      const tooClose = items.some(item => {
        const dx = item.x - x;
        const dy = item.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 32;
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
    quoteDisplayTime = 4.2;

    // Po trudnym pytaniu profesor na moment zamiera (cyber-freeze)
    if (Math.random() < 0.45 && gameState === 'PLAYING') {
      professor.freezeDuration = 1.8;
      if (window.SoundSystem) window.SoundSystem.play('freeze');
    }
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

    // Reset profesora na otwartej przestrzeni
    professor.x = 670;
    professor.y = 90;
    professor.speed = professor.baseSpeed;
    professor.isChasing = false;
    professor.freezeDuration = 0;
    professor.patrolTarget = { x: 120, y: 220 };

    // Zapewnienie, że profesor nie koliduje z żadną przeszkodą
    freePositionIfNeeded(professor);

    // Spawnowanie przedmiotów
    spawnItems();

    // Ukrycie modali
    showModal(null);
    triggerProfessorQuote("„Rozpoczynamy kolokwium z Zasad Ekonomii! Nikomu nie pozwolę uciec!”");

    if (window.SoundSystem) {
      window.SoundSystem.init();
    }
  }

  function gameOver() {
    gameState = 'GAMEOVER';
    failEctsEl.textContent = ectsCollected;
    failTimeEl.textContent = formatTime(elapsedTime);
    failCoffeesEl.textContent = coffeesDrunk;
    showModal(gameOverModal);

    if (window.SoundSystem) {
      window.SoundSystem.play('hit');
    }
  }

  function victory() {
    gameState = 'VICTORY';
    victoryEctsEl.textContent = TARGET_ECTS;
    victoryTimeEl.textContent = formatTime(elapsedTime);
    showModal(victoryModal);

    if (window.SoundSystem) {
      window.SoundSystem.play('win');
    }
  }

  // --- Obsługa Sterowania Klawiaturą ---
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') keys.sprint = true;

    if (e.code === 'KeyM') toggleAudio();
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') keys.sprint = false;
  });

  // --- Obsługa Przycisków Dotykowych (#mobile-controls) ---
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

  // Przełącznik Dźwięku
  function toggleAudio() {
    if (window.SoundSystem) {
      const isMuted = window.SoundSystem.toggleMute();
      audioIconEl.textContent = isMuted ? '🔇' : '🔊';
      audioToggleBtn.title = isMuted ? "Włącz dźwięk (M)" : "Wycisz dźwięk (M)";
    }
  }
  audioToggleBtn.addEventListener('click', toggleAudio);

  // Przełącznik Pauzy
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
    return (distX * distX + distY * distY) < (cr * cr);
  }

  function isPositionBlocked(x, y, radius) {
    // Krawędzie canvasu
    if (x - radius < 10 || x + radius > canvas.width - 10 ||
        y - radius < 10 || y + radius > canvas.height - 10) {
      return true;
    }
    // Przeszkody
    for (const obs of obstacles) {
      if (checkCircleRectCollision(x, y, radius, obs.x, obs.y, obs.w, obs.h)) {
        return true;
      }
    }
    return false;
  }

  function freePositionIfNeeded(entity) {
    if (!isPositionBlocked(entity.x, entity.y, entity.radius)) return;
    // Jeśli z jakiegoś powodu byt utknął w przeszkodzie, wypchnij go
    for (let r = 5; r <= 80; r += 5) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const nx = entity.x + Math.cos(angle) * r;
        const ny = entity.y + Math.sin(angle) * r;
        if (!isPositionBlocked(nx, ny, entity.radius)) {
          entity.x = nx;
          entity.y = ny;
          return;
        }
      }
    }
  }

  // --- Aktualizacja Fizyki & Logiki Gry ---
  function update(dt) {
    if (gameState !== 'PLAYING') return;

    elapsedTime = (performance.now() - startTime) / 1000;

    // 1. Dymek z wypowiedziami profesora
    if (quoteDisplayTime > 0) {
      quoteDisplayTime -= dt;
      if (quoteDisplayTime <= 0) {
        speechBubbleEl.classList.add('hidden-dialogue');
      }
    }
    quoteTimer += dt;
    if (quoteTimer > 8.5) {
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

    // Pasek staminy w HUD
    const staminaPercent = (player.stamina / player.maxStamina) * 100;
    staminaBarEl.style.width = `${staminaPercent}%`;
    if (player.isExhausted) {
      staminaBarEl.classList.add('exhausted');
      staminaStatusEl.textContent = 'WYCZERPANY!';
      staminaStatusEl.style.color = '#ef4444';
    } else {
      staminaBarEl.classList.remove('exhausted');
      staminaStatusEl.textContent = isSprinting ? 'SPRINTUJESZ!' : 'GOTOWY (SHIFT)';
      staminaStatusEl.style.color = isSprinting ? '#ffc740' : '#10b981';
    }

    // 3. Obsługa buffów gracza
    let speedMultiplier = 1.0;
    if (player.speedBuffDuration > 0) {
      player.speedBuffDuration -= dt;
      speedMultiplier = 1.55;
    }
    if (player.shieldBuffDuration > 0) {
      player.shieldBuffDuration -= dt;
    }

    // Aktualizacja wskaźnika aktywnego buffa w HUD
    if (player.speedBuffDuration > 0) {
      buffIndicatorEl.classList.remove('hidden');
      buffIconEl.textContent = '☕';
      buffNameEl.textContent = 'Espresso ALK (+55% prędkości)';
      buffTimerEl.textContent = `${Math.ceil(player.speedBuffDuration)}s`;
    } else if (player.shieldBuffDuration > 0) {
      buffIndicatorEl.classList.remove('hidden');
      buffIconEl.textContent = '🪪';
      buffNameEl.textContent = 'Legitymacja ALK (Nietykalność)';
      buffTimerEl.textContent = `${Math.ceil(player.shieldBuffDuration)}s`;
    } else {
      buffIndicatorEl.classList.add('hidden');
    }

    // 4. Ruch Gracza (Studenta)
    let moveX = 0;
    let moveY = 0;
    if (keys.up) moveY -= 1;
    if (keys.down) moveY += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
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

    // Odrębne testowanie osi X i Y dla płynnego ślizgania się po ścianach
    if (!isPositionBlocked(targetX, player.y, player.radius)) {
      player.x = targetX;
    }
    if (!isPositionBlocked(player.x, targetY, player.radius)) {
      player.y = targetY;
    }

    // 5. Aktualizacja strefy kampusu w HUD
    for (const z of zones) {
      if (player.x >= z.x && player.x <= z.x + z.w && player.y >= z.y && player.y <= z.y + z.h) {
        campusStatusEl.textContent = z.name;
        break;
      }
    }

    // 6. RUCH I SZTUCZNA INTELIGENCJA PROFESORA (EGZAMINATORA)
    // Sprawdzenie stanu zamrożenia (cyber-freeze)
    if (professor.freezeDuration > 0) {
      professor.freezeDuration -= dt;
      // Podczas zamrożenia profesor nie porusza się
    } else {
      const distToPlayer = Math.hypot(player.x - professor.x, player.y - professor.y);

      // Wykrycie gracza: goni, chyba że gracz ma aktywną tarczę legitymacji
      if (player.shieldBuffDuration > 0) {
        professor.isChasing = false;
        professor.speed = professor.baseSpeed * 0.75;
      } else if (distToPlayer < 260) {
        professor.isChasing = true;
        professor.speed = professor.alertSpeed;
      } else {
        professor.isChasing = false;
        professor.speed = professor.baseSpeed;
      }

      // Wybór celu ruchu profesora
      let targetX = player.x;
      let targetY = player.y;

      if (!professor.isChasing) {
        // Płynny patrol po kampusie
        professor.patrolTimer += dt;
        const distToPatrol = Math.hypot(professor.patrolTarget.x - professor.x, professor.patrolTarget.y - professor.y);

        if (distToPatrol < 40 || professor.patrolTimer > 7.0) {
          professor.patrolTimer = 0;
          // Wybierz nowy, gwarantowanie wolny punkt w kampusie
          const patrolSpots = [
            { x: 120, y: 100 },
            { x: 670, y: 100 },
            { x: 400, y: 160 },
            { x: 400, y: 380 },
            { x: 130, y: 460 },
            { x: 670, y: 460 }
          ];
          const nextSpot = patrolSpots[Math.floor(Math.random() * patrolSpots.length)];
          professor.patrolTarget = nextSpot;
        }

        targetX = professor.patrolTarget.x;
        targetY = professor.patrolTarget.y;
      }

      // Algorytm omijania przeszkód dla Profesora (Raycast Steering)
      const baseAngle = Math.atan2(targetY - professor.y, targetX - professor.x);
      const angleOffsets = [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, Math.PI / 2, -Math.PI / 2];
      let moved = false;

      for (const offset of angleOffsets) {
        const testAngle = baseAngle + offset;
        const stepDist = professor.speed;
        const nextX = professor.x + Math.cos(testAngle) * stepDist;
        const nextY = professor.y + Math.sin(testAngle) * stepDist;

        if (!isPositionBlocked(nextX, nextY, professor.radius)) {
          professor.x = nextX;
          professor.y = nextY;
          professor.direction.x = Math.cos(testAngle);
          professor.direction.y = Math.sin(testAngle);
          moved = true;
          break;
        }
      }

      // Jeśli profesor został zablokowany, awaryjnie spróbuj wolnej pozycji
      if (!moved) {
        freePositionIfNeeded(professor);
      }

      professor.stepCycle += dt * 8;
    }

    // 7. Sprawdzenie złapania studenta przez Profesora
    const currentDist = Math.hypot(player.x - professor.x, player.y - professor.y);
    if (currentDist < player.radius + professor.radius) {
      if (player.shieldBuffDuration <= 0 && professor.freezeDuration <= 0) {
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

          // Odtwórz 8-bitowy dwuton monety
          if (window.SoundSystem) window.SoundSystem.play('ects');

          if (ectsCollected >= TARGET_ECTS) {
            victory();
            return;
          }
          // Spawnowanie kolejnego punktu ECTS
          spawnItem('ECTS');
        } else if (item.type === 'COFFEE') {
          coffeesDrunk++;
          player.speedBuffDuration = 6.0;
          player.stamina = player.maxStamina;

          // Odtwórz dźwięk przyspieszenia
          if (window.SoundSystem) window.SoundSystem.play('coffee');
          triggerProfessorQuote("„Kawa nie pomoże panu napisać kolokwium szybciej!”");
          setTimeout(() => spawnItem('COFFEE'), 11000);
        } else if (item.type === 'SHIELD') {
          player.shieldBuffDuration = 5.0;

          // Odtwórz akord sinusoidalny tarczy
          if (window.SoundSystem) window.SoundSystem.play('shield');
          triggerProfessorQuote("„Legitymacja ważna, ale niech pan uważa na frekwencję!”");
          setTimeout(() => spawnItem('SHIELD'), 15000);
        }

        items.splice(i, 1);
      }
    }
  }

  // --- Renderowanie Świata Gry (Canvas 2D) ---
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Tło Kampusu - Poszczególne Budynki i Strefy
    for (const z of zones) {
      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, z.y, z.w, z.h);

      // Kafelkowany wzór posadzki uczelnianej
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.strokeRect(z.x, z.y, z.w, z.h);

      // Etykieta strefy
      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(z.name.toUpperCase(), z.x + 14, z.y + 24);
    }

    // 2. Zielone Patio ALK - Trawa i Centralna Strefa
    ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
    ctx.fillRect(260, 140, 280, 260);

    // Herb / Fontanna w centrum Patio
    ctx.beginPath();
    ctx.arc(400, 270, 28, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 34, 68, 0.75)";
    ctx.fill();
    ctx.strokeStyle = "#f2a900";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#ffc740";
    ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ALK", 400, 270);

    // 3. Przeszkody Kampusu (Biurka, Stoły, Donice Patio)
    for (const obs of obstacles) {
      // Cień retro pod przeszkodą
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.w, obs.h);

      // Korpus przeszkody
      ctx.fillStyle = "#001a33";
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Ramka mebla
      ctx.strokeStyle = obs.label.includes("Patio") ? "#10b981" : "rgba(242, 169, 0, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      // Opis mebla
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "9px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2);
    }

    // 4. Przedmioty do zebrania (ECTS, Kawa, Legitymacja)
    const timeNow = performance.now() * 0.0035;
    for (const item of items) {
      const pulse = Math.sin(timeNow + item.pulseOffset) * 2.2;
      const r = item.radius + pulse;

      // Złocista lub kolorowa poświata wokół przedmiotu
      ctx.beginPath();
      ctx.arc(item.x, item.y, r + 5, 0, Math.PI * 2);
      if (item.type === 'ECTS') {
        ctx.fillStyle = "rgba(242, 169, 0, 0.3)";
      } else if (item.type === 'COFFEE') {
        ctx.fillStyle = "rgba(245, 158, 11, 0.35)";
      } else {
        ctx.fillStyle = "rgba(0, 75, 135, 0.4)";
      }
      ctx.fill();

      // Ikona przedmiotu
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.floor(r * 1.55)}px sans-serif`;
      let icon = "📜";
      if (item.type === 'COFFEE') icon = "☕";
      if (item.type === 'SHIELD') icon = "🪪";
      ctx.fillText(icon, item.x, item.y);
    }

    // 5. Rysowanie Profesora (Egzaminatora) - Płynny ruch
    // Cień profesora
    ctx.beginPath();
    ctx.ellipse(professor.x, professor.y + 12, professor.radius, professor.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill();

    // Pole czujności profesora w trybie pościgu
    if (professor.isChasing) {
      ctx.beginPath();
      ctx.arc(professor.x, professor.y, 230, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(220, 38, 38, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Efekt zamrożenia (cyber-freeze)
    if (professor.freezeDuration > 0) {
      ctx.beginPath();
      ctx.arc(professor.x, professor.y, professor.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
      ctx.fill();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("❄️ FREEZE", professor.x, professor.y - 25);
    }

    // Ciało profesora
    ctx.beginPath();
    ctx.arc(professor.x, professor.y, professor.radius, 0, Math.PI * 2);
    ctx.fillStyle = professor.isChasing ? "#dc2626" : "#002244";
    ctx.fill();
    ctx.strokeStyle = "#f2a900";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Awatar profesora
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👨‍🏫", professor.x, professor.y - 1);

    // Czerwona teczka z poprawkami
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(professor.x + 8, professor.y + 3, 9, 6);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(professor.x + 8, professor.y + 3, 9, 6);

    // Wykrzyknik czujności nad głową
    if (professor.isChasing && professor.freezeDuration <= 0) {
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("!", professor.x, professor.y - 24);
    }

    // 6. Rysowanie Gracza (Studenta)
    // Cień studenta
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 11, player.radius, player.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fill();

    // Tarcza legitymacji studenckiej
    if (player.shieldBuffDuration > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
      ctx.fill();
    }

    // Sylwetka studenta
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.speedBuffDuration > 0 ? "#f2a900" : "#004b87";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Awatar studenta
    ctx.font = "15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧑‍🎓", player.x, player.y - 1);

    // Ekran pauzy
    if (gameState === 'PAUSED') {
      ctx.fillStyle = "rgba(10, 17, 40, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffc740";
      ctx.font = "bold 26px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUZA", canvas.width / 2, canvas.height / 2 - 12);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Wciśnij P lub ESC aby kontynuować", canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  // --- Główna Pętla Gry ---
  function gameLoop(currentTimestamp) {
    const dt = Math.min((currentTimestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = currentTimestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
  }

  // Uruchomienie pętli gry
  requestAnimationFrame(gameLoop);
})();
