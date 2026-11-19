'use strict';
const T=THREE,D=Die,PI=Math.PI;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const G=(parent)=>{const g=new T.Group();if(parent)parent.add(g);return g};
const col=x=>new T.Color(x);
let seed=92033;
const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
function surface(color,roughness=.6,metalness=0,kind='plain',props={}){
  const m=new T.MeshStandardMaterial({color,roughness,metalness,...props});
  m.onBeforeCompile=sh=>{
    sh.vertexShader='varying vec3 vStock;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStock=position;');
    sh.fragmentShader=`varying vec3 vStock;
    float hashStock(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
    float stockNoise(vec3 p){vec3 i=floor(p);vec3 f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hashStock(i),hashStock(i+vec3(1,0,0)),f.x),mix(hashStock(i+vec3(0,1,0)),hashStock(i+vec3(1,1,0)),f.x),f.y),mix(mix(hashStock(i+vec3(0,0,1)),hashStock(i+vec3(1,0,1)),f.x),mix(hashStock(i+vec3(0,1,1)),hashStock(i+vec3(1,1,1)),f.x),f.y),f.z);}
    `+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float grain=stockNoise(vStock*85.);
    ${kind==='wood'?`vec3 p=vStock;
      float ribbon=stockNoise(p*vec3(.7,2.,6.));float line=.5+.5*sin(p.z*94.+p.y*73.+ribbon*9.+stockNoise(p*vec3(1.2,2.,14.))*3.);
      diffuseColor.rgb*=.84+.22*ribbon+.12*grain-.145*pow(line,7.)+.07*stockNoise(p*vec3(.9,16.,33.));`:
      kind==='turned'?`float curl=stockNoise(vStock*vec3(12.,.9,12.));float fibre=sin(99.*vStock.x+53.*vStock.z+curl*5.);diffuseColor.rgb*=.88+.15*curl+.08*grain+.045*fibre;`:
      kind==='iron'?`diffuseColor.rgb*=.78+.33*grain+.17*stockNoise(vStock*5.);`:
      kind==='linen'?`float weave=sin(vStock.x*300.)*sin((vStock.y+vStock.z)*283.);diffuseColor.rgb*=.91+.11*grain+.036*weave;`:
      kind==='bread'?`diffuseColor.rgb*=.90+.14*grain+.11*stockNoise(vStock*12.);`:'diffuseColor.rgb*=.965+.065*grain;'}
    ${m.userData.coverage?'if(vCover<.032)discard;diffuseColor.rgb*=.88+.12*smoothstep(.032,.14,vCover);':''}`)
    .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(grain-.5)*.095,.04,1.);');
    if(m.userData.coverage){sh.vertexShader='attribute float amount;varying float vCover;\n'+sh.vertexShader.replace('vStock=position;','vStock=position;vCover=amount;');sh.fragmentShader='varying float vCover;\n'+sh.fragmentShader}
    if(m.userData.wetFilm){
      sh.vertexShader='attribute float wetness; varying float vWetness;\n'+sh.vertexShader.replace('vStock=position;','vStock=position;vWetness=wetness;');
      sh.fragmentShader='varying float vWetness;\n'+sh.fragmentShader.replace('#include <metalnessmap_fragment>','roughnessFactor=clamp(roughnessFactor*(1.-.54*vWetness),.12,1.);\n#include <metalnessmap_fragment>');
    }
  };
  m.customProgramCacheKey=()=>kind+(m.userData.coverage?'cover':'')+(m.userData.wetFilm?'film':'');
  return m
}
const M={
  iron:surface(0x42484a,.58,.65,'iron'),lip:surface(0x666a66,.39,.77,'iron'),underside:surface(0x323938,.74,.4,'iron'),black:surface(0x2e3230,.42,.28),
  brass:surface(0xa58750,.37,.67),brassDark:surface(0x776045,.52,.48),
  handle:surface(0xb97d46,.41,0,'turned'),walnut:surface(0x755139,.47,0,'wood'),bamboo:surface(0xc69a5d,.56,0,'wood'),
  blue:surface(0x425e68,.77,0,'linen'),blueDark:surface(0x2a4650,.78,0,'linen'),ivory:surface(0xe7d9ba,.84,0,'linen'),
  glaze:surface(0xc6c9b7,.23,.06),enamel:surface(0x506973,.33,.46),paper:surface(0xe1c898,.89,0,'linen'),
  pastry:surface(0xffffff,.60,0,'bread',{vertexColors:true}),raw:surface(0xffe6ab,.24,0,'plain',{vertexColors:true}),
  bean:surface(0x5a2e31,.34,0,'bread'),skin:surface(0xc59172,.73),child:surface(0xe5b698,.70)
};
function mesh(p,geo,mat,x=0,y=0,z=0){
 const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o
}
const boxGeo=new T.BoxGeometry();
function box(p,x,y,z,w,h,d,m){const a=mesh(p,boxGeo,m,x,y,z);a.scale.set(w,h,d);return a}
function ell(p,x,y,z,rx,ry,rz,m){const a=mesh(p,ball,m,x,y,z);a.scale.set(rx,ry,rz);return a}
const ball=new T.SphereGeometry(1,20,14);
function cylinder(p,a,b,r1,r2,m,n=20){
  const v=b.clone().sub(a),o=mesh(p,new T.CylinderGeometry(r2,r1,v.length(),n),m);o.position.copy(a).addScaledVector(v,.5);o.quaternion.setFromUnitVectors(V(0,1,0),v.normalize());return o
}
function pipe(p,coords,r,m,n=6){
 const pts=coords.map(p=>Array.isArray(p)?V(...p):p),curve=new T.CatmullRomCurve3(pts);
 return mesh(p,new T.TubeGeometry(curve,Math.max(8,(pts.length-1)*4),r,n,false),m)
}
function lathe(p,profile,m,n=48){
 return mesh(p,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(Math.max(.0001,r),y)),n),m)
}
function rod(p,a,b,profile,m,n=24){
 const dir=b.clone().sub(a),o=lathe(p,profile.map(([r,t])=>[r,t*dir.length()]),m,n);
 o.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize());o.position.copy(a);return o
}
function ring(p,x,y,z,r,t,m){let o=mesh(p,new T.TorusGeometry(r,t,8,64),m,x,y,z);o.rotation.x=PI/2;return o}
function tile(p,w,d,h,r,m,x=0,y=0,z=0){
 const sh=new T.Shape();let a=-w/2,b=-d/2;sh.moveTo(a+r,b);sh.lineTo(-a-r,b);sh.quadraticCurveTo(-a,b,-a,b+r);sh.lineTo(-a,-b-r);sh.quadraticCurveTo(-a,-b,-a-r,-b);sh.lineTo(a+r,-b);sh.quadraticCurveTo(a,-b,a,-b-r);sh.lineTo(a,b+r);sh.quadraticCurveTo(a,b,a+r,b);
 const geo=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:true,bevelThickness:.025,bevelSize:.028,bevelSegments:2,curveSegments:5});geo.rotateX(-PI/2);return mesh(p,geo,m,x,y,z)
}
function geometry(pos,indices,colors,amount){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(indices);
 if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));if(amount)g.setAttribute('amount',new T.Float32BufferAttribute(amount,1));
 g.computeVertexNormals();g.computeBoundingSphere();return g
}
function cloth(p,w,h,f,nx,ny,m){
 const ps=[],idx=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){ps.push(...f(i/nx,j/ny));if(j&&i){const k=j*(nx+1)+i;idx.push(k-nx-2,k-nx-1,k,k-nx-2,k,k-1)}}
 m.side=T.DoubleSide;return mesh(p,geometry(ps,idx),m)
}
function grid(nx,nz,range=[0,1]){
 const pos=[],ind=[],color=[],meta=[],eCache=[];
 for(let i=0;i<=nx;i++){let u=range[0]+(range[1]-range[0])*i/nx;eCache.push(D.edges(u))}
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const u=range[0]+(range[1]-range[0])*i/nx,v=j/nz*2-1,{x,z}=D.point(u,v,eCache[i]),h=D.relief(u,v,x,z);
  meta.push({u,v,x,z,h});pos.push(x,h,z);color.push(1,1,1);if(i&&j){const k=j*(nx+1)+i;ind.push(k-nx-2,k-1,k,k-nx-2,k,k-nx-1)}
 }
 return {pos,ind,color,meta}
}
const toasted=col(0xb36932),caramel=col(0xe7a752),biscuit=col(0xf0c47d),brown=col(0x91512e);
function fishSurface(p,type,nx,nz,range=[0,1]){
 const q=grid(nx,nz,range),c=new T.Color(),pastry=type==='pastry',dynamic=type==='batter'||type==='coat';
 q.meta.forEach(({u,v,x,z,h},i)=>{
  q.pos[i*3+1]=pastry?h:type==='shell'?-.23-h*.64:-h*.91;
  if(pastry){
    const crest=h-D.relief(u,D.clamp(v+.057,-1,1),x,z+.034);
    const browning=D.clamp(.24+2.75*crest+.22*Math.cos(4.2*x+1.6*z)+.13*Math.sin(7*x-6*z)+.13*Math.sin(11*z+2*x),0,1);
    c.copy(biscuit).lerp(caramel,.56).lerp(toasted,browning).lerp(brown,.12*D.smooth(.75,1,Math.abs(v)));c.toArray(q.color,i*3)
  }
 });
 const g=geometry(q.pos,q.ind,pastry||dynamic?q.color:null,dynamic?new Float32Array(q.meta.length):null),m=pastry?M.pastry:type==='shell'?M.underside:M.iron;
 if(dynamic){
  const wet=surface(0xffffff,.48,0,'plain',{vertexColors:true});wet.userData.coverage=true;wet.userData.wetFilm=true;
  g.setAttribute('wetness',new T.Float32BufferAttribute(new Float32Array(q.meta.length),1));
  const o=mesh(p,g,wet);o.castShadow=false;o.userData.meta=q.meta;return o
 }
 return mesh(p,g,m)
}
function outline(n=70){
 const pts=[];for(let i=0;i<=n;i++)pts.push(D.point(i/n,-1));
 for(let j=1;j<=24;j++)pts.push(D.point(1,j/12-1));
 for(let i=n-1;i>=0;i--)pts.push(D.point(i/n,1));
 for(let j=1;j<10;j++)pts.push(D.point(0,1-j*.2));return pts
}
const contour=outline();
function band(p,layers,m,pts=contour){
 const ps=[],idx=[];for(let k=0;k<layers.length;k++){const [sx,sz,y]=layers[k];
 pts.forEach(({x,z},i)=>{ps.push(x*sx,y,z*sz);if(k){const n=pts.length,a=(k-1)*n+i,b=(k-1)*n+(i+1)%n;idx.push(a,b,b+n,a,b+n,a+n)}})}
 m.side=T.DoubleSide;return mesh(p,geometry(ps,idx),m)
}
function die(p){
 const a=G(p);const inner=fishSurface(a,'iron',90,38);const shell=fishSurface(a,'shell',46,20);shell.material.side=T.DoubleSide;
 band(a,[[1,1,-.047],[1.017,1.055,-.014],[1.05,1.14,.005],[1.071,1.21,-.02]],M.lip);
 band(a,[[1.071,1.21,-.02],[1.075,1.225,-.065],[1.06,1.18,-.185],[1.0,1,-.262]],M.underside);
 return {group:a,inner}
}
function pastry(p,cut=false){
 const a=G(p),parts=[];
 for(const range of cut?[[0,.69],[.69,1]]:[[0,1]]){
  const part=G(a);const top=fishSurface(part,'pastry',Math.ceil(102*(range[1]-range[0])),45,range);
  const base=new T.Mesh(top.geometry,M.pastry);base.scale.y=-.61;base.castShadow=true;part.add(base);parts.push(part)
 }
 band(parts[0],[[1,1,.025],[1.012,1.019,0],[1,1,-.024]],surface(0xc78c49,.68,0,'bread'),cut?outlineSegment(0,.69):contour);
 if(cut)band(parts[1],[[1,1,.025],[1.011,1.019,0],[1,1,-.024]],surface(0xc78c49,.68,0,'bread'),outlineSegment(.69,1));
 return {group:a,parts}
}
function outlineSegment(lo,hi){
 let pts=[];for(let i=0;i<=45;i++)pts.push(D.point(lo+(hi-lo)*i/45,-1));
 for(let j=1;j<=16;j++)pts.push(D.point(hi,j/8-1));
 for(let i=45;i>=0;i--)pts.push(D.point(lo+(hi-lo)*i/45,1));for(let j=1;j<=16;j++)pts.push(D.point(lo,1-j/8));return pts
}
function grip(p,upper){
 const g=G(p),z=upper?-1:1;g.scale.z=z;
 tile(g,.53,.56,.13,.12,M.underside,-.12,-.235,.84);
 cylinder(g,V(-.12,-.14,.82),V(-.12,-.13,1.59),.108,.098,M.lip);
 cylinder(g,V(-.12,-.13,1.43),V(-.12,-.13,1.62),.151,.147,M.brassDark);
 const handle=rod(g,V(-.12,-.13,1.55),V(-.12,-.13,2.93),[[.074,0],[.13,.024],[.137,.09],[.114,.24],[.13,.55],[.148,.83],[.136,.94],[.111,.987],[.013,1]],M.handle);
 for(let k=0;k<2;k++)cylinder(g,V(-.12,-.13,1.64+k*.055),V(-.12,-.13,1.661+k*.055),.14,.14,M.walnut);
 return {group:g,handle}
}
function hand(p,skin,sleeve,scale=1){
 // The palm continues into the wrist. All digits taper naturally towards the worktop.
 const g=G(p);g.scale.setScalar(scale);const wrist=G(g);
 rod(wrist,V(0,.07,.10),V(0,.18,1.10),[[.14,0],[.155,.06],[.177,.41],[.208,1]],skin);
 const cuff=rod(wrist,V(0,.12,.53),V(.02,.30,1.65),[[.215,0],[.228,.05],[.21,.12],[.24,.24],[.25,.47],[.30,1]],sleeve);
 rod(wrist,V(0,.122,.55),V(0,.13,.64),[[.219,0],[.224,.25],[.224,.76],[.22,1]],M.ivory);
 ell(wrist,0,.015,-.066,.23,.131,.32,skin);
 const nail=surface(skin===M.skin?0xc89e84:0xe4bda3,.51);
 for(let i=0;i<4;i++){const x=(i-1.5)*.104,end=[-.50,-.57,-.54,-.455][i],a=V(x,.021,-.22),b=V(x*1.18,-.014,end+.09),c=V(x*1.22,-.09,end);
  rod(wrist,a,b,[[.050,0],[.059,.3],[.054,.82],[.048,1]],skin,12);ell(wrist,b.x,b.y,b.z,.050,.052,.054,skin);rod(wrist,b,c,[[.05,0],[.046,.64],[.031,1]],skin,12);ell(wrist,c.x,c.y,c.z,.038,.041,.044,skin);ell(wrist,c.x,c.y+.030,c.z+.003,.026,.011,.034,nail)
 }
 const thumb=V(-.29,-.10,-.26);rod(wrist,V(-.13,.0,-.005),thumb,[[.09,0],[.092,.25],[.071,.63],[.057,1]],skin);ell(wrist,thumb.x,thumb.y,thumb.z,.061,.061,.074,skin);return g
}
