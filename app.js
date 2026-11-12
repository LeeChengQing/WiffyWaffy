/* Wiffy Waffy — static mobile menu, no build step. Requires data.js. */
(() => {
  'use strict';

  const state = {
    lang: readLang(),
    tab: 'home',
    category: 'all',
    query: '',
    sheet: null,
    picks: []
  };

  const view = document.getElementById('view');
  const modal = document.getElementById('modal');
  const header = document.querySelector('.top');
  const nav = document.querySelector('.phone nav');
  let previouslyFocused = null;

  function readLang() {
    try {
      const saved = localStorage.getItem('wiffywaffy-lang');
      return ['en', 'zh', 'ms'].includes(saved) ? saved : 'en';
    } catch (_) { return 'en'; }
  }
  function saveLang(lang) {
    try { localStorage.setItem('wiffywaffy-lang', lang); } catch (_) {}
  }
  function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function money(amount) { return 'RM ' + Number(amount).toFixed(2); }
  function itemName(item) { return item[1]; }
  function itemDesc(item) { return item[state.lang === 'zh' ? 5 : state.lang === 'ms' ? 6 : 4]; }
  function safeUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function renderTop() {
    header.innerHTML =
      '<div class="brand"><div class="brand-mark" aria-hidden="true">🧇</div>' +
        '<div class="brand-copy"><span class="eyebrow">FRESHLY MADE</span><h1>Wiffy Waffy</h1>' +
        '<p>Happiness in every bite!</p></div></div>' +
      '<div class="language-picker" role="group" aria-label="Choose language">' +
      [['en','EN'], ['zh','中'], ['ms','BM']].map(([code,label]) =>
        '<button type="button" class="lang-option ' + (state.lang === code ? 'active' : '') +
        '" data-lang="' + code + '" aria-pressed="' + (state.lang === code) + '"><span class="lang-label">' + label + '</span></button>'
      ).join('') + '</div>';
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : state.lang === 'ms' ? 'ms' : 'en';
  }

  function renderNav() {
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML =
      '<button type="button" data-tab="home" class="nav-item ' + (state.tab === 'home' ? 'selected' : '') +
      '" aria-current="' + (state.tab === 'home' ? 'page' : 'false') + '"><span aria-hidden="true">⌂</span>' + esc(t('home')) + '</button>' +
      '<button type="button" data-tab="info" class="nav-item ' + (state.tab === 'info' ? 'selected' : '') +
      '" aria-current="' + (state.tab === 'info' ? 'page' : 'false') + '"><span aria-hidden="true">ⓘ</span>' + esc(t('info')) + '</button>';
  }

  function cardMarkup(item) {
    const id = item[0];
    const tag = item[2] === 'top' ? t('top') : item[2] === 'seoul' ? t('seoul') : t('classic');
    return '<button type="button" class="product-card" data-product="' + esc(id) + '" aria-label="' +
      esc(itemName(item) + ', ' + money(item[3])) + '">' +
      '<span class="product-art art-' + esc(item[2]) + '"><img src="assets/products/' + esc(id) + '.webp" alt="" loading="lazy" decoding="async" width="640" height="640"></span>' +
      '<span class="product-copy"><span class="product-tag">' + esc(tag) + '</span>' +
      '<strong>' + esc(itemName(item)) + '</strong>' +
      '<span class="product-description">' + esc(itemDesc(item)) + '</span>' +
      '<span class="product-price">' + esc(money(item[3])) + '</span></span>' +
      '<span class="card-chevron" aria-hidden="true">›</span></button>';
  }

  function filteredMenu() {
    const q = state.query.trim().toLocaleLowerCase();
    return MENU.filter(item => (state.category === 'all' || item[2] === state.category) &&
      (!q || [item[1], item[4], item[5], item[6], t(item[2])].some(v =>
        String(v).toLocaleLowerCase().includes(q))));
  }

  function renderCards() {
    const wrap = document.getElementById('menu-results');
    if (!wrap) return;
    const items = filteredMenu();
    wrap.innerHTML = items.length ?
      items.map(cardMarkup).join('') :
      '<p class="empty-results" role="status">' + esc(t('none')) + '</p>';
  }

  function renderHome() {
    view.className = 'sheet home-view';
    view.innerHTML =
      '<div class="hero"><span class="hero-label">THE WAFFLE MENU</span>' +
      '<h2>' + esc(t('menu')) + ' <span class="hero-waffle" aria-hidden="true">✦</span></h2>' +
      '<p>' + esc(state.lang === 'zh' ? '香脆、甜蜜，现点现做' : state.lang === 'ms' ?
        'Rangup, manis dan dibuat segar' : 'Crispy, sweet, made fresh') + '</p></div>' +
      '<label class="search-wrap"><span aria-hidden="true">⌕</span><span class="sr-only">' +
      esc(t('search')) + '</span><input id="menu-search" type="search" inputmode="search" autocomplete="off" ' +
      'placeholder="' + esc(t('search')) + '" value="' + esc(state.query) + '"></label>' +
      '<div class="chips" role="group" aria-label="Filter menu">' +
      ['all','top','seoul','classic'].map(cat =>
        '<button type="button" class="chip ' + (state.category === cat ? 'active' : '') + '" data-cat="' + cat +
        '" aria-pressed="' + (state.category === cat) + '">' + esc(t(cat)) + '</button>'
      ).join('') + '</div>' +
      '<div class="menu-heading"><h3>' + esc(t(state.category === 'all' ? 'all' : state.category)) +
      '</h3><span id="product-count"></span></div>' +
      '<div class="cards" id="menu-results"></div>';
    renderCards();
    const count = document.getElementById('product-count');
    if (count) count.textContent = filteredMenu().length + ' / ' + MENU.length;
  }

  function renderInfo() {
    view.className = 'sheet info-view';
    const content = [];
    if (SHOP.address) content.push('<p>📍 ' + esc(SHOP.address) + '</p>');
    if (SHOP.hours) content.push('<p>🕒 ' + esc(SHOP.hours) + '</p>');
    if (SHOP.phone) content.push('<a href="tel:' + esc(String(SHOP.phone).replace(/[^+0-9]/g,'')) +
      '">📞 ' + esc(SHOP.phone) + '</a>');
    if (SHOP.maps && safeUrl(SHOP.maps)) content.push('<a class="chip info-link" target="_blank" rel="noopener noreferrer" href="' +
      esc(safeUrl(SHOP.maps)) + '">' + esc(t('dir')) + '</a>');
    if (Array.isArray(SHOP.socials)) SHOP.socials.forEach(social => {
      const name = social.name || social[0];
      const url = safeUrl(social.url || social[1]);
      if (name && url) content.push('<a target="_blank" rel="noopener noreferrer" href="' +
        esc(url) + '">' + esc(name) + '</a>');
    });
    view.innerHTML = '<div class="handle" aria-hidden="true"></div><h2>Wiffy Waffy</h2>' +
      (content.length ? content.join('') : '<p class="empty">' + esc(t('soon')) + '</p>');
  }

  function render() {
    if (window.WiffyMotion) window.WiffyMotion.beforePageUpdate();
    renderTop();
    renderNav();
    if (state.tab === 'home') renderHome(); else renderInfo();
    renderSheet();
    if (window.WiffyMotion) window.WiffyMotion.page();
  }

  function openSheet(kind, item) {
    previouslyFocused = document.activeElement;
    state.sheet = { kind, item: item || null };
    state.picks = [];
    renderSheet();
    document.body.classList.add('modal-open');
    document.querySelector('.phone').inert = true;
    const close = modal.querySelector('.close-sheet');
    if (close) close.focus();
    if (window.WiffyMotion) window.WiffyMotion.sheetOpen();
  }

  function finishCloseSheet() {
    state.sheet = null;
    modal.innerHTML = '';
    document.body.classList.remove('modal-open');
    document.querySelector('.phone').inert = false;
    if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
    previouslyFocused = null;
  }

  function closeSheet() {
    if (!state.sheet) return;
    if (window.WiffyMotion) window.WiffyMotion.sheetClose(finishCloseSheet);
    else finishCloseSheet();
  }

  function openDetail(item) { openSheet('detail', item); }
  function openMixer() { openSheet('mixer', null); }

  function sheetFrame(inner) {
    modal.innerHTML = '<div class="modal-backdrop" data-close="true"></div>' +
      '<section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
      '<div class="sheet-grip" aria-hidden="true"></div>' +
      '<button type="button" class="close-sheet" data-close="true" aria-label="' + esc(t('close')) + '">×</button>' +
      inner + '</section>';
  }

  function renderSheet() {
    if (!state.sheet) { modal.innerHTML = ''; return; }
    if (state.sheet.kind === 'mixer') { paintMix(); return; }
    const item = state.sheet.item;
    const cat = item[2] === 'top' ? t('top') : item[2] === 'seoul' ? t('seoul') : t('classic');
    sheetFrame('<div class="detail-illustration"><img src="assets/products/' + esc(item[0]) + '.webp" alt="" loading="eager" decoding="async" width="640" height="640"></div>' +
      '<span class="product-tag">' + esc(cat) + '</span><h2 id="sheet-title">' +
      esc(itemName(item)) + '</h2><p class="sheet-desc">' + esc(itemDesc(item)) + '</p>' +
      '<div class="detail-price">' + esc(money(item[3])) + '</div>' +
      '<div class="allergen-box"><strong>' + esc(t('allergens')) + '</strong><p>' +
      esc(t('allergenText')) + '</p></div>');
  }

  function paintMix() {
    const a = state.picks.length ? FLAVOURS[state.picks[0]][0] : '#e3c49a';
    const b = state.picks.length > 1 ? FLAVOURS[state.picks[1]][0] : '#fff2cf';
    const bg = 'linear-gradient(90deg,' + a + ' 0%,' + a + ' 50%,' + b + ' 50%,' + b + ' 100%)';
    const chosenNames = state.picks.map(i => FLAVOURS[i][state.lang === 'zh' ? 2 : state.lang === 'ms' ? 3 : 1]);
    sheetFrame('<h2 id="sheet-title">' + esc(t('mix')) + '</h2>' +
      '<div class="classic-reference"><img src="assets/products/classic-mix.webp" alt="" loading="eager" decoding="async" width="640" height="640"><img src="assets/products/classic-mix-alternate.webp" alt="" loading="lazy" decoding="async" width="640" height="640"></div>' +
      '<p class="sheet-desc">' + esc(state.lang === 'zh' ? '可重复选择，第三次点击会替换最早的口味。' :
      state.lang === 'ms' ? 'Boleh pilih perisa sama; pilihan ketiga menggantikan yang pertama.' :
      'Duplicates welcome. Your third pick replaces the oldest.') + '</p>' +
      '<div class="mix-preview"><div class="mix-waffle" style="background:' + bg + '" aria-hidden="true">' +
      '<span class="waffle-grid"></span></div></div>' +
      '<p class="mix-selection" aria-live="polite">' +
      esc(chosenNames.length ? chosenNames.join(' + ') : (state.lang === 'zh' ? '请选择两种口味' :
      state.lang === 'ms' ? 'Sila pilih dua perisa' : 'Choose two flavours')) + '</p>' +
      '<div class="flavours">' + FLAVOURS.map((flavour, i) =>
        '<button type="button" class="flavour ' + (state.picks.includes(i) ? 'picked' : '') +
        '" data-flavour="' + i + '"><span class="flavour-dot" style="background:' +
        esc(flavour[0]) + '"></span><span>' +
        esc(flavour[state.lang === 'zh' ? 2 : state.lang === 'ms' ? 3 : 1]) +
        '</span><span class="pick-count">' + state.picks.filter(p => p === i).length +
        '</span></button>'
      ).join('') + '</div><div class="mixer-total"><strong>' + money(7.9) +
      '</strong><span>' + state.picks.length + ' / 2</span></div>');
  }

  document.addEventListener('click', event => {
    const lang = event.target.closest('[data-lang]');
    if (lang) {
      state.lang = lang.dataset.lang;
      saveLang(state.lang);
      render();
      return;
    }
    const tab = event.target.closest('[data-tab]');
    if (tab) {
      state.tab = tab.dataset.tab;
      closeSheet();
      render();
      return;
    }
    const cat = event.target.closest('[data-cat]');
    if (cat) {
      state.category = cat.dataset.cat;
      renderHome();
      return;
    }
    const product = event.target.closest('[data-product]');
    if (product) {
      const item = MENU.find(m => m[0] === product.dataset.product);
      if (item) item[2] === 'classic' ? openMixer() : openDetail(item);
      return;
    }
    const flavour = event.target.closest('[data-flavour]');
    if (flavour && state.sheet && state.sheet.kind === 'mixer') {
      state.picks.push(Number(flavour.dataset.flavour));
      if (state.picks.length > 2) state.picks.shift();
      const previously = flavour.dataset.flavour;
      paintMix();
      const current = modal.querySelector('[data-flavour="' + previously + '"]');
      if (current) current.focus();
      return;
    }
    if (event.target.closest('[data-close]')) closeSheet();
  });

  document.addEventListener('input', event => {
    if (event.target.id !== 'menu-search') return;
    state.query = event.target.value;
    renderCards();
    const count = document.getElementById('product-count');
    if (count) count.textContent = filteredMenu().length + ' / ' + MENU.length;
  });

  document.addEventListener('keydown', event => {
    if (!state.sheet) return;
    if (event.key === 'Escape') { event.preventDefault(); closeSheet(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) {
      event.preventDefault(); focusable[focusable.length - 1].focus();
    } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
      event.preventDefault(); focusable[0].focus();
    }
  });

  render();
})();
