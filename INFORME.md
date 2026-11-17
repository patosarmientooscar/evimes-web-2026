# Informe: páginas propias + oficina de lejos + GitHub Pages (17-11-2026)

Los 4 bloques están hechos y no se ha revertido ninguno. Las decisiones que tomé sin preguntarte están en `DECISIONES.md`, con su porqué ("Segunda tanda autónoma"). El informe de la tanda anterior está en la historia de git (tag `v-autonomo-final`).

## Para abrir en el móvil

- **Web publicada (GitHub Pages):** <!--PAGES-->
- **Repositorio público:** <!--REPO-->

## Lo que tienes que hacer tú

1. **Rellenar `js/config.js`:**
   - `WEB3FORMS_KEY` (la clave del formulario);
   - `whatsapp`;
   - `email`;
   - `telefono` y `telefonoHref` si quieres el teléfono.

   Los pasos para sacar la clave de Web3Forms están en DECISIONES.md, bloque 3 de la primera tanda.
2. **El formulario NO enviará correos desde GitHub Pages hasta que pongas la clave de Web3Forms.** Mientras tanto avisa con "Formulario en configuración". Con la clave puesta funciona también en Pages: Web3Forms no necesita servidor propio.
3. **El email y el teléfono de los textos legales también salen ahora de `js/config.js`.** Mientras estén vacíos, esas dos líneas del aviso legal, la privacidad, los términos y las cookies no se muestran. El texto legal sigue igual palabra por palabra. Lo que pongas en `config.js` y publiques será público (igual que en cualquier web).
4. **Confirmar que los datos de PageSpeed** (`js/data/pagespeed.js`: 99 · 100 · 100 · 100, Agentic Browsing 2/2, 16-11-2026) **son de discoproduccion.com.**
5. **Revisar los textos BORRADOR:**
   - `js/data/servicios-pagina.js`, `js/data/faq-servicios.js` (servicios);
   - `js/data/proyectos-pagina.js` (proyectos);
   - `js/data/planes-pagina.js`, `js/data/faq-planes.js` (planes);
   - `js/data/contacto-pagina.js` (contacto; "Llamada de 20 minutos" está sin confirmar);
   - `js/data/oficina.js` (oficina);
   - `js/data/clientes.js` (con quién).
6. **Mirar en el móvil la oficina entre 0.6 y 0.75 del scroll.** Con los valores del prototipo, la card tapa EVIMES y los indicadores quedan encima de la parte baja del monitor (ver bloque 1).
7. **El domicilio del aviso legal** (Av. Cardenal Herrera Oria…) sigue escrito en el HTML. No estaba en la lista (email, teléfono, claves), es un dato obligatorio del aviso legal y no lo he tocado. Si es tu casa y no quieres que esté en un repositorio público, dímelo.

## Bloques y tags

| Bloque | Tag | Qué se hizo |
|---|---|---|
| 0 · Punto de partida | `v-pre-paginas` | No quedaba nada a medias de la tanda anterior (tubos, scramble, formulario, oficina PSI, servicios y planes estaban cerrados con `v-autonomo-final`). |
| 1 · Oficina vista de lejos | `v-oficina-lejos` | La cámara ya no se acerca: hacia el monitor pitch +6 y fov 70; con la card fuera pitch +8 / +13 (móvil) y fov 64 / 66; cierre fov 68. Card final mW·0,6 en escritorio y mW·0,85 en móvil. Indicadores a los lados, tamaño según la card (mínimo 70 px). La versión fija se ha rehecho con la nueva cámara. |
| 2 · Páginas propias | `v-paginas` | Una página por enlace del menú: servicios.html (ajustada: preguntas frecuentes nuevas y CTA a contacto/planes), **proyectos.html** (nueva), planes.html (botones a contacto.html?plan=…) y **contacto.html** (nueva). Desde la home, cada sección enlaza a su página. Menú y "Pide tu propuesta" a las páginas nuevas en todas partes. Canonical, OG y JSON-LD propios en cada página (`https://evimesweb.com/…`). |
| 3 · GitHub público + Pages | `v-publicado` | Privacidad (email y teléfono fuera del código), `.nojekyll`, repositorio público, GitHub Pages y comprobación en el móvil. |

Lo nuevo de cada página:

- **proyectos.html:**
  - Disco como caso de estudio: card de cristal con filo de cromo donde la web hace scroll sola, ficha, el reto, lo que hicimos y el resultado con los 4 indicadores de PageSpeed (el mismo diseño que en la oficina, cuentan desde 0 al entrar), con "Medido con PageSpeed Insights" y la fecha.
  - Amad Peña sobre el gris, sin cifras.
  - Dos cards "Próximo proyecto · En el horno".
  - "¿El siguiente eres tú?".
- **contacto.html:**
  - "¿Hacemos que se te vea?" enorme.
  - El mismo formulario de la home a la izquierda: lee `?plan=`, marca el plan y baja al formulario.
  - A la derecha: "Te respondemos personalmente, sin bots.", WhatsApp y email desde config.js (vacíos, no salen) y Madrid.
  - Debajo, "Qué pasa después" en 3 pasos.
- **servicios.html:** cuatro preguntas frecuentes (plantillas, móvil, empezar con un servicio, marca blanca), sin precios, plazos ni IVA.

## Lo que falló, se cambió o hay que saber

Nada se ha revertido. Lo que hay que saber:

- **La captura de Amad Peña no existía** (`assets/proyectos/amad-pena-barbershop.jpg`, ni en el proyecto ni en Descargas). La saqué yo de la web publicada, con Playwright a 1440×900. Es una captura real.
- **Tamaño de la card de la oficina:** el prototipo pone mW·0,5 en escritorio y el prompt mW·0,6. Usé 0,6, el valor que pedías de forma explícita.
- **Historia de git y repositorio público.** Las versiones antiguas del código tenían escritos el email y el teléfono (config.js antiguo y textos legales), y todos los commits llevan tu gmail como autor.
  - Lo que intenté: reescribir la historia para limpiarla (`git filter-branch`). La protección de Claude Code lo bloqueó por ser una acción destructiva, y no la forcé.
  - Lo que hice en su lugar, sin destruir nada:
    - **la historia completa sigue en local y en el repositorio PRIVADO `evimes-web`** (remoto `origin`), con todos los tags, como copia de seguridad;
    - el **repositorio PÚBLICO `evimes-web-2026`** (remoto `publico`) recibe solo una foto del estado actual: un commit sin pasado y con tu email noreply de GitHub, nunca el gmail;
    - por eso el repo público no tiene los tags `v-…`, que solo existen en local y en el privado. Tampoco usé `gh repo edit --visibility public` sobre `evimes-web`: GitHub enseña en la actividad del repo los commits antiguos, y con ellos los datos.
  - **Para publicar cambios a partir de ahora:** `sh tools/publicar.sh "mensaje"`. Sube la foto de `main` a Pages tras comprobar que no hay emails ni teléfonos. **Nunca `git push publico main`**: subiría la historia privada.
  - Copia de la historia original, sin tocar: `_respaldo/historia-original.bundle` (en .gitignore, no se sube).
- **Arreglos de paso:**
  - `[hidden]` no ocultaba elementos con `display` propio: en contacto salían WhatsApp y Email vacíos.
  - Faltaba `--tinta-2` en las páginas: el texto secundario sobre gris salía a tinta plena.
  - home.js limpiaba mal el teléfono.
  - `config.js → urls` tenía rutas absolutas ("/planes.html"), que no se usaban pero rompían la regla de Pages.

## QA (Playwright, Edge)

- **Capturas:** 5 páginas a 1440×900 y 390×844, sección a sección.
- **Errores en consola:** 0 en las 5. El único "500" es el error simulado del formulario.
- **fps en escritorio:** 60 en las 5 páginas (p95 17,2 ms).
- **Enlaces internos:** 150 en 13 páginas, todos bien (archivo y ancla).
- **Formulario:**
  - comprobado en contacto.html y en la home, a los dos tamaños: vacío, errores, sin clave, enviando, error y enviado;
  - `contacto.html?plan=inmersion` marca Inmersión y baja al formulario;
  - la petición a Web3Forms se simuló siempre: no salió nada.
- **Lighthouse** (accesibilidad, prácticas recomendadas, SEO): proyectos.html 100 / 100 / 100 y contacto.html 100 / 100 / 100.
- **Detector de impeccable** (proyectos, contacto, servicios, a 1440 y 390). Solo quedan cosas pedidas o aprobadas:
  - el brillo cian de los indicadores, del diseño de la oficina;
  - la etiqueta "Servicios" sobre el H1.
- **Oficina:** 0.2 / 0.45 / 0.6 / 0.75 a 1440×900 y 390×844. En escritorio el monitor, la mesa y EVIMES se ven siempre enteros. En móvil, ver el punto 6 de arriba.
<!--PAGES-QA-->

Capturas (en `.playwright-mcp/`, que no se sube al repositorio):

- **Oficina:** `.playwright-mcp/paginas/oficina/<ancho>-<progreso>.png` y las hojas `hoja-1440.png` y `hoja-390.png`.
- **Páginas:** `.playwright-mcp/paginas/<página>/<ancho>-<nn>-<sección>.png`, para index, servicios, proyectos, planes y contacto.
- **Formulario:** `.playwright-mcp/paginas/form-contacto/` y `.playwright-mcp/paginas/form-home/`.
- **Lighthouse:** `.playwright-mcp/paginas/lh/`.
- **GitHub Pages en el móvil:** `.playwright-mcp/paginas/pages/`.
