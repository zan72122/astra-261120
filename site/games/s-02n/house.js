'use strict';
const House=(()=>{
const {T,PI,TAU,V,rand,group,mat,mesh,box,oval,cyl,tor,lathe,line,rod,batch,tex,M,shade,roundBox}=Art;
function table(g,x,y,z,w,d,wood=M.wood){
  const t=group(g,x,y,z);box(t,0,-2,0,w,3.8,d,wood);
  for(const j of [-1,1]){
    box(t,0,-6,j*(d/2-3),w-6,6,2.8,M.honey);
    for(const i of [-1,1])box(t,i*(w/2-5),-y*.52,j*(d/2-5),4.6,y*.94,4.6,M.honey)
  }
  return t
}
function ceramic(g,x,y,z,r,h,m=M.glaze,paint=M.blue){
  const o=group(g,x,y,z);
  lathe(o,0,0,0,[[0,.12],[r*.53,.12],[r*.57,.4],[r*.57,.7],[r*.66,h*.13],[r*.88,h*.32],[r,h*.73],[r*.99,h*.96],[r*.96,h],[r*.88,h-.04],[r*.85,h*.7],[r*.59,h*.22],[0,h*.17]],m,40);
  for(const yy of [.22,.82,.92])tor(o,0,h*yy,0,r*(yy>.8?.992:.77),r*.018,paint);
  return o
}
function plant(g,x,y,z,height,pot=true){
  const o=group(g,x,y,z),green=[mat(0x587347),mat(0x71844f),mat(0x3f6546)],stem=mat(0x7f7751);
  if(pot)ceramic(o,0,0,0,height*.15,height*.27,M.celadon,M.sand);
  for(let i=0;i<7;i++){
    const a=i*2.4,b=.13*height,end=[Math.cos(a)*b,height*(.68+rand()*.32),Math.sin(a)*b];
    rod(o,[0,height*.21,0],end,height*.009,stem,height*.004,5);
    for(let j=0;j<3;j++){
      const t=.46+j*.20,l=height*(.16+rand()*.09),th=a+j*2.7;
      leaf(o,end[0]*t,end[1]*t,end[2]*t,l,l*.40,th,-.13+rand()*.6,green[(i+j)%3]);
    }
  }
  return o
}
function leaf(g,x,y,z,len,w,ang,up,m){
  const geo=new T.BufferGeometry(),p=[],uv=[],ind=[];
  for(let j=0;j<=7;j++){
    const t=j/7,s=Math.sin(t*PI),v=w*s*.5;
    p.push(-v,len*t*up+len*.14*s,len*t,0,len*t*up+len*.19*s,len*t,v,len*t*up+len*.14*s,len*t);
    uv.push(0,t,.5,t,1,t);
    if(j){let k=(j-1)*3;ind.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5)}
  }
  geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();
  m.side=T.DoubleSide;const o=mesh(g,geo,m,x,y,z);o.rotation.y=ang;return o
}
function textile(g){
  const p=[],uv=[],ind=[],nx=28,nz=48,front=25.91;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/nz,x=-24+42*u,d=-8+41*v;
    const bend=Math.max(0,d-front),z=Math.min(d,front)+Math.sin(Math.min(bend,1.52))*1.05;
    const y=76.035+.025*Math.sin(u*36+v*8)-Math.max(0,bend-1)+.12*Math.sin(u*48)*Math.min(1,bend);
    p.push(x+.26*Math.sin(v*3),y,z);uv.push(v*1.03,u);
    if(j&&i){let k=j*(nx+1)+i;ind.push(k-nx-2,k-1,k,k-nx-2,k,k-nx-1)}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();mesh(g,geo,M.cloth);
  const thread=mat(0xcec9b2);
  for(let i=0;i<104;i++){const x=-24+42*i/104,l=.27+rand()*.68;rod(g,[x,69.96,26.96],[x+.16*(rand()-.5),69.96-l,26.94],.046,thread,.023,4)}
}
function build(scene){
  const fixed=group(scene),f=group(fixed);
  const floorMat=M.frame,groove=mat(0x8e7459),cream=M.plaster;
  box(f,-14,-2,-85,355,3,450,groove);
  for(let i=-8;i<9;i++)box(f,i*18,-.65,-69,17.9,1.2,396,floorMat);
  // Split worktop gives the child a standing place next to the pouring vessel.
  table(f,10,75.94,-8,70,67.8);
  table(f,-45,75.94,-22.85,40,38.1);
  for(const z of [-35,-18,-1,16])box(f,10,75.957,z,69.7,.008,.035,M.honey);
  // Flush-front drawers, worn pulls and the lower shelf belong to the workbench.
  box(f,10,63.7,22.8,59,14.4,3.2,M.honey);
  for(let i=0;i<2;i++){
    const x=-5+i*29.65;box(f,x,64.3,24.49,28.9,11.4,1.0,M.wood);
    line(f,[[x-3.5,65.1,25],[x-3.2,64.8,26.3],[x-2.3,64.3,26.9],[x+2.3,64.3,26.9],[x+3.2,64.8,26.3],[x+3.5,65.1,25]],.31,M.iron,14)
  }
  box(f,10,17,-7,60,2.2,54,M.honey);
  box(f,-2,18.6,-1,27,1.8,28,M.wood);
  textile(f);
  table(f,-32,47,-146,92,84,M.honey);
  table(f,-37,63,-78,54,32,M.wood);
  // Low, distant garden haze begins beyond the veranda.
  box(f,78,99,-101,84,198,7,cream);box(f,-135,99,-101,77,198,7,cream);
  box(f,-115,96,5,5,192,212,cream);box(f,113,95,7,5,190,218,cream);
  box(f,-30,181,-101,222,12,11,M.darkwood);
  for(const x of [-97,36])box(f,x,88,-101,5,179,9,M.frame);
  box(f,-28,.7,-101,139,1.4,10,M.frame);
  // A half-raised split-bamboo sunshade casts narrow bands through the doorway.
  const blind=group(f,-74,159,-104);
  for(let j=0;j<24;j++)rod(blind,[-20,j*.52,0],[20,j*.52,0],.228,j%4?M.bamboo:M.binding,.228,5);
  for(const x of [-15.7,0,15.7])rod(blind,[x,-.2,.24],[x,13,.24],.078,M.darkwood);
  const roll=cyl(blind,0,-1.45,0,1.65,1.65,40,M.bamboo,18);roll.rotation.z=Math.PI/2;

  for(const z of [-104,-101,-98])box(f,-29,1.43,z,133,.12,.26,groove);
  const shoji=group(f,27,0,-102),paper=mat(0xf4e7c9,.98,{emissive:0x97866c,emissiveIntensity:.13});
  box(shoji,0,88,0,27,173,2,paper);for(const x of [-14,14])box(shoji,x,88,1.6,2.8,175,3,M.frame);
  for(let x=-7;x<14;x+=7)box(shoji,x,91,1.61,.65,161,1,M.frame);
  for(let y=8;y<178;y+=17)box(shoji,0,y,1.7,27,.85,1,M.frame);
  box(shoji,0,9,1.5,27,17,2.2,M.honey);
  const rail=mat(0x887e62);for(const x of [-98,54])box(f,x,86,-185,4.8,174,4.8,M.frame);
  for(let j=0;j<12;j++)box(f,-19,.3,-108-j*7,221,.8,6.9,M.honey);
  box(f,-20,-8,-191,219,16,5,M.darkwood);
  box(f,-23,-18,-270,490,4,245,mat(0xb4b29a));
  box(f,94,41,-91,83,82,24,M.celadon);box(f,94,84,-91,85,3.4,27,M.wood);
  const tileColors=[0x9eb6a4,0xb0c1ad,0xa6b9a8,0xbac8b4].map(n=>mat(n,.35));
  for(let i=0;i<8;i++)for(let j=0;j<4;j++)box(f,42+i*10.5,89+j*10.4,-96.9,10.27,10.17,1,tileColors[(i*5+j*3)%4]);
  box(f,80,133,-94,74,2.8,15,M.wood);
  table(f,8,68,-78,37,22,M.honey);
  table(f,9,38,-92,28,22);table(f,-31,14,7,21,23,M.frame);
  table(f,-20,25,-195,51,20,M.wood);
  const walls=group(scene);
  // Thin long-grain planks catch different amounts of daylight.
  box(walls,-86,60,-78,34,120,29,M.honey);box(walls,-86,122,-78,36,3,32,M.wood);
  for(const y of [37,77,108]){box(walls,-86,y,-62.6,30,24,1.25,M.wood);box(walls,-86,y+7,-61.4,7.5,.7,1.4,M.iron)}
  batch(fixed);batch(walls);
  return {details(){
    const d=group(scene);
    for(let i=0;i<5;i++)ceramic(d,54+i*9,134.5,-94,3+(i%2),5+i%3,M.glaze,i%2?M.blue:M.celadon);
    plant(d,72,86,-85,29);
    const jar=lathe(d,-83,123.5,-80,[[0,0],[6,0],[8,2],[9,16],[7.5,21],[6,22],[6,23],[0,23]],M.celadon);tor(d,-83,146.7,-80,5.8,.45,M.honey);
    for(let i=0;i<5;i++)ceramic(d,-97,123.5+i*.85,-75,4.3,2,M.glaze,M.blue);
    // Three natural sugar pieces and a small scoop sit behind the pouring place.
    const dish=ceramic(d,-19,76,-5.8,4.75,1.65,M.celadon,M.celadon);
    const sugar=Art.textured('crumb',0x664227,.9,.11);
    for(let i=0;i<4;i++){
      const o=mesh(dish,new T.DodecahedronGeometry(1.65,0),sugar,(i%2-0.5)*2.65,2.1+(i===3?.65:0),(Math.floor(i/2)-.5)*2);
      o.scale.set(1,.75,.83);o.rotation.set(rand()*.5,rand(),rand()*.6)
    }
    // Garden roof, stone wall and fukugi canopy at several depths.
    const stoneM=[0x9a9c89,0xb5af99,0xa8a791,0xc1bba5].map(n=>mat(n));
    for(let j=0;j<3;j++)for(let i=-10;i<=10;i++){const o=box(d,i*19+j%2*8,-9+j*8,-254+rand()*2,18.7,7.8,12,stoneM[(i+j+12)%4]);o.rotation.z=(rand()-.5)*.024}
    box(d,29,51,-400,227,110,65,mat(0xe2d6b5));
    const tile=mat(0xb86d4a),tile2=mat(0xce8c64);
    for(const side of [-1,1]){
      const slab=box(d,29,109,-400+side*21,244,5,48,tile);slab.rotation.x=side*.33;
      for(let i=-94;i<154;i+=4.3)rod(d,[i,117,-400],[i,101,-400+side*46],1.27,tile2,1.4,7);
    }
    for(let j=0;j<5;j++){
      const xx=-52+j*35;box(d,xx,64,-366.9,23,41,1.3,M.darkwood);
      box(d,xx,64,-365.9,21,38,.8,mat(0x7d9388,.45));box(d,xx,64,-365.1,.9,38,.8,M.frame);
    }
    const greens=[0x5e7e45,0x738e4d,0x889c5b,0x446f46,0x91a464,0x537d49].map(n=>mat(n));
    const leaves=tex(256,256,(ctx,w,h)=>{
      ctx.fillStyle='#c3c8a0';ctx.fillRect(0,0,w,h);
      for(let j=0;j<1200;j++){
        const x=rand()*w,y=rand()*h,r=1+rand()*6;
        ctx.fillStyle=j%4?'rgba(68,88,46,.29)':'rgba(242,235,180,.65)';
        ctx.beginPath();ctx.ellipse(x,y,r*.53,r,rand()*PI,0,TAU);ctx.fill()
      }
    });
    const crowns=greens.map(m=>{const c=m.clone();c.map=leaves;c.needsUpdate=true;return c});
    const bark=mat(0x766e51),foliage=greens.map(()=>({p:[],uv:[],idx:[]}));
    function canopy(cx,cy,cz,rx,ry,rz,index){
      for(let k=0;k<78;k++){
        const yaw=rand()*TAU,ct=rand()*2-1,st=Math.sqrt(1-ct*ct);
        const x=cx+rx*st*Math.cos(yaw),y=cy+ry*ct,z=cz+rz*st*Math.sin(yaw),len=2.45+rand()*4.25,w=len*(.17+.12*rand());
        const a=yaw+rand()*.85,dx=Math.sin(a),dz=Math.cos(a),lift=(rand()-.38)*len*.7;
        const b=foliage[(index+Math.floor(rand()*4))%6],i=b.p.length/3;
        b.p.push(x,y,z,x+dx*len*.46-dz*w,y+lift*.53,z+dz*len*.46+dx*w,x+dx*len*.46,y+lift*.53+.31,z+dz*len*.46,x+dx*len*.46+dz*w,y+lift*.53,z+dz*len*.46-dx*w,x+dx*len,y+lift,z+dz*len);
        b.uv.push(.5,0,0,.5,.5,.5,1,.5,.5,1);b.idx.push(i,i+1,i+2,i,i+2,i+3,i+1,i+4,i+2,i+2,i+4,i+3)
      }
    }
    for(let i=0;i<11;i++){
      const x=(i-5)*37+(rand()-.5)*16,z=-276-rand()*60,h=68+rand()*74;
      rod(d,[x,-15,z],[x+5,h-16,z],3.3,bark,1.3);
      for(let j=0;j<11;j++){
        const a=rand()*TAU,l=rand()*20,y=h+(rand()-.5)*35;
        const xx=x+Math.cos(a)*l,zz=z+Math.sin(a)*l;
        if(j<3)rod(d,[x+3,h*.56,z],[xx,y,zz],1.6,bark,.48);
        const o=mesh(d,new T.IcosahedronGeometry(1,1),crowns[(i+j)%6],xx,y,zz);o.scale.set(12+rand()*8,10+rand()*9,13+rand()*7);o.rotation.set(rand(),rand(),rand());canopy(xx,y,zz,o.scale.x,o.scale.y,o.scale.z,(i+j)%6);
      }
    }
    for(let i=0;i<foliage.length;i++){
      const b=foliage[i],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.setIndex(b.idx);g.computeVertexNormals();
      const m=greens[i].clone();m.side=T.DoubleSide;mesh(d,g,m)
    }
    // Leaves and papery hibiscus petals next to the open veranda.
    const flower=mat(0xcf684c,.77),pollen=mat(0xeeb960);
    for(let i=0;i<12;i++){
      const x=-89+rand()*24,z=-188+rand()*22,y=15+rand()*53;
      rod(d,[-83,-10,-196],[x,y,z],.66,bark,.23,6);
      for(let j=0;j<5;j++)leaf(d,x+(rand()-.5)*5,y-j*4,z,8+rand()*5,4.8,j*2.4+rand(),rand()*.65,greens[(i+j)%6]);
      if(i%2===0){const fl=group(d,x,y,z);fl.rotation.z=rand();for(let j=0;j<5;j++){
        const a=j*TAU/5;const petal=oval(fl,Math.sin(a)*2.3,Math.cos(a)*2.3,0,1.9,3,.55,flower);petal.rotation.z=-a;
      }rod(fl,[0,0,0],[.4,.6,3.7],.17,pollen)}
    }
    // A restrained shadow under furniture anchors the room even before the sun map updates.
    for(const [x,z,w,h] of [[-32,-146,90,69],[9,-78,45,29],[-35,7,27,28]])shade(d,x,.08,z,w,h,.19);
    batch(d);
  }};
}
return {build,ceramic,plant,leaf};
})();
