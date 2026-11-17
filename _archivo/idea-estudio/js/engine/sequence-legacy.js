/* ==========================================================================
   sequence.js — reproductor de secuencias de fotogramas en <canvas>.

   - Un único canvas fijo para toda la película.
   - Variante desktop/mobile según ancho, orientación y devicePixelRatio.
   - Carga PROGRESIVA: solo la zona activa y, cuando el usuario ya se mueve
     y la activa está completa, la siguiente. Primero 1 de cada 4 fotogramas,
     luego el resto. Las zonas lejanas nunca se piden y las que quedan lejos
     se liberan de memoria.
   - Si un fotograma no está, dibuja el más cercano cargado.
   - object-fit: cover, nítido en retina (DPR limitado a 2).
   - Sin imágenes reales (ready:false) dibuja un placeholder generado.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  var MAX_INFLIGHT = 6;
  var COARSE_STEP = 4;

  var canvas, ctx;
  var cssW = 0, cssH = 0, dpr = 1;
  var variant = 'desktop';
  var records = {};        // id -> { cfg, index, images[], state Uint8Array (0 nada, 1 pedido, 2 listo, 3 error) }
  var order = [];          // ids en orden
  var queue = [];          // [{id, i}]
  var inflight = 0;
  var activeIndex = 0;
  var userMoved = false;
  var stillMode = false;

  var want = { id: null, f: 0, p: 0 }; // lo que se debería mostrar (p = progreso 0–1 de la zona)
  var drawn = { id: null, frame: -1, key: '' };
  var dirty = true;
  var cover = { s: 1, dx: 0, dy: 0, iw: 1920, ih: 1080 }; // transform imagen → pantalla (px CSS)
  // Cámara 2D del modo keyframe: X' = cx + (X − ox)·z  (X en px CSS tras el cover).
  // Identidad: z = 1, (ox, oy) = centro. Con fotogramas reales no se usa.
  var cam = { z: 1, ox: 0, oy: 0, cx: 0, cy: 0, on: false };
  var waiters = [];

  /* ---------- utilidades ---------- */
  function pad(n) { return String(n).padStart(4, '0'); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // La MISMA regla que los <source media> y los preload del HTML:
  // pantalla estrecha o en vertical → encuadre vertical (mobile).
  var MOBILE_MQ = '(max-width: 767px), (orientation: portrait)';
  function pickVariant() {
    return window.matchMedia(MOBILE_MQ).matches ? 'mobile' : 'desktop';
  }

  // Modo keyframe: la zona aún no tiene fotogramas pero sí una imagen fija.
  function isKeyframe(r) { return !r.cfg.ready && !!r.cfg.keyframe; }
  function keyframeUrl(r) {
    var k = r.cfg.keyframe;
    return k[variant] + '.' + (EV.sequence.imageExt || 'avif');
  }

  function url(rec, i) {
    var c = rec.cfg;
    return 'assets/zones/' + c.slug + '/' + variant + '/' + pad(i + 1) + '.' + (c.ext || 'avif');
  }

  /* ---------- tamaño del canvas ---------- */
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    var nd = Math.min(window.devicePixelRatio || 1, 2);
    if (w === cssW && h === cssH && nd === dpr) return;
    cssW = w; cssH = h; dpr = nd;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var nv = pickVariant();
    if (nv !== variant) {
      variant = nv;
      // Cambia el encuadre: se descarta lo cargado de la otra variante.
      order.forEach(function (id) { evict(id); });
      plan();
    }
    dirty = true;
  }

  /* ---------- carga ---------- */
  function evict(id) {
    var r = records[id];
    if (r && isKeyframe(r) && r.kf) { r.kf = null; r.luma = null; return; }
    if (!r || !r.cfg.ready) return;
    r.gen++; // invalida cargas en curso de esta zona
    r.luma = null;
    for (var i = 0; i < r.images.length; i++) {
      if (r.images[i]) { r.images[i].src = ''; r.images[i] = null; }
    }
    r.state.fill(0);
  }

  /* Keyframe: una sola imagen por variante. Si el HTML trae su <img> de póster
     (precargado como LCP), se reutiliza: no hay segunda descarga. */
  /* Versión HD del keyframe (cfg.keyframe.hd[variant]): solo cuando el usuario
     ya se mueve, para no competir con el LCP. Sustituye a la imagen base. */
  function loadKeyframeHd(r) {
    var hd = r.cfg.keyframe.hd && r.cfg.keyframe.hd[variant];
    var kf = r.kf;
    if (!hd || !kf || !kf.ok || kf.hd) return;
    kf.hd = 'cargando';
    var img = new Image();
    img.decoding = 'async';
    img.src = hd + '.' + (EV.sequence.imageExt || 'avif');
    (img.decode ? img.decode() : Promise.resolve()).then(function () {
      // ImageBitmap: decodificado y listo para la GPU; evita el tirón del primer drawImage.
      return window.createImageBitmap ? createImageBitmap(img) : img;
    }).then(function (bmp) {
      if (r.kf !== kf) return;
      if (bmp !== img) { bmp.naturalWidth = bmp.width; bmp.naturalHeight = bmp.height; }
      kf.img = bmp; kf.hd = 'lista';
      if (r.cfg.id === want.id) dirty = true;
    }, function () { if (r.kf === kf) kf.hd = 'error'; });
  }

  function loadKeyframe(r) {
    if (r.kf && r.kf.variant === variant) { if (userMoved) loadKeyframeHd(r); return; }
    var kf = r.kf = { variant: variant, img: null, ok: false };
    var poster = document.querySelector('[data-poster="' + r.cfg.id + '"] img');
    var img;
    if (poster && (poster.currentSrc || poster.src).indexOf('/' + variant + '/') !== -1) {
      img = poster; // el navegador ya eligió la variante por <source media>
    } else {
      img = new Image();
      img.decoding = 'async';
      img.src = keyframeUrl(r);
    }
    var ready = img.complete && img.naturalWidth ? Promise.resolve()
      : new Promise(function (res, rej) { img.addEventListener('load', res, { once: true }); img.addEventListener('error', rej, { once: true }); });
    ready.then(function () { return img.decode ? img.decode().catch(function () {}) : null; }).then(function () {
      if (r.kf !== kf) return;
      kf.img = img; kf.ok = true;
      if (r.cfg.id === want.id) dirty = true;
      resolveWaiters();
      if (userMoved) loadKeyframeHd(r);
    }, function () { if (r.kf === kf) kf.err = true; });
  }

  function enqueueZone(id, framesOverride) {
    var r = records[id];
    if (r && isKeyframe(r)) { loadKeyframe(r); return; }
    if (!r || !r.cfg.ready) return;
    var n = r.cfg.frames;
    var list = framesOverride || (function () {
      var coarse = [], rest = [];
      for (var i = 0; i < n; i++) (i % COARSE_STEP === 0 || i === n - 1 ? coarse : rest).push(i);
      return coarse.concat(rest);
    })();
    list.forEach(function (i) { if (r.state[i] === 0) queue.push({ id: id, i: i }); });
  }

  function zoneComplete(id) {
    var r = records[id];
    if (!r || !r.cfg.ready) return true;
    for (var i = 0; i < r.state.length; i++) if (r.state[i] < 2) return false;
    return true;
  }

  // Recalcula qué se pide, en qué orden, y qué se libera.
  function plan() {
    queue.length = 0;
    var cur = order[activeIndex];
    if (stillMode) {
      var rs = records[cur];
      enqueueZone(cur, [rs.cfg.poster || 0]);
      var nxt = order[activeIndex + 1];
      if (nxt) enqueueZone(nxt, [records[nxt].cfg.poster || 0]);
    } else {
      enqueueZone(cur);
      var next = order[activeIndex + 1];
      if (next && userMoved) enqueueZone(next);
    }
    // Liberar todo lo que está a más de una zona de distancia.
    order.forEach(function (id, idx) { if (Math.abs(idx - activeIndex) > 1) evict(id); });
    pump();
  }

  function pump() {
    while (inflight < MAX_INFLIGHT && queue.length) {
      var t = queue.shift();
      var r = records[t.id];
      if (!r || r.state[t.i] !== 0) continue;
      load(r, t.i);
    }
  }

  function load(r, i) {
    r.state[i] = 1;
    inflight++;
    var img = new Image();
    img.decoding = 'async';
    var gen = r.gen;
    img.src = url(r, i);
    var done = function (ok) {
      inflight--;
      if (gen !== r.gen) { pump(); return; } // la zona fue liberada mientras cargaba
      if (ok) { r.images[i] = img; r.state[i] = 2; if (r.cfg.id === want.id) dirty = true; }
      else r.state[i] = 3;
      resolveWaiters();
      // Zona activa completa → empezar la siguiente (si el usuario ya se mueve).
      if (!stillMode && r.index === activeIndex && userMoved && zoneComplete(r.cfg.id)) {
        var next = order[activeIndex + 1];
        if (next && queue.length === 0) enqueueZone(next);
      }
      pump();
    };
    (img.decode ? img.decode() : Promise.resolve()).then(function () { done(true); }, function () { done(false); });
  }

  function nearestLoaded(r, i) {
    if (isKeyframe(r)) return r.kf && r.kf.ok ? 0 : -1;
    if (!r.cfg.ready) return i;
    var n = r.cfg.frames;
    for (var d = 0; d < n; d++) {
      var a = i - d, b = i + d;
      if (a >= 0 && r.state[a] === 2) return a;
      if (b < n && r.state[b] === 2) return b;
    }
    return -1;
  }

  function resolveWaiters() {
    waiters = waiters.filter(function (w) {
      var r = records[w.id];
      var ok = isKeyframe(r) ? nearestLoaded(r, 0) !== -1
        : (!r.cfg.ready || r.state[r.cfg.poster || 0] === 2 || nearestLoaded(r, 0) !== -1);
      if (ok) { clearTimeout(w.timer); w.resolve(); }
      return !ok;
    });
  }

  /* ---------- dibujo ---------- */
  function computeCover(iw, ih) {
    var s = Math.max(cssW / iw, cssH / ih);
    cover.s = s; cover.iw = iw; cover.ih = ih;
    cover.dx = (cssW - iw * s) / 2;
    cover.dy = (cssH - ih * s) / 2;
  }

  /* El <picture> del HTML pinta el primer fotograma (LCP, sin JS). Cuando el
     canvas ya dibuja lo mismo, el póster se retira para no duplicar capas. */
  function hidePoster(r) {
    r.posterHidden = true;
    var el = document.querySelector('[data-poster="' + r.cfg.id + '"]');
    if (el) requestAnimationFrame(function () { el.style.opacity = '0'; el.style.visibility = 'hidden'; });
  }

  /* Cámara del modo keyframe: la pide el script de la zona (camera(p, vista)),
     que devuelve { z, ox, oy }. Sin script o con fotogramas reales: identidad. */
  function updateCamera(r) {
    cam.cx = cssW / 2; cam.cy = cssH / 2;
    cam.z = 1; cam.ox = cam.cx; cam.oy = cam.cy; cam.on = false;
    if (!isKeyframe(r)) return;
    var script = EV.zoneScripts && EV.zoneScripts[r.cfg.id];
    if (!script || !script.camera) return;
    var c = script.camera(want.p, { w: cssW, h: cssH, cover: cover, variant: variant, toScreen: baseToScreen });
    if (!c) return;
    cam.z = Math.max(1, c.z);
    // Nunca enseñar fuera de la imagen: el encuadre visible queda dentro del cover.
    var hx = cam.cx / cam.z, hy = cam.cy / cam.z;
    var W = cover.iw * cover.s, H = cover.ih * cover.s;
    cam.ox = clamp(c.ox, cover.dx + hx, cover.dx + W - hx);
    cam.oy = clamp(c.oy, cover.dy + hy, cover.dy + H - hy);
    cam.on = true;
  }
  // Imagen normalizada → pantalla SIN cámara (para que la zona calcule su encuadre).
  function baseToScreen(nx, ny) { return [cover.dx + nx * cover.iw * cover.s, cover.dy + ny * cover.ih * cover.s]; }

  function draw() {
    var r = records[want.id];
    if (!r || !cssW) return;
    var n = r.cfg.frames;
    var target = clamp(Math.round(want.f), 0, n - 1);
    var frame = nearestLoaded(r, target);
    if (frame !== -1 && isKeyframe(r)) {
      computeCover(r.kf.img.naturalWidth, r.kf.img.naturalHeight);
      updateCamera(r);
    }
    var key = want.id + ':' + frame + ':' + cssW + 'x' + cssH + ':' + variant +
      (cam.on ? ':' + cam.z.toFixed(4) + ',' + cam.ox.toFixed(1) + ',' + cam.oy.toFixed(1) : '');
    if (!dirty && key === drawn.key) return;
    dirty = false;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (frame === -1) {
      // Nada cargado aún: navy liso. drawn.frame = -1 para que las capas lo sepan.
      ctx.fillStyle = '#080b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawn.id = want.id; drawn.frame = -1; drawn.key = key;
      return;
    }

    if (isKeyframe(r)) {
      // Recorta del origen solo lo visible tras cover + cámara: nítido y barato.
      var kimg = r.kf.img, s = cover.s * cam.z;
      var sx = (cam.ox - cam.cx / cam.z - cover.dx) / cover.s;
      var sy = (cam.oy - cam.cy / cam.z - cover.dy) / cover.s;
      var sw = cssW / s, sh = cssH / s;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(kimg, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      if (!r.posterHidden) hidePoster(r);
    } else if (r.cfg.ready) {
      cam.on = false; cam.z = 1; cam.ox = cam.cx = cssW / 2; cam.oy = cam.cy = cssH / 2;
      var img = r.images[frame];
      computeCover(img.naturalWidth, img.naturalHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, cover.dx * dpr, cover.dy * dpr, cover.iw * cover.s * dpr, cover.ih * cover.s * dpr);
    } else {
      cam.on = false; cam.z = 1; cam.ox = cam.cx = cssW / 2; cam.oy = cam.cy = cssH / 2;
      var v = EV.manifest.variants[variant];
      computeCover(v.w, v.h);
      ctx.fillStyle = '#080b14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(cover.s * dpr, 0, 0, cover.s * dpr, cover.dx * dpr, cover.dy * dpr);
      EV.placeholder.draw(ctx, r.cfg, frame, n, v.w, v.h, r.index);
      // Rótulos en espacio de PANTALLA: nunca los recorta el cover.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      EV.placeholder.label(ctx, r.cfg, frame, n, r.index, cssW, cssH);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    drawn.id = want.id; drawn.frame = frame; drawn.key = key;
  }

  /* ---------- luminancia del fotograma (para los scrims) ----------
     Rejilla pequeña (48×27 o 27×48) por fotograma, calculada desde la
     imagen de origen —nunca leyendo el canvas grande— y cacheada. */
  var SRGB_LIN = new Float32Array(256);
  for (var li = 0; li < 256; li++) {
    var c = li / 255;
    SRGB_LIN[li] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  var lumaCanvas = null, lumaCtx = null;

  function lumaGrid(r, frame) {
    if (!r.luma || r.luma.variant !== variant) r.luma = { variant: variant, frames: {} };
    var hit = r.luma.frames[frame];
    if (hit) return hit;
    if (!lumaCanvas) {
      lumaCanvas = document.createElement('canvas');
      lumaCtx = lumaCanvas.getContext('2d', { willReadFrequently: true });
    }
    var portrait = variant === 'mobile';
    var gw = portrait ? 27 : 48, gh = portrait ? 48 : 27;
    lumaCanvas.width = gw; lumaCanvas.height = gh;
    lumaCtx.setTransform(1, 0, 0, 1, 0, 0);
    if (isKeyframe(r)) {
      if (!r.kf || !r.kf.ok) return null;
      lumaCtx.drawImage(r.kf.img, 0, 0, gw, gh);
    } else if (r.cfg.ready) {
      var img = r.images[frame];
      if (!img) return null;
      lumaCtx.drawImage(img, 0, 0, gw, gh);
    } else {
      var v = EV.manifest.variants[variant];
      lumaCtx.fillStyle = '#080b14';
      lumaCtx.fillRect(0, 0, gw, gh);
      lumaCtx.setTransform(gw / v.w, 0, 0, gh / v.h, 0, 0);
      EV.placeholder.draw(lumaCtx, r.cfg, frame, r.cfg.frames, v.w, v.h, r.index);
      lumaCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
    var d = lumaCtx.getImageData(0, 0, gw, gh).data;
    var arr = new Float32Array(gw * gh);
    for (var p = 0, q = 0; q < arr.length; p += 4, q++) {
      arr[q] = 0.2126 * SRGB_LIN[d[p]] + 0.7152 * SRGB_LIN[d[p + 1]] + 0.0722 * SRGB_LIN[d[p + 2]];
    }
    return (r.luma.frames[frame] = { gw: gw, gh: gh, arr: arr });
  }

  /* ---------- API pública ---------- */
  EV.sequence = {
    init: function (el) {
      canvas = el;
      ctx = canvas.getContext('2d', { alpha: false });
      stillMode = EV.mode === 'still';
      variant = pickVariant();
      // Formato que el navegador ya eligió para el póster (AVIF si lo soporta).
      var pimg = document.querySelector('[data-poster] img');
      this.imageExt = pimg && /\.webp(\?|$)/.test(pimg.currentSrc || '') ? 'webp' : 'avif';
      EV.manifest.zones.forEach(function (cfg, index) {
        records[cfg.id] = { cfg: cfg, index: index, gen: 0, images: new Array(cfg.frames), state: new Uint8Array(cfg.frames) };
        order.push(cfg.id);
      });
      want.id = order[0];
      resize();
      plan(); // al entrar: solo la zona 1
      window.addEventListener('resize', resize);
      var onMove = function () {
        if (userMoved) return;
        userMoved = true;
        window.removeEventListener('wheel', onMove);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('keydown', onMove);
        window.removeEventListener('scroll', onMove);
        plan();
      };
      window.addEventListener('wheel', onMove, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('keydown', onMove);
      window.addEventListener('scroll', onMove, { passive: true });
    },

    /* La zona activa cambió (desde zones.js). */
    setActive: function (id) {
      var idx = order.indexOf(id);
      if (idx === -1 || idx === activeIndex && want.id === id) return;
      activeIndex = idx;
      plan();
    },

    /* Progreso 0–1 de una zona → fotograma (llamado en el tick). */
    set: function (id, progress) {
      var r = records[id];
      if (!r) return;
      var f = progress * (r.cfg.frames - 1);
      if (want.id !== id || want.f !== f || want.p !== progress) { want.id = id; want.f = f; want.p = progress; }
    },

    /* Modo fijo: muestra el póster de la zona. */
    showStill: function (id) {
      var r = records[id];
      if (!r) return;
      this.setActive(id);
      want.id = id; want.f = r.cfg.poster || 0; want.p = 0;
      dirty = true;
    },

    render: function () { draw(); },
    invalidate: function () { dirty = true; },

    /* Resuelve cuando la zona tiene al menos un fotograma que dibujar (o timeout). */
    whenReady: function (id, timeout) {
      return new Promise(function (resolve) {
        var w = { id: id, resolve: resolve, timer: setTimeout(function () { resolve(); }, timeout || 800) };
        waiters.push(w);
        resolveWaiters();
      });
    },

    /* Lo realmente dibujado: las capas HTML se sincronizan con esto. */
    drawn: function () { return drawn; },
    wanted: function () { return want; },
    variant: function () { return variant; },
    coverTransform: function () { return cover; },

    /* Luminancia relativa media (0–1, lineal) del fotograma DIBUJADO bajo un
       rectángulo de pantalla en px CSS. null si aún no hay nada dibujado. */
    luminanceUnder: function (rect) {
      var r = records[drawn.id];
      if (!r || drawn.frame < 0) return null;
      var g = lumaGrid(r, drawn.frame);
      if (!g) return null;
      // La cámara es escala + traslación: el rectángulo sigue siendo un rectángulo.
      var a = EV.sequence.screenToImage(rect.left, rect.top);
      var b = EV.sequence.screenToImage(rect.left + rect.width, rect.top + rect.height);
      var x0 = Math.floor(clamp(a[0], 0, 1) * g.gw);
      var x1 = Math.ceil(clamp(b[0], 0, 1) * g.gw);
      var y0 = Math.floor(clamp(a[1], 0, 1) * g.gh);
      var y1 = Math.ceil(clamp(b[1], 0, 1) * g.gh);
      var sum = 0, n = 0;
      for (var y = y0; y < Math.max(y1, y0 + 1) && y < g.gh; y++) {
        for (var x = x0; x < Math.max(x1, x0 + 1) && x < g.gw; x++) { sum += g.arr[y * g.gw + x]; n++; }
      }
      return n ? sum / n : null;
    },

    /* Coordenadas normalizadas de la imagen (0–1) → px CSS del viewport. */
    imageToScreen: function (nx, ny) {
      var X = cover.dx + nx * cover.iw * cover.s, Y = cover.dy + ny * cover.ih * cover.s;
      if (!cam.on) return [X, Y];
      return [cam.cx + (X - cam.ox) * cam.z, cam.cy + (Y - cam.oy) * cam.z];
    },
    /* Inversa: px CSS del viewport → coordenadas normalizadas de la imagen. */
    screenToImage: function (X, Y) {
      if (cam.on) { X = cam.ox + (X - cam.cx) / cam.z; Y = cam.oy + (Y - cam.cy) / cam.z; }
      return [(X - cover.dx) / (cover.iw * cover.s), (Y - cover.dy) / (cover.ih * cover.s)];
    },
    camera: function () { return cam; },

    /* Diagnóstico para QA. */
    debug: function () {
      var out = {};
      order.forEach(function (id) {
        var r = records[id], loaded = 0, requested = 0;
        for (var i = 0; i < r.state.length; i++) { if (r.state[i] === 2) loaded++; if (r.state[i] === 1) requested++; }
        out[id] = { ready: r.cfg.ready, loaded: loaded, requested: requested, frames: r.cfg.frames };
      });
      return { variant: variant, active: order[activeIndex], userMoved: userMoved, queue: queue.length, inflight: inflight, zones: out, drawn: Object.assign({}, drawn) };
    }
  };

  /* ==========================================================================
     Placeholder: fondo navy, pasillo en perspectiva que avanza con el
     fotograma (para sentir el ritmo de la cámara), y número de zona y fotograma.
     Se dibuja en espacio de imagen (iw × ih), el cover lo aplica el motor.
     ========================================================================== */
  EV.placeholder = {
    draw: function (ctx, cfg, frame, n, iw, ih, zoneIndex) {
      var t = n > 1 ? frame / (n - 1) : 0;
      var vx = iw * 0.5, vy = ih * 0.46;
      var halfW = iw * 0.46, halfH = ih * 0.44;
      var DOORS = 9;
      var travel = 3.5 * t + zoneIndex * 3.5; // continuo entre zonas

      ctx.lineWidth = Math.max(iw, ih) / 1200;

      // fugas
      ctx.strokeStyle = 'rgba(233,227,216,0.10)';
      ctx.beginPath();
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) {
        ctx.moveTo(vx + c[0] * halfW * 3, vy + c[1] * halfH * 3);
        ctx.lineTo(vx, vy);
      });
      ctx.stroke();

      // marcos de puerta que se acercan
      for (var k = 0; k < DOORS; k++) {
        var z = ((k - travel) % DOORS + DOORS) % DOORS + 0.35;
        var sc = 1 / z;
        var a = Math.max(0, Math.min(1, (DOORS - z) / DOORS)) * 0.42;
        ctx.strokeStyle = 'rgba(233,227,216,' + a.toFixed(3) + ')';
        ctx.strokeRect(vx - halfW * sc, vy - halfH * sc, halfW * 2 * sc, halfH * 2 * sc);
      }

      // extra de la zona (p. ej. una pantalla para probar screenQuad)
      var script = EV.zoneScripts && EV.zoneScripts[cfg.id];
      if (script && script.placeholder) script.placeholder(ctx, t, frame, iw, ih);

    },

    /* Rótulos de prueba en px CSS, arriba a la izquierda bajo la cabecera,
       lejos de los titulares (que viven abajo). */
    label: function (ctx, cfg, frame, n, zoneIndex, w, h) {
      var mobile = w < 768;
      var x = mobile ? 16 : 40;
      var y = (mobile ? 60 : 76) + 22;
      var num = String(zoneIndex + 1).padStart(2, '0');
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(233,227,216,0.62)';
      ctx.font = '500 11px "Schibsted Grotesk", sans-serif';
      ctx.fillText('ZONA ' + num + ' · ' + cfg.label.toUpperCase() + ' · PLACEHOLDER', x, y);
      ctx.fillStyle = 'rgba(233,227,216,0.42)';
      ctx.font = '11px "Schibsted Grotesk", sans-serif';
      ctx.fillText('fotograma ' + pad(frame + 1) + ' / ' + pad(n), x, y + 17);
    }
  };
})();
