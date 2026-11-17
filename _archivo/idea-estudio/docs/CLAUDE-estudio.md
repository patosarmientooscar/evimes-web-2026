# Evimes — "El Estudio"

Experiencia cinematográfica controlada por scroll: la cámara entra por la ventana de un edificio señorial de Madrid y recorre salas de cristal, una por servicio.

## Reglas del proyecto

- **Stack:** HTML + CSS + JS plano, Tailwind CDN, GSAP + ScrollTrigger, Lenis. Sin React, sin TypeScript, sin build step.
- **Diseño:** aplica SIEMPRE las skills `impeccable`, `design-taste-frontend` (taste-skill) y `high-end-visual-design`. Nivel del mejor estudio web del mundo. Nada puede parecer hecho por IA ni plantilla.
- **Backup obligatorio:** commit + tag de git al final de cada fase. Nunca toques la web antigua (solo lectura).
- **Cambios quirúrgicos:** no reescribas lo que ya funciona.
- **Animación:** anima solo `transform`, `opacity` y `clip-path`. Un único ticker (`gsap.ticker`) para todo (Lenis incluido).
- **Accesibilidad:** respeta `prefers-reduced-motion`. Contraste AA. `focus-visible` en todo lo interactivo. Idioma: español.
- **Imágenes generadas:** ningún texto, logo ni contenido de pantalla va dentro de ellas. Siempre HTML o SVG real encima.
- **Prohibido:** Inter / Roboto / Arial, degradados morados, emojis en la UI, eyebrow sobre cada título, "→" en todos los botones, fade-up en todo, tarjetas redondeadas genéricas.
- **Sin vídeo (desde v2b):** nada de vídeos generados ni secuencias de fotogramas de recorridos. Fachada = foto fija 4K con cámara en código. Cada sala = panorama 360° fijo que gira con el scroll (Three.js). Entre salas: desenfoque de cristal + fundido. Nunca se atraviesa un cristal o ventana cerrada: o se abre, o es un corte. Super clean: si algo no queda perfecto, se quita.

## Estructura

- `js/config.js` — datos de contacto, redes, URLs.
- `js/content.js` — todos los textos de la web, por zona.
- `js/engine/` — motor de scroll.
- `js/zones/` — un archivo por zona.
- `js/game/` — juego del arcade.
- `assets/zones/NN-nombre/{desktop,mobile}/` — fotogramas/escenas por zona.
- `assets/screens/` — capturas o iframes de webs de clientes.

## Motor (v2b)

- Orden del tick único: Lenis → `zones.flush` → `stage.render` → `overlay.update` (ver `js/main.js`).
- `js/engine/stage.js` decide qué se ve detrás de cada zona (sustituye a `sequence.js`, que queda como `sequence-legacy.js`, desconectado). Zonas sin escena: fondo navy + nota "escena pendiente".
- Zonas y duraciones (pantallas de pin) en `js/zones/manifest.js`.
- Fachada: `js/zones/01-fachada.js`. Un contenedor `.fachada-cam` con foto, letras, hojas, interior y barandilla; la cámara lo mueve con una sola transformación (nada se desfasa). Ventana en `config.fachada.ventana` (dos hojas, bisagras, pasamanos). Las hojas y la barandilla se recortan de la foto a píxeles enteros (copia 1:1: invisibles hasta que giran).
- Salas 360°: `js/engine/pano.js` (Three.js 0.160 por CDN, módulo → `window.THREE`). Todo el recorrido de una sala vive en `config.salas[id]`: paradas, anclas de cartelas, rótulo, pantallas, luces. La costura (±180°) se evita sola según el fov real; comprobar con `EV.pano.seamCheck('diseno-web')`.
- Cartelas ancladas: el lado y la tinta (piedra o navy, con su velo) se deciden al aparecer según lo que hay detrás; AA garantizado por el scrim.
- Pruebas: `?modo=fijo` / `?modo=cine` fuerza el modo.
- Logos vectoriales en `assets/logo/` (no retocar). Se eligen en `config.logo` y se montan con `data-logo="<clave>"` (js/brand.js). Los `evimes-navy-*` / `evimes-grey-*` / `evimes-logo-animado` son PNG metidos en SVG: no usarlos.
- `?ajustar=letras` / `?ajustar=ventana`: arrastrar puntos sobre la foto (los coincidentes se mueven juntos); copia el bloque para `config.fachada`.
- `?ajustar=sala`: "Mirar" → arrastrar para girar, rueda = fov, clic = copia (yaw, pitch); marca anclas y esquinas; avisa si la costura entra en cuadro.
- Efectos de luz (halo, reflejos, desenfoques): pintados una vez en canvas o en WebGL. Nada de `filter` CSS en vivo sobre capas que se mueven (picos de 1,5 s medidos).
- Ojo: `img { max-width: 100% }` global. Imágenes con tamaño propio dentro de capas escaladas necesitan `max-width: none`.
