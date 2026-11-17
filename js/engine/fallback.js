/* ==========================================================================
   fallback.js — decide el modo de la experiencia ANTES de pintar.
   "cine"  : secuencias por scroll, pins, Lenis.
   "still" : una imagen fija por zona con fundidos suaves (movimiento reducido
             o conexión lenta / ahorro de datos).
   Forzar para pruebas: ?modo=fijo  |  ?modo=cine
   Se carga en <head>, sin dependencias.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  function detect() {
    var forced = new URLSearchParams(location.search).get('modo');
    if (forced === 'fijo') return { mode: 'still', reason: 'forzado' };
    if (forced === 'cine') return { mode: 'cine', reason: 'forzado' };

    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return { mode: 'still', reason: 'movimiento-reducido' };
    }
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c) {
      if (c.saveData) return { mode: 'still', reason: 'ahorro-datos' };
      if (/(^|-)(2g|3g)$/.test(c.effectiveType || '')) return { mode: 'still', reason: 'conexion-lenta' };
    }
    // Sin WebGL no hay panorama: versión fija.
    try {
      var cv = document.createElement('canvas');
      if (!(cv.getContext('webgl2') || cv.getContext('webgl'))) return { mode: 'still', reason: 'sin-webgl' };
    } catch (e) { return { mode: 'still', reason: 'sin-webgl' }; }
    return { mode: 'cine', reason: 'por-defecto' };
  }

  var d = detect();
  EV.mode = d.mode;
  EV.modeReason = d.reason;
  EV.reducedMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.documentElement.classList.add(d.mode === 'cine' ? 'is-cine' : 'is-still');

  /* Si el usuario cambia la preferencia de movimiento con la página abierta,
     recargamos en el modo correcto (un cambio de modo en caliente no compensa). */
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-reduced-motion: reduce)');
    var onChange = function () { if (!new URLSearchParams(location.search).get('modo')) location.reload(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  /* Modo fijo: una zona visible a la vez en el canvas, fundido entre zonas. */
  EV.fallback = {
    init: function () {
      if (EV.mode !== 'still') return;
      document.addEventListener('ev:zone', function (e) { if (e.detail.id) EV.stage.showStill(e.detail.id); });
    }
  };
})();
