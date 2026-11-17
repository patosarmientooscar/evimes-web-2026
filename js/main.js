/* ==========================================================================
   main.js — arranque. Orden del tick único (gsap.ticker):
     1. Lenis.raf            (prioritario, en lenis.js) → ScrollTrigger.update
     2. zones.flush          progreso de la oficina → escenario
     3. stage.render         cámara, panorama (Three.js) y capas pegadas a él
     4. overlay.update       scrims de los bloques de texto
   ========================================================================== */
(function () {
  var EV = window.EV;

  /* Textos desde js/content.js (el HTML lleva el mismo texto para SEO/no-JS). */
  function bindContent() {
    document.querySelectorAll('[data-c]').forEach(function (el) {
      var v = EV.util.content(el.dataset.c);
      if (typeof v === 'string' && el.textContent !== v) el.textContent = v;   // no repintar el H1 (LCP)
    });
  }

  function boot() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    bindContent();
    EV.scroll.init();
    EV.stage.init(document.querySelector('.scene'));
    EV.zones.init();
    EV.oficina.init(EV.zones.get('oficina'));
    EV.overlay.applyScrims(EV.zones.get('oficina'));
    EV.secciones.init();
    EV.fallback.init();
    EV.header.init();

    gsap.ticker.add(function () {
      EV.zones.flush();
      EV.stage.render();
      EV.overlay.update();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); EV.stage.invalidate(); });
    }
    // Ancla en la URL al cargar (p. ej. /#planes).
    var h = location.hash.slice(1);
    if (h && document.getElementById(h)) setTimeout(function () { EV.nav.go(h); }, 60);
    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
