/* ==========================================================================
   oficina.js — la zona con cámara: hero → la oficina se abre → proyectos
   (cards que salen del monitor) → cifras en el techo → salida a navy.

   Progreso p (0–1) de la zona pinned (manifest: 7 pantallas):
     0.00–0.10  apertura: el hero sube como un telón; el fondo pasa de
                desenfocado a nítido y cruza al panorama en el MISMO encuadre
                (yaw 0, pitch +5); dolly fov hero → 55 (72 en vertical).
     0.10–0.17  la cámara baja a la MESA.
     0.17–0.37  las miniaturas del monitor salen y se convierten en cards.
     0.37–0.52  arco quieto: hover, clic, arrastre.
     0.52–0.62  la mirada sube al TECHO; las cards bajan fuera de cuadro.
     0.62–0.84  cuatro cifras, una tras otra; fila + "Diseñado para captar."
     0.84–1.00  la mirada baja; desenfoque y fundido a navy plano.

   Todo lo que va pegado al panorama se proyecta con LA MISMA cámara que lo
   dibuja (proyector propio, idéntico al de Three: lookAt sin alabeo).
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});
  var U, CONF, OF, D2R = Math.PI / 180;

  var P = {
    abre: [0, 0.10], aMesa: [0.10, 0.17], vuelo: [0.17, 0.37], aTecho: [0.52, 0.62],
    cifras: [0.62, 0.77], fila: [0.77, 0.84], salida: [0.84, 1]
  };

  var zone, stage, view = null, cine = false;
  var vw = 1, vh = 1;
  var cam = { yaw: 0, pitch: 5, fov: 55 };
  var started = false, swapped = false, swap = { v: 0 };
  var els = {};
  var cards = [], arc = null, interactive = false;
  var reduce = false;

  /* ---------- cámara ---------- */
  function variant() { return EV.stage.variant(); }
  function heroFov() {
    var h = OF.hero[variant()], A = vw / vh, t = Math.tan(h.fov * D2R / 2);
    if (A > h.aspecto) t *= h.aspecto / A;   // cover: el alto visible se recorta
    return 2 * Math.atan(t) / D2R;
  }
  function stop(name) {
    var s = OF.paradas[name], m = variant() === 'mobile' && s.m ? s.m : {};
    return { yaw: m.yaw != null ? m.yaw : s.yaw, pitch: m.pitch != null ? m.pitch : s.pitch, fov: m.fov || OF.fov[variant()] };
  }
  function lerpCam(a, b, t) {
    var ta = Math.log(Math.tan(a.fov * D2R / 2)), tb = Math.log(Math.tan(b.fov * D2R / 2));
    return { yaw: a.yaw + (b.yaw - a.yaw) * t, pitch: a.pitch + (b.pitch - a.pitch) * t, fov: 2 * Math.atan(Math.exp(ta + (tb - ta) * t)) / D2R };
  }
  function camAt(p) {
    var ini = stop('inicio'), mesa = stop('mesa'), techo = stop('techo'), sal = stop('salida');
    var c0 = { yaw: ini.yaw, pitch: ini.pitch, fov: heroFov() };
    if (p <= P.abre[1]) return lerpCam(c0, ini, U.p2io(U.range(p, P.abre[0], P.abre[1])));
    if (p <= P.aMesa[1]) return lerpCam(ini, mesa, U.p2io(U.range(p, P.aMesa[0], P.aMesa[1])));
    if (p <= P.aTecho[0]) return mesa;
    if (p <= P.aTecho[1]) return lerpCam(mesa, techo, U.p2io(U.range(p, P.aTecho[0], P.aTecho[1])));
    if (p <= P.salida[0]) return techo;
    return lerpCam(techo, sal, U.p2io(U.range(p, P.salida[0], P.salida[1])));
  }

  /* Proyector propio (igual que PerspectiveCamera.lookAt con up = Y). */
  var F = [0, 0, 0], R = [0, 0, 0], UP = [0, 0, 0], tanV = 1, aspect = 1;
  function setProjector(c) {
    var y = c.yaw * D2R, p = c.pitch * D2R;
    F[0] = -Math.cos(y) * Math.cos(p); F[1] = Math.sin(p); F[2] = -Math.sin(y) * Math.cos(p);
    // R = F × (0,1,0)
    R[0] = -F[2]; R[1] = 0; R[2] = F[0];
    var l = Math.hypot(R[0], R[2]) || 1; R[0] /= l; R[2] /= l;
    // UP = R × F
    UP[0] = R[1] * F[2] - R[2] * F[1]; UP[1] = R[2] * F[0] - R[0] * F[2]; UP[2] = R[0] * F[1] - R[1] * F[0];
    tanV = Math.tan(c.fov * D2R / 2);
    aspect = vw / vh;
  }
  function project(yaw, pitch) {
    var y = yaw * D2R, p = pitch * D2R;
    var dx = -Math.cos(y) * Math.cos(p), dy = Math.sin(p), dz = -Math.sin(y) * Math.cos(p);
    var z = dx * F[0] + dy * F[1] + dz * F[2];
    if (z <= 1e-3) return null;
    var xs = (dx * R[0] + dy * R[1] + dz * R[2]) / z, ys = (dx * UP[0] + dy * UP[1] + dz * UP[2]) / z;
    return [(1 + xs / (tanV * aspect)) / 2 * vw, (1 - ys / tanV) / 2 * vh];
  }
  function quad(c) {
    var out = [];
    for (var i = 0; i < 4; i++) { var q = project(c[i][0], c[i][1]); if (!q) return null; out.push(q); }
    return out;
  }
  function ppd() { return vh / (2 * Math.atan(tanV) / D2R); }   // px por grado (centro)
  function onScreen(pt, m) { m = m || 0; return pt && pt[0] > -m && pt[0] < vw + m && pt[1] > -m && pt[1] < vh + m; }

  /* ---------- capa cuadrilátero (matrix3d) ---------- */
  function quadLayer(el) {
    var w = U.writer(el), size = { w: 1, h: 1 };
    function measure() { size.w = el.offsetWidth || 1; size.h = el.offsetHeight || 1; }
    measure();
    return {
      el: el, measure: measure,
      set: function (pts, o) {
        if (!pts || o <= 0.001) { w('visibility', 'hidden'); return; }
        var m = EV.overlay.quadMatrix(size.w, size.h, pts);
        if (!m) { w('visibility', 'hidden'); return; }
        w('transform', m);
        w('opacity', o >= 0.999 ? '1' : o.toFixed(3));
        w('visibility', 'visible');
      }
    };
  }

  /* ==========================================================================
     Proyectos: cada miniatura del monitor ES su card (mismo elemento).
     ========================================================================== */
  var DATA;
  function cardHTML(p, i) {
    var li = document.createElement('li');
    li.className = 'pcard' + (p.proximamente ? ' pcard--pronto' : '');
    li.dataset.i = i;
    if (p.proximamente) {
      li.innerHTML =
        '<div class="pcard__halo"></div>' +
        '<div class="pcard__cuerpo">' +
          '<div class="pcard__captura pcard__captura--vacia"><span class="pcard__pronto"></span></div>' +
          '<div class="pcard__info"><h3 class="pcard__cliente"></h3><p class="pcard__meta">Proyecto en preparación</p></div>' +
          '<div class="pcard__velo"></div><div class="pcard__emision"></div>' +
        '</div>';
      li.querySelector('.pcard__pronto').textContent = U.content('proyectos.proximamente');
      li.querySelector('.pcard__cliente').textContent = U.content('proyectos.proximamente');
      return li;
    }
    li.innerHTML =
      '<div class="pcard__halo"></div>' +
      '<div class="pcard__cuerpo">' +
        '<div class="pcard__captura"><img alt="" decoding="async"></div>' +
        '<div class="pcard__info">' +
          '<h3 class="pcard__cliente"></h3>' +
          '<p class="pcard__meta"></p>' +
          '<ul class="pcard__pills"></ul>' +
        '</div>' +
        '<div class="pcard__calido"></div><div class="pcard__velo"></div><div class="pcard__emision"></div>' +
      '</div>' +
      '<button class="pcard__abrir" type="button"></button>';
    var img = li.querySelector('img');
    img.src = p.larga || p.captura;
    img.alt = 'Captura de la web de ' + p.cliente;
    li.querySelector('.pcard__cliente').textContent = p.cliente;
    li.querySelector('.pcard__meta').textContent = p.sector + ' · ' + p.ciudad;
    var pills = li.querySelector('.pcard__pills');
    if (p.pagespeed != null) addPill(pills, p.pagespeed + ' ' + U.content('proyectos.pills.pagespeed'));
    if (p.carga != null) addPill(pills, String(p.carga).replace('.', ',') + ' s ' + U.content('proyectos.pills.carga'));
    if (!pills.children.length) pills.remove();
    li.querySelector('.pcard__abrir').setAttribute('aria-label', 'Ver el proyecto ' + p.cliente);
    return li;
  }
  function addPill(ul, txt) { var l = document.createElement('li'); l.textContent = txt; ul.appendChild(l); }

  function buildCards() {
    DATA = window.EVIMES_PROYECTOS || { lista: [], central: 0 };
    var list = stage.querySelector('[data-proyectos]');
    DATA.lista.forEach(function (p, i) {
      var li = cardHTML(p, i);
      list.appendChild(li);
      var c = {
        i: i, p: p, el: li, w: U.writer(li),
        halo: U.writer(li.querySelector('.pcard__halo')),
        velo: U.writer(li.querySelector('.pcard__velo')),
        emision: U.writer(li.querySelector('.pcard__emision')),
        calido: li.querySelector('.pcard__calido') ? U.writer(li.querySelector('.pcard__calido')) : function () {},
        t: U.spring(170, 22), lift: U.spring(240, 26), hover: false, target: 0, order: 0
      };
      var btn = li.querySelector('.pcard__abrir');
      if (btn) {
        btn.addEventListener('click', function () { if (Math.abs(arc.off.x - arc.target) > 0.4) return; openDetail(c); });
        btn.addEventListener('focus', function () { if (interactive) arc.target = clampOff(c.i - DATA.central); });
      }
      li.addEventListener('pointerenter', function () { c.hover = true; li.classList.add('is-hover'); });
      li.addEventListener('pointerleave', function () { c.hover = false; li.classList.remove('is-hover'); });
      cards.push(c);
    });
    // Orden de salida: la central primero, luego hacia fuera (escalonado).
    var byDist = cards.slice().sort(function (a, b) { return Math.abs(a.i - DATA.central) - Math.abs(b.i - DATA.central) || a.i - b.i; });
    byDist.forEach(function (c, k) { c.order = k; });

    arc = { off: U.spring(120, 20), target: 0, drag: null };
    arc.off.set(0);

    // Arrastre horizontal: rota el arco (la siguiente card pasa al centro).
    list.addEventListener('pointerdown', function (e) {
      if (!interactive) return;
      arc.drag = { x: e.clientX, x0: e.clientX, off: arc.target, id: e.pointerId, moved: false };
    });
    window.addEventListener('pointermove', function (e) {
      var d = arc.drag;
      if (!d || e.pointerId !== d.id) return;
      var dx = e.clientX - d.x0;
      if (Math.abs(dx) > 6 && !d.moved) { d.moved = true; try { list.setPointerCapture(e.pointerId); } catch (er) {} }
      if (d.moved) { arc.target = d.off - dx / geom.step; arc.free = true; }
    });
    window.addEventListener('pointerup', function () {
      if (!arc.drag) return;
      var moved = arc.drag.moved;
      arc.drag = null;
      arc.free = false;
      if (moved) {
        arc.target = clampOff(Math.round(arc.target));
        // que el clic que sigue al arrastre no abra el detalle
        arc.blockClick = performance.now();
      }
    });
    list.addEventListener('click', function (e) { if (arc.blockClick && performance.now() - arc.blockClick < 250) { e.stopPropagation(); e.preventDefault(); } }, true);
    list.addEventListener('keydown', function (e) {
      if (!interactive) return;
      if (e.key === 'ArrowRight') { arc.target = clampOff(Math.round(arc.target) + 1); focusCenter(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { arc.target = clampOff(Math.round(arc.target) - 1); focusCenter(); e.preventDefault(); }
    });
  }
  function clampOff(v) { return U.clamp(v, -DATA.central, cards.length - 1 - DATA.central); }
  function focusCenter() {
    var c = cards[Math.round(arc.target) + DATA.central];
    var b = c && c.el.querySelector('.pcard__abrir');
    if (b) b.focus({ preventScroll: true });
  }

  /* Geometría de las cards y de las miniaturas. */
  var geom = {};
  function measureCards() {
    var mob = variant() === 'mobile';
    var W = mob ? Math.min(vw * 0.74, 320) : U.clamp(vw * 0.235, 250, 380);
    var H = Math.round(W * 0.96);
    W = Math.round(W);
    geom = { mob: mob, W: W, H: H, step: mob ? W + 14 : W * 0.8, F: Math.max(vw, vh) * 1.2 };
    cards.forEach(function (c) { c.el.style.width = W + 'px'; c.el.style.height = H + 'px'; });
    // Miniaturas en el monitor: fila de 5 en (u, v), con el aspecto de la card.
    var m = OF.monitor.esquinas;
    var wDeg = ((m[1][0] - m[0][0]) + (m[2][0] - m[3][0])) / 2 * Math.cos(-7 * D2R);
    var hDeg = ((m[0][1] - m[3][1]) + (m[1][1] - m[2][1])) / 2;
    var monA = wDeg / hDeg, n = cards.length;
    var gap = 0.22, wu = 0.86 / (n + gap * (n - 1));
    var hv = wu * (H / W) * monA;   // mismo aspecto que la card
    geom.slots = cards.map(function (c, i) {
      var u0 = 0.07 + i * wu * (1 + gap);
      return [u0, 0.5 - hv / 2, u0 + wu, 0.5 + hv / 2];
    });
  }

  /* Posición de reposo de la card i en el arco (esquinas en pantalla). */
  function slotCorners(d, off) {
    var g = geom, w2 = g.W / 2, h2 = g.H / 2;
    var cx, cy, s, phi = 0;
    if (g.mob) {
      cx = vw / 2 + d * g.step; cy = vh * 0.47; s = Math.abs(d) < 0.5 ? 1 : 1 - Math.min(1, Math.abs(d)) * 0.08;
    } else {
      var th = d * 0.46;
      cx = vw / 2 + Math.sin(th) * g.W * 2.0;
      cy = vh * 0.47 - (1 - Math.cos(th)) * g.H * 0.95;
      s = 1 - Math.min(2.2, Math.abs(d)) * 0.15;
      phi = U.clamp(-d * 5, -12, 12) * D2R;
    }
    cx += off[0]; cy += off[1];
    var out = [], sx = [-1, 1, 1, -1], sy = [-1, -1, 1, 1];
    for (var k = 0; k < 4; k++) {
      var X = sx[k] * w2 * s, Y = sy[k] * h2 * s;
      var Z = X * Math.sin(phi), k2 = g.F / (g.F + Z);
      out.push([cx + X * Math.cos(phi) * k2, cy + Y * k2]);
    }
    return out;
  }

  function thumbCorners(i, mon) {
    var s = geom.slots[i];
    return [mon(s[0], s[1]), mon(s[2], s[1]), mon(s[2], s[3]), mon(s[0], s[3])];
  }

  var lastT = 0;
  function updateCards(p, dt) {
    var monPts = quad(OF.monitor.esquinas);
    var mon = monPts && EV.overlay.quadFn(monPts);
    var mesa = stop('mesa'), k = ppd() * 1.12;
    // Las cards están "delante": se desplazan con la cámara algo más que la oficina.
    var off = [-(cam.yaw - mesa.yaw) * k, (cam.pitch - mesa.pitch) * k];
    var thumbsOn = U.smooth(0.03, 0.09, p);                       // la pantalla se enciende
    var leaving = U.range(p, P.aTecho[0], P.aTecho[1] + 0.02);
    var settledAll = true;

    // Arco: sigue su objetivo (arrastre, flechas, foco).
    if (arc.free) arc.off.x = arc.target; else arc.off.step(arc.target, dt);
    var central = cards[DATA.central];

    cards.forEach(function (c) {
      var s0 = P.vuelo[0] + c.order * 0.034;
      var tgt = U.smooth(s0, s0 + 0.075, p);
      if (reduce) c.t.set(tgt); else c.t.step(tgt, dt);
      var t = c.t.x;
      if (Math.abs(t - 1) > 0.02 || tgt < 1) settledAll = false;
      var d = c.i - DATA.central - arc.off.x;
      var lift = c.lift.step(c.hover && interactive ? 1 : 0, dt);
      var slot = slotCorners(d, [off[0], off[1] - lift * 8]);
      var th = mon ? thumbCorners(c.i, mon) : null;
      var pts;
      if (!th) pts = t > 0.5 ? slot : null;
      else if (t <= 0.0005) pts = th;
      else {
        // Vuelo en arco: sube hacia la cámara y cae a su sitio.
        var arcLift = Math.sin(Math.PI * U.clamp(t, 0, 1)) * vh * 0.07;
        // Rotación que se amortigua: inclinación proporcional a la velocidad del muelle.
        var tilt = U.clamp(c.t.v * 0.035, -0.12, 0.12) * (c.i < DATA.central ? -1 : 1);
        var cxm = 0, cym = 0;
        pts = [];
        for (var q = 0; q < 4; q++) {
          var x = th[q][0] + (slot[q][0] - th[q][0]) * t, y = th[q][1] + (slot[q][1] - th[q][1]) * t - arcLift;
          pts.push([x, y]); cxm += x / 4; cym += y / 4;
        }
        if (tilt) {
          var cs = Math.cos(tilt), sn = Math.sin(tilt);
          pts = pts.map(function (pt) { var dx = pt[0] - cxm, dy = pt[1] - cym; return [cxm + dx * cs - dy * sn, cym + dx * sn + dy * cs]; });
        }
      }
      // Al subir la mirada al techo, las cards bajan y se van.
      var o = thumbsOn * (1 - U.smooth(0.55, 1, leaving));
      if (!pts || o <= 0.001) { c.w('visibility', 'hidden'); return; }
      var m = EV.overlay.quadMatrix(geom.W, geom.H, pts);
      if (!m) { c.w('visibility', 'hidden'); return; }
      c.w('transform', m);
      c.w('opacity', o >= 0.999 ? '1' : o.toFixed(3));
      c.w('visibility', 'visible');
      c.w('zIndex', String(10 - Math.round(Math.abs(d) * 2)));
      // Luz: emisiva dentro de la pantalla; al cruzar el cristal, cálida y con sombra.
      var tc = U.clamp(t, 0, 1);
      c.emision('opacity', (1 - U.smooth(0, 0.45, tc)).toFixed(3));
      c.calido('opacity', (U.smooth(0.2, 0.8, tc) * 0.9).toFixed(3));
      c.halo('opacity', (U.smooth(0.25, 1, tc) * (1 - leaving)).toFixed(3));
      var dim = geom.mob ? Math.min(1, Math.abs(d)) * 0.28 : Math.min(2, Math.abs(d)) * 0.2;
      c.velo('opacity', (dim * tc).toFixed(3));
    });

    // Interacción solo con el arco formado y quieto.
    var on = settledAll && p < P.aTecho[0] + 0.005 && p > P.vuelo[1] - 0.01;
    if (on !== interactive) {
      interactive = on;
      els.proyectos.classList.toggle('is-activo', on);
      if (on) els.lista.removeAttribute('inert'); else els.lista.setAttribute('inert', '');
    }

    // Reflejo del monitor en la mesa: color dominante de la card central.
    if (vivos.reflejo) {
      var ct = central ? U.clamp(central.t.x, 0, 1) : 0;
      vivos.reflejo.set(quad(OF.vivos.reflejo.esquinas), (0.18 + 0.22 * ct) * thumbsOn * (1 - leaving));
    }
    // Huecos que dejan las miniaturas en la pantalla.
    if (els.monitor) {
      els.monitor.set(monPts, thumbsOn * (1 - leaving));
      cards.forEach(function (c, i) { els.huecos[i]('opacity', U.smooth(0.05, 0.4, c.t.x).toFixed(3)); });
    }
  }

  /* ---------- detalle (clic en una card) ---------- */
  var detail = { open: false, card: null };
  function openDetail(c) {
    var p = c.p;
    if (p.proximamente) return;
    var dlg = els.dialog, box = dlg.querySelector('[data-detalle]');
    var t = U.content('proyectos.detalle');
    box.innerHTML =
      '<figure class="detalle__captura"><img alt="" decoding="async"></figure>' +
      '<div class="detalle__texto">' +
        '<h3 class="detalle__titulo" id="detalle-titulo"></h3>' +
        '<p class="detalle__meta"></p>' +
        '<p class="detalle__etiqueta"></p><p class="detalle__necesidad"></p>' +
        '<figure class="detalle__informe"><img alt="" decoding="async"><figcaption></figcaption></figure>' +
        '<a class="boton boton--oscuro detalle__ver" target="_blank" rel="noopener"></a>' +
      '</div>';
    box.querySelector('.detalle__captura img').src = p.captura;
    box.querySelector('.detalle__captura img').alt = 'Portada de la web de ' + p.cliente;
    box.querySelector('.detalle__titulo').textContent = p.cliente;
    box.querySelector('.detalle__meta').textContent = p.sector + ' · ' + p.ciudad;
    box.querySelector('.detalle__etiqueta').textContent = t.necesidad;
    box.querySelector('.detalle__necesidad').textContent = p.necesidad;
    var inf = box.querySelector('.detalle__informe');
    if (p.informe) {
      inf.querySelector('img').src = p.informe;
      inf.querySelector('img').alt = 'Informe de PageSpeed (Lighthouse) de ' + p.cliente;
      var m = p.medicion;
      inf.querySelector('figcaption').textContent = t.pagespeed + (m ? ' · escritorio ' + m.escritorio.rendimiento + ' · móvil ' + m.movil.rendimiento + ' · medido el ' + m.fecha.split('-').reverse().join('/') : '');
    } else inf.remove();
    var a = box.querySelector('.detalle__ver');
    a.href = p.url;
    a.innerHTML = '<span></span><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
    a.querySelector('span').textContent = t.ver;

    var from = c.el.getBoundingClientRect();
    EV.scroll.stop();
    dlg.showModal();
    detail.open = true; detail.card = c;
    var panel = dlg.querySelector('.detalle__panel');
    if (reduce) return;
    var to = panel.getBoundingClientRect();
    gsap.fromTo(panel,
      { x: from.left - to.left, y: from.top - to.top, scaleX: from.width / to.width, scaleY: from.height / to.height, transformOrigin: '0 0', borderRadius: 14 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: 'expo.out', clearProps: 'transform' });
    gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.35, delay: 0.18, ease: 'power1.out' });
    gsap.fromTo(dlg, { '--velo': 0 }, { '--velo': 1, duration: 0.5, ease: 'power1.out' });
  }
  function closeDetail() {
    if (!detail.open) return;
    var dlg = els.dialog, panel = dlg.querySelector('.detalle__panel'), c = detail.card;
    var done = function () {
      dlg.close(); detail.open = false; EV.scroll.start();
      var b = c && c.el.querySelector('.pcard__abrir');
      if (b) b.focus({ preventScroll: true });
    };
    if (reduce || !c) return done();
    var from = panel.getBoundingClientRect(), to = c.el.getBoundingClientRect();
    gsap.to(dlg.querySelector('[data-detalle]'), { opacity: 0, duration: 0.15 });
    gsap.to(dlg, { '--velo': 0, duration: 0.45, ease: 'power1.in' });
    gsap.to(panel, {
      x: to.left - from.left, y: to.top - from.top, scaleX: to.width / from.width, scaleY: to.height / from.height,
      transformOrigin: '0 0', duration: 0.5, ease: 'expo.inOut',
      onComplete: function () { gsap.set(panel, { clearProps: 'transform' }); done(); }
    });
  }

  /* ==========================================================================
     Cifras en el techo
     ========================================================================== */
  var cifras = [];
  function buildCifras() {
    var ul = stage.querySelector('[data-cifras]');
    (CONF.cifras || []).forEach(function (c, i) {
      var li = document.createElement('li');
      li.className = 'cifra';
      var pend = c.pendienteConfirmar;
      li.innerHTML = '<span class="cifra__blur" aria-hidden="true"></span><span class="cifra__valor"></span><span class="cifra__etiqueta"></span>';
      var val = pend ? 'Rápida' : c.valor;
      li.querySelector('.cifra__valor').textContent = val;
      li.querySelector('.cifra__blur').textContent = val;
      li.querySelector('.cifra__etiqueta').textContent = c.etiqueta;
      if (pend) li.classList.add('cifra--texto');
      ul.appendChild(li);
      cifras.push({ c: c, el: li, w: U.writer(li), v: li.querySelector('.cifra__valor'), b: U.writer(li.querySelector('.cifra__blur')), last: '', pend: pend });
    });
  }
  function fmt(c, n) {
    var s = c.decimales ? n.toFixed(c.decimales).replace('.', ',') : String(Math.round(n));
    return c.formato.replace('{n}', s);
  }
  function updateCifras(p) {
    var n = cifras.length, a = P.cifras[0], span = (P.cifras[1] - a) / n;
    var rowY = vh * (geom.mob ? 0.3 : 0.3), cy0 = vh * (geom.mob ? 0.5 : 0.53), mob = geom.mob;
    var bigScale = 1, rowScale = mob ? 0.42 : 0.4;
    var out = U.smooth(P.salida[0] + 0.01, P.salida[0] + 0.07, p);
    var frase = U.smooth(P.fila[0], P.fila[0] + 0.03, p) * (1 - out);
    els.frase('opacity', frase.toFixed(3));
    els.frase('transform', 'translate3d(-50%,' + ((1 - frase) * 12).toFixed(1) + 'px,0)');
    cifras.forEach(function (o, i) {
      var s = a + i * span;
      var arrive = U.range(p, s, s + span * 0.5);           // desde el fondo hacia la cámara
      var toRow = U.range(p, s + span * 0.6, s + span * 0.95);
      if (i === n - 1) toRow = U.range(p, P.fila[0] - 0.01, P.fila[0] + 0.02);
      if (arrive <= 0) { o.w('opacity', '0'); o.w('visibility', 'hidden'); return; }
      o.w('visibility', 'visible');
      var ea = U.expoOut(arrive), er = U.p2io(toRow);
      // fila: 4 columnas (2×2 en móvil)
      var col, rx, ry;
      if (mob) { col = i % 2; rx = vw * (col ? 0.73 : 0.27); ry = rowY + (i < 2 ? -vh * 0.07 : vh * 0.08); }
      else { rx = vw * (0.5 + (i - (n - 1) / 2) * 0.215); ry = rowY; }
      var sc = (0.28 + 0.72 * ea) * bigScale;
      sc = sc + (rowScale - sc) * er;
      var x = vw / 2 + (rx - vw / 2) * er, y = cy0 + (ry - cy0) * er;
      o.w('transform', 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + sc.toFixed(4) + ')');
      o.w('opacity', (U.clamp(arrive * 2.2, 0, 1) * (1 - out)).toFixed(3));
      o.b('opacity', (1 - U.smooth(0.15, 0.7, arrive)).toFixed(3));
      // Contador: sube muy rápido y frena en seco.
      if (!o.pend && o.c.num != null) {
        var k = U.range(p, s + span * 0.04, s + span * 0.42);
        var txt = fmt(o.c, o.c.num * Math.pow(k, 0.55));
        if (k >= 1) txt = o.c.valor;
        if (txt !== o.last) { o.last = txt; o.v.textContent = txt; }
      }
    });
  }

  /* ==========================================================================
     Detalles vivos (sutiles; ninguno con movimiento reducido)
     ========================================================================== */
  var vivos = {};
  function buildVivos() {
    var V = OF.vivos, cap = els.capas;
    // Reflejo del monitor en la mesa
    var r = document.createElement('div'); r.className = 'quad reflejo'; cap.appendChild(r);
    vivos.reflejo = quadLayer(r);
    // Pantallas del equipo al fondo
    vivos.equipo = V.pantallasEquipo.map(function (s) {
      var d = document.createElement('div'); d.className = 'quad equipo';
      d.innerHTML = '<span></span><span></span><span></span>';
      cap.appendChild(d);
      return { q: quadLayer(d), el: d, cfg: s, on: 0 };
    });
    vivos.equipoT = 0;
    // Pantalla del móvil: hora real de Madrid, 2 s, una vez.
    var m = document.createElement('div'); m.className = 'quad movil';
    m.innerHTML = '<span class="movil__hora"></span><span class="movil__fecha"></span>';
    cap.appendChild(m);
    vivos.movil = { q: quadLayer(m), el: m, o: { v: 0 }, done: !V.movil.activo };
    // Vapor de la taza
    var cv = document.createElement('canvas'); cv.className = 'vapor'; cv.width = 120; cv.height = 300;
    cap.appendChild(cv);
    vivos.vapor = { el: cv, ctx: cv.getContext('2d'), w: U.writer(cv) };
    // Boli: rueda una vez hacia el cuaderno
    if (V.boli.activo) {
    var b = document.createElement('div'); b.className = 'boli';
    b.innerHTML = '<span class="boli__sombra"></span><img src="assets/oficina/boli.png" alt="" width="600" height="44" decoding="async">';
    cap.appendChild(b);
    vivos.boli = { el: b, w: U.writer(b), roll: { v: 0 }, done: false };
    }
  }

  function madridTime() {
    var d = new Date();
    try {
      return {
        h: new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
        f: new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long' }).format(d)
      };
    } catch (e) { return { h: d.toTimeString().slice(0, 5), f: '' }; }
  }

  function updateVivos(p, now, settled) {
    if (!vivos.reflejo) return;
    var V = OF.vivos;
    var visible = swapped && p < P.aTecho[1];
    // Pantallas del equipo: una se enciende con gris azulado tenue y cambian cada ~8 s.
    if (visible) {
      var slot = Math.floor(now / 8000) % (vivos.equipo.length + 1);   // a veces ninguna
      vivos.equipo.forEach(function (e, i) {
        var want = slot === i ? 1 : 0;
        e.on += (want - e.on) * 0.02;
        e.q.set(quad(e.cfg.esquinas), e.on * 0.9 * (1 - U.range(p, P.aTecho[0], P.aTecho[1])));
      });
    } else vivos.equipo.forEach(function (e) { e.q.set(null, 0); });

    // Móvil: cuando está a la vista con la cámara asentada, se enciende 2 s.
    var mv = vivos.movil, mq = quad(V.movil.esquinas);
    var mc = mq && [(mq[0][0] + mq[2][0]) / 2, (mq[0][1] + mq[2][1]) / 2];
    if (!mv.done && settled && mc && onScreen(mc, -50)) {
      mv.done = true;
      var t = madridTime();
      mv.el.querySelector('.movil__hora').textContent = t.h;
      mv.el.querySelector('.movil__fecha').textContent = t.f;
      gsap.timeline().to(mv.o, { v: 1, duration: 0.35, ease: 'power2.out' }).to(mv.o, { v: 0, duration: 0.9, ease: 'power1.inOut', delay: 2 });
    }
    mv.q.set(visible ? mq : null, mv.o.v);

    // Vapor: hilo fino en bucle lento, anclado al borde de la taza.
    var vp = vivos.vapor, base = project(V.vapor.yaw, V.vapor.pitch), top = project(V.vapor.yaw, V.vapor.pitch + V.vapor.alto);
    if (visible && onScreen(base, 40) && top) {
      var hpx = Math.hypot(top[0] - base[0], top[1] - base[1]), sc = hpx / 300;
      vp.w('transform', 'translate3d(' + (base[0] - 60 * sc).toFixed(1) + 'px,' + (base[1] - 300 * sc).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')');
      vp.w('opacity', '0.35');
      vp.w('visibility', 'visible');
      drawSteam(vp.ctx, now / 1000);
    } else vp.w('visibility', 'hidden');

    // Boli: cilindro liso (solo traslación). Rueda una vez al asentarse, si se ve.
    var bo = vivos.boli, B = V.boli;
    if (!bo) return;
    var rr = bo.roll.v;
    var A = project(B.a[0] + B.rodar[0] * rr, B.a[1] + B.rodar[1] * rr), Bp = project(B.b[0] + B.rodar[0] * rr, B.b[1] + B.rodar[1] * rr);
    if (visible && A && Bp && (onScreen(A, 0) || onScreen(Bp, 0))) {
      if (!bo.done && settled && onScreen([(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2], -40)) {
        bo.done = true;
        // ~3 cm con frenada natural (fricción de rodadura)
        gsap.to(bo.roll, { v: 1, duration: 1.5, ease: 'power3.out', delay: 0.4 });
      }
      var len = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), ang = Math.atan2(Bp[1] - A[1], Bp[0] - A[0]);
      var hgt = B.diametro * ppd();
      bo.w('transform', 'translate3d(' + A[0].toFixed(1) + 'px,' + A[1].toFixed(1) + 'px,0) rotate(' + ang.toFixed(4) + 'rad) scale(' + (len / 600).toFixed(4) + ',' + (hgt / 44).toFixed(4) + ') translateY(-50%)');
      bo.w('visibility', 'visible');
    } else bo.w('visibility', 'hidden');
  }

  function drawSteam(ctx, t) {
    var W = 120, H = 300;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (var s = 0; s < 3; s++) {
      var ph = s * 2.1, x0 = 60 + (s - 1) * 9;
      ctx.beginPath();
      for (var y = H; y >= 0; y -= 6) {
        var k = (H - y) / H;
        var x = x0 + Math.sin(t * 0.55 + ph + k * 5.5) * (4 + k * 16) + Math.sin(t * 0.23 + ph * 1.7 + k * 9) * k * 7;
        if (y === H) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      var g = ctx.createLinearGradient(0, H, 0, 0);
      var a = 0.55 + 0.25 * Math.sin(t * 0.4 + ph);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.1, 'rgba(255,255,255,' + (a * 0.45).toFixed(3) + ')');
      g.addColorStop(0.5, 'rgba(255,255,255,' + (a * 0.22).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 9 - s * 2;
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
  }

  /* ==========================================================================
     Fondo del hero ↔ panorama
     ========================================================================== */
  function loadSharp() {
    var pic = els.nitido;
    if (!pic || pic.dataset.loaded) return;
    pic.dataset.loaded = '1';
    pic.querySelectorAll('source').forEach(function (s) { s.srcset = s.dataset.srcset; });
    var img = pic.querySelector('img'); img.src = img.dataset.src;
  }

  function start() {
    if (started) return;
    started = true;
    loadSharp();
    if (!cine) return;
    EV.pano.load().then(function () {
      if (!EV.pano.init(document.querySelector('.scene'))) return;
      view = EV.pano.view(OF);
      if (EV.stage.active() === 'oficina') { view.load(); view.show(true); view.lookOn = false; }
      view.ready.then(function () { swapIn(); });
      if (new URLSearchParams(location.search).get('ajustar') === 'oficina') {
        EV.pano.adjustTool(view, { titulo: 'Oficina', marcas: OF.marcas, cuadros: [
          { id: 'monitor', esquinas: OF.monitor.esquinas }, { id: 'móvil', esquinas: OF.vivos.movil.esquinas },
          { id: 'reflejo', esquinas: OF.vivos.reflejo.esquinas }
        ].concat(OF.vivos.pantallasEquipo.map(function (s, i) { return { id: 'equipo' + (i + 1), esquinas: s.esquinas }; })) });
      }
    }).catch(function () { /* sin Three: se queda la foto plana */ });
  }
  function swapIn() {
    if (swapped || !view) return;
    swapped = true;
    gsap.to(swap, { v: 1, duration: 0.6, ease: 'power1.inOut' });
  }

  /* ==========================================================================
     Render por tick
     ========================================================================== */
  var last = 0;
  function render(p, active) {
    if (!cine) return;
    var now = performance.now();
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!active) return;
    if (p > 0.002 && !started) start();

    var base = camAt(p);
    if (view && swapped) {
      view.setBase(base);
      view.lookOn = p > P.abre[1] * 0.6 && !detail.open;
      if (!view.lookOn) { view.look.tx = 0; view.look.ty = 0; }
      view.fx.blur = U.smooth(P.salida[0] + 0.02, 0.985, p);
      view.fx.exposure = 1 + Math.round(OF.vivos.exposicion.amplitud * Math.sin(now / 1000 / OF.vivos.exposicion.periodo * Math.PI * 2) * 400) / 400;
      cam = view.render() || base;
    } else cam = base;
    setProjector(cam);

    // Canvas: fundido a navy plano al final.
    var navy = U.smooth(0.9, 0.995, p);
    els.canvas('opacity', (1 - navy).toFixed(3));

    // Fondo del hero: desenfocado → nítido (con el mismo dolly) → panorama.
    var blurO = 1 - U.smooth(0.004, 0.075, p);
    els.blurPic('opacity', blurO.toFixed(3));
    var z = Math.tan(heroFov() * D2R / 2) / Math.tan(cam.fov * D2R / 2);
    els.fondo('transform', 'scale(' + z.toFixed(4) + ')');
    els.nitidoW('opacity', (1 - swap.v).toFixed(3));
    els.fondo('visibility', swap.v >= 1 && blurO <= 0 ? 'hidden' : 'visible');

    // Hero: sube como un telón.
    var tel = U.range(p, 0, 0.05);
    els.hero('transform', 'translate3d(0,' + (-U.p2io(tel) * vh * 0.42).toFixed(1) + 'px,0)');
    els.hero('opacity', (1 - U.smooth(0.004, 0.035, p)).toFixed(3));
    els.hero('visibility', p > 0.05 ? 'hidden' : 'visible');

    // Bloques de texto + contador.
    var b1 = U.smooth(0.14, 0.18, p) * (1 - U.smooth(0.5, 0.54, p));
    var b2 = U.smooth(0.63, 0.67, p) * (1 - U.smooth(0.85, 0.89, p));
    els.b1('opacity', b1.toFixed(3)); els.b1('transform', 'translate3d(0,' + ((1 - b1) * 14).toFixed(1) + 'px,0)');
    els.b2('opacity', b2.toFixed(3)); els.b2('transform', 'translate3d(0,' + ((1 - b2) * 14).toFixed(1) + 'px,0)');
    els.b1el.style.visibility = b1 > 0.01 ? 'visible' : 'hidden';
    els.b2el.style.visibility = b2 > 0.01 ? 'visible' : 'hidden';
    var paso = p < 0.58 ? '01' : '02';
    if (els.pasoTxt.textContent !== paso) els.pasoTxt.textContent = paso;
    els.contador('opacity', Math.max(b1, b2).toFixed(3));

    // Velo del techo.
    var velo = U.smooth(P.aTecho[0] + 0.03, P.aTecho[1], p) * (1 - U.smooth(P.salida[0] + 0.02, P.salida[0] + 0.1, p));
    els.velo('opacity', velo.toFixed(3));

    updateCards(p, dt);
    updateCifras(p);
    var settled = p > P.aMesa[1] && p < P.aTecho[0] && swapped;
    if (!reduce) updateVivos(p, now, settled);
  }

  /* ==========================================================================
     Init
     ========================================================================== */
  function resize() {
    vw = window.innerWidth; vh = window.innerHeight;
    measureCards();
    if (els.monitor) els.monitor.measure();
    if (vivos.movil) { vivos.movil.q.measure(); vivos.reflejo.measure(); vivos.equipo.forEach(function (e) { e.q.measure(); }); }
  }

  function init(z) {
    U = EV.util; CONF = window.EVIMES_CONFIG; OF = CONF.oficina;
    zone = z; stage = z.stage; cine = EV.mode === 'cine';
    reduce = EV.reducedMotion;
    vw = window.innerWidth; vh = window.innerHeight;
    var $ = function (s) { return stage.querySelector(s); };
    els.capas = $('.capas');
    els.proyectos = $('.proyectos');
    els.lista = $('[data-proyectos]');
    els.dialog = document.querySelector('.detalle');
    els.nitido = document.querySelector('.fondo__nitido');

    buildCards();
    buildCifras();
    measureCards();

    // Detalle: cerrar con X, Esc o clic fuera.
    els.dialog.addEventListener('click', function (e) { if (e.target === els.dialog || e.target.closest('[data-cerrar]')) closeDetail(); });
    els.dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeDetail(); });
    if (!cine) {
      // Versión fija: foto plana nítida + cards en rejilla + cifras en fila.
      loadSharp();
      return;
    }
    // Monitor: huecos de las miniaturas (contorno tenue).
    var mon = document.createElement('div');
    mon.className = 'quad monitor';
    geom.slots.forEach(function (s) {
      var h = document.createElement('span');
      h.className = 'monitor__hueco';
      h.style.left = (s[0] * 100) + '%'; h.style.top = (s[1] * 100) + '%';
      h.style.width = ((s[2] - s[0]) * 100) + '%'; h.style.height = ((s[3] - s[1]) * 100) + '%';
      mon.appendChild(h);
    });
    els.capas.appendChild(mon);
    els.monitor = quadLayer(mon);
    els.huecos = Array.prototype.map.call(mon.children, function (h) { return U.writer(h); });
    if (!reduce) buildVivos();

    // Color del reflejo = color dominante de la card central.
    var cimg = cards[DATA.central] && cards[DATA.central].el.querySelector('img');
    if (cimg && vivos.reflejo) {
      var setC = function () { var col = U.averageColor(cimg); if (col) vivos.reflejo.el.style.setProperty('--reflejo', col); };
      if (cimg.complete) setC(); else cimg.addEventListener('load', setC);
    }

    els.lista.setAttribute('inert', '');
    els.canvas = U.writer(document.querySelector('.scene'));
    els.fondo = U.writer(document.querySelector('.fondo'));
    els.blurPic = U.writer(document.querySelector('.fondo__blur'));
    els.nitidoW = U.writer(els.nitido);
    els.hero = U.writer($('.hero'));
    els.b1el = $('.bloque[data-paso="01"]'); els.b2el = $('.bloque[data-paso="02"]');
    els.b1 = U.writer(els.b1el); els.b2 = U.writer(els.b2el);
    els.contador = U.writer($('.contador'));
    els.pasoTxt = $('[data-contador]');
    els.velo = U.writer($('.techo-velo'));
    els.frase = U.writer($('.cifras__frase'));

    window.addEventListener('resize', resize);
    // Carga diferida: Three.js y el panorama al primer gesto de scroll.
    var kick = function () { start(); ['wheel', 'touchstart', 'keydown', 'scroll'].forEach(function (ev) { window.removeEventListener(ev, kick); }); };
    ['wheel', 'touchstart', 'keydown', 'scroll'].forEach(function (ev) { window.addEventListener(ev, kick, { passive: true }); });

    EV.stage.register('oficina', {
      activate: function (on) {
        if (!view) return;
        if (on) { view.load(); view.show(true); view.ready.then(function () { swapIn(); }); }
        else {
          // Pasada la oficina: se libera el panorama (dispose).
          view.show(false); view.release(); swapped = false; swap.v = 0;
        }
      },
      render: render,
      key: function () { return view ? view.key : 'hero'; },
      luminanceUnder: function (rect) { return view && swapped ? view.luminanceUnder(rect) : 0.01; },
      whenReady: function () { return view ? view.ready : Promise.resolve(); }
    });
  }

  /* Progreso de cada parada (para el menú: "Proyectos" lleva al arco formado). */
  EV.oficina = {
    init: init,
    puntos: { inicio: 0, proyectos: 0.44, cifras: 0.8 },
    camera: function () { return Object.assign({}, cam); },
    project: function (y, p) { return project(y, p); },
    /* QA: peor borde del encuadre en todo el recorrido (costura ±180° y silla). */
    check: function () {
      var worst = { yaw: 0, pitchMin: 90 };
      for (var p = 0; p <= 1; p += 0.005) {
        var c = camAt(p);
        [-1, 1].forEach(function (sx) {
          [-1, 1].forEach(function (lx) {
            var cc = { yaw: c.yaw + lx * OF.mirar.yaw, pitch: c.pitch + sx * OF.mirar.pitch, fov: c.fov };
            if (view) cc = view.guard(cc.yaw, cc.pitch, cc.fov);
            setProjector(cc);
            // esquinas del encuadre → ángulos (muestreo del borde)
            for (var k = 0; k <= 10; k++) {
              var sxp = k / 10 * 2 - 1;
              [[sxp, -1], [sxp, 1], [sx, sxp]].forEach(function (s) {
                var xs = s[0] * tanV * aspect, ys = s[1] * tanV;
                var dx = F[0] + R[0] * xs + UP[0] * ys, dy = F[1] + R[1] * xs + UP[1] * ys, dz = F[2] + R[2] * xs + UP[2] * ys;
                var l = Math.hypot(dx, dy, dz);
                var yaw = Math.atan2(-dz, -dx) / D2R, pit = Math.asin(dy / l) / D2R;
                if (Math.abs(yaw) > Math.abs(worst.yaw)) worst.yaw = +yaw.toFixed(1);
                if (pit < worst.pitchMin) { worst.pitchMin = +pit.toFixed(1); worst.pAt = +p.toFixed(3); }
              });
            }
          });
        });
      }
      setProjector(cam);
      return worst;
    }
  };
})();
