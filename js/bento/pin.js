/* ==========================================================================
   bento/pin.js — 03 · Posicionamiento: el pin de cromo cae sobre un mapa de cristal con anillos de radar.
   Copiado tal cual del prototipo aprobado (evimes-cards/bento.html).
   ========================================================================== */
import { THREE, chromeMat } from './shared.js';

export function pinCard(ctx){
  const {scene,camera}=ctx;
  const BU=ctx.setBg(`uniform vec2 uC;uniform float uRing;
  void main(){vec3 navy=vec3(.027,.039,.075),blue=vec3(.17,.33,1.),cyan=vec3(0.,.9,1.);
    vec2 p=vUv-uC;p.x*=uA;float r=length(p);
    vec3 col=navy+blue*.20*exp(-r*r*3.)+cyan*.10*exp(-r*r*20.);
    gl_FragColor=vec4(finish(col,vUv,uA,uT),1.);}`,{uC:{value:new THREE.Vector2(.5,.45)},uRing:{value:0}});
  // glass map plane with streets + radar rings (lives in 3D, under the pin)
  const MU={uT:{value:0},uDrop:{value:10}};
  const map=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.ShaderMaterial({uniforms:MU,transparent:true,depthWrite:false,
    vertexShader:`varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vP;uniform float uT,uDrop;
    float line(float x,float w){return smoothstep(w,0.,abs(fract(x)-.5)-.5+w);}
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    void main(){vec3 blue=vec3(.17,.33,1.),cyan=vec3(0.,.9,1.);float r=length(vP);
      // streets: a few rotated grids at different scales = a believable city map
      vec2 a=rot(.35)*vP,b=rot(-.9)*vP;
      float st=max(max(1.-smoothstep(0.,.03,abs(fract(a.x*.9)-.5)-.47),1.-smoothstep(0.,.03,abs(fract(a.y*.7)-.5)-.47)),
                   (1.-smoothstep(0.,.05,abs(fract(b.x*.32)-.5)-.48))*1.4);
      float fade=exp(-r*r*.05);
      vec3 col=mix(blue,cyan,.25)*st*.30*fade;
      // radar rings from the pin (continuous) + a strong burst after each landing
      float rings=0.;for(int k=0;k<3;k++){float ph=fract(uT*.28+float(k)/3.);float rr=ph*5.;rings+=smoothstep(.06,0.,abs(r-rr))*(1.-ph)*(1.-ph);}
      float br=uDrop*2.6;float burst=smoothstep(.12,0.,abs(r-br))*exp(-uDrop*1.4)*2.;
      col+=cyan*(rings*.8+burst)*fade;
      col+=cyan*.55*exp(-r*r*6.)+blue*.25*exp(-r*r*1.2);   // glow under the pin
      float al=clamp(max(max(col.r,col.g),col.b),0.,1.)*smoothstep(7.,3.,r);
      gl_FragColor=vec4(col,al);}`}));
  map.rotation.x=-Math.PI/2;map.position.y=-1.25;scene.add(map);
  // pin: 2D teardrop with a hole, extruded + beveled like the destello
  const r=.78,cy=.42,tipY=-1.08,d=cy-tipY,ang=Math.asin(r/d);
  const sh=new THREE.Shape();const tl=Math.PI/2+ (Math.PI/2-ang);
  const p1=[Math.cos(-ang)*r,cy+Math.sin(-ang)*r];
  sh.moveTo(0,tipY+.06);sh.quadraticCurveTo(.035,tipY+.03,.06,tipY+.1);
  sh.lineTo(p1[0]*.999,p1[1]);sh.absarc(0,cy,r,-ang,Math.PI+ang,false);sh.lineTo(-.06,tipY+.1);sh.quadraticCurveTo(-.035,tipY+.03,0,tipY+.06);
  const hole=new THREE.Path();hole.absarc(0,cy,.30,0,Math.PI*2,true);sh.holes.push(hole);
  const DEPTH=.34;const geo=new THREE.ExtrudeGeometry(sh,{depth:DEPTH,curveSegments:64,bevelEnabled:true,bevelThickness:.11,bevelSize:.07,bevelSegments:16});geo.translate(0,0,-DEPTH/2);
  const pin=new THREE.Mesh(geo,chromeMat());
  // cyan light trapped in the hole
  const core=new THREE.Mesh(new THREE.CircleGeometry(.31,48),new THREE.MeshBasicMaterial({color:0x00e5ff,toneMapped:false}));core.position.set(0,cy,0);
  const coreGlow=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.6),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;void main(){float r=length(vUv-.5);gl_FragColor=vec4(vec3(0.,.9,1.)*exp(-r*r*40.)*.9,1.);}`}));coreGlow.position.set(0,cy,0);
  const pinG=new THREE.Group();pinG.add(core,pin,coreGlow);
  const rig=new THREE.Group();rig.add(pinG);scene.add(rig);
  ctx.onResize=()=>{const m=ctx.ar<1;camera.position.set(0,m?3.4:2.2,m?12.5:9);camera.lookAt(0,m?-.2:-.35,0);};
  // landing cycle: hover high, drop with gravity, squash & bounce, rings burst
  let phase=1.2,y=0,vy=0,landed=true,since=10;const CYCLE=6.5;
  return (dt)=>{const t=ctx.t;MU.uT.value=t;
    phase+=dt;since+=dt;
    if(phase>CYCLE){phase=0;y=2.4;vy=0;landed=false;}
    if(!landed){vy-=dt*14;y+=vy*dt;if(y<=0){y=0;if(vy<-1.2){vy=-vy*.32;since=0;}else{vy=0;landed=true;}}}
    const bob=landed?Math.sin(t*1.4)*.06+.06:0;
    MU.uDrop.value=since;
    const squash=Math.exp(-since*6)*.12;
    pinG.position.y=y+bob;pinG.scale.set(1+squash,1-squash,1+squash);
    pinG.rotation.y=t*.9+ctx.mx*.6;   // spins slowly, mirrors the chrome around
    rig.rotation.set(0,ctx.mx*.25,0);rig.position.x=ctx.ar<1?0:1.3;map.position.x=rig.position.x;
    rig.position.y=ctx.ar<1?.85:0;map.position.y=-1.25+rig.position.y;
    rig.rotation.x=-ctx.my*.08;
    BU.uC.value.set(ctx.ar<1?.5:.62,ctx.ar<1?.55:.5);
  };
}
