'use strict';
const Atelier = (() => {
  const T=THREE, pi=Math.PI,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  let seed=67957;
  function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const mix=(a,b,t)=>a+(b-a)*t;
  function noise(x,y){const hash=(i,j)=>{let h=Math.imul(i+131,2246822519)^Math.imul(j+17,3266489917);h=Math.imul(h^(h>>>16),2246822519);return((h^(h>>>13))>>>0)/4294967296;};
    const i=Math.floor(x),j=Math.floor(y);let u=x-i,v=y-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return mix(mix(hash(i,j),hash(i+1,j),u),mix(hash(i,j+1),hash(i+1,j+1),u),v);}
  const envData=new Uint8Array(128*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<128;x++){
    const u=x/128,v=y/64,win=(u>.14&&u<.43&&v>.43&&v<.82)||(u>.72&&u<.79&&v>.47&&v<.91);
    const mullion=Math.abs(Math.sin(u*118))<.16||Math.abs(Math.sin(v*34))<.11;
    let c=v<.48?[157,130,105]:[203,180,158];if(v>.84)c=[148,130,112];if(win)c=mullion?[156,137,109]:[255,248,221];
    const i=(y*128+x)*4;for(let k=0;k<3;k++)envData[i+k]=c[k];envData[i+3]=255;
  }
  const env=new T.DataTexture(envData,128,64);env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;env.minFilter=env.magFilter=T.LinearFilter;env.needsUpdate=true;
  function finish(kind,detail=false){
    const n=detail?(kind==='wood'||kind==='stone'?192:64):32,buf=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const u=i/n,v=j/n,f=noise(u*7,v*6),grain=rand();let value=243,rv=.89;
      if(kind==='wood'){const bend=noise(u*3, v*7)*.6+noise(u*23,v*37)*.07;const a=Math.sin(v*207+bend*19);value=239+8*f+4*a-12*Math.pow((a+1)*.5,12)+grain*4;rv=.83+.12*f;}
      else if(kind==='stone'){const m=noise(u*5,v*5)*.7+noise(u*12,v*10)*.23+noise(u*35,v*30)*.07;const vein=Math.exp(-Math.pow((m-.47)*104,2));value=223+23*m+grain*8+vein*12;rv=.66+.26*m+.08*grain;}
      else if(kind==='cloth'){value=231+10*f+7*(i%2)+4*(j%2)+grain*3;rv=.92+grain*.08;}
      else{value=241+8*f+6*grain;rv=.83+.15*f;}
      for(let k=0;k<3;k++){buf[(j*n+i)*4+k]=value;rough[(j*n+i)*4+k]=Math.round(rv*255);}buf[(j*n+i)*4+3]=rough[(j*n+i)*4+3]=255;
    }
    function tex(data){const m=new T.DataTexture(data,n,n);m.wrapS=m.wrapT=T.RepeatWrapping;m.minFilter=T.LinearMipMapLinearFilter;m.magFilter=T.LinearFilter;m.generateMipmaps=true;m.needsUpdate=true;return m;}
    const map=tex(buf);map.colorSpace=T.SRGBColorSpace;return {map,roughnessMap:tex(rough)};
  }
  const textures={};for(const s of ['wood','stone','cloth','fine'])textures[s]=finish(s);
  function refineTextures(){for(const kind of Object.keys(textures)){const next=finish(kind,true);
    for(const key of ['map','roughnessMap']){textures[kind][key].image=next[key].image;textures[kind][key].needsUpdate=true;next[key].dispose();}}}
  const wind={value:0};
  function dapple(shader){
    shader.uniforms.branchWind=wind;
    shader.vertexShader='varying vec3 roomPosition;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nroomPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 roomPosition;uniform float branchWind;\n'+shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      vec2 sunP=roomPosition.xz+vec2(.49,.36)*roomPosition.y;
      sunP+=vec2(branchWind*.32,branchWind*.19);
      float cluster=sin(sunP.x*1.25+sin(sunP.y*.84))*cos(sunP.y*1.73-sunP.x*.46);
      float blades=sin(sunP.y*7.1+sunP.x*3.9+2.1*sin(sunP.x*2.2))+sin(sunP.x*5.3-sunP.y*2.5);
      float dapple=smoothstep(.22,.57,cluster+.15*blades);
      reflectedLight.directDiffuse*=mix(vec3(1.),vec3(.67,.72,.73),dapple);
      reflectedLight.directSpecular*=1.-.23*dapple;`);
  }
  function mat(color,r=.6,metal=0,type='fine',extra={}){const m=new T.MeshStandardMaterial({color,roughness:r,metalness:metal,...textures[type],...extra});m.onBeforeCompile=dapple;return m;}
  const M={
    wood:mat(0xd5ab83,.52,0,'wood'), blonde:mat(0xe7c89e,.48,0,'wood'),edge:mat(0xb28764,.58,0,'wood'), dark:mat(0x705044,.55,0,'wood'),lattice:mat(0x8d6150,.54,0,'wood'),bamboo:mat(0xceb27d,.47,0,'wood'),stone:mat(0xb9b8a9,.26,.035,'stone'), bevel:mat(0x9e9c8f,.39,0,'stone'),
    copper:mat(0xcb8460,.26,.82),copperIn:mat(0xd59c74,.24,.76),bronze:mat(0x8e6444,.37,.72),brass:mat(0xcaa46a,.28,.76),cream:mat(0xf6e9ce,.22,.07),porcelain:mat(0xf3efdf,.18,.045),jade:mat(0x79998a,.22,.09),ink:mat(0x546f64,.37,.14),tea:mat(0x9d5723,.13,.17),peach:mat(0xd9af9e,.87,0,'cloth'),plaster:mat(0xe5c5af,.88),paper:mat(0xf2e0bf,.87),steel:mat(0xa4aaa0,.23,.85),cane:mat(0xe4c896,.46,0,'wood'),
    sleeve:mat(0x87998e,.87,0,'cloth'),cuff:mat(0xb7b9a6,.81,0,'cloth'),rose:mat(0xc99283,.88,0,'cloth'),pink:mat(0xe8bba6,.84,0,'cloth'),skin:mat(0xd8a78b,.68),child:mat(0xeabda2,.7),nail:mat(0xe9b8a4,.52),oldnail:mat(0xdcad93,.55),ochre:mat(0xc49a51,.66),twig:mat(0x806b4c,.67),teaLeaf:mat(0x81896a,.77),groove:mat(0xa4a291,.55,0,'stone'),grooveLight:mat(0xc9c7b6,.4,0,'stone')
  };
  const filmData=new Uint8Array(8*6*4),film=new T.DataTexture(filmData,8,6),benchSize={value:new T.Vector2(1,1)};
  film.minFilter=film.magFilter=T.LinearFilter;film.needsUpdate=true;
  M.stone.onBeforeCompile=shader=>{dapple(shader);shader.uniforms.oilFilm={value:film};shader.uniforms.benchSize=benchSize;
    shader.fragmentShader='uniform sampler2D oilFilm;uniform vec2 benchSize;\n'+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      vec2 boardUV=clamp((roomPosition.xz-vec2(0.,.25))/benchSize/vec2(7.6,5.3)+vec2(.5,.45283),vec2(.001),vec2(.999));
      vec2 localFilm=texture2D(oilFilm,boardUV).rg;
      roughnessFactor*=.72+.49*(1.-localFilm.r);
      diffuseColor.rgb*=vec3(1.+.012*localFilm.g,1.,1.-.018*localFilm.g);`);};
  function updateFilm(sim,sx,sz){benchSize.value.set(sx,sz);for(let i=0;i<48;i++){filmData[i*4]=sim.stone[i].oil*255;filmData[i*4+1]=Math.min(255,(sim.stone[i].temperature-19)*12);filmData[i*4+3]=255;}film.needsUpdate=true;}
  function dishShadows(material,uniforms){
    material.onBeforeCompile=shader=>{
      dapple(shader);Object.assign(shader.uniforms,uniforms);
      const pcf=T.ShaderChunk.shadowmap_pars_fragment.replace('vec2 radius = shadowRadius * texelSize;',`
        float incidence=dot(candyNormal,vec3(-.56,1.,-.51));
        float gap=abs(incidence)>.06 ? dot(candyNormal,candyCenter-roomPosition)/incidence : rootHeight;
        float spread=baseSpread+.058*(clamp(gap,.0,4.)-rootHeight);
        float filterSize=clamp(spread*shadowMapSize.x/16.,.55,16.);
        vec2 radius=mix(shadowRadius,filterSize,dishActive)*texelSize;`);
      shader.fragmentShader='uniform vec3 candyCenter,candyNormal;uniform float rootHeight,baseSpread,dishActive;\n'+shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',pcf);
    };
  }
  function amber(color=0xdb8824){const m=new T.MeshPhysicalMaterial({color,metalness:.015,roughness:.145,clearcoat:.9,clearcoatRoughness:.095,transmission:.36,thickness:.15,attenuationColor:0xe89826,attenuationDistance:.31,ior:1.53,envMapIntensity:1.3,roughnessMap:textures.fine.roughnessMap});m.onBeforeCompile=dapple;return m;}
  M.amber=amber(0xe9a02d);M.syrup=amber(0xc77920);M.honey=amber(0xf2b94d);
  function group(parent){const g=new T.Group();if(parent)parent.add(g);return g;}
  function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const sphere=new T.SphereGeometry(1,20,14),cube=new T.BoxGeometry(1,1,1);
  function oval(p,x,y,z,rx,ry,rz,m){const o=mesh(p,sphere,m,x,y,z);o.scale.set(rx,ry,rz);return o;}
  function box(p,x,y,z,w,h,d,m){const o=mesh(p,cube,m,x,y,z);o.scale.set(w,h,d);return o;}
  function rod(p,a,b,r,m,r2=r,seg=12){a=V(...a);b=V(...b);const d=b.clone().sub(a);const o=mesh(p,new T.CylinderGeometry(r2,r,d.length(),seg),m);o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
  function tube(p,pts,r,m,segments=28,sides=8){const curve=new T.CatmullRomCurve3(pts.map(a=>V(...a)));return mesh(p,new T.TubeGeometry(curve,segments,r,sides,false),m);}
  function ring(p,x,y,z,r,wire,m){const o=mesh(p,new T.TorusGeometry(r,wire,8,64),m,x,y,z);o.rotation.x=pi/2;return o;}
  function lathe(p,profile,m,seg=64,x=0,y=0,z=0){return mesh(p,new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),seg),m,x,y,z);}
  function rounded(p,w,h,d,r,m,x=0,y=0,z=0,bevel=.045){
    const a=w/2-bevel,b=d/2-bevel,s=new T.Shape();r=Math.min(r,a*.8,b*.8);
    s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);
    const g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,h-2*bevel),bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:6});g.rotateX(-pi/2);g.translate(0,-h/2+bevel,0);
    // Keep the grain in object space across the entire face, including the bevel.
    const pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/4+pos.getY(i)*.18,pos.getZ(i)/3+pos.getY(i)*.35);
    return mesh(p,g,m,x,y,z);
  }
  function mergeGroup(root){
    root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(), buckets=new Map();
    root.traverse(o=>{if(!o.isMesh||o.material.transparent)return;let arr=buckets.get(o.material);if(!arr)buckets.set(o.material,arr=[]);arr.push(o);});
    for(const [m,arr] of buckets){if(arr.length<2)continue;
      let count=0,ni=0;for(const o of arr){count+=o.geometry.attributes.position.count;ni+=o.geometry.index?.count??o.geometry.attributes.position.count;}
      const pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2),idx=count>65535?new Uint32Array(ni):new Uint16Array(ni);
      let base=0,at=0;const v=V(),nm=new T.Matrix3(),matrix=new T.Matrix4();
      for(const o of arr){const g=o.geometry,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;matrix.multiplyMatrices(inv,o.matrixWorld);nm.getNormalMatrix(matrix);
        for(let j=0;j<pa.count;j++){v.fromBufferAttribute(pa,j).applyMatrix4(matrix).toArray(pos,(base+j)*3);v.fromBufferAttribute(na,j).applyNormalMatrix(nm).toArray(norm,(base+j)*3);if(ua){uv[(base+j)*2]=ua.getX(j);uv[(base+j)*2+1]=ua.getY(j);}}
        for(let j=0;j<(g.index?.count??pa.count);j++)idx[at++]=base+(g.index?g.index.getX(j):j);base+=pa.count;o.removeFromParent();}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(norm,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(idx,1));mesh(root,g,m);
    }
  }
  function plate(p,r,paint=true){
    const g=group(p);lathe(g,[[.001,.032],[r*.38,.032],[r*.4,0],[r*.45,0],[r*.47,.042],[r*.74,.065],[r*.98,.155],[r,.18],[r*.995,.197],[r*.97,.193],[r*.77,.114],[r*.64,.088],[.001,.084]],M.porcelain,80);
    ring(g,0,.188,0,r*.98,.009,M.brass);if(paint){ring(g,0,.123,0,r*.80,.008,M.jade);ring(g,0,.139,0,r*.85,.005,M.jade);
      for(let i=0;i<7;i++){const a=i*pi*2/7;for(let j=0;j<3;j++){const q=a+j*.062;const b=oval(g,Math.cos(q)*r*.90,.162,Math.sin(q)*r*.90,.055*r,.005,.013*r,M.ink);b.rotation.y=-q+(j%2?.61:-.61);}}}
    mergeGroup(g);return g;
  }
  function leafPaths(){
    const arr=[],W=t=>Math.pow(Math.max(0,Math.sin(pi*t)),.84)*(.67+.22*t);
    const center=t=>.11*Math.sin(t*pi*1.65);
    const point=(t,s=0)=>[center(t)+s*W(t),t*2.27,.095*Math.sin(t*pi)+.07*s*s*Math.sin(t*pi)];
    const form=(fn,num=16)=>Array.from({length:num+1},(_,i)=>fn(i/num));
    arr.push({p:form(t=>point(t)),r:.045});
    for(const sign of [-1,1]){
      arr.push({p:form(t=>point(t,sign*(1+.017*Math.sin(14*pi*t)))),r:.052});
      for(let i=0;i<5;i++){const a=.09+i*.145,b=a+.225;arr.push({p:form(t=>point(a+(b-a)*(t*.62+t*t*.38),sign*Math.sin(t*1.38)/Math.sin(1.38)),10),r:.031-i*.0019});
        if(i<4){arr.push({p:form(t=>point(a+.077+.225*t,sign*(.56+.44*t)),8),r:.016});}}
    }return arr;
  }
  const leafDesign=leafPaths();
  function showpiece(p){
    const g=group(p);lathe(g,[[.001,0],[.39,0],[.41,.042],[.36,.093],[.24,.117],[.14,.19],[.135,.23],[.001,.23]],M.jade);
    ring(g,0,.072,0,.378,.012,M.brass);ring(g,0,.215,0,.14,.014,M.brass);
    const leaf=group(g);leaf.position.set(.06,.19,0);leaf.rotation.set(-.18,-.15,.48);
    rod(leaf,[0,-.035,0],[0,1.47,0],.031,M.cane,.013);
    const head=group(leaf);head.position.y=.46;
    for(const a of leafDesign)tube(head,a.p,a.r,a.r>.04?M.amber:M.honey,26,9);
    tube(head,[[0,.43,0],[-.13,.18,.03],[-.29,.02,0],[-.42,.13,0],[-.37,.24,.01]],.03,M.amber);
    mergeGroup(g);return g;
  }
  function copperPot(p){
    const g=group(p);
    lathe(g,[[.001,.13],[.36,.13],[.54,.21],[.66,.38],[.72,.67],[.73,.78],[.716,.796],[.69,.782],[.67,.64],[.61,.4],[.48,.25],[.001,.20]],M.copper,80);
    ring(g,0,.773,0,.721,.027,M.copperIn);ring(g,0,.695,0,.712,.009,M.bronze);
    oval(g,0,.624,0,.675,.035,.675,M.syrup);
    const grip=[[-.59,.53,.01],[-.87,.59,.01],[-1.04,.69,.02],[-1.36,.74,.04]];
    tube(g,grip,.069,M.bronze);rod(g,[-1.03,.69,.02],[-1.87,.83,.055],.095,M.dark,.115,24);
    rod(g,[-1.04,.69,.02],[-1.16,.71,.025],.102,M.brass,.103,24);
    tube(g,[[.61,.51,-.13],[.88,.63,-.15],[.96,.66,0],[.88,.63,.15],[.61,.51,.13]],.039,M.copperIn);
    for(const z of [-.14,.14])oval(g,-.69,.58,z,.036,.044,.041,M.brass);
    // Woven trivet under the copper base.
    for(let i=0;i<6;i++)ring(g,0,.07,0,.3+i*.066,.047,M.bamboo);
    mergeGroup(g);return g;
  }
  function ladle(p){
    const g=group(p);const bowl=group(g);bowl.rotation.z=-.12;
    lathe(bowl,[[.002,0],[.105,.014],[.198,.065],[.247,.145],[.278,.212],[.276,.229],[.26,.234],[.242,.208],[.208,.139],[.14,.079],[.002,.049]],M.copperIn,56);
    ring(bowl,0,.222,0,.275,.014,M.brass);oval(bowl,0,.182,0,.246,.023,.246,M.syrup);
    const path=[[.204,.14,-.01],[.35,.245,-.035],[.56,.369,-.087],[.93,.51,-.15],[1.9,.78,-.32]];
    tube(g,path,.044,M.copper,32,10);rod(g,[.75,.441,-.12],[1.97,.8,-.33],.067,M.dark,.078,20);
    for(const t of [0,.08,.87,.97]){const x=.75+t*1.22,y=.441+t*.359,z=-.12-t*.21;rod(g,[x,y,z],[x+.045,y+.014,z-.008],.076,M.brass,.076,16);}
    oval(g,.251,.169,0,.04,.037,.04,M.brass);mergeGroup(g);return g;
  }
  function cradle(p){const g=group(p);const o=rounded(g,.9,.11,.72,.25,M.jade,0,.075,0,.045);
    for(const z of [-.21,.21])tube(g,[[-.39,.14,z],[-.28,.21,z],[-.20,.20,z],[0,.16,z],[.22,.22,z],[.36,.285,z]],.066,M.jade,18);
    for(const x of [-.29,.29])rod(g,[x,.01,0],[x,.08,0],.095,M.bronze);mergeGroup(g);return g;}
  function spatula(p){
    const g=group(p),s=new T.Shape();s.moveTo(-.31,-.42);s.quadraticCurveTo(0,-.48,.31,-.42);s.lineTo(.29,-.1);s.quadraticCurveTo(.27,.03,.095,.19);s.lineTo(-.095,.19);s.lineTo(-.28,0);s.closePath();
    const geo=new T.ExtrudeGeometry(s,{depth:.018,bevelEnabled:true,bevelSegments:2,bevelSize:.012,bevelThickness:.008,curveSegments:10});geo.rotateX(pi/2);mesh(g,geo,M.steel);
    rod(g,[0,.02,.12],[0,.20,1.03],.045,M.steel,.042);rod(g,[0,.088,.42],[0,.29,1.38],.084,M.blonde,.096,20);rod(g,[0,.088,.42],[0,.111,.53],.088,M.brass,.088);
    oval(g,0,.305,1.34,.023,.018,.027,M.bronze);mergeGroup(g);return g;
  }
  // Tapered ellipsoidal cross sections form the whole finger, including bent joints.
  function fleshTube(p,points,radii,m,flatten=.92){
    const curve=new T.CatmullRomCurve3(points.map(a=>V(...a))),n=18,k=12,frames=curve.computeFrenetFrames(n,false),verts=[],inds=[],uv=[];
    for(let i=0;i<=n;i++){const t=i/n,pt=curve.getPointAt(t),f=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(f)),r=mix(radii[j],radii[j+1],f-j);
      for(let k0=0;k0<=k;k0++){const a=k0/k*2*pi,v=pt.clone().addScaledVector(frames.normals[i],Math.cos(a)*r*flatten).addScaledVector(frames.binormals[i],Math.sin(a)*r);verts.push(...v.toArray());uv.push(t,k0/k);if(i&&k0){const d=i*(k+1)+k0;inds.push(d-k-2,d-k-1,d,d-k-2,d,d-1);}}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(inds);g.computeVertexNormals();const o=mesh(p,g,m);m.side=T.DoubleSide;return o;
  }
  function hand(p,small=false,open=false){
    const g=group(p),skin=small?M.child:M.skin,cloth=small?M.rose:M.sleeve,border=small?M.pink:M.cuff;
    // The grasp points along the handle. Both arms enter from the table edge.
    if(open){
      const palm=oval(g,.04,.02,0,.28,.11,.29,skin);palm.rotation.z=.12;
      for(let i=0;i<4;i++){const z=-.18+i*.105,x=-.11-Math.sin(i*.96)*.035;
        fleshTube(g,[[x,.02,z],[x-.18,.045,z-.018],[x-.30,.105,z-.032],[x-.35,.13,z-.044]],[.083,.072,.06,.012],skin);}
      fleshTube(g,[[.04,.04,.18],[-.015,.11,.28],[-.16,.16,.34],[-.225,.165,.34]],[.10,.09,.07,.015],skin);
    }else{
      const palm=oval(g,.12,.16,-.085,.29,.155,.22,skin);palm.rotation.z=.08;
      for(let i=0;i<4;i++){const x=-.16+i*.106,s=Math.sin(i*.91);
        fleshTube(g,[[x+.068,.19,-.105],[x,.218,.016],[x-.026,.17,.119],[x-.022,.074,.141],[x+.014,.006,.067],[x+.037,.007,.026]],[.075,.077,.069,.065,.054,.012],skin);}
      fleshTube(g,[[.23,.12,-.14],[.12,.19,-.21],[-.047,.23,-.164],[-.179,.226,-.057],[-.223,.19,-.021]],[.105,.099,.084,.072,.028],skin);
      const nail=oval(g,-.177,.26,-.07,.064,.009,.042,small?M.nail:M.oldnail);nail.rotation.y=.55;
    }
    fleshTube(g,[[.2,.10,-.03],[.39,.125,-.052],[.64,.115,-.11],[.84,.10,-.18]],[.167,.143,.158,.18],skin);
    const sleeve=group(g);sleeve.position.set(.45,.116,-.07);sleeve.rotation.z=small?.025:.09;sleeve.rotation.y=small?-.35:.12;
    const cuff=lathe(sleeve,[[.164,0],[.203,0],[.210,.035],[.207,.112],[.211,.17],[.168,.17]],border,36);cuff.rotation.z=-pi/2;
    const body=lathe(sleeve,[[.192,.15],[.224,.148],[.239,.188],[.229,.26],[.245,.31],[.259,.45],[.252,.53],[.27,.75],[.31,1.10],[.353,1.7],[.41,2.3],[.49,3.9],[.53,5.6]],cloth,40);body.rotation.z=-pi/2;
    for(const d of [.047,.077]){const seam=ring(sleeve,d,0,0,.209,.007,small?M.rose:M.sleeve);seam.rotation.set(0,pi/2,0);}
    mergeGroup(g);return g;
  }
  function ginkgo(p,size,m,arch=.12){
    const rings=6,fan=24,vertices=[],uv=[],index=[];
    for(let j=0;j<=rings;j++){const t=j/rings;for(let i=0;i<=fan;i++){
      const s=i/fan*2-1,angle=s*1.06,R=size*t*(1-.18*Math.exp(-s*s*59)+.033*Math.cos(i*1.85));
      vertices.push(R*Math.sin(angle),R*Math.cos(angle),size*(arch*(1-s*s)*t+.025*Math.cos(i*pi)*t));uv.push(i/fan,t);
      if(i&&j){const a=j*(fan+1)+i;index.push(a-fan-2,a-fan-1,a,a-fan-2,a,a-1);}}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();m.side=T.DoubleSide;const leaf=group(p);mesh(leaf,g,m);rod(leaf,[0,-size*.36,0],[0,.02,0],size*.018,M.twig,size*.011);return leaf;
  }
  function canopy(p){const g=group(p);const olive=mat(0xb2a16e,.82);olive.side=T.DoubleSide;
    tube(g,[[-2.3,.47,-.57],[-1.46,.23,-.27],[-.52,.05,-.15],[.36,-.14,.17],[1.20,-.22,.31]],.035,M.twig,22,8);
    for(let i=0;i<9;i++){const f=i/8,x=-1.77+2.85*f,y=.32-.60*f,z=-.32+.57*f,d=i%2===0?1:-1;
      const end=[x+.15,y+.15+d*.10,z+d*(.33+.16*Math.sin(i*2.1))];rod(g,[x,y,z],end,.016,M.twig,.009);
      for(let j=0;j<2;j++){const l=ginkgo(g,.23+.12*rand(),j%2?olive:M.ochre);l.position.set(end[0]+j*.05,end[1],end[2]);l.rotation.set(-.93+rand()*.73,.35+d*rand()*.81,(j*2-1)*.73);}}
    mergeGroup(g);return g;
  }
  function gaiwan(p){
    const g=group(p);const s=plate(g,.66);s.scale.y=.8;
    lathe(g,[[.001,.13],[.23,.13],[.23,.19],[.31,.21],[.42,.34],[.5,.54],[.545,.575],[.553,.594],[.537,.6],[.48,.55],[.40,.37],[.19,.205],[.001,.2]],M.jade);
    ring(g,0,.585,0,.548,.011,M.brass);
    lathe(g,[[.001,.63],[.46,.584],[.473,.6],[.44,.635],[.32,.694],[.17,.72],[.06,.733],[.065,.763],[.116,.79],[.12,.81],[.002,.82]],M.jade);
    ring(g,0,.606,0,.456,.008,M.cream);
    for(let i=0;i<8;i++){
      const a=i*pi*.25;const pts=Array.from({length:6},(_,j)=>{const t=j/5,q=a+t*.31,r=.33+t*.16;return[Math.sin(q)*r,.244+t*.269,Math.cos(q)*r];});
      tube(g,pts,.008,M.cream,10,5);
      for(let j=1;j<5;j++){const b=oval(g,...pts[j],.018,.052,.014,M.cream);b.rotation.z=(j%2?.58:-.58);}}
    mergeGroup(g);return g;
  }
  function room(p,compact){
    const g=group(p);box(g,0,2,-7.14,28,11,.35,M.plaster);box(g,0,-1.49,-4,30,.16,30,M.edge);
    const window=group(g);window.position.set(-1.2,.17,-6.83);
    box(window,0,2.45,-.065,11.5,5,.19,M.paper);
    for(let x=-5.68;x<5.8;x+=1.9){
      box(window,x,2.49,.13,.125,5.16,.17,M.lattice);
      for(const y of [.46,3.48]){box(window,x+.95,y,.108,1.9,.070,.13,M.lattice);
        for(const d of [.30,1.60])box(window,x+d,y+.26,.13,.058,.52,.12,M.lattice);
        box(window,x+.95,y+.51,.13,1.35,.065,.13,M.lattice);}
    }
    for(const y of [0,2.97,4.98])box(window,0,y,.12,11.6,.135,.2,M.lattice);
    rounded(window,11.92,.19,.52,.1,M.dark,0,-.09,.09);
    for(const x of [-7.3,5.52])box(g,x,2.1,-6.6,.33,8,.40,M.lattice);
    for(const y of [.23,.39])box(g,0,y,-6.7,28,.086,.23,M.edge);
    // A turned timber table with individually fitted planks and a deep front apron.
    for(let j=0;j<10;j++){const material=j%3?M.wood:M.blonde;rounded(g,16,.28,.95,.04,material,0,-.19,-4.37+j*.95,.022);}
    box(g,0,-.62,4.42,15.5,.69,.23,M.edge);box(g,0,-.44,4.54,15.6,.075,.10,M.blonde);
    box(g,0,-.92,4.50,15.4,.065,.09,M.dark);
    const drawer=rounded(g,3.42,.14,.54,.055,M.wood,0,-.64,4.55,.027);drawer.rotation.x=Math.PI/2;
    const escutcheon=oval(g,0,-.65,4.64,.25,.15,.034,M.bronze);
    for(const x of [-.21,.21])oval(g,x,-.645,4.664,.026,.025,.014,M.brass);
    const pull=mesh(g,new T.TorusGeometry(.115,.022,9,36),M.brass,0,-.71,4.71);pull.rotation.x=-.17;
    for(const x of [-6.9,-4.75,4.75,6.9])box(g,x,-1.81,4,.36,2.9,.40,M.dark);
    // Low rose linen runner, its selvedge and hand-tied fringe.
    const textile=group(g);textile.position.set(compact?-2.14:-3.20,-.024,-.05);textile.rotation.y=-.06;
    rounded(textile,1.45,.026,8.9,.06,M.peach,0,0,0,.008);
    for(const x of [-.63,-.59,.59,.63])box(textile,x,.016,0,.014,.006,8.84,M.cream);
    for(let i=0;i<23;i++)rod(textile,[-.67+i*.061,0,4.43],[-.67+i*.061+rand()*.026,-.025-rand()*.09,4.53+rand()*.07],.012,M.pink,.007,6);
    mergeGroup(g);return g;
  }
  function tabletop(p,sx){
    const g=group(p),w=8.04*sx,d=5.36;
    rounded(g,w+.69,.25,d+.65,.27,M.edge,0,.081,.25,.061);
    rounded(g,w+.64,.13,d+.60,.25,M.blonde,0,.226,.25,.046);
    rounded(g,w+.23,.058,d+.23,.25,M.bronze,0,.283,.25,.022);
    rounded(g,w+.135,.078,d+.135,.24,M.dark,0,.30,.25,.025);
    rounded(g,w,.205,d,.205,M.stone,0,.3875,.25,.062);
    // A fine double rule in the wooden frame and small flush brass corner pins.
    for(const z of [-d/2-.17,d/2+.67]){box(g,0,.294,z,w+.14,.003,.012,M.brass);}
    for(const x of [-1,1])for(const z of [-1,1]){
      const ax=x*(w*.5+.137),az=.25+z*(d*.5+.127);oval(g,ax,.294,az,.039,.011,.039,M.brass);box(g,ax,.304,az,.041,.002,.005,M.bronze);
    }
    const path=(a)=>{const t=a[1]/2.27;return[(SugarTable.start.x+1.95*t+a[0]*1.39)*sx,.491,.25+SugarTable.start.z-2.76*t+a[0]*.69];};
    for(const leaf of leafDesign){const pts=leaf.p.map(path);tube(g,pts,leaf.r>.04?.013:.008,M.groove,23,6);}
    // Engraved gingko sprigs occupy only the corners of the stone.
    for(const sign of [-1,1]){
      const deco=group(g);deco.position.set(sign*(w*.5-.37),.491,.25+sign*(d*.5-.36));deco.rotation.y=sign>0?0:pi;
      tube(deco,[[-.63,0,.045],[-.40,0,0],[-.16,0,-.095],[.04,0,-.32],[.082,0,-.57]],.010,M.groove,20,5);
      for(let j=0;j<4;j++){const a=oval(deco,-.47+j*.138,.001,-.020-j*j*.025,.106,.005,.026,M.groove);a.rotation.y=-.50+j*.42;}
    }
    mergeGroup(g);return g;
  }
  function extras(p,compact,sx){
    const g=group(p);
    const tea=gaiwan(g);tea.position.set(compact?-2.28:-4.85,-.031,compact?1.17:2.18);tea.rotation.y=.4;tea.scale.setScalar(compact?.86:1.18);
    // A bamboo quiver and tied spare skewers stay beside the stone.
    const rack=group(g);rack.position.set(compact?2.73:4.97,.01,-.28);rack.rotation.y=-.14;
    for(const z of [-.74,.84])rounded(rack,.69,.15,.27,.08,M.dark,0,.074,z,.028);
    for(let j=0;j<5;j++){let x=(j-2)*.104;rod(rack,[x,.19,-1.18+.1*rand()],[x+.04,.19,1.33+.2*rand()],.027,M.cane,.014,10);}
    const sprig=group(g);sprig.position.set(compact?-2.92:-5.7,.03,-3.18);
    lathe(sprig,[[.001,0],[.26,0],[.31,.06],[.39,.55],[.37,.74],[.21,.83],[.18,1.01],[.20,1.035],[.20,1.065],[.163,1.07],[.15,.92]],M.jade);
    for(let k=0;k<3;k++){const x=-.39+k*.39;const pts=[[0,.8,0],[x*.4,1.4,.02],[x*.9,2,.06],[x*2.3+.20,2.72+k*.28,0]];
      tube(sprig,pts,.024,M.twig,18,7);
      for(let j=0;j<6;j++){const t=(j+1)/7,base=[x*.38+t*x*1.42,1.25+t*(1.32+k*.24),.035],sign=j%2?1:-1;
        const end=[base[0]+sign*(.20+.18*t),base[1]+.15,base[2]+.045];rod(sprig,base,end,.015,M.twig,.008,7);
        const l=ginkgo(sprig,.24+.08*rand(),j%3===0?M.teaLeaf:M.ochre);l.position.set(...end);l.rotation.set(-.15+rand()*.8,rand()*.7,sign*-.79);}}
    // Scattered leaves have folded fans, midribs and separate stalks.
    for(const [x,z,angle,s] of [[-3.5,3.48,-1.2,.42],[-3.04,3.69,-.6,.26],[3.62,3.07,2.6,.35],[1.2,-3.65,.8,.35],[-4.6,-1.45,-.2,.4]]){
      const leaf=ginkgo(g,s,M.ochre);leaf.position.set(x*sx,-.025,z);leaf.rotation.set(-1.39,0,angle);}
    mergeGroup(g);return g;
  }
  return {T,V,M,wind,env,canopy,dishShadows,updateFilm,refineTextures,mat,group,mesh,oval,rod,tube,ring,lathe,box,rounded,mergeGroup,hand,showpiece,copperPot,ladle,plate,spatula,cradle,room,tabletop,extras,leafDesign,amber};
})();
