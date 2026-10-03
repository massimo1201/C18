/* Projects listing: filter cards by sector. */
(() => {
  const chips = Array.from(document.querySelectorAll('.pj-filter [data-filter]'));
  const cards = Array.from(document.querySelectorAll('.pj-card'));
  chips.forEach((c) => c.addEventListener('click', () => {
    const f = c.dataset.filter;
    chips.forEach((x) => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    cards.forEach((card) => { card.hidden = f !== 'all' && card.dataset.sector !== f; });
  }));
})();
