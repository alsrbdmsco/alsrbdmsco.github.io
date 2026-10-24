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

  var nav = document.querySelector('.nav');
  if (nav) {
    var update = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }
})();
