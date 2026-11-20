'use strict';
requestAnimationFrame(()=>requestAnimationFrame(()=>{
const {T,V,group,mesh,mat,PI}=Art,{K,clamp,ease}=Agara;
const view=document.getElementById('room'),soundButton=document.querySelector('button'),s=Agara.create();
function speaker(muted){
  const c=soundButton.firstElementChild.getContext('2d');c.setTransform(3,0,0,3,0,0);c.clearRect(0,0,21,21);
  c.fillStyle=c.strokeStyle='#495247';c.lineWidth=1.35;c.lineCap=c.lineJoin='round';
  c.beginPath();c.moveTo(2.8,8);c.lineTo(5.8,8);c.lineTo(10.2,4.2);c.lineTo(10.2,16.8);c.lineTo(5.8,13);c.lineTo(2.8,13);c.closePath();c.fill();
  if(muted){c.beginPath();c.moveTo(13.0,8.4);c.lineTo(17.4,12.8);c.moveTo(17.4,8.4);c.lineTo(13,12.8);c.stroke()}
  else for(const r of [5.3,8.2]){c.beginPath();c.arc(9.4,10.55,r,-.75,.75);c.stroke()}
  soundButton.setAttribute('aria-pressed',String(muted));soundButton.setAttribute('aria-label',muted?'音を出す':'音を消す')
}
speaker(false);soundButton.addEventListener('click',()=>speaker(Sound.mute()));
const renderer=new T.WebGLRenderer({canvas:view,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
const scene=new T.Scene();scene.background=new T.Color(0xd9e6dc);
scene.fog=new T.Fog(0xe0e5d3,255,650);
const hemi=new T.HemisphereLight(0xfff5dd,0xc3b196,1.42);scene.add(hemi);
const sunlight=new T.DirectionalLight(0xffedcc,2.86);scene.add(sunlight,sunlight.target);
sunlight.position.set(-108,247,-160);sunlight.target.position.set(-5,69,-15);
sunlight.castShadow=true;sunlight.shadow.mapSize.set(2048,2048);
Object.assign(sunlight.shadow.camera,{left:-118,right:118,top:132,bottom:-111,near:6,far:433});sunlight.shadow.camera.updateProjectionMatrix();
sunlight.shadow.normalBias=.045;sunlight.shadow.bias=-.00019;sunlight.shadow.radius=2.2;
const soft=new T.DirectionalLight(0xe3edf2,.63);soft.position.set(14,112,151);scene.add(soft);
const sky=mesh(scene,new T.SphereGeometry(740,24,16),new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 d;void main(){float f=smoothstep(-.15,.64,normalize(d).y);gl_FragColor=vec4(mix(vec3(.88,.91,.82),vec3(.54,.75,.81),f),1.);\n#include <colorspace_fragment>\n}'
}),0,32,-90);sky.castShadow=sky.receiveShadow=false;
const camera=new T.PerspectiveCamera(46,1,.35,1050),look=V(),destEye=V(),destLook=V();
let cameraFov=46,lastWidth=0,lastHeight=0,actors,kitchen,house,live=false,ptr=null,hint=null;
const camViews={
  wide:[[14,123,70],[-6,90,-10],47,[-37,121,111],[-10,91,-13],57],
  pour:[[6,107,35],[-5,83,5],43,[-17,117,59],[-6,84,5],56],
  arrange:[[8,119,58],[-1,88,-6],47,[-19,133,76],[1,88,-1],57],
  stove:[[12,122,40],[12,91,-12],47,[-10,135,63],[12,93,-13],55],
  peek:[[17,132,31],[12,94,-12],48,[-10,142,45],[13,96,-13],54],
  serve:[[17,155,62],[-13,84,-12],49,[78,206,44],[-15,85,-17],54],
  tea:[[9,106,-61],[-32,68,-148],49,[-31,123,-13],[-36,69,-151],57]
};
function shot(snap,dt){
  let style=s.focus;if(!camViews[style])style='serve';
  const v=camViews[style],blend=clamp((.99-camera.aspect)/.45);
  function load(v){destEye.fromArray(v[0]).lerp(V(...v[3]),blend);destLook.fromArray(v[1]).lerp(V(...v[4]),blend);cameraFov=v[2]+(v[5]-v[2])*blend}
  load(v);
  if(style==='peek'&&!s.active&&s.idle>2.8){
    const pos=destEye.clone(),aim=destLook.clone(),f=cameraFov,k=ease((s.idle-2.8)/1.8);
    load(camViews.stove);destEye.lerpVectors(pos,destEye,k);destLook.lerpVectors(aim,destLook,k);cameraFov=f+(cameraFov-f)*k
  }
  if(s.focus==='study'&&s.active){
    const c=Agara.current(s,s.active.id);destLook.set(c.pos.x,c.pos.y+Agara.surfaceHeight(c,.3),c.pos.z);
    destEye.copy(destLook).add(V(8-13*blend,15+7*blend,22+7*blend));cameraFov=41+9*blend;
  }
  if(s.mode==='carry'){
    load(camViews.serve);const start=destEye.clone(),focus=destLook.clone(),f=cameraFov;
    load(camViews.tea);const p=ease(s.tray.progress);
    destEye.lerpVectors(start,destEye,p);destEye.y+=8*Math.sin(p*PI);
    destLook.lerpVectors(focus,destLook,p);cameraFov=f+(cameraFov-f)*p;
  }
  const t=snap?1:1-Math.exp(-dt*(ptr?.kind==='cup'?1.65:2.0));
  camera.position.lerp(destEye,t);look.lerp(destLook,t);camera.fov+=(cameraFov-camera.fov)*t;
  camera.lookAt(look);camera.updateProjectionMatrix();camera.updateMatrixWorld()
}
function resize(){
  const w=view.clientWidth,h=view.clientHeight;if(w===lastWidth&&h===lastHeight)return;
  lastWidth=w;lastHeight=h;renderer.setSize(w,h,false);camera.aspect=w/h;shot(true,0)
}
resize();window.addEventListener('resize',resize);
function lighting(){
  const w=128,h=64,data=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const u=x/w,v=y/h,win=Math.exp(-((u-.30)**2/.013+(v-.52)**2/.082)),top=ease((v-.4)*2.8),i=(y*w+x)*4;
    data[i]=88+top*76+win*88;data[i+1]=78+top*93+win*71;data[i+2]=65+top*97+win*59;data[i+3]=255
  }
  const env=new T.DataTexture(data,w,h);env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;scene.environment=env;scene.environmentIntensity=.41
}
const ray=new T.Raycaster(),mouse=new T.Vector2();
function rayAt(x,y){const r=view.getBoundingClientRect();mouse.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera)}
function whereAt(x,y,h){
  rayAt(x,y);const d=(h-ray.ray.origin.y)/ray.ray.direction.y;
  if(!Number.isFinite(d)||d<0)return null;return ray.ray.at(d,V())
}
function projection(v){const p=v.clone().project(camera);return {x:(p.x+1)*view.clientWidth*.5,y:(1-p.y)*view.clientHeight*.5,depth:p.z}}
function hits(x,y){
  const items=kitchen.targets(s);scene.updateMatrixWorld(true);rayAt(x,y);
  const pick=ray.intersectObjects(items.map(t=>t.o),true);
  if(pick.length){
    ray.far=Math.max(.01,pick[0].distance-.15);
    const blocked=ray.intersectObjects(scene.children,true).some(q=>q.object.isMesh&&
      (Array.isArray(q.object.material)||!q.object.material.transparent));
    ray.far=Infinity;if(blocked)return null
  }
  for(const h of pick){
    let node=h.object;while(node){const t=items.find(t=>t.o===node);
      if(t)return {...t,hit:h.point,onDough:h.object===t.dough};node=node.parent}
  }
  // Touch allowance is in screen pixels to keep the bamboo skewer usable on a phone.
  let best=null,bestD=Infinity;
  for(const t of items){
    if(t.kind==='tray'||t.kind==='plate')continue;
    const p=projection(t.center),d=Math.hypot(x-p.x,y-p.y);
    if(p.depth>0&&p.depth<1&&d<Math.max(17,Math.min(28,t.r*2.8))&&d<bestD){bestD=d;best=t}
  }return best
}
function nearCup(x,y,where,margin=46){
  let best=null,dmin=margin;
  for(const c of s.cups.filter(o=>o.where===where&&!o.path.length)){
    const p=projection(V(c.pos.x,c.pos.y+Agara.surfaceHeight(c,.15),c.pos.z));
    const d=Math.hypot(x-p.x,y-p.y);if(d<dmin){best=c;dmin=d}
  }return best
}
function release(e,cancel){
  if(!ptr||e.pointerId!==ptr.pid)return;
  const a=s.active;
  // A tap on the cake lifts the whole case. A lateral stroke on its crown opens the crumb.
  if(!cancel&&a?.kind==='spread'&&a.moved<5&&ptr.switchToLift&&Agara.canTake(s,Agara.current(s,a.id))){
    const id=a.id;Agara.end(s);Agara.begin(s,'cup',id)
  }
  Agara.end(s,cancel);const id=ptr.pid;ptr=null;if(view.hasPointerCapture(id))view.releasePointerCapture(id)
}
view.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||ptr||e.button!==0||!live)return;e.preventDefault();Sound.unlock();
  const hit=hits(e.clientX,e.clientY);
  if(!hit)return;
  let kind=hit.kind,local={};
  const c=hit.kind==='cup'?Agara.current(s,hit.id):null;
  if(c){const p=hit.hit||hit.center;local={x:p.x-c.pos.x,z:p.z-c.pos.z,angle:Math.atan2(p.z-c.pos.z,p.x-c.pos.x)};
    if(hit.onDough&&c.cooked>.30)kind='spread'}
  if(!Agara.begin(s,kind,hit.id,local))return;
  const center=projection(hit.center);ptr={pid:e.pointerId,x:e.clientX,y:e.clientY,kind,id:hit.id,center,turn:0,switchToLift:kind==='spread',local,
    a:Math.atan2(e.clientY-center.y,e.clientX-center.x),rad:Math.hypot(e.clientX-center.x,e.clientY-center.y)};
  view.setPointerCapture(e.pointerId);Sound.touch(kind);
});
view.addEventListener('pointermove',e=>{
  if(!ptr||ptr.pid!==e.pointerId||!s.active)return;e.preventDefault();
  const dx=e.clientX-ptr.x,dy=e.clientY-ptr.y,kind=ptr.kind,info={},c=Agara.current(s,ptr.id);
  let height=K.top;
  if(kind==='cup'){
    const inRack=s.active.from==='rack',toRack=s.active.from==='work';
    height=toRack?K.rack.y:inRack?s.plate.pos.y+.67:K.tea.y;
  }else if(kind==='plate'||kind==='tea')height=K.tea.y;
  let p=whereAt(e.clientX,e.clientY,height);
  if(kind==='jug'||kind==='stick'){
    const c=nearCup(e.clientX,e.clientY,kind==='jug'?'work':'rack');
    if(c){info.cup=c.id;const q=whereAt(e.clientX,e.clientY,c.pos.y+Agara.surfaceHeight(c,.2));if(q)info.local={x:clamp(q.x-c.pos.x,-1.6,1.6),z:clamp(q.z-c.pos.z,-1.6,1.6)}}
  }
  if(kind==='knob'){
    const a=Math.atan2(e.clientY-ptr.center.y,e.clientX-ptr.center.x);
    let delta=a-ptr.a;if(delta>PI)delta-=2*PI;if(delta< -PI)delta+=2*PI;ptr.turn+=delta;ptr.a=a;
    if(ptr.rad>10&&Math.abs(ptr.turn)>.18)info.turn=ptr.turn/3.8;
  }
  if(kind==='tray')info.span=Math.min(310,view.clientHeight*.35);
  if(kind==='spread'&&s.mode==='tea'&&Math.abs(dy)>20&&Math.abs(dy)>Math.abs(dx)*1.35){
    const id=ptr.id;Agara.end(s);if(Agara.begin(s,'cup',id,ptr.local)){ptr.kind='cup';p=whereAt(e.clientX,e.clientY,K.tea.y)}
  }
  Agara.drag(s,dx,dy,p,info)
});
view.addEventListener('pointerup',e=>release(e,false));view.addEventListener('pointercancel',e=>release(e,true));
view.addEventListener('lostpointercapture',e=>release(e,true));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ptr){Agara.end(s,true);ptr=null}});
function demo(){
  if(s.idle<3.8)return null;
  const a=Agara.suggestion(s),c=Agara.current(s,a.id),f=.5+.5*Math.sin((s.idle-4)*2.15),h=kitchen.hints;
  if(a.kind==='cup'&&c){
    const pos=V(c.pos.x-2,c.pos.y+4.5+f*3,c.pos.z+1.4);
    const to=a.to==='rack'?K.rack:a.to==='plate'?s.plate.pos:null;
    return to?pos.lerp(V(to.x,to.y+6,to.z),.28*f):pos
  }
  if(a.kind==='tea')return kitchen.tea[a.id].position.clone().add(V(0,7,1));
  const obj=h[a.kind];if(!obj)return null;
  const off={jug:[-9.4,9+.6*f,1.5],knob:[Math.sin(f*2)*1.9,Math.cos(f*2)*1.9,2.4],lid:[0,7+5*f,1],tray:[-25,3,0],basket:[-11,8,0],stick:[1.7,18,0],plate:[-8,2,0]}[a.kind]||[0,0,0];
  return obj.position.clone().add(V(...off))
}
let prev=0,acc=0;
function frame(now){
  requestAnimationFrame(frame);if(document.hidden){prev=now;return}
  resize();const dt=Math.min(.08,Math.max(0,(now-(prev||now))*.001));prev=now;
  if(live){
    acc+=dt;while(acc>=1/60){Agara.step(s,1/60);acc-=1/60}
    kitchen.update(s);actors.update(s,dt,demo());Sound.update(s);shot(false,dt)
  }
  renderer.render(scene,camera)
}
// The first room is painted before the garden, surface maps and environment reflections are made.
house=House.build(scene);kitchen=Kitchen.build(scene);actors=Family.build(scene);
kitchen.update(s);actors.update(s,0,null);shot(true,0);renderer.render(scene,camera);live=true;
requestAnimationFrame(frame);
requestAnimationFrame(()=>requestAnimationFrame(()=>{
  house.details();
  requestAnimationFrame(()=>{Art.makeTextures();requestAnimationFrame(()=>{
    lighting();
    const still=document.querySelector('picture');
    requestAnimationFrame(()=>{still.classList.add('ready');still.addEventListener('transitionend',()=>still.remove(),{once:true})})
  })})
}));
}));
