document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  const navOverlay = document.querySelector('.nav-overlay');
  const langBtn = document.querySelector('.lang-btn');
  const langOverlay = document.querySelector('.lang-overlay');
  const body = document.body;

  /* Header background on scroll (header itself always stays fixed/visible) */
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

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

  /* Vision / Mission / Values: pinned scroll-reveal */
  const visionSection = document.querySelector('.vision-scroll');
  if (visionSection) {
    const stages = Array.from(visionSection.querySelectorAll('.vs-stage'));
    const subCount = 3; /* word 1, word 2, body */

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
        stage.querySelectorAll('.vs-word, .vs-body').forEach((el) => {
          const order = Number(el.dataset.order);
          const visible = i < currentStage || (i === currentStage && order <= visibleIndex);
          el.classList.toggle('is-visible', visible);
        });
      });
    };

    let visionTicking = false;
    window.addEventListener('scroll', () => {
      if (!visionTicking) {
        requestAnimationFrame(() => {
          updateVision();
          visionTicking = false;
        });
        visionTicking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateVision);
    updateVision();
  }

  /* News: stacked event boxes -> spread on interaction (tap on touch, hover on desktop) */
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  if (isTouchDevice) {
    document.querySelectorAll('.news-year-group__events').forEach((group) => {
      group.addEventListener('click', (e) => {
        if (!group.classList.contains('is-expanded')) {
          group.classList.add('is-expanded');
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });
  }

  /* News: year/event boxes -> fullscreen lightbox */
  const newsLightbox = document.getElementById('newsLightbox');
  const newsLightboxName = document.getElementById('newsLightboxName');
  const newsLightboxClose = document.getElementById('newsLightboxClose');
  if (newsLightbox && newsLightboxName) {
    const openLightbox = (name) => {
      newsLightboxName.textContent = name;
      newsLightbox.classList.add('is-open');
    };
    const closeLightbox = () => {
      newsLightbox.classList.remove('is-open');
    };
    document.querySelectorAll('.news-event-box').forEach((box) => {
      box.addEventListener('click', () => openLightbox(box.dataset.event));
    });
    if (newsLightboxClose) newsLightboxClose.addEventListener('click', closeLightbox);
    newsLightbox.addEventListener('click', (e) => {
      if (e.target === newsLightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* Last Updates: expand clamped card on click */
  document.querySelectorAll('.update-card').forEach((card) => {
    card.addEventListener('click', () => card.classList.toggle('is-expanded'));
  });

  /* Footer: reveal full team directory */
  const contactReveal = document.getElementById('contactReveal');
  const teamList = document.getElementById('teamList');
  if (contactReveal && teamList) {
    contactReveal.addEventListener('click', () => {
      const isOpen = teamList.classList.toggle('is-open');
      contactReveal.setAttribute('aria-expanded', String(isOpen));
      contactReveal.textContent = isOpen ? 'Hide All Contacts' : 'View All Contacts';
    });
  }
});
