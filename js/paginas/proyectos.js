/* ==========================================================================
   paginas/proyectos.js — proyectos.html.
   · Los 4 indicadores de PageSpeed de Disco (el mismo diseño que en la
     oficina), desde js/data/pagespeed.js. El HTML trae las cifras finales
     (SEO y sin JS); con movimiento, el anillo y el número cuentan desde 0
     al entrar en pantalla (gsap, el bucle único).
   · La card de cristal: la web de Disco hace scroll sola (CSS, transform).
   También es la plantilla que usó el generador del HTML (module.exports).
   ========================================================================== */
(function (raiz) {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MEDIDAS = [['rendimiento', 'Rendimiento'], ['accesibilidad', 'Accesibilidad'], ['buenasPracticas', 'Prácticas recomendadas'], ['seo', 'SEO']];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var CIRC = 263.9;
  var R = {};
  R.fecha = function (iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? (+m[3]) + ' de ' + MESES[+m[2] - 1] + ' de ' + m[1] : esc(iso); };
  R.etiqueta = function (D) {
    return 'PageSpeed Insights de ' + D.url.replace(/^https?:\/\//, '') + ': ' + MEDIDAS.map(function (m) { return m[1].toLowerCase() + ' ' + D[m[0]]; }).join(', ') + '; Agentic Browsing ' + D.agentic + '.';
  };
  R.psi = function (D) {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="psiG-caso" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5ff"/><stop offset=".6" stop-color="#8ff4ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs></svg>' +
      '<ul class="psi-caso__lista">' + MEDIDAS.map(function (m) {
        var v = D[m[0]];
        return '<li class="psi-g" data-v="' + v + '"><svg class="psi-g__anillo" viewBox="0 0 100 100" aria-hidden="true"><circle class="psi-g__base" cx="50" cy="50" r="42"/><circle class="psi-g__arco" cx="50" cy="50" r="42" stroke="url(#psiG-caso)" style="stroke-dashoffset:' + (CIRC * (1 - v / 100)).toFixed(1) + '"/></svg>' +
          '<b>' + v + '</b><span>' + esc(m[1]) + '</span></li>';
      }).join('') + '</ul>' +
      '<p class="psi-caso__pill"><i aria-hidden="true"></i>Agentic Browsing <b>' + esc(D.agentic) + '</b></p>' +
      '<p class="psi-caso__nota">Medido con PageSpeed Insights · ' + esc(D.url.replace(/^https?:\/\//, '')) + ' · ' + R.fecha(D.fecha) + '</p>';
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = R; return; }

  var d = raiz.document, D = raiz.EVIMES_PAGESPEED, EV = raiz.EV || {};
  var caja = d.querySelector('[data-psi-caso]');
  if (!caja) return;
  if (!D) { caja.remove(); return; }
  caja.setAttribute('aria-label', R.etiqueta(D));
  caja.innerHTML = R.psi(D);
  var vivo = EV.mode === 'cine' && !EV.reducedMotion && raiz.gsap && 'IntersectionObserver' in raiz;
  if (!vivo) return;
  var gs = Array.prototype.slice.call(caja.querySelectorAll('.psi-g')).map(function (li) { return { v: +li.dataset.v, b: li.querySelector('b'), a: li.querySelector('.psi-g__arco') }; });
  var pon = function (g, k) { g.b.textContent = Math.round(g.v * k); g.a.style.strokeDashoffset = (CIRC * (1 - g.v / 100 * k)).toFixed(1); };
  gs.forEach(function (g) { pon(g, 0); });
  caja.classList.add('is-espera');
  var io = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return;
    io.disconnect(); caja.classList.remove('is-espera');
    gs.forEach(function (g, i) { var o = { k: 0 }; gsap.to(o, { k: 1, duration: 1.6, delay: .15 + i * .12, ease: 'power3.out', onUpdate: function () { pon(g, o.k); } }); });
  }, { threshold: .4 });
  io.observe(caja);
})(typeof window !== 'undefined' ? window : this);
