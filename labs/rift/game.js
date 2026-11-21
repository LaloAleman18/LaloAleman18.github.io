/* Rift — juego arcade en canvas. Sin assets ni dependencias. */
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var stage = document.getElementById('stage');

  var ui = {
    score: document.getElementById('score'),
    wave: document.getElementById('wave'),
    hearts: document.getElementById('hearts'),
    intro: document.getElementById('intro'),
    over: document.getElementById('over'),
    pauseScreen: document.getElementById('pause-screen'),
    finalScore: document.getElementById('final-score'),
    finalWave: document.getElementById('final-wave'),
    finalBest: document.getElementById('final-best'),
    bestIntro: document.getElementById('best-intro'),
    start: document.getElementById('start'),
    restart: document.getElementById('restart'),
    resume: document.getElementById('resume'),
    mute: document.getElementById('mute'),
    pause: document.getElementById('pause'),
    dash: document.getElementById('dash')
  };

  var COLORS = {
    bg: '#07060d',
    ink: '#e9e6f2',
    dim: '#8f8aa3',
    mint: '#5ef2c7',
    pink: '#ff3d81',
    amber: '#ffcf6e'
  };

  var view = { w: 0, h: 0, dpr: 1 };
  var bgGradient = null;
  var stars = [];
  var TAU = Math.PI * 2;

  var game = {
    mode: 'idle',
    time: 0,
    score: 0,
    best: readBest(),
    wave: 1,
    waveTimer: 0,
    spawnTimer: 0,
    fireTimer: 0,
    rapid: 0,
    shield: 0,
    combo: 0,
    comboTimer: 0,
    shake: 0,
    flash: 0,
    flashText: '',
    player: null,
    enemies: [],
    bullets: [],
    ebullets: [],
    particles: [],
    pickups: [],
    keys: {},
    pointer: { active: false, x: 0, y: 0 }
  };

  function readBest() {
    try {
      return parseInt(localStorage.getItem('rift.best') || '0', 10) || 0;
    } catch (error) { return 0; }
  }
  function saveBest(value) {
    try { localStorage.setItem('rift.best', String(value)); } catch (error) { /* modo privado */ }
  }
  function pad(value, size) {
    return String(Math.max(0, Math.floor(value))).padStart(size, '0');
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  /* Audio ----------------------------------------------------------------- */
  var audio = null;
  var noiseBuffer = null;
  var muted = false;
  try { muted = localStorage.getItem('rift.muted') === '1'; } catch (error) { muted = false; }

  function audioInit() {
    if (!audio) {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audio = new AudioCtor();
      noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.4), audio.sampleRate);
      var data = noiseBuffer.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
      }
    }
    if (audio.state === 'suspended') audio.resume();
  }

  function beep(freq, duration, type, volume, slide) {
    if (muted || !audio) return;
    var now = audio.currentTime;
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume || 0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function noiseHit(volume, duration) {
    if (muted || !audio || !noiseBuffer) return;
    var now = audio.currentTime;
    var source = audio.createBufferSource();
    var gain = audio.createGain();
    var filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + duration);
    source.buffer = noiseBuffer;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(now);
    source.stop(now + duration);
  }

  function updateMuteButton() {
    if (!ui.mute) return;
    ui.mute.classList.toggle('is-muted', muted);
    ui.mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    ui.mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
  }
  updateMuteButton();

  if (ui.mute) {
    ui.mute.addEventListener('click', function () {
      muted = !muted;
      try { localStorage.setItem('rift.muted', muted ? '1' : '0'); } catch (error) { /* modo privado */ }
      updateMuteButton();
      if (!muted) { audioInit(); beep(660, 0.08, 'sine', 0.03, 120); }
    });
  }

  /* Medidas y fondo ------------------------------------------------------- */
  function makeStars() {
    stars = [];
    var count = Math.round((view.w * view.h) / 14000);
    count = clamp(count, 40, 130);
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * view.w,
        y: Math.random() * view.h,
        z: Math.random(),
        speed: 6 + Math.random() * 26
      });
    }
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.w * view.dpr);
    canvas.height = Math.round(view.h * view.dpr);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

    bgGradient = ctx.createRadialGradient(
      view.w * 0.5, view.h * 0.44, 0,
      view.w * 0.5, view.h * 0.44, Math.max(view.w, view.h) * 0.72
    );
    bgGradient.addColorStop(0, 'rgba(94, 242, 199, 0.055)');
    bgGradient.addColorStop(0.45, 'rgba(255, 61, 129, 0.022)');
    bgGradient.addColorStop(1, 'rgba(7, 6, 13, 0)');

    makeStars();
    if (game.player && game.mode === 'idle') {
      game.player.x = view.w / 2;
      game.player.y = view.h / 2;
    }
  }

  /* Estado ---------------------------------------------------------------- */
  function makePlayer() {
    return {
      x: view.w / 2,
      y: view.h / 2,
      vx: 0,
      vy: 0,
      r: 11,
      hp: 3,
      angle: -Math.PI / 2,
      invuln: 0,
      dash: 0,
      dashCd: 0,
      trail: 0
    };
  }

  function reset() {
    game.score = 0;
    game.wave = 1;
    game.waveTimer = 0;
    game.spawnTimer = 0.7;
    game.fireTimer = 0;
    game.rapid = 0;
    game.shield = 0;
    game.combo = 0;
    game.comboTimer = 0;
    game.shake = 0;
    game.flash = 1.6;
    game.flashText = 'OLEADA 01';
    game.enemies = [];
    game.bullets = [];
    game.ebullets = [];
    game.particles = [];
    game.pickups = [];
    game.player = makePlayer();
    game.pointer.active = false;
    game.keys = {};
    updateHUD();
  }

  function start() {
    audioInit();
    reset();
    game.mode = 'playing';
    ui.intro.classList.add('is-hidden');
    ui.over.hidden = true;
    ui.pauseScreen.hidden = true;
    if (ui.pause) ui.pause.setAttribute('aria-label', 'Pausar');
    updateHUD();
  }

  function end() {
    game.mode = 'over';
    if (game.score > game.best) {
      game.best = game.score;
      saveBest(game.best);
    }
    explode(game.player.x, game.player.y, COLORS.mint, 34, 260);
    game.shake = 16;
    beep(140, 0.5, 'sawtooth', 0.05, -100);
    noiseHit(0.06, 0.5);

    if (ui.finalScore) ui.finalScore.textContent = pad(game.score, 6);
    if (ui.finalWave) ui.finalWave.textContent = pad(game.wave, 2);
    if (ui.finalBest) ui.finalBest.textContent = pad(game.best, 6);
    if (ui.bestIntro) ui.bestIntro.textContent = pad(game.best, 6);
    ui.over.hidden = false;
    ui.pauseScreen.hidden = true;
  }

  function togglePause() {
    if (game.mode === 'playing') {
      game.mode = 'paused';
      ui.pauseScreen.hidden = false;
      if (ui.pause) ui.pause.setAttribute('aria-label', 'Reanudar');
    } else if (game.mode === 'paused') {
      game.mode = 'playing';
      ui.pauseScreen.hidden = true;
      if (ui.pause) ui.pause.setAttribute('aria-label', 'Pausar');
    }
  }

  function updateHUD() {
    if (ui.score) ui.score.textContent = pad(game.score, 6);
    if (ui.wave) ui.wave.textContent = pad(game.wave, 2);
    if (ui.hearts) {
      var hearts = ui.hearts.children;
      var hp = game.player ? game.player.hp : 3;
      for (var i = 0; i < hearts.length; i++) {
        hearts[i].classList.toggle('is-off', i >= hp);
      }
      ui.hearts.setAttribute('aria-label', hp + (hp === 1 ? ' vida' : ' vidas'));
    }
  }

  /* Entidades ------------------------------------------------------------- */
  function spawnEnemy() {
    var cap = 22 + game.wave * 2;
    if (game.enemies.length >= cap) return;

    var roll = Math.random();
    var type = 'chaser';
    if (game.wave >= 2 && roll > 0.72) type = 'shooter';
    if (game.wave >= 4 && roll > 0.9) type = 'tank';

    var edge = Math.floor(Math.random() * 4);
    var x, y;
    if (edge === 0) { x = Math.random() * view.w; y = -40; }
    else if (edge === 1) { x = view.w + 40; y = Math.random() * view.h; }
    else if (edge === 2) { x = Math.random() * view.w; y = view.h + 40; }
    else { x = -40; y = Math.random() * view.h; }

    var hp = type === 'tank' ? 7 + game.wave : type === 'shooter' ? 2 : 1 + Math.floor(game.wave / 4);
    var radius = type === 'tank' ? 21 : type === 'shooter' ? 13 : 11;
    var speed = type === 'tank' ? 34 + game.wave * 1.6 : type === 'shooter' ? 58 + game.wave * 2 : 72 + game.wave * 3.4;

    game.enemies.push({
      type: type,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      r: radius,
      hp: hp,
      maxHp: hp,
      speed: Math.min(speed, 190),
      angle: Math.random() * TAU,
      spin: (Math.random() - 0.5) * 1.6,
      fire: 1.2 + Math.random() * 1.4,
      hit: 0,
      strafe: Math.random() > 0.5 ? 1 : -1
    });
  }

  function shoot() {
    var target = nearestEnemy();
    if (!target) return;
    var angle = Math.atan2(target.y - game.player.y, target.x - game.player.x) + (Math.random() - 0.5) * 0.05;
    game.player.angle = angle;
    var speed = 680;
    game.bullets.push({
      x: game.player.x + Math.cos(angle) * 17,
      y: game.player.y + Math.sin(angle) * 17,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 3,
      life: 1.05
    });
    game.particles.push({
      x: game.player.x + Math.cos(angle) * 17,
      y: game.player.y + Math.sin(angle) * 17,
      vx: Math.cos(angle) * 120 + (Math.random() - 0.5) * 60,
      vy: Math.sin(angle) * 120 + (Math.random() - 0.5) * 60,
      life: 0.16,
      max: 0.16,
      size: 2,
      color: COLORS.mint
    });
    beep(760 + Math.random() * 80, 0.045, 'square', 0.012, -260);
  }

  function nearestEnemy() {
    var best = null;
    var bestDistance = Infinity;
    for (var i = 0; i < game.enemies.length; i++) {
      var enemy = game.enemies[i];
      var d = distance(game.player.x, game.player.y, enemy.x, enemy.y);
      if (d < bestDistance) { bestDistance = d; best = enemy; }
    }
    return bestDistance < 820 ? best : null;
  }

  function dash() {
    if (game.mode !== 'playing' || !game.player) return;
    var player = game.player;
    if (player.dashCd > 0) return;

    var angle = player.angle;
    if (game.pointer.active) {
      angle = Math.atan2(game.pointer.y - player.y, game.pointer.x - player.x);
    } else {
      var moving = Math.hypot(player.vx, player.vy);
      if (moving > 20) angle = Math.atan2(player.vy, player.vx);
    }

    player.dash = 0.18;
    player.dashCd = 1.05;
    player.invuln = Math.max(player.invuln, 0.42);
    player.vx += Math.cos(angle) * 620;
    player.vy += Math.sin(angle) * 620;
    game.shake = 5;
    explode(player.x, player.y, COLORS.mint, 12, 150);
    beep(180, 0.16, 'sawtooth', 0.04, 420);
  }

  function explode(x, y, color, count, speed) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * TAU;
      var velocity = speed * (0.25 + Math.random() * 0.85);
      var life = 0.35 + Math.random() * 0.5;
      game.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: life,
        max: life,
        size: 1 + Math.random() * 2.4,
        color: color
      });
    }
  }

  function damagePlayer() {
    var player = game.player;
    if (!player || player.invuln > 0) return;

    if (game.shield > 0) {
      game.shield = 0;
      player.invuln = 0.9;
      game.shake = 8;
      explode(player.x, player.y, COLORS.mint, 18, 220);
      beep(420, 0.2, 'triangle', 0.05, -180);
      return;
    }

    player.hp -= 1;
    player.invuln = 1.5;
    game.shake = 12;
    game.combo = 0;
    game.comboTimer = 0;
    explode(player.x, player.y, COLORS.pink, 20, 240);
    beep(120, 0.28, 'sawtooth', 0.06, -60);
    updateHUD();

    if (player.hp <= 0) end();
  }

  function killEnemy(enemy) {
    enemy.dead = true;
    var base = enemy.type === 'tank' ? 40 : enemy.type === 'shooter' ? 20 : 10;
    game.combo = Math.min(20, game.combo + 1);
    game.comboTimer = 3;
    game.score += Math.round(base * (1 + Math.min(10, game.combo) * 0.1));
    game.shake = Math.max(game.shake, enemy.type === 'tank' ? 7 : 2.5);
    explode(enemy.x, enemy.y, enemy.type === 'shooter' ? COLORS.amber : COLORS.pink, enemy.type === 'tank' ? 26 : 14, 210);
    noiseHit(enemy.type === 'tank' ? 0.05 : 0.025, 0.22);
    beep(90, 0.18, 'sine', 0.03, -40);

    if (Math.random() < 0.12) {
      var types = ['heal', 'rapid', 'shield'];
      game.pickups.push({
        x: enemy.x,
        y: enemy.y,
        type: types[Math.floor(Math.random() * types.length)],
        r: 11,
        angle: 0,
        life: 13,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40
      });
    }
    updateHUD();
  }

  /* Actualización --------------------------------------------------------- */
  function update(dt) {
    game.time += dt;

    for (var s = 0; s < stars.length; s++) {
      var star = stars[s];
      star.y += (star.speed * (game.mode === 'playing' ? 1 : 0.35)) * dt;
      if (star.y > view.h + 2) { star.y = -2; star.x = Math.random() * view.w; }
    }

    game.shake *= Math.pow(0.02, dt);
    if (game.mode !== 'playing') return;

    var player = game.player;
    game.waveTimer += dt;
    game.fireTimer -= dt;
    game.rapid = Math.max(0, game.rapid - dt);
    game.shield = Math.max(0, game.shield - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.dashCd = Math.max(0, player.dashCd - dt);
    game.flash = Math.max(0, game.flash - dt);
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;

    /* Movimiento */
    var ax = 0;
    var ay = 0;
    if (game.keys.ArrowLeft || game.keys.KeyA) ax -= 1;
    if (game.keys.ArrowRight || game.keys.KeyD) ax += 1;
    if (game.keys.ArrowUp || game.keys.KeyW) ay -= 1;
    if (game.keys.ArrowDown || game.keys.KeyS) ay += 1;

    var targetVx = 0;
    var targetVy = 0;
    if (game.pointer.active) {
      targetVx = clamp((game.pointer.x - player.x) * 9, -420, 420);
      targetVy = clamp((game.pointer.y - player.y) * 9, -420, 420);
    } else if (ax || ay) {
      var length = Math.hypot(ax, ay) || 1;
      targetVx = (ax / length) * 340;
      targetVy = (ay / length) * 340;
    }

    var ease = player.dash > 0 ? 3 : Math.min(1, dt * 14);
    player.vx += (targetVx - player.vx) * ease;
    player.vy += (targetVy - player.vy) * ease;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = clamp(player.x, 16, view.w - 16);
    player.y = clamp(player.y, 16, view.h - 16);
    if (player.dash > 0) player.dash -= dt;

    var target = nearestEnemy();
    if (target) {
      player.angle = Math.atan2(target.y - player.y, target.x - player.x);
    } else if (Math.hypot(player.vx, player.vy) > 40) {
      player.angle = Math.atan2(player.vy, player.vx);
    }

    if (target && game.fireTimer <= 0) {
      shoot();
      game.fireTimer = game.rapid > 0 ? 0.1 : 0.2;
    }

    /* Oleadas */
    if (game.waveTimer > 16) {
      game.waveTimer = 0;
      game.wave += 1;
      game.flash = 2;
      game.flashText = 'OLEADA ' + pad(game.wave, 2);
      beep(300, 0.3, 'triangle', 0.04, 300);
      updateHUD();
    }

    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnEnemy();
      game.spawnTimer = Math.max(0.32, 1.35 - game.wave * 0.07) * (0.7 + Math.random() * 0.7);
    }

    /* Enemigos */
    for (var i = game.enemies.length - 1; i >= 0; i--) {
      var enemy = game.enemies[i];
      enemy.hit = Math.max(0, enemy.hit - dt);
      enemy.angle += enemy.spin * dt;

      var dx = player.x - enemy.x;
      var dy = player.y - enemy.y;
      var dist = Math.hypot(dx, dy) || 1;
      var tvx, tvy;

      if (enemy.type === 'shooter') {
        var radial = dist < 220 ? -1 : dist > 310 ? 1 : 0;
        tvx = (dx / dist) * enemy.speed * radial + (-dy / dist) * enemy.speed * 0.45 * enemy.strafe;
        tvy = (dy / dist) * enemy.speed * radial + (dx / dist) * enemy.speed * 0.45 * enemy.strafe;
        enemy.fire -= dt;
        if (enemy.fire <= 0 && dist < 560) {
          enemy.fire = 1.6 + Math.random() * 1.1;
          var aim = Math.atan2(dy, dx);
          game.ebullets.push({
            x: enemy.x + Math.cos(aim) * 14,
            y: enemy.y + Math.sin(aim) * 14,
            vx: Math.cos(aim) * (170 + game.wave * 5),
            vy: Math.sin(aim) * (170 + game.wave * 5),
            r: 4,
            life: 4
          });
          beep(300, 0.1, 'sawtooth', 0.018, -100);
        }
      } else if (enemy.type === 'tank') {
        tvx = (dx / dist) * enemy.speed;
        tvy = (dy / dist) * enemy.speed;
        enemy.fire -= dt;
        if (enemy.fire <= 0 && dist < 600) {
          enemy.fire = 2.4 + Math.random();
          var base = Math.atan2(dy, dx);
          for (var k = -1; k <= 1; k++) {
            game.ebullets.push({
              x: enemy.x + Math.cos(base) * 20,
              y: enemy.y + Math.sin(base) * 20,
              vx: Math.cos(base + k * 0.22) * 150,
              vy: Math.sin(base + k * 0.22) * 150,
              r: 5,
              life: 4.5
            });
          }
          beep(180, 0.14, 'square', 0.022, -60);
        }
      } else {
        tvx = (dx / dist) * enemy.speed;
        tvy = (dy / dist) * enemy.speed;
      }

      enemy.vx += (tvx - enemy.vx) * Math.min(1, dt * 2.4);
      enemy.vy += (tvy - enemy.vy) * Math.min(1, dt * 2.4);
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      /* Contacto con el jugador */
      if (distance(enemy.x, enemy.y, player.x, player.y) < enemy.r + player.r) {
        damagePlayer();
        if (enemy.type !== 'tank') killEnemy(enemy);
        else {
          enemy.x -= (dx / dist) * 30;
          enemy.y -= (dy / dist) * 30;
        }
      }
    }
    game.enemies = game.enemies.filter(function (enemy) { return !enemy.dead; });

    /* Balas del jugador */
    for (var b = game.bullets.length - 1; b >= 0; b--) {
      var bullet = game.bullets[b];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      var dead = bullet.life <= 0 || bullet.x < -20 || bullet.x > view.w + 20 || bullet.y < -20 || bullet.y > view.h + 20;

      if (!dead) {
        for (var e = 0; e < game.enemies.length; e++) {
          var targetEnemy = game.enemies[e];
          if (targetEnemy.dead) continue;
          if (distance(bullet.x, bullet.y, targetEnemy.x, targetEnemy.y) < targetEnemy.r + bullet.r) {
            targetEnemy.hp -= 1;
            targetEnemy.hit = 0.09;
            dead = true;
            game.particles.push({
              x: bullet.x, y: bullet.y,
              vx: -bullet.vx * 0.08, vy: -bullet.vy * 0.08,
              life: 0.2, max: 0.2, size: 1.6, color: COLORS.ink
            });
            if (targetEnemy.hp <= 0) killEnemy(targetEnemy);
            else beep(520, 0.03, 'square', 0.012, -120);
            break;
          }
        }
      }
      if (dead) game.bullets.splice(b, 1);
    }
    game.enemies = game.enemies.filter(function (enemy) { return !enemy.dead; });

    /* Balas enemigas */
    for (var eb = game.ebullets.length - 1; eb >= 0; eb--) {
      var shot = game.ebullets[eb];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      var remove = shot.life <= 0 || shot.x < -30 || shot.x > view.w + 30 || shot.y < -30 || shot.y > view.h + 30;
      if (!remove && distance(shot.x, shot.y, player.x, player.y) < shot.r + player.r) {
        damagePlayer();
        remove = true;
      }
      if (remove) game.ebullets.splice(eb, 1);
    }

    /* Recolectables */
    for (var p = game.pickups.length - 1; p >= 0; p--) {
      var pickup = game.pickups[p];
      pickup.life -= dt;
      pickup.angle += dt * 2;
      var pdx = player.x - pickup.x;
      var pdy = player.y - pickup.y;
      var pd = Math.hypot(pdx, pdy) || 1;
      if (pd < 170) {
        pickup.vx += (pdx / pd) * 420 * dt;
        pickup.vy += (pdy / pd) * 420 * dt;
      }
      pickup.vx *= Math.pow(0.4, dt);
      pickup.vy *= Math.pow(0.4, dt);
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;

      if (pd < pickup.r + player.r + 4) {
        if (pickup.type === 'heal') {
          if (player.hp < 3) { player.hp += 1; updateHUD(); }
          else game.score += 50;
          beep(660, 0.18, 'sine', 0.04, 220);
        } else if (pickup.type === 'rapid') {
          game.rapid = 7;
          beep(520, 0.12, 'square', 0.035, 260);
        } else {
          game.shield = 6;
          beep(440, 0.2, 'triangle', 0.04, 180);
        }
        explode(pickup.x, pickup.y, COLORS.mint, 12, 140);
        game.pickups.splice(p, 1);
        updateHUD();
      } else if (pickup.life <= 0) {
        game.pickups.splice(p, 1);
      }
    }

    /* Partículas */
    for (var q = game.particles.length - 1; q >= 0; q--) {
      var particle = game.particles[q];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.12, dt);
      particle.vy *= Math.pow(0.12, dt);
      if (particle.life <= 0) game.particles.splice(q, 1);
    }
  }

  /* Dibujo ---------------------------------------------------------------- */
  function render() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, view.w, view.h);
    if (bgGradient) {
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, view.w, view.h);
    }

    /* Estrellas */
    for (var s = 0; s < stars.length; s++) {
      var star = stars[s];
      ctx.fillStyle = 'rgba(233, 230, 242, ' + (0.12 + star.z * 0.42) + ')';
      ctx.fillRect(star.x, star.y, star.z > 0.75 ? 1.6 : 1, star.z > 0.75 ? 1.6 : 1);
    }

    /* Retícula */
    ctx.strokeStyle = 'rgba(94, 242, 199, 0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = 0; gx <= view.w; gx += 90) { ctx.moveTo(gx, 0); ctx.lineTo(gx, view.h); }
    for (var gy = 0; gy <= view.h; gy += 90) { ctx.moveTo(0, gy); ctx.lineTo(view.w, gy); }
    ctx.stroke();

    ctx.save();
    if (game.shake > 0.4) {
      ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
    }

    if (game.player) {
      /* Estela del jugador */
      if (game.mode === 'playing' && Math.hypot(game.player.vx, game.player.vy) > 80) {
        game.player.trail = Math.min(1, game.player.trail + 0.1);
      } else {
        game.player.trail = Math.max(0, game.player.trail - 0.08);
      }

      /* Escudo */
      if (game.shield > 0) {
        ctx.save();
        ctx.translate(game.player.x, game.player.y);
        ctx.rotate(game.time * 1.6);
        ctx.strokeStyle = 'rgba(94, 242, 199, ' + (0.4 + Math.sin(game.time * 6) * 0.2) + ')';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      /* Nave */
      var blink = game.player.invuln > 0 ? 0.45 + Math.abs(Math.sin(game.time * 22)) * 0.55 : 1;
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.translate(game.player.x, game.player.y);
      ctx.rotate(game.player.angle);
      ctx.shadowColor = COLORS.mint;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = COLORS.mint;
      ctx.lineWidth = 1.8;
      ctx.fillStyle = 'rgba(94, 242, 199, 0.14)';
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(-10, -9);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(-7, -1, 4, 2);
      ctx.restore();
    }

    /* Recolectables */
    for (var p = 0; p < game.pickups.length; p++) {
      var pickup = game.pickups[p];
      var color = pickup.type === 'heal' ? COLORS.pink : pickup.type === 'rapid' ? COLORS.amber : COLORS.mint;
      var letter = pickup.type === 'heal' ? '+' : pickup.type === 'rapid' ? '»' : '◇';
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      ctx.rotate(pickup.angle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = '12px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 0, 1);
      ctx.restore();
    }

    /* Enemigos */
    for (var e = 0; e < game.enemies.length; e++) {
      var enemy = game.enemies[e];
      var stroke = enemy.hit > 0 ? COLORS.ink : enemy.type === 'tank' ? COLORS.amber : enemy.type === 'shooter' ? COLORS.amber : COLORS.pink;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.angle);
      ctx.strokeStyle = stroke;
      ctx.fillStyle = enemy.type === 'tank' ? 'rgba(255, 207, 110, 0.08)' : 'rgba(255, 61, 129, 0.09)';
      ctx.lineWidth = enemy.type === 'tank' ? 2.2 : 1.5;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = enemy.type === 'tank' ? 16 : 10;
      ctx.beginPath();
      if (enemy.type === 'tank') {
        for (var h = 0; h < 6; h++) {
          var a = (h / 6) * TAU;
          var px = Math.cos(a) * enemy.r;
          var py = Math.sin(a) * enemy.r;
          if (h === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else if (enemy.type === 'shooter') {
        ctx.moveTo(enemy.r, 0);
        ctx.lineTo(0, enemy.r * 0.72);
        ctx.lineTo(-enemy.r, 0);
        ctx.lineTo(0, -enemy.r * 0.72);
        ctx.closePath();
      } else {
        ctx.moveTo(enemy.r, 0);
        ctx.lineTo(-enemy.r * 0.8, enemy.r * 0.8);
        ctx.lineTo(-enemy.r * 0.45, 0);
        ctx.lineTo(-enemy.r * 0.8, -enemy.r * 0.8);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (enemy.type !== 'chaser') {
        ctx.fillStyle = stroke;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.type === 'tank' ? 4 : 2.6, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    /* Balas */
    for (var b = 0; b < game.bullets.length; b++) {
      var bullet = game.bullets[b];
      ctx.strokeStyle = COLORS.mint;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.mint;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (var eb = 0; eb < game.ebullets.length; eb++) {
      var shot = game.ebullets[eb];
      ctx.fillStyle = COLORS.pink;
      ctx.shadowColor = COLORS.pink;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.r, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    /* Partículas */
    for (var q = 0; q < game.particles.length; q++) {
      var particle = game.particles[q];
      var alpha = Math.max(0, particle.life / particle.max);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - particle.vx * 0.02, particle.y - particle.vy * 0.02);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    /* Aviso de oleada */
    if (game.flash > 0 && game.mode === 'playing') {
      var flashAlpha = Math.min(1, game.flash) * 0.85;
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLORS.ink;
      ctx.font = 'italic 64px "Instrument Serif", Georgia, serif';
      ctx.shadowColor = COLORS.mint;
      ctx.shadowBlur = 24;
      ctx.fillText(game.flashText, view.w / 2, view.h / 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.mint;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText('SIGUE VIVO', view.w / 2, view.h / 2 + 48);
      ctx.restore();
    }
  }

  /* Bucle ----------------------------------------------------------------- */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  /* Entrada --------------------------------------------------------------- */
  window.addEventListener('keydown', function (event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(event.code) >= 0) {
      event.preventDefault();
    }
    game.keys[event.code] = true;

    if (event.code === 'Space' && !event.repeat) dash();
    if (event.code === 'KeyP' || event.code === 'Escape') togglePause();
    if (event.code === 'Enter' && !event.repeat && (game.mode === 'idle' || game.mode === 'over')) start();
  });

  window.addEventListener('keyup', function (event) {
    game.keys[event.code] = false;
  });

  window.addEventListener('blur', function () {
    if (game.mode === 'playing') togglePause();
  });

  canvas.addEventListener('pointerdown', function (event) {
    if (game.mode !== 'playing') return;
    audioInit();
    game.pointer.active = true;
    setPointer(event);
    try { canvas.setPointerCapture(event.pointerId); } catch (error) { /* sin captura */ }
  });
  canvas.addEventListener('pointermove', function (event) {
    if (!game.pointer.active) return;
    setPointer(event);
  });
  canvas.addEventListener('pointerup', function () { game.pointer.active = false; });
  canvas.addEventListener('pointercancel', function () { game.pointer.active = false; });

  function setPointer(event) {
    var rect = canvas.getBoundingClientRect();
    game.pointer.x = clamp(event.clientX - rect.left, 0, view.w);
    game.pointer.y = clamp(event.clientY - rect.top, 0, view.h);
  }

  if (ui.start) ui.start.addEventListener('click', start);
  if (ui.restart) ui.restart.addEventListener('click', start);
  if (ui.resume) ui.resume.addEventListener('click', togglePause);
  if (ui.pause) ui.pause.addEventListener('click', togglePause);
  if (ui.dash) {
    ui.dash.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      dash();
    });
  }

  window.addEventListener('resize', resize);
  if (ui.bestIntro) ui.bestIntro.textContent = pad(game.best, 6);

  resize();
  requestAnimationFrame(frame);
})();
