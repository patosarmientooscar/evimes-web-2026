# Decisiones (modo autónomo, 16-11-2026)

Lo que decidí sin poder preguntar, y por qué. Lo que Oscar tiene que revisar está en INFORME.md.

## Bloque 0 · Punto de partida
- El prompt anterior (oficina 4K + Con quién + "altura" en cian) ya estaba terminado y con su tag (`v-oficina-3`). Solo se ha añadido el tag `v-pre-autonomo`.
- Tags: cada bloque termina con un commit y el tag que lleva su nombre; el tag de antes de cada bloque es el del bloque anterior (el primero, `v-pre-autonomo`).

## Bloque 1 · Tubos más calmados (`v-tubos-calma`)
- Valores aplicados tal cual. El suavizado del scroll del hero en el código era 0.08 (no 0.09): pasa a 0.035 igualmente.
- "Recorrido un 40 % menor" = los cinco coeficientes del hero (subir, inclinar, girar) × 0.6 y la aceleración de la luz con el scroll (1.6 → 0.96).
- "Amplitud a la mitad" = los cuatro coeficientes del ratón × 0.5.
- Deriva automática: la única es el balanceo en Z de cada banda; su frecuencia pasa de 0.35 a 0.175 (la amplitud no cambia).
- Comprobado con una réplica de la simulación en Node: con los valores nuevos el empuje se nota en las 7 bandas a la vez (0.15–0.20 en todas), deja de verse a ~1 s y el campo se apaga del todo a 1,55 s. Antes: 1,8 s visible y 2,8 s hasta apagarse.

## Bloque 2 · Scramble (`v-scramble`)
- `js/ui/scramble.js` sale de la base del prompt con tres cambios: (1) el ancho del texto se FIJA (no solo min-width) mientras dura y se suelta al terminar, porque las mayúsculas aleatorias son más anchas que el texto y el botón crecía; (2) se puede llamar varias veces (solo engancha los elementos nuevos; `EV.scramble` para lo que se pinta después: planes, Con quién, formulario); (3) lee el texto al empezar, así funciona si el texto del botón cambia ("Enviar" → "Enviando…").
- Usa requestAnimationFrame (como la base del prompt), no gsap.ticker: es un efecto de 0,6 s que solo corre al pasar el ratón; en las páginas de texto no se carga GSAP.
- `data-c` / `data-of` pasan al `<span class="sl">`: si no, los textos de content.js / oficina.js borraban el span al rellenar.
- Las flechas "→" quedan fuera del `.sl` (también la de "Ver qué incluye cada plan", que estaba dentro del texto de content.js).
- "Ver más →" del bento: aria-label "Ver más sobre <oficio>" (cuatro enlaces iguales no dicen adónde van).
- Páginas de texto y legales: el botón "Pide tu propuesta" tenía un relleno que barría el texto al pasar el ratón; se quita y queda el scramble, que es el efecto común. "Volver al inicio" también lo lleva. No se ha tocado ni una palabra del texto legal.
- Aplicado a: menú (4 enlaces), "Pide tu propuesta" de cabecera y hero, "Ver proyectos", los 4 "Ver más", "Ver la web" de la oficina, los CTA de Con quién, los botones de los planes, "Ver qué incluye cada plan". No al interruptor de Con quién ni a los campos del formulario.

## Bloque 3 · Formulario de contacto (`v-form`)
- Web3Forms con POST JSON a https://api.web3forms.com/submit. Clave en `js/config.js` → `WEB3FORMS_KEY: ''`.
- **Para activarlo (Oscar, 3 pasos):**
  1. Entra en https://web3forms.com, escribe tu email (el que recibirá las propuestas) y pulsa "Create Access Key". Te llega la clave por correo.
  2. Pégala en `js/config.js` → `WEB3FORMS_KEY: 'la-clave'` (la clave es pública por diseño: solo sirve para enviarte correos a ti).
  3. Sube la web y haz un envío de prueba desde el formulario; debe llegarte "Nueva propuesta desde evimesweb.com".
- Mientras la clave esté vacía, el formulario valida y al enviar dice "Formulario en configuración" (y ofrece WhatsApp / email si están en config.js).
- "Soy…" y "Plan que te interesa" son chips (radio) en lugar de desplegables: con etiquetas que flotan, un `<select>` no encaja, y así el plan se ve preseleccionado de un vistazo. No son obligatorios (el prompt solo marca con * nombre, email, mensaje y privacidad).
- Preselección: `?plan=…`, `index.html#contacto?plan=…` (desde planes.html; al cargar baja al formulario y deja el hash en `#contacto`), los botones de los planes de la home (`data-plan`) y los CTA de Con quién (`data-perfil` marca "Soy…": antes cambiaban el asunto del mailto, que ya no existe).
- Datos privados fuera del código: el email y el teléfono que había en `js/config.js`, en el HTML de la home (enlaces y JSON-LD) y como "respaldo" en home.js y clientes.js se han quitado. `config.js` lleva `email`, `telefono`, `telefonoHref` y `whatsapp` vacíos; los enlaces directos solo se ven si están rellenos.
- NO se han tocado los textos legales (aviso legal, privacidad, cookies, términos), que llevan el email y el teléfono del titular: es texto legal (regla del proyecto) y la LSSI obliga a publicarlos. Tampoco `oficina.html` (aparcada).
- Animación de "Recibido": anillo (scale + opacity) y check que se dibuja con clip-path; nada fuera de transform/opacity/clip-path.
- Errores en un coral claro (#ff9b8a, ≈ 9:1 sobre el navy).

## Bloque 4 · Oficina nueva con PageSpeed (`v-oficina-psi`)
- Portada del prototipo `Downloads/evimes-oficina/index.html` (el `index-v2-tunel.html` no se ha usado): shaders, valores, tiempos y `SPOT` tal cual (incluida la taza en −12°, aunque en la foto la boca está más abajo: manda el prototipo). Track de 470vh.
- No se porta el túnel (`uWarp`), que en el prototipo vale siempre 0: el resultado visual es el mismo.
- Se mantienen del proyecto: panorama 4K o 4096 según la GPU, carga diferida con la foto desenfocada, progreso desde Lenis, bucle en gsap.ticker, cabecera oscura, versión fija y `?oficina=captura`.
- Contraste: el prototipo pone los textos del pie a .6 / .74 de opacidad, que no pasan AA sobre la foto; se quedan los valores reforzados de la fase anterior (velo más fuerte y textos a .86–.94).
- Indicadores: la etiqueta del tercero es "Prácticas recomendadas" (la del prototipo y la que usa PageSpeed Insights en español), no "Buenas prácticas" como decía el prompt: es una cifra citada de una herramienta real y conviene que se llame igual que allí. El dato sigue en `buenasPracticas` en js/data/pagespeed.js.
- **Hay que confirmar que los datos de PageSpeed (99 / 100 / 100 / 100, Agentic 2/2) son de discoproduccion.com** (salen de una captura de Oscar).
- El texto accesible del bloque (role="img") se genera desde js/data/pagespeed.js: lee la fuente, la web, la fecha y las cuatro cifras.
- Cabecera: oscura con la ventana abierta más del 60 % (con el 50 % se quedaba oscura sobre la card cerrada por un redondeo).
- Versión fija: render sin la card (P = 0.76) + la web de Disco en HTML + los 4 indicadores quietos (a los lados en escritorio, en fila debajo en móvil; tamaño en cqw para que escalen con la imagen). En móvil el texto de Disco va debajo de la foto, porque encima tapaba la fila de indicadores.
- El botón "Ver la web →" pasa al de cristal del prototipo (antes era una pastilla clara).

## Bloque 5 · Página de servicios (`v-servicios`)
- innovativecode.es/servicios se ha leído solo para la estructura (número, título, frase, párrafos, "qué incluye", CTA; pasos; CTA final). Ninguna frase suya: todos los textos son los del prompt, en `js/data/servicios-pagina.js` (BORRADOR).
- Fondo global compartido: nuevo `js/fondo/fondo.js` para servicios y planes, con los MISMOS módulos que la home (`js/fondo/rayos.js`, `js/fondo/onda.js`, `css/fondo.css`, el póster de `assets/onda/`). La home sigue con su propio `home.js`, que además lleva el hero, la frase, el panel gris, los planes y el contacto: reescribirlo para compartirlo era tocar lo que funciona. Opacidad de las bandas: `data-fondo-op="0.5"` en el body → 0,3 al bajar → 0 bajo las secciones grises (`data-cubre`).
- Las cards 3D son las del bento de la home: `js/bento/index.js` acepta ahora varios `[data-bento]` en la misma página (un solo bucle para todas; cada card solo pinta si está en pantalla). En la home no cambia nada.
- Cada sección: número fino (Fraunces 220), H2 = nombre del servicio, la frase destacada debajo (cian sobre navy; tinta suave sobre el gris, donde el cian no tiene contraste), párrafos, "Qué incluye" a dos columnas con filetes, CTA con scramble. No hay etiqueta encima del H2 (el detector de impeccable las prohíbe; el número ya hace ese papel).
- El H2 y la frase suben línea a línea con máscara: se parten en líneas reales según el ancho (`js/paginas/paginas.js`) y se vuelven a partir al cambiar el ancho.
- Las secciones grises (01, 03 y "Cómo trabajamos") tienen esquinas de 30 px arriba y abajo y suben 72 px al entrar.
- "Cómo trabajamos": la línea cian se dibuja con el scroll (scaleX; en móvil, vertical con scaleY), dentro de gsap.ticker.
- El HTML se ha generado una vez desde el archivo de datos (SEO y sin JS); `js/paginas/paginas.js` repinta desde los datos, así que para cambiar un texto basta con editar `js/data/servicios-pagina.js`.
- `servicios.html` deja de ser noindex (antes lo era porque los textos eran un borrador vacío). Los textos siguen en BORRADOR: Oscar debe confirmarlos antes de publicar.
- Se borra `css/servicios.css` (solo lo usaba la versión anterior de la página).
- `.enlace` (home.css) lleva `gap: .4em`: era inline-flex y se comía el espacio antes de la flecha.

## Bloque 6 · Página de planes (`v-planes`)
- `planes.html` rehecha sobre el fondo global (mismo `js/fondo/fondo.js` que servicios). Antes era una página de texto (doc.css).
- Las 3 cards son las de la home (mismas clases y el mismo borde de luz que sigue al ratón), en grande; la recomendada con borde cian. Botones a `index.html#contacto?plan=fundamento|inmersion|impacto` (el formulario lo preselecciona y baja a él).
- Tabla comparativa: filas = todos los puntos de `js/data/planes.js` (12, cada plan tiene 4 propios), columnas = los 3 planes, ✓ cian o "—". Nada inventado: como cada plan solo lista lo suyo, la tabla enseña exactamente eso (no se supone que Inmersión incluye lo de Fundamento). Cuando Oscar complete las listas, la tabla sale sola. En móvil, acordeón por plan (Inmersión abierto).
- "Qué pasa después": los 4 pasos de servicios en versión corta (campo `corto` en `js/data/servicios-pagina.js`).
- Preguntas frecuentes en `js/data/faq-planes.js`: cuatro respuestas prudentes, sin IVA, plazos, permanencias ni promesas; todas marcadas `confirmar: true`. "¿La web es mía?" remite a la propuesta escrita en vez de afirmar condiciones que no conozco.
- Textos de la página en `js/data/planes-pagina.js` (BORRADOR). `js/paginas/planes.js` pinta cards, tabla, acordeón y FAQ desde los datos (y es la misma plantilla que generó el HTML).
- JSON-LD: OfferCatalog con un Offer por plan (Fundamento con precio mínimo 150 €, Inmersión 500 €, Impacto sin precio).

## Bloque 7 · Menú, enlaces, fondo común y QA (`v-autonomo-final`)
- Menú igual en las 3 páginas: Servicios → servicios.html, Proyectos → index.html#oficina, Planes → planes.html, Contacto → index.html#contacto, con la página actual marcada (`aria-current="page"`). En la home, "Proyectos" y "Contacto" son anclas de la misma página.
- Las páginas planas (legales, proyectos, automatización, software IA, plantillas) llevan los mismos 4 enlaces en su cabecera (`.doc-nav`, con scramble); en móvil se ocultan y queda el logo, que vuelve a la home. Los textos legales no se han tocado.
- Los "Ver más" del bento van a servicios.html#web, #3d, #seo y #ia (desde `js/data/servicios.js`). Comprobado con un script que abre todas las páginas: todos los enlaces internos existen y sus anclas también.
- Fondo común: servicios y planes usan `js/fondo/fondo.js` con los mismos rayos, bandas y póster que la home (ver bloque 5).
- Lighthouse móvil de servicios daba TBT 920 ms: el bento creaba los 4 renderers WebGL a la vez (~1,8 s de CPU). Ahora, con varios `[data-bento]` en la página, cada card se crea al quedar a una pantalla. La home no cambia (un solo bento).
- planes.html: los botones "Empezar" llevan texto oculto (" · plan Fundamento") en vez de aria-label, porque Lighthouse (SEO) los marcaba como enlaces sin texto descriptivo; los ✓ / — de la tabla llevan role="img" (un aria-label en un span sin rol no vale).
- Home: las palabras apagadas de la frase "Si no eres visible, no existes." pasan de .16 a .45 de opacidad. Con .16 no cumplía AA (Lighthouse lo marcaba); con .45 el blanco y el cian dan al menos 3:1 (texto grande) sobre el fondo oscuro y el encendido palabra a palabra sigue viéndose.
- Las cifras de Lighthouse van en INFORME.md tal cual salieron (servidor local, Edge headless, sin caché de CDN: en producción pueden cambiar).

---

# Segunda tanda autónoma (páginas propias + GitHub Pages)

## Bloque 1 · Oficina vista de lejos (`v-oficina-lejos`)
- Valores copiados del prototipo `Downloads/evimes-oficina/index.html` (versión del 17-11, 15:28) en `js/oficina/timeline.js`: hacia el monitor pitch monPitch+6 y fov 70; card fuera: pitch monPitch+8 / +13 (móvil) y fov 64 / 66; cierre fov 68 (74 en móvil, como el prototipo).
- Tamaño final de la card: mW·0,6 en escritorio, como pide el prompt. El prototipo pone mW·0,5; me quedo con el 0,6 del prompt porque es el valor que se pidió de forma explícita, y con 0,6 los indicadores siguen cabiendo a los lados. En móvil mW·0,85 (prompt y prototipo coinciden).
- Indicadores: el mismo cálculo del prototipo (a los lados, tamaño = 42 % del alto de la card, mínimo 70 px). En escritorio no tapan ni el monitor ni el texto de Disco (capturas 0.2 / 0.45 / 0.6 / 0.75).
- **A revisar en móvil:** con estos valores (los del prototipo) la card tapa EVIMES en 0.6–0.75, y la fila de indicadores y el texto de Disco quedan encima de la mitad baja del monitor. El monitor está en cuadro, pero no se ve limpio. No lo he cambiado porque el prompt pide copiar los valores tal cual; si se quiere, la palanca es `cardPitch` en móvil (monPitch+13) y el tamaño de la card (mW·0,85).
- Versión fija rehecha con la nueva cámara (`assets/oficina/oficina-fija*.webp` y `FIJA` en `js/oficina/config.js`).

## Bloque 2 · Cuatro páginas propias del menú (`v-paginas`)
- Menú igual en todas: Servicios → servicios.html · Proyectos → proyectos.html · Planes → planes.html · Contacto → contacto.html · "Pide tu propuesta" → contacto.html (también en la home y en las páginas legales y planas). En la home, el botón del hero, los planes y los CTA de Con quién siguen bajando al formulario de la propia home, que funciona igual.
- Enlaces desde la home: "Ver más" del bento → servicios.html#… (ya estaba) · Trabajo selecto → "Ver todos los proyectos" (proyectos.html) · Planes → "Ver qué incluye cada plan" (planes.html, ya estaba) · Contacto → "Qué pasa después de escribirnos" (contacto.html#despues).
- Dominio: canonical, og:url y JSON-LD con `https://evimesweb.com/` (sin www) en todas las páginas, también la home y los canonical de las legales, para no mezclar www y sin www. El "www.evimesweb.com" que aparece dentro del texto legal no se toca.
- servicios.html: se ajusta sin rehacerla. Añadidas las preguntas frecuentes (`js/data/faq-servicios.js`, BORRADOR, sin precios ni plazos) con FAQPage en el JSON-LD. Van ANTES del CTA final (el prompt las numera después): así la página termina en una acción, igual que planes.html. Los CTA llevan a contacto.html y planes.html; "Ver un proyecto" → proyectos.html#disco.
- proyectos.html (antes era una página de texto; se rehace):
  - Disco como caso de estudio: card de cristal con filo de cromo donde la web hace scroll sola (la misma tira de 4 capturas de la oficina, `disco-strip.webp`, animación CSS de transform; quieta con movimiento reducido). Ficha, "El reto", "Lo que hicimos" y "Resultado" con los 4 indicadores en el diseño de la oficina (`js/paginas/proyectos.js`, desde `js/data/pagespeed.js`; cuentan desde 0 al entrar en pantalla), "Agentic Browsing 2/2" y "Medido con PageSpeed Insights · discoproduccion.com · 16 de noviembre de 2026".
  - **Amad Peña: `assets/proyectos/amad-pena-barbershop.jpg` no existía** (ni en el proyecto ni en Descargas). La he sacado yo con Playwright de la web publicada (https://patosarmientooscar.github.io/Pelqueria-A-M/, 1440×900): es una captura real, no un montaje. Sin cifras (no hay datos medidos).
  - "Próximo proyecto · En el horno": 2 cards de cristal sobre un fondo borroso hecho del propio póster de la onda (`horno-1/2.webp`, desenfocado una vez con ffmpeg: nada de blur en vivo). Sin nombres.
  - El número (01, 02) va dentro del H2 (aria-hidden) para que el titular y su número sean un solo bloque.
- planes.html: botones a `contacto.html?plan=fundamento|inmersion|impacto`; CTA final a contacto.html; las preguntas frecuentes las pinta ahora `js/paginas/faq.js` (común con servicios).
- contacto.html: el formulario es EL MISMO de la home (el generador lo copia de index.html, así solo hay un diseño) con el mismo `js/contacto/form.js`. Con `?plan=` marca el plan y baja al formulario. A la derecha "Te respondemos personalmente, sin bots.", WhatsApp y email desde config.js (vacíos = no salen) y "Madrid". Debajo, "Qué pasa después" en gris; "Llamada de 20 minutos" marcado BORRADOR en `js/data/contacto-pagina.js`.
- Arreglos de paso:
  - `[hidden] { display: none !important }` en base.css: varias reglas `display:` pisaban el atributo hidden (en contacto salían WhatsApp y Email vacíos).
  - `--tinta-2` no existía fuera del panel de la home, así que el texto secundario sobre gris de servicios y planes salía a tinta plena. Ahora está definido en `.pag`.
  - home.js limpiaba el teléfono con `/s/g` en vez de `/\s/g`.
- Rutas: todas relativas (comprobado con grep: nada empieza por "/").

## Bloque 3 · GitHub público + GitHub Pages (`v-publicado`)
- Privacidad: el email y el teléfono estaban escritos en los 4 textos legales, en `oficina.html` (aparcada) y en `_archivo/`. Los he quitado. En los legales, la línea "Correo electrónico / Email" y "Teléfono" sigue con el mismo texto, pero el dato sale de `js/config.js` (`js/datos-legales.js`); vacío = la línea no se muestra. El domicilio no estaba en la lista y es obligatorio en el aviso legal: se queda (ver INFORME).
- `js/config.js`: todos los datos de contacto y la clave vacíos; `urls` pasan a relativas.
- `.nojekyll` en la raíz (GitHub Pages sirve los archivos tal cual).
- **Historia:** las versiones antiguas llevan el email y el teléfono, y todos los commits el gmail como autor. Reescribir la historia (`git filter-branch`) lo bloqueó la protección de Claude Code por destructivo, y no lo forcé. Hacer público el repo privado `evimes-web` expondría esa historia: GitHub muestra los commits antiguos en la actividad. Decisión: `evimes-web` se queda PRIVADO con la historia completa (copia de seguridad) y la web va a un repo PÚBLICO nuevo, `evimes-web-2026` (el nombre de reserva del prompt, porque `evimes-web` ya existe), con una sola "foto" del estado actual y el email noreply de GitHub como autor. Se publica con `tools/publicar.sh`. Los tags `v-…` solo están en local y en el privado.
