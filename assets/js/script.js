(function () {
  'use strict';

  var en = document.documentElement.lang === 'en';

  document.querySelectorAll('[data-since]').forEach(function (el) {
    var s = el.dataset.since.split('-').map(Number);
    var from = new Date(s[0], s[1] - 1, s[2]), now = new Date();
    var months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
    if (now.getDate() < from.getDate()) months--;
    if (months < 0) return;
    var y = Math.floor(months / 12), m = months % 12;
    var dur = (en
      ? [y && y + (y > 1 ? ' yrs' : ' yr'), m && m + (m > 1 ? ' mos' : ' mo')]
      : [y && y + '년', m && m + '개월']
    ).filter(Boolean).join(' ');
    el.textContent = s[0] + '.' + String(s[1]).padStart(2, '0') + (en ? ' – Present' : ' ~ 현재') + (dur ? ' · ' + dur : '');
  });

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || still) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        setTimeout(function () { e.target.classList.add('in'); }, n++ * 70);
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }
  document.documentElement.classList.add('io');

  var nav = document.querySelector('.nav');
  if (nav) {
    var update = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  var viz = document.querySelector('.viz');
  var scene = viz && viz.querySelector('.scene');
  var hero = document.querySelector('.hero');
  if (scene && hero && !still) {
    var raf = 0;
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !viz.offsetWidth) return;
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        scene.style.transform = 'translate(' + (x * 12).toFixed(2) + 'px,' + (y * 9).toFixed(2) + 'px)';
      });
    });
    hero.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      scene.style.transform = '';
    });
  }
})();
