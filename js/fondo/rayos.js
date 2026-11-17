/* ==========================================================================
   rayos.js — los rayos de luz de Evimes (canvas 2D a media resolución).
   Cada rayo es un sprite suave pintado UNA vez (degradado transversal ×
   fundido a lo largo); por fotograma solo se dibujan 14 sprites con su
   transformación. Sin filter CSS en vivo.
   Composición fija (semilla): igual en cada visita y en la versión fija.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  var NAVY = '#080b14';
  var HUES = [268, 190, 205];          // violeta, cian, azul
  var cv, ctx, W = 0, H = 0, sprites = [], beams = [];

  function rng(seed) {                 // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sprite(hue) {
    var s = document.createElement('canvas');
    s.width = 96; s.height = 512;
    var g = s.getContext('2d');
    // Perfil transversal de ventana de Hann (suave, sin arista central):
    // equivale al triángulo + blur del prototipo sin filtro en vivo.
    var gr = g.createLinearGradient(0, 0, 96, 0);
    for (var k = 0; k <= 16; k++) {
      var x = k / 16, a = 0.5 - 0.5 * Math.cos(2 * Math.PI * x);
      gr.addColorStop(x, 'hsla(' + hue + ',90%,58%,' + (a * a * 0.35 + a * 0.65).toFixed(3) + ')');
    }
    g.fillStyle = gr; g.fillRect(0, 0, 96, 512);
    // Fundido a lo largo: sin extremos duros.
    g.globalCompositeOperation = 'destination-in';
    var gl = g.createLinearGradient(0, 0, 0, 512);
    gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(0.3, 'rgba(0,0,0,1)');
    gl.addColorStop(0.7, 'rgba(0,0,0,1)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl; g.fillRect(0, 0, 96, 512);
    return s;
  }

  function resize() {
    if (!cv) return;
    var w = Math.ceil(cv.clientWidth / 2), h = Math.ceil(cv.clientHeight / 2);
    if (w === W && h === H) return false;
    W = cv.width = w; H = cv.height = h;
    return true;
  }

  EV.rayos = {
    init: function (canvas) {
      cv = canvas; ctx = cv.getContext('2d', { alpha: false });
      sprites = HUES.map(sprite);
      var r = rng(20261116);
      beams = [];
      for (var i = 0; i < 14; i++) {
        beams.push({
          x: r(), y: r(), w: 0.05 + r() * 0.09, sp: 0.004 + r() * 0.008,
          a: 0.1 + r() * 0.14, hue: i % 3, ph: r() * 6.283
        });
      }
      resize();
    },

    resize: resize,

    /* t: segundos · hero: progreso del scroll en el hero (0–1) */
    render: function (t, hero) {
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = NAVY;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      var len = H * 2.4;
      for (var i = 0; i < beams.length; i++) {
        var b = beams[i];
        // Ciclo completo de cada rayo con fundido de entrada/salida: el salto
        // de vuelta al principio ocurre con el rayo apagado.
        var phase = ((b.y + t * b.sp) % 1.4) / 1.4;
        var fade = Math.sin(phase * Math.PI);
        var y = (phase * 1.4 - 0.2) * H;
        var rot = -0.62 + Math.sin(t * 0.1 + b.ph) * 0.04 + hero * 0.12;
        var w = b.w * W * 1.5 + 18;            // ancho + "desenfoque"
        ctx.globalAlpha = b.a * (0.75 + 0.25 * Math.sin(t * 0.5 + b.ph)) * fade;
        var c = Math.cos(rot), s = Math.sin(rot);
        ctx.setTransform(c, s, -s, c, b.x * W, y);
        ctx.drawImage(sprites[b.hue], -w / 2, -len / 2, w, len);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  };
})();
