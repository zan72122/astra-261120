/* Distances in workshop units (50 mm), time in seconds, temperature in °C. */
(function (root) {
'use strict';
const W=4.6, D=3.64, NX=33, NZ=31, N=NX*NZ, BASE=.204;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), smooth=x=>x*x*(3-2*x);
function noise(i) { const n=Math.sin(i*95.734+38.21)*43758.5453; return n-Math.floor(n); }
function create(options={}) {
  const mass=options.mass??1, wet=options.moisture??.43;
  const cells=Array.from({length:N},(_,i)=>{
    const x=(i%NX/(NX-1)-.5)*W, s=Math.floor(i/NX)/(NZ-1)*D;
    return {x,s,temp:27+3*Math.cos(x*.84)-s*.36+noise(i)*.7,
      moisture:wet+.035*noise(i+200), crumb:mass*(.269+.014*Math.sin(s*2.7+x)+.008*noise(i)),
      cream:0, dent:0,vel:0,load:0, work:0};
  });
  const state={stage:'cream',batch:1,time:0,idle:0,stageAge:0,creamWork:0,drip:0,
    roll:0,rollGoal:0,rollSpeed:0,fold:0,paperStress:0,paperSpeed:0,gripX:0,pucker:Array(NX).fill(0),puckerV:Array(NX).fill(0),blade:0,bladeSpeed:0,
    bowl:0,returning:0,lift:0,serve:0,cutX:0,side:1,fruit:[],cells,
    draft:.15,light:.76,airV:.01,airTarget:.26,weatherAge:0,weatherIndex:0,
    teaTemp:57,vapor:Array.from({length:3},(_,i)=>Array.from({length:12},(_,j)=>({x:.02*Math.sin(i+j*.32),y:j*.061,z:.03*Math.cos(i+j*.32),vx:0,heat:.78-j*.041}))),crumbs:[],bends:new Array(NX).fill(0),pitches:new Array(NX).fill(.33),batchesServed:0,
    tool:{x:-.71,s:1.66,vx:0,vs:0,gx:-.71,gs:1.66,flex:0,velocity:0,cream:.9},
    voices:{rub:0,paper:0,knife:0,fruit:0}, dragging:null};
  let prev={x:0,s:0},pending=null;
  for(let i=0;i<24;i++) state.crumbs.push({x:(noise(i+60)-.5)*10,y:.4+noise(i+80)*4,z:(noise(i+700)-.5)*8,vx:0,vy:.012,phase:noise(i+19)*4});
  const at=(x,s)=>cells[Math.round(clamp(s/D,0,1)*(NZ-1))*NX+Math.round(clamp(x/W+.5,0,1)*(NX-1))];
  function sample(x,s,key){
    let u=clamp(x/W+.5,0,1)*(NX-1),v=clamp(s/D,0,1)*(NZ-1),i=Math.floor(u),j=Math.floor(v);
    let a=j*NX+i,b=j*NX+Math.min(i+1,NX-1),c=Math.min(j+1,NZ-1)*NX+i,d=Math.min(j+1,NZ-1)*NX+Math.min(i+1,NX-1);
    return (cells[a][key]*(1-u+i)+cells[b][key]*(u-i))*(1-v+j)+(cells[c][key]*(1-u+i)+cells[d][key]*(u-i))*(v-j);
  }
  function stage(name){state.stage=name;state.stageAge=0;state.idle=0;}
  function contact(x,s){return Math.abs(x)<W*.53 && s>-.16 && s<D+.16;}
  function down(kind,x,s){
    if(state.dragging)return false;
    const a=state.stage;state.idle=0;
    let mode=null;
    if(a==='cream'&&(kind==='spatula'||(kind==='cake'&&(state.creamWork>.07||Math.hypot(x-state.tool.x,s-state.tool.s)<.77))))mode='spread';
    if(a==='cream'&&kind==='dish'&&state.creamWork>.07){stage('return');return true;}
    if(a==='fruit'&&(kind==='bowl'||kind==='berry')){const index=kind==='berry'?state.fruit.findIndex(b=>((x-b.x)/b.rx)**2+((s-b.s)/b.rs)**2<1.7):-1;
      if(kind==='bowl'&&state.fruit.length>=13)return false;
      if(kind==='berry'&&index<0)return false;
      mode='fruit';pending={x,s,index};if(index>=0)state.fruit[index].held=true;}
    if(a==='fruit'&&state.fruit.length&&(kind==='paper'||kind==='lip')){mode='roll';stage('fold');}
    if(a==='roll'&&(kind==='paper'||kind==='lip'||kind==='cake'))mode='roll';
    if(a==='cut'&&kind==='cake'){state.cutX=clamp(x,-W/2+.065,W/2-.065);state.side=state.cutX<0?-1:1;stage('cutting');return true;}
    if(a==='server'&&(kind==='server'||kind==='cake')){stage('lift');return true;}
    if(a==='serve'&&(kind==='dish'||kind==='slice')){stage('passing');return true;}
    if(!mode)return false;
    state.dragging=mode;prev={x,s};if(mode==='roll')state.gripX=x;if(mode==='spread'){state.tool.gx=clamp(x,-W/2,W/2);state.tool.gs=clamp(s,0,D);}
    return true;
  }
  function move(x,s){
    if(!state.dragging)return;
    state.idle=0;
    if(state.dragging==='spread'){state.tool.gx=clamp(x,-W/2,W/2);state.tool.gs=clamp(s,0,D);}
    if(state.dragging==='fruit'){pending.x=x;pending.s=s;}
    if(state.dragging==='roll'){state.gripX=clamp(x,-W/2,W/2);state.rollGoal=clamp(state.rollGoal+Math.max(0,s-prev.s)*1.36,0,D);state.paperSpeed+=Math.min(.65,Math.abs(s-prev.s)*1.7);}
    prev={x,s};
  }
  function up(x,s,kind){
    if(state.dragging==='spread'&&kind==='dish'&&state.creamWork>.07)stage('return');
    if(state.dragging==='fruit'&&contact(x,s)){
      const i=state.fruit.length+state.batch*23;
      const item={x:clamp(x,-W/2+.12,W/2-.12),s:clamp(s,.12,D-.12),rx:.108+.052*noise(i),rs:.244+.045*noise(i+1),h:.081,fall:.29,v:0,sink:0,juice:0,held:false};
      if(pending.index>=0){const b=state.fruit[pending.index];Object.assign(b,{x:item.x,s:item.s,fall:item.fall,v:0,sink:0});}else state.fruit.push(item);
      state.voices.fruit=.58;
    }
    if(pending&&pending.index>=0)state.fruit[pending.index].held=false;
    pending=null;state.dragging=null;state.idle=0;
  }
  function toolPhysics(dt){
    const t=state.tool;
    t.vx+=((t.gx-t.x)*115-t.vx*17)*dt;t.vs+=((t.gs-t.s)*115-t.vs*17)*dt;
    t.x+=t.vx*dt;t.s+=t.vs*dt;
    const speed=Math.hypot(t.vx,t.vs), spreading=state.dragging==='spread'?1:0;
    const resistance=at(t.x,t.s).moisture;
    t.velocity+=((spreading*Math.min(1,speed)*(.045+resistance*.08)-t.flex)*130-16*t.velocity)*dt;t.flex+=t.velocity*dt;
    state.voices.rub+=(spreading*Math.min(.9,speed*(.13+resistance*.2))-state.voices.rub)*Math.min(1,dt*14);
    state.creamWork+=spreading*speed*dt;
    return spreading*Math.min(speed,12);
  }
  const delta=new Float64Array(N),weight=new Float64Array(N);
  function materialPhysics(dt,speed,dripRate){
    delta.fill(0);weight.fill(0);const tool=state.tool;
    for(const berry of state.fruit){
      if(berry.held)continue;
      const ix=(berry.x/W+.5)*(NX-1),iz=berry.s/D*(NZ-1),wx=2*berry.rx/W*(NX-1),wz=2*berry.rs/D*(NZ-1);
      for(let j=Math.max(0,Math.floor(iz-wz));j<=Math.min(NZ-1,iz+wz);j++)for(let i=Math.max(0,Math.floor(ix-wx));i<=Math.min(NX-1,ix+wx);i++){
        const k=j*NX+i,c=cells[k],q=((c.x-berry.x)/berry.rx)**2+((c.s-berry.s)/berry.rs)**2;
        if(q<3)weight[k]+=.052*Math.exp(-q*1.4)*clamp(1-berry.fall/.29,0,1);
      }
    }
    for(let i=0;i<N;i++){
      const c=cells[i],edge=Math.abs(c.x)/(W/2)+Math.abs(c.s-D/2)/D;
      c.temp-=(c.temp-21.6)*(.006+edge*.004+state.draft*.001)*dt/(mass*(.85+c.moisture));
      c.moisture=Math.max(.13,c.moisture-Math.max(0,c.temp-20)*(.000024+edge*.000012)*dt);
      const dx=c.x-tool.x,ds=c.s-tool.s;
      const touch=speed*Math.exp(-dx*dx/.105-ds*ds/.054);
      const spot=Math.exp(-((c.x+.71)**2+(c.s-1.66)**2)/.046);
      delta[i]+=dripRate*spot*dt;
      c.work+=touch*dt;
      // Shear transports high cream into its lower neighbours and replenishes the blade's trail.
      if(touch>.001){delta[i]+=touch*dt*Math.max(0,.103-c.cream)*4.8*tool.cream;tool.cream=Math.max(.32,tool.cream-touch*dt*.00031);}
      const compliance=1/(.95+mass*.32-c.moisture*.47);
      const pressure=(weight[i]+Math.min(.07,touch*.018))*compliance;
      c.vel+=((pressure-c.dent)*(68+mass*19-c.moisture*21)-c.vel*(10+c.moisture*4))*dt;
      c.dent+=c.vel*dt;
      if(c.cream>.001){
        const mobility=(.015+touch*4.9)*(1+c.moisture*.55);
        function flow(j){const grad=c.cream-cells[j].cream;if(grad>.004){const flux=Math.min(.15,mobility*dt)*grad;delta[i]-=flux;delta[j]+=flux;}}
        if(i%NX)flow(i-1);if(i%NX<NX-1)flow(i+1);if(i>=NX)flow(i-NX);if(i<N-NX)flow(i+NX);
      }
    }
    for(let i=0;i<N;i++){cells[i].cream=Math.max(0,cells[i].cream+delta[i]);}
    for(const b of state.fruit){
      if(b.fall>0){b.v-=3.3*dt;b.fall=Math.max(0,b.fall+b.v*dt);}
      const c=at(b.x,b.s);b.sink+=(Math.min(.061,c.cream*.65)+c.dent*.4-b.sink)*dt*3;
      b.juice+=(c.moisture-b.juice)*dt*.055;
    }
  }
  function paperPhysics(dt){
    const st=state;
    if(st.stage==='fold')st.rollGoal=Math.max(st.rollGoal,.52);
    const grip=st.fruit.reduce((n,b)=>n+Math.exp(-((st.roll-b.s)**2)/.15)*.28,0);
    st.rollSpeed+=((st.rollGoal-st.roll)*(35/mass)-st.rollSpeed*(10+grip))*dt;
    const last=st.roll;st.roll=clamp(st.roll+st.rollSpeed*dt,0,D);
    for(let i=0;i<NX;i++){
      const c=at((i/(NX-1)-.5)*W,st.roll);
      const offset=(i/(NX-1)-.5)*W-st.gripX,grip=Math.exp(-offset*offset*.85);
      const tension=st.rollSpeed*.049*grip+st.paperStress*.13*grip;
      st.puckerV[i]+=((tension-st.pucker[i])*(51-c.moisture*10)-st.puckerV[i]*8)*dt;
      st.pucker[i]+=st.puckerV[i]*dt;
      st.bends[i]+=(clamp(st.roll+st.pucker[i],0,D)-st.bends[i])*dt*(13+5*c.moisture)/mass;
      st.pitches[i]+=(c.crumb+.041+Math.min(.13,c.cream)*.55-st.pitches[i])*dt*3;
    }
    st.paperSpeed+=((Math.abs(st.rollSpeed)*.25-st.paperStress)*45-st.paperSpeed*6)*dt;
    st.paperStress=clamp(st.paperStress+st.paperSpeed*dt,-.15,.8);
    st.voices.paper+=(Math.min(1,Math.abs(st.paperSpeed)*.35+Math.abs(st.roll-last)/dt*.48)-st.voices.paper)*dt*15;
    if(st.stage==='fold'&&st.roll>.43)stage('roll');
    if(st.stage==='roll'&&st.roll>D-.045&&Math.abs(st.rollSpeed)<.19){stage('cut');st.dragging=null;}
  }
  function events(dt){
    const st=state;
    if(st.stage==='return'){st.returning=Math.min(1,st.returning+dt*.95);if(st.returning===1)stage('fruit');}
    if(st.stage!=='cream'&&st.stage!=='return')st.bowl=Math.min(1,st.bowl+dt*1.05);
    const c=at(st.cutX,st.roll*.5);
    if(st.stage==='cutting'){
      st.bladeSpeed+=((1.025-st.blade)*(14/(mass+.3))-st.bladeSpeed*(5+c.moisture))*dt;
      st.blade=Math.min(1,st.blade+st.bladeSpeed*dt);
      st.voices.knife=st.bladeSpeed*Math.sin(Math.PI*st.blade)*(.6+c.moisture);
      if(st.blade>=1){st.voices.knife=0;stage('server');}
    }
    if(st.stage==='lift'){st.lift=Math.min(1,st.lift+dt*.61);if(st.lift===1)stage('serve');}
    if(st.stage==='passing'){st.serve=Math.min(1,st.serve+dt*.53);if(st.serve===1){
      const next=create(options).state, n=st.batch+1;
      const room={};for(const k of ['time','light','draft','weatherAge','weatherIndex','airV','airTarget','crumbs','vapor','teaTemp'])room[k]=st[k];
      Object.assign(st,next,room,{batch:n,stage:'unfold',time:st.time,idle:0,batchesServed:n-1,cells});
      for(let i=0;i<N;i++)Object.assign(cells[i],next.cells[i]);
    }}
    if(st.stage==='unfold'&&st.stageAge>1.25)stage('cream');
  }
  function airPhysics(dt){
    const st=state;st.teaTemp-=(st.teaTemp-21.6)*.0014*dt;
    for(let i=0;i<st.vapor.length;i++){
      const strand=st.vapor[i];
      for(let j=strand.length-1;j>=0;j--){
        const p=strand[j],below=j?strand[j-1]:{x:.045*Math.sin(i*2.4),z:.039*Math.cos(i*2.4),heat:(st.teaTemp-21.6)/40};
        const buoyancy=.12+.15*p.heat;
        p.vx+=((st.draft*.21+.024*Math.sin(p.y*7+i)-p.vx)*1.7)*dt;
        p.x+=(p.vx+(below.x-p.x)*buoyancy/.061)*dt;
        p.z+=((below.z-p.z)*buoyancy/.061+st.airV*.031)*dt;
        p.heat+=((below.heat-p.heat)*buoyancy/.061-p.heat*.16)*dt;
      }
    }
  }
  function tick(dt){
    const st=state;st.time+=dt;st.stageAge+=dt;st.idle+=dt;st.weatherAge+=dt;
    if(st.weatherAge>1.3+noise(st.weatherIndex)*2){st.weatherAge=0;st.airTarget=noise(++st.weatherIndex)*.8-.21;}
    st.airV+=((st.airTarget-st.draft)*.9-st.airV*1.45)*dt;st.draft+=st.airV*dt;
    st.light+=(.76+st.draft*.105-st.light)*dt*.7;
    airPhysics(dt);
    for(const p of st.crumbs){p.vx+=((st.draft*.09+Math.sin(p.y+p.phase)*.012)-p.vx)*dt*.8;p.vy+=(.012+st.draft*.007-p.vy)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>6)p.y-=6;if(p.x>7)p.x-=14;}
    const old=st.drip;if(st.stage==='cream')st.drip=Math.min(1,st.drip+dt*1.5);
    const deposit=(smooth(clamp((st.drip-.35)/.65,0,1))-smooth(clamp((old-.35)/.65,0,1)))*.232/dt;
    materialPhysics(dt,toolPhysics(dt),deposit);paperPhysics(dt);events(dt);
    st.voices.fruit*=Math.exp(-dt*9);
  }
  function step(dt){if(!Number.isFinite(dt)||dt<=0)return;const n=Math.ceil(dt*90);for(let i=0;i<n;i++)tick(dt/n);}
  function surface(x,s,q){
    const col=clamp((x/W+.5)*(NX-1),0,NX-1),j=Math.floor(col),k=Math.min(j+1,NX-1),f=col-j;
    let len=state.bends[j]*(1-f)+state.bends[k]*f;
    const pitch=state.pitches[j]*(1-f)+state.pitches[k]*f;
    if(s>=len)return {x,y:BASE+q,z:D/2-s};
    const r0=.205*mass+.06, r=Math.sqrt(r0*r0+pitch*s/Math.PI),outer=Math.sqrt(r0*r0+pitch*len/Math.PI);
    const a=2*Math.PI*(r-outer)/pitch;
    return {x,y:BASE+outer-(r-q)*Math.cos(a),z:D/2-len-(r-q)*Math.sin(a)};
  }
  function section(x,halfWidth=0){
    return state.fruit.map((b,i)=>{const dist=Math.abs(x-b.x),r=b.rx;
      return {i,s:b.s,cross:dist<r?Math.sqrt(1-(dist/r)**2):0,
        through:halfWidth>0&&halfWidth<.38&&dist>=r&&dist-r<halfWidth?Math.exp(-(dist-r)*15)*.27:0};
    }).filter(f=>f.cross||f.through);
  }
  return {state,step,down,move,up,sample,surface,section,getPending:()=>pending,getState:()=>JSON.parse(JSON.stringify(state))};
}
const api={create,W,D,BASE,NX,NZ,clamp,smooth,noise};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Pastry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
