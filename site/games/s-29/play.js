'use strict';
(() => {
  const A=Atelier,{T,V,M}=A, sim=new SugarTable.Table();
  window.__GAME__={step:dt=>sim.step(dt),getState:()=>sim.getState()};
  const canvas=document.querySelector('#table');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.transmissionResolutionScale=.40;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.12,85);
  scene.background=new T.Color(0xe3c7b0);scene.fog=new T.FogExp2(0xe6cfb6,.023);scene.environment=A.env;scene.environmentIntensity=.49;
  const sun=new T.DirectionalLight(0xffe6c2,2.68);sun.position.set(-5.6,10,-4.1);scene.add(sun,sun.target);sun.target.position.set(0,0,1.0);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.8,far:29});sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.013;sun.shadow.bias=-.00021;sun.shadow.radius=2.4;
  scene.add(new T.HemisphereLight(0xffedd7,0xd6b9a6,.65));
  const clay=A.group(scene), rear=A.group(scene);let board,room,extras,canopy,sx=1,sz=1,compact=false;
  const sample=A.showpiece(clay),pot=A.copperPot(clay),ladle=A.ladle(clay),cradle=A.cradle(clay),plate=A.plate(clay,1.69),blade=A.spatula(clay);
  const receiver={candyCenter:{value:V()},candyNormal:{value:V(0,1,0)},rootHeight:{value:0},baseSpread:{value:.008},dishActive:{value:0}};
  const dishMaterial=M.porcelain.clone();A.dishShadows(dishMaterial,receiver);plate.traverse(o=>{if(o.material===M.porcelain)o.material=dishMaterial;});
  const child=A.hand(clay,true),elder=A.hand(clay),family=A.hand(clay,false,true);family.scale.setScalar(.96);
  const stick=A.rod(clay,[0,0,0],[0,1,0],.030,M.cane,.018,18);
  const drop=A.oval(clay,0,0,0,.09,.21,.09,M.honey),thread=A.oval(clay,0,0,0,.019,.21,.019,M.honey);
  const jointGlaze=A.oval(clay,0,0,0,.06,.04,.06,M.honey);
  let oldCycle=-1,oldPhase='',lastStage=-1,extrasJob=0;
  let w=1,h=1,scale=1;const top=.49,zc=z=>.25+z*sz;
  const workPos=p=>V(p.x*sx,top,zc(p.z));const temp=V(),target=V(),vel=V(),quat=new T.Quaternion(),identity=new T.Quaternion(),matrix=new T.Matrix4(),up=V(0,1,0);
  const audio={ctx:null,muted:false,gain:null,rub:null,filter:null};
  function unlock(){
    if(!audio.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=audio.ctx=new AC();audio.gain=c.createGain();audio.gain.gain.value=audio.muted?0:.64;audio.gain.connect(c.destination);
      const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);let n=0;for(let i=0;i<d.length;i++){n=.6*n+.4*(Math.random()*2-1);d[i]=n;}
      const noise=c.createBufferSource();noise.buffer=b;noise.loop=true;audio.filter=c.createBiquadFilter();audio.filter.type='bandpass';audio.filter.Q.value=.78;audio.rub=c.createGain();audio.rub.gain.value=0;noise.connect(audio.filter).connect(audio.rub).connect(audio.gain);noise.start();
    }if(audio.ctx.state==='suspended')audio.ctx.resume().catch(()=>{});
  }
  function note(f,f2,duration,gain,type='sine',delay=0){const c=audio.ctx;if(!c||audio.muted)return;const t=c.currentTime+.006+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f2,t+duration*.75);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(audio.gain);o.start(t);o.stop(t+duration+.02);}
  function droplet(event){const s=event.strength;note(event.frequency,128+s*33,event.duration,.108+s*.085);note(event.frequency*2.15,event.frequency*.94,.035,.025+s*.023,'triangle');}
  function soundStep(){for(const event of sim.events){if(event.kind==='drop')droplet(event);if(event.kind==='window'){note(886,863,.115,.027);note(1240,1190,.13,.013,'sine',.031);}if(event.kind==='join')note(300,242,.09,.032,'triangle');if(event.kind==='carry'){note(938,922,.38,.055);note(1417,1410,.19,.018);}}
    sim.events.length=0;if(!audio.ctx)return;const c=audio.ctx;
    audio.rub.gain.setTargetAtTime(sim.acoustics.gain,c.currentTime,.037);audio.filter.frequency.setTargetAtTime(sim.acoustics.scrapeHz,c.currentTime,.055);
  }
  function iconSound(){const c=document.querySelector('#sound canvas').getContext('2d');c.setTransform(3,0,0,3,0,0);c.clearRect(0,0,30,30);c.strokeStyle=c.fillStyle='#725841';c.lineWidth=1.5;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(5,12);c.lineTo(10,12);c.lineTo(15,8);c.lineTo(15,22);c.lineTo(10,18);c.lineTo(5,18);c.closePath();c.stroke();for(const r of audio.muted?[]:[5,8.5]){c.beginPath();c.arc(14,15,r,-.73,.73);c.stroke();}if(audio.muted){c.beginPath();c.moveTo(20,12);c.lineTo(25,18);c.moveTo(25,12);c.lineTo(20,18);c.stroke();}}
  document.querySelector('#sound').onclick=e=>{unlock();audio.muted=!audio.muted;if(audio.gain)audio.gain.gain.setTargetAtTime(audio.muted?0:.64,audio.ctx.currentTime,.035);e.currentTarget.setAttribute('aria-pressed',String(audio.muted));e.currentTarget.setAttribute('aria-label',audio.muted?'音を出す':'音を切る');iconSound();};iconSound();
  function stageRail(stage){if(lastStage===stage)return;lastStage=stage;const c=document.querySelector('#path canvas').getContext('2d');c.setTransform(3,0,0,3,0,0);c.clearRect(0,0,215,47);
    const paths=[['M-11 -3 Q-7 6 0 0 L2 -3 M-11 -3 Q-6 -1 2 -3 L11 -9','M-6 5 Q-10 10 -6 11 Q-2 10 -6 5'],['M-9 9 Q-12 -3 -3 -7 Q4 -11 11 -10 Q10 4 0 7 Q-5 9 -9 9 M-11 12 L7 -7 M-5 5 L-4 -2 M-1 1 L5 1'],['M-10 7 L-4 0 L1 4 L-5 11 Z M-4 0 L2 -5 L5 -3 L1 4 M3 -5 L8 -11 Q11 -12 11 -9 L6 -3 Z'],['M-13 2 Q0 10 13 2 Q10 11 0 11 Q-10 11 -13 2 M-10 1 Q-5 -2 0 -1 M4 -1 L10 0 M0 1 L2 -10 M2 -5 Q-5 -7 -3 -12 Q3 -12 2 -5 M2 -6 Q2 -13 8 -13 Q8 -7 2 -6']];
    for(let i=0;i<4;i++){const x=29+i*52.2;c.save();c.translate(x,23.5);if(i<3){c.strokeStyle='#c9b59a';c.lineWidth=1;c.beginPath();c.moveTo(18,0);c.lineTo(34,0);c.stroke();c.fillStyle='#bd9b6d';c.beginPath();c.arc(26,0,1.6,0,Math.PI*2);c.fill();}
      if(i===stage){c.fillStyle='#96613b';c.beginPath();c.arc(0,0,16.9,0,Math.PI*2);c.fill();c.strokeStyle='#dcb782';c.lineWidth=.7;c.beginPath();c.arc(0,0,14.7,0,Math.PI*2);c.stroke();}
      c.scale(.88,.88);c.strokeStyle=i===stage?'#fff1d3':i<stage?'#997043':'#938775';c.lineWidth=1.65;c.lineJoin='round';c.lineCap='round';for(const path of paths[i])c.stroke(new Path2D(path));c.restore();}}
  // Only the moving workpiece allocates dynamic geometry. Each ring keeps its own thickness and colour.
  const glass=A.amber(0xffffff);let cap=0,beads,links;
  const ball=new T.SphereGeometry(1,14,9),cyl=new T.CylinderGeometry(1,1,1,12,1,true),col=new T.Color();
  function allocate(count){if(count<=cap)return;cap=2**Math.ceil(Math.log2(Math.max(128,count)));
    for(const obj of [beads,links])if(obj){obj.removeFromParent();obj.dispose();}
    beads=new T.InstancedMesh(ball,glass,cap);links=new T.InstancedMesh(cyl,glass,cap*2);
    for(const obj of [beads,links]){obj.count=0;obj.frustumCulled=false;obj.instanceMatrix.setUsage(T.DynamicDrawUsage);clay.add(obj);}beads.castShadow=links.castShadow=true;beads.receiveShadow=links.receiveShadow=true;
  }allocate(1);
  const mist=[];for(let i=0;i<sim.steam.length;i++){
    const m=A.mat(0xfff6df,.92,0,'fine',{transparent:true,opacity:.05,depthWrite:false,side:T.DoubleSide});
    const s=A.tube(clay,[[0,0,0],[.026,.09,.009],[-.018,.19,.011],[-.036,.26,0],[.007,.38,-.008]],.013,m,10,5);s.castShadow=s.receiveShadow=false;mist.push(s);
  }
  const dust=A.mat(0xf9dfa8,.83,0,'fine',{transparent:true,opacity:.31,depthWrite:false});
  const pollen=new T.InstancedMesh(new T.SphereGeometry(1,6,4),dust,sim.motes.length);pollen.frustumCulled=false;clay.add(pollen);
  // The final pass samples the brightest reflections for a small optical bloom.
  const targetRT=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:renderer.capabilities.maxSamples>=4?2:0});
  const finishScene=new T.Scene(),finishCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const finishMat=new T.ShaderMaterial({uniforms:{picture:{value:targetRT.texture},pixel:{value:new T.Vector2(1,1)}},depthWrite:false,depthTest:false,
    vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 st;uniform sampler2D picture;uniform vec2 pixel;
    void main(){vec3 c=texture2D(picture,st).rgb;vec3 b=vec3(0.);for(int i=0;i<8;i++){float a=float(i)*.785398;vec3 s=texture2D(picture,st+vec2(cos(a),sin(a))*pixel*3.1).rgb;b+=max(s-vec3(1.55),0.);}
    vec2 p=(st-.5)*2.;c=(c+.006*b)*(1.-.091*pow(dot(p,p)*.55,1.28));gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb+=(fract(sin(dot(gl_FragCoord.xy,vec2(13.27,71.91)))*43758.5453)-.5)*.0055;}`});
  finishScene.add(new T.Mesh(new T.PlaneGeometry(2,2),finishMat));
  const plateHome=V(),familyHome=V(),bladeHome=V();
  function resize(force=false){w=canvas.clientWidth;h=canvas.clientHeight;const a=w/h,next=a<.82;
    renderer.setSize(w,h,false);const res=renderer.getDrawingBufferSize(new T.Vector2());targetRT.setSize(res.x,res.y);finishMat.uniforms.pixel.value.set(1/res.x,1/res.y);
    if(force||next!==compact){oldPhase='';compact=next;sx=compact?.64:1;sz=compact?1.19:1;scale=compact?.87:1;
      for(const g of [board,room,extras])if(g){g.removeFromParent();g.traverse(o=>{if(o.isMesh&&!o.geometry.userData.shared)o.geometry.dispose();});}
      board=A.tabletop(clay,sx);board.scale.z=sz;board.position.z=.25*(1-sz);room=A.room(rear,compact);room.scale.z=sz;
      sample.position.set(compact?-1.68:-2.79,0,compact?-3.29:-2.97);sample.scale.setScalar(compact?.93:1.07);sample.rotation.y=.025;
      pot.position.set(compact?.26:.06,-.015,compact?-3.76:-3.24);pot.rotation.y=compact?-.38:-.18;pot.scale.setScalar(compact?.83:1);
      plateHome.set(compact?1.78:3.32,-.02,compact?-4.54:-3.54);familyHome.set(compact?2.62:4.98,.52,compact?-4.69:-3.8);
      family.position.copy(familyHome);family.rotation.set(.07,.64,-.02);cradle.position.copy(workPos(SugarTable.rest));cradle.scale.setScalar(scale);cradle.rotation.y=-.23;
      bladeHome.set(compact?-2.69:-4.54,.047,compact?1.5:.15);blade.scale.setScalar(scale);child.scale.setScalar(.86*scale);elder.scale.setScalar(1.13*scale);ladle.scale.setScalar(1.38*scale);
      const job=++extrasJob;setTimeout(()=>{if(job===extrasJob){extras=A.extras(rear,compact,sx);if(!canopy)canopy=A.canopy(rear);canopy.position.set(compact?-2.46:-3.15,4.15,-2.65);}},100);
    }
    camera.aspect=a;camera.fov=compact?43:36;const aim=compact?V(0,.52,-.11):V(0,.49,-.61);
    const distance=compact?Math.max(13.8,5.90/(2*a*Math.tan(camera.fov*Math.PI/360))):Math.max(11.02,11.28/(2*a*Math.tan(camera.fov*Math.PI/360)));
    camera.position.copy(aim).addScaledVector(compact?V(.018,.684,.729).normalize():V(.046,.590,.806).normalize(),distance);
    camera.lookAt(aim);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  resize(true);window.addEventListener('resize',()=>resize());
  let carryCenter=V(),axis=V(1,0,0),farDir=V(0,0,-1),pieceExtent=1;
  const posed=[],axisQuat=new T.Quaternion(),baseCenter=V(),leafCenter=V();let plateR=1.69;
  function survey(){if(!sim.nodes.length)return;const bounds=new T.Box3();let far=0;const orig=workPos(sim.root);pieceExtent=0;
    for(const n of sim.nodes){const v=workPos(n);bounds.expandByPoint(v);const d=v.distanceToSquared(orig);if(d>far){far=d;farDir.copy(v).sub(orig).normalize();}}
    axis.set(farDir.z,0,-farDir.x).normalize();if(axis.lengthSq()<.1)axis.set(1,0,0);bounds.getCenter(baseCenter);
    for(const n of sim.nodes)pieceExtent=Math.max(pieceExtent,workPos(n).distanceTo(baseCenter));
  }
  const plateSpot=V();
  function pose(dt,first){const phase=sim.phase,show=['shadow','serve','carry'].includes(phase),peel=phase==='peel';
    if(oldCycle!==sim.cycle){oldCycle=sim.cycle;oldPhase='';}
    if(phase!==oldPhase){if(['skewer','peel','shadow','serve','carry'].includes(phase))survey();oldPhase=phase;}
    const stage=phase==='stem'?0:phase==='lace'?1:['skewer','join','peel'].includes(phase)?2:3;stageRail(stage);
    A.wind.value=sim.air.bend;if(canopy){canopy.rotation.z=sim.air.bend*.106;canopy.rotation.y=sim.air.bend*.075;}A.updateFilm(sim,sx,sz);
    for(let i=0;i<sim.motes.length;i++){const p=sim.motes[i],r=.0065+.003*Math.sin(p.seed);matrix.compose(temp.set(p.x,p.y,p.z),identity,vel.set(r,r*.72,r));pollen.setMatrixAt(i,matrix);}pollen.instanceMatrix.needsUpdate=true;
    const lag=first?1:-Math.expm1(-9*dt),clamp=(a,b,c)=>Math.max(b,Math.min(c,a));
    const h=sim.helper,l=sim.ladle;const help=(phase==='stem'||phase==='lace'||phase==='join'&&!sim.placed)?1:0;
    const benchLevel=top+.018;
    ladle.position.set((l.x+h.x*help)*sx,top+l.height+.035*h.x*help,zc(l.z+h.z*help));
    ladle.rotation.set(clamp(l.vz*.022,-.13,.13),-.10,clamp(-.08-l.vx*.026,-.24,.13));
    // Align the lip, the thread and the recorded point on the stone.
    const lipOffset=V(-.20,.142,.099).multiply(ladle.scale).applyQuaternion(ladle.quaternion);ladle.position.x-=lipOffset.x;ladle.position.z-=lipOffset.z;
    const dripping=['stem','lace','join'].includes(phase);const pouring=(sim.held==='ladle'&&!sim.refill)||(phase==='join'&&sim.placed);
    const seed=.050+.17*Math.cbrt(Math.max(0,l.drop));const drip=ladle.localToWorld(V(-.20,.142,.099));
    drop.visible=dripping;thread.visible=dripping;drop.scale.set(seed*.71,seed*(pouring?.86:1.55),seed*.69);
    drop.position.copy(drip);drop.position.y=pouring?benchLevel+seed*.44:drip.y-seed*1.72;
    const distance=Math.max(.015,drip.y-drop.position.y);thread.position.copy(drip);thread.position.y-=distance*.46;thread.scale.set(pouring?.020:.035,distance*.54,.023);
    jointGlaze.visible=sim.joinMass>.001&&!show;jointGlaze.position.copy(workPos(sim.root));jointGlaze.position.y+=.038+(peel?sim.nodes[0].lift*.33:0);const joinR=.16*Math.cbrt(sim.joinMass/.18);jointGlaze.scale.set(joinR,joinR*.5,joinR*.86);
    blade.rotation.set(peel?-.07:0,peel?-.88:-.28,0);
    target.copy(bladeHome);if(peel){target.set(sim.blade.x*sx-.08+h.x*.34,benchLevel+.027+sim.blade.progress*.17,zc(sim.blade.z)+.38+h.z*.23);}
    if(show&&sim.serve<.64)target.set(plate.position.x-.72,Math.max(.53,plate.position.y+.15),plate.position.z+.13);
    blade.position.lerp(target,lag);
    plateSpot.set(compact?.05:.32,top+.023,.48);
    plate.position.copy(plateHome).lerp(plateSpot,sim.plate);
    plate.position.y+=Math.sin(Math.PI*sim.plate)*.49;
    const homeScale=compact?.70:.79,workScale=Math.max(compact?.79:1.01,Math.min(1.98,(pieceExtent+.32)/1.69));
    const ps=homeScale+(workScale-homeScale)*sim.plate;plate.scale.setScalar(ps);plateR=1.69*ps;
    const take=phase==='carry'?sim.platePush*.27+(1-sim.platePush*.27)*sim.serve:sim.platePush*.27;
    if(take>0){plate.position.lerp(familyHome.clone().add(V(-.73,.09,.18)),Math.min(1,take*1.65));plate.position.y+=Math.sin(Math.min(1,take*1.65)*Math.PI)*.35;
      const exit=Math.max(0,(take-.60)/.4);plate.position.x+=exit*exit*(compact?6:10);}
    if(sim.cycle&&phase==='stem'&&sim.age<2){plate.position.x+=(compact?6:10)*Math.pow(1-sim.age/2,3);}
    carryCenter.copy(plate.position);carryCenter.y+=.093*ps;axisQuat.setFromAxisAngle(axis,sim.leaf.angle);
    let lowest=0;if(show)for(const n of sim.nodes){if(n.component!==sim.nodes[0].component)continue;temp.copy(workPos(n)).sub(baseCenter).applyQuaternion(axisQuat);lowest=Math.min(lowest,temp.y);}
    if(show){temp.copy(workPos(sim.root)).addScaledVector(farDir,-1.44*scale).sub(baseCenter).applyQuaternion(axisQuat);lowest=Math.min(lowest,temp.y);}
    leafCenter.copy(carryCenter);leafCenter.y+=sim.leaf.height-lowest;const blend=sim.plate;
    allocate(Math.max(sim.nodes.length,Math.ceil(sim.edges.length/2)+1));let ecount=0;beads.count=sim.nodes.length;
    for(let i=0;i<sim.nodes.length;i++){
      const n=sim.nodes[i],r=n.radius*(1+.115*n.depth),v=posed[i]||(posed[i]=V());v.copy(workPos(n));v.y+=r*.52+n.lift*(.32+.19*n.release);
      if((peel||show)&&n.component!==sim.nodes[0].component){
        v.x+=(sim.blade.x*sx+(i%3-1)*.071-v.x)*n.lift;v.z+=(zc(sim.blade.z)+.12+.06*Math.sin(i)-v.z)*n.lift;}
      if(show){temp.copy(workPos(n)).sub(baseCenter);if(n.component===sim.nodes[0].component)temp.applyQuaternion(axisQuat).add(leafCenter);else{temp.multiplyScalar(.78).add(carryCenter);temp.y=carryCenter.y+r*.52;}v.lerp(temp,blend);}
      col.setRGB(1.00,.31+.11*n.hardness+.07*(n.temperature/137)-.055*Math.min(3,n.depth),.026+.032*n.hardness);
      matrix.compose(v,identity,vel.set(r,r*(.55+.13*(1-n.hardness)),r));beads.setMatrixAt(i,matrix);beads.setColorAt(i,col);
    }
    receiver.candyCenter.value.copy(leafCenter);receiver.candyNormal.value.copy(up).applyQuaternion(axisQuat);
    receiver.rootHeight.value=sim.leaf.height;receiver.baseSpread.value=sim.leaf.shadowWidth;receiver.dishActive.value=show?blend:0;
    for(const edge of sim.edges){const a=posed[edge.a],b=posed[edge.b],pa=sim.nodes[edge.a],pb=sim.nodes[edge.b];
      const dir=temp.copy(b).sub(a),len=dir.length();if(len<.001)continue;quat.setFromUnitVectors(up,dir.divideScalar(len));const r=(pa.radius+pb.radius)*.46*(1+.065*(pa.depth+pb.depth));
      matrix.compose(target.copy(a).lerp(b,.5),quat,vel.set(r,len,r*.88));links.setMatrixAt(ecount,matrix);col.setRGB(1,.38+.08*pa.hardness-.043*Math.min(3,pa.depth+pb.depth),.035);links.setColorAt(ecount++,col);

    }
    links.count=ecount;for(const obj of [beads,links]){obj.instanceMatrix.needsUpdate=true;if(obj.instanceColor)obj.instanceColor.needsUpdate=true;}
    let tail=V(),head=V();const root=workPos(sim.root),dir=farDir;
    const parked=V((compact?2.82:4.92),.195,-.87);tail.copy(parked).add(V(.05,0,2.45));head.copy(parked);
    const skT=sim.skewer;if(skT>.0001&&sim.nodes.length){const attached=posed[0];const newHead=attached.clone().addScaledVector(dir,.60);const newTail=attached.clone().addScaledVector(dir,-1.44*scale);
      if(show){newHead.copy(dir).multiplyScalar(.60).applyQuaternion(axisQuat).add(attached);newTail.copy(dir).multiplyScalar(-1.44*scale).applyQuaternion(axisQuat).add(attached);
      }
      newHead.y+=.052;newTail.y+=.048;tail.lerp(newTail,skT);head.lerp(newHead,skT);tail.y+=Math.sin(skT*Math.PI)*.88;head.y+=Math.sin(skT*Math.PI)*.84;}
    stick.position.copy(tail).lerp(head,.5);stick.scale.y=tail.distanceTo(head);stick.quaternion.setFromUnitVectors(up,temp.copy(head).sub(tail).normalize());
    const childAt=ladle.localToWorld(V(.95,.48,-.15)),elderAt=ladle.localToWorld(V(1.69,.70,-.28));
    if(phase==='skewer'||phase==='join'){elderAt.lerp(tail,skT*.97);if(phase==='join'&&!sim.placed){childAt.addScaledVector(temp.copy(root).sub(childAt),.12*sim.demo*(.5+h.x));}}
    if(peel){childAt.copy(blade.localToWorld(V(0,.20,.96)));elderAt.copy(tail);}
    if(show){childAt.copy(tail).lerp(stick.position,.10);elderAt.copy(tail).add(V(.31,-.07,-.13));}
    if(phase==='carry'){const t=sim.serve;childAt.lerp(plate.position.clone().add(V(.70,.05,plateR*.66)),t);elderAt.lerp(plate.position.clone().add(V(plateR*.72,-.05,.34)),t);}
    if(phase==='carry'&&sim.serve>.62){const retire=Math.min(1,(sim.serve-.62)/.20);childAt.lerp(ladle.localToWorld(V(.95,.48,-.15)),retire);elderAt.lerp(ladle.localToWorld(V(1.69,.70,-.28)),retire);}
    child.position.lerp(childAt,lag);elder.position.lerp(elderAt,lag);
    child.rotation.set(.16,peel?-.86:-.56,-.105);elder.rotation.set(-.1,.40,.08);
    family.position.copy(familyHome);family.position.x-=sim.serve*.41+sim.plate*.18;family.position.z+=(phase==='serve'?sim.demo*(.19+.28*Math.sin(h.phase)):0);family.position.y+=.045*sim.air.bend;family.rotation.y=.55-sim.serve*.2;
    sample.rotation.z=sim.air.bend*.004+sim.nudge*.08;cradle.rotation.z=sim.phase==='lace'?sim.demo*.031*Math.sin(h.phase*2):0;
    for(let i=0;i<mist.length;i++){const p=sim.steam[i],o=mist[i],life=p.y/(1.65+p.life);o.position.set(pot.position.x+p.x*.83,.64*pot.scale.y+p.y*.72,pot.position.z+p.z);o.rotation.set(.17,p.spin+p.y*.58,-sim.air.bend*.22);o.scale.set(.65+p.y*.46,.43+p.y*.43,.52);o.material.opacity=Math.max(0,.083*Math.sin(Math.PI*Math.min(1,life))*(.69+.3*Math.sin(p.spin)));}
    return {tail,head};
  }
  const ray=new T.Raycaster(),plane=new T.Plane(V(0,1,0),-top),ndc=new T.Vector2();let pointer=null,previous=V(),lastRig;
  function screen(v){const q=v.clone().project(camera);return {x:(1+q.x)*w*.5,y:(1-q.y)*h*.5};}
  function planePoint(x,y){ndc.set(x/w*2-1,1-y/h*2);ray.setFromCamera(ndc,camera);return ray.ray.intersectPlane(plane,V());}
  function hit(x,y){const range=compact?23:25;
    function segment(a,b,width){const p=screen(a),q=screen(b),dx=q.x-p.x,dy=q.y-p.y,len=dx*dx+dy*dy;
      const t=Math.max(0,Math.min(1,((x-p.x)*dx+(y-p.y)*dy)/(len||1)));return Math.hypot(x-p.x-t*dx,y-p.y-t*dy)<width;}
    const near=(v,r)=>segment(v,v,r),at=(o,v)=>o.localToWorld(V(...v));
    const active=sim.active();
    if(sim.phase==='lace'&&near(cradle.position,range*1.25))return 'rest';
    if(active==='ladle'&&segment(at(ladle,[-.18,.16,0]),at(ladle,[2.03,.78,-.31]),range))return active;
    if(active==='joint'&&(near(workPos(sim.root),range*1.6)||segment(at(ladle,[-.22,.14,0]),at(ladle,[1.98,.78,-.31]),range)||segment(lastRig.tail,lastRig.head,range*.8)))return active;
    if(active==='blade'&&segment(at(blade,[0,0,-.4]),at(blade,[0,.30,1.35]),range*1.15))return active;
    if((active==='stick'||active==='plate')&&segment(lastRig.tail,lastRig.head,range*.82))return 'stick';
    if(active==='stick'&&sim.nodes.length){const stride=Math.max(1,Math.floor(sim.nodes.length/25));for(let i=0;i<sim.nodes.length;i+=stride)if(near(posed[i],range*.95))return 'stick';}
    if(active==='plate'){const p=planePoint(x,y);if(p&&Math.hypot(p.x-plate.position.x,p.z-plate.position.z)<plateR*1.07)return 'plate';}
    if(near(sample.position.clone().add(V(-.43,1.21,0)),range*1.4))return 'sample';return '';
  }
  canvas.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;unlock();const item=hit(e.clientX,e.clientY);if(!item)return;
    if(item==='ladle'&&sim.demo>0){if(Math.hypot(sim.helper.x,sim.helper.z)>.32)sim.last=-1;sim.ladle.x+=sim.helper.x;sim.ladle.tx=sim.ladle.x;sim.ladle.z+=sim.helper.z;sim.ladle.tz=sim.ladle.z;sim.helper.x=sim.helper.z=sim.demo=0;}
    const ground=planePoint(e.clientX,e.clientY);if(!ground)return;previous.copy(ground);if(sim.press(item,ground.x,ground.z)){pointer=e.pointerId;canvas.setPointerCapture(pointer);canvas.style.cursor='grabbing';}e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(pointer===null){if(e.pointerType==='mouse'){const item=hit(e.clientX,e.clientY);canvas.style.cursor=item&&item!=='sample'?'grab':'default';}return;}if(pointer!==e.pointerId)return;
    const p=planePoint(e.clientX,e.clientY);if(p){sim.move((p.x-previous.x)/sx,(p.z-previous.z)/sz);previous.copy(p);}e.preventDefault();});
  function upPointer(e){if(pointer!==e.pointerId)return;sim.release();pointer=null;canvas.style.cursor='default';if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,upPointer);
  window.addEventListener('blur',()=>{if(pointer!==null)sim.release();pointer=null;});
  let last=performance.now();
  function paint(){renderer.setRenderTarget(targetRT);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(finishScene,finishCam);}
  function frame(now){const dt=Math.max(0,Math.min(.065,(now-last)/1000));last=now;sim.step(dt);lastRig=pose(dt,false);soundStep();paint();requestAnimationFrame(frame);}
  lastRig=pose(0,true);paint();requestAnimationFrame(frame);setTimeout(A.refineTextures,240);
})();
