/* Local coordinates are in 4 cm units. Thermal state uses °C, mass uses grams. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SugarTable = factory();
})(globalThis, function () {
  'use strict';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const dist = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
  const approach = (a,b,k,dt) => a+(b-a)*(-Math.expm1(-k*dt));
  const start = {x:-.93,z:1.42}, rest = {x:3.15,z:-.57};
  const tip = {x:1.02,z:-1.34};
  const phaseNames = ['stem','lace','skewer','join','peel','shadow','serve','carry'];
  class Table {
    constructor(options={}) {
      this.options = options;
      this.seed = 53971; this.time = 0; this.cycle = 0;
      this.air = {wind:.12, gust:.18, clock:0, next:1, bend:0, v:0};
      this.steam = Array.from({length:16},(_,i)=>({x:0,y:i*.07,z:0,v:.21+i*.005,life:.4+i*.035,age:i*.16,spin:i*2.4}));
      this.motes=Array.from({length:22},(_,i)=>({x:(i*1.733%10)-5,y:.55+(i*.719%3.3),z:-3.5+(i*.831%6),vx:0,vy:0,seed:i*.87}));
      this.stone = Array.from({length:48},(_,i)=>({temperature:23.9+.07*(i%8)+.12*Math.floor(i/8),oil:.52+.18*Math.sin(i*3.1),capacity:8+(i%5)}));
      this.reset();
    }
    random() { this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0; return this.seed/4294967296; }
    reset() {
      this.phase='stem'; this.idle=0; this.held=''; this.demo=0; this.age=0; this.nodes=[]; this.edges=[]; this.joints=[]; this.events=[]; this.last=-1; this.stroke=0;
      this.mass=this.options.mass??19; this.potTemperature=this.options.temperature??137;
      this.ladle={...start,tx:start.x,tz:start.z,vx:0,vz:0,height:.78,temperature:this.potTemperature-3,drop:.016,flux:0};
      this.length=0; this.windows=0; this.welds=0; this.anchor=0; this.joinMass=0;
      this.skewer=0; this.blade={progress:0,drive:0,x:-1.6,z:1.9,contact:0,scrape:0};
      this.leaf={angle:0,angleGoal:0,height:0,heightGoal:0,tiltSpeed:0,shadowWidth:0};
      this.plate=0; this.serve=0; this.nudge=0; this.root={...start}; this.placed=false; this.rawMove=0;
      this.helper={x:0,z:0,phase:0}; this.sequence=0; this.strokeLength=0; this.lastContact=-1; this.gap=false;this.refill=null;this.platePush=0;this.acoustics={impactHz:0,decay:0,scrapeHz:680,gain:0,dose:0};
    }
    tapSound(mass,strength){
      const tile=this.stone[this.zone(this.ladle.x,this.ladle.z)],a=this.acoustics;
      a.impactHz=clamp(638-139*Math.cbrt(mass*9)-56*tile.oil,260,760);
      a.decay=.067+.042*Math.sqrt(mass)+.033*(1-tile.oil);
      this.events.push({kind:'drop',strength,frequency:a.impactHz,duration:a.decay});
    }
    enter(phase) {this.phase=phase;this.age=0;this.idle=0;this.events.push({kind:phase,strength:.4});}
    active() {return ({stem:'ladle',lace:'ladle',skewer:'',join:'joint',peel:'blade',shadow:'stick',serve:'plate',carry:''})[this.phase];}
    press(item,x,z) {
      this.idle=0;
      if(this.phase==='lace'&&item==='rest'){this.dock();return true;}
      if(this.phase==='serve'&&item==='stick'){this.held='stick';return true;}
      if(!item||item!==this.active()){this.nudge=.035;return false;}
      this.held=item;this.rawMove=0;
      if(item==='ladle'){this.stroke++;this.strokeLength=0;this.lastContact=-1;this.gap=false;this.tapSound(this.ladle.drop,.17+Math.min(.3,this.ladle.drop*2.3));}
      if(item==='joint'){this.placed=true;}
      if(item==='blade'){this.blade.drive=Math.max(this.blade.drive,.35);}
      if(item==='plate'){this.platePush=.01;}
      return true;
    }
    move(dx,dz) {
      if(!this.held||this.refill) return;
      this.idle=0;const d=Math.hypot(dx,dz);this.rawMove+=d;
      if(this.held==='ladle'){
        this.ladle.tx=clamp(this.ladle.tx+dx,-3.46,3.48);this.ladle.tz=clamp(this.ladle.tz+dz,-2.03,2.45);
      }else if(this.held==='blade'){
        this.blade.drive=clamp(this.blade.drive+d*.88,0,2.1);
      }else if(this.held==='plate'){
        this.platePush=clamp(this.platePush+Math.max(0,-dz)*.66+d*.22,0,1);if(this.platePush>.26){this.held='';this.enter('carry');}
      }else if(this.held==='stick'){
        this.leaf.angleGoal=clamp(this.leaf.angleGoal+dz*.53+dx*.12,-1.34,-.16);
        this.leaf.heightGoal=clamp(this.leaf.heightGoal-dz*.28,.18,1.15);
      }
    }
    release() { if(this.held==='plate')this.enter('carry');if(this.held==='ladle'&&this.phase==='lace'&&(dist(this.ladle,rest)<.65||Math.hypot(this.ladle.tx-rest.x,this.ladle.tz-rest.z)<.65))this.dock();this.held='';this.idle=0; }
    dock(){this.refill=null;this.held='';this.last=-1;this.ladle.tx=rest.x;this.ladle.tz=rest.z;this.root={x:this.nodes[0].x,z:this.nodes[0].z};this.enter('skewer');}
    zone(x,z){return clamp(Math.floor((z+2.4)/5.3*6),0,5)*8+clamp(Math.floor((x+3.8)/7.6*8),0,7);}
    bind(a,b,type){const e={a,b,type};this.edges.push(e);if(type==='weld'){this.welds++;e.adhesion=.02;e.transfer=this.nodes[b].mass*.36;this.joints.push(e);}}
    addNode(x,z,mass,linked){
      const id=this.nodes.length, old=this.last, zone=this.zone(x,z);
      const n={x,z,mass,temperature:this.ladle.temperature,surfaceHeat:0,hardness:0,radius:.024,lift:0,separation:0,tension:0,zone,stroke:this.stroke,span:0,depth:0,coats:0,bond:0,component:id,travel:this.length,release:0};
      this.nodes.push(n);
      if(linked&&old>=0){this.bind(old,id,'line');const d=dist(n,this.nodes[old]);this.length+=d;n.span+=d*.5;this.nodes[old].span+=d*.5;this.strokeLength+=d;n.travel=this.length;n.component=this.nodes[old].component;}
      let closest=-1,range=.145;
      for(let j=0;j<id;j++){
        const p=this.nodes[j];if((p.stroke===n.stroke&&this.length-p.travel<.60)||j===old)continue;
        const d=dist(n,p);if(d<range){closest=j;range=d;}
      }
      if(closest>=0){const p=this.nodes[closest];const heat=(n.temperature+p.temperature)*.5;
        if(heat>53){const gap=this.lastContact<0||this.length-this.lastContact>.60;
          const wasConnected=p.component===n.component;
          this.bind(closest,id,'weld'); n.coats=.6;p.coats=Math.min(3,p.coats+.32);
          let area=0;
          if(gap&&wasConnected&&linked&&p.stroke===n.stroke){for(let k=closest;k<id;k++){const a=this.nodes[k],b=this.nodes[k+1];area+=a.x*b.z-b.x*a.z;}area+=n.x*p.z-p.x*n.z;}
          if(gap&&wasConnected&&linked&&Math.abs(area)>.08){this.windows++;this.events.push({kind:'window',strength:.3});}
          if(!wasConnected){const from=n.component,to=p.component;for(const q of this.nodes)if(q.component===from)q.component=to;}
          this.lastContact=this.length;
        }
      }
      this.last=id;return n;
    }
    pour(dt,speed){
      const l=this.ladle;let p=this.nodes[this.last];const distance=p?dist(l,p):0;
      const flow=(.27+.017*Math.sqrt(Math.max(.1,this.mass)))*clamp((l.temperature-40)/90,.18,1.2);
      l.flux=approach(l.flux,flow,13,dt);
      const dm=Math.min(this.mass,l.flux*dt);this.mass-=dm;
      if(dm<.000001)return;
      this.acoustics.dose+=dm;
      if(this.acoustics.dose>.23+.045*speed){this.tapSound(this.acoustics.dose,.06+.12/(1+speed));this.acoustics.dose=0;}
      if(speed>8.3&&!this.gap){this.gap=true;this.stroke++;this.last=-1;}
      if(this.gap&&speed>4.7){l.drop+=dm;return;}
      const detached=this.gap;this.gap=false;
      if(!p||detached||distance>.075){
        const count=detached||!p?1:Math.ceil(distance/.105);const ox=p?p.x:l.x,oz=p?p.z:l.z;
        for(let k=1;k<=count;k++){p=this.addNode(ox+(l.x-ox)*k/count,oz+(l.z-oz)*k/count,(dm+l.drop)/count,!detached&&this.last>=0);}
        l.drop=0;
      }else{p.surfaceHeat+=dm*(l.temperature-p.temperature);p.mass+=dm;}
      if(this.phase==='stem'&&this.length>1.14)this.enter('lace');
    }
    atmosphere(dt){
      const a=this.air;a.clock+=dt;if(a.clock>a.next){a.clock=0;a.next=.6+this.random()*2.2;a.gust=(this.random()-.4)*.8;}
      a.wind=approach(a.wind,a.gust,.75,dt);a.v+=((a.wind-a.bend)*2.8-a.v*1.28)*dt;a.bend+=a.v*dt;
      for(const p of this.steam){p.y+=p.v*dt;p.x+=(a.wind*.33+Math.sin(p.spin+p.y*2)*.045)*dt;p.age+=dt;p.v+=((this.potTemperature-24)*.0025-.1*p.v)*dt*.4;
        if(p.y>1.65+p.life){p.y=0;p.x=(this.random()-.5)*.58;p.z=(this.random()-.5)*.34;p.age=0;p.v=.13+.13*this.random();p.spin=this.random()*6.28;}}
      for(const p of this.motes){const plume=Math.exp(-((p.x*p.x)+((p.z+3.2)**2))*.64);
        p.vx=approach(p.vx,a.wind*.17+.027*Math.sin(p.seed+p.y),.87,dt);
        p.vy=approach(p.vy,.020+plume*.095-.012*p.y,.51,dt);
        p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x>5.8)p.x=-5.8;if(p.x< -5.8)p.x=5.8;}
      for(let i=0;i<this.stone.length;i++){const c=this.stone[i];const sun=.5+.5*Math.sin(i*.92+a.bend*(3+i%3));const env=24+sun*3.2;
        c.temperature+=(env-c.temperature)*dt*(.018+.009*c.oil);c.oil=approach(c.oil,.37+sun*.27,.019+.006*(i%3),dt);}
    }
    cool(dt){
      const peeling=this.phase==='peel';
      if(peeling){
        for(const p of this.nodes)p.tension=0;
        for(const e of this.edges){const a=this.nodes[e.a],b=this.nodes[e.b];
          const stress=(a.lift-b.lift)*Math.min(a.hardness,b.hardness)*(e.adhesion??1);
          if(stress>0)b.tension=Math.max(b.tension,stress);else a.tension=Math.max(a.tension,-stress);}
      }
      for(const e of this.joints){
        const a=this.nodes[e.a],b=this.nodes[e.b],fluid=1-Math.min(a.hardness,b.hardness);
        const dm=Math.min(b.mass*.25,e.transfer*(-Math.expm1(-4.2*fluid*dt)));
        const filmHeat=b.surfaceHeat*(dm/b.mass);b.surfaceHeat-=filmHeat;
        a.surfaceHeat+=filmHeat+dm*(b.temperature-a.temperature);
        a.mass+=dm;b.mass-=dm;e.transfer-=dm;
        const heat=(b.temperature-a.temperature)*(a.mass*b.mass/(a.mass+b.mass))*.34*dt;
        a.temperature+=heat/a.mass;b.temperature-=heat/b.mass;
        e.adhesion=approach(e.adhesion,1,(.40+fluid*2.2),dt);
        a.bond=Math.max(a.bond,e.adhesion);b.bond=Math.max(b.bond,e.adhesion);
      }
      for(const p of this.nodes){const tile=this.stone[p.zone];const absorbed=p.surfaceHeat*(-Math.expm1(-3.7*dt));
        p.temperature+=absorbed/p.mass;p.surfaceHeat-=absorbed;// Invert the volume of a flattened tube segment with a rounded bead at its end.
        const volume=p.mass/(1.53*64*Math.PI),span=.64*p.span;
        let radius=Math.cbrt(volume/.78);for(let i=0;i<3;i++){const rr=radius*radius;
          radius-=(.78*rr*radius+span*rr-volume)/(2.34*rr+2*span*radius);}
        p.depth=approach(p.depth,p.coats,3.3,dt);
        p.radius=approach(p.radius,clamp(radius,.014,.46),5.4/(1+p.hardness),dt);
        const heat=(p.temperature-tile.temperature)*(.023/(.040+p.radius))*(1-.57*p.lift)*(1.15-.3*tile.oil)*dt;
        p.temperature-=heat;tile.temperature+=heat*p.mass/tile.capacity;
        p.hardness=approach(p.hardness,clamp((99-p.temperature)/41,0,1),1.9/(1+p.radius*4),dt);
        if(this.phase==='peel'||this.phase==='shadow'||this.phase==='serve'||this.phase==='carry'){
          if(peeling){const reach=.67+p.radius,contact=clamp(1-dist(p,this.blade)/reach,0,1);
            const pressure=this.blade.drive*contact*(3.8+.8*this.blade.contact);
            p.separation=clamp(p.separation+dt*(pressure+.65*p.tension)*(.19+.81*p.hardness),0,1);}
          const lift=peeling?p.separation*(.21+.79*p.hardness):1;
          p.lift=approach(p.lift,lift,4.8,dt);
        }
      }
    }
    refillLadle(dt){
      const l=this.ladle;
      if(!this.refill&&(this.phase==='stem'||this.phase==='lace')&&this.mass<.12){this.refill={x:l.tx,z:l.tz,filled:false};this.last=-1;this.stroke++;}
      const r=this.refill;if(!r)return false;
      if(!r.filled){l.tx=.15;l.tz=-3.20;if(Math.hypot(l.x-l.tx,l.z-l.tz)<.18){this.mass=approach(this.mass,12,2.3,dt);l.temperature=approach(l.temperature,this.potTemperature,2.8,dt);if(this.mass>11.5)r.filled=true;}}
      else{l.tx=r.x;l.tz=r.z;if(Math.hypot(l.x-r.x,l.z-r.z)<.04)this.refill=null;}
      return true;
    }
    prepareBlade(){
      // Peel in spatial order. A welded component shares the stick, loose beads ride the blade.
      const ax=this.root.x,az=this.root.z;let far=.01;
      for(const p of this.nodes){p.release=Math.hypot(p.x-ax,(p.z-az)*.87);far=Math.max(far,p.release);}
      for(const p of this.nodes)p.release=p.release/far*.83;
      this.peelTip=this.nodes.reduce((a,p)=>a.release>p.release?a:p);this.blade.x=ax-.58;this.blade.z=az+.42;this.enter('peel');
    }
    advance(dt){
      this.time+=dt;this.age+=dt;this.idle=this.held?0:this.idle+dt;this.nudge=approach(this.nudge,0,5,dt);
      this.atmosphere(dt);this.demo=approach(this.demo,this.idle>4?1:0,2,dt);
      const h=this.helper;h.phase+=dt*(.82+this.air.wind*.12);const gesture=(1-Math.cos(h.phase*1.48))*.5;
      let hx=gesture*.78,hz=-gesture*.85;
      if(this.phase==='lace'){const towardRest=this.idle>8;
        hx=towardRest?(rest.x-this.ladle.x)*gesture*.81:-gesture*.80;
        hz=towardRest?(rest.z-this.ladle.z)*gesture*.81:Math.sin(h.phase*1.48)*.33;}
      if(this.phase==='join'){hx=(this.root.x-this.ladle.x)*gesture;hz=(this.root.z-this.ladle.z)*gesture;}
      h.x=approach(h.x,this.demo*hx,3,dt);h.z=approach(h.z,this.demo*hz,3,dt);
      this.potTemperature+=(139-this.potTemperature)*.007*dt;
      const l=this.ladle;
      l.temperature+=(this.potTemperature-l.temperature)*.006*dt-(l.temperature-25)*.0008*dt;
      const joint=this.phase==='join'&&this.placed;
      if(joint){l.tx=this.root.x;l.tz=this.root.z;}
      const refilling=this.refillLadle(dt);const draw=this.held==='ladle'&&!refilling;const k=draw?99:36,damping=draw?17:11;
      l.vx+=((l.tx-l.x)*k-l.vx*damping)*dt;l.vz+=((l.tz-l.z)*k-l.vz*damping)*dt;l.x+=l.vx*dt;l.z+=l.vz*dt;
      l.height=approach(l.height,draw||joint?.48:(this.phase==='skewer'||this.phase==='peel'||this.phase==='shadow'||this.phase==='serve'||this.phase==='carry'?.32:.76),5,dt);
      if(draw)this.pour(dt,Math.hypot(l.vx,l.vz));else{l.flux=approach(l.flux,0,7,dt);const feed=Math.min(this.mass,Math.max(0,approach(l.drop,.051+.028*Math.sqrt(this.mass/19),.47,dt)-l.drop));l.drop+=feed;this.mass-=feed;}
      if(this.phase==='skewer'&&dist(l,rest)<.22){this.skewer=approach(this.skewer,1,1.9,dt);if(this.skewer>.98)this.enter('join');}
      if(joint&&dist(l,this.root)<.15){const dm=Math.min(this.mass,.23*dt);this.mass-=dm;this.joinMass+=dm;const p=this.nodes[0];p.surfaceHeat+=dm*(l.temperature-p.temperature);p.mass+=dm;p.bond=clamp(this.joinMass/.18,0,1);
        if(this.joinMass>=.18||this.mass<.001){this.tapSound(this.joinMass,.61);this.held='';l.tx=rest.x;l.tz=rest.z;this.prepareBlade();}}
      if(this.phase==='peel'){
        const b=this.blade;
        let stiffness=0,area=0;for(const p of this.nodes){const w=Math.max(0,.68-dist(b,p));stiffness+=w*p.hardness;area+=w;}
        b.contact=approach(b.contact,area?stiffness/area:0,8,dt);
        b.drive=approach(b.drive,this.held==='blade'?.29:0,1.7,dt);
        b.scrape=approach(b.scrape,b.drive*(.28+.72*b.contact),7,dt);
        b.progress=clamp(b.progress+b.drive*(.12+.4*b.contact)*dt,0,1.18);
        let front=this.peelTip,best=Infinity;
        for(const p of this.nodes){if(p.separation>.995||p.release>b.progress+.12)continue;
          const cost=dist(b,p)+p.release*.80;if(cost<best){best=cost;front=p;}}
        b.x=approach(b.x,front.x,3,dt);b.z=approach(b.z,front.z,3,dt);
        if(b.progress>1.07&&this.nodes.every(p=>p.lift>.88&&p.separation>.99)){this.held='';this.leaf.heightGoal=.52;this.leaf.angleGoal=-.5;this.enter('shadow');}
      }else this.blade.scrape=approach(this.blade.scrape,0,6,dt);
      const contactOil=this.stone[this.zone(this.blade.x,this.blade.z)].oil;
      this.acoustics.scrapeHz=approach(this.acoustics.scrapeHz,590+1510*this.blade.contact+245*this.blade.drive+240*(1-contactOil),8,dt);
      this.acoustics.gain=Math.min(.31,this.blade.scrape*(.31-.09*contactOil));
      this.cool(dt);
      if(['shadow','serve','carry'].includes(this.phase)){
        const f=this.leaf;this.plate=approach(this.plate,1,1.5,dt);
        f.tiltSpeed+=((f.angleGoal+(this.phase==='shadow'?.11*this.demo*Math.sin(h.phase*1.5):0)-f.angle)*22-f.tiltSpeed*7.2)*dt;f.angle+=f.tiltSpeed*dt;f.height=approach(f.height,f.heightGoal,3,dt);
        f.shadowWidth=.008+f.height*.058;
        if(this.phase==='shadow'&&this.held==='stick'&&this.plate>.91){f.angleGoal=clamp(f.angleGoal-dt*.24,-1.34,-.16);if(f.angle<-.63||this.rawMove>.24)this.enter('serve');}
        if(this.phase==='carry'){this.serve=approach(this.serve,1,.92,dt);
          if(this.serve>.72){l.tx=this.serve<.88?.15:start.x;l.tz=this.serve<.88?-3.2:start.z;}
          if(this.serve>.995){const prior={x:l.x,z:l.z,vx:l.vx,vz:l.vz,height:l.height};this.cycle++;this.reset();Object.assign(this.ladle,prior);}}
      }
    }
    step(dt){if(!Number.isFinite(dt)||dt<=0)return;let left=dt;while(left>1e-8){const h=Math.min(1/90,left);this.advance(h);left-=h;}}
    getState(){return JSON.parse(JSON.stringify({phase:this.phase,cycle:this.cycle,time:this.time,idle:this.idle,demo:this.demo,helper:this.helper,air:this.air,steam:this.steam,motes:this.motes,stone:this.stone,potTemperature:this.potTemperature,mass:this.mass,ladle:this.ladle,nodes:this.nodes,edges:this.edges,windows:this.windows,welds:this.welds,length:this.length,skewer:this.skewer,joinMass:this.joinMass,blade:this.blade,leaf:this.leaf,plate:this.plate,serve:this.serve,acoustics:this.acoustics,refill:this.refill,platePush:this.platePush}));}
  }
  return {Table,start,rest,tip,phaseNames};
});
