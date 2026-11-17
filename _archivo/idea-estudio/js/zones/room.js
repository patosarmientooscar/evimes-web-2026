/* ==========================================================================
   room.js — utilidades compartidas por los scripts de zona.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});
  EV.zoneScripts = EV.zoneScripts || {};

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function expoOut(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  EV.util = {
    clamp01: clamp01,
    expoOut: expoOut,
    /* 0→1 dentro de [a,b] */
    range: function (p, a, b) { return clamp01((p - a) / (b - a)); },
    /* Lee "a.b.0" de EVIMES_CONTENT */
    content: function (path) {
      return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, window.EVIMES_CONTENT);
    },
    /* Revela un título con clip-path de abajo arriba y lo retira con opacidad. */
    titleReveal: function (el, p, inA, inB, outA, outB) {
      if (EV.mode !== 'cine') return;
      var i = expoOut(EV.util.range(p, inA, inB));
      var o = 1 - EV.util.range(p, outA, outB);
      el.style.clipPath = 'inset(' + ((1 - i) * 100).toFixed(2) + '% 0 0 0)';
      el.style.opacity = o.toFixed(3);
    }
  };

  /* Sala de servicio: rótulo + cartela principal (texto y técnica) + una
     cartela por servicio, repartidas a lo largo del progreso de la zona. */
  EV.room = function (id, key, layout) {
    EV.zoneScripts[id] = EV.zoneScripts[id] || {};
    var prev = EV.zoneScripts[id].init;
    EV.zoneScripts[id].init = function (zone) {
      if (prev) prev(zone);
      var data = EV.util.content(key);
      var layer = zone.stage.querySelector('.layer--cartelas');
      var title = zone.stage.querySelector('.room__title');

      EV.overlay.cartela({
        zone: id, parent: layer, range: [0.12, 0.5],
        objeto: data.rotulo, texto: data.texto, tecnica: data.tecnica,
        x: layout.main.x, y: layout.main.y, xm: layout.main.xm, ym: layout.main.ym, side: layout.main.side
      });

      var items = data.cartelas;
      var start = 0.42, end = 0.94;
      var step = (end - start) / items.length;
      items.forEach(function (name, i) {
        var pos = layout.items[i % layout.items.length];
        var a = start + i * step;
        EV.overlay.cartela({
          zone: id, parent: layer, range: [a, Math.min(0.98, a + step * 2.2)],
          objeto: name, x: pos.x, y: pos.y, xm: pos.xm, ym: pos.ym, side: pos.side
        });
      });

      if (title) EV.zones.on(id, function (p) { EV.util.titleReveal(title, p, 0.02, 0.14, 0.4, 0.5); });
    };
  };
})();
