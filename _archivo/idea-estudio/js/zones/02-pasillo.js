/* Zona 02 — Pasillo. "Si no eres visible, / no existes." */
(function () {
  var EV = window.EV;
  EV.zoneScripts['pasillo'] = {
    init: function (zone) {
      var lines = zone.stage.querySelectorAll('.pasillo__lines span');
      var wrap = zone.stage.querySelector('.pasillo__lines');
      if (EV.mode !== 'cine') return;
      EV.zones.on('pasillo', function (p) {
        EV.util.titleReveal(lines[0], p, 0.12, 0.3, 2, 3);
        EV.util.titleReveal(lines[1], p, 0.3, 0.48, 2, 3);
        wrap.style.opacity = (1 - EV.util.range(p, 0.78, 0.94)).toFixed(3);
      });
    }
  };
})();
