/* Centimetres, seconds, grams and degrees Celsius. No rendering dependencies. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, R = 6.35, DT = 1 / 120;
  const angles = [-.32, .32, 1.28, 1.95, 2.88, 3.55, 4.57, 5.28];
  const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const ease = v => { const p = clamp(v, 0, 1); return p * p * (3 - 2 * p); };
  const arc = (a, b) => (b - a + TAU) % TAU;
  function createKitchen(options = {}) {
    let s, spare = 0;
    function fresh(batch) {
      const temp = options.temperature ?? 6;
      const berries = angles.map((angle, i) => ({
        angle, slot: i === 0 ? 0 : -1, fromHand: i === 0, progress: 0,
        status: i === 0 ? 'flying' : 'basket', bounce: 0, speed: 0, lift:0, liftV:0, roll:0, rollV:0,
        moisture: .78 + .065 * Math.sin(i * 2.41)
      }));
      const zones = angles.map((a, i) => ({
        temperature: temp + .28 * Math.cos(a), water: .72 + .03 * Math.sin(i * 1.71),
        sun: .25 + .72 * (.5 - .5 * Math.sin(a)),
        firmness: .8, thickness: 1.8 + .13 * Math.sin(i * 2)
      }));
      zones.forEach(v=>{v.firmness=clamp(1.05-v.temperature*.033+(1-v.water)*.15,.35,1);});
      const motes=Array.from({length:33},(_,i)=>({x:3.9*Math.sin(i*73.32),y:.43+3.7*((i*.61803)%1),z:2*Math.cos(i*34.8)-.31,vx:.01*Math.cos(i),vy:-.014-.022*((i*.4142)%1)}));
      return {motes,phase:'berries', age:0, idle:0, batch, berries, zones, flowers:[],
        handoff:0, bag:'tray', toolX:0, toolZ:0, selected:-1, deposit:-1,
        bagMass:options.bagMass ?? 100, pressure:[0,0,0], flow:0, sound:0,
        rotation:0, omega:0, turnForce:0, turning:false, tilt:0, tiltGoal:0,
        cutAngle:0, portion:null, cut:0, clear:0, clearing:false,
        drift:0, driftV:0, air:.18, hint:0, pinch:false, heldBerry:-1,
        previousX:0, previousZ:0, motionX:0, motionZ:0, inputSpeed:0,
        nudge:0,nudgeV:0, trayReturn:0, random:2069+batch*17};
    }
    s = fresh(0);
    function noise() {
      s.random = (Math.imul(1664525,s.random)+1013904223)>>>0;
      return s.random / 4294967296 - .5;
    }
    function point(i) {
      const a=angles[i], spread=arc(a,angles[(i+1)%angles.length]);
      const mid=a+spread/2;
      // Half the clear chord between the two fruit shoulders.
      return {x:R*Math.sin(mid),z:R*Math.cos(mid),angle:mid,
        limit:R*Math.sin(spread/2)-1.18};
    }
    function nearest(x,z) {
      return angles.reduce((best,_,i)=>{
        const p=point(i),d=Math.hypot(p.x-x,p.z-z);
        return d<best.d?{i,d}:best;
      },{i:0,d:Infinity}).i;
    }
    function nextGap() {
      const ordered = angles.map((_,i)=>({i, count:s.flowers.filter(f=>f.gap===i).length,
        angle:Math.abs(wrap(point(i).angle+s.rotation))}));
      ordered.sort((a,b)=>a.count-b.count||a.angle-b.angle);
      return ordered[0].i;
    }
    function touch(){s.idle=0;s.hint=0;}
    function liftBerry(i) {
      const b=s.berries[i];
      if(s.phase!=='berries'||!b||b.status!=='basket'||s.heldBerry>=0)return false;
      b.status='held';s.heldBerry=i;touch();return true;
    }
    function placeBerry(angle) {
      const i=s.heldBerry;if(i<0)return;
      const used=new Set(s.berries.filter(b=>b.slot>=0).map(b=>b.slot));
      const slots = angles.map((a,j)=>({j,d:Math.abs(wrap(a-(angle??angles[i])))}))
        .filter(x=>!used.has(x.j)).sort((a,b)=>a.d-b.d);
      const b=s.berries[i]; b.slot=slots[0].j;b.status='flying';b.progress=0;
      s.heldBerry=-1;touch();
    }
    function takeBag() {
      if(!['pipe','look'].includes(s.phase)||s.bag==='returning')return false;
      s.phase='pipe';s.bag='hand';
      if(s.bagMass<.025)s.bagMass=options.bagMass??100;
      const p=point(nextGap());s.toolX=p.x;s.toolZ=p.z;touch();return true;
    }
    function aim(x,z){
      if(s.bag!=='hand')return;
      s.toolX=x;s.toolZ=z; touch();
    }
    function site(x,z){
      const gap=nearest(x,z),p=point(gap),r=Math.hypot(x,z);
      if(r>8.45)return null;
      const edge=Math.min(1,6.60/Math.max(.01,r));x*=edge;z*=edge;
      const clearance=(x,z)=>Math.min(...angles.map(a=>Math.hypot(x-R*Math.sin(a),z-R*Math.cos(a))));
      if(clearance(x,z)<1.52){x=p.x;z=p.z;}
      const limit=clamp(p.limit+clearance(x,z)-clearance(p.x,p.z),.43,2.55);
      return {gap,x,z,limit,radialScale:clamp((7.64-Math.hypot(x,z))/limit,.63,1)};
    }
    function press(x,z) {
      if(s.phase!=='pipe'||s.bag!=='hand'||s.pinch)return false;
      const spot=site(x,z);if(!spot)return false;
      let index=s.flowers.findIndex(f=>Math.hypot(f.x-spot.x,f.z-spot.z)<.40);
      if(index<0){
        // The charge already sitting between the metal teeth makes even a tap visible.
        const charge=Math.min(.023,s.bagMass);s.bagMass-=charge;
        const f={...spot,mass:charge,width:0,height:0,heightV:0,tip:0,tipV:0,
          bendX:0,bendZ:0,exitX:0,exitZ:0,trailX:0,trailZ:0,
          lobes:Array.from({length:8},(_,j)=>({mass:charge/8,radius:0,velocity:0,
            resistance:.94+.09*Math.sin(spot.gap*3.2+j*4.41)})),released:false};
        s.flowers.push(f);index=s.flowers.length-1;
      }
      const f=s.flowers[index];f.released=false;f.exitX=0;f.exitZ=0;
      s.deposit=index;s.selected=f.gap;
      s.previousX=spot.x;s.previousZ=spot.z;s.motionX=0;s.motionZ=0;s.inputSpeed=0;
      s.pinch=true;aim(spot.x,spot.z);return true;
    }
    function release(){
      if(!s.pinch)return;
      const f=s.flowers[s.deposit]; f.released=true;
      f.exitX=clamp(s.motionX*.17,-.85,.85);f.exitZ=clamp(s.motionZ*.17,-.85,.85);
      s.pinch=false;s.sound=0;s.flow=0;s.deposit=-1;touch();
    }
    function parkBag(){
      if(s.phase!=='pipe'||s.bag!=='hand'||!s.flowers.length)return false;
      release();s.bag='returning';s.trayReturn=0;touch();return true;
    }
    function spin(dx,dy){
      if(s.phase!=='look')return;
      s.turning=true;s.turnForce=clamp(dx,-5,5);s.tiltGoal=clamp(s.tiltGoal+dy,0,1);
      touch();
    }
    function stopSpin(){s.turning=false;s.turnForce=0;}
    function serve(){
      if(s.phase!=='look')return false;
      s.phase='cut';s.cutAngle=-s.rotation;s.omega=0;stopSpin();s.cut=0;
      const half=.484,flowers=[];let closest=-1,nearest=Infinity;
      s.flowers.forEach((f,i)=>{
        const d=Math.abs(wrap(Math.atan2(f.x,f.z)-s.cutAngle));
        if(d<half)flowers.push(i);
        if(d<nearest){nearest=d;closest=i;}
      });
      const transfer=flowers.length? -1:closest;
      if(transfer>=0)flowers.push(transfer);
      s.portion={half,flowers,transfer};touch();return true;
    }
    function clearBoard(){if(s.phase==='served'){s.clearing=true;touch();}}
    function weather(h){
      s.air+=(noise()*.85-s.air*.18)*h;
      s.driftV+=(s.air*.16-s.drift*.23-s.driftV*.9)*h;
      s.drift+=s.driftV*h;
      for(let i=0;i<s.motes.length;i++){
        const m=s.motes[i];
        m.vx+=(s.air*(.08+i*.0008)-m.vx*.48-(m.x-3.9*Math.sin(i*73.32))*.033)*h;
        // Updraft near the table and cooler descending air near the window.
        m.vy+=(((.043+.086*((i*.618)%1))/(.22+m.y*m.y)-.031+s.air*.035)*(1+i*.008)-.65*m.vy)*h;
        m.x+=m.vx*h;m.y+=m.vy*h;
      }
      s.zones.forEach((v,i)=>{
        const sun=.25+.72*(.5-.5*Math.sin(angles[i]+s.rotation+s.drift));
        v.sun+=(sun-v.sun)*h*2;
        v.temperature+=(18+4*v.sun-v.temperature)*(.0035+.002*v.sun)*h/v.thickness;
        v.water-=h*.00019*v.sun*v.water*(.7+v.temperature/15);
        v.firmness=clamp(1.05-v.temperature*.033+(1-v.water)*.15,.35,1);
        const b=s.berries[i];
        b.moisture+=h*((.57+v.water*.29-b.moisture)*.028-v.sun*.00085);
        b.speed+=(-110*b.bounce-11*b.speed)*h;
        b.bounce+=b.speed*h;
        const rising=b.status==='held'?1:0;
        b.liftV+=((rising*.91-b.lift)*116-b.liftV*18)*h;
        b.lift+=b.liftV*h;
        b.rollV+=((rising*.88-b.roll)*(86+20*b.moisture)-b.rollV*15)*h;
        b.roll+=b.rollV*h;
        if(b.status==='flying'){
          b.progress=Math.min(1,b.progress+h/(b.fromHand?1.15:.64));
          if(b.progress>=1){b.status='placed';b.speed=1.7+b.moisture*.7;}
        }
      });
    }
    function filling(h){
      const f=s.flowers[s.deposit],z=s.zones[s.selected]||s.zones[0];
      const vx=(s.toolX-s.previousX)/h,vz=(s.toolZ-s.previousZ)/h;
      s.previousX=s.toolX;s.previousZ=s.toolZ;
      s.motionX+=(clamp(vx,-35,35)-s.motionX)*Math.min(1,h*13);
      s.motionZ+=(clamp(vz,-35,35)-s.motionZ)*Math.min(1,h*13);
      s.inputSpeed=Math.hypot(s.motionX,s.motionZ);
      const push=s.pinch?clamp(1.1-s.inputSpeed*.045,.23,1)*(.78+.22*Math.min(1,s.bagMass/65)):0;
      for(let i=0;i<3;i++){
        const target=i?s.pressure[i-1]:push;
        s.pressure[i]+=(target-s.pressure[i])*h*[17,22,30][i];
      }
      s.flow=0;
      if(f&&s.pinch){
        const capacity=2.25*f.limit*f.limit;
        s.flow=(.9+z.temperature*.075)*s.pressure[2]*Math.max(0,1-f.mass/capacity);
        const dm=Math.min(s.bagMass,s.flow*h);s.bagMass-=dm;f.mass+=dm;s.flow=dm/h;
        const tx=clamp(s.toolX-f.x,-1.9,1.9),tz=clamp(s.toolZ-f.z,-1.9,1.9);
        f.trailX+=(tx-f.trailX)*h*3.4*s.pressure[2];
        f.trailZ+=(tz-f.trailZ)*h*3.4*s.pressure[2];
        const weights=f.lobes.map((l,j)=>(1+.17*(Math.sin(j*Math.PI/4)*tx+Math.cos(j*Math.PI/4)*tz))/l.resistance);
        const total=weights.reduce((a,b)=>a+b);
        f.lobes.forEach((l,j)=>l.mass+=dm*weights[j]/total);
      }
      s.sound=s.pinch?Math.sqrt(s.flow)*s.pressure[1]:0;
      for(const flower of s.flowers){
        const zone=s.zones[flower.gap],limit=flower.limit;
        let width=0;
        for(const l of flower.lobes){
          const target=limit*(1-Math.exp(-Math.sqrt(8*l.mass)*2.5/limit));
          l.velocity+=h*((target-l.radius)*(58+25*zone.firmness)-l.velocity*(13+zone.firmness*3));
          l.radius+=l.velocity*h;width+=l.radius/8;
        }
        flower.width=width;
        const top=.92*Math.cbrt(flower.mass)*(.48+.57*zone.firmness);
        flower.heightV+=((top-flower.height)*132-flower.heightV*20)*h;
        flower.height+=flower.heightV*h;
        const lift=flower.released?Math.min(.62,flower.height*.64)*zone.firmness:0;
        flower.tipV+=h*((lift-flower.tip)*84-flower.tipV*12);
        flower.tip+=flower.tipV*h;
        flower.bendX+=(flower.exitX*Math.min(1,flower.tip*2)-flower.bendX)*h*12;
        flower.bendZ+=(flower.exitZ*Math.min(1,flower.tip*2)-flower.bendZ)*h*12;
      }
    }
    function tick(h){
      s.age+=h;if(!s.pinch&&s.heldBerry<0&&!s.turning)s.idle+=h;
      s.hint=s.idle>4?(s.idle-4)%6.7:0;
      weather(h);filling(h);
      s.nudgeV+=(-64*s.nudge-9*s.nudgeV)*h;s.nudge+=s.nudgeV*h;
      if(s.phase==='berries'&&s.berries.every(b=>b.status==='placed')){
        s.phase='handoff';s.handoff=0;touch();
      }
      if(s.phase==='handoff'){
        s.handoff=Math.min(1,s.handoff+h/1.6);
        if(s.handoff===1){s.phase='pipe';takeBag();}
      }
      if(s.bag==='returning'){
        s.trayReturn=Math.min(1,s.trayReturn+h/.85);
        if(s.trayReturn===1){s.bag='tray';s.phase='look';s.tiltGoal=.55;touch();}
      }
      if(s.phase==='look'){
        s.omega+=((s.turning?s.turnForce:0)-s.omega)*h*(s.turning?15:3.8);
        s.rotation+=s.omega*h;
      }
      s.tilt+=(s.tiltGoal-s.tilt)*h*2.6;
      if(s.phase==='cut'){
        s.cut=Math.min(1,s.cut+h/3.8);
        if(s.cut===1){s.phase='served';touch();}
      }
      if(s.clearing){
        s.clear=Math.min(1,s.clear+h/2.0);
        if(s.clear===1){s=fresh(s.batch+1);}
      }
    }
    function step(dt){
      if(!Number.isFinite(dt)||dt<=0)return;
      spare+=dt;
      while(spare+1e-10>=DT){tick(DT);spare-=DT;}
    }
    return {step,getState:()=>JSON.parse(JSON.stringify(s)),read:()=>s,point,nextGap,nearest,
      takeBag,site,aim,press,release,parkBag,liftBerry,placeBerry,spin,stopSpin,serve,clearBoard,touch,
      nudge(){s.nudgeV=.17;},ease};
  }
  root.PastryKitchen={createKitchen,angles,R,ease,wrap};
  if(typeof module!=='undefined')module.exports=root.PastryKitchen;
})(typeof window==='undefined'?globalThis:window);
