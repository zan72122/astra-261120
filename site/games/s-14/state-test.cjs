'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {create,W,D,NX,NZ}=require('./model.js');
const dt=.05,rows=[],reports={},fields=['temp','moisture','cream','dent'];
const maximum={},stepCount={},uniformCooling={},uniformActive={},peaks={pucker:0,paper:0,knife:0};let sim,label,previous;
const mm=u=>u*50,mean=(a,k)=>a.reduce((n,c)=>n+c[k],0)/a.length;
function run(name,options){label=name;sim=create(options);previous=null;maximum[name]={temp:0,moisture:0,cream:0,dent:0,roll:0,blade:0,light:0};stepCount[name]=0;uniformCooling[name]=0;uniformActive[name]=0;sample();}
function sample(){
 const s=sim.state,local={temp:0,moisture:0,cream:0,dent:0},delta=s.cells.map((c,i)=>previous&&previous.batch===s.batch?c.temp-previous.cells[i].temp:0);
 if(previous&&previous.batch===s.batch){
  stepCount[label]++;
  for(const k of fields){
   const change=s.cells.map((c,i)=>c[k]-previous.cells[i][k]);
   local[k]=Math.max(...change.map(Math.abs));
   if(local[k]>1e-9&&Math.max(...change)-Math.min(...change)<1e-10)uniformActive[label]++;
   maximum[label][k]=Math.max(maximum[label][k],local[k]);
  }
  if(Math.max(...delta)-Math.min(...delta)<1e-9)uniformCooling[label]++;
  for(const k of ['roll','light','blade'])maximum[label][k]=Math.max(maximum[label][k],Math.abs(s[k]-previous[k]));
 }
 if(label==='recipe'){peaks.pucker=Math.max(peaks.pucker,...s.pucker.map(Math.abs));peaks.paper=Math.max(peaks.paper,s.voices.paper);peaks.knife=Math.max(peaks.knife,s.voices.knife);}
 const a=s.cells[15*NX+11],b=s.cells[3*NX+30];
 rows.push([label,s.batch,s.time.toFixed(2),s.stage,...[a.temp,b.temp,mean(s.cells,'moisture'),mm(a.cream),mm(a.dent),mm(s.roll),s.blade,s.light,s.draft,mm(s.crumbs[0].x),local.temp,local.moisture,mm(local.cream),mm(local.dent),mm(Math.max(...s.pucker)),s.voices.paper,s.voices.knife,Math.min(...delta),Math.max(...delta)].map(x=>x.toFixed(8))].join(','));
 previous={batch:s.batch,roll:s.roll,light:s.light,blade:s.blade,cells:s.cells.map(c=>({temp:c.temp,moisture:c.moisture,cream:c.cream,dent:c.dent}))};
}
function steps(n,act){for(let i=0;i<n;i++){act?.(i);sim.step(dt);sample();}}
function waitFor(stage,n=150){for(let i=0;sim.state.stage!==stage&&i<n;i++)steps(1);assert.equal(sim.state.stage,stage);}
function place(x,s){assert(sim.down('bowl',3,D));sim.move(x,s);sim.up(x,s,'cake');steps(12);}
function mound(){
 const c=sim.state.cells;return {height:mm(Math.max(...c.map(c=>c.cream))),area:c.filter(c=>c.cream>.025).length*(W/(NX-1)*D/(NZ-1)*25)};
}
run('idle');let s=sim.state;
const temp=mean(s.cells,'temp'),moist=mean(s.cells,'moisture'),light=s.light,px=s.crumbs[0].x,vaporX=s.vapor[0][11].x;
assert.equal(sim.down('inert',0,0),false);assert.equal(sim.down('dish',2,0),false);steps(200);
reports.idle={cooling:temp-mean(s.cells,'temp'),waterPercentagePoints:(moist-mean(s.cells,'moisture'))*100,dustMm:mm(s.crumbs[0].x-px),light:s.light-light,hintAfter:s.idle,vaporDriftMm:mm(s.vapor[0][11].x-vaporX)};
assert(reports.idle.cooling>.1&&reports.idle.dustMm>1&&s.idle>=9.999);
assert.equal(s.stage,'cream');
for(const [name,options] of [['normal',{}],['mass130',{mass:1.3}],['wet65',{moisture:.65}]]){
 run(name,options);s=sim.state;steps(20);const before=mound();
 assert(sim.down('cake',-.71,1.66));steps(25,i=>sim.move(-.71+1.31*i/24,1.66));const after=mound();
 steps(25,i=>sim.move(.60-1.31*i/24,1.66));sim.up(-.71,1.66,'cake');const last=mound();
 reports[name]={before,after,last,dent:mm(Math.max(...s.cells.map(c=>c.dent))),temp:mean(s.cells,'temp'),flex:mm(s.tool.flex)};
 assert(last.height<before.height&&last.area>before.area);
}
assert(Math.abs(reports.normal.dent-reports.mass130.dent)>.01);
assert(Math.abs(reports.normal.flex-reports.wet65.flex)>.01);
run('recipe');s=sim.state;steps(18);
assert(!sim.down('cake',2,3.6));
assert(sim.down('spatula',s.tool.x,s.tool.s));steps(35,i=>sim.move(-.71+i*.082,1.66));sim.up(3,1,'dish');
waitFor('fruit');assert(!sim.down('paper',0,0));
place(-1.36,.24);place(-1.36,3.34);place(1.97,1.66);place(2.18,1.69);
const berryDent=mm(sim.sample(1.97,1.66,'dent')),sink=mm(s.fruit[2].sink);
assert(sink>0&&berryDent>.05);
assert(!sim.down('knife',0,0));
assert(sim.down('lip',-.1,0));steps(24);waitFor('roll');steps(90,i=>sim.move(-.1,(i+1)*D/90));
sim.up(-.1,D,'cake');waitFor('cut');steps(18);
function radius(b){const i=Math.round((b.x/W+.5)*(NX-1)),L=s.bends[i],r=Math.sqrt(.265**2+s.pitches[i]*L/Math.PI),p=sim.surface(b.x,b.s,0);
 return mm(Math.hypot(p.y-.204-r,p.z-(D/2-L)));}
reports.roll={coreMm:radius(s.fruit[0]),outerMm:radius(s.fruit[1]),berryDent,sink,left:sim.section(-1.36).length,right:sim.section(1.98).length};
assert(reports.roll.coreMm<reports.roll.outerMm);assert.equal(reports.roll.left,2);assert.equal(reports.roll.right,1);
const thin=sim.section(1.98,.32);assert(thin.some(b=>b.through>0));assert.equal(sim.section(1.98,.48).filter(f=>f.through).length,0);
reports.slice={widthMm:mm(W/2-1.98),through:thin.find(b=>b.through).through,intersection:thin.find(b=>b.cross).cross};
assert(sim.down('cake',1.98,1));const bladeStart=s.time;waitFor('server');reports.slice.cutSeconds=s.time-bladeStart;assert(sim.down('server',0,0));waitFor('serve');assert(sim.down('dish',0,0));waitFor('unfold');waitFor('cream');assert.equal(s.batch,2);assert.equal(s.fruit.length,0);assert.equal(s.roll,0);
for(const m of Object.values(maximum)){assert(m.temp<.02&&m.cream<.045&&m.dent<.027&&m.roll<.12&&m.blade<.09);}
for(const u of [...Object.values(uniformCooling),...Object.values(uniformActive)])assert.equal(u,0);
const header='experiment,batch,time_s,stage,temperature_A_C,temperature_B_C,water_fraction,cream_A_mm,dent_A_mm,roll_mm,blade_fraction,window_light,draft,dust_x_mm,max_delta_C,max_delta_water,max_delta_cream_mm,max_delta_dent_mm,peak_paper_bend_mm,paper_sound_gain,knife_sound_gain,min_delta_C,max_signed_delta_C';
fs.writeFileSync(path.join(__dirname,'state-trace.csv'),header+'\n'+rows.join('\n')+'\n');
console.log(JSON.stringify({reports,maximum,peaks,stepCount,uniformCooling,uniformActive,recorded:rows.length},null,2));
