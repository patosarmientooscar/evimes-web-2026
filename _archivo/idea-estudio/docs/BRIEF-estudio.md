# BRIEF — Web Evimes: El Estudio
_10 nov 2026 · Oscar_

Rediseño de evimesweb.com como una película: la cámara entra por la ventana del estudio de Evimes y recorre sus salas de cristal, una por servicio, hasta el CTA en el balcón. Nada se genera ni se construye sin el visto bueno de Oscar.

## Cambio de enfoque (11 nov 2026)
- No hay vídeos generados ni secuencias de fotogramas de recorridos: se ven raros y delatan la IA.
- Fachada = foto fija 4K con movimiento de cámara suave en código.
- Cada sala = un panorama 360° hiperrealista (imagen fija) que gira con el scroll, como la sección estudio de disco.es (Three.js + ScrollTrigger).
- Entre salas, transiciones limpias de cine (desenfoque de cristal + fundido). Nunca se atraviesa un cristal o una ventana cerrada: o se abre, o es un corte.
- Todo super clean: ni deformaciones ni parpadeos raros. Si algo no queda perfecto, se quita.

## Concepto y recorrido
Edificio señorial de Madrid con las letras EVIMES en la fachada. Dentro, una planta diáfana con salas de cristal sin marcos, una por servicio. El scroll mueve una cámara que nunca se detiene del todo.

Patrón de cada sala: pasillo → cruzas el cristal → la cámara rodea la sala parando en cada objeto (objeto = servicio, con su cartela) → momento firma → corte directo al pasillo → siguiente sala.

1. Fachada
2. Ventana y pasillo (con Crecimiento en los ventanales)
3. Sala Diseño Web
4. Sala Product Design
5. Sala Software & AI
6. Arcade: el juego "Sin Respuesta"
7. Balcón con el CTA

Servicios, Nosotros y Contacto siguen como páginas normales con el mismo sistema visual, sin película. Descartado: sala de Crecimiento (va al pasillo) y Sala de Proyectos (se decide al final cómo enseñar el trabajo).

## Zona 1 — Fachada
| Elemento | Decisión |
|---|---|
| Luz | Hora azul, cielo navy |
| Edificio | Señorial Chamberí/Salamanca: piedra clara, forja, cornisas |
| Letras EVIMES | En la fachada, a la altura de la ventana, forma del logo |
| Color letras | Cian, corpóreas retroiluminadas (halo, no neón) |
| Encuadre | Frontal, desde el edificio de enfrente |
| Ventana | Una encendida; se intuyen las salas de cristal |
| Texto | Abajo a la izquierda, HTML real |
| Sonido | Apagado por defecto, botón para activarlo |

Texto: firma "Tu esencia, digital." · H1 "Estudio de diseño web, producto y software en Madrid." · entradilla "Somos Evimes. Creamos webs, productos digitales y software con IA para negocios que quieren que se les vea, y que les elijan." · "Entra" · CTA fijo "Empieza tu proyecto".

Regla: la fachada se genera sin letras; el logo real (SVG) se monta encima.

## Zona 2 — Ventana y pasillo
| Elemento | Decisión |
|---|---|
| Paso por la ventana | Se atraviesa el cristal; reflejo cian de las letras |
| Primera vista | Pasillo entero, salas encendidas en fila |
| Suelo | Parquet de roble en espiga |
| Paredes | Blanco roto con molduras |
| Navy | Pared navy al fondo con el logo |
| Frase | "Si no eres visible, no existes." flota y viene hacia ti |
| Luz | Lámparas cálidas + azul exterior |
| Persona | Una, de pie, quieta con un café |
| Duración | Corta: 2–3 scrolls |

Crecimiento: los ventanales miran a Madrid. Al salir de cada sala se encienden más puntos cian de la ciudad; cartelas SEO, Local SEO, AEO y GEO, Google Ads, Analytics en el cristal. Texto: "Que te encuentren. En Google, en Maps y en las respuestas de la IA." Sin "visibilidad garantizada" ni porcentajes sin fuente.

## Zona 3 — Sala Diseño Web
Momento firma: la cámara entra en el monitor y la web real ocupa la pantalla.

| Elemento | Decisión |
|---|---|
| Rótulo | "Diseño Web" (vinilo blanco en el cristal) |
| Texto | "Interfaces que enamoran y convierten. Tu web es tu mejor vendedor: trabaja 24/7, y la diseñamos para que cierre." |
| Mesa | Roble macizo, larga |
| Pantallas | Dos monitores grandes |
| Pared | Layouts impresos pegados con cinta |
| Personas | Una sentada en el monitor; otra de pie en la pared de layouts |
| Webs | disco.es (principal), El Bodegón (secundario) |

Recorrido: cristal → pared de layouts (UX/UI, Landing pages) → mesa (Branding digital, Responsive) → caja (E-commerce) → detrás de la silla → empuje al monitor, la web llena la pantalla, scroll dentro con 3 anotaciones → corte al pasillo. Técnica: Figma, HTML, GSAP.

## Zona 4 — Sala Product Design
Momento firma: botones, tarjetas e iconos de resina navy y aluminio sobre la mesa encajan solos en el móvil y la app se enciende.

| Elemento | Decisión |
|---|---|
| Rótulo | "Product Design" |
| Texto | "Productos digitales con propósito. Antes de diseñar una pantalla, entendemos a quién la va a usar." |
| Pared | Pizarra de suelo a techo con flujos y post-its |
| Mesa | Tableta gráfica + componentes físicos |
| Personas | Una probando prototipo en el móvil; otra dibujando en la tableta (sentadas) |
| Paradas | Pizarra (User research, Flujos), móviles (Prototyping, Testing) |

Técnica: Figma, Notion.

## Zona 5 — Sala Software & AI
Momento firma: la sala trabaja sola. La persona se recuesta; pantallas, móvil y tablet siguen funcionando. "Mientras tú descansas, el sistema trabaja."

| Elemento | Decisión |
|---|---|
| Rótulo | "Software & AI" |
| Texto | "Tecnología inteligente aplicada a tu negocio. Software a medida que automatiza lo repetitivo y te devuelve tiempo." |
| Ambiente | Igual de luminosa que las demás |
| Objetos | Terminal, hub de cables, tablet, móvil |
| Persona | Una, programando, tres cuartos |
| Cartelas | Software a medida · APIs e integraciones · Automatización |
| Pantallas | Automatizaciones genéricas; no Evimes Reservas |

Técnica: Claude, React, Supabase, Vercel.

## Zona 6 — Arcade: "Sin Respuesta"
Sala casi a oscuras, recreativa de madera de los 80 con arte Evimes. Nadie: el jugador eres tú. La cámara entra en la pantalla.

1. Eres el dueño de un negocio en un laberinto pixelado (mesas, sillas de barbería, mostrador) lleno de WhatsApps, emails y llamadas.
2. Te persiguen los "clientes perdidos", cada vez más.
3. Power-up Agente Evimes (la E del logo): te conviertes en el agente.
4. Marcador → "NIVEL COMPLETADO" → directo al CTA.

Pixel retro navy y cian · sin game over · agentes simulados en v1 · teclado/toque + "Saltar al final" · 150–300 KB, carga diferida · nada que copie Pac-Man.

## Zona 7 — Balcón y CTA
Al acabar el juego, balcón de noche: arriba las letras EVIMES encendidas, Madrid detrás, el CTA sobre el plano.

Pendiente: texto del CTA (base "¿Listo para empezar?"), canal de contacto, cómo enseñar proyectos de clientes, créditos ("Dirigido por Oscar Pato Sarmiento") y legal.

## Personas
Generadas con Higgsfield a partir de las cinco del vídeo de referencia: hiperrealistas, quietas, trabajando.

| Persona | Dónde | Postura | Jersey |
|---|---|---|---|
| 1. Castaño claro, sudadera beige | Product Design, tableta | Sentado | Camel |
| 2. Castaño, sudadera gris | Product Design, móvil | Sentado | Gris marengo |
| 3. Castaño, camiseta negra | Diseño Web, monitor | Sentado | Navy |
| 4. Oscuro, sudadera verde | Diseño Web, pared | De pie | Crudo |
| 5. Oscuro, plumífero negro | Pasillo, café | De pie | Navy oscuro |
| Por decidir | Software & AI | Sentado | — |

Reglas: jerséis de punto elegantes · casi quietas · perfil/tres cuartos/espaldas, poca profundidad de campo · una ficha de personaje fija por persona · 3 fotos nítidas por persona · nadie sin su OK.

## Técnica y reglas de producción
Stack: HTML + CSS + JS, Tailwind CDN, GSAP + ScrollTrigger, Lenis.

1. Fachada: una foto fija 4K; la cámara (dolly, apertura de la ventana, cruce) es código.
2. Salas: un panorama 360° equirectangular por sala (5792 / 4096 / 2048 px), validado antes de montarlo.
3. Recorrido de cada sala = paradas (yaw, pitch, fov) definidas en js/config.js; nada de vídeo.
4. Encima, HTML real: textos, rótulos, cartelas, pantallas con webs reales en perspectiva, juego.
(Sustituye al plan anterior de fotogramas clave + recorridos generados con Higgsfield.)

Plan de carga: fachada ~2 MB al entrar · sala 8–15 MB desktop / 3–5 MB móvil · juego 150–300 KB · cada sala se precarga mientras se ve la anterior · AVIF/WebP · modo imágenes fijas con conexión lenta o reducir movimiento.

Anti-IA: lente 35 mm, misma luz y grano en toda la web · imperfección real · logo, textos y pantallas siempre SVG/HTML · cristal compensado con madera usada y molduras · cartelas estilo museo (pendiente de confirmar) · skills impeccable, taste-skill, high-end-visual-design · QA a 1440 y 390 px.

## Pendientes antes de producir
- [ ] Balcón y CTA
- [ ] Estilo de cartelas (Museo)
- [ ] Persona de Software & AI
- [ ] OK de las cinco personas
- [ ] 3 fotos nítidas por persona
- [x] Logo en vector
- [ ] Fase 9 — Cookies: o banner de consentimiento con "Configurar cookies" y analítica que solo se carga tras aceptar, o quitar la analítica y adaptar la política. No tocar el texto legal hasta decidirlo (el enlace ya lleva `data-cookie-settings`).
- [ ] Datos reales en js/config.js
- [ ] Piloto aprobado: fachada + pasillo + Sala Diseño Web
