"use strict";
const Objects=(()=>{
  const {T,V,TAU,group,mesh,ell,box,cylinder,path,ring,lathe,slab,frame,texture,noise,mat,phys,woodtex,timber,pale,cedar,iron,rim,brass,steel,jade,stone,sandTex,sand,cotton,tea,cobalt,rnd,clamp}=Studio;
  const blue=mat(0x93b4a5,.32,.16,{map:noise});
  function basin(parent){
    const g=group(parent);
    slab(g,stone,5.08,4.38,.42,.37,0,.04,0,.08);
    frame(g,stone,5.08,4.38,.42,.36,.87,.12,.08);
    const floor=mat(0x6c9d89,.43,.12,{map:noise,bumpMap:noise,bumpScale:.02});
    slab(g,floor,4.42,3.73,.25,.03,0,.44,0);
    const pool=phys(0x7daf9c,.18,{transparent:true,opacity:.30,clearcoat:1,depthWrite:false,metalness:.12});
    slab(g,pool,4.39,3.68,.22,.012,0,.7,0,.008).castShadow=false;
    const bowl=group(g);bowl.position.set(-.07,.36,.02);
    const glass=lathe(bowl,jade,[[.68,.13],[.85,.15],[1.18,.29],[1.42,.52],[1.61,.85],[1.665,1.08],[1.65,1.12],[1.60,1.08],[1.56,.88],[1.38,.56],[1.14,.35],[.82,.22],[.64,.22]],100);glass.castShadow=false;glass.renderOrder=3;
    const edge=phys(0xc6e0ce,.11,{clearcoat:1,metalness:.27,transparent:true,opacity:.78});
    ring(bowl,edge,0,1.115,0,1.64,.041,112).renderOrder=5;
    ring(bowl,edge,0,.205,0,.74,.044);
    const caustic=mat(0x92b9a7,.31,.11,{map:noise,bumpMap:noise,bumpScale:.014});
    const uni={value:0}, ripple={value:0};
    caustic.onBeforeCompile=shader=>{
      shader.uniforms.waterTravel=uni;shader.uniforms.waveEnergy=ripple;
      shader.vertexShader='varying vec3 floorP;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloorP=position;');
      shader.fragmentShader='varying vec3 floorP; uniform float waterTravel; uniform float waveEnergy;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 p=floorP.xz*3.6;float t=waterTravel;
      p+=.41*vec2(sin(p.y*1.54+t*.42),cos(p.x*1.31-t*.31));
      vec2 q=p*1.45+vec2(.75*sin(p.y*1.37-t*.47),.77*cos(p.x*1.61+t*.41));
      float a=sin(q.x+sin(q.y*.86+t*.38))+.81*cos(q.y-sin(q.x*.85-t*.24));
      float b=sin(q.x*1.04+sin(q.y*.86+t*.38)+.18)+.83*cos(q.y-sin(q.x*.85-t*.24)+.12);
      float ray=exp(-11.*abs(a))*.64+exp(-13.*abs(b))*.32;
      diffuseColor.rgb*=.83+.12*sin(p.x*.77+p.y*.60+t*.12);
      diffuseColor.rgb+=vec3(.60,.62,.40)*ray*(.75+waveEnergy*.12);`);
    };
    const bottom=lathe(bowl,caustic,[[.001,.223],[.75,.223],[1.06,.30],[1.34,.47],[1.48,.66],[1.56,.84]].reverse(),100);bottom.material.side=T.DoubleSide;
    const rg=25,sg=88,arr=[],idx=[],uv=[],cells=[];
    for(let j=0;j<=rg;j++)for(let i=0;i<=sg;i++){
      const x=Math.cos(i/sg*TAU)*j/rg,z=Math.sin(i/sg*TAU)*j/rg;
      arr.push(x*1.56,.886,z*1.56);uv.push(x,z);
      const wx=(x+1)*11,wz=(z+1)*11,ix=Math.min(21,Math.floor(wx)),iz=Math.min(21,Math.floor(wz));cells.push([iz*23+ix,wx-ix,wz-iz]);
      const k=j*(sg+1)+i;if(j<rg&&i<sg)idx.push(k,k+1,k+sg+1,k+1,k+sg+2,k+sg+1);
    }
    const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(arr,3));wg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));wg.setIndex(idx);wg.setAttribute('swell',new T.Float32BufferAttribute(new Float32Array(cells.length),1));wg.computeVertexNormals();
    const wm=phys(0xa7d7ca,.105,{clearcoat:1,clearcoatRoughness:.08,metalness:.22,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide,envMapIntensity:1.4});
    wm.onBeforeCompile=sh=>{
      sh.vertexShader='attribute float swell;varying float waterCrest;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwaterCrest=swell;');
      sh.fragmentShader='varying float waterCrest;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb+=vec3(.28,.32,.27)*smoothstep(.10,1.75,waterCrest);');
    };
    const surface=mesh(bowl,wg,wm);surface.castShadow=false;surface.renderOrder=4;
    const plug=group(g);plug.position.set(-1.87,.54,-1.21);cylinder(plug,iron,0,0,0,.17,.21,.08,24);
    ring(plug,brass,0,.06,0,.08,.023,20);
    for(let i=0;i<14;i++){const a=i/13;let loop=ring(g,steel,-1.88-.19*Math.sin(a*3.2),.58+.42*a*a,-1.21-a*.79,.038,.009,12);loop.rotation.z=i%2*.94;}
    // Cut bamboo inlet, its hollow bore and culm joint.
    const pipe=group(g);pipe.position.set(-.29,1.86,-1.37);pipe.rotation.x=1.49;
    const bamboo=mat(0x9b985e,.37,0,{map:woodtex});
    lathe(pipe,bamboo,[[.151,0],[.181,.025],[.184,1.45],[.208,1.49],[.202,1.54],[.18,1.56],[.18,2.4]],48);
    pipe.rotation.x=-Math.PI/2+.10;
    const bore=mat(0x574e2b,.89);lathe(pipe,bore,[[.148,.01],[.147,.3],[.001,.32]],40).material.side=T.DoubleSide;
    const cut=phys(0xd3bf81,.39);lathe(pipe,cut,[[.148,0],[.18,0],[.18,.025]],48).material.side=T.DoubleSide;
    const streamMat=phys(0xc5e3cf,.13,{transparent:true,opacity:.44,clearcoat:1,depthWrite:false});
    const stream=path(g,streamMat,[[-.29,1.82,-1.36],[-.29,1.77,-1.25],[-.29,1.60,-1.16],[-.29,1.26,-1.10]],.031,16);stream.castShadow=false;
    function update(s){
      uni.value=s.air.lightTravel;
      ripple.value=Math.min(2,Math.abs(s.water[264].height));const attr=wg.attributes.position;
      for(let i=0;i<cells.length;i++){const [k,x,z]=cells[i];const a=s.water[k].height*(1-x)+s.water[k+1].height*x,b=s.water[k+23].height*(1-x)+s.water[k+24].height*x;const height=a*(1-z)+b*z;attr.setY(i,.886+height/80);wg.attributes.swell.setX(i,height);}
      attr.needsUpdate=wg.attributes.swell.needsUpdate=true;wg.computeVertexNormals();stream.scale.x=s.net.flow+s.water[72].height*.012;plug.position.y=.54+s.net.plug*.37;plug.rotation.z=-s.net.plug*.28;
    }return {g,bowl,plug,update};
  }
  function sieve(parent){
    const g=group(parent),wire=mat(0x9aaba4,.29,.85);
    const r=.57;for(let i=1;i<=7;i++){let f=i/7;ring(g,i===7?steel:wire,0,-.235+.235*f*f,0,r*f,i===7?.036:.014,60);}
    for(let i=0;i<16;i++){
      let a=i/16*TAU;path(g,wire,Array.from({length:6},(_,j)=>{let t=j/5;return [Math.cos(a)*r*t,-.235+.235*t*t,Math.sin(a)*r*t];}),.009,10);
    }
    for(const side of [-1,1])path(g,steel,[[side*.24,-.039,-.49],[side*.16,.045,-.65],[side*.055,.15,-1.27],[side*.05,.20,-1.91]],.023);
    const grip=ell(g,pale,0,.21,-1.60,.098,.081,.51);grip.rotation.x=.09;
    return g;
  }
  function spoon(parent){
    const g=group(parent);const cup=lathe(g,steel,[[.001,-.12],[.17,-.095],[.31,-.035],[.34,0],[.31,.017],[.16,-.073],[.001,-.095]],44);
    cup.scale.z=1.34;path(g,steel,[[0,0,-.38],[0,.04,-.63],[0,.18,-1.53],[0,.205,-1.78]],.050);
    ell(g,cedar,0,.18,-1.43,.11,.071,.54);return g;
  }
  function tray(parent){
    const g=group(parent);slab(g,cedar,4.30,2.84,.26,.17,0,.06,0,.07);
    frame(g,pale,4.29,2.84,.25,.122,.21,.195,.057);
    frame(g,cedar,4.05,2.60,.165,.034,.04,.258,.014);
    const nx=75,nz=44,pos=[],uv=[],colors=[],idx=[],cache=[];
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
      let x=(i/nx*2-1),z=(j/nz*2-1);const rim=Math.max(Math.abs(x)**12,Math.abs(z)**12);
      const xx=x*(1.994-.056*Math.abs(z)**14),zz=z*(1.263-.048*Math.abs(x)**14);
      const furrow=Math.pow(.5+.5*Math.cos(z*32+x*1.1+1.7*Math.sin(x*2.2)),4);
      const y=.304+.027*Math.sin(x*6.7+z*4)+.019*Math.sin(z*14-x*3.6)+.055*furrow*(.45+.55*Math.cos(x*1.3))-.041*rim+.006*(rnd()-.5);
      const k=Math.round(j/nz*(Warabi.PZ-1))*Warabi.PX+Math.round(i/nx*(Warabi.PX-1));
      cache.push({k,y});pos.push(xx,y,zz);uv.push(i/nx*6,j/nz*4);colors.push(1,1,1);
      const v=j*(nx+1)+i;if(i<nx&&j<nz)idx.push(v,v+nx+1,v+1,v+1,v+nx+1,v+nx+2);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();
    const m=sand.clone();m.vertexColors=true;mesh(g,geo,m);
    // Loose grains form small banks against the wooden rim.
    const grains=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),mat(0xdfba86,.97),1250);
    const dummy=new T.Object3D();for(let i=0;i<1250;i++){const k=Math.floor(rnd()*cache.length),r=.006+rnd()*.013;dummy.position.set(pos[k*3],pos[k*3+1]+.006,pos[k*3+2]);dummy.scale.set(r,r*.55,r*.75);dummy.rotation.y=rnd()*6;dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}g.add(grains);
    function update(s){
      const p=geo.attributes.position,c=geo.attributes.color;
      for(let i=0;i<cache.length;i++){const k=cache[i],cell=s.powder[k.k];p.setY(i,k.y+(cell.depth-4)/80);c.setXYZ(i,1-cell.wet*.96,1-cell.wet*1.2,1-cell.wet*1.45);}
      p.needsUpdate=c.needsUpdate=true;geo.computeVertexNormals();
    }return {g,update};
  }
  // Scalloped hand-painted porcelain. The cobalt decoration follows the fired surface.
  function dish(parent){
    const g=group(parent);const prof=[[.001,.082],[.36,.082],[.45,.06],[.48,.09],[.47,.16],[.63,.20],[.83,.29],[.99,.42],[1.045,.49],[1.04,.525],[.99,.53],[.89,.42],[.73,.32],[.47,.247],[.001,.222]];
    const o=lathe(g,tea,prof,112),p=o.geometry.attributes.position;
    for(let i=0;i<p.count;i++){let x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z),a=Math.atan2(z,x),f=Math.max(0,(r-.55)/.5);const scallop=Math.cos(a*12);p.setXYZ(i,x*(1+.034*scallop*f),p.getY(i)+f*.036*scallop,z*(1+.034*scallop*f));}o.geometry.computeVertexNormals();
    const painted=[];for(let i=0;i<=144;i++){const a=i/144*TAU,r=1.029*(1+.033*Math.cos(a*12));painted.push([r*Math.cos(a),.528+.035*Math.cos(a*12),r*Math.sin(a)]);}
    path(g,cobalt,painted,.017,144);ring(g,cobalt,0,.284,0,.572,.016);
    for(let i=0;i<12;i++){
      const a=i/12*TAU+.15;
      const petal=(u,r,h,sx,sz,tilt)=>{const m=ell(g,cobalt,Math.cos(u)*r,h,Math.sin(u)*r,sx,.009,sz,12);m.rotation.y=-u+tilt;m.rotation.z=.5;};
      petal(a,.814,.381,.094,.025,-.53);petal(a+.103,.861,.402,.078,.024,.55);
      petal(a+.02,.94,.473,.034,.028,0);
    }return g;
  }
  function morsel(parent,finished=false){
    const o=group(parent),geo=new T.SphereGeometry(1,48,32),pos=geo.attributes.position,colors=new Float32Array(pos.count*3),src=[],key=[];
    const dirs=Array.from({length:84},(_,i)=>{const y=1-2*(i+.5)/84,r=Math.sqrt(1-y*y);return V(r*Math.cos(i*2.3999632),y,r*Math.sin(i*2.3999632));});
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),f=1+.047*Math.sin(x*4.1+z*3.2)+.036*Math.cos(y*4-z*2)+.018*Math.sin(x*9+z);
      const py=y<-.5?-.5+(y+.5)*.58:y;
      src.push([x*f,py*f,z*f]);let best=-2,n=0;dirs.forEach((d,j)=>{let dot=d.x*x+d.y*y+d.z*z;if(dot>best){best=dot;n=j;}});key.push(n);
      pos.setXYZ(i,x*f,py*f,z*f);colors.set([1,1,1],i*3);
    }
    geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.computeVertexNormals();
    const m=finished?mat(0xf0d0a3,.91,0,{map:sandTex,bumpMap:sandTex,bumpScale:.027}):phys(0xffffff,.16,{vertexColors:true,clearcoat:.9,clearcoatRoughness:.09,transparent:true,opacity:.83,depthWrite:false});
    const body=mesh(o,geo,m);body.scale.set(.43,.34,.38);body.renderOrder=6;
    const rough=new Float32Array(pos.count);geo.setAttribute('coat',new T.BufferAttribute(rough,1));
    if(!finished)m.onBeforeCompile=sh=>{
      sh.vertexShader='attribute float coat; varying float vCoat; varying vec3 crumbP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCoat=coat; crumbP=position;');
      sh.fragmentShader='varying float vCoat; varying vec3 crumbP;\n'+sh.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.96,vCoat);').replace('#include <color_fragment>',`#include <color_fragment>
      float fleck=fract(sin(dot(floor(crumbP*128.),vec3(12.71,83.1,31.7)))*43758.5);
      diffuseColor.rgb*=1.+vCoat*(fleck-.5)*.31;
      diffuseColor.a=mix(diffuseColor.a,1.,vCoat);`);
    };
    let beads,beadPose;
    if(!finished){
      beads=new T.InstancedMesh(new T.SphereGeometry(1,10,7),phys(0xcadcc7,.10,{clearcoat:1,metalness:.17,transparent:true,opacity:.69}),14);
      beads.renderOrder=7;beads.frustumCulled=false;o.add(beads);beadPose=new T.Object3D();
    }
    function update(s){
      let coat=0;
      for(let j=0;j<14;j++){
        const c=s.skin[(5+j*6)%84],size=.031*Math.max(.001,c.wet-.16)*(1-c.powder);
        const f=1+.047*Math.sin(c.x*4.1+c.z*3.2)+.036*Math.cos(c.y*4-c.z*2);
        beadPose.position.set(c.x*f*.434,c.y*f*.342,c.z*f*.385);
        beadPose.scale.set(size,size*.72,size);beadPose.updateMatrix();beads.setMatrixAt(j,beadPose.matrix);
      }
      beads.instanceMatrix.needsUpdate=true;
      for(let i=0;i<pos.count;i++){
        const c=s.skin[key[i]],[x,y,z]=src[i],f=1+c.elastic*.7;
        pos.setXYZ(i,x*f,y*f,z*f-s.bite.elongation*.62*Math.max(0,-z)**2);
        const powder=c.powder,damp=c.bruise,hot=clamp((c.temperature-19)/50);
        const cr=.45+hot*.12,cg=.59-hot*.13,cb=.50-hot*.18;
        geo.attributes.color.setXYZ(i,cr+( .80-damp*.54-cr)*powder,cg+(.55-damp*.46-cg)*powder,cb+(.257-damp*.25-cb)*powder);
        rough[i]=powder;coat+=powder;
      }
      geo.attributes.coat.needsUpdate=geo.attributes.color.needsUpdate=pos.needsUpdate=true;geo.computeVertexNormals();m.clearcoat=.95-.85*coat/pos.count;
    }return {o,body,update};
  }
  function fabric(parent,w,d,m=cotton,repeat=1){
    const g=new T.PlaneGeometry(w,d,32,25);g.rotateX(-Math.PI/2);const p=g.attributes.position,u=g.attributes.uv;
    for(let i=0;i<p.count;i++){let x=p.getX(i),z=p.getZ(i);const y=.045+.045*Math.cos(x*6.4+z*.73)*(.35+.65*(.5+.5*Math.sin(z*2.2)))+.082*Math.exp(-((x+w*.34+z*.22)**2)/.028);p.setXYZ(i,x+.038*Math.sin(z*3+x*.6),y,z+.027*Math.sin(x*4.3+z*.4));u.setXY(i,u.getX(i)*w*.78*repeat,u.getY(i)*d*.78*repeat);}
    g.computeVertexNormals();const o=mesh(parent,g,m);o.material.side=T.DoubleSide;return o;
  }
  function leaf(parent,x,y,z,size,angle,color=0x526a34){
    const g=group(parent);g.position.set(x,y,z);g.scale.setScalar(size);g.rotation.y=angle;
    const vs=[],cs=[],idx=[];const base=new T.Color(color);
    for(let i=-3;i<=3;i++){
      const a=i*.47,L=1-Math.abs(i)*.16,dir=[Math.sin(a),-Math.cos(a)],side=[Math.cos(a),Math.sin(a)];
      const count=13,start=vs.length/3;
      for(let j=0;j<=count;j++){let t=j/count,w=Math.sin(Math.PI*t)**.93*(.093+(3-Math.abs(i))*.009)*(j%2?.86:1.13)*L;
        for(let l=-1;l<=1;l++){const lx=dir[0]*t*L+side[0]*l*w,lz=dir[1]*t*L+side[1]*l*w;
          vs.push(lx,.06*Math.sin(t*Math.PI)+.07*t*t-.04*Math.abs(l),lz);const v=1+.13*(l===0)+.19*t+.05*i;cs.push(base.r*v,base.g*v,base.b*v);}
        if(j<count){let k=start+j*3;idx.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5);}
      }
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vs,3));geo.setAttribute('color',new T.Float32BufferAttribute(cs,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,mat(0xffffff,.53,0,{vertexColors:true,side:T.DoubleSide}));
    path(g,mat(0x7b7641,.69),[[0,0,.21],[0,.023,0],[0,.055,-.39],[0,.064,-.86]],.009,9);return g;
  }
  function branch(parent){
    const g=group(parent),bark=mat(0x68613a,.70);
    path(g,bark,[[-2.1,.04,-.6],[-1.1,.08,-.4],[-.2,.06,-.04],[.7,.04,.28],[1.56,.055,.40]],.030,24);
    const leaves=[];for(let i=0;i<10;i++){
      const x=-1.70+i*.32,z=x*.31+.02,sign=i%2?-1:1;
      const ex=x+.13+rnd()*.31,ez=z+sign*(.28+rnd()*.44);
      path(g,bark,[[x,.07,z],[(x+ex)/2,.1,(z+ez)/2],[ex,.08,ez]],.013,8);
      leaves.push(leaf(g,ex,.12,ez,.52+rnd()*.49,sign>0?2.8+rnd()*.9:-.9+rnd()*.6,[0x536d35,0x687d3a,0x496937,0x829247][i%4]));
    }return {g,leaves};
  }
  // A tapered sleeve, palm and individually bent fingers, all in the same arm space.
  function arm(parent,holding=false){
    const g=group(parent);const skin=phys(0xdba789,.61,{clearcoat:.06});
    const sleeve=mat(0x8e9e9b,.91,0,{bumpMap:noise,bumpScale:.021}),cuff=mat(0xd3cbb2,.91,0,{bumpMap:noise,bumpScale:.018});
    function section(m,rings,n=24){
      const a=[],indices=[];
      for(let j=0;j<rings.length;j++){const [x,y,z,ry,rz]=rings[j];for(let i=0;i<n;i++){
        const t=i/n*TAU;a.push(x,y+Math.sin(t)*ry,z+Math.cos(t)*rz);if(j<rings.length-1){const v=j*n+i,b=j*n+(i+1)%n;indices.push(v,v+n,b,v+n,b+n,b);}
      }}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(a,3));geo.setIndex(indices);geo.computeVertexNormals();m.side=T.DoubleSide;return mesh(g,geo,m);
    }
    section(sleeve,[[-21,-.2,0,.42,.74],[-4.3,-.10,0,.38,.67],[-2.8,-.04,.05,.37,.64],[-1.6,.0,.04,.29,.46],[-1.22,.045,.005,.28,.48],[-1.02,.03,0,.25,.39],[-.85,.01,0,.24,.40]]);
    section(cuff,[[-1,.035,0,.26,.43],[-.88,.04,0,.28,.43],[-.69,.02,0,.235,.35]]);
    section(skin,[[-.83,.022,.01,.17,.29],[-.48,0,0,.154,.236],[-.14,.015,0,.15,.265],[.16,.04,0,.174,.34],[.39,.028,-.015,.14,.315],[.49,.02,-.016,.09,.235]]);
    const nails=mat(0xe8bca5,.48);
    for(let j=0;j<4;j++){
      const z=-.256+j*.153,len=[.35,.42,.38,.27][j],start=.32+(j===0?.01:0),sz=.082-(j===3?.013:0);
      section(skin,[[start,.033,z,sz,sz],[start+len*.47,.08,z-.018,sz*.94,sz*.93],[start+len*.85,.047,z-.035,sz*.88,sz*.84],[start+len,.005,z-.04,sz*.74,sz*.7],[start+len+.032,-.025,z-.04,.013,.012]],14);
      ell(g,nails,start+len*.82,.113,z-.033,.062,.015,.046,12);
    }
    const thumb=ell(g,skin,.16,.11,.325,.266,.109,.117);thumb.rotation.y=-.60;
    ell(g,nails,.331,.171,.435,.061,.017,.052,12);
    return g;
  }
  return {basin,sieve,spoon,tray,dish,morsel,fabric,leaf,branch,arm};
})();
