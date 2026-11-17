/* ==========================================================================
   bento/star.js — 02 · Animaciones 3D: el destello de cromo con el EH grabado y la ráfaga azul y cian.
   Copiado tal cual del prototipo aprobado (evimes-cards/bento.html).
   ========================================================================== */
import { THREE, chromeMat, planarCapUV, engraveEH } from './shared.js';

export function starCard(ctx){
  const {scene,camera,el}=ctx;
  const RU=ctx.setBg(`uniform vec2 uC;uniform float uRot,uE,uFace;
  float rays(float a,float n,float seed,float sp){float x=(a/6.2831853+.5)*n+uT*sp;float i=floor(x),f=fract(x);
    float w=mix(.04,.22,h1(i+seed));float k=mix(.25,1.,h1(i*1.7+seed));return k*smoothstep(w,0.,abs(f-.5));}
  void main(){
    vec2 p=vUv-uC;p.x*=uA;float r=length(p);float a=atan(p.y,p.x);
    vec3 navy=vec3(.027,.039,.075),blue=vec3(.17,.33,1.),cyan=vec3(0.,.9,1.);
    float fall=1./(1.+r*r*6.);
    float rb=rays(a,48.,3.1,.010)*(.55+.45*vn(r*3.-uT*.6));
    float rc=rays(a+.35,64.,7.3,-.014)*(.55+.45*vn(r*4.+uT*.5+4.));
    float s=0.;for(int k=0;k<4;k++){float d=abs(mod(a-uRot-float(k)*1.5707963+3.14159265,6.2831853)-3.14159265);s+=exp(-d*d*900.)*exp(-r*1.1);}
    float pulse=.82+.18*sin(uT*1.9)+.1*sin(uT*3.7+1.);
    vec3 col=navy+blue*rb*fall*1.15*uE*pulse+cyan*rc*fall*.75*uE*pulse+mix(cyan,vec3(1.),.35)*s*(.5+.9*uFace)*uE
      +mix(blue,cyan,.5)*exp(-r*r*9.)*.55*uE+blue*.12*exp(-r*1.6);
    gl_FragColor=vec4(finish(col,vUv,uA,uT),1.);}`,{uC:{value:new THREE.Vector2(.5,.5)},uRot:{value:0},uE:{value:1},uFace:{value:1}});
  const R=1.7,CT=.19*R,E=.022;
  const tips=[[0,R],[R,0],[0,-R],[-R,0]],sh=new THREE.Shape();
  const q2=(P0,P1,P2,t)=>[(1-t)*(1-t)*P0[0]+2*(1-t)*t*P1[0]+t*t*P2[0],(1-t)*(1-t)*P0[1]+2*(1-t)*t*P1[1]+t*t*P2[1]];
  const sub=(P0,P1,P2,t0,t1)=>[(1-t0)*(1-t1)*P0[0]+((1-t0)*t1+t0*(1-t1))*P1[0]+t0*t1*P2[0],(1-t0)*(1-t1)*P0[1]+((1-t0)*t1+t0*(1-t1))*P1[1]+t0*t1*P2[1]];
  const edges=tips.map((A,i)=>{const B=tips[(i+1)%4];return {A,B,C:[Math.sign(A[0]+B[0])*CT,Math.sign(A[1]+B[1])*CT]}});
  const s0=q2(edges[0].A,edges[0].C,edges[0].B,E);sh.moveTo(s0[0],s0[1]);
  edges.forEach((e,i)=>{const pb=q2(e.A,e.C,e.B,1-E),c=sub(e.A,e.C,e.B,E,1-E);sh.quadraticCurveTo(c[0],c[1],pb[0],pb[1]);
    const n=edges[(i+1)%4],pa=q2(n.A,n.C,n.B,E);sh.quadraticCurveTo(e.B[0],e.B[1],pa[0],pa[1]);});
  const DEPTH=.30;const geo=new THREE.ExtrudeGeometry(sh,{depth:DEPTH,curveSegments:64,bevelEnabled:true,bevelThickness:.1,bevelSize:.06,bevelSegments:18});
  geo.translate(0,0,-DEPTH/2);planarCapUV(geo,R+.08);
  const side=chromeMat(),face=chromeMat();const star=new THREE.Mesh(geo,[face,side]);const rig=new THREE.Group();rig.add(star);scene.add(rig);
  engraveEH(face,.30);
  let spin=new THREE.Vector3(),drag=false,lx=0,ly=0;
  el.addEventListener('pointermove',e=>{if(drag){spin.y+=(e.clientX-lx)*.012;spin.x+=(e.clientY-ly)*.012;lx=e.clientX;ly=e.clientY;}});
  el.addEventListener('pointerdown',e=>{if(e.target.closest('a'))return;drag=true;lx=e.clientX;ly=e.clientY;el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointerup',()=>{drag=false});el.addEventListener('pointerleave',()=>{drag=false});
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.25,-.35,.12)),dq=new THREE.Quaternion(),ax=new THREE.Vector3(),tip=new THREE.Vector3(),cen=new THREE.Vector3(),nz=new THREE.Vector3();
  let flash=0,prevFace=1;
  ctx.onResize=()=>{camera.position.z=ctx.ar<1?13.5:9;camera.updateProjectionMatrix();};
  return (dt)=>{const t=ctx.t;
    const w=new THREE.Vector3(.32*Math.sin(t*.41)+.18*Math.sin(t*1.13),.62+.32*Math.sin(t*.27),.22*Math.cos(t*.33)).multiplyScalar(1+ctx.hover*.6).add(spin);
    const ang=w.length()*dt;if(ang>1e-6){ax.copy(w).normalize();dq.setFromAxisAngle(ax,ang);q.premultiply(dq);}
    spin.multiplyScalar(Math.exp(-dt*1.4));star.quaternion.copy(q);
    rig.rotation.set(-ctx.my*.35,ctx.mx*.45,0);const ar=ctx.ar,sx=ar>1?1:.45;
    rig.position.set((Math.sin(t*.23)*.45+Math.sin(t*.61)*.15)*sx+ctx.mx*.3+(ar>1.25?1.25:0),Math.sin(t*.37)*.24+Math.cos(t*.71)*.08+ctx.my*.2+(ar>1?.25:1.05),Math.sin(t*.19)*.5);
    rig.scale.setScalar(1+.035*Math.sin(t*1.3));
    rig.updateMatrixWorld();cen.setFromMatrixPosition(star.matrixWorld).project(camera);RU.uC.value.set(cen.x*.5+.5,cen.y*.5+.5);
    tip.set(0,R,0).applyMatrix4(star.matrixWorld).project(camera);RU.uRot.value=Math.atan2(tip.y-cen.y,(tip.x-cen.x)*ar);
    nz.set(0,0,1).applyQuaternion(star.quaternion).applyEuler(rig.rotation);const fc=Math.abs(nz.z);
    if(fc>.985&&prevFace<=.985)flash=1;prevFace=fc;flash*=Math.exp(-dt*3.2);
    RU.uFace.value=Math.pow(fc,3)+flash*1.5;RU.uE.value=.85+ctx.hover*.35+flash*.6;
  };
}
