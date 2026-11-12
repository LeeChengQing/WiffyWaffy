/* Wiffy Waffy motion: one welcome animation; calm, tactile controls thereafter. */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const INTRO_KEY = 'wiffywaffy-intro-seen';
  const motion = { introAttempted: false, titleSplit: null, titleTween: null,
    sheetTween: null, closing: false };
  const hasGSAP = () => typeof window.gsap !== 'undefined';
  const canAnimate = () => !prefersReducedMotion.matches && hasGSAP();

  function hasPlayedIntro() {
    try { return window.sessionStorage.getItem(INTRO_KEY) === '1'; }
    catch (_) { return false; }
  }
  function markIntroPlayed() {
    try { window.sessionStorage.setItem(INTRO_KEY, '1'); } catch (_) {}
  }

  function clearTitleAnimation() {
    if (motion.titleTween) {
      motion.titleTween.kill();
      motion.titleTween = null;
    }
    if (motion.titleSplit) {
      motion.titleSplit.revert();
      motion.titleSplit = null;
    }
  }

  // Only the brand name animates, once per tab session, with no loop or exit.
  function page() {
    if (motion.introAttempted) return;
    motion.introAttempted = true;
    if (!canAnimate() || !window.SplitText || hasPlayedIntro()) return;

    const title = document.querySelector('.brand-copy h1');
    if (!title) return;
    const fontReady = document.fonts && document.fonts.ready ?
      document.fonts.ready : Promise.resolve();
    Promise.resolve(fontReady).then(() => {
      // User navigation is more important than finishing an intro animation.
      if (!title.isConnected || !canAnimate() || hasPlayedIntro()) return;
      window.gsap.registerPlugin(window.SplitText);
      motion.titleSplit = window.SplitText.create(title, { type: 'chars' });
      const split = motion.titleSplit;
      if (!split.chars.length) { clearTitleAnimation(); return; }

      markIntroPlayed();
      motion.titleTween = window.gsap.from(split.chars, {
        y: -38,
        rotation: () => window.gsap.utils.random(-12, 12),
        scale: 0.78,
        autoAlpha: 0,
        duration: 0.95,
        ease: 'elastic.out(1,0.52)',
        stagger: { each: 0.035, from: 'random' },
        onComplete: clearTitleAnimation
      });
    }).catch(clearTitleAnimation);
  }

  // A quick, unobtrusive bottom-sheet transition; no rubber-band oscillation.
  function sheetOpen() {
    if (!canAnimate()) return;
    if (motion.sheetTween) motion.sheetTween.kill();
    const sheet = document.querySelector('#modal .bottom-sheet');
    const backdrop = document.querySelector('#modal .modal-backdrop');
    if (!sheet || !backdrop) return;
    motion.sheetTween = window.gsap.timeline()
      .fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
      .fromTo(sheet, { yPercent: 100 }, {
        yPercent: 0, duration: 0.32, ease: 'power3.out',
        clearProps: 'transform'
      }, 0);
  }

  function sheetClose(done) {
    if (motion.closing) return;
    if (!canAnimate()) { done(); return; }
    const sheet = document.querySelector('#modal .bottom-sheet');
    const backdrop = document.querySelector('#modal .modal-backdrop');
    if (!sheet || !backdrop) { done(); return; }
    motion.closing = true;
    if (motion.sheetTween) motion.sheetTween.kill();
    motion.sheetTween = window.gsap.timeline({ onComplete() {
      motion.closing = false;
      motion.sheetTween = null;
      done();
    }})
      .to(sheet, { yPercent: 100, duration: 0.22, ease: 'power2.in' }, 0)
      .to(backdrop, { opacity: 0, duration: 0.2 }, 0);
  }

  // The same lightweight feedback works for pointer, touch and keyboard controls.
  function interactiveTarget(event) {
    return event.target instanceof Element ?
      event.target.closest('button:not(:disabled),a.chip') : null;
  }

  function bounce(button) {
    if (prefersReducedMotion.matches || !button || !button.isConnected) return;
    button.classList.remove('jelly-pop');
    // Restart the short feedback if the user taps twice quickly.
    void button.offsetWidth;
    button.classList.add('jelly-pop');
    window.setTimeout(() => {
      if (button.isConnected) button.classList.remove('jelly-pop');
    }, 520);
  }

  const pressed = new Map();
  function press(event) {
    if (prefersReducedMotion.matches) return;
    const button = interactiveTarget(event);
    if (!button) return;
    button.classList.add('is-squished');
    if (typeof event.pointerId === 'number') pressed.set(event.pointerId, button);
  }
  function release(event, cancelled = false) {
    const pointer = typeof event.pointerId === 'number' ? event.pointerId : null;
    const button = (pointer !== null && pressed.get(pointer)) || interactiveTarget(event);
    if (pointer !== null) pressed.delete(pointer);
    if (!button) return;
    button.classList.remove('is-squished');
    if (!cancelled) bounce(button);
  }
  document.addEventListener('pointerdown', press, { passive: true });
  document.addEventListener('pointerup', event => release(event), { passive: true });
  document.addEventListener('pointercancel', event => release(event, true), { passive: true });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) press(event);
  });
  document.addEventListener('keyup', event => {
    if (event.key === 'Enter' || event.key === ' ') release(event);
  });

  // Some controls are rendered anew on click. Transfer feedback to the new
  // control instead of animating a detached element (notably iPhone Safari).
  document.addEventListener('click', event => {
    const oldButton = interactiveTarget(event);
    if (!oldButton) return;
    const data = oldButton.dataset;
    const attr = ['lang', 'cat', 'tab', 'flavour'].find(key =>
      Object.prototype.hasOwnProperty.call(data, key));
    if (!attr) return;
    const value = data[attr];
    queueMicrotask(() => {
      const newButton = [...document.querySelectorAll('[data-' + attr + ']')]
        .find(button => button.dataset[attr] === value);
      if (newButton && newButton !== oldButton) bounce(newButton);
    });
  });

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', () => {
      if (prefersReducedMotion.matches) {
        clearTitleAnimation();
        document.querySelectorAll('.jelly-pop,.is-squished').forEach(button =>
          button.classList.remove('jelly-pop', 'is-squished'));
      }
    });
  }

  window.WiffyMotion = {
    page, beforePageUpdate: clearTitleAnimation, sheetOpen, sheetClose
  };
})();
