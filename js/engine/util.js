/* ==========================================================================
   util.js — utilidades compartidas (contenido por ruta, easings, rangos).
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  EV.util = {
    clamp: clamp,
    clamp01: function (v) { return clamp(v, 0, 1); },
    range: function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); },
    smooth: function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); },
    p2io: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    expoOut: function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    cubicOut: function (t) { return 1 - Math.pow(1 - t, 3); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    /* 'oficina.mesa.titulo' → texto en js/content.js */
    content: function (path) {
      var o = window.EVIMES_CONTENT;
      var parts = path.split('.');
      for (var i = 0; i < parts.length && o != null; i++) o = o[parts[i]];
      return o;
    },
    /* Escribe un estilo solo si cambia. */
    writer: function (el) {
      var cache = {};
      return function (prop, val) {
        if (cache[prop] === val) return;
        cache[prop] = val;
        el.style[prop] = val;
      };
    },
    /* Muelle (stiffness, damping) que sigue un objetivo; integrar por fotograma. */
    spring: function (k, c) {
      var s = { x: 0, v: 0, k: k || 170, c: c || 22 };
      s.step = function (target, dt) {
        dt = Math.min(dt, 1 / 20);
        // sub-pasos para estabilidad a dt grandes
        var n = dt > 1 / 50 ? 2 : 1, h = dt / n;
        for (var i = 0; i < n; i++) {
          var a = (target - s.x) * s.k - s.v * s.c;
          s.v += a * h;
          s.x += s.v * h;
        }
        if (Math.abs(s.x - target) < 1e-4 && Math.abs(s.v) < 1e-3) { s.x = target; s.v = 0; }
        return s.x;
      };
      s.set = function (v) { s.x = v; s.v = 0; };
      return s;
    },
    /* Color medio de una imagen (para el reflejo del monitor). → 'rgb(r g b)' */
    averageColor: function (img) {
      try {
        var c = document.createElement('canvas'); c.width = 8; c.height = 8;
        var x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0, 8, 8);
        var d = x.getImageData(0, 0, 8, 8).data, r = 0, g = 0, b = 0;
        for (var i = 0; i < 64; i++) { r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; }
        return 'rgb(' + Math.round(r / 64) + ' ' + Math.round(g / 64) + ' ' + Math.round(b / 64) + ')';
      } catch (e) { return null; }
    }
  };
})();
