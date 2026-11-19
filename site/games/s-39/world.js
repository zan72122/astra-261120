'use strict';
function makeWorkshop(canvas,game){
 const T=THREE,C=Craft, V=(x,y,z)=>new T.Vector3(x,y,z),mat=C.mat,rnd=C.rand;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.8,Math.sqrt(1850000/(innerWidth*innerHeight))));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(36,1,.08,120);
 scene.background=new T.Color(0xd8dcd4);scene.fog=new T.FogExp2(0xd9d9cd,.022);
 function group(parent=scene){const o=new T.Group();parent.add(o);return o;}
 function mesh(g,m,parent=scene,x=0,y=0,z=0,shadow=true){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;}
 function box(w,h,d,m,p,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);}
 const sphereGeo=new T.SphereGeometry(1,28,20),smallSphere=new T.SphereGeometry(1,12,10);
 function ball(p,m,x,y,z,a,b=a,c=a,small=false){let o=mesh(small?smallSphere:sphereGeo,m,p,x,y,z);o.scale.set(a,b,c);return o;}
 function rod(p,m,a,b,r1,r2=r1,n=16){let v=b.clone().sub(a),o=mesh(new T.CylinderGeometry(r2,r1,v.length(),n),m,p);o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(V(0,1,0),v.normalize());return o;}
 function tube(p,m,pts,r=.015,segments=16){const curve=new T.CatmullRomCurve3(pts.map(v=>V(...v)));return mesh(new T.TubeGeometry(curve,segments,r,7,false),m,p);}
 function lathe(p,m,profile,x=0,y=0,z=0,n=72){return mesh(new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),n),m,p,x,y,z);}
 function surface(p,m,v,ind,uv){let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ind);if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return mesh(g,m,p);}
 function board(p,m,w,d,h,r,x,y,z){
   let s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
   const edge=Math.min(.035,h*.23),g=new T.ExtrudeGeometry(s,{depth:h-2*edge,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:edge,bevelThickness:edge,curveSegments:5});g.rotateX(-Math.PI/2);return mesh(g,m,p,x,y+edge,z);
 }
 const timber=mat(0x806043,.54,'wood'),dark=mat(0x493b31,.50,'wood'),honey=mat(0xbb8654,.52,'wood'),bamboo=mat(0xd6ac71,.41,'wood');
 const cream=mat(0xede4cc,.81,'clay'),ink=mat(0x364e51,.84,'cloth'),iron=mat(0x3c3732,.52,'copper',{metalness:.42});
 const sun=new T.DirectionalLight(0xffedcf,3.0);sun.position.set(-5.8,9.8,-4.8);sun.target.position.set(0,.2,.8);scene.add(sun,sun.target);sun.castShadow=true;
 const sh=sun.shadow;sh.mapSize.set(2048,2048);Object.assign(sh.camera,{left:-9,right:9,top:8,bottom:-8,near:.3,far:30});sh.normalBias=.018;sh.bias=-.00035;sh.radius=3;
 scene.add(new T.HemisphereLight(0xe7e6db,0xc3a485,1.0));
 C.environment(scene,renderer);
 // The open shop front, with deep eaves, a paper screen, winter garden and temple gate.
 const refine=[];
 const outside=group(), garden=mat(0xcbd2c9,.96,'clay'), roof=mat(0x576267,.75,'clay'), snow=mat(0xe2e6dc,.89,'clay');
 box(80,.4,46,garden,outside,0,-1.75,-23);
 function ridge(z,y,color,wave){
   let vs=[],ix=[];for(let i=0;i<=75;i++){let x=i*.9-34,top=y+Math.sin(x*.19+wave)*1.3+Math.sin(x*.43)*.43+.13*Math.sin(x*2.2);vs.push(x,-4,z,x,top,z);if(i)ix.push(i*2-2,i*2,i*2-1,i*2-1,i*2,i*2+1);}
   surface(outside,mat(color,1,'',{side:T.DoubleSide}),vs,ix);
 }
 ridge(-32,4.4,0x9daead,1.8);ridge(-25,2.2,0xa8b5a9,3);
 const ced=mat(0x6a7969,.9,'leaf'),twig=mat(0x675641,.88,'wood');
 for(const [x,z,k] of [[-7,-13,1.4],[4.5,-13,1.2],[9,-12,1.7],[-1,-19,1.6],[-11,-15,1.6]]){
   const g=group(outside);g.position.set(x,-1.55,z);g.scale.setScalar(k);
   rod(g,twig,V(0,0,0),V(.1,3.8,0),.20,.07);
   for(let i=0;i<12;i++){let y=1+i*.27,a=i*2.36,w=(1-i/14)*1.4,xx=Math.cos(a)*w*.72,zz=Math.sin(a)*w*.65;rod(g,twig,V(.05,y-.40,0),V(xx,y,zz),.09,.035);ball(g,ced,xx,y,zz,w,.30,w*.65,true);ball(g,snow,xx-.035,y+.15,zz,w*.95,.16,w*.60,true);}
 }
 function tiledRoof(p,w,d,y){
   for(let side of [-1,1]){
     const v=[],ix=[];let nx=24,nz=8;
     function point(x,t){return [x,y+1.38*(1-t)**1.7+.24*Math.pow(Math.abs(x)/(w/2),5)*t,side*d*.5*t];}
     for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){v.push(...point((i/nx-.5)*w,j/nz));if(i&&j){let a=i*(nz+1)+j;ix.push(a,a-1,a-nz-2,a,a-nz-2,a-nz-1);}}
     const m=mat(0x646e6c,.78,'clay',{side:T.DoubleSide});surface(p,m,v,ix);
     refine.push(()=>{for(let i=0;i<=36;i++){const x=(i/36-.5)*w;tube(p,roof,Array.from({length:5},(_,j)=>{let a=point(x,j/4);a[1]+=.045;return a}),.048,7);}});
     tube(p,snow,Array.from({length:9},(_,j)=>point((j/8-.5)*w,1)),.065,12);
   }
   rod(p,roof,V(-w*.51,y+1.4,0),V(w*.51,y+1.4,0),.12);
 }
 const gate=group(outside);gate.position.set(1.3,-1.55,-13.7);gate.rotation.y=-.16;
 const verm=mat(0x976e54,.76,'wood');for(let x of [-2.45,2.45]){rod(gate,verm,V(x,0,0),V(x,3.5,0),.23,.20);box(.63,.37,.67,dark,gate,x,3.2,0);}
 box(6.8,.26,.45,verm,gate,0,2.72,0);box(7.1,.39,.82,verm,gate,0,3.35,0);tiledRoof(gate,8.1,3.6,3.56);
 const fence=group(outside);fence.position.set(0,-1.18,-8.9);
 box(32,.68,.3,mat(0xc8c2ad,.92,'clay'),fence,0,.42,0);box(32,.12,.49,roof,fence,0,.81,0);box(32,.065,.50,snow,fence,0,.9,0);
 // Fine winter twigs beyond the sill.
 function branch(p,a,b,r,level,blossoms){
   rod(p,twig,a,b,r,r*.58,7);
   if(level<=0){if(blossoms)flower(p,b,blossoms);return;}
   let d=b.clone().sub(a);
   for(let j=0;j<2;j++){let st=a.clone().lerp(b,j?.68:1),v=d.clone().multiplyScalar(.62+rnd()*.16);v.x+=(j?1:-1)*(.17+rnd()*.4);v.z+=(rnd()-.5)*.50;v.y*=.73+rnd()*.43;branch(p,st,st.clone().add(v),r*.58,level-1,blossoms);}
 }
 branch(outside,V(-3,-1.48,-7.3),V(-3.25,.55,-7.1),.12,4,false);
 const back=group();box(30,.24,.60,dark,back,0,.12,-3.83);box(30,.12,.68,timber,back,0,.29,-3.83);
 for(let x of [-8.7,-4.95,5.0,8.8])box(.19,8,.35,timber,back,x,3.9,-3.9);
 box(28,.30,.45,dark,back,0,5.1,-3.85);
 const paper=mat(0xe5ddc4,.95,'cloth');box(4,.04+5.0,.11,paper,back,-7,.0+2.83,-4.02);
 for(let j=0;j<7;j++)box(3.85,.055,.16,timber,back,-7,.60+j*.70,-3.91);
 for(let i=0;i<5;i++)box(.055,4.97,.17,timber,back,-8.75+i*.87,2.85,-3.9);
 // Indigo split curtain. The plum crest and sashiko hem are dyed into the woven surface.
 const curtains=[];
 for(let i=0;i<3;i++){
   const w=1.76,h=[2.30,2.40,2.24][i],g=new T.PlaneGeometry(w,h,26,12),a=g.attributes.position;
   for(let j=0;j<a.count;j++){const xx=a.getX(j),yy=a.getY(j),v=(yy+h*.5)/h;a.setXYZ(j,xx+(1-v)*.06*Math.cos(xx*2+i),yy+(1-v)*.08*Math.sin(xx*3.35+i*.9),.095*Math.sin(xx*8.8+i)+.04*Math.cos(xx*3+v)+.1*(1-v)**2);}
   g.computeVertexNormals();const m=mat(0xffffff,.94,'cloth',{map:C.fabric(i===1,['#3a5357','#3b5456','#374e52'][i]),side:T.DoubleSide});
   const o=mesh(g,m,back,-6.15+i*1.83,4.93-h/2,-3.58);curtains.push(o);
 }
 // The broad counter is joined from individual oil-finished Japanese hardwood planks.
 const table=group();box(25,.47,10.2,dark,table,0,-.28,.85);
 const colors=[0xae8861,0xb49068,0xb4906b,0xb8946e,0xb08b65,0xb59370,0xb08a67,0xad8967,0xac8765];
 for(let i=0;i<9;i++)board(table,mat(colors[i],.58,'wood'),24,1.117,.115,.015,0,-.115,-3.67+i*1.135);
 // A small woven runner anchors the far end of the serving tray.
 const textile=group(),linen=mat(0x535f60,.93,'cloth',{side:T.DoubleSide}),stitch=mat(0xcbc3a6,.94,'cloth');
 textile.position.set(3,.015,1.1);textile.rotation.y=-.18;
 board(textile,linen,3.90,3.24,.028,.055,0,0,0);
 for(let side of [-1,1]){
   for(let j=0;j<3;j++)box(3.76,.004,.016,stitch,textile,0,.033,side*(1.42+j*.041));
   for(let j=0;j<38;j++){let x=(j/37-.5)*3.79;rod(textile,linen,V(x,.025,side*1.63),V(x+(rnd()-.5)*.05,.013,side*(1.67+rnd()*.07)),.010,.007,5);}
 }
 // The carved channel is actual concave geometry, including its end grain.
 const rail=group();rail.position.set(.10,.04,1.26);rail.rotation.y=.63;
 const plank=mat(0xcfaa76,.53,'wood');
 function trough(p,length,m){
   const prof=[[-.88,.115],[-.88,.29],[-.84,.335],[-.57,.335],[-.46,.315],[-.35,.268],[-.21,.235],[0,.224],[.21,.235],[.35,.268],[.46,.315],[.57,.335],[.84,.335],[.88,.29],[.88,.115],[.82,.09],[-.82,.09]];
   const vs=[],ix=[],n=prof.length;
   for(let k=0;k<2;k++)for(let [z,y] of prof)vs.push((k-.5)*length,y,z);
   for(let i=0;i<n;i++){let j=(i+1)%n;ix.push(i,j,n+j,i,n+j,n+i);}
   let caps=T.ShapeUtils.triangulateShape(prof.map(([z,y])=>new T.Vector2(z,y)),[]);for(let [a,b,c] of caps)ix.push(c,b,a,n+a,n+b,n+c);
   m.side=T.DoubleSide;return surface(p,m,vs,ix);
 }
 trough(rail,5.92,plank);
 // A slotted wooden lip keeps the exposed bamboo level with the center of the dough.
 const guideLip=group(rail);guideLip.position.set(-2.56,.29,0);
 board(guideLip,honey,.30,.70,.22,.042,0,0,0);
 for(let sign of [-1,1]){
   const cheek=board(guideLip,plank,.27,.19,.30,.046,0,.18,sign*.19);
   cheek.rotation.x=sign*-.13;
 }
 for(let x of [-2.13,2.13])board(rail,honey,.43,1.69,.1,.055,x,0,0);
 const stop=group();stop.position.set(2.08,.30,0);
 const stopMat=mat(0x765438,.49,'wood');board(stop,stopMat,.51,1.06,.24,.07,0,0,0);
 // Two tapered cheeks receive the bamboo point between them.
 for(let z of [-.27,.27]){let o=box(.44,.40,.25,stopMat,stop,0,.37,z);o.rotation.x=z>0?-.22:.22;ball(stop,stopMat,0,.56,z,.224,.085,.128);}
 const food=group(),skewer=group(food),foodBalls=[];
 const doughGeo=new T.SphereGeometry(1,60,42),raw=doughGeo.attributes.position;
 for(let i=0;i<raw.count;i++){const x=raw.getX(i),y=raw.getY(i),z=raw.getZ(i),r=1+.018*Math.cos(x*5+z*3)*Math.sin(y*4-z)+.009*Math.cos(z*11+x*3+y*4);raw.setXYZ(i,x*r,y*r,z*r);}
 doughGeo.computeVertexNormals();
 for(let i=0;i<3;i++){const m=mat(0xffecc9,.45,'dough'),o=mesh(doughGeo.clone(),m,food,(i-1)*1.06,0,0);m.userData.u.wo.value=[3.12,1.07,4.48][i];o.rotation.x=[.15,-.34,.24][i];foodBalls.push(o);}
 const gripMat=mat(0xd8b883,.38,'wood');
 rod(skewer,gripMat,V(-2.34,0,0),V(1.82,0,0),.071,.049,24);rod(skewer,bamboo,V(1.82,0,0),V(2.07,0,0),.049,.005);
 rod(skewer,gripMat,V(-2.35,0,0),V(-2.10,0,0),.105,.072,24);ball(skewer,gripMat,-2.35,0,0,.073,.105,.105);
 for(let j of [-2.28,-2.23,-1.84])rod(skewer,mat(0xae8856,.51,'wood'),V(j,0,0),V(j+.015,0,0),.073,.073,20);
 const gripAnchor=group(skewer);gripAnchor.position.x=-2.30;
 // A charcoal stove and hammered copper tare pot. Both inner and outer walls have thickness.
 const stove=group(), furnace=mat(0x726353,.77,'clay'), ceramicBlack=mat(0x40362f,.56,'clay');
 lathe(stove,furnace,[[.01,.01],[.99,.01],[1.05,.1],[1.01,.25],[1.12,.46],[1.12,.51],[1.02,.54],[.95,.41],[.01,.40]]);
 for(let i=0;i<7;i++){let a=i*Math.PI*2/7;let o=ball(stove,ceramicBlack,Math.sin(a)*1.055,.23,Math.cos(a)*1.055,.136,.047,.016,true);o.rotation.y=a;}
 const pot=group(),copper=mat(0x986348,.37,'copper',{metalness:.55}),rim=mat(0x7b6551,.30,'copper',{metalness:.63});
 lathe(pot,copper,[[.02,0],[.74,0],[.99,.07],[1.18,.22],[1.35,.48],[1.42,.70],[1.44,.77],[1.39,.79],[1.36,.75],[1.29,.49],[1.14,.26],[.93,.13],[.01,.12]]);
 lathe(pot,rim,[[1.39,.717],[1.445,.727],[1.466,.762],[1.457,.80],[1.42,.823],[1.389,.805],[1.378,.77]]);
 for(let i=0;i<2;i++){let side=i?1:-1;tube(pot,iron,[[side*1.32,.52,-.23],[side*1.60,.52,-.32],[side*1.75,.63,-.17],[side*1.75,.66,.16],[side*1.60,.58,.29],[side*1.31,.52,.20]],.066,24);}
 lathe(pot,ceramicBlack,[[.001,.132],[.85,.134],[1.16,.28],[1.29,.50],[1.36,.726]]);
 const sauce=mat(0xac611f,.145,'copper',{metalness:.11,side:T.DoubleSide});
 const fieldBytes=new Uint8Array(game.N*game.N*4),field=new T.DataTexture(fieldBytes,game.N,game.N);field.magFilter=field.minFilter=T.LinearFilter;field.needsUpdate=true;
 const oldSauce=sauce.onBeforeCompile;
 sauce.onBeforeCompile=s=>{
   oldSauce(s);s.uniforms.kettleField={value:field};
   s.fragmentShader='uniform sampler2D kettleField;\n'+s.fragmentShader.replace('#include <alphatest_fragment>',`
   vec4 potState=texture2D(kettleField,clamp(vCraft.xz/2.68+.5,.001,.999));
   float ripple=grains(vec3(vCraft.x*2.1,vCraft.z*2.0,1.3));
   float swirl=sin(vCraft.z*11.+3.6*sin(vCraft.x*2.6+vCraft.z*1.2)+ripple*7.);
   float starch=(1.-potState.r)*smoothstep(.52,.99,swirl)*(.12+.24*ripple);
   diffuseColor.rgb=mix(vec3(.31,.091,.014),vec3(.58,.263,.059),ripple*.85+.12);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.77,.61,.39),starch);
   diffuseColor.rgb*=1.-.53*potState.g;
   if(potState.g>.52 && potState.r>.58)discard;
   #include <alphatest_fragment>`);
 };sauce.customProgramCacheKey=()=>'kettle';
 const liquidV=[],liquidI=[],rings=20,sectors=64;
 for(let j=0;j<=rings;j++)for(let i=0;i<=sectors;i++){const a=Math.PI*2*i/sectors,r=1.353*j/rings;liquidV.push(Math.cos(a)*r,0,Math.sin(a)*r);if(i&&j){let k=j*(sectors+1)+i;liquidI.push(k,k-sectors-1,k-sectors-2,k,k-sectors-2,k-1);}}
 const liquid=surface(pot,sauce,liquidV,liquidI);liquid.position.y=.70;
 const paddle=group(pot),paddleWood=mat(0xa67549,.44,'wood');
 const blade=lathe(paddle,paddleWood,[[.008,-.32],[.19,-.30],[.29,-.22],[.32,-.09],[.29,.1],[.20,.29],[.095,.47],[.07,.64],[.075,1.3],[.095,1.64],[.078,1.72],[.015,1.75]]);blade.scale.z=.34;
 const paddleAnchor=group(paddle);paddleAnchor.position.set(0,1.25,0);
 // Celadon serving dish and one folded sasa leaf with a raised midrib.
 const tray=group();const dish=mat(0xc8c9af,.24,'clay'),dishEdge=mat(0x897e62,.4,'clay');
 let plate=lathe(tray,dish,[[.01,.045],[.61,.045],[.70,.065],[.80,.10],[.94,.192],[1,.239],[1.012,.263],[.998,.285],[.969,.285],[.91,.24],[.76,.176],[.59,.146],[.01,.139]],0,0,0,100);plate.scale.set(2.05,1,1.05);
 let ring=lathe(tray,dishEdge,[[.991,.281],[1,.284],[1.004,.276]],0,0,0,96);ring.scale.set(2.05,1,1.05);
 const leaf=group(tray);leaf.position.y=.152;leaf.rotation.y=0;
 function leafPt(t,w){let width=Math.pow(Math.sin(Math.PI*t),.78)*(.61+.16*t);return V((t-.5)*3.68,.037+.19*(1-Math.sin(Math.PI*t))**2+.092*Math.abs(w)**1.65*Math.sin(Math.PI*t)+.023*Math.sin(16*t+w)*Math.abs(w),.135*Math.sin(5*t)+width*w);}
 const lm=mat(0x79834a,.40,'leaf',{side:T.DoubleSide}),vein=mat(0x99a16a,.52,'leaf'),fineVein=mat(0x84905c,.51,'leaf'),lv=[],li=[],ln=48,lw=12;
 for(let i=0;i<=ln;i++)for(let j=0;j<=lw;j++){let v=leafPt(i/ln,j/lw*2-1);lv.push(...v.toArray());if(i&&j){let k=i*(lw+1)+j;li.push(k,k-1,k-lw-2,k,k-lw-2,k-lw-1);}}
 const leafMesh=surface(leaf,lm,lv,li);
 tube(leaf,vein,Array.from({length:17},(_,i)=>{let p=leafPt(i/16,0);p.y+=.012;return p.toArray();}),.014,24);
 for(let i=1;i<28;i++)for(let sign of [-1,1]){const t=i/32;tube(leaf,fineVein,Array.from({length:5},(_,j)=>{let p=leafPt(t+j*.023,sign*j*.23);p.y+=.005;return p.toArray();}),.0045,5);}
 const syrup=mat(0x9a4614,.12,'clay',{metalness:.1,side:T.DoubleSide});
 const syrupBins=game.read().leafCells.length,arcSteps=10,glazeVerts=[],glazeFaces=[];
 for(let i=0;i<syrupBins;i++)for(let j=0;j<=arcSteps;j++){
   glazeVerts.push(0,0,0);if(i&&j){const a=i*(arcSteps+1)+j;glazeFaces.push(a,a-1,a-arcSteps-2,a,a-arcSteps-2,a-arcSteps-1);}
 }
 const leafGlaze=surface(leaf,syrup,glazeVerts,glazeFaces);leafGlaze.frustumCulled=false;
 const bridges=Array.from({length:2},(_,i)=>ball(food,syrup,(i-.5)*1.06,-.18,0,.11,.12,.25));
 const drop=group();const dropBody=ball(drop,syrup,0,0,0,1);const filament=ball(drop,syrup,0,.62,0,.23,.81,.23);
 // A hand-thrown teacup, with a tenmoku rim and horizontal throwing marks.
 const cup=group(),cupM=mat(0x829692,.23,'clay'),teaM=mat(0x5e582e,.14,'clay');
 const cp=[[.01,.015],[.28,.015],[.31,.065],[.30,.12],[.37,.17],[.427,.37],[.446,.72],[.434,.87],[.425,.898],[.398,.896],[.390,.86],[.385,.53],[.33,.22],[.01,.184]];
 lathe(cup,cupM,cp);
 const teaRim=mat(0x655744,.34,'clay');lathe(cup,teaRim,[[.43,.852],[.438,.866],[.434,.893],[.418,.907],[.399,.90],[.394,.879]]);
 for(let j=0;j<3;j++)lathe(cup,cupM,[[.399+j*.009,.27+j*.052],[.42+j*.006,.285+j*.052],[.412+j*.008,.301+j*.052]]);
 lathe(cup,teaM,[[.001,.801],[.392,.802],[.397,.808]]);
 const saucer=lathe(cup,dark,[[.01,-.04],[.46,-.04],[.59,.008],[.61,.032],[.59,.051],[.31,.01],[.01,.01]]);
 const flowers=group();flowers.position.set(3.45,.0,-2.73);
 const vaseM=mat(0xd3c7a9,.32,'clay'),vaseLine=mat(0x65767a,.37,'clay');
 lathe(flowers,vaseM,[[.01,0],[.24,0],[.30,.07],[.36,.42],[.355,.58],[.27,.75],[.137,.84],[.123,1.05],[.145,1.07],[.144,1.12],[.115,1.13],[.105,1.05]]);
 for(let h of [.13,.18])lathe(flowers,vaseLine,[[.317,h],[.327,h+.018],[.324,h+.034]]);
 const petal=mat(0xead8c8,.6,'clay'),pink=mat(0xc69885,.68,'clay'),pollen=mat(0xc79c56,.71,'clay');
 function flower(p,v,bloom){
   ball(p,pink,v.x,v.y,v.z,.064,.078,.057,true);
   if(rnd()>.43){for(let j=0;j<5;j++){let a=j*1.256;let o=ball(p,petal,v.x+Math.sin(a)*.062,v.y+Math.cos(a)*.063,v.z+.022,.055,.065,.034,true);o.rotation.z=-a;}ball(p,pollen,v.x,v.y,v.z+.059,.03,.032,.025,true);}
 }
 branch(flowers,V(0,1,0),V(-.19,1.72,-.04),.038,3,true);branch(flowers,V(.01,1,0),V(.28,1.6,.07),.031,2,true);
 // Grandma's cuff, palm and curved fingers share a wrist. Short elliptical sections
 // follow each knuckle, avoiding the hard intersections of jointed cylinder fingers.
 const grandma=group(),body=group(grandma);
 const cotton=mat(0x424e50,.94,'cloth'),cuff=mat(0x4c6263,.90,'cloth'),lining=mat(0xd2c5a9,.91,'cloth');
 const torso=lathe(body,cotton,[[.58,0],[1.01,.12],[1.18,.7],[1.12,2.1],[.92,3.1],[.75,3.72],[.4,3.92]],0,0,0,40);torso.scale.z=.73;
 body.position.set(7.05,-.5,-1.52);body.rotation.z=-.10;
 const arm=group(grandma),hand=group(grandma);
 const sleeve=lathe(arm,cotton,[[.40,0],[.51,.03],[.55,.10],[.58,.31],[.65,.55],[.67,.84],[.72,1],[.01,1]],0,0,0,40);sleeve.scale.z=.87;
 const cuffEnd=lathe(arm,cuff,[[.39,-.06],[.49,-.07],[.52,-.044],[.53,.065],[.51,.084],[.47,.051],[.39,-.06]]);
 lathe(arm,lining,[[.335,-.064],[.389,-.088],[.464,-.079],[.475,-.061],[.39,-.042]]);
 for(let j=0;j<2;j++)for(let k=0;k<19;k++){const a=k*.331;rod(arm,lining,V(.516*Math.cos(a),.005+j*.031,.516*Math.sin(a)),V(.516*Math.cos(a+.107),.009+j*.031,.516*Math.sin(a+.107)),.008,.008,4);}
 const skin=mat(0xd3a788,.64,'skin'),nail=mat(0xdeb6a3,.53,'skin'),digits=[];
 function limb(p,points,width,thickness,m){
   const curve=new T.CatmullRomCurve3(points.map(a=>V(...a)));const v=[],idx=[],n=points.length*4,k=14;
   for(let i=0;i<=n;i++){
     let t=i/n,at=t*(width.length-1),j=Math.min(width.length-2,Math.floor(at)),f=at-j;
     let c=curve.getPoint(t),dir=curve.getTangent(t),side=V(0,0,1).addScaledVector(dir,-dir.z).normalize(),up=side.clone().cross(dir).normalize();
     for(let h=0;h<k;h++){let a=h*Math.PI*2/k,q=c.clone().addScaledVector(side,Math.cos(a)*T.MathUtils.lerp(width[j],width[j+1],f)).addScaledVector(up,Math.sin(a)*T.MathUtils.lerp(thickness[j],thickness[j+1],f));v.push(...q.toArray());if(i){let u=i*k+h,b=i*k+(h+1)%k;idx.push(u,b,u-k,b,b-k,u-k);}}
   }
   m.side=T.DoubleSide;return surface(p,m,v,idx);
 }
 limb(hand,[[-.19,.01,0],[.05,0,0],[.29,.027,-.014],[.56,.04,-.011],[.79,.01,0],[.97,-.01,0]],[.17,.21,.25,.308,.297,.08],[.12,.149,.144,.167,.135,.046],skin);
 for(let j=0;j<4;j++){
   let z=(j-1.5)*.148,x=.78-(j===3?.05:0),len=[.67,.76,.68,.52][j],h=[.02,.06,.045,.01][j];
   const end=[x+len,-.26+h,z+.025*(j-1.5)];
   const digit=group(hand);digit.position.set(x-.10,.035,z);digits.push(digit);
   const segment=limb(digit,[[x-.1,.03,z],[x+.08,.042+h,z],[x+len*.48,h-.003,z+.025*(j-1.5)],[x+len*.78,h-.143,end[2]],end],[.09,.091,.077,.073,.010],[.087,.083,.076,.068,.012],skin);
   segment.position.sub(digit.position);
   const n=ball(digit,nail,end[0]-.057,end[1]+.065,end[2],.074,.018,.052,true);n.position.sub(digit.position);n.rotation.z=-.76;
 }
 limb(hand,[[.30,-.005,.17],[.47,-.049,.286],[.62,-.12,.39],[.77,-.227,.412],[.97,-.265,.357]],[.135,.14,.103,.093,.026],[.136,.132,.102,.080,.031],skin);
 const thumbNail=ball(hand,nail,.914,-.212,.380,.069,.023,.057,true);thumbNail.rotation.z=-.24;
 hand.scale.setScalar(1.35);
 // Real billowing translucent ribbons fade where they leave the hot vessels.
 const steamMat=mat(0xf2f1e7,.98,'',{transparent:true,opacity:1,depthWrite:false,side:T.DoubleSide});
 steamMat.onBeforeCompile=s=>{
   s.vertexShader='attribute float mistAlpha;varying float vMist; varying vec2 vSt;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMist=mistAlpha;vSt=uv;');
   s.fragmentShader='varying float vMist; varying vec2 vSt;\n'+s.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=vMist*pow(max(0.,1.-abs(vSt.x*2.-1.)),2.0)*sin(3.14159*vSt.y);');
 };steamMat.customProgramCacheKey=()=>'mist';
 const mistGeo=new T.BufferGeometry(),mCount=32,mSeg=6,mp=new Float32Array(mCount*(mSeg+1)*6),ma=new Float32Array(mp.length/3),mu=[],mi=[];
 for(let i=0;i<mCount;i++)for(let j=0;j<=mSeg;j++){let k=(i*(mSeg+1)+j)*2;mu.push(0,j/mSeg,1,j/mSeg);if(j)mi.push(k-2,k-1,k,k-1,k+1,k);}
 mistGeo.setAttribute('position',new T.BufferAttribute(mp,3).setUsage(T.DynamicDrawUsage));mistGeo.setAttribute('mistAlpha',new T.BufferAttribute(ma,1).setUsage(T.DynamicDrawUsage));mistGeo.setAttribute('uv',new T.Float32BufferAttribute(mu,2));mistGeo.setAttribute('normal',new T.Float32BufferAttribute(Array.from({length:ma.length},()=>[0,1,0]).flat(),3));mistGeo.setIndex(mi);
 const steamMesh=mesh(mistGeo,steamMat,scene,0,0,0,false);steamMesh.frustumCulled=false;steamMesh.receiveShadow=false;steamMesh.renderOrder=2;
 const dustMat=mat(0xe9d7b0,.9,'',{transparent:true,opacity:.46,depthWrite:false});
 const dust=new T.InstancedMesh(smallSphere,dustMat,13);dust.frustumCulled=false;scene.add(dust);const dummy=new T.Object3D();
 // Small, soft contact shadows preserve contact between the rounded foods and the groove.
 const aoC=C.canvas(48,48),ac=aoC.getContext('2d'),gr=ac.createRadialGradient(24,24,0,24,24,24);gr.addColorStop(0,'rgba(49,32,19,.46)');gr.addColorStop(.36,'rgba(49,32,19,.28)');gr.addColorStop(1,'rgba(49,32,19,0)');ac.fillStyle=gr;ac.fillRect(0,0,48,48);
 const aoMat=mat(0xffffff,1,'',{map:C.texture(aoC),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const contact=[];for(let i=0;i<3;i++){let o=mesh(new T.PlaneGeometry(1.24,.94),aoMat,rail,(i-1)*1.06,.282,0,false);o.rotation.x=-Math.PI/2;contact.push(o);}
 const carrier=group(rail);
 board(carrier,honey,3.55,1.31,.14,.11,0,.11,0);
 for(let sign of [-1,1]){board(carrier,plank,3.50,.09,.23,.036,0,.21,sign*.63);}
 board(carrier,plank,.12,1.32,.24,.046,1.72,.21,0);
 const newBatch=group(rail),incoming=foodBalls.map((o,i)=>{let b=mesh(doughGeo,o.material.clone(),newBatch);b.material=mat(0xffeeca,.46,'dough');b.material.userData.u.wo.value=[3.12,1.07,4.48][i];return b;});
 // Batch fixed scenery without flattening the interactive tools or their hit models.
 function batch(g){
   g.updateWorldMatrix(true,true);const inv=g.matrixWorld.clone().invert(),sets=new Map();
   g.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const k=o.material;if(!sets.has(k))sets.set(k,[]);sets.get(k).push(o);});
   for(const [m,items] of sets){
     if(items.length<3)continue;
     let ps=[],ns=[],uv=[],ids=[],off=0;
     for(const o of items){const a=o.geometry.attributes,pos=a.position,norm=a.normal,coord=a.uv;
       let t=inv.clone().multiply(o.matrixWorld),nm=new T.Matrix3().getNormalMatrix(t),v=V(0,0,0);
       for(let j=0;j<pos.count;j++){v.fromBufferAttribute(pos,j).applyMatrix4(t);ps.push(v.x,v.y,v.z);v.fromBufferAttribute(norm,j).applyMatrix3(nm).normalize();ns.push(v.x,v.y,v.z);uv.push(coord?coord.getX(j):0,coord?coord.getY(j):0);}
       let ix=o.geometry.index,n=ix?ix.count:pos.count;for(let j=0;j<n;j++)ids.push(off+(ix?ix.getX(j):j));off+=pos.count;o.removeFromParent();
     }
     const b=new T.BufferGeometry();b.setAttribute('position',new T.Float32BufferAttribute(ps,3));b.setAttribute('normal',new T.Float32BufferAttribute(ns,3));b.setAttribute('uv',new T.Float32BufferAttribute(uv,2));b.setIndex(ids);mesh(b,m,g);
   }
 }
 let bloom=null;
 let w=1,h=1,narrow=0,panBase=V(0,0,0),trayBase=V(0,0,0),teaBase=V(0,0,0),railBase=V(0,0,0);
 function resize(){
   w=canvas.clientWidth||innerWidth;h=canvas.clientHeight||innerHeight;renderer.setSize(w,h,false);
   let asp=w/h;narrow=T.MathUtils.smoothstep(1.27-asp,0,.75);
   if(bloom)bloom.resize();
   cam.aspect=asp;cam.fov=T.MathUtils.lerp(36,40,narrow);
   let stretch=Math.max(1,1.42/asp);stretch=T.MathUtils.lerp(Math.min(stretch,1.2),1,narrow);
   let cameraPos=V(-.64,7.05,12.20).lerp(V(-6.3,10.4,11.8),narrow),target=V(-.37,.93,.78).lerp(V(-.55,.78,1.38),narrow);
   cameraPos.sub(target).multiplyScalar(stretch*Math.max(1,.46/asp)).add(target);cam.position.copy(cameraPos);cam.lookAt(target);cam.updateProjectionMatrix();cam.updateMatrixWorld();
   rail.rotation.y=.67+narrow*.05;railBase.set(.24,.035,1.18);rail.position.copy(railBase);
   panBase.set(-2.35,.0,-.92).lerp(V(-1.35,0,.00),narrow);stove.position.copy(panBase);
   trayBase.set(3.03,.061,1.48).lerp(V(2.64,.061,-1.27),narrow);
   teaBase.set(1.10,.052,-2.23).lerp(V(1.85,.052,-3.22),narrow);
   textile.position.set(trayBase.x,.01,trayBase.z);textile.rotation.y=.17+narrow*.49;
   tray.rotation.y=.23+narrow*.49;flowers.position.x=3.50-narrow*.95;
 }
 const mix=T.MathUtils.lerp,clamp=T.MathUtils.clamp,local=V(0,0,0);
 function update(s){
   const end=s.stage==='refill',out=end?Math.max(0,1-T.MathUtils.smoothstep(s.age-.45,0,2.1)):s.delivery;
   const sauceX=mix(panBase.x,.03+narrow*.16,s.pan),sauceZ=mix(panBase.z,-1.62-narrow*.42,s.pan);
   pot.position.set(sauceX,.475-.37*s.pan+.23*Math.sin(s.pan*Math.PI),sauceZ);
   tray.position.copy(trayBase);tray.position.x+=out*11;tray.position.z-=out*2;
   const t=s.tea,teaplace=V(trayBase.x+1.05,.052,trayBase.z-1.44);
   const teaAt=end?Math.max(0,1-s.age*.48):t;cup.position.copy(teaBase).lerp(teaplace,teaAt);cup.position.y+=Math.sin(Math.PI*teaAt)*.38;
   const press=s.paddlePress,restX=mix(-.69,.24,narrow),restZ=mix(-.12,-.46,narrow);
   const bladeFloor=.40+.15*(s.paddleX*s.paddleX+s.paddleY*s.paddleY);
   paddle.position.set(mix(restX,s.paddleX*1.31,press),mix(.56,bladeFloor,press),mix(restZ,s.paddleY*1.31,press));
   paddle.rotation.set(mix(-.43-.21*narrow,-.28+s.paddleY*.27,press),-.12,mix(.98-narrow*1.65,.35-s.paddleX*.28,press));
   paddle.position.lerp(V(-1.77,-.035,.91),s.pan);paddle.position.y+=.9*Math.sin(s.pan*Math.PI);
   paddle.rotation.z=mix(paddle.rotation.z,1.51,s.pan);
   const cy=.805+rail.position.y,at=rail.position.clone();at.y=cy+.58*s.lift;
   at.lerp(V(sauceX,pot.position.y+1.52,sauceZ),s.pan);
   at.y-=s.dip*.94;const slide=-.55*(1-s.place)+s.draw*.73;
   const servePos=V(slide,.81+(1-s.place)*(1.02-.71*s.hover),0).applyEuler(tray.rotation).add(tray.position);
   at.lerp(servePos,s.overLeaf);food.position.copy(at);food.rotation.order='YXZ';food.rotation.y=mix(rail.rotation.y,tray.rotation.y,s.overLeaf);food.rotation.z=-s.tilt;
   food.visible=!end;skewer.position.x=-3.54*(1-s.push);const stopMove=end?1-T.MathUtils.smoothstep(s.age,4.12,5.70):s.overLeaf;
   const stopHome=rail.localToWorld(V(2.08,.30,0));
   const stopBesideLeaf=V(2.05+s.support*.39,.26+s.support*.19,-s.support*1.03).applyEuler(tray.rotation).add(trayBase);
   stop.position.copy(stopHome).lerp(stopBesideLeaf,stopMove);
   stop.rotation.y=mix(rail.rotation.y,tray.rotation.y,stopMove);
   for(let i=0;i<2;i++){const pool=s.balls[i].valley,o=bridges[i];o.visible=pool>.004;o.scale.set(.12+.12*pool,.09+.19*pool,.14+.25*pool);}
   const arrival=end?1-T.MathUtils.smoothstep(s.age,0,1.04):1;
   const away=arrival+(end?T.MathUtils.smoothstep(s.age,3.15,5.10):0);
   carrier.visible=end;carrier.position.set(4.42,.36*away,7.3*away);
   for(let i=0;i<3;i++){
     const b=s.balls[i],o=foodBalls[i],r=(b.mass/19)**(1/3);o.position.z=b.align;
     o.scale.set(.553*r,.572*r,.56*r);o.position.y=.012*Math.sin(i*2.3);
     o.material.userData.u.coating.value=b.coat;o.material.userData.u.reserve.value=b.valley;
     const a=o.geometry.attributes.position;
     if(o.userData.dent!==b.dent && (Math.abs(b.dent-(o.userData.dent||0))>.001 || o.userData.dent===undefined)){
       for(let j=0;j<a.count;j++){let x=raw.getX(j),y=raw.getY(j),z=raw.getZ(j);const contactWeight=Math.exp(-9*(y*y+z*z))*Math.max(0,-x);
         a.setXYZ(j,x+b.dent/17.7*contactWeight,y*(1+.008*b.dent*contactWeight),z*(1+.008*b.dent*contactWeight));}
       a.needsUpdate=true;o.geometry.computeVertexNormals();o.userData.dent=b.dent;
     }
     contact[i].visible=s.lift<.35||end;
     incoming[i].visible=end;incoming[i].scale.copy(o.scale);
     const start=3.35+i*1.07,finish=(i-1)*1.06;incoming[i].position.set(mix(start,finish,b.roll),.805+.36*arrival+.038*Math.abs(b.rollV),7.3*arrival);incoming[i].rotation.z=(start-finish)*b.roll/.55;
   }
   // The new bamboo slides back along the empty groove after the served skewer leaves.
   newStick.visible=end;newStick.position.x=-3.54-4.8*(1-T.MathUtils.smoothstep(s.age,2.9,5.6));
   updateLiquid(s);
   leafGlaze.visible=s.landed&&!end;
   if(leafGlaze.visible)paintLeaf(s);
   drop.visible=s.stage==='drip'||(s.stage==='place' && s.active==='grip' && !s.place);
   if(drop.visible){local.set(s.dropX,s.beadY,.095);food.updateWorldMatrix(true,false);food.localToWorld(local);drop.position.copy(local);
     if(s.falling){local.set(s.flightX,.245+s.flightHeight-s.dropY,0);tray.localToWorld(local);drop.position.copy(local);}
     if(s.landed){const tipX=clamp(s.flightX+(s.draw-s.drawOnImpact)*.73,-1.6,1.6);
       drop.position.copy(leaf.localToWorld(leafPt(tipX/3.68+.5,0)));drop.position.y+=.04+Math.max(0,.6-s.hover)*.75;}
     let r=.115+.061*Math.cbrt(s.dropMass);drop.scale.set(r,r*(s.falling&&!s.landed?1.64:1.1),r);filament.visible=!s.falling||s.landed;
   }
   const leading=stop.position.clone().add(V(0,.52,0));
   let tip=leading.clone().add(V(s.handX,s.handY,s.handZ));
   if(s.stage==='thread'){const brushing=Math.exp(-s.age*.94);tip.add(V(-.49,.43,.31).multiplyScalar(brushing));}
   tip.lerp(V(pot.position.x+1.62,pot.position.y+.75,pot.position.z+.16),s.handToPot);
   tip.lerp(V(cup.position.x+.29,cup.position.y+.68,cup.position.z),s.handToCup);
   hand.rotation.set(-.08,-2.91,-.27);const tipOffset=V(1.32,-.20,0).multiplyScalar(1.35).applyEuler(hand.rotation);hand.position.copy(tip).sub(tipOffset);
   for(let i=0;i<digits.length;i++){
     digits[i].rotation.z=-s.handToPot*(.08+.075*i)-s.handToCup*(.15+i*.048)-s.support*.041;
     digits[i].rotation.y=(i-1.5)*(.034*s.handToCup+.027*s.handToPot);
   }
   arm.position.copy(hand.position);const shoulder=V(7.5,2.08,-1.85),armDir=shoulder.sub(arm.position);arm.quaternion.setFromUnitVectors(V(0,1,0),armDir.clone().normalize());sleeve.scale.y=armDir.length();
   updateAir(s);for(let i=0;i<curtains.length;i++)curtains[i].rotation.x=s.air*(.095+i*.027);
   sun.intensity=2.97+s.air*.24;
 }
 const newStick=group(rail);const stickModel=skewer.clone(true);stickModel.position.set(0,0,0);newStick.add(stickModel);newStick.position.y=.805;
 function paintLeaf(s){
   const pos=leafGlaze.geometry.attributes.position,dx=3.68/(syrupBins-1);
   for(let i=0;i<syrupBins;i++){
     const c=s.leafCells[i],t=i/(syrupBins-1),base=leafPt(t,0);
     // Convert each bin's millilitres to an elliptic cap of the same volume.
     const area=c.mass*1000/(32*32*32*dx),ratio=.37+.10*c.skin;
     const width=Math.sqrt(2*area/(Math.PI*ratio));
     for(let j=0;j<=arcSteps;j++){
       const a=j*Math.PI/arcSteps,z=width*Math.cos(a);
       const k=Math.min(1,Math.abs(z)/Math.max(.01,Math.sin(Math.PI*t)**.78*(.61+.16*t)));
       pos.setXYZ(i*(arcSteps+1)+j,base.x,base.y+.006+.092*k**1.65*Math.sin(Math.PI*t)+width*ratio*Math.sin(a),base.z+z);
     }
   }
   pos.needsUpdate=true;leafGlaze.geometry.computeVertexNormals();
 }
 function updateLiquid(s){
   for(let i=0;i<s.cells.length;i++){let c=s.cells[i],k=i*4;fieldBytes[k]=Math.round(c.gel*255);fieldBytes[k+1]=Math.round(c.groove*255);fieldBytes[k+2]=Math.round(c.water*255);fieldBytes[k+3]=255;}field.needsUpdate=true;
   const a=liquid.geometry.attributes.position,N=game.N;
   for(let i=0;i<a.count;i++){
     const x=liquidV[3*i],z=liquidV[3*i+2],xx=clamp((x/2.68+.5)*(N-1),0,N-1.0001),zz=clamp((z/2.68+.5)*(N-1),0,N-1.0001),u=xx|0,v=zz|0;
     const height=c=>c.ripple*.32-c.groove*(.087+.21*c.gel);
     let y=mix(mix(height(s.cells[v*N+u]),height(s.cells[v*N+u+1]),xx-u),mix(height(s.cells[(v+1)*N+u]),height(s.cells[(v+1)*N+u+1]),xx-u),zz-v);
     a.setY(i,y+.004*Math.sin(x*3+z*5+s.air*13)*Math.cos(z*6));
   }a.needsUpdate=true;liquid.geometry.computeVertexNormals();
 }
 function updateAir(s){
   for(let i=0;i<mCount;i++){
     const p=s.ambient[i],kettle=p.kind==='steam',base=kettle?pot.position:cup.position,scale=kettle?1:.52;
     const opacity=(kettle?.16+.12*s.steam:.19)*Math.sin(Math.PI*p.life)**.8;
     for(let j=0;j<=mSeg;j++){let k=(i*(mSeg+1)+j)*2,t=j/mSeg;
       let x=base.x+p.x*scale+(.073*Math.sin(t*5+i+p.life*3)+s.air*.35)*t*scale,y=base.y+(kettle?.73:.82)+(p.y+t*(.35+.41*p.life))*scale,z=base.z+p.z*scale+.039*Math.cos(t*5+i)*t;
       let width=(.026+.091*p.life)*scale*(.60+.65*t)*p.size;
       mp[k*3]=x-width;mp[(k+1)*3]=x+width;mp[k*3+1]=mp[(k+1)*3+1]=y;mp[k*3+2]=mp[(k+1)*3+2]=z;ma[k]=ma[k+1]=opacity;
     }
   }mistGeo.attributes.position.needsUpdate=mistGeo.attributes.mistAlpha.needsUpdate=true;
   for(let i=32;i<45;i++){let p=s.ambient[i];dummy.position.set(p.x,p.y,p.z);dummy.scale.setScalar(.009*Math.sin(Math.PI*p.life));dummy.updateMatrix();dust.setMatrixAt(i-32,dummy.matrix);}dust.instanceMatrix.needsUpdate=true;
 }
 const ray=new T.Raycaster(),ndc=new T.Vector2();
 const groupTargets={grip:[gripAnchor,skewer,...foodBalls],paddle:[paddle,liquid],leaf:[leafMesh,plate],support:[stop],tray:[tray],cup:[cup]};
 function screen(obj){const v=obj.isVector3?obj.clone():obj.getWorldPosition(V(0,0,0));v.project(cam);return {x:(v.x+1)*w/2,y:(1-v.y)*h/2};}
 function guide(s){
   let focus=gripAnchor;
   if(s.stage==='stir')focus=paddleAnchor;if(s.stage==='place')focus=leaf;if(s.stage==='rest')focus=stop;if(s.stage==='serve')focus=cup;
   return screen(focus);
 }
 function hit(x,y,s){
   ndc.set(x/w*2-1,1-y/h*2);ray.setFromCamera(ndc,cam);
   if(s.stage==='thread'){
     // A finger-sized corridor along the protruding handle, including its round end.
     const a=screen(gripAnchor),b=screen(skewer.localToWorld(V(-.28,0,0))),vx=b.x-a.x,vy=b.y-a.y;
     const t=clamp(((x-a.x)*vx+(y-a.y)*vy)/(vx*vx+vy*vy),0,1);
     return Math.hypot(x-a.x-t*vx,y-a.y-t*vy)<Math.max(27,Math.min(37,w*.045))?'grip':'';
   }
   let best='',near=Infinity;
   for(const [name,objects] of Object.entries(groupTargets)){
     if(!game.allowed(name))continue;let hits=ray.intersectObjects(objects,true);
     if(hits.length&&hits[0].distance<near){near=hits[0].distance;best=name;}
   }
   if(!best && s.stage!=='refill'){
     const a=guide(s);if(Math.hypot(x-a.x,y-a.y)<31)best=({stir:'paddle',dip:'grip',drip:'grip',place:'leaf',rest:'support',serve:'cup'})[s.stage];
   }return best;
 }
 function coords(x,y,name){
   if(name==='paddle'){ndc.set(x/w*2-1,1-y/h*2);ray.setFromCamera(ndc,cam);const plane=new T.Plane(V(0,1,0),-pot.position.y-.70);const q=V(0,0,0);ray.ray.intersectPlane(plane,q);return [(q.x-pot.position.x)/1.35,(q.z-pot.position.z)/1.35];}
   return [x/(Math.min(w,h)*.37),y/(Math.min(w,h)*.37)];
 }
 // A small HDR highlight pass is installed only after the first frame is on screen.
 function softHighlights(){
   const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:2});
   const blur=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false});
   const quadGeometry=new T.BufferGeometry();
   quadGeometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
   const vertexShader='varying vec2 st;void main(){st=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}';
   const blurM=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{base:{value:target.texture},stride:{value:new T.Vector2()}},vertexShader,
     fragmentShader:`varying vec2 st;uniform sampler2D base;uniform vec2 stride;
     void main(){vec3 sum=vec3(0.);float weights=0.;
     for(int i=-2;i<=2;i++){for(int j=-2;j<=2;j++){vec2 off=vec2(float(i),float(j));float w=exp(-.56*dot(off,off));
     vec3 c=texture2D(base,st+off*stride).rgb;float lum=dot(c,vec3(.2126,.7152,.0722));
     sum+=w*c*smoothstep(1.05,2.3,lum);weights+=w;}}gl_FragColor=vec4(sum/weights,1.);}`});
   const combine=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{base:{value:target.texture},halo:{value:blur.texture}},vertexShader,
     fragmentShader:`varying vec2 st;uniform sampler2D base;uniform sampler2D halo;
     void main(){gl_FragColor=vec4(texture2D(base,st).rgb+.038*texture2D(halo,st).rgb,1.);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
     }`});
   const post=new T.Scene(),screenCam=new T.Camera(),quad=new T.Mesh(quadGeometry,blurM);quad.frustumCulled=false;post.add(quad);
   return {resize(){
     const x=Math.max(1,Math.round(w*renderer.getPixelRatio())),y=Math.max(1,Math.round(h*renderer.getPixelRatio()));
     target.setSize(x,y);blur.setSize(Math.max(1,x>>2),Math.max(1,y>>2));blurM.uniforms.stride.value.set(3.5/x,3.5/y);
   },draw(){
     renderer.setRenderTarget(target);renderer.render(scene,cam);
     quad.material=blurM;renderer.setRenderTarget(blur);renderer.render(post,screenCam);
     quad.material=combine;renderer.setRenderTarget(null);renderer.render(post,screenCam);
   }};
 }
 resize();
 return {update,render:()=>bloom?bloom.draw():renderer.render(scene,cam),resize,hit,coords,guide,screen,w:()=>w,h:()=>h,
 finishSetup:()=>{
   for(const detail of refine)detail();
   for(const g of [outside,textile,flowers,stop,leaf,stove,carrier])batch(g);
   if(renderer.extensions?.has('EXT_color_buffer_float')){bloom=softHighlights();bloom.resize();}
 },pot,food,rail};
}
