'use strict';
(()=>{
const A=Studio,T=THREE,{W,D,BASE,clamp,smooth,noise}=Pastry;
const sim=Pastry.create(),st=sim.state, sound=kitchenSound(), canvas=document.querySelector('#workshop');
window.__GAME__={step:sim.step,getState:sim.getState};
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
const scene=new T.Scene();scene.background=new T.Color(0xe9e4ce);scene.fog=new T.FogExp2(0xe9e5d5,.022);
const camera=new T.PerspectiveCamera(34,1,.08,68),world=A.group(scene);
const sun=new T.DirectionalLight(0xffeac9,3.05);sun.position.set(-4.6,8,-3.5);sun.castShadow=true;scene.add(sun);
Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.2,far:22});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00017;sun.shadow.normalBias=.012;sun.shadow.radius=2.6;
scene.add(new T.HemisphereLight(0xfff9e8,0xb5a18b,1.02));
function tag(o,k){o.userData.kind=k;return o;}
function compact(root){
 root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),bins=new Map(),erase=[];
 root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;
  const g=o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));
  if(!bins.has(o.material))bins.set(o.material,[]);bins.get(o.material).push(g);erase.push(o);
 });
 for(const o of erase)o.removeFromParent();
 for(const [m,items] of bins){
  const geo=new T.BufferGeometry(),count=items.reduce((n,g)=>n+g.attributes.position.count,0);
  for(const key of ['position','normal','uv']){
   const size=key==='uv'?2:3,arr=new Float32Array(count*size);let off=0;
   for(const g of items){if(g.attributes[key])arr.set(g.attributes[key].array,off);off+=g.attributes.position.count*size;}
   geo.setAttribute(key,new T.BufferAttribute(arr,size));
  }
  const indices=new (count>65535?Uint32Array:Uint16Array)(items.reduce((n,g)=>n+(g.index?.count||g.attributes.position.count),0));
  let base=0,at=0;
  for(const g of items){const n=g.index?.count||g.attributes.position.count;for(let i=0;i<n;i++)indices[at++]=base+(g.index?g.index.array[i]:i);base+=g.attributes.position.count;g.dispose();}
  geo.setIndex(new T.BufferAttribute(indices,1));A.mesh(geo,m,root);
 }
 return root;
}
// A low-resolution window reflection is available before the real kitchen is captured.
const ec=A.canvas(128);ec.height=64;const eg=ec.getContext('2d'),sky=eg.createLinearGradient(0,0,0,64);
sky.addColorStop(0,'#f6e4b8');sky.addColorStop(.49,'#aaa99a');sky.addColorStop(.56,'#52666a');sky.addColorStop(1,'#bcae84');eg.fillStyle=sky;eg.fillRect(0,0,128,64);
for(let a=0;a<3;a++)for(let b=0;b<2;b++){eg.fillStyle='#fffbea';eg.fillRect(13+a*10,12+b*12,9,10);}eg.fillStyle='#383f3b';eg.fillRect(87,25,27,15);
const env=A.tex(ec);env.mapping=T.EquirectangularReflectionMapping;scene.environment=env;scene.environmentIntensity=.45;
const tableMat=A.mapped('linen',.94);tableMat.map.repeat.set(10,8);
const table=A.box(world,tableMat,0,-.43,1,16,.48,13);
// The morning light passes through a pair of distant window muntins.
const mullion=A.mat(0xeee8d9,.7,{colorWrite:false,depthWrite:false});mullion.transparent=true;mullion.opacity=0;
const mullionDepth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});
for(const [x,z,w,d] of [[-6.34,-2.6,.115,14],[-3.18,-6.28,16,.16],[-.86,-3.2,.084,14]]){
 const o=A.box(world,mullion,x,5.5,z,w,.08,d);o.rotation.y=.11;o.receiveShadow=false;o.customDepthMaterial=mullionDepth;
}
const back=A.mat(0xc5d2c8,.7),frame=A.mat(0xf0e9d8,.46);
A.box(world,back,0,.43,-6.8,18,1.85,.24);A.box(world,frame,0,1.16,-6.5,18,.14,.6);
A.box(world,A.mat(0xc4dad3,.16,{transparent:true,opacity:.24,depthWrite:false}),0,3.7,-7,19,5.4,.08);
const outdoors=A.group(world);outdoors.position.set(0,0,-11.2);
for(let i=0;i<15;i++){
 const o=A.oval(outdoors,A.mat([0xb2bf88,0xc7c992,0xa1b58c][i%3],.94),-10+i*1.53,1.73+.56*Math.sin(i*2),-.5-Math.cos(i),1.65,.66+.33*Math.cos(i*3),1.13);o.castShadow=false;
}compact(outdoors);
for(let i=-3;i<=3;i++)A.box(world,frame,i*2.5,3.5,-6.84,.085,5,.14);
A.box(world,frame,0,3.53,-6.84,19,.085,.14);
const board=A.group(world);const boardMesh=A.solid(board,A.wood,A.rounded(W+.86,D+.75,.23),.267,.055);
board.position.y=-.165;
const boardUV=boardMesh.geometry.attributes.uv;for(let i=0;i<boardUV.count;i++)boardUV.setXY(i,boardUV.getX(i)*.42,boardUV.getY(i)*.49);
const boardBand=A.solid(board,A.mat(0xb18860,.6),A.rounded(W+.85,D+.74,.23),.014,.018);boardBand.position.y=.045;
const napkinM=A.mapped('towel');napkinM.map.repeat.set(2,2);
const goal=A.group(world);let nap=A.solid(goal,napkinM,A.rounded(2.6,1.92,.055),.04,.02);nap.rotation.y=-.17;nap.position.y=-.174;
const nap2=A.solid(goal,napkinM,A.rounded(2.53,1.86,.05),.027,.018);nap2.position.y=-.095;nap2.rotation.y=-.12;
const goalPlate=A.plate(goal,1.09);goalPlate.position.y=-.041;const example=A.exemplar(goal);example.position.y=.051;example.scale.setScalar(1.13);example.rotation.y=-.31;
compact(goal);
const bouquet=compact(A.blossomPitcher(world));
const fruitBowl=tag(compact(A.bowl(world)),'bowl');
const wedge=compact(A.berry(new T.Group(),1)),heapMeshes=[];
const heapMatrices=[];
for(let i=0;i<13;i++){
 const b=new T.Object3D(),ang=i*2.40,r=i<9?.40:.23;
 b.position.set(Math.cos(ang)*r,.28+(i<9?i%3*.049:.18+(i%2)*.075),Math.sin(ang)*r);
 b.rotation.order='YXZ';b.rotation.set(-.24-A.rand()*.65,ang+.5,(A.rand()-.5)*.5);b.scale.setScalar(.91+A.rand()*.22);b.updateMatrix();heapMatrices.push(b.matrix.clone());
}
wedge.traverse(o=>{if(!o.isMesh)return;const pile=new T.InstancedMesh(o.geometry,o.material,13);pile.castShadow=pile.receiveShadow=true;fruitBowl.add(pile);heapMeshes.push(pile);heapMatrices.forEach((m,i)=>pile.setMatrixAt(i,m));});
const dish=tag(compact(A.plate(world,.84)),'dish');dish.scale.set(1.12,1,.76);
const server=tag(compact(A.utensil(world,'server')),'server'),knife=tag(compact(A.utensil(world,'knife')),'knife');
const spat=tag(A.utensil(world,'spatula'),'spatula');
const smudge=A.oval(spat,A.cream,0,.047,.253,.259,.078,.273);
for(let i=0;i<3;i++)A.oval(spat,A.cream,-.125+i*.12,.055,.263+i*.045,.077,.038,.23);
compact(spat);
const drip=A.oval(world,A.cream,0,0,0,.05,.10,.05);
const serving=tag(compact(A.plate(world,.99)),'dish');
const dad=compact(A.hand(world)),girl=compact(A.hand(world,true));
const creamPot=A.group(world);const pot=A.bowl(creamPot);pot.scale.set(.78,.73,.78);
A.oval(creamPot,A.cream,0,.334,0,.51,.085,.50);
for(let i=0;i<4;i++){const pts=[];for(let j=0;j<20;j++){const a=j*.22+i*1.12,r=.37-j*.009;pts.push([r*Math.sin(a),.386+j*.001,r*Math.cos(a)]);}A.tube(creamPot,A.cream,pts,.028);}
compact(creamPot);
const crumbMat=A.mapped('crumb',.85),skinMat=A.mapped('skin',.69),paperMat=A.mapped('paper',.90);
for(const m of [crumbMat,skinMat,paperMat,A.cream])m.side=T.DoubleSide;
crumbMat.map.repeat.set(3.4,.78);skinMat.map.repeat.set(2.46,1.93);
const creamMat=A.cream.clone();creamMat.side=T.DoubleSide;creamMat.vertexColors=true;
creamMat.onBeforeCompile=sh=>{
 sh.vertexShader='attribute float coverage; varying float vCoverage;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCoverage=coverage;');
 sh.fragmentShader='varying float vCoverage;\n'+sh.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\nif(vCoverage<0.0028) discard;');
};
const originalCreamShader=creamMat.onBeforeCompile;
for(const material of [creamMat,skinMat,crumbMat]){
 material.userData.localWet=true;
 material.onBeforeCompile=sh=>{
   if(material===creamMat)originalCreamShader(sh);
   sh.vertexShader='attribute float hydration;varying float vHydration;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHydration=hydration;');
   sh.fragmentShader='varying float vHydration;\n'+sh.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(0.45-vHydration)*0.7,0.08,1.0);');
 };
}
skinMat.vertexColors=true;
function grid(parent,material,nx,ny,fn,reverse=false,withCream=false){
 const g=new T.BufferGeometry(),n=nx*ny;
 const p=new T.BufferAttribute(new Float32Array(n*3),3),uv=new T.BufferAttribute(new Float32Array(n*2),2);
 g.setAttribute('position',p);g.setAttribute('uv',uv);
 const idx=[];for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const n=j*nx+i;uv.setXY(n,i/(nx-1),j/(ny-1));if(i<nx-1&&j<ny-1){const a=n,b=n+1,c=n+nx,d=c+1;idx.push(...(reverse?[a,d,b,a,c,d]:[a,b,d,a,d,c]));}}
 g.setIndex(idx);
 let coverage,cols;if(withCream){coverage=new T.BufferAttribute(new Float32Array(n),1);cols=new T.BufferAttribute(new Float32Array(n*3).fill(1),3);g.setAttribute('coverage',coverage);g.setAttribute('color',cols);}
 const hydration=material.userData.localWet?new T.BufferAttribute(new Float32Array(n),1):null;
 if(hydration)g.setAttribute('hydration',hydration);
 const baked=material===skinMat?new T.BufferAttribute(new Float32Array(n*3).fill(1),3):null;
 if(baked)g.setAttribute('color',baked);
 const o=A.mesh(g,material,parent);o.frustumCulled=false;if(withCream){o.castShadow=false;}
 const update=()=>{for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i,q=fn(i/(nx-1),j/(ny-1));p.setXYZ(k,q.x,q.y,q.z);
   if(hydration)hydration.setX(k,q.wet??.43);
   if(baked){const browning=q.brown||0;baked.setXYZ(k,1-browning*.12,1-browning*.27,1-browning*.35);}
   if(q.u!==undefined)uv.setXY(k,q.u,q.v);if(coverage){coverage.setX(k,q.cover||0);const red=q.tint||0;cols.setXYZ(k,1,1-red*.82,1-red*.75);}}
   p.needsUpdate=true;uv.needsUpdate=true;if(hydration)hydration.needsUpdate=true;if(baked)baked.needsUpdate=true;if(coverage){coverage.needsUpdate=true;cols.needsUpdate=true;}g.computeVertexNormals();if(g.boundingSphere)g.computeBoundingSphere();};
 return {o,update};
}
const paper=tag(A.group(world),'paper');
const sheet=grid(paper,paperMat,45,51,(u,v)=>{
 const x=(u-.5)*(W+.69),s=v*(D+.65)-.325,z=D/2-s;
 const edge=Math.pow(Math.abs(2*u-1),10)+Math.pow(Math.abs(2*v-1),12);
 const crumple=.017*Math.sin(x*11+s*5)+.021*Math.sin(s*9-x*4)+.022*Math.cos(x*3.9+s*8.1);
 const corner=Math.pow(Math.abs(2*u-1),5)*Math.pow(Math.abs(2*v-1),5);
 const curl=.062+crumple*1.26+corner*.15;
 const L=clamp(st.roll+st.pucker[Math.round(u*(Pastry.NX-1))],0,D);
 const rr=Math.sqrt(.265**2+.332*L/Math.PI),d=s-L;
 // The gripped parchment wraps half-way around the coil, then trails free behind it.
 const gain=smooth(clamp(L/.71,0,1)),path=Math.min(0,d),angle=Math.min(Math.PI*.91,-path/(rr+.043));
 const extra=Math.max(0,-path-Math.PI*.91*(rr+.043));
 let yy=(1-Math.cos(angle))*(rr+.043),zz=Math.sin(angle)*(rr+.043)-extra*.75;
 const wave=Math.sin(x*4.1+s*5)*st.paperStress*.08+st.pucker[Math.round(u*(Pastry.NX-1))]*.31;
 const foldedZ=D/2-L+zz, peeledHeight=Math.max(.02,yy-extra*.46)+wave;
 const released=smooth(clamp((L-D+.62)/.59,0,1));
 let Y=.17+edge*curl+(d<0?gain*(peeledHeight*(1-released)+.022*released):0);
 let Z=d<0?z*(1-gain)+(foldedZ-extra*.23*released)*gain:z;
 if(d<0){Z-=released*(.82+(-d)*.60);}
 if(st.stage==='unfold'){Y+=Math.sin(v*Math.PI)*.57*(1-smooth(clamp(st.stageAge/1.25,0,1)));}
 return {x:x+edge*.022*Math.sin(s*7+2*u),y:Y,z:Z+edge*crumple*.48};
});
let portrait=false;const layout={};
function placeScene(){
 portrait=innerWidth/innerHeight<.89;
 const narrow=portrait;
 layout.bowl=narrow?[1.33,-3.12]:[3.13,-1.82];
 layout.dish=narrow?[1.43,2.79]:[3.24,1.24];
 layout.server=narrow?[-2.06,2.16]:[-3.11,1.42];
 goal.position.set(narrow?-1.09:-3.03,0,narrow?-3.49:-2.38);
 goal.rotation.y=narrow?.21:.08;
 bouquet.position.set(narrow?-2.42:-3.84,-.18,narrow?-4.52:-3.97);
 creamPot.position.set(narrow?-2.02:-3.51,-.18,narrow?2.98:-.06);
 dish.position.set(layout.dish[0],-.18,layout.dish[1]);dish.rotation.y=-.47;
 serving.position.set(-6,-.18,2.15);
}
function resize(){
 const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;placeScene();camera.updateProjectionMatrix();
}
resize();addEventListener('resize',resize);
let overlays=[[],[]],cut=false,span=[-W/2,W/2],pieceSpan=[W/2,W/2],inspection=0;
function localPoint(x,s,q){
 const p=sim.surface(x,s,q);p.wet=sim.sample(x,s,'moisture');if(st.stage==='unfold'){const k=1-smooth(clamp(st.stageAge/1.25,0,1));p.y+=k*(.07+s*.18);p.z-=k*s*.09;}return p;
}
function layer(x,s){
 const edge=Math.max(0,Math.min(W/2-Math.abs(x),s,D-s));
 const h=sim.sample(x,s,'crumb')-sim.sample(x,s,'dent')-.035*Math.exp(-edge/.063),c=sim.sample(x,s,'cream');
 return {h,c};
}
function makeCake(isPiece){
 const g=tag(A.group(world),isPiece?'slice':'cake'),fs=[];
 const range=()=>isPiece?pieceSpan:span;
 function xs(u,v){const bounds=range(),s=v*D;
   const corner=.13,dist=Math.min(s,D-s);const inset=dist<corner?corner-Math.sqrt(Math.max(0,corner*corner-(corner-dist)**2)):0;
   const l=bounds[0]+(bounds[0]===-W/2?inset:0),r=bounds[1]-(bounds[1]===W/2?inset:0);
   return {x:l+(r-l)*u,s};}
 function face(type,nx,ny,mat,flip=false){
   fs.push(grid(g,mat,nx,ny,(u,v)=>{
     const {x,s}=xs(u,v),{h,c}=layer(x,s);
     const q=type==='bottom'?0:type==='cream'?h+c:h;
     const p=localPoint(x,s,q);p.u=x/W+.5;p.v=s/D;p.cover=c;
     const edge=Math.min(W/2-Math.abs(x),s,D-s);
     p.brown=Math.exp(-Math.max(0,edge)/.093)*(.65+.26*Math.sin(x*11+s*7));
     return p;
   },flip,type==='cream'));
 }
 face('top',37,53,skinMat);face('bottom',19,49,crumbMat,true);face('cream',41,61,creamMat);
 for(const end of [0,1]){
   for(const type of ['crumb','crust','cream']){
     const m=type==='crumb'?crumbMat:type==='crust'?skinMat:creamMat;
     fs.push(grid(g,m,57,3,(v,f)=>{
       const {x,s}=xs(end,v),{h,c}=layer(x,s);
       const q=type==='crumb'?(h-.021)*f:type==='crust'?h-.021+.021*f:h+c*f;
       const p=localPoint(x,s,q);p.u=s/D;p.v=f*.44;p.cover=c;
       if(type==='cream'&&isPiece&&st.lift>.25){
        for(const f of overlays[end]){const berry=st.fruit[f.i];p.tint=Math.max(p.tint||0,f.through*Math.exp(-2*((s-berry.s)/berry.rs)**2)*st.lift);}
       }return p;
     },end===0,type==='cream'));
   }
 }
 for(const end of [0,1])for(const type of ['crumb','crust','cream']){
   const m=type==='crumb'?crumbMat:type==='crust'?skinMat:creamMat;
   fs.push(grid(g,m,37,3,(u,f)=>{const {x,s}=xs(u,end),{h,c}=layer(x,s);
     const q=type==='crumb'?(h-.024)*f:type==='crust'?h-.024+.024*f:h+c*f;
     const p=localPoint(x,s,q);p.u=x/W+.5;p.v=f*.38;p.cover=c;return p;
   },end===0,type==='cream'));
 }
 const cap=A.group(g);
 return {g,fs,cap};
}
const whole=makeCake(false),piece=makeCake(true);piece.g.visible=false;
function updateCake(){overlays=pieceSpan.map(x=>sim.section(x,pieceSpan[1]-pieceSpan[0]).filter(f=>f.through&&st.fruit[f.i].x>=pieceSpan[0]&&st.fruit[f.i].x<=pieceSpan[1]));for(const f of whole.fs)f.update();if(cut)for(const f of piece.fs)f.update();}
const berrySurface=A.mat(0xffffff,.26,{side:T.DoubleSide,vertexColors:true});
let berryGroups=[],knownBatch=0;
function fruitMesh(b,onPiece){
 const root=onPiece?piece.g:whole.g,g=A.group(root),fs=[];
 function point(x,phi,k,cap){
   const t=clamp((x-b.x)/b.rx,-1,1),radius=Math.sqrt(Math.max(0,1-t*t))*k;
   const s=b.s+Math.sin(phi)*radius*b.rs;
   const {h,c}=layer(x,s);
   const q=h+c-b.sink+b.fall+b.h*.46+Math.cos(phi)*radius*b.h;
   const p=localPoint(x,s,q);
   return p;
 }
 function bounds(){const r=onPiece?pieceSpan:span;return [Math.max(b.x-b.rx,r[0]),Math.min(b.x+b.rx,r[1])];}
 const outer=grid(g,berrySurface,15,27,(u,v)=>{const [l,r]=bounds();return point(l+(r-l)*u,v*Math.PI*2,1,false);});
 const color=new Float32Array(15*27*3);
 for(let j=0;j<27;j++)for(let i=0;i<15;i++){
  const k=(j*15+i)*3,mid=Math.max(0,1-Math.abs(i/14-.5)*3.7)*Math.max(0,Math.cos(j/26*2*Math.PI));
  color[k]=.72+mid*.26;color[k+1]=.027+mid*.24;color[k+2]=.027+mid*.15;
 }
 outer.o.geometry.setAttribute('color',new T.BufferAttribute(color,3));fs.push(outer);
 for(const side of [0,1]){
  const face=grid(g,berrySurface,5,27,(u,v)=>point(bounds()[side],v*Math.PI*2,u,true),side===1);
  const a=new Float32Array(5*27*3);
  for(let j=0;j<27;j++)for(let i=0;i<5;i++){const n=(j*5+i)*3,m=1-i/4;a[n]=.94;a[n+1]=.076+.28*m*m;a[n+2]=.068+.16*m*m;}
  face.o.geometry.setAttribute('color',new T.BufferAttribute(a,3));fs.push(face);
 }
 return {g,update(){const [l,r]=bounds();g.userData.kind=st.stage==='fruit'?'berry':null;g.visible=!b.held&&(r>l+.00001)&&(!onPiece||cut);if(!g.visible)return;for(const f of fs)f.update();}};
}
function updateFruit(){
 if(knownBatch!==st.batch){for(const pair of berryGroups)for(const item of pair){item.g.traverse(o=>{if(o.isMesh)o.geometry.dispose();});item.g.removeFromParent();}berryGroups=[];knownBatch=st.batch;}
 for(let i=berryGroups.length;i<st.fruit.length;i++)berryGroups.push([fruitMesh(st.fruit[i],false),fruitMesh(st.fruit[i],true)]);
 for(const pair of berryGroups)for(const o of pair)o.update();
}
const carried=compact(A.berry(world,1));carried.scale.set(.85,1,.92);tag(carried,'berry');
const flecks=A.group(world);const crumbGeo=new T.IcosahedronGeometry(1,0),crumbCol=A.mat(0xd4a061,.88);
for(let i=0;i<67;i++){
 const front=i%3===0,side=i%3===1?1:-1;
 const x=front?(A.rand()-.5)*5:side*(W/2+.025+A.rand()*.23);
 const z=front?D/2+.04+A.rand()*.19:(A.rand()-.5)*D;
 const c=A.mesh(crumbGeo,crumbCol,flecks,x,.22+A.rand()*.012,z);const a=.009+A.rand()**2*.026;c.scale.set(a*1.35,a*.6,a*.84);c.rotation.set(A.rand()*2,A.rand()*6,A.rand()*4);
}compact(flecks);
const dust=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),A.mat(0xf9ead4,.9,{transparent:true,opacity:.28,depthWrite:false}),st.crumbs.length);world.add(dust);const dustPose=new T.Object3D();
const blind=A.mat(0xb39773,.53);
for(let i=0;i<11;i++){const slat=A.box(world,blind,0,5.75+i*.085,-6.65,16,.046,.22);slat.rotation.x=-.34;}
const pots=A.group(world);
for(let i=0;i<2;i++){
 const base=A.group(pots,-3.6+i*.92,1.23,-6.35);A.turned(base,A.mat(i?0xdac1a2:0x9baaa1,.52),[[.01,0],[.24,0],[.33,.46],[.34,.49],[.30,.51],[.28,.47]],36);
 for(let j=0;j<12;j++){const a=j*2.4,l=.26+A.rand()*.28;A.rod(base,A.mat(0x65794b,.69),[0,.44,0],[Math.sin(a)*l,.5+l,Math.cos(a)*l],.013);const o=A.oval(base,A.mat(j%3===1?0x829159:0x647e52,.65),Math.sin(a)*l,.51+l,Math.cos(a)*l,.12,.026,.23);o.rotation.set(.7,a,.51);}
}compact(pots);
const tea=A.group(world,2.76,-.18,-4.36),enamel=A.mat(0xd1d4bd,.28);
A.turned(tea,enamel,[[.01,0],[.246,0],[.292,.04],[.306,.59],[.31,.615],[.294,.625],[.279,.60],[.268,.14],[.01,.13]],64);
A.brim(tea,A.stripe,0,.616,0,.301,.014);
A.tube(tea,enamel,[[.28,.49,0],[.48,.48,0],[.51,.32,0],[.46,.18,0],[.28,.17,0]],.045);
A.oval(tea,A.mat(0x84522f,.13),0,.535,0,.277,.013,.277);compact(tea);
const mist=A.mat(0xfff8e7,.96,{transparent:true,opacity:.038,side:T.DoubleSide,depthWrite:false});
mist.onBeforeCompile=sh=>{sh.vertexShader='varying vec2 veilUV;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nveilUV=uv;');sh.fragmentShader='varying vec2 veilUV;\n'+sh.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=sin(veilUV.y*3.14159)*pow(sin(veilUV.x*3.14159),2.);');};
const wisps=st.vapor.map((_,i)=>{const strip=grid(tea,mist,7,12,(u,v)=>{const p=st.vapor[i][Math.round(v*11)];return {x:p.x+(u-.5)*(.08+v*.18),y:.56+p.y,z:p.z+.029*Math.cos(u*3.14+i)};});strip.o.castShadow=false;return strip;});
function sleeve(hand,child){
 const m=A.mat(child?0xddb768:0x7e9aa3,.85);m.side=T.DoubleSide;
 const q=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),dir=new T.Vector3(),normal=new T.Vector3(),up=new T.Vector3(0,1,0),side=new T.Vector3();
 let start,end,sc;
 const strip=grid(world,m,23,12,(u,v)=>{
   q.copy(start).lerp(end,v);q.y+=Math.sin(v*Math.PI)*.12;
   const ang=u*2*Math.PI,rad=sc*(.38+v*.19+.013*Math.cos(ang*13+v*2));
   q.addScaledVector(side,rad*Math.cos(ang)).addScaledVector(normal,rad*Math.sin(ang));
   return q;
 });
 return ()=>{hand.updateWorldMatrix(true,false);sc=hand.scale.x;
   start=a.set(.13,.48,-2.60).applyMatrix4(hand.matrixWorld);
   end=b.set(child?-3.3:7.3,child?.28:1.64,child?10.1:-5.93);
   dir.subVectors(end,start).normalize();side.crossVectors(dir,up).normalize();normal.crossVectors(side,dir).normalize();
   strip.update();
 };
}
const adultSleeve=sleeve(dad,false),childSleeve=sleeve(girl,true);
const P=new T.Vector3();
const location=(v)=>new T.Vector3(...v);
const view={eye:new T.Vector3(),focus:new T.Vector3(),ready:false};
function setView(dt){
 const aspect=camera.aspect,narrow=portrait;
 const peek=st.stage==='lift'||st.stage==='serve'||st.stage==='passing'?st.lift*(1-smooth(st.serve)):0;
 inspection+=(peek-inspection)*(1-Math.exp(-dt*3.7));
 const width=narrow?5.99:Math.min(12.3,9.76*Math.max(1,aspect/1.68));
 const dist=width/aspect/(2*Math.tan(camera.fov*Math.PI/360));
 const angle=(narrow?.87:.81)-inspection*.115,yaw=narrow?.092:.248;
 const target=new T.Vector3(0,.03+(narrow?.14:0),narrow?-.37:-.12);target.x+=inspection*.10;
 const dv=new T.Vector3(Math.sin(yaw)*Math.cos(angle),Math.sin(angle),Math.cos(yaw)*Math.cos(angle)).multiplyScalar(dist);
 camera.position.copy(target).add(dv);camera.lookAt(target);camera.updateMatrixWorld();
}
let lastStage='',lastVisual=-10,lastRoll=-1,refresh=0;
const P0=new T.Vector3(),P1=new T.Vector3();
const approach=(a,b,t)=>a+(b-a)*t;
const spPos=new T.Vector3(),girlGoal=new T.Vector3(),dadGoal=new T.Vector3();
function geometryState(){
 const splitStages=['server','lift','serve','passing'];
 cut=splitStages.includes(st.stage)||(st.stage==='cutting'&&st.blade>.87);
 span=[-W/2,W/2];pieceSpan=[W/2,W/2];
 if(cut){if(st.side>0){span[1]=st.cutX;pieceSpan=[st.cutX,W/2];}else{span[0]=st.cutX;pieceSpan=[-W/2,st.cutX];}}
 piece.g.visible=cut;
 const k=smooth(st.lift),pass=smooth(st.serve);
 const mid=(pieceSpan[0]+pieceSpan[1])*.5;
 const axisZ=D/2-st.roll,radius=Math.sqrt(.265**2+.332*st.roll/Math.PI);const pivot=new T.Vector3(mid,BASE+radius,axisZ);
 const trayX=portrait?-.46:-1.15,trayZ=portrait?2.12:1.12;
 serving.position.set(trayX+pass*9.7,.181+pass*.42,trayZ-pass*3.8);
 serving.visible=cut&&st.lift>.007;
 if(serving.visible){const enter=smooth(clamp(st.lift*3.4,0,1));serving.position.x-=(1-enter)*5.5;}
 const liftedPoint=new T.Vector3(approach(mid,trayX,k)+st.side*Math.sin(k*Math.PI)*.43,approach(BASE+radius,.263+(pieceSpan[1]-pieceSpan[0])*.5,k)+Math.sin(k*Math.PI)*.93,approach(axisZ,trayZ,k));
 liftedPoint.add(new T.Vector3(pass*9.7,pass*.42,-pass*3.8));
 piece.g.rotation.set(0,-st.side*k*.33,-st.side*k*Math.PI*.49,'YXZ');
 piece.g.position.copy(liftedPoint).sub(pivot.clone().applyQuaternion(piece.g.quaternion));
 const shift=st.stage==='passing'?smooth(clamp((pass-.43)/.57,0,1))*10.5:st.stage==='unfold'?-9.8*(1-smooth(clamp(st.stageAge/1.25,0,1))):0;
 for(const support of [board,paper,whole.g,flecks])support.position.x=shift;
 return liftedPoint;
}
function arrange(dt){
 const stage=st.stage,narrow=portrait,stageChange=lastStage!==stage;
 sun.intensity=2.92+(st.light-.76)*2.2;
 sun.position.x=-4.6+st.draft*.14;
 const bowlPosition=st.bowl*(1-smooth(st.serve));
 fruitBowl.position.set(layout.bowl[0]-bowlPosition*(narrow?.08:.27),-.18+Math.sin(bowlPosition*Math.PI)*.073,layout.bowl[1]+bowlPosition*(narrow?.43:.58));
 fruitBowl.rotation.y=-.38+st.bowl*.08;
 const k=stage==='unfold'?1-smooth(clamp((st.stageAge-.48)/.77,0,1)):smooth(st.returning),t=st.tool;
 const q=layer(t.x,t.s),under=localPoint(t.x,t.s,q.h+q.c);
 spPos.set(under.x,under.y+.24*(1-st.drip)+.042+Math.max(0,.09-st.creamWork*.18),under.z);
 const rest=location([dish.position.x-.37,.052,dish.position.z+.06]);
 spat.position.copy(spPos).lerp(rest,k);spat.position.y+=Math.sin(k*Math.PI)*.37;
 spat.rotation.order='YXZ';spat.rotation.set(-.235+t.flex*.8,approach(1.91,1.13,k),-.077+t.flex*.4);
 const drop=1-smooth(clamp((st.drip-.12)/.76,0,1));
 drip.visible=stage==='cream'&&drop>.005;
 drip.position.set(under.x,under.y+.036+drop*.17,under.z);drip.scale.set(.054*drop,.11*(.5+drop),.054*drop);
 const pending=sim.getPending();carried.visible=!!pending;for(const pile of heapMeshes)pile.count=Math.max(0,13-st.fruit.length-(pending&&pending.index<0?1:0));
 if(pending){const x=pending.x,s=pending.s;carried.position.set(x,BASE+.65,D/2-s);carried.rotation.set(-.14,.27,.1);}
 const lifted=geometryState();
 const knifeAction=['cut','cutting','server','lift','serve','passing'].includes(stage);
 const knifeIn=knifeAction?(stage==='cut'?smooth(clamp(st.stageAge/.88,0,1)):1):0;
 const bladeX=stage==='cut'?-.1:st.cutX;
 const cutTop=BASE+Math.sqrt(.265**2+.332*D/Math.PI)*2;
 const cutEnd=smooth(clamp((st.blade-.82)/.18,0,1));
 const knifeRest=location([narrow?.74:1.36,-.094,narrow?-3.87:-3.04]);
 const knifeTarget=location([bladeX,cutTop+.16-st.blade*(cutTop-.16)+cutEnd*.74,D/2-D+.56]);
 knifeTarget.z-=cutEnd*.52;
 let knifeHold=knifeIn*(1-smooth(clamp(st.lift*2.6,0,1)));
 knife.position.lerp(P0.copy(knifeRest).lerp(knifeTarget,knifeHold),1-Math.exp(-dt*12));
 knife.rotation.order='YXZ';knife.rotation.set(-.06,approach(1.93,Math.PI,knifeHold),approach(.04,-1.43,knifeHold));
 const serverHome=location([layout.server[0],-.123,layout.server[1]]);
 server.position.copy(serverHome);server.rotation.order='YXZ';server.rotation.set(-.053,narrow?.34:-.47,-.045);
 if(cut){const u=smooth(clamp(st.lift*3.3,0,1)),back=smooth(clamp((st.lift-.77)/.23,0,1));
   const h=location([lifted.x,lifted.y-.44,lifted.z-.31]);server.position.lerp(h,u*(1-back));server.rotation.y=approach(server.rotation.y,2.14,u*(1-back));}
 const reach=1-Math.exp(-dt*5);
 dadGoal.set(narrow?.86:1.04,.173,-D/2-.49);
 dad.rotation.y=-.42;
 if(knifeHold){P0.set(0,.12,1.56).applyQuaternion(knife.quaternion).add(knife.position);P0.y+=.095;dadGoal.lerp(P0,knifeHold);}
 if(st.stage==='passing'){dadGoal.lerp(P0.copy(serving.position).add(location([.55,.22,-.19])),smooth(st.serve));}
 dad.position.lerp(dadGoal,reach);
 girlGoal.set(narrow?-1.72:-2.21,-.14,narrow?4.35:3.33);girl.rotation.y=Math.PI-.22;
 const phase=Math.max(0,st.idle-4),cycle=phase%7.5;
 if(phase>0&&cycle<4.2&&!st.dragging){
   const show=smooth(clamp(cycle/.86,0,1))*(1-smooth(clamp((cycle-3.15)/1.05,0,1)));
   const motion=smooth(clamp((cycle-.9)/1.8,0,1));const aim=new T.Vector3();
   if(stage==='cream'){
     aim.copy(spPos);if(st.creamWork>.4){aim.lerp(rest,motion);}else{aim.x+=motion*.85;aim.z-=motion*.35;}
   }else if(stage==='fruit'&&!st.fruit.length){aim.copy(fruitBowl.position);aim.y+=.67;aim.lerp(location([.51,BASE+.46,.77]),motion);}
   else if(stage==='roll'||stage==='fold'||stage==='fruit'){aim.set(-.47,BASE+.09+motion*.42,D/2+.19-st.roll-motion*.72);}
   else if(stage==='cut'){aim.set(.59,cutTop+.12,D/2-D+.05);}
   else if(stage==='server')aim.copy(server.position).add(location([-.12,.26,.53]));
   else if(stage==='serve')aim.copy(serving.position).add(location([-.42,.25,.4-motion*.33]));
   else aim.copy(girlGoal);
   aim.z+=.34;aim.x-=.22;aim.y+=.025+Math.sin(motion*Math.PI)*.075;girlGoal.lerp(aim,show);
 }
 girl.position.lerp(girlGoal,1-Math.exp(-dt*6.6));
 adultSleeve();childSleeve();
 tea.position.x=portrait?2.29:3.32;tea.position.z=portrait?-4.8:-3.81;
 for(const w of wisps)w.update();
 for(let i=0;i<st.crumbs.length;i++){const b=st.crumbs[i];dustPose.position.set(b.x,b.y,b.z);dustPose.scale.setScalar(.004+.006*noise(i));dustPose.updateMatrix();dust.setMatrixAt(i,dustPose.matrix);}
 dust.instanceMatrix.needsUpdate=true;
 const active=stage==='cream'||stage==='return'||stage==='unfold'?0:stage==='fruit'?1:stage==='roll'||stage==='fold'?2:3;
 if(stageChange){document.querySelectorAll('.token').forEach((e,i)=>{e.classList.toggle('active',i===active);e.classList.toggle('done',i<active);});lastStage=stage;
   if(stage==='fruit')sound.burst(850,.085,.12,true);
   if(stage==='roll')sound.burst(3400,.17,.07);
   if(stage==='server')sound.burst(1060,.053,.09,true);
   if(stage==='serve')sound.burst(1340,.11,.16,true);
 }
 const winding=Math.abs(lastRoll-st.roll)>.0003;
 if(stageChange||st.time-lastVisual>(st.dragging||winding||stage==='unfold'||st.drip<1?.028:.11)){
   updateCake();updateFruit();sheet.update();lastRoll=st.roll;lastVisual=st.time;
 }
}
// Screen coordinates are used only to cast into the workshop.
const ray=new T.Raycaster(),mouse=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),-(BASE+.26));
let pointer=null;
function rayAt(e){
 const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(mouse,camera);
}
function hit(e){
 rayAt(e);const atPlane=ray.ray.intersectPlane(plane,new T.Vector3())||new T.Vector3();
 const targets=[spat,fruitBowl,dish,server,paper,whole.g,piece.g,serving];
 if(st.dragging==='spread'&&ray.intersectObject(dish,true).length)return {kind:'dish',x:atPlane.x,s:D/2-atPlane.z};
 const hits=ray.intersectObjects(targets.filter(o=>o.visible),true);
 for(const h of hits){
   let node=h.object,kind=null;while(node&&!kind){kind=node.userData.kind;node=node.parent;}
   if(!kind)continue;
   const s=D/2-h.point.z;
   if(st.stage==='serve'&&kind==='slice')return {kind:'slice',x:h.point.x,s};
   if(st.stage==='fruit'&&st.fruit.length&&kind==='cake'&&s<.24)kind='lip';
   if(kind==='paper'&&st.stage==='fruit'&&s>.33)kind='inert';
   return {kind,x:h.point.x,s};
 }
 return {kind:'inert',x:atPlane.x,s:D/2-atPlane.z};
}
function planeCoord(e){rayAt(e);const p=ray.ray.intersectPlane(plane,new T.Vector3());return p?{x:p.x,s:D/2-p.z}:{x:0,s:0};}
canvas.addEventListener('pointerdown',e=>{
 if(pointer!==null||e.button>0)return;sound.unlock();const a=hit(e);
 let s=a.s,x=a.x;
 if(st.stage==='cut'&&a.kind==='slice')a.kind='cake';
 if(a.kind==='spatula'&&st.stage==='cream'){x=st.tool.x;s=st.tool.s;}
 if(st.stage==='server'&&a.kind==='slice')a.kind='cake';
 if(sim.down(a.kind,x,s)){
   pointer=e.pointerId;canvas.setPointerCapture(pointer);
   if(a.kind==='bowl')sound.burst(1240,.082,.095,true);
   if(st.dragging==='roll')sound.burst(3270,.2,.11);
 }
});
canvas.addEventListener('pointermove',e=>{
 if(e.pointerId===pointer){const p=planeCoord(e);sim.move(p.x,p.s);}
});
function release(e,cancel=false){if(e.pointerId!==pointer)return;
 const p=planeCoord(e),a=cancel?{kind:'inert'}:hit(e),was=st.dragging;
 sim.up(cancel?W*2:p.x,p.s,a.kind);
 if(was==='fruit'&&!cancel&&a.kind==='cake')sound.burst(310,.23,.095,true);
 if(st.stage==='return')sound.burst(1110,.11,.13,true);
 if(canvas.hasPointerCapture(pointer))canvas.releasePointerCapture(pointer);pointer=null;
}
canvas.addEventListener('pointerup',e=>release(e));canvas.addEventListener('pointercancel',e=>release(e,true));
canvas.addEventListener('lostpointercapture',()=>{if(pointer!==null){pointer=null;sim.up(W*3,0,'inert');}});
const soundButton=document.querySelector('#sound');
soundButton.addEventListener('click',()=>{const enabled=sound.toggle();soundButton.classList.toggle('muted',!enabled);soundButton.setAttribute('aria-pressed',String(enabled));});
let glaze=null;
function finishing(){
 const rt=new T.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true,samples:Math.min(2,renderer.capabilities.maxSamples)});
 const quadScene=new T.Scene(),quadCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const m=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{frame:{value:rt.texture},pixel:{value:new T.Vector2()}},
 vertexShader:'varying vec2 at;void main(){at=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform sampler2D frame;uniform vec2 pixel;varying vec2 at;
 void main(){vec3 c=texture2D(frame,at).rgb;vec3 halo=vec3(0.);
 for(int j=0;j<8;j++){float a=float(j)*.785398;vec3 n=texture2D(frame,at+vec2(cos(a),sin(a))*pixel*3.5).rgb;halo+=max(n-vec3(1.15),vec3(0.));}
 gl_FragColor=vec4(c+halo*.0025,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.0032;
 }`});
 quadScene.add(new T.Mesh(new T.PlaneGeometry(2,2),m));glaze={rt,quadScene,quadCam,m};
}
function draw(){if(!glaze){renderer.render(scene,camera);return;}
 const {rt,quadScene,quadCam,m}=glaze;
 if(rt.width!==canvas.width||rt.height!==canvas.height){rt.setSize(canvas.width,canvas.height);m.uniforms.pixel.value.set(1/canvas.width,1/canvas.height);}
 renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(quadScene,quadCam);
}
function realReflection(){
 const rt=new T.WebGLCubeRenderTarget(96,{type:T.HalfFloatType});
 const cube=new T.CubeCamera(.10,35,rt);cube.position.copy(server.position);cube.position.y+=.32;
 server.visible=false;dust.visible=false;const auto=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;
 cube.update(renderer,scene);renderer.shadowMap.autoUpdate=auto;server.visible=true;dust.visible=true;
 A.steel.envMap=rt.texture;A.steel.envMapIntensity=1.38;A.steel.needsUpdate=true;
 finishing();
}
let last=performance.now();
sim.step(.36);setView(1);dad.position.set(1,.173,-D/2-.49);girl.position.set(-2,-.14,portrait?4.35:3.33);
knife.position.set(1.3,-.094,-3.04);arrange(.016);draw();
function loop(now){const dt=Math.min(.055,Math.max(.001,(now-last)/1000));last=now;
 sim.step(dt);setView(dt);arrange(dt);sound.update(st,dt);draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
function refineSurfaces(){if(st.dragging||A.refine())setTimeout(refineSurfaces,85);}
setTimeout(refineSurfaces,70);
setTimeout(()=>{if('requestIdleCallback'in window)requestIdleCallback(realReflection,{timeout:2200});else realReflection();},1300);
})();
