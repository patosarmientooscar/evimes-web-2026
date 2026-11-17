// Todos los textos de la web. EDITABLES: cambia aquí y el HTML se actualiza
// (los elementos llevan data-c="ruta"). El HTML lleva el mismo texto para SEO.
window.EVIMES_CONTENT = {
  menu: {
    proyectos: 'Proyectos',
    planes: 'Planes',
    servicios: 'Servicios',
    contacto: 'Contacto',
    cta: 'Pide tu propuesta'
  },

  hero: {
    h1: 'Diseño web en Madrid que convierte visitas en clientes.',
    linea: 'Webs rápidas, a medida y pensadas para vender. Desde 150 €.',
    cta: 'Pide tu propuesta',
    secundario: 'Ver proyectos'
  },

  oficina: {
    pista: 'Haz scroll',
    // Bloque de texto en la parada MESA (proyectos)
    mesa: {
      etiqueta: 'Proyectos',
      titulo: 'Webs hechas para vender.',
      linea1: 'Cada proyecto sale de aquí medido: velocidad real, diseño propio, nada de plantillas.',
      linea2: 'Pasa el ratón para recorrer cada web; haz clic para ver el detalle.',
      boton: 'Ver todos los proyectos'
    },
    // Bloque de texto en la parada TECHO (cifras)
    techo: {
      etiqueta: 'Cifras',
      titulo: 'Medido en proyectos reales.',
      linea1: 'Velocidad, móvil y respuesta: lo que nota quien entra en tu web.',
      linea2: 'Elige el plan que encaja con tu negocio.',
      boton: 'Ver planes'
    }
  },

  proyectos: {
    titulo: 'Proyectos',
    proximamente: 'Próximamente',
    detalle: { necesidad: 'Qué necesitaba', pagespeed: 'Test PageSpeed', ver: 'Ver web', cerrar: 'Cerrar' },
    pills: { pagespeed: 'PageSpeed', carga: 'carga' }
  },

  planes: {
    titulo: 'Planes',
    intro: 'Tres formas de empezar. Sin sorpresas: lo que incluye cada plan está escrito.',
    recomendado: 'Recomendado',
    verTodo: 'Ver qué incluye cada plan'
  },

  tambien: {
    titulo: 'También hacemos',
    filas: [
      { titulo: 'Software e IA', linea: 'Herramientas a medida que automatizan lo repetitivo.', href: 'software-ia.html' },
      { titulo: 'Automatización de servicios', linea: 'Reservas, citas y avisos que funcionan solos.', href: 'automatizacion.html' },
      { titulo: 'Plantillas de portfolio para fotógrafos', linea: 'Un portfolio rápido y elegante, listo en días.', href: 'plantillas-fotografos.html' }
    ]
  },

  faq: {
    titulo: 'Preguntas frecuentes',
    // PENDIENTE DE TEXTO: borrador para validar con Oscar.
    items: [
      { p: '¿Cuánto tarda una web?', r: 'Pendiente de texto. (Borrador: depende del plan; una web de una página suele estar lista en pocas semanas.)', pendiente: true },
      { p: '¿Qué necesito para empezar?', r: 'Pendiente de texto. (Borrador: tu logo si lo tienes, fotos y una conversación de media hora.)', pendiente: true },
      { p: '¿La web es mía?', r: 'Pendiente de texto. (Borrador: sí, el dominio y el código son tuyos.)', pendiente: true },
      { p: '¿Hacéis mantenimiento?', r: 'Pendiente de texto. (Borrador: sí, se acuerda según el plan.)', pendiente: true }
    ]
  },

  contacto: {
    titulo: 'Cuéntanos tu negocio.',
    linea: 'Te respondemos con una propuesta clara: qué haríamos, cuánto y cuándo.',
    campos: { negocio: 'Tipo de negocio', nombre: 'Tu nombre', whatsapp: 'Tu WhatsApp', plan: 'Plan' },
    placeholders: { negocio: 'Restaurante, clínica, tienda…', nombre: 'Nombre', whatsapp: '+34 600 000 000' },
    sinPlan: 'Aún no lo sé',
    enviar: 'Pide tu propuesta',
    nota: 'Sin compromiso. Respondemos por WhatsApp o correo.'
  },

  pie: {
    firma: 'Tu esencia, digital.',
    lugar: 'Madrid'
  },

  // ===== Home nueva (index.html, fase onda). La oficina aparcada usa las claves de arriba. =====
  inicio: {
    menu: { servicios: 'Servicios', herramientas: 'Herramientas', proyectos: 'Proyectos', planes: 'Planes', contacto: 'Contacto', cta: 'Pide tu propuesta' },
    hero: {
      linea1: 'Tu negocio merece',
      linea2: 'una web a su altura.',      // en index.html "altura" va en <span class="accent"> (cian): si cambias esta frase, cámbiala también allí
      sub: 'Diseño web a medida en Madrid. Webs rápidas, únicas y pensadas para convertir visitas en clientes. Desde 150 €.',
      cta: 'Pide tu propuesta',
      secundario: 'Ver proyectos',
      desliza: 'Desliza'
    },
    herramientas: 'Herramientas con las que trabajamos',
    frase: { a: 'Si no eres visible,', b: 'no existes.' },
    panel: { etiqueta: 'Proyectos', titulo: 'Siéntate. Esto es lo que hacemos.' },
    planes: { titulo: 'Un plan para cada negocio.', intro: 'Sin letra pequeña.', verTodo: 'Ver qué incluye cada plan', recomendado: 'Recomendado', desde: 'desde' },
    contacto: { titulo: '¿Hacemos que se te vea?', cta: 'Pide tu propuesta', whatsapp: 'o escríbenos por WhatsApp' },
    pie: { firma: '© 2026 Evimes · Madrid' }
  }
};
