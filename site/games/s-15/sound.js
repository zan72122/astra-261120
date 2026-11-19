'use strict';
function makeAudio(){
 let ctx=null,out,noise,run,stream,rumble,muted=false;
 function unlock(){if(!ctx){
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();
   out=ctx.createGain();out.gain.value=muted?0:.54;out.connect(ctx.destination);
   const buf=ctx.createBuffer(1,ctx.sampleRate*1.4,ctx.sampleRate),a=buf.getChannelData(0);let brown=0;
   for(let i=0;i<a.length;i++){brown=(brown+.07*(Math.random()*2-1))/1.065;a[i]=brown*1.8+(Math.random()*2-1)*.25}
   noise=buf;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();src.buffer=buf;src.loop=true;filter.type='bandpass';filter.frequency.value=1150;filter.Q.value=.48;
   run=ctx.createGain();run.gain.value=.00001;src.connect(filter).connect(run).connect(out);src.start();
   stream=ctx.createOscillator();stream.frequency.value=71;rumble=ctx.createGain();rumble.gain.value=.00001;stream.connect(rumble).connect(out);stream.start();
 }if(ctx.state==='suspended')ctx.resume().catch(()=>{})}
 function tone(f,to,duration,amp,shape='sine',delay=0,attack=.006){
   if(!ctx||muted)return;const t=ctx.currentTime+delay,o=ctx.createOscillator(),v=ctx.createGain();
   o.type=shape;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(24,to),t+duration);
   v.gain.setValueAtTime(.00001,t);v.gain.exponentialRampToValueAtTime(Math.max(.00002,amp),t+attack);v.gain.exponentialRampToValueAtTime(.00001,t+duration);
   o.connect(v).connect(out);o.start(t);o.stop(t+duration+.005);o.onended=()=>{o.disconnect();v.disconnect()}
 }
 function brush(freq,amp,seconds){if(!ctx||muted)return;let t=ctx.currentTime,o=ctx.createBufferSource(),f=ctx.createBiquadFilter(),v=ctx.createGain();
   o.buffer=noise;f.type='bandpass';f.frequency.value=freq;f.Q.value=1.3;v.gain.setValueAtTime(.00001,t);v.gain.exponentialRampToValueAtTime(amp,t+.012);v.gain.exponentialRampToValueAtTime(.00001,t+seconds);
   o.connect(f).connect(v).connect(out);o.start(t,Math.random()*.65);o.stop(t+seconds+.01);o.onended=()=>{o.disconnect();v.disconnect();f.disconnect()}}
 function update(s,events){if(!ctx||muted)return;
   run.gain.setTargetAtTime(.0024+s.flux*.0021,ctx.currentTime,.063);
   rumble.gain.setTargetAtTime(.0013+s.bubbleEnergy*.0058,ctx.currentTime,.15);
   for(const e of events){const v=e.value;
     if(e.type==='bubble'){const f=83+v*34;tone(f,f*.67,.145,.035+v*.024);tone(f*1.49,f*.89,.095,.028,'sine',.128);brush(220,.035,.11)}
     if(e.type==='drop'){let f=528-s.volume*.82+v*37;tone(f*.50,f,.078,.102);tone(f*1.9,f*1.24,.16,.041,'sine',.017);brush(1450,.044,.075)}
     if(e.type==='pop'){tone(144,68,.25,.23);tone(480,241,.155,.10,'sine',.023);brush(500,.16,.087)}
     if(e.type==='clink'){for(let [f,a,d] of [[1534,.16,1.4],[3625,.057,.73],[5772,.018,.30],[914,.018,.51]])tone(f,f*.999,d,a);brush(4500,.05,.037)}
     if(e.type==='load'||e.type==='cover')tone(758,746,.26,.054);
     if(e.type==='chill')brush(1370,.15,.74);
   }
 }
 return {unlock,update,brush,visibility(hidden){if(ctx){const change=hidden?ctx.suspend():ctx.resume();change.catch(()=>{})}},toggle(){muted=!muted;unlock();if(out)out.gain.setTargetAtTime(muted?0:.54,ctx.currentTime,.045);return muted}};
}
