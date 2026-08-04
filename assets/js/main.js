document.addEventListener('DOMContentLoaded', () => {
  /* Apply the saved/default language before anything below reads text
     content (e.g. the typewriter setup caches each heading's text). */
  let savedLang = 'EN';
  try { savedLang = localStorage.getItem('codutti_lang') || 'EN'; } catch (e) {}
  if (window.applyLanguage) window.applyLanguage(savedLang);

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

  /* Hero video: force-start on load. The muted/autoplay/playsinline attributes
     usually suffice, but some browsers only honour autoplay once the muted
     property is also set at runtime — this makes the first play attempt
     explicit instead of relying on the attribute alone, and retries once on
     the first user interaction if the browser still blocked it. */
  const heroVideo = document.querySelector('.hero-stage__video');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.playsInline = true;
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    heroVideo.addEventListener('loadedmetadata', tryPlay, { once: true });
    heroVideo.addEventListener('canplay', tryPlay, { once: true });
    const retryOnInteraction = () => {
      if (heroVideo.paused) tryPlay();
      window.removeEventListener('pointerdown', retryOnInteraction);
      window.removeEventListener('keydown', retryOnInteraction);
    };
    window.addEventListener('pointerdown', retryOnInteraction, { once: true });
    window.addEventListener('keydown', retryOnInteraction, { once: true });
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
    const savedLangItem = langOverlay.querySelector(`.lang-overlay__item[data-lang="${savedLang}"]`);
    if (savedLangItem) {
      langOverlay.querySelectorAll('.lang-overlay__item').forEach((el) => el.classList.remove('is-active'));
      savedLangItem.classList.add('is-active');
      langBtn.textContent = savedLang;
    }
    langOverlay.querySelectorAll('.lang-overlay__item').forEach((item) => {
      item.addEventListener('click', () => {
        langOverlay.querySelectorAll('.lang-overlay__item').forEach((el) => el.classList.remove('is-active'));
        item.classList.add('is-active');
        langBtn.textContent = item.dataset.lang;
        if (window.applyLanguage) window.applyLanguage(item.dataset.lang);
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
      const words = Array.from(stage.querySelectorAll('.vs-word')).map((el) => {
        if (!el.dataset.fullText) el.dataset.fullText = el.textContent;
        return { el };
      });
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
        const text = item.el.dataset.fullText || '';
        let ci = 0;
        item.el.classList.add('is-typing');
        if (s.cursor) item.el.classList.add('has-cursor');
        const timer = setInterval(() => {
          ci++;
          item.el.textContent = text.slice(0, ci);
          if (ci >= text.length) {
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
      /* Do nothing at all until the section actually reaches its pinned position
         (rect.top <= 0) — otherwise stage 0 (heading typing, background colour)
         would already be applied while still scrolling toward it, so there'd be
         no visible transition: it would just already be green/typed on arrival. */
      if (rect.top > 0) {
        /* Above the section: make sure the header never stays stuck on a
           stage colour picked up before scrolling back up past it. */
        if (visionSection.classList.contains('collections-scroll')) {
          header.classList.remove('is-on-essential', 'is-on-executive');
        }
        return;
      }
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
        stage.querySelectorAll('.vs-word, .vs-body, .vs-meta, .vs-cta').forEach((el) => {
          const order = Number(el.dataset.order);
          const visible = i < currentStage || (i === currentStage && order <= visibleIndex);
          el.classList.toggle('is-visible', visible);
        });
      });
      bgLayers.forEach((layer) => {
        layer.classList.toggle('is-active', Number(layer.dataset.bg) === currentStage);
      });

      if (currentStage !== twLastStage) {
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

  /* News page: reveal the full news grid on button click */
  const newsMoreToggle = document.getElementById('newsMoreToggle');
  const newsMoreGrid = document.getElementById('newsMoreGrid');
  if (newsMoreToggle && newsMoreGrid) {
    newsMoreToggle.addEventListener('click', () => {
      const isHidden = newsMoreGrid.hasAttribute('hidden');
      newsMoreGrid.toggleAttribute('hidden', !isHidden);
      newsMoreToggle.textContent = isHidden
        ? newsMoreToggle.dataset.labelLess
        : newsMoreToggle.dataset.labelMore;
    });
  }

  /* Category page: showcase CTA cycles through collection names with a typewriter effect */
  document.querySelectorAll('.line-showcase__btn').forEach((btn) => {
    let items;
    try { items = JSON.parse(btn.dataset.items || '[]'); } catch (e) { items = []; }
    if (!items.length) return;
    const textEl = btn.querySelector('.line-showcase__btn-text');
    let idx = 0;

    function typeText(text, cb) {
      let i = 0;
      const timer = setInterval(() => {
        i++;
        textEl.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(timer); if (cb) cb(); }
      }, 45);
    }
    function deleteText(cb) {
      const timer = setInterval(() => {
        const current = textEl.textContent;
        textEl.textContent = current.slice(0, -1);
        if (current.length <= 1) { clearInterval(timer); if (cb) cb(); }
      }, 25);
    }
    function showItem() {
      const item = items[idx];
      btn.href = item.href;
      typeText(`Discover the ${item.name} Collection`);
    }

    showItem();
    setInterval(() => {
      deleteText(() => {
        idx = (idx + 1) % items.length;
        showItem();
      });
    }, 20000);
  });

  /* Category page: full-bleed line stage — nothing shows until hover/click. */
  function initLineStage(sectionId, itemSelector, navigateOnClick) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    /* A modal-style preview (Our Collections) lives outside the section,
       as a direct child of body — position:fixed only centers on the true
       viewport when nothing between it and body has a CSS transform, and
       .reveal (the scroll-fade-in class on these sections) sets one. */
    const preview = document.getElementById(sectionId + '-preview') || section.querySelector('.line-stage__preview');
    const intro = section.querySelector('.line-stage__intro');
    const backdrop = document.getElementById(sectionId + '-backdrop');
    const titleEl = preview.querySelector('.line-stage__text h3');
    const descEl = preview.querySelector('.line-stage__text p');
    const linkEl = preview.querySelector('.line-stage__text a');
    const items = Array.from(section.querySelectorAll(itemSelector));
    if (!items.length) return;
    /* The active line's color takes over the whole page, not just this
       component. body covers the areas with no background of their own,
       but the Product Categories section and the Our Collections index
       strip both carry their own opaque background — so whichever stage
       is active must drive both of them directly, not only its own,
       otherwise the *other* one keeps showing through as a stray cream
       patch while the rest of the page has already turned taupe. Both
       stages on a given page share one prefix (e.g. "desk" for
       deskCategoryStage/deskCollectionsStage), so the sibling is derived
       from sectionId rather than hardcoded — each product page has its
       own pair of IDs. */
    const prefix = sectionId.replace(/(Category|Collections)Stage$/, '');
    const categorySection = document.getElementById(prefix + 'CategoryStage');
    const collectionsBand = document.querySelector('#' + prefix + 'CollectionsStage .vertical-menu-section');
    const header = document.querySelector('.site-header');
    const colorMap = { taupe: 'var(--taupe)', sage: 'var(--sage)', cream: 'var(--cream)' };
    /* Pages that are overwhelmingly one color (Seatings, Storage Units,
       Coffee Tables are mostly/all sage) show that color immediately on
       load instead of the neutral cream default, via a data-default-color
       attribute on the category section — read from there regardless of
       which stage instance this is, since both share the same section. */
    const defaultColor = (categorySection && colorMap[categorySection.dataset.defaultColor]) || '';

    /* On desktop the preview panel's layout space is reserved even while
       hidden (see CSS), so showing/hiding it never shifts the menu column —
       a shift there would move the hovered item out from under a
       stationary cursor. The intro copy (if any) sits behind the preview
       in the same slot and is covered whenever the preview is active.
       When a backdrop is present (Our Collections), the preview is a
       centered popup instead of an inline panel. */
    let current = null;
    function show(item) {
      current = item;
      items.forEach((i) => i.classList.toggle('is-active', i === item));
      const color = colorMap[item.dataset.color] || 'var(--cream)';
      document.body.style.backgroundColor = color;
      if (header) header.style.backgroundColor = color;
      if (categorySection) categorySection.style.backgroundColor = color;
      if (collectionsBand) collectionsBand.style.backgroundColor = color;
      preview.style.backgroundColor = color;
      if (titleEl) titleEl.textContent = item.dataset.title || '';
      descEl.textContent = item.dataset.desc || '';
      if (linkEl) linkEl.href = item.dataset.href || '#';
      preview.classList.add('is-visible');
      if (intro) intro.classList.add('is-covered');
      if (backdrop) backdrop.classList.add('is-visible');
    }
    function hide() {
      current = null;
      items.forEach((i) => i.classList.remove('is-active'));
      document.body.style.backgroundColor = defaultColor;
      if (header) header.style.backgroundColor = defaultColor;
      if (categorySection) categorySection.style.backgroundColor = defaultColor;
      if (collectionsBand) collectionsBand.style.backgroundColor = defaultColor;
      preview.style.backgroundColor = defaultColor;
      preview.classList.remove('is-visible');
      if (intro) intro.classList.remove('is-covered');
      if (backdrop) backdrop.classList.remove('is-visible');
    }
    hide();

    let pinned = null;
    items.forEach((item) => {
      const trigger = item.querySelector('button, a') || item;
      trigger.addEventListener('mouseenter', () => show(item));
      /* Moving fast from one item straight to the next can fire the old
         item's mouseleave after the new item's mouseenter (adjacent-element
         boundary quirk) — ignore it if something else has taken over since. */
      trigger.addEventListener('mouseleave', () => {
        if (current !== item) return;
        pinned ? show(pinned) : hide();
      });
      trigger.addEventListener('focus', () => show(item));
      trigger.addEventListener('blur', () => {
        if (current !== item) return;
        pinned ? show(pinned) : hide();
      });
      const togglePin = () => {
        /* Product Categories items go straight to their listing page instead
           of pinning the preview — the hover/focus preview above still gives
           a sneak peek, but the click/tap itself is the "go" action, not a
           second confirm step the user has to discover. */
        if (navigateOnClick) {
          if (item.dataset.href) window.location.href = item.dataset.href;
          return;
        }
        items.forEach((i) => i.classList.remove('is-pinned'));
        if (pinned === item) {
          pinned = null;
          hide();
        } else {
          pinned = item;
          item.classList.add('is-pinned');
          show(item);
        }
      };
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        togglePin();
      });
      /* Touch devices synthesize mouseenter/mouseleave from a tap's hit-test
         before dispatching "click" — on a writing-mode:vertical-rl rotated
         element that synthesis can flicker (enter, leave, enter, leave) and
         drop the click entirely. touchend always fires reliably, so handle
         the tap directly here and suppress the unreliable synthetic mouse
         sequence that would otherwise follow it. */
      trigger.addEventListener('touchend', (e) => {
        e.preventDefault();
        togglePin();
      });
    });

    /* The backdrop is pointer-events:none (see CSS) so it never swallows
       hover as the cursor crosses it to reach another item — clicking
       anywhere outside the popup and the index itself dismisses a pin. */
    if (backdrop) {
      document.addEventListener('click', (e) => {
        if (!pinned) return;
        if (preview.contains(e.target) || section.contains(e.target)) return;
        items.forEach((i) => i.classList.remove('is-pinned'));
        pinned = null;
        hide();
      });
    }
  }
  initLineStage('deskCategoryStage', '.line-menu__item', true);
  initLineStage('deskCollectionsStage', '.vertical-menu__item');
  initLineStage('tablesCategoryStage', '.line-menu__item', true);
  initLineStage('tablesCollectionsStage', '.vertical-menu__item');
  initLineStage('seatingsCategoryStage', '.line-menu__item', true);
  initLineStage('coffeeCategoryStage', '.line-menu__item', true);
  initLineStage('coffeeCollectionsStage', '.vertical-menu__item');
  initLineStage('storageCategoryStage', '.line-menu__item', true);
  initLineStage('storageCollectionsStage', '.vertical-menu__item');
  initLineStage('receptionsCategoryStage', '.line-menu__item', true);
  initLineStage('acousticCategoryStage', '.line-menu__item', true);

  /* The page always ends in the black footer, but html/body default to
     cream — on an elastic/rubber-band overscroll past the bottom edge that
     exposes cream instead of black, breaking the illusion that the page
     has entered a black section. Swap html's background to match only
     once the footer is actually the thing on screen. */
  if (document.querySelector('.site-footer')) {
    const setOverscrollColor = () => {
      const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      document.documentElement.style.backgroundColor = nearBottom ? 'var(--black)' : '';
    };
    window.addEventListener('scroll', setOverscrollColor, { passive: true });
    setOverscrollColor();
  }

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

  /* Product-listing pages: clicking a product box opens a single shared
     curtain panel below the grid with that product's name, description and
     a Configure button — fixed in place (not a popup), re-draping with new
     content if a different box is clicked, closing if the same box is
     clicked again. */
  document.querySelectorAll('.product-grid--listing').forEach((grid) => {
    const panel = grid.parentElement.querySelector('.product-detail-panel');
    if (!panel) return;
    const titleEl = panel.querySelector('.product-detail-panel__title');
    const descEl = panel.querySelector('.product-detail-panel__desc');
    let activeBox = null;
    grid.querySelectorAll('.product-box--listing').forEach((box) => {
      box.addEventListener('click', () => {
        if (activeBox === box) {
          activeBox.classList.remove('is-active');
          activeBox = null;
          panel.classList.remove('is-open');
          return;
        }
        if (activeBox) activeBox.classList.remove('is-active');
        activeBox = box;
        box.classList.add('is-active');
        if (titleEl) titleEl.textContent = box.dataset.name || '';
        if (descEl) descEl.textContent = box.dataset.desc || '';
        panel.classList.add('is-open');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  });

});
