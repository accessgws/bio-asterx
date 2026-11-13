// bat.js - Animação Completa do Morcego ASTERX Vetorial & Interativo

function initBatEngine() {
  const svg = document.querySelector('.bat-svg') || document.querySelector('#morcego-svg') || document.querySelector('svg[viewBox="0 0 440 250"]');
  if (!svg) return;

  const silhouette = svg.querySelector('#silhueta') || svg.querySelector('.bat-silhueta');
  const bat = svg.querySelector('#morcego') || svg.querySelector('.bat-corpo');
  const trail = svg.querySelector('#rastro') || svg.querySelector('.bat-rastro');
  const eyes = svg.querySelector('#olhos') || svg.querySelector('.bat-olhos');
  const shadow = svg.querySelector('#sombra') || svg.querySelector('.bat-sombra');

  if (!silhouette || !bat) return;

  // Garante camadas SVG para partículas de rastro e explosão (filtro único no grupo poupa GPU mobile)
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
  let elapsed = 0;
  let previous = null;
  let frame = null;

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

    targetEyeX = Math.max(-5.5, Math.min(5.5, dx * 0.028));
    targetEyeY = Math.max(-3.5, Math.min(3.5, dy * 0.024));
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
    }
  }, { passive: true });

  // Disparar explosão de faíscas ao clicar
  window.triggerBatBurst = function(count = 22) {
    const colors = ['#f7ddff', '#e084ff', '#bd4cff', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2.2 + Math.random() * 4.5;
      const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      elem.setAttribute('width', Math.random() > 0.5 ? '4' : '3');
      elem.setAttribute('height', Math.random() > 0.5 ? '4' : '3');
      elem.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)]);
      burstParticlesGroup.appendChild(elem);

      particles.push({
        elem,
        x: 220,
        y: 110,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        life: 0,
        maxLife: 26 + Math.random() * 18,
        gravity: 0.12
      });
    }
  };

  // Gerador de rastro de faíscas nas pontas das asas (cadência estável independente de Hz)
  let lastSparkTime = 0;
  function emitWingtipSparks(tipY, now) {
    if (particles.length >= 36 || (now - lastSparkTime) < 32) return;
    lastSparkTime = now;

    const colors = ['#f4cfff', '#d749ff', '#ba3eff'];
    const tips = [
      { x: 30, y: tipY + 4, vx: -0.6 },
      { x: 410, y: tipY + 4, vx: 0.6 }
    ];

    tips.forEach(pt => {
      if (Math.random() > 0.45) return;
      const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      elem.setAttribute('width', '2.5');
      elem.setAttribute('height', '2.5');
      elem.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)]);
      trailParticlesGroup.appendChild(elem);

      particles.push({
        elem,
        x: pt.x + (Math.random() - 0.5) * 6,
        y: pt.y + (Math.random() - 0.5) * 6,
        vx: pt.vx + (Math.random() - 0.5) * 0.5,
        vy: 0.8 + Math.random() * 1.2,
        life: 0,
        maxLife: 18 + Math.random() * 12,
        gravity: 0.04
      });
    });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life++;

      const progress = p.life / p.maxLife;
      if (progress >= 1 || p.x < 0 || p.x > 440 || p.y > 250) {
        if (p.elem && p.elem.parentNode) {
          p.elem.parentNode.removeChild(p.elem);
        }
        particles.splice(i, 1);
        continue;
      }

      p.elem.setAttribute('x', p.x.toFixed(1));
      p.elem.setAttribute('y', p.y.toFixed(1));
      p.elem.setAttribute('opacity', (1 - progress).toFixed(2));
    }
  }

  function draw(time, now) {
    const beat = Math.sin(time * 2 * Math.PI / 980);
    const lift = Math.sin(time * 2 * Math.PI / 1960);
    const wingY = (y, amplitude) => (y + beat * amplitude).toFixed(2);
    
    // Suavização do movimento dos olhos
    currentEyeX += (targetEyeX - currentEyeX) * 0.12;
    currentEyeY += (targetEyeY - currentEyeY) * 0.12;

    silhouette.setAttribute('d', `M220 192
      C182 148 150 ${wingY(114,8)} 115 ${wingY(141,13)}
      Q92 ${wingY(100,18)} 32 ${wingY(146,24)}
      L47 ${wingY(98,23)} L106 ${wingY(31,19)} L179 78 L184 32 L202 56
      H238 L256 32 L261 78 L334 ${wingY(31,19)} L393 ${wingY(98,23)} L408 ${wingY(146,24)}
      Q348 ${wingY(100,18)} 325 ${wingY(141,13)}
      C290 ${wingY(114,8)} 258 148 220 192Z`);
      
    const phase = time * 2 * Math.PI / 980;
    const lag = Math.sin(phase - .68);
    const tip = 146 + lag * 24;
    const elbow = 98 + lag * 23;
    
    // Rastro neon contínuo
    if (trail) {
      trail.setAttribute('d', `M22 ${tip + 6} Q24 ${(tip + elbow) / 2} 37 ${elbow - 3}
        M418 ${tip + 6} Q416 ${(tip + elbow) / 2} 403 ${elbow - 3}`);
      trail.setAttribute('opacity', (.58 * Math.abs(Math.cos(phase)) ** 2).toFixed(3));
    }

    // Emissão de faíscas ao bater as asas
    if (Math.abs(beat) > 0.3) {
      emitWingtipSparks(tip, now);
    }
    
    // Inclinação sutil em direção ao cursor + flutuação vertical
    const tilt = currentEyeX * 0.8;
    bat.setAttribute('transform', `translate(0 ${(-5 * lift).toFixed(2)}) rotate(${tilt.toFixed(2)} 220 120)`);
    
    if (shadow) {
      shadow.setAttribute('rx', (62 + 7 * lift).toFixed(2));
      shadow.setAttribute('opacity', (.55 - .1 * lift).toFixed(3));
    }
    
    // Olhos que piscam e olham para o cursor/dedo
    if (eyesGroup) {
      eyesGroup.setAttribute('transform', `translate(${currentEyeX.toFixed(2)} ${currentEyeY.toFixed(2)})`);
    }
    if (eyes) {
      eyes.setAttribute('opacity', (time % 3800 > 3690) ? '.18' : '1');
    }

    // Atualiza partículas ativas
    if (particles.length > 0) {
      updateParticles();
    }
  }

  let inViewport = true;

  function tick(now) {
    if (previous !== null) elapsed += Math.min(now - previous, 50);
    previous = now;
    draw(elapsed, now);
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

  // Clique no morcego para acrobacia 360 e faíscas
  const companion = svg.closest('.companion') || svg.closest('main') || svg.parentElement;
  if (companion) {
    companion.style.cursor = 'pointer';
    companion.addEventListener('click', () => {
      companion.classList.remove('do-flip');
      void companion.offsetWidth;
      companion.classList.add('do-flip');
      window.triggerBatBurst(24);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBatEngine);
} else {
  initBatEngine();
}
