/* Wiffy Waffy — static mobile menu, no build step. Requires data.js. */
(() => {
  'use strict';

  const state = {
    lang: readLang(),
    cat: 'all',
    q: '',
    sheet: false,
    picks: []
  };

  const LI = { en: 0, zh: 1, ms: 2 };
  const app = document.querySelector('.app');
  const modal = document.getElementById('modal');
  const search = document.getElementById('q');
  const location = document.getElementById('loc');
  const promo = document.getElementById('promo');
  const chips = document.getElementById('chips');
  const list = document.getElementById('list');
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

  function paintLang() {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : state.lang;
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.lang === state.lang);
    });
    search.placeholder = t('search');
    search.setAttribute('aria-label', t('search'));
    location.setAttribute('aria-label', t('loc'));
  }

  function paintPromo() {
    promo.innerHTML = `<div><b>${t('promoTitle')}</b><span>${t('promoSub')}</span><div class="dots">${FLAVOURS.map(f => `<i style="background:${f[0]}"></i>`).join('')}</div></div><button data-go="classic">${t('promoBtn')}</button>`;
  }

  function paintChips() {
    chips.innerHTML = ['all', ...SECTIONS.map(([id]) => id)].map(c =>
      `<button class="chip" data-cat="${c}" aria-pressed="${state.cat === c}">${t(c)}</button>`
    ).join('');
  }

  function productCard(m) {
    return `<button class="card" data-id="${m[0]}"><div class="tile">${m[0].includes('mochi') ? `<span class="badge">${t('mochi')}</span>` : ''}<img src="assets/products/${m[0]}.webp?v=2" onerror="this.onerror=null;this.src='assets/placeholder.svg'" width="120" height="120" loading="lazy" alt=""></div><div class="name">${m[1]}</div><div class="desc">${m[4 + LI[state.lang]]}</div><div class="price">${money(m[3])}</div></button>`;
  }

  function classicCard() {
    return `<button class="card wide" data-id="classic-mix"><div class="tile"><img src="assets/products/classic-mix.webp" onerror="this.onerror=null;this.src='assets/placeholder.svg'" width="96" height="96" alt=""></div><div><div class="name">${t('classicName')}</div><div class="desc">${FLAVOURS.map(f => f[1 + LI[state.lang]]).join(' · ')}</div><div class="price">RM 7.90</div></div></button>`;
  }

  function paintList() {
    const q = state.q.toLowerCase();
    list.innerHTML = SECTIONS.map(([id, title, sub]) => {
      if (state.cat !== 'all' && state.cat !== id) return '';
      const cards = id === 'classic'
        ? ((t('classicName') + ' classic mix').toLowerCase().includes(q) ? classicCard() : '')
        : MENU.filter(m => m[2] === id && m[1].toLowerCase().includes(q)).map(productCard).join('');
      if (!cards) return '';
      return `<section id="s-${id}"><h2>${t(title)}${sub ? `<small>${t(sub)}</small>` : ''}</h2><div class="grid">${cards}</div></section>`;
    }).join('') || `<p class="empty">${t('none')}</p>`;
  }

  function infoHtml() {
    const content = [];
    if (SHOP.address) content.push('<p>📍 ' + esc(SHOP.address) + '</p>');
    if (SHOP.hours) content.push('<p>🕒 ' + esc(SHOP.hours) + '</p>');
    if (SHOP.phone) content.push('<a href="tel:' + esc(String(SHOP.phone).replace(/[^+0-9]/g,'')) +
      '">📞 ' + esc(SHOP.phone) + '</a>');
    if (SHOP.maps && safeUrl(SHOP.maps)) content.push('<a class="chip" target="_blank" rel="noopener" href="' +
      esc(safeUrl(SHOP.maps)) + '">' + esc(t('dir')) + '</a>');
    if (Array.isArray(SHOP.socials)) SHOP.socials.forEach(social => {
      const name = social.name || social[0];
      const url = safeUrl(social.url || social[1]);
      if (name && url) content.push('<a target="_blank" rel="noopener noreferrer" href="' +
        esc(url) + '">' + esc(name) + '</a>');
    });
    return '<h3 id="sheet-title">Wiffy Waffy</h3>' +
      (content.length ? content.join('') : '<p>' + esc(t('soon')) + '</p>');
  }

  function render() {
    paintLang();
    paintPromo();
    paintChips();
    paintList();
  }

  function openSheet(html) {
    previouslyFocused = document.activeElement;
    state.sheet = true;
    sheetFrame(html);
    document.body.classList.add('modal-open');
    app.inert = true;
    const close = modal.querySelector('.close-sheet');
    if (close) close.focus();
    if (window.WiffyMotion) window.WiffyMotion.sheetOpen();
  }

  function finishCloseSheet() {
    state.sheet = false;
    modal.innerHTML = '';
    document.body.classList.remove('modal-open');
    app.inert = false;
    if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
    previouslyFocused = null;
  }

  function closeSheet() {
    if (!state.sheet) return;
    if (window.WiffyMotion) window.WiffyMotion.sheetClose(finishCloseSheet);
    else finishCloseSheet();
  }

  function openDetail(item) {
    openSheet(`<div class="tile big product-photo"><img src="assets/products/4k/${esc(item[0])}.webp?v=2" alt="" width="240" height="240"></div>` +
      `<h3 id="sheet-title">${esc(itemName(item))}</h3><p>${esc(itemDesc(item))}</p>` +
      `<div class="price">${esc(money(item[3]))}</div>` +
      `<p class="allergen"><strong>${esc(t('allergens'))}</strong> · ${esc(t('allergenText'))}</p>`);
  }

  function openMixer() {
    state.picks = [];
    openSheet(mixerHtml());
  }

  function sheetFrame(inner) {
    modal.innerHTML = '<div class="modal-backdrop" data-close="true"></div>' +
      '<section class="box bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">' +
      '<button type="button" class="ib close close-sheet" data-close="true" aria-label="' + esc(t('close')) + '">×</button>' +
      inner + '</section>';
  }

  function mixerHtml() {
    const left = FLAVOURS[state.picks[0]]?.[0] || '#e3c49a';
    const right = FLAVOURS[state.picks[1]]?.[0] || '#fff2cf';
    const waffle = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 14Q10 22 10 66Q30 80 50 80z" fill="${left}" stroke="#0A2540" stroke-width="3"/><path d="M50 14Q90 22 90 66Q70 80 50 80z" fill="${right}" stroke="#0A2540" stroke-width="3"/><path d="M30 20v56M50 14v66M70 20v56M14 44h72M12 60h76" stroke="#0A2540" stroke-opacity=".3" stroke-width="3"/></svg>`;
    const chosenNames = state.picks.map(i => FLAVOURS[i][1 + LI[state.lang]]);
    return '<div class="tile big">' + waffle + '</div><h3 id="sheet-title">' + esc(t('mix')) + '</h3>' +
      '<p>' + esc(state.lang === 'zh' ? '可重复选择，第三次点击会替换最早的口味。' :
      state.lang === 'ms' ? 'Boleh pilih perisa sama; pilihan ketiga menggantikan yang pertama.' :
      'Duplicates welcome. Your third pick replaces the oldest.') + '</p>' +
      '<p class="mix-selection" aria-live="polite">' +
      esc(chosenNames.length ? chosenNames.join(' + ') : (state.lang === 'zh' ? '请选择两种口味' :
      state.lang === 'ms' ? 'Sila pilih dua perisa' : 'Choose two flavours')) + '</p>' +
      '<div class="flavours">' + FLAVOURS.map((flavour, i) =>
        '<button type="button" class="flavour ' + (state.picks.includes(i) ? 'picked' : '') +
        '" data-flavour="' + i + '"><span class="flavour-dot" style="background:' +
        esc(flavour[0]) + '"></span><span>' + esc(flavour[1 + LI[state.lang]]) +
        '</span><span class="pick-count">' + state.picks.filter(p => p === i).length +
        '</span></button>'
      ).join('') + '</div><div class="mixer-total"><strong>' + money(7.9) +
      '</strong><span>' + state.picks.length + ' / 2</span></div>';
  }

  document.addEventListener('click', event => {
    const lang = event.target.closest('[data-lang]');
    if (lang) {
      if (lang.dataset.lang === state.lang) return;
      state.lang = lang.dataset.lang;
      saveLang(state.lang);
      render();
      window.WiffyMotion?.language(lang, list);
      return;
    }
    if (event.target.closest('#loc')) {
      openSheet(infoHtml());
      return;
    }
    if (event.target.closest('[data-go="classic"]')) {
      document.getElementById('s-classic')?.scrollIntoView({ behavior: 'smooth' });
      openMixer();
      return;
    }
    const cat = event.target.closest('[data-cat]');
    if (cat) {
      state.cat = cat.dataset.cat;
      paintChips();
      paintList();
      if (state.cat === 'all') window.scrollTo({ top: 0, behavior: 'smooth' });
      else document.getElementById('s-' + state.cat)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const product = event.target.closest('[data-id]');
    if (product) {
      const id = product.dataset.id;
      if (id === 'classic-mix') openMixer();
      else {
        const item = MENU.find(m => m[0] === id);
        if (item) openDetail(item);
      }
      return;
    }
    const flavour = event.target.closest('[data-flavour]');
    if (flavour && modal.contains(flavour)) {
      state.picks.push(Number(flavour.dataset.flavour));
      if (state.picks.length > 2) state.picks.shift();
      const previously = flavour.dataset.flavour;
      const scrollTop = modal.querySelector('.box').scrollTop;
      sheetFrame(mixerHtml());
      modal.querySelector('.box').scrollTop = scrollTop;
      const current = modal.querySelector('[data-flavour="' + previously + '"]');
      if (current) current.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-close]')) closeSheet();
  });

  search.addEventListener('input', event => {
    state.q = event.target.value;
    paintList();
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

  document.addEventListener('DOMContentLoaded', render, { once: true });
})();

(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const done = () => {
    splash.remove();
    document.body.style.overflow = '';
  };
  if (document.documentElement.classList.contains('nosplash')) {
    done();
    return;
  }

  sessionStorage.splash = 1;
  document.body.style.overflow = 'hidden';
  const out = () => {
    splash.classList.add('out');
    splash.addEventListener('animationend', event => {
      if (event.target === splash) done();
    });
  };
  const timer = setTimeout(out, 2900);
  splash.addEventListener('click', () => {
    clearTimeout(timer);
    out();
  }, { once: true });
})();
