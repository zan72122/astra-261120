(() => {
  'use strict';
  const {T,TAU,group,mesh,oval,box,rod,line,surface,lathe,ring,mat,plate,woodMat,ivory,glaze,pink,gold,steel,frosting,cotton,sage,rand,berry,flower,sculpt,fabric}=Models;
  const wood=mat(0xcaa982,.58),wall=mat(0xf3e2cf,.91),trim=mat(0xf9e7ca,.47),mortar=mat(0xdac4b4,.87);
  const clay=mat(0xc98e86,.45),brown=mat(0x976b4d,.66),sponge=mat(0xefc387,.88),jam=mat(0xc34b42,.61),milk=mat(0xffe9cc,.65);
  const skin=mat(0xd79c7e,.65),nail=mat(0xe6b5a1,.52),sleeve=mat(0xf5e4ce,.85);
  function cake(p,start=0,span=TAU,inside=false){
    const g=group(p),radius=1.54,height=1.027;
    const n=Math.max(12,Math.ceil(120*span/TAU));
    const profile=[[.001,0],[1.46,0],[1.511,.012],[1.527,.038]];
    for(let i=0;i<=46;i++){
      const v=i/46;profile.push([radius-.013*v,.05+v*.925]);
    }
    profile.push([1.523,1.001],[1.508,1.018],[1.478,height],[1.41,height+.004],[1.31,height+.004],
      [1.02,height+.002],[.69,height+.001],[.32,height],[.0001,height]);
    const gCake=surface(n,profile.length-1,(u,v,j)=>{
      const a=start+u*span,[rr,yy]=profile[j],side=j>=3&&j<52;
      const wav=Math.sin(a*3+yy*2)*.003+Math.cos(a*7-yy)*.002;
      const mark=.5+.5*Math.sin(yy*58+.64*Math.sin(3*a+yy*5)+.31*Math.sin(a*5)+.45*Math.cos(a*2-yy*8));
      const r=rr+(side?.009*Math.pow(mark,4)+wav:0);
      const y=yy+(rr>.1?.0035*Math.sin(a*2+rr*3)*rr/radius:0);
      const k=side?.983+.017*mark:1;
      return [r*Math.sin(a),y,r*Math.cos(a),k,k-.003,k-.008];
    },true);
    const coat=mat(0xfff2d9,.66,0,{vertexColors:true});
    coat.bumpMap=coat.roughnessMap;coat.bumpScale=.006;mesh(g,gCake,coat);
    if(inside){
      for(const angle of [start,start+span]){
        const layers=[[0,.055,milk],[.055,.323,sponge],[.323,.43,milk],[.43,.459,jam],
          [.459,.69,sponge],[.69,.769,milk],[.769,.97,sponge],[.97,1.027,frosting]];
        for(const [down,up,m] of layers){
          const points=surface(30,1,(u,v)=>{
            const edge=down+(up-down)*v;
            const y=edge+Math.sin(16*u+edge*3.8)*.008*Math.sin(Math.PI*edge);
            return [Math.sin(angle)*u*1.525,y,Math.cos(angle)*u*1.525];
          });m.side=T.DoubleSide;mesh(g,points,m);
        }
        for(let j=0;j<4;j++){
          const u=.24+j*.32;
          const fruit=oval(g,jam,Math.sin(angle)*u,.383,Math.cos(angle)*u,.045,.068,.13);fruit.rotation.y=angle;
        }
        // Open crumb on the cut surface, with irregular pores in each sponge layer.
        const crumbs=new T.InstancedMesh(new T.SphereGeometry(1,5,3),mat(0xd5a369,.95),70);
        const d=new T.Object3D();
        for(let j=0;j<crumbs.count;j++){
          const r=.05+rand()*1.44,level=[.075,.47,.786][j%3]+rand()*.17;
          d.position.set(Math.sin(angle)*r,level,Math.cos(angle)*r);d.rotation.y=angle;
          d.scale.set(.003,.004+rand()*.011,.006+rand()*.014);d.updateMatrix();crumbs.setMatrixAt(j,d.matrix);
        }g.add(crumbs);
      }
    }
    // Short overlapping shells finish the lower edge of the crumb coat.
    const num=Math.max(1,Math.round(72*span/TAU));
    const shells=new T.InstancedMesh(surface(20,7,(u,v)=>{
      const a=u*TAU, b=(.8+.2*Math.cos(6*a+v*2))*Math.pow(Math.sin(Math.PI*v),.62);
      return [(.5-v)*.159,b*.063*Math.sin(a)+.031*Math.sin(v*Math.PI),b*.075*Math.cos(a)];
    }),milk,num);const d=new T.Object3D();
    for(let j=0;j<num;j++){const a=start+(j+.5)*span/num;d.position.set(1.512*Math.sin(a),.056,1.512*Math.cos(a));
      d.rotation.set(.1,a,.15);d.updateMatrix();shells.setMatrixAt(j,d.matrix);}
    shells.receiveShadow=shells.castShadow=true;g.add(shells);return g;
  }
  function environment(scene){
    const g=group(scene);
    const timber=woodMat();
    box(g,timber,0,-.28,4.99,28,.55,14);
    box(g,mat(0xae8e79,.84),0,-2.35,-1.8,28,.2,13);
    box(g,timber,0,-.08,-3.96,25,.145,1.66);
    box(g,mat(0xcc9e91,.72),0,-1.18,-3.99,25,2.08,1.56);
    // Window casement and plaster wall are true openings onto a small courtyard.
    box(g,wall,5.85,4,-4.55,14,9,.27);
    box(g,wall,-8.65,4,-4.55,5,9,.27);
    box(g,wall,-3.6,.49,-4.55,5.2,1.0,.27);
    box(g,wall,-3.6,6.2,-4.55,5.2,2,.27);
    const sky=mat(0xe4ece2,.98);
    box(g,sky,-3.6,4,-11.4,20,11,.3);
    for(let i=0;i<4;i++){
      const leafM=mat([0xa5b39a,0xbcc4a0,0xd3cbb0,0xb4bea2][i],.98);
      const canopy=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),leafM,38);
      const dummy=new T.Object3D();
      for(let k=0;k<38;k++){dummy.position.set(-9+rand()*11,.3+rand()*3.05,-7.6-rand()*2);
        dummy.scale.set(.38+rand()*.47,.28+rand()*.48,.48);dummy.updateMatrix();canopy.setMatrixAt(k,dummy.matrix);}
      g.add(canopy);
    }
    for(const x of [-6.22,-3.73,-1.17])box(g,trim,x,3.12,-4.32,.12,4.45,.21);
    for(const y of [1.07,3.32,5.21])box(g,trim,-3.72,y,-4.30,5.18,.12,.23);
    box(g,wood,-3.72,.981,-4.25,5.37,.14,.56);
    // Striped linen valance with physically curved scallops.
    for(let i=0;i<18;i++){
      const m=i%2?cotton:mat(0xd9aea0,.9);
      m.side=T.DoubleSide;mesh(g,surface(10,5,(u,v)=>[-6.3+(i+u)*.294,
        5.36-v*(.56+.112*Math.sin(Math.PI*u)), -4.03+.062*Math.sin((i+u)*Math.PI)+v*.07]),m);
    }
    box(g,mortar,3.56,.80,-4.39,9.46,1.62,.24);
    const tiles=[0xf1dcce,0xecd7c6,0xf2e0d0,0xf6e2d4].map(c=>mat(c,.37));
    for(let j=0;j<4;j++)for(let i=0;i<14;i++){
      const x=-.79+i*.72+(j%2)*.36;box(g,tiles[(i*3+j)%4],x,.215+j*.403,-4.244,.712,.396,.064);
    }
    box(g,wood,3.46,1.685,-4.27,9.5,.10,.22);
    box(g,wood,2.36,2.78,-4.11,5.33,.115,.64);
    for(const x of [.33,4.37]){rod(g,gold,[x,2.45,-4.24],[x,2.736,-3.88],.022);box(g,gold,x,2.60,-4.25,.056,.34,.039);}
    function canister(x,height,r,m){
      const pot=group(g);pot.position.set(x,2.845,-4.07);
      lathe(pot,m,[[.001,.006],[r*.86,.006],[r,.044],[r,height-.08],[r*.94,height],[.01,height]]);
      lathe(pot,wood,[[r*.93,height-.01],[r*1.02,height+.012],[r,height+.055],[.15*r,height+.074],[.001,height+.076]]);
      oval(pot,wood,0,height+.092,0,.059,.035,.059);
      ring(pot,gold,r*.99,.007,.075);
      for(let k=0;k<2;k++)ring(pot,m,r*.996,.009,height-.15-k*.036);
    }
    canister(.58,.48,.23,ivory);canister(1.23,.62,.25,glaze);canister(1.96,.52,.236,ivory);
    for(let i=0;i<4;i++){const q=plate(g,.41,sage);q.position.set(3.07,2.83+i*.068,-4.05);}
    // A small spring arrangement on the sill.
    const vase=group(g);vase.position.set(-2.04,1.057,-4.12);
    lathe(vase,sage,[[.01,0],[.18,.012],[.209,.14],[.196,.38],[.111,.52],[.106,.64],[.122,.65],[.119,.681],[.097,.683]]);
    const stemM=mat(0x7f926b,.8),petal=mat(0xffded1,.71),heart=mat(0xcaa267,.63);
    for(let i=0;i<5;i++){
      const a=i*2.37,x=.12+.40*Math.cos(a),z=.17*Math.sin(a),y=1.05+rand()*.34;
      line(vase,stemM,[[0,.53,0],[x*.4,.85,z*.4],[x,y,z]],.009,10);
      const leaf=oval(vase,stemM,x*.61,y-.22,z*.7,.087,.018,.032);leaf.rotation.z=x>0?.54:-.54;
      for(let j=0;j<5;j++){const b=j*TAU/5;const fl=oval(vase,petal,x+.044*Math.sin(b),y+.043*Math.cos(b),z,.045,.052,.027);fl.rotation.z=-b;}
      oval(vase,heart,x,y,z+.024,.025,.023,.016);
    }
    rod(g,gold,[.36,2.23,-4.04],[2.65,2.23,-4.04],.026);
    for(const x of [.38,2.63])rod(g,gold,[x,2.23,-4.28],[x,2.23,-4.01],.047);
    // Wire whisk, hanging on the rail.
    const whisk=group(g);whisk.position.set(.94,2.25,-3.98);whisk.rotation.z=-.12;
    ring(whisk,gold,.064,.013,-.055).rotation.set(0,0,0);
    rod(whisk,wood,[0,-.10,0],[0,-.47,0],.034,.042);
    for(let i=0;i<5;i++){const a=i*Math.PI/5,x=.128*Math.cos(a),z=.128*Math.sin(a);
      line(whisk,steel,[[0,-.46,0],[x*.5,-.57,z*.5],[x,-.79,z],[0,-.91,0],[-x,-.79,-z],[-x*.5,-.57,-z*.5],[0,-.46,0]],.009,20);}
    const towel=group(g);towel.position.set(2,2.22,-4);
    mesh(towel,surface(24,12,(u,v)=>[(u-.5)*.57,-.56*v-.04*v*Math.cos(u*12),.051+.036*Math.sin(u*19)+.016*v]),cotton).material.side=T.DoubleSide;
    for(const v of [.81,.85,.9])mesh(towel,surface(24,1,(u,k)=>[(u-.5)*.571,-.56*(v+k*.014)-.04*(v+k*.014)*Math.cos(u*12),.053+.036*Math.sin(u*19)+.016*v]),clay);
    // The side window casts its actual mullion shadows across the worktop.
    for(const y of [1.78,3.50,5.71])box(g,trim,-4.82,y,0,.11,.074,11.0);
    for(const z of [-4.4,-2.32,.23,2.66,5.2])box(g,trim,-4.82,3.59,z,.11,5.4,.080);
    return g;
  }
  function example(p){
    const g=group(p);
    lathe(g,glaze,[[.01,.025],[.54,.025],[.58,.05],[.54,.115],[.25,.15],[.18,.24],[.19,.31],[.49,.36],[.01,.37]]);
    const q=plate(g,.93,ivory,true);q.position.y=.32;
    const slice=cake(g,-.52,.97,true);slice.scale.setScalar(.70);slice.position.set(0,.405,-.45);
    const b=berry(g,1);b.position.set(.093,1.34,.27);b.scale.setScalar(.64);b.rotation.set(-.23,2.33,.15);
    const dollop=flower(g);dollop.position.set(-.14,1.126,.131);
    sculpt(dollop,{gap:0,lobes:Array.from({length:8},()=>({radius:.97})),trailX:-.14,trailZ:.02,bendX:-.13,bendZ:.004,height:.87,tip:.30});
    return g;
  }
  function hand(p){
    const h=group(p);
    oval(h,skin,.092,.005,0,.245,.096,.158);
    for(let i=0;i<4;i++){
      const z=(i-1.5)*.073,L=[.23,.267,.257,.212][i];
      mesh(h,surface(14,13,(u,v)=>{
        const a=u*TAU,r=.043*(1-.21*v)*Math.min(1,Math.sqrt(1-v)*3.3);
        return [-.05-L*v,.021-.095*v*v+r*Math.cos(a),z*(1+.12*v)+r*Math.sin(a)];
      }),skin);
      const n=oval(h,nail,-.05-L*.85,-.012,z*1.10,.032,.012,.023);n.rotation.z=.57;
    }
    const thumb=oval(h,skin,.025,-.031,.168,.14,.054,.057);thumb.rotation.y=.68;
    return h;
  }
  function person(p){
    const g=group(p),apron=mat(0xc48a83,.83),flour=mat(0xf2dec7,.86);
    const torso=group(g);
    lathe(torso,flour,[[.54,0],[.60,.72],[.58,1.4],[.71,1.89],[.72,2.09],[.58,2.22],[.235,2.32]],0,0,0,.011,13,60).scale.z=.72;
    const bib=mesh(torso,surface(36,20,(u,v)=>{
      const a=(u-.5)*(2.81-.92*v),r=.638+.045*v+.013*Math.sin(u*38)*(1-v);
      return [r*Math.sin(a),.10+1.91*v,.495*Math.cos(a)+.022*Math.sin(u*24)*(1-v)];
    }),apron);bib.material.side=T.DoubleSide;
    for(const x of [-.38,.38]){
      const strap=box(torso,apron,x,2.096,.294,.10,.39,.055);strap.rotation.x=-.6;
      oval(torso,gold,x,1.962,.37,.031,.036,.016);
    }
    const pock=oval(torso,apron,.05,.88,.49,.33,.22,.037);pock.rotation.z=.06;
    line(torso,cotton,[[-.26,.987,.498],[.06,.956,.529],[.34,.98,.471]],.008);
    // Head seen only at the very edge of unusually wide viewports.
    const hair=mat(0x684a3d,.85);
    oval(torso,skin,0,2.35,0,.208,.27,.19);
    oval(torso,skin,-.017,2.71,0,.34,.42,.31);
    oval(torso,hair,.038,2.84,-.044,.347,.33,.32);
    oval(torso,hair,.29,2.87,-.20,.21,.21,.205);
    oval(torso,skin,-.276,2.68,.168,.099,.094,.091);
    line(torso,brown,[[-.311,2.742,.141],[-.28,2.728,.194],[-.248,2.745,.215]],.009,8);
    const arms=[];
    for(let i=0;i<2;i++){
      const upper=mesh(g,surface(32,21,(u,v)=>{
        const a=u*TAU;
        const gather=.043*Math.sin(v*32+.58*Math.sin(a*3))*(.4+.6*v)+.023*Math.sin(6*a+v*2);
        const r=.92+.14*Math.sin(Math.PI*v)-.16*v+gather;
        return [r*Math.sin(a),v*2-1,r*Math.cos(a)];
      }),sleeve);
      const cuff=lathe(g,cotton,[[.141,-.067],[.16,-.063],[.166,-.028],[.158,.066],[.147,.079],[.13,.081]],0,0,0,.003,12,48);
      const arm=mesh(g,surface(24,14,(u,v)=>{
        const a=u*TAU,r=1+.13*Math.sin(v*Math.PI)-.31*v;
        return [r*Math.sin(a),2*v-1,r*Math.cos(a)];
      }),skin);
      const palm=Models.batchStatic(hand(g));arms.push({upper,cuff,arm,palm});
    }
    function limb(o,a,b,r){const diff=b.clone().sub(a);
      o.position.copy(a).add(b).multiplyScalar(.5);
      o.scale.set(r,diff.length()/2+r*.5,r*.91);
      o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),diff.normalize());
    }
    function pose(wrist,other,portrait){
      const x=portrait?3.03:3.88,by=.25,bz=-2.30;
      const lean=Math.max(0,Math.min(3.25,(x-wrist[0]-1.50)*.89));
      torso.position.set(x-lean,-.79-Math.min(.12,lean*.05),bz);torso.scale.y=1.51;torso.rotation.y=-.58;
      torso.rotation.z=lean*.035;torso.rotation.x=Math.min(.20,lean*.074);
      [wrist,[other[0]-lean,other[1],other[2]-.18]].forEach((point,i)=>{
        const v=arms[i],handPos=new T.Vector3(...point),shoulder=new T.Vector3(x-lean+(i?.33:-.47),by+2.0-lean*.09,bz+(i?.26:-.02));
        const wristPos=handPos.clone().add(new T.Vector3(.24,.02,-.01));
        const elbow=wristPos.clone().lerp(shoulder,.39);
        elbow.y-=.15;elbow.z+=.095;
        limb(v.upper,shoulder,elbow,.209);limb(v.arm,elbow,wristPos,.126);
        v.cuff.position.copy(elbow);v.cuff.quaternion.copy(v.upper.quaternion);
        v.palm.position.copy(handPos);v.palm.rotation.set(i?-.13:.05,i?.36:-.24,i?-.03:-.13);
      });
    }
    return {pose};
  }
  window.Bakery={cake,environment,example,person};
})();
