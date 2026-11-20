'use strict';
const Kitchen=(()=>{
const {T,PI,TAU,V,rand,group,mat,mesh,box,oval,cyl,tor,lathe,line,rod,batch,tex,M,shade,roundBox}=Art;
const {K,clamp}=Agara;
const set=(o,p)=>o.position.set(p.x,p.y,p.z);
function potteryMap(){
  return tex(768,384,(c,w,h)=>{
    const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#dbc7a7');bg.addColorStop(.12,'#eee7d7');bg.addColorStop(.55,'#f3ecdc');bg.addColorStop(.88,'#ddcfb7');bg.addColorStop(1,'#bd9e77');
    c.fillStyle=bg;c.fillRect(0,0,w,h);
    for(let i=0;i<7000;i++){const r=rand();c.fillStyle='rgba(87,65,41,'+r*.23+')';c.fillRect(rand()*w,rand()*h,r*1.65+.3,r*1.2+.3)}
    function band(y,sz,color){
      c.fillStyle=color;c.beginPath();for(let x=0;x<=w;x+=3){let yy=y+1.4*Math.sin(x*TAU/w*3)+Math.sin(x*TAU/w*7)*.52;if(!x)c.moveTo(x,yy);else c.lineTo(x,yy)}
      for(let x=w;x>=0;x-=3)c.lineTo(x,y+sz+Math.sin(x*TAU/w*3)*1.2);c.closePath();c.fill()
    }
    for(const [y,sz,col] of [[15,9,'#365971'],[30,2,'#687f84'],[63,4,'#345670'],[72,1.8,'#6d888c'],[293,4,'#426982'],[307,12,'#32566e'],[326,3,'#6c8287']])band(y,sz,col);
    // Cobalt underglaze fish, individually brushed around the pot.
    for(let j=0;j<=3;j++){
      c.save();c.translate(j*w/3+21,182+Math.sin(j)*6);c.rotate(-.12+j*.065);
      c.fillStyle='#385e71';c.beginPath();c.moveTo(-69,-1);c.bezierCurveTo(-43,-41,9,-45,45,-8);c.bezierCurveTo(58,-7,68,-28,78,-30);c.bezierCurveTo(75,-15,73,-6,78,4);c.lineTo(81,23);c.quadraticCurveTo(60,14,44,3);c.bezierCurveTo(13,36,-38,36,-65,9);c.lineTo(-54,6);c.closePath();c.fill();
      c.beginPath();c.moveTo(-19,-28);c.bezierCurveTo(-8,-49,14,-57,29,-54);c.lineTo(16,-33);c.fill();
      c.fillStyle='#ede5d0';c.beginPath();c.arc(-46,-7,5.8,0,TAU);c.fill();c.fillStyle='#274653';c.beginPath();c.arc(-47,-7,2.9,0,TAU);c.fill();
      c.strokeStyle='#e1d8bd';c.lineCap='round';c.lineWidth=2.2;c.beginPath();c.moveTo(-32,-24);c.quadraticCurveTo(-16,-4,-32,18);c.stroke();
      for(let u=0;u<3;u++)for(let v=0;v<2;v++){c.beginPath();const x=-16+u*14,y=-13+v*16;c.moveTo(x,y);c.quadraticCurveTo(x+12,y+6,x,y+13);c.stroke()}
      for(let i=0;i<3;i++){c.strokeStyle=i%2?'#6d8b88':'#426b77';c.lineWidth=2.4-i*.42;c.beginPath();c.moveTo(-73+i*5,39+i*6);c.bezierCurveTo(-41,29+i*6,-17,52+i*6,5,43+i*6);c.stroke()}
      c.restore()
    }
  })
}
function pitcher(g){
  const out=group(g),dec=group(out),m=mat(0xffffff,.25,{map:potteryMap(),side:T.DoubleSide});
  const prof=[[0,.1],[3.65,.1],[3.88,.33],[3.9,.64],[4.8,1.02],[5.65,2.54],[5.98,4.6],[5.84,6.55],[5.45,8.25],[5.3,9.3],[5.48,10.25],[5.43,10.55],[5.14,10.54],[5.02,10.22],[4.94,9.32],[5.08,8.2],[5.43,6.5],[5.55,4.6],[5.15,2.88],[4.3,1.52],[0,1.28]];
  const geo=new T.LatheGeometry(prof.map(p=>new T.Vector2(...p)),96),attr=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<attr.count;i++){
    const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i),th=Math.atan2(z,x),sp=Math.exp(-th*th/.105)*clamp((y-7.5)/3.0)**1.45;
    attr.setXYZ(i,x+sp*2.12,y+sp*.66+.053*Math.sin(th*5)*clamp((y-9)/2),z*(1-.05*sp));
    uv.setY(i,.01+.97*y/10.55);
  }
  geo.computeVertexNormals();mesh(dec,geo,m);
  line(dec,[[-4.86,8.74,0],[-6.57,9.58,0],[-9.12,9.20,0],[-10.22,7.29,0],[-9.39,4.74,0],[-6.8,3.33,0],[-5.32,3.80,0]],.89,M.glaze,40,12);
  for(const y of [.31,.57])tor(dec,0,y,0,3.83,.10,M.darkwood);
  batch(dec);
  const fluid=mesh(out,new T.CircleGeometry(1,72),mat(0x69401f,.18,{side:T.DoubleSide}));
  const fp=fluid.geometry.attributes.position;
  function level(s){
    const ang=s.jug.angle,mid=4.4+3.35*s.jug.remaining/3.05;
    fp.setXYZ(0,0,mid,0);
    for(let j=1;j<fp.count;j++){
      const th=(j-1)*TAU/72,cs=Math.cos(th),sn=Math.sin(th);
      let r=5.08,y;
      for(let q=0;q<3;q++){y=clamp(mid+Math.tan(ang)*r*cs,1.42,10.48+.55*Math.exp(-th*th/.11));r=y<4.7?4.28+(y-1.4)*.36:y<8?5.48-(y-4.7)*.13:5.03+.02*(y-8)}
      const mouth=Math.exp(-(Math.min(th,TAU-th)**2)/.105);
      const overflow=mouth*clamp(s.flow*3);
      r+=overflow*(7.54-r);y+=(11.15-y)*overflow;
      fp.setXYZ(j,r*cs,y,r*sn)
    }
    fp.needsUpdate=true;fluid.geometry.computeVertexNormals()
  }
  return {out,level}
}
function weave(g,r){
  const palette=[0xe6bf79,0xd9ae6e,0xe7c78c,0xcba368,0xe9ca90].map(c=>Art.textured('bamboo',c,.57,.022,{side:T.DoubleSide}));
  const step=.83,off=.36,N=Math.floor((r-.24)/step);
  const y=(x,z)=>.89+3.51*(1-Math.pow(Math.min(1,(x*x+z*z)/(r*r)),.86));
  for(let dir=0;dir<2;dir++)for(let i=-N;i<=N;i++){
    const coord=i*step,len=Math.sqrt(Math.max(0,(r-.12)**2-(Math.abs(coord)+off)**2)),p=[],uv=[],ind=[],n=Math.max(4,Math.ceil(len*3.3));
    for(let j=0;j<=n;j++){
      const t=(j/n*2-1)*len,lift=(dir?-1:1)*.094*Math.cos(PI*(t/step+i));
      for(const sign of [-1,1]){
        const x=dir?t:coord+sign*off,z=dir?coord+sign*off:t;
        p.push(x,y(x,z)+lift,z);uv.push(j/n,sign===1?1:0)
      }
      const k=j*2;if(j)ind.push(k-2,k,k-1,k-1,k,k+1)
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();mesh(g,geo,palette[(i+N+dir*2)%5])
  }
}
function cooker(scene){
  const x=K.rack.x,z=K.rack.z,stove=group(scene,x,K.top,z),still=group(stove);
  const enamel=Art.textured('glaze',0x79968c,.34,.016),brass=mat(0xb69867,.38,{metalness:.33}),dark=mat(0x293832,.42);
  for(const i of [-1,1])for(const j of [-1,1])cyl(still,i*12,.6,j*10,1.0,1.3,1.2,M.iron);
  roundBox(still,0,1.05,0,30.3,4.6,25.8,2.3,enamel);
  roundBox(still,0,5.69,0,29.65,.38,25.1,2.1,mat(0xa9b8aa,.32,{metalness:.19}));
  cyl(still,0,6.0,0,10.85,11.4,.63,M.iron);tor(still,0,6.75,0,5.12,.57,brass);
  for(let i=0;i<4;i++){
    const th=i*PI/2+.785,o=group(still);o.rotation.y=th;box(o,0,7.11,7.6,1.06,2.36,5.14,M.iron)
  }
  for(let i=0;i<6;i++){const slit=oval(still,-10.7+i*1.54,3.26,12.91,.30,1.09,.15,dark)}
  const knob=group(scene,x+6,79.1,z+13.85),kn=group(knob);
  const rim=cyl(kn,0,0,-.36,2.29,2.35,.84,brass);rim.rotation.x=PI/2;
  const dial=cyl(kn,0,0,.58,1.94,2.09,1.5,dark);dial.rotation.x=PI/2;
  const grip=box(kn,0,.1,1.46,.92,2.84,.66,M.iron);oval(kn,0,1.10,1.82,.17,.26,.11,M.glaze);
  batch(kn);
  const pot=group(still,0,8.29,0);
  lathe(pot,0,0,0,[[0,0],[7.8,0],[8.8,.30],[9.72,1.3],[10.4,3.6],[11.05,8.72],[11.02,9.47],[11.55,9.63],[11.69,9.96],[11.21,10.08],[10.67,9.61],[10.55,8.5],[9.9,3.7],[9.1,1.65],[0,1.1]],M.steel);
  for(const side of [-1,1]){
    line(pot,[[side*10.28,6.49,-2.9],[side*12.41,7.10,-3.3],[side*14.36,7.54,-2.40],[side*14.53,7.49,2.11],[side*12.61,7.14,3.42],[side*10.4,6.47,2.8]],.70,M.iron,22,8)
  }
  const waterMat=mat(0x94a99c,.14,{metalness:.19});cyl(pot,0,7.52,0,10.56,10.5,.22,waterMat);
  batch(still);
  const basket=group(scene),basketWall=group(basket);
  // The rack datum is the top of the split bamboo grate.
  for(let i=-10;i<=10;i++){
    const pos=i*1.03,len=2*Math.sqrt(11.53**2-pos*pos);box(basketWall,pos,-.24,0,.70,.48,len,i%3?M.bamboo:M.cane)
  }
  for(const zi of [-5.2,5.2])box(basketWall,0,-.63,zi,21.3,.38,.95,M.sand);
  lathe(basketWall,0,0,0,[[11.60,-1.02],[12.24,-1.02],[12.58,-.72],[12.66,8.73],[12.55,9.17],[12.0,9.17],[11.95,8.80],[11.68,-.86],[11.60,-1.02]],M.bamboo,80);
  for(const y of [-.72,-.12,1.26,7.43,8.76])tor(basketWall,0,y,0,12.59,y===1.26||y===7.43?.24:.16,M.sand);
  for(let i=0;i<62;i++){
    const a=i*TAU/62;for(const y of [.71,7.9]){
      const m=i%2?M.cane:M.binding;
      rod(basketWall,[12.67*Math.sin(a),y-.34,12.67*Math.cos(a)],[12.67*Math.sin(a+.028),y+.34,12.67*Math.cos(a+.028)],.082,m,.082,5)
    }
  }
  for(let i=0;i<4;i++){
    const a=i*PI/2+.65;for(const h of [3.2,4.35,5.5])line(basketWall,[[12.68*Math.sin(a-.035),h-.1,12.68*Math.cos(a-.035)],[12.73*Math.sin(a),h+.09,12.73*Math.cos(a)],[12.67*Math.sin(a+.036),h+.29,12.67*Math.cos(a+.036)]],.086,M.binding,4,4)
  }batch(basketWall);
  const lid=group(scene),lidBody=group(lid);
  const backing=[[0,3.42],[4,3.06],[8,2.17],[11.74,.36],[12.54,.04],[12.84,.04],[12.91,.19],[12.91,1.35],[12.62,1.38]];
  for(let i=16;i>=0;i--){const r=12.62*i/16;backing.push([r,.61+3.51*(1-(r/12.62)**1.72)])}
  lathe(lidBody,0,0,0,backing,M.sand,80);
  weave(lidBody,12.62);
  for(const y of [.17,.56,1.05,1.43])tor(lidBody,0,y,0,12.82,.148,y===.56?M.binding:M.bamboo);
  line(lidBody,[[-3.45,4.17,0],[-2.65,5.64,.2],[-1.52,6.42,.44],[0,6.63,.48],[1.85,6.11,.25],[3.36,4.12,0]],.52,M.binding,23,9);
  for(let i=0;i<13;i++){const xx=-1.7+i*.27,yy=6.59-xx*xx*.155;rod(lidBody,[xx-.07,yy+.40,.23],[xx+.09,yy+.36,.74],.071,M.cane,.064,5)}
  batch(lidBody);
  const stand=group(scene,K.lid.x,K.top,K.lid.z);roundBox(stand,0,.1,0,20,.95,5.3,.7,M.honey);
  for(const sx of [-1,1])rod(stand,[sx*6,.7,-.95],[sx*6,11,-2.9],.59,M.honey);
  for(const sx of [-1,1])roundBox(stand,sx*4.8,.8,4.6,2.7,1.6,2.5,.5,M.honey);
  batch(stand);
  const flames=group(scene,x,K.top+6.8,z),flameMat=mat(0x689cba,.5,{transparent:true,opacity:.80,emissive:0x5788aa,emissiveIntensity:.43});
  for(let i=0;i<20;i++){const a=i*TAU/20;const f=oval(flames,Math.cos(a)*5.45,.27,Math.sin(a)*5.45,.27,.85,.27,flameMat);f.rotation.z=.12*Math.sin(a)}
  batch(flames);
  const bubbles=group(scene,x,K.top+15.96,z);
  const waterDrop=mat(0xb9cdbe,.12,{transparent:true,opacity:.76});
  for(let i=0;i<18;i++){const a=rand()*TAU,r=Math.sqrt(rand())*9.7;oval(bubbles,Math.cos(a)*r,0,Math.sin(a)*r,.3,.16,.3,waterDrop)}
  const drops=Array.from({length:9},(_,i)=>oval(scene,0,0,0,.12,.21,.12,waterDrop));
  const shadow=shade(scene,x,K.top+.025,z,38,31,.26);
  return {basket,lid,knob,stove,flames,bubbles,drops,update(s){
    const tm=s.time;set(basket,s.basket.pos);set(lid,s.lid.pos);lid.rotation.x=s.lid.angle;
    knob.rotation.z=.9-s.flame*3.56;flames.scale.y=.025+s.flame*(1.03+.12*Math.sin(tm*16));
    for(let i=0;i<bubbles.children.length;i++){const q=(tm*(.2+s.boil*1.9)+i*.618)%1,k=.065+.70*s.boil*Math.sin(q*PI);bubbles.children[i].scale.set(k,k*.54,k)}
    for(let i=0;i<drops.length;i++){
      const q=(tm*.81+i*.137)%1,ang=i*2.4,r=4+i%5;
      const start=V(Math.cos(ang)*r,1.65,Math.sin(ang)*r).applyEuler(lid.rotation).add(lid.position);
      let landing=K.top+.3;
      if(Math.hypot(start.x-K.rack.x,start.z-K.rack.z)<K.rackRadius){
        landing=K.rack.y;
        for(const c of s.cups){
          const r=Math.hypot(start.x-c.pos.x,start.z-c.pos.z)/3.15;
          if(c.where==='rack'&&r<1)landing=Math.max(landing,c.pos.y+Agara.surfaceHeight(c,r))
        }
      }
      const d=Math.max(0,start.y-landing);
      drops[i].position.copy(start);drops[i].position.y-=d*q*q;
      const size=s.coveredOnce?clamp(s.lid.aperture*1.4)*(.045+.07*Math.sin(q*PI))*s.lid.moisture:0;drops[i].scale.set(size,size*1.8,size)
    }
  }}
}
function teaCup(scene,i){
  const g=House.ceramic(scene,0,0,0,3.53,6.1,i?M.celadon:M.glaze,i?M.sand:M.blue);
  const tea=mat(0x936329,.15,{metalness:.14});
  cyl(g,0,5.27,0,3.13,3.1,.04,tea);
  for(let j=0;j<9;j++){
    const a=j*TAU/9;for(let k=0;k<2;k++){
      const ap=a+k*.10;
      const petal=oval(g,Math.sin(ap)*3.35,3.36+k*.51,Math.cos(ap)*3.35,.23,.55,.09,i?M.glaze:M.blueLight);petal.rotation.y=ap;petal.rotation.z=.38-k*.70
    }
  }
  return batch(g);
}
function woodenPlate(scene){
  const root=group(scene);
  lathe(root,0,0,0,[[0,.05],[7.7,.05],[8.8,.16],[10.5,.63],[11.6,1.03],[11.73,1.24],[11.56,1.38],[10.48,1.08],[8.55,.70],[0,.67]],M.wood,80);
  for(const r of [10.8,11.12])tor(root,0,1.10+(r-10.8)*.3,0,r,.038,M.sand);return batch(root)
}
function trayWood(scene){
  const g=group(scene);roundBox(g,0,.14,0,54,.9,29.7,2.65,M.honey);
  // Steam-bent wooden lip with shallow hand holds at its narrow ends.
  for(const z of [-1,1])roundBox(g,0,1.02,z*14.59,50.1,1.07,.66,.29,M.honey);
  for(const x of [-1,1]){
    for(const z of [-1,1])roundBox(g,x*26.10,1.02,z*9.6,.84,1.9,8.7,.38,M.honey);
    line(g,[[x*26,2.50,-7.35],[x*26,3.48,-4.1],[x*26,3.55,4.1],[x*26,2.50,7.35]],.48,M.wood,15)
  }return batch(g)
}
function paperGeometry(c){
  const n=144,rows=[[.05,2.54,.03],[.15,2.62,.055],[.62,2.73,.10],[1.70,3,.16],[2.87,3.24,.23],[3.72,3.45,.267]];
  const p=[],uv=[],ind=[];
  for(let j=0;j<rows.length;j++)for(let i=0;i<=n;i++){
    const a=i*TAU/n,[h,r,pleat]=rows[j],f=Math.cos(a*36+.12*Math.sin(a*3+c.seed));
    const rr=r+pleat*f; p.push(Math.cos(a)*rr,h+.055*(j/5)*f+.045*(j/5)*Math.sin(a*3+c.seed),Math.sin(a)*rr);uv.push(i/n,h/4);
    if(j&&i){const k=j*(n+1)+i;ind.push(k-n-2,k-1,k,k-n-2,k,k-n-1)}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();return geo
}
function makeCup(scene,c,mats){
  const root=group(scene),paper=mesh(root,paperGeometry(c),M.paper);
  cyl(root,0,.041,0,2.57,2.50,.08,M.paper);
  const g=Dough.build();Dough.deform(g,c,0);
  const geo=new T.BufferGeometry();geo.setIndex(new T.BufferAttribute(g.tri,1));
  for(const [n,b,size] of [['position',g.p,3],['color',g.col,3],['uv',g.uv,2]])geo.setAttribute(n,new T.BufferAttribute(b,size).setUsage(T.DynamicDrawUsage));
  for(const gr of g.groups)geo.addGroup(gr.start,gr.count,gr.materialIndex);
  geo.computeVertexNormals();geo.boundingSphere=new T.Sphere(V(0,4,0),8.5);
  const skin=mats.skin.clone(),dough=mesh(root,geo,[skin,mats.crumb]);dough.userData.dough=c.id;
  const base=paper.geometry.attributes.position.array.slice(),pp=paper.geometry.attributes.position;
  let key='',w=-1;const shadow=shade(scene,0,0,0,8.1,7.9,.21);
  function update(s){
    set(root,c.pos);
    // Contact shadows remain on the actual support during a lift.
    const y=c.where==='rack'?K.rack.y:c.where==='table'?K.tea.y:c.where==='plate'?s.plate.pos.y+.67:K.top+.08;
    shadow.position.set(c.pos.x,y+.025,c.pos.z);shadow.material.opacity=clamp(.22-(c.pos.y-y)*.035,0,.22);
    if(!skin.map&&mats.skin.map){skin.map=mats.skin.map;skin.bumpMap=mats.skin.map;skin.bumpScale=.026;skin.needsUpdate=true}
    const sig=[c.amount,c.spread,c.rise,c.cooked,c.crack,c.paperRevision,c.force,c.open[0],c.open[1],c.open[2],c.holes.length,c.impact.pulse>0?s.time:0].map(n=>n.toFixed(4)).join('/');
    if(sig!==key){
      key=sig;Dough.deform(g,c,s.time);for(const n of ['position','uv','color'])geo.attributes[n].needsUpdate=true;
      geo.computeVertexNormals();skin.roughness=.19+c.cooked*.57;
    }
    if(c.paperRevision!==w){
      w=c.paperRevision;for(let i=0;i<pp.count;i++){
        const j=i*3,a=Math.atan2(base[j+2],base[j]),weight=clamp(c.creases.reduce((n,f)=>n+Math.pow(Math.max(0,Math.cos(a-f.angle)),20)*f.depth,0));
        pp.setXYZ(i,base[j]*(1-.066*weight),base[j+1]-.23*weight*(base[j+1]/3.72),base[j+2]*(1-.066*weight))
      }
      pp.needsUpdate=true;paper.geometry.computeVertexNormals()
    }
  }
  return {root,dough,update}
}
function steam(scene){
  const map=tex(64,64,(c)=>{const a=c.createRadialGradient(32,32,0,32,32,32);a.addColorStop(0,'rgba(255,250,234,.76)');a.addColorStop(.35,'rgba(255,253,241,.46)');a.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=a;c.fillRect(0,0,64,64)},false);
  const puffs=[];
  for(let i=0;i<36;i++){
    const m=new T.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:.1,color:0xfff9e7});
    const sprite=new T.Sprite(m);scene.add(sprite);puffs.push(sprite)
  }
  return s=>{
    for(let i=0;i<puffs.length;i++){
      const p=puffs[i],cycle=(s.time*(.19+.12*s.boil)+i*.61803)%1,a=i*2.39996,r=11.5-(s.lid.aperture*5.8);
      const y=s.basket.where==='stove'?K.rim:K.rack.y;
      p.position.set(K.rack.x+Math.cos(a)*r+Math.sin(cycle*4.6+a)*cycle*3.2+cycle*2,y+cycle*(12+7*s.boil),K.rack.z+Math.sin(a)*r+cycle*1.6);
      const size=1.6+cycle*5.4;p.scale.set(size,size*(1.3+cycle*.33),1);
      p.material.opacity=Math.sin(cycle*PI)*(.036+.096*s.boil)*(s.lid.aperture>.9?.84:1)
    }
  }
}
function build(scene){
  const cookerParts=cooker(scene),jug=pitcher(scene),tea=[teaCup(scene,0),teaCup(scene,1)],tray=trayWood(scene);
  let plate=woodenPlate(scene),lastPlate;
  const stick=group(scene),shaft=group(stick);
  rod(shaft,[0,0,0],[0,1.3,0],.018,M.cane,.115,10);rod(shaft,[0,1.3,0],[0,18.8,0],.115,M.bamboo,.16,10);batch(shaft);
  const crumbs=group(stick);for(let i=0;i<6;i++)oval(crumbs,Math.sin(i*2)*.10,.26+i*.16,Math.cos(i*2)*.10,.12,.19,.11,mat(i%2?0x81552e:0xaf8255,.61));
  const dock=House.ceramic(scene,K.skewer.x,K.top,K.skewer.z,2.65,7.35,M.celadon,M.glaze);
  for(let j=0;j<3;j++)rod(dock,[-.7+.5*j,1.32,-.1],[ -2.43+j*.96,15.5+j*1.5,-1.89+j*.64],.093,M.bamboo,.132,9);
  batch(dock);
  const material={skin:Art.textured('cake',0xffffff,.26,.025,{vertexColors:true,side:T.DoubleSide}),crumb:Art.textured('crumb',0xffffff,.78,.068,{vertexColors:true,side:T.DoubleSide})};
  const cups=new Map(),puff=steam(scene),streamGeo=new T.CylinderGeometry(1,1,1,15,12, true),stream=mesh(scene,streamGeo,mat(0x785032,.21));
  const sp=streamGeo.attributes.position,streamBase=sp.array.slice();
  const hints={};
  const jugShadow=shade(scene,K.jug.x,K.top+.09,K.jug.z,17,13,.25);
  const trayShadow=shade(scene,K.tray.x,K.top+.08,K.tray.z,59,34,.20);
  function update(s){
    if(lastPlate&&lastPlate!==s.plate&&lastPlate.detached){plate=woodenPlate(scene)}
    lastPlate=s.plate;
    set(plate,s.plate.pos);set(tray,s.tray.pos);set(stick,s.stick.pos);
    stick.rotation.z=s.stick.angle;const residue=s.stick.crumb;crumbs.scale.set(residue?1+residue*.55:0,residue?.62+residue*.84:0,residue?1+residue*.55:0);
    for(let i=0;i<2;i++)set(tea[i],s.teas[i].pos);
    for(const c of s.cups.concat(s.past)){
      if(!cups.has(c.id))cups.set(c.id,makeCup(scene,c,material));cups.get(c.id).update(s)
    }
    cookerParts.update(s);puff(s);jug.level(s);
    const j=jug.out,demonstrate=s.idle>4&&s.mode==='kitchen'&&!s.jug.path.length&&Agara.suggestion(s).kind==='jug';
    const smallTilt=demonstrate?.073*(.5-.5*Math.cos((s.idle-4)*2.15)):0;
    const ang=s.jug.angle;j.rotation.z=-ang-smallTilt;
    // Rotate around the spout while pouring. The stream and the impact share the same endpoint.
    set(j,s.jug.pos);const lip=V(7.55,11.15,0),rot=lip.clone().applyEuler(j.rotation);j.position.x+=lip.x-rot.x;j.position.y+=lip.y-rot.y-2.5*Math.sin(ang);
    const start=rot.add(j.position),c=Agara.current(s,s.pouringId);
    const finish=c?V(c.pos.x+c.impact.x,c.pos.y+Agara.level(c)-.025,c.pos.z+c.impact.z):start;
    const strength=s.flow;
    for(let i=0;i<sp.count;i++){
      const k=i*3,t=.5-streamBase[k+1],r=(.12+strength*.45)*(1-.29*t)*Math.min(1,strength*10);
      sp.setXYZ(i,start.x+(finish.x-start.x)*t+Math.sin(PI*t)*.29+r*streamBase[k],start.y+(finish.y-start.y)*t,start.z+(finish.z-start.z)*t+r*streamBase[k+2])
    }
    sp.needsUpdate=true;stream.frustumCulled=false;
    jugShadow.position.x=j.position.x;jugShadow.position.z=j.position.z;jugShadow.material.opacity=clamp(.25-(j.position.y-K.top)*.016,.035,.25);
    trayShadow.position.set(s.tray.pos.x,s.tray.pos.y-.01,s.tray.pos.z);
    hints.jug=j;hints.lid=cookerParts.lid;hints.knob=cookerParts.knob;hints.tray=tray;hints.plate=plate;hints.stick=stick;hints.basket=cookerParts.basket;
  }
  function targets(s){
    const out=[];
    function add(o,kind,id,center,r,extra){out.push({o,kind,id,center,r,...extra})}
    for(const c of s.cups.concat(s.past)){
      if(c.where==='table'&&s.mode!=='tea')continue;
      const vis=c.where!=='rack'||s.lid.aperture>.45;
      if(vis){const v=cups.get(c.id);add(v.root,'cup',c.id,V(c.pos.x,c.pos.y+Math.max(1.8,Agara.surfaceHeight(c,.2)),c.pos.z),3.7,{dough:v.dough})}
    }
    if(s.mode==='tea')for(let i=0;i<2;i++)add(tea[i],'tea',i,tea[i].position.clone().add(V(0,3,0)),4);
    if(s.mode==='tea')add(plate,'plate',0,plate.position.clone(),11.6);
    if(s.mode==='kitchen'){
      add(jug.out,'jug',0,jug.out.position.clone().add(V(-5.7,6.7,0)),7.5);
      add(cookerParts.knob,'knob',0,cookerParts.knob.position.clone(),3.2);
      add(cookerParts.lid,'lid',0,cookerParts.lid.position.clone().add(V(0,3,0)),11.6);
      add(stick,'stick',0,V(0,14,0).applyEuler(stick.rotation).add(stick.position),3.2)
      if(Agara.readyBasket(s)||s.basket.where==='return')add(cookerParts.basket,'basket',0,cookerParts.basket.position.clone().add(V(0,4,0)),12.3);
    }
    if(s.basket.where==='tray')add(tray,'tray',0,tray.position.clone(),25);
    return out
  }
  return {update,targets,cups,hints,cookerParts,tea}
}
return {build}
})();
