// fx.js - Spotlight nos Cards, Clipboard e Toasts

// Notificação integrada na Dynamic Island (com fallback para Toast)
window.showToast = function(message, duration = 2400) {
  const island = document.getElementById('dynamic-island');
  const islandText = document.getElementById('island-alert-text');

  if (island && islandText) {
    islandText.textContent = message;
    island.classList.add('is-notifying');

    clearTimeout(island._timeout);
    island._timeout = setTimeout(() => {
      island.classList.remove('is-notifying');
    }, duration);
    return;
  }

  let toast = document.getElementById('asterx-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'asterx-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="toast-sparkle">✦</span> <span>${message}</span>`;
  toast.classList.add('visible');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
};

// Copiar texto para o clipboard com suporte retroativo
window.copyToClipboard = async function(text, label = 'Copiado!') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    window.showToast(label);
  } catch (err) {
    window.showToast('Erro ao copiar!');
  }
};

// Destaques / Stories Interativos (Estilo Instagram Dark Cyber)
const STORIES_DATA = [
  {
    title: 'E-book ASTERX',
    badge: 'Lançamento',
    sub: 'Guia Exclusivo & Estratégias',
    desc: 'O método completo para quem busca evolução rápida, estética dark e alta performance. Conteúdo direto ao ponto.',
    icon: `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h6"/></svg>`,
    btnText: 'Ver E-book no Site',
    action: () => scrollToCard('card-ebook', 'E-book ASTERX em destaque!')
  },
  {
    title: 'Ofertas & Cupons',
    badge: 'Descontos',
    sub: 'Links com Preço Especial',
    desc: 'Acesse promoções imperdíveis e use cupons exclusivos para economizar nas melhores plataformas e parceiros.',
    icon: `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>`,
    btnText: 'Conferir Ofertas',
    action: () => scrollToCard('card-ofertas', 'Cupons e ofertas selecionadas!')
  },
  {
    title: 'Setup & Afiliados',
    badge: 'Equipamentos',
    sub: 'Setup Oficial Recomendado',
    desc: 'Todos os periféricos, hardware, áudio e ferramentas que utilizo no meu dia a dia com links diretos com desconto.',
    icon: `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    btnText: 'Ver Setup & Afiliados',
    action: () => scrollToCard('card-ofertas', 'Setup e periféricos do ASTERX!')
  },
  {
    title: 'Morcego ASTERX',
    badge: 'Interativo',
    sub: 'Arte Vetorial & Física',
    desc: 'Morcego interativo com física de voo em Bézier, rastro de partículas e cambalhota acrobática em 360°.',
    icon: `<svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor"><path d="M12 5.5c-1.8 1.8-4.5 3-7.5 3C2 8.5 1 10 1 12c3.2.8 5.2 2.8 6.2 5.8 1-1.4 2.4-2.3 4.8-2.3s3.8.9 4.8 2.3c1-3 3-5 6.2-5.8 0-2-1-3.5-3.5-3.5-3 0-5.7-1.2-7.5-3z"/></svg>`,
    btnText: 'Abrir Simulador Completo',
    action: () => { window.location.href = 'morcego.html'; }
  },
  {
    title: 'Comunidade Discord',
    badge: 'asterx_',
    sub: 'Conexões & Parcerias',
    desc: 'Conecte-se diretamente, faça parcerias e acompanhe os próximos projetos do ecossistema ASTERX.',
    icon: `<svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
    btnText: 'Copiar Tag Discord',
    action: () => copyToClipboard('asterx_', 'Tag do Discord copiada!')
  }
];

let currentStoryIdx = 0;
let storyTimer = null;
const STORY_DURATION = 4600; // 4.6s por story

window.scrollToCard = function(id, toastMsg) {
  window.closeStoryModal();
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('card-highlight');
      setTimeout(() => el.classList.remove('card-highlight'), 1800);
    }
    if (toastMsg) window.showToast(toastMsg);
  }, 180);
};

window.openStory = function(idx) {
  currentStoryIdx = typeof idx === 'number' ? idx : 0;
  const modal = document.getElementById('story-modal');
  if (!modal) return;

  modal.classList.add('is-active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  renderStoryBars();
  showCurrentStory();

  document.addEventListener('keydown', handleStoryKey);
};

window.closeStoryModal = function() {
  const modal = document.getElementById('story-modal');
  if (!modal) return;

  modal.classList.remove('is-active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  clearTimeout(storyTimer);

  document.removeEventListener('keydown', handleStoryKey);
};

window.nextStory = function() {
  if (currentStoryIdx < STORIES_DATA.length - 1) {
    currentStoryIdx++;
    showCurrentStory();
  } else {
    window.closeStoryModal();
  }
};

window.prevStory = function() {
  if (currentStoryIdx > 0) {
    currentStoryIdx--;
    showCurrentStory();
  }
};

function handleStoryKey(e) {
  if (e.key === 'Escape') window.closeStoryModal();
  if (e.key === 'ArrowRight') window.nextStory();
  if (e.key === 'ArrowLeft') window.prevStory();
}

function renderStoryBars() {
  const barsContainer = document.getElementById('story-bars');
  if (!barsContainer) return;
  barsContainer.innerHTML = STORIES_DATA.map((_, i) => `
    <div class="story-bar"><div class="story-bar-fill" id="story-bar-${i}"></div></div>
  `).join('');
}

function showCurrentStory() {
  clearTimeout(storyTimer);
  const data = STORIES_DATA[currentStoryIdx];
  if (!data) return;

  const body = document.getElementById('story-body');
  if (body) {
    body.innerHTML = `
      <div class="story-body-icon">${data.icon}</div>
      <span class="story-body-sub">${data.badge} • ${data.sub}</span>
      <h3 class="story-body-title">${data.title}</h3>
      <p class="story-body-desc">${data.desc}</p>
      <button type="button" class="story-body-btn" id="story-cta-btn">
        <span>${data.btnText}</span>
        <span aria-hidden="true">→</span>
      </button>
    `;

    const ctaBtn = document.getElementById('story-cta-btn');
    if (ctaBtn) {
      ctaBtn.onclick = (e) => {
        e.stopPropagation();
        data.action();
      };
    }
  }

  // Atualiza as barras de progresso
  STORIES_DATA.forEach((_, i) => {
    const fill = document.getElementById(`story-bar-${i}`);
    if (!fill) return;
    if (i < currentStoryIdx) {
      fill.style.transition = 'none';
      fill.style.width = '100%';
    } else if (i > currentStoryIdx) {
      fill.style.transition = 'none';
      fill.style.width = '0%';
    } else {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      // Força reflow para disparar animação CSS
      void fill.offsetWidth;
      fill.style.transition = `width ${STORY_DURATION}ms linear`;
      fill.style.width = '100%';
    }
  });

  storyTimer = setTimeout(() => {
    window.nextStory();
  }, STORY_DURATION);
}

// Efeito Spotlight nas bordas dos cards (segue o cursor e o toque)
function initFx() {
  const cardsContainer = document.querySelector('.cards');
  const canHoverFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (cardsContainer && canHoverFine) {
    const updateCardCoords = (clientX, clientY) => {
      const cards = cardsContainer.querySelectorAll('.card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    cardsContainer.addEventListener('mousemove', (e) => {
      updateCardCoords(e.clientX, e.clientY);
    });
  }

  // Player de Música Ambiente (faixa já recortada em public/my-eyes.mp3)
  const bgm = document.getElementById('bgm');
  const audioBtn = document.getElementById('audio-toggle');
  const musicCard = document.getElementById('music-card');
  const musicCardSub = document.getElementById('music-card-sub');
  let fadeTimer = null;
  let audioMissing = false;
  let hasStartedOnce = false;

  if (bgm) {
    bgm.volume = 0;

    bgm.addEventListener('error', () => {
      audioMissing = true;
      updateMusicUI(false);
    });

    function updateMusicUI(playing) {
      if (audioBtn) audioBtn.classList.toggle('is-playing', playing);
      if (musicCard) musicCard.classList.toggle('is-playing', playing);
      if (musicCardSub) {
        musicCardSub.textContent = playing
          ? 'Travis Scott — MY EYES • Clique para pausar'
          : 'Travis Scott — MY EYES • Clique para tocar';
      }
    }

    function fadeInAudio(targetVol = 0.45, duration = 1400) {
      clearInterval(fadeTimer);
      const startVol = bgm.volume;
      const steps = 28;
      const stepTime = duration / steps;
      const stepDelta = (targetVol - startVol) / steps;
      let currentStep = 0;

      fadeTimer = setInterval(() => {
        currentStep++;
        const nextVol = Math.min(targetVol, Math.max(0, startVol + stepDelta * currentStep));
        bgm.volume = nextVol;
        if (currentStep >= steps) {
          clearInterval(fadeTimer);
        }
      }, stepTime);
    }

    async function startMusic(showHint = true) {
      if (audioMissing) return false;
      try {
        await bgm.play();
        hasStartedOnce = true;
        fadeInAudio(0.45, 1400);
        updateMusicUI(true);
        if (showHint) {
          window.showToast('Tocando MY EYES • Pause no topo ou no card', 3400);
        }
        return true;
      } catch (err) {
        return false;
      }
    }

    window.toggleMusic = async function() {
      if (audioMissing) {
        window.showToast('Coloque my-eyes.mp3 na pasta');
        return;
      }
      if (!bgm.paused) {
        clearInterval(fadeTimer);
        bgm.pause();
        updateMusicUI(false);
        window.showToast('Música pausada');
      } else {
        const ok = await startMusic(true);
        if (!ok) window.showToast('Clique novamente para tocar');
      }
    };

    // Tenta iniciar automaticamente ao entrar (caso o navegador permita)
    startMusic(true).then((played) => {
      if (played) return;

      // Dica após a abertura se o navegador bloqueou autoplay sem clique
      const promptTimer = setTimeout(() => {
        if (!hasStartedOnce && !audioMissing && bgm.paused) {
          window.showToast('Toque na tela para ouvir MY EYES', 3200);
        }
      }, 2600);

      // Inicia automaticamente no primeiro clique/toque/tecla em qualquer lugar
      const unlockAudio = async (e) => {
        if (audioBtn && audioBtn.contains(e.target)) return;
        if (musicCard && musicCard.contains(e.target)) return;
        if (hasStartedOnce || audioMissing) {
          cleanupUnlock();
          return;
        }
        const ok = await startMusic(true);
        if (ok) cleanupUnlock();
      };

      const cleanupUnlock = () => {
        clearTimeout(promptTimer);
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      };

      document.addEventListener('pointerdown', unlockAudio);
      document.addEventListener('keydown', unlockAudio);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFx);
} else {
  initFx();
}
