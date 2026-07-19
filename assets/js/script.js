// ============================================================
// 1nfra.kr — CLI theme interactions
// Each section is a shell step: the command types itself when
// scrolled into view, then its output reveals. All content is
// static in the HTML, so the page is fully readable with JS off.
// ============================================================

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noIO = !('IntersectionObserver' in window);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // ---- banner reveal ----------------------------------------------------
  function initBanner() {
    const items = document.querySelectorAll('.banner .reveal');
    if (reduceMotion || noIO) { items.forEach(el => el.classList.add('in')); return; }
    items.forEach((el, i) => setTimeout(() => el.classList.add('in'), 120 + i * 140));
  }

  // ---- typed shell steps (sequential, like a real session) --------------
  function initSteps() {
    const steps = Array.from(document.querySelectorAll('.step'));
    const idle = document.querySelector('.cmd-line.idle');
    if (!steps.length) return;

    if (reduceMotion || noIO) {
      steps.forEach(s => { const out = s.querySelector('.out'); if (out) out.style.opacity = 1; });
      return;
    }

    // Hide every step and blank its command; a driver replays them in order.
    steps.forEach(step => {
      step.style.opacity = '0';
      const cmdEl = step.querySelector('.cmd[data-type]');
      const out = step.querySelector('.out');
      if (cmdEl) { step.dataset.text = cmdEl.textContent; cmdEl.textContent = ''; }
      if (out) { out.style.opacity = '0'; out.style.transform = 'translateY(6px)'; out.style.transition = 'opacity .5s ease, transform .5s cubic-bezier(.2,.6,.2,1)'; }
    });
    if (idle) idle.style.opacity = '0';

    // Gate each step on being scrolled near the viewport, so steps far below
    // wait for the reader instead of racing ahead off-screen.
    const seen = new Set();
    const waiters = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        seen.add(e.target);
        const w = waiters.get(e.target);
        if (w) { w(); waiters.delete(e.target); }
        io.unobserve(e.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
    steps.forEach(s => io.observe(s));
    const whenVisible = (step) => seen.has(step) ? Promise.resolve() : new Promise(res => waiters.set(step, res));

    async function playStep(step) {
      step.style.transition = 'opacity .3s ease';
      step.style.opacity = '1';
      const cmdEl = step.querySelector('.cmd[data-type]');
      const out = step.querySelector('.out');

      if (cmdEl) {
        const text = step.dataset.text || '';
        const cursor = document.createElement('span');
        cursor.className = 'term-cursor';
        cmdEl.after(cursor);
        for (const ch of text) {
          cmdEl.textContent += ch;
          await wait(42 + Math.random() * 34);
        }
        await wait(200);
        cursor.remove();
        await wait(140);
      }
      if (out) { out.style.opacity = '1'; out.style.transform = 'none'; }
      await wait(420);
    }

    (async () => {
      await wait(560); // let the login banner settle first
      for (const step of steps) {
        await whenVisible(step);
        await playStep(step);
      }
      if (idle) { idle.style.transition = 'opacity .3s ease'; idle.style.opacity = '1'; }
    })();
  }

  // ---- smooth in-page anchors ------------------------------------------
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      if (a.classList.contains('skip-link')) return;
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
        // intentionally do NOT write the hash to the URL, so a refresh
        // always reopens the page from the top (a fresh terminal session)
      });
    });
  }

  // Always start a refresh at the top: disable the browser's scroll
  // restoration and clear any leftover hash before it can jump.
  function initScrollTop() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    window.scrollTo(0, 0);
  }

  // ---- scroll cue: show a small hint while there's more below -----------
  function initScrollCue() {
    const cue = document.querySelector('.scroll-cue');
    if (!cue) return;
    const canScroll = () => (document.documentElement.scrollHeight - window.innerHeight) > 80;
    const update = () => {
      if (window.scrollY < 40 && canScroll()) cue.classList.add('show');
      else cue.classList.remove('show');
    };
    setTimeout(update, 1000); // appear after the first commands have run
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  function init() { initScrollTop(); initBanner(); initSteps(); initAnchors(); initScrollCue(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
