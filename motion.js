/* Optional motion layer. The menu still works if GSAP CDN is unavailable. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = { heroSplit: null, brandSplit: null, heroTimeline: null, brandTween: null,
    badgeTween: null, cardsTween: null, sheetTimeline: null, generation: 0, closing: false };
  const canAnimate = () => !reducedMotion.matches && typeof window.gsap !== 'undefined';
  const engine = () => window.gsap;

  function kill(key) {
    if (motion[key]) {
      motion[key].kill();
      motion[key] = null;
    }
  }
  function resetTitles() {
    motion.generation += 1;
    kill('heroTimeline');
    kill('brandTween');
    kill('badgeTween');
    kill('cardsTween');
    if (motion.heroSplit) { motion.heroSplit.revert(); motion.heroSplit = null; }
    if (motion.brandSplit) { motion.brandSplit.revert(); motion.brandSplit = null; }
  }

  // The hero title completes the requested full drop / settle / hold / drop-out cycle.
  // This repeats only on the small hero title, never on menu information or controls.
  function elasticTitle() {
    const target = document.querySelector('.elastic-title');
    if (!target || !canAnimate() || !window.SplitText) return;
    const split = window.SplitText.create(target, { type: 'words,chars' });
    motion.heroSplit = split;
    const chars = split.chars;
    if (!chars.length) return;
    const gsap = engine();
    gsap.set(chars, { transformOrigin: '50% 100%', willChange: 'transform,opacity' });
    motion.heroTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.25 })
      .from(chars, {
        y: -108, rotation: () => gsap.utils.random(-28, 28), scale: 0.65,
        autoAlpha: 0, duration: 1.15, ease: 'elastic.out(1,0.35)',
        stagger: { each: 0.065, from: 'random' }
      })
      .to({}, { duration: 2.5 })
      .to(chars, {
        y: 100, rotation: () => gsap.utils.random(-18, 18), autoAlpha: 0,
        scale: 0.82, duration: 0.5, ease: 'power2.in', stagger: 0
      });
  }

  function brandEntrance() {
    if (!canAnimate()) return;
    const gsap = engine();
    const logo = document.querySelector('.brand-mark');
    if (logo) motion.badgeTween = gsap.fromTo(logo,
      { y: -32, rotation: -25, scale: 0.7, opacity: 0 },
      { y: 0, rotation: -5, scale: 1, opacity: 1, duration: 1.05,
        ease: 'elastic.out(1,0.45)', clearProps: 'opacity,transform' });
    const title = document.querySelector('.brand-copy h1');
    if (title && window.SplitText) {
      motion.brandSplit = window.SplitText.create(title, { type: 'words,chars' });
      const split = motion.brandSplit;
      motion.brandTween = gsap.from(split.chars, {
        y: -51, rotation: () => gsap.utils.random(-22, 22), scale: 0.6, autoAlpha: 0,
        duration: 1.1, ease: 'elastic.out(1,0.35)',
        stagger: { each: 0.045, from: 'random' },
        onComplete: () => {
          if (motion.brandSplit === split) {
            split.revert();
            motion.brandSplit = null;
          }
        }
      });
    }
  }

  function cardEntrance() {
    if (!canAnimate()) return;
    const cards = document.querySelectorAll('.product-card');
    kill('cardsTween');
    if (!cards.length) return;
    motion.cardsTween = engine().fromTo(cards,
      { y: 20, scale: 0.965, autoAlpha: 0 },
      { y: 0, scale: 1, autoAlpha: 1, duration: 0.58, stagger: 0.055,
        ease: 'back.out(1.65)', clearProps: 'opacity,visibility,transform' });
  }

  function page() {
    resetTitles();
    if (!canAnimate()) return;
    // Delay splitting until the font is ready, without delaying page interaction.
    const generation = motion.generation;
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.resolve(ready).then(() => {
      if (generation !== motion.generation || !canAnimate()) return;
      if (window.SplitText) engine().registerPlugin(window.SplitText);
      brandEntrance();
      elasticTitle();
    }).catch(() => {});
    cardEntrance();
    const info = document.querySelector('.info-view');
    if (info) engine().fromTo(info, { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.3)', clearProps: 'opacity,transform' });
  }

  function sheetOpen() {
    if (!canAnimate()) return;
    kill('sheetTimeline');
    const gsap = engine();
    const backdrop = document.querySelector('#modal .modal-backdrop');
    const sheet = document.querySelector('#modal .bottom-sheet');
    if (!sheet) return;
    motion.sheetTimeline = gsap.timeline()
      .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.26 }, 0)
      .fromTo(sheet, { yPercent: 110, scaleY: 0.93 },
        { yPercent: 0, scaleY: 1, duration: 0.87,
          transformOrigin: '50% 100%', ease: 'elastic.out(1,0.56)',
          clearProps: 'transform' }, 0.02);
  }

  function sheetClose(done) {
    if (motion.closing) return;
    if (!canAnimate() || !document.querySelector('#modal .bottom-sheet')) {
      done();
      return;
    }
    motion.closing = true;
    kill('sheetTimeline');
    const gsap = engine();
    const sheet = document.querySelector('#modal .bottom-sheet');
    const backdrop = document.querySelector('#modal .modal-backdrop');
    motion.sheetTimeline = gsap.timeline({ onComplete: () => {
      motion.closing = false;
      motion.sheetTimeline = null;
      done();
    }})
      .to(sheet, { yPercent: 108, scaleY: 0.96, opacity: 0.65,
        duration: 0.29, ease: 'power2.in' }, 0)
      .to(backdrop, { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0);
  }

  function mixPicked() {
    if (!canAnimate()) return;
    const gsap = engine();
    const waffle = document.querySelector('#modal .mix-waffle');
    const selection = document.querySelector('#modal .mix-selection');
    const choices = document.querySelectorAll('#modal .flavour.picked');
    if (waffle) gsap.fromTo(waffle, { scale: 0.85, rotation: -9 },
      { scale: 1, rotation: 0, duration: 0.75, ease: 'elastic.out(1,0.4)',
        clearProps: 'transform' });
    if (selection) gsap.fromTo(selection, { y: 9, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)',
        clearProps: 'opacity,transform' });
    if (choices.length) gsap.fromTo(choices, { scale: 0.95 },
      { scale: 1, duration: 0.55, stagger: 0.06, ease: 'elastic.out(1,0.5)',
        clearProps: 'transform' });
  }

  // Delegation also covers controls created later by the menu and bottom sheets.
  function interactiveTarget(event) {
    return event.target instanceof Element ? event.target.closest('button:not(:disabled),a.chip') : null;
  }
  function squish(event) {
    if (reducedMotion.matches) return;
    const button = interactiveTarget(event);
    if (button) button.classList.add('is-squished');
  }
  function springBack(event) {
    const button = interactiveTarget(event);
    if (!button) return;
    button.classList.remove('is-squished');
    if (reducedMotion.matches) return;
    button.classList.remove('jelly-pop');
    // Force a restart when the same control is pressed repeatedly.
    void button.offsetWidth;
    button.classList.add('jelly-pop');
    window.setTimeout(() => { if (button.isConnected) button.classList.remove('jelly-pop'); }, 690);
  }
  document.addEventListener('pointerdown', squish, { passive: true });
  document.addEventListener('pointerup', springBack, { passive: true });
  document.addEventListener('pointercancel', springBack, { passive: true });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) squish(event);
  });
  document.addEventListener('keyup', event => {
    if (event.key === 'Enter' || event.key === ' ') springBack(event);
  });
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        resetTitles();
        document.querySelectorAll('.jelly-pop,.is-squished').forEach(el =>
          el.classList.remove('jelly-pop', 'is-squished'));
      } else {
        page();
      }
    });
  }
  window.WiffyMotion = { page, beforePageUpdate: resetTitles, cardEntrance, sheetOpen, sheetClose, mixPicked };
})();