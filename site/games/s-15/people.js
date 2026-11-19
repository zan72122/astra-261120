'use strict';
const People=(()=>{
 const {T,V,TAU,mat,M,group,mesh,ell,ring,lathe,tube,beam,batch}=Craft;
 function finger(p,points,r,m){
   let c=new T.CatmullRomCurve3(points.map(a=>V(...a))),pos=[],idx=[],uv=[];
   for(let j=0;j<=11;j++){let t=j/11,v=c.getPoint(t),d=c.getTangent(t),e=V(1,0,0).cross(d).normalize(),b=d.clone().cross(e),rr=r*(1-.26*t)*Math.min(1,Math.sqrt((1-t)*8));
     for(let k=0;k<=10;k++){let a=k/10*TAU,n=v.clone().addScaledVector(e,Math.cos(a)*rr).addScaledVector(b,Math.sin(a)*rr);pos.push(n.x,n.y,n.z);uv.push(k/10,t);
       if(j&&k){let i=j*11+k;idx.push(i-12,i-11,i-1,i-11,i,i-1)}}}
   let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();mesh(p,g,m)}
 function customer(scene,sign){
   let g=group(scene,sign*.51,.345,-3.43),p=group(g);p.rotation.y=sign*-.27;
   ell(p,0,-.065,-.38,.162,.106,.38,M.sage);
   ell(p,0,-.008,-.172,.142,.085,.215,M.skin);
   ell(p,0,.014,.03,.164,.070,.205,M.skin);
   for(let i=0;i<4;i++){let x=sign*(i-1.45)*.068,len=[.218,.243,.222,.172][i];
     finger(p,[[x,.004,.157],[x*1.06,.024,.22],[x*1.16,.021+len*.20,.19+len*.69],[x*1.22,.037+len*.18,.17+len]],.039,M.skin)}
   finger(p,[[-sign*.104,.006,-.03],[-sign*.17,.02,.01],[-sign*.228,.079,.105],[-sign*.237,.088,.165]],.048,M.skin);
   batch(g);return g;
 }
 function mama(scene){
   let body=group(scene,3.08,-.12,-2.08),apron=mat(0x6b796a,.91),blouse=mat(0xe7d8c3,.90),hair=mat(0x4b382f,.76);
   let dress=lathe(body,[[.51,-.58],[.57,-.45],[.50,.16],[.436,.73],[.445,1.10],[.543,1.41],[.61,1.66],[.58,1.86],[.42,1.99],[.25,2.07],[.216,2.11]],blouse,48);dress.scale.set(1,.99,.73);
   let skirt=lathe(body,[[.595,-.55],[.59,-.19],[.529,.45],[.45,.96],[.451,1.05]],apron,48,.009,8);skirt.scale.z=.78;
   let bib=ell(body,0,1.24,.284,.39,.587,.075,apron);
   for(let a of [-1,1]){tube(body,[[a*.278,1.43,.325],[a*.280,1.67,.313],[a*.32,1.86,.21],[a*.33,1.98,.015],[a*.31,1.90,-.25]],.046,apron,18);ell(body,a*.28,1.51,.351,.028,.028,.012,M.aged)}
   ell(body,0,.85,.35,.236,.136,.032,apron);tube(body,[[-.216,.906,.373],[0,.888,.396],[.216,.906,.373]],.008,M.cream,14);
   ell(body,0,2.10,0,.170,.235,.17,M.skin);
   let head=group(body,0,2.425,.035);head.rotation.set(.20,-.38,.02);
   ell(head,0,.02,0,.281,.36,.257,M.skin);
   ell(head,0,.143,-.045,.294,.301,.259,hair);ell(head,-.026,.204,-.242,.19,.18,.177,hair);
   // Swept fringe and a knotted café kerchief.
   let fringe=ell(head,-.113,.17,.163,.175,.125,.081,hair);fringe.rotation.z=-.34;
   ell(head,.17,.14,.141,.102,.144,.085,hair);tube(head,[[-.273,.103,-.04],[-.226,.302,.072],[0,.378,.060],[.209,.305,.047],[.279,.106,-.036]],.032,M.wine,20);
   ell(head,0,-.094,.247,.060,.045,.048,M.skin);
   for(let a of [-1,1]){tube(head,[[a*.056,-.046,.246],[a*.097,-.055,.240],[a*.137,-.048,.222]],.008,hair,6)}
   tube(head,[[-.048,-.174,.211],[.004,-.181,.220],[.047,-.172,.211]],.006,M.line,7);
   batch(body);
   const restArm=group(body,.47,1.54,.075);ell(restArm,.066,-.137,0,.219,.375,.183,blouse);ell(restArm,.13,-.49,.05,.141,.243,.143,M.skin);ell(restArm,.124,-.727,.081,.122,.166,.095,M.skin);
   let mitt=group(scene),mit=mat(0xa75d50,.83),binding=mat(0xe3cba8,.83),thread=mat(0xc88e74,.89);
   ell(mitt,0,.02,0,.164,.115,.225,mit);ell(mitt,-.122,.025,.057,.091,.08,.128,mit);
   ell(mitt,0,.004,-.146,.157,.113,.082,binding);
   for(let z of [-.08,.018,.111])tube(mitt,[[-.136,.058,z-.041],[-.073,.115,z-.018],[.017,.131,z+.013],[.115,.084,z+.06]],.005,thread,10);
   batch(mitt);
   const sleeve=ell(scene,0,0,0,1,1,1,blouse),fore=ell(scene,0,0,0,1,1,1,M.skin),cuff=ell(scene,0,0,0,1,1,1,blouse);
   function link(o,a,b,r){let diff=b.clone().sub(a);o.position.copy(a).lerp(b,.5);o.quaternion.setFromUnitVectors(V(0,1,0),diff.clone().normalize());o.scale.set(r,diff.length()*.55,r*.94)}
   function pose(x,hand){
     body.position.x=x;body.rotation.y=-.26;body.updateWorldMatrix(true,false);
     let shoulder=V(-.43,1.79,.02).applyMatrix4(body.matrixWorld),wrist=hand.clone().add(V(.09,.035,-.167));
     let d=wrist.clone().sub(shoulder),dist=d.length(),e=V(.48,-.67,-.5);d.normalize();e.addScaledVector(d,-e.dot(d)).normalize();
     let elbow=shoulder.clone().lerp(wrist,.51).addScaledVector(e,Math.sqrt(Math.max(.04,.88*.88-(dist*.49)**2)));
     link(sleeve,shoulder,elbow,.214);link(fore,elbow,wrist,.123);let end=elbow.clone().lerp(wrist,.27);link(cuff,elbow.clone().lerp(shoulder,.20),end,.175);
     mitt.position.copy(hand);mitt.rotation.set(-.22,-.52,-.19);
   }
   return {body,mitt,pose}
 }
 // A pale fabric demonstration glove traces a real gesture just above the active tool.
 function hint(scene){
   const g=group(scene),m=mat(0xfff0d7,.8,0,{transparent:true,opacity:0,depthWrite:false}),stitch=mat(0xb99a77,.76,0,{transparent:true,opacity:0,depthWrite:false});
   let palm=ell(g,.062,.098,.00,.105,.13,.051,m);palm.rotation.z=.28;
   finger(g,[[.011,.121,0],[-.027,.168,0],[-.064,.211,-.003],[-.089,.255,0]],.033,m);
   for(let i=0;i<3;i++){let x=.045+i*.045;finger(g,[[x,.157,.006],[x-.009,.207,.005],[x-.023,.213,.022],[x-.027,.17,.048]],.029,m)}
   finger(g,[[-.016,.052,.013],[-.055,.061,.019],[-.080,.097,.016]],.041,m);
   let cuff=ell(g,.11,-.025,0,.08,.044,.059,stitch);cuff.rotation.z=.40;
   g.rotation.z=-2.87;g.renderOrder=5;
   return {g,m,stitch};
 }
 return {mama,customer,hint};
})();
