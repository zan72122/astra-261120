/* Seconds, mL and °C. h, jig and frontMm are in mm. A world unit is 100 mm.
   fog and gel are fractions, beads and caramel compartments are mL, iceMass is g. */
(function (root) {
  'use strict';
  const N=32, R=8, H=17, TAU=2*Math.PI;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const arr=(n,fn)=>Float64Array.from({length:n},(_,i)=>fn(i));
  const sx=i=>Math.cos(i/N*TAU), sz=i=>Math.sin(i/N*TAU);
  function createKitchen(options={}) {
    let seed=options.seed??4713;
    function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
    const s={stage:'pour',age:0,clock:0,idle:0,cycles:0,held:'',volume:options.volume??0,jugMl:182-(options.volume??0),
      tilt:0,tiltV:0,effort:0,sinceStroke:0,flux:0,drop:.017,fall:-1,first:false,portion:0,
      moldX:0,moldZ:0,vx:0,vz:0,dragX:0,dragZ:0,ax:0,az:0,
      lift:0,liftAim:0,liftV:0,custardLiftMm:0,custardVy:0,turn:0,turnAim:0,plateX:0,plateZ:0,leanX:0,leanZ:0,
      serve:0,push:0,pushV:0,cover:0,heat:0,cold:0,fogCleared:0,agitation:0,pop:false,
      potTemp:88,bubble:0,bubbleEnergy:0,air:0,airV:0,gust:.7,
      fluidPhase:0,events:[],presses:0,shake:0,shakeV:0,iceStir:0,waterPhase:0,
      h:arr(N*R,()=>0),v:arr(N*R,()=>0),
      temp:arr(N*R,i=>(options.temperature??21)+.14*sx(i)*Math.floor(i/N)/R),
      gel:arr(N*R,()=>options.firmness??0), jig:arr(N,()=>0),jigV:arr(N,()=>0),
      fog:arr(H*H,i=>.54+.17*Math.sin(i*.83)*Math.cos(i*.213)),
      beads:arr(H*H,i=>.003+.004*(1+Math.cos(i*.42))),
      film:arr(N,i=>.19+.043*Math.cos(i/N*TAU-.5)+.012*sz(i*3)),
      frontMm:arr(N,()=>0),iceMass:arr(11,i=>3.8+.45*Math.cos(i*3.56)),run:arr(N,()=>0),pool:arr(N,()=>0),trail:arr(N,()=>0),
      waves:[],steam:[],dust:[],ringCount:0,ringSerial:0,received:false};
    const lap=new Float64Array(N*R), tm=new Float64Array(N*R), flow=new Float64Array(N),wipeForce=new Float64Array(H*H),wipeEdge=new Int16Array(H*H);
    let prevX=0,prevZ=0,boilLimit=.72,wipeDose=0,springKick=0,acc=0,pendingDrop=0,dropImpactX=.69,dropImpactZ=-.33;
    for(let i=0;i<22;i++)s.steam.push({x:random()-.5,y:random()*1.35,z:random()-.5,vx:0,vz:0,life:random(),spin:random()*TAU});
    for(let i=0;i<32;i++)s.dust.push({x:(random()-.5)*7,y:random()*3.5,z:(random()-.5)*5,v:random()*.016+.005});
    function event(type,value=1){s.events.push({type,value});if(s.events.length>24)s.events.shift()}
    function stage(name){s.stage=name;s.age=0;s.held='';s.idle=0;s.effort=0;if(name==='wipe')wipeDose=0;event(name)}
    function kick(x,z,energy) {
      for(let r=0;r<R;r++)for(let a=0;a<N;a++){
        const dx=(r+.5)/R*sx(a)-x,dz=(r+.5)/R*sz(a)-z;
        s.v[r*N+a]+=energy*.48*Math.exp(-(dx*dx+dz*dz)*30);
      }
      s.waves.push({x,z,age:0,strength:clamp(energy/23,.16,1.2),radius:0});
      s.ringCount++;s.ringSerial++;event('drop',energy/30);
    }
    function down(tool,u=0,v=0){
      s.idle=0;
      const active={pour:'jug',slide:'mold',wipe:'lid',steam:'lid',chill:'ice',plate:'plate',turn:'grip',lift:'mold',serve:'dish'};
      if(tool!==active[s.stage])return false;
      s.held=tool;s.presses++;s.sinceStroke=0;
      if(tool==='jug'){
        if(s.fall<0){s.fall=0;pendingDrop=.48+s.drop*7;s.drop=.01}
        if(s.first)s.effort=Math.max(s.effort,.40);
        s.first=true;
      }
      if(tool==='lid')wipe(u,v,.075);
      if(tool==='mold'&&s.stage==='slide'){s.dragZ=Math.max(-1.3,s.dragZ-.045);s.dragX+=(-.2-s.dragX)*.05}
      if(tool==='ice')s.iceStir+=.32;
      if(s.stage==='plate'){s.cover=.0001;stage('cover')}
      if(s.stage==='turn')s.turnAim=clamp(s.turnAim+.075);
      if(s.stage==='lift')s.liftAim=clamp(s.liftAim+.045);
      if(s.stage==='serve')springKick+=.8;
      return true;
    }
    function wipe(u,v,power){
      // Normalized coordinates on the lid. Displaced moisture condenses at the edge of the finger.
      for(let y=0;y<H;y++)for(let x=0;x<H;x++){
        const dx=(x/(H-1)*2-1)-u,dy=(y/(H-1)*2-1)-v,d=Math.hypot(dx,dy),i=y*H+x;
        if(d<.37){wipeForce[i]=Math.min(5.1,wipeForce[i]+power*(1-d/.37)*23);
          const ex=clamp(Math.round(x+dx/(d||1)*2),0,H-1),ey=clamp(Math.round(y+dy/(d||1)*2),0,H-1);
          wipeEdge[i]=ey*H+ex;}
      }
    }
    function move(dx,dy,u=0,v=0){
      if(!s.held)return;
      s.idle=0;s.sinceStroke=0;
      if(s.held==='jug')s.effort=clamp(s.effort+Math.hypot(dx,dy)*4.3,0,1.05);
      if(s.stage==='slide'){s.dragX=clamp(s.dragX+dx,-.77,.82);s.dragZ=clamp(s.dragZ+dy,-1.68,.58)}
      if(s.held==='lid')wipe(u,v,clamp(Math.hypot(dx,dy)*4,.045,.32));
      if(s.held==='ice')s.iceStir=clamp(s.iceStir+Math.hypot(dx,dy)*.8,0,1.4);
      if(s.stage==='turn')s.turnAim=clamp(s.turnAim+Math.hypot(dx,dy)*.50);
      if(s.stage==='lift')s.liftAim=clamp(s.liftAim-dy*.68);
      if(s.stage==='serve'){s.leanX=clamp(s.leanX+dx*.50,-.25,.25);s.leanZ=clamp(s.leanZ+dy*.40,-.18,.18);
        s.serve=clamp(s.serve-dy*.60,0,1);springKick+=dx*3+dy*1.2;}
    }
    function up(){s.held='';s.effort=0}
    function updateAir(dt){
      s.gust-=dt;if(s.gust<0){s.gust=.6+random()*2.4;s.airV+=(random()-.45)*.12}
      s.airV+=(-s.air*1.3-s.airV*.63)*dt;s.air+=s.airV*dt;
      s.potTemp+=(98-s.potTemp)*.043*dt;
      s.bubble+=dt*(.56+(s.potTemp-88)*.068);
      s.bubbleEnergy*=Math.exp(-3.3*dt);
      if(s.bubble>boilLimit){s.bubble-=boilLimit;boilLimit=.37+random()*.82;s.bubbleEnergy+=.38+random()*.5;event('bubble',s.bubbleEnergy);if(s.stage==='steam'||s.stage==='wipe')s.shakeV+=(random()-.43)*.28*s.bubbleEnergy}
      for(const p of s.steam){p.life+=dt*(.26+.055*s.bubbleEnergy);p.vx+=(s.air+.025*Math.sin(p.spin+p.y*3)-p.vx)*dt;
        p.x+=p.vx*dt;p.y+=dt*(.21+.12*p.life);p.z+=Math.cos(p.spin+p.y)*dt*.017;
        if(p.life>=1){p.life=0;p.y=.025;p.x=(random()-.5)*.68;p.z=(random()-.5)*.54;p.spin=random()*TAU;p.vx=s.air*.3}}
      for(const p of s.dust){p.x+=dt*(s.air*.5+p.v);p.y-=p.v*dt;if(p.x>3.5)p.x=-3.5;if(p.y<.05)p.y=3.5}
    }
    function updatePour(dt){
      const previousVolume=s.volume;
      s.sinceStroke+=dt;s.effort*=Math.exp(-(s.sinceStroke>.19?13:1.10)*dt);
      s.tiltV+=((s.effort*.85-s.tilt)*26-s.tiltV*8.2)*dt;s.tilt+=s.tiltV*dt;
      const targetFlow=s.stage==='pour'?Math.max(0,s.tilt-.048)*49*(1-.26*s.volume/140)*clamp((138-s.volume)/13):0;
      s.flux+=(targetFlow-s.flux)*(1-Math.exp(-dt*18));if(s.flux<.008&&targetFlow===0)s.flux=0;
      s.drop+=dt*(.046-s.drop)*.88;
      if(s.fall>=0){s.fall+=dt*3.8;if(s.fall>=1){
        s.volume=Math.min(139,s.volume+pendingDrop);kick(dropImpactX,dropImpactZ,18);s.fall=-1}}
      s.volume=Math.min(139,s.volume+s.flux*dt);
      s.portion+=s.flux*dt;
      if(s.portion>1.8){s.portion-=1.8;dropImpactX=clamp((1.19-.748*Math.cos(s.tilt)-1.308*Math.sin(s.tilt))/.55,-.8,.72);dropImpactZ=-.33+s.air*.12;kick(dropImpactX,dropImpactZ,7+s.flux*.32)}
      for(const w of s.waves){w.age+=dt;w.radius+=dt*(.69+.002*s.volume);w.strength*=Math.exp(-1.9*dt)}
      while(s.waves.length&&s.waves[0].age>2.0)s.waves.shift();
      s.jugMl-=s.volume-previousVolume;
      if(s.stage==='receive'&&s.age>1.4)s.jugMl=Math.min(182,s.jugMl+dt*39);
      if(s.stage==='pour'&&s.volume>=136)stage('slide');
    }
    function updateMaterial(dt){
      s.vx+=((s.dragX-s.moldX)*37-8*s.vx)*dt;s.vz+=((s.dragZ-s.moldZ)*37-8*s.vz)*dt;
      s.moldX+=s.vx*dt;s.moldZ+=s.vz*dt;s.ax=(s.vx-prevX)/dt;s.az=(s.vz-prevZ)/dt;prevX=s.vx;prevZ=s.vz;
      let cooking=['wipe','steam','jiggle'].includes(s.stage),cooling=s.stage==='chill'&&s.age>2;
      let gelSum=0,tempSum=0;
      for(let r=0;r<R;r++)for(let a=0;a<N;a++){
        const i=r*N+a,left=r*N+(a+N-1)%N,right=r*N+(a+1)%N,inner=Math.max(0,r-1)*N+a,outer=Math.min(R-1,r+1)*N+a;
        const rr=(r+.5)/R,q=s.temp[i],g=s.gel[i],depth=.22+s.volume/140;
        const edge=.052+.117*rr**3*(1+.083*sx(a));
        const bath=cooking?s.potTemp:cooling?4.5:23;
        tm[i]=(s.temp[inner]+s.temp[outer]+s.temp[left]+s.temp[right]-4*q)*.57+
          (bath-q)*(cooking?edge/(.61+.39*depth):cooling?(edge+.060+s.iceStir*.06):.0017);
        lap[i]=(s.h[left]+s.h[right]-2*s.h[i])*40+(s.h[inner]+s.h[outer]-2*s.h[i])*119;
        lap[i]*=depth*(1-g*.79);
        lap[i]-=s.v[i]*(1.7+g*7.8)+s.h[i]*8;
        if(cooking)lap[i]+=(s.shakeV*12+s.bubbleEnergy*(.23+.21*sz(a*3)))*rr*rr*(1-g);
        lap[i]-=(s.ax*sx(a)+s.az*sz(a))*rr*(1-g)*7.9;
        gelSum+=g;tempSum+=q;
      }
      for(let i=0;i<N*R;i++){s.temp[i]+=tm[i]*dt;s.v[i]+=lap[i]*dt;s.h[i]+=s.v[i]*dt;
        s.gel[i]+=dt*Math.max(0,s.temp[i]-63)*.0066*(1-s.gel[i]);}
      s.heat=gelSum/(N*R);s.cold=tempSum/(N*R);
      for(let a=0;a<N;a++){
        let i=(R-1)*N+a,neighbours=s.jig[(a+1)%N]+s.jig[(a+N-1)%N]-2*s.jig[a];
        s.jigV[a]+=(neighbours*22-s.jig[a]*(30+26*s.gel[i])-s.jigV[a]*(2.4+s.gel[i])+
          s.shakeV*sx(a)*s.gel[i]*48)*dt+springKick*sx(a)*s.gel[i]*4.2;
      }
      for(let a=0;a<N;a++)s.jig[a]+=s.jigV[a]*dt;
      springKick=0;
      s.shakeV+=(-s.shake*32-2.2*s.shakeV)*dt;s.shake+=s.shakeV*dt;
    }
    function updateGlass(dt){
      let clear=0,n=0;
      for(let i=0;i<H*H;i++){
        let x=(i%H-8)/8,y=(Math.floor(i/H)-8)/8;
        const brushed=Math.min(s.fog[i],dt*wipeForce[i]*s.fog[i]);s.fog[i]-=brushed;
        wipeDose+=brushed/(H*H);s.beads[wipeEdge[i]]+=brushed*.36;wipeForce[i]*=Math.exp(-4.0*dt);
        const source=(.002+.005*s.bubbleEnergy)*(1+.4*x+.25*y);
        s.fog[i]+=dt*((.87-s.fog[i])*source-.0006*(1+y)*s.fog[i]);
        const drain=Math.max(0,s.beads[i]-.078)*dt*.21;
        s.beads[i]-=drain;if(i+H<H*H)s.beads[i+H]+=drain*.94;
        if(x*x+y*y<.92){clear+=clamp((.57-s.fog[i])/.57);n++}
      }s.fogCleared=clear/n;
    }
    function updateCaramel(dt){
      if(!['lift','serve','receive'].includes(s.stage)||s.lift<.018)return;
      s.plateX+=(s.leanX-s.plateX)*dt*4.2;s.plateZ+=(s.leanZ-s.plateZ)*dt*4.2;
      if(!s.held){s.leanX*=Math.exp(-.76*dt);s.leanZ*=Math.exp(-.76*dt)}
      flow.fill(0);
      for(let a=0;a<N;a++){
        const b=(a+1)%N,angle=(a+.5)/N*TAU;
        const visc=1.7+Math.max(0,38-s.temp[a+(R-1)*N])*.032;
        const downhill=(-s.plateX*Math.sin(angle)+s.plateZ*Math.cos(angle));
        const amount=clamp(((s.pool[a]-s.pool[b])*1.9+downhill*(.2+s.pool[a]+s.pool[b])*2.1)*dt/visc,-s.pool[b]*.4,s.pool[a]*.4);
        flow[a]-=amount;flow[b]+=amount;
        const wet=s.film[a], localSlope=.10+.95*(.5+.5*Math.cos(a/N*TAU-1.15))**5+.06*(1+sz(a*3));
        const available=Math.min(1,s.lift*5);
        const released=Math.min(wet,(.016+.065*localSlope)*wet*available*dt/visc);
        const escape=released*.28*(1-clamp(s.frontMm[a]/42));
        s.film[a]-=released;s.run[a]+=released-escape;s.pool[a]+=escape;
        s.frontMm[a]=Math.min(58,s.frontMm[a]+(3+wet*151+s.run[a]*155)*localSlope*available*dt/visc);
        const drip=Math.max(0,s.run[a]-.007)*.75*clamp((s.frontMm[a]-49)/9)*dt;
        s.run[a]-=drip;s.pool[a]+=drip;
        const mark=Math.min(s.pool[a],Math.max(0,s.pool[a]-s.trail[a]*.48)*.041*dt);
        s.pool[a]-=mark;s.trail[a]+=mark;
      }
      for(let a=0;a<N;a++)s.pool[a]+=flow[a];
    }
    function advance(dt){
      s.clock+=dt;s.age+=dt;s.idle+=dt;
      updateAir(dt);updatePour(dt);updateMaterial(dt);updateGlass(dt);updateCaramel(dt);
      if(s.stage==='chill'&&s.age>2){for(let i=0;i<s.iceMass.length;i++){
        let a=Math.floor(i/11*N);s.iceMass[i]=Math.max(.72,s.iceMass[i]-Math.max(0,s.temp[(R-1)*N+a]-5)*(.00059+.00022*sx(a-1)+.00027*s.iceStir)*dt)}}
      s.pushV+=((s.serve-s.push)*30-s.pushV*9)*dt;s.push+=s.pushV*dt;
      s.iceStir*=Math.exp(-.89*dt);s.waterPhase+=dt*(.14+s.iceStir);
      if(s.stage==='slide'&&Math.hypot(s.moldX+.20,s.moldZ+1.30)<.39){stage('load')}
      else if(s.stage==='load'&&s.age>4.3){stage('wipe')}
      else if(s.stage==='wipe'&&((s.fogCleared>.15&&wipeDose>.012)||wipeDose>.115)){stage('steam')}
      else if(s.stage==='steam'&&s.heat>.86){stage('jiggle');s.shakeV=1.65}
      else if(s.stage==='jiggle'&&s.age>3.8){stage('chill')}
      else if(s.stage==='chill'&&s.age>4&&s.cold<27){stage('drain')}
      else if(s.stage==='drain'&&s.age>=1.6){stage('plate')}
      else if(s.stage==='cover'){s.cover=Math.min(1,s.cover+dt*.54);if(s.cover>=1)stage('turn')}
      else if(s.stage==='turn'){s.turn+=(s.turnAim-s.turn)*Math.min(1,dt*6);if(s.turn>.985){s.turn=1;s.custardLiftMm=2.7;stage('lift')}}
      else if(s.stage==='lift'){
        s.liftV+=((s.liftAim-s.lift)*34-s.liftV*9)*dt;s.lift+=s.liftV*dt;
        const shellMm=2.7+99.6*s.lift;
        if(!s.pop){
          s.custardLiftMm=shellMm;
          const adhesion=17+5.3*s.heat+.055*Math.max(0,s.cold-20);
          if(shellMm>adhesion){s.pop=true;event('pop')}
        }else if(s.custardLiftMm>0){
          s.custardVy+=(-370-13*s.custardVy-75*s.custardLiftMm)*dt;
          s.custardLiftMm=Math.max(0,s.custardLiftMm+s.custardVy*dt);
          if(s.custardLiftMm===0){springKick=Math.min(5.3,-s.custardVy*.065);s.custardVy=0}
        }
        if(s.lift>.96)stage('serve');
      }
      else if(s.stage==='serve'&&s.push>.90){stage('receive');s.received=true}
      else if(s.stage==='receive'&&s.received&&s.age>=1.69){event('clink');s.received=false}
      else if(s.stage==='receive'&&s.age>8.5){
        const next=createKitchen({seed:seed+11}).state;
        const {clock,cycles,steam,dust,air,airV,potTemp,waterPhase,bubble,beads,fog}=s;
        Object.assign(s,next,{clock,cycles:cycles+1,steam,dust,air,airV,potTemp,waterPhase,bubble,beads,fog});
        wipeDose=0;wipeForce.fill(0);prevX=prevZ=0;updateGlass(0);event('return');
      }
    }
    function step(dt){if(!Number.isFinite(dt)||dt<=0)return;acc+=dt;while(acc>=1/120-1e-10){advance(1/120);acc-=1/120}}
    function getState(){return JSON.parse(JSON.stringify(s,(_,v)=>ArrayBuffer.isView(v)?Array.from(v):v))}
    s.heat=mean(s.gel);s.cold=mean(s.temp);updateGlass(0);
    return {state:s,step,getState,down,move,up};
  }
  const api={createKitchen,N,R,H,mean,clamp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kissaten=api;
})(typeof window==='undefined'?globalThis:window);
