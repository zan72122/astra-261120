(() => {
  'use strict';
  const {T,TAU,group,mesh,oval,box,rod,line,lathe,ring,mat,plate,stand,ivory,glaze,pink,gold,steel,berry,bag,flower,sculpt,fabric,cotton,surface}=Models;
  const {angles,ease,wrap}=PastryKitchen, kitchen=PastryKitchen.createKitchen(), sound=PastrySound;
  window.__GAME__={step:kitchen.step,getState:kitchen.getState};
  const canvas=document.querySelector('canvas');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new T.Scene();scene.background=new T.Color(0xefe0d0);
  scene.fog=new T.FogExp2(0xf0dcc7,.041);
  const camera=new T.PerspectiveCamera(34,1,.08,75),v3=(x,y,z)=>new T.Vector3(x,y,z);
  const hemi=new T.HemisphereLight(0xfff0db,0xe9bda8,1.03);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffecce,2.62);
  sun.position.set(-4.8,6.7,2.4);sun.target.position.set(0,.3,0);scene.add(sun,sun.target);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-4.8,right:4.8,top:4.8,bottom:-4.8,near:.4,far:20});
  sun.shadow.normalBias=.0018;sun.shadow.bias=-.00012;sun.shadow.radius=2;
  const floor=group(scene);
  box(floor,Models.woodMat(),0,-.295,0,26,.58,18);
  const station=group(scene),pedestal=stand(station),spinGroup=group(station);
  const board=plate(spinGroup,1.69,Models.ivory,true);board.position.y=.79;
  const base=.852,top=base+1.027, pastry=group(spinGroup);
  pastry.position.y=base;
  let fullCake=Bakery.cake(pastry), remainder=null, wedge=null,extraCake=null;
  const basket=Models.colander(scene), cloth=fabric(scene,2.43,2.06,Models.linen(),pink,true);
  const tray=plate(scene,1,glaze,true);tray.scale.set(.62,.94,1.17);
  const pipe=bag(scene);
  const smallPlate=plate(scene,1.01,ivory,true);
  const cutlery=group(scene);
  const blade=mesh(cutlery,surface(20,1,(u,v)=>{
    return [(.17*v-.085)*Math.sin(Math.PI*(.05+.45*u)),.018*(v-.5),-.99*u];
  }),steel);blade.material.side=T.DoubleSide;
  rod(cutlery,Models.glaze,[0,0,.01],[0,.025,.56],.055,.074,22);
  ring(cutlery,gold,.059,.011,.0).rotation.x=0;
  const demo=Bakery.example(scene);
  Models.batchStatic(pedestal);Models.batchStatic(basket);Models.batchStatic(demo);
  const aunt=Bakery.person(scene);
  const berryNodes=angles.map((_,i)=>berry(scene,i));
  const fNodes=[];
  const localBasket=[[0,.47,.05],[-.38,.61,.32],[.27,.61,.33],[.48,.63,-.10],[-.02,.73,-.33],[-.49,.65,-.20],[.02,.79,.03],[.12,.68,.48]];
  // A gently raised porcelain lip for the child to push when serving.
  const medallion=group(station);medallion.position.set(0,.659,1.917);
  oval(medallion,gold,0,0,0,.174,.071,.029);
  oval(medallion,glaze,0,.003,.018,.163,.059,.022);
  const stamp=mat(0xaf7066,.52);
  oval(medallion,stamp,0,-.004,.041,.029,.030,.005);
  for(const sign of [-1,1]){const q=oval(medallion,Models.sage,.013*sign,.023,.041,.019,.007,.006);q.rotation.z=sign*.43;}

  let portrait=false,width=0,height=0,halfWidth=0;
  const layout={bowl:new T.Vector3(),tray:new T.Vector3(),served:new T.Vector3()};
  function resize(){
    width=canvas.clientWidth;height=canvas.clientHeight;
    portrait=width/height<.93;
    layout.bowl.set(portrait?-1.27:-2.51,.023,portrait?2.49:1.22);
    layout.tray.set(portrait?1.56:2.55,.025,portrait?1.88:.68);
    layout.served.set(portrait?.05:.63,.024,portrait?2.78:2.22);
    basket.scale.setScalar(portrait?.85:.94);
    cloth.position.copy(layout.bowl);cloth.position.y=.002;cloth.rotation.y=portrait?-.32:-.40;
    cloth.scale.setScalar(portrait?.9:1.05);
    tray.position.copy(layout.tray);tray.rotation.y=portrait?-.27:-.37;
    demo.position.set(portrait?-1.68:-2.72,.013,portrait?-2.36:-1.77);demo.scale.setScalar(portrait?.79:.94);demo.rotation.y=-.69;
    camera.aspect=width/height;renderer.setSize(width,height,false);if(post)post.rt.setSize(canvas.width,canvas.height);
    aimCamera(kitchen.read());camera.updateProjectionMatrix();
  }
  function aimCamera(s){
    const aspect=width/height,look=s.tilt*(1-ease(s.cut/.37)),elev=(portrait?.565:.445)-look*.178;
    halfWidth=portrait?2.54:Math.max(3.83,2.53*aspect);
    const fov=portrait?34:32;
    const distance=halfWidth/(aspect*Math.tan(fov*Math.PI/360));
    const target=v3(portrait?-.045:0,portrait?1.10:1.21,portrait?.39:.16);
    camera.fov=fov;
    camera.position.set(target.x+distance*.047,target.y+distance*Math.sin(elev),target.z+distance*Math.cos(elev));
    camera.lookAt(target);camera.updateMatrixWorld();camera.updateProjectionMatrix();
  }
  function basketPoint(i){const [x,y,z]=localBasket[i],r=basket.scale.x;return v3(x*r+basket.position.x,y*r+basket.position.y,z*r+basket.position.z);}
  function fruitTarget(slot){
    const a=angles[slot],r=1.272;
    return spinGroup.localToWorld(v3(r*Math.sin(a),top+.297,r*Math.cos(a)));
  }
  function worldFromLocal(x,z,h=top+.012){return spinGroup.localToWorld(v3(x/5,h,z/5));}
  function flourishPos(f){return worldFromLocal(f.x,f.z);}
  const ray=new T.Raycaster(),ndc=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0);
  function setRay(e){ndc.set(e.clientX/width*2-1,1-e.clientY/height*2);ray.setFromCamera(ndc,camera);}
  function hit(o){return o.visible&&ray.intersectObject(o,true).length>0;}
  function ground(y){const p=new T.Vector3();plane.constant=-y;return ray.ray.intersectPlane(plane,p);}
  function localPoint(y=top){const p=ground(y);if(!p)return null;spinGroup.worldToLocal(p);return {x:p.x*5,z:p.z*5};}
  function hitBerries(){
    const hits=ray.intersectObjects(berryNodes.filter((b,i)=>kitchen.read().berries[i].status==='basket'),true);
    if(!hits.length)return -1;
    let o=hits[0].object;while(o&&o.parent!==scene)o=o.parent;
    return berryNodes.indexOf(o);
  }
  function nearTray(){
    if(hit(tray))return true;
    const q=ground(.19);if(!q)return false;
    const v=tray.worldToLocal(q);return v.x*v.x+v.z*v.z<1.03;
  }

  let gesture=null,heldPosition=null,dropOrigin=null,dropIndex=-1,dragOffset={x:0,z:0};
  function startPipe(p){
    const spot=kitchen.site(p.x,p.z);if(!spot)return false;
    dragOffset={x:spot.x-p.x,z:spot.z-p.z};return kitchen.press(spot.x,spot.z);
  }
  function onDown(e){
    if(gesture)return;setRay(e);sound.wake();
    const s=kitchen.read();let kind='',pickedUp=false;
    if(s.phase==='berries'){
      let i=hitBerries();
      if(i<0&&hit(basket))i=s.berries.findIndex(b=>b.status==='basket');
      if(i>=0&&kitchen.liftBerry(i)){kind='berry';heldPosition=basketPoint(i);sound.note('lift');}
    }else if(s.phase==='pipe'||s.phase==='look'){
      if(s.bag==='returning')return;
      if(s.bag==='tray'&&hit(pipe)){kitchen.takeBag();kind='carry';pickedUp=true;}
      else if(s.bag==='hand'){
        if(nearTray()&&!hit(pipe)&&kitchen.parkBag()){sound.note('china');kind='park';}
        else if(hit(pipe)){kind='carry';}
        else {
          const p=localPoint();if(p&&Math.hypot(p.x,p.z)<8.25&&startPipe(p))kind='pipe';
        }
      }
      if(!kind&&s.phase==='look'&&(hit(pedestal)||hit(board)||hit(medallion))){
        kind='turn';kitchen.touch();
      }
    }else if(s.phase==='served'&&(hit(board)||hit(smallPlate)||(wedge&&hit(wedge))||hit(pedestal)||hit(fullCake))){
      kind='clear';kitchen.clearBoard();sound.note('wood');
    }
    if(!kind){if(hit(pedestal))kitchen.nudge();return;}
    gesture={id:e.pointerId,kind,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,lastT:performance.now(),distance:0,
      fromTray:pickedUp,canSqueeze:kind==='carry',stillSince:s.age};
    canvas.setPointerCapture(e.pointerId);e.preventDefault();
  }
  function onMove(e){
    if(!gesture||gesture.id!==e.pointerId)return;
    setRay(e);const a=gesture,s=kitchen.read(),x=e.clientX,y=e.clientY,t=performance.now(),dx=x-a.lastX,dy=y-a.lastY;
    a.distance=Math.max(a.distance,Math.hypot(x-a.x,y-a.y));
    if(a.kind==='berry'){
      const p=ground(top+.34);if(p&&a.distance>5)heldPosition=p;
    }else if(a.kind==='carry'||a.kind==='pipe'){
      if(a.distance>10&&nearTray()){if(s.pinch)kitchen.release();sound.quiet();a.kind='overtray';}
      else {
        const p=localPoint();if(p&&Math.hypot(p.x,p.z)<8.7){
          if(!s.pinch){
            kitchen.aim(p.x,p.z);a.kind='carry';a.stillSince=s.age;a.canSqueeze=true;
          }else kitchen.aim(p.x+dragOffset.x,p.z+dragOffset.z);
        }else if(p){if(s.pinch){kitchen.release();sound.quiet();}a.kind='carry';a.canSqueeze=false;kitchen.aim(p.x,p.z);}
      }
    }else if(a.kind==='overtray'){
      if(!nearTray())a.kind='carry';
    }else if(a.kind==='turn'){
      if(a.y-y>Math.min(53,height*.062)&&Math.abs(x-a.x)<(a.y-y)*.85){
        kitchen.serve();a.kind='serve';sound.note('wood');
      }else kitchen.spin(dx/Math.max(.016,(t-a.lastT)/1000)*.006,dy/height*4.8);
    }
    a.lastX=x;a.lastY=y;a.lastT=t;e.preventDefault();
  }
  function onUp(e){
    if(!gesture||gesture.id!==e.pointerId)return;
    setRay(e);const a=gesture,s=kitchen.read(),cancel=e.type==='pointercancel'||e.type==='lostpointercapture';
    if(a.kind==='berry'){
      const p=localPoint();dropIndex=s.heldBerry;dropOrigin=berryNodes[dropIndex].position.clone();
      kitchen.placeBerry(!cancel&&a.distance>12&&p&&Math.hypot(p.x,p.z)<8.6?Math.atan2(p.x,p.z):undefined);
      heldPosition=null;
    }else if(['carry','pipe','overtray'].includes(a.kind)){
      if(!cancel&&a.kind==='carry'&&a.canSqueeze&&(!a.fromTray||a.distance>8))startPipe({x:s.toolX,z:s.toolZ});
      kitchen.release();sound.quiet();
      if(!kitchen.site(s.toolX,s.toolZ)){const p=kitchen.point(kitchen.nextGap());kitchen.aim(p.x,p.z);}
      if(!cancel&&a.distance>10&&nearTray()&&kitchen.parkBag())sound.note('china');
    }else if(a.kind==='turn')kitchen.stopSpin();
    gesture=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  }
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,onUp);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  let post=null,lastBatch=-1,cutData=null,prevPhase='',prevPlaced=0;
  const handPos=v3(2.1,1.35,-1.12),restTool=new T.Vector3(),restRotation=new T.Euler(1.03,-.43,-.31);
  const toolPos=new T.Vector3(),targetQ=new T.Quaternion(),tempEuler=new T.Euler();
  let newBasket=null;
  function disposeTree(o){
    if(!o)return;
    o.removeFromParent();
    const geometries=new Set(), materials=new Set();
    scene.traverse(q=>{if(q.isMesh){geometries.add(q.geometry);materials.add(q.material);}});
    o.traverse(q=>{if(q.isMesh){
      if(!geometries.has(q.geometry))q.geometry.dispose();
      if(!materials.has(q.material))q.material.dispose();
      if(q.isInstancedMesh)q.dispose();
    }});
  }
  function startCut(s){
    const center=s.cutAngle,half=s.portion.half,from=center-half;
    fullCake.visible=false;remainder=Bakery.cake(pastry,center+half,TAU-half*2,true);
    wedge=Bakery.cake(scene,from,half*2,true);
    cutData={center,half,transfer:s.portion.transfer};
  }
  function resetBatch(s){
    const old=lastBatch>=0;lastBatch=s.batch;
    if(old){
      disposeTree(wedge);disposeTree(remainder);disposeTree(extraCake);disposeTree(newBasket);
      wedge=null;remainder=null;extraCake=null;newBasket=null;cutData=null;
      for(const n of fNodes){n.removeFromParent();n.geometry.dispose();}
      fNodes.length=0;fullCake.visible=true;dropOrigin=null;dropIndex=-1;
    }
    prevPlaced=0;
  }
  function arrangeCut(s){
    if(!cutData)startCut(s);
    const delivering=cutData.transfer>=0;
    const start=delivering?.65:.47,a=ease((s.cut-start)/(.98-start)),c=ease(s.clear/.58);
    const serving=layout.served,rotate=s.rotation;
    const dest=v3(serving.x,serving.y+.063,serving.z);
    // Put the wedge's centre of mass, rather than its apex, on the plate.
    const turnTo=portrait?-.72:-.91;
    dest.x-=.92*Math.sin(turnTo);dest.z-=.92*Math.cos(turnTo);
    wedge.position.set(station.position.x,base,station.position.z).lerp(dest,a);
    wedge.position.y+=Math.sin(a*Math.PI)*.47;
    wedge.position.x-=(halfWidth+2.9)*c;wedge.position.z+=1*c;
    wedge.rotation.y=rotate+turnTo*a;
    wedge.updateMatrixWorld(true);
    const rest=v3(portrait?.65:2.51,.023,portrait?-2.2:-1.56);
    smallPlate.position.copy(rest).lerp(serving,ease((s.cut-.24)/.35));
    smallPlate.position.x-=(halfWidth+2.9)*c;smallPlate.position.z+=c;
    // The cake server follows the cut and carries the wedge down to the plate.
    const plunge=ease((s.cut-(delivering?.46:.13))/(delivering?.14:.22)),lift=ease((s.cut-(delivering?.61:.37))/.16);
    cutlery.position.set(.76+.19*lift,top+.63-.97*plunge+.40*lift,1.28+.33*lift);
    cutlery.position.lerp(v3(wedge.position.x+.40,wedge.position.y+.04,wedge.position.z+1.41),a);
    cutlery.rotation.set(-.34+.26*a,-.43+.38*a,-1.05*(1-lift));
    if(delivering&&s.cut<.46){
      const f=s.flowers[cutData.transfer],source=flourishPos(f);
      const landing=worldFromLocal(4.85*Math.sin(cutData.center),4.85*Math.cos(cutData.center));
      const q=ease((s.cut-.17)/.22);
      const carrying=source.lerp(landing,q);carrying.y+=Math.sin(q*Math.PI)*.29;
      carrying.add(v3(.28,.002,.61));
      const home=smallPlate.position.clone().add(v3(-.04,.13,-.04));
      home.lerp(carrying,ease(s.cut/.14));
      cutlery.position.lerp(home,1-ease((s.cut-.39)/.07));cutlery.rotation.set(.02,.43,-.06);
    }
    cutlery.position.x+=ease((s.cut-.88)/.12)*1.44;
    cutlery.position.lerp(v3(layout.tray.x,.17,layout.tray.z+.24),ease((s.cut-.9)/.1));
  }
  function wedgeContains(angle){return cutData&&Math.abs(wrap(angle-cutData.center))<cutData.half;}
  function fruitPose(s,i,b,n){
    const start=basketPoint(i),a=angles[Math.max(0,b.slot)],end=fruitTarget(Math.max(0,b.slot));
    let progress=0,target=end;
    const lay=[.3,-.29,.8,-.86,.71,-1.18,.45,-.67][i],spin=.57+i*2.28;
    if(b.status==='basket'){n.position.copy(start);}
    else if(b.status==='held'){
      const p=heldPosition||start; n.position.copy(p);n.position.y+=b.lift/5;progress=b.roll;
    }else if(b.status==='flying'){
      const q=ease(b.progress);
      const source=b.fromHand?v3(.39,top+.86,-.43):(i===dropIndex&&dropOrigin?dropOrigin:start);
      n.position.copy(source).lerp(end,q);n.position.y+=Math.sin(Math.PI*q)*(b.fromHand?.12:.54);progress=q;
    }else{
      if(cutData&&wedgeContains(a))target=wedge.localToWorld(v3(1.272*Math.sin(a),1.324,1.272*Math.cos(a)));
      n.position.copy(target);n.position.y+=b.bounce*.22;progress=1;
    }
    const fruitYaw=a+2.55+(i%3)*.39+(cutData&&wedgeContains(a)?wedge.rotation.y:s.rotation);
    n.rotation.set(lay*(1-progress)+(.17+.045*Math.sin(i))*progress,spin+wrap(fruitYaw-spin)*progress,
      .67*Math.cos(i*3)*(1-progress)+.075*Math.sin(i*3.2)*progress);
    const scale=(basket.scale.x+(1-basket.scale.x)*progress)*(.93+.05*Math.cos(i*4));
    n.scale.set(scale*(1+b.bounce*.10),scale*(1-b.bounce*.22),scale);
    n.userData.skin.roughness=.47-.21*b.moisture;
  }
  function creamPose(s,i,f){
    let n=fNodes[i];if(!n){n=flower(scene);fNodes.push(n);}
    const stamp=f.mass+f.tip*7+f.bendX*.7+f.bendZ*.6+f.trailX*.57+f.trailZ*.75+f.width*.6;
    if(n.userData.stamp===undefined||Math.abs(stamp-n.userData.stamp)>.00018){sculpt(n,f);n.userData.stamp=stamp;}
    const angle=Math.atan2(f.x,f.z);
    const carried=cutData&&wedgeContains(angle);
    const p=carried?wedge.localToWorld(v3(f.x/5,1.033,f.z/5)):flourishPos(f);
    n.rotation.y=carried?wedge.rotation.y:s.rotation;
    if(cutData&&cutData.transfer===i){
      const q=ease((s.cut-.17)/.22);
      const dest=wedge.localToWorld(v3(.97*Math.sin(cutData.center),1.036,.97*Math.cos(cutData.center)));
      p.lerp(dest,q);p.y+=Math.sin(Math.PI*q)*.29;n.rotation.y=s.rotation+(wedge.rotation.y-s.rotation)*q;
    }
    n.position.copy(p);
  }
  function pointHint(s){
    const h=s.hint,beat=ease(h/.84)*(1-ease((h-3.86)/.92)),target=handRest();
    if(!beat)return target;
    let a,b;
    if(s.phase==='berries'){
      const next=s.berries.findIndex(q=>q.status==='basket');if(next<0)return target;
      a=basketPoint(next);b=fruitTarget(s.berries.findIndex(q=>q.slot<0));
    }else if(s.phase==='pipe'){
      a=toolPos.clone();
      if(s.flowers.length){b=layout.tray.clone();b.y=.33;}
      else {const g=kitchen.point(kitchen.nextGap());b=worldFromLocal(g.x,g.z);}
    }else if(s.phase==='look'){
      a=v3(-.55,.80,1.80);b=v3(.75,.84,1.57);
      if(Math.floor((s.idle-4)/6.7)%2){a=v3(.05,.79,1.96);b=v3(.05,.85,1.28);}
    }else if(s.phase==='served'){a=board.getWorldPosition(new T.Vector3());a.z+=1.54;b=a.clone().add(v3(1.06,.12,-.47));}
    if(!a||!b)return target;
    const q=ease((h-1.38)/1.65);a.lerp(b,q);a.add(v3(.32,.23+Math.sin(q*Math.PI)*.22,0));
    return target.lerp(a,beat);
  }
  function handRest(){return v3(portrait?1.95:2.39,1.04,-.94);}
  function poseTools(s,dt){
    restTool.copy(layout.tray).add(v3(-.095,.196,.55));
    restRotation.set(-1.26,.07,-.35);
    const g=kitchen.point(kitchen.nextGap()),rest=restTool.clone();
    let active=0;
    if(s.phase==='handoff'){active=ease(s.handoff);}
    else if(s.bag==='hand'){active=1;}
    else if(s.bag==='returning'){active=1-ease(s.trayReturn);}
    const f=s.flowers[s.deposit];
    const beneath=s.flowers.find(q=>Math.hypot(q.x-s.toolX,q.z-s.toolZ)<q.width+.3);
    const hover=Math.max(.34,beneath?(beneath.height+beneath.tip)/5+.15:0);
    const target=worldFromLocal(s.phase==='handoff'?g.x:s.toolX,s.phase==='handoff'?g.z:s.toolZ,
      top+(s.pinch?.055+(f?f.height/5:0):hover));
    if(!s.pinch&&s.bag==='hand')target.y+=.025*s.air+.012*s.pressure[2];
    if(gesture?.kind==='overtray')target.copy(rest).add(v3(0,.23,0));
    const pos=rest.lerp(target,active);pos.y+=.30*Math.sin(active*Math.PI);
    toolPos.lerp(pos,dt===0?1:1-Math.exp(-dt*19));pipe.position.copy(toolPos);
    const restQuat=new T.Quaternion().setFromEuler(restRotation);
    tempEuler.set(-.38,.16,-.51);targetQ.copy(restQuat).slerp(new T.Quaternion().setFromEuler(tempEuler),active);
    pipe.quaternion.copy(targetQ);
    pipe.userData.body.scale.set(1-s.pressure[0]*.083,1+s.pressure[1]*.034,1-s.pressure[2]*.05);
    let desired=pointHint(s);
    if(s.phase==='berries'&&s.berries[0].status==='flying'){
      desired=berryNodes[0].position.clone().add(v3(.26,.26,-.06));
      desired.lerp(handRest(),ease((s.berries[0].progress-.63)/.37));
    }else if((s.bag==='hand'||s.phase==='handoff'||s.bag==='returning')&&(!s.hint||s.pinch||s.hint>4.78)){
      desired=pipe.localToWorld(v3(.12,1.12,-.035));desired.x+=.16;
    }else if(s.phase==='cut'&&(s.cut>.14||cutData.transfer>=0)){desired=cutlery.localToWorld(v3(.10,.11,.45));}
    else if(s.phase==='cut'){desired=v3(.83,top+.65,1.48);}
    handPos.lerp(desired,dt===0?1:1-Math.exp(-dt*6.5));
    aunt.pose(handPos.toArray(),[portrait?2.59:3.14,.46,-1.10],portrait);
  }
  function parade(s){
    if(!extraCake){
      extraCake=group(scene);const newBoard=plate(extraCake,1.69,ivory,true);newBoard.position.y=.79;
      const newCake=Bakery.cake(extraCake);newCake.position.y=base;
      newBasket=Models.colander(scene);
      for(let i=1;i<8;i++){const b=berry(newBasket,i);b.position.set(...localBasket[i]);b.rotation.set(.4,i*2.28,.65*Math.cos(i*3));}
    }
    const q=ease((s.clear-.41)/.59);
    extraCake.position.set(-6.9*(1-q),.19*Math.sin(q*Math.PI),-.80*(1-q));
    newBasket.scale.copy(basket.scale);newBasket.position.copy(layout.bowl);newBasket.position.x-=5.6*(1-q);
  }
  let particles=null;
  function sync(dt){
    const s=kitchen.read();
    if(lastBatch!==s.batch)resetBatch(s);
    aimCamera(s);
    basket.position.copy(layout.bowl);basket.position.x-=ease(s.clear/.54)*(halfWidth+2);
    station.position.set(0,0,-ease(s.cut/.40)*.40*(1-ease(s.clear/.71)));
    spinGroup.position.x=ease(s.clear/.56)*6.7;spinGroup.position.z=-.53*ease(s.clear/.56);
    spinGroup.rotation.y=s.rotation;station.rotation.z=s.nudge*.015;
    station.updateMatrixWorld(true);
    if(s.phase==='cut'||s.phase==='served')arrangeCut(s);
    else {
      smallPlate.position.set(portrait?.65:2.44,.022,portrait?-2.23:-1.69);
      cutlery.position.copy(smallPlate.position).add(v3(-.04,.13,-.04));cutlery.rotation.set(.016,-.74,-.04);
    }
    if(s.clearing)parade(s);
    s.berries.forEach((b,i)=>fruitPose(s,i,b,berryNodes[i]));
    s.flowers.forEach((f,i)=>creamPose(s,i,f));
    poseTools(s,dt);
    sun.intensity=2.62+s.drift*.18;
    if(particles)particles.update(s,dt);
    const placed=s.berries.filter(q=>q.status==='placed').length;
    if(placed>prevPlaced)sound.note('berry');
    if(prevPhase==='handoff'&&s.phase==='pipe')sound.note('lift');
    prevPlaced=placed;prevPhase=s.phase;
  }
  // A handful of flour motes travel in different local air currents.
  function addMotes(){
    const n=33,geo=new T.IcosahedronGeometry(1,0),m=mat(0xffe7bf,.86,0,{transparent:true,opacity:.40,depthWrite:false});
    const ins=new T.InstancedMesh(geo,m,n),d=new T.Object3D();
    scene.add(ins);return {update(s){s.motes.forEach((m,i)=>{
      d.position.set(m.x,m.y,m.z);d.scale.setScalar(.0024+.0027*((i*.618)%1));d.updateMatrix();ins.setMatrixAt(i,d.matrix);
    });ins.instanceMatrix.needsUpdate=true;}};
  }
  function addReflection(){
    const rt=new T.WebGLCubeRenderTarget(64,{type:T.HalfFloatType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
    const cubecam=new T.CubeCamera(.12,36,rt);cubecam.position.set(-.38,2.43,.31);
    renderer.shadowMap.autoUpdate=false;cubecam.update(renderer,scene);renderer.shadowMap.autoUpdate=true;
    const pm=new T.PMREMGenerator(renderer),lightMap=pm.fromCubemap(rt.texture);
    scene.environment=lightMap.texture;scene.environmentIntensity=.37;
    rt.dispose();pm.dispose();
  }
  function finish(){
    // Four neighbouring highlights give only the brightest glaze a soft shoulder.
    const rt=new T.WebGLRenderTarget(canvas.width,canvas.height,{type:T.HalfFloatType,depthBuffer:true,samples:Math.min(2,renderer.capabilities.maxSamples)});
    const ps=new T.Scene(),pc=new T.OrthographicCamera(-1,1,1,-1,0,1);
    const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{frame:{value:rt.texture},pixel:{value:new T.Vector2()}},
      vertexShader:'varying vec2 uvPos; void main(){uvPos=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`varying vec2 uvPos;uniform sampler2D frame;uniform vec2 pixel;
      vec3 high(vec2 d){vec3 c=texture2D(frame,uvPos+d*pixel).rgb;return max(c-vec3(1.55),0.);}
      void main(){vec3 c=texture2D(frame,uvPos).rgb;
      c+=.009*(high(vec2(-3.,1.))+high(vec2(3.,-1.))+high(vec2(-1.,-3.))+high(vec2(1.,3.)));
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.54)-.5;
      gl_FragColor.rgb+=g*.004;
      }`});
    ps.add(new T.Mesh(new T.PlaneGeometry(2,2),material));
    return {rt,render(){material.uniforms.pixel.value.set(1/rt.width,1/rt.height);
      renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(ps,pc);}};
  }
  function draw(){if(post)post.render();else renderer.render(scene,camera);}
  let last=0;
  function frame(ms){
    const dt=last?Math.min(.05,(ms-last)*.001):0;last=ms;
    if(!document.hidden){
      if(gesture?.kind==='carry'&&gesture.canSqueeze&&(!gesture.fromTray||gesture.distance>8)&&kitchen.read().age-gesture.stillSince>.12){
        const s=kitchen.read();if(startPipe({x:s.toolX,z:s.toolZ}))gesture.kind='pipe';
      }
      kitchen.step(dt);sync(dt);sound.update(kitchen.read(),dt);draw();
    }
    requestAnimationFrame(frame);
  }
  resize();sync(0);draw();
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{
    Models.batchStatic(Bakery.environment(scene));floor.visible=false;particles=addMotes();draw();
    const later=window.requestIdleCallback||((f)=>setTimeout(f,25));
    later(()=>{addReflection();if(renderer.extensions.has('EXT_color_buffer_float'))post=finish();});
  });});
  addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){kitchen.release();sound.quiet();kitchen.stopSpin();
    if(kitchen.read().heldBerry>=0)kitchen.placeBerry();gesture=null;}});
  requestAnimationFrame(frame);
})();
