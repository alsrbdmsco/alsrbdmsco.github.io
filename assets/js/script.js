(function () {
  'use strict';

  var nav = document.querySelector('.nav');
  if (nav) {
    var update = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }
})();
