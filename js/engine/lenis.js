/* ==========================================================================
   lenis.js — Lenis conectado a gsap.ticker. Un único loop para todo.
   En modo "still" no hay Lenis: scroll nativo.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  EV.scroll = {
    lenis: null,

    init: function () {
      if (EV.mode !== 'cine' || typeof Lenis === 'undefined') return;
      var lenis = new Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        autoRaf: false
      });
      lenis.on('scroll', ScrollTrigger.update);
      // prioritize=true: Lenis corre primero en cada tick; después ScrollTrigger
      // y el render del motor leen una posición ya actualizada.
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); }, false, true);
      gsap.ticker.lagSmoothing(0);
      this.lenis = lenis;
    },

    to: function (y, opts) {
      if (this.lenis) this.lenis.scrollTo(y, Object.assign({ force: true }, opts || {}));
      else window.scrollTo({ top: y, behavior: (opts && opts.immediate) || EV.reducedMotion ? 'auto' : 'smooth' });
    },
    stop: function () { if (this.lenis) this.lenis.stop(); },
    start: function () { if (this.lenis) this.lenis.start(); }
  };
})();
