/* World distances are centimetres. This module owns all play state, including support heights. */
(function (scope) {
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
const mix=(a,b,t)=>a+(b-a)*t;
const point=(x,y,z)=>({x,y,z});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const K={
  top:76, rack:point(15,94,-13), rackRadius:12.4, rim:103.2,
  jug:point(-14,76,6), lid:point(-7.2,89.0,-37), skewer:point(31.4,77.32,-20.2),
  tray:point(-39,76,-20), rest:point(-37,63,-78), tea:point(-32,47,-146),
  cups:[point(-3.8,76,9.6),point(6.1,76,12.1),point(4,76,1.4)],
  ceramic:[point(-61,47,-173),point(-49,47,-119)]
};
const vcopy=p=>({...p});
function motion(pos){return {pos:vcopy(pos),path:[],speed:53}}
function travel(m,stops,speed=53){m.path=stops.map(vcopy);m.speed=speed}
function move(m,dt){
  let d=m.speed*dt;
  while(d>0&&m.path.length){
    const p=m.pos,t=m.path[0],dx=t.x-p.x,dy=t.y-p.y,dz=t.z-p.z,len=Math.hypot(dx,dy,dz);
    if(len<=d){Object.assign(p,t);m.path.shift();d-=len}
    else {p.x+=dx*d/len;p.y+=dy*d/len;p.z+=dz*d/len;break}
  }
}
function lifted(m,dest,clearance){
  const y=Math.max(m.pos.y,dest.y,clearance);
  travel(m,[point(m.pos.x,y,m.pos.z),point(dest.x,y,dest.z),dest],82);
}
function cup(id,i){
  const home=vcopy(K.cups[i]);
  return {...motion(home),home,id,seed:(id+1)*1.271,where:'work',amount:.002,spread:.11,heat:0,
    cooked:0,rise:0,tension:0,crack:0,powerSum:0,hotTime:0,force:0,open:[0,0,0],holes:[],
    impact:{x:0,z:0,pulse:0},wrinkle:0,wrinkleAngle:0,creases:[],paperRevision:0,tilt:0,seat:null};
}
function create(){
  return {time:0,idle:0,batch:0,mode:'kitchen',focus:'wide',cups:[0,1,2].map((_,i)=>cup(i,i)),past:[],oldPlates:[],
    jug:{...motion(K.jug),angle:0,remaining:3.05},selected:0,flow:0,flame:0,boil:.07,
    lid:{...motion(K.lid),angle:1.07,goalAngle:1.07,closed:false,aperture:1,moisture:0},
    basket:{...motion(K.rack),where:'stove'},tray:{...motion(K.tray),progress:0,destination:0},
    plate:{...motion(point(K.tray.x-14,77.05,K.tray.z)),given:false,detached:false},
    teas:K.ceramic.map(p=>({...motion(p),home:vcopy(p)})),
    stick:{...motion(K.skewer),angle:-.13,crumb:0,dry:0,depth:0},
    coveredOnce:false,active:null,started:false,events:[],smile:0};
}
function current(s,id){return [...s.cups,...s.past].find(c=>c.id===id)}
function nextCup(s){
  const a=s.cups.filter(c=>c.where==='work'&&c.amount<.985&&!c.path.length);
  return a.sort((a,b)=>a.amount-b.amount)[0];
}
const onTray=s=>s.basket.where==='tray'&&!s.basket.path.length;
const allPlated=s=>s.cups.every(c=>c.where==='plate'&&!c.path.length);
function readyBasket(s){return allPlated(s)&&s.basket.where==='stove'&&!s.lid.closed}
function canTake(s,c){return c.where==='rack'&&c.cooked>=.78&&s.flame<=.38&&s.lid.aperture>.7}
function suggestion(s){
  if(s.mode==='tea'){
    const c=s.cups.find(c=>c.where==='plate');
    if(c&&!s.plate.given)return {kind:'cup',id:c.id,to:'tea'};
    if(!s.teas[0].placed)return {kind:'tea',id:0};
    if(!s.plate.given)return {kind:'plate'};
    return {kind:'tray',to:'back'};
  }
  if(s.basket.where==='return')return {kind:'basket',to:'stove'};
  if(s.mode==='carry'||onTray(s))return {kind:'tray'};
  if(readyBasket(s))return {kind:'basket'};
  const w=s.cups.filter(c=>c.where==='work');
  if(w.length){
    const empty=w.find(c=>c.amount<.065);
    if(empty)return {kind:'jug',id:empty.id};
    if(s.lid.closed)return {kind:'lid',to:'open'};
    return {kind:'cup',id:w[0].id,to:'rack'}
  }
  const r=s.cups.find(c=>c.where==='rack');
  if(!r)return {kind:'basket'};
  if(!s.coveredOnce)return {kind:'lid',to:'close'};
  if(r.cooked<.8){
    if(s.flame<.15)return {kind:'knob'};
    if(s.lid.closed&&r.rise>.25)return {kind:'lid',to:'peek'};
    if(!s.lid.closed&&r.rise>.20&&!r.holes.length)return {kind:'stick',id:r.id};
    return {kind:'lid',to:s.lid.closed?'peek':'close'};
  }
  if(s.flame>.38)return {kind:'knob',to:'low'};
  if(s.lid.aperture<.7)return {kind:'lid',to:'open'};
  return {kind:'cup',id:r.id,to:'plate'};
}
function begin(s,kind,id=0,local={}){
  if(s.active)return false;
  const c=current(s,id),tea=s.mode==='tea',a={kind,id,t:0,dx:0,dy:0,moved:0,local};
  if(kind==='jug'){
    const chosen=current(s,s.selected);
    const n=chosen?.where==='work'&&chosen.amount<.985&&!chosen.path.length?chosen:nextCup(s);
    if(!n||s.mode!=='kitchen')return false;s.selected=null;
    a.id=n.id;s.pouringId=n.id;a.tilt=.64;s.focus='pour';s.started=true;
  }else if(kind==='cup'){
    if(!c||c.path.length)return false;
    if(c.where==='work'&&c.amount<.045){s.selected=id;return false}
    if(c.where==='rack'&&(s.lid.aperture<.68||s.flame>.38))return false;
    if(c.where==='table'&&!tea)return false;
    if(c.where==='work')s.focus='arrange';a.start=vcopy(c.pos);a.from=c.where;a.target=vcopy(c.pos);a.press=local.angle||0;
    c.wrinkleAngle=a.press;c.wrinkle=clamp(c.wrinkle+.12);
    const crease=c.creases.find(f=>Math.cos(f.angle-a.press)>.95);
    if(crease)crease.depth=clamp(crease.depth+.14);
    else c.creases.push({angle:a.press,depth:.18});
    c.paperRevision++;
  }else if(kind==='spread'){
    if(!c||c.cooked<.3||c.path.length||c.where==='rack'&&s.lid.aperture<.65)return false;
    a.press=local.angle||0;a.previousFocus=s.focus;s.focus='study';
  }else if(kind==='knob'){
    if(s.mode!=='kitchen'||s.basket.where!=='stove')return false;
    a.base=s.flame;s.focus='stove';
  }else if(kind==='lid'){
    if(s.mode!=='kitchen'||s.basket.where!=='stove'||s.cups.some(c=>c.path.length))return false;
    a.wasClosed=s.lid.closed;a.baseY=s.lid.pos.y;s.lid.path=[];s.focus='stove';
  }else if(kind==='stick'){
    if(s.lid.aperture<.55||!s.cups.some(c=>c.where==='rack'&&c.rise>.1))return false;
    a.id=s.cups.find(c=>c.where==='rack'&&!c.holes.length)?.id??s.cups.find(c=>c.where==='rack').id;
    a.local={x:1,z:.4};a.insert=0;s.focus='peek';
  }else if(kind==='basket'){
    if((!readyBasket(s)&&s.basket.where!=='return')||s.basket.path.length)return false;
    a.back=s.basket.where==='return';
    a.start=vcopy(s.basket.pos);s.focus='serve';
  }else if(kind==='tray'){
    if(!onTray(s)||(tea&&!s.plate.detached&&s.cups.some(c=>c.where==='plate')))return false;
    a.base=s.tray.progress;s.mode='carry';s.focus='carry';
  }else if(kind==='tea'||kind==='plate'){
    if(!tea)return false;
    const m=kind==='tea'?s.teas[id]:s.plate;if(!m||m.path.length)return false;
    a.start=vcopy(m.pos);a.target=vcopy(m.pos);
  }else return false;
  s.active=a;s.idle=0;return true;
}
function slot(s,c,center,radius,where,p){
  const others=s.cups.concat(s.past).filter(o=>o!==c&&o.where===where).map(o=>o.seat||o.pos);
  function valid(q){return dist(q,center)<=radius&&others.every(o=>dist(o,q)>6.75)}
  let best=null,bestD=Infinity;
  for(let r=0;r<=radius+.001;r+=.65)for(let i=0;i<(r?48:1);i++){
    const th=i*Math.PI/24,q=point(center.x+r*Math.cos(th),center.y,center.z+r*Math.sin(th));
    const d=dist(p,q);if(d<bestD&&valid(q)){best=q;bestD=d}
  }
  return best;
}
function plateCenter(s){return point(s.plate.pos.x,s.plate.pos.y+.67,s.plate.pos.z)}
// Search outward from the touched place for the nearest clear footprint on the tea table.
function tableDrop(s,object,r,p){
  const teaY=K.tea.y,obstacles=[];
  for(const o of s.cups.concat(s.past)){
    if(o!==object&&o.where==='table')obstacles.push({p:o.seat||o.pos,r:3.45})
  }
  for(const t of s.teas)if(t!==object)obstacles.push({p:t.pos,r:3.55});
  for(const pl of [...s.oldPlates,s.plate])if(pl!==object)obstacles.push({p:pl.pos,r:11.7});
  function candidate(x,z){
    const q=point(clamp(x,-78+r,14-r),teaY,clamp(z,-188+r,-104-r));
    const dx=Math.max(0,Math.abs(q.x-s.tray.pos.x)-26.8),dz=Math.max(0,Math.abs(q.z-s.tray.pos.z)-14.9);
    if(Math.hypot(dx,dz)<r+.12||obstacles.some(o=>dist(q,o.p)<r+o.r+.08))return null;
    return q
  }
  let q=candidate(p.x,p.z);if(q)return q;
  for(let ring=.85;ring<115;ring+=1.15){
    for(let i=0;i<80;i++){const a=i*Math.PI/40;q=candidate(p.x+ring*Math.cos(a),p.z+ring*Math.sin(a));if(q)return q}
  }
  return null
}
function drag(s,dx,dy,p,info={}){
  const a=s.active;if(!a)return;
  a.dx=dx;a.dy=dy;a.moved=Math.max(a.moved,Math.hypot(dx,dy));s.idle=0;
  const c=current(s,a.id);
  if(a.kind==='jug'){
    a.tilt=clamp(.64+dx*.012-dy*.008,0,1.05);
    if(info.cup!=null){const n=current(s,info.cup);if(n?.where==='work'&&!n.path.length&&n.amount<.995)a.id=n.id}
  }else if(a.kind==='knob'){
    s.flame=clamp(a.base+(info.turn??(dx-dy)*.012));
  }else if(a.kind==='lid'){
    if(a.wasClosed){
      a.lift=clamp(-dy/87);s.lid.goalAngle=-a.lift*.24;
      a.target=point(K.rack.x,K.rim+a.lift*17,K.rack.z-a.lift*3);
      if(a.lift>.02)s.focus='peek';
    }else {a.place=clamp((Math.abs(dx)+Math.abs(dy))/60)}
  }else if(a.kind==='cup'&&p){
    a.target=p;
    if(c.where==='rack')a.out=dist(p,a.start)>5;
  }else if(a.kind==='spread'||(a.kind==='cup'&&c.cooked>.4)){
    a.stretch=clamp(Math.abs(dx)*.019);
  }else if(a.kind==='stick'){
    if(info.cup!=null&&current(s,info.cup)?.where==='rack'&&!a.pierced){if(a.id!==info.cup)a.above=false;a.id=info.cup;a.local=info.local||{x:0,z:0}}
    a.insert=clamp(dy*.025+.24);
  }else if(a.kind==='tray'){
    const sign=a.base>.97?-1:a.base<.03?1:0;
    const delta=sign?sign*Math.max(0,sign*(-dy+.26*dx)):(-dy+.26*dx);
    s.tray.destination=clamp(a.base+delta/(info.span||260));
  }else if(a.kind==='tea'||a.kind==='plate')a.target=p||a.target;
}
function setLid(s,closed){
  const l=s.lid,above=point(K.rack.x,K.rim+11,K.rack.z);
  if(closed){
    travel(l,[point(l.pos.x,Math.max(l.pos.y,K.rim+15),l.pos.z),above,point(K.rack.x,K.rim,K.rack.z)],65);
    l.goalAngle=0;
  }else{
    travel(l,[point(l.pos.x,Math.max(l.pos.y,K.rim+12),l.pos.z),point(K.lid.x,K.rim+12,K.lid.z),K.lid],64);
    l.goalAngle=1.07;
  }
  l.closed=closed;
}
function dockCup(s,c,a,cancel){
  let d=a.start,w=a.from;
  if(!cancel){
    if(w==='work'&&s.basket.where==='stove'&&!s.lid.closed&&((a.moved<8)||dist(a.target,K.rack)<19)){
      const q=slot(s,c,K.rack,8.45,'rack',a.moved<8?point(K.rack.x+(c.id%3-1)*6.8,K.rack.y,K.rack.z+((c.id%3===1)?4:-2)):a.target);
      if(q){d=q;w='rack'}
    }else if(w==='rack'&&canTake(s,c)&&(a.moved<8||dist(a.target,s.plate.pos)<24)){
      const center=plateCenter(s),q=slot(s,c,center,8.3,'plate',a.moved<8?center:a.target);
      if(q){d=q;w='plate';s.focus='serve'}
    }else if(w==='rack'&&a.moved>=8&&dist(a.target,K.rack)<13){
      d=slot(s,c,K.rack,8.45,'rack',a.target)||a.start;
    }else if((w==='plate'||w==='table')&&s.mode==='tea'&&a.moved>5){
      const center=plateCenter(s);
      if(dist(a.target,center)<10){const q=slot(s,c,center,8.3,'plate',a.target);if(q){d=q;w='plate'}}
      else {const q=tableDrop(s,c,3.47,a.target);if(q){d=q;w='table'}}
    }
  }
  c.where=w;c.seat=vcopy(d);lifted(c,d,(w==='rack'||a.from==='rack')?K.rim+2:Math.max(d.y,a.start.y)+4);
  if(w!==a.from)s.events.push('paper');
}
function end(s,cancel=false){
  const a=s.active;if(!a)return;s.active=null;s.idle=0;
  const c=current(s,a.id);
  if(a.kind==='cup')dockCup(s,c,a,cancel);
  if(a.kind==='spread')s.focus=a.previousFocus||(s.mode==='tea'?'tea':'peek');
  if(a.kind==='knob'&&a.moved<5&&!cancel)s.flame=s.flame>.38?.16:.73;
  if(a.kind==='knob'&&s.flame<=.38&&s.lid.aperture>.65&&s.cups.some(c=>canTake(s,c)))s.focus='serve';
  if(a.kind==='lid'){
    const leaveOpen=a.wasClosed?(a.moved<7||a.lift>.53):!(a.moved<7||a.place>.25);
    setLid(s,cancel?a.wasClosed:!leaveOpen);s.events.push('bamboo');
    s.focus=leaveOpen?'peek':'stove';
  }
  if(a.kind==='jug'){s.pouringId=a.id;s.finishPour=true}
  if(a.kind==='stick'){s.focus='stove';lifted(s.stick,K.skewer,K.rim+16);s.events.push('tick')}
  if(a.kind==='basket'){
    const done=!cancel&&(a.moved<7||Math.hypot(a.dx,a.dy)>18);
    s.basket.where=a.back?(done?'stove':'return'):(done?'tray':'stove');
    const d=s.basket.where!=='stove'?point(K.tray.x+12,K.tray.y+1.1,K.tray.z):K.rack;
    lifted(s.basket,d,K.rim+3);s.events.push('bamboo')
  }
  if(a.kind==='tray'){
    const t=s.tray;t.destination=t.progress<.24?0:t.progress>.76?1:.5;
  }
  if(a.kind==='tea'||a.kind==='plate'){
    const m=a.kind==='tea'?s.teas[a.id]:s.plate,p=cancel?a.start:a.target;
    const isPlate=a.kind==='plate';
    const d=(cancel||a.moved<4?a.start:tableDrop(s,m,isPlate?11.74:3.56,p))||a.start;
    if(!isPlate)m.placed=true;
    if(isPlate&&d!==a.start){m.detached=true;m.given=d.z<-162&&d.x>-39;s.smile=m.given?1:s.smile}
    // The case bottoms stay in contact with the plate throughout the handover.
    lifted(m,d,Math.max(m.pos.y,d.y+3));s.events.push(isPlate?'wood':'china')
  }
}
function approach(m,p,rate,dt){
  const dx=p.x-m.pos.x,dy=p.y-m.pos.y,dz=p.z-m.pos.z,n=Math.hypot(dx,dy,dz);
  const k=Math.min(1,rate*dt/Math.max(n,.00001));m.pos.x+=dx*k;m.pos.y+=dy*k;m.pos.z+=dz*k;
}
function bake(c,power,dt){
  c.heat+= (power-c.heat)*(1-Math.exp(-dt*(power>c.heat?1.1:1.8)));
  if(power<=.001||c.heat<.012)return;
  const dose=dt*c.heat/(.78+.33*c.amount);
  const forming=dose*(1-c.cooked);c.hotTime+=dose;c.formingTime=(c.formingTime||0)+forming;c.powerSum+=forming*power;
  c.force=Math.max(c.force,c.powerSum/Math.max(.001,c.formingTime));
  c.cooked=clamp(c.cooked+dose*.086);
  c.rise=clamp(c.rise+dose*(.088+.056*c.force)*(1-c.rise*.90));
  c.tension=clamp(c.tension+dose*(.075+.055*c.force));
  if(c.tension>.39)c.crack=clamp(c.crack+dose*(.065+.109*c.force)*(c.tension-.37)*(1-.89*c.crack));
}
function carryPosition(t){
  const a=t<.5?K.tray:K.rest,b=t<.5?K.rest:K.tea,k=t<.5?t*2:(t-.5)*2;
  return point(mix(a.x,b.x,k),mix(a.y,b.y,ease((k-.38)/.62))+Math.sin(Math.PI*k)*8,mix(a.z,b.z,k));
}
function newBatch(s){
  const old=s.cups;
  for(const c of old){if(c.where==='plate'){c.where='table';c.seat=vcopy(c.pos)}s.past.push(c)}
  s.batch++;s.cups=[0,1,2].map(i=>cup(s.batch*3+i,i));s.coveredOnce=false;s.started=false;
  s.mode='kitchen';s.focus='wide';s.jug.remaining=3.05;
  s.basket.where='return';
  if(s.plate.detached)s.oldPlates.push(s.plate);
  s.plate={...motion(point(K.tray.x-14,77.05,K.tray.z)),given:false,detached:false};s.smile=0;
}
function step(s,dt){
  dt=clamp(dt,0,.05);s.time+=dt;s.idle=s.active?0:s.idle+dt;
  const a=s.active;if(a)a.t+=dt;
  const c=a?current(s,a.id):null;
  for(const m of [s.lid,s.basket,s.plate,...s.teas,...s.cups,...s.past])move(m,dt);
  const l=s.lid;
  if(a?.kind==='lid'){
    if(a.wasClosed&&a.target)approach(l,a.target,80,dt);
    if(!a.wasClosed&&a.place){
      const u=a.place,y=K.rim+14;
      const dest=u<.28?point(K.lid.x,mix(K.lid.y,y,u/.28),K.lid.z):
        u<.76?point(mix(K.lid.x,K.rack.x,(u-.28)/.48),y,mix(K.lid.z,K.rack.z,(u-.28)/.48)):
        point(K.rack.x,mix(y,K.rim,(u-.76)/.24),K.rack.z);
      l.goalAngle=1.07*(1-ease(u/.6));approach(l,dest,77,dt)
    }
  }
  l.angle+= (l.goalAngle-l.angle)*(1-Math.exp(-dt*5));
  l.aperture=clamp((dist(l.pos,K.rack)*.6+l.pos.y-K.rim)/9);
  if(dist(l.pos,K.rack)>14)l.aperture=1;
  if(l.closed&&l.aperture<.08)s.coveredOnce=true;
  l.moisture=clamp(l.moisture+dt*((1-l.aperture)*s.boil*.33-l.aperture*.13));
  s.boil+=(Math.max(.045,s.flame)-s.boil)*(1-Math.exp(-dt*.8));
  for(const o of s.cups){
    o.impact.pulse=Math.max(0,o.impact.pulse-dt*1.4);
    const spread=clamp(.1+Math.sqrt(o.amount)*3.1,.11,1);
    o.spread+=(spread-o.spread)*(1-Math.exp(-dt*3.7));
    bake(o,o.where==='rack'&&!o.path.length&&s.coveredOnce&&s.flame>.005?s.boil*(1-.69*l.aperture):0,dt);
  }
  if(a?.kind==='jug'){
    const j=s.jug;j.path=[];s.pouringId=c.id;s.finishPour=false;
    // Pouring lip stays within the mouth of the selected paper case.
    const goal=point(c.pos.x-7.55,K.top+9,c.pos.z);
    if(j.pos.y<goal.y-.12)approach(j,point(j.pos.x,goal.y,j.pos.z),37,dt);else approach(j,goal,36,dt);
    const aligned=dist(j.pos,goal)<.32&&j.pos.y>goal.y-.2;
    const tilt=aligned?a.tilt:0;
    j.angle+=(tilt-j.angle)*(1-Math.exp(-dt*4.8));
    s.flow=aligned&&j.remaining>0&&c.amount<1?clamp((j.angle-.22)*1.8):0;
    const delta=Math.min(1-c.amount,j.remaining,s.flow*dt*.32);
    c.amount+=delta;j.remaining-=delta;
    if(delta>0){c.impact.x=.1*Math.sin(s.time*4);c.impact.z=.15;c.impact.pulse=.5+s.flow*.5}
  }else {
    s.jug.angle*=Math.exp(-dt*8.5);
    const poured=current(s,s.pouringId);
    s.flow=s.finishPour&&poured&&poured.amount<1&&s.jug.remaining>0?clamp((s.jug.angle-.22)*1.8):0;
    if(s.flow){const delta=Math.min(1-poured.amount,s.jug.remaining,s.flow*dt*.32);poured.amount+=delta;s.jug.remaining-=delta}
    if(s.finishPour&&s.flow<.005){s.finishPour=false;if(dist(s.jug.pos,K.jug)<.05)travel(s.jug,[K.jug]);else lifted(s.jug,K.jug,Math.max(s.jug.pos.y,K.top+12))}
    move(s.jug,dt)
  }
  if(a?.kind==='cup'&&a.moved>5){
    const overhead=a.from==='work'||a.from==='rack'?K.rim+2:a.start.y+14;
    const y=Math.max(a.start.y+3,overhead);
    if(c.pos.y<y-.05)approach(c,point(c.pos.x,y,c.pos.z),56,dt);
    else {
      const q=point(clamp(a.target.x,-75,49),y,clamp(a.target.z,s.mode==='tea'?-184:-39,s.mode==='tea'?-108:22));
      const obstacle=s.cups.some(o=>o!==c&&Math.abs(o.pos.y-c.pos.y)<8&&dist(o.pos,q)<6.8);
      if(!obstacle)approach(c,q,86,dt);
    }
  }
  if(a?.kind==='spread'&&c){
    const j=Math.round(((a.press-c.seed)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)/(Math.PI*2/3))%3;
    const pull=clamp(Math.abs(a.dx)/52);
    c.open[j]=Math.min(1,c.open[j]+dt*Math.max(0,pull-c.open[j])*3);
  }
  if(a?.kind==='basket'&&a.moved>6){
    const y=K.rim+3,t=clamp(a.moved/120),goal=a.back?K.rack:point(K.tray.x+12,77.1,K.tray.z),d=point(mix(a.start.x,goal.x,t),y,mix(a.start.z,goal.z,t));
    approach(s.basket,s.basket.pos.y<y-.1?point(s.basket.pos.x,y,s.basket.pos.z):d,66,dt)
  }
  const stick=s.stick;
  if(a?.kind==='stick'){
    stick.path=[];stick.angle*=Math.exp(-dt*7);
    const x=c.pos.x+clamp(a.local.x||0,-1.75,1.75),z=c.pos.z+clamp(a.local.z||0,-1.75,1.75);
    const top=c.pos.y+surfaceHeight(c,clamp(Math.hypot(x-c.pos.x,z-c.pos.z)/3.2));
    if(!a.above){
      const high=K.rim+6;
      if(stick.pos.y<high-.05)approach(stick,point(stick.pos.x,high,stick.pos.z),86,dt);
      else {approach(stick,point(x,high,z),74,dt);if(Math.hypot(x-stick.pos.x,z-stick.pos.z)<.15)a.above=true}
    }else{
      const depth=Math.min(2.5,surfaceHeight(c,0)-.2)*(a.moved<5?clamp(a.t-.55):a.insert);
      approach(stick,point(x,top+1.2-depth,z),13,dt);
      if(stick.pos.y<top-.07&&!a.pierced){const mark={x:x-c.pos.x,z:z-c.pos.z};
        if(!c.holes.some(h=>Math.hypot(h.x-mark.x,h.z-mark.z)<.14))c.holes.push(mark);
        a.pierced=true;stick.crumb=.16+.84*(1-c.cooked);stick.dry=c.cooked;s.events.push('tick')}
    }
  }else {move(stick,dt);stick.angle+=((stick.path.length?0:-.13)-stick.angle)*(1-Math.exp(-dt*7))}
  if(a?.kind==='tea'||a?.kind==='plate'){
    const m=a.kind==='tea'?s.teas[a.id]:s.plate;
    const high=a.kind==='plate'?K.tea.y+15:K.tea.y+12;
    if(m.pos.y<high-.01)approach(m,point(m.pos.x,high,m.pos.z),53,dt);
    else approach(m,point(clamp(a.target.x,-74,9),high,clamp(a.target.z,-182,-110)),62,dt)
  }
  if(s.mode==='carry'){
    const t=s.tray;
    const delta=clamp(t.destination-t.progress,-dt*.60,dt*.60);t.progress+=delta;
    Object.assign(t.pos,carryPosition(t.progress));
    if(!a&&Math.abs(t.progress-t.destination)<.002){
      if(t.destination===1){s.mode='tea';s.focus='tea'}
      if(t.destination===0){if(s.visited)newBatch(s);else{s.mode='kitchen';s.focus='serve'}}
    }
  }
  if(s.mode==='tea')s.visited=true;
  if(onTray(s)||s.basket.where==='return'&&a?.kind!=='basket'&&!s.basket.path.length){Object.assign(s.basket.pos,point(s.tray.pos.x+12,s.tray.pos.y+1.1,s.tray.pos.z))}
  if(!s.plate.detached&&a?.kind!=='plate'&&!s.plate.path.length)Object.assign(s.plate.pos,point(s.tray.pos.x-14,s.tray.pos.y+1.05,s.tray.pos.z));
  for(const o of s.cups){
    if(o.where==='plate'&&!o.path.length&&!(a?.kind==='cup'&&c===o)){
      if(!o.offset)o.offset={x:o.pos.x-s.plate.pos.x,z:o.pos.z-s.plate.pos.z};
      Object.assign(o.pos,point(s.plate.pos.x+o.offset.x,s.plate.pos.y+.67,s.plate.pos.z+o.offset.z));o.seat=vcopy(o.pos);
    }else if(o.path.length||a?.kind==='cup'&&c===o)o.offset=null;
  }
  if(s.mode==='kitchen'&&!s.started)s.visited=false;
}
function level(c){return .085+c.amount*2.82}
function surfaceHeight(c,r){return level(c)+c.rise*(.55+c.amount*3.35)*(.94+.81*c.force)*Math.pow(Math.max(0,1-r*r),.88)}
const api={K,clamp,ease,mix,point,dist,create,step,begin,drag,end,current,suggestion,nextCup,canTake,readyBasket,surfaceHeight,level,carryPosition};
if(typeof module!=='undefined'&&module.exports)module.exports=api;scope.Agara=api;
})(globalThis);
