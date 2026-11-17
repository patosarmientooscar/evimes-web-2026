/* ==========================================================================
   brand.js — logos vectoriales desde js/config.js (EVIMES_CONFIG.logo).
   Cada elemento con data-logo="<clave>" recibe el SVG de logo[<clave>],
   incrustado en línea para que herede currentColor. Cambiar un logo =
   cambiar una ruta en config.js.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});
  var cfg = (window.EVIMES_CONFIG && window.EVIMES_CONFIG.logo) || {};
  var cache = {};

  function load(url) {
    if (!cache[url]) {
      cache[url] = fetch(url)
        .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
        .then(function (txt) {
          var svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
          if (!svg || svg.nodeName.toLowerCase() !== 'svg') throw new Error('no es SVG: ' + url);
          // Higiene: nada ejecutable ni metadatos pesados dentro del DOM.
          svg.querySelectorAll('script, foreignObject, metadata').forEach(function (n) { n.remove(); });
          svg.removeAttribute('width');
          svg.removeAttribute('height');
          svg.removeAttribute('role');
          svg.removeAttribute('aria-label');
          svg.setAttribute('aria-hidden', 'true');
          svg.setAttribute('focusable', 'false');
          return svg;
        });
    }
    return cache[url];
  }

  function mount(el) {
    var url = cfg[el.dataset.logo];
    if (!url) return Promise.resolve(null);
    return load(url).then(function (svg) {
      var node = document.importNode(svg, true);
      node.classList.add('logo-svg');
      el.textContent = '';
      el.appendChild(node);
      el.classList.add('has-logo');
      return node;
    }).catch(function (e) { console.warn('[logo]', e); return null; });
  }

  EV.logo = { mount: mount, load: load };

  var ready = Promise.all(Array.prototype.map.call(document.querySelectorAll('[data-logo]'), mount));
  EV.logo.ready = ready;
})();
