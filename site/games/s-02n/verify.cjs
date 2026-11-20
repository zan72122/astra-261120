'use strict';
// Run with node verify.cjs. No DOM, WebGL context or browser is needed.
const assert=require('node:assert/strict');
const A=require('./model.js'),D=require('./dough.js');
const s=A.create(),dt=1/60;
const tick=(seconds,world=s)=>{for(let i=0;i<Math.ceil(seconds/dt);i++)A.step(world,dt)};
const tap=(kind,id)=>{assert(A.begin(s,kind,id),kind);A.end(s);tick(2.8)};
const near=(a,b,eps=.01)=>assert(Math.abs(a-b)<eps,`${a} vs ${b}`);
const place=(kind,id,dest)=>{assert(A.begin(s,kind,id));A.drag(s,72,32,dest);tick(2.4);A.end(s);tick(2.2)};
const starting=s.cups.map(()=>D.build()),positions=starting.map(g=>g.p);
for(let i=0;i<3;i++){
  assert(A.begin(s,'jug'));assert.equal(s.active.id,i);
  A.drag(s,12,-9);tick([1.12,1.82,3.70][i]);A.end(s);tick(2);
  assert(s.cups[i].amount>.065);
}
assert(s.cups[0].amount<s.cups[1].amount&&s.cups[1].amount<s.cups[2].amount);
near(s.cups.reduce((a,c)=>a+c.amount-.002,0)+s.jug.remaining,3.05);
for(const c of s.cups)tap('cup',c.id);
assert(s.cups.every(c=>c.where==='rack'&&c.pos.y===A.K.rack.y));
for(const c of s.cups)for(const o of s.cups)if(c!==o)assert(A.dist(c.pos,o.pos)>6.75);
tap('lid');assert(s.coveredOnce&&s.lid.aperture<.01);
tap('knob');tick(5);
const rise=s.cups[0].rise;
assert(A.begin(s,'knob'));A.drag(s,-100,0);A.end(s);tick(3);
assert.equal(s.flame,0);near(s.cups[0].rise,rise);
assert(A.begin(s,'lid'));A.drag(s,0,-24);tick(.3);assert(s.lid.aperture>0&&s.lid.aperture<1);
A.end(s);tick(1.5);near(s.lid.aperture,0);
tap('knob');tick(22);assert(s.cups.every(c=>c.cooked>.95&&c.crack>.1));
tap('lid');assert.equal(s.lid.closed,false);
assert(A.begin(s,'stick'));tick(3.6);A.end(s);tick(2);
assert.equal(s.cups[0].holes.length,1);assert(s.stick.crumb>0&&s.stick.crumb<.3);
tap('knob');assert(s.flame<=.38);
assert(A.begin(s,'spread',0,{angle:s.cups[0].seed}));A.drag(s,46,0);tick(.8);A.end(s);
assert(s.cups[0].open[0]>.5);
const fingerprint=s.cups.map(c=>[c.amount,c.crack,c.holes.length,...c.open,c.wrinkle]);
for(const c of s.cups)tap('cup',c.id);
assert(s.cups.every(c=>c.where==='plate'));
tap('basket');assert.equal(s.basket.where,'tray');
assert(A.begin(s,'tray'));A.drag(s,0,-132,null,{span:264});tick(1.1);A.end(s);tick(1);
near(s.tray.progress,.5);near(s.tray.pos.y,A.K.rest.y);
assert(A.begin(s,'tray'));A.drag(s,0,-200,null,{span:264});tick(1.3);A.end(s);tick(1);
assert.equal(s.mode,'tea');
const cake=s.cups[0];place('cup',cake.id,{x:-72,z:-114});assert.equal(cake.where,'table');
for(let i=0;i<2;i++)place('tea',i,{x:-43+i*20,z:-120});
assert(s.teas.every(t=>t.placed));
place('plate',0,{x:-18,z:-175});assert(s.plate.given&&s.plate.detached);
for(let i=0;i<3;i++){
  const c=s.cups[i],g=starting[i];D.deform(g,c,s.time);assert.equal(g.p,positions[i]);
  assert(g.p.every(Number.isFinite));assert(Math.min(...g.p.filter((_,j)=>j%3===1))>.03);
  near(c.amount,fingerprint[i][0]);assert(c.crack>=fingerprint[i][1]);assert.equal(c.holes.length,fingerprint[i][2]);
  assert.deepEqual(c.open,fingerprint[i].slice(3,6));
}
const before=s.cups.map(c=>({...c.pos})),old=s.cups.slice();
assert(A.begin(s,'tray'));A.drag(s,0,300,null,{span:264});tick(2);A.end(s);tick(2);
assert.equal(s.batch,1);assert.equal(s.past.length,3);assert(s.cups.every(c=>c.id>=3));
s.past.forEach((c,i)=>{assert.equal(c,old[i]);assert.deepEqual(c.pos,before[i])});
tap('basket');assert.equal(s.basket.where,'stove');near(s.basket.pos.y,A.K.rack.y);
function steamed(power,seconds){
  const w=A.create(),c=w.cups[0];c.where='rack';c.amount=.67;w.coveredOnce=true;w.flame=power;w.boil=power;
  Object.assign(w.lid.pos,A.K.rack,{y:A.K.rim});w.lid.closed=true;tick(seconds,w);return c
}
const gentle=steamed(.24,60),strong=steamed(1,60);
assert(strong.rise>=gentle.rise&&strong.crack>gentle.crack&&A.surfaceHeight(strong,0)>A.surfaceHeight(gentle,0));
// Every non-degenerate triangle edge is joined to precisely one other triangle,
// including the three moist valley floors and the common bottom of the case.
const edges=new Map(),tri=starting[0].tri;
for(let i=0;i<tri.length;i+=3){
  const vertices=[tri[i],tri[i+1],tri[i+2]];if(new Set(vertices).size<3)continue;
  for(let k=0;k<3;k++){
    const a=vertices[k],b=vertices[(k+1)%3],key=Math.min(a,b)+'/'+Math.max(a,b);
    edges.set(key,(edges.get(key)||0)+1)
  }
}
assert([...edges.values()].every(n=>n===2));
for(let i=0;i<=1000;i++){
  const pos=A.carryPosition(i/1000);
  if(pos.z+15> -41.9)assert(pos.y>=A.K.top-.001);
  if(Math.abs(pos.z-A.K.rest.z)<30)assert(pos.y>=A.K.rest.y-.001)
}
const wet=A.create(),softCake=wet.cups[0];softCake.amount=.45;softCake.rise=.38;softCake.cooked=.36;
Object.assign(softCake.pos,A.K.rack);softCake.where='rack';assert(A.begin(wet,'stick'));
tick(4,wet);assert.equal(softCake.holes.length,1);assert(wet.stick.crumb>.6);A.end(wet);tick(2,wet);
const fresh=A.create();tick(4.1,fresh);assert.equal(A.suggestion(fresh).kind,'jug');assert(fresh.cups.every(c=>c.amount===.002));
console.log('PASS • pour / rack contact / lid / steam / puncture / split / plate / carry / tea / handover / repeat');
console.log('PASS • fixed topology, mass balance, retained deformation, heat-dependent expansion and fracture');
