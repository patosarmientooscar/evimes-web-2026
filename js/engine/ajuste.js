/* ==========================================================================
   ajuste.js — herramienta común de puntos arrastrables (?ajustar=…).
   La usan ?ajustar=letras y ?ajustar=ventana (fachada). Guarda en
   localStorage mientras ajustas y copia al portapapeles el bloque listo
   para pegar en js/config.js.

   EV.ajuste.puntos({
     id, titulo,
     base(variant)     → copia editable de lo que hay en config
     refs(state)       → [{ p: [x, y] (array mutable), label }]
     shapes(state)     → [{ pts: [[x,y]…], closed: bool }]
     format(state, v)  → texto para el portapapeles
     toScreen([x,y])   → [px, py] · toImage(px, py) → [x, y]
     onChange(state, v)
   }) → { state(variant) }
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  function puntos(o) {
    var KEY = 'evimes.ajustar.' + o.id + '.';
    var states = {};
    function variant() { return EV.stage.variant(); }
    function state(v) {
      v = v || variant();
      if (!states[v]) {
        try { var s = localStorage.getItem(KEY + v); if (s) states[v] = JSON.parse(s); } catch (e) {}
        if (!states[v]) states[v] = o.base(v);
      }
      return states[v];
    }

    var ui = document.createElement('div');
    ui.className = 'ajuste';
    ui.innerHTML =
      '<svg class="ajuste__marco" aria-hidden="true"></svg>' +
      '<div class="ajuste__panel" role="region" aria-label="' + o.titulo + '">' +
      '<p class="ajuste__titulo">' + o.titulo + ' · <span data-v></span></p>' +
      '<pre class="ajuste__json" data-json></pre>' +
      '<p class="ajuste__estado" data-estado aria-live="polite">Arrastra los puntos. Flechas: mover 1 px (Mayús: 10).</p>' +
      '<div class="ajuste__acciones"><button type="button" data-copiar>Copiar</button><button type="button" data-reset>Restaurar config</button></div>' +
      '</div>';
    document.body.appendChild(ui);
    var svg = ui.querySelector('svg');
    var jsonEl = ui.querySelector('[data-json]');
    var estado = ui.querySelector('[data-estado]');
    var vEl = ui.querySelector('[data-v]');
    var handles = [];
    var builtFor = null;

    function save(copy) {
      var v = variant();
      try { localStorage.setItem(KEY + v, JSON.stringify(state(v))); } catch (e) {}
      var txt = o.format(state(v), v);
      jsonEl.textContent = txt;
      if (o.onChange) o.onChange(state(v), v);
      if (copy && navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () { estado.textContent = 'Copiado. Pégalo en js/config.js.'; },
          function () { estado.textContent = 'No se pudo copiar: selecciona el texto a mano.'; });
      }
    }

    function build() {
      handles.forEach(function (h) { h.remove(); });
      handles = [];
      var v = variant();
      builtFor = v;
      o.refs(state(v)).forEach(function (r) {
        var h = document.createElement('button');
        h.type = 'button';
        h.className = 'ajuste__punto';
        h.setAttribute('aria-label', r.label);
        h.title = r.label;
        h._ref = r;
        // Puntos que coinciden (p. ej. el canto común de las dos hojas) se
        // mueven juntos: el borde compartido nunca se separa.
        var twins = [];
        h.addEventListener('pointerdown', function (e) {
          h.setPointerCapture(e.pointerId); h.dataset.drag = '1'; e.preventDefault();
          twins = handles.filter(function (x) { return x !== h && !x._ref.only && !r.only && Math.abs(x._ref.p[0] - r.p[0]) < 1e-4 && Math.abs(x._ref.p[1] - r.p[1]) < 1e-4; });
        });
        h.addEventListener('pointermove', function (e) {
          if (!h.dataset.drag) return;
          var q = o.toImage(e.clientX, e.clientY);
          if (r.only === 'y') r.p[1] = q[1]; else { r.p[0] = q[0]; r.p[1] = q[1]; }
          twins.forEach(function (t) { t._ref.p[0] = r.p[0]; t._ref.p[1] = r.p[1]; });
          if (o.onChange) o.onChange(state(v), v);
        });
        h.addEventListener('pointerup', function () { delete h.dataset.drag; save(true); });
        h.addEventListener('keydown', function (e) {
          var step = e.shiftKey ? 10 : 1, dx = 0, dy = 0;
          if (e.key === 'ArrowLeft') dx = -step; else if (e.key === 'ArrowRight') dx = step;
          else if (e.key === 'ArrowUp') dy = -step; else if (e.key === 'ArrowDown') dy = step; else return;
          e.preventDefault();
          var s = o.toScreen(r.p), q = o.toImage(s[0] + dx, s[1] + dy);
          if (r.only !== 'y') r.p[0] = q[0];
          r.p[1] = q[1];
          save(false);
        });
        ui.appendChild(h);
        handles.push(h);
      });
      jsonEl.textContent = o.format(state(v), v);
    }

    ui.querySelector('[data-copiar]').addEventListener('click', function () { save(true); });
    ui.querySelector('[data-reset]').addEventListener('click', function () {
      var v = variant();
      try { localStorage.removeItem(KEY + v); } catch (e) {}
      states[v] = o.base(v);
      build();
      if (o.onChange) o.onChange(state(v), v);
      estado.textContent = 'Restaurado desde config.';
    });

    build();
    gsap.ticker.add(function () {
      if (builtFor !== variant()) build();
      vEl.textContent = builtFor;
      handles.forEach(function (h) {
        var s = o.toScreen(h._ref.p);
        h.style.transform = 'translate3d(' + s[0].toFixed(1) + 'px,' + s[1].toFixed(1) + 'px,0)';
      });
      var html = '';
      o.shapes(state()).forEach(function (sh) {
        var pts = sh.pts.map(function (p) { var s = o.toScreen(p); return s[0].toFixed(1) + ',' + s[1].toFixed(1); }).join(' ');
        html += sh.closed ? '<polygon points="' + pts + '"/>' : '<polyline points="' + pts + '"/>';
      });
      svg.innerHTML = html;
    });

    return { state: state };
  }

  EV.ajuste = { puntos: puntos };
})();
