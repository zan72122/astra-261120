'use strict';
const Craft=(()=>{
 const T=THREE;
 let seed=193019;
 function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 const noise= `
 float hash31(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float grainNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+1.),f.x),f.y),f.z);}
 float grains(vec3 p){return .59*grainNoise(p)+.28*grainNoise(p*2.09)+.13*grainNoise(p*4.19);}
 `;
 const patterns={
 wood:`vec3 p=vCraft+vec3(wo,0.,wo*.387);
 float sw=grainNoise(vec3(p.x*.29,p.y*.5,p.z*.85));
 float grain=grains(vec3(p.x*.48,p.y*19.,p.z*25.+sw*3.1));
 float ring=sin((p.z+p.y*.55)*29.+sw*7.+grainNoise(p*1.3)*1.5);
 float fiber=grainNoise(vec3(p.x*1.3,p.y*68.,p.z*110.+sw*7.));
 diffuseColor.rgb*=.80+.32*grain+.11*ring+.13*fiber;
 diffuseColor.rgb*=1.-.17*smoothstep(.66,.85,fiber)*smoothstep(.45,.85,grain);
 `,
 clay:`float mott=grains(vCraft*8.+wo);float fleck=smoothstep(.68,.85,grainNoise(vCraft*143.));diffuseColor.rgb*=.84+.28*mott-.17*fleck;`,
 copper:`float hammer=grains(vCraft*13.+wo);diffuseColor.rgb*=.71+.49*hammer+grainNoise(vCraft*75.)*.12;`,
 cloth:`vec2 weave=vCraft.xy+vCraft.zy*.73;diffuseColor.rgb*=.90+.09*grainNoise(vCraft*65.)+.024*(sin(weave.x*390.)+cos(weave.y*335.));`,
 leaf:`float fleck=grains(vec3(vCraft.x*6.,vCraft.z*22.,vCraft.y));diffuseColor.rgb*=.78+.36*fleck;`,
 dough:`vec3 n=normalize(vCraft);vec3 p=n+vec3(wo*.79,wo*.23,wo*.57);
 float fleck=grains(p*8.1), fine=grainNoise(p*71.);
 float grill=grains(p*2.65)+.16*(fleck-.45)+.06*n.y;
 float toast=smoothstep(.48,.68,grill),charred=smoothstep(.615,.75,grill+.07*fleck);
 vec3 rice=mix(vec3(.89,.74,.50),vec3(.99,.91,.71),.5+.44*n.y);
 rice=mix(rice,vec3(.54,.245,.071),toast*.82);
 rice=mix(rice,vec3(.125,.052,.021),charred*.91);
 float film=clamp(coating*.32 + reserve*.85*pow(abs(n.x),3.),0.,.94);
 float edge=smoothstep(-.3,.14,film*.99-n.y*.42+fleck*.15);
 vec3 glaze=mix(vec3(.49,.165,.026),vec3(.19,.043,.008),clamp(reserve*.5+.25*(1.-n.y),0.,1.));
 diffuseColor.rgb=mix(rice,glaze,film*edge)*(.95+.08*fine);
 `,
 skin:`diffuseColor.rgb*=.94+.095*grains(vCraft*42.+wo);`
 };
 function mat(color,roughness=.6,kind='',extras={}){
   const m=new T.MeshStandardMaterial({color,roughness,metalness:0,...extras});
   const u={wo:{value:rand()*21},coating:{value:0},reserve:{value:0}};
   m.userData.u=u;
   m.onBeforeCompile=s=>{
     Object.assign(s.uniforms,u);
     s.vertexShader='varying vec3 vCraft;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCraft=position;');
     s.fragmentShader='varying vec3 vCraft; uniform float wo;uniform float coating;uniform float reserve;\n'+noise+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+(patterns[kind]||'')).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+.045*(grainNoise(vCraft*39.+wo)-.5),.055,1.);'+(kind==='dough'?'roughnessFactor=mix(roughnessFactor,.13,clamp(coating*.38,0.,1.));':''));
     const height={dough:'(fine*.0016+fleck*.006)*(1.-clamp(coating*.28,0.,.86))',wood:'grain*.0022+fiber*.00052',clay:'mott*.0021',copper:'hammer*.0065'}[kind];
     if(height){
       s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
       float craftHeight=${height};
       vec3 px=dFdx(-vViewPosition),py=dFdy(-vViewPosition);
       vec3 rx=cross(py,normal),ry=cross(normal,px);
       float detCraft=dot(px,rx);
       normal=normalize(max(.00000001,abs(detCraft))*normal-sign(detCraft)*(dFdx(craftHeight)*rx+dFdy(craftHeight)*ry));`);
     }
   };m.customProgramCacheKey=()=>kind;return m;
 }
 function canvas(w,h){let c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 function texture(c){let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
 function crest(ctx,x,y,r){
   ctx.save();ctx.translate(x,y);ctx.scale(r,r);ctx.fillStyle='#e5dcc1';ctx.strokeStyle='#e5dcc1';ctx.lineWidth=.048;
   ctx.beginPath();ctx.arc(0,0,.94,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,.855,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*.4);ctx.beginPath();ctx.moveTo(0,-.13);ctx.bezierCurveTo(-.40,-.39,-.30,-.77,-.035,-.70);ctx.quadraticCurveTo(0,-.60,.035,-.70);ctx.bezierCurveTo(.30,-.77,.40,-.39,0,-.13);ctx.fill();ctx.restore();}
   ctx.beginPath();ctx.arc(0,0,.098,0,2*Math.PI);ctx.fill();ctx.restore();
 }
 function fabric(emblem,base='#394e50'){
   const c=canvas(256,320),ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,320);
   for(let i=0;i<256;i++){ctx.fillStyle='rgba(244,227,199,'+(.012+rand()*.06)+')';ctx.fillRect(i,0,1,320);}
   if(emblem)crest(ctx,128,184,61);
   ctx.strokeStyle='#c3bca489';ctx.lineWidth=1;ctx.setLineDash([4,4]);for(const y of [298,303]){ctx.beginPath();ctx.moveTo(6,y);ctx.lineTo(250,y);ctx.stroke();}
   return texture(c);
 }
 function environment(scene,renderer){
   const face=(side)=>{
     let c=canvas(96,96),g=c.getContext('2d'),grad=g.createLinearGradient(0,0,0,96);
     grad.addColorStop(0,'#bdbeb6');grad.addColorStop(.48,'#b3a18c');grad.addColorStop(.54,'#97806b');grad.addColorStop(1,'#88715b');g.fillStyle=grad;g.fillRect(0,0,96,96);
     if([1,5,2].includes(side)){
       g.fillStyle='#dce4e4';g.fillRect(3,1,83,57);g.fillStyle='#fff7df';g.fillRect(3,14,83,34);g.fillStyle='#625c51';
       for(let x of [3,31,59,85])g.fillRect(x,1,3,57);g.fillRect(2,31,85,2);
     }return c;
   };
   const tex=new T.CubeTexture(Array.from({length:6},(_,i)=>face(i)));tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;scene.environment=tex;scene.environmentIntensity=.43;
 }
 return {mat,rand,noise,canvas,texture,crest,fabric,environment};
})();
