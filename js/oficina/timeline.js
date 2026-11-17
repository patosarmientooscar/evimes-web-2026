/* ==========================================================================
   oficina/timeline.js — update(dt) con el progreso del scroll (0 → 1).
   Portado tal cual del prototipo aprobado (Downloads/evimes-oficina/index.html):
   ventana 0–0.16 · EVIMES 0.12–0.18 (dos parpadeos) · cap1 0.17–0.28 ·
   un único movimiento suave hacia el monitor 0.24–0.5 · pantalla 0.28–0.4 ·
   la web sube desde la pantalla como una card 0.38–0.56 · indicadores de
   PageSpeed 0.5–0.66 · texto de Disco desde 0.56 · cierre en card 0.9–1.
   Dentro de la card la web hace scroll sola (baja por sus 4 secciones y vuelve
   a subir, en bucle, con pausas). Los indicadores (HTML + SVG) se colocan cada
   fotograma proyectando los bordes de la card y su tamaño sigue al de la card.
   El progreso (tP) lo pone index.js leyendo Lenis; aquí se suaviza igual.
   ========================================================================== */
import { SPOT, PROJECT } from './config.js';
import { THREE, dir, D2R } from './scene.js';
import { CWd, CHt } from './card.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), seg = (p, a, b) => clamp((p - a) / (b - a)),
      ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, eio = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, mix = (a, b, t) => a + (b - a) * t;

export function crearTimeline(E, K, dom, opts = {}) {
  const { renderer, camera, PU, SU, WU, steamU } = E, { mR, mU, mN, mC, mW, mH } = E.mon;
  const { card, face, slab, edge, CU, BU } = K;
  const { win, caps, scrim, hud, psi } = dom;
  const reduce = !!opts.reduce;
  let autoT = 0, P = 0, tP = 0, mx = 0, my = 0, tmx = 0, tmy = 0, W = 1, H = 1, mobile = false, t = 0, hov = 0, thov = 0, hx = 0, hy = 0, abierta = 0;
  const ptr = new THREE.Vector2(-9, -9), ray = new THREE.Raycaster();
  function puntero(e) { const r = win.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width * 2 - 1; tmy = -((e.clientY - r.top) / r.height * 2 - 1); ptr.set(tmx, tmy); }
  function resize(w, h) { W = w; H = h; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); mobile = W / H < .9; }
  const monYaw = (SPOT.monitor.tl[0] + SPOT.monitor.tr[0]) / 2, monPitch = (SPOT.monitor.tl[1] + SPOT.monitor.bl[1]) / 2;
  const qMon = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(mR, mU, mN));
  const look = new THREE.Vector3();

  /* PageSpeed scores, docked to the sides of the card and sized to it */
  const gauges = [...psi.querySelectorAll('.g')].map(el => ({ el, v: +el.dataset.v, b: el.querySelector('b'), ar: el.querySelector('.ar') })), pill = psi.querySelector('.pill');
  const pv = new THREE.Vector3();
  const toScr = (x, y) => { pv.set(x, y, 0); card.localToWorld(pv); pv.project(camera); return [(pv.x * .5 + .5) * W, (-pv.y * .5 + .5) * H]; };
  function updPSI() {
    card.updateMatrixWorld();
    const L = toScr(-CWd / 2, 0), Rt = toScr(CWd / 2, 0), T = toScr(0, CHt / 2), Bt = toScr(0, -CHt / 2);
    const ch = Math.hypot(T[0] - Bt[0], T[1] - Bt[1]);
    const close = 1 - seg(P, .9, .96);
    let size, pos;
    if (!mobile) { size = Math.max(70, Math.min(170, ch * .42)); const g = size * .3, dy = size * .6;
      pos = [[L[0] - g - size / 2, L[1] - dy], [L[0] - g - size / 2, L[1] + dy], [Rt[0] + g + size / 2, Rt[1] - dy], [Rt[0] + g + size / 2, Rt[1] + dy]]; }
    else { size = Math.min(84, W * .2); const y = Bt[1] + size * .25 + size / 2; pos = [.14, .38, .62, .86].map(f => [W * f, y]); }
    gauges.forEach((g, i) => { const a = ease(seg(P, .5 + i * .025, .58 + i * .025)) * close; const cnt = eio(seg(P, .52 + i * .025, .66 + i * .025));
      g.el.style.setProperty('--s', size + 'px'); g.el.style.opacity = a.toFixed(3);
      g.el.style.transform = `translate(${pos[i][0] - size / 2}px,${pos[i][1] - size / 2}px) scale(${(.8 + .2 * a).toFixed(3)})`;
      g.b.textContent = Math.round(g.v * cnt); g.ar.style.strokeDashoffset = (263.9 * (1 - g.v / 100 * cnt)).toFixed(1); });
    const pa = ease(seg(P, .6, .66)) * close; const pw = pill.offsetWidth || 220;
    const py = mobile ? pos[0][1] + size / 2 + 16 : Bt[1] + Math.max(18, ch * .07);
    pill.style.opacity = pa.toFixed(3); pill.style.transform = `translate(${Bt[0] - pw / 2}px,${py}px)`;
  }

  function update(dt) {
    t += dt; SU.uT.value = t; steamU.uT.value = t; BU.uT.value = t; WU.uT.value = t; CU.uT.value = t;
    P += (tP - P) * (1 - Math.pow(.0009, dt));
    const k5 = 1 - Math.pow(.05, dt); mx += (tmx - mx) * k5; my += (tmy - my) * k5;
    // phases
    const A = ease(seg(P, 0, .16));            // window opens
    const C = eio(seg(P, .24, .5));            // one calm move toward the monitor
    const B = seg(P, .28, .4);                 // screen boots
    const Ec = ease(seg(P, .38, .56));         // the site rises out of the screen as a card
    const X = ease(seg(P, .9, 1));             // close back into a card, and stay
    // window shape
    const ins = Math.max(1 - A, X * .5);
    abierta = 1 - ins;
    win.style.setProperty('--it', `${ins * 14}vh`); win.style.setProperty('--ib', `${ins * 14}vh`); win.style.setProperty('--ix', `${ins * (mobile ? 8 : 12)}vw`); win.style.setProperty('--r', `${Math.min(1, ins * 2) * 30}px`);
    win.style.setProperty('--edge', String(Math.min(1, ins * 2)));
    // camera path
    let yaw = mix(-6, 2, A), pitch = mix(2, -4, A), fov = mix(90, 76, A);
    yaw = mix(yaw, monYaw, C); pitch = mix(pitch, monPitch + 6, C); fov = mix(fov, 70, C);   // se queda lejos: la mesa, el monitor y EVIMES siempre en cuadro
    const cardPitch = mobile ? monPitch + 13 : monPitch + 8;
    pitch = mix(pitch, cardPitch, Ec); fov = mix(fov, mobile ? 66 : 64, Ec); yaw = mix(yaw, monYaw, Ec);
    pitch = mix(pitch, monPitch + 7, X); fov = mix(fov, mobile ? 74 : 68, X);
    if (mobile) fov = Math.min(100, fov * 1.3);
    const lookAmt = reduce ? 0 : (1 - C * .6) + Ec * .5;
    yaw += mx * 7 * lookAmt; pitch += my * 3.5 * lookAmt;
    camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(dir(yaw, pitch, look)); camera.updateMatrixWorld();
    // light and screen
    SU.uBoot.value = B;
    PU.uSpill.value = B * .6 - Ec * 1.2 + Ec * .35; PU.uDim.value = mix(.55, 0, A) * 1 + Ec * .2 * (1 - X) + X * .05; PU.uSat.value = mix(1, .9, Ec);
    steamU.uA.value = A * (1 - C * .7);
    // EVIMES lights up as the window finishes opening, with two quick flickers
    const ig = seg(P, .12, .18); WU.uOn.value = ig <= 0 ? 0 : ig >= 1 ? 1 : (ig < .25 ? .9 : ig < .4 ? .15 : ig < .55 ? 1 : ig < .65 ? .35 : 1);
    // the card: starts as the screen itself, then lifts up and toward us
    const cs0 = mW * .94 / CWd, cs1 = (mobile ? mW * .85 : mW * .6) / CWd;
    const s = mix(cs0, cs1, Ec);
    const endUp = mH * .5 + CHt * cs1 * .52, endZ = mobile ? 1.2 : 1.7;
    card.position.copy(mC).addScaledVector(mU, mix(0, endUp, Ec)).addScaledVector(mN, mix(.02, endZ, Ec) + Math.sin(Ec * Math.PI) * .8);
    card.position.addScaledVector(mU, Math.sin(t * .8) * .025 * Ec).addScaledVector(mR, mx * .08 * Ec);
    // hover: the card tilts toward the pointer like a real pane of glass
    ray.setFromCamera(ptr, camera); const hit = Ec > .95 && X < .5 ? ray.intersectObject(face)[0] : null;
    thov = hit ? 1 : 0; hov += (thov - hov) * (1 - Math.pow(.004, dt)); if (hit) { hx = hit.uv.x - .5; hy = hit.uv.y - .5; }
    card.quaternion.copy(qMon); card.rotateX(-.06 * Ec + (-hy * .16 * hov) + my * .03 * Ec); card.rotateY(hx * .2 * hov + mx * .06 * Ec); card.rotateZ(Math.sin(t * .6) * .005 * Ec);
    card.scale.setScalar(s * (1 + hov * .035));
    card.visible = Ec > 0;
    CU.uA.value = 1; CU.uLight.value = seg(P, .37, .45);
    slab.material.opacity = Ec; edge.material.opacity = Ec; slab.visible = edge.visible = Ec > .02;
    BU.uA.value = (Ec * .45 + hov * .3) * (1 - X * .3);
    // inside the card the site scrolls by itself, down and back up, pausing on each section
    if (Ec > .9 && !reduce) autoT += dt;
    { const n = PROJECT.frames - 1, cyc = autoT * .3, st = Math.floor(cyc), ph = cyc - st, k = st % (2 * n), up = k < n, base = up ? k : 2 * n - k; CU.uFrame.value = base + (up ? 1 : -1) * eio(clamp((ph - .5) / .5)); }
    CU.uSheen.value = -.6 + ((t * .12) % 1) * 2.6 + hx * .4 * hov;
    // copy
    const c1 = seg(P, .17, .2) * (1 - seg(P, .25, .28)), c2 = seg(P, .56, .61);
    caps[0].style.opacity = c1; caps[0].style.transform = `translateY(${(1 - c1) * 24}px)`;
    caps[1].style.opacity = c2; caps[1].style.transform = `translateY(${(1 - c2) * 24}px)`;
    caps[1].classList.toggle('is-on', c2 > .5);
    scrim.style.setProperty('--scrim', Math.max(c1, c2)); hud.style.opacity = seg(P, .16, .18) * (1 - seg(P, .24, .26));
    updPSI();
  }

  return {
    update, resize, puntero,
    progreso(v) { tP = clamp(v); },
    // Salta a un progreso y lo asienta (solo ?oficina=captura y QA).
    asentar(v, hover) { tP = P = clamp(v); if (hover) ptr.set(0, .25); for (let i = 0; i < 120; i++) update(1 / 60); },
    get P() { return P; }, get abierta() { return abierta; }, get hovered() { return hov > .5; }, get mobile() { return mobile; }
  };
}
