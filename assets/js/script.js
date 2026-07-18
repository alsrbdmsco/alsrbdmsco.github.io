// ============================================================
// 1nfra.kr — Editorial redesign interactions
// Scroll reveals, rule draw-in, terminal typing.
// All content is static in the HTML; JS only adds motion,
// so the page is fully readable with JS disabled.
// ============================================================

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Scroll reveal + rule draw ----------------------------------------
  function initReveals() {
    const items = document.querySelectorAll('.reveal, .rule');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('in'), delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    // Stagger siblings within the same section for a gentle cascade.
    document.querySelectorAll('.spec, .certs tbody, .links').forEach(group => {
      Array.from(group.querySelectorAll('.reveal')).forEach((el, i) => {
        el.dataset.delay = Math.min(i * 55, 440);
      });
    });

    items.forEach(el => observer.observe(el));
  }

  // ---- Terminal typing ---------------------------------------------------
  function initTerminal() {
    const body = document.getElementById('term-body');
    if (!body) return;

    const lines = Array.from(body.children);
    // reduced-motion / no-IO: leave the static content as-is.
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    // Collapse everything; typing will reveal line by line.
    lines.forEach(el => { el.style.display = 'none'; });

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function play() {
      for (const el of lines) {
        const cmd = el.querySelector('.cmd');
        if (el.classList.contains('ln') && cmd) {
          const text = cmd.textContent;
          cmd.textContent = '';
          const cursor = document.createElement('span');
          cursor.className = 'term-cursor';
          el.appendChild(cursor);
          el.style.display = '';
          for (const ch of text) {
            cmd.textContent += ch;
            await wait(42 + Math.random() * 34);
          }
          await wait(240);
          cursor.remove();
        } else {
          // output line, or the final idle prompt (kept as-is)
          el.style.display = '';
          await wait(120);
        }
      }
    }

    const trigger = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        trigger.disconnect();
        play();
      }
    }, { threshold: 0.4 });
    trigger.observe(body);
  }

  // ---- Smooth-scroll for in-page anchors (respects reduced-motion) -------
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      if (anchor.classList.contains('skip-link')) return;
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        history.replaceState(null, '', id);
      });
    });
  }

  function init() {
    initReveals();
    initTerminal();
    initAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
