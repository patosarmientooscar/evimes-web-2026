/* ==========================================================================
   stage.js — qué se ve detrás de las capas HTML, zona a zona.

   Sustituye a sequence.js (ahora sequence-legacy.js, desconectado): ya no
   hay vídeos ni secuencias de fotogramas. Cada zona registra un "escenario":
     - Fachada: foto fija 4K con cámara en código (js/zones/01-fachada.js).
     - Salas:   panorama 360° en Three.js (js/engine/pano.js).
     - El resto, hasta tener su escena: fondo navy y una nota discreta.

   API (la que usan zones.js, overlay.js y fallback.js):
     register(id, handler)  handler: { activate(on), render(p), key(),
                             luminanceUnder(rect), whenReady(), still() }
     setActive(id) · set(id, p) · render() · invalidate()
     variant() · drawn() · luminanceUnder(rect) · whenReady(id, ms) · showStill(id)
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  // Misma regla que <picture>/<link rel=preload> del HTML.
  var MOBILE_MQ = window.matchMedia('(max-width: 767px), (orientation: portrait)');

  var handlers = {};
  var activeId = null;
  var want = {};       // id -> progreso pedido
  var canvas = null;
  var notes = {};

  function placeholderNote(id) {
    if (notes[id] || handlers[id]) return;
    var z = EV.zones && EV.zones.get(id);
    if (!z) return;
    var el = document.createElement('p');
    el.className = 'zone__pendiente';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = z.cfg.label + ' · escena pendiente';
    z.stage.appendChild(el);
    notes[id] = el;
  }

  EV.stage = {
    init: function (c) { canvas = c; },
    canvas: function () { return canvas; },

    register: function (id, h) {
      handlers[id] = h;
      if (notes[id]) { notes[id].remove(); delete notes[id]; }
      if (activeId === id && h.activate) h.activate(true);
    },
    handler: function (id) { return handlers[id]; },

    variant: function () { return MOBILE_MQ.matches ? 'mobile' : 'desktop'; },
    onVariant: function (fn) {
      if (MOBILE_MQ.addEventListener) MOBILE_MQ.addEventListener('change', fn);
      else MOBILE_MQ.addListener(fn);
    },

    setActive: function (id) {
      if (id === activeId) return;
      var prev = handlers[activeId];
      activeId = id;
      if (prev && prev.activate) prev.activate(false);
      var h = handlers[id];
      if (h && h.activate) h.activate(true);
    },
    active: function () { return activeId; },

    set: function (id, p) { want[id] = p; },
    progress: function (id) { return want[id] || 0; },

    /* Una vez por tick, después de zones.flush. */
    render: function () {
      for (var id in handlers) {
        var h = handlers[id];
        if (h.render) h.render(want[id] == null ? 0 : want[id], id === activeId);
      }
    },
    invalidate: function () {
      for (var id in handlers) if (handlers[id].invalidate) handlers[id].invalidate();
    },

    /* Para el scrim: clave que cambia cuando cambia la imagen bajo el texto. */
    drawn: function () {
      var h = handlers[activeId];
      return { id: activeId, frame: 0, key: activeId + ':' + (h && h.key ? h.key() : '0') };
    },
    luminanceUnder: function (rect) {
      var h = handlers[activeId];
      if (h && h.luminanceUnder) return h.luminanceUnder(rect);
      return 0.004; // fondo navy
    },

    whenReady: function (id, ms) {
      var h = handlers[id];
      var p = h && h.whenReady ? h.whenReady() : Promise.resolve();
      return Promise.race([p, new Promise(function (r) { setTimeout(r, ms || 1200); })]);
    },

    /* Modo fijo: cada escenario decide cómo se ve quieto. */
    showStill: function (id) {
      this.setActive(id);
      var h = handlers[id];
      if (h && h.still) h.still();
    }
  };
})();
