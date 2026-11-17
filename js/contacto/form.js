/* ==========================================================================
   contacto/form.js — formulario de "¿Hacemos que se te vea?".
   · Envía a Web3Forms (POST JSON, sin backend). La clave va en js/config.js
     → WEB3FORMS_KEY (vacía en el repositorio: la pone Oscar). Vacía: el
     formulario valida igual y al enviar dice "Formulario en configuración".
   · Validación en línea (al salir del campo y al enviar), sin alertas;
     aria-invalid + aria-describedby; el foco va al primer error.
   · Plan preseleccionado desde ?plan=…, #contacto?plan=… o un botón con
     data-plan (EV.form.plan). "Soy…" desde los CTA de Con quién (EV.form.perfil).
   · Éxito: el formulario se sustituye por "Recibido. Te escribimos muy pronto."
     Error: mensaje claro + WhatsApp / email de config.js si están rellenos.
   ========================================================================== */
(function () {
  var EV = (window.EV = window.EV || {});
  var form = document.querySelector('[data-form]');
  if (!form) return;
  var caja = document.querySelector('[data-form-caja]');
  var estado = form.querySelector('[data-form-estado]');
  var boton = form.querySelector('.form__enviar'), sl = boton.querySelector('.sl');
  var cfg = window.EVIMES_CONFIG || {};
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var PLANES = { fundamento: 'Fundamento', inmersion: 'Inmersión', impacto: 'Impacto', 'aun-no': 'Aún no lo sé' };

  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- validación ---------- */
  var REGLAS = {
    nombre: function (v) { return v.trim().length >= 2 ? '' : 'Escribe tu nombre.'; },
    email: function (v) { v = v.trim(); if (!v) return 'Escribe tu email.'; return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Ese email no parece completo (falta algo como nombre@dominio.com).'; },
    telefono: function (v) { v = v.trim(); return !v || /^[+\d][\d\s().-]{6,}$/.test(v) ? '' : 'Revisa el teléfono (solo números, espacios y +).'; },
    mensaje: function (v) { return v.trim().length >= 10 ? '' : 'Cuéntanos un poco más (al menos una frase).'; },
    privacidad: function (v, el) { return el.checked ? '' : 'Necesitamos que aceptes la política de privacidad para poder responderte.'; }
  };
  function validar(nombre) {
    var el = form.elements[nombre], err = document.getElementById(el.id + '-err');
    var msg = REGLAS[nombre](el.value, el);
    var caja = el.closest('.campo, .casilla');
    err.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (caja) caja.classList.toggle('is-mal', !!msg);
    return !msg;
  }
  Object.keys(REGLAS).forEach(function (n) {
    var el = form.elements[n];
    el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox' || el.getAttribute('aria-invalid')) validar(n); });
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () { if (el.getAttribute('aria-invalid') === 'true') validar(n); });
  });

  /* ---------- preselección ---------- */
  function marcar(nombre, valor) {
    var r = form.querySelector('input[name="' + nombre + '"][value="' + valor + '"]');
    if (r) r.checked = true;
    return !!r;
  }
  EV.form = {
    plan: function (id) { if (id) marcar('plan', id); },
    perfil: function (v) { if (v) marcar('perfil', v); }
  };
  function planDeLaUrl() {
    var q = location.search.match(/[?&]plan=([a-z-]+)/) || location.hash.match(/[?&]plan=([a-z-]+)/);
    return q ? q[1] : null;
  }
  var inicial = planDeLaUrl();
  if (inicial && marcar('plan', inicial) && /^#contacto/.test(location.hash)) {
    // index.html#contacto?plan=… (desde planes.html): bajar al formulario y dejar el hash limpio
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]plan=[a-z-]+/, '') + '#contacto');
    addEventListener('load', function () {
      setTimeout(function () { if (EV.home && EV.home.ir) EV.home.ir('contacto'); else document.getElementById('contacto').scrollIntoView(); }, 60);
    });
  } else if (inicial && !location.hash && form.hasAttribute('data-form-ir')) {
    // contacto.html?plan=… (desde planes.html): bajar al formulario con el plan ya marcado
    addEventListener('load', function () {
      setTimeout(function () { var id = form.getAttribute('data-form-ir'); if (EV.home && EV.home.ir) EV.home.ir(id); else document.getElementById(id).scrollIntoView(); }, 120);
    });
  }
  // botones de los planes de la home (data-plan) y CTA de Con quién (data-perfil)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-plan], [data-perfil]');
    if (!a) return;
    if (a.dataset.plan) marcar('plan', a.dataset.plan);
    if (a.dataset.perfil) marcar('perfil', a.dataset.perfil);
  }, true);

  /* ---------- envío ---------- */
  function alternativas() {
    var out = [];
    if (cfg.whatsapp) out.push('<a href="https://wa.me/' + esc(cfg.whatsapp) + '" target="_blank" rel="noopener">escribirnos por WhatsApp</a>');
    if (cfg.email) out.push('<a href="mailto:' + esc(cfg.email) + '">mandarnos un email a ' + esc(cfg.email) + '</a>');
    return out.length ? '<p>Mientras tanto, puedes ' + out.join(' o ') + '.</p>' : '';
  }
  function avisar(html, error) { estado.className = 'form__estado' + (error ? ' is-error' : ''); estado.innerHTML = html; }
  function ocupado(on) {
    boton.disabled = on; boton.setAttribute('aria-busy', on ? 'true' : 'false');
    sl.textContent = on ? 'Enviando…' : 'Enviar';
  }
  function exito() {
    caja.innerHTML = '<div class="form__ok" role="status" aria-live="polite" tabindex="-1">' +
      '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="ok-anillo" cx="32" cy="32" r="30" fill="none" stroke="#00e5ff" stroke-width="2"/>' +
      '<path class="ok-check" d="M20 33.5 28.5 42 45 23" fill="none" stroke="#00e5ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<h3 class="display">Recibido. Te escribimos muy pronto.</h3></div>';
    var ok = caja.querySelector('.form__ok'); if (ok) ok.focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    estado.textContent = '';
    var malos = Object.keys(REGLAS).filter(function (n) { return !validar(n); });
    if (malos.length) {
      avisar('<p>Revisa ' + (malos.length === 1 ? 'el campo marcado' : 'los ' + malos.length + ' campos marcados') + '.</p>', true);
      form.elements[malos[0]].focus();
      return;
    }
    if (form.elements.botcheck.checked) return;              // bot
    if (!cfg.WEB3FORMS_KEY) {
      avisar('<p>Formulario en configuración: todavía no puede enviar mensajes.</p>' + alternativas(), true);
      return;
    }
    var perfil = form.querySelector('input[name="perfil"]:checked'), plan = form.querySelector('input[name="plan"]:checked');
    var datos = {
      access_key: cfg.WEB3FORMS_KEY,
      subject: 'Nueva propuesta desde evimesweb.com',
      from_name: 'evimesweb.com',
      botcheck: false,
      nombre: form.elements.nombre.value.trim(),
      email: form.elements.email.value.trim(),
      telefono: form.elements.telefono.value.trim() || '—',
      soy: perfil ? perfil.value : '—',
      plan: plan ? PLANES[plan.value] : '—',
      mensaje: form.elements.mensaje.value.trim(),
      privacidad: 'Aceptada'
    };
    ocupado(true);
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(datos) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.success !== false, j: j }; }); })
      .then(function (res) {
        if (res.ok) { exito(); return; }
        ocupado(false);
        avisar('<p>No hemos podido enviar el mensaje. Vuelve a intentarlo en un momento.</p>' + alternativas(), true);
      })
      .catch(function () {
        ocupado(false);
        avisar('<p>No hay conexión o el servicio no responde. Vuelve a intentarlo en un momento.</p>' + alternativas(), true);
      });
  });
})();
