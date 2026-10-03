/* Collection launch pages: sticky reveal scene, counters, image reveals and
   the configurator. One passive scroll listener + requestAnimationFrame;
   everything degrades to static content with reduced motion. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* Sticky scene: the product grows into view while three lines alternate. */
  const scene = document.querySelector('.cl-scene');
  const sImg = scene && scene.querySelector('.cl-scene__img');
  const lines = scene ? Array.from(scene.querySelectorAll('.cl-scene__line')) : [];
  let ticking = false;
  const render = () => {
    ticking = false;
    if (!scene) return;
    const r = scene.getBoundingClientRect();
    const span = scene.offsetHeight - window.innerHeight;
    const t = clamp(-r.top / Math.max(1, span), 0, 1);
    if (sImg) sImg.style.transform = `scale(${0.78 + 0.22 * Math.min(1, t * 1.6)})`;
    const step = Math.min(lines.length - 1, Math.floor(t * lines.length));
    lines.forEach((l, i) => l.classList.toggle('is-on', i === step));
  };
  if (scene && !reduce) {
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } }, { passive: true });
    render();
  } else if (scene) {
    scene.classList.add('is-static');
  }

  /* Counters and clip-path reveals when they enter the viewport. */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    io.unobserve(el);
    if (el.dataset.count) {
      const end = Number(el.dataset.count);
      if (reduce || end < 10) { el.textContent = end; return; }
      const start = end > 1000 ? end - 60 : 0;
      const t0 = performance.now();
      const tick = (now) => {
        const k = clamp((now - t0) / 1100, 0, 1);
        el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } else {
      el.classList.add('is-in');
    }
  }), { threshold: 0.35 });
  document.querySelectorAll('[data-count], .cl-macro__item').forEach((el) => io.observe(el));

  /* Configurator */
  const cfg = document.querySelector('.cfg');
  if (!cfg) return;
  const img = cfg.querySelector('.cfg__img');
  const varBox = cfg.querySelector('.cfg-variants');
  const list = cfg.querySelector('.cfg-summary__list');
  const cta = cfg.querySelector('.cfg-cta');
  const dict = () => {
    let c = 'EN';
    try { c = localStorage.getItem('codutti_lang') || 'EN'; } catch (e) {}
    return (window.I18N && (window.I18N[c] || window.I18N.EN)) || {};
  };
  const vlabel = (key, i) => (key === 'version' ? `${dict()['var.version'] || 'Version'} ${String(i + 1).padStart(2, '0')}` : (dict()['var.' + key] || key));
  const press = (group, btn) => group.forEach((b) => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
  let product = null; let variant = null;

  const summary = () => {
    const rows = [[dict()['col.cfg.product'] || 'Product', product.dataset.product], [dict()['col.cfg.version'] || 'Version', variant.textContent]];
    cfg.querySelectorAll('.cfg-group').forEach((g) => {
      const on = g.querySelector('.cfg-sw.is-on');
      if (on) rows.push([g.querySelector('.cfg-label').textContent, `${on.dataset.code} ${on.dataset.name}`]);
    });
    list.innerHTML = '';
    rows.forEach(([k, v]) => {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><strong></strong>';
      li.firstChild.textContent = k; li.lastChild.textContent = v;
      list.appendChild(li);
    });
    const text = `${cfg.dataset.collection}\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n');
    cta.href = `${cfg.dataset.contact}?config=${encodeURIComponent(text)}#request-form`;
  };
  const setVariant = (btn) => {
    variant = btn;
    press(Array.from(varBox.children), btn);
    img.src = btn.dataset.src;
    summary();
  };
  const setProduct = (btn) => {
    product = btn;
    press(Array.from(cfg.querySelectorAll('.cfg-opt')), btn);
    varBox.innerHTML = '';
    JSON.parse(btn.dataset.variants).forEach(([key, src], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cfg-chip'; b.dataset.src = src; b.textContent = vlabel(key, i);
      b.addEventListener('click', () => setVariant(b));
      varBox.appendChild(b);
    });
    setVariant(varBox.firstElementChild);
  };
  cfg.querySelectorAll('.cfg-opt').forEach((b) => b.addEventListener('click', () => setProduct(b)));
  cfg.querySelectorAll('.cfg-group').forEach((g) => {
    const sws = Array.from(g.querySelectorAll('.cfg-sw'));
    sws.forEach((b) => b.addEventListener('click', () => { press(sws, b); summary(); }));
  });
  setProduct(cfg.querySelector('.cfg-opt'));
})();
