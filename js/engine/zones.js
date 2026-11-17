/* ==========================================================================
   zones.js — cada zona es una sección pinned de ScrollTrigger.

   Estructura:  <section class="zone" data-zone="id"><div class="zone__stage">…
   - Se pina .zone__stage durante `screens` × alto de viewport.
   - Cada .zone siguiente sube 100vh (CSS), así el pin de N+1 empieza
     exactamente donde acaba el de N: el progreso es continuo y la cámara
     nunca "desliza" entre salas.
   - Expone el progreso 0–1 de cada zona a las capas HTML:
       EV.zones.on('diseno-web', function (p) { … })
     Los oyentes se llaman dentro del tick único, nunca en el evento de scroll.
   - Evento 'ev:zone' en document cuando cambia la zona activa.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  var list = [];          // { cfg, index, section, stage, st, progress, dirty }
  var byId = {};
  var listeners = {};
  var activeId = null;
  var jumping = false;

  function setActive(id) {
    if (id === activeId) return;
    var prev = byId[activeId];
    if (prev) prev.section.classList.remove('is-active');
    activeId = id;
    var z = byId[id];
    if (z) { z.section.classList.add('is-active'); z.dirty = true; }
    if (!jumping) EV.stage.setActive(id);
    document.dispatchEvent(new CustomEvent('ev:zone', { detail: { id: id, index: z ? z.index : -1, label: z ? z.cfg.label : '' } }));
  }

  // Zona activa = la última cuyo pin contiene el scroll actual. Pasada la
  // última zona (más de una pantalla por debajo de su pin) no hay ninguna:
  // el escenario se libera.
  function resolveActive() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (EV.scroll.lenis) y = EV.scroll.lenis.scroll;
    var pick = list[0];
    for (var i = 0; i < list.length; i++) {
      if (y >= list[i].st.start - 1) pick = list[i];
    }
    if (pick === list[list.length - 1] && y > pick.st.end + window.innerHeight) pick = null;
    setActive(pick ? pick.cfg.id : null);
  }

  EV.zones = {
    init: function () {
      var cine = EV.mode === 'cine';
      EV.manifest.zones.forEach(function (cfg, index) {
        var section = document.querySelector('[data-zone="' + cfg.id + '"]');
        if (!section) return;
        var stage = section.querySelector('.zone__stage');
        var z = { cfg: cfg, index: index, section: section, stage: stage, st: null, progress: 0, dirty: true };

        if (cine) {
          z.st = ScrollTrigger.create({
            id: 'zona-' + cfg.id,
            trigger: section,
            start: 'top top',
            end: function () { return '+=' + Math.round(cfg.screens * window.innerHeight); },
            pin: stage,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: -index,
            onUpdate: function (self) {
              if (self.progress !== z.progress) { z.progress = self.progress; z.dirty = true; }
            },
            onToggle: resolveActive,
            onLeave: resolveActive,
            onEnterBack: resolveActive,
            onRefresh: function (self) { z.progress = self.progress; z.dirty = true; }
          });
        } else {
          // Modo fijo: sin pin, la zona activa es la que ocupa el centro.
          z.st = ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onToggle: function (self) { if (self.isActive) setActive(cfg.id); }
          });
          z.progress = 0.5;
        }
        list.push(z);
        byId[cfg.id] = z;
      });

      setActive(list[0].cfg.id);
      if (!cine) EV.stage.showStill(list[0].cfg.id);
      // Tras cada refresh (resize, fuentes, restauración de scroll) recalcular la activa.
      if (cine) ScrollTrigger.addEventListener('refresh', resolveActive);
    },

    on: function (id, fn) { (listeners[id] = listeners[id] || []).push(fn); },

    /* Llamado una vez por tick: empuja progreso al canvas y a las capas. */
    flush: function () {
      if (EV.mode === 'cine' && list.length && !jumping) resolveActive();   // libera el escenario pasada la oficina
      for (var i = 0; i < list.length; i++) {
        var z = list[i];
        if (EV.mode === 'cine') EV.stage.set(z.cfg.id, z.progress);
        if (!z.dirty) continue;
        z.dirty = false;
        var fns = listeners[z.cfg.id];
        if (fns) for (var k = 0; k < fns.length; k++) fns[k](z.progress, z.cfg.id === activeId);
      }
    },

    progress: function (id) { return byId[id] ? byId[id].progress : 0; },
    active: function () { return activeId; },
    get: function (id) { return byId[id]; },
    all: function () { return list; },

    /* Salto desde el Plano: corte a negro, salto inmediato, la sala aparece.
       No atraviesa las zonas intermedias, así que no las carga. */
    goTo: function (id, done) {
      var z = byId[id];
      if (!z) return;
      if (EV.mode !== 'cine') {
        z.section.scrollIntoView({ behavior: EV.reducedMotion ? 'auto' : 'smooth', block: 'start' });
        if (done) done();
        return;
      }
      var curtain = document.querySelector('.curtain');
      jumping = true;
      gsap.to(curtain, {
        opacity: 1, duration: 0.38, ease: 'power2.in', overwrite: true,
        onComplete: function () {
          EV.scroll.to(z.st.start + 2, { immediate: true });
          ScrollTrigger.update();
          jumping = false;
          resolveActive();
          EV.stage.setActive(id);
          if (done) done();
          EV.stage.whenReady(id, 900).then(function () {
            gsap.to(curtain, { opacity: 0, duration: 0.7, ease: 'power2.out', delay: 0.05 });
          });
        }
      });
    }
  };
})();
