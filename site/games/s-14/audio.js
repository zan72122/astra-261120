'use strict';
function kitchenSound(){
 let ctx,master,noise,filter,enabled=true,lastPaper=0,seed=39,ph=0;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 function unlock(){
  if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   ctx=new AC();master=ctx.createGain();master.gain.value=enabled?.68:0;master.connect(ctx.destination);
   noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*1.9),ctx.sampleRate);const d=noise.getChannelData(0);
   let old=0;for(let i=0;i<d.length;i++){const white=random()*2-1;old=old*.47+white*.53;d[i]=white*.41+old*.59;}
   filter={};for(const [key,f,q] of [['rub',890,.76],['knife',2900,.75],['paper',4200,1.2]]){
    const src=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),amp=ctx.createGain();
    src.buffer=noise;src.loop=true;bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;amp.gain.value=0;
    src.connect(bp);bp.connect(amp);amp.connect(master);src.start(0,random());filter[key]={amp,bp};
   }
  }
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
 }
 function burst(hz,vol,dur,tonal=false){
  if(!ctx||!enabled)return;const now=ctx.currentTime,a=ctx.createGain(),b=ctx.createBiquadFilter();b.type='bandpass';b.frequency.value=hz;b.Q.value=.85;
  let src;if(tonal){src=ctx.createOscillator();src.type='sine';src.frequency.setValueAtTime(hz,now);src.frequency.exponentialRampToValueAtTime(hz*.6,now+dur);}
  else{src=ctx.createBufferSource();src.buffer=noise;}
  a.gain.setValueAtTime(.0001,now);a.gain.exponentialRampToValueAtTime(Math.max(.001,vol),now+.004);a.gain.exponentialRampToValueAtTime(.0001,now+dur);
  src.connect(b);b.connect(a);a.connect(master);src.onended=()=>{src.disconnect();a.disconnect();b.disconnect();};src.start(now,tonal?0:random()*.5);src.stop(now+dur+.01);
 }
 function update(st,dt){
  if(!ctx||ctx.state!=='running')return;
  for(const [key,max,hz] of [['rub',.19,660],['paper',.34,2300],['knife',.53,1750]]){
   const v=Math.max(0,st.voices[key]);filter[key].amp.gain.setTargetAtTime(v*max,ctx.currentTime,.023);
   filter[key].bp.frequency.setTargetAtTime(hz*(1+Math.min(1.4,v)*1.5+st.tool.flex*3),ctx.currentTime,.041);
  }
  ph+=dt*(5+st.voices.paper*41);
  if(st.voices.paper>.03&&ph>1){ph%=1;burst(1600+random()*3700,.052+st.voices.paper*.25,.015+random()*.045);}
  if(lastPaper<.04&&st.voices.paper>.12)burst(2450,.19,.1);
  lastPaper=st.voices.paper;
 }
 return {unlock,update,burst,toggle(){enabled=!enabled;unlock();if(master)master.gain.setTargetAtTime(enabled?.68:0,ctx.currentTime,.04);return enabled;}};
}
