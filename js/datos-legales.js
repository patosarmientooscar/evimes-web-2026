/* ==========================================================================
   datos-legales.js — email y teléfono del titular en los textos legales.
   No van escritos en el HTML (el repositorio es público): salen de
   js/config.js (email, telefono, telefonoHref). Mientras estén vacíos, la
   línea no se muestra. El texto legal no cambia: solo se rellena el dato.
   ========================================================================== */
(function () {
  var C = window.EVIMES_CONFIG || {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-dato]'), function (li) {
    var k = li.getAttribute('data-dato'), v = C[k];
    if (!v) return;
    var a = li.querySelector('a'), s = li.querySelector('[data-valor]');
    if (a) { a.textContent = v; a.href = k === 'email' ? 'mailto:' + v : (C.telefonoHref || 'tel:' + String(v).replace(/\s/g, '')); }
    else if (s) s.textContent = v;
    li.hidden = false;
  });
})();
