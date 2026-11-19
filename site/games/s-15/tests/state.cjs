'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const assert=require('node:assert/strict');
const {createKitchen,N,R,H,mean}=require('../kitchen.js');
const dt=.05,trace=fs.createWriteStream(path.join(__dirname,'state-005s.jsonl.gz')),zip=zlib.createGzip({level:6});zip.pipe(trace);
const metrics={},changes={},phases=[],local={},boundaries={};
const scalar=['volume','jugMl','custardLiftMm','tilt','drop','flux','moldX','moldZ','push','lift','turn','heat','cold','fogCleared'];
const fields=['h','v','temp','gel','jig','fog','beads','film','frontMm','pool','run','trail','iceMass'];
const round=x=>+x.toFixed(6),maxAbs=a=>Math.max(...a.map(Math.abs)),range=a=>Math.max(...a)-Math.min(...a);
const wave=s=>Math.sqrt(mean(s.h.map(x=>x*x)));
const centroid=s=>s.pool.reduce((t,m,i)=>t+m*Math.cos(i/N*2*Math.PI),0)/(s.pool.reduce((a,b)=>a+b,0)||1);
const totalCaramel=s=>['film','pool','run','trail'].reduce((v,k)=>v+s[k].reduce((a,b)=>a+b,0),0);
const prior=new Map(),soundEvents={};
function record(name,sim){
 const s=sim.state,old=prior.get(name),data={case:name,time:round(s.clock),stage:s.stage,batch:s.cycles};
 for(const k of scalar)data[k]=round(s[k]);
 for(const k of fields)data[k]=Array.from(s[k],round);
 data.steam=s.steam.map(p=>[round(p.x),round(p.y),round(p.life)]);
 data.potTemp=round(s.potTemp);
 data.events=s.events.splice(0).map(e=>e.type);
 if(name==='serving'){for(const type of data.events){const event=soundEvents[type]??={count:0,first:data.time,last:data.time};event.count++;event.last=data.time}}
 zip.write(JSON.stringify(data)+'\n');
 if(old){
   assert.ok(Math.abs(data.time-old.time-dt)<.0000011,'sampling interval');
   for(const k of [...scalar,...fields]){
     const a=Array.isArray(data[k])?data[k]:[data[k]],b=Array.isArray(old[k])?old[k]:[old[k]];
     const diff=a.map((v,i)=>v-b[i]),max=maxAbs(diff);
     if(old.batch===data.batch){
       if(!changes[k]||changes[k].max<max)changes[k]={max:round(max),case:name,stage:s.stage,time:data.time};
       if(fields.includes(k)&&max>.00001){
         const v=local[k]??={moving:0,uniform:0};v.moving++;if(range(diff)<.0000005)v.uniform++}
     }else boundaries[k]=round(max);
   }
 }
 prior.set(name,data);
}
function tick(name,sim,input){input?.();sim.step(dt);record(name,sim)}
function ticks(name,sim,count,input){for(let i=0;i<count;i++)tick(name,sim,()=>input?.(i))}
const idle=createKitchen();record('untouched',idle);
const initial=idle.getState();ticks('untouched',idle,200);let a=idle.state;
metrics.idle={seconds:a.clock,potInitial:initial.potTemp,potFinal:a.potTemp,dropGrowth:a.drop-initial.drop,steamTravel:Math.hypot(a.steam[1].x-initial.steam[1].x,a.steam[1].y-initial.steam[1].y),fogRange:range(a.fog),volume:a.volume};
assert.equal(a.volume,0);assert.equal(a.stage,'pour');assert.ok(a.potTemp-initial.potTemp>2);
assert.ok(a.drop-initial.drop>.02);assert.ok(metrics.idle.steamTravel>.02);
assert.equal(idle.down('mold'),false);
// Only fill volume differs in this pair. The same acceleration excites the two free surfaces.
function amountCase(volume,label,firmness=0){
 let k=createKitchen({volume,firmness});k.state.stage='slide';record(label,k);k.down('mold');let peak=0,after=0,sample=0;
 ticks(label,k,80,i=>{if(i<8)k.move(.026,0);if(i===8)k.up();if(i===12)sample=wave(k.state);if(i===18)after=wave(k.state);peak=Math.max(peak,wave(k.state))});
 return {sample,peak,after,sim:k};
}
let light=amountCase(44,'44mL'),full=amountCase(132,'132mL'),firm=amountCase(132,'132mL-set',.87);
metrics.conditions={lightVolume:44,fullVolume:132,lightRms:light.sample,fullRms:full.sample,firmRms:firm.sample,softPeak:full.peak,firmPeak:firm.peak,afterRelease:full.after};
assert.ok(Math.abs(light.sample-full.sample)>.001);assert.ok(firm.peak<full.peak*.35);assert.ok(full.after>.07);
const game=createKitchen(),s=game.state,amount=totalCaramel(s);record('serving',game);
function run(n,input){ticks('serving',game,n,input)}
function until(stage,limit,input){
 let n=0;while(s.stage!==stage&&n<limit){tick('serving',game,()=>input?.(n));n++}
 assert.equal(s.stage,stage,'stage after '+n*dt+' seconds');phases.push({stage,time:round(s.clock)});
}
run(81);game.down('jug');run(8);assert.ok(s.volume>0);metrics.firstDrop={mL:s.volume,rings:s.ringCount};
game.up();run(21);game.down('jug');run(63,i=>{if(i%2===0)game.move(-.0032,.001)});game.up();
metrics.thin={volume:s.volume,flux:s.flux,rings:s.ringCount};
run(24);metrics.still={flux:s.flux,rms:wave(s)};assert.equal(s.flux,0);
until('slide',2400,i=>{if(i%62===0)game.down('jug');if(i%62<38)game.move(-.030,.009);if(i%62===38)game.up()});
game.down('mold');run(14,()=>game.move(.019,.0002));game.up();metrics.slide={velocity:s.vx,rms:wave(s)};run(12);metrics.slide.after=wave(s);
game.down('mold');until('load',180,()=>game.move(-.009,-.041));
until('wipe',140);run(35);
let fogBefore=mean(s.fog),beadBefore=Math.max(...s.beads),clearedAtStart=s.fogCleared;game.down('lid',.47,.04);
until('steam',2100,i=>{let a=i*.085;game.move(Math.cos(a)*.024,Math.sin(a)*.024,.49*Math.cos(a),.49*Math.sin(a))});
game.up();metrics.glass={meanBefore:fogBefore,meanAfter:mean(s.fog),beadBefore,beadAfter:Math.max(...s.beads),clear:s.fogCleared,startClear:clearedAtStart};
assert.ok(metrics.glass.meanAfter<metrics.glass.meanBefore);assert.ok(metrics.glass.beadAfter>beadBefore+.01);
let gradient=0,gelGap=0;
until('jiggle',2200,()=>{let edge=mean(s.temp.slice((R-1)*N)),center=mean(s.temp.slice(0,N)),d=edge-center;
 if(d>gradient){gradient=d;metrics.thermal={edge,center,gap:d}}
 const edgeGel=mean(s.gel.slice((R-1)*N)),centerGel=mean(s.gel.slice(0,N));
 if(edgeGel-centerGel>gelGap){gelGap=edgeGel-centerGel;metrics.setting={edge:edgeGel,center:centerGel,gap:gelGap}}
});assert.ok(gradient>7&&gelGap>.1);
let jig=0;until('chill',130,()=>jig=Math.max(jig,maxAbs(s.jig)));metrics.setting.jigMm=jig;
const iceBefore=Array.from(s.iceMass);let startC=s.cold;
until('plate',1600,i=>{if(i===55)game.down('ice');if(i>55&&i<160)game.move(.017,.018);if(i===160)game.up()});
metrics.cool={initial:startC,final:s.cold,meltMax:Math.max(...iceBefore.map((m,i)=>m-s.iceMass[i])),meltMin:Math.min(...iceBefore.map((m,i)=>m-s.iceMass[i]))};
run(40);game.down('plate');until('turn',100);run(30);game.down('grip');
until('lift',400,i=>{if(i%6<4)game.move(.016,.004)});game.up();run(32);game.down('mold');
let releaseHeight=null,syrupAt=null,shoulderAt=null,adhered=0;
until('serve',600,i=>{if(i%14<9)game.move(0,-.016);if(s.pop&&releaseHeight===null)releaseHeight=s.lift;
 if(syrupAt===null&&Math.max(...s.frontMm)>.1)syrupAt=s.age;
 if(shoulderAt===null&&.935+s.lift*.996-.735>.177+.56+s.custardLiftMm*.01)shoulderAt=s.age;
 adhered=Math.max(adhered,s.custardLiftMm)
});assert.ok(shoulderAt>syrupAt);
metrics.release={popLift:releaseHeight,syrupAt,shoulderAt,adheredMm:adhered,maxFront:Math.max(...s.frontMm),minFront:Math.min(...s.frontMm),syrup:totalCaramel(s)};
game.down('dish');run(210,i=>{if(i%5===0)game.move(.025,0)});let right=centroid(s),maxTrail=Math.max(...s.trail);
run(260,i=>{if(i%4===0)game.move(-.041,0)});let left=centroid(s);
metrics.caramel={right,left,trailBefore:maxTrail,trailAfter:Math.max(...s.trail),massError:Math.abs(totalCaramel(s)-amount),front:Math.max(...s.frontMm),frontMin:Math.min(...s.frontMm)};
assert.ok(left<right-.06);assert.ok(metrics.caramel.massError<.00001);assert.ok(metrics.caramel.trailAfter>0);
game.up();run(50);game.down('dish');until('receive',240,()=>game.move(.002,-.031));
until('pour',260);assert.equal(s.cycles,1);assert.equal(s.volume,0);assert.equal(s.pop,false);
metrics.duration=s.clock;
assert.equal(soundEvents.pop.count,1);assert.equal(soundEvents.clink.count,1);
metrics.audio={bubbleCount:soundEvents.bubble.count,popCount:soundEvents.pop.count,popTime:soundEvents.pop.first,clinkCount:soundEvents.clink.count,clinkTime:soundEvents.clink.first};
game.down('jug');game.up();run(9);assert.ok(s.volume>0&&s.ringCount===1,'the next serving responds');
assert.ok(changes.cold.max<1);assert.ok(changes.heat.max<.01);
const oneStep=createKitchen(),manySteps=createKitchen();oneStep.step(1);for(let i=0;i<20;i++)manySteps.step(.05);
assert.deepEqual(oneStep.getState(),manySteps.getState());
for(const key of ['h','temp','gel','jig','fog','beads','film','frontMm','pool','run','trail','iceMass'])assert.equal(local[key]?.uniform,0,'spatially uniform changes in '+key);
assert.ok(changes.temp.max<1.2);assert.ok(changes.gel.max<.012);assert.ok(changes.fog.max<.18);assert.ok(changes.lift.max<.06);assert.ok(changes.h.max<1, JSON.stringify(changes.h));
assert.ok(changes.frontMm.max<1.5);
const report={dt,steps:'fixed 1/120 s',metrics,phases,maxPerSample:changes,newBatchBoundary:boundaries,spatialChecks:local};
fs.writeFileSync(path.join(__dirname,'measurements.json'),JSON.stringify(report,(_,v)=>typeof v==='number'?round(v):v,2)+'\n');
zip.end();console.log(JSON.stringify(report,(_,v)=>typeof v==='number'?round(v):v,2));
