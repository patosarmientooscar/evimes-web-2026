/* ==========================================================================
   oficina/scene.js — renderer, panorama, letrero EVIMES, pantalla y vapor.
   Portado tal cual del prototipo aprobado (Downloads/evimes-oficina/index.html):
   · Panorama equirectangular con uDim, uSat y uSpill (la habitación iluminada
     por la pantalla: dos lóbulos alrededor del monitor, más fuertes en lo claro).
   · Entorno PMREM sacado de la propia foto (el cromo de la card la refleja).
   · EVIMES en cian retroiluminado: una textura con letras (R), halo (G) y
     sombra de contacto (B); caras de metal apagadas → acrílico cian encendido.
   · Pantalla: encendido (una línea que se abre), rayos + EH.
   · Vapor de la taza.
   Cambios de estructura: los vectores salen de assets/logo/ (no en línea), el
   panorama es 4K o 4096 según la GPU (config.js) y el túnel del prototipo
   (uWarp, siempre 0) no se porta.
   Three.js 0.160.0: la MISMA URL que js/fondo/onda.js y js/bento/.
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { elegirPano, LOGO, SPOT } from './config.js';

export { THREE };
export const D2R = Math.PI / 180;
export const dir = (yaw, pitch, out = new THREE.Vector3()) => out.set(Math.sin(yaw * D2R) * Math.cos(pitch * D2R), Math.sin(pitch * D2R), -Math.cos(yaw * D2R) * Math.cos(pitch * D2R));

// El path real de un SVG del proyecto.
const leerPath = url => fetch(url).then(r => r.text()).then(txt => new DOMParser().parseFromString(txt, 'image/svg+xml').querySelector('path').getAttribute('d'));

export const quadGeo = P => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P.flatMap(p => p.toArray()), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
const D = 10;
// a flat quad that sits exactly on 4 points of the photo (returned bl,br,tr,tl)
export function quadOn(c, dist = D) { const pts = [c.tl, c.tr, c.br, c.bl].map(a => dir(a[0], a[1])); const n = new THREE.Vector3(); pts.forEach(p => n.add(p)); n.normalize();
  const P = pts.map(p => p.clone().multiplyScalar(dist / p.dot(n))); return { P: [P[3], P[2], P[1], P[0]], TL: P[0], TR: P[1], BR: P[2], BL: P[3], n }; }
const box = (c, w, h) => ({ tl: [c[0] - w / 2, c[1] + h / 2], tr: [c[0] + w / 2, c[1] + h / 2], br: [c[0] + w / 2, c[1] - h / 2], bl: [c[0] - w / 2, c[1] - h / 2] });
const VS = `varying vec2 vUv;varying vec3 vD;void main(){vUv=uv;vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const PANO_GLSL = `uniform sampler2D uTex;
  vec2 eqUV(vec3 d){d=normalize(d);return vec2(atan(d.x,-d.z)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);}`;

function svgCanvas(d, vb, W, H, pad, fill = '#fff') {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(img, pad, pad, W - 2 * pad, H - 2 * pad); res(c); }; img.onerror = rej;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><path fill="${fill}" fill-rule="evenodd" d="${d}"/></svg>`); });
}

export function crearEscena(cv, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.captura });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(56, 1, .05, 200);

  /* ================= panorama (+ light spilled by the monitor) ================= */
  const MON = quadOn(SPOT.monitor);
  const mC = new THREE.Vector3().add(MON.TL).add(MON.TR).add(MON.BR).add(MON.BL).multiplyScalar(.25);
  const PU = { uTex: { value: null }, uDim: { value: 0 }, uSat: { value: 1 }, uSpill: { value: 0 }, uMon: { value: mC.clone().normalize() }, uSpillCol: { value: new THREE.Color(.16, .45, 1.) } };
  const pano = new THREE.Mesh(new THREE.SphereGeometry(60, 96, 64), new THREE.ShaderMaterial({ uniforms: PU, side: THREE.BackSide, depthWrite: false, vertexShader: VS,
    fragmentShader: `varying vec3 vD;uniform float uDim,uSat,uSpill;uniform vec3 uMon,uSpillCol;${PANO_GLSL}
    void main(){vec3 c=texture2D(uTex,eqUV(vD)).rgb;float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,uSat);
      float k=max(dot(normalize(vD),uMon),0.);c+=uSpillCol*(pow(k,14.)*.55+pow(k,60.)*.8)*uSpill*(.35+l);   // the room lit by the screen
      c=mix(c,vec3(.027,.039,.075),uDim);gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }` }));
  pano.renderOrder = -10; scene.add(pano);
  let panoRes, panoRej; const panoListo = new Promise((r, j) => { panoRes = r; panoRej = j; });
  const panoTex = new THREE.TextureLoader().load(elegirPano(renderer.capabilities.maxTextureSize, !!opts.movil), t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true;
    const eq = t.clone(); eq.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(eq).texture; pm.dispose();
    panoRes(); }, undefined, e => panoRej(e));
  panoTex.colorSpace = THREE.SRGBColorSpace; PU.uTex.value = panoTex;

  /* ================= EVIMES: cyan, back-lit letters on the navy wall ================= */
  const WU = { uTex: PU.uTex, uM: { value: null }, uOn: { value: 0 }, uPx: { value: new THREE.Vector2() }, uT: { value: 0 } };
  const pared = (async () => {
    const WM_D = await leerPath(LOGO.wordmark);
    const W = 2048, pad = 260, lh = Math.round((W - 2 * pad) * 261 / 1442), H = lh + 2 * pad;
    const m = await svgCanvas(WM_D, '0 0 1442 261', W, H, pad);
    // pack: R = letters, G = wide halo on the wall, B = soft contact shadow below the letters
    const out = document.createElement('canvas'); out.width = W; out.height = H; const g = out.getContext('2d');
    const chan = (src, blur, dx, dy, col) => { const t = document.createElement('canvas'); t.width = W; t.height = H; const tg = t.getContext('2d'); tg.filter = `blur(${blur}px)`; tg.drawImage(src, dx, dy);
      tg.filter = 'none'; tg.globalCompositeOperation = 'source-in'; tg.fillStyle = col; tg.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.drawImage(t, 0, 0); };
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); chan(m, 0, 0, 0, '#f00'); chan(m, 70, 0, 0, '#0f0'); chan(m, 26, 0, 0, '#0f0'); chan(m, 9, 10, 22, '#00f');
    const tex = new THREE.CanvasTexture(out); tex.anisotropy = 8; WU.uM.value = tex; WU.uPx.value.set(1 / W, 1 / H);
    const wDeg = 21 * W / (W - 2 * pad), hDeg = wDeg * H / W;
    const q = quadOn(box(SPOT.wall, wDeg, hDeg), 20);
    const mesh = new THREE.Mesh(quadGeo(q.P), new THREE.ShaderMaterial({ uniforms: WU, transparent: true, depthWrite: false, vertexShader: VS,
      fragmentShader: `varying vec2 vUv;varying vec3 vD;uniform sampler2D uM;uniform vec2 uPx;uniform float uOn,uT;${PANO_GLSL}
      void main(){vec3 c=texture2D(uTex,eqUV(vD)).rgb;vec4 k=texture2D(uM,vUv);float m=k.r,halo=k.g,sh=k.b;
        vec3 cyan=vec3(0.,.86,1.);
        // the letters stand 3 cm off the wall: a soft shadow below, light spilling onto the paint around them
        c*=1.-sh*(1.-m)*.45;
        c+=cyan*halo*halo*.55*uOn+c*cyan*halo*.9*uOn;
        // letter faces: brushed metal when off, glowing cyan acrylic when on; top edge catches the ceiling light
        float top=clamp(m-texture2D(uM,vUv+vec2(0.,uPx.y*6.)).r,0.,1.);
        vec3 off=vec3(.10,.13,.20)+top*.25;
        float grain=.94+.06*sin(vUv.x*2400.+sin(vUv.y*90.)*3.);
        vec3 on=mix(cyan,vec3(.85,1.,1.),.35+.35*smoothstep(.3,1.,vUv.y))*1.55*grain+top*.4;
        vec3 face=mix(off,on,uOn);
        vec3 o=mix(c,face,m);
        float a=clamp(max(m,max(halo*2.5*uOn,sh*2.)),0.,1.);
        gl_FragColor=vec4(o,a);
        #include <colorspace_fragment>
      }` }));
    mesh.renderOrder = -5; scene.add(mesh);
  })();

  /* ================= the monitor screen: boot → rays + EH ================= */
  const mR = new THREE.Vector3().subVectors(MON.TR, MON.TL); const mW = mR.length(); mR.normalize();
  const mU = new THREE.Vector3().subVectors(MON.TL, MON.BL); const mH = mU.length(); mU.normalize();
  const mN = new THREE.Vector3().crossVectors(mR, mU).normalize();
  const SU = { uBoot: { value: 0 }, uT: { value: 0 }, uLogo: { value: new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1) }, uAr: { value: mW / mH } }; SU.uLogo.value.needsUpdate = true;
  let logo;
  {
    const P = MON.P.map(p => p.clone().lerp(mC, .03));
    const screen = new THREE.Mesh(quadGeo(P), new THREE.ShaderMaterial({ uniforms: SU, transparent: true, depthWrite: false, toneMapped: false,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vUv;uniform float uBoot,uT,uAr;uniform sampler2D uLogo;
      float h1(float n){return fract(sin(n)*43758.5453);}
      float rays(float a,float n,float seed,float sp){float x=(a/6.2831853+.5)*n+uT*sp;float i=floor(x),f=fract(x);
        return mix(.25,1.,h1(i*1.7+seed))*smoothstep(mix(.04,.22,h1(i+seed)),0.,abs(f-.5));}
      void main(){vec2 p=(vUv-.5)*vec2(uAr,1.);float r=length(p);float a=atan(p.y,p.x);
        vec3 navy=vec3(.027,.039,.075),blue=vec3(.17,.33,1.),cyan=vec3(0.,.9,1.);
        vec3 c=navy+blue*rays(a,48.,3.1,.01)*.6/(1.+r*r*8.)+cyan*rays(a+.35,64.,7.3,-.014)*.35/(1.+r*r*10.)+mix(blue,cyan,.5)*exp(-r*r*10.)*.5;
        float lg=texture2D(uLogo,vUv).r;c=mix(c,vec3(.93,.95,1.),lg*.95);
        c*=.96+.04*sin(vUv.y*700.);
        float open=smoothstep(0.,.5,uBoot);float band=smoothstep(open*.5+.003,open*.5-.003,abs(vUv.y-.5))*smoothstep(0.,.08,uBoot);
        gl_FragColor=vec4(c*band,band);}` }));
    screen.renderOrder = -4; scene.add(screen);
    logo = leerPath(LOGO.eh).then(EH_D => svgCanvas(EH_D, '0 0 1566 780', 1024, Math.round(1024 / (mW / mH)), 0)).then(c => {
      const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const g = o.getContext('2d'); const w = o.width * .2, h = w * 780 / 1566;
      g.drawImage(c, 0, 0, c.width, c.height, (o.width - w) / 2, (o.height - h) / 2, w, h); SU.uLogo.value = new THREE.CanvasTexture(o); });
  }

  /* ================= steam over the mug ================= */
  const steamU = { uT: { value: 0 }, uA: { value: 0 } };
  scene.add(new THREE.Mesh(quadGeo(quadOn({ tl: [SPOT.mug[0] - 1.7, SPOT.mug[1] + 8], tr: [SPOT.mug[0] + 1.7, SPOT.mug[1] + 8], br: [SPOT.mug[0] + 1.7, SPOT.mug[1] - 1], bl: [SPOT.mug[0] - 1.7, SPOT.mug[1] - 1] }).P),
    new THREE.ShaderMaterial({ uniforms: steamU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: VS,
      fragmentShader: `varying vec2 vUv;uniform float uT,uA;
     float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
     float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
     void main(){float y=vUv.y,t=uT*.35;float x=vUv.x-.5+(n(vec2(y*2.5-t,1.))-.5)*.5*y+sin(y*7.-uT*1.3)*.05*y;
       float w=.035+y*.12;float a=exp(-x*x/(w*w))*n(vec2(x*6.,y*5.-t*2.))*n(vec2(x*3.+4.,y*3.-t*1.4))*smoothstep(0.,.12,y)*smoothstep(1.,.45,y)*.55*uA;
       gl_FragColor=vec4(vec3(a),a);}` })));

  return { renderer, scene, camera, PU, SU, WU, steamU, mon: { mR, mU, mN, mC, mW, mH }, panoListo, listo: Promise.all([panoListo, pared, logo]) };
}
