/* ==========================================================================
   ui/scramble.js — "scramble" en botones y menú.
   Al pasar el ratón (o al recibir el foco con teclado) las letras del texto
   (<span class="sl"> dentro del botón; las flechas e iconos quedan fuera) se
   vuelven caracteres aleatorios y se resuelven de izquierda a derecha en
   0,6 s. El ancho se fija mientras dura (las mayúsculas aleatorias son más
   anchas que el texto) y se suelta al terminar: el botón no salta.
   Sin efecto con prefers-reduced-motion.
   Uso: <a data-scramble><span class="sl">Texto</span> →</a> · initScramble(root)
   (se puede llamar varias veces: solo engancha los elementos nuevos; también
   en window.EV.scramble para el contenido que se pinta después).
   ========================================================================== */
const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initScramble(root = document) {
  root.querySelectorAll('[data-scramble]').forEach(el => {
    if (el.__scr) return;
    el.__scr = true;
    const L = el.querySelector('.sl') || el;
    if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) el.setAttribute('aria-label', L.textContent.trim());
    if (reduce()) return;
    let raf = 0, txt = '', vivo = false;
    const fin = () => { L.textContent = txt; L.style.width = ''; L.style.overflow = ''; vivo = false; };
    const run = () => {
      if (reduce()) return;
      if (!vivo) txt = L.textContent;               // el texto real (puede cambiar: "Enviar" → "Enviando…")
      cancelAnimationFrame(raf); vivo = true;
      L.style.display = 'inline-block'; L.style.whiteSpace = 'nowrap'; L.style.verticalAlign = 'bottom';
      L.style.width = L.getBoundingClientRect().width + 'px'; L.style.overflow = 'hidden';
      const t0 = performance.now(), D = 600;
      const tick = now => {
        const p = Math.min(1, (now - t0) / D); let o = '';
        for (let i = 0; i < txt.length; i++) {
          const c = txt[i];
          if (c === ' ' || i < p * txt.length) { o += c; continue; }
          const r = CH[(Math.random() * CH.length) | 0]; o += c === c.toLowerCase() ? r.toLowerCase() : r;
        }
        L.textContent = o;
        if (p < 1) raf = requestAnimationFrame(tick); else fin();
      };
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener('pointerenter', run);
    el.addEventListener('focus', run);
  });
}

const EV = (window.EV = window.EV || {});
EV.scramble = initScramble;
initScramble();
addEventListener('load', () => initScramble());
