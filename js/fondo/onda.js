/* ==========================================================================
   onda.js — "La onda de cromo": 7 bandas metálicas (Three.js 0.160.0) con la
   forma EXACTA de la línea que cruza el monograma EH (constante P).
   · Cromo pulido (MeshPhysicalMaterial) sobre un estudio navy con luces
     blancas y vetas cian/violeta: reflejan "los rayos".
   · Una línea de luz cian por banda que la recorre de punta a punta
     (shader aditivo sobre la UV del tubo), cada una con su desfase.
   · Cuerdas acopladas: el puntero empuja un campo de desplazamiento (96
     puntos × 7 tubos, CPU, paso fijo 1/90 s) que los vertex shaders leen de
     una DataTexture; la onda recorre cada tubo y pasa a sus vecinos.
   · Los dos extremos de cada banda se funden (alpha sobre la UV): nunca se
     ve el corte del tubo y la banda se apaga antes de llegar al texto.
   Un solo renderer. No tiene bucle propio: js/home.js llama a render() desde
   gsap.ticker. dpr ≤ 2, baja solo si el fotograma va lento.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});
  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

  // Línea central de la banda del logo EH (normalizada desde el vector:
  // x 0..1, y 0..1 de arriba abajo). NO TOCAR: es la forma de la marca.
  var P = [[0, .506], [.107, .536], [.203, .545], [.574, .485], [.67, .467], [.813, .455], [.909, .467], [1, .495]];
  var N = 7;

  // Cuerdas acopladas: campo de desplazamiento (CPU) de W puntos × N tubos.
  // u = desplazamiento en Y local del tubo, v = velocidad. Se sube cada
  // fotograma a una DataTexture que leen los vertex shaders (cromo y luz).
  // Calma (v-tubos-calma): tension 0.16 · coupling 0.09 · restore 0.010 · damping 0.10 · gain 0.0015 · max 0.28 · radio 160.
  var SIM = { W: 96, step: 1 / 90, maxSteps: 6, lim: 0.28, radio: 160, fuerza: 0.0015, tension: 0.16, coupling: 0.09, restore: 0.010, damping: 0.10 };
  var fieldU = new Float32Array(SIM.W * N), fieldV = new Float32Array(SIM.W * N);
  var fieldTex = null, acc = 0, quieto = true;
  var ptr = { x: 0, y: 0, px: 0, py: 0, dentro: false, prev: false, vx: 0, vy: 0 };
  var _v, _o;                                    // vectores de trabajo

  var EV_GLSL =
    'uniform sampler2D uField;uniform float uBand;uniform float uW;uniform float uN;attribute float aS;\n' +
    // Interpolación manual Catmull-Rom (4 muestras): pasa por los 96 valores
    // sin aristas; la lineal dibujaba una poligonal (~30 px entre muestras).
    'float evTap(float i,float y){return texture2D(uField,vec2((clamp(i,0.,uW-1.)+.5)/uW,y)).r;}\n' +
    'float evField(float s){float x=clamp(s,0.,1.)*(uW-1.);float i1=floor(x);float t=x-i1;float y=(uBand+.5)/uN;' +
    'float p0=evTap(i1-1.,y),p1=evTap(i1,y),p2=evTap(i1+1.,y),p3=evTap(i1+2.,y);' +
    'return p1+.5*t*(p2-p0+t*(2.*p0-5.*p1+4.*p2-p3+t*(3.*(p1-p2)+p3-p0)));}\n' +
    'vec3 evDisplace(vec3 p){return p+vec3(0.,evField(aS),0.);}\n';

  var T, renderer, scene, camera, group, canvas;
  var bands = [];
  var fadeU = { value: null };
  var base = { x: 7.4, y: 0.2 };
  var s = { mx: 0, my: 0, hero: 0 };           // estado suavizado
  var dpr = 1, maxDpr = 1, slow = 0, mobile = false, w = 0, h = 0;

  function env() {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    var g = c.getContext('2d');
    var bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#1a2440'); bg.addColorStop(0.5, '#0a0f1d'); bg.addColorStop(1, '#05070d');
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
    function box(x, y, bw, bh, col, a) {
      var gr = g.createLinearGradient(x, y, x, y + bh);
      gr.addColorStop(0, 'rgba(' + col + ',0)'); gr.addColorStop(0.5, 'rgba(' + col + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gr; g.fillRect(x, y, bw, bh);
    }
    box(80, 40, 640, 150, '255,255,255', 1);      // caja de luz grande
    box(0, 190, 1024, 26, '255,255,255', 0.55);
    box(560, 300, 380, 70, '235,242,255', 0.7);
    box(700, 130, 220, 60, '230,240,255', 0.6);
    box(0, 250, 1024, 40, '0,229,255', 0.55);     // veta cian
    box(380, 330, 420, 30, '150,110,255', 0.45);  // veta violeta
    box(60, 380, 260, 24, '0,229,255', 0.35);
    var t = new T.CanvasTexture(c);
    t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace;
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(t).texture;
    t.dispose(); pm.dispose();
  }

  function bandCurve(L, amp) {
    var pts = [new T.Vector3(-L * 0.62, -(P[0][1] - 0.5) * amp * L, 0)];
    P.forEach(function (p) { pts.push(new T.Vector3((p[0] - 0.5) * L, -(p[1] - 0.5) * amp * L, 0)); });
    pts.push(new T.Vector3(L * 0.62, -(P[P.length - 1][1] - 0.5) * amp * L, 0));
    return new T.CatmullRomCurve3(pts, false, 'centripetal');
  }

  // Cromo de un tubo: el físico compartido + fundido de extremos + campo de
  // cuerdas. Un material por tubo (uBand), un solo programa (cache key).
  function makeChrome(base, u) {
    var mat = base.clone();
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.uFade = fadeU;
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vAlong;\n' + EV_GLSL)
        .replace('#include <begin_vertex>', 'vec3 transformed = evDisplace(vec3(position));\nvAlong = uv.x;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vAlong;\nuniform vec4 uFade;')
        .replace('#include <dithering_fragment>',
          '#include <dithering_fragment>\ngl_FragColor.a *= smoothstep(uFade.x, uFade.y, vAlong) * (1.0 - smoothstep(uFade.z, uFade.w, vAlong));');
    };
    mat.customProgramCacheKey = function () { return 'ev-chrome'; };
    return mat;
  }

  function lightMat(col, u) {
    return new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: Object.assign({ uHead: { value: -2 }, uCol: { value: new T.Color(col) }, uAlpha: { value: 1 }, uFade: fadeU }, u),
      vertexShader:
        EV_GLSL + 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;' +
        'void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(evDisplace(position),1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:
        'uniform float uHead;uniform vec3 uCol;uniform float uAlpha;uniform vec4 uFade;varying vec2 vUv;varying vec3 vN;varying vec3 vV;' +
        'void main(){float d=vUv.x-uHead;float trail=d<0.?exp(d*14.):exp(-d*260.);float core=d<0.?exp(d*90.):exp(-d*260.);' +
        'float face=pow(max(dot(vN,vV),0.),1.6);' +
        'float ends=smoothstep(uFade.x,uFade.y,vUv.x)*(1.-smoothstep(uFade.z,uFade.w,vUv.x));' +
        'float a=(trail*.55+core*1.2)*(.25+.75*face)*uAlpha*ends;' +
        'gl_FragColor=vec4(uCol*(1.+core*1.6),a);}'
    });
  }

  function build() {
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 14);
    env();
    fadeU.value = new T.Vector4(0.06, 0.3, 0.97, 1.0);

    var chrome = new T.MeshPhysicalMaterial({
      color: 0xdfe6f0, metalness: 1, roughness: 0.13, clearcoat: 0.8, clearcoatRoughness: 0.08,
      envMapIntensity: 1.7, transparent: true
    });
    fieldTex = new T.DataTexture(fieldU, SIM.W, N, T.RedFormat, T.FloatType);
    fieldTex.minFilter = fieldTex.magFilter = T.NearestFilter;
    fieldTex.needsUpdate = true;
    _v = new T.Vector3(); _o = new T.Vector3();
    var tub = mobile ? 260 : 420, rad = mobile ? 18 : 28, radL = mobile ? 12 : 20;

    group = new T.Group(); scene.add(group);
    for (var i = 0; i < N; i++) {
      var L = 20 + i * 0.9, r = 0.12;
      var curve = bandCurve(L, 0.95);
      var geo = new T.TubeGeometry(curve, tub, r, rad, false); geo.scale(1, 1.55, 0.38); addS(geo);
      var u = { uField: { value: fieldTex }, uBand: { value: i }, uW: { value: SIM.W }, uN: { value: N } };
      var mesh = new T.Mesh(geo, makeChrome(chrome, u));
      mesh.renderOrder = N - i;                     // de atrás hacia delante
      var lgeo = new T.TubeGeometry(curve, tub, r * 1.04, radL, false); lgeo.scale(1, 1.55, 0.38); addS(lgeo);
      var lm = lightMat(i % 3 === 1 ? 0x9ef6ff : 0x00e5ff, u);
      var light = new T.Mesh(lgeo, lm);
      light.renderOrder = 100 + i;
      var g = new T.Group(); g.add(mesh, light);
      g.position.set(i * 0.12, i * 0.62, -i * 0.55);
      group.add(g);
      // Los 96 puntos de la cuerda en el espacio del tubo (misma escala que la geometría).
      var pts = new Float32Array(SIM.W * 3);
      for (var k = 0; k < SIM.W; k++) {
        var q = curve.getPointAt(k / (SIM.W - 1));
        pts[k * 3] = q.x; pts[k * 3 + 1] = q.y * 1.55; pts[k * 3 + 2] = q.z * 0.38;
      }
      bands.push({ g: g, lm: lm, pts: pts, head: i * 0.37 - 0.3, speed: (0.11 + (i % 3) * 0.025) * 0.5 });   // luz: a la mitad
    }
    group.rotation.set(0.18, -0.32, 0.46);
  }

  // aS = posición a lo largo del tubo (0..1): índice en el campo de cuerdas.
  function addS(geo) {
    var uv = geo.attributes.uv, a = new Float32Array(uv.count);
    for (var i = 0; i < uv.count; i++) a[i] = uv.getX(i);
    geo.setAttribute('aS', new T.BufferAttribute(a, 1));
  }

  /* Empuje del puntero: cada punto de cada cuerda recibe la velocidad del
     puntero proyectada sobre su normal en pantalla, con caída gaussiana. */
  function pulsar() {
    var sp = ptr.vx * ptr.vx + ptr.vy * ptr.vy;
    if (sp < 0.01) return;
    var r2 = SIM.radio * SIM.radio, W = SIM.W;
    group.updateMatrixWorld();
    for (var b = 0; b < N; b++) {
      var m = bands[b].g.matrixWorld, pts = bands[b].pts;
      for (var k = 0; k < W; k++) {
        _v.set(pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2]);
        _o.copy(_v); _o.y += 0.1;
        _v.applyMatrix4(m).project(camera);
        var sx = (_v.x * 0.5 + 0.5) * w, sy = (-_v.y * 0.5 + 0.5) * h;
        var dx = sx - ptr.x, dy = sy - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 > r2 * 9) continue;                 // más allá de 3 radios: exp ≈ 0
        _o.applyMatrix4(m).project(camera);
        var nx = (_o.x * 0.5 + 0.5) * w - sx, ny = (-_o.y * 0.5 + 0.5) * h - sy;
        var nl = Math.sqrt(nx * nx + ny * ny) || 1;
        fieldV[b * W + k] += ((ptr.vx * nx + ptr.vy * ny) / nl) * Math.exp(-d2 / r2) * SIM.fuerza;
        quieto = false;
      }
    }
  }

  /* Un paso de 1/90 s. Donde falta un vecino (tubos de los bordes, extremos
     de cada cuerda) se usa u·0.5. */
  function paso() {
    var W = SIM.W, lim = SIM.lim, e = 0;
    for (var b = 0; b < N; b++) {
      for (var k = 0; k < W; k++) {
        var i = b * W + k, u = fieldU[i];
        var l = k > 0 ? fieldU[i - 1] : u * 0.5, r = k < W - 1 ? fieldU[i + 1] : u * 0.5;
        var up = b > 0 ? fieldU[i - W] : u * 0.5, dn = b < N - 1 ? fieldU[i + W] : u * 0.5;
        fieldV[i] += SIM.tension * (l + r - 2 * u) + SIM.coupling * (up + dn - 2 * u) - SIM.restore * u - SIM.damping * fieldV[i];
      }
    }
    for (var j = 0; j < fieldU.length; j++) {
      var nu = fieldU[j] + fieldV[j];
      fieldU[j] = nu > lim ? lim : nu < -lim ? -lim : nu;
      e += Math.abs(fieldU[j]) + Math.abs(fieldV[j]);
    }
    return e;
  }

  /* Paso fijo (acumulador, máx. 6 pasos por fotograma): igual a cualquier fps. */
  var ultimo = 0;
  function simular(dt, activo) {
    // Si no se ha simulado en un rato (canvas a opacidad 0), la posición previa
    // del puntero no vale: sin esto saldría un empujón falso al volver.
    var ahora = performance.now();
    if (ahora - ultimo > 120) ptr.prev = false;
    ultimo = ahora;
    if (activo && ptr.dentro) {
      if (ptr.prev) {
        // Velocidad del puntero por fotograma, normalizada a 60 fps y suavizada.
        var f = 1 / Math.max(dt * 60, 0.25);
        var ks = 1 - Math.pow(0.82, dt * 60);       // suavizado lento: sin sacudidas
        ptr.vx += ((ptr.x - ptr.px) * f - ptr.vx) * ks;
        ptr.vy += ((ptr.y - ptr.py) * f - ptr.vy) * ks;
        pulsar();
      }
      ptr.px = ptr.x; ptr.py = ptr.y; ptr.prev = true;
    } else { ptr.prev = false; ptr.vx = ptr.vy = 0; }

    if (quieto) { acc = 0; return; }
    acc = Math.min(acc + dt, SIM.step * SIM.maxSteps);
    var e = -1;
    while (acc >= SIM.step) { e = paso(); acc -= SIM.step; }
    if (e >= 0 && e < 1e-4 * fieldU.length) { fieldU.fill(0); fieldV.fill(0); quieto = true; }
    fieldTex.needsUpdate = true;
  }

  function resize() {
    if (!renderer) return;
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (cw === w && ch === h) return;
    w = cw; h = ch;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    var narrow = w < 720;
    camera.fov = narrow ? 44 : 32;
    camera.updateProjectionMatrix();
    // Móvil: las bandas arriba, el texto abajo (nunca detrás del H1).
    base.x = narrow ? 2.4 : 7.4;
    base.y = narrow ? 3.5 : 0.2;
    // Fundido izquierdo: la banda es invisible antes de llegar al bloque del H1.
    if (fadeU.value) fadeU.value.set(narrow ? 0.06 : 0.16, narrow ? 0.36 : 0.44, 0.97, 1.0);
  }

  function place(i) {
    // Ratón: amplitud a la mitad. Scroll del hero: recorrido un 40 % menor.
    group.position.x = base.x + s.mx * -0.175;
    group.position.y = base.y + s.my * 0.125 + s.hero * 1.32;
    group.rotation.x = 0.18 + s.my * 0.03 + s.hero * 0.21;
    group.rotation.y = -0.32 + s.mx * 0.04 - s.hero * 0.108;
    group.rotation.z = 0.46 + s.hero * 0.096;
  }

  EV.onda = {
    ok: false,

    /* Carga Three.js y monta la escena. Resuelve true si hay WebGL. */
    load: function (cv) {
      canvas = cv;
      mobile = Math.min(screen.width, screen.height) < 720 || matchMedia('(pointer: coarse)').matches;
      return import(THREE_URL).then(function (mod) {
        T = mod;
        renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
        maxDpr = Math.min(window.devicePixelRatio || 1, 2);
        dpr = maxDpr;
        renderer.setPixelRatio(dpr);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        build();
        resize();
        place();
        renderer.compile(scene, camera);
        EV.onda.ok = true;
        return true;
      });
    },

    resize: resize,

    /* Un "pulso" en las cuerdas (p. ej. al cambiar el interruptor de clientes):
       un golpe gaussiano en todos los tubos que luego viaja y se apaga solo. */
    pulso: function (f) {
      if (!fieldTex || EV.reducedMotion) return;
      f = f || 0.05;
      var W = SIM.W, c = W * 0.62;
      for (var b = 0; b < N; b++) {
        for (var k = 0; k < W; k++) fieldV[b * W + k] += f * Math.exp(-Math.pow((k - c) / 6, 2)) * (1 - b * 0.06);
      }
      quieto = false;
    },

    /* Puntero en px de la ventana (ratón o dedo). dentro=false: sin empuje. */
    pointer: function (x, y, dentro) { ptr.x = x; ptr.y = y; ptr.dentro = dentro; },

    /* dt: segundos · inp: { mx, my (−0.5..0.5), hero (0..1), luz, cuerdas (bool) } */
    render: function (dt, inp) {
      if (!renderer) return;
      resize();
      var k = 1 - Math.pow(1 - 0.018, dt * 60);    // inclinación por el ratón: lerp 0.018 a 60 fps (antes 0.05)
      var kh = 1 - Math.pow(1 - 0.035, dt * 60);   // scroll del hero: 0.035 (antes 0.08)
      s.mx += (inp.mx - s.mx) * k;
      s.my += (inp.my - s.my) * k;
      s.hero += (inp.hero - s.hero) * kh;
      place();
      for (var i = 0; i < bands.length; i++) {
        var b = bands[i];
        if (inp.luz) {
          // La luz avanza integrando la velocidad: acelerar no la hace saltar.
          b.head += dt * b.speed * (1 + s.hero * 0.96);   // aceleración con el scroll, 40 % menos
          if (b.head > 1.3) b.head -= 1.6;
          b.lm.uniforms.uHead.value = b.head;
          b.g.position.z = -i * 0.55 + Math.sin(performance.now() / 1000 * 0.175 + i * 0.7) * 0.06;   // deriva a la mitad de velocidad
        } else b.lm.uniforms.uHead.value = -2;
      }
      simular(dt, !!inp.cuerdas);
      renderer.render(scene, camera);

      // Calidad adaptativa: si los fotogramas pasan de ~22 ms, baja el dpr.
      if (dt > 0.022 && dt < 0.25) slow += dt; else slow = Math.max(0, slow - dt * 0.5);
      if (slow > 1.2 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.5); slow = 0;
        renderer.setPixelRatio(dpr); w = h = 0; resize();
      }
    },

    /* Fotograma fijo (sin luces) para la versión fija: PNG con transparencia. */
    capture: function () {
      s.mx = s.my = s.hero = 0; place();
      bands.forEach(function (b, i) { b.lm.uniforms.uHead.value = -2; b.g.position.z = -i * 0.55; });
      fieldU.fill(0); fieldV.fill(0); quieto = true; fieldTex.needsUpdate = true;
      renderer.render(scene, camera);
      return canvas.toDataURL('image/png');
    },

    get dpr() { return dpr; }
  };
})();
