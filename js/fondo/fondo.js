/* ==========================================================================
   fondo/fondo.js — el fondo global (rayos + la onda de cromo + grano) en las
   páginas que no son la home (servicios.html, planes.html). Mismos módulos
   que la home (js/fondo/rayos.js, js/fondo/onda.js, css/fondo.css) y la
   misma lógica de home.js, sin lo que es solo de la home:
     · Un único bucle: gsap.ticker → Lenis → estado por scroll → rayos → onda.
     · Hasta el primer gesto, el póster (fotograma del propio render); con el
       gesto carga Three.js y la onda en vivo se funde por encima.
     · Opacidad de las bandas: <body data-fondo-op="0.5"> en la cabecera de la
       página → 0.3 al bajar; 0 (y sin render) cuando una sección gris
       ([data-cubre]) tapa la pantalla. Cabecera clara sobre esas secciones.
     · Menú móvil, anclas con scroll suave (EV.home.ir) y el hash inicial.
   Versión fija (EV.mode === 'still'): sin Lenis ni Three; el póster quieto.
   ========================================================================== */
(function () {
  var EV = window.EV, U = EV.util;
  var cine = EV.mode === 'cine', root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var el = { rayos: $('.fondo__rayos'), onda: $('.fondo__onda'), fija: $('.fondo__fija'), cab: $('.cabecera') };
  var OP0 = parseFloat(document.body.dataset.fondoOp || '0.5');
  var lenis = null, vw = 0, vh = 0, grises = [], cabMid = 0, mouse = { x: 0, y: 0 };
  var ondaIntro = 0, ondaOpacity = -1, fijaOpacity = -1, posterFuera = false, sinOnda = false, tRayos = 6, cabClara = null;

  function scrollY() { return lenis ? lenis.scroll : window.scrollY; }
  function measure() {
    vw = innerWidth; vh = innerHeight;
    var y = scrollY();
    grises = $$('[data-cubre]').map(function (n) { var r = n.getBoundingClientRect(); return { top: r.top + y, bottom: r.bottom + y }; });
    var c = el.cab.getBoundingClientRect(); cabMid = (c.top + c.bottom) / 2;
    if (EV.rayos) EV.rayos.resize();
  }
  function estado(y) {
    var hero = U.clamp01(y / vh), cubierta = false, clara = false;
    for (var i = 0; i < grises.length; i++) {
      var g = grises[i], t = g.top - y, b = g.bottom - y;
      if (t <= 0 && b >= vh) cubierta = true;
      if (t < cabMid && b > cabMid) clara = true;
    }
    if (clara !== cabClara) { cabClara = clara; el.cab.classList.toggle('is-clara', clara); }
    var s = y > 40; if (el.cab._s !== s) { el.cab._s = s; el.cab.classList.toggle('is-scroll', s); }
    return { hero: hero, cubierta: cubierta, op: cubierta ? 0 : U.lerp(OP0, 0.3, U.smooth(0.3, 1.05, hero)) };
  }
  function setOpacity(node, v, last) { v = Math.round(v * 1000) / 1000; if (v !== last) node.style.opacity = v; return v; }

  function tick(time, dtMs) {
    var dt = Math.min((dtMs || 16.7) / 1000, 0.1);
    var st = estado(scrollY());
    var vivo = EV.onda.ok && !sinOnda;
    if (vivo && ondaIntro < 1) ondaIntro = Math.min(1, ondaIntro + dt / 1.4);
    var intro = U.cubicOut(ondaIntro);
    if (!posterFuera && !sinOnda) {
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

  function ir(id) {
    var t = document.getElementById(id); if (!t) return;
    if (lenis) lenis.scrollTo(t, { offset: 0, duration: Math.min(2.2, 0.8 + Math.abs(t.getBoundingClientRect().top) / 4000) });
    else t.scrollIntoView({ behavior: EV.reducedMotion ? 'auto' : 'smooth' });
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    setTimeout(function () { t.focus({ preventScroll: true }); }, lenis ? 900 : 50);
  }
  function cabecera() {
    var btn = $('.cabecera__abrir');
    function abrir(on) { el.cab.classList.toggle('is-abierta', on); btn.setAttribute('aria-expanded', String(on)); }
    if (btn) btn.addEventListener('click', function () { abrir(btn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.cab.classList.contains('is-abierta')) { abrir(false); btn.focus(); } });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault(); abrir(false); ir(id);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
    $$('.cabecera__nav a').forEach(function (a) { a.addEventListener('click', function () { abrir(false); }); });
  }

  function fijo() {
    root.classList.add('fondo-fijo');
    var upd = function () { fijaOpacity = setOpacity(el.fija, estado(window.scrollY).op, fijaOpacity); };
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', function () { measure(); upd(); });
    upd();
  }
  function cargarOnda() {
    EV.onda.load(el.onda).catch(function (e) {
      console.warn('[onda] sin Three.js/WebGL, imagen fija', e);
      root.classList.add('fondo-fijo'); sinOnda = true; fijaOpacity = -1;
    });
  }

  function boot() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    EV.rayos.init(el.rayos);
    if (cine && typeof Lenis !== 'undefined' && window.gsap) {
      lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, autoRaf: false });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); }, false, true);
      gsap.ticker.lagSmoothing(0);
    }
    cabecera();
    measure();
    addEventListener('resize', measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if (cine && window.gsap) {
      addEventListener('pointermove', function (e) {
        mouse.x = e.clientX / vw - 0.5; mouse.y = e.clientY / vh - 0.5;
        if (EV.onda.pointer) EV.onda.pointer(e.clientX, e.clientY, true);
      }, { passive: true });
      addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t && EV.onda.pointer) EV.onda.pointer(t.clientX, t.clientY, true); }, { passive: true });
      var fuera = function () { if (EV.onda.pointer) EV.onda.pointer(0, 0, false); };
      root.addEventListener('pointerleave', fuera);
      addEventListener('touchend', fuera, { passive: true });
      addEventListener('blur', fuera);
      gsap.ticker.add(tick);
      EV.rayos.render(tRayos, 0);
      var gestos = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'];
      var go = function () { gestos.forEach(function (n) { removeEventListener(n, go, { passive: true }); }); cargarOnda(); };
      gestos.forEach(function (n) { addEventListener(n, go, { passive: true }); });
    } else fijo();
    var h = location.hash.slice(1);
    if (h && document.getElementById(h)) setTimeout(function () { ir(h); }, 80);
    // La misma API que la home para los módulos que la usan (formularios, secciones).
    EV.home = { scrollY: scrollY, get lenis() { return lenis; }, cine: cine, ir: ir };
    root.classList.add('is-ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
