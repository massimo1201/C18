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
      /* The off-canvas nav and the language overlay are mutually exclusive —
         closing the nav here (rather than leaving it open behind the
         language panel) keeps the header's menu icon in its plain
         three-line state instead of stuck showing the "X" from an
         still-technically-open nav, so it always reads as clickable. */
      if (navOverlay) navOverlay.classList.remove('is-open');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
      body.classList.remove('nav-open');
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

  /* Animated stat counters: any [data-count-to] element counts up from 0
     to its target the first time it scrolls into view. data-suffix/
     data-prefix decorate the final string (e.g. "70" -> "70+"); duration
     is fixed rather than exposed per-element since every stat on the site
     shares the same rhythm. */
  const countEls = document.querySelectorAll('[data-count-to]');
  if (countEls.length) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const formatCount = (value, el) => {
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const rounded = Math.round(value);
      const digits = el.dataset.noGroup ? String(rounded) : rounded.toLocaleString('en-US');
      return `${prefix}${digits}${suffix}`;
    };
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.countTo);
      if (!isFinite(target)) return;
      if (prefersReducedMotion) {
        el.textContent = formatCount(target, el);
        return;
      }
      const duration = parseInt(el.dataset.duration, 10) || 1600;
      const start = performance.now();
      const tick = (now) => {
        const elapsed = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - elapsed, 4);
        el.textContent = formatCount(target * eased, el);
        if (elapsed < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const countIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    countEls.forEach((el) => countIo.observe(el));
  }

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

  /* News archive: 40 cards load 20 at a time, and searching overrides the
     pagination to show every match regardless of how many pages have been
     revealed so far. */
  const newsArchiveGrid = document.getElementById('newsArchiveGrid');
  const newsLoadMore = document.getElementById('newsLoadMore');
  const newsSearchInput = document.getElementById('newsSearchInput');
  const newsArchiveEmpty = document.getElementById('newsArchiveEmpty');
  if (newsArchiveGrid && newsLoadMore) {
    const allCards = Array.from(newsArchiveGrid.querySelectorAll('.news-grid__card'));
    const pageSize = 20;
    let revealed = allCards.filter((c) => !c.hasAttribute('hidden')).length;
    const updateLoadMoreVisibility = () => {
      newsLoadMore.hidden = revealed >= allCards.length;
    };
    updateLoadMoreVisibility();
    newsLoadMore.addEventListener('click', () => {
      allCards.slice(revealed, revealed + pageSize).forEach((c) => c.removeAttribute('hidden'));
      revealed = Math.min(revealed + pageSize, allCards.length);
      updateLoadMoreVisibility();
    });
    if (newsSearchInput) {
      newsSearchInput.addEventListener('input', () => {
        const query = newsSearchInput.value.trim().toLowerCase();
        if (!query) {
          allCards.forEach((c, i) => c.toggleAttribute('hidden', i >= revealed));
          newsLoadMore.hidden = revealed >= allCards.length;
          if (newsArchiveEmpty) newsArchiveEmpty.classList.remove('is-visible');
          return;
        }
        let matches = 0;
        allCards.forEach((c) => {
          const isMatch = (c.dataset.title || '').includes(query);
          c.toggleAttribute('hidden', !isMatch);
          if (isMatch) matches += 1;
        });
        newsLoadMore.hidden = true;
        if (newsArchiveEmpty) newsArchiveEmpty.classList.toggle('is-visible', matches === 0);
      });
    }
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
  function initLineStage(sectionId, itemSelector) {
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
    const link2El = preview.querySelector('.line-stage__text a.line-stage__link2');
    const formEl = preview.querySelector('.line-stage__form');
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
    const colorMap = { taupe: 'var(--taupe)', sage: 'var(--sage)', cream: 'var(--cream)', grey: '#d9d9d9' };
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
    /* On mobile, the Product Categories preview (no backdrop — the Our
       Collections popup is untouched) stops being a side panel and becomes
       an inline curtain that opens directly under the tapped item, pushing
       the rest of the list down. That means moving the shared preview node
       to sit right after the active item every time it opens. Desktop keeps
       the original reserved-slot side panel (mediaQuery below matches the
       same breakpoint where .line-stage switches to a row layout). */
    const mobileCurtain = window.matchMedia('(max-width: 899px)');
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
      if (linkEl) {
        linkEl.href = item.dataset.href || '#';
        if (item.dataset.label) linkEl.textContent = item.dataset.label;
      }
      if (link2El) {
        if (item.dataset.href2) {
          link2El.href = item.dataset.href2;
          if (item.dataset.label2) link2El.textContent = item.dataset.label2;
          link2El.hidden = false;
        } else {
          link2El.hidden = true;
        }
      }
      /* Switching to a different item (or re-hovering the same one) always
         resets an item's optional inline form back to its closed state —
         the form is a per-item detour, not something that should still be
         showing once you've moved on to a different item. */
      if (formEl) formEl.classList.remove('is-visible');
      preview.classList.remove('is-form-mode');
      if (!backdrop && mobileCurtain.matches) {
        item.insertAdjacentElement('afterend', preview);
      }
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

    /* An item with data-form swaps the preview's primary button into an
       inline form instead of navigating — e.g. "Request the Price List"
       reveals a request form in place rather than leaving the page. The
       description/photo/link stay in the DOM (just hidden), so switching
       back to a normal item in show() above is a plain class toggle, not a
       content rebuild. */
    const formCloseBtn = preview.querySelector('.line-stage__form-close');
    if (linkEl && formEl) {
      linkEl.addEventListener('click', (e) => {
        if (current && current.dataset.form) {
          e.preventDefault();
          formEl.classList.add('is-visible');
          preview.classList.add('is-form-mode');
        }
      });
    }
    /* Once the inline form is showing, it's a real form the visitor is
       filling in — it must not vanish just because the cursor drifts off
       it, the way the plain description popup does. It only closes when
       explicitly dismissed via its own close button. */
    if (formCloseBtn) {
      formCloseBtn.addEventListener('click', () => {
        formEl.classList.remove('is-visible');
        preview.classList.remove('is-form-mode');
        hide();
      });
    }

    /* On desktop, moving the cursor from the item name onto the popup itself
       shouldn't close it — there's often a small gap or the popup sits right
       next to the trigger, and a plain mouseleave fires before the pointer
       actually lands on the preview. Every leave schedules a short-delayed
       hide instead of hiding immediately; entering the trigger OR the
       preview cancels it. It only actually closes once the cursor leaves
       both, or a different item's mouseenter takes over first. */
    let hideTimer = null;
    function cancelHide() { clearTimeout(hideTimer); hideTimer = null; }
    function scheduleHide() {
      if (preview.classList.contains('is-form-mode')) return;
      clearTimeout(hideTimer);
      const forItem = current;
      hideTimer = setTimeout(() => {
        if (current !== forItem) return;
        pinned ? show(pinned) : hide();
      }, 200);
    }
    preview.addEventListener('mouseenter', cancelHide);
    preview.addEventListener('mouseleave', scheduleHide);

    let pinned = null;
    items.forEach((item) => {
      const trigger = item.querySelector('button, a') || item;
      trigger.addEventListener('mouseenter', () => { cancelHide(); show(item); });
      trigger.addEventListener('mouseleave', () => {
        if (current !== item) return;
        scheduleHide();
      });
      trigger.addEventListener('focus', () => { cancelHide(); show(item); });
      trigger.addEventListener('blur', () => {
        if (current !== item) return;
        scheduleHide();
      });
      const togglePin = () => {
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
  initLineStage('deskCategoryStage', '.line-menu__item');
  initLineStage('deskCollectionsStage', '.vertical-menu__item');
  initLineStage('tablesCategoryStage', '.line-menu__item');
  initLineStage('tablesCollectionsStage', '.vertical-menu__item');
  initLineStage('seatingsCategoryStage', '.line-menu__item');
  initLineStage('coffeeCategoryStage', '.line-menu__item');
  initLineStage('coffeeCollectionsStage', '.vertical-menu__item');
  initLineStage('storageCategoryStage', '.line-menu__item');
  initLineStage('storageCollectionsStage', '.vertical-menu__item');
  initLineStage('receptionsCategoryStage', '.line-menu__item');
  initLineStage('acousticCategoryStage', '.line-menu__item');
  initLineStage('resourcesCategoryStage', '.line-menu__item');
  initLineStage('allProductsCategoryStage', '.line-menu__item');
  initLineStage('allProductsCollectionsStage', '.vertical-menu__item');

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

  /* History & Brand Evolution: a draggable scrubber bar below the track
     (no arrow buttons) — the thumb's width/position mirror how much of
     the track is visible and how far it's scrolled, and dragging it (or
     clicking anywhere on the bar) scrolls the track proportionally. A
     proportional scrubber, rather than one dot per card, is what actually
     works here: at most viewport widths several cards are visible at
     once and the track can't scroll a full card-width per card, so
     discrete per-card stops would be unreachable for the later cards. */
  document.querySelectorAll('.history-slider').forEach((slider) => {
    const track = slider.querySelector('.history-slider__track');
    const scrubber = slider.querySelector('.history-slider__scrubber');
    const thumb = slider.querySelector('.history-slider__scrubber-thumb');
    if (!track || !scrubber || !thumb) return;
    const update = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const visibleRatio = Math.min(track.clientWidth / track.scrollWidth, 1);
      thumb.style.width = (visibleRatio * 100) + '%';
      const progress = maxScroll > 0 ? track.scrollLeft / maxScroll : 0;
      thumb.style.left = (progress * (100 - visibleRatio * 100)) + '%';
      scrubber.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    };
    update();
    window.addEventListener('resize', update);
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => { update(); ticking = false; });
    });
    const seekTo = (clientX) => {
      const rect = scrubber.getBoundingClientRect();
      const thumbWidthPx = thumb.offsetWidth;
      const travel = Math.max(rect.width - thumbWidthPx, 1);
      const x = Math.min(Math.max(clientX - rect.left - thumbWidthPx / 2, 0), travel);
      const maxScroll = track.scrollWidth - track.clientWidth;
      track.scrollLeft = (x / travel) * maxScroll;
    };
    let dragging = false;
    scrubber.addEventListener('pointerdown', (e) => {
      dragging = true;
      scrubber.setPointerCapture(e.pointerId);
      seekTo(e.clientX);
    });
    scrubber.addEventListener('pointermove', (e) => { if (dragging) seekTo(e.clientX); });
    scrubber.addEventListener('pointerup', () => { dragging = false; });
    scrubber.addEventListener('pointercancel', () => { dragging = false; });
  });

  /* Project detail pages (Contract/Bespoke): same arrow-scroll pattern for
     the white photo gallery box. */
  document.querySelectorAll('.project-gallery').forEach((gallery) => {
    const track = gallery.querySelector('.project-gallery__track');
    const prev = gallery.querySelector('.project-gallery__arrow--prev');
    const next = gallery.querySelector('.project-gallery__arrow--next');
    if (!track) return;
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
  });

  /* Product-listing pages: clicking a product box expands that box itself in
     place into a full-row panel (the little square is replaced by the big
     one, not covered by a sibling) with an auto-rotating image carousel,
     description and Configure button. Only one box open per grid at a time. */
  document.querySelectorAll('.product-grid--listing').forEach((grid) => {
    let openBox = null;
    let carouselTimer = null;

    function setSlide(box, index) {
      const slides = Array.from(box.querySelectorAll('.product-box__slide'));
      const dots = Array.from(box.querySelectorAll('.product-box__dots span'));
      if (!slides.length) return;
      const i = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((s, si) => s.classList.toggle('is-active', si === i));
      dots.forEach((d, di) => d.classList.toggle('is-active', di === i));
      box.dataset.slideIndex = String(i);
    }

    function startCarousel(box) {
      if (carouselTimer) clearInterval(carouselTimer);
      carouselTimer = setInterval(() => {
        setSlide(box, Number(box.dataset.slideIndex || 0) + 1);
      }, 5000);
    }

    function closeBox(box) {
      box.classList.remove('is-open');
      if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
    }

    grid.querySelectorAll('.product-box--listing').forEach((box) => {
      const trigger = box.querySelector('.product-box__trigger');
      if (!trigger) return;
      const closeBtn = box.querySelector('.product-box__close');
      const prev = box.querySelector('.product-box__arrow--prev');
      const next = box.querySelector('.product-box__arrow--next');
      trigger.addEventListener('click', () => {
        if (openBox) closeBox(openBox);
        box.classList.add('is-open');
        setSlide(box, 0);
        startCarousel(box);
        openBox = box;
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      if (closeBtn) closeBtn.addEventListener('click', () => {
        closeBox(box);
        openBox = null;
        trigger.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      if (prev) prev.addEventListener('click', () => {
        setSlide(box, Number(box.dataset.slideIndex || 0) - 1);
        startCarousel(box);
      });
      if (next) next.addEventListener('click', () => {
        setSlide(box, Number(box.dataset.slideIndex || 0) + 1);
        startCarousel(box);
      });
    });
  });

  /* Textareas marked autosize-textarea grow with the typed content instead
     of exposing a manual drag handle (see CSS: resize:none). Resetting
     height to auto before reading scrollHeight lets it shrink back down
     too, e.g. after deleting several lines. maxlength on the element itself
     already caps the character count. */
  document.querySelectorAll('.autosize-textarea').forEach((el) => {
    const resize = () => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    };
    el.addEventListener('input', resize);
    resize();
  });

  /* Collection hero names (Alfaomega, Adjustable Desks, …) must always sit
     on a single line and stretch to fill the available width — a fixed
     vw-based font-size wraps long names and leaves short ones too small,
     so measure each name's natural width at a reference size and scale it
     to fit instead. */
  const collectionHeroNames = document.querySelectorAll('.collection-hero__name');
  if (collectionHeroNames.length) {
    const measureRange = document.createRange();
    const fitCollectionHeroNames = () => {
      collectionHeroNames.forEach((el) => {
        const targetWidth = el.clientWidth;
        if (!targetWidth) return;
        /* Typing (below) leaves only part of the name in textContent while
           it's in progress — always measure the complete word, restoring
           whatever was actually on screen straight after, so mid-type
           resizes don't compute a font-size for a half-typed string. */
        if (!el.dataset.fullText) el.dataset.fullText = el.textContent;
        const shownText = el.textContent;
        el.textContent = el.dataset.fullText;
        el.style.whiteSpace = 'nowrap';
        el.style.overflowWrap = 'normal';
        el.style.fontSize = '100px';
        measureRange.selectNodeContents(el);
        const naturalWidth = measureRange.getBoundingClientRect().width;
        const maxFont = Math.min(window.innerHeight * 0.6, 320);
        const fontSize = Math.max(32, Math.min((targetWidth / naturalWidth) * 100, maxFont));
        el.style.fontSize = fontSize + 'px';
        el.textContent = shownText;
      });
    };
    fitCollectionHeroNames();
    window.addEventListener('resize', fitCollectionHeroNames);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitCollectionHeroNames);
    }

    /* Type the name in once on load — a blinking cursor for the "computer"
       feel on Executive collections (marked with .has-cursor in the HTML),
       no cursor for the plain "typewriter" feel on Operative ones. */
    collectionHeroNames.forEach((el) => {
      const text = el.dataset.fullText || el.textContent;
      el.textContent = '';
      el.classList.add('is-typing');
      let i = 0;
      const timer = setInterval(() => {
        i++;
        el.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(timer);
          el.classList.remove('is-typing');
        }
      }, 55);
    });
  }

  /* Bespoke request modal (collection pages): any button carrying
     data-bespoke-modal-trigger opens the page's single shared modal instead
     of navigating to Contact Us, with the Your Request field pre-filled in
     capitals from that button's own data attribute. */
  const bespokeModal = document.getElementById('bespokeModal');
  if (bespokeModal) {
    const bespokeBackdrop = document.getElementById('bespokeModalBackdrop');
    const bespokeRequest = bespokeModal.querySelector('.bespoke-modal__request');
    const closeBespokeModal = () => {
      bespokeModal.classList.remove('is-visible');
      if (bespokeBackdrop) bespokeBackdrop.classList.remove('is-visible');
    };
    document.querySelectorAll('[data-bespoke-modal-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (bespokeRequest) bespokeRequest.value = (btn.dataset.bespokeModalTrigger || '').toUpperCase();
        bespokeModal.classList.add('is-visible');
        if (bespokeBackdrop) bespokeBackdrop.classList.add('is-visible');
      });
    });
    const bespokeClose = bespokeModal.querySelector('.bespoke-modal__close');
    if (bespokeClose) bespokeClose.addEventListener('click', closeBespokeModal);
    if (bespokeBackdrop) bespokeBackdrop.addEventListener('click', closeBespokeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeBespokeModal();
    });
  }

  /* Manifesto title (landing/company "70 years plus…") wraps between words
     like any normal heading, but must never break a single word mid-way —
     so size it off the widest individual word rather than a fixed vw clamp,
     letting it run as large as the longest word allows before it would
     have to split. */
  const manifestoTitles = document.querySelectorAll('.manifesto-title');
  if (manifestoTitles.length) {
    const measureRange = document.createRange();
    const fitManifestoTitles = () => {
      manifestoTitles.forEach((el) => {
        const textNode = el.firstChild;
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
        const targetWidth = el.clientWidth;
        if (!targetWidth) return;
        el.style.overflowWrap = 'normal';
        el.style.fontSize = '100px';
        const text = textNode.textContent;
        let offset = 0;
        let maxWordWidth = 0;
        text.split(/(\s+)/).forEach((token) => {
          if (token.trim().length) {
            measureRange.setStart(textNode, offset);
            measureRange.setEnd(textNode, offset + token.length);
            maxWordWidth = Math.max(maxWordWidth, measureRange.getBoundingClientRect().width);
          }
          offset += token.length;
        });
        if (!maxWordWidth) return;
        const maxFont = Math.min(window.innerWidth * 0.14, 200);
        /* A small safety margin absorbs sub-pixel rounding between this
           Range measurement and the real layout pass — without it a word
           landing even 1px over would trigger a mid-word break instead of
           harmlessly touching the edge. overflow-wrap stays "normal" (not
           reset to break-word) so, worst case, that margin shows up as
           slack rather than a split word. */
        const fontSize = Math.max(30, Math.min((targetWidth / maxWordWidth) * 100 * 0.97, maxFont));
        el.style.fontSize = fontSize + 'px';
      });
    };
    fitManifestoTitles();
    window.addEventListener('resize', fitManifestoTitles);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitManifestoTitles);
    }
  }

  /* Links like "Contact Us for Bespoke Finishings or Dimensions" on a
     collection page pass the reason along as a ?subject= query param so
     the Contact Us page arrives with it already filled in. */
  const subjectField = document.getElementById('contactSubject');
  if (subjectField) {
    const subject = new URLSearchParams(window.location.search).get('subject');
    if (subject) subjectField.value = subject;
  }

});
