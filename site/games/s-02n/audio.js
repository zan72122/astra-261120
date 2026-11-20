'use strict';
const Sound=(()=>{
let ctx,master,noise,steam,stream,muted=false,nextBubble=0,nextPour=0;
function unlock(){
  try{
    if(!ctx){
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      master=ctx.createGain();master.gain.value=muted?0:.46;master.connect(ctx.destination);
      noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
      const samples=noise.getChannelData(0);let pink=0;
      for(let i=0;i<samples.length;i++){pink=.76*pink+.24*(Math.random()*2-1);samples[i]=pink}
      function loop(hz,q){const source=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
        source.buffer=noise;source.loop=true;f.type='bandpass';f.frequency.value=hz;f.Q.value=q;
        g.gain.value=0;source.connect(f).connect(g).connect(master);source.start();return g}
      steam=loop(2300,.7);stream=loop(730,.64)
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{})
  }catch{}
}
function mute(){muted=!muted;unlock();if(master)master.gain.setTargetAtTime(muted?0:.46,ctx.currentTime,.065);return muted}
function note(freq,time,len,gain,type='sine',end=freq){
  if(!ctx||muted)return;
  const o=ctx.createOscillator(),e=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),time+len);
  e.gain.setValueAtTime(.00001,time);e.gain.exponentialRampToValueAtTime(gain,time+.006);e.gain.exponentialRampToValueAtTime(.00001,time+len);
  o.connect(e).connect(master);o.start(time);o.stop(time+len+.012);o.onended=()=>{o.disconnect();e.disconnect()}
}
function brush(freq,length,volume){
  if(!ctx||muted)return;const t=ctx.currentTime,source=ctx.createBufferSource(),f=ctx.createBiquadFilter(),e=ctx.createGain();source.buffer=noise;f.type='bandpass';f.Q.value=1.1;f.frequency.value=freq;
  e.gain.setValueAtTime(volume,t);e.gain.exponentialRampToValueAtTime(.0001,t+length);source.connect(f).connect(e).connect(master);source.start(t,Math.random());source.stop(t+length);source.onended=()=>{source.disconnect();f.disconnect();e.disconnect()}
}
function touch(kind){
  if(!ctx||muted)return;const t=ctx.currentTime;
  if(kind==='paper'||kind==='cup'||kind==='spread')brush(3600,.15,.20);
  else if(kind==='bamboo'||kind==='lid'||kind==='basket'){note(363,t,.108,.095,'sine',271);note(682,t+.012,.066,.025)}
  else if(kind==='tea'||kind==='china'||kind==='jug'){note(1093,t,.23,.037);note(2018,t,.14,.014)}
  else if(kind==='knob'||kind==='tick'||kind==='stick')note(794,t,.057,.044,'triangle',487);
  else {note(184,t,.094,.073,'sine',138);brush(950,.09,.068)}
}
function update(s){
  if(!ctx){s.events.length=0;return}const t=ctx.currentTime,near=s.mode==='tea'?.17:1;
  steam.gain.setTargetAtTime(near*(.014+.068*s.boil),t,.18);stream.gain.setTargetAtTime(s.flow*.16,t,.052);
  if(!muted&&t>nextBubble){
    note(220+Math.random()*210,t,.061,.011+.025*s.boil,'sine',560+Math.random()*270);
    nextBubble=t+(.24+Math.random()*.95)/(near*(.64+s.boil*2.6))
  }
  if(!muted&&s.flow>.02&&t>nextPour){note(343+Math.random()*120,t,.061,.028*s.flow,'sine',175);nextPour=t+.064+Math.random()*.09}
  while(s.events.length)touch(s.events.shift())
}
return {unlock,mute,touch,update}
})();
