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

  // ---- typed shell steps ------------------------------------------------
  function initSteps() {
    const steps = document.querySelectorAll('.step');
    if (!steps.length) return;

    if (reduceMotion || noIO) {
      steps.forEach(s => {
        const out = s.querySelector('.out');
        if (out) out.style.opacity = 1;
      });
      return;
    }

    steps.forEach(step => {
      const cmdEl = step.querySelector('.cmd[data-type]');
      const out = step.querySelector('.out');
      if (out) { out.style.opacity = '0'; out.style.transform = 'translateY(8px)'; out.style.transition = 'opacity .55s ease, transform .55s cubic-bezier(.2,.6,.2,1)'; }
      if (cmdEl) { step.dataset.text = cmdEl.textContent; cmdEl.textContent = ''; }
    });

    const revealOut = (out) => { if (!out) return; out.style.opacity = '1'; out.style.transform = 'none'; };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const step = entry.target;
        observer.unobserve(step);
        playStep(step);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -12% 0px' });

    async function playStep(step) {
      const cmdEl = step.querySelector('.cmd[data-type]');
      const out = step.querySelector('.out');
      if (!cmdEl) { revealOut(out); return; }

      const text = step.dataset.text || '';
      const cursor = document.createElement('span');
      cursor.className = 'term-cursor';
      cmdEl.after(cursor);

      for (const ch of text) {
        cmdEl.textContent += ch;
        await wait(40 + Math.random() * 34);
      }
      await wait(180);
      cursor.remove();
      await wait(120);
      revealOut(out);
    }

    steps.forEach(s => observer.observe(s));
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

  function init() { initScrollTop(); initBanner(); initSteps(); initAnchors(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
