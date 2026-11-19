/* All surfaces and objects are generated locally in three dimensions. */
(() => {
  'use strict';
  const T=THREE, TAU=2*Math.PI;
  let seed=77191;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const group=p=>{const g=new T.Group();if(p)p.add(g);return g;};
  function dataTexture(data,w,h,color=false){
    const t=new T.DataTexture(data,w,h,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;
    t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;
    if(color)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;
  }
  const grain=new Uint8Array(64*64*4);
  for(let i=0;i<grain.length;i+=4){const v=219+rand()*35;grain.set([v,v,v,255],i);}
  const rough=dataTexture(grain,64,64);
  function mat(color,roughness=.66,metalness=0,extras={}){
    return new T.MeshStandardMaterial({color,roughness,metalness,roughnessMap:rough,...extras});
  }
  function mesh(p,g,m,x=0,y=0,z=0){
    const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;
    p.add(o);return o;
  }
  const sphere=new T.SphereGeometry(1,24,16),cube=new T.BoxGeometry(1,1,1);
  function oval(p,m,x,y,z,w,h,d){const o=mesh(p,sphere,m,x,y,z);o.scale.set(w,h,d);return o;}
  function box(p,m,x,y,z,w,h,d){const o=mesh(p,cube,m,x,y,z);o.scale.set(w,h,d);return o;}
  function rod(p,m,a,b,r,r2=r,n=16){
    const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va);
    const o=mesh(p,new T.CylinderGeometry(r2,r,v.length(),n),m);
    o.position.copy(va).add(vb).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
  }
  function line(p,m,coords,r,n=30){
    const path=new T.CatmullRomCurve3(coords.map(v=>new T.Vector3(...v)));
    return mesh(p,new T.TubeGeometry(path,n,r,7,false),m);
  }
  function surface(n,k,fn,colors=false) {
    const pos=[],uv=[],col=[],idx=[];
    for(let j=0;j<=k;j++)for(let i=0;i<=n;i++){
      const q=fn(i/n,j/k,j);pos.push(q[0],q[1],q[2]);uv.push(i/n,j/k);
      if(colors)col.push(q[3],q[4],q[5]);
    }
    for(let j=0;j<k;j++)for(let i=0;i<n;i++){
      const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,b,a+1,b+1);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    if(colors)g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  function lathe(p,m,profile,x=0,y=0,z=0,flute=0,nfl=32,n=96){
    const g=surface(n,profile.length-1,(u,v,j)=>{
      const t=u*TAU,a=profile[j];
      const r=Math.max(.0001,a[0]+(a[2]??flute)*Math.cos(t*nfl));
      return [r*Math.sin(t),a[1],r*Math.cos(t)];
    });
    return mesh(p,g,m,x,y,z);
  }
  function ring(p,m,r,tube,y,x=0,z=0){
    const o=mesh(p,new T.TorusGeometry(r,tube,8,96),m,x,y,z);o.rotation.x=Math.PI/2;return o;
  }
  const ivory=mat(0xfff3de,.32), glaze=mat(0xf5d1bd,.29),pink=mat(0xbb807b,.39);
  const gold=mat(0xcba263,.26,.7),steel=mat(0xc5bfaf,.21,.92);
  const frosting=mat(0xfff5dd,.59), cotton=mat(0xffeddc,.9),sage=mat(0xa4b3a1,.43);
  function plate(p,r,color=ivory,fluted=false){
    const g=group(p);const v=fluted?.036*r:0;
    lathe(g,color,[[.001,0,0],[r*.73,0,0],[r*.86,.027,0],[r*.975,.079,v],
      [r,.109,v],[r*.996,.135,v],[r*.976,.147,v],[r*.914,.123,v*.6],
      [r*.81,.067,0],[r*.75,.054,0],[.001,.054,0]],0,0,0,0,24,144);
    if(fluted)lathe(g,gold,[[r*.975,.146,v],[r*.969,.1465,v]],0,0,0,0,24,144);
    else ring(g,gold,r*.948,.009,.136);
    return g;
  }
  function stand(p){
    const g=group(p);
    lathe(g,glaze,[[.01,.016],[1.02,.016],[1.15,.042],[1.19,.09],[1.18,.145],
      [1.09,.18],[.86,.19],[.68,.25],[.56,.34],[.55,.46],[.62,.54],[1.18,.61],[1.52,.65],[.01,.66]]);
    ring(g,gold,1.168,.016,.096);
    lathe(g,pink,[[.96,.18,.01],[.86,.202,.027],[.64,.28,.031],[.55,.37,.019],[.55,.43,.012],[.56,.455,.003]],0,0,0,0,44,176);
    lathe(g,glaze,[[.02,.565,0],[1.56,.565,0],[1.81,.62,.014],[1.95,.69,.016],[1.965,.738,.009],[1.935,.759,0],[.001,.759,0]],0,0,0,0,60,240);
    ring(g,gold,1.955,.012,.723);
    const dish=plate(g,1.93,ivory,true);dish.position.y=.715;
    return g;
  }
  // Batch fixed pieces in their parent's coordinates. Interactive parts keep
  // their own transforms, so picking and moving the plate still work.
  function batchStatic(root){
    root.updateWorldMatrix(true,true);
    const inverse=root.matrixWorld.clone().invert(),bins=new Map();
    root.traverse(o=>{
      if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
      const key=o.material.uuid;
      if(!bins.has(key))bins.set(key,[]);bins.get(key).push(o);
    });
    const p=new T.Vector3(),normal=new T.Vector3(),matrix=new T.Matrix4(),normalMatrix=new T.Matrix3();
    for(const objects of bins.values()){
      if(objects.length<2)continue;
      const pp=[],nn=[],uv=[],cc=[],indices=[];
      for(const o of objects){
        const g=o.geometry,attrs=g.attributes,base=pp.length/3;
        matrix.multiplyMatrices(inverse,o.matrixWorld);normalMatrix.getNormalMatrix(matrix);
        for(let i=0;i<attrs.position.count;i++){
          p.fromBufferAttribute(attrs.position,i).applyMatrix4(matrix);pp.push(p.x,p.y,p.z);
          normal.fromBufferAttribute(attrs.normal,i).applyNormalMatrix(normalMatrix);nn.push(normal.x,normal.y,normal.z);
          uv.push(attrs.uv?.getX(i)||0,attrs.uv?.getY(i)||0);
          if(attrs.color)cc.push(attrs.color.getX(i),attrs.color.getY(i),attrs.color.getZ(i));
        }
        const count=g.index?g.index.count:attrs.position.count;
        for(let i=0;i<count;i++)indices.push(base+(g.index?g.index.getX(i):i));
        o.removeFromParent();
      }
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(pp,3));
      g.setAttribute('normal',new T.Float32BufferAttribute(nn,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      if(cc.length)g.setAttribute('color',new T.Float32BufferAttribute(cc,3));
      g.setIndex(indices);mesh(root,g,objects[0].material);
    }
    return root;
  }
  function linen(){
    const n=128,buf=new Uint8Array(n*n*4);
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const warp=(i%32)<15,weft=(j%32)<15;
      const dye=.15+.19*(warp+weft);
      const yarn=((i%2===0)===(j%2===0)?2:-2)+(rand()-.5)*4;
      buf.set([252-46*dye+yarn,238-104*dye+yarn,220-89*dye+yarn,255],(j*n+i)*4);
    }
    const tex=dataTexture(buf,n,n,true);tex.repeat.set(3,2.7);
    return mat(0xffffff,.94,0,{map:tex});
  }
  function woodMat(){
    const w=512,h=256,data=new Uint8Array(w*h*4);
    const row=Array.from({length:h},()=>rand());
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const u=x/w*TAU,v=y/h*TAU,warp=1.4*Math.sin(u+Math.sin(v*2))+.72*Math.sin(2*u-1.2*v);
      const gr=.85*Math.sin(y*.66+warp)+1.1*Math.sin(y*1.72+warp*2)+1.5*Math.sin(v*7+warp)+2.9*(row[y]-.5)+(rand()-.5)*4;
      const q=4*(y*w+x);data.set([224+gr,192+gr,155+gr,255],q);
    }
    const m=mat(0xffffff,.55,0,{map:dataTexture(data,w,h,true)});m.map.repeat.set(2.7,5);return m;
  }
  function fabric(p,w,d,base,stripe,fringe=false){
    const g=group(p),n=48,k=48;
    const sample=(u,v)=>[(u-.5)*w,.026+.012*Math.sin(u*17+v*2)+.008*Math.sin(v*9-u*6)+.022*Math.exp(-Math.pow((u-v*.3-.42)*12,2)),(.5-v)*d];
    mesh(g,surface(n,k,sample),base);
    [.059,.08,.11,.894,.923,.941].forEach((v,i)=>{
      mesh(g,surface(n,1,(u,j)=>{const a=sample(u,v+j*(i%3===1?.014:.005));a[1]+=.0013;return a;}),stripe);
    });
    if(fringe){
      const gd=new T.CylinderGeometry(.006,.005,.092,4),o=new T.InstancedMesh(gd,base,Math.floor(w*33));
      const dummy=new T.Object3D();
      for(let i=0;i<o.count;i++){const pt=sample(i/o.count,0);dummy.position.set(pt[0],pt[1]-.006,pt[2]+.036);
        dummy.rotation.set(Math.PI*.51,0,.18*(rand()-.5));dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);}
      g.add(o);
    }
    return g;
  }
  // A bowl with through-holes, a rolled enamel lip and two small handles.
  function colander(p){
    const g=group(p),m=mat(0xe6b7a9,.34),edge=mat(0xad7973,.33);
    const pos=[],inds=[];
    function bowl(t,v){
      const r=.36+.55*Math.sin(v*1.45),y=.09+.65*(.25*v+.75*v*v);
      return [r*Math.sin(t),y,r*Math.cos(t)];
    }
    for(let j=0;j<4;j++)for(let i=0;i<32;i++){
      const base=pos.length/3;
      for(let c=0;c<2;c++)for(let a=0;a<12;a++){
        const t=TAU*a/12,co=Math.cos(t),si=Math.sin(t),border=.501/Math.max(Math.abs(co),Math.abs(si));
        const x=c?.224*co:border*co,y=c?.217*si:border*si;
        pos.push(...bowl((i+.5+x)*TAU/32,(j+.5+y)/4));
      }
      for(let a=0;a<12;a++){let b=(a+1)%12;inds.push(base+a,base+b,base+a+12,base+b,base+b+12,base+a+12);}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(inds);geo.computeVertexNormals();
    m.side=T.DoubleSide;mesh(g,geo,m);ring(g,edge,.907,.032,.747);
    lathe(g,m,[[.001,.066],[.35,.066],[.367,.105],[.34,.119],[.001,.119]]);
    ring(g,edge,.32,.022,.057);
    for(const sign of [-1,1])line(g,edge,[[sign*.825,.59,-.23],[sign*1.04,.63,-.17],[sign*1.09,.655,0],[sign*1.04,.63,.17],[sign*.825,.59,.23]],.033);
    return g;
  }
  const seedMaterial=mat(0xe5ac53,.43),skin=mat(0xffffff,.29,0,{vertexColors:true,side:T.DoubleSide}),
    flesh=mat(0xffffff,.47,0,{vertexColors:true,side:T.DoubleSide});
  const fruitCache=[];
  function berryGeometry(id){
    const skinSeeds=[];
    for(let row=0;row<9;row++){
      const v=(row+.7)/10,n=Math.max(2,Math.round(11*Math.pow(Math.sin(Math.PI*v),.58)*(1.2-.55*v)));
      for(let i=0;i<n;i++)skinSeeds.push({u:(i+.4+rand()*.21)/n,v:v+(rand()-.5)*.033});
    }
    function profile(v){return .31*Math.pow(Math.max(.00001,Math.sin(Math.PI*v)),.65)*(1.42-.87*v);}
    function base(u,v){
      const a=u*Math.PI-Math.PI/2,r=profile(v)*(1+.025*Math.cos(3*a+id)*Math.sin(v*3));
      return [Math.sin(a)*r,(v-.5)*.77,Math.cos(a)*r*.86];
    }
    const surfaceGeo=surface(64,42,(u,v)=>{
      let dent=0;
      for(const s of skinSeeds){const d=(u-s.u)**2*4600+(v-s.v)**2*2150;if(d<5)dent+=Math.exp(-d);}
      const q=base(u,v),c=new T.Color().setHSL(.007+.012*(1-v)+.004*Math.sin(u*17+id),.84,.377+.046*(1-v)+.017*Math.sin(u*13+v*22+id)-.055*dent,T.SRGBColorSpace);
      return [q[0]*(1-.065*dent),q[1],q[2]*(1-.065*dent),c.r,c.g,c.b];
    },true);
    const face=surface(64,56,(u,v)=>{
      const a=u*2-1,q=base(a>0?1:0,v),side=Math.abs(a);
      const streak=Math.pow(.5+.5*Math.sin(24*Math.atan2((v-.39)*1.3,a*.55)+8*side+Math.sin(a*6+v*8)),6);
      const core=.22*Math.pow(1-v,.56)+.04*Math.sin(9*v+id);
      const pale=Math.max(0,1-side/(core+.04))*.85*(1-.66*v)+.23*streak*(1-side);
      const edge=Math.exp(-((side-.939)**2)/.001);
      const c=new T.Color().setRGB((230+18*pale+12*edge)/255,(64+113*pale+73*edge+14*(1-v))/255,(63+64*pale+37*edge)/255,T.SRGBColorSpace);
      return [side*q[0],q[1],-.007-.004*Math.sin(v*10+a*3),c.r,c.g,c.b];
    },true);
    const matrices=[];
    for(const s of skinSeeds){
      const a=new T.Vector3(...base(s.u,s.v)),du=new T.Vector3(...base(s.u+.001,s.v)).sub(a),dv=new T.Vector3(...base(s.u,s.v+.001)).sub(a);
      const norm=du.clone().cross(dv).normalize(),o=new T.Object3D();
      o.position.copy(a).addScaledVector(norm,-.0009);o.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(du.normalize(),dv.normalize(),norm));
      o.scale.set(.010+rand()*.003,.019+rand()*.004,.008);o.updateMatrix();matrices.push(o.matrix.clone());
    }
    return {surfaceGeo,face,matrices};
  }
  const seedGeo=new T.SphereGeometry(1,7,5);
  function berry(p,id=0){
    const cache=fruitCache[id%3]||(fruitCache[id%3]=berryGeometry(id%3));
    const g=group(p),m=skin.clone();mesh(g,cache.surfaceGeo,m);mesh(g,cache.face,flesh);
    const seeds=new T.InstancedMesh(seedGeo,seedMaterial,cache.matrices.length);cache.matrices.forEach((m,i)=>seeds.setMatrixAt(i,m));
    seeds.castShadow=seeds.receiveShadow=true;g.add(seeds);g.userData.skin=m;return g;
  }
  function bag(p){
    const g=group(p),satin=mat(0xffedd6,.48),seam=mat(0xe6cfb9,.57);
    const body=mesh(g,surface(64,36,(u,v)=>{
      const a=u*TAU, y=.21+1.05*v, r=.064+.25*Math.pow(v,.81)-.245*Math.pow(v,8);
      const fold=(.007+.013*v)*Math.cos(a*7+v*5)+.006*Math.sin(a*11-v*3);
      return [(r+fold)*Math.sin(a)+.055*v*v,y,(r+fold)*Math.cos(a)*.88];
    }),satin);g.userData.body=body;
    line(g,seam,[[.053,.25,.036],[.1,.48,.096],[.16,.8,.159],[.199,1.1,.133],[.082,1.22,.044]],.007);
    lathe(g,steel,[[.071,.012],[.079,.07],[.111,.206],[.113,.252],[.082,.266]],0,0,0,0,10,40);
    const tooth=mesh(g,surface(40,1,(u,v)=>{const a=u*TAU,r=.072+.007*v;return [r*Math.sin(a),.012+v*.048-(1-v)*.036*Math.pow(Math.cos(5*a),2),r*Math.cos(a)];}),steel);tooth.material.side=T.DoubleSide;
    ring(g,gold,.097,.01,.211);
    lathe(g,satin,[[.035,1.215,.005],[.062,1.26,.013],[.152,1.39,.04],[.147,1.405,.042]],.052,0,0,0,6,60);
    ring(g,pink,.062,.018,1.255,.053,0);
    return g;
  }
  // Each rib gets its own radius and each ring shifts toward the tool trail.
  const fn=64,fk=19;
  function flower(p){
    const g=mesh(p,surface(fn,fk,()=>[0,0,0]),frosting);g.frustumCulled=false;return g;
  }
  function sculpt(o,f){
    const a=o.geometry.attributes.position;
    const length=Math.hypot(f.trailX,f.trailZ),turn=Math.atan2(f.trailX,f.trailZ);
    const direction=Math.atan2(f.x||0,f.z||0),flatten=1-(f.radialScale??1);
    for(let j=0;j<=fk;j++){const v=j/fk,body=Math.pow(1-v,.63)*(1+.27*Math.sin(Math.PI*v));
      const slide=Math.pow(v,.76),tip=v*v*v;
      for(let i=0;i<=fn;i++){const theta=i/fn*TAU, twist=theta+v*(.48+.17*length);
        const idx=Math.floor((i%fn)/8),l=f.lobes[idx];
        const k=(1+.018*Math.sin(theta*3+f.gap))*(.80+.20*Math.cos(twist*8));
        const radius=body*l.radius*k*(1+.19*length*Math.cos(theta-turn)**2);
        const radial=radius*Math.cos(theta-direction)*flatten;
        a.setXYZ(j*(fn+1)+i,(Math.sin(theta)*radius-radial*Math.sin(direction)+f.trailX*slide+f.bendX*tip)/5,
          (v*f.height+f.tip*tip)/5,(Math.cos(theta)*radius-radial*Math.cos(direction)+f.trailZ*slide+f.bendZ*tip)/5);
      }
    }
    a.needsUpdate=true;o.geometry.computeVertexNormals();
  }
  window.Models={T,TAU,batchStatic,linen,group,mesh,oval,box,rod,line,surface,lathe,ring,mat,plate,stand,woodMat,fabric,colander,berry,bag,flower,sculpt,
    ivory,glaze,pink,gold,steel,frosting,cotton,sage,rand,dataTexture};
})();
