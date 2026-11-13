// bat-game.js - Mini-game "Caçada na Madrugada" integrado ao Morcego ASTERX

const BEST_SCORE_KEY = 'asterx_bat_best';
const SFX_MUTE_KEY = 'asterx_bat_sfx_muted';

function initBatMiniGame() {
  const stageEl = document.getElementById('bat-stage');
  const openBtn = document.getElementById('btn-open-game');
  const openBestEl = document.getElementById('btn-open-game-best');
  const gameSection = document.getElementById('game-section');
  const closeBtn = document.getElementById('btn-close-game');
  const muteBtn = document.getElementById('btn-mute-game');
  const scoreEl = document.getElementById('game-score');
  const bestEl = document.getElementById('game-best');
  const canvas = document.getElementById('game-canvas');
  const overlayEl = document.getElementById('game-overlay');
  const overlayEyebrow = document.getElementById('game-overlay-eyebrow');
  const overlayTitle = document.getElementById('game-overlay-title');
  const overlaySub = document.getElementById('game-overlay-sub');
  const overlayBtn = document.getElementById('game-overlay-btn');

  if (!stageEl || !openBtn || !gameSection || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 420;
  const H = 540;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY) || 0) || 0;
  let isMuted = localStorage.getItem(SFX_MUTE_KEY) === '1';
  let isOpen = false;
  let rafId = null;
  let lastTs = 0;

  // Estado: 'ready' | 'playing' | 'gameover'
  let state = 'ready';
  let score = 0;
  let gameOverAt = 0;
  let flapBoost = 0;
  let screenShake = 0;
  let spawnDist = 0;

  const bat = {
    x: 110,
    y: H * 0.44,
    vy: 0,
    radius: 13,
    wingPhase: 0,
    tilt: 0
  };

  const pillars = [];
  const shards = [];
  const particles = [];
  const wingTrail = [];
  const stars = Array.from({ length: 28 }, (_, i) => ({
    x: ((i * 73) % W),
    y: ((i * 137) % H),
    r: (i % 3 === 0) ? 1.6 : 1,
    speed: 14 + (i % 4) * 8,
    alpha: 0.25 + (i % 5) * 0.12
  }));

  // Áudio sintético leve via Web Audio API (zero downloads externos)
  let audioCtx = null;
  function playTone(freq, endFreq, duration, type = 'triangle', gainPeak = 0.08) {
    if (isMuted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (_) {
      // Ignora bloqueios de áudio silenciosamente
    }
  }

  function syncMuteUI() {
    if (!muteBtn) return;
    muteBtn.textContent = isMuted ? 'Som: Off' : 'Som: On';
    muteBtn.setAttribute('aria-pressed', String(!isMuted));
  }

  function syncScoreUI() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (bestEl) bestEl.textContent = String(bestScore);
    if (openBestEl) {
      openBestEl.textContent = bestScore > 0 ? `Recorde: ${bestScore}` : 'Arcade';
    }
  }

  function emitParticles(x, y, count, palette, spread = 140) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * spread;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.35,
        size: 2 + Math.random() * 2.5,
        color: palette[i % palette.length]
      });
    }
  }

  function setOverlay(visible, eyebrow, title, sub, btnLabel) {
    if (!overlayEl) return;
    overlayEl.classList.toggle('is-hidden', !visible);
    if (eyebrow && overlayEyebrow) overlayEyebrow.textContent = eyebrow;
    if (title && overlayTitle) overlayTitle.textContent = title;
    if (sub && overlaySub) overlaySub.textContent = sub;
    if (btnLabel && overlayBtn) overlayBtn.textContent = btnLabel;
  }

  function resetRun(autoStart = false) {
    score = 0;
    bat.y = H * 0.44;
    bat.vy = 0;
    bat.tilt = 0;
    flapBoost = 0;
    screenShake = 0;
    spawnDist = 0;
    pillars.length = 0;
    shards.length = 0;
    particles.length = 0;
    wingTrail.length = 0;
    syncScoreUI();

    if (autoStart) {
      state = 'playing';
      setOverlay(false);
      flap();
    } else {
      state = 'ready';
      setOverlay(
        true,
        'Mini-Game',
        'Caçada na Madrugada',
        'Toque, clique ou aperte Espaço para voar pelos portais e coletar cristais (+3).',
        'Começar voo'
      );
    }
  }

  function spawnGate() {
    const difficulty = Math.min(1, score / 40);
    const gap = 158 - difficulty * 28;
    const minTop = 76;
    const maxTop = H - 76 - gap;
    const topH = minTop + Math.random() * (maxTop - minTop);
    const width = 56;
    const x = W + 30;

    pillars.push({
      x,
      width,
      topH,
      bottomY: topH + gap,
      passed: false
    });

    if (Math.random() < 0.65) {
      shards.push({
        x: x + width / 2 + (Math.random() < 0.5 ? 0 : 108),
        y: topH + gap * (0.28 + Math.random() * 0.44),
        r: 9,
        rot: 0,
        collected: false
      });
    }
  }

  function triggerGameOver() {
    if (state === 'gameover') return;
    state = 'gameover';
    gameOverAt = performance.now();
    screenShake = 10;
    playTone(210, 75, 0.24, 'sawtooth', 0.09);
    emitParticles(bat.x, bat.y, 26, ['#e084ff', '#f9d9ff', '#ff6495', '#bd4cff'], 190);

    let isNewRecord = false;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
      isNewRecord = true;
    }
    syncScoreUI();

    setOverlay(
      true,
      isNewRecord ? 'Novo Recorde!' : 'Fim de Voo',
      `${score} ${score === 1 ? 'ponto' : 'pontos'}`,
      isNewRecord
        ? 'Você superou seu melhor voo na madrugada.'
        : `Seu recorde atual é ${bestScore} pontos.`,
      'Jogar novamente'
    );
  }

  function flap() {
    if (!isOpen) return;
    if (state === 'gameover') {
      if (performance.now() - gameOverAt > 360) {
        resetRun(true);
      }
      return;
    }
    if (state === 'ready') {
      state = 'playing';
      setOverlay(false);
    }

    bat.vy = -425;
    flapBoost = 1;
    playTone(320, 520, 0.09, 'triangle', 0.06);
    emitParticles(bat.x - 10, bat.y + 6, 7, ['#d749ff', '#f6ccff', '#9b30ea'], 95);
  }

  function update(dt) {
    const speed = state === 'playing' ? 168 + Math.min(95, score * 2.1) : 55;

    stars.forEach((s) => {
      s.x -= s.speed * dt;
      if (s.x < -4) {
        s.x = W + 4;
        s.y = Math.random() * H;
      }
    });

    flapBoost = Math.max(0, flapBoost - dt * 3.4);
    bat.wingPhase += dt * (state === 'playing' ? (9.5 + flapBoost * 12) : 6.5);

    const speedTrail = state === 'playing' ? speed : 55;
    wingTrail.forEach((pt) => { pt.x -= speedTrail * dt; });
    const tipOffset = (Math.sin(bat.wingPhase - 0.5) + 0.24 * Math.sin((bat.wingPhase - 0.5) * 2 - 0.55)) * 10;
    wingTrail.push({ x: bat.x - 16, y: bat.y + 4 + tipOffset });
    if (wingTrail.length > 14) wingTrail.shift();

    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - dt * 28);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
    }

    if (state === 'ready') {
      bat.y = H * 0.44 + Math.sin(bat.wingPhase * 0.55) * 9;
      bat.tilt = Math.sin(bat.wingPhase * 0.55) * 0.06;
      return;
    }

    if (state !== 'playing') return;

    // Física do voo
    bat.vy = Math.min(560, bat.vy + 1300 * dt);
    bat.y += bat.vy * dt;
    const targetTilt = Math.max(-0.42, Math.min(0.68, bat.vy / 560));
    bat.tilt += (targetTilt - bat.tilt) * Math.min(1, dt * 12);

    if (bat.y - bat.radius <= 0 || bat.y + bat.radius >= H) {
      bat.y = Math.max(bat.radius, Math.min(H - bat.radius, bat.y));
      triggerGameOver();
      return;
    }

    // Spawn de portais por distância horizontal constante
    spawnDist += speed * dt;
    if (spawnDist >= 225) {
      spawnDist = 0;
      spawnGate();
    }

    for (let i = pillars.length - 1; i >= 0; i--) {
      const p = pillars[i];
      p.x -= speed * dt;

      if (!p.passed && p.x + p.width < bat.x) {
        p.passed = true;
        score += 1;
        syncScoreUI();
        playTone(540, 720, 0.07, 'sine', 0.05);
      }

      const hitX = bat.x + bat.radius > p.x && bat.x - bat.radius < p.x + p.width;
      const hitY = bat.y - bat.radius < p.topH || bat.y + bat.radius > p.bottomY;
      if (hitX && hitY) {
        triggerGameOver();
        return;
      }

      if (p.x + p.width < -30) {
        pillars.splice(i, 1);
      }
    }

    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.x -= speed * dt;
      s.rot += dt * 3.2;

      const dx = bat.x - s.x;
      const dy = bat.y - s.y;
      if (!s.collected && (dx * dx + dy * dy) <= (bat.radius + s.r + 3) ** 2) {
        s.collected = true;
        score += 3;
        syncScoreUI();
        playTone(680, 1080, 0.13, 'triangle', 0.08);
        emitParticles(s.x, s.y, 14, ['#ffffff', '#e084ff', '#c9b3dc'], 135);
        shards.splice(i, 1);
        continue;
      }

      if (s.x < -30) shards.splice(i, 1);
    }
  }

  function drawBatSprite() {
    const inner = (Math.sin(bat.wingPhase) + 0.24 * Math.sin(bat.wingPhase * 2 - 0.55)) * 0.88;
    const tipWave = (Math.sin(bat.wingPhase - 0.52) + 0.24 * Math.sin((bat.wingPhase - 0.52) * 2 - 0.55)) * 0.88;
    const wingLift = inner * 9.5;
    const tipDrop = tipWave * 12;
    const tuck = Math.max(0, -tipWave) * 3.8 - Math.max(0, tipWave) * 1.4;

    // Rastro contínuo neon atrás da asa no voo
    if (wingTrail.length > 2) {
      ctx.save();
      ctx.beginPath();
      wingTrail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      const trailGrad = ctx.createLinearGradient(wingTrail[0].x, 0, bat.x, 0);
      trailGrad.addColorStop(0, 'rgba(215, 73, 255, 0)');
      trailGrad.addColorStop(1, 'rgba(231, 132, 255, 0.55)');
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(bat.x, bat.y);
    ctx.rotate(bat.tilt);

    // Aura sutil
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
    aura.addColorStop(0, `rgba(189, 76, 255, ${(0.28 + flapBoost * 0.22).toFixed(2)})`);
    aura.addColorStop(1, 'rgba(189, 76, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();

    // Silhueta vetorial com dobra horizontal orgânica nas asas
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-7, 5, -13, -1 + wingLift * 0.4, -19 + tuck * 0.35, 4 + wingLift * 0.65);
    ctx.quadraticCurveTo(-24 + tuck * 0.7, -4 + tipDrop * 0.75, -33 + tuck, 5 + tipDrop);
    ctx.lineTo(-29 + tuck * 0.72, -4 + tipDrop * 0.75);
    ctx.lineTo(-19 + tuck * 0.35, -15 + wingLift * 0.7);
    ctx.lineTo(-7, -6);
    ctx.lineTo(-6, -15);
    ctx.lineTo(-3, -10);
    ctx.lineTo(3, -10);
    ctx.lineTo(6, -15);
    ctx.lineTo(7, -6);
    ctx.lineTo(19 - tuck * 0.35, -15 + wingLift * 0.7);
    ctx.lineTo(29 - tuck * 0.72, -4 + tipDrop * 0.75);
    ctx.lineTo(33 - tuck, 5 + tipDrop);
    ctx.quadraticCurveTo(24 - tuck * 0.7, -4 + tipDrop * 0.75, 19 - tuck * 0.35, 4 + wingLift * 0.65);
    ctx.bezierCurveTo(13, -1 + wingLift * 0.4, 7, 5, 0, 12);
    ctx.closePath();

    ctx.fillStyle = '#1b0b29';
    ctx.strokeStyle = '#d749ff';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#bd4cff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.stroke();

    // Olhos luminosos
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#f9d9ff';
    ctx.fillStyle = '#f9d9ff';
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(-1.8, -3);
    ctx.lineTo(-4.2, -2.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(5, -5);
    ctx.lineTo(1.8, -3);
    ctx.lineTo(4.2, -2.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawPillar(x, y, w, h, capAtBottom) {
    if (h <= 0) return;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#12051d');
    grad.addColorStop(0.5, '#1d0930');
    grad.addColorStop(1, '#0c0314');

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(189, 76, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);

    const capH = Math.min(12, h);
    const capY = capAtBottom ? (y + h - capH) : y;
    ctx.fillStyle = 'rgba(215, 114, 255, 0.24)';
    ctx.fillRect(x - 3, capY, w + 6, capH);
    ctx.strokeStyle = '#e084ff';
    ctx.strokeRect(x - 3, capY, w + 6, capH);
  }

  function draw() {
    ctx.save();
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    // Fundo obsidian + halo central
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.35, 10, W * 0.5, H * 0.5, H * 0.75);
    bg.addColorStop(0, '#1e0832');
    bg.addColorStop(0.65, '#090311');
    bg.addColorStop(1, '#040107');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Estrelas em movimento
    stars.forEach((s) => {
      ctx.fillStyle = `rgba(232, 204, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });

    // Portais
    pillars.forEach((p) => {
      drawPillar(p.x, -2, p.width, p.topH + 2, true);
      drawPillar(p.x, p.bottomY, p.width, H - p.bottomY + 2, false);
    });

    // Cristais bônus (+3)
    shards.forEach((s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.shadowColor = '#e084ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f6f5ff';
      ctx.strokeStyle = '#d772ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -s.r);
      ctx.lineTo(s.r * 0.72, 0);
      ctx.lineTo(0, s.r);
      ctx.lineTo(-s.r * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Partículas
    particles.forEach((p) => {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    drawBatSprite();

    ctx.restore();
  }

  function loop(now) {
    if (!isOpen) return;
    if (!lastTs) lastTs = now;
    const dt = Math.min((now - lastTs) / 1000, 0.045);
    lastTs = now;

    if (!document.hidden) {
      update(dt);
      draw();
    }
    rafId = requestAnimationFrame(loop);
  }

  function openGame() {
    isOpen = true;
    stageEl.hidden = true;
    gameSection.hidden = false;
    resetRun(false);
    lastTs = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function closeGame() {
    isOpen = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    gameSection.hidden = true;
    stageEl.hidden = false;
    openBtn.focus({ preventScroll: true });
  }

  openBtn.addEventListener('click', openGame);
  if (closeBtn) closeBtn.addEventListener('click', closeGame);

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      localStorage.setItem(SFX_MUTE_KEY, isMuted ? '1' : '0');
      syncMuteUI();
    });
  }

  if (overlayBtn) {
    overlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state === 'gameover') {
        resetRun(true);
      } else {
        flap();
      }
    });
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    flap();
  });

  window.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeGame();
      return;
    }
    if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Enter') {
      if (e.key === 'Enter' && document.activeElement === closeBtn) return;
      e.preventDefault();
      flap();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTs = performance.now();
  });

  syncMuteUI();
  syncScoreUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBatMiniGame);
} else {
  initBatMiniGame();
}

