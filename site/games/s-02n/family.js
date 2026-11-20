'use strict';
const Family=(()=>{
const {T,PI,TAU,V,group,mat,mesh,oval,box,lathe,line,rod,batch,textured,M}=Art;
const skin=textured('skin',0xdca27c,.67,.009),rose=mat(0xc98568,.7),lip=mat(0xa86856,.64),lipShade=mat(0x825444),ivory=mat(0xefe6d5,.4),iris=mat(0x4c3528,.34),pupil=mat(0x302b26,.34);
const girlHair=mat(0x312c26,.55),girlLock=mat(0x453a31,.51),silver=mat(0x79776d,.72),silverLight=mat(0xa2a094,.7);
const blouse=textured('woven',0x456373,.96,.025),linen=textured('woven',0xd6c6a5,.96,.04),ivoryCloth=textured('woven',0xf3e1bc,.94,.035);
const saffron=textured('woven',0xc58b49,.93,.032),apronStitch=mat(0xc6a47a),trousers=textured('woven',0x484e4a,.94,.04);
const shoes=mat(0x78644d),horn=mat(0x786142,.41,{metalness:.26}),tie=mat(0xb46943,.81);
function shell(g,rows,m,n=36){
  const p=[],uv=[],ind=[];
  rows.forEach(([y,rx,rz,cz=0],j)=>{for(let i=0;i<=n;i++){
    const a=i*TAU/n;p.push(Math.sin(a)*rx,y,cz+Math.cos(a)*rz);uv.push(i/n,j/(rows.length-1));
    if(i&&j){const k=j*(n+1)+i;ind.push(k-n-2,k-n-1,k,k-n-2,k,k-1)}
  }});
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();
  m.side=T.DoubleSide;return mesh(g,geo,m);
}
function hairCap(head,adult){
  const p=[],uv=[],ind=[],n=72,h=18;
  for(let j=0;j<=h;j++)for(let i=0;i<=n;i++){
    const a=i*TAU/n,f=Math.cos(a),front=Math.max(f,0);
    const end=adult?1.94-.82*front+.055*Math.sin(a*4):2.43-1.09*front**2.4+.09*Math.sin(a*5.5)*front;
    const t=.002+(j/h)*(end-.002),s=Math.sin(t);
    const wave=.038*Math.cos(44*a+3*t);
    p.push((8.00+wave)*s*Math.sin(a),11.85+9.52*Math.cos(t),-.65+(7.56+wave)*s*Math.cos(a));
    uv.push(i/n,j/h);
    if(i&&j){const k=j*(n+1)+i;ind.push(k-n-2,k-n-1,k,k-n-2,k,k-1)}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();
  const m=adult?silver:girlHair;m.side=T.DoubleSide;mesh(head,geo,m);
  for(let i=0;i<38;i++){
    const ang=i*TAU/38,front=Math.max(0,Math.cos(ang)),end=adult?1.86-.82*front:2.39-1.10*front**2.4,pts=[];
    for(let j=0;j<10;j++){
      const t=.17+(end-.17)*j/9,a=ang+.36*Math.sin(t*1.4)*(adult?1:-1);
      pts.push([8.02*Math.sin(t)*Math.sin(a),11.86+9.53*Math.cos(t),-.65+7.57*Math.sin(t)*Math.cos(a)])
    }line(head,pts,adult?.036:.028,adult?silverLight:girlLock,11,4)
  }
}
function face(head,adult){
  shell(head,[[.15,.5,1,1.2],[.65,2.25,2.7,1.4],[1.7,3.75,4,1.05],[3.4,5.35,4.95,.45],[5.8,6.45,5.67,.14],[8.1,7,6.13,-.05],[10.8,7.16,6.38,-.25],[13.5,7.24,6.36,-.55],[16.1,6.9,5.98,-.75],[18.4,5.6,4.8,-.85],[20,3,2.65,-.85],[20.5,.25,.2,-.8]],skin,48);
  for(const side of [-1,1]){
    oval(head,side*6.91,8.32,-.23,1.23,2.14,1.02,skin);oval(head,side*7.77,8.35,.08,.31,1.17,.52,rose);
    const eye=group(head,side*2.78,9.63,5.48);eye.rotation.y=side*.31;
    oval(eye,0,0,.03,1.46,adult?.44:.57,.31,ivory);oval(eye,-.03,0,.33,.47,adult?.43:.52,.10,iris);
    oval(eye,-.04,0,.417,.25,.33,.045,pupil);oval(eye,-.16,.17,.46,.106,.106,.035,ivory);
    line(eye,[[-1.46,-.02,.08],[-.76,.42,.30],[.15,.51,.35],[.94,.31,.26],[1.43,.03,.09]],.11,adult?silver:girlHair,12);
    line(eye,[[-1.21,1.56,.14],[-.35,1.81,.30],[.46,1.78,.28],[1.41,1.43,.07]],adult?.16:.185,adult?silver:girlLock,12);
    if(adult){
      const gl=new T.TorusGeometry(1,.05,6,40),rim=mesh(eye,gl,horn,0,-.18,.94);rim.scale.set(2.03,1.38,1);
      line(head,[[side*4.82,9.45,5.65],[side*6.56,9.6,3.28],[side*7.28,9.13,-.32]],.086,horn,9);
      line(eye,[[-.95,-1.01,.15],[0,-1.17,.18],[.73,-.96,.11]],.043,rose,9);
    }
  }
  if(adult)line(head,[[-.87,9.53,6.7],[0,9.83,7.04],[.87,9.53,6.7]],.09,horn,8);
  const nose=oval(head,0,8.55,6.05,.84,1.77,.85,skin);nose.rotation.x=-.19;
  oval(head,0,7.48,6.86,1.0,.71,.79,skin);
  for(const side of [-1,1]){oval(head,.75*side,7.32,6.35,.55,.48,.57,skin);oval(head,.60*side,7.05,6.78,.23,.092,.11,lipShade)}
  const mouth=group(head);oval(mouth,0,4.80,5.62,1.62,.32,.31,lip);
  line(mouth,[[-1.78,5.03,5.38],[-1.12,4.87,5.75],[0,4.83,5.96],[1.12,4.89,5.75],[1.78,5.06,5.37]],.084,lipShade,14);
  hairCap(head,adult);
  if(adult){
    oval(head,0,13.9,-7.2,4.65,4.25,3.85,silver);
    for(let i=0;i<9;i++){const a=i*PI/9;line(head,[[Math.cos(a)*3.9,13.9+Math.sin(a)*3.8,-8],[Math.cos(a+.7)*4,13.7+Math.sin(a+.7)*3.8,-9.2],[Math.cos(a+1.5)*2.5,13.7+Math.sin(a+1.5)*2.6,-10.6]],.051,silverLight,9)}
  }else{
    oval(head,0,8,-6.7,2.76,2.7,1.9,tie);
    const tail=oval(head,0,5.85,-8.4,3.02,4.69,2.48,girlHair);tail.rotation.x=.37;
    const clip=group(head,-5.75,13.67,3.62);clip.rotation.z=-.36;oval(clip,0,0,0,1.72,.36,.26,tie);
  }
  return mouth;
}
function segment(parent,r0,r1,m){
  const g=group(parent);lathe(g,0,0,0,[[.01,0],[r0*.70,.012],[r0,.065],[r0*.98,.27],[r1*1.09,.64],[r1,.91],[r1*.80,.99],[.01,1]],m,20);return g
}
function bone(g,a,b){const d=b.clone().sub(a);g.position.copy(a);g.scale.y=d.length();g.quaternion.setFromUnitVectors(V(0,1,0),d.normalize())}
function arm(body,adult,side){
  const k=adult?1:.76,upper=segment(body,5.25*k,4.35*k,adult?blouse:ivoryCloth),lower=segment(body,3.25*k,2.13*k,skin);
  const cuff=segment(body,4.33*k,3.60*k,adult?blouse:ivoryCloth);
  const hand=group(body),palm=group(hand);palm.scale.setScalar(k);
  oval(palm,0,-1.93,0,2.45,3.35,1.11,skin);
  for(let i=0;i<4;i++){
    const x=(i-1.5)*1.07,l=[3.08,3.97,4.13,3.28][i];
    const q=oval(palm,x,-4.18-l*.26,.23,.60,l*.67,.56,skin);q.rotation.x=-.16;q.rotation.z=(i-1.5)*.06
  }
  const thumb=oval(palm,-side*2.30,-1.92,.67,.78,2.34,.72,skin);thumb.rotation.z=-side*.46;
  batch(palm);
  return function pose(shoulder,target){
    const v=target.clone().sub(shoulder),length=v.length(),l1=adult?24:17.3,l2=adult?22:16.5;
    v.normalize();const d=Math.max(4,Math.min(l1+l2-.02,length)),end=shoulder.clone().addScaledVector(v,d);
    const along=(d*d+l1*l1-l2*l2)/(2*d),height=Math.sqrt(Math.max(.01,l1*l1-along*along));
    const pole=V(side*.65,-1,-.38);pole.addScaledVector(v,-v.dot(pole)).normalize();
    const elbow=shoulder.clone().addScaledVector(v,along).addScaledVector(pole,height),fore=end.clone().sub(elbow);
    bone(upper,shoulder,elbow.clone().addScaledVector(fore,.08));bone(lower,elbow,end);
    bone(cuff,elbow.clone().addScaledVector(fore,-.12),elbow.clone().addScaledVector(fore,adult?.43:.12));
    hand.position.copy(end);hand.quaternion.setFromUnitVectors(V(0,-1,0),fore.normalize());hand.rotateY(side*.38)
  }
}
function person(scene,adult){
  const root=group(scene),body=group(root),clothes=group(body),head=group(body);
  if(adult){
    shell(clothes,[[-4,15.3,10.4,-1],[3,16.4,11,0],[16,14.8,10.1,0],[29,15.6,10.8,0],[38,17.7,9,0],[42,14.6,7.7,0],[44.8,5.5,4.6,0]],blouse);
    const ap=group(clothes,0,0,1);shell(ap,[[-6,14.6,10.45,0],[0,16.45,11.1,0],[17,15.1,10.1,0]],linen);
    const bib=oval(clothes,0,26,10.25,9.6,12,.56,linen);
    for(const side of [-1,1])line(clothes,[[side*7,30,10.5],[side*8.1,38,8.2],[side*9.2,42,3.5],[side*9.1,42,-2]],1.16,linen);
    line(clothes,[[-8,42,5],[-3,38,9.5],[.5,34,10.6],[7,40,7]],.63,blouse);
    for(let i=0;i<3;i++)oval(clothes,0,33-i*4.1,11.18,.37,.39,.22,M.honey);
  }else{
    shell(clothes,[[-3,11.5,7.4],[8,10.25,7.1],[21,10.8,7.2],[27.5,12.55,6.52],[30.2,9.3,5.2],[32.15,4.25,3.75]],ivoryCloth);
    shell(clothes,[[-12,14.5,9.02],[-10.8,14.3,8.94],[3.4,11.5,7.94],[16,10.4,7.41]],saffron);
    oval(clothes,0,21,7.20,7.9,7.12,.49,saffron);
    for(const side of [-1,1]){
      line(clothes,[[side*6.2,22,7.3],[side*6.9,27.1,6],[side*7.0,30.1,1],[side*7,28.3,-4.1]],1.03,saffron);
      oval(clothes,side*6.24,25.6,7.36,.62,.62,.22,M.darkwood);
    }
    const pocket=oval(clothes,0,6.4,8.15,4.38,3.54,.30,saffron);
    line(clothes,[[-4.2,8.55,8.16],[0,8.23,8.55],[4.2,8.55,8.16]],.12,apronStitch)
  }
  const neckY=adult?45:32;oval(clothes,0,neckY,0,adult?4.3:3.5,5.6,adult?4.1:3.4,skin);
  head.position.set(0,neckY+1.8,.3);head.scale.setScalar(adult?1:.86);const mouth=face(head,adult);
  mouth.removeFromParent();batch(clothes);batch(head);batch(mouth);head.add(mouth);
  const lipData=mouth.children.filter(m=>m.isMesh).map(m=>({attr:m.geometry.attributes.position,base:m.geometry.attributes.position.array.slice()}));
  let lastSmile=-1;
  function smile(amount){
    if(Math.abs(amount-lastSmile)<.005)return;lastSmile=amount;
    for(const {attr,base} of lipData){
      for(let i=0;i<attr.count;i++){const j=i*3,x=base[j];attr.setXYZ(i,x*(1+amount*.15),base[j+1]+.64*amount*(x/1.8)**2,base[j+2]+.04*amount)}
      attr.needsUpdate=true
    }
  }
  const legs=[-1,1].map(side=>({side,upper:segment(root,adult?6.5:4.5,adult?5.5:3.65,adult?trousers:skin),
    lower:segment(root,adult?5.3:3.9,adult?3.6:2.62,adult?trousers:skin),foot:oval(root,0,0,0,adult?4.4:3.4,adult?3.1:2.4,adult?9:7,shoes)}));
  return {root,body,head,legs,smile,arms:[arm(body,adult,-1),arm(body,adult,1)]}
}
function build(scene){
  const gran=person(scene,true),girl=person(scene,false),cloth=group(scene,8,68.2,-74.8);
  const fabric=box(cloth,0,.42,0,17,.82,10,M.cotton);box(cloth,0,1,1.0,16.8,.38,7.5,M.cotton);
  const fold=box(cloth,0,1.17,-3.2,16.6,.32,5.2,M.cotton);
  let travel=0,receive=0,atStove=0;
  function update(s,dt,hintPoint){
    const tm=s.time,tea=s.mode==='tea',carry=s.mode==='carry';
    const dest=tea?1:carry?s.tray.progress:0;
    // Walk round the front edge when the cooking moves to the burner.
    const wantsStove=!carry&&!tea&&['stove','peek'].includes(s.focus);
    const walkTo=carry||tea||s.focus==='serve'?.26:wantsStove?1:0;
    atStove+=Math.max(-dt*.28,Math.min(dt*.28,walkTo-atStove));
    travel+=(dest-travel)*(1-Math.exp(-dt*3.3));const q=Agara.ease(travel);
    const G=gran.root,Y=girl.root;
    G.position.set(8+24*Math.sin(q*PI)-23*q,0,-94-101*q);
    G.rotation.y=-.23-.35*q;
    const rise=Math.sin(q*PI),granHip=50-15*q+rise*24;
    gran.body.position.y=granHip;
    gran.head.rotation.y=-.20+Math.sin(tm*.44)*.034-.25*q;
    gran.head.rotation.x=.27+.065*Math.sin(tm*1.2)-.14*q;
    const k=atStove,path=[[0,-35,5],[.145,-76,8],[.26,-76,-20],[.39,-76,-54],[.84,56,-54],[1,56,-9]];
    const j=Math.max(1,path.findIndex(v=>v[0]>=k)),lo=path[j-1],hi=path[j],u=Agara.ease((k-lo[0])/(hi[0]-lo[0]));
    Y.position.set(Agara.mix(lo[1],hi[1],u)-11*q,14*(1-Agara.ease(k*8)),Agara.mix(lo[2],hi[2],u)-126*q);
    Y.rotation.y=1.34-2.91*Agara.ease((k-.52)/.48);const gh=50+.9*Math.sin(q*20)*rise+.6*Math.sin(k*39)*Math.sin(k*PI);
    girl.body.position.y=gh;girl.head.rotation.x=.27+.04*Math.sin(tm*.8);girl.head.rotation.y=-.20+.035*Math.cos(tm*.6);
    for(const [p,hip,adult] of [[gran,granHip,true],[girl,gh,false]]){
      for(const leg of p.legs){const side=leg.side,walk=Math.sin(q*23+side*PI/2)*rise,thigh=V(side*(adult?8:6),hip,0),knee=V(side*(adult?8.8:6.5),adult?30-9*q:26,adult?21-rise*17:1.5+walk*4),ankle=V(side*(adult?9:6.7),4,adult?18-rise*11:walk*8);
        bone(leg.upper,thigh,knee);bone(leg.lower,knee,ankle);leg.foot.position.copy(ankle);leg.foot.position.z+=3.3
      }
    }
    const f=(Math.sin(tm*1.16)+1)*.5;fold.rotation.x=-f*.78;fold.position.y=1.3+f*1.8;
    receive+=((s.plate.given&&tea?1:0)-receive)*(1-Math.exp(-dt*3));
    gran.smile(.09+q*.23+receive*.68);girl.smile(.05+q*.26);
    for(let i=0;i<2;i++){
      const side=i?1:-1;
      const granTarget=V(side*(7+2*f),19+f*3,22+f*3);
      if(q>.02)granTarget.lerp(V(side*(11-2*receive),12+3*receive,17+receive*9),q);
      if(receive>.01){
        gran.body.updateWorldMatrix(true,false);
        const rim=V(s.plate.pos.x+side*8.6,s.plate.pos.y+3.0,s.plate.pos.z-7.4);
        granTarget.lerp(gran.body.worldToLocal(rim),receive)
      }
      gran.arms[i](V(side*14.8,38.6,.1),granTarget);
      let hand=V(side*8.8,17.0,10.6+Math.sin(tm*1.18+i)*.55);
      if(carry||!tea&&q>.04){
        const world=V(s.tray.pos.x-23,s.tray.pos.y+2,s.tray.pos.z+side*6);
        girl.body.updateWorldMatrix(true,false);hand.lerp(girl.body.worldToLocal(world),Agara.clamp(q*12+.4))
      }else if(i===1&&hintPoint&&s.idle>3.9){
        girl.body.updateWorldMatrix(true,false);
        const target=girl.body.worldToLocal(hintPoint.clone()),gesture=Agara.ease((s.idle-3.9)/.75)*(.48+.52*(.5+.5*Math.sin((s.idle-4)*2.15)));
        hand.lerp(target,gesture);girl.head.rotation.x+=.075*gesture
      }
      girl.arms[i](V(side*10.6,27.3,.1),hand)
    }
  }
  return {update}
}
return {build};
})();
