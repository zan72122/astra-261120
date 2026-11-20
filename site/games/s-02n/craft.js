'use strict';
const Art=(()=>{
const T=THREE,PI=Math.PI,TAU=PI*2;
let seed=53721;const rand=()=>((seed=Math.imul(1664525,seed)+1013904223|0)>>>0)/4294967296;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const group=(parent,x=0,y=0,z=0)=>{const g=new T.Group();parent?.add(g);g.position.set(x,y,z);return g};
const mat=(color,roughness=.76,extras={})=>new T.MeshStandardMaterial({color,roughness,...extras});
const disk=(r1,r2,h,n=48)=>new T.CylinderGeometry(r1,r2,h,n);
const geoBox=new T.BoxGeometry(1,1,1),geoBall=new T.SphereGeometry(1,24,16);
function mesh(parent,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);o.castShadow=true;o.receiveShadow=true;return o}
function box(g,x,y,z,w,h,d,m){const o=mesh(g,geoBox,m,x,y,z);o.scale.set(w,h,d);return o}
function oval(g,x,y,z,rx,ry,rz,m){const o=mesh(g,geoBall,m,x,y,z);o.scale.set(rx,ry,rz);return o}
function cyl(g,x,y,z,r1,r2,h,m,n=48){return mesh(g,disk(r1,r2,h,n),m,x,y,z)}
function tor(g,x,y,z,r,t,m){const o=mesh(g,new T.TorusGeometry(r,t,7,72),m,x,y,z);o.rotation.x=PI/2;return o}
function lathe(g,x,y,z,profile,m,n=64){const geo=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),n);return mesh(g,geo,m,x,y,z)}
function line(g,coords,r,m,n=16,sides=7){
  const pts=coords.map(p=>V(...p)),c=new T.CatmullRomCurve3(pts);
  return mesh(g,new T.TubeGeometry(c,n,r,sides,false),m)
}
function rod(g,a,b,r,m,r2=r,n=12){
  const av=V(...a),bv=V(...b),d=bv.clone().sub(av),o=mesh(g,disk(r2,r,d.length(),n),m);
  o.position.copy(av).lerp(bv,.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o
}
// Bake fixed carpentry and small details into material batches. Moving parts keep their local coordinates.
function batch(parent){
  parent.updateWorldMatrix(true,true);
  const inv=parent.matrixWorld.clone().invert(),buckets=new Map();
  const list=[];parent.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&!o.userData.keep)list.push(o)});
  for(const o of list){
    const m=o.material,geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    geo.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));
    const id=m.uuid+'-'+o.castShadow+'-'+o.receiveShadow;
    if(!buckets.has(id))buckets.set(id,{m,cast:o.castShadow,receive:o.receiveShadow,geos:[],count:0});
    const b=buckets.get(id);b.geos.push(geo);b.count+=geo.attributes.position.count;o.removeFromParent();
  }
  for(const b of buckets.values()){
    const geo=new T.BufferGeometry();
    for(const [name,size] of [['position',3],['normal',3],['uv',2]]){
      const data=new Float32Array(b.count*size);let off=0;
      for(const part of b.geos){const attr=part.attributes[name];if(attr)data.set(attr.array,off);off+=part.attributes.position.count*size}
      geo.setAttribute(name,new T.BufferAttribute(data,size))
    }
    const o=mesh(parent,geo,b.m);o.castShadow=b.cast;o.receiveShadow=b.receive;
    for(const part of b.geos)part.dispose()
  }
  return parent;
}
function tex(w,h,draw,repeat=true){
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t
}
const textures={},pending=[];
function textured(name,color,rough,bump=.025,extra={}){
  const m=mat(color,rough,extra);pending.push([m,name,bump]);return m
}
function makeTextures(){
  textures.wood=tex(768,256,(c,w,h)=>{
    c.fillStyle='#ebd2af';c.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=.63){
      const f=Math.sin(y*.16+Math.sin(y*.037)*5),a=rand();
      c.strokeStyle=f>.48?'rgba(105,66,36,'+(.036+a*.069)+')':'rgba(255,242,200,'+(.036+a*.10)+')';
      c.lineWidth=.45+rand()*1.5;c.beginPath();
      for(let x=0;x<=w;x+=6){const yy=y+Math.sin(x/w*TAU+y*.023)*(1.4+5*Math.sin(y*.034))+Math.sin(x/w*TAU*2+y*.05)*1.8;
        if(!x)c.moveTo(x,yy);else c.lineTo(x,yy)}c.stroke();
    }
    for(let i=0;i<2200;i++){c.fillStyle='rgba(103,64,35,'+rand()*.19+')';c.fillRect(rand()*w,rand()*h,1+rand()*23,.3+rand()*.5)}
  });
  textures.woven=tex(192,192,(c,w,h)=>{
    c.fillStyle='#ddd9ca';c.fillRect(0,0,w,h);
    for(let i=0;i<w;i+=2){c.fillStyle=i%4?'#e9e4d8':'#d7d2c6';c.fillRect(i,0,1,h);c.fillStyle=i%4?'rgba(245,242,231,.43)':'rgba(150,144,127,.22)';c.fillRect(0,i,w,1)}
    for(let i=0;i<800;i++){c.fillStyle='rgba(245,244,230,.45)';c.fillRect(rand()*w,rand()*h,1,rand()*4)}
  });
  textures.cloth=tex(512,512,(c,w,h)=>{
    c.drawImage(textures.woven.image,0,0,w,h);
    c.fillStyle='#254c58';c.fillRect(0,0,w,h);
    // Narrow dyed stripes with a running woven diamond border on both selvedges.
    for(const y of [19,488,41,468]){c.fillStyle='#e7dfc6';c.fillRect(0,y,w,3);c.fillStyle='#9ea9a0';c.fillRect(0,y+6,w,1)}
    for(const y of [64,445])for(let x=-16;x<w;x+=28){
      c.strokeStyle='#d7d4b9';c.lineWidth=2;c.beginPath();c.moveTo(x-8,y);c.lineTo(x,y-5);c.lineTo(x+8,y);c.lineTo(x,y+5);c.closePath();c.stroke();
      c.fillStyle='#c7a980';c.fillRect(x-1,y-1,2,2)
    }
    for(let i=0;i<w;i+=2){c.fillStyle=i%4?'rgba(244,238,208,.10)':'rgba(5,23,32,.13)';c.fillRect(i,0,1,h);c.fillRect(0,i,w,1)}
    for(let i=0;i<9000;i++){c.fillStyle=rand()>.5?'rgba(235,228,199,.17)':'rgba(9,23,29,.16)';c.fillRect(rand()*w,rand()*h,rand()*2+1,.7)}
  });
  for(const name of ['paper','glaze','skin','crumb','cake','bamboo','plaster']){
    textures[name]=tex(192,192,(c,w,h)=>{
      c.fillStyle=name==='crumb'?'#f4dfbc':name==='bamboo'?'#eed4a1':'#f5f1e7';c.fillRect(0,0,w,h);
      for(let i=0;i<(name==='glaze'?1100:3500);i++){
        const x=rand()*w,y=rand()*h,r=rand(),fiber=name==='paper'||name==='bamboo';
        c.fillStyle='rgba(88,65,44,'+(r*(name==='glaze'?.16:.13))+')';
        c.fillRect(x,y,fiber?3+rand()*11:.5+r*1.3,.4+rand());
      }
      if(name==='crumb'||name==='cake')for(let i=0;i<(name==='crumb'?205:100);i++){
        const x=rand()*w,y=rand()*h,r=.45+rand()**3*(name==='crumb'?5:2);
        c.fillStyle=name==='crumb'?'rgba(96,62,31,.48)':'rgba(112,76,43,.22)';
        c.beginPath();c.ellipse(x,y,r*(.6+rand()*.5),r,rand()*.4,0,TAU);c.fill();
        c.strokeStyle='rgba(255,241,205,.65)';c.lineWidth=.75;c.beginPath();c.arc(x,y+.5,r,.3,2.7);c.stroke();
      }
    })
  }
  for(const [m,n,b] of pending){m.map=textures[n];if(b){m.bumpMap=m.map;m.bumpScale=b}m.needsUpdate=true}
}
const M={
 wood:textured('wood',0xffe5bf,.74,.055),honey:textured('wood',0xcd9f70,.6,.042),
 darkwood:textured('wood',0xa47853,.65,.035),frame:textured('wood',0xbe9875,.72,.04),
 bamboo:textured('bamboo',0xe0b875,.57,.028),sand:mat(0xd2aa70),cane:mat(0xf1d398),binding:mat(0xb99256),
 blue:mat(0x244b66,.28),blueLight:mat(0x56778a,.32),
 glaze:textured('glaze',0xf3eddc,.24,.014),celadon:textured('glaze',0x9db4a7,.29,.01),
 paper:textured('paper',0xffeacc,.85,.025,{side:T.DoubleSide}),
 cloth:textured('cloth',0xffffff,.95,.026,{side:T.DoubleSide}),
 plaster:textured('plaster',0xf0e1c7,.96,.07),
 iron:mat(0x363b38,.48,{metalness:.36}),steel:mat(0xb9c1bb,.31,{metalness:.57}),
 cotton:textured('woven',0xf9ebcf,.97,.035)
};
let shadowTex;
function shade(g,x,y,z,w,d,opacity=.17){
  if(!shadowTex)shadowTex=tex(96,96,(c)=>{const a=c.createRadialGradient(48,48,1,48,48,47);a.addColorStop(0,'rgba(55,36,21,.95)');a.addColorStop(.39,'rgba(55,36,21,.63)');a.addColorStop(1,'rgba(55,36,21,0)');c.fillStyle=a;c.fillRect(0,0,96,96)},false);
  const m=new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity,polygonOffset:true,polygonOffsetFactor:-1});
  const o=mesh(g,new T.PlaneGeometry(w,d),m,x,y,z);o.rotation.x=-PI/2;o.castShadow=false;o.receiveShadow=false;return o
}
function roundBox(g,x,y,z,w,h,d,r,m){
  const sh=new T.Shape(),a=w/2,b=d/2;sh.moveTo(-a+r,-b);sh.lineTo(a-r,-b);sh.quadraticCurveTo(a,-b,a,-b+r);sh.lineTo(a,b-r);sh.quadraticCurveTo(a,b,a-r,b);sh.lineTo(-a+r,b);sh.quadraticCurveTo(-a,b,-a,b-r);sh.lineTo(-a,-b+r);sh.quadraticCurveTo(-a,-b,-a+r,-b);
  const geo=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.09,bevelThickness:.09,curveSegments:5});
  const o=mesh(g,geo,m,x,y,z);o.rotation.x=-PI/2;
  const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/w+.5,uv.getY(i)/d+.5);return o
}
return {T,PI,TAU,V,rand,group,mat,mesh,box,oval,cyl,tor,lathe,line,rod,batch,tex,textures,textured,makeTextures,M,shade,roundBox};
})();
