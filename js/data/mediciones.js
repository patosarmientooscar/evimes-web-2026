/* ==========================================================================
   Mediciones REALES (Lighthouse 13.6, 15 nov 2026). Fuente: los JSON de
   assets/proyectos/. Solo se muestran valores medidos; nada inventado.
   La píldora PageSpeed se omite cuando la puntuación es baja (< 85).
   ========================================================================== */
window.EVIMES_MEDICIONES = {
  disco: {
    fecha: '2026-11-15',
    movil:      { rendimiento: 57, lcp: 2.6, fcp: 1.2, cls: 0 },
    escritorio: { rendimiento: 76, lcp: 0.7, fcp: 0.3, cls: 0.006 },
    accesibilidad: 100, buenasPracticas: 100, seo: 100
  }
};
(function () {
  var P = window.EVIMES_PROYECTOS, M = window.EVIMES_MEDICIONES;
  if (!P || !M) return;
  P.lista.forEach(function (p) {
    var m = M[p.id];
    if (!m) return;
    p.medicion = m;
    p.carga = m.escritorio.lcp;                         // "tiempo de carga" = LCP escritorio
    p.cargaMovil = m.movil.lcp;
    p.pagespeed = m.movil.rendimiento >= 85 ? m.movil.rendimiento : null;
  });
})();
