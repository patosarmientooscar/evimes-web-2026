/* ==========================================================================
   paginas/paginas.js — lo común de servicios, proyectos, planes y contacto.
   · Textos: [data-sp] ← EVIMES_SERVICIOS_PAGINA · [data-pl] ← EVIMES_PLANES_PAGINA
     · [data-pr] ← EVIMES_PROYECTOS_PAGINA · [data-ct] ← EVIMES_CONTACTO_PAGINA
     (rutas con puntos; *-parrafos / *-lista repintan bloques enteros).
   · Contacto directo ([data-directo]): WhatsApp, email y teléfono salen de
     js/config.js; vacíos, no se muestran.
   · Entrada con scroll (IntersectionObserver, solo transform/opacity):
     [data-lineas] sube línea a línea con máscara (se parte en líneas reales
     según el ancho), las listas aparecen escalonadas y las secciones grises
     ([data-cubre]) suben a su sitio.
   · "Cómo trabajamos": la línea cian se dibuja con el scroll (scaleX; en
     móvil, scaleY), dentro de gsap.ticker (el bucle único) con posiciones
     cacheadas.
   · Acordeones ([data-acordeon]): botón con aria-expanded + panel.
   Versión fija (movimiento reducido…): todo visible y quieto.
   ========================================================================== */
(function () {
  var EV = window.EV || {};
  var vivo = EV.mode === 'cine' && !EV.reducedMotion;
  var root = document.documentElement;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ruta(o, r) { return r.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }

  /* ---------- textos desde los datos ---------- */
  function textos(attr, D) {
    if (!D) return;
    $$('[' + attr + ']').forEach(function (n) { var v = ruta(D, n.getAttribute(attr)); if (typeof v === 'string' && n.textContent !== v) n.textContent = v; });
    $$('[' + attr + '-parrafos]').forEach(function (n) { var v = ruta(D, n.getAttribute(attr + '-parrafos')); if (Array.isArray(v)) n.innerHTML = v.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); });
    $$('[' + attr + '-lista]').forEach(function (n) { var v = ruta(D, n.getAttribute(attr + '-lista')); if (Array.isArray(v)) n.innerHTML = v.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join(''); });
  }
  textos('data-sp', window.EVIMES_SERVICIOS_PAGINA);
  textos('data-pl', window.EVIMES_PLANES_PAGINA);
  textos('data-pr', window.EVIMES_PROYECTOS_PAGINA);
  textos('data-ct', window.EVIMES_CONTACTO_PAGINA);

  /* ---------- contacto directo (desde config.js) ---------- */
  var cfg = window.EVIMES_CONFIG || {};
  $$('[data-directo]').forEach(function (cont) {
    var hay = false, wa = cont.querySelector('[data-whatsapp]'), em = cont.querySelector('[data-email]'), tel = cont.querySelector('[data-telefono]');
    if (wa && cfg.whatsapp) { wa.href = 'https://wa.me/' + cfg.whatsapp; wa.hidden = false; hay = true; }
    if (em && cfg.email) { em.href = 'mailto:' + cfg.email; (em.querySelector('[data-valor]') || em).textContent = cfg.email; em.hidden = false; hay = true; }
    if (tel && cfg.telefono) { tel.href = cfg.telefonoHref || ('tel:' + cfg.telefono.replace(/\s/g, '')); tel.textContent = cfg.telefono; tel.hidden = false; hay = true; }
    cont.hidden = !hay;
  });

  /* ---------- acordeones ---------- */
  $$('[data-acordeon]').forEach(function (b) {
    var p = document.getElementById(b.getAttribute('aria-controls')); if (!p) return;
    b.addEventListener('click', function () { var on = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(on)); p.hidden = !on; });
  });

  if (!vivo) { root.classList.add('pag-quieta'); return; }
  root.classList.add('pag-viva');

  /* ---------- líneas reales (según el ancho) para la máscara ---------- */
  function partir(el) {
    var txt = el.dataset.texto || el.textContent.trim(); el.dataset.texto = txt;
    el.innerHTML = txt.split(/\s+/).map(function (w) { return '<span class="w">' + esc(w) + '</span>'; }).join(' ');
    var lineas = [], top = null;
    $$('.w', el).forEach(function (w) { if (w.offsetTop !== top) { lineas.push([]); top = w.offsetTop; } lineas[lineas.length - 1].push(w.textContent); });
    el.innerHTML = lineas.map(function (l, i) { return '<span class="l"><span style="transition-delay:' + (i * 0.08).toFixed(2) + 's">' + esc(l.join(' ')) + '</span></span>'; }).join(' ');
  }
  var conLineas = $$('[data-lineas]');
  function partirTodo() { conLineas.forEach(partir); }
  partirTodo();
  var ancho = innerWidth, tRe = 0;
  addEventListener('resize', function () { if (innerWidth === ancho) return; ancho = innerWidth; clearTimeout(tRe); tRe = setTimeout(partirTodo, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(partirTodo);

  /* ---------- entradas ---------- */
  $$('.sp-serv__incluye, .pasos__lista, [data-escalona]').forEach(function (l) { $$(':scope > *', l).forEach(function (li, i) { li.style.transitionDelay = (0.15 + i * 0.06).toFixed(2) + 's'; }); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-lineas], .sp-serv__incluye, .pasos__lista, [data-escalona], [data-cubre], .rv').forEach(function (n) { io.observe(n); });

  /* ---------- Cómo trabajamos: la línea se dibuja con el scroll ---------- */
  var linea = document.querySelector('[data-pasos-linea]');
  if (linea && window.gsap) {
    var fila = linea.closest('.pasos__fila'), a = 0, b = 1, vert = false, last = -1;
    var medir = function () {
      var y = EV.home && EV.home.scrollY ? EV.home.scrollY() : scrollY, r = fila.getBoundingClientRect();
      vert = getComputedStyle(fila).getPropertyValue('--vertical').trim() === '1';
      a = r.top + y - innerHeight * 0.8; b = r.bottom + y - innerHeight * 0.45;
    };
    medir(); addEventListener('resize', medir); if (window.ResizeObserver) new ResizeObserver(medir).observe(document.body);
    gsap.ticker.add(function () {
      var y = EV.home && EV.home.scrollY ? EV.home.scrollY() : scrollY;
      var p = Math.min(1, Math.max(0, (y - a) / Math.max(1, b - a)));
      p = Math.round(p * 1000) / 1000;
      if (p !== last) { last = p; linea.style.transform = (vert ? 'scaleY(' : 'scaleX(') + p + ')'; }
    });
  }
})();
