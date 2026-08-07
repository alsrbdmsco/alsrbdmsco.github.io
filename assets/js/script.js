(function () {
  'use strict';

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el) {
    var target = parseInt(el.textContent, 10);
    if (isNaN(target) || el.dataset.done) return;
    el.dataset.done = '1';
    if (still) return;

    var dur = 900, start = null, ended = false;
    el.textContent = '0';
    requestAnimationFrame(function step(now) {
      if (ended) return;
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    });
    setTimeout(function () { ended = true; el.textContent = target; }, dur + 250);
  }

  document.querySelectorAll('[data-since]').forEach(function (el) {
    var s = el.dataset.since.split('-').map(Number);
    var from = new Date(s[0], s[1] - 1, s[2]), now = new Date();
    var months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
    if (now.getDate() < from.getDate()) months--;
    if (months < 0) return;
    var y = Math.floor(months / 12), m = months % 12;
    var dur = (y ? y + '년' : '') + (y && m ? ' ' : '') + (m ? m + '개월' : '');
    el.textContent = s[0] + '.' + String(s[1]).padStart(2, '0') + ' ~ · ' + (dur || '이번 달');
  });

  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || still) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        setTimeout(function () {
          e.target.classList.add('in');
          e.target.querySelectorAll('[data-count]').forEach(countUp);
        }, i * 70);
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  var nav = document.querySelector('.nav');
  if (nav) {
    var update = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }
})();
