'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('#glossary-search');
  const cards = Array.from(document.querySelectorAll('.glossary-card'));
  const status = document.querySelector('#search-status');

  if (!searchInput || cards.length === 0 || !status) {
    return;
  }

  const totalCount = cards.length;
  const hiddenClass = 'is-hidden';

  const applyFilter = (rawQuery) => {
    const query = rawQuery.trim().toLowerCase();
    const queryTokens = query ? query.split(/\s+/) : [];
    let visibleCount = 0;

    cards.forEach((card) => {
      if (queryTokens.length === 0) {
        card.hidden = false;
        card.classList.remove(hiddenClass);
        visibleCount += 1;
        return;
      }

      const haystack = card.textContent.toLowerCase();
      const matches = queryTokens.every((token) => haystack.includes(token));
      card.hidden = !matches;
      card.classList.toggle(hiddenClass, !matches);
      if (matches) {
        visibleCount += 1;
      }
    });

    if (queryTokens.length === 0) {
      status.textContent = `Showing all ${totalCount} glossary cards.`;
      return;
    }

    if (visibleCount === 0) {
      status.textContent = `No cards match "${rawQuery}". Try broader terms or clear the search.`;
      return;
    }

    status.textContent = `Showing ${visibleCount} of ${totalCount} cards for "${rawQuery}".`;
  };

  searchInput.addEventListener('input', (event) => {
    applyFilter(event.currentTarget.value);
  });

  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.currentTarget.value = '';
      applyFilter('');
      event.currentTarget.blur();
    }
  });

  const updateCardGlow = (event) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const resetCardGlow = (event) => {
    const card = event.currentTarget;
    card.style.removeProperty('--mouse-x');
    card.style.removeProperty('--mouse-y');
  };

  cards.forEach((card) => {
    card.addEventListener('pointermove', updateCardGlow);
    card.addEventListener('pointerleave', resetCardGlow);
  });
});
