# BRIEF — Web Evimes: la oficina
_16 nov 2026 · Oscar_

Rediseño de evimesweb.com. La home es una sola escena: estás sentado en la silla del jefe, en la oficina de Evimes. La oficina se abre con el scroll, los proyectos salen del monitor como cards, las cifras aparecen en el techo y, al bajar la mirada, la web pasa a secciones planas (planes, servicios, preguntas, contacto). Nada se genera ni se construye sin el visto bueno de Oscar.

> La idea anterior (fachada, ventana, pasillo, salas de cristal, arcade, balcón) está abandonada y archivada en `_archivo/idea-estudio/` (código, assets, BRIEF/CLAUDE/PRODUCT antiguos e index). No se borra nada.

## Reglas que se mantienen
- Nada de vídeos generados ni secuencias de fotogramas. Imágenes fijas + cámara en código.
- Todo super clean: ni deformaciones ni parpadeos. Si algo no queda perfecto, se quita (y se dice).
- Ningún texto, logo ni contenido de pantalla dentro de las imágenes generadas: siempre HTML/SVG encima. Excepción aceptada por Oscar: el logo EVIMES grabado en la pared navy del panorama (no se añade otro encima).
- Nada inventado: ni clientes, ni cifras, ni garantías, ni plazos. Las mediciones son reales y con fecha.

## Estructura de index.html
1. **Hero plano** (SEO, rápido): render plano de la oficina desenfocado y teñido de navy; H1 "Diseño web en Madrid que convierte visitas en clientes."; "Webs rápidas, a medida y pensadas para vender. Desde 150 €."; "Pide tu propuesta" + "Ver proyectos"; tres datos de `config.cifras`.
2. **La oficina se abre** (panorama 360°): el hero sube como un telón, el fondo pasa a nítido y cruza al panorama en el mismo encuadre (yaw 0°, pitch +5°); dolly fov 62 → 55. El ratón mira ±12° / ±6° con inercia; en móvil, arrastre y giroscopio.
3. **Proyectos**: cinco miniaturas en el monitor; cada una se convierte en su card (mismo elemento) y vuela a un arco de cinco delante de la mesa. Hover = vista previa vertical; clic = detalle casi a pantalla completa (captura, qué necesitaba, informe PageSpeed real, "Ver web"). Arrastre o flechas rotan el arco.
4. **Cifras en el techo**: la mirada sube; cuatro cifras llegan desde el fondo una tras otra, quedan en fila con "Diseñado para captar." y la mirada baja.
5. **Planes**: la oficina se desenfoca a navy; tres cards con el mismo material suben escalonadas. Fundamento (desde 150 €), Inmersión (500 €, recomendado), Impacto (a medida).
6. **También hacemos**: Software e IA · Automatización de servicios · Plantillas de portfolio para fotógrafos.
7. **Preguntas frecuentes** (pendientes de texto).
8. **Contacto**: tipo de negocio, nombre, WhatsApp y plan preseleccionado. Sin backend: envío por WhatsApp (si hay número en config) o correo.
9. **Pie**: logo, firma, email y legales.

Menú fijo de cristal: Proyectos · Planes · Servicios · Contacto + "Pide tu propuesta". WhatsApp flotante solo si `config.whatsapp` tiene número.

Páginas planas: `proyectos.html`, `planes.html`, `software-ia.html`, `automatizacion.html`, `plantillas-fotografos.html` y las legales.

## Assets
- `assets/oficina/pano-{5792,4096,2048}.jpg`: panorama equirectangular 2:1 desde la silla. Costura visible en ±180°: la cámara nunca mira ahí (yaw [−115°, +115°], pitch [−38°, +62°]).
- `assets/oficina/hero-*.{avif,webp,jpg}`: renders planos (tools/render-hero.sh).
- `assets/oficina/boli.png`: boli negro mate (detalle desactivado: queda fuera de cuadro).
- `assets/proyectos/`: capturas de Disco (Playwright) e informes Lighthouse (JSON + HTML + captura).

## Estética
Mundo de la foto: nogal, hormigón, ladrillo blanco, pared navy. Cards de material sólido blanco roto (#f4f1ea), radio 14 px, sombra suave, sin cristal ni brillos (tipo Apple). Libre Baskerville en titulares y cifras; Schibsted Grotesk en el resto. Navy #080b14 de base, piedra #e9e3d8 para el texto, cian solo en el foco.

## Fase onda (16 nov 2026) — la home nueva
La oficina queda aparcada (`oficina.html`, sin tocar). La home se construye desde el prototipo aprobado (`_archivo/prototipo-onda/`):
1. Fondo global: rayos (2D) + la onda de cromo (7 bandas Three.js con la forma exacta de la línea del monograma EH, cromo pulido, una luz cian por banda) + grano fijo.
2. Cabecera flotante de cristal (Herramientas · Proyectos · Planes · Contacto + "Pide tu propuesta"); cristal claro sobre el panel gris.
3. Hero: "Tu negocio merece una web a su altura." + línea + "Pide tu propuesta" / "Ver proyectos" + "Desliza".
4. Herramientas (cinta infinita de logos monocromos, se para con el ratón).
5. Frase "Si no eres visible, no existes." (palabra a palabra con el scroll).
6. Panel gris: "Cuatro oficios. Un mismo nivel." (bento 3D) · "Webs que dan que hablar." + la oficina (v-oficina-psi: la ventana se abre, EVIMES se enciende en cian, la cámara va al monitor, la web de Disco sube como una card y hace scroll sola, con su PageSpeed a los lados; se cierra en card) · "Con quién trabajamos". El gris termina con el borde inferior redondeado.
7. Planes (tres cards de cristal; listas "incluye" en BORRADOR) + enlace a planes.html.
8. Contacto: "¿Hacemos que se te vea?" con formulario (Web3Forms) + WhatsApp / email si están en config.js.
10. Páginas: servicios.html (los 4 oficios con su card 3D, cómo trabajamos, CTA) y planes.html (cards, tabla comparativa, qué pasa después, preguntas).
9. Pie: © 2026 Evimes · Madrid + legales.

## Pendientes
- [ ] Rellenar `js/config.js`: WEB3FORMS_KEY, email, teléfono y WhatsApp (ver DECISIONES.md, bloque 3).
- [ ] Confirmar que los datos de PageSpeed (js/data/pagespeed.js) son de discoproduccion.com.
- [ ] Confirmar los textos BORRADOR de servicios.html, planes.html y sus preguntas frecuentes.
- [ ] Más proyectos en la oficina: hoy solo sale Disco Producción (config.js → PROJECT). Amad Peña Barbershop ya no aparece en la home.
- [ ] Textos de la oficina (BORRADOR en js/data/oficina.js), sobre todo "Una oficina pequeña en Madrid, gente que diseña y programa cada web a mano." y "Su web ya está dando que hablar."
- [x] Panorama 4K (v-oficina-3).
- [ ] La oficina se construyó desde la descripción del prompt (no llegó el prototipo nuevo): revisar el resultado contra lo que se tenía en la cabeza.
- [ ] Pose fija del bento (movimiento reducido / pósters): es la del prototipo (t = 1,5 s) y deja el destello y el pin casi de canto. Decidir si se elige otro instante.
- [ ] Confirmar textos BORRADOR: js/data/servicios.js, js/data/clientes.js y los textos largos de servicios.html (noindex hasta entonces).
- [ ] Confirmar las listas "incluye" de cada plan (js/data/planes.js, BORRADOR, salen del prototipo).
- [ ] Decidir si las palabras apagadas de la frase (opacidad 0,16 antes de encenderse) se aceptan: no pasan AA en ese estado.
- [x] Integrar la oficina en `#oficina-slot` (v-oficina-2).
- [ ] URLs de los proyectos 2–5 (ahora "Próximamente").
- [ ] Confirmar "24 h" de respuesta (ahora "Rápida") y "+10 proyectos entregados".
- [ ] Textos de las preguntas frecuentes y de las líneas de cada plan.
- [ ] Número de WhatsApp en config.
- [ ] Ajustar puntos con `?ajustar=oficina` (monitor, pantallas del equipo, taza).
- [ ] Fase cookies (consentimiento antes de cualquier analítica).
- [ ] Imagen OG propia (ahora el render del hero).
