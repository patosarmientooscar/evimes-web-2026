/* ==========================================================================
   oficina/index.js — arranque de "Trabajo selecto" + la oficina (#oficina-slot).
   · Textos: js/data/oficina.js (BORRADOR) → [data-of]. "[palabra]" = en cian.
   · PageSpeed: js/data/pagespeed.js → los 4 indicadores y la píldora (role="img").
   · El enlace real a Disco es el botón "Ver la web →" de cap2 (y la card del
     canvas abre la misma web al hacer clic).
   · Three.js y el panorama se cargan con la sección a 1 pantalla (IO con
     rootMargin); mientras, la ventana enseña la foto desenfocada (WebP).
   · Un solo bucle (dentro de gsap.ticker, el bucle único de la web; si no
     hay GSAP, requestAnimationFrame) que se para con la sección fuera (IO).
   · El progreso sale de Lenis (posiciones cacheadas) y se suaviza en timeline.js.
   · Mientras la ventana cubre la pantalla, cabecera oscura (EV.cabeceraOscura).
   · Versión fija (movimiento reducido, ahorro de datos, ?modo=fijo) o sin
     WebGL: la oficina en una card con la web de Disco encima, los indicadores
     quietos, el texto y el enlace.
   · ?oficina=captura: rehace esa foto y la posición de la card (window.__oficinaCaptura).
   ========================================================================== */
import { PROJECT, FIJA } from './config.js';

const EV = (window.EV = window.EV || {});
const track = document.querySelector('[data-oficina]');
const PSI = window.EVIMES_PAGESPEED || null;
const MEDIDAS = [['rendimiento', 'Rendimiento'], ['accesibilidad', 'Accesibilidad'], ['buenasPracticas', 'Prácticas recomendadas'], ['seo', 'SEO']];

function init() {
  textos();
  pageSpeed();
  const captura = new URLSearchParams(location.search).get('oficina') === 'captura';
  if (!captura && (EV.mode === 'still' || !hayWebGL())) { fija(); return; }
  const cerca = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    cerca.disconnect();
    arrancar(captura).catch(err => { console.warn('[oficina]', err); fija(); });
  }, { rootMargin: '100% 0px' });
  cerca.observe(track);
}

function esc(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function textos() {
  const T = window.EVIMES_OFICINA; if (!T) return;
  document.querySelectorAll('[data-of]').forEach(el => {
    const v = el.dataset.of.split('.').reduce((o, k) => (o ? o[k] : undefined), T);
    if (typeof v !== 'string' || !v) return;
    el.innerHTML = esc(v).replace(/\[([^\]]+)\]/g, '<span class="accent">$1</span>');
  });
}

/* ---------- PageSpeed: 4 círculos (anillo cian → blanco, número, etiqueta) y la píldora ---------- */
const etiquetaPSI = D => `${D.fuente} de ${D.url.replace(/^https?:\/\//, '')} (${D.fecha}): ` + MEDIDAS.map(([k, n]) => `${n.toLowerCase()} ${D[k]}`).join(', ') + `. Agentic Browsing ${D.agentic}.`;
function gaugesHTML(D, id, final) {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="psiG-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00e5ff"/><stop offset=".6" stop-color="#8ff4ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs></svg>` +
    MEDIDAS.map(([k, n]) => `<div class="g" data-v="${D[k]}" aria-hidden="true"><svg class="ring" viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="42"/><circle class="ar" cx="50" cy="50" r="42" stroke="url(#psiG-${id})"${final ? ` style="stroke-dashoffset:${(263.9 * (1 - D[k] / 100)).toFixed(1)}"` : ''}/></svg><b>${final ? D[k] : 0}</b><span>${n}</span></div>`).join('') +
    `<div class="pill" aria-hidden="true"><i></i>Agentic Browsing <b>${esc(D.agentic)}</b><em>PageSpeed Insights</em></div>`;
}
function pageSpeed() {
  const el = track.querySelector('[data-psi]'); if (!el) return;
  if (!PSI) { el.remove(); return; }
  el.setAttribute('aria-label', etiquetaPSI(PSI));
  el.innerHTML = gaugesHTML(PSI, 'vivo', false);
}

function hayWebGL() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch (e) { return false; }
}

/* ---------- versión fija: la oficina en card + la web de Disco + indicadores quietos ---------- */
function fija() {
  track.classList.add('is-fija');
  const win = track.querySelector('.window');
  const vivo = track.querySelector('[data-psi]'); if (vivo) vivo.remove();
  // los indicadores en % de la imagen, colocados como en vivo (a los lados de la card; en móvil, en fila debajo)
  const psiFija = (k, F) => {
    if (!PSI) return '';
    const r = F.card, ar = F.ar, movil = k === 'movil';
    const sW = movil ? 20 : r.h / ar * .42, sH = sW * ar;                       // tamaño en % del ancho y del alto
    let pos;
    if (!movil) { const g = sW * .3, cy = r.y + r.h / 2, dy = sH * .6;
      pos = [[r.x - g - sW, cy - dy], [r.x - g - sW, cy + dy], [r.x + r.w + g, cy - dy], [r.x + r.w + g, cy + dy]].map(([x, y]) => [x, y - sH / 2]); }
    else { const y = r.y + r.h + sH * .25; pos = [.14, .38, .62, .86].map(f => [f * 100 - sW / 2, y]); }
    const pillY = movil ? pos[0][1] + sH + 2.2 : r.y + r.h + 2.5;
    return `<div class="psi psi--fija" role="img" aria-label="${esc(etiquetaPSI(PSI))}" style="--fs:${sW.toFixed(2)}cqw">${gaugesHTML(PSI, k, true)}</div>`
      .replace(/<div class="g"/g, (m => { let i = 0; return () => `<div class="g" style="left:${pos[i][0]}%;top:${pos[i++][1]}%"`; })())
      .replace('<div class="pill"', `<div class="pill" style="left:50%;top:${pillY}%"`);
  };
  const vista = (k, F) => { const r = F.card;
    return `<div class="fija fija--${k}" style="--ar:${F.ar}">
      <img class="fija__foto" src="${F.img}" alt="La oficina de Evimes: la mesa con el monitor encendido y la pared navy con EVIMES en cian." loading="lazy" decoding="async">
      <a class="fweb" href="${PROJECT.url}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true" style="left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%;background-image:url(${PROJECT.strip});background-size:100% ${PROJECT.frames * 100}%"></a>
      ${psiFija(k, F)}</div>`; };
  const div = document.createElement('div');
  div.className = 'fija-vistas';
  div.innerHTML = vista('escritorio', FIJA.escritorio) + vista('movil', FIJA.movil);
  win.prepend(div);
}

/* ---------- la oficina en vivo ---------- */
async function arrancar(captura) {
  const [{ crearEscena, THREE }, { crearCard, CWd, CHt }, { crearTimeline }] = await Promise.all([import('./scene.js'), import('./card.js'), import('./timeline.js')]);
  const win = track.querySelector('.window'), cv = win.querySelector('canvas');
  const dom = { win, caps: [win.querySelector('[data-cap="1"]'), win.querySelector('[data-cap="2"]')], scrim: win.querySelector('.scrim'), hud: win.querySelector('.hud'),
    psi: win.querySelector('[data-psi]') || document.createElement('div') };
  const movil = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  const E = crearEscena(cv, { captura, movil });
  const K = crearCard(E);
  const tl = crearTimeline(E, K, dom, { reduce: !!EV.reducedMotion });
  E.panoListo.then(() => win.classList.add('is-lista')).catch(() => {});

  // medidas cacheadas: el progreso sale del scroll de Lenis sin leer el layout por fotograma
  let top = 0, alto = 1, vh = innerHeight;
  const scrollY = () => { const l = EV.home && EV.home.lenis; return l ? l.scroll : window.scrollY; };
  const medir = () => { const r = track.getBoundingClientRect(); top = r.top + scrollY(); alto = r.height; vh = innerHeight; tl.resize(win.clientWidth || innerWidth, win.clientHeight || innerHeight); };
  medir();
  addEventListener('resize', medir);
  new ResizeObserver(medir).observe(document.querySelector('main') || document.body);
  const leer = () => { const y = scrollY(); tl.progreso((y - top) / Math.max(1, alto - vh)); return y; };

  // Solo lectura (QA y otros módulos): el progreso de la oficina.
  EV.oficina = { get P() { return tl.P; }, get hover() { return tl.hovered; } };
  let running = false, cursor = false;
  addEventListener('pointermove', e => tl.puntero(e), { passive: true });
  cv.addEventListener('click', () => { if (tl.hovered) window.open(PROJECT.url, '_blank', 'noopener'); });

  if (captura) {
    await Promise.all([E.listo, K.listo, document.fonts.ready]);
    const v = new THREE.Vector3();
    window.__oficinaCaptura = (p = .76) => {
      medir(); tl.asentar(p); E.camera.updateMatrixWorld(); K.card.updateMatrixWorld(true);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]].forEach(([x, y]) => { v.set(x * CWd, y * CHt, 0).applyMatrix4(K.face.matrixWorld).project(E.camera);
        const px = (v.x + 1) / 2 * 100, py = (1 - v.y) / 2 * 100; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); });
      K.card.visible = false; E.renderer.render(E.scene, E.camera);
      const img = E.renderer.domElement.toDataURL('image/png'); K.card.visible = true;
      return { img, card: { x: +x0.toFixed(2), y: +y0.toFixed(2), w: +(x1 - x0).toFixed(2), h: +(y1 - y0).toFixed(2) } };
    };
    return;
  }

  new IntersectionObserver(es => { running = es[0].isIntersecting; if (!running) EV.cabeceraOscura = false; }, { rootMargin: '300px' }).observe(track);
  const frame = dt => {
    if (!running) return;
    const y = leer();
    tl.update(dt);
    E.renderer.render(E.scene, E.camera);
    if (tl.hovered !== cursor) { cursor = tl.hovered; cv.style.cursor = cursor ? 'pointer' : ''; }
    // cabecera oscura mientras la ventana abierta cubre su franja
    EV.cabeceraOscura = tl.abierta > .6 && (top + alto - y) > 90;
  };
  if (window.gsap) gsap.ticker.add((time, dms) => frame(Math.min(.05, (dms || 16.7) / 1000)));
  else { let last = performance.now(); const f = now => { requestAnimationFrame(f); const dt = Math.min(.05, (now - last) / 1000); last = now; frame(dt); }; requestAnimationFrame(f); }
}

// Al final: las const de arriba (etiquetaPSI…) ya existen cuando arranca.
if (track) init();
