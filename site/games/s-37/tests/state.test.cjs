'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const {createKitchen,angles} = require('../kitchen.js');
const records=[], maxima={},results={};
const localChanges={intervals:0,uniformHeat:0,uniformWater:0,uniformBerry:0};
const dt=.05;
function sample(name, options={}){
  const sim=createKitchen(options);
  let last=sim.getState();
  let time=0;
  const setMax=(key,v)=>{maxima[key]=Math.max(maxima[key]||0,Math.abs(v));};
  function record(state){
    records.push(JSON.stringify({case:name,t_s:Number(time.toFixed(2)),state}));
  }
  record(last);
  function run(seconds,each){
    assert(Math.abs(Math.round(seconds/dt)*dt-seconds)<1e-8);
    for(let i=0;i<Math.round(seconds/dt);i++){
      if(each)each(i,sim);
      sim.step(dt);time+=dt;
      const s=sim.getState();record(s);
      if(s.batch===last.batch){
        localChanges.intervals++;
        for(const [key,part,field] of [['uniformHeat','zones','temperature'],['uniformWater','zones','water'],['uniformBerry','berries','moisture']]){
          const deltas=s[part].map((z,j)=>z[field]-last[part][j][field]);
          if(Math.max(...deltas)-Math.min(...deltas)<1e-12)localChanges[key]++;
        }
        s.zones.forEach((zone,j)=>{
          setMax('temperature_C',zone.temperature-last.zones[j].temperature);
          setMax('water_fraction',zone.water-last.zones[j].water);
          setMax('firmness_fraction',zone.firmness-last.zones[j].firmness);
          setMax('berry_moisture',s.berries[j].moisture-last.berries[j].moisture);
          setMax('lift_cm',s.berries[j].lift-last.berries[j].lift);
          setMax('roll_rad',s.berries[j].roll-last.berries[j].roll);
        });
        s.pressure.forEach((p,j)=>setMax('bag_pressure_fraction',p-last.pressure[j]));
        setMax('rotation_rad',s.rotation-last.rotation);
        setMax('deposited_g',s.bagMass-last.bagMass);
        setMax('flow_g_per_s',s.flow-last.flow);
        s.flowers.forEach((f,j)=>{
          const before=last.flowers[j];
          setMax('radius_cm',f.width-(before?.width||0));
          setMax('height_cm',f.height-(before?.height||0));
          setMax('tip_cm',f.tip-(before?.tip||0));
          setMax('bend_cm',Math.hypot(f.bendX-(before?.bendX||0),f.bendZ-(before?.bendZ||0)));
          setMax('trail_cm',Math.hypot(f.trailX-(before?.trailX||0),f.trailZ-(before?.trailZ||0)));
        });
      }
      last=s;
    }
    return last;
  }
  function ready(){
    run(1.2);
    for(let i=1;i<angles.length;i++){assert(sim.liftBerry(i));run(.15);sim.placeBerry();run(.65);}
    assert.equal(sim.read().phase,'handoff');run(1.65);
    assert.equal(sim.read().phase,'pipe');assert.equal(sim.read().bag,'hand');
  }
  return {sim,run,ready};
}
const idle=sample('idle');
const initial=idle.sim.getState(),warm=idle.run(10);
const delta=warm.zones.map((z,i)=>z.temperature-initial.zones[i].temperature);
results.idle={zone_warming_C:delta,berry_moisture_change:warm.berries.map((b,i)=>b.moisture-initial.berries[i].moisture),
  mote_displacement_cm:5*Math.hypot(warm.motes[0].x-initial.motes[0].x,warm.motes[0].y-initial.motes[0].y),hint_s:warm.hint};
let uniformTicks=0;
for(let j=1;j<records.length;j++){
  const a=JSON.parse(records[j-1]).state,b=JSON.parse(records[j]).state;
  const dv=b.zones.map((z,k)=>z.temperature-a.zones[k].temperature);
  if(Math.max(...dv)-Math.min(...dv)<1e-9)uniformTicks++;
}
assert.equal(uniformTicks,0);results.idle.identical_zone_increments=uniformTicks;
assert(warm.hint>0&&warm.phase==='berries'&&delta.every(v=>v>0));
const lift=sample('roll');lift.run(1.2);lift.sim.liftBerry(1);
const raised=lift.run(.40).berries[1];results.roll={rise_cm:raised.lift,angle_deg:raised.roll*180/Math.PI};
lift.sim.placeBerry();lift.run(.65);const settled=lift.run(.80).berries[1];assert(Math.abs(settled.bounce)<.015);
function piping(name,gap,duration,options={},drag=null){
  const test=sample(name,options);test.ready();
  const p=test.sim.point(gap);assert(test.sim.press(p.x,p.z));
  const last=test.run(duration,drag?(i,s)=>drag(i,s,p):undefined);
  const before=last.flowers[0],flow=last.flow,pressure=last.pressure.slice(),sound=last.sound;
  assert(before.mass>0&&sound>0);test.sim.release();assert.equal(test.sim.read().sound,0);
  const after=test.run(.80).flowers[0];
  const total=test.sim.read().bagMass+after.mass;
  assert(Math.abs(total-(options.bagMass??100))<1e-7);
  results[name]={capacity_radius_cm:p.limit,radius_cm:after.width,base_width_cm:after.width*2,
    peak_height_cm:after.height+after.tip,tip_cm:after.tip,mass_g:after.mass,release_flow_g_s:flow,
    pressure,trail_cm:Math.hypot(after.trailX,after.trailZ),bend_cm:Math.hypot(after.bendX,after.bendZ),
    difference_of_lobe_radii_cm:Math.max(...after.lobes.map(l=>l.radius))-Math.min(...after.lobes.map(l=>l.radius))};
  return test;
}
const wide=piping('wide',5,10);
const star=piping('short',0,.30);
piping('shell',5,2,{},(i,s,p)=>s.aim(p.x+Math.max(0,i-10)*.047,p.z+Math.max(0,i-10)*.012));
piping('straight',5,2);
piping('warm',5,2,{temperature:13});
piping('light_bag',5,2,{bagMass:20});
assert(results.wide.radius_cm>results.wide.capacity_radius_cm*.94);
assert(results.short.base_width_cm<results.wide.base_width_cm*.60);
assert(results.shell.trail_cm>.6&&results.shell.bend_cm>.085&&results.straight.bend_cm===0);
assert(results.warm.mass_g>results.straight.mass_g&&results.warm.tip_cm<results.straight.tip_cm);
assert(results.light_bag.mass_g<results.straight.mass_g);
assert(results.shell.difference_of_lobe_radii_cm>.015);
const sim=star.sim;
assert(sim.parkBag());star.run(1);assert.equal(sim.read().phase,'look');
sim.spin(1.5,.6);star.run(1.20);sim.stopSpin();star.run(.95);
results.wheel={angle_deg:sim.read().rotation*180/Math.PI,tilt:sim.read().tilt,release_speed_rad_s:sim.read().omega};
assert(sim.takeBag());const p=sim.point(3);assert(sim.press(p.x,p.z));star.run(.45);sim.release();assert(sim.parkBag());star.run(1);
const cutFace=-sim.read().rotation;assert(sim.serve());star.run(3.85);
assert.equal(sim.read().phase,'served');assert.equal(sim.read().cutAngle,cutFace);assert(sim.read().flowers[0].mass>0);
const portion=sim.read().portion;
assert(portion.flowers.length>0);
results.serving={angle_deg:cutFace*180/Math.PI,flower_mass_g:portion.flowers.reduce((sum,i)=>sum+sim.read().flowers[i].mass,0),
  has_transferred_flower:portion.transfer>=0};
sim.clearBoard();star.run(2.05);assert.equal(sim.read().batch,1);assert.equal(sim.read().phase,'berries');assert.equal(sim.read().flowers.length,0);
const together=createKitchen(),split=createKitchen();
together.step(10);for(let i=0;i<200;i++)split.step(dt);
assert.deepEqual(together.getState(),split.getState());
assert(maxima.temperature_C<.005&&maxima.radius_cm<.21&&maxima.tip_cm<.15&&maxima.bend_cm<.20);
assert(localChanges.uniformHeat===0&&localChanges.uniformWater===0&&localChanges.uniformBerry===0);
const out=path.join(__dirname,'state-trace.jsonl.gz');
fs.writeFileSync(out,zlib.gzipSync(records.join('\n')+'\n',{level:8}));
console.log(JSON.stringify({samples:records.length,interval_s:dt,localChanges,results,maxima},null,2));
