'use strict';
// Run with Node. The CSV stores witnesses and the worst change over EVERY cell at 50 ms intervals.
// Length conversions use the scene model's scale of 80 mm per world unit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {create} = require('../simulation.js');
const dt = .05;
const mean = (cells, field) => cells.reduce((a, c) => a + c[field], 0) / cells.length;
const span = items => Math.max(...items) - Math.min(...items);
const fields = [
  ['dough','temperature'],['dough','water'],['dough','starch'],['dough','stretch'],
  ['water','height'],['skin','temperature'],['skin','wet'],['skin','powder'],
  ['wetWire','film'],['powder','depth'],['powder','wet']
];
const labels = fields.map(x=>x.join('_'));
const maxima = new Array(fields.length).fill(0);
const activeIntervals = new Array(fields.length).fill(0);
const uniform = new Array(fields.length).fill(0);
let maxReservoirStep=0;
const records=[['trial','s','phase','mass_g','paddle_z_mm','spoon_extension_mm','water_x_mm','water_z_mm','net_height_mm','mesh_water_fraction','tray_tilt_rad','roll_rad','steam_count','max_wave_mm','temperature_sector0_C','skin_water_sector17','coating_sector17','powder_depth_center_mm',...labels.map(l=>'max_delta_'+l)].join(',')];
const out={};
function scenario(tag,opts={}){
  const g=create(opts),s=g.state,events=[];
  const areas=fields.map(([which])=>which==='water'?s.water.filter(q=>q.inside):s[which]);
  const rows=areas.map((cells,j)=>cells.map(c=>c[fields[j][1]]));
  let steps=0;
  function advance(n){
    const count=Math.round(n/dt);
    for(let i=0;i<count;i++){
      const previousReservoir=s.net.reservoir;steps++;g.step(dt);maxReservoirStep=Math.max(maxReservoirStep,Math.abs(s.net.reservoir-previousReservoir));
      for(const event of g.takeEvents())events.push({...event,time:steps*dt});
      const between=areas.map((cells,j)=>{
        let lo=Infinity,hi=-Infinity,largest=0;
        const name=fields[j][1],previous=rows[j];
        for(let k=0;k<cells.length;k++){
          const value=cells[k][name],diff=value-previous[k];
          assert.ok(Number.isFinite(value),tag+' '+name);lo=Math.min(lo,diff);hi=Math.max(hi,diff);
          largest=Math.max(largest,Math.abs(diff));previous[k]=value;
        }
        maxima[j]=Math.max(maxima[j],largest);
        if(largest>1e-7){activeIntervals[j]++;if(hi-lo<1e-9)uniform[j]++;}
        return largest;
      });
      const values=[tag,(steps*dt).toFixed(2),s.phase,s.mass,s.paddle.z*80,s.bite.elongation*.62*.38*80,s.bite.x*120.8,s.bite.z*120.8,s.net.depth*80,s.net.reservoir,s.tray.tilt,s.bite.angle,s.air.plumes.length,Math.max(...areas[4].map(c=>Math.abs(c.height))),s.dough[0].temperature,s.skin[17].wet,s.skin[17].powder,s.powder[246].depth,...between];
      records.push(values.map(v=>typeof v==='number'?Number(v.toFixed(7)):v).join(','));
    }
  }
  function until(phase,max=20){
    for(let i=0;s.phase!==phase&&i<max/dt;i++)advance(dt);
    assert.equal(s.phase,phase,tag+' reaches '+phase);
  }
  function prepare(){
    for(let i=0;s.phase==='fold'&&i<18;i++){g.begin('paddle',-.48,.67);g.end();advance(.90);}
    until('spoon');
  }
  function quench(x=.15,z=-.06){
    prepare();g.begin('spoon');g.move(.63,.10);advance(.4);g.end();
    assert.ok(g.begin('bowl',x,z));until('fish');
  }
  function land(){
    quench();advance(1.5);g.begin('net',.54,.42);g.end();until('drain');until('coat');
  }
  function setContactWater(level){
    const j=labels.indexOf('skin_wet');
    s.skin.forEach((c,i)=>{c.wet=level+c.x*.025;rows[j][i]=c.wet;});
  }
  return {g,s,advance,until,prepare,quench,land,events,setContactWater};
}
const idle=scenario('idle'),initial=idle.g.getState();
idle.advance(10);
out.idle={seconds:idle.s.time,startC:initial.dough[0].temperature,endC:idle.s.dough[0].temperature,steam:idle.s.air.plumes.length,windGrains:idle.s.air.puffs,waveMm:Math.max(...idle.s.water.map(c=>Math.abs(c.height))),tempChangeSpreadC:span(idle.s.dough.map((c,i)=>c.temperature-initial.dough[i].temperature))};
assert.equal(idle.s.phase,'fold');assert.ok(out.idle.waveMm>.005&&out.idle.steam>0&&out.idle.tempChangeSpreadC>.1);
assert.equal(idle.g.begin('tray'),false);
const massRun=mass=>{
  const a=scenario('mass'+mass,{mass});a.g.begin('paddle',-.52,.67);
  let max=0,back=0;
  for(let k=0;k<20;k++){a.advance(dt);max=Math.max(max,...a.s.dough.map(c=>c.stretch));back=Math.max(back,-a.s.paddle.z*80);if(k===7)a.g.end();}
  return {massG:mass,stretch:max,retreatMm:back,starch:mean(a.s.dough,'starch')};
};
out.mass=[massRun(175),massRun(300)];assert.ok(out.mass[0].stretch>out.mass[1].stretch*1.25);
function pull(temp){
  const a=scenario('warmth'+temp,{temperature:temp});
  a.prepare();a.advance(1);const start=mean(a.s.skin,'temperature');a.g.begin('spoon',0,0);
  let max=0;
  for(let k=0;k<20;k++){
    if(k<5)a.g.move((k+1)*.15,(k+1)*.035);
    if(k===5)a.g.end();a.advance(dt);max=Math.max(max,a.s.bite.elongation*.62*.38*80);
  }return {temperatureC:start,extensionMm:max};
}
out.pull=[pull(73),pull(43)];assert.ok(out.pull[0].extensionMm>out.pull[1].extensionMm*1.6);
function reflect(x){
  const a=scenario('drop'+x);a.quench(x,.02);
  let returning=0,crest=0,skinSwing=0;
  for(let k=0;k<46;k++){a.advance(dt);returning=Math.max(returning,-a.s.bite.vx*120.8);crest=Math.max(crest,...a.s.water.map(c=>Math.abs(c.height)));skinSwing=Math.max(skinSwing,...a.s.skin.map(c=>Math.abs(c.elastic)));}
  return {xMm:x*120.8,returnMmPerS:returning,crestMm:crest,skinSwing,temperatureC:mean(a.s.skin,'temperature')};
}
out.wave=[reflect(0),reflect(.88)];assert.ok(out.wave[1].returnMmPerS>out.wave[0].returnMmPerS+15);
function chase(side){
  const a=scenario(side?'side':'rest');a.quench(-.17,.12);a.advance(1.1);
  const x=a.s.bite.x,z=a.s.bite.z;a.g.begin('net',x-.4,z);
  a.g.move(x-.2,z);a.advance(.2);
  for(let i=0;i<7;i++){if(side)a.g.move(x-.2+i*.058,z);a.advance(dt);}
  return {xMm:a.s.bite.x*120.8,vxMmS:a.s.bite.vx*120.8,phase:a.s.phase};
}
out.chase=[chase(false),chase(true)];assert.equal(out.chase[1].phase,'fish');assert.ok(out.chase[1].vxMmS>out.chase[0].vxMmS+12);
function shake(doShake){
  const a=scenario(doShake?'shake':'still-net');a.quench(.1,.2);a.advance(1.6);a.g.begin('net');a.g.end();a.until('drain');a.advance(.70);
  if(doShake)a.g.begin('net',.1,.3);
  for(let i=0;i<12;i++){if(doShake)a.g.move(.1+(i%2?.055:-.055),.3);a.advance(dt);}
  a.g.end();
  return {onNet:a.s.bite.netLoad,waterFraction:a.s.net.reservoir,skinWater:mean(a.s.skin,'wet'),rain:a.events.filter(e=>e.type==='drip').length,wireFilm:mean(a.s.wetWire,'film')};
}
out.drain=[shake(false),shake(true)];assert.equal(out.drain[1].onNet,1);assert.ok(out.drain[1].waterFraction<out.drain[0].waterFraction-.025);
function coating(wet){
  const a=scenario(wet?'damp-side':'dry-side');a.land();
  // A controlled intervention: wet just the same contact patches; rebaseline before measuring.
  // A companion trial follows the identical trajectory with dry patches.
  a.setContactWater(wet?.68:.08);
  a.advance(1.2);
  const side1=a.s.skin.filter(c=>c.y<-.64),side2=a.s.skin.filter(c=>c.y>.64);
  const before={bottom:mean(side1,'powder'),top:mean(side2,'powder'),dampness:Math.max(...a.s.powder.map(c=>c.wet)),bed:Math.min(...a.s.powder.map(c=>c.depth))};
  a.g.begin('tray',-.7,0);a.g.end();a.advance(1.6);
  return {...before,rollRad:a.s.bite.angle,upperAfter:mean(side2,'powder'),powderSound:a.events.filter(e=>e.type==='powder').length};
}
out.flour=[coating(false),coating(true)];
assert.ok(out.flour[1].bottom>.55&&out.flour[1].top<.04&&out.flour[1].dampness>out.flour[0].dampness*3&&out.flour[1].upperAfter>.13);
const loop=scenario('whole-cycle');loop.land();loop.advance(.75);
for(let i=0;i<5&&loop.s.phase==='coat';i++){loop.g.begin('tray',-.8,0);loop.g.end();loop.advance(2);}
loop.until('serve');loop.g.begin('cup');loop.g.end();loop.until('fold');
assert.equal(loop.s.batch,2);assert.equal(loop.s.bite.netLoad,0);
const plop=loop.events.find(e=>e.type==='plop'),drop=loop.events.findLast(e=>e.type==='drip'),puff=loop.events.find(e=>e.type==='powder');
assert.ok(plop.time<drop.time&&drop.time<puff.time);
out.sounds={plopSeconds:plop.time,lastDropSeconds:drop.time,powderSeconds:puff.time};
// Three unhurried servings preserve the same world and its accumulated moisture.
const long=scenario('three-servings');
for(let batch=0;batch<3;batch++){
  long.advance(6);long.quench(batch===1?.85:-.23,.14);long.advance(21);
  long.g.begin('net');long.g.end();long.until('coat');long.advance(15);
  for(let i=0;i<5&&long.s.phase==='coat';i++){long.g.begin('tray',-.73,0);long.g.end();long.advance(2.25);}
  long.until('serve');long.advance(3);long.g.begin('cup');long.g.end();long.until('fold');
}
assert.ok(long.s.time>=180&&long.s.batch===4);
out.sustained={seconds:long.s.time,servings:long.s.batch-1};
out.locality=Object.fromEntries(labels.map((l,i)=>[l,{max50ms:maxima[i],active:activeIntervals[i],uniform:uniform[i]}]));
assert.ok(maxima[0]<1.3&&maxima[2]<.16&&maxima[3]<.24&&maxima[4]<2.5&&maxima[5]<4.5&&maxima[7]<.13&&maxima[9]<.40);
assert.ok(maxReservoirStep<.16,'mesh fills and drains continuously');out.maxReservoirStep=maxReservoirStep;
assert.ok(uniform.every(n=>n===0),'spatial fields must respond locally');
const filename=path.join(__dirname,'state-trace.csv');
fs.writeFileSync(filename,records.join('\n')+'\n');
console.log(JSON.stringify({...out,intervals:records.length-1},null,2));
