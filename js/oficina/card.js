/* ==========================================================================
   oficina/card.js — la card de Disco: la propia web, en cristal con filo de cromo.
   Portado tal cual del prototipo aprobado (Downloads/evimes-oficina/index.html):
   cara con shader que enseña un fotograma de la tira (uFrame, con decimales =
   scroll entre secciones), brillo de cristal que cruza y viñeta suave; filo de
   cromo (refleja la oficina), losa navy con clearcoat y la ráfaga de detrás
   (azul y cian de Evimes con un toque del rojo de Disco).
   La tira: config.js → PROJECT.strip (4 capturas reales de 1024×640).
   ========================================================================== */
import { THREE } from './scene.js';
import { PROJECT } from './config.js';

const roundedRect = (w, h, r) => { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
export const CWd = 1.6, CHt = 1;

export function crearCard(E) {
  const { scene } = E;
  const shape = roundedRect(CWd, CHt, .06);
  const faceGeo = new THREE.ShapeGeometry(shape, 24); { const uv = faceGeo.attributes.uv, pos = faceGeo.attributes.position; for (let k = 0; k < uv.count; k++) uv.setXY(k, pos.getX(k) / CWd + .5, pos.getY(k) / CHt + .5); }
  const CU = { uTex: { value: null }, uFrame: { value: 0 }, uFrames: { value: PROJECT.frames }, uSheen: { value: -1 }, uA: { value: 1 }, uLight: { value: 1 }, uT: { value: 0 } };
  const face = new THREE.Mesh(faceGeo, new THREE.ShaderMaterial({ uniforms: CU, transparent: true, toneMapped: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform sampler2D uTex;uniform float uFrame,uFrames,uSheen,uA,uLight,uT;
    void main(){float v=1.-(uFrame+(1.-vUv.y))/uFrames;vec3 c=texture2D(uTex,vec2(vUv.x,v)).rgb;
      // glass: a soft specular band that travels across, a faint inner vignette
      float s=exp(-pow((vUv.x*.8+vUv.y*.6)-uSheen,2.)*40.)*.16;c+=vec3(s);
      vec2 q=abs(vUv-.5)*2.;c*=1.-pow(max(q.x,q.y),8.)*.25;c*=uLight;
      gl_FragColor=vec4(c,uA);
      #include <colorspace_fragment>
    }` }));
  let stripRes; const listo = new Promise(r => { stripRes = r; });
  new THREE.TextureLoader().load(PROJECT.strip, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter; CU.uTex.value = t; stripRes(); }, undefined, () => stripRes());
  const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shape.getPoints(28).map(p => new THREE.Vector3(p.x, p.y, 0)), true), 360, .006, 8, true),
    new THREE.MeshPhysicalMaterial({ color: 0xe4e9f0, metalness: 1, roughness: .08, clearcoat: .9, envMapIntensity: 1.8, transparent: true }));
  const slabG = new THREE.ExtrudeGeometry(roundedRect(CWd, CHt, .06), { depth: .035, bevelEnabled: true, bevelThickness: .01, bevelSize: .008, bevelSegments: 3, curveSegments: 20 }); slabG.translate(0, 0, -.05);
  const slab = new THREE.Mesh(slabG, new THREE.MeshPhysicalMaterial({ color: 0x0b1226, metalness: .3, roughness: .2, clearcoat: 1, envMapIntensity: 1, transparent: true }));
  // the burst behind the card: Evimes blue/cyan with a touch of Disco's red-orange
  const BU = { uT: { value: 0 }, uA: { value: 0 } };
  const burst = new THREE.Mesh(new THREE.PlaneGeometry(CWd * 3.2, CHt * 4.2), new THREE.ShaderMaterial({ uniforms: BU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float uT,uA;float h1(float n){return fract(sin(n)*43758.5453);}
    float rays(float a,float n,float seed,float sp){float x=(a/6.2831853+.5)*n+uT*sp;float i=floor(x),f=fract(x);return mix(.25,1.,h1(i*1.7+seed))*smoothstep(mix(.04,.2,h1(i+seed)),0.,abs(f-.5));}
    void main(){vec2 p=(vUv-.5)*vec2(3.2*1.6/4.2,1.);float r=length(p);float a=atan(p.y,p.x);
      vec3 col=vec3(.17,.33,1.)*rays(a,52.,2.,.012)*.9+vec3(0.,.9,1.)*rays(a+.3,70.,5.,-.016)*.55+vec3(1.,.3,.1)*rays(a+.9,30.,9.,.008)*.35;
      col*=1./(1.+r*r*14.)*smoothstep(.62,.25,r);col+=vec3(.17,.4,1.)*exp(-r*r*12.)*.35;
      gl_FragColor=vec4(col*uA,1.);}` })); burst.position.z = -.25;
  const card = new THREE.Group(); face.position.z = .003; card.add(burst, slab, face, edge); card.visible = false; scene.add(card);
  return { card, face, slab, edge, burst, CU, BU, listo };
}
