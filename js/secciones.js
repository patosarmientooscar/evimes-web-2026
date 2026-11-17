/* ==========================================================================
   secciones.js — secciones planas: datos del hero, planes, también hacemos,
   preguntas, contacto, WhatsApp flotante. Todo desde config/content/data.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* Hero: fila de 3 datos pequeños desde config.cifras (sin los pendientes). */
  function datos() {
    var dl = document.querySelector('[data-datos]');
    if (!dl) return;
    (EVIMES_CONFIG.cifras || []).filter(function (c) { return !c.pendienteConfirmar; }).slice(0, 3).forEach(function (c) {
      var d = el('div', 'dato');
      d.appendChild(el('dt', 'dato__valor', c.valor));
      d.appendChild(el('dd', 'dato__etiqueta', c.etiqueta));
      dl.appendChild(d);
    });
  }

  /* Planes: mismo material y misma física que las cards de proyectos. */
  function planes() {
    var ol = document.querySelector('[data-planes]');
    var data = window.EVIMES_PLANES || [];
    if (!ol) return;
    var U = EV.util;
    data.forEach(function (p) {
      var li = el('li', 'plan' + (p.recomendado ? ' plan--recomendado' : ''));
      var art = el('article', 'plan__cuerpo');
      art.setAttribute('aria-labelledby', 'plan-' + p.id);
      if (p.recomendado) art.appendChild(el('p', 'plan__sello', U.content('planes.recomendado')));
      var h = el('h3', 'plan__nombre', p.nombre); h.id = 'plan-' + p.id;
      art.appendChild(h);
      art.appendChild(el('p', 'plan__precio', p.precio));
      art.appendChild(el('p', 'plan__para', p.para));
      var ul = el('ul', 'plan__incluye');
      p.incluye.forEach(function (x) { ul.appendChild(el('li', null, x)); });
      art.appendChild(ul);
      var a = el('a', 'boton ' + (p.recomendado ? 'boton--oscuro' : 'boton--linea') + ' plan__boton', p.boton);
      a.href = '#contacto';
      a.dataset.ir = 'contacto';
      a.dataset.plan = p.id;
      art.appendChild(a);
      li.appendChild(art);
      ol.appendChild(li);
    });

    // Suben desde abajo, escalonadas 80 ms, con muelle (stiffness 170, damping 22).
    if (EV.mode !== 'cine' || EV.reducedMotion || !('IntersectionObserver' in window)) return;
    var items = Array.prototype.map.call(ol.children, function (li, i) {
      li.classList.add('plan--oculto');
      return { li: li, w: U.writer(li), s: U.spring(170, 22), go: false, i: i };
    });
    items.forEach(function (it) { it.s.set(0); it.w('transform', 'translate3d(0,140px,0) rotate(' + ((it.i - 1) * 2) + 'deg)'); it.w('opacity', '0'); });
    var running = false, t0 = 0;
    var io = new IntersectionObserver(function (en) {
      if (!en.some(function (e) { return e.isIntersecting; }) || running) return;
      running = true; io.disconnect();
      t0 = performance.now();
      var last = t0;
      var tick = function () {
        var now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
        var done = true;
        items.forEach(function (it) {
          var on = now - t0 > it.i * 80 ? 1 : 0;
          var x = it.s.step(on, dt);
          if (on < 1 || Math.abs(x - 1) > 1e-3 || Math.abs(it.s.v) > 1e-3) done = false;
          it.w('transform', 'translate3d(0,' + ((1 - x) * 140).toFixed(2) + 'px,0) rotate(' + ((1 - x) * (it.i - 1) * 2).toFixed(3) + 'deg)');
          it.w('opacity', Math.min(1, x * 1.6).toFixed(3));
        });
        if (done) {
          gsap.ticker.remove(tick);
          items.forEach(function (it) { it.li.classList.remove('plan--oculto'); it.li.style.transform = ''; it.li.style.opacity = ''; });
        }
      };
      gsap.ticker.add(tick);
    }, { threshold: 0.2 });
    io.observe(ol);
  }

  function tambien() {
    var ul = document.querySelector('[data-tambien]');
    if (!ul) return;
    (EV.util.content('tambien.filas') || []).forEach(function (f) {
      var li = el('li', 'fila');
      var a = el('a', 'fila__enlace');
      a.href = f.href;
      a.appendChild(el('span', 'fila__titulo', f.titulo));
      a.appendChild(el('span', 'fila__linea', f.linea));
      var ic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      ic.setAttribute('viewBox', '0 0 16 16'); ic.setAttribute('width', '16'); ic.setAttribute('height', '16');
      ic.setAttribute('aria-hidden', 'true'); ic.setAttribute('class', 'fila__icono');
      ic.innerHTML = '<path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/>';
      a.appendChild(ic);
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  function faq() {
    var box = document.querySelector('[data-faq]');
    if (!box) return;
    (EV.util.content('faq.items') || []).forEach(function (q) {
      var d = el('details', 'pregunta' + (q.pendiente ? ' pregunta--pendiente' : ''));
      var s = el('summary', 'pregunta__p');
      s.appendChild(el('span', null, q.p));
      var plus = el('span', 'pregunta__signo'); plus.setAttribute('aria-hidden', 'true');
      s.appendChild(plus);
      d.appendChild(s);
      d.appendChild(el('p', 'pregunta__r', q.r));
      box.appendChild(d);
    });
  }

  function contacto() {
    var C = window.EVIMES_CONFIG, U = EV.util;
    document.querySelectorAll('[data-email]').forEach(function (a) { a.href = 'mailto:' + C.email; a.textContent = C.email; });
    document.querySelectorAll('[data-telefono]').forEach(function (a) { a.href = C.telefonoHref; a.textContent = C.telefono; });
    var sel = document.querySelector('[data-plan-select]');
    var form = document.querySelector('[data-formulario]');
    if (!form) return;
    var ph = U.content('contacto.placeholders') || {};
    form.querySelector('[name=negocio]').placeholder = ph.negocio || '';
    form.querySelector('[name=nombre]').placeholder = ph.nombre || '';
    form.querySelector('[name=whatsapp]').placeholder = ph.whatsapp || '';
    var o0 = el('option', null, U.content('contacto.sinPlan')); o0.value = '';
    sel.appendChild(o0);
    (window.EVIMES_PLANES || []).forEach(function (p) { var o = el('option', null, p.nombre + ' · ' + p.precio); o.value = p.id; sel.appendChild(o); });
    // Plan preseleccionado desde los botones de los planes.
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-plan]');
      if (a) sel.value = a.dataset.plan;
    });
    var err = form.querySelector('[data-error]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, falta = [];
      ['negocio', 'nombre', 'whatsapp'].forEach(function (n) {
        var ok = f[n].value.trim().length > 1;
        f[n].setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) falta.push(form.querySelector('label[for="' + f[n].id + '"]').textContent.toLowerCase());
      });
      if (falta.length) {
        err.hidden = false;
        err.textContent = 'Falta ' + falta.join(', ') + '. Rellénalo y vuelve a enviarlo.';
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }
      err.hidden = true;
      var plan = sel.value ? sel.options[sel.selectedIndex].textContent : U.content('contacto.sinPlan');
      var txt = 'Hola, soy ' + f.nombre.value.trim() + '. Tengo un negocio de ' + f.negocio.value.trim() + '. Plan: ' + plan + '. Mi WhatsApp: ' + f.whatsapp.value.trim() + '.';
      // Sin backend todavía: WhatsApp si está configurado; si no, correo.
      if (C.whatsapp) window.open('https://wa.me/' + C.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      else location.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent('Propuesta web · ' + f.negocio.value.trim()) + '&body=' + encodeURIComponent(txt);
    });
  }

  function whatsapp() {
    var C = window.EVIMES_CONFIG, a = document.querySelector('[data-whatsapp]');
    if (!a || !C.whatsapp) return;   // vacío en config = sin botón
    a.href = 'https://wa.me/' + C.whatsapp.replace(/\D/g, '');
    a.hidden = false;
  }

  EV.secciones = {
    init: function () { datos(); planes(); tambien(); faq(); contacto(); whatsapp(); }
  };
})();
