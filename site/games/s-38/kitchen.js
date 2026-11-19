(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./fish.js'):root.Die;
const {clamp,smooth}=D, NX=27,NZ=11, N=NX*NZ;
const near=(a,b,k,dt)=>a+(b-a)*(-Math.expm1(-k*dt));
function makeKitchen(seed=314159){
  let rng=seed>>>0;
  const random=()=>((rng=(Math.imul(1664525,rng)+1013904223)>>>0)/4294967296);
  const cells=Array.from({length:N},(_,i)=>{
    const u=(i%NX+.5)/NX,v=2*(Math.floor(i/NX)+.5)/NZ-1,{x,z}=D.point(u,v),depth=D.relief(u,v,x,z);
    return {u,v,x,z,depth,channel:D.channel(u,x,z),capacity:.17+depth*.57,iron:151+7*Math.cos(x*2)-3*z,heat:24,liquid:0,skin:0,water:0,toast:0,release:0,bean:0,coat:0,grain:random(),flux:0};
  });
  const noseWeights=cells.map(c=>Math.exp(-((c.x+1.55)**2/.014+(c.z-.018)**2/.009)));
  const noseWeight=noseWeights.reduce((a,b)=>a+b,0);
  const wings=Array.from({length:2*NX},(_,i)=>({u:(i%NX+.5)/NX,v:i<NX?-1:1,mass:0,dry:0,crack:0,stress:0,broken:false}));
  const s={stage:'pour',age:0,time:0,idle:0,batch:1,cells,wings,toolX:-1.54,toolZ:0,vx:0,vz:0,tilt:0,flow:0,started:false,held:false,aimX:-1.54,aimZ:0,dragged:false,
    hinge:0,hingeSpeed:0,turn:0,turnSpeed:0,lever:0,travel:0,coat:0,bake:0,rest:0,bag:0,give:0,split:0,splitAim:0,beanReach:0,fillReach:0,draft:0,air:0,swing:0,swingSpeed:0,
    steam:0,sizzle:0,peel:0,coal:0.56,guide:0,guideAge:0,drop:1,dropHit:false,particles:[],dust:[],events:[],portion:1,beanSupply:0,serveWait:0,edgeU:0,edgeV:0};
  let airAim=.23,windWait=1.2,steamDebt=0,soundDebt=0,streamTarget=0,goalIndex=0,initialDrop=0,kiln=0,fireNoise=.55,shot=0,peelDebt=0,tapSplash=0,eventId=0,dustDebt=.85;
  const delta=new Float64Array(N);
  function event(kind,power=1){s.events.push({kind,power,at:s.time,id:++eventId});if(s.events.length>60)s.events.shift()}
  function stage(name){s.stage=name;s.age=0;s.started=false;s.held=false;s.dragged=false;s.travel=0;s.lever=0;s.idle=0;s.guideAge=0}
  function begin(kind,x,z){
    if(kind==='wing'&&s.stage==='gift'){return crack(x,z)}
    if(kind==='split'&&s.stage==='gift'){s.splitAim=1;event('paper',.45);return true}
    const active={pour:'ladle',fill:'spatula',close:'handle',flip:'handle',open:'handle',bag:'bag',gift:'bag'}[s.stage];
    if(!active||kind!==active)return false;
    if(s.stage==='pour'&&!s.started){tapSplash=.25;event('sizzle',.75)}
    s.idle=0;s.started=true;s.held=true;s.dragged=false;s.travel=0;
    if(s.stage==='fill'){s.aimX=-.85;s.aimZ=.09}
    if(s.stage==='pour'&&!s.dropHit){initialDrop=1}
    event(({ladle:'wood',spatula:'wood',handle:'wood',bag:'paper'})[kind]);return true
  }
  function move(x,z,amount=0){
    if(!s.held)return;
    s.idle=0;s.dragged=true;s.travel+=Math.abs(amount);
    if(s.stage==='pour'||s.stage==='fill'){s.aimX=clamp(x,-1.85,1.80);s.aimZ=clamp(z,-1.11,1.11)}
    else s.lever=clamp(s.lever+Math.abs(amount)*1.35);
  }
  function end(){s.held=false;s.idle=0}
  function crack(u,v){
    let w=wings[Math.floor(clamp(u,0,.999)*NX)+(v<0?0:NX)];
    if(w.mass<.006||w.crack>.9)return false;
    const resistance=.19+.88*w.mass+.24*(1-w.dry);
    w.stress+=.67;
    if(w.stress>resistance&&w.mass<.58&&!w.broken){w.broken=true;w.stress=2;event('snap',clamp(.4+w.dry));return true}
    event('paper',.28);return false
  }
  function spring(key,vel,target,k,dt){
    s[vel]+=((target-s[key])*k-2*Math.sqrt(k)*s[vel])*dt;s[key]+=s[vel]*dt
  }
  function autoTarget(){
    const goal=cells[goalIndex];
    if(goal.liquid+goal.skin>goal.capacity*.72||streamTarget<=0){
      let best=Infinity;
      for(let i=0;i<N;i++){
        const c=cells[i],dist=(c.x-s.toolX)**2+(c.z-s.toolZ)**2;
        const score=(c.liquid+c.skin)/c.capacity*4+dist*.17;
        if(score<best){best=score;goalIndex=i}
      }
      streamTarget=.48
    }
    return cells[goalIndex]
  }
  function tick(dt){
    s.age+=dt;s.time+=dt;s.idle=s.held?0:s.idle+dt;
    windWait-=dt;if(windWait<=0){airAim=(random()-.45)*1.3;windWait=.65+random()*2;fireNoise=.36+random()*.46}
    s.draft=near(s.draft,airAim,1.3,dt);s.air+=s.draft*dt;
    s.swingSpeed+=(s.draft*.9-s.swing*3.8-s.swingSpeed*.48)*dt;s.swing+=s.swingSpeed*dt;
    s.coal=near(s.coal,fireNoise+s.draft*.12,2,dt);
    s.guide=near(s.guide,s.idle>3.85&&!s.started&&!['coat','bake','rest','return'].includes(s.stage)?1:0,2.7,dt);
    if(s.guide>.035)s.guideAge+=dt;
    const pouring=s.stage==='pour'&&s.started, filling=s.stage==='fill'&&s.started;
    if(pouring&&(!s.held||!s.dragged)){
      streamTarget-=dt;const target=autoTarget();s.aimX=target.x;s.aimZ=target.z
    }
    if(filling&&(!s.dragged)){s.aimX=Math.min(.15,-.88+s.age*.26);s.aimZ=.075}
    if(pouring||filling){spring('toolX','vx',s.aimX,70,dt);spring('toolZ','vz',s.aimZ,70,dt)}
    s.tilt=near(s.tilt,pouring?1:0,3.7,dt);
    s.flow=near(s.flow,pouring?6.9*s.portion*s.tilt:0,6,dt);
    if(!s.dropHit){s.drop=Math.max(0,s.drop-dt*(initialDrop?4:1.24));if(s.drop===0){s.dropHit=true;event('sizzle',.3)}}
    const pulse=(s.dropHit&&shot<.38?.80:0)+(tapSplash>0?.98:0);tapSplash=Math.max(0,tapSplash-dt);if(s.dropHit)shot+=dt;
    let sumWeight=0,coverage=0,tail=0,wetHeat=0,steam=0,doneness=0,release=0,beanTotal=0,topCoat=0;
    const uv=D.uv(s.toolX,s.toolZ),outside=Math.max(Math.abs(uv.v)-.91,(Math.abs(s.toolX)-1.62)*3);
    if(s.flow>.001&&outside>0){
      const side=uv.v<0?0:NX,w=wings[Math.floor(clamp(uv.u,0,.999)*NX)+side];
      w.mass+=dt*s.flow*.17*clamp(outside*2)*(1-w.mass/.95);
    }
    const px=s.toolX,pz=s.toolZ;
    if(s.flow>.0003)for(const c of cells){const d=(c.x-px)**2/.026+(c.z-pz)**2/.023;c.flux=d<10?Math.exp(-d)*(1+1.8*c.channel):0;sumWeight+=c.flux}
    const hot=['flip','bake','rest','open','bag','gift'].includes(s.stage);
    kiln=near(kiln,hot&&s.stage!=='gift'&&s.stage!=='bag'?1:.21,1.1,dt);
    delta.fill(0);
    for(let i=0;i<N;i++){
      const c=cells[i];
      if(pulse)c.liquid+=pulse*dt*noseWeights[i]/noseWeight;
      if(sumWeight>.00001)c.liquid+=dt*s.flow*(1-clamp(outside*1.8,0,.9))*c.flux/sumWeight;
      for(const j of [i%NX<NX-1?i+1:-1,i+NX<N?i+NX:-1]){
        if(j<0)continue;
        const b=cells[j],drive=c.liquid/c.capacity-b.liquid/b.capacity+.16*(b.depth-c.depth);
        const src=drive>0?c:b;
        const alongRay=j===i+1?1+.74*(b.channel+c.channel):1-.51*Math.abs(c.channel-b.channel);
        const flux=Math.sign(drive)*Math.min(src.liquid*.16,Math.abs(drive)*alongRay*.44*dt/(1+8*src.skin));
        delta[i]-=flux;delta[j]+=flux;
      }
    }
    const coatPass=s.stage==='coat'?clamp(s.age/3.2):s.coat;
    for(let i=0;i<N;i++){
      const c=cells[i];c.liquid=Math.max(0,c.liquid+delta[i]);
      const mass=c.liquid+c.skin, fullness=mass/c.capacity;
      const contact=1-smooth(.15,.90,s.bag);
      const stove=155+kiln*31+7*Math.cos(c.x*2.3+c.z*.5)+s.coal*4+s.draft*(2+c.v);
      c.iron+=dt*((stove-c.iron)*.13-(c.iron-c.heat)*Math.min(mass,.65)*.21*contact);
      c.heat+=dt*((mass>.00001?(c.iron-c.heat)*(.49+.16*c.depth)*contact/(1+1.4*mass):0)-(c.heat-24)*(.025+.008*c.v+.035*(1-contact)));
      const setting=Math.min(c.liquid,c.liquid*dt*(.078+.018*c.depth)*smooth(35,97,c.heat));
      c.liquid-=setting;c.skin+=setting;
      const waterAim=clamp(fullness)*(.94-.78*c.toast);
      c.water+=dt*((waterAim-c.water)*(mass>.0001?1.4:.3)-c.water*smooth(60,142,c.heat)*(.08+kiln*.3));
      c.toast+=dt*(1-c.toast)*.24*kiln*smooth(94,160,c.heat)*(1-c.water*.65)*clamp(fullness)*s.hinge*contact;
      if(filling){
        const d=(c.x-s.toolX)**2/.047+(c.z-s.toolZ)**2/.026;
        if(d<10){const amount=dt*1.75*Math.exp(-d)*(1-c.bean/.60);c.bean+=amount;s.beanSupply+=amount}
      }
      if(s.stage==='coat')c.coat=near(c.coat,smooth(c.u*.74,c.u*.74+.18,coatPass),2.8,dt);
      topCoat+=c.coat;
      if(s.stage==='open'||s.stage==='bag'||s.stage==='gift'){
        const start=.015+.54*c.u+.025*Math.abs(c.v);
        const r=smooth(start,start+.17,1-s.hinge);
        const change=(r-c.release)*(1-Math.exp(-dt*(5+4*c.toast)));
        c.release+=change;release+=change;
      }
      const w=clamp(fullness/.67);coverage+=w;if(c.u>.84)tail+=w;
      steam+=c.water*smooth(52,135,c.heat);wetHeat+=setting;
      doneness+=c.toast;beanTotal+=c.bean;
    }
    for(const w of wings){w.dry+=dt*(1-w.dry)*(.08+.19*kiln)*smooth(.001,.03,w.mass);if(w.broken)w.crack=near(w.crack,1,6,dt);else w.stress*=Math.exp(-1.8*dt)}
    s.coat=topCoat/N;s.bake=doneness/N;s.peel=release/(N*dt);s.fillReach=coverage/N;
    s.beanReach=cells.reduce((a,c)=>c.bean>.035?Math.max(a,c.x):a,-1.68);
    s.steam=near(s.steam,.035+steam/N*(.40+.65*s.hinge)+s.flow*.022,2.4,dt);
    s.sizzle=near(s.sizzle,clamp(wetHeat/dt*.34+s.flow*.04+pulse*.3),4,dt);
    soundDebt+=dt*s.sizzle*(4+s.coal*7);if(soundDebt>1){event('sizzle',.2+.5*s.sizzle);soundDebt-=1}
    peelDebt+=release/N*19;if(peelDebt>=1){event('peel',.3+.55*(1-s.hinge));peelDebt-=1}
    steamDebt+=dt*(2+15*s.steam);if(steamDebt>=1){
      steamDebt-=1;let pick=random()*(steam+.002*N),c=cells[N-1];
      for(const cell of cells){pick-=.002+cell.water*smooth(52,135,cell.heat);if(pick<=0){c=cell;break}}
      const src=s.hinge>.76?D.point(c.u,c.v<0?-1:1):c,roll=-Math.PI*(s.turn+s.rest),arc=Math.abs(Math.sin(roll));
      s.particles.push({x:src.x*Math.cos(roll),y:.027+src.x*Math.sin(roll)+1.82*arc,z:src.z-.66*(s.turn-s.rest)-.18*arc,vy:.23+random()*.23,dx:(random()-.5)*.08,age:0,life:1.5+random()*1.6,size:.045+random()*.09,seed:random()})
    }
    for(const p of s.particles){p.age+=dt;p.y+=p.vy*dt;p.x+=(p.dx+s.draft*p.age*.16)*dt;p.z+=s.draft*dt*.035;p.vy+=dt*.048}
    s.particles=s.particles.filter(p=>p.age<p.life);
    dustDebt+=dt*(1.4+Math.abs(s.draft)*.8);
    if(dustDebt>=1){dustDebt--;s.dust.push({x:-2.2+random()*.79,y:.96+random()*.87,z:.46+random()*.51,vx:.065+random()*.07,vy:-.09*random(),r:.005+random()*.009,age:0})}
    for(const p of s.dust){p.age+=dt;p.vx+=dt*(s.draft*.16-p.vx*.30);p.vy+=dt*(-.035-p.vy*.28);p.x+=dt*p.vx;p.y+=dt*p.vy;p.z+=dt*s.draft*.044}
    s.dust=s.dust.filter(p=>p.y>.11&&p.age<22);
    if(s.stage==='pour'&&coverage/N>.953&&tail/(4*NZ)>.92){stage('fill');s.toolX=s.aimX=-.85;s.toolZ=s.aimZ=.09;s.vx=0;s.vz=0}
    if(filling&&beanTotal>1.5&&((!s.held&&s.beanSupply>3.7)||beanTotal>20)){stage('coat');event('wood',.45)}
    if(s.stage==='coat'){spring('hinge','hingeSpeed',.15*smooth(.65,.98,s.coat),18,dt);if(s.coat>.982){stage('close');s.lever=s.hinge}}
    if(s.stage==='close'&&s.started){
      s.lever=clamp(s.lever+dt*(s.held?.25:.50));spring('hinge','hingeSpeed',s.lever,28,dt);
      if(s.hinge>.993){stage('flip');event('iron')}
    }
    if(s.stage==='flip'&&s.started){
      s.lever=clamp(s.lever+dt*(s.held?.19:.37));spring('turn','turnSpeed',s.lever,20,dt);
      if(s.turn>.994){stage('bake');event('iron',.62)}
    }
    if(s.stage==='bake'&&s.bake>.58&&s.age>2.4){stage('rest');event('baked',.65)}
    if(s.stage==='rest'){s.rest=near(s.rest,1,1.4,dt);if(s.rest>.993){stage('open');event('iron',.36)}}
    if(s.stage==='open'&&s.started){
      s.lever=clamp(s.lever+dt*(s.held?.082:.34));spring('hinge','hingeSpeed',1-s.lever,33,dt);
      if(s.hinge<.007&&cells[N-1].release>.94){stage('bag');event('wood',.65)}
    }
    if(s.stage==='bag'&&s.started){s.lever=clamp(s.lever+dt*(s.held?.27:.72));s.bag=near(s.bag,s.lever,3.5,dt);if(s.bag>.99){stage('gift');event('paper')}}
    s.split=near(s.split,s.splitAim,2.1,dt);
    if(s.stage==='gift'&&s.started){s.splitAim=1;s.serveWait+=dt;s.lever=clamp(s.lever+dt*(s.held?.24:.68));if(s.serveWait>1.4)s.give=near(s.give,s.lever,1.3,dt);if(s.give>.992){stage('return');event('paper',.4)}}
    if(s.stage==='return'&&s.age>2.85){
      const fresh=makeKitchen(rng+1).getState();const batch=s.batch+1,time=s.time;
      for(let i=0;i<N;i++)Object.assign(cells[i],fresh.cells[i],{iron:cells[i].iron});
      for(let i=0;i<wings.length;i++)Object.assign(wings[i],fresh.wings[i]);
      const ambient={draft:s.draft,air:s.air,swing:s.swing,swingSpeed:s.swingSpeed,coal:s.coal,particles:s.particles,dust:s.dust};
      Object.assign(s,fresh,ambient,{cells,wings,time,batch});shot=0;initialDrop=0;goalIndex=0;kiln=.25;peelDebt=0;streamTarget=0;steamDebt=0
    }
  }
  function step(dt){if(!Number.isFinite(dt)||dt<=0)return;let left=dt;while(left>1e-8){const d=Math.min(left,1/60);tick(d);left-=d}}
  return {getState:()=>s,step,begin,move,end,crack}
}
const api={makeKitchen,NX,NZ,MM_PER_UNIT:50};
if(typeof module!=='undefined')module.exports=api;else root.Kitchen=api;
})(globalThis);
