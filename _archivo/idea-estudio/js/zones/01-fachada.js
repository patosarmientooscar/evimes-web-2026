/* ==========================================================================
   Zona 01 — Fachada. Foto fija 4K + cámara en código. Sin vídeo.

   Todo lo que pertenece a la fachada vive en UN contenedor (.fachada-cam)
   que la cámara mueve con una sola transformación (translate + scale):
   foto, letras EVIMES, hueco de la ventana, hojas y barandilla. Así las
   letras y las hojas siguen la imagen exactamente, sin desfase posible.

   Scroll (progreso suavizado con lerp, independiente del frame rate):
     0–20 %   el texto se retira; el edificio "respira" (scale 1 → 1.02)
     20–70 %  dolly-in hacia la ventana encendida (power2.inOut)
     70–90 %  la ventana se abre de verdad: las dos hojas (recortadas de la
              foto) giran sobre su bisagra en 3D; detrás, el interior
     90–100 % la cámara cruza el hueco y se funde con la zona siguiente
   Movimiento reducido / modo fijo: la ventana ya abierta, sin cámara.

   ?ajustar=letras  · 4 esquinas de las letras
   ?ajustar=ventana · las dos hojas (4 puntos), sus bisagras y el pasamanos
   ========================================================================== */
(function () {
  var EV = window.EV;
  var ID = 'fachada';
  var CONF = window.EVIMES_CONFIG || {};
  var CFG = CONF.fachada || {};
  var LOGO = CONF.logo && CONF.logo.fachada;
  var PARAM = new URLSearchParams(location.search).get('ajustar');
  var ROOT = 'assets/zones/01-fachada/';
  var OPEN_DEG = 80;            // giro final de las hojas (75–85°)
  var STAGGER = 0.08;           // retraso de la hoja derecha (fracción de la apertura)
  var LERP_TAU = 0.11;          // s: constante del suavizado del scroll
  var NATIVE = { desktop: [2560, 1434], mobile: [1080, 1930] };

  var U = EV.util;
  function sine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  function p2io(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function p2o(t) { return 1 - (1 - t) * (1 - t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function variant() { return EV.stage.variant(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- estado ---------- */
  var cam = null;               // contenedor
  var el = {};                  // capas
  var view = { W: 0, H: 0, iw: 0, ih: 0, cw: 0, ch: 0, left: 0, top: 0 };
  var C = { z: 1, ox: 0, oy: 0 };   // cámara: punto (px base) en el centro de pantalla y zoom
  var ps = 0, lastT = 0;
  var key = '';
  var built = false, hdReady = false, interiorReady = false;
  var adjust = { letras: null, ventana: null };
  var parts = null;             // letras
  var luma = null;              // brillo de la foto (scrim)
  var still = EV.mode !== 'cine';
  var w = {};

  function letrasCfg() {
    var v = variant();
    if (adjust.letras) return adjust.letras.state(v).c;
    return (CFG.letras && (CFG.letras[v] || CFG.letras.desktop));
  }
  function ventanaCfg() {
    var v = variant();
    if (adjust.ventana) return adjust.ventana.state(v);
    return CFG.ventana[v] || CFG.ventana.desktop;
  }

  /* ---------- geometría base (cover centrado) ---------- */
  function measure() {
    var sc = EV.stage.canvas();
    view.W = window.innerWidth;
    view.H = (sc && sc.clientHeight) || window.innerHeight;
    var n = NATIVE[variant()];
    view.iw = n[0]; view.ih = n[1];
    var k = Math.max(view.W / view.iw, view.H / view.ih);
    view.cw = view.iw * k; view.ch = view.ih * k;
    view.left = (view.W - view.cw) / 2; view.top = (view.H - view.ch) / 2;
    cam.style.width = view.cw.toFixed(2) + 'px';
    cam.style.height = view.ch.toFixed(2) + 'px';
  }

  // imagen (0–1) → px locales del contenedor
  function L(u, v) { return [u * view.cw, v * view.ch]; }
  // imagen → pantalla con la cámara actual (y al revés)
  function imageToScreen(u, v) {
    var cx = view.W / 2, cy = view.H / 2;
    return [cx + (view.left + u * view.cw - C.ox) * C.z, cy + (view.top + v * view.ch - C.oy) * C.z];
  }
  function screenToImage(x, y) {
    var cx = view.W / 2, cy = view.H / 2;
    return [((x - cx) / C.z + C.ox - view.left) / view.cw, ((y - cy) / C.z + C.oy - view.top) / view.ch];
  }

  /* Rectángulos de la ventana en px base de pantalla. */
  function holeRects() {
    var V = ventanaCfg();
    var pts = V.izquierda.puntos.concat(V.derecha.puntos);
    var u0 = 1, u1 = 0, v0 = 1, v1 = 0;
    pts.forEach(function (p) { u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); });
    var rail = V.barandaPt ? V.barandaPt[1] : V.baranda;
    function R(a, b, c, d) {
      var x0 = view.left + a * view.cw, x1 = view.left + c * view.cw, y0 = view.top + b * view.ch, y1 = view.top + d * view.ch;
      return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
    }
    return { hole: R(u0, v0, u1, v1), open: R(u0, v0, u1, Math.min(v1, rail)), uv: [u0, v0, u1, v1], rail: rail };
  }

  /* ---------- cámara ---------- */
  function cameraAt(p) {
    var W = view.W, H = view.H, cx = W / 2, cy = H / 2;
    var r = holeRects(), hb = r.hole, op = r.open;
    var z0 = 1.02;
    // 70 %: la ventana entera (con barandilla) encuadrada.
    var z1 = Math.max(z0 * 1.2, Math.min(H * 0.84 / hb.h, W * 0.5 / hb.w));
    // 90 %: el hueco abierto (sobre el pasamanos) llena la pantalla.
    var zF = Math.max(W / op.w, H / op.h) * 1.04;
    var z, ox, oy;

    if (p <= 0.2) {
      z = 1 + 0.02 * sine(U.range(p, 0, 0.2));
      ox = cx; oy = cy;
    } else if (p <= 0.7) {
      var e = p2io(U.range(p, 0.2, 0.7));
      z = Math.exp(lerp(Math.log(z0), Math.log(z1), e));
      // El centro de la ventana viaja en línea recta hacia el centro de pantalla.
      var offX = (hb.cx - cx) * z0 * (1 - e), offY = (hb.cy - cy) * z0 * (1 - e);
      ox = hb.cx - offX / z; oy = hb.cy - offY / z;
    } else {
      var t = U.range(p, 0.7, 1);
      var g;
      if (t <= 2 / 3) g = Math.pow(t * 1.5, 2);                   // acelera hasta llenar (90 %)
      else { var s = (t - 2 / 3) * 3; g = 1 + s - s * s / 2; }      // cruza y frena (misma velocidad en la unión)
      z = Math.exp(Math.log(z1) + (Math.log(zF) - Math.log(z1)) * g);
      var m = sine(Math.min(1, t * 1.5));
      ox = lerp(hb.cx, op.cx, m); oy = lerp(hb.cy, op.cy, m);
    }
    // Nunca se ve fuera de la foto.
    ox = clamp(ox, view.left + cx / z, view.left + view.cw - (W - cx) / z);
    oy = clamp(oy, view.top + cy / z, view.top + view.ch - (H - cy) / z);
    return { z: z, ox: ox, oy: oy, z1: z1 };
  }

  /* Escribe un estilo solo si cambia. */
  function writer(node) {
    var c = {};
    return function (k, v) { if (c[k] !== v) { c[k] = v; node.style[k] = v; } };
  }

  /* ---------- hueco, hojas, barandilla ---------- */
  function srcImage() { return hdReady ? el.hd : el.img; }

  function polyCss(pts, ox, oy, bw, bh) {
    return 'polygon(' + pts.map(function (p) { return ((p[0] - ox) / bw * 100).toFixed(3) + '% ' + ((p[1] - oy) / bh * 100).toFixed(3) + '%'; }).join(',') + ')';
  }

  /* Vidrio de la hoja: al girar, el cristal deja de mostrar el interior de
     la foto (quedaría "pintado") y refleja el cielo de la hora azul. Máscara
     por píxel: el bastidor (claro y casi sin color) se queda; el resto es vidrio. */
  function paintGlass(g, sctx, cw, ch) {
    g.width = cw; g.height = ch;
    var gx = g.getContext('2d', { willReadFrequently: true });
    var sky = gx.createLinearGradient(0, 0, 0, ch);
    // Cielo de la hora azul reflejado: navy apagado, más claro arriba.
    sky.addColorStop(0, 'rgb(74,84,106)');
    sky.addColorStop(0.3, 'rgb(44,51,68)');
    sky.addColorStop(0.65, 'rgb(26,31,44)');
    sky.addColorStop(1, 'rgb(17,20,29)');
    gx.fillStyle = sky;
    gx.fillRect(0, 0, cw, ch);
    try {
      var src = sctx.getImageData(0, 0, cw, ch).data;
      var out = gx.getImageData(0, 0, cw, ch), d = out.data;
      for (var i = 0; i < d.length; i += 4) {
        var r = src[i], gg = src[i + 1], b = src[i + 2];
        var mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        var sat = mx ? (mx - mn) / mx : 0, lum = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
        // bastidor: claro y poco saturado (blanco bajo luz azul o cálida)
        var f = clamp((0.3 - sat) / 0.12, 0, 1) * clamp((lum - 92) / 36, 0, 1);
        d[i + 3] = Math.round((1 - f * f * (3 - 2 * f)) * 255);
      }
      gx.putImageData(out, 0, 0);
    } catch (e) {}
  }

  /* Barandilla separada de la foto: el hierro son trazos finos MUCHO más
     oscuros que su entorno (contraste local con una media en caja), o casi
     negros. Las zonas oscuras anchas del interior no pasan el filtro. */
  function keyRailing(ctx, W, H, srcW) {
    var id = ctx.getImageData(0, 0, W, H), d = id.data, n = W * H;
    var lum = new Float32Array(n);
    for (var i = 0; i < n; i++) lum[i] = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
    // Imagen integral para la media local.
    var S = new Float64Array((W + 1) * (H + 1));
    for (var y = 0; y < H; y++) {
      var row = 0;
      for (var x = 0; x < W; x++) { row += lum[y * W + x]; S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row; }
    }
    var r = Math.max(3, Math.round(srcW * 0.004));
    function sstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
    for (y = 0; y < H; y++) {
      var y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
      for (x = 0; x < W; x++) {
        var x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1);
        var sum = S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0];
        var mean = sum / ((x1 - x0) * (y1 - y0)) + 1;
        var L = lum[y * W + x];
        var rel = sstep((0.7 - L / mean) / 0.22) * sstep((125 - L) / 45);
        var abs = sstep((42 - L) / 18);
        lum[y * W + x] = Math.max(rel, abs);   // reutiliza el búfer como máscara
      }
    }
    // Pluma de 1 px (3×3): bordes de hierro suaves, sin dientes de sierra.
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var s = 0, c = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var yy = y + dy, xx = x + dx;
        if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue;
        s += lum[yy * W + xx]; c++;
      }
      d[(y * W + x) * 4 + 3] = Math.round(Math.max(lum[y * W + x] * 0.6, s / c) * 255);
    }
    ctx.putImageData(id, 0, 0);
  }

  function buildLeaf(node, leaf, which, src, hueco) {
    var sw = src.naturalWidth, sh = src.naturalHeight;
    var pts = leaf.puntos.map(function (p) { return L(p[0], p[1]); });
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    // Recorte a píxeles ENTEROS de la foto: copia 1:1, sin remuestreo, así la
    // capa es idéntica a lo que tapa (invisible hasta que empieza a girar).
    var sx0 = Math.floor(Math.min.apply(null, xs) / view.cw * sw), sx1 = Math.ceil(Math.max.apply(null, xs) / view.cw * sw);
    var sy0 = Math.floor(Math.min.apply(null, ys) / view.ch * sh), sy1 = Math.ceil(Math.max.apply(null, ys) / view.ch * sh);
    var x0 = sx0 / sw * view.cw, y0 = sy0 / sh * view.ch;
    var bw = (sx1 - sx0) / sw * view.cw, bh = (sy1 - sy0) / sh * view.ch;
    var c = node.querySelector('canvas');
    c.width = sx1 - sx0; c.height = sy1 - sy0;
    var cx2 = c.getContext('2d', { willReadFrequently: true });
    cx2.drawImage(src, sx0, sy0, c.width, c.height, 0, 0, c.width, c.height);
    paintGlass(node.querySelector('.hoja__vidrio'), cx2, c.width, c.height);
    node.style.left = (x0 - hueco.x0).toFixed(2) + 'px';
    node.style.top = (y0 - hueco.y0).toFixed(2) + 'px';
    node.style.width = bw.toFixed(2) + 'px';
    node.style.height = bh.toFixed(2) + 'px';
    node.querySelector('.hoja__cara').style.clipPath = polyCss(pts, x0, y0, bw, bh);
    // Bisagra: eje de giro en el plano de la fachada.
    var h = leaf.bisagra.map(function (p) { return L(p[0], p[1]); });
    var ax = h[1][0] - h[0][0], ay = h[1][1] - h[0][1];
    if (ay < 0) { ax = -ax; ay = -ay; }
    var len = Math.hypot(ax, ay) || 1;
    node._axis = [ax / len, ay / len];
    node.style.transformOrigin = (h[0][0] - x0).toFixed(2) + 'px ' + (h[0][1] - y0).toFixed(2) + 'px';
    node._sign = which === 'izquierda' ? 1 : -1;
    // Canto del bastidor en el lado libre: la hoja tiene grosor.
    node.querySelector('.hoja__canto').style.width = Math.max(2, bw * 0.05).toFixed(2) + 'px';
  }

  function buildWindow() {
    if (!el.img || !el.img.naturalWidth) return;
    var V = ventanaCfg(), r = holeRects();
    var src = srcImage();
    var hx0 = r.uv[0] * view.cw, hy0 = r.uv[1] * view.ch, hx1 = r.uv[2] * view.cw, hy1 = r.uv[3] * view.ch;
    var hueco = { x0: hx0, y0: hy0 };

    // Vano: el interior solo se ve dentro de las dos hojas.
    // Un píxel hacia dentro: en la bisagra y en el marco nunca asoma el interior.
    var all = [V.izquierda.puntos[0], V.izquierda.puntos[1], V.derecha.puntos[0], V.derecha.puntos[1], V.derecha.puntos[2], V.derecha.puntos[3], V.izquierda.puntos[2], V.izquierda.puntos[3]];
    var gc = all.reduce(function (m, p) { var q = L(p[0], p[1]); return [m[0] + q[0] / all.length, m[1] + q[1] / all.length]; }, [0, 0]);
    var inset = 1.2;
    el.vano.style.clipPath = 'polygon(' + all.map(function (p) {
      var q = L(p[0], p[1]);
      var dx = gc[0] - q[0], dy = gc[1] - q[1];
      q[0] += Math.sign(dx) * inset; q[1] += Math.sign(dy) * inset;
      return q[0].toFixed(2) + 'px ' + q[1].toFixed(2) + 'px';
    }).join(',') + ')';

    // Hueco con perspectiva: el punto de fuga es el centro del vano abierto.
    var railY = r.rail * view.ch;
    el.hueco.style.left = hx0.toFixed(2) + 'px';
    el.hueco.style.top = hy0.toFixed(2) + 'px';
    el.hueco.style.width = (hx1 - hx0).toFixed(2) + 'px';
    el.hueco.style.height = (hy1 - hy0).toFixed(2) + 'px';
    el.hueco.style.perspective = ((hx1 - hx0) * 2.4).toFixed(1) + 'px';
    el.hueco.style.perspectiveOrigin = ((hx1 - hx0) / 2).toFixed(1) + 'px ' + ((Math.min(railY, hy1) - hy0) / 2).toFixed(1) + 'px';
    buildLeaf(el.hojaI, V.izquierda, 'izquierda', src, hueco);
    buildLeaf(el.hojaD, V.derecha, 'derecha', src, hueco);

    // Barandilla: queda delante y quieta. Se separa de la foto por su
    // oscuridad (hierro casi negro sobre un interior encendido).
    var sw = src.naturalWidth, sh = src.naturalHeight;
    var by0 = Math.max(hy0, railY - view.ch * 0.0015);
    var bc = el.baranda;
    var bx0 = Math.floor(hx0 / view.cw * sw), bx1 = Math.ceil(hx1 / view.cw * sw);
    var bsy0 = Math.floor(by0 / view.ch * sh), bsy1 = Math.ceil(hy1 / view.ch * sh);
    bc.width = bx1 - bx0; bc.height = bsy1 - bsy0;
    var ctx = bc.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, bc.width, bc.height);
    ctx.drawImage(src, bx0, bsy0, bc.width, bc.height, 0, 0, bc.width, bc.height);
    try { keyRailing(ctx, bc.width, bc.height, sw); } catch (e) { ctx.clearRect(0, 0, bc.width, bc.height); }
    bc.style.left = (bx0 / sw * view.cw).toFixed(3) + 'px';
    bc.style.top = (bsy0 / sh * view.ch).toFixed(3) + 'px';
    bc.style.width = (bc.width / sw * view.cw).toFixed(3) + 'px';
    bc.style.height = (bc.height / sh * view.ch).toFixed(3) + 'px';

    // Luz cálida que se derrama sobre la piedra al abrir.
    var dw = (hx1 - hx0) * 3.2, dh = (hy1 - hy0) * 1.6;
    el.derrame.style.width = dw.toFixed(1) + 'px';
    el.derrame.style.height = dh.toFixed(1) + 'px';
    el.derrame.style.left = ((hx0 + hx1) / 2 - dw / 2).toFixed(1) + 'px';
    el.derrame.style.top = ((hy0 + hy1) / 2 - dh / 2).toFixed(1) + 'px';
    built = true;
  }

  /* Interior: parallax de profundidad (crece más despacio que la fachada)
     y siempre cubre la parte visible del vano. */
  function placeInterior(st) {
    if (!interiorReady) return;
    var r = holeRects(), op = r.open, hb = r.hole;
    var nI = el.interior._n;               // tamaño del interior en px locales a escala 1
    var F = (CFG.interior && CFG.interior.foco) || [0.5, 0.5];
    var cx = view.W / 2, cy = view.H / 2;
    var Lc = [op.cx - view.left, op.cy - view.top];  // el punto de fuga va al centro del vano abierto
    var base = (hb.h * 1.18) / nI[1];
    var sl = base * Math.pow(st.z / st.z1, -0.5);    // la fachada crece z; el interior, z^0.5
    // parte visible del vano (px locales)
    var vx0 = Math.max(hb.x0, (0 - cx) / st.z + st.ox) - view.left, vx1 = Math.min(hb.x1, (view.W - cx) / st.z + st.ox) - view.left;
    var vy0 = Math.max(hb.y0, (0 - cy) / st.z + st.oy) - view.top, vy1 = Math.min(hb.y1, (view.H - cy) / st.z + st.oy) - view.top;
    var fx = F[0] * nI[0], fy = F[1] * nI[1];
    var need = Math.max((Lc[0] - vx0) / fx, (vx1 - Lc[0]) / (nI[0] - fx), (Lc[1] - vy0) / fy, (vy1 - Lc[1]) / (nI[1] - fy), 0) * 1.01;
    var s = Math.pow(Math.pow(sl, 8) + Math.pow(need, 8), 1 / 8);   // máximo suave: sin quiebros
    var tf = 'translate3d(' + (Lc[0] - fx * s).toFixed(2) + 'px,' + (Lc[1] - fy * s).toFixed(2) + 'px,0) scale(' + s.toFixed(5) + ')';
    w.int('transform', tf);
    w.intB('transform', tf);
  }

  /* ---------- letras (dentro del contenedor: siguen a la foto sin desfase) ---------- */
  var HALO_PAD = 420, HALO_RES = 0.5;
  function paintHalo(svg) {
    var vb = (svg.getAttribute('viewBox') || '0 0 1442 261').split(/[\s,]+/).map(Number);
    var W = vb[2], H = vb[3];
    var c = document.createElement('canvas');
    c.width = Math.round((W + HALO_PAD * 2) * HALO_RES); c.height = Math.round((H + HALO_PAD * 2) * HALO_RES);
    c.style.left = (-HALO_PAD) + 'px'; c.style.top = (-HALO_PAD) + 'px';
    c.style.width = (W + HALO_PAD * 2) + 'px'; c.style.height = (H + HALO_PAD * 2) + 'px';
    var ctx = c.getContext('2d');
    var paths = Array.prototype.map.call(svg.querySelectorAll('path'), function (p) { return new Path2D(p.getAttribute('d')); });
    ctx.setTransform(HALO_RES, 0, 0, HALO_RES, (HALO_PAD - vb[0]) * HALO_RES, (HALO_PAD - vb[1]) * HALO_RES);
    // Del halo ancho y tenue al núcleo pegado a la letra; las capas se suman, como la luz.
    ctx.globalCompositeOperation = 'lighter';
    [[300, 0.5], [300, 0.5], [300, 0.5], [160, 0.6], [160, 0.6], [70, 0.7], [30, 0.9], [12, 1], [12, 1], [4, 1]].forEach(function (g) {
      ctx.shadowColor = 'rgba(0,229,255,' + g[1] + ')';
      ctx.shadowBlur = g[0] * HALO_RES;
      ctx.fillStyle = 'rgba(0,229,255,' + g[1] + ')';
      paths.forEach(function (p) { ctx.fill(p, 'evenodd'); });
    });
    return c;
  }

  function buildLetters(svg) {
    function layer(cls) {
      var d = document.createElement('div');
      d.className = 'letras ' + cls;
      d.setAttribute('aria-hidden', 'true');
      return d;
    }
    var halo = layer('letras--halo');
    var luz = document.createElement('div');
    luz.className = 'letras__luz';
    luz.appendChild(paintHalo(svg));
    halo.appendChild(luz);
    var cara = layer('letras--cara');
    cara.appendChild(svg.cloneNode(true));
    cam.appendChild(halo);
    cam.appendChild(cara);
    return { halo: halo, luz: luz, cara: cara };
  }

  function placeLetters() {
    if (!parts) return;
    var q = letrasCfg().map(function (c) { return L(c[0], c[1]); });
    var m = EV.overlay.quadMatrix(1442, 261, q);
    if (!m) return;
    parts.halo.style.transform = m;
    parts.cara.style.transform = m;
    parts.halo.style.opacity = '1';
    parts.cara.style.opacity = '1';
  }

  function ignite(luz) {
    if (EV.reducedMotion || PARAM) { luz.style.opacity = '1'; return; }
    gsap.timeline({ delay: 0.35 })
      .set(luz, { opacity: 0 })
      .to(luz, { opacity: 0.5, duration: 0.05, ease: 'none' })
      .to(luz, { opacity: 0.06, duration: 0.07, ease: 'none' })
      .to(luz, { opacity: 0.78, duration: 0.04, ease: 'none' }, '+=0.11')
      .to(luz, { opacity: 0.22, duration: 0.05, ease: 'none' }, '+=0.03')
      .to(luz, { opacity: 1, duration: 0.32, ease: 'power2.out' }, '+=0.08');
  }

  /* ---------- brillo de la foto bajo un texto (scrim AA) ---------- */
  function buildLuma() {
    try {
      var gw = 64, gh = Math.round(64 * view.ih / view.iw);
      var c = document.createElement('canvas'); c.width = gw; c.height = gh;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(el.img, 0, 0, gw, gh);
      var d = x.getImageData(0, 0, gw, gh).data, g = new Float32Array(gw * gh);
      var lin = function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      for (var i = 0; i < gw * gh; i++) g[i] = 0.2126 * lin(d[i * 4]) + 0.7152 * lin(d[i * 4 + 1]) + 0.0722 * lin(d[i * 4 + 2]);
      luma = { w: gw, h: gh, g: g };
    } catch (e) { luma = null; }
  }
  function luminanceUnder(rect) {
    if (!luma) return null;
    var a = screenToImage(rect.left, rect.top), b = screenToImage(rect.right, rect.bottom);
    var x0 = clamp(Math.floor(a[0] * luma.w), 0, luma.w - 1), x1 = clamp(Math.ceil(b[0] * luma.w), 0, luma.w - 1);
    var y0 = clamp(Math.floor(a[1] * luma.h), 0, luma.h - 1), y1 = clamp(Math.ceil(b[1] * luma.h), 0, luma.h - 1);
    var s = 0, n = 0;
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { s += luma.g[y * luma.w + x]; n++; }
    return n ? s / n : null;
  }

  /* ---------- carga del interior y de la foto HD ---------- */
  function loadInterior() {
    if (el.interior._loading) return;
    el.interior._loading = true;
    var big = variant() === 'desktop' ? 2560 : 1280;
    var pic = document.createElement('picture');
    pic.innerHTML = '<source type="image/avif" srcset="' + ROOT + 'interior-' + big + '.avif"><source type="image/webp" srcset="' + ROOT + 'interior-' + big + '.webp">';
    var img = new Image();
    img.alt = '';
    img.decoding = 'async';
    pic.appendChild(img);
    img.addEventListener('load', function () {
      (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
        var nw = 1000, nh = 1000 * img.naturalHeight / img.naturalWidth;
        el.interior._n = [nw, nh];
        img.style.width = nw + 'px'; img.style.height = nh + 'px';
        // Desenfoque de profundidad: pintado UNA vez (reducir y ampliar), sin filtros en vivo.
        var c1 = document.createElement('canvas'); c1.width = 168; c1.height = Math.round(168 * nh / nw);
        var c2 = document.createElement('canvas'); c2.width = 84; c2.height = Math.round(84 * nh / nw);
        var x1 = c1.getContext('2d'); x1.imageSmoothingQuality = 'high'; x1.drawImage(img, 0, 0, c1.width, c1.height);
        c2.getContext('2d').drawImage(c1, 0, 0, c2.width, c2.height);
        var cb = document.createElement('canvas'); cb.width = 336; cb.height = Math.round(336 * nh / nw);
        var xb = cb.getContext('2d'); xb.imageSmoothingQuality = 'high'; xb.drawImage(c2, 0, 0, cb.width, cb.height);
        cb.style.width = nw + 'px'; cb.style.height = nh + 'px';
        el.interiorB.appendChild(cb);
        interiorReady = true;
        key = '';
        apply(ps);
      });
    }, { once: true });
    el.interior.appendChild(pic);
    img.src = ROOT + 'interior-' + big + '.webp';
  }

  function loadHd() {
    if (variant() !== 'desktop' || el.hd._loading) return;
    el.hd._loading = true;
    var img = el.hd;
    img.addEventListener('load', function () {
      (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
        hdReady = true;
        img.style.opacity = '1';
        buildWindow();   // las hojas y la barandilla pasan a recortarse de la 4K
      });
    }, { once: true });
    img.src = ROOT + 'desktop/keyframe-4096.avif';
  }

  /* ---------- render ---------- */
  function apply(p) {
    if (!view.W) return;
    var st = still ? { z: 1, ox: view.W / 2, oy: view.H / 2, z1: 1 } : cameraAt(p);
    C.z = st.z; C.ox = st.ox; C.oy = st.oy;
    var cx = view.W / 2, cy = view.H / 2;
    var tx = cx + (view.left - st.ox) * st.z, ty = cy + (view.top - st.oy) * st.z;
    w.cam('transform', 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + st.z.toFixed(5) + ')');

    // Apertura: la izquierda primero, la derecha con un leve retraso.
    var o = still ? 1 : U.range(p, 0.7, 0.9);
    var aI = OPEN_DEG * p2io(U.range(o, 0, 1 - STAGGER));
    var aD = OPEN_DEG * p2io(U.range(o, STAGGER, 1));
    var opening = built && (aI > 0.01 || aD > 0.01);
    var vis = opening ? '1' : '0';
    w.vano('opacity', vis); w.hueco('opacity', vis); w.bar('opacity', vis);
    if (opening) {
      [[el.hojaI, aI, w.hI, w.hIr, w.hIs, w.hIv], [el.hojaD, aD, w.hD, w.hDr, w.hDs, w.hDv]].forEach(function (h) {
        var n = h[0], a = h[1], sn = Math.sin(a * Math.PI / 180);
        h[2]('transform', 'rotate3d(' + n._axis[0].toFixed(4) + ',' + n._axis[1].toFixed(4) + ',0,' + (n._sign * a).toFixed(3) + 'deg)');
        h[3]('opacity', (0.03 + 0.12 * sn).toFixed(3));   // brillo del cristal: crece al girar (Fresnel)
        h[4]('opacity', (0.26 * sn).toFixed(3));          // deja de recibir la luz de la calle
        h[5]('opacity', (0.8 * Math.pow(sn, 1.6)).toFixed(3));    // el vidrio pasa a reflejar el cielo
      });
      if (!interiorReady) loadInterior();
    }
    var lit = (aI + aD) / (2 * OPEN_DEG);
    w.luz('opacity', (0.5 * lit).toFixed(3));
    w.derr('opacity', (0.55 * lit).toFixed(3));
    placeInterior(st);

    // Cruce: desenfoque mínimo de profundidad y fundido a la zona siguiente.
    var blur = still ? 0 : sine(U.range(p, 0.88, 0.97));
    w.intBo('opacity', blur.toFixed(3));
    var fade = still ? 0 : p2o(U.range(p, 0.93, 1));
    w.camO('opacity', (1 - fade).toFixed(3));

    key = st.z.toFixed(3) + ',' + st.ox.toFixed(0) + ',' + st.oy.toFixed(0);
  }

  function render(p, active) {
    if (!cam || !view.W) return;
    var now = performance.now();
    var dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0;
    lastT = now;
    if (!active || still) { ps = p; if (!active) return; }
    else ps += (p - ps) * (1 - Math.exp(-dt / LERP_TAU));
    if (Math.abs(p - ps) < 1e-5) ps = p;
    apply(ps);
    if (el.copy && !still) {
      w.copyO('opacity', (1 - U.range(ps, 0.02, 0.18)).toFixed(3));
      w.copyT('transform', 'translate3d(0,' + (-U.range(ps, 0, 0.2) * 24).toFixed(2) + 'px,0)');
    }
  }

  function relayout() {
    measure();
    buildWindow();
    placeLetters();
    apply(ps);
  }

  /* ---------- "Entra": viaje hasta el pasillo ---------- */
  function wireEnter(stage) {
    var link = stage.querySelector('.entra');
    if (!link) return;
    link.addEventListener('click', function (e) {
      var next = document.getElementById('zona-pasillo');
      if (!next) return;
      e.preventDefault();
      if (EV.scroll.lenis) {
        var st = EV.zones.get(ID).st;
        EV.scroll.lenis.scrollTo(st.end + 2, { duration: 4.6, easing: sine });
      } else {
        next.scrollIntoView({ behavior: EV.reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  /* ---------- herramientas de ajuste ---------- */
  function fmt(p) { return '[' + p[0].toFixed(4) + ', ' + p[1].toFixed(4) + ']'; }
  function adjustTools() {
    var toScreen = function (p) { return imageToScreen(p[0], p[1]); };
    if (PARAM === 'letras') {
      adjust.letras = EV.ajuste.puntos({
        id: 'letras', titulo: 'Letras',
        base: function (v) { return { c: clone(CFG.letras[v] || CFG.letras.desktop) }; },
        refs: function (s) { return s.c.map(function (p, i) { return { p: p, label: ['Superior izquierda', 'Superior derecha', 'Inferior derecha', 'Inferior izquierda'][i] }; }); },
        shapes: function (s) { return [{ pts: s.c, closed: true }]; },
        format: function (s, v) { return v + ': [' + s.c.map(fmt).join(', ') + ']'; },
        toScreen: toScreen, toImage: screenToImage,
        onChange: placeLetters
      });
      placeLetters();
    }
    if (PARAM === 'ventana') {
      var raf = 0;
      adjust.ventana = EV.ajuste.puntos({
        id: 'ventana', titulo: 'Ventana',
        base: function (v) {
          var s = clone(CFG.ventana[v] || CFG.ventana.desktop);
          var a = s.izquierda.puntos[3], b = s.derecha.puntos[2];
          s.barandaPt = [(a[0] + b[0]) / 2, s.baranda];
          return s;
        },
        refs: function (s) {
          var out = [];
          [['izquierda', 'Hoja izquierda'], ['derecha', 'Hoja derecha']].forEach(function (k) {
            s[k[0]].puntos.forEach(function (p, i) { out.push({ p: p, label: k[1] + ', ' + ['sup-izq', 'sup-der', 'inf-der', 'inf-izq'][i] }); });
            s[k[0]].bisagra.forEach(function (p, i) { out.push({ p: p, label: k[1] + ', bisagra ' + (i ? 'abajo' : 'arriba') }); });
          });
          out.push({ p: s.barandaPt, label: 'Pasamanos de la barandilla', only: 'y' });
          return out;
        },
        shapes: function (s) {
          var y = s.barandaPt[1];
          return [{ pts: s.izquierda.puntos, closed: true }, { pts: s.derecha.puntos, closed: true },
            { pts: s.izquierda.bisagra, closed: false }, { pts: s.derecha.bisagra, closed: false },
            { pts: [[s.izquierda.puntos[3][0], y], [s.derecha.puntos[2][0], y]], closed: false }];
        },
        format: function (s, v) {
          function leaf(l) { return '{ puntos: [' + l.puntos.map(fmt).join(', ') + '], bisagra: [' + l.bisagra.map(fmt).join(', ') + '] }'; }
          return v + ': {\n  izquierda: ' + leaf(s.izquierda) + ',\n  derecha:   ' + leaf(s.derecha) + ',\n  baranda: ' + s.barandaPt[1].toFixed(4) + '\n}';
        },
        toScreen: toScreen, toImage: screenToImage,
        onChange: function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; buildWindow(); }); }
      });
      buildWindow();
    }
  }

  /* ---------- montaje ---------- */
  function mount() {
    cam = document.querySelector('.fachada-cam');
    if (!cam) return false;
    el.img = cam.querySelector('.poster img');
    function div(cls, parent) { var d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); (parent || cam).appendChild(d); return d; }

    el.hd = new Image();
    el.hd.className = 'fachada__hd';
    el.hd.alt = '';
    el.hd.setAttribute('aria-hidden', 'true');
    el.hd.decoding = 'async';
    cam.appendChild(el.hd);

    el.derrame = div('fachada__derrame');
    el.vano = div('vano');
    el.interior = div('vano__interior', el.vano);
    el.interiorB = div('vano__interior vano__interior--blur', el.vano);
    el.luz = div('vano__luz', el.vano);
    el.hueco = div('hueco');
    function leaf(cls) {
      var h = div('hoja ' + cls, el.hueco);
      var cara = div('hoja__cara', h);
      cara.appendChild(document.createElement('canvas'));
      var vidrio = document.createElement('canvas');
      vidrio.className = 'hoja__vidrio';
      cara.appendChild(vidrio);
      div('hoja__sombra', cara);
      div('hoja__reflejo', cara);
      div('hoja__canto', h);
      return h;
    }
    el.hojaI = leaf('hoja--izq');
    el.hojaD = leaf('hoja--der');
    el.baranda = document.createElement('canvas');
    el.baranda.className = 'baranda';
    el.baranda.setAttribute('aria-hidden', 'true');
    cam.appendChild(el.baranda);

    w.cam = writer(cam); w.camO = writer(cam);
    w.vano = writer(el.vano); w.hueco = writer(el.hueco); w.bar = writer(el.baranda);
    w.hI = writer(el.hojaI); w.hD = writer(el.hojaD);
    w.hIr = writer(el.hojaI.querySelector('.hoja__reflejo')); w.hDr = writer(el.hojaD.querySelector('.hoja__reflejo'));
    w.hIs = writer(el.hojaI.querySelector('.hoja__sombra')); w.hDs = writer(el.hojaD.querySelector('.hoja__sombra'));
    w.hIv = writer(el.hojaI.querySelector('.hoja__vidrio')); w.hDv = writer(el.hojaD.querySelector('.hoja__vidrio'));
    w.luz = writer(el.luz); w.derr = writer(el.derrame);
    w.int = writer(el.interior); w.intB = writer(el.interiorB); w.intBo = writer(el.interiorB);
    return true;
  }

  EV.zoneScripts[ID] = {
    init: function (zone) {
      if (!mount()) return;
      var stage = zone.stage;
      el.copy = stage.querySelector('.fachada__copy');
      w.copyO = writer(el.copy); w.copyT = writer(el.copy);
      wireEnter(stage);
      cam.classList.add('is-live');

      function ready() {
        relayout();
        buildLuma();
        if (PARAM === 'letras' || PARAM === 'ventana') adjustTools();
      }
      if (el.img.complete && el.img.naturalWidth) ready();
      el.img.addEventListener('load', ready);   // también al cambiar de variante (<picture>)
      window.addEventListener('resize', function () { if (view.W) relayout(); });

      // La 4K y el interior, después del primer movimiento (nunca compiten con el LCP).
      var kicked = false;
      var kick = function () {
        if (kicked) return;
        kicked = true;
        loadHd();
        setTimeout(loadInterior, 400);
      };
      ['scroll', 'wheel', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, kick, { passive: true, once: true }); });
      if (still || PARAM) setTimeout(kick, 600);

      if (LOGO && EV.logo) {
        EV.logo.load(LOGO).then(function (svg) {
          parts = buildLetters(svg);
          placeLetters();
          ignite(parts.luz);
        }).catch(function (e) { console.warn('[fachada] letras', e); });
      }

      EV.stage.register(ID, {
        activate: function (on) { cam.style.visibility = on ? 'visible' : 'hidden'; },
        render: render,
        key: function () { return key; },
        luminanceUnder: luminanceUnder,
        still: function () { apply(1); }
      });
    }
  };

  // Para las herramientas y el QA.
  EV.facade = {
    imageToScreen: imageToScreen, screenToImage: screenToImage,
    camera: function () { return { z: C.z, ox: C.ox, oy: C.oy, p: ps }; },
    holes: function () { return holeRects(); }
  };
})();
