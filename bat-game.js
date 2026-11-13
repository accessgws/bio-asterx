// bat-game.js - Mini-game "Caçada na Madrugada" integrado ao Morcego ASTERX

const BEST_SCORE_KEY = 'asterx_bat_best';
const SFX_MUTE_KEY = 'asterx_bat_sfx_muted';

function initBatMiniGame() {
  const stageEl = document.getElementById('bat-stage');
  const openBtn = document.getElementById('btn-open-game');
  const openBestEl = document.getElementById('btn-open-game-best');
  const stageBestEl = document.getElementById('stage-best');
  const stageRankEl = document.getElementById('stage-rank');
  const gameSection = document.getElementById('game-section');
  const closeBtn = document.getElementById('btn-close-game');
  const muteBtn = document.getElementById('btn-mute-game');
  const scoreEl = document.getElementById('game-score');
  const bestEl = document.getElementById('game-best');
  const comboEl = document.getElementById('game-combo');
  const canvas = document.getElementById('game-canvas');
  const overlayEl = document.getElementById('game-overlay');
  const overlayEyebrow = document.getElementById('game-overlay-eyebrow');
  const overlayTitle = document.getElementById('game-overlay-title');
  const overlayRank = document.getElementById('game-overlay-rank');
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
  let shardCombo = 0;
  let currentPhaseIdx = 0;
  let phaseBannerTimer = 0;
  let phaseBannerText = '';
  let gameOverAt = 0;
  let flapBoost = 0;
  let screenShake = 0;
  let spawnDist = 0;

  const PHASES = [
    { minScore: 0, label: 'Fase I • Nebulosa Obsidian', topBg: '#1e0832', midBg: '#090311', border: 'rgba(189, 76, 255, 0.55)', cap: '#e084ff', starSpeedMul: 1 },
    { minScore: 15, label: 'Fase II • Vento Noturno', topBg: '#270a46', midBg: '#0b0316', border: 'rgba(215, 114, 255, 0.68)', cap: '#f0b6ff', starSpeedMul: 1.45 },
    { minScore: 30, label: 'Fase III • Eclipse Carmesim', topBg: '#30082f', midBg: '#0e0313', border: 'rgba(255, 110, 199, 0.72)', cap: '#ff90d8', starSpeedMul: 1.9 },
    { minScore: 50, label: 'Fase IV • Madrugada Suprema', topBg: '#1d0d47', midBg: '#080318', border: 'rgba(246, 236, 255, 0.78)', cap: '#f6f5ff', starSpeedMul: 2.35 }
  ];

  function getRankLabel(pts) {
    if (pts >= 60) return 'Patente: Lenda ASTERX';
    if (pts >= 35) return 'Patente: Senhor da Madrugada';
    if (pts >= 20) return 'Patente: Caçador Obsidian';
    if (pts >= 8) return 'Patente: Explorador Sombrio';
    return 'Patente: Aprendiz da Noite';
  }

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
  const floatingTexts = [];
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
    if (comboEl) {
      const mult = Math.min(3, shardCombo);
      comboEl.hidden = mult < 2;
      if (mult >= 2) comboEl.textContent = `Combo x${mult}`;
    }
    if (openBestEl) {
      openBestEl.textContent = bestScore > 0 ? `Recorde: ${bestScore}` : 'Arcade';
    }
    if (stageBestEl) {
      stageBestEl.textContent = `${bestScore} ${bestScore === 1 ? 'pt' : 'pts'}`;
    }
    if (stageRankEl) {
      stageRankEl.textContent = getRankLabel(bestScore);
    }
  }

  function addFloatingText(x, y, text, color = '#f6f5ff') {
    floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 0.85
    });
  }

  function checkPhaseProgress() {
    let nextIdx = 0;
    for (let i = PHASES.length - 1; i >= 0; i--) {
      if (score >= PHASES[i].minScore) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx > currentPhaseIdx) {
      currentPhaseIdx = nextIdx;
      phaseBannerText = PHASES[nextIdx].label;
      phaseBannerTimer = 2.0;
      playTone(440, 880, 0.16, 'sine', 0.06);
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

  function setOverlay(visible, eyebrow, title, sub, btnLabel, rankText = '') {
    if (!overlayEl) return;
    overlayEl.classList.toggle('is-hidden', !visible);
    if (eyebrow && overlayEyebrow) overlayEyebrow.textContent = eyebrow;
    if (title && overlayTitle) overlayTitle.textContent = title;
    if (overlayRank) {
      overlayRank.hidden = !rankText;
      if (rankText) overlayRank.textContent = rankText;
    }
    if (sub && overlaySub) overlaySub.textContent = sub;
    if (btnLabel && overlayBtn) overlayBtn.textContent = btnLabel;
  }

  function resetRun(autoStart = false) {
    score = 0;
    shardCombo = 0;
    currentPhaseIdx = 0;
    phaseBannerTimer = 0;
    phaseBannerText = '';
    bat.y = H * 0.44;
    bat.vy = 0;
    bat.tilt = 0;
    flapBoost = 0;
    screenShake = 0;
    spawnDist = 0;
    pillars.length = 0;
    shards.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
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
        'Toque, clique ou aperte Espaço para voar pelos portais e pegar cristais em sequência para combo.',
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
    shardCombo = 0;
    gameOverAt = performance.now();
    screenShake = 10;
    playTone(210, 75, 0.24, 'sawtooth', 0.09);
    emitParticles(bat.x, bat.y, 26, ['#e084ff', '#f9d9ff', '#ff6495', '#bd4cff'], 190);

    const prevBest = bestScore;
    let isNewRecord = false;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
      isNewRecord = true;
    }
    syncScoreUI();

    const diff = prevBest - score;
    const subText = isNewRecord
      ? 'Você superou seu melhor voo na madrugada!'
      : (diff > 0 && diff <= 5
        ? `Quase! Faltaram só ${diff} ${diff === 1 ? 'ponto' : 'pontos'} para o recorde (${bestScore}).`
        : `Seu recorde atual é ${bestScore} pontos.`);

    setOverlay(
      true,
      isNewRecord ? 'Novo Recorde!' : 'Fim de Voo',
      `${score} ${score === 1 ? 'ponto' : 'pontos'}`,
      subText,
      'Jogar novamente',
      getRankLabel(score)
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
    const phase = PHASES[currentPhaseIdx] || PHASES[0];
    const speed = state === 'playing' ? 168 + Math.min(95, score * 2.1) : 55;

    stars.forEach((s) => {
      s.x -= s.speed * phase.starSpeedMul * dt;
      if (s.x < -4) {
        s.x = W + 4;
        s.y = Math.random() * H;
      }
    });

    if (phaseBannerTimer > 0) {
      phaseBannerTimer = Math.max(0, phaseBannerTimer - dt);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.life += dt;
      ft.y -= 36 * dt;
      if (ft.life >= ft.maxLife) floatingTexts.splice(i, 1);
    }

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
        checkPhaseProgress();
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
        shardCombo += 1;
        const mult = Math.min(3, shardCombo);
        const pts = 3 * mult;
        score += pts;
        checkPhaseProgress();
        syncScoreUI();
        addFloatingText(
          s.x,
          s.y - 10,
          mult > 1 ? `+${pts} • x${mult}` : `+${pts}`,
          mult > 1 ? '#f6ccff' : '#ffffff'
        );
        playTone(680 + (mult - 1) * 140, 1080 + (mult - 1) * 180, 0.14, 'triangle', 0.08);
        emitParticles(s.x, s.y, 14 + mult * 3, ['#ffffff', '#e084ff', '#c9b3dc'], 135);
        shards.splice(i, 1);
        continue;
      }

      if (!s.collected && s.x < bat.x - 42 && shardCombo > 0) {
        shardCombo = 0;
        syncScoreUI();
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

  function drawPillar(x, y, w, h, capAtBottom, phase) {
    if (h <= 0) return;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#12051d');
    grad.addColorStop(0.5, '#1d0930');
    grad.addColorStop(1, '#0c0314');

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = phase.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);

    const capH = Math.min(12, h);
    const capY = capAtBottom ? (y + h - capH) : y;
    ctx.fillStyle = 'rgba(215, 114, 255, 0.24)';
    ctx.fillRect(x - 3, capY, w + 6, capH);
    ctx.strokeStyle = phase.cap;
    ctx.strokeRect(x - 3, capY, w + 6, capH);
  }

  function draw() {
    const phase = PHASES[currentPhaseIdx] || PHASES[0];
    ctx.save();
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    // Fundo obsidian + halo conforme fase da noite
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.35, 10, W * 0.5, H * 0.5, H * 0.75);
    bg.addColorStop(0, phase.topBg);
    bg.addColorStop(0.65, phase.midBg);
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
      drawPillar(p.x, -2, p.width, p.topH + 2, true, phase);
      drawPillar(p.x, p.bottomY, p.width, H - p.bottomY + 2, false, phase);
    });

    // Cristais bônus
    shards.forEach((s) => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.shadowColor = phase.cap;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f6f5ff';
      ctx.strokeStyle = phase.cap;
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

    // Textos flutuantes (+3 / Combo)
    floatingTexts.forEach((ft) => {
      const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 15px "Geist", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#bd4cff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Aviso de transição de Fase da Noite
    if (phaseBannerTimer > 0 && phaseBannerText) {
      const bannerAlpha = Math.min(1, phaseBannerTimer * 2, (2.0 - phaseBannerTimer) * 4 + 0.2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, bannerAlpha);
      ctx.font = '600 12px "Geist", system-ui, sans-serif';
      const tw = ctx.measureText(phaseBannerText).width + 28;
      ctx.fillStyle = 'rgba(18, 6, 30, 0.85)';
      ctx.strokeStyle = phase.cap;
      ctx.lineWidth = 1;
      const bx = (W - tw) / 2;
      const by = 18;
      const bh = 28;
      const br = 14;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bx, by, tw, bh, br);
      } else {
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + tw - br, by);
        ctx.arcTo(bx + tw, by, bx + tw, by + bh, br);
        ctx.lineTo(bx + tw, by + bh - br);
        ctx.arcTo(bx + tw, by + bh, bx, by + bh, br);
        ctx.lineTo(bx + br, by + bh);
        ctx.arcTo(bx, by + bh, bx, by, br);
        ctx.lineTo(bx, by + br);
        ctx.arcTo(bx, by, bx + tw, by, br);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f9ecff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(phaseBannerText, W / 2, 32);
      ctx.restore();
    }

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

