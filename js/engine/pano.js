/* ==========================================================================
   pano.js — vista 360° (Three.js por CDN con versión fija; un solo renderer
   y un solo ticker: el de gsap, desde el que la zona llama a view.render()).

   - Esfera SphereGeometry(50, 96, 48) vista desde dentro (scale -1,1,1),
     MeshBasicMaterial sin tone mapping.
   - Texturas: 'previa' (2048) primero y luego la grande — 'alta' (5792) en
     escritorio si maxTextureSize ≥ 8192, si no 'media' (4096) — con fundido.
   - Cámara = posición base (la marca el scroll) + mirada (ratón ±yaw/pitch
     con inercia; en táctil, arrastre horizontal; giroscopio si se permite),
     limitada a yawLimite / pitchLimite y lejos de la costura (±180°) según
     el fov real de la pantalla.
   - Desenfoque de cristal (postproceso gaussiano a un cuarto de resolución)
     para la apertura y la salida. Exposición ±3 % multiplicando el material.
   - dpr ≤ 2 (baja a 1 si el render va por debajo de 40 fps). Solo dibuja si
     algo cambió.
   - project / unproject con LA MISMA cámara: las capas HTML no bailan.
   - Three.js se importa en diferido (EV.pano.load) al primer scroll.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});
  var U = EV.util;
  var D2R = Math.PI / 180;
  var SEAM = 4;                 // grados de margen con la costura (±180°)
  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

  var T = null;
  var renderer = null, scene = null, camera = null, geo = null, canvas = null, post = null;
  var view = { w: 1, h: 1, dpr: 1 };
  var maxTex = 4096;
  var perf = { n: 0, sum: 0, low: false, last: 0 };
  var tmpV = null, pv = null;
  var views = [];
  var loading = null;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function variant() { return EV.stage.variant(); }

  /* yaw 0 = centro del equirectangular, + a la derecha; pitch + arriba. */
  function dirOf(yaw, pitch, out) {
    var y = yaw * D2R, p = pitch * D2R;
    return out.set(-Math.cos(y) * Math.cos(p), Math.sin(p), -Math.sin(y) * Math.cos(p));
  }
  function anglesOf(v) {
    var len = v.length() || 1;
    return [Math.atan2(-v.z, -v.x) / D2R, Math.asin(clamp(v.y / len, -1, 1)) / D2R];
  }

  /* ---------- carga diferida de Three.js ---------- */
  function load() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!loading) {
      loading = import(THREE_URL).then(function (m) { window.THREE = m; return m; })
        .catch(function (e) { console.warn('[pano] Three.js no cargó', e); loading = null; throw e; });
    }
    return loading;
  }

  /* ---------- renderer ---------- */
  function init(c) {
    if (renderer) return true;
    T = window.THREE;
    canvas = c;
    if (!T) return false;
    try {
      renderer = new T.WebGLRenderer({ canvas: c, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { console.warn('[pano] sin WebGL', e); renderer = null; return false; }
    renderer.outputColorSpace = T.LinearSRGBColorSpace;   // los bytes del JPEG, tal cual
    renderer.toneMapping = T.NoToneMapping;
    renderer.setClearColor(0x080b14, 1);
    maxTex = renderer.capabilities.maxTextureSize || 4096;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(55, 1, 0.1, 200);
    geo = new T.SphereGeometry(50, 96, 48);
    geo.scale(-1, 1, 1);
    tmpV = new T.Vector3();
    pv = new T.Vector3();
    resize();
    window.addEventListener('resize', resize);
    return true;
  }

  function resize() {
    if (!renderer) return;
    view.w = canvas.clientWidth || window.innerWidth;
    view.h = canvas.clientHeight || window.innerHeight;
    view.dpr = perf.low ? 1 : Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(view.dpr);
    renderer.setSize(view.w, view.h, false);
    camera.aspect = view.w / view.h;
    camera.updateProjectionMatrix();
    views.forEach(function (v) { v.dirty = true; });
  }

  /* ---------- postproceso: desenfoque de cristal esmerilado ---------- */
  var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  var FS_BLUR = [
    'uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;',
    'void main(){',
    '  vec2 o1 = uDir * 1.411764705882353, o2 = uDir * 3.2941176470588234, o3 = uDir * 5.176470588235294;',
    '  vec4 c = texture2D(tMap, vUv) * 0.1964825501511404;',
    '  c += (texture2D(tMap, vUv + o1) + texture2D(tMap, vUv - o1)) * 0.2969069646728344;',
    '  c += (texture2D(tMap, vUv + o2) + texture2D(tMap, vUv - o2)) * 0.09447039785044732;',
    '  c += (texture2D(tMap, vUv + o3) + texture2D(tMap, vUv - o3)) * 0.010381362401148057;',
    '  gl_FragColor = c;',
    '}'].join('\n');
  var FS_COMP = 'uniform sampler2D tMap; uniform float uAlpha; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tMap, vUv).rgb, uAlpha); }';

  function makePost() {
    var o = { depthBuffer: false, stencilBuffer: false };
    var p = {
      a: new T.WebGLRenderTarget(4, 4, o), b: new T.WebGLRenderTarget(4, 4, o),
      qs: new T.Scene(), qc: new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), w: 0, h: 0
    };
    p.blur = new T.ShaderMaterial({ uniforms: { tMap: { value: null }, uDir: { value: new T.Vector2() } }, vertexShader: VS, fragmentShader: FS_BLUR, depthTest: false, depthWrite: false });
    p.comp = new T.ShaderMaterial({ uniforms: { tMap: { value: null }, uAlpha: { value: 1 } }, vertexShader: VS, fragmentShader: FS_COMP, transparent: true, depthTest: false, depthWrite: false });
    p.quad = new T.Mesh(new T.PlaneGeometry(2, 2), p.blur);
    p.quad.frustumCulled = false;
    p.qs.add(p.quad);
    return p;
  }

  function draw(blur) {
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    if (blur <= 0.002) return;
    if (!post) post = makePost();
    var qw = Math.max(2, Math.round(view.w * view.dpr / 4)), qh = Math.max(2, Math.round(view.h * view.dpr / 4));
    if (qw !== post.w || qh !== post.h) { post.a.setSize(qw, qh); post.b.setSize(qw, qh); post.w = qw; post.h = qh; }
    renderer.setRenderTarget(post.a);
    renderer.render(scene, camera);
    post.quad.material = post.blur;
    var step = 0.5 + blur * 2.6;
    for (var i = 0; i < 3; i++) {
      post.blur.uniforms.tMap.value = post.a.texture; post.blur.uniforms.uDir.value.set(step / qw, 0);
      renderer.setRenderTarget(post.b); renderer.render(post.qs, post.qc);
      post.blur.uniforms.tMap.value = post.b.texture; post.blur.uniforms.uDir.value.set(0, step / qh);
      renderer.setRenderTarget(post.a); renderer.render(post.qs, post.qc);
      step *= 1.7;
    }
    renderer.setRenderTarget(null);
    post.quad.material = post.comp;
    post.comp.uniforms.tMap.value = post.a.texture;
    post.comp.uniforms.uAlpha.value = U.smooth(0, 0.3, blur);
    var ac = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(post.qs, post.qc);
    renderer.autoClear = ac;
  }

  /* ---------- texturas ---------- */
  function texFrom(src, flipped) {
    var t = new T.Texture(src);
    t.flipY = !flipped;
    t.colorSpace = T.NoColorSpace;
    t.wrapS = T.RepeatWrapping;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.magFilter = T.LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    t.needsUpdate = true;
    return t;
  }
  function loadTex(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + url); return r.blob(); })
      .then(function (b) {
        if (!window.createImageBitmap) throw new Error('sin createImageBitmap');
        return createImageBitmap(b, { imageOrientation: 'flipY' }).then(function (bmp) { return { tex: texFrom(bmp, true), src: bmp, flipped: true }; });
      })
      .catch(function () {
        return new Promise(function (res, rej) {
          var img = new Image();
          img.onload = function () { res({ tex: texFrom(img, false), src: img, flipped: false }); };
          img.onerror = rej;
          img.src = url;
        });
      });
  }
  function bigKey() { return variant() === 'desktop' && maxTex >= 8192 ? 'alta' : 'media'; }

  /* ---------- mirada (ratón, dedo, giroscopio) ---------- */
  function attachLook(v) {
    var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
    var drag = null, vel = 0;
    window.addEventListener('pointermove', function (e) {
      if (!v.lookOn) return;
      if (e.pointerType === 'mouse' || (fine && e.pointerType !== 'touch')) {
        v.look.tx = clamp(e.clientX / view.w * 2 - 1, -1, 1);
        v.look.ty = clamp(e.clientY / view.h * 2 - 1, -1, 1);
      } else if (drag) {
        var dx = e.clientX - drag.x;
        drag.x = e.clientX;
        vel = dx;
        v.look.tx = clamp(v.look.tx - dx / (view.w * 0.4), -1, 1);
      }
    }, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      if (!v.lookOn || e.pointerType === 'mouse') return;
      drag = { x: e.clientX }; vel = 0;
    }, { passive: true });
    function end() {
      if (!drag) return;
      drag = null;
      v.look.vel = -vel / (view.w * 0.4);
    }
    window.addEventListener('pointerup', end, { passive: true });
    window.addEventListener('pointercancel', end, { passive: true });

    // Giroscopio: solo si el dispositivo lo da y el usuario lo permite (iOS pide gesto).
    if (!fine && window.DeviceOrientationEvent) {
      var g0 = null;
      function onOri(e) {
        if (!v.lookOn || drag || e.gamma == null) return;
        if (g0 == null) g0 = { g: e.gamma, b: e.beta };
        v.look.tx = clamp((e.gamma - g0.g) / 22, -1, 1);
        v.look.ty = clamp(-(e.beta - g0.b) / 22, -1, 1);
      }
      function start() { window.addEventListener('deviceorientation', onOri, { passive: true }); }
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        var ask = function () {
          window.removeEventListener('touchend', ask);
          DeviceOrientationEvent.requestPermission().then(function (s) { if (s === 'granted') start(); }).catch(function () {});
        };
        window.addEventListener('touchend', ask, { once: true });
      } else start();
    }
  }

  /* ---------- Vista ---------- */
  function View(cfg) {
    this.cfg = cfg;
    this.mesh = {};
    this.loading = false;
    this.luma = null;
    this.base = { yaw: 0, pitch: 0, fov: 55 };
    this.look = { x: 0, y: 0, tx: 0, ty: 0, vel: 0 };
    this.lookMax = cfg.mirar || { yaw: 12, pitch: 6, lerp: 0.06 };
    this.lookOn = false;
    this.fx = { blur: 0, exposure: 1 };
    this.cam = { yaw: 0, pitch: 0, fov: 55 };
    this.key = '';
    this.lastKey = '';
    this.dirty = true;
    this.visible = false;
    var self = this;
    this.ready = new Promise(function (res) { self.resolveReady = res; });
    this.isReady = false;
    views.push(this);
    attachLook(this);
  }

  View.prototype.setMesh = function (which, res) {
    var mat = new T.MeshBasicMaterial({ map: res.tex, toneMapped: false, depthTest: false, depthWrite: false, transparent: which === 'full', opacity: which === 'full' ? 0 : 1 });
    var mesh = new T.Mesh(geo, mat);
    mesh.renderOrder = which === 'full' ? -1 : -2;
    if (which === 'full') mesh.scale.setScalar(0.98);
    mesh.visible = this.visible;
    mesh.frustumCulled = false;
    scene.add(mesh);
    this.mesh[which] = mesh;
    this.dirty = true;
    return mesh;
  };

  View.prototype.lumaFrom = function (res) {
    try {
      var gw = 128, gh = 64;
      var c = document.createElement('canvas'); c.width = gw; c.height = gh;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(res.src, 0, 0, gw, gh);
      var d = x.getImageData(0, 0, gw, gh).data, g = new Float32Array(gw * gh);
      var lin = function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      for (var i = 0; i < gw * gh; i++) g[i] = 0.2126 * lin(d[i * 4]) + 0.7152 * lin(d[i * 4 + 1]) + 0.0722 * lin(d[i * 4 + 2]);
      this.luma = { w: gw, h: gh, g: g, flipped: res.flipped };
    } catch (e) { this.luma = null; }
  };

  View.prototype.load = function () {
    var self = this;
    if (!renderer || this.loading) return this.ready;
    this.loading = true;
    var urls = this.cfg.pano;
    var bk = bigKey();
    loadTex(urls.previa).then(function (res) {
      if (!self.loading) { res.tex.dispose(); return; }
      if (!self.mesh.full) self.setMesh('prev', res);
      self.lumaFrom(res);
      self.isReady = true;
      self.resolveReady();
    }).catch(function (e) { console.warn('[pano] previa', e); })
      .then(function () { return loadTex(urls[bk] || urls.media); })
      .then(function (res) {
        if (!self.loading) { res.tex.dispose(); return; }
        renderer.initTexture(res.tex);       // sube a la GPU ya, no en mitad del giro
        var mesh = self.setMesh('full', res);
        if (!self.luma) self.lumaFrom(res);
        self.isReady = true;
        self.resolveReady();
        gsap.to(mesh.material, {
          opacity: 1, duration: 0.8, ease: 'power1.inOut',
          onUpdate: function () { self.dirty = true; },
          onComplete: function () { mesh.material.transparent = false; self.dropMesh('prev'); self.dirty = true; }
        });
      }).catch(function (e) { console.warn('[pano] textura', e); });
    return this.ready;
  };

  View.prototype.dropMesh = function (which) {
    var m = this.mesh[which];
    if (!m) return;
    scene.remove(m);
    if (m.material.map) {
      var img = m.material.map.image;
      m.material.map.dispose();
      if (img && img.close) img.close();
    }
    m.material.dispose();
    this.mesh[which] = null;
  };
  View.prototype.release = function () {
    if (!this.loading) return;
    this.loading = false;
    this.dropMesh('prev');
    this.dropMesh('full');
    this.luma = null;
    this.isReady = false;
    var self = this;
    this.ready = new Promise(function (res) { self.resolveReady = res; });
  };

  View.prototype.show = function (on) {
    this.visible = on;
    if (this.mesh.prev) this.mesh.prev.visible = on;
    if (this.mesh.full) this.mesh.full.visible = on;
    this.lookOn = on;
    this.dirty = true;
    if (!on && renderer) { renderer.setRenderTarget(null); renderer.clear(); }
  };

  /* Media apertura horizontal real (grados) para un pitch y un fov dados. */
  View.prototype.halfYaw = function (pitch, fov) {
    var tv = Math.tan(fov * D2R / 2), th = tv * view.w / view.h, p = pitch * D2R;
    var den = Math.cos(p) - tv * Math.abs(Math.sin(p));
    return den > 0.05 ? Math.atan2(th, den) / D2R : 90;
  };
  View.prototype.guard = function (yaw, pitch, fov) {
    var pl = this.cfg.pitchLimite || [-85, 85];
    pitch = clamp(pitch, pl[0], pl[1]);
    var d = this.halfYaw(pitch, fov);
    var lim = this.cfg.yawLimite || [-180, 180];
    var lo = Math.max(lim[0], -180 + SEAM + d), hi = Math.min(lim[1], 180 - SEAM - d);
    return { yaw: lo > hi ? (lo + hi) / 2 : clamp(yaw, lo, hi), pitch: pitch, fov: fov };
  };

  View.prototype.setBase = function (c) { this.base.yaw = c.yaw; this.base.pitch = c.pitch; this.base.fov = c.fov; };

  /* Una vez por tick, desde la zona. Devuelve la cámara final. */
  View.prototype.render = function () {
    if (!renderer) return null;
    var L = this.look, M = this.lookMax;
    var dr = gsap.ticker.deltaRatio(60);
    if (L.vel) { L.tx = clamp(L.tx + L.vel * dr, -1, 1); L.vel *= Math.pow(0.9, dr); if (Math.abs(L.vel) < 1e-4) L.vel = 0; }
    var k = 1 - Math.pow(1 - (M.lerp || 0.06), dr);
    L.x += (L.tx - L.x) * k;
    L.y += (L.ty - L.y) * k;
    var c = this.guard(this.base.yaw + L.x * M.yaw, this.base.pitch - L.y * M.pitch, this.base.fov);
    this.cam = c;
    var ex = this.fx.exposure;
    var keyS = c.yaw.toFixed(3) + ',' + c.pitch.toFixed(3) + ',' + c.fov.toFixed(3) + ',' + this.fx.blur.toFixed(3) + ',' + ex.toFixed(3);
    this.key = keyS;
    if (Math.abs(camera.fov - c.fov) > 1e-6) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
    camera.up.set(0, 1, 0);
    camera.lookAt(dirOf(c.yaw, c.pitch, tmpV));
    camera.updateMatrixWorld(true);
    if (!this.visible || (keyS === this.lastKey && !this.dirty)) return c;
    this.lastKey = keyS;
    this.dirty = false;
    var m = this.mesh.full || this.mesh.prev;
    if (!m) return c;
    if (this.mesh.full) this.mesh.full.material.color.setScalar(ex);
    if (this.mesh.prev) this.mesh.prev.material.color.setScalar(ex);
    var t0 = performance.now();
    draw(this.fx.blur);
    watchPerf(performance.now() - t0);
    return c;
  };

  /* Si el render va lento de verdad (< 40 fps sostenidos), dpr a 1. */
  function watchPerf() {
    var now = performance.now();
    if (perf.last && now - perf.last < 200) {
      perf.sum += now - perf.last; perf.n++;
      if (perf.n >= 90) {
        if (!perf.low && perf.sum / perf.n > 25 && view.dpr > 1) { perf.low = true; resize(); }
        perf.n = 0; perf.sum = 0;
      }
    }
    perf.last = now;
  }

  /* Proyección de una dirección (yaw, pitch) a px de pantalla (o null si queda detrás). */
  View.prototype.project = function (yaw, pitch) {
    if (!renderer) return null;
    dirOf(yaw, pitch, pv).applyMatrix4(camera.matrixWorldInverse);
    if (pv.z > -1e-3) return null;
    pv.applyMatrix4(camera.projectionMatrix);
    return [(pv.x + 1) / 2 * view.w, (1 - pv.y) / 2 * view.h];
  };
  View.prototype.unproject = function (x, y) {
    var v = new T.Vector3(x / view.w * 2 - 1, 1 - y / view.h * 2, 0.5).unproject(camera);
    return anglesOf(v);
  };
  View.prototype.quad = function (c) {
    var out = [];
    for (var i = 0; i < 4; i++) {
      var q = this.project(c[i][0], c[i][1]);
      if (!q) return null;
      out.push(q);
    }
    return out;
  };
  /* Escala aparente: px por grado en el centro del encuadre. */
  View.prototype.pxPerDeg = function () { return view.h / this.cam.fov; };

  View.prototype.luminanceUnder = function (rect) {
    var L = this.luma;
    if (!L || !this.cam || !this.visible) return null;
    var s = 0, n = 0;
    for (var iy = 0; iy < 3; iy++) for (var ix = 0; ix < 4; ix++) {
      var x = rect.left + rect.width * (ix + 0.5) / 4, y = rect.top + rect.height * (iy + 0.5) / 3;
      var a = this.unproject(x, y);
      var u = ((a[0] / 360 + 0.5) % 1 + 1) % 1, v = 0.5 - a[1] / 180;
      if (L.flipped) v = 1 - v;
      var gx = clamp(Math.floor(u * L.w), 0, L.w - 1), gy = clamp(Math.floor(v * L.h), 0, L.h - 1);
      s += L.g[gy * L.w + gx]; n++;
    }
    return n ? s / n : null;
  };

  /* ---------- ?ajustar=oficina ---------- */
  function adjustTool(v, opts) {
    var ui = document.createElement('div');
    ui.className = 'sala-ajuste';
    ui.setAttribute('data-lenis-prevent', '');
    ui.innerHTML =
      '<div class="sala-ajuste__mira" aria-hidden="true"></div>' +
      '<svg class="sala-ajuste__marcas" aria-hidden="true"></svg>' +
      '<div class="ajuste__panel" role="region" aria-label="Ajuste de la oficina">' +
      '<p class="ajuste__titulo">' + (opts.titulo || 'Oficina') + '</p>' +
      '<pre class="ajuste__json" data-cam></pre>' +
      '<pre class="ajuste__json" data-clics></pre>' +
      '<p class="ajuste__estado" data-estado aria-live="polite">Mirar: arrastra para girar · rueda: fov · clic: copia (yaw, pitch) · Esc: volver al scroll</p>' +
      '<div class="ajuste__acciones"><button type="button" data-mirar>Mirar</button><button type="button" data-camara>Copiar cámara</button><button type="button" data-cuatro>Copiar 4 últimos</button></div>' +
      '</div>';
    document.body.appendChild(ui);
    var camEl = ui.querySelector('[data-cam]'), clicsEl = ui.querySelector('[data-clics]'), estado = ui.querySelector('[data-estado]');
    var marks = ui.querySelector('svg');
    var clics = [], on = false, drag = null;
    function f(n) { return n.toFixed(1); }
    function copy(t, msg) {
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { estado.textContent = msg; }, function () { estado.textContent = 'No se pudo copiar: selecciona el texto.'; });
    }
    function toggle(x) {
      on = x;
      ui.classList.toggle('is-on', on);
      if (on) { v.free = Object.assign({}, v.cam); EV.scroll.stop(); } else { v.free = null; EV.scroll.start(); }
      v.dirty = true;
    }
    ui.querySelector('[data-mirar]').addEventListener('click', function () { toggle(!on); });
    ui.querySelector('[data-camara]').addEventListener('click', function () {
      var c = v.free || v.cam;
      copy('yaw: ' + f(c.yaw) + ', pitch: ' + f(c.pitch) + ', fov: ' + f(c.fov), 'Cámara copiada.');
    });
    ui.querySelector('[data-cuatro]').addEventListener('click', function () {
      copy('[' + clics.slice(-4).map(function (q) { return '[' + f(q[0]) + ', ' + f(q[1]) + ']'; }).join(', ') + ']', 'Cuatro esquinas copiadas.');
    });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && on) toggle(false); });
    ui.addEventListener('pointerdown', function (e) {
      if (!on || e.target.closest('.ajuste__panel')) return;
      ui.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY };
    });
    ui.addEventListener('pointermove', function (e) {
      if (!drag || !v.free) return;
      var k = v.free.fov / view.h;
      v.free.yaw -= (e.clientX - drag.x) * k;
      v.free.pitch = clamp(v.free.pitch + (e.clientY - drag.y) * k, -85, 85);
      drag.x = e.clientX; drag.y = e.clientY;
      v.dirty = true;
    });
    ui.addEventListener('pointerup', function (e) {
      if (!drag) return;
      var moved = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4;
      drag = null;
      if (moved) return;
      var a = v.unproject(e.clientX, e.clientY);
      clics.push(a);
      clicsEl.textContent = 'clics: ' + clics.slice(-4).map(function (q) { return '[' + f(q[0]) + ', ' + f(q[1]) + ']'; }).join(' ');
      copy('yaw: ' + f(a[0]) + ', pitch: ' + f(a[1]), 'Copiado: yaw ' + f(a[0]) + ', pitch ' + f(a[1]));
    });
    ui.addEventListener('wheel', function (e) {
      if (!on || !v.free) return;
      e.preventDefault();
      v.free.fov = clamp(v.free.fov * (1 + e.deltaY * 0.001), 15, 100);
      v.dirty = true;
    }, { passive: false });

    gsap.ticker.add(function () {
      var c = v.free || v.cam;
      if (!c || !v.visible) { ui.style.display = 'none'; return; }
      ui.style.display = '';
      var near = Math.abs(c.yaw) + v.halfYaw(c.pitch, c.fov) > 180 - SEAM;
      var pl = v.cfg.pitchLimite || [-85, 85];
      var low = c.pitch - c.fov / 2 < pl[0];
      camEl.textContent = 'cámara: yaw ' + f(c.yaw) + ' · pitch ' + f(c.pitch) + ' · fov ' + f(c.fov) + (near ? '  ⚠ costura en cuadro' : '') + (low ? '  ⚠ silla en cuadro' : '');
      var html = '';
      function mark(q, label) {
        var s = v.project(q[0], q[1]);
        if (!s) return;
        html += '<g transform="translate(' + s[0].toFixed(1) + ',' + s[1].toFixed(1) + ')"><path d="M-6 0H6M0 -6V6"/><text x="8" y="-6">' + label + '</text></g>';
      }
      var mk = opts.marcas || {};
      for (var k in mk) mark(mk[k], k);
      (opts.cuadros || []).forEach(function (q) { q.esquinas.forEach(function (c, i) { mark(c, q.id + ' ' + (i + 1)); }); });
      marks.innerHTML = html;
    });
  }

  EV.pano = {
    load: load,
    init: init,
    ok: function () { return !!renderer; },
    view: function (cfg) { return new View(cfg); },
    adjustTool: adjustTool,
    size: function () { return view; }
  };
})();
