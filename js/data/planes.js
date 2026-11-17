/* ==========================================================================
   Planes. EDITABLE.
   BORRADOR: las listas "incluye" vienen del prototipo aprobado en estilo
   (Downloads/evimes-hero) y Oscar debe confirmarlas antes de publicar.
   precio: texto tal cual se muestra ("Desde 150 €" → "desde" pequeño + cifra).
   recomendado: etiqueta en la card central.
   ========================================================================== */
window.EVIMES_PLANES = [
  {
    id: 'fundamento',
    nombre: 'Fundamento',
    precio: 'Desde 150 €',
    para: 'Para empezar con buena base.',
    incluye: ['Web de una página', 'Formulario y botón de WhatsApp', 'Adaptada a móvil', 'Dominio y SSL'],   // BORRADOR
    boton: 'Empezar',
    borrador: true
  },
  {
    id: 'inmersion',
    nombre: 'Inmersión',
    precio: '500 €',
    para: 'Para destacar y captar clientes.',
    incluye: ['Diseño web a medida', 'Animaciones y experiencia inmersiva', 'Pensada para convertir', 'SEO básico'],   // BORRADOR
    boton: 'Empezar',
    recomendado: true,
    borrador: true
  },
  {
    id: 'impacto',
    nombre: 'Impacto',
    precio: 'A medida',
    para: 'Proyectos a medida.',
    incluye: ['Tienda online', 'SEO, AEO y GEO', 'UX y animaciones avanzadas', 'Lo que tu negocio necesite'],   // BORRADOR
    boton: 'Pide presupuesto',
    borrador: true
  }
];
