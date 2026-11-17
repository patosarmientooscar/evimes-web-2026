/* ==========================================================================
   bento/shared.js — piezas comunes de las 4 cards (copiadas tal cual del
   prototipo aprobado evimes-cards/bento.html): una card = un renderer
   pequeño, entorno de estudio, shader de fondo, puntero suavizado y su
   propio update(). Solo renderiza cuando está visible.
   Three.js 0.160.0: la MISMA URL que js/fondo/onda.js (un solo módulo).
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export { THREE };
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const NAVY = new THREE.Color(0x070a13);

// El vector real del EH: se lee de assets/logo/evimes-eh.svg (viewBox 1566x780).
export const ehPath = fetch(new URL('../../assets/logo/evimes-eh.svg', import.meta.url))
  .then(r => r.text())
  .then(txt => new DOMParser().parseFromString(txt, 'image/svg+xml').querySelector('path').getAttribute('d'));

export function studioEnv(renderer,scene){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');
  const bg=g.createLinearGradient(0,0,0,512);bg.addColorStop(0,'#1c2748');bg.addColorStop(.5,'#0a0f1d');bg.addColorStop(1,'#04060c');g.fillStyle=bg;g.fillRect(0,0,1024,512);
  const box=(x,y,w,h,col,a)=>{const gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,`rgba(${col},0)`);gr.addColorStop(.5,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.fillRect(x,y,w,h)};
  g.fillStyle='rgba(235,240,248,.55)';g.fillRect(0,0,1024,150);box(90,40,600,160,'255,255,255',1);box(0,120,1024,120,'255,255,255',.5);
  box(0,195,1024,24,'255,255,255',.6);box(560,300,380,70,'235,242,255',.75);box(720,120,220,60,'230,240,255',.65);
  box(0,250,1024,40,'0,229,255',.38);box(380,330,420,30,'60,100,255',.6);box(60,380,260,24,'0,229,255',.4);box(820,60,200,40,'70,110,255',.5);
  const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(t).texture;t.dispose();pm.dispose();
}
export const COMMON_GLSL=`
  float h1(float n){return fract(sin(n)*43758.5453);}
  float vn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}
  vec3 finish(vec3 col,vec2 uv,float a,float t){vec3 navy=vec3(.027,.039,.075);
    float vg=smoothstep(1.35,.2,length((uv-.5)*vec2(a,1.)));col=mix(navy*.6,col,.35+.65*vg);
    return col+(h1(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+t)-.5)*.018;}`;
export const chromeMat=(o={})=>new THREE.MeshPhysicalMaterial(Object.assign({color:0xe4e9f0,metalness:1,roughness:.12,clearcoat:.9,clearcoatRoughness:.08,envMapIntensity:2.3},o));

export const cards=[];
export function makeCard(el,setup,opts={}){
  const cv=el.querySelector('canvas');
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:!!opts.captura});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(NAVY,1);renderer.autoClear=false;
  const scene=new THREE.Scene();studioEnv(renderer,scene);
  const camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,0,9);
  const ctx={el,renderer,scene,camera,W:1,H:1,ar:1,t:0,mx:0,my:0,tmx:0,tmy:0,hover:0,thover:0,visible:false,bg:null};
  ctx.setBg=(frag,uniforms)=>{const u=Object.assign({uT:{value:0},uA:{value:1}},uniforms);const s=new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:u,depthWrite:false,depthTest:false,
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uT,uA;\n`+COMMON_GLSL+frag})));
    ctx.bg={scene:s,cam:new THREE.OrthographicCamera(-1,1,1,-1,0,1),u};return u;};
  const resize=()=>{const r=el.getBoundingClientRect();ctx.W=Math.max(1,r.width);ctx.H=Math.max(1,r.height);ctx.ar=ctx.W/ctx.H;
    renderer.setSize(ctx.W,ctx.H,false);camera.aspect=ctx.ar;camera.updateProjectionMatrix();if(ctx.bg)ctx.bg.u.uA.value=ctx.ar;ctx.onResize&&ctx.onResize();};
  el.addEventListener('pointerenter',()=>{ctx.thover=1});
  el.addEventListener('pointerleave',()=>{ctx.thover=0;ctx.tmx=ctx.tmy=0});
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();ctx.tmx=(e.clientX-r.left)/r.width*2-1;ctx.tmy=-((e.clientY-r.top)/r.height*2-1);ctx.px=e.clientX;ctx.py=e.clientY;});
  ctx.update=setup(ctx)||(()=>{});
  new ResizeObserver(resize).observe(el);resize();
  new IntersectionObserver(es=>{ctx.visible=es[0].isIntersecting;if(ctx.visible)el.classList.add('in');},{threshold:.08}).observe(el);
  ctx.step=(dt)=>{ctx.t+=dt;const k=1-Math.pow(.04,dt);ctx.mx+=(ctx.tmx-ctx.mx)*k;ctx.my+=(ctx.tmy-ctx.my)*k;ctx.hover+=(ctx.thover-ctx.hover)*(1-Math.pow(.02,dt));
    if(ctx.bg)ctx.bg.u.uT.value=ctx.t;ctx.update(dt);};
  ctx.render=()=>{renderer.clear();if(ctx.bg){renderer.render(ctx.bg.scene,ctx.bg.cam);renderer.clearDepth();}renderer.render(scene,camera);};
  cards.push(ctx);return ctx;
}
export const roundedRect=(w,h,r)=>{const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);
  s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;};
export const planarCapUV=(geo,S,mirrorBack=true)=>{const pos=geo.attributes.position,uv=geo.attributes.uv,g0=geo.groups[0];
  for(let k=g0.start;k<g0.start+g0.count;k++){let u=(pos.getX(k)+S)/(2*S);const v=(pos.getY(k)+S)/(2*S);if(mirrorBack&&pos.getZ(k)<0)u=1-u;uv.setXY(k,u,v);}uv.needsUpdate=true;};

// engraving maps from the real EH vector (bump + roughness + tint)
let ehListoRes;export const ehListo=new Promise(r=>{ehListoRes=r});
export function engraveEH(mat,size,onDone){
  const N=1024,img=new Image();
  img.onload=()=>{
    const mk=(bg,fg,blur)=>{const c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,N,N);
      const w=N*size,hh=w*780/1566;g.filter=`blur(${blur}px)`;const t=document.createElement('canvas');t.width=t.height=N;const tg=t.getContext('2d');
      tg.drawImage(img,(N-w)/2,(N-hh)/2,w,hh);tg.globalCompositeOperation='source-in';tg.fillStyle=fg;tg.fillRect(0,0,N,N);g.drawImage(t,0,0);return c;};
    const tex=(c,srgb)=>{const t=new THREE.CanvasTexture(c);t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;};
    mat.bumpMap=tex(mk('#fff','#000',2.2));mat.bumpScale=5;mat.roughnessMap=tex(mk('rgb(30,30,30)','rgb(120,120,120)',1.2));mat.roughness=1;
    mat.map=tex(mk('#fff','#b9c2cf',1),true);mat.needsUpdate=true;ehListoRes();onDone&&onDone();};
  ehPath.then(EH_D=>{img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1566 780"><path fill="#000" fill-rule="evenodd" d="${EH_D}"/></svg>`);});
}
