'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {makeKitchen,NX,NZ,MM_PER_UNIT:mm}=require('./kitchen.js');
const dt=.05,keys=['iron','heat','liquid','skin','water','toast','bean','coat','release'];
const units={iron:'°C',heat:'°C',liquid:'mL',skin:'mL',water:'fraction',toast:'fraction',bean:'mL',coat:'fraction',release:'fraction'};
const metrics={},maxima=Object.fromEntries(keys.map(k=>[k,0])),equalMoves=Object.fromEntries(keys.map(k=>[k,0]));
const nextBatchChanges={},motionMax={hingeDegrees:0,wingMassMl:0,crackRatio:0},logRows=[],output=path.join(__dirname,'measurements');
const sum=(s,k)=>s.cells.reduce((a,c)=>a+c[k],0),mass=(s,f=()=>true)=>s.cells.reduce((a,c)=>a+(f(c)?c.liquid+c.skin:0),0);
const mean=(s,k,f)=>{const a=s.cells.filter(f);return a.reduce((n,c)=>n+c[k],0)/a.length};
function stateCopy(s){return s.cells.map(c=>keys.map(k=>c[k]))}
function record(test,s,deltas={}){
 const row={case:test,t_s:s.time,batch:s.batch,stage:s.stage,liquid_ml:sum(s,'liquid'),skin_ml:sum(s,'skin'),tail_ml:mass(s,c=>c.u>.84),wing_ml:s.wings.reduce((a,w)=>a+w.mass,0),
 iron_nose_C:s.cells[5*NX+1].iron,iron_tail_C:s.cells[5*NX+NX-2].iron,skin_nose_C:s.cells[5*NX+1].heat,skin_tail_C:s.cells[5*NX+NX-2].heat,
 water_mean:sum(s,'water')/s.cells.length,bean_ml:sum(s,'bean'),bean_front_mm:s.beanReach*mm,coat:s.coat,toast:s.bake,hinge:s.hinge,rotation:s.turn+s.rest,
 released_eye:mean(s,'release',c=>c.u<.2),released_tail:mean(s,'release',c=>c.u>.85),peel_per_s:s.peel,steam:s.steam,puffs:s.particles.length,
 guide:s.guide,swing_rad:s.swing*.018,bag:s.bag,give:s.give,split:s.split,thin_fracture:Math.max(...s.wings.map(w=>w.crack))};
 for(const k of keys){row['max_step_'+k]=deltas[k]?.max||0;row['spatial_delta_range_'+k]=deltas[k]?.range||0}
 logRows.push(row);
}
function runCase(name){
 const g=makeKitchen(1234),s=g.getState();let previous=null,batch=s.batch,oldHinge=s.hinge,oldWings=s.wings.map(w=>[w.mass,w.crack]);
 function step(){
  if(!previous){record(name,s);previous=stateCopy(s)}
  g.step(dt);const next=stateCopy(s),deltas={};
  keys.forEach((k,j)=>{
   let lo=Infinity,hi=-Infinity,max=0;
   for(let i=0;i<next.length;i++){
    assert.ok(Number.isFinite(next[i][j]),k);const d=next[i][j]-previous[i][j];lo=Math.min(lo,d);hi=Math.max(hi,d);max=Math.max(max,Math.abs(d))
   }
   if(s.batch===batch){maxima[k]=Math.max(maxima[k],max);if(max>1e-8&&hi-lo<1e-10)equalMoves[k]++}
   else nextBatchChanges[k]=Math.max(nextBatchChanges[k]||0,max);
   deltas[k]={max,range:hi-lo}
  });
  if(s.batch===batch){motionMax.hingeDegrees=Math.max(motionMax.hingeDegrees,Math.abs(s.hinge-oldHinge)*(Math.PI-.87)*180/Math.PI);
   s.wings.forEach((w,i)=>{motionMax.wingMassMl=Math.max(motionMax.wingMassMl,Math.abs(w.mass-oldWings[i][0]));motionMax.crackRatio=Math.max(motionMax.crackRatio,Math.abs(w.crack-oldWings[i][1]))})}
  oldHinge=s.hinge;oldWings=s.wings.map(w=>[w.mass,w.crack]);record(name,s,deltas);previous=next;batch=s.batch
 }
 function advance(n){for(let i=0;i<Math.round(n/dt);i++)step()}
 function until(pred,limit=90){const start=s.time;while(!pred()&&s.time-start<limit)step();assert.ok(pred(),name+' timed out in '+s.stage)}
 return {g,s,step,advance,until}
}
// Ambient forces act on the lantern, local iron, first drop, and steam even before the first touch.
{
 const q=runCase('idle'),c=q.s.cells[5*NX+1],at=c.iron;q.advance(4.5);metrics.guideAt4_5=q.s.guide;q.advance(5.5);
 metrics.idle={seconds:q.s.time,noseIronBefore:at,noseIronAfter:c.iron,steamPuffs:q.s.particles.length,dropMl:mass(q.s),lanternDegrees:q.s.swing*.018*180/Math.PI};
 assert.equal(q.s.stage,'pour');assert.ok(metrics.guideAt4_5>.7&&Math.abs(c.iron-at)>1&&q.s.particles.length>0);
 assert.equal(q.g.begin('bag'),false)
}
function aimed(name,x,z,portion=1,t=1.65){
 const q=runCase(name);q.advance(1.0);q.s.portion=portion;q.g.begin('ladle');q.g.move(x,z,.01);q.advance(t);return q
}
const tail=aimed('tail_first',1.34,.22),nose=aimed('nose_first',-1.44,.02);
metrics.tail={tailFirstMl:mass(tail.s,c=>c.u>.84),noseFirstMl:mass(nose.s,c=>c.u>.84),duration:1.65};
assert.ok(metrics.tail.tailFirstMl>metrics.tail.noseFirstMl+1);
const low=aimed('small_portion',.12,0,.65),high=aimed('large_portion',.12,0,1.30);
metrics.portions={smallMl:mass(low.s),largeMl:mass(high.s)};assert.ok(metrics.portions.largeMl>metrics.portions.smallMl*1.7);
for(const temp of [90,175]){
 const q=runCase('iron_'+temp);q.s.cells.forEach(c=>c.iron=temp);q.advance(1);q.g.begin('ladle');q.g.move(.18,.05,.01);q.advance(3.5);
 metrics['setAt'+temp]={skinMl:sum(q.s,'skin'),meanSkinC:mean(q.s,'heat',c=>Math.abs(c.x-.18)<.22)} 
}
assert.ok(metrics.setAt175.skinMl>metrics.setAt90.skinMl*1.25);
const spill=aimed('rim',.15,-1.08,1,1.25),clean=aimed('center',.15,0,1,1.25);
metrics.wings={outsideMl:spill.s.wings.reduce((n,w)=>n+w.mass,0),insideMl:clean.s.wings.reduce((n,w)=>n+w.mass,0),populated:spill.s.wings.filter(w=>w.mass>.001).length};
assert.ok(metrics.wings.outsideMl>.1&&metrics.wings.insideMl<.00001);
function round(name,long,slow,q=runCase(name)){
 const {s,g,advance,until,step}=q,stages=['pour'],batch=s.batch,start=s.time;
 const cues={};let lastCue=0;
 function enter(stage){until(()=>{for(const e of s.events)if(e.id>lastCue){cues[e.kind]=(cues[e.kind]||0)+1;lastCue=e.id}return s.stage===stage});stages.push(stage)}
 advance(1);g.begin('ladle');g.move(.22,-1.03,.01);advance(.68);g.move(.65,.96,.01);advance(1.65);g.end();enter('fill');
 g.begin('spatula');g.move(-.72,.08,.01);for(let i=0;i<27;i++){g.move(-.72+(long?1.82:.41)*i/26,.08,.01);step()}g.end();
 enter('coat');const beanReach=s.beanReach*mm;const cutMl=s.cells.filter(c=>c.u>.65&&c.u<.74).reduce((n,c)=>n+c.bean,0);
 enter('close');g.begin('handle');g.end();enter('flip');g.begin('handle');g.end();enter('bake');enter('rest');enter('open');
 const baked=s.bake,openAt=s.time;g.begin('handle');if(!slow)g.end();
 until(()=>mean(s,'release',c=>c.u<.2)>.5);const head=s.time-openAt;
 until(()=>mean(s,'release',c=>c.u>.85)>.5);const tail=s.time-openAt;
 g.end();enter('bag');g.begin('bag');g.end();enter('gift');
 const thin=s.wings.filter(w=>w.mass>.006&&w.mass<.4).sort((a,b)=>b.mass-a.mass)[0],thick=s.wings.find(w=>w.mass>.58);
 assert.ok(thin&&thick);assert.ok(g.crack(thin.u,thin.v));for(let i=0;i<5;i++)g.crack(thick.u,thick.v);
 advance(.65);assert.ok(thin.crack>.96&&thick.crack===0);
 const wing={thinMl:thin.mass,thickMl:thick.mass,thinCrack:thin.crack,thickCrack:thick.crack};
 g.begin('split');g.end();advance(1.6);assert.ok(s.split>.95);
 g.begin('bag');g.end();enter('return');until(()=>s.batch===batch+1);assert.equal(s.stage,'pour');
 return {stages,cues,beanReachMm:beanReach,cutMl,baked,eyeReleaseS:head,tailReleaseS:tail,wing,loopS:s.time-start}
}
metrics.short=round('short_quick',false,false);metrics.long=round('long_slow',true,true);
assert.ok(metrics.long.cutMl>metrics.short.cutMl+.3);
assert.ok(metrics.long.tailReleaseS-metrics.long.eyeReleaseS>metrics.short.tailReleaseS-metrics.short.eyeReleaseS+1);
{
 const q=runCase('four_orders');for(let i=0;i<4;i++)round('four_orders',i%2===1,i%2===0,q);
 metrics.continuous={seconds:q.s.time,served:q.s.batch-1,nextLadleAcceptsTouch:q.g.begin('ladle')};
 assert.ok(metrics.continuous.seconds>180&&metrics.continuous.nextLadleAcceptsTouch)
}
{
 const die=require('./fish.js'),height=(x,z)=>{const uv=die.uv(x,z);return die.relief(uv.u,uv.v,x,z)};
 let rim=0;for(let i=0;i<48;i++){const a=Math.PI*2*i/48;rim+=height(-1.14+.174*Math.cos(a),-.15+.174*Math.sin(a))/48}
 const delta=(height(-1.14,-.15)-rim)*mm;metrics.eyeReliefMm={pastry:delta,iron:-.91*delta};
 assert.ok(delta>2)
}
assert.equal(Object.values(equalMoves).reduce((a,b)=>a+b,0),0);
assert.ok(maxima.heat<5&&maxima.iron<3&&maxima.liquid<.45&&maxima.skin<.06&&maxima.release<.30&&maxima.coat<.15,JSON.stringify(maxima));
fs.mkdirSync(output,{recursive:true});
const header=Object.keys(logRows[0]),csv=[header.join(','),...logRows.map(row=>header.map(k=>typeof row[k]==='number'?Number(row[k].toFixed(7)):row[k]).join(','))].join('\n')+'\n';
fs.writeFileSync(path.join(output,'steps.csv'),csv);
const report={stepSeconds:dt,cells:NX*NZ,samples:logRows.length,metrics,maxAdjacentWithinBatch:maxima,units,motionMax,uniformNonzeroSteps:equalMoves,maxAdjacentAcrossNewBatch:nextBatchChanges};
fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
