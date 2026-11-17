# assets/onda

Fotogramas fijos de "la onda de cromo" para la versión fija (movimiento reducido,
sin WebGL, ahorro de datos) y la imagen OG. Salen del propio render
(`index.html?onda=captura&modo=cine`: bandas sin luces + rayos con t = 6 s).

- `onda-escritorio.png/.webp` — 1920×1080, dpr 1.
- `onda-movil.png/.webp` — 390×844 a dpr 2 (780×1688).
- `onda-og.jpg` — 1200×630 (og:image / twitter:image).

Si cambian la forma, la posición o el material de las bandas (js/fondo/onda.js)
o los rayos (js/fondo/rayos.js), hay que volver a sacarlos.
- `grano.png` — tesela de ruido 200×200 (ffmpeg, geq random) para el grano de película.
