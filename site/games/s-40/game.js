"use strict";
(()=>{
  const {T,V,TAU,group,mesh,ell,box,cylinder,path,ring,slab,texture,noise,mat,phys,timber,pale,cedar,iron,brass,steel,sand,cotton,rnd,clamp}=Studio;
  const canvas=document.querySelector('#scene'),sim=Warabi.create(),s=sim.state;
  window.__GAME__={step:sim.step,getState:sim.getState};
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
  renderer.outputColorSpace=T.SRGBColorSpace;
  const world=new T.Scene();world.background=new T.Color(0xa99474);
  Studio.environment(world,renderer);
  const camera=new T.PerspectiveCamera(31,1,.1,85);
  const sunlight=new T.DirectionalLight(0xffedcb,3.1);sunlight.position.set(-6.4,10.6,-5.3);world.add(sunlight,sunlight.target);
  sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);
  Object.assign(sunlight.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:35});sunlight.shadow.camera.updateProjectionMatrix();
  sunlight.shadow.bias=-.00020;sunlight.shadow.normalBias=.012;sunlight.shadow.radius=2.4;
  world.add(new T.HemisphereLight(0xfffaeb,0x9f896a,.86));
  const counter=group(world);counter.rotation.y=-.045;
  box(counter,mat(0x766044),0,-.44,0,38,.45,34);
  for(let i=-8;i<=8;i++){
    const m=timber.clone(),map=Studio.woodtex.clone();Studio.woodtex.variants.push(map);map.needsUpdate=true;map.repeat.set(2.7,.93);map.offset.set(rnd(),rnd());m.map=m.bumpMap=map;m.color.setHSL(.10,.18,.87+rnd()*.12);
    const o=box(counter,m,0,-.144,i*1.63,38,.275,1.622);
    o.rotation.x=(rnd()-.5)*.001;
  }
  const pot=Studio.pot(world),dough=Studio.dough(pot),paddle=Studio.paddle(pot);
  const basin=Objects.basin(world),tray=Objects.tray(world),cup=Objects.dish(world);
  const net=Objects.sieve(world),spoon=Objects.spoon(world),bite=Objects.morsel(world);
  // The sample serving is visible while the warm batch is still in the pan.
  const sampleA=Objects.morsel(cup,true),sampleB=Objects.morsel(cup,true);
  sampleA.o.position.set(-.27,.48,-.04);sampleA.o.rotation.y=.4;sampleA.o.scale.set(.93,.95,.93);
  sampleB.o.position.set(.27,.51,-.22);sampleB.o.rotation.y=-1.2;sampleB.o.scale.set(.91,1,.93);
  const plateLeaf=Objects.leaf(cup,.13,.37,.25,.72,-1.18,0x5e783f);
  const pick=group(cup);path(pick,cedar,[[-.01,.055,-.78],[0,.035,-.28],[0,.017,.4],[0,0,.75]],.035,10);
  ell(pick,cedar,0,.028,-.6,.056,.042,.24,12);pick.position.set(.57,.49,.25);pick.rotation.y=-.62;
  const cloth=group(world);Objects.fabric(cloth,5.1,3.08);const under=Objects.fabric(cloth,5.07,3.05);under.position.set(.032,-.026,-.08);
  const hand=Objects.arm(world),otherHand=Objects.arm(world,true);
  const holder=group(pot);const rag=Objects.fabric(holder,1.12,.94,mat(0xcdc2a0,.95,0,{bumpMap:noise,bumpScale:.027}),1);holder.position.set(-2.25,.93,.04);rag.rotation.y=-.13;
  const branch=Objects.branch(world);
  const matSh=texture(64,64,(x,y)=>{const a=Math.max(0,1-Math.hypot((x-31.5)/32,(y-31.5)/32)**2);return[255*a*a,255*a*a,255*a*a];},false);
  function contact(p,w,d,x,z,opacity){
    const m=mat(0x4b3827,1,0,{transparent:true,alphaMap:matSh,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
    const o=mesh(p,new T.PlaneGeometry(w,d),m,x,.013,z);o.rotation.x=-Math.PI/2;o.castShadow=false;return o;
  }
  contact(pot,5.05,4.9,.14,.17,.27);contact(basin.g,6.38,5.57,.17,.21,.27);contact(tray.g,5.18,3.67,.09,.12,.25);contact(cup,2.3,2.1,.08,.14,.25);
  const beamGroup=group(world),beamMat=mat(0x806443,.76);
  for(let i=0;i<4;i++)box(beamGroup,beamMat,-5.8+i*1.74,4.5,-8.2,.105,.14,3.55);
  box(beamGroup,beamMat,-3.8,4.5,-8.55,9,.13,.12);
  const plum=group(tray.g);plum.position.set(-1.89,.474,-1.30);
  // A small brass plum inlay on the wooden lip.
  for(let i=0;i<5;i++)ell(plum,brass,Math.sin(i*TAU/5)*.052,0,Math.cos(i*TAU/5)*.052,.041,.008,.041,10);
  ell(plum,cedar,0,.009,0,.022,.006,.022,10);
  // Woven bamboo binding at the pot’s foot.
  const binding=new T.InstancedMesh(new T.SphereGeometry(1,6,4),mat(0xaf9059,.92),240);
  const dummy=new T.Object3D();
  for(let i=0;i<240;i++){const a=i/240*TAU;dummy.position.set(2.115*Math.cos(a),.205,2.115*Math.sin(a));dummy.scale.set(.066,.034,.039);dummy.rotation.set(0,-a+.52,.30);dummy.updateMatrix();binding.setMatrixAt(i,dummy.matrix);}pot.add(binding);
  // Soft curls of steam have a feathered edge and advect with the local air.
  const steamMat=phys(0xfff4db,.90,{transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});
  steamMat.onBeforeCompile=sh=>{
    sh.vertexShader='varying vec2 plumeUV;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nplumeUV=uv;');
    sh.fragmentShader='varying vec2 plumeUV;\n'+sh.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
      diffuseColor.a*=pow(max(0.,1.-abs(plumeUV.x*2.-1.)),2.)*sin(3.14159*plumeUV.y);`);
  };
  const steam=Array.from({length:10},()=>{const m=steamMat.clone();m.onBeforeCompile=steamMat.onBeforeCompile;const o=mesh(pot,new T.PlaneGeometry(1,1,3,12),m);o.castShadow=o.receiveShadow=o.visible=false;o.renderOrder=8;return o;});
  const rainMaterial=phys(0xcee4d6,.12,{clearcoat:1,metalness:.18,transparent:true,opacity:.72});
  const rain=new T.InstancedMesh(new T.SphereGeometry(1,10,8),rainMaterial,48);rain.frustumCulled=false;rain.renderOrder=7;world.add(rain);
  const flyingPowder=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),sand,48);flyingPowder.frustumCulled=false;world.add(flyingPowder);
  const L={pot:V(0,0,0),basin:V(0,0,0),tray:V(0,0,0),cup:V(0,0,0)};
  let portrait=false,worldH=10,viewW=0,viewH=0;
  const projected=V(0,0,0),aim=V(0,0,0);
  const wp=(o,x=0,y=0,z=0)=>o.localToWorld(V(x,y,z));
  const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
  function arc(a,b,u,h){const t=ease(u);return a.clone().lerp(b,t).add(V(0,Math.sin(t*Math.PI)*h,0));}
  // Linear-light highlight bloom, fine film grain and lens falloff at display resolution.
  const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true,samples:2});
  const postWorld=new T.Scene(),postCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const post=new T.ShaderMaterial({uniforms:{frame:{value:target.texture},texel:{value:new T.Vector2(1,1)}},
    vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`uniform sampler2D frame;uniform vec2 texel;varying vec2 st;
    vec3 high(vec2 offset){vec3 h=texture2D(frame,st+offset*texel*3.8).rgb;return max(h-1.15,vec3(0.));}
    void main(){vec3 c=texture2D(frame,st).rgb;
    c+=.010*(high(vec2(-1,-1))+high(vec2(-1,1))+high(vec2(1,-1))+high(vec2(1,1)));
    vec2 q=(st-.5)*1.45;c*=1.-.155*dot(q,q);gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb+=(fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5)*.009;}`,depthTest:false,depthWrite:false});
  postWorld.add(new T.Mesh(new T.PlaneGeometry(2,2),post));
  function resize(){
    viewW=window.innerWidth;viewH=window.innerHeight;const a=viewW/viewH;
    portrait=a<.85;
    if(portrait){
      worldH=Math.max(12.3,7.55/a);L.pot.set(-.48,0,-.38);L.basin.set(.83,0,-4.65);L.tray.set(.56,0,3.35);L.cup.set(-1.43,0,5.68);
      tray.g.rotation.y=-2.82;basin.g.rotation.y=-.08;cloth.rotation.y=-.27;
      branch.g.position.set(-2.77,1.1,-5.88);branch.g.rotation.y=-.47;
      beamGroup.position.set(-.7,0,-2.6);cloth.scale.setScalar(.94);
    }else{
      worldH=Math.max(9.45,13.0/a);L.pot.set(-2.48,0,-.77);L.basin.set(3.12,0,-2.28);L.tray.set(2.96,0,1.98);L.cup.set(-1.24,0,2.94);
      tray.g.rotation.y=-3.01;basin.g.rotation.y=-.06;cloth.rotation.y=-.24;
      branch.g.position.set(-4.76,1.02,-3.88);branch.g.rotation.y=-.3;beamGroup.position.set(0,0,0);cloth.scale.setScalar(1);
    }
    pot.position.copy(L.pot);basin.g.position.copy(L.basin);tray.g.position.copy(L.tray);cup.position.copy(L.cup);
    cloth.position.copy(L.cup).add(V(-1.46,.065,.49));cup.position.y=.18;
    camera.aspect=a;const distance=worldH/(2*Math.tan(camera.fov*Math.PI/360));camera.position.set(0,distance+.45,1.32);camera.up.set(0,0,-1);camera.lookAt(0,.45,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const dpr=Math.min(window.devicePixelRatio||1,1.65,Math.sqrt(2300000/(viewW*viewH)));renderer.setPixelRatio(dpr);renderer.setSize(viewW,viewH,false);
    target.setSize(Math.round(viewW*dpr),Math.round(viewH*dpr));post.uniforms.texel.value.set(1/target.width,1/target.height);
    net.rotation.y=portrait?-.89:-.78;spoon.rotation.y=.63;
  }
  window.addEventListener('resize',resize);resize();
  let previousPhase='',hintAnchor=V(0,0,0),pointer=null;
  const buttons=Array.from(document.querySelectorAll('.steps span')),hint=document.querySelector('#hint');
  function wallStage(p){return ({fold:0,spoon:1,drop:1,fish:2,drain:2,transfer:3,coat:3,receive:3,serve:3,share:3})[p];}
  function netDestination(){return wp(basin.bowl,s.net.x*1.51,.91+s.net.depth,s.net.z*1.51);}
  function pieceOnTray(){return wp(tray.g,s.bite.x*1.89,.56,s.bite.z*1.16);}
  function refreshObjects(dt){
    const phase=s.phase,b=s.bite,n=s.net,t=s.tray;
    if(previousPhase!==phase){
      buttons.forEach((el,i)=>el.classList.toggle('on',i===wallStage(phase)));
      previousPhase=phase;
    }
    const q=s.dough[14],pull=s.pull,lean=.055*s.air.breeze+.04*q.velocity;
    pot.position.copy(L.pot);pot.position.x+=.026*pull;
    paddle.position.set(-.09+pull*.76+s.paddle.x,1.30+.26*pull+q.stretch*.25,.025+pull*.58+s.paddle.z);
    paddle.rotation.set(-.25-.22*pull,-.77+s.paddle.yaw+.115*Math.sin(s.toolAngle)*pull+lean,.02+s.toolVelocity*.037,'YXZ');
    if(phase!=='fold'){const rest=phase==='spoon'?ease(s.age/.58):1;paddle.position.x-=.29*rest;paddle.rotation.y-=.12*rest;}
    paddle.updateMatrixWorld();
    spoon.visible=phase!=='fold';
    const restSpoon=wp(pot,1.11+s.spoonPose.x,1.43,-.46+s.spoonPose.z);
    if(phase==='spoon'){
      const base=restSpoon.clone();base.y+=.10*(1-s.spoonLoad);
      const enter=ease(s.age/.78);base.x+=1.3*(1-enter);base.y+=.5*(1-enter);
      spoon.position.copy(base);
      spoon.rotation.set(-.13-.13*s.spoonLoad,.56,.1);
    }else if(phase==='drop')spoon.position.copy(arc(restSpoon,wp(basin.bowl,b.targetX*1.51,1.56,b.targetZ*1.51),Math.min(1,b.flight*1.75),.40));
    else{const spoonHome=wp(pot,1.31,1.38,-.62);spoon.position.copy(phase==='fish'?arc(wp(basin.bowl,b.targetX*1.51,1.56,b.targetZ*1.51),spoonHome,s.age*.82,.43):spoonHome);spoon.rotation.set(-.19,.7,-.16);}
    const netRest=wp(basin.bowl,.91,1.14,.62),boat=netDestination();
    if(phase==='fish'){net.position.copy(netRest).lerp(boat,ease(s.age/.43));net.rotation.z=.13+n.depth*.14;}
    else if(phase==='drain'){
      net.position.copy(boat);net.position.y+=n.shake*.052*Math.sin(n.depth*27+s.age*16);
      net.rotation.z=.04+n.v*.06+n.shake*.045*Math.cos(s.age*18);
    }else if(phase==='transfer'){net.position.copy(arc(netDestination(),wp(tray.g,-1.22,1.05,-.10),s.transport,1));net.rotation.z=-.55*s.transport;}
    else if(['coat','receive','serve','share'].includes(phase)){
      net.position.copy(arc(wp(tray.g,-1.22,1.05,-.10),netRest,phase==='coat'?s.age*.8:1,.6));net.rotation.z=.12;
    }else{net.position.copy(netRest);net.rotation.z=.13;}
    tray.g.rotation.z=-t.tilt*.27;tray.g.rotation.x=t.tiltZ*.35;tray.g.position.y=Math.abs(t.tilt)*.50;
    const sweep=phase==='share'?Math.sin(clamp(s.age/3.8)*Math.PI):0;
    const cupReach=['coat','receive','serve','share'].includes(phase)?(phase==='coat'?ease((b.x+.25)/1.04):1):0;
    cup.position.copy(L.cup);cup.position.y=.18;
    cup.position.lerp(wp(tray.g,2.70,.16,.23),cupReach*.72);
    if(phase==='share'){cup.position.x-=sweep*1.4;cup.position.z+=sweep*1.1;cup.position.y+=sweep*.4;}
    cup.updateMatrixWorld();
    const palm=wp(pot,-2.86,.99,.08),palmPlug=wp(basin.g,-2.13,.87,-1.16);
    const reach=phase==='drain'?ease(s.age/2.4):phase==='transfer'?1-ease(s.transport):0;
    const tidy=phase==='share'?Math.sin(ease(s.age/3.8)*Math.PI):0;
    aim.copy(palm).lerp(palmPlug,reach).lerp(wp(tray.g,-.26+.82*Math.sin(s.age*2.1),.61,-.36),tidy);
    aim.z-=1.72*Math.sin(reach*Math.PI);aim.y+=.47*Math.sin(reach*Math.PI);
    hand.position.copy(aim);hand.rotation.y=.12+reach*.35;hand.rotation.z=.03-.04*pull;
    otherHand.position.copy(wp(cup,-1.25,.26,.42));otherHand.rotation.y=.33;otherHand.rotation.z=.04;
    if(phase==='share'){
      const take=ease(s.age/.55),lift=ease((s.age-.55)/1.70),back=ease((s.age-2.45)/1.32);
      pick.position.set(.57+(.08-.57)*take,.49+.13*take,.25+.79*take);
      pick.position.add(V(-1.44,.84,worldH*.7).multiplyScalar(lift));
      pick.position.lerp(V(.57,.49,.25),back);
      pick.rotation.y=-.62-(Math.PI-.62)*take*(1-back);
    }else{pick.position.set(.57,.49,.25);pick.rotation.y=-.62;}
    bite.o.visible=(phase==='spoon'&&s.spoonLoad>.03)||['drop','fish','drain','transfer','coat','receive','serve','share'].includes(phase);
    if(bite.o.visible){
      bite.o.scale.setScalar(1);bite.o.rotation.set(0,0,0);
      if(phase==='spoon'){
        bite.o.position.copy(wp(spoon,0,.10,-.04));bite.o.scale.setScalar(ease(s.spoonLoad));bite.o.rotation.y=b.trailAngle;
      }else if(phase==='drop'){
        // The last part of the trajectory drops away from the spoon under gravity.
        const release=clamp((b.flight-.57)/.43);
        bite.o.position.copy(spoon.position);bite.o.position.y+=.104-.756*release*release;
      }else if(phase==='fish'){
        bite.o.position.copy(wp(basin.bowl,b.x*1.51,.87+s.water[264].height*.017,b.z*1.51));
        bite.o.rotation.set(b.vz*.3,b.x*.53,-b.vx*.26);bite.o.scale.set(.86,.72,.86);
      }else if(phase==='drain'||phase==='transfer'){
        bite.o.position.copy(net.position);bite.o.position.y+=.065;
        if(phase==='drain'){
          const floating=wp(basin.bowl,b.x*1.51,.87,b.z*1.51);
          bite.o.position.x=floating.x;bite.o.position.z=floating.z;bite.o.position.y=Math.max(floating.y,bite.o.position.y);
        }
        bite.o.scale.set(.86,.82,.86);
        if(phase==='transfer'&&s.transport>.71){bite.o.position.lerp(wp(tray.g,-.62*1.89,.56,-.12*1.16),ease((s.transport-.71)/.29));}
      }else if(phase==='coat'){
        bite.o.position.copy(pieceOnTray());bite.o.rotation.set(0,tray.g.rotation.y,b.angle);bite.o.scale.setScalar(.91);
      }else if(phase==='receive'){bite.o.position.copy(arc(pieceOnTray(),wp(cup,.08,.54,.31),s.serve,.19));bite.o.rotation.y=tray.g.rotation.y;bite.o.rotation.z=b.angle;}
      else{bite.o.position.copy(wp(cup,.08,.54,.31));bite.o.rotation.y=tray.g.rotation.y;bite.o.rotation.z=b.angle;
        if(phase==='share'){
          const lift=ease((s.age-.55)/1.70);bite.o.position.x-=lift*1.44;bite.o.position.z+=lift*(worldH*.7);bite.o.position.y+=lift*.84;
        }
      }
    }
    if(phase==='share'){const settle=ease((s.age-1.7)/1.6);pot.position.x-=.25*Math.sin(settle*Math.PI);pot.position.z+=.22*Math.sin(settle*Math.PI);}
    branch.leaves.forEach((l,i)=>{l.rotation.z=s.air.breeze*(.052+i*.005);l.rotation.x=.045*s.air.breeze*Math.cos(i*.85);});
    if(phase==='fold')hintAnchor.copy(wp(paddle,0,.11,2.16));
    else if(phase==='spoon')hintAnchor.copy(s.spoonLoad>.65?wp(basin.bowl,.09,1,.11):wp(spoon,0,.2,-.85));
    else if(phase==='fish'||phase==='drain')hintAnchor.copy(wp(net,0,.17,-.85));
    else if(phase==='coat')hintAnchor.copy(wp(tray.g,-1.46,.43,.81));
    else hintAnchor.copy(wp(cup,.39,.63,.3));
    const hi=s.idle-4,cycle=hi%4.8,show=hi>0&&['fold','spoon','fish','drain','coat','serve'].includes(phase);
    const alpha=show?ease(cycle/.33)*(1-ease((cycle-2.6)/.52)):0;
    hint.style.opacity=String(alpha*.9);
    if(alpha>0){
      const g=ease((cycle-.56)/1.56);const dst=phase==='fold'?wp(pot,-.23,1.34,-.18):phase==='fish'?wp(basin.bowl,b.x*1.5,1.03,b.z*1.5):phase==='coat'?wp(tray.g,.77,.46,.19):phase==='drain'?wp(net,.08,.74,-.94):hintAnchor.clone().add(V(.04,-.10,.09));
      projected.copy(hintAnchor).lerp(dst,g*.62).project(camera);
      hint.style.transform='translate('+((projected.x*.5+.5)*viewW-7)+'px,'+((.5-projected.y*.5)*viewH-4)+'px) rotate(-13deg) scale('+(1-.08*Math.sin(g*Math.PI))+')';
    }
  }
  hand.position.copy(wp(pot,-2.86,.99,.08));
  function particles(){
    steam.forEach((o,i)=>{
      const p=s.air.plumes[i];o.visible=!!p;if(!p)return;
      const f=p.age/p.life,attr=o.geometry.attributes.position;
      for(let j=0;j<attr.count;j++){const u=o.geometry.attributes.uv.getX(j)-.5,v=o.geometry.attributes.uv.getY(j);
        attr.setXYZ(j,u*(.28+.21*v)+.09*Math.sin(v*5+p.spin+f*2),v*(.58+f*.5),-.22*v+.07*Math.sin(v*6+p.spin));}attr.needsUpdate=true;
      o.position.set(p.x*1.4,1.26+p.y,p.z*1.4);o.rotation.y=p.spin*.19;o.material.opacity=.14*Math.sin(f*Math.PI);
    });
    function scatter(obj,items,source,scaleX,scaleZ,base){
      obj.count=Math.min(items.length,48);for(let i=0;i<obj.count;i++){const p=items[i];dummy.position.copy(wp(source,p.x*scaleX,p.y+base,p.z*scaleZ));
        dummy.rotation.set(0,0,0);dummy.scale.set(p.size,p.size*(obj===rain?1.3+.24*Math.abs(p.vy):.75),p.size);
        dummy.updateMatrix();obj.setMatrixAt(i,dummy.matrix);}obj.instanceMatrix.needsUpdate=true;
    }
    scatter(rain,s.air.drops,basin.bowl,1.51,1.51,.90);scatter(flyingPowder,s.air.grains,tray.g,1.89,1.16,.35);
  }
  // Gesture targets are physical tools, their handles and the currently reachable material.
  const ray=new T.Raycaster(),plane=new T.Plane(V(0,1,0),0),screen=new T.Vector2();
  function at(ev,y){
    screen.set(ev.clientX/viewW*2-1,1-ev.clientY/viewH*2);ray.setFromCamera(screen,camera);plane.constant=-y;
    const hit=ray.ray.intersectPlane(plane,V(0,0,0));return hit||V(100,0,100);
  }
  function coords(ev,object,y,sx,sz){const p=object.worldToLocal(at(ev,y));return {x:p.x/sx,z:p.z/sz};}
  function segmentHit(ev,tool,head,tip,r){
    const a=wp(tool,...head),b=wp(tool,...tip),p=at(ev,(a.y+b.y)/2);
    const dx=b.x-a.x,dz=b.z-a.z,f=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1));
    return Math.hypot(p.x-a.x-dx*f,p.z-a.z-dz*f)<r;
  }
  function identify(ev){
    const potPos=coords(ev,pot,1.18,1.90,1.90),water=coords(ev,basin.bowl,1.25,1.56,1.56),powder=coords(ev,tray.g,.42,2.24,1.53),dish=coords(ev,cup,.6,1.16,1.16);
    const inWater=Math.hypot(water.x,water.z)<1.03,inTray=Math.abs(powder.x)<1&&Math.abs(powder.z)<1;
    if(s.phase==='fold'&&segmentHit(ev,paddle,[0,0,-.68],[0,0,2.83],portrait?.46:.39))return {tool:'paddle',...potPos};
    if(s.phase==='spoon'){
      if(inWater&&s.spoonLoad>.6)return {tool:'bowl',...water};
      if(segmentHit(ev,spoon,[0,0,.34],[0,.2,-1.90],.46))return {tool:'spoon',...potPos};
      if(Math.hypot(potPos.x,potPos.z)<.87)return {tool:'dough',...potPos};
    }
    if(s.phase==='fish'||s.phase==='drain'){
      if(segmentHit(ev,net,[0,0,.47],[0,.18,-1.99],.53))return {tool:'net',...water};
      if(s.phase==='fish'&&inWater)return {tool:'water',...water};
      if(s.phase==='drain'&&inTray)return {tool:'tray',...powder};
    }
    if((s.phase==='serve'||s.phase==='coat')&&Math.hypot(dish.x,dish.z)<1)return {tool:'cup',...dish};
    if(s.phase==='coat'&&inTray)return {tool:'tray',...powder};return null;
  }
  const audio=(()=>{
    let context,master,buf,muted=false,lastDrip=-9;
    function start(){
      try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=muted?0:.47;master.connect(context.destination);
        buf=context.createBuffer(1,context.sampleRate*1.6,context.sampleRate);const a=buf.getChannelData(0);let prev=0;for(let i=0;i<a.length;i++){prev=(prev+(Math.random()-.5)*.21)/1.04;a[i]=prev*2;}}
        if(context.state==='suspended')context.resume().catch(()=>{});
      }catch{}}
    function tone(at,start,end,dur,amp,type='sine'){
      const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(start,at);o.frequency.exponentialRampToValueAtTime(end,at+dur);
      g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.001,amp),at+.009);g.gain.exponentialRampToValueAtTime(.0001,at+dur);
      o.connect(g);g.connect(master);o.start(at);o.stop(at+dur+.025);
    }
    function breath(at,dur,freq,amp,q=.70){
      const src=context.createBufferSource(),filter=context.createBiquadFilter(),g=context.createGain();src.buffer=buf;filter.type='bandpass';filter.frequency.setValueAtTime(freq,at);filter.frequency.exponentialRampToValueAtTime(Math.max(100,freq*.52),at+dur);filter.Q.value=q;
      g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0003,amp),at+dur*.17);g.gain.exponentialRampToValueAtTime(.0001,at+dur);src.connect(filter);filter.connect(g);g.connect(master);src.start(at,Math.random()*.5,dur+.01);
    }
    function play({type,strength:k}){
      if(!context||muted||context.state!=='running')return;const a=context.currentTime+.009;
      if(type==='plop'){tone(a,490,116,.16,k*.93);tone(a+.043,176,68,.29,k*.55);tone(a+.094,596,930,.08,k*.16);breath(a,.13,1500,k*.33);}
      if(type==='inlet'){tone(a,750,480,.082,k*.13);breath(a,.105,2400,k*.18);}
      if(type==='drip'&&a-lastDrip>.057){lastDrip=a;tone(a,1050+randomPitch(),530,.105,k*.80);tone(a+.026,590,890,.055,k*.27);}
      if(type==='fold'){tone(a,158,72,.17,k*.18);breath(a,.29,665,k*.72);}
      if(type==='powder'){breath(a,.42,2600,k*.93);breath(a+.07,.31,5100,k*.26);}
      if(type==='scoop'||type==='water'){breath(a,.24,1300,k*.8);tone(a,560,310,.13,k*.13);}
      if(type==='ready'||type==='ceramic'){tone(a,1064,1049,.36,k*.37);tone(a,1781,1760,.18,k*.10);}
    }
    const randomPitch=()=>Math.random()*230;
    function toggle(){start();muted=!muted;if(master)master.gain.setTargetAtTime(muted?0:.47,context.currentTime,.03);return muted;}
    return {start,play,toggle};
  })();
  document.querySelector('#sound').addEventListener('click',e=>{e.currentTarget.setAttribute('aria-pressed',String(audio.toggle()));});
  canvas.addEventListener('pointerdown',ev=>{
    if(pointer!==null)return;audio.start();const hit=identify(ev);if(!hit)return;
    if(!sim.begin(hit.tool,hit.x,hit.z))return;
    pointer=ev.pointerId;canvas.setPointerCapture(pointer);canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('pointermove',ev=>{
    if(pointer!==ev.pointerId){if(pointer===null&&ev.pointerType==='mouse')canvas.style.cursor=identify(ev)?'grab':'default';return;}
    let q;
    if(s.phase==='fold'||s.phase==='spoon')q=coords(ev,pot,1.3,1.83,1.83);
    else if(s.phase==='coat')q=coords(ev,tray.g,.43,2.0,1.27);
    else q=coords(ev,basin.bowl,1.28,1.51,1.51);
    sim.move(q.x,q.z);
  });
  function release(ev){
    if(pointer!==ev.pointerId)return;
    const q=coords(ev,basin.bowl,1.23,1.56,1.56),inWater=Math.hypot(q.x,q.z)<1.05&&ev.type!=='pointercancel';
    sim.end(inWater?'bowl':null,q.x,q.z);pointer=null;if(canvas.hasPointerCapture(ev.pointerId))canvas.releasePointerCapture(ev.pointerId);canvas.style.cursor='default';
  }
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  function draw(dt){
    refreshObjects(dt);dough.update(s);basin.update(s,dt);if(bite.o.visible)bite.update(s);if(['coat','share','fold'].includes(s.phase)&& (s.phase!=='fold'||s.age<.09))tray.update(s);
    particles();renderer.setRenderTarget(target);renderer.render(world,camera);renderer.setRenderTarget(null);renderer.render(postWorld,postCam);
  }
  const detailGroups=[cup,net,hand,otherHand,basin.g,branch.g];
  let last=0,firstFrame=true;
  function animate(now){
    const dt=last?Math.min(.06,(now-last)/1000):1/60;last=now;
    sim.step(dt);for(const e of sim.takeEvents())audio.play(e);
    draw(dt);if(firstFrame)firstFrame=false;else if(detailGroups.length)Studio.batch(detailGroups.shift());else Studio.polish();requestAnimationFrame(animate);
  }
  document.addEventListener('visibilitychange',()=>{last=0;});requestAnimationFrame(animate);
})();
