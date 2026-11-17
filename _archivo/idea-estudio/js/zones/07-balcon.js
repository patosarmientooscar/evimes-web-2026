/* Zona 07 — Balcón. Madrid de noche y la llamada final. */
(function () {
  var EV = window.EV;
  EV.zoneScripts['balcon'] = {
    init: function (zone) {
      var t = zone.stage.querySelector('.balcon__cta');
      if (EV.mode !== 'cine' || !t) return;
      EV.zones.on('balcon', function (p) { EV.util.titleReveal(t, p, 0.5, 0.72, 2, 3); });
    }
  };
})();
