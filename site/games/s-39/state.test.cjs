'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {create, MM, N} = require('./sim.js');
const dt=.05, center=8*N+8, near=5*N+8, rim=8*N+15;
const trace=[], max={grooveDepthMm:0,temp:0,water:0,gel:0,groove:0,dent:0,coat:0,valley:0,dropX:0,dropY:0,line:0,spot:0};
let pairs=0,uniformHeating=0,nonuniformGel=0;
const uniformChanges={water:0,gel:0,groove:0,dent:0,coat:0,valley:0};
function inspectLocal(field,deltas){
  const lo=Math.min(...deltas),hi=Math.max(...deltas);
  if(Math.max(Math.abs(lo),Math.abs(hi))>1e-7 && hi-lo<1e-10)uniformChanges[field]++;
}
const header=['run','seconds','cycle','stage','pressed','cell_center_C','cell_near_C','cell_edge_C','min_C','max_C','local_heat_difference_C_per_step','center_water_fraction','center_gel_fraction','center_groove_fraction','deepest_groove_fraction','dent0_mm','dent1_mm','dent2_mm','film0_ml','film1_ml','film2_ml','valley0_ml','valley1_ml','push_mm','paddle_x_mm','paddle_z_mm','tilt_rad','bead_x_mm','fall_mm','bead_ml','leaf_ml','leaf_line_mm','air_mm_s','plume0_height_mm','support_fraction','tea_fraction'];
function probe(name,options){
  const engine=create(options);let prev;
  function take(){
    const s=engine.read(),valid=s.cells.filter(c=>c.wet),temps=valid.map(c=>c.temp);
    let spread=0;
    if(prev){
      pairs++;
      let lo=Infinity,hi=-Infinity,glo=Infinity,ghi=-Infinity;
      for(let i=0;i<valid.length;i++){
        let c=valid[i],old=prev.cells[i];const delta=c.temp-old.temp;
        lo=Math.min(lo,delta);hi=Math.max(hi,delta);
        max.grooveDepthMm=Math.max(max.grooveDepthMm,MM*Math.abs(c.groove*(.087+.21*c.gel)-old.groove*(.087+.21*old.gel)));
        glo=Math.min(glo,c.gel-old.gel);ghi=Math.max(ghi,c.gel-old.gel);
        for(let k of ['temp','water','gel','groove'])max[k]=Math.max(max[k],Math.abs(c[k]-old[k]));
      }
      for(const k of ['water','gel','groove'])inspectLocal(k,valid.map((c,i)=>c[k]-prev.cells[i][k]));
      spread=hi-lo;if(spread<1e-10)uniformHeating++;if(ghi-glo>1e-10)nonuniformGel++;
      // Replacement dough and newly detached drops have distinct identities.
      if(s.cycle===prev.cycle){
        for(const k of ['dent','coat','valley'])inspectLocal(k,s.balls.map((b,i)=>b[k]-prev.balls[i][k]));
        for(let i=0;i<3;i++)for(let k of ['dent','coat','valley'])max[k]=Math.max(max[k],Math.abs(s.balls[i][k]-prev.balls[i][k]));
        if(prev.stage==='drip' && s.stage==='drip')max.dropX=Math.max(max.dropX,Math.abs(s.dropX-prev.dropX)*MM);
        for(let k of ['dropY','line','spot'])max[k]=Math.max(max[k],Math.abs(s[k]-prev[k])*(k==='spot'?1:MM));
      }
    }
    const b=s.balls,c=s.cells[center];
    assert(Math.abs(s.leafCells.reduce((v,c)=>v+c.mass,0)-s.spot)<1e-8,'leaf volume accounting');
    const row=[name,s.elapsed,s.cycle,s.stage,s.active,c.temp,s.cells[near].temp,s.cells[rim].temp,Math.min(...temps),Math.max(...temps),spread,c.water,c.gel,c.groove,s.trailPeak,...b.map(x=>x.dent),...b.map(x=>x.coat),b[0].valley,b[1].valley,s.push*3.54*MM,s.paddleX*1.35*MM,s.paddleY*1.35*MM,s.tilt,s.dropX*MM,s.dropY*MM,s.dropMass,s.spot,s.line*MM,s.air*MM,s.ambient[0].y*MM,s.support,s.tea];
    assert(row.every(x=>typeof x!=='number'||Number.isFinite(x)));
    trace.push(row.map(x=>typeof x==='number'?Number(x.toFixed(7)):x).join(','));
    prev={cells:valid.map(({temp,water,gel,groove})=>({temp,water,gel,groove})),balls:b.map(v=>({...v})),stage:s.stage,cycle:s.cycle,dropX:s.dropX,dropY:s.dropY,line:s.line,spot:s.spot};
  }
  function step(){engine.step(dt);take();}
  function run(seconds,callback){for(let j=0;j<Math.round(seconds/dt);j++){if(callback)callback(j);step();}}
  function until(predicate,limit){let i=0;while(!predicate(engine.read())&&i++<limit/dt)step();assert(predicate(engine.read()),name+' stalled in '+engine.read().stage);}
  take();return {engine,get:engine.read,step,run,until,input:engine.input};
}
function thread(p){p.input('down','grip');p.until(s=>s.stage==='stir',8);p.input('up');}
function sweep(p){
  p.input('down','paddle',-.72,.04);
  p.run(.55);
  p.run(1.1,j=>p.input('move','paddle',-.72+1.44*j/21,.04));
  p.input('up');
}
function dentTrial(mass){
  const p=probe('press_'+mass+'g',{doughMass:mass});
  p.input('down','grip',0,0);p.run(.33);p.input('move','grip',-.12,.07);p.run(.15);p.input('up');
  const release=p.get().balls[0].dent;p.run(.50);const after=p.get().balls[0].dent;p.run(1.30);
  assert(release>1 && after<release && Math.abs(p.get().balls[0].dent)<.016);
  return {release,after,settled:p.get().balls[0].dent};
}
function viscosityTrial(label,gel){
  const p=probe(label,{gel});thread(p);sweep(p);
  const cell=8*N+12,groove=p.get().cells[cell].groove,peak=p.get().trailPeak;
  const start=p.get().elapsed;p.until(s=>s.cells[cell].groove<groove*.5,6);
  return {groove,peak,halfLife:p.get().elapsed-start};
}
const idle=probe('untouched'),start=idle.engine.getState();
assert(!idle.input('down','paddle'));idle.run(10);
const finish=idle.engine.getState();
assert.equal(finish.stage,'thread');assert.equal(finish.push,0);
assert(finish.cells[center].temp>start.cells[center].temp);
assert.notEqual(start.ambient[0].y,finish.ambient[0].y);
const idleTemp=[center,rim].map(i=>[start.cells[i].temp,finish.cells[i].temp]);
const normal=dentTrial(19),heavy=dentTrial(27);assert(heavy.release>normal.release);
const thin=viscosityTrial('same_sweep_thin',.045),thick=viscosityTrial('same_sweep_thick',.91);assert(thick.halfLife>thin.halfLife*4);
const p=probe('tea_service');p.run(4.5);thread(p);
sweep(p);p.until(s=>s.clarity>.84,100);sweep(p);
p.until(s=>s.stage==='dip',12);const ready=p.get().elapsed;p.until(s=>s.pan>.98,8);
p.input('down','grip');p.run(2.35);p.input('up');p.until(s=>s.stage==='drip',6);
const coat=p.get().balls.map(b=>b.coat),walkStart=p.get().elapsed;
const crossed=[];p.input('down','grip',0,0);p.input('move','grip',.05,.49);
for(let x of [-.53,.53]){p.until(s=>s.dropX>=x,16);crossed.push(p.get().elapsed-walkStart);}
p.until(s=>s.stage==='place',8);p.input('up');p.run(.65);
const dab=p.get().spot,residue=p.get().balls.map(b=>b.valley);
assert(dab>.2 && residue[0]>0 && residue[1]>0 && crossed[1]>crossed[0]);
p.input('down','grip',0,0);p.run(.55);
p.run(.95,j=>p.input('move','grip',-.74*(j+1)/19,.08));p.input('up');p.run(.25);
const inkLine=p.get().line*MM;assert(inkLine>10);
p.input('down','leaf');p.run(.1);p.input('up');p.until(s=>s.stage==='rest',7);
p.input('down','support');p.run(.1);p.input('up');p.until(s=>s.stage==='serve',4);
p.input('down','cup');p.run(.1);p.input('up');p.until(s=>s.stage==='refill',12);p.until(s=>s.cycle===1,9);
assert(p.get().stage==='thread'&&p.get().balls.every(b=>b.coat===0));const loop=p.get().elapsed;
// Carry the same teahouse through two more orders, including the residual heat in the kettle.
for(let order=2;order<=3;order++){
  thread(p);p.until(s=>s.clarity>.81,95);sweep(p);p.until(s=>s.stage==='dip',12);
  p.until(s=>s.pan>.96,8);p.input('down','grip');p.run(1.85);p.input('up');
  p.until(s=>s.stage==='drip',6);p.input('down','grip');p.input('move','grip',-.10,.36);
  p.until(s=>s.stage==='place',16);p.input('up');p.input('down','leaf');p.run(.1);p.input('up');
  p.until(s=>s.stage==='rest',8);p.input('down','support');p.run(.1);p.input('up');
  p.until(s=>s.stage==='serve',4);p.input('down','tray');p.run(.1);p.input('up');
  p.until(s=>s.cycle===order,20);
}
const serviceTime=p.get().elapsed;
const a=create(),b=create();a.step(10);for(let i=0;i<200;i++)b.step(.05);assert.deepEqual(a.getState(),b.getState());
assert.equal(uniformHeating,0);assert(Object.values(uniformChanges).every(n=>n===0));assert(nonuniformGel>0);
assert(max.temp<.48 && max.dent<3 && max.groove<.3 && max.dropX<3.5 && max.dropY<8 && max.line<5);
fs.writeFileSync(path.join(__dirname,'state-trace.csv'),header.join(',')+'\n'+trace.join('\n')+'\n');
console.log(JSON.stringify({samples:trace.length,pairs,uniformHeating,uniformChanges,nonuniformGel,serviceTime,idleTemp,steam:[start.steam,finish.steam],normal,heavy,thin,thick,coat,crossed,dab,residue,inkLine,ready,loop,max},(k,v)=>typeof v==='number'?Number(v.toFixed(5)):v,2));
