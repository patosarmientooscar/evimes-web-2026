# PROMPT — Hero "La onda de cromo" + fondo global + secciones

Pégalo en Claude Code con la carpeta `NEW EVIMES` abierta.

```
Lee CLAUDE.md. Aplica impeccable, taste-skill y high-end-visual-design.
ANTES DE NADA: commit y tag `v-pre-onda`.

CONTEXTO
La oficina queda APARCADA: no la toques ni la borres. Esta fase construye el resto de la home a partir de un prototipo ya aprobado en estilo.
Prototipo de referencia: C:\Users\o2452\Downloads\evimes-hero\index.html
Ábrelo en el navegador y léelo entero antes de empezar. Es la referencia visual y de comportamiento: pórtalo a la estructura del proyecto (css/, js/, assets/), no lo pegues tal cual.

1. FONDO GLOBAL (todo el sitio)
- Dos capas fijas detrás de todo el contenido:
  a) Beams: los rayos de luz de Evimes (navy #080b14, cian, algo de violeta), canvas 2D a media resolución con blur, movimiento lento.
  b) "La onda de cromo": 7 bandas metálicas en Three.js con la forma EXACTA de la línea que cruza el monograma EH (los puntos normalizados están en el prototipo, constante P). Gigantes, entran por la derecha en diagonal y se salen de cuadro.
     · Material: cromo pulido (MeshPhysicalMaterial, metalness 1, roughness ~0.13, clearcoat) con un entorno de estudio navy con luces blancas y vetas cian/violeta (ver función env del prototipo), para que reflejen "los beams".
     · Por cada banda, una línea de luz cian que la recorre de punta a punta (shader aditivo sobre la UV a lo largo del tubo), cada una con su desfase.
     · Ratón: inclinación de pocos grados con inercia (lerp 0.05). Nada brusco.
     · Scroll en el hero: las bandas suben, giran un poco y la luz acelera. Fuera del hero: opacidad ~0.3. Sobre secciones con fondo propio: opacidad 0.
  c) Grano de película fijo, muy sutil.
- Three.js con versión exacta (0.160.0), un solo renderer y un solo bucle. dpr ≤ 2. Sin WebGL o con prefers-reduced-motion: imagen fija de las bandas (genera un PNG desde el propio render) y sin luces en movimiento.
- Las bandas NO pueden tapar texto: detrás del bloque del hero va un degradado radial navy suave (como en el prototipo). Comprueba contraste AA del subtítulo.

2. TIPOGRAFÍA (más gruesa)
- Titulares: Fraunces (variable, Google Fonts), peso 620, opsz 144, tracking −0.022em. Es la opción B del prototipo.
  · Si Oscar elige otra en el selector del prototipo: A = Libre Baskerville 700; C = Schibsted Grotesk 760. Deja el cambio en una sola variable CSS (--display, --display-w, --display-track).
- Texto: Schibsted Grotesk.
- El logo EVIMES de la cabecera sigue con el SVG de la marca (assets/logo/evimes-wordmark.svg), no con la tipografía.
- Quita del sitio el selector de fuentes (era solo para el boceto).

3. SECCIONES DE LA HOME, en este orden
 1) Cabecera flotante de cristal (logo, Herramientas · Proyectos · Planes · Contacto, botón "Pide tu propuesta"). Sobre secciones claras cambia a cristal claro con texto oscuro.
 2) Hero:
    H1: "Tu negocio merece una web a su altura."
    Línea: "Diseño web a medida en Madrid. Webs rápidas, únicas y pensadas para convertir visitas en clientes. Desde 150 €."
    Botones: "Pide tu propuesta" (#contacto) y "Ver proyectos" (#oficina). Indicador "Desliza".
    Entrada: el H1 sube línea a línea; subtítulo y botones aparecen después.
    SEO: title "Evimes | Diseño web en Madrid desde 150 €", description, canonical, OG, JSON-LD (si ya existen de fases anteriores, revísalos).
 3) Herramientas: etiqueta "Herramientas con las que trabajamos" + carrusel infinito de logos monocromos (Figma, React, Three.js, GSAP, Vercel, GitHub, Supabase, Claude, Notion, Canva, Google Ads, Hotjar). Descarga los SVG de simple-icons a assets/tools/ (no los cargues de CDN). Se pausa al pasar el ratón.
 4) Frase: "Si no eres visible, no existes." enorme; las palabras se encienden una a una con el scroll; "no existes." en cian.
 5) Panel gris (#e6e4df) con esquinas superiores redondeadas que sube sobre el fondo: etiqueta "Proyectos", titular "Siéntate. Esto es lo que hacemos." y el hueco donde irá la oficina (deja un placeholder limpio con id="oficina-slot"). Las bandas se ocultan mientras el panel cubre la pantalla.
 6) Planes (de nuevo sobre el fondo): "Un plan para cada negocio." + "Sin letra pequeña." y tres cards de cristal (blur, borde de luz fino, brillo cian que sigue al ratón por el borde, entrada escalonada):
    · Fundamento — desde 150 € — Para empezar con buena base.
    · Inmersión — 500 € — Para destacar y captar clientes. [Recomendado]
    · Impacto — A medida — Proyectos a medida. Botón "Pide presupuesto".
    Las listas de "incluye" están en el prototipo: ponlas en js/data/planes.js marcadas como BORRADOR (Oscar debe confirmarlas).
    Enlace "Ver qué incluye cada plan →" a planes.html.
 7) Contacto: "¿Hacemos que se te vea?" enorme + "Pide tu propuesta" + "o escríbenos por WhatsApp" (número desde config; si está vacío, oculta ese enlace).
 8) Pie: © 2026 Evimes · Madrid + legales.

4. QA
- Capturas con Playwright a 1440×900, 1920×1080 y 390×844: hero, herramientas, frase, panel gris, planes, contacto.
- Comprueba: sin errores en consola; las bandas no tapan texto; contraste AA; 60 fps en escritorio; en móvil, las bandas arriba y el texto abajo, legible.
- Dime 3 problemas, arréglalos, vuelve a capturar y pasa el audit de impeccable.

Commit "home: fondo onda de cromo + hero + secciones" y tag `v-onda-1`. Enséñame las capturas y para. No despliegues.
```
