/* ==========================================================================
   Manifiesto de zonas pinned (js/engine/zones.js).
   - screens : duración del pin en "pantallas" (alto de viewport).
   - scrim   : degradados locales detrás de los bloques de texto
               { target, shape: 'radial' | 'left' | 'right', intensity, range }
   Solo hay una zona con cámara: la oficina (hero + apertura + mesa + techo).
   El resto de index.html son secciones planas.
   ========================================================================== */
window.EV = window.EV || {};
EV.manifest = {
  zones: [
    { id: 'oficina', label: 'La oficina', screens: 7,
      scrim: [
        { target: '.bloque[data-paso="01"]', shape: 'left', intensity: 0.3 },
        { target: '.bloque[data-paso="02"]', shape: 'left', intensity: 0.2 }
      ] }
  ]
};
