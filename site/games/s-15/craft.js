/* Small workshop for turned metal, thrown porcelain, folded linen and bent wire. */
'use strict';
const Craft=(()=>{
 const T=THREE,TAU=2*Math.PI, V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
 let seed=62431;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 function tex(w,h,fn,color=true){let c=document.createElement('canvas');c.width=w;c.height=h;let ctx=c.getContext('2d'),im=ctx.createImageData(w,h);
   for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){let v=fn(x,y);im.data[i]=v[0];im.data[i+1]=v[1];im.data[i+2]=v[2];im.data[i+3]=v[3]??255}
   ctx.putImageData(im,0,0);let t=new T.CanvasTexture(c);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t}
 const grain=tex(64,64,()=>{let n=215+rand()*39;return[n,n,n]},false);
 const woodMap=tex(512,256,(x,y)=>{let q=y+2.7*Math.sin(x*.013+y*.047)+1.1*Math.sin(x*.021-y*.091);
   let f=Math.sin(q*1.74+.6*Math.sin(q*.82))*.95+Math.sin(q*.39)*2.3+Math.sin(q*.12)*2.6+Math.sin(q*3.8)*.9+rand()*2.6;
   const lines=Math.pow(.5+.5*Math.sin(q*.32+Math.sin(x*.008+q*.05)*3),17)*5;
   return [215+f-lines,191+f-lines,160+f-lines]});
 const linenMap=tex(128,128,(x,y)=>{let a=x%64,b=y%64,k=(a>42&&a<52?.33:0)+(b>42&&b<52?.33:0)+(a===38||b===38?.19:0)+(a===56||b===56?.17:0);
   let f=(x%2+y%2)*1.9+rand()*4;return[232-77*k+f,218-154*k+f,192-131*k+f]});linenMap.repeat.set(5.75,3.7);
 function mat(color,rough=.5,metal=0,extra={}){return new T.MeshStandardMaterial({color,roughness:rough,metalness:metal,roughnessMap:grain,...extra})}
 const M={walnut:mat(0x76513e,.39,0,{map:woodMap}),edge:mat(0x764a32,.30),wood:mat(0xe4cba8,.47,0,{map:woodMap}),oak:mat(0xcfb38f,.37,0,{map:woodMap}),
 dark:mat(0x48332c,.36),cream:mat(0xf4e5ca,.26),china:mat(0xfff1db,.18),wine:mat(0x793934,.34),red:mat(0x943d36,.31),line:mat(0xa15842,.38),
 sage:mat(0x7a8970,.38),green:mat(0x475f56,.48),brass:mat(0xc8aa73,.27,.76),aged:mat(0xad8956,.35,.72),copper:mat(0xb77e59,.31,.8),silver:mat(0xece7dc,.19,.95),steel:mat(0xbfc1b9,.25,.92),black:mat(0x302e2a,.35,.35),
 cloud:mat(0xf0e6d1,.84),cloth:mat(0xffffff,.92,0,{map:linenMap,side:T.DoubleSide}),custard:mat(0xffca60,.27),sauce:mat(0x9e4216,.13,.04),honey:mat(0xbd6720,.16),
 glass:mat(0xe4f1e6,.11,.12,{transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false}),skin:mat(0xd8a483,.66),nail:mat(0xe7bb9e,.49)};
 function group(parent,x=0,y=0,z=0){let o=new T.Group();parent?.add(o);o.position.set(x,y,z);return o}
 const unitBox=new T.BoxGeometry(1,1,1), sphere=new T.SphereGeometry(1,24,18);
 function mesh(parent,g,m,x=0,y=0,z=0){let o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;parent?.add(o);return o}
 function box(p,x,y,z,w,h,d,m){let o=mesh(p,unitBox,m,x,y,z);o.scale.set(w,h,d);return o}
 function ell(p,x,y,z,w,h,d,m){let o=mesh(p,sphere,m,x,y,z);o.scale.set(w,h,d);return o}
 function lathe(p,profile,m,n=80,flute=0,count=12,custom=null){
   let verts=[],uv=[],idx=[];
   for(let i=0;i<profile.length;i++)for(let j=0;j<=n;j++){
     const [r,y,f]=profile[i],a=j/n*TAU,rad=r+flute*(f??1)*Math.cos(a*count);
     const pos=custom?custom(rad,y,a,i):[Math.cos(a)*rad,y,Math.sin(a)*rad];
     verts.push(...pos);uv.push(j/n,i/(profile.length-1));if(i&&j){let k=i*(n+1)+j;idx.push(k-n-2,k-1,k-n-1,k-n-1,k-1,k)}
   }
   let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
   // Average the normals along the lathe seam.
   let norm=g.attributes.normal;for(let i=0;i<profile.length;i++){let j=i*(n+1),k=j+n;let v=V().fromBufferAttribute(norm,j).add(V().fromBufferAttribute(norm,k)).normalize();norm.setXYZ(j,v.x,v.y,v.z);norm.setXYZ(k,v.x,v.y,v.z)}
   return mesh(p,g,m)}
 function ring(p,r,t,y,m,x=0,z=0){let o=mesh(p,new T.TorusGeometry(r,t,10,80),m,x,y,z);o.rotation.x=Math.PI/2;return o}
 function tube(p,points,r,m,segments=28){let c=new T.CatmullRomCurve3(points.map(a=>Array.isArray(a)?V(...a):a));return mesh(p,new T.TubeGeometry(c,segments,r,9,false),m)}
 function beam(p,a,b,r,m,r2=r){let v=V(...b).sub(V(...a)),o=mesh(p,new T.CylinderGeometry(r2,r,v.length(),12),m);o.position.copy(V(...a).add(V(...b)).multiplyScalar(.5));o.quaternion.setFromUnitVectors(V(0,1,0),v.normalize());return o}
 function round(p,x,y,z,w,h,d,rad,m){const sh=new T.Shape(),a=-w/2,b=-d/2;
   sh.moveTo(a+rad,b);sh.lineTo(-a-rad,b);sh.quadraticCurveTo(-a,b,-a,b+rad);sh.lineTo(-a,-b-rad);sh.quadraticCurveTo(-a,-b,-a-rad,-b);sh.lineTo(a+rad,-b);sh.quadraticCurveTo(a,-b,a,-b-rad);sh.lineTo(a,b+rad);sh.quadraticCurveTo(a,b,a+rad,b);
   const bevel=Math.min(.024,h*.2),g=new T.ExtrudeGeometry(sh,{depth:h-bevel*2,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:5});g.rotateX(-Math.PI/2);g.translate(0,bevel,0);return mesh(p,g,m,x,y-h/2,z)}
 function fabric(p,x,y,z,w,d,m=M.cloth){
   let g=new T.PlaneGeometry(w,d,35,22);g.rotateX(-Math.PI/2);let a=g.attributes.position;
   for(let i=0;i<a.count;i++){let u=a.getX(i),v=a.getZ(i);a.setY(i,.014*Math.sin(u*12+v*2)+.009*Math.cos(v*19+u*2)+.04*Math.exp(-((u+.16+v*.25)**2)*52));a.setZ(i,v+.009*Math.sin(u*13))}
   g.computeVertexNormals();return mesh(p,g,m,x,y,z)}
 // Bake stationary fittings into material batches, keeping movable parts independent.
 function batch(root){
   root.updateWorldMatrix(true,true);let inv=root.matrixWorld.clone().invert(),sets=new Map();
   root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.material.transparent)return;
     let key=o.material.uuid+o.castShadow+o.receiveShadow,entry=sets.get(key);if(!entry)sets.set(key,entry={list:[],mat:o.material,casts:o.castShadow,receives:o.receiveShadow});entry.list.push(o)});
   for(const {list,mat,casts,receives} of sets.values()){
     if(list.length<2)continue;let pos=[],nor=[],uv=[],ind=[],count=0;
     for(const o of list){let tr=inv.clone().multiply(o.matrixWorld),nm=new T.Matrix3().getNormalMatrix(tr),g=o.geometry,a=g.attributes.position,b=g.attributes.normal,c=g.attributes.uv,v=V();
       for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(tr);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(b,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);uv.push(c?c.getX(i):0,c?c.getY(i):0)}
       if(g.index){for(let i=0;i<g.index.count;i++)ind.push(count+g.index.getX(i))}else for(let i=0;i<a.count;i++)ind.push(count+i);
       count+=a.count;o.removeFromParent()}
     let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);let o=mesh(root,g,mat);o.castShadow=casts;o.receiveShadow=receives;
   }
 }
 function env(){let texture=tex(256,128,(x,y)=>{let u=x/256,v=y/128;if(v>.68){let w=18*Math.cos(u*16);return[142+w,112+w,81+w]}
   let w=u>.04&&u<.39&&v>.19&&v<.67;if(w){let frame=((u-.04)*23)%1<.065||Math.abs(v-.43)<.012;return frame?[99,84,63]:[249,244,220]}
   if(u>.58&&u<.81&&v>.28&&v<.49)return[224,215,188];
   if(v>.52&&v<.55)return[189,159,115];if(v<.25)return[146,132,111];return[98,77,66]});texture.mapping=T.EquirectangularReflectionMapping;return texture}
 const contactMap=tex(64,64,(x,y)=>{let r=((x-31.5)/31.5)**2+((y-31.5)/31.5)**2;return[255,255,255,Math.max(0,(1-r))**2*230]});
 function contact(p,x,y,z,w,d,opacity=.26){let m=mat(0x443429,1,0,{map:contactMap,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});let o=mesh(p,new T.PlaneGeometry(w,d),m,x,y,z);o.rotation.x=-Math.PI/2;return o}
 return {T,TAU,V,rand,tex,mat,M,group,mesh,box,ell,lathe,ring,tube,beam,round,fabric,batch,env,contact};
})();
