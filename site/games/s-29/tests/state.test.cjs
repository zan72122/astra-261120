'use strict';
const {Table,start,rest}=require('../sugar.js');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const dt=.05,cm=4,round=x=>Math.round(x*1e5)/1e5;
const trace=[],summary={},max={temperature:0,radius:0,hardness:0,lift:0,stone:0,oil:0,ladleTravel:0,tilt:0,plate:0};
let uniformSteps=0,steps=0,steamBirths=0,birthOpacity=0,largestWrap=0;const previous=new WeakMap();
function sample(s,name){
  const prev=previous.get(s);
  const cells=s.stone.map(c=>[c.temperature,c.oil]);
  const nodes=s.nodes.map(n=>[n.x,n.z,n.mass,n.radius,n.temperature,n.hardness,n.lift,n.bond,n.depth,n.component,n.separation,n.tension,n.surfaceHeat]);
  if(prev){
    for(let i=0;i<s.steam.length;i++){const p=s.steam[i],old=prev.steam[i];if(p.y<old[0]){steamBirths++;
      largestWrap=Math.max(largestWrap,(old[0]-p.y)*cm);
      const opacity=.083*Math.sin(Math.PI*Math.min(1,p.y/(1.65+p.life)))*(.69+.3*Math.sin(p.spin));
      birthOpacity=Math.max(birthOpacity,old[1],opacity);}}
    const changes=cells.map(([t,o],i)=>{const d=t-prev.cells[i][0];max.stone=Math.max(max.stone,Math.abs(d));max.oil=Math.max(max.oil,Math.abs(o-prev.cells[i][1]));return d;});
    if(Math.max(...changes)-Math.min(...changes)<1e-10)uniformSteps++;steps++;
    if(s.cycle===prev.cycle){
      max.ladleTravel=Math.max(max.ladleTravel,Math.hypot(s.ladle.x-prev.x,s.ladle.z-prev.z)*cm);
      max.tilt=Math.max(max.tilt,Math.abs(s.leaf.angle-prev.angle)*180/Math.PI);
      max.plate=Math.max(max.plate,Math.abs(s.plate-prev.plate));
      for(let i=0;i<Math.min(prev.nodes.length,nodes.length);i++){const a=nodes[i],b=prev.nodes[i];
        for(const [key,j] of [['temperature',4],['radius',3],['hardness',5],['lift',6]])max[key]=Math.max(max[key],Math.abs(a[j]-b[j]));}
    }
  }
  previous.set(s,{cells,nodes,steam:s.steam.map(p=>[p.y,.083*Math.sin(Math.PI*Math.min(1,p.y/(1.65+p.life)))*(.69+.3*Math.sin(p.spin))]),cycle:s.cycle,x:s.ladle.x,z:s.ladle.z,angle:s.leaf.angle,plate:s.plate});
  const q=a=>a.map(round);
  trace.push(JSON.stringify({case:name,t:round(s.time),cycle:s.cycle,phase:s.phase,held:s.held,mass:round(s.mass),ladle:q([s.ladle.x,s.ladle.z,s.ladle.height,s.ladle.temperature,s.ladle.drop,s.ladle.flux]),air:q([s.air.wind,s.air.bend,s.demo,s.helper.x,s.helper.z]),steam:s.steam.map(p=>q([p.x,p.y,p.z,p.v])),motes:s.motes.map(p=>q([p.x,p.y,p.z])),stone:cells.map(q),nodes:nodes.map(q),edges:s.edges.map(e=>[e.a,e.b,e.type==='weld'?round(e.adhesion):0]),blade:q([s.blade.progress,s.blade.contact,s.blade.scrape]),leaf:q([s.leaf.angle,s.leaf.height,s.leaf.shadowWidth]),acoustics:q([s.acoustics.impactHz,s.acoustics.decay,s.acoustics.scrapeHz,s.acoustics.gain]),plate:round(s.plate),serve:round(s.serve),windows:s.windows}));
}
function fixture(name,options){const s=new Table(options);sample(s,name);return {s,tick(seconds,action){const count=Math.round(seconds/dt);for(let i=0;i<count;i++){if(action)action(i);s.step(dt);sample(s,name);}},line(x,z,seconds){const n=Math.round(seconds/dt),dx=(x-s.ladle.tx)/n,dz=(z-s.ladle.tz)/n;this.tick(seconds,()=>s.move(dx,dz));this.tick(.25);}};}
function snapshot(s){const copy=s.getState();copy.ladle.x=100;assert.notEqual(s.ladle.x,copy.ladle.x);}
const idle=fixture('idle');const initial=idle.s.getState();idle.tick(4);assert.equal(idle.s.demo,0);idle.tick(6);
assert.equal(idle.s.phase,'stem');assert.equal(idle.s.nodes.length,0);assert.ok(idle.s.demo>.9);snapshot(idle.s);
const dtile=idle.s.stone.map((c,i)=>c.temperature-initial.stone[i].temperature);
summary.idle={dropInitial_g:initial.ladle.drop,dropAfter10_g:idle.s.ladle.drop,minTileChange_C:Math.min(...dtile),maxTileChange_C:Math.max(...dtile),steam0Rise_cm:cm*idle.s.steam[0].y,windBend:idle.s.air.bend,helperOffset_cm:cm*Math.hypot(idle.s.helper.x,idle.s.helper.z)};
assert.ok(summary.idle.maxTileChange_C-summary.idle.minTileChange_C>.2);
function straight(name,options,duration,travel=2.52){
  const f=fixture(name,options);f.s.press('ladle');f.line(start.x+travel,start.z,duration);f.s.release();f.tick(1);
  const mid=f.s.nodes.slice(3,-3);const diameter=mid.reduce((a,p)=>a+p.radius*2*cm,0)/mid.length;
  const grams=f.s.nodes.reduce((a,p)=>a+p.mass,0);return {diameter_cm:diameter,grams,line_cm:f.s.length*cm,endTemperature_C:f.s.nodes.at(-1).temperature};
}
summary.fast=straight('fast',{},1.35);summary.slow=straight('slow',{},4.55);
const trackAt=(name,t)=>JSON.parse(trace.find(v=>{const a=JSON.parse(v);return a.case===name&&Math.abs(a.t-t)<.0001;}));
for(const key of ['fast','slow']){const snap=trackAt(key,1.35);summary[key].lengthAt135_cm=snap.edges.reduce((s,[a,b])=>s+cm*Math.hypot(snap.nodes[a][0]-snap.nodes[b][0],snap.nodes[a][1]-snap.nodes[b][1]),0);}
assert.ok(summary.fast.lengthAt135_cm>summary.slow.lengthAt135_cm*2);
assert.ok(summary.fast.diameter_cm<summary.slow.diameter_cm*.85);
summary.smallBatch=straight('8g',{mass:8},3);summary.largeBatch=straight('24g',{mass:24},3);
assert.ok(summary.largeBatch.grams>summary.smallBatch.grams);
summary.coolBatch=straight('112C',{temperature:112},3);summary.hotBatch=straight('137C',{temperature:137},3);
assert.ok(summary.coolBatch.endTemperature_C+5<summary.hotBatch.endTemperature_C);
const thickness=fixture('cooling');
thickness.s.addNode(-.42,.09,.024,false);thickness.s.addNode(-.05,.12,.21,false);thickness.tick(6);
const [thin,thick]=thickness.s.nodes;summary.cooling={thinTemp_C:thin.temperature,thickTemp_C:thick.temperature,thinHardness:thin.hardness,thickHardness:thick.hardness};assert.ok(thin.hardness>thick.hardness+.15);
const f=fixture('whole-round'),s=f.s,visited=new Set([s.phase]);const phases=()=>visited.add(s.phase);
assert.equal(s.press('plate'),false);assert.equal(s.press('blade'),false);assert.equal(s.press(''),false);
s.press('ladle');summary.impact={frequency_Hz:s.acoustics.impactHz,decay_ms:s.acoustics.decay*1000};f.tick(.3);const beadBefore=s.nodes[0].radius;f.tick(1.2);
summary.bead={fromDiameter_cm:beadBefore*8,toDiameter_cm:s.nodes[0].radius*8,mass_g:s.nodes[0].mass};assert.ok(s.nodes[0].radius>beadBefore*1.4);
f.line(1.02,-1.34,4.2);phases();assert.equal(s.phase,'lace');f.line(1.75,-.23,2);f.line(.03,.06,2);f.line(-.52,-.63,1.7);f.line(start.x,start.z,2.5);
assert.ok(s.windows>=1);const before=s.nodes.length;
const widths=s.nodes.map(p=>p.radius*(1+.115*p.depth)*80);
f.line(.54,-.66,3.15);
summary.weld={windows:s.windows,contacts:s.welds,maxLayers:Math.max(...s.nodes.map(p=>p.depth)),adhesion:Math.max(...s.nodes.map(p=>p.bond)),beforeRetraceNodes:before};
let thickening=0,index=0;for(let i=0;i<before;i++){const p=s.nodes[i],d=p.radius*(1+.115*p.depth)*80-widths[i];if(p.coats>0&&d>thickening){thickening=d;index=i;}}
summary.weld.previousWidth_mm=widths[index];summary.weld.overlaidWidth_mm=widths[index]+thickening;assert.ok(thickening>.1);
assert.ok(summary.weld.contacts>0);assert.ok(summary.weld.adhesion>.8);
// A fast reposition breaks the stream. The following bead has no edge to the main stick.
s.move(-3.4,-.95);f.tick(1.5);s.release();f.tick(1);const groups=new Set(s.nodes.map(n=>n.component));assert.ok(groups.size>=2);
const loose=s.nodes.filter(p=>p.component!==s.nodes[0].component);
s.press('rest');phases();f.tick(5);phases();assert.equal(s.phase,'join');assert.equal(s.press('blade'),false);s.press('joint');f.tick(4);phases();assert.equal(s.phase,'peel');
s.press('blade');let frontAt=-1,backAt=-1,peakScrape=0,peakHz=0,lead=0;
for(let i=0;i<1100&&s.phase==='peel';i++){f.tick(dt,()=>s.move(.043,-.036));peakScrape=Math.max(peakScrape,s.blade.scrape);peakHz=Math.max(peakHz,s.acoustics.scrapeHz);
  const lifts=s.nodes.map(p=>p.lift);lead=Math.max(lead,Math.max(...lifts)-Math.min(...lifts));if(frontAt<0&&Math.max(...lifts)>.50)frontAt=s.time;if(backAt<0&&Math.min(...lifts)>.50)backAt=s.time;}
assert.equal(s.phase,'shadow');phases();assert.ok(backAt>frontAt);
summary.peel={join_g:s.joinMass,firstToLast_s:backAt-frontAt,maxLiftDifference:lead,scrapePeak:peakScrape,peakScrape_Hz:peakHz,looseBeads:loose.length,components:groups.size,minLooseLift:Math.min(...loose.map(p=>p.lift))};
f.tick(3);s.press('stick');f.tick(.8,()=>s.move(0,-.075));s.release();f.tick(1);phases();assert.equal(s.phase,'serve');const farWidth=s.leaf.shadowWidth,farHeight=s.leaf.height;
s.press('stick');f.tick(1.4,()=>s.move(0,.105));s.release();f.tick(1.4);
summary.shadow={farHeight_cm:farHeight*cm,nearHeight_cm:s.leaf.height*cm,farPenumbra_mm:farWidth*40,nearPenumbra_mm:s.leaf.shadowWidth*40,tilt_deg:-s.leaf.angle*180/Math.PI};assert.ok(s.leaf.shadowWidth<farWidth);
s.press('plate');s.move(0,-.6);phases();assert.equal(s.phase,'carry');f.tick(6);phases();assert.equal(s.phase,'stem');assert.equal(s.cycle,1);assert.equal(s.nodes.length,0);assert.equal(visited.size,8);
s.press('ladle');f.tick(.20);assert.ok(s.nodes.length>0);assert.equal(s.cycle,1);
const refill=fixture('refill',{mass:.14});refill.s.press('ladle');refill.tick(7);assert.ok(refill.s.mass>4);assert.equal(refill.s.refill,null);refill.line(.9,-.5,3);assert.equal(refill.s.phase,'lace');
assert.ok(birthOpacity<.006);assert.equal(uniformSteps,0);assert.ok(max.temperature<4.4);assert.ok(max.radius*cm<.25);assert.ok(max.hardness<.11);assert.ok(max.lift<.25);assert.ok(max.tilt<5);
summary.audit={interval_s:dt,records:trace.length,comparisons:steps,uniformSteps,steamBirths,maxSteamWrap_cm:largestWrap,maxBoundaryOpacity_percent:birthOpacity*100,temperature_C:max.temperature,radius_mm:max.radius*40,hardness:max.hardness,lift:max.lift,stone_C:max.stone,oil:max.oil,ladleTravel_cm:max.ladleTravel,tilt_deg:max.tilt,plateFraction:max.plate};
const location=path.join(__dirname,'trace.jsonl.gz');
fs.writeFileSync(location,zlib.gzipSync(trace.join('\n')+'\n',{level:8}));
console.log(JSON.stringify(summary,(_,v)=>typeof v==='number'?round(v):v,2));
