(function () {
  const grid = document.getElementById('speciesGrid');
  const bitingScroll = document.getElementById('bitingScroll');
  const bitingSection = document.getElementById('bitingSection');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('search');
  const categoryBtns = document.querySelectorAll('#categoryFilters .chip');
  const bitingBtn = document.getElementById('bitingBtn');
  const favBtn = document.getElementById('favBtn');
  const resetBtn = document.getElementById('resetBtn');
  const monthSpan = document.getElementById('currentMonth');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  monthSpan.textContent = MONTHS[currentMonth - 1];

  let activeCategory = 'all';
  let bitingOnly = false;
  let favOnly = false;
  let searchQuery = '';
  let favorites = loadFavorites();

  function loadFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem('tl_favs') || '[]')); }
    catch { return new Set(); }
  }

  function saveFavorites() {
    localStorage.setItem('tl_favs', JSON.stringify([...favorites]));
  }

  function toggleFav(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    renderAll();
  }

  function matchesSearch(sp, q) {
    if (!q) return true;
    const hay = [
      sp.name, sp.scientific, ...(sp.aka || []),
      sp.description, sp.habitat, sp.diet,
      ...sp.baits.live, ...sp.baits.artificial, ...(sp.baits.prepared || []),
      ...sp.tips, sp.funFact
    ].join(' ').toLowerCase();
    return q.split(/\s+/).every(w => hay.includes(w));
  }

  function isActive(sp) { return sp.activeMonths.includes(currentMonth); }
  function isPeak(sp) { return sp.peakMonths.includes(currentMonth); }

  function filteredSpecies() {
    return SPECIES.filter(sp => {
      if (activeCategory !== 'all' && sp.category !== activeCategory) return false;
      if (bitingOnly && !isActive(sp)) return false;
      if (favOnly && !favorites.has(sp.id)) return false;
      if (searchQuery && !matchesSearch(sp, searchQuery)) return false;
      return true;
    });
  }

  function diffDots(level) {
    let h = '';
    for (let i = 1; i <= 3; i++) h += `<span class="diff-dot${i <= level ? ' filled' : ''}"></span>`;
    return h;
  }

  function buildBaits(baits) {
    let html = '';
    if (baits.live.length) html += `<div class="bait-group"><div class="bait-label">Live Bait</div><div class="detail-text">${baits.live.join(', ')}</div></div>`;
    if (baits.artificial.length) html += `<div class="bait-group"><div class="bait-label">Artificial</div><div class="detail-text">${baits.artificial.join(', ')}</div></div>`;
    if (baits.prepared && baits.prepared.length) html += `<div class="bait-group"><div class="bait-label">Prepared / Cut</div><div class="detail-text">${baits.prepared.join(', ')}</div></div>`;
    return html;
  }

  function renderCard(sp) {
    const catMeta = CATEGORY_META[sp.category];
    const fav = favorites.has(sp.id);
    return `
    <article class="species-card" data-id="${sp.id}" data-category="${sp.category}">
      <div class="card-main" role="button" tabindex="0" aria-label="Expand ${sp.name}">
        <div class="card-stripe" style="background:${catMeta.color}"></div>
        <div class="card-body">
          <div class="card-header">
            <div>
              <div class="card-name">${sp.name}</div>
              <div class="card-scientific">${sp.scientific}</div>
            </div>
            <button class="card-fav${fav ? ' favorited' : ''}" data-fav="${sp.id}" aria-label="Toggle favorite" title="Toggle favorite">${fav ? '★' : '☆'}</button>
          </div>
          <div class="card-meta">
            <span class="meta-item"><span class="diff-dots">${diffDots(sp.difficulty)}</span> ${DIFFICULTY_LABELS[sp.difficulty]}</span>
            <span class="meta-item">📏 ${sp.typicalSize}</span>
            <span class="meta-item">💪 ${sp.fight}</span>
            <span class="meta-item">🍽️ ${sp.taste}</span>
          </div>
          <div class="card-tags">
            <span class="tag" style="border-left:2px solid ${catMeta.color}">${catMeta.label}</span>
            ${sp.bestSeasons.map(s => `<span class="tag">${s}</span>`).join('')}
            ${sp.bestTimes.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="card-expand-hint">tap for details</div>
      <div class="card-details">
        <div class="details-inner">
          ${sp.aka.length ? `<div class="detail-section"><div class="detail-label">Also Known As</div><div class="detail-text">${sp.aka.join(', ')}</div></div>` : ''}
          <div class="detail-section"><div class="detail-label">About</div><div class="detail-text">${sp.description}</div></div>
          <div class="detail-section"><div class="detail-label">Where to Find</div><div class="detail-text">${sp.habitat}</div></div>
          <div class="detail-section"><div class="detail-label">What They Eat</div><div class="detail-text">${sp.diet}</div></div>
          <div class="detail-section"><div class="detail-label">Best Baits</div>${buildBaits(sp.baits)}</div>
          <div class="detail-section"><div class="detail-label">Tips & Tricks</div><ul class="detail-list">${sp.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>
          <div class="detail-section"><div class="detail-label">Fun Fact</div><div class="fun-fact">${sp.funFact}</div></div>
          <div class="detail-section"><div class="detail-label">GA Regulations</div>
            <div class="regs-grid">
              <div class="reg-item"><span>Min Size</span>${sp.regulations.minSize}</div>
              <div class="reg-item"><span>Daily Limit</span>${sp.regulations.dailyLimit}</div>
            </div>
          </div>
          <div class="detail-section"><div class="detail-label">State Record</div><div class="detail-text">${sp.stateRecord}</div></div>
        </div>
      </div>
    </article>`;
  }

  function renderBiting() {
    const biting = SPECIES.filter(sp => isActive(sp)).sort((a, b) => {
      const ap = isPeak(a) ? 0 : 1;
      const bp = isPeak(b) ? 0 : 1;
      return ap - bp || a.name.localeCompare(b.name);
    });
    bitingScroll.innerHTML = biting.map(sp => {
      const peak = isPeak(sp);
      return `<div class="biting-card${peak ? ' peak' : ''}" data-scroll-to="${sp.id}">
        <div class="biting-badge">${peak ? '🔥 Peak' : 'Active'}</div>
        <div class="biting-name">${sp.name}</div>
      </div>`;
    }).join('');
  }

  function renderGrid() {
    const list = filteredSpecies();
    grid.innerHTML = list.map(renderCard).join('');
    emptyState.style.display = list.length ? 'none' : 'block';
    grid.style.display = list.length ? '' : 'none';
  }

  function renderAll() {
    renderBiting();
    renderGrid();
    updateFilterUI();
  }

  function updateFilterUI() {
    bitingSection.style.display = (activeCategory === 'all' && !searchQuery && !bitingOnly && !favOnly) ? '' : 'none';
  }

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      renderAll();
    });
  });

  bitingBtn.addEventListener('click', () => {
    bitingOnly = !bitingOnly;
    bitingBtn.classList.toggle('active', bitingOnly);
    renderAll();
  });

  favBtn.addEventListener('click', () => {
    favOnly = !favOnly;
    favBtn.classList.toggle('active', favOnly);
    renderAll();
  });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderAll();
  });

  resetBtn.addEventListener('click', () => {
    activeCategory = 'all';
    bitingOnly = false;
    favOnly = false;
    searchQuery = '';
    searchInput.value = '';
    categoryBtns.forEach(b => b.classList.remove('active'));
    categoryBtns[0].classList.add('active');
    bitingBtn.classList.remove('active');
    favBtn.classList.remove('active');
    renderAll();
  });

  document.addEventListener('click', (e) => {
    const favEl = e.target.closest('[data-fav]');
    if (favEl) {
      e.stopPropagation();
      toggleFav(favEl.dataset.fav);
      return;
    }
    const cardMain = e.target.closest('.card-main');
    if (cardMain) {
      const card = cardMain.closest('.species-card');
      card.classList.toggle('expanded');
      return;
    }
    const bitCard = e.target.closest('[data-scroll-to]');
    if (bitCard) {
      const id = bitCard.dataset.scrollTo;
      const el = document.querySelector(`.species-card[data-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('expanded');
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.card-main');
      if (card) card.click();
    }
  });

  renderAll();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
