# Evimes — home "La onda", servicios, planes + la oficina (aparcada)

Home (index.html, fase onda): fondo global de rayos + "la onda de cromo" (7 bandas Three.js con la forma de la línea del monograma EH), hero, herramientas, frase, panel gris (bento "Qué hacemos" + Trabajo selecto con la oficina en `#oficina-slot` + "Con quién trabajamos"; termina con el borde inferior redondeado de 30 px), planes y contacto. Prototipo de referencia aprobado en estilo: `_archivo/prototipo-onda/`.
La oficina de la home (v-oficina-psi) es un port del prototipo aprobado `Downloads/evimes-oficina/index.html` (el `index-v2-tunel.html` de al lado NO es el bueno): `#oficina-slot`, track de 470vh. La oficina 360° antigua sigue APARCADA en `oficina.html` (noindex), con su motor (`js/engine/`, `js/zones/`, `secciones.js`, `header.js`, `main.js`) y su CSS (`css/oficina-aparcada.css`): no se borra. Ver BRIEF.md, DECISIONES.md e INFORME.md.

## Reglas del proyecto

- **Stack:** HTML + CSS + JS plano, GSAP + ScrollTrigger, Lenis, Three.js (solo para el panorama, cargado en diferido). Sin React, sin TypeScript, sin build step. Tailwind no se carga (no hay clases que lo usen y bloqueaba el LCP).
- **Diseño:** aplica SIEMPRE las skills `impeccable`, `design-taste-frontend` (taste-skill) y `high-end-visual-design`. Nivel del mejor estudio web del mundo. Nada puede parecer hecho por IA ni plantilla.
- **Backup obligatorio:** commit + tag de git al final de cada fase. Nunca toques la web antigua (solo lectura).
- **Cambios quirúrgicos:** no reescribas lo que ya funciona.
- **Animación:** anima solo `transform`, `opacity` y `clip-path`. Un único ticker (`gsap.ticker`) para todo (Lenis incluido).
- **Accesibilidad:** respeta `prefers-reduced-motion` (versión fija). Contraste AA. `focus-visible` en todo lo interactivo. Idioma: español.
- **Imágenes generadas:** ningún texto, logo ni contenido de pantalla va dentro. Siempre HTML o SVG real encima. (El logo grabado en la pared del panorama es la excepción aceptada: no se añade otro encima.)
- **Sin vídeo:** nada de vídeos generados ni secuencias de fotogramas. Super clean: si algo no queda perfecto, se quita y se dice.
- **Datos privados:** nada de emails, teléfonos ni claves en el código; van en `js/config.js`, vacíos (los textos legales llevan los del titular y no se tocan).
- **Nada inventado:** ni clientes, ni cifras, ni garantías. Las píldoras y cifras salen de mediciones reales (`js/data/mediciones.js`).
- **Prohibido:** Inter / Roboto / Arial, degradados morados, emojis en la UI, "→" en todos los botones, fade-up en todo, tarjetas genéricas de icono + título + texto.
- **Legales:** no cambiar ni una palabra del texto legal.

## Estructura

- `servicios.html`, `proyectos.html`, `planes.html` y `contacto.html` — una página por enlace del menú, sobre el mismo fondo global (`js/fondo/fondo.js` orquesta los mismos módulos que la home: rayos.js, onda.js, css/fondo.css). Estilos: `css/paginas-evimes.css`. JS común: `js/paginas/paginas.js` (textos desde los datos, líneas con máscara, entradas, línea de "Cómo trabajamos", acordeones, contacto directo desde config.js); `js/paginas/faq.js` (preguntas frecuentes); `js/paginas/proyectos.js` (indicadores de PageSpeed del caso Disco); `js/paginas/planes.js` (cards, tabla comparativa, acordeón y FAQ; también es la plantilla que generó el HTML). Textos: `js/data/servicios-pagina.js`, `js/data/proyectos-pagina.js`, `js/data/planes-pagina.js`, `js/data/contacto-pagina.js`, `js/data/faq-servicios.js`, `js/data/faq-planes.js` (BORRADOR). contacto.html usa el mismo formulario y módulo que la home. Rutas SIEMPRE relativas (la web se publica en GitHub Pages bajo /<repo>/). Las cards 3D de servicios son las del bento (`js/bento/`, varios `[data-bento]`, cada card se crea a una pantalla).
- `js/ui/scramble.js` — efecto scramble en botones y menú (`data-scramble` + `<span class="sl">`; sin efecto con movimiento reducido).
- `index.html` — home onda. Estilos: `css/fondo.css` (capas fijas) + `css/home.css`. JS: `js/fondo/rayos.js` (2D), `js/fondo/onda.js` (Three.js), `js/home.js` (bucle, secciones). Textos en `content.js` → `inicio.*`.
- Titulares de la home: una sola variable (`--display`, `--display-w`, `--display-track` en tokens.css). B = Fraunces 620 (elegida); A = Libre Baskerville 700; C = Schibsted Grotesk 760.
- `assets/onda/` — póster/versión fija y OG sacados del propio render (`?onda=captura&modo=cine`, ver LEEME). Si cambian las bandas o los rayos, se vuelven a sacar.
- `assets/tools/` — logos de simple-icons en local (máscara + currentColor).
- `oficina.html` — la oficina aparcada (hero + oficina pinned + secciones planas).
- `js/config.js` — contacto (email, teléfono, WhatsApp: VACÍOS en el repo, los rellena Oscar), `WEB3FORMS_KEY` (formulario), cifras y la geometría de la oficina aparcada.
- `js/content.js` — todos los textos (editables).
- `js/data/proyectos.js`, `js/data/planes.js`, `js/data/mediciones.js` — datos editables.
- `js/engine/` — motor: `util`, `lenis`, `stage`, `zones`, `overlay` (scrim, matrix3d), `pano` (Three.js).
- `js/zones/oficina.js` — la escena (cámara, cards, cifras, detalles vivos). `js/secciones.js` — secciones planas. `js/header.js` — menú y anclas.
- `css/fonts.css` (fuentes alojadas en `assets/fonts/`), `tokens.css`, `base.css`, `engine.css`, `oficina-aparcada.css` (la oficina aparcada), `oficina.css` (la oficina de la home), `con-quien.css`, `doc.css` + `paginas.css` (páginas planas y legales).
- `tools/render-hero.sh` — renders planos del panorama (ffmpeg v360). `tools/serve.js` — servidor local.
- `_archivo/idea-estudio/` — la idea anterior completa. No se carga.

## Home onda

- Un solo bucle (gsap.ticker): Lenis → `tick()` de home.js (estado por scroll con posiciones cacheadas, sin lecturas de layout por fotograma) → rayos → onda.
- Three.js 0.160.0 se importa al PRIMER GESTO (puntero, rueda, toque, tecla o scroll). Hasta entonces se ve el póster (fotograma opaco del mismo render, centrado: coincide con la cámara) y luego se funde con la onda en vivo; los rayos arrancan en t = 6 s, el mismo fotograma del póster.
- Bandas: extremos fundidos por UV (nunca se ve el corte del tubo; en escritorio se apagan antes del bloque del H1). La luz de cada banda avanza integrando la velocidad (acelerar con el scroll no la hace saltar). Opacidad 1 en el hero → 0.3 fuera; 0 (y sin render) cuando el panel gris cubre la pantalla.
- Cuerdas acopladas (onda.js, `SIM`): campo 96 × 7 en CPU (u, v) → DataTexture (R32F, Nearest) → `evDisplace` en el vertex del cromo (onBeforeCompile, cache key 'ev-chrome') y de la luz, interpolación Catmull-Rom sobre `aS`. El puntero (ratón o dedo) empuja con su velocidad · normal en pantalla × gauss(120 px) × 0.0036; paso fijo 1/90 s (máx. 6); vuelve a reposo en ~1 s. Sin empuje con movimiento reducido, fuera de la ventana o con el canvas a opacidad 0.
- Cinta de herramientas: paths de simple-icons inline (`fill="url(#chrome)"`, degradado en un <svg> oculto); nombres en el mismo cromo con background-clip:text y un brillo que se enciende nombre a nombre (solo opacidad). No se para nunca, salvo con movimiento reducido. Los logos que son una palabra (WebGL, OpenGL, GSAP, glTF) llevan el viewBox recortado.
- Grano: tesela PNG con fusión normal. NADA de mix-blend-mode ni feTurbulence a pantalla completa (costaban >1 s de TBT en Lighthouse móvil).
- Versión fija (movimiento reducido, ahorro de datos, 2G/3G, `?modo=fijo`): póster fijo, sin Three.js, frase encendida, cinta quieta.
- Ojo: no hay reset global de box-sizing; la home lo pone en `.inicio *`. Y `overflow-x: clip` en main: el degradado del hero es más ancho que el texto y Chrome móvil encogía la página.

## Panel gris (fase gris)

- "Qué hacemos" = bento de 4 cards 3D (fase bento, v-bento-1), portado TAL CUAL del prototipo aprobado `Downloads/evimes-cards/bento.html`: `css/bento.css` + `js/bento/` (shared · web · star · pin · ia · index). Cada card es un renderer WebGL propio que solo pinta si está visible; un único bucle para las cuatro dentro de gsap.ticker. Three.js 0.160.0 con la misma URL que la onda, importado al acercarse al bento. El EH grabado del destello se lee de `assets/logo/evimes-eh.svg`. Versión fija o sin WebGL: pósters `assets/bento/<card>-escritorio|movil.png` (se rehacen con `?bento=captura` → `window.__bentoPosters()`). Textos BORRADOR en `js/data/servicios.js`. Los tubos no renderizan sobre el gris (opacidad 0).
- Trabajo selecto + la oficina (`css/oficina.css`, `js/oficina/`: config · scene · card · timeline · index), portada del prototipo aprobado. Panorama 4K (`oficina-4k.webp`) en escritorio; `oficina-4096.webp` en móvil o si gl.MAX_TEXTURE_SIZE < 8192. Fases: ventana 0–0.16 · EVIMES cian 0.12–0.18 (dos parpadeos) · cap1 0.17–0.28 · un movimiento suave al monitor 0.24–0.5 · pantalla 0.28–0.4 · la web de Disco sube como card 0.38–0.56 (y hace scroll sola por sus 4 secciones, en bucle) · indicadores de PageSpeed 0.5–0.66 · texto de Disco desde 0.56 · cierre en card 0.9–1. Indicadores (HTML+SVG, `js/data/pagespeed.js`) colocados cada fotograma proyectando los bordes de la card. Progreso de Lenis; bucle en gsap.ticker, parado fuera (IO). Cabecera oscura con la ventana abierta > 60 %. Versión fija: `assets/oficina/oficina-fija*.webp` + la web de Disco en HTML + indicadores quietos (`FIJA` en config.js; se rehacen con `?oficina=captura` → `window.__oficinaCaptura(.76)`). Textos BORRADOR en `js/data/oficina.js`.
- Contacto: formulario (`css/contacto.css`, `js/contacto/form.js`) que envía a Web3Forms (clave en `config.js → WEB3FORMS_KEY`; vacía = "Formulario en configuración"). Plan preseleccionado con `?plan=` / `#contacto?plan=` / `data-plan`; "Soy…" desde los CTA de Con quién (`data-perfil`).
- "Con quién trabajamos" (última sección del gris): portado del prototipo aprobado `Downloads/evimes-cards/con-quien.html` (`css/con-quien.css`, `js/gris/clientes.js`): interruptor pequeño de cromo (role="radiogroup", flechas), titular con máscara por líneas, subrayado cian que se dibuja solo, columna lateral y tres puntos. Textos BORRADOR en `js/data/clientes.js` ("[palabra]" = subrayada). Gris del prototipo .58 → .62 (AA).
- `EV.home` (home.js) expone `lenis`, `ir`, `cine`… para los módulos del panel. `servicios.html`: los 4 oficios (anclas #web #3d #seo #ia), póster fijo, sin Three.js.
- Hero: "altura" en cian (`<span class="accent">` dentro de la línea que sube; si cambia `inicio.hero.linea2` en content.js, cambiarla también en index.html).

## Motor (oficina aparcada)

- Tick único: Lenis → `zones.flush` → `stage.render` (cámara + panorama + capas) → `overlay.update` (scrims).
- Zona `oficina` (manifest: 7 pantallas de pin). Tramos de progreso en `oficina.js` (constante `P`): apertura 0–0.10 · a mesa 0.10–0.17 · vuelo de cards 0.17–0.37 · arco quieto · a techo 0.52–0.62 · cifras 0.62–0.84 · salida a navy 0.84–1.
- Three.js 0.160 se importa al primer gesto de scroll (`EV.pano.load`). El hero no lo necesita. Pasada la oficina se libera el panorama (dispose).
- Proyección: `oficina.js` tiene su propio proyector, idéntico a la cámara de Three (lookAt sin alabeo). Todo lo pegado al panorama (miniaturas, huecos, reflejo, pantallas del equipo, vapor) usa la cámara final de `view.render()`: no baila.
- Cards: cada card es UN elemento; su posición son 4 esquinas interpoladas entre la miniatura del monitor y su sitio en el arco (homografía → matrix3d). Muelle 170/22 por card.
- Costura y silla: `EV.oficina.check()` recorre todo el scroll (con la mirada a tope) y devuelve el yaw y el pitch más extremos que llegan a verse.
- `?ajustar=oficina`: "Mirar" → arrastrar para girar, rueda = fov, clic = copia (yaw, pitch); marca monitor, pantallas, taza…
- `?modo=fijo` / `?modo=cine` fuerza el modo. Versión fija con movimiento reducido, conexión lenta o sin WebGL: foto plana + cards en rejilla + cifras en fila.
- Logos vectoriales en `assets/logo/` (no retocar). Se montan con `data-logo="<clave>"` (js/brand.js). Los `evimes-navy-*` / `evimes-grey-*` / `evimes-logo-animado` son PNG metidos en SVG: no usarlos.
- Efectos de luz y desenfoques: pintados una vez (canvas, WebGL o filtro estático). Nada de `filter` CSS animado en vivo.
- Ojo: `img { max-width: 100% }` global. Imágenes con tamaño propio dentro de capas escaladas necesitan `max-width: none`.
- Ojo: Schibsted con `tabular-nums` ensancha la coma ("0 , 7"). No usarlo donde haya decimales.
