'use strict';
const Room=(()=>{
 const {T,TAU,V,rand,mat,M,group,mesh,box,ell,lathe,ring,tube,beam,round,fabric,batch,contact}=Craft;
 const leafM=[mat(0x50654a,.48),mat(0x75805a,.47),mat(0x889268,.45)],cherryM=mat(0xa52d24,.18,.02);
 function leaf(p,x,y,z,len,width,m,ang=0){
   let g=new T.SphereGeometry(1,12,8),o=mesh(p,g,m,x,y,z);o.scale.set(width,len,.027);o.rotation.z=ang;o.rotation.x=-.23;return o}
 function cherries(p,scale=1){
   let g=group(p);g.scale.setScalar(scale);ell(g,-.1,0,.01,.114,.108,.103,cherryM);ell(g,.112,-.052,.038,.12,.114,.11,cherryM);
   tube(g,[[-.10,.084,.01],[-.084,.20,.006],[.01,.32,0],[.095,.39,0]],.011,M.dark,12);
   tube(g,[[.112,.044,.03],[.124,.20,.02],[.103,.34,0],[.095,.39,0]],.01,M.dark,12);
   leaf(g,.19,.349,0,.12,.043,leafM[0],-1.12);return g}
 function footed(p,size=1){
   let g=group(p);g.scale.setScalar(size);
   lathe(g,[[0,.014],[.41,.014],[.46,.035],[.462,.053],[.44,.071],[.30,.086],[.19,.112],[.12,.17],[.082,.31],[.092,.39],[.139,.428],[.16,.448],[.14,.475],[.30,.51],[.53,.55],[.75,.606],[.81,.642],[.816,.664],[.80,.679],[.74,.658],[.57,.62],[.35,.594],[0,.59]],M.silver);
   ring(g,.455,.01,.049,M.brass);ring(g,.109,.015,.394,M.silver);ring(g,.803,.012,.665,M.silver);return g}
 function cream(p,x,y,z){
   let g=group(p,x,y,z);lathe(g,[[.17,0],[.196,.025],[.16,.07],[.10,.11],[.043,.18],[.004,.20]],M.china,40,.012,7);
   let pts=[];for(let k=0;k<=86;k++){let t=k/86,r=.183*(1-t)**.85;pts.push([r*Math.cos(t*TAU*2.45),.032+.157*t,r*Math.sin(t*TAU*2.45)])}
   tube(g,pts,.036,M.china,70);return g}
 function sample(p){
   let g=group(p);lathe(g,[[0,0],[.46,0],[.495,.018],[.505,.06],[.485,.17],[.431,.425],[.411,.46],[.37,.485],[0,.489]],M.custard,96,.010,12);
   lathe(g,[[0,.473],[.395,.45],[.416,.447],[.413,.468],[.392,.49],[.36,.498],[0,.501]],M.sauce,96,.008,12,(r,y,a,i)=>[r*Math.cos(a),y-(i===2?.04*(.5+.5*Math.cos(a*3+.9))**7:0),r*Math.sin(a)]);
   lathe(g,[[0,.003],[.548,.003],[.56,.009],[.53,.014],[0,.016]],M.honey,72,.009,5);
   cream(g,-.08,.49,.003);let c=group(g,.015,.69,.028);ell(c,0,0,0,.103,.10,.101,cherryM);
   tube(c,[[0,.08,0],[.002,.16,0],[.054,.24,-.005],[.11,.27,0]],.009,M.dark,12);leaf(c,-.131,.059,-.01,.095,.038,leafM[0],1.10);return g}
 function cup(p,x,y,z,size,material=M.china){
   let g=group(p,x,y,z);g.scale.setScalar(size);
   lathe(g,[[0,.012],[.20,.012],[.23,.044],[.278,.14],[.313,.32],[.316,.374],[.31,.386],[.292,.383],[.287,.345],[.262,.192],[.182,.073],[0,.07]],material,36);
   ring(g,.31,.006,.374,M.brass);tube(g,[[.292,.29,0],[.41,.32,0],[.446,.25,0],[.406,.15,0],[.248,.11,0]],.03,material,14);return g}
 function plant(p,x,y,z,k=1){
   let g=group(p,x,y,z);g.scale.setScalar(k);
   lathe(g,[[0,0],[.215,0],[.268,.38],[.292,.39],[.294,.45],[.25,.46],[.248,.40],[0,.40]],M.sage,32,0);ring(g,.28,.012,.403,M.brass);
   for(let i=0;i<13;i++){let a=rand()*TAU,h=.51+rand()*.61,r=.10+rand()*.22;
     tube(g,[[0,.40,0],[Math.cos(a)*r*.55,h*.80,Math.sin(a)*r*.55],[Math.cos(a)*r,h,Math.sin(a)*r]],.012,leafM[0],7);
     let o=leaf(g,Math.cos(a)*r,h,Math.sin(a)*r,.15+rand()*.15,.058+rand()*.025,leafM[i%3],-.62*Math.cos(a));o.rotation.y=a*.63;o.rotation.x=.35*Math.sin(a);
   }return g}
 function lantern(p,x,y,z,k){
   let g=group(p,x,y,z);g.scale.setScalar(k);beam(g,[0,.39,0],[0,4,0],.015,M.dark);
   lathe(g,[[0,.27],[.105,.27],[.115,.31],[.085,.36],[.059,.42],[0,.42]],M.aged,40);
   lathe(g,[[.07,-.16],[.19,-.126],[.27,-.055],[.29,.05],[.247,.16],[.166,.23],[.126,.28],[0,.28]],mat(0xffe9ba,.23,0,{emissive:0xf1c992,emissiveIntensity:.15}),56,.01,10);
   ring(g,.122,.016,.254,M.brass);return g}
 function bench(scene){let p=group(scene);
   // Continuous timber counter and a slightly raised maple pastry board.
   for(let j=0;j<13;j++)box(p,0,-.223,-2.59+j*.442,16,.18,.438,j%3===0?M.oak:M.wood);
   round(p,0,-.268,.07,13.8,.33,5.83,.12,M.edge);
   box(p,0,-.254,2.998,13.73,.022,.025,M.brass);
   box(p,0,-.823,2.90,13.75,.99,.11,M.green);
   for(let x=-6;x<7;x+=1.45){box(p,x,-.81,2.968,1.29,.77,.035,M.dark);box(p,x,-.81,2.991,1.24,.72,.032,M.green)}
   round(p,-.05,-.062,.38,4.92,.131,2.64,.20,M.oak);
   // The direction of the maple grain runs across the work surface.
   let rim=group(p,-.78,.006,-.38);
   lathe(rim,[[0,0],[.565,0],[.63,.005],[.65,.015],[.645,.031],[.624,.038],[.603,.029],[.565,.019],[0,.019]],M.aged);
   let trivet=mat(0x82735c,.66);lathe(rim,[[0,.018],[.555,.018],[.567,.023],[.55,.025],[0,.025]],trivet);
   ring(rim,.515,.007,.028,M.brass);
   for(let i=0;i<6;i++){let a=i/6*TAU;ell(rim,.578*Math.cos(a),.035,.578*Math.sin(a),.022,.006,.022,M.brass)}
   let towel=group(p,1.04,.008,.63);towel.rotation.y=-.17;fabric(towel,0,.018,0,1.65,1.37);
   for(let i=0;i<30;i++){let x=-.80+i*.055;beam(towel,[x,.018,.68],[x+.012,.012,.719+rand()*.025],.006,M.cloud)}
   const counterTop=.294;
   let goal=group(p,-1.43,counterTop,-2.95);footed(goal,1.10);let sweet=sample(goal);sweet.position.y=.658;sweet.scale.setScalar(1.03);
   // Wire-bound sugar canister and folded napkins on the far left.
   let jar=group(p,-3.53,-.125,-.83);
   lathe(jar,[[0,0],[.28,.01],[.32,.06],[.32,.53],[.30,.57],[.23,.60],[.23,.62],[0,.62]],M.cream,48,.012,16);
   lathe(jar,[[0,.61],[.30,.61],[.31,.64],[.29,.68],[.095,.72],[.045,.735],[0,.735]],M.silver,48);ell(jar,0,.775,0,.062,.055,.062,M.dark);
   let pl=group(p,-3.18,-.117,1.79);for(let i=0;i<3;i++)lathe(pl,[[0,i*.041],[.45,i*.041],[.64,.078+i*.041],[.64,.095+i*.041],[.49,.058+i*.041],[0,.046+i*.041]],M.china,48);
   batch(p);return p;
 }
 function room(scene){
   let architecture=group(scene),p=architecture;
   let plaster=mat(0xd5c4aa,.89),tile=mat(0xdad7bf,.31),tile2=mat(0xe2ddc8,.33),terracotta=mat(0xa76d55,.76);
   let far=group(p);
   box(far,0,2.64,-8.6,22,8,.19,plaster);box(far,-9,2,-3,.28,8,16,plaster);box(far,9,2,-3,.28,8,16,plaster);
   box(p,0,-1.74,-1,24,.15,20,M.walnut);
   // The tall, sunlit sash looks out on a green courtyard. All parts are geometry.
   let sky=mat(0xe9e2c7,.93,0,{emissive:0xdddcc7,emissiveIntensity:.35});box(p,-3.95,3,-7.96,7.25,5.78,.12,sky);
   let seen=group(p,-3.7,.4,-7.70);
   for(let i=0;i<21;i++){let x=rand()*6-3,y=rand()*2.2+.2;ell(seen,x,y,0,.48+rand()*.7,.49+rand()*.55,.15,mat([0xafb696,0xc3c6a6,0xbdbea2][i%3],.96))}
   const frame=mat(0x726a53,.44);
   for(let x of [-7.5,-5.26,-3.11,-.95,-.30])box(p,x,2.55,-7.37,.12,6,.17,frame);
   for(let y of [.10,1.98,4.30,5.4])box(p,-3.88,y,-7.37,7.45,.09,.19,frame);
   box(p,-3.9,.12,-7.16,7.55,.14,.59,M.oak);
   // Oxblood banquette, brass piping and coffee tables beyond the pass.
   let booth=mat(0x83453b,.47);
   round(p,-3,0,-5.73,6.4,.25,1.10,.13,M.walnut);
   round(p,-3,.19,-5.75,6.37,.24,1.02,.13,booth);
   for(let i=0;i<18;i++){let q=ell(p,-6.02+i*.35,.66,-6.13,.22,.59,.155,booth);q.rotation.x=-.13}
   beam(p,[-6.26,1.16,-6.17],[.24,1.16,-6.17],.025,M.aged);
   for(let x of [-4.37,-.99]){let g=group(p,x,-.62,-5.08);lathe(g,[[.39,0],[.39,.05],[.15,.1],[.07,.22],[.065,1.23],[.36,1.25]],M.black,32);round(g,0,1.31,0,1.64,.10,.89,.21,M.oak);cup(g,-.32,1.37,-.08,.61);cup(g,.31,1.37,0,.59)}
   // Glazed tiles, handrails, coffee mill and cup shelves.
   box(p,3.86,1.60,-6.01,8.1,4,.17,mat(0xbab5a0,.85));
   for(let j=0;j<8;j++)for(let i=-1;i<11;i++)box(p,.28+i*.76+(j%2)*.38,.04+j*.42,-5.90,.746,.407,.052,(i+j)%4===0?tile2:tile);
   box(p,4.12,.21,-5.05,7.94,.20,1.58,M.walnut);box(p,4.12,-.60,-5.12,7.7,1.54,1.4,M.green);
   for(let y of [1.52,2.91]){box(p,3.83,y,-5.57,6.62,.103,.68,M.walnut);box(p,3.83,y+.035,-5.22,6.62,.024,.037,M.aged);
     for(let x of [1.02,3.12,6.65]){beam(p,[x,y-.35,-5.87],[x,y-.035,-5.36],.023,M.aged)}
     for(let k=0;k<5;k++){let x=1.31+k*.74;cup(p,x,y+.056,-5.50,.85,k%2===0?M.cream:M.sage);if(k===1||k===3)cup(p,x,y+.34,-5.50,.85)}
   }
   let machine=group(p,1.89,.32,-4.94);
   round(machine,0,.09,.02,1.93,.17,.89,.13,M.black);round(machine,0,.20,.04,1.81,.08,.85,.1,M.steel);
   round(machine,0,.62,-.14,1.62,.85,.56,.15,M.green);round(machine,0,.98,-.08,1.83,.12,.73,.12,M.silver);
   for(let i of [-.48,.43]){let h=group(machine,i,.77,.194);let o=lathe(h,[[0,0],[.165,0],[.176,.03],[.154,.052],[0,.055]],M.brass,36);o.rotation.x=Math.PI/2;
    ell(h,0,0,.062,.143,.143,.009,M.cream);beam(h,[0,0,.077],[.073,.051,.077],.009,M.dark);ell(h,0,0,.08,.018,.018,.014,M.dark);
    beam(machine,[i,.55,.16],[i,.51,.31],.10,M.silver);beam(machine,[i,.50,.29],[i+.21,.48,.42],.036,M.dark);cup(machine,i,.244,.25,.46)}
   plant(p,-5.03,.2,-7.04,1.36);plant(p,.04,.31,-4.87,.75);
   lantern(p,-2.24,2.12,-4.80,.97);lantern(p,-5.56,3.17,-6.17,.75);
   // Serving counter with a fluted timber fascia.
   box(p,0,.229,-3.02,18,.13,1.05,M.walnut);box(p,0,-.39,-3.02,18,1.14,.96,M.dark);
   for(let i=0;i<65;i++)box(p,-8+i*.25,-.32,-2.51,.225,.88,.045,M.walnut);
   box(p,0,.164,-2.49,18,.036,.036,M.brass);
   batch(architecture);
   // Individually hemmed scallops on the real canvas café awning.
   let awning=group(scene,0,2.75,-.25);
   const awningRed=mat(0x8e4038,.92,0,{side:T.DoubleSide}),awningCream=mat(0xf1e2c8,.93,0,{side:T.DoubleSide});
   const stripe=.38;
   for(let i=-23;i<=23;i++){let g=group(awning,i*stripe,0,0),m=i%2?awningCream:awningRed;let pts=[],uv=[],idx=[];
     for(let j=0;j<=14;j++){let u=j/14,x=(u-.5)*stripe,hem=-.19-.10*Math.sin(Math.PI*u)**.55;pts.push(x,.105,-.060,x,hem,.018+.007*Math.cos(u*TAU));uv.push(u,1,u,0);if(j){let k=j*2;idx.push(k-2,k-1,k,k,k-1,k+1)}}
     let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,m);
     let canopy=box(g,0,.215,-.32,stripe,.024,.72,m);canopy.rotation.x=.34;
     let line=[];for(let j=0;j<=12;j++){let u=j/12;line.push([(u-.5)*stripe,-.172-.10*Math.sin(Math.PI*u)**.55,.025])}tube(g,line,.0045,i%2?M.cream:M.line,12)
   }batch(awning);awning.traverse(o=>o.castShadow=false);
   return {awning,architecture};
 }
 return {room,bench,cherries,footed,sample,cream,leaf,plant};
})();
