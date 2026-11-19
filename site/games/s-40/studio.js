/* All surface patterns and geometry are made locally. */
"use strict";
const Studio=(()=>{
  const T=THREE, TAU=2*Math.PI, V=(x,y,z)=>new T.Vector3(x,y,z);
  let seed=99581;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const group=(p)=>{const g=new T.Group();p.add(g);return g;};
  function mesh(p,g,m,x=0,y=0,z=0){
    if(!g.attributes.uv&&g.attributes.position){const pos=g.attributes.position,uv=new Float32Array(pos.count*2);
      for(let i=0;i<pos.count;i++){uv[i*2]=pos.getX(i)*.7+pos.getY(i)*.23;uv[i*2+1]=pos.getZ(i)*.7+pos.getY(i)*.39;}
      g.setAttribute('uv',new T.BufferAttribute(uv,2));}
    const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);o.castShadow=true;o.receiveShadow=true;return o;}
  function ell(p,m,x,y,z,a,b,c,seg=24){const o=mesh(p,new T.SphereGeometry(1,seg,Math.max(8,seg/2)),m,x,y,z);o.scale.set(a,b,c);return o;}
  function box(p,m,x,y,z,w,h,d){return mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);}
  function cylinder(p,m,x,y,z,r1,r2,h,n=64){return mesh(p,new T.CylinderGeometry(r1,r2,h,n),m,x,y,z);}
  function path(p,m,pts,r=.035,n=28){const c=new T.CatmullRomCurve3(pts.map(a=>V(...a)));return mesh(p,new T.TubeGeometry(c,n,r,7,false),m);}
  function ring(p,m,x,y,z,r,t,n=80){const o=mesh(p,new T.TorusGeometry(r,t,8,n),m,x,y,z);o.rotation.x=-Math.PI/2;return o;}
  function lathe(p,m,profile,n=88){return mesh(p,new T.LatheGeometry(profile.map(a=>new T.Vector2(...a)),n),m);}
  function rr(w,d,r){
    const a=w/2,b=d/2;const s=new T.Shape();s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);return s;
  }
  function slab(p,m,w,d,r,h,x,y,z,bevel=.035){
    const g=new T.ExtrudeGeometry(rr(w,d,r),{depth:h,bevelEnabled:bevel>0,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:9});g.rotateX(-Math.PI/2);
    return mesh(p,g,m,x,y,z);
  }
  function frame(p,m,w,d,r,edge,h,y,bev=.04){
    const shape=rr(w,d,r),hole=new T.Path(rr(w-edge*2,d-edge*2,Math.max(.06,r-edge)).getPoints(12).reverse());shape.holes.push(hole);
    const g=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bev,bevelThickness:bev,curveSegments:10});g.rotateX(-Math.PI/2);return mesh(p,g,m,0,y,0);
  }
  const refinements=[];
  function polish(){
    const budget=performance.now()+3;
    while(refinements.length&&performance.now()<budget){if(refinements[0]())refinements.shift();}
  }
  function texture(w,h,fn,color=true){
    // Show a complete low-resolution material first. Refine rows after the first paint.
    const refine=w*h>10000,sw=refine?Math.min(64,w):w,sh=refine?Math.min(64,h):h;
    function row(data,width,height,y){
      for(let x=0;x<width;x++){const rgb=fn(Math.floor(x*w/width),Math.floor(y*h/height)),i=4*(y*width+x);
        for(let j=0;j<3;j++)data[i+j]=clamp(rgb[j],0,255);data[i+3]=255;}
    }
    const data=new Uint8Array(sw*sh*4);
    for(let y=0;y<sh;y++)row(data,sw,sh,y);
    const t=new T.DataTexture(data,sw,sh);if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
    t.variants=[];
    if(refine){let y=0;const full=new Uint8Array(w*h*4);
      refinements.push(()=>{const end=Math.min(h,y+4);while(y<end)row(full,w,h,y++);
        if(y<h)return false;t.image={data:full,width:w,height:h};t.needsUpdate=true;
        for(const v of t.variants)v.needsUpdate=true;return true;});}
    return t;
  }
  const noise=texture(96,96,()=>{let a=185+rnd()*64;return[a,a,a];},false);
  function mat(c,r=.6,metal=0,extra={}){return new T.MeshStandardMaterial({color:c,roughness:r,metalness:metal,roughnessMap:noise,...extra});}
  function phys(c,r,extra={}){return new T.MeshPhysicalMaterial({color:c,roughness:r,roughnessMap:noise,...extra});}
  function woodMap(){
    const fibers=Array.from({length:256},()=>rnd()*7);return texture(512,256,(x,y)=>{
      const u=x/512*TAU,v=y/256*TAU;
      const g=v*12+.7*Math.sin(u+.64*Math.sin(v*2))+.28*Math.sin(u*2+v*2)+.7*Math.sin(v*3);
      const rings=Math.pow(.5+.5*Math.sin(g*2+.25*Math.sin(g*3)),8);
      const l=9*Math.sin(g)+3.5*Math.sin(g*5)-rings*17+(rnd()-.5)*7+fibers[y]-3;
      return[210+l,167+l,117+l*.90];});
  }
  const woodtex=woodMap();
  const timber=mat(0xf1dfc6,.60,0,{map:woodtex,bumpMap:woodtex,bumpScale:.017});
  const pale=mat(0xffedc4,.48,0,{map:woodtex,bumpMap:woodtex,bumpScale:.013});
  const cedar=mat(0xb17c4a,.43,0,{map:woodtex,bumpMap:woodtex,bumpScale:.014});
  const iron=mat(0x343b38,.32,.69,{bumpMap:noise,bumpScale:.026});
  const rim=mat(0x726b59,.24,.83);
  const brass=mat(0xa68b52,.31,.72);
  const steel=mat(0xc5c8bb,.21,.88);
  const jade=phys(0xb8dfcb,.12,{metalness:.15,clearcoat:1,clearcoatRoughness:.07,transparent:true,opacity:.25,depthWrite:false,side:T.DoubleSide});
  const stoneTex=texture(192,192,(x,y)=>{const n=rnd(),s=Math.sin(x*.19+.8*Math.sin(y*.35))+Math.sin(y*.25+x*.07);let k=148+s*4+(n-.5)*28+(n>.95?28:n<.07?-36:0);return[k*.96,k,k*.94];});
  const stone=mat(0xbfc1b5,.80,0,{map:stoneTex,bumpMap:stoneTex,bumpScale:.042});
  const sandTex=texture(128,128,()=>{const k=(rnd()-.5)*36+(rnd()<.04?-29:0);return[231+k,195+k,135+k*.9];});
  const sand=mat(0xe6b375,.95,0,{map:sandTex,bumpMap:sandTex,bumpScale:.036});
  const clothTex=(()=>{
    const sz=256;return texture(sz,sz,(x,y)=>{
      const a=x%64,b=y%64;const da=Math.hypot(a-32,b-32);const db=Math.hypot(Math.min(a,64-a),Math.min(b,64-b));
      const stitch=(Math.abs(da-32)<1.7||Math.abs(db-32)<1.7)&&((x+y*1.15)%10<6.8);const warp=(x%3===0?4:0)+(y%4===0?4:0)+(rnd()-.5)*11;
      return stitch?[161+warp,168+warp,153+warp]:[49+warp,73+warp,81+warp];});
  })();
  const cotton=mat(0xf8edcc,.98,0,{map:clothTex,bumpMap:clothTex,bumpScale:.018});
  const tea=phys(0xebead7,.22,{clearcoat:.82,clearcoatRoughness:.13});
  const cobalt=phys(0x355e72,.22,{clearcoat:.85});
  const syrup=phys(0x95663c,.15,{clearcoat:1});
  // Static details painted with the same glaze or wire share one GPU draw.
  function batch(p){
    const materials=new Map();
    for(const o of p.children){
      if(!o.isMesh||o.isInstancedMesh||o.material.transparent||o.geometry.attributes.color)continue;
      if(!materials.has(o.material))materials.set(o.material,[]);
      materials.get(o.material).push(o);
    }
    for(const [m,parts] of materials){
      if(parts.length<3)continue;
      const positions=[],normals=[],uv=[],indices=[];
      for(const o of parts){
        o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix),offset=positions.length/3;
        positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);uv.push(...g.attributes.uv.array);
        if(g.index)for(const i of g.index.array)indices.push(i+offset);
        else for(let i=0;i<g.attributes.position.count;i++)indices.push(i+offset);
        p.remove(o);g.dispose();o.geometry.dispose();
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);mesh(p,g,m);
    }
  }
  function environment(scene,renderer){
    const size=64;
    const faces=Array.from({length:6},(_,f)=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
      const ctx=canvas.getContext('2d'),img=ctx.createImageData(size,size);
      for(let j=0;j<size;j++)for(let i=0;i<size;i++){
        const u=(i+.5)/size*2-1,v=(j+.5)/size*2-1;
        const d=[[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]][f], [x,y,z]=d;
        let rgb=y>0?[126,124,104]:[131,109,80];
        if(y>.7)rgb=[113,106,83];
        if(x<-.25&&y>-.05&&y<1.35&&z<.8){const ax=z/-x,ay=y/-x;rgb=(Math.abs((ax+3.5)% .49-.24)<.027||Math.abs((ay+1)%.43-.21)<.022)?[111,98,73]:[255,251,225];}
        if(z<-.7&&y>-.12&&y<.65)rgb=[174,189,150];
        const n=4*(j*size+i);img.data.set([...rgb,255],n);
      }ctx.putImageData(img,0,0);return canvas;
    });
    const sky=new T.CubeTexture(faces);sky.colorSpace=T.SRGBColorSpace;sky.needsUpdate=true;scene.environment=sky;scene.environmentIntensity=.68;
  }
  // A continuous, carved wooden paddle with a gently hollowed blade.
  function paddle(parent){
    const g=group(parent),sec=[
      [-.78,.17,.050],[-.72,.36,.065],[-.59,.45,.071],[-.19,.45,.088],[.12,.385,.084],[.39,.245,.086],[.55,.140,.086],[.80,.122,.087],[1.3,.124,.091],[2,.147,.096],[2.64,.169,.10],[2.79,.139,.09],[2.85,.044,.046]];
    const pos=[],uv=[],idx=[];const n=24;
    for(let j=0;j<sec.length;j++){
      const [l,w,h]=sec[j];for(let i=0;i<n;i++){let a=i/n*TAU,cs=Math.cos(a),sn=Math.sin(a);
        pos.push(w*Math.sign(cs)*Math.pow(Math.abs(cs),.68),h*sn+.026*cs*cs*Math.max(0,.8-l),l);
        uv.push((l+.8)/3.7,.5+cs*.49);
      }
    }for(let j=0;j<sec.length-1;j++)for(let i=0;i<n;i++){
      let a=j*n+i,b=j*n+(i+1)%n;idx.push(a,b,a+n,b,b+n,a+n);
    }
    for(let i=1;i<n-1;i++)idx.push(0,i+1,i,(sec.length-1)*n,(sec.length-1)*n+i,(sec.length-1)*n+i+1);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
    const m=pale.clone();m.side=T.DoubleSide;mesh(g,geo,m);return g;
  }
  function pot(parent){
    const g=group(parent);
    // Wound rush trivet, with individual reeds visible in the outer binding.
    const rope=mat(0xb39460,.90,0,{map:woodtex,bumpMap:noise,bumpScale:.03});
    cylinder(g,rope,0,.115,0,2.11,2.14,.22);for(let i=0;i<9;i++)ring(g,rope,0,.21,0,2.14-i*.12,.061);
    const shell=lathe(g,iron,[[0,.22],[1.10,.22],[1.53,.30],[1.74,.45],[1.90,.68],[2.015,1.01],[2.06,1.12],[2.07,1.205],[2.025,1.23],[1.98,1.17],[1.92,.94],[1.76,.64],[1.51,.47],[1.2,.385],[0,.385]],112);
    ring(g,rim,0,1.203,0,2.041,.029,112);ring(g,iron,0,1.13,0,2.055,.038,112);
    for(const sign of [-1,1]){
      path(g,iron,[[sign*1.84,.84,-.46],[sign*2.23,.91,-.47],[sign*2.49,.98,-.33],[sign*2.53,1,.04],[sign*2.43,.98,.39],[sign*2.16,.92,.46],[sign*1.85,.86,.42]],.115);
      for(const z of [-.37,.37])ell(g,rim,sign*1.91,1.02,z,.078,.054,.066,12);
    }return g;
  }
  function dough(parent){
    const rad=43,seg=112,positions=[],uv=[],colors=[],indices=[],info=[];
    for(let j=0;j<=rad;j++)for(let i=0;i<=seg;i++){
      const a=i/seg*TAU,r=j/rad,x=Math.cos(a)*r,z=Math.sin(a)*r;
      info.push({a,r,x,z,sector:Math.floor(i/seg*24)%24});
      positions.push(x,0,z);uv.push(x*.5+.5,z*.5+.5);colors.push(1,1,1);
      if(i<seg&&j<rad){const k=j*(seg+1)+i;indices.push(k,k+1,k+seg+1,k+1,k+seg+2,k+seg+1);}
    }
    const geo=new T.BufferGeometry();geo.setIndex(indices);geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    const m=phys(0xffffff,.18,{vertexColors:true,clearcoat:1,clearcoatRoughness:.105,ior:1.38,transmission:.20,attenuationColor:new T.Color(0xd5ab75),attenuationDistance:2.1,thickness:.72,side:T.DoubleSide,envMapIntensity:1.15});
    const o=mesh(parent,geo,m);o.frustumCulled=false;
    // Curved creases share a single continuous surface and follow the local strain.
    const pre=info.map(({x,z,a,r})=>{
      const bend=z+.48*x+.58*x*x+.15*Math.sin(x*4.1);
      const lobe=.14*Math.sin(3*a+.6)+.045*Math.sin(a*5+1.3);
      const envelope=Math.pow(Math.max(0,1-r*r),.59);
      const roll=Math.sin(bend*13.5+2.2*r*r+Math.sin(x*3.9+z)*.83);
      const crease=Math.pow(.5+.5*roll,2.6);
      const stria=Math.pow(.5+.5*Math.sin(bend*25+1.1*Math.sin(x*4)+r*3.7),12);
      return {bend,edge:1+lobe*r,base:.59+envelope*(.56+.19*crease+.07*Math.cos(bend*6-x*3)),crease,stria,envelope};
    });
    function update(s){
      const pos=geo.attributes.position,col=geo.attributes.color;
      for(let k=0;k<info.length;k++){
        const q=info[k],h=pre[k],c=s.dough[q.sector],n=s.dough[(q.sector+1)%24],f=q.a/TAU*24%1;
        const st=c.stretch+(n.stretch-c.stretch)*f,flour=c.starch+(n.starch-c.starch)*f;
        const fold=st*(.25+.75*q.r);
        const massScale=clamp(Math.sqrt(s.mass/245),.72,1.06);
        pos.setXYZ(k,(q.x*(1.63*h.edge+fold*.40)-.08+s.pull*.68+s.paddle.x*.49)*massScale,h.base+fold*.23+h.envelope*.075*s.mix,(q.z*(1.52*h.edge+fold*.30)-.06+s.pull*.76+s.paddle.z*.83)*massScale);
        const white=flour*(.20+h.stria*.76)*(.45+.55*h.envelope);
        const shadow=h.crease*.055;
        col.setXYZ(k,.52+white*.47+shadow,.385+white*.58+shadow,.215+white*.70+shadow);
      }
      pos.needsUpdate=col.needsUpdate=true;geo.computeVertexNormals();
    }return {o,update};
  }
  return {batch,polish,T,V,TAU,group,mesh,ell,box,cylinder,path,ring,lathe,rr,slab,frame,texture,noise,mat,phys,woodtex,timber,pale,cedar,iron,rim,brass,steel,jade,stone,sandTex,sand,cotton,clothTex,tea,cobalt,syrup,rnd,clamp,environment,paddle,pot,dough};
})();
