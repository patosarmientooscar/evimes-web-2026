// Datos de contacto, redes, URLs, cifras y geometría de la oficina 360°.
// Rellenar con los datos reales. Los valores de la oficina son provisionales:
// ajústalos con index.html?ajustar=oficina (mira con el ratón, clic copia yaw/pitch).
window.EVIMES_CONFIG = {
  // Logos vectoriales (fill="currentColor"). Cada clave alimenta los
  // elementos con data-logo="<clave>"; el SVG se incrusta en línea.
  logo: {
    header:  'assets/logo/evimes-eh.svg',       // cabecera (oficina aparcada)
    wordmark: 'assets/logo/evimes-wordmark.svg', // cabecera de la home
    favicon: 'assets/logo/evimes-eh.svg',       // origen de favicon.svg y apple-touch-icon.png
    pie:     'assets/logo/evimes-lockup.svg',   // pie de página
    lockup:  'assets/logo/evimes-lockup.svg'
  },

  // Cifras del hero y del techo. pendienteConfirmar: se muestra sin número
  // hasta que Oscar confirme. "tiempo de carga" sale de la medición real de
  // Disco (Lighthouse escritorio, LCP 0,7 s; en móvil fue 2,6 s) — ver assets/proyectos/disco-lighthouse-*.json.
  cifras: [
    { valor: '+10',   etiqueta: 'proyectos entregados', num: 10,  formato: '+{n}' },
    { valor: '0,7 s', etiqueta: 'tiempo de carga',      num: 0.7, formato: '{n} s', decimales: 1, fuente: 'LCP escritorio medido en discoproduccion.com (Lighthouse, 15 nov 2026)' },
    { valor: '100 %', etiqueta: 'responsive',           num: 100, formato: '{n} %' },
    { valor: '24 h',  etiqueta: 'respuesta',            num: 24,  formato: '{n} h', pendienteConfirmar: true, alternativa: 'Respuesta rápida' }
  ],

  // Oficina 360° (panorama equirectangular 2:1, visto desde la silla).
  // yaw 0 = centro de la imagen, + a la derecha · pitch + hacia arriba.
  oficina: {
    pano: {
      alta:   'assets/oficina/pano-5792.jpg',
      media:  'assets/oficina/pano-4096.jpg',
      previa: 'assets/oficina/pano-2048.jpg'
    },
    // ±180° (detrás de la silla) es la costura y por debajo de −40° se ve la silla.
    yawLimite:   [-115, 115],
    pitchLimite: [-38, 62],
    // Renders planos del hero (tools/render-hero.sh): yaw 0, pitch +5.
    hero: {
      desktop: { fov: 62, aspecto: 16 / 9 },
      mobile:  { fov: 80, aspecto: 9 / 16 }
    },
    fov: { desktop: 55, mobile: 72 },
    // Paradas de la cámara. m = valores propios en vertical.
    paradas: {
      inicio: { yaw: 0, pitch: 5 },
      mesa:   { yaw: 0, pitch: -8,  m: { pitch: -9, fov: 82 } },
      techo:  { yaw: 0, pitch: 55,  m: { pitch: 50 } },   // en vertical el fov es mayor: 50 + 36 < 90 (no pasa del cénit)
      salida: { yaw: 0, pitch: 22 }
    },
    // Mirar alrededor con el ratón o el dedo (grados máximos sobre la posición del scroll).
    mirar: { yaw: 12, pitch: 6, lerp: 0.06 },
    // Monitor principal: 4 esquinas de la pantalla [sup-izq, sup-der, inf-der, inf-izq].
    monitor: { esquinas: [[-23.2, 5.6], [24.2, 5.5], [24.7, -20.2], [-23.7, -20.3]] },   // medido en un render 1920 (tools/render-hero.sh)
    // Fila de miniaturas dentro de la pantalla (u, v en 0–1 de la pantalla).
    miniaturas: {
      desktop: { v: [0.3, 0.7], u: [0.05, 0.95] },
      mobile:  { v: [0.32, 0.68], u: [0.12, 0.88] }
    },
    // Detalles vivos (js/zones/vivos.js). Todo en (yaw, pitch).
    vivos: {
      vapor:   { yaw: 39.5, pitch: -18.4, alto: 6 },          // borde de la taza; alto en grados
      boli: {
        // Eje del boli sobre la mesa (dos extremos yaw/pitch) y diámetro aparente
        // en grados. Rueda perpendicular al eje hacia el cuaderno (≈ 3 cm).
        // DESACTIVADO: en la parada MESA el boli queda fuera de cuadro (yaw −69…−55)
        // incluso mirando a tope; en móvil, siempre. Se reactiva con activo: true.
        activo: false,
        a: [-68.9, -19.1], b: [-55.5, -21.4], diametro: 0.95,
        rodar: [-0.3, -1.5],
        sombra: 0.34
      },
      // DESACTIVADO: solo asoma en la esquina inferior derecha mirando a tope.
      movil:   { activo: false, esquinas: [[45.8, -29.7], [50.4, -29.0], [55.5, -35.8], [50.8, -36.7]] },
      reflejo: { esquinas: [[-20.0, -22.3], [20.0, -22.3], [25.5, -29.3], [-25.5, -29.3]] },
      polvo:   { yaw: [-110, -70], pitch: [-6, 30] },
      exposicion: { amplitud: 0.03, periodo: 20 },
      pantallasEquipo: [
        { esquinas: [[-23.3, 15.0], [-13.6, 15.0], [-13.8, 9.6], [-23.7, 8.5]] },
        { esquinas: [[-5.9, 15.1], [4.9, 15.0], [5.0, 9.3], [-6.0, 9.2]] }
      ]
    },
    // Marcas para ?ajustar=oficina (solo referencia visual).
    marcas: {
      taza: [40, -21], movil: [51, -33], carpeta: [68, -28], planta: [55, -10],
      flexo: [-48, -8], cuaderno: [-60, -30], maquetas: [-39, -35], logo: [0, 27],
      persona1: [-41, 12], persona2: [27, 12]
    }
  },

  // Contacto. LO RELLENA OSCAR (el repositorio no lleva datos privados).
  // Vacío = el enlace no se muestra.
  telefono: '',          // tal cual se lee, p. ej. '+34 600 00 00 00'
  telefonoHref: '',      // p. ej. 'tel:+34600000000'
  whatsapp: '',          // número en internacional sin '+', p. ej. '34600000000'
  email: '',             // p. ej. 'hola@tudominio.com'

  // Formulario de contacto (Web3Forms: web3forms.com → pon tu email → te mandan la clave).
  // Vacía: el formulario valida pero al enviar dice 'Formulario en configuración'.
  WEB3FORMS_KEY: '',
  redes: {
    instagram: '',
    linkedin: '',
    tiktok: ''
  },
  urls: {
    home: './',
    proyectos: 'proyectos.html',
    planes: 'planes.html',
    avisoLegal: 'aviso-legal.html',
    terminos: 'terminos.html',
    privacidad: 'privacidad.html',
    cookies: 'cookies.html'
  }
};
