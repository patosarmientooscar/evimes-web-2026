/* ==========================================================================
   paginas/faq.js — preguntas frecuentes en acordeón (servicios y planes).
   [data-faq="EVIMES_FAQ_…"] se repinta desde ese archivo de datos; el HTML
   trae lo mismo (SEO y sin JS). El acordeón lo activa js/paginas/paginas.js
   (por eso este script va antes).
   ========================================================================== */
(function (raiz) {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function faq(F, pref) {
    return F.map(function (q, i) {
      var id = (pref || 'faq') + '-' + (i + 1);
      return '<div class="faq__item"><h3><button type="button" class="faq__p" aria-expanded="false" aria-controls="' + id + '" data-acordeon><span>' + esc(q.p) + '</span><i aria-hidden="true"></i></button></h3>' +
        '<div class="faq__r" id="' + id + '" hidden><p>' + esc(q.r) + '</p></div></div>';
    }).join('');
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { faq: faq }; return; }
  Array.prototype.forEach.call(raiz.document.querySelectorAll('[data-faq]'), function (n) {
    var F = raiz[n.getAttribute('data-faq')];
    if (F && F.length) n.innerHTML = faq(F, n.getAttribute('data-faq-id'));
  });
})(typeof window !== 'undefined' ? window : this);
