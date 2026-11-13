// arrival.js - Abertura Cinematográfica: Boas-Vindas, Metamorfose em Morcego e Voo até o Header

function playBatArrival() {
  const preLayer = document.getElementById('arrival-layer');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (window.__asterxSkipArrival || motion.matches || typeof Element.prototype.animate !== 'function') {
    clearTimeout(window.__asterxArrivalFailsafe);
    if (preLayer) preLayer.remove();
    return;
  }

  window.__asterxArrivalStarted = true;
  clearTimeout(window.__asterxArrivalFailsafe);

  const companion = document.querySelector('.companion');
  if (!companion) {
    if (preLayer) preLayer.remove();
    return;
  }

  const original = companion.querySelector('.bat-svg') || companion.querySelector('svg');
  if (!original) {
    if (preLayer) preLayer.remove();
    return;
  }

  // Reaproveita o palco pré-carregado no HTML (evita flash do site antes da abertura)
  const layer = preLayer || document.createElement('div');
  if (!preLayer) {
    layer.id = 'arrival-layer';
    layer.className = 'arrival';
    layer.setAttribute('aria-hidden', 'true');
    layer.title = 'Clique para pular introdução';
    const createdBackdrop = document.createElement('div');
    createdBackdrop.className = 'arrival-backdrop';
    layer.append(createdBackdrop);
    document.body.append(layer);
  }

  const backdrop = layer.querySelector('.arrival-backdrop');

  // Container Central de Boas-Vindas
  const centerBox = document.createElement('div');
  centerBox.className = 'arrival-center';

  const halo = document.createElement('div');
  halo.className = 'arrival-halo';

  const tag = document.createElement('span');
  tag.className = 'arrival-tag';
  tag.textContent = '✦ ASTERX';

  const greeting = document.createElement('h1');
  greeting.className = 'arrival-greeting';
  greeting.textContent = 'Bem-vindo';
  greeting.style.opacity = '0';

  const shockwave = document.createElement('div');
  shockwave.className = 'arrival-shockwave';

  const shockwave2 = document.createElement('div');
  shockwave2.className = 'arrival-shockwave-2';

  const skipHint = document.createElement('p');
  skipHint.className = 'arrival-skip-hint';
  skipHint.textContent = 'Toque para pular';

  centerBox.append(halo, tag, greeting, shockwave, shockwave2);
  layer.append(centerBox, skipHint);
  companion.classList.add('is-arriving');

  // Posição exata do centro do texto de boas-vindas
  const greetingRect = greeting.getBoundingClientRect();
  const centerX = greetingRect.left + greetingRect.width / 2;
  const centerY = greetingRect.top + greetingRect.height / 2;

  // Medição exata do slot de destino (.companion no header)
  const targetRect = original.getBoundingClientRect();
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  // Dimensões do morcego no centro
  const batWidth = Math.min(innerWidth * 0.78, 380);
  const batHeight = batWidth * (250 / 440);
  const batLeft = centerX - batWidth / 2;
  const batTop = centerY - batHeight / 2;

  // Escala final ao pousar no header
  const finalScale = targetRect.width / batWidth;
  const deltaX = targetCenterX - centerX;
  const deltaY = targetCenterY - centerY;
  const bankAngle = deltaX < 0 ? -15 : 15;

  // Morcego Voador (Clonado do vetor original)
  const flyingBat = original.cloneNode(true);
  flyingBat.setAttribute('class', 'arrival-bat');
  flyingBat.style.position = 'fixed';
  flyingBat.style.left = `${batLeft}px`;
  flyingBat.style.top = `${batTop}px`;
  flyingBat.style.width = `${batWidth}px`;
  flyingBat.style.height = `${batHeight}px`;
  flyingBat.style.opacity = '0';
  flyingBat.style.transformOrigin = '50% 50%';

  layer.appendChild(flyingBat);

  const flyingSilhouette = flyingBat.querySelector('#silhueta') || flyingBat.querySelectorAll('path')[1];
  const flyingTrail = flyingBat.querySelector('#rastro') || flyingBat.querySelectorAll('path')[0];

  function pose(x, y, angle, scale) {
    return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${angle.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
  }

  function organicStroke(p) {
    return (Math.sin(p) + 0.24 * Math.sin(p * 2 - 0.55)) * 0.88;
  }

  function emitMorphSparks() {
    const colors = ['#ffffff', '#f5d6ff', '#e084ff', '#bd4cff'];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'arrival-spark';
      spark.style.background = colors[i % colors.length];
      centerBox.appendChild(spark);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const dist = 65 + Math.random() * 115;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist * 0.72;

      spark.animate([
        { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
        { transform: `translate(calc(-50% + ${tx.toFixed(1)}px), calc(-50% + ${ty.toFixed(1)}px)) scale(0.15)`, opacity: 0 }
      ], { duration: 480 + Math.random() * 160, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
    }
  }

  // 1. Entrada sincronizada: selo ASTERX, halo e texto "Bem-vindo" (0 - 520ms)
  halo.animate([
    { opacity: 0, transform: 'translate(-50%, -50%) scale(0.7)' },
    { opacity: 0.9, transform: 'translate(-50%, -50%) scale(1.05)' }
  ], { duration: 540, easing: 'ease-out', fill: 'forwards' });

  tag.animate([
    { opacity: 0, transform: 'translateY(8px) scale(0.92)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ], { duration: 460, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });

  greeting.animate([
    { opacity: 0, transform: 'scale(0.92) translateY(10px)', letterSpacing: '0.06em' },
    { opacity: 1, transform: 'scale(1) translateY(0)', letterSpacing: '-0.025em' }
  ], { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });

  skipHint.animate([
    { opacity: 0 },
    { opacity: 0.55 }
  ], { delay: 260, duration: 320, fill: 'forwards' });

  let flightAnimation = null;
  let flapFrame = null;
  let tFlight = null;
  let finished = false;

  // 2. Pulso de energia antes da metamorfose (560ms - 820ms)
  const tEnergy = setTimeout(() => {
    halo.animate([
      { opacity: 0.9, transform: 'translate(-50%, -50%) scale(1.05)' },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1.22)' }
    ], { duration: 260, fill: 'forwards', easing: 'ease-out' });

    greeting.animate([
      { transform: 'scale(1)', filter: 'drop-shadow(0 0 10px rgba(216, 190, 255, 0.65)) drop-shadow(0 0 26px rgba(169, 162, 195, 0.45))' },
      { transform: 'scale(1.06)', filter: 'drop-shadow(0 0 20px #ffffff) drop-shadow(0 0 36px rgba(216, 190, 255, 0.95)) drop-shadow(0 0 54px rgba(189, 76, 255, 0.7))' }
    ], { duration: 260, fill: 'forwards', easing: 'ease-out' });
  }, 560);

  // 3. METAMORFOSE: texto se desfaz em dupla onda de choque + faíscas e surge o morcego (820ms)
  const tMorph = setTimeout(() => {
    shockwave.animate([
      { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(6.5)', opacity: 0 }
    ], { duration: 480, easing: 'ease-out', fill: 'forwards' });

    shockwave2.animate([
      { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0.85 },
      { transform: 'translate(-50%, -50%) scale(8.2)', opacity: 0 }
    ], { delay: 65, duration: 540, easing: 'ease-out', fill: 'forwards' });

    emitMorphSparks();

    halo.animate([
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1.22)' },
      { opacity: 0, transform: 'translate(-50%, -50%) scale(1.8)' }
    ], { duration: 320, fill: 'forwards' });

    tag.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-10px) scale(0.85)' }
    ], { duration: 180, fill: 'forwards', easing: 'ease-in' });

    skipHint.animate([
      { opacity: 0.55 },
      { opacity: 0 }
    ], { duration: 180, fill: 'forwards' });

    greeting.animate([
      { opacity: 1, transform: 'scale(1.06)' },
      { opacity: 0, transform: 'scale(0.35) rotate(2deg)', filter: 'blur(12px)' }
    ], { duration: 200, fill: 'forwards', easing: 'ease-in' });

    // Morcego surge no lugar do texto
    flyingBat.animate([
      { transform: pose(0, 0, 0, 0.25), opacity: 0 },
      { transform: pose(0, 0, 0, 1.1), opacity: 1, offset: 0.65 },
      { transform: pose(0, 0, 0, 1.0), opacity: 1 }
    ], { duration: 260, fill: 'forwards', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });

    // Bater de asas orgânico com dobra horizontal durante o voo
    let flightStart = performance.now();
    function flapFlying(now) {
      const flightElapsed = now - flightStart;
      const p = (flightElapsed * Math.PI * 2) / 430;
      const inner = organicStroke(p);
      const wrist = organicStroke(p - 0.28);
      const tip = organicStroke(p - 0.56);
      const tuck = Math.max(0, -tip) * 9 - Math.max(0, tip) * 3;

      const lWristX = (115 + tuck * 0.35).toFixed(2);
      const rWristX = (325 - tuck * 0.35).toFixed(2);
      const wristY = (141 + inner * 14).toFixed(2);

      const lTipX = (32 + tuck).toFixed(2);
      const rTipX = (408 - tuck).toFixed(2);
      const tipY = (146 + tip * 27).toFixed(2);

      const lElbowX = (47 + tuck * 0.72).toFixed(2);
      const rElbowX = (393 - tuck * 0.72).toFixed(2);
      const elbowY = (98 + wrist * 24).toFixed(2);

      const lPeakX = (106 + tuck * 0.35).toFixed(2);
      const rPeakX = (334 - tuck * 0.35).toFixed(2);
      const peakY = (31 + inner * 20).toFixed(2);

      const qY = (100 + wrist * 19).toFixed(2);
      const cY = (114 + inner * 9).toFixed(2);

      if (flyingSilhouette) {
        flyingSilhouette.setAttribute('d', `M220 192
          C182 148 150 ${cY} ${lWristX} ${wristY}
          Q92 ${qY} ${lTipX} ${tipY}
          L${lElbowX} ${elbowY} L${lPeakX} ${peakY} L179 78 L184 32 L202 56
          H238 L256 32 L261 78 L${rPeakX} ${peakY} L${rElbowX} ${elbowY} L${rTipX} ${tipY}
          Q348 ${qY} ${rWristX} ${wristY}
          C290 ${cY} 258 148 220 192Z`);
      }
      if (flyingTrail) {
        const downVel = Math.max(0, Math.cos(p - 0.56));
        const tipNum = Number(tipY);
        const elbowNum = Number(elbowY);
        flyingTrail.setAttribute('d', `M${(Number(lTipX) - 10).toFixed(1)} ${(tipNum + 7).toFixed(1)} Q${Number(lTipX).toFixed(1)} ${((tipNum + elbowNum) / 2).toFixed(1)} ${(Number(lElbowX) - 6).toFixed(1)} ${(elbowNum - 3).toFixed(1)}
          M${(Number(rTipX) + 10).toFixed(1)} ${(tipNum + 7).toFixed(1)} Q${Number(rTipX).toFixed(1)} ${((tipNum + elbowNum) / 2).toFixed(1)} ${(Number(rElbowX) + 6).toFixed(1)} ${(elbowNum - 3).toFixed(1)}`);
        flyingTrail.setAttribute('opacity', (0.2 + downVel * 0.55).toFixed(2));
      }
      flapFrame = requestAnimationFrame(flapFlying);
    }
    flapFrame = requestAnimationFrame(flapFlying);

    // 4. VOO ATÉ O SLOT DO HEADER (1120ms, duração 950ms)
    tFlight = setTimeout(() => {
      const arc = Math.min(innerWidth * 0.12, 75);

      flightAnimation = flyingBat.animate([
        { transform: pose(0, 0, 0, 1.0), offset: 0 },
        { transform: pose(deltaX * 0.28, deltaY * 0.18 + 22, bankAngle * 0.7, 1 - (1 - finalScale) * 0.25), offset: 0.26, easing: 'ease-out' },
        { transform: pose(deltaX * 0.72 - (deltaX < 0 ? arc : -arc), deltaY * 0.62, bankAngle, 1 - (1 - finalScale) * 0.7), offset: 0.68, easing: 'ease-in-out' },
        { transform: pose(deltaX * 0.94, deltaY * 0.94, bankAngle * 0.2, finalScale * 1.03), offset: 0.92 },
        { transform: pose(deltaX, deltaY, 0, finalScale), offset: 1 }
      ], { duration: 950, fill: 'forwards', easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' });

      backdrop.animate([
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.42 },
        { opacity: 0, offset: 1 }
      ], { duration: 950, fill: 'forwards' });

      flightAnimation.finished.then(() => {
        const ripple = document.createElement('div');
        ripple.className = 'landing-ripple';
        companion.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);

        if (typeof window.triggerBatBurst === 'function') {
          window.triggerBatBurst(14);
        }

        document.body.classList.add('is-revealing');
        setTimeout(() => document.body.classList.remove('is-revealing'), 550);

        finish();
      }, () => {});
    }, 300);

  }, 820);

  // Garantia de desbloqueio mesmo se o navegador pausar animações em segundo plano
  const safetyTimer = setTimeout(finish, 3000);

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(tEnergy);
    clearTimeout(tMorph);
    clearTimeout(tFlight);
    clearTimeout(safetyTimer);
    if (flapFrame) cancelAnimationFrame(flapFrame);
    companion.classList.remove('is-arriving');
    layer.remove();
    removeEventListener('resize', finish);
    removeEventListener('scroll', finish);
    layer.removeEventListener('click', finish);
    motion.removeEventListener('change', finish);
  }

  // Permitir pular clicando em qualquer lugar ou rolando
  layer.addEventListener('click', finish);
  addEventListener('resize', finish, { once: true });
  addEventListener('scroll', finish, { once: true, passive: true });
  motion.addEventListener('change', finish, { once: true });
}

// Inicia a chegada
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', playBatArrival);
} else {
  playBatArrival();
}
