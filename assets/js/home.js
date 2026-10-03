/* Home: collections gallery arrows (the track itself is native
   scroll-snap, so touch and trackpad work without any script). */
(() => {
  const gallery = document.querySelector('.home-gallery');
  if (!gallery) return;
  const track = gallery.querySelector('.home-gallery__track');
  const arrows = [...gallery.querySelectorAll('.home-gallery__arrow')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    arrows.forEach((a) => {
      a.disabled = Number(a.dataset.dir) < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
    });
  };

  arrows.forEach((a) => a.addEventListener('click', () => {
    const card = track.querySelector('.home-gallery__card');
    const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : track.clientWidth * 0.8;
    track.scrollBy({ left: Number(a.dataset.dir) * step * 2, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Range line-up tabs (keyboard: arrows move between tabs). */
(() => {
  const tabs = Array.from(document.querySelectorAll('.lu-tab'));
  const show = (t) => {
    tabs.forEach((x) => {
      const on = x === t;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      show(n); n.focus();
    });
  });
})();
