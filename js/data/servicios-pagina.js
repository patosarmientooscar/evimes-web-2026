/* ==========================================================================
   servicios.html — todos los textos. EDITABLE.
   BORRADOR: Oscar debe confirmarlos antes de publicar.
   (Las frases cortas de las cards de la home están en js/data/servicios.js.)
   El HTML lleva los mismos textos (SEO y sin JS); js/paginas/servicios.js los
   repinta desde aquí, así que basta con cambiarlos en este archivo.
   ========================================================================== */
window.EVIMES_SERVICIOS_PAGINA = {
  borrador: true,
  hero: {
    etiqueta: 'Servicios',
    titulo: 'Lo que hacemos',            // el punto final va en cian (en el HTML)
    texto: 'Webs, 3D, posicionamiento e inteligencia artificial. Todo hecho a mano en Madrid, por un equipo pequeño que responde.'
  },
  servicios: [
    {
      id: 'web', kind: 'web', num: '01', nombre: 'Desarrollo web',
      frase: 'Webs a medida que cargan rápido y venden.',
      parrafos: [
        'Diseñamos y programamos cada web a mano, desde cero. Sin plantillas, sin constructores visuales y sin código que no necesitas.',
        'El resultado es una web rápida, que se ve perfecta en cualquier pantalla y que lleva a cada visita hacia lo que te importa: una llamada, una reserva, una venta.'
      ],
      incluye: ['Diseño a medida (UI/UX)', 'Desarrollo a mano, HTML/JS o React según el proyecto', 'Adaptada a móvil, tablet y escritorio', 'Velocidad optimizada (Core Web Vitals)', 'Formularios, WhatsApp y reservas', 'Textos legales y cookies', 'Te enseñamos a editar tus contenidos'],
      ctas: [{ texto: 'Ver planes y precios', href: 'planes.html' }, { texto: 'Pide tu propuesta', href: 'contacto.html' }]
    },
    {
      id: '3d', kind: 'star', num: '02', nombre: 'Animaciones 3D',
      frase: 'Lo que hace que se queden mirando.',
      parrafos: [
        'Three.js, WebGL y GSAP para webs que se recuerdan: objetos 3D que reaccionan al ratón, recorridos con el scroll y escenas que cuentan tu marca.',
        'Todo optimizado para que vaya fluido también en el móvil, con una versión ligera para quien prefiera menos movimiento.'
      ],
      incluye: ['Escenas y objetos 3D a medida', 'Animaciones con scroll (scrollytelling)', 'Interacción con ratón y táctil', 'Shaders y efectos de luz', 'Modelos optimizados (glTF)', 'Versión ligera y accesible'],
      ctas: [{ texto: 'Pide tu propuesta', href: 'contacto.html' }, { texto: 'Ver un proyecto', href: 'proyectos.html#disco' }]
    },
    {
      id: 'seo', kind: 'pin', num: '03', nombre: 'Posicionamiento',
      frase: 'Que te encuentren cuando te buscan.',
      parrafos: [
        'Una web que nadie encuentra no existe. Trabajamos el SEO desde el código, el contenido y tu ficha de Google para que aparezcas en Google, en Maps y en las respuestas de la IA.',
        'Medimos con datos reales. Sin prometer primeras posiciones y sin atajos que luego penalizan.'
      ],
      incluye: ['Auditoría SEO', 'SEO técnico y velocidad', 'Investigación de palabras clave', 'Google Business Profile', 'SEO local en Madrid', 'Datos estructurados (schema)', 'Optimización para respuestas de IA (AEO/GEO)', 'Informe de resultados'],
      ctas: [{ texto: 'Ver planes y precios', href: 'planes.html' }, { texto: 'Pide tu propuesta', href: 'contacto.html' }]
    },
    {
      id: 'ia', kind: 'ia', num: '04', nombre: 'Software IA',
      frase: 'Herramientas que trabajan por ti.',
      parrafos: [
        'Agentes, bots y automatizaciones con IA conectados a lo que ya usas: WhatsApp, correo, reservas y hojas de cálculo.',
        'Empezamos por lo que más tiempo te quita y lo automatizamos, con supervisión humana donde hace falta.'
      ],
      incluye: ['Chatbots para web y WhatsApp', 'Agentes que responden y clasifican', 'Automatización de tareas repetitivas', 'Integraciones (APIs, Google, CRM)', 'Paneles internos a medida', 'Formación a tu equipo'],
      ctas: [{ texto: 'Hablemos de tu caso', href: 'contacto.html' }]
    }
  ],
  // También los usa planes.html ("Qué pasa después", versión corta).
  pasos: {
    titulo: 'Cómo trabajamos',
    lista: [
      { num: '01', verbo: 'Escuchamos', texto: 'Una llamada para entender tu negocio, tu público y qué quieres conseguir.', corto: 'Una llamada para entender tu negocio.' },
      { num: '02', verbo: 'Diseñamos', texto: 'Te enseñamos la propuesta antes de programar nada.', corto: 'Ves la propuesta antes de programar.' },
      { num: '03', verbo: 'Construimos', texto: 'Desarrollamos por fases y lo ves avanzar en un enlace privado.', corto: 'Por fases, en un enlace privado.' },
      { num: '04', verbo: 'Lanzamos y acompañamos', texto: 'Publicamos, medimos y seguimos a tu lado después.', corto: 'Publicamos, medimos y seguimos contigo.' }
    ]
  },
  fin: {
    titulo: '¿Tienes un proyecto en mente?',
    texto: 'Cuéntanoslo. Te respondemos con una propuesta clara.',
    ctas: [{ texto: 'Pide tu propuesta', href: 'contacto.html' }, { texto: 'Ver planes', href: 'planes.html' }]
  }
};
