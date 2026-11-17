// Datos de contacto, redes y URLs. Rellenar con los datos reales.
window.EVIMES_CONFIG = {
  // Logos vectoriales (fill="currentColor"). Cada clave alimenta los
  // elementos con data-logo="<clave>"; el SVG se incrusta en línea.
  logo: {
    header:  'assets/logo/evimes-eh.svg',       // cabecera
    favicon: 'assets/logo/evimes-eh.svg',       // origen de favicon.svg y apple-touch-icon.png
    fachada: 'assets/logo/evimes-wordmark.svg', // letras corpóreas de la fachada
    lockup:  'assets/logo/evimes-lockup.svg'    // EH + EVIMES (piezas sueltas)
  },

  // Fachada (coordenadas normalizadas 0–1 de cada keyframe: desktop 16:9, mobile vertical).
  fachada: {
    // Letras EVIMES: 4 esquinas [sup-izq, sup-der, inf-der, inf-izq].
    // Ajuste a ojo: abre index.html?ajustar=letras, arrastra y pega aquí lo copiado.
    letras: {
      desktop: [[0.6550, 0.4050], [0.8300, 0.4050], [0.8300, 0.4616], [0.6550, 0.4616]],
      mobile:  [[0.5950, 0.4580], [0.8050, 0.4580], [0.8050, 0.4782], [0.5950, 0.4782]]
    },
    // Ventana encendida: las DOS hojas que se abren (4 puntos cada una,
    // [sup-izq, sup-der, inf-der, inf-izq]), la bisagra de cada hoja (2 puntos)
    // y la altura del pasamanos de la barandilla (queda delante, quieta).
    // Ajuste a ojo: index.html?ajustar=ventana.
    ventana: {
      desktop: {
        izquierda: { puntos: [[0.4451, 0.2894], [0.5122, 0.2894], [0.5122, 0.7843], [0.4451, 0.7843]], bisagra: [[0.4451, 0.2894], [0.4451, 0.7843]] },
        derecha:   { puntos: [[0.5122, 0.2894], [0.5806, 0.2894], [0.5806, 0.7843], [0.5122, 0.7843]], bisagra: [[0.5806, 0.2894], [0.5806, 0.7843]] },
        baranda: 0.6215
      },
      mobile: {
        izquierda: { puntos: [[0.3361, 0.4259], [0.4213, 0.4259], [0.4213, 0.6342], [0.3361, 0.6342]], bisagra: [[0.3361, 0.4259], [0.3361, 0.6342]] },
        derecha:   { puntos: [[0.4213, 0.4259], [0.5046, 0.4259], [0.5046, 0.6342], [0.4213, 0.6342]], bisagra: [[0.5046, 0.4259], [0.5046, 0.6342]] },
        baranda: 0.5606
      }
    },
    // Interior que se ve al abrir (assets/zones/01-fachada/interior-*.avif|webp):
    // punto de fuga del pasillo (0–1), que se alinea con el centro del hueco.
    interior: { foco: [0.502, 0.47] }
  },

  // Salas con panorama 360° (js/engine/pano.js). Ángulos en grados:
  // yaw 0 = centro de la imagen, + a la derecha · pitch + hacia arriba.
  // Ajuste a ojo: index.html?ajustar=sala (arrastra para mirar, clic copia yaw/pitch).
  salas: {
    'diseno-web': {
      pano: {
        alta:   'assets/zones/03-diseno-web/pano-5792.jpg',
        media:  'assets/zones/03-diseno-web/pano-4096.jpg',
        previa: 'assets/zones/03-diseno-web/pano-2048.jpg'
      },
      // Costura del panorama en ±180°: la cámara nunca se acerca.
      yawLimite: [-130, 150],
      // Recorrido. hold = cuánto se queda quieta (peso relativo).
      // m = valores propios en vertical (el fov es más estrecho).
      paradas: [
        { id: 'cristal',   yaw: -125, pitch: 2,  fov: 55, hold: 1.3, m: { yaw: -130, pitch: 3 } },
        { id: 'mesa',      yaw: -10,  pitch: -8, fov: 55, hold: 1.4, m: { yaw: 16, pitch: -14 } },
        { id: 'layouts',   yaw: 78,   pitch: 14, fov: 55, hold: 1.3, m: { yaw: 80, pitch: 16 } },
        { id: 'ventanal',  yaw: 140,  pitch: 0,  fov: 55, hold: 1.6, m: { yaw: 130, pitch: -2 } },
        { id: 'monitores', yaw: 3,    pitch: 1,  fov: 55, hold: 0.9, m: { yaw: -8, pitch: 1 } }
      ],
      // Rótulo de vinilo en el cristal: 4 esquinas (yaw, pitch).
      rotulo: { parada: 'cristal', esquinas: [[-146, 9.6], [-124, 9.4], [-124, 4.0], [-146, 4.2]] },
      // Cartelas: ancla (yaw, pitch) sobre el objeto, en su parada. c = clave en content.js.
      // La principal (texto de la sala) va bajo el rótulo, sin ancla ni filete.
      anclas: [
        { parada: 'cristal',  c: 'disenoWeb',             yaw: -145.6, pitch: -5,   principal: true, lado: 'right' },
        { parada: 'mesa',     c: 'disenoWeb.cartelas.2',  yaw: 16.2,   pitch: -19.3, lado: 'right' },  // cuaderno (lomo): Branding digital
        { parada: 'mesa',     c: 'disenoWeb.cartelas.3',  yaw: 12.2,   pitch: -9.9 },   // móvil: Responsive
        { parada: 'layouts',  c: 'disenoWeb.cartelas.0',  yaw: 70.2,   pitch: 30.6 },   // UX/UI
        { parada: 'layouts',  c: 'disenoWeb.cartelas.1',  yaw: 90.9,   pitch: 6.3 },    // Landing pages
        { parada: 'ventanal', c: 'disenoWeb.cartelas.4',  yaw: 125.1,  pitch: -20.7 }   // caja: E-commerce
      ],
      // Luces de Madrid (js/zones/growth.js): ventanas del edificio de enfrente.
      luces: { parada: 'ventanal', puntos: [[129.4, 32.7], [144.8, 33.6], [129.4, 20.1], [144.8, 20.1], [129.4, 6.1], [144.8, 6.1], [124.1, 41.2], [151.4, 41.7]] },
      // Pantallas: 4 esquinas (yaw, pitch) [sup-izq, sup-der, inf-der, inf-izq].
      // captura = imagen de la web a todo lo largo (p. ej. 'assets/screens/disco-es.jpg', 1600 px
      // de ancho); vacía = aviso "captura pendiente". iframe = true solo si la web permite incrustarse.
      pantallas: [
        { id: 'principal',  nombre: 'disco.es',   url: 'https://disco.es/', captura: '', iframe: false, entrar: true,
          esquinas: [[-23.38, 9.32], [7.91, 9.49], [7.91, -7.82], [-23.38, -8.26]] },
        { id: 'secundaria', nombre: 'El Bodegón', url: '', captura: '', iframe: false,
          esquinas: [[9.58, 9.32], [35.51, 9.32], [35.51, -6.86], [9.58, -7.56]] }
      ]
    }
  },

  // Teléfono y email tomados del aviso legal de la web antigua.
  telefono: '',
  telefonoHref: '',
  whatsapp: '',          // pendiente de confirmar, p. ej. "https://wa.me/34600000000"
  email: '',
  redes: {
    instagram: '',
    linkedin: '',
    tiktok: '',
  },
  urls: {
    home: '/',
    servicios: '/servicios.html',
    nosotros: '/nosotros.html',
    contacto: '/contacto.html',
    avisoLegal: '/aviso-legal.html',
    terminos: '/terminos.html',
    privacidad: '/privacidad.html',
    cookies: '/cookies.html',
  },
};
