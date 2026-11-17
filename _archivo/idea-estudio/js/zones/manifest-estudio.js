/* ==========================================================================
   Manifiesto de zonas.
   - screens : duración del pin en "pantallas" (alto de viewport).
   - frames, ext, ready, poster: del motor de secuencias (sequence-legacy.js,
     desconectado). Ya no hay vídeos: la fachada es foto fija y las salas,
     panoramas 360° (config.salas). Se conservan solo por si se reactiva.
   - scrim   : degradados locales detrás de los bloques de texto.
               { target: selector dentro de la zona,
                 shape: 'radial' | 'left' | 'right',
                 intensity: mínimo 0–0.55 (el motor lo sube si el fotograma
                            es claro, para mantener AA),
                 range: [a,b] progreso en el que existe (opcional) }
   Ruta de cada fotograma: assets/zones/<slug>/<desktop|mobile>/0001.<ext>
   ========================================================================== */
window.EV = window.EV || {};
EV.manifest = {
  variants: {
    desktop: { w: 1920, h: 1080 },
    mobile:  { w: 1080, h: 1920 }
  },
  zones: [
    // Foto fija + cámara en código (01-fachada.js). Sin vídeo.
    { id: 'fachada',        slug: '01-fachada',        label: 'Fachada',        note: 'Calle',            screens: 3, frames: 120, ext: 'avif', ready: false, poster: 0,
      scrim: [{ target: '.fachada__copy', shape: 'left', intensity: 0.3 }] },
    { id: 'pasillo',        slug: '02-pasillo',        label: 'Pasillo',        note: 'Planta noble',     screens: 2, frames: 90,  ext: 'avif', ready: false, poster: 45,
      scrim: [{ target: '.pasillo__lines', shape: 'radial', intensity: 0.25, range: [0.1, 0.95] }] },
    { id: 'diseno-web',     slug: '03-diseno-web',     label: 'Diseño Web',     note: 'Sala de cristal I',  screens: 4, frames: 150, ext: 'avif', ready: false, poster: 75,
      scrim: [{ target: '.cartela', shape: 'radial', intensity: 0.2 }] },
    { id: 'product-design', slug: '04-product-design', label: 'Product Design', note: 'Sala de cristal II', screens: 4, frames: 150, ext: 'avif', ready: false, poster: 75,
      scrim: [{ target: '.cartela', shape: 'radial', intensity: 0.2 }] },
    { id: 'software-ai',    slug: '05-software-ai',    label: 'Software & AI',  note: 'Sala de cristal III', screens: 4, frames: 150, ext: 'avif', ready: false, poster: 75,
      scrim: [{ target: '.cartela', shape: 'radial', intensity: 0.2 }] },
    { id: 'arcade',         slug: '06-arcade',         label: 'Arcade',         note: 'Sala de juego',    screens: 3, frames: 120, ext: 'avif', ready: false, poster: 60 },
    { id: 'balcon',         slug: '07-balcon',         label: 'Balcón',         note: 'Madrid',           screens: 3, frames: 120, ext: 'avif', ready: false, poster: 119,
      scrim: [{ target: '.balcon__cta', shape: 'left', intensity: 0.3, range: [0.48, 1.01] }] }
  ]
};

/* Pruebas: ?listo=pasillo:webp,diseno-web marca zonas como listas (con
   fotogramas reales) sin tocar el manifiesto. Útil al soltar los primeros
   fotogramas en assets/zones/. */
(function () {
  var q = new URLSearchParams(location.search).get('listo');
  if (!q) return;
  q.split(',').forEach(function (part) {
    var bits = part.split(':');
    EV.manifest.zones.forEach(function (z) {
      if (z.id === bits[0]) { z.ready = true; if (bits[1]) z.ext = bits[1]; }
    });
  });
})();
