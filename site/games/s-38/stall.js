'use strict';
const shop=document.querySelector('#shop'),scene=new T.Scene(),camera=new T.PerspectiveCamera(24,1,.1,80);
const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;shop.prepend(renderer.domElement);
scene.background=col(0x999899);scene.fog=new T.FogExp2(0xaaa19a,.038);
const key=new T.DirectionalLight(0xffe1b5,3.16);key.position.set(-4.8,9,4.7);scene.add(key);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:25});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00025;key.shadow.normalBias=.012;key.shadow.radius=2;
scene.add(new T.HemisphereLight(0xc1cfda,0xc4a281,1.18));
function skyReflection(){
 const faces=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,64);
 g.addColorStop(0,i===3?'#685643':'#a4acaf');g.addColorStop(.46,i===1?'#f0d5ae':'#bcc1b9');g.addColorStop(.50,'#6a7778');g.addColorStop(.76,'#776c5b');g.addColorStop(1,'#a18668');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
 if(i===4||i===1){ctx.fillStyle='#efdcbb';ctx.fillRect(8,14,25,20);ctx.fillStyle='#656767';ctx.fillRect(19,12,2,26);ctx.fillRect(7,24,28,2)}faces.push(c)}
 const cube=new T.CubeTexture(faces);cube.colorSpace=T.SRGBColorSpace;cube.needsUpdate=true;scene.environment=cube;scene.environmentIntensity=.49
}
// Coalesce rigid scenery by material to keep the moving pieces inexpensive on a tablet.
function batch(g){
 g.updateWorldMatrix(true,true);const inv=g.matrixWorld.clone().invert(),groups=new Map(),drop=[];
 g.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.geometry.attributes.color)return;const key=o.material.uuid;
 if(!groups.has(key))groups.set(key,{m:o.material,p:[],n:[],idx:[]});const out=groups.get(key),geom=o.geometry,a=geom.attributes.position,n=geom.attributes.normal;
 const mat=inv.clone().multiply(o.matrixWorld),nm=new T.Matrix3().getNormalMatrix(mat),v=V(),base=out.p.length/3;
 for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(mat);out.p.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();out.n.push(v.x,v.y,v.z)}
 const idx=geom.index;for(let i=0;i<(idx?idx.count:a.count);i++)out.idx.push(base+(idx?idx.getX(i):i));drop.push(o)
 });drop.forEach(o=>o.removeFromParent());
 for(const b of groups.values()){let geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geom.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geom.setIndex(b.idx);mesh(g,geom,b.m)}
}
const booth=G(scene),counter=G(booth);
const timber=[0xad896a,0xb18b68,0xb9936e,0xb79877,0xa98567].map(c=>surface(c,.60,0,'wood'));
for(let i=0;i<19;i++){const z=-4+i*.565;tile(counter,17,.551,.19,.018,timber[i%5],0,-.23,z)}
box(booth,0,-.29,4.84,16,.40,.14,M.walnut);
const frame=surface(0x79634d,.61,0,'wood'),darkFrame=surface(0x615349,.72,0,'wood');
for(const x of [-5.6,5.5]){box(booth,x,2,-3.55,.26,6.2,.32,frame);box(booth,x,-.22,-3.55,.38,1,.42,darkFrame)}
box(booth,0,4.85,-3.6,15,.25,.29,frame);box(booth,0,.26,-3.65,15,.15,.34,frame);
const far=G(booth);const distantWall=surface(0x798384,.89),windowPaper=surface(0xc7ad86,.86,0,'linen',{emissive:0xb48e61,emissiveIntensity:.23});
box(far,0,2.4,-10,29,8,.3,distantWall);
for(let b=-3;b<=3;b++){
 const x=b*3.2;box(far,x,1.65,-8.9,2.7,3.3,.12,windowPaper);box(far,x,3.49,-8.7,3.15,.23,.66,darkFrame);
 for(let j=0;j<5;j++)box(far,x-1.40+j*.7,1.65,-8.78,.049,3.32,.11,frame);
 for(let j=0;j<3;j++)box(far,x,.38+1.15*j,-8.76,2.77,.052,.12,frame);
 box(far,x+1.48,1.65,-8.82,.23,4.0,.30,darkFrame)
}
function crest(parent,x,y,z,size,mat){
 const g=G(parent);g.position.set(x,y,z);g.scale.setScalar(size);
 // Hand-painted fish seal on the fabric, with a round eye, three scales and forked tail.
 const sh=new T.Shape();sh.moveTo(-.65,.00);sh.bezierCurveTo(-.53,.29,-.12,.34,.20,.17);sh.lineTo(.48,.32);sh.quadraticCurveTo(.45,.13,.38,.04);sh.quadraticCurveTo(.49,-.16,.5,-.27);sh.lineTo(.18,-.13);sh.bezierCurveTo(-.1,-.33,-.51,-.25,-.65,0);
 const eye=new T.Path();eye.absellipse(-.41,.073,.049,.049,0,PI*2,true);sh.holes.push(eye);
 const ink=mat;ink.side=T.DoubleSide;mesh(g,new T.ShapeGeometry(sh,24),ink);
 return g
}
// Indigo noren, each panel slightly cupped with a stitched double hem.
const curtain=G(booth),ink=surface(0xd6d0b6,.96,0,'linen'),indigos=[0x344f5d,0x3d5965,0x36535f].map(c=>surface(c,.93,0,'linen'));
for(let j=-4;j<=4;j++){
 const x=j*1.77,w=1.72,h=1.67+(j%2)*.11,baseY=3.02+(Math.abs(j)%3)*.05;
 const pos=(u,v)=>[x+(u-.5)*w+.034*Math.sin(v*3.1+j),baseY+v*h+.048*Math.cos(u*5+j)*(1-v),-3.03+.095*Math.sin(u*PI*2.3+j)+.095*(1-v)**2];
 cloth(curtain,1,1,pos,14,7,indigos[(j+6)%3]);
 for(const yy of [.11,.17])cloth(curtain,1,1,(u,v)=>{const q=pos(u,yy+v*.013);q[2]+=.008;return q},14,1,ink);
 if(j%2===0){const q=pos(.5,.49);let g=crest(curtain,q[0],q[1],q[2]+.11,.94,ink);const hoop=mesh(g,new T.TorusGeometry(.70,.023,6,72),ink,-.066,.02,-.01);hoop.scale.y=.92}
}
cylinder(booth,V(-7,4.86,-3.02),V(7,4.86,-3.02),.075,.075,M.bamboo);
// The light is a translucent ribbed paper cylinder with lacquered end caps.
const lacquer=surface(0x383b36,.34,.21),cord=surface(0x836c4c,.9);
function lantern(x,y,z,size,red=true){
 const g=G(scene);g.position.set(x,y,z);g.scale.setScalar(size);
 const pap=surface(red?0xc76847:0xe5cba0,.73,0,'linen',{emissive:red?0xf18a47:0xe9c48c,emissiveIntensity:red?.28:.24});
 const rib=surface(red?0x9d543e:0xb99d75,.78);
 let pr=[];const radius=t=>.375+.204*Math.sin(Math.PI*t)**.52;
 for(let k=0;k<=84;k++){const t=k/84;pr.push([radius(t)-.015*(.5+.5*Math.cos(t*PI*42)),-.77+1.54*t])}
 lathe(g,pr,pap);for(let i=1;i<21;i++)ring(g,0,-.77+1.54*i/21,0,radius(i/21)-.009,.0085,rib);
 for(const sign of [-1,1]){const cap=lathe(g,[[.01,-.056],[.36,-.056],[.404,-.036],[.404,.043],[.371,.06],[.015,.06]],lacquer);cap.position.y=.81*sign}
 pipe(g,[[-.24,.84,0],[-.19,1.05,0],[0,1.15,0],[.19,1.05,0],[.24,.84,0]],.018,lacquer);
 cylinder(g,V(0,1.14,0),V(0,3,0),.014,.014,cord,9);
 if(red){const mark=crest(g,.034,-.08,.57,.59,lacquer);mark.rotation.y=.095;const oval=mesh(g,new T.TorusGeometry(.32,.014,7,60),lacquer,0,-.07,.604);oval.scale.y=1.02}
 batch(g);return g
}
const lanternA=lantern(-3.78,3.28,-1.12,1.08),lanternB=lantern(4.99,3.22,-2.0,.73,false);
// Maple leaves have folded veins and serrated lobes, including two fallen on the counter.
const leaves=[0xa3583f,0xb87948,0x99654a,0xaa7853].map(c=>surface(c,.88));
function leaf(p,x,y,z,sz,material){
 const shape=[[0,.52],[.09,.23],[.18,.39],[.19,.16],[.39,.26],[.31,.085],[.48,.08],[.30,-.035],[.38,-.07],[.12,-.13],[.16,-.24],[.02,-.15],[0,-.37],[-.018,-.15],[-.17,-.23],[-.12,-.13],[-.38,-.07],[-.30,-.035],[-.48,.08],[-.31,.085],[-.39,.26],[-.19,.16],[-.18,.39],[-.09,.23]];
 const ps=[0,.025,0],idx=[];for(let i=0;i<shape.length;i++){ps.push(shape[i][0],.05*Math.abs(shape[i][0])+.022*Math.cos(i*2),shape[i][1]);idx.push(0,(i+1)%shape.length+1,i+1)}
 material.side=T.DoubleSide;const l=mesh(p,geometry(ps,idx),material,x,y,z);l.scale.setScalar(sz);return l
}
for(let k=0;k<4;k++){const bx=5.1+k*.23,by=3.0+k*.32,bz=-4.1-k*.7;pipe(far,[[bx+3,by-1,bz],[bx+.9,by-.1,bz],[bx-.6,by+.5,bz],[bx-1.6,by+.52,bz]],.054,frame);
 for(let i=0;i<20;i++){const l=leaf(far,bx-1.9+rand()*3.1,by+.4+rand()*.53,bz+(rand()-.5)*.7,.40+rand()*.65,leaves[i%4]);l.rotation.set(1.0+rand()*.6,rand(),rand()*6)}}
leaf(booth,3.85,.016,1.98,.51,leaves[0]).rotation.y=-.8;leaf(booth,-2.63,.012,-1.20,.39,leaves[1]).rotation.y=1.6;
batch(booth);
const cooking=G(scene),baseG=G(cooking),pan=G(cooking),lower=die(pan),hinge=G(pan),upper=die(hinge);
const YPAN=.97;pan.position.y=YPAN;
hinge.position.set(0,0,-.93);upper.group.position.z=-.93;upper.group.scale.z=-1;
const lowGrip=grip(lower.group,false),topGrip=grip(upper.group,false);
const stainless=surface(0x9b9c89,.39,.67);
for(const x of [-.77,-.35,.31,.74]){
 cylinder(pan,V(x-.13,-.055,-.93),V(x+.13,-.055,-.93),.112,.112,M.lip);
 tile(pan,.20,.42,.12,.038,M.underside,x,-.18,-.77);
}
cylinder(pan,V(-.98,-.055,-.93),V(.96,-.055,-.93),.055,.055,stainless);
for(const x of [-.99,.98])ell(pan,x,-.055,-.93,.048,.083,.083,M.brassDark);
const stoveBlue=surface(0x48616a,.37,.47);
tile(baseG,3.72,1.77,.42,.22,stoveBlue,0,.17,-.13);
tile(baseG,3.84,1.86,.074,.21,M.black,0,.57,-.13);
tile(baseG,3.58,1.62,.09,.22,M.underside,0,.077,-.13);
tile(baseG,3.34,1.43,.032,.32,M.underside,0,.66,-.13);
for(const x of [-1.45,1.45])for(const z of [-.72,.44])ell(baseG,x,.07,z,.19,.12,.16,M.black);
const coals=surface(0x9d5634,.63,0,'iron',{emissive:0xad3b13,emissiveIntensity:.6});
for(let i=0;i<10;i++){
 const x=-1.29+i*.286;const vent=ell(baseG,x,.405,.775,.075,.083,.018,M.black);vent.rotation.z=-.14;
 ell(baseG,x,.400,.791,.037,.054,.009,coals).rotation.z=-.14
}
for(const x of [-1.53,1.53])ell(baseG,x,.40,.77,.047,.048,.023,M.brass);
for(const x of [-1.23,-.65,.08,.78,1.24])ell(baseG,x,.68,-.14,.25,.07,.36,coals);
batch(baseG);
const basket=G(scene);
function makeBasket(){
 const g=G(basket);g.scale.set(1.12,1,.77);
 const bamboo2=surface(0xbc925c,.70,0,'wood'),light=surface(0xd3b47f,.65,0,'wood');
 lathe(g,[[.01,.09],[1.20,.09],[1.40,.18],[1.54,.34],[1.55,.38],[1.48,.37],[1.37,.23],[1.16,.14],[.01,.14]],bamboo2,72);
 for(let i=0;i<4;i++)ring(g,0,.24+i*.04,0,1.416+i*.044,.023,i%2?M.bamboo:light);
 ring(g,0,.405,0,1.57,.049,light);
 for(let i=0;i<62;i++){const th=i*PI*2/62,ux=Math.cos(th),uz=Math.sin(th);
 pipe(g,[[1.37*ux,.19,1.37*uz],[1.49*ux,.295,1.49*uz],[1.567*ux,.414,1.567*uz],[1.597*ux,.398,1.597*uz]],.022,M.bamboo,5)}
 for(let k=-8;k<=8;k++){const x=k*.14,d=Math.sqrt(1.25*1.25-x*x);box(g,x,.158,0,.044,.019,2*d,light);box(g,0,.181,x,2*d,.016,.055,M.bamboo)}
 const parchment=surface(0xe6dec6,.90,0,'linen');
 function nap(u,v){let x=(u-.5)*2.72,z=(v-.5)*1.76;return [x,.225+.03*Math.cos(7*x+z)+.082*(Math.abs(x)/1.36)**5+.063*(Math.abs(z)/.88)**6,z]}
 const paper=cloth(g,3,2,nap,22,14,parchment);paper.rotation.y=.18;
 for(const offset of [.08,.105,.925]){const stripe=cloth(g,1,1,(u,v)=>{const a=nap(u,offset+.012*v);a[1]+=.006;return a},20,1,M.blue);stripe.rotation.y=.18}
 batch(g);
 const sample=pastry(basket);sample.group.position.set(.025,.50,-.015);sample.group.scale.setScalar(.85);sample.group.rotation.set(-.07,-.20,.045);return sample
}
const sample=makeBasket();
const pot=G(scene),potM=surface(0xa1afb0,.26,.08);
// Glazed stoneware with two cobalt slip bands.
lathe(pot,[[.01,0],[.41,0],[.49,.07],[.59,.33],[.64,.63],[.62,.72],[.57,.76],[.53,.735],[.52,.63],[.45,.34],[.01,.31]],potM);
for(const h of [.54,.59])ring(pot,0,h,0,.624+(h-.54)*.11,.012,M.blueDark);
ring(pot,0,.737,0,.575,.032,M.glaze);
const batterMat=surface(0xf4dfad,.23);ell(pot,0,.642,0,.54,.034,.54,batterMat);
batch(pot);
const ladle=G(scene),cup=lathe(ladle,[[.005,-.187],[.14,-.17],[.253,-.106],[.312,-.012],[.32,.069],[.313,.098],[.294,.10],[.285,.073],[.266,.023],[.19,-.064],[.01,-.103]],M.brass,44);
ring(ladle,0,.089,0,.309,.014,stainless);ell(ladle,0,.060,0,.292,.035,.292,batterMat);
cylinder(ladle,V(-.16,-.07,.10),V(-.49,.08,.38),.045,.052,M.brass);
const ladleHandle=rod(ladle,V(-.43,.055,.33),V(-1.18,.47,.99),[[.048,0],[.063,.05],[.072,.63],[.088,.91],[.074,.98],[.01,1]],M.handle);
const stir=G(scene),blade=ell(stir,0,0,0,.23,.053,.36,M.bamboo);rod(stir,V(0,0,.18),V(-.11,.13,1.35),[[.087,0],[.065,.17],[.077,.85],[.079,.95],[.015,1]],M.handle);ell(stir,0,.083,-.03,.18,.12,.23,M.bean);
const anCup=G(scene);lathe(anCup,[[.01,0],[.29,0],[.40,.1],[.46,.42],[.46,.48],[.415,.48],[.39,.38],[.29,.1],[.01,.09]],M.glaze);ring(anCup,0,.45,0,.442,.015,M.blueDark);ell(anCup,0,.402,0,.408,.082,.408,M.bean);batch(anCup);
const grand=hand(scene,M.skin,M.blueDark,1.24),kid=hand(scene,M.child,M.ivory,.94),guest=hand(scene,M.child,surface(0x946f60,.85,0,'linen'),1.05);
batch(grand);batch(kid);batch(guest);
const bagG=G(scene),bagBody=G(bagG);const kraft=surface(0xcda977,.84,0,'linen'),fold=surface(0xb39366,.84,0,'linen'),redInk=surface(0xa95f46,.88);
function paperBag(){
 // Flat-bottom paper sleeve open towards the fish head (local -x).
 const back=(u,v)=>{let x=-.58+1.96*u,z=(v-.5)*(1.42-.32*u);return [x,.026+.038*(Math.abs(z)*1.4)**3,z]};
 cloth(bagBody,1,1,back,14,8,M.paper);
 const face=(u,v)=>{const x=-.44+1.82*u+.022*Math.cos(v*24)*(1-u),z=(v-.5)*(1.4-.30*u);
 return [x,.112+.34*(1-u)*Math.sin(PI*v)**.50+.06*(1-u),z]};
 cloth(bagBody,1,1,face,16,12,kraft);
 for(const v of [0,1])cloth(bagBody,1,1,(u,t)=>{const a=back(u,v),b=face(u,v);return [a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t+.035*Math.sin(t*PI)*(v?1:-1)]},12,3,fold);
 for(const u0 of [.79,.83])cloth(bagBody,1,1,(u,v)=>{const q=face(u0+u*.012,v);q[1]+=.006;return q},1,12,redInk);
 const stamp=crest(bagBody,.32,.402,.02,.38,redInk);stamp.rotation.x=-PI/2;stamp.rotation.z=-.18;
 batch(bagBody)
}
paperBag();
