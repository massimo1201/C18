document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  const navOverlay = document.querySelector('.nav-overlay');
  const body = document.body;

  /* Header background on scroll */
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

  /* Line sliders (Essential / Operative / Executive): highlight the item nearest center */
  document.querySelectorAll('.line-slider').forEach((slider) => {
    const items = Array.from(slider.querySelectorAll('.line-slider__item'));
    let ticking = false;

    const update = () => {
      const box = slider.getBoundingClientRect();
      const center = box.left + box.width / 2;
      let closest = null;
      let minDist = Infinity;
      items.forEach((item) => {
        const r = item.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - center);
        if (dist < minDist) {
          minDist = dist;
          closest = item;
        }
      });
      items.forEach((item) => item.classList.toggle('is-active', item === closest));
      ticking = false;
    };

    slider.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();

    /* Drag-to-scroll for mouse users */
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    ['mouseleave', 'mouseup'].forEach((evt) =>
      slider.addEventListener(evt, () => { isDown = false; })
    );
    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      slider.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });
  });
});
