/* Physical props are built from profiles, swept outlines and solid meshes. */
'use strict';
const Studio=(()=>{
const T=THREE,TAU=Math.PI*2;
let seed=120831;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function tex(canvas,repeat=1){const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function canvas(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
function surfaceMap(kind,n=256){
 const c=canvas(n),ctx=c.getContext('2d'),raw=ctx.createImageData(n,n);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const a=i/n*TAU,b=j/n*TAU,h=rand()-.5;let col,v;
   if(kind==='wood'){v=Math.sin(b*26+Math.sin(a*2)*.9+Math.sin(a+b*5)*1.5)*3+Math.sin(b*57+Math.sin(a)*2)*1.7+h*6+Math.sin(b*3)*3;col=[193,142,91];}
   if(kind==='linen'){
     const u=i%64,w=j%64;
     const warp=u<2||u===6||u===60, weft=w<2||w===6||w===60;
     v=(warp?22:0)+(weft?15:0)+((i+j)%2?2:-2)+h*9;
     col=[89,132,144];
   }
   if(kind==='towel'){const b=i%64;v=(b<4||b===8||b===59)?-66:0;v+=h*12+(j%2?2:-2);col=[230,220,196];}
   if(kind==='skin'||kind==='crumb'){
     v=(Math.sin(a*3+Math.cos(b*2))*Math.cos(b*4)+Math.sin(a*9+Math.sin(b*8))*.32)*5+h*15;
     col=kind==='skin'?[224,164,84]:[252,208,126];
   }
   if(kind==='paper'){col=[238,225,193];v=h*8+Math.sin(3*a+2*b)*2;}
   if(kind==='rough'){col=[199,199,199];v=h*34;}
   const k=(j*n+i)*4;for(let l=0;l<3;l++)raw.data[k+l]=col[l]+v;raw.data[k+3]=255;
 }
 ctx.putImageData(raw,0,0);
 if(kind==='skin'||kind==='crumb'){
   const side=kind==='crumb';
   for(let i=0;i<(side?2700:1800)*(n/256)**2;i++){
     const x=rand()*n,y=rand()*n,r=(.16+rand()**3*(side?3.4:1.7))*n/256;
     ctx.fillStyle=side?'rgba(255,239,167,.78)':'rgba(255,219,149,.48)';
     ctx.beginPath();ctx.ellipse(x+.2,y+.75*r,r*1.13,r*.88,0,0,TAU);ctx.fill();
     const grad=ctx.createRadialGradient(x,y-r*.26,0,x,y,r*1.2);
     grad.addColorStop(0,side?'rgba(143,83,27,.70)':'rgba(151,89,40,.59)');grad.addColorStop(1,'rgba(183,123,50,.02)');
     ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(x,y,r*1.1,r,0,0,TAU);ctx.fill();
   }
 }
 return tex(c);
}
const rough=surfaceMap('rough',64);rough.repeat.set(4,4);rough.colorSpace=T.NoColorSpace;
function mat(color,roughness=.6,extra={}){return new T.MeshStandardMaterial({color,roughness,roughnessMap:rough,...extra});}
const pendingTextures=new Map();
function mapped(kind,ro=.75){
 const m=surfaceMap(kind,64);
 if(!pendingTextures.has(kind))pendingTextures.set(kind,[]);pendingTextures.get(kind).push(m);
 return mat(0xffffff,ro,{map:m,bumpMap:m,bumpScale:kind==='linen'?.009:.014});
}
function refine(){
 const first=pendingTextures.entries().next();if(first.done)return false;
 const [kind,maps]=first.value,detail=surfaceMap(kind,256);
 for(const m of maps){m.image=detail.image;m.needsUpdate=true;}
 pendingTextures.delete(kind);detail.dispose();return pendingTextures.size>0;
}
function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function group(parent,x=0,y=0,z=0){const o=new T.Group();parent.add(o);o.position.set(x,y,z);return o;}
const ball=new T.SphereGeometry(1,22,14),smallBall=new T.SphereGeometry(1,10,7);
function oval(parent,m,x,y,z,a,b,c){const o=mesh(Math.max(a,b,c)<.13?smallBall:ball,m,parent,x,y,z);o.scale.set(a,b,c);return o;}
function box(parent,m,x,y,z,w,h,d){return mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z);}
function brim(parent,m,x,y,z,r,t){const o=mesh(new T.TorusGeometry(r,t,9,96),m,parent,x,y,z);o.rotation.x=Math.PI/2;return o;}
function turned(parent,m,profile,seg=72,flute=0,count=24){
 const g=new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),seg);
 if(flute){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),f=1+flute*Math.cos(Math.atan2(z,x)*count);p.setXYZ(i,x*f,p.getY(i),z*f);}g.computeVertexNormals();}
 return mesh(g,m,parent);
}
function rounded(w,h,r){
 const s=new T.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function solid(parent,m,shape,depth,bevel=.025){
 const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:12});
 g.rotateX(-Math.PI/2);return mesh(g,m,parent);
}
function rod(parent,m,from,to,r,r2=r){const a=new T.Vector3(...from),b=new T.Vector3(...to),o=mesh(new T.CylinderGeometry(r2,r,b.distanceTo(a),14),m,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());return o;}
function tube(parent,m,pts,r){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),20,r,7,false),m,parent);}
const porcelain=mat(0xfff3d9,.24), stripe=mat(0x487580,.28),steel=mat(0xe7e6e0,.125,{metalness:.96}),wood=mapped('wood',.44),cream=mat(0xfff9e7,.32);
const ruby=mat(0xaa211e,.29),pulp=mat(0xf64536,.23),heart=mat(0xff9581,.33),pip=mat(0xf4c170,.36),leaf=mat(0x557949,.56);
function plate(parent,r,fluted=true){
 const g=group(parent);turned(g,porcelain,[[.01,.03],[r*.54,.026],[r*.67,.046],[r*.94,.145],[r,.162],[r*.997,.186],[r*.965,.199],[r*.88,.164],[r*.71,.087],[r*.57,.073],[.001,.071]],112,fluted?.009:0,22);
 brim(g,stripe,0,.164,0,r*.905,.009);brim(g,stripe,0,.173,0,r*.926,.004);return g;
}
function bowl(parent){
 const g=group(parent);turned(g,porcelain,[[.005,.026],[.34,.029],[.4,.064],[.48,.158],[.63,.30],[.725,.52],[.717,.551],[.685,.554],[.652,.5],[.57,.315],[.4,.16],[.26,.115],[.002,.112]],100,.007,30);
 brim(g,stripe,0,.549,0,.702,.016);brim(g,stripe,0,.496,0,.703,.008);brim(g,stripe,0,.462,0,.686,.005);return g;
}
// Each berry has a tapered solid silhouette, a juicy cut face and inset seed rows.
const berryCache=[];
function berry(parent,variant=0){
 if(berryCache[variant]){const o=berryCache[variant].clone();parent.add(o);return o;}
 const g=group(parent);const h=.53,w=.193,s=new T.Shape();
 s.moveTo(0,-h*.53);s.bezierCurveTo(-.06,-h*.51,-w*.99,.012,-w,.105);s.bezierCurveTo(-w*1.03,.226,-w*.62,.27,0,.235);s.bezierCurveTo(w*.68,.273,w*1.04,.216,w,.111);s.bezierCurveTo(w,.01,.07,-h*.47,0,-h*.53);
 const body=solid(g,ruby,s,.062,.023);body.position.y=.001;
 const flesh=solid(g,pulp,s,.005,.004);flesh.scale.set(.938,1,.951);flesh.position.y=.084;
 const core=solid(g,heart,s,.003,.002);core.scale.set(.36,1,.66);core.position.set(0,.095,-.032);
 for(let i=0;i<13;i++){
   const dir=i%2?1:-1,q=(Math.floor(i/2)+.5)/7, z=-.195+.36*q, width=.184*(1-q*.66);
   const a=oval(g,pip,dir*width*.84,.09,z,.009,.004,.018);a.rotation.y=dir*(.14+q*.28);
   const vein=oval(g,heart,dir*width*.55,.092,z,.004,.003,.028);vein.rotation.y=-dir*.62;
 }
 berryCache[variant]=g.clone();return g;
}
function handle(g,start,length,width){
 const p=group(g,0,.12,start);p.rotation.x=Math.PI/2;
 turned(p,wood,[[.01,0],[width*.65,.01],[width,.06],[width*.87,length*.48],[width*1.04,length*.85],[width*.96,length*.96],[width*.65,length],[.001,length+.014]],36);
 for(const z of [.16,length-.16])oval(g,steel,0,.12+width*.91,start+z,.025,.012,.025);
 return p;
}
function utensil(parent,type){
 const g=group(parent),s=new T.Shape();let l;
 if(type==='spatula'){s.moveTo(-.02,0);s.bezierCurveTo(-.26,0,-.32,.11,-.3,.27);s.lineTo(-.18,.85);s.quadraticCurveTo(-.1,.96,-.08,1.03);s.lineTo(.08,1.03);s.lineTo(.18,.85);s.lineTo(.30,.27);s.bezierCurveTo(.32,.1,.22,0,-.02,0);l=1.03;}
 if(type==='server'){s.moveTo(0,0);s.quadraticCurveTo(-.08,.03,-.34,.89);s.quadraticCurveTo(-.36,.99,-.26,1.01);s.lineTo(.24,1.01);s.quadraticCurveTo(.33,1,.30,.87);s.lineTo(.045,.02);s.closePath();l=1.03;}
 if(type==='knife'){s.moveTo(0,0);s.bezierCurveTo(-.16,.075,-.237,.34,-.207,1.16);s.lineTo(.10,1.24);s.lineTo(.103,.17);s.quadraticCurveTo(.09,.025,0,0);l=1.24;}
 const blade=solid(g,steel,s,.023,.012);blade.rotation.y=Math.PI;
 rod(g,steel,[0,.019,l-.08],[0,.12,l+.25],.067,.056);handle(g,l+.18,type==='knife'?.86:.95,type==='server'?.09:.115);
 return g;
}
function blossomPitcher(parent){
 const g=group(parent),jug=mat(0xb7c6bd,.23);turned(g,jug,[[.02,.01],[.24,.015],[.27,.06],[.33,.35],[.33,.52],[.23,.64],[.20,.75],[.215,.78],[.19,.79],[.163,.73],[.15,.65]],72,.009);
 tube(g,jug,[[.25,.61,0],[.49,.63,0],[.51,.43,0],[.32,.29,0]],.047);
 const stem=mat(0x627e44,.66),petal=mat(0xfff7e5,.42),center=mat(0xebac3c,.69);
 for(let i=0;i<5;i++){
  const x=(rand()-.5)*1.13,z=(rand()-.5)*.71,y=1.19+rand()*.55;
  tube(g,stem,[[0,.41,0],[x*.45,.88,z*.33],[x,y,z]],.015);
  const flower=group(g,x,y,z);flower.rotation.x=.25+rand()*.65;flower.rotation.z=rand()*.6-.3;
  for(let j=0;j<8;j++){const a=j*TAU/8,o=oval(flower,petal,Math.sin(a)*.078,.011,Math.cos(a)*.078,.044,.019,.083);o.rotation.y=a;}
  oval(flower,center,0,.033,0,.052,.028,.054);
  const f=oval(g,leaf,x*.66+.06,y*.72,z*.6,.068,.018,.14);f.rotation.z=.41;f.rotation.y=1.2;
 }return g;
}
function hand(parent,child=false){
 const g=group(parent),skin=mat(child?0xecaf86:0xdba27b,.52),nail=mat(child?0xf4c7a7:0xe8b693,.42);
 const cloth=mat(child?0xddb768:0x7e9aa3,.85);
 // The arm continues off the table. Overlapping phalanges follow a relaxed arch.
 const sleeve=rod(g,cloth,[0,.22,-.67],[.13,.48,-2.65],.287,.39);
 const cuff=rod(g,cloth,[0,.22,-.70],[0,.20,-.49],.301,.287);
 for(let j=0;j<12;j++){const a=j*TAU/12;rod(g,cloth,[.285*Math.cos(a),.22+.285*Math.sin(a),-.67],[.282*Math.cos(a),.20+.282*Math.sin(a),-.52],.012);}
 oval(g,skin,0,.21,-.39,.238,.145,.40);oval(g,skin,0,.17,-.025,.272,.142,.34);
 for(let i=0;i<4;i++){
  const x=(i-1.5)*.124,z=[.41,.46,.419,.34][i]*(child&&i===0?1.33:1),spread=(i-1.5)*.025;
  const finger=oval(g,skin,x,.15,.18,.075,.079,z*.57);finger.rotation.x=.15;finger.rotation.y=spread;
  const tip=oval(g,skin,x+spread,.096,z,.065,.069,.143);tip.rotation.x=.24;
  oval(g,nail,x+spread,.155,z+.047,.043,.012,.066).rotation.x=.21;
 }
 const thumb=oval(g,skin,-.254,.123,-.005,.105,.099,.244);thumb.rotation.y=-.73;
 oval(g,skin,-.367,.095,.114,.079,.079,.131).rotation.y=-.63;
 if(child)g.scale.setScalar(.79);return g;
}
function exemplar(parent){
 const g=group(parent),crumb=mapped('crumb'),gold=mat(0xcf8c46,.62);
 const body=mesh(new T.CylinderGeometry(.445,.445,.46,72),crumb,g);body.rotation.x=Math.PI/2;body.position.y=.46;
 const crust=mesh(new T.CylinderGeometry(.451,.451,.451,72,1,true),gold,g);crust.rotation.x=Math.PI/2;crust.position.y=.46;
 for(const dir of [-1,1]){
  const pts=[];for(let j=0;j<=100;j++){const a=j/100*Math.PI*3.22,r=.035+.363*j/100;pts.push([Math.sin(a)*r,.46+Math.cos(a)*r,dir*.233]);}
  tube(g,cream,pts,.036);
  for(let j=0;j<3;j++){const a=2+j*2.91,r=.10+j*.083;oval(g,pulp,Math.sin(a)*r,.46+Math.cos(a)*r,dir*.25,.048,.057,.014);}
 }const b=berry(g);b.scale.setScalar(.72);b.position.set(-.021,.908,.015);b.rotation.x=.21;b.rotation.z=.15;
 return g;
}
return {T,TAU,rand,refine,mesh,group,box,oval,brim,turned,solid,rounded,rod,tube,mat,mapped,surfaceMap,tex,canvas,wood,cream,porcelain,stripe,steel,ruby,pulp,pip,plate,bowl,berry,utensil,blossomPitcher,hand,exemplar};
})();
