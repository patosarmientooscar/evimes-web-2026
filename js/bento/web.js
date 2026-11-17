/* ==========================================================================
   bento/web.js — 01 · Desarrollo web: una web desmontada en láminas de cristal con filo de cromo.
   Copiado tal cual del prototipo aprobado (evimes-cards/bento.html).
   ========================================================================== */
import { THREE, chromeMat, roundedRect } from './shared.js';

export function webCard(ctx){
  const {scene,camera}=ctx;
  ctx.setBg(`void main(){vec3 navy=vec3(.027,.039,.075),blue=vec3(.17,.33,1.),cyan=vec3(0.,.9,1.);
    vec2 p=vUv-vec2(.5,.47);p.x*=uA;float r=length(p);
    vec3 col=navy+blue*.22*exp(-r*r*5.)+cyan*.08*exp(-r*r*14.);
    // perspective floor grid, fading into the dark
    vec2 q=vUv-vec2(.5,.30);if(q.y<0.){float z=.18/(-q.y+.02);vec2 g=vec2(q.x*z*uA*1.4,z+uT*.12);vec2 f=abs(fract(g*2.)-.5);
      float l=smoothstep(.035*z,.0,min(f.x,f.y));col+=mix(blue,cyan,.4)*l*.16*smoothstep(4.,.6,z);}
    gl_FragColor=vec4(finish(col,vUv,uA,uT),1.);}`);
  // UI layer textures (1024x640, transparent)
  const TW=1024,TH=640;const tex=(draw)=>{const c=document.createElement('canvas');c.width=TW;c.height=TH;const g=c.getContext('2d');draw(g);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;};
  const rr=(g,x,y,w,h,r)=>{g.beginPath();g.roundRect(x,y,w,h,r);};
  const layers=[
    tex(g=>{ // 0 · base: page frame, nav bar
      g.strokeStyle='rgba(255,255,255,.10)';g.lineWidth=2;for(let x=64;x<TW;x+=64){g.beginPath();g.moveTo(x,0);g.lineTo(x,TH);g.stroke();}
      g.fillStyle='rgba(255,255,255,.08)';rr(g,40,34,TW-80,54,27);g.fill();
      g.fillStyle='rgba(236,231,221,.85)';rr(g,70,52,120,18,9);g.fill();
      g.fillStyle='rgba(236,231,221,.35)';[560,650,740].forEach(x=>{rr(g,x,55,64,12,6);g.fill();});
      g.fillStyle='rgba(0,229,255,.9)';rr(g,850,48,120,26,13);g.fill();}),
    tex(g=>{ // 1 · images
      const gr=g.createLinearGradient(520,120,980,560);gr.addColorStop(0,'#2b4dff');gr.addColorStop(.55,'#00e5ff');gr.addColorStop(1,'#8b5cf6');
      g.fillStyle=gr;rr(g,540,130,420,300,26);g.fill();
      g.globalCompositeOperation='source-atop';const rg=g.createRadialGradient(700,240,10,700,240,260);rg.addColorStop(0,'rgba(255,255,255,.55)');rg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rg;g.fillRect(540,130,420,300);
      g.globalCompositeOperation='source-over';
      [[60,470,280],[364,470,280],[668,470,292]].forEach(([x,y,w],i)=>{const gg=g.createLinearGradient(x,y,x+w,y+120);gg.addColorStop(0,['#1c2d6b','#123b56','#2a1f5e'][i]);gg.addColorStop(1,['#2b4dff','#00b8d4','#8b5cf6'][i]);g.fillStyle=gg;rr(g,x,y,w,130,20);g.fill();});}),
    tex(g=>{ // 2 · type
      g.fillStyle='rgba(244,240,232,.96)';rr(g,70,150,400,40,12);g.fill();rr(g,70,206,330,40,12);g.fill();
      g.fillStyle='rgba(236,231,221,.45)';[278,304,330].forEach((y,i)=>{rr(g,70,y,[380,350,250][i],12,6);g.fill();});}),
    tex(g=>{ // 3 · interaction: buttons + cursor
      g.fillStyle='#00e5ff';rr(g,70,372,190,56,28);g.fill();g.fillStyle='rgba(7,10,19,.85)';rr(g,108,394,112,12,6);g.fill();
      g.strokeStyle='rgba(236,231,221,.7)';g.lineWidth=3;rr(g,278,372,170,56,28);g.stroke();
      g.save();g.translate(236,410);g.fillStyle='#fff';g.beginPath();g.moveTo(0,0);g.lineTo(0,46);g.lineTo(12,35);g.lineTo(22,56);g.lineTo(30,52);g.lineTo(20,32);g.lineTo(36,32);g.closePath();g.fill();g.restore();})
  ];
  const PW=3.3,PH=PW*TH/TW;
  const glassShape=roundedRect(PW,PH,.16);
  const rig=new THREE.Group();scene.add(rig);
  const panes=layers.map((tx,i)=>{
    const grp=new THREE.Group();
    const geo=new THREE.ExtrudeGeometry(glassShape,{depth:.025,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:4,curveSegments:16});geo.translate(0,0,-.0125);
    const glass=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:0x101a38,metalness:.1,roughness:.06,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.6,transparent:true,opacity:i===0?.55:.16,depthWrite:false}));
    // chrome edge
    const pts=glassShape.getPoints(24).map(p=>new THREE.Vector3(p.x,p.y,0));
    const edge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),240,.011,8,true),chromeMat({roughness:.08}));
    const ui=new THREE.Mesh(new THREE.PlaneGeometry(PW*.96,PH*.96),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,toneMapped:false,opacity:.95}));ui.position.z=.02;
    grp.add(glass,edge,ui);grp.renderOrder=i;glass.renderOrder=i*3;ui.renderOrder=i*3+1;rig.add(grp);return grp;
  });
  ctx.onResize=()=>{camera.position.set(0,0,ctx.ar<1?11:ctx.ar<1.15?9.6:8.6);camera.updateProjectionMatrix();};
  let ex=0;
  return (dt)=>{const t=ctx.t;
    // breathes between assembled and exploded; hovering pulls it fully apart
    const idle=.35+.35*(.5+.5*Math.sin(t*.55));const tgt=Math.max(idle,ctx.hover);ex+=(tgt-ex)*(1-Math.pow(.05,dt));
    panes.forEach((p,i)=>{const k=i-(panes.length-1)/2;
      p.position.set(k*.10*ex+Math.sin(t*.7+i)*.02,k*.06*ex+Math.sin(t*.9+i*1.3)*.03,k*(.12+.75*ex));
      p.rotation.z=Math.sin(t*.4+i)*.01*ex;});
    rig.rotation.set(-.42-ctx.my*.22,.62+ctx.mx*.38+Math.sin(t*.25)*.08,.1);
    rig.position.set(ctx.ar<1?.1:.3,(ctx.ar<1?1.1:.72)+Math.sin(t*.6)*.06,0);rig.scale.setScalar(ctx.ar<1?1:.9);
  };
}
