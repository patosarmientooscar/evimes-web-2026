/* ==========================================================================
   header.js — menú fijo de cristal y navegación por anclas.
   En modo cine, las anclas que viven dentro de la oficina (pinned) llevan
   al progreso exacto de su parada (p. ej. "Proyectos" = arco formado).
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  function targetY(id) {
    if (EV.mode === 'cine' && EV.oficina && EV.oficina.puntos[id] != null) {
      var z = EV.zones.get('oficina');
      if (z && z.st) return z.st.start + (z.st.end - z.st.start) * EV.oficina.puntos[id];
    }
    var t = document.getElementById(id);
    if (!t) return null;
    return t.getBoundingClientRect().top + (EV.scroll.lenis ? EV.scroll.lenis.scroll : window.scrollY);
  }

  EV.nav = {
    go: function (id) {
      if (id === 'inicio') id = 'inicio';
      var y = targetY(id === 'inicio' ? 'inicio' : id);
      if (y == null) return;
      if (EV.scroll.lenis) {
        var dist = Math.abs(y - EV.scroll.lenis.scroll);
        EV.scroll.lenis.scrollTo(y, { duration: Math.min(2.4, 0.8 + dist / 4000), force: true });
      } else window.scrollTo({ top: y, behavior: EV.reducedMotion ? 'auto' : 'smooth' });
      var t = document.getElementById(id);
      if (t && id !== 'inicio') {
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        setTimeout(function () { t.focus({ preventScroll: true }); }, 900);
      }
    }
  };

  EV.header = {
    init: function () {
      var menu = document.querySelector('.menu');
      var btn = menu.querySelector('.menu__abrir');
      var nav = menu.querySelector('.menu__nav');

      function setOpen(on) {
        menu.classList.toggle('is-abierto', on);
        btn.setAttribute('aria-expanded', String(on));
      }
      btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-abierto')) { setOpen(false); btn.focus(); } });

      document.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-ir]');
        if (!a) return;
        e.preventDefault();
        setOpen(false);
        EV.nav.go(a.dataset.ir);
        if (history.replaceState) history.replaceState(null, '', '#' + a.dataset.ir);
      });

      // El menú se vuelve más opaco al dejar el hero.
      var on = false;
      var check = function () {
        var y = EV.scroll.lenis ? EV.scroll.lenis.scroll : window.scrollY;
        var s = y > 40;
        if (s !== on) { on = s; menu.classList.toggle('is-scrolled', s); }
      };
      if (EV.scroll.lenis) EV.scroll.lenis.on('scroll', check); else window.addEventListener('scroll', check, { passive: true });
      check();
    }
  };
})();
