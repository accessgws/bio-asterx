// arrival.js - Abertura Cinematográfica: Boas-Vindas, Metamorfose em Morcego e Voo até o Header

function playBatArrival() {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || typeof Element.prototype.animate !== 'function') return;

  const companion = document.querySelector('.companion');
  if (!companion) return;

  const original = companion.querySelector('.bat-svg') || companion.querySelector('svg');
  if (!original) return;

  // Palco de animação de tela cheia
  const layer = document.createElement('div');
  layer.className = 'arrival';
  layer.setAttribute('aria-hidden', 'true');
  layer.title = 'Clique para pular introdução';

  const backdrop = document.createElement('div');
  backdrop.className = 'arrival-backdrop';

  // Container Central de Boas-Vindas
  const centerBox = document.createElement('div');
  centerBox.className = 'arrival-center';

  const greeting = document.createElement('h1');
  greeting.className = 'arrival-greeting';
  greeting.textContent = 'Bem-vindo';

  const shockwave = document.createElement('div');
  shockwave.className = 'arrival-shockwave';

  centerBox.append(greeting, shockwave);
  layer.append(backdrop, centerBox);
  document.body.append(layer);
  companion.classList.add('is-arriving');

  // Posição exata do centro da tela / texto de boas-vindas
  const greetingRect = greeting.getBoundingClientRect();
  const centerX = greetingRect.left + greetingRect.width / 2;
  const centerY = greetingRect.top + greetingRect.height / 2;

  // Medição exata do slot de destino (.companion no header)
  const targetRect = original.getBoundingClientRect();
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  // Dimensões do morcego no centro (imponente e majestoso)
  const batWidth = Math.min(innerWidth * 0.78, 380);
  const batHeight = batWidth * (250 / 440);
  const batLeft = centerX - batWidth / 2;
  const batTop = centerY - batHeight / 2;

  // Escala final quando pousar no pedestal do header
  const finalScale = targetRect.width / batWidth;
  const deltaX = targetCenterX - centerX;
  const deltaY = targetCenterY - centerY;
  const bankAngle = deltaX < 0 ? -14 : 14;

  // Morcego Voador (Clonado do vetor original)
  const flyingBat = original.cloneNode(true);
  flyingBat.className = 'arrival-bat';
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

  // 1. Entrada suave do texto "Bem-vindo" (0 - 650ms)
  greeting.animate([
    { opacity: 0, transform: 'scale(0.9) translateY(10px)' },
    { opacity: 1, transform: 'scale(1) translateY(0)' }
  ], { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });

  // 2. Acúmulo de energia vibrante nas boas-vindas com brilho cromado/metálico (750ms - 1050ms)
  setTimeout(() => {
    greeting.animate([
      { transform: 'scale(1)', filter: 'drop-shadow(0 0 8px rgba(216, 190, 255, 0.75)) drop-shadow(0 0 22px rgba(169, 162, 195, 0.5))' },
      { transform: 'scale(1.06)', filter: 'drop-shadow(0 0 20px #ffffff) drop-shadow(0 0 35px rgba(216, 190, 255, 0.95)) drop-shadow(0 0 50px rgba(189, 76, 255, 0.6))' }
    ], { duration: 300, fill: 'forwards', easing: 'ease-out' });
  }, 750);

  let flightAnimation = null;
  let flapFrame = null;

  // 3. A METAMORFOSE: O TEXTO EXPLODE E O MORCEGO SURGE NO LUGAR (1050ms)
  setTimeout(() => {
    // Onda de choque circular
    shockwave.animate([
      { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(6.5)', opacity: 0 }
    ], { duration: 500, easing: 'ease-out', fill: 'forwards' });

    // O texto se dissolve em luz
    greeting.animate([
      { opacity: 1, transform: 'scale(1.06)' },
      { opacity: 0, transform: 'scale(0.3) rotate(3deg)', filter: 'blur(12px)' }
    ], { duration: 220, fill: 'forwards', easing: 'ease-in' });

    // O Morcego surge EXATAMENTE onde o texto estava
    flyingBat.animate([
      { transform: pose(0, 0, 0, 0.25), opacity: 0 },
      { transform: pose(0, 0, 0, 1.12), opacity: 1, offset: 0.65 },
      { transform: pose(0, 0, 0, 1.0), opacity: 1 }
    ], { duration: 300, fill: 'forwards', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });

    // Batimento rápido e fluido das asas durante o voo
    let flightStart = performance.now();
    function flapFlying(now) {
      const flightElapsed = now - flightStart;
      const beat = Math.sin(flightElapsed * 2 * Math.PI / 460);
      const wingY = (y, amp) => (y + beat * amp).toFixed(2);

      if (flyingSilhouette) {
        flyingSilhouette.setAttribute('d', `M220 192
          C182 148 150 ${wingY(114, 10)} 115 ${wingY(141, 16)}
          Q92 ${wingY(100, 22)} 32 ${wingY(146, 30)}
          L47 ${wingY(98, 28)} L106 ${wingY(31, 24)} L179 78 L184 32 L202 56
          H238 L256 32 L261 78 L334 ${wingY(31, 24)} L393 ${wingY(98, 28)} L408 ${wingY(146, 30)}
          Q348 ${wingY(100, 22)} 325 ${wingY(141, 16)}
          C290 ${wingY(114, 10)} 258 148 220 192Z`);
      }
      if (flyingTrail) {
        flyingTrail.setAttribute('opacity', (.45 * Math.abs(beat)).toFixed(2));
      }
      flapFrame = requestAnimationFrame(flapFlying);
    }
    flapFrame = requestAnimationFrame(flapFlying);

    // 4. VOO DO MORCEGO ATÉ O SEU LUGAR NO HEADER (1420ms)
    setTimeout(() => {
      const arc = Math.min(innerWidth * 0.12, 75);

      flightAnimation = flyingBat.animate([
        { transform: pose(0, 0, 0, 1.0), offset: 0 },
        { transform: pose(deltaX * 0.28, deltaY * 0.18 + 24, bankAngle * 0.7, 1 - (1 - finalScale) * 0.25), offset: 0.26, easing: 'ease-out' },
        { transform: pose(deltaX * 0.72 - (deltaX < 0 ? arc : -arc), deltaY * 0.62, bankAngle, 1 - (1 - finalScale) * 0.7), offset: 0.68, easing: 'ease-in-out' },
        { transform: pose(deltaX * 0.94, deltaY * 0.94, bankAngle * 0.2, finalScale * 1.03), offset: 0.92 },
        { transform: pose(deltaX, deltaY, 0, finalScale), offset: 1 }
      ], { duration: 1050, fill: 'forwards', easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' });

      // O fundo escuro se desfaz revelando a página
      backdrop.animate([
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.45 },
        { opacity: 0, offset: 1 }
      ], { duration: 1050, fill: 'forwards' });

      flightAnimation.finished.then(() => {
        // Impacto do pouso: anel de luz neon no pedestal do avatar
        const ripple = document.createElement('div');
        ripple.className = 'landing-ripple';
        companion.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);

        finish();
      }, () => {});
    }, 370);

  }, 1050);

  function finish() {
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
