/* ==========================================================================
   paginas.js — proyectos.html y planes.html: los mismos datos que la home
   (js/data/), en una página plana.
   ========================================================================== */
(function () {
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  var lp = document.querySelector('[data-lista-proyectos]');
  if (lp && window.EVIMES_PROYECTOS) {
    EVIMES_PROYECTOS.lista.filter(function (p) { return !p.proximamente; }).concat(
      EVIMES_PROYECTOS.lista.filter(function (p) { return p.proximamente; })
    ).forEach(function (p) {
      var li = el('li', 'ficha' + (p.proximamente ? ' ficha--pronto' : ''));
      if (p.proximamente) {
        li.appendChild(el('div', 'ficha__vacia', 'Próximamente'));
        li.appendChild(el('p', 'ficha__meta', 'Proyecto en preparación'));
        lp.appendChild(li);
        return;
      }
      var fig = el('figure', 'ficha__captura');
      var img = el('img'); img.src = p.captura; img.alt = 'Portada de la web de ' + p.cliente; img.loading = 'lazy';
      fig.appendChild(img);
      li.appendChild(fig);
      li.appendChild(el('h2', 'ficha__cliente', p.cliente));
      li.appendChild(el('p', 'ficha__meta', p.sector + ' · ' + p.ciudad));
      li.appendChild(el('p', 'ficha__texto', p.necesidad));
      if (p.medicion) {
        var m = p.medicion;
        li.appendChild(el('p', 'ficha__medida', 'Lighthouse ' + m.fecha.split('-').reverse().join('/') + ' · escritorio ' + m.escritorio.rendimiento + ' (carga ' + String(m.escritorio.lcp).replace('.', ',') + ' s) · móvil ' + m.movil.rendimiento + ' (carga ' + String(m.movil.lcp).replace('.', ',') + ' s)'));
      }
      var a = el('a', 'ficha__ver', 'Ver web');
      a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
      li.appendChild(a);
      lp.appendChild(li);
    });
  }

  var pl = document.querySelector('[data-lista-planes]');
  if (pl && window.EVIMES_PLANES) {
    EVIMES_PLANES.forEach(function (p) {
      var li = el('li', 'ficha ficha--plan');
      if (p.recomendado) li.appendChild(el('p', 'ficha__sello', 'Recomendado'));
      li.appendChild(el('h2', 'ficha__cliente', p.nombre));
      li.appendChild(el('p', 'ficha__precio', p.precio));
      li.appendChild(el('p', 'ficha__meta', p.para));
      var ul = el('ul');
      p.incluye.forEach(function (x) { ul.appendChild(el('li', null, x)); });
      li.appendChild(ul);
      var a = el('a', 'ficha__ver', p.boton);
      a.href = './#contacto';
      li.appendChild(a);
      pl.appendChild(li);
    });
  }
})();
