# PRODUCT — Evimes, "La oficina"

> Fuente: BRIEF.md (manda si hay contradicción). Lo que BRIEF no resuelve va marcado [supuesto].

## Qué es
Web de Evimes (diseño web en Madrid, desde 150 €). La home es una escena: la oficina de Evimes vista desde la silla del jefe (panorama 360°) que se abre con el scroll, saca los proyectos del monitor como cards y baja a planes, servicios, preguntas y contacto. Ver BRIEF.md (manda). La idea anterior (fachada, pasillo, salas, arcade, balcón) está archivada en _archivo/idea-estudio/.

**Regla de oro:** nada se genera ni se construye sin el visto bueno de Oscar.

## Superficies y modo
- `index.html`: **Persuade + Experience**. Hero plano → oficina 360° → proyectos → cifras → planes → también hacemos → preguntas → contacto → pie.
- `proyectos.html`, `planes.html` y páginas de servicios: planas, mismo sistema visual.
- Páginas legales: **Read**.

## Para quién
Negocios que quieren que se les vea y que les elijan. [supuesto: pymes y negocios locales de Madrid —hostelería, barberías, comercio— con decisores no técnicos; la web antigua se posicionaba así.]

## Qué tiene que conseguir
Que el visitante vea trabajo real y medido, entienda los precios y pulse "Pide tu propuesta".

## Mundo visual
- La oficina de la foto: nogal, hormigón, ladrillo blanco, pared navy con EVIMES grabado, luz de día.
- Cards de material sólido blanco roto (#f4f1ea), radio 14 px, sombra suave. Sin cristal ni brillos.
- Paleta: navy #080b14 de base, piedra #e9e3d8 para texto, cian #00e5ff solo en el foco.
- Libre Baskerville en titulares y cifras; Schibsted Grotesk en texto.

## Contenido y producción
- Logo, textos, rótulos, cartelas y pantallas siempre en SVG/HTML real, nunca dentro de imágenes.
- Panorama 360° fijo + cámara en código. Nada de vídeo.
- Mediciones reales (Lighthouse) para cifras y píldoras; nada inventado.
- Carga: el hero sin Three.js ni panorama (llegan al primer scroll); versión fija con movimiento reducido, conexión lenta o sin WebGL.
- Sonido apagado por defecto.

## Prohibido
Inter, Roboto o Arial; degradados morados; emojis; eyebrows; "→" en todos los botones; fade-up en todo; tarjetas redondeadas genéricas; texto dentro de imágenes generadas; "visibilidad garantizada" o porcentajes sin fuente.
