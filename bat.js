// bat.js - Animação Orgânica do Morcego ASTERX Vetorial & Interativo

function initBatEngine() {
  const svg = document.querySelector('.bat-svg') || document.querySelector('#morcego-svg') || document.querySelector('svg[viewBox="0 0 440 250"]');
  if (!svg) return;

  const silhouette = svg.querySelector('#silhueta') || svg.querySelector('.bat-silhueta');
  const bat = svg.querySelector('#morcego') || svg.querySelector('.bat-corpo');
  const trail = svg.querySelector('#rastro') || svg.querySelector('.bat-rastro');
  const eyes = svg.querySelector('#olhos') || svg.querySelector('.bat-olhos');
  const shadow = svg.querySelector('#sombra') || svg.querySelector('.bat-sombra');

  if (!silhouette || !bat) return;

  // Anel de choque sutil para cliques/acrobacias e pulso de aura
  let pulseRing = svg.querySelector('#bat-pulse');
  if (!pulseRing) {
    pulseRing = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    pulseRing.id = 'bat-pulse';
    pulseRing.setAttribute('cx', '220');
    pulseRing.setAttribute('cy', '118');
    pulseRing.setAttribute('rx', '34');
    pulseRing.setAttribute('ry', '22');
    pulseRing.setAttribute('fill', 'none');
    pulseRing.setAttribute('stroke', '#e78cff');
    pulseRing.setAttribute('stroke-width', '2.5');
    pulseRing.setAttribute('opacity', '0');
    svg.insertBefore(pulseRing, bat);
  }

  // Camadas SVG únicas para partículas (filtro no grupo preserva performance mobile)
  let trailParticlesGroup = svg.querySelector('#particulas-rastro');
  if (!trailParticlesGroup) {
    trailParticlesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    trailParticlesGroup.id = 'particulas-rastro';
    trailParticlesGroup.style.filter = 'drop-shadow(0 0 2px #d749ff)';
    svg.insertBefore(trailParticlesGroup, bat);
  }

  let burstParticlesGroup = svg.querySelector('#particulas-burst');
  if (!burstParticlesGroup) {
    burstParticlesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    burstParticlesGroup.id = 'particulas-burst';
    burstParticlesGroup.style.filter = 'drop-shadow(0 0 3px #bd4cff)';
    svg.appendChild(burstParticlesGroup);
  }

  // Envolve os olhos em um grupo para rastreamento suave pelo cursor
  let eyesGroup = (eyes && eyes.parentElement && eyes.parentElement.id === 'grupo-olhos') ? eyes.parentElement : null;
  if (!eyesGroup && eyes) {
    eyesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    eyesGroup.id = 'grupo-olhos';
    eyes.parentNode.insertBefore(eyesGroup, eyes);
    eyesGroup.appendChild(eyes);
  }

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let phase = 0;
  let elapsed = 0;
  let previous = null;
  let frame = null;

  // Energia dinâmica (acelera sutilmente ao passar o mouse/clicar)
  let energy = 0;
  let targetEnergy = 0;
  let pulseProgress = 1;

  // Sistema de partículas
  const particles = [];

  // Rastreamento do Cursor / Toque
  let targetEyeX = 0;
  let targetEyeY = 0;
  let currentEyeX = 0;
  let currentEyeY = 0;

  function updateTargetPosition(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.45;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    targetEyeX = Math.max(-5.5, Math.min(5.5, dx * 0.028));
    targetEyeY = Math.max(-3.5, Math.min(3.5, dy * 0.024));
    targetEnergy = dist < Math.max(rect.width * 1.35, 190) ? 0.55 : 0;
  }

  window.addEventListener('mousemove', (e) => {
    updateTargetPosition(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      updateTargetPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      updateTargetPosition(e.touches[0].clientX, e.touches[0].clientY);
      energy = Math.max(energy, 0.75);
    }
  }, { passive: true });

  // Curva assimétrica orgânica: descida rápida com pressão de ar e subida fluida
  function organicStroke(p) {
    return (Math.sin(p) + 0.24 * Math.sin(p * 2 - 0.55)) * 0.88;
  }

  // Explosão de partículas + onda de choque ao clicar
  window.triggerBatBurst = function(count = 24) {
    energy = 1;
    pulseProgress = 0;

    const colors = ['#ffffff', '#f7ddff', '#e084ff', '#bd4cff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.38;
      const speed = 2.6 + Math.random() * 4.8;
      const r = 1.6 + Math.random() * 1.9;
      const elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      elem.setAttribute('r', r.toFixed(1));
      elem.setAttribute('fill', colors[i % colors.length]);
      burstParticlesGroup.appendChild(elem);

      particles.push({
        elem,
        isCircle: true,
        baseSize: r,
        x: 220,
        y: 112,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.9,
        life: 0,
        maxLife: 24 + Math.random() * 16,
        gravity: 0.08,
        drag: 0.955
      });
    }
  };

  // Faíscas suaves nas pontas flexíveis das asas
  let lastSparkTime = 0;
  function emitWingtipSparks(lx, ly, rx, ry, downForce, now) {
    const interval = energy > 0.35 ? 24 : 34;
    if (particles.length >= 40 || (now - lastSparkTime) < interval) return;
    lastSparkTime = now;

    const colors = ['#f8e2ff', '#d749ff', '#ba3eff'];
    const tips = [
      { x: lx, y: ly, vx: -0.75 },
      { x: rx, y: ry, vx: 0.75 }
    ];

    tips.forEach((pt, idx) => {
      if (Math.random() > (0.42 + downForce * 0.25)) return;
      const r = 1.1 + Math.random() * 1.1;
      const elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      elem.setAttribute('r', r.toFixed(1));
      elem.setAttribute('fill', colors[(idx + Math.floor(Math.random() * 3)) % colors.length]);
      trailParticlesGroup.appendChild(elem);

      particles.push({
        elem,
        isCircle: true,
        baseSize: r,
        x: pt.x + (Math.random() - 0.5) * 4,
        y: pt.y + (Math.random() - 0.5) * 4,
        vx: pt.vx + (Math.random() - 0.5) * 0.45,
        vy: 0.55 + Math.random() * 1.15,
        life: 0,
        maxLife: 20 + Math.random() * 12,
        gravity: 0.035,
        drag: 0.97
      });
    });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life++;

      const progress = p.life / p.maxLife;
      if (progress >= 1 || p.x < -10 || p.x > 450 || p.y > 260) {
        if (p.elem && p.elem.parentNode) {
          p.elem.parentNode.removeChild(p.elem);
        }
        particles.splice(i, 1);
        continue;
      }

      const fade = 1 - progress;
      p.elem.setAttribute('cx', p.x.toFixed(1));
      p.elem.setAttribute('cy', p.y.toFixed(1));
      p.elem.setAttribute('r', Math.max(0.35, p.baseSize * (0.35 + 0.65 * fade)).toFixed(2));
      p.elem.setAttribute('opacity', (fade * fade).toFixed(2));
    }
  }

  function draw(dt, now) {
    // Suavização de energia e fase contínua sem saltos quando acelera
    energy += (targetEnergy - energy) * Math.min(1, dt * 3.5);
    targetEnergy *= Math.max(0, 1 - dt * 0.6);

    const speedFactor = 1 + energy * 0.42;
    phase += (dt * Math.PI * 2 / 0.96) * speedFactor;
    elapsed += dt * 1000;

    // Batida primária (ombro/cotovelo) + atraso aerodinâmico na ponta das asas
    const inner = organicStroke(phase);
    const wrist = organicStroke(phase - 0.28);
    const tip = organicStroke(phase - 0.56);
    const ampScale = 1 + energy * 0.14;

    // Recuo do corpo sincronizado ao impulso das asas
    const bodyLift = -Math.sin(phase - 0.9) * (5.2 + energy * 1.8);

    // Encolhimento horizontal sutil na subida e abertura total na descida
    const tuck = Math.max(0, -tip) * 9.5 - Math.max(0, tip) * 3.5;

    const lWristX = (115 + tuck * 0.35).toFixed(2);
    const rWristX = (325 - tuck * 0.35).toFixed(2);
    const lWristY = (141 + inner * 13 * ampScale).toFixed(2);
    const rWristY = lWristY;

    const lTipX = (32 + tuck).toFixed(2);
    const rTipX = (408 - tuck).toFixed(2);
    const lTipY = (146 + tip * 25 * ampScale).toFixed(2);
    const rTipY = lTipY;

    const lElbowX = (47 + tuck * 0.72).toFixed(2);
    const rElbowX = (393 - tuck * 0.72).toFixed(2);
    const lElbowY = (98 + wrist * 22 * ampScale).toFixed(2);
    const rElbowY = lElbowY;

    const lPeakX = (106 + tuck * 0.35).toFixed(2);
    const rPeakX = (334 - tuck * 0.35).toFixed(2);
    const lPeakY = (31 + inner * 18 * ampScale).toFixed(2);
    const rPeakY = lPeakY;

    const qY = (100 + wrist * 18 * ampScale).toFixed(2);
    const cY = (114 + inner * 8.5 * ampScale).toFixed(2);

    // Leve movimento nas orelhas ao bater forte
    const earDip = (inner * 1.4).toFixed(2);

    // Suavização do movimento dos olhos
    currentEyeX += (targetEyeX - currentEyeX) * 0.14;
    currentEyeY += (targetEyeY - currentEyeY) * 0.14;

    silhouette.setAttribute('d', `M220 192
      C182 148 150 ${cY} ${lWristX} ${lWristY}
      Q92 ${qY} ${lTipX} ${lTipY}
      L${lElbowX} ${lElbowY} L${lPeakX} ${lPeakY} L179 78 L184 ${(32 + Number(earDip)).toFixed(2)} L202 56
      H238 L256 ${(32 + Number(earDip)).toFixed(2)} L261 78 L${rPeakX} ${rPeakY} L${rElbowX} ${rElbowY} L${rTipX} ${rTipY}
      Q348 ${qY} ${rWristX} ${rWristY}
      C290 ${cY} 258 148 220 192Z`);

    // Rastro de movimento contínuo em arcos duplos nas pontas das asas
    const downVelocity = Math.max(0, Math.cos(phase - 0.56));
    if (trail) {
      const lxNum = Number(lTipX);
      const lyNum = Number(lTipY);
      const rxNum = Number(rTipX);
      const ryNum = Number(rTipY);
      const leY = Number(lElbowY);
      const trailLift = -tip * 14;

      trail.setAttribute('d', `M${(lxNum - 12).toFixed(1)} ${(lyNum + 8 + trailLift).toFixed(1)} Q${(lxNum - 2).toFixed(1)} ${((lyNum + leY) / 2 + trailLift * 0.4).toFixed(1)} ${(Number(lElbowX) - 7).toFixed(1)} ${(leY - 4).toFixed(1)}
        M${(rxNum + 12).toFixed(1)} ${(ryNum + 8 + trailLift).toFixed(1)} Q${(rxNum + 2).toFixed(1)} ${((ryNum + leY) / 2 + trailLift * 0.4).toFixed(1)} ${(Number(rElbowX) + 7).toFixed(1)} ${(leY - 4).toFixed(1)}`);
      trail.setAttribute('stroke-width', (1.8 + downVelocity * 1.4).toFixed(2));
      trail.setAttribute('opacity', (0.2 + downVelocity * 0.58).toFixed(3));
    }

    // Emissão de faíscas nos momentos de maior pressão das asas
    if (downVelocity > 0.28 || energy > 0.35) {
      emitWingtipSparks(Number(lTipX), Number(lTipY), Number(rTipX), Number(rTipY), downVelocity, now);
    }

    // Inclinação em direção ao cursor/dedo + recuo vertical orgânico
    const tilt = currentEyeX * 0.95;
    bat.setAttribute('transform', `translate(0 ${bodyLift.toFixed(2)}) rotate(${tilt.toFixed(2)} 220 120)`);

    if (shadow) {
      shadow.setAttribute('rx', (62 - bodyLift * 1.35).toFixed(2));
      shadow.setAttribute('opacity', Math.max(0.28, Math.min(0.62, 0.52 + bodyLift * 0.018)).toFixed(3));
    }

    // Pulso expansivo ao clicar no morcego
    if (pulseProgress < 1) {
      pulseProgress = Math.min(1, pulseProgress + dt * 2.1);
      const easeOut = 1 - Math.pow(1 - pulseProgress, 3);
      pulseRing.setAttribute('rx', (36 + easeOut * 145).toFixed(1));
      pulseRing.setAttribute('ry', (22 + easeOut * 88).toFixed(1));
      pulseRing.setAttribute('opacity', ((1 - pulseProgress) * 0.72).toFixed(2));
    } else if (pulseRing.getAttribute('opacity') !== '0') {
      pulseRing.setAttribute('opacity', '0');
    }

    // Olhos com rastreamento e piscada natural
    if (eyesGroup) {
      eyesGroup.setAttribute('transform', `translate(${currentEyeX.toFixed(2)} ${currentEyeY.toFixed(2)})`);
    }
    if (eyes) {
      eyes.setAttribute('opacity', (elapsed % 3800 > 3690) ? '.18' : '1');
    }

    if (particles.length > 0) {
      updateParticles();
    }
  }

  let inViewport = true;

  function tick(now) {
    const dt = previous !== null ? Math.min((now - previous) / 1000, 0.045) : 0.016;
    previous = now;
    draw(dt, now);
    frame = requestAnimationFrame(tick);
  }

  function setPlaying(playing) {
    if (frame !== null) cancelAnimationFrame(frame);
    previous = null;
    if (!playing && trail) trail.setAttribute('opacity', '0');
    frame = playing ? requestAnimationFrame(tick) : null;
  }

  function syncPlayback() {
    setPlaying(!motion.matches && !document.hidden && inViewport);
  }

  motion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);

  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => {
      inViewport = entries[0] ? entries[0].isIntersecting : true;
      syncPlayback();
    }, { threshold: 0.05 });
    observer.observe(svg);
  }

  syncPlayback();

  // Clique no morcego para acrobacia 360 e explosão de energia
  const companion = svg.closest('.companion') || svg.closest('.stage') || svg.closest('main') || svg.parentElement;
  if (companion) {
    companion.style.cursor = 'pointer';
    companion.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) return;
      companion.classList.remove('do-flip');
      void companion.offsetWidth;
      companion.classList.add('do-flip');
      window.triggerBatBurst(26);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBatEngine);
} else {
  initBatEngine();
}
