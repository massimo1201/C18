/* Product detail page: version thumbnails swap the main image. */
(() => {
  const main = document.querySelector('.pd__main');
  const img = main && main.querySelector('img');
  const label = document.querySelector('.pd__variant');
  const thumbs = Array.from(document.querySelectorAll('.pd-thumb'));
  if (!img || !thumbs.length) return;
  thumbs.forEach((t) => t.addEventListener('click', () => {
    if (t.classList.contains('is-active')) return;
    thumbs.forEach((x) => {
      x.classList.toggle('is-active', x === t);
      x.setAttribute('aria-pressed', String(x === t));
    });
    main.classList.add('is-switching');
    const next = new Image();
    next.onload = next.onerror = () => {
      img.src = t.dataset.src;
      main.classList.remove('is-switching');
    };
    next.src = t.dataset.src;
    if (label) label.innerHTML = t.querySelector('.pd-thumb__label').innerHTML;
    if (window.matchMedia('(max-width: 860px)').matches) main.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
})();

/* Downloads page: filter cards by type. */
(() => {
  const chips = Array.from(document.querySelectorAll('.page-downloads [data-filter]'));
  const cards = Array.from(document.querySelectorAll('.dl-card'));
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    cards.forEach((k) => { k.hidden = !!c.dataset.filter && k.dataset.kind !== c.dataset.filter; });
  }));
})();
