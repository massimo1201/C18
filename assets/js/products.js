/* Product pages: quick view of a product, and the category filter on
   products/all.html. Cards are real links (collection page or contact),
   so everything still works without this script. */
(() => {
  const dialog = document.getElementById('plQuick');
  const currentDict = () => {
    let code = 'EN';
    try { code = localStorage.getItem('codutti_lang') || 'EN'; } catch (e) {}
    return (window.I18N && (window.I18N[code] || window.I18N.EN)) || {};
  };

  if (dialog && typeof dialog.showModal === 'function') {
    const img = dialog.querySelector('.pl-quick__media img');
    const name = dialog.querySelector('.pl-quick__name');
    const meta = dialog.querySelector('.pl-quick__meta');
    const coll = dialog.querySelector('.pl-quick__collection');

    document.querySelectorAll('[data-quick]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        img.src = link.dataset.img;
        img.alt = link.dataset.name;
        name.textContent = link.querySelector('.pl-card__name').textContent;
        const key = link.dataset.metaKey;
        meta.textContent = currentDict()[key] || link.querySelector('.pl-card__meta').textContent;
        if (link.dataset.collection) {
          coll.href = link.dataset.collection;
          coll.hidden = false;
        } else {
          coll.hidden = true;
        }
        dialog.showModal();
      });
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });
  }

  /* products/all.html: filter the full grid by category. */
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  if (filters.length) {
    const cards = Array.from(document.querySelectorAll('.pl-list .pl-card'));
    const count = document.querySelector('.pl-list .pl-count__n');
    filters.forEach((btn) => btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      filters.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      let n = 0;
      cards.forEach((c) => {
        const show = !cat || c.dataset.cat === cat;
        c.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = n;
    }));
  }
})();
