/* ==========================================================================
   overlay.js — capas HTML encima del canvas.

   cartela(opts)
     Cartela de museo: ancla + filete finísimo + texto pequeño. Aparece
     mientras el progreso de su zona está en `range` y se va después.
     Todo está atado al scroll (reversible), no a temporizadores.

   screenQuad(el, opts)
     Coloca un iframe/imagen/elemento sobre una pantalla del vídeo con
     matrix3d (homografía de 4 puntos), interpolando las esquinas entre
     keyframes. Se sincroniza con el fotograma REALMENTE dibujado, así
     la pantalla HTML nunca se despega de la imagen aunque falten fotogramas.

   Solo se escriben transform, opacity y clip-path.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  var items = [];   // { zone, update(p, active), hide() }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function expoOut(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function cubicOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* Escribe un estilo solo si cambia (evita invalidaciones inútiles). */
  function writer(el) {
    var cache = {};
    return function (prop, val) {
      if (cache[prop] === val) return;
      cache[prop] = val;
      el.style[prop] = val;
    };
  }

  /* ---------------------------------------------------------------------
     Cartela
     opts: { zone, range:[from,to], objeto, texto, tecnica, x, y, xm, ym,
             side:'right'|'left', parent }
     --------------------------------------------------------------------- */
  function cartela(opts) {
    var el = document.createElement('div');
    el.className = 'cartela';
    if (opts.side === 'left') el.dataset.side = 'left';
    el.style.setProperty('--x', opts.x || '50%');
    el.style.setProperty('--y', opts.y || '50%');
    if (opts.xm) el.style.setProperty('--x-m', opts.xm);
    if (opts.ym) el.style.setProperty('--y-m', opts.ym);

    var anchor = document.createElement('span');
    anchor.className = 'cartela__anchor';
    anchor.setAttribute('aria-hidden', 'true');
    var line = document.createElement('span');
    line.className = 'cartela__line';
    line.setAttribute('aria-hidden', 'true');
    var body = document.createElement('div');
    body.className = 'cartela__body';

    if (opts.objeto) {
      var obj = document.createElement('p');
      obj.className = 'cartela__obj';
      obj.textContent = opts.objeto;
      body.appendChild(obj);
    }
    if (opts.texto) {
      var tx = document.createElement('p');
      tx.className = 'cartela__text';
      tx.textContent = opts.texto;
      body.appendChild(tx);
    }
    if (opts.tecnica) {
      var tc = document.createElement('p');
      tc.className = 'cartela__tech';
      tc.textContent = opts.tecnica;
      body.appendChild(tc);
    }
    el.appendChild(anchor);
    el.appendChild(line);
    el.appendChild(body);
    (opts.parent || document.body).appendChild(el);

    if (EV.mode !== 'cine') return el; // modo fijo: estática y visible (CSS)

    var from = opts.range[0], to = opts.range[1];
    var span = Math.max(0.0001, to - from);
    var wEl = writer(el), wLine = writer(line), wBody = writer(body);

    /* opts.anchor: función → [x, y] en pantalla (o null). La cartela sigue a
       su objeto: el punto de ancla queda exactamente sobre él. El lado del
       texto se decide al aparecer (nunca cambia a la vista). */
    var anchored = typeof opts.anchor === 'function';
    var dotY = 0, side = opts.side || 'auto', shown = false, toned = false;
    if (anchored) {
      el.classList.add('cartela--anclada');
      el.style.setProperty('--x', '0px');
      el.style.setProperty('--y', '0px');
      el.style.setProperty('--x-m', '0px');
      el.style.setProperty('--y-m', '0px');
    }
    function place(pt, textShown) {
      if (!shown || !toned) {
        // Lado del texto: el preferido, salvo que no quepa entre los márgenes.
        // Se decide (con la tinta) hasta que el texto empieza a verse.
        var W = window.innerWidth, m = 16, bw = el.offsetWidth;
        var s = side === 'auto' ? (pt[0] > W * 0.58 ? 'left' : 'right') : side;
        if (s === 'left' && pt[0] - bw < m && pt[0] + bw <= W - m) s = 'right';
        else if (s === 'right' && pt[0] + bw > W - m && pt[0] - bw >= m) s = 'left';
        if (s === 'left') el.dataset.side = 'left'; else delete el.dataset.side;
        dotY = anchor.offsetTop + anchor.offsetHeight / 2;
        shown = true;
      }
      var left = el.dataset.side === 'left';
      wEl('transform', 'translate3d(' + pt[0].toFixed(1) + 'px,' + (pt[1] - dotY).toFixed(1) + 'px,0)' + (left ? ' translateX(-100%)' : ''));
      if (!toned) {
        // Tinta según lo que hay detrás: clara sobre oscuro, navy sobre papel
        // o pared clara. Se mide hasta que el texto empieza a verse y ahí se
        // fija: nunca cambia a la vista.
        var Lb = EV.stage.luminanceUnder(body.getBoundingClientRect());
        el.classList.toggle('cartela--clara', Lb != null && Lb > LIGHT_BG);
        if (textShown) toned = true;
      }
    }

    items.push({
      zone: opts.zone,
      progress: opts.progress,
      update: function (p) {
        if (opts.rangeFn) { var rr = opts.rangeFn(); from = rr[0]; span = Math.max(0.0001, rr[1] - rr[0]); }
        var local = (p - from) / span;
        if (local <= 0 || local >= 1) { this.hide(); return; }
        // entrada: ancla → filete → texto; salida: fundido.
        var enter = clamp01(local / 0.28);
        var exit = clamp01((1 - local) / 0.2);
        var lineT = expoOut(clamp01(enter * 1.8));
        var bodyT = cubicOut(clamp01(enter * 1.8 - 0.55));
        if (anchored) {
          var pt = opts.anchor(p);
          if (!pt) { this.hide(); return; }
          place(pt, bodyT > 0.02);
        }
        wEl('opacity', String(Math.min(clamp01(enter * 6), exit).toFixed(3)));
        wLine('transform', 'scaleX(' + lineT.toFixed(4) + ')');
        wBody('clipPath', 'inset(0 0 ' + ((1 - bodyT) * 100).toFixed(2) + '% 0)');
      },
      hide: function () { wEl('opacity', '0'); shown = false; toned = false; }
    });
    return el;
  }

  /* ---------------------------------------------------------------------
     Homografía: cuadrado unidad → cuadrilátero (Heckbert).
     Esquinas en orden: sup-izq, sup-der, inf-der, inf-izq.
     Devuelve matrix3d para un elemento de w × h px con transform-origin 0 0.
     --------------------------------------------------------------------- */
  function quadMatrix(w, h, q) {
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1];
    var x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
    var sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    var a, b, c, d, e, f, g, hh;
    if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
      a = x1 - x0; b = x2 - x1; c = x0;
      d = y1 - y0; e = y2 - y1; f = y0;
      g = 0; hh = 0;
    } else {
      var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
      var den = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(den) < 1e-12) return null;
      g = (sx * dy2 - dx2 * sy) / den;
      hh = (dx1 * sy - sx * dy1) / den;
      a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; c = x0;
      d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; f = y0;
    }
    // u = X/w, v = Y/h  →  matrix3d en orden de columnas.
    return 'matrix3d(' +
      (a / w) + ',' + (d / w) + ',0,' + (g / w) + ',' +
      (b / h) + ',' + (e / h) + ',0,' + (hh / h) + ',' +
      '0,0,1,0,' +
      c + ',' + f + ',0,1)';
  }

  /* Homografía como función: (u, v) en 0–1 → punto de pantalla dentro del
     cuadrilátero q (misma convención que quadMatrix). */
  function quadFn(q) {
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1];
    var x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
    var sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
    var a, b, c, d, e, f, g, hh;
    if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
      a = x1 - x0; b = x2 - x1; c = x0; d = y1 - y0; e = y2 - y1; f = y0; g = 0; hh = 0;
    } else {
      var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
      var den = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(den) < 1e-12) return null;
      g = (sx * dy2 - dx2 * sy) / den;
      hh = (dx1 * sy - sx * dy1) / den;
      a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; c = x0;
      d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; f = y0;
    }
    return function (u, v) {
      var w = g * u + hh * v + 1;
      return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
    };
  }

  /* ---------------------------------------------------------------------
     screenQuad(el, opts)
     Coloca un elemento HTML (imagen, iframe, página) sobre 4 puntos de
     pantalla con matrix3d. Los puntos los da el escenario en cada tick
     (en las salas, la proyección exacta de 4 direcciones yaw/pitch con la
     misma cámara que dibuja el panorama: la capa no baila al girar).
     opts: { zone, points: function (p) → [[x,y]×4] | null,
             opacity: function (p) → 0–1 (opcional) }
     --------------------------------------------------------------------- */
  function screenQuad(el, opts) {
    el.classList.add('quad');
    var size = { w: 0, h: 0 };
    function measure() {
      // offsetWidth/Height ignoran transforms: tamaño intrínseco del elemento.
      size.w = el.offsetWidth || 1;
      size.h = el.offsetHeight || 1;
    }
    measure();
    window.addEventListener('resize', measure);

    var wEl = writer(el);
    var api = {
      zone: opts.zone,
      progress: opts.progress,
      update: function (p, active) {
        if (!active) { this.hide(); return; }
        var pts = opts.points(p);
        if (!pts) { this.hide(); return; }
        var m = quadMatrix(size.w, size.h, pts);
        if (!m) { this.hide(); return; }
        var o = opts.opacity ? opts.opacity(p) : 1;
        if (o <= 0.001) { this.hide(); return; }
        wEl('transform', m);
        wEl('opacity', o >= 0.999 ? '1' : o.toFixed(3));
        wEl('visibility', 'visible');
      },
      hide: function () { wEl('opacity', '0'); wEl('visibility', 'hidden'); },
      measure: measure
    };
    items.push(api);
    return api;
  }

  /* ---------------------------------------------------------------------
     Scrim local: degradado navy (0–55 %) SOLO detrás de un bloque de texto.
     Nunca un velo a pantalla completa.

     scrim(target, { zone, shape:'radial'|'left'|'right', intensity, range })
       intensity : mínimo declarado por la zona (0–0.55).
       range     : [a,b] de progreso en el que existe (opcional; si no, sigue
                   la opacidad del propio texto).
     Cada tick: mide el brillo medio del fotograma bajo la caja del texto y
     sube la intensidad lo justo para mantener AA (4.5:1, o 3:1 si todo el
     texto del bloque es grande). Solo se anima opacity.
     --------------------------------------------------------------------- */
  var SCRIM_MAX = 0.55;
  var L_TEXT = 0.772;    // luminancia relativa de --stone (#e9e3d8)
  var L_NAVY = 0.0034;   // luminancia relativa de --navy (#080b14)
  function lin2s(L) { return L <= 0.0031308 ? L * 12.92 : 1.055 * Math.pow(L, 1 / 2.4) - 0.055; }
  function s2lin(s) { return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }
  var S_NAVY = lin2s(L_NAVY);
  var S_STONE = lin2s(L_TEXT);
  /* Por encima de este brillo, una cartela anclada pasa a tinta navy con un
     velo claro (como una cartela de museo sobre pared clara). */
  var LIGHT_BG = 0.36;

  /* Contraste de un texto (luminancia del color Lt, alfa ta) sobre un fondo Lb
     cubierto por un velo (navy, o piedra si `So` = S_STONE) con alfa a.
     Las mezclas ocurren en sRGB, como el navegador. */
  function contrastWith(a, Lb, Lt, ta, So) {
    var sb = (1 - a) * lin2s(Lb) + a * (So == null ? S_NAVY : So);
    var st = ta * lin2s(Lt) + (1 - ta) * sb;
    var L1 = s2lin(st), L2 = s2lin(sb);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }

  /* Alfa mínimo del velo para alcanzar `ratio` (bisección; >0.55 = imposible). */
  function alphaFor(Lb, ratio, Lt, ta, So) {
    Lt = Lt == null ? L_TEXT : Lt; ta = ta == null ? 1 : ta;
    if (contrastWith(0, Lb, Lt, ta, So) >= ratio) return 0;
    if (contrastWith(1, Lb, Lt, ta, So) < ratio) return Infinity;
    var lo = 0, hi = 1;
    for (var i = 0; i < 18; i++) {
      var mid = (lo + hi) / 2;
      if (contrastWith(mid, Lb, Lt, ta, So) >= ratio) hi = mid; else lo = mid;
    }
    return hi;
  }

  function parseColor(c) {
    var m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return { L: L_TEXT, a: 1 };
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    var lin = function (v) { return s2lin(v / 255); };
    return { L: 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]), a: p[3] == null ? 1 : p[3] };
  }

  /* Recorre los textos del bloque: cada uno con su tamaño (umbral AA 4.5 o 3
     si es grande: ≥24px, o ≥18.66px en negrita) y su color real (incl. alfa). */
  function textProfile(el) {
    var out = [], seen = {};
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walk.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      // Botones con fondo propio: su contraste no depende de la foto.
      if (n.parentElement.closest('.boton')) continue;
      var cs = getComputedStyle(n.parentElement);
      var px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
      var c = parseColor(cs.color);
      var ratio = (px >= 24 || (bold && px >= 18.66)) ? 3 : 4.5;
      var k = ratio + ':' + c.L.toFixed(4) + ':' + c.a.toFixed(3);
      if (!seen[k]) { seen[k] = 1; out.push({ ratio: ratio, L: c.L, a: c.a }); }
    }
    return out.length ? out : [{ ratio: 4.5, L: L_TEXT, a: 1 }];
  }

  function opacityChain(el, stop) {
    var o = 1;
    for (var n = el; n && n !== stop; n = n.parentElement) {
      var v = n.style.opacity;
      if (v !== '') o *= +v;
    }
    return o;
  }

  var warned = {};

  function scrim(target, opts) {
    var parent = target.parentElement;
    var el = document.createElement('div');
    el.className = 'scrim scrim--' + (opts.shape || 'radial');
    el.setAttribute('aria-hidden', 'true');
    parent.insertBefore(el, target);

    var stage = target.closest('.zone__stage');
    var base = Math.min(SCRIM_MAX, Math.max(0, opts.intensity == null ? 0.25 : opts.intensity));
    var plateau = opts.shape === 'left' || opts.shape === 'right' ? 1 : 0.8; // alfa efectivo en el borde del texto
    var profile = null;
    var cur = base;
    var wEl = writer(el);
    var lastKey = '', need = base, lastLight = false;
    var box = { w: -1, h: -1, x: 0, y: 0 };

    function layout(rect, prect) {
      var w, h, x, y, shape = opts.shape || 'radial';
      var py = shape === 'radial' ? Math.max(72, rect.height * 1.1) : Math.max(48, rect.height * 0.45);
      if (shape === 'radial') {
        var px = Math.max(96, rect.width * 0.55);
        w = rect.width + px * 2; h = rect.height + py * 2;
        x = rect.left - prect.left - px; y = rect.top - prect.top - py;
      } else {
        var fade = Math.max(96, rect.width * 0.45);
        if (shape === 'left') {
          // del borde izquierdo de la pantalla hasta pasado el texto
          x = -prect.left; w = rect.right + fade;
          el.style.setProperty('--stop', ((rect.right / w) * 100).toFixed(2) + '%');
        } else {
          x = rect.left - prect.left - fade; w = (window.innerWidth - rect.left) + fade;
          el.style.setProperty('--stop', ((fade / w) * 100).toFixed(2) + '%');
        }
        h = rect.height + py * 2; y = rect.top - prect.top - py;
        el.style.setProperty('--fade', Math.round(py) + 'px');
      }
      if (Math.abs(w - box.w) > 0.5 || Math.abs(h - box.h) > 0.5) {
        box.w = w; box.h = h;
        el.style.width = w.toFixed(1) + 'px';
        el.style.height = h.toFixed(1) + 'px';
      }
      wEl('transform', 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)');
    }

    var api = {
      zone: opts.zone,
      update: function (p, active) {
        if (!active) { this.hide(); return; }
        var vis = opacityChain(target, stage);
        if (opts.range) {
          var a = opts.range[0], b = opts.range[1], e = 0.06;
          vis *= clamp01((p - a) / e) * clamp01((b - p) / e);
        }
        if (vis <= 0.001) { this.hide(); return; }

        var rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) { this.hide(); return; }
        var prect = parent.getBoundingClientRect();
        layout(rect, prect);

        // Cartela clara (tinta navy): el velo pasa a ser de piedra.
        var light = target.classList.contains('cartela--clara');
        if (light !== lastLight) { lastLight = light; profile = null; lastKey = ''; el.classList.toggle('scrim--claro', light); }
        if (profile === null) profile = textProfile(target);

        // Brillo bajo el texto: solo se recalcula si cambia el fotograma o la caja.
        var d = EV.stage.drawn();
        var key = d.key + '|' + Math.round(rect.left) + ',' + Math.round(rect.top) + ',' + Math.round(rect.width) + ',' + Math.round(rect.height);
        if (key !== lastKey) {
          lastKey = key;
          var Lb = EV.stage.luminanceUnder(rect);
          var req = 0;
          var So = light ? S_STONE : S_NAVY;
          if (Lb == null) req = base;
          else profile.forEach(function (t) { req = Math.max(req, alphaFor(Lb, t.ratio, t.L, t.a, So) / plateau); });
          if (req > SCRIM_MAX && !api.warned) {
            api.warned = true;
            console.warn('[scrim] AA no alcanzable con el tope de 55 % en ' + opts.zone + ' (fotograma ' + d.frame + '): ajusta el encuadre o mueve el texto.', target);
          }
          need = Math.min(SCRIM_MAX, Math.max(base, req));
          el.dataset.aa = req > SCRIM_MAX ? 'no' : 'si';
        }
        // Subir rápido (legibilidad primero), bajar despacio (sin parpadeo).
        cur += (need - cur) * (need > cur ? 0.5 : 0.12);
        wEl('opacity', ((cur / SCRIM_MAX) * vis).toFixed(3));
      },
      hide: function () { wEl('opacity', '0'); },
      intensity: function () { return cur; }
    };
    items.push(api);
    return api;
  }

  /* Crea los scrims que declara la config de una zona (manifest.js). */
  function applyScrims(zone) {
    var list = zone.cfg.scrim || [];
    list.forEach(function (s) {
      zone.stage.querySelectorAll(s.target).forEach(function (t) {
        scrim(t, { zone: zone.cfg.id, shape: s.shape, intensity: s.intensity, range: s.range });
      });
    });
  }

  EV.overlay = {
    cartela: cartela,
    screenQuad: screenQuad,
    quadMatrix: quadMatrix,
    quadFn: quadFn,
    scrim: scrim,
    /* Capa propia de una zona: { zone, progress?, update(p, active), hide() } */
    add: function (it) { items.push(it); return it; },
    applyScrims: applyScrims,
    contrastAlpha: alphaFor,
    contrast: contrastWith, // (alfa navy, L fondo, L texto, alfa texto) → ratio WCAG

    /* Llamado una vez por tick, DESPUÉS de dibujar el canvas. */
    update: function () {
      var active = EV.zones.active();
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        // Las capas de las salas usan el progreso suavizado de su cámara.
        it.update(it.progress ? it.progress() : EV.zones.progress(it.zone), it.zone === active);
      }
    }
  };
})();
