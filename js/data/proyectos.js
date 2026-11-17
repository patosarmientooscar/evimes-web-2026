/* ==========================================================================
   Proyectos. EDITABLE.
   - captura:   imagen 1440×900 de la web (assets/proyectos/).
   - larga:     tira vertical para el hover (varias pantallas apiladas).
   - pagespeed: puntuación de rendimiento (Lighthouse móvil). Solo valores
                REALES medidos; sin valor → no se muestra la píldora.
   - carga:     tiempo de carga (LCP móvil) en segundos, medido.
   - informe:   captura del informe PageSpeed/Lighthouse.
   - proximamente: tarjeta gris "Próximamente" (sin datos inventados).
   El orden es el de la fila del monitor; el índice `central` va al centro del arco.
   ========================================================================== */
window.EVIMES_PROYECTOS = {
  central: 2,
  lista: [
    { id: 'p2', proximamente: true },
    { id: 'p3', proximamente: true },
    {
      id: 'disco',
      cliente: 'Disco Producción',
      sector: 'Productora audiovisual',
      ciudad: 'Madrid',
      url: 'https://discoproduccion.com/',
      captura: 'assets/proyectos/disco-1440.webp',
      larga: 'assets/proyectos/disco-larga.webp',
      necesidad: 'Una web con ritmo, que enseñe su trabajo en vídeo y foto y consiga que les escriban.',
      // Medición: assets/proyectos/disco-lighthouse-movil.report.json (Lighthouse 13, móvil simulado).
      pagespeed: null,      // se rellena desde js/data/mediciones.js
      carga: null,
      informe: 'assets/proyectos/disco-pagespeed.webp'
    },
    { id: 'p4', proximamente: true },
    { id: 'p5', proximamente: true }
  ]
};
