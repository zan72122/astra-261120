'use strict';
const Utensils=(()=>{
 const {T,TAU,V,rand,mat,M,group,mesh,box,ell,lathe,ring,tube,beam,round,batch,contact,tex}=Craft;
 const {N,R,H,clamp}=Kissaten;
 const a0=0, base=(-.58);
 function makeJug(scene){
   let g=group(scene,.61,.047,.56);
   const profile=[[0,.0],[.33,0],[.366,.024],[.366,.064],[.41,.076],[.466,.125],[.503,.22],[.526,.40],[.526,.62],[.499,.80],[.457,.98],[.439,1.064],[.444,1.13],[.473,1.177],[.485,1.205],[.484,1.222],[.461,1.23],[.445,1.210],[.423,1.158],[.416,1.06],[.427,.98],[.467,.77],[.489,.61],[.488,.37],[.444,.18],[.374,.12],[0,.117]];
   function spout(r,y,a){let lip=clamp((y-.85)/.38),tip=Math.pow(Math.max(0,-Math.cos(a)),15);
     return [r*Math.cos(a)-tip*lip*lip*.265,y+.084*tip*lip,Math.sin(a)*r*(1-.16*lip*tip)]}
   lathe(g,profile,M.china,96,0,1,spout);
   lathe(g,[[.484,1.207],[.486,1.217],[.48,1.228],[.463,1.232],[.454,1.225]],M.line,96,0,1,spout);
   ring(g,.365,.008,.048,M.line);
   ring(g,.502,.009,.225,M.red);ring(g,.505,.004,.244,M.line);
   ring(g,.46,.006,.961,M.line);ring(g,.456,.012,.987,M.red);
   const handle=group(g);
   tube(handle,[[.413,1.05,0],[.61,1.10,0],[.803,1.074,0],[.904,.953,0],[.917,.783,0],[.845,.609,0],[.708,.493,0],[.51,.462,0]],.085,M.china,48);
   ell(handle,.44,1.049,0,.129,.108,.118,M.china);ell(handle,.50,.468,0,.11,.107,.113,M.china);
   let crest=Room.cherries(g,.72);crest.position.set(.031,.513,.519);crest.rotation.x=-.03;crest.scale.z=.16;
   batch(g);
   let liquid=lathe(g,[[0,0],[.415,0],[.425,.006],[.423,.012],[.394,.007],[0,.004]],M.custard,72);liquid.position.y=1.132;
   return {g,liquid};
 }
 function makeMold(scene){
   let g=group(scene),n=120;
   const profile=[[0,.002,0],[.405,.002,.30],[.456,.013,.58],[.477,.044,.74],[.484,.082,.84],[.502,.16,1],[.536,.31,1],[.578,.49,1],[.616,.648,1],[.631,.692,.97],[.643,.705,.95],[.646,.722,.95],[.637,.735,.95],[.620,.734,.95],[.609,.722,.95],[.607,.699,.95],[.596,.663,.98],[.566,.503,.98],[.520,.306,.99],[.476,.128,.90],[.455,.077,.82],[.431,.055,.65],[.404,.050,.45],[0,.050,0]];
   lathe(g,profile,M.silver,n,.042,12);
   lathe(g,[[.628,.692],[.644,.701],[.651,.714],[.648,.726],[.637,.732]],M.steel,n,.041,12);
   // Rounded heel and a narrow chased band catch the window reflection.
   lathe(g,[[.472,.041,.8],[.480,.048,.8],[.482,.061,.84]],M.steel,n,.041,12);
   let bottom=lathe(g,[[0,.051,0],[.424,.051,.75],[.439,.059,.80],[.425,.071,.76],[.3,.065,.42],[0,.062,0]],M.sauce,n,.04,12);
   let pos=[],uv=[],idx=[];for(let r=0;r<=R;r++)for(let a=0;a<=N*2;a++){
     pos.push(0,0,0);uv.push(a/(N*2),r/R);if(r&&a){let k=r*(N*2+1)+a;idx.push(k-1,k,k-N*2-2,k,k-N*2-1,k-N*2-2)}}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);
   geo.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(pos.length).fill(1),3));
   const liquid=mesh(g,geo,mat(0xffffff,.22,0,{side:T.DoubleSide,vertexColors:true}));liquid.frustumCulled=false;
   let ripples=[];for(let i=0;i<9;i++){let m=mat(0xffdfa0,.14,0,{transparent:true,depthWrite:false}),o=ring(g,1,.019,0,m);ripples.push(o);o.visible=false}
   return {g,liquid,bottom,ripples};
 }
 function surface(m,s){
   const a=m.liquid.geometry.attributes.position,h=s.volume/139,lev=.069+.627*h**.87;
   m.liquid.visible=h>.0001;
   const spread=Math.min(1,.12+Math.sqrt(h)*2.35);
   let cx=(1-spread)*.38,cz=-(1-spread)*.181,rad=(.43+.17*h)*spread;
   for(let r=0;r<=R;r++)for(let k=0;k<=N*2;k++){
     let aa=k/(N*2)*TAU,i=Math.min(R-1,r)*N+(k>>1)%N,ii=Math.min(R-1,r)*N+((k>>1)+1)%N;
     let w=(k%2)?(s.h[i]+s.h[ii])*.5:s.h[i],edge=r/R,rr=(rad+Math.cos(aa*12)*.039*spread)*edge;
     const gel=s.gel[i],solid=s.jig[(k>>1)%N]*gel;
     m.liquid.geometry.attributes.color.setXYZ(r*(N*2+1)+k,.99,.602+.103*gel,.137+.113*gel);
     a.setXYZ(r*(N*2+1)+k,Math.cos(aa)*rr+cx,lev+w*.01+solid*.01+edge**8*.007,Math.sin(aa)*rr+cz);
   }a.needsUpdate=true;m.liquid.geometry.attributes.color.needsUpdate=true;m.liquid.geometry.computeVertexNormals();
   m.liquid.material.roughness=.18+s.heat*.12;
   let rings=s.waves.slice(-9);
   m.ripples.forEach((o,i)=>{let w=rings[i];o.visible=!!w&&w.radius<.48&&w.strength>.11&&h>0;if(!o.visible)return;
     o.position.set(w.x*.55,lev+.007+w.strength*.004,w.z*.55);let rad=Math.min(w.radius*.64,spread*.32);o.scale.set(rad,rad,.23);o.material.opacity=Math.min(.42,w.strength*.41)*(1-w.radius/.5)});
 }
 function makePot(scene){
   let g=group(scene,1.34,-.125,-1.67);
   for(let a of [.65,2.49,3.79,5.63])ell(g,Math.cos(a)*.53,.057,Math.sin(a)*.50,.105,.069,.10,M.black);
   round(g,0,.16,0,1.63,.23,1.50,.20,M.wine);
   round(g,0,.275,0,1.58,.065,1.44,.19,M.steel);ring(g,.637,.037,.338,M.black);
   let dial=group(g,0,.169,.756);let o=lathe(dial,[[0,0],[.11,0],[.122,.016],[.104,.064],[.087,.078],[0,.078]],M.black,32);o.rotation.x=Math.PI/2;
   box(dial,0,.053,.077,.015,.045,.007,M.cream);
   lathe(g,[[0,.355],[.56,.355],[.664,.387],[.706,.45],[.728,.55],[.746,.755],[.759,.898],[.775,.94],[.780,.966],[.76,.978],[.734,.958],[.721,.90],[.694,.57],[.62,.44],[0,.44]],M.steel,88);
   ring(g,.75,.016,.774,M.silver);ring(g,.76,.015,.902,M.silver);ring(g,.777,.018,.964,M.silver);
   for(let sign of [-1,1]){
     tube(g,[[sign*.72,.779,-.18],[sign*.88,.784,-.22],[sign*.956,.817,-.16],[sign*.956,.817,.16],[sign*.88,.784,.22],[sign*.72,.779,.18]],.032,M.silver,24);
     let grip=ell(g,sign*.961,.821,0,.055,.052,.193,M.dark);ell(g,sign*.739,.78,.18,.042,.045,.043,M.silver);
   }
   let inset=lathe(g,[[0,.451],[.65,.451],[.662,.465],[.65,.48],[0,.48]],M.aged,64);
   let lid=group(g,0,.974,0);
   const topAt=r=>.035+.338*Math.max(0,1-(r/.765)**2)**.28;
   let pr=[];for(let i=0;i<=32;i++){let a=i/32*Math.PI*.5;pr.push([Math.cos(a)*.765,Math.sin(a)**.56*.338+.035])}
   lathe(lid,pr,M.glass,72);ring(lid,.757,.032,.032,M.silver);ring(lid,.735,.013,.076,M.steel);
   let fogTex=new T.DataTexture(new Uint8Array(H*H*4),H,H,T.RGBAFormat);fogTex.magFilter=T.LinearFilter;fogTex.minFilter=T.LinearFilter;fogTex.needsUpdate=true;
   let fmat=mat(0xe6e9d9,.40,0,{transparent:true,alphaMap:fogTex,opacity:.72,depthWrite:false,side:T.DoubleSide});
   let fog=lathe(lid,pr.map(v=>[v[0]*1.002,v[1]+.003]),fmat,64);
   let p=fog.geometry.attributes.position,uv=fog.geometry.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/1.53+.5,p.getZ(i)/1.53+.5);
   lathe(lid,[[0,.363],[.124,.363],[.135,.381],[.122,.401],[.060,.409],[.055,.445],[.11,.458]],M.aged,48);
   lathe(lid,[[.048,.43],[.106,.445],[.135,.47],[.137,.508],[.11,.542],[.065,.554],[0,.555]],M.dark,48);
   const bead=new T.InstancedMesh(new T.SphereGeometry(1,8,6),mat(0xe0e6d8,.09,.39,{transparent:true,opacity:.72}),H*H);lid.add(bead);bead.frustumCulled=false;
   return {g,lid,fogTex,bead,topAt};
 }
 function updateGlass(pot,s){
   let data=pot.fogTex.image.data;const tmp=new T.Object3D();
   for(let i=0;i<H*H;i++){let fog=clamp(s.fog[i]),a=i*4;
     data[a]=data[a+1]=data[a+2]=Math.round(fog*255);data[a+3]=255;
     let x=((i%H+.23*Math.sin(i*7.12))/(H-1)*2-1)*.75,z=((Math.floor(i/H)+.26*Math.cos(i*4.73))/(H-1)*2-1)*.75,r=Math.hypot(x,z);
     let q=r>.736?0:Math.min(.037,Math.sqrt(s.beads[i])*.062);
     tmp.position.set(x,pot.topAt(r)+.009,z);tmp.scale.set(q,q*.57,q*1.12);tmp.updateMatrix();pot.bead.setMatrixAt(i,tmp.matrix)}
   pot.bead.instanceMatrix.needsUpdate=true;pot.fogTex.needsUpdate=true;
 }
 function iceBath(scene){
   let g=group(scene,-4.15,-.123,-.41);
   lathe(g,[[0,.016],[.59,.016],[.67,.054],[.756,.169],[.867,.384],[.907,.477],[.932,.49],[.935,.522],[.911,.539],[.88,.518],[.856,.433],[.733,.197],[.646,.089],[0,.086]],M.china,88);
   ring(g,.926,.018,.514,M.green);ring(g,.902,.009,.47,M.sage);
   let water=lathe(g,[[0,.35],[.834,.35],[.846,.37],[.823,.373],[0,.37]],mat(0x98b1aa,.10,.13,{transparent:true,opacity:.8}),72);
   let cubes=[],ice=mat(0xd4e6df,.17,.07,{transparent:true,opacity:.82});for(let i=0;i<11;i++){
     let a=i/11*TAU,o=round(g,.69*Math.cos(a),.386,.69*Math.sin(a),.17,.151,.182,.046,ice);o.rotation.set(rand()*.4,rand()*2,rand()*.2);cubes.push(o)}
   return {g,cubes,water};
 }
 function dish(scene){
   let g=group(scene);lathe(g,[[0,.003],[.35,.003],[.376,.018],[.361,.054],[.306,.069],[.258,.091],[.31,.107],[.54,.118],[.78,.149],[.934,.198],[.970,.219],[.972,.240],[.956,.253],[.89,.238],[.77,.202],[.61,.181],[.43,.174],[0,.174]],M.silver,100);
   ring(g,.96,.009,.247,M.brass);ring(g,.882,.006,.23,M.silver);ring(g,.365,.011,.027,M.silver);
   for(let side of [-1,1]){tube(g,[[side*.921,.215,-.19],[side*1.05,.224,-.19],[side*1.129,.247,-.10],[side*1.142,.251,0],[side*1.129,.247,.10],[side*1.05,.224,.19],[side*.921,.215,.19]],.025,M.silver,22);
     ell(g,side*1.14,.25,0,.038,.032,.093,M.aged)}
   batch(g);return g;
 }
 function sweet(scene){
   let g=group(scene);
   let profile=[[0,.005,0],[.55,.005,.67],[.584,.015,.85],[.598,.04,.94],[.594,.080,1],[.58,.17,1],[.55,.31,1],[.518,.44,1],[.487,.56,1],[.465,.631,.88],[.444,.653,.74],[.410,.667,.52],[.352,.671,.27],[.16,.671,0],[0,.671,0]];
   let body=lathe(g,profile,M.custard,96,.037,12);let bodyBase=body.geometry.attributes.position.array.slice();
   let cap=lathe(g,[[.478,.573,.99],[.475,.61,.90],[.459,.643,.85],[.440,.663,.74],[.397,.675,.52],[.35,.678,.27],[.18,.678,0],[0,.678,0]],M.sauce,96,.036,12);
   let capBase=cap.geometry.attributes.position.array.slice();
   let puddle=lathe(g,[[0,.004],[.575,.005],[.603,.008],[.615,.012],[.602,.017],[.572,.019],[0,.016]],M.honey,96,.006,12);
   let trace=lathe(g,[[.57,.002],[.59,.004],[.64,.005],[.65,.006],[.64,.007],[.57,.008]],mat(0xba721f,.23,.12,{transparent:true,opacity:.69}),96,.006,12);
   let stream=lathe(g,[[.48,.60],[.48,.59],[.48,.58],[.47,.57]],M.sauce,96,.038,12);
   return {g,body,bodyBase,cap,capBase,puddle,trace,stream};
 }
 function updateSweet(k,s){
   k.body.position.y=k.cap.position.y=k.stream.position.y=s.custardLiftMm*.01;
   for(let [o,original] of [[k.body,k.bodyBase],[k.cap,k.capBase]]){
     let p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){let j=i*3,x=original[j],y=original[j+1],z=original[j+2],a=Math.atan2(z,x),si=Math.round(a/TAU*N+N)%N,deform=s.jig[si]*.01;
       p.setXYZ(i,x+Math.cos(a)*deform*(.1+y),y+deform*.30*(y/.68),z+Math.sin(a)*deform*(.1+y))}
     p.needsUpdate=true;o.geometry.computeVertexNormals()}
   let str=k.stream.geometry.attributes.position,pl=k.puddle.geometry.attributes.position,tr=k.trace.geometry.attributes.position;
   for(let a=0;a<=96;a++){let ang=a/96*TAU,si=Math.floor(a/3)%N,sj=(si+1)%N,fr=(a%3)/3,sample=ar=>ar[si]*(1-fr)+ar[sj]*fr,
     len=Math.min(.585,sample(s.frontMm)*.0098+.024),fil=.038*Math.cos(ang*12),def=sample(s.jig)*.01;
     for(let r=0;r<4;r++){let y=.616-len*(1-r/3),rad=.466+(.633-y)*.215+fil+def*(.1+y);str.setXYZ(r*97+a,Math.cos(ang)*rad,y,Math.sin(ang)*rad)}
     let spread=Math.min(.32,sample(s.pool)*3.6)+.040*clamp(s.lift*5)*(.55+.45*Math.sin(ang)),mark=Math.min(.34,sample(s.trail)*4.6);
     for(let r=0;r<7;r++){let rad=[0,.54,.574+spread,.595+spread,.582+spread,.554,0][r]+(r>0&&r<6?.006*Math.cos(ang*7):0);pl.setXYZ(r*97+a,rad*Math.cos(ang),[.004,.006,.008,.012,.017,.019,.016][r],rad*Math.sin(ang))}
     for(let r=0;r<6;r++){let rad=[.55,.59,.613+mark,.632+mark,.61+mark,.55][r];tr.setXYZ(r*97+a,Math.cos(ang)*rad,.002+r*.0006,Math.sin(ang)*rad)}
   }for(let o of [k.stream,k.trace,k.puddle]){o.geometry.attributes.position.needsUpdate=true;o.geometry.computeVertexNormals()}
 }
 function spoon(scene){
   let g=group(scene);let bowl=lathe(g,[[0,.008],[.095,.018],[.143,.047],[.16,.079],[.159,.091],[.147,.087],[.097,.039],[0,.024]],M.silver,46);bowl.scale.z=1.46;
   tube(g,[[0,.079,.172],[0,.057,.33],[.002,.047,.56],[.006,.035,.77],[.009,.032,.91]],.027,M.silver,24);
   ell(g,.01,.034,.856,.062,.024,.19,M.silver);ell(g,.011,.055,.881,.036,.007,.116,M.aged);batch(g);return g;
 }
 return {makeJug,makeMold,surface,makePot,updateGlass,iceBath,dish,sweet,updateSweet,spoon};
})();
