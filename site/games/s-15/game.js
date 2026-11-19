'use strict';
(()=>{
 const {T,V,TAU,M,group,ell,mesh,mat,tube,lathe,contact}=Craft,{clamp}=Kissaten;
 const sim=Kissaten.createKitchen(),s=sim.state,audio=makeAudio();
 window.__GAME__={step:sim.step,getState:sim.getState};
 const canvas=document.getElementById('room');
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(33,1,.07,55);scene.background=new T.Color(0xd5c9ae);
 scene.fog=new T.FogExp2(0xd1c5ad,.041);scene.environment=Craft.env();scene.environmentIntensity=.85;
 const sun=new T.DirectionalLight(0xffedcf,2.46);sun.position.set(-4.35,7.7,-1.6);sun.target.position.set(-.1,.03,.4);
 sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-5.1,right:5.1,top:4.9,bottom:-4.9,near:.5,far:17});
 sun.shadow.bias=-.00024;sun.shadow.normalBias=.009;sun.shadow.radius=2;scene.add(sun,sun.target,new T.HemisphereLight(0xfff4dc,0x9d8072,.67));
 const bench=Room.bench(scene);
 const jug=Utensils.makeJug(scene),mold=Utensils.makeMold(scene),pot=Utensils.makePot(scene),plate=Utensils.dish(scene),spare=Utensils.dish(scene),sweet=Utensils.sweet(scene),ice=Utensils.iceBath(scene),spoon=Utensils.spoon(scene);
 const mom=People.mama(scene),hands=[People.customer(scene,-1),People.customer(scene,1)],hint=People.hint(scene);
 const rinse=group(scene,2.76,-.13,-.74);
 lathe(rinse,[[0,.004],[.68,.004],[.70,.028],[.72,.08],[.76,.16],[.78,.17],[.78,.19],[.75,.199],[.72,.17],[.65,.065],[0,.06]],M.steel,64);
 tube(rinse,[[.49,.16,-.48],[.49,.95,-.48],[.48,1.22,-.46],[.40,1.37,-.41],[.22,1.40,-.32],[.09,1.35,-.25],[.06,1.23,-.21]],.037,M.silver,30);
 let rinseJet=mesh(rinse,new T.CylinderGeometry(.018,.023,1.02,10),mat(0xd5e1d7,.1,.13,{transparent:true,opacity:.52}),.062,.70,-.21);
 const tipDrop=ell(scene,0,0,0,.04,.07,.04,M.custard),fallDrop=ell(scene,0,0,0,.037,.047,.037,M.custard);
 const stream=mesh(scene,new T.CylinderGeometry(1,1,1,12,12),M.custard);stream.frustumCulled=false;
 const streamBase=stream.geometry.attributes.position.array.slice();
 const shadow=contact(scene,0,.006,0,1.62,1.28,.34);
 const jugShadow=contact(scene,.61,.059,.74,1.48,1.12,.23);
 const dishShadow=contact(scene,-2.12,.009,-.09,2.16,1.62,.24);
 const iceShadow=contact(scene,-4.0,.007,.5,1.9,1.62,.23);
 const dustMat=mat(0xffefd9,.92,0,{transparent:true,opacity:.35,depthWrite:false});
 const dust=new T.InstancedMesh(new T.SphereGeometry(1,5,4),dustMat,s.dust.length);scene.add(dust);dust.frustumCulled=false;
 const steamTex=Craft.tex(32,64,(x,y)=>{let xx=(x-15.5)/15.5,yy=(y-31.5)/31.5;let a=Math.exp(-xx*xx*5.4)*(Math.max(0,1-yy*yy)**2);return[255,255,255,Math.round(255*a)]});
 const wisps=[];for(let i=0;i<s.steam.length;i++){let m=mat(0xfff9e8,.98,0,{map:steamTex,transparent:true,opacity:.11,depthWrite:false,side:T.DoubleSide}),o=mesh(scene,new T.PlaneGeometry(1,1,3,8),m);wisps.push(o)}
 let room=null,post=null;
 // A single light finishing pass in display space, with very narrow bloom and film grain.
 function finishing(){
   const target=new T.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,samples:renderer.getPixelRatio()>1.4?0:2});target.texture.colorSpace=T.LinearSRGBColorSpace;
   const p=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
   const shader=new T.ShaderMaterial({uniforms:{frame:{value:target.texture},pixel:{value:new T.Vector2()},tick:{value:0}},depthTest:false,depthWrite:false,
   vertexShader:'varying vec2 at;void main(){at=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`uniform sampler2D frame;uniform vec2 pixel;uniform float tick;varying vec2 at;
   vec3 bright(vec2 d){vec3 c=texture2D(frame,at+d*pixel*3.0).rgb;return max(c-vec3(.77),vec3(0.));}
   void main(){vec3 c=texture2D(frame,at).rgb;vec3 b=bright(vec2(1.,0.))+bright(vec2(-1.,0.))+bright(vec2(0.,1.))+bright(vec2(0.,-1.));c+=b*.027;
   vec2 q=(at-.5)*1.6;c*=1.-.13*dot(q,q);float n=fract(sin(dot(gl_FragCoord.xy+tick,vec2(12.9898,78.233)))*43758.5453)-.5;c+=n*.0045;gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`});p.add(new T.Mesh(new T.PlaneGeometry(2,2),shader));return {target,p,camera,shader};
 }
 const home=V(-.58,.006,.92),coldSpot=V(-.36,.006,.59),bathSpot=V(-.36,.011,.59),parkPlate=V(-2.10,.009,-.13),sink=V(2.76,.04,-.74);
 const smooth=v=>{let x=clamp(v);return x*x*(3-2*x)};
 const seg=(a,b,x)=>smooth((x-a)/(b-a)),blend=(a,b,t)=>a.clone().lerp(b,t);
 function travel(a,b,t,h){let p=blend(a,b,t);p.y+=Math.sin(t*Math.PI)*h;return p}
 const phaseNames=['pour','slide','load','wipe','steam','jiggle','chill','drain','plate','cover','turn','lift','serve','receive'];
 const at=n=>phaseNames.indexOf(s.stage)>=phaseNames.indexOf(n);
 let width=1,height=1;
 const center=V(-.025,.76,-.02),offset=V(.37,2.46,5.94),cameraFocus=center.clone();let zoom=1;
 function layout(){
   width=window.innerWidth;height=window.innerHeight;renderer.setSize(width,height,false);cam.aspect=width/height;
   cam.fov=Math.max(32,2*Math.atan(1.83/(offset.length()*cam.aspect))*180/Math.PI);cam.updateProjectionMatrix();
   if(post){let v=renderer.getDrawingBufferSize(new T.Vector2());post.target.setSize(v.x,v.y);post.shader.uniforms.pixel.value.set(1/v.x,1/v.y)}
 }
 let stageLast='';
 let motion={jug:0,mold:0,lid:0,dish:0,ice:0},motionV={...motion};
 function presentation(dt){
   let age=s.age,stage=s.stage;
   let target=center.clone(),zs=1;
   if(stage==='slide'){target.set(-.09,.66,-.09);zs=.97}
   if(['load','wipe','steam','jiggle'].includes(stage)){target.set(.99,.92,-1.32);zs=stage==='load'?.91:.76}
   if(['chill','drain','plate','cover','turn','lift','serve'].includes(stage)){target.set(-.32,.65,.26);zs=stage==='chill'?.86:.84}
   if(stage==='serve'){target.z-=s.push*.72;target.y+=s.push*.04}
   if(stage==='receive'){let ret=seg(4.6,8.0,age);target.set(-.15,.69,-1.62).lerp(center,ret);zs=.86+.14*ret}
   cameraFocus.lerp(target,1-Math.exp(-dt*1.55));zoom+=(zs-zoom)*(1-Math.exp(-dt*1.35));
   cam.position.copy(cameraFocus).addScaledVector(offset,zoom);cam.lookAt(cameraFocus);cam.updateMatrixWorld();
   for(let k in motion){motionV[k]+=(-motion[k]*55-motionV[k]*6)*dt;motion[k]+=motionV[k]*dt}
   if(room){
     const distance=cam.position.z-room.awning.position.z,top=cam.position.y+Math.tan(-Math.atan2(offset.y,offset.z)+cam.fov*Math.PI/360)*distance;
     room.awning.position.y=top+.058;room.awning.position.x=cam.position.x*.18;
   }
   const park=stage==='receive'?1-seg(5.8,8.1,age):at('load')?(stage==='load'?seg(.15,2.9,age):1):0;
   jug.g.position.set(.61+park*1.67,.048+Math.sin(park*Math.PI)*.12,.74-park*.36);
   jug.g.rotation.z=s.tilt+motion.jug*.10;jug.g.rotation.y=-park*.18;
   jug.liquid.position.y=1.125-.28*((182-s.jugMl)/139);jug.liquid.rotation.z=-s.tilt*.85;
   jug.liquid.scale.setScalar(1+.04*(182-s.jugMl)/139);
   let mp=home.clone().add(V(s.moldX,0,s.moldZ)),mr=0,pp=parkPlate.clone(),pr=0;
   const potInside=pot.g.position.clone().add(V(0,.477,0));
   const bathTop=bathSpot.clone().add(V(0,.092,0));
   const lidOpen=stage==='load'?seg(.05,.99,age)*(1-seg(3.02,4.20,age)):stage==='chill'?seg(.03,.98,age)*(1-seg(3.31,4.5,age)):0;
   // The back hinge holds the hot lid while the cook lifts the mold.
   pot.lid.rotation.x=-lidOpen*.99;pot.lid.position.set(0,.974+lidOpen*.64,-lidOpen*.34);
   pot.g.rotation.z=(stage==='jiggle'?s.shake*.075:0)+motion.lid*.024;
   let bp=V(-4.10,-.125,-.42);
   if(stage==='load')mp=travel(mp,potInside,seg(1.0,3.11,age),.77);
   if(['wipe','steam','jiggle'].includes(stage))mp=potInside.clone();
   if(stage==='jiggle')mp.x+=s.shake*.091;
   if(stage==='chill'){let t=seg(1.10,3.45,age);mp=travel(potInside,bathTop,t,.73);bp=blend(bp,bathSpot,seg(0,2.0,age))}
   if(stage==='drain'||stage==='plate'){let t=stage==='plate'?1:seg(0,1.6,age);mp=travel(bathTop,coldSpot,t,.58);bp=blend(bathSpot,V(-3.92,-.12,-.42),(stage==='plate'?1:seg(.32,1.45,age)));pp=blend(parkPlate,V(-1.77,.011,.50),t)}
   if(stage==='cover'){
     let t=smooth(s.cover);mp=coldSpot.clone();bp=V(-3.92,-.12,-.42);
     pp=travel(V(-1.77,.011,.50),coldSpot.clone().add(V(0,.908,0)),t,.82);pr=t*Math.PI;
   }
   if(stage==='turn'){
     const a=s.turn*Math.PI,h=.454,d=.57*Math.sin(a);
     mp=V(coldSpot.x+h*Math.sin(a),coldSpot.y+h-h*Math.cos(a)+d,coldSpot.z);mr=a;
     pp=V(coldSpot.x-h*Math.sin(a),coldSpot.y+h+h*Math.cos(a)+d,coldSpot.z);pr=Math.PI+a;
   }
   if(stage==='lift'||stage==='serve'||stage==='receive'){
     pp=coldSpot.clone();const push=s.push;
     if(stage==='serve'||stage==='receive'){pp.z-=push*1.12;pp.x+=push*.13;pp.y+=push*.02}
     if(stage==='receive'){pp=travel(pp,V(.04,.31,-2.99),seg(0,2.45,age),.20);
       let take=seg(2.9,5.5,age);pp.z-=take*1.77;pp.y-=take*.91;}
     mp=coldSpot.clone().add(V(s.lift*.06,.908+.027+s.lift*.996,0));mr=Math.PI;
     if(stage==='serve'){let t=seg(0,2.31,age);mp=travel(mp,sink,t,.30);mr=Math.PI*(1-t)}
     if(stage==='receive'){
       const t=seg(4.15,7.9,age);mp=travel(sink,home,t,.73);mr=.20*Math.sin(t*Math.PI);
     }
   }
   rinseJet.visible=stage==='receive'&&age<4.1;rinseJet.scale.x=rinseJet.scale.z=.78+s.bubbleEnergy*.24;
   ice.g.position.copy(bp);ice.g.rotation.y=motion.ice*.033;
   ice.cubes.forEach((o,i)=>{let a=i/11*TAU+Math.sin(s.waterPhase+i*.3)*(.024+s.iceStir*.087);
     o.position.set(.69*Math.cos(a),.385+Math.sin(s.waterPhase*(1+i*.03)+i)*(.009+.028*s.iceStir),.69*Math.sin(a));o.rotation.z=Math.sin(s.waterPhase+i)*(.045+s.iceStir*.15);o.scale.setScalar(Math.cbrt(s.iceMass[i]/(3.8+.45*Math.cos(i*3.56))))});
   mold.g.position.copy(mp);mold.g.rotation.set(0,0,mr+motion.mold*.04);
   plate.position.copy(pp);plate.rotation.set(s.plateZ,0,pr-s.plateX+motion.dish*.04);
   spare.visible=stage==='receive'&&age>3.0;if(spare.visible){spare.position.copy(travel(V(-3.73,-.11,-1.27),parkPlate,seg(3,7.7,age),.11))}
   sweet.g.visible=at('lift');if(sweet.g.visible){
     plate.updateMatrixWorld();sweet.g.position.copy(plate.localToWorld(V(0,.177,0)));sweet.g.quaternion.copy(plate.quaternion);
     Utensils.updateSweet(sweet,s);
   }
   mold.liquid.visible=!at('lift');if(!at('lift'))Utensils.surface(mold,s);
   mold.bottom.visible=!at('lift')||stage==='receive'&&age>5.8;
   shadow.position.set(mp.x,.012,mp.z);shadow.material.opacity=.32*Math.exp(-Math.max(0,mp.y)*1.8);shadow.visible=mp.z>-.69;
   jugShadow.position.x=jug.g.position.x;jugShadow.position.z=jug.g.position.z;
   dishShadow.position.set(pp.x,.013,pp.z);dishShadow.visible=pp.z>-.70;dishShadow.material.opacity=.24*Math.exp(-Math.max(0,pp.y)*2.2);
   iceShadow.position.x=bp.x;iceShadow.visible=bp.x>-2;
   // The outgoing spoon touches the rim only after the saucer reaches the waiting hands.
   let spoonHome=V(-1.52,.024,1.05),sp=spoonHome.clone(),spAngle=-1.14;
   if(stage==='receive'){let t=seg(0,1.7,age)*(1-seg(4.6,7.55,age));sp=travel(spoonHome,pp.clone().add(V(.79,.208,.03)),t,.26);spAngle+=t*1.72}
   spoon.position.copy(sp);spoon.rotation.y=spAngle;
   const spout=jug.g.localToWorld(V(-.748,1.308,0));
   const land=mp.clone().add(V(clamp((spout.x-mp.x)/.55,-.8,.72)*.55,.070+.627*(s.volume/139)**.87,-.18));
   tipDrop.visible=stage==='pour'&&s.flux<4;tipDrop.position.copy(spout).y-=s.drop*.61;tipDrop.scale.set(s.drop*.80,s.drop*1.34,s.drop*.80);
   tipDrop.rotation.z=s.air*.4;
   fallDrop.visible=s.fall>=0&&stage==='pour';if(fallDrop.visible){fallDrop.position.copy(spout).lerp(land,clamp(s.fall*s.fall));fallDrop.scale.set(.031,.045+.026*s.fall,.031)}
   stream.visible=stage==='pour'&&s.flux>.08;
   if(stream.visible){let p=stream.geometry.attributes.position,rr=Math.sqrt(s.flux/42)*.053;
     for(let i=0;i<p.count;i++){let k=i*3,t=.5-streamBase[k+1],amp=rr*(1-.41*t);p.setXYZ(i,spout.x+(land.x-spout.x)*t+streamBase[k]*amp,spout.y+(land.y-spout.y)*t*t,spout.z+(land.z-spout.z)*t+streamBase[k+2]*amp)}
     p.needsUpdate=true;stream.geometry.computeVertexNormals()}
   Utensils.updateGlass(pot,s);
   let hot=at('wipe')&&!at('chill');
   s.steam.forEach((p,i)=>{let o=wisps[i];o.position.set(pot.g.position.x+p.x+(hot?.15:.04),pot.g.position.y+1.39+p.y, pot.g.position.z+p.z);
     o.rotation.set(-.07,p.spin*.24,p.vx*2.4+.19*Math.sin(p.y*4+p.spin));o.scale.set((.09+p.life*.145)*(hot?1.4:1),.21+p.life*.47,1);
     o.material.opacity=(.023+.048*Math.sin(p.life*Math.PI))*(hot?1.55:1);o.visible=p.life>.04&&p.life<.96});
   const tmp=new T.Object3D();s.dust.forEach((p,i)=>{tmp.position.set(p.x,p.y,p.z);tmp.scale.setScalar(.0025+(i%5)*.00063);tmp.updateMatrix();dust.setMatrixAt(i,tmp.matrix)});dust.instanceMatrix.needsUpdate=true;
   let rest=V(1.86,.86,-1.76),hand=rest.clone(),mx=2.76;
   if(stage==='load'){let grip=pot.lid.localToWorld(V(0,.53,.025)),reach=seg(0,.44,age)*(1-seg(3.88,4.30,age));
     let catchMold=seg(.73,1.35,age)*(1-seg(2.88,3.39,age));hand=blend(rest,blend(grip,mp.clone().add(V(.48,.58,-.06)),catchMold),reach);mx-=.90*Math.sin(Math.PI*clamp(age/4.3))}
   if(stage==='steam')hand.lerp(V(2.28,.697,-1.65),smooth(s.heat));
   if(stage==='jiggle')hand=V(2.28+.053*s.shake,.697,-1.65);
   if(stage==='chill'){let grip=pot.lid.localToWorld(V(0,.50,.02)),pickup=seg(.78,1.22,age);
     hand=blend(rest,grip,seg(0,.70,age));hand.lerp(mp.clone().add(V(.48,.59,-.075)),pickup);hand.lerp(rest,seg(3.39,5.19,age));mx-=1.05*seg(.6,2.7,age)*(1-seg(3.39,5.19,age))}
   if(stage==='drain'){let k=Math.sin(Math.PI*clamp(age/1.6));hand=blend(rest,mp.clone().add(V(.46,.54,.01)),k);mx-=k*.98}
   if(stage==='receive'){let k=seg(3.80,4.50,age)*(1-seg(7.35,8.5,age));hand=blend(rest,mp.clone().add(V(.42,.48,-.05)),k);mx-=k*.98}
   mom.pose(mx,hand);
   hands.forEach((o,i)=>{let sign=i?1:-1,reach=stage==='serve'?s.push*.18:0;
     if(stage==='receive'){let t=seg(0,2.45,age),take=seg(2.9,5.5,age),back=seg(5.6,7.9,age);o.position.set(sign*(.51+.22*t*(1-back)),.346+.15*t-.76*take*(1-back)-.15*back,-3.43+.48*t-1.83*take*(1-back)-.48*back)}
     else o.position.set(sign*.51,.346+reach*.20,-3.43+reach);o.rotation.z=-sign*.035});
   updateHint();
   if(stageLast!==stage){let num=at('lift')?3:at('chill')?2:at('load')?1:0;document.querySelectorAll('#recipe svg').forEach((o,i)=>o.classList.toggle('current',i===num));stageLast=stage}
   if(post)post.shader.uniforms.tick.value=Math.floor(s.clock*9)%127;
 }
 function updateHint(){
   let active=['pour','slide','wipe','steam','chill','plate','turn','lift','serve'].includes(s.stage)&&s.idle>=3.95&&!s.held;
   hint.g.visible=active;if(!active)return;
   let p=(s.idle-3.95)%4.8,k=seg(.32,2.32,p),a=0,target=V(),opacity=seg(0,.30,p)*(1-seg(2.65,3.2,p));
   if(s.stage==='pour'){target=jug.g.localToWorld(V(.91,.90,.10));target.x-=k*.23;target.y+=k*.13-.04*Math.sin(k*Math.PI)}
   if(s.stage==='slide'){target=mold.g.position.clone().add(V(.38,.62,.24));target.z-=k*.92;target.x-=k*.15}
   if(s.stage==='wipe'||s.stage==='steam'){target=pot.lid.localToWorld(V(.38*Math.cos(k*TAU),.34,.34+.25*Math.sin(k*TAU)))}
   if(s.stage==='chill'){target=ice.g.localToWorld(V(.69*Math.cos(k*3),.42,.64*Math.sin(k*3)))}
   if(s.stage==='plate'){target=plate.position.clone().add(V(.46,.24,.23));target.x+=k*.80;target.y+=Math.sin(k*Math.PI)*.48}
   if(s.stage==='turn'){target=coldSpot.clone().add(V(.77*Math.cos(k*Math.PI),.73+.60*Math.sin(k*Math.PI),.15));a=k*1.5}
   if(s.stage==='lift'){target=mold.g.position.clone().add(V(.30,-.09,.22));target.y+=k*.51}
   if(s.stage==='serve'){target=plate.position.clone().add(V(.35,.21,.74));target.z-=k*.70}
   hint.g.position.copy(target).add(V(-.13,.25,.11));hint.g.rotation.z=-2.82-a;hint.g.scale.setScalar(1.18);
   hint.m.opacity=opacity*.80;hint.stitch.opacity=opacity*.77;
 }
 const raycaster=new T.Raycaster(),ndc=new T.Vector2();let pointer=null,lastX=0,lastY=0,dragPlane=new T.Plane(V(0,1,0),0);
 const targets=()=>({jug:jug.g,mold:mold.g,lid:pot.lid,ice:ice.g,plate,grip:plate,dish:plate});
 const toolFor=()=>({pour:'jug',slide:'mold',wipe:'lid',steam:'lid',chill:'ice',plate:'plate',turn:'grip',lift:'mold',serve:'dish'}[s.stage]);
 function ray(x,y){ndc.set(x/width*2-1,1-y/height*2);raycaster.setFromCamera(ndc,cam)}
 function lidPoint(x,y){
   ray(x,y);let h=raycaster.intersectObject(pot.lid,true)[0],p=h?h.point.clone():V();
   if(!h){dragPlane.constant=-(pot.g.position.y+1.16);if(!raycaster.ray.intersectPlane(dragPlane,p))return [0,0]}
   pot.lid.worldToLocal(p);return [clamp(p.x/.765,-1,1),clamp(p.z/.765,-1,1)];
 }
 function hit(x,y){
   let target=toolFor();ray(x,y);scene.updateMatrixWorld(true);
   if(target){let active=targets()[target],hs=raycaster.intersectObject(active,true).filter(h=>h.object.visible&&h.object!==mold.liquid);
     if(hs.length)return target;
     if(target==='grip'&&raycaster.intersectObject(mold.g,true).length)return target;
     if(target==='dish'&&raycaster.intersectObject(sweet.g,true).length)return target;
     // A very small fingertip margin around thin rims and the open jug handle.
     let anchor=null,margin=0;if(target==='jug'){anchor=jug.g.localToWorld(V(.78,.817,.01));margin=.206}
     if(target==='grip'){anchor=plate.localToWorld(V(.90,.20,0));margin=.10}
     if(anchor&&raycaster.ray.distanceToPoint(anchor)<margin)return target;
   }
   let nearest=null;for(let [name,o] of [['jug',jug.g],['mold',mold.g],['lid',pot.g],['dish',plate],['ice',ice.g]]){
     let h=raycaster.intersectObject(o,true).find(h=>h.object.visible);if(h&&(!nearest||h.distance<nearest.d))nearest={name,d:h.distance}}
   if(nearest)motionV[nearest.name]+=.28;return null;
 }
 canvas.addEventListener('pointerdown',e=>{
   if(pointer!==null)return;audio.unlock();const tool=hit(e.clientX,e.clientY);if(!tool)return;
   let uv=tool==='lid'?lidPoint(e.clientX,e.clientY):[0,0];
   if(sim.down(tool,...uv)){pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);e.preventDefault()}
 });
 let lastRub=0;
 canvas.addEventListener('pointermove',e=>{
   if(pointer!==e.pointerId){if(e.pointerType==='mouse'&&!e.buttons){ray(e.clientX,e.clientY);let tool=toolFor();canvas.style.cursor=tool&&raycaster.intersectObject(targets()[tool],true).length?'grab':'default'}return}
   const distance=cam.position.distanceTo(cameraFocus),scale=2*distance*Math.tan(cam.fov*Math.PI/360)/height;
   let dx=(e.clientX-lastX)*scale,dy=(e.clientY-lastY)*scale;
   const uv=s.held==='lid'?lidPoint(e.clientX,e.clientY):[0,0];
   if(s.stage==='slide'||s.stage==='serve'){dy*=1.93;dx+=dy*.055}
   sim.move(dx,dy,...uv);
   if(s.held==='lid'&&s.clock-lastRub>.13&&Math.hypot(dx,dy)>.012){audio.brush(900+s.fogCleared*900,.022+.028*(1-s.fogCleared),.12);lastRub=s.clock}
   if(s.held==='ice'&&s.clock-lastRub>.35){audio.brush(2400,.032,.12);lastRub=s.clock}
   lastX=e.clientX;lastY=e.clientY;e.preventDefault();
 });
 function release(e){if(pointer===e.pointerId){sim.up();pointer=null;canvas.style.cursor='default'}}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
 document.getElementById('sound').addEventListener('click',e=>e.currentTarget.setAttribute('aria-pressed',String(audio.toggle())));
 window.addEventListener('resize',layout);
 document.addEventListener('visibilitychange',()=>{audio.visibility(document.hidden);if(document.hidden){sim.up();pointer=null}prev=performance.now()});
 function draw(){if(post){renderer.setRenderTarget(post.target);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.render(post.p,post.camera)}else renderer.render(scene,cam)}
 layout();presentation(0);draw();
 function silverReflections(){
   // Bake a small reflection probe from the finished woodwork and windows after first paint.
   if(!room||document.hidden)return;
   const oldBackground=scene.background,oldEnv=scene.environment,keep=new Set([bench,room.architecture,room.awning,pot.g]);
   const hidden=scene.children.filter(o=>o.visible&&!o.isLight&&!keep.has(o));hidden.forEach(o=>o.visible=false);
   scene.background=oldEnv;
   const target=new T.WebGLCubeRenderTarget(64,{type:T.UnsignedByteType}),probe=new T.CubeCamera(.08,33,target);
   probe.position.set(-.06,.92,.71);probe.update(renderer,scene);
   const filter=new T.PMREMGenerator(renderer),filtered=filter.fromCubemap(target.texture);
   scene.background=oldBackground;scene.environment=filtered.texture;hidden.forEach(o=>o.visible=true);
   filter.dispose();target.dispose();oldEnv.dispose();
 }
 let prev=performance.now(),frame=0;
 function loop(now){const dt=Math.min(.060,Math.max(0,(now-prev)/1000));prev=now;
   if(!document.hidden){sim.step(dt);presentation(dt);audio.update(s,s.events.splice(0));draw()}
   if(++frame===2){room=Room.room(scene);post=finishing();layout();if('requestIdleCallback' in window)requestIdleCallback(silverReflections,{timeout:2500});else setTimeout(silverReflections,800)}
   requestAnimationFrame(loop)}
 requestAnimationFrame(loop);
})();
