'use strict';
const game=Kitchen.makeKitchen(),s=game.getState(),{clamp,smooth}=D;
window.__GAME__=game;
const clothPad=G(scene),clothBlue=surface(0x4b6976,.92,0,'linen'),stitch=surface(0xded4b9,.88,0,'linen');
function padProfile(u,v){const x=(u-.5)*2.5,z=(v-.5)*1.1;return [x,.083+.019*Math.cos(x*6+z*3)+.043*Math.exp(-((x+.87)**2)/.021),z]}
tile(clothPad,2.49,1.1,.034,.038,M.blueDark,0,.005,0);cloth(clothPad,1,1,padProfile,24,9,clothBlue);
for(const off of [.09,.14,.87,.92])cloth(clothPad,1,1,(u,v)=>{const p=padProfile(u,off+.008*v);p[1]+=.003;return p},23,1,stitch);
for(let k=0;k<30;k++){let x=-1.22+k*.083;pipe(clothPad,[[x,.035,.535],[x+.009,.026,.59],[x+.016,.014,.64+rand()*.05]],.012,stitch,4)}batch(clothPad);
// A shallow wooden board under the burner catches sharp contact shadows.
const board=G(cooking);tile(board,4.26,2.52,.072,.14,surface(0x9b7450,.69,0,'wood'),0,-.005,-.13);
baseG.position.z=-.39;
for(const x of [-1.03,.91]){
 cylinder(board,V(x,.08,.58),V(x,.71,.58),.088,.074,M.black);
 cylinder(board,V(x,.73,.39),V(x,.73,.76),.072,.072,M.lip);
}
const meal=G(scene),pieces=[G(meal),G(meal)],foodParts=[],dynamicSurfaces=[],cutFaces=[];
for(let k=0;k<2;k++){
 const o=fishSurface(pieces[k],'batter',k===0?83:44,41,k===0?[0,.69]:[.69,1]);foodParts.push(o);dynamicSurfaces.push(o);
 const e=D.edges(.69),ps=[],ix=[],cl=[];
 for(let j=0;j<=38;j++){let v=j/19-1,{x,z}=D.point(.69,v,e),h=D.relief(.69,v,x,z);
 for(let row=0;row<=12;row++){ps.push(x+(Math.sin(j*6+row*2)*.009),h*(-.60+1.60*row/12),z);cl.push(.7,.48,.26);if(j&&row){let i=j*13+row;ix.push(i-14,i-1,i,i-14,i,i-13)}}}
 let m=surface(0xffffff,.83,0,'bread',{vertexColors:true,side:T.DoubleSide});const face=mesh(pieces[k],geometry(ps,ix,cl),m);face.visible=false;cutFaces.push(face);
}
const lidCream=fishSurface(upper.group,'coat',45,23);dynamicSurfaces.push(lidCream);
function mapGrid(meta){
 return meta.map(({u,v})=>{const x=clamp(u*Kitchen.NX-.5,0,Kitchen.NX-1),z=clamp((v+1)*.5*Kitchen.NZ-.5,0,Kitchen.NZ-1),i=Math.floor(x),j=Math.floor(z),a=j*Kitchen.NX+i,b=j*Kitchen.NX+Math.min(i+1,Kitchen.NX-1),c=Math.min(j+1,Kitchen.NZ-1)*Kitchen.NX+i;return [a,b,c,c+b-a,x-i,z-j]})
}
for(const o of dynamicSurfaces)o.userData.sample=mapGrid(o.userData.meta);
function interpolate(entry,key){const [a,b,c,d,x,z]=entry,A=s.cells[a][key],C=s.cells[c][key];return (A+(s.cells[b][key]-A)*x)*(1-z)+(C+(s.cells[d][key]-C)*x)*z}
const cream=col(0xf6e4b9),dryCream=col(0xf1cc89),gold=col(0xd99b4d),darkGold=col(0x9e582d),anColor=col(0x562b2e),cc=new T.Color(),crust=new T.Color();
let surfaceClock=1;
function updateFood(dt){
 surfaceClock+=dt;if(surfaceClock<.067)return;surfaceClock=0;
 for(const o of dynamicSurfaces){
  const coat=o===lidCream;const a=o.geometry.attributes,m=o.userData.meta,sm=o.userData.sample;
  o.visible=coat?s.coat>.00005:s.dropHit;o.castShadow=!coat&&s.bake>.1;if(!o.visible)continue;
  for(let i=0;i<m.length;i++){
   const loc=m[i],sample=sm[i];let fill=coat?interpolate(sample,'coat'):(interpolate(sample,'liquid')+interpolate(sample,'skin'))/(.17+.57*loc.h);
   const water=coat?.75:interpolate(sample,'water'),toast=interpolate(sample,'toast'),release=interpolate(sample,'release'),skin=coat?0:interpolate(sample,'skin');
   const baked=smooth(.03,.45,toast),rawY=-loc.h*.91+.006+Math.min(1.45,fill)*(.08+loc.h*.70);
   let h=coat?-loc.h*.91+.018+fill*.22:rawY*(1-baked)+baked*(loc.h+.028*Math.sin(loc.u*6+loc.v)*release);
   h+=coat?0:.095*(1-smooth(.06,.89,release))*smooth(.001,.15,1-s.hinge)*baked;
   a.position.setY(i,h);
   const tailMask=smooth(.78,.88,loc.u)*(1-D.channel(loc.u,loc.x,loc.z))*.34*(1-smooth(.52,.85,fill));
   a.amount.setX(i,coat?fill*(1-release):fill+baked*.42-tailMask);
   a.wetness.setX(i,water*(1-baked*.9));
   cc.copy(cream).lerp(dryCream,clamp(skin*1.8));const shade=clamp(.20+.05*(1-water)+.16*Math.cos(loc.x*4+loc.z*2)+.16*Math.sin(loc.z*9-loc.x*4)+.13*Math.sin(loc.x*8)+toast*.34);
   crust.copy(gold).lerp(darkGold,shade);cc.lerp(crust,baked);cc.toArray(a.color.array,i*3);
  }
  a.position.needsUpdate=a.amount.needsUpdate=a.color.needsUpdate=a.wetness.needsUpdate=true;o.geometry.computeVertexNormals();
  o.material.roughness=coat?.29:clamp(.27+.39*s.bake+.12*(1-s.sizzle),.23,.74)
 }
 if(s.split>.001){for(const cut of cutFaces){
  cut.visible=true;const colors=cut.geometry.attributes.color;
  for(let j=0;j<=38;j++){
   const weights=s.cells[Math.round(j/38*(Kitchen.NZ-1))*Kitchen.NX+18].bean;
   for(let r=0;r<=12;r++){const density=clamp(weights*3.1)*(1-smooth(.11,.38,Math.abs(r/12-.48)));
    cc.copy(dryCream).lerp(anColor,density).multiplyScalar(.91+.09*Math.sin(j*17+r*32));cc.toArray(colors.array,(j*13+r)*3)}
  }colors.needsUpdate=true
 }}else cutFaces.forEach(c=>c.visible=false)
}
const fillingBed=G(meal),beanMesh=fishSurface(fillingBed,'batter',42,16);beanMesh.material=surface(0x552b2c,.36,0,'bread');beanMesh.material.userData.coverage=true;beanMesh.userData.sample=mapGrid(beanMesh.userData.meta);
let beanClock=0;
function beans(dt){beanClock+=dt;beanMesh.visible=['fill','coat','close'].includes(s.stage)&&s.beanSupply>.005;if(!beanMesh.visible||beanClock<.066)return;beanClock=0;
 const a=beanMesh.geometry.attributes;beanMesh.userData.meta.forEach((m,i)=>{const b=interpolate(beanMesh.userData.sample[i],'bean');a.amount.setX(i,b*1.8);
 a.position.setY(i,.017+Math.min(.235,b*.54)-.065*m.v*m.v+.009*Math.sin(51*m.x+23*m.z)*clamp(5*b))});
 a.position.needsUpdate=a.amount.needsUpdate=true;beanMesh.geometry.computeVertexNormals()
}
const fins=s.wings.map(w=>{
 const edge=D.point(w.u,w.v),g=G(pieces[w.u>.69?1:0]);g.position.set(edge.x,.009,edge.z);
 const ps=[],ix=[];for(let j=0;j<=6;j++)for(let i=0;i<=12;i++){
  const f=i/12,t=j/6,a=(f-.5)*PI,tip=Math.cos(a)*(1+.12*Math.sin(i*7+w.u*56));
  ps.push((.112+.013*t)*Math.sin(a),-.019+.025*t+.013*tip*t*t,.207*w.v*tip*t);
  if(i&&j&&!(j===4&&i===6||j===3&&i===9)){const k=j*13+i;ix.push(k-14,k-1,k,k-14,k,k-13)}
 }
 const m=surface(0xebc88c,.59,0,'bread',{side:T.DoubleSide}),o=mesh(g,geometry(ps,ix),m);return {g,o,m}
});
const dustMat=surface(0xe1d3b8,.92,0,'plain',{transparent:true,opacity:.49,depthWrite:false});
const dustMesh=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),dustMat,44),speckDummy=new T.Object3D();dustMesh.frustumCulled=false;cooking.add(dustMesh);
const steamPuffs=G(scene),puffGeo=new T.SphereGeometry(1,9,7),puffs=[];
for(let i=0;i<38;i++){const m=surface(0xfff0d9,1,0,'plain',{transparent:true,opacity:.04,depthWrite:false});const o=mesh(steamPuffs,puffGeo,m);o.castShadow=o.receiveShadow=false;puffs.push(o)}
const stream=G(scene),jet=cylinder(stream,V(0,0,0),V(0,1,0),.022,.038,batterMat,12),drop=ell(scene,0,0,0,.046,.069,.046,batterMat);
const chips=G(scene),crumbs=[];
for(let i=0;i<9;i++){const o=mesh(chips,new T.DodecahedronGeometry(.04+rand()*.024,0),M.bamboo);o.visible=false;crumbs.push({o,dx:0,dy:0,dz:0,life:0})}
const soundBtn=document.querySelector('#sound');let ac,muted=false,bus,noiseBuf,noiseGain,noiseHP;
function drawSound(){const cx=soundBtn.firstElementChild.getContext('2d');cx.clearRect(0,0,60,60);cx.fillStyle=cx.strokeStyle='#f4ead4';cx.lineWidth=3.5;cx.lineCap='round';cx.lineJoin='round';cx.beginPath();cx.moveTo(8,24);cx.lineTo(18,24);cx.lineTo(30,14);cx.lineTo(30,46);cx.lineTo(18,36);cx.lineTo(8,36);cx.closePath();cx.stroke();
 if(!muted){for(const r of [12,20]){cx.beginPath();cx.arc(29,30,r,-.78,.78);cx.stroke()}}else{cx.beginPath();cx.moveTo(39,24);cx.lineTo(51,36);cx.moveTo(51,24);cx.lineTo(39,36);cx.stroke()}soundBtn.setAttribute('aria-pressed',String(muted));soundBtn.setAttribute('aria-label',muted?'音を出す':'音を消す')}
function wake(){
 if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();bus=ac.createGain();bus.gain.value=muted?0:.62;bus.connect(ac.destination);
 noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const a=noiseBuf.getChannelData(0);let brown=0;for(let i=0;i<a.length;i++){brown=.65*brown+.35*(Math.random()*2-1);a[i]=brown*1.65}
 const n=ac.createBufferSource();n.buffer=noiseBuf;n.loop=true;noiseHP=ac.createBiquadFilter();noiseHP.type='highpass';noiseHP.frequency.value=2800;noiseGain=ac.createGain();noiseGain.gain.value=0;n.connect(noiseHP).connect(noiseGain).connect(bus);n.start()}
 if(ac.state==='suspended')ac.resume().catch(()=>{})
}
drawSound();soundBtn.addEventListener('click',()=>{muted=!muted;wake();drawSound();if(bus)bus.gain.setTargetAtTime(muted?0:.62,ac.currentTime,.04)});
function tone(f,d,v,offset=0,type='sine',bend=1){
 let o=ac.createOscillator(),a=ac.createGain(),at=ac.currentTime+offset;o.type=type;o.frequency.setValueAtTime(f,at);o.frequency.exponentialRampToValueAtTime(f*bend,at+d);a.gain.setValueAtTime(.0001,at);a.gain.exponentialRampToValueAtTime(Math.max(.0002,v),at+.003);a.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(a).connect(bus);o.start(at);o.stop(at+d+.015)
}
function rustle(f,d,v,delay=0){
 const src=ac.createBufferSource(),bp=ac.createBiquadFilter(),a=ac.createGain(),t=ac.currentTime+delay;
 src.buffer=noiseBuf;bp.type='bandpass';bp.frequency.value=f;bp.Q.value=.65;src.connect(bp).connect(a).connect(bus);a.gain.setValueAtTime(.001,t);a.gain.linearRampToValueAtTime(v,t+.004);a.gain.exponentialRampToValueAtTime(.0001,t+d);src.start(t,Math.random()*.8,d+.03)
}
function audible(e){
 if(!ac||muted)return;const p=e.power;
 switch(e.kind){
 case 'wood':tone(468,.097,.25*p,0,'sine',.64);tone(790,.045,.10*p);rustle(1550,.032,.28*p);break;
 case 'iron':for(const [f,d,v] of [[314,.33,.20],[738,.28,.14],[1305,.14,.083],[1942,.09,.053]])tone(f,d,v*p);rustle(3200,.044,.32*p);break;
 case 'peel':rustle(1050+2300*p,.058,.31*p);rustle(2360,.045,.20*p,.022);tone(320+200*p,.038,.09*p,0,'triangle',.63);break;
 case 'paper':for(let i=0;i<4;i++)rustle(940+i*377,.12,.15*p,i*.048);break;
 case 'snap':rustle(3350+690*p,.048,.68*p);tone(1280+400*p,.032,.18*p,0,'triangle',.42);rustle(2140,.06,.2,.044);break;
 case 'baked':tone(665,.35,.065);tone(998,.33,.038,.105);break;
 case 'sizzle':rustle(2700+p*1500,.066,.21*p);break
 }}
let lastSound=-1;
function audioTick(){for(const e of s.events)if(e.id>lastSound)audible(e);if(s.events.length)lastSound=s.events.at(-1).id;if(ac)noiseGain.gain.setTargetAtTime(.008+.105*s.sizzle,ac.currentTime,.12)}
let mobile=false,viewportW=0,viewportH=0;
const paperStack=bagBody.clone(true);scene.add(paperStack);
const bagHome=V(),bagPickup=V(),guestHome=V(),grandHome=V(),ladleHome=V(),kidHome=V(),spatHome=V(),handoff=V(),bagRotation=new T.Euler();
function resize(){
 const w=shop.clientWidth,h=shop.clientHeight;if(w===viewportW&&h===viewportH)return;viewportW=w;viewportH=h;mobile=w/h<.83;
 renderer.setSize(w,h,false);camera.aspect=w/h;
 const height=mobile?Math.max(8.65,5.32/camera.aspect):Math.max(6.65,9.85/camera.aspect),target=V(0,mobile?1.22:1.24,mobile?.54:.27);
 camera.position.copy(target).addScaledVector(V(.115,mobile?1.03:.89,1.49).normalize(),height/(2*Math.tan(camera.fov*PI/360)));camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 cooking.position.set(mobile?-.19:-.65,0,mobile?1.22:.55);cooking.rotation.y=mobile?.27:.10;
 basket.position.set(mobile?1.14:2.72,0,mobile?-1.88:-.40);basket.rotation.y=mobile?-.70:-.34;basket.scale.setScalar(mobile?.83:.94);
 pot.position.set(mobile?-1.66:-3.41,0,mobile?3.12:.34);pot.scale.setScalar(mobile?.87:1);
 clothPad.position.set(pot.position.x+.02,0,pot.position.z+.14);clothPad.rotation.y=mobile?.66:-.31;
 pot.position.y=.105;anCup.position.set(mobile?-2.27:-3.60,.008,mobile?-.60:-1.15);
 spatHome.copy(anCup.position).add(V(.025,.57,.012));grandHome.set(mobile?2.59:4.60,.39,mobile?-.89:-1.56);
 guestHome.set(mobile?-2.12:-4.02,.49,mobile?-2.98:-3.05);kidHome.set(mobile?-.87:-2.24,-.96,mobile?6.77:5.72);
 bagHome.set(mobile?1.23:2.35,.029,mobile?3.43:2.12);bagRotation.set(0,mobile?-.93:-.39,0);
 paperStack.position.copy(bagHome).add(V(.019,-.023,.007));paperStack.scale.set(.90,.38,.90);paperStack.rotation.copy(bagRotation);paperStack.rotation.y+=.034;
 bagPickup.copy(cooking.position).add(V(.41,.61,.73));handoff.copy(guestHome).add(V(.24,.12,.58));
 lanternA.position.set(mobile?-1.70:-3.83,mobile?4.20:3.34,mobile?-1.81:-1.18);lanternA.scale.setScalar(mobile?.84:1.05);
 lanternB.position.set(mobile?3.50:4.72,3.26,-2.47);
 cooking.updateMatrixWorld(true);ladleHome.copy(cooking.localToWorld(V(-1.53,YPAN+.65,.22)));
}
const tmp=V(),up=V(0,1,0),homeQuat=new T.Quaternion(),bagQuat=new T.Quaternion(),mealPos=V();
// The cuffs stay attached to sleeves that lead back to each person's side of the stall.
function sleeve(hand,material){
 const sides=15,rows=18,pos=[],idx=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){pos.push(0,0,0);if(j&&i){const k=j*(sides+1)+i;idx.push(k-sides-2,k-1,k,k-sides-2,k,k-sides-1)}}
 const geo=geometry(pos,idx),o=mesh(scene,geo,material);material.side=T.DoubleSide;o.frustumCulled=false;
 return {hand,geo,sides,rows}
}
const sleeves=[sleeve(grand,M.blueDark),sleeve(kid,M.ivory),sleeve(guest,surface(0x946f60,.85,0,'linen'))];
function drapeArm(slv,elbow,anchor){
 const {hand,geo,sides,rows}=slv,from=worldAt(hand,.02,.30,1.57),out=worldAt(hand,.02,.35,2.00);
 const curve=new T.CatmullRomCurve3([from,out,elbow,anchor]),a=geo.attributes.position,axis=V(),other=V(),pt=V(),tangent=V();
 for(let j=0;j<=rows;j++){
 const u=j/rows;curve.getPoint(u,pt);curve.getTangent(u,tangent);axis.crossVectors(tangent,up).normalize();other.crossVectors(tangent,axis).normalize();
 const radius=hand.scale.x*(.289+.137*u+.023*Math.sin(u*PI*11)*Math.exp(-u*2));
 for(let i=0;i<=sides;i++){const th=i/sides*PI*2,rx=Math.cos(th)*radius,ry=Math.sin(th)*radius*.91;a.setXYZ(j*(sides+1)+i,pt.x+rx*axis.x+ry*other.x,pt.y+rx*axis.y+ry*other.y,pt.z+rx*axis.z+ry*other.z)}
 }a.needsUpdate=true;geo.computeVertexNormals()
}
const openAngle=.87;let smallWiggle=0,wiggleObj=null,stageLast='',lastBatch=1;
const damp=(a,b,k,d)=>a+(b-a)*(1-Math.exp(-k*d));
let reach=0,spatLift=0,grandReach=0,bagShow=0;
function worldAt(obj,x=0,y=0,z=0){return obj.localToWorld(V(x,y,z))}
function animateProps(dt){
 resize();
 const active=s.stage,raw=active==='pour',fill=active==='fill',coating=active==='coat';
 if(s.batch!==lastBatch){lastBatch=s.batch;for(const obj of cutFaces)obj.visible=false;lastSound=-1}
 const angle=openAngle+(PI-openAngle)*s.hinge;
 hinge.rotation.x=angle;
 const roll=s.turn+s.rest,arc=Math.abs(Math.sin(PI*roll));
 pan.position.y=YPAN+1.82*arc;pan.position.z=-.66*(s.turn-s.rest)-.18*arc;pan.rotation.z=-PI*roll;
 parentMatrices();
 const swing=s.swing*.047+.023*Math.sin(s.time*2.06+s.air);
 const restLadle=raw?ladleHome:V(pot.position.x,.96,pot.position.z);
 if(active==='return')restLadle.lerp(ladleHome,smooth(1.25,2.8,s.age));
 const ladleTarget=raw&&s.started?worldAt(pan,s.toolX+.10,.59+.08*s.tilt,s.toolZ+.08):restLadle.clone();
 if(coating){const c=smooth(0,1,s.age/3.4);ladleTarget.copy(worldAt(upper.group,-1.53+3.08*c,-.10,0));ladleTarget.y+=.45}
 ladle.position.lerp(ladleTarget,stageLast===''?1:1-Math.exp(-dt*(raw?12:4)));
 ladle.rotation.set(-.13+.06*swing, mobile?1.33:.05,raw||coating?-.13-.66*(coating?.87:s.tilt)+swing:-.075);
 stir.position.lerp(fill&&s.started?worldAt(pan,s.toolX,.24,s.toolZ):spatHome,stageLast===''?1:1-Math.exp(-dt*8));
 if(fill&&!s.started){stir.position.y+=.0035*Math.sin(s.time*2.1);stir.rotation.z=.052*Math.sin(s.time*2.1)}else stir.rotation.z=-.09;
 stir.rotation.x=fill&&s.started?-.21:-.58;stir.rotation.y=mobile?.53:-.83;
 // Bring the filled paddle from its crock to the work when the last channels are wet.
 spatLift=damp(spatLift,fill?1:0,3,dt);
 if(!s.started&&fill){stir.position.lerp(worldAt(pan,-1.16,.30,.78),spatLift*.27)}
 const b=s.bag,g=s.give,transfer=smooth(.04,.96,b);
 bagShow=damp(bagShow,active==='bag'&&!s.started?1:0,2.9,dt);
 bagG.position.copy(bagHome).lerp(bagPickup,transfer);bagG.position.y+=Math.sin(PI*transfer)*.45+bagShow*.045*(.5+.5*Math.sin(s.time*2.3));
 if(g>0){bagG.position.lerp(handoff,smooth(0,.93,g));bagG.position.y+=.49*Math.sin(g*PI)}
 if(active==='return'){const slide=smooth(0,2.6,s.age);bagG.position.x-=slide*4.8;bagG.position.z-=slide*.76;bagG.position.y+=.27*Math.sin(PI*slide)}
 bagG.rotation.set(.02+transfer*.12,bagRotation.y*(1-transfer)+cooking.rotation.y*transfer-.30*g,.015+Math.sin(transfer*PI)*.13-.12*g);
 bagG.scale.setScalar(.91+.09*transfer);bagG.updateMatrixWorld(true);
 mealPos.copy(worldAt(pan));pan.getWorldQuaternion(homeQuat);meal.position.copy(mealPos);
 if(transfer>0){
  const to=worldAt(bagG,-.44,.16,.005);meal.position.lerp(to,transfer);meal.position.y+=.38*Math.sin(PI*transfer);
  meal.quaternion.copy(homeQuat).slerp(bagG.getWorldQuaternion(bagQuat),transfer);
 }else meal.quaternion.copy(homeQuat);
 meal.scale.setScalar(1-.27*transfer);
 pieces[0].position.x=-.19*s.split;pieces[1].position.x=.21*s.split+.64*(1-Math.cos(s.split*1.15));pieces[1].position.z=.64*Math.sin(s.split*1.15);pieces[1].rotation.y=1.15*s.split;pieces[1].position.y=.45*s.split;pieces[1].rotation.z=.22*s.split;pieces[1].rotation.x=-.23*s.split;
 meal.updateMatrixWorld(true);
 for(let i=0;i<fins.length;i++){const w=s.wings[i],{g,o,m}=fins[i];g.visible=w.mass>.002;if(!g.visible)continue;
 const len=clamp(w.mass/.47,.018,1.75);g.scale.set(1+len*.08,.64+len*.69,len*(1-w.crack));m.color.copy(cream).lerp(caramel,w.dry);m.roughness=.30+.44*w.dry;o.position.y=-.06*w.crack
 }
 grandReach=damp(grandReach,['coat','flip','bake','rest'].includes(active)?1:0,2.4,dt);
 const holdGrand=coating?worldAt(ladle,-.64,.17,.57):worldAt(lowGrip.group,-.1,.04,1.54);
 grand.position.copy(grandHome).lerp(holdGrand,grandReach);grand.position.y+=.018*s.swing+.32*Math.sin(grandReach*PI);grand.rotation.set(-.06,1.52+.26*grandReach,.07+.13*arc);
 guest.position.copy(guestHome);guest.rotation.set(.05,-1.97,.045);
 if(active==='gift'||active==='return'){let reachGuest=active==='gift'?smooth(0,1.3,s.age):1;guest.position.z+=.36*reachGuest;guest.position.y+=.12*reachGuest}
 if(active==='return'){const slide=smooth(0,1.5,s.age)*(1-smooth(1.5,2.84,s.age));guest.position.x-=4.8*slide;guest.position.z-=.76*slide;guest.position.y+=.27*Math.sin(PI*slide)}
 guest.position.x+=s.draft*.019;
 // A child-sized hand follows an object-specific demonstration, then withdraws to the near edge.
 const aim=hintPoint(),phase=s.guideAge%4.5,gesture=smooth(0,.84,phase)*(1-smooth(2.89,4.12,phase)),guideReach=s.guide*gesture;
 reach=damp(reach,Math.max(guideReach,s.held?.94:0),4.2,dt);
 kid.position.copy(kidHome).lerp(aim,reach);kid.position.y+=Math.sin(PI*reach)*.48;
 kid.rotation.set(.025-.13*reach, mobile?-.22:-.42,.16-.19*reach);
 if(s.guide>.05){const g=smooth(.95,2.25,phase)*reach;
  if(active==='pour'||fill){kid.position.x+=.35*g;kid.position.y-=.105*g}
  if(active==='close')kid.position.y-=.31*g;if(active==='open')kid.position.y+=.33*g;if(active==='flip')kid.rotation.z+=.45*g;
  if(active==='gift')kid.position.z-=.24*g
 }
 if(active==='return'){kid.position.z+=s.age*.22}
 drapeArm(sleeves[0],V(mobile?4.1:6.4,.48+.47*grandReach,-.70),V(mobile?7.0:9.4,.53,-1.7));
 drapeArm(sleeves[1],V(kid.position.x-.66,kid.position.y+.11,kid.position.z+2.85),V(mobile?-2.0:-3.0,-.62,9.1));
 drapeArm(sleeves[2],V(mobile?-4.9:-6.8,.46,-3.89),V(-10,.43,-4.37));
 let preDrop=raw&&!s.dropHit,showStream=s.flow>.10&&raw||coating&&s.coat<.92;
 drop.visible=preDrop;if(preDrop){drop.position.copy(worldAt(pan,-1.55,-.105+s.drop*.63,.018));drop.scale.set(.041,.045+.029*(1-s.drop),.041)}
 stream.visible=showStream;if(showStream){
 const from=worldAt(ladle,-.22,-.025,.04),to=coating?worldAt(upper.group,-1.53+3.08*clamp(s.age/3.2),-.077,0):worldAt(pan,s.toolX,-.035,s.toolZ);
 jet.position.copy(from).lerp(to,.5);const diff=tmp.subVectors(from,to);jet.quaternion.setFromUnitVectors(up,diff.clone().normalize());const rad=coating?.69:clamp(s.flow/5,.1,1.25);jet.scale.set(rad,diff.length(),rad)
 }
 steamPuffs.position.copy(worldAt(cooking,0,YPAN,0));steamPuffs.quaternion.copy(cooking.quaternion);
 for(let i=0;i<puffs.length;i++){const p=s.particles[i],o=puffs[i];o.visible=!!p;if(!p)continue;const life=p.age/p.life,sz=p.size*(.36+life*1.5);
 o.position.set(p.x,p.y+.04,p.z);o.scale.set(sz*.59,sz*(1.7+life*.8),sz*.48);
 o.rotation.z=s.draft*(-.18-p.age*.09);o.material.opacity=Math.sin(life*PI)*(.045+s.steam*.19)
 }
 for(const c of crumbs){if(c.life<=0){c.o.visible=false;continue}c.life-=dt;c.dy-=2.7*dt;c.o.position.addScaledVector(V(c.dx,c.dy,c.dz),dt);c.o.rotation.x+=dt*4;c.o.visible=true;if(c.o.position.y<.04){c.o.position.y=.04;c.dy=Math.max(0,-c.dy*.22);c.dx*=.87;c.dz*=.87}}
 dustMesh.count=Math.min(44,s.dust.length);for(let i=0;i<dustMesh.count;i++){const mote=s.dust[i];speckDummy.position.set(mote.x,mote.y,mote.z);speckDummy.scale.setScalar(mote.r*Math.min(1,mote.age*1.7));speckDummy.updateMatrix();dustMesh.setMatrixAt(i,speckDummy.matrix)}dustMesh.instanceMatrix.needsUpdate=true;
 key.intensity=3.16+s.draft*.046;coals.emissiveIntensity=.35+s.coal*.65;lanternA.rotation.z=s.swing*.018;lanternB.rotation.z=s.swing*-.014;
 if(smallWiggle>0&&wiggleObj){smallWiggle=Math.max(0,smallWiggle-dt*2.4);wiggleObj.rotation.z=.025*smallWiggle*Math.sin((1-smallWiggle)*PI*3);if(!smallWiggle)wiggleObj.rotation.z=0}
 updateFood(dt);beans(dt);audioTick();stageLast=active
}
function parentMatrices(){cooking.updateMatrixWorld(true)}
function hintPoint(){
 switch(s.stage){
 case 'pour':return worldAt(ladle,-.60,.21,.57);
 case 'fill':return worldAt(stir,-.035,.14,.49);
 case 'close':case 'open':return worldAt(topGrip.group,-.12,.02,2.08);
 case 'flip':return worldAt(lowGrip.group,-.12,.04,2.36);
 case 'bag':case 'gift':return worldAt(bagG,.67,.27,.14);
 default:return kidHome.clone()
 }}
const ray=new T.Raycaster(),pointer=new T.Vector2(),activePointer={id:null,start:null,last:null,kind:null};
function makeRay(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera)}
function candidates(obj,margin){
 let h=ray.intersectObject(obj,true).find(x=>{for(let p=x.object;p;p=p.parent){if(!p.visible)return false}return true});
 if(h)return h.point;
 if(margin){
  const v=V();for(const [loc,r] of margin){v.copy(loc);if(ray.ray.distanceToPoint(v)<r)return v.clone()}
 }return null
}
function snapWing(hit){
 let best=null,min=.085;
 for(let i=0;i<fins.length;i++){
  const w=s.wings[i],fin=fins[i];if(w.mass<.006||w.crack>.95)continue;
  const contact=candidates(fin.g),base=worldAt(fin.g,0,0,.075*w.v),distance=contact?contact.distanceTo(hit):base.distanceTo(hit);
  if(distance<min){best=w;min=distance}
 }
 if(!best)return false;
 if(!game.crack(best.u,best.v))return true;
 for(const c of crumbs){c.o.position.copy(hit);c.dx=(rand()-.5)*.88;c.dy=.37+rand()*.84;c.dz=(rand()-.4)*.6;c.life=1.4+rand();c.o.scale.set(.6+rand()*.5,.24,.49+rand()*.7)}return true
}
function pick(){
 const st=s.stage,kind=({pour:'ladle',fill:'spatula',close:'handle',flip:'handle',open:'handle',bag:'bag',gift:'bag'})[st];if(!kind)return null;
 if(st==='gift'){
  const hit=candidates(meal),paper=candidates(bagBody);if(hit&&(!paper||hit.distanceTo(ray.ray.origin)<paper.distanceTo(ray.ray.origin))){
   if(snapWing(hit))return {kind:'handled'};if(!s.splitAim)return {kind:'split'}
  }
 }
 const obj=kind==='ladle'?ladle:kind==='spatula'?stir:kind==='bag'?bagG:st==='flip'?lowGrip.group:topGrip.group;
 const local=kind==='ladle'?[V(0,0,0),V(-.64,.18,.58),V(-.99,.36,.85)]:kind==='spatula'?[V(),V(0,.06,.58),V(-.1,.11,1.02)]:kind==='bag'?[V(0,.17,0),V(.80,.14,0)]:[V(-.12,-.13,1.65),V(-.12,-.13,2.14),V(-.12,-.13,2.68)];
 const margin=local.map((v,i)=>[obj.localToWorld(v),kind==='bag'?.38:kind==='ladle'&&i===0?.39:.25]);
 return candidates(obj,margin)?{kind}:null
}
const canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{
 if(activePointer.id!==null)return;wake();makeRay(e);scene.updateMatrixWorld(true);const picked=pick();
 if(!picked){for(const o of [basket,pot,anCup])if(candidates(o)){smallWiggle=1;wiggleObj=o;break}return}
 if(picked.kind==='handled')return;
 if(!game.begin(picked.kind))return;
 activePointer.id=e.pointerId;activePointer.kind=picked.kind;activePointer.start=activePointer.last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);e.preventDefault()
});
canvas.addEventListener('pointermove',e=>{
 if(e.pointerId!==activePointer.id)return;makeRay(e);
 const last=activePointer.last,dx=e.clientX-last[0],dy=e.clientY-last[1];if(Math.hypot(e.clientX-activePointer.start[0],e.clientY-activePointer.start[1])<3)return;
 const plane=new T.Plane(V(0,1,0),-(pan.position.y+.02)),hit=V();if(ray.ray.intersectPlane(plane,hit)){
 const p=pan.worldToLocal(hit);game.move(p.x,p.z,Math.hypot(dx,dy)/Math.min(viewportW,viewportH)*2.7)}
 activePointer.last=[e.clientX,e.clientY]
});
function lift(e){if(e.pointerId!==activePointer.id)return;game.end();activePointer.id=null;activePointer.last=null}
canvas.addEventListener('pointerup',lift);canvas.addEventListener('pointercancel',lift);canvas.addEventListener('lostpointercapture',lift);
window.addEventListener('blur',()=>{game.end();activePointer.id=null});
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.end();activePointer.id=null;if(ac)ac.suspend()}else if(ac&&!muted)ac.resume().catch(()=>{})});
const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=96;const gx=grainCanvas.getContext('2d'),pixels=gx.createImageData(96,96);
for(let i=0;i<pixels.data.length;i+=4){const g=rand()*255;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=g;pixels.data[i+3]=255}gx.putImageData(pixels,0,0);document.querySelector('#grain').style.backgroundImage='url('+grainCanvas.toDataURL()+')';
// Start with the light dies. The fine engraving and reflection cube arrive on later frames.
// Linear-light highlight bloom, downsampled to one quarter resolution. The scene gets a
// single tone-mapping pass. Keep the direct framebuffer for the first frame and LDR GPUs.
let optics=null;
function makeOptics(){
 if(!renderer.extensions.has('EXT_color_buffer_float'))return;
 const rt=(depth)=>new T.WebGLRenderTarget(2,2,{type:T.HalfFloatType,depthBuffer:depth,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
 const beauty=rt(true),glow=rt(false);beauty.samples=Math.min(2,renderer.capabilities.maxSamples);
 const view=new T.OrthographicCamera(-1,1,1,-1,0,1),stage=new T.Scene();
 const vert='varying vec2 coord;void main(){coord=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const blur=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:beauty.texture},pixel:{value:new T.Vector2()}},vertexShader:vert,fragmentShader:`
 varying vec2 coord;uniform sampler2D source;uniform vec2 pixel;
 void main(){vec3 light=vec3(0.);float total=0.;
 for(int x=-2;x<=2;x++){for(int y=-2;y<=2;y++){vec2 p=vec2(float(x),float(y));float w=exp(-dot(p,p)*.36);
 vec3 c=texture2D(source,coord+p*pixel*3.).rgb;float lum=dot(c,vec3(.2126,.7152,.0722));
 light+=c*smoothstep(.95,2.8,lum)*w;total+=w;}}gl_FragColor=vec4(light/total,1.);}`});
 const combine=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{source:{value:beauty.texture},halo:{value:glow.texture}},vertexShader:vert,fragmentShader:`
 varying vec2 coord;uniform sampler2D source;uniform sampler2D halo;
 void main(){gl_FragColor=vec4(texture2D(source,coord).rgb+.065*texture2D(halo,coord).rgb,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const quad=new T.Mesh(new T.PlaneGeometry(2,2),blur);quad.frustumCulled=false;stage.add(quad);
 optics=()=>{const w=renderer.domElement.width,h=renderer.domElement.height;
 if(beauty.width!==w||beauty.height!==h){beauty.setSize(w,h);glow.setSize(Math.max(1,w>>2),Math.max(1,h>>2));blur.uniforms.pixel.value.set(1/w,1/h)}
 renderer.setRenderTarget(beauty);renderer.render(scene,camera);quad.material=blur;renderer.setRenderTarget(glow);renderer.render(stage,view);
 quad.material=combine;renderer.setRenderTarget(null);renderer.render(stage,view)}
}
let lastFrame=0,refine=0;
function drawFrame(now){
 const dt=lastFrame?Math.min(.065,(now-lastFrame)/1000):1/60;lastFrame=now;
 game.step(dt);animateProps(dt);if(optics)optics();else renderer.render(scene,camera);
 if(refine===1)skyReflection();if(refine===8)makeOptics();
 if(refine>=3&&refine<=5){
 const item=[lower.inner,upper.inner,sample.parts[0].children[0]][refine-3],temp=G(),hi=fishSurface(temp,refine===5?'pastry':'iron',167,76),old=item.geometry;item.geometry=hi.geometry;
 if(refine===5)sample.parts[0].children[1].geometry=hi.geometry;old.dispose()
 }
 refine++;requestAnimationFrame(drawFrame)
}
requestAnimationFrame(drawFrame);
