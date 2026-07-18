document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  const navOverlay = document.querySelector('.nav-overlay');
  const langBtn = document.querySelector('.lang-btn');
  const langOverlay = document.querySelector('.lang-overlay');
  const body = document.body;

  /* Header stays fixed/always cream+black; only its border-bottom appears once scrolled */
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Hero video: replay button */
  const heroVideo = document.querySelector('.hero-stage__video');
  const heroReplay = document.getElementById('heroReplay');
  if (heroVideo && heroReplay) {
    heroReplay.addEventListener('click', () => {
      heroVideo.currentTime = 0;
      heroVideo.play();
    });
  }

  /* Off-canvas menu toggle */
  if (menuBtn && navOverlay) {
    const closeMenu = () => {
      navOverlay.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      body.classList.remove('nav-open');
    };
    const openMenu = () => {
      navOverlay.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      body.classList.add('nav-open');
    };
    menuBtn.addEventListener('click', () => {
      const isOpen = navOverlay.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });
    navOverlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* Language overlay toggle */
  if (langBtn && langOverlay) {
    const closeLang = () => {
      langOverlay.classList.remove('is-open');
      langBtn.setAttribute('aria-expanded', 'false');
      body.classList.remove('lang-open');
    };
    const openLang = () => {
      langOverlay.classList.add('is-open');
      langBtn.setAttribute('aria-expanded', 'true');
      body.classList.add('lang-open');
    };
    langBtn.addEventListener('click', () => {
      const isOpen = langOverlay.classList.contains('is-open');
      isOpen ? closeLang() : openLang();
    });
    langOverlay.querySelectorAll('.lang-overlay__item').forEach((item) => {
      item.addEventListener('click', () => {
        langOverlay.querySelectorAll('.lang-overlay__item').forEach((el) => el.classList.remove('is-active'));
        item.classList.add('is-active');
        langBtn.textContent = item.dataset.lang;
        closeLang();
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLang();
    });
  }

  /* Reveal on scroll */
  const revealTargets = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
  );
  revealTargets.forEach((el) => io.observe(el));

  /* Duplicate marquee content for seamless loop */
  document.querySelectorAll('.marquee__track').forEach((track) => {
    track.innerHTML += track.innerHTML;
  });

  /* Pinned scroll-reveal sections (Vision/Mission/Values, Essential/Operative/Executive) */
  document.querySelectorAll('.vision-scroll').forEach((visionSection) => {
    const stages = Array.from(visionSection.querySelectorAll('.vs-stage'));
    const bgLayers = Array.from(visionSection.querySelectorAll('.collections-scroll__bg'));
    const subCount = 3;

    /* Typewriter reveal for headings only, on every pinned-scroll section.
       Body copy keeps the original scroll-linked blur/fade reveal below.
       Headings type with no cursor ("macchina da scrivere"), except the
       Executive stage which types with a blinking cursor ("scrittura computer"). */
    visionSection.classList.add('is-typewriter');
    const twStages = stages.map((stage, i) => {
      const words = Array.from(stage.querySelectorAll('.vs-word')).map((el) => ({ el, text: el.textContent }));
      words.forEach((w) => { w.el.textContent = ''; });
      const cursor = visionSection.id === 'essential' && i === 2;
      return { words, cursor, started: false, timers: [] };
    });
    let twLastStage = -1;
    const twReset = (s) => {
      s.timers.forEach((t) => clearInterval(t));
      s.timers = [];
      s.started = false;
      s.words.forEach((w) => { w.el.textContent = ''; w.el.classList.remove('has-cursor'); });
    };
    const twPlay = (s) => {
      if (s.started) return;
      s.started = true;
      const queue = [...s.words];
      let qi = 0;
      const typeNext = () => {
        if (qi >= queue.length) return;
        const item = queue[qi];
        let ci = 0;
        item.el.classList.add('is-typing');
        if (s.cursor) item.el.classList.add('has-cursor');
        const timer = setInterval(() => {
          ci++;
          item.el.textContent = item.text.slice(0, ci);
          if (ci >= item.text.length) {
            clearInterval(timer);
            item.el.classList.remove('is-typing');
            item.el.classList.remove('has-cursor');
            qi++;
            typeNext();
          }
        }, 38);
        s.timers.push(timer);
      };
      typeNext();
    };

    const updateVision = () => {
      const rect = visionSection.getBoundingClientRect();
      const total = visionSection.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      let progress = -rect.top / total;
      progress = Math.max(0, Math.min(1, progress));

      const totalSteps = stages.length * subCount;
      let stepPos = progress * totalSteps;
      if (progress >= 1) stepPos = totalSteps - 0.001;
      const currentStage = Math.max(0, Math.min(stages.length - 1, Math.floor(stepPos / subCount)));
      const subProgress = stepPos - currentStage * subCount;
      const visibleIndex = Math.floor(subProgress);

      stages.forEach((stage, i) => {
        stage.classList.toggle('is-active', i === currentStage);
        stage.querySelectorAll('.vs-word, .vs-body, .vs-meta').forEach((el) => {
          const order = Number(el.dataset.order);
          const visible = i < currentStage || (i === currentStage && order <= visibleIndex);
          el.classList.toggle('is-visible', visible);
        });
      });
      bgLayers.forEach((layer) => {
        layer.classList.toggle('is-active', Number(layer.dataset.bg) === currentStage);
      });

      /* Only start typing once the section has actually scrolled into view —
         otherwise stage 0 would type itself out instantly while still off-screen,
         so by the time the user scrolls to it the heading is already fully typed. */
      const sectionInView = rect.top < window.innerHeight && rect.bottom > 0;
      if (sectionInView && currentStage !== twLastStage) {
        if (twLastStage !== -1 && twStages[twLastStage]) twReset(twStages[twLastStage]);
        if (twStages[currentStage]) twPlay(twStages[currentStage]);
        twLastStage = currentStage;
      }

      if (visionSection.classList.contains('collections-scroll')) {
        const inView = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
        header.classList.toggle('is-on-essential', inView && currentStage === 0);
        header.classList.toggle('is-on-executive', inView && currentStage === 2);
      }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateVision();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateVision);
    updateVision();
  });

  /* Last Updates: expand clamped card on click */
  document.querySelectorAll('.update-card').forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('is-expanded'));
  });

  /* Category tab bar: desktop arrow slider, scroll active item into view */
  document.querySelectorAll('.cat-tabs').forEach((tabs) => {
    const track = tabs.querySelector('.cat-tabs__track');
    const prev = tabs.querySelector('.cat-tabs__arrow--prev');
    const next = tabs.querySelector('.cat-tabs__arrow--next');
    if (!track) return;
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
    const active = track.querySelector('.is-active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  });

});
