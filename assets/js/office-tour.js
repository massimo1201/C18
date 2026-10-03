/* Office tour (home landing): a sticky stage holds one office photo and a
   virtual camera that scroll moves between panels. Each panel's data-x /
   data-y (0–1 share of the photo) is the point the camera centres on, and
   data-zoom how close it gets; panel text fades in while the camera holds. */
(() => {
  const tour = document.querySelector('.office-tour');
  if (!tour) return;

  const stage = tour.querySelector('.office-tour__stage');
  const img = tour.querySelector('.office-tour__img');
  const panels = [...tour.querySelectorAll('.office-tour__panel')];
  const dotsNav = tour.querySelector('.office-tour__dots');
  const dots = dotsNav ? [...dotsNav.querySelectorAll('button')] : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const shots = panels.map((p) => ({
    x: parseFloat(p.dataset.x) || 0.5,
    y: parseFloat(p.dataset.y) || 0.5,
    z: Math.max(1, parseFloat(p.dataset.zoom) || 1),
  }));
  const last = panels.length - 1;

  /* Share of each scroll segment spent moving (the rest is a hold on the
     current shot so the panel text can be read). */
  const MOVE = 0.6;
  /* How far the camera pulls back mid-way between two close-ups. */
  const DIP = 0.22;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let vw = 0, vh = 0, iw = 0, ih = 0, scrollSpan = 1;

  function measure() {
    /* The landing header is solid cream: start the photo just below it. */
    const header = document.querySelector('.site-header');
    tour.style.setProperty('--tour-top', (header ? header.offsetHeight : 0) + 'px');
    vw = stage.clientWidth;
    vh = stage.clientHeight;
    tour.style.height = Math.round(vh + last * window.innerHeight) + 'px';
    scrollSpan = Math.max(1, tour.offsetHeight - vh);

    /* Size the photo ourselves (cover), so the camera maths works in real
       pixels of the rendered image rather than object-fit's hidden box. */
    const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 16 / 9;
    if (vw / vh > ratio) { iw = vw; ih = vw / ratio; } else { ih = vh; iw = vh * ratio; }
    img.style.width = iw + 'px';
    img.style.height = ih + 'px';
    img.style.objectFit = 'fill';
  }

  function camera(pos) {
    const i = clamp(Math.floor(pos), 0, last);
    if (i >= last) return shots[last];
    const f = pos - i;
    const raw = clamp((f - (1 - MOVE) / 2) / MOVE, 0, 1);
    const t = reduceMotion.matches ? (raw < 0.5 ? 0 : 1) : ease(raw);
    const a = shots[i], b = shots[i + 1];
    let z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t);
    if (!reduceMotion.matches && a.z > 1.3 && b.z > 1.3) z *= 1 - DIP * Math.sin(Math.PI * t);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: Math.max(1, z) };
  }

  function place(cam) {
    /* In portrait the cover-fit photo is already enlarged, so close-ups
       need far less extra zoom to frame the same area. */
    const z = vw < vh ? 1 + (cam.z - 1) * 0.35 : cam.z;
    const tx = clamp(vw / 2 - cam.x * iw * z, vw - iw * z, 0);
    /* Panel copy sits at the bottom; in portrait keep the subject above it. */
    const anchorY = vw < vh && cam.z > 1 ? 0.32 : 0.5;
    const ty = clamp(vh * anchorY - cam.y * ih * z, vh - ih * z, 0);
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${z})`;
  }

  function render() {
    ticking = false;
    const progress = clamp(-tour.getBoundingClientRect().top / scrollSpan, 0, 1);
    const pos = progress * last;
    place(camera(pos));

    panels.forEach((panel, k) => {
      const d = Math.abs(pos - k);
      const o = clamp(1 - (d - 0.15) / 0.2, 0, 1);
      panel.style.opacity = o;
      panel.style.transform = reduceMotion.matches ? 'none' : `translate3d(0, ${(1 - o) * 24}px, 0)`;
      const active = o > 0.5;
      panel.classList.toggle('is-active', active);
      panel.toggleAttribute('inert', !active);
    });

    if (dotsNav) {
      dotsNav.classList.toggle('is-visible', pos > 0.5 && pos < last - 0.5);
      dots.forEach((dot) => {
        const on = Number(dot.dataset.go) === Math.round(pos);
        dot.classList.toggle('is-current', on);
        if (on) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
      });
    }
  }

  let ticking = false;
  function requestRender() {
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }

  function setup() {
    measure();
    tour.classList.add('is-ready');
    render();
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const k = Number(dot.dataset.go);
      const y = window.scrollY + tour.getBoundingClientRect().top + (k / last) * scrollSpan;
      window.scrollTo({ top: y, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });

  if (img.complete && img.naturalWidth) setup();
  else img.addEventListener('load', setup, { once: true });

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', () => { measure(); requestRender(); });
})();
