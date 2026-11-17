/* ==========================================================================
   bento/ia.js — 04 · Software IA: metal líquido que "piensa" dentro de una red de nodos.
   Copiado tal cual del prototipo aprobado (evimes-cards/bento.html).
   ========================================================================== */
import { THREE, chromeMat } from './shared.js';

export const NOISE=`vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=m289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
export function iaCard(ctx){
  const {scene,camera}=ctx;
  const BU=ctx.setBg(`uniform vec2 uC;void main(){vec3 navy=vec3(.027,.039,.075),blue=vec3(.17,.33,1.),cyan=vec3(0.,.9,1.);
    vec2 p=vUv-uC;p.x*=uA;float r=length(p);vec3 col=navy+blue*.26*exp(-r*r*4.)+vec3(.55,.36,.96)*.05*exp(-r*r*1.5);
    gl_FragColor=vec4(finish(col,vUv,uA,uT),1.);}`,{uC:{value:new THREE.Vector2(.5,.58)}});
  const U={uT:{value:0},uM:{value:new THREE.Vector3(0,0,1)},uPull:{value:0},uAmp:{value:1}};
  const mat=chromeMat({roughness:.04,envMapIntensity:2.5});
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    const DISP=`uniform float uT,uPull,uAmp;uniform vec3 uM;\n${NOISE}
      vec3 dispP(vec3 p){vec3 n=normalize(p);float d=.13*snoise(n*.75+vec3(0.,0.,uT*.30))+.05*snoise(n*1.3+vec3(uT*.36,4.,0.))+.02*sin(uT*.9);
        d*=uAmp;float f=max(dot(n,normalize(uM)),0.);d+=uPull*.30*pow(f,6.);return n*(1.+d)*1.25;}`;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+DISP)
      .replace('#include <beginnormal_vertex>',`vec3 pp=dispP(position);vec3 nn=normalize(position);vec3 tt=normalize(abs(nn.y)>.99?cross(nn,vec3(1.,0.,0.)):cross(nn,vec3(0.,1.,0.)));vec3 bb=cross(nn,tt);
        float e=.02;vec3 pa=dispP(normalize(position+tt*e)*length(position)),pb=dispP(normalize(position+bb*e)*length(position));
        vec3 objectNormal=normalize(cross(pa-pp,pb-pp));if(dot(objectNormal,nn)<0.)objectNormal=-objectNormal;`)
      .replace('#include <begin_vertex>','vec3 transformed=pp;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float fr=pow(1.-clamp(abs(dot(normal,normalize(vViewPosition))),0.,1.),2.6);totalEmissiveRadiance+=vec3(0.,.75,1.)*fr*.55;`);
  };
  mat.customProgramCacheKey=()=>'ev-liquid';
  const blob=new THREE.Mesh(new THREE.IcosahedronGeometry(1,64),mat);
  const rig=new THREE.Group();rig.add(blob);scene.add(rig);
  // neural constellation around it: nodes on a shell + links that light up like thoughts
  const N=180,nodes=[];for(let i=0;i<N;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,rr=2.0+Math.random()*1.1;const s=Math.sqrt(1-u*u);nodes.push(new THREE.Vector3(s*Math.cos(a)*rr,u*rr*.8,s*Math.sin(a)*rr));}
  const lp=[],ph=[];for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){if(nodes[i].distanceTo(nodes[j])<.82){lp.push(...nodes[i].toArray(),...nodes[j].toArray());const p=Math.random()*100;ph.push(p,p);}}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));lg.setAttribute('aPh',new THREE.Float32BufferAttribute(ph,1));
  const LU={uT:{value:0},uE:{value:1}};
  const links=new THREE.LineSegments(lg,new THREE.ShaderMaterial({uniforms:LU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aPh;varying float vPh;varying float vZ;void main(){vPh=aPh;vec4 mv=modelViewMatrix*vec4(position,1.);vZ=-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uT,uE;varying float vPh;varying float vZ;void main(){float s=pow(.5+.5*sin(uT*1.6+vPh),14.);
      vec3 c=mix(vec3(.17,.33,1.),vec3(0.,.9,1.),s);float a=(.035+.6*s)*uE*smoothstep(11.5,8.5,vZ);gl_FragColor=vec4(c*a,a);}`}));
  const pg=new THREE.BufferGeometry().setFromPoints(nodes);
  const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0x8fe9f5,size:.045,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));
  const net=new THREE.Group();net.add(links,pts);scene.add(net);
  ctx.onResize=()=>{camera.position.z=ctx.ar<1?11:10;camera.updateProjectionMatrix();};
  const tmp=new THREE.Vector3(),inv=new THREE.Matrix4();
  return (dt)=>{const t=ctx.t;U.uT.value=t;LU.uT.value=t;
    // the blob reaches toward the cursor (direction in its local space)
    tmp.set(ctx.mx*2.2,ctx.my*2.2,2.2);inv.copy(blob.matrixWorld).invert();tmp.applyMatrix4(inv).normalize();U.uM.value.lerp(tmp,.2);
    U.uPull.value+=(ctx.hover-U.uPull.value)*(1-Math.pow(.05,dt));
    U.uAmp.value=1+ctx.hover*.35;LU.uE.value=1+ctx.hover*.8;
    blob.rotation.y=t*.12;blob.rotation.x=Math.sin(t*.2)*.15;
    net.rotation.y=-t*.05+ctx.mx*.2;net.rotation.x=ctx.my*.15;
    rig.position.y=(ctx.ar<1?1.25:.95)+Math.sin(t*.8)*.06;net.position.y=rig.position.y;rig.scale.setScalar(ctx.ar<1?1:.92);
    BU.uC.value.set(.5,ctx.ar<1?.64:.62);
  };
}
