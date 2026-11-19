/* Lengths in models use one unit per 32 mm. Simulation advances at 120 Hz. */
(function (root) {
  'use strict';
  const clamp = (x, lo=0, hi=1) => Math.max(lo, Math.min(hi, x));
  const mean = a => a.reduce((s,v)=>s+v,0)/a.length;
  const N=17, MM=32, LEAF_N=65;
  function spring(p,v,target,k,d,dt) {
    v += ((target-p)*k-v*d)*dt;
    return [p+v*dt,v];
  }
  function create(options={}) {
    let seed=options.seed||97513;
    function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
    const mass=options.doughMass||19, water=options.water??0.71;
    let stage='thread',age=0,elapsed=0,cycle=0,active='',sx=0,sy=0,dx=0,dy=0;
    let idle=0,push=0,pushV=0,latch=0,lift=0,liftV=0,stroke=0,clarity=0;
    let paddlePress=0,pressSpeed=0;
    let paddleX=-.12,paddleY=.13,pxGoal=paddleX,pyGoal=paddleY,paddleSpeed=0;
    let dip=0,dipV=0,tilt=0,tiltV=0,draw=0,drawV=0,dropX=-1.04,dropV=0,dropMass=0;
    let flightHeight=0,flightX=0,lineLeft=0,lineRight=0,hover=0,hoverV=0;
    let dropY=0,fallV=0,falling=false,landed=false,spot=0,line=0,dripTravel=0;
    let handToPot=0,handToCup=0,readyTrail=false,trailPeak=0,removeStop=false,offer=false;
    let overLeaf=0,overV=0,handX=0,handZ=0,handY=0,handVX=0,handVZ=0,handVY=0;
    let support=0,tea=0,delivery=0,pan=0,panV=0,place=0,rest=0,serving=0;
    let air=.03,breeze=.04,gust=.08,draftIn=1.1,steam=0,scrape=0,heatWork=0,hold=0;
    let events=[],spare=0,drawOnImpact=0,ambient,balls,cells;
    const leafCells=Array.from({length:LEAF_N},(_,i)=>({x:3.68*(i/(LEAF_N-1)-.5),mass:0,skin:0,vein:.68+.27*Math.cos(i*.83)}));
    const leafFlux=new Float64Array(LEAF_N-1);
    function resetFood(){
      balls=Array.from({length:3},(_,i)=>({mass:mass*(1+[.025,-.036,.01][i]),moisture:water+[.015,-.022,.001][i],dent:0,dentV:0,coat:0,valley:0,roll:0,rollV:0,align:[-.11,.09,-.07][i],alignV:0}));
      cells=Array.from({length:N*N},(_,i)=>{
        const x=(i%N-8)/8,y=(Math.floor(i/N)-8)/8,r=x*x+y*y;
        return {x,y,wet:r<=1.11,temp:(options.temperature??33)+2.6*Math.exp(-3*((x+.18)**2+(y-.19)**2)),water:water+.015*x,gel:options.gel??.045,groove:0,ripple:0,velocity:0,source:Math.exp(-1.4*((x+.24)**2+(y-.18)**2))};
      });
    }
    function initAir(){
      ambient=Array.from({length:45},(_,i)=>({x:random()*2-1,y:random()*1.8,z:random()-.5,vx:0,vy:.1+random()*.12,life:random(),kind:i<22?'steam':i<32?'tea':'dust',size:.55+random()*.65}));
    }
    resetFood();initAir();
    const wetCells=cells.filter(c=>c.wet);
    clarity=mean(wetCells.map(c=>c.gel));
    steam=mean(wetCells.map(c=>Math.max(0,c.temp-22)*c.source))*.021;
    function change(s){stage=s;age=0;active='';hold=0;events.push({kind:'stage',stage:s});}
    function allowed(tool){
      return ({thread:['grip'],stir:['paddle'],dip:['grip'],drip:['grip'],place:['grip','leaf'],rest:['support'],serve:['tray','cup'],refill:[]})[stage].includes(tool);
    }
    function input(type,tool,x=0,y=0){
      if(type==='down'){
        if(!allowed(tool))return false;
        active=tool;idle=0;hold=0;sx=x;sy=y;dx=dy=0;
        if(tool==='paddle')paddleGoal(x,y);
        if(tool==='leaf')rest=1;
        if(tool==='support')removeStop=true;
        if(tool==='cup'||tool==='tray')offer=true;
        return true;
      }
      if(type==='up'){active='';hold=0;return true;}
      if(type==='move' && active){
        idle=0;dx=x-sx;dy=y-sy;
        if(active==='paddle')paddleGoal(x,y);
        return true;
      }
      return false;
    }
    function paddleGoal(x,y){const r=Math.max(1,Math.hypot(x,y)/.88);pxGoal=x/r;pyGoal=y/r;}
    function dough(dt){
      if(stage==='thread'){
        const target=active==='grip'?clamp(latch+.105+hold*.205+dx*1.05-dy*.66,0,1.04):latch;
        [push,pushV]=spring(push,pushV,target,65,14,dt);push=clamp(push,0,1.04);
        for(let i=0;i<3;i++){
          const b=balls[i],front=push*3.52-i*1.06;
          const force= front>0 && front<.82?Math.sin(Math.PI*front/.82)*5.8:0;
          const stiffness=(1.15-b.moisture*.52)*19/b.mass;
          [b.dent,b.dentV]=spring(b.dent,b.dentV,force/stiffness,62*stiffness,10,dt);
          if(front>.83 && latch < (i*1.06+.67)/3.52){latch=(i*1.06+.67)/3.52;events.push({kind:'pierce',strength:b.moisture});}
        }
        if(push>=.982)change('stir');
      }
      for(const b of balls){
        [b.align,b.alignV]=spring(b.align,b.alignV,0,2.8,2.4,dt);
        if(stage!=='thread')[b.dent,b.dentV]=spring(b.dent,b.dentV,0,49,12,dt);
      }
      [lift,liftV]=spring(lift,liftV,stage==='thread'||stage==='refill'?0:1,6.5,4.8,dt);
    }
    function kettle(dt){
      const heating=stage==='stir',warm=heating?94:stage==='thread'?42:stage==='refill'?30:56;
      const prevX=paddleX,prevY=paddleY;
      const hit=active==='paddle';
      [paddlePress,pressSpeed]=spring(paddlePress,pressSpeed,hit?1:0,23,8,dt);
      // A stationary hand settles the paddle along the bottom. Sweeps follow the finger.
      paddleX+=(pxGoal-paddleX)*Math.min(1,dt*8);
      paddleY+=(pyGoal-paddleY)*Math.min(1,dt*8);
      paddleSpeed=Math.hypot(paddleX-prevX,paddleY-prevY)/dt;
      if(hit){stroke+=paddleSpeed*dt;heatWork+=dt;}
      let gelatin=0,hot=0,count=0,deepest=0;
      for(let i=0;i<cells.length;i++){
        const c=cells[i];if(!c.wet)continue;
        const adj=cells[i%N===0?i:i-1],up=cells[i<N?i:i-N];
        c.temp+=dt*((warm-c.temp)*(.019+.052*c.source)+(adj.temp+up.temp-2*c.temp)*.10);
        if(stage==='refill'){
          const exchange=(.135+.048*c.source)*dt;
          c.temp+=(32+c.x*1.3-c.temp)*exchange;
          c.gel+=(.035-c.gel)*exchange;c.water+=(water+.015*c.x-c.water)*exchange;
        }
        c.water=clamp(c.water-dt*Math.max(0,c.temp-48)*.000014*(.6+c.source),.38,.9);
        c.gel+=dt*(1-c.gel)*Math.max(0,c.temp-56)*(.0023+.006*(1-c.water));
        const dist=((c.x-paddleX)/(.15+.12*c.gel))**2+((c.y-paddleY)/(.16+.10*c.gel))**2;
        const contact=hit?Math.exp(-dist)*Math.min(5,paddleSpeed+.085):0;
        c.groove+=dt*((contact/(1+.82*contact))*6.5*(1-c.groove)-c.groove/(.23+3.65*c.gel*c.gel));
        c.temp+=dt*contact*.15*(adj.temp+up.temp-2*c.temp);
        deepest=Math.max(deepest,c.groove);
        c.velocity+=dt*(contact*.6-c.ripple*20-c.velocity*3.5);
        c.ripple+=c.velocity*dt;
        gelatin+=c.gel;hot+=Math.max(0,c.temp-22)*c.source;count++;
      }
      clarity=gelatin/count;steam=hot/count*.021;
      scrape+=(Math.min(1,paddleSpeed*.7+(hit?.04:0))*(.4+.60*clarity)-scrape)*Math.min(1,dt*11);
      if(heating && clarity>.76 && hit && (deepest>.33 || hold>2.7))readyTrail=true;
      trailPeak=deepest;
      if(heating && readyTrail && !hit && deepest<.175) change('dip');
      [pan,panV]=spring(pan,panV,(stage==='dip' && handToPot>.91)||['drip','place','rest','serve'].includes(stage)?1:0,3.4,3.5,dt);
    }
    function deposit(x,volume,radius){
      const center=(x/3.68+.5)*(LEAF_N-1),width=radius*(LEAF_N-1)/3.68;
      const a=Math.max(0,Math.floor(center-3*width)),b=Math.min(LEAF_N-1,Math.ceil(center+3*width));
      let total=0;
      for(let i=a;i<=b;i++)total+=Math.exp(-.5*((i-center)/width)**2);
      for(let i=a;i<=b;i++)leafCells[i].mass+=volume*Math.exp(-.5*((i-center)/width)**2)/total;
    }
    function wetLeaf(dt){
      if(!landed)return;
      for(let i=0;i<leafFlux.length;i++){
        const a=leafCells[i],b=leafCells[i+1],difference=a.mass-b.mass;
        const yieldMass=.005+.020*(a.skin+b.skin);
        leafFlux[i]=dt*Math.sign(difference)*Math.max(0,Math.abs(difference)-yieldMass)*(.9-.48*clarity)*a.vein;
      }
      for(let i=0;i<leafCells.length;i++){
        const c=leafCells[i];c.mass+=(i?leafFlux[i-1]:0)-(i<leafFlux.length?leafFlux[i]:0);
        if(c.mass>.0002)c.skin+=dt*(1-c.skin)*(.055+.02*c.vein)/(1+5*c.mass);
      }
    }
    function glaze(dt){
      const held=active==='grip';
      const immersed=stage==='dip' && held?clamp(.54+hold*.22+dy*.62,0,1)*clamp((pan-.77)/.20):0;
      [dip,dipV]=spring(dip,dipV,immersed,16,7.4,dt);
      const angle=['drip','place'].includes(stage) && held?clamp(.19+dy*.91+dx*.16+hold*.036,-.45,.57):stage==='drip'?.072:0;
      [tilt,tiltV]=spring(tilt,tiltV,angle,18,6.6,dt);
      [draw,drawV]=spring(draw,drawV,held && ['place','drip'].includes(stage)?clamp(dx*1.8,-1,1):draw*.998,25,8,dt);
      for(let i=0;i<3;i++){
        const b=balls[i],c=cells[8*N+3+i*5],depth=clamp((dip-.22-(i-1)*.045)*1.8);
        const cap=(.5+2.9*c.gel)*(b.mass/19)**.67;
        b.coat+=dt*(depth*(cap-b.coat)*1.32-b.coat*(.003+.09*(1-c.gel))*(1-depth));
        if(!landed && ['drip','place'].includes(stage)){
          const nearby=Math.exp(-8*(dropX-(i-1)*1.06)**2);
          const flow=Math.min(b.coat,dt*(.027+.23*nearby)*Math.max(0,Math.sin(tilt))*(.35+b.coat));
          b.coat-=flow;dropMass+=flow;
          const valley=Math.exp(-14*(dropX-((i-1)*1.06+.49))**2);
          const retained=Math.min(b.coat,dt*.085*valley*b.coat);
          b.valley+=retained;b.coat-=retained;
        }
      }
      if(stage==='dip' && !held && dip<.28 && mean(balls.map(b=>b.coat))>.68){
        change('drip');dropX=-1.08;dropMass=.16;balls[0].coat-=.16;
      }
      if(stage==='drip' && !falling){
        const resistance=1.9+clarity*2.6+2.3*Math.exp(-22*(Math.abs(dropX)-.53)**2);
        const prev=dropX;
        dropV+=dt*(Math.sin(tilt)*8.3-dropV*resistance);
        dropX=clamp(dropX+dropV*dt,-1.24,1.34);dripTravel+=Math.abs(prev-dropX);
        if(dropX>=1.31 && dropMass>.24){
          falling=true;fallV=.1;const y=beadBottom(dropX);
          flightHeight=1.83-dropX*Math.sin(tilt)+y*Math.cos(tilt)-.245;
          flightX=clamp(-.55+draw*.73+dropX*Math.cos(tilt)+y*Math.sin(tilt),-1.70,1.70);
        }
      }
      if(falling && !landed){
        fallV+=dt*6.8;dropY+=dt*fallV;
        if(dropY>=flightHeight){
          dropY=flightHeight;landed=true;lineLeft=lineRight=flightX;drawOnImpact=draw;
          events.push({kind:'drop',strength:dropMass});change('place');
        }
      }
      const close=stage==='place'&&held?clamp(.72+dy*.63):0;
      [hover,hoverV]=spring(hover,hoverV,close,30,9.8,dt);
      if(landed){const settled=dropMass*(1-Math.exp(-dt*16));if(settled>0){deposit(flightX,settled,.146);spot+=settled;dropMass-=settled;}}
      if(stage==='place'){
        if(held && hover>.3){
          const b=balls[2],d=Math.min(b.coat,Math.abs(drawV)*dt*.31);
          b.coat-=d;spot+=d;
          const tip=clamp(flightX+(draw-drawOnImpact)*.73,-1.58,1.58);
          deposit(tip,d,.040+.018/(1+Math.abs(drawV)));
          lineLeft=Math.min(tip,lineLeft);lineRight=Math.max(tip,lineRight);line=lineRight-lineLeft;
        }
        if(active==='leaf'||(held && (dy>.36 || hold>3.6)))rest=1;
        if(rest){[place,serving]=spring(place,serving,1,8,5.2,dt);if(place>.985)change('rest');}
      }
      if(stage==='rest'){
        if(removeStop)support=clamp(support+dt*(1.3+Math.max(0,dx)));
        if(support>.99)change('serve');
      }
      if(stage==='serve'){
        if(handToCup>.9)tea+=dt*(1-tea)*1.5;
        if(offer && tea>.95)delivery=clamp(delivery+dt*(.65+Math.max(0,dx)));
        if(delivery>.99){change('refill');events.push({kind:'ceramic',strength:.4});}
      }
      if(stage==='refill'){
        for(let i=0;i<3;i++){
          const b=balls[i];
          if(age>1.05+i*.52)[b.roll,b.rollV]=spring(b.roll,b.rollV,1,4.7,3.25,dt);
        }
        if(age>5.8){
          cycle++;for(const c of leafCells){c.mass=0;c.skin=0;}const kettleCells=cells;resetFood();cells=kettleCells;for(const b of balls)b.align=0;change('thread');
          push=pushV=latch=lift=liftV=stroke=heatWork=0;
          dip=dipV=tilt=tiltV=draw=drawV=spot=line=support=tea=delivery=place=rest=serving=0;
          dropX=-1.04;dropV=dropMass=dropY=fallV=dripTravel=0;falling=landed=false;readyTrail=removeStop=offer=false;hover=hoverV=lineLeft=lineRight=flightHeight=flightX=0;
          pxGoal=paddleX=-.12;pyGoal=paddleY=.13;idle=0;
        }
      }
    }
    function beadBottom(x){const center=Math.max(-1,Math.min(1,Math.round(x/1.06)))*1.06;return -.535*Math.sqrt(Math.max(.07,1-((x-center)/.562)**2));}
    function gestures(dt){
      const atLeaf=['drip','place','rest','serve'].includes(stage);
      [overLeaf,overV]=spring(overLeaf,overV,atLeaf?1:0,5.2,4.6,dt);
      // The same arm follows its work, with inertia through changes of task.
      handToPot+=dt*((stage==='dip'||(stage==='stir'&&readyTrail)?1:0)-handToPot)*2.9;
      handToCup+=dt*((stage==='serve'?1:0)-handToCup)*2.35;
      let hx=0,hy=0,hz=0;
      if(stage==='thread'){hx=-.36*Math.exp(-age*.92);hz=.11*Math.exp(-age);hy=.17*Math.exp(-age);}
      if(stage==='stir'){hx=-.20;hy=.21;hz=-.12;}
      if(stage==='dip'){hx=-2.26+pan*1.36;hz=-1.50+pan*.49;hy=.23;}
      if(atLeaf){hx=.02;hy=.03;hz=.05;}
      if(stage==='serve'){hx=1.25+delivery*4.2;hz=-.89+.6*tea;hy=.6;}
      [handX,handVX]=spring(handX,handVX,hx,8,5.3,dt);
      [handY,handVY]=spring(handY,handVY,hy,8,5.3,dt);
      [handZ,handVZ]=spring(handZ,handVZ,hz,8,5.3,dt);
    }
    function atmosphere(dt){
      draftIn-=dt;
      if(draftIn<0){gust=(random()-.4)*.42;draftIn=1.2+random()*4.2;}
      breeze+=(gust-breeze)*dt*.65;air+=(breeze-air)*dt*.68;
      for(const p of ambient){
        const dust=p.kind==='dust',power=p.kind==='tea'?.29:steam;
        p.vx+=(air*(dust?.55:1)+p.z*.038-p.vx)*dt*.8;
        p.vy+=((dust?-.047:.12+.16*power)-p.vy)*dt*.7;
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.life+=dt*(dust?.074:.153+.027*power);
        if(p.life>=1){p.life-=1;p.x=(random()-.5)*(dust?13:.82);p.z=(random()-.5)*(dust?7:.72);p.y=dust?2+random()*3:0;p.vy=dust?-.01:.07;}
      }
    }
    function tick(dt){age+=dt;elapsed+=dt;idle=active?0:idle+dt;hold=active?hold+dt:0;dough(dt);kettle(dt);glaze(dt);wetLeaf(dt);gestures(dt);atmosphere(dt);}
    function step(dt){if(!Number.isFinite(dt)||dt<=0)return;spare+=dt;while(spare>=1/120-1e-10){tick(1/120);spare-=1/120;}}
    function state(){return {stage,age,elapsed,cycle,active,idle,push,lift,pan,paddleX,paddleY,paddleSpeed,paddlePress,stroke,clarity,scrape,steam,air,dip,tilt,draw,dropX,dropY,dropMass,dripTravel,falling,landed,spot,line,overLeaf,handX,handY,handZ,drawOnImpact,place,support,tea,delivery,beadY:beadBottom(dropX),flightX,flightHeight,lineLeft,lineRight,hover,handToPot,handToCup,readyTrail,trailPeak,balls,cells,leafCells,ambient};}
    return {step,input,allowed,read:state,getState:()=>JSON.parse(JSON.stringify(state())),events:()=>events.splice(0),N,MM};
  }
  const api={create,N,MM};if(typeof module!=='undefined' && module.exports)module.exports=api;else root.Sweets=api;
})(typeof window==='undefined'?globalThis:window);
