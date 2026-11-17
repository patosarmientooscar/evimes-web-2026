/* ==========================================================================
   clientes.js — "Con quién trabajamos" (última sección del panel gris).
   Portado tal cual del prototipo aprobado (Downloads/evimes-cards/con-quien.html):
   interruptor pequeño de cromo (role="radiogroup", flechas del teclado),
   titular cuyas líneas salen y entran con máscara, subrayado cian que se
   dibuja solo, columna lateral y tres puntos. Primera entrada al verse
   (umbral .3); al cambiar, el panel que sale se va hacia arriba y el nuevo
   entra (600 ms).
   Cambios de estructura: los paneles se pintan desde js/data/clientes.js
   (BORRADOR) y el CTA marca "Soy…" en el formulario de contacto (data-perfil).
   ========================================================================== */
(function () {
  var root = document.querySelector('[data-cq]');
  var DATA = window.EVIMES_CLIENTES || [];
  if (!root || DATA.length < 2) return;
  var sw = root.querySelector('[data-cq-switch]'), stage = root.querySelector('[data-cq-stage]');

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // "tu [sí]." → tu <span class="mark">sí</span>.
  function marca(s) { return esc(s).replace(/\[([^\]]+)\]/g, '<span class="mark">$1</span>'); }

  sw.innerHTML = '<span class="thumb" aria-hidden="true"></span>' + DATA.slice(0, 2).map(function (d, i) {
    return '<button type="button" role="radio" aria-checked="' + (i === 0) + '" data-i="' + i + '"' + (i ? ' tabindex="-1"' : '') + '>' + esc(d.pestana) + '</button>';
  }).join('');
  stage.innerHTML = DATA.slice(0, 2).map(function (d, i) {
    return '<div class="cq-p" data-p="' + i + '"' + (i ? ' hidden' : '') + '>' +
      '<h2 class="display">' + d.lineas.map(function (l) {
        var o = typeof l === 'string' ? { texto: l } : l;
        return '<span class="l"><span' + (o.suave ? ' class="soft"' : '') + '>' + marca(o.texto) + '</span></span>';
      }).join('\n') + '</h2>' +
      '<div class="side"><p>' + esc(d.texto) + '</p>' +
        '<a class="cta" href="' + esc(d.href || '#contacto') + '" data-perfil="' + esc(d.perfil) + '" data-scramble><span class="sl">' + esc(d.cta) + '</span> <i aria-hidden="true">→</i></a></div>' +
      '<div class="points">' + d.puntos.map(function (p, k) {
        return '<div class="pt"><b>' + String(k + 1).padStart(2, '0') + '</b><h3>' + esc(p.titulo) + '</h3><p>' + esc(p.texto) + '</p></div>';
      }).join('') + '</div>' +
    '</div>';
  }).join('');
  root.classList.add('js');

  var btns = [].slice.call(sw.querySelectorAll('button')), panels = [].slice.call(stage.querySelectorAll('.cq-p'));
  var cur = 0, busy = false;
  // first reveal when the section scrolls into view
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { panels[0].classList.add('on'); o.disconnect(); } }, { threshold: .3 }).observe(stage);
  } else panels[0].classList.add('on');
  function go(i) {
    if (i === cur || busy) return; busy = true;
    btns.forEach(function (b, k) { b.setAttribute('aria-checked', String(k === i)); b.tabIndex = k === i ? 0 : -1; }); sw.dataset.v = i;
    var a = panels[cur], b = panels[i];
    a.classList.add('out'); a.classList.remove('on');
    b.hidden = false; b.classList.remove('on', 'out');
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('on'); }); });
    setTimeout(function () { a.hidden = true; a.classList.remove('out'); busy = false; }, 600);
    cur = i;
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.i); }); });
  sw.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = cur ? 0 : 1; go(n); btns[n].focus(); } });
})();
