(function(scope){
'use strict';
const TAU=Math.PI*2,{clamp,ease,level,surfaceHeight}=scope.Agara;
const rings=20,steps=18;
function build(){
  const verts=[],tri=[],groups=[];
  function v(r,t,kind,sector){verts.push({r,t,kind,sector});return verts.length-1}
  function strip(a,b,reverse=false){
    for(let i=0;i<a.length-1;i++){
      if(reverse)tri.push(a[i],a[i+1],b[i],a[i+1],b[i+1],b[i]);
      else tri.push(a[i],b[i],a[i+1],a[i+1],b[i],b[i+1])
    }
  }
  const hub=v(0,.5,'hub',0),foot=v(0,0,'foot',0),tips=[];
  const valleys=[[],[],[]],outside=[],bottom=[];
  for(let i=0;i<steps*3;i++){
    const s=Math.floor(i/steps),t=i%steps/steps;
    outside[i]=v(1,t,'skin',s);bottom[i]=v(1,t,'bottom',s)
  }
  for(let s=0;s<3;s++){
    valleys[s][0]=hub;
    for(let j=1;j<rings;j++)valleys[s][j]=v(j/rings,0,1,s);
    valleys[s][rings]=outside[s*steps];
    tips[s]=v(0,.5,'tip',s)
  }
  for(let s=0;s<3;s++){
    const off=tri.length,rows=[Array(steps+1).fill(tips[s])];
    for(let j=1;j<=rings;j++){
      const row=[];for(let k=0;k<=steps;k++)row.push(j===rings?outside[(s*steps+k)%(3*steps)]:v(j/rings,k/steps,'skin',s));
      strip(rows[j-1],row,true);rows.push(row)
    }
    const low=rows[rings].map((_,k)=>bottom[(s*steps+k)%(3*steps)]);
    strip(rows[rings],low,true);
    for(let k=0;k<steps;k++)tri.push(foot,low[k],low[k+1]);
    groups.push({start:off,count:tri.length-off,materialIndex:0});
    const start=tri.length,tipWalls=[];
    for(const k of [0,steps]){
      const arm=k===0?s:(s+1)%3;
      let previous=rows.map(row=>row[k]);const endCap=[tips[s]];
      for(let m=1;m<=6;m++){
        const inside=rows.map((_,j)=>m===6?valleys[arm][j]:j===rings?rows[j][k]:v(j/rings,k/steps,m/6,s));
        strip(previous,inside,k===0);previous=inside;endCap.push(inside[0])
      }
      tipWalls.push(endCap)
    }
    strip(tipWalls[0],tipWalls[1],false);
    groups.push({start,count:tri.length-start,materialIndex:1})
  }
  return {verts,tri:new Uint16Array(tri),groups,p:new Float32Array(verts.length*3),uv:new Float32Array(verts.length*2),col:new Float32Array(verts.length*3)};
}
function deform(g,c,time){
  const radius=(2.47+.17*level(c))*c.spread;
  const bran=[0,1,2].map((_,s)=>c.crack*(.29+.72*c.force)*(1+.16*Math.sin(c.seed*5+s))+c.open[s]*.85);
  const skinWet=1-c.cooked,rough=c.rise*.045;
  for(let i=0;i<g.verts.length;i++){
    const {r,t,kind,sector:s}=g.verts[i],j=i*3;
    const bend=(arm)=>c.crack*(.055+.18*c.force)*Math.sin(r*5.2+c.seed+arm*2)*r;
    const th=c.seed+(s+t)*TAU/3+(1-t)*bend(s)+t*bend((s+1)%3);
    const edge=t<.5?s:(s+1)%3;
    let crease=0;
    if(r>.71)for(const f of c.creases)crease+=Math.max(0,Math.cos(th-f.angle))**18*f.depth;
    const baseR=r*radius*(1-.066*clamp(crease)*ease((r-.71)/.29)),lip=ease(1-r/(.77+.16*c.force));
    const width=bran[edge]*lip*(.58+.19*Math.sin(8*r+c.seed+edge));
    const offset=r===0?0:(Math.exp(-t*8)-Math.exp(-(1-t)*8))*width; // tangential curling of each lip
    const centerShift=(1-ease(r/.32))*Math.min(...bran)*.40;
    let x=Math.cos(th)*baseR-Math.sin(th)*offset+Math.cos(c.seed+(s+.5)*TAU/3)*centerShift;
    let z=Math.sin(th)*baseR+Math.cos(th)*offset+Math.sin(c.seed+(s+.5)*TAU/3)*centerShift;
    let h=surfaceHeight(c,r);
    const grain=Math.sin(24*x+Math.cos(6*z))*Math.sin(11*z+x)+.38*Math.sin(43*z+2*x);
    const edgeCurl=r===0?0:width*.56*Math.exp(-Math.min(t,1-t)*11);
    // Small gas cells nucleate around the hot perimeter before the skin sets.
    const cellA=Math.cos(17*th+c.seed+Math.sin(r*14));
    const cellR=(r-.79-.095*Math.sin(th*7+c.seed))/.072;
    const blister=.16*Math.exp(-cellR*cellR-5*(1-cellA))*Math.sin(Math.PI*clamp(c.cooked/.87))*(.62+.38*Math.sin(c.hotTime*3+th*19));
    h+=blister;
    h+=edgeCurl+rough*grain+(.035*Math.sin(r*22-time*8)*c.impact.pulse*(1-r));
    // A puncture displaces only nearby vertices and travels with the same cake.
    let dent=0;
    for(const hole of c.holes){const d=(x-hole.x)**2+(z-hole.z)**2;dent=Math.max(dent,Math.exp(-d/.044))}
    h-=dent*(.18+c.rise*.19);
    let crumb=typeof kind==='number'||kind==='hub';
    if(crumb){
      const k=kind==='hub'?1:kind;
      const sideX=-Math.sin(th)*offset+Math.cos(c.seed+(s+.5)*TAU/3)*centerShift;
      const sideZ=Math.cos(th)*offset+Math.sin(c.seed+(s+.5)*TAU/3)*centerShift;
      // Pores in the newly exposed crumb have depth, with narrower, taller cells at high steam pressure.
      const pore=Math.max(0,Math.cos(42*r+Math.sin(s*3+k*7))-.35)*Math.max(0,Math.sin(k*(14-5*c.force)+r*12)-.2);
      const recess=k+Math.sin(k*Math.PI)*pore*.16;
      x-=sideX*recess;z-=sideZ*recess;
      const depth=lip*bran[edge]*(.55+.84*c.force);
      h-=k*(edgeCurl+depth);
      if(r===0){
        const centerH=surfaceHeight(c,0)-Math.max(...bran)*(.55+.84*c.force);
        h=h*(1-k)+centerH*k;
        if(kind==='hub'){x=0;z=0}
      }
    }else if(kind==='bottom'||kind==='foot'){
      x=kind==='foot'?0:Math.cos(th)*2.44*c.spread;z=kind==='foot'?0:Math.sin(th)*2.44*c.spread;h=.045;
    }
    g.p[j]=x;g.p[j+1]=Math.max(.042,h);g.p[j+2]=z;
    const variation=(1-.60*dent)*(.95+.04*grain*c.cooked+.025*Math.cos(th*3+r*9)*c.rise);
    g.col[j]=(crumb?.86:.55-.14*skinWet)*variation;
    g.col[j+1]=(crumb?.57:.245-.10*skinWet)*variation;
    g.col[j+2]=(crumb?.31:.103-.047*skinWet)*variation;
    g.uv[i*2]=crumb?r*1.25:x*.24;
    g.uv[i*2+1]=crumb?h*(.43-.19*c.force):z*.24;
  }
}
const api={build,deform};if(typeof module!=='undefined'&&module.exports)module.exports=api;scope.Dough=api;
})(globalThis);
