/* ==========================================================================
   "Con quién trabajamos" (última sección del panel gris).
   EDITABLE. BORRADOR: textos provisionales, Oscar debe confirmarlos.
   Prototipo aprobado: Downloads/evimes-cards/con-quien.html (textos tal cual).

   lineas: las tres líneas del titular. Entre corchetes, la palabra que lleva
   el subrayado cian ("tu [sí]."). suave: true = línea en gris más suave.
   perfil: lo que el CTA marca en "Soy…" del formulario de contacto.
   ========================================================================== */
window.EVIMES_CLIENTES = [
  {
    id: 'agencias',
    pestana: 'Agencias creativas',
    lineas: ['Tenéis la idea.', 'Nosotros la creamos.', { texto: 'Solo nos falta tu [sí].', suave: true }],
    texto: 'Somos el estudio técnico de agencias creativas e innovadoras. Webs 3D, WebGL e interacción a medida, con vuestra marca y a vuestro ritmo.',
    cta: 'Hablemos de un proyecto',
    href: '#contacto',
    perfil: 'Agencia creativa',
    puntos: [
      { titulo: 'Marca blanca', texto: 'Lo presentáis como vuestro. Nosotros, detrás.' },
      { titulo: '3D y WebGL a medida', texto: 'Lo que otros no se atreven a programar.' },
      { titulo: 'Plazos claros', texto: 'Sabéis qué llega y cuándo, desde el primer día.' }
    ]
  },
  {
    id: 'locales',
    pestana: 'Negocios locales',
    lineas: ['Más visitas.', 'Más reservas.', 'Más [ventas].'],
    texto: 'Restaurantes, barberías y comercios de Madrid con una web que trabaja por ellos, también cuando está cerrado.',
    cta: 'Pide tu propuesta',
    href: '#contacto',
    perfil: 'Negocio local',
    puntos: [
      { titulo: 'Web rápida', texto: 'Carga al instante, también en el móvil.' },
      { titulo: 'Google y Maps', texto: 'Que te encuentren cuando te buscan cerca.' },
      { titulo: 'Reservas y WhatsApp', texto: 'Del "me interesa" al cliente, en un clic.' }
    ]
  }
];
