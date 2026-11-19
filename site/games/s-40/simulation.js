/* Positions in each vessel are fractions of its radius. Water heights are mm. */
(function (root) {
  "use strict";
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const tau = Math.PI * 2, D = 24, W = 23, PX = 29, PZ = 17;
  const avg = (a, f) => a.reduce((v, x) => v + f(x), 0) / a.length;
  function create(options = {}) {
    let seed = options.seed ?? 27319;
    function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
    const mass = options.mass ?? 245, initialTemp = options.temperature ?? 69;
    const dough = Array.from({length:D}, (_,i) => ({
      angle:i*tau/D, temperature:initialTemp+2*Math.sin(i*.8), water:.58+.065*Math.sin(i*1.37),
      starch:.74+.21*Math.sin(i*.86), stretch:.025*Math.cos(i), velocity:0, stress:0
    }));
    const water = Array.from({length:W*W}, (_,i) => {
      const x=(i%W)/(W-1)*2-1, z=Math.floor(i/W)/(W-1)*2-1;
      return {x,z,inside:x*x+z*z<=1,height:0,velocity:0,force:0,neighbors:[]};
    });
    water.forEach((c,i) => {
      if (!c.inside) return;
      for(const j of [i-1,i+1,i-W,i+W]) if(water[j]?.inside && Math.abs(water[j].x-c.x)<.15) c.neighbors.push(j);
    });
    const powder = Array.from({length:PX*PZ}, (_,i)=>({x:(i%PX)/(PX-1)*2-1,z:Math.floor(i/PX)/(PZ-1)*2-1,
      depth:3.8+.45*Math.sin(i*.57)+.25*random(), wet:0, velocity:0, dust:0}));
    const deposit=new Float64Array(PX*PZ), footprint=new Float64Array(PX*PZ);
    const skin = Array.from({length:84},(_,i)=>{
      const y=1-2*(i+.5)/84, a=i*2.3999632, r=Math.sqrt(1-y*y);
      return {x:r*Math.cos(a),y,z:r*Math.sin(a),temperature:initialTemp+.7*y,wet:options.surfaceWater??(.75+.18*Math.sin(a)),
        powder:0,bruise:0,elastic:0,v:0};
    });
    const b = {x:0,z:0,vx:0,vz:0,angle:0,spin:0,elongation:0,stretchV:0,flight:0,edge:0,returnSpeed:0,escape:0,netLoad:0,targetX:0,targetZ:0,trailAngle:.56};
    const net={x:.54,z:.42,depth:0,v:0,aim:0,drips:0,reservoir:0,shake:0,auto:false,goalX:.54,goalZ:.42,flow:1,plug:0};
    const wetWire=Array.from({length:12},(_,i)=>({angle:i*tau/12,film:.06+.014*Math.sin(i),bead:0}));
    const paddle={x:0,z:0,vx:0,vz:0,tx:0,tz:0,yaw:0,spin:0,turn:0};
    const tray={tilt:0,velocity:0,aim:0,roll:0,tiltZ:0,rustle:0};
    const air={lightTravel:0,puffBudget:.63,puffs:0,breeze:.12,target:.15,next:0,feed:0,steam:0,plumes:[],grains:[],drops:[]};
    const s={phase:"fold",age:0,time:0,idle:0,batch:1,mass,foldHeat:0,mix:0,toolAngle:-1.98,toolVelocity:0,
      pull:0,spoonLoad:0,spoonX:0,spoonZ:0,spoonPose:{x:0,z:0,vx:0,vz:0},paddle,net,wetWire,tray,bite:b,dough,water,powder,skin,air,serve:0,transport:0};
    let held=null, events=[], inlet=.3, flightX=0,flightZ=0,settle=0,biteMade=false,netCatch=0,spoonPull=0;
    function emit(type,strength=.5){ if(events.length<80)events.push({type,strength}); }
    function phase(p){s.phase=p;s.age=0;s.idle=0;held=null;}
    function wave(x,z,k,r=.16){for(const c of water)if(c.inside)c.velocity+=k*Math.exp(-((c.x-x)**2+(c.z-z)**2)/(r*r));}
    function fold(a,force){
      s.toolAngle=a;
      s.toolVelocity=clamp(s.toolVelocity+force*.48,-3,3);
      for(const c of dough){
        const near=.22+.78*Math.pow((1+Math.cos(c.angle-a))*.5,2);
        c.stress+=force*near*245/s.mass;
        c.velocity+=force*near*2.1*245/s.mass;
      }
    }
    function begin(tool,x=0,z=0){
      const ok={fold:['paddle'],spoon:s.spoonLoad>.6?['spoon','bowl']:['spoon','dough'],fish:['net','water'],drain:['net','tray'],coat:['tray','piece','cup'],serve:['cup']}[s.phase];
      if(!ok?.includes(tool))return false;
      s.idle=0;held={tool,x,z,startX:x,startZ:z,moved:0};
      if(s.phase==='fold'){paddle.tx=.15;paddle.tz=-.32;paddle.vz-=.94;fold(Math.atan2(z||-.3,x||-.2),1.2);emit('fold',.32+avg(dough,c=>c.water)*.5);}
      if(s.phase==='spoon'){
        if(tool==='bowl'){drop(x,z);return true;}
        if(!biteMade){for(let i=0;i<skin.length;i++){const source=dough[i%D];skin[i].temperature=source.temperature;}}
        biteMade=true;spoonPull+=.65;emit('scoop',.45);
      }
      if(s.phase==='fish'){net.auto=true;net.aim=-.66;netCatch=0;emit('water',.12);}
      if(s.phase==='drain'){net.shake+=.85;if(tool==='tray'&&net.reservoir<.28)phase('transfer');}
      if(s.phase==='coat'){tray.aim=tool==='cup'?.62:(x>.1?-.42:.46);tray.tiltZ=clamp(z,-1,1)*.13;emit('powder',.10+.13*(1-avg(skin,c=>c.wet)));}
      if(s.phase==='serve'){phase('share');emit('ceramic',.28);}
      return true;
    }
    function move(x,z){
      if(!held)return;
      const dx=clamp(x-held.x,-.35,.35),dz=clamp(z-held.z,-.35,.35),dist=Math.hypot(dx,dz);
      if(dist<.001)return;
      s.idle=0;held.moved+=dist;
      if(s.phase==='fold'){
        paddle.tx=clamp((x-held.startX)*1.05,-.76,.76);paddle.tz=clamp((z-held.startZ)*1.05-.15,-.75,.68);
        paddle.turn=clamp((x-held.startX)*.65,-.58,.58);fold(Math.atan2(z,x),Math.min(.30,dist*.95));
      }
      if(s.phase==='spoon'){spoonPull+=dist*1.7;s.spoonX=clamp(x-held.startX,-4,4)*1.83;s.spoonZ=clamp(z-held.startZ,-4,4)*1.83;}
      if(s.phase==='fish'){
        net.auto=false;net.goalX=clamp(x,-.93,.93);net.goalZ=clamp(z,-.93,.93);
        const near=Math.hypot(b.x-net.x,b.z-net.z)<.85;
        if(near&&Math.abs(dx)>Math.abs(dz)*1.25&&Math.abs(dx)>.008){
          b.vx+=dx*.9;b.vz+=(b.z-net.z)*dist*.24;b.escape+=Math.abs(dx)*7;
          netCatch=0;wave(net.x,net.z,dist*6);
        }else if(near&&net.depth<-.15){netCatch+=dist*2.3+.025;}
      }
      if(s.phase==='drain')net.shake=Math.min(3,net.shake+dist*2.8);
      if(s.phase==='coat'){tray.aim=clamp((x-held.startX)*.83+.12,-.58,.70);tray.tiltZ=clamp((z-held.startZ)*.16,-.23,.23);}
      held.x=x;held.z=z;
    }
    function end(target,x=0,z=0){
      if(!held)return;
      if(s.phase==='spoon'&&target==='bowl'&&biteMade)drop(x,z);
      if(s.phase==='fish'&&held?.moved>.13){net.auto=true;netCatch=Math.max(netCatch,.22);}
      if(s.phase==='coat'){settle=held.moved>.1?.75:1.65;}
      held=null;
    }
    function drop(x,z){
      let r=Math.max(1,Math.hypot(x,z)/.9);flightX=b.targetX=x/r;flightZ=b.targetZ=z/r;b.edge=Math.hypot(flightX,flightZ);
      phase('drop');b.flight=0;
    }
    function updateDough(dt){
      if(!held||s.phase!=='fold'){paddle.tx*=Math.exp(-dt*2.1);paddle.tz*=Math.exp(-dt*2.1);paddle.turn*=Math.exp(-dt*1.7);}
      const drag=clamp(Math.sqrt(s.mass/245)*(.73+.39*dough[14].starch),.7,1.4);
      paddle.vx+=dt*((paddle.tx-paddle.x)*24/drag-6.2*paddle.vx);
      paddle.vz+=dt*((paddle.tz-paddle.z)*24/drag-5.2*paddle.vz);
      paddle.spin+=dt*((paddle.turn-paddle.yaw)*18-5*paddle.spin);
      paddle.x+=paddle.vx*dt;paddle.z+=paddle.vz*dt;paddle.yaw+=paddle.spin*dt;
      let sum=0;
      for(const c of dough){
        const adjacent=dough[(dough.indexOf(c)+1)%D];
        const evaporation=(c.temperature-23)*(.000022+.000005*Math.cos(c.angle))*c.water;
        c.temperature+=dt*((38-c.temperature)*.006+(adjacent.temperature-c.temperature)*.12+.023*c.stress);
        c.water=clamp(c.water-dt*evaporation+dt*(adjacent.water-c.water)*.015,.25,1);
        c.stress*=Math.exp(-1.8*dt);
        c.starch*=Math.exp(-dt*c.stress*(.94+c.water)*Math.max(.35,c.temperature/65));
        c.velocity+=dt*((adjacent.stretch-c.stretch)*7-c.stretch*(17+12*c.starch)-c.velocity*(3.8+2*c.starch)
          +.10*Math.sin(c.angle+s.toolAngle)*air.breeze+c.stress*(c.temperature/55));
        c.stretch=clamp(c.stretch+dt*c.velocity,-.7,.85);
        sum+=c.starch;
      }
      s.mix=1-sum/D;
      s.toolVelocity+=dt*(-s.toolVelocity*3.4+.32*dough[13].velocity+.10*air.breeze);
      s.pull+=dt*(avg(dough,c=>c.stretch)-s.pull)*7;
      if(s.phase==='fold'&&s.mix>.89&&Math.abs(s.pull)<.16){phase('spoon');emit('ready',.23);}
    }
    function updateWater(dt){
      air.lightTravel+=dt*(.45+.42*air.breeze+.16*Math.abs(water[145].velocity));
      const plugTarget=s.phase==='drain'?clamp((s.age-1.4)/1.35,0,1):0;
      net.plug+=(plugTarget-net.plug)*dt*2.8;net.flow+=(1-net.plug*.64-net.flow)*dt*1.5;
      inlet-=dt*net.flow;
      if(inlet<=0){wave(-.20,-.71,2+random()*2.6,.135);inlet=.40+random()*.75;emit('inlet',.028+random()*.045);}
      for(const c of water)if(c.inside){
        let lap=0;for(const j of c.neighbors)lap+=water[j].height-c.height;
        c.force=lap*176-c.velocity*1.33-c.height*.75;
      }
      for(const c of water)if(c.inside){c.velocity+=c.force*dt;c.height+=c.velocity*dt;}
    }
    function cellAt(x,z){return water[clamp(Math.round((z+1)*(W-1)/2),1,W-2)*W+clamp(Math.round((x+1)*(W-1)/2),1,W-2)];}
    function updateBite(dt){
      if(!biteMade){for(let i=0;i<skin.length;i++)skin[i].temperature=dough[i%D].temperature;return;}
      const inWater=s.phase==='fish', draining=s.phase==='drain';
      for(const c of skin){
        const contact=clamp(.66-.53*c.y+.12*Math.sin(c.x*4),.04,1);
        if(inWater)c.temperature+=(16-c.temperature)*dt*(.29+.85*contact);
        else c.temperature+=(24-c.temperature)*dt*.012;
        if(inWater)c.wet+=(1-c.wet)*dt*contact*2;
        if(draining)c.wet*=Math.exp(-dt*(.31+.38*contact+net.shake*.22));
        const k=20+(70-c.temperature)*.75;
        c.v+=dt*((b.vx*c.x+b.vz*c.z)*1.6+net.shake*c.y*.7-c.elastic*k-c.v*3.8);
        c.elastic+=dt*c.v;
      }
      const heat=avg(skin,c=>c.temperature);
      if(s.phase==='spoon'){
        const p=s.spoonPose;
        if(!held){s.spoonX*=Math.exp(-dt*5);s.spoonZ*=Math.exp(-dt*5);}
        p.vx+=dt*((s.spoonX-p.x)*88-p.vx*15);p.vz+=dt*((s.spoonZ-p.z)*88-p.vz*15);
        p.x+=p.vx*dt;p.z+=p.vz*dt;
        if(Math.hypot(p.vx,p.vz)>.06){const turn=Math.atan2(p.vx,p.vz)-b.trailAngle;
          b.trailAngle+=Math.atan2(Math.sin(turn),Math.cos(turn))*dt*6;}
        s.spoonLoad+=dt*(1-s.spoonLoad)*4;s.mass=mass-17*s.spoonLoad;
        b.stretchV+=dt*(spoonPull*(heat/60)**2*17-b.elongation*16-b.stretchV*4);
      }else b.stretchV+=dt*(-b.elongation*20-b.stretchV*4);
      b.elongation=clamp(b.elongation+b.stretchV*dt,-.16,1.45);spoonPull*=Math.exp(-3.3*dt);
      if(s.phase==='drop'){
        b.flight=Math.min(1,b.flight+dt*1.35);
        const u=b.flight*b.flight*(3-2*b.flight);b.x=flightX*u;b.z=flightZ*u;
        if(b.flight>=1){
          b.x=flightX;b.z=flightZ;b.vx=flightX*.48+.10;b.vz=flightZ*.45+.07;
          wave(b.x,b.z,-30-s.mass*.014,.23);emit('plop',.70+s.mass/1200);
          netCatch=0;phase('fish');splash(9);
        }
      }
      if(!inWater)return;
      const i=water.indexOf(cellAt(b.x,b.z)),gx=water[i+1].height-water[i-1].height,gz=water[i+W].height-water[i-W].height;
      b.vx+=dt*(-gx*.38-b.vx*.58-b.z*.29+.063);
      b.vz+=dt*(-gz*.38-b.vz*.58+b.x*.29+.026);
      const r=Math.hypot(b.x,b.z);
      if(r>.74){
        const rim=cellAt(.91*b.x/r,.91*b.z/r);
        const reflected=Math.abs(rim.height)*.76+Math.abs(rim.velocity)*.021;
        const f=clamp((r-.74)/.16,0,1)*reflected+Math.max(0,r-.84)*14;
        b.vx-=dt*f*b.x/r;b.vz-=dt*f*b.z/r;
        b.returnSpeed=Math.max(b.returnSpeed,-(b.vx*b.x+b.vz*b.z)/r);
      }
      b.x=clamp(b.x+b.vx*dt,-.96,.96);b.z=clamp(b.z+b.vz*dt,-.96,.96);
      net.v+=dt*((net.aim-net.depth)*18-net.v*5);net.depth+=net.v*dt;
      if(!net.auto&&held){net.x+=(net.goalX-net.x)*dt*6;net.z+=(net.goalZ-net.z)*dt*6;}
      if(net.auto&&net.depth<-.12){
        net.x+=(b.x-net.x)*dt*2.6;net.z+=(b.z+.035-net.z)*dt*2.6;
        if(Math.hypot(net.x-b.x,net.z-b.z)<.40)netCatch+=dt*.86;
      }
      if(netCatch>.70 && heat<50){
        phase('drain');net.aim=.67;b.netLoad=1;emit('water',.3);
      }
    }
    function splash(n){
      for(let i=0;i<n;i++)air.drops.push({x:b.x,z:b.z,y:.01,vx:(random()-.5)*.72,vz:(random()-.5)*.72,vy:1.3+random()*1.35,size:.019+random()*.026});
    }
    function updateNet(dt){
      if(s.phase==='fish'&&net.depth<-.035){
        const submerged=clamp(-net.depth*2,0,1);
        net.reservoir+=dt*(submerged-net.reservoir)*(2.4+submerged);
      }
      for(const wire of wetWire){
        const z=Math.sin(wire.angle)*.24,x=Math.cos(wire.angle)*.24;
        const immersed=s.phase==='fish' && net.depth+z*.16<-.04;
        if(immersed)wire.film+=dt*(1-wire.film)*(2.2+.7*z);
        else{
          const out=wire.film*(.16+.05*Math.cos(wire.angle)+net.shake*.49);
          wire.film-=dt*out;
          if(s.phase==='drain' && net.depth>.08){wire.bead+=dt*out*2.3;
            if(wire.bead>.68){wire.bead-=.68;air.drops.push({x:net.x+x,z:net.z+z,y:net.depth-.07,vy:-.19,vx:0,vz:0,size:.029+wire.film*.014});}
          }
        }
      }
      if(s.phase!=='drain')return;
      b.x+=(net.x-b.x)*dt*7;b.z+=(net.z-b.z)*dt*7;
      net.v+=dt*((net.aim-net.depth)*12-net.v*5);net.depth+=dt*net.v;
      net.shake*=Math.exp(-2*dt);
      if(net.depth>.07){
        net.reservoir*=Math.exp(-dt*(.60+.41*net.shake));
        net.drips+=dt*net.reservoir*(11+net.shake*7);
        if(net.drips>=1){net.drips-=1;air.drops.push({x:net.x+(random()-.5)*.35,z:net.z+(random()-.5)*.29,y:net.depth,vy:-.3,vx:0,vz:0,size:.035});}
      }
      if(net.reservoir<.055 && !held)phase('transfer');
    }
    function updatePowder(dt){
      air.puffBudget+=dt*(.09+Math.max(0,air.breeze)*4.6);
      if(air.puffBudget>=1){
        air.puffBudget-=1;air.puffs++;
        const p=powder[(air.puffs*179)%powder.length];
        p.dust+=.08;p.velocity-=.007;
        air.grains.push({x:p.x*.95,z:p.z*.95,y:.02,vy:.26+.14*air.breeze,vx:air.breeze*.58,vz:.023,size:.012});
      }
      for(const p of powder){p.dust*=Math.exp(-dt*1.9);p.wet*=Math.exp(-dt*.002);p.velocity*=Math.exp(-dt*3);p.depth+=dt*p.velocity;}
      if(s.phase==='transfer'){
        s.transport=Math.min(1,s.transport+dt*.68);
        const u=s.transport*s.transport*(3-2*s.transport);
        b.x=net.x+(-.62-net.x)*u;b.z=net.z+(-.12-net.z)*u;
        if(s.transport>=1){b.netLoad=0;b.x=-.62;b.z=-.12;b.vx=.12;b.vz=0;b.angle=0;tray.aim=0;phase('coat');emit('powder',.28+.25*(1-avg(skin,c=>c.wet)));}
      }
      if(s.phase!=='coat')return;
      if(!held){settle-=dt;if(settle<0)tray.aim*=Math.exp(-dt*3);}
      tray.velocity+=dt*((tray.aim-tray.tilt)*13-tray.velocity*4.7);tray.tilt+=dt*tray.velocity;
      b.vx+=dt*(tray.tilt*2.2-b.vx*1.45);b.vz+=dt*(tray.tiltZ*.8-b.vz*2.1);b.x+=dt*b.vx;b.z+=dt*b.vz;
      if(b.x<-.85){b.x=-.85;b.vx=Math.abs(b.vx)*.22;}b.z=clamp(b.z,-.74,.74);
      b.angle+=dt*b.vx*5.9;tray.roll+=dt*Math.abs(b.vx);
      deposit.fill(0);footprint.fill(0);
      const cos=Math.cos(b.angle),sin=Math.sin(b.angle);
      for(const c of skin){
        const down=-(c.y*cos+c.x*sin),contact=clamp((down-.08)*1.45,0,1);
        if(contact<=0)continue;
        const cx=(b.x+(c.x*cos-c.y*sin)*.17+1)*.5*(PX-1),cz=(b.z+c.z*.24+1)*.5*(PZ-1);
        const ix=clamp(Math.round(cx),0,PX-1),iz=clamp(Math.round(cz),0,PZ-1);
        const supply=clamp(powder[iz*PX+ix].depth/3.2,.28,1);
        for(let z=Math.max(0,iz-1);z<=Math.min(PZ-1,iz+1);z++)for(let x=Math.max(0,ix-1);x<=Math.min(PX-1,ix+1);x++){
          const k=z*PX+x,w=contact*Math.exp(-((x-cx)**2+(z-cz)**2)*1.4);
          deposit[k]+=c.wet*w;footprint[k]+=w;
        }
        c.powder+=dt*contact*(1-c.powder)*(1.2+c.wet)*supply;
        c.bruise+=dt*contact*(c.wet-c.bruise)*1.1;c.wet*=Math.exp(-dt*.30*contact);
      }
      for(let i=0;i<powder.length;i++){
        const p=powder[i],pressure=Math.exp(-((p.x-b.x)**2/.014+(p.z-b.z)**2/.036));
        p.velocity-=dt*pressure*Math.max(0,p.depth-1.65)*7;
        if(footprint[i]>.001){const waterHere=deposit[i]/footprint[i];
          p.wet+=dt*Math.min(1,footprint[i]*.23)*(waterHere-p.wet)*1.3;}
        p.dust+=dt*pressure*Math.abs(b.vx)*2;
      }
      tray.rustle+=dt*Math.abs(b.vx);
      if(tray.rustle>.27){tray.rustle=0;emit('powder',.10+Math.abs(b.vx)*(1-avg(skin,c=>c.wet))*.26);}
      air.feed+=dt*Math.abs(b.vx)*53;
      if(air.feed>1){
        air.feed-=1;air.grains.push({x:b.x+(random()-.5)*.2,z:b.z+(random()-.5)*.22,y:.03,vy:.37+random()*.48,vx:(random()-.5)*.5,vz:(random()-.5)*.4,size:.012+random()*.015});
      }
      if(b.x>.91){b.x=.91;phase('receive');emit('powder',.48);}
    }
    function atmosphere(dt){
      air.next-=dt;if(air.next<=0){air.target=(random()-.34)*.8;air.next=.5+random()*2.0;}
      air.breeze+=(air.target-air.breeze)*dt*.9;
      air.steam+=dt*Math.max(.35,(dough[3].temperature-28)*.060);
      if(air.steam>1){
        air.steam-=1;const a=random()*tau,r=.12+random()*.55;
        air.plumes.push({x:Math.cos(a)*r,z:Math.sin(a)*r,y:0,age:0,life:1.5+random()*1.6,spin:random()*tau,vy:.20+random()*.13});
      }
      for(const p of air.plumes){p.y+=p.vy*dt;p.x+=dt*air.breeze*.32;p.age+=dt;}
      air.plumes=air.plumes.filter(p=>p.age<p.life);
      for(const group of [air.drops,air.grains])for(let i=group.length-1;i>=0;i--){
        const p=group[i];p.vy-=dt*4.1;p.y+=dt*p.vy;p.x+=dt*p.vx;p.z+=dt*p.vz;
        if(p.y<0){if(group===air.drops){wave(p.x,p.z,-p.size*60,.11);emit('drip',p.size*4);}group.splice(i,1);}
      }
    }
    function tick(dt){
      s.time+=dt;s.age+=dt;s.idle=held?0:s.idle+dt;
      atmosphere(dt);updateDough(dt);updateWater(dt);updateBite(dt);updateNet(dt);updatePowder(dt);
      if(s.phase==='receive'){s.serve=Math.min(1,s.serve+dt*.84);if(s.serve>=1){phase('serve');emit('ceramic',.20);}}
      if(s.phase==='share'){
        const resetRate=1-Math.exp(-dt*2.5);
        net.x+=(.54-net.x)*resetRate;net.z+=(.42-net.z)*resetRate;net.depth*=1-resetRate;net.reservoir*=1-resetRate;
        b.x*=1-resetRate;b.z*=1-resetRate;b.angle*=1-resetRate;tray.tilt*=1-resetRate;tray.aim*=1-resetRate;
        // Mother levels the tray from the exit back to the pile and feeds the next batch.
        const sweep=clamp((s.age-.24)/2.45,0,1),fresh=clamp((s.age-.6)/1.7,0,1);
        for(const p of powder){const fill=clamp((p.x-1+sweep*2.6)*4,0,1);p.depth+=(3.9+.21*Math.sin(p.x*8+p.z*12)-p.depth)*dt*fill*3.1;p.wet*=Math.exp(-dt*fill*3);}
        for(let i=0;i<D;i++){const c=dough[i],feed=fresh*(.9+.24*Math.cos(c.angle));
          c.starch+=(.74+.21*Math.sin(i*.86)-c.starch)*dt*feed*3;
          c.temperature+=(initialTemp+2*Math.sin(i*.8)-c.temperature)*dt*feed*2.5;c.water+=(.58+.065*Math.sin(i*1.37)-c.water)*dt*feed*2;
        }
        for(let i=0;i<skin.length;i++){const c=skin[i],rate=dt*fresh*(2.5+.52*c.y);
          c.temperature+=(dough[i%D].temperature-c.temperature)*rate;c.powder*=1-rate;c.bruise*=1-rate;
          c.wet+=((options.surfaceWater??(.75+.18*Math.sin(i*2.3999632)))-c.wet)*rate;
        }
        s.mass+=(mass-s.mass)*dt*fresh*3;
        if(s.age>3.8){
          s.batch++;netCatch=0;Object.assign(s.spoonPose,{x:0,z:0,vx:0,vz:0});s.spoonLoad=0;s.spoonX=s.spoonZ=0;s.serve=0;s.transport=0;biteMade=false;spoonPull=0;
          Object.assign(net,{auto:false,aim:0,depth:0,v:0,reservoir:0,x:.54,z:.42,shake:0});
          Object.assign(b,{netLoad:0,x:0,z:0,vx:0,vz:0,flight:0,angle:0,elongation:0,stretchV:0});
          Object.assign(tray,{roll:0,tilt:0,aim:0,velocity:0,tiltZ:0,rustle:0});phase('fold');
        }
      }
    }
    let remainder=0;
    function step(dt){
      if(!Number.isFinite(dt)||dt<=0)return;
      remainder+=dt;
      while(remainder>=1/120-1e-10){tick(1/120);remainder-=1/120;}
    }
    return {state:s,step,begin,move,end,takeEvents(){const out=events;events=[];return out;},
      getState(){return JSON.parse(JSON.stringify(s,(k,v)=>k==='neighbors'||k==='force'?undefined:v));}};
  }
  const api={create,D,W,PX,PZ};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.Warabi=api;
})(globalThis);
