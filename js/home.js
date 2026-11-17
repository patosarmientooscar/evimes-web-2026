/* ==========================================================================
   home.js — la home (fase onda). Un único bucle: gsap.ticker.
     1. Lenis.raf                 (prioritario)
     2. tick(): scroll → hero, frase, opacidad del fondo, cabecera clara
     3. EV.rayos.render           (2D, media resolución)
     4. EV.onda.render            (Three.js; se salta si nadie lo ve)
   Versión fija (EV.mode === 'still'): sin Lenis ni Three; imagen fija de las
   bandas, rayos pintados una vez, frase encendida, cards visibles.
   ========================================================================== */
(function () {
  var EV = window.EV;
  var U = EV.util;
  var cfg = window.EVIMES_CONFIG || {};
  var cine = EV.mode === 'cine';
  var root = document.documentElement;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var el = {
    fondo: $('.fondo'), rayos: $('.fondo__rayos'), onda: $('.fondo__onda'), fija: $('.fondo__fija'),
    cab: $('.cabecera'), panel: $('.panel'), frase: $('.frase'), portada: $('.portada')
  };
  var lenis = null;
  var vw = 0, vh = 0;
  var lay = {};                           // posiciones cacheadas (se recalculan al cambiar el tamaño)
  var palabras = [];
  var mouse = { x: 0, y: 0 };
  var ondaIntro = 0, ondaOpacity = -1, fijaOpacity = -1, posterFuera = false;
  // Reloj de los rayos: parado en t = 6 s (el fotograma del póster) hasta que
  // la onda en vivo entra; así el fundido póster → vivo cae en el mismo sitio.
  var tRayos = 6;
  var cabClara = null;
  var sinOnda = false;                    // Three.js no cargó: imagen fija en su lugar

  /* ---------- textos desde js/content.js ---------- */
  function bindContent() {
    $$('[data-c]').forEach(function (n) {
      var v = U.content(n.dataset.c);
      if (typeof v === 'string' && n.textContent !== v) n.textContent = v;
    });
  }

  function scrollY() { return lenis ? lenis.scroll : window.scrollY; }

  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    var y = scrollY();
    var r = el.panel.getBoundingClientRect();
    lay.panelTop = r.top + y; lay.panelBottom = r.bottom + y;
    var f = el.frase.getBoundingClientRect();
    lay.fraseTop = f.top + y; lay.fraseH = f.height;
    var c = el.cab.getBoundingClientRect();
    lay.cabTop = c.top; lay.cabBottom = c.bottom;
    EV.rayos.resize();
  }

  /* ---------- Lenis en gsap.ticker ---------- */
  function scrollInit() {
    if (!cine || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      autoRaf: false
    });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); }, false, true);
    gsap.ticker.lagSmoothing(0);
  }

  function ir(id) {
    var t = document.getElementById(id);
    if (!t) return;
    if (lenis) lenis.scrollTo(id === 'inicio' ? 0 : t, { duration: Math.min(2.2, 0.8 + Math.abs(t.getBoundingClientRect().top) / 4000) });
    else t.scrollIntoView({ behavior: EV.reducedMotion ? 'auto' : 'smooth' });
    if (id !== 'inicio') {
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      setTimeout(function () { t.focus({ preventScroll: true }); }, lenis ? 900 : 50);
    }
  }

  /* ---------- cabecera: menú móvil + anclas ---------- */
  function cabecera() {
    var btn = $('.cabecera__abrir');
    function abrir(on) { el.cab.classList.toggle('is-abierta', on); btn.setAttribute('aria-expanded', String(on)); }
    btn.addEventListener('click', function () { abrir(btn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.cab.classList.contains('is-abierta')) { abrir(false); btn.focus(); }
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      abrir(false);
      if (a.dataset.plan) elegirPlan(a.dataset.plan);
      ir(id);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
  }

  /* ---------- herramientas: segunda copia para el bucle infinito ---------- */
  function herramientas() {
    var lista = $('[data-herramientas]');
    // Solo se queda quieta con movimiento reducido (o ?modo=fijo), no por conexión lenta.
    if (EV.reducedMotion || /[?&]modo=fijo/.test(location.search)) return;
    var copia = lista.cloneNode(true);
    copia.setAttribute('aria-hidden', 'true');
    copia.removeAttribute('data-herramientas');
    lista.parentNode.appendChild(copia);
    root.classList.add('cinta-viva');
  }

  /* ---------- frase: palabras ---------- */
  function frase() {
    var h = $('[data-frase]');
    $$('span', h).forEach(function (sp) {
      var frag = document.createDocumentFragment();
      sp.textContent.split(/(\s+)/).forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        var w = document.createElement('span');
        w.className = 'frase__p';
        w.textContent = t;
        frag.appendChild(w);
      });
      sp.textContent = '';
      sp.appendChild(frag);
    });
    palabras = $$('.frase__p', h);
    if (!cine) palabras.forEach(function (w) { w.classList.add('is-on'); });
  }

  /* ---------- planes (js/data/planes.js) ---------- */
  function planes() {
    var ol = $('[data-planes]');
    var txt = U.content('inicio.planes') || {};
    (window.EVIMES_PLANES || []).forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = 'plan' + (p.recomendado ? ' plan--rec' : '');
      li.style.setProperty('--i', i);
      var m = /^desde\s+(.*)$/i.exec(p.precio);
      var precio = m
        ? '<span class="plan__desde">' + (txt.desde || 'desde') + '</span>' + m[1].replace(' €', '&nbsp;€')
        : p.precio.replace(' €', '&nbsp;€');
      li.innerHTML =
        (p.recomendado ? '<p class="plan__marca">' + (txt.recomendado || 'Recomendado') + '</p>' : '') +
        '<h3 class="display plan__nombre"></h3>' +
        '<p class="plan__para"></p>' +
        '<p class="display plan__precio">' + precio + '</p>' +
        '<ul class="plan__incluye"></ul>' +
        '<a class="pastilla plan__boton' + (p.recomendado ? '' : ' pastilla--linea') + '" href="#contacto"></a>';
      $('.plan__nombre', li).textContent = p.nombre;
      $('.plan__para', li).textContent = p.para;
      var ul = $('.plan__incluye', li);
      p.incluye.forEach(function (x) { var it = document.createElement('li'); it.textContent = x; ul.appendChild(it); });
      var b = $('.plan__boton', li);
      b.innerHTML = '<span class="sl"></span>';
      b.firstChild.textContent = p.boton;
      b.setAttribute('data-scramble', '');
      b.dataset.plan = p.id;
      b.setAttribute('aria-label', p.boton + ': plan ' + p.nombre);
      // Brillo cian que sigue al ratón por el borde.
      li.addEventListener('pointermove', function (e) {
        var r = li.getBoundingClientRect();
        li.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        li.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      ol.appendChild(li);
    });
    // Entrada escalonada (una vez).
    var items = $$('.plan', ol);
    if (!cine || !('IntersectionObserver' in window)) { items.forEach(function (n) { n.classList.add('is-dentro'); }); return; }
    root.classList.add('planes-vivos');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        items.forEach(function (n) { n.classList.add('is-dentro'); });
        io.disconnect();
      });
    }, { threshold: 0.18 });
    io.observe(ol);
  }

  /* ---------- contacto ----------
     El formulario es js/contacto/form.js. Aquí solo: el plan elegido en una
     card de plan se preselecciona en el formulario, y los enlaces directos
     (WhatsApp, email, teléfono) salen de js/config.js; vacíos, no se muestran. */
  function elegirPlan(id) { if (EV.form && EV.form.plan) EV.form.plan(id); }
  function contacto() {
    var hay = false, cont = $('[data-directo]');
    var wa = $('[data-whatsapp]'), em = $('[data-email]'), tel = $('[data-telefono]');
    if (wa && cfg.whatsapp) { wa.href = 'https://wa.me/' + cfg.whatsapp; wa.hidden = false; hay = true; }
    if (em && cfg.email) { em.href = 'mailto:' + cfg.email; em.textContent = cfg.email; em.hidden = false; hay = true; }
    if (tel && cfg.telefono) { tel.href = cfg.telefonoHref || ('tel:' + cfg.telefono.replace(/\s/g, '')); tel.textContent = cfg.telefono; tel.hidden = false; hay = true; }
    if (cont) cont.hidden = !hay;
  }

  /* ---------- estado por scroll (sin lecturas de layout por fotograma) ---------- */
  function estado(y) {
    var hero = U.clamp01(y / vh);
    // Opacidad de las bandas: 1 en el hero → 0.3 fuera; 0 si el panel gris cubre la pantalla.
    var cubierta = (lay.panelTop - y) <= 0 && (lay.panelBottom - y) >= vh;
    var op = cubierta ? 0 : U.lerp(1, 0.3, U.smooth(0.3, 1.05, hero));

    // Frase: las palabras se encienden una a una mientras está fija.
    if (palabras.length && cine) {
      // De "la frase asoma" a "justo antes de que suba el panel".
      var a = lay.fraseTop - vh * 0.4, b = lay.panelTop - vh * 1.05;
      var p = U.clamp01((y - a) / Math.max(1, b - a));
      var n = Math.floor(p * (palabras.length + 0.999));
      for (var i = 0; i < palabras.length; i++) {
        var on = i < n;
        if (palabras[i]._on !== on) { palabras[i]._on = on; palabras[i].classList.toggle('is-on', on); }
      }
    }

    // Cabecera clara cuando el panel gris pasa por su línea central.
    var pt = lay.panelTop - y, pb = lay.panelBottom - y, mid = (lay.cabTop + lay.cabBottom) / 2;
    // Sobre la oficina (js/oficina/), cristal oscuro: la oficina pone EV.cabeceraOscura.
    var clara = pt < mid && pb > mid && !EV.cabeceraOscura;
    if (clara !== cabClara) { cabClara = clara; el.cab.classList.toggle('is-clara', clara); }

    var scrolled = y > 40;
    if (el.cab._s !== scrolled) { el.cab._s = scrolled; el.cab.classList.toggle('is-scroll', scrolled); }

    return { hero: hero, op: op, cubierta: cubierta };
  }

  function setOpacity(node, v, last) {
    v = Math.round(v * 1000) / 1000;
    if (v !== last) node.style.opacity = v;
    return v;
  }

  /* ---------- bucle ----------
     Hasta el primer gesto se ve el póster (fotograma opaco de rayos + bandas
     sacado del propio render, assets/onda/). Con el gesto carga Three.js y la
     onda en vivo entra por debajo mientras el póster se funde. */
  function tick(time, dtMs) {
    var dt = Math.min((dtMs || 16.7) / 1000, 0.1);
    var st = estado(scrollY());
    var vivo = EV.onda.ok && !sinOnda;
    if (vivo && ondaIntro < 1) ondaIntro = Math.min(1, ondaIntro + dt / 1.4);
    var intro = U.cubicOut(ondaIntro);

    if (!posterFuera && !sinOnda) {
      // Alfa del póster para que las bandas valgan exactamente st.op en cada momento.
      var a = intro >= 1 ? 0 : st.op * (1 - intro) / Math.max(1e-3, 1 - st.op * intro);
      fijaOpacity = setOpacity(el.fija, a, fijaOpacity);
      if (intro >= 1) { posterFuera = true; root.classList.add('onda-viva'); }
    }

    if (vivo) {
      tRayos += dt;
      if (!st.cubierta) EV.rayos.render(tRayos, st.hero);
      var op = st.op * intro;
      ondaOpacity = setOpacity(el.onda, op, ondaOpacity);
      if (op > 0.001) EV.onda.render(dt, { mx: mouse.x, my: mouse.y, hero: st.hero, luz: true, cuerdas: !EV.reducedMotion });
    }
  }

  /* ---------- versión fija ---------- */
  function fijo() {
    root.classList.add('fondo-fijo');
    var upd = function () {
      var st = estado(window.scrollY);
      fijaOpacity = setOpacity(el.fija, st.op, fijaOpacity);
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', function () { measure(); upd(); });
    upd();
  }

  function cargarOnda() {
    EV.onda.load(el.onda).catch(function (e) {
      console.warn('[onda] sin Three.js/WebGL, imagen fija', e);
      root.classList.add('fondo-fijo');
      sinOnda = true;
      fijaOpacity = -1;
      var upd = function () { fijaOpacity = setOpacity(el.fija, estado(scrollY()).op, fijaOpacity); };
      if (lenis) lenis.on('scroll', upd); else window.addEventListener('scroll', upd, { passive: true });
      upd();
    });
  }

  /* ---------- arranque ---------- */
  function boot() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    bindContent();
    EV.rayos.init(el.rayos);
    scrollInit();
    cabecera();
    herramientas();
    frase();
    planes();
    contacto();
    measure();

    var re = function () { measure(); };
    window.addEventListener('resize', re);
    if (window.ResizeObserver) new ResizeObserver(re).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);

    var captura = /[?&]onda=captura/.test(location.search);
    if (cine && !captura) {
      window.addEventListener('pointermove', function (e) {
        mouse.x = e.clientX / vw - 0.5; mouse.y = e.clientY / vh - 0.5;
        if (EV.onda.pointer) EV.onda.pointer(e.clientX, e.clientY, true);
      }, { passive: true });
      // Cuerdas con el dedo: el scroll táctil cancela los pointer events, touchmove no.
      window.addEventListener('touchmove', function (e) {
        var t = e.touches[0]; if (t && EV.onda.pointer) EV.onda.pointer(t.clientX, t.clientY, true);
      }, { passive: true });
      var fuera = function () { if (EV.onda.pointer) EV.onda.pointer(0, 0, false); };
      document.documentElement.addEventListener('pointerleave', fuera);
      window.addEventListener('touchend', fuera, { passive: true });
      window.addEventListener('touchcancel', fuera, { passive: true });
      window.addEventListener('blur', fuera);
      gsap.ticker.add(tick);
      // Three.js al primer gesto (como la oficina): el hero no lo espera y quien
      // no interactúa no paga los ~600 KB ni la compilación de shaders.
      EV.rayos.render(tRayos, 0);
      var gestos = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'];
      var go = function () {
        gestos.forEach(function (n) { window.removeEventListener(n, go, { passive: true }); });
        cargarOnda();
      };
      gestos.forEach(function (n) { window.addEventListener(n, go, { passive: true }); });
    } else if (!captura) fijo();

    // ?onda=captura: fotograma fijo para assets/onda/ (ver assets/onda/LEEME.md).
    if (captura) {
      EV.onda.load(el.onda).then(function () { window.__ondaCaptura = EV.onda.capture; });
    }

    var h = location.hash.slice(1);
    if (h && document.getElementById(h)) setTimeout(function () { ir(h); }, 80);
    // API mínima para los módulos del panel gris (js/gris/*): mismo scroll, mismo bucle.
    EV.home = { scrollY: scrollY, get lenis() { return lenis; }, cine: cine, ir: ir, elegirPlan: elegirPlan };
    root.classList.add('is-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
