/* ==========================================================================
   paginas/planes.js — planes.html: las 3 cards (las mismas de la home, en
   grande, con el brillo cian que sigue al ratón por el borde), la tabla
   comparativa (filas = todos los puntos de js/data/planes.js; en móvil,
   acordeón por plan). Las preguntas frecuentes las pinta js/paginas/faq.js.
   Todo se pinta desde los datos; el HTML trae lo mismo (SEO y sin JS).
   Los botones llevan a contacto.html?plan=… (el formulario lo preselecciona).
   ========================================================================== */
(function (raiz) {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var R = {};

  R.precio = function (p) {
    var m = /^desde\s+(.*)$/i.exec(p.precio);
    return m ? '<span class="plan__desde">desde</span>' + esc(m[1]).replace(' €', '&nbsp;€') : esc(p.precio).replace(' €', '&nbsp;€');
  };
  R.cards = function (P) {
    return P.map(function (p, i) {
      return '<li class="plan' + (p.recomendado ? ' plan--rec' : '') + '" style="--i:' + i + '">' +
        (p.recomendado ? '<p class="plan__marca">Recomendado</p>' : '') +
        '<h2 class="display plan__nombre">' + esc(p.nombre) + '</h2>' +
        '<p class="plan__para">' + esc(p.para) + '</p>' +
        '<p class="display plan__precio">' + R.precio(p) + '</p>' +
        '<ul class="plan__incluye">' + p.incluye.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<a class="pastilla plan__boton' + (p.recomendado ? '' : ' pastilla--linea') + '" href="contacto.html?plan=' + esc(p.id) + '" data-scramble><span class="sl">' + esc(p.boton) + '</span><span class="sr-only"> · plan ' + esc(p.nombre) + '</span></a>' +
        '</li>';
    }).join('');
  };
  // filas: todos los puntos de planes.js, en orden de aparición, sin repetir
  R.filas = function (P) { var f = []; P.forEach(function (p) { p.incluye.forEach(function (x) { if (f.indexOf(x) < 0) f.push(x); }); }); return f; };
  var SI = '<span class="si" role="img" aria-label="Incluido"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  var NO = '<span class="no" role="img" aria-label="No incluido">—</span>';
  R.tabla = function (P) {
    var f = R.filas(P);
    return '<table class="comp__tabla"><caption class="sr-only">Qué incluye cada plan</caption>' +
      '<thead><tr><th scope="col"><span class="sr-only">Punto</span></th>' + P.map(function (p) { return '<th scope="col"' + (p.recomendado ? ' class="is-rec"' : '') + '>' + esc(p.nombre) + '<span>' + R.precio(p) + '</span></th>'; }).join('') + '</tr></thead>' +
      '<tbody>' + f.map(function (x) { return '<tr><th scope="row">' + esc(x) + '</th>' + P.map(function (p) { return '<td' + (p.recomendado ? ' class="is-rec"' : '') + '>' + (p.incluye.indexOf(x) >= 0 ? SI : NO) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  };
  R.acordeon = function (P) {
    var f = R.filas(P);
    return P.map(function (p, i) {
      var id = 'comp-' + p.id;
      return '<div class="acord' + (p.recomendado ? ' is-rec' : '') + '"><h3><button type="button" class="acord__boton" aria-expanded="' + (i === 1) + '" aria-controls="' + id + '" data-acordeon>' +
        '<span class="display">' + esc(p.nombre) + '</span><span class="acord__precio">' + R.precio(p) + '</span><i aria-hidden="true"></i></button></h3>' +
        '<ul class="acord__panel" id="' + id + '"' + (i === 1 ? '' : ' hidden') + '>' + f.map(function (x) { var si = p.incluye.indexOf(x) >= 0; return '<li class="' + (si ? 'is-si' : 'is-no') + '">' + (si ? SI : NO) + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div>';
    }).join('');
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = R; return; }

  /* ---------- en el navegador: repintar desde los datos ---------- */
  var d = raiz.document, P = raiz.EVIMES_PLANES || [];
  var put = function (sel, html) { var n = d.querySelector(sel); if (n && html) n.innerHTML = html; };
  if (P.length) { put('[data-planes-cards]', R.cards(P)); put('[data-planes-tabla]', R.tabla(P)); put('[data-planes-acordeon]', R.acordeon(P)); }
  // brillo cian que sigue al ratón por el borde (como en la home)
  Array.prototype.forEach.call(d.querySelectorAll('.plan'), function (li) {
    li.addEventListener('pointermove', function (e) { var r = li.getBoundingClientRect(); li.style.setProperty('--mx', (e.clientX - r.left) + 'px'); li.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
  // entrada escalonada (como en la home)
  var ol = d.querySelector('[data-planes-cards]'), EV = raiz.EV || {};
  if (ol) {
    var items = Array.prototype.slice.call(ol.querySelectorAll('.plan'));
    if (EV.mode !== 'cine' || !('IntersectionObserver' in raiz)) items.forEach(function (n) { n.classList.add('is-dentro'); });
    else {
      d.documentElement.classList.add('planes-vivos');
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { items.forEach(function (n) { n.classList.add('is-dentro'); }); io.disconnect(); } }, { threshold: 0.12 });
      io.observe(ol);
    }
  }
})(typeof window !== 'undefined' ? window : this);
