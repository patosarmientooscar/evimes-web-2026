/* ==========================================================================
   growth.js — Crecimiento: las luces de Madrid.
   Puntos cian que se encienden, uno a uno, en las ventanas de los edificios
   que se ven desde el ventanal de una sala (config.salas[id].luces).
   Cada punto está anclado a su ventana (yaw, pitch) y se queda encendido:
   la ciudad que te encuentra. Reversible con el scroll.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  EV.growth = {
    mount: function (room, layer, api) {
      var cfg = room.cfg.luces;
      var pts = cfg.puntos || [];
      var dots = pts.map(function (q) {
        var d = document.createElement('span');
        d.className = 'luz-madrid';
        d.setAttribute('aria-hidden', 'true');
        layer.appendChild(d);
        return { el: d, q: q, o: '', t: '' };
      });
      // Orden de encendido fijo pero no lineal (no parece una barra de carga).
      var order = [2, 5, 0, 7, 3, 1, 6, 4];

      EV.overlay.add({
        zone: room.id,
        progress: api.progress,
        update: function (p, active) {
          if (!active) { this.hide(); return; }
          var w = api.win(cfg.parada);
          var a = w[2] - (w[3] - w[2]) * 0.1, b = w[3] - (w[3] - w[2]) * 0.15;
          var fade = api.fade();
          dots.forEach(function (d, i) {
            var k = order.indexOf(i % order.length) / dots.length;
            var t0 = a + (b - a) * k;
            var o = smooth(t0, t0 + 0.012, p) * fade;
            var s = o > 0.001 ? api.project(d.q[0], d.q[1]) : null;
            var os = s ? o.toFixed(3) : '0';
            if (os !== d.o) { d.o = os; d.el.style.opacity = os; }
            if (s) {
              var ts = 'translate3d(' + s[0].toFixed(1) + 'px,' + s[1].toFixed(1) + 'px,0)';
              if (ts !== d.t) { d.t = ts; d.el.style.transform = ts; }
            }
          });
        },
        hide: function () { dots.forEach(function (d) { if (d.o !== '0') { d.o = '0'; d.el.style.opacity = '0'; } }); }
      });
    }
  };
})();
