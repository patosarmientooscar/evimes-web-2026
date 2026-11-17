/* Zona 03 — Diseño Web. Sala de cristal I, en panorama 360°.
   Todo el recorrido (paradas, anclas de cartelas, pantallas, rótulo, luces)
   vive en config.salas['diseno-web'] y lo mueve js/engine/pano.js.
   Los textos salen de content.disenoWeb. La sala está vacía: las personas
   se añadirán sobre este mismo panorama (las sillas quedan sin cartelas). */
(function () {
  var EV = window.EV;
  EV.zoneScripts['diseno-web'] = {
    init: function (zone) {
      if (EV.pano) EV.pano.room(zone, { texto: 'disenoWeb' });
    }
  };
})();
